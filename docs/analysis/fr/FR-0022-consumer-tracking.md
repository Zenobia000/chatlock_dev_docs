---
id: FR-0022
title: 消費者端工單追蹤（LINE + Web 並存）
status: draft
phase: I
mapped_to:
  - M16    # Comms
  - M01    # Customer intake
superseded_clauses:
  - BR-M16-NN    # LINE rich menu + Web token URL
  - BR-M16-NN    # Web token 24h TTL
  - BR-M16-NN    # token mismatch → 401
emits_events:
  - ConsumerTrackingOpened
nfr_flavored: false
priority: P1
tier: 2
owner: 客服 / Frontend
last_reviewed: 2026-05-28
related_adrs:
  - ADR-0015    # consumer tracking 入口 (historical)
blocked_by:
  - Q3=C  # Web token spec
legacy_id: REQ-022
trace_to_flow: F-022
last-synced-with: 4e9658e90324cbceb26f5e5445f481fc5678df1f
related:
  - "../../_source/01-workorder-erp.md#m16-comms"
---

# FR-0022 — 消費者端工單追蹤（LINE + Web 並存）

> **Migration**: 2026-05-28 改為 D5 殼結構（rule → BR）。Status: draft (Q3=C)。

## §1 Use Case Skeleton

| 欄位 | 內容 |
|:-----|:-----|
| **Actor** | 客戶 (LINE / Web) |
| **Secondary Actors** | M16 Comms |
| **Trigger** | 客戶想查工單進度 |
| **Precondition** | 客戶有 wo_id 或 LINE binding |
| **Main Flow** | 詳見 §1.1 → user-flow:S2-step-track |
| **Alternative Flow** | 詳見 §1.2 |
| **Postcondition** | 客戶看到 status；emit `ConsumerTrackingOpened` |

### §1.1 Main Flow

1. 客戶 LINE rich menu tap "查進度" / Web 開 token URL
2. 系統驗證 binding / token
3. 查 wo.status
4. render UI
5. emit `ConsumerTrackingOpened`
6. END

### §1.2 Alternative Flow

```
A1. Web token mismatch:
    A1.1 401 unauthorized

A2. Token > 24h TTL:
    A2.1 expire + 提示重發

A3. LINE 未綁定:
    A3.1 提示「先綁定 LINE」
```

## §2 Acceptance Criteria

### AC-01: LINE rich menu

```gherkin
When 客戶 tap "查進度"
Then 看到當前 wo status
```

### AC-02: Web token

```gherkin
When 客戶開 token URL
Then 驗證 token + render
```

### AC-03: Token expired

```gherkin
Given token > 24h
When 客戶開 URL
Then 提示「token expired」
```

### AC-04: Token tampered

```gherkin
When token mismatch
Then 401
```

## §3 Reference Map

| 類型 | ID | 用途 |
|:-----|:---|:-----|
| BR | BR-M16-NN | LINE+Web tracking |
| Event | ConsumerTrackingOpened | M19 |

## §4 Change Log

| Date | Change |
|:-----|:-------|
| 2026-05-10 | REQ-022→FR-0022 |
| 2026-05-28 | **D5 殼 rewrite** |
