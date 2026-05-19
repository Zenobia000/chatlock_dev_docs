import * as path from 'path';
import * as vscode from 'vscode';

/**
 * ════════════════════════════════════════════════════════════════════
 *  文件路徑慣例（重要！修改前先讀）
 * ════════════════════════════════════════════════════════════════════
 *
 *  "Doc relative path" (簡稱 docRelPath) =
 *    從專案根目錄起算的相對路徑，**必須包含 `docs/` 前綴**，永遠用 forward-slash。
 *
 *  ✅ 正確：
 *      `docs/prd/architect-copilot.md`
 *      `docs/governance/stakeholders.md`
 *      `docs/architecture/adr/ADR-001.md`
 *
 *  ❌ 錯誤：
 *      `prd/foo.md`          ← 缺 docs/ 前綴（v0.3.0–0.3.2 DocumentsTree bug）
 *      `./docs/prd/foo.md`   ← 不要 ./
 *      `D:\...\docs\prd\foo.md`  ← 絕對路徑
 *      `\\wsl$\Ubuntu\...`   ← 網路路徑
 *
 *  為什麼這樣設計：
 *  - `documents/index.json` 的 key 用此格式（PM driver / freeze 都用）
 *  - `.meta.json` 檔名用此格式 slug 化（`/` → `__`）
 *  - `snapshots/{slug}/` 子目錄用同一個 slug
 *  - 與 CLI side (`router`/`pm` skill) 的相對路徑慣例一致
 *  - 跨平台一致（不會因為 Windows backslash 出包）
 *
 *  Producers（產生 docRelPath 的地方）：
 *  - `DocumentsTree.getChildren` filesystem walk
 *  - `extension.ts:newDocFromTemplate` user input
 *  - `phaseCatalog.expectedDocs[].path`（含 `{feature}` placeholder）
 *  - `DecisionCardPanel` related files
 *  - `state/StateStore.listDocs` filesystem walk
 *
 *  Consumers（消費 docRelPath 的地方）：
 *  - `DocumentDetailPanel`/`DocumentEditorPanel`: `path.join(root, relPath)` → 絕對路徑
 *  - `snapshotStore.getSnapshotsForDoc`: 路徑 slug 化
 *  - `getDocMetaPath`: 路徑 slug 化
 *  - Dashboard placeholders: 用 `startsWith('docs/<subdir>/')` 過濾
 *
 *  修改任何 producer / consumer 之前，**先用 `toDocRelPath()` 與 `assertDocRelPath()`**。
 * ════════════════════════════════════════════════════════════════════
 */

/** 建立 canonical docRelPath。永遠 `docs/<subdir>/<filename>`。 */
export function toDocRelPath(subdir: string, filename: string): string {
  // strip leading `docs/` if accidentally passed in subdir (defensive)
  const cleanSubdir = subdir.replace(/^docs\//, '').replace(/^\/+|\/+$/g, '');
  return `docs/${cleanSubdir}/${filename}`;
}

/**
 * 驗證 docRelPath 是否符合慣例。
 * 開發階段：console.warn（不擋，方便 debug）。
 * 永遠回傳輸入值（call-site 可以 `const p = assertDocRelPath(x)` 鏈式用）。
 */
export function assertDocRelPath(p: string): string {
  if (!p.startsWith('docs/')) {
    console.warn(
      `[architect-copilot] non-canonical doc path: "${p}" — should start with "docs/". ` +
        `See state/paths.ts header for convention.`
    );
  }
  if (path.isAbsolute(p)) {
    console.warn(
      `[architect-copilot] absolute path passed as docRelPath: "${p}". ` +
        `Use forward-slash relative path from project root.`
    );
  }
  return p;
}

/** Slug used for .meta.json filename and snapshots/ subdirectory. Single source of truth. */
export function docPathSlug(docRelPath: string): string {
  return docRelPath.replace(/\//g, '__');
}

export function getProjectRoot(): string | undefined {
  const folders = vscode.workspace.workspaceFolders;
  if (!folders || folders.length === 0) return undefined;
  return folders[0].uri.fsPath;
}

export function getDevTeamContextDir(root: string): string {
  return path.join(root, '.claude', 'context', 'devteam');
}

export function getStatePath(root: string): string {
  return path.join(getDevTeamContextDir(root), 'state.json');
}

export function getBootstrapYamlPath(root: string, feature: string): string {
  return path.join(getDevTeamContextDir(root), `bootstrap-${feature}.yaml`);
}

export function getDocumentsIndexPath(root: string): string {
  return path.join(getDevTeamContextDir(root), 'documents', 'index.json');
}

export function getSessionReportPath(root: string, sessionId: string): string {
  return path.join(getDevTeamContextDir(root), `session-${sessionId}.md`);
}

export function getAdrLedgerPath(root: string): string {
  return path.join(getDevTeamContextDir(root), 'adr-ledger.json');
}

export function getReviewsDir(root: string): string {
  return path.join(getDevTeamContextDir(root), 'reviews');
}

export function getDocMetaPath(root: string, docRelPath: string): string {
  assertDocRelPath(docRelPath);
  return path.join(getDevTeamContextDir(root), 'documents', `${docPathSlug(docRelPath)}.meta.json`);
}

export function getDocsRoot(root: string): string {
  return path.join(root, 'docs');
}

export function getKbRoot(root: string): string {
  return path.join(root, 'devteam_knowledge_base');
}

export function getSnapshotsDir(root: string): string {
  return path.join(getDevTeamContextDir(root), 'snapshots');
}

export function getSnapshotsForDoc(root: string, docRelPath: string): string {
  assertDocRelPath(docRelPath);
  return path.join(getSnapshotsDir(root), docPathSlug(docRelPath));
}

export function getRoundtablesDir(root: string): string {
  return path.join(getDevTeamContextDir(root), 'roundtables');
}
