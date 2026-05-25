---
id: ADR-0003
title: 選擇 LangChain 作為 LLM 整合框架
tier: 1
status: accepted
date: 2026-02-17
deciders: [技術負責人, 開發團隊]
---

# ADR-003: 選擇 LangChain 作為 LLM 整合框架

> **ADR 狀態更新（2026-04-21）**
> 實際 V1.0 實作已從 LangChain chains 演進為 **LangGraph `create_react_agent`** + **LiteLLM**（多 LLM provider 抽象層）。
> 核心差異：不使用 LangChain LCEL chains，改用 LangGraph 圖狀態機 + ReAct 迴圈。
> LLM 供應商透過 LiteLLM 統一介面切換（目前使用 `vertex_ai/gemini-2.5-pro`）。

**狀態:** 已接受 (Accepted)
**決策者:** 技術負責人, 開發團隊
**日期:** 2026-02-17

---

## 1. 背景與問題陳述

本平台的三層 AI 解析引擎是整體產品的核心差異化能力，其運作流程如下：

```
使用者訊息 (LINE)
    |
    v
[意圖識別] -- 判斷是閒聊、故障報修、進度查詢、還是其他
    |
    v
[資訊萃取] -- 從對話中提取結構化欄位填入 ProblemCard
    |         （鎖型型號、故障症狀、錯誤代碼、發生時間等）
    v
[第一層：案例庫向量搜尋] -- similarity >= 0.75 → 直接回覆解決方案
    |
    v (similarity < 0.75)
[第二層：PDF RAG] -- 檢索電子鎖手冊 → 生成基於文件的回答
    |
    v (仍無法解決)
[第三層：人工轉接] -- 建立工單，通知客服人員
    |
    v
[回應生成] -- 將 AI 判斷結果轉為自然語言回覆使用者
```

此外，平台還有以下 AI 相關需求：

- **SOP 自動生成：** 當人工客服成功解決一個新案例後，AI 自動將對話記錄整理為結構化 SOP，加入知識庫。
- **圖片分析：** 使用者傳送電子鎖照片（故障畫面、錯誤代碼顯示），需要進行 Vision 分析。
- **多輪對話管理：** ProblemCard 欄位逐步蒐集，需要管理對話狀態與上下文。

**核心問題：** 如何有效地編排（orchestrate）這些多步驟 AI pipeline，同時保持程式碼的可維護性與可測試性？

## 2. 考量的選項

### 選項一: LangChain

- **概述：** 最成熟的 LLM 應用開發框架，提供 Chain、Agent、Tool、Memory 等抽象層。
- **優點：**
  - **成熟的 Chain 抽象：** LCEL (LangChain Expression Language) 提供宣告式的 pipeline 組合語法，適合表達「意圖識別 -> 資訊萃取 -> 案例搜尋 -> RAG -> 回應生成」的多步驟流程。
  - **豐富的 Document Loader 生態系：** 內建支援 PDF（PyPDFLoader, UnstructuredPDFLoader）、Word、Excel 等格式的文件載入，直接適用於電子鎖維修手冊的處理。
  - **完善的 Vector Store 整合：** 原生支援 pgvector（透過 `PGVector` class），與 ADR-002 的資料庫選型無縫銜接。
  - **Text Splitter 工具：** RecursiveCharacterTextSplitter 等工具適合將長篇手冊分段，控制 chunk size 以最佳化 RAG 召回率。
  - **Structured Output：** 搭配 Pydantic model 的 structured output 功能，可直接將 LLM 輸出解析為 ProblemCard schema，減少後處理邏輯。
  - **LangSmith 可觀測性：** LangSmith 提供 LLM 呼叫的追蹤、延遲分析、成本統計，在生產環境中極為實用。
  - **活躍社群：** GitHub stars 90k+，問題排查資源豐富。
- **缺點：**
  - 框架抽象層較多，過度封裝可能導致除錯困難（「黑盒」問題）。
  - API 變動頻繁（尤其是 v0.1 到 v0.2 的遷移），需要持續追蹤更新。
  - 部分進階場景下，框架的抽象反而是限制，需要 escape hatch 直接呼叫底層 API。

