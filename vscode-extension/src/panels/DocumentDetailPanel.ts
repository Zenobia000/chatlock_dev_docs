import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';
import { marked } from 'marked';
import { COMMON_STYLES } from './shared/styles';
import { csp, escape, helpFor, nonce, pill, truncate } from './shared/htmlUtils';
import { StateStore } from '../state/StateStore';
import { readMarkdown } from '../state/reader';
import { DocIndexEntry, DocMeta, Snapshot } from '../state/types';
import { listSnapshots, restoreSnapshot, archiveDocument } from '../state/snapshotStore';
import { getSnapshotsForDoc } from '../state/paths';
import { bodyClass } from '../config';

export class DocumentDetailPanel {
  private static panels = new Map<string, DocumentDetailPanel>();
  private readonly panel: vscode.WebviewPanel;
  private disposables: vscode.Disposable[] = [];
  private currentTab: 'preview' | 'metadata' | 'cascade' | 'review' | 'history' = 'preview';
  private previewMode: 'rendered' | 'raw' = 'rendered';

  public static show(relPath: string, store: StateStore): void {
    const key = relPath;
    const existing = DocumentDetailPanel.panels.get(key);
    if (existing) {
      existing.panel.reveal();
      return;
    }
    const panel = vscode.window.createWebviewPanel(
      'architectCopilot.documentDetail',
      `Doc: ${path.basename(relPath)}`,
      vscode.ViewColumn.Active,
      { enableScripts: true, retainContextWhenHidden: true }
    );
    DocumentDetailPanel.panels.set(key, new DocumentDetailPanel(panel, relPath, store));
  }

  private constructor(
    panel: vscode.WebviewPanel,
    private relPath: string,
    private store: StateStore
  ) {
    this.panel = panel;
    this.refresh();
    this.panel.onDidDispose(() => this.dispose(), null, this.disposables);
    this.panel.webview.onDidReceiveMessage((m) => this.handle(m), null, this.disposables);
    const onChange = () => this.refresh();
    this.store.on('changed', onChange);
    this.disposables.push({ dispose: () => this.store.off('changed', onChange) });
  }

  private refresh(): void {
    this.panel.webview.html = this.render();
  }

  private render(): string {
    const n = nonce();
    const cspStr = csp(this.panel.webview.cspSource, n);
    const indexEntry: DocIndexEntry = this.store.snapshot().documents[this.relPath] ?? {};
    const meta: DocMeta | null = this.store.getDocMeta(this.relPath);
    const absPath = path.join(this.store.getRoot(), this.relPath);
    const fileContent = readMarkdown(absPath);

    const tabBtn = (id: typeof this.currentTab, label: string) =>
      `<button class="${id === this.currentTab ? '' : 'secondary'}" data-tab="${id}">${label}</button>`;

    const body = `
      <header class="portal-header">
        <h1>📄 ${escape(path.basename(this.relPath))}</h1>
        <span class="subtitle"><code>${escape(this.relPath)}</code></span>
        ${pill(`v${indexEntry.version ?? '?'}`, 'info')}
        ${pill(indexEntry.status ?? 'unknown', docStatusKind(indexEntry.status))}
        ${indexEntry.gate1_status ? pill(indexEntry.gate1_status, gateKind(indexEntry.gate1_status)) : ''}
      </header>

      <div style="display: flex; gap: 6px; margin-bottom: 16px; flex-wrap: wrap;">
        ${tabBtn('preview', 'Preview')}
        ${tabBtn('history', 'History (Snapshots)')}
        ${tabBtn('metadata', 'Metadata')}
        ${tabBtn('cascade', 'Cascade Impact')}
        ${tabBtn('review', 'Review History')}
        <span style="flex: 1;"></span>
        <button data-act="edit">✏ Edit (Save = new snapshot)</button>${helpFor('在 UI 內開 Markdown 編輯器（左右分欄：raw + preview）。Save 自動建一筆 snapshot（版本 +1）。隨時可從 History tab 回滾。')}
        <button class="secondary" data-act="open-editor">Open in raw editor</button>${helpFor('用 VS Code 內建編輯器打開檔案。適合做大量修改、用 keyboard shortcut、貼 code。注意：VS Code 編輯器存檔不會自動建 snapshot，rollback 軌跡會斷。建議用 UI Edit 走 snapshot 流程。')}
        <button class="danger" data-act="archive">🗑 Archive</button>${helpFor('軟刪除：檔案從 docs/ 消失，但會留一份副本在 snapshots/{slug}/.archived-{timestamp}.md 可以叫回來。不刪 snapshot 歷史。')}
      </div>

      ${this.renderTabContent(this.currentTab, fileContent, indexEntry, meta)}
    `;

    return wrap(cspStr, n, bodyClass(), body);
  }

