# Release Readiness — {Release ID / Date}

> **📋 Status**: pending | go | no-go | conditional
> **🗓 Release window**: YYYY-MM-DD HH:mm TZ
> **👤 Owner**: `devteam-ops` (Dev Lead + SRE)
> **🔖 Version**: v{n}
> **🔗 Related**: [`docs/qa/test-plan-{release}.md`](../../docs/qa/test-plan-{release}.md) · [`docs/ops/runbook-{service}.md`](../../docs/ops/runbook-{service}.md)

---

## 📋 Executive Summary

> [!TIP]
> **TL;DR (30s)**: **{Release ID}** ships **{N} features** on **{date}**. Test coverage **{%}**, defects **S1=0 / S2={n}**. Rollout: **{strategy}**. Rollback drilled in staging this week. **Verdict: {GO / NO-GO / CONDITIONAL}**.

| 維度 | 摘要 |
|:---|:---|
| **🎯 Release scope** | {N} features, {top feature names} |
| **🧪 Test pass rate** | unit {%} · integration {%} · E2E {%} |
| **🚨 Open S1 / S2** | S1: 0 · S2: {n} (all deferred with approval) |
| **🚀 Rollout strategy** | canary · blue-green · staged · feature-flag |
| **🔁 Rollback** | drilled in staging on {date}, RTO < {min} |
| **✍️ Verdict** | ✅ GO / ❌ NO-GO / ⚠️ CONDITIONAL |

> [!IMPORTANT]
> All sign-offs in **✍️ Stakeholder Sign-offs** section below must be ✅ before release window opens.

---

## 🎯 Release Summary

| 項目 | 內容 |
|:---|:---|
| **Features** | {list with PRD links} |
| **Stakeholders informed** | ✅ / ❌ |
| **Customer-facing changes** | {list} |
| **Breaking changes** | {list, with migration plan} |
| **Migration path** | {expand-contract / hot upgrade / downtime window} |

---

## 🏗 Build & Artifact

| Check | Status | Link |
|:---|:---:|:---|
| Build version `v{n}` (commit `{sha}`) | ☐ | — |
| CI pipeline green | ☐ | {link} |
| Image signed / SBOM generated | ☐ | {link} |
| Artifacts uploaded to registry | ☐ | {link} |

---

## 🧪 Test Evidence

| Test Type | Result | Pass rate | Link |
|:---|:---|:---:|:---|
| Unit | ✅ / ❌ | {%} | {link} |
| Integration | ✅ / ❌ | {%} | {link} |
| E2E | ✅ / ❌ | {%} | {link} |
| Performance | ✅ / ❌ | p95 {ms} (baseline {ms}) | {link} |
| Security | ✅ / ❌ | {findings count} | {link} |
| Accessibility | ✅ / ❌ | {findings count} | {link} |
| Manual UAT | ✅ / ❌ | {verdict} | {link} |

---

## 🐛 Defect Status

| Severity | Open | Deferred (with approval) | Resolved | Acceptance |
|:---:|:---:|:---|:---:|:---|
| 🔴 S1 | 0 | — | {n} | **MUST be 0** |
| 🟡 S2 | {n} | {list} | {n} | S2 deferred 需 PM 簽核 |
| 🔵 S3 | {n} | — | {n} | informational |

> [!IMPORTANT]
> **Go criteria**: S1 = 0, S2 deferred 有 PM 簽核（不可未經審核）。

---

## 📈 Observability Readiness

| Check | Status | Reference |
|:---|:---:|:---|
| Dashboards updated for new metrics | ☐ | {Grafana link} |
| Alerts configured & tested | ☐ | runbook §Alerts |
| SLO doc updated (if SLO changes) | ☐ | `docs/ops/slo.md` |
| Runbook updated for new ops | ☐ | `docs/ops/runbook-{service}.md` |
| On-call team briefed | ☐ | {brief notes link} |

---

## 🔁 Rollback Plan

### Rollback Trigger Criteria

> [!WARNING]
> 任一條件觸發即執行 rollback：

- 5xx rate > 1% for 5 min
- p95 latency > 2× baseline for 10 min
- Customer report of data integrity issue
- Business KPI degradation > 5%

### Rollback Procedure

| Step | Action |
|:---:|:---|
| 1 | `gh workflow run rollback.yml -f env=production` |
| 2 | Verify health within 10 min |
| 3 | Notify stakeholders (incident channel) |
| 4 | Schedule postmortem within 5 working days |

