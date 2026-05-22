---
id: FR-0011
title: 消費者付款（V1.0 升級！）
tier: 2
priority: P0
status: draft
blockers: [Q7=B]
lifecycle: blocked
lifecycle-reason: "Q7=B 待 provider 選型"
last-synced-with: 4e9658e90324cbceb26f5e5445f481fc5678df1f
sync-source: doc
synced-at: 2026-05-15
legacy_id: REQ-011
trace_to_flow: F-011
related:
  - "../../0-principles/id-mapping-legacy.md §A.3 (REQ→FR)"
  - "../../0-principles/PRIN-0001-product-principles.md"
  - "../flows/business/"
  - "../api/openapi.yaml"
---

# FR-0011 — 消費者付款（V1.0 升級！）

> 從 `docs/_flows-bdd-test/north-star-requirements.md REQ-011` 抽出，升級為 4-digit FR ID。

## §1 Description

消費者付款（V1.0 升級！）

## §2 Priority

**P0** (Must-have for V1)

## §3 Acceptance Criteria

### §3.1 SLO（正常路徑）

客戶現金 / Apple Pay / Line Pay 三軌支付，技師收款後即時更新 wo.payment_status。

### §3.2 邊界案例

- Line Pay 失敗 fallback 現金 → audit 完整記錄兩次嘗試
- 金額 < 1000 不可分期；≥ 50000 強制要求收據簽章

### §3.3 異常處理

- Line Pay webhook 重送 → 冪等不重複扣款
- 現金收款 dispute → 進 disputes 表 + 警示主管

### §3.4 TC Coverage

涵蓋之 TC（per `docs/2-contracts/test-cases/registry.yaml`）: IT-0051~0056 (refund-service flow), IT-0093~0098 (e-signature high-amount)

## §4 Trace

| Aspect | Reference |
| :-- | :-- |
| Legacy ID | REQ-011 |
| Legacy F-XXX flow | F-011 |
| Implementation status | ⚠ blocked（Q7=B 待 provider 選型） |

## §5 Change Log

| Date | Change |
| :--- | :--- |
| 2026-05-10 | 從 north-star-requirements REQ-011→FR-0011 split |
