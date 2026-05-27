---
id: ADR-0036
title: 同 conversation 多 ProblemCard 規則 — 一 active issue 一 PC
status: accepted
date: 2026-05-21
source_trade_off: §F.1 GAP-D06 PAIN-POINTS-SUMMARY-2026-05-21.md
deciders: [業主]
accepted_date: 2026-05-22
related:
  - 02-ai-chatbot-sync-final-spec-20260520.xlsx#sheet-19 (D06)
  - 02-ai-chatbot-sync-final-spec-20260520.xlsx#sheet-21 (Idempotency)
pre_mortem: F2 (簡單原則勝過 case-by-case)
eternal_transient: Eternal State Machine (B2)
---

> 
> **🔄 Migration Status (2026-05-28)**: `STILL_VALID_UNDER_M03`
> **Reviewed against**: 2026-05-20 final spec (xlsx)
> **Reviewed on**: 2026-05-28
> **Module scope**: M03
> **Per ADR-0100 §1 classification** (.claude/context/devteam/meetings/2026-05-27-1130-final-spec-migration-strategy/MoM.md)


# ADR-0036 — 同 conversation 多 ProblemCard 規則

## Status
Draft

## Context

一個 LINE conversation 可能跨越時間軸涵蓋多個問題：今天問鎖 A 沒電、明天問鎖 B 指紋失效、後天追進度問鎖 A 報價。

若不限多 PC 規則，後續 reconcile 噩夢：哪張 PC 對應哪張 WO？保固該歸哪張？月結該扣哪筆？

源自 DISC-0001 §3 D06（標 🟡 待 PM 確認）。

## Decision（推薦）

**規則：同一 active issue 僅一張 PC；新症狀 / 新設備可另建**。

具體實作：
- ProblemCard unique constraint：`(conversation_id, device_id, active_status)` 在 `active` 期間只允許一張
- 「active」定義：status ∈ {draft, incomplete, confirmed}；resolved / cancelled 才釋放
- 新症狀（symptom 變化 ≥ 50%）或新 device_id → 允許另建新 PC
- AI 偵測新症狀時：「您似乎遇到新問題，我幫您建立一張新的問題卡。原問題（PC#xxx）狀態保留。」

Idempotency key 公式（Excel-02 sheet 21）已宣告：`sha256(conv_id + first_unresolved_symptom + brand)`。本 ADR 補上「新症狀 / 新設備可另建」例外規則。

## Alternatives Considered

### Option A — 完全不限多 PC
- 風險：F1（data 亂）
- 一對話多 PC 後續 reconcile 噩夢，BI 統計失準

### Option B — 一對話只能一張 PC（最嚴）
- 風險：F1 弱
- 多設備家庭體驗差（一支鎖一個問題、又問另一支鎖會被拒）

## Consequences

**Positive**：
- 規則簡單、覆蓋 90% 場景
- 多設備家庭仍可服務（另建 PC）
- Idempotency key 公式不變

**Negative**：
- 「新症狀」判定需 LLM / 規則，可能誤判（同一問題被分成兩張 PC）

**Mitigation**：
- AI 偵測新症狀時必須先問客戶「這是新問題還是同一問題的延伸？」
- 客服可手動 merge 兩張誤分的 PC

## Pre-mortem Mapping

對應 §A F2。把規則寫成 schema constraint（B2 state machine）而非 LLM judgment，model swap 不影響。

## Eternal/Transient Classification

- **Eternal**：§B2 PC state machine + unique constraint
- **Transient**：新症狀偵測 classifier（§C2 / C4）

## Acceptance Criteria
- [ ] 業主圈選：**✅ 推薦** / Option A / Option B
- [ ] Backend 實作 `(conversation_id, device_id, active_status)` unique constraint
- [ ] AI 偵測「新症狀」時必須先問客戶確認
- [ ] 客服 UI 提供「merge PC」與「split PC」工具
- [ ] BI 報表加「PC per conversation」分布監控

## See also
- §F.1 GAP-D06 PAIN-POINTS-SUMMARY-2026-05-21.md
- Excel-02 sheet 19 D06 / sheet 21 Idempotency
- ADR-0031（PC → WO 轉換）
