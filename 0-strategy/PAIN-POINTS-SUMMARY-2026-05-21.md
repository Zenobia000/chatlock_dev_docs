---
title: 智慧鎖售後服務平台 — 痛點總結結構化文件（v2 Pre-mortem 升維）
date: 2026-05-21
version: v2.0
sources:
  - 4-prd-fr-arch/01-prd/PRD-0001-2026-q1-v1-launch.md
  - 4-prd-fr-arch/01-prd/SOW-0001-2026-q1.md
  - 4-prd-fr-arch/01-prd/BIZ-0001-executive-architecture-overview.md
  - 4-prd-fr-arch/01-prd/DISC-0001-blueprint-snapshot-2026-05-16.md
  - 4-prd-fr-arch/02-fr/FR-0001 ~ FR-0025 (25 份)
  - 4-prd-fr-arch/03-nfr/PRIN-0002-frontend-quality-attributes.md
  - 4-prd-fr-arch/04-architecture/ARCH-0001-architecture-overview.md
  - 4-prd-fr-arch/04-architecture/adr/ADR-0001 ~ ADR-0030 (30 份)
  - 01-workorder-erp-final-spec-20260520.xlsx (40 sheets, 165 Q&A + 64 rules)
  - 02-ai-chatbot-sync-final-spec-20260520.xlsx (44 sheets, A01-A12 + S01-S06)
status: draft
---

# 智慧鎖售後服務平台 — 痛點總結

> **本文件 v2 升維（2026-05-21）**：原 62 條痛點清單保留作為「現狀盤點」附錄（第二部分），新增「策略藍圖」（第一部分 §A-§G）以 **Pre-mortem（預先驗屍）** 反推什麼是亙古不變、什麼是過渡技術。
>
> **設計指導**：站在 5-10 年後回看，今天該鎖定什麼、該保留替換餘地什麼。不以 2026 年的技術（LangGraph / Gemini / pgvector / LINE / FastAPI / Cloud Run）作為錨點；這些都會被替換。
>
> **CEO 三大維度**：① 長期護城河 ② 可持續迭代 ③ AI 時代下「數據 + 知識 + AI 自主協作」三足鼎立。
>
> **痛點分類**：
>
> - 🔴 **P0 阻擋**：未決議前無法開始 coding 或會立即破壞合約交付
> - 🟡 **P1 緊急**：影響 launch 品質，需 Phase I 內收斂
> - 🟢 **P2 觀察**：roadmap 期內可處理，但需登記在案

---

# 第一部分：策略藍圖（CEO Pre-mortem 視角）

---

## §A Pre-mortem — 7 種未來失敗劇本（5-10 年時間視角）

不是「會出哪些 bug」，而是「**5-10 年後產品死掉，回頭看死因是什麼**」。每個劇本對應到 §B 的某層 Eternal Substrate；沒有 Pre-mortem 對應的層就是過早優化的技術選型。

| # | 失敗劇本 | 根本死因 | 對應的亙古設計原則 | 對應 §B 層 |
|---|---------|---------|------------------|----------|
| **F1** | **資料淺薄死** — 累積 3 年仍是「對話 log + 工單表」，競爭者用更強模型 + 公開知識就能複製，沒有 proprietary data network effect | 資料只當 audit 用，沒當 training & evaluation signal | **資料即資產**：Bronze→Silver→Gold medallion 從 day 1 設計；每筆對話、證據、月結都是 future fine-tune / eval set | B1 |
| **F2** | **知識被技術綁架死** — SOP / Skill / Eval 全寫在當代框架的 prompt 與 vendor-specific format 內，換 LLM 廠商要全部重做 | 知識存在「執行框架」而非「資料層」 | **知識可攜性**：SKILL.md / Eval set / Policy 全部 vendor-neutral markdown + structured fields，任何 agent runtime 都能讀 | B1, B3 |
| **F3** | **HITL 邊界漂移死** — AI 越權承諾保固 / 報價 / 退款 → 一次重大客訴 + 法律訴訟 → 品牌信任歸零 | AI 不可決策清單寫在 prompt 而非合約契約 | **政策即合約**：禁止項以 ADR + 自動測試固化，model swap 不會稀釋邊界 | B3 |
| **F4** | **合規崩潰死** — 一次 PII 外洩、一次合約 4.4 條款未履行（負面情緒識別 < 90% / 家族覆核斷鏈） → 甲方終止合約 | 合規視為「附加項」而非「主動脈」 | **合規即一級公民**：retention / RBAC / family-review / PII 全寫進 schema，違反就 build fail | B3, B4, B5 |
| **F5** | **規模困境死** — 每進一個新品牌 / 新地區 / 新國家都要重 code，2-3 年後變成多分支噩夢 | Tenant / Brand / Locale 沒在 day 1 設計進主檔 | **多租戶優先**：即使 V1.0 單甲方，所有業務物件都帶 tenant_id / brand_scope / locale | B1 |
| **F6** | **人才流失死** — 資深技師 / Domain expert 離職，未數位化的隱性知識消失 | SOP 螺旋未閉環，知識仍依賴個人 | **知識螺旋（S1-S7）強制收斂**：成功案例自動草擬 SOP → 客服主管 + Domain expert 雙審 → 入庫 → 評測 → 反饋 | B1, D2 |
| **F7** | **被 AI 巨頭吞噬死** — Anthropic / Google / OpenAI 出 vertical "locksmith agent"，鎖匠服務變 commodity | 沒有「無法被 LLM 廠商複製」的層 | **物理 + 信任 + 結算護城河**：師傅生態 / 證據鏈 / 月結帳本是巨頭不會也不能做的層 | D1, D3, B4, B5 |

**核心洞察**：F1-F5 是 5-10 年內的「戰術死因」（技術選型 / 流程治理），F6-F7 是 30 年內的「戰略死因」（人才資產化 / 商業模式被取代）。本藍圖優先處理 F1-F5，但 §D 護城河同時防 F6-F7。

---

## §A.1 Pre-mortem 2026-05-22 會議裁決

**會議結論**：F1-F7 全部 ✓ 認同為大風險（部分當天票面投「過慮」但備註已給設計指引，會後改投 ✓ 認同）。每條風險的當前狀態與對應 ADR：

| # | 風險 | 現況 | 業主決議 | 對應 ADR |
|---|------|------|---------|---------|
| **F1** | 資料淺薄死 | 🟡 黃燈（Phase 0 排程） | Bronze 先收齊（V1.0），Silver/Gold 延至 Phase 0+；副廠 / 維修廠商資料納入 Bronze schema | §B1 / §E1 Bronze / 規劃中 ADR |
| **F2** | 知識被技術綁架死 | 🟡 黃燈 → 進行中 | 三條設計鐵律：SKILL 可抽換 / LLM 可抽換 / 兩者解耦 | **ADR-0055** (SKILL ↔ LLM 解耦)、ADR-0057 (RAG 取代 prompt) |
| **F3** | HITL 邊界漂移死 | 🟡 黃燈 → 進行中 | 每廠商合約 attach，LLM 走 RAG 文件檢索禁寫 prompt | **ADR-0056** (廠商合約附件)、**ADR-0057** (RAG)、ADR-0028 / ADR-0047 charter Forbidden |
| **F4** | 合規崩潰死 | 🔴 紅燈 → 進行中（V1.0 必交）| 合規從「附加項」拉成「主動脈」；4.4(a) UAT / 4.4(d) 家族覆核 / PII retention 全 V1.0 內建 | ADR-0042 (RBAC) / ADR-0050 (Evidence 可見性) / ADR-0051 (Retention) |
| **F5** | 規模困境死 | 🟡 黃燈 | 第二甲方規劃 + 所有基本資料獨立化（tenant_id / brand_scope / locale 一級欄位）| ADR-0030 / ADR-0043 (Contract Template) |
| **F6** | 人才流失死 | 🟡 黃燈 → 進行中（雙路徑並行）| (c) SOP 螺旋仍跑 + 外部知識傳承平台 ingest 進 SOP 庫 | ADR-0038 (SOP 雙審)、**ADR-0058** (外部平台 ingestion) |
| **F7** | 被 AI 巨頭吞噬死 | 🟡 黃燈 → 進行中（IoT pipeline 待建）| 護城河三柱：線下師傅 + 物理 Evidence + 合約履約；電子鎖 IoT 訊號 → App → AI 客服 | **ADR-0059** (IoT 訊號接入)、ADR-0056 (合約)、§D3 護城河 |

**ADR 拍板統計**：
- 原 §F 24 條 trade-off → 24 條 ADR 全部 accepted ✅（ADR-0031~0054）
- 會議新發現 → 5 條新 ADR accepted ✅（**ADR-0055~0059**）
- 詳見 [`3-adr/INDEX.md`](../3-adr/INDEX.md) 與 [`ACTION-ITEMS-2026-05-22.md`](../2-meetings/2026-05-22/ACTION-ITEMS-2026-05-22.md)

**兩條 ADR 業主備註調整**（與推薦做法有差）：
- **ADR-0032 地址**：推薦做法 + 加碼**結案前硬 gate**（派工不擋、師傅可 skip、結案 422 強制驗證）
- **ADR-0039 取消費**：5 階段 system 自判 + **全階段客服可覆寫** + 已派工未出發改為**不收費**（舊版收檢測費 300，業主決議：師傅未出發無實質成本）

---

## §B Eternal Substrate — 5 層亙古不變核心

**定義**：100 年後仍會存在的設計。鎖匠這個行業 50 年沒消失，售後服務 100 年都會在。AI 是工具，業務本質不變。

**設計鐵律**：本層**絕對不能 import 任何 §C Transient Tooling 的具名 SDK**（不可 import LLM client / vector DB client / messaging SDK）。跨層通訊用 schema + event，不用 vendor 物件。

### B1. 資料主權層（Data Sovereignty）

**永恆業務物件**（無論誰實作都需要）：

| 物件 | 永恆語意 | 必帶欄位 |
|------|---------|---------|
| Customer | 客戶身分 | `tenant_id` / `brand_scope[]` / `locale` / `pii_retention_policy` |
| Site | 服務地點（含建案 / 社區）| `site_group_id` / `address` / `geo_district` |
| Device | 設備（含序號）| `serial` / `brand` / `model` / `purchase_date` / `warranty_start_date` / `warranty_mode` |
| Conversation | 對話 session | `channel_type`（不寫 LINE）/ `summary` |
| ProblemCard | 結構化問題卡 | `brand` / `model` / `symptom[]` / `urgency` / `completeness_score` / `media_refs[]` |
| Quote | 報價 | `version` / `effective_date` / `approval_chain` |
| WorkOrder | 工單 | `state` / `state_history[]` / `tenant_id` / `idempotency_key` |
| Onsite | 現場執行 | `arrival_proof` / `material_used[]` / `customer_signature` |
| Evidence | 證據包 | `sha256` / `retention_until` / `rbac_scope` |
| Settlement | 結算 | `ledger_type` / `period` / `audit_trail[]` |

**永恆設計原則**：
- **Vendor-neutral schema** — 用 JSON Schema / Protobuf 描述，不綁特定 DB（不是 "PostgreSQL table"）
- **多租戶一級公民** — `tenant_id` / `brand_scope` / `locale` 必須是每個物件的根欄位，不是 metadata（防 F5）
- **PII retention 入 schema** — `pii_retention_policy` 直接掛在 Customer，schema 強制驗證（防 F4）
- **Content-addressable Evidence** — `sha256` 為 evidence primary key，存哪都行（防 F4 + F7）

**對應 Excel**：01-sheet 03（M01-M20 模組地圖）、01-sheet 06（業務規則庫 BR-M01~M20）、02-sheet 14（Sync 架構 L1-L6）、02-sheet 15（Sync 資料對照）、02-sheet 23（Cross Contract ownership）、02-sheet 24（Sync 對 ERP 35 條映射）、02 全部 S M01-S M06（Intake/Facts/PC/ConvertWO/Dispatch/Evidence 同步）。

