---
id: FR-0028
title: Chatbot Skill-Gated ReAct Agent
status: active
phase: I
mapped_to:
  - A03    # Skill-Gated ReAct Agent (primary)
  - M20    # AI Operations & Knowledge Governance
  - M17    # Authorization (skill / tool permission)
superseded_clauses:
  - BR-A03-01    # Skill list 必須通過 governance 才能呼叫
  - BR-A03-02    # Tool registry: allowed_tools, forbidden_tools, audit_required
  - BR-A03-03    # ReAct loop 上限 N 輪（預設 5）
  - BR-A03-04    # Reasoning trace 必寫入 audit
  - BR-A03-05    # 任何 skill 失敗 fail-soft + escalate
emits_events:
  - SkillInvoked
  - SkillResultReceived
  - SkillForbidden
  - ReActLoopExceeded
  - ReasoningTraceLogged
nfr_flavored: false
priority: P0
tier: 1
owner: AI Specialist / AI QA lead
last_reviewed: 2026-05-28
related_adrs:
  - ADR-0006   # llm-model-selection
  - ADR-0007   # llm-registry-pattern
  - ADR-0010   # belief-augmented-react
  - ADR-0027   # model-routing-policy
  - ADR-0055   # skill-llm-decoupling-contract
  - ADR-0063   # ai-utterance-boundary
related:
  - "../../_source/02-ai-chatbot-sync.md#a-m03-react-agent"
  - "../../_source/02-ai-chatbot-sync.md#12-tool-registry"
  - "../../_source/02-ai-chatbot-sync.md#11-model-routing"
created_in: "Phase I MVP — Roundtable A 2026-05-27 fr-mapping §2 A03 系列"
---

# FR-0028 — Chatbot Skill-Gated ReAct Agent

> **Phase I 新增 FR (2026-05-28)**，對應 A03 — chatbot 核心 reasoning engine。
> 含 §2.1 Example Dialogue + a11y variant。

## §1 Use Case Skeleton

| 欄位 | 內容 |
|:-----|:-----|
| **Actor** | AI Agent (system) |
| **Secondary Actors** | A04 RAG (knowledge), A05 Guardrails (output validator), A02 Resolver (facts), Tool Registry, LLM Gateway |
| **Trigger** | A01 emit `MergedTurnReady` (per FR-0026)；A03 接收作 reasoning input |
| **Precondition** | LLM 可用；tool registry 已 freeze；skill list 已 governance approved（[ref: ADR-0055 + ADR-0028]） |
| **Main Flow** | 詳見 §1.1 |
| **Alternative Flow** | 詳見 §1.2 |
| **Postcondition** | AI response 已生成（含或不含 tool call）；reasoning trace 寫入 audit；emit `SkillInvoked` per call + `ReasoningTraceLogged` |
| **Out-of-Scope** | RAG retrieval 細節（屬 A04 / FR-0029）；output validation（屬 A05 / FR-0030）；handoff（屬 A07 / FR-0032） |

### §1.1 Main Flow

1. A03 接收 merged turn
2. A03 build reasoning prompt（含 conversation context, user_facts, intent hint）
3. A03 進 ReAct loop（iteration n）：
   - 3.1 Reasoning step：LLM 生成 thought + 是否需 tool call
   - 3.2 Action step：若需 tool call → 走 §1.1.4
   - 3.3 若無 tool call → 直接 output response
