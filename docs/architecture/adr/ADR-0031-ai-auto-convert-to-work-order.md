---
id: ADR-0031
title: AI 是否可自動 convert_to_work_order — 1-click 人審
status: accepted
date: 2026-05-21
source_trade_off: §F.1 GAP-D01 PAIN-POINTS-SUMMARY-2026-05-21.md
deciders: [業主]
accepted_date: 2026-05-22
related:
  - "./ADR-0028-ai-employee-charter.md"
  - "../docs/prd/DISC-0001-blueprint-snapshot-2026-05-16.md"
  - 02-ai-chatbot-sync-final-spec-20260520.xlsx#sheet-19
  - 02-ai-chatbot-sync-final-spec-20260520.xlsx#sheet-04 (G7)
pre_mortem: F3 (HITL 邊界漂移死)
eternal_transient: Eternal Policy (B3) + Transient UI (C4)
---

> 
> **🔄 Migration Status (2026-05-28)**: `STILL_VALID_UNDER_M03_S-M04`
> **Reviewed against**: 2026-05-20 final spec (xlsx)
> **Reviewed on**: 2026-05-28
> **Module scope**: M03, S-M04
> **Per ADR-0100 §1 classification** (.claude/context/devteam/meetings/2026-05-27-1130-final-spec-migration-strategy/MoM.md)


# ADR-0031 — AI 是否可自動 `convert_to_work_order`

## Status
Draft — 待業主於 §Acceptance Criteria 圈選 ✅/A/B

## Context

`convert_to_work_order` 是 ProblemCard → WorkOrder 的關鍵轉換。AI 自動執行此 tool call 可省客服每筆 30-60s，但也是 HITL 邊界最容易被侵蝕的點。一次誤轉到錯地址 / 錯品牌的工單，在 LINE 截圖傳播後，品牌信任成本可能 = 全年人工確認節省。

源自 DISC-0001 §3 第 D01 條 PM Gap；Excel-02 sheet 04 Chatbot Gate G7（是否可轉 WorkOrder）。

利害關係人：客服主管 / ERP owner / Tech Lead / Legal。

## Decision（推薦）

**AI 草擬 ProblemCard → 客服 1-click 人審後呼叫 `convert_to_work_order`**。

落地：
- AI 完成 PC 草擬後，在客服後台產生「待轉 WO」佇列
- 客服 1-click 確認 → 才實際呼叫 `convert_to_work_order` tool
- AI 自身**永不**直接呼叫 `convert_to_work_order`（charter 鎖死）
- UI 顯示「AI 信心分數 + 缺漏欄位 hint」協助客服快速判斷

## Alternatives Considered

### Option A — 低風險場景全自動轉
條件：保固期內 + 已知品牌 + 標準工項 + 同區地址 + AI 信心 ≥ 0.95。
- Pre-mortem 風險：F3 高 — 一次誤轉在 LINE 截圖傳播，1 次客訴成本可能 = 全年節省（月省 ~30 人時 vs 單次客訴成本 ~NTD 30k+）
- Eternal/Transient：Transient（場景特化，需 maintain 規則）

### Option B — 永遠純手動建 WO，AI 只輔助查詢
- Pre-mortem 風險：F1 弱 — 沒累積轉 WO signal，AI 改善受限
- Eternal/Transient：Eternal 但保守
- 代價：客服每筆 +30-60s；可能因人力瓶頸 cap 業務量

## Consequences

**Positive**：
- HITL 邊界鎖死（防 F3）
- 保留 AI 草擬效率（vs Option B）
- Transient 層可後續優化（vs Option A 場景特化）

**Negative**：
- 客服每筆 +5-10s 確認時間
- UI 複雜度 +15%（需顯示信心分數 + 缺漏 hint）

**Mitigation**：
- 1-click 確認 UI 設計優先（不能變 5-click）
- 信心分數可解釋（顯示前 3 個 missing/uncertain fields）
- 蒐集人審通過率 6 個月後重審本 ADR

## Pre-mortem Mapping

對應 §A F3（HITL 邊界漂移死）。AI 越權承諾保固 / 報價 / 退款 → 一次重大客訴 + 法律訴訟 → 品牌信任歸零。本 ADR 把「自動轉 WO」這個最危險的邊界用 charter 固化，model swap 不會稀釋。

風險量化：
- 不採用：誤轉率即使 0.5%，月 1000 單 × 0.5% × NTD 30k 客訴成本 = NTD 15 萬 / 月
- 採用：客服 1000 × 8s = 2.2 小時/月，約 NTD 2,200 人力成本

## Eternal/Transient Classification

- **Eternal**：「轉 WO 必須人審」為 §B3 Policy 永恆禁區（charter ADR-0028 附議）
- **Transient**：1-click UI 實作（§C4 AgentRuntime / §C5 Deployment）

## Acceptance Criteria
- [ ] 業主圈選：**✅ 推薦** / Option A / Option B / 其他
- [ ] 客服主管簽核「客服每筆 +5-10s」可接受
- [ ] AI Specialist 把「AI 不可直接呼叫 `convert_to_work_order`」寫入 ADR-0028 charter Forbidden 清單
- [ ] QA 補 TC-SYNC-PC-1click 測試（覆 §F.1 D01 + §F.3 AI-017）
- [ ] 6 個月後 review：人審通過率 ≥ 99.5% + 法務 sign-off → 評估開放 Option A 低風險場景

## See also
- §F.1 GAP-D01 PAIN-POINTS-SUMMARY-2026-05-21.md
- Excel-02 sheet 19 D01 / sheet 04 G7
- ADR-0028 AI Employee Charter（Forbidden 清單）
- ADR-0033 ProblemCard completeness gate（前置條件）
- ADR-0032 缺地址 hard stop（前置條件）
