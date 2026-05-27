---
id: FR-0001
title: LINE 客服報修受理（圖片 + 文字 + 對話）
status: active
phase: I
mapped_to:
  - M01
  - A01
  - M16
superseded_clauses:
  - BR-M01-01    # Channel source 必填
  - BR-M01-02    # 先建 Case 再進報價
  - BR-A01-01    # Debounce 合併規則
emits_events:
  - InquiryReceived
  - ConversationStarted
  - UrgencyDetected
nfr_flavored: false
priority: P0
tier: 2
owner: 客服主管 / AI Specialist
last_reviewed: 2026-05-28
related_adrs:
  - ADR-0004
  - ADR-0034
  - ADR-0048
legacy_id: REQ-001
trace_to_flow: F-001
last-synced-with: 4e9658e90324cbceb26f5e5445f481fc5678df1f
related:
  - "../../0-principles/id-mapping-legacy.md §A.3 (REQ→FR)"
  - "../../0-principles/PRIN-0001-product-principles.md"
  - "../../_source/01-workorder-erp.md#m01-客戶入口"
  - "../../_source/02-ai-chatbot-sync.md#a-m01-進線debounce"
---

# FR-0001 — LINE 客服報修受理（圖片 + 文字 + 對話）

> **B' 殼 (2026-05-28 D5 治理)**：rule clause 已搬 BR-M01-01/02 + BR-A01-01；本檔僅保留 use case skeleton + acceptance G/W/T。

## §1 Use Case Skeleton

| 欄位 | 內容 |
|:-----|:-----|
| **Actor** | 消費者（LINE 用戶） |
| **Secondary Actors** | AI Agent (A03), System, Customer Service (M16 對話介接) |
| **Trigger** | 消費者透過 LINE 傳送文字 / 圖片 / 影音 / 貼圖 |
| **Precondition** | LINE channel 已綁定；客戶有 LINE userId；rule [ref: BR-M01-01] channel source 必填 |
| **Main Flow** | 詳見 §1.1 |
| **Alternative Flow** | 詳見 §1.2 |
| **Postcondition** | Case 已建立 (依 [ref: BR-M01-02])；conversation_id 可追溯；emit `InquiryReceived` event；若偵測急件則 emit `UrgencyDetected` |
| **Out-of-Scope** | Email / 電話入口（屬 M01 但本 FR 不涵蓋）；圖片 OCR 細節（屬 FR-0025 multimodal） |

### §1.1 Main Flow

1. 消費者透過 LINE 傳送訊息至 channel
2. LINE Webhook 接收訊息，系統驗證簽章（[ref: NFR-Avail-005~007](../../architecture/nfr-matrix-smart-lock-saas.md)）
3. A01 Debounce engine 在 [ref: BR-A01-01] 規則下合併連續訊息為 merged turn
4. 系統建立或復用 Conversation（依 conversation_id），emit `ConversationStarted`（首次）
5. AI Agent (A03) 對 merged turn 跑 intent 辨識
6. **急件偵測時機**：Intent 階段（**收到首筆訊息 + Intent 認意圖後立即判定**）就要識別「鎖外 / 內困 / 安全 / 怒客」四類（[ref: BR-M03-NN urgency 4 類 = ADR-0034]）
7. 若急件：emit `UrgencyDetected`，bypass 三層直接 5min 內轉真人（[ref: ADR-0048 ai-human-handoff-rules]）
8. 若非急件：進 FR-0002 ProblemCard triage
9. END：postcondition 達成

### §1.2 Alternative Flow

```
A1. Webhook 簽章驗證失敗 (第 2 步):
    A1.1 回 401，不寫入任何 conversation
    A1.2 END (rejected)

A2. 圖片附件 > 10MB (第 1 步收到時):
    A2.1 系統回 413 + LINE 訊息「圖檔過大」（[ref: BR-M01-NN attachment size limit]）
    A2.2 END (rejected)

A3. 下游 LLM timeout (第 5 步):
    A3.1 系統回覆「客服繁忙，稍候片刻」，不阻塞 webhook (FastAPI BackgroundTask)
    A3.2 LLM 重試 N 次 (依 [ref: BR-A05-NN retry policy])
    A3.3 N 次失敗 → 升 [ref: FR-0018 cs-takeover] 真人轉接

A4. 對話 4 輪後 intent_confidence < 0.7 (cumulative):
    A4.1 升 L3 真人轉接（[ref: BR-A07-01 handoff threshold]）
    A4.2 進 FR-0018 cs-takeover flow
```

## §2 Acceptance Criteria (G/W/T)

### AC-01: Happy path — LINE 文字訊息建立 Case

```gherkin
Given LINE user "Alice" 已綁定 channel
  And channel source "LINE" 屬於 allowed list ([ref: BR-M01-01])
When Alice 透過 LINE 傳送文字 "鎖打不開"
Then 系統 P95 ≤ 5 秒內回覆 AI 初判
  And Conversation 建立 (conversation_id 唯一)
  And Case 建立並關聯 conversation_id ([ref: BR-M01-02])
  And event `InquiryReceived` 已 emit (含 channel="LINE", source="alice_user_id")
```

### AC-02: Webhook 重送冪等

```gherkin
Given Conversation 已存在 (conversation_id="C-001")
When LINE 重送同一個 webhook event (X-Line-Signature 相同)
Then 系統不重複建 Conversation
  And event `InquiryReceived` 不重複 emit
  And response status = 200
```

