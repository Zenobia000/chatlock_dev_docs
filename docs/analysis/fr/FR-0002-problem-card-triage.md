---
id: FR-0002
title: ProblemCard 智能分診
status: active
phase: I
mapped_to:
  - M03
  - A06
  - A03
superseded_clauses:
  - BR-M03-01    # ProblemCard completeness gate (Ready for Quote / Need Info / Need Photo / Need Human / Closed Remote)
  - BR-M03-02    # AI escalation (urgent / angry / 高金額 / 保固不明 / refund / safety / 3 次失敗 → 轉真人)
  - BR-M03-NN    # urgent 4 類具名 (= ADR-0034)
  - BR-M03-NN    # 同對話多 PC unique constraint (= ADR-0036)
  - BR-A06-01    # ProblemCard draft → confirmed 流程
emits_events:
  - ProblemCardDrafted
  - ProblemCardConfirmed
  - AiResponded
  - HumanHandoffTriggered
nfr_flavored: false
priority: P0
tier: 2
owner: 客服主管 / AI SOP owner
last_reviewed: 2026-05-28
related_adrs:
  - ADR-0031
  - ADR-0033
  - ADR-0034
  - ADR-0036
  - ADR-0037
  - ADR-0048
  - ADR-0054
  - ADR-0059
legacy_id: REQ-002
trace_to_flow: F-001 / F-002
last-synced-with: 4e9658e90324cbceb26f5e5445f481fc5678df1f
related:
  - "../../0-principles/id-mapping-legacy.md §A.3 (REQ→FR)"
  - "../../_source/01-workorder-erp.md#m03-ai-problemcard"
  - "../../_source/02-ai-chatbot-sync.md#a-m06-problemcard"
---

# FR-0002 — ProblemCard 智能分診

> **B' 殼 (2026-05-28 D5)**：rule clause 搬 BR-M03-NN + BR-A06-01；本檔僅保留 use case skeleton + acceptance G/W/T。

## §1 Use Case Skeleton

| 欄位 | 內容 |
|:-----|:-----|
| **Actor** | AI Agent (A03), Customer Service (作為 confirm 角色) |
| **Secondary Actors** | 消費者（被詢問澄清時）, ProblemCard Bridge (A06), Knowledge / RAG (A04) |
| **Trigger** | FR-0001 進入 Triage 階段（非急件路徑）OR IoT event 觸發（[ref: ADR-0059]） |
| **Precondition** | Conversation 已存在；intent 已辨識；非急件（急件走 FR-0018 直轉真人） |
| **Main Flow** | 詳見 §1.1 |
| **Alternative Flow** | 詳見 §1.2 |
| **Postcondition** | ProblemCard 已建立 (draft 或 confirmed)；emit `ProblemCardDrafted`；若客戶澄清 emit `ProblemCardConfirmed`；若 escalation emit `HumanHandoffTriggered` |
| **Out-of-Scope** | ProblemCard 轉 WorkOrder（屬 S-M04 / FR-0038）；報價（屬 FR-0042） |

### §1.1 Main Flow

1. AI Agent 接到 merged turn（來自 FR-0001 第 5 步）
2. AI Agent 跑 RAG 取相關 SKILL.md / SOP / FAQ（[ref: ADR-0057]）
3. AI Agent 草擬 ProblemCard，計算 `completeness_score`
4. [ref: BR-M03-01]：依 completeness_score 設定 status 為 `Ready for Quote` / `Need Info` / `Need Photo` / `Need Human` / `Closed Remote` 之一
5. emit `ProblemCardDrafted` event
6. 若 status = Need Info / Need Photo：AI Agent 主動詢問客戶補資料（**Clarify gate** [ref: BR-M03-NN]）
7. 客戶回覆 → 重跑 §1 第 3-5 步
8. **Clarify gate trigger resolved**：AI 主動詢問「問題釐清了嗎？」客戶答「已釐清」→ status → `resolved`
9. 若 status = Ready for Quote：交給 A06 ProblemCard Bridge 進 §FR-0031（chatbot 對 ERP 介接）
10. END：postcondition 達成

### §1.2 Alternative Flow

