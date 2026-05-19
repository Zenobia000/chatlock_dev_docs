import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';
import { COMMON_STYLES } from './shared/styles';
import { csp, escape, nonce } from './shared/htmlUtils';
import { StateStore } from '../state/StateStore';
import { readMarkdown } from '../state/reader';
import { createSnapshot } from '../state/snapshotStore';
import { bodyClass } from '../config';

export class DocumentEditorPanel {
  private static panels = new Map<string, DocumentEditorPanel>();
  private readonly panel: vscode.WebviewPanel;
  private disposables: vscode.Disposable[] = [];
  private currentContent: string;

  public static show(relPath: string, store: StateStore): void {
    const existing = DocumentEditorPanel.panels.get(relPath);
    if (existing) {
      existing.panel.reveal();
      return;
    }
    const panel = vscode.window.createWebviewPanel(
      'architectCopilot.documentEditor',
      `Edit: ${path.basename(relPath)}`,
      vscode.ViewColumn.Active,
      { enableScripts: true, retainContextWhenHidden: true }
    );
    DocumentEditorPanel.panels.set(relPath, new DocumentEditorPanel(panel, relPath, store));
  }

  private constructor(
    panel: vscode.WebviewPanel,
    private relPath: string,
    private store: StateStore
  ) {
    this.panel = panel;
    const abs = path.join(this.store.getRoot(), this.relPath);
    this.currentContent = readMarkdown(abs) ?? '';
    this.refresh();
    this.panel.onDidDispose(() => this.dispose(), null, this.disposables);
    this.panel.webview.onDidReceiveMessage((m) => this.handle(m), null, this.disposables);
  }

  private refresh(): void {
    this.panel.webview.html = this.render();
  }

  private render(): string {
    const n = nonce();
    const cspStr = csp(this.panel.webview.cspSource, n);
    const cls = bodyClass();
    const body = `
      <header class="portal-header">
        <h1>✏ ${escape(path.basename(this.relPath))}</h1>
        <span class="subtitle"><code>${escape(this.relPath)}</code></span>
        <span class="subtitle">unsaved changes are kept in memory until you Save or Cancel</span>
      </header>

      <div style="display: flex; gap: 8px; margin-bottom: 12px;">
        <button data-act="save">💾 Save (creates v+1 snapshot)</button>
        <button class="secondary" data-act="cancel">Cancel (discard changes)</button>
        <span class="empty-hint" id="status">draft</span>
      </div>

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; height: calc(100vh - 200px);">
        <div class="card" style="padding: 0; overflow: hidden;">
          <div style="padding: 8px 12px; background: rgba(127,127,127,0.05); border-bottom: 1px solid var(--border); font-size: 11px; color: var(--muted);">EDITOR (raw markdown)</div>
          <textarea id="editor" style="width: 100%; height: calc(100% - 33px); padding: 12px; background: var(--input-bg); color: var(--input-fg); border: none; resize: none; font-family: var(--vscode-editor-font-family); font-size: 13px; line-height: 1.55;">${escape(this.currentContent)}</textarea>
        </div>
        <div class="card" style="padding: 0; overflow: hidden;">
          <div style="padding: 8px 12px; background: rgba(127,127,127,0.05); border-bottom: 1px solid var(--border); font-size: 11px; color: var(--muted);">LIVE PREVIEW (raw, no rendering)</div>
          <pre id="preview" style="margin: 0; padding: 12px; height: calc(100% - 33px); overflow-y: auto; white-space: pre-wrap; word-break: break-word; font-family: var(--vscode-editor-font-family); font-size: 12px; background: var(--bg);"></pre>
        </div>
      </div>
    `;
    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <meta http-equiv="Content-Security-Policy" content="${cspStr}" />
  <style>${COMMON_STYLES}</style>
</head>
<body class="${cls}">
  ${body}
  <script nonce="${n}">
    const vscode = acquireVsCodeApi();
    const editor = document.getElementById('editor');
    const preview = document.getElementById('preview');
    const status = document.getElementById('status');
    let dirty = false;

    function updatePreview() {
      preview.textContent = editor.value;
      if (!dirty) {
        dirty = true;
        status.textContent = '● unsaved';
        status.style.color = 'var(--warn)';
      }
    }
    editor.addEventListener('input', updatePreview);
    updatePreview();

    document.querySelectorAll('[data-act]').forEach((b) => {
      b.addEventListener('click', () => {
        const act = b.getAttribute('data-act');
        if (act === 'save') {
          vscode.postMessage({ type: 'save', content: editor.value });
        } else if (act === 'cancel') {
          if (!dirty || confirm('放棄未儲存的修改？')) {
            vscode.postMessage({ type: 'cancel' });
          }
        }
      });
    });
  </script>
</body>
</html>`;
  }

  private async handle(msg: { type: string; content?: string }): Promise<void> {
    if (msg.type === 'cancel') {
      this.panel.dispose();
      return;
    }
    if (msg.type !== 'save' || msg.content === undefined) return;

    const root = this.store.getRoot();
    const abs = path.join(root, this.relPath);
    fs.mkdirSync(path.dirname(abs), { recursive: true });
    fs.writeFileSync(abs, msg.content, 'utf-8');
    const snap = createSnapshot({
      root,
      docPath: this.relPath,
      content: msg.content,
      source: 'vscode-editor',
    });
    vscode.window.showInformationMessage(
      `✓ Saved ${path.basename(this.relPath)} (snapshot v${snap.version})`
    );
    this.store.refresh();
    this.currentContent = msg.content;
    this.refresh();
  }

  public dispose(): void {
    DocumentEditorPanel.panels.delete(this.relPath);
    this.panel.dispose();
    while (this.disposables.length) {
      const d = this.disposables.pop();
      if (d) d.dispose();
    }
  }
}
