---
id: ADR-0057
title: 合約 / 規則走 RAG 文件檢索，禁寫進 prompt
status: accepted
date: 2026-05-22
source_trade_off: PAIN-POINTS-SUMMARY-2026-05-21.md §A F2 + F3 + ACTION-ITEMS-2026-05-22.md MATTER-05
deciders: [業主]
accepted_date: 2026-05-22
related:
  - "./ADR-0055-skill-llm-decoupling-contract.md"
  - "./ADR-0056-per-vendor-contract-attachment-spec.md"
  - "./ADR-0047-ai-forbidden-list-as-charter.md"
pre_mortem: F2 (知識被技術綁架) + F3 (HITL 邊界漂移)
eternal_transient: Eternal Pattern (B3 + C2) + Transient prompt template
---

> 
> **🔄 Migration Status (2026-05-28)**: `STILL_VALID_UNDER_A04`
> **Reviewed against**: 2026-05-20 final spec (xlsx)
> **Reviewed on**: 2026-05-28
> **Module scope**: A04
> **Per ADR-0100 §1 classification** (.claude/context/devteam/meetings/2026-05-27-1130-final-spec-migration-strategy/MoM.md)


# ADR-0057 — 合約 / 規則走 RAG 文件檢索，禁寫進 prompt

## Status
Accepted (2026-05-22)

## Context

業主於 2026-05-22 會議明文：**「LLM 是透過文件去檢索，不是寫在 prompt 內」**。

若把合約 / 規則 / SOP / 政策直接寫進 prompt template：
- Token 用量爆炸（每次對話塞 5000+ token 合約）
- 換模型 / 廠商全部 prompt 要重調
- 規則更新要重新部署
- 規則漂移：prompt 內容 vs 實際合約版本可能不同步
- 對應 F2 (知識被技術綁架) + F3 (邊界漂移)

## Decision（業主拍板 2026-05-22）

**RAG-first 文件檢索原則**：

### 1. 一律走 RAG
以下所有內容**禁止**寫進 prompt template，必須走 RAG 文件檢索：
- 合約條款（per ADR-0056）
- 業務規則（SLA / 報價 / 退款 / 取消 / 保固 / 加價）
- SOP 知識庫（per ADR-0038）
- 廠商規格（lock model / parts）
- 法律 / 合規規則（PII retention / 個資法 / 4.4 條款）

### 2. Prompt template 可包含
- AI 角色 / 語氣設定
- Forbidden 清單 ref ADR-0047（但具體 forbidden 規則仍走 RAG）
- 對話 stage 控制
- Tool 使用引導
- 「請查詢 contract id=xxx 的 sla 條款」這類**檢索指示**

### 3. RAG 架構
```
User Query
   ↓
LLM (with prompt template)
   ↓ [decides what to retrieve]
ContractGateway / SOPGateway / KnowledgeGateway
   ↓ [vector search + filter by tenant_id, brand_scope, version]
返回片段 + source citation
   ↓
LLM 整合回答（必須引用 source）
```

### 4. 引用強制（Citation）
任何引用合約 / 規則的 AI 回答都必須附 source：
```
依您的合約第 4.4 條（contract-id: xxx, v2.1, accessed 2026-05-22）...
```
無 citation → guardrail 攔截 + regen。

### 5. RAG Index 維護
- 文件改版 → ChangeRequest (ADR-0046) → 重 index
- Index 包含 metadata：version, effective_date, tenant_scope
- 過期文件不刪除（合規 retention），但檢索預設只取 active

### 6. Eval 200 題（per ADR-0047）
新增測試類別「Prompt-vs-RAG separation」：
- 故意問需查合約的問題
- AI 必須觸發 RAG，不可從 prompt 編造
- 無 citation 視為 fail
- pass < 95% → block deploy

## Alternatives Considered

### Option A — 規則寫進 prompt template
- 風險：F2 + F3 雙觸發
- token 爆炸 + 規則漂移
- 已捨棄

### Option B — 規則寫進程式碼
- 風險：F5
- 30 廠商 = 30 branch
- 已捨棄

### Option C — Hybrid（核心規則 prompt + 細節 RAG）
- 風險：界線模糊，最終仍漂移
- 已捨棄

## Consequences

**Positive**：
- Prompt token 用量降 60-80%
- 廠商 swap 不影響規則
- 規則改版只需重 index，不需重部署
- 對應 §D2 知識護城河

**Negative**：
- RAG infra 開發成本（embedding + vector store + gateway）
- 每次回答 latency +200-500ms
- citation enforcement 需要額外 guardrail

**Mitigation**：
- 用成熟向量資料庫（pgvector / Chroma / Weaviate）
- Latency budget 寫進 SLO
- citation guardrail 走 ADR-0047 Eval pipeline

## Pre-mortem Mapping

對應 §A F2 + F3。把「規則 / 合約 / 知識」從執行框架（prompt）分離到資料層（vector index）。換 LLM 廠商不影響規則，規則改版不影響 prompt。

## Eternal/Transient Classification

- **Eternal**：§B3 RAG-first 原則 + §C2 LLMGateway 分離 + citation 強制
- **Transient**：具體 vector DB 選擇、embedding model、prompt template tuning

## Acceptance Criteria
- [x] 業主拍板 2026-05-22：✅ 認同並訂為硬規則
- [ ] Backend 建 RAG infra（vector store + embedding pipeline）
- [ ] AI Specialist 撰寫 ContractGateway / SOPGateway / KnowledgeGateway
- [ ] 所有現存 prompt 掃描：移除合約條款 / 規則 / SOP 內容
- [ ] Eval set 加 50+ 題「Prompt-vs-RAG separation」測試
- [ ] CI gate：未通過此類測試的 prompt 變更 block deploy
- [ ] Citation enforcement：guardrail 攔截無 source 的合約引用回答
- [ ] RAG latency budget 寫進 NFR (< 500ms p95)

## See also
- PAIN-POINTS-SUMMARY-2026-05-21.md §A F2, F3
- ACTION-ITEMS-2026-05-22.md MATTER-05
- ADR-0055 SKILL ↔ LLM 解耦
- ADR-0056 每廠商合約附件規格
- ADR-0047 AI Forbidden 集中 + Eval pipeline
- ADR-0038 SOP 雙審入庫
- §D2 知識護城河、§E2 7 層記憶 (Semantic + Episodic)