  private renderTabContent(
    tab: typeof this.currentTab,
    fileContent: string | null,
    indexEntry: DocIndexEntry,
    meta: DocMeta | null
  ): string {
    if (tab === 'history') {
      const snapshots = listSnapshots(this.store.getRoot(), this.relPath);
      if (snapshots.length === 0) {
        return `<div class="card"><h3>Snapshot History</h3><p class="empty-hint">No snapshots yet. UI 編輯後會自動產生 v1 snapshot。</p></div>`;
      }
      return `
        <div class="card">
          <h3>Snapshot History (${snapshots.length})</h3>
          <p class="empty-hint" style="margin-top: 0;">每次 UI 編輯都會建一個 snapshot。可以選任意舊版 Restore 回去（也會記為新 snapshot，原版不刪）。最多保留 10 個，更舊的搬到 .pruned-archive。</p>
          <ul style="list-style: none; padding: 0; margin: 12px 0 0;">
            ${snapshots.map((s) => `
              <li style="padding: 10px; border: 1px solid var(--border); border-radius: 4px; margin-bottom: 6px; display: flex; align-items: center; gap: 10px;">
                <div style="flex: 1;">
                  <div><strong>v${s.version}</strong> ${pill(s.source, snapSourceKind(s.source))} <span class="empty-hint">${escape(s.timestamp)}</span></div>
                  <div class="empty-hint" style="font-size: 11px; margin-top: 2px;">${escape(s.filename)} • ${s.size} bytes</div>
                </div>
                <button class="secondary" data-act="preview-snapshot" data-arg="${escape(s.filename)}">Preview</button>${helpFor('用 VS Code 編輯器打開這個 snapshot 檔案的內容，跟當前版本對照看。')}
                <button data-act="restore-snapshot" data-arg="${escape(s.filename)}">↶ Restore</button>${helpFor('把這個 snapshot 的內容寫回當前檔案。**目前內容會先被存成新 snapshot**（不會丟），然後覆蓋。等於做 git revert，但永遠多保留一份備份。')}
              </li>
            `).join('')}
          </ul>
        </div>`;
    }
    if (tab === 'preview') {
      if (!fileContent) return `<div class="card"><p class="empty-hint">File not found (可能已 archive)。</p></div>`;

      const isYaml = this.relPath.endsWith('.yaml') || this.relPath.endsWith('.yml');
      const showRendered = this.previewMode === 'rendered' && !isYaml;

      const toggleBtn = isYaml
        ? '<span class="empty-hint" style="font-size: 11px;">YAML — raw only</span>'
        : `<button class="secondary" data-act="toggle-preview-mode" style="padding: 4px 10px; font-size: 11px;">
             ${showRendered ? 'Show raw markdown' : 'Show rendered'}
           </button>`;

      let body = '';
      if (showRendered) {
        try {
          const html = marked.parse(fileContent, {
            gfm: true,
            breaks: false,
            async: false,
          }) as string;
          body = `<div class="md-rendered">${html}</div>`;
        } catch (e) {
          body = `<p class="empty-hint">Markdown render failed: ${escape((e as Error).message)}. Falling back to raw.</p>
                  <pre class="md-raw">${escape(fileContent)}</pre>`;
        }
      } else {
        const truncated = truncate(fileContent, 12000);
        body = `<pre class="md-raw">${escape(truncated)}${fileContent.length > 12000 ? '\n\n[…truncated, click "Open in raw editor" for full content…]' : ''}</pre>`;
      }

      return `
        <div class="card">
          <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 8px;">
            <h3 style="margin: 0;">Preview</h3>
            <span class="empty-hint" style="font-size: 11px;">${showRendered ? '(rendered HTML)' : '(raw markdown)'}</span>
            <span style="flex: 1;"></span>
            ${toggleBtn}
          </div>
          ${body}
        </div>`;
    }
    if (tab === 'metadata') {
      return `
        <div class="card">
          <h3>Index Entry</h3>
          <dl class="kv">
            ${Object.entries(indexEntry).map(([k, v]) => `<dt>${escape(k)}</dt><dd>${escape(formatVal(v))}</dd>`).join('')}
          </dl>
        </div>
        ${meta ? `
        <div class="card" style="margin-top: 12px;">
          <h3>Meta file</h3>
          <dl class="kv">
            <dt>owner_role</dt><dd>${escape(meta.owner_role ?? '')}</dd>
            <dt>review_personas</dt><dd>${(meta.review_personas ?? []).map((p) => `<span class="tag">${escape(p)}</span>`).join('')}</dd>
            <dt>downstream_deps</dt><dd>${(meta.downstream_deps ?? []).length} 個</dd>
            <dt>upstream_refs</dt><dd>${(meta.upstream_refs ?? []).length} 個</dd>
            <dt>version_history</dt><dd>${(meta.version_history ?? []).length} entries</dd>
          </dl>
        </div>
        ` : `<div class="card" style="margin-top: 12px;"><p class="empty-hint">No .meta.json file yet (driver skill 還沒寫)</p></div>`}
      `;
    }
    if (tab === 'cascade') {
      if (!meta || !meta.downstream_deps?.length) {
        return `<div class="card"><h3>Cascade Impact</h3><p class="empty-hint">No downstream dependencies recorded (或 meta 檔不存在).</p></div>`;
      }
      const isFrozen = indexEntry.status === 'frozen';
      return `
        <div class="card">
          <h3>${isFrozen ? '🔒' : '📝'} Downstream Dependencies (${meta.downstream_deps.length})</h3>
          ${isFrozen ? '<p style="color: var(--warn);">⚠ 本文件已 frozen。修改 = 寫 DR + 下列文件標 stale。</p>' : '<p class="empty-hint">本文件未 frozen，修改不會觸發 cascade。</p>'}
          <ul class="docs-list" style="list-style: none; padding: 0; margin: 12px 0 0;">
            ${meta.downstream_deps.map((d) => `<li style="padding: 4px 0;"><code>${escape(d)}</code></li>`).join('')}
          </ul>
        </div>`;
    }
    // review tab
    const reviews = meta?.review_history ?? [];
    if (reviews.length === 0) {
      return `<div class="card"><h3>Review History</h3><p class="empty-hint">No reviews yet.</p></div>`;
    }
    return `
      <div class="card">
        <h3>Review History (${reviews.length})</h3>
        <ul style="list-style: none; padding: 0;">
          ${reviews.map((r) => `
            <li style="padding: 8px 0; border-bottom: 1px dashed var(--border);">
              <span class="tag">${escape(r.persona)}</span>
              ${pill(r.verdict, r.verdict === 'pass' ? 'good' : r.verdict === 'block' ? 'bad' : 'warn')}
              <span class="empty-hint" style="font-size: 11px;">${escape(r.at)}</span>
              ${r.report ? `<div style="margin-top: 4px; font-size: 12px;"><code>${escape(r.report)}</code></div>` : ''}
            </li>
          `).join('')}
        </ul>
      </div>`;
  }

