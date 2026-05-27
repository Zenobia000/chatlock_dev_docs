---
id: FR-0005
title: 技師接單與出發回報
status: active
phase: I
mapped_to:
  - M07    # Workforce (primary - 技師動作)
  - M06    # Dispatch (狀態回寫)
superseded_clauses:
  - BR-M06-NN    # 接單 SLA (一般 10min / 急件 5min, ADR-0045 對齊)
  - BR-M07-NN    # 同時 push 雙 WO conflict resolution
  - BR-M07-NN    # LINE 未綁定 fallback SMS push
emits_events:
  - DispatchAccepted
  - DispatchDeclined
  - TechnicianDeparted     # 出發回報
nfr_flavored: false
priority: P0
tier: 2
owner: 派工主管 / 師傅管理
last_reviewed: 2026-05-28
related_adrs:
  - ADR-0045    # acceptance-sla-policy (10/5 min) — 主對齊
legacy_id: REQ-005
trace_to_flow: F-005
related:
  - "../../_source/01-workorder-erp.md#m07-師傅管理"
  - "../../_source/01-workorder-erp.md#m06-派工排程"
---

# FR-0005 — 技師接單與出發回報

> **B' 殼 (2026-05-28 D5)**：rule clause 搬 BR-M06-NN + BR-M07-NN；本檔僅保留 use case skeleton + acceptance G/W/T。
>
> **重要 SLA 邊界釐清**：本 FR 的接單 SLA 為 **push → accept ≤ 10 min（一般）/ 5 min（急件）**（per ADR-0045 = 新 spec P0）。**舊版 FR-0005「accept 後 30 min」已淘汰**，那 30min 是 FR-0003 §1.2 A4 的「reassign timeout」，不是接單 SLA。dispatch → arrival 整段的 SLA 為 ≤ 2hr soft（已搬 [NFR-SLA-001](../../architecture/nfr-matrix-smart-lock-saas.md#§2-availability--reliability)）。

## §1 Use Case Skeleton

| 欄位 | 內容 |
|:-----|:-----|
| **Actor** | 技師 (Locksmith / Technician) |
| **Secondary Actors** | Dispatch Engine, LINE push system, SMS fallback |
| **Trigger** | 技師收到 LINE push (來自 FR-0003 §1.1 第 7 步 / FR-0004 §1.1 第 10 步) |
| **Precondition** | 技師 active 且 LINE 帳號綁定（或 SMS fallback 可用）；WorkOrder status = "dispatched" 等待 accept |
| **Main Flow** | 詳見 §1.1 |
| **Alternative Flow** | 詳見 §1.2 |
| **Postcondition** | WorkOrder.assignment confirmed 或 reassigned；emit `DispatchAccepted` 或 `DispatchDeclined`；接單 SLA 達標 (≤ 10min / 急件 5min) |
| **Out-of-Scope** | dispatch 演算法 (FR-0003)；現場拍照 (FR-0006)；完工簽名 (FR-0009)；到場 SLA 2hr (NFR-SLA-001) |

### §1.1 Main Flow

1. 技師 LINE 收到 push (含 WorkOrder 摘要 + 1-click accept/decline 按鈕)
2. 技師在 APP 內 view 完整 WorkOrder 詳情
3. 技師按 "Accept" 按鈕
4. 系統檢查 SLA：push timestamp T0 → accept timestamp T_accept
   - 一般 case：T_accept - T0 ≤ 10 min ([ref: ADR-0045])
   - 急件 case：T_accept - T0 ≤ 5 min
5. 系統 update WorkOrder.assignment = confirmed
6. emit `DispatchAccepted`
7. 技師按 "出發" (depart) 按鈕（後續可隨時按）
8. emit `TechnicianDeparted`，開始 dispatch → arrival 2hr 計時 ([ref: NFR-SLA-001])
9. END：進 FR-0006 onsite-photo flow

### §1.2 Alternative Flow

```
A1. 技師按 "Decline" (第 3 步):
    A1.1 系統要求填 decline reason (required)
    A1.2 emit `DispatchDeclined` (含 reason)
    A1.3 進 FR-0003 §1.2 A4 reassign flow

A2. 30 min 邊界 — 接單 SLA 違反 (一般 case):
    A2.1 T_accept - T0 > 10 min → 視為超時
    A2.2 系統不接受 accept (return 410 Gone)
    A2.3 進 FR-0003 §1.2 A4 reassign flow
    A2.4 注意：此 10min 為**接單 SLA** ([ref: ADR-0045])，與 FR-0003 reassign 30min 是不同層次

A3. 急件 5min SLA 違反:
    A3.1 urgency in {locked_out, trapped, safety_risk, angry_customer}
    A3.2 T_accept - T0 > 5 min → 視為超時
    A3.3 同 A2.2-A2.3

A4. 同時 push 2 個 WO (race condition):
    A4.1 技師 LINE 收到 WO-001 + WO-002 同時
    A4.2 技師 accept WO-001
    A4.3 系統自動 decline WO-002 (return reason="technician_now_busy") ([ref: BR-M07-NN])
    A4.4 WO-002 進 FR-0003 §1.2 A4 reassign

A5. WO 已被 reassign 後技師才 accept (第 3 步晚到):
    A5.1 系統 check WorkOrder.assignment 已變更
    A5.2 回 409 already_reassigned
    A5.3 LINE 通知技師「該案已派給其他人」

A6. 技師 LINE 帳號未綁定 (第 1 步 push 階段):
    A6.1 系統 fallback 走 SMS push ([ref: BR-M07-NN])
    A6.2 SMS 內含 magic link 進 APP accept
    A6.3 SMS deliverability 失敗 → alert 派工主管走電話通知

A7. 技師接單但未按 "出發" (第 7 步停留過久):
    A7.1 30 min 後仍未 depart → alert 派工主管
    A7.2 60 min 後仍未 depart → 自動進 FR-0003 §1.2 A4 reassign + audit log

A8. 技師接單後 LINE app crash:
    A8.1 系統依 server 端 state 為準 (accept 已 commit)
    A8.2 技師重開 app → 看到 WorkOrder 仍 "已接單"
    A8.3 仍可按 "出發"
```

## §2 Acceptance Criteria (G/W/T)

### AC-01: Happy path — 一般 case 接單

```gherkin
Given 技師 "T-001" LINE 已綁定
  And 收到 WorkOrder "WO-001" push (urgency=normal, T0)
When T-001 在 T0+5min 按 Accept
Then 接單 SLA 達標 (≤ 10min) ([ref: ADR-0045])
  And WorkOrder.assignment = confirmed
  And event `DispatchAccepted` emit
```

### AC-02: 急件 5min SLA

```gherkin
Given 技師 "T-001" 收到 WorkOrder "WO-002" push (urgency=locked_out, T0)
When T-001 在 T0+4min 按 Accept
Then 急件接單 SLA 達標 (≤ 5min)

Given 同上
When T-001 在 T0+6min 才按 Accept
Then 系統回 410 Gone (急件 SLA 違反)
  And 進 reassign
```

### AC-03: 一般 case 10min SLA 違反

```gherkin
Given 技師 "T-001" 收到 WO-001 push (urgency=normal, T0)
When T-001 在 T0+11min 才按 Accept
Then 系統回 410 Gone
  And 不接受該 accept
  And 進 FR-0003 reassign
```

### AC-04: Decline + reason 必填

```gherkin
Given 技師 "T-001" 收到 push
When T-001 按 Decline
Then 系統要求填 decline reason
  And reason 為空 → 422 field_required

When T-001 填 reason="今日已滿單"
Then event `DispatchDeclined` emit (含 reason)
  And 進 reassign
```

### AC-05: 同時 push 2 WO race condition

```gherkin
Given 技師 "T-001" 同時收到 WO-001 + WO-002 push
When T-001 先 accept WO-001
Then WO-001 = confirmed
  And WO-002 系統自動 decline (reason="technician_now_busy") ([ref: BR-M07-NN])
  And WO-002 進 reassign
```

### AC-06: 已被 reassign 後才 accept

```gherkin
Given WO-001 已從 T-001 reassign 給 T-002
When T-001 才按 Accept (晚到)
Then 系統回 409 already_reassigned
  And LINE 通知 T-001「該案已派給其他人」
```

### AC-07: LINE 未綁定 → SMS fallback

```gherkin
Given 技師 "T-003" LINE 未綁定但 phone number 存在
When dispatch engine 發 push
Then 系統 fallback 走 SMS push ([ref: BR-M07-NN])
  And SMS 含 magic link
  And T-003 點 link 進 APP 可 accept
```

### AC-08: 接單後未出發 → 升 reassign

```gherkin
Given T-001 已 accept WO-001 (T_accept)
When T_accept+30min 仍未按 Depart
Then 系統 alert 派工主管

When T_accept+60min 仍未按 Depart
Then 系統自動進 FR-0003 §1.2 A4 reassign
  And audit log 寫入「technician_no_depart_60min」
```

## §3 Reference Map

| 類型 | ID | 用途 |
|:-----|:---|:-----|
| Business Rule | BR-M06-NN | 接單 SLA 10/5 min |
| Business Rule | BR-M07-NN | 雙 WO conflict / LINE fallback |
| ADR | ADR-0045 | acceptance-sla-policy (主對齊) |
| Domain Event | DispatchAccepted | WorkOrder confirmed |
| Domain Event | DispatchDeclined | reassign trigger |
| Domain Event | TechnicianDeparted | 2hr arrival SLA 計時起點 |
| NFR | NFR-SLA-001~003 | dispatch → arrival 2hr soft (FR-0016 migrated) |
| Source spec | `docs/_source/01-workorder-erp.md#m07-師傅管理` | M07 原始定義 |

## §4 Change Log

| Date | Change | Why |
|:-----|:-------|:----|
| 2026-05-10 | REQ-005→FR-0005 split | — |
| 2026-05-28 | **B' 殼 rewrite (D5)**：rule clause 搬 BR-M06-NN + BR-M07-NN；新增 frontmatter；補 §1 skeleton + 8 alt flow + 8 G/W/T AC；**修正 SLA 邊界**（舊「30min 接單」改成「10min 一般 / 5min 急件 per ADR-0045」；30min 是 FR-0003 reassign timeout 不是接單 SLA） | Roundtable 2026-05-27 D5 + new spec P0「接單 SLA 一般 10 分鐘，急件 5 分鐘」對齊 |
