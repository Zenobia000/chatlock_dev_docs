---
id: ADR-0040
title: 退款核准分層 — 5 層金額分層
status: accepted
date: 2026-05-21
source_trade_off: §F.2 退款核准分層 PAIN-POINTS-SUMMARY-2026-05-21.md
deciders: [業主]
accepted_date: 2026-05-22
related:
  - 01-workorder-erp-final-spec-20260520.xlsx#sheet-04 (P0)
  - 01-workorder-erp-final-spec-20260520.xlsx#sheet-08 (Phase II)
  - 01-workorder-erp-final-spec-20260520.xlsx#sheet-11 (RBAC)
  - "./ADR-0042-rbac-four-tier-principle.md"
pre_mortem: F4 (合規崩潰)
eternal_transient: Eternal RBAC (B3 + B4)
---

# ADR-0040 — 退款核准分層

## Status
Draft（Excel sheet 04 P0 標「未決」）

## Context

退款是高風險財務動作。若無分層核准，小額退款卡主管 / 大額退款卻被客服輕易放行，都是合規風險。

源自 Excel-01 sheet 04 P0 退款核准條目；sheet 08 Phase II Finance；sheet 11 RBAC。

## Decision（推薦）

**5 層金額分層核准**：

| 層級 | 金額區間 | 核准 |
|------|---------|------|
| L1 | ≤ NTD 1,000 | 客服主管 |
| L2 | NTD 1,001 - 5,000 | 營運主管 |
| L3 | NTD 5,001 - 30,000 | 營運主管 + 會計 |
| L4 | NTD 30,001 - 100,000 | 主管 + 會計 |
| L5 | > NTD 100,000 | 雙簽（主管 + 會計 + Sponsor）|

退款理由必填（reason code）：
- `customer_dispute` / `quality_issue` / `wrong_dispatch` / `warranty_coverage` / `goodwill` / `other`

所有退款進 Refund Ledger（B4），audit trail 永久留證。

## Alternatives Considered

### Option A — 責任歸屬導向（品牌 / 平台 / 師傅 各自分層）
- Pre-mortem 風險：F3 邊界更穩定但複雜度高
- 矩陣維度 ↑ 2x（金額 × 責任 = 5 × 3 = 15 種組合）
- Eternal 但實作成本高

### Option B — 全走主管 + 會計雙簽
- 風險：F1 弱（過嚴）
- 小額退款 SLA -50%，客訴上升

## Consequences

**Positive**：
- 5 層金額分層清晰
- L5 雙簽防止大額異常
- 與 RBAC 4 層原則（ADR-0042）對齊

**Negative**：
- 跨層退款（如 4,999 vs 5,001）邊界需嚴格
- 責任歸屬另作為 BI 維度，不影響核准層

**Mitigation**：
- 金額判定以「實際退款金額」非「原案件金額」
- BI 報表加「退款 by reason code × 責任歸屬」分析
- 半年 review 各層退款比例，調整門檻

## Pre-mortem Mapping

對應 §A F4。沒有退款分層 → 大額退款被誤批 / 小額退款卡關 → 客訴 + 合規風險。RBAC + Ledger 雙重把關。

## Eternal/Transient Classification

- **Eternal**：§B3 RBAC 退款核准邏輯 + §B4 Refund Ledger
- **Transient**：金額門檻數字（configurable via ChangeRequest）

## Acceptance Criteria
- [ ] 業主圈選：**✅ 推薦** / Option A / Option B
- [ ] 主管 + 會計簽核 5 層門檻金額
- [ ] Backend 實作 Refund Ledger + 核准 workflow
- [ ] 與 ADR-0042 RBAC 4 層整合（誰可核准哪層）
- [ ] AI 永禁核准退款（charter ADR-0028 Forbidden）
- [ ] 6 個月後 review 門檻

## See also
- §F.2 PAIN-POINTS-SUMMARY-2026-05-21.md
- Excel-01 sheet 04 / sheet 08 / sheet 11 / M11 AR-Refund
- ADR-0028 AI 不可核准退款
- ADR-0042 RBAC 4 層原則
- ADR-0039 取消費分段（取消費 ≠ 退款，但同 ledger 系列）
