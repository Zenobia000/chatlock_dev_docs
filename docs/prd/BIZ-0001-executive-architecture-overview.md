# 系統架構總覽 - 電子鎖智能客服與派工平台

> **架構更新（2026-04-21）**
> Layer 3 補充：LLM 供應商抽象層使用 **LiteLLM**（支援 Vertex AI / OpenAI / Ollama 切換）。
> 部署平台：**Google Cloud Run**（Docker 容器化）。
> Layer 4 的 dispatch V2.0 / accounting V2.0 尚未實作。

**版本:** v2.0 | **更新日期:** 2026-04-04

---

## 1. 系統分層堆疊圖

由上至下六層，上層依賴下層，每層標註具體技術選型。

```mermaid
graph TB
    L1["<b>使用者介面層</b><br/>LINE Messaging API | Next.js 14 + React 19 | shadcn/ui + Tailwind | PWA"]
    L2["<b>API 閘道層</b><br/>FastAPI + Uvicorn | Pydantic v2 | OpenAPI/Swagger | JWT + RBAC"]
    L3["<b>AI 服務層</b><br/>LangGraph 0.2 + LangChain 0.3 | Google Gemini 2.5 Flash | text-embedding-004 768d | 8-Layer Harness"]
    L4["<b>業務領域層</b><br/>customer_service | knowledge_base | dispatch V2.0 | accounting V2.0"]
    L5["<b>資料存取層</b><br/>SQLAlchemy 2.0 Async | asyncpg | Alembic Migration | Redis aioredis"]
    L6["<b>基礎設施層</b><br/>PostgreSQL 16 + pgvector 0.7 | Redis 7 | Docker Compose | TLS 1.2+ / AES-256"]

    L1 --> L2
    L2 --> L3
    L2 --> L4
    L3 --> L4
    L4 --> L5
    L5 --> L6

    classDef s1 fill:#E3F2FD,stroke:#1565C0,stroke-width:2px
    classDef s2 fill:#FFF3E0,stroke:#E65100,stroke-width:2px
    classDef s3 fill:#EDE7F6,stroke:#4527A0,stroke-width:2px
    classDef s4 fill:#E8F5E9,stroke:#2E7D32,stroke-width:2px
    classDef s5 fill:#F3E5F5,stroke:#6A1B9A,stroke-width:2px
    classDef s6 fill:#ECEFF1,stroke:#37474F,stroke-width:2px
    class L1 s1
    class L2 s2
    class L3 s3
    class L4 s4
    class L5 s5
    class L6 s6
```

---

## 2. 系統架構圖 - 資訊流

從消費者發起問題到結案的完整資訊流動路徑，涵蓋三類使用者、平台核心與外部系統。

