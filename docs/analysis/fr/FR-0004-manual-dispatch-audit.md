---
id: FR-0004
title: 手動派工 + audit log
tier: 2
priority: P0
status: draft
blockers: [Q1=A, Q6=A]
lifecycle: pending-decision
last-synced-with: 4e9658e90324cbceb26f5e5445f481fc5678df1f
sync-source: doc
synced-at: 2026-05-15
legacy_id: REQ-004
trace_to_flow: F-004
related:
  - "../../0-principles/id-mapping-legacy.md §A.3 (REQ→FR)"
  - "../../0-principles/PRIN-0001-product-principles.md"
  - "../flows/business/"
  - "../api/openapi.yaml"
---

# FR-0004 — 手動派工 + audit log

> 從 `docs/_flows-bdd-test/north-star-requirements.md REQ-004` 抽出，升級為 4-digit FR ID。

## §1 Description

手動派工 + audit log

## §2 Priority

**P0** (Must-have for V1)

## §3 Acceptance Criteria

### §3.1 SLO（正常路徑）

support_agent 可繞過自動派工，強制寫 audit log 含 actor/reason/original_recommendation (ADR-0018)。

### §3.2 邊界案例

- audit DB 寫入失敗 → 整 transaction rollback，WorkOrder 不建立
- 重複 manual-assign 同 problem_card → 冪等回傳既有 wo

### §3.3 異常處理

- actor 角色非 support_agent → 403 forbidden
- 缺 reason 欄位 → 422 field_required

### §3.4 TC Coverage

涵蓋之 TC（per `docs/2-contracts/test-cases/registry.yaml`）: IT-0048 (rbac bypass audit), IT-0073 (audit DB rollback), IT-0049 (revoke token)

## §4 Trace

| Aspect | Reference |
| :-- | :-- |
| Legacy ID | REQ-004 |
| Legacy F-XXX flow | F-004 |
| Implementation status | ⚠ pending Q1=A / Q6=A |

## §5 Change Log

| Date | Change |
| :--- | :--- |
| 2026-05-10 | 從 north-star-requirements REQ-004→FR-0004 split |