  private async handle(msg: { type: string; tab?: string; act?: string; arg?: string }): Promise<void> {
    if (msg.type === 'tab' && msg.tab) {
      this.currentTab = msg.tab as any;
      this.refresh();
      return;
    }
    if (msg.type !== 'action' || !msg.act) return;

    switch (msg.act) {
      case 'toggle-preview-mode':
        this.previewMode = this.previewMode === 'rendered' ? 'raw' : 'rendered';
        this.refresh();
        break;
      case 'open-editor': {
        const abs = path.join(this.store.getRoot(), this.relPath);
        if (fs.existsSync(abs)) {
          const doc = await vscode.workspace.openTextDocument(abs);
          await vscode.window.showTextDocument(doc);
        }
        break;
      }
      case 'edit':
        vscode.commands.executeCommand('architectCopilot.editDocument', this.relPath);
        break;
      case 'archive': {
        const confirm = await vscode.window.showWarningMessage(
          `Archive ${path.basename(this.relPath)}? 檔案會從 docs/ 移除（但會留快照副本，可以再叫回來）。`,
          { modal: true },
          'Archive'
        );
        if (confirm !== 'Archive') return;
        const result = archiveDocument({ root: this.store.getRoot(), docPath: this.relPath });
        if (!result.ok) {
          vscode.window.showErrorMessage(`Archive failed: ${result.error}`);
          return;
        }
        vscode.window.showInformationMessage(`📦 Archived to ${result.archivedTo}`);
        this.store.refresh();
        this.panel.dispose();
        break;
      }
      case 'restore-snapshot': {
        if (!msg.arg) return;
        const confirm = await vscode.window.showWarningMessage(
          `Restore snapshot ${msg.arg}? 目前內容會被覆蓋（但會先存為新 snapshot 不會丟）。`,
          { modal: true },
          'Restore'
        );
        if (confirm !== 'Restore') return;
        const result = restoreSnapshot({
          root: this.store.getRoot(),
          docPath: this.relPath,
          filename: msg.arg,
        });
        if (!result.ok) {
          vscode.window.showErrorMessage(`Restore failed: ${result.error}`);
          return;
        }
        vscode.window.showInformationMessage(`↶ Restored ${msg.arg} (now v${result.restoredVersion}).`);
        this.store.refresh();
        this.refresh();
        break;
      }
      case 'preview-snapshot': {
        if (!msg.arg) return;
        const snapPath = path.join(
          getSnapshotsForDoc(this.store.getRoot(), this.relPath),
          msg.arg
        );
        if (fs.existsSync(snapPath)) {
          const doc = await vscode.workspace.openTextDocument(snapPath);
          await vscode.window.showTextDocument(doc, vscode.ViewColumn.Beside);
        }
        break;
      }
    }
  }

