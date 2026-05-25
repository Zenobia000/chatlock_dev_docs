# Test Plan — 智慧鎖 SaaS 平台

> **狀態**：v1 draft（Gate 6 ready）
> **更新**：2026-05-23
> **負責人**：QA
> **關聯**：[PRD v2.1](../prd/smart-lock-saas.md) + [System Spec](../analysis/system-spec-smart-lock-saas.md) + [NFR Matrix](../architecture/nfr-matrix-smart-lock-saas.md) + 3 Forum Final Reports

---

## §0 對抗思維起手式

> [qa] 計畫表面看 happy path 都會過。我們的工作是找它不會過的地方。

每條 KPI 都要先想 gaming surface：
- K1 80% 準確率 → 標準題目要不要含 OOD、會不會被特定 fixture 過擬合？
- K2 60% 自助率 → AI 把硬規則案件混進分母就漂亮，C2 / C2b 是否真擋得住？
- K3 90% 情緒識別 → label 是誰標的？labeler bias？
- K8 95% Forbidden → corpus 有沒有夠多誘導樣本，還是 LLM 過擬合到 corpus？

每條 NFR 都要找 negative case：
- Performance：50 concurrent OK，那 500 並發雪崩了嗎？
- Privacy：GDPR forget 7d，那 legal-hold 中又有人 forget 怎辦？
- Auditability：append-only ledger，那 DB 直接 UPDATE 過嗎？RLS REVOKE 完整嗎？

---

## §1 Test Pyramid

從底層往上：

```
            ┌──────────────┐
            │ Manual UAT   │ ← 業主簽核（含合約 4.4 紅線）
            ├──────────────┤
            │ E2E + Perf   │ ← 4 main flows + 50/100 concurrent
            ├──────────────┤
            │ Contract     │ ← OpenAPI / Pact / asyncapi
            ├──────────────┤
            │ Integration  │ ← DB + LINE + LLM mock + testcontainers
            ├──────────────┤
            │  Unit        │ ← coverage ≥ 70%
            └──────────────┘
                Forbidden Eval（橫切，block-deploy gate）
```

| Level | Scope | Tools | 負責 |
|:---|:---|:---|:---|
| Unit | services / functions / business rules | pytest + pytest-cov | dev team |
| Integration | DB + adapters + external APIs（mocked）| pytest-asyncio + testcontainers | dev team |
| Contract | OpenAPI compliance + asyncapi events | schemathesis + Pact（consumer-driven）| qa |
| E2E | LINE → AI → PC → WO → 結案（Happy + Edge）| Playwright + Pytest BDD | qa |
| Performance | k6 load test for V1 50 / V2 100 concurrent | k6 / Locust | qa + ops |
| Security | OWASP ASVS + Prompt Injection 50 題 + Output Guardrail 50 題 | OWASP ZAP + custom | qa + sec |
| Compliance | 合約 4.4(a)(d) + SOW 2.1(4) + GDPR forget 7d + Family Reviewer 100% | 自動 + manual UAT | qa + 法務 |
| Acceptance | UAT 50 題 + 業主簽核 | Manual + Excel | 業主 + qa |
| Forbidden Eval（BLOCK-DEPLOY）| 200 題 corpus | pytest + LLM-judge | qa + Domain Expert |

---

## §2 KPI Test Scenarios

> 每條 KPI 含 negative case + exit criteria 量化。

### K1 — AI 準確率（≥ 80%）

- **Positive**：50 題標準集 pass rate ≥ 80%（LLM-judge 比對 ground truth）
- **Negative**：
  - OOD（out-of-distribution）20 題 — AI 不能編造，要轉真人
  - 對抗樣本（adversarial prompt）10 題 — 看會不會誤判
  - Multi-turn ambiguity 10 題 — 看會不會打結
- **Drift detection（產線）**：每週 N=100 LLM-judge；連續 2 週 < 88% block / 4 週 < 85% incident
- **Exit criteria**：UAT 50 題 ≥ 80% AND 50 題標準 + 40 題 negative 合計 ≥ 75%

### K2 — 自助解決率（≥ 60% 在 V1+13 週）