**不變理由**：客戶名、地址、設備序號、證據照片 50 年後還是同樣的欄位類型。

---

### B2. 業務狀態機層（Process State Machines）

**七大永恆狀態機**：

| 狀態機 | 狀態集合（永恆語意） | 永恆轉換規則 |
|--------|------------------|------------|
| **Conversation** | `active → resolving → escalated → closed` | 48h 無人回覆 → 自動 closed（合規）|
| **ProblemCard** | `incomplete → draft → confirmed → resolved` | brand + model + symptom + completeness ≥ threshold → confirmed |
| **Quote** | `draft → internal_approved → customer_sent → customer_confirmed → expired` | 過期需 re-version，不可 silent extend |
| **Payment** | `deposit_required → paid → pending → failed → refund_requested` | 末五碼 / 收款證明為轉態前置 |
| **WorkOrder** | `created → assigned → accepted → in_progress → completed → cancelled` | `confirmed PC + address present` 為 `created` 前置條件 |
| **Onsite** | `arrived → working → scope_change → completed / customer_not_onsite` | scope_change 必帶 customer signature + evidence |
| **RMA** | `opened → investigating → assigned → resolved / rejected` | 責任矩陣未填不可 close |

**永恆設計原則**：
- 狀態 + 轉換規則為 **pure domain logic**，不能依賴任何 LLM / framework / messaging SDK
- 每個狀態轉換產生 **immutable state_history event**（B5 證據鏈）
- 同一物件不容許「多套狀態語意」（解 SYNC-01 三套狀態不對齊問題）

**對應 Excel**：01-sheet 13（狀態異常 10 個對象）、01-M05/M06/M08/M13（Lifecycle 狀態機）、02-sheet 16（三套狀態對照）、02-sheet 17（Sync 整合 9 種 API）、ADR `SM-0001-work-order`。

**不變理由**：「報價 → 確認 → 派工 → 到場 → 完工 → 收款」這個流程在電鎖 / 水電 / 汽車維修 / 醫療都一樣。

---

### B3. 政策與契約層（Policy & Contract）

**永恆禁區**（AI 100 年後依然不能做）：

```yaml
ai_forbidden:
  - final_price_commitment
  - refund_approval
  - warranty_liability_judgment
  - legal_safety_promise
  - dangerous_repair_instruction  # 自行拆鎖 / 改電路
```

**永恆 HITL gates**（升級到人類的硬規則）：

```yaml
hitl_triggers:
  - urgent_red_code:  [locked_out, trapped_inside, safety_risk, angry_customer_high_risk]
  - high_amount:      [quote_above_brand_threshold]
  - warranty_unclear: [warranty_period_disputed, project_handover_date_missing]
  - finance:          [refund_requested, settlement_dispute]
  - legal_safety:     [legal_inquiry, safety_inquiry]
  - failed_attempts:  [count >= 3]
```

**永恆 RBAC 四層原則**（具體欄位走 Transient configuration）：

| 層 | 角色 | 可見性原則 |
|----|------|-----------|
| **顧客層** | Customer / AI Bot | 只看自己單據，不看成本 |
| **營運層** | Customer Service / Dispatcher / Locksmith | 看案件必要欄位，不跨域 |
| **財務層** | Accounting | 看全域財務 + 必要工單證據 |
| **治理層** | Supervisor / Admin / IT / Auditor / Family Reviewer | 看全域報表 / 唯讀稽核 |

**永恆 ChangeRequest 物件**（系統設定變更流程）：
- `apply → approve → effective_date → audit_trail` 四步流程，永遠如此
- 任何政策 / 價格 / 權限 / SLA / 模板 / AI SOP 變更都走此物件

**對應 Excel**：01-sheet 04（20 條 P0 決策）、01-sheet 06（64 條 BR 規則）、01-sheet 10（流程 Gate）、01-sheet 11（權限角色矩陣 18 行）、01-sheet 12（角色維護者）、01-M15（Exception/Approval/Risk Control）、01-M17（Auth/Audit）、02-sheet 04（G1-G8 八關卡）、02-sheet 08（風險治理 7 類）、ADR-0028（AI Employee Charter）。

**不變理由**：AI 再強 100 年，「誰能花錢、誰能承諾、誰能簽字」這個治理問題永遠存在。

---

### B4. 金融完整性層（Financial Integrity）

**七張永恆帳本**（500 年沒變的複式記帳，AI 改變不了）：

| 帳本 | 永恆角色 | 永恆控制 |
|------|---------|---------|
| Customer AR | 客戶應收 | 每筆金流核銷到工單 / RMA |
| Technician AP | 師傅應付 | 客訴爭議只暫扣爭議金額 |
| Cash Collection | 師傅代收 | 收款證明 + 月結抵扣 |
| Brand Settlement | 品牌月結 | 品牌可見性僅及自家資料 |
| Dispatcher Commission | 派工者月結 | 與師傅工資分表，獨立 ledger |
| Refund Ledger | 退款帳 | 依金額分層核准 + 責任歸屬留證 |
| Invoice & Tax | 發票稅務 | 開票責任依案件類型（B2C/B2B/品牌代收）|

**永恆設計原則**：
- **Double-entry bookkeeping** — 借方 = 貸方，永遠成立
- **Immutable ledger** — 帳本 append-only，更正用 reversal entry，不修改歷史
- **Reason code 制** — 每筆異動帶具名 reason code，未來 BI / 詐欺偵測可用
- **Audit trail 入帳本** — 不是 side table

**對應 Excel**：01-sheet 14（七張帳本）、01-M11（AR/Refund）、01-M12（AP/Settlement）、01-M14（Partner Portal B2B settlement）、01-sheet 08（Phase II Finance 30 條）、02-sheet 25（Phase III-V Finance awareness）。

**不變理由**：複式記帳 500 年沒變，AI 改變不了會計準則。**對應 Pre-mortem F4**（合規崩潰最常見死於財務不可審）。

---

### B5. 證據與可稽核層（Evidence & Auditability）

**永恆設計原則**：
- **Append-only** — Evidence 不可修改，新版本用新 sha256
- **Content-addressable** — `sha256(blob)` 為 primary key，存哪都行（local / S3-like / IPFS）
- **Retention by case lifecycle** — 案件結案 + 3 年保存（RMA / 客訴）；其他 1 年
- **RBAC visibility** — 不同角色看到不同子集（品牌、師傅、會計、客戶、稽核員）
- **E-signature 一級欄位** — 客戶簽名 / 家族覆核 / 主管核准都是 evidence

**Domain Event Catalog**（15 個事件，全部 永久 或 1y retention）：
- `conversation.message.received` / `user_facts.updated` / `skill.loaded`
- `problem_card.create_requested` / `created` / `confirmed` / `resolved`
- `work_order.created` / `assigned` / `accepted` / `completed`
- `evidence.uploaded` / `ai_quality.feedback` / `policy.decision` / `kill_switch.activated`

**Idempotency / DLQ 永恆契約**：
- 每個 operation 有 `idempotency_key` 公式（永久或 24h dedup window）
- 失敗事件進 DLQ，明確 retry 策略 + alert 門檻 + 人工補償 SOP

**對應 Excel**：01-M09（Evidence 7 條規則）、02-sheet 18（Outbox 7 事件）、02-sheet 21（Idempotency / DLQ 9 種操作）、02-sheet 22（Domain Event Catalog 15 事件）。

**不變理由**：法律糾紛 / 保固爭議 / 月結對帳都依賴可重播的證據鏈。**對應 Pre-mortem F3 + F4 + F7**（沒有證據鏈就沒有信任護城河）。

---

## §C Transient Tooling — 5 層可替換技術

每一層都要設計**抽象介面 + 適配器**，讓換零件時 §B Eternal Substrate 不受影響。

| 層 | 抽象介面 | 當代選型（2026） | 5-10 年後可能的替換 | 更換成本估計 | 對應 §B 層 |
|----|---------|----------------|-------------------|-------------|----------|
| **C1 對外通道** | `IngressChannel` | LINE Messaging API | WhatsApp / RCS / 自建 PWA / WebRTC / Matrix | 1-2 週 | 寫入 B1 Conversation |
| **C2 LLM 推理** | `LLMProvider` registry + Model Routing | Gemini 2.5 Pro / Claude / GPT 系列 | 任何新模型 / on-device SLM / 多 agent 編排 | 3-5 天 | 不可寫 B1-B5，只能讀 + 提建議 |
| **C3 向量檢索** | `VectorStore` | pgvector HNSW | Pinecone / Weaviate / 任何 ANN 方案 | 1-2 週 | 索引 B1 Knowledge artifacts |
| **C4 Agent runtime** | `AgentRuntime` + `ToolRegistry` | LangGraph + LiteLLM | OpenAI Assistants / 自研 ReAct / Anthropic SDK 直接 | 2-4 週 | 透過 ToolRegistry 訪問 B1/B2 |
| **C5 容器 / 雲** | `Deployment` profile | Google Cloud Run + Docker | K8s / Lambda / 邊緣運算 / 自建 IDC | 1-2 週 | 部署 B1-B5 services |

**核心原則**：
- §B 的程式碼**禁止 import** §C 的任何具名 SDK
- 跨層通訊用 schema + event（B5 Domain Events），不用 vendor 物件
- 每個 §C 層至少有 2 個 Adapter 實作（即使只用一個）以證明抽象有效

**對應 Excel**：02-sheet 11（Model Routing 5 條：Quick Reply / FAQ / SOP / 高風險 / Vision）、02-sheet 12（Tool Registry 5 個正式工具 + 3 個 P1/P2）、02-A M11（部署健康）。

**Pre-mortem 自檢**：「如果 LINE 倒閉？」答案應該是「**§B 全部不需改，只改 §C1 IngressChannel 的 LINE Adapter，新增 WhatsApp Adapter，2 週內可上線**」。如果這個答案不成立，§B 與 §C 的邊界就被污染了。

---

## §D 三大護城河（無法被 LLM 巨頭複製的層）

### D1. 資料護城河（Data Moat）

**量化目標（3-5 年）**：
- ≥ 50 萬筆 ProblemCard（覆蓋 50+ 品牌 × 30+ 故障類型 × 全台地理分布）
- ≥ 30 萬筆 Onsite Evidence（含完工前後照片 / 客戶簽名 / 材料使用紀錄）
- ≥ 10 萬筆 Customer × Device × Service 三元組（重複服務 + 保固生命週期）
- ≥ 5 萬筆師傅評分 / 客戶滿意度（驅動派工演算法）

**設計指南**：
- 每筆業務動作必須產生 Bronze 級事件 → 每天 ETL 升 Silver → 每週升 Gold
- 對應 SOW 已寫的 **Bronze → Silver → Gold Medallion Architecture**，但目前未閉環
- 對話 / 證據 / 月結都是 training & evaluation signal，不是「audit 用」

**競爭意義**：再強的 LLM 沒有「這個品牌這個型號這個故障在這個地區的真實 6000 個案例」就無法複製判斷品質。**這是巨頭無法 catch up 的層** — 他們有模型，沒有現場資料。

**對應 Excel**：02-sheet 22（Domain Event Catalog 15 事件全部 `永久` 或 `1y` retention，已準備好升 Gold）、01-M19（BI/KPI 報表）、SOW §1 已寫但未閉環 Medallion。

**Pre-mortem 對應**：F1（資料淺薄死）+ F7（被 AI 巨頭吞噬死）。

---

### D2. 知識護城河（Knowledge Moat）

**量化目標（3-5 年）**：
- ≥ 1500 條 approved SKILL.md（覆蓋 50+ 品牌 × 30+ 故障 × 平均 1 條 SOP）
- Eval Set ≥ 1000 題（含合約 4.4(a) 負面情緒 ≥ 90% 為其中一塊）
- ≥ 200 條 vendor-neutral SOP 螺旋驗證過的 best practice
- 每季回收 ≥ 50 條 human correction → 進 S6 反饋

