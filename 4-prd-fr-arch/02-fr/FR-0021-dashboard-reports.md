---
id: FR-0021
title: Dashboard / 報表（KPI / Revenue / Tech ranking）
tier: 2
priority: P1
status: active
lifecycle: partial
lifecycle-reason: "後端 filter TODO"
last-synced-with: 4e9658e90324cbceb26f5e5445f481fc5678df1f
sync-source: doc
synced-at: 2026-05-15
legacy_id: REQ-021
trace_to_flow: F-021
related:
  - "../../0-principles/id-mapping-legacy.md §A.3 (REQ→FR)"
  - "../../0-principles/PRIN-0001-product-principles.md"
  - "../flows/business/"
  - "../api/openapi.yaml"
---

# FR-0021 — Dashboard / 報表（KPI / Revenue / Tech ranking）

> 從 `docs/_flows-bdd-test/north-star-requirements.md REQ-021` 抽出，升級為 4-digit FR ID。

## §1 Description

Dashboard / 報表（KPI / Revenue / Tech ranking）

## §2 Priority

**P1** (Should-have)

## §3 Acceptance Criteria

### §3.1 SLO（正常路徑）

Dashboard 即時顯示 KPI（uptime, dispatch SLA, complaint rate），5s 內更新。

### §3.2 邊界案例

- Tier-1 uptime 99.5% 邊界視為達標
- 報表查詢過去 1 年 → 分頁 + 快取（5 min stale OK）

### §3.3 異常處理

- 資料來源（DB）不可用 → 顯示 stale 但標時間戳
- 前端 polling 失敗 → 重連 + degraded indicator

### §3.4 TC Coverage

涵蓋之 TC（per `docs/2-contracts/test-cases/registry.yaml`）: IT-0057~0062 (sla-monitor uptime 計算), IT-0086 (financial reports export)

## §4 Trace

| Aspect | Reference |
| :-- | :-- |
| Legacy ID | REQ-021 |
| Legacy F-XXX flow | F-021 |
| Implementation status | ⚠ partial（後端 filter TODO） |

## §5 Change Log

| Date | Change |
| :--- | :--- |
| 2026-05-10 | 從 north-star-requirements REQ-021→FR-0021 split |