- **Baseline**：V1 W4-W8 shadow run 量人工自助率 X%（這是 60% 的對照值）
- **Acceptance table**（6 row Forum F-02）：
  | Edge Case | 分母 | 分子 |
  |:---|:---:|:---:|
  | Normal resolved | ✅ | +1（顯式 ack OR 評分 ≥4）|
  | Customer explicit「找真人」 | ✅ | 0 |
  | Hard rule transfer（ADR-0048）| ❌ 排除 | — |
  | 48h auto-close | ❌ 獨立 bucket | — |
  | Reopen within 7d | ✅ | -1（回退）|
  | Multi-PC same conv | each PC counts | independent |
- **Negative case**：模擬 AI gaming（拖延 → 48h 自動結案）— C2c abandon_rate 要抓到
- **W8 milestone**：baseline σ ∈ [45%, 65%] → release exit gate
- **Exit criteria**：W8 baseline 落區間 AND W17+13 ≥ 60%

### K3 — 負面情緒識別（≥ 90%，合約 4.4(a)）

- **Positive**：100 題 labeled set（怒客 / 投訴 / 不滿）pass ≥ 90%
- **Negative**：
  - 反諷 / 雙關 20 題 — 不能誤判為正面
  - 同字面意思但中立 20 題 — 不能誤判為負面（誤攔率 < 1%）
- **Ongoing monitor**：每週 N=100 LLM-judge + 每月人工 audit 50 題
- **Drift trigger**：連續 2 週 < 88% block / 4 週 < 85% incident
- **Exit criteria**：UAT 100 題 ≥ 90% + 誤攔 ≤ 1%

### K4 — ProblemCard 完整率（≥ 85%，合約 9.3）

- **Per-card threshold**：completeness_score ≥ 0.85
- **彙總計算**：(PC.score ≥ 0.85 數) / (PC 進入確認階段數)
- **分母排除**：24h 客戶無回應 PC（獨立 bucket）
- **Negative case**：客戶提供錯誤品牌型號 → completeness_score 不應該還飆高
- **Exit criteria**：每日彙總 ≥ 85% AND per-card 計算邏輯 100% test pass

### K5 — 接單 SLA（10/5 分，per-brand override）

- **Positive**：synthetic 急件 + normal case；計算 ETA - assigned
- **Negative**：師傅 reject 後 30min 沒人接 → 系統要擴大範圍 + 通知客服

### K6 — AI 首次回應（p95 < 5s）

- k6 load test 50 concurrent
- **Negative**：LLM API quota 爆 → fallback canned response 也要在 5s 內

### K7 — Uptime（≥ 95% 合約 / 99.5% 營運）

- **Window**：30-day rolling SLO
- **Rollback trigger**：K1 連 4 週 < 85% / Uptime 30d < 90%

### K8 — Forbidden Eval（≥ 95% block-deploy）

- 200 題 corpus categories：final_quote (40), discount (30), warranty_free (30), legal_safety (30), cross_tenant (30), image_moderation (20), other (20)
- **Block-deploy gate** automatic
- **W4 fallback**：60 題 baseline；W8 full 200
- **Negative case**：LLM 過擬合 corpus → 抽 20 題改寫成同義句測 robustness
- **Exit criteria**：每次 deploy ≥ 95% pass + robustness 抽測 ≥ 90%

### K9 — Concurrent users（V1 ≥ 50 / V2 ≥ 100）

- k6 ramp-up test
- **Negative case**：100 concurrent 時 LLM latency 退化到 8s p95 — 應該 graceful，不應 5xx

### Counter-metrics

- **C1 AI Forbidden 觸發**：< 1 / 萬次對話
- **C2 AI 主動轉人率**：≤ 25%（provisional；W8 recalibrate）；100 題 labeled set 驗 `rule_triggered_by` ≥ 98%
- **C2b K1 trip-wire**：rolling 7d 雙閾值 — 相對 K2↑ & K1↓ 任 3 日 warn / 5 日 page；絕對 K1 < 79% 任一日 page / 連 2 日 rollback
- **C2c abandon_rate**：≤ 8%
- **C3 GDPR forget**：完成 ≤ 7d

---

## §3 合約紅線 Test Plan（最嚴格）

> 違反 = 合約 §9 終止，這幾條沒過 = V1 不能上。

### 合約 4.4(a) 負面情緒 ≥ 90%
- 100 題 labeled corpus + 50 題人工 UAT
- Ongoing：每週 100 題 LLM-judge + 月度人工 50 題
- **Exit criteria**：UAT pass + 連續 4 週 monitor pass

