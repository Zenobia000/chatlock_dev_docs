---
id: ADR-0009
title: Agent ↔ Admin 資料同步機制（Bridge Pattern）+ M18 ACL 對齊 (v1.1)
tier: 1
status: Accepted (v1.1 2026-05-28)
date: 2026-05-09
last_updated: 2026-05-28
deciders: [Sunny（PM, Tech Lead 角色）]
related:
  - "./ADR-0067-m18-runtime-config-governance.md"  # M18 runtime config 邊界
  - "./ADR-0068-m18-anti-corruption-layer.md"  # ACL 對齊
update_history:
  - date: 2026-05-28
    update_type: MINOR_UPDATE (v1.1)
    update_reason: "M18 admin tooling 新增 runtime config governance (ADR-0067) + Anti-Corruption Layer (ADR-0068)；對 admin journey Flow S5 + agent→admin HTTP call pattern 有新的契約需求。原 Option D (HTTP call) 主體保留；補：(1) M18 admin tooling 邊界 (config CRUD + audit) 走 ACL；(2) agent 不直接觸碰 admin config table — 透過 admin API ACL；(3) Flow S5 admin journey 對齊。"
    decided_by: 業主
    cascade_refs:
      - ADR-0067
      - ADR-0068
      - "docs/ux/user-flow-smart-lock-saas.md §S5"
---

> 📝 **PARTIAL ANNOTATION (v1.1) BANNER (2026-05-28)**
>
> Lane A critique 2026-05-28 (2/2 STILL_VALID + PARTIAL annotation, Architect + SD)。ADR-0009 Decision 主體（Option D HTTP call + 4 個 create* endpoint + dual-trigger + idempotency 雙層 + 三層 retry）**完整保留 STILL_VALID**。
>
> **ADR-0067 不 supersede ADR-0009 — 兩者處理不同 plane（domain event vs config policy），正交共存**。
>
> 補 4 個 annotation（見下方 §v1.1 Annotations Section）：
> 1. **§2 Plane 分離聲明** — 本 ADR 只處理 agent → admin **業務事件寫入**，config plane 走 ADR-0067
> 2. **§1.2 ASCII 圖** — 補 M18 Config Plane 第三層
> 3. **§6 fail-soft** — agent 對 M18 Config Read API 也套 fail-soft + last-known-good snapshot
> 4. **§8 D 業務 unique key** — 不含 `config_version`，但 row 寫入 persist `config_version_applied`
>
> **Module scope**: A11 (agent bridge) ↔ M18 (config plane) boundary
> **Lane A critique merge report**: [`docs/governance/reviews/ADR-0009-lane-a-critique-2026-05-28.md`](../../governance/reviews/ADR-0009-lane-a-critique-2026-05-28.md)
> **Per ADR-0100 §1 classification** (.claude/context/devteam/meetings/2026-05-27-1130-final-spec-migration-strategy/MoM.md)


# ADR-009: Agent ↔ Admin 資料同步機制（Bridge Pattern）

**狀態:** **Accepted**（2026-05-09 17:00 拍板）
**決策者:** Sunny（PM + Tech Lead 角色）
**日期:** 2026-05-09
**作者:** Sunny + Claude（assisted）

**對應審計:** [F-flow Disconnect Scan §7](../../_audit/F-flow-disconnect-scan.md)

---

## 0. TL;DR

`F-flow disconnect scan` 5/9 16:30 發現系統有 **architectural-level 斷鏈**：agent (LangGraph) 與 admin API/Web 是兩個完全不通的半邊，唯一橋為 F-010 reschedule postback。Production 第一筆 LINE 訊息：agent 處理完寫到 LangGraph checkpoints 表，admin tables 全空 — admin dashboard 看不到任何客戶活動。

本 ADR 列出 **5 個橋接 pattern** 的 trade-off，user 於 2026-05-09 17:00 拍板：

- **採用 Option D (HTTP call from agent to admin API)** — 詳見 §6
- **§8 五個業務決策點全拍板**（dual-trigger 退款保固、rating>=4 觸發 SOP、document_number 本 sprint 含、conversation/message 邊界、Haiku intent classifier）

