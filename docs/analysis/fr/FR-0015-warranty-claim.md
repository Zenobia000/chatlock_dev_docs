---
id: FR-0015
title: 保固申訴受理
status: active
phase: I
mapped_to:
  - M13    # Warranty
  - M15    # Exception
superseded_clauses:
  - BR-WARRANTY-001   # handover_date 起算
  - BR-WARRANTY-002   # AI 禁止自動報價
  - BR-WARRANTY-003   # claim_date = warranty_end_date 仍在保固
  - BR-WARRANTY-004   # 收據 vs 建案資料庫衝突 → 採信建案
emits_events:
  - WarrantyClaimSubmitted
  - WarrantyClaimApproved
  - WarrantyClaimDenied
  - WarrantyClaimDisputed
nfr_flavored: false
priority: P1
tier: 2
owner: CSM / 客服主管
last_reviewed: 2026-05-28
related_adrs:
  - ADR-0035    # warranty-project-quote-policy
  - ADR-0044    # warranty-start-date-modes (REVIEW_REQUIRED)
legacy_id: REQ-015
trace_to_flow: F-015
last-synced-with: 4e9658e90324cbceb26f5e5445f481fc5678df1f
related:
  - "../../_source/01-workorder-erp.md#m13-保固"
---

# FR-0015 — 保固申訴受理

> **Migration**: 2026-05-28 改為 D5 殼結構（rule → BR）。

## §1 Use Case Skeleton

| 欄位 | 內容 |
|:-----|:-----|
| **Actor** | 客戶 (submit claim) / CSM (review) |
| **Secondary Actors** | M13 Warranty DB, M15 Exception |
| **Trigger** | 客戶在保固期內回報問題 |
| **Precondition** | claim_date ≤ warranty_end_date（[ref: BR-WARRANTY-003]） |
| **Main Flow** | 詳見 §1.1 → user-flow:S5-step1 |
| **Alternative Flow** | 詳見 §1.2 |
| **Postcondition** | warranty_claim row；emit `WarrantyClaimSubmitted` |

### §1.1 Main Flow

1. 客戶 LINE / Web 提交 claim → user-flow:S5-step1
2. 系統依 handover_date 計算 warranty status（[ref: BR-WARRANTY-001]）
3. 若仍在保固 → emit `WarrantyClaimSubmitted`
4. CSM review + 收據 vs 建案資料庫 cross-check
5. approve → emit `WarrantyClaimApproved` → 進 FR-0003 派工
6. END

### §1.2 Alternative Flow

```
A1. 收據 vs 建案資料庫衝突 (第 4 步):
    A1.1 採信建案資料庫 ([ref: BR-WARRANTY-004])

A2. AI 試圖自動報價 (任一步):
    A2.1 safety_gate 攔截 ([ref: BR-WARRANTY-002])
    A2.2 escalate CSM

A3. claim_date = warranty_end_date:
    A3.1 仍在保固 ([ref: BR-WARRANTY-003])

A4. Denied 後客戶爭議:
    A4.1 進 disputes 表 (FR-0013)
    A4.2 ops_manager 接手
    A4.3 emit `WarrantyClaimDisputed`
```

## §2 Acceptance Criteria

### AC-01: Happy path

```gherkin
Given handover_date = 2025-01-01, warranty 1 yr
When claim 2025-12-31
Then 仍在保固 + `WarrantyClaimApproved`
```

### AC-02: Boundary

```gherkin
When claim_date = warranty_end_date
Then 仍在保固
```

### AC-03: AI safety gate

```gherkin
When AI 嘗試自動報價保固
Then safety_gate 攔截 + escalate CSM
```

### AC-04: 收據衝突

```gherkin
Given 收據 vs 建案資料庫不一致
Then 採信建案
```

### AC-05: Dispute

```gherkin
Given claim denied
When 客戶爭議
Then 進 dispute 表 + `WarrantyClaimDisputed`
```

## §3 Reference Map

| 類型 | ID | 用途 |
|:-----|:---|:-----|
| BR | BR-WARRANTY-001~004 | start_date / AI ban / boundary / 衝突 |
| ADR | ADR-0035 | warranty quote policy |
| ADR | ADR-0044 | start date modes |
| Event | WarrantyClaim* | — |

## §4 Change Log

| Date | Change |
|:-----|:-------|
| 2026-05-10 | REQ-015→FR-0015 |
| 2026-05-28 | **D5 殼 rewrite** |
