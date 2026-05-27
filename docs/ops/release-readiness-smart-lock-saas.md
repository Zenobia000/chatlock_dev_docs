---
id: release-readiness-smart-lock-saas
title: Release Readiness Checklist — 智慧鎖 SaaS V1.0
status: v1 draft (Gate 7 ready)
date: 2026-05-28
owner: devteam-ops (DevOps + SRE)
phase: P5_RELEASE
related_freeze_gates:
  - Gate 1 PRD freeze
  - Gate 2 UX flow freeze
  - Gate 3 system spec freeze
  - Gate 4 NFR + ADR baseline
  - Gate 5a API contract freeze
  - Gate 5b DB schema freeze
  - Gate 6 test ready
  - Gate 7 release ready (this doc)
related_adrs:
  - ADR-0067   # M18 governance
  - ADR-0068   # M18 anti-corruption
  - ADR-0064   # quote hash chain
  - ADR-VCH-001..002  # voucher
  - ADR-0050   # evidence visibility
  - ADR-0061   # DGS boundary
related_docs:
  - docs/ops/pipeline-spec-smart-lock-saas.md
  - docs/ops/runbook-smart-lock-saas.md
  - docs/ops/slo-spec-smart-lock-saas.md
  - docs/ops/rollback-plan-smart-lock-saas.md
  - docs/ops/release-readiness.md   # legacy V1 readiness（pre-2026-05-28 cascade）— superseded by this doc
---

# Release Readiness Checklist — 智慧鎖 SaaS V1.0

> **狀態**：v1 draft（Gate 7 ready）
> **更新**：2026-05-28
> **負責人**：DevOps + SRE
> **目標上線**：V1.0 W17（per PRD §Release Plan）
> **Supersedes**：`release-readiness.md`（已對齊新 ADR-0067 + ADR-0068 + 完整 7 gate quick reference）
> **設計原則**：對齊 Gate 1-7 全部證據；30-item pre-release checklist；24h post-release watch；台灣 release 日期紀律。

---

## §0 設計原則

> [devops 視角] Pipeline 通過率 / artifact 可追溯 / promotion gate 自動化優先。
> [sre 視角] 每個 readiness item 都要綁 SLO / error budget 檢查；rollback 路徑必畫。

**容忍例外原則（0-1 SaaS pragmatic ops）**：
- **必含**：7 gate 證據完整 + 30-item pre-release + 24h post-release watch + rollback drill
- **可 defer 到 V1.1**：自動化 DORA dashboard / 完整 chaos suite / per-tenant SLO 切片

---

## §1 7 Freeze Gate 證據 Quick Reference

> 每個 gate 的 owner / evidence path / 簽核狀態。Gate 7 必須在所有前 gate 簽完才能進行。

| Gate | 名稱 | Owner | Evidence path | Status |
|:---|:---|:---|:---|:---:|
| **Gate 1** | PRD freeze | devteam-pm | `docs/prd/smart-lock-saas.md` v2.1 | ✅ |
| **Gate 2** | UX flow freeze | devteam-ux | `docs/ux/user-flow-smart-lock-saas.md` + state coverage | ✅ |
| **Gate 3** | System spec freeze | devteam-analyst | `docs/analysis/system-spec-smart-lock-saas.md` + 53 FR + 122 BR | ✅ |
| **Gate 4** | NFR + ADR baseline | devteam-arch | `docs/architecture/nfr-matrix-smart-lock-saas.md` + 75 ADR + C4 L1/L2/L3 | ✅ |
| **Gate 5a** | API contract freeze | devteam-design | `docs/architecture/api/openapi.yaml` 57 paths + additive-only 紀律 | ✅ |
| **Gate 5b** | DB schema freeze | devteam-design (dba) | `docs/architecture/data/erd.md` 33 entities + DDL 53 tables + migration plan | ✅ |
| **Gate 6** | Test ready | devteam-qa | `docs/qa/test-plan-smart-lock-saas.md` + 200 題 Eval corpus | ✅ |
| **Gate 7** | Release ready | devteam-ops | 本 doc + pipeline / SLO / runbook / rollback 四件套 | ⏳ this doc |

