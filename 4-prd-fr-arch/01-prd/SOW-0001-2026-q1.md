# 軟體需求分析與工作說明書 (SOW) - 電子鎖智能客服與派工平台

> **技術棧更新（2026-04-21）**
> V1.0 實際技術棧與本文件有以下差異：
> - LLM 框架：LangChain 0.3+ → **LangGraph + LiteLLM**
> - 快取：Redis 7+ → **V1.0 未使用 Redis**（改用 PostgreSQL + in-memory）
> - LLM 模型：Gemini 2.5 Flash → **vertex_ai/gemini-2.5-pro**（透過 LiteLLM）
> - 部署平台：已確定為 **Google Cloud Run**（Docker 容器）

---

**文件版本:** `v1.0`
**日期:** `2026-03-31`
**專案代號:** `SmartLock-SaaS`
**狀態:** 已批准 (Approved)
**SSOT 來源:** `docs/02_project_brief_and_prd.md`, `docs/05_architecture_and_design_document.md`, `docs/06_api_design_specification.md`

---

## 1. 技術棧 (Technical Stack)

| 分類 | 技術選型 | 版本 | 用途 |
|:---|:---|:---|:---|
| **後端語言** | Python | 3.11+ | 核心業務邏輯 |
| **後端框架** | FastAPI | 0.110+ | REST API / WebSocket / Webhook |
| **ASGI Server** | Uvicorn | 0.29+ | 高效能非同步 HTTP Server |
| **LLM 框架** | LangChain | 0.3+ (LCEL) | LLM 調用抽象、Chain 編排、Prompt 管理 |
| **LLM 模型** | Google Gemini 2.5 Flash | - | 意圖識別、對話生成、ProblemCard 擷取、SOP 草擬 |
| **Embedding 模型** | Google text-embedding-004 | - | 文本向量化 (768 維) |
| **關聯式資料庫** | PostgreSQL | 16 | 主要資料儲存 |
| **向量擴展** | pgvector | 0.7+ | 向量索引 (HNSW) 與相似度搜尋 |
| **快取** | Redis | 7+ | Session 快取、對話狀態暫存、Rate Limiting |
| **ORM** | SQLAlchemy | 2.0+ (Async) | 非同步資料庫操作 |
| **資料遷移** | Alembic | 1.13+ | 資料庫 Schema 版本管理 |
| **資料驗證** | Pydantic | 2.0+ | Request/Response 模型驗證 |
| **LINE 整合** | line-bot-sdk-python | 3+ | LINE Messaging API 互動 |
| **PDF 解析** | PyMuPDF (fitz) | - | 電子鎖手冊 PDF 解析與分段 |
| **LLM 觀測** | LangSmith | - | LLM 呼叫追蹤與偵錯 |
| **前端框架** | Next.js (React) | 14+ | V1.0 Admin Panel + V2.0 技師 Web App，統一前端技術棧 |
| **前端語言** | TypeScript | 5+ | 型別安全的前端開發 |
| **UI 元件** | shadcn/ui + Tailwind CSS | - | Admin Panel / 技師工作台 UI |
| **容器化** | Docker + docker-compose | 24+ | 開發與部署環境標準化 |
| **CI/CD** | GitHub Actions | - | 自動化測試與部署流程 |
| **測試框架** | pytest + pytest-asyncio | - | 單元測試與整合測試 |
| **安全性** | TLS 1.2+ / AES-256 / JWT + RBAC | - | 傳輸加密 / 靜態加密 / 認證授權 |
| **Agent Harness 框架** | 8 層 AI 運行時（Task/Context/Governance/Feedback/Safety/Observability/Escalation/Entropy） | Phase 0 | `config.toml` 14 區段集中驅動，取代分散式 .env 配置 |
| **集中配置** | config.toml | 14 sections | LLM 參數、Harness 開關、安全閾值、可觀測性等全平台行為配置 |
| **前端決策備註** | — | — | 前端統一決策：Next.js 14 自 V1.0 起取代原 Jinja2/HTMX 方案，V1.0 Admin Panel 與 V2.0 技師 Web App 共用統一技術棧 |
| **ProblemCard 架構** | 領域無關核心 + `domain_attributes` JSONB | - | 多垂直領域擴展就緒（電子鎖欄位遷入 JSONB） |
| **資料管線** | Bronze → Silver → Gold Medallion Architecture | - | ETL 管線：原始數據清洗 → 結構化 → 分析就緒 |

