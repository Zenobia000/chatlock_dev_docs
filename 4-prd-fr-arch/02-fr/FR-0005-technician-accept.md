---
id: FR-0005
title: 技師接單與出發回報
tier: 2
priority: P0
status: active
last-synced-with: 4e9658e90324cbceb26f5e5445f481fc5678df1f
sync-source: doc
synced-at: 2026-05-15
legacy_id: REQ-005
trace_to_flow: F-005
related:
  - "../../0-principles/id-mapping-legacy.md §A.3 (REQ→FR)"
  - "../../0-principles/PRIN-0001-product-principles.md"
  - "../flows/business/"
  - "../api/openapi.yaml"
---

# FR-0005 — 技師接單與出發回報

> 從 `docs/_flows-bdd-test/north-star-requirements.md REQ-005` 抽出，升級為 4-digit FR ID。

## §1 Description

技師接單與出發回報

## §2 Priority

**P0** (Must-have for V1)

## §3 Acceptance Criteria

### §3.1 SLO（正常路徑）

技師收到 LINE push 後可在 APP 內 accept/decline；accept 後 30 min 內 SLA 視為達標。

### §3.2 邊界案例

- 30 min 邊界：T+30:00 accept 視為達標；T+30:01 視為逾時
- 技師同時 push 2 個 WO → 接單其中 1 個自動拒絕另一個

### §3.3 異常處理

- WO 已被 reassign 後技師才 accept → 409 already_reassigned
- 技師 LINE 帳號未綁定 → fallback SMS push

### §3.4 TC Coverage

涵蓋之 TC（per `docs/2-contracts/test-cases/registry.yaml`）: IT-0043 (auto-reassign timeout), IT-0117~0122 (realtime-messaging chat)

## §4 Trace

| Aspect | Reference |
| :-- | :-- |
| Legacy ID | REQ-005 |
| Legacy F-XXX flow | F-005 |
| Implementation status | ✅ Live |

## §5 Change Log

| Date | Change |
| :--- | :--- |
| 2026-05-10 | 從 north-star-requirements REQ-005→FR-0005 split |