**Gate 7 簽核 prerequisites**：
- [x] Gate 1-6 全部 frozen
- [x] 75 ADR 全部 accepted / partial_update / superseded（無 pending）
- [x] OpenAPI 57 paths v1.0 freeze
- [x] ERD 33 entities + DDL 53 tables
- [x] Test plan + 200 題 Eval corpus

---

## §2 30-Item Pre-Release Checklist

> Sequenced — 從 W17-4 開始跑，每週推進。每 item 必須有 owner + evidence link + done date。

### Phase α — Infrastructure（W17-4 → W17-3）

- [ ] **1.** GCP Cloud Run service 部署 staging（含 multi-region replica） | DevOps | _____
- [ ] **2.** PostgreSQL 16 production cluster（含 HA replica + WAL streaming） | DBA + DevOps | _____
- [ ] **3.** GCS evidence bucket（含 versioning 30d + cross-region replication） | DevOps + sec | _____
- [ ] **4.** KMS DEK per-tenant rotation 90d 排程（per NFR-Priv-007） | DevOps + sec | _____
- [ ] **5.** DGS service independent deployment（per ADR-0061） | DevOps + dev | _____
- [ ] **6.** M18 admin UI + config_versions ledger 上線（per ADR-0067） | dev + DevOps | _____
- [ ] **7.** Transactional outbox + DLQ poller（per ADR-0029） | DevOps + dev | _____
- [ ] **8.** Secret Manager（DB conn / LINE token / OAuth）+ 90d rotation 排程 | DevOps + sec | _____

### Phase β — CI/CD Pipeline（W17-3 → W17-2）

- [ ] **9.** Pipeline 10 stages 全綠（含 Forbidden Eval ≥ 95% gate） | DevOps + qa | _____
- [ ] **10.** Migration scripts + compensating migration（per ADR-0064 + ADR-VCH-001） | DBA | _____
- [ ] **11.** Migration dry-run on staging + hash chain verify pass | DBA + dev | _____
- [ ] **12.** Artifact tag 含 commit SHA + build timestamp（5 個 green tag 保留） | DevOps | _____
- [ ] **13.** Terraform drift detection daily | DevOps | _____
- [ ] **14.** PII-CI 雙層防線（per ADR-PII-002）run 1 次 full scan | sec + DPO | _____
- [ ] **15.** OPA Rego artifact 上鏈 + DGS startup hash check 驗證 | dev + 法務 + DPO | _____

### Phase γ — Monitoring + Compliance（W17-2 → W17-1）

- [ ] **16.** Grafana dashboard（7 SLO + KPI K1-K9 + C1-C3） | DevOps + qa | _____
- [ ] **17.** PagerDuty alert routing（P0/P1/P2 對齊 SLO Spec §3） | SRE | _____
- [ ] **18.** Burn rate alert（1h / 6h / 24h windows）配置 | SRE | _____
- [ ] **19.** Audit log delivery SLO-6 = 100% baseline 驗證 | SRE + qa | _____
- [ ] **20.** Cross-tenant isolation E2E test pass（per IR-007） | sec + qa | _____
- [ ] **21.** GDPR forget E2E test pass（per FR-0053 + IR-017） | DPO + dev + qa | _____
- [ ] **22.** Image moderation gate webhook + runtime double-gate verified（SOW 2.1(4)） | sec + qa | _____
- [ ] **23.** Load test 50 concurrent（K9 V1）pass | qa + DevOps | _____

### Phase δ — Drills + Sign-off（W17-1 → W17）

- [ ] **24.** M18 config rollback drill 跑 1 次 + RTO ≤ 1 min 驗證（per BR-M18-04 / NFR-Ops-005） | DevOps + M18 admin | _____
- [ ] **25.** App version rollback drill 跑 1 次 + RTO ≤ 30 min 驗證（per NFR-Ops-003） | DevOps + SRE | _____
- [ ] **26.** Kill switch 3-layer drill（global / employee / skill，per ADR-0028） | DevOps + dev | _____
- [ ] **27.** Runbook 完整 incident path E2E 跑通 1 次 | SRE + 客服 | _____
- [ ] **28.** Training 完成：客服 / 派工 / 管理員 / Family Reviewer / Domain Expert | training team + governance | _____
- [ ] **29.** 法務 sign-off：OPA Rego artifact + 合約 4.4 紅線 + SOW 2.1(4) | 法務 | _____
- [ ] **30.** DPO sign-off：retention engine + GDPR forget pipeline + ADR-0050 v2 evidence visibility | DPO | _____

