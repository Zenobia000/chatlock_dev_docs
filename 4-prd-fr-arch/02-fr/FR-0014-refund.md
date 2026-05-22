---
id: FR-0014
title: 退款流程
tier: 2
priority: P0
status: draft
blockers: [Q7=B]
lifecycle: blocked
lifecycle-reason: "Q7=B"
last-synced-with: 4e9658e90324cbceb26f5e5445f481fc5678df1f
sync-source: doc
synced-at: 2026-05-15
legacy_id: REQ-014
trace_to_flow: F-014
related:
  - "../../0-principles/id-mapping-legacy.md §A.3 (REQ→FR)"
  - "../../0-principles/PRIN-0001-product-principles.md"
  - "../flows/business/"
  - "../api/openapi.yaml"
---

# FR-0014 — 退款流程

> 從 `docs/_flows-bdd-test/north-star-requirements.md REQ-014` 抽出，升級為 4-digit FR ID。

## §1 Description

退款流程

## §2 Priority

**P0** (Must-have for V1)

## §3 Acceptance Criteria

### §3.1 SLO（正常路徑）

退款 ≤ 100k 單簽 / > 100k 雙簽；7 種 audit event 完整保留。

### §3.2 邊界案例

- 100,000 邊界視為單簽；100,001 強制雙簽
- Reject 後再 approve 嘗試 → 409 terminal_state

### §3.3 異常處理

- 缺 work_order_id 或 complaint_id (BR-REFUND-004) → 422
- execute_refund LINE 通知失敗 → audit + retry queue，主流程不卡

### §3.4 TC Coverage

涵蓋之 TC（per `docs/2-contracts/test-cases/registry.yaml`）: IT-0051~0056 (refund-service 6 cases)

## §4 Trace

| Aspect | Reference |
| :-- | :-- |
| Legacy ID | REQ-014 |
| Legacy F-XXX flow | F-014 |
| Implementation status | ⚠ blocked（Q7=B） |

## §5 Change Log

| Date | Change |
| :--- | :--- |
| 2026-05-10 | 從 north-star-requirements REQ-014→FR-0014 split |