```
A1. completeness_score < 0.85 + 多次澄清仍補不齊 (第 6-7 步):
    A1.1 status → `Need Human` ([ref: BR-M03-01 completeness gate = ADR-0033])
    A1.2 emit `HumanHandoffTriggered`
    A1.3 進 FR-0018 cs-takeover

A2. AI escalation 觸發條件命中 (任一步):
    A2.1 觸發條件：urgent / 怒客 / 高金額 / 保固不明 / refund / safety/legal / 3 次失敗循環 ([ref: BR-M03-02 = ADR-0048])
    A2.2 status → `Need Human`
    A2.3 emit `HumanHandoffTriggered`
    A2.4 進 FR-0018

A3. 同 conversation 多 PC (第 3 步草擬時):
    A3.1 unique constraint `(conversation_id, device_id, active_status)` ([ref: BR-M03-NN = ADR-0036])
    A3.2 AI 偵測新症狀必須先問客戶確認
    A3.3 客戶確認 → 另開 ProblemCard
    A3.4 客戶說同問題 → 復用既有 PC

A4. IoT event 預填 PC (alternative trigger):
    A4.1 IoT event (tamper / error_code / battery) 觸發 ([ref: ADR-0059])
    A4.2 系統預填 PC fields
    A4.3 必須客戶確認後才轉 PC (HITL 邊界)

A5. AI 提到金額 / 報價 (任一步):
    A5.1 [ref: P0-20 AI 不可決策清單]：AI 只能給 range，不可 final price ([ref: ADR-0054])
    A5.2 final price 必須走 FR-0042 + 人工確認

A6. 連續 3 次未釐清 (cumulative):
    A6.1 `clarification_attempts` ≥ 3
    A6.2 升真人 (FR-0018)
```

## §2 Acceptance Criteria (G/W/T)

### AC-01: Happy path — Ready for Quote

```gherkin
Given Conversation "C-001" 有完整資訊 (brand / model / symptom / address)
When AI Agent 跑 triage
Then ProblemCard 建立 completeness_score ≥ 0.85
  And status = "Ready for Quote" ([ref: BR-M03-01])
  And event `ProblemCardDrafted` emit
  And A06 ProblemCard Bridge 收到並進 FR-0031
```

### AC-02: completeness < 0.85 不自動派工

```gherkin
Given Conversation "C-002" 缺 model 與 address
When AI Agent 跑 triage
Then ProblemCard 建立 completeness_score < 0.85
  And status = "Need Info" ([ref: BR-M03-01 = ADR-0033])
  And **不**自動派工
  And AI 主動詢問客戶補資料
```

### AC-03: Clarify gate 觸發 resolved

```gherkin
Given ProblemCard "PC-001" status = "ai_responded"
When AI 主動詢問「問題釐清了嗎？」
  And 客戶答「已釐清」
Then status → "resolved"
  And `clarification_confirmed_at` 填值
  And event `ProblemCardConfirmed` emit
```

### AC-04: AI escalation — 怒客觸發

```gherkin
Given Conversation 偵測客戶情緒 = "angry" (≥ threshold)
When AI Agent 跑 triage
Then status = "Need Human" ([ref: BR-M03-02 = ADR-0048])
  And event `HumanHandoffTriggered` emit (reason="angry_customer")
  And 進 FR-0018 cs-takeover
```

### AC-05: 同對話多 PC unique constraint

```gherkin
Given Conversation "C-001" 已有 active ProblemCard PC-001 (device_id="D-1")
When AI 偵測同設備新症狀
  And 客戶確認「跟原問題不同」
Then 系統允許建 PC-002 (conversation_id="C-001", device_id="D-1", active=true) — 但 PC-001 必須先 close ([ref: BR-M03-NN = ADR-0036])

Given 同上
When AI 偵測同設備新症狀
  And 客戶說「同一個問題」
Then 系統復用 PC-001，不建新 PC
```

### AC-06: IoT event 預填需 HITL

```gherkin
Given 電子鎖 "DEV-001" 觸發 tamper event
When 系統收到 IoT event
Then 系統預填 ProblemCard (urgency="safety_risk", source="iot")
  And status = "Need Info" (等客戶確認)
  And **不**直接轉 confirmed
  And 系統主動 LINE 推播給設備擁有者：「偵測到 tamper，是否要報修？」
```

### AC-07: AI 報價邊界

```gherkin
Given ProblemCard "PC-001" status = "Ready for Quote"
When AI Agent 給客戶報價
Then AI 只給 price range（如 NT$1500~3000）([ref: ADR-0054])
  And **不**給 final price
  And final price 必須走 FR-0042 + 人工確認
```

### AC-08: 3 次澄清失敗升真人

```gherkin
Given ProblemCard "PC-001" `clarification_attempts` = 2
When AI 第 3 次嘗試澄清仍失敗
Then status → "Need Human"
  And event `HumanHandoffTriggered` emit (reason="clarification_max_attempts")
```

## §2.5 Example Dialogue (A3.6)

**Scenario 1: Happy path — Ready for Quote**

User: 我家三星電子鎖打不開
AI: 您好！請問型號是 SHS-P718 還是 SHS-H700 呢？
User: SHS-P718
AI: 收到。請問是電池燈亮但按了沒反應、還是完全沒反應？
User: 電池燈亮，按了沒反應
AI: 了解，這通常是鎖芯卡住或主控板問題。地址在哪裡？我幫您安排技師估價。
User: 大安區忠孝東路 100 號
Result: → ProblemCard.completeness_score = 0.92, status = "Ready for Quote", emit `ProblemCardDrafted`

