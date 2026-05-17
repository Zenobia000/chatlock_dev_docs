---
description: DevTeam 主入口。讀 session 狀態並依 Phase DAG 決定下一個 driver；新業主直接描述痛點即可。
---

# DevTeam 主入口

載入 **devteam-router** skill，解析業主輸入並路由到適當的 driver skill。

## 使用方式

```
/devteam                              # 互動式起點 + 恢復進行中 session
/devteam 我要做訂閱系統，痛點是流失高    # 直接描述痛點 → 進入 P0_DISCOVERY
/devteam continue cascade             # 業主授權 cascade 重跑下游
/devteam ignore cascade               # 接受變更但不重跑下游
/devteam resume                       # 恢復上次 session
```

## 路由起點

| 業主輸入 | 起點 phase | 第一個 driver |
|:---------|:-----------|:--------------|
| 純痛點描述 | P0_DISCOVERY | devteam-pm（生 PRD） |
| 已有 PRD 想接著做 | P1_ANALYSIS | devteam-analyst（+ ux 並行） |
| 已有需求想做架構 | P2_ARCHITECTURE | devteam-arch |
| 已有 ADR 想做契約 | P3_DESIGN | devteam-design |
| 不確定 | — | 引導式 3 題問答 |

完整 DAG 與 freeze gate 規則：`devteam_knowledge_base/02_lifecycle_phases.md`、`devteam_knowledge_base/04_freeze_gates.md`。
