# Runbook — 智慧鎖 SaaS 平台

> **狀態**：v1.1 draft（Gate 7 ready）— 2026-05-28 cascade 補 IR-012..018 對齊新 ADR-0067/0068 + FR-0052/0053 + ADR-0050 v2
> **更新**：2026-05-28
> **負責人**：SRE + DevOps
> **關聯**：NFR Matrix + PRD §Release Plan + ADR-0061 DGS + ADR-0067 M18 governance + ADR-0068 anti-corruption + ADR-0050 evidence visibility + ADR-0042 RBAC L1-L5 + FR-0052 cancellation + FR-0053 GDPR forget
> **配套文件**：`pipeline-spec-smart-lock-saas.md` / `slo-spec-smart-lock-saas.md` / `rollback-plan-smart-lock-saas.md` / `release-readiness-smart-lock-saas.md`

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

### IR-012：M18 Config rollout 失敗 / mis-config（2026-05-28 added per ADR-0067 + BR-M18-01..05）
- **Severity**：P1（影響面取決於 config_key — 取消費 / approval limit / SLA 等為 P0）
- **Symptoms**：
  - Staged rollout auto-halt fire（per NFR-Ops-006）— canary 5% 階段 error rate / P99 latency / Forbidden Eval 超 baseline
  - Downstream module log 顯示 409 `ConfigVersionMismatch`（per ADR-0068 + ADR-0009 PARTIAL_UPDATE）
  - KPI K3 sentiment 在 M18 改動後 1h 內退化
  - 客服 / 客戶 ticket 暴增反映「金額算錯 / SLA 不對」
- **Diagnose**：
  ```bash
  # 1. 查最近 1h 內的 M18 config change（per ADR-0067 §Decision 組件 2 audit）
  curl /m18/config/changes?since=1h | jq '.changes[] | {key, version, changed_by, diff}'

  # 2. 查當前 active version vs 前一版 diff
  curl /m18/config/{key}/diff?from=N-1&to=N
  ```
- **First responder**：DevOps on-call
- **Triage tree**：
  - schema validation 通過但業務邏輯錯（如金額多打一個 0）→ Layer 1 rollback (`rollback-plan-smart-lock-saas.md` §1)
  - downstream cache 不一致（部分服務讀新版 + 部分讀舊版）→ 查 cache invalidation broadcast 是否完成（per ADR-0067 §Decision 組件 5）→ 必要時 force invalidate
  - schema 本身錯（如新增 enum value 但 reader 模組未升級）→ Layer 1 rollback + 升 schema deprecation issue
- **Mitigate**：
  1. **Auto-halt 已 fire**：自動回 staged rollout 前一版（per NFR-Ops-005 ≤ 1 min）
  2. **Manual rollback**：admin UI 一鍵回退（per BR-M18-04）；走 staged 10% 驗 → 50% → 100%
  3. **Cache mismatch**：force broadcast invalidation channel 重發；TTL 30s 兜底
  4. **Notify**：M18 admin + 影響模組 owner + PM
- **Rollback procedure**：見 `rollback-plan-smart-lock-saas.md` §1（M18 instant ≤ 1 min）
- **Escalation path**：DevOps → Tech Lead（如 schema-level 問題）→ PM（如業務影響 > 10% tenant）→ 法務（如合約金額條款相關）
- **Postmortem trigger**：必跑 if (1) auto-halt fire (2) 影響金額 / 合規 / SLA 相關 config (3) cache split-brain 持續 > 5 min
- **Prevent**：
  - Schema validation 前置（per ADR-0067 §Decision 組件 1）+ admin UI 雙驗
  - Staged rollout 不可跳（per BR-M18-03）；emergency override 需 IT-admin 雙簽
  - M18 config change 與 app deploy **不可並行**（pipeline spec §3.1）

### IR-013：Quote pricing snapshot hash chain mismatch（2026-05-28 added per ADR-0064）
- **Severity**：P0（業務 audit 鏈斷裂 — 客戶爭議時無法仲裁；合規隱性風險）
- **Symptoms**：
  - `quote_hash_mismatch_total` counter > 0
  - Nightly verify job 報 `pricing_rule_snapshot` immutable table 與 `quote.snapshot_hash` FK 不一致
  - 客戶申訴「報價金額對不上」+ snapshot 查不到對應 row
