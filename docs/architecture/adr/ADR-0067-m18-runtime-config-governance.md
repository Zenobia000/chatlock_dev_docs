# ADR-0067 — M18 Runtime Configuration Governance

> **📋 Status**: ✅ Accepted (2026-05-27 roundtable + 2026-05-27 業主裁決)
> **🗓 Date**: 2026-05-27
> **👤 Owner**: `devteam-arch` (Architect persona)
> **🔖 Version**: v1
> **🎯 Scope**: cross-cutting (M18 → 所有讀 config 的 module)
> **🏷 Tags**: configuration, governance, runtime, rollout, audit, m18
> **🔗 Feature**: workorder-erp-final-spec-2026-05-20
> **🔗 Related KB**: [[06_quality_attributes_catalog]] §1 9 維度 · [[10_resilience_patterns]] §3 rollout · [[13_doc_migration_playbook]] §5 · [[11_data_and_stack_catalog]] §1 data classification
> **🔗 Source spec**: [`docs/_source/01-workorder-erp.md`](../../_source/01-workorder-erp.md) §M18 System Admin
> **🔗 Roundtable**: [`.claude/context/devteam/meetings/2026-05-27-1130-final-spec-migration-strategy/MoM.md`](../../../.claude/context/devteam/meetings/2026-05-27-1130-final-spec-migration-strategy/MoM.md) D6

---

## 📋 Executive Summary

> [!TIP]
> **TL;DR (30s)**: 新 final spec (2026-05-20) 引入 **M18 System Setup, Master Configuration & IT Ops** — 把過去 hard-coded 的金額、比例、threshold、SLA、approval level、template、reason code 全部下放成 **runtime config**，業主可在 admin UI 自助維護。為了不讓 ops 自助變成 prod 即時崩塌，本 ADR 規定 M18 必須具備五件事：**(1) schema validation 前置**、**(2) 版本化 + audit**、**(3) staged rollout（canary 10% → 50% → 100%）**、**(4) rollback window（≥ 24h 保留前版可一鍵回退）**、**(5) cache / TTL + invalidation broadcast**。本 ADR 為 **Phase 0 critical path blocker** —— Phase I MVP 不能在缺這套治理的地基上跑。

| 維度 | 摘要 |
|:---|:---|
| **🎯 Decision** | Option C: Runtime config with full governance |
| **🤔 Why** | M18 是新規格獨有 cross-cutting plane；blast radius 涵蓋所有讀者模組；不先 freeze 治理機制，Phase I 上線就在不穩地基跑 |
| **🚀 Status** | ✅ Accepted |
| **📊 Reversibility** | 不可逆（架構約束 + 跨模組 contract） |
| **🎯 下一步** | NFR matrix 補 3 條（A4） / 跨 M18 邊界 anti-corruption ADR / Phase 0 系統設定主檔 schema |

---

## 🎯 Context

- **觸發此決策的情境**：2026-05-20 final spec 引入 M18 模組，明文要求「金額、比例、threshold、approval level、template、reason code 必須 configurable」（見 [`docs/_source/01-workorder-erp.md`](../../_source/01-workorder-erp.md) §00 使用說明 規則原則段、§M18 System Admin）。Roundtable 2026-05-27 Architect 龍蝦在 Round 2 提出 [INSIGHT]：M18 變 runtime config 平面後多一個 failure mode — config corruption / mis-config 的 blast radius 涵蓋所有讀者模組，PM 與 SA 一致同意納入 Phase 0 critical path。
- **業務限制**：
  - Phase 0/I/II 可開始 coding，且新 spec 多條 rule 是 configurable（取消費、車馬費、退款分層、approval limit、SLA 數字、template…），不能在 Phase I 就 hard-code
  - 業主 (system-admin / IT-admin) 需要自助修改 config 而不走 dev deploy（過往痛點）
