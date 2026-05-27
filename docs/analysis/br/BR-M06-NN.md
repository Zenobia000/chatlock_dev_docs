---
id: BR-M06-NN
title: M06 規則 TBD 集合（placeholder）
status: placeholder
phase: II
module: M06
mapped_to:
- M06
source: docs/_source/01-workorder-erp.md §M06
referenced_by:
- FR-0003
- FR-0004
- FR-0005
- FR-0010
---

# BR-M06-NN — M06 規則 TBD 集合（placeholder）

## Status

**placeholder** — 此 BR ID 為「-NN 集合 placeholder」，代表 FR superseded_clauses 引用但尚未拆分為原子 BR 的規則袋。Phase II spec freeze 時拆成個別 BR-M06-01 / -02 / ...。

## Inline Rule Hints (from FR bodies)

- _(via FR inline ref)_: + BR-M07-NN；新增 frontmatter；補 §1 skeleton + 8 alt flow + 8 G/W/T AC；**修正 SLA 邊界**（舊「30min 接單」改成「10min 一般 / 5min 急件 per A
- _(via FR inline ref)_: + BR-M07-NN；本檔僅保留 use case skeleton + acceptance G/W/T。
- _(via FR inline ref)_: + BR-M17-NN；新增 frontmatter；補 §1 skeleton + 6 alt flow + 8 G/W/T AC（含 audit immutability test） | Roundtable 2026-05-27 D
- _(via FR inline ref)_: + BR-M17-NN；本檔僅保留 use case skeleton + acceptance G/W/T。
- _(via FR inline ref)_: 5/10/20km 候選擴大搜尋
- _(via FR inline ref)_: 5km 候選池
- _(via FR inline ref)_: manual override permission (support_agent only)
- _(via FR inline ref)_: no-candidates fallback
- _(via FR inline ref)_: reschedule ≤ 3 次後強制 admin
- _(via FR inline ref)_: tie-breaker
- _(via FR inline ref)_: tie-breaker 6 級
- _(via FR inline ref)_: urgent override
- _(via FR inline ref)_: | manual override permission |
- _(via FR inline ref)_: | reschedule ≤ 3 次 |
- _(via FR inline ref)_: | tie-breaker 6 級 / 擴大搜尋 / urgent override / no-candidates fallback |
- _(via FR inline ref)_: | 接單 SLA 10/5 min |
- _(via FR inline ref)_: 全候選池空 fallback (dispatch_pending + alert)
- _(via FR inline ref)_: 接單 SLA (一般 10min / 急件 5min, ADR-0045 對齊)
- _(via FR inline ref)_: 紅色警報權重覆寫 distance↓ rating↑

## Source

- docs/_source/01-workorder-erp.md §M06

## Referenced By

- FR: FR-0003, FR-0004, FR-0005, FR-0010

## Next Action

[CATALOG_GAP: M06] — Phase II 需把上述 inline hint 拆成個別原子 BR；目前以 placeholder 維持 traceability 鏈不斷。
