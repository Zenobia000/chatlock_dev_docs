---
id: FR-0040
title: Sync — Evidence 回寫（photo / sign / completion / payment）
status: active
phase: I
mapped_to:
  - S-M06    # Evidence 回寫
  - M09     # Evidence
  - M08     # Onsite
superseded_clauses:
  - BR-S-M06-01    # 照片 / 簽名 / 完工 / 付款證明回寫
  - BR-S-M06-02    # outbox + retry
  - BR-S-M06-NN    # RMA / 爭議 visibility (ADR-0050)
emits_events:
  - EvidenceWrittenBack
  - EvidenceWritebackFailed
nfr_flavored: false
priority: P0
tier: 2
owner: 技師主管 / Backend
last_reviewed: 2026-05-28
related_adrs:
  - ADR-0050    # evidence visibility matrix
  - ADR-0051    # retention
related:
  - "../../_source/02-ai-chatbot-sync.md#s-m06-evidence回寫"
---

# FR-0040 — Sync Evidence 回寫

> **新增 FR (2026-05-28)** — S-M06。Phase I。

## §1 Use Case Skeleton

| 欄位 | 內容 |
|:-----|:-----|
| **Actor** | 技師 / 客戶 (signature) |
| **Secondary Actors** | M09 Evidence store, Outbox |
| **Trigger** | FR-0006 / FR-0009 / FR-0011 emit evidence event |
| **Precondition** | WO active |
| **Main Flow** | 詳見 §1.1 |
| **Alternative Flow** | 詳見 §1.2 |
| **Postcondition** | M09 evidence row 落地；emit `EvidenceWrittenBack` |

### §1.1 Main Flow

1. 收 `EvidenceUploaded` / `WorkOrderCompleted` / `PaymentReceived`
2. push 到 M09 evidence store with WO link
3. emit `EvidenceWrittenBack`
4. END

### §1.2 Alternative Flow

```
A1. M09 5xx:
    A1.1 Outbox retry
    A1.2 emit `EvidenceWritebackFailed`

A2. Visibility (per ADR-0050):
    A2.1 RMA / 爭議 evidence 走特殊 visibility
```

## §2 Acceptance Criteria

### AC-01: photo writeback

```gherkin
When EvidenceUploaded
Then M09 row 落地 + `EvidenceWrittenBack`
```

### AC-02: completion writeback

```gherkin
When WorkOrderCompleted
Then 完工照 + signature 入 M09
```

### AC-03: fail-soft

```gherkin
Given M09 5xx
Then Outbox retry + `EvidenceWritebackFailed`
```

## §3 Reference Map

| 類型 | ID | 用途 |
|:-----|:---|:-----|
| BR | BR-S-M06-01/02/NN | sync / retry / visibility |
| ADR | ADR-0050/0051 | visibility / retention |
| Event | EvidenceWrittenBack / WritebackFailed | — |

## §4 Change Log

| Date | Change |
|:-----|:-------|
| 2026-05-28 | **新建** — S-M06 module FR 殼 |