```mermaid
graph TD
    subgraph 使用者
        C[fa:fa-user 消費者 - LINE]
        T[fa:fa-wrench 技師 - Web App]
        A[fa:fa-user 管理員 - Admin Panel]
    end

    subgraph 平台核心
        subgraph 介面層
            BOT[fa:fa-comments LINE Bot AI 客服]
            WEB[fa:fa-mobile 技師工作台]
            ADM[fa:fa-bar-chart 營運儀表板]
        end

        subgraph AI 引擎
            PC[fa:fa-stethoscope 問題診斷引擎]
            RES[fa:fa-lightbulb-o 三層解決機制]
            SOP[fa:fa-file-text SOP 自動生成]
        end

        subgraph 業務服務
            REF[退款審批 RefundService]
            WAR[保固管理 WarrantyService]
            INV[庫存管理 InventoryService]
            AUD[稽核日誌 AuditLogger]
            EXP[資料匯出 DataExporter]
        end

        subgraph 業務引擎
            DSP[fa:fa-cogs 智慧派工引擎]
            PRC[fa:fa-tags 報價引擎]
            ACC[fa:fa-money 帳務模組]
            TM[技師匹配 TechnicianMatcher]
            PE[定價規則 PricingEngine]
        end

        subgraph 資料層
            DB[fa:fa-database PostgreSQL]
            VEC[fa:fa-book pgvector 知識庫]
            RED[fa:fa-bolt Redis 快取]
        end
    end

    subgraph 外部服務
        LINE_API[fa:fa-commenting LINE API]
        GEMINI[fa:fa-cloud Google Gemini AI]
    end

    C -->|1. 報修諮詢| BOT
    C -->|1b. 客訴/爭議| BOT
    BOT -->|2. 收發訊息| LINE_API
    LINE_API -->|3. Webhook| PC

    PC -->|4. 產生問題卡| RES
    RES -->|5a. L1 查知識庫| VEC
    RES -->|5b. L2 AI 推理| GEMINI
    RES -->|6. 回覆方案| BOT
    RES -->|7. L3 轉派工| DSP

    DSP -->|匹配演算法| TM
    DSP -->|8. 查詢報價| PRC
    PRC -->|定價規則| PE
    DSP -->|9. 派單通知| WEB
    T -->|10. 接單回報| WEB
    WEB -->|11. 更新工單| DSP
    DSP -->|12. 結案| ACC

    ACC -->|退款流程| REF
    DSP -->|保固查詢| WAR
    DSP -->|備料查詢| INV

    RES -.->|成功案例| SOP
    SOP -.->|審核後入庫| VEC

    A -->|監控管理| ADM
    ADM --> DSP
    ADM --> VEC
    ADM -->|匯出報表| EXP

    PC --> DB
    DSP --> DB
    ACC --> DB
    RES --> RED
    AUD --> DB

    classDef userStyle fill:#E3F2FD,stroke:#1565C0,stroke-width:2px
    classDef aiStyle fill:#EDE7F6,stroke:#4527A0,stroke-width:2px
    classDef bizStyle fill:#FFF3E0,stroke:#E65100,stroke-width:2px
    classDef svcStyle fill:#FCE4EC,stroke:#C62828,stroke-width:2px
    classDef dataStyle fill:#E8F5E9,stroke:#2E7D32,stroke-width:2px
    classDef extStyle fill:#ECEFF1,stroke:#37474F,stroke-width:2px
    class C,T,A,BOT,WEB,ADM userStyle
    class PC,RES,SOP aiStyle
    class DSP,PRC,ACC,TM,PE bizStyle
    class REF,WAR,INV,AUD,EXP svcStyle
    class DB,VEC,RED dataStyle
    class LINE_API,GEMINI extStyle
```

---

## 3. 功能模組清單與服務列表

### V1.0 - AI 智能客服系統

| 模組 | 服務 | 職責 | 關鍵技術 |
| :--- | :--- | :--- | :--- |
| **LINE Bot 接入** | Webhook Handler | 接收 LINE Webhook、驗證簽章、路由事件 | FastAPI, line-bot-sdk-python 3 |
| **對話管理** | ConversationManager | 對話狀態機 (Idle->Collecting->Resolving->Resolved)、多輪上下文、Session 超時 30min | Redis, 狀態機模式 |
| **問題診斷** | ProblemCardEngine | 從自然語言提取結構化問題卡 (品牌/型號/症狀/位置)、AI 輔助欄位推斷、缺失欄位追問 | LangChain, Gemini 2.5 Flash |
| **三層解決機制** | ThreeLayerResolver | L1: pgvector 語意搜尋 (相似度>=0.85) -> L2: RAG + Gemini 推理 -> L3: 轉人工/建工單 | LangChain LCEL, pgvector HNSW |
| **知識庫管理** | KnowledgeBaseManager | 案例 CRUD、PDF 手冊上傳->分段->Embedding、向量搜尋、增量更新 | PyMuPDF, text-embedding-004 |
| **SOP 自動生成** | SOPGenerator | 監聽成功解決事件->分析對話->AI 草擬 SOP->提交審核佇列 | LangChain, 事件驅動 |
| **LLM 閘道** | LLMGateway | 統一 LLM 呼叫入口 (Gemini 2.5 Flash + Vertex AI)、Provider 抽象層、Prompt 模板管理、Token 追蹤、Retry/Fallback | LangChain, Google AI SDK, Vertex AI |
| **管理後台** | Admin Panel | 知識庫審核、對話紀錄查詢、系統監控、SOP 上架管理 | FastAPI + Jinja2/HTMX (V1.0) |

### V2.0 - 派工、帳務與業務服務系統

