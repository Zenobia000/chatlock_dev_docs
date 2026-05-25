---
id: FR-0010
title: 改約 / 延遲通知（V1.0 LINE only）
tier: 2
priority: P1
status: active
blockers: [Q8=A]
lifecycle: pending-decision
last-synced-with: 4e9658e90324cbceb26f5e5445f481fc5678df1f
sync-source: doc
synced-at: 2026-05-15
legacy_id: REQ-010
trace_to_flow: F-010
related:
  - "../../0-principles/id-mapping-legacy.md §A.3 (REQ→FR)"
  - "../../0-principles/PRIN-0001-product-principles.md"
  - "../flows/business/"
  - "../api/openapi.yaml"
---

# FR-0010 — 改約 / 延遲通知（V1.0 LINE only）

> 從 `docs/_flows-bdd-test/north-star-requirements.md REQ-010` 抽出，升級為 4-digit FR ID。

## §1 Description

改約 / 延遲通知（V1.0 LINE only）

## §2 Priority

**P1** (Should-have)

## §3 Acceptance Criteria

### §3.1 SLO（正常路徑）

技師可發起 reschedule，客戶 LINE 確認新時段；延遲 > 2h 觸發 SLA soft alert (per FR-0016)。

### §3.2 邊界案例

- 客戶拒絕新時段 → 進入 dispatch_pending 重新派工
- 同 WO 多次 reschedule → ≤ 3 次，第 4 次強制 admin 介入

### §3.3 異常處理

- 原排程 < 30 min 才 reschedule → 算技師失約 (penalty -5 weight)
- 技師單方面取消無通知 → 自動 reassign + 客訴流程

### §3.4 TC Coverage

涵蓋之 TC（per `docs/2-contracts/test-cases/registry.yaml`）: IT-0062 (sla-monitor F-110 SLA breach), IT-0095 (digital signature for new time)

## §4 Trace

| Aspect | Reference |
| :-- | :-- |
| Legacy ID | REQ-010 |
| Legacy F-XXX flow | F-010 |
| Implementation status | ✅ pending Q8=A |

## §5 Change Log

| Date | Change |
| :--- | :--- |
| 2026-05-10 | 從 north-star-requirements REQ-010→FR-0010 split |