執行計畫詳見 `/home/sunny/.claude/plans/crispy-brewing-tide.md`（9 phase, ~7-8 天 sprint）。

---

## 1. 背景

### 1.1 觸發事件

PR `f3a5f69` (5/9 14:00) 修補 F-002「客服審 PC → 開 WO」時，發現 `confirm_card()` 不會自動觸發 WO 建立 — 純 status UPDATE 沒 side effect。隨後啟動全盤掃描 `docs/_audit/F-flow-disconnect-scan.md`：

- **G3 OpenAPI vs router**：0 spec→router gap，19 reverse orphans
- **G7 production INSERT path 掃 16 表**：4 個 table 在 production code **0 個 INSERT 路徑**：
  - `conversations` (F-001)
  - `refund_requests` (F-014)
  - `warranty_claims` (F-015)
  - `sop_drafts` (F-017)

### 1.2 系統真相（架構級觀察）

```
   ┌─ Agent (LangGraph) ─────────────┐         ┌─ Admin API + Web ────────┐
   │  • LINE webhook                  │         │  • REST API on :8001     │
   │  • LangGraph checkpoints (DB)    │         │  • SELECT conversations  │
   │  • profiles/user_facts (SCD)     │   ❌    │  • SELECT problem_cards  │
   │  • storage/audit_logs            │  bridge │  • SELECT work_orders    │
   │  • notifications/ (V1.5+)        │         │  • SELECT refund / etc.  │
   └─ 0 INSERT to admin-side tables ──┘         └──────────────────────────┘
                  │
                  └── 唯一橋: F-010 reschedule postback
                              (agent/app.py:291-340 → POST /work-orders/{id}/reschedule/customer-confirm)
```

`agent/` 全模組沒有任何 raw SQL INSERT/UPDATE/DELETE 對 admin tables — 只透過 LangGraph postgres checkpointer / profiles `user_facts` / storage `audit_logs` 寫 DB。

### 1.3 為什麼必須先決定 Bridge Pattern

5 條 P0 之中除 F-002 已修，剩餘 4 條都需要「agent 端 → admin tables」的寫入路徑。如果 4 條各走不同 pattern，會：
- Code coupling 失控（agent 同時用 5 種寫法到 admin）
- Test 與 monitoring 混亂
- 後續維護成本爆

統一 pattern 是必要的。

---

## 2. 問題敘述

**核心問題**：LINE webhook 處理完一則訊息，agent 怎麼把「對話記錄、提取出的問題卡、發起的退款／保固／SOP 草稿」傳達給 admin DB tables？

**系統限制**：
- agent (`agent/`) 與 admin API (`api/`) 是同一 repo 不同 Python module
- 兩者共用 `POSTGRES_URI`（同一個 PostgreSQL instance）
- agent 啟動 port 8000；admin API 啟動 port 8001（dev）；prod 兩個獨立 Cloud Run service
- 既存先例：F-010 reschedule postback 用 HTTP call (`agent/app.py:291-340`)
- ADR-008 已 SUPERSEDED；當前架構為 skills/ canonical（不影響本 ADR）

---

## 3. 五個 Bridge Pattern

### Option A: Agent 直接寫 admin tables（Direct DB write）

agent 在處理完 LINE event 後，直接 `psycopg.execute("INSERT INTO conversations / problem_cards / ...")`。

**Pros**:
- 最簡單：1 個 SQL execute call
- 無中介、無延遲、無重試邏輯需要
- agent 已連同個 DB（`POSTGRES_URI`），無新 infra

**Cons**:
- agent 與 admin schema 直接耦合 — schema 變動兩邊都要改
- 需要在 agent/ 內維護 admin tables 的 INSERT SQL（重複 SOT）
- 跨模組 transaction 沒有自然 boundary
- 違反 admin/agent 的 module 分離原則（雖然 ADR-008 已 superseded，但分離仍是 best practice）

**估時補 4 P0**: ~3-4 天

---

### Option B: Outbox pattern

agent 寫 `agent_outbox` 表（agent-owned），admin 端跑 worker process（或 SQL trigger / pg_cron）把 outbox 事件投到 admin tables。