  public dispose(): void {
    DocumentDetailPanel.panels.delete(this.relPath);
    this.panel.dispose();
    while (this.disposables.length) {
      const d = this.disposables.pop();
      if (d) d.dispose();
    }
  }
}

function formatVal(v: unknown): string {
  if (v === null || v === undefined) return '';
  if (Array.isArray(v)) return v.length === 0 ? '(empty)' : v.join(', ');
  if (typeof v === 'object') return JSON.stringify(v);
  return String(v);
}

function docStatusKind(s?: string): 'good' | 'warn' | 'bad' | 'pending' | 'info' {
  if (s === 'frozen') return 'good';
  if (s === 'reviewed') return 'info';
  if (s === 'draft') return 'warn';
  return 'pending';
}

function snapSourceKind(source: string): 'good' | 'warn' | 'bad' | 'pending' | 'info' {
  if (source === 'vscode-restore') return 'warn';
  if (source === 'vscode-editor' || source === 'vscode-create') return 'info';
  return 'pending';
}

function gateKind(s: string): 'good' | 'warn' | 'bad' | 'pending' | 'info' {
  if (s === 'frozen') return 'good';
  if (s === 'ready_to_review' || s === 'in_review') return 'warn';
  if (s === 'blocked') return 'bad';
  return 'pending';
}

function wrap(cspStr: string, nonceVal: string, cls: string, body: string): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <meta http-equiv="Content-Security-Policy" content="${cspStr}" />
  <style>${COMMON_STYLES}</style>
</head>
<body class="${cls}">
  ${body}
  <script nonce="${nonceVal}">
    const vscode = acquireVsCodeApi();
    document.querySelectorAll('[data-tab]').forEach((b) => {
      b.addEventListener('click', () => vscode.postMessage({ type: 'tab', tab: b.getAttribute('data-tab') }));
    });
    document.querySelectorAll('[data-act]').forEach((b) => {
      b.addEventListener('click', () => vscode.postMessage({ type: 'action', act: b.getAttribute('data-act') }));
    });
  </script>
</body>
</html>`;
}
