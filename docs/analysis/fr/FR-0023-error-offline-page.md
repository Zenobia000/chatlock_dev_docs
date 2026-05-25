---
id: FR-0023
title: 錯誤頁 / 離線體驗（cross-cutting）
tier: 2
priority: P2
status: active
blockers: [F-110]
lifecycle: partial
lifecycle-reason: "建議新增 F-110 cross-cutting"
last-synced-with: 4e9658e90324cbceb26f5e5445f481fc5678df1f
sync-source: doc
synced-at: 2026-05-15
legacy_id: REQ-023
trace_to_flow: F-023
related:
  - "../../0-principles/id-mapping-legacy.md §A.3 (REQ→FR)"
  - "../../0-principles/PRIN-0001-product-principles.md"
  - "../flows/business/"
  - "../api/openapi.yaml"
---

# FR-0023 — 錯誤頁 / 離線體驗（cross-cutting）

> 從 `docs/_flows-bdd-test/north-star-requirements.md REQ-023` 抽出，升級為 4-digit FR ID。

## §1 Description

錯誤頁 / 離線體驗（cross-cutting）

## §2 Priority

**P2** (Should-have)

## §3 Acceptance Criteria

### §3.1 SLO（正常路徑）

全 5xx error 顯示友善訊息 + retry 按鈕；offline 偵測切換離線頁。

### §3.2 邊界案例

- Network restore → 自動 retry pending requests
- Backend degraded（部分服務 OK）→ 顯示「部分功能受限」

### §3.3 異常處理

- 錯誤訊息不可洩漏 stack trace 或內部路徑
- 5xx 連續 3 次 → frontend circuit breaker 啟用

### §3.4 TC Coverage

涵蓋之 TC（per `docs/2-contracts/test-cases/registry.yaml`）: IT-0061 (degraded health check)

## §4 Trace

| Aspect | Reference |
| :-- | :-- |
| Legacy ID | REQ-023 |
| Legacy F-XXX flow | F-023 |
| Implementation status | ⚠ partial（建議新增 F-110 cross-cutting） |

## §5 Change Log

| Date | Change |
| :--- | :--- |
| 2026-05-10 | 從 north-star-requirements REQ-023→FR-0023 split |
