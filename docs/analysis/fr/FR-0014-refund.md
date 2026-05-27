---
id: FR-0014
title: 退款流程
status: draft
phase: I
mapped_to:
  - M11    # Settlement
  - M15    # Exception
  - M17    # Audit
superseded_clauses:
  - BR-REFUND-001    # ≤ 100k 單簽 / > 100k 雙簽
  - BR-REFUND-002    # 7 種 audit event 必留
  - BR-REFUND-003    # reject 後 approve → 409 terminal_state
  - BR-REFUND-004    # work_order_id / complaint_id 必填
  - BR-REFUND-005    # LINE 通知失敗 audit + retry
emits_events:
  - RefundRequested
  - RefundApproved
  - RefundRejected
  - RefundExecuted
  - RefundNotificationFailed
nfr_flavored: false
priority: P0
tier: 2
owner: CSM / 財務
last_reviewed: 2026-05-28
related_adrs:
  - ADR-0040    # refund-approval-tiers
blocked_by:
  - Q7=B
legacy_id: REQ-014
trace_to_flow: F-014
last-synced-with: 4e9658e90324cbceb26f5e5445f481fc5678df1f
related:
  - "../../_source/01-workorder-erp.md#m15-exception"
---

# FR-0014 — 退款流程

> **Migration**: 2026-05-28 改為 D5 殼結構（rule → BR）。Status: draft (Q7=B)。

## §1 Use Case Skeleton

| 欄位 | 內容 |
|:-----|:-----|
| **Actor** | CSM (initiate) / ops_manager (co-sign if > 100k) |
| **Secondary Actors** | M17 Audit, Payment Provider |
| **Trigger** | 客戶投訴需退款 (FR-0013 dispute → refund) |
| **Precondition** | wo_id + complaint_id 都存在 ([ref: BR-REFUND-004]) |
| **Main Flow** | 詳見 §1.1 → user-flow:S4-step8 |
| **Alternative Flow** | 詳見 §1.2 |
| **Postcondition** | refund row 落地 + 7 種 audit event |

### §1.1 Main Flow

1. CSM 提交 refund request → user-flow:S4-step8
2. emit `RefundRequested`
3. 系統依金額分流：≤ 100k 單簽 / > 100k 雙簽（[ref: BR-REFUND-001]）
4. 簽核完成 → emit `RefundApproved`
5. 系統呼叫 Payment Provider execute refund
6. emit `RefundExecuted`
7. M16 LINE 通知客戶
8. END

### §1.2 Alternative Flow

```
A1. 缺 work_order_id / complaint_id (第 1 步):
    A1.1 回 422 ([ref: BR-REFUND-004])

A2. > 100k 試圖單簽:
    A2.1 reject + 要求雙簽

A3. Reject 後 approve 嘗試 (任一步):
    A3.1 回 409 terminal_state ([ref: BR-REFUND-003])

A4. LINE 通知失敗 (第 7 步):
    A4.1 audit + retry queue ([ref: BR-REFUND-005])
    A4.2 主流程不卡
    A4.3 emit `RefundNotificationFailed`
```

## §2 Acceptance Criteria

### AC-01: ≤ 100k 單簽

```gherkin
Given refund amount = 50000
When CSM approve
Then 通過 + `RefundApproved` emit
```

### AC-02: > 100k 雙簽

```gherkin
Given refund amount = 100001
When CSM 單簽
Then reject + 要求 ops_manager co-sign
```

### AC-03: 缺欄位

```gherkin
When 提交不含 wo_id
Then 422 field_required
```

### AC-04: Reject 後 approve

```gherkin
Given refund rejected
When 再嘗試 approve
Then 409 terminal_state
```

### AC-05: LINE 通知失敗 fail-soft

```gherkin
Given LINE timeout
When `RefundExecuted` 後通知
Then audit + retry queue
  And 主流程不卡
  And `RefundNotificationFailed` emit
```

## §3 Reference Map

| 類型 | ID | 用途 |
|:-----|:---|:-----|
| BR | BR-REFUND-001~005 | tier / audit / terminal / 必填 / retry |
| ADR | ADR-0040 | refund-approval-tiers |
| Event | RefundRequested/Approved/Rejected/Executed/NotificationFailed | — |

## §4 Change Log

| Date | Change |
|:-----|:-------|
| 2026-05-10 | REQ-014→FR-0014 |
| 2026-05-28 | **D5 殼 rewrite** |
