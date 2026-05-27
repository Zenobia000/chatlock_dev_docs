---
id: FR-0039
title: Sync — Dispatch 同步（WO created → 派工 queue）
status: active
phase: I
mapped_to:
  - S-M05    # Dispatch 同步
  - M06     # Dispatch
superseded_clauses:
  - BR-S-M05-01    # WO created 後進派工 queue / 候選 / SLA
  - BR-S-M05-02    # retry / outbox / audit
  - BR-S-M05-NN    # no candidates fallback
emits_events:
  - DispatchQueued
  - DispatchSyncFailed
nfr_flavored: false
priority: P0
tier: 1
owner: 派工主管 / Backend
last_reviewed: 2026-05-28
related_adrs:
  - ADR-0029    # fail-soft three-pack
related:
  - "../../_source/02-ai-chatbot-sync.md#s-m05-dispatch同步"
---

# FR-0039 — Sync Dispatch 同步

> **新增 FR (2026-05-28)** — S-M05。Phase I。

## §1 Use Case Skeleton

| 欄位 | 內容 |
|:-----|:-----|
| **Actor** | Sync worker |
| **Secondary Actors** | M06 Dispatch queue, FR-0003 |
| **Trigger** | `WorkOrderConverted` (FR-0038) |
| **Precondition** | WO with address valid |
| **Main Flow** | 詳見 §1.1 |
| **Alternative Flow** | 詳見 §1.2 |
| **Postcondition** | dispatch queue 入隊；emit `DispatchQueued` |

### §1.1 Main Flow

1. 收 `WorkOrderConverted`
2. push 進 M06 dispatch queue
3. 進 FR-0003 auto-dispatch
4. emit `DispatchQueued`
5. END

### §1.2 Alternative Flow

```
A1. M06 5xx:
    A1.1 Outbox retry
    A1.2 emit `DispatchSyncFailed`

A2. no candidates fallback (進 FR-0003 A1):
    A2.1 emit `DispatchPending` (FR-0003)
```

## §2 Acceptance Criteria

### AC-01: queue sync

```gherkin
When WorkOrderConverted
Then dispatch queue 入隊 + `DispatchQueued`
```

### AC-02: fail-soft

```gherkin
Given M06 5xx
Then Outbox retry + `DispatchSyncFailed`
```

## §3 Reference Map

| 類型 | ID | 用途 |
|:-----|:---|:-----|
| BR | BR-S-M05-01/02/NN | sync / retry / fallback |
| ADR | ADR-0029 | fail-soft |
| Event | DispatchQueued / SyncFailed | — |

## §4 Change Log

| Date | Change |
|:-----|:-------|
| 2026-05-28 | **新建** — S-M05 module FR 殼 |
