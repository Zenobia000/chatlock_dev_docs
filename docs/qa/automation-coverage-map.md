---
id: automation-coverage-map
title: Automation Coverage Map — Endpoint × Test Layer Matrix
status: draft
phase: I
gate: 6 (Test Ready)
owner: devteam-qa
date: 2026-05-28
parent_doc: docs/qa/test-plan-smart-lock-saas.md
related_artifacts:
  - docs/architecture/api/openapi-smart-lock-saas.yaml (57 paths)
  - docs/qa/test-data-strategy-smart-lock-saas.md
  - docs/qa/test-plan-cascade-strategy-2026-05-28.md
target_automation_rate: ">= 70%"
target_p0_br_coverage: "100%"
target_p1_br_coverage: ">= 90%"
---

# Automation Coverage Map — Endpoint × Test Layer Matrix

> 對應 Gate 6 Exit Criteria：自動化 ≥ 70%、P0 BR 覆蓋 100%、P1 BR ≥ 90%。
>
> **每個 endpoint 必須至少有**：
> - Contract test（OpenAPI schema 對齊）— **強制**
> - 1 個 unit/integration happy path — **強制**
> - 對應 P0/P1 BR 有 ≥ 1 alt path — **強制 if 涉及 P0**
> - E2E 僅限 main flow（4 條主線）— **selective**

---

## §1 圖例

| 符號 | 意義 |
|:----:|:-----|
| **C** | Contract test（schemathesis / Pact） |
| **U** | Unit test |
| **I** | Integration test (testcontainers) |
| **E** | E2E test (Playwright + BDD) |
| **P** | Performance test (k6) |
| **S** | Security / Chaos test |
| **M** | Manual UAT only (defer automation) |
| `o` | optional / defer Phase II |

---

## §2 Endpoint Coverage Matrix（57 paths）

### §2.1 Identity / RBAC / Tenant（5 endpoints）

| Endpoint | C | U | I | E | P | S | P0 BR | 自動化目標 |
|:---------|:-:|:-:|:-:|:-:|:-:|:-:|:------|:-----------|
| `POST /tenants/{tenantId}/channels` | ✓ | ✓ | ✓ | o | o | ✓ | BR-A03-NN | 80% |
| `PATCH /tenants/{tenantId}/channels/{channelId}/status` | ✓ | ✓ | ✓ | o | o | o | BR-A03-NN | 80% |
| `GET /tenants/{tenantId}/rbac/roles` | ✓ | ✓ | ✓ | o | o | ✓ | BR-M17-01 / FR-0019 | 80% |
| `POST /tenants/{tenantId}/rbac/roles` (RBAC mutate) | ✓ | ✓ | ✓ | o | o | ✓ | FR-0019 + SCD2 audit | 100% |
| `GET /tenants/{tenantId}/audit/events` | ✓ | ✓ | ✓ | o | o | ✓ | BR-AUDIT-007 + ADR-VCH-001 hash | 100% |
| `POST /tenants/{tenantId}/audit/exports` | ✓ | ✓ | ✓ | o | o | ✓ | FR-0020 retention 7yr | 90% |

### §2.2 Customer / Site / Device / Warranty（4 endpoints）

| Endpoint | C | U | I | E | P | S | P0 BR | 自動化目標 |
|:---------|:-:|:-:|:-:|:-:|:-:|:-:|:------|:-----------|
| `POST /tenants/{tenantId}/customers` | ✓ | ✓ | ✓ | o | o | ✓ | PII (ADR-PII-002) | 80% |
| `POST /tenants/{tenantId}/customers/{customerId}/sites` | ✓ | ✓ | ✓ | o | o | o | M02 | 80% |
| `POST /tenants/{tenantId}/sites/{siteId}/devices` | ✓ | ✓ | ✓ | o | o | ✓ | ADR-0053 serial mandatory | 100% |
| `POST /tenants/{tenantId}/devices/{deviceId}/warranty` | ✓ | ✓ | ✓ | ✓ | o | ✓ | BR-WARRANTY-001..007 | 100% |

### §2.3 Brand / Model（2 endpoints）

