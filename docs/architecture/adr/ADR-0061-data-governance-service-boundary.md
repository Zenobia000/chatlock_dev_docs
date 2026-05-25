---
id: ADR-0061
title: Data Governance Service (DGS) Boundary — Independent Service
status: accepted
date: 2026-05-22
updated: 2026-05-24
deciders: [CEO (autonomous), ba, dba, arch]
supersedes: []
related: [ADR-0030, ADR-0042, ADR-0050, ADR-0051, ADR-0057, ADR-PII-002]
source: Forum F-04 final-report + MoM #1 (OQ-NEW-1 業主裁決)
---

# ADR-0061: Data Governance Service (DGS) Boundary — Independent Service

## v2 Update Note (2026-05-24)

業主裁決 OQ-NEW-1「家族覆核先不考慮」+ 採 Option A 降級履約 cascade：
- **OPA Rego BR-PII-001a status = dormant** — rule 留著但 policy bundle 不部署（合約 §4.4(d) 法源從同步阻擋改 retrospective event log，BR-PII-001a 的 trigger 不會觸發）
- **新增 schema CHECK constraint**：擋 reserved 欄位寫入（防 data minimization 違規）
- **新增 CI lint gate**：dormant rule 嘗試啟用需 ADR change
- **連動新 ADR-PII-002**：資料極小化以 schema 約束 + CI gate 雙層防線
- **連動 BR-AUDIT-007**：Family Reviewer event log 三要件（append-only + hash chain + 7 日 dispute window）

詳見 MoM #1：`.claude/context/devteam/meetings/2026-05-24-1430-oq-cascade-review/MoM.md` D9 Option A

---

# ADR-0061: Data Governance Service (DGS) Boundary — Independent Service (原文)

## Context

Lane B Forum F-04 收斂：PII retention（FR-NEW-1）+ Evidence visibility matrix（FR-NEW-6）+ GDPR forget + legal-hold 必須 single source of truth。

**Trade-off frame**（三選一）：
- **A 全集中（mutation + read 都過 DGS）** — single writer + audit 一致，但 read 路徑加 latency + DGS 單點瓶頸
- **B 全分層（per-service 自管）** — 無瓶頸但優先序散落 4 處，race condition + audit 不一致
- **C Hybrid（mutation 集中 / read 分層 + 雙軌 cache）** — mutation single writer 保住 audit；read 路徑保 latency

選 **C**。DGS boundary 設為**獨立 service**（不是 admin-panel module）— 合規 audit 獨立性 + 法務 sign-off artifact 獨立 release 為核心 trade-off。

## Decision

### 1. DGS = Independent Service

- 獨立 GCP Cloud Run service，SLA / SLO 99.95% Availability
- 跨網路 mutation hop（+50ms latency，acceptable for mutation path；read 不過 DGS 故不退化）
- 獨立 deploy → 合規 audit 獨立性 / 法務簽核 artifact 獨立 release
- **Reversibility note**：從 service 退回 admin-panel module 成本 ~2 sprint，bounded context 不會被 coupling 鎖死

### 2. BR-PII-001 → OPA Rego Policy Artifact

- **Repo path**：`docs/policy/br-pii-001.rego`
- **CODEOWNERS**：`@legal @dpo` 必簽 PR
- **DGS 啟動 hash-check** + `policy_version_id` 入 audit
- **OPA decision log** 同 audit stream
- 4 子規則（priority 由高至低）：
  - `BR-PII-001a` legal-hold 永久不可逆 — 合約 4.4(d)
  - `BR-PII-001b` GDPR forget 7d，例外：legal-hold 已生效則拒絕並 customer notice — GDPR Art.17
  - `BR-PII-001c` retention default（1y / RMA+3y / eternal）— 個資法 §11
  - `BR-PII-001d` visibility filter 在 read 路徑且 fail-closed — 個資法 §27

### 3. Three-layer Fail-closed Semantics

| Path | 條件 | 行為 |
|:---|:---|:---|
| Mutation | purge / forget / legal-hold flip | **full deny**（DGS down → 全停）|
| Read | flagged item（legal-hold / forget pending）| **full deny**（fail-closed）|
| Read | unflagged item | **last-known-good + `X-Policy-Cache-Stale: true` header**（degraded but available）|

### 4. Dual-track Snapshot Cache

| Cache Track | TTL / Mechanism | Use |
|:---|:---|:---|
| Retention / Visibility rules | 60s TTL OK | 一般 read |
| Legal-hold / GDPR forget | push-based invalidation ≤ 5s + read-time DGS tombstone check（hot path for flagged items only）| 合規關鍵 |

### 5. Two-phase Purge with Crypto-shred

