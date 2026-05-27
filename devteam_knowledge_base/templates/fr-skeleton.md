---
id: FR-NNNN
title: <FR 標題>
status: draft | active | superseded
mapped_to:
  - M??         # ERP module
  - A??         # Chatbot module (optional)
  - S-M??       # Sync module (optional)
phase: 0 | I | II | III | IV | V
superseded_clauses: []   # 列被搬到 BR 的 rule clause ID (BR-M??-NN)
emits_events: []         # 列該 use case 觸發的 Domain Event (來自 Domain Events Catalog)
nfr_flavored: false      # true 時應考慮搬到 NFR matrix（見 §Open Questions Q3 policy）
owner: <role>
last_reviewed: YYYY-MM-DD
related_adrs: []
---

# FR-NNNN: <FR 標題>

> **B' 殼範本** — 2026-05-27 roundtable decision D5。
> FR 是 **acceptance 殼**，rule clause 全在 BR-M??-NN。
> 不寫業務規則內容，只寫 use case 結構與 acceptance criteria。

## §1 Use Case Skeleton

| 欄位 | 內容 |
|:-----|:-----|
| **Actor** | <主要 actor（客戶 / 客服 / 師傅 / 系統 / AI / partner）> |
| **Secondary Actors** | <次要 actor（如有）> |
| **Trigger** | <觸發條件，1-2 句> |
| **Precondition** | <前置條件，最多 3 條，引用 BR 不重寫 rule> |
| **Main Flow** | 編號步驟，每步一句，**不寫 rule 內容**（rule 引用 `[ref: BR-M??-NN]`） |
| **Alternative Flow** | 編號子流程（A1, A2...），命名 `<偏離點>: <分支描述>` |
| **Postcondition** | <事後狀態，最多 3 條；觸發 event 列在 frontmatter `emits_events`> |
| **Out-of-Scope** | <明文排除的場景，避免日後 scope creep> |

### Main Flow 範例

```
1. Actor 透過 <channel> 觸發 <action>
2. 系統執行 <validation>，依 [ref: BR-M03-02]（不寫 rule 內容）
3. 系統建立 <entity>，emit `<EventName>` （列在 frontmatter）
4. <next actor> 收到通知並執行 <next-step>
5. END：postcondition 達成
```

### Alternative Flow 範例

```
A1. 第 2 步 validation 失敗:
    A1.1 系統回傳錯誤碼 <code>，依 [ref: BR-M15-NN]
    A1.2 通知 <fallback actor>
    A1.3 進入 [ref: FR-NNNN exception flow] 或 END

A2. 第 3 步 entity 建立失敗 (idempotency conflict):
    A2.1 ...
```

## §2 Acceptance Criteria (G/W/T)

> 每條 acceptance 對應一個 main/alternative flow 終點。QA 直接套 case。

### AC-01: <happy path>

```gherkin
Given <precondition state>
When <actor action>
Then <observable outcome>
  And <event emitted>
  And <persisted state>
```

### AC-02: <alternative path 1>

```gherkin
Given <precondition state>
When <偏離點 action>
Then <fallback outcome>
  And <error code>
```

### AC-03: <alternative path 2>
...

### §2.1 Example Dialogue（chatbot FR 限定，A3.6 強制）

> Source: Roundtable B (2026-05-28) D2 — chatbot FR 殼 acceptance 段必含 3-5 條 scripted dialogue + a11y variant。
> 非 chatbot FR 可省略本段。

**Example Dialogue 1 — Happy path**

```
User: 我家門鎖壞了
Bot: 您好，我幫您建立報修單。請問是哪款鎖？
User: A350
Bot: 已建立報修單 #1234，師傅會在 24h 內聯繫您。
```

**a11y variant**：
- **Screen reader 朗讀順序**：bot message header → bot message body → input area label → submit button → bot response live region (`aria-live=polite`)
- **Keyboard-only 路徑**：Tab to input → 輸入 → Enter 送出 → focus 跳回 bot response（focus management 不可被 typing animation 中斷）

**Example Dialogue 2 — Handoff path (low confidence)**

```
User: 我的鎖 confidence 不夠 example...
Bot: 我幫您接通真人客服，請稍候...
[System: handoff queued]
Agent (人): 您好，我是客服 Mary，請問...
```

**a11y variant**：
- **Screen reader**：handoff 動作必須朗讀「正在轉接客服」（不是只有視覺 spinner）
- **Keyboard**：handoff 期間 input 應 disabled + 朗讀「等待客服中」

**Example Dialogue 3 — Guardrails block**

```
User: <out-of-scope question>
Bot: 抱歉，這個問題超出我的範圍。我幫您接客服？ [Yes / No]
```

**a11y variant**：
- 選項按鈕需有明確 aria-label（不只是 emoji / icon）

> 每條 dialogue 對應一個 AC（如 AC-01 / AC-02），便於 QA 套 case。

---

## §3 Reference Map

> 自動生成自 frontmatter，本段不需手動維護（由 traceability matrix tool 反向填）。

| 類型 | ID | Section |
|:-----|:---|:--------|
| Business Rule | BR-M??-NN | rule content lives there |
| ADR | ADR-NNNN | decision rationale |
| Domain Event | <EventName> | event catalog row |
| Test Case | TC-FR-NNNN-AC-NN | test plan row |
| NFR | NFR-NNNN | NFR matrix row (if applicable) |

## §4 Change Log

> 不寫 rule 變動（rule 在 BR）。只寫 use case 結構變動（actor 新增、flow 拆分、scope 變更）。

| Date | Change | Why |
|:-----|:-------|:----|
| YYYY-MM-DD | initial draft from <source> | <reason> |

---

## 範本使用注意

1. **不寫 rule clause 內容**（如「金額 ≥ 5000 需主管核准」）— 寫在 BR-M??-NN
2. **每條 FR 至少對應 1 個 Domain Event**（沒對應 = event 沒人 emit，違反 D5 治理）
3. **`mapped_to` 必填**（FR 沒對到 module = orphan，traceability matrix 會 flag）
4. **`nfr_flavored: true` 的 FR**（如 SLA / availability）依 Q3=A policy 應移到 NFR matrix
5. **cross-module FR**（如 FR-0008 異常核准橫跨 M15+M17+M16）：`mapped_to` 列多個 M-ID，這是允許的，by-module reverse index 會自動歸到多個 M
6. **保留 alternative flow 編號規則**（A1/A2/A1.1/A2.1），便於 test case 對應