| Endpoint | C | U | I | E | P | S | 自動化目標 |
|:---------|:-:|:-:|:-:|:-:|:-:|:-:|:-----------|
| `POST /tenants/{tenantId}/brands` | ✓ | ✓ | o | o | o | o | 70% |
| `POST /tenants/{tenantId}/brands/{brandId}/models` | ✓ | ✓ | o | o | o | o | 70% |

### §2.4 Technician + Dispatch + WorkOrder（7 endpoints — P0 main flow）

| Endpoint | C | U | I | E | P | S | P0 BR | 自動化目標 |
|:---------|:-:|:-:|:-:|:-:|:-:|:-:|:------|:-----------|
| `POST /tenants/{tenantId}/technicians` | ✓ | ✓ | ✓ | o | o | o | FR-0044 (P2) | 60% |
| `POST /tenants/{tenantId}/technicians/{techId}:suspend` | ✓ | ✓ | ✓ | o | o | ✓ | BR-CANCEL-007 §weight | 90% |
| `POST /tenants/{tenantId}/dispatch:plan` | ✓ | ✓ | ✓ | ✓ | ✓ | o | FR-0003 (P0) | 100% |
| `POST /tenants/{tenantId}/work-orders/{woId}:assign` | ✓ | ✓ | ✓ | ✓ | o | o | FR-0004 (P0) | 100% |
| `POST /tenants/{tenantId}/work-orders/{woId}:accept` | ✓ | ✓ | ✓ | ✓ | o | o | FR-0005 (P0) | 100% |
| `POST /tenants/{tenantId}/work-orders/{woId}/onsite/arrival` | ✓ | ✓ | ✓ | ✓ | o | o | FR-0016 SLA | 100% |
| `POST /tenants/{tenantId}/work-orders/{woId}/onsite/completion` | ✓ | ✓ | ✓ | ✓ | o | ✓ | FR-0009 + ADR-0032 結案 hard gate | 100% |
| `POST /tenants/{tenantId}/work-orders/{woId}/cancel` | ✓ | ✓ | ✓ | ✓ | o | ✓ | BR-CANCEL-001..008 (P0) | 100% |

### §2.5 Refund / Payment / Settlement（4 endpoints — P0 SoD）

| Endpoint | C | U | I | E | P | S | P0 BR | 自動化目標 |
|:---------|:-:|:-:|:-:|:-:|:-:|:-:|:------|:-----------|
| `POST /tenants/{tenantId}/refunds` (initiate) | ✓ | ✓ | ✓ | ✓ | o | ✓ | BR-REFUND-006 SoD | 100% |
| `PATCH /tenants/{tenantId}/refunds/{refundId}` (approve/execute) | ✓ | ✓ | ✓ | ✓ | o | ✓ | BR-REFUND-001..006 | 100% |
| `POST /tenants/{tenantId}/payments` | ✓ | ✓ | ✓ | o | o | ✓ | FR-0011 (P0) | 90% |
| `POST /tenants/{tenantId}/settlements/monthly` | ✓ | ✓ | ✓ | o | ✓ | ✓ | FR-0012 (P0) | 90% |

### §2.6 Warranty Claim / RMA（1 endpoint + ACL）

| Endpoint | C | U | I | E | P | S | P0 BR | 自動化目標 |
|:---------|:-:|:-:|:-:|:-:|:-:|:-:|:------|:-----------|
| `POST /tenants/{tenantId}/warranty-claims` | ✓ | ✓ | ✓ | ✓ | o | o | BR-WARRANTY-005..007 | 90% |
| `POST /acl/serial-control/lookup` | ✓ | ✓ | ✓ | o | o | o | ADR-0053 + ADR-0068 ACL | 80% |
| `POST /acl/brand-warranty/inquire` | ✓ | ✓ | ✓ | o | o | o | ADR-0068 ACL | 70% |
| `POST /acl/rma-partner/submit` | ✓ | ✓ | ✓ | o | o | o | ADR-0068 ACL | 70% |

### §2.7 Partner / Exception / Consumer Tracking（4 endpoints）

