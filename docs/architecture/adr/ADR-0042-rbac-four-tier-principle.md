---
id: ADR-0042
title: 角色權限矩陣 4 層原則 + 具體欄位 configurable
status: accepted
date: 2026-05-21
source_trade_off: §F.2 角色權限矩陣 + §F.3 AI-016 PAIN-POINTS-SUMMARY-2026-05-21.md
deciders: [業主]
accepted_date: 2026-05-22
related:
  - 01-workorder-erp-final-spec-20260520.xlsx#sheet-11 (權限角色矩陣)
  - 01-workorder-erp-final-spec-20260520.xlsx#sheet-12 (角色維護者)
  - 01-workorder-erp-final-spec-20260520.xlsx#sheet-04 (P0)
  - 01-workorder-erp-final-spec-20260520.xlsx#sheet-18 (AI-016)
  - "./ADR-0046-change-request-object.md"
pre_mortem: F4 (合規崩潰) + F5 (規模困境)
eternal_transient: Eternal Principle (B3) + Transient field (configurable)
---

> 
> **🔄 Migration Status (2026-05-28)**: `STILL_VALID_UNDER_M17`
> **Reviewed against**: 2026-05-20 final spec (xlsx)
> **Reviewed on**: 2026-05-28
> **Module scope**: M17
> **Per ADR-0100 §1 classification** (.claude/context/devteam/meetings/2026-05-27-1130-final-spec-migration-strategy/MoM.md)


# ADR-0042 — 角色權限矩陣 4 層原則

## Status
Draft（取代 Excel sheet 11「全 11 行待確認」狀態）

## Context

18 個角色（顧客 / AI Bot / 客服 / 派工 / 師傅 / 會計 / 主管 / IT / 稽核員 / 品牌 / 經銷 / 建商 / 家族覆核員 ...）的精確權限矩陣未閉環。若全部 hardcode 會在新角色 / 新品牌進來時崩潰；若全 ABAC（屬性導向）開發成本爆炸。

源自 Excel-01 sheet 11 / sheet 12；sheet 04 P0 角色權限；sheet 18 AI-016；合約 4.4(d) 家族覆核要求。

## Decision（推薦）

**4 層原則固化為 Eternal，具體欄位走 Transient configuration**：

| 層 | 角色 | 可見性原則 | 可改 | 可核准 |
|----|------|-----------|------|--------|
| **顧客層** | Customer / AI Bot | 只看自己單據，不看成本 | 自己資料 | 無 |
| **營運層** | Customer Service / Dispatcher / Locksmith | 案件必要欄位，不跨域 | 操作欄位 | 部分（自己責任範圍）|
| **財務層** | Accounting | 全域財務 + 必要工單證據 | Ledger 操作 | 退款 L1-L3、月結 |
| **治理層** | Supervisor / Admin / IT / Auditor / Family Reviewer | 全域報表 / 唯讀稽核 | 系統設定 | 全核准 + 異常處理 |

**家族覆核員**（合約 4.4(d) 專屬）：歸入治理層，但僅限「SOP 入庫前的最終覆核」+ audit 唯讀，不能改其他系統設定。

**Brand User**：跨在「營運層 + 顧客層」之間 —— 看自家品牌的工單 / 報表，但不看其他品牌資料。

具體欄位級權限走 RBAC engine 的 configuration table（透過 ChangeRequest，ADR-0046）。

## Alternatives Considered

### Option A — ABAC 全屬性導向
- 風險：F5 規模困境（複雜度）
- 開發成本 +50%，新角色進入仍需重設 attribute mapping
- Transient

### Option B — 全自訂矩陣（每角色硬編碼）
- 風險：F5 規模困境（換品牌全重設）
- 維護惡夢

## Consequences

**Positive**：
- 4 層原則固化（B3），新角色 / 新品牌走原則映射
- 具體欄位走 configuration，無需 code change
- 合約 4.4(d) 家族覆核自然落地

**Negative**：
- RBAC engine 需支援屬性過濾（中等開發成本）
- 4 層原則仍可能在跨域角色（如 Brand User）需特例

**Mitigation**：
- Brand User 設計為「營運層 + brand_scope 屬性過濾」
- 跨域角色明文寫入 RBAC table，避免「隱含特例」
- 每季 review RBAC table

## Pre-mortem Mapping

對應 §A F4 + F5。權限矩陣不清 → PII / 財務 / 證據外洩 → F4；新品牌進入要重做矩陣 → F5。4 層原則 + tenant_id / brand_scope 屬性（ADR-0030 已啟蒙）共同防範。

## Eternal/Transient Classification

- **Eternal**：§B3 RBAC 4 層原則
- **Transient**：具體欄位權限（configurable via ChangeRequest）

## Acceptance Criteria
- [ ] 業主圈選：**✅ 推薦** / Option A / Option B
- [ ] 主管 + IT + Auditor 簽核 4 層原則
- [ ] 家族覆核員權限明文 + audit trail（合約 4.4(d)）
- [ ] Brand User 屬性過濾測試（不能跨品牌看資料）
- [ ] RBAC engine 支援 brand_scope / tenant_id 屬性
- [ ] 每季 review RBAC table

## See also
- §F.2 + §F.3 AI-016 PAIN-POINTS-SUMMARY-2026-05-21.md
- Excel-01 sheet 11 / sheet 12 / sheet 04 / sheet 18 / M17 Auth-Audit
- ADR-0030 Tenant ID Propagation
- ADR-0040 退款核准分層（誰可核准哪層）
- ADR-0046 ChangeRequest 物件化
- 合約 4.4(d) 家族成員覆核
