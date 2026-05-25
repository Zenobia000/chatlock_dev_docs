---
id: ARCH-0005
date: 2026-05-10
deciders: [Tech Lead, Architecture team]
title: Module Boundary — data/pipeline/
tier: 1
status: accepted
last_updated: 2026-05-10
source_paths:
  - data/pipeline/
related:
  - "../architecture-overview.md"
  - "../../2-contracts/master-data/"
---

# Module Boundary — data/pipeline/

> **角色**：Medallion 4 層 ETL pipeline；產出 SKILL.md 給 `agent/skills/data/`。

## Owns

- Source → Raw 下載（YouTube via yt-dlp、website via Playwright、Google Drive）
- Raw → Bronze 抽取轉換（Whisper ASR、Vision LLM、PDF parsing）
- Bronze → Silver 語義切塊（LLM 切 chunk）
- Silver → SKILL approval（分類 + 草稿 + 人工審核 → SKILL.md）
- SKILL.md output 路徑決策：依 brand suffix → `agent/skills/data/{Brand}/{_all-models | Model}/`；無 suffix → `_common/`
- pgvector embedding store（PG_VECTOR_URI）
- `data/config.toml`

## Does NOT Own

- LINE Bot / agent runtime → `agent/`
- API / 業務邏輯 → `api/`
- DB schema → `SQL/`
- Approval UI → `web/admin/knowledge-base/sop-drafts`

## Dependencies

| 依賴 | 介面 | 用途 |
| :-- | :-- | :-- |
| PostgreSQL + pgvector | psycopg + pgvector | embedding store |
| Vertex AI | LiteLLM | Vision / Whisper / chunk classification |
| Google Drive | service account | 下載資料源 |
| yt-dlp | CLI | YouTube |
| Playwright | Python | website scraping |

## ACL

- 外部資料源解析必須先過 ACL，避免 vendor schema 污染 silver
- V3 引入 Anti-Corruption Layer（CR-0003 Phase B）：每 OEM brand 一個 adapter

## Public API

- CLI 腳本：`uv run python data/pipeline/silver_to_skill/approve_drafts.py`
- 不 expose HTTP

## Health Boundaries

- 任一層失敗：保留前一層輸出，記錄 audit + alert，不污染下游
- LLM 超時 / 配額用罄：batch 暫停，不重試

## 待整理

具體 layer-by-layer pipeline 設計見 source `docs/02-design/agent-harness/migration-roadmap.md`（含 V2.0 升級到結構化 SOP review）。

V3 多租戶 + ACL：[`../../4-exploration/multi-tenant-platform/architecture.md`](../../4-exploration/multi-tenant-platform/architecture.md)
