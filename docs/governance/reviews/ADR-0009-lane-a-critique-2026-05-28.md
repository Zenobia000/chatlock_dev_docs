# Lane A Critique Merge Report: ADR-0009 Agent ↔ Admin Bridge Pattern

**日期**：2026-05-28
**Target**：`docs/architecture/adr/ADR-0009-agent-admin-bridge-pattern.md`
**Critique Personas**：Architect / SD (System Designer)
**Intensity**：standard
**Convergence**：✅ **2/2 STILL_VALID + PARTIAL annotation**（無 SUPERSEDE）
**Per**：[`KB-04 §ADR Supersede Chain`](../../../devteam_knowledge_base/04_freeze_gates.md) + [`KB-13 §2 / §8`](../../../devteam_knowledge_base/13_doc_migration_playbook.md) REVIEW_REQUIRED 進入決策結論

---

## 📋 Verdict: STILL_VALID (PARTIAL annotation required)

ADR-0009 的 Decision 主體（Option D = HTTP call from agent to admin API + 4 個 `create*` endpoint + dual-trigger + idempotency 雙層 + 三層 retry）**完整保留**。

**ADR-0067 不 supersede ADR-0009 — 兩者處理不同 plane**：

| Plane | ADR-0009 scope | ADR-0067 scope |
|:------|:----------------|:----------------|
| 處理對象 | **業務事件 / 單據資料**（conversation / problem_card / refund / warranty / sop_draft）— agent webhook → admin tables write path | **配置 / policy 資料**（金額、比例、threshold、SLA、template、reason code）— admin UI → runtime config plane |
| 方向 | agent **寫** 業務事件到 admin（cross-module event ingress）| admin **發布** config，所有 module（含 agent）**讀** config |
| 觸發者 | LINE webhook event（每筆訊息）| 業主在 admin UI 改設定（低頻 ops 動作） |
| Failure mode | admin API 不可用 → fail-soft retry + outbox phase 2 | mis-config 全量生效 → blast radius 全 module |
| Anti-corruption | OpenAPI contract（4 個 `create*`）| M18 Config Read API（GET /m18/config/{key}?version=N） |

**結論**：兩 ADR **正交（orthogonal）**，**共存**，**不可互相替代**。但 ADR-0009 需 PARTIAL annotation 標出：（a）agent 讀 config 必須走 ADR-0067 Config Read API 不可硬編碼、（b）`AdminAPIClient` retry/timeout 等行為參數應該本身是 runtime config（吃自己的狗糧）、（c）原 ADR-0009 §1.2 「LangGraph profiles user_facts」與新 spec M18 「主檔/角色/SLA 設定」是不同 plane 不衝突。

---

## 🔍 Architect persona critique

> 視角：NFR / boundary / failure modes / blast radius

### [arch] critique on docs/architecture/adr/ADR-0009-agent-admin-bridge-pattern.md

#### 重大阻礙（必修才能 freeze）

- **[arch-B-0] (無)** — ADR-0009 在新 spec / ADR-0067 之後仍是有效的 boundary 設計，無架構級阻礙。

#### 建議調整（可接受但建議改）

- **[arch-S-1] PARTIAL annotation：明文標 plane 切分**
  - ADR-0009 §2「問題敘述」應補一段：「本 ADR 只處理 agent → admin **業務事件寫入**，**不處理 config / policy 讀取**。後者見 ADR-0067 M18 Runtime Config Governance（cross-cutting plane）。」
  - 否則未來讀者可能誤以為 agent 改 config 也走 `AdminAPIClient` 4 個 `create*`（錯）。

- **[arch-S-2] Bounded context 邊界更新**
  - ADR-0009 §1.2 ASCII 圖只畫了「agent / admin」兩邊，**沒畫 M18 Config 層**。新 spec 後 boundary 應是：
    ```
    ┌─ Agent (LangGraph) ──┐    ┌─ Admin API ──┐    ┌─ M18 Config Plane ──┐
    │  • LINE webhook      │    │  • 業務 CRUD  │    │  • config_versions  │
    │  • Skill ReAct       │──▶ │  • create*    │    │  • staged rollout   │
    │  • LangGraph ckpt    │ D  │  • RBAC audit │    │  • cache invalidate │
    └──────────────────────┘    └──────────────┘    └─────────┬───────────┘
                ▲                       ▲                     │
                │                       │                     │ Config Read API
                └───────────────────────┴─────────────────────┘ (GET /m18/config/{key}?ver=N)
                       all read config via ADR-0067 ACL
    ```
  - 建議在 ADR-0009 §1.2 補 ASCII 圖第三層，或加 cross-ref：「config plane 見 ADR-0067 圖」。

