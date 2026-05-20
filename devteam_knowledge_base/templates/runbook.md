# Runbook — {Service Name}

> **📋 Status**: draft | reviewed | frozen | superseded
> **🗓 Last updated**: YYYY-MM-DD
> **👤 Owner**: `devteam-ops` (DevOps + SRE)
> **🔖 Version**: v{n}
> **📞 On-call rotation**: {link to PagerDuty / Opsgenie}
> **🔗 Related**: [`KB 09 observability`](../09_observability_catalog.md) · [[10_resilience_patterns]]

---

## 📋 Executive Summary

> [!TIP]
> **TL;DR (30s)**: {Service name} is **T{0/1/2}** criticality. Top alert: **{alert name}** ({severity}). Standard deploy: **{strategy}**. RTO **{value}** / RPO **{value}**.

| 維度 | 摘要 |
|:---|:---|
| **🎯 服務角色** | {one-line purpose} |
| **🚨 Tier** | T0 (critical) / T1 (important) / T2 (best-effort) |
| **📊 SLO** | availability {%}, latency p95 {ms} |
| **🚀 部署策略** | canary · staged · big-bang |
| **🆘 P1 觸發** | {top 3 alerts that page on-call} |

> [!IMPORTANT]
> **Incident 第一時間**: 看 dashboard → 確認近 30m 是否有 deploy → 若是 deploy 相關 → **rollback first, diagnose later**。

---

## 🎯 Service Overview

| 欄位 | 內容 |
|:---|:---|
| **Purpose** | {one sentence} |
| **Tier** | T0 / T1 / T2 (criticality) |
| **SLO doc** | [`docs/ops/slo.md#{service}`](../../docs/ops/slo.md) |
| **Architecture** | [`docs/architecture/c4-l2-{feature}.md`](../../docs/architecture/c4-l2-{feature}.md) |
| **Repos** | {link} |
| **Dashboards** | {Grafana / Datadog link} |
| **Logs** | {log aggregator link} |

---

## 👥 Owners

| Role | Name | Contact |
|:---|:---|:---|
| **Service owner** | {name} | {email / slack} |
| **On-call primary** | rotation | PagerDuty schedule X |
| **Escalation L2** | {name} | ... |
| **Escalation L3** | {name} | ... |

---

## 🚀 Deployment

### Standard deploy

```bash
# 從 CI 觸發
gh workflow run deploy.yml -f env=production -f version=v{n}

# 監控
watch deploy: {dashboard link}
verify health: curl https://api.example.com/health
```

### Canary

> [!NOTE]
> Canary evidence 套 [[10_resilience_patterns]] §3.3 checklist — 必含階梯 / 觀察時間 / 觀察 metric / halt 條件 / auto rollback 觸發條件。
> Schema 變更必先於 canary（[[10_resilience_patterns]] §3.5 expand-contract）。

| Stage | Traffic | Duration | Monitor |
|:---:|:---|:---|:---|
| 1 | 1% | 30 min | error rate · p99 latency · KPI |
| 2 | 10% | 30 min | same |
| 3 | 50% | 30 min | same |
| 4 | 100% | — | — |

> [!WARNING]
> **Halt 條件**（任一觸發即 rollback）：
> - error rate > baseline + 0.5%
> - p99 latency > baseline × 1.5
> - 業務 KPI 退化 > 5%

### Rollback

> [!CAUTION]
> **`kubectl rollout undo` 只回滾 app，不回滾 schema / 資料**。Schema 變更必須先用 [[10_resilience_patterns]] §3.5 expand-contract 確保新舊版本相容，否則 rollback 後 app 對不上 schema。

```bash
# 立刻 rollback 到上一版
gh workflow run rollback.yml -f env=production

# 或手動：
kubectl rollout undo deployment/{svc} -n {ns}
```

**Rollback 完成判定**：

| 指標 | Baseline | Current | Status |
|:---|:---|:---|:---:|
| HTTP 5xx rate | < 0.1% | check | ✅ / ❌ |
| p95 latency | < {ms} | check | ✅ / ❌ |
| Error log volume | baseline | check | ✅ / ❌ |

---

## 🚨 Alerts

> [!NOTE]
> 每個 alert 必含 [[09_observability_catalog]] §6.3 metadata：summary / runbook link / dashboard link / SLO 對應。
> 基於 SLI 而非 resource metric（**不要用 `CPU > 80%` 當 alert**）。
> Burn rate alert 設計參 [[09_observability_catalog]] §6.2（1h 14.4x / 6h 6x 分段）。
> 缺 runbook / dashboard link → SRE persona 必標 blocker。

