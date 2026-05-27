---
id: FR-0014
title: 退款流程（5-tier + SoD 三維）
status: active
phase: I
mapped_to:
  - M11    # Settlement
  - M15    # Exception
  - M17    # Audit
superseded_clauses:
  - BR-REFUND-001    # 5-tier approval (L1-L5) + partial 分類
  - BR-REFUND-002    # 7 種 audit event 必留
  - BR-REFUND-003    # reject 後 approve → 409 terminal_state
  - BR-REFUND-004    # work_order_id / complaint_id 必填
  - BR-REFUND-005    # LINE 通知失敗 audit + retry
  - BR-REFUND-006    # SoD 三維（initiator / approver / executor）
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
  - ADR-0040    # refund-approval-tiers v2 (PARTIAL_UPDATE 2026-05-28)
legacy_id: REQ-014
trace_to_flow: F-014
last-synced-with: 4e9658e90324cbceb26f5e5445f481fc5678df1f
related:
  - "../../_source/01-workorder-erp.md#m15-exception"
---

# FR-0014 — 退款流程

> **Migration**: 2026-05-28 D5 殼 + 5-tier 恢復 + SoD 三維（ADR-0040 v2 PARTIAL_UPDATE）。

## §1 Use Case Skeleton

| 欄位 | 內容 |
|:-----|:-----|
| **Actor** | initiator: CSM / approver: 主管 (L1-L5) / executor: 系統 + 財務 |
| **Secondary Actors** | M17 Audit, Payment Provider, M16 Comms |
| **Trigger** | 客戶投訴需退款 (FR-0013 dispute → refund) |
| **Precondition** | wo_id + complaint_id 都存在 ([ref: BR-REFUND-004]) |
| **Main Flow** | §1.1 |
| **Alternative Flow** | §1.2 |
| **Postcondition** | refund row 落地 + 7 audit event + 三角色 ID 全記錄 |

### §1.1 Main Flow

1. **initiator** (CSM) 提交 refund request → user-flow:S4-step8
2. emit `RefundRequested`（audit + initiator_id）
3. 系統依金額 + partial category 分流 5-tier ([ref: BR-REFUND-001])：
   - L1 ≤ NTD 10,000：會計單簽
   - L2 ≤ NTD 50,000：客服主管單簽
   - L3 ≤ NTD 100,000：ops_manager 單簽
   - L4 ≤ NTD 500,000：ops_manager + finance 雙簽
   - L5 > NTD 500,000 或 > 年收 1%：L5 Sponsor + finance 雙簽
4. **approver** 簽核（系統強制 initiator_id ≠ approver_id, [ref: BR-REFUND-006]）
5. emit `RefundApproved`（audit + approver_id）
6. **executor** = 系統 service account 呼叫 Payment Provider execute（audit 寫入觸發人）
7. emit `RefundExecuted`
8. M16 LINE 通知客戶
9. END

### §1.2 Alternative Flow

```
A1. 缺 work_order_id / complaint_id (step 1):
    A1.1 回 422 ([ref: BR-REFUND-004])

A2. partial refund 未分類 (step 3):
    A2.1 回 422 必填 product / labor / material / travel / inspection 其一 ([ref: BR-REFUND-001])

A3. initiator = approver 嘗試自簽:
    A3.1 回 409 sod_violation ([ref: BR-REFUND-006])

A4. tier 不符試圖越級簽核 (例 L1 用戶簽 L3 金額):
    A4.1 reject + 要求上級 ([ref: BR-REFUND-001])

A5. Reject 後 approve 嘗試 (任一步):
    A5.1 回 409 terminal_state ([ref: BR-REFUND-003])

A6. LINE 通知失敗 (step 8):
    A6.1 audit + retry queue ([ref: BR-REFUND-005])
    A6.2 主流程不卡
    A6.3 emit `RefundNotificationFailed`
```

## §2 Acceptance Criteria

### AC-01: L1 ≤ 10k 會計單簽

```gherkin
Given refund amount = 8000, initiator = CSM-A
When 會計 approve（approver ≠ CSM-A）
Then 通過 + `RefundApproved` emit
  → BR-REFUND-001
```

### AC-02: L2 ≤ 50k 客服主管單簽

```gherkin
Given refund amount = 40000
When 客服主管 approve
Then 通過
  → BR-REFUND-001
```

### AC-03: L3 ≤ 100k ops_manager 單簽

```gherkin
Given refund amount = 90000
When ops_manager approve
Then 通過
  → BR-REFUND-001
```

### AC-04: L4 ≤ 500k 雙簽

```gherkin
Given refund amount = 300000
When ops_manager 單簽
Then reject + 要求 finance co-sign
  → BR-REFUND-001
```

### AC-05: L5 > 500k 或 > 年收 1% L5 Sponsor + finance

```gherkin
Given refund amount = 600000
When ops_manager + finance 雙簽
Then reject + 要求 L5 Sponsor 簽核
  → BR-REFUND-001
```

### AC-06: SoD initiator ≠ approver

```gherkin
Given initiator_id = U-001
When approver_id = U-001 試圖自簽
Then 409 sod_violation
  → BR-REFUND-006
```

### AC-07: SoD executor audit 寫觸發人

```gherkin
Given refund approved by U-002
When 系統 service account 執行 Payment Provider
Then audit row 含 initiator / approver / executor_service_account / triggered_by_user
  → BR-REFUND-006
```

### AC-08: partial 必須分類

```gherkin
Given partial refund 提交無 category
Then 422 category_required (product / labor / material / travel / inspection)
  → BR-REFUND-001
```

### AC-09: 缺欄位

```gherkin
When 提交不含 wo_id
Then 422 field_required
  → BR-REFUND-004
```

### AC-10: Reject 後 approve

```gherkin
Given refund rejected
When 再嘗試 approve
Then 409 terminal_state
  → BR-REFUND-003
```

### AC-11: LINE 通知失敗 fail-soft

```gherkin
Given LINE timeout
When `RefundExecuted` 後通知
Then audit + retry queue
  And 主流程不卡
  And `RefundNotificationFailed` emit
  → BR-REFUND-005
```

## §3 Reference Map

| 類型 | ID | 用途 |
|:-----|:---|:-----|
| BR | BR-REFUND-001 | 5-tier + partial 分類 |
| BR | BR-REFUND-002 | 7 audit event |
| BR | BR-REFUND-003 | terminal state |
| BR | BR-REFUND-004 | 必填欄位 |
| BR | BR-REFUND-005 | LINE retry |
| BR | BR-REFUND-006 | **SoD 三維** |
| ADR | ADR-0040 | refund-approval-tiers v2 |
| Event | RefundRequested / Approved / Rejected / Executed / NotificationFailed | — |

## §4 Change Log

| Date | Change |
|:-----|:-------|
| 2026-05-10 | REQ-014→FR-0014 |
| 2026-05-28 | D5 殼 rewrite |
| 2026-05-28 | **5-tier 恢復 (L1-L5) + SoD 三維 acceptance**（套 BR-REFUND-006，移除舊 2-tier ≤100k/>100k 描述，補 partial 分類 AC）by value-decisions Q4 PARTIAL_UPDATE |