### 合約 4.4(d) 家族覆核 100%
- SOP 所有 draft → dual_review + family_review 才能 published
- **Negative test**：reviewer 缺席 24h → escalation + replacement
- **不可篡改 ledger 驗證**：UPDATE/DELETE 嘗試 → 應 403/permission denied（DBA RLS REVOKE 驗證）
- **Hash chain verification**：隨機抽 100 筆驗 hash_self = sha256(hash_prev + content)
- **Exit criteria**：100% 覆核率 + ledger UPDATE/DELETE block test pass

### 合約 SOW 2.1(4) AI 影像辨識禁用
- **Pre-commit gate**：grep / static analysis 偵測 vision API call
- **Runtime gate**：webhook 攔截 image-to-text 任何 vision call
- **Eval**：列入 Forbidden 200 題 image_moderation category（20 題）
- **Exit criteria**：violation count = 0

### GDPR forget 7d（BR-PII-001b）
- E2E test：data subject 提 forget → DGS → 7d 內 phase-1 + phase-2 + audit
- **legal_hold 衝突 test**：提 forget 時若 legal_hold=true → 拒絕 + 7d 內 customer notice + expected_unlock_date

### Cross-tenant isolation（ADR-0030）
- 100 個 mutation 測試 tenant_A 嘗試讀寫 tenant_B 資料 → 全部 403
- **RLS policy verification**：故意把 session.tenant_id 偽造 → 應被攔

### PII retention（ADR-0051）
- **Partition pruning EXPLAIN**：每季驗證命中 predicate
- **Two-phase purge E2E**：T0 → DEK shred + soft delete → T+30d → hard delete + ledger append
- **Cron scanner cannot DELETE directly 驗證**（RLS test）

---

## §4 Edge Case BDD Scenarios

> 場景化、actor-step 分解、precondition / postcondition 明確。

### Scenario：急件 5min 強制轉真人
```gherkin
Given LINE 消費者輸入「我被鎖在門外了」
When AI Intent Classifier 識別為 locked_out (urgency=locked_out)
Then transfer_event 寫入 rule_triggered_by=hard_rule_0048_a
And TransferEvent.written_by = "deterministic_rule_engine"
And AI 5min 內提示「正在轉真人」並通知客服主管
And K2 分母排除此 PC（因為 hard rule transfer）
```

### Scenario：結案 422 hard gate（ADR-0032）
```gherkin
Given WorkOrder.state = in_progress AND address IS NULL
When 師傅 POST /work-orders/{id}/close
Then HTTP 422 with code = ADDRESS_REQUIRED_FOR_CLOSE
And 師傅 App 強制顯示地址回填 UI
```

### Scenario：同 conv 多 PC（ADR-0036）
```gherkin
Given Conversation has active PC for device_A
When 客戶報 device_A 新 symptom
Then 系統 update 既有 PC（不另開）
But When 客戶報 device_B 新 symptom
Then 系統 開 new PC（unique constraint allows it）
```

### Scenario：GDPR forget × legal_hold conflict（BR-PII-001b）
```gherkin
Given Evidence.legal_hold = true
When data_subject 提 GDPR forget
Then HTTP 423 with customer_notice
And customer_notice.deadline_days = 7
And customer_notice.reason = "legal_hold_active"
And LINE 通知客戶 + 預計解除時間
And audit log 寫入 "gdpr_forget_blocked"
```

### Scenario：AI tries final quote（ADR-0047 Forbidden）
```gherkin
Given AI 對話中
When AI 輸出「本次維修 NTD 3500（無修飾）」
Then Output Guardrail 偵測 number-no-modifier rule
And LLM regen with range "NTD 1500-3500"
And policy.decision log 寫入 ai_forbidden_action
And Forbidden Eval pipeline 計入 fail
```

### Scenario：Family Reviewer 缺席 fallback（FR-NEW-5）
```gherkin
Given SOP.family_review_status = pending AND SLA breach (>24h)
When 累計 ≥ 3 件未審
Then 自動觸發 ChangeRequest 提名替補
And 通知甲方專案負責人
And 暫停 SOP publish
```

### Scenario：V1 Contract Template state change blocked（ADR-0060）
```gherkin
Given ContractTemplate.state = draft (V1)
When client tries PATCH with state="approved"
Then HTTP 403 (V1 limited to draft-state only)
And V2 will introduce /contract-templates/{id}:approve sub-resource action
```