**Pros**:
- 解耦：agent 不直接知道 admin tables 結構
- 可重試：outbox 處理失敗可標記 retry
- 可審計：所有事件 append-only
- transaction safety: agent 寫 outbox 與 LangGraph checkpoint 同 tx

**Cons**:
- 需新增 worker process（dev 要起、prod 要 deploy 第三個 service）
- 需新增 `agent_outbox` 表 + schema
- 複雜度上升（事件 schema 設計、處理 idempotency）
- Eventual consistency — admin 可能晚幾秒看到資料

**估時補 4 P0**: ~5-7 天（含 worker 基礎設施）

---

### Option C: Event Bus（PostgreSQL `LISTEN/NOTIFY` 或外部 Redis Pub/Sub）

agent 發 event，admin worker 訂閱處理。

**Pros**:
- 真正非同步、可擴展
- 解耦最徹底
- 適合多訂閱者場景（未來 analytics / metrics）

**Cons**:
- `LISTEN/NOTIFY` 不持久（admin 重啟會掉訊息），需配 outbox 才安全 → 等於 B+C
- Redis Pub/Sub 同樣不持久；需 Redis Streams 或 Kafka 才有 durability
- Infra 複雜度大幅上升（新增 Redis / message broker）
- 對小團隊 over-engineered

**估時補 4 P0**: ~7-10 天（含 broker infra）

---

### Option D: Agent → Admin API HTTP call（既有先例）

agent 處理完 LINE event 後，HTTP POST 到 admin API endpoint，由 admin 端的 router → service → DB 寫入。

**Pros**:
- **已有先例**：F-010 reschedule postback (`agent/app.py:291-340`) 已用此 pattern
- API 為單一寫入控制點，business logic 集中在 admin/api/ services（與 web frontend 共用）
- 自然的 module boundary
- spec/contract 自動 cover（OpenAPI 已是 SSOT，補 `createConversation` / `createRefundRequest` 等 endpoint 即可）
- agent 不知道 admin schema，只知道 API contract
- transaction boundary 自然在 admin service 層

**Cons**:
- agent 對 admin API 同步依賴 — admin API 掛掉 agent 卡住（需 retry + fail-soft 機制）
- 多一次 HTTP round-trip（dev local 1ms，prod cross-service 10-50ms）
- 需要 internal auth (JWT or Bearer)；F-010 案例已用 `INTERNAL_API_BEARER`
- spec 需補 N 個新 `create*` endpoint（`createConversation` / `createRefundRequest` / `createWarrantyClaim` / `createSopDraft`）

**估時補 4 P0**: ~3-4 天（最快）

---

### Option E: Shared service/DAO layer（agent 直接 import api.services）

把 admin api 的 service 層抽成獨立 package，agent 與 admin api 都 import。agent 在處理 LINE event 後直接呼叫 `api.services.conversation_service.create_conversation(...)`。

**Pros**:
- 無 HTTP overhead
- service layer 共用、business logic 集中
- transaction 在 service 層自然管理

**Cons**:
- 模組邊界劇烈耦合 — agent 必須 import api/，違反目前 layout
- 部署上必須同 image / 同 process（無法分開 deploy）
- 共用 service 的 dep 樹會變大（agent 啟動時間延長）
- ADR-008 中曾出現 agent 與 api 邏輯互相 import 引發過維護問題

**估時補 4 P0**: ~4-5 天（含模組重整）

---

## 4. Trade-off 比較表

| 維度 | A. Direct DB | B. Outbox | C. Event Bus | D. HTTP call | E. Shared service |
|------|------------|-----------|------------|------------|----------------|
| **複雜度** | 🟢 最低 | 🟡 中 | 🔴 高 | 🟡 中 | 🟡 中 |
| **新 infra** | 0 | worker | broker | 0（已有 API）| 0 |
| **Module 解耦** | 🔴 差 | 🟢 好 | 🟢 好 | 🟢 好 | 🔴 差 |
| **Schema coupling** | 🔴 直接 | 🟢 隔離 | 🟢 隔離 | 🟢 隔離（透過 contract）| 🟡 service signature |
| **Transaction safety** | 🟡 跨表複雜 | 🟢 outbox tx | 🟡 需配 outbox | 🟢 admin service tx | 🟢 service tx |
| **Latency** | 🟢 最低 | 🟡 worker poll | 🟡 broker | 🟡 HTTP | 🟢 直接 call |
| **可重試** | 🔴 無 | 🟢 内建 | 🟢 內建 | 🟡 需自加 | 🔴 需自加 |
| **可審計** | 🟡 audit log | 🟢 outbox 即記錄 | 🟢 event log | 🟢 admin audit | 🟡 audit log |
| **既有先例** | ❌ | ❌ | ❌ | ✅ F-010 reschedule | ❌ |
| **估時補 4 P0** | 3-4 天 | 5-7 天 | 7-10 天 | 3-4 天 | 4-5 天 |
| **Failure mode** | partial write | retry 重發 | retry 重發 | fail-soft + retry | exception |

