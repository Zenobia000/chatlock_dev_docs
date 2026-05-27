---
id: BR-REFUND-001
title: 退款金額分層 approval
status: active
phase: I
module: M11
mapped_to:
- M11
source: docs/_source/01-workorder-erp.md
referenced_by:
- FR-0014
---

# BR-REFUND-001 — 退款金額分層 approval

## Rule

Refund ≤ NTD 100,000 單簽（會計或主管）；> NTD 100,000 雙簽（operations + finance）；partial refund 必須分類 product / labor / material / travel / inspection。

## Source

- docs/_source/01-workorder-erp.md §M11 AR 退款（BR-M11-02）

## Constraints

- threshold = 100000 NTD
- partial refund 5 category

## Cross-Refs

- FR: FR-0014
- Related BR / ADR:
- (none)