- **[arch-S-3] Failure mode 補充：admin API 操作對 agent runtime 的影響路徑改變**
  - 舊認知：admin API 掛 → agent fail-soft 寫 audit log（ADR-0009 §6 已寫）。
  - 新認知：admin 改 config（ADR-0067 staged rollout）→ broadcast invalidation → **agent runtime cache miss** → agent 必須容忍 read-amp 突發（10-50ms 額外 latency）。LINE 1s 限制有風險。
  - 建議 ADR-0009 §6「fail-soft」段補：「agent 必須對 M18 Config Read API 也套同樣 fail-soft：staged rollout 期間 config Read 失敗時用 last-known-good snapshot，不阻塞 webhook。」這條與 ADR-0067 §Cache/TTL 段 snapshot per 交易呼應。

- **[arch-S-4] `AdminAPIClient` 本身的 retry / timeout / circuit breaker 參數應該是 config**
  - ADR-0009 §6 寫死「retry 3 次（100ms/500ms/2s）+ timeout」— 這些**正是 ADR-0067 BR-M18-01 「Service items, SLA, thresholds」治理範疇**。
  - 不改 ADR-0009 主決策，但補一句：「§6 列出的 retry policy 參數（次數 / backoff / timeout / Idempotency-Key TTL）為 default，**生產環境應透過 M18 Config Read API 讀取**並支援 staged rollout（per ADR-0067）。」
  - 避免「為什麼修個 retry 次數還要 redeploy」未來再來一次 ops 痛點。

#### 通過項

- §6 Option D 推薦理由（既有先例、schema 隔離、自然 module boundary、估時最短）**在新 spec 下仍成立**。
- §8 五個拍板（dual-trigger、SOP rating>=4、document_number 本 sprint、conversation/message 邊界、Haiku intent classifier）皆與 M20 AI Ops（BR-M20-01/02/03）對齊，無衝突。
- §9 「替代方案撤回時機」演化路徑（→ Outbox → Event Bus）**未被 ADR-0067 影響**，agent 寫業務事件未來仍可改 outbox。

#### 跨 persona 衝突點

- **與 SD persona 潛在衝突**：SD 可能主張 4 個 `create*` endpoint 在 admin 變 runtime config plane 後**應該重新 review API contract**（會否被 config-controlled flag 改變 behavior）。Architect 認為這正是 ADR-0009 §6 §9 cover 的演化路徑，**不必 supersede**。詳見 SD 段落。

---

## 🔍 SD (System Designer) persona critique

> 視角：API contract / 平行實作 / error model / 與 admin UI flow 重疊

### [sd] critique on docs/architecture/adr/ADR-0009-agent-admin-bridge-pattern.md

#### 重大阻礙（必修才能 freeze）

- **[sd-B-0] (無)** — 4 個 `create*` endpoint contract 在 M18 引入後**仍 stable**，無 API contract 級阻礙。

#### 建議調整（可接受但建議改）

- **[sd-S-1] M18 admin UI 與 agent bridge 的 API 邊界**
  - M18 admin UI 走的是 **Config Read/Write API**（讀寫 `config_versions` 表 + invalidation broadcast）。
  - ADR-0009 4 個 `create*` 走的是 **Domain Write API**（寫 conversation / problem_card / refund / warranty / sop_draft 表）。
  - **完全不重疊**：不同 router、不同 service、不同 schema、不同 RBAC scope（M18 require system-admin role；ADR-0009 endpoint require agent internal Bearer）。
  - 但 OpenAPI 主檔應補 tag 區分：
    - `tags: [Config, M18]` for ADR-0067 endpoints
    - `tags: [DomainWrite, AgentBridge]` for ADR-0009 4 個 `create*`
  - 避免 frontend / coding agent 誤用。