**架構模式:** Modular Monolith (V1.0) → Microservices-ready (V2.0)

---

## 2. 八階段開發計畫 (8-Phase Development Plan)

### Phase 0: 需求確認與架構設計 (W1-W2)

| 交付物 | 說明 |
|:---|:---|
| PRD 最終版 | 需求確認、使用者故事與允收標準定稿 |
| 架構設計文件 | C4 模型、DDD 限界上下文、技術選型 ADR |
| 資料庫 Schema 設計 | ER Diagram、Alembic 初始遷移腳本 |
| API 規格文件 | OpenAPI 3.0 規格、端點定義 |
| 開發環境建置 | Docker Compose 設定、CI/CD Pipeline |
| 甲方提供 LINE Official Account + Channel 資訊 | |

### Phase 1: AI 客服 MVP (W3-W7)

| 交付物 | 說明 |
|:---|:---|
| LINE Bot Webhook Handler | 接收 LINE Webhook、HMAC-SHA256 簽章驗證、事件路由 |
| 對話管理模組 | 對話狀態機 (Idle → Collecting → Resolving → Resolved)、Redis Session 管理、30min 超時 |
| ProblemCard 引擎 | AI 輔助從對話提取結構化欄位（品牌/型號/症狀/位置）、缺失欄位追問 |
| L1 解決引擎 | 案例庫向量搜尋 (pgvector HNSW, 相似度 >= 0.85)、Top-3 結果回覆 |
| 診斷推理引擎 (task_decompose) | Software 3.0 模式：Tier 1 意圖分類 + Tier 2 FMEA 四層因果鏈診斷（Symptom→Failure→FM→Defect）。知識注入 LLM prompt，structured output。V1.0 Phase 0 收集模式：L7 記錄 symptoms 組合 + 轉人上下文，為 Phase 1 故障樹建構儲備原料 |
| 初始知識庫 | 匯入甲方提供之 200+ 歷史案例、基礎案例 CRUD API |
| 安全防護基礎 | Prompt Injection 偵測、內容過濾、Output Guardrail |

### Phase 2: 知識庫完善與三層引擎 (W8-W12)

| 交付物 | 說明 |
|:---|:---|
| L2 解決引擎 (RAG) | ProblemCard + ManualChunk + CaseEntry 上下文組裝、Gemini 2.5 Flash 推理生成、來源標註 |
| L3 轉接機制 (HITL) | 人工轉接流程（觸發條件：L1+L2 未命中/消費者要求/負面情緒/危險操作/多輪未解決）、ProblemCard + 對話摘要自動傳遞至 Admin Panel、人工回覆透過 LINE Push、解決後回交系統觸發 SOP 生成、非上班時間自動建單次日優先處理 |
| PDF 手冊上傳 | 手冊 PDF 上傳 → PyMuPDF 分段 → text-embedding-004 向量化 → pgvector 索引 |
| SOP 自動生成 | 監聽成功解決事件、AI 草擬 SOP、審核佇列 |
| 情緒分流模組 | 負面情緒偵測 (>= 90%)、安撫語氣切換、管理員即時通知 |
| Admin Panel V1.0 | 知識庫管理、對話紀錄查詢、SOP 審核/發布、基礎儀表板 (Next.js 14 + shadcn/ui) |

### Phase 3: V1.0 UAT 使用者驗收測試 (W13-W15)

| 交付物 | 說明 |
|:---|:---|
| 50 題 AI 準確率測試 | 甲方真實案例測試集，目標 >= 80% |
| 壓力測試報告 | 50 並發使用者、回應時間 < 5 秒 |
| UAT 測試報告 | 甲方驗收測試執行結果 |
| Bug 修復 | 依 UAT 回饋修復所有 P0/P1 問題 |

### Phase 4: V1.0 正式部署上線 (W16-W17)

