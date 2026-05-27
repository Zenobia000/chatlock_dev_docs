---
id: FR-0004
title: 手動派工 + audit log
status: active
phase: I
mapped_to:
  - M06    # Dispatch (手動 override 入口)
  - M17    # Authorization / Audit (primary)
  - M15    # Exception (manual dispatch 是 exception path)
superseded_clauses:
  - BR-M06-NN    # manual override permission (support_agent only)
  - BR-M17-01    # 權限 4 維拆分 (can-view / can-edit / can-approve / audited)
  - BR-M17-NN    # audit log append-only + JSON + trace_id
  - BR-M17-NN    # audit transaction atomicity (寫失敗整 transaction rollback)
emits_events:
  - ManualDispatchAssigned
  - AuditLogWritten
  - DispatchOverridden    # 若 override 自動推薦
nfr_flavored: false
priority: P0
tier: 2
owner: 派工主管 / IT admin
last_reviewed: 2026-05-28
related_adrs:
  - ADR-0018    # pm-alignment-q6
  - ADR-0042    # rbac-four-tier-principle
  - ADR-0061    # data-governance-service-boundary
legacy_id: REQ-004
trace_to_flow: F-004
related:
  - "../../_source/01-workorder-erp.md#m06-派工排程"
  - "../../_source/01-workorder-erp.md#m17-auth-audit"
---

# FR-0004 — 手動派工 + audit log

> **B' 殼 (2026-05-28 D5)**：rule clause 搬 BR-M06-NN + BR-M17-NN；本檔僅保留 use case skeleton + acceptance G/W/T。

## §1 Use Case Skeleton

| 欄位 | 內容 |
|:-----|:-----|
| **Actor** | support_agent (客服 / 派工主管，依 ADR-0042 RBAC) |
| **Secondary Actors** | Dispatch Engine (recommendation 來源), Audit DB |
| **Trigger** | (a) FR-0003 進入 A3 (DispatchPending) 候選池空；OR (b) 派工主管主動 override 自動推薦 |
| **Precondition** | actor 具備 manual-dispatch permission ([ref: BR-M17-01 can-edit])；WorkOrder confirmed；目標技師存在於 M07 池內 |
| **Main Flow** | 詳見 §1.1 |
| **Alternative Flow** | 詳見 §1.2 |
| **Postcondition** | WorkOrder 指派完成；emit `ManualDispatchAssigned` + `AuditLogWritten`；audit log 含 actor / reason / original_recommendation |
| **Out-of-Scope** | 自動派工 (FR-0003)；技師接單流程 (FR-0005) |

### §1.1 Main Flow

1. support_agent 從 M06 dispatch panel 選定目標 WorkOrder
2. 系統顯示自動推薦 (top-3 from FR-0003)
3. support_agent 選擇強制指派目標技師 + 填 reason (required)
4. 系統開啟 DB transaction
5. 寫 WorkOrder.assignment 紀錄
6. 寫 audit log：actor / reason / original_recommendation / target_technician / timestamp ([ref: BR-M17-NN])
7. commit transaction
8. emit `ManualDispatchAssigned` + `AuditLogWritten`
9. 若 override 了自動推薦：emit `DispatchOverridden`
10. LINE push 給目標技師 (轉 FR-0005)
11. END：postcondition 達成

### §1.2 Alternative Flow

```
A1. actor 非 support_agent (任一步權限檢查):
    A1.1 [ref: BR-M17-01]：can-edit check 失敗
    A1.2 回 403 forbidden
    A1.3 記 audit log (failed access attempt)

A2. 缺 reason 欄位 (第 3 步):
    A2.1 回 422 field_required
    A2.2 提示「manual dispatch 必填 reason」

A3. audit DB 寫入失敗 (第 6 步):
    A3.1 整 DB transaction rollback ([ref: BR-M17-NN atomicity])
    A3.2 WorkOrder.assignment **不**建立
    A3.3 回 500，提示「audit 寫入失敗，請重試」
    A3.4 系統 alert IT admin（audit DB 不可用）

A4. 重複 manual-assign 同 ProblemCard / WorkOrder (第 5 步):
    A4.1 系統偵測 idempotency
    A4.2 回傳既有 WO assignment（不重複建記錄）
    A4.3 audit log 不重複寫

A5. 目標技師 stop_listed / suspended (第 5 步):
    A5.1 系統允許指派但 audit log highlight "OVERRIDE_TO_INELIGIBLE_TECHNICIAN"
    A5.2 emit `DispatchOverridden` reason="ineligible_technician_forced"
    A5.3 派工主管收 alert 知曉風險

A6. support_agent token revoked 中途 (transaction 進行中):
    A6.1 commit 前最後一次 auth check 失敗
    A6.2 整 transaction rollback
    A6.3 提示「token revoked，請重新登入」
```