### KPI Acceptance Gates（per PRD §Release Plan）

W13-W15 UAT 必須 pass：
- [ ] K1 ≥ 80%（50 題 standard set）
- [ ] K3 ≥ 90%（100 題，合約 4.4(a)）
- [ ] K4 ≥ 85%（PC complete rate）
- [ ] K8 ≥ 95%（Forbidden Eval 200 題）
- [ ] All BDD scenarios pass
- [ ] 合約 4.4(a)(d) + SOW 2.1(4) compliance pass

---

## §3 Promotion Pipeline（dev → staging → canary → prod）

```
dev → staging (auto on merge to main + 10 stages green + Forbidden Eval ≥ 95%)
    → smoke (10 min)
    → manual gate (PM + Tech Lead approve)
    → canary 5%（per pipeline spec §3.1；ADR 對齊版本為 10%，[VALUE_DECISION_NEEDED]）
    → ramp 50%（≥ 10 min observation + SLO baseline OK）
    → full 100%（≥ 10 min observation）
    → post-deploy verification 30 min（KPI K1/K3/K8 + uptime + error rate）
```

每個 promotion gate 必須：
- artifact SHA 一致（pin to immutable tag）
- KPI 上一階段 metric 未退化
- alert window 無 P0 / P1 fire
- M18 config 未同時改動（避免 confound 變因）

---

## §4 Rollback Decision Tree（per `rollback-plan-smart-lock-saas.md`）

W17 launch 或前 7 天若任一觸發 → 自動 / 手動進入 rollback：

```
M18 config 改動後問題? → Layer 1 (≤ 1 min)
App 部署後 K1 < 70% / Forbidden Eval < 90%? → Layer 2 (≤ 30 min)
Hash chain mismatch? → IR-011/013 forensic（不走 rollback；資料完整性問題）
PII leak / cross-tenant 寫入? → kill switch + Layer 2 + 通報甲方+法務+DPO
合約 4.4 UAT 不過? → Block release entirely
```

詳見 `rollback-plan-smart-lock-saas.md` §4 跨層決策矩陣。

---

## §5 Communication Plan（Pre / Launch / Post）

| Audience | Pre-launch（W17-4 → W17）| Launch day（W17 D0）| Post-launch（W17+1 → W17+13）|
|:---|:---|:---|:---|
| 甲方專案負責人 | Weekly status report + W17-1 final go/no-go meeting | Real-time LINE channel + 4h checkpoint | Daily standup 1 wk + weekly thereafter |
| 客服主管 | Training W15 + standby SLA monitor | Standby（war room） | Daily review 1 wk |
| Family Reviewer | Onboarding W15 | Stand-by | Weekly cadence |
| Domain Expert | Training W14 | Stand-by | Bi-weekly cadence |
| Consumers（LINE）| n/a | Service notice if needed（LINE Broadcast） | Auto-update via LINE |
| 法務 / DPO | OPA artifact sign W17-2；GDPR pipeline review W17-1 | Stand-by | Quarterly review |
| Internal team | All-hands W17-1（go/no-go）| War room（4h post-launch shift） | Daily standup 1 wk |

**台灣業主慣例三層 comms**：LINE（即時、業務時間）→ SMS（after-hours / P0）→ Email（formal report）

---

## §6 Release Window 紀律（台灣實況）

> 對齊 0-1 SaaS pragmatic ops — 釋出時間影響客戶感知與支援負擔。

| 時段 | 允許 release? | 理由 |
|:---|:---:|:---|
| 週一 ~ 週四 09:00-15:00 | ✅ recommended | 業務時間滿載 on-call；下午 3 點前發完 + 4h watch 趕得上下班 |
| 週五任何時段 | ❌ avoid | 出問題沒人 on-call；客戶週一爆量回報 |
| 週五下午 14:00+ | ❌ banned | 業主慣例：「週五下午不上線」 |
| 國定假日連假前 24h | ❌ banned | 連假無法回應客戶 + 客服減班 |
| 月底 25-31 | ❌ avoid for M11/M12 settlement | 結帳期；錯誤影響財務憑證 |
| 發薪日 5 / 10 / 25 | ⚠️ avoid for 金流相關 | 客戶對金流時段敏感 |
| 國定假日當天 | ❌ banned | n/a |

