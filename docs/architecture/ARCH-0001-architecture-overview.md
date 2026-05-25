---
id: ARCH-0001
title: 整合性架構與設計文件 - 電子鎖智能客服與派工平台
tier: 1
status: accepted
date: 2026-05-16
deciders: [Tech Lead]
---

# 整合性架構與設計文件 - 電子鎖智能客服與派工平台

# Smart Lock AI Support & Service Dispatch SaaS Platform

---

**文件版本 (Document Version):** `v2.0`
**最後更新 (Last Updated):** `2026-04-04`
**主要作者 (Lead Author):** `技術架構師`
**審核者 (Reviewers):** `架構委員會, 核心開發團隊`
**狀態 (Status):** `已批准 (Approved)`

---

## 目錄 (Table of Contents)

- [第 1 部分：架構總覽](#第-1-部分架構總覽)
  - [1.1 C4 模型：視覺化架構](#11-c4-模型視覺化架構)
  - [1.2 DDD 戰略設計](#12-ddd-戰略設計)
  - [1.3 五層 Agent 架構分層](#13-五層-agent-架構分層)
  - [1.4 Software 3.0 設計哲學](#14-software-30-設計哲學)
  - [1.5 技術選型與決策](#15-技術選型與決策)
- [第 2 部分：需求摘要](#第-2-部分需求摘要)
  - [2.1 功能性需求摘要](#21-功能性需求摘要)
  - [2.2 非功能性需求](#22-非功能性需求)
- [第 3 部分：高層次架構設計](#第-3-部分高層次架構設計)
  - [3.1 架構模式](#31-架構模式)
  - [3.2 系統上下文圖](#32-系統上下文圖)
  - [3.3 系統組件圖](#33-系統組件圖)
  - [3.4 主要組件職責表](#34-主要組件職責表)
  - [3.5 關鍵用戶旅程](#35-關鍵用戶旅程)
- [第 4 部分：技術選型詳述](#第-4-部分技術選型詳述)
- [第 5 部分：數據架構](#第-5-部分數據架構)
  - [5.1 數據模型](#51-數據模型)
  - [5.2 數據流圖](#52-數據流圖)
  - [5.3 數據一致性策略](#53-數據一致性策略)
  - [5.4 向量索引策略](#54-向量索引策略)
- [第 6 部分：部署與基礎設施](#第-6-部分部署與基礎設施)
  - [6.1 部署視圖](#61-部署視圖)
  - [6.2 CI/CD 流程](#62-cicd-流程)
  - [6.3 環境策略](#63-環境策略)
- [第 7 部分：跨領域考量](#第-7-部分跨領域考量)
  - [7.1 可觀測性](#71-可觀測性)
  - [7.2 安全性](#72-安全性)
- [第 8 部分：風險與緩解策略](#第-8-部分風險與緩解策略)
- [第 9 部分：架構演進路線圖](#第-9-部分架構演進路線圖)
- [第 10 部分：附錄](#第-10-部分附錄)

---

**目的**: 本文件旨在將電子鎖智能客服與派工平台的業務需求轉化為一個完整、內聚的技術藍圖。系統分為兩個主要階段交付：V1.0 聚焦 AI 智能客服（LINE Bot + AI 問診 + ProblemCard + 三層解決機制 + 自演化知識庫 + 管理後台），V2.0 擴展至技師派工與帳務（技師工作台 Web App + 智能派工 + 計價引擎 + 帳務系統 + 增強管理後台）。本文件從高層次的系統架構出發，逐步深入到具體的模組級設計，確保系統的穩固性與可維護性。

---

## 第 1 部分：架構總覽

*此部分關注系統的宏觀結構與指導原則，回答「系統由什麼組成？」以及「它們之間如何互動？」。*

### 1.1 C4 模型：視覺化架構

我們使用 [C4 模型](https://c4model.com/) 從不同層次視覺化軟體架構，確保從利害關係人到開發者的每個角色都能清楚理解系統結構。

#### L1 - 系統情境圖 (System Context Diagram)

描述本系統與外部使用者及外部系統的互動邊界。本平台服務三類使用者：一般用戶（透過 LINE）、技師（透過 Web App）、管理員（透過管理後台），並與 LINE Messaging API 和 Google AI API 兩個外部系統整合。

```mermaid
graph TB
    subgraph "外部使用者 (External Users)"
        LU["LINE 用戶<br/>(一般消費者 / 住戶)<br/>---<br/>透過 LINE App 發起<br/>電子鎖問題諮詢"]
        TU["技師<br/>(Technician)<br/>---<br/>V2.0 透過 Web App<br/>接收與處理派工單"]
        AU["管理員<br/>(Admin / 客服主管)<br/>---<br/>透過管理後台<br/>監控系統與管理知識庫"]
    end

    subgraph "Smart Lock AI Support Platform"
        SYS["電子鎖智能客服與派工平台<br/>(Smart Lock AI Platform)<br/>---<br/>提供 AI 問診、三層解決機制<br/>知識庫管理、派工調度、帳務處理"]
    end

    subgraph "外部系統 (External Systems)"
        LINE["LINE Messaging API<br/>---<br/>訊息收發、Rich Menu<br/>Flex Message 推送"]
        GOOGLE_AI["Google Gemini 2.5 Flash API<br/>---<br/>自然語言理解、意圖識別<br/>對話生成、SOP 草稿生成"]
    end

    LU -- "LINE 訊息<br/>(文字/圖片/位置)" --> SYS
    SYS -- "回覆訊息<br/>(Flex Message / 文字)" --> LU
    TU -- "HTTPS<br/>(REST API)" --> SYS
    SYS -- "派工通知<br/>(Push Notification)" --> TU
    AU -- "HTTPS<br/>(Web Admin Panel)" --> SYS
    SYS -- "Webhook Events" --> LINE
    LINE -- "Webhook Callback" --> SYS
    SYS -- "LLM API Calls<br/>(Chat Completion)" --> GOOGLE_AI
    GOOGLE_AI -- "AI Response<br/>(JSON)" --> SYS
```

#### L2 - 容器圖 (Container Diagram)

描述系統由哪些可部署單元組成。V1.0 階段以 FastAPI 後端為核心，搭配 PostgreSQL + pgvector 與 Redis。V2.0 增加 Next.js 前端。

```mermaid
graph TB
    subgraph "外部使用者"
        LU["LINE 用戶"]
        TU["技師 (V2.0)"]
        AU["管理員"]
    end

    subgraph "外部系統"
        LINE_API["LINE Messaging API"]
        GOOGLE_AI_API["Google Gemini 2.5 Flash API"]
    end

    subgraph "Platform Containers"
        subgraph "Web 層 (Web Tier)"
            WEBHOOK["LINE Bot Webhook Handler<br/>---<br/>Python / FastAPI<br/>接收 LINE Webhook 事件<br/>驗證簽章、路由事件"]
            ADMIN["Admin Panel<br/>---<br/>V1.0: FastAPI + Jinja2 / HTMX<br/>V2.0: Next.js (React/TypeScript)<br/>知識庫管理、系統監控"]
            TECHAPP["Technician Web App<br/>---<br/>V2.0: Next.js (React/TypeScript)<br/>派工接收、工單回報、導航"]
        end

        subgraph "API 層 (API Tier)"
            API["FastAPI Backend<br/>(Core Application Server)<br/>---<br/>Python 3.11+ / FastAPI / Uvicorn<br/>REST API / WebSocket<br/>業務邏輯核心"]
        end

        subgraph "數據層 (Data Tier)"
            PG["PostgreSQL 16<br/>+ pgvector Extension<br/>---<br/>主要關聯式資料庫<br/>向量索引 (HNSW)<br/>案例庫 & 手冊嵌入"]
            REDIS["Redis<br/>---<br/>Session Cache<br/>對話狀態暫存<br/>Rate Limiting Counter"]
        end
    end

    LU -- "LINE Messages" --> LINE_API
    LINE_API -- "Webhook POST<br/>(HTTPS + Signature)" --> WEBHOOK
    WEBHOOK -- "Internal Route" --> API
    API -- "Reply/Push API<br/>(HTTPS)" --> LINE_API

    TU -- "HTTPS<br/>(REST API)" --> TECHAPP
    TECHAPP -- "API Calls<br/>(HTTPS)" --> API

    AU -- "HTTPS<br/>(Browser)" --> ADMIN
    ADMIN -- "API Calls<br/>(HTTPS)" --> API

    API -- "LangChain<br/>(Chat Completion / Embedding)" --> GOOGLE_AI_API
    API -- "SQL / pgvector<br/>(SQLAlchemy Async)" --> PG
    API -- "Cache R/W<br/>(aioredis)" --> REDIS
```

#### L3 - 元件圖 (Component Diagram) - FastAPI Backend 內部

針對核心容器 FastAPI Backend，拆解其內部的模組元件。這是系統的業務邏輯核心。

```mermaid
graph TB
    subgraph "FastAPI Backend - Internal Components"

        subgraph "Interface Layer (介面層)"
            WH["Webhook Controller<br/>---<br/>LINE 事件接收與路由<br/>簽章驗證"]
            REST["REST API Controllers<br/>---<br/>Admin API / Technician API<br/>Knowledge Base API"]
        end

        subgraph "Application Layer (應用層)"
            CM["Conversation Manager<br/>---<br/>對話狀態機管理<br/>Session 生命週期<br/>多輪對話上下文維護"]
            PCE["ProblemCard Engine<br/>---<br/>問題卡建立與填充<br/>欄位驗證與完整性檢查<br/>AI 輔助欄位推斷"]
            TLR["Three-Layer Resolver<br/>---<br/>L1: 知識庫精確匹配<br/>L2: AI 推理生成<br/>L3: 轉人工 / 建立工單"]
            KBM["Knowledge Base Manager<br/>---<br/>案例庫 CRUD<br/>手冊 PDF 解析與分段<br/>Embedding 生成與更新"]
            SOPGen["SOP Generator<br/>---<br/>從成功對話中<br/>自動草擬 SOP<br/>待人工審核後上架"]
        end

        subgraph "Application Layer V2.0 (派工與帳務)"
            DSP["Dispatch Engine<br/>---<br/>智能技師匹配<br/>技能 / 地區 / 評分<br/>工單生命週期管理"]
            PRC["Pricing Engine<br/>---<br/>品牌 x 鎖型 x 難度<br/>計價規則引擎<br/>報價生成"]
            ACC["Accounting Module<br/>---<br/>對帳作業<br/>發票 / 請款單<br/>統計報表"]
        end

        subgraph "Domain Layer (領域層)"
            ENT["Domain Entities<br/>---<br/>ProblemCard / Conversation<br/>CaseEntry / ManualChunk<br/>WorkOrder / Technician<br/>PriceRule / Invoice"]
            EVT["Domain Events<br/>---<br/>CardCompleted<br/>ResolutionFound<br/>WorkOrderCreated<br/>WorkOrderCompleted"]
        end

        subgraph "Infrastructure Layer (基礎設施層)"
            REPO["Repositories<br/>---<br/>SQLAlchemy Async Repos<br/>pgvector Search Repos<br/>Redis Cache Repos"]
            LLM["LLM Gateway<br/>---<br/>LangChain Wrapper<br/>Google AI API Client<br/>Prompt Template Manager<br/>Token Usage Tracker"]
            LINEsdk["LINE SDK Adapter<br/>---<br/>line-bot-sdk-python<br/>Message Builder<br/>Flex Message Templates"]
            EMB["Embedding Service<br/>---<br/>text-embedding-004<br/>Batch Embedding Pipeline<br/>Vector Normalization"]
        end
    end

    WH --> CM
    WH --> PCE
    REST --> KBM
    REST --> DSP
    REST --> ACC

    CM --> TLR
    CM --> PCE
    PCE --> TLR
    TLR --> KBM
    TLR --> SOPGen
    TLR --> DSP

    CM --> ENT
    PCE --> ENT
    TLR --> ENT
    KBM --> ENT
    DSP --> ENT
    PRC --> ENT
    ACC --> ENT

    CM --> EVT
    PCE --> EVT
    TLR --> EVT
    DSP --> EVT

    ENT --> REPO
    KBM --> EMB
    TLR --> LLM
    SOPGen --> LLM
    PCE --> LLM
    CM --> LINEsdk
    CM --> REPO
    DSP --> REPO
    PRC --> REPO
    ACC --> REPO

    LINEsdk --> LINEEXT["LINE Messaging API"]
    LLM --> GAIEXT["Google AI API"]
    REPO --> PGEXT["PostgreSQL + pgvector"]
    REPO --> RDEXT["Redis"]
```

### 1.2 DDD 戰略設計 (Strategic DDD)

#### 通用語言 (Ubiquitous Language)

以下術語在專案所有利害關係人之間共享，具有唯一且無歧義的定義：

| 術語 (Term) | 中文名稱 | 定義 (Definition) |
| :--- | :--- | :--- |
| **ProblemCard** | 問題卡 | 一次客服對話的結構化問題描述，包含電子鎖型號 (model)、安裝位置 (location)、門的狀態 (door_status)、網路狀態 (network)、故障症狀 (symptoms)、用戶意圖 (intent)、處理狀態 (status)。是三層解決機制的輸入核心。 |
| **Conversation** | 對話 | 用戶與系統之間的一次完整互動 session，由多輪訊息 (messages) 組成，關聯到一張 ProblemCard。 |
| **CaseEntry** | 案例條目 | 知識庫中的一筆案例記錄，包含問題描述、解決方案、適用品牌/型號，以及用於向量搜尋的 embedding。 |
| **ManualChunk** | 手冊段落 | 電子鎖 PDF 操作手冊經解析後的文本段落，包含 embedding，用於 RAG 檢索。 |
| **SOPDraft** | SOP 草稿 | 系統從成功對話中自動產生的標準作業程序草稿，需經管理員審核後才能加入知識庫。 |
| **Three-Layer Resolution** | 三層解決機制 | 問題解決的核心流程：L1 知識庫精確匹配 -> L2 AI 推理生成 -> L3 轉人工/建立派工單。 |
| **WorkOrder** | 派工單 | V2.0 - 由系統建立的到場服務工單，包含問題描述、客戶資訊、指派技師、預約時段、服務狀態。 |
| **Technician** | 技師 | V2.0 - 已登錄的維修技師，包含技能清單 (capabilities)、服務地區 (regions)、可用時段 (availability)、評分 (rating)。 |
| **PriceRule** | 計價規則 | V2.0 - 定義服務費用的規則，以品牌 (brand) x 鎖型 (lock_type) x 難度 (difficulty) 為維度。 |
| **Invoice** | 發票/請款單 | V2.0 - 服務完成後產生的帳務憑證，包含服務明細、金額、付款狀態。 |
| **Knowledge Base** | 知識庫 | 由 CaseEntry 和 ManualChunk 組成的可搜尋資料集合，支援向量相似度搜尋，是 L1 解決機制的資料來源。 |
| **Embedding** | 向量嵌入 | 文本經 LLM embedding model 轉換後的高維向量表示，用於語義相似度搜尋。 |
| **Rich Menu** | LINE 選單 | LINE Bot 底部的自訂選單介面，提供快捷操作入口。 |
| **Flex Message** | 彈性訊息 | LINE 的結構化訊息格式，用於呈現 ProblemCard 摘要、解決方案步驟等。 |

#### 限界上下文 (Bounded Contexts)

根據業務領域劃分的五個限界上下文：

| 限界上下文 | 英文名稱 | 核心職責 | 核心實體 | 階段 |
| :--- | :--- | :--- | :--- | :--- |
| **客服上下文** | CustomerService | LINE Bot 互動、對話管理、ProblemCard 建立與填充、三層解決機制執行 | Conversation, ProblemCard, Message | V1.0 |
| **知識庫上下文** | KnowledgeBase | 案例管理、手冊解析、Embedding 計算、向量搜尋、SOP 自動生成與審核 | CaseEntry, ManualChunk, SOPDraft, Embedding | V1.0 |
| **派工上下文** | Dispatch | 工單建立與管理、技師匹配與指派、排程、工單狀態追蹤 | WorkOrder, Technician, Assignment | V2.0 |
| **帳務上下文** | Accounting | 計價規則管理、報價生成、對帳、發票管理、統計報表 | PriceRule, Invoice, Voucher, Report | V2.0 |
| **使用者管理上下文** | UserManagement | LINE 用戶綁定、管理員帳號管理、技師帳號管理、角色與權限控制 | User, Admin, Role, Permission | V1.0 + V2.0 |
| **審計上下文** | Audit | API 呼叫紀錄、LLM 互動歷史、RAG 來源引用、管理後台審批、跨代理人訊息紀錄（合約 10.3 條） | AuditLog, SentimentAlert, FamilyReviewRecord | V1.0 |
| **情緒分流上下文** | SentimentTriage | 負面情緒偵測、優先回應協議觸發、管理員即時通知（合約 9.3 條、4.4(a) 條，識別率 >= 90%） | SentimentResult, EscalationNotification | V1.0 |
| **爭議處理上下文** | DisputeResolution | 客訴案件建立、爭議調解流程、退款審批、結案歸檔 | Dispute, RefundRequest, Resolution | V2.0 |
| **保固上下文** | Warranty | 保固期限查詢、保固條件驗證、保固理賠流程 | WarrantyRecord, WarrantyClaim | V2.0 |
| **庫存上下文** | Inventory | 零件庫存追蹤、備料建議、庫存預警、進出庫紀錄 | InventoryItem, StockMovement | V2.0 |
| **品牌管理上下文** | BrandManagement | 品牌/型號主檔維護、品牌對應技師技能映射、型號生命週期管理 | Brand, LockModel, SkillMapping | V2.0 |
| **IoT 上下文**（新增 2026-05-22）| IotSignalIngestion | 電子鎖 IoT 狀態訊號接收、Event Envelope 轉換、AI 客服預填 / BI 預警 | IotEvent, DeviceAdapter | V2.0+ (per ADR-0059) |

> **2026-05-22 業主拍板 29 條 ADR**（ADR-0031~0059）對 Bounded Context 主要影響：
> - **CustomerService**：HITL 邊界鎖死（ADR-0031 / 0047 / 0048）；ProblemCard completeness gate 0.85（ADR-0033）；多 PC 規則（ADR-0036）；對話自動關閉（ADR-0037）
> - **KnowledgeBase**：SOP 雙審 / 單審（ADR-0038）；外部知識傳承平台 ingestion contract（ADR-0058）；合約 / 規則走 RAG（ADR-0057）
> - **UserManagement**：RBAC 4 層原則（ADR-0042）；Family Reviewer 角色明文（合約 4.4(d)）
> - **Dispatch**：地址結案前硬 gate（ADR-0032）；接單 SLA 10/5 min（ADR-0045）；現場加價三件套（ADR-0049）
> - **Accounting**：取消費 5 階段 + 客服可覆寫（ADR-0039）；退款核准分層（ADR-0040）；車馬費 80/20（ADR-0041）；Material owner（ADR-0052）；Serial 控制（ADR-0053）；ChangeRequest 物件（ADR-0046）
> - **Audit + SentimentTriage**：Evidence 可見性矩陣（ADR-0050）；Retention（ADR-0051）；4.4(a) 90% Eval pipeline（ADR-0047）
> - **跨 Context**：Contract Template 物件 + tenant_scope（ADR-0043）；廠商合約附件規格（ADR-0056）
> - **NFR / Tooling**：SKILL ↔ LLM 解耦合約（ADR-0055，影響全系統 portability）
> 
> 完整 ADR 索引見 [`docs/architecture/adr/INDEX.md`](../../docs/architecture/adr/INDEX.md)；裁決脈絡見 [`archive/meetings/2026-05-22/ACTION-ITEMS-2026-05-22.md`](../../archive/meetings/2026-05-22/ACTION-ITEMS-2026-05-22.md)。

#### 上下文地圖 (Context Map)

定義限界上下文之間的關係。箭頭表示依賴方向（上游 -> 下游）。

```mermaid
graph LR
    subgraph "V1.0 Core"
        CS["CustomerService<br/>(客服上下文)<br/>---<br/>核心上游"]
        KB["KnowledgeBase<br/>(知識庫上下文)<br/>---<br/>共享核心"]
        UM["UserManagement<br/>(使用者管理上下文)<br/>---<br/>通用子域"]
    end

    subgraph "V2.0 Extension"
        DP["Dispatch<br/>(派工上下文)<br/>---<br/>V2.0 核心"]
        AC["Accounting<br/>(帳務上下文)<br/>---<br/>V2.0 支援"]
    end

    CS -- "Conformist<br/>(查詢案例/手冊)" --> KB
    CS -- "Customer-Supplier<br/>(L3 建立工單)" --> DP
    CS -- "Conformist<br/>(用戶身分驗證)" --> UM

    DP -- "Customer-Supplier<br/>(服務完成 -> 產生帳務)" --> AC
    DP -- "Conformist<br/>(技師身分驗證)" --> UM
    DP -- "Anti-Corruption Layer<br/>(查詢問題卡資訊)" --> CS

    KB -- "Published Language<br/>(SOP/案例結構)" --> CS
    AC -- "Conformist<br/>(查詢工單明細)" --> DP
```

**上下文關係說明：**

| 關係 | 模式 | 說明 |
| :--- | :--- | :--- |
| CustomerService -> KnowledgeBase | Conformist | 客服上下文遵循知識庫上下文定義的資料結構進行案例查詢 |
| CustomerService -> Dispatch | Customer-Supplier | 客服上下文作為需求方，當 L3 觸發時向派工上下文提交工單建立請求 |
| KnowledgeBase -> CustomerService | Published Language | 知識庫透過公開的 CaseEntry/ManualChunk 結構提供搜尋結果 |
| Dispatch -> Accounting | Customer-Supplier | 派工完成後，派工上下文觸發帳務上下文進行費用計算與請款 |
| Dispatch -> CustomerService | Anti-Corruption Layer | 派工上下文透過防腐層轉譯客服上下文的 ProblemCard，避免領域模型耦合 |
| 所有上下文 -> UserManagement | Conformist | 所有上下文遵循 UserManagement 定義的身分與權限模型 |

### 1.3 Agent 架構分層

#### 1.3.1 Current Implementation：Single ReAct Agent + Harness 中介層（V1.0 上線版本）

V1.0 實際採用 **LangGraph `prebuilt.create_react_agent`** 構建單一 ReAct agent，配 3 個工具，並以 **Harness 中介層**（8 個扁平模組檔）封裝橫切關注（debounce、safety、profile、memory、validation、audit）。依賴方向：Interface → Harness → Agent → Infrastructure。

```
┌─────────────────────────────────────────────────┐
│  1. Interface Layer                              │
│     app.py (FastAPI webhook)  main.py (CLI)     │
├─────────────────────────────────────────────────┤
│  2. Harness Layer (8 個扁平模組檔)              │
│     harness/multimodal.py        (H2)           │
│     harness/debounce.py          (H3)           │
│     harness/data_correction.py   (H_DC)         │
│     harness/line_ui_factory.py   (H_QR)         │
│     harness/profile_updater.py   (H4)           │
│     harness/memory_manager.py    (H5)           │
│     harness/safety_gate.py       (H6)           │
│     harness/output_validator.py  (H7.5)         │
├─────────────────────────────────────────────────┤
│  3. Agent Layer (Single ReAct + 3 Tools)        │
│     agent.py                                    │
│       └─ create_react_agent(llm, tools=[...])  │
│     prompts/system.md                           │
│     skills/tools.py                             │
│       ├─ load_skill         (load SOP content) │
│       ├─ update_user_info   (write user_facts) │
│       └─ transfer_to_human  (escalate)         │
├─────────────────────────────────────────────────┤
│  4. Infrastructure Layer                         │
│     llms/   memory/   storage/   embeddings/    │
│     profiles/   skills/data/   core/            │
└─────────────────────────────────────────────────┘

依賴方向：Interface → Harness → Agent → Infrastructure
          （外層可依賴內層，反向禁止）
```

**各層職責定義：**

| 層 (Layer) | 職責 | 關鍵檔案 | 依賴規則 |
| :--- | :--- | :--- | :--- |
| **Interface** | 接收外部請求（LINE Webhook / CLI），交由 Harness orchestrate | `agent/app.py`, `agent/main.py` | 僅呼叫 Harness |
| **Harness** | 8 個扁平模組（每個檔案約 200-600 行）：去抖緩衝、多模態下載、資料修正攔截、Quick Reply、profile 抽取、記憶壓縮、安全閘、輸出驗證 | `agent/harness/*.py`（8 檔扁平） | 依賴 Agent + Infrastructure |
| **Agent** | 單一 ReAct agent + 3 個工具；ReAct 迴圈由 LLM 自行決定何時 tool call、何時回覆 | `agent/agent.py`, `agent/prompts/system.md`, `agent/skills/tools.py` | 依賴 Infrastructure（llms, skills, profiles） |
| **Infrastructure** | LLM provider、checkpointer、稽核儲存、embedding、profile 寫入、skill 知識檔 | `agent/llms/`, `agent/memory/`, `agent/storage/`, `agent/embeddings/`, `agent/profiles/`, `agent/skills/data/`, `agent/core/` | 最內層，不依賴其他層 |

**ReAct 迴圈本質**：LLM 收到使用者訊息 → 決定要不要呼叫 `load_skill` 載入 SOP → 讀完 SOP 再決定要不要呼叫 `update_user_info` 寫入 user_facts → 最終決定 `transfer_to_human` 或直接回覆。`transfer_to_human` 必須先有 `load_skill` 紀錄為前置（強制多輪 reasoning），形成「思考→行動→再思考」循環。

#### 1.3.2 Vision：Multi-Agent Sub-graph（規劃中，尚未實作）

> ⚠️ **Vision (not yet implemented)**: 多 sub-agent 編排為長期架構願景。
>
> 以下 7 sub-graph + 8-Layer Harness 框架（§1.4 / §3.3 / §3.4 圖示）為理想分工，但目前由 single ReAct + 3 tools 已能支撐當前需求。任何擴展需先評估 sub-agent 邊界、跨 agent 通訊機制（messaging / shared state）、以及對 debounce buffer 與 checkpoint cleanup 的影響。

下表為願景版本對應的層次設計（**僅供未來重構參考，現有 code 不對應此結構**）：

| 層 (Layer) | 願景職責 | 預期檔案 | 狀態 |
| :--- | :--- | :--- | :--- |
| **Graph (Vision)** | LangGraph StateGraph 編排，head nodes（pre_process / router / merge_answers / post_process）+ Harness nodes | `agent/graph/*.py` | 規劃中 |
| **Multi-Agent (Vision)** | 7 個專業 sub-agent（hardware_technician / sales_representative / store_assistant / app_specialist / manual_librarian / web_researcher / receptionist），各自持有 prompt + tools 組合 | `agent/agents/__init__.py`, `agent/agents/prompts/`（13 模板） | 規劃中 |
| **8-Layer Harness Framework (Vision)** | L1 Task / L2 Context / L3 Governance / L5 Feedback / L6 Safety / L7 Observability / L8 Entropy | `agent/harness/{task,context,governance,feedback,safety,observability,entropy}/`（願景子目錄） | 規劃中 |

### 1.4 Software 3.0 設計哲學

本系統遵循 Software 3.0 設計典範：知識儲存於結構化資料檔案，推理由 LLM 透過 Prompt 驅動，Python 程式碼僅負責編排與 I/O。

#### 知識即資料 (Knowledge as Data)

所有領域知識均以結構化格式儲存，而非硬編碼於 Python 規則引擎中：

| 知識類型 | 儲存格式 | 路徑 | 說明 |
| :--- | :--- | :--- | :--- |
| 故障症狀定義 | TOML | `agent/config/symptoms.toml` | 品牌 x 型號 x 症狀的結構化描述 |
| 故障樹 | JSON/TOML | `agent/config/fault_trees/` | 層級式故障診斷決策樹 |
| 失敗模式 | JSON/TOML | `agent/config/failure_modes/` | 已知失敗模式與對應解決方案 |
| Agent 設定 | TOML | `agent/agents/config.toml` | Agent 組合、Prompt 路徑、Tool 綁定 |
| Prompt 模板 | Markdown/Jinja2 | `agent/agents/prompts/` | 13 個 Prompt 模板，驅動 LLM 推理 |

#### 推理即 Prompt (Reasoning as Prompts)

LLM 推理取代傳統 if/else 規則引擎。Python 程式碼不做業務判斷，僅負責：

1. **I/O 操作** -- 資料庫查詢、API 呼叫、檔案讀取
2. **流程編排** -- LangGraph StateGraph 定義節點順序與條件路由
3. **格式轉換** -- Pydantic 模型驗證、Flex Message 模板渲染

#### Harness 中介層 (Current — V1.0 上線版本)

V1.0 實際 Harness 為 **8 個扁平模組檔**，封裝橫切關注：

| 層 | 檔案 | 觸發時機 | 阻塞？ |
| :--- | :--- | :--- | :--- |
| H2 | `agent/harness/multimodal.py` | 收到 image/audio/video 訊息 | 背景下載，buffer placeholder 同步替換 |
| H3 | `agent/harness/debounce.py` | 所有訊息 | 同步 — 合併連發訊息、編排 agent |
| H_DC | `agent/harness/data_correction.py` | `#資料修正` 關鍵字觸發 | 同步 — 寫入 conversation context，跳過 agent |
| H_QR | `agent/harness/line_ui_factory.py` | brand 未知時 | 同步 — 用 Quick Reply 蒐集 brand/model |
| H4 | `agent/harness/profile_updater.py` | agent 回覆後 | 背景 — LLM 抽取 phone/address 寫入 user_facts |
| H5 | `agent/harness/memory_manager.py` | agent 前後 | 同步檢查 + 背景壓縮 |
| H6 | `agent/harness/safety_gate.py` | LLM 呼叫前 | 同步 — 阻擋危險關鍵字 |
| H7.5 | `agent/harness/output_validator.py` | LLM 回覆後 | 同步 — 阻擋洩漏內部機制的字串 |

H8（稽核）為 `harness/debounce.py` 中的 audit log 寫入步驟，背景執行。

#### 8-Layer Harness Framework (Vision — 規劃中)

> ⚠️ **Vision (not yet implemented)**: 下表為 8-Layer Harness 願景設計，由 ADR-009 定義。實際 V1.0 採用上述 8 個扁平模組檔；以下分層描述供未來重構參考。

每層在願景中可獨立啟用/停用：

| Layer | 名稱 | 願景啟用 Phase | 願景職責 |
| :--- | :--- | :--- | :--- |
| L1 | Task Representation | Phase 2 | task_decompose: 將自然語言轉為結構化 ProblemCard |
| L2 | Context Assembly | Phase 4 | Token 預算管理、上下文新鮮度評分、來源組裝 |
| L3 | Tool Governance | Phase 3 | ToolRegistry 白名單、工具呼叫權限控制 |
| L4 | (Reserved) | - | 保留供未來擴展 |
| L5 | Feedback Loop | Phase 5 | verify_answer 品質驗證、retry conditional edge |
| L6 | Safety Gate | Phase 3 | Regex 安全閘門 (<50ms, zero LLM)、PII 過濾 |
| L7 | Observability | Phase 1 | @traced decorator、harness_traces table、LLM 呼叫追蹤 |
| L8 | Entropy Management | Phase 6 | SOP 自動生成、知識庫新鮮度掃描、熵值監控 |

#### 品質保證機制

V1.0 透過以下機制確保回覆品質（**現狀**）：

1. **ReAct Tool Loop** -- LLM 自主決定何時 `load_skill` 載入 SOP、何時 `update_user_info` 寫入 facts、何時 `transfer_to_human`
2. **Skill Filtering** -- 依使用者 brand/model 動態注入相關 SKILL.md，限制 LLM 知識邊界
3. **Output Validator (H7.5)** -- 後處理檢查阻擋洩漏內部機制的字串

> ⚠️ **Vision (not yet implemented)**: 三重機制堆疊（Multi-Agent Fan-out / Three-Layer Cascade / Harness L5 Verify）為願景設計，需待 multi-agent sub-graph 實作後啟用。

#### Router 演進：從 LLM 到 Config-only (Vision)

> ⚠️ **Vision (not yet implemented)**: 以下 Router 演進規劃對應 multi-agent sub-graph 願景；V1.0 single ReAct 不需要 Router，由 LLM 自身決定 tool call 順序。

| 版本 | Router 實作 | LLM 呼叫數 | 延遲 |
| :--- | :--- | :--- | :--- |
| V0 (舊) | LLM-based task_decompose 同時做分類 + 診斷 | 1 次 LLM | 2-4s |
| V1 (Vision) | task_decompose 做分類 + 診斷 (single LLM call)，Router 改為 config-only 查表 | 0 次 LLM (Router) | <10ms (Router) |

Router 零 LLM 設計（願景）：根據 task_decompose 輸出的 intent 欄位，直接查詢 `agent/config.toml` 中的 agent 映射表，不再額外呼叫 LLM 做路由決策。

#### Latency Budget

V1.0 Single ReAct 實際 budget：

| 階段 | Budget | 說明 |
| :--- | :--- | :--- |
| LINE Webhook -> FastAPI | <200ms | 網路傳輸 |
| Debounce buffer (H3) | 1.5s | 等待後續訊息合併 |
| Safety Gate (H6) | <50ms | Regex 比對，zero LLM |
| ReAct iteration (LLM + tool call) | 2-5s × N | LLM 自主決定 tool call 數量 |
| Output validator (H7.5) | <50ms | Regex 比對 |
| Response format | <500ms | LINE Flex Message 組裝 |
| **Total** | **<8s** | 目標：簡單查詢 <5s |

> ⚠️ **Vision Latency Budget**（multi-agent sub-graph 啟用後）會新增 task_decompose (2-4s)、Router (<10ms)、Agent RAG (2-5s)、merge_answers 等階段，總 budget 需重新評估。

### 1.5 技術選型與決策

#### 技術棧總覽 (Tech Stack Overview)

| 分類 | 選用技術 | 版本 | 用途 |
| :--- | :--- | :--- | :--- |
| **後端語言** | Python | 3.11+ | 核心業務邏輯 |
| **後端框架** | FastAPI | 0.110+ | REST API / WebSocket / Webhook |
| **ASGI Server** | Uvicorn | 0.29+ | 高效能非同步 HTTP Server |
| **LLM 框架** | LangChain | 0.2+ | LLM 調用抽象、Chain 編排、Prompt 管理 |
| **LLM 模型** | Google Gemini 2.5 Flash | - | 意圖識別、對話生成、SOP 草稿 |
| **Embedding 模型** | Google text-embedding-004 | - | 文本向量化 (768 維) |
| **關聯式資料庫** | PostgreSQL | 16 | 主要資料儲存 |
| **向量擴展** | pgvector | 0.7+ | 向量索引與相似度搜尋 |
| **快取** | Redis | 7+ | Session 快取、Rate Limiting |
| **前端框架 (V2.0)** | Next.js (React) | 14+ | 技師 Web App / 管理後台 |
| **前端語言 (V2.0)** | TypeScript | 5+ | 型別安全的前端開發 |
| **Admin UI (V1.0)** | FastAPI + Jinja2 / HTMX | - | 輕量管理後台 |
| **容器化** | Docker + docker-compose | 24+ | 開發與部署環境標準化 |
| **CI/CD** | GitHub Actions | - | 自動化測試與部署流程 |
| **LINE 整合** | line-bot-sdk-python | 3+ | LINE Messaging API 互動 |
| **ORM** | SQLAlchemy | 2.0+ | 非同步資料庫操作 |
| **資料驗證** | Pydantic | 2.0+ | Request/Response 模型驗證 |
| **資料遷移** | Alembic | 1.13+ | 資料庫 Schema 版本管理 |
| **測試框架** | pytest + pytest-asyncio | - | 單元測試與整合測試 |
| **PDF 解析** | PyMuPDF (fitz) | - | 電子鎖手冊 PDF 解析 |

#### 架構決策記錄 (ADR) 索引

所有重大技術決策應記錄為 ADR，存放於 `docs/01-define/adrs/` 目錄。

| ADR 編號 | 標題 | 狀態 | 影響範圍 |
| :--- | :--- | :--- | :--- |
| ADR-001 | 選用 FastAPI 作為後端框架 | Accepted | 全系統 |
| ADR-002 | 選用 PostgreSQL + pgvector 作為資料庫與向量儲存 | Accepted | 數據層 |
| ADR-003 | 選用 LangChain + Google Gemini 2.5 Flash 作為 LLM 方案 | Accepted | AI 元件 |
| ADR-004 | V1.0 採用 Modular Monolith 架構 | Accepted | 全系統 |
| ADR-005 | 選用 Redis 作為 Session 與快取方案 | Accepted | 數據層 |
| ADR-006 | Admin UI V1.0 使用 Jinja2 + HTMX，V2.0 遷移至 Next.js | Accepted | 前端 |
| ADR-007 | 採用 Docker Compose 作為部署策略 | Accepted | 基礎設施 |
| ADR-008 | Embedding 模型選用 text-embedding-004 | Accepted | AI 元件 |
| ADR-009 | 採用 8-Layer Harness Framework 作為 Agent 運行時保障 | Accepted | AI 元件 |
| ADR-010 | Router 從 LLM-based 改為 config-only 查表 | Accepted | AI 元件 |
| ADR-011 | Schema_v2_extensions.sql 擴展 6 張業務表 | Accepted | 數據層 |

---

## 第 2 部分：需求摘要

### 2.1 功能性需求摘要

#### V1.0 - AI 智能客服

| 需求 ID | 功能模組 | 描述 |
| :--- | :--- | :--- |
| FR-101 | LINE Bot 整合 | 接收 LINE 用戶訊息（文字/圖片/位置），回覆 Flex Message，支援 Rich Menu |
| FR-102 | 多輪對話管理 | 維護對話上下文，支援多輪問診流程，對話超時自動清理 |
| FR-103 | ProblemCard 引擎 | AI 輔助從對話中提取結構化欄位，建立問題卡，識別缺失欄位並追問 |
| FR-104 | 三層解決機制 (L1) | 知識庫精確匹配：向量搜尋 + 關鍵字匹配，命中閾值 >= 0.85 |
| FR-105 | 三層解決機制 (L2) | AI 推理生成：基於 ProblemCard + 手冊段落 + 歷史案例，使用 Gemini 2.5 Flash 生成解決建議 |
| FR-106 | 三層解決機制 (L3) | 轉人工/建立工單：AI 無法解決時，收集客戶資訊準備轉接或建立派工需求 |
| FR-107 | 知識庫管理 | CaseEntry CRUD、PDF 手冊上傳與自動分段、Embedding 批次計算與更新 |
| FR-108 | SOP 自動生成 | 從成功對話中萃取解決模式，自動草擬 SOP，管理員審核後上架 |
| FR-109 | 管理後台 (V1.0) | 知識庫管理介面、對話記錄查詢、ProblemCard 統計、系統健康監控 |
| FR-110 | 用戶意圖識別 | 識別用戶意圖：諮詢 / 報修 / 投訴 / 其他，引導至對應處理流程 |

#### V2.0 - 技師派工與帳務

| 需求 ID | 功能模組 | 描述 |
| :--- | :--- | :--- |
| FR-201 | 技師 Web App | 技師工作台：接單/拒單、工單詳情、導航至現場、服務回報、照片上傳 |
| FR-202 | 智能派工引擎 | 根據技師技能、服務地區、可用時段、評分進行最佳匹配與自動指派 |
| FR-203 | 工單生命週期 | 工單狀態流轉：Created -> Assigned -> Accepted -> InProgress -> Completed -> Closed |
| FR-204 | 計價引擎 | 品牌 x 鎖型 x 難度的計價規則管理，自動報價生成 |
| FR-205 | 帳務系統 | 服務費對帳、發票/請款單管理、月度統計報表 |
| FR-206 | 增強管理後台 | 技師管理、派工監控儀表板、帳務報表、計價規則設定 |
| FR-207 | 通知系統 | LINE 推播通知（派工成功）、Web App 即時通知（新工單） |

### 2.2 非功能性需求

| NFR 分類 | 具體需求描述 | 衡量指標/目標值 | 階段 |
| :--- | :--- | :--- | :--- |
| **AI 準確度** | AI 對電子鎖問題的診斷與解答準確率 | >= 80%（50 題標準測試集） | V1.0 |
| **並發能力** | 系統同時處理的用戶數量 | V1.0: 50 concurrent / V2.0: 100 concurrent | V1.0 / V2.0 |
| **API 延遲** | REST API 端點的回應延遲（不含 LLM 呼叫） | P95 < 2 秒 | V1.0 |
| **LLM 回應延遲** | LLM API 呼叫的端到端延遲 | P95 < 10 秒（含網路） | V1.0 |
| **可用性** | 系統正常運行時間 | >= 95%（月度，合約基準） | V1.0 |
| **資料備份** | 每日自動備份 | 每日 1 次，保留 7 天 | V1.0 |
| **安全性** | 資料傳輸加密 | SSL/TLS (HTTPS) | V1.0 |
| **安全性** | LINE Webhook 驗證 | HMAC-SHA256 簽章驗證 | V1.0 |
| **安全性** | API 認證 | JWT Token（Admin / Technician） | V1.0 / V2.0 |
| **部署** | 標準化部署 | Docker + docker-compose | V1.0 |
| **可維護性** | 程式碼覆蓋率 | >= 70%（核心業務邏輯） | V1.0 |
| **可擴展性** | V1.0 -> V2.0 無需重寫核心 | 模組化架構，新模組可插拔式添加 | V1.0 |

---

## 第 3 部分：高層次架構設計

### 3.1 架構模式

V1.0 採用以下架構模式的組合：

| 模式 | 實作方式 | 選擇理由 |
| :--- | :--- | :--- |
| **Modular Monolith** | `agent/config.toml` 多個 section 驅動組合，所有模組共享同一 Python process | 小型團隊（1-3 人），Cloud Run 單服務部署，模組透過設定檔 enable/disable |
| **Event-Driven (Debounce)** | LINE webhook + Debounce buffer（`[debounce] buffer_wait=1.5s`） | LINE 訊息非同步處理，連發訊息自動合併後再觸發 ReAct agent |
| **ReAct Pattern** | `langgraph.prebuilt.create_react_agent` 構建 single agent，LLM 與 3 個工具（load_skill / update_user_info / transfer_to_human）形成迴圈 | LLM 自主決定何時載入 SOP、何時寫 facts、何時轉人工 |
| **Skill Filtering** | 啟動時掃描 `agent/skills/data/` 載入所有 SKILL.md；per-request 依 brand/model 過濾後注入 `[可用技能]` prefix | 限制 LLM 知識邊界，避免品牌混淆 |

**Skill 擴展策略：** 新增 skill 僅需在 `agent/skills/data/{Brand}/{Model}/` 放入 SKILL.md（含 frontmatter + Markdown SOP），下次重啟自動載入。新品牌只需在 `agent/config.toml` 的 `[quick_reply]` 新增條目以驅動 brand/model Quick Reply 蒐集。

> ⚠️ **Vision (not yet implemented)**: **Fan-out / Fan-in** 模式（`Send()` 平行派發至多個 Agent 子圖、`merge_answers` 節點匯流）為 multi-agent 願景，現有 single ReAct 不採用此模式。

### 3.2 系統上下文圖

（見 [1.1 L1 系統情境圖](#l1---系統情境圖-system-context-diagram)）

### 3.3 系統組件圖

#### 3.3.1 Current — Single ReAct Agent（V1.0 上線版本）

V1.0 實際組件互動為 single ReAct agent + 3 工具 + 8 個 Harness 模組：

```mermaid
graph TB
    subgraph "User Interfaces"
        LINE_APP["LINE App<br/>(一般用戶)"]
        CLI["main.py CLI<br/>(開發測試)"]
    end

    subgraph "External Services"
        LINE_API["LINE Messaging API"]
        VERTEX["Vertex AI<br/>(Gemini 2.5 Pro/Flash)"]
    end

    subgraph "agent/ (FastAPI + ReAct)"
        direction TB
        APP["app.py<br/>LINE Webhook"]

        subgraph "Harness Layer (8 flat modules)"
            H2["multimodal.py (H2)"]
            H3["debounce.py (H3)"]
            H_DC["data_correction.py (H_DC)"]
            H_QR["line_ui_factory.py (H_QR)"]
            H4["profile_updater.py (H4)"]
            H5["memory_manager.py (H5)"]
            H6["safety_gate.py (H6)"]
            H75["output_validator.py (H7.5)"]
        end

        subgraph "Agent Layer (Single ReAct)"
            REACT["agent.py<br/>create_react_agent(llm, tools)"]
            TOOL1["load_skill"]
            TOOL2["update_user_info"]
            TOOL3["transfer_to_human"]
            REACT --- TOOL1
            REACT --- TOOL2
            REACT --- TOOL3
        end

        subgraph "Infrastructure"
            SKILLS["skills/data/<br/>SKILL.md files"]
            FACTS["profiles/<br/>user_facts SCD2"]
            CKPT["memory/<br/>checkpointer"]
        end
    end

    subgraph "Data Stores"
        PG["PostgreSQL 16<br/>+ pgvector"]
    end

    LINE_APP --> LINE_API
    LINE_API -- "Webhook" --> APP
    CLI --> REACT

    APP --> H3
    H3 --> H6 --> H_DC --> H_QR --> REACT
    REACT --> H75 --> APP
    REACT --> H4 -.background.-> FACTS
    REACT --> H5 -.background.-> CKPT
    REACT --> H2 -.background.-> CKPT

    TOOL1 --> SKILLS
    TOOL2 --> FACTS
    REACT --> VERTEX
    APP --> LINE_API

    FACTS --> PG
    CKPT --> PG
```

#### 3.3.2 Vision — Multi-Agent StateGraph（規劃中，尚未實作）

> ⚠️ **Vision (not yet implemented)**: 以下圖示為 multi-agent sub-graph 願景。V1.0 已能以 single ReAct 支撐當前需求；此圖僅供未來重構參考。

```mermaid
graph TB
    subgraph "User Interfaces"
        LINE_APP["LINE App<br/>(一般用戶)"]
        CLI["main.py CLI<br/>(開發測試)"]
    end

    subgraph "External Services"
        LINE_API["LINE Messaging API"]
        VERTEX["Vertex AI<br/>(Gemini 2.5 Flash<br/>+ text-embedding-004)<br/><i>開發環境備選</i>"]
    end

    subgraph "LangGraph StateGraph"
        direction TB

        subgraph "Head Nodes (graph/nodes.py)"
            PP["pre_process"]
            MM["manage_memory"]
            RT["router"]
            MA["merge_answers"]
            UP["update_profile"]
            PO["post_process"]
        end

        subgraph "Harness Nodes (Phase 0 — disabled)"
            TD["task_decompose"]
            CA["context_assemble"]
            SG["safety_gate"]
            VA["verify_answer"]
            EC["entropy_check"]
        end

        subgraph "Agent Subgraphs (agents/)"
            HW["hardware_technician"]
            SR["sales_representative"]
            SA["store_assistant"]
            AS["app_specialist"]
            ML["manual_librarian"]
            WR["web_researcher"]
            RC["receptionist"]
        end
    end

    subgraph "Tools Layer (tools/)"
        DB_V["db_video<br/>(pgvector)"]
        DB_L["db_line_chat<br/>(pgvector)"]
        DB_W["db_website<br/>(pgvector)"]
        DB_Y["db_youtube<br/>(pgvector)"]
        DB_M["db_manuals<br/>(pgvector)"]
        DB_WS["db_web_search<br/>(DuckDuckGo)"]
        TH["transfer_to_human"]
    end

    subgraph "Data Stores"
        PG["PostgreSQL 16<br/>+ pgvector"]
    end

    LINE_APP --> LINE_API
    LINE_API -- "Webhook" --> PP
    CLI --> PP

    PP --> MM --> RT
    RT -- "Send() fan-out" --> HW & SR & SA & AS & ML & WR & RC
    HW & SR & SA & AS & ML & WR & RC --> MA
    MA --> UP --> PO

    HW --> DB_V
    SR --> DB_L
    SA --> DB_W
    AS --> DB_Y
    ML --> DB_M
    WR --> DB_WS
    RC --> TH

    DB_V & DB_L & DB_W & DB_Y & DB_M --> PG
    HW & SR & SA & AS & ML & WR --> VERTEX
    PO --> LINE_API
```

> **注意**：正式環境使用 Gemini 2.5 Flash 作為主要 LLM，透過 Vertex AI 存取。Provider 抽象層 (LLM Registry) 支援 config-driven 切換至其他供應商。

### 3.4 主要組件職責表

#### 3.4.1 Current — V1.0 實際組件

**Harness 層（8 flat modules）：** 詳見 §1.4 Harness 中介層表。

**Agent 層（Single ReAct + 3 Tools）：**

| 組件 | 檔案 | 核心職責 |
| :--- | :--- | :--- |
| **ReAct agent** | `agent/agent.py` | `create_react_agent(llm, tools)` 構建 single agent；system prompt 從 `prompts/system.md` 載入，skill list per-request 動態注入 |
| **load_skill** | `agent/skills/tools.py` | 載入 SOP 內容；含 brand gate（品牌不符拒絕載入）+ prefix matching fallback（`ts-door-stuck` 匹配 `ts-door-stuck-*` 系列） |
| **update_user_info** | `agent/skills/tools.py` | 寫入 user_facts（SCD Type 2）；用 `match_brand` / `match_model` 對 `agent/config.toml` 中的清單做標準化驗證 |
| **transfer_to_human** | `agent/skills/tools.py` | 轉接人工客服；自動填入已知 facts（phone, address, device）至表單模板 |

#### 3.4.2 Vision — Multi-Agent Components（規劃中）

> ⚠️ **Vision (not yet implemented)**: 以下表格為 multi-agent sub-graph 願景設計，**現有 V1.0 不對應這些檔案**。

**Head Nodes (Vision)：**

| 節點 | 預期檔案 | 願景職責 |
| :--- | :--- | :--- |
| **pre_process** | `agent/graph/nodes.py` | 訊息前處理：解析 LINE 事件、注入 user_profile、初始化 GraphState |
| **manage_memory** | `agent/graph/nodes.py` | 對話記憶管理：當 messages 超過閾值（50 則）觸發語意摘要壓縮，保留最近 20 對 |
| **router** | `agent/graph/nodes.py` | LLM 意圖分類：根據 `[[intents]]` 配置判斷 `next_agents` 清單，附帶最近 3 輪上下文濃縮問題 |
| **merge_answers** | `agent/graph/nodes.py` | 多 Agent 回覆匯流：合併 `ui_hints`，LLM 綜合多個 Agent 回答為單一連貫回覆 |
| **update_profile** | `agent/graph/nodes.py` | 使用者輪廓更新：從回覆中提取 phone/address/device_model 等 facts，寫入 ProfileManager |
| **post_process** | `agent/graph/nodes.py` | 回覆後處理：組裝 LINE Flex Message / 影片卡片 / 下載卡片，寫入審計日誌 |

**Harness Nodes (Vision)：**

| 節點 | 預期檔案 | 願景職責 | 啟用階段 |
| :--- | :--- | :--- | :--- |
| **task_decompose** | `agent/harness/task/decomposer.py` | L1：將複雜問題拆解為子任務，建立 ProblemCard | Phase 2 |
| **context_assemble** | `agent/harness/context/assembler.py` | L2：token budget 控制，source freshness 評分 | Phase 4 |
| **safety_gate** | `agent/harness/safety/gate.py` | L6：攔截危險指令（拆電路板、剪電線等） | Phase 3 |
| **verify_answer** | `agent/harness/feedback/verifier.py` | L5：回覆品質驗證，低於 0.6 分觸發 retry | Phase 5 |
| **entropy_check** | `agent/harness/entropy/checker.py` | L8：偵測新型解法，觸發 SOP 自動生成 | Phase 6 |

**Agent Sub-graphs (Vision)：**

| Agent | Label | 預期工具 | 預期知識庫 |
| :--- | :--- | :--- | :--- |
| **hardware_technician** | 硬體維修技師 | db_video, transfer_to_human | kb_video (pgvector) |
| **sales_representative** | 報價與客服專員 | db_line_chat, transfer_to_human | kb_line_chat (pgvector) |
| **store_assistant** | 門市與規格助理 | db_website, transfer_to_human | kb_website (pgvector) |
| **app_specialist** | APP 設定專家 | db_youtube, transfer_to_human | kb_youtube (pgvector) |
| **manual_librarian** | 說明書管理員 | db_manuals, transfer_to_human | kb_gdrive (pgvector) |
| **web_researcher** | 網路搜尋助手 | db_web_search, transfer_to_human | DuckDuckGo (即時搜尋) |
| **receptionist** | 前台接待專員 | transfer_to_human | 無（純對話） |

願景中每個 Agent 子圖內部結構相同：`START → agent_llm → [tool_calls? → tools → agent_llm] → END`（ReAct loop）。

### 3.5 關鍵用戶旅程

#### GraphState 資料結構（14 欄位） — Vision (not yet implemented)

> ⚠️ **Vision (not yet implemented)**: 下表 GraphState 為 multi-agent sub-graph 願景的共享狀態物件設計。V1.0 single ReAct 直接使用 LangGraph checkpointer 的 messages list，無需此複雜 state schema。

GraphState 是貫穿整個工作流的共享狀態物件，定義於（未來的）`agent/graph/state.py`：

| 欄位 | 型別 | Reducer | 用途 |
| :--- | :--- | :--- | :--- |
| `messages` | `list` | `add_messages` | Agent 對話歷史（LLM + Tool messages） |
| `question` | `str` | `_keep_last` | Router 濃縮後的使用者問題 |
| `user_profile` | `str` | `_keep_last` | 使用者輪廓（Markdown 格式） |
| `answer` | `str` | `_keep_last` | 最終回覆文字 |
| `history` | `list` | `operator.add` | 節點路徑追蹤（除錯用） |
| `summary` | `str` | `_keep_last` | 對話摘要（記憶體壓縮用） |
| `next_agents` | `list` | `_keep_last` | Router 派發的 Agent 清單 |
| `ui_hints` | `list` | `_add_or_reset` | UI metadata（影片卡、下載卡） |
| `response_ui` | `list` | `_keep_last` | 最終 LINE Message 物件 |
| `task` | `dict` | `_merge_dict` | L1 Harness：任務拆解 + ProblemCard |
| `context_meta` | `dict` | `_merge_dict` | L2 Harness：上下文品質指標 |
| `feedback` | `dict` | `_merge_dict` | L5 Harness：品質驗證結果 |
| `safety` | `dict` | `_merge_dict` | L6 Harness：安全審計軌跡 |
| `entropy` | `dict` | `_merge_dict` | L8 Harness：新型解法偵測 |

> Harness 欄位（task ~ entropy）預設為 `{}`，現有節點不讀寫這些欄位，確保零破壞。

#### 場景 1：用戶透過 LINE 諮詢電子鎖問題（V1.0 實際流程）

**前提：** 用戶已加入 LINE 官方帳號好友

```
1. 用戶在 LINE 發送：「我家的門鎖打不開了」
2. LINE Webhook POST → agent/app.py → Debounce buffer (1.5s 合併後續訊息)
3. Safety Gate (H6): regex 阻擋危險關鍵字
4. Data Correction (H_DC): 若含 #資料修正 → 寫 DB 跳過 agent
5. Quick Reply (H_QR): 若 brand 未知 → Quick Reply 蒐集 brand/model
6. Run agent (single ReAct):
   a. 載入 user facts (brand/model) 從 DB
   b. infer_brand_from_text 自動推論 brand
   c. 注入 [可用技能] + [用戶資料] + [前情提要] prefix 到 user message
   d. ReAct loop: LLM 自主決定 load_skill / update_user_info / transfer_to_human
   e. Tool 呼叫產生 ToolMessage，LLM 讀完繼續推理或產生最終 AIMessage
   f. 迴圈直到 LLM 不再發 tool_calls → 產生最終回覆
7. Output validator (H7.5): 阻擋洩漏內部機制的字串
8. Checkpoint cleanup: ToolMessage 內容換為 [已參考技能: {name}]、多模態換為 [使用者曾傳送圖片]
9. 背景: profile_updater (H4) LLM 抽取 phone/address；memory_manager (H5) 觸發壓縮；audit log (H8)
10. 透過 LINE Reply/Push API 回覆用戶
```

> ⚠️ **Vision flow**（multi-agent sub-graph 啟用後）：pre_process → manage_memory → router → Send() fan-out → 7 sub-agents → merge_answers → update_profile → post_process。

#### 場景 2：技師接收與完成派工單（V2.0 派工流程）

```
1. receptionist Agent 呼叫 transfer_to_human 工具 → 收集客戶聯絡資訊
2. Dispatch Engine 建立 WorkOrder（關聯 ProblemCard）
3. 智能匹配：技能 × 地區 × 歷史評分 → 選出 Top-1 技師
4. WebSocket 即時通知 → 技師 Web App 接單
5. 技師到場打卡 → 完成服務 → 上傳照片
6. Accounting Module 產生 Invoice → 管理員審核 → Closed
```

#### 場景 3：知識庫自演化 — Vision (not yet implemented)

> ⚠️ **Vision (not yet implemented)**: 此流程依賴 Harness L8 (Entropy Management) 啟用，目前未實作。實際 V1.0 知識庫更新由 `data/` 目錄 Medallion ETL pipeline 從外部來源（YouTube / Website / Google Drive）人工 + 半自動產出 SKILL.md，經 `data/pipeline/silver_to_skill/approve_drafts.py` 審核後寫入 `agent/skills/data/`。

```
1. entropy_check 偵測到新型解法（similarity < 0.3）
2. SOP Generator 自動草擬結構化 SOP
3. 管理員審核 → 通過 → 計算 Embedding → 加入 pgvector 知識庫
4. 未來同類問題可被 Agent 直接檢索命中
```

### 3.6 V1↔V2 整合架構：ProblemCard → WorkOrder 資料橋接

V1.0（AI 客服）與 V2.0（派工/帳務）透過 **ProblemCard** 作為資料橋接點。當 AI 三層解決機制判斷為 L3（需派工）時，系統啟動 Dispatch Pipeline。

#### 資料橋接流程

```mermaid
flowchart TB
    subgraph V1["V1.0 AI Customer Service (agent/)"]
        LINE["LINE 用戶訊息"] --> GRAPH["LangGraph StateGraph"]
        GRAPH --> L1_3["L1/L2 Resolution<br/>(自助解決)"]
        GRAPH --> L3["L3 Escalation<br/>(需要派工)"]
        GRAPH --> PC["ProblemCard<br/>status=escalated<br/>domain_attributes JSONB"]
    end

    subgraph BRIDGE["資料橋接點"]
        PC -->|"FK: problem_card_id"| WO["WorkOrder<br/>status=created"]
    end

    subgraph V2["V2.0 Dispatch & Accounting"]
        WO --> DISPATCH["Dispatch Engine<br/>技師匹配 (skill × region × rating)"]
        DISPATCH --> PRICING["Pricing Engine<br/>報價 (brand × lock_type × difficulty)"]
        PRICING --> NOTIFY["Push Notification<br/>技師接單池"]
        NOTIFY --> ACCEPT["技師接單<br/>WorkOrder.status=accepted"]
        ACCEPT --> COMPLETE["完工回報<br/>photos + GPS + materials"]
        COMPLETE --> INVOICE["Invoice 生成"]
        INVOICE --> SETTLE["月結對帳<br/>Reconciliation"]
    end

    ACCEPT -->|"LINE Push"| LINE2["通知用戶：技師已出發"]

    style V1 fill:#f3e5f5,stroke:#7b1fa2
    style BRIDGE fill:#fff3e0,stroke:#e65100
    style V2 fill:#e8f5e9,stroke:#2e7d32
```

#### L3 Escalation 原子事務

當 `transfer_to_human` 工具被觸發時，系統在**單一 database transaction** 中完成：

```python
async with db.begin():
    # 1. ProblemCard 狀態更新
    problem_card.status = "escalated"
    problem_card.resolution_level = "L3_escalation"

    # 2. 建立 WorkOrder (FK → ProblemCard)
    work_order = WorkOrder(
        problem_card_id=problem_card.card_id,
        customer_user_id=problem_card.user_id,
        description=problem_card.symptom_summary,
        domain_attributes=problem_card.domain_attributes,  # 繼承 JSONB
        estimated_price=await pricing_engine.estimate(problem_card),
    )

    # 3. 技師匹配 (async, 不阻塞 transaction)
    candidates = await dispatch_engine.match(work_order)

    # 4. 建立 Assignment 候選 (batch insert)
    assignments = [Assignment(work_order_id=work_order.id, technician_id=t.id) for t in candidates[:5]]
```

事務失敗時 ProblemCard 狀態不變（仍為 diagnosing），用戶看到「正在尋找技師」的 LINE 訊息。

#### V1↔V2 共享資料模型

| 實體 | V1.0 寫入 | V2.0 讀取/寫入 | 橋接欄位 |
|---|---|---|---|
| **ProblemCard** | 建立、填充 domain_attributes | 讀取 symptom + domain_attributes → 建立 WorkOrder | `card_id` (PK) |
| **User** | LINE 綁定、profile 更新 | 技師角色擴展、RBAC | `user_id` + `role` enum |
| **User_Facts** | phone, address, device_model | technician skill, service_region | `attr_key` 擴展 |
| **Audit_Log** | 對話記錄 | 派工記錄、計價記錄 | `log_type` 擴展 |

#### 架構決策：為什麼不拆微服務

| 評估面向 | Monolith | Microservices | 結論 |
|---|---|---|---|
| **Concurrent users** | 100 (目標) vs 2000+ (容量) | 每服務需獨立 infra + 運維 | 容量富餘 20 倍，**不需拆** |
| **團隊規模** | 1-3 人 | 每服務至少 1 人維護 | 人力不足，**不能拆** |
| **資料一致性** | Single DB transaction | 分散式事務 (Saga pattern) | L3 escalation 需原子性，**不該拆** |
| **部署複雜度** | 1 container + 1 DB + 1 Redis | N containers + service mesh + API gateway | 運維成本高，**不值得拆** |
| **開發效率** | 共用 model / config / harness | 重複定義 schema + 跨服務 API | Monolith 快 3-5 倍 |

**拆分觸發條件**（未來評估）：
1. Concurrent users 穩定超過 **500** 且不同模組 scaling profile 明顯不同
2. 團隊超過 **8 人** 且各組之間的 merge conflict 頻繁
3. Dispatch 的 P99 延遲超過 **5 秒** 且已完成 async + cache 優化仍不足

在這三個條件**同時成立**之前，monolith 是正確選擇。

---

## 第 4 部分：技術選型詳述

### 4.1 技術選型原則

| 原則 | 說明 |
| :--- | :--- |
| **實用主義優先** | 解決實際問題，拒絕過度設計。技術選型需匹配團隊規模與專案階段 |
| **成熟穩定** | 優先選擇有活躍社群、良好文檔、生產驗證的技術 |
| **團隊技能對齊** | 在滿足需求的前提下，優先選擇團隊熟悉的技術棧 |
| **簡潔部署** | V1.0 階段以 Docker Compose 單機部署為目標，避免引入不必要的基礎設施複雜度 |
| **可演進性** | 架構設計需預留 V2.0 擴展空間，但不提前實現 |

### 4.2 技術棧詳情

| 分類 | 選用技術 | 選擇理由 (Justification) | 考量的備選方案 | 風險/成熟度 | 相關 ADR |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **後端框架** | Python 3.11+ / FastAPI | 1. 原生 async/await 支援，適合 I/O 密集的 LLM 呼叫場景<br/>2. 自動 OpenAPI 文檔生成，降低 API 文檔維護成本<br/>3. Pydantic 整合提供強型別驗證<br/>4. Python 生態在 AI/ML 領域最為豐富 | **Django REST Framework**: 功能全面但較重，async 支援尚不成熟<br/>**Node.js / Express**: 非同步效能佳，但 Python 在 AI 生態更強<br/>**Go / Gin**: 高效能，但 LLM 庫生態不如 Python | 成熟 (Mature) | ADR-001 |
| **LLM 框架** | LangChain 0.2+ | 1. 統一抽象層，便於切換 LLM Provider<br/>2. 內建 Chain/Agent 編排能力<br/>3. RAG pipeline 原生支援<br/>4. Prompt Template 管理<br/>5. 活躍社群與豐富文檔 | **直接使用 Google AI SDK**: 更輕量，但缺乏抽象層與 RAG 支援<br/>**LlamaIndex**: RAG 專精，但通用性不如 LangChain<br/>**Semantic Kernel**: 微軟出品，Python 支援較弱 | 成熟但迭代快 | ADR-003 |
| **LLM 模型** | Google Gemini 2.5 Flash | 1. 目前最佳的多模態理解能力（可處理用戶上傳的門鎖照片）<br/>2. 中文對話品質優異<br/>3. Function Calling 支援結構化輸出<br/>4. 穩定的 API 可用性 | **Claude 3.5 Sonnet**: 同等級能力，但中文場景資料較少<br/>**OpenAI GPT-4o**: 同等級能力，成熟穩定<br/>**本地部署 LLM**: 延遲低但硬體成本高，品質不及 Gemini 2.5 Flash | 成熟 (Mature) | ADR-003 |
| **Embedding 模型** | text-embedding-004 | 1. 768 維向量，平衡精度與成本<br/>2. 與 Gemini 2.5 Flash 同一供應商，降低整合複雜度<br/>3. 支援 dimensions 參數可降維<br/>4. 多語言支援優異 | **OpenAI text-embedding-3-small**: 1536 維，精度高但增加供應商依賴<br/>**Cohere Embed**: 多語言能力強，但增加供應商依賴<br/>**本地 BERT**: 零成本但精度差且需維護 GPU | 成熟 (Mature) | ADR-008 |
| **資料庫** | PostgreSQL 16 + pgvector | 1. 單一資料庫同時提供關聯式與向量儲存，架構最簡<br/>2. pgvector 支援 HNSW 索引，查詢效能滿足需求<br/>3. 團隊熟悉 PostgreSQL<br/>4. 成熟的備份、複製、監控生態 | **PostgreSQL + Pinecone**: 向量搜尋更專業，但增加基礎設施與成本<br/>**PostgreSQL + Milvus**: 自建向量 DB，運維複雜度高<br/>**MongoDB + Atlas Vector**: 文件型 DB，但本專案需要強事務保證 | 成熟 (Mature) | ADR-002 |
| **快取** | Redis 7+ | 1. 對話 Session 暫存（TTL 30 分鐘）<br/>2. Rate Limiting（LINE Webhook 防洪）<br/>3. 極低延遲（< 1ms）<br/>4. 成熟穩定，運維成本低 | **Memcached**: 更簡單但功能不足（無 TTL 精細控制）<br/>**Application Memory Cache**: 不支援多 Worker 共享 | 成熟 (Mature) | ADR-005 |
| **前端 (V2.0)** | Next.js 14+ / TypeScript | 1. React 生態系最成熟的全端框架<br/>2. SSR/SSG 提升首屏載入速度<br/>3. TypeScript 型別安全<br/>4. App Router 簡化路由管理 | **Nuxt.js (Vue)**: 同類框架，但 React 生態更大<br/>**SvelteKit**: 更輕量但生態較小<br/>**純 React SPA**: 無 SSR 支援，SEO 與首屏效能較差 | 成熟 (Mature) | ADR-006 |
| **Admin UI (V1.0)** | Jinja2 + HTMX | 1. 伺服器端渲染，無需前端建置流程<br/>2. HTMX 提供類 SPA 體驗，但不需要 JavaScript 框架<br/>3. V1.0 快速交付，V2.0 再遷移至 Next.js | **直接用 Next.js**: 功能更強，但 V1.0 階段前端工作量太大<br/>**Streamlit**: 快速原型，但自訂性差 | 成熟 (Mature) | ADR-006 |
| **容器化** | Docker + docker-compose | 1. 開發環境與部署環境一致<br/>2. 所有服務（API, DB, Redis）一鍵啟動<br/>3. 團隊熟悉，學習成本為零 | **Kubernetes**: V1.0 階段 overkill<br/>**Podman**: Docker 相容但生態較小 | 成熟 (Mature) | ADR-007 |
| **CI/CD** | GitHub Actions | 1. 與 GitHub 程式碼倉庫無縫整合<br/>2. 社群 Actions 豐富<br/>3. 免費額度足夠小型團隊使用 | **GitLab CI**: 功能強大但需遷移倉庫<br/>**Jenkins**: 靈活但維護成本高 | 成熟 (Mature) | - |
| **LINE 整合** | line-bot-sdk-python 3+ | 1. LINE 官方維護的 Python SDK<br/>2. Webhook 簽章驗證內建<br/>3. Flex Message Builder API | **自行實作 HTTP Client**: 靈活但重複造輪子 | 成熟 (Mature) | - |
| **ORM** | SQLAlchemy 2.0+ (Async) | 1. Python 生態最成熟的 ORM<br/>2. 2.0 版原生 async 支援<br/>3. 靈活的查詢構建能力<br/>4. 搭配 Alembic 做 Schema 遷移 | **Tortoise ORM**: async 原生但生態較小<br/>**SQLModel**: 基於 SQLAlchemy + Pydantic，但功能受限 | 成熟 (Mature) | - |
| **PDF 解析** | PyMuPDF (fitz) | 1. 解析速度快，記憶體效率高<br/>2. 支援文本提取與頁面結構解析<br/>3. 開源免費 | **pdfplumber**: 表格解析強但速度慢<br/>**Apache Tika**: 功能全面但需 Java Runtime | 成熟 (Mature) | - |
| **測試** | pytest + pytest-asyncio | 1. Python 標準測試框架<br/>2. 豐富的插件生態<br/>3. fixture 機制簡化測試資料準備<br/>4. pytest-asyncio 支援 async 測試 | **unittest**: 標準庫但功能較弱 | 成熟 (Mature) | - |

---

## 第 5 部分：數據架構

> **Schema 檔案參考**：核心 Schema 定義於 `SQL/Schema.sql`，V2.0 業務擴展定義於 `SQL/Schema_v2_extensions.sql`。
>
> **Schema_v2_extensions.sql** 新增 6 張業務表：
>
> | 表名 | 所屬上下文 | 說明 |
> | :--- | :--- | :--- |
> | `disputes` | DisputeResolution | 客訴/爭議案件主表 |
> | `refund_requests` | DisputeResolution | 退款申請與審批紀錄 |
> | `warranty_records` | Warranty | 保固紀錄與保固期限 |
> | `inventory_items` | Inventory | 零件庫存主表 |
> | `stock_movements` | Inventory | 庫存進出異動紀錄 |
> | `brands` | BrandManagement | 品牌/型號主檔 |

### 5.1 數據模型

#### ER 圖 (Entity Relationship Diagram)

```mermaid
erDiagram
    %% ===== V1.0 核心實體 =====

    User {
        uuid id PK
        string line_user_id UK "LINE platform user ID"
        string display_name
        string phone "nullable - collected at L3"
        string email "nullable"
        string role "line_user | admin | family_reviewer | technician"
        timestamp created_at
        timestamp updated_at
    }

    Conversation {
        uuid id PK
        uuid user_id FK
        string session_id UK "unique session identifier"
        string status "active | collecting | resolving | resolved | escalated | expired"
        jsonb context "multi-turn conversation context"
        int message_count
        timestamp started_at
        timestamp resolved_at "nullable"
        timestamp expired_at "nullable"
        timestamp created_at
        timestamp updated_at
    }

    Message {
        uuid id PK
        uuid conversation_id FK
        string role "user | assistant | system"
        string content_type "text | image | location | flex"
        text content
        jsonb metadata "token usage, latency, etc."
        timestamp created_at
    }

    ProblemCard {
        uuid id PK
        uuid conversation_id FK "one-to-one"
        string brand "nullable - e.g. Yale, Samsung"
        string model "nullable - e.g. YDM-4109"
        string location "nullable - address or area"
        string door_status "nullable - locked | unlocked | jammed | unknown"
        string network_status "nullable - online | offline | unknown"
        text symptoms "user-described symptoms"
        string intent "inquiry | repair | complaint | other"
        string status "incomplete | complete | resolved | escalated"
        float completeness_score "0.0 to 1.0"
        string resolution_level "nullable - L1 | L2 | L3"
        jsonb extracted_fields "AI-extracted raw fields"
        timestamp created_at
        timestamp updated_at
    }

    CaseEntry {
        uuid id PK
        string title
        text problem_description
        text solution
        string brand "nullable - applicable brand"
        string lock_type "nullable - applicable lock type"
        string difficulty "easy | medium | hard"
        vector embedding "1536-dim pgvector"
        string source "manual_input | sop_approved | imported"
        uuid approved_by FK "nullable - admin who approved"
        boolean is_active
        int hit_count "times matched in L1"
        timestamp created_at
        timestamp updated_at
    }

    ManualChunk {
        uuid id PK
        uuid manual_id FK
        string source_pdf "filename of source PDF"
        int page_number
        string chapter_title "nullable"
        text content
        int token_count
        vector embedding "1536-dim pgvector"
        timestamp created_at
    }

    Manual {
        uuid id PK
        string filename
        string brand
        string model "nullable"
        int total_pages
        int total_chunks
        string status "processing | completed | failed"
        uuid uploaded_by FK
        timestamp created_at
    }

    SOPDraft {
        uuid id PK
        uuid source_conversation_id FK "originating conversation"
        string title
        text applicable_conditions "when to apply this SOP"
        jsonb steps "ordered list of solution steps"
        text notes "additional notes / warnings"
        string status "pending_review | approved | rejected | revised"
        uuid reviewed_by FK "nullable"
        text review_comment "nullable"
        timestamp created_at
        timestamp reviewed_at "nullable"
    }

    %% ===== V2.0 擴展實體 =====

    Technician {
        uuid id PK
        uuid user_id FK "links to User"
        string name
        string phone
        string email
        jsonb capabilities "list of brand/lock_type skills"
        jsonb service_regions "list of serviceable areas"
        jsonb availability "weekly schedule slots"
        float rating "1.0 to 5.0"
        int completed_orders
        string status "active | inactive | suspended"
        timestamp created_at
        timestamp updated_at
    }

    WorkOrder {
        uuid id PK
        uuid problem_card_id FK
        uuid technician_id FK "nullable until assigned"
        uuid created_by FK "system or admin"
        string status "created | assigned | accepted | rejected | in_progress | completed | closed | cancelled"
        string priority "low | medium | high | urgent"
        text customer_name
        string customer_phone
        string customer_address
        timestamp scheduled_at "nullable"
        timestamp accepted_at "nullable"
        timestamp started_at "nullable"
        timestamp completed_at "nullable"
        text service_report "nullable - technician's report"
        jsonb photos "nullable - uploaded photo URLs"
        float estimated_price
        float final_price "nullable"
        timestamp created_at
        timestamp updated_at
    }

    PriceRule {
        uuid id PK
        string brand
        string lock_type
        string difficulty "easy | medium | hard"
        float base_price
        float labor_cost
        float parts_cost "nullable"
        jsonb modifiers "surcharges, discounts, etc."
        boolean is_active
        timestamp created_at
        timestamp updated_at
    }

    Invoice {
        uuid id PK
        uuid work_order_id FK
        string invoice_number UK
        float amount
        float tax
        float total
        string status "draft | issued | paid | cancelled"
        jsonb line_items "service breakdown"
        timestamp issued_at "nullable"
        timestamp paid_at "nullable"
        timestamp created_at
        timestamp updated_at
    }

    %% ===== Relationships =====

    User ||--o{ Conversation : "initiates"
    Conversation ||--o{ Message : "contains"
    Conversation ||--|| ProblemCard : "produces"
    Conversation ||--o| SOPDraft : "generates"
    Manual ||--o{ ManualChunk : "split into"
    User ||--o| Technician : "is a (V2.0)"
    ProblemCard ||--o| WorkOrder : "escalates to (V2.0)"
    Technician ||--o{ WorkOrder : "assigned to (V2.0)"
    WorkOrder ||--o| Invoice : "produces (V2.0)"
```

#### 表格索引策略

| 表 | 索引名稱 | 欄位 | 類型 | 用途 |
| :--- | :--- | :--- | :--- | :--- |
| `conversations` | `idx_conv_user_status` | `(user_id, status)` | B-tree | 查詢用戶活躍對話 |
| `conversations` | `idx_conv_session` | `(session_id)` | B-tree (Unique) | Session 查詢 |
| `messages` | `idx_msg_conv_created` | `(conversation_id, created_at)` | B-tree | 對話訊息時序查詢 |
| `problem_cards` | `idx_pc_status` | `(status)` | B-tree | 按狀態篩選問題卡 |
| `problem_cards` | `idx_pc_brand_model` | `(brand, model)` | B-tree | 按品牌型號篩選 |
| `case_entries` | `idx_ce_embedding` | `(embedding)` | HNSW (pgvector) | 向量相似度搜尋 |
| `case_entries` | `idx_ce_brand_active` | `(brand, is_active)` | B-tree | 品牌篩選 + 啟用狀態 |
| `manual_chunks` | `idx_mc_embedding` | `(embedding)` | HNSW (pgvector) | 向量相似度搜尋 |
| `manual_chunks` | `idx_mc_manual` | `(manual_id)` | B-tree | 按手冊查詢 chunks |
| `work_orders` | `idx_wo_tech_status` | `(technician_id, status)` | B-tree | 技師工單查詢 |
| `work_orders` | `idx_wo_status_priority` | `(status, priority)` | B-tree | 待派工工單排序 |
| `invoices` | `idx_inv_wo` | `(work_order_id)` | B-tree | 工單帳務查詢 |

### 5.2 數據流圖

#### 用戶諮詢的數據流

```mermaid
graph LR
    subgraph "Input"
        LM["LINE Message<br/>(text/image/location)"]
    end

    subgraph "Processing Pipeline"
        WH["Webhook Handler<br/>Parse & Validate"]
        CM["Conversation Manager<br/>Load/Create Session"]
        PCE["ProblemCard Engine<br/>Extract Fields (LLM)"]
        L1["L1: Vector Search<br/>(pgvector cosine similarity)"]
        L2["L2: AI Reasoning<br/>(RAG - Gemini 2.5 Flash)"]
        L3["L3: Escalation<br/>(Human / WorkOrder)"]
    end

    subgraph "Data Stores"
        REDIS["Redis<br/>Session Cache"]
        PG_CONV["PostgreSQL<br/>conversations, messages"]
        PG_PC["PostgreSQL<br/>problem_cards"]
        PG_KB["PostgreSQL + pgvector<br/>case_entries, manual_chunks"]
        PG_WO["PostgreSQL<br/>work_orders (V2.0)"]
    end

    subgraph "Output"
        REPLY["LINE Reply<br/>(Flex Message)"]
    end

    LM --> WH
    WH --> CM
    CM -->|"R/W session"| REDIS
    CM -->|"save messages"| PG_CONV
    CM --> PCE
    PCE -->|"save/update"| PG_PC
    PCE --> L1
    L1 -->|"vector query"| PG_KB
    L1 -->|"hit"| REPLY
    L1 -->|"miss"| L2
    L2 -->|"RAG context"| PG_KB
    L2 -->|"resolved"| REPLY
    L2 -->|"unresolved"| L3
    L3 -->|"create order"| PG_WO
    L3 --> REPLY
```

### 5.3 數據一致性策略

本系統為 Modular Monolith，所有模組共享同一個 PostgreSQL 實例，因此：

| 場景 | 一致性需求 | 策略 | 說明 |
| :--- | :--- | :--- | :--- |
| **Conversation + ProblemCard 建立** | 強一致性 | PostgreSQL Transaction | 對話與問題卡必須原子性寫入，使用 SQLAlchemy 的 Session Transaction |
| **CaseEntry 更新 + Embedding 計算** | 最終一致性 | 非同步任務 | Embedding 計算是 I/O 密集操作（呼叫 Google AI API），允許短暫延遲。先寫入 CaseEntry，再異步計算 Embedding 並回寫 |
| **WorkOrder 建立 + 技師通知** | 最終一致性 | 事件驅動 | 工單寫入 DB 成功後發布 Domain Event，通知模組非同步推送 |
| **WorkOrder 完成 + Invoice 建立** | 強一致性 | PostgreSQL Transaction | 服務完成確認與帳務記錄必須原子性寫入 |
| **Session Cache (Redis) + DB** | 最終一致性 | Cache-Aside Pattern | Redis 作為快取層，DB 為最終事實來源。Session 過期或丟失時從 DB 重建 |

**備份策略：**

- 每日 01:00 AM (UTC+8) 執行 `pg_dump` 全量備份
- 備份檔案保留 7 天，超過自動清理
- 備份檔案壓縮後存放至獨立的備份目錄（或 S3 bucket）
- 每月執行一次備份恢復驗證

### 5.4 向量索引策略

#### pgvector 配置

| 參數 | 值 | 說明 |
| :--- | :--- | :--- |
| **向量維度** | 768 | text-embedding-004 輸出維度 |
| **索引類型** | HNSW | 查詢效能優於 IVFFlat，無需訓練，適合增量更新 |
| **距離函數** | cosine | 語義相似度搜尋的標準選擇 |
| **HNSW m** | 16 | 每層最大連接數，平衡精度與建索引速度 |
| **HNSW ef_construction** | 64 | 建索引時的搜尋寬度，越高越精確但越慢 |
| **ef_search** | 40 | 查詢時的搜尋寬度，runtime 可調整 |

#### 索引建立 SQL

```sql
-- CaseEntry 向量索引
CREATE INDEX idx_case_entry_embedding ON case_entries
USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64);

-- ManualChunk 向量索引
CREATE INDEX idx_manual_chunk_embedding ON manual_chunks
USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64);

-- 查詢時設定 ef_search
SET hnsw.ef_search = 40;
```

#### 搜尋策略

```
L1 解決機制的向量搜尋流程：

1. 將 ProblemCard 的 symptoms + brand + model 組合為查詢文本
2. 呼叫 Embedding API 計算查詢向量
3. 兩路查詢：
   a. CaseEntry 向量搜尋 (cosine similarity, top-5)
   b. ManualChunk 向量搜尋 (cosine similarity, top-5)
4. 合併結果，以相似度分數排序
5. 最高分 >= 0.85 -> L1 命中
6. 0.70 <= 最高分 < 0.85 -> 作為 L2 RAG 上下文
7. 最高分 < 0.70 -> 標記為低信心，仍傳給 L2 參考
```

#### 資料量預估與效能

| 指標 | 預估值 (V1.0 上線後 6 個月) | 說明 |
| :--- | :--- | :--- |
| CaseEntry 數量 | 500 - 2,000 筆 | 初始導入 + SOP 審核上架 |
| ManualChunk 數量 | 5,000 - 20,000 筆 | 取決於上傳的 PDF 手冊數量 |
| 向量索引記憶體 | ~100 MB | 每個 1536 維 float32 向量約 6KB，20K 筆約 120MB |
| 單次向量搜尋延遲 | < 10ms | HNSW 在此規模下查詢極快 |
| Embedding 計算延遲 | ~200ms / 次 | Google AI API 呼叫（含網路） |

---

## 第 6 部分：部署與基礎設施

### 6.1 部署視圖

V1.0 生產環境部署於 **GCP Cloud Run**（managed serverless container），透過 `scripts/deploy/agent.sh` 與 `scripts/deploy/api.sh` 驅動。Container build 採用 **multi-stage Dockerfile + uv** 確保可重現 build；image tag 為 `{git-sha}-{timestamp}` 格式以支援回滾。完整部署流程與 Dockerfile 範本詳見 [E9 部署運維指南](../04-deliver/E9--deployment-and-runbooks.md)。

**Dockerfile 設計原則（V1.0 上線版本）：**

- 使用 **multi-stage build**：builder 階段（含 build deps）與 runtime 階段（僅 `.venv` 與必要 source）分離
- 利用 `uv.lock` 釘版做可重現 build：runtime 執行 `uv sync --frozen --no-dev` 確保不帶 dev deps（如 `ruff` / `pytest`）
- 使用官方 `astral-sh/uv` Docker layer，避免下載未驗證的安裝腳本
- 容器以非 root 使用者執行
- 不使用 `latest` tag，明確鎖定基底 image 版本

**環境變數三層 SSOT：**

| 檔案 | 用途 | DB 連線 |
| :--- | :--- | :--- |
| `.env.example` | 通用範本（入版本控制） | placeholder |
| `.env.local.example` | 本機開發（docker DB on port 5433） | `postgresql://...@localhost:5433/...` |
| `.env.gcp.example` | GCP Cloud SQL via cloud-sql-proxy（port 5432） | 從 Secret Manager 取，自動 URL encode |

實際 `.env*` 為 SSOT，本文件不重述其值；切換邏輯由 `scripts/env/use-local.sh` / `scripts/env/use-gcp.sh` 管理（詳見 E9）。

> ⚠️ **Legacy / Vision deployment topology**: 以下 Docker Compose + Nginx 拓撲為早期 VPS 部署設計，**現已遷移至 Cloud Run**。保留此圖供未來 self-host 部署參考。

```mermaid
graph TB
    subgraph "Host Machine (VPS / Cloud VM)"
        subgraph "Docker Network: smartlock-net"

            subgraph "Reverse Proxy"
                NGINX["Nginx<br/>---<br/>SSL Termination<br/>Reverse Proxy<br/>Static File Serving<br/>Rate Limiting<br/>---<br/>Port: 80, 443"]
            end

            subgraph "Application Tier"
                API1["FastAPI App<br/>(Worker 1)<br/>---<br/>Uvicorn<br/>Port: 8000"]
                API2["FastAPI App<br/>(Worker 2)<br/>---<br/>Uvicorn<br/>Port: 8001"]
            end

            subgraph "Frontend Tier (V2.0)"
                NEXT["Next.js App<br/>---<br/>SSR / Static<br/>Port: 3000"]
            end

            subgraph "Data Tier"
                PG["PostgreSQL 16<br/>+ pgvector<br/>---<br/>Port: 5432<br/>Volume: pg_data"]
                RD["Redis 7<br/>---<br/>Port: 6379<br/>Volume: redis_data"]
            end

            subgraph "Utility"
                BACKUP["Backup CronJob<br/>---<br/>Daily pg_dump<br/>Volume: backup_data"]
            end
        end
    end

    subgraph "External"
        INTERNET["Internet<br/>(LINE Users / Admins / Technicians)"]
        LINE_SRV["LINE Platform"]
        GOOGLE_AI_SRV["Google AI API"]
    end

    INTERNET -- "HTTPS :443" --> NGINX
    LINE_SRV -- "Webhook POST :443" --> NGINX
    NGINX -- "Proxy Pass :8000/8001" --> API1
    NGINX -- "Proxy Pass :8000/8001" --> API2
    NGINX -- "Proxy Pass :3000" --> NEXT
    NEXT -- "API Call :8000" --> API1
    API1 -- "SQL :5432" --> PG
    API2 -- "SQL :5432" --> PG
    API1 -- "Cache :6379" --> RD
    API2 -- "Cache :6379" --> RD
    API1 -- "HTTPS" --> GOOGLE_AI_SRV
    API2 -- "HTTPS" --> GOOGLE_AI_SRV
    API1 -- "HTTPS" --> LINE_SRV
    BACKUP -- "pg_dump :5432" --> PG
```

#### docker-compose.yml 服務定義

| 服務名稱 | Image | 端口 | 環境變數 | Volume | 備註 |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `nginx` | nginx:alpine | 80, 443 | - | `./nginx/conf.d`, `./certs` | SSL 終止、反向代理 |
| `api` | 自建 Dockerfile | 8000 (internal) | `DATABASE_URL`, `REDIS_URL`, `GOOGLE_API_KEY`, `LINE_CHANNEL_SECRET`, `LINE_CHANNEL_ACCESS_TOKEN`, `JWT_SECRET` | `./uploads` | 可用 `--scale api=2` 水平擴展 |
| `web` (V2.0) | 自建 Dockerfile | 3000 (internal) | `NEXT_PUBLIC_API_URL` | - | Next.js SSR |
| `postgres` | postgres:16-alpine | 5432 (internal) | `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD` | `pg_data` | 啟用 pgvector extension |
| `redis` | redis:7-alpine | 6379 (internal) | - | `redis_data` | 持久化 appendonly |
| `backup` | postgres:16-alpine | - | - | `backup_data` | cron 排程 pg_dump |

### 6.2 CI/CD 流程

> 📌 **CI/CD 詳細範本**：詳見 [E9 部署運維指南](../04-deliver/E9--deployment-and-runbooks.md)。CI workflow 採用 `astral-sh/setup-uv@v3` + `uv sync --frozen` 對齊 Dockerfile 的 uv 釘版策略。

下圖為高層次流程示意：

```mermaid
graph LR
    subgraph "Developer"
        DEV["git push<br/>to feature branch"]
    end

    subgraph "GitHub Actions Pipeline"
        subgraph "PR Pipeline"
            LINT["Step 1: Lint<br/>---<br/>ruff check<br/>mypy type check"]
            TEST["Step 2: Test<br/>---<br/>pytest<br/>(unit + integration)<br/>coverage >= 70%"]
            BUILD["Step 3: Build<br/>---<br/>docker build<br/>image validation"]
        end

        subgraph "Main Pipeline (after merge)"
            TAG["Step 4: Tag<br/>---<br/>Semantic Version<br/>Git Tag"]
            PUSH["Step 5: Push Image<br/>---<br/>Push to<br/>Container Registry"]
            DEPLOY["Step 6: Deploy<br/>---<br/>SSH + docker-compose pull<br/>Rolling restart"]
            SMOKE["Step 7: Smoke Test<br/>---<br/>Health check<br/>API validation"]
        end
    end

    subgraph "Production"
        PROD["Production Server<br/>docker-compose up"]
    end

    DEV --> LINT
    LINT -->|pass| TEST
    TEST -->|pass| BUILD
    BUILD -->|merge to main| TAG
    TAG --> PUSH
    PUSH --> DEPLOY
    DEPLOY --> SMOKE
    SMOKE --> PROD
```

#### CI/CD 詳細步驟

| 步驟 | 觸發條件 | 工具 | 動作 | 失敗處理 |
| :--- | :--- | :--- | :--- | :--- |
| **Lint** | PR opened / push | `ruff`, `mypy` | 程式碼風格檢查、型別檢查 | 阻擋 PR merge |
| **Test** | PR opened / push | `pytest`, `pytest-cov` | 單元測試 + 整合測試，覆蓋率門檻 70% | 阻擋 PR merge |
| **Build** | PR opened / push | `docker build` | 驗證 Docker Image 可成功建置 | 阻擋 PR merge |
| **Tag** | merge to main | GitHub Actions | 自動生成語義化版本 Tag | 手動介入 |
| **Push Image** | tag created | Docker Registry | 推送帶版本 Tag 的 Image | 重試 3 次 |
| **Deploy** | image pushed | SSH + docker-compose | `docker-compose pull && docker-compose up -d` | 回滾至前一版本 |
| **Smoke Test** | deploy completed | curl + custom script | 健康檢查端點、關鍵 API 驗證 | 自動回滾 + 告警 |

### 6.3 環境策略

| 環境 | 用途 | 基礎設施 | 資料 | 外部服務 |
| :--- | :--- | :--- | :--- | :--- |
| **Development** | 本地開發與除錯 | Docker Compose (local) | SQLite / PostgreSQL (local)，Mock 資料 | LINE Bot: 使用 ngrok 暫時隧道。Google AI: 開發帳號（設定用量上限） |
| **Staging** | 整合測試、UAT 驗收 | Docker Compose (VPS) | PostgreSQL (staging)，匿名化生產資料副本 | LINE Bot: 獨立的 Staging Channel。Google AI: 開發帳號 |
| **Production** | 正式運行環境 | Docker Compose (VPS/Cloud) | PostgreSQL (production)，每日備份 | LINE Bot: 正式 Channel。Google AI: 正式帳號 |

**環境隔離原則：**
- 每個環境使用獨立的 `.env` 檔案，絕不共享密鑰
- Staging 與 Production 使用獨立的 LINE Channel
- 生產 API Key 僅存在於生產環境的密鑰管理中
- 開發環境使用 Google AI 帳號的用量上限 (usage cap) 防止誤用

---

## 第 7 部分：跨領域考量

### 7.1 可觀測性

#### 日誌 (Logging)

| 項目 | 規範 |
| :--- | :--- |
| **格式** | JSON 結構化日誌 |
| **框架** | Python `structlog` |
| **等級** | DEBUG (dev) / INFO (staging, prod) |
| **必含欄位** | `timestamp`, `level`, `message`, `request_id`, `user_id` (if available), `module` |
| **LLM 呼叫日誌** | 記錄 prompt_tokens, completion_tokens, total_cost, latency_ms, model, resolution_level |
| **敏感資料** | 日誌中禁止記錄用戶完整訊息內容（僅記錄 message_id 與 content_type） |
| **收集方式** | V1.0: Docker logs + log rotation。V2.0: 可接入 Loki / ELK |
| **保留期限** | 30 天（INFO+）/ 7 天（DEBUG） |

**日誌範例：**

```json
{
  "timestamp": "2026-02-17T10:30:45.123+08:00",
  "level": "INFO",
  "message": "L1 resolution hit",
  "request_id": "req_abc123",
  "user_id": "U1234567890",
  "module": "three_layer_resolver",
  "conversation_id": "conv_xyz",
  "resolution_level": "L1",
  "case_entry_id": "ce_456",
  "similarity_score": 0.92,
  "latency_ms": 45
}
```

#### 指標 (Metrics)

| 指標類別 | 指標名稱 | 類型 | 說明 |
| :--- | :--- | :--- | :--- |
| **API 效能** | `api_request_duration_seconds` | Histogram | API 請求延遲分佈 |
| **API 效能** | `api_request_total` | Counter | API 請求總數（按 method, path, status） |
| **LLM 效能** | `llm_call_duration_seconds` | Histogram | LLM API 呼叫延遲 |
| **LLM 效能** | `llm_token_usage_total` | Counter | Token 使用量（按 model, type） |
| **LLM 成本** | `llm_cost_usd_total` | Counter | LLM 累計花費（USD） |
| **解決率** | `resolution_total` | Counter | 問題解決次數（按 level: L1/L2/L3） |
| **解決率** | `resolution_success_rate` | Gauge | 各層解決成功率 |
| **知識庫** | `knowledge_base_entries_total` | Gauge | CaseEntry 和 ManualChunk 總數 |
| **系統健康** | `active_conversations` | Gauge | 當前活躍對話數 |
| **系統健康** | `db_connection_pool_usage` | Gauge | 資料庫連線池使用率 |
| **V2.0 派工** | `work_order_total` | Counter | 工單數量（按 status） |
| **V2.0 派工** | `dispatch_match_duration_seconds` | Histogram | 技師匹配延遲 |

**指標實現：** V1.0 使用 FastAPI middleware 收集基礎 API 指標，提供 `/metrics` 端點。可選接入 Prometheus + Grafana。

#### 告警 (Alerting)

| 告警名稱 | 條件 | 嚴重度 | 通知管道 |
| :--- | :--- | :--- | :--- |
| API 高延遲 | P95 > 5s 持續 5 分鐘 | P2 - Warning | LINE 群組通知 |
| API 錯誤率飆升 | 5xx 比率 > 5% 持續 3 分鐘 | P1 - Critical | LINE 群組通知 + 電話 |
| LLM 呼叫失敗 | 連續失敗 > 3 次 | P1 - Critical | LINE 群組通知 |
| 資料庫連線耗盡 | 連線池 > 90% | P2 - Warning | LINE 群組通知 |
| 磁碟使用率 | > 85% | P2 - Warning | LINE 群組通知 |
| 備份失敗 | 每日備份未在預期時間完成 | P1 - Critical | LINE 群組通知 + Email |

### 7.2 安全性

#### 威脅分析與防護

| 威脅類別 | 具體威脅 | 風險等級 | 防護措施 |
| :--- | :--- | :--- | :--- |
| **Prompt Injection** | 惡意用戶透過對話注入指令，操控 AI 行為 | 高 | 1. System Prompt 與 User Input 嚴格分離<br/>2. LLM 輸出過濾（禁止敏感內容）<br/>3. 輸入長度限制（單條訊息 < 2000 字元）<br/>4. 定期進行紅隊測試 |
| **Prompt Leaking** | 用戶試圖誘導 AI 洩露 System Prompt 內容 | 中 | 1. System Prompt 中加入反洩露指令<br/>2. 輸出檢測：正則匹配 Prompt 關鍵片段<br/>3. 日誌監控異常對話模式 |
| **LINE Webhook 偽造** | 攻擊者偽造 LINE Webhook 請求 | 高 | 1. 每次 Webhook 請求驗證 HMAC-SHA256 簽章<br/>2. 拒絕簽章不匹配的請求<br/>3. Rate Limiting（Nginx 層） |
| **API 未授權存取** | 未認證用戶存取管理 API 或技師 API | 高 | 1. JWT Token 認證<br/>2. Role-Based Access Control (RBAC)<br/>3. Token 過期時間：Admin 4h / Technician 8h |
| **SQL Injection** | 惡意輸入導致 SQL 注入 | 高 | 1. SQLAlchemy ORM 參數化查詢（禁止原生 SQL 拼接）<br/>2. 輸入驗證（Pydantic schema）<br/>3. 資料庫帳號最小權限原則 |
| **API Key 洩露** | Google AI / LINE API Key 被洩露 | 高 | 1. 環境變數存放，不提交至版本控制<br/>2. `.env` 在 `.gitignore` 中<br/>3. 定期輪替 Key<br/>4. 設定 Google AI 用量上限 |
| **DDoS / 濫用** | 惡意大量請求導致系統癱瘓 | 中 | 1. Nginx Rate Limiting（IP 級別）<br/>2. Redis 實現 API Rate Limiting（用戶級別）<br/>3. LINE Webhook 頻率監控 |
| **資料竊取** | 資料庫或備份檔案被盜取 | 中 | 1. 資料庫僅在 Docker 內部網路暴露<br/>2. 備份檔案加密<br/>3. SSL/TLS 傳輸加密<br/>4. VPS 防火牆只開放 80/443 |

#### 認證與授權架構

```
認證流程：
  LINE 用戶 -> 無需額外認證，以 LINE user_id 識別
  管理員    -> JWT Token（/auth/login endpoint）
  技師      -> JWT Token（/auth/login endpoint）

授權模型 (RBAC)：
  Role: line_user
    - 僅透過 LINE Webhook 互動，無直接 API 存取
  Role: admin
    - 知識庫 CRUD
    - SOP 審核
    - 對話記錄查詢
    - 系統設定
    - V2.0: 技師管理、派工監控、帳務管理
  Role: family_reviewer
    - 甲方指定之家族成員（合約 4.4(d) 條）
    - SOP 草稿二次覆核（一般管理員審核通過後，須家族覆核員確認方可入庫）
    - 覆核紀錄不可刪除，供稽核查詢
  Role: technician (V2.0)
    - 查看指派給自己的工單
    - 接單/拒單
    - 服務回報
    - 查看自己的帳務
```

#### 密鑰管理

| 密鑰 | 儲存方式 | 存取方式 | 輪替策略 |
| :--- | :--- | :--- | :--- |
| `GOOGLE_API_KEY` | `.env` 檔案（不入版本控制） | 環境變數 | 每季度輪替 |
| `LINE_CHANNEL_SECRET` | `.env` 檔案 | 環境變數 | LINE 後台設定，按需輪替 |
| `LINE_CHANNEL_ACCESS_TOKEN` | `.env` 檔案 | 環境變數 | LINE 後台設定，按需輪替 |
| `JWT_SECRET` | `.env` 檔案 | 環境變數 | 每季度輪替 |
| `DATABASE_URL` | `.env` 檔案 | 環境變數 | 密碼每季度輪替 |
| `REDIS_URL` | `.env` 檔案 | 環境變數 | 按需設定 |

---

## 第 8 部分：風險與緩解策略

| 風險類別 | 風險描述 | 可能性 | 影響程度 | 緩解策略 |
| :--- | :--- | :--- | :--- | :--- |
| **AI 品質** | Gemini 2.5 Flash 對特定品牌/型號的電子鎖問題診斷不準確，低於 80% 目標 | 中 | 高 | 1. 建立 50 題標準測試集，持續追蹤準確率<br/>2. 持續豐富知識庫（案例 + 手冊），提升 L1 命中率<br/>3. Prompt Engineering 迭代優化<br/>4. SOP 自演化機制持續改善知識品質 |
| **LLM API 依賴** | Google AI API 故障或回應延遲過高，導致系統功能降級 | 低 | 高 | 1. LangChain 抽象層允許快速切換 Provider（如 OpenAI）<br/>2. L1（知識庫搜尋）不依賴 LLM API，可獨立運作<br/>3. 設定 timeout (30s) + retry (3 次 exponential backoff)<br/>4. 降級策略：LLM 不可用時回退至 L1 + L3 |
| **LLM 成本** | 用戶量增長導致 Google AI API 費用超出預算 | 中 | 中 | 1. 使用較便宜的 text-embedding-004<br/>2. L1 命中率越高，L2 LLM 呼叫越少<br/>3. Redis 快取相同問題的回覆（TTL 24h）<br/>4. 監控 Token 使用量，設定每日/每月告警閾值 |
| **Prompt Injection** | 惡意用戶注入指令導致 AI 產生不當回應 | 中 | 高 | 1. System Prompt 硬化（角色固定、範圍限制）<br/>2. 輸出過濾（敏感詞檢測、格式驗證）<br/>3. 輸入長度限制<br/>4. 定期紅隊測試 |
| **資料安全** | 資料庫洩露或備份檔案被盜 | 低 | 高 | 1. 資料庫不暴露外部端口<br/>2. 備份加密<br/>3. VPS 防火牆嚴格配置<br/>4. 定期安全審計 |
| **V1 -> V2 升級風險** | V2.0 模組（Dispatch/Accounting）與 V1.0 核心模組整合時產生衝突 | 中 | 中 | 1. Clean Architecture 確保模組間依賴透過介面抽象<br/>2. 限界上下文邊界清晰<br/>3. V2.0 模組作為新 package 加入，不修改 V1.0 核心程式碼<br/>4. 充分的整合測試 |
| **LINE 平台限制** | LINE Messaging API 的 Reply Token 有效期僅 30 秒，LLM 回應可能超時 | 中 | 中 | 1. 先回覆「處理中」訊息（使用 Reply Token）<br/>2. LLM 完成後使用 Push Message 發送結果<br/>3. Push Message 有免費額度限制，監控使用量 |
| **團隊風險** | 小型團隊（1-3 人），關鍵人離開導致專案停滯 | 低 | 高 | 1. 完善的技術文檔（本文件）<br/>2. 程式碼註解與 Docstring<br/>3. 標準化的開發流程與 CI/CD<br/>4. 定期知識分享 |
| **效能瓶頸** | 並發用戶超過預期，單機 Docker Compose 部署無法承受 | 低 | 中 | 1. V1.0 目標僅 50 concurrent，Docker Compose 足夠<br/>2. FastAPI + Uvicorn 可水平擴展（`--scale api=N`）<br/>3. PostgreSQL 連線池管理（asyncpg + pgbouncer 備案）<br/>4. Redis 分擔熱點查詢壓力 |

---

## 第 9 部分：架構演進路線圖

```mermaid
gantt
    title 架構演進時間線（對齊 Moat M1/M2/M3 里程碑）
    dateFormat  YYYY-MM
    axisFormat  %Y-%m

    section V1.0 AI 客服 (M1: W1-W17)
    Single ReAct Agent + LINE Bot               :done, v10, 2026-01, 2026-04
    SKILL.md 知識庫上線                          :done, v10kb, 2026-02, 2026-04
    Harness 8 flat modules                       :done, h0, 2026-03, 2026-04

    section V1.1 Harness 啟用 (M1 後半)
    Phase 1: L7 Observability                    :h1, 2026-04, 2026-05
    Phase 2: L1 Task + ProblemCard               :h2, 2026-05, 2026-06
    Phase 3: L6 Safety + L3 Governance           :h3, 2026-06, 2026-07

    section V1.2 Harness 完整 (M1→M2 銜接)
    Phase 4: L2 Context Assembly                 :h4, 2026-07, 2026-08
    Phase 5: L5 Feedback Loop                    :h5, 2026-08, 2026-09
    Phase 6: L8 Entropy (SOP auto-gen)           :h6, 2026-09, 2026-10

    section V2.0 派工與帳務 (M2: W18-W31)
    Technician Web App (Next.js PWA)             :v20t, 2026-10, 2026-12
    Smart Dispatch Engine                        :v20d, 2026-11, 2027-01
    Pricing Engine + Accounting                  :v20a, 2027-01, 2027-02

    section V3.0 智慧層 (M3: 5 個月)
    影子驗證 + 報價信心分數                       :v30, 2027-03, 2027-06
    預測備料 + 產業語言模型 V2                    :v31, 2027-05, 2027-08
```

### V1.0 — 現況 (2026-04)

Single ReAct AI 客服系統已上線運作。

| 項目 | 狀態 | 說明 |
| :--- | :--- | :--- |
| LangGraph ReAct Agent | **上線** | `prebuilt.create_react_agent` + 3 tools（load_skill / update_user_info / transfer_to_human） |
| SKILL.md 知識庫 | **上線** | `agent/skills/data/{Brand}/{Model}/SKILL.md` 路徑階層分類；啟動掃描 + per-request brand/model filtering |
| LINE Bot + Debounce | **上線** | FastAPI webhook + 1.5 秒訊息合併緩衝 |
| User Profile (SCD Type 2) | **上線** | hard_facts (PostgreSQL `user_facts` 表) + 透過 `update_user_info` tool 與 H4 LLM 抽取雙路徑寫入 |
| Harness 中介層 | **上線** | 8 個扁平模組檔（multimodal / debounce / data_correction / line_ui_factory / profile_updater / memory_manager / safety_gate / output_validator） |
| Medallion ETL Pipeline | **上線** | `data/` 目錄 source → raw → bronze → silver → SKILL，產出 SKILL.md 草稿 |

**護城河對齊 (M1)**：AI 客服上線、ProblemCard 結構定義完成（Moat A 種子數據開始累積）、知識庫運作（Moat F 數據飛輪種子）。

> ⚠️ **Vision (not yet implemented)**: 8-Layer Harness Framework（L1-L8）、Multi-Agent sub-graph、GraphState、Send() fan-out/fan-in 為 V1.1+ 願景，需 multi-agent 架構重構後才能啟用。

### V1.1 — Harness 啟用 (Phase 1-3)

分三階段啟用 Harness 層，每階段獨立 enable/disable。

| Phase | 層 | 交付物 | 風險 | 回滾方式 |
| :--- | :--- | :--- | :--- | :--- |
| **Phase 1** | L7 Observability | `@traced` decorator + `harness_traces` table | Low | `trace_enabled = false` |
| **Phase 2** | L1 Task + ProblemCard | `task_decompose` node + `problem_cards` table | Medium (+1-3s) | `decompose_enabled = false` |
| **Phase 3** | L6 Safety + L3 Governance | `safety_gate` node + ToolRegistry | Medium | 移除 edge |

**護城河加速**：ProblemCard 累積啟動 Moat A（產業語言模型）種子數據，Safety Gate 建立 Moat I（合規壁壘）。

### V1.2 — Harness 完整 (Phase 4-6)

| Phase | 層 | 交付物 | 風險 | 回滾方式 |
| :--- | :--- | :--- | :--- | :--- |
| **Phase 4** | L2 Context Assembly | `context_assemble` node + token budget + freshness scoring | Medium-High | A/B test 50/50 |
| **Phase 5** | L5 Feedback Loop | `verify_answer` node + retry conditional edge | High (延遲翻倍) | `verify_enabled = false` + `max_retry = 1` |
| **Phase 6** | L8 Entropy Management | `entropy_check` node + SOP auto-generation + weekly freshness scan | Low (背景任務) | `sop_generation_enabled = false` |

**目標 Graph Flow**（所有 Harness 啟用後）：
```
START → pre_process → manage_memory → task_decompose → context_assemble
→ safety_gate → router → [fan-out agents] → merge_answers → verify_answer
→ (retry loop) → update_profile → entropy_check → post_process → END
```

### V2.0 — 派工與帳務 (M2: W18-W31)

| 交付物 | 技術 | 架構影響 |
| :--- | :--- | :--- |
| **Technician Web App** | Next.js PWA + TypeScript | 新增前端容器，WebSocket 即時通知 |
| **Smart Dispatch Engine** | Python + PostgreSQL | 技能 × 地區 × 評分智能匹配，`transfer_to_human` 工具觸發工單建立 |
| **Pricing Engine** | Python + PostgreSQL | 品牌 × 鎖型 × 難度計價規則 |
| **Accounting Module** | Python + PostgreSQL | Invoice/Voucher CRUD，月度報表匯出 |
| **Admin Panel 遷移** | Next.js (取代 Jinja2+HTMX) | 統一前端技術棧 |

**V2.0 架構方針：物理分離 monorepo（agent / api / data / web）**

實際 V2.0 採取 **物理分離 monorepo**：`agent/`（LINE Bot + ReAct）、`api/`（FastAPI backend for dispatch / pricing / accounting）、`data/`（Medallion ETL）、`web/`（Next.js admin dashboard）四個獨立 workspace，由根目錄 `pyproject.toml` + `uv.lock` 統一管理。詳見 [E6x 結構指南](./E6x--project-structure.md)。

```
專案根/
├── agent/                   # V1.0 LINE Bot + Single ReAct (上線)
│   ├── agent.py
│   ├── app.py
│   ├── harness/             # 8 flat modules
│   ├── skills/              # SKILL.md tools + data
│   ├── llms/ memory/ storage/ embeddings/ profiles/ core/
│   └── pyproject.toml
├── api/                     # V2.0 NEW: FastAPI Backend
│   ├── main.py
│   ├── dispatch/            # 派工引擎
│   ├── pricing/             # 計價引擎
│   ├── accounting/          # 帳務模組
│   └── pyproject.toml
├── data/                    # Medallion ETL Pipeline (上線)
│   ├── pipeline/{source_to_raw,raw_to_bronze,bronze_to_silver,silver_to_skill}/
│   └── pyproject.toml
├── web/                     # V2.0 NEW: Next.js Admin Dashboard
│   ├── src/
│   ├── package.json
│   └── ...
├── pyproject.toml           # uv workspace root
└── uv.lock
```

> ⚠️ **Vision (not yet implemented)**: 早期版本規劃將 V2.0 模組（dispatch / pricing / accounting）放入 `agent/` 進程內共用 LangGraph。實際決定走物理分離（`api/` 獨立 service），透過 PostgreSQL 共享而非進程內呼叫。

**V1→V2 整合點**：`transfer_to_human` 工具觸發 L3 escalation → `dispatch/engine.py` 建立 WorkOrder（詳見 §3.6）。

**Performance 保證** (100 concurrent)：

| 瓶頸 | 緩解策略 |
|---|---|
| DB 連線耗盡 | SQLAlchemy pool_size=20-30, pgbouncer 備案 |
| 技師匹配延遲 | `asyncio.gather()` 平行評分，不用 sequential loop |
| 報價查詢熱點 | Redis 快取 PriceRule (TTL 1hr) |
| 月結批次壓力 | 排程背景任務 (不在 request path)，read replica 分流 |

**護城河對齊 (M2)**：派工數據啟動 Moat C（標準化定價引擎）、Moat G（技師行為數據）。

### V3.0 — 智慧層 (M3: 5 個月)

| 方向 | 說明 | 護城河 |
| :--- | :--- | :--- |
| **影子驗證** | AI 回覆與真人客服並行比對，量化準確率 | Moat A V2 |
| **報價信心分數** | 基於歷史數據的報價可信度評分 | Moat B |
| **預測備料** | 根據 ProblemCard 統計預測常用零件需求 | Moat E |
| **產業語言模型 V2** | 以 ProblemCard + SOP 語料微調 embedding | Moat A |

### 技術適配保證 (24 個月)

`agent/` 透過三種不同形式的 config-driven composition 支撐 provider 切換：

| 機制 | 形式 | 實際 code 路徑 | 說明 |
| :--- | :--- | :--- | :--- |
| **Memory Backend** | dict registry | `agent/memory/__init__.py` | dict 註冊 in-process / sqlite / postgres 三種 checkpointer，由 `config.toml` 字串 key 選擇 |
| **Storage Backend** | dict registry | `agent/storage/__init__.py` | dict 註冊 in-process / sqlite / postgres 三種 audit log storage，由 `config.toml` 字串 key 選擇 |
| **LLM Provider** | LiteLLM 字串前綴路由 | `agent/llms/` | 不是 dict registry，而是 LiteLLM 統一介面：`config.toml` 給字串如 `"vertex_ai/gemini-2.5-pro"` 或 `"anthropic/claude-3-5-sonnet"`，LiteLLM 內部解析前綴自動路由到對應 provider |
| **Embedding Provider** | 直接 build 函式 | `agent/embeddings/` | 小規模直接 build（無 registry），未來可視需求補 dict registry |
| **Prompt 外部化** | 檔案載入 | `agent/prompts/system.md` | 所有 Prompt 存放於 markdown 檔，非硬編碼 |
| **Skill 擴展** | 檔案掃描 | `agent/skills/data/` | 新增 SKILL.md 即新增技能；新品牌只需在 `agent/config.toml` 的 `[quick_reply]` 新增條目 |
| **Harness 層層開關** | (vision) | - | 每個 Harness 功能獨立 enable/disable 為願景設計，現有 8 flat modules 為固定載入 |

> ⚠️ **D1 待決議**：LLM provider 形式（LiteLLM 字串路由）與 memory/storage（dict registry）不對稱。是否補 dict registry 以統一形式，列入後續 ADR 評估。

---

## 第 10 部分：附錄

### 附錄 A：專案目錄結構

> ⚠️ **Vision structure**: 以下為 Clean Architecture / DDD 風格的單一 `src/smartlock/` 結構，**現有 V1.0 不採用此結構**。實際 V1.0 結構為四個物理分離的 workspace（`agent/` / `api/` / `data/` / `web/`），詳見 [E6x 結構指南](./E6x--project-structure.md)。

```
Smart-Lock_AI_Support_Service_Dispatch_SaaS_Platform/   # Vision (not implemented)
├── docs/                           # 專案文檔
│   ├── 05_architecture_and_design_document.md   # 本文件
│   └── adrs/                       # 架構決策記錄
│       ├── ADR-001_backend_framework.md
│       ├── ADR-002_database_selection.md
│       └── ...
├── src/
│   └── smartlock/                  # 核心應用程式碼
│       ├── __init__.py
│       ├── main.py                 # FastAPI app entry point
│       ├── config.py               # 設定管理
│       ├── customer_service/       # 客服限界上下文
│       │   ├── domain/
│       │   │   ├── entities.py     # Conversation, ProblemCard, Message
│       │   │   ├── value_objects.py
│       │   │   ├── events.py       # Domain Events
│       │   │   └── services.py     # ThreeLayerResolutionPolicy
│       │   ├── application/
│       │   │   ├── conversation_service.py
│       │   │   ├── problem_card_service.py
│       │   │   ├── resolution_service.py
│       │   │   ├── dto.py
│       │   │   └── ports.py        # Abstract interfaces
│       │   └── infrastructure/
│       │       ├── webhook_controller.py
│       │       ├── conversation_repo.py
│       │       ├── line_adapter.py
│       │       └── llm_gateway.py
│       ├── knowledge_base/         # 知識庫限界上下文
│       │   ├── domain/
│       │   ├── application/
│       │   └── infrastructure/
│       ├── user_management/        # 使用者管理上下文
│       │   ├── domain/
│       │   ├── application/
│       │   └── infrastructure/
│       ├── dispatch/               # 派工上下文 (V2.0)
│       │   ├── domain/
│       │   ├── application/
│       │   └── infrastructure/
│       ├── accounting/             # 帳務上下文 (V2.0)
│       │   ├── domain/
│       │   ├── application/
│       │   └── infrastructure/
│       └── shared/                 # 共享基礎設施
│           ├── database.py         # SQLAlchemy engine & session
│           ├── redis.py            # Redis client
│           ├── auth.py             # JWT auth utilities
│           ├── logging.py          # Structured logging setup
│           └── middleware.py       # CORS, request ID, timing
├── tests/
│   ├── unit/
│   │   ├── customer_service/
│   │   ├── knowledge_base/
│   │   └── ...
│   ├── integration/
│   │   ├── test_line_webhook.py
│   │   ├── test_resolution_flow.py
│   │   └── ...
│   └── conftest.py                # Shared fixtures
├── migrations/                     # Alembic 資料庫遷移
│   ├── alembic.ini
│   ├── env.py
│   └── versions/
├── templates/                      # Jinja2 templates (V1.0 Admin)
├── static/                         # Static assets (V1.0 Admin)
├── web/                            # Next.js frontend (V2.0)
│   ├── src/
│   ├── package.json
│   └── next.config.js
├── docker/
│   ├── Dockerfile.api
│   ├── Dockerfile.web
│   └── nginx/
│       └── conf.d/
├── docker-compose.yml
├── docker-compose.dev.yml
├── .env.example
├── .gitignore
├── pyproject.toml                  # Python project config (Poetry)
├── README.md
└── Makefile                        # Common dev commands
```

### 附錄 B：關鍵 API 端點概覽

| 方法 | 路徑 | 說明 | 認證 | 階段 |
| :--- | :--- | :--- | :--- | :--- |
| POST | `/webhook/line` | LINE Webhook 接收端點 | LINE Signature | V1.0 |
| GET | `/health` | 健康檢查 | 無 | V1.0 |
| GET | `/metrics` | Prometheus 指標 | 無 (internal) | V1.0 |
| POST | `/auth/login` | 管理員/技師登入 | 無 | V1.0 |
| POST | `/auth/refresh` | 刷新 JWT Token | JWT | V1.0 |
| GET | `/api/v1/cases` | 案例列表查詢 | Admin JWT | V1.0 |
| POST | `/api/v1/cases` | 新增案例 | Admin JWT | V1.0 |
| PUT | `/api/v1/cases/{id}` | 更新案例 | Admin JWT | V1.0 |
| DELETE | `/api/v1/cases/{id}` | 刪除案例 | Admin JWT | V1.0 |
| POST | `/api/v1/manuals/upload` | 上傳 PDF 手冊 | Admin JWT | V1.0 |
| GET | `/api/v1/manuals` | 手冊列表 | Admin JWT | V1.0 |
| GET | `/api/v1/sop-drafts` | 待審核 SOP 列表 | Admin JWT | V1.0 |
| POST | `/api/v1/sop-drafts/{id}/approve` | 審核通過 SOP | Admin JWT | V1.0 |
| POST | `/api/v1/sop-drafts/{id}/reject` | 拒絕 SOP | Admin JWT | V1.0 |
| GET | `/api/v1/conversations` | 對話記錄查詢 | Admin JWT | V1.0 |
| GET | `/api/v1/conversations/{id}` | 對話詳情 | Admin JWT | V1.0 |
| GET | `/api/v1/problem-cards` | 問題卡列表 | Admin JWT | V1.0 |
| GET | `/api/v1/stats/dashboard` | 統計儀表板 | Admin JWT | V1.0 |
| GET | `/api/v2/work-orders` | 工單列表 | Admin/Tech JWT | V2.0 |
| POST | `/api/v2/work-orders` | 建立工單 | Admin JWT | V2.0 |
| PUT | `/api/v2/work-orders/{id}/accept` | 技師接單 | Tech JWT | V2.0 |
| PUT | `/api/v2/work-orders/{id}/reject` | 技師拒單 | Tech JWT | V2.0 |
| PUT | `/api/v2/work-orders/{id}/start` | 開始服務 | Tech JWT | V2.0 |
| PUT | `/api/v2/work-orders/{id}/complete` | 完成服務 | Tech JWT | V2.0 |
| GET | `/api/v2/technicians` | 技師列表 | Admin JWT | V2.0 |
| POST | `/api/v2/technicians` | 新增技師 | Admin JWT | V2.0 |
| GET | `/api/v2/price-rules` | 計價規則列表 | Admin JWT | V2.0 |
| POST | `/api/v2/price-rules` | 新增計價規則 | Admin JWT | V2.0 |
| GET | `/api/v2/invoices` | 發票列表 | Admin JWT | V2.0 |
| GET | `/api/v2/reports/monthly` | 月度統計報表 | Admin JWT | V2.0 |

### 附錄 C：環境變數清單

| 變數名稱 | 說明 | 範例值 | 必填 |
| :--- | :--- | :--- | :--- |
| `DATABASE_URL` | PostgreSQL 連線字串 | `postgresql+asyncpg://user:pass@postgres:5432/smartlock` | 是 |
| `REDIS_URL` | Redis 連線字串 | `redis://redis:6379/0` | 是 |
| `GOOGLE_API_KEY` | Google AI API 金鑰 | `AIza...` | 是 |
| `GOOGLE_MODEL` | LLM 模型名稱 | `gemini-2.5-flash` | 是 |
| `GOOGLE_EMBEDDING_MODEL` | Embedding 模型名稱 | `text-embedding-004` | 是 |
| `LINE_CHANNEL_SECRET` | LINE Channel Secret | `abc123...` | 是 |
| `LINE_CHANNEL_ACCESS_TOKEN` | LINE Channel Access Token | `xyz789...` | 是 |
| `JWT_SECRET` | JWT 簽名密鑰 | `super-secret-key` | 是 |
| `JWT_EXPIRY_HOURS` | JWT 過期時間（小時） | `4` | 否（預設 4） |
| `LOG_LEVEL` | 日誌等級 | `INFO` | 否（預設 INFO） |
| `CORS_ORIGINS` | 允許的 CORS 來源 | `http://localhost:3000` | 否 |
| `VECTOR_SIMILARITY_THRESHOLD` | L1 向量搜尋命中閾值 | `0.85` | 否（預設 0.85） |
| `SESSION_TTL_SECONDS` | 對話 Session 超時（秒） | `1800` | 否（預設 1800） |
| `MAX_CONVERSATION_TURNS` | 最大對話輪數 | `20` | 否（預設 20） |
| `ENVIRONMENT` | 環境標識 | `development` / `staging` / `production` | 否（預設 development） |

### 附錄 D：靜態結構分析參考

- **檔案依賴關係:** 參考 `docs/09_file_dependencies.md`（待產出）
- **類別關係圖:** 參考 `docs/10_class_relationships.md`（待產出）

---

---

**文件審核記錄 (Review History):**

| 日期 | 審核人 | 版本 | 變更摘要 |
| :--- | :--- | :--- | :--- |
| 2026-02-17 | 技術架構師 | v1.0 | 初稿完成，涵蓋 V1.0 + V2.0 完整架構設計 |
| 2026-04-01 | AI 架構助理 | v1.1 | 新增附錄 E：實際 LangGraph 架構 + 8 層 Agent Harness 框架 |
| 2026-04-01 | AI 架構助理 | v2.0 | 重寫 §1.3/§3/§9 對齊實際 LangGraph 架構，移除附錄 E（內容已整合至主文） |
| 2026-04-04 | AI 架構助理 | v2.1 | 新增 §1.4 Software 3.0 設計哲學 + Latency Budget；Gemini 3 Pro -> 2.5 Flash；新增 4 個 Bounded Context (DisputeResolution, Warranty, Inventory, BrandManagement)；Schema_v2_extensions.sql 6 表；ADR-009/010/011 |
| 2026-05-06 | Doc Agent C | v2.2 | Wave 2 同步：U14（7 sub-graph 改為 Current=Single ReAct + Vision 雙段）、U15（Harness L1-L8 子目錄改為 8 flat modules）、U17（Registry 描述精確化為 dict registry / LiteLLM 字串路由 / 直接 build）；§6 部署視圖標示 Cloud Run，docker-compose 拓撲標為 Legacy；§9 V2.0 目錄結構改為四 workspace 物理分離 |