- **技術限制**：
  - 目前 stack 沒有 runtime config plane（過往都在 code 寫死或 env var）
  - 跨模組讀 config 一旦 cache 不一致會出現 split-brain（例：取消費新值 100 元，部分服務還用舊值 80 元）
  - audit 需求高（finance / RBAC 涉及合規）
- **相關 NFR**：
  - **Availability**：config 改動不能造成 prod outage；read path P99 ≤ 50ms（從 cache 取）
  - **Auditability**：每筆 config change 需 who / when / what diff / why；GDPR-friendly 保留期 ≥ 7 年（與 voucher-retention 對齊 ADR-VCH-002）
  - **Operability**：rollback ≤ 1 min；staged rollout 每段 ≥ 10 min observation
  - **Correctness**：所有讀者必須使用同一個 config version 處理同一筆業務（quote 用 v3 算金額，付款也必須用 v3 不能用 v4）

---

## 📐 Decision Drivers

| Priority | Driver | Weight | Reference |
|:---:|:---|:---|:---|
| 1 | Operability — 業主自助、ops policy 隨時改 | high | [[06_quality_attributes_catalog]] §1.7 |
| 2 | Reliability — 改 config 不能炸全系統 | high | [[06_quality_attributes_catalog]] §1.1 · [[10_resilience_patterns]] §3 |
| 3 | Auditability — finance / RBAC 合規 | high | [[11_data_and_stack_catalog]] §1-§3 |
| 4 | Reversibility — rollback 是基本能力 | high | [[10_resilience_patterns]] §4 RTO/RPO |
| 5 | Time-to-market — Phase 0 critical path | medium | roundtable D6 |

---

## 🔍 Options Considered

### Option A — Code-deploy only (current baseline)

所有 config 改動走 dev → PR → review → deploy 流程。沒有 runtime plane。

| 維度 | 內容 |
|:---|:---|
| **Pros** | • 簡單，沒有額外治理機制<br>• git 即 audit trail<br>• 不會有 cache 一致性問題 |
| **Cons** | • 業主每改一個金額都要等 deploy（過往痛點）<br>• 違反新 spec 「configurable」原則<br>• 緊急修改（如 SLA 突發狀況）週期太長<br>• System Admin 角色變橡皮圖章 |
| **Fit** | 早期 startup、團隊全棧、無 ops 自助需求 |
| **Anti-fit** | 多 stakeholder ops 需求、新 spec 明示 configurable |
| **Cost / Effort** | S（不做事就行） |

### Option B — Runtime config without governance (anti-pattern)

開個 admin UI 讓業主直接改 DB，改完即時生效。沒 validation / 沒 staged rollout / 沒 rollback。

| 維度 | 內容 |
|:---|:---|
| **Pros** | • 業主自助、立即生效<br>• 工程成本最低 |
| **Cons** | • mis-config 立即炸 prod（如把退款上限打 1000 倍）<br>• 沒 audit 法規不過<br>• 無法 rollback、無 staged rollout<br>• cache 不一致導致 split-brain<br>• 不符合新 spec「approval / 生效日」要求 |
| **Fit** | （無 — 是 anti-pattern） |
| **Anti-fit** | 任何 prod 系統 |
| **Cost / Effort** | S（但 cost of failure = ∞） |

### Option C — Runtime config with full governance (Recommended ✅)

完整治理：validation schema + 版本化 + staged rollout + rollback window + cache/TTL + audit。

| 維度 | 內容 |
|:---|:---|
| **Pros** | • 業主自助但有 guardrail<br>• validation 擋 mis-config<br>• staged rollout 限制 blast radius（canary 10% 出問題影響 < 全量）<br>• rollback ≤ 1 min<br>• audit 完整滿足合規<br>• cache invalidation broadcast 維持 split-brain 不發生<br>• 符合新 spec「approval / 生效日」要求 |
| **Cons** | • 工程成本 M（schema 設計、staged rollout 機制、cache invalidation 邏輯）<br>• 學習成本（業主需理解 staged rollout）<br>• Phase 0 必須先做才能解鎖 Phase I |
| **Fit** | 多 ops / 多 stakeholder / 合規需求高 / 新 spec configurable |
| **Anti-fit** | 早期 prototype、單人團隊 |
| **Cost / Effort** | M（一次性投入，攤提到後續所有模組） |

