---
id: FR-0009
title: 完工簽名 + 雙方確認
status: active
phase: I
mapped_to:
  - M08    # Onsite (primary)
  - M09    # Evidence (e-signature)
  - M16    # Comms (LINE Flex Message)
superseded_clauses:
  - BR-M08-NN    # 完工照不足 3 張阻擋
  - BR-M08-NN    # 48h 未確認 auto-confirmed
  - BR-M09-NN    # e-signature schema (signature_data 必填)
  - BR-M08-NN    # 完工後修改 → scope change
emits_events:
  - WorkOrderCompleted
  - CustomerConfirmedCompletion
  - AutoConfirmedAfterTimeout
nfr_flavored: false
priority: P0
tier: 2
owner: 技師主管 / 客服 / Backend
last_reviewed: 2026-05-28
related_adrs:
  - ADR-0049    # onsite-scope-change-protocol
  - ADR-0050    # evidence-visibility-matrix
  - ADR-0066    # quote-workorder-lifecycle-binding
legacy_id: REQ-009
trace_to_flow: F-009
last-synced-with: 4e9658e90324cbceb26f5e5445f481fc5678df1f
related:
  - "../../_source/01-workorder-erp.md#m08-現場"
---

# FR-0009 — 完工簽名 + 雙方確認

> **Migration**: 2026-05-28 改為 D5 殼結構（rule → BR）。

## §1 Use Case Skeleton

| 欄位 | 內容 |
|:-----|:-----|
| **Actor** | 技師 (sign), 客戶 (confirm) |
| **Secondary Actors** | M09 Evidence, M16 Comms (LINE Flex), Backend (timeout cron) |
| **Trigger** | 技師完工後 APP 內 tap "完工簽名" |
| **Precondition** | WO `in_progress`；完工照 ≥ 3 張 (FR-0006)；signature canvas 已收集 |
| **Main Flow** | 詳見 §1.1 → user-flow:S3-step1 |
| **Alternative Flow** | 詳見 §1.2 |
| **Postcondition** | wo.signatures 已寫入；emit `WorkOrderCompleted`；客戶確認後 emit `CustomerConfirmedCompletion` |
| **Out-of-Scope** | 對帳爭議 (FR-0013)；報帳 (FR-0012) |

### §1.1 Main Flow

1. 技師 APP 內 tap "完工簽名" → user-flow:S3-step1
2. 系統檢查 完工照 ≥ 3 張 + signature canvas 不空（[ref: BR-M08-NN]）
3. 寫 wo.signatures.technician (signature_data, timestamp, geo)
4. WO transition `awaiting_customer_confirmation`
5. emit `WorkOrderCompleted` (initial)
6. M16 推 LINE Flex Message「確認完工」按鈕給客戶
7. 客戶 tap → 寫 wo.signatures.customer
8. emit `CustomerConfirmedCompletion`
9. WO transition `completed`
10. END

### §1.2 Alternative Flow

```
A1. 完工照不足 (第 2 步):
    A1.1 回 422 photo_count_insufficient
    A1.2 不寫 signature

A2. signature 缺欄位 (第 2 步):
    A2.1 回 422 invalid_signature
    A2.2 提示「請重新簽名」

A3. 客戶 48h 未確認 (Auto-confirm cron):
    A3.1 系統 cron 偵測 awaiting_customer_confirmation > 48h
    A3.2 自動標記 confirmed
    A3.3 wo.signatures.customer = "auto-confirmed"
    A3.4 audit 標 reason="timeout_auto_confirm"
    A3.5 emit `AutoConfirmedAfterTimeout`
    A3.6 WO transition `completed`

A4. 完工後修改 (第 9 步後):
    A4.1 拒絕直接修改
    A4.2 必須走 FR-0008 scope change 流程
    A4.3 提示「請開新 ChangeRequest」
```

## §2 Acceptance Criteria (G/W/T)

### AC-01: Happy path 雙簽

```gherkin
Given WO-001 完工照 ≥ 3 張
When 技師簽名 + 客戶 tap "確認"
Then wo.signatures 雙方寫入
  And event `WorkOrderCompleted` emit
  And event `CustomerConfirmedCompletion` emit
  And WO = "completed"
```

### AC-02: 照片不足

```gherkin
Given WO-001 完工照 = 2 張
When 技師簽名
Then 回 422 photo_count_insufficient
```

### AC-03: signature schema invalid

```gherkin
When 技師提交空 signature_data
Then 回 422 invalid_signature
```

### AC-04: 48h auto-confirm

```gherkin
Given WO-001 awaiting_customer_confirmation 48h
When cron 跑
Then wo.signatures.customer = "auto-confirmed"
  And audit reason = "timeout_auto_confirm"
  And event `AutoConfirmedAfterTimeout` emit
```

### AC-05: 完工後修改 → scope change

```gherkin
Given WO-001 = "completed"
When 技師嘗試修改 quote
Then 系統拒絕
  And 提示「請走 FR-0008 ChangeRequest 流程」
```

## §3 Reference Map

| 類型 | ID | 用途 |
|:-----|:---|:-----|
| Business Rule | BR-M08-NN | 完工照數 / auto-confirm / 修改禁止 |
| Business Rule | BR-M09-NN | e-signature schema |
| ADR | ADR-0049 | scope change protocol |
| ADR | ADR-0050 | evidence visibility |
| ADR | ADR-0066 | quote-WO lifecycle binding |
| Domain Event | WorkOrderCompleted | M11 settlement / M13 warranty |
| Domain Event | CustomerConfirmedCompletion | M11 |
| Domain Event | AutoConfirmedAfterTimeout | audit |
| Source spec | `docs/_source/01-workorder-erp.md#m08-現場` | M08 原始定義 |

## §4 Change Log

| Date | Change | Why |
|:-----|:-------|:----|
| 2026-05-10 | REQ-009→FR-0009 split | — |
| 2026-05-28 | **D5 殼 rewrite**：rule 搬 BR-M08/M09-NN；補 §1 skeleton + 4 alt + 5 AC | Roundtable 2026-05-27 D5 |