---

## 5. 評估準則

選擇 pattern 應考量：
1. **快速止血**：5 條 P0 是 production blocker，越快補完越好（A/D 最快）
2. **長期可維護**：未來 V2.0 / V3.0 可能有 10+ 條同類 flow，pattern 需 sustainable
3. **既有架構一致性**：F-010 已用 D pattern，採同 pattern 一致性最佳
4. **基礎設施成本**：避免引入 worker/broker（B/C）的部署成本
5. **Schema 與 spec 演化**：用 D 補的 endpoint 自動成為 OpenAPI SSOT 的一部分，frontend 自動有 typed access

---

## 6. 推薦：Option D（HTTP call）

### 理由

按 §5 五個準則對照：

1. **快速止血** ✅ 最快（已有 httpx + INTERNAL_API_BASE_URL infra）
2. **長期可維護** ✅ 中等 — 比 A 好（schema 隔離），比 B/C 簡單
3. **既有架構一致性** ✅ F-010 reschedule postback 已是此 pattern，繼續延伸自然
4. **基礎設施成本** ✅ 0 — 不需新 worker / broker
5. **Schema/spec 演化** ✅ 補 4 個 `create*` endpoint 後 frontend / agent / docs 自動同步

### 短期 vs 長期

- 短期（V1.0）：Option D 補 4 條 P0 → admin dashboard 在 production 第一天就有資料
- 長期（V2.0+）：若流量上來、admin API 成 bottleneck → 部分高頻 endpoint 可改 outbox（B），不影響其他 endpoint
- 不需一次走到 B/C 的完整解耦

### 實作架構（推薦）

新增 `agent/integrations/admin_api.py`（或類似）統一管 HTTP call：

```python
class AdminAPIClient:
    """統一封裝 agent → admin API HTTP calls。"""

    async def create_conversation(self, line_user_id: str, ...) -> str:
        """POST /api/v1/conversations → conversation_id"""

    async def create_problem_card(self, conversation_id: str, ...) -> str:
        """POST /api/v1/problem-cards → pc_id"""

    async def create_refund_request(self, ...): ...
    async def create_warranty_claim(self, ...): ...
    async def create_sop_draft(self, ...): ...
```

每個 method：
- httpx.AsyncClient + timeout
- Internal Bearer auth (`INTERNAL_API_BEARER`)
- Idempotency-Key header
- retry with exponential backoff (3 次：100ms / 500ms / 2s)
- fail-soft：失敗時 logger.error 不拋（避免 LINE webhook 1s 限制超時）+ alert

OpenAPI 補：
- `POST /conversations` (`createConversation`)
- `POST /refunds` (`createRefundRequest`)
- `POST /warranty-claims` (`createWarrantyClaim`)
- `POST /sop-drafts` (`createSopDraft`)
- `createProblemCard` 已存在不動

---

## 7. Proposed → Accepted 後的執行計畫

若拍板 Option D：

| Phase | 動作 | 估時 |
|-------|------|------|
| **1** | OpenAPI 補 4 個 `create*` operation + schema | 0.5 天 |
| **2** | api/routers + services 實作 4 個 create endpoint | 1 天 |
| **3** | `agent/integrations/admin_api.py` AdminAPIClient（含 retry + fail-soft） | 0.5 天 |
| **4** | agent webhook handler 嵌入 conversation/PC create 呼叫（F-001） | 0.5 天 |
| **5** | F-014/F-015/F-017 各別嵌入相對應 trigger（依業務 flow 設計）| 1 天 |
| **6** | Integration tests（各 P0 一個 happy path） | 1 天 |
| **7** | E2E + Playwright 驗證 (Phase 3 of audit plan)| 1-2 天 |
| **8** | Docs 同步：wiring matrix + SSOT alignment matrix | 0.5 天 |
| **總計** | | **~5-7 天** |

