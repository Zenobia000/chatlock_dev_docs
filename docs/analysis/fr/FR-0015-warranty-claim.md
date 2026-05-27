---
id: FR-0015
title: 保固申訴受理（3-mode start_date + RMA 重算 + B2B 覆寫 + Phase I 整機）
status: active
phase: I
mapped_to:
  - M13    # Warranty
  - M15    # Exception
  - M02    # Master (BOM 階層)
superseded_clauses:
  - BR-WARRANTY-001    # 起算日 3 mode (install_date / handover_date / brand_warranty_date)
  - BR-WARRANTY-002    # AI 禁止自動報價
  - BR-WARRANTY-003    # claim_date = warranty_end_date 仍在保固
  - BR-WARRANTY-004    # 收據 vs 建案資料庫衝突 → 採信建案
  - BR-WARRANTY-005    # RMA 後重算（被修延長 + 新零件 90 天獨立）
  - BR-WARRANTY-006    # B2B 合約覆寫（PDF + L3 approve + audit + 5 yr 上限）
  - BR-WARRANTY-007    # Phase I 整機 1 年，BOM 階層留 Phase II
emits_events:
  - WarrantyClaimSubmitted
  - WarrantyClaimApproved
  - WarrantyClaimDenied
  - WarrantyClaimDisputed
  - WarrantyB2BOverride
  - WarrantyRecalculatedAfterRMA
nfr_flavored: false
priority: P1
tier: 2
owner: CSM / 客服主管
last_reviewed: 2026-05-28
related_adrs:
  - ADR-0035    # warranty-project-quote-policy
  - ADR-0044    # warranty-start-date-modes v2 (PARTIAL_UPDATE 2026-05-28)
legacy_id: REQ-015
trace_to_flow: F-015
last-synced-with: 4e9658e90324cbceb26f5e5445f481fc5678df1f
related:
  - "../../_source/01-workorder-erp.md#m13-保固"
---

# FR-0015 — 保固申訴受理

> **Migration**: 2026-05-28 D5 殼 + 3-mode start_date + RMA 重算 + B2B 覆寫 + Phase I 整機（ADR-0044 v2 PARTIAL_UPDATE）。

## §1 Use Case Skeleton

| 欄位 | 內容 |
|:-----|:-----|
| **Actor** | 客戶 (submit claim) / CSM (review) / ops_manager (B2B override approver) |
| **Secondary Actors** | M13 Warranty DB, M15 Exception, M02 BOM |
| **Trigger** | 客戶在保固期內回報問題 OR RMA 後重算 OR B2B 客戶 negotiate 覆寫 |
| **Precondition** | claim_date ≤ effective warranty_end_date（[ref: BR-WARRANTY-003]） |
| **Main Flow** | §1.1 |
| **Alternative Flow** | §1.2 |
| **Postcondition** | warranty_claim row；emit 對應 event |

### §1.1 Main Flow

1. 客戶 LINE / Web 提交 claim → user-flow:S5-step1
2. 系統依 case_type 決定 start_date mode（[ref: BR-WARRANTY-001]）：
   - 零售 → `install_date`
   - 建商 → `handover_date`
   - 品牌指定 → `brand_warranty_date`
3. 計算 effective warranty_end_date：
   - Phase I default = start_date + 365 day (整機, [ref: BR-WARRANTY-007])
   - 若有 B2B override → 以 negotiated_date 為主（[ref: BR-WARRANTY-006]）
   - 若有 RMA history → 延長被修期間 + 新零件 part-level 90 天（[ref: BR-WARRANTY-005]）
4. 若 claim_date ≤ effective_end_date → emit `WarrantyClaimSubmitted`
5. CSM review + 收據 vs 建案資料庫 cross-check（[ref: BR-WARRANTY-004]）
6. approve → emit `WarrantyClaimApproved` → 進 FR-0003 派工
7. END

### §1.2 Alternative Flow

```
A1. 收據 vs 建案資料庫衝突 (step 5):
    A1.1 採信建案資料庫 ([ref: BR-WARRANTY-004])

A2. AI 試圖自動報價 (任一步):
    A2.1 safety_gate 攔截 ([ref: BR-WARRANTY-002])
    A2.2 escalate CSM

A3. claim_date = warranty_end_date (step 4):
    A3.1 仍在保固 ([ref: BR-WARRANTY-003])

A4. RMA 後再 claim (重算 path):
    A4.1 整機 end_date = original_end + (rma_return - rma_send) days
    A4.2 新換零件 part_id 獨立 90 天
    A4.3 emit `WarrantyRecalculatedAfterRMA`
    → BR-WARRANTY-005

A5. B2B 客戶 negotiate 覆寫 (建立 / 修改 path):
    A5.1 上傳合約 PDF (≤ 20MB, retention ≥ 5 yr)
    A5.2 ops_manager (L3+) approve
    A5.3 audit log (who/when/原值/新值/合約ref)
    A5.4 保固期上限 5 yr
    A5.5 emit `WarrantyB2BOverride`
    → BR-WARRANTY-006

A6. Phase II 升維 part-level (rollout path):
    A6.1 走 BR-M18-04 staged rollout
    A6.2 BOM table part_id / part_category 自 Phase I 預留欄位讀取
    → BR-WARRANTY-007

A7. Denied 後客戶爭議:
    A7.1 進 disputes 表 (FR-0013)
    A7.2 ops_manager 接手
    A7.3 emit `WarrantyClaimDisputed`
```

