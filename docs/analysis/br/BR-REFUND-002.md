---
id: BR-REFUND-002
title: 7 種 audit event 必留
status: active
phase: I
module: M11
mapped_to:
- M11
source: docs/_source/01-workorder-erp.md
referenced_by:
- FR-0014
---

# BR-REFUND-002 — 7 種 audit event 必留

## Rule

Refund 流程 7 個關鍵 event 必寫 audit：refund_requested / approval_pending / approved / rejected / paid / customer_acknowledged / dispute_filed。

## Source

- docs/_source/01-workorder-erp.md §M11 + §M17 audit

## Constraints

- 7 event enum
- append-only audit

## Cross-Refs

- FR: FR-0014
- Related BR / ADR:
- BR-AUDIT-007
