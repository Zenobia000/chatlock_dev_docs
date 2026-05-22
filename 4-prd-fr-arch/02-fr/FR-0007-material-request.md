---
id: FR-0007
title: 材料申請與庫存扣減
tier: 2
priority: P1
status: draft
blockers: [F-210]
lifecycle: pending-decision
last-synced-with: 4e9658e90324cbceb26f5e5445f481fc5678df1f
sync-source: doc
synced-at: 2026-05-15
legacy_id: REQ-007
trace_to_flow: F-007
related:
  - "../../0-principles/id-mapping-legacy.md §A.3 (REQ→FR)"
  - "../../0-principles/PRIN-0001-product-principles.md"
  - "../flows/business/"
  - "../api/openapi.yaml"
---

# FR-0007 — 材料申請與庫存扣減

> 從 `docs/_flows-bdd-test/north-star-requirements.md REQ-007` 抽出，升級為 4-digit FR ID。

## §1 Description

材料申請與庫存扣減

## §2 Priority

**P1** (Should-have)

## §3 Acceptance Criteria

### §3.1 SLO（正常路徑）

材料請領單據實時扣庫存，跌破 reorder_point 自動通知 warehouse_admin。

### §3.2 邊界案例

- 庫存=1 請領 2 → 409 insufficient_inventory
- 退料還原庫存 + 工單 net_consumption 正確

### §3.3 異常處理

- consume 缺 work_order_id → 422 field_required
- 並發 5 個請領同 item → DB row lock 確保 quantity 正確

### §3.4 TC Coverage

涵蓋之 TC（per `docs/2-contracts/test-cases/registry.yaml`）: IT-0105~0110 (inventory 6 cases)

## §4 Trace

| Aspect | Reference |
| :-- | :-- |
| Legacy ID | REQ-007 |
| Legacy F-XXX flow | F-007 |
| Implementation status | ⚠ pending F-210 規格 |

## §5 Change Log

| Date | Change |
| :--- | :--- |
| 2026-05-10 | 從 north-star-requirements REQ-007→FR-0007 split |
