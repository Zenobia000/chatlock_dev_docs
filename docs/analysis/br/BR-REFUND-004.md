---
id: BR-REFUND-004
title: work_order_id + complaint_id 必填
status: active
phase: I
module: M11
mapped_to:
- M11
source: docs/_source/01-workorder-erp.md
referenced_by:
- FR-0014
---

# BR-REFUND-004 — work_order_id + complaint_id 必填

## Rule

RefundRequest 必填 work_order_id + complaint_id（兩者不可同時 null）。

## Source

- docs/_source/01-workorder-erp.md §M11

## Constraints

- (work_order_id IS NOT NULL OR complaint_id IS NOT NULL)

## Cross-Refs

- FR: FR-0014
- Related BR / ADR:
- (none)