| 交付物 | 說明 |
|:---|:---|
| 生產環境部署 | Docker Compose 生產配置、TLS 設定 |
| 監控與告警 | 結構化日誌 (JSON)、Health Check API、異常告警 (Email/LINE) |
| 資料備份機制 | 每日自動備份、保留 30 天 |
| 操作手冊 | 系統管理員操作指南 |

### Phase 5: V2.0 需求分析與系統設計 (W18-W19)

| 交付物 | 說明 |
|:---|:---|
| V2.0 PRD 補充 | 派工與帳務需求細化 |
| V2.0 架構擴展設計 | Dispatch / Accounting 模組設計、Next.js 前端架構 |
| V2.0 API 規格 | 工單、技師、報價、帳務端點定義 |
| V2.0 資料庫擴展 | WorkOrder / Technician / PriceRule / Invoice 表設計 |

### Phase 6: 派工系統 MVP (W20-W24)

| 交付物 | 說明 |
|:---|:---|
| 技師工作台 Web App | 案件池瀏覽、一鍵接單、預計到達時間、進度回報 (Next.js 14 + PWA) |
| 智慧派工引擎 | 技師匹配（技能 x 地區 x 評分 x 可用時段）、工單生命週期管理 |
| 報價引擎 | 品牌 x 鎖型 x 工項標準報價矩陣、特殊加價規則（夜間/假日/遠程/高樓） |
| 推播通知 | Web Push + LINE 派工通知、消費者進度通知 |
| L3 → 派工整合 | 三層解決引擎 L3 自動建立工單並觸發派工 |

### Phase 7: 帳務系統與整合 (W25-W29)

| 交付物 | 說明 |
|:---|:---|
| 帳務結算模組 | 墊款追蹤、月結報表生成、發票/請款單、記帳憑證 |
| 完工報告流程 | 維修前後照片上傳、材料清單、實際工時記錄、AI 預測 FM vs 實際 FM 驗證（`ai_prediction_hit`）、缺陷分類（5 粗類 + 自由文字，漸進提煉為標準標籤）、修復動作 + 預防建議、驗證清單（各功能通過/不通過） |
| 增強 Admin Panel | 派工監控儀表板（地圖視覺化）、技師管理、帳務審核 (Next.js 14 + shadcn/ui) |
| CRM 客訴管理模組 | 客訴生命週期（建立→指派→處理→確認→結案）、消費者滿意度調查（完工後 LINE 問卷）、技師績效評分模型、消費者統一歷史視圖 |
| 異常流程處理 | 派工異常（拒單/取消/逾時/改約）、現場異常（加價/材料短缺/無法維修）、財務異常（報價爭議/退費/墊付爭議） |
| 系統整合測試 | V1.0 + V2.0 完整 E2E 流程驗證（含異常流程） |

### Phase 8: V2.0 UAT 與正式上線 (W30-W31)

| 交付物 | 說明 |
|:---|:---|
| 100 並發壓力測試 | V2.0 目標 >= 100 並發使用者 |
| V2.0 UAT 測試報告 | 甲方驗收測試 |
| 生產環境升級 | V2.0 模組部署、資料庫遷移 |
| E2E 驗證 | 報修 → AI 診斷 → 派工 → 完工 → 結算完整流程 |

---

## 3. 資料模型概覽 (Data Model Overview)

### 核心實體 (Key Entities)

| 實體 | 中文名稱 | 說明 | 階段 |
|:---|:---|:---|:---|
| **Conversation** | 對話 | 使用者與系統的一次完整互動 session，由多輪 Message 組成 | V1.0 |
| **ProblemCard** | 問題卡 | 從對話中擷取的結構化問題描述，三層解決引擎的輸入核心 | V1.0 |
| **CaseEntry** | 案例條目 | 知識庫中的案例記錄，含問題描述、解決方案、embedding | V1.0 |
| **ManualChunk** | 手冊段落 | PDF 手冊經解析後的文本段落，含 embedding，用於 RAG | V1.0 |
| **SOPDraft** | SOP 草稿 | AI 自動產生的標準作業程序草稿，需管理員審核後上架 | V1.0 |
| **WorkOrder** | 派工單 | 到場服務工單，含問題描述、客戶資訊、指派技師、服務狀態 | V2.0 |
| **Technician** | 技師 | 登錄技師資料，含技能清單、服務地區、可用時段、評分 | V2.0 |
| **PriceRule** | 計價規則 | 品牌 x 鎖型 x 難度的計價規則定義 | V2.0 |
| **Invoice** | 發票/請款單 | 服務完成後的帳務憑證，含明細、金額、付款狀態 | V2.0 |
| **Complaint** | 客訴記錄 | 客訴生命週期（submitted→assigned→in_progress→resolved），含類型、描述、解決方案 | V2.0 |
| **SatisfactionSurvey** | 滿意度調查 | 完工後消費者評分（整體/準時/品質/態度），LINE Flex Message 收集 | V2.0 |
| **TechnicianRating** | 技師評分 | 週期性績效指標（平均評分/完成率/準時率/首次修復率/客訴數） | V2.0 |