A11y variant:
- Screen reader 朗讀順序: User → AI (前綴「AI 回應:」)
- ProblemCard summary 以 `<section aria-label="問題卡">` 包裝，可跳讀
- Keyboard: 確認按鈕 tab-focusable

**Scenario 2: Clarify gate resolved**

AI: 我看到您問題是鎖芯卡住，已預約技師明天 14:00 到場。請問問題已釐清了嗎？
User: 已經清楚了
AI: 太好了！我會幫您結案。如還有問題隨時再來訊。
Result: → ProblemCard.status = "resolved", emit `ProblemCardConfirmed`

A11y variant:
- "已釐清了嗎？" 問句後置 Yes/No 按鈕（不只純文字）
- ARIA role="status" 通知結案

**Scenario 3: AI escalation — 怒客觸發 handoff (A07)**

User: 我已經跟你們講過三次了！為什麼還沒有人來！
AI: 我看到您非常著急，我立刻幫您接客服主管直接處理。請稍等 5 分鐘內會聯絡您。
Result: → sentiment="angry" (conf=0.92), status="Need Human", emit `HumanHandoffTriggered` (reason="angry_customer")

A11y variant:
- aria-live="assertive" 通知接管中
- 紅色 alert banner
- 不再要求客戶回答 → reduce cognitive load

**Scenario 4: IoT event 預填 HITL**

[System: tamper event from device DEV-001]
AI: 您好！我偵測到您家智慧鎖剛剛有開啟異常（疑似撬鎖警示）。請問是您自己操作的，還是需要派員檢查？
User: 不是我，請派人來
Result: → ProblemCard.urgency="safety_risk", source="iot", status="Need Info"→"Need Human" 經客戶確認後 emit `ProblemCardConfirmed`

A11y variant:
- 推播訊息 ARIA role="alert"
- 必須客戶 explicit 確認（避免 IoT 假警自動派工）

**Scenario 5: AI 報價邊界（ADR-0054）**

User: 換鎖大概多少錢？
AI: 一般電子鎖更換的價位區間落在 NT$3,000 ~ NT$8,000，實際金額需技師現場勘查後報價。是否幫您安排技師？
User: 好
Result: → AI 只給 range，final price 走 FR-0042 + 人工

A11y variant:
- 價格區間以 `<dl>` 結構化
- "實際金額需技師現場勘查" 用 `<small>` 標註（screen reader 仍朗讀）

## §3 Reference Map

| 類型 | ID | 用途 |
|:-----|:---|:-----|
| Business Rule | BR-M03-01 | completeness gate 5 status |
| Business Rule | BR-M03-02 | AI escalation conditions |
| Business Rule | BR-M03-NN | urgency 4 類 / 多 PC unique constraint / Clarify gate |
| Business Rule | BR-A06-01 | ProblemCard draft → confirmed |
| ADR | ADR-0031 | AI 草擬 + 人審 |
| ADR | ADR-0033 | completeness gate |
| ADR | ADR-0034 | urgent 4 類具名 |
| ADR | ADR-0036 | 同對話多 PC unique constraint |
| ADR | ADR-0037 | conversation auto-close |
| ADR | ADR-0048 | AI human handoff rules |
| ADR | ADR-0054 | AI quote range only |
| ADR | ADR-0059 | IoT event 預填 HITL 邊界 |
| Domain Event | ProblemCardDrafted | A06 / S-M03 |
| Domain Event | ProblemCardConfirmed | A06 / S-M03 |
| Domain Event | AiResponded | M19 BI |
| Domain Event | HumanHandoffTriggered | FR-0018 / M16 |
| Source spec | `docs/_source/01-workorder-erp.md#m03-ai-problemcard` | M03 原始定義 |

## §4 Change Log

| Date | Change | Why |
|:-----|:-------|:----|
| 2026-05-10 | REQ-002→FR-0002 split | — |
| 2026-05-22 | ADR-0033/0034/0036/0059 引用 | §F trade-off 落地 |
| 2026-05-26 | S1 cascade：(a) 急件偵測移 Intent；(b) Clarify gate 取代「有幫助」；(c) 新增 ai_responded 中介狀態 + clarification 欄位 | system spec §2.2 state machine v2 |
| 2026-05-28 | **B' 殼 rewrite (D5)**：rule clause 搬 BR-M03-NN + BR-A06-01；新增 frontmatter；補 §1 skeleton + 6 條 alternative flow + 8 條 G/W/T AC | Roundtable 2026-05-27 D5 |
