---
id: BR-M12-NN
title: M12 規則 TBD 集合（placeholder）
status: placeholder
phase: II
module: M12
mapped_to:
- M12
source: docs/_source/01-workorder-erp.md §M12
referenced_by:
- FR-0012
- FR-0045
---

# BR-M12-NN — M12 規則 TBD 集合（placeholder）

## Status

**placeholder** — 此 BR ID 為「-NN 集合 placeholder」，代表 FR superseded_clauses 引用但尚未拆分為原子 BR 的規則袋。Phase II spec freeze 時拆成個別 BR-M12-01 / -02 / ...。

## Inline Rule Hints (from FR bodies)

- _(via FR inline ref)_: disputes 未結排除當月
- _(via FR inline ref)_: negative settlement (材料費 > 收款)
- _(via FR inline ref)_: settlement DB unique constraint
- _(via FR inline ref)_: | cron / negative / dispute / retry / unique |
- _(via FR inline ref)_: 匯款 API 失敗 3 次 → manual_payout
- _(via FR inline ref)_: 月結 cron 每月 1 日 02:00

## Source

- docs/_source/01-workorder-erp.md §M12

## Referenced By

- FR: FR-0012, FR-0045

## Next Action

[CATALOG_GAP: M12] — Phase II 需把上述 inline hint 拆成個別原子 BR；目前以 placeholder 維持 traceability 鏈不斷。
