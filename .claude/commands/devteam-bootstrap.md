---
description: Architect Bootstrap Questionnaire — 12 題問卷把 senior 隱性思考顯化，產 bootstrap-intent.yaml 預填 PRD。Junior Architect Copilot 的 agentic init 階段入口。
---

# DevTeam Bootstrap

載入 **devteam-bootstrap** skill，跑 Architect Bootstrap Questionnaire。

## 使用方式

```
/devteam-bootstrap                          # 從頭跑問卷（首次或重新初始化）
/devteam-bootstrap "改 Q5 為 GDPR"           # 修改單題（不重跑整份）
/devteam-bootstrap show                     # 顯示當前 bootstrap-intent.yaml
```

## 產出位置

- `.claude/context/devteam/bootstrap-<feature>.yaml` — 結構化 intent
- `.claude/context/devteam/state.json` — 寫入 `ux_mode` 與 `weak_areas`
- `.claude/context/devteam/session-<id>.md` — 追加 bootstrap 摘要

## 為什麼存在

對「有開發基礎但沒架構能力」的工程師，這 12 題等於 senior 的 mental checklist。
填完即進入 PRD 階段，devteam-pm 會自動讀 bootstrap-intent.yaml 預填 §3 Users / §4 Scope / §7 NFR / §8 Dependencies，業主只需補 problem statement 細節與 KPI。

對應設計理念：agentic 應用模式（higgsfield / lovart 風格）的 init 階段。
