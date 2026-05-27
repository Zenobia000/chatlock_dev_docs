---
id: BR-CANCEL-006
title: 'S5 已開工 — 全收（材料 + 工時）'
status: active
phase: I
module: M15
mapped_to:
- M15
- M11
source: ADR-0102 (cancellation 6-stage cascade)
referenced_by:
- FR-0010
---

# BR-CANCEL-006 — S5 已開工 全收

## Rule

WorkOrder 在 **S5 (已開工)** 階段客戶取消 → cancellation_fee = **(完工項目費 + 已耗材料費 + 車馬費)**。按比例計算，不可低於 S4 NTD 800 floor。

## Source

- ADR-0102 §S5
- value-decisions 2026-05-28 cluster

## Rationale

已開工代表材料已切 / 已拆 / 已耗，工時不可回收。台灣合約常見「按完成比例收費」條款，必須保留。NTD 800 floor 防止客戶在開工瞬間取消規避 S4。

## Constraints

- 觸發條件：wo.status = in_progress AND work_started = true
- partial 公式：`fee = (完工項目數 / 全部項目數) × 工項總額 + 已耗材料費 + 車馬費`
- floor = NTD 800（不可低於 S4 base）
- cs override 允許但 audit log
- > 50% 調降或免收需主管覆核
- emit `WorkOrderCancelled` event with stage=S5

## Cross-Refs

- FR: FR-0010
- Related BR / ADR:
- ADR-0102
- ADR-0049 (現場加價 onsite scope change)
- BR-CANCEL-005, 008
