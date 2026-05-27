---
id: FR-0035
title: Sync — Intake 資料捕捉（LINE/user turn → 結構化）
status: active
phase: I
mapped_to:
  - S-M01    # Intake 資料捕捉
  - M01     # ERP customer intake
superseded_clauses:
  - BR-S-M01-01    # 從 LINE / user turn 萃取
  - BR-S-M01-02    # 同步失敗可重試 / outbox / audit
  - BR-S-M01-NN    # 不要直接開 WO (gate)
emits_events:
  - IntakeCaptured
  - IntakeSyncFailed
nfr_flavored: false
priority: P0
tier: 1
owner: 客服 / AI / Backend
last_reviewed: 2026-05-28
related_adrs:
  - ADR-0029    # fail-soft-three-pack
related:
  - "../../_source/02-ai-chatbot-sync.md#s-m01-intake資料捕捉"
---

# FR-0035 — Sync Intake 資料捕捉

> **新增 FR (2026-05-28)** — S-M01。Phase I。

## §1 Use Case Skeleton

| 欄位 | 內容 |
|:-----|:-----|
| **Actor** | A03 (source) |
| **Secondary Actors** | ERP M01, Outbox |
| **Trigger** | merged turn 含 channel + raw_text + media_ref |
| **Precondition** | conversation_id valid |
| **Main Flow** | 詳見 §1.1 → user-flow:S-M01-step1 |
| **Alternative Flow** | 詳見 §1.2 |
| **Postcondition** | ERP M01 收 intake row；emit `IntakeCaptured` |

### §1.1 Main Flow

1. A03 提取 channel + raw_text + media_ref → user-flow:S-M01-step1
2. 寫 Outbox row（含 idempotency_key）
3. Sync worker 推到 ERP M01
4. emit `IntakeCaptured`
5. END

### §1.2 Alternative Flow

```
A1. ERP 5xx (任一同步):
    A1.1 Outbox 留 + retry (ADR-0029)
    A1.2 emit `IntakeSyncFailed`

A2. Idempotency 衝突:
    A2.1 ERP 回 200 既有 row

A3. **不能直接開 WO** ([ref: BR-S-M01-NN]):
    A3.1 Intake 只記 raw + 走 FR-0031 ProblemCard Bridge
```

## §2 Acceptance Criteria

### AC-01: Happy intake sync

```gherkin
When merged turn 寫 Outbox
Then ERP 收 intake row + `IntakeCaptured`
```

### AC-02: 不直接開 WO

```gherkin
When A03 試圖直接 ConvertToWO without PC
Then 系統拒絕（必經 FR-0031 ProblemCard 中介）
```

### AC-03: Retry on fail

```gherkin
Given ERP 5xx
Then Outbox retry + `IntakeSyncFailed`
```

## §3 Reference Map

| 類型 | ID | 用途 |
|:-----|:---|:-----|
| BR | BR-S-M01-01/02/NN | intake / retry / gate |
| ADR | ADR-0029 | fail-soft three-pack |
| Event | IntakeCaptured / IntakeSyncFailed | — |

## §4 Change Log

| Date | Change |
|:-----|:-------|
| 2026-05-28 | **新建** — S-M01 module FR 殼 |
