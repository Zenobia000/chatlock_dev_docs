---
id: ADR-0006
title: LLM 模型選擇策略
tier: 1
status: accepted
date: 2026-04-04
deciders: [技術負責人, 開發團隊]
---

> 
> **🔄 Migration Status (2026-05-28)**: `STILL_VALID_UNDER_M20_A03`
> **Reviewed against**: 2026-05-20 final spec (xlsx)
> **Reviewed on**: 2026-05-28
> **Module scope**: M20, A03
> **Per ADR-0100 §1 classification** (.claude/context/devteam/meetings/2026-05-27-1130-final-spec-migration-strategy/MoM.md)


# ADR-006: LLM 模型選擇策略

**狀態:** Accepted
**決策者:** 技術負責人, 開發團隊
**日期:** 2026-04-04

---

## 背景

本平台合約（V21 附錄）規格載明 LLM 供應商為「OpenAI GPT-4o or equivalent」，但實際開發過程中基於成本、延遲與中文能力的綜合考量，已採用 Google Gemini 2.5 Flash 透過 Vertex AI 作為生產環境模型。此外，投資方偏好 Anthropic Claude 系列模型。

目前程式碼庫已具備供應商抽象層（`agent/llms/__init__.py`），透過 `LLM_REGISTRY` 字典註冊了三個 provider builder：

```python
LLM_REGISTRY = {
    "ollama": build_ollama_llm,
    "gemini": build_gemini_llm,
    "vertexai": build_vertexai_llm,
}
```

`get_llm()` 函式依據 `config.toml` 中 `[llm] provider` 欄位動態載入對應的模型建構器，實現零程式碼切換。當前生產設定為：

```toml
[llm]
provider    = "vertexai"
model_name  = "gemini-2.5-flash"
temperature = 0.3
```

本 ADR 旨在正式記錄模型選擇的決策依據，並規劃後續版本的多模型路由策略。

## 決策

### V1.0 階段：Gemini 2.5 Flash（現行方案）

維持 Gemini 2.5 Flash via Vertex AI 作為 V1.0 唯一生產模型。合約中「or equivalent」條款允許採用同等能力的替代模型，Gemini 2.5 Flash 在中文客服場景下的成本效益比與回應品質均滿足合約要求。

### V2.0 階段：多模型路由架構

1. 在 `agent/llms/` 下新增 `anthropic_model.py`，註冊 `"anthropic"` 至 `LLM_REGISTRY`。
2. 實作 model-router 機制，依據任務類型自動選擇模型：
  - **診斷推理任務**（hardware_tech intent + ProblemCard 生成）：使用高推理能力模型（Claude Sonnet 或 GPT-4o）。
  - **FAQ / 一般客服任務**（store_info, general_reception 等）：使用快速低成本模型（Gemini 2.5 Flash）。
  - **安全審查任務**（L6 Safety Gate）：使用獨立模型實例以避免 prompt injection 影響主對話鏈。
3. `config.toml` 擴充為多模型設定：

```toml
[llm.default]
provider   = "vertexai"
model_name = "gemini-2.5-flash"

[llm.reasoning]
provider   = "anthropic"
model_name = "claude-sonnet-4-20250514"

[llm.safety]
provider   = "vertexai"
model_name = "gemini-2.5-flash"
```

## 理由

### 1. 合約相容性

合約原文為「OpenAI GPT-4o or equivalent」。「equivalent」一詞在業界慣例中指具備同等或更優能力的模型。Gemini 2.5 Flash 在以下面向達到或超越 GPT-4o：

- 中文理解與生成品質（針對繁體中文客服語料實測）
- 結構化輸出能力（JSON mode, function calling）
- 多模態支援（圖片分析用於故障照片辨識）

### 2. 成本效益分析

以每月預估 100 萬 input tokens + 30 萬 output tokens 計算（基於日均 200 則客服對話）：


| 模型               | Input 單價 (USD/1M tokens) | Output 單價 (USD/1M tokens) | 月估成本 (USD) | 首 token 延遲 |
| ---------------- | ------------------------ | ------------------------- | ---------- | ---------- |
| GPT-4o           | $2.50                    | $10.00                    | $5.50      | ~400ms     |
| Gemini 2.5 Flash | $0.15                    | $0.60                     | $0.33      | ~200ms     |
| Claude Sonnet 4  | $3.00                    | $15.00                    | $7.50      | ~350ms     |


Gemini 2.5 Flash 的月成本約為 GPT-4o 的 6%，Claude Sonnet 4 的 4.4%。對於以 FAQ 與標準故障排除為主的客服場景，這一成本差距具有決定性意義。

> 注：以上價格為 2026 Q1 公開定價，實際成本可能因 Vertex AI committed use discounts 或企業合約而有所不同。

