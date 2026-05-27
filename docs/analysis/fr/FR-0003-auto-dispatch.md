---
id: FR-0003
title: 自動派工演算法（規則引擎）
status: active
phase: I
mapped_to:
  - M06   # Dispatch (primary)
  - M07   # Technician master (skill/rating)
  - M08   # Onsite (acceptance)
superseded_clauses:
  - BR-M06-01    # 5 因子權重 (distance+skill+rating+load+fairness)
  - BR-M06-02    # top-1 推薦 / 派工通知 timing
  - BR-M06-NN    # tie-breaker 6 級
  - BR-M06-NN    # 5/10/20km 候選擴大搜尋
  - BR-M06-NN    # 紅色警報權重覆寫 distance↓ rating↑
  - BR-M06-NN    # 全候選池空 fallback (dispatch_pending + alert)
emits_events:
  - DispatchProposed
  - DispatchPending
  - DispatchAutoReassigned
nfr_flavored: false
priority: P0
tier: 2
owner: 派工主管 / Backend
last_reviewed: 2026-05-28
related_adrs:
  - ADR-0022    # 派工/接單失敗 rollback (historical)
  - ADR-0034    # urgent red code definition
  - ADR-0045    # acceptance-sla-policy
legacy_id: REQ-003
trace_to_flow: F-003
last-synced-with: 4e9658e90324cbceb26f5e5445f481fc5678df1f
related:
  - "../../0-principles/id-mapping-legacy.md §A.3 (REQ→FR)"
  - "../../_source/01-workorder-erp.md#m06-派工"
---

# FR-0003 — 自動派工演算法（規則引擎）

> **Migration**: 2026-05-28 改為 D5 殼結構（rule → BR）。

## §1 Use Case Skeleton

| 欄位 | 內容 |
|:-----|:-----|
| **Actor** | System (Dispatch Engine) |
| **Secondary Actors** | M07 Technician master, M06 Dispatch queue, 派工主管 (audit / override) |
| **Trigger** | WorkOrder.status = `created` (來自 FR-0038 ConvertToWO) → 進 dispatch queue |
| **Precondition** | WO 已建立含 site/address；技師池可查；[ref: BR-M06-01] 5 因子權重 schema 有效 |
| **Main Flow** | 詳見 §1.1 → user-flow:S2-step1 |
| **Alternative Flow** | 詳見 §1.2 |
| **Postcondition** | top-1 技師收到派工通知（[ref: BR-M06-02] P95 ≤ 30s，紅色 ≤ 15s）；emit `DispatchProposed` |
| **Out-of-Scope** | 手動派工（FR-0004）；技師接單回應（FR-0005） |

### §1.1 Main Flow (atomic step → user-flow links)

1. WO event `WorkOrderCreated` 進 dispatch queue → user-flow:S2-step1
2. 系統依 [ref: BR-M06-NN 5km 候選池] 取候選技師 → user-flow:S2-step2
3. 系統依 [ref: BR-M06-01] 5 因子權重計算分數 (distance+skill+rating+load+fairness) → user-flow:S2-step3
4. 系統依 [ref: BR-M06-NN tie-breaker 6 級] 選 top-1 → user-flow:S2-step4
5. emit `DispatchProposed` 含 technician_id + score breakdown → user-flow:S2-step5
6. M16 推播給技師（[ref: FR-0005 technician-accept]）
7. END：postcondition 達成

### §1.2 Alternative Flow

```
A1. 5km 內 0 候選 (第 2 步):
    A1.1 擴大至 10km 重跑 §1.1 第 2-4 步
    A1.2 仍 0 候選 → 擴大至 20km
    A1.3 仍 0 候選 → emit `DispatchPending` + alert dispatch_officer ([ref: BR-M06-NN no-candidates fallback])

A2. 紅色警報 (urgent severity 來自 [ref: ADR-0034]):
    A2.1 權重覆寫：distance↓ rating↑ ([ref: BR-M06-NN urgent override])
    A2.2 重跑 §1.1 第 3-5 步

A3. 技師 30 min 未 accept (acceptance SLA 來自 [ref: ADR-0045]):
    A3.1 emit `DispatchAutoReassigned`
    A3.2 原技師 weight -10 (fairness 因子)
    A3.3 重跑 §1.1 第 2-5 步

A4. 5 技師同分 (第 4 步):
    A4.1 套 [ref: BR-M06-NN tie-breaker 6 級]：distance > rating > fairness > load > skill > wo_id hash
```

## §2 Acceptance Criteria (G/W/T)

### AC-01: Happy path — top-1 推薦 ≤ 30s

```gherkin
Given WO-001 已建立 (urgency="normal")
  And 5km 內有 3 名候選技師
When 系統執行 auto dispatch
Then top-1 技師收到通知 P95 ≤ 30s ([ref: BR-M06-02])
  And event `DispatchProposed` emit (含 score breakdown)
```

### AC-02: 紅色警報 ≤ 15s

```gherkin
Given WO-002 已建立 (urgency="locked_out")
When 系統執行 auto dispatch
Then 通知 P95 ≤ 15s
  And distance 權重↓ rating↑ ([ref: BR-M06-NN urgent override])
```

### AC-03: 5km 0 候選 → 擴大搜尋

```gherkin
Given WO-003 已建立 (5km 0 候選)
When 系統執行 auto dispatch
Then 系統擴大至 10km 重新查
  And 仍 0 → 擴大 20km
  And 仍 0 → emit `DispatchPending` + alert dispatch_officer
```

### AC-04: 30 min 未接 auto reassign

```gherkin
Given DispatchProposed 已 emit 30 min
  And 技師未 accept
When 系統 SLA timeout 觸發
Then emit `DispatchAutoReassigned`
  And 原技師 fairness weight -10
  And 重新選 top-1
```

### AC-05: tie-breaker 6 級

```gherkin
Given 5 名技師同分 12.5
When 系統執行 tie-breaker
Then 依序套 distance > rating > fairness > load > skill > wo_id hash ([ref: BR-M06-NN tie-breaker])
  And 取第一個分出勝負的因子
```

## §3 Reference Map

| 類型 | ID | 用途 |
|:-----|:---|:-----|
| Business Rule | BR-M06-01 | 5 因子權重 |
| Business Rule | BR-M06-02 | 派工通知 timing P95 ≤ 30s / 紅色 ≤ 15s |
| Business Rule | BR-M06-NN | tie-breaker 6 級 / 擴大搜尋 / urgent override / no-candidates fallback |
| ADR | ADR-0034 | urgent red code 4 類定義 |
| ADR | ADR-0045 | acceptance SLA |
| Domain Event | DispatchProposed | M07 technician notify, FR-0005 |
| Domain Event | DispatchPending | dispatch_officer alert |
| Domain Event | DispatchAutoReassigned | retry policy |
| Source spec | `docs/_source/01-workorder-erp.md#m06-派工` | M06 原始定義 |

## §4 Change Log

| Date | Change | Why |
|:-----|:-------|:----|
| 2026-05-10 | 從 north-star-requirements REQ-003→FR-0003 split | 4-digit FR ID 標準化 |
| 2026-05-28 | **D5 殼 rewrite**：rule clause 搬 BR-M06-NN；補 §1 skeleton + §1.2 alt flow + 5 條 G/W/T AC | Roundtable 2026-05-27 D5 |
