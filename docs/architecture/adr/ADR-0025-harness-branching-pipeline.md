---
id: ADR-0025
title: Harness 採 branching pipeline，PIPELINE list 為 introspection-only
status: accepted
date: 2026-05-11
deciders: [Tech Lead, Architect]
legacy_id: null
supersedes: []
superseded_by: []
related:
  - "./ADR-0024-tier1-refactor-revised.md (§3 S2 — Phase 4' 原方案)"
  - "../../agent/harness/__init__.py (PIPELINE 結構化常數)"
  - "../../agent/harness/orchestrator.py (agent_and_reply branching 主控制流)"
---

> 
> **🔄 Migration Status (2026-05-28)**: `HISTORICAL`
> **Reviewed against**: 2026-05-20 final spec (xlsx)
> **Reviewed on**: 2026-05-28
> **Per ADR-0100 §1 classification** (.claude/context/devteam/meetings/2026-05-27-1130-final-spec-migration-strategy/MoM.md)


# ADR-0025 — Harness 採 branching pipeline，PIPELINE list 為 introspection-only

## Status

**Accepted** (拍板於 2026-05-11)

## 1. 背景與問題

### 上下文

ADR-0024 §3 S2 Phase 4' 原方案：

> **簡化**：在 `agent/harness/__init__.py` 加 `PIPELINE = [layer1, layer2, ...]` 清單常數 + `orchestrator.agent_and_reply()` 改 `for layer in PIPELINE: await layer.apply(ctx)` + 各 sibling module 補 `async def apply(ctx)` 介面（包現有邏輯）。

Phase 4' hands-on 進入 `orchestrator.py` 510 行內容後發現該方案的線性 pipeline 假設**與實際 control flow 不符**。

### 問題

`agent_and_reply()` 是 **branching pipeline**，具備以下三類特性：

| 特性 | 出現次數 | 例 |
|---|---|---|
| Early return（short-circuit）| 4 處 | `safety_gate.check` 命中 → 直接 send block 後 return；`data_correction`、`quick_reply`、`intent_handler` 同 |
| Background fire-and-forget | 3 處 | `profile_updater`、`pc_creator`、`memory_manager` 用 `asyncio.create_task(...)` 不阻塞 reply |
| 非統一 layer signature | ≥ 9 處 | 各 layer 接收的參數組合不同（user_id, reply_token, content, buffer_items, text_for_audit, ai_response, profile_mgr, audit_storage, agent, config, templates, pending_store, ...） |

統一 `apply(ctx)` 介面意味著 `ctx` 物件至少需 12+ 欄位，每個 layer 都需了解 ctx schema → 高 coupling、低 cohesion；且 early return / background 兩種非線性行為需引入 `ctx.should_short_circuit` / `ctx.background_tasks` 等旗標，等於把原本 explicit 的 control flow 改成 implicit state machine — **可讀性反而下降**。

### 驅動因素 / 約束

- **驅動**：仍要解 ADR-0024 S2 訊號 — 「新增 harness layer 需要可預測 onboarding 路徑 + 不必改 orchestrator hardcoded import」
- **約束 1**：不能引入 ctx god-object（破壞 module 邊界）
- **約束 2**：不能引入 dark launch + 多 phase migration（ADR-0024 已拒絕 over-engineering）
- **約束 3**：staging 1 週 reserved for **runtime 行為變更**，純文件/介面變更不需

---

## 2. 考量的選項

### 選項一: 強制 linear PIPELINE + ctx god-object（ADR-0024 §3 S2 原方案）

- **描述**：硬把 branching 包成 linear（`ctx.should_short_circuit` 旗標 + background tasks 集中於 ctx）
- **優點**：onboarding 上「新增 layer 改 PIPELINE list + 寫 apply(ctx)」一條路
- **缺點**：ctx 物件 12+ 欄位、隱式 state machine、原本 explicit short-circuit 變成隱式 flag check；coupling 升高
- **成本/複雜度**：中高（11 個 module adapter + orchestrator 重寫 + ctx schema）+ staging 1 週

### 選項二: PIPELINE list 為 introspection-only（**選定**）

