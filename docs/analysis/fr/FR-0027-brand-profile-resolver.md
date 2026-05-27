---
id: FR-0027
title: Chatbot 品牌型號與用戶資料 Resolver
status: active
phase: I
mapped_to:
  - A02    # Brand/Profile Resolver (primary)
  - M02    # Customer / Site / Device Master
  - M10    # Product / BOM (brand model master)
superseded_clauses:
  - BR-A02-01    # SCD Type 2 user_facts (歷史可追)
  - BR-A02-02    # 品牌型號 facts → device_brand / device_model / serial / warranty_date
  - BR-A02-03    # phone + LINE userId 為去重 key (對齊 BR-M02-01)
  - BR-A02-04    # 事實衝突 → 採信最新 (但保留歷史 SCD2)
  - BR-A02-05    # AI 不可直接寫 master data，須走 update_proposal + 客戶 / CSM 確認
emits_events:
  - UserFactsUpdated
  - UserFactsConflictDetected
  - DeviceRegistered
  - CustomerProfileLinked
nfr_flavored: false
priority: P0
tier: 1
owner: 客服主管 / Data steward / AI Specialist
last_reviewed: 2026-05-28
related_adrs:
  - ADR-PII-002   # data minimization
  - ADR-0008      # product-info-architecture (REVIEW_REQUIRED, M10)
  - ADR-0030      # tenant-id-propagation
related:
  - "../../_source/02-ai-chatbot-sync.md#a-m02-品牌型號profile"
  - "../../_source/01-workorder-erp.md#m02-客戶地址設備"
created_in: "Phase I MVP — Roundtable A 2026-05-27 fr-mapping §2 A02 系列"
---

# FR-0027 — Chatbot 品牌型號與用戶資料 Resolver

> **Phase I 新增 FR (2026-05-28)**，對應 chatbot 模組 A02。
> A 系列 chatbot FR — 含 §2.1 Example Dialogue + a11y variant（per Roundtable B D2）。

## §1 Use Case Skeleton

| 欄位 | 內容 |
|:-----|:-----|
| **Actor** | AI Agent (A03) — resolver caller |
| **Secondary Actors** | 消費者（被詢問澄清時）, CSM (confirm proposed update), M02 Customer Master, M10 Product Master |
| **Trigger** | A03 ReAct Agent 進 intent 辨識後需 device_brand / device_model / serial / warranty_date / phone / address facts；或客戶主動更新自身資料 |
| **Precondition** | Conversation 已存在 (FR-0001 / FR-0026)；merged turn 已送進 A03 |
| **Main Flow** | 詳見 §1.1 |
| **Alternative Flow** | 詳見 §1.2 |
| **Postcondition** | user_facts 已 update（SCD2）；emit `UserFactsUpdated`；新 device 進 M10 → emit `DeviceRegistered` |
| **Out-of-Scope** | ProblemCard 草擬（FR-0002）；customer 帳號管理（屬其他 FR） |

### §1.1 Main Flow

1. AI Agent A03 跑 intent 後判定缺 fact（如 device_brand 未知）
2. A02 Resolver 查 M02/M10 是否已有此 customer + device 紀錄
3. 若有：取 latest fact 回傳給 A03
4. 若無 / 不完整：AI 主動詢問客戶 (clarification turn)
5. 客戶回覆後 A02 parse fact (brand / model / serial / etc)
6. validate fact 格式（[ref: BR-A02-02]）：brand 在 M10 enum 內；model 對應 brand
7. SCD2 write user_facts row（[ref: BR-A02-01]）：含 valid_from / valid_to=NULL
8. emit `UserFactsUpdated`
9. 若新 device 不在 M10 master → emit `DeviceRegistered` (待 CSM batch register / 或在 valid brand 下自動新增 sub-model)
10. END：postcondition 達成

### §1.2 Alternative Flow

```
A1. Brand 不在 M10 enum (第 6 步):
    A1.1 系統提示「該品牌目前無服務，是否要報修其他品牌？」
    A1.2 若客戶堅持 → 進 FR-0018 cs-takeover（CSM 判斷）
    A1.3 不寫入 user_facts（避免污染 master）

A2. Phone 衝突 — 同 phone 對應多個 LINE userId (第 2 步):
    A2.1 [ref: BR-A02-03 + BR-M02-01] phone + LINE userId 為複合 key
    A2.2 系統 prefer LINE userId（更穩定的 identifier）
    A2.3 audit log 標 "PHONE_MULTI_LINE_ID"
    A2.4 不自動 merge profile

A3. 新 fact 與既有衝突 (第 6 步):
    A3.1 [ref: BR-A02-04] 採信最新但保留歷史 SCD2
    A3.2 emit `UserFactsConflictDetected`（含 old / new diff）
    A3.3 高敏感 fact（warranty_date / address）需 CSM review → AI 標 update_proposal status="pending_csm_review"

A4. AI 嘗試直接寫 master data (anti-pattern):
    A4.1 [ref: BR-A02-05] 系統拒絕
    A4.2 必須先建 update_proposal + 客戶 / CSM 確認後才生效
    A4.3 audit log 標 "AI_DIRECT_WRITE_BLOCKED"

A5. 客戶拒答品牌 (第 4 步):
    A5.1 AI 嘗試從 conversation context 推測（如圖片標籤、舊 PC 紀錄）
    A5.2 推測 confidence < 0.7 → 維持 unknown
    A5.3 PC completeness 受影響（FR-0002）→ 可能 status=Need Info

A6. Cross-tenant 試圖讀 (第 2 步):
    A6.1 [ref: ADR-0030] tenant_id 強制 filter
    A6.2 跨 tenant 查詢 → 403
    A6.3 audit log 標 "CROSS_TENANT_LOOKUP_DENIED"

A7. Device 序號被多客戶宣稱 (第 9 步):
    A7.1 系統偵測 serial 已歸屬 other customer
    A7.2 emit `UserFactsConflictDetected` reason="device_ownership_dispute"
    A7.3 alert CSM 介入（可能涉及二手 / 轉讓 / 詐騙）
```

