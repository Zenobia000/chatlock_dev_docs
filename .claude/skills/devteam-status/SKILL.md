---
name: devteam-status
description: 讀取 devteam state 並輸出當前 phase / freeze gate / 文件成熟度 / pending decisions / stale 清單。不寫任何檔案，純報告。
---

# DevTeam Status: Session 狀態速覽

## Overview

讀 `.claude/context/devteam/` 三層 state（`state.json` + `documents/index.json` + `adr-ledger.json`），合併輸出當前 session 全貌。

**宣告：** 「正在使用 devteam-status skill — 輸出當前狀態。」

---

## 操作流程

1. 讀 `.claude/context/devteam/state.json`
   - 若不存在 → 輸出「無進行中的 devteam session。使用 `/devteam` 開始。」
2. 讀 `.claude/context/devteam/documents/index.json`
3. 讀 `.claude/context/devteam/adr-ledger.json`
4. 組裝報告（見下方範本）

---

## 輸出範本

```markdown
## DevTeam Session 狀態

- **Session**: {session_id}
- **Release**: {release_id | "—"}
- **當前 Phase**: {current_phase}
- **Active Features**: {active_features}
- **Cascade Policy**: {cascade_policy}
- **Review Intensity**: {review_intensity_default}

### Freeze Gate 進度

| Gate | 名稱 | 狀態 | Owner driver |
|:-----|:-----|:-----|:-------------|
| 1 | PRD Freeze | {status} | devteam-pm |
| 2 | UX Flow Freeze | {status} | devteam-ux |
| 3 | System Spec Freeze | {status} | devteam-analyst |
| 4 | NFR + ADR Baseline | {status} | devteam-arch |
| 5a | API Contract Freeze | {status} | devteam-design |
| 5b | DB Schema Freeze | {status} | devteam-design |
| 6 | Test Ready | {status} | devteam-qa |
| 7 | Release Ready | {status} | devteam-ops |

### 文件成熟度

| 文件 | 狀態 | 版本 | Owner |
|:-----|:-----|:-----|:------|
| docs/prd/{feature}.md | {frozen/reviewed/draft/stale/superseded} | v{n} | pm |
| docs/ux/user-flow-{feature}.md | ... | ... | ux |
| ... | ... | ... | ... |

### Pending User Decisions

| ID | 主題 | 阻擋的 Gate |
|:---|:-----|:------------|
| PD-{n} | {topic} | {gate} |

### Stale Documents（等業主授權 cascade）

| 文件 | 嚴重度 | 原因 |
|:-----|:-------|:-----|
| docs/{path} | stale-major / stale-minor | {reason} |

### ADR / DR Ledger 摘要

| ID | 類型 | 主題 | 狀態 |
|:---|:-----|:-----|:-----|
| ADR-{n} | ADR | {topic} | {Accepted/Superseded by ADR-x} |
| DR-{n} | DR | {topic} | {Accepted} |

### 下一步建議

{依 current_phase 與 freeze_gates 給出 1-2 個建議指令}
- 例：「執行 `/devteam-analyst` 開始 P1 分析」
- 例：「Gate 1 已 ready_to_review，執行 `/devteam-review` 啟動 critique」
- 例：「業主需先裁決 PD-3，再繼續」
```

---

## 邊界

- **絕不寫檔。** 即使發現 state 有不一致也不修正，只報告差異。
- 若三層 state 互相矛盾（例 documents/index.json 與 state.json.freeze_gates 不同步），在報告最後附 `⚠ Inconsistency` 區塊提示。
