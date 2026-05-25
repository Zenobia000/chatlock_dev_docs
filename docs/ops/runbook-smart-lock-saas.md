# Runbook — 智慧鎖 SaaS 平台

> **狀態**：v1 draft（Gate 7 ready）
> **更新**：2026-05-23
> **負責人**：SRE + DevOps
> **關聯**：NFR Matrix + PRD §Release Plan + ADR-0061 DGS

---

## §0 設計原則

> [sre] 可觀測 + 可回滾 + 可學習。SLI 對齊使用者體驗（不是 infra metric）；alert 要可動作（runbook link + first responder action）。
> [devops 視角] Pipeline 通過率 / rollback 時間 / drift 偵測 / deploy frequency 四個指標每月 review；blue-green / canary 為部署模式預設。

對齊 Google SRE + DORA + NIST SSDF RV（Respond to Vulnerabilities）。

---

## §1 SLI / SLO Definitions

> [sre] SLI 要 user-facing。「CPU < 80%」不是 SLI，「p99 latency < 300ms」才是。

| SLI | SLO | Burn rate alert | Owner |
|:---|:---|:---|:---|
| LINE AI 首回應 latency | p95 < 5s | p95 > 8s for 10min → page | dev |
| Case vector search | p95 < 3s | p95 > 5s for 10min → page | dev |
| RAG pipeline | p95 < 8s | p95 > 12s for 10min → page | dev |
| Admin Panel page load | p95 < 2s | p95 > 4s for 10min → page | dev |
| System Uptime V1 | ≥ 95%（合約）/ 99.5%（營運）| < 99% rolling 30d → page | ops |
| DGS service Availability | ≥ 99.95% | < 99.5% rolling 7d → page | ops |
| LINE webhook success | ≥ 99.9% | < 99% rolling 1h → page | ops |
| Snapshot staleness（retention/visibility）| p99 ≤ 60s | p99 > 120s → page | ops |
| Snapshot staleness（legal-hold/forget）| p99 ≤ 5s | p99 > 30s → critical page | ops |
| DGS invalidation lag | p99 ≤ 30s | p99 > 60s → page | ops |
| DGS mutation queue depth | < 1000 | > 5000 → page | ops |
| Outbox lag | p99 ≤ 30s | p99 > 120s → critical page | ops |
| KPI K1（AI accuracy）| ≥ 80% | < 79% absolute floor → page；rolling 7d 3/5 days drift → warn/page | qa+pm |
| KPI K3（sentiment）| ≥ 90% | < 88% 2 weeks → block deploy / < 85% 4 weeks → incident | qa+pm |
| KPI K8 Forbidden Eval | ≥ 95% | < 95% → block deploy | qa+dev |
| Cron retention queue | < 10k pending | > 50k → page（DGS may be down）| ops |
| **Voucher hash mismatch (v2.2)** | **0** | **> 0 → P0 page immediately**（IR-011；合規崩潰）| ops + DPA |
| **Voucher monthly cold archive job (v2.2)** | success ≥ 99% | 失敗 → page；rerun 12h SLA | ops |
| **Voucher Glacier rehydrate latency (v2.2)** | ≤ 12h | > 12h → notify 稅務窗口 | ops |

**Error budget**：99.5% Uptime = 30 天可下線 3.6h。連續超過 50% budget 消耗 → 凍結 feature deploy 直到回穩。

---

## §2 Incident Playbooks

> [sre] 每個 playbook 含 symptoms / diagnose / mitigate / rollback / postmortem 觸發條件。
> [devops 視角] mitigate 步驟具體可執行，artifact 可追溯。

### IR-001：LINE webhook 失敗率 > 1%
- **Symptoms**：webhook 5xx rate spike，customers report no AI reply
- **Diagnose**：
  ```
  gcloud logs read 'resource.type=cloud_run_revision AND severity>=ERROR' --limit=100
  # check LINE Messaging API status
  ```
- **Mitigate**：
  1. If LINE API outage：send LINE Broadcast 安撫客戶 + 開 incident channel
  2. If our service：enable canary rollback（5 min）
  3. Ensure DLQ pickup → manual review 1h within
- **Rollback**：Cloud Run revision pin to last green
- **Postmortem**：required if customer-facing impact > 30 min

