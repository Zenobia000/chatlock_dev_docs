---
id: FR-0020
title: 稽核日誌完整性與匯出
status: active
phase: I
mapped_to:
  - M17    # Audit (primary)
superseded_clauses:
  - BR-M17-NN    # append-only + hash chain
  - BR-M17-NN    # 7 yr retention
  - BR-M17-NN    # 匯出 PDF / CSV
  - BR-M17-NN    # 匯出 audit access
emits_events:
  - AuditLogExported
  - AuditTamperDetected
nfr_flavored: false
priority: P0
tier: 2
owner: IT admin / 法務
last_reviewed: 2026-05-28
related_adrs:
  - ADR-0061    # data-governance-service-boundary
  - ADR-VCH-002  # 7y retention
legacy_id: REQ-020
trace_to_flow: F-020
last-synced-with: 4e9658e90324cbceb26f5e5445f481fc5678df1f
related:
  - "../../_source/01-workorder-erp.md#m17-audit"
---

# FR-0020 — 稽核日誌完整性與匯出

> **Migration**: 2026-05-28 改為 D5 殼結構（rule → BR）。

## §1 Use Case Skeleton

| 欄位 | 內容 |
|:-----|:-----|
| **Actor** | IT admin / 法務 |
| **Secondary Actors** | M17 Audit ledger, Nightly verify cron |
| **Trigger** | Manual export / nightly verify |
| **Precondition** | RBAC `audit.export` |
| **Main Flow** | 詳見 §1.1 → user-flow:S5-step20 |
| **Alternative Flow** | 詳見 §1.2 |
| **Postcondition** | 匯出檔案 / hash chain verify pass |

### §1.1 Main Flow

1. Admin 選日期範圍 + 匯出格式 (PDF/CSV)
2. 系統 verify hash chain integrity (per row)
3. 匯出 file
4. emit `AuditLogExported` (本動作也寫 audit)
5. END

### §1.2 Alternative Flow

```
A1. Hash chain mismatch (verify 失敗):
    A1.1 emit `AuditTamperDetected`
    A1.2 alert IT admin + 法務
    A1.3 匯出附 tamper warning

A2. UPDATE/DELETE attempt on audit (任一時間):
    A2.1 DB trigger 拒絕 (append-only)
    A2.2 此嘗試本身寫 audit

A3. 缺 export permission:
    A3.1 403 forbidden + audit

A4. > 7 yr 資料 query:
    A4.1 回 410 gone (已 lifecycle 清除)
```

## §2 Acceptance Criteria

### AC-01: Happy path 匯出

```gherkin
When admin 匯出 2025 全年 audit
Then 系統 verify hash chain pass
  And 匯出 PDF
  And `AuditLogExported` emit
```

### AC-02: Hash chain mismatch

```gherkin
Given audit row 被竄改
When verify
Then `AuditTamperDetected` emit + alert
```

### AC-03: UPDATE 拒絕

```gherkin
When 任何 user UPDATE audit row
Then DB trigger 拒絕
  And 此嘗試本身寫 audit
```

### AC-04: 7y boundary

```gherkin
When query 7 yr + 1 day 前 audit
Then 410 gone (lifecycle 已清)
```

## §3 Reference Map

| 類型 | ID | 用途 |
|:-----|:---|:-----|
| BR | BR-M17-NN | append-only / 7y / export / hash chain |
| ADR | ADR-0061 | data governance |
| ADR | ADR-VCH-002 | 7y retention |
| Event | AuditLogExported / AuditTamperDetected | — |

## §4 Change Log

| Date | Change |
|:-----|:-------|
| 2026-05-10 | REQ-020→FR-0020 |
| 2026-05-28 | **D5 殼 rewrite** |
