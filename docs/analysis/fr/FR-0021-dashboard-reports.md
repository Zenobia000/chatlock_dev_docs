---
id: FR-0021
title: Dashboard / 報表（KPI / Revenue / Tech ranking）
status: active
phase: I
mapped_to:
  - M19    # BI / Dashboard
superseded_clauses:
  - BR-M19-NN    # KPI / Revenue / Tech ranking 三類
  - BR-M19-NN    # date range filter
  - BR-M19-NN    # role-based dashboard scope (主管 vs 技師)
emits_events:
  - ReportGenerated
nfr_flavored: false
priority: P1
tier: 2
owner: 數據分析 / 主管
last_reviewed: 2026-05-28
related_adrs: []
legacy_id: REQ-021
trace_to_flow: F-021
last-synced-with: 4e9658e90324cbceb26f5e5445f481fc5678df1f
related:
  - "../../_source/01-workorder-erp.md#m19-bi"
---

# FR-0021 — Dashboard / 報表（KPI / Revenue / Tech ranking）

> **Migration**: 2026-05-28 改為 D5 殼結構（rule → BR）。

## §1 Use Case Skeleton

| 欄位 | 內容 |
|:-----|:-----|
| **Actor** | 主管 / 派工主管 / 財務 |
| **Secondary Actors** | M19 BI engine |
| **Trigger** | Admin Console 開 dashboard |
| **Precondition** | RBAC dashboard.view |
| **Main Flow** | 詳見 §1.1 → user-flow:S5-step30 |
| **Alternative Flow** | 詳見 §1.2 |
| **Postcondition** | render dashboard / export report |

### §1.1 Main Flow

1. Actor 選 dashboard category (KPI / Revenue / Tech ranking) + date range
2. 系統依 role scope filter ([ref: BR-M19-NN])
3. 系統 query BI engine
4. render dashboard / export CSV
5. emit `ReportGenerated`
6. END

### §1.2 Alternative Flow

```
A1. 缺 dashboard.view permission:
    A1.1 403 + audit

A2. Date range > 1 yr:
    A2.1 系統 reject + 提示「分段查詢」

A3. BI engine timeout:
    A3.1 回 503 + retry hint
```

## §2 Acceptance Criteria

### AC-01: 主管看全公司

```gherkin
Given 主管 role
When 開 Tech ranking
Then 看到全公司 ranking
```

### AC-02: 技師只看自己

```gherkin
Given 技師 role
When 開 KPI dashboard
Then 只看自己 KPI
```

### AC-03: Date range filter

```gherkin
When 選 date range 2026-01 ~ 2026-03
Then 報表只含該區間
```

### AC-04: Export CSV

```gherkin
When tap "export"
Then 下載 CSV + `ReportGenerated` emit
```

## §3 Reference Map

| 類型 | ID | 用途 |
|:-----|:---|:-----|
| BR | BR-M19-NN | KPI/Revenue/Ranking / range filter / role scope |
| Event | ReportGenerated | audit |

## §4 Change Log

| Date | Change |
|:-----|:-------|
| 2026-05-10 | REQ-021→FR-0021 |
| 2026-05-28 | **D5 殼 rewrite** |