---

## ✅ Decision

> [!IMPORTANT]
> **選擇**: **Option C — Runtime config with full governance**
>
> **理由**：
> 1. 新 spec §M18 明文要求 user-maintained configuration layer，Option A (code-deploy) 違反 spec
> 2. Option B 沒治理在 prod 上是高機率事故源（mis-config 立即炸 = unavoidable disaster）
> 3. Phase 0 投入一次治理機制，Phase I 起所有 module 受益 — ROI 高
> 4. 對應 [[06_quality_attributes_catalog]] §1 9 維度的 Operability + Reliability + Auditability 三高權重 driver

### 五個治理組件規格

| # | 組件 | 規格 |
|:--|:-----|:-----|
| **1** | **Schema validation** | 每個 config key 必須先定義 JSON schema（type / range / enum / regex / required）；admin UI submit 時前端 + 後端雙驗；validation 失敗在 admin UI 顯示具體錯訊，**永不寫入 DB** |
| **2** | **Versioning + audit** | 每次 commit 產 `config_version: N+1`，含 `changed_by` / `changed_at` / `diff` / `reason`；全量留存 ≥ 7 年（與 [`ADR-VCH-002`](ADR-VCH-002-voucher-retention-7y.md) 對齊）；查詢 API 可取任意 version |
| **3** | **Staged rollout** | 三段：canary 10% (≥ 10 min) → ramp 50% (≥ 10 min) → full 100%；每段卡 SLO 監控（error rate / P99 latency）；超出 baseline 自動 halt + alert |
| **4** | **Rollback window** | 前一個 active version 保留 ≥ 24h；admin UI 提供「一鍵回退」按鈕，rollback 也走 staged rollout 機制（先 10% 回退驗證） |
| **5** | **Cache / TTL + invalidation broadcast** | 讀者使用 in-process cache (TTL 30s default) + pub/sub invalidation channel；config 更新時 publisher broadcast invalidation，所有讀者收到後立即重 fetch；同一筆業務交易必須在交易開始時 snapshot `config_version`，後續所有計算使用同一 version（**不能在交易中途切換**） |

### 跨 M18 邊界的 anti-corruption layer

所有模組讀 config 走 M18 Config Read API（不直接讀 DB），目的：
- 統一 cache 行為
- 統一版本快照
- M18 內部可改實作不影響讀者
- audit hook 集中

### 範疇

| 範疇 | 說明 |
|:---|:---|
| **✅ 適用範圍** | 所有 user-maintained config：金額（取消費、車馬費、檢測費）、比例（commission、refund）、threshold（approval limit）、SLA 數字、reason code、template（通知、發票、簽核）、角色權限矩陣、status 代碼 |
| **❌ 不適用** | (1) Infrastructure 設定（DB connection string、API key、URL）→ 走 env var / secret manager；(2) Code-level 常數（如 enum 定義、UI 顏色）→ 走 code；(3) 用戶資料（customer / WorkOrder / evidence）→ 走 domain DB |
| **🔓 可逆性** | 不可逆 — 一旦其他模組依賴 M18 Config Read API，撤銷會 break 所有 caller |

---

## 📊 Consequences

### ✅ Positive

- 業主可自助修改 ops policy 而不需 dev deploy（解決過往痛點）
- 符合新 spec「configurable」原則
- staged rollout 限制 mis-config blast radius（10% canary → 90% 用戶不受影響）
- rollback ≤ 1 min 滿足 [[10_resilience_patterns]] §4 RTO
- 完整 audit trail 滿足合規（finance / RBAC / GDPR）
- cache invalidation broadcast 避免 split-brain
- snapshot `config_version` per 交易 保證「同筆業務同一規則」
- 一次性投入後 Phase I/II/III 所有 module 受益