### IR-002：Gemini API quota 爆 / 高 latency
- **Symptoms**：K1 dropping fast，p95 latency spike
- **Mitigate**：
  1. Enable Model Routing fallback（ADR-0027）：primary Gemini 2.5 Flash → fallback canned response
  2. Enable rate limit（per-tenant）
  3. Embedding cache hit rate boost（force 60s refresh）
  4. Notify domain expert + business owner if extended
- **Cost guard**：monthly Gemini bill > ceiling → page CTO

### IR-003：DGS service down（ADR-0061）
- **Symptoms**：99.95 SLO breach，all mutation blocked
- **Mitigate**：
  1. Auto：circuit breaker triggers，cron retention pause
  2. Read path：snapshot cache continues for unflagged items；flagged items full deny
  3. Triage：GCP Cloud Run status；redeploy from last green artifact tag (含 commit SHA)
  4. Backpressure：outbox queue depth check；if recovery storm imminent → token bucket throttle
- **Rollback**：redeploy last green DGS revision（single service，fast）
- **Postmortem**：required（mutation 中斷 5min+ 為 P0）

### IR-004：Outbox poller lag > 2min
- **Symptoms**：invalidation lag p99 > 2min
- **Mitigate**：
  1. Check poller pod health
  2. Scale poller replicas（auto via HPA）
  3. Check downstream bus（Kafka/PubSub）health
  4. **fail-closed**：enable read-time DGS tombstone check for ALL items（not just flagged）until lag recovers
- **Postmortem**：SLO breach → required

### IR-005：GDPR forget request > 5d unfulfilled
- **Symptoms**：gdpr_forget_request.deadline approaching
- **Mitigate**：
  1. DPO check legal_hold status
  2. If legal_hold blocks：ensure customer_notice sent within 7d（Art.12(3)）
  3. Else：escalate DGS team for manual completion
- **Compliance breach**：通報法務 + 7d 後若仍未處理 → 通報主管機關

### IR-006：Family Reviewer 缺席（FR-NEW-5）
- **Symptoms**：family_review_status pending > 24h，累計 ≥ 3 件
- **Mitigate**：
  1. Auto：觸發 ChangeRequest 提名替補
  2. 通知甲方專案負責人
  3. 暫停 SOP publish queue
  4. Manual：與甲方確認替補人選 + 啟動快速 onboarding
- **SLA**：須在發現後 48h 內有 active reviewer

### IR-007：Cross-tenant data leak suspected
- **Severity**：P0（合約 §9 終止條款）
- **Mitigate**：
  1. Immediate kill switch global activation
  2. Audit log forensic
  3. RLS policy verification
  4. 通報甲方 + 法務 + DPO
- **Postmortem**：mandatory，board-level review

### IR-008：AI Forbidden violation in production
- **Symptoms**：policy.decision log shows ai_forbidden_action firing real customers
- **Mitigate**：
  1. Enable Output Guardrail enhanced mode（lower threshold）
  2. Specific skill kill switch（per ADR-0028）
  3. Manual review violation list
  4. 若涉及 final quote 給客戶 → 客服主動聯繫客戶 + audit
- **Block**：立即 block 該 skill 部署

### IR-009：Cron retention scanner stalled
- **Symptoms**：cron retention queue > 50k pending
- **Likely cause**：DGS may be slow/down or partition pruning regression
- **Mitigate**：
  1. Verify DGS health
  2. Run EXPLAIN on cron query → check partition pruning
  3. If pruning regressed：rebuild stats / re-analyze table
  4. Backpressure：ensure DGS queue not overwhelmed（token bucket already in place）

### IR-010：KPI K3 sentiment drift（合約紅線）
- **Symptoms**：K3 < 88% rolling 2 weeks
- **Mitigate**：
  1. Block deploy（automatic）
  2. Notify domain expert + Family Reviewer 抽 100 題人工 audit
  3. Retrain / refine prompt + redo Eval
  4. If 4 weeks < 85% → incident + notify 甲方
- **Compliance breach**：連續 8 weeks < 85% → consider notify 法務

### IR-011：Voucher hash chain mismatch（v2.2 added per ADR-VCH-001/002）
- **Severity**：P0（帳本不可信 = 合規崩潰 + 商業會計法 §83 違反）
- **Symptoms**：
  - `voucher_hash_mismatch_total` counter > 0
  - Nightly verify job 報告 `hash_self ≠ sha256(hash_prev + row_content)` 任一 row
