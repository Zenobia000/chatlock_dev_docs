---
id: ADR-0030
title: "Tenant ID Propagation — Agent 層補對稱隔離"
status: accepted
tier: 1-decisions
date: 2026-05-16
deciders: [Tech Lead, AI Architect, Backend Lead]
consulted: [SRE, Security]
informed: [Product]
supersedes: null
superseded-by: null
related: [ADR-0024, ADR-0028, CR-0001]
---

> 
> **🔄 Migration Status (2026-05-28)**: `STILL_VALID_UNDER_M17_cross-cutting`
> **Reviewed against**: 2026-05-20 final spec (xlsx)
> **Reviewed on**: 2026-05-28
> **Module scope**: M17, cross-cutting
> **Per ADR-0100 §1 classification** (.claude/context/devteam/meetings/2026-05-27-1130-final-spec-migration-strategy/MoM.md)


# ADR-0030: Tenant ID Propagation — Agent 層補對稱隔離

## Status

Accepted — 2026-05-16

## Context

藍圖 v2 sheet 10「AI Employee Resume」明列 Audit Schema 應包含 `tenant_id`，但實作端：

- **API 端**：`api/core/deps.py:83-88` 每個 endpoint 都檢查 `X-Tenant-ID` header，audit/conversations/problem_cards 都過濾 tenant_id ✅
- **Agent 端**：LINE webhook 進來時**未驗證 user_id 屬於哪個 tenant**；ContextVar 沒有 `_current_tenant`；所有 `INSERT INTO audit_log / user_facts / agent_outbox` 都沒帶 tenant_id ❌

這是不對稱：API 端假定多租戶、agent 端隱含 single-tenant。**目前 production 是 single-tenant 部署所以沒爆**，但只要某一刻接第二個 LINE channel 共用同一個 agent process，就會 cross-tenant 洩漏 user facts。

## Decision

### 1. 立即補 tenant_id 欄位到所有 agent-side 寫入的表

| 表 | 行動 | Default |
|---|---|---|
| `audit_log` | `ADD COLUMN tenant_id VARCHAR(50) NOT NULL DEFAULT 'default'` | `'default'` |
| `user_facts` | 同上 | `'default'` |
| `agent_outbox` | 同上 | `'default'` |
| `belief_states` | 同上 | `'default'` |
| `data_corrections` | 同上 | `'default'` |
| `llm_usage_log` | 同上 | `'default'` |
| `webhook_idempotency` | 建表時直接帶 | `'default'` |

DDL 用 `ALTER TABLE ... ADD COLUMN IF NOT EXISTS ... DEFAULT 'default'`，online migration，既有資料 backfill `'default'`。

### 2. Agent 層加入 `_current_tenant` ContextVar

`agent/skills/tools.py` 既有的 ContextVar pattern 擴展：

```python
_current_tenant: ContextVar[str] = ContextVar("current_tenant", default="default")
```

`harness/debounce.py` 在 `agent_and_reply()` 入口設定，所有下游 INSERT 都從 ContextVar 取值。

### 3. LINE channel → tenant_id mapping（升級路徑，不在本 CR）

當需要 onboard 第二個 tenant 時：
- 加 `line_channel_tenant_mapping` 表 `(line_channel_secret_id PRIMARY KEY, tenant_id VARCHAR(50))`
- `agent/app.py:webhook` 入口從 `LINE Channel Secret` 反查 tenant_id（cached at startup）
- 多 channel 共用同一 process 時，tenant_id 由 channel 決定

**本 CR 不實作 mapping 表**；只把 propagation pipeline 鋪好，預設 `'default'`。

### 4. 跨租戶查詢防護

所有 SELECT 必加 `WHERE tenant_id = $1`：
- ProfileManager.load_facts
- AdminAPIClient 撈回應內容
- audit_storage list queries

加 lint rule：`grep "SELECT.*FROM (user_facts|audit_log|belief_states)" agent/ | grep -v "tenant_id"` 必須為空。

## Consequences

### Positive

- 修補對稱性裂縫，single-tenant 部署無感升級到多租戶
- audit_log payload 終於對得上藍圖 sheet 10 Audit Schema 規範
- 為 GDPR Forget List（藍圖 P1）鋪好前置：刪 user 資料時可按 (tenant_id, user_id) 精確刪

### Negative

- 既有 query 需全面審視加 WHERE tenant_id（短期一次性成本）
- ContextVar 加新欄位 → 任何 forget set 都需要 propagate

### Neutral

- single-tenant 預設不影響當前部署，零回退風險

## Migration Strategy

1. **Phase C3-a (本 CR)**：加欄位 + ContextVar + INSERT 帶 tenant_id（讀仍可不 filter）
2. **Phase C3-b (本 CR)**：所有 SELECT 加 `WHERE tenant_id = $1`
3. **Phase C3-c (未來)**：onboard 第二個 tenant 時加 mapping 表
4. **Phase C3-d (未來)**：lint rule + CI check 強制 WHERE tenant_id

## Alternatives Considered

1. **「先不做，反正 single-tenant」** — 否決：等到出問題再補成本是 5-10 倍；且藍圖規範已有
2. **「schema 不動，從 user_id 推 tenant_id」** — 否決：把業務邏輯藏在隱含 mapping 中，未來 onboard 第二 tenant 必爆
3. **「Row-Level Security (Postgres RLS)」** — 否決：增加 DB-side 複雜度，application-side ContextVar + WHERE 已足夠

## References

- CR-0001 §5, §8 Question 3
- 藍圖 v2.xlsx sheet 10 AI Employee Resume Audit Schema
- `api/core/deps.py:83-88`（既有對稱實作參考）