**設計指南**（Excel-02 sheet 05 RAG 7 步螺旋強制閉環）：
- **S1 Source** → 知識來自可溯源資料（手冊 / 政策 / 歷史對話）
- **S2 Chunk/Classify** → 語義分段 + 品牌隔離（混品牌會致命）
- **S3 Skill Draft** → 結構化為「工具化技能」供 AI 使用
- **S4 Agent Use** → 透過 Tool Registry 調用
- **S5 Eval/Audit** → 自動評測
- **S6 Human Correction** → 客服主管 + Domain expert 雙審
- **S7 Release** → effective_date + version + rollback

**競爭意義**：
- 知識資產跟著公司走，不跟著資深技師個人走（防 F6 人才流失死）
- SKILL.md 為 vendor-neutral markdown，換 LLM 不需重寫（防 F2 知識被技術綁架）

**對應 Excel**：02-sheet 05（RAG 知識治理 7 步螺旋）、02-sheet 06（Agent 訓練規格）、02-sheet 07（Eval 品質系統 11 條）、02-A M04（Skill 知識庫）、02-A M10（SOP 反饋）、01-M20（AI Ops 知識治理）。

**Pre-mortem 對應**：F2（知識被技術綁架）+ F6（人才流失死）。

---

### D3. 信任與生態護城河（Trust & Ecosystem Moat）

**三個生態圈（永恆，無法被 LLM 廠商做）**：

1. **簽約師傅 × 服務區生態**（M07 Workforce）
   - 技能矩陣 / 品牌授權 / 服務區 / 評分 / 月結履約紀錄
   - 量化目標：≥ 500 位活躍師傅 × 22 縣市覆蓋
2. **品牌商 / 經銷 / 建商生態**（M14 Partner Portal）
   - 合約模板 / B2B SLA / 品牌可見性 / 建商專案點交日
   - 量化目標：≥ 30 品牌合約 + ≥ 200 建案點交
3. **客戶 LINE-ID + Device 綁定的重複服務**（M02 Customer/Site/Device）
   - 量化目標：≥ 30 萬戶客戶 / 重複服務率 ≥ 25%

**設計指南**：
- 每筆完工自動沉澱師傅評分 / 客戶滿意度 / 保固承諾 / 月結履約紀錄
- 評分 / 紀錄為 evidence（B5）而非 ratings table，不可篡改

**競爭意義**：LLM 巨頭做不到「線下師傅生態 + 物理證據鏈 + 合約履約紀錄」。**這是物理世界護城河**，AI 巨頭只能在數位層競爭。

**對應 Excel**：01-M07（Workforce 4 條規則）、01-M11（AR 8 條）、01-M12（AP 9 條）、01-M14（Partner Portal 5 條）、01-sheet 14（七張帳本）、02-sheet 23（Cross Contract Brand 隔離規則）。

**Pre-mortem 對應**：F7（被 AI 巨頭吞噬死）+ F5（規模困境死）。

---

## §E AI 時代三足鼎立（業主指定維度）

三足缺一不可：只有數據沒有知識 = 機器無法學會領域 know-how；只有知識沒有 AI 協作 = 知識變成讀不完的文檔；只有 AI 沒有數據 + 知識 = 模型輸出無依據，容易幻覺。

### E1. 數據（Data）— 不只是 log，是 ML signal

**三層 Medallion Architecture**（SOW 已宣告但未閉環）：

| 層 | 用途 | Retention | 對應 |
|---|------|----------|------|
| **Bronze** | raw event / message / audit log | 90d ~ 永久 | B5 Domain Events |
| **Silver** | cleaned + linked entities + structured fields | 1y ~ 5y | B1 業務物件 |
| **Gold** | feature store / eval set / training corpus | 永久 | D1 Data Moat |

**每一個業務事件都是 ML signal**：
- 對話 → next-action prediction（客服省力）
- 工單 → 派工成本預測（D3 派工演算法）
- 月結 → 詐欺偵測（B4 ledger 異常）
- Evidence → 視覺品質檢測（合約 4.4 補充）

**對應 Excel**：02-sheet 22 Domain Events 15 個事件已有 retention policy，但未進 medallion 升級管線（即無 Silver/Gold ETL）。01-M19 BI/KPI 為 Gold 出口。

---

### E2. 知識（Knowledge）— 不只是 RAG，是可演化資產

**7 層記憶架構**（Excel-02 sheet 10 Memory）：

| 層 | 永恆業務 / 過渡技術 | 用途 |
|---|------------------|------|
| Working (Turn Buffer) | 過渡技術 | 單輪內臨時上下文（具體實作 Redis / Postgres / Memory 不重要）|
| Session (24h) | 過渡技術 | 對話歷史聚焦 |
| **Episodic (User Facts)** | **永恆業務** | 客戶檔案：電話 / 地址 / 設備 — 任何客服都需要 |
| **Semantic (Knowledge)** | **永恆業務** | SOP / FAQ / 品牌資料 — 知識庫是客服根基 |
| **Procedural (Policy)** | **永恆業務** | 規則、禁區、報價限制 — 政策遵循不可妥協 |
| **Archival (Audit)** | **永恆業務** | 完整可重播紀錄 — 爭議追溯、合規稽核 |
| **Forget List (GDPR)** | **永恆業務 + 法律** | 客戶刪除權執行 — 隨隱私法進化但永遠存在 |

**演化機制**：每筆 conversation 結束都有機會觸發 S6 Human Correction → S7 Release，閉環知識螺旋（§D2）。

**對應 Excel**：02-sheet 05（RAG 治理）、02-sheet 06（Agent 訓練規格）、02-sheet 07（Eval 系統）、02-sheet 10（Memory 7 層）、02-A M02（品牌型號 Profile = Episodic）、02-A M04（Skill 知識庫 = Semantic）。

---

### E3. AI 自主協作（Autonomous Collaboration）— 不只是 ReAct，是治理框架

**5 個永恆工具抽象**（永恆，任何 agent runtime 都需要）：

| 工具 | 永恆語意 | 對應 §B |
|------|---------|--------|
| `load_skill` | 按上下文載入規則 | B3 Policy（透過 §C4 Runtime 讀 B1 SKILL） |
| `update_user_info` | 回寫客戶檔案 | B1 Customer（SCD2 變更）|
| `transfer_to_human` | 定義升級邊界 | B3 HITL gates |
| `create_problem_card` | 建立業務物件 | B1 + B2 PC state machine |
| `convert_to_work_order` | PC → WO（必須 HITL）| B2 WO state machine |

**永恆治理元件**：
- **Tool Registry**（誰可呼叫什麼 → 對應 RBAC B3）
- **Kill Switch**（單 skill / 單 employee / 全域三層緊急停機）
- **HITL gates**（G1-G8 八關卡的 Eval 自動化）
- **Eval Pipeline**（每次部署前 regression ≥ 200 題）
- **Policy Decision Audit**（所有 guardrail 決策進 `policy.decision` event）

**AI Employee Charter（ADR-0028）— 永恆抽象**：
- 把 AI 當「員工」而非「工具」
- 有 **job description**（charter） / **KPI**（eval） / **解雇權**（kill switch） / **審計義務**（policy.decision event）
- Model 換代 = AI 員工「換腦」，但 charter / KPI / kill switch 不變

**對應 Excel**：02-sheet 04（G1-G8 八關卡）、02-sheet 09（AI Employee 19 條 charter）、02-sheet 11（Model Routing 5 條 + budget/latency 預算）、02-sheet 12（Tool Registry 5+3 工具）、02-sheet 22（Events 含 `policy.decision` / `kill_switch.activated`）、02 全部 A M01-A M12 （Agent 模組）。

---

## §F GAP-D01~D08 + 20 P0 + 82 AI 跟進 的 CEO 答案（Trade-off 並列）

**業主指定風格**：每條給推薦 + 替代方案 + 各自代價，讓業主可重新討論。不是 Linus 一句話拍板。

### F.1 GAP-D01~D08 — 8 條完整 Trade-off

#### **GAP-D01：AI 是否可自動 `convert_to_work_order`？**

| 選項 | 內容 | Pre-mortem 風險 | Eternal/Transient | 代價 |
|------|------|----------------|-------------------|------|
| ✅ **推薦** | AI 草擬 + 1-click 人審 | F3 邊界穩定；F2 不被 LLM 廠商綁 | Eternal Policy（B3）| 客服每筆 +5-10s；UI 複雜度 +15% |
| 替代 A | 低風險場景全自動（保固期內 + 已知品牌 + 標準工項 + 同區）| F3 高 — 一次誤轉在 LINE 截圖傳播 | Transient（場景特化）| 月節省 ~30 人時，但 1 次客訴成本可能 = 全年節省 |
| 替代 B | 永遠純手動建 WO，AI 只輔助 | F1 弱 — 沒累積轉 WO signal | Eternal 但保守 | 客服每筆 +30-60s；可能因人力瓶頸 cap 業務量 |

**為什麼推薦**：Pre-mortem F3 是最大風險；1-click 人審把 HITL 邊界鎖死但保留 AI 草擬效率。Transient 層可後續優化。
**何時改選替代 A**：準確率 ≥ 99.5% 連續 6 個月 + 法務 sign-off + 一鍵 rollback 機制驗證。

---

#### **GAP-D02：缺地址時怎麼補？**

| 選項 | 內容 | Pre-mortem 風險 | Eternal/Transient | 代價 |
|------|------|----------------|-------------------|------|
| ✅ **推薦** | LINE 追問 + 後台補填 + 無地址 422 hard stop | F2 防隱性 default；F4 合規 | Eternal State Machine（B2 WO created 前置）| ~5% PC 因地址沒齊放棄 |
| 替代 A | 允許 WO 建立後再補地址 | F5 規模困境（派工到地址不全）| Transient 偷懶 | 派錯地址 / 師傅空跑成本 |
| 替代 B | 強制 conversation 內 100% 收齊才能建 PC | F1 弱（過嚴流失客戶）| Eternal 保守 | 50% PC 在地址環節放棄 |

**為什麼推薦**：地址是 WO 生命必要欄位，422 是 schema 契約而非建議。
**何時改選**：如果有可信 GPS / LBS API 可從 LINE 自動帶入則可考慮 A 的部分自動補填。

---

#### **GAP-D03：ProblemCard completeness score 是否控制派工？**

| 選項 | 內容 | Pre-mortem 風險 | Eternal/Transient | 代價 |
|------|------|----------------|-------------------|------|
| ✅ **推薦** | 0.85 hard gate + 人工 override 走 Exception module | F3 邊界穩定；F4 對齊 | Eternal Policy（B3）| 低分案件需人工 +1 步 |
| 替代 A | 不設 gate，自動派工 | F3 高 + F4 合規崩潰 | Transient | 派錯案件率 ↑，客訴成本高 |
| 替代 B | 0.95 hard gate（極嚴）| F1 弱（過嚴流失）| Eternal 過保守 | 太多案件卡關，AI 投資報酬 -30% |

**為什麼推薦**：0.85 是行業標準折衷，留 15% 容錯空間給 Exception。
**何時改選**：視 6 個月誤判率調整門檻（configurable per brand）。

---

#### **GAP-D04：urgent / Red Code 定義？**

| 選項 | 內容 | Pre-mortem 風險 | Eternal/Transient | 代價 |
|------|------|----------------|-------------------|------|
| ✅ **推薦** | 4 類具名 Event Type（被鎖門外 / 門內受困 / 安全風險 / 怒客高風險）| F4 對齊 SLA | Eternal Event Type（進 02-sheet 22 Catalog）| 每年校準 1 次規則 |
| 替代 A | 全 LLM 自判斷 | F3 高（綁特定模型）| Transient | 評測標準難建，model swap 全要重測 |
| 替代 B | 客服主管手動標 urgent | F1 弱 | Eternal 但保守 | SLA 不可預測 |

**為什麼推薦**：4 類具名是 1-pass 規則，LLM 失效仍可運作。
**何時改選**：出現新類型 → 走 ADR review 加入第 5 類，不切換策略。

---

#### **GAP-D05：保固 / 建案案件是否 AI 報價？**

