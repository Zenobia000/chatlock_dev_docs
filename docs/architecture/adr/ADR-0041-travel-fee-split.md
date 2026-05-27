---
id: ADR-0041
title: 車馬費歸屬 — 80% 師傅 / 20% 平台
status: accepted
date: 2026-05-21
source_trade_off: §F.2 車馬費歸屬 PAIN-POINTS-SUMMARY-2026-05-21.md
deciders: [業主]
accepted_date: 2026-05-22
related:
  - 01-workorder-erp-final-spec-20260520.xlsx#sheet-04 (P0)
  - 01-workorder-erp-final-spec-20260520.xlsx#sheet-08 (Phase II)
  - 01-workorder-erp-final-spec-20260520.xlsx#sheet-14 (七張帳本)
  - "./ADR-0039-cancellation-fee-tiers.md"
pre_mortem: F6 (人才流失) + F4 (cash flow)
eternal_transient: Eternal Policy + Configurable
---

> 
> **🔄 Migration Status (2026-05-28)**: `STILL_VALID_UNDER_M11_M07`
> **Reviewed against**: 2026-05-20 final spec (xlsx)
> **Reviewed on**: 2026-05-28
> **Module scope**: M11, M07
> **Per ADR-0100 §1 classification** (.claude/context/devteam/meetings/2026-05-27-1130-final-spec-migration-strategy/MoM.md)


# ADR-0041 — 車馬費歸屬

## Status
Draft

## Context

師傅到場才能收車馬費。但收完後該怎麼分？全給師傅會影響平台 cash flow；全平台收會傷師傅生態。

源自 Excel-01 sheet 04 P0 車馬費歸屬；sheet 08 Phase II Finance P2-08/09；sheet 14 七張帳本（Cash Collection + Dispatcher Commission）。

## Decision（推薦）

**80% 師傅 / 20% 平台**，金額三段：

| 距離 | 車馬費（V1 預設）|
|------|----------------|
| 同區（< 10km） | NTD 500 |
| 跨區（10-30km） | NTD 800 |
| 遠距（> 30km） | NTD 1,200 |

分潤：師傅 80% / 平台 20%（進 Dispatcher Commission ledger）。

例外：建商 / 品牌合約案件依合約條款，可 override 80/20 分潤。

## Alternatives Considered

### Option A — 全給師傅（100%）
- 風險：F4 平台 cash flow
- 平台收入 -100%，難以持續經營

### Option B — 全平台收
- 風險：F6 師傅流失
- 師傅生態崩潰（這是 D3 護城河關鍵）

## Consequences

**Positive**：
- 80/20 平衡師傅生態（D3）與平台 cash flow（B4）
- Configurable per brand 支援合約差異
- 進 ledger 永久 audit

**Negative**：
- 師傅可能議價希望提升至 85/15
- 平台機會成本 -20%（相較全平台收）

**Mitigation**：
- 師傅生態擴張到 1000+ 時可重新議價
- 異常拆分（如師傅墊付材料費）走 Exception module

## Pre-mortem Mapping

對應 §A F6 + F4。師傅是 D3 護城河關鍵之一；分潤合理才能維持簽約意願。Cash flow 太弱平台死，全給師傅則平台無法投資 AI / 系統。

## Eternal/Transient Classification

- **Eternal**：§B4 Dispatcher Commission ledger + 「車馬費分潤」原則
- **Transient**：80/20 比例 + 金額（configurable per brand）

## Acceptance Criteria
- [ ] 業主圈選：**✅ 推薦** / Option A / Option B
- [ ] 派工主管 + 會計簽核 80/20 + 三段金額
- [ ] Backend 實作 Dispatcher Commission ledger
- [ ] 與 ADR-0039 取消費 S4「車馬費 NTD 500-1200」一致
- [ ] BI 報表加「車馬費分潤 by 師傅 × 區域」
- [ ] 師傅生態 1000+ 時 review 分潤比例

## See also
- §F.2 PAIN-POINTS-SUMMARY-2026-05-21.md
- Excel-01 sheet 04 / sheet 08 P2-08/09 / sheet 14 / M07 / M12 AP
- ADR-0039 取消費分段（S4 車馬費收費）
