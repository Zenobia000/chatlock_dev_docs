---
id: ARCH-0002
date: 2026-05-10
deciders: [Tech Lead, Architecture team]
title: Module Boundary — agent/
tier: 1
status: accepted
last_updated: 2026-05-10
source_paths:
  - agent/
synced-with-CLAUDE-md: true
related:
  - "../architecture-overview.md"
  - "../../2-contracts/modules/{problem-card-engine, audit-logger, vision-processing, inter-agent-messaging}.md"
---

# Module Boundary — agent/

> **角色**：LINE Bot AI 客服代理；含 LangGraph ReAct Agent + 12 層 Harness Pipeline + Skill 系統 + Profile 系統。

## Owns

- LINE Webhook (`agent/app.py`)
- ReAct Agent + 3 tools (`agent/agent.py`、`agent/skills/tools.py`：`load_skill` / `update_user_info` / `transfer_to_human`)
- Harness pipeline H1-H12（debounce / data-correction / quick-reply / multimodal / safety-gate / output-validator / profile-updater / memory-manager / audit）
- Skill 兩階段載入（startup + per-request filter by brand/model）
- Skill 資料：`agent/skills/data/{_common, {Brand}/{_all-models, Model}/}/SKILL.md`
- Profile 系統：hard facts (DB SCD2) + soft facts (per-brand)
- Checkpointer (in-process / SQLite / PostgreSQL via memory registry)
- Audit log storage (storage registry)
- LLM 統一介面（LiteLLM；模型字串 `vertex_ai/gemini-...`）
- Quality check（LLM-as-Judge eval pipeline）
- CLI 互動模式（`main.py`）+ FastAPI 模式（`uvicorn app:app`）

## Does NOT Own

- 工單 CRUD / 派工演算法 → `api/`
- 退款 / 保固 / 帳務 → `api/`
- Admin Panel UI → `web/`
- 資料蒐集 / 知識庫產出 → `data/pipeline/`（產 SKILL.md 給 agent 用）
- LINE channel 設定 / Secret Manager → ops

## Dependencies

| 依賴 | 介面 | 用途 |
| :-- | :-- | :-- |
| PostgreSQL | psycopg async | checkpointer + facts + audit + corrections |
| LINE Messaging API | line-bot-sdk | webhook + push |
| Vertex AI | LiteLLM | LLM 推理 + embedding |
| Opik | env vars | LLM observability（optional） |
| api/ | HTTP REST | (V2.0+) admin bridge per ADR-0009 |

## ACL（Anti-Corruption Layer）

- LINE Webhook 簽章驗證 → harness/safety_gate.py
- Multimodal 入口 → harness/multimodal.py（image/audio/video 統一轉文字 ref）
- Profile fact LLM 抽取 → harness/profile_updater.py（不信任 raw LLM 輸出，必須 schema validate）

## Public API

| Endpoint | 用途 |
| :-- | :-- |
| `POST /webhook` | LINE webhook |
| `GET /chat?q=...&user_id=...` | 測試端點（bypass debounce + LINE）|
| `GET /health` | facts_db + audit_db 連線檢查 |

## Health Boundaries

- DB 連線失敗 → `/health` 回 503，但 `/webhook` 仍嘗試 fallback（in-process checkpointer）
- LLM timeout 180s → 回友善文字 + 升 L3
- Multimodal 下載失敗 → buffer placeholder 替換為 `[使用者曾傳送圖片，下載失敗]`

## 分層方向性（從 _audit/code-architecture-review-2026-05-06）

⚠️ **2 條反向 import 待修**：
- `harness/debounce.py:24 from agent import get_system_prompt`
- `skills/tools.py:10 from harness.line_ui_factory`

修正方向：harness → agent / skills → harness 為單向。

## 模組詳細

詳細模組契約見 [`../../2-contracts/modules/INDEX.md`](../../2-contracts/modules/INDEX.md)（9 V1.0 core modules + 15 specs）。
