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

- [ ] Canary plan defined (<link>)
- [ ] Feature flag default state: <on / off>
- [ ] Staged rollout %: <1% → 10% → 50% → 100%>
- [ ] Mobile staged rollout %: <if applicable>
- [ ] Communication plan (email / in-app banner): <link>

## Compliance / Risk

- [ ] PII handling reviewed
- [ ] Data retention compliant
- [ ] Audit log enabled for new endpoints
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
