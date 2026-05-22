---
id: FR-0003
title: 自動派工演算法（規則引擎）
tier: 2
priority: P0
status: draft
lifecycle: in-dev
last-synced-with: 4e9658e90324cbceb26f5e5445f481fc5678df1f
sync-source: doc
synced-at: 2026-05-15
legacy_id: REQ-003
trace_to_flow: F-003
related:
  - "../../0-principles/id-mapping-legacy.md §A.3 (REQ→FR)"
  - "../../0-principles/PRIN-0001-product-principles.md"
  - "../flows/business/"
  - "../api/openapi.yaml"
---

# FR-0003 — 自動派工演算法（規則引擎）

> 從 `docs/_flows-bdd-test/north-star-requirements.md REQ-003` 抽出，升級為 4-digit FR ID。

## §1 Description

自動派工演算法（規則引擎）

## §2 Priority

**P0** (Must-have for V1)

## §3 Acceptance Criteria

### §3.1 SLO（正常路徑）

派工演算法依 5 因子權重 (distance+skill+rating+load+fairness) 推薦 top-1 技師，建立到派工通知 P95 ≤ 30s（紅色警報 ≤ 15s）。

### §3.2 邊界案例

- 5km 內 0 候選 → 3 輪擴大搜尋（5/10/20km）
- 5 技師同分 → 6 級 tie-breaker（distance>rating>fairness>load>skill>wo_id hash）
- 紅色警報 (urgent severity) → 權重覆寫 distance↓ rating↑

### §3.3 異常處理

- 全候選池空 → 進 dispatch_pending + alert dispatch_officer (ADR-0022)
- 技師 30 min 未 accept → auto reassign + 原技師 weight -10

### §3.4 TC Coverage

涵蓋之 TC（per `docs/2-contracts/test-cases/registry.yaml`）: IT-0039~0044 (dispatch-engine 6 cases), IT-0087~0092 (dispatch-engine-weights 5 因子)

## §4 Trace

| Aspect | Reference |
| :-- | :-- |
| Legacy ID | REQ-003 |
| Legacy F-XXX flow | F-003 |
| Implementation status | 🚧 In Dev |

## §5 Change Log

| Date | Change |
| :--- | :--- |
| 2026-05-10 | 從 north-star-requirements REQ-003→FR-0003 split |
