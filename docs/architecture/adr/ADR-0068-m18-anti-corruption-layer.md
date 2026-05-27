# ADR-0068 — M18 Cross-Module Anti-Corruption Layer (Config Read API)

> **📋 Status**: ✅ Accepted (2026-05-28 — ADR-0067 follow-up + ADR-0009 cascade)
> **🗓 Date**: 2026-05-28
> **👤 Owner**: `devteam-arch` (Architect persona)
> **🔖 Version**: v1
> **🎯 Scope**: cross-cutting — M18 ↔ all config-reading modules
> **🏷 Tags**: anti-corruption, m18, config-read-api, boundary, governance, follow-up-0067
> **🔗 Related KB**: [[11_data_and_stack_catalog]] §1-3 · [[06_quality_attributes_catalog]] §1.7 Operability · [[13_doc_migration_playbook]] §5
> **🔗 Related ADRs**: [`ADR-0067`](ADR-0067-m18-runtime-config-governance.md) (parent) · [`ADR-0009`](ADR-0009-agent-admin-bridge-pattern.md) (PARTIAL_UPDATE cascade) · [`ADR-0061`](ADR-0061-data-governance-service-boundary.md)

---

## 📋 Executive Summary

> [!TIP]
> **TL;DR (30s)**: ADR-0067 freeze M18 runtime config 治理機制（5 組件），但**所有讀者模組怎麼取 config** 留白。本 ADR 規定統一走 **M18 Config Read API**（不直接 query config DB / 不嵌 config 在其他 service 程式碼）。Anti-corruption layer 三件事：(1) **單一 contract**（GET /m18/config/{key}?version=N）；(2) **強制 config_version 帶入交易**（per-transaction snapshot，per ADR-0067 §Decision 組件 5）；(3) **`X-Config-Version` header 強制 + 409 ConfigVersionMismatch error model**（per ADR-0009 PARTIAL_UPDATE cascade）。Phase 0 critical path 第二條（ADR-0067 是第一條）。

| 維度 | 摘要 |
|:---|:---|
| **🎯 Decision** | 所有跨 M18 邊界的 config 取得，**強制走 M18 Config Read API**，禁止 direct DB query / hard-coded fallback |
| **🤔 Why** | 統一 cache 行為 + 統一版本快照 + audit 集中 + M18 內部可改實作不影響讀者 |
| **🚀 Status** | ✅ Accepted |
| **📊 Reversibility** | 不可逆（一旦讀者 dependency，撤銷會 break 所有 caller） |
| **🎯 下一步** | OpenAPI schema 對齊 / ADR-0009 cascade update / 所有 module 對應 ADR 加 `depends_on: ADR-0068` |

---

## 🎯 Context

- **觸發**：
  - ADR-0067 §Decision 組件 5 規定「同一筆業務交易必須在交易開始時 snapshot `config_version`，後續所有計算使用同一 version」— 但**「怎麼取 config」未定**
  - ADR-0009 Lane A critique (2026-05-28) 結論為 PARTIAL_UPDATE，明指「AdminAPIClient 缺 X-Config-Version header / 缺 409 ConfigVersionMismatch error / Idempotency-Key 未含 config_version」
  - SD critique 指出「error model 未區分 admin-bridge-fail vs config-fetch-fail vs version-mismatch」
- **業務限制**：
  - 多模組（M04 quote / M11 refund / M06 dispatch / M12 settlement / M14 partner / M15 exception / M18 admin）都需讀 config
  - 不可有「某模組偷讀 config DB」的繞道路徑（否則 ADR-0067 治理失效）
- **技術限制**：
  - 過去模組可能已有 hard-coded threshold（需 migrate）
  - 跨服務 latency 預算緊（NFR-Perf-008: read P99 ≤ 50ms cache hit）
- **相關 NFR**：
  - **Latency**: read P99 ≤ 50ms (cache hit) / ≤ 200ms (cache miss)
  - **Availability**: Config Read API ≥ 99.99% (高於 M18 admin UI 99.9%)
  - **Correctness**: config_version snapshot 在交易中不可變
  - **Auditability**: 每次 config read 留 trace (誰 / 何時 / 哪個 version)

