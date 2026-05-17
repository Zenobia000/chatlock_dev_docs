# Runbook — <Service Name>

> **Owner**: devteam-ops (DevOps + SRE)
> **Status**: draft | reviewed | frozen | superseded
> **Version**: v<n>
> **Last updated**: <YYYY-MM-DD>
> **On-call rotation**: <link to PagerDuty / Opsgenie>

---

## Service Overview

- **Purpose**: <one sentence>
- **Tier**: T0 / T1 / T2 (criticality)
- **SLO doc**: docs/ops/slo.md#<service>
- **Architecture**: docs/architecture/c4-l2-<feature>.md
- **Repos**: <link>
- **Dashboards**: <Grafana / Datadog link>

## Owners

| Role | Name | Contact |
|:-----|:-----|:--------|
| Service owner | <name> | <email / slack> |
| On-call primary | rotation | PagerDuty schedule X |
| Escalation L2 | <name> | ... |
| Escalation L3 | <name> | ... |

---

## Deployment

### Standard deploy

```bash
# 從 CI 觸發
gh workflow run deploy.yml -f env=production -f version=v<n>

# 監控
watch deploy: <dashboard link>
verify health: curl https://api.example.com/health
```

### Canary

- 1% traffic for 30m → 監控 KPI
- 10% traffic for 30m → 監控
- 50% for 30m → 監控
- 100%

任何階段 KPI 退化 → 自動 rollback。

### Rollback

```bash
# 立刻 rollback 到上一版
gh workflow run rollback.yml -f env=production

# 或手動：
kubectl rollout undo deployment/<svc> -n <ns>
```

**Rollback 完成判定**：
- HTTP 500 rate 回到 baseline
- p95 latency 回到 baseline
- Error log volume 正常

---

## Alerts

| Alert | Condition | Severity | First responder action |
|:------|:----------|:---------|:----------------------|
| HighErrorRate | 5xx > 1% for 5m | P1 | 看 dashboard X，查近 30m deploy，必要時 rollback |
| HighLatency | p95 > 1s for 10m | P2 | 看 DB connection pool、cache hit rate |
| LowAvailability | success rate < SLO - error budget | P1 | error budget review |
| DBConnectionsExhausted | active conn > 80% pool | P1 | scale up replicas / kill long queries |
| QueueDepth | queue depth > N | P2 | scale worker / check consumer health |

---

## Common Incidents

### Incident: 5xx spike after deploy

1. 確認近 30m 是否有 deploy
2. 看 release notes 找變更點
3. 若可確定 → rollback
4. 若不確定 → 先 rollback 再診斷
5. 寫 postmortem

### Incident: DB slow

1. `SELECT * FROM pg_stat_activity WHERE state != 'idle' ORDER BY query_start;`
2. Kill long-running queries（謹慎）
3. 看 lock contention
4. 確認近期 migration / index 變更
5. 若仍未解 → 升級 instance / failover replica

### Incident: <add more as learned>

---

## Capacity / Scaling

- **Current**: <N> replicas，CPU <50%, mem <60%
- **Trigger autoscale**: CPU > 70% for 5m → +1 replica
- **Max replicas**: <N>
- **DB**: <instance size>，scale up plan: <link>

---

## Dashboards & Observability

- **Service overview**: <link>
- **SLO board**: <link>
- **APM trace**: <link>
- **Log aggregator**: <link>
- **Error tracking**: <link>

## Logging conventions

- 結構化 JSON
- 必含: timestamp, level, service, trace_id, user_id (PII safe), event
- 避免: secret, full token, raw PII

---

## Disaster Recovery

| Scenario | RTO | RPO | Procedure |
|:---------|:----|:----|:----------|
| Single AZ failure | <1m | 0 | auto failover |
| Region failure | <30m | <5m | cross-region failover (manual approve) |
| DB corruption | <1h | <5m (PITR) | restore from PITR |
| Total data loss | <4h | <24h | restore from offsite backup |

---

## Postmortem Pattern

任何 P1 / 客戶影響事件後 5 個工作日內寫 postmortem：
`docs/ops/postmortem/<date>-<topic>.md`，含 timeline / impact / root causes / actions / owners。

**Blameless**：focus on systems & decisions, not individuals.

---

## Downstream Consumers
- docs/release/readiness-<date>.md
- 任何新 incident 都更新 "Common Incidents" 區段