- **[sd-S-2] Idempotency-Key 在 staged rollout 期間的雙重含義**
  - ADR-0009 §8 業務 idempotency key 範例：`Refund (work_order_id, reason_code)`。
  - ADR-0067 引入 `config_version` snapshot per 交易：同一筆 refund 開單時 snapshot `cancellation_fee_config v3`，付款時也必須用 v3。
  - **Open question**：refund idempotency key 是否要加 `config_version`？例如 `Refund (work_order_id, reason_code, config_version)`？
    - **建議答**：**不加**。idempotency 是「同一語意動作只執行一次」，與 config version 正交。若客戶在 staged rollout 期間重發 refund 申請，仍應視為同一筆 refund，不因 config bump 變成新 refund。
    - 但 refund row 必須 **persist `config_version_applied`** 欄位（per ADR-0067 §一致性要求）。
  - 建議在 ADR-0009 §8 D 列補一句：「業務 unique key **不含** `config_version`，但寫入 row 時必須 persist `config_version_applied`（per ADR-0067 §一致性段）。」

- **[sd-S-3] AI Ops（M20）governance 如何 cover SOP draft create path**
  - ADR-0009 §8 拍板「F-017 SOP 自進化 rating>=4 觸發」。
  - 新 spec BR-M20-01「AI knowledge owner」要求 SOP / FAQ / forbidden actions 有 owner + version approval。
  - 意涵：`createSopDraft` 寫入 `sop_drafts` 後，**還有 M20 governance 段**（owner review + approval + version bump）才能變 active SOP。
  - ADR-0009 §8 沒講這層 — 不算衝突，但要在 ADR-0009 §6 §9 後加一條 follow-up reference：「SOP draft → active SOP 的 approval workflow 見 M20 governance（pending ADR / BR-M20-01）」。

- **[sd-S-4] OpenAPI error model 缺一條：config_unavailable**
  - ADR-0009 §6 列「fail-soft：失敗時 logger.error 不拋」。
  - 新 spec 下還有一種失敗：**M18 Config Read API 暫不可達 / cache 失效**（staged rollout 期間）。
  - admin Write API（4 個 `create*`）內部需要讀 config（如 refund 上限）才能 validate request。
  - 建議 error model 補一條 `503 ConfigUnavailable` 給 agent 端能識別並 fallback last-known-good，不要當成 5xx 重試到死。

#### 通過項

- 4 個 `create*` endpoint contract（payload / response / status code）**在新 spec 下無需改動**。
- D5 Haiku intent classifier（§8）與 M20 model routing（ADR-0027）方向一致。
- D4 conversation / message 邊界（30 min idle reset）與 chatbot session 規格（A03 / A04 spec）對齊。

#### 跨 persona 衝突點

- 與 Architect 一致：兩個 plane 不衝突。
- 但 SD 比 Architect 更強調 OpenAPI **tag 分離**（[sd-S-1]）與 **error model 補一條**（[sd-S-4]）— Architect critique 沒提這兩條，是補充而非衝突。

---

## ⚠️ 跨 persona 衝突點（已記錄）

| 議題 | 衝突 | 處理 |
|:-----|:-----|:-----|
| ADR-0009 是否需要拆解 / supersede | Architect 與 SD 一致：不需要 supersede，PARTIAL annotation 即可 | 無實質衝突，conflicts_count = 0，不升 Lane B |
| `AdminAPIClient` retry policy 是 const 還是 config | Architect 主張改 config (ADR-0067 治理)；SD 中立 | 採 Architect 建議，list 在 follow-up F2 |

`conflicts_count = 0` → **不升 Lane B**，Lane A standard 流程結束。

---

## 🎯 必補 4 個 annotation（cascade work）

| # | Annotation | 來源 persona | 改 ADR 動作 |
|:--|:-----------|:-------------|:-----------|
| 1 | **Plane 分離聲明**：§2 補一段明文「本 ADR 只處理業務事件寫入，不處理 config plane（見 ADR-0067）」 | Architect [arch-S-1] | 加 1 段約 50 字 |
| 2 | **§1.2 ASCII 圖加第三層** M18 Config Plane（或加 cross-ref ADR-0067 圖） | Architect [arch-S-2] | 重繪 ASCII 圖 |
| 3 | **§6 fail-soft 段補 config Read API 也需 fail-soft + last-known-good snapshot** | Architect [arch-S-3] | 加 1 段約 80 字 |
| 4 | **§8 D 列補**：業務 unique key 不含 `config_version`，但 row 必須 persist `config_version_applied` | SD [sd-S-2] | 加 1 句 |

---

## 🎯 Follow-up Actions

