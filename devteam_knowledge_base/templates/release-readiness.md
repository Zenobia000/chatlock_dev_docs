# Release Readiness — <Release ID / Date>

> **Owner**: devteam-ops (Dev Lead + SRE)
> **Status**: pending | go | no-go | conditional
> **Release window**: <YYYY-MM-DD HH:mm TZ>
> **Related**: docs/qa/test-plan-<release>.md, docs/ops/runbook-<service>.md

---

## Release Summary

- **Features**: <list with PRD links>
- **Stakeholders informed**: ✓ / ✗
- **Customer-facing changes**: <list>
- **Breaking changes**: <list, with migration plan>

## Build & Artifact

- [ ] Build version: `v<n>` (commit sha: <sha>)
- [ ] CI green (link to pipeline)
- [ ] Image signed / SBOM generated
- [ ] Artifacts uploaded to registry

## Test Evidence

| Test Type | Result | Link |
|:----------|:-------|:-----|
| Unit | <pass rate> | <link> |
| Integration | <pass rate> | <link> |
| E2E | <pass rate> | <link> |
| Performance | <p95 + baseline> | <link> |
| Security | <findings> | <link> |
| Accessibility | <findings> | <link> |
| Manual UAT | <verdict> | <link> |

## Defect Status

| Severity | Open | Deferred (with approval) | Resolved |
|:---------|:-----|:-------------------------|:---------|
| S1 | 0 | — | <n> |
| S2 | <n> | <list> | <n> |
| S3 | <n> | — | <n> |

**Go criteria**: S1 = 0, S2 deferred 有 PM 簽核

## Observability Readiness

- [ ] Dashboards: <link> updated for new metrics
- [ ] Alerts: <list> configured & tested
- [ ] SLO doc: docs/ops/slo.md updated if SLO changes
- [ ] Runbook: docs/ops/runbook-<service>.md updated for new ops
- [ ] On-call team briefed

## Rollback Plan

### Rollback trigger criteria
- 5xx rate > 1% for 5m, OR
- p95 latency > 2x baseline for 10m, OR
- Customer report of data integrity issue

### Rollback procedure
1. `gh workflow run rollback.yml -f env=production`
2. Verify health within 10 min
3. Notify stakeholders
4. Schedule postmortem

### Rollback validation
- [ ] Rollback path tested in staging this week
- [ ] Database migration is **forward & backward compatible**
- [ ] Feature flags can disable new code paths without redeploy

## Rollout Strategy

<!-- HINT: 策略選擇對比參 KB 10 §3.1 對比表 + §3.2 選擇樹（藍綠 / 金絲雀 / 紅黑 / shadow / feature flag）。Feature flag 用作 release toggle 時必有移除截止日（KB 10 §3.4）。Schema breaking change 必走 KB 10 §3.5 expand-contract 與 app rollout 解耦。 -->

- [ ] Strategy chosen (canary / blue-green / shadow / feature flag): <which> — rationale per KB 10 §3.2
- [ ] Canary plan defined (<link>) — evidence checklist per KB 10 §3.3
- [ ] Feature flag default state: <on / off>; removal deadline (if release toggle): <YYYY-MM-DD>
- [ ] Staged rollout %: <1% → 10% → 50% → 100%>
- [ ] Mobile staged rollout %: <if applicable>
- [ ] Communication plan (email / in-app banner): <link>

## Compliance / Risk

<!-- HINT: 合規檢查對應 KB 11 §3.2（GDPR Art. 5/7/15/17/20/25/32/33/44-49 + 個資法第 6/8/11/27 條）。72h 外洩通報路徑必於 runbook 寫明（GDPR Art. 33）。跨境傳輸必標 jurisdictions + SCC 文件。 -->

- [ ] PII handling reviewed (per KB 11 §1-§3)
- [ ] Data retention compliant; expired data 自動清除已驗證
- [ ] Audit log enabled for new endpoints
- [ ] Cross-border transfer reviewed (SCC / adequacy decision documented if applicable)
- [ ] Incident notification path defined (72h per GDPR Art. 33)
- [ ] Legal / privacy review (if applicable): <verdict>
- [ ] Known risks documented with mitigation

## Stakeholder Sign-offs

| Role | Person | Decision | Date |
|:-----|:-------|:---------|:-----|
| PM | <name> | go / no-go / conditional | |
| Dev Lead | <name> | | |
| QA | <name> | | |
| DevOps | <name> | | |
| SRE | <name> | | |
| (optional) Security | <name> | | |

## Final Verdict

[ ] **GO** — proceed with release at planned window
[ ] **NO-GO** — postpone, reason: ...
[ ] **CONDITIONAL GO** — proceed with conditions:
  - <condition 1>
  - <condition 2>

## Post-release Review Schedule

- Smoke test verification: T+15min
- Initial monitoring window: T+1h
- Day-1 review: T+24h
- Week-1 retrospective: T+7d

---

## Downstream Consumers
- docs/ops/postmortem/*.md（若有事件）
- 下一個 release 的 readiness 改善 backlog
