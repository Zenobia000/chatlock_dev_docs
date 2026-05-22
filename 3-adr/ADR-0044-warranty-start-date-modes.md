---
id: ADR-0044
title: 保固起算多模式 — Device.warranty_start_date + mode 欄位
status: accepted
date: 2026-05-21
source_trade_off: §F.2 保固起算 PAIN-POINTS-SUMMARY-2026-05-21.md
deciders: [業主]
accepted_date: 2026-05-22
related:
  - "./ADR-0043-brand-project-tenant-scope.md"
  - 01-workorder-erp-final-spec-20260520.xlsx#sheet-04 (P0)
  - 01-workorder-erp-final-spec-20260520.xlsx (M02 Customer/Site/Device)
  - 01-workorder-erp-final-spec-20260520.xlsx (M13 RMA Quality)
pre_mortem: F5 (規模困境) + F4 (合規崩潰 — 保固爭議)
eternal_transient: Eternal (B1 Device schema)
---

# ADR-0044 — 保固起算多模式

## Status
Draft

## Context

保固起算日不同情境不同：
- B2C 散戶：購買日起算
- 建商案件：點交日起算（可能比購買日晚數月）
- 大型專案：啟用日 / 驗收日起算
- 部分品牌：序號註冊日起算

若 hardcode「購買日」會傷建案客戶；若靠每次 case-by-case 判斷會混亂。

源自 Excel-01 sheet 04 P0 保固；M02 Device master；M13 RMA Quality。

## Decision（推薦）

**`Device.warranty_start_date` 支援多模式（mode 欄位）**：

Device schema 加：
```yaml
device:
  warranty_start_date: <date>
  warranty_start_mode: enum [
    purchase_date,        # B2C 預設
    handover_date,        # 建商點交
    activation_date,      # 啟用日 / 序號註冊
    contract_date,        # 大型專案合約日
    manual_override       # 手動指定（需主管核可）
  ]
  warranty_period_months: <int>  # 24 / 36 / 60 視品牌
  warranty_end_date: <computed: start + period>
```

預設規則：
- 一般 B2C 案件：`purchase_date`
- 建商案件（透過 Contract Template ADR-0043 判定）：`handover_date`
- 缺資料 → AI 不可猜，必須轉真人

## Alternatives Considered

### Option A — 強制購買日
- 風險：F1 弱（建案 use case 不支援）
- 建商客戶體驗差，需大量手動 override

### Option B — 依品牌規則動態判斷
- 風險：F2 綁品牌
- 邏輯散落在每個品牌 SOP，難維護

## Consequences

**Positive**：
- Schema 一次設計，覆蓋所有 use case
- 與 ADR-0043 Contract Template 整合（合約決定 mode）
- 與 §F.3 AI-055 Serial 控制對齊（serial 註冊 → activation_date）

**Negative**：
- Device schema 多 2 欄
- 既有 Device record 需 migration 補 mode 欄位

**Mitigation**：
- Migration：既有 Device 預設 `purchase_date`，後續 RMA 時校正
- AI 偵測「保固爭議」→ 強制轉真人（與 §F.3 AI-040 對齊）

## Pre-mortem Mapping

對應 §A F5 + F4。保固規則 hardcode = F5；保固爭議引發法務糾紛 = F4。Schema 化是 future-proof。

## Eternal/Transient Classification

- **Eternal**：§B1 Device.warranty_start_date + warranty_start_mode 欄位
- **Transient**：mode 列表本身（可新增 mode 走 ChangeRequest）

## Acceptance Criteria
- [ ] 業主圈選：**✅ 推薦** / Option A / Option B
- [ ] 主管 + 品牌商簽核 5 種 mode 覆蓋所有 use case
- [ ] Backend migration：既有 Device 補 mode 欄位（預設 purchase_date）
- [ ] 與 ADR-0043 Contract Template `warranty.start_mode` 整合
- [ ] AI 對保固爭議 case 強制轉真人（charter Forbidden 對齊）
- [ ] BI 報表加「warranty.start_mode 分布」監控

## See also
- §F.2 PAIN-POINTS-SUMMARY-2026-05-21.md
- Excel-01 sheet 04 / M02 / M13 RMA
- ADR-0043 Contract Template
- ADR-0028 AI 不可判保固責任
- ADR-0053 Serial 控制（serial 註冊與 activation_date 關聯）
