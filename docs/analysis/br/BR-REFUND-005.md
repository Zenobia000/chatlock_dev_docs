---
id: BR-REFUND-005
title: LINE 通知失敗 audit + retry
status: active
phase: I
module: M11
mapped_to:
- M11
source: docs/_source/01-workorder-erp.md
referenced_by:
- FR-0014
---

# BR-REFUND-005 — LINE 通知失敗 audit + retry

## Rule

Refund 結果 LINE Push 通知失敗 → 寫 audit + 進 retry queue（max 3 次）。

## Source

- docs/_source/01-workorder-erp.md §M11 + M16 通知

## Constraints

- retry max=3
- audit on each attempt

## Cross-Refs

- FR: FR-0014
- Related BR / ADR:
- (none)