| Alert | Condition | Severity | First responder action | Runbook | Dashboard |
|:---|:---|:---:|:---|:---:|:---:|
| HighErrorRate | 5xx > 1% for 5m | 🔴 P1 | 看 dashboard X，查近 30m deploy，必要時 rollback | [link] | [link] |
| HighLatency | p95 > 1s for 10m | 🟡 P2 | 看 DB connection pool、cache hit rate | [link] | [link] |
| LowAvailability | success rate < SLO - error budget | 🔴 P1 | error budget review | [link] | [link] |
| DBConnectionsExhausted | active conn > 80% pool | 🔴 P1 | scale up replicas / kill long queries | [link] | [link] |
| QueueDepth | queue depth > {N} | 🟡 P2 | scale worker / check consumer health | [link] | [link] |

---

## 🩺 Common Incidents

> [!NOTE]
> 對應失敗類型 → 處置 pattern 參 [[10_resilience_patterns]] §1-§2.6（retry / CB / bulkhead / timeout / fallback / rate limit）；429 與 5xx 回應格式參 [[08_api_design_catalog]] §3.1。

### Incident: 5xx spike after deploy

> [!WARNING]
> First-line action: **rollback first, diagnose later**（若 5xx > 1% 持續 5 分鐘）。

| Step | Action |
|:---:|:---|
| 1 | 確認近 30m 是否有 deploy |
| 2 | 看 release notes 找變更點 |
| 3 | 若可確定 → rollback |
| 4 | 若不確定 → 先 rollback 再診斷 |
| 5 | 寫 postmortem |

### Incident: DB slow

| Step | Action |
|:---:|:---|
| 1 | `SELECT * FROM pg_stat_activity WHERE state != 'idle' ORDER BY query_start;` |
| 2 | Kill long-running queries（謹慎，先確認業務影響） |
| 3 | 看 lock contention |
| 4 | 確認近期 migration / index 變更 |
| 5 | 若仍未解 → 升級 instance / failover replica |

### Incident: {add more as learned}

...

---

## 📊 Capacity / Scaling

| 項目 | 內容 |
|:---|:---|
| **Current** | {N} replicas, CPU < 50%, mem < 60% |
| **Autoscale trigger** | CPU > 70% for 5m → +1 replica |
| **Max replicas** | {N} |
| **DB instance** | {size} |
| **Scale-up plan** | {link to runbook section / SOP} |

---

## 📈 Dashboards & Observability

| Asset | Link |
|:---|:---|
| **Service overview** | {link} |
| **SLO board** | {link} |
| **APM trace** | {link} |
| **Log aggregator** | {link} |
| **Error tracking** | {link} |

### Logging conventions

> [!NOTE]
> 結構化 JSON · 必含: `timestamp`, `level`, `service`, `trace_id`, `user_id` (PII safe), `event`
> 避免: `secret`, `full token`, `raw PII`

---

## 💾 Disaster Recovery

> [!NOTE]
> RTO / RPO 等級對應技術選擇參 [[10_resilience_patterns]] §4 — 是業務決策（成本 vs 風險）不是技術自選。值需與 NFR matrix（[[06_quality_attributes_catalog]] §1 Availability/Reliability）一致。

| Scenario | RTO | RPO | Procedure |
|:---|:---|:---|:---|
| Single AZ failure | < 1m | 0 | auto failover |
| Region failure | < 30m | < 5m | cross-region failover (manual approve) |
| DB corruption | < 1h | < 5m (PITR) | restore from PITR |
| Total data loss | < 4h | < 24h | restore from offsite backup |

---

## 📝 Postmortem Pattern

> [!IMPORTANT]
> 任何 P1 / 客戶影響事件後 **5 個工作日內**寫 postmortem：`docs/ops/postmortem/{date}-{topic}.md`
>
> **Blameless**：focus on systems & decisions, not individuals.

Postmortem 必含：

| Section | 內容 |
|:---|:---|
| Timeline | 從發現到復原的完整時間軸 |
| Impact | 影響範圍（用戶數 / 業務指標 / SLO 衝擊） |
| Root causes | 5 Whys 分析 |
| Actions | 預防再發的具體 follow-up（含 owner + due） |

---

## 🔗 Cross References

- **Release readiness**: [`docs/release/readiness-{date}.md`](../../docs/release/readiness-{date}.md)
- **SLO definitions**: [`docs/ops/slo.md`](../../docs/ops/slo.md)
- **C4 L2 diagram**: [`docs/architecture/c4-l2-{feature}.md`](../../docs/architecture/c4-l2-{feature}.md)
- **KB references**: [[09_observability_catalog]] · [[10_resilience_patterns]] · [[06_quality_attributes_catalog]]

---

## ✍️ Sign-off

- [ ] **Ops / SRE** (owner): ____________ / Date: ____________
- [ ] **DevOps**: ____________ / Date: ____________
- [ ] **Review verdict** (from `reviews/Gate7_Release-{feature}-{date}.md`): ✅ ready / ⚠️ revise / ❌ blocked

---

**End of Runbook**

> 給 on-call: 緊急時看 **🚨 Alerts** + **🩺 Common Incidents** + **🚀 Deployment §Rollback** 三段。
> 給業主: **📋 Executive Summary** + **💾 Disaster Recovery** 兩段。