### ⚠️ Negative

> [!WARNING]
> 必須明列 trade-off。

- **工程成本 M**：schema 設計、staged rollout 機制、cache invalidation 邏輯、admin UI 流程都需從零做起 — Phase 0 必須吃下這個成本
  - **Mitigation**：複用既有 RBAC 與 audit 框架；staged rollout 機制可借鑑 [[10_resilience_patterns]] §3 canary 模式
- **學習成本**：業主需理解 staged rollout 三段流程，無法「按下就全量生效」
  - **Mitigation**：admin UI 預設 staged rollout，提供「強制全量」escape hatch（需 IT-admin 雙簽 + audit log highlight）
- **Cache coherence 複雜度**：pub/sub broadcast 失敗時的 fallback 邏輯（TTL 30s 是兜底）
  - **Mitigation**：監控 invalidation lag P99；超過 5s 觸發 alert
- **`config_version` snapshot 在長交易中佔記憶體**：如月結批次跑 1h，snapshot 不能釋放
  - **Mitigation**：snapshot 只存 hash 不存內容；需要時用 hash 從 versioned store 重 fetch
- **Phase I 時程 +1~2 週**：Phase 0 critical path 多一條 ADR + 實作
  - **Mitigation**：併行：M18 治理機制與其他 Phase 0 設定主檔可並行開發，預計不延後 Phase I 啟動

### 🎯 Follow-up Work

| Action | Owner | Due | Reference |
|:---|:---|:---|:---|
| 在 NFR matrix 補三條：config change SLA、rollback path、validation 前置 | `devteam-arch` | 2026-05-29 | A4 (但 NFR 部分由本 ADR follow up，非業主 Q4 那個 A4) |
| 寫跨 M18 邊界 anti-corruption ADR（Config Read API spec） | `devteam-arch` | 2026-06-05 | new ADR |
| 設計 staged rollout 監控指標 (SLI/SLO baseline) | `devteam-arch` + `devteam-sre` | 2026-06-10 | [[09_observability_catalog]] §6 burn rate alert |
| Phase 0 系統設定主檔 JSON schema 設計 | `devteam-design` | 2026-06-10 | [[08_api_design_catalog]] §5 |
| Runbook：M18 config rollback SOP | `devteam-ops` | 2026-06-15 | `docs/ops/runbook-smart-lock-saas.md` cascade |

### 📉 影響的下游文件

| Doc | Impact |
|:---|:---|
| `docs/architecture/nfr-matrix-smart-lock-saas.md` | **新增三條 NFR**（config change SLA / rollback path / validation 前置） |
| `docs/architecture/api/openapi.yaml` | **新增 Config Read API 規格**（GET /m18/config/{key}?version=N） |
| `docs/architecture/data/erd.md` | **新增 config_versions table + audit log table** |
| `docs/ops/runbook-smart-lock-saas.md` | **新增 M18 config 改動 SOP + rollback playbook** |
| `docs/qa/test-plan-smart-lock-saas.md` | **新增 config staged rollout regression test + mis-config scenario test** |
| `docs/analysis/fr/` | 新增 FR-26+：M18 admin UI / config change workflow / 一鍵 rollback（A3 cascade） |
| 所有讀 config 的 module 模組 ADR | 標 `depends_on: ADR-0067`，禁直接讀 config DB |

---

## 🔗 Links

