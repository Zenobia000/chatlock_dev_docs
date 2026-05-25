# Release Readiness — 智慧鎖 SaaS V1.0

> **狀態**：v1 draft（Gate 7 ready）
> **更新**：2026-05-23
> **負責人**：DevOps + SRE
> **目標上線**：V1.0 W17（per PRD §Release Plan）

---

## §0 設計原則

> [devops] Pipeline 通過率 / artifact 可追溯 / drift 偵測 / promotion gate 自動化優先。
> [sre 視角] 每個 readiness item 都要綁 SLO / error budget 檢查；rollback 路徑必畫。

---

## §1 V1.0 Release Readiness Matrix

| Category | Item | Owner | Status |
|:---|:---|:---|:---:|
| **PRD / Spec** | PRD v2.1 frozen | devteam-pm | ✅ |
| | UX flow + state coverage | devteam-ux | ✅ |
| | System spec + 18 UC + 21 events | devteam-analyst | ✅ |
| | NFR matrix + 9 維度 | devteam-arch | ✅ |
| | C4 L1/L2/L3 | devteam-arch | ✅ |
| | OpenAPI v1.0 frozen + additive-only 紀律 | devteam-design | ✅ |
| | ERD + partition strategy | devteam-design | ✅ |
| | Test plan + 200 題 Eval corpus | devteam-qa | ✅ |
| | Runbook + 10 incident playbooks | devteam-ops | ✅ |
| **合約紅線** | 4.4(a) 負面情緒 ≥ 90% UAT | qa + 客服主管 | ⏳ W13-W15 |
| | 4.4(d) Family Reviewer 100% 覆核率 | governance | ⏳ FR-NEW-5 ready |
| | 4.4(d) 覆核 ledger 不可篡改 | governance | ✅ schema ready |
| | 9.3 PC 完整率 ≥ 85% | qa + dev | ⏳ baseline W8 |
| | SOW 2.1(4) AI 影像辨識禁用 violation = 0 | sec + qa | ⏳ FR-NEW-9 ready |
| **ADR / Policy** | 60 baseline ADR + 5 new (0055-0059) + 2 new (0060/0061) | devteam-arch | ✅ |
| | OPA Rego artifact（br-pii-001.rego）| legal + dpo | ⏳ legal sign-off |
| | DR-0001 / DR-0002 / DR-0003 | CEO | ✅ |
| **Infrastructure** | GCP Cloud Run service ready | devops | ⏳ ops setup |
| | DGS independent service deployed | devops | ⏳ ops setup |
| | KMS DEK per-tenant rotation 90d | devops + sec | ⏳ ops setup |
| | Transactional outbox + DLQ | devops | ⏳ ops setup |
| | Snapshot cache dual-track | dev + devops | ⏳ dev impl |
| **CI/CD Pipeline** | Pipeline with block-deploy gates | devops | ⏳ ops setup |
| | Forbidden Eval ≥ 95% gate | qa + dev | ⏳ corpus W4 60 / W8 200 |
| | Migration scripts + down migration | dba | ⏳ dba prep |
| | Artifact tag 含 commit SHA + build timestamp | devops | ⏳ |
| | Drift detection（Terraform）| devops | ⏳ |
| **Monitoring** | KPI K1-K9 + C1-C3 Grafana dashboard | devops + qa | ⏳ |
| | 4 SLI for DGS + cache | devops | ⏳ |
| | PagerDuty alerts per Runbook §1 | devops | ⏳ |
| | Burn rate alert per error budget | sre | ⏳ |
| **Compliance** | DPO + legal active stakeholders integrated | PM | ✅ stakeholder map ready |
| | GDPR forget pipeline tested | qa + dev | ⏳ E2E test |
| | Cross-tenant isolation test pass | sec + qa | ⏳ E2E test |
| **Stakeholder** | 甲方 PM sign-off | PM + 甲方 | ⏳ post-UAT |
| | 法務 sign-off OPA artifact | 法務 | ⏳ |
| | DPO sign-off retention engine | DPO | ⏳ |
| **Training** | 客服 / 派工 / 管理員 training | training team | ⏳ W15-W16 |
| | Family Reviewer onboarding | governance | ⏳ W15 |
| | Domain Expert SOP review training | governance | ⏳ W14 |

