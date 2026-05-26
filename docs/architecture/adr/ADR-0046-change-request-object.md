---
id: ADR-0046
title: ChangeRequest 物件化 — apply → approve → effective_date → audit
status: accepted
date: 2026-05-21
source_trade_off: §F.3 AI-017 PAIN-POINTS-SUMMARY-2026-05-21.md
deciders: [業主]
accepted_date: 2026-05-22
related:
  - 01-workorder-erp-final-spec-20260520.xlsx#sheet-18 (AI-017)
  - 01-workorder-erp-final-spec-20260520.xlsx (M18 System Admin)
  - "./ADR-0042-rbac-four-tier-principle.md"
pre_mortem: F4 (合規崩潰) + F5 (規模困境)
eternal_transient: Eternal Process (B3)
---

# ADR-0046 — ChangeRequest 物件化

## Status
Draft

## Context

價格、權限、SLA、模板、AI SOP 等系統設定變更，目前散落各處（後台 UI / 直接改 DB / 口頭通知）。沒有 change governance 會在 Phase II Finance 啟動後立即崩潰：「上週改的價格是誰核准的？」「這條 SOP 何時生效？」

源自 Excel-01 sheet 18 AI-017；M18 System Admin。

## Decision（推薦）

**ChangeRequest 為 §B3 一級業務物件**，所有系統設定 / 政策 / 價格 / 權限變更走此 workflow：

```yaml
change_request:
  id: <uuid>
  type: enum [price, permission, sla, template, ai_sop, contract, ...]
  scope: <target_object_id + field_path>
  before: <current_value>
  after: <proposed_value>
  rationale: <text>
  requester: <user_id>
  approvers: [<required_role_list>]
  state: enum [draft, pending_approval, approved, effective, rejected, retired]
  effective_date: <date>
  audit_trail: [event_list]
  rollback_plan: <text>
```

四步流程：
1. **apply**：requester 提出 + rationale
2. **approve**：依 type 與金額決定 approver chain（與 ADR-0040/0042 整合）
3. **effective_date**：approve 後排程生效（可預約未來日期）
4. **audit**：所有狀態變更進 audit trail，永久留證

## Alternatives Considered

### Option A — 走 Git PR 流程
- 風險：F4（非業務角色友善）
- 客服主管 / 會計無法直接操作

### Option B — 純口頭 + Slack
- 風險：F4 嚴重
- 治理斷鏈，無 audit trail

## Consequences

**Positive**：
- 所有政策 / 價格變更可追溯
- 與 ADR-0040 退款分層、ADR-0042 RBAC 整合（誰可核准什麼）
- effective_date 支援預約生效（避開週末 / 月底）

**Negative**：
- ChangeRequest UI 需建（中等開發成本）
- 變更速度比直接 hack DB 慢（這是 feature，不是 bug）

**Mitigation**：
- 緊急變更走 emergency track（主管 + IT 雙簽 + 即時生效，但 audit 強制留）
- ChangeRequest UI 設計優先（業務角色易用）

## Pre-mortem Mapping

對應 §A F4 + F5。Change governance 是合規必要；無此物件 → Phase II 一啟動就亂。

## Eternal/Transient Classification

- **Eternal**：§B3 ChangeRequest 物件 + workflow engine
- **Transient**：UI 實作（§C5）

## Acceptance Criteria
- [ ] 業主圈選：**✅ 推薦** / Option A / Option B
- [ ] IT + 主管簽核 ChangeRequest schema
- [ ] Backend 實作 ChangeRequest CRUD + state machine
- [ ] ChangeRequest UI 給業務角色（非 IT 操作）
- [ ] 與 RBAC / Refund / Pricing 整合
- [ ] BI 報表「ChangeRequest 流量 by type」

## See also
- §F.3 AI-017 PAIN-POINTS-SUMMARY-2026-05-21.md
- Excel-01 sheet 18 / M18 System Admin
- ADR-0040 退款核准（金額分層 → approver chain）
- ADR-0042 RBAC 4 層
- ADR-0043 Contract Template（合約變更走 ChangeRequest）
- ADR-0038 SOP 審核（AI SOP 走 ChangeRequest 子流程）

---

## Supersedes / Updates

- **Superseded in part by ADR-0065 (lookup table migration, 2026-05-26)**：`change_request.type` 欄位 schema 由 enum 改為 FK to `change_request_type_dim` lookup table（4-phase dual-write migration）。其他部分（state machine / approval workflow / audit trail）仍 active。詳見 ADR-0065 §3 migration plan + §5 supersedes pointer。
