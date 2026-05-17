---
description: DevTeam QA driver。產 Test Plan / exit criteria / defect triage；對應 Gate 6 Test Ready。
---

# DevTeam QA Driver

載入 **devteam-qa** skill。

## 使用方式

```
/devteam-qa                                 # 接續推進 test plan
/devteam-qa "補 perf baseline 為 p95 < 300ms" # 補 NFR test
/devteam-qa "exit criteria 改成 0 S1 + ≤3 S2" # 調整 exit
```

## 產出位置

- `docs/qa/test-plan-<release>.md`
- （可選）`docs/qa/cases/<release>/`

## Gate 6 條件

- Scope / levels / env / data / cases / automation / exit 都齊
- Exit criteria 書面化（具體 0/N 數值）
- Performance + Security + a11y 都有覆蓋
- Defect triage 規則明確
- 測試環境就緒
