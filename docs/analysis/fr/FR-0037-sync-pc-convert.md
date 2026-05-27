---
id: FR-0037
title: Sync — ProblemCard 轉換（chatbot ↔ ERP）
status: active
phase: I
mapped_to:
  - S-M03    # ProblemCard 轉換
  - M03     # ERP ProblemCard
  - A06     # chatbot ProblemCard
superseded_clauses:
  - BR-S-M03-01    # symptom / brand / model / category / urgency / media_urls 建卡
  - BR-S-M03-02    # complete gate
  - BR-S-M03-NN    # outbox + retry
emits_events:
  - ProblemCardSynced
  - ProblemCardSyncRejected
nfr_flavored: false
priority: P0
tier: 1
owner: ERP backend / AI Specialist
last_reviewed: 2026-05-28
related_adrs:
  - ADR-0033    # completeness gate
related:
  - "../../_source/02-ai-chatbot-sync.md#s-m03-problemcard轉換"
---

# FR-0037 — Sync ProblemCard 轉換

> **新增 FR (2026-05-28)** — S-M03。Phase I。

## §1 Use Case Skeleton

| 欄位 | 內容 |
|:-----|:-----|
| **Actor** | A06 Bridge / FR-0031 |
| **Secondary Actors** | ERP M03, Outbox |
| **Trigger** | A06 facts ready |
| **Precondition** | completeness_score ≥ threshold (ADR-0033) |
| **Main Flow** | 詳見 §1.1 |
| **Alternative Flow** | 詳見 §1.2 |
| **Postcondition** | ERP problem_cards 落地；emit `ProblemCardSynced` |

### §1.1 Main Flow

1. A06 emit `ProblemCardCreatedByA06` (FR-0031)
2. Sync worker push ERP M03
3. emit `ProblemCardSynced`
4. END

### §1.2 Alternative Flow

```
A1. completeness < threshold (gate):
    A1.1 ERP 拒絕 sync
    A1.2 emit `ProblemCardSyncRejected`

A2. ERP 5xx:
    A2.1 Outbox retry

A3. Idempotency:
    A3.1 同 conversation_id 不重 sync
```

## §2 Acceptance Criteria

### AC-01: Happy sync

```gherkin
When A06 trigger
Then ERP PC 落地 + `ProblemCardSynced`
```

### AC-02: Gate

```gherkin
Given completeness < 0.85
Then `ProblemCardSyncRejected`
```

### AC-03: Idempotency

```gherkin
When 同 conversation_id 重 sync
Then 不重複
```

## §3 Reference Map

| 類型 | ID | 用途 |
|:-----|:---|:-----|
| BR | BR-S-M03-01/02/NN | sync / gate / retry |
| ADR | ADR-0033 | completeness gate |
| Event | ProblemCardSynced / SyncRejected | — |

## §4 Change Log

| Date | Change |
|:-----|:-------|
| 2026-05-28 | **新建** — S-M03 module FR 殼 |
