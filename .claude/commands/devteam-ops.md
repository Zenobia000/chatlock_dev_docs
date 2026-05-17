---
description: DevTeam Ops driver（DevOps+SRE）。產 Runbook / SLO / Release Readiness；對應 Gate 7。
---

# DevTeam Ops Driver

載入 **devteam-ops** skill。

## 使用方式

```
/devteam-ops                                 # 接續推進 runbook + SLO + release
/devteam-ops "補 canary 策略 1→10→50→100"     # 局部
/devteam-ops "rollback 改成自動觸發"          # 變更（會觸發 cascade）
```

## 產出位置

- `docs/ops/runbook-<service>.md`
- `docs/ops/slo.md`
- `docs/release/readiness-<date>.md`
- `docs/ops/postmortem-template.md`

## Gate 7 條件

- Build / defect / perf / security 證據齊（含 link）
- Runbook + Alerts + Dashboards 就緒
- Rollback 演練過
- Go/no-go 標準 evidence-based
- Canary / staged rollout 策略已定
- Stakeholder sign-off ≥ 5 個欄位有人
