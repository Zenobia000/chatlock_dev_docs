---
id: FR-0018
title: 客服接管對話（三層解決機制）
status: active
phase: I
mapped_to:
  - A07    # 真人轉接 (chatbot)
  - M16    # Comms
  - M03    # ProblemCard
superseded_clauses:
  - BR-A07-01    # 7 條件觸發 handoff
  - BR-A07-NN    # 隱含不滿 confidence ≥ 0.85 升級
  - BR-A07-NN    # 非營業時間 → L3 留言
  - BR-A07-NN    # cs path csagent_triggered (CS 一鍵開 WO)
  - BR-A07-NN    # CS pure resolve → PC.resolved → CustAck
  - BR-A07-NN    # LINE Push 失敗 → audit + retry
  - BR-A07-NN    # 客戶撤回投訴 audit 不刪
emits_events:
  - HumanHandoffTriggered
  - CsAgentTookOver
  - WorkOrderCreatedByCs
  - ConversationResolved
  - CustomerAcknowledged
nfr_flavored: false
priority: P0
tier: 2
owner: 客服主管 / AI Specialist
last_reviewed: 2026-05-28
related_adrs:
  - ADR-0048    # AI 轉真人 7 條件
legacy_id: REQ-018
trace_to_flow: F-018
last-synced-with: 4e9658e90324cbceb26f5e5445f481fc5678df1f
related:
  - "../../_source/02-ai-chatbot-sync.md#a-m07-真人轉接"
---

# FR-0018 — 客服接管對話（三層解決機制）

> **Migration**: 2026-05-28 改為 D5 殼結構（rule → BR）。對應 A07 module。

## §1 Use Case Skeleton

| 欄位 | 內容 |
|:-----|:-----|
| **Actor** | AI Agent (detect handoff) / 客服 (take over) / 客戶 |
| **Secondary Actors** | M16 Comms, M03 ProblemCard, FR-0038 ConvertToWO |
| **Trigger** | (1) AI 偵測 7 條件之一觸發 ([ref: BR-A07-01])；(2) 隱含不滿 confidence ≥ 0.85 |
| **Precondition** | Conversation active |
| **Main Flow** | 詳見 §1.1 → user-flow:S1-step-handoff |
| **Alternative Flow** | 詳見 §1.2 |
| **Postcondition** | Conversation owner = CS；emit `CsAgentTookOver` |

### §1.1 Main Flow

1. AI 偵測 handoff 條件 → user-flow:S1-step-handoff
2. emit `HumanHandoffTriggered`
3. 系統 LINE Push 通知 CS（[ref: BR-A07-NN]）
4. CS APP 內 tap "接管"
5. Conversation owner = CS_user_id
6. emit `CsAgentTookOver`
7. CS 判斷分流：
   - **需派工** → CS 一鍵呼叫 ConvertToWO tool（[ref: BR-A07-NN cs_path_csagent_triggered]，不需客戶再確認）→ emit `WorkOrderCreatedByCs`
   - **純客服解決** → CS 對話處理 → 標 PC.resolved → emit `ConversationResolved` + `CustomerAcknowledged`
8. END

### §1.2 Alternative Flow

```
A1. 非營業時間 (第 3 步):
    A1.1 留言給 next-business-day admin ([ref: BR-A07-NN])
    A1.2 客戶端訊息「客服將於 09:00 回覆」

A2. LINE Push 失敗 (第 3 步):
    A2.1 audit 記錄 + retry queue ([ref: BR-A07-NN])
    A2.2 不阻塞流程

A3. 客戶撤回投訴 (任一步):
    A3.1 對話續寫
    A3.2 audit 不刪 ([ref: BR-A07-NN])
    A3.3 status 標 withdrawn_continue

A4. 隱含不滿無關鍵詞 (第 1 步):
    A4.1 confidence ≥ 0.85 → 升級 ([ref: BR-A07-NN])
```

## §2 Acceptance Criteria

### AC-01: 7 條件之一觸發

```gherkin
Given AI 偵測「找主管」關鍵詞
Then emit `HumanHandoffTriggered`
  And CS 收 LINE Push
```

### AC-02: 隱含不滿 confidence

```gherkin
Given 對話情緒 confidence = 0.87 (無關鍵詞)
Then 升級 handoff
```

### AC-03: CS path 開 WO

```gherkin
Given CS 接管 conversation C-001
When CS 一鍵 "開工單"
Then ConvertToWO tool called
  And WorkOrder.create_trigger = "cs_path_csagent_triggered"
  And emit `WorkOrderCreatedByCs`
```

### AC-04: 純客服解決

