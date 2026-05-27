---
id: ADR-0043
title: 品牌 / 建商專案邊界 — 合約模板 + tenant scope
status: accepted
date: 2026-05-21
source_trade_off: §F.2 品牌 / 建商專案邊界 PAIN-POINTS-SUMMARY-2026-05-21.md
deciders: [業主]
accepted_date: 2026-05-22
related:
  - "./ADR-0030-tenant-id-propagation.md"
  - "./ADR-0042-rbac-four-tier-principle.md"
  - 01-workorder-erp-final-spec-20260520.xlsx#sheet-04 (P0)
  - 01-workorder-erp-final-spec-20260520.xlsx (M14 Partner Portal)
pre_mortem: F5 (規模困境) + F7 (被巨頭吞噬)
eternal_transient: Eternal (B1 tenant_id + brand_scope)
---

> 
> **🔄 Migration Status (2026-05-28)**: `STILL_VALID_UNDER_M14_M17`
> **Reviewed against**: 2026-05-20 final spec (xlsx)
> **Reviewed on**: 2026-05-28
> **Module scope**: M14, M17
> **Per ADR-0100 §1 classification** (.claude/context/devteam/meetings/2026-05-27-1130-final-spec-migration-strategy/MoM.md)


# ADR-0043 — 品牌 / 建商專案邊界

## Status
Draft

## Context

每個品牌商 / 經銷商 / 建商 / 社區可能有獨立合約：B2B SLA、月結週期、責任分配、保固政策、可見性範圍。若每個都 hardcode，30 個品牌 = 30 個 branch；若靠外部 CRM 管，主權外移失去護城河。

源自 Excel-01 sheet 04 P0 品牌/建商邊界；M14 Partner Portal。

## Decision（推薦）

**合約模板（Contract Template）+ tenant scope 抽象**：

1. **Contract Template** 為 §B1 業務物件，schema：
   ```yaml
   contract:
     id: <uuid>
     partner_id: <brand_id | dealer_id | builder_id>
     scope: [tenant_id, brand_scope[], site_group_id?]
     sla: { acceptance_min: 10, urgent_min: 5, ... }
     billing: { cycle, cutoff_day, payment_terms_days }
     warranty: { start_mode: purchase_date|handover_date|activation_date, period_months }
     liability_matrix: { brand: %, platform: %, locksmith: %, customer: % }
     visibility_rule: <RBAC rule reference>
     effective_date / expiry_date
     version
   ```

2. **tenant_id / brand_scope / site_group_id** 為 §B1 一級欄位（ADR-0030 已啟蒙），所有業務物件帶這些 scope

3. 新增品牌 / 建案 = 新增 Contract Template instance，**零 code change**

## Alternatives Considered

### Option A — per-project hardcode
- 風險：F5 規模困境（30 建案 = 30 套 code）
- 不可持續

### Option B — 外部 CRM（Salesforce / Hubspot）
- 風險：F2 + F7（資料外移失主權）
- 護城河流失，CRM 變成 source of truth 而非平台

## Consequences

**Positive**：
- 主權留平台（D3 信任護城河）
- 新品牌 / 建案無需 code change，走 Contract Template configuration
- 與 RBAC（ADR-0042）+ tenant ID（ADR-0030）整合

**Negative**：
- Contract Template schema 設計需謹慎（一次設計，長期維護）
- 合約模板維護工作量（每個新合約需 Partner manager 操作）

**Mitigation**：
- Contract Template 走 ChangeRequest（ADR-0046）流程，audit 留證
- 提供 Contract Template UI 給 Partner manager（非 IT 操作）
- BI 報表加「Contract Template 數量 × 簽約 partner」監控

## Pre-mortem Mapping

對應 §A F5 + F7。F5：規模困境的核心是合約配置 hardcode；F7：主權外移 = 護城河流失。Contract Template 把品牌生態納入平台原生 schema。

## Eternal/Transient Classification

- **Eternal**：§B1 Contract Template schema + tenant_id / brand_scope 一級欄位
- **Transient**：UI 操作工具（§C5 deployment）

## Acceptance Criteria
- [ ] 業主圈選：**✅ 推薦** / Option A / Option B
- [ ] Partner manager + 主管簽核 Contract Template schema 設計
- [ ] Backend 實作 Contract Template CRUD + scope 過濾
- [ ] 與 ADR-0030 tenant_id propagation 整合
- [ ] 第一份 Contract Template（甲方自家）建立並 dogfood
- [ ] 30+ partner 時不需 code change 即可上線

## See also
- §F.2 PAIN-POINTS-SUMMARY-2026-05-21.md
- Excel-01 sheet 04 / M14 Partner Portal
- ADR-0030 Tenant ID Propagation
- ADR-0042 RBAC 4 層原則
- ADR-0044 保固起算多模式（warranty.start_mode 在合約內）
- ADR-0046 ChangeRequest
