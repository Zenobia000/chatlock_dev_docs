---
id: FR-0009
title: 完工簽名 + 雙方確認
tier: 2
priority: P0
status: active
last-synced-with: 4e9658e90324cbceb26f5e5445f481fc5678df1f
sync-source: doc
synced-at: 2026-05-15
legacy_id: REQ-009
trace_to_flow: F-009
related:
  - "../../0-principles/id-mapping-legacy.md §A.3 (REQ→FR)"
  - "../../0-principles/PRIN-0001-product-principles.md"
  - "../flows/business/"
  - "../api/openapi.yaml"
---

# FR-0009 — 完工簽名 + 雙方確認

> 從 `docs/_flows-bdd-test/north-star-requirements.md REQ-009` 抽出，升級為 4-digit FR ID。

## §1 Description

完工簽名 + 雙方確認

## §2 Priority

**P0** (Must-have for V1)

## §3 Acceptance Criteria

### §3.1 SLO（正常路徑）

完工照片上傳 + LINE Flex Message 客戶點擊「確認完工」即完成 e-signature。

### §3.2 邊界案例

- 客戶 48h 未確認 → 自動標記 confirmed (per V1.0 規則)，audit 標 auto-confirmed
- 完工後再修改 → 拒絕，必須走 scope change 流程

### §3.3 異常處理

- 完工照不足 3 張 → 422 photo_count_insufficient
- 簽章 signatures.signature_data 缺欄位 → 422 invalid_signature

### §3.4 TC Coverage

涵蓋之 TC（per `docs/2-contracts/test-cases/registry.yaml`）: IT-0093~0094 (e-signature WORK_ORDER_COMPLETION), IT-0123~0124 (vision before/after photos)

## §4 Trace

| Aspect | Reference |
| :-- | :-- |
| Legacy ID | REQ-009 |
| Legacy F-XXX flow | F-009 |
| Implementation status | ✅ Live |

## §5 Change Log

| Date | Change |
| :--- | :--- |
| 2026-05-10 | 從 north-star-requirements REQ-009→FR-0009 split |
