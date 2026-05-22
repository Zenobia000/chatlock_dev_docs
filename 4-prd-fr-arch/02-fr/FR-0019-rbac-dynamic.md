---
id: FR-0019
title: 動態 RBAC 角色管理
tier: 2
priority: P0
status: draft
blockers: [Q1=A, Q2=A]
lifecycle: pending-decision
last-synced-with: 4e9658e90324cbceb26f5e5445f481fc5678df1f
sync-source: doc
synced-at: 2026-05-15
legacy_id: REQ-019
trace_to_flow: F-019
related:
  - "../../0-principles/id-mapping-legacy.md §A.3 (REQ→FR)"
  - "../../0-principles/PRIN-0001-product-principles.md"
  - "../flows/business/"
  - "../api/openapi.yaml"
---

# FR-0019 — 動態 RBAC 角色管理

> 從 `docs/_flows-bdd-test/north-star-requirements.md REQ-019` 抽出，升級為 4-digit FR ID。

## §1 Description

動態 RBAC 角色管理

## §2 Priority

**P0** (Must-have for V1)

## §3 Acceptance Criteria

### §3.1 SLO（正常路徑）

7 種 system role × 8 維權限矩陣動態可配置，super_admin 不受限。

### §3.2 邊界案例

- Tenant 邊界：跨 tenant 操作 → 403 tenant_boundary_violation
- role 升級需更高 role 簽核（admin 不可升 super_admin）

### §3.3 異常處理

- Revoked token 嘗試呼叫 → 401 不洩漏 role/user_id
- DB seed role 缺失 → 服務啟動 fail-fast

### §3.4 TC Coverage

涵蓋之 TC（per `docs/2-contracts/test-cases/registry.yaml`）: IT-0045~0050 (rbac 6 cases), IT-0140 (review tenant boundary)

## §4 Trace

| Aspect | Reference |
| :-- | :-- |
| Legacy ID | REQ-019 |
| Legacy F-XXX flow | F-019 |
| Implementation status | ⚠ pending Q1=A / Q2=A |

## §5 Change Log

| Date | Change |
| :--- | :--- |
| 2026-05-10 | 從 north-star-requirements REQ-019→FR-0019 split |