| Endpoint | C | U | I | E | P | S | 自動化目標 |
|:---------|:-:|:-:|:-:|:-:|:-:|:-:|:-----------|
| `GET /tenants/{tenantId}/partners/{partnerId}/dashboard` | ✓ | ✓ | o | o | o | o | 60% |
| `GET /tenants/{tenantId}/exceptions:inbox` | ✓ | ✓ | ✓ | o | o | ✓ | 80% |
| `POST /tenants/{tenantId}/exceptions/{exceptionId}:approve` | ✓ | ✓ | ✓ | ✓ | o | ✓ | FR-0049 (P1) | 90% |
| `GET /consumer/work-orders/{trackingToken}` | ✓ | ✓ | ✓ | o | o | ✓ | FR-0022 (P1) anonymous | 80% |

### §2.8 M18 Config Governance（6 endpoints — P0 chaos）

對應 ADR-0067 + ADR-0068。**全部 chaos test 必驗**。

| Endpoint | C | U | I | E | P | S | P0 BR | 自動化目標 |
|:---------|:-:|:-:|:-:|:-:|:-:|:-:|:------|:-----------|
| `GET /tenants/{tenantId}/m18/configs` | ✓ | ✓ | ✓ | o | ✓ | ✓ | BR-M18-01 | 100% |
| `POST /tenants/{tenantId}/m18/configs` | ✓ | ✓ | ✓ | o | o | ✓ | schema validation | 100% |
| `PATCH /tenants/{tenantId}/m18/configs/{namespace}/{key}` | ✓ | ✓ | ✓ | o | o | ✓ | versioning + audit | 100% |
| `POST /tenants/{tenantId}/m18/configs/{namespace}/{key}/versions/{versionId}:start-rollout` | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | BR-M18-04 5/50/100 staged | 100% |
| `POST /tenants/{tenantId}/m18/rollouts/{rolloutId}:rollback` | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | BR-M18-04 rollback ≤ 1min | 100% |
| `GET /tenants/{tenantId}/m18/configs/{namespace}/{key}/audit` | ✓ | ✓ | ✓ | o | o | ✓ | BR-M18-05 audit ≥ 7yr | 100% |
| `GET /m18/config-read/{namespace}/{key}` (X-Config-Version) | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | NFR-Perf-008 P99 ≤ 50ms | 100% |

### §2.9 Chatbot / AI（10 endpoints）

對應 FR-0026..0034 + ADR-0063 utterance boundary + K8 Forbidden Eval。

| Endpoint | C | U | I | E | P | S | P0 BR | 自動化目標 |
|:---------|:-:|:-:|:-:|:-:|:-:|:-:|:------|:-----------|
| `POST /chatbot/intake:debounce-check` | ✓ | ✓ | ✓ | o | ✓ | o | FR-0026 (P0) | 90% |
| `POST /chatbot/agent:respond` | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | FR-0028 (P0) + K1/K3/K8 | 100% |
| `POST /chatbot/rag:search` | ✓ | ✓ | ✓ | o | ✓ | o | FR-0029 (P0) | 80% |
| `POST /chatbot/guardrails:check` | ✓ | ✓ | ✓ | ✓ | o | ✓ | FR-0030 (P0) + K8 Forbidden | 100% |
| `POST /chatbot/problem-cards:draft` | ✓ | ✓ | ✓ | ✓ | o | o | FR-0031 (P0) + K4 | 90% |
| `POST /chatbot/handoff:request` | ✓ | ✓ | ✓ | ✓ | o | ✓ | ADR-0048 hard rule + C2 monitor | 100% |
| `POST /chatbot/multimodal:image` | ✓ | ✓ | ✓ | o | o | ✓ | SOW 2.1(4) image gate | 100% |
| `POST /chatbot/eval/runs` | ✓ | ✓ | ✓ | o | o | o | FR-0032 (P0) | 90% |
| `GET /chatbot/eval/runs/{runId}` | ✓ | ✓ | o | o | o | o | - | 70% |
| `GET /chatbot/health` | ✓ | ✓ | ✓ | o | ✓ | o | FR-0033 (P0) | 90% |

### §2.10 KB / Knowledge Base（4 endpoints）

| Endpoint | C | U | I | E | P | S | 自動化目標 |
|:---------|:-:|:-:|:-:|:-:|:-:|:-:|:-----------|
| `GET /kb/documents` / `POST` | ✓ | ✓ | ✓ | o | o | o | 70% |
| `GET /kb/documents/{docId}` | ✓ | ✓ | o | o | o | o | 70% |
| `POST /kb/dynamic-lookup/serial-warranty` | ✓ | ✓ | ✓ | o | ✓ | o | 80% |
| `POST /kb/dynamic-lookup/project-unit-model` | ✓ | ✓ | ✓ | o | o | o | 70% |

