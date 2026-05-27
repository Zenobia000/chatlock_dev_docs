---
id: BR-M11-NN
title: M11 規則 TBD 集合（placeholder）
status: placeholder
phase: II
module: M11
mapped_to:
- M11
source: docs/_source/01-workorder-erp.md §M11
referenced_by:
- FR-0011
---

# BR-M11-NN — M11 規則 TBD 集合（placeholder）

## Status

**placeholder** — 此 BR ID 為「-NN 集合 placeholder」，代表 FR superseded_clauses 引用但尚未拆分為原子 BR 的規則袋。Phase II spec freeze 時拆成個別 BR-M11-01 / -02 / ...。

## Inline Rule Hints (from FR bodies)

- _(via FR inline ref)_: < 1000 不可分期 / ≥ 50000 強制簽章
- _(via FR inline ref)_: Line Pay webhook idempotency
- _(via FR inline ref)_: fallback
- _(via FR inline ref)_: fallback 兩次嘗試 audit
- _(via FR inline ref)_: high amount
- _(via FR inline ref)_: | 三軌 / 高額簽章 / fallback / idempotency / dispute |
- _(via FR inline ref)_: 三軌支付 (cash / Apple Pay / Line Pay)
- _(via FR inline ref)_: 現金 dispute → disputes 表

## Source

- docs/_source/01-workorder-erp.md §M11

## Referenced By

- FR: FR-0011

## Next Action

[CATALOG_GAP: M11] — Phase II 需把上述 inline hint 拆成個別原子 BR；目前以 placeholder 維持 traceability 鏈不斷。