若拍板 A/B/C/E，請另行擬定執行計畫。

---

## 8. 拍板結果（5/9 17:00）

| 問題 | 拍板 | 詳細設計 |
|------|------|---------|
| 採用哪個 pattern？ | ✅ **D (HTTP call)** | 詳見 §6 |
| F-014/F-015 退款/保固「客戶申請」誰觸發？ | ✅ **Dual-trigger** | (a) 消費者 LINE 申請（agent intent classifier 偵測「退款」/「保固」意圖）+ (b) CS 在 admin web 主動代開。同一個 `POST /api/v1/refunds`（resp. `/warranty-claims`）endpoint，body metadata 區分 `requested_by`。 |
| F-017 SOP 自進化在哪 trigger？ | ✅ **每筆 case resolved 且 customer_rating>=4** | 無 rating 則 skip（不擴大 LLM 成本）。agent 異步 fire-and-forget 任務：work_order.status=completed 且 rating>=4 → LLM extract → `POST /sop-drafts`。 |
| Idempotency 怎麼設計？ | ✅ **雙層**：HTTP `Idempotency-Key` (key = `{line_user_id}:{message_id}:{flow_id}`, TTL 24h) + 業務 unique key | 業務 key per 單據：conversation `session_id`、PC `(conversation_id)`、WO `(problem_card_id)`、Refund `(work_order_id, reason_code)`、Warranty `(work_order_id, claim_type)`、SopDraft `(case_entry_id, model_version)`。 |
| Retry 失敗怎辦？ | ✅ **三層策略** | Critical path (LINE → conversation/PC create) 與 Customer-initiated (refund/warranty 申請): retry 3 次 (100ms/500ms/2s) → fail 寫 `agent_outbox` (worker phase 2 補) → 客戶仍收 LINE 確認回應。Side-effect path (SOP, metric): 1 次嘗試失敗 logger + alert，下次 case resolved 重新有機會。 |
| **(新增 D3)** 業務單據編號 (document_number)？ | ✅ **本 sprint 含**（不延後） | 5 表加 `document_number VARCHAR(30) UNIQUE` 欄位 + 5 sequences + `generate_doc_number(prefix, seq_name)` SQL function。Format: `{ST/WO/RM/WC/SOP}-YYYYMMDD-NNNN`。Frontend detail page 取代純 UUID 顯示；LINE 回覆給 customer 引用。 |
| **(D4)** F-001 message vs conversation 邊界？ | ✅ Recommended | conversation = LINE session（既有 30 min idle reset）；message = LINE event 個別訊息。conversation 在首次訊息建立，後續訊息歸屬同 session。|
| **(D5)** agent intent classifier 成本控制？ | ✅ Recommended | 用既有 LiteLLM；intent first-pass 走 cheap model（Haiku），confidence 高才升級主模型。維持 LINE 1s 回應限制。|

執行計畫詳見 `/home/sunny/.claude/plans/crispy-brewing-tide.md`（9 phase, ~7-8 天 sprint）。

---

## 9. 替代方案的撤回時機

若未來證實 Option D 不夠：
- API 成 bottleneck → 將高頻 endpoint 改 Outbox (B)
- 多訂閱者需求出現（如 analytics service） → 引入 LISTEN/NOTIFY (C)
- 不需要全面切換，按 endpoint 漸進演化

---

## 10. 參考

- `docs/_audit/F-flow-disconnect-scan.md` — 觸發本 ADR 的審計報告
- `agent/app.py:270-340` — F-010 reschedule postback 既有先例
- `api/routers/problem_cards.py` — `convertToWorkOrder` 5/9 補的 D pattern 樣板
- ADR-007 — LLM Registry pattern（同 repo 既有 ADR 風格參考）

---

## §v1.1 Update (2026-05-28)

