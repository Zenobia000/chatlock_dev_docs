---
id: BR-A07-NN
title: A07 規則 TBD 集合（placeholder）
status: placeholder
phase: II
module: A07
mapped_to:
- A07
source: docs/_source/02-ai-chatbot-sync.md §A A07
referenced_by:
- FR-0018
---

# BR-A07-NN — A07 規則 TBD 集合（placeholder）

## Status

**placeholder** — 此 BR ID 為「-NN 集合 placeholder」，代表 FR superseded_clauses 引用但尚未拆分為原子 BR 的規則袋。Phase II spec freeze 時拆成個別 BR-A07-01 / -02 / ...。

## Inline Rule Hints (from FR bodies)

- _(via FR inline ref)_: CS pure resolve → PC.resolved → CustAck
- _(via FR inline ref)_: LINE Push 失敗 → audit + retry
- _(via FR inline ref)_: cs path csagent_triggered (CS 一鍵開 WO)
- _(via FR inline ref)_: cs_path_csagent_triggered
- _(via FR inline ref)_: | confidence / 非營業 / cs path / retry |
- _(via FR inline ref)_: 客戶撤回投訴 audit 不刪
- _(via FR inline ref)_: 隱含不滿 confidence ≥ 0.85 升級
- _(via FR inline ref)_: 非營業時間 → L3 留言

## Source

- docs/_source/02-ai-chatbot-sync.md §A A07

## Referenced By

- FR: FR-0018

## Next Action

[CATALOG_GAP: A07] — Phase II 需把上述 inline hint 拆成個別原子 BR；目前以 placeholder 維持 traceability 鏈不斷。
