---
id: ADR-0033
title: ProblemCard completeness score 控派工 — 0.85 hard gate + 人工 override
status: accepted
date: 2026-05-21
source_trade_off: §F.1 GAP-D03 PAIN-POINTS-SUMMARY-2026-05-21.md
deciders: [業主]
accepted_date: 2026-05-22
related:
  - "./ADR-0031-ai-auto-convert-to-work-order.md"
  - 02-ai-chatbot-sync-final-spec-20260520.xlsx#sheet-04 (G6)
  - 02-ai-chatbot-sync-final-spec-20260520.xlsx#sheet-19 (D03)
pre_mortem: F3 (HITL 邊界漂移) + F4 (合規崩潰)
eternal_transient: Eternal Policy (B3)
---

# ADR-0033 — ProblemCard completeness score 是否控制派工

## Status
Draft

## Context

ProblemCard 有 `completeness_score`（0.0-1.0）反映 brand / model / symptom / urgency / media 等欄位齊全度。若分數太低就自動派工，會造成師傅到場才發現問題不對、需重派 / 客戶不滿。但若門檻過嚴（如 0.95）會卡住太多案件。

源自 DISC-0001 §3 D03；Excel-02 sheet 04 G6（是否需要 ProblemCard）。

## Decision（推薦）

**0.85 hard gate + 人工 override 走 Exception module**：
- `completeness_score >= 0.85` → 自動允許進入派工佇列
- `completeness_score < 0.85` → 不自動派工，需客服人工 override（走 Exception module，留 audit）
- 門檻 `COMPLETENESS_THRESHOLD = 0.85` configurable per brand contract

## Alternatives Considered

### Option A — 不設 gate，自動派工
- 風險：F3 高 + F4 合規崩潰
- 派錯案件率 ↑，客訴成本高

### Option B — 0.95 hard gate（極嚴）
- 風險：F1 弱（過嚴流失客戶）
- 太多案件卡關，AI 投資報酬 -30%

## Consequences

**Positive**：
- 0.85 是行業折衷，留 15% 容錯給 Exception module
- 人工 override 留 audit trail（B5 evidence chain）
- per brand override 支援未來品牌差異化

**Negative**：
- 低分案件需人工 +1 步
- Exception module 工作量 ~10% PC

**Mitigation**：
- 6 個月後依誤判率調整門檻
- Exception module 自動分流給負荷低的客服

## Pre-mortem Mapping

對應 §A F3 + F4。沒有 completeness gate 等於把 HITL 邊界丟給 AI 自判（F3）；自動派工錯誤累積 → 合約 4.4 條款未履行 → 甲方終止合約（F4）。

## Eternal/Transient Classification

- **Eternal**：§B3 Policy gate「分數低於閾值不自動派工」原則
- **Transient**：閾值具體數字 0.85（configurable）

## Acceptance Criteria
- [ ] 業主圈選：**✅ 推薦** / Option A / Option B
- [ ] Tech Lead 確認 0.85 是 V1.0 起點門檻
- [ ] Exception module 對 `<0.85` PC 提供 override UI
- [ ] 每月匯出「override 比例 + 後續客訴率」報表
- [ ] 6 個月後跑門檻校準 ADR review

## See also
- §F.1 GAP-D03 PAIN-POINTS-SUMMARY-2026-05-21.md
- Excel-02 sheet 04 G6 / sheet 19 D03
- Excel-01 M15 Exception module
- ADR-0031（人審 1-click）
