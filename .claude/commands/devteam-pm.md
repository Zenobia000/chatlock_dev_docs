---
description: DevTeam PM driver。產出 PRD draft 與 stakeholder map；達 Gate 1 條件時自動標記 ready_to_review。
---

# DevTeam PM Driver

載入 **devteam-pm** skill，扮演 PM 角色產出 PRD。

## 使用方式

```
/devteam-pm                                # 接續當前 session 推進 PRD
/devteam-pm "補上 KPI 為 7 天留存 40%"      # 局部迭代
/devteam-pm "改 scope，把 checkout 移到 v2" # 已 frozen 後的變更 → 寫 DR + cascade preview
```

## 產出位置

- `docs/prd/<feature>.md` — PRD 主檔
- `docs/governance/stakeholders.md` — Stakeholder map（首次時自動建立）
- `.claude/context/devteam/documents/index.json` + `.meta.json` — 更新文件索引
- `.claude/context/devteam/session-<id>.md` — 追加 narrative

## Gate 1 自動判定

PRD 滿足以下條件後，回報 router 進入 `Gate1_PRD = ready_to_review`：

- Problem Statement 三項都不為空
- 至少 1 個可量化 KPI
- In-scope 與 Out-of-scope 都列出
- 主要 risks 已揭露
- Open questions 已標記
