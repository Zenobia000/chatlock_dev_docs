---
id: FR-0026
title: Chatbot 進線 Debounce 與訊息合併
status: active
phase: I
mapped_to:
  - A01    # primary (chatbot)
  - M01    # ERP 對應（intake）
  - M16    # comms 對話紀錄
superseded_clauses:
  - BR-A01-01    # debounce 合併視窗
  - BR-A01-02    # reply token 限制
  - BR-A01-03    # 訊息順序保留
  - BR-A01-04    # media 轉 ref
emits_events:
  - MergedTurnReady
  - ConversationStarted
nfr_flavored: false
priority: P0
tier: 1
owner: AI Specialist / LINE backend
last_reviewed: 2026-05-28
related_adrs:
  - ADR-0004    # line-bot-architecture
  - ADR-0029    # fail-soft-to-durable-three-pack
related:
  - "../../_source/02-ai-chatbot-sync.md#a-m01-進線debounce"
  - "../../_source/02-ai-chatbot-sync.md#02-chatbot模組a01-a12"
created_in: "Phase I MVP 新增 — Roundtable 2026-05-27 fr-mapping §2 A01 系列首條"
---

# FR-0026 — Chatbot 進線 Debounce 與訊息合併

> **Phase I 新增 FR (2026-05-28)**，對應 chatbot 模組 A01 (Channel Intake & Debounce)，補新規格獨有但既有 FR 列表沒有的功能。
> 套 `templates/fr-skeleton.md` B' 殼。

## §1 Use Case Skeleton

| 欄位 | 內容 |
|:-----|:-----|
| **Actor** | 消費者（LINE 用戶）— 連續 / 突發傳送多則訊息 |
| **Secondary Actors** | LINE Webhook, A01 Debounce Engine, A03 ReAct Agent (下游 consumer) |
| **Trigger** | 消費者在短時間內傳送 ≥ 2 則訊息（文字 / 圖片 / 影音 / 貼圖混合） |
| **Precondition** | LINE channel 已綁定；conversation 已存在或可建立；webhook 簽章 valid |
| **Main Flow** | 詳見 §1.1 |
| **Alternative Flow** | 詳見 §1.2 |
| **Postcondition** | Merged turn 形成（合併視窗內 N 則訊息變成 1 個 turn）；emit `MergedTurnReady`；訊息順序保留；reply token 取得（單一） |
| **Out-of-Scope** | 訊息內容語意理解（屬 A03 / FR-0002）；圖片 OCR（屬 FR-0025） |

### §1.1 Main Flow

1. LINE Webhook 收到第 1 則訊息，timestamp = T0
2. 系統建立 / 復用 Conversation，啟動 debounce window（[ref: BR-A01-01]，預設 2 秒）
3. T0 ~ T0+2s 內收到後續訊息，全部 buffer 累積
4. T0+2s 後若無新訊息，flush buffer 為 merged turn
5. merged turn 內訊息依 timestamp 排序保留（[ref: BR-A01-03]）
6. media 訊息轉成 reference（[ref: BR-A01-04]，避免在 chat history 內塞二進位），實體 media 寫入 M09 evidence store
7. 從 merged turn 內任一訊息取得 reply token（[ref: BR-A01-02]，single reply token policy）
8. emit `MergedTurnReady` event（含 conversation_id + merged_turn_id + media_refs）
9. A03 ReAct Agent 收到 event，進 FR-0001 §1.1 第 5 步 intent 辨識
10. END：postcondition 達成

### §1.2 Alternative Flow

```
A1. 連續訊息延伸超過 debounce window (任一新訊息):
    A1.1 收到新訊息時若 window 已 expire → 開新 merged turn
    A1.2 舊 merged turn 已 emit；新 merged turn 啟動新 window

A2. Webhook 簽章驗證失敗 (第 1 步):
    A2.1 回 401，不寫入任何 conversation
    A2.2 END (rejected)

A3. 同訊息重複送 (LINE retry):
    A3.1 系統依 (channel_id, message_id) 偵測重複
    A3.2 不重複加入 buffer
    A3.3 不重複 emit

A4. media 訊息來源 URL 過期 (第 6 步):
    A4.1 系統下載 media 失敗
    A4.2 retry N 次（[ref: ADR-0029 fail-soft-to-durable-three-pack]）
    A4.3 仍失敗 → 標 media_ref status=unavailable，繼續處理文字部分
    A4.4 後續 A08 multimodal (FR-0025) 跳過該 media

A5. Buffer 累積過量 (邊界 throughput):
    A5.1 單一 merged turn 訊息數 ≥ 上限（[ref: BR-A01-NN buffer cap]，預設 10）
    A5.2 強制 flush 為 merged turn
    A5.3 後續訊息開新 turn
```