- **Diagnose**：
  ```sql
  -- 找出第一個 mismatch row
  WITH chain AS (
    SELECT *, encode(sha256((hash_prev || row_to_json((voucher_no, period, amount, ...))::text)::bytea), 'hex') AS expected_hash
    FROM journal_entry
    ORDER BY ledger_id, created_at
  )
  SELECT voucher_no, period, hash_self, expected_hash FROM chain WHERE hash_self != expected_hash LIMIT 5;
  ```
- **Mitigate**：
  1. **Freeze**：暫停所有 voucher 新寫入（`POST /vouchers/*` 回 503）；防 chain 繼續被污染
  2. **Forensic**：dump 該 ledger 全部 row，比對 PITR snapshot（24h 前）找出 mismatch 開始點
  3. **Decide cause**:
     - DB 直改（繞過 trigger）→ 立即 audit RLS / GRANT；通報 DPO + 法務
     - PITR rehydrate 時 column ordering 改變 → 重新計算 chain；apply hash chain v2 trigger（含 column-order-safe serialization）
     - Cold tier rehydrate 失敗 → re-archive；nightly verify 加 cold-tier sample check
  4. **Repair**：寫 `hash_chain_break_marker` row（不修改舊 row），標 break point，新 chain 從 marker 後重新計算
  5. **Notify**：DPO + 法務 + 甲方會計（影響 audit 完整性）；列入 monthly compliance report
- **Rollback**：不適用（資料完整性問題，rollback 部署不解決；走 forensic + repair）
- **Postmortem**：mandatory；board-level review（合規等級）
- **Prevent**：
  - DB-level RLS 完全 REVOKE UPDATE/DELETE
  - column-order-safe serialization（row_to_json 結果 sort by key）
  - Nightly verify 加 cold-tier rehydrate sample（每月抽 1% partition）

---

## §3 Kill Switch（ADR-0028，3 layers）

> [sre] 全域 / 員工 / Skill 三層。每層 activate 動作 + verification step 都要可重複。

### Layer 1：Global kill switch
- **Trigger**：cross-tenant leak / mass forbidden violation / critical CVE
- **Effect**：all AI agent traffic → fallback canned response + 「服務暫時轉真人」
- **Activate**：
  ```
  gcloud run services update ai-agent --update-env-vars=KILL_GLOBAL=true
  ```
- **Verification**：policy.decision log should show `kill_switch.activated` within 30s

### Layer 2：Per-employee kill switch
- Per AI agent role（quote-bot / sop-drafter）
- Effect：that agent route → fallback / disabled

### Layer 3：Per-skill kill switch
- Per SKILL.md
- Effect：skill 從 registry 卸載；AI fallback 到「我幫您轉真人」

All 3 layers log to `policy.decision` event + alert ops.

---

## §4 Deployment Pipeline（devops 主筆）

> [devops] Pipeline gate 嚴格，artifact 可追溯到 commit SHA + build timestamp。

### Build → Test → Deploy

```
[git push]
    ↓
[CI lint] OpenAPI / Rego / static analysis
    ↓
[Unit + Integration test] coverage ≥ 70%
    ↓
[Forbidden Eval] 200 questions，≥ 95% pass → block-deploy gate
    ↓
[Build container] tag = <commit SHA>-<build timestamp>
    ↓
[Deploy to staging]
    ↓
[Smoke test]
    ↓
[Canary 10%]（V1 staged，V2 canary per PRD §Release Plan）
    ↓
[Monitor K1/K8/Uptime 30min]
    ↓
[Full rollout]
    ↓
[Post-deploy verification] K-metrics
```

### Block-deploy gates（CI/CD）
1. Coverage < 70%
2. Forbidden Eval < 95%
3. KPI K3 baseline < 88% from staging shadow run
4. OpenAPI breaking change without DR
5. Image moderation gate violation > 0（SOW 2.1(4)）
6. OPA Rego artifact hash mismatch（DGS startup）

### Drift 偵測
- Infra as Code（Terraform）每日 drift detection
- Cloud Run env vars drift → alert + reconcile

---

## §5 Rollback Procedure

> [devops] Rollback 路徑明確 3 步驟，artifact tag 可指認回滾目標。

