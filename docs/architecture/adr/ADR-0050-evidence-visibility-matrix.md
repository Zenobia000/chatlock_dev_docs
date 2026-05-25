---
id: ADR-0050
title: Evidence 可見性矩陣 — 角色 × 案件生命週期權限
status: accepted
date: 2026-05-21
source_trade_off: §F.3 AI-052 PAIN-POINTS-SUMMARY-2026-05-21.md
deciders: [業主]
accepted_date: 2026-05-22
related:
  - "./ADR-0042-rbac-four-tier-principle.md"
  - "./ADR-0051-evidence-retention-policy.md"
  - 01-workorder-erp-final-spec-20260520.xlsx (M09 Evidence)
  - 01-workorder-erp-final-spec-20260520.xlsx#sheet-18 (AI-052)
pre_mortem: F4 (合規崩潰 — PII 外洩)
eternal_transient: Eternal RBAC (B3 + B5)
---

# ADR-0050 — Evidence 可見性矩陣

## Status
Draft

## Context

Evidence（施工前後照片、客戶簽名、聊天記錄、發票）涉及 PII + 商業機密 + 法律憑據。不同角色該看到不同子集：
- 客戶不該看到平台成本拆分
- 師傅不該看到其他師傅的 Evidence
- 品牌商不該看到競品的 Evidence
- 稽核員可全看但唯讀

源自 Excel-01 sheet 18 AI-052；M09 Evidence。

## Decision（推薦）

**Evidence 可見性矩陣：角色 × 案件生命週期 × 屬性 scope**：

| 角色 | 可見 Evidence | 案件生命週期限制 | 屬性過濾 |
|------|--------------|----------------|---------|
| Customer | 自家工單的施工前後照片 + 完工簽名 | 結案後 90 天可查 | `customer_id == self` |
| Locksmith | 自己負責工單的全部 Evidence | 結案後 30 天可查 | `assigned_locksmith_id == self` |
| Customer Service | 經辦工單的全部 Evidence | 結案後 1y 內 | `created_by == self OR assigned == self` |
| Accounting | 全工單財務 Evidence（發票 / 收款證明 / 退款）+ 必要工單 Evidence | 永久（依 retention）| `tenant_id` 內 |
| Brand User | 自家品牌工單的 Evidence（不含其他品牌）| 結案後 1y 內 | `brand_scope` 過濾 |
| Supervisor | 全 tenant Evidence | 永久 | `tenant_id` |
| Auditor | 全 Evidence | 永久（唯讀）| `tenant_id` |
| Family Reviewer | SOP 入庫相關 Evidence（合約 4.4(d)）| 永久（唯讀）| `tenant_id` |
| AI Bot | **不主動暴露 Evidence URL 給對話**；可引用內部 ID 給 transfer_to_human | N/A | 與當前 conversation_id 綁定 |

## Alternatives Considered

### Option A — 全公開（所有角色看全部）
- 風險：F4 PII 外洩
- 個資外洩 + 商業機密外洩

### Option B — 全私有（僅平台 Supervisor 可看）
- 風險：F1 弱
- 品牌 / 師傅 / 客戶體驗差，無法自助查詢

## Consequences

**Positive**：
- 與 ADR-0042 RBAC 4 層 + tenant_id / brand_scope 整合
- 案件生命週期限制防止永久暴露
- 合約 4.4(d) 家族覆核員角色明文

**Negative**：
- 可見性 engine 複雜度 +20%
- 跨域 case（如客戶要求查保固歷史）需特殊路徑

**Mitigation**：
- 客戶查歷史走「客服代查」流程（不直接開放）
- BI 報表「Evidence 訪問 by role × case stage」異常偵測

## Pre-mortem Mapping

對應 §A F4。PII / 商業機密外洩是 F4 最大風險之一。

## Eternal/Transient Classification

- **Eternal**：§B3 RBAC 可見性矩陣 + §B5 Evidence
- **Transient**：UI 過濾實作（§C5）

## Acceptance Criteria
- [ ] 業主圈選：**✅ 推薦** / Option A / Option B
- [ ] Security + 主管 + Legal 簽核矩陣
- [ ] Backend RBAC engine 支援案件生命週期 + 屬性過濾
- [ ] PII retention 與 ADR-0051 保存期整合
- [ ] BI 報表「Evidence 訪問異常」監控
- [ ] AI 在對話中不主動暴露 Evidence URL（charter Forbidden 對齊）

## See also
- §F.3 AI-052 PAIN-POINTS-SUMMARY-2026-05-21.md
- Excel-01 sheet 18 / M09 Evidence / M17 Auth-Audit
- ADR-0042 RBAC 4 層
- ADR-0051 Evidence 保存期
- ADR-0028 charter（AI PII 邊界）
- 合約 4.4(d) 家族覆核員
