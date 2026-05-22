---
id: FR-0020
title: 稽核日誌完整性與匯出
tier: 2
priority: P0
status: active
last-synced-with: 4e9658e90324cbceb26f5e5445f481fc5678df1f
sync-source: doc
synced-at: 2026-05-15
legacy_id: REQ-020
trace_to_flow: F-020
related:
  - "../../0-principles/id-mapping-legacy.md §A.3 (REQ→FR)"
  - "../../0-principles/PRIN-0001-product-principles.md"
  - "../flows/business/"
  - "../api/openapi.yaml"
---

# FR-0020 — 稽核日誌完整性與匯出

> 從 `docs/_flows-bdd-test/north-star-requirements.md REQ-020` 抽出，升級為 4-digit FR ID。

## §1 Description

稽核日誌完整性與匯出

## §2 Priority

**P0** (Must-have for V1)

## §3 Acceptance Criteria

### §3.1 SLO（正常路徑）

7 種 audit event 依保留期限（90d / 1y / 2y / 7y）可匯出。Append-only 強制 DB trigger。

### §3.2 邊界案例

- 保留期限到期當天仍可查；翌日 cleanup job 標 deleted
- 並發寫入（μs 級）UUID 唯一防衝突

### §3.3 異常處理

- DELETE/UPDATE audit_logs → DB trigger raise + audit tamper_attempt
- Audit DB 連線失效 → 整 transaction rollback

### §3.4 TC Coverage

涵蓋之 TC（per `docs/2-contracts/test-cases/registry.yaml`）: IT-0069~0074 (audit-logger 6 cases), IT-0081~0086 (data-export)

## §4 Trace

| Aspect | Reference |
| :-- | :-- |
| Legacy ID | REQ-020 |
| Legacy F-XXX flow | F-020 |
| Implementation status | ✅ Live |

## §5 Change Log

| Date | Change |
| :--- | :--- |
| 2026-05-10 | 從 north-star-requirements REQ-020→FR-0020 split |
