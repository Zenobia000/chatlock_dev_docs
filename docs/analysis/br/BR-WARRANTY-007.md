---
id: BR-WARRANTY-007
title: 'Phase I 整機保固 1 年 + BOM 階層留 Phase II part-level'
status: active
phase: I
module: M13
mapped_to:
- M13
source: ADR-0044 (warranty start date modes, PARTIAL_UPDATE 2026-05-28)
referenced_by:
- FR-0015
---

# BR-WARRANTY-007 — Phase I 整機 1 年 + BOM 階層

## Rule

**Phase I MVP**：智慧鎖保固 = 整機 1 年（unit-level），不分零件。
**Phase II 升級**：升 part-level（鎖體 / 馬達 / 感應器 / 電池 / 面板各自保固），Phase I 必須在 BOM table 預留階層欄位（part_id / part_category）以避免 Phase II 大型 schema migration。

Phase I 期間，部分零件若品牌另有保固（如電池 6 個月）採以下優先序：
- B2B 合約覆寫（BR-WARRANTY-006）> 品牌零件保固 > 整機 1 年 default

## Source

- ADR-0044 v2 §phase-strategy
- value-decisions 2026-05-28 Q7

## Rationale

智慧鎖多零件（鎖體 / 馬達 / 感應器 / 電池 / 面板）業界 default 分零件保固，但 Phase I MVP 一次做完整 part-level 會炸 scope（BOM master + 庫存 + 維修紀錄）。整機 1 年是台灣消費者期待最低值（消保法第 22 條 + 一般家電業界），同時 BOM 階層欄位預留可在 Phase II 直接升維不大遷移。

## Constraints

- Phase I `warranty_scope = 'unit'`，全機統一 end_date
- BOM table 必須有 part_id / part_category / part_warranty_months 欄位（Phase I 可為 NULL）
- Phase II 升維時透過 BR-M18-04 staged rollout
- 整機 1 年 = 365 day（leap year 不調整）
- 零件特殊保固（如電池 6 個月）走 BR-WARRANTY-006 B2B 或 product config

## Cross-Refs

- FR: FR-0015
- Related BR / ADR:
- ADR-0044 v2
- BR-WARRANTY-001..006
- BR-M02-02 (BOM 階層)
- BR-M18-04 (Phase II rollout policy)