---

## 📐 Decision Drivers

| Priority | Driver | Weight | Reference |
|:---:|:---|:---|:---|
| 1 | Boundary integrity — 所有讀者必走同一 contract | high | [[06_quality_attributes_catalog]] §1.7 |
| 2 | Reversibility — M18 內部實作可換 | high | (本 ADR 目的) |
| 3 | Performance — read path 不可成 bottleneck | high | [[09_observability_catalog]] §3 SLI |
| 4 | Auditability — config read 留 trace | medium | [[11_data_and_stack_catalog]] §1-3 |
| 5 | Reliability — config 服務不可用時的 fail-mode | high | [[10_resilience_patterns]] §1 |

---

## 🔍 Options Considered

### Option A — Direct DB Query (anti-pattern, baseline)

每個讀者模組直接 SQL query config 表。

| 維度 | 內容 |
|:---|:---|
| Pros | 簡單、直觀、低 latency |
| Cons | M18 schema 改動會 break 所有讀者；無統一 cache；無統一 audit；違反 ADR-0067 治理；split-brain 風險高 |
| Fit | (無 — anti-pattern) |

### Option B — Shared Library / SDK

讀者透過共用 library 取 config（library 內部 query DB）。

| 維度 | 內容 |
|:---|:---|
| Pros | 統一 cache 邏輯；版本控管集中 |
| Cons | library 更新需 redeploy 所有模組（cascade deploy）；跨語言難（chatbot Python vs admin Node 等）；anti-corruption 不真正生效（library 仍綁 DB schema） |
| Fit | 單一 stack 小團隊 |

### Option C — HTTP API + In-Process Cache (Recommended ✅)

統一 HTTP/gRPC API + 讀者本地 cache (TTL 30s) + pub/sub invalidation broadcast。

| 維度 | 內容 |
|:---|:---|
| Pros | 真 anti-corruption（讀者只知 API contract，不知 DB）；多語言友善；M18 內部可改實作；統一 cache + audit + invalidation broadcast；對齊 ADR-0067 §Decision 組件 5 invalidation 機制 |
| Cons | latency overhead（cache miss 時 ~100ms）；多一個服務需 HA；contract 變更需 versioning |
| Fit | 多模組多語言 + 高合規需求 |
| Cost | M（建 API server + cache + monitoring） |

---

## ✅ Decision

> [!IMPORTANT]
> **選擇**: **Option C — HTTP API + In-Process Cache + Invalidation Broadcast**

### Contract 規格

```
GET /m18/config/{key}
GET /m18/config/{key}?version=N           # 指定 version (snapshot 用)
GET /m18/config/batch?keys=k1,k2,k3       # batch read

Headers:
  X-Config-Version: <integer>             # 強制；client 帶當前已知 version
  X-Tenant-Id: <string>                   # 強制；per ADR-0030
  X-Trace-Id: <string>                    # OTel trace

Response 200:
  {
    "key": "cancellation.tier.threshold.tier_a",
    "value": 50,
    "version": 17,
    "effective_at": "2026-05-28T00:00:00Z",
    "schema_id": "fee-percent-v1"
  }

Response 409 ConfigVersionMismatch:
  client 帶的 X-Config-Version 與 server active version 不一致時回傳。
  body 含 server active version，client 決定：
    (a) 走 fail-closed (retry 帶 new version) — 推薦
    (b) 維持原 snapshot (per-transaction snapshot 場景)

Response 404 ConfigKeyNotFound:
  Schema-defined key 不存在或未 publish；不可 fallback 預設值（避免 silent corruption）

Response 503 ConfigServiceUnavailable:
  M18 config service 不可用；caller 依 §Failure Modes 處理
```

### Per-Transaction Snapshot 機制（per ADR-0067 §Decision 組件 5）

交易起點：
1. Caller 取 active version：`GET /m18/config/_meta/active_version` → 得 `v=N`
2. 交易內所有 config read 都帶 `?version=N` query param
3. M18 回傳 v=N 對應的 config value（即使 active 已是 v=N+1）
4. 交易結束 commit / abort 後，下一個交易重取 active version