| 選項 | 內容 | Pre-mortem 風險 | Eternal/Transient | 代價 |
|------|------|----------------|-------------------|------|
| ✅ **推薦** | AI 可給 range / 範圍，永禁 final quote（與 ADR-0028 charter 對齊）| F3 + F4 | Eternal Policy（B3 永恆禁區）| 客戶等真人 +5-15 min |
| 替代 A | AI 給 final quote + 免責條款 | F3 邊界仍漂移 + 法律風險 | Transient | 一次法律糾紛成本可能 = 全年 AI 報價節省 |
| 替代 B | 連 range 都不能說 | F1 弱（過保守）| Eternal 過嚴 | 客戶體驗下降，自助率 -20% |

**為什麼推薦**：AI 可給教育性 range（防 F1），永禁 final（防 F3）。
**何時改選**：不會改 — 法律邊界硬規則，寫進 ADR-0028 charter。

---

#### **GAP-D06：同 conversation 多 ProblemCard？**

| 選項 | 內容 | Pre-mortem 風險 | Eternal/Transient | 代價 |
|------|------|----------------|-------------------|------|
| ✅ **推薦** | 同一 active issue 僅一張 PC；新症狀 / 新設備可另建 | F2 簡單原則勝過 case-by-case | Eternal State Machine（B2 PC unique constraint）| PC unique key 複雜度 +5% |
| 替代 A | 完全不限，一對話多 PC 全部 OK | F1（data 亂）| Transient | 後續 reconcile 噩夢 |
| 替代 B | 一對話只能一張 PC（最嚴）| F1 弱 | Eternal 過嚴 | 多設備家庭體驗差（一支鎖一個問題、又問另一支鎖） |

**為什麼推薦**：規則簡單、覆蓋 90% 場景。多設備家庭只是長尾。
**何時改選**：不會改 — 簡單規則勝過 case-by-case。

---

#### **GAP-D07：對話解決後客戶確認關閉？**

| 選項 | 內容 | Pre-mortem 風險 | Eternal/Transient | 代價 |
|------|------|----------------|-------------------|------|
| ✅ **推薦** | Remote 解決需 quick confirm，48h 自動關閉 | F4 合規對齊 + F5 防 zombie | Eternal Process（Conversation state machine）| Conversation state +1 state |
| 替代 A | 客服主動結案 | F1 弱（人力瓶頸）| Transient | 客服工作量 +20% |
| 替代 B | 永遠不自動關閉 | F5 累積 zombie conversations | Transient | DB 膨脹，分析失準 |

**為什麼推薦**：48h 是合理 quick confirm 視窗，符合客戶習慣。
**何時改選**：48h → 24h or 72h 可 configurable per brand。

---

#### **GAP-D08：AI feedback 誰審核？**

| 選項 | 內容 | Pre-mortem 風險 | Eternal/Transient | 代價 |
|------|------|----------------|-------------------|------|
| ✅ **推薦** | 高風險 SOP（報價 / 退款 / 法律）客服主管 + Domain expert 雙審；FAQ 類單審 | F6（知識護城河）+ F2 防污染 | Eternal Process（D2 知識螺旋）| 雙審高風險 +1 工作日 |
| 替代 A | 全自動 SOP 入庫 | F3 + F6（錯誤入庫毀知識庫）| Transient | 知識污染風險高 |
| 替代 B | 全部雙審（最嚴）| F1 弱 | Eternal 過保守 | 知識更新慢，月新增 SOP -50% |

**為什麼推薦**：高 / 低風險分流，符合 80/20 原則。
**何時改選**：不會改 — 知識資產是護城河，審核強度不能降。

---

### F.2 P0 核心決策 7 條（Excel-01 sheet 04 中「未決」+「部分決議」）

#### **取消費分段（原 P0 標未決）**

| 選項 | 內容 | Pre-mortem | Eternal/Transient | 代價 |
|------|------|----------|-------------------|------|
| ✅ **推薦** | 5 階段：報價未確認 0 / 已確認未派工 0 / 出發前 檢測費 / 出發後 車馬費 / 到場後 車馬+檢測 / 已施工 按比例 | F4 對齊財務一致性 | Eternal Policy + Configurable | 計算邏輯需 ChangeRequest 維護 |
| 替代 A | 3 階段簡化（未派 / 已派 / 已施工）| F1（顆粒度太粗）| Transient | 客訴爭議 ↑ |
| 替代 B | per brand contract 各自定義 | F5 規模困境 | Transient | 30 品牌 = 30 套規則 |

**何時改**：當品牌方有特殊合約且影響 ≥ 5% 案件量。

---

#### **退款核准分層**

| 選項 | 內容 | Pre-mortem | Eternal/Transient | 代價 |
|------|------|----------|-------------------|------|
| ✅ **推薦** | 5 層金額：≤1k 客服主管 / 1-5k 營運主管 / 5-30k 營運+會計 / 30-100k 主管+會計 / 100k+ 雙簽 | F4 + F3 邊界 | Eternal RBAC（B3 + B4）| ChangeRequest 維護分層 |
| 替代 A | 責任歸屬導向（品牌責任 / 平台 / 師傅 各自分層）| F3 邊界更穩 但複雜度高 | Eternal | 矩陣維度 ↑ 2x |
| 替代 B | 全走主管 + 會計雙簽 | F1 弱（過嚴）| Eternal 保守 | 小額退款 SLA -50% |

**何時改**：合約方有專屬退款政策 / 金融風險事件後緊縮。

---

#### **車馬費歸屬**

| 選項 | 內容 | Pre-mortem | Eternal/Transient | 代價 |
|------|------|----------|-------------------|------|
| ✅ **推薦** | 80% 師傅 / 20% 平台（同區 500 / 跨區 800 / 遠距 1200）| F6 師傅生態維護（D3）| Eternal Policy + Configurable | 平台機會成本 -20% |
| 替代 A | 全給師傅（100%）| F4 平台 cash flow 風險 | Transient | 平台收入 -100% |
| 替代 B | 全平台收 | F6 師傅流失 | Transient | 師傅生態崩潰 |

**何時改**：師傅生態擴張到 1000+ 時可重新議價。

---

#### **角色權限矩陣**

| 選項 | 內容 | Pre-mortem | Eternal/Transient | 代價 |
|------|------|----------|-------------------|------|
| ✅ **推薦** | 4 層原則固化為 Eternal（顧客 / 營運 / 財務 / 治理）+ 具體欄位走 Transient configuration | F4 合規 + F5 多租戶 | Eternal Principle + Transient field | RBAC engine 需支援屬性過濾 |
| 替代 A | ABAC 全屬性導向（按 attribute 動態判斷）| F5 規模困境（複雜度）| Transient | 開發成本 +50% |
| 替代 B | 全自訂矩陣（每角色硬編碼）| F5 規模困境（換品牌全重設）| Transient | 維護惡夢 |

**何時改**：當需要跨品牌差異化 RBAC 時走 ABAC 部分擴展，但 4 層原則永遠成立。

---

#### **品牌 / 建商專案邊界**

| 選項 | 內容 | Pre-mortem | Eternal/Transient | 代價 |
|------|------|----------|-------------------|------|
| ✅ **推薦** | 合約模板 + tenant scope（每品牌 / 建案有獨立 scope，內含 SLA / 月結 / 點交日 / 責任分配）| F5 規模困境防範 | Eternal（B1 tenant_id / brand_scope）| 合約模板維護工作量 |
| 替代 A | per-project hardcode | F5 規模困境（30 建案 = 30 套 code）| Transient | 不可持續 |
| 替代 B | 外部 CRM（Salesforce / Hubspot）| F2 + F7（資料外移失主權）| Transient | 護城河流失 |

**何時改**：不會改 — 主權必須留在平台內。

---

#### **保固起算（建案點交日）**

| 選項 | 內容 | Pre-mortem | Eternal/Transient | 代價 |
|------|------|----------|-------------------|------|
| ✅ **推薦** | `Device.warranty_start_date` 支援多模式（purchase_date / handover_date / activation_date）+ `warranty_mode` 欄位 | F5 + F4 | Eternal（B1 Device 欄位）| Device schema 多一欄 |
| 替代 A | 強制購買日 | F1 弱（建案 use case 不支援）| Transient | 建商客戶體驗差 |
| 替代 B | 依品牌規則動態判斷 | F2 綁品牌 | Transient | 邏輯散落 |

**何時改**：不會改 — schema 化是 future-proof 設計。

---

#### **接單 SLA（10/5 min）**

| 選項 | 內容 | Pre-mortem | Eternal/Transient | 代價 |
|------|------|----------|-------------------|------|
| ✅ **推薦** | 一般 10 min / 急件 5 min + per brand override（合約方可自訂）| F5 + F4 | Eternal Process + Transient config | SLA monitor + alert 維護 |
| 替代 A | 全平台 unified 不可 override | F5 規模困境 | Transient 過嚴 | 高端品牌不滿 |
| 替代 B | per region 浮動（鄉鎮 vs 都會）| F4 一致性差 | Transient | KPI 不可比 |

**何時改**：合約方有專屬 SLA 走 override，不切換策略。

---

### F.3 82 條 AI 跟進清單最致命的 12 條（Excel-01 sheet 18）

採極簡 Trade-off 表（每條 3 行）：

#### **AI-016 RBAC 精確定義**

| 選項 | 內容 | Pre-mortem | E/T | 代價 |
|------|------|----------|-----|------|
| ✅ 推薦 | 4 層原則 + Transient 具體欄位（同 F.2#4）| F4 + F5 | Eternal + Transient mix | RBAC engine 複雜度 +15% |
| A | ABAC 全屬性 | F5 | Transient | 開發 +50% |
| B | 全自訂矩陣 | F5 | Transient | 不可持續 |

#### **AI-017 ChangeRequest 物件**

| 選項 | 內容 | Pre-mortem | E/T | 代價 |
|------|------|----------|-----|------|
| ✅ 推薦 | 物件化 workflow（apply → approve → effective_date → audit）| F4 治理 | Eternal Process（B3）| workflow engine 需建 |
| A | 走 Git PR 流程 | F4（非 op 友善）| Transient | 業務角色無法操作 |
| B | 純口頭 + Slack | F4 嚴重 | Transient | 治理斷鏈 |

#### **AI-020 AI 禁止決策清單**

| 選項 | 內容 | Pre-mortem | E/T | 代價 |
|------|------|----------|-----|------|
| ✅ 推薦 | ADR-0028 charter + auto guardrail test on every deploy | F3 主防線 | Eternal Policy（B3）| Eval pipeline 維護 |
| A | LLM 自判斷邊界 | F3 高 | Transient | 邊界漂移 |
| B | 全黑名單關鍵字 | F3 (高 false positive) | Transient | UX 差 |

#### **AI-029 取消費 5 階段**：同 F.2 取消費分段。

#### **AI-040 AI 轉真人 7 條件**

| 選項 | 內容 | Pre-mortem | E/T | 代價 |
|------|------|----------|-----|------|
| ✅ 推薦 | 7 硬規則 + Eval set 自動化驗證（urgent / 怒客 / 高金額 / 保固不明 / refund / 法律安全 / 3 次失敗）| F3 + F4 | Eternal Policy（B3）+ E3 治理 | 轉真人率 +5-10% |
| A | LLM 自判斷（無硬規則）| F3 高 | Transient（綁模型）| 評測難 |
| B | 全部轉真人 | F1 弱 | Eternal over-conservative | AI ROI -50% |

#### **AI-041 AI 不 final quote**：同 GAP-D05。

#### **AI-048 Acceptance SLA**：同 F.2 接單 SLA。

#### **AI-051 現場加價流程**

| 選項 | 內容 | Pre-mortem | E/T | 代價 |
|------|------|----------|-----|------|
| ✅ 推薦 | 客戶簽名 + Evidence 照片 + audit 三件套（缺一不可）| F4 + F3 | Eternal（B3 + B5）| 加價流程 +2 min |
| A | 客戶口頭 + 客服紀錄 | F4 嚴重 | Transient | 法律爭議風險 |
| B | 客戶簽名即可 | F4 部分 | Eternal | Evidence 缺失 |