- **Phase-1（T0）**：write `purged_at` + soft-delete + crypto-shred per-tenant DEK（KMS envelope encryption）
- **Phase-2（T+30d）**：hard-delete row
- 中間期 row 存在但 PII 不可解密 → fail-closed
- DEK rotation：90d（KMS schedule）

### 6. Cron = Scanner / DGS = Sole Executor

- Cron 不可直接 `DELETE` — 只能 scan candidates + enqueue `purge_request(evidence_id, reason=retention_expired)`
- DGS 套 BR-PII-001 決策樹（再次檢查 legal_hold flip）後執行 + 寫 audit
- Advisory lock + 5-min idempotency 防重入

### 7. Transactional Outbox

- DGS purge / forget API 同 DB tx 寫 `purge_event` + 更新 `evidence.state`
- Outbox poller 推 invalidation bus（at-least-once）
- DLQ + replay 機制
- SLO：bus lag p99 ≤ 30s / p99.9 ≤ 2min

### 8. Schema / Partition Design（DBA 領域；見 ERD）

簡述：`legal_hold` = column；Partition by `retention_class`；partial index on cron predicate；batched migration with down script。

### 9. Read-side Access Log + Customer Notice

- snapshot client + DGS 雙路徑 read log 入同 audit stream
- 欄位：`actor_role / evidence_id / policy_version_id / decision`
- 個資法 §12（事故通報）可 query
- GDPR forget × legal-hold 衝突 → 平台 7d 內 customer notice（Art.12(3)）+ 解除預計時間

### 10. Observability SLIs

4 條進 P5 Runbook:
- `snapshot_staleness_p99_seconds`
- `dgs_invalidation_lag_p99_seconds`
- `dgs_mutation_queue_depth`
- `outbox_lag_p99_seconds`

### 11. Circuit Breaker / Backpressure（失敗模式緩解）

- DGS down → cron retention 自動 pause + token bucket recovery
- recovery storm 防止：DGS queue depth > N 時拒收新 enqueue（fail-closed）

## Consequences

### 正面
- 合規 single source of truth + audit 獨立性
- BR-PII-001 法務直接簽 Rego artifact（程式碼以外可簽的 boundary）
- mutation single writer invariant，無 race
- two-phase purge 滿足 GDPR Art.17 可審
- read 路徑不過 DGS，latency 不退化

### 負面（trade-off cost）
- DGS 為 mutation 單點（blast radius 限縮，但仍是單點）；已被 outbox + circuit breaker + reversibility 緩解
- 跨 service hop 增 ops 成本（SLO 99.95 + on-call）
- 需新 ops 角色或併入既有 SRE

### 中性
- Hybrid 演進路徑：從 C 退到 A（全集中）或 B（全分層）成本量化 ~2 sprint

## NFR 達成

- NFR-Comp-001/002/003（合約 4.4 + SOW 2.1(4) compliance）
- NFR-Priv-001~008（PII 整套）
- NFR-Aud-001~006（audit chain）
- NFR-Avail-003（99.95% DGS SLO）

## Failure Modes

| Mode | Blast Radius | Mitigation |
|:---|:---|:---|
| DGS down | mutation 全停（read 用 cache 繼續）| circuit breaker + cron pause + token bucket |
| Snapshot cache stale on legal-hold | BR-PII-001 違反 = §9 終止 risk | flagged item full deny + push invalidation ≤ 5s |
| Outbox lag > 2min | invalidation 不一致 | incident + fail-closed read flagged |
| Cron DELETE 繞過 DGS | audit 真空 | RLS policy + scanner-only role |
| DEK rotation 失敗 | crypto-shred 無效 | 90d rotation SLA + KMS monitoring |

## Acceptance Criteria

- ✅ OPA Rego artifact in `docs/policy/br-pii-001.rego` + CODEOWNERS @legal @dpo
- ✅ DGS service deployed 獨立 + SLO 99.95% monitored
- ✅ Two-phase purge audit ledger + hash chain
- ✅ Transactional outbox + DLQ + replay tested
- ✅ Snapshot cache dual-track（60s vs ≤5s push）measured
- ✅ Fail-closed 三層 BDD test pass
- ✅ Customer notice 7d SLA tested
- ✅ Cron = scanner + DGS = sole executor enforced（RLS policy）
- ✅ 4 SLIs in Grafana

## Cross References

- Forum F-04 final-report: `.claude/context/devteam/forum/2026-05-22-1800-C04-pii-evidence-enforcement/final-report.md`
- 對應 PRD FR-NEW-1 (v2.1) + FR-NEW-6 (v2.1)
- 連動 ADR-0050（Evidence visibility）update — 三層 fail-closed + read-side log
- 連動 ADR-0051（Evidence retention）update — cron = scanner + crypto-shred + two-phase
- 連動 ADR-0057（RAG）— policy artifact 為 vendor-neutral artifact