- **Diagnose**：
  ```sql
  -- 找出 quote.snapshot_hash 在 pricing_rule_snapshot 找不到的 row
  SELECT q.quote_id, q.snapshot_hash, q.created_at
  FROM quote q
  LEFT JOIN pricing_rule_snapshot prs ON q.snapshot_hash = prs.hash
  WHERE prs.hash IS NULL
  ORDER BY q.created_at DESC LIMIT 20;
  ```
- **First responder**：DBA + on-call dev
- **Triage tree**：
  - missing snapshot row → 查 pricing_rule_snapshot 是否被 DELETE（不該發生，應該 immutable）→ RLS audit
  - hash collision（理論上 sha256 不該）→ 查 serialization 是否不穩定
  - quote.snapshot_hash 寫入錯（hash 算錯）→ 查 app code path
- **Mitigate**：
  1. **凍結**：暫停 new quote creation（`POST /quotes` 回 503）
  2. **Forensic**：dump 該 quote 與 snapshot 的歷史；對比 PITR 24h 前 snapshot
  3. **Pricing engine 補救**：如該 quote 對應的 pricing rule 仍可由 M18 config_versions 重建 → 重新計 hash + 寫 audit；如已 unrecoverable → 標 `disputed` + 客服跟客戶協商
  4. **Notify**：PM + 法務 + 影響客戶之 ops 主管
- **Rollback procedure**：不適用（資料完整性問題，per `rollback-plan-smart-lock-saas.md` §3.5）
- **Postmortem trigger**：mandatory；對齊 IR-011 voucher mismatch 處理流程
- **Prevent**：
  - `pricing_rule_snapshot` RLS REVOKE DELETE / UPDATE
  - content-addressable hash 計算 column-order-safe（per ADR-0064 §Decision）
  - Nightly verify job 每月抽 1% snapshot sample 驗

### IR-014：SoD violation 攔截後客服處理 SOP（2026-05-28 added per ADR-0050 v2 + ADR-0042 RBAC L1-L5）
- **Severity**：P1（合規 + 客戶體驗）
- **Symptoms**：
  - `sod_violation_blocked_total` counter spike（per ADR-0050 v2 evidence visibility matrix 四維權限）
  - 客服 ticket：「我無法 approve 這筆退款 / 取消費」
  - Audit log 顯示 same user 同時擁有兩個衝突 role（如 dispatcher + approver on same WO）
- **Diagnose**：
  ```sql
  -- 查最近 1h SoD violation events
  SELECT user_id, target_resource, attempted_action, sod_rule_violated, blocked_at
  FROM audit_log
  WHERE event_type = 'sod_violation' AND blocked_at > NOW() - INTERVAL '1 hour'
  ORDER BY blocked_at DESC LIMIT 50;
  ```
- **First responder**：客服主管 + DevOps
- **Triage tree**：
  - 合理 SoD（如 dispatcher 自己派工自己核准）→ 通知 user 走 escalation path 找 L3+ approver
  - role 設定錯誤（per ADR-0042 L1-L5 矩陣 mis-config）→ 走 IR-018 RBAC sync lag
  - 緊急場景（如假日只有 1 個 approver 在班）→ IT-admin override + audit highlight + 24h 內補 secondary approver
- **Mitigate**：
  1. **客服 SOP**：
     - 步驟 1：告知客戶 / 內部 user：「此操作有合規限制，正轉接到適當的審核人」
     - 步驟 2：通知對應 L3+ approver（per RBAC 矩陣）
     - 步驟 3：approver 受理後 audit log 記錄 attempted_user + actual_approver 雙紀錄
     - 步驟 4：超過 30 min 未找到合適 approver → 升 operations_director（per NFR-SLA-003 escalation）
  2. **No bypass**：禁止 client-side workaround（如代登入）；任何 override 需 IT-admin 雙簽
- **Escalation path**：客服 → operations_manager → operations_director → IT-admin（emergency override）
- **Postmortem trigger**：weekly batch（不每 incident 出 postmortem）；如 violation rate > 1% / 週 → 走 RBAC 矩陣 review
- **Prevent**：
  - RBAC 矩陣定期 review（quarterly）
  - User onboarding 時 SoD check（per ADR-0042）
  - Approver pool 每個 role 至少 2 人（避免單點）

