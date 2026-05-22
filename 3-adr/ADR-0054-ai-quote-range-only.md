---
id: ADR-0054
title: AI 報價邊界（range only）— 獨立 ADR for charter 一致性
status: accepted
date: 2026-05-21
source_trade_off: §F.3 AI-041（與 §F.1 D05 同主題）PAIN-POINTS-SUMMARY-2026-05-21.md
deciders: [業主]
accepted_date: 2026-05-22
related:
  - "./ADR-0035-warranty-project-quote-policy.md"
  - "./ADR-0028-ai-employee-charter.md"
  - "./ADR-0047-ai-forbidden-list-as-charter.md"
  - 01-workorder-erp-final-spec-20260520.xlsx#sheet-18 (AI-041)
pre_mortem: F3 (HITL 邊界漂移)
eternal_transient: Eternal Policy (B3 永恆禁區)
---

# ADR-0054 — AI 報價邊界（range only）

## Status
Draft（與 ADR-0035 同主題，**獨立留證**以維持 charter 一致性的書面依據）

## Context

AI 報價邊界出現在兩個 §F 條目：
- §F.1 GAP-D05 → ADR-0035 聚焦「保固 / 建案」場景
- §F.3 AI-041 → 本 ADR-0054 聚焦「全局 AI 報價邊界 charter 一致性」

雖然主題重疊，但獨立 ADR 的好處：
- ADR-0035 範圍是「保固 / 建案 case 特殊處理」
- ADR-0054 範圍是「**所有**對話 AI 報價邊界」一致原則
- ADR-0028 charter Forbidden 引用本 ADR 作為「為什麼 final quote 永禁」的論證來源

源自 Excel-01 sheet 18 AI-041。

## Decision（推薦）

**全域 AI 報價邊界**：

AI 在任何 conversation 中：
- **允許**：給 range（如「NTD 1,500-3,500」）+ 計價結構說明 + 引導真人確認
- **允許**：引用已核准 fixed-price rule（如「電池更換固定 NTD 800」需 brand fixed-price approved）
- **禁止**：個案 final quote（如「您這次是 NTD 2,800」）
- **禁止**：折扣承諾（如「我給您打 9 折」）
- **禁止**：保固免費承諾（保固判定走真人，ADR-0035）

Guardrail（§C4 AgentRuntime）實作：
- 偵測「NTD <number>」+ 缺乏「範圍 / 估計 / 通常 / 約」修飾語 → 觸發 regen
- 偵測「折扣 / 優惠 / 打折」+ 個案語境 → 觸發 regen
- 偵測「免費 / 不收費」+ 保固語境 → 觸發 regen + 強制 `transfer_to_human`

## Alternatives Considered

### Option A — AI 給 final quote + 免責條款
- 同 ADR-0035 Option A
- 風險：F3 高 + 法律風險

### Option B — 連 range 都不能說
- 同 ADR-0035 Option B
- 風險：F1 弱

## Consequences

**Positive**：
- ADR-0028 charter Forbidden 有明確 ADR 引用源（防止 charter 條目被工程單方面移除）
- Guardrail 規則明文，model swap 不影響
- 與 ADR-0035 / 0047 形成「保固 + 全域 + Forbidden 入 charter」三角防線

**Negative**：
- 與 ADR-0035 主題重疊（這是 feature，charter 一致性需獨立留證）

**Mitigation**：
- ADR-0035 與 ADR-0054 互引；ADR-0028 同時引用兩者
- 若未來合併為單一 ADR，需走 ADR supersedes 流程

## Pre-mortem Mapping

對應 §A F3 主防線。

## Eternal/Transient Classification

- **Eternal**：§B3 永恆禁區
- **Transient**：Guardrail classifier（§C4）

## Acceptance Criteria
- [ ] 業主圈選：**✅ 推薦** / Option A / Option B
- [ ] Legal + AI Lead 簽核全域邊界
- [ ] ADR-0028 charter Forbidden 加入引用：`see ADR-0054 + ADR-0035`
- [ ] Guardrail 三規則實作 + Eval set 覆蓋
- [ ] Eval set 50+ 題誘導測試（不限保固 / 建案場景）

## See also
- §F.3 AI-041 + §F.1 D05 PAIN-POINTS-SUMMARY-2026-05-21.md
- Excel-01 sheet 18 / Excel-02 sheet 04 G8 / sheet 08
- ADR-0028 AI Employee Charter
- ADR-0035 保固 / 建案 quote policy
- ADR-0047 AI Forbidden 集中 charter