### 實體關聯

```
Conversation 1:1 ProblemCard
Conversation 1:N Message
ProblemCard 1:N Resolution (解決嘗試紀錄)
ProblemCard 0..1:1 WorkOrder (L3 觸發時建立)
WorkOrder N:1 Technician
WorkOrder 1:1 Invoice
WorkOrder 0..N Complaint (客訴關聯)
WorkOrder 1:0..1 SatisfactionSurvey (完工後調查)
CaseEntry --[embedding]--> pgvector index
ManualChunk --[embedding]--> pgvector index
SOPDraft --[審核通過]--> CaseEntry (入庫)
PriceRule --[查表]--> Invoice (自動報價)
```

### 向量存儲（Vector Collections）

系統使用 7 個向量存儲，全部基於 pgvector 0.7 HNSW 索引（768 維）：

- **核心業務表（V1.0 啟用）**: `case_entries`（L1 案例庫搜尋）、`manual_chunks`（L2 RAG 手冊檢索）
- **Agent 知識庫（逐步啟用）**: `kb_video`（硬體維修影片）、`kb_line_chat`（LINE 對話記錄）、`kb_website`（官網資訊）、`kb_youtube`（APP 教學）、`kb_gdrive`（內部文件）

> 完整規格見 `04_module_breakdown.md` §9 Vector Collections。

### 使用者角色（RBAC）

| 角色 | 身份 | 階段 |
|:-----|:-----|:-----|
| `line_user` | 消費者 | V1.0 |
| `reviewer` | 知識庫審核員（SOP 審核、對話唯讀） | V1.0 |
| `admin` | 營運管理員（全資源 CRUD） | V1.0 |
| `technician` | 簽約維修技師 | V2.0 |

> V2.0+ 預留 B2B 角色（brand_oem / distributor / community_manager），RBAC schema 支援動態新增。完整權限矩陣見 `04_module_breakdown.md` §13。

---

## 4. ProblemCard 關鍵欄位 (ProblemCard Key Fields)

| 欄位 | 型別 | 說明 | 必填 |
|:---|:---|:---|:---|
| `id` | UUID | 問題卡唯一識別碼 | 自動 |
| `conversation_id` | UUID (FK) | 關聯對話 ID | 是 |
| `brand` | string | 電子鎖品牌 (Yale, Samsung, Gateman, etc.) | 是 |
| `model` | string | 電子鎖型號 (YDM4109, SHP-DP609, etc.) | 否（AI 推斷） |
| `symptom` | string[] | 故障現象列表 (no_response, battery_low, keypad_error, etc.) | 是 |
| `category` | enum | 問題類別 (installation, repair, battery, wifi_setup, password_reset, lockout, other) | AI 分類 |
| `urgency` | enum | 緊急程度 (low, medium, high, critical) | AI 判斷 |
| `door_status` | enum | 門的狀態 (normal, locked_out, partially_open, jammed) | 否 |
| `network` | enum | 網路狀態 (online, offline, unstable, unknown) | 否 |
| `location` | string | 安裝地址 / 區域 | 否 |
| `media_urls` | string[] | 消費者上傳的照片/影片附件 URL | 否 |
| `intent` | enum | 使用者意圖 (consultation, repair_request, complaint, other) | AI 分類 |
| `status` | enum | 狀態 (draft, confirmed, in_progress, resolved, escalated) | 自動 |
| `completeness_score` | float | 完整度評分 (0.0 - 1.0)，< 0.85 觸發追問 | 自動 |
| `sentiment_label` | enum | 情緒標記 (positive, neutral, negative) | AI 分類 |
| `created_at` | datetime | 建立時間 (ISO 8601 UTC) | 自動 |
| `updated_at` | datetime | 最後更新時間 | 自動 |

