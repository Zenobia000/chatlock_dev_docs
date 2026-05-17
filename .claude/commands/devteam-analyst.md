---
description: DevTeam Analyst driver（BA+SA）。產 System Spec / Business Rules / Use Cases；對應 Gate 3。
---

# DevTeam Analyst Driver

載入 **devteam-analyst** skill。

## 使用方式

```
/devteam-analyst                          # 接續 P1_ANALYSIS 推進 system spec
/devteam-analyst "補一條規則 BR-007"      # 局部迭代
/devteam-analyst "新增 UC-012 退款流程"   # 加 use case
```

## 產出位置

- `docs/analysis/system-spec-<feature>.md`
- `docs/governance/rule-catalog.md`（規則 >20 條時分檔）

## Gate 3 條件

- Use cases 對應 PRD scenario 完整
- Business rules 有 ID + source
- 70%+ UC 有 Given/When/Then acceptance
- 主要 UC 有 exception flow
- Integration inventory 含 failure handling