- **描述**：保留 `agent_and_reply()` 原 branching control flow（顯式 early return + 顯式 background）；只在 `harness/__init__.py` 加 `PIPELINE: tuple[PipelineEntry, ...]` 結構化常數 + 各 layer module 加 `PHASE: str = "H6" / "H_DC" / ...` 常數，作為 doc 與 observability
- **優點**：零 runtime 變更（不需 staging 1 週）；保留 explicit control flow 可讀性；新增 layer 仍需改 orchestrator 但 PIPELINE list 提供「該加在哪裡 + 哪個 lifecycle bucket + 是否 blocking」的清晰指引
- **缺點**：沒解決「新增 layer 不需改 orchestrator」訴求 — 但這個訴求基於對 branching pipeline 的誤判，原本就不該成立
- **成本/複雜度**：低（1-2 小時）

### 選項三: 延後 Phase 4' 進 backlog

- **描述**：放棄本季任何 harness 重構
- **優點**：零風險
- **缺點**：無法為「新增 layer 路徑可預測」訴求做任何貢獻

---

## 3. 決策

**選擇**：選項二

**理由**：

1. **承認 hands-on 發現** — `agent_and_reply()` 本質是 branching pipeline；強推 linear 抽象是基於對 control flow 的誤判
2. **保留 explicit control flow** — Linus 「good taste」精神：當 explicit 比 implicit 更清楚時，不該為了形式統一犧牲可讀性
3. **doc/introspection 已解 80% 訴求** — 新增 layer 時，PIPELINE list + PHASE 常數讓 contributor 一眼看到「現有 12 個 stage、各自 lifecycle bucket、blocking vs background」
4. **零 runtime 變更** — 不消耗 staging 1 週 budget；剩餘風險 budget 留給未來真正需要的重構

---

## 4. 後果

### 正面

- 任何閱讀 `harness/__init__.py` 的人立即看到 12 個 stage inventory
- `python -c "import harness; for entry in harness.PIPELINE: print(entry)"` 可機讀 introspection
- 各 layer module 的 `PHASE` 常數可用於 logging / metrics / audit log tagging（如「這條 audit log 來自 phase=H6 layer」）
- ADR-0024 §3 S2 原訴求（「新增層不需改 orchestrator hardcoded import」）被重新評估為**不成立**：branching control flow 本質就需要 explicit wiring，不該假裝 linear

### 負面

- 新增 layer 時仍需手動：(a) 加 module + PHASE 常數 (b) 改 orchestrator.agent_and_reply() (c) 補 PIPELINE entry
- PIPELINE list 是手動維護，可能與 orchestrator 實際順序 drift；緩解：補 lint check（future PR）對照 orchestrator import 與 PIPELINE entry

### 影響範圍

| 模組 | 變更 |
|---|---|
| `agent/harness/__init__.py` | 由空檔變為 docstring + PIPELINE 常數 + PipelineEntry NamedTuple |
| `agent/harness/{safety_gate,data_correction,quick_reply,intent_handler,pc_creator,profile_updater,validator_pipeline,memory_manager,agent_audit}.py` | 各加 `PHASE: str = "..."` 模組層級常數 |
| `agent/harness/orchestrator.py` | **不變更**（保留既有 branching control flow）|

### 重新評估觸發

| 條件 | 動作 |
|---|---|
| harness layer 數量增至 20+ | 重新評估是否值得抽 phase enum + linter |
| 新增 layer 需要橫切多 phase（如 cross-stage tracing） | 評估是否需要 ctx object |
| Phase 4' 真實需求浮現（如 dynamic 開關 layer） | 重新評估 config-driven pipeline |

---

## 5. 不在範圍

- ❌ orchestrator.agent_and_reply() 主控制流變更
- ❌ ctx god-object 設計
- ❌ apply(ctx) 統一介面
- ❌ Linter 自動對照 PIPELINE 與 orchestrator imports（留 future PR；目前手動同步即可）

---

## 6. 實作驗證

```python
# uv run python (在 agent/ 內)
>>> import harness
>>> len(harness.PIPELINE)
12
>>> harness.PIPELINE[0]
PipelineEntry(phase_id='H8_IN', module='agent_audit', description='Inbound message audit log', lifecycle='pre_agent', blocking=True)
>>> from harness import safety_gate
>>> safety_gate.PHASE
'H6'
```

---

| 日期 | 審核人 | 備註 |
| :--- | :--- | :--- |
| 2026-05-11 | Tech Lead / Architect | 初版 — Phase 4' hands-on 修正：linear → branching introspection-only |