| 模組 | 服務 | 職責 | 關鍵技術 |
| :--- | :--- | :--- | :--- |
| **智慧派工** | DispatchService | 技師匹配 (技能x地區x評分x可用時段)、工單生命週期 (Created->Assigned->InProgress->Completed)、推播通知 | 匹配演算法, WebSocket |
| **報價引擎** | PricingService | 計價規則 (品牌x鎖型x難度)、自動報價生成、客戶確認流程 | 規則引擎模式 |
| **帳務結算** | AccountingService | 對帳作業、發票/請款單生成、技師佣金計算、統計報表 | PostgreSQL 交易 |
| **技師工作台** | Technician Web App | 可接案件列表、一鍵接單、進度回報、導航整合、個人帳務 | Next.js 14 + PWA |
| **增強管理後台** | Enhanced Admin Panel | 派工監控、技師管理、帳務審核、營運儀表板 | Next.js 14 + shadcn/ui |
| **工單管理** | WorkOrderService | 工單 CRUD、狀態流轉、工單歷史追蹤、完工照片上傳 | SQLAlchemy, Pydantic |
| **技師管理** | TechnicianService | 技師檔案管理、技能矩陣、可用時段排程、績效評分 | PostgreSQL, Redis |
| **品牌管理** | BrandService | 品牌/型號主檔維護、品牌對應技師技能映射 | PostgreSQL |
| **保固管理** | WarrantyService | 保固期限查詢、保固條件驗證、保固理賠流程 | PostgreSQL |
| **庫存管理** | InventoryService | 零件庫存追蹤、備料建議、庫存預警 | PostgreSQL |
| **爭議處理** | DisputeService | 客訴案件建立、爭議調解流程、退款審批串接 | 狀態機模式 |
| **退款審批** | RefundService | 退款申請受理、多級審批流程、退款執行紀錄 | PostgreSQL 交易 |
| **客戶同意書** | ConsentService | 服務同意書生成、客戶簽署確認、同意紀錄存檔 | PDF 生成 |
| **完工報告** | CompletionService | 完工報告生成、照片附件管理、客戶滿意度回饋 | PostgreSQL, S3 |
| **通訊服務** | MessagingService | LINE Push 訊息、Web Push (技師端)、系統內通知模板 | LINE SDK, WebSocket |
| **財務報表** | FinanceService | 月度營收報表、技師佣金明細、應收應付統計 | PostgreSQL, DataExporter |

### 跨模組共用服務

| 服務 | 職責 |
| :--- | :--- |
| **UserManagement** | LINE 用戶綁定、技師/管理員帳號、JWT 認證、RBAC 權限 (admin/technician/user) |
| **AuditLogger** | 稽核日誌服務，涵蓋 7 種事件類型：API 呼叫、LLM 互動、RAG 來源引用、管理後台審批、工單狀態變更、退款審批、資料匯出 |
| **RBACService** | 角色型存取控制，支援 7 種角色：super_admin / admin / customer_service / technician / finance / auditor / line_user |
| **DataExporter** | 資料匯出服務，支援 CSV/Excel/PDF 格式，涵蓋工單報表、財務報表、稽核日誌匯出 |
| **ESignatureService** | 電子簽章服務，用於服務同意書、完工確認書的數位簽署與驗證 |
| **NotificationService** | LINE Push Message、Web Push (技師端)、系統內通知 |
| **ObservabilityStack** | 結構化日誌 (JSON)、Harness L7 Tracing、Health Check API |

### V2.0 設計規格文件

以下規格文件定義各服務模組的詳細設計，存放於 `docs/02-design/specs/` 目錄：

| 編號 | 文件名稱 | 涵蓋範圍 |
| :--- | :--- | :--- |
| 01 | work_order_lifecycle_spec.md | 工單狀態機、狀態流轉規則、生命週期事件 |
| 02 | technician_management_spec.md | 技師檔案、技能矩陣、可用時段、績效評分 |
| 03 | dispatch_matching_spec.md | 技師匹配演算法、權重配置、匹配結果排序 |
| 04 | pricing_engine_spec.md | 計價規則結構、加成計算、報價生成流程 |
| 05 | warranty_service_spec.md | 保固查詢、保固條件驗證、理賠流程 |
| 06 | inventory_service_spec.md | 庫存追蹤、備料建議、庫存預警閾值 |
| 07 | dispute_resolution_spec.md | 客訴建立、爭議調解、退款審批流程 |
| 08 | consent_esignature_spec.md | 同意書模板、簽署流程、數位簽章驗證 |
| 09 | completion_report_spec.md | 完工報告格式、照片規範、滿意度回饋 |
| 10 | work_order_interaction_flows.md | 工單互動流程、角色操作路徑、狀態轉換圖 |
| 11 | finance_reporting_spec.md | 月度報表、佣金計算、應收應付對帳 |
| 12 | audit_logging_spec.md | 7 種事件類型定義、日誌格式、保留策略 |
| 13 | rbac_permission_spec.md | 7 種角色定義、權限矩陣、API 存取控制 |
| 14 | data_export_spec.md | 匯出格式、排程匯出、資料脫敏規則 |

---