| Asset | Path |
|:---|:---|
| **Source Spec** | [`docs/_source/01-workorder-erp.md`](../../_source/01-workorder-erp.md) §M18 |
| **Related PRD** | [`docs/prd/smart-lock-saas.md`](../../prd/smart-lock-saas.md) (待 cascade A4) |
| **Roundtable MoM** | [`.claude/context/devteam/meetings/2026-05-27-1130-final-spec-migration-strategy/MoM.md`](../../../.claude/context/devteam/meetings/2026-05-27-1130-final-spec-migration-strategy/MoM.md) D6 |
| **KB references** | [[06_quality_attributes_catalog]] · [[10_resilience_patterns]] §3-4 · [[13_doc_migration_playbook]] §5 · [[11_data_and_stack_catalog]] §1-3 |
| **Related ADRs** | [`ADR-VCH-002`](ADR-VCH-002-voucher-retention-7y.md) (audit retention 7y 對齊) · [`ADR-0042`](ADR-0042-rbac-four-tier-principle.md) (RBAC for admin UI) · [`ADR-0061`](ADR-0061-data-governance-service-boundary.md) (跨 module data boundary) |

---

## 🔍 Drill-down (optional)

<details>
  <summary>Click for full deliberation context, alternative discussions, and references</summary>

  ### Deliberation context

  - **Roundtable**: 2026-05-27 11:30~11:52，PM 龍蝦 + Architect 龍蝦 + Analyst (SA) 龍蝦
  - **Key argument 1 (PM R1)**: M18 整層 user-maintained config 是新規格獨有，會不會把 NFR / boundary 整個翻一遍？
  - **Architect R2 answer**: 會。M18 從 code-deploy 移到 runtime config，blast radius 從「改 code 全測」變「改設定即時生效」，NFR 要新增三條（config change SLA / rollback path / validation 前置）。Boundary 上 M18 變 cross-cutting，所有模組讀 config 都跨 M18 邊界 → 補 anti-corruption + cache/TTL 策略，不然 read amplification 失控。
  - **Architect R2 INSIGHT**: M18 變 runtime config 平面後多一個 failure mode（config corruption blast radius）→ Phase 0 必須 freeze 一條 ADR「config change 治理」
  - **PM R2 confirm**: 納入 Phase 0 critical path。M18 是新規格獨有 cross-cutting plane，不先 freeze config 治理 ADR，Phase I MVP 一上線就在不穩地基跑，rollback 成本未來指數爆炸。

  ### Alternatives discussed but rejected early

  - **Option D — Git-ops config via PR**: 業主自助 PR 改 config repo，CI 自動 deploy。Rejected：業主非 dev、不會 PR、且 staged rollout 機制需另做 — 不解決 Option A 痛點
  - **Option E — Feature flag 服務（LaunchDarkly 等 SaaS）**: 不適合 — feature flag 服務是 boolean / multivariate flag 為主，不擅長存複雜 schema 的 ops policy（金額表、template body、權限矩陣）

  ### Detailed cost analysis

  | Component | Effort | Notes |
  |:----------|:-------|:------|
  | JSON schema validation | S | 用 ajv / pydantic |
  | Versioning + audit DB schema | S | 借鑑 [`ADR-VCH-002`](ADR-VCH-002-voucher-retention-7y.md) retention 模式 |
  | Staged rollout mechanism | M | canary % 由 ingress / app-level switch 實作 |
  | Cache + invalidation broadcast | M | Redis pub/sub 或 NATS |
  | Admin UI | M | 與既有 M18 admin UI 整合 |
  | `config_version` snapshot per 交易 | S | trace context 帶版本號 |
</details>

---

## ✍️ Sign-off

- [ ] **Architect** (owner): `devteam-arch-persona` (Round 1 + Round 2 同意) / Date: 2026-05-27
- [ ] **Tech Lead**: ____________ / Date: ____________
- [ ] **PM** (cross-functional): `devteam-pm-persona` (Round 2 收尾同意) / Date: 2026-05-27
- [ ] **業主**: ✅ 透過 roundtable Open Questions 全採納建議 / Date: 2026-05-27

---

**End of ADR-0067**

> 給業主：你主要要看的是 **📋 Executive Summary** + **✅ Decision §五個治理組件規格** + **⚠️ Negative consequences** 三段。
> Phase 0 不做這份 ADR 就 coding Phase I = 在不穩地基蓋樓。