### §2.11 Sync Pipeline（6 endpoints — Idempotency + DLQ）

對應 FR-0035..0040 chatbot+ERP 雙寫。**Contract test 強制 idempotency + DLQ**。

| Endpoint | C | U | I | E | P | S | P0 BR | 自動化目標 |
|:---------|:-:|:-:|:-:|:-:|:-:|:-:|:------|:-----------|
| `POST /sync/intake-capture` | ✓ | ✓ | ✓ | o | ✓ | ✓ | FR-0035 (P0) | 100% |
| `POST /sync/facts-master` | ✓ | ✓ | ✓ | o | o | ✓ | FR-0036 (P0) + ADR-PII-002 tokenize | 100% |
| `POST /sync/pc-convert` | ✓ | ✓ | ✓ | o | o | ✓ | FR-0037 (P0) | 100% |
| `POST /sync/convert-to-wo` | ✓ | ✓ | ✓ | ✓ | o | ✓ | FR-0038 cross-module | 100% |
| `POST /sync/dispatch` | ✓ | ✓ | ✓ | o | o | ✓ | FR-0039 (P0) | 90% |
| `POST /sync/evidence-writeback` | ✓ | ✓ | ✓ | o | o | ✓ | FR-0040 (P0) | 90% |

---

## §3 Test Layer 統計

| Layer | Endpoint coverage（57 total） | 目標 |
|:------|:------------------------------|:-----|
| **Contract (C)** | 57 / 57 = 100% | 100%（強制）|
| **Unit (U)** | 57 / 57 = 100% | 100%（強制）|
| **Integration (I)** | ~50 / 57 ≈ 88% | ≥ 80% |
| **E2E (E)** | ~22 / 57 ≈ 39% | ≥ 30%（main flow + sensitive）|
| **Performance (P)** | ~12 / 57 ≈ 21% | ≥ 15%（main + hot path）|
| **Security / Chaos (S)** | ~28 / 57 ≈ 49% | ≥ 45%（P0 + 合規）|

**Phase I 自動化 weighted average**：
- 含強制 C + U + 重點 I = (57 × 0.4 + 57 × 0.3 + 50 × 0.2 + 22 × 0.1) / 57 ≈ **≥ 73%** ✓ over Gate 6 threshold 70%

---

## §4 P0 BR Coverage Cross-Check（122 BR file × P0 FR）

| BR family | P0 endpoints | Coverage Status |
|:----------|:-------------|:----------------|
| BR-CANCEL-001..008（8 條）| `/work-orders/{woId}/cancel` | 100%（QLT-001..015 + CXJ-S* fixture）|
| BR-REFUND-001..006（6 條） | `/refunds` + `/refunds/{refundId}` | 100%（REF-SOD-001..005 + SoD constraint test）|
| BR-WARRANTY-001..007（7 條） | `/warranty-claims` + `/devices/{deviceId}/warranty` | 100%（WAR-H-* + WAR-RMA-* + WAR-NEG-*）|
| BR-M18-01..05（5 條）| 6 個 M18 endpoints + config-read | 100%（chaos + staged rollout test）|
| BR-AUDIT-007 / VCH chain | `/audit/events` + `/audit/exports` + hash verify | 100% |
| BR-PII-001(b) GDPR forget 7d | DGS pipeline + legal-hold | 100%（E2E + legal-hold conflict）|
| BR-A01..A12（M-系列 module BR ~ 50 條）| 散落各 endpoint | ≥ 95%（少數 nice-to-have defer Phase II）|
| BR-S-M01..M06 sync rules（~ 18 條） | 6 個 sync endpoints | 100% |
| BR-XCUT（cross-cutting） | RLS + tenant isolation across all | 100% |

**P0 BR 覆蓋率 = 100%**（122 / 122 中 P0 marked ≈ 87 / 87 = 100%）。
**P1 BR 覆蓋率 ≥ 90%** — Phase II nice-to-have 標 defer 不卡 Gate 6。

---

## §5 自動化執行排程

