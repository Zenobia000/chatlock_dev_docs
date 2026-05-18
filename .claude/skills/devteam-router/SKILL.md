---
name: devteam-router
description: DevTeam 工作流入口路由。讀取 state 並依 Phase DAG 決定下一個 driver skill；負責 session 初始化、freeze gate 偵測、cascade 影響預覽。Use as the main entry point for any devteam software-spec-generation session.
---

# DevTeam Router: 入口路由與 Phase DAG 排程

## Overview

本 skill 是 DevTeam harness 的主入口。業主提出痛點後，本 skill 讀 session 狀態，依 Phase DAG 決定要 dispatch 哪個 driver skill（pm / analyst / ux / arch / design / qa / ops），並在 freeze gate 前自動觸發 multi-role critique。

**宣告：** 「正在使用 devteam-router skill — 解析狀態並決定下一步。」

---

## Phase 1: Session 狀態檢查

讀 `.claude/context/devteam/state.json`：

```
存在 + current_phase 未到 P5_RELEASE_DONE
  → 詢問業主：
    「偵測到進行中的 devteam session：[session_id]
     目前在 [current_phase]，feature：[active_features]
     最近完成：[last_artifact]
     [1] 繼續推進到下一個 driver / freeze gate
     [2] 手動指定角色（/devteam-<role> 自由插入）
     [3] 開新 session（舊歸檔）」

存在 + 已 P5_RELEASE_DONE
  → 開新 session（舊保留為 archive）

不存在
  → 進入 Phase 2 路由分析
```

---

## Phase 2: 入口路由分析

依業主輸入決定起點：

```
新業主訊息分析
│
├─ 純問題描述（「我想做 X 系統 / 解決 Y 痛點」）
│  → current_phase = P0_DISCOVERY
│  → next_driver = devteam-pm
│
├─ 已有 PRD 雛形 + 想往下做 system spec
│  → current_phase = P1_ANALYSIS
│  → next_driver = devteam-analyst（並可平行 ux）
│
├─ 已有需求但需要架構決策
│  → current_phase = P2_ARCHITECTURE
│  → next_driver = devteam-arch
│
├─ 想直接把 ADR/spec 變成 API/Schema
│  → current_phase = P3_DESIGN
│  → next_driver = devteam-design
│
└─ 無法判斷
   → 引導式問答 3 題：
     1. 「你現在有什麼？（PRD draft / 規則描述 / 草圖 / 純想法）」
     2. 「最想先解決的是？（價值定義 / 流程釐清 / 技術選型 / 介面契約）」
     3. 「業主是誰？你？團隊？外部 stakeholder？」
```

### Phase DAG 速查

| current_phase | 主導 driver | 平行可選 | 後續 freeze gate |
|:--------------|:------------|:---------|:-----------------|
| P0_DISCOVERY | devteam-pm | — | Gate 1: PRD Freeze |
| P1_ANALYSIS | devteam-analyst | devteam-ux | Gate 2 (UX) + Gate 3 (System Spec) |
| P2_ARCHITECTURE | devteam-arch | — | Gate 4: NFR + ADR Baseline |
| P3_DESIGN | devteam-design | — | Gate 5: API Contract + DB Schema |
| P4_DELIVERY | devteam-qa | — | Gate 6: Test Ready |
| P5_RELEASE | devteam-ops | — | Gate 7: Release Ready → handoff |

完整 DAG 與 re-entry 規則見 `devteam_knowledge_base/02_lifecycle_phases.md`。

---

## Phase 3: Session 初始化（新 session 時）

### 3a: 建立 state.json

寫入 `.claude/context/devteam/state.json`：

```json
{
  "session_id": "{YYYY-MM-DD-HHmm}-{feature-slug}",
  "release_id": null,
  "created_at": "{ISO timestamp}",
  "current_phase": "{P0_DISCOVERY | ...}",
  "active_features": ["{feature-slug}"],
  "problem_description": "{業主原始描述}",
  "phase_history": [],
  "freeze_gates": {
    "Gate1_PRD": "not_reached",
    "Gate2_UXFlow": "not_reached",
    "Gate3_SystemSpec": "not_reached",
    "Gate4_NFR_ADR": "not_reached",
    "Gate5_APIContract": "not_reached",
    "Gate5_DBSchema": "not_reached",
    "Gate6_TestReady": "not_reached",
    "Gate7_Release": "not_reached"
  },
  "pending_user_decisions": [],
  "cascade_policy": "manual_confirm",
  "review_intensity_default": "standard",
  "session_report": ".claude/context/devteam/session-{session_id}.md"
}
```

### 3b: 建立空 documents 索引

寫入 `.claude/context/devteam/documents/index.json`：

```json
{}
```

### 3c: 建立空 adr-ledger

寫入 `.claude/context/devteam/adr-ledger.json`：

```json
[]
```

### 3d: 建立 session 報告檔頭部

寫入 `.claude/context/devteam/session-{session_id}.md`：

```markdown
# DevTeam Session: {session_id}

> **日期**: {YYYY-MM-DD}
> **Feature**: {active_features}
> **問題**: {problem_description}
> **路由起點**: {current_phase}

---

## Narrative
```

後續每個 driver skill 完成時須**追加**該角色的 narrative 段落（這是業主回顧用的「敗事日誌」，與 docs/ 的規範文件分開）。

