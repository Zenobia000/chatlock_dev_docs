---
id: FR-0010
title: 改約 / 延遲通知 / 取消（V1.0 LINE only）
status: active
phase: I
mapped_to:
  - M06    # Dispatch
  - M07    # Technician master (失約 penalty)
  - M11    # Settlement (cancellation fee)
  - M15    # Exception (cancellation)
  - M16    # Comms (LINE Flex)
superseded_clauses:
  - BR-M06-NN    # reschedule ≤ 3 次後強制 admin
  - BR-M07-NN    # 30 min 內 reschedule = 失約 (-5 weight)
  - BR-CANCEL-001    # S1 未派工 — 免費
  - BR-CANCEL-002    # S1.5 已確認未派工 — 免費
  - BR-CANCEL-003    # S2 派工未出發 — NTD 300
  - BR-CANCEL-004    # S3 出發未到場 — NTD 500
  - BR-CANCEL-005    # S4 到場未開工 — NTD 800
  - BR-CANCEL-006    # S5 已開工 — 全收
  - BR-CANCEL-007    # 師傅 initiated cancel 政策
  - BR-CANCEL-008    # reason code dictionary
  - BR-M16-NN    # reschedule LINE Flex confirm
emits_events:
  - WorkOrderRescheduled
  - WorkOrderDelayed
  - WorkOrderCancelled
  - TechnicianInitiatedCancel
  - TechnicianPenaltyApplied
  - WorkOrderRescheduleRejected
nfr_flavored: false
priority: P1
tier: 2
owner: 派工主管 / 客服
last_reviewed: 2026-05-28
related_adrs:
  - ADR-0020    # 非 LINE 用戶 fallback (historical)
  - ADR-0045    # acceptance-sla-policy
  - ADR-0102    # cancellation 6-stage cascade
legacy_id: REQ-010
trace_to_flow: F-010
last-synced-with: 4e9658e90324cbceb26f5e5445f481fc5678df1f
related:
  - "../../_source/01-workorder-erp.md#m06-派工"
---

# FR-0010 — 改約 / 延遲 / 取消（V1.0 LINE only）

> **Migration**: 2026-05-28 D5 殼 + 6-stage cancellation cascade（ADR-0102）。

## §1 Use Case Skeleton

| 欄位 | 內容 |
|:-----|:-----|
| **Actor** | 技師 / 客戶 / 客服 (cancel override) |
| **Secondary Actors** | M06 Dispatch, M11 AR (cancellation fee), M15 Exception, M16 Comms |
| **Trigger** | (a) 技師提交 reschedule (b) 客戶 / 技師取消 |
| **Precondition** | WO 狀態屬 cancel-able 階段（S1~S5 / accepted~in_progress） |
| **Main Flow** | reschedule §1.1 / cancellation §1.2 |
| **Alternative Flow** | §1.3 |
| **Postcondition** | wo.schedule 更新 OR wo.cancelled + fee 落 M11 |
| **Out-of-Scope** | 客訴 (FR-0018) / 退款 (FR-0014) |

### §1.1 Main Flow — Reschedule

1. 技師 APP 提交 new_eta + reason
2. 系統驗證 reschedule_count < 3 ([ref: BR-M06-NN])
3. 計算與原 ETA 差：若 < 30 min → 失約 penalty -5 weight ([ref: BR-M07-NN])
4. 系統 M16 推 LINE Flex「確認新時段」給客戶
5. 客戶 tap 確認 → wo.schedule 更新
6. emit `WorkOrderRescheduled`
7. 若 delay > 2h → emit `WorkOrderDelayed`
8. END

### §1.2 Main Flow — Cancellation (6-stage cascade)

1. 客戶 / 技師提交 cancel + reason code（[ref: BR-CANCEL-008]）
2. 系統依 wo.status + technician.gps_status 判定階段：
   - S1 (quote_pending / unconfirmed) → fee = NTD 0 ([ref: BR-CANCEL-001])
   - S1.5 (confirmed, NULL technician) → fee = NTD 0 ([ref: BR-CANCEL-002])
   - S2 (dispatched, not_departed) → fee = NTD 300 ([ref: BR-CANCEL-003])
   - S3 (en_route) → fee = NTD 500 ([ref: BR-CANCEL-004])
   - S4 (on_site, not work_started) → fee = NTD 800 ([ref: BR-CANCEL-005])
   - S5 (in_progress) → fee = 完工比例 + 材料 + 車馬，floor NTD 800 ([ref: BR-CANCEL-006])
3. fee 寫入 M11 cancellation ledger + emit `WorkOrderCancelled` (stage, fee, reason)
4. M16 LINE 通知客戶 (fee 金額 + 收取明細)
5. END

### §1.3 Alternative Flow

```
A1. 客戶拒絕新時段 (reschedule §1.1 step 5):
    A1.1 emit `WorkOrderRescheduleRejected`
    A1.2 WO 回 dispatch_pending
    A1.3 觸發 FR-0003 重新派工

A2. 第 4 次 reschedule (§1.1 step 2):
    A2.1 系統 reject + 強制 admin override

A3. 30 min 內 reschedule (§1.1 step 3):
    A3.1 emit `TechnicianPenaltyApplied` weight=-5

A4. 客服覆寫 cancellation fee (§1.2 step 3):
    A4.1 audit log（操作人 / 原值 / 新值 / 原因）
    A4.2 > 50% 調降或免收須主管覆核 ([ref: BR-CANCEL-003..006])

A5. 師傅 initiated cancel (§1.2 入口分流):
    A5.1 判定同月計數 + 不可抗力 ([ref: BR-CANCEL-007])
    A5.2 首次免責 / ≥2 扣 NTD 500 / 不可抗力憑證明免責
    A5.3 emit `TechnicianInitiatedCancel`
    A5.4 自動 reassign (FR-0003)

A6. 缺 reason code (§1.2 step 1):
    A6.1 回 422 ([ref: BR-CANCEL-008])
```

