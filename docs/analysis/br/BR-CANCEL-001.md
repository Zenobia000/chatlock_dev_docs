---
id: BR-CANCEL-001
title: 'S1 未派工 — 免費'
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

# BR-CANCEL-001 — S1 未派工 取消免費

## Rule

WorkOrder 在 **S1 (報價未確認 / 未派工)** 階段客戶取消 → cancellation_fee = **NTD 0**。系統自動計算，無需客服介入。

## Source

- ADR-0102 §S1
- value-decisions 2026-05-28 Q1-Q3 cluster

## Rationale

報價未確認等同尚未進入交付流程，平台與師傅皆未產生實質成本，免費降客訴並維持 conversion funnel。

## Constraints

- 觸發條件：wo.status ∈ {quote_pending, quote_sent_unconfirmed}
- fee = 0 NTD（hard zero，不可被 cs override 調高）
- reason code 必填（走 BR-CANCEL-008 dictionary）
- emit `WorkOrderCancelled` event with stage=S1

## Cross-Refs

- FR: FR-0010
- Related BR / ADR:
- ADR-0102 (cancellation cascade)
- BR-CANCEL-002..007
- BR-CANCEL-008 (reason code)
