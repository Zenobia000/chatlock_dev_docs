---
id: BR-CANCEL-004
title: 'S3 出發未到場 — NTD 500'
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

# BR-CANCEL-004 — S3 出發未到場 取消費 NTD 500

## Rule

WorkOrder 在 **S3 (師傅已出發、未到場)** 階段客戶取消 → cancellation_fee = **NTD 500**（車馬費 base）。客服可覆寫但需 audit + 主管覆核（若調降 > 50% 或免收）。

## Source

- ADR-0102 §S3
- value-decisions 2026-05-28 cluster

## Rationale

師傅已實際出發 → 油資 / 時間機會成本實質產生。NTD 500 為車馬費下限（市區案件），長程案件可透過 cs override 上調或走 brand-specific config。

## Constraints

- 觸發條件：wo.status = en_route（technician.gps_status = 'departed' AND NOT arrived）
- fee = 500 NTD（V1 default base；configurable per brand / region via M18）
- cs override 允許但 audit log
- > 50% 調降或免收需主管覆核
- emit `WorkOrderCancelled` event with stage=S3

## Cross-Refs

- FR: FR-0010
- Related BR / ADR:
- ADR-0102
- BR-CANCEL-003, 005
- BR-CANCEL-008