> **觸發**: M18 admin tooling 新增兩個 ADR：ADR-0067 (runtime config governance) + ADR-0068 (M18 Anti-Corruption Layer)。原 Bridge Pattern 主體（Option D HTTP call）**保留**，補三項契約。
> **業主裁決**: 2026-05-28 接受 v1.1 update（不 SUPERSEDE — 原 5 條 P0 補強路徑仍 valid，M18 admin tooling 為新增正交維度）。

### §v1.1.1 — M18 Admin Tooling 對 Bridge 的影響

M18 admin tooling（runtime config governance, ADR-0067）引入 **config CRUD + staged rollout + audit + rollback** 場景。對 Bridge Pattern 有兩個邊界決定：

| 場景 | 走 Bridge 規則 |
|:----|:--------------|
| Agent 讀 M18 config（金額門檻 / SLA / RBAC mapping etc.） | **不直接讀 config table** — 走 admin API `GET /api/v1/config/{key}` 或本地 config cache（M18 publish 時觸發 invalidation） |
| Agent 寫 M18 config | **永禁**（per ADR-0028 charter — AI 不可改 governance config） |
| Admin user 改 M18 config | 走 admin web → admin API → M18 service tx → emit `ConfigChanged` event → agent 訂閱 invalidate cache |
| Agent 引用 config version | 必填 `config_version_id` in 所有 emit event（per ADR-0067 audit invariant） |

### §v1.1.2 — Anti-Corruption Layer (ADR-0068) 對齊

ADR-0068 引入 M18 Anti-Corruption Layer：admin 端 governance domain 與其他 module（M11/M07/M03/M02）之間透過 ACL 隔離。對本 ADR 影響：

| 路徑 | ACL 處理 |
|:----|:--------|
| Agent → Admin API `create*` endpoints (本 ADR §6 既有 5 個) | **不經 ACL**（agent 是 admin domain 的 client，不是被隔離的外部 module） |
| Agent → Admin API `GET /config` (新增 §v1.1.1) | **經 ACL** — admin 側透過 ACL adapter 把 governance config 轉成 agent domain DTO（不直接暴露 internal schema） |
| Agent emit event → 其他 module 訂閱 | 走 event bus（Phase II outbox），ACL 在 subscriber 端做 schema 轉換 |

### §v1.1.3 — Flow S5 Admin Journey 對齊

對齊 [`docs/ux/user-flow-smart-lock-saas.md §S5 — M18 admin journey`](../../ux/user-flow-smart-lock-saas.md)：

| Flow S5 Step | Bridge 對應 endpoint | Audit 要求 |
|:-------------|:--------------------|:-----------|
| Admin 進 config 編輯頁 | `GET /api/v1/config/list` + `GET /api/v1/config/{key}/draft` | view audit |
| Admin 編輯 + validate | `POST /api/v1/config/{key}/draft` (schema validation per ADR-0067) | draft create audit |
| Admin staged rollout 5% → 50% → 100% | `POST /api/v1/config/{key}/rollout` (per BR-M18 staged rollout: 5%/50%/100% 每段 30 min observation, fast-track 15 min schema pass + 0-error) | rollout audit + alert wire |
| Admin rollback | `POST /api/v1/config/{key}/rollback` (≤ 1 min, per A1 NFR) | rollback audit |
| Admin view audit history | `GET /api/v1/config/{key}/audit` | read-only |

**業主 BR-M18 value decision (2026-05-28)**: staged rollout = 5% → 50% → 100%, 每段 30 min observation, fast-track 15 min (schema pass + 5% no-error)。Rationale: 萬級用戶 SaaS 不需 Google 規模，但 config 改錯直接影響業務，30 min 才夠 ops alarm + 客服回饋 cycle。

### §v1.1.4 — 影響的下游文件（v1.1 cascade）

| Doc | Impact |
|:---|:---|
| `docs/api/openapi-admin.yaml` | 補 5 個 config endpoint：list / get-draft / rollout / rollback / audit |
| `docs/ux/user-flow-smart-lock-saas.md` | §S5 admin journey 5 步驟對齊 §v1.1.3 endpoint |
| `agent/integrations/admin_api.py` | AdminAPIClient 加 `get_config(key, version=None)` method + cache invalidation listener |
| `docs/architecture/c4-l3-smart-lock-saas.md` | C4 L3 補 M18 admin tooling 與 agent 的雙向交互（agent 訂 invalidation event） |
| `docs/qa/test-plan-m18.md` | ≥ 6 TC (5 staged rollout step × happy/error path + rollback timing) |