| # | Action | Owner | Priority | Depends |
|:--|:-------|:------|:---------|:--------|
| F1 | 改寫 ADR-0009 為 v1.1：加 4 個 annotation（§2 plane 聲明 / §1.2 圖 / §6 fail-soft / §8 D unique key）；frontmatter 加 `status: still_valid_partial_update` + `reviewed_against: 2026-05-20 final spec + ADR-0067` + `module_scope: M18 / A11 boundary` + `related_adrs: [ADR-0067]` | `devteam-arch` | P0 | (本 review) |
| F2 | OpenAPI 主檔為 ADR-0009 4 個 `create*` 加 tags：`AgentBridge, DomainWrite`；同時為 ADR-0067 Config Read API 加 tags：`M18, Config` | `devteam-design` | P1 | A2 ADR-100 finalize |
| F3 | OpenAPI error model 補 `503 ConfigUnavailable`（SD [sd-S-4]） | `devteam-design` | P1 | F2 |
| F4 | 新 ADR / FR：`AdminAPIClient` 的 retry policy（次數 / backoff / timeout / Idempotency-Key TTL）改為 runtime config，吃 ADR-0067 治理 | `devteam-arch` + `devteam-design` | P2 | ADR-0067 implementation |
| F5 | M20 AI Ops governance ADR：SOP draft → active SOP 的 approval workflow（呼應 BR-M20-01 + ADR-0009 §8 F-017）— 不在 ADR-0009 內補，獨立 ADR | `devteam-arch` | P2 | M20 spec maturity |
| F6 | ADR-100 §1 條目更新：ADR-0009 行 `Initial Classification` 由 `REVIEW_REQUIRED` 改為 `STILL_VALID (PARTIAL annotation)`；`Critique Status` 由 `⏳ pending` 改為 `✅ 2026-05-28 done`；`結論` 由 `—` 改為 `STILL_VALID + 4 annotation` | `devteam-arch` | P0 | F1 |

---

## 📊 Confidence

- **Verdict confidence**: **HIGH** (2/2 persona 共識，論證互補，無對立)
- **判定依據對應 KB-04 §「仍 valid」criteria**：
  - **V1 ✅ 架構/技術選型基底未變**：HTTP call pattern + 4 個 `create*` endpoint contract 不被 M18 動到
  - **V2 ✅ 新規格未蓋過 ADR scope**：M18 是 config plane（policy），ADR-0009 是 domain event plane（business write），**正交**
  - **V3 ✅ Decision 仍適用**：§6 Option D 推薦理由 5 個 driver 在新 spec 下全成立
- **三條 C1+C2+C3 supersede criteria 是否滿足**：
  - **C1 直接衝突**：❌ no — ADR-0067 沒講 agent → admin event write，反之亦然
  - **C2 同一 scope**：❌ no — 不同 plane（config vs domain event）
  - **C3 無共存路徑**：❌ no — 兩者明顯共存且互補
  - **結論**：**不符合 SUPERSEDE 條件**
- **PARTIAL annotation 必要性**：HIGH（4 個 annotation 是讀者 disambiguation + future-proofing，不是改決策）
- **無需 Round 2 / 升級 Lane B / 升級業主**：證據充分，conflicts_count = 0

---

## 🔗 Drill-down

- ADR 原檔：`docs/architecture/adr/ADR-0009-agent-admin-bridge-pattern.md`
- 新 spec 對照：`docs/_source/01-workorder-erp.md` §M18 (L1318-1347) + §M20 (L1369-1387)
- ADR-0067（M18 治理）：`docs/architecture/adr/ADR-0067-m18-runtime-config-governance.md`
- ADR-100 索引：`docs/architecture/adr/ADR-0100-legacy-adr-supersede-index.md` §1 Group A
- KB 規則：
  - [`KB-04 §ADR Supersede Chain`](../../../devteam_knowledge_base/04_freeze_gates.md) §判定三類 / §「已覆寫」criteria / §「仍 valid」criteria
  - [`KB-13 §2 ADR Supersede 判定樹`](../../../devteam_knowledge_base/13_doc_migration_playbook.md) / §8 邊界 criteria
- Cascade context：`.claude/context/devteam/cascade-2026-05-28-context-pack.md` §1.1 D2 + 業主 Q4=C

> 本次 critique 為 **A2.4 task 6 條 REVIEW_REQUIRED 的第 2 條（ADR-0050 已完成為第 1 條）**。
> 餘 4 條（ADR-0008 / 0039 / 0040 / 0044）流程相同，下個 session 推進。
