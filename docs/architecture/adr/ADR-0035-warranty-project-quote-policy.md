---
id: ADR-0035
title: 保固 / 建案案件 AI 報價 — AI 可給 range，永禁 final quote
status: accepted
date: 2026-05-21
source_trade_off: §F.1 GAP-D05 PAIN-POINTS-SUMMARY-2026-05-21.md
deciders: [業主]
accepted_date: 2026-05-22
related:
  - "./ADR-0028-ai-employee-charter.md"
  - "./ADR-0054-ai-quote-range-only.md"
  - 02-ai-chatbot-sync-final-spec-20260520.xlsx#sheet-19 (D05)
  - 02-ai-chatbot-sync-final-spec-20260520.xlsx#sheet-04 (G8)
pre_mortem: F3 (HITL 邊界漂移) + F4 (合規崩潰)
eternal_transient: Eternal Policy (B3 永恆禁區)
---

> 
> **🔄 Migration Status (2026-05-28)**: `STILL_VALID_UNDER_M04_M13`
> **Reviewed against**: 2026-05-20 final spec (xlsx)
> **Reviewed on**: 2026-05-28
> **Module scope**: M04, M13
> **Per ADR-0100 §1 classification** (.claude/context/devteam/meetings/2026-05-27-1130-final-spec-migration-strategy/MoM.md)


# ADR-0035 — 保固 / 建案案件 AI 報價邊界

## Status
Draft（GAP-D05 在 Excel sheet 19 已標 🟢 已對齊 ADR-0028，本 ADR 為明文留證）

## Context

保固期內案件、建案 / 社區點交相關案件涉及品牌責任、建商合約、保固條款判定。若 AI 給 final quote，等於 AI 替公司做了「保固承諾 / 法律承諾」，違反 ADR-0028 Forbidden 清單，且一旦 quote 失準造成客訴，會引發法務糾紛。

源自 DISC-0001 §3 D05；Excel-02 sheet 04 G8（是否可報價）；ADR-0028 Forbidden 清單已含 `final price`。

## Decision（推薦）

**AI 可給「range / 範圍」與「教育性說明」，永禁 final quote**：
- 允許：「這類問題通常 NTD 1,500-3,500，視現場狀況。請真人客服確認最終價格。」
- 允許：解釋計價結構（基礎工資 + 標準材料 + 加價項）
- **禁止**：「您的維修費用是 NTD 2,800。」
- **禁止**：「保固期內免費。」（保固判定需真人）
- **禁止**：任何金額確定性語句 + 個案承諾

具體實作：
- ADR-0028 Forbidden 清單明文加入 `quote.final_commitment` / `warranty.coverage_decision`
- Guardrail（§C4 AgentRuntime）對含「NTD <number>」+ 無「範圍/估計/通常」修飾語的回覆觸發 regen
- Eval set 200 題含 50 題保固 / 建案誘導 → 期望 AI 給 range + 轉真人

## Alternatives Considered

### Option A — AI 給 final quote + 免責條款
- 風險：F3 邊界漂移 + 法律風險
- 一次法律糾紛成本可能 = 全年 AI 報價節省

### Option B — 連 range 都不能說
- 風險：F1 弱（過保守）
- 客戶體驗下降，自助率 -20%

## Consequences

**Positive**：
- AI 可給教育性 range（防 F1），永禁 final（防 F3 + F4）
- 與 ADR-0028 charter 對齊，model swap 不會稀釋
- 客戶仍能獲得粗估，不至於完全不知所云

**Negative**：
- 客戶等真人確認 +5-15 min
- 部分客戶會表達不滿「為什麼不能直接給價」

**Mitigation**：
- AI 主動引導：「我給您一個範圍，真人客服會在 X 分鐘內確認」
- 接單 SLA 對保固 / 建案案件需加快（與 ADR-0045 對齊）

## Pre-mortem Mapping

對應 §A F3 + F4。AI 報價漂移是 F3 最高風險之一；保固承諾失準直接觸發 F4 合規崩潰（合約 4.4 + 法務糾紛）。把此邊界寫入 ADR + Eval set，model swap 仍生效。

## Eternal/Transient Classification

- **Eternal**：§B3 永恆禁區（charter ADR-0028 第一條 Forbidden）
- **Transient**：Guardrail regex / classifier 實作（§C4）

## Acceptance Criteria
- [ ] 業主圈選：**✅ 推薦** / Option A / Option B
- [ ] Legal 簽核「AI 給 range 不構成承諾」之免責條款
- [ ] AI Specialist 把禁止項補入 ADR-0028 Forbidden 清單
- [ ] Eval set 補 50 題保固 / 建案誘導測試
- [ ] Guardrail 自動偵測「NTD <number>」+ regen 觸發

## See also
- §F.1 GAP-D05 + §F.3 AI-041 PAIN-POINTS-SUMMARY-2026-05-21.md
- Excel-02 sheet 04 G8 / sheet 08 風險治理「亂報價」/ sheet 19 D05
- ADR-0028 AI Employee Charter
- ADR-0054 獨立 AI 報價 range only（charter 一致性留證）