#### **AI-052 Evidence 可見性**

| 選項 | 內容 | Pre-mortem | E/T | 代價 |
|------|------|----------|-----|------|
| ✅ 推薦 | 角色 × 案件生命週期權限矩陣（品牌看品牌、師傅看自己、會計看財務、客戶看客戶）| F4 + F5 | Eternal RBAC（B3 + B5）| visibility engine 複雜度 +20% |
| A | 全公開 | F4 PII 風險 | Transient | 個資外洩 |
| B | 全私有（僅平台）| F1 弱 | Eternal 過嚴 | 品牌 / 師傅體驗差 |

#### **AI-053 Evidence 保存期**

| 選項 | 內容 | Pre-mortem | E/T | 代價 |
|------|------|----------|-----|------|
| ✅ 推薦 | 1y default / RMA 至解決 + 3y / 法律案件永久 | F4 + F5 | Eternal Policy（B3 + B5）| 儲存成本 ~中等 |
| A | 永久全保留 | F4 GDPR 違反 | Transient | 法律風險 + 成本爆炸 |
| B | 90 天 | F4 重大 | Transient | 法律糾紛無證據 |

#### **AI-054 庫存歸屬**

| 選項 | 內容 | Pre-mortem | E/T | 代價 |
|------|------|----------|-----|------|
| ✅ 推薦 | `Material.owner` 欄位（platform / brand / locksmith）+ 月結時 reconcile | F4 + F6 | Eternal（B1 + B4）| Material schema 多 1 欄 |
| A | 統一平台庫存 | F6 師傅體驗差 | Transient | 師傅生態流失 |
| B | 純師傅自管 | F4 庫存不透明 | Transient | 對帳惡夢 |

#### **AI-055 Serial 控制**

| 選項 | 內容 | Pre-mortem | E/T | 代價 |
|------|------|----------|-----|------|
| ✅ 推薦 | 主鎖 + 高價零件強制 serial 綁 Device | F4（保固生效）+ F7（信任護城河）| Eternal（B1）| 現場流程 +30s 拍 serial |
| A | 全部選填 | F4 保固爭議 | Transient | 保固歸屬不可追 |
| B | 全部強制 | F1 弱（過嚴）| Eternal 過嚴 | 小額耗材浪費時間 |

---

## §G 可持續迭代的工程治理

CEO 三件事最重要：

1. **不能讓 2026 技術選型污染 Eternal Substrate**
   - Code review hard rule：`domain/` 與 `policy/` 兩個 layer 禁止 import 任何 LLM SDK / vector DB SDK / messaging SDK
   - 違反 = build fail（不是 warn）

2. **AI 邊界一旦定義就不能漂移**
   - ADR-0028 AI Employee Charter 是 frozen contract
   - 每次新 skill / 新 tool 上線都必須過 charter compatibility test
   - 違反 = deploy block

3. **資料 schema 五年凍結原則**
   - Eternal Substrate（§B）的 schema 變更需 ADR + 全棧 migration plan + 業主簽核
   - Transient layer（§C）自由演化，無需 ADR

**實作機制**：
- **三層 lint gate**：
  - dependency boundary lint（檢查 §B import）
  - policy decision audit lint（檢查 guardrail event coverage）
  - event schema lint（檢查 Domain Event Catalog 一致性）
- **每季 Pre-mortem retrospective**：複跑 §A 的 7 個劇本，識別新增的失敗模式
- **Eval Pipeline 為 Phase Exit Criteria**：每個 Phase 結束都跑 ≥ 200 題 regression（含 G1-G8 八關卡 + AI-020 禁止項）

**對應 Excel**：01-sheet 00 使用說明（configurable principle）、01-sheet 15 Coding 必做、01-sheet 16 Coding 順序、02-A M09（Eval 觀測）、02-A M11（部署健康）、02-A M12（PRD 治理）。

---

# 第二部分：現狀痛點盤點（執行層附錄）

> 以下 §0-§12 為原 v1 內容（62 條痛點），保留作為現狀真實 snapshot。每條痛點在 v2 框架下已對應到 Eternal/Transient 分類。

---

## 0. TL;DR — Top 10 最該先打的痛點（升級為 v2 分類）

| # | 痛點 | 類別 | Owner | 阻擋什麼 | **Eternal/Transient** |
|---|------|------|-------|---------|---------------------|
| 1 | AI 是否可自動 `convert_to_work_order` 未拍板 | AI Sync | 客服主管 / ERP owner | 派工自動化 + Phase I exit | Eternal Policy（B3）→ 見 §F.1 D01 |
| 2 | NFR-XXXX 無獨立 tier-2 檔，SLA targets 全 TBD | 規範缺口 | DevOps + Tech Lead | NFR baseline + 壓測標準 | Transient Baseline（C2 + C5）|
| 3 | Conversation / ProblemCard / WorkOrder 狀態三套不對齊風險 | 同步契約 | Tech Lead | 跨模組事件 + 客服語意統一 | Eternal State Machine（B2）|
| 4 | 缺地址 / completeness score 不足是否仍可派工 | 業務規則 | 客服主管 + Tech Lead | WorkOrder 422 / 強制 fallback | Eternal Policy（B3）→ 見 §F.1 D02/D03 |
| 5 | 取消費 / 退款核准分層 P0 仍標「未決」 | 財務規則 | 主管 / 會計 | Phase II AR/AP 啟動 | Eternal Policy（B3 + B4）→ 見 §F.2 |
| 6 | 8 個 PM Gap Decision（D01-D08）阻擋 PRD 收斂 | 治理 | PM | 下次 group-leader 例會關閉 | Eternal Policy（B3）→ 見 §F.1 全部 |
| 7 | AI 不可決策清單未集中 charter，散落各 ADR | AI 治理 | AI owner | guardrail 測試案例 | Eternal Policy（B3 + E3 charter）|
| 8 | 合約 4.4(d) 家族成員覆核機制 UAT 尚未驗收 | 合規 | PM + 甲方 | V1.0 簽收 | Eternal RBAC（B3 + B5）|
| 9 | TC-SYNC-08/09/10（PC 建立失敗 / Quick Reply / 多媒體 gate）測試未補 | 測試 | Backend + QA | Phase I exit | Eternal（B5 idempotency）|
| 10 | 角色權限矩陣（品牌商 / 師傅 / 會計 / IT / AI Ops）未閉環 | RBAC | 主管 / IT | Admin Panel V1.0 | Eternal Principle（B3 4 層）+ Transient field |

---

## 1. 業務痛點（甲方原始 Pain Points）

> 來源：`PRD-0001 §2.1 背景與痛點`。此節是「為何要做這個專案」的根本動機。

| ID    | 痛點          | 現況                                                  | 影響    | 對應解決方案                                      | 文件交叉引用                                          |
| ----- | ----------- | --------------------------------------------------- | ----- | ------------------------------------------- | ----------------------------------------------- |
| BP-01 | **知識不可擴展**  | 客服能力依賴資深技師個人經驗；LINE 文字 / 圖片 / 影片湧入，知識無法保存檢索；新人需數月上手 | 🔴 高  | Epic 1-4 + 自進化知識庫 + SKILL.md skill registry | PRD §2.1, ADR-0008, ARCH §3.4                   |
| BP-02 | **診斷效率低**   | 每次報修需人工逐步問品牌、型號、故障；品質因人而異                           | 🔴 高  | ProblemCard 結構化擷取 + 三層解決機制                  | PRD Epic 2-3, FR-0002, FR-0025                  |
| BP-03 | **派工流程碎片化** | LINE → 紙本 → 電話 → Excel → 銀行，全手動、無稽核                 | 🔴 高  | M01-M20 ERP + 智慧派工引擎 + state machine        | PRD Epic 7-8, FR-0003~FR-0010, ARCH-0002~0005   |
| BP-04 | **帳務不透明**   | 墊款 / 預付 / 完工結算混亂，月底對帳耗時                             | 🟡 中高 | M11 AR + M12 AP + 月結報表                      | PRD Epic 10, FR-0011~FR-0014, Excel-01 sheet 14 |
| BP-05 | **缺乏數據洞察**  | 故障類型 / 地區分布 / 技師績效 / 客戶滿意度 統計付之闕如                   | 🟡 中  | M19 BI/KPI + Dashboard                      | PRD Epic 11 (US-034/037), FR-0021               |

---

## 2. 治理 / PM 阻擋（8 個 Gap Decision）— 🔴 P0

> 來源：`DISC-0001 §3 Gap 決策清單` + `Excel-02 sheet 19 Sync Gap Decisions`。v2 升維：每條 CEO Trade-off 答案已寫入 §F.1。

| ID      | 決策問題                                   | 建議預設                              | 阻擋 coding | Owner            | 狀態              |
| ------- | -------------------------------------- | --------------------------------- | --------- | ---------------- | --------------- |
| GAP-D01 | AI 是否可自動 `convert_to_work_order`？      | V1 需客服確認 PC；V2 低風險固定場景可自動         | **是**     | 客服主管 / ERP owner | ✅ 已決議 ADR-0031 (2026-05-22) |
| GAP-D02 | 缺地址時怎麼補？                               | 追問 + 後台補填；派工不擋、結案前硬 gate         | **是**     | 客服主管             | ✅ 已決議 ADR-0032 (2026-05-22，業主備註調整) |
| GAP-D03 | ProblemCard completeness score 是否控制派工？ | 低於 0.85 不自動派工，走 Exception override    | **是**     | Tech Lead / Ops  | ✅ 已決議 ADR-0033 (2026-05-22) |
| GAP-D04 | urgent / Red Code 定義                   | 被鎖門外、門內受困、安全風險、怒客高風險              | **是**     | 營運主管             | ✅ 已決議 ADR-0034 (2026-05-22) |
| GAP-D05 | 保固 / 建案案件是否報價？                         | AI 禁止 final quote；真人查詢後回覆         | **是**     | 主管 / 會計          | ✅ 已決議 ADR-0035 (2026-05-22) |
| GAP-D06 | 同 conversation 多 PC 規則                 | 同一 active issue 僅一張 PC；新症狀／新設備可另建 | 部分        | 客服主管             | ✅ 已決議 ADR-0036 (2026-05-22) |
| GAP-D07 | 對話解決後是否客戶確認關閉？                         | 遠端解決需 quick confirm 或 48h 自動關閉    | 部分        | 客服主管             | ✅ 已決議 ADR-0037 (2026-05-22) |
| GAP-D08 | AI feedback 誰審核？                       | 客服主管 + domain expert 雙審高風險 SOP    | **是**     | Knowledge owner  | ✅ 已決議 ADR-0038 (2026-05-22) |

**處理流程**：每筆關閉時跑 `sunnydata-change-impact-analysis` 產 CIA，再依結論建新 ADR 或更新 contract。

---

## 3. 規範 / 文件結構痛點

