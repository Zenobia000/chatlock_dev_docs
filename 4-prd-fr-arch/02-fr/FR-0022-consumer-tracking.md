---
id: FR-0022
title: 消費者端工單追蹤（LINE + Web 並存）
tier: 2
priority: P1
status: draft
blockers: [Q3=C]
lifecycle: blocked
lifecycle-reason: "Q3=C 待補 Web token + BDD"
last-synced-with: 4e9658e90324cbceb26f5e5445f481fc5678df1f
sync-source: doc
synced-at: 2026-05-15
legacy_id: REQ-022
trace_to_flow: F-022
related:
  - "../../0-principles/id-mapping-legacy.md §A.3 (REQ→FR)"
  - "../../0-principles/PRIN-0001-product-principles.md"
  - "../flows/business/"
  - "../api/openapi.yaml"
---

# FR-0022 — 消費者端工單追蹤（LINE + Web 並存）

> 從 `docs/_flows-bdd-test/north-star-requirements.md REQ-022` 抽出，升級為 4-digit FR ID。

## §1 Description

消費者端工單追蹤（LINE + Web 並存）

## §2 Priority

**P1** (Should-have)

## §3 Acceptance Criteria

### §3.1 SLO（正常路徑）

LINE 用戶「查工單」intent + Web HMAC token 雙軌共存 (Q3=C)；PII 自動遮罩。

### §3.2 邊界案例

- HMAC token 7 天 TTL；過期回 410
- LINE user 未綁定 customer → 提示輸入手機號碼

### §3.3 異常處理

- Token 簽章被竄改 → 403 + audit tamper
- 查無 wo → 不洩漏「存在但不可見」vs「不存在」差異

### §3.4 TC Coverage

涵蓋之 TC（per `docs/2-contracts/test-cases/registry.yaml`）: IT-0075~0080 (consumer-tracking 6 cases)

## §4 Trace

| Aspect | Reference |
| :-- | :-- |
| Legacy ID | REQ-022 |
| Legacy F-XXX flow | F-022 |
| Implementation status | ⚠ blocked（Q3=C 待補 Web token + BDD） |

## §5 Change Log

| Date | Change |
| :--- | :--- |
| 2026-05-10 | 從 north-star-requirements REQ-022→FR-0022 split |
