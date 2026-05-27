---
id: ADR-0026
title: Agent 記憶層分層架構（7 層）
status: accepted
date: 2026-05-16
deciders: [AI Architect, AI Specialist, Operational Lead]
source: docs/_archive/blueprints/AI鎖匠聊天機器人系統開發藍圖_v2.xlsx#sheet-11
related:
  - "./ADR-0010-belief-augmented-react.md"
  - "./ADR-0008-product-info-architecture-canonical.md"
  - "../2-contracts/modules/MC-0003-conversation-manager.md"
  - "../2-contracts/modules/MC-0001-audit-logger.md"
supersedes: []
superseded_by: []
---

> 
> **🔄 Migration Status (2026-05-28)**: `STILL_VALID_UNDER_A03_A04`
> **Reviewed against**: 2026-05-20 final spec (xlsx)
> **Reviewed on**: 2026-05-28
> **Module scope**: A03, A04
> **Per ADR-0100 §1 classification** (.claude/context/devteam/meetings/2026-05-27-1130-final-spec-migration-strategy/MoM.md)


# ADR-0026 — Agent 記憶層分層架構（7 層）

## Status

**Accepted** — 2026-05-16。把分散在 `harness/`、`facts_db`、`audit_db`、Skill registry 的記憶語義一次釘死，作為新模組／kill switch／GDPR 合規時的引用基準。

## Context

`agent/` 目前已落地多種記憶實作（debounce buffer、LangGraph checkpointer、`user_facts` SCD2、SKILL.md、audit log），但語義邊界（TTL / PII 規則 / 寫入觸發 / 讀取觸發）散落各處。缺單一文件導致：

- 隱私／GDPR 詢問（「能不能忘記某個 user？」）每次都要重盤
- 新加 memory（如 Belief Store v2）時邊界爭議
- 跨模組讀寫 race condition 難審

## Decision

採 7 層記憶模型，所有 agent runtime 寫入／讀取必須對齊其中之一：

| 層 | 範圍 | TTL | 儲存 | 讀取觸發 | 寫入觸發 | PII 規則 | 現行實作 |
|---|---|---|---|---|---|---|---|
| Working (Turn Buffer) | 單一 user turn | 1 turn | in-memory | agent 每步 | 每步 | raw OK（進 audit 時 mask） | `harness/debounce.py` merged turn |
| Session (Short-term) | 單一對話 thread | 24h 或 resolved+5 turn | LangGraph checkpointer + (Redis 規劃中) | agent run 開始 | 每 turn 結束 | PII 加密 at rest | `agent` checkpointer + summary |
| Episodic (User Facts) | 用戶層級事實 (brand/model/phone/address) | 永久 (SCD2) | `facts_db` (Postgres) | agent run + handoff | `profile_updater` 寫回 | PII 加密 + RBAC | `user_facts` SCD2（已實作）|
| Semantic (Knowledge) | 可重用 SOP / FAQ / 品牌資料 | 依 mega-doc 版本 | `agent/product_info/` + Vector DB（規劃）| `load_product_info` / RAG | Knowledge Owner approve | 無 PII（必須完全 dehydrated）| `product_info/{Brand}/{Model}.md`（ADR-0008）|
| Procedural (Policy) | 規則 / 政策 / 禁區 | 依 policy version | Policy 規則表 | 高風險 action 前 | Legal + 客服主管 | 無 PII | `output_validator` + `safety_gate` |
| Archival (Audit) | 完整可重播 | ≥1 年（爭議案 ≥3 年）| `audit_db` + cold storage | 稽核 / 客訴 | 每事件 | PII tokenize | `audit_logs`（已實作）|
| Forget List | GDPR right-to-be-forgotten | ≤30 天執行 | delete pipeline | 客戶提出 / 法務指令 | Legal + Ops 雙簽 | PII 永久刪除證明 | **P1 待補** |

## Hard constraints

1. **跨層寫入禁止**：Semantic 層（mega-doc）不得寫入 raw PII；Episodic 寫入必走 `update_user_info` tool（不可直接戳 DB）。
2. **Forget List 是合規 gate**：任何進 production 的新 memory 層必須在這份表格新增一行並指定 forget pipeline，否則不得 deploy。
3. **TTL 變更需 ADR**：本表 TTL 不可在 code 內 magic number 變更；要改要開新 ADR。

## Open items

- Forget List pipeline 實作（P1，2026 Q3 前）
- Vector DB 落地（Semantic 層）— 待 hermes-cs 路線拍板
- Redis 加進 Session 層（目前只有 Postgres checkpointer）

## See also

- [`ADR-0008`](./ADR-0008-product-info-architecture-canonical.md) — Semantic 層的權威架構
- [`ADR-0010`](./ADR-0010-belief-augmented-react.md) — BeliefState v2 落在 Session 層（per-turn append）
- [`MC-0001-audit-logger`](../2-contracts/modules/MC-0001-audit-logger.md) — Archival 層的契約
- 原始藍圖：[`AI鎖匠聊天機器人系統開發藍圖_v2.xlsx`](../_archive/blueprints/) sheet「11 Memory Architecture」