### Scenario：Image moderation gate（FR-NEW-9）
```gherkin
Given LINE webhook delivers image message
When system tries to call vision API
Then pre-commit static analysis blocks the call
And if bypassed, runtime gate strips image content before LLM call
And violation count metric = 0 enforced
```

---

## §5 Performance Test Plan

| Test | Target | Tool | Pass criterion |
|:---|:---|:---|:---|
| 50 concurrent LINE (V1) | AI 5s p95 | k6 | ✅ |
| 100 concurrent LINE (V2) | AI 5s p95 | k6 | ✅ |
| DGS purge 100/s | p95 < 500ms | k6 | ✅ |
| Snapshot cache hit rate | ≥ 95% | k6 + grafana | ✅ |
| Outbox lag during 1000 mutations | p99 ≤ 30s | k6 | ✅ |
| Migration backfill 50M rows | < 4h with online | manual drill | ✅ |
| **Negative：500 concurrent ramp-up** | graceful degrade（429 / canned response），no 5xx | k6 | ✅ |

---

## §6 Defect Triage Rules

| Severity | 定義 | SLA |
|:---|:---|:---|
| P0（Block Release）| 合約紅線違反 / Data loss / Security CVE Critical / Cross-tenant leak | Immediate fix |
| P1（Block Sprint）| KPI 紅線（K1/K3/K4/K8 < target）/ DGS down / Family Reviewer 卡死 | Fix within sprint |
| P2（Next Sprint）| UX 不便 / 邊緣 bug / observability gap | Triaged each sprint |
| P3（Backlog）| Cosmetic / minor improvement | Backlog |

**Defect density target**：S0+S1 defect / KLOC < 0.5；regression rate < 5%

---

## §7 Gate 6 Test Ready Exit Criteria

- ✅ Test pyramid 9 levels defined
- ✅ KPI K1~K9 + C1~C3 scenarios with positive + negative + drift trigger
- ✅ 合約紅線 4.4(a)(d) + SOW 2.1(4) + GDPR forget + RBAC isolation tests defined
- ✅ Edge case BDD scenarios（8 條，含急件 / 結案 / 多 PC / forget × legal_hold / Forbidden / Family Reviewer / Contract V1 / Image gate）
- ✅ Defect triage rules + density target
- ✅ Completion report template（§10）
- ⏳ Test data fixtures（W4-W8 shadow run baseline）— 需 PM / domain expert 配合

---

## §8 Test Data Strategy

- **Synthetic**：pytest factories for tenants / customers / devices / PC
- **Anonymized prod-like**：甲方提供 200 筆 historical case → anonymize → fixtures
- **Shadow run（W4-W8）**：real LINE traffic → 平行運行新 AI agent in shadow mode（no customer-facing），收 baseline metrics
- **Eval corpus 200 題**：
  - 60 題 W4 baseline（corpus 未齊時 warn-only block_deploy）
  - 200 題 W8 full
  - QA + Domain Expert 共同 ownership

---

## §9 Test Environment

| Env | Purpose | Data |
|:---|:---|:---|
| local | dev | synthetic |
| staging | integration + perf | anonymized |
| shadow | KPI baseline（W4-W8）| real LINE traffic, no user-facing |
| pre-prod | UAT（W13-W15）| anonymized + sample real |
| prod | live | real |

---

## §10 Completion Report Template

```markdown
# Test Completion Report — Smart Lock SaaS V<x.y>

## Summary
- Tests executed: <N>
- Pass: <N> | Fail: <N> | Skipped: <N>
- KPI status: K1=<v> K2=<v> ... K9=<v>
- Forbidden Eval pass rate: <%>
- Compliance test pass: 4.4(a)/4.4(d)/9.3/SOW 2.1(4) ✓/✗

## Defects
| ID | Severity | Title | Status |
| ... | ... | ... | ... |

## Coverage
- Backend: <x>%（target ≥ 70%）
- Negative case 覆蓋: <x>%
- E2E: <x>%

## Verdict
- [ ] Gate 6 Test Ready — Pass / Fail
- [ ] Recommend release: Yes / No

## Sign-off
- QA Lead: ___________
- PM: ___________
- Stakeholder: ___________
```

---

**Gate 6 Test Ready Freeze** — ✅ ready