4. Tool call decision：
   - check tool 在 [ref: BR-A03-02 allowed_tools]
   - check user permission ([ref: ADR-0042 RBAC] for tool's data scope)
   - 通過 → emit `SkillInvoked`，呼叫 tool
   - 不通過 → emit `SkillForbidden`，AI 改回 default fallback message
5. Observation step：tool 回傳結果或 error
6. emit `SkillResultReceived`
7. 回 §1.1.3 reasoning (n+1)
8. ReAct loop 上限 N 輪（[ref: BR-A03-03] 預設 5）→ 超出走 §1.2 A1
9. Final answer 生成，送 A05 guardrails (FR-0030) 驗證
10. reasoning trace 寫入 audit ([ref: BR-A03-04])
11. emit `ReasoningTraceLogged`
12. END

### §1.2 Alternative Flow

```
A1. ReAct loop 超 N 輪 (第 8 步):
    A1.1 emit `ReActLoopExceeded`
    A1.2 AI fallback「我需要更多資訊才能幫您」
    A1.3 升 FR-0032 human handoff
    A1.4 audit 標 "REACT_LOOP_TIMEOUT"

A2. Tool call 失敗 (5xx / timeout) (第 5 步):
    A2.1 [ref: BR-A03-05 fail-soft]
    A2.2 ReAct loop 繼續（嘗試其他 tool 或不用 tool）
    A2.3 若該 tool 為 critical (e.g. RAG) → 降級 mode
    A2.4 emit guardrail event

A3. AI 嘗試 forbidden tool (第 4 步):
    A3.1 [ref: BR-A03-02 forbidden_tools]
    A3.2 系統拒絕 + emit `SkillForbidden`
    A3.3 AI 改用 allowed fallback
    A3.4 audit 標 "FORBIDDEN_TOOL_ATTEMPT" + 升 alert

A4. LLM Gateway 5xx (第 3 步):
    A4.1 [ref: ADR-0027 model-routing]
    A4.2 fallback 到 secondary model
    A4.3 仍失敗 → AI 回「服務繁忙」+ 進 handoff

A5. Tool 跨 tenant 嘗試 (第 4 步):
    A5.1 [ref: ADR-0030] tool call 必須 carry tenant_id
    A5.2 跨 tenant → 403
    A5.3 emit `SkillForbidden` reason="cross_tenant"

A6. Reasoning trace 過大 (第 10 步):
    A6.1 > 100KB → 壓縮 + 加密
    A6.2 完整 trace 保留 ≥ 90d（per audit policy）

A7. ReAct 中途 user interrupt (新訊息進來):
    A7.1 [ref: BR-A03-NN]：A03 取消當前 loop
    A7.2 reasoning trace 標 "USER_INTERRUPT"
    A7.3 重新 build prompt with 新訊息
```

## §2 Acceptance Criteria (G/W/T)

### AC-01: Happy path — 1 輪 ReAct 出 answer

```gherkin
Given merged turn = "鎖打不開"
When A03 跑 ReAct
Then iteration 1: reasoning 認定需 RAG tool
  And emit `SkillInvoked` (tool="rag_search")
  And tool 回傳 SOP chunk
  And emit `SkillResultReceived`
  And iteration 2: AI 生成 final answer
  And emit `ReasoningTraceLogged`
```

### AC-02: ReAct loop 上限攔截

```gherkin
Given AI 連續 5 輪 reasoning 仍未產 final answer
When iteration 6 嘗試開始
Then emit `ReActLoopExceeded`
  And AI fallback message
  And 升 FR-0032 handoff
```

### AC-03: Forbidden tool 攔截

```gherkin
Given tool "external_db_write" in forbidden_tools
When AI reasoning 嘗試呼叫 "external_db_write"
Then 系統拒絕
  And emit `SkillForbidden`
  And audit "FORBIDDEN_TOOL_ATTEMPT"
  And alert AI QA lead
```

### AC-04: Tool fail-soft

```gherkin
Given RAG tool 暫時 5xx
When AI call "rag_search"
Then emit error + 不 abort
  And AI 嘗試 reasoning without RAG (degraded mode)
  And final answer 加 "資料不齊全" disclaimer
```

### AC-05: Cross-tenant 攔截

```gherkin
Given user 屬 tenant T-001
When AI tool call query tenant T-002 data
Then 系統 403
  And emit `SkillForbidden` reason="cross_tenant"
  And audit
```

### AC-06: LLM gateway fallback

```gherkin
Given primary LLM (GPT-5) 5xx
When A03 reasoning
Then 依 [ref: ADR-0027] fallback to secondary (Claude-4)
  And reasoning 繼續
  And audit 標 model_used="secondary"
```

### AC-07: User interrupt 中途新訊息

```gherkin
Given A03 在 iteration 3 reasoning 中
When 新 merged turn 進來
Then A03 cancel 當前 loop
  And reasoning trace 標 "USER_INTERRUPT"
  And 重新 build prompt with 新訊息
```

### AC-08: Reasoning trace audit 完整性

```gherkin
Given AI 完成 5 輪 ReAct
When 查詢 audit log
Then 含完整 reasoning trace (含 5 個 thought + 5 個 action + 5 個 observation)
  And 含 model_used / tokens_used / cost
  And retention ≥ 90d
```

## §2.1 Example Dialogue (chatbot FR 強制)

### Dialogue 1 — Happy path 1 輪 ReAct (AC-01)

```
User: 三星 SHS-P718 鎖打不開
[A03 iteration 1: reasoning="需查 SHS-P718 troubleshooting SOP", action="rag_search('SHS-P718 打不開')"]
[Emit: SkillInvoked (tool="rag_search")]
[Tool: returns SOP "SHS-P718 打不開 SOP: 1. 檢查電池 2. 重置..."]
[Emit: SkillResultReceived]
[A03 iteration 2: reasoning="有 SOP，產 user-friendly answer"]
Bot: 三星 SHS-P718 打不開通常有兩種狀況：
1. 電池電量不足 — 請看看鎖正面螢幕有沒有閃紅燈？
2. 鎖芯卡住 — 試試輕輕用鑰匙轉一下

請問是哪一種狀況？
[Emit: ReasoningTraceLogged]
```

**a11y variant**：
- 多選項用 `<ol>` 編號（不只 emoji）
- Screen reader 朗讀「步驟 1 / 共 2」便於導覽
- 後續問題用 chip-button 提供（「電池不足」「鎖芯卡住」「其他」）

### Dialogue 2 — Forbidden tool 攔截 (AC-03)

```
User: 幫我看看其他客戶的工單，我想參考
[A03 reasoning: "user 想看其他客戶資料 — 試 tool 'admin_query_all_wo'"]
[Tool registry: admin_query_all_wo is forbidden for consumer role]
[Emit: SkillForbidden (tool="admin_query_all_wo", reason="role_not_allowed")]
Bot: 抱歉，依資料保護規定，我無法為您查詢其他客戶的工單。如您想參考一般處理流程，我可以為您介紹我們的服務內容。
```

**a11y variant**：
- 「依資料保護規定」應 link 到隱私政策（screen reader 識別 `<a>`）
- 替代提議用 chip button（「介紹服務內容」「查我的工單」）

### Dialogue 3 — ReAct loop 超限 fallback (AC-02)

```
User: 我家鎖 ... 啊 ... 就 ... 那個 ... 你懂吧
[A03 iter 1: reasoning="客戶描述不清，需澄清"]
Bot: 不好意思，可以再具體描述一下嗎？例如「鎖打不開」、「按了沒反應」？
User: 對對對 那個樣子
[A03 iter 2: reasoning="仍不清楚，再問"]
Bot: 是按了鎖芯沒反應，還是螢幕完全沒亮？
User: 沒亮喔
[A03 iter 3-5: 持續嘗試確認其他細節]
Bot: ...（每輪都嘗試 narrow down，但 confidence 持續 < threshold）
[A03 iter 6 about to start]
[Emit: ReActLoopExceeded]
Bot: 為了幫您更精準地處理，我幫您接客服專員直接協助，請稍等 5 分鐘。
[Emit: HumanHandoffTriggered (reason="react_loop_timeout")]
```

**a11y variant**：
- 連續澄清過程應 ARIA role="status"（避免 screen reader 每次大聲朗讀）
- handoff 訊息升級為 role="alert"

### Dialogue 4 — Tool fail-soft degraded mode (AC-04)

```
User: Yale YDM4109 怎麼重置？
[A03 iter 1: tool="rag_search('YDM4109 reset')"]
[Tool fail: RAG service 5xx]
[A03 fail-soft: 不 abort, 改用 base LLM knowledge]
[A03 iter 2: reasoning="無 RAG, 用 base LLM 但加 disclaimer"]
Bot: Yale YDM4109 一般重置步驟（請注意：以下為通用資訊，建議以說明書為準）：
1. 取下電池蓋
2. 按住 reset 鈕 5 秒
3. 重新裝電池

如需精確操作，建議查說明書或讓我為您安排技師。
```

**a11y variant**：
- 「請注意」disclaimer 用 `<aside>` + `aria-label="重要提示"`
- 步驟列表後置「需要更多幫助？」chip-button

### Dialogue 5 — User interrupt 中途新訊息 (AC-07)

```
User: 我的 Samsung SHS-H700 鎖打不開
[A03 iter 1: tool="rag_search('SHS-H700')"]
[Tool: running... 等待 1.5s]
User: 啊不好意思！我講錯型號了，是 SHS-P718
[A01 emit new MergedTurnReady]
[A03 detect interrupt: cancel iter 1 mid-flight]
[Reasoning trace 標 "USER_INTERRUPT"]
[A03 重新 build prompt 含修正型號]
[A03 iter 1 (new): tool="rag_search('SHS-P718')"]
Bot: 沒問題！您指的是三星 SHS-P718 對嗎？讓我重新為您查詢...
（後續同 Dialogue 1）
```

**a11y variant**：
- "interrupt 偵測" UI 顯示「✓ 已更新查詢」(role="status")
- typing indicator 中斷時應有 audio cue（不只視覺）

## §3 Reference Map

| 類型 | ID | 用途 |
|:-----|:---|:-----|
| Business Rule | BR-A03-01~05 | governance / tool registry / loop limit / trace / fail-soft |
| ADR | ADR-0006 / 0007 / 0027 | LLM model / routing |
| ADR | ADR-0010 | belief-augmented-react |
| ADR | ADR-0055 | skill-LLM decoupling |
| ADR | ADR-0063 | ai-utterance-boundary |
| Domain Event | SkillInvoked / Result / Forbidden | tool registry audit |
| Domain Event | ReActLoopExceeded | handoff trigger |
| Domain Event | ReasoningTraceLogged | M19 BI / audit |
| Source spec | `docs/_source/02-ai-chatbot-sync.md#a-m03-react-agent` | A03 原始定義 |
| Source spec | `docs/_source/02-ai-chatbot-sync.md#12-tool-registry` | tool registry |
| Source spec | `docs/_source/02-ai-chatbot-sync.md#11-model-routing` | model routing |

## §4 Change Log

| Date | Change | Why |
|:-----|:-------|:----|
| 2026-05-28 | **新建** Phase I MVP (A03 系列 — chatbot 核心) | Roundtable A D5 + Roundtable B D2 dialogue 強制 |
