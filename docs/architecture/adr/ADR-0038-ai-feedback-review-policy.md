---
id: ADR-0038
title: AI feedback / SOP 審核機制 — 高風險雙審 / 低風險單審
status: accepted
date: 2026-05-21
source_trade_off: §F.1 GAP-D08 PAIN-POINTS-SUMMARY-2026-05-21.md
deciders: [業主]
accepted_date: 2026-05-22
related:
  - "./ADR-0028-ai-employee-charter.md"
  - 02-ai-chatbot-sync-final-spec-20260520.xlsx#sheet-05 (RAG 螺旋 S6)
  - 02-ai-chatbot-sync-final-spec-20260520.xlsx#sheet-19 (D08)
  - 01-workorder-erp-final-spec-20260520.xlsx#sheet-20 (AI Ops)
pre_mortem: F6 (人才流失) + F2 (知識被技術綁架)
eternal_transient: Eternal Process (D2 知識護城河)
---

> 
> **🔄 Migration Status (2026-05-28)**: `STILL_VALID_UNDER_M20_A10`
> **Reviewed against**: 2026-05-20 final spec (xlsx)
> **Reviewed on**: 2026-05-28
> **Module scope**: M20, A10
> **Per ADR-0100 §1 classification** (.claude/context/devteam/meetings/2026-05-27-1130-final-spec-migration-strategy/MoM.md)


# ADR-0038 — AI feedback / SOP 審核機制

## Status
Draft

## Context

AI 從成功案例自動草擬 SOP / Skill。這些 draft 若直接入庫，可能污染知識護城河（D2）；若全部雙審，知識更新速度太慢。需要差異化審核策略。

源自 DISC-0001 §3 D08；Excel-02 sheet 05 RAG 知識治理 S6 Human Correction；Excel-01 M20 AI Ops。

## Decision（推薦）

**高 / 低風險分流**：

| 風險等級 | 範疇 | 審核 | SLA |
|---------|------|------|-----|
| **高風險** | 報價 / 退款 / 保固 / 法律相關 SOP | **客服主管 + Domain expert 雙審** | 5 工作日 |
| **中風險** | 派工 / 加價 / 改期 SOP | 客服主管單審 | 2 工作日 |
| **低風險** | FAQ / 操作教學 / 通用問答 | Knowledge Owner 單審 | 1 工作日 |

風險分類判定：SOP draft 含「金額 / 退款 / 保固 / 法律」關鍵字 → 自動標高風險；含「派工 / 改期」→ 中；其他 → 低。

審核流程：
- 通過 → status: `approved` + effective_date + version + audit trail
- 退回 → 留 reviewer comment，AI 可修訂後重提
- 拒絕 → 標記 `rejected` 永久封存

## Alternatives Considered

### Option A — 全自動 SOP 入庫
- 風險：F3 + F6（錯誤入庫毀知識庫）
- 知識污染風險高，無人為品質把關

### Option B — 全部雙審（最嚴）
- 風險：F1 弱
- 知識更新慢，月新增 SOP -50%，AI 演進受阻

## Consequences

**Positive**：
- 高 / 低風險分流符合 80/20 原則
- 知識資產跟著公司走（防 F6 人才流失）
- vendor-neutral markdown SOP 不綁 LLM（防 F2）

**Negative**：
- 風險分類規則需維護（誤判可能讓高風險走單審）

**Mitigation**：
- 風險分類規則每季 review
- 任何審核者可手動升級風險等級
- Eval set 對「分類正確率」做 regression

## Pre-mortem Mapping

對應 §A F6 + F2。SOP 螺旋（S1-S7）強制閉環是 D2 知識護城河的關鍵；vendor-neutral 格式保證 model swap 知識不流失。

## Eternal/Transient Classification

- **Eternal**：§D2 知識護城河 + §E2 知識螺旋 S6 Human Correction
- **Transient**：審核 UI 工具（§C5 deployment）

## Acceptance Criteria
- [ ] 業主圈選：**✅ 推薦** / Option A / Option B
- [ ] Knowledge Owner 確認三層分類覆蓋實際 SOP 類型
- [ ] 風險分類規則寫入 ChangeRequest 流程（與 ADR-0046 對齊）
- [ ] Backend 實作 SOP draft → review queue 三層分流
- [ ] BI 監控「審核 SLA 達成率」+「review reject 比例」
- [ ] 每季 review 風險分類規則

## See also
- §F.1 GAP-D08 PAIN-POINTS-SUMMARY-2026-05-21.md
- Excel-02 sheet 05 RAG S6 / sheet 19 D08
- Excel-01 M20 AI Ops
- ADR-0028 AI Employee Charter（KPI 與 SOP 連動）
- ADR-0046 ChangeRequest 物件化