## §2 Acceptance Criteria (G/W/T)

### AC-01: Happy path — 2 秒內合併

```gherkin
Given LINE user "Alice" 已綁定 channel
When Alice 在 1 秒內傳送 3 則訊息 ("文字1", "文字2", "圖片")
Then 系統 buffer 累積 3 則
  And 2 秒後 flush
  And event `MergedTurnReady` emit (含 3 則訊息順序保留)
  And reply token 取自第一則訊息
```

### AC-02: 訊息順序保留

```gherkin
Given Alice 傳送訊息順序為 M1 (T0), M2 (T0+0.5s), M3 (T0+1s)
When 系統合併 merged turn
Then merged turn 內訊息順序為 [M1, M2, M3]（依 timestamp ascending）
```

### AC-03: media 轉 reference

```gherkin
Given Alice 傳送 JPG 圖片 size=2MB
When 系統 buffer 並合併
Then media 本體寫入 M09 evidence store
  And merged turn 內僅保留 media_ref（含 storage_url + mime_type + size）
  And chat history 不含二進位
```

### AC-04: debounce window expire 開新 turn

```gherkin
Given Alice 傳送訊息 M1 (T0)
  And 2 秒 debounce window 已 expire
When Alice T0+3s 傳送訊息 M2
Then 系統 emit merged turn 含 [M1]（已 flush）
  And 開新 debounce window 含 [M2]
  And 後續 M2 屬於新 merged turn
```

### AC-05: 訊息重複 idempotency

```gherkin
Given LINE 重送同一個 webhook event (message_id="msg-001")
When 系統處理重送
Then buffer 不重複加入 msg-001
  And merged turn 不重複 emit
  And response status = 200
```

### AC-06: Webhook 簽章失敗

```gherkin
Given LINE webhook 收到 invalid signature 訊息
When 系統驗證簽章
Then 回 401
  And 不寫入 conversation
  And 不寫入 buffer
```

### AC-07: media 下載失敗 fail-soft

```gherkin
Given Alice 傳送圖片但 LINE media URL 過期
When 系統嘗試下載 media
Then 系統 retry 3 次 ([ref: ADR-0029])
  And 仍失敗 → 標 media_ref status="unavailable"
  And 繼續 emit `MergedTurnReady` (含其他正常訊息 + 1 個 unavailable media_ref)
  And A08 multimodal (FR-0025) 跳過 unavailable media
```

### AC-08: Buffer cap 強制 flush

```gherkin
Given Alice 在 1 秒內傳送 12 則訊息
  And [ref: BR-A01-NN] buffer cap = 10
When 系統 buffer 累積到第 10 則
Then 系統強制 flush 為 merged turn (10 則)
  And 第 11, 12 則開新 buffer
```

## §2.1 Example Dialogue（chatbot FR 強制，per Roundtable B 2026-05-28 D2）

> Source: `templates/fr-skeleton.md` §2.1 (Roundtable B D2 — chatbot FR 殼 acceptance 段必含 3-5 條 scripted dialogue + a11y variant)。

### Dialogue 1 — Happy path (debounce 2s 內合併 3 則訊息) → 對應 AC-01

```
User [T0]: 我家門鎖壞了
User [T0+0.5s]: 是 A350 型
User [T0+1s]: [📎 photo.jpg, 5MB]
[System: debounce buffer 累積 3 則訊息]
[T0+2s: debounce window expire, flush]
Bot [T0+2.5s]: 收到您的訊息（已合併 3 則，含 1 張圖片），正在為您建立報修單，請稍候...
```

**a11y variant**：
- **Screen reader**：每則 user 訊息送出時朗讀「訊息已送出」audio cue；但 bot response 只朗讀**合併後 1 次**（避免重複噪音）
- **Keyboard-only**：3 則訊息送出後 focus 跳至 bot response live region (`aria-live=polite`)，不被 typing animation 中斷
- **視覺**：merged turn 顯示時應有「合併 N 則訊息」標記，避免使用者誤以為訊息漏送