## §2 Acceptance Criteria

### AC-01: 零售 install_date 起算

```gherkin
Given case_type = retail, install_date = 2026-01-01
When claim 2026-12-31
Then mode = install_date, end_date = 2027-01-01
  And 仍在保固 + `WarrantyClaimApproved`
  → BR-WARRANTY-001, 007
```

### AC-02: 建商 handover_date 起算

```gherkin
Given case_type = project, handover_date = 2026-03-15
When claim 2027-03-14
Then mode = handover_date, end_date = 2027-03-15
  And 仍在保固
  → BR-WARRANTY-001
```

### AC-03: 品牌 brand_warranty_date 起算

```gherkin
Given case_type = brand_warranty, brand_warranty_date = 2026-02-01
When claim 2026-08-01
Then mode = brand_warranty_date
  And 走品牌 SLA 期長
  → BR-WARRANTY-001
```

### AC-04: Boundary 同日仍在保固

```gherkin
When claim_date = warranty_end_date
Then 仍在保固
  → BR-WARRANTY-003
```

### AC-05: AI safety gate

```gherkin
When AI 嘗試自動報價保固
Then safety_gate 攔截 + escalate CSM
  → BR-WARRANTY-002
```

### AC-06: 收據 vs 建案衝突採建案

```gherkin
Given 收據 install_date = 2026-01-01, 建案 handover_date = 2026-03-15
When case_type = project
Then 採信建案 handover_date
  → BR-WARRANTY-004
```

### AC-07: RMA 被修期間延長

```gherkin
Given original_end = 2027-01-01, rma_send = 2026-06-10, rma_return = 2026-06-25
When 重算
Then new_end = 2027-01-01 + 15 days = 2027-01-16
  And emit `WarrantyRecalculatedAfterRMA`
  → BR-WARRANTY-005
```

### AC-08: RMA 新零件 part-level 90 天

```gherkin
Given RMA 換新馬達 part_id = P-MOTOR-007, rma_return = 2026-06-25
When 重算
Then part-level new_end (P-MOTOR-007) = 2026-09-23 (90 day)
  And 原機 end_date 延續 AC-07 規則
  → BR-WARRANTY-005
```

### AC-09: B2B 合約覆寫 4 條件 AND

```gherkin
Given B2B 客戶申請覆寫至 3 年
When 上傳合約 PDF + L3 approve + audit + 期長 ≤ 5 yr
Then 通過 + emit `WarrantyB2BOverride`
  → BR-WARRANTY-006
```

### AC-10: B2B 覆寫期長 > 5 yr 拒絕

```gherkin
Given B2B 客戶申請覆寫 6 yr
Then 422 max_warranty_exceeded (上限 5 yr)
  → BR-WARRANTY-006
```

### AC-11: B2B 覆寫缺合約 PDF 拒絕

```gherkin
Given B2B 覆寫提交無 PDF
Then 422 contract_pdf_required
  → BR-WARRANTY-006
```

### AC-12: Phase I 整機 1 年 default

```gherkin
Given Phase I, case_type = retail, install_date = 2026-01-01
When 無 B2B override AND 無 RMA
Then warranty_scope = unit, end_date = 2027-01-01
  → BR-WARRANTY-007
```

### AC-13: Phase I BOM 階層欄位預留

```gherkin
Given Phase I 智慧鎖 BOM
Then BOM row 必須有 part_id / part_category / part_warranty_months 欄位
  And 欄位 Phase I 可為 NULL
  → BR-WARRANTY-007
```

### AC-14: Dispute

```gherkin
Given claim denied
When 客戶爭議
Then 進 dispute 表 + `WarrantyClaimDisputed`
```

## §3 Reference Map

| 類型 | ID | 用途 |
|:-----|:---|:-----|
| BR | BR-WARRANTY-001 | 起算日 3-mode |
| BR | BR-WARRANTY-002 | AI ban |
| BR | BR-WARRANTY-003 | boundary inclusive |
| BR | BR-WARRANTY-004 | 收據衝突採建案 |
| BR | BR-WARRANTY-005 | **RMA 重算** |
| BR | BR-WARRANTY-006 | **B2B 覆寫** |
| BR | BR-WARRANTY-007 | **Phase I 整機 + BOM 階層** |
| ADR | ADR-0035 | warranty quote policy |
| ADR | ADR-0044 v2 | start date modes + RMA + B2B + Phase strategy |
| Event | WarrantyClaim* / B2BOverride / RecalculatedAfterRMA | — |

## §4 Change Log

| Date | Change |
|:-----|:-------|
| 2026-05-10 | REQ-015→FR-0015 |
| 2026-05-28 | D5 殼 rewrite |
| 2026-05-28 | **3-mode start_date + RMA 重算 + B2B 覆寫 + Phase I 整機 acceptance**（套 BR-WARRANTY-005~007，新增 8 個 AC 對齊 spec install/handover/brand_warranty 用語）by value-decisions Q5-Q7 |
