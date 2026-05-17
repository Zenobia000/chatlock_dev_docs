# DevTeam Harness 使用指南

## 快速開始

輸入 `/devteam` + 你的痛點描述，系統自動建立 session 並進入 P0_DISCOVERY。

```
/devteam 我想做訂閱制讀書筆記系統，痛點是試用 7 天後流失率太高
```

---

## 指令一覽

| 指令 | 功能 | 何時用 |
|:-----|:-----|:------|
| `/devteam` | 主入口，依 Phase DAG 路由 | 任何新痛點的起點、恢復 session |
| `/devteam-pm` | P0 Discovery / 產 PRD | 初次定義問題、迭代 PRD、改 frozen PRD（自動寫 DR） |
| `/devteam-status` | 查看當前 session | 想看走到哪、有哪些 pending 裁決、stale 文件 |
| `/devteam-freeze <Gate>` | 手動觸發 multi-role review | freeze gate 前的 critique |

（Phase 2 將加入 analyst / ux / arch / design / qa / ops 等其餘 driver）

---

## 典型流程

### 路徑：從零開始一個 feature

```
/devteam 我要做訂閱制讀書筆記系統，痛點是流失率高
  → router 建立 session、進入 P0_DISCOVERY
  → dispatch devteam-pm 產 PRD draft
  → 達 Gate 1 條件後停下來

/devteam-status
  → 看 PRD draft 完成度、open questions
  → 看 Gate 1 ready_to_review

/devteam-freeze Gate1_PRD
  → multi-role critique（ba + sa + ux personas, strict intensity）
  → 業主簽核 → frozen v1

/devteam continue
  → 進入 P1_ANALYSIS（analyst + ux 並行）
  → ...
```

### 路徑：業主中途改 frozen PRD

```
/devteam-pm "改 scope，把 checkout v2 移後"
  → 偵測 PRD 已 frozen
  → 自動寫 DR-NNN 紀錄變更原因
  → 列 cascade impact preview（受影響的下游文件）
  → 等業主下指令：
      /devteam continue cascade           # 標 stale + 重跑下游
      /devteam continue cascade --minor-only
      /devteam ignore cascade
```

### 路徑：完成後交給 coding agent

```
（所有 7 個 gate passed 後）
/devteam-handoff <feature>
  → 產 specs/<feature>/handoff.md
  → 列 frozen artifacts + acceptance + ADR index + telemetry hooks
  → 交給 Claude Code / Cursor / Aider 實作
```

---

## 規範產出位置

所有 frozen 規範文件都在 repo 的 `docs/` 與 `specs/<feature>/`：

```
docs/
  prd/<feature>.md
  ux/user-flow-<feature>.md
  analysis/system-spec-<feature>.md
  architecture/c4-<feature>.md
  architecture/adr/ADR-NNN-*.md
  architecture/dr/DR-NNN-*.md
  api/openapi-<service>.yaml
  data/erd-<feature>.md
  qa/test-plan-<release>.md
  ops/runbook-<service>.md
  release/readiness-<date>.md

specs/<feature>/
  handoff.md            # 對外 coding agent 契約
```

Session 內部狀態在 `.claude/context/devteam/`（state.json、documents/index.json、adr-ledger.json、session-narrative）。

---

## 設計哲學速覽

1. **角色為軸**：skill 是「能力容器」（PM 能寫 PRD），phase 是「角色組合的 view」
2. **ADR-style 決策鏈**：所有重要決策寫 ADR / DR，變更用 superseded 鏈而非覆寫
3. **Freeze 不是鎖死**：是讓並行不失控的 baseline + change policy
4. **Cascade 預設 manual_confirm**：避免 PRD 一改就觸發 review 風暴
5. **Multi-role review 有 intensity dial**：light / standard / strict / dry-run，按 gate 風險選

完整哲學見 `.claude/CLAUDE.md` 與 `devteam_knowledge_base/`。
