---
id: ADR-0027
title: 模型路由策略（per-scenario model selection）
status: accepted
date: 2026-05-16
deciders: [AI Specialist, AI Ops Lead, FinOps]
source: docs/_archive/blueprints/AI鎖匠聊天機器人系統開發藍圖_v2.xlsx#sheet-12
related:
  - "./ADR-0006-llm-model-selection.md"
  - "./ADR-0007-llm-registry-pattern.md"
  - "./ADR-0010-belief-augmented-react.md"
supersedes: []
superseded_by: []
---

# ADR-0027 — 模型路由策略

## Status

**Accepted** — 2026-05-16。**沿用並擴充 ADR-0006**：ADR-0006 釘住「該用哪些模型」，本 ADR 釘住「哪個場景用哪個模型 + 為什麼 + 預算 / 延遲 SLA」。

## Context

目前 `agent/config.toml` 的 `[llm].model_string` 是單一字串，沒有按場景路由的概念。Quick Reply、RAG、SOP 引導、保固／退款、Vision、Eval、對話壓縮各自需求差異極大（latency / cost / 可靠度／HITL）；混用一個模型會在 cost 與品質之間踩平均。

## Decision

採場景驅動的路由表。每筆變更（首選／備援／預算）必須附 quality_check 對打數據（per ADR-0010 範例）。

| 場景 | 首選 | 備援 | 為何 | Budget / turn | Latency p95 | 備註 |
|---|---|---|---|---|---|---|
| Quick Reply（品牌／型號詢問）| Haiku 4.5 | Sonnet 4.6 | 結構化、低意圖、高頻 | $0.001 | ≤1s | 結構化輸出；無 RAG |
| 一般 FAQ（RAG）| Haiku 4.5 或 Sonnet 4.6 | Opus 4.7 | 依 confidence 切換 | $0.005 | ≤3s | RAG k=3；citation 必開 |
| SOP 引導（`load_product_info` → ReAct）| Sonnet 4.6 | Opus 4.7 | 中度推理 + 多工具 | $0.02 | ≤6s | ReAct + max_iter=4 |
| 保固 / 退款 / 法律 | Sonnet 4.6 草擬 + HITL | Opus 4.7（人審用）| 禁止 final；一定 HITL | $0.05 | ≤10s（異步）| 輸出進客服佇列 |
| 圖片（門鎖損壞照片）| Sonnet 4.6 vision | Gemini 2.5 Pro vision | 判斷／引導補拍 | $0.05 | ≤6s | PII 部分遮蔽（人臉）|
| LLM-as-Judge（Eval）| Opus 4.7 | Sonnet 4.6 | judge 必須高品質 | $0.05 | off-line | 不可省 |
| 對話壓縮 / 摘要 | Haiku 4.5 | Sonnet 4.6 | summary 容錯高 | $0.002 | ≤2s | checkpointer compress |
| Fallback（cost spike / outage）| Haiku 4.5 | — | Circuit breaker | $0.001 | ≤1s | 降級回覆 + 主動轉真人 |

## Hard constraints

1. **保固／退款／法律分支不可用 Haiku** — 即便預算超標，也必須走 Sonnet 草擬 + HITL；commit 不得改此條而不開新 ADR。
2. **Eval 模型不得與被測模型同型號** — 否則 self-judging bias 進 quality_check 報告；違反此條的對打數據視為無效。
3. **預算超出 110% budget 連續 2 週** — 自動觸發 FinOps review；不可由 AI 工程師單方面改 model_string。
4. **Fallback 必須附帶「主動轉真人」** — Circuit breaker 不能只回降級訊息了事。

## Open items

- 動態路由 router（依 confidence / cost telemetry）— P1，2026 Q3
- Vision 模型 PII 遮蔽（人臉模糊）— 法務確認後 P1 上線

## See also

- [`ADR-0006`](./ADR-0006-llm-model-selection.md) — 模型清單（為什麼是這幾個）
- [`ADR-0007`](./ADR-0007-llm-registry-pattern.md) — Registry pattern（怎麼註冊）
- 原始藍圖：sheet「12 Model Routing」
