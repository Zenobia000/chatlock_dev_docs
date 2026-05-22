---
id: FR-0016
title: SLA 2hr 到場（Soft 警報）
tier: 2
priority: P0
status: active
blockers: [Q5=B]
lifecycle: partial
lifecycle-reason: "Q5=B Soft SLA"
last-synced-with: 4e9658e90324cbceb26f5e5445f481fc5678df1f
sync-source: doc
synced-at: 2026-05-15
legacy_id: REQ-016
trace_to_flow: F-016
related:
  - "../../0-principles/id-mapping-legacy.md §A.3 (REQ→FR)"
  - "../../0-principles/PRIN-0001-product-principles.md"
  - "../flows/business/"
  - "../api/openapi.yaml"
---

# FR-0016 — SLA 2hr 到場（Soft 警報）

> 從 `docs/_flows-bdd-test/north-star-requirements.md REQ-016` 抽出，升級為 4-digit FR ID。

## §1 Description

SLA 2hr 到場（Soft 警報）

## §2 Priority

**P0** (Must-have for V1)

## §3 Acceptance Criteria

### §3.1 SLO（正常路徑）

派工到技師抵達 > 2hr → dashboard 標紅 + push operations_manager；V1.0 不賠償（per ADR-0013/0022）。

### §3.2 邊界案例

- T+2:00:00 邊界尚可接受；T+2:00:01 進入 breach
- 技師主動回報延遲（含理由）→ alert 不發但仍標 breached

### §3.3 異常處理

- Dashboard widget 標紅但 push 失敗 → retry queue + email fallback
- operations_manager 離線 → 升 operations_director

### §3.4 TC Coverage

涵蓋之 TC（per `docs/2-contracts/test-cases/registry.yaml`）: IT-0062 (F-110 SLA breach 紅色警報), IT-0057~0061 (sla-monitor 其他 5 case)

## §4 Trace

| Aspect | Reference |
| :-- | :-- |
| Legacy ID | REQ-016 |
| Legacy F-XXX flow | F-016 |
| Implementation status | ⚠ partial（Q5=B Soft SLA） |

## §5 Change Log

| Date | Change |
| :--- | :--- |
| 2026-05-10 | 從 north-star-requirements REQ-016→FR-0016 split |
