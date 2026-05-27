---
id: FR-0010
title: 改約 / 延遲通知（V1.0 LINE only）
status: active
phase: I
mapped_to:
  - M06    # Dispatch
  - M07    # Technician master (失約 penalty)
  - M16    # Comms (LINE Flex)
superseded_clauses:
  - BR-M06-NN    # reschedule ≤ 3 次後強制 admin
  - BR-M07-NN    # 30 min 內 reschedule = 失約 (-5 weight)
  - BR-M07-NN    # 單方面取消 → auto reassign + 客訴
  - BR-M16-NN    # reschedule LINE Flex confirm
emits_events:
  - WorkOrderRescheduled
  - WorkOrderDelayed
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
legacy_id: REQ-010
trace_to_flow: F-010
last-synced-with: 4e9658e90324cbceb26f5e5445f481fc5678df1f
related:
  - "../../_source/01-workorder-erp.md#m06-派工"
---

# FR-0010 — 改約 / 延遲通知（V1.0 LINE only）

> **Migration**: 2026-05-28 改為 D5 殼結構（rule → BR）。

## §1 Use Case Skeleton

| 欄位 | 內容 |
|:-----|:-----|
| **Actor** | 技師 (initiate)，客戶 (confirm/reject) |
| **Secondary Actors** | M06 Dispatch, M16 Comms |
| **Trigger** | 技師於 APP 內提交 reschedule (new_eta + reason) |
| **Precondition** | WO `accepted` 或 `in_progress`；reschedule 次數 < 3 |
| **Main Flow** | 詳見 §1.1 → user-flow:S2-step-reschedule |
| **Alternative Flow** | 詳見 §1.2 |
| **Postcondition** | wo.schedule 更新；emit `WorkOrderRescheduled` |
| **Out-of-Scope** | 取消 (FR-0014)；客訴 (FR-0018) |

### §1.1 Main Flow

1. 技師 APP 提交 new_eta + reason
2. 系統驗證 reschedule_count < 3 ([ref: BR-M06-NN])
3. 計算與原 ETA 差：若 < 30 min → 失約 penalty -5 weight ([ref: BR-M07-NN])
4. 系統 M16 推 LINE Flex「確認新時段」給客戶
5. 客戶 tap 確認 → wo.schedule 更新
6. emit `WorkOrderRescheduled`
7. 若 delay > 2h → emit `WorkOrderDelayed` (SLA soft alert)
8. END

### §1.2 Alternative Flow

```
A1. 客戶拒絕新時段 (第 5 步):
    A1.1 emit `WorkOrderRescheduleRejected`
    A1.2 WO 回 dispatch_pending
    A1.3 觸發 FR-0003 重新派工

A2. 第 4 次 reschedule (第 2 步):
    A2.1 系統 reject
    A2.2 強制 admin override 才可繼續 ([ref: BR-M06-NN])
    A2.3 alert 派工主管

A3. 30 min 內 reschedule (第 3 步):
    A3.1 計算 penalty
    A3.2 emit `TechnicianPenaltyApplied` weight=-5

A4. 技師單方面取消無通知 (out-of-band detect):
    A4.1 系統偵測技師超過排定 ETA + 30 min 無 onsite
    A4.2 自動 reassign (FR-0003)
    A4.3 進客訴流程 (FR-0018)
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

### AC-02: 客戶拒絕

```gherkin
When 客戶 tap "拒絕"
Then emit `WorkOrderRescheduleRejected`
  And WO 進 dispatch_pending
```

### AC-03: 第 4 次強制 admin

```gherkin
Given WO-001 reschedule_count = 3
When 技師再提交 reschedule
Then 系統 reject
  And alert admin
```

### AC-04: 30 min 失約 penalty

```gherkin
Given 原 ETA = 14:00
When 技師 13:35 提交 reschedule
Then 失約 penalty -5 weight
  And event `TechnicianPenaltyApplied` emit
```

### AC-05: > 2h delay SLA alert

```gherkin
Given 原 ETA = 14:00, new ETA = 16:30 (delay 2.5h)
When 客戶確認
Then event `WorkOrderDelayed` emit (SLA soft alert)
```

## §3 Reference Map

| 類型 | ID | 用途 |
|:-----|:---|:-----|
| Business Rule | BR-M06-NN | reschedule ≤ 3 次 |
| Business Rule | BR-M07-NN | 30 min penalty / 單方取消 |
| Business Rule | BR-M16-NN | LINE Flex |
| ADR | ADR-0020 | non-LINE fallback (historical) |
| ADR | ADR-0045 | acceptance SLA |
| Domain Event | WorkOrderRescheduled | M19 BI |
| Domain Event | WorkOrderDelayed | SLA monitor |
| Domain Event | TechnicianPenaltyApplied | M07 weight |
| Domain Event | WorkOrderRescheduleRejected | re-dispatch |

## §4 Change Log

| Date | Change | Why |
|:-----|:-------|:----|
| 2026-05-10 | REQ-010→FR-0010 split | — |
| 2026-05-28 | **D5 殼 rewrite**：rule 搬 BR-M06/M07/M16-NN；補 §1 + 4 alt + 5 AC | Roundtable 2026-05-27 D5 |