### Dialogue 2 — Buffer cap 強制 flush (連續 12 則) → 對應 AC-08

```
User [T0~T0+1s]: [10 則連續短訊息]
[System: buffer cap 10 達到, 強制 flush]
Bot [T0+1.5s]: 收到 10 則訊息已合併處理，請稍候...
User [T0+1.5s]: 還有兩個問題
User [T0+1.7s]: 緊急嗎？
[System: 新 buffer 啟動, 含 2 則]
Bot [T0+3.7s]: 收到您後續 2 則訊息，正在補充處理中...
```

**a11y variant**：
- 「buffer cap flush」事件應有 visible indicator（如分隔線 + 「以下為新訊息批次」標記）
- Screen reader：朗讀「前 10 則已處理，新訊息批次開始」

### Dialogue 3 — Media 下載失敗 fail-soft (圖片 URL 過期) → 對應 AC-07

```
User [T0]: 鎖壞了
User [T0+0.3s]: [📎 photo.jpg]
[System: media download retry 3 次失敗, 標 media_ref status=unavailable]
[T0+2s: flush merged turn]
Bot [T0+5s]: 收到您的訊息，但您上傳的圖片目前無法處理（可能已過期或檔案損壞）。請重新上傳，或文字描述損壞處。
```

**a11y variant**：
- **Screen reader**：bot 必須**朗讀**「圖片無法處理」訊息（不能只靠視覺 icon / 紅色 badge）
- **視覺**：失敗 media 顯示 alt-text「圖片載入失敗」+ retry 按鈕
- 鍵盤：retry 按鈕需 `aria-label="重新上傳圖片"`

### Dialogue 4 — Webhook 簽章失敗（系統內部，使用者不直接感知）→ 對應 AC-06

```
[LINE webhook with invalid signature]
[System: 拒絕 401, 不寫入 conversation, 不寫入 buffer]
[使用者端 LINE app 顯示「訊息已送出」但系統未接收 — 預期行為]
```

**a11y variant**：
- 本場景使用者**無**直接感知（攻擊 / 中間人路徑），無 a11y 額外要求
- 但對 dev / SRE side：security event 應寫入 audit log + alert dashboard，dashboard 需符合 WCAG AA

### Dialogue 5 — LINE 重送冪等 → 對應 AC-05

```
User [T0]: 鎖壞了
[LINE retry: 同 message_id 重送]
[System: (channel_id, message_id) dedup, 不重複加入 buffer]
Bot [T0+2s]: 收到您的訊息，正在處理...
[使用者端 LINE app 不會看到 bot 重複回覆]
```

**a11y variant**：
- 使用者端**無**重複感知（系統內部冪等處理）
- 若使用者主動重送相同訊息（非 LINE 自動 retry）→ 系統正常處理為新訊息，避免誤判使用者重送為 LINE retry

---

## §3 Reference Map

| 類型 | ID | 用途 |
|:-----|:---|:-----|
| Business Rule | BR-A01-01 | debounce 合併視窗（預設 2s, configurable via M18） |
| Business Rule | BR-A01-02 | reply token single policy |
| Business Rule | BR-A01-03 | 訊息順序保留 |
| Business Rule | BR-A01-04 | media 轉 reference |
| Business Rule | BR-A01-NN | buffer cap（預設 10 訊息） |
| ADR | ADR-0004 | LINE Bot 架構 |
| ADR | ADR-0029 | fail-soft-to-durable-three-pack（media retry policy） |
| Domain Event | MergedTurnReady | A03 ReAct Agent 入口 |
| Domain Event | ConversationStarted | M16 / M19 BI |
| Source spec | `docs/_source/02-ai-chatbot-sync.md#a-m01-進線debounce` | A01 原始定義 |
| Source spec | `docs/_source/02-ai-chatbot-sync.md#02-chatbot模組a01-a12` | A01 in module map |

## §4 Change Log

| Date | Change | Why |
|:-----|:-------|:----|
| 2026-05-28 | **新建** — Phase I MVP 新增 FR (A01 系列首條) | Roundtable A 2026-05-27 D5 + 業主 Q2 採納；補新規格 A01 module 既有 FR 沒覆蓋的功能 |
| 2026-05-28 | **補 §2.1 Example Dialogue + a11y variant** (5 條 dialogue 對應 5 個 AC) | Roundtable B 2026-05-28 D2 — chatbot FR 強制 dialogue 治理；template 已升級 |
