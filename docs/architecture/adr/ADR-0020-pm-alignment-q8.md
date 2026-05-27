---
id: ADR-0020
title: 非 LINE 用戶 fallback
status: accepted
date: 2026-05-07
deciders: [PM, Tech Lead, QA Lead]
legacy_id: PM-Q8
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


# ADR-0020 — 非 LINE 用戶 fallback

## Status

**Accepted** (拍板於 2026-05-07，作為 PM Q1-Q10 90 分鐘對齊會議產物)

## Decision

**A LINE Push real impl + retry**

## Context, Options, Consequences (從 PM 決策矩陣 §9 摘錄)

## 9. Q8 — 非 LINE 用戶 fallback？

### 業務脈絡

若客戶報修管道不是 LINE（電話 / 現場）—V1.0 是否要受理？

### 影響流程

- F-001 LINE 報修 → ProblemCard
- F-010 改約 / 延遲通知

### 候選方案


| 選項                        | 說明                   | 測試範圍                 | 業務影響        |
| ------------------------- | -------------------- | -------------------- | ----------- |
| **A. 拒收**（V1.0 only LINE） | 電話 / 現場 → 請客戶加 LINE  | 縮減                   | 流失非 LINE 客戶 |
| **B. 客服手動建單**             | 電話來 → 客服輸入到 admin 後台 | 加 admin create-PC UI | 多 5 dev-day |
| **C. SMS 雙向**（V1.5+）      | 整合 SMS provider      | 加 SMS test           | +20 dev-day |


### 推薦預設

**A — 拒收**。理由：

1. V1.0 客戶（電子鎖維修商）的客戶 95% 是用 LINE 報修
2. SMS 整合需採購 + 帳號管理
3. 客服手動建單 UI 可在 V1.5 補（admin 後台已有 conversation list，加按鈕即可）

### 反向選項後果

- B：1 個 admin 新頁 + 1 個 createConversation API（已有）
- C：必須先選 SMS provider（Twilio? 三竹?）+ 採購

### PM 決策

```
[ ] A — 拒收（V1.0 only LINE）
[ ] B — 客服手動建單
[ ] C — SMS 雙向（V1.5+）

理由：__________________________________
拍板日期：______________
拍板人：______________
```

### 拍板後續更新

- `docs/01-define/E2--statement-of-work.md`：V1.0 客戶分流
- `web/src/app/conversations/new/page.tsx`：若 B，新建
- `api/scripts/generate_models.sh`：若 B，補 createConversation request body

---