### §v1.1.5 — 風險回顧

| Risk | Mitigation |
|:-----|:-----------|
| agent cache stale → config 改了沒生效 | event-based invalidation + 5 min hard refresh fallback；agent 啟動時必填 `config_version_id` 入 event metadata |
| ACL 在 admin 側引入額外延遲 | benchmark: ACL adapter ≤ 5ms overhead；agent → admin total P99 ≤ 100ms |
| Flow S5 staged rollout 出錯 | per ADR-0067 rollback ≤ 1 min；alarm 觸發後自動降回前一 version |
| 業主 BR-M18 30 min observation 過長 | fast-track 15 min 路徑（schema pass + 5% no-error）；不可用於 RBAC / 金額門檻 變更 |

### §v1.1.6 — Acceptance Criteria (v1.1)

- [x] 業主 2026-05-28 value decision BR-M18 staged rollout 5%/50%/100% × 30 min + fast-track 15 min
- [ ] OpenAPI 補 5 個 config endpoint
- [ ] AdminAPIClient.get_config + invalidation listener
- [ ] Flow S5 admin journey 5 步驟對齊 (ux driver)
- [ ] C4 L3 補 M18 admin tooling 雙向交互
- [ ] QA 6 TC 涵蓋 staged rollout + rollback
- [ ] ACL adapter benchmark ≤ 5ms (ADR-0068 cross-validate)

---

## §v1.1 Lane A Critique 2026-05-28 — 4 Annotations Detail

> Lane A critique (Architect + SD) 2/2 STILL_VALID + PARTIAL annotation。下列 4 個 annotation 為 disambiguation + future-proofing，**不改 Decision 主體**。

### Annotation 1 — Plane 分離聲明 (對應原 critique [arch-S-1])

**補充原文應加在 §2「問題敘述」末段**：

> 本 ADR 只處理 agent → admin **業務事件寫入**（conversation / problem_card / refund / warranty / sop_draft），**不處理 config / policy 讀取**。後者見 [`ADR-0067 — M18 Runtime Configuration Governance`](./ADR-0067-m18-runtime-config-governance.md)（cross-cutting plane，所有 module 含 agent 都讀此 config plane）。
>
> 兩 plane 正交：
>
> | Plane | 處理對象 | 方向 | 觸發者 | Failure mode |
> |:------|:--------|:-----|:------|:-------------|
> | **本 ADR (domain event plane)** | 業務事件 / 單據 | agent → admin (cross-module event ingress) | LINE webhook event (每筆訊息) | admin API 不可用 → fail-soft retry + outbox phase 2 |
> | **ADR-0067 (config plane)** | 配置 / policy 資料 | admin 發布，所有 module 讀 | 業主在 admin UI 改設定 (低頻 ops 動作) | mis-config 全量生效 → blast radius 全 module |

### Annotation 2 — §1.2 ASCII 圖補 M18 Config Plane 第三層 (對應原 critique [arch-S-2])

```
   ┌─ Agent (LangGraph) ──┐    ┌─ Admin API ──┐    ┌─ M18 Config Plane (ADR-0067) ──┐
   │  • LINE webhook      │    │  • 業務 CRUD  │    │  • config_versions               │
   │  • Skill ReAct       │──▶ │  • create*    │ ◀──│  • staged rollout                │
   │  • LangGraph ckpt    │ D  │  • RBAC audit │    │  • cache invalidate broadcast    │
   └──────────────────────┘    └──────────────┘    └─────────┬────────────────────────┘
               ▲                       ▲                     │
               │                       │                     │ Config Read API
               └───────────────────────┴─────────────────────┘ (GET /m18/config/{key}?ver=N)
                      all read config via ADR-0067 ACL
```

