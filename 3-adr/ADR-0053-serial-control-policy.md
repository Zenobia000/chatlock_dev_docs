---

## id: ADR-0053
title: Serial 控制範圍 — 主鎖 + 高價零件強制
status: accepted
date: 2026-05-21
source_trade_off: §F.3 AI-055 PAIN-POINTS-SUMMARY-2026-05-21.md
deciders: [業主]
accepted_date: 2026-05-22
related:
  - "./ADR-0044-warranty-start-date-modes.md"
  - "./ADR-0052-material-ownership-field.md"
  - 01-workorder-erp-final-spec-20260520.xlsx (M02 Device, M10 Product BOM)
  - 01-workorder-erp-final-spec-20260520.xlsx#sheet-18 (AI-055)
pre_mortem: F4 (保固生效) + F7 (信任護城河)
eternal_transient: Eternal (B1 Device + Material)

# ADR-0053 — Serial 控制範圍

## Status

Draft

## Context

Serial 是保固生效 + RMA 責任追溯 + 防偽的關鍵。但若全部零件都強制 serial，現場流程爆炸；若全部選填，保固爭議無法追。

源自 Excel-01 sheet 18 AI-055；M02 Device；M10 Product BOM。

## Decision（推薦）

**主鎖 + 高價零件強制 serial，低價耗材選填**：


| 品項類型              | Serial 規則          | 範例             |
| ----------------- | ------------------ | -------------- |
| 主鎖（鎖體 / 鎖芯）       | **強制**（綁 Device）   | 電子鎖本體          |
| 高價零件（> NTD 1,000） | **強制**（綁 Material） | 馬達 / 主板 / 高價面板 |
| 一般零件              | 選填                 | 螺絲 / 線材 / 一般面板 |
| 耗材                | 不收 serial          | 電池 / 矽油 / 螺絲膠  |


實作：

- Device schema 必含 serial（主鎖維度）
- Material schema serial 欄位 + `serial_required` boolean（依品項 master 判定）
- 現場 App：強制 serial 時必須拍 serial 條碼 / 手動輸入（OCR 輔助）
- 缺 serial 在強制項 → 工單無法 complete，走 Exception module

## Alternatives Considered

### Option A — 全部選填

- 風險：F4 保固爭議
- 保固歸屬不可追，RMA 責任不清

### Option B — 全部強制

- 風險：F1 弱（過嚴）
- 小額耗材浪費時間，現場 friction +30%

## Consequences

**Positive**：

- 80/20 原則：主鎖 + 高價零件強制，覆蓋 95% 保固爭議來源
- 與 ADR-0044 保固起算（serial 註冊 → activation_date）整合
- 與 ADR-0052 Material.owner 整合（serial 也用於 owner 追溯）

**Negative**：

- 現場流程多 30s / 強制項
- Material master 需維護 `serial_required` 屬性

**Mitigation**：

- Material master 一次建好，後續維護量低
- OCR 條碼掃描縮短輸入時間

## Pre-mortem Mapping

對應 §A F4（保固生效）+ F7（信任護城河 D3）。Serial 鏈是物理證據的核心。

## Eternal/Transient Classification

- **Eternal**：§B1 Device + Material schema serial 欄位
- **Transient**：OCR 條碼掃描實作（§C3）

## Acceptance Criteria

- 業主圈選：**✅ 推薦** / Option A / Option B
- 品牌 + 派工主管 + 主管簽核三層分類
- Material master 補 `serial_required` 屬性
- 現場 App 強制 serial 流程 + OCR 輔助
- 工單 complete 前置條件加 serial 檢查
- BI 報表「Serial 缺失率 by 品項類型」

## See also

- §F.3 AI-055 PAIN-POINTS-SUMMARY-2026-05-21.md
- Excel-01 sheet 18 / M02 / M10 Product BOM / M13 RMA
- ADR-0044 保固起算多模式
- ADR-0052 Material 歸屬
- ADR-0049 現場加價三件套（serial 也算 Evidence 之一）

