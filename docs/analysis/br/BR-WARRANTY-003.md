---
id: BR-WARRANTY-003
title: 'Boundary: claim_date = warranty_end_date 仍在保固'
status: active
phase: I
module: M13
mapped_to:
- M13
source: docs/_source/01-workorder-erp.md
referenced_by:
- FR-0015
---

# BR-WARRANTY-003 — Boundary: claim_date = warranty_end_date 仍在保固

## Rule

claim_date ≤ warranty_end_date 視為仍在保固範圍（boundary 同日 = 在保固內）。

## Source

- docs/_source/01-workorder-erp.md §M13 RMA 品質（Q107 邊界）

## Constraints

- boundary inclusive: claim_date <= warranty_end_date

## Cross-Refs

- FR: FR-0015
- Related BR / ADR:
- (none)
