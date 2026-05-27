---
id: BR-M09-NN
title: M09 規則 TBD 集合（placeholder）
status: placeholder
phase: II
module: M09
mapped_to:
- M09
source: docs/_source/01-workorder-erp.md §M09
referenced_by:
- FR-0006
- FR-0009
---

# BR-M09-NN — M09 規則 TBD 集合（placeholder）

## Status

**placeholder** — 此 BR ID 為「-NN 集合 placeholder」，代表 FR superseded_clauses 引用但尚未拆分為原子 BR 的規則袋。Phase II spec freeze 時拆成個別 BR-M09-01 / -02 / ...。

## Inline Rule Hints (from FR bodies)

- _(via FR inline ref)_: GCS retry 3 次 + local queue fallback
- _(via FR inline ref)_: e-signature schema (signature_data 必填)
- _(via FR inline ref)_: | e-signature schema |
- _(via FR inline ref)_: | size / format / retry / retention |
- _(via FR inline ref)_: 圖檔 size limit 10MB / format JPG-PNG
- _(via FR inline ref)_: 完工後 2y retention (依 ADR-0051)

## Source

- docs/_source/01-workorder-erp.md §M09

## Referenced By

- FR: FR-0006, FR-0009

## Next Action

[CATALOG_GAP: M09] — Phase II 需把上述 inline hint 拆成個別原子 BR；目前以 placeholder 維持 traceability 鏈不斷。