---

## 5. API 設計概覽 (API Design Overview)

**基本 URL:** `https://api.smartlock-saas.com/api/v1`
**風格:** RESTful, JSON (UTF-8), snake_case 命名
**分頁:** Cursor-based (`limit` + `cursor`)
**認證:** JWT Bearer Token (Admin/Technician) / LINE Signature (Webhook)

### V1.0 API 端點

| 端點 | 方法 | 說明 | 授權 |
|:---|:---|:---|:---|
| `/webhook/line` | POST | 接收 LINE Webhook 事件 | LINE Signature |
| `/auth/login` | POST | 管理員登入取得 JWT | Public |
| `/auth/refresh` | POST | 刷新 Token | Bearer Token |
| `/conversations` | GET | 對話列表（支援篩選/分頁） | admin, reviewer |
| `/conversations/{id}` | GET | 單一對話詳情 | admin, reviewer |
| `/conversations/{id}/messages` | GET | 對話訊息歷程 | admin, reviewer |
| `/problem-cards` | GET/POST | 問題卡列表 / 建立 | admin |
| `/problem-cards/{id}` | GET/PATCH | 問題卡詳情 / 更新 | admin |
| `/problem-cards/{id}/export` | GET | 匯出問題卡 (JSON/PDF) | admin |
| `/knowledge-base/cases` | GET/POST | 案例列表 / 新增 | admin, reviewer |
| `/knowledge-base/cases/{id}` | GET/PUT/DELETE | 案例 CRUD | admin |
| `/knowledge-base/cases/search` | POST | 向量語意搜尋 | admin, reviewer |
| `/knowledge-base/manuals` | POST | 上傳 PDF 手冊 | admin |
| `/knowledge-base/manuals/{id}/chunks` | GET | 手冊段落列表 | admin |
| `/knowledge-base/sop-drafts` | GET | SOP 草稿列表 | admin, reviewer |
| `/knowledge-base/sop-drafts/{id}/approve` | POST | 審核通過 SOP | admin |
| `/knowledge-base/sop-drafts/{id}/publish` | POST | 發布 SOP 至知識庫 | admin |

### V2.0 API 端點

| 端點 | 方法 | 說明 | 授權 |
|:---|:---|:---|:---|
| `/work-orders` | GET/POST | 工單列表 / 建立 | admin |
| `/work-orders/{id}` | GET/PATCH | 工單詳情 / 更新狀態 | admin, technician |
| `/work-orders/{id}/assign` | POST | 手動指派技師 | admin |
| `/work-orders/{id}/accept` | POST | 技師接單 | technician |
| `/work-orders/{id}/complete` | POST | 提交完工報告 | technician |
| `/technicians` | GET/POST | 技師列表 / 註冊 | admin |
| `/technicians/{id}` | GET/PATCH | 技師詳情 / 更新 | admin, technician(self) |
| `/technicians/login` | POST | 技師登入 | Public |
| `/technicians/me/work-orders` | GET | 技師個人工單列表 | technician |
| `/pricing/rules` | GET/POST | 計價規則列表 / 新增 | admin |
| `/pricing/rules/{id}` | GET/PUT/DELETE | 計價規則 CRUD | admin |
| `/pricing/quote` | POST | 根據 ProblemCard 自動報價 | admin |
| `/pricing/surcharges` | GET/POST | 特殊加價規則 | admin |
| `/accounting/invoices` | GET/POST | 發票列表 / 建立 | admin |
| `/accounting/invoices/{id}` | GET/PATCH | 發票詳情 / 更新 | admin |
| `/accounting/settlements` | GET/POST | 月結報表列表 / 產生 | admin |
| `/accounting/settlements/{id}/approve` | POST | 審核結算 | admin |
| `/accounting/vouchers/{id}/export` | GET | 匯出記帳憑證 (PDF/CSV) | admin |

---

## 6. 限界上下文 (Bounded Contexts)