| ID     | 痛點                                                        | 嚴重度   | 詳情                                                                                                           | 文件交叉引用                               |
| ------ | --------------------------------------------------------- | ----- | ------------------------------------------------------------------------------------------------------------ | ------------------------------------ |
| DOC-01 | **NFR 沒有獨立 tier-2 檔案**                                    | 🔴 P0 | NFR 內容散落於 PRD §4.2 / SOW §NFR Targets / ARCH §2.2 / PRIN-0002 — 違反 contract 應集中原則                            | README §3, PRIN-0002 (frontend only) |
| DOC-02 | **API SLA targets 全部 ⚠ TBD baseline**                     | 🔴 P0 | 15 個 operationId 的 p50/p95/p99 / max RPS 全部標 TBD，沒有 k6 跑出的真實基線                                               | PRIN-0002 §1                         |
| DOC-03 | **TC-SYNC-08/09/10 三個關鍵測試未補**                             | 🔴 P0 | (08) agent 背景建 PC 失敗、(09) Quick Reply 後建 PC、(10) 多媒體照片 gate — 均屬 Phase I exit 必驗                             | Excel-02 sheet 20, DISC-0001 §4      |
| DOC-04 | **兩份 Excel 藍圖 vs 文件包重疊與單一事實來源風險**                         | 🟡 P1 | DISC-0001 已點出 20+ 重疊區段，藍圖搬 `_archive` 但持續被 owner 直接編輯，存在 drift 風險                                            | DISC-0001 §5                         |
| DOC-05 | **PRD V1.0 / V2.0 技術棧描述漂移**                               | 🟡 P1 | PRD/SOW 寫 LangChain + Redis 7+，實際 V1.0 是 LangGraph + LiteLLM 且未用 Redis；只用 frontmatter warning 框警告，未正式 errata | PRD 開頭 warning, SOW §1 warning       |
| DOC-06 | **ADR-0013~0022 PM Alignment Q1-Q10 與 Q&A 決策庫 165 題對應不全** | 🟡 P1 | ADR 系列止於 Q10，Excel sheet 05 有 165 題；缺自動對應視圖                                                                  | Excel-01 sheet 19, VIEW-0005         |
| DOC-07 | **CHANGELOG / 文件變更紀錄欠缺**                                  | 🟢 P2 | PRD-0001 last_updated 2026-04-04 但內容已多次更動（如 D-004 移除），需要結構化變更紀錄                                              | PRD §5.1                             |

---

## 4. AI / Chatbot 治理痛點

> 來源：`Excel-02 sheet 04 Chatbot Gate`、`sheet 08 風險治理`、`ADR-0010 Belief-Augmented ReAct`、`ADR-0028 AI Employee Charter`。

| ID    | 痛點                                                                   | 嚴重度   | 詳情                                                                                                                                             | 落地                                   |
| ----- | -------------------------------------------------------------------- | ----- | ---------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------ |
| AI-01 | **AI 不可決策清單未集中 charter**                                             | 🔴 P0 | final price / refund / warranty / legal-safety 承諾散落，未一致進 guardrail 測試                                                                          | ADR-0028 新建中，需收斂為 single source      |
| AI-02 | **8 個 Chatbot Decision Gates (G1-G8) 缺對應自動測試**                       | 🔴 P0 | G1 domain boundary / G2 brand-model / G3 SOP skill / G4 remote solvable / G5 human handoff / G6 PC 需求 / G7 WO 轉單 / G8 報價 — 多為人工判斷未轉 regression | Excel-02 sheet 04                    |
| AI-03 | **Prompt Injection / 知識污染 / PII 留存控制點未閉環**                           | 🔴 P0 | 風險清單已列，但 H6/H7.5 / RBAC / retention 各自實作，缺 end-to-end policy decision audit                                                                    | Excel-02 sheet 08, ARCH §3.4 Harness |
| AI-04 | **同對話多 ProblemCard 建立的 idempotency**                                 | 🟡 P1 | 設計用 `sha256(conv_id + first_unresolved_symptom + brand)` 但未測試「同症狀但 typo」碰撞                                                                     | Excel-02 sheet 21                    |
| AI-05 | **負面情緒識別率 ≥ 90% 是合約 4.4(a) 驗收條件**                                    | 🟡 P1 | Epic 12 已建 US-038，但測試集規模、評估方法、誤判處理流程未文件化                                                                                                       | PRD Epic 12, FR-0025                 |
| AI-06 | **多模態僅作 attachment，無 Vision AI 辨識（合約 SOW 2.1(4) 排除）**                | 🟢 P2 | D-004 已從外部依賴移除，但 ProblemCard 完整率 ≥ 85% 改靠主動引導，需 UX flow 與引導模板                                                                                  | PRD US-039, FR-0025                  |
| AI-07 | **AI SOP / RAG 版本治理（feedback ↔ 知識庫）未閉環**                             | 🟡 P1 | Knowledge Owner 雙審流程草擬中，但缺 effective_date / rollback / A-B 測試                                                                                  | Excel-02 sheet 05, ADR-0008          |
| AI-08 | **AI Employee Charter（ADR-0028）與 Model Routing（ADR-0027）介面尚未跨檔引用驗證** | 🟢 P2 | 新建文件，需要走一次 cross-doc consistency check                                                                                                         | ADR-0026~0028                        |
| AI-09 | **Belief-Augmented ReAct（ADR-0010）與現行 Single ReAct 差距**              | 🟢 P2 | ARCH-0001 標記 Multi-Agent / Harness L1-L8 為 "Vision (not yet implemented)"，路線圖未綁 Phase                                                          | ARCH §3.3.2, ADR-0010                |

---

## 5. 同步契約痛點（Chatbot ↔ ERP）

> 來源：`Excel-02 sheet 14-23` 共 10 個工作表。Conversation / ProblemCard / WorkOrder 三套狀態如何對齊是 Phase I 的核心契約。

| ID      | 痛點                                                         | 嚴重度   | 詳情                                                                                                                                                                                                       | 文件                          |
| ------- | ---------------------------------------------------------- | ----- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------- |
| SYNC-01 | **三套狀態語意對齊**                                               | 🔴 P0 | Conversation(`active/resolving/escalated/closed`) vs ProblemCard(`incomplete/draft/confirmed/resolved`) vs WorkOrder(`created/assigned/accepted/in_progress/completed/cancelled`) — 跨模組事件描述「同一件事」時的措辭未統一 | Excel-02 sheet 16           |
| SYNC-02 | **User.phone / address 主檔衝突解決規則**                          | 🔴 P0 | Chatbot 捕獲 → ERP 主檔，現定 "ERP wins" 但 `convert_to_wo body` 又可 override — 邊界仍灰                                                                                                                              | Excel-02 sheet 23           |
| SYNC-03 | **ProblemCard.media_urls append-only 規則**                  | 🟡 P1 | Chatbot + 客服雙寫，append-only 已宣告但缺 immutable 驗證                                                                                                                                                            | Excel-02 sheet 23           |
| SYNC-04 | **Pricing rules：Chatbot 不可硬編碼 + version + effective_date** | 🔴 P0 | 規則已宣告但實作端是否完全靠 API / skill 動態取，待 audit                                                                                                                                                                   | Excel-02 sheet 23           |
| SYNC-05 | **Outbox 7 種事件 retention / replay 規格**                     | 🟡 P1 | `problem_card.create_requested` outbox + retry + alert 已寫，但 DLQ 名稱 / age threshold / 補償 SOP 尚未跑通整套手動演練                                                                                                   | Excel-02 sheet 18, sheet 21 |
| SYNC-06 | **Domain Event Catalog 跨 tenant_id 邊界**                    | 🟡 P1 | 15 個事件全部 `tenant_id` 為 key，但 `kill_switch.activated` 標 "tenant_id (or global)" — 全域 kill switch 與單租戶混用，需明確 escalation chain                                                                              | Excel-02 sheet 22           |
| SYNC-07 | **Conversation Audit 雙寫（raw vs summary）一致性**               | 🟢 P2 | Chatbot wins for raw / ERP 只存 summary — summary 漂移時誰負責 reconcile？                                                                                                                                        | Excel-02 sheet 23           |
| SYNC-08 | **9 種 API operations 全部 idempotency + dedup window**       | 🟡 P1 | sheet 21 已列 9 個操作公式與 DLQ 名稱，但 `evidence.upload` 大檔 + 網路波動的 retry max 10 是否合理需壓測                                                                                                                          | Excel-02 sheet 21           |

---

## 6. 工單 ERP 業務規則痛點（P0 核心決策 + Q&A 165 題）

> 來源：`Excel-01 sheet 04 P0 核心決策` 共 20 條；`sheet 05` 共 165 個 Q&A，多數已給「ERP Consultant 建議答案」，但仍存在以下未閉環項。v2 升維：每條未決項 Trade-off 答案已寫入 §F.2。

### 6.1 報價 / 收款規則（Phase I-II 跨期）

| ID     | 痛點                              | 嚴重度   | 預設答案   | 狀態                             |
| ------ | ------------------------------- | ----- | ------ | ------------------------------ |
| BIZ-01 | 報價有效期（3/7/15/30 天依案件 + 品牌）      | 🟡 P1 | 已給預設   | 需 System Setup 落地              |
| BIZ-02 | 訂金 / 預付款（高金額 / 急件 / 新客戶必收）      | 🟡 P1 | 已給預設   | 需 rule version + 例外清單          |
| BIZ-03 | **取消費分段**（付款後 / 當日 / 出發後 / 到場後） | 🔴 P0 | 未決（見 §F.2）| 阻擋 AR module               |
| BIZ-04 | **退款核准分層**（依金額 + 責任歸屬）          | 🔴 P0 | 未決（見 §F.2）| 阻擋 RefundService           |
| BIZ-05 | 車馬費歸屬（到場才收，誰收 / 怎麼結）            | 🟡 P1 | 預設到場才收（見 §F.2）| 需 ledger 規則               |
| BIZ-06 | 加價現場流程（師傅提出 → 客戶簽 → 客服留紀）       | 🟡 P1 | 已給預設（見 §F.3 AI-051）| 需 evidence + e-signature |
| BIZ-07 | 客戶不同意加價的退場路徑（檢測費 / 車馬費 / 改期）    | 🟡 P1 | 已給預設   | 需 exception flow + reason code |

### 6.2 派工 / SLA 規則

| ID     | 痛點                                   | 嚴重度   | 預設答案 | 狀態                           |
| ------ | ------------------------------------ | ----- | ---- | ---------------------------- |
| BIZ-08 | 接單 SLA（一般 10min / 急件 5min）           | 🟡 P1 | 已給預設（見 §F.2）| 需 alert / escalation     |
| BIZ-09 | 搶單限制（標準 / 低風險 / 1 小時車程內）             | 🟡 P1 | 已給預設 | 需匹配演算法                       |
| BIZ-10 | 工單成立 gate（客戶確認價格 + 時間，需付款案件需付款 gate） | 🟡 P1 | 已給預設 | 需 payment gate state machine |

### 6.3 主檔 / 治理規則

| ID     | 痛點                                                       | 嚴重度   | 預設答案 | 狀態                                     |
| ------ | -------------------------------------------------------- | ----- | ---- | -------------------------------------- |
| BIZ-11 | **角色權限矩陣**（品牌商 / 師傅 / 會計 / IT / AI Ops 分可看 / 可改 / 可核准）   | 🔴 P0 | 已給原則（見 §F.2）| 需 18 個權限 row 的矩陣 — Excel sheet 11 已有草稿 |
| BIZ-12 | **系統設定變更流程**（價格 / 權限 / SLA / 模板 / AI SOP 需申請 / 核准 / 生效日） | 🔴 P0 | 已給原則（見 §F.3 AI-017）| 需 ChangeRequest 物件 + workflow          |
| BIZ-13 | 師傅 onboarding 與停權門檻                                      | 🟡 P1 | 已給原則 | 需具名門檻 + 黑名單回復路徑                        |
| BIZ-14 | **品牌 / 建商專案邊界**（B2B 權限 / 點交日 / 月結責任 / SLA）               | 🔴 P0 | 部分決議（見 §F.2）| 阻擋 Phase III Partner Portal       |
| BIZ-15 | RMA 編號規則（RMA + 年月 + 流水號）                                 | 🟢 P2 | 已決   | 已可實作                                   |
| BIZ-16 | 保固起算（購買日 + 序號；建案是否點交日）                                   | 🟡 P1 | 部分決議（見 §F.2）| 建案分支待補                           |

### 6.4 月結 / 帳務 Ledger 痛點（sheet 14）