| Pipeline stage | Trigger | Tests run | Duration target |
|:--------------|:--------|:----------|:----------------|
| **Pre-commit** | dev push | Unit + lint + Forbidden corpus light (60 題 W4 baseline) | < 5 min |
| **PR CI** | PR open / push | Unit + Contract + Integration (no chaos) | < 15 min |
| **Main merge** | merge to main | + E2E main flow (4 條) + perf baseline | < 30 min |
| **Nightly** | cron 02:00 | + chaos (M18 / DGS) + full Forbidden 200 + NFR perf | < 2 hr |
| **Pre-release gate** | tag / manual | + full UAT regression + 合約紅線 + AT user task | < 4 hr |
| **Shadow run** | W4-W8 continuous | shadow LINE traffic + baseline collection | continuous |

---

## §6 Manual / UAT Only（不自動化的場景）

| 場景 | 為何不自動 | 處理方式 |
|:-----|:-----------|:---------|
| AI K1 ≥ 80% 準確率 UAT 50 題 | LLM-judge 仍需業主確認 | Manual UAT + Excel sign-off |
| 合約 4.4(d) 家族覆核流程 | reviewer 人類角色 | Manual + audit ledger verify |
| 業主簽核流程 | 流程本身為人 | Excel sign-off |
| A11Y 螢幕閱讀器 AT 任務（NVDA / VoiceOver） | 真人盲人測試 | Manual recruit + record success rate ≥ 90% |
| 紙本簽 fallback（LIFF 失敗 → 紙本）| 紙本流程 | Manual + 拍照上傳驗 audit |
| 師傅 onsite GPS 偏移 chaos | 真機驗 | Manual drill |

---

## §7 Defer Phase II（automation 不做）

| Endpoint / Scenario | 為何 defer | Phase I 替代 |
|:--------------------|:----------|:-------------|
| `/chatbot/multimodal:image` 高階場景 | 圖像辨識 SOW 2.1(4) 禁用，僅 block 測試 | block gate test |
| Bulk dispatch（活動 / 災難）| FR-0007 §4 out-of-scope | 單筆 dispatch loop |
| Cross-platform unified entry test | FR-0052 §4 out-of-scope | LINE 單一 entry |
| Phase II FR-0044..0051 endpoint | 未實作 | `@pytest.mark.skip("Phase II")` stub |
| Part-level warranty automation | BR-WARRANTY-007 Phase II | unit-level integration test |
| GDPR self-service portal | FR-0053 placeholder | 客服代客 manual |

---

## §8 Gate 6 Exit Criteria Summary

| Criterion | Target | Status |
|:----------|:-------|:-------|
| Contract test 覆蓋 | 100% / 57 endpoint | ✅ defined |
| Unit test 覆蓋 | 100% / 57 endpoint | ✅ defined |
| Integration test 覆蓋 | ≥ 80% | ✅ ~88% |
| E2E main flow 覆蓋 | 4 條（intake → AI → PC → WO → 結案）| ✅ |
| P0 BR 覆蓋 | 100%（87 條 P0 BR）| ✅ |
| P1 BR 覆蓋 | ≥ 90% | ✅ ~95% |
| 自動化整體 | ≥ 70% | ✅ ~73% |
| S0 outstanding bug | 0 | (release gate) |
| S1 outstanding bug | 0 | (release gate) |
| NFR baseline pass | 8 條 NFR-Perf / Avail / SLA | (release gate) |
| Forbidden Eval pass | ≥ 95% on 200 corpus + robustness ≥ 90% on 20 抽 | (release gate) |
| AT user task success | ≥ 90% (NVDA + VoiceOver, n=10 each) | (release gate) |

---

## §9 Cross-references

- 主 test plan: [test-plan-smart-lock-saas.md](test-plan-smart-lock-saas.md) (§4.5 quote + pricing test cases reused)
- Test data: [test-data-strategy-smart-lock-saas.md](test-data-strategy-smart-lock-saas.md)
- Cascade strategy: [test-plan-cascade-strategy-2026-05-28.md](test-plan-cascade-strategy-2026-05-28.md) (auto-gen stub spec)
- OpenAPI: [openapi-smart-lock-saas.yaml](../architecture/api/openapi-smart-lock-saas.yaml)
- NFR matrix: [nfr-matrix-smart-lock-saas.md](../architecture/nfr-matrix-smart-lock-saas.md)
