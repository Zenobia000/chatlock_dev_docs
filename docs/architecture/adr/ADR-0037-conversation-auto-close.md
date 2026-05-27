---
id: ADR-0037
title: 對話解決後客戶確認關閉 — quick confirm + 48h 自動
status: accepted
date: 2026-05-21
source_trade_off: §F.1 GAP-D07 PAIN-POINTS-SUMMARY-2026-05-21.md
deciders: [業主]
accepted_date: 2026-05-22
related:
  - 02-ai-chatbot-sync-final-spec-20260520.xlsx#sheet-19 (D07)
  - 02-ai-chatbot-sync-final-spec-20260520.xlsx#sheet-16 (state)
pre_mortem: F4 (合規崩潰) + F5 (規模困境)
eternal_transient: Eternal Process (B2)
---

> 
> **🔄 Migration Status (2026-05-28)**: `STILL_VALID_UNDER_A03_M03`
> **Reviewed against**: 2026-05-20 final spec (xlsx)
> **Reviewed on**: 2026-05-28
> **Module scope**: A03, M03
> **Per ADR-0100 §1 classification** (.claude/context/devteam/meetings/2026-05-27-1130-final-spec-migration-strategy/MoM.md)


# ADR-0037 — 對話解決後客戶確認關閉

## Status
Draft

## Context

AI 遠端解決問題後（L1/L2 命中），對話應該何時關閉？若永遠不關，DB 累積 zombie conversations，BI 分析失準、資料膨脹；若客服主動結案，工作量爆量。需要客戶端的「自動 acknowledge」機制。

源自 DISC-0001 §3 D07。

## Decision（推薦）

**Remote 解決需 quick confirm，48h 自動關閉**：

流程：
1. AI 在 L1/L2 解決後發送 confirm card：「您的問題解決了嗎？✅ 已解決 / ❌ 還有問題」
2. 客戶點 ✅ → 對話狀態 `active → resolved`，立即關閉
3. 客戶點 ❌ → 升級到 L3 真人或重啟診斷
4. **48h 無回應 → 自動 `resolved`**，但留 audit trail「auto-closed by timeout」

Configurable：
- `AUTO_CLOSE_HOURS = 48`（per brand override，例如 VIP 客戶可設 72h）

## Alternatives Considered

### Option A — 客服主動結案
- 風險：F1 弱（人力瓶頸）
- 客服工作量 +20%

### Option B — 永遠不自動關閉
- 風險：F5 累積 zombie conversations
- DB 膨脹，BI 分析失準

## Consequences

**Positive**：
- 48h 是合理 quick confirm 視窗（符合客戶習慣 + 留週末緩衝）
- 自動關閉留 audit「auto-closed by timeout」可區分主動 vs 被動結案
- 釋放 conversation slot 給新對話

**Negative**：
- 48h 內客戶若想 reopen 需重新對話（但可從歷史復原）
- 沒回應 ≠ 真的解決（可能客戶忘了）

**Mitigation**：
- 24h 時提醒一次「請告知是否解決」
- 自動關閉後 7 天內，客戶任何相關 LINE 訊息可 reopen 原對話
- BI 監控「auto-closed by timeout」比例，過高（>30%）需 review

## Pre-mortem Mapping

對應 §A F4 + F5。沒 close 機制 → DB 膨脹 → 5 年後分析失準（F5）；客服無法判斷案件已 resolve → 合規報表失準（F4）。

## Eternal/Transient Classification

- **Eternal**：§B2 Conversation state machine + auto-close policy
- **Transient**：confirm card UI（§C1 channel-specific Flex Message / WhatsApp Interactive）

## Acceptance Criteria
- [ ] 業主圈選：**✅ 推薦** / Option A / Option B
- [ ] 客服主管確認 48h 對客戶習慣可接受
- [ ] Backend 實作 auto-close job + audit event「conversation.auto_closed」
- [ ] AI 對 resolved 對話的後續訊息實作 reopen 邏輯
- [ ] BI 報表加「auto-closed by timeout」比例監控

## See also
- §F.1 GAP-D07 PAIN-POINTS-SUMMARY-2026-05-21.md
- Excel-02 sheet 19 D07 / sheet 16 Conversation state
- ADR-0033 completeness gate（resolved 後 SOP 螺旋）