### 選項二: LlamaIndex

- **概述：** 專注於 RAG（Retrieval-Augmented Generation）場景的框架。
- **優點：**
  - RAG pipeline 的實作更為精緻，提供多種進階 RAG 策略（Sentence Window Retrieval、Auto-Merging Retrieval 等）。
  - 索引抽象（VectorStoreIndex、TreeIndex、KeywordIndex）為文件密集型應用設計。
  - 查詢引擎（Query Engine）抽象簡潔。
- **缺點：**
  - **框架定位偏窄：** LlamaIndex 的強項集中在 RAG，但本平台的 AI pipeline 遠不止 RAG——意圖識別、ProblemCard 資訊萃取、SOP 自動生成等場景更接近 Agent/Chain 的使用模式，LlamaIndex 在這些面向的支援不如 LangChain 成熟。
  - Agent 能力較弱，不適合編排複雜的多步驟決策流程。
  - Document Loader 生態系不如 LangChain 豐富。
  - 社群規模較 LangChain 小，遇到問題時可參考的資源較少。

### 選項三: 自行實作（Custom Implementation）

- **概述：** 直接使用 Google AI Python SDK，自行建構 pipeline 邏輯。
- **優點：**
  - 完全掌控，無框架黑盒問題。
  - 最輕量，無額外依賴。
  - 可根據需求精確最佳化每個環節。
- **缺點：**
  - **開發成本高：** 需要自行實作 prompt template 管理、output parsing、retry/fallback、document chunking、vector store 整合、memory management 等基礎設施，估計增加 2-3 週開發時間。
  - **重複造輪子：** 上述功能都是已被 LangChain 驗證過的通用需求。
  - **維護負擔：** 隨著 Google AI API 更新（模型版本、API 格式），需自行維護相容層。
  - **缺乏可觀測性工具：** 需自行建構 LLM 呼叫追蹤與成本監控。

## 3. 決策

**選擇 LangChain 作為 LLM 整合框架。**

技術規格：
- **LangChain 版本：** 0.3.x（最新穩定版，基於 Pydantic v2）
- **LLM Provider：** Google Gemini 3 Pro（透過 `langchain-google-genai` 套件）
- **Vector Store 整合：** `langchain-postgres`（PGVector 整合）
- **可觀測性：** LangSmith（開發/測試環境啟用，生產環境選擇性啟用）
- **Embedding Model：** Google `text-embedding-004`（768 維）

### 關鍵設計原則

**避免過度依賴框架抽象。** 具體做法：

1. **核心業務邏輯不綁定 LangChain：** ProblemCard 的狀態管理、派工匹配邏輯、報價計算等核心業務邏輯以純 Python 實作，不使用 LangChain 抽象。
2. **LangChain 僅用於 AI pipeline 編排：** 意圖識別 Chain、資訊萃取 Chain、RAG Chain、SOP 生成 Chain 等使用 LangChain，但各 Chain 的輸入輸出介面以 Pydantic model 定義，確保可替換性。
3. **預留 escape hatch：** 每個 Chain 旁邊保留直接呼叫 Google AI SDK 的 fallback 路徑，若 LangChain 某個抽象成為瓶頸，可快速切換。

## 4. 決策的後果與影響

### 正面影響

- **開發效率提升：** 三層 AI 解析引擎的 prototype 預計可在 1-2 週內完成（自行實作需 3-5 週）。
- **PDF 手冊處理標準化：** 使用 LangChain 的 `PyPDFLoader` + `RecursiveCharacterTextSplitter` 建立標準化的手冊向量化 pipeline：
  ```python
  loader = PyPDFLoader("manual.pdf")
  splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200)
  docs = loader.load_and_split(splitter)
  ```
- **ProblemCard 結構化輸出：** 利用 LangChain 的 `with_structured_output()` 直接將 LLM 回應解析為 Pydantic ProblemCard model：
  ```python
  chain = prompt | llm.with_structured_output(ProblemCard)
  card = await chain.ainvoke({"user_message": message})
  ```
