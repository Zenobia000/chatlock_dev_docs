---
id: ADR-0017
title: F-016 SLA 性質
status: accepted
date: 2026-05-07
deciders: [PM, Tech Lead, QA Lead]
legacy_id: PM-Q5
supersedes: []
superseded_by: []
related:
  - "../0-principles/id-mapping-legacy.md §A.6 (PM Q → ADR)"
  - "_pending-split-pm-alignment-Q1-Q10.md (原始決策矩陣)"
---

# ADR-0017 — F-016 SLA 性質

## Status

**Accepted** (拍板於 2026-05-07，作為 PM Q1-Q10 90 分鐘對齊會議產物)

## Decision

**B Soft Target (V1 全 Soft)**

## Context, Options, Consequences (從 PM 決策矩陣 §6 摘錄)

## 6. Q5 — F-016「2 小時到場」是 hard SLA？

### 業務脈絡

F-016 派工後 2 小時內技師應到場。「破線」是僅警報、還是觸發賠償 + 自動沖銷？

### 影響流程

- F-016 SLA 紅色警報
- F-013 / F-014（破線後賠償計算）
- F-005 技師接單（影響派工演算法 fairness penalty）

### 候選方案


| 選項                                  | 說明                | 客戶補償 | 技師處罰             | 測試複雜度          |
| ----------------------------------- | ----------------- | ---- | ---------------- | -------------- |
| **A. Hard SLA**（破線 → 升級 + 賠償）       | 自動發 X 元抵用券 + 升級主管 | 強制   | 重派 + fairness 扣分 | 賠償計算 + 沖銷測試    |
| **B. Soft Target**（破線 → 僅警報）        | 僅 dashboard 變紅    | 無    | 無                | alert event 測試 |
| **C. 階梯**（2hr 警報 + 4hr 升級 + 6hr 賠償） | 三段式               | 階梯   | 階梯               | 三段時間旅行測試       |


### 推薦預設

**B — Soft Target**。理由：

1. V1.0 派工 fairness 機制未驗證（[[02-design/specs/dispatch-weights]] 才剛建），不適合上 hard penalty
2. 賠償抵用券需要金流（綁 Q7）
3. dashboard 變紅 + 升級 manager 已能讓營運處理

### 反向選項後果

- A：必須先有金流（Q7 = A）+ 賠償計算規則 + 自動沖銷工作流 → +10 dev-day
- C：時間旅行 fixture（freezegun）測試成本中等，但需 PM 拍三段時間

### PM 決策

```
[ ] A — Hard SLA（破線 → 升級 + 賠償）
[ ] B — Soft Target（破線 → 僅警報）
[ ] C — 階梯（2hr/4hr/6hr）

理由：__________________________________
拍板日期：______________
拍板人：______________

⚠ 業務交叉確認：與 SLA 賠償政策（合約條款）是否一致？
```

### 拍板後續更新

- `api/services/sla_monitor.py`：alert vs penalty 分流
- `docs/_flows-bdd-test/v-model-left/E5x--workflow-admin-governance.md` §SLA
- `tests/golden/sla/`：若 A/C，加 escalation timeline fixture

---
