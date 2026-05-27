---
id: FR-0042
title: Quote 內外部視圖（客戶實收 vs 內部成本）
status: active
phase: I
mapped_to:
  - M04    # Pricing / Quote / Approval (primary)
  - M11    # Customer Payment (依 quote 產 invoice)
  - M17    # Audit (內部視圖權限)
superseded_clauses:
  - BR-M04-01    # 客戶只看實收總額；內部看成本拆分 (P0-1)
  - BR-M04-02    # 訂金規則：高金額 / 急件 / 新客戶
  - BR-M04-03    # 報價有效期：3/7/15/30 天 / 品牌規則
  - BR-M04-04    # AI 不可 final quote (P0-20 + ADR-0054 對齊)
  - BR-M04-05    # rule_version snapshot per quote (per ADR-0064 hash-chain)
emits_events:
  - QuoteCreated
  - QuoteApproved
  - QuoteRejected
  - QuoteExpired
nfr_flavored: false
priority: P0
tier: 2
owner: 客服主管 / 會計 / 主管
last_reviewed: 2026-05-28
related_adrs:
  - ADR-0054   # ai-quote-range-only
  - ADR-0062   # pricing-engine-bounded-context
  - ADR-0064   # quote-pricing-snapshot-hash-chain
  - ADR-0066   # quote-workorder-lifecycle-binding
  - ADR-0067   # M18 config (price table = runtime config)
related:
  - "../../_source/01-workorder-erp.md#m04-報價價格"
created_in: "Phase I — A3.4 ERP 缺漏補（M04 quote 流程未被既有 FR 涵蓋；FR-0011 只涵蓋付款執行）"
---

# FR-0042 — Quote 內外部視圖

> **Phase I 新增 (2026-05-28)** — M04 quote 核心 use case。非 user-facing chatbot FR；客戶 LINE 看到 quote summary 但 AI 不主導報價。

## §1 Use Case Skeleton

| 欄位 | 內容 |
|:-----|:-----|
| **Actor** | CSM / 主管 (create quote) / 會計 (approve high-amount) / 客戶 (LINE confirm) |
| **Secondary Actors** | M10 Product (price table source), M18 Config (rule_version), M11 Payment (downstream) |
| **Trigger** | (a) FR-0002 PC `Ready for Quote` → CSM 進報價；(b) FR-0008 scope change 觸發 re-quote |
| **Precondition** | PC confirmed + 必填齊全；price table (M10) + rule (M18) valid |
| **Main Flow** | 詳見 §1.1 |
| **Alternative Flow** | 詳見 §1.2 |
| **Postcondition** | quote row 落地 (含 internal cost split + external receivable)；emit `QuoteCreated`；客戶 confirm 後 `QuoteApproved` → 進 FR-0011 |
| **Out-of-Scope** | 付款執行 (FR-0011)；refund (FR-0014)；scope change (FR-0008) |

### §1.1 Main Flow

1. CSM 開 quote with PC reference
2. 系統依 M10 price table + M18 rule 計算內部成本 (material / labor / margin)
3. CSM 調整客戶實收金額（依 [ref: BR-M04-01] 客戶只看 total）
4. 系統 snapshot rule_version (per [ref: ADR-0064 hash-chain])
5. validate 訂金 / 有效期 ([ref: BR-M04-02/03])
6. 若高金額 → 強制主管 / 會計簽核
7. quote row 落地，emit `QuoteCreated`
8. LINE 推 quote summary 給客戶（**只顯示 total，不顯示成本拆分**）
9. 客戶 LINE confirm → emit `QuoteApproved`
10. 進 FR-0011 payment flow
11. END

### §1.2 Alternative Flow

