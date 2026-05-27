---
id: FR-0036
title: Sync — Facts 主檔同步（phone/address/device → ERP）
status: active
phase: I
mapped_to:
  - S-M02    # Facts 主檔同步
  - M02     # ERP Customer / Site / Device master
  - M17     # PII
superseded_clauses:
  - BR-S-M02-01    # phone / address / device facts 對齊
  - BR-S-M02-02    # 失敗 outbox + retry
  - BR-S-M02-NN    # SCD2 history
  - BR-S-M02-NN    # PII redaction at sync layer
emits_events:
  - FactsSynced
  - FactsConflictDetected
nfr_flavored: false
priority: P0
tier: 1
owner: Data steward / Backend
last_reviewed: 2026-05-28
related_adrs:
  - ADR-PII-002    # data minimization
  - ADR-0030      # tenant ID propagation
related:
  - "../../_source/02-ai-chatbot-sync.md#s-m02-facts主檔同步"
---

# FR-0036 — Sync Facts 主檔同步

> **新增 FR (2026-05-28)** — S-M02。Phase I。

## §1 Use Case Skeleton

| 欄位 | 內容 |
|:-----|:-----|
| **Actor** | A02 / A03 (source) |
| **Secondary Actors** | ERP M02, Outbox |
| **Trigger** | user_facts 變動 (新增 / update phone / address / device) |
| **Precondition** | tenant_id valid |
| **Main Flow** | 詳見 §1.1 |
| **Alternative Flow** | 詳見 §1.2 |
| **Postcondition** | ERP M02 customers / sites / devices 對齊；emit `FactsSynced` |

### §1.1 Main Flow

1. user_facts 變動 → Outbox row
2. PII redact (per ADR-PII-002)
3. Sync worker push ERP M02
4. ERP SCD2 寫 history
5. emit `FactsSynced`
6. END

### §1.2 Alternative Flow

```
A1. Conflict (chatbot vs ERP):
    A1.1 emit `FactsConflictDetected`
    A1.2 alert data steward
    A1.3 manual reconcile

A2. PII 漏 redact:
    A2.1 CI gate 攔截 (ADR-PII-002)

A3. ERP 5xx:
    A3.1 Outbox + retry
```

## §2 Acceptance Criteria

### AC-01: facts sync

```gherkin
When phone update
Then ERP customer 對齊 + `FactsSynced`
```

### AC-02: SCD2 history

```gherkin
Given 同一 customer phone 變動 3 次
Then ERP 有 3 row valid_from/to
```

### AC-03: Conflict detect

```gherkin
Given chatbot 跟 ERP phone 不一致
Then `FactsConflictDetected` + alert
```

## §3 Reference Map

| 類型 | ID | 用途 |
|:-----|:---|:-----|
| BR | BR-S-M02-01/02/NN | sync / retry / SCD2 / PII |
| ADR | ADR-0030 / PII-002 | tenant / PII |
| Event | FactsSynced / FactsConflictDetected | — |

## §4 Change Log

| Date | Change |
|:-----|:-------|
| 2026-05-28 | **新建** — S-M02 module FR 殼 |
