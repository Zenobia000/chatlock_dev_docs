---
id: ADR-0045
title: 接單 SLA — 一般 10min / 急件 5min + per brand override
status: accepted
date: 2026-05-21
source_trade_off: §F.2 接單 SLA + §F.3 AI-048 PAIN-POINTS-SUMMARY-2026-05-21.md
deciders: [業主]
accepted_date: 2026-05-22
related:
  - "./ADR-0034-urgent-red-code-definition.md"
  - "./ADR-0043-brand-project-tenant-scope.md"
  - 01-workorder-erp-final-spec-20260520.xlsx#sheet-04 (P0)
  - 01-workorder-erp-final-spec-20260520.xlsx#sheet-18 (AI-048)
pre_mortem: F4 (合規崩潰 — SLA 履行) + F5 (規模困境)
eternal_transient: Eternal Process + Transient config
---

> 
> **🔄 Migration Status (2026-05-28)**: `STILL_VALID_UNDER_M06`
> **Reviewed against**: 2026-05-20 final spec (xlsx)
> **Reviewed on**: 2026-05-28
> **Module scope**: M06
> **Per ADR-0100 §1 classification** (.claude/context/devteam/meetings/2026-05-27-1130-final-spec-migration-strategy/MoM.md)


# ADR-0045 — 接單 SLA

## Status
Draft

## Context

派工後師傅多久要接單？若無 SLA，案件積壓 → 客戶不滿；若全平台 unified 不可調整，高端品牌（VIP 合約）與一般案件相同待遇 → 高端品牌不滿。

源自 Excel-01 sheet 04 P0 接單 SLA；sheet 18 AI-048。

## Decision（推薦）

**基準 SLA + per brand override**：

| 案件類型 | 預設 SLA | 觸發來源 |
|---------|---------|---------|
| 一般案件 | 10 分鐘 | 系統 push 後 10 min 內未接 → escalate |
| 急件（urgent.* 4 類）| 5 分鐘 | ADR-0034 4 類事件 |
| VIP 客戶（Contract Template 標 `vip: true`）| 5 分鐘 | Contract Template override |
| 大型專案 | 依合約 | Contract Template 自訂 |

Escalation：
- 10/5 min 超時 → push 給下一個師傅 + 主管 LINE 通知
- 連續 3 次 escalation → SLA violation event 進 BI / 月結扣分

## Alternatives Considered

### Option A — 全平台 unified（不可 override）
- 風險：F5 規模困境
- 高端品牌不滿，VIP 合約難談

### Option B — Per region 浮動（鄉鎮 vs 都會 SLA 不同）
- 風險：F4 一致性差
- KPI 不可比，客戶投訴難判定

## Consequences

**Positive**：
- 與 ADR-0034 urgent 4 類事件對齊（5 min）
- Per brand override 透過 ADR-0043 Contract Template 落地
- SLA violation 進 BI，可量化師傅績效

**Negative**：
- 急件 / 一般判定錯誤會導致 SLA 失準
- Per brand SLA 多套，客服 / 派工需培訓

**Mitigation**：
- 急件判定走 ADR-0034 4 類具名規則（非 LLM 自判）
- 派工 UI 顯示「當前案件 SLA + 剩餘時間」
- 師傅 App 顯示 SLA 警示（剩 2 min 紅色）

## Pre-mortem Mapping

對應 §A F4 + F5。SLA 履行率是合約 KPI；per brand override 防 F5。

## Eternal/Transient Classification

- **Eternal**：§B2 Dispatch state machine + SLA escalation 邏輯
- **Transient**：具體分鐘數（configurable per Contract Template）

## Acceptance Criteria
- [ ] 業主圈選：**✅ 推薦** / Option A / Option B
- [ ] 派工主管確認 10/5 min 對師傅生態可行
- [ ] Backend 實作 SLA monitor + escalation chain
- [ ] 與 ADR-0034 urgent 4 類事件對齊
- [ ] 與 ADR-0043 Contract Template `sla.acceptance_min` 整合
- [ ] BI 報表「SLA 達成率 by 師傅 × 區域 × brand」

## See also
- §F.2 + §F.3 AI-048 PAIN-POINTS-SUMMARY-2026-05-21.md
- Excel-01 sheet 04 / sheet 18 / M06 Dispatch
- ADR-0034 urgent 4 類事件
- ADR-0043 Contract Template
