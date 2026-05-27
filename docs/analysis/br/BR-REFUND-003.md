---
id: BR-REFUND-003
title: Reject 後 approve → 409 terminal_state
status: active
phase: I
module: M11
mapped_to:
- M11
source: docs/_source/01-workorder-erp.md
referenced_by:
- FR-0014
---

# BR-REFUND-003 — Reject 後 approve → 409 terminal_state

## Rule

Refund 進入 rejected terminal state 後不可再 approve；嘗試 approve 系統回 409 terminal_state。重啟必須建新 RefundRequest。

## Source

- docs/_source/01-workorder-erp.md §M11（state machine）

## Constraints

- terminal_state: rejected / paid
- 409 on illegal transition

## Cross-Refs

- FR: FR-0014
- Related BR / ADR:
- (none)
