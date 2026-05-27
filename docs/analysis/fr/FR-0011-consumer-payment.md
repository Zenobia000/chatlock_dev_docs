---
id: FR-0011
title: 消費者付款（V1.0 升級！）
status: draft
phase: I
mapped_to:
  - M11    # Settlement / Voucher (primary)
  - M08    # Onsite (技師收款入口)
  - M17    # Audit
superseded_clauses:
  - BR-M11-NN    # 三軌支付 (cash / Apple Pay / Line Pay)
  - BR-M11-NN    # < 1000 不可分期 / ≥ 50000 強制簽章
  - BR-M11-NN    # Line Pay webhook idempotency
  - BR-M11-NN    # fallback 兩次嘗試 audit
  - BR-M11-NN    # 現金 dispute → disputes 表
emits_events:
  - PaymentReceived
  - PaymentFailed
  - PaymentDisputed
  - VoucherIssued
nfr_flavored: false
priority: P0
tier: 2
owner: 財務 / 技師主管 / Backend
last_reviewed: 2026-05-28
related_adrs:
  - ADR-0019    # V1.0 金流範圍 (historical)
  - ADR-VCH-001  # voucher keeper
  - ADR-VCH-002  # voucher 7y retention
blocked_by:
  - Q7=B  # provider 選型
legacy_id: REQ-011
trace_to_flow: F-011
last-synced-with: 4e9658e90324cbceb26f5e5445f481fc5678df1f
related:
  - "../../_source/01-workorder-erp.md#m11-結算"
---

# FR-0011 — 消費者付款（V1.0 升級！）

> **Migration**: 2026-05-28 改為 D5 殼結構（rule → BR）。Status: draft（待 provider 選型 Q7=B）。

## §1 Use Case Skeleton

| 欄位 | 內容 |
|:-----|:-----|
| **Actor** | 客戶 (pay), 技師 (collect) |
| **Secondary Actors** | M11 Voucher Keeper, Payment Provider (Line Pay / Apple Pay), M17 Audit |
| **Trigger** | WO `completed` → 觸發 invoice |
| **Precondition** | wo.amount > 0；payment_status = `pending` |
| **Main Flow** | 詳見 §1.1 → user-flow:S3-step5 |
| **Alternative Flow** | 詳見 §1.2 |
| **Postcondition** | wo.payment_status = `paid`；emit `PaymentReceived` + `VoucherIssued` |
| **Out-of-Scope** | 退款 (FR-0014)；月結技師 (FR-0012) |

### §1.1 Main Flow

1. 系統依 wo.amount 產 invoice
2. 客戶選付款方式（cash / Apple Pay / Line Pay）→ user-flow:S3-step5
3. 若金額 ≥ 50000 → 強制要求收據簽章 ([ref: BR-M11-NN high amount])
4. 系統呼叫 provider（[ref: BR-M11-NN 三軌])
5. 收款成功 → wo.payment_status = "paid"
6. emit `PaymentReceived` + `VoucherIssued` (voucher 保存 7y per ADR-VCH-002)
7. END

### §1.2 Alternative Flow

```
A1. Line Pay 失敗 fallback (第 4 步):
    A1.1 提示「Line Pay 失敗，改現金?」
    A1.2 客戶接受 → 走 cash 路徑
    A1.3 audit 完整記錄兩次嘗試 ([ref: BR-M11-NN fallback])
    A1.4 emit `PaymentFailed` (LinePay) + `PaymentReceived` (cash)

A2. webhook 重送 (任一步):
    A2.1 系統 idempotency key 偵測 ([ref: BR-M11-NN])
    A2.2 不重複扣款
    A2.3 200 OK

A3. 現金 dispute (第 5 步後):
    A3.1 客戶 / 技師回報金額不符
    A3.2 進 disputes 表
    A3.3 alert 主管
    A3.4 emit `PaymentDisputed`

A4. < 1000 試圖分期 (第 2 步):
    A4.1 系統 reject 分期 ([ref: BR-M11-NN])
    A4.2 提示「< 1000 不可分期」
```

## §2 Acceptance Criteria (G/W/T)

### AC-01: Happy path Line Pay

```gherkin
Given WO-001 amount = 3500
When 客戶選 Line Pay 並完成支付
Then wo.payment_status = "paid"
  And event `PaymentReceived` emit
  And `VoucherIssued` emit
```

### AC-02: 50000 強制簽章

```gherkin
Given wo.amount = 60000
When 客戶嘗試付款
Then 系統要求收據簽章
  And 缺簽章 → reject
```

### AC-03: Line Pay fallback cash

```gherkin
Given Line Pay 失敗
When 客戶改現金
Then audit 兩筆嘗試
  And emit `PaymentFailed` (LinePay)
  And emit `PaymentReceived` (cash)
```

### AC-04: Webhook 重送冪等

```gherkin
Given idempotency_key = "PAY-001"
When Line Pay 重送 webhook
Then 不重複扣款
  And response 200
```

### AC-05: < 1000 拒絕分期

```gherkin
Given wo.amount = 800
When 客戶選分期
Then 系統 reject
```

### AC-06: 現金 dispute

```gherkin
Given 現金收款後雙方金額不符
When 客戶在 24h 內 dispute
Then 寫入 disputes 表
  And emit `PaymentDisputed`
  And alert 主管
```

## §3 Reference Map

| 類型 | ID | 用途 |
|:-----|:---|:-----|
| Business Rule | BR-M11-NN | 三軌 / 高額簽章 / fallback / idempotency / dispute |
| ADR | ADR-VCH-001 | platform = voucher keeper |
| ADR | ADR-VCH-002 | voucher 7y |
| Domain Event | PaymentReceived | M12 monthly settlement |
| Domain Event | PaymentFailed | retry |
| Domain Event | PaymentDisputed | M15 exception |
| Domain Event | VoucherIssued | M17 |

## §4 Change Log

| Date | Change | Why |
|:-----|:-------|:----|
| 2026-05-10 | REQ-011→FR-0011 split | — |
| 2026-05-28 | **D5 殼 rewrite**：rule 搬 BR-M11-NN；補 §1 + 4 alt + 6 AC | Roundtable 2026-05-27 D5 |