- **RAG 相似度閾值整合：** 在 Vector Store Retriever 設定 `search_kwargs={"score_threshold": 0.75}` 即可實現業務要求的相似度門檻。
- **LangSmith 追蹤：** 每次 AI 對話的完整推論鏈路可在 LangSmith dashboard 中回溯，便於除錯與效能分析。

### 負面影響與風險

- **框架版本更新風險：** LangChain 歷史上有多次 breaking change，需要持續投入時間追蹤更新。
- **過度抽象風險：** 團隊可能傾向「用 LangChain 解決一切」，導致簡單問題被過度包裝。
- **除錯複雜度：** LangChain 的 Chain 堆疊在出錯時，error stack trace 可能較長且不直觀。
- **套件依賴膨脹：** LangChain 的依賴樹較大，需注意控制 Docker image 大小。

### 風險緩解措施

| 風險 | 緩解措施 |
|------|----------|
| 框架 breaking change | 鎖定 LangChain 主版本號（`langchain>=0.3,<0.4`），設定 Dependabot 監控 |
| 過度使用框架抽象 | Code review 規範：非 AI pipeline 的業務邏輯禁止使用 LangChain 類別 |
| 除錯困難 | 啟用 LangSmith tracing；在每個 Chain 的輸入輸出加入 structured logging |
| Docker image 膨脹 | 使用 multi-stage build；僅安裝必要的 langchain 子套件（`langchain-core`, `langchain-google-genai`, `langchain-postgres`） |

## 5. 執行計畫概要

1. **依賴安裝：** 使用 Poetry 安裝核心套件：
   ```
   langchain-core >= 0.3
   langchain-google-genai >= 2.0
   langchain-postgres >= 0.0.12
   langchain-community >= 0.3 (Document Loaders)
   langsmith >= 0.1
   ```
2. **AI Pipeline 模組設計：**
   ```
   src/app/ai/
   ├── chains/
   │   ├── intent_recognition.py    # 意圖識別 Chain
   │   ├── info_extraction.py       # ProblemCard 資訊萃取 Chain
   │   ├── case_search.py           # 案例庫向量搜尋
   │   ├── rag_retrieval.py         # PDF RAG Chain
   │   ├── response_generation.py   # 回應生成 Chain
   │   └── sop_generation.py        # SOP 自動生成 Chain
   ├── prompts/
   │   ├── intent.py                # 意圖識別 Prompt Template
   │   ├── extraction.py            # 資訊萃取 Prompt Template
   │   └── response.py              # 回應生成 Prompt Template
   ├── pipeline.py                  # 三層解析引擎主流程編排
   └── config.py                    # LLM / Embedding model 設定
   ```
3. **Prompt Template 管理：** 所有 prompt 以獨立模組管理，支援版本追蹤與 A/B 測試。
4. **RAG Pipeline 建構：**
   - 建立手冊向量化批次作業（Document Loader -> Text Splitter -> Embedding -> pgvector）。
   - 建立查詢 pipeline（User Query -> Embedding -> Vector Search -> Context Assembly -> LLM Generation）。
5. **測試策略：**
   - 每個 Chain 獨立單元測試（mock LLM 回應）。
   - 整合測試使用少量真實 LLM 呼叫驗證端到端流程。
   - 建立 evaluation dataset 定期評估 RAG 召回率與答案品質。

## 6. 相關參考

- [LangChain 官方文件](https://python.langchain.com/)
- [LangChain Expression Language (LCEL)](https://python.langchain.com/docs/concepts/lcel/)
- [LangSmith 文件](https://docs.smith.langchain.com/)
- [langchain-postgres](https://github.com/langchain-ai/langchain-postgres)
- [Google Gemini 3 Pro](https://ai.google.dev/gemini-api/docs)
- ADR-001: 後端框架選型（FastAPI）
- ADR-002: 資料庫選型（PostgreSQL + pgvector）
- ADR-004: LINE Bot 對話架構設計