---

## Phase 4: 路由執行 → Dispatch driver

```markdown
## DevTeam Session 已就緒

- **Session**: {session_id}
- **當前 Phase**: {current_phase}
- **下一步 driver**: {next_driver}
- **理由**: {為什麼選這個 driver}

### 即將執行

dispatch `/devteam-{role}` 來產出 {expected_artifact}。
完成後若達 freeze gate，會自動觸發 multi-role review。
```

實作上：呼叫使用者執行對應的 `/devteam-<role>` slash command，或直接讀取對應 skill 並執行。

---

## Phase 5: Freeze Gate 偵測

每次 driver skill 完成回報後，router 檢查：

```
讀 state.json.freeze_gates[Gate_N]
│
├─ "ready_to_review" (driver 標記達成)
│   → Phase 5a: 啟動 multi-role critique
│
├─ "blocked" (有 pending_user_decisions)
│   → 列出 blocking decisions 給業主
│
└─ "not_reached"
    → 繼續 Phase 4 dispatch 下一個 driver
```

### Phase 5a: Multi-role Critique 啟動

依 `04_freeze_gates.md` 查該 gate 的：
- `required_personas`（必到的 critique 視角）
- `intensity`（預設 light / standard / strict）

依 `review_intensity_default` 或業主指定的 intensity dispatch 對應 persona agents：

| intensity | 行為 |
|:----------|:-----|
| `light` | 1 個 persona self-critique |
| `standard` | 2 personas 並行 + orchestrator 合併 |
| `strict` | 3 personas 並行 + orchestrator + 衝突點顯化 |
| `dry-run` | 列出 critique 框架不真實 dispatch |

合併產出寫入 `.claude/context/devteam/reviews/{Gate}-{feature}-{date}.md`，請業主簽核。

**orchestrator 降級規則：** 若 orchestrator 寫不出 coherent merge，自動降級為「列 N 份原始 critique + 標衝突點」。

### Phase 5b: Conflict Auto-Escalation to Forum-Lite

讀 orchestrator 回傳的結構化欄位（`conflicts_count`、`escalation_recommended`）：

```
conflicts_count >= 2 (or escalation_recommended == true)
│
├─ Lane B 提示（業主確認才走）：
│   ┌────────────────────────────────────────────────────────────┐
│   │ ⚠ Critique 發現 {n} 個衝突點（跨 persona 觀點分歧）。      │
│   │   建議升級至 Forum-Lite 多輪辯論：                          │
│   │                                                              │
│   │   /devteam-forum {target_doc} \                              │
│   │     --from-review={review_id} \                              │
│   │     --personas={原 critique personas} \                      │
│   │     --rounds=3                                                │
│   │                                                              │
│   │   [Y] 啟動 forum  [n] 業主直接裁決（沿用 Lane A 流程）       │
│   └────────────────────────────────────────────────────────────┘
│
└─ conflicts_count < 2
   └─ 維持原 Lane A 流程：呈現 review report 給業主直接裁決
```

**設計約束**：

- 觸發只「提示」，不自動啟動 — 業主必須明文確認
- `--from-review=<id>` 讓 forum proposer 可引用既有 critique 作為 R1 議題背景
- 業主回 `n` 或忽略 → 維持 Lane A，不打斷既有流程
- Lane B forum 結束後業主仍走 `/devteam-freeze` 重 freeze（forum 不直接 freeze 文件）

完整 Forum-Lite 流程見 `.claude/commands/devteam-forum.md`、`devteam_knowledge_base/05_meeting_protocols.md`。

---

## Phase 6: Cascade 影響預覽（業主修改 frozen 文件時）

當業主執行 `/devteam-<role> "改 X"` 而 X 對應的文件已 frozen：

```
1. 對應 driver 寫新 ADR 或 DR（依 04 KB 的分級規則）
2. 讀 documents/<doc>.meta.json.downstream_deps
3. 列影響面給業主：

   Cascade impact preview:
     docs/<path-1>   (stale-major, owner: <role>)
     docs/<path-2>   (stale-minor, owner: <role>)
     ...

4. 依 cascade_policy：
   - manual_confirm（預設）→ 等業主下指令
   - auto_cascade → 自動標 stale + 重跑
   - ignore → 只更新版本不重跑

業主可下：
  /devteam continue cascade
  /devteam continue cascade --minor-only
  /devteam ignore cascade
```

**設計意圖：** 避免 PRD 一改就觸發 18 次 sub-agent dispatch 的 review 風暴。

---

## Phase 7: Handoff（所有 gate passed）

當 Gate 7 passed 且業主執行 `/devteam-handoff <feature>`：

1. 讀 state.json + documents/index.json + adr-ledger.json
2. 套 `devteam_knowledge_base/templates/handoff.md`
3. 產出 `specs/{feature}/handoff.md`
4. 列出 frozen artifacts 的 path + version + SHA
5. 提示業主：「Handoff 已就緒，可交給外部 coding agent」

---

## 輸出契約

每次 router 執行完，stdout 至少包含：

- `current_phase` 與 `next_driver`
- 是否有 pending freeze review
- 是否有 pending user decisions
- 是否有 stale documents 等業主授權 cascade

不滿足 → 視為 bug，需修正。