```
A1. 客戶 reject quote (第 9 步):
    A1.1 emit `QuoteRejected`
    A1.2 CSM 可修改 + 重發 (走 §1.1 第 3 步)
    A1.3 或進 cancellation flow (依 ADR-0039 取消費 — REVIEW_REQUIRED)

A2. Quote 有效期到 (cron):
    A2.1 quote_status → "expired"
    A2.2 emit `QuoteExpired`
    A2.3 客戶若仍想成交 → CSM 重發新 quote (新 rule_version)

A3. AI 試圖 final quote (anti-pattern):
    A3.1 [ref: BR-M04-04 = ADR-0054] AI 只能給 range
    A3.2 A05 guardrails (FR-0030) 攔截
    A3.3 final quote 必須走 CSM / 人工

A4. Rule version 變動但舊 quote 仍 active:
    A4.1 [ref: ADR-0064 hash-chain]
    A4.2 舊 quote 保留原 rule_version (snapshot per quote)
    A4.3 新 quote 用新 rule_version
    A4.4 audit log 紀錄 rule_version 切換 (M18 config change cascade)

A5. 內部視圖權限攔截 (第 2 步):
    A5.1 [ref: BR-M04-01] 客戶角色看 internal cost → 403
    A5.2 audit log + alert

A6. 客戶端 LINE quote summary 顯示 (第 8 步):
    A6.1 [ref: BR-M04-01] 只顯示 total 實收
    A6.2 不顯示 material / labor / margin 拆分
    A6.3 含 "明細請洽客服" 連結 (CSM 可代查)

A7. 高金額簽核流程 (第 6 步):
    A7.1 金額 ≥ X (per M18 config) → 主管簽
    A7.2 金額 ≥ Y → 主管 + 會計雙簽
    A7.3 卡在 pending_approval 直到簽完
```

## §2 Acceptance Criteria (G/W/T)

### AC-01: Happy path quote 建立

```gherkin
Given PC PC-001 confirmed
When CSM 開 quote with total=3000 (internal: material=800, labor=1500, margin=700)
Then quote 落地含 internal split
  And event `QuoteCreated` emit
  And LINE 推給客戶**只顯示 total=3000**
```

### AC-02: 客戶只看 total

```gherkin
Given quote Q-001 created
When 客戶在 LINE 看 quote summary
Then 顯示 total=3000
  And **不**顯示 material / labor / margin 拆分
  And 含「明細請洽客服」連結
```

### AC-03: Rule version snapshot per quote

```gherkin
Given M18 config rule v3 active
When quote 建立
Then quote.rule_version = v3 ([ref: ADR-0064])

Given 後續 M18 config 升 v4
When 查舊 quote Q-001
Then 仍顯示原 v3 計算結果 (not re-calculate)
```

### AC-04: AI quote 攔截

```gherkin
Given AI 在 LINE 對話中試圖給「final quote 3000」
When A05 guardrails check
Then 攔截 + emit guardrail violation
  And AI 改回「我幫您接客服報價」
```

### AC-05: 客戶 reject + 重發

```gherkin
Given Q-001 sent to customer
When 客戶 LINE reject
Then emit `QuoteRejected`
  And CSM 可修改 + 重發 Q-002
```

### AC-06: Quote 有效期 expire

```gherkin
Given Q-001 有效期 7 天
When 7 天後客戶仍未 confirm
Then cron 自動 expire
  And emit `QuoteExpired`
```

### AC-07: 高金額雙簽

```gherkin
Given quote total = 50000 (per M18 config 需主管 + 會計雙簽)
When CSM 提交
Then status = "pending_approval"
  And 主管 + 會計都簽完 → emit `QuoteApproved`
  And 缺一方 → 不可進 FR-0011 payment
```

### AC-08: 內部視圖權限 RBAC

```gherkin
Given user 角色 = "customer_facing"
When 嘗試 query quote internal_cost field
Then 403 forbidden ([ref: BR-M04-01])
  And audit + alert security
```

## §3 Reference Map

| 類型 | ID | 用途 |
|:-----|:---|:-----|
| BR | BR-M04-01~05 | 內外部視圖 / 訂金 / 有效期 / AI 邊界 / version snapshot |
| ADR | ADR-0054 / 0062 / 0064 / 0066 / 0067 | quote range / bounded context / hash chain / lifecycle / M18 config |
| Domain Event | QuoteCreated/Approved/Rejected/Expired | M11 + audit |
| Source spec | `docs/_source/01-workorder-erp.md#m04-報價價格` | M04 |

## §4 Change Log

| Date | Change | Why |
|:-----|:-------|:----|
| 2026-05-28 | **新建** A3.4 ERP 缺漏補 (M04 quote) | Roundtable A D5 |
