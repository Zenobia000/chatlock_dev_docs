---
id: BR-WARRANTY-004
title: 收據 vs 建案資料庫衝突採信建案
status: active
phase: I
module: M13
mapped_to:
- M13
source: docs/_source/01-workorder-erp.md
referenced_by:
- FR-0015
---

# BR-WARRANTY-004 — 收據 vs 建案資料庫衝突採信建案

## Rule

收據日期與建案資料庫 handover_date 衝突 → 採信建案資料庫（builder project 為 source of truth）。

## Source

- docs/_source/01-workorder-erp.md §M13 + §M14（builder project）

## Constraints

- precedence: builder_project > customer_receipt

## Cross-Refs

- FR: FR-0015
- Related BR / ADR:
- BR-M14-02