## §2 Acceptance Criteria (G/W/T)

### AC-01: Happy path — 新客戶第一次提供 brand

```gherkin
Given Conversation "C-001" 為新客戶 Alice，無 user_facts
When AI 詢問品牌，Alice 答「三星電子鎖」
Then A02 validate brand 在 M10 enum
  And user_facts 新增 row (device_brand="Samsung", valid_from=now, valid_to=NULL)
  And event `UserFactsUpdated` emit
```

### AC-02: SCD2 歷史保留 — fact 更新時

```gherkin
Given user_facts 有 row (device_brand="Samsung", valid_to=NULL)
When 客戶後來說「換成 Yale 了」
Then 舊 row valid_to=now
  And 新 row (device_brand="Yale", valid_from=now, valid_to=NULL)
  And **保留歷史**（不 UPDATE，只 INSERT）
  And event `UserFactsUpdated` emit
```

### AC-03: Brand 不在 M10 enum

```gherkin
When 客戶答「我用的是 ABC123 雜牌鎖」
  And ABC123 不在 M10 brand master
Then AI 回「該品牌目前無服務」
  And 不寫入 user_facts
  And 進 FR-0018 cs-takeover
```

### AC-04: AI 不可直接寫 master

```gherkin
Given AI 偵測新 device serial="SN-XYZ" 未在 M10
When AI 嘗試直接 INSERT 到 M10 product master
Then 系統拒絕 ([ref: BR-A02-05])
  And 改建 update_proposal row (status="pending_csm_review")
  And audit log 標 "AI_DIRECT_WRITE_BLOCKED"
```

### AC-05: Fact 衝突 — 採信最新 + emit event

```gherkin
Given user_facts 有 (warranty_date="2025-01-01")
When 客戶說「保固到 2025-12-31」
Then SCD2 寫新 row (warranty_date="2025-12-31", valid_from=now)
  And event `UserFactsConflictDetected` emit (含 old/new diff)
  And 因 warranty 為高敏 → 標 update_proposal "pending_csm_review"
```

### AC-06: Phone 多 LINE userId

```gherkin
Given phone "0912345678" 對應 LINE userId "U-001"
When 不同人用 phone "0912345678" + LINE userId "U-002" 對話
Then 系統 prefer LINE userId
  And audit "PHONE_MULTI_LINE_ID"
  And **不**自動 merge 兩個 profile
```

### AC-07: Cross-tenant 隔離

```gherkin
Given Alice 屬 tenant T-001
When AI 試圖查 tenant T-002 的 device
Then 403 ([ref: ADR-0030])
  And audit "CROSS_TENANT_LOOKUP_DENIED"
```

### AC-08: Device 序號 ownership dispute

```gherkin
Given device "SN-001" 已歸屬 customer Bob
When Alice 宣稱擁有 "SN-001"
Then emit `UserFactsConflictDetected` reason="device_ownership_dispute"
  And alert CSM
  And Alice 的 user_facts 暫不 link 該 device
```

## §2.1 Example Dialogue (chatbot FR 強制, per Roundtable B 2026-05-28 D2)

### Dialogue 1 — Happy path 新客戶 brand resolver → 對應 AC-01

```
User: 我家鎖壞了
Bot: 您好！為了幫您安排正確的服務，請問您是什麼品牌的鎖？例如：三星、Yale、Samsung Push Pull、Gateman 等
User: 三星
Bot: 收到，三星電子鎖。請問是哪個型號呢？例如 SHS-P718、SHS-H700 等？
User: SHS-P718
[System: A02 validate Samsung in M10 enum ✓, SHS-P718 in Samsung sub-models ✓]
[A02: SCD2 INSERT user_facts (brand="Samsung", model="SHS-P718", valid_from=now)]
[Emit: UserFactsUpdated]
Bot: 好的，三星 SHS-P718。請問鎖目前是什麼狀況？
```

**a11y variant**：
- **Screen reader**：每個 brand option 朗讀獨立（不要連在一起念）；model 詢問時提示「可選或直接輸入」
- **Keyboard-only**：brand options 應為 chip-style 可 Tab + Enter 選擇，不只 free text
- **視覺**：選定 brand/model 顯示確認 tag（如「✓ Samsung / SHS-P718」）

