---
id: slo-spec-smart-lock-saas
title: SLO / Alerts Specification — 智慧鎖 SaaS 平台
status: v1 draft (Gate 7 ready)
date: 2026-05-28
owner: devteam-ops (SRE 主筆 + DevOps)
phase: P5_RELEASE
related_adrs:
  - ADR-0067   # M18 runtime config — read P99 + rollback ≤ 1 min
  - ADR-0068   # M18 anti-corruption layer — Config Read API availability
  - ADR-0050   # evidence visibility — flagged item full deny
  - ADR-0061   # DGS boundary
  - ADR-0064   # quote hash chain
  - ADR-VCH-001  # voucher hash chain
  - ADR-VCH-002  # voucher 7y retention
related_nfr:
  - NFR-Perf-008
  - NFR-Avail-001..007
  - NFR-Ops-002..006
  - NFR-Aud-001..007
  - NFR-Priv-005..008
related_docs:
  - docs/ops/runbook-smart-lock-saas.md
  - docs/ops/pipeline-spec-smart-lock-saas.md
  - docs/ops/rollback-plan-smart-lock-saas.md
  - docs/architecture/nfr-matrix-smart-lock-saas.md
---

# SLO / Alerts Spec — 智慧鎖 SaaS 平台

> **狀態**：v1 draft（Gate 7 ready）
> **更新**：2026-05-28
> **負責人**：SRE（主筆）+ DevOps
> **設計原則**：對齊 Google SRE [SLO 工程實務](https://sre.google/workbook/) + DORA + NFR matrix。SLI 必須 **user-facing**（不是 infra metric）；alert 必須**可動作**（runbook link + first responder action）。

---

## §0 SLI / SLO 命名規則

| 術語 | 定義 |
|:---|:---|
| **SLI** | Service Level Indicator — 量化使用者體驗的指標（如 P99 latency） |
| **SLO** | Service Level Objective — SLI 的目標值（如 P99 < 500ms 99% of time, 30d window） |
| **Error Budget** | 1 − SLO；budget 用完 = 凍結 feature deploy |
| **Burn rate alert** | 在 budget 耗盡前提前告警，避免直到失效才反應 |

**Burn rate 三層 alert window**（per Google SRE workbook chap 5）：
- **1h fast burn**：14.4x — 1h 內燒掉 2% budget → critical page（業務時間 ≤ 15 min MTTA / off-hours ≤ 30 min）
- **6h medium burn**：6x — 6h 內燒掉 5% budget → page
- **24h slow burn**：3x — 24h 內燒掉 10% budget → warn / Slack

---

## §1 核心 7 SLO（V1 launch baseline）

> 取 0-1 SaaS pragmatic 視角：**只訂能監控 + 能動作的 SLO**，不訂 vanity SLO。其餘 SLI（如 DGS queue depth）走 Runbook §9 observability metrics 但不列 SLO。

### SLO-1 — API 整體可用性

| 維度 | 內容 |
|:---|:---|
| **SLI** | `1 - (5xx_count + non-business-4xx_count) / total_request_count` — measured per endpoint，全平台 aggregate |
| **公式** | `availability_30d = sum(success_responses_30d) / sum(total_responses_30d)` |
| **SLO** | ≥ **99.5%** 30d rolling（營運目標）/ ≥ 95% 合約 baseline |
| **量測窗** | 30 days rolling |
| **Burn rate alert** | 1h burn 14.4x → critical page / 6h burn 6x → page / 24h burn 3x → Slack warn |
| **Incident severity** | breach → P1（合約 < 95% → P0） |
| **對應 NFR** | NFR-Avail-001 (合約) / NFR-Avail-002 (營運) |
| **Runbook link** | `runbook-smart-lock-saas.md` §IR-001 (LINE webhook) / IR-003 (DGS down) |

### SLO-2 — LINE AI 首回應 latency

| 維度 | 內容 |
|:---|:---|
| **SLI** | `count(ai_first_response_latency_seconds < 5s) / count(total_ai_responses)` |
| **公式** | P95 over 30d rolling |
| **SLO** | P95 < **5s**（V1）/ P99 < 8s |
| **量測窗** | 30d rolling |
| **Burn rate alert** | P95 > 8s for 10 min → page / P99 > 12s for 10 min → critical page |
| **Incident severity** | breach → P1（影響首次體驗） |
| **對應 NFR** | NFR-Perf-001 / 合約 K6 |
| **Runbook link** | IR-002 (LLM API 超時) |

### SLO-3 — M18 Config read latency (cache hit)

> Per ADR-0067 §Decision 組件 5 + ADR-0068 + NFR-Perf-008 — read path 不能成為其他模組的 latency bottleneck。

| 維度 | 內容 |
|:---|:---|
| **SLI** | `count(config_read_latency_seconds < 0.05) / count(total_config_reads_cache_hit)` |
| **公式** | P99 over 7d rolling |
| **SLO** | P99 ≤ **50ms** (cache hit) / P99 ≤ 200ms (cache miss) |
| **量測窗** | 7d rolling（read 量大、變化快） |
| **Burn rate alert** | P99 > 100ms for 5 min → page；cache miss rate > 20% for 10 min → warn |
| **Incident severity** | P1（影響多個下游模組 latency） |
| **對應 NFR** | NFR-Perf-008 |
| **Runbook link** | IR-012 (M18 config rollout 失敗) |

### SLO-4 — Chatbot first reply availability

| 維度 | 內容 |
|:---|:---|
| **SLI** | `count(replied_within_5s) / count(total_inbound_messages)` — 對應合約 K6 |
| **公式** | (success / total) over 30d |
| **SLO** | ≥ **99%** 5s 內回覆（含 fallback canned response） |
| **量測窗** | 30d rolling |
| **Burn rate alert** | < 98% for 1h → page / < 95% for 10 min → critical page（fail-soft 失效）|
| **Incident severity** | P0 (合約 K6 + 客戶感知) |
| **對應 NFR** | NFR-Avail-004 / FR-0024 |
| **Runbook link** | IR-001 / IR-002 / IR-015 (chatbot 大量 fail) |

### SLO-5 — Migration & Hash Chain Safety

> 對齊 ADR-0064 (quote hash chain) + ADR-VCH-001 (voucher hash chain) — 帳本不可信 = 合規崩潰。

| 維度 | 內容 |
|:---|:---|
| **SLI** | `voucher_hash_mismatch_total + quote_hash_mismatch_total + migration_verify_failures` |
| **公式** | nightly verify job pass rate 30d |
| **SLO** | **0** mismatch event / 30d；nightly verify pass rate = 100% |
| **量測窗** | per nightly run；30d aggregate |
| **Burn rate alert** | **任一 mismatch → P0 page immediately**（不分 burn rate，直接 critical） |
| **Incident severity** | P0（商業會計法 §83 違反 + 合規崩潰） |
| **對應 NFR** | NFR-Aud-001..002 / NFR-Aud-007 |
| **Runbook link** | IR-011 (voucher mismatch) / IR-013 (quote hash mismatch) |

### SLO-6 — Audit Log Delivery（M17 + M18 audit）

> 對齊 NFR-Aud-007 (M18 config change audit 100% completeness) + ADR-0050 (evidence audit)

| 維度 | 內容 |
|:---|:---|
| **SLI** | `count(audit_events_persisted) / count(audit_events_emitted)` |
| **公式** | (persisted / emitted) per 1h window |
| **SLO** | = **100%** (zero loss tolerance)；outbox lag P99 ≤ 30s |
| **量測窗** | hourly aggregate；30d retention |
| **Burn rate alert** | any drop < 100% in 1h → P0 page；outbox lag P99 > 120s → critical |
| **Incident severity** | P0（合規證據鏈斷裂 = legal exposure） |
| **對應 NFR** | NFR-Aud-001 / NFR-Aud-007 |
| **Runbook link** | IR-004 (outbox lag) / IR-016 (evidence 證據遺失) |

### SLO-7 — GDPR Forget SLA

> 對齊 FR-0053 + ADR-0061 (DGS) + NFR-Priv-005

| 維度 | 內容 |
|:---|:---|
| **SLI** | `count(gdpr_forget_completed_within_7d) / count(total_gdpr_forget_requests)` |
| **公式** | per request；30d rolling |
| **SLO** | ≥ **99%** completed within 7d OR customer_notice 送出（Art.12(3) 合規） |
| **量測窗** | 30d rolling |
| **Burn rate alert** | request unfulfilled > 5d → page DPO；> 6d 30 min → critical (法律時限風險) |
| **Incident severity** | P0（GDPR 罰款 / 法律暴露） |
| **對應 NFR** | NFR-Priv-005 |
| **Runbook link** | IR-005 / IR-017 (DPO forget) |

---

## §2 Error Budget Policy

| 觸發條件 | Action |
|:---|:---|
| **任一 SLO 月度 budget 消耗 > 50%** | Slack warn + 暫緩 risky deploy（保留 rollback、bugfix） |
| **任一 SLO 月度 budget 消耗 > 75%** | freeze feature deploy；只接 rollback / hotfix / bugfix |
| **任一 SLO 月度 budget 耗盡** | **halt-deployment** until 下個月度 / 業主 override |
| **SLO-5 (hash chain) 任一 mismatch** | **immediate halt-deployment + freeze voucher writes + Runbook IR-011/013** |
| **SLO-6 (audit log) 任一 drop** | **immediate halt-deployment + freeze mutation + Runbook IR-016** |

**halt-deployment 例外**：rollback / security patch / 合約合規修補可走 fast-track（hotfix branch + 1 reviewer + 強制 rollback plan）。

**Error budget 重置週期**：月度（calendar month）；月初重置；異常事件 postmortem 必要時可申請 budget credit（業主裁決）。

---

## §3 Alert Routing & Severity

| Severity | 觸發 | Routing | Response SLA |
|:---|:---|:---|:---|
| **P0 / critical** | SLO-5/6/7 breach、cross-tenant leak、kill switch fire、SOW 2.1(4) 違反 | PagerDuty critical → on-call DevOps + Tech Lead + PM | MTTA ≤ 5 min（24/7） |
| **P1 / page** | SLO-1/2/4 breach、staged rollout auto-halt、CVE critical | PagerDuty page → on-call DevOps | MTTA ≤ 15 min (office) / ≤ 30 min (off-hours) |
| **P2 / warn** | SLO-3 burn medium、cache miss rate spike、drift detected | Slack #ops-alerts | next business day |
| **Info** | DORA metric monthly review、SLO budget 50% mark | Slack #ops-info | weekly review |

**台灣業主習慣（comms template）**：
- 對甲方 / 客戶：**LINE 通知優先**（business hours）→ SMS（after-hours / P0）→ email（formal incident report）
- 內部：Slack + PagerDuty
- P0 incident：30 min 內出第一封給甲方的「現況 + 預估 ETA + responsible owner」LINE 訊息

---

## §4 SLO Dashboard（Grafana）

**Dashboard 結構**（建議 4 個 panel group）：
1. **Top-line SLO bar**：7 個 SLO 月度 budget 消耗 % + halt-deployment 狀態
2. **Latency panels**：SLO-2 (AI reply) / SLO-3 (M18 read) / KPI K6
3. **Reliability panels**：SLO-1 (API avail) / SLO-4 (chatbot) / SLO-6 (audit delivery)
4. **Compliance panels**：SLO-5 (hash chain) / SLO-7 (GDPR forget) / KPI K3 sentiment / Forbidden Eval K8

**0-1 容忍例外**：
- DR drill / chaos 監控暫不上 dashboard（quarterly manual）
- Per-tenant SLO 切片暫不做（V1 single tenant；V2 multi-tenant 時再切）

---

## §5 與 Runbook 對映表

| SLO | Burn → Incident Playbook |
|:---|:---|
| SLO-1 API avail | IR-001 / IR-003 |
| SLO-2 AI reply latency | IR-002 |
| SLO-3 M18 read latency | IR-012 (M18 rollout) |
| SLO-4 Chatbot avail | IR-001 / IR-015 |
| SLO-5 Hash chain | IR-011 (voucher) / IR-013 (quote) |
| SLO-6 Audit delivery | IR-004 (outbox) / IR-016 (evidence) |
| SLO-7 GDPR forget | IR-005 / IR-017 |

---

## §6 Gate 7 Exit Criteria（SLO 側）

- [x] 7 core SLO defined（含 hash chain + audit + GDPR forget 合規 SLO）
- [x] Burn rate alert 三層 window 對齊 Google SRE workbook
- [x] Error budget policy（50% warn / 75% freeze / 100% halt）
- [x] Alert routing + severity（P0/P1/P2/info）+ comms template 台灣慣例
- [x] SLO ↔ Runbook IR 對映表完整
- [ ] **[VALUE_DECISION_NEEDED]** SLO-1 合約 baseline 95% vs 營運 99.5% — 對外承諾用哪個？建議**合約 95%（給甲方）** + **營運 99.5%（內部 target，違反不違約但燒 error budget）**
- [ ] **[VALUE_DECISION_NEEDED]** SLO-4 chatbot 5s 內回覆要不要含 RAG full path（NFR-Perf-003 寫 P95 < 8s for RAG）？建議**首回應指「ack + 開始處理」訊息**（< 5s），RAG full reply 用 SLO-2（P95 < 5s 包 LLM token）

---

## §7 Sign-off

- [ ] **SRE Lead**：___________ / Date: ___________
- [ ] **DevOps Lead**：___________ / Date: ___________
- [ ] **Tech Lead**：___________ / Date: ___________
- [ ] **DPO**（SLO-7 GDPR）：___________ / Date: ___________
- [ ] **法務**（SLO-5 / SLO-6 合規 SLO）：___________ / Date: ___________
- [x] **業主**（pragmatic ops 0-1 原則）：✅ 2026-05-28 透過 task brief

---

**Gate 7 SLO Spec Freeze** — ✅ ready