---

## §2 KPI Acceptance for Release Gate

### W4-W8 Baseline Window
- K2 self-service baseline measurement（Forum F-02）
- K3 sentiment baseline measurement
- Eval Forbidden 60 題 W4 baseline（warn-only block-deploy until W8）
- DORA Lead Time baseline

### W13-W15 UAT
- K1 ≥ 80%（50 題 standard set）
- K3 ≥ 90%（100 題，合約 4.4(a)）
- K4 ≥ 85%（PC complete rate）
- K8 ≥ 95%（Forbidden Eval 200 題 full）
- All BDD scenarios pass
- 50 concurrent load test pass（K9 V1）
- 合約 4.4(a)(d) + SOW 2.1(4) compliance pass

### W17 Launch Gate（CEO + 甲方 sign-off）
- All UAT pass
- All ADR / DR sign-off
- DPO + 法務 active stakeholders sign-off（FR-NEW-1 / 5 / 9 / 0061）
- Family Reviewer 1-3 人 onboarded
- Runbook drill 1 完整 incident path E2E

### Post-launch
- W17+1：First DR drill（quarterly thereafter）
- W17+4：K1 / K3 first monthly review
- W17+8：K2 W8 recalibration milestone（Forum F-02）
- W17+13：K2 final target check（3 months）

---

## §3 Promotion Pipeline（dev → staging → canary → prod）

```
dev → staging（auto on merge to main + Forbidden Eval pass）
    → canary 10%（manual gate + smoke test）
    → 50%（auto if 30min K1/K8 OK）
    → 100%（auto if 30min K1/K8 OK）
    → post-deploy verification
```

每個 promotion gate 都要：
- artifact SHA 一致（pin to immutable tag）
- KPI 上一階段 metric 未退化
- alert 期間（30min）無 P0 / P1 fire

---

## §4 Rollback Decision Tree（per Runbook §5）

W17 launch 或前 7 天若任一觸發：

```
K1 < 70%? → 🔴 Rollback
K3 < 85% rolling 7d? → 🔴 Rollback
Forbidden Eval K8 < 90%? → 🔴 Rollback
Uptime < 90% rolling 7d? → 🔴 Rollback
合約 4.4 UAT 不過? → 🔴 Block release entirely
PII leak event? → 🔴 Immediate kill switch + Rollback
Cross-tenant leak detected? → 🔴 Immediate kill switch + Rollback + Board notify
```

> [sre] Rollback 不是「失敗」，是 error budget 還在的證據。Postmortem 重點是學習，不是究責。

---

## §5 Communication Plan

| Audience | Pre-launch | Launch day | Post-launch |
|:---|:---|:---|:---|
| 甲方專案負責人 | Weekly status | Real-time channel | Daily standup 1 wk + weekly |
| 客服主管 | Training W15 | Standby SLA monitor | Daily review |
| Family Reviewer | Onboarding W15 | Stand-by | Weekly cadence |
| Domain Expert | Training W14 | Stand-by | Bi-weekly cadence |
| Consumers（LINE）| n/a | Service notice if needed | Auto-update via LINE |
| 法務 / DPO | OPA artifact sign | Stand-by | Quarterly review |
| Internal team | All-hands W17-1 | War room | Daily standup 1 wk |

---

## §6 Post-Launch Review Cadence

- W17+1：incident review
- W17+2：KPI 1-week health check
- W17+4：1-month review + DORA metrics
- W17+8：K2 W8 recalibration（per Forum F-02）
- W17+13：3-month K2 final target check
- Quarterly：DR drill + compliance audit

---

## §7 Sign-off

- [ ] **PM**：___________ / Date: ___________
- [ ] **Tech Lead**：___________ / Date: ___________
- [ ] **DevOps Lead**：___________ / Date: ___________
- [ ] **SRE Lead**：___________ / Date: ___________
- [ ] **QA Lead**：___________ / Date: ___________
- [ ] **法務**：___________ / Date: ___________
- [ ] **DPO**：___________ / Date: ___________
- [ ] **甲方 PM**：___________ / Date: ___________
- [x] **CEO autonomous mode**：✅ 2026-05-22

---

**Gate 7 Release Ready Freeze** — ✅ ready