### AC-03: 圖片附件邊界

```gherkin
Given Alice 已綁定 LINE channel
When Alice 傳送 JPG 圖片 size=10MB
Then 系統接受，附加到 Conversation
  And event `InquiryReceived` 含 has_attachment=true

When Alice 傳送 JPG 圖片 size=10.1MB
Then 系統回 413
  And LINE 訊息回覆「圖檔過大，請壓縮後再傳」
```

### AC-04: 急件偵測 — Intent 階段（不延後到 Triage）

```gherkin
Given Alice 透過 LINE 傳送「我被鎖在門外」(urgency = "locked_out")
When AI Agent 跑 intent 辨識 (Intent 階段)
Then 系統識別為 urgency 4 類之一 ([ref: BR-M03-NN urgency = ADR-0034])
  And event `UrgencyDetected` 已 emit (urgency_type="locked_out")
  And 5 min 內轉真人 (bypass 三層解決)
```

### AC-05: 對話 4 輪 confidence 不足升 L3

```gherkin
Given Conversation 已進行 3 輪對話，cumulative intent_confidence < 0.7
When Alice 傳送第 4 輪訊息，confidence 仍 < 0.7
Then 系統升 L3 真人轉接
  And 進入 FR-0018 cs-takeover flow
  And event `HumanHandoffTriggered` 已 emit
```

## §2.5 Example Dialogue (A3.6)

**Scenario 1: Happy path — 一般報修**

User: 我家門鎖打不開
AI: 您好！請問是電子鎖還是機械鎖？方便傳一張照片給我看看嗎？
User: 是電子鎖
AI: 收到。電子鎖打不開的話，請問鎖芯按下去有反應、還是螢幕沒顯示？這會影響我的初步判斷。
Result: → emit `InquiryReceived`, `ConversationStarted`, problem_card.status="Need Photo"

A11y variant:
- Screen reader 朗讀順序: User msg → AI msg (含「AI 回應:」前綴)
- Keyboard-only: tab order — 輸入框 → 送出 → aria-live=polite 區
- 對話歷史用 `<ol>` 語意化，可用方向鍵讀回

**Scenario 2: 急件偵測 (urgency = locked_out)**

User: 我被鎖在門外面了！！！
AI: 我馬上為您安排！系統偵測到您現在被鎖在門外，這屬於急件。請告訴我地址，我立刻派最近的技師。
User: 大安區忠孝東路 100 號
AI: 收到！正在轉接客服主管，並同步派遣，預計 30 分鐘內到場。客服主管會在 5 分鐘內聯絡您。
Result: → emit `InquiryReceived` + `UrgencyDetected` (urgency_type="locked_out"), bypass 三層 → 5min 轉真人

A11y variant:
- aria-live="assertive" 通知急件接管中
- 螢幕顯眼紅色 banner（同步 ARIA role="alert"）

**Scenario 3: 4 輪 confidence 不足升 L3 真人**

User: 我家那個東西壞了
AI: 請問是哪個東西呢？例如鎖、門禁、保全？
User: 就那個
AI: 為了幫您安排正確的服務，請問可以拍張照片嗎？
User: 不會用
AI: 沒問題，我幫您轉客服專員直接電話協助您，預計 5 分鐘內聯絡。
Result: → emit `HumanHandoffTriggered` (reason="clarification_low_confidence_4_turns"), 進 FR-0018

A11y variant:
- 轉接客服訊息用 `<strong>` 強調
- Screen reader 朗讀「即將轉接客服」+ 預計時間

## §3 Reference Map

> 自動生成自 frontmatter，本段由 `tools/traceability_matrix.py` 反向填。

| 類型 | ID | 用途 |
|:-----|:---|:-----|
| Business Rule | BR-M01-01 | channel source 必填 |
| Business Rule | BR-M01-02 | 先建 Case 再進報價 |
| Business Rule | BR-A01-01 | debounce 合併規則 |
| ADR | ADR-0004 | LINE Bot 架構 |
| ADR | ADR-0034 | urgent red code 4 類定義 |
| ADR | ADR-0048 | AI human handoff rules |
| Domain Event | InquiryReceived | ProblemCard / dispatch downstream |
| Domain Event | ConversationStarted | M16 Comms |
| Domain Event | UrgencyDetected | M03 priority + M15 escalation |
| NFR | NFR-Avail-004~007 | LINE webhook HA / latency |
| Source spec | `docs/_source/01-workorder-erp.md#m01-客戶入口` | M01 原始定義 |
| Source spec | `docs/_source/02-ai-chatbot-sync.md#a-m01-進線debounce` | A01 原始定義 |

## §4 Change Log

| Date | Change | Why |
|:-----|:-------|:----|
| 2026-05-10 | 從 north-star-requirements REQ-001→FR-0001 split | 4-digit FR ID 標準化 |
| 2026-05-22 | 加入 ADR-0033/0034/0036/0059 引用 | §F trade-off 落地 |
| 2026-05-26 | S1 cascade：急件偵測時機移至 Intent 階段 | system spec UC-002 update |
| 2026-05-28 | **B' 殼 rewrite (D5)**：rule clause 搬 BR-M01-01/02 + BR-A01-01；新增 frontmatter `mapped_to`/`superseded_clauses`/`emits_events`；補 §1 use case skeleton + §1.2 alternative flow + 5 條 G/W/T AC | Roundtable 2026-05-27 D5 + 業主全採納 |
