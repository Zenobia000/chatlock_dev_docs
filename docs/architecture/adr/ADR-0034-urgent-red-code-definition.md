---
id: ADR-0034
title: urgent / Red Code 定義 — 4 類具名 Event Type
status: accepted
date: 2026-05-21
source_trade_off: §F.1 GAP-D04 PAIN-POINTS-SUMMARY-2026-05-21.md
deciders: [業主]
accepted_date: 2026-05-22
related:
  - 02-ai-chatbot-sync-final-spec-20260520.xlsx#sheet-22
  - 02-ai-chatbot-sync-final-spec-20260520.xlsx#sheet-19 (D04)
  - "./ADR-0045-acceptance-sla-policy.md"
pre_mortem: F4 (合規崩潰)
eternal_transient: Eternal Event Type (B5)
---

> 
> **🔄 Migration Status (2026-05-28)**: `STILL_VALID_UNDER_M03_M15`
> **Reviewed against**: 2026-05-20 final spec (xlsx)
> **Reviewed on**: 2026-05-28
> **Module scope**: M03, M15
> **Per ADR-0100 §1 classification** (.claude/context/devteam/meetings/2026-05-27-1130-final-spec-migration-strategy/MoM.md)


# ADR-0034 — urgent / Red Code 定義

## Status
Draft

## Context

「urgent」與「Red Code」目前散落在 ProblemCard.urgency、SLA 警示、AI 轉真人觸發條件等多處，但具體定義不一致。SLA monitor 不知道哪些算 urgent，AI 不知道何時該升級。

源自 DISC-0001 §3 D04（標 🟡 預設可接受）；Excel-02 sheet 22 Domain Event Catalog。

## Decision（推薦）

**4 類具名 Event Type 進 Domain Event Catalog**：

| Event Type | 觸發條件 | SLA |
|-----------|---------|-----|
| `urgent.locked_out` | 客戶被鎖門外 | 急件 5min 接單 |
| `urgent.trapped_inside` | 門內受困（小孩 / 長輩 / 寵物）| 急件 5min |
| `urgent.safety_risk` | 安全風險（門鎖損壞無法上鎖 / 闖空門）| 急件 5min |
| `urgent.angry_high_risk` | 怒客高風險（情緒分流 ≥ 高 + 投訴傾向）| 5min + 主管即時 LINE 通知 |

每年校準 1 次，新類型走 ADR review，**不切換策略**。

## Alternatives Considered

### Option A — 全 LLM 自判斷
- 風險：F3 高（綁特定模型）
- 評測標準難建，model swap 全要重測

### Option B — 客服主管手動標 urgent
- 風險：F1 弱
- SLA 不可預測，自動化失效

## Consequences

**Positive**：
- 4 類具名 1-pass 規則，LLM 失效仍可運作
- 進 Event Catalog 後 BI 可統計、SLA monitor 可警示
- 與 ADR-0045 接單 SLA 對齊（急件 5min）

**Negative**：
- 漏類別需走 ADR 才能加（這是 feature，不是 bug）

**Mitigation**：
- 每年校準會議 review 新類型
- LLM 仍可輔助分類，但最終以 4 類規則為準

## Pre-mortem Mapping

對應 §A F4。urgent 定義漂移 → SLA 履行不一致 → 合約 4.4 條款未履行 → 客戶 / 法務糾紛。把 4 類事件固化為 §B5 Domain Event Catalog 一員，永久 retention。

## Eternal/Transient Classification

- **Eternal**：§B5 Domain Event Type 4 類具名常數
- **Transient**：LLM 分類器（§C2，僅作輔助）

## Acceptance Criteria
- [ ] 業主圈選：**✅ 推薦** / Option A / Option B
- [ ] 營運主管確認 4 類覆蓋 ≥ 95% 真實 urgent case
- [ ] Backend 把 4 類加入 Domain Event Catalog（Excel-02 sheet 22）
- [ ] SLA monitor 對 4 類事件觸發急件 5min 警示
- [ ] AI guardrail：偵測到 4 類關鍵字 → 強制 `transfer_to_human`
- [ ] 每年校準會議 review

## See also
- §F.1 GAP-D04 PAIN-POINTS-SUMMARY-2026-05-21.md
- Excel-02 sheet 19 D04 / sheet 22 Domain Events
- ADR-0045 接單 SLA（urgent 5min 對齊）
- ADR-0048 AI 轉真人 7 條件