## §2 Acceptance Criteria (G/W/T)

### AC-01: Happy path reschedule

```gherkin
Given WO-001 排定 14:00 (reschedule_count = 0)
When 技師提交 new_eta = 16:00
  And 客戶 LINE 確認
Then wo.schedule = 16:00
  And event `WorkOrderRescheduled` emit
```

### AC-02: S1 未派工取消免費

```gherkin
Given WO-002 status = quote_pending
When 客戶提交 cancel + reason_code = "C-CHANGE_MIND"
Then cancellation_fee = 0
  And emit `WorkOrderCancelled` stage=S1
  → BR-CANCEL-001
```

### AC-03: S1.5 已確認未派工取消免費

```gherkin
Given WO-003 status = quote_confirmed AND technician_id IS NULL
When 客戶提交 cancel
Then cancellation_fee = 0
  And emit `WorkOrderCancelled` stage=S1.5
  → BR-CANCEL-002
```

### AC-04: S2 派工未出發取消 NTD 300

```gherkin
Given WO-004 status = dispatched AND technician.gps = 'not_departed'
When 客戶提交 cancel + reason_code = "C-NO_LONGER_NEEDED"
Then cancellation_fee = 300
  And emit `WorkOrderCancelled` stage=S2
  → BR-CANCEL-003
```

### AC-05: S3 出發未到場取消 NTD 500

```gherkin
Given WO-005 status = en_route
When 客戶提交 cancel
Then cancellation_fee = 500
  And emit `WorkOrderCancelled` stage=S3
  → BR-CANCEL-004
```

### AC-06: S4 到場未開工取消 NTD 800

```gherkin
Given WO-006 status = on_site AND work_started = false
When 客戶提交 cancel
Then cancellation_fee = 800
  And emit `WorkOrderCancelled` stage=S4
  → BR-CANCEL-005
```

### AC-07: S5 已開工取消按比例 + floor 800

```gherkin
Given WO-007 工項 4 個完成 2 個，工項總額 NTD 4000，材料已耗 NTD 600，車馬 NTD 500
When 客戶提交 cancel
Then cancellation_fee = (2/4)*4000 + 600 + 500 = 3100
  And 3100 ≥ 800 floor → 收 3100
  And emit `WorkOrderCancelled` stage=S5
  → BR-CANCEL-006
```

### AC-08: 客服覆寫 > 50% 調降須主管覆核

```gherkin
Given S3 取消預設 fee = 500
When 客服調至 200 (調降 60%)
Then 系統要求主管覆核
  And audit log 寫入
  → BR-CANCEL-003..006
```

### AC-09: 師傅同月首次 cancel 免責

```gherkin
Given technician T-001 本月 cancel 計數 = 0
When 技師提交 cancel (非不可抗力)
Then weight -5, 不扣款
  And emit `TechnicianInitiatedCancel` 同月計數 +1
  → BR-CANCEL-007
```

### AC-10: 師傅同月第 2 次扣 NTD 500

```gherkin
Given technician T-001 本月 cancel 計數 = 1
When 技師再提交 cancel
Then 扣款 NTD 500, weight -10, 自動 reassign
  → BR-CANCEL-007
```

### AC-11: 師傅不可抗力憑證明免責

```gherkin
Given technician T-001 本月 cancel 計數 = 2 AND 提供醫療證明
When ops 主管 approve 為不可抗力
Then 不扣款, weight 不扣
  And 證明文件 audit retain ≥ 1 年
  → BR-CANCEL-007
```

### AC-12: 缺 reason code 拒絕

```gherkin
When cancellation 提交時 reason_code IS NULL
Then 回 422 field_required
  → BR-CANCEL-008
```

## §3 Reference Map

| 類型 | ID | 用途 |
|:-----|:---|:-----|
| BR | BR-M06-NN / BR-M07-NN | reschedule 上限與 penalty |
| BR | BR-CANCEL-001~008 | 6-stage cancellation + 師傅 cancel + reason code |
| BR | BR-M16-NN | LINE Flex |
| ADR | ADR-0020 | non-LINE fallback (historical) |
| ADR | ADR-0045 | acceptance SLA |
| ADR | ADR-0102 | cancellation 6-stage cascade |
| Event | WorkOrderRescheduled / WorkOrderDelayed | M19 BI |
| Event | WorkOrderCancelled | M11 AR + BI |
| Event | TechnicianInitiatedCancel | M07 weight + BI |
| Event | TechnicianPenaltyApplied | M07 weight |
| Event | WorkOrderRescheduleRejected | re-dispatch |

## §4 Change Log

| Date | Change | Why |
|:-----|:-------|:----|
| 2026-05-10 | REQ-010→FR-0010 split | — |
| 2026-05-28 | **D5 殼 rewrite**：rule 搬 BR-M06/M07/M16-NN | Roundtable 2026-05-27 D5 |
| 2026-05-28 | **6-stage cancellation cascade**：套 BR-CANCEL-001~008，新增 8 個 cancellation AC，移除舊 2-tier 描述，補師傅 cancel scenario | value-decisions 2026-05-28 Q1-Q3 + ADR-0102 |