| 限界上下文 | 英文名稱 | 核心職責 | 核心實體 | 階段 |
|:---|:---|:---|:---|:---|
| **客服上下文** | CustomerService | LINE Bot 互動、對話管理、ProblemCard 建立與填充、三層解決機制執行 | Conversation, ProblemCard, Message | V1.0 |
| **知識庫上下文** | KnowledgeBase | 案例管理、手冊解析、Embedding 計算、向量搜尋、SOP 自動生成與審核 | CaseEntry, ManualChunk, SOPDraft | V1.0 |
| **派工上下文** | Dispatch | 工單建立與管理、技師匹配與指派、排程、工單狀態追蹤 | WorkOrder, Technician, Assignment | V2.0 |
| **帳務上下文** | Accounting | 計價規則管理、報價生成、對帳、發票管理、統計報表 | PriceRule, Invoice, Voucher | V2.0 |
| **使用者管理上下文** | UserManagement | LINE 用戶綁定、管理員/技師帳號、JWT 認證、RBAC 權限 (admin/reviewer/technician) | User, Admin, Role | V1.0+V2.0 |
| **審計上下文** | Audit | API 呼叫紀錄、LLM 互動歷史、RAG 來源引用、審批紀錄、家族覆核紀錄 | AuditLog, FamilyReviewRecord | V1.0 |
| **情緒分流上下文** | SentimentTriage | 負面情緒偵測、優先回應協議觸發、管理員即時通知 | SentimentResult, EscalationNotification | V1.0 |

### 上下文關係

| 上游 | 下游 | 模式 | 說明 |
|:---|:---|:---|:---|
| CustomerService | KnowledgeBase | Conformist | 客服遵循知識庫資料結構查詢案例 |
| CustomerService | Dispatch | Customer-Supplier | L3 觸發時提交工單建立請求 |
| KnowledgeBase | CustomerService | Published Language | 知識庫提供公開的搜尋結果結構 |
| Dispatch | Accounting | Customer-Supplier | 派工完成觸發帳務計算與請款 |
| Dispatch | CustomerService | Anti-Corruption Layer | 防腐層轉譯 ProblemCard 避免領域耦合 |
| 所有上下文 | UserManagement | Conformist | 遵循統一的身分與權限模型 |

---

## 7. 允收標準 (Acceptance Criteria)

### 功能性允收標準（按階段）

| 階段 | 允收標準 |
|:---|:---|
| **Phase 1** | LINE Bot 可接收文字/圖片訊息並回應；ProblemCard 可從對話自動生成；L1 向量搜尋命中時正確回覆解決方案 |
| **Phase 2** | L2 RAG 引擎可生成含來源標註的解決方案；L3 可轉接人工並傳遞對話摘要；SOP 可自動草擬並由管理員審核發布；PDF 手冊上傳後 60 秒內可被搜尋命中 |
| **Phase 3** | AI 準確率 >= 80%（50 題測試集）；50 並發壓力測試通過；所有 P0 Bug 修復 |
| **Phase 4** | 生產環境穩定運行 >= 7 天；備份機制正常運作；監控告警功能正常 |
| **Phase 6** | 技師可透過 Web App 瀏覽案件池並一鍵接單；派工引擎可自動匹配技師；報價引擎可根據 ProblemCard 自動生成報價單 |
| **Phase 7** | 完工報告可提交並觸發帳務流程；月結報表可自動產生；記帳憑證可匯出 PDF/CSV |
| **Phase 8** | 100 並發壓力測試通過；E2E 流程（報修 → 診斷 → 派工 → 完工 → 結算）完整走通 |

### 非功能性需求目標 (NFR Targets)