### Fail-Mode Policy

| 場景 | 行為 | 理由 |
|:-----|:-----|:-----|
| Cache hit | 立即回傳 cached value | 0 latency |
| Cache miss + service available | 呼叫 API + cache 結果 | 正常路徑 |
| Cache miss + service 5xx | **fail-closed**（caller 拒絕該操作） | **禁止 fallback 預設值或舊 cache**，避免 silent corruption |
| Cache hit + 收到 invalidation broadcast | 重 fetch active version | TTL 不等到期 |
| Cache hit + 超 TTL 30s | 重 fetch active version (lazy refresh) | 兜底 |
| X-Config-Version mismatch on write path | 回 409，caller 重整 snapshot or abort 交易 | per ADR-0009 PARTIAL_UPDATE |

### 範疇

| 範疇 | 說明 |
|:---|:---|
| **✅ 適用** | 所有 user-maintained config (per ADR-0067 §適用)：金額 / 比例 / threshold / SLA 數字 / template / reason code / 角色權限矩陣 / status 代碼 |
| **❌ 不適用** | (1) Infrastructure (env var / secret) → secret manager；(2) Code-level enum / 顏色；(3) Domain data (customer / WO / evidence) |
| **🔓 可逆性** | 不可逆 — 一旦讀者 dependency 建立，撤銷會 break 所有 caller |

---

## 📊 Consequences

### ✅ Positive

- 真 anti-corruption — M18 內部 schema / 實作可換不影響讀者
- 統一 cache + invalidation broadcast，避免 split-brain
- 統一 audit trace (誰 / 何時 / 哪個 version)
- 對齊 ADR-0067 §Decision 組件 5 per-transaction snapshot 機制
- 解決 ADR-0009 PARTIAL_UPDATE 的 X-Config-Version + 409 ConfigVersionMismatch 議題
- 多語言友善（chatbot Python / admin Node / ERP backend 都呼叫同 API）

### ⚠️ Negative

> [!WARNING]
> 必須明列 trade-off

- **多一個服務需 HA** — Config Read API 必須 ≥ 99.99%（比 admin UI 99.9% 更高），否則 caller fail-closed 會引發 cascade outage
  - **Mitigation**：read-only API 用 multi-region replica；caller cache TTL 30s 兜底；服務本身 stateless + HPA
- **Latency overhead** — cache miss 時多 ~100ms
  - **Mitigation**：cache hit rate target ≥ 95%；warm-up cache on deploy；critical path 預取 (per FR 起點)
- **Contract versioning 複雜度** — API contract 改變需 backward compat
  - **Mitigation**：URL path versioning `/v1/m18/config/...`；deprecation period ≥ 90d
- **Fail-closed 過嚴** — caller 在 M18 不可用時拒絕操作，可能阻塞業務
  - **Mitigation**：限 P0 critical path 強制 fail-closed（如 refund / quote）；非 critical 可 graceful degrade（如 dashboard 用 last-known cache + 顯眼 stale 警示）
- **Migration 成本** — 既有模組 hard-coded threshold 需 migrate
  - **Mitigation**：Phase 0 列入 migration plan；提供 SDK helper 降低 caller 接入成本

### 🎯 Follow-up Work

| Action | Owner | Due | Reference |
|:---|:---|:---|:---|
| OpenAPI 補完 M18 Config Read API spec | `devteam-design` | 2026-06-05 | 本 ADR §Contract |
| ADR-0009 cascade：補第三類 config-aware bridge + X-Config-Version header | `devteam-arch` | 2026-06-05 | merge report §2 F-09-1 |
| SDK helper (Python / Node) for cache + invalidation | `devteam-design` | 2026-06-15 | [[10_resilience_patterns]] §1 |
| 所有讀 config 的 module ADR 加 `depends_on: ADR-0068` | `devteam-arch` | 2026-06-10 | governance |
| Runbook：M18 Config Read API outage 處理 SOP | `devteam-ops` | 2026-06-15 | [[10_resilience_patterns]] §4 RTO |
| Migration plan：既有 hard-coded threshold 列表 + 改寫順序 | `devteam-pm` | 2026-06-10 | Phase 0 critical path |

