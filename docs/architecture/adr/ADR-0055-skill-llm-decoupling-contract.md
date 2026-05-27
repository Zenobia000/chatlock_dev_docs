---
id: ADR-0055
title: SKILL ↔ LLM 解耦合約 — vendor swap 可移植
status: accepted
date: 2026-05-22
source_trade_off: PAIN-POINTS-SUMMARY-2026-05-21.md §A F2 + ACTION-ITEMS-2026-05-22.md MATTER-04
deciders: [業主]
accepted_date: 2026-05-22
related:
  - "./ADR-0028-ai-employee-charter.md"
  - "./ADR-0047-ai-forbidden-list-as-charter.md"
  - "./ADR-0057-rag-document-retrieval-not-prompt.md"
pre_mortem: F2 (知識被技術綁架死)
eternal_transient: Eternal Contract (B3) + Transient adapter (C2)
---

> 
> **🔄 Migration Status (2026-05-28)**: `STILL_VALID_UNDER_A03_A04`
> **Reviewed against**: 2026-05-20 final spec (xlsx)
> **Reviewed on**: 2026-05-28
> **Module scope**: A03, A04
> **Per ADR-0100 §1 classification** (.claude/context/devteam/meetings/2026-05-27-1130-final-spec-migration-strategy/MoM.md)


# ADR-0055 — SKILL ↔ LLM 解耦合約

## Status
Accepted (2026-05-22)

## Context

當前主力 LLM 突然停服或漲價 10 倍時，若 SKILL.md 內混入 vendor-specific 格式（prompt template、function-calling spec、tool schema），更換廠商等於重寫 1500+ 條 SKILL.md，工程估時 6 個月。期間 AI 客服降級到人工，現金流崩潰。

對應 §A F2 — 知識被技術綁架死。業主於 2026-05-22 會議確認三條設計鐵律：
1. SKILL 可被抽換
2. LLM 可被抽換
3. SKILL 與 LLM 必須解耦

## Decision（業主拍板 2026-05-22）

**SKILL ↔ LLM 解耦合約**：

### 1. SKILL.md vendor-neutral 規範
- SKILL.md 內**禁止**：
  - 特定 LLM 廠商的 prompt template 語法（如 `<system>` vs `[INST]` 等差異）
  - 特定廠商的 function-calling JSON schema
  - 特定模型的 token limit / temperature 預設值
- SKILL.md 內**必須**：
  - 用 vendor-neutral Markdown + structured fields（intent / inputs / outputs / forbidden）
  - Tool 用 abstract interface name，不寫實作細節

### 2. LLM Adapter Layer（§C2）
所有 LLM 呼叫經 `LLMGateway` adapter，提供統一介面：
```python
class LLMGateway(Protocol):
    def chat(messages: list[Message], tools: list[Tool]) -> Response
    def embed(text: str) -> Vector
    def vision(image: bytes, prompt: str) -> Response
```
具體實作（OpenAI / Anthropic / Gemini / Local）為 swappable adapter。新增廠商 = 新增 adapter file，**不改 SKILL.md**。

### 3. Tool 介面標準化
所有 tool 用 OpenAPI 3.1 schema 定義，由 adapter 翻譯成各廠商格式：
- OpenAI: function calling JSON
- Anthropic: tool_use blocks
- Gemini: function declarations

### 4. Eval Set 可攜性
Eval set 用 vendor-neutral YAML 描述（input / expected_output / forbidden_patterns），由 adapter 跑各家廠商。每次新增廠商必須跑完整 Eval set，pass rate < 95% 不允許上線。

### 5. 部署門檻
CI pipeline 加入 **portability test**：
- 同一份 SKILL.md + Eval set 必須能在至少 2 家 LLM adapter 上跑通
- 若任何 SKILL.md 含 vendor-specific token → build fail

## Alternatives Considered

### Option A — 不解耦，鎖定單一廠商
- 風險：F2 高
- 廠商漲價 / 停服 → 6 個月重寫
- 已捨棄

### Option B — 為每家廠商寫一份 SKILL.md
- 風險：F2 + F5 規模困境
- N 個 SKILL × M 個廠商 = NM 份文件，維護惡夢
- 已捨棄

## Consequences

**Positive**：
- 廠商可在 1 sprint 內切換（adapter swap + Eval regression）
- SKILL.md 是永恆資產，跨廠商複用
- 對應 §D2 知識護城河（知識存在資料層而非執行框架）

**Negative**：
- LLMGateway adapter 初期開發成本 +20%
- 部分廠商獨有功能（如 Anthropic computer use）需 fallback 處理
- Eval set 必須 vendor-neutral，初期撰寫成本 ↑

**Mitigation**：
- 廠商獨有功能列為 optional capability，SKILL 不依賴
- Eval set 由 QA + AI Specialist 共同撰寫
- 每季 review portability test 覆蓋率

## Pre-mortem Mapping

對應 §A F2。把知識從「執行框架」（vendor 綁定）移到「資料層」（vendor-neutral markdown + adapter）。即使廠商全換，SKILL.md / Eval set / Tool spec 都還在。

## Eternal/Transient Classification

- **Eternal**：§B3 SKILL ↔ LLM 解耦原則、Tool OpenAPI schema、Eval set 規範
- **Transient**：具體 LLMGateway adapter 實作（每家廠商）、prompt template tuning

## Acceptance Criteria
- [x] 業主拍板 2026-05-22：✅ 認同並訂為設計鐵律
- [ ] AI Specialist 撰寫 LLMGateway Protocol + 至少 2 個 adapter (預設 + 備援)
- [ ] 所有現存 SKILL.md 掃描：移除 vendor-specific token
- [ ] CI pipeline 加 portability test gate
- [ ] Eval set 重寫為 vendor-neutral YAML 格式
- [ ] 每季 portability review，覆蓋率 ≥ 80%
- [ ] 與 ADR-0057 對齊：合約 / 規則走 RAG，禁寫進 prompt

## See also
- PAIN-POINTS-SUMMARY-2026-05-21.md §A F2
- ACTION-ITEMS-2026-05-22.md MATTER-04
- ADR-0028 AI Employee Charter
- ADR-0047 AI Forbidden List
- ADR-0057 合約 / 規則走 RAG 文件檢索
- §D2 知識護城河、§E2 7 層記憶
