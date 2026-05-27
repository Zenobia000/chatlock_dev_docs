---
id: FR-0029
title: SKILL 知識庫 (SKILL.md + RAG)
status: active
phase: I
mapped_to:
  - A04    # Skill 知識庫
  - M20    # Knowledge governance
superseded_clauses:
  - BR-A04-01    # 路徑 metadata 控制品牌 / 型號
  - BR-A04-02    # 主要輸出 SOP 知識
  - BR-A04-NN    # router skill 引導子技能
  - BR-A04-NN    # RAG document retrieval，禁寫進 prompt (ADR-0057)
emits_events:
  - SkillLoaded
  - RagQueryExecuted
nfr_flavored: false
priority: P0
tier: 2
owner: Knowledge Owner / AI Engineer
last_reviewed: 2026-05-28
related_adrs:
  - ADR-0055    # SKILL ↔ LLM 解耦合約
  - ADR-0057    # RAG 文件檢索 ban prompt
  - ADR-0058    # external knowledge ingestion
  - ADR-0101    # agent-kb × final-spec integration（data lineage + multi-tenant scope + custom SKU fallback）
related:
  - "../../_source/02-ai-chatbot-sync.md#a-m04-skill知識庫"
---

# FR-0029 — SKILL 知識庫

> **新增 FR (2026-05-28)** — 對應 A04。Phase I。

## §1 Use Case Skeleton

| 欄位 | 內容 |
|:-----|:-----|
| **Actor** | A03 ReAct (consumer) / Knowledge Owner (manage) |
| **Secondary Actors** | RAG store, Ingestion Gateway |
| **Trigger** | A03 呼叫 `load_skill` tool |
| **Precondition** | SKILL.md 已 publish (FR-0017) |
| **Main Flow** | 詳見 §1.1 → user-flow:A04-step1 |
| **Alternative Flow** | 詳見 §1.2 |
| **Postcondition** | skill content 注入 A03 context；emit `SkillLoaded` |

### §1.1 Main Flow

1. A03 `load_skill(brand, model, intent)` → user-flow:A04-step1
2. 系統依 metadata 路徑解析 ([ref: BR-A04-01])
3. router skill 引導到子 skill ([ref: BR-A04-NN])
4. RAG 取 document chunks ([ref: ADR-0057])
5. emit `SkillLoaded` + `RagQueryExecuted`
6. END

### §1.2 Alternative Flow

```
A1. Skill 不存在:
    A1.1 router fallback 到 generic skill

A2. RAG 5xx:
    A2.1 fail-soft，A03 用 base knowledge

A3. Ingestion 來源 SOP (alternative path):
    A3.1 經 Ingestion Gateway schema validate (ADR-0058)
    A3.2 寫入 RAG index
```

## §2 Acceptance Criteria

### AC-01: load skill happy path

```gherkin
When A03 load_skill("Samsung", "SHS-P718", "unlock_help")
Then SKILL.md 取得 + RAG 取 chunks
  And `SkillLoaded` emit
```

### AC-02: RAG ban in prompt

```gherkin
When 開發者試圖把合約寫進 prompt
Then CI gate 拒絕 (ADR-0057)
```

### AC-03: Ingestion validate

```gherkin
When 外部平台 ingest SOP
Then schema validate + 寫 index
```

## §3 Reference Map

| 類型 | ID | 用途 |
|:-----|:---|:-----|
| BR | BR-A04-01/02/NN | path / output / router / RAG |
| ADR | ADR-0055/0057/0058 | decouple / RAG / ingestion |
| ADR | ADR-0101 | agent-kb × final-spec integration（KB authoring + multi-tenant scope rule + custom SKU fallback） |
| Event | SkillLoaded / RagQueryExecuted | — |

## §4 Change Log

| Date | Change |
|:-----|:-------|
| 2026-05-28 | **新建** — A04 module FR 殼 |
| 2026-05-28 | **Cross-ref backfill**：補 ADR-0101（agent KB × final-spec integration contract — data lineage / multi-tenant / custom SKU fallback） | ADR cascade 2026-05-28 |
