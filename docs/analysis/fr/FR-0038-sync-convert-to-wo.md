---
id: FR-0038
title: Sync — confirmed ProblemCard 轉 WorkOrder（強制 human gate）
status: active
phase: I
mapped_to:
  - S-M04    # ConvertToWO
  - M03     # ProblemCard
  - M05     # WorkOrder
superseded_clauses:
  - BR-S-M04-01    # confirmed PC → created WO
  - BR-S-M04-02    # idempotency + address required
  - BR-S-M04-NN    # 強制 human gate (ADR-0031)
  - BR-S-M04-NN    # CS-path csagent_triggered（FR-0018 流程）
emits_events:
  - WorkOrderConverted
  - ConvertGateRejected
nfr_flavored: false
priority: P0
tier: 1
owner: Backend / 客服主管
last_reviewed: 2026-05-28
related_adrs:
  - ADR-0031    # AI auto convert_to_work_order
  - ADR-0033    # PC completeness
  - ADR-0066    # Quote ↔ WO lifecycle binding
related:
  - "../../_source/02-ai-chatbot-sync.md#s-m04-converttowo"
---

# FR-0038 — Sync ConvertToWO（強制 human gate）

> **新增 FR (2026-05-28)** — S-M04。Phase I。**Roundtable D2: 強制 human gate**（AI 不可自動 convert）。

## §1 Use Case Skeleton

| 欄位 | 內容 |
|:-----|:-----|
| **Actor** | 客服 (manual) / CS-path 觸發 (FR-0018) |
| **Secondary Actors** | A06 (source PC), ERP M05 WorkOrder |
| **Trigger** | PC status = "confirmed" + 客服 / CS-path 觸發 |
| **Precondition** | PC complete (completeness_score ≥ 0.85)；address 完整 |
| **Main Flow** | 詳見 §1.1 → user-flow:S-M04-step1 |
| **Alternative Flow** | 詳見 §1.2 |
| **Postcondition** | WO created；emit `WorkOrderConverted` |

### §1.1 Main Flow

1. PC.status = "confirmed" → user-flow:S-M04-step1
2. **必經 human gate**: 客服 / CS-path (FR-0018) 觸發 ConvertToWO ([ref: BR-S-M04-NN ADR-0031])
3. 系統驗證 PC 完整性 + address (M02 facts)
4. 建立 WorkOrder (with idempotency_key = PC.id)
5. emit `WorkOrderConverted`
6. 進 FR-0003 dispatch flow
7. END

### §1.2 Alternative Flow

```
A1. AI 試圖自動 convert (任何時候):
    A1.1 系統攔截 ([ref: BR-S-M04-NN])
    A1.2 emit `ConvertGateRejected`
    A1.3 audit + alert

A2. completeness < 0.85 / address 缺:
    A2.1 拒絕 + 提示「補資料」
    A2.2 emit `ConvertGateRejected`

A3. Idempotency 衝突:
    A3.1 同 PC.id 已 converted → 回既有 WO

A4. CS-path 觸發 (FR-0018):
    A4.1 客服一鍵呼叫 → trigger_source = "cs_path_csagent_triggered"
    A4.2 客戶免再確認
    A4.3 emit `WorkOrderConverted` (with trigger context)
```

## §2 Acceptance Criteria

### AC-01: Human gate enforced

```gherkin
Given PC confirmed
When AI 試圖 auto convert
Then 系統攔截 + `ConvertGateRejected`
```

### AC-02: Manual convert OK

```gherkin
When 客服 tap "convert"
Then WO created + `WorkOrderConverted`
```

### AC-03: completeness gate

```gherkin
Given completeness = 0.7
Then `ConvertGateRejected` (reason="completeness")
```

### AC-04: CS-path

```gherkin
Given FR-0018 客服接管
When 一鍵 "開工單"
Then trigger_source = "cs_path_csagent_triggered"
  And `WorkOrderConverted` emit
```

### AC-05: Idempotency

```gherkin
When 同 PC.id 再 convert
Then 回既有 WO
```

### Example Dialogue (A3.6)

**Scenario 1: Happy path — 客服手動 convert**

[PC-001 confirmed by A06]
客服在 Admin Console tap "convert to WO"
[系統建 WO-001]
AI 發推播給客戶: 您的報修單已轉為工單 #WO-001，技師將於 24 小時內聯絡您。
Result: → `WorkOrderConverted`, trigger_source="manual_cs"

A11y variant:
- WO 編號 `<strong>` + aria-label
- 推播 ARIA role="status"

**Scenario 2: AI 試圖自動 convert (應被攔截)**

[A03 試圖呼叫 convert_to_workorder tool]
[A05 Safety + S-M04 gate 雙重攔截]
AI: 系統提示需客服確認後才能轉工單，請稍候客服處理。
Result: → `ConvertGateRejected` (reason="ai_auto_convert_forbidden"), audit + alert

A11y variant:
- 客戶端訊息 ARIA role="status"
- 不洩漏內部 gate 細節

**Scenario 3: CS-path 一鍵轉**

[FR-0018 客服接管 → 一鍵 "開工單"]
[系統 ConvertToWO with trigger_source="cs_path_csagent_triggered"]
客服: 我已幫您建立工單 #WO-002，技師將主動聯絡。
Result: → `WorkOrderConverted`, 客戶免確認

A11y variant:
- "已建立 #WO-002" 用 `<strong>` 強調
- 客戶端不需任何 button — 已轉好

## §3 Reference Map

| 類型 | ID | 用途 |
|:-----|:---|:-----|
| BR | BR-S-M04-01/02/NN | sync / idempotency / human gate / CS path |
| ADR | ADR-0031/0033/0066 | gate / completeness / lifecycle |
| Event | WorkOrderConverted / ConvertGateRejected | — |

## §4 Change Log

| Date | Change |
|:-----|:-------|
| 2026-05-28 | **新建** — S-M04 module FR 殼 + human gate + A3.6 dialogue |
