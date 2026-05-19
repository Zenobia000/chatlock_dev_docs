# Architect Copilot — VS Code Extension (MVP)

Junior Architect Copilot 的 VS Code / Cursor 擴充先行版。把既有 DevTeam Harness（11 phases / 12 personas / 7 freeze gates）的後端能力，包裝成 IDE-native 體驗。

## 此 MVP 包含

- ✅ **Bootstrap Questionnaire 面板** — 12 題分 6 組，每題附 "Why this matters" 教育卡。完成後產出 `bootstrap-<feature>.yaml` + 更新 `state.json`
- ✅ **Dashboard 面板** — phase / bootstrap 狀態 / UX mode / weak areas / freeze gates / documents 一覽
- ✅ **Run /devteam-pm** — 打開 terminal 帶入 `claude /devteam-pm`，把 PM 階段交給 Claude Code CLI（PRD 預填會自動讀剛產的 yaml）
- ✅ **檔案 watcher** — Dashboard 偵測 `.claude/context/devteam/` 變化自動 refresh

## 不包含（後續迭代）

- ❌ Decision Card panel（gate 時跳 2-3 trade-off）
- ❌ Drill-down Chat（Lane B/C 對話）
- ❌ Artifact Preview（C4 mermaid / OpenAPI swagger / ERD）
- ❌ Claude API 直連（目前透過 terminal 呼叫 Claude Code CLI）

## 安裝與啟動

### 1. 安裝依賴

```bash
cd vscode-extension
npm install
```

需要 Node.js ≥ 18。

### 2. 在 VS Code 開啟

```bash
code .
```

從 VS Code 開啟 `vscode-extension/` 目錄（注意：不是 Architecture_Autopilot 整個 repo）。

### 3. F5 啟動 Extension Development Host

按 `F5`，會跑 `npm: build` 然後開新的 VS Code 視窗（Extension Development Host）。  
該新視窗會自動載入 `Architecture_Autopilot` 主專案（透過 `launch.json` 的 `${workspaceFolder}/..` 參數）。

### 4. 觸發 commands

在 Extension Development Host 視窗：

- `Ctrl+Shift+P` → "Architect Copilot: Start Bootstrap Questionnaire"
- `Ctrl+Shift+P` → "Architect Copilot: Open Dashboard"
- `Ctrl+Shift+P` → "Architect Copilot: Run /devteam-pm in Terminal"

## 測試流程（建議順序）

1. 開啟 Dashboard — 看到當前 session 狀態（如果已有 `bootstrap-architect-copilot.yaml` 會直接看到 ✓ done）
2. 開啟 Bootstrap Questionnaire — 填 12 題，看 "Why this matters" 教育卡，按「產出 yaml」
3. 回到 Dashboard，自動 refresh，看 `bootstrap_done = true`、UX mode、weak areas
4. 按 "Run /devteam-pm in terminal" — 在 terminal 跑 Claude Code，PM 會自動進 Mode A 預填模式
5. PRD draft 寫到 `docs/prd/<feature>.md`

## 與 Claude Code CLI 的互通

擴充與 CLI **完全共用同一份 state**：

| 檔案 | 寫者 | 讀者 |
|:---|:---|:---|
| `.claude/context/devteam/state.json` | 兩邊都會寫 | 兩邊都讀 |
| `.claude/context/devteam/bootstrap-<feature>.yaml` | 擴充寫（也可被 `/devteam-bootstrap` skill 寫） | 兩邊都讀 |
| `.claude/context/devteam/session-<id>.md` | 兩邊都會 append | 兩邊都讀 |
| `.claude/context/devteam/documents/index.json` | PM driver 寫 | 擴充 Dashboard 讀 |

你可以隨時在 CLI 與擴充之間切換 — state 是 single source of truth。

## 已知限制

- File watcher 在 WSL / 網路磁碟可能失敗，Dashboard 有手動 Reload 按鈕
- VS Code 1.85+；Cursor 應該也支援（沿用 VS Code extension API）
- 沒做 telemetry、沒做 sentry、沒做 error reporting

## Schema 對齊

擴充寫的 `state.json` schema 與 `.claude/skills/devteam-router/SKILL.md` Phase 3a 一致：
`current_phase`、`active_features` (array)、`bootstrap_done` (flat flag)、`Gate5a_API` / `Gate5b_DBSchema`。

## 開發

```bash
npm run watch    # esbuild watch mode
npm run typecheck # tsc --noEmit
```

修改 `src/` 後在 Extension Development Host 視窗按 `Ctrl+R` 重載。