| ID     | 痛點                                                                                                                                  | 嚴重度   | 詳情                                             |
| ------ | ----------------------------------------------------------------------------------------------------------------------------------- | ----- | ---------------------------------------------- |
| BIZ-17 | **Customer AR / Technician AP / Cash Collection / Brand Settlement / Dispatcher Commission / Refund Ledger / Invoice & Tax** 七張帳本切分 | 🟡 P1 | 模組 M11/M12/M14 切分清楚，但跨帳本 reconciliation 規則未文件化 |
| BIZ-18 | 客訴爭議只暫扣爭議金額（非整單暫扣）                                                                                                                  | 🟡 P1 | 規則已決，但「爭議金額計算公式」未具名                            |
| BIZ-19 | 品牌商可見性範圍（只能看品牌相關資料）                                                                                                                 | 🟡 P1 | 與 BIZ-11 連動，需 RLS / row-level 過濾測試             |
| BIZ-20 | 發票開立責任（B2C / B2B / 品牌 / 建商 / 平台代收）                                                                                                  | 🟢 P2 | 已切分但 tax handling 需與會計確認                       |

---

## 7. 狀態 / 異常 Return Path 痛點

> 來源：`Excel-01 sheet 13 狀態與異常矩陣`。每個物件都有 normal / abnormal 狀態，但 return path 規則尚未全部落到具名 reason code。

| 對象            | 正常狀態                                                                       | 異常狀態                  | Return Path 痛點                   | 嚴重度   |
| ------------- | -------------------------------------------------------------------------- | --------------------- | -------------------------------- | ----- |
| Case          | New / Need Info / Converted / Closed                                       | 缺客戶資料 / 重複客戶 / 錯入口    | 重複客戶合併規則未含 LINE ID + phone 雙鎖定機制 | 🟡 P1 |
| ProblemCard   | Draft / Need Photo / Ready for Quote / Escalated / Closed Remote           | 照片不足 / 保固不明 / AI 失敗   | "AI 失敗 3 次循環自動轉真人" 規則未閉環         | 🔴 P0 |
| Quote         | Draft / Internal Approved / Customer Sent / Customer Confirmed / Expired   | 高金額 / 特殊門型 / 價格爭議     | 高金額閾值未具名（每品牌 / 全平台一致？）           | 🔴 P0 |
| Payment       | Deposit Required / Paid / Pending / Failed / Refund Requested              | 末五碼不符 / 現金代收未繳 / 退款爭議 | 末五碼比對非結構化，缺人工裁定面板                | 🟡 P1 |
| WorkOrder     | Created / Waiting Dispatch / Assigned / Accepted / Rescheduled / Cancelled | 無師傅 / 拒單 / 逾時 / 客戶改期  | 連環改派 / 拒單冷卻期 未定                  | 🔴 P0 |
| Onsite        | Arrived / Working / Scope Change / Completed / Customer Not Onsite         | 客戶不在 / 加價 / 缺料 / 安全風險 | "客戶不在" 是否收車馬費規則需明示               | 🟡 P1 |
| Material      | Reserved / Missing / Used / Returned / Defective                           | 缺料 / 未退料 / 序號缺失       | 序號缺失導致 warranty 失效的補救流程缺         | 🟡 P1 |
| RMA           | Opened / Investigating / Assigned / Resolved / Rejected                    | 責任不明 / 品牌保固爭議 / 退款爭議  | 責任矩陣（甲方 vs 品牌商 vs 師傅 vs 平台）尚未量化  | 🔴 P0 |
| System Config | Draft / Pending Approval / Active / Retired                                | 錯價格 / 錯權限 / 錯模板       | 回滾規則（生效日已過如何 retire）缺 runbook    | 🟡 P1 |
| AI Rule       | Draft / Test / Approved / Active / Suspended                               | AI 錯答 / 誤報價 / 未轉真人    | "Suspended" 與 kill switch 的關係未綁定 | 🟡 P1 |

---

## 8. NFR / 品質屬性痛點

| ID     | 痛點                                                                           | 嚴重度   | 詳情                                                                                              | 文件                      |
| ------ | ---------------------------------------------------------------------------- | ----- | ----------------------------------------------------------------------------------------------- | ----------------------- |
| NFR-01 | **15 個 API operationId 的 SLA 全部 ⚠ TBD**                                      | 🔴 P0 | createConversation / createProblemCard / runDispatch / claimOrder 等全部缺 baseline，DevOps 需先跑一次 k6 | PRIN-0002 §1            |
| NFR-02 | V1.0 50 並發 / V2.0 100 並發 — 壓測尚未跑                                             | 🔴 P0 | SOW §7 寫死 KPI 但 k6/Locust 腳本未寫，Phase 3 才測時間太晚                                                   | SOW §7, PRD §4.2        |
| NFR-03 | Uptime 95%（V1.0）/ 99.5%（V2.0）— V2.0 需 Read Replica + LB 未到位                  | 🟡 P1 | ARCH 提到但未在 ADR 落實                                                                               | SOW §7                  |
| NFR-04 | Core Web Vitals (LCP/INP/CLS) — Lighthouse CI on PR 未到位                      | 🟡 P1 | "待 Phase 後加入 quality gate" 標記，需具名 Phase                                                         | PRIN-0002 §2            |
| NFR-05 | WCAG 2.1 AA — 工具列已選但缺 PR-level gate                                          | 🟢 P2 | axe / WAVE / Lighthouse 列出未綁 CI                                                                 | PRIN-0002 §3            |
| NFR-06 | Bundle size budget — `/dashboard < 250KB` 等門檻已列，但 `@next/bundle-analyzer` 未開 | 🟢 P2 |                                                                                                 | PRIN-0002 §7            |
| NFR-07 | iOS Safari 14+ / Android Chrome — 技師 PWA 主戰場，缺裝置矩陣測試                         | 🟡 P1 |                                                                                                 | PRIN-0002 §4            |
| NFR-08 | 後端核心程式碼覆蓋率 ≥ 70% — pytest 已有但 CI gate 待確認                                    | 🟡 P1 |                                                                                                 | SOW §7                  |
| NFR-09 | 結構化日誌 + trace_id — JSON 格式宣告但未驗證所有 layer 都帶                                  | 🟡 P1 |                                                                                                 | PRD §4.2                |
| NFR-10 | 資料備份 daily / 保留 30 天（SOW）vs 7 天（ARCH-0001 NFR 表）— 兩處不一致                      | 🟡 P1 | 文件漂移                                                                                            | SOW §7 vs ARCH-0001 NFR |

---

## 9. 合約 / 合規痛點

> 來源：合約 V21、PRD Epic 12、SOW 排除項。這幾條若不達標會直接影響 V1.0 簽收。

| ID       | 痛點                                  | 嚴重度   | 合約條款             | 狀態                                                       |
| -------- | ----------------------------------- | ----- | ---------------- | -------------------------------------------------------- |
| LEGAL-01 | **負面情緒識別率 ≥ 90%**                   | 🔴 P0 | 4.4(a)           | US-038 已設計，**Eval 測試集 200+ 題納入 ADR-0047 charter pipeline (2026-05-22 拍板)** |
| LEGAL-02 | **主動引導照片上傳（ProblemCard 完整率 ≥ 85%）** | 🔴 P0 | 9.3 / SOW 2.1(4) | US-039 已設計，引導模板未完整                                       |
| LEGAL-03 | **家族成員覆核機制**                        | 🔴 P0 | 4.4(d)           | US-040 已設計，**RBAC 4 層（ADR-0042）+ Evidence 可見性（ADR-0050）+ Retention（ADR-0051）2026-05-22 拍板**；Family Reviewer 角色明文 |
| LEGAL-04 | AI 影像辨識排除（合約 SOW 2.1(4)）            | 🟢 P2 | SOW 2.1(4)       | D-004 依賴已移除，PRD warning 已標                               |
| LEGAL-05 | LINE Pay / 線上金流排除                   | 🟢 P2 | SOW Out of Scope | 已標                                                       |
| LEGAL-06 | 多語言（V1.0/V2.0 僅繁中）                  | 🟢 P2 | SOW Out of Scope | 已標                                                       |
| LEGAL-07 | 多租戶（V1.0/V2.0 單一甲方）                 | 🟢 P2 | SOW Out of Scope | 已標，但 ADR-0030 `tenant_id` propagation 已為未來預留             |
| LEGAL-08 | 消費者評價系統（未實作）                        | 🟢 P2 | SOW Out of Scope | 已標                                                       |

---

## 10. SOW 風險登記延伸

> 來源：`SOW §8 Risk Assessment` 共 R-001~R-009，已是文件化風險。痛點視角的補強：

| ID      | 風險                            | 嚴重度   | 既有緩解                              | 補強建議                                                     |
| ------- | ----------------------------- | ----- | --------------------------------- | -------------------------------------------------------- |
| RISK-01 | AI 準確率未達 80%                  | 🔴 P0 | Prompt 優化 / Few-shot / RAG 上下文    | 需建 50 題 golden set + 每週 regression                       |
| RISK-02 | LLM API 配額 / 成本超支             | 🟡 P1 | Token 追蹤 / Redis cache / Fallback | V1.0 未用 Redis，cache 策略需重新設計                              |
| RISK-03 | 甲方種子資料品質不佳                    | 🔴 P0 | 預先確認 / 清洗 / CSV 範本                | W1 確認 200 筆案例的 schema 與品質報告                              |
| RISK-04 | LINE API Rate Limit / Flex 限制 | 🟢 P2 | Rate limiting / 簡化 Flex           | LIFF 降級方案需 ADR                                           |
| RISK-05 | pgvector 高並發效能不足              | 🟡 P1 | HNSW / Redis 快取熱門查詢               | 需在 NFR-02 壓測中驗證                                          |
| RISK-06 | V2.0 派工匹配品質                   | 🟡 P1 | 與資深調度共定權重 / 人工 override           | 需要影子模式比對人工 vs 演算法                                        |
| RISK-07 | 小團隊（1-3 人）人員流動                | 🔴 P0 | 技術文件 / Code review / 知識轉移 SOP     | 文件包是回應，但缺 onboarding runbook                             |
| RISK-08 | Prompt Injection              | 🟡 P1 | 多層防護 / 黑名單 / Output Guardrail     | 攻擊樣本庫需建並做 weekly red team                                |
| RISK-09 | 資料安全 / 隱私（個資外洩）               | 🔴 P0 | TLS / AES-256 / RBAC / 定期審查       | PII retention policy 需具名（D-Reference: Excel-02 sheet 08） |

---

## 11. 痛點 vs 落地路徑對照

把上述 62 條痛點映射到 Phase 與 Owner：

| Phase                 | 痛點數（P0/P1）                                                                                                        | 主要 Owner                             | Exit Criteria                                                       |
| --------------------- | ----------------------------------------------------------------------------------------------------------------- | ------------------------------------ | ------------------------------------------------------------------- |
| **Phase 0 Setup**     | GAP-D04~D08 (5) + BIZ-11/12/14 (3) + AI-01/02 (2) + NFR-01 (1)                                                    | 客服主管 + Tech Lead + AI owner + DevOps | RBAC matrix / ChangeRequest workflow / SLA baseline / AI charter 通過 |
| **Phase I Launch**    | GAP-D01/D02/D03/D07 (4) + SYNC-01/02/04 (3) + BIZ-03/04/10 (3) + 狀態異常 P0 全數 (4) + LEGAL-01/02/03 (3) + DOC-03 (1) | PM + 客服主管 + 派工主管 + 會計                | 標準案件 / 急件 / 改派 / 加價 / 取消 / 退款申請 / 基本報表 可跑                           |
| **Phase II Finance**  | BIZ-17~20 (4) + NFR-03/07/08 (3)                                                                                  | 會計 + AI Specialist                   | 月結可 export / 可審核 / 可追 evidence / 可調 config                          |
| **Phase III Partner** | BIZ-14 (1) + SYNC-06 (1)                                                                                          | Brand/Partner + Operator             | Partner visibility / contract rule / warranty 責任正式定義                |
| **Phase IV AI Ops**   | AI-04~09 (6)                                                                                                      | AI Specialist + Knowledge Owner      | AI 來源 / 版本 / 評測 / rollback 齊備                                       |
| **Phase V BI**        | BP-05 (1)                                                                                                         | Management + BI Owner                | KPI 依真實資料穩定                                                         |

---

## 12. 建議：下一步處置

### 12.1 一週內必須做的事（Phase 0 收斂）