```gherkin
When CS 對話處理完畢 + 標 PC.resolved
Then emit `ConversationResolved` + `CustomerAcknowledged`
  And **不**開工單
```

### AC-05: 非營業時間

```gherkin
Given 23:00 觸發 handoff
Then 留言給 next-business-day admin
  And 客戶收到「09:00 回覆」訊息
```

### AC-06: LINE Push fail-soft

```gherkin
Given LINE 5xx
When `HumanHandoffTriggered` 後通知
Then audit + retry queue
  And 主流程不卡
```

### AC-07: 客戶撤回 audit 不刪

```gherkin
When 客戶撤回投訴
Then 對話續寫
  And audit 不刪
  And status = withdrawn_continue
```

## §2.5 Example Dialogue (A3.6)

**Scenario 1: 「找主管」keyword 觸發 handoff**

User: 我要找你們主管
AI: 收到，我立刻為您轉接客服主管，請稍候約 5 分鐘。在這段時間如果方便，能否先告訴我您的問題是什麼？這樣我可以先幫您預先整理給主管。
User: 上次派的師傅亂收費
AI: 了解了，已記下您的問題。客服主管會在 5 分鐘內主動聯絡您。
Result: → emit `HumanHandoffTriggered` (reason="keyword_supervisor"), CS LINE Push 通知

A11y variant:
- 「立刻為您轉接」用 aria-live="assertive"
- 預計等候時間 用 `<time>` 標籤
- Keyboard: 「補充問題」輸入框 tab-focusable

**Scenario 2: 客服接管後 → 一鍵開工單 (CS path)**

[CS 接管 conversation C-001]
CS Agent: 您好我是客服小婷，剛剛看過您的對話，我覺得這個情況需要派技師到現場確認。我直接幫您開工單，技師會在 24 小時內主動聯絡。
User: 好謝謝
CS Agent: [tap "一鍵開工單" button]
Result: → ConvertToWO tool called by CS, WorkOrder.create_trigger="cs_path_csagent_triggered", emit `WorkOrderCreatedByCs` (不需客戶再確認)

A11y variant:
- CS 端 "一鍵開工單" button: 顯眼 + aria-label="一鍵建立工單，跳過客戶確認"
- 客戶端 ARIA role="status" 通知「工單已開立 #WO-001」

**Scenario 3: 純客服解決 → PC.resolved**

[CS 接管 conversation C-002]
CS Agent: 您好我是客服小婷。看到您問鎖芯轉不動，這通常是潤滑不足，您可以試試噴一點石墨潤滑劑。
User: 試試看
[10 分鐘後]
User: 真的可以了！謝謝
CS Agent: 太好了！那我幫您結案。
Result: → PC.resolved, emit `ConversationResolved` + `CustomerAcknowledged`，**不**開工單

A11y variant:
- 結案訊息用 ARIA role="status"
- 滿意度評分 button group tab-focusable

**Scenario 4: 非營業時間留言**

User: [23:30] 我要找主管投訴
AI: 我已收到您的訊息。現在是非營業時間，客服主管將於明天 09:00 起主動聯絡您。如急件請撥緊急電話 0800-XXX-XXX。
Result: → 留言給 next-business-day admin, emit `HumanHandoffTriggered` (reason="after_hours_supervisor")

A11y variant:
- 「非營業時間」訊息 ARIA role="alert" 通知
- 緊急電話 `<a href="tel:...">` 可一鍵撥打

**Scenario 5: 隱含不滿 (confidence ≥ 0.85，無關鍵詞)**

User: 嗯......算了
AI: 我感覺您可能對剛才的回答不太滿意。我立刻幫您接客服主管，請稍候 5 分鐘。
User: ......好
Result: → sentiment_confidence = 0.87, emit `HumanHandoffTriggered` (reason="implicit_dissatisfaction")

A11y variant:
- 短回應 "嗯......" 不視為 ignore — AI 主動 follow-up
- 螢幕顯示 "感覺不太滿意" 解釋 + 升級理由

## §3 Reference Map

| 類型 | ID | 用途 |
|:-----|:---|:-----|
| BR | BR-A07-01 | 7 條件 |
| BR | BR-A07-NN | confidence / 非營業 / cs path / retry |
| ADR | ADR-0048 | AI 轉真人 7 條件 |
| Event | HumanHandoffTriggered / CsAgentTookOver / WorkOrderCreatedByCs / ConversationResolved / CustomerAcknowledged | — |

## §4 Change Log

| Date | Change |
|:-----|:-------|
| 2026-05-10 | REQ-018→FR-0018 |
| 2026-05-26 | S1 cascade: CS path 二分流 |
| 2026-05-28 | **D5 殼 rewrite** |