說明：
- agent 與 admin API 透過本 ADR Option D HTTP call（business write path）
- agent 與 admin API 都透過 ADR-0067 Config Read API 讀 config（與 business write 完全不同 endpoint / 不同 tag / 不同 RBAC scope）
- M18 改 config → 觸發 invalidation broadcast → agent / admin runtime 都 cache miss → 各自從 Config Read API 重抓

### Annotation 3 — §6 fail-soft 補 config Read API last-known-good (對應原 critique [arch-S-3])

**補充原文應加在 §6「fail-soft」段末**：

> agent 必須對 M18 Config Read API 也套同樣 fail-soft：staged rollout 期間 config Read 失敗時用 **last-known-good snapshot**，不阻塞 webhook。
>
> **規則**：
> 1. agent 啟動時拉一份 config snapshot 進記憶體（per-key + version_id）
> 2. 每次 webhook 處理開始時 snapshot per 交易（同一筆 refund 用同一 version_id，per ADR-0067 §一致性段）
> 3. Cache invalidation broadcast 到達後，下一筆新交易才用新 version
> 4. Config Read API 失敗（5xx / timeout）→ 用 last-known-good snapshot；同時 log warning + emit 觀測指標
> 5. last-known-good snapshot ≥ 24 hr 沒更新 → 升級 alert（M16 通知 ops on-call）
>
> 這條與 ADR-0067 §Cache/TTL 段 snapshot per 交易呼應。
>
> **AdminAPIClient retry policy 參數本身應該是 runtime config (對應 [arch-S-4])**：
> §6 列出的 retry policy 參數（次數 / backoff / timeout / Idempotency-Key TTL）為 default，**生產環境應透過 M18 Config Read API 讀取**並支援 staged rollout（per ADR-0067）。避免「為什麼修個 retry 次數還要 redeploy」未來再來一次 ops 痛點。**Phase II follow-up**（TODO 暫保留為 const，等 ADR-0067 implementation 完成再 cascade）。

### Annotation 4 — §8 D 業務 unique key 不含 config_version (對應原 critique [sd-S-2])

**補充原文應加在 §8 D 列末**：

> 業務 unique key **不含** `config_version`，但寫入 row 時必須 **persist `config_version_applied`**（per ADR-0067 §一致性段）。
>
> **Rationale**：idempotency 是「同一語意動作只執行一次」，與 config version 正交。若客戶在 staged rollout 期間重發 refund 申請，仍應視為同一筆 refund，不因 config bump 變成新 refund。但 refund row 必須 persist `config_version_applied` 給後續查詢 / audit 用（例：付款時必須用同一 v3 不能用 v4）。
>
> **業務 unique key 範例**（保留 ADR-0009 v1 原貌）：
>
> ```
> Refund: (work_order_id, reason_code)               # 不含 config_version
> Warranty: (work_order_id, claim_type)              # 不含 config_version
> SopDraft: (case_entry_id, model_version)           # 不含 config_version
> ```
>
> **Row schema 必須額外含**：`config_version_applied: int (per ADR-0067 一致性段)`

### Annotation 5 (Bonus) — M20 SOP Approval Workflow placeholder (對應原 critique [sd-S-3])

> SOP draft → active SOP 的 approval workflow 見 M20 governance（呼應 BR-M20-01 + 本 ADR §8 F-017 rating>=4 觸發點），不在本 ADR 內補。
>
> **Follow-up ADR**：`ADR-NNNN-m20-ai-ops-governance`（pending；待 M20 spec maturity）— 將 cover：
> - `createSopDraft` 寫入後的 owner approval 流程
> - SOP version bump 規則
> - Active SOP rollback path

### Annotation 6 (Bonus) — OpenAPI error model 補 503 ConfigUnavailable (對應原 critique [sd-S-4])

> §6 列「fail-soft：失敗時 logger.error 不拋」。新 spec 下還有一種失敗：**M18 Config Read API 暫不可達 / cache 失效**（staged rollout 期間）。
>
> admin Write API（4 個 `create*`）內部需要讀 config（如 refund 上限）才能 validate request。
>
> **error model 補一條** `503 ConfigUnavailable` 給 agent 端能識別並 fallback last-known-good，不要當成 5xx 重試到死。
>
> Owner: `devteam-design` (F3 of Lane A critique follow-up)
