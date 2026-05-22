---
id: FR-0012
title: 技師月結撥款（V1.0 升級！）
tier: 2
priority: P0
status: draft
blockers: [Q7=B]
lifecycle: blocked
lifecycle-reason: "Q7=B"
last-synced-with: 4e9658e90324cbceb26f5e5445f481fc5678df1f
sync-source: doc
synced-at: 2026-05-15
legacy_id: REQ-012
trace_to_flow: F-012
related:
  - "../../0-principles/id-mapping-legacy.md §A.3 (REQ→FR)"
  - "../../0-principles/PRIN-0001-product-principles.md"
  - "../flows/business/"
  - "../api/openapi.yaml"
---

# FR-0012 — 技師月結撥款（V1.0 升級！）

> 從 `docs/_flows-bdd-test/north-star-requirements.md REQ-012` 抽出，升級為 4-digit FR ID。

## §1 Description

技師月結撥款（V1.0 升級！）

## §2 Priority

**P0** (Must-have for V1)

## §3 Acceptance Criteria

### §3.1 SLO（正常路徑）

月結 cron 每月 1 日 02:00 跑齊，技師應收=收現金-公司應扣材料費，自動匯款。

### §3.2 邊界案例

- 材料費 > 收款金額 → 技師應付公司差額 (negative settlement)
- 月結期間 disputes 未結 → 該 wo 不入當月結算

### §3.3 異常處理

- 匯款 API 失敗 3 次 → alert finance + 標 manual_payout
- settlement 衝突（同 wo 雙重計算）→ DB unique constraint 拒絕

### §3.4 TC Coverage

涵蓋之 TC（per `docs/2-contracts/test-cases/registry.yaml`）: IT-0070 (financial_action 7-year retention), IT-0086 (financial export PDF)

## §4 Trace

| Aspect | Reference |
| :-- | :-- |
| Legacy ID | REQ-012 |
| Legacy F-XXX flow | F-012 |
| Implementation status | ⚠ blocked（Q7=B） |

## §5 Change Log

| Date | Change |
| :--- | :--- |
| 2026-05-10 | 從 north-star-requirements REQ-012→FR-0012 split |