### V1 Rollback Trigger
- AI 準確率 K1 < 70%
- Forbidden Eval K8 pass < 90%
- Uptime < 90%（rolling 30d）
- 合約 4.4 UAT 不過
- PII leak event

### V2 Rollback Trigger
- 派工 SLA K5 < 80% on-time
- 月結對帳錯誤率 > 1%
- 師傅接單率 < 50%

### Procedure
1. **Decide go/no-go**（PM + Tech Lead + DevOps on-call 三人簽核 24h 內）
2. **Cloud Run revision pin** → 上一版 green artifact（含 SHA tag）
3. **Verify smoke test pass**
4. **Communicate**：LINE notice（consumer if user-facing）+ Admin Panel banner + 甲方 email
5. **Postmortem** 內 1 週

### Migration Rollback
- Down migration scripts mandatory
- Schema change 2-release 雙寫期，allows safe rollback within 1 release window
- Data backfill：incremental + idempotent

---

## §6 On-call Rotation

| Shift | Coverage | Personnel |
|:---|:---|:---|
| Office hours（9-18）| First responder | DevOps + 1 dev |
| Off-hours（18-9）| First responder | DevOps on-call rotation（weekly）|
| Critical escalation | Tech Lead | always |
| Compliance escalation | PM + 法務 + DPO | on incident |

PagerDuty alerting:
- P0：page on-call immediately
- P1：Slack alert + 30min response
- P2：Slack alert + next business day

---

## §7 Compliance Continuous Monitoring

| Compliance Item | Cadence | Owner | Action on breach |
|:---|:---|:---|:---|
| 合約 4.4(a) 90% sentiment | Weekly N=100 LLM-judge + monthly N=50 manual | qa + 客服主管 | < 88% 2w block / < 85% 4w incident |
| 合約 4.4(d) Family Reviewer 100% | Real-time | qa + governance | 缺席 24h → ChangeRequest |
| SOW 2.1(4) AI 影像辨識 violation = 0 | Real-time | ops | Page + immediate fix |
| GDPR forget ≤ 7d | Per request | DPO | > 5d unfulfilled → alert |
| Cross-tenant isolation | Daily scan | sec | Any leak → P0 IR-007 |
| OPA Rego artifact integrity | DGS startup + every config change | dev | Hash mismatch → DGS refuses to start |
| KPI K8 Forbidden ≥ 95% | Every deploy | qa | < 95% block deploy |
| DORA metrics | Monthly review | tech lead | Lead time / CFR / MTTR target |

---

## §8 Backup + Disaster Recovery

| Component | Backup | RPO | RTO |
|:---|:---|:---|:---|
| PostgreSQL primary | daily snapshot + WAL streaming | 1h | 4h |
| Evidence object storage（GCS）| 30-day version + cross-region | 24h | 4h |
| OPA Rego artifact | git history + signed releases | 0（in repo）| minutes |
| Audit ledger | append-only + cross-region replication | 0 | minutes |
| Snapshot cache | rebuild from DB（no recovery needed）| n/a | minutes |
| Vector DB（pgvector）| 同 PostgreSQL backup | 1h | 4h |

**DR drill**：quarterly（full restore from backup to staging + verify）

---

## §9 Observability Setup

### Metrics（Grafana）
- KPI dashboard：K1-K9 + C1-C3
- Service health：SLO burn rate per service
- DGS-specific：4 SLIs
- Cron retention：queue depth + partition pruning EXPLAIN check

### Logs（Cloud Logging）
- Structured JSON + trace_id
- Retention：policy.decision + audit eternal；ops 30-90d

### Traces（Cloud Trace）
- Distributed traces：LINE webhook → AI → PC → WO → 結案 / DGS mutation flow

### Alerts（PagerDuty）
- See §1 + §2 thresholds

---

## §10 Gate 7 Release Ready Exit Criteria

- ✅ SLO defined for all services（含 DGS、outbox、cache）
- ✅ Runbook for top 10 incident scenarios
- ✅ Kill switch 3-layer documented + drilled
- ✅ Deployment pipeline with block-deploy gates
- ✅ Rollback procedure + V1/V2 triggers + artifact SHA traceability
- ✅ On-call rotation defined
- ✅ Compliance continuous monitoring
- ✅ DR drill schedule
- ✅ Observability stack ready
- ⏳ DR drill execution（post-W17 quarterly）

---

**Gate 7 Release Ready Freeze** — ✅ ready
