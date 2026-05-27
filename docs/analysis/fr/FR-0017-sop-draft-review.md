---
id: FR-0017
title: SOP 草稿審核（AI 自進化）
status: active
phase: I
mapped_to:
  - A10    # SOP 螺旋 (chatbot AI eval)
  - M20    # AI Charter / Knowledge governance
  - A04    # Skill 知識庫 (RAG)
superseded_clauses:
  - BR-A10-NN    # admin 初審 + family_reviewer 終審
  - BR-A10-NN    # 高風險 SOP 雙審 (客服主管 + Domain expert)
  - BR-A10-NN    # FAQ 類單審 (Knowledge Owner)
  - BR-A10-NN    # APPEND-ONLY 覆核紀錄
  - BR-A04-NN    # 外部平台 ingestion 走同流程 + source attribution
emits_events:
  - SopDraftSubmitted
  - SopDraftApproved
  - SopDraftRejected
  - FamilyReviewCompleted
  - SopPublished
nfr_flavored: false
priority: P1
tier: 2
owner: Knowledge Owner / 客服主管
last_reviewed: 2026-05-28
related_adrs:
  - ADR-0038    # ai-feedback-review-policy
  - ADR-0058    # external-knowledge-platform-ingestion-contract
  - ADR-0061    # data-governance-service-boundary
legacy_id: REQ-017
trace_to_flow: F-017
last-synced-with: 4e9658e90324cbceb26f5e5445f481fc5678df1f
related:
  - "../../_source/02-ai-chatbot-sync.md#a-m10-sop螺旋"
---

# FR-0017 — SOP 草稿審核（AI 自進化）

> **Migration**: 2026-05-28 改為 D5 殼結構（rule → BR）。對應 A10 module。

## §1 Use Case Skeleton

| 欄位 | 內容 |
|:-----|:-----|
| **Actor** | AI Agent (draft) / Knowledge Owner / 客服主管 / family_reviewer |
| **Secondary Actors** | M20 Charter, A04 Skill DB, Ingestion Gateway |
| **Trigger** | (1) resolved + rating ≥ 4 自動觸發；(2) 外部平台 ingestion ([ref: ADR-0058]) |
| **Precondition** | SOP 候選含 source / contributor metadata |
| **Main Flow** | 詳見 §1.1 → user-flow:S6-step1 |
| **Alternative Flow** | 詳見 §1.2 |
| **Postcondition** | SOP row in `draft` / `approved` / `rejected`；emit 對應 event |

### §1.1 Main Flow

1. AI 草擬 SOP（或 ingestion 進來）→ user-flow:S6-step1
2. emit `SopDraftSubmitted`
3. 系統依分類分流：高風險 (報價/退款/法律) → 雙審；FAQ → 單審 ([ref: ADR-0038])
4. admin 初審
5. family_reviewer 終審（任一 approve 即通過，[ref: BR-A10-NN]）
6. emit `SopDraftApproved` + `FamilyReviewCompleted`
7. SOP publish → A04 RAG index
8. emit `SopPublished`
9. END

### §1.2 Alternative Flow

```
A1. Admin reject (第 4 步):
    A1.1 SOP 回 draft
    A1.2 emit `SopDraftRejected`
    A1.3 可再次提交

A2. 嘗試繞過 family_review (第 5 步):
    A2.1 回 403 family_review_required

A3. 覆核紀錄修改嘗試:
    A3.1 DB trigger 攔截 (APPEND-ONLY)
    A3.2 audit tamper_attempt

A4. 外部 ingestion (第 1 步 alternative trigger):
    A4.1 經 Ingestion Gateway schema validate ([ref: ADR-0058])
    A4.2 保留 source attribution + contributor
    A4.3 走相同 §1.1 第 2-8 步
```

## §2 Acceptance Criteria

### AC-01: Happy path 高風險雙審

```gherkin
Given SOP-001 category="refund" (高風險)
When admin + Domain expert approve
Then emit `SopDraftApproved` + `SopPublished`
```

### AC-02: FAQ 單審

```gherkin
Given SOP-002 category="faq"
When Knowledge Owner approve
Then `SopDraftApproved`
```

### AC-03: family_review bypass

```gherkin
When 嘗試 publish 未經 family_review
Then 403 family_review_required
```

### AC-04: APPEND-ONLY

```gherkin
When 嘗試 UPDATE 覆核紀錄
Then DB trigger 攔截 + audit tamper_attempt
```

### AC-05: External ingestion

```gherkin
When 外部平台 ingest SOP
Then schema validate + source attribution
  And 走同樣審核流程
```

## §3 Reference Map

| 類型 | ID | 用途 |
|:-----|:---|:-----|
| BR | BR-A10-NN | 審核分流 / APPEND-ONLY |
| BR | BR-A04-NN | external ingestion |
| ADR | ADR-0038 | ai-feedback-review |
| ADR | ADR-0058 | external knowledge ingestion |
| ADR | ADR-0061 | data governance |
| Event | SopDraft* / SopPublished / FamilyReviewCompleted | — |

## §4 Change Log

| Date | Change |
|:-----|:-------|
| 2026-05-10 | REQ-017→FR-0017 |
| 2026-05-22 | ADR-0038 + ADR-0058 |
| 2026-05-28 | **D5 殼 rewrite** |