**Override**：P0 security patch / 合規緊急 hotfix 可走 emergency window，需 IT-admin + PM 雙簽 + audit log highlight。

---

## §7 24h Post-Release Watch Protocol

W17 D0 launch 後 24h：

| 時段 | Watch focus | Owner | Action if breach |
|:---|:---|:---|:---|
| **0-2h** | 7 SLO real-time + KPI K3 + Forbidden Eval | SRE + DevOps + QA on-call | 任一 SLO 1h fast burn → consider rollback |
| **2-4h** | KPI K1 + K3 + K6 latency baseline | QA + PM | K3 < 88% rolling 1h → Slack alert |
| **4-12h** | Uptime + error rate + outbox lag | SRE | 7 SLO 任一 budget > 25% 消耗 → freeze new deploy |
| **12-24h** | KPI 全 dashboard + 客服 ticket volume + LINE complaint scan | PM + QA + 客服主管 | KPI K3 < 85% → 進 IR-010 + 考慮 rollback |

**War room**：W17 D0 整日 + D1 上午（共 30h），含 PM / Tech Lead / DevOps on-call / SRE / QA Lead / 客服主管。

---

## §8 Post-Launch Review Cadence

| 時點 | 內容 | Owner |
|:---|:---|:---|
| W17+1（D2-D7）| Incident review + Rollback drill #2 | DevOps + SRE |
| W17+2 | KPI 1-week health check + 第一次 monthly KPI snapshot | PM + QA |
| W17+4 | 1-month review + DORA metrics first read | Tech Lead + DevOps |
| W17+4 | First **annual DR drill**（full restore from backup to staging） | DevOps + SRE + DPO |
| W17+8 | K2 W8 recalibration（per Forum F-02） | PM + QA |
| W17+13 | 3-month K2 final target check + V1.1 planning kickoff | PM + Tech Lead |
| Quarterly | DR drill + compliance audit + rollback drill 3 layer | DevOps + SRE + 法務 + DPO |

---

## §9 Sign-off

- [ ] **PM**：___________ / Date: ___________
- [ ] **Tech Lead**：___________ / Date: ___________
- [ ] **DevOps Lead**：___________ / Date: ___________
- [ ] **SRE Lead**：___________ / Date: ___________
- [ ] **QA Lead**：___________ / Date: ___________
- [ ] **DBA Lead**：___________ / Date: ___________
- [ ] **法務**：___________ / Date: ___________
- [ ] **DPO**：___________ / Date: ___________
- [ ] **甲方 PM**：___________ / Date: ___________
- [x] **業主**（CEO autonomous + pragmatic ops 0-1）：✅ 2026-05-28

---

## §10 [VALUE_DECISION_NEEDED] 收尾

- [ ] **DEC-1**：Canary 起步 % — pipeline spec 寫 5%（per task brief），ADR-0067 寫 10%。建議統一為 **10%**（SLO baseline 樣本足夠）；若採 5% 則需 cascade 更新 ADR-0067 §Decision 組件 3 + NFR-Ops-006
- [ ] **DEC-2**：Release window 黑名單（週五下午 / 連假前 / 月底）pipeline 是否自動擋？建議**自動擋 + IT-admin override + audit highlight**
- [ ] **DEC-3**：合約 baseline SLO-1 95% vs 營運 99.5% — 對外承諾哪個？建議**合約 95% 對外** + **營運 99.5% 內部燒 error budget**
- [ ] **DEC-4**：annual DR drill 是否在 V1 launch 後 1 個月內必跑？建議**必跑**（W17+4），給 4 週時間消化 launch incident 但不延遲過久
- [ ] **DEC-5**：M18 config rollback「強制全量」escape hatch — 禁用 vs 雙簽保留？建議**雙簽 + audit highlight 保留**（避免 emergency 無路）

---

**Gate 7 Release Ready Freeze** — ⏳ pending business sign-off on §10 DEC-1..5

> 給業主：30-item pre-release checklist 是 W17-4 → W17 的執行清單，每週同步 status。§10 五個 value decision 建議裁決後 cascade 更新本 doc 與 pipeline spec / SLO spec / rollback plan。
