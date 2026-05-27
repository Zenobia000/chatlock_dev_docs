---
id: BR-CANCEL-002
title: 'S1.5 已確認未派工 — 免費'
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

# BR-CANCEL-002 — S1.5 已確認未派工 取消免費

## Rule

WorkOrder 在 **S1.5 (報價已確認、尚未派工)** 階段客戶取消 → cancellation_fee = **NTD 0**。

## Source

- ADR-0102 §S1.5
- value-decisions 2026-05-28 Q2（業主裁：拆 S1.5 + 免收費）

## Rationale

客戶確認報價但派工未開始 → 師傅資源尚未鎖定，免收費降客訴。先前 ADR-0039 將此階段併入 S1，業主決議拆出獨立階段以便 audit 與 funnel metric。

## Constraints

- 觸發條件：wo.status = quote_confirmed AND assigned_technician_id IS NULL
- fee = 0 NTD（hard zero）
- reason code 必填（走 BR-CANCEL-008）
- emit `WorkOrderCancelled` event with stage=S1.5

## Cross-Refs

- FR: FR-0010
- Related BR / ADR:
- ADR-0102
- BR-CANCEL-001, 003
- BR-CANCEL-008
