---
id: FR-0031
title: ProblemCard Bridge — 自動建立問題卡（A06 → Admin API）
status: active
phase: I
mapped_to:
  - A06    # ProblemCard (chatbot side)
  - M03    # ProblemCard (ERP side)
superseded_clauses:
  - BR-A06-01    # facts 有 brand + 症狀足夠 → Admin API create
  - BR-A06-02    # 主要輸出 ProblemCard
  - BR-A06-NN    # idempotency by conversation_id
  - BR-A06-NN    # ProblemCard draft → confirmed 流程（cross with FR-0002）
emits_events:
  - ProblemCardCreatedByA06
  - ProblemCardSyncFailed
nfr_flavored: false
priority: P0
tier: 1
owner: AI Specialist / ERP backend
last_reviewed: 2026-05-28
related_adrs:
  - ADR-0009    # Agent ↔ Admin Bridge (REVIEW_REQUIRED)
  - ADR-0033    # ProblemCard completeness gate
  - ADR-0036    # 同 conversation 多 PC 規則
related:
  - "../../_source/02-ai-chatbot-sync.md#a-m06-problemcard"
---

# FR-0031 — ProblemCard Bridge

> **新增 FR (2026-05-28)** — 對應 A06 module（Phase I per Q2=C）。

## §1 Use Case Skeleton

| 欄位 | 內容 |
|:-----|:-----|
| **Actor** | A06 Bridge service |
| **Secondary Actors** | A03 (source), M03 ERP ProblemCard, Outbox |
| **Trigger** | A03 facts 達 completeness threshold OR FR-0002 status="Ready for Quote" |
| **Precondition** | conversation_id + brand + 症狀齊備 |
| **Main Flow** | 詳見 §1.1 → user-flow:A06-step1 |
| **Alternative Flow** | 詳見 §1.2 |
| **Postcondition** | ERP ProblemCard 落地；emit `ProblemCardCreatedByA06` |

### §1.1 Main Flow

1. A06 偵測 facts ready → user-flow:A06-step1
2. 呼叫 ERP Admin API `POST /api/v2/problem-cards`
3. 含 idempotency_key = conversation_id ([ref: BR-A06-NN])
4. ERP M03 建立 PC
5. emit `ProblemCardCreatedByA06`
6. A03 通知客戶「已建立 #PC-001」
7. END

### §1.2 Alternative Flow

```
A1. Admin API 5xx:
    A1.1 Outbox 紀錄 (ADR-0029 fail-soft)
    A1.2 retry exponential backoff
    A1.3 emit `ProblemCardSyncFailed`

A2. Idempotency 衝突 (重複呼叫):
    A2.1 ERP 回傳既有 PC
    A2.2 A06 不重複 emit

A3. PC completeness < threshold:
    A3.1 不建 PC，回 A03 補資訊
```

## §2 Acceptance Criteria

### AC-01: Happy path

```gherkin
Given facts 含 brand + 症狀
When A06 觸發
Then ERP PC 建立 + `ProblemCardCreatedByA06`
```

### AC-02: Idempotency

```gherkin
When 同 conversation_id 重複呼叫
Then 回既有 PC + 不重複 event
```

### AC-03: 5xx retry

```gherkin
Given Admin API 5xx
Then Outbox + retry + `ProblemCardSyncFailed`
```

### Example Dialogue (A3.6)

**Scenario 1: facts ready → 自動建 PC**

[A03 累積 facts: brand=Samsung, model=SHS-P718, symptom=鎖芯卡住, address=...]
[A06 觸發 ERP Admin API]
AI: 我已幫您建立報修單 #PC-2026-001。客服將於工作時間（09:00~18:00）為您安排技師。
Result: → `ProblemCardCreatedByA06`

A11y variant:
- 報修單號用 `<strong>` + aria-label="報修單編號"
- 「客服將安排」訊息 ARIA role="status"

**Scenario 2: Admin API fail-soft**

[A03 facts ready, A06 觸發 ERP, ERP 5xx]
[Outbox 紀錄]
AI: 我已收到您的問題並紀錄，客服系統正在處理。如未在 30 分鐘內收到確認，請再次傳訊提醒我。
Result: → `ProblemCardSyncFailed`, Outbox retry，客戶端無中斷

A11y variant:
- 「正在處理」aria-live="polite"
- 提供「未收到？再次提醒」button

**Scenario 3: 多 PC unique constraint**

[同 conversation 已有 PC-001 active, A06 偵測新症狀]
AI: 我注意到您剛才提到的是新症狀，請問是新的問題嗎？還是跟剛才提到的問題相關？
User: 新的問題
[A06 建 PC-002，PC-001 仍 active per ADR-0036]
Result: → ProblemCard.PC-002 建立

A11y variant:
- 詢問句後接 Yes/No button group
- screen reader 讀「新問題?」「相關?」

## §3 Reference Map

| 類型 | ID | 用途 |
|:-----|:---|:-----|
| BR | BR-A06-01/02/NN | core / output / idempotency / draft confirm |
| ADR | ADR-0009/0033/0036 | bridge / gate / multi-PC |
| Event | ProblemCardCreatedByA06 / SyncFailed | — |

## §4 Change Log

| Date | Change |
|:-----|:-------|
| 2026-05-28 | **新建** — A06 module FR 殼 + A3.6 dialogue |
