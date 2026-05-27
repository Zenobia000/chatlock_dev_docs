---
id: ADR-0052
title: 庫存歸屬 — Material.owner 欄位（platform / brand / locksmith）
status: accepted
date: 2026-05-21
source_trade_off: §F.3 AI-054 PAIN-POINTS-SUMMARY-2026-05-21.md
deciders: [業主]
accepted_date: 2026-05-22
related:
  - 01-workorder-erp-final-spec-20260520.xlsx (M10 Product BOM, M12 AP)
  - 01-workorder-erp-final-spec-20260520.xlsx#sheet-18 (AI-054)
pre_mortem: F4 (對帳惡夢) + F6 (師傅體驗)
eternal_transient: Eternal (B1 + B4)
---

> 
> **🔄 Migration Status (2026-05-28)**: `STILL_VALID_UNDER_M10_M07`
> **Reviewed against**: 2026-05-20 final spec (xlsx)
> **Reviewed on**: 2026-05-28
> **Module scope**: M10, M07
> **Per ADR-0100 §1 classification** (.claude/context/devteam/meetings/2026-05-27-1130-final-spec-migration-strategy/MoM.md)


# ADR-0052 — 庫存歸屬

## Status
Draft

## Context

材料 / 零件由誰買 → 由誰承擔成本 → 誰收料費收入？目前混亂：師傅墊付材料費對帳難、品牌商提供保固件不算師傅成本、平台採購批量料用於多 case。

源自 Excel-01 sheet 18 AI-054；M10 Product BOM；M12 AP。

## Decision（推薦）

**Material schema 加 `owner` 欄位**：

```yaml
material:
  id: <uuid>
  brand: <str>
  model: <str>
  serial: <str?>   # 主鎖 + 高價零件必須（與 ADR-0053 對齊）
  cost: <decimal>
  owner: enum [
    platform,      # 平台採購批量料
    brand,         # 品牌商提供（保固件 / 樣品）
    locksmith,     # 師傅自備
  ]
  source_invoice_id: <uuid?>
  used_in_workorder_id: <uuid?>
```

月結時：
- `owner == platform` → 不入師傅 AP，平台直接成本入帳
- `owner == brand` → 進 Brand Settlement ledger，品牌承擔
- `owner == locksmith` → 進師傅 AP 抵扣（需上傳發票 evidence）

## Alternatives Considered

### Option A — 統一平台庫存
- 風險：F6 師傅體驗差
- 師傅生態流失（D3 護城河受損）

### Option B — 純師傅自管（平台不管）
- 風險：F4 庫存不透明
- 對帳惡夢，保固件責任無法追

## Consequences

**Positive**：
- 三選一覆蓋實際業務
- 月結 ledger 切分清晰（與 §B4 七張帳本對齊）
- Serial 控制與 ADR-0053 一致

**Negative**：
- Material schema 多 1 欄
- 師傅提交材料費需上傳發票 Evidence

**Mitigation**：
- 師傅 App 提供發票拍照 + OCR 輔助
- 品牌商保固件走 Brand Settlement 自動入帳

## Pre-mortem Mapping

對應 §A F4 + F6。F4：對帳混亂；F6：師傅生態若材料費負擔不公會流失。

## Eternal/Transient Classification

- **Eternal**：§B1 Material.owner 欄位 + §B4 ledger 分流
- **Transient**：OCR 發票辨識（§C3 / 第三方）

## Acceptance Criteria
- [ ] 業主圈選：**✅ 推薦** / Option A / Option B
- [ ] 派工主管 + 品牌 + 會計簽核三選一覆蓋實際 case
- [ ] Material schema migration 加 owner 欄位
- [ ] 月結 ledger 三流分開（platform / brand / locksmith）
- [ ] 師傅 App 發票上傳 + Evidence 整合（與 ADR-0050 對齊）
- [ ] BI 報表「Material owner 分布 × 月結金額」

## See also
- §F.3 AI-054 PAIN-POINTS-SUMMARY-2026-05-21.md
- Excel-01 sheet 18 / M10 Product BOM / M12 AP / sheet 14 七張帳本
- ADR-0041 車馬費歸屬（同屬分潤類）
- ADR-0053 Serial 控制
- ADR-0050 Evidence（發票存檔）
