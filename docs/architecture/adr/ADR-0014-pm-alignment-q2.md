---
id: ADR-0014
title: 雙簽終簽人階層
status: accepted
date: 2026-05-07
deciders: [PM, Tech Lead, QA Lead]
legacy_id: PM-Q2
supersedes: []
superseded_by: []
related:
  - "../0-principles/id-mapping-legacy.md §A.6 (PM Q → ADR)"
  - "_pending-split-pm-alignment-Q1-Q10.md (原始決策矩陣)"
---

# ADR-0014 — 雙簽終簽人階層

## Status

**Accepted** (拍板於 2026-05-07，作為 PM Q1-Q10 90 分鐘對齊會議產物)

## Decision

**A operations_director (Manager 之上)**

## Context, Options, Consequences (從 PM 決策矩陣 §3 摘錄)

## 3. Q2 — Manager vs Director 雙簽終簽人？

### 業務脈絡

F-013 / F-014（退款 / 爭議雙簽）需要兩人簽核才能放行。第二簽是「同 level 的另一人」還是「上級」？影響稽核合法性與測試 actor order。

### 影響流程

- F-013 對帳爭議雙簽
- F-014 退款流程
- F-019 RBAC 階層

### 候選方案


| 選項                            | 說明                                | 法務風險        | 測試成本                     |
| ----------------------------- | --------------------------------- | ----------- | ------------------------ |
| **A. Director > Manager**（階層） | 第二簽必須是 Director；Manager 自己無法簽     | 低（明確問責）     | F-013 / F-014 鎖 actor 順序 |
| **B. 平級雙簽**（無階層）              | 任兩位 Manager 即可（不同 user_id）        | 中（責任分散）     | 需驗無序性（A→B 與 B→A 等價）      |
| **C. 階層可降級**（有條件）             | 預設 Director，金額 < N 元降為 Manager 平級 | 高（金額閾值需業務拍） | 三類矩陣，最複雜                 |


### 推薦預設

**A — Director > Manager**。理由：

1. 法務最易解釋（明確問責鏈）
2. 既有 `api/tests/test_refund_dual_sign.py` 已是這套邏輯（`secondary_admin_headers` 用 operations_manager role）
3. 金額閾值方案（C）需要先有金額分布數據，V1.0 沒有

### 反向選項後果

- B：審計 trail 仍合法但 social engineering 風險高（兩 manager 串通）
- C：必須先定金額閾值，且 hypothesis fuzz 測試成本上升 30%

### PM 決策

```
[ ] A — Director > Manager（階層）
[ ] B — 平級雙簽
[ ] C — 階層可降級（需附閾值）

理由：__________________________________
拍板日期：______________
拍板人：______________
```

### 拍板後續更新

- `SQL/Schema_v2_extensions.sql` user_role enum 確認 `operations_director` 在
- `api/services/refund_service.py` 雙簽 actor check 邏輯（取決於選項）
- `api/tests/test_refund_dual_sign.py` 加 director-vs-manager case
- `docs/_flows-bdd-test/v-model-left/E5x--workflow-admin-governance.md` RBAC §

---
