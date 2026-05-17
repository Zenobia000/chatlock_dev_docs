---
description: 手動觸發某份文件的 multi-role review（不一定要在 freeze gate）；可指定 intensity 與 personas。
---

# DevTeam Manual Review

手動 dispatch persona agents 對指定文件做 critique，產出 review report。**與 `/devteam-freeze` 的差別：本 command 不要求 gate ready_to_review，可在任意時間針對任意 doc 跑。**

## 使用方式

```
/devteam-review docs/prd/feature-x.md                              # 預設 standard intensity, auto-pick personas
/devteam-review docs/prd/feature-x.md --intensity=light
/devteam-review docs/architecture/adr/ADR-007.md --personas=sre,dba
/devteam-review docs/api/openapi-billing.yaml --intensity=strict
/devteam-review docs/qa/test-plan-2026-Q3.md --dry-run             # 列框架不真實 dispatch
```

## 參數

- `--intensity=light|standard|strict|dry-run`（預設 standard）
- `--personas=<comma-list>` 覆寫預設 personas
- `--dry-run` 等同 `--intensity=dry-run`

## 操作流程

1. 解析目標文件路徑 → 讀對應 `.meta.json` 取 `review_personas` 預設值
2. 套用 intensity 對 persona 數量做篩選
3. 並行 dispatch persona agents（見 `.claude/agents/devteam-*-persona.md`）
4. 每個 agent 從自己視角讀文件 + state 產 critique（{重大阻礙, 建議, 通過, 衝突點}）
5. `devteam-orchestrator` agent 合併
6. 寫入 `.claude/context/devteam/reviews/manual-<doc-slug>-<date>.md`
7. 不更新 state.json 的 freeze_gates（這是手動 review，不算 gate ready）
8. 業主裁決 → 對應 driver skill 修正

## 與 `/devteam-freeze` 的差別

| 面向 | `/devteam-review` | `/devteam-freeze` |
|:-----|:------------------|:------------------|
| 觸發時機 | 任意 | gate ready_to_review |
| 對 state 影響 | 不改 freeze gate | 標 frozen 或 revise |
| 用途 | 早期回饋、文件健檢 | 正式 freeze 流程 |
| 預設 intensity | standard | 依 04 KB |
