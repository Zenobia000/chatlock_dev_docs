# Architect Copilot — VS Code Extension (MVP)

> Junior Architect Copilot 的 IDE-native 體驗。把既有 DevTeam Harness（11 phases / 12 personas / 7 freeze gates）的後端能力，包裝成 VS Code / Cursor 內可視化面板。CLI 與 GUI 共用同一份 file-based state — 你可以隨時來回切換。

---

## Why this exists

DevTeam Harness 本身是 Claude Code skill / agent 組成的 CLI 工具，所有狀態存在 `.claude/context/devteam/` 下的 markdown + json。對 CLI 熟手很順手，對 junior / 學習者三個問題：

1. **看不到全貌** — 11 phases × 7 gates × 12 personas，CLI 只能逐步問
2. **不知道現在輪到誰做什麼** — `current_phase` / `pending_user_decisions` 要打 `/devteam-status` 才看到
3. **Bootstrap 12 題用對話問太慢** — 表單一次填完才合理

這個 extension 把上述三件事 IDE 化：Dashboard 一目了然、Bootstrap 表單一次填完、Decision Card 在 gate 跳出讓你選。產出仍是同一套 markdown spec，可繼續餵給 Claude Code / Cursor / 任何 coding agent。

---

## Features (MVP)

包含：

- **Bootstrap Questionnaire 面板** — 12 題分 6 組，每題附 "Why this matters" 教育卡。完成後產出 `bootstrap-<feature>.yaml` + 更新 `state.json`
- **Dashboard 面板** — phase / bootstrap 狀態 / UX mode / weak areas / freeze gates / documents 一覽
- **Mission Control Tree Views** — Phases & Gates / Documents / Personas / KB Catalog / Decisions 五棵側邊欄樹
- **Decision Card / Document Detail / Phase Detail / Roundtable Detail** — webview panels
- **Run /devteam-pm in Terminal** — 打開 terminal 帶入 `claude /devteam-pm`，把 PM 階段交給 Claude Code CLI（PRD 預填會自動讀剛產的 yaml）
- **檔案 watcher** — 偵測 `.claude/context/devteam/` 變化自動 refresh

不包含（roadmap）：

- Drill-down Chat（Lane B/C 對話即時顯示）
- Artifact Preview（C4 mermaid render / OpenAPI swagger / ERD）
- Claude API 直連（目前透過 terminal 呼叫 Claude Code CLI）

---

## Prerequisites

| Item | Required | Notes |
|:---|:---|:---|
| VS Code | ≥ 1.85 | Cursor 也支援（沿用 VS Code extension API） |
| Claude Code CLI | required for full workflow | `npm i -g @anthropic-ai/claude-code`，extension 透過 terminal 呼叫它 |
| Node.js | ≥ 18 | Quick Start 需要 `npx @vscode/vsce package` build；未來 Releases 提供 prebuilt .vsix 時 end-user 可免裝 |
| OS | Windows / macOS / Linux / WSL | File watcher 在 WSL 可能延遲，Dashboard 有手動 Reload |

如果你只想試玩 Bootstrap 表單與 Dashboard、不串 Claude Code → 可以略過 Claude Code CLI 那行，但 "Run /devteam-pm" 按鈕會無作用。

---

## Quick Start — Build & Install `.vsix`

MVP 階段未發 GitHub Release，需自行 build 一份 `.vsix` 後安裝到日常 VS Code。

> **Roadmap**：穩定版本將透過 GitHub Releases 發 prebuilt `.vsix` — 屆時這節改為「Download from Releases → install」一行流程。

### 1. Clone repo

```bash
git clone https://github.com/Zenobia000/Architecture_Autopilot.git
cd Architecture_Autopilot/vscode-extension
```

### 2. Install dependencies & build the `.vsix`

```bash
npm install
npx @vscode/vsce package
```

完成後 `vscode-extension/` 下會出現 `architect-copilot-0.3.4.vsix`（檔名跟著 `package.json` 的 `version` 走）。

> `@vscode/vsce` 不在 devDependencies — 上面 `npx` 會即時下載。若想常駐：`npm i -g @vscode/vsce` 後改用 `vsce package`。

### 3. Install the `.vsix` into VS Code

```bash
code --install-extension architect-copilot-0.3.4.vsix
```

或 GUI 路徑：`Ctrl+Shift+P` → `Extensions: Install from VSIX...` → 選剛 build 出的 `.vsix`。Cursor 流程相同（`Cursor: Install from VSIX...`）。

