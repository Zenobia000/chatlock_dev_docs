---
description: DevTeam UX driver（UX+UI）。產 user flow / state coverage / a11y / wireframe；對應 Gate 2。
---

# DevTeam UX Driver

載入 **devteam-ux** skill。

## 使用方式

```
/devteam-ux                                 # 接續推進 user flow
/devteam-ux "補 Empty/Loading state"        # 局部
/devteam-ux "加 offline scenario"           # 補 edge case
```

## 產出位置

- `docs/ux/user-flow-<feature>.md`
- （可選）`docs/ux/wireframe-<feature>.md`

## Gate 2 條件

- 核心 flow Entry→Success 走通
- 每個主要 branch 有 error handling
- State matrix（Happy / Empty / Loading / Error / Offline）每 step 至少兩列
- WCAG Level 標明且 a11y checklist 4+ 項
- 高風險互動已列驗證假設