### 📉 影響的下游文件

| Doc | Impact |
|:---|:---|
| `docs/architecture/api/openapi.yaml` | **新增 /m18/config/* endpoints + 409 ConfigVersionMismatch error code** |
| `docs/architecture/adr/ADR-0009-*` | **PARTIAL_UPDATE cascade**: §3 補第三類 bridge + §6 AdminAPIClient OpenAPI 補 header + §8 retry 表新增第四列 (fail-closed) |
| `docs/architecture/nfr-matrix-smart-lock-saas.md` | **新 NFR**: Config Read API availability ≥ 99.99% / read P99 ≤ 50ms cache hit |
| `docs/ops/runbook-smart-lock-saas.md` | M18 Config Read 不可用 SOP |
| 所有讀 config FR (FR-0014 refund / FR-0042 quote / FR-0043 admin workflow / FR-0011 payment) | 補 config_version snapshot per transaction 引用 |

---

## 🔗 Links

| Asset | Path |
|:---|:---|
| **Parent ADR** | [`ADR-0067`](ADR-0067-m18-runtime-config-governance.md) (§Decision 組件 5 invalidation 機制) |
| **Cascade ADR** | [`ADR-0009`](ADR-0009-agent-admin-bridge-pattern.md) (PARTIAL_UPDATE per 2026-05-28 critique) |
| **Boundary ADR** | [`ADR-0061`](ADR-0061-data-governance-service-boundary.md) (data governance pattern reuse) |
| **Critique merge report** | [`reviews/2026-05-28-adr-batch-critique/merge-report.md`](../../../.claude/context/devteam/reviews/2026-05-28-adr-batch-critique/merge-report.md) §2 |
| **KB references** | [[11_data_and_stack_catalog]] · [[10_resilience_patterns]] §1 · [[09_observability_catalog]] §3 |

---

## 🔍 Drill-down

<details>
  <summary>Click for cache & invalidation broadcast details</summary>

  ### Cache 策略

  | 屬性 | 值 |
  |:-----|:---|
  | Cache 位置 | in-process (per service instance) |
  | TTL 預設 | 30 秒 |
  | TTL 可調 | per config key (透過 schema annotation `cache_ttl_seconds`) |
  | 失效機制 | (a) TTL expire (lazy)；(b) pub/sub invalidation broadcast (eager) |
  | Snapshot 模式 | per-transaction snapshot 不過 TTL（直到 transaction end） |

  ### Invalidation Broadcast

  - 機制：Redis Pub/Sub 或 NATS (依平台選型)
  - Channel: `m18.config.invalidated`
  - Payload: `{ "key": "...", "old_version": N, "new_version": N+1, "tenant_id": "..." }`
  - Caller 收到 → 立即從 cache 移除該 key → 下次 read 重 fetch
  - Latency target: invalidation 發出 → 99% caller cache cleared ≤ 5s (per ADR-0067 §Negative mitigation)

  ### Performance benchmarks (預期)

  | 操作 | P50 | P99 |
  |:-----|:----|:----|
  | Cache hit | 1ms | 5ms |
  | Cache miss (single key) | 30ms | 100ms |
  | Cache miss (batch 10 keys) | 50ms | 150ms |
  | Invalidation broadcast → all readers cleared | 1s | 5s |
</details>

---

## ✍️ Sign-off

- [ ] **Architect** (owner): `devteam-arch-persona` per ADR-0009 critique cascade / Date: 2026-05-28
- [ ] **Tech Lead**: ____________ / Date: ____________
- [ ] **業主**: per ADR-0067 治理鏈延伸，預計與 ADR-0009 PARTIAL_UPDATE 一同 review / Date: ____________

---

**End of ADR-0068**

> 此 ADR 是 ADR-0067 治理鏈的「實作對齊」— ADR-0067 定義 config 怎麼改；ADR-0068 定義 config 怎麼讀。兩者不可分。
