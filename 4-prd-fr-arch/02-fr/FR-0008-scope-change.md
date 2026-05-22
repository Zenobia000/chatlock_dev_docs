---
id: FR-0008
title: Scope Change 流程（增項 / 改價）
tier: 2
priority: P1
status: draft
blockers: [Q9=B]
lifecycle: pending-decision
last-synced-with: 4e9658e90324cbceb26f5e5445f481fc5678df1f
sync-source: doc
synced-at: 2026-05-15
legacy_id: REQ-008
trace_to_flow: F-008
related:
  - "../../0-principles/id-mapping-legacy.md §A.3 (REQ→FR)"
  - "../../0-principles/PRIN-0001-product-principles.md"
  - "../flows/business/"
  - "../api/openapi.yaml"
---

# FR-0008 — Scope Change 流程（增項 / 改價）

> 從 `docs/_flows-bdd-test/north-star-requirements.md REQ-008` 抽出，升級為 4-digit FR ID。

## §1 Description

Scope Change 流程（增項 / 改價）

## §2 Priority

**P1** (Should-have)

## §3 Acceptance Criteria

### §3.1 SLO（正常路徑）

現場範圍變更需客戶 LINE 確認新報價後才繼續，audit 完整保留 before/after。

### §3.2 邊界案例

- 客戶 30 min 未回覆 → 暫停施工 + 通知 admin
- scope change ≥ 50% 原價 → 強制 admin 簽核（不可僅客戶同意）

### §3.3 異常處理

- 客戶 reject scope change → 工單暫停，安排技師撤離
- 範圍變更後 idempotency_key 重複 → 不重複建記錄

### §3.4 TC Coverage

涵蓋之 TC（per `docs/2-contracts/test-cases/registry.yaml`）: IT-0117~0122 (realtime-messaging chat 中 admin 發更新報價), IT-0093~0098 (e-signature 客戶 LINE 確認)

## §4 Trace

| Aspect | Reference |
| :-- | :-- |
| Legacy ID | REQ-008 |
| Legacy F-XXX flow | F-008 |
| Implementation status | ⚠ pending Q9=B |

## §5 Change Log

| Date | Change |
| :--- | :--- |
| 2026-05-10 | 從 north-star-requirements REQ-008→FR-0008 split |
