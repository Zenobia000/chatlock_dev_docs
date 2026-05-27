---
id: BR-M07-NN
title: M07 規則 TBD 集合（placeholder）
status: placeholder
phase: II
module: M07
mapped_to:
- M07
source: docs/_source/01-workorder-erp.md §M07
referenced_by:
- FR-0005
- FR-0010
- FR-0044
---

# BR-M07-NN — M07 規則 TBD 集合（placeholder）

## Status

**placeholder** — 此 BR ID 為「-NN 集合 placeholder」，代表 FR superseded_clauses 引用但尚未拆分為原子 BR 的規則袋。Phase II spec freeze 時拆成個別 BR-M07-01 / -02 / ...。

## Inline Rule Hints (from FR bodies)

- _(via FR inline ref)_: 30 min 內 reschedule = 失約 (-5 weight)
- _(via FR inline ref)_: LINE 未綁定 fallback SMS push
- _(via FR inline ref)_: | 30 min penalty / 單方取消 |
- _(via FR inline ref)_: | 雙 WO conflict / LINE fallback |
- _(via FR inline ref)_: 同時 push 雙 WO conflict resolution
- _(via FR inline ref)_: 單方面取消 → auto reassign + 客訴
- _(via FR inline ref)_: 規則拆細

## Source

- docs/_source/01-workorder-erp.md §M07

## Referenced By

- FR: FR-0005, FR-0010, FR-0044

## Next Action

[CATALOG_GAP: M07] — Phase II 需把上述 inline hint 拆成個別原子 BR；目前以 placeholder 維持 traceability 鏈不斷。