### Rollback Validation Checklist

| Check | Status | Note |
|:---|:---:|:---|
| Rollback path tested in staging this week | ☐ | drill date: {YYYY-MM-DD} |
| Database migration is **forward & backward compatible** | ☐ | per [[10_resilience_patterns]] §3.5 expand-contract |
| Feature flags can disable new code paths without redeploy | ☐ | flag list: {names} |

---

## 🚀 Rollout Strategy

> [!NOTE]
> 策略選擇對比參 [[10_resilience_patterns]] §3.1 對比表 + §3.2 選擇樹（藍綠 / 金絲雀 / 紅黑 / shadow / feature flag）。
> Feature flag 用作 release toggle 時必有移除截止日（[[10_resilience_patterns]] §3.4）。
> Schema breaking change 必走 [[10_resilience_patterns]] §3.5 expand-contract 與 app rollout 解耦。

| 項目 | 內容 |
|:---|:---|
| **Strategy chosen** | canary · blue-green · shadow · feature flag — rationale per KB 10 §3.2 |
| **Canary plan** | evidence checklist per [[10_resilience_patterns]] §3.3 |
| **Feature flag default** | on / off · removal deadline {YYYY-MM-DD if release toggle} |
| **Staged %** | 1% → 10% → 50% → 100% |
| **Mobile staged %** | if applicable |
| **Communication plan** | email / in-app banner / changelog link |

---

## 🛡 Compliance / Risk

> [!NOTE]
> 合規檢查對應 [[11_data_and_stack_catalog]] §3.2（GDPR Art. 5/7/15/17/20/25/32/33/44-49 + 個資法第 6/8/11/27 條）。
> 72h 外洩通報路徑必於 runbook 寫明（GDPR Art. 33）。

| Check | Status | Note |
|:---|:---:|:---|
| PII handling reviewed | ☐ | per [[11_data_and_stack_catalog]] §1-§3 |
| Data retention compliant; expired data auto-cleanup verified | ☐ | retention policy: {N days} |
| Audit log enabled for new endpoints | ☐ | log spec: {link} |
| Cross-border transfer reviewed (SCC / adequacy decision) | ☐ | jurisdictions: {list} |
| Incident notification path defined (72h per GDPR Art. 33) | ☐ | runbook §Disaster Recovery |
| Legal / privacy review | ☐ | verdict: {result} |
| Known risks documented with mitigation | ☐ | risk register: {link} |

---

## ✍️ Stakeholder Sign-offs

| Role | Person | Decision | Date |
|:---|:---|:---:|:---|
| **PM** | {name} | ☐ go / ☐ no-go / ☐ conditional | |
| **Dev Lead** | {name} | ☐ | |
| **QA** | {name} | ☐ | |
| **DevOps** | {name} | ☐ | |
| **SRE** | {name} | ☐ | |
| **Security** (optional) | {name} | ☐ | |

---

## 🎯 Final Verdict

> [!IMPORTANT]
> 業主於下方明確勾選一項。

- [ ] ✅ **GO** — proceed with release at planned window
- [ ] ❌ **NO-GO** — postpone, reason: ____________
- [ ] ⚠️ **CONDITIONAL GO** — proceed with conditions:
  - {condition 1}
  - {condition 2}

**Signed by Release Owner**: ____________ / Date: ____________

---

## 📅 Post-release Review Schedule

| Time | Activity |
|:---|:---|
| T+15 min | Smoke test verification |
| T+1 h | Initial monitoring window |
| T+24 h | Day-1 review (KPI drift / error rate) |
| T+7 d | Week-1 retrospective + readiness improvement backlog |

---

## 🔗 Cross References

- **Test Plan**: [`docs/qa/test-plan-{release}.md`](../../docs/qa/test-plan-{release}.md)
- **Runbook**: [`docs/ops/runbook-{service}.md`](../../docs/ops/runbook-{service}.md)
- **SLO**: [`docs/ops/slo.md`](../../docs/ops/slo.md)
- **Postmortems** (if incidents): [`docs/ops/postmortem/`](../../docs/ops/postmortem/)
- **KB references**: [[10_resilience_patterns]] · [[11_data_and_stack_catalog]] · [[09_observability_catalog]]

---

**End of Release Readiness**

> 給業主 / 高階主管: 看 **📋 Executive Summary** + **🎯 Final Verdict** 兩段。
> 給 Release Engineer: 整份依序檢查。
