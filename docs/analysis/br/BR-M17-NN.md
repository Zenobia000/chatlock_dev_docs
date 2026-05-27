---
id: BR-M17-NN
title: M17 規則 TBD 集合（placeholder）
status: placeholder
phase: II
module: M17
mapped_to:
- M17
source: docs/_source/01-workorder-erp.md §M17
referenced_by:
- FR-0004
- FR-0008
- FR-0019
- FR-0020
---

# BR-M17-NN — M17 規則 TBD 集合（placeholder）

## Status

**placeholder** — 此 BR ID 為「-NN 集合 placeholder」，代表 FR superseded_clauses 引用但尚未拆分為原子 BR 的規則袋。Phase II spec freeze 時拆成個別 BR-M17-01 / -02 / ...。

## Inline Rule Hints (from FR bodies)

- _(via FR inline ref)_: 4 維權限 (view/edit/approve/audited)
- _(via FR inline ref)_: 7 yr retention
- _(via FR inline ref)_: SCD2 (role 變更歷史)
- _(via FR inline ref)_: append-only + hash chain
- _(via FR inline ref)_: atomicity
- _(via FR inline ref)_: audit log append-only + JSON + trace_id
- _(via FR inline ref)_: audit transaction atomicity (寫失敗整 transaction rollback)
- _(via FR inline ref)_: role assignment audit log
- _(via FR inline ref)_: | 4 維權限 / audit / SCD2 |
- _(via FR inline ref)_: | append-only / 7y / export / hash chain |
- _(via FR inline ref)_: | audit append-only / atomicity |
- _(via FR inline ref)_: | 雙簽 audit |
- _(via FR inline ref)_: 匯出 PDF / CSV
- _(via FR inline ref)_: 匯出 audit access
- _(via FR inline ref)_: 雙簽 (技師 + 客戶) audit

## Source

- docs/_source/01-workorder-erp.md §M17

## Referenced By

- FR: FR-0004, FR-0008, FR-0019, FR-0020

## Next Action

[CATALOG_GAP: M17] — Phase II 需把上述 inline hint 拆成個別原子 BR；目前以 placeholder 維持 traceability 鏈不斷。
