---
id: ADR-0018
title: 客服繞過自動派工
status: accepted
date: 2026-05-07
deciders: [PM, Tech Lead, QA Lead]
legacy_id: PM-Q6
supersedes: []
superseded_by: []
related:
  - "../0-principles/id-mapping-legacy.md §A.6 (PM Q → ADR)"
  - "_pending-split-pm-alignment-Q1-Q10.md (原始決策矩陣)"
---

> 
> **🔄 Migration Status (2026-05-28)**: `HISTORICAL`
> **Reviewed against**: 2026-05-20 final spec (xlsx)
> **Reviewed on**: 2026-05-28
> **Per ADR-0100 §1 classification** (.claude/context/devteam/meetings/2026-05-27-1130-final-spec-migration-strategy/MoM.md)


# ADR-0018 — 客服繞過自動派工

## Status

**Accepted** (拍板於 2026-05-07，作為 PM Q1-Q10 90 分鐘對齊會議產物)

## Decision

**A 允許但需強制 audit log**

## Context, Options, Consequences (從 PM 決策矩陣 §7 摘錄)

## 7. Q6 — 客服可否手動繞過自動派工？

### 業務脈絡

F-004 客服在自動派工跑完後，能否「跳過 best match，指定特定技師」？是否需要雙簽？

### 影響流程

- F-004 手動派工
- F-019 RBAC（指派權限）

### 候選方案


| 選項                     | 說明                    | 治理   | 風險          |
| ---------------------- | --------------------- | ---- | ----------- |
| **A. 可繞過 + audit log** | 客服直接指派；自動寫稽核          | 事後追蹤 | 客服偏袒 / 串通   |
| **B. 雙簽繞過**            | 客服指派需 Manager approve | 預防偏袒 | UX 慢、緊急場景卡住 |
| **C. 不可繞過**（V1.0）      | 必須走自動派工，例外走 escalate  | 最嚴   | 緊急場景無解      |


### 推薦預設

**A — 可繞過 + audit log**。理由：

1. F-016 SLA 緊急場景需要客服快速指派（不能等 Manager）
2. audit log 已是基礎建設（[[02-design/specs/audit-log-spec]]），事後可查
3. 偏袒問題用月度 audit report 監控（管理問題，不是技術問題）

### 反向選項後果

- B：F-016 緊急派工卡住 → SLA 破線率上升
- C：必須建 escalate-to-customer-service flow，工作量 +2 dev-day

### PM 決策

```
[ ] A — 可繞過 + audit log
[ ] B — 雙簽繞過
[ ] C — 不可繞過（V1.0）

理由：__________________________________
拍板日期：______________
拍板人：______________
```

### 拍板後續更新

- `api/services/dispatch_service.py`：manualAssign 是否需 second_actor
- `api/tests/`：加 `test_manual_dispatch.py`
- `docs/_flows-bdd-test/v-model-left/E5x--workflow-dispatch.md` §手動派工

---
