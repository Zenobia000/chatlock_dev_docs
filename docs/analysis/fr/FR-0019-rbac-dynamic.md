---
id: FR-0019
title: 動態 RBAC 角色管理
status: draft
phase: I
mapped_to:
  - M17    # Authorization (primary)
  - M18    # System Setup
superseded_clauses:
  - BR-M17-NN    # 4 維權限 (view/edit/approve/audited)
  - BR-M17-NN    # role assignment audit log
  - BR-M17-NN    # SCD2 (role 變更歷史)
emits_events:
  - RoleAssigned
  - RoleRevoked
  - PermissionChanged
nfr_flavored: false
priority: P0
tier: 2
owner: IT admin / 主管
last_reviewed: 2026-05-28
related_adrs:
  - ADR-0042    # rbac-four-tier-principle
legacy_id: REQ-019
trace_to_flow: F-019
last-synced-with: 4e9658e90324cbceb26f5e5445f481fc5678df1f
related:
  - "../../_source/01-workorder-erp.md#m17-authorization"
---

# FR-0019 — 動態 RBAC 角色管理

> **Migration**: 2026-05-28 改為 D5 殼結構（rule → BR）。

## §1 Use Case Skeleton

| 欄位 | 內容 |
|:-----|:-----|
| **Actor** | IT admin / 主管 |
| **Secondary Actors** | M17 Auth, M18 System Setup |
| **Trigger** | Admin Console 新增 / 修改 / 撤銷 role |
| **Precondition** | Actor 有 `rbac.admin` permission |
| **Main Flow** | 詳見 §1.1 → user-flow:S5-step10 |
| **Alternative Flow** | 詳見 §1.2 |
| **Postcondition** | role 變更 + audit row + emit event |

### §1.1 Main Flow

1. Admin 開 RBAC console
2. 新增 / 修改 / 撤銷 role + permissions
3. 系統依 4 維（view/edit/approve/audited）驗證（[ref: BR-M17-NN]）
4. 寫 SCD2 history
5. emit `RoleAssigned` / `RoleRevoked` / `PermissionChanged`
6. END

### §1.2 Alternative Flow

```
A1. 缺 rbac.admin permission:
    A1.1 403 forbidden + audit

A2. 撤銷後 user 仍在 active session:
    A2.1 active session 立即 invalidate (next request 401)

A3. SCD2 conflict:
    A3.1 DB unique constraint 拒絕重複生效時段
```

## §2 Acceptance Criteria

### AC-01: 新增 role

```gherkin
When IT admin 新增 role "Junior CS" + 4 維權限
Then SCD2 寫入 + `RoleAssigned` emit
```

### AC-02: 撤銷 active session invalidate

```gherkin
Given user U-001 active session
When admin revoke U-001 role
Then 下次 request 401
```

### AC-03: 缺 admin permission

```gherkin
When 客服嘗試改 role
Then 403 + audit
```

### AC-04: SCD2 history 可查

```gherkin
Given role 變更過 3 次
When query 歷史
Then 回傳 3 row 含 valid_from / valid_to
```

## §3 Reference Map

| 類型 | ID | 用途 |
|:-----|:---|:-----|
| BR | BR-M17-NN | 4 維權限 / audit / SCD2 |
| ADR | ADR-0042 | RBAC 4 tier |
| Event | RoleAssigned/Revoked/PermissionChanged | — |

## §4 Change Log

| Date | Change |
|:-----|:-------|
| 2026-05-10 | REQ-019→FR-0019 |
| 2026-05-28 | **D5 殼 rewrite** |
