---
id: FR-0015
title: 保固申訴受理
tier: 2
priority: P1
status: active
last-synced-with: 4e9658e90324cbceb26f5e5445f481fc5678df1f
sync-source: doc
synced-at: 2026-05-15
legacy_id: REQ-015
trace_to_flow: F-015
related:
  - "../../0-principles/id-mapping-legacy.md §A.3 (REQ→FR)"
  - "../../0-principles/PRIN-0001-product-principles.md"
  - "../flows/business/"
  - "../api/openapi.yaml"
---

# FR-0015 — 保固申訴受理

> 從 `docs/_flows-bdd-test/north-star-requirements.md REQ-015` 抽出，升級為 4-digit FR ID。

## §1 Description

保固申訴受理

## §2 Priority

**P1** (Should-have)

## §3 Acceptance Criteria

### §3.1 SLO（正常路徑）

保固索賠以 handover_date 起算（非 purchase_date，per BR-WARRANTY-001）；AI 禁止自動報價（per BR-WARRANTY-002）。

### §3.2 邊界案例

- claim_date = warranty_end_date 視為仍在保固
- 收據與建案資料庫衝突 → 採信建案資料庫 (BR-WARRANTY-004)

### §3.3 異常處理

- AI 嘗試自動報價保固 → safety_gate 攔截 + escalate CSM
- denied 後消費者爭議 → 進 disputes 表，operations_manager 接手

### §3.4 TC Coverage

涵蓋之 TC（per `docs/2-contracts/test-cases/registry.yaml`）: IT-0129~0134 (warranty-claim 6 cases)

## §4 Trace

| Aspect | Reference |
| :-- | :-- |
| Legacy ID | REQ-015 |
| Legacy F-XXX flow | F-015 |
| Implementation status | ✅ Live |

## §5 Change Log

| Date | Change |
| :--- | :--- |
| 2026-05-10 | 從 north-star-requirements REQ-015→FR-0015 split |