1. **召集 group-leader 例會審視 §F.1 八個 GAP Trade-off**，業主針對每條選 ✅ / A / B
2. **DevOps 跑一次 k6 baseline**，把 PRIN-0002 §1 的 ⚠ TBD 全部填值
3. **AI owner 把「AI 不可決策清單」收斂進 ADR-0028 並轉 regression test**（對應 §F.3 AI-020）
4. **客服主管 + 派工主管確認 §F.2 中 BIZ-03/04/11/12/14 的具名門檻選擇**
5. **QA 補 TC-SYNC-08/09/10 三個測試**（DOC-03）

### 12.2 兩週內補件

1. NFR 從散落章節拆出 `docs/3-nfr/NFR-XXXX-*.md` 獨立 tier-2 檔
2. 角色權限矩陣（含家族覆核員 LEGAL-03）走一次 RBAC review
3. AR/AP/Refund 三個 ledger 切分跑一次帳本演練
4. **新增**：§G 三層 lint gate（dependency / policy / event schema）建置

### 12.3 落地原則（Linus-style + §G 補強）

- **消除特殊情況**：所有金額、比例、SLA、approval level、template、reason code 必須 **configurable**（Excel-01 sheet 00 已宣告），不要在程式碼 hardcode
- **資料結構先行**：先把 Conversation / ProblemCard / WorkOrder / Outbox event 四套結構鎖住，再寫 API
- **Never break userspace**：V1.0 已上線的 LINE Bot AI 客服不可因 V2.0 派工模組改動而中斷
- **Theory loses**：不要先做 multi-agent / Belief-Augmented ReAct 願景；單一 ReAct + 8 層 Harness 已能跑 V1.0，Phase I 不重構
- **§B 不污染**：domain / policy layer 禁止 import 任何 §C SDK
- **AI 邊界不漂移**：ADR-0028 charter 為 frozen contract，每次部署過 compatibility test
- **Schema 5 年凍結**：§B Eternal Substrate 變更需 ADR + migration plan

---

## Appendix A — 文件包總體覆蓋率

| 領域              | 文件數                                             | 成熟度                                      |
| --------------- | ----------------------------------------------- | ---------------------------------------- |
| PRD / Discovery | 4 份                                             | 🟢 已批准（v1.1 2026-04-04）                  |
| FR              | 25 份（FR-0001~0025）                              | 🟢 已批准                                   |
| NFR             | 1 份（PRIN-0002）僅前端                               | 🔴 缺 backend / data / observability tier |
| Architecture    | 36 份（ARCH × 5 + DDD × 1 + ADR × 30）             | 🟡 V1.0 充足 / V2.0 待補                     |
| 業務契約（Excel-01）  | 40 sheets（含 165 Q&A + 64 BR + M01-M20 模組）       | 🟢 ERP Consultant 已給預設答案                 |
| AI 契約（Excel-02） | 44 sheets（含 8 Gate / 7 Event / 15 Domain Event / A M01-A M12 / S M01-S M06） | 🟡 8 個 Gap 已在 §F.1 Trade-off 化           |

## Appendix B — 文件交叉索引摘要

| 痛點群           | 主要參考文件                                      |
| ------------- | ------------------------------------------- |
| 業務痛點 (1)      | PRD §2.1, BIZ-0001                          |
| 治理 Gap (2)    | DISC-0001 §3, Excel-02 sheet 19             |
| 規範缺口 (3)      | README §3, PRIN-0002                        |
| AI 治理 (4)     | Excel-02 sheet 04/05/08, ADR-0010/0027/0028 |
| 同步契約 (5)      | Excel-02 sheet 14-23, ADR-0030              |
| 業務規則 (6)      | Excel-01 sheet 04/05/06/14, ADR-0013~0022   |
| 狀態異常 (7)      | Excel-01 sheet 13, SM-0001 work-order       |
| NFR (8)       | PRIN-0002, SOW §7, ARCH-0001 §2.2           |
| 合規 (9)        | PRD Epic 12, FR-0025, SOW Out of Scope      |
| SOW Risk (10) | SOW §8                                      |

---

## Appendix C — Excel 全部 84 sheets 參考索引

證明兩份 Final Spec Excel 全部 84 個 sheets 都被讀過並對應到 v2 框架某層。

### C.1 Excel-01 WorkOrder ERP — 40 sheets

| Sheet | 名稱 | v2 引用位置 |
|-------|-----|-----------|
| 00 | 使用說明 | §G 工程治理（configurable 原則） |
| 01 | 全階段 Roadmap | §A Pre-mortem（Phase 0-V 對應）|
| 02 | 官方架構 | §B 5 層映射 |
| 03 | 模組地圖 M01-M20 | §B1 業務物件（10 個永恆物件）|
| 04 | P0 核心決策（20 條）| §F.2（7 條未決 Trade-off）|
| 05 | 全部 Q&A 決策庫（165 題）| §F 全部（覆蓋三層分類）|
| 06 | 業務規則庫（64 條 BR）| §B1 + §B3（規則對應）|
| 07 | Phase I Scope | §11 Phase I Launch |
| 08 | Phase II Finance（30 條）| §B4 七張帳本 + §F.2 取消費 / 退款 / 車馬費 |
| 09 | Phase III-V | §11 後續 Phase |
| 10 | 流程 Gate（22 條）| §B3 HITL gates + §E3 AI 自主協作 |
| 11 | 權限角色矩陣（18 行）| §B3 4 層 RBAC 原則 + §F.2 角色權限 |
| 12 | 角色維護者 | §B3 RBAC owner 對應 |
| 13 | 狀態異常（10 對象）| §B2 七大狀態機 + §7 異常 |
| 14 | 付款月結（七張帳本）| §B4 金融完整性 |
| 15 | Coding 必做 | §G 工程治理 |
| 16 | Coding 順序 | §G + §11 Phase mapping |
| 17 | AI 工程交接 | §F.3 AI 跟進清單 |
| 18 | AI 跟進清單（82 條）| §F.3（最致命 12 條 Trade-off）|
| 19 | Answer Register（最終答案）| §F 全部（pinned answers）|
| M01 | 客戶入口（Channel Intake）| §B1 Conversation + Site 主檔 |
| M02 | 客戶 / 地址 / 設備（Customer Master）| §B1 Customer / Site / Device |
| M03 | AI ProblemCard | §B1 + §B2 PC state machine |
| M04 | 報價 / 價格 | §B1 Quote + §B4 |
| M05 | WorkOrder 狀態 | §B2 WO state machine |
| M06 | 派工 / 排程 | §D3 Dispatcher Commission ecosystem |
| M07 | 師傅管理（Workforce）| §D3 簽約師傅生態 |
| M08 | 現場施工（Onsite）| §B1 Onsite + §B5 Evidence |
| M09 | Evidence 證據 | §B5 證據與可稽核層 |
| M10 | Product / BOM / Inventory | §B1 Device + §F.3 AI-054 庫存歸屬 |
| M11 | AR / 退款 | §B4 Customer AR + Refund Ledger |
| M12 | AP / 月結 | §B4 Technician AP + Dispatcher Commission + Brand Settlement |
| M13 | RMA / 品質 | §B2 RMA state machine + §B4 責任分配 |
| M14 | Partner Portal | §D3 品牌 / 經銷 / 建商生態 + §F.2 邊界 |
| M15 | 異常 / 核准 / 風控 | §B3 Policy + §7 異常 |
| M16 | Comms / 通知 | §C1 IngressChannel + §E3 multi-channel |
| M17 | Auth / Audit | §B3 RBAC + §B5 Audit |
| M18 | System Admin（System Setup）| §B3 ChangeRequest + §G |
| M19 | BI / KPI | §E1 Data + §D1 Data Moat |
| M20 | AI Ops | §E3 AI 自主協作 + §D2 Knowledge Moat |

### C.2 Excel-02 AI Chatbot Sync — 44 sheets

| Sheet | 名稱 | v2 引用位置 |
|-------|-----|-----------|
| 00 | 使用說明 | §G（AI 邊界宣告）|
| 01 | 全階段 Roadmap | §A + §11 |
| 02 | Chatbot 模組 A01-A12 | §E3 12 個 Agent 模組 |
| 03 | Chatbot 流程（10 步）| §E3 ReAct 流程 |
| 04 | Chatbot Gate G1-G8 | §B3 HITL gates + §E3 + AI-02 |
| 05 | RAG 知識治理（S1-S7 螺旋）| §D2 知識護城河 + §E2 |
| 06 | Agent 訓練規格 | §E2 知識可演化資產 |
| 07 | Eval 品質系統（11 條）| §E2 + §E3 + §G Eval Pipeline |
| 08 | 風險治理（7 類）| §A F3/F4/F7 對應 + §B3 永恆禁區 |
| 09 | AI Employee（19 條 charter）| §E3 AI Employee Charter |
| 10 | Memory（7 層）| §E2 7 層記憶 |
| 11 | Model Routing（5 條）| §C2 LLMProvider + §E3 |
| 12 | Tool Registry（5+3 工具）| §E3 永恆工具抽象 |
| 13 | Chatbot 對 ERP | §B 全層 + §F.3 AI 邊界 |
| 14 | Sync 架構（L1-L6）| §B1 + §B2 |
| 15 | Sync 資料對照 | §B1 主檔欄位 |
| 16 | Sync 狀態對照 | §B2 + §SYNC-01 |
| 17 | Sync 整合（9 種 API）| §B2 + §B5 |
| 18 | Outbox 事件（7 事件）| §B5 + §SYNC-05 |
| 19 | Sync Gap 決策（D01-D08）| §F.1 全部 8 條 Trade-off |
| 20 | Sync 測試矩陣（TC-SYNC-01~10）| §DOC-03 三個未補測試 |
| 21 | Idempotency / DLQ（9 操作）| §B5 + §SYNC-08 |
| 22 | Domain Events Catalog（15 事件）| §B5 + §D1 Data Moat |
| 23 | Cross Contract（10 邊界）| §B1 + §SYNC-02 衝突解決 |
| 24 | Sync 對 ERP（35 條映射）| §B 全層映射 |
| 25 | Phase III-V | §11 後續 Phase |
| A M01 | 進線 Debounce | §E3 + §C1 IngressChannel |
| A M02 | 品牌型號 Profile | §E2 Episodic Memory |
| A M03 | ReAct Agent | §C4 AgentRuntime |
| A M04 | Skill 知識庫 | §D2 + §E2 Semantic |
| A M05 | 安全驗證 | §B3 永恆禁區 + §E3 guardrail |
| A M06 | ProblemCard Bridge | §B1 PC + §E3 工具 |
| A M07 | 真人轉接 | §B3 HITL gates |
| A M08 | 多模態 | §B5 Evidence + §C2 LLMProvider Vision |
| A M09 | Eval 觀測 | §E3 Eval Pipeline + §G |
| A M10 | SOP 螺旋 | §D2 知識護城河 S6-S7 |
| A M11 | 部署健康 | §C5 Deployment + §G |
| A M12 | PRD 治理 | §G 工程治理 + §B5 audit |
| S M01 | Intake 資料捕捉 | §B1 Conversation + §C1 |
| S M02 | Facts 主檔同步 | §B1 Customer + §SYNC-02 |
| S M03 | ProblemCard 轉換 | §B1 + §B2 |
| S M04 | ConvertToWO | §B2 WO + §F.1 D01 |
| S M05 | Dispatch 同步 | §B2 + §D3 |
| S M06 | Evidence 回寫 | §B5 證據鏈 |

**覆蓋率自檢**：上表共 84 行（40 + 44），每個 sheet 至少一個 v2 章節引用，證明全部讀過。

---

*本文件 v2 為「Phase 0 策略 + 痛點」雙層 working list，不是 source of truth。每條痛點 / Trade-off 關閉時請更新對應 ADR / contract，並把本文件對應行標 ✅ 或刪除。*
*v1 (2026-05-21 上午)：62 條痛點清單 → v2 (2026-05-21 下午)：策略藍圖 §A-§G + 痛點附錄。*