## §2 Acceptance Criteria (G/W/T)

### AC-01: Happy path — 手動指派 + audit 寫入

```gherkin
Given support_agent "U-001" 具備 manual-dispatch permission
  And WorkOrder "WO-001" confirmed
  And 目標技師 "T-005" 存在
When U-001 強制指派 T-005 with reason="客戶指定該技師"
Then WorkOrder.assignment 建立 (technician=T-005)
  And audit log 寫入 (actor=U-001, reason="...", original_recommendation=[T-001, T-002, T-003])
  And event `ManualDispatchAssigned` emit
  And event `AuditLogWritten` emit
  And LINE push 已發送給 T-005
```

### AC-02: Audit DB 寫失敗 → 整 transaction rollback

```gherkin
Given support_agent 已開始手動指派 transaction
When audit DB 寫入時 5xx
Then 整 DB transaction rollback
  And WorkOrder.assignment **不**建立
  And 系統回 500 with "audit 寫入失敗"
  And IT admin 收到 alert
```

### AC-03: 缺 reason → 422

```gherkin
Given support_agent 嘗試手動指派
When 未填 reason 欄位
Then 系統回 422 field_required
  And 提示「manual dispatch 必填 reason」
```

### AC-04: 非 support_agent → 403

```gherkin
Given user "U-002" 角色為 "customer_service" (無 manual-dispatch permission)
When U-002 嘗試手動指派
Then 系統回 403 forbidden ([ref: BR-M17-01 can-edit])
  And audit log 記 failed access attempt
```

### AC-05: 重複指派同 PC → idempotency

```gherkin
Given WorkOrder "WO-001" 已被 U-001 手動指派 T-005
When U-001 重複觸發手動指派 (同 idempotency_key)
Then 回傳既有 assignment
  And 不重複寫 audit log
  And response status = 200
```

### AC-06: 指派 ineligible 技師 → 允許但 highlight

```gherkin
Given 目標技師 "T-009" status = "suspended"
When U-001 強制指派 T-009 with reason="緊急情況"
Then 系統允許指派 (override case)
  And audit log highlight "OVERRIDE_TO_INELIGIBLE_TECHNICIAN"
  And event `DispatchOverridden` reason="ineligible_technician_forced"
  And 派工主管 dashboard 收到 alert
```

### AC-07: Token revoked 中途

```gherkin
Given U-001 已開始手動指派 transaction
When transaction commit 前 U-001 的 token 被 IT admin revoke
Then 最後 auth check 失敗
  And 整 transaction rollback
  And 系統回 401 with "token revoked"
```

### AC-08: Audit log immutability

```gherkin
Given audit log "AL-001" 已寫入
When 任何 user (含 IT admin) 嘗試 UPDATE / DELETE AL-001
Then 系統拒絕 (append-only [ref: BR-M17-NN])
  And response status = 403
  And 此次嘗試本身也寫入新 audit log
```

## §3 Reference Map

| 類型 | ID | 用途 |
|:-----|:---|:-----|
| Business Rule | BR-M06-NN | manual override permission |
| Business Rule | BR-M17-01 | 權限 4 維拆分 |
| Business Rule | BR-M17-NN | audit append-only / atomicity |
| ADR | ADR-0018 | pm-alignment-q6 |
| ADR | ADR-0042 | RBAC 4 tier |
| ADR | ADR-0061 | data-governance-service-boundary |
| Domain Event | ManualDispatchAssigned | M19 BI |
| Domain Event | AuditLogWritten | M17 audit dashboard |
| Domain Event | DispatchOverridden | M19 BI override frequency analytics |
| Source spec | `docs/_source/01-workorder-erp.md#m17-auth-audit` | M17 原始定義 |

## §4 Change Log

| Date | Change | Why |
|:-----|:-------|:----|
| 2026-05-10 | REQ-004→FR-0004 split | — |
| 2026-05-28 | **B' 殼 rewrite (D5)**：rule clause 搬 BR-M06-NN + BR-M17-NN；新增 frontmatter；補 §1 skeleton + 6 alt flow + 8 G/W/T AC（含 audit immutability test） | Roundtable 2026-05-27 D5 |
