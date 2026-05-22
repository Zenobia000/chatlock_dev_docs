---
id: FR-0006
title: 到場拍照存證
tier: 2
priority: P0
status: active
last-synced-with: 4e9658e90324cbceb26f5e5445f481fc5678df1f
sync-source: doc
synced-at: 2026-05-15
legacy_id: REQ-006
trace_to_flow: F-006
related:
  - "../../0-principles/id-mapping-legacy.md §A.3 (REQ→FR)"
  - "../../0-principles/PRIN-0001-product-principles.md"
  - "../flows/business/"
  - "../api/openapi.yaml"
---

# FR-0006 — 到場拍照存證

> 從 `docs/_flows-bdd-test/north-star-requirements.md REQ-006` 抽出，升級為 4-digit FR ID。

## §1 Description

到場拍照存證

## §2 Priority

**P0** (Must-have for V1)

## §3 Acceptance Criteria

### §3.1 SLO（正常路徑）

技師現場拍照前後各 ≥ 3 張上傳 GCS，wo.photos JSONB 含完整 metadata。

### §3.2 邊界案例

- 10MB 邊界接受；10.1MB 拒絕 413
- 非 JPG/PNG 拒絕並提示格式

### §3.3 異常處理

- GCS 上傳失敗 → 重試 3 次，仍失敗則保留 base64 於 local queue 待後續同步
- 完工後 2 年照片自動 GCS lifecycle 刪除

### §3.4 TC Coverage

涵蓋之 TC（per `docs/2-contracts/test-cases/registry.yaml`）: IT-0123~0128 (vision-processing 6 cases), IT-0111~0116 (proactive-photo-guidance)

## §4 Trace

| Aspect | Reference |
| :-- | :-- |
| Legacy ID | REQ-006 |
| Legacy F-XXX flow | F-006 |
| Implementation status | ✅ Live |

## §5 Change Log

| Date | Change |
| :--- | :--- |
| 2026-05-10 | 從 north-star-requirements REQ-006→FR-0006 split |