> 自 build 的 `.vsix` 沒簽章，VS Code 會跳一次 "Install anyway?" 警告，按確認即可。

### 4. Open the repo in VS Code

```bash
cd ..
code .
```

從 `Architecture_Autopilot` 根目錄打開（**不是** `vscode-extension/`）。Extension 預期在這個 workspace 下找 `.claude/context/devteam/`。

### 5. Verify

`Ctrl+Shift+P` → 輸入 `Architect Copilot` 應該看到三個命令：

- `Architect Copilot: Start Bootstrap Questionnaire`
- `Architect Copilot: Open Dashboard`
- `Architect Copilot: Run /devteam-pm in Terminal`

側邊欄應該出現 **Architect Copilot** 圖示，展開有五棵 tree view。如果只想試玩、不想裝到日常 VS Code → 改走下方 [Developer Mode](#developer-mode--run-from-source)（F5 開 Extension Development Host）。

---

## Developer Mode — Run from source

要改 extension 程式碼、或 .vsix 沒附最新版本時走這條。

### 1. Install dependencies

```bash
cd vscode-extension
npm install
```

### 2. Open `vscode-extension/` in VS Code

```bash
code .
```

注意是 `vscode-extension/` 子目錄，**不是** repo 根目錄 — 這樣 F5 才會走 extension dev workflow。

### 3. Press F5

VS Code 會自動跑 `npm: build`，build 完開新視窗（Extension Development Host）。  
新視窗會載入 `Architecture_Autopilot` 主專案（透過 `.vscode/launch.json` 的 `${workspaceFolder}/..`）。

修改 `src/` 後在 Extension Development Host 視窗按 `Ctrl+R` 重載即可。

### 4. Optional: watch + typecheck

```bash
npm run watch       # esbuild watch mode
npm run typecheck   # tsc --noEmit
```

---

## First-run Walkthrough

第一次跑端到端流程，從零產出第一份 PRD：

1. **打開 Dashboard** — `Ctrl+Shift+P` → `Architect Copilot: Open Dashboard`。第一次看會是空 state（無 active feature）。
2. **跑 Bootstrap Questionnaire** — `Ctrl+Shift+P` → `Architect Copilot: Start Bootstrap Questionnaire`。
   - 12 題分 6 組：Business / Compliance / Team & Timeline / Stack / Learning / Open Questions
   - 每題附「Why this matters」短說明（educational mode 預設開啟）
   - 完成按「產出 yaml」→ 自動寫 `.claude/context/devteam/bootstrap-<feature>.yaml` + 更新 `state.json` 的 `bootstrap_done = true`
3. **回 Dashboard 確認** — 自動 refresh，應看到：
   - Phase: `P0_DISCOVERY`
   - Bootstrap: ✓ done
   - UX mode（educational / balanced / fast-handoff）
   - Weak areas（你勾的領域）
4. **跑 `/devteam-pm`** — Dashboard 上的 "Run /devteam-pm in terminal" 按鈕，或 `Ctrl+Shift+P` 找命令。
   - 會在 VS Code integrated terminal 跑 `claude /devteam-pm`
   - PM driver 偵測到 `bootstrap-<feature>.yaml` 存在 → 自動進 **Mode A 預填模式**，PRD §3/§7/§8/§9/§10 直接填好，只追問必填的 4 處（problem cost / KPI / out-of-scope / FR list）
5. **PRD 產出** — Claude Code 把 `docs/prd/<feature>.md` 寫好後，Dashboard 的 Documents tree 自動 refresh，可直接點檔名打開檢視。

從此你可以選擇：
- **CLI 為主**：繼續用 `/devteam-analyst`、`/devteam-ux`、`/devteam-arch` 等命令推進，Dashboard 只當觀測
- **GUI 為主**：Decision Card / Document Editor panel 操作；CLI 在 Decision 時跑

兩種混用沒問題 — state 是 single source of truth。

---

## Interop with Claude Code CLI

擴充與 CLI **完全共用同一份 state**：

| 檔案 | 寫者 | 讀者 |
|:---|:---|:---|
| `.claude/context/devteam/state.json` | 兩邊都寫 | 兩邊都讀 |
| `.claude/context/devteam/bootstrap-<feature>.yaml` | 擴充寫（也可被 `/devteam-bootstrap` skill 寫） | 兩邊都讀 |
| `.claude/context/devteam/session-<id>.md` | 兩邊都會 append | 兩邊都讀 |
| `.claude/context/devteam/documents/index.json` | PM driver 寫 | 擴充 Dashboard 讀 |
| `.claude/context/devteam/documents/<doc>.meta.json` | driver skill 寫 | 擴充 Document Detail 讀 |
| `docs/**/*.md` | driver skill 寫 | 擴充與你都讀 |

擴充寫的 `state.json` schema 與 `.claude/skills/devteam-router/SKILL.md` Phase 3a 規範一致：`current_phase` / `active_features[]` / `bootstrap_done` flat flag / `Gate5a_API` / `Gate5b_DBSchema`。

---

## Troubleshooting

**Q: `Ctrl+Shift+P` 找不到 `Architect Copilot:` 命令**  
A: Extension 沒載入。檢查：
1. VS Code → Extensions 面板搜尋 "Architect Copilot"，狀態應該是 Enabled
2. `.vsix` 版本是否與 VS Code 版本相容（需 ≥ 1.85）
3. 從 Output panel 選 `Architect Copilot` channel 看 error log

**Q: Dashboard 顯示空 state，但 `.claude/context/devteam/state.json` 明明有內容**  
A: 你打開的 workspace root 不對。Extension 從 `${workspaceFolder}/.claude/context/devteam/` 讀。確認 VS Code 標題列顯示的是 `Architecture_Autopilot` 根目錄，不是 `vscode-extension/` 子目錄。

**Q: File watcher 沒自動 refresh（WSL / 網路磁碟）**  
A: 已知限制。Dashboard 右上角有手動 Reload 按鈕。或重開 VS Code 視窗。

**Q: "Run /devteam-pm" 按鈕跑了 terminal 但沒反應**  
A: Claude Code CLI 沒裝 / 沒在 PATH。Terminal 跑 `claude --version` 確認；若無安裝：`npm i -g @anthropic-ai/claude-code`。

**Q: Bootstrap 表單填完按產出 yaml 沒反應**  
A: 通常是 workspace root 沒寫入權限，或 `.claude/context/devteam/` 路徑不存在。手動 `mkdir -p .claude/context/devteam` 再試。

**Q: 從 source dev（F5）跑時 Extension Development Host 空白**  
A: `npm: build` 失敗。在 `vscode-extension/` 跑 `npm run typecheck` 看 TypeScript error；或 `npm run build` 看 esbuild error。

**Q: 想徹底重來、清空 session**  
A: 刪除 `.claude/context/devteam/state.json` + `bootstrap-*.yaml` + `session-*.md` + `documents/`，保留資料夾結構。Dashboard 會自動 refresh 成空 state。

---

## Schema alignment

擴充寫的 `state.json` 必含欄位：

```jsonc
{
  "schema_version": 1,
  "session_id": "s-YYYYMMDD-<feature-slug>",
  "current_phase": "P0_DISCOVERY",
  "active_features": ["<feature-slug>"],
  "bootstrap_done": false,
  "ux_mode": null,
  "weak_areas": [],
  "freeze_gates": {
    "Gate1_PRD": "not_reached",
    "Gate2_UXFlow": "not_reached",
    "Gate3_SystemSpec": "not_reached",
    "Gate4_NFR_ADR": "not_reached",
    "Gate5a_API": "not_reached",
    "Gate5b_DBSchema": "not_reached",
    "Gate6_TestReady": "not_reached",
    "Gate7_Release": "not_reached"
  }
}
```

完整 schema 與 re-entry 規則見 [`devteam_knowledge_base/02_lifecycle_phases.md`](../devteam_knowledge_base/02_lifecycle_phases.md) 與 [`.claude/skills/devteam-router/SKILL.md`](../.claude/skills/devteam-router/SKILL.md).

---

## Known limitations

- File watcher 在 WSL / 網路磁碟可能失敗，Dashboard 有手動 Reload 按鈕
- 沒做 telemetry、Sentry、error reporting
- Decision Card / Document Editor panel 是 read-mostly，深度編輯仍建議直接編 markdown
- 沒做 multi-feature 並行 UX（`active_features[]` 支援 array 但 UI 預設顯示第一個）

---

## License & Contributing

本 extension 與 DevTeam Harness 同 repo 同授權。Issue / PR 歡迎，但本 MVP 階段優先收：

- Schema 不一致回報（extension 寫的 state.json vs CLI 讀的）
- Cursor / 不同 VS Code fork 相容性問題
- WSL / 跨平台 file watcher bug

---

**版本對齊**：`vscode-extension/package.json` 的 `version` 與 `.vsix` 檔名 suffix 一致；schema 演進時請同步 bump 並更新 `.claude/skills/devteam-router/SKILL.md` Phase 3a。
