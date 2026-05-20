import * as vscode from 'vscode';
import { marked } from 'marked';
import markedAlert from 'marked-alert';

// Idempotent — marked.use accumulates extensions but calling twice is harmless.
marked.use(markedAlert());
import { COMMON_STYLES } from './shared/styles';
import { csp, escape, nonce, pill } from './shared/htmlUtils';
import { StateStore } from '../state/StateStore';
import { readRoundtableMom } from '../state/reader';
import { RoundtableMom } from '../state/types';
import { bodyClass } from '../config';

export class RoundtableDetailPanel {
  private static panels = new Map<string, RoundtableDetailPanel>();
  private readonly panel: vscode.WebviewPanel;
  private disposables: vscode.Disposable[] = [];

  public static show(filename: string, store: StateStore): void {
    const existing = RoundtableDetailPanel.panels.get(filename);
    if (existing) {
      existing.panel.reveal();
      return;
    }
    const panel = vscode.window.createWebviewPanel(
      'architectCopilot.roundtable',
      `Roundtable: ${filename}`,
      vscode.ViewColumn.Active,
      { enableScripts: true, retainContextWhenHidden: true }
    );
    RoundtableDetailPanel.panels.set(filename, new RoundtableDetailPanel(panel, filename, store));
  }

  private constructor(panel: vscode.WebviewPanel, private filename: string, private store: StateStore) {
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
    const cls = bodyClass();
    const mom = readRoundtableMom(this.store.getRoot(), this.filename);

    if (!mom) {
      return wrap(cspStr, n, cls, `
        <header class="portal-header"><h1>Roundtable not found</h1></header>
        <p class="empty-hint">Cannot read roundtable MoM <code>${escape(this.filename)}</code>.</p>
      `);
    }

    const linkedOq = mom.related_decision;
    const state = this.store.snapshot().state;
    const oqStillPending =
      linkedOq && state?.pending_user_decisions.some((d) => d.id === linkedOq);

    const body = `
      <header class="portal-header">
        <h1>💬 ${escape(mom.topic)}</h1>
        ${pill('Roundtable MoM', 'info')}
        ${linkedOq ? `<span class="subtitle">linked to <code>${escape(linkedOq)}</code></span>` : ''}
      </header>

      ${linkedOq && oqStillPending ? `
        <div class="card" style="margin-bottom: 16px; border-color: var(--good);">
          <h3 style="color: var(--good);">✓ Apply this Roundtable's conclusions to ${escape(linkedOq)}</h3>
          <p class="empty-hint">${escape(linkedOq)} is still pending. Click below to pre-fill its resolution with the Decisions section below.</p>
          <button data-act="apply-to-oq" data-arg="${escape(linkedOq)}">Apply to ${escape(linkedOq)}</button>
        </div>
      ` : ''}
      ${linkedOq && !oqStillPending ? `
        <div class="card" style="margin-bottom: 16px;">
          <p class="empty-hint">Linked decision <code>${escape(linkedOq)}</code> is already resolved (or not found).</p>
        </div>
      ` : ''}

      <div class="grid grid-2">
        <div class="card">
          <h3>Executive Summary</h3>
          <p style="margin: 0; white-space: pre-wrap;">${escape(mom.executive_summary || '(no summary)')}</p>
        </div>
        <div class="card">
          <h3>Decisions</h3>
          ${mom.decisions.length === 0 ? '<p class="empty-hint">(none)</p>' :
            `<ul style="margin: 0; padding-left: 20px;">${mom.decisions.map((d) => `<li>${escape(d)}</li>`).join('')}</ul>`}
        </div>
      </div>

      <div class="grid grid-2" style="margin-top: 14px;">
        <div class="card">
          <h3>Action Items</h3>
          ${mom.action_items.length === 0 ? '<p class="empty-hint">(none)</p>' :
            `<ul style="margin: 0; padding-left: 20px;">${mom.action_items.map((a) => `<li>${escape(a)}</li>`).join('')}</ul>`}
        </div>
        <div class="card">
          <h3>Open Questions</h3>
          ${mom.open_questions.length === 0 ? '<p class="empty-hint">(none — all decided)</p>' :
            `<ul style="margin: 0; padding-left: 20px;">${mom.open_questions.map((q) => `<li>${escape(q)}</li>`).join('')}</ul>`}
        </div>
      </div>

      <div class="card" style="margin-top: 14px;">
        <h3>Full MoM (rendered)</h3>
        <div class="md-rendered" style="max-height: 500px; overflow-y: auto;">${(() => {
          try {
            return marked.parse(mom.raw_markdown, { gfm: true, breaks: false, async: false }) as string;
          } catch {
            return `<pre class="md-raw">${escape(mom.raw_markdown)}</pre>`;
          }
        })()}</div>
        <div style="margin-top: 8px;">
          <button class="secondary" data-act="open-raw">Open raw .md in editor</button>
        </div>
      </div>
    `;

    return wrap(cspStr, n, cls, body);
  }

  private async handle(msg: { type: string; act?: string; arg?: string }): Promise<void> {
    if (msg.type !== 'action' || !msg.act) return;
    if (msg.act === 'apply-to-oq' && msg.arg) {
      const mom = readRoundtableMom(this.store.getRoot(), this.filename);
      if (!mom) return;
      const seedText = [
        `來自 Roundtable: ${this.filename}`,
        '',
        '【Decisions】',
        ...mom.decisions.map((d) => `- ${d}`),
        '',
        '【Action Items】',
        ...mom.action_items.map((a) => `- ${a}`),
      ].join('\n');
      // open Decision Card with pre-filled resolution text
      vscode.commands.executeCommand('architectCopilot.openDecisionCard', msg.arg, {
        prefillText: seedText,
        prefillSourceFile: this.filename,
      });
      this.panel.dispose();
    } else if (msg.act === 'open-raw') {
      const mom = readRoundtableMom(this.store.getRoot(), this.filename);
      if (!mom) return;
      const doc = await vscode.workspace.openTextDocument(mom.file_path);
      await vscode.window.showTextDocument(doc);
    }
  }

  public dispose(): void {
    RoundtableDetailPanel.panels.delete(this.filename);
    this.panel.dispose();
    while (this.disposables.length) {
      const d = this.disposables.pop();
      if (d) d.dispose();
    }
  }
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
    document.querySelectorAll('[data-act]').forEach((b) => {
      b.addEventListener('click', () => {
        vscode.postMessage({ type: 'action', act: b.getAttribute('data-act'), arg: b.getAttribute('data-arg') });
      });
    });
  </script>
</body>
</html>`;
}
