---
id: FR-0023
title: 錯誤頁 / 離線體驗（cross-cutting）
status: active
phase: I
mapped_to:
  - cross-cutting
superseded_clauses:
  - BR-XCUT-NN    # 400/401/403/404/429/5xx 錯誤頁範本
  - BR-XCUT-NN    # offline page (Service Worker)
  - BR-XCUT-NN    # WCAG 2.2 AA conformance
emits_events:
  - ErrorPageRendered
nfr_flavored: false
priority: P2
tier: 2
owner: Frontend / UX
last_reviewed: 2026-05-28
related_adrs: []
legacy_id: REQ-023
trace_to_flow: F-023
last-synced-with: 4e9658e90324cbceb26f5e5445f481fc5678df1f
related:
  - "../../_source/01-workorder-erp.md#m16-comms"
---

# FR-0023 — 錯誤頁 / 離線體驗（cross-cutting）

> **Migration**: 2026-05-28 改為 D5 殼結構（rule → BR）。

## §1 Use Case Skeleton

| 欄位 | 內容 |
|:-----|:-----|
| **Actor** | 任何 user |
| **Secondary Actors** | Frontend, Service Worker |
| **Trigger** | HTTP error (400/401/403/404/429/5xx) / offline |
| **Precondition** | — |
| **Main Flow** | 詳見 §1.1 → user-flow:cross-cutting |
| **Alternative Flow** | 詳見 §1.2 |
| **Postcondition** | error page render；emit `ErrorPageRendered` |

### §1.1 Main Flow

1. Frontend 偵測 HTTP error / network offline
2. render 對應錯誤頁（依範本 [ref: BR-XCUT-NN]）
3. 提示 retry / contact CS
4. emit `ErrorPageRendered` (含 error_code + path)
5. END

### §1.2 Alternative Flow

```
A1. Service Worker offline:
    A1.1 render cached offline page
    A1.2 retry queue 收 user action
    A1.3 連線恢復 → sync

A2. WCAG conformance check:
    A2.1 screen reader 朗讀「錯誤」+ error code
    A2.2 keyboard tab order: 錯誤訊息 → retry button
```

## §2 Acceptance Criteria

### AC-01: 404 error page

```gherkin
When user 開不存在的 URL
Then render 404 page
  And `ErrorPageRendered` emit (code=404)
```

### AC-02: 5xx error page

```gherkin
When backend 5xx
Then render 「系統忙碌」+ retry button
```

### AC-03: Offline mode

```gherkin
Given network offline
When user 開 page
Then render cached offline page
  And user 動作存 queue
```

### AC-04: WCAG 2.2 AA

```gherkin
When screen reader 讀錯誤頁
Then 朗讀「錯誤」+ error code + 可選動作
  And keyboard tab order 正確
```

## §3 Reference Map

| 類型 | ID | 用途 |
|:-----|:---|:-----|
| BR | BR-XCUT-NN | error page / offline / a11y |
| Event | ErrorPageRendered | M19 |

## §4 Change Log

| Date | Change |
|:-----|:-------|
| 2026-05-10 | REQ-023→FR-0023 |
| 2026-05-28 | **D5 殼 rewrite** |