### IR-015：Chatbot 大量 fail → handoff 真人 + 降級開關（2026-05-28 added per FR-0024 + ADR-0027 + ADR-0048）
- **Severity**：P0（影響 LINE 主入口 → 客戶感知第一線）
- **Symptoms**：
  - SLO-4 (chatbot reply availability) burn 14.4x 1h
  - Forbidden Eval drop > 5% in 1h
  - 客服 ticket「AI 不回 / 答非所問」暴增
  - LINE Messaging API status 正常但 AI agent 回應率掉
- **Diagnose**：
  ```
  # 1. Gemini / LLM API status
  curl https://status.cloud.google.com/incidents.json | jq '.[] | select(.affected_products[] | .title | contains("Vertex"))'

  # 2. 看 AI agent fallback rate
  prometheus: rate(ai_agent_fallback_total[5m])
  ```
- **First responder**：DevOps on-call + dev on-call
- **Triage tree**：
  - LLM API outage → IR-002 mitigate (Model Routing fallback per ADR-0027)
  - Prompt template 改壞（per M18 config 改動）→ IR-012 M18 rollback
  - Skill registry 異常 → Per-skill kill switch (Layer 3 per ADR-0028)
  - 全面異常找不到單一原因 → **Global kill switch + 全量 handoff 真人**
- **Mitigate**：
  1. **降級開關 Layer 1**：admin UI 觸發 global kill switch → 所有 inbound LINE message → fallback canned response + 「服務暫時轉真人，請稍候」
  2. **Handoff 真人**：per ADR-0048 ai-human-handoff-rules — 全量 inbound 自動進客服 inbox（fallback inbox）
  3. **Capacity check**：客服主管確認 standby 人力；如人力不足 → 排隊訊息 + ETA
  4. **Comms**：對甲方 LINE 通知「AI 暫時降級，已轉真人處理；ETA 30 min」
- **Rollback procedure**：恢復後走 staged rollout（先 10% inbound 試 AI 路徑 → 50% → 100%）
- **Escalation path**：dev on-call → Tech Lead → PM → 業務（如影響 > 1h）
- **Postmortem trigger**：mandatory if (1) kill switch fire > 30 min OR (2) Forbidden violation 涉及客戶 OR (3) 客服 ticket > 50 件
- **Prevent**：
  - Model Routing fallback chain（per ADR-0027）測試 quarterly
  - Per-skill kill switch drill monthly
  - Capacity plan: 客服 standby 至少能 cover 30 min 全量 inbound

### IR-016：Evidence 證據被刪 / 遺失 — audit trail recovery（2026-05-28 added per ADR-0050 v2 + ADR-0051）
- **Severity**：P0（合規 — 證據鏈斷裂；evidence visibility matrix 四維權限失效）
- **Symptoms**：
  - GCS evidence bucket version count 異常（顯示有 DELETE）
  - `evidence_orphan_check` cron job 報 evidence 在 DB 有 FK 但 storage 找不到
  - 客戶 / 法務查 evidence 找不到 / 取得 stale 版本
  - SLO-6 audit log delivery drop
- **Diagnose**：
  ```bash
  # 1. GCS bucket 版本歷史
  gsutil ls -a gs://<evidence-bucket>/<path> | head

  # 2. DB-storage consistency check
  SELECT e.evidence_id, e.gcs_path, e.created_at
  FROM evidence e
  LEFT JOIN evidence_storage_probe esp ON e.gcs_path = esp.path
  WHERE esp.exists = false AND e.deleted_at IS NULL;
  ```
- **First responder**：sec + DPO + DBA
- **Triage tree**：
  - GCS 30-day version 仍可救 → restore from version history
  - 超過 version retention → 走 cross-region replica restore（per §8 backup）
  - 兩者都失敗 → audit-log only recovery（記錄當時的 evidence metadata + hash），通報甲方 + 法務 + DPO
- **Mitigate**：
  1. **Freeze**：暫停 evidence DELETE API（per ADR-0050 v2 attr_mask 四維）
  2. **Restore from version history**：`gsutil cp gs://bucket/path#<version> gs://bucket/path`
  3. **Restore from cross-region replica**：if version 過期
  4. **Audit-only recovery**：if 物理不可恢復 → 寫 `evidence_recovery_failed` audit row + 通報
  5. **Sec audit**：誰有 DELETE 權限？per ADR-0050 v2 應該只有 DPO + IT-admin time-boxed