### Dialogue 2 — Brand 不在 enum (A03)

```
User: 我家是 ABC123 雜牌的智慧鎖
[A02: brand="ABC123" not in M10 enum]
Bot: 抱歉，目前我們暫不提供 ABC123 品牌的服務。請問您是否還有其他品牌的鎖需要協助？如三星、Yale 等。如需 ABC123 服務，我可以幫您轉接客服了解可行性。
User: 還是想要服務 ABC123 的
[Emit: HumanHandoffTriggered (reason="unsupported_brand_request")]
Bot: 好的，我立即幫您轉客服主管評估，請稍候。
```

**a11y variant**：
- Screen reader：朗讀「抱歉，目前不支援 ABC123」應在錯誤訊息前置（避免使用者期待）
- 轉客服按鈕 ARIA role="button"，labelled「轉接客服評估」

### Dialogue 3 — Fact 衝突 update_proposal (A05 高敏)

```
[Context: user_facts 既有 warranty_date="2025-01-01"]
User: 對了，我的鎖保固延長到 2025 年底了，可以幫我更新嗎？
[A02: warranty_date 為高敏 fact → SCD2 INSERT (warranty_date="2025-12-31") + status="pending_csm_review"]
[Emit: UserFactsConflictDetected (old="2025-01-01", new="2025-12-31")]
Bot: 好的，我已記錄您要更新保固日期為 2025-12-31。為了確保資料正確，這項變更會由客服專員確認後生效（通常 1 個工作日內）。確認完成後會以 LINE 通知您。
```

**a11y variant**：
- "1 個工作日內" 應有 visible timestamp（如「預計 2026-05-29 前完成」）
- CSM 確認結果通知應 ARIA role="status"（非 critical alert，避免打擾）
- 螢幕閱讀器朗讀完整流程（不只「已記錄」）

### Dialogue 4 — Device 序號 ownership dispute (A07)

```
User: 我新買的鎖序號是 SN-001，幫我登錄
[A02: SN-001 already linked to customer Bob]
[Emit: UserFactsConflictDetected (reason="device_ownership_dispute")]
[Alert CSM]
Bot: 您好，序號 SN-001 的設備需要進一步確認所有權（可能是二手轉讓或購買來源差異）。我已通知客服專員為您確認，預計 1-2 個工作日內聯繫您，期間請保留購買證明（發票或保固卡）。
```

**a11y variant**：
- 「保留購買證明」應為 list 格式（`<ul>` 含發票 / 保固卡 / 收據等）— 不只純文字
- CSM 聯繫時間應為「最遲 5/30 17:00」具體時間（screen reader 友善）

### Dialogue 5 — 客戶拒答品牌但有圖 (A05)

```
User: 我不知道品牌啦
User: [📎 photo of lock]
[A02: 嘗試從 photo metadata / context 推測 — confidence < 0.7]
Bot: 沒關係！我從照片看不太出品牌（請見諒），方便您看一下鎖的正面或側邊有沒有 logo / 標籤？通常會印在鎖芯附近。
User: 找不到耶
[A02: 維持 device_brand="unknown", confidence=低]
Bot: 沒問題，我先以您現在描述的狀況幫您預約技師，技師到場時會幫您確認品牌型號。請問鎖目前是什麼狀況？
[ProblemCard.completeness 受影響 — status="Need Info" but allow proceed]
```

**a11y variant**：
- 「請見諒」這類禮貌語應用 `<em>`（強調但非緊急）
- 圖片描述 fallback 應為 `aria-describedby`（screen reader 朗讀「圖片：未識別品牌」）

## §3 Reference Map

| 類型 | ID | 用途 |
|:-----|:---|:-----|
| Business Rule | BR-A02-01 | SCD2 user_facts |
| Business Rule | BR-A02-02 | brand/model facts 格式 |
| Business Rule | BR-A02-03 | phone + LINE 去重 |
| Business Rule | BR-A02-04 | 衝突採信最新 |
| Business Rule | BR-A02-05 | AI 不可直寫 master |
| ADR | ADR-PII-002 | data minimization |
| ADR | ADR-0008 | product-info-architecture (REVIEW_REQUIRED) |
| ADR | ADR-0030 | tenant-id-propagation |
| Domain Event | UserFactsUpdated | M02 cascade + M19 BI |
| Domain Event | UserFactsConflictDetected | CSM inbox |
| Domain Event | DeviceRegistered | M10 master + CSM batch |
| Domain Event | CustomerProfileLinked | M02 dedupe |
| Source spec | `docs/_source/02-ai-chatbot-sync.md#a-m02-品牌型號profile` | A02 原始定義 |
| Source spec | `docs/_source/01-workorder-erp.md#m02-客戶地址設備` | M02 原始定義 |

## §4 Change Log

| Date | Change | Why |
|:-----|:-------|:----|
| 2026-05-28 | **新建** Phase I MVP (A02 系列) | Roundtable A 2026-05-27 D5 + Q2=C；§2.1 Example Dialogue 5 條對應 5 AC + a11y variant (Roundtable B D2 強制) |