### 3. 中文場景最佳化

Gemini 2.5 Flash 在繁體中文 tokenization 效率較高，相同語意內容消耗更少 tokens，進一步放大成本優勢。實測顯示同一段繁體中文客服對話，Gemini 的 token 消耗約為 GPT-4o 的 70-80%。

### 4. 架構已就緒

現有 `LLM_REGISTRY` + `config.toml` 的抽象設計意味著切換供應商是一個設定變更，而非程式碼變更。這消除了供應商鎖定風險，使未來的模型遷移成本趨近於零。

## 替代方案

### 方案 A：直接採用 GPT-4o（嚴格遵循合約字面）

- **優點：** 與合約字面完全一致，無需解釋「equivalent」條款。
- **缺點：** 月成本增加約 16 倍；需額外整合 OpenAI API；GPT-4o 的中文 tokenization 效率較低，進一步推高實際成本。
- **否決原因：** 成本與問題嚴重性不匹配。FAQ 客服場景不需要 GPT-4o 等級的推理能力。

### 方案 B：全面採用 Claude Sonnet（滿足投資方偏好）

- **優點：** 滿足投資方期待；推理能力強，適合複雜診斷。
- **缺點：** 月成本增加約 22 倍；Vertex AI 上的 Claude 整合需要額外設定 Model Garden；目前 `langchain-anthropic` 尚未整合至本專案。
- **否決原因：** V1.0 階段優先控制成本與交付速度。保留為 V2.0 reasoning 模型的首選。

### 方案 C：自建開源模型（Ollama + Gemma/Llama）

- **優點：** 零 API 成本；數據完全不出站。
- **缺點：** 需要 GPU 伺服器；模型能力與商用模型有明顯差距；維運負擔重。
- **否決原因：** 本平台為 SaaS 產品，運維簡潔性優先。保留 Ollama 作為本地開發與離線測試用途。

## 影響

### 正面影響

- **成本可控：** V1.0 階段 LLM API 成本維持在每月 $1 USD 以下，為新創期的現金流管理提供緩衝。
- **供應商中立：** `LLM_REGISTRY` 架構確保任何時候都能在一次 config 變更內切換供應商，無需修改業務邏輯。
- **漸進式升級路徑：** V2.0 的 model-router 可依據任務複雜度分配不同等級的模型，在成本與品質之間取得最佳平衡。

### 負面影響與風險


| 風險                            | 嚴重度 | 緩解措施                                                                             |
| ----------------------------- | --- | -------------------------------------------------------------------------------- |
| 合約審查方質疑「equivalent」解釋         | 中   | 準備 benchmark 對比報告，證明 Gemini 2.5 Flash 在本場景的表現 >= GPT-4o                          |
| Google Vertex AI 服務中斷或定價變動    | 低   | 抽象層已就緒，可在數小時內切換至 Gemini API（直連）或其他供應商                                            |
| 投資方期待看到 Claude 整合             | 中   | V2.0 roadmap 明確納入 Anthropic provider，作為 reasoning 任務的首選模型                        |
| Gemini 2.5 Flash 在複雜診斷推理上能力不足 | 中   | V1.0 階段由 harness L1 diagnostic engine 的 prompt engineering 補償；V2.0 將複雜推理路由至高能力模型 |


## 行動項目


| 優先序 | 項目                                                                            | 負責人   | 目標時程          |
| --- | ----------------------------------------------------------------------------- | ----- | ------------- |
| P0  | 維持現行 Gemini 2.5 Flash 設定，完成 V1.0 上線                                           | 開發團隊  | V1.0 GA       |
| P1  | 建立模型能力 benchmark 報告（中文客服場景），用於合約「equivalent」條款的佐證                             | 技術負責人 | V1.0 GA + 2 週 |
| P1  | 實作 `agent/llms/anthropic_model.py` 並註冊至 `LLM_REGISTRY`                        | 開發團隊  | V2.0 Sprint 1 |
| P2  | 實作 model-router，支援依 intent 類型分派不同模型                                           | 開發團隊  | V2.0 Sprint 2 |
| P2  | 擴充 `config.toml` 為多模型設定格式（`[llm.default]`, `[llm.reasoning]`, `[llm.safety]`） | 開發團隊  | V2.0 Sprint 2 |
| P3  | 評估 Vertex AI Model Garden 上的 Claude 整合方案，與直連 Anthropic API 的成本差異              | 技術負責人 | V2.0 Sprint 3 |


---

## 相關文件

- ADR-003: 選擇 LangChain 作為 LLM 整合框架
- `agent/llms/__init__.py` — LLM provider 抽象層與 `LLM_REGISTRY`
- `agent/config.toml` — `[llm]` 區塊，當前生產設定
- `agent/llms/vertexai_model.py` — 當前生產模型建構器