- **Escalation path**：sec → DPO → 法務（如涉及法律仲裁案件）→ 甲方
- **Postmortem trigger**：mandatory；board-level review if (1) 涉及 legal-hold evidence OR (2) > 10 件 OR (3) RBAC bypass
- **Prevent**：
  - GCS bucket versioning ≥ 30d（per release-readiness §2 item 3）
  - Cross-region replication
  - DELETE 權限只給 DPO + IT-admin time-boxed（per ADR-0050 v2 attr_mask 矩陣）
  - Nightly evidence_orphan_check cron

### IR-017：PII / Retention 事故 — DPO 通報 + legal-hold flip（2026-05-28 added per FR-0053 + ADR-PII-002 + ADR-0061 DGS）
- **Severity**：P0（合規 — GDPR 罰款 / 法律暴露）
- **Symptoms**：
  - `gdpr_forget_pending_total` > 0 with deadline approaching
  - 客戶申訴 forget request 超過 7 天未回應（Art.12(3) 紅線）
  - PII 出現在 non-PII storage（如 log / cache 含 phone / signature 等 L4 sensitive 資料）
  - SLO-7 (GDPR forget) breach
- **Diagnose**：
  ```sql
  -- 查 pending forget requests
  SELECT request_id, customer_id, requested_at, deadline, legal_hold_status
  FROM gdpr_forget_request
  WHERE status = 'pending' AND deadline < NOW() + INTERVAL '2 days'
  ORDER BY deadline ASC;

  -- 查 PII leak in log
  rg --type log 'phone|signature|id_card' /var/log/... | head -50
  ```
- **First responder**：DPO + DGS team
- **Triage tree**：
  - Legal-hold 阻擋（爭議 / 仲裁 / 警方）→ 在 7 天內送 customer_notice（Art.12(3) 合規）+ 預計解除時間
  - DGS service 處理 lag → 走 IR-003 DGS down mitigation
  - PII 出現在不該的地方 → 立即清除 + 走 ADR-PII-002 schema CI 雙層防線後續審計
  - Forget 跨服務 propagation 失敗（chatbot / ERP / sync / vault 同步刪除）→ 手動補刪 + audit
- **Mitigate**：
  1. **兩階段刪除確認**（per FR-0053 + BR-PII-001）：T0 crypto-shred 金鑰 + 軟刪 + audit；T+30 物理刪
  2. **Legal-hold flip**：如先前 hold 已解除 → DPO flip legal_hold=false → DGS 重新進刪除佇列
  3. **Customer notice**：7 天內送（per NFR-Priv-005）— LINE/SMS/Email 三層；通知 legal-hold 原因 + 預計解除
  4. **PII leak**：立即遮蔽 / 清除 leak source + log scrub script + audit
  5. **Notify**：DPO → 法務 → 甲方 → （如 > 100 客戶受影響）主管機關
- **Compliance breach 升級**：
  - 7 天未送 customer_notice → DPO 強制通報法務
  - 30 天未完成 forget → 通報主管機關
- **Escalation path**：DGS team → DPO → 法務 → 甲方 → 主管機關（嚴重時）
- **Postmortem trigger**：mandatory；board-level if > 10 客戶 OR 涉及 L4 sensitive PII leak
- **Prevent**：
  - DGS cron retention 排程穩定（per IR-009 prevent）
  - PII-CI 雙層防線（schema CI + runtime scan，per ADR-PII-002）
  - Legal-hold flip 走 DPO + 法務 雙簽

### IR-018：師傅 RBAC L1-L5 同步 lag → workforce sync 失敗（2026-05-28 added per ADR-0042 + FR-0036 sync-facts-master）
- **Severity**：P1（影響派工 + 接案 + 結算正確性）
- **Symptoms**：
  - 師傅在 web app 登入後權限不對（看到不該看的 WO / 看不到自己的 WO）
  - `workforce_sync_lag_seconds` 超過 baseline（per outbox 機制）
  - 派工失敗：「找不到合適技能的師傅」但實際有
  - 結算對不上：師傅 commission 算錯
- **Diagnose**：
  ```sql
  -- 查 sync facts master vs RBAC tier 一致性
  SELECT t.technician_id, t.rbac_tier, sfm.rbac_tier_synced, sfm.last_synced_at
  FROM technician t
  LEFT JOIN sync_facts_master sfm ON t.technician_id = sfm.technician_id
  WHERE t.rbac_tier != sfm.rbac_tier_synced
     OR sfm.last_synced_at < NOW() - INTERVAL '15 minutes'
  LIMIT 50;
  ```
