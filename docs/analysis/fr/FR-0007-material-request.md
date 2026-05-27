---
id: FR-0007
title: 材料申請與庫存扣減
status: active
phase: I
mapped_to:
  - M10    # Inventory (primary)
  - M08    # Onsite (consumption trigger)
superseded_clauses:
  - BR-M10-NN    # 實時扣庫存
  - BR-M10-NN    # reorder_point 通知 warehouse_admin
  - BR-M10-NN    # 退料還原庫存 + net_consumption 計算
  - BR-M10-NN    # DB row lock (並發保護)
emits_events:
  - MaterialRequested
  - MaterialConsumed
  - InventoryBelowReorderPoint
  - MaterialReturned
nfr_flavored: false
priority: P1
tier: 2
owner: 庫管 / Backend
last_reviewed: 2026-05-28
related_adrs:
  - ADR-0052    # material-ownership-field
  - ADR-0053    # serial-control-policy
legacy_id: REQ-007
trace_to_flow: F-007
last-synced-with: 4e9658e90324cbceb26f5e5445f481fc5678df1f
related:
  - "../../_source/01-workorder-erp.md#m10-庫存"
---

# FR-0007 — 材料申請與庫存扣減

> **Migration**: 2026-05-28 改為 D5 殼結構（rule → BR）。

## §1 Use Case Skeleton

| 欄位 | 內容 |
|:-----|:-----|
| **Actor** | 技師 (consume) / 庫管 (replenish) |
| **Secondary Actors** | M10 Inventory, M11 Costing, warehouse_admin |
| **Trigger** | 技師於現場填材料請領單 / 退料 |
| **Precondition** | WO `accepted`；item 在 inventory；技師有 consume permission |
| **Main Flow** | 詳見 §1.1 → user-flow:S2-step14 |
| **Alternative Flow** | 詳見 §1.2 |
| **Postcondition** | inventory.quantity 更新；wo.net_consumption 累加；emit `MaterialConsumed` |
| **Out-of-Scope** | 採購 (PO)；庫存盤點 |

### §1.1 Main Flow

1. 技師 APP 內填材料請領（item_id, quantity, wo_id 必填）→ user-flow:S2-step14
2. 系統取得 DB row lock for item ([ref: BR-M10-NN concurrency])
3. 檢查庫存 sufficient（quantity ≥ requested）
4. 扣庫存（real-time）
5. 寫 wo.material_consumption JSONB
6. emit `MaterialRequested` + `MaterialConsumed`
7. 若 quantity < reorder_point → emit `InventoryBelowReorderPoint` + 通知 warehouse_admin
8. END

### §1.2 Alternative Flow

```
A1. 庫存不足 (第 3 步):
    A1.1 回 409 insufficient_inventory
    A1.2 不扣庫存
    A1.3 提示「請聯絡庫管」

A2. 缺 wo_id (第 1 步):
    A2.1 回 422 field_required
    A2.2 不寫請領

A3. 退料 (alternative trigger):
    A3.1 技師選 "退料" → quantity, item_id
    A3.2 系統還原庫存
    A3.3 wo.net_consumption 扣減
    A3.4 emit `MaterialReturned`

A4. 並發請領 (race):
    A4.1 DB row lock 序列化
    A4.2 第二筆等 lock release
    A4.3 重新檢查庫存 + 扣減
```

## §2 Acceptance Criteria (G/W/T)

### AC-01: Happy path 扣庫存

```gherkin
Given 技師 T-001 在 WO-001
  And item-A quantity = 10
When T-001 請領 item-A x 3
Then inventory.quantity = 7
  And wo.net_consumption[item-A] = 3
  And event `MaterialConsumed` emit
```

### AC-02: 庫存不足

```gherkin
Given item-A quantity = 1
When T-001 請領 item-A x 2
Then 系統回 409 insufficient_inventory
  And inventory 不變
```

### AC-03: reorder_point 通知

```gherkin
Given item-A reorder_point = 5, quantity = 7
When T-001 請領 item-A x 3
Then inventory = 4 (< reorder_point)
  And event `InventoryBelowReorderPoint` emit
  And warehouse_admin 收通知
```

### AC-04: 退料還原

```gherkin
Given WO-001 net_consumption[item-A] = 3
When T-001 退料 item-A x 1
Then inventory += 1
  And wo.net_consumption[item-A] = 2
  And event `MaterialReturned` emit
```

### AC-05: 並發 row lock

```gherkin
Given item-A quantity = 5
When T-001 與 T-002 同時請領 item-A x 3
Then DB row lock 序列化
  And 一筆成功 (quantity 2)
  And 另一筆 409 insufficient (檢查 lock 後再算)
```

## §3 Reference Map

| 類型 | ID | 用途 |
|:-----|:---|:-----|
| Business Rule | BR-M10-NN | 實時扣庫存 / reorder / concurrency / 退料 |
| ADR | ADR-0052 | 庫存歸屬 |
| ADR | ADR-0053 | serial control |
| Domain Event | MaterialRequested | costing |
| Domain Event | MaterialConsumed | wo.cost |
| Domain Event | InventoryBelowReorderPoint | warehouse |
| Domain Event | MaterialReturned | reconciliation |
| Source spec | `docs/_source/01-workorder-erp.md#m10-庫存` | M10 原始定義 |

## §4 Change Log

| Date | Change | Why |
|:-----|:-------|:----|
| 2026-05-10 | REQ-007→FR-0007 split | — |
| 2026-05-28 | **D5 殼 rewrite**：rule clause 搬 BR-M10-NN；補 §1 skeleton + 4 alt + 5 AC | Roundtable 2026-05-27 D5 |
