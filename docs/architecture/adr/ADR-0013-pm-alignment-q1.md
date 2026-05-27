---
id: ADR-0013
title: 派工員角色定位
status: accepted
date: 2026-05-07
deciders: [PM, Tech Lead, QA Lead]
legacy_id: PM-Q1
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


# ADR-0013 — 派工員角色定位

## Status

**Accepted** (拍板於 2026-05-07，作為 PM Q1-Q10 90 分鐘對齊會議產物)

## Decision

**A 新角色 dispatch_officer**

## Context, Options, Consequences (從 PM 決策矩陣 §2 摘錄)

## 2. Q1 — 「派工員」是 V2.0 新角色還是客服子權限？

### 業務脈絡

[[_flows-bdd-test/v-model-left/E5x--workflow-dispatch]] §3 描述「派工員」職責（手動派工、改派、處理 SLA 警報），但 V1.0 沒有這個角色—所有派工由「客服」兼任。V2.0 引入自動派工後，是否獨立此角色？

### 影響流程

- F-004 手動派工（actor 該寫 dispatcher 還是 customer_service）
- F-016 SLA 紅色警報接收者
- F-019 RBAC 動態調整（角色清單）

### 候選方案


| 選項                                                | 說明                                 | RBAC 影響                     | 測試成本                              | 業務風險           |
| ------------------------------------------------- | ---------------------------------- | --------------------------- | --------------------------------- | -------------- |
| **A. 新角色** `dispatcher`                           | 獨立 user role，獨立 seed 資料、獨立 fixture | seed 加 1 列、roles enum 加 1 值 | F-004 多 actor 矩陣（dispatcher × CS） | 客戶若無專職派工員→閒置帳號 |
| **B. 客服子權限** `customer_service.can_dispatch=true` | 沿用 customer_service 角色，加權限旗標       | RBAC table 加 1 column       | F-004 沿用 CS fixture，僅檢查 flag      | 後期要拆角色困難       |
| **C. V1.0 不分，V2.5 再拆**                            | 全 CS 兼派工，未來再 ADR                   | 0 改動                        | 0 改動                              | 派工問責不明         |


### 推薦預設

**A — 新角色**。理由：

1. E5x dispatch-operations 已用 dispatcher 用詞，spec 改動小
2. 客戶若用 SaaS，多技師客戶會有獨立派工員；單技師客戶 = 同一人多 role
3. 拆角色比合角色難，先拆對未來友善

### 反向選項（B / C）後果

- B：RBAC table 加 column 容易，但 F-004 無法測「dispatcher 視角專屬 UI」
- C：F-004 / F-019 兩條流程降為 🔴，不能進 V2.0 GA

### PM 決策

```
[ ] A — 新角色 dispatcher
[ ] B — 客服子權限 can_dispatch
[ ] C — V1.0 不分

理由：__________________________________
拍板日期：______________
拍板人：______________
```

### 拍板後續更新

- `SQL/seeds/_admin_user.sql` 加 dispatcher seed
- `api/models/users.py` enum 加 `dispatcher`
- `docs/_flows-bdd-test/v-model-left/E5x--workflow-dispatch.md` §3 actor 表
- `docs/_flows-bdd-test/v-model-right/E7--bdd-scenarios.md` F-004 Given 步驟
- `tests/factories/technician.py` 反向不影響（technician 不是 dispatcher）

---