| 類別 | 需求 | 目標值 |
|:---|:---|:---|
| **AI 準確度** | AI 回答準確率 | >= 80% |
| **效能** | AI 首次回應時間 | < 5 秒 |
| **效能** | 案例庫向量搜尋延遲 | < 3 秒 |
| **效能** | RAG Pipeline 回覆延遲 | < 8 秒 |
| **效能** | Admin Panel 頁面載入 | < 2 秒 |
| **並發** | V1.0 同時在線使用者 | >= 50 |
| **並發** | V2.0 同時在線使用者 | >= 100 |
| **可用性** | 系統 Uptime | V1.0 >= 95%（月度）；V2.0 目標 >= 99.5%（需 Read Replica + 負載均衡） |
| **安全性** | API 通訊加密 | HTTPS / TLS 1.2+ |
| **安全性** | 敏感資料加密 | AES-256 at rest |
| **安全性** | Prompt Injection 攔截率 | >= 95% |
| **安全性** | 內容過濾誤攔率 | < 1% |
| **安全性** | 負面情緒識別率 | >= 90% |
| **可觀測性** | 結構化日誌 | JSON 格式，含 trace_id |
| **備份** | 資料庫備份 | 每日自動，保留 30 天 |
| **可維護性** | 核心業務程式碼覆蓋率 | >= 70% |

---

## 8. 風險評估 (Risk Assessment)

| 風險 ID | 風險描述 | 影響程度 | 發生機率 | 緩解策略 |
|:---|:---|:---|:---|:---|
| R-001 | **AI 準確率未達標** - Gemini 2.5 Flash 對電子鎖領域知識不足，無法達到 80% 準確率 | 高 | 中 | 持續擴充知識庫種子資料；優化 Prompt Template；利用 Few-shot 範例；加強 RAG 上下文品質 |
| R-002 | **LLM API 配額與成本** - Google AI API 呼叫量超出預算或遇到限流 | 中 | 中 | 設定 Token 追蹤與成本告警；實作 Redis 快取減少重複呼叫；設計 Fallback 機制 |
| R-003 | **甲方種子資料品質** - 歷史案例資料不足或品質不一致，影響知識庫初始效果 | 高 | 中 | 提前與甲方確認資料格式與數量要求；設計資料清洗流程；提供 CSV 匯入範本 |
| R-004 | **LINE API 限制** - LINE Messaging API 的 Rate Limit 或 Flex Message 格式限制影響使用體驗 | 低 | 低 | 實作 Rate Limiting 保護；簡化 Flex Message 設計；預留降級方案（純文字回覆） |
| R-005 | **併發效能瓶頸** - PostgreSQL + pgvector 在高並發向量搜尋下效能不足 | 中 | 中 | 使用 HNSW 索引加速搜尋；實作 Redis 快取熱門查詢結果；監控查詢延遲 |
| R-006 | **V2.0 派工引擎匹配品質** - 技師匹配演算法無法滿足實際業務需求 | 中 | 中 | 與甲方資深調度人員共同定義匹配權重；保留管理員手動指派覆蓋機制 |
| R-007 | **人員流動風險** - 小型團隊 (1-3 人) 的人員變動對專案進度影響大 | 高 | 低 | 完善技術文件；程式碼審查制度；知識轉移 SOP |
| R-008 | **Prompt Injection 攻擊** - 惡意使用者嘗試注入指令操控 AI 行為 | 中 | 中 | 多層防護（輸入過濾 + System Prompt 隔離 + Output Guardrail）；定期更新攻擊模式黑名單 |
| R-009 | **資料安全與隱私** - 客戶地址、聯絡資訊等個人資料外洩風險 | 高 | 低 | TLS 加密傳輸；AES-256 靜態加密；RBAC 存取控制；定期安全審查 |

---

## 9. 外部依賴 (External Dependencies)

| 依賴項目 | 提供者 | 用途 | 風險等級 |
|:---|:---|:---|:---|
| LINE Messaging API | LINE Corporation | 消費者對話管道、Webhook 接收、訊息推送 | 低 |
| Google Gemini 2.5 Flash API | Google | 意圖辨識、對話生成、SOP 生成、ProblemCard 擷取 | 中 |
| Google Embeddings API (text-embedding-004) | Google | 文本向量化（案例庫、手冊 chunks） | 中 |
| Google Maps API | Google | V2.0 地圖視覺化、距離計算 | 低 |

**注意:** AI 影像辨識已依合約 SOW 2.1(4) 排除。消費者上傳之照片僅作為附件存儲，不進行 AI 影像分析。

---

*本文件為軟體需求分析與工作說明書，完整架構設計請參閱 `docs/05_architecture_and_design_document.md`，完整 API 規格請參閱 `docs/06_api_design_specification.md`。*
