---
id: ADR-0029
title: "Fail-soft 路徑統一收斂到 Outbox + Audit + Review Queue 三件組"
status: accepted
tier: 1-decisions
date: 2026-05-16
deciders: [Tech Lead, AI Architect, Backend Lead]
consulted: [客服主管, ERP Owner]
informed: [Knowledge Owner, SRE]
supersedes: null
superseded-by: null
related: [ADR-0009, ADR-0024, ADR-0025, ADR-0026, CR-0001]
---

> 
> **🔄 Migration Status (2026-05-28)**: `STILL_VALID_UNDER_A05_cross-cutting`
> **Reviewed against**: 2026-05-20 final spec (xlsx)
> **Reviewed on**: 2026-05-28
> **Module scope**: A05, cross-cutting
> **Per ADR-0100 §1 classification** (.claude/context/devteam/meetings/2026-05-27-1130-final-spec-migration-strategy/MoM.md)


# ADR-0029: Fail-soft 路徑統一收斂到 Outbox + Audit + Review Queue 三件組

## Status

Accepted — 2026-05-16

## Context

本專案多處設計刻意採用 **fail-soft**（捕獲異常不阻塞主流程）以保證 LINE 1 秒回應限制與 user-facing 流暢度。但在 CR-0001 稽核中發現，fail-soft 被當作「容錯」的同時，也成了「資料黑洞」：

| Fail-soft 點 | 失敗時資料去向（原狀） | 問題 |
|---|---|---|
| `audit_storage.log_tool_invocation` | `pass` no-op | 工具呼叫全部丟失 |
| `audit_storage.log_escalation` | `pass` no-op | 轉真人事件丟失，客服看不到 |
| `audit_storage.log_safety_gate` | `pass` no-op | H6 安全閘攔截全部丟失 |
| `pc_creator.maybe_create_problem_card` | catch → log warning + `_write_outbox` | outbox 寫了但**無 worker 撈** |
| `profile_updater` 抽 facts | catch → log warning | 失敗無紀錄、無 review queue |
| `data_corrections` | 寫 DB status=pending | **無 admin API / Dashboard 消費** |
| memory compression | RemoveMessage 後丟 in-memory summary | raw 訊息**無 cold storage**，>1 年重播不可能 |
| LINE webhook 失敗 | 回 HTTP 5xx → LINE 自動重送 | **無 idempotency 保護**，重送產生重複對話 |

所有「fail-soft」實際上的失敗去向都不一樣：有的真寫了表（outbox / data_corrections）但沒 consumer，有的是 no-op stub 騙人，有的根本沒設計。**藍圖 v2 sheet 08 風險治理** 寫得很漂亮（idempotency key / review queue / archival 都有規範），但實作層沒對齊。

## Decision

宣告**所有 fail-soft 路徑都必須對應到下列三件組之一**，並補齊缺失的環節：

### 1. Outbox Pattern — 給「想呼外部 API 但會失敗」的場景

```
業務動作 → 寫 outbox (status='pending') → 嘗試外部 call → 成功標 succeeded / 失敗保留 pending
                                              ↑
                                         consumer worker 定期掃 pending 重試
```

**現有實例**：
- `agent_outbox` 表（`SQL/Schema_doc_numbering.sql:71-92`）
- `AdminAPIClient._write_outbox` 寫入端 ✅
- **CR-0001 補**：consumer worker (`scripts/outbox_worker.py`)

**未來新加 fail-soft 外部 call 必走 outbox**。禁止「catch + log warning + 返回 None」這種無持久化的 fire-and-forget。

### 2. Audit Log — 給「想觀察但不影響主流程」的場景

```
事件發生 → asyncio.create_task(audit_storage.log_event(...)) → 失敗只 log warning
                       ↑
            log_event 內部 INSERT audit_log 表（fire-and-forget）
```

