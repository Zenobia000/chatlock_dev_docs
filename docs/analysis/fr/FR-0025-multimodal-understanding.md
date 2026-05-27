---
id: FR-0025
title: 對話多模態理解（圖、語音、影片）
status: active
phase: I
mapped_to:
  - A08    # 多模態
  - A03    # ReAct Agent
superseded_clauses:
  - BR-A08-01    # JPG/PNG/MP4/voice 4 modality
  - BR-A08-NN    # checkpoint cleanup
  - BR-A08-NN    # media size 限制
  - BR-A08-NN    # placeholder 替換時序
emits_events:
  - MediaProcessed
  - MediaProcessingFailed
nfr_flavored: false
priority: P0
tier: 2
owner: AI Specialist / Backend
last_reviewed: 2026-05-28
related_adrs:
  - ADR-0029    # fail-soft-to-durable
legacy_id: REQ-025
trace_to_flow: F-001
last-synced-with: 4e9658e90324cbceb26f5e5445f481fc5678df1f
related:
  - "../../_source/02-ai-chatbot-sync.md#a-m08-多模態"
---

# FR-0025 — 對話多模態理解（圖、語音、影片）

> **Migration**: 2026-05-28 改為 D5 殼結構（rule → BR）。對應 A08。

## §1 Use Case Skeleton

| 欄位 | 內容 |
|:-----|:-----|
| **Actor** | 消費者 (傳送 media) |
| **Secondary Actors** | A08 Multimodal pipeline, A03 ReAct, M09 Evidence |
| **Trigger** | 客戶傳送 image / voice / video |
| **Precondition** | media size ≤ 限制 |
| **Main Flow** | 詳見 §1.1 → user-flow:S1-step-media |
| **Alternative Flow** | 詳見 §1.2 |
| **Postcondition** | media_ref + description；emit `MediaProcessed` |

### §1.1 Main Flow

1. 客戶 LINE 傳 image (JPG/PNG) / voice / video (MP4) → user-flow:S1-step-media
2. 系統下載 media → M09 Evidence store
3. 替換 chat history 中的 placeholder 為 media_ref
4. A08 pipeline 跑 vision / STT / OCR
5. 將 description 注入 A03 prompt context
6. emit `MediaProcessed`
7. checkpoint cleanup（[ref: BR-A08-NN]）
8. END

### §1.2 Alternative Flow

```
A1. Media size > 限制:
    A1.1 拒絕 + 提示

A2. Download 失敗:
    A2.1 retry 3 次 ([ref: ADR-0029])
    A2.2 仍失敗 → media_ref status=unavailable
    A2.3 emit `MediaProcessingFailed`

A3. Vision / STT 失敗:
    A3.1 fail-soft: 跳過 description
    A3.2 A03 仍處理文字部分

A4. Format unsupported:
    A4.1 拒絕 + 提示「僅支援 JPG/PNG/MP4/voice」
```

### Example Dialogue (A3.6 — multimodal scenario)

**Scenario 1: 客戶傳照片描述鎖故障**

User: [傳照片：鎖芯特寫]
AI: 我看到照片是 [品牌] 鎖芯特寫，鎖芯內部有金屬磨損痕跡。請問您是無法插入鑰匙、還是插入後轉不動？
User: 插入後轉不動
AI: 了解。我建議派技師到場檢修鎖芯。請問方便的時段？
Result: → emit `MediaProcessed`, problem_card.facts.symptom = "鎖芯磨損"

A11y variant:
- Screen reader 朗讀順序: User msg「客戶傳送了 1 張照片」→ AI msg (前綴「AI 回應:」)
- Keyboard-only: tab order — 輸入框 → 上傳按鈕 → 送出 → aria-live=polite 區
- 圖片 alt text 由 AI vision 自動生成（"鎖芯特寫，內部金屬磨損"）

**Scenario 2: 客戶傳語音**

User: [語音 15 秒]：「我家門鎖打不開，剛換的電池也沒用。」
AI: 我聽到您說鎖打不開，剛換電池無效。請問是按鎖芯沒反應、還是顯示燈號異常？
User: 完全沒反應
Result: → emit `MediaProcessed`, ProblemCard 預填 brand + symptom

A11y variant:
- 語音播放器 含 transcript 字幕
- Screen reader 讀「客戶語音訊息: <STT 結果>」
- Keyboard: space 播放 / 暫停

**Scenario 3: Media unavailable fail-soft**

User: [傳影片，下載失敗]
AI: 抱歉，您剛才傳的影片無法載入。能否再傳一次，或用文字描述問題？
User: 鎖完全打不開
AI: 好的，請問鎖是電子鎖還是機械鎖？
Result: → emit `MediaProcessingFailed`, 主流程繼續

A11y variant:
- aria-live="assertive" 通知客戶 media 失敗
- 提供 retry / 文字描述 fallback button (tab-focusable)

## §2 Acceptance Criteria

### AC-01: Happy path 圖片

```gherkin
When 客戶傳 JPG 5MB
Then A08 處理 + description 注入
  And `MediaProcessed` emit
```

### AC-02: 語音 STT

```gherkin
When 客戶傳 voice 15s
Then STT 轉文字 + 注入 A03 context
```

### AC-03: Download fail-soft

```gherkin
Given LINE media URL 過期
When 下載 3 次失敗
Then media_ref = unavailable
  And `MediaProcessingFailed` emit
  And A03 仍處理文字
```

### AC-04: Format unsupported

```gherkin
When 客戶傳 .docx
Then 拒絕 + 提示
```

### AC-05: WCAG conformance

```gherkin
When 客戶傳語音
Then 系統顯示 transcript 字幕
  And screen reader 可讀
```

## §3 Reference Map

| 類型 | ID | 用途 |
|:-----|:---|:-----|
| BR | BR-A08-01 / NN | modality / cleanup / size / placeholder |
| ADR | ADR-0029 | fail-soft-to-durable |
| Event | MediaProcessed / MediaProcessingFailed | — |

## §4 Change Log

| Date | Change |
|:-----|:-------|
| 2026-05-10 | REQ-025→FR-0025 |
| 2026-05-28 | **D5 殼 rewrite + A3.6 dialogue/a11y** |
