---
id: BR-M15-NN
title: M15 規則 TBD 集合（placeholder）
status: placeholder
phase: II
module: M15
mapped_to:
- M15
source: docs/_source/01-workorder-erp.md §M15
referenced_by:
- FR-0008
- FR-0013
---

# BR-M15-NN — M15 規則 TBD 集合（placeholder）

## Status

**placeholder** — 此 BR ID 為「-NN 集合 placeholder」，代表 FR superseded_clauses 引用但尚未拆分為原子 BR 的規則袋。Phase II spec freeze 時拆成個別 BR-M15-01 / -02 / ...。

## Inline Rule Hints (from FR bodies)

- _(via FR inline ref)_: + BR-M08-NN + BR-M17-NN。
- _(via FR inline ref)_: + BR-M08-NN + BR-M17-NN；明標 cross-module nature；新增 frontmatter `mapped_to: [M15, M17, M16, M08
- _(via FR inline ref)_: 30min 等候
- _(via FR inline ref)_: 60 天未解 → 升 ops_director
- _(via FR inline ref)_: = ADR-0065
- _(via FR inline ref)_: close 後 reopen → dispute_v2
- _(via FR inline ref)_: dual sign
- _(via FR inline ref)_: scope change ≥ 50% 原價 強制 admin 簽核
- _(via FR inline ref)_: type lookup = ADR-0065
- _(via FR inline ref)_: | dual sign / 60d / 撤銷 / reopen |
- _(via FR inline ref)_: | 高金額強制簽核 / 30min 等候 |
- _(via FR inline ref)_: 單方 close → 409 dual_sign_required
- _(via FR inline ref)_: 客戶 30 min 未回覆 → 暫停施工
- _(via FR inline ref)_: 撤銷 → closed_withdrawn
- _(via FR inline ref)_: 雙簽 CSM + ops_manager
- _(via FR inline ref)_: 高金額強制簽核

## Source

- docs/_source/01-workorder-erp.md §M15

## Referenced By

- FR: FR-0008, FR-0013

## Next Action

[CATALOG_GAP: M15] — Phase II 需把上述 inline hint 拆成個別原子 BR；目前以 placeholder 維持 traceability 鏈不斷。