**現有實例**：
- `audit_log` 表 schema 已支援 `event_type` + `payload JSONB`（`SQL/Schema_v2_extensions.sql:233`）
- `PostgresAuditStorage.log_event` ✅
- **CR-0001 補**：`log_tool_invocation` / `log_escalation` / `log_safety_gate` 改成呼叫 `log_event`，不再 `pass`

**禁止 audit method 留 `pass` no-op**。若該事件不需要 audit，從 caller 端不要呼叫；不要在 callee 端假裝有寫。

### 3. Review Queue — 給「需要人工核准」的場景

```
事件發生 → 寫 review table (status='pending') → admin API list + approve/reject endpoints
                                                          ↓
                                                   approved 才進正式表
```

**現有實例**：
- `data_corrections` 表寫入端 ✅
- **CR-0001 補**：list + approve + reject API (`api/routers/data_corrections.py`) + web 頁面

**未來凡是「LLM / Agent 提議但不能自動上 production」的內容必走 review queue**。包含 SOP draft、profile fact correction、知識更新等。

## 三件組決策矩陣

| 情境 | 用哪個？ |
|---|---|
| 寫外部 API（admin API / 第三方 webhook） | Outbox |
| 純內部觀察事件（tool call / safety gate / escalation / LLM cost） | Audit Log |
| Agent / LLM 提議內容需人工核准 | Review Queue |
| 寫外部 API + 需人工核准 | Outbox → 撈出後進 Review Queue |
| 純資料壓縮 / 歸檔 | Audit Log (event_type 區分) |
| 同一事件重送防護 | 獨立 idempotency table（變體；不算三件組但同精神） |

## Consequences

### Positive

- **No more silent data loss**：所有 fail-soft 點都有對應 durable storage 與 consumer
- **可稽核**：藍圖 sheet 10 AI Employee Resume Audit Schema 終於對得上實作
- **可重播**：memory archival NFR-MEM-001 (≥1 年) 可實現
- **可治理**：藍圖 sheet 08 風險治理的 7 條紅線都有對應的「資料去哪」答案

### Negative

- **audit_log 寫量增加**：補完 3 個 stub 後預期寫量 ×3-5 倍。Mitigation：partition by month + 1 年 retention
- **每個新 fail-soft 路徑需先選對三件組之一**：增加 review 成本，但這是治理 vs 速度的合理取捨
- **outbox worker 成為新運維點**：需監控 backlog；Cloud Run min-instance=1 保證不死

### Neutral

- 既有 `agent_outbox.status='processing'` lease 機制需確認 worker 重啟時不會 double-fire（worker 啟動先把 `processing` 過 stale TTL 的撈回 `pending`）

## Alternatives Considered

1. **「都用 Kafka / pub-sub」** — 否決：增加 infra 複雜度，當前流量不需要；agent_outbox + audit_log 表足夠
2. **「全部走 Sentry / Datadog」** — 否決：observability tool 不是 source of truth，事件可能被取樣/截斷；audit_log 是業務資產不是 telemetry
3. **「保持 no-op stub，反正失敗很少」** — 否決：失敗少 ≠ 失敗時不重要；轉真人事件丟失 = 客服看不到客戶 = 客訴

## Compliance

新增 PR 若觸發以下任一條件，**reviewer 必須驗證**該變更走了三件組之一：

- `except` 捕獲後沒有 raise 也沒有寫表 → ❌ block
- 新增 `def log_*(self, ...)` method 但 body 是 `pass` → ❌ block
- 新增寫外部 API 邏輯沒有 outbox fallback → ❌ block
- LLM / Agent 提議的資料直接寫正式表沒有 review queue → ❌ block（除非該資料是 ephemeral 且可隨時重生）

## References

- CR-0001 §3, §7（本 ADR 的觸發 CR）
- ADR-0009 §8 D pattern（outbox 的原始定義）
- ADR-0024 §3 S2 harness pipeline inventory
- ADR-0025 harness branching pipeline
- 藍圖 v2.xlsx sheet 08（風險治理）/ sheet 11（Memory Archival）
- `.claude/rules/change-governance.md`（治理規則）