- **First responder**：DevOps + dev on-call
- **Triage tree**：
  - Sync outbox poller 卡（per IR-004）→ 走 outbox lag mitigation
  - L1-L5 tier 升降級邏輯 bug → 走 app rollback (Layer 2)
  - Sync FK constraint violation（如師傅被刪除但 sync 表還有 row）→ DBA repair
- **Mitigate**：
  1. **救急**：force sync 該 technician（admin API `POST /workforce/sync/{technician_id}/force`）
  2. **Poller 重啟**：if poller pod 卡 → scale HPA / restart
  3. **批次重 sync**：if > 10 technician 影響 → 跑 batch sync job
  4. **Notify**：影響派工 → 客服主管 + 派工主管；影響結算 → 財務
- **Escalation path**：DevOps → Tech Lead → 派工主管（如業務影響 > 30 min）
- **Postmortem trigger**：if > 50 technician 受影響 OR 結算錯誤 > NTD 10k OR sync lag > 1h
- **Prevent**：
  - Outbox lag SLO (SLO-6 audit delivery) monitor
  - Sync FK constraint test in CI
  - Nightly workforce_sync consistency check cron

### IR-019：LINE webhook 中斷 → fallback inbox（2026-05-28 added per FR-0024 + IR-001 extension）

> 此 IR 是 IR-001 (LINE webhook 失敗率 > 1%) 的延伸場景：當 LINE 平台**完全中斷**（非我方服務問題）時的 fallback 路徑。

- **Severity**：P0（LINE 是台灣 0-1 SaaS 主入口）
- **Symptoms**：
  - LINE Messaging API status 顯示 outage
  - Webhook 全停（不是 5xx，是根本不來）
  - SLO-4 chatbot drop 但 service 本身健康
- **Diagnose**：
  - LINE platform status: `https://status.line.me/`
  - Webhook last-received timestamp（如 > 5 min 無 inbound → 嚴重）
- **First responder**：DevOps on-call + 客服主管
- **Mitigate（fallback inbox）**：
  1. **客服 fallback inbox**：所有客戶聯繫導向「客服專線 / web form / email」三條備援
  2. **Comms**：對甲方 LINE/SMS 通知「LINE 平台中斷，已啟用備援聯繫管道」；對 consumer 透過官網 banner + Google My Business 更新狀態
  3. **資料補錄**：LINE 恢復後，dedup window 24h（per FR-0024）+ DLQ replay；如 LINE 平台 outage > 24h，需走 manual 補錄客戶聯繫（客服紀錄）
  4. **不開 kill switch**：我方服務健康，不該下 kill switch
- **Escalation path**：DevOps → PM → 業務 → 甲方
- **Postmortem trigger**：if LINE outage > 30 min OR > 100 客戶受影響 → 跑 fallback inbox capacity review
- **Prevent**：
  - Fallback inbox（客服專線 / web form / email）保持 always-ready
  - LINE status 自動監控（每 30s probe）+ alert
  - 客服 standby 人力規劃 cover LINE outage 場景

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

- ✅ SLO defined for all services（含 DGS、outbox、cache）— 詳見 `slo-spec-smart-lock-saas.md` 7 SLO
- ✅ Runbook for top 19 incident scenarios（IR-001..019，2026-05-28 補 IR-012..019 對齊新 ADR）
- ✅ Kill switch 3-layer documented + drilled
- ✅ Deployment pipeline with block-deploy gates — 詳見 `pipeline-spec-smart-lock-saas.md`
- ✅ Rollback procedure 三層（M18 ≤ 1 min / app ≤ 30 min / DB ≤ 4h）— 詳見 `rollback-plan-smart-lock-saas.md`
- ✅ On-call rotation defined
- ✅ Compliance continuous monitoring
- ✅ DR drill schedule — 詳見 `rollback-plan-smart-lock-saas.md` §5
- ✅ Observability stack ready
- ✅ Release readiness checklist 30-item — 詳見 `release-readiness-smart-lock-saas.md`
- ⏳ DR drill execution（W17+4 annual + quarterly thereafter）

---

**Gate 7 Release Ready Freeze** — ✅ ready（pending §10 [VALUE_DECISION_NEEDED] in `release-readiness-smart-lock-saas.md`）
