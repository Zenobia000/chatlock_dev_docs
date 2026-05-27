---
id: BR-CANCEL-003
title: 'S2 派工未出發 — NTD 300'
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

# BR-CANCEL-003 — S2 派工未出發 取消費 NTD 300

## Rule

WorkOrder 在 **S2 (已派工、師傅未出發)** 階段客戶取消 → cancellation_fee = **NTD 300**。客服可全額覆寫但需 audit + 主管覆核（若調降 > 50% 或免收）。

## Source

- ADR-0102 §S2
- value-decisions 2026-05-28 Q1（業主裁：300 而非 500）

## Rationale

業主裁 spec lower bound：500 在台灣 B2C 容易客訴；300 對應案件單價 1500-3000 的 10-20%，定位為「調度系統行政成本 + 師傅排程機會成本」。subagent 提案 500 為產業上限會打到價格敏感客群。

## Constraints

- 觸發條件：wo.status = dispatched AND technician.gps_status = 'not_departed'
- fee = 300 NTD（V1 default，configurable per brand via M18）
- cs override 允許但 audit log（操作人 / 時間 / 原值 / 新值 / 原因）
- > 50% 調降或免收需主管覆核
- emit `WorkOrderCancelled` event with stage=S2

## Cross-Refs

- FR: FR-0010
- Related BR / ADR:
- ADR-0102
- BR-CANCEL-002, 004
- BR-CANCEL-008
