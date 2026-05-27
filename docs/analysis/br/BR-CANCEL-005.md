---
id: BR-CANCEL-005
title: 'S4 到場未開工 — NTD 800'
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

# BR-CANCEL-005 — S4 到場未開工 取消費 NTD 800

## Rule

WorkOrder 在 **S4 (師傅已到場、未開工)** 階段客戶取消 → cancellation_fee = **NTD 800**（車馬費 NTD 500 + 檢測 / 評估費 NTD 300）。客服可覆寫但需 audit + 主管覆核（若調降 > 50% 或免收）。

## Source

- ADR-0102 §S4
- value-decisions 2026-05-28 cluster

## Rationale

師傅到場已產生車馬 + 現場評估 / 量測工時。NTD 800 = NTD 500 base 車馬 + NTD 300 檢測費（沿用 ADR-0039 v1 S4 結構），對應案件單價 1500-3000 的 30-50%，仍低於 S5 全收以保留客戶取消彈性。

## Constraints

- 觸發條件：wo.status = on_site AND work_started = false
- fee = 800 NTD（V1 default：500 base 車馬 + 300 inspection；configurable per brand）
- cs override 允許但 audit log
- > 50% 調降或免收需主管覆核
- emit `WorkOrderCancelled` event with stage=S4

## Cross-Refs

- FR: FR-0010
- Related BR / ADR:
- ADR-0102
- BR-CANCEL-004, 006
- BR-CANCEL-008
