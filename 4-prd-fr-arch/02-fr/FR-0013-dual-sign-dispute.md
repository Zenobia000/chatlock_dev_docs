---
id: FR-0013
title: 對帳爭議雙簽
tier: 2
priority: P0
status: active
blockers: [Q2=A, Q4=C]
lifecycle: pending-decision
last-synced-with: 4e9658e90324cbceb26f5e5445f481fc5678df1f
sync-source: doc
synced-at: 2026-05-15
legacy_id: REQ-013
trace_to_flow: F-013
related:
  - "../../0-principles/id-mapping-legacy.md §A.3 (REQ→FR)"
  - "../../0-principles/PRIN-0001-product-principles.md"
  - "../flows/business/"
  - "../api/openapi.yaml"
---

# FR-0013 — 對帳爭議雙簽

> 從 `docs/_flows-bdd-test/north-star-requirements.md REQ-013` 抽出，升級為 4-digit FR ID。

## §1 Description

對帳爭議雙簽

## §2 Priority

**P0** (Must-have for V1)

## §3 Acceptance Criteria

### §3.1 SLO（正常路徑）

Disputes 進雙簽流程，CSM + operations_manager 共識才能 close。

### §3.2 邊界案例

- 60 天未解決 → 自動升 operations_director
- 客戶撤銷 dispute → 標 closed_withdrawn

### §3.3 異常處理

- 單方 close 嘗試 → 409 dual_sign_required
- 已 close 的 dispute 再 open → 必須新建 dispute_v2 引用前一個

### §3.4 TC Coverage

涵蓋之 TC（per `docs/2-contracts/test-cases/registry.yaml`）: IT-0052 (雙簽流程 250k), IT-0134 (warranty disputes 進入)

## §4 Trace

| Aspect | Reference |
| :-- | :-- |
| Legacy ID | REQ-013 |
| Legacy F-XXX flow | F-013 |
| Implementation status | ✅ pending Q2=A / Q4=C |

## §5 Change Log

| Date | Change |
| :--- | :--- |
| 2026-05-10 | 從 north-star-requirements REQ-013→FR-0013 split |
