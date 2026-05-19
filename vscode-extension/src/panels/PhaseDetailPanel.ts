import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';
import { COMMON_STYLES } from './shared/styles';
import { csp, escape, helpFor, nonce, pill } from './shared/htmlUtils';
import { StateStore } from '../state/StateStore';
import { PHASE_BY_ID } from '../data/phaseCatalog';
import { GATES, GATE_BY_ID, gatesByPhase } from '../data/gateCatalog';
import { PERSONAS } from '../data/personaCatalog';
import { getDocsRoot } from '../state/paths';
import { bodyClass } from '../config';

export class PhaseDetailPanel {
  private static panels = new Map<string, PhaseDetailPanel>();
  private readonly panel: vscode.WebviewPanel;
  private disposables: vscode.Disposable[] = [];

  public static show(phaseId: string, store: StateStore, focusGate?: string): void {
    const existing = PhaseDetailPanel.panels.get(phaseId);
    if (existing) {
      existing.panel.reveal();
      return;
    }
    const panel = vscode.window.createWebviewPanel(
      'architectCopilot.phaseDetail',
      `Phase: ${phaseId}`,
      vscode.ViewColumn.Active,
      { enableScripts: true, retainContextWhenHidden: true }
    );
    PhaseDetailPanel.panels.set(phaseId, new PhaseDetailPanel(panel, phaseId, store, focusGate));
  }

  private constructor(
    panel: vscode.WebviewPanel,
    private phaseId: string,
    private store: StateStore,
    _focusGate?: string
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
    const phase = PHASE_BY_ID[this.phaseId];
    const state = this.store.snapshot().state;

    const cls = bodyClass();

    if (!phase) {
      return wrap(cspStr, n, cls, `<header class="portal-header"><h1>Unknown phase</h1></header>`);
    }

    const isCurrent = state?.current_phase === this.phaseId;
    const phaseGates = gatesByPhase(this.phaseId);
    const phasePersonas = PERSONAS.filter((p) => p.phaseIds.includes(this.phaseId));

    const body = `
      <header class="portal-header">
        <h1>${escape(phase.label)}</h1>
        ${isCurrent ? pill('current', 'info') : pill('not active', 'pending')}
        <span class="subtitle">${escape(phase.description)}</span>
      </header>

      <div class="grid grid-2">
        <div class="card">
          <h3>Drivers</h3>
          <div class="tags">
            ${phase.drivers.map((d) => `<span class="tag">${escape(d)} (driver)</span>`).join('')}
            ${(phase.parallelDrivers ?? []).map((d) => `<span class="tag">${escape(d)} (parallel)</span>`).join('')}
          </div>
        </div>
        <div class="card">
          <h3>Critique Personas</h3>
          <div class="tags">
            ${phasePersonas.map((p) => `<span class="tag" title="${escape(p.description)}">${escape(p.label)}</span>`).join('')}
          </div>
        </div>
      </div>

      <div class="card" style="margin-top: 14px;">
        <h3>Expected Artifacts</h3>
        <ul style="list-style: none; padding: 0; margin: 0;">
          ${phase.expectedDocs.map((d) => {
            const exists = docExists(this.store.getRoot(), d.path, state?.active_features[0]);
            return `<li style="padding: 6px 0; border-bottom: 1px dashed var(--border);">
              <code>${escape(d.path)}</code> ${exists ? pill('exists', 'good') : pill('pending', 'pending')}
              <div style="font-size: 12px; color: var(--muted); margin-top: 2px;">${escape(d.description)}</div>
            </li>`;
          }).join('')}
        </ul>
      </div>

      ${phaseGates.length > 0 ? `
      <div class="card" style="margin-top: 14px;">
        <h3>Freeze Gates (${phaseGates.length})</h3>
        ${phaseGates.map((g) => {
          const status = state?.freeze_gates[g.id] ?? 'not_reached';
          return `
            <div style="padding: 10px 0; border-bottom: 1px dashed var(--border);">
              <div style="display: flex; align-items: center; gap: 8px;">
                <strong>${escape(g.label)}</strong>
                ${pill(status, gateKind(status))}
              </div>
              <div style="font-size: 12px; color: var(--muted); margin: 4px 0;">${escape(g.description)}</div>
              <div style="font-size: 12px; margin-top: 6px;">
                <strong>Owner:</strong> ${escape(g.ownerRole)} •
                <strong>Required:</strong> ${g.requiredPersonas.map((p) => `<span class="tag">${escape(p)}</span>`).join(' ')}
              </div>
              <div style="margin-top: 8px;">
                <strong style="font-size: 12px;">Evidence checklist:</strong>
                <ul style="margin: 4px 0 0 16px; font-size: 12px;">
                  ${g.evidence.map((e) => `<li>${escape(e)}</li>`).join('')}
                </ul>
              </div>
              <div style="margin-top: 8px;">
                <button data-act="freeze-gate" data-arg="${escape(g.id)}">Freeze Gate</button>${helpFor(`凍結 ${g.id} — 觸發 multi-role critique（${g.requiredPersonas.join('+')} personas）。Gate evidence checklist 必須全綠才能 freeze 成功。`)}
                <button class="secondary" data-act="review-gate" data-arg="${escape(g.id)}">Run /devteam-review</button>${helpFor('輕量 review — 不正式 freeze，只跑一次 multi-role critique 看評語，可以反覆執行。適合迭代修改階段。')}
              </div>
            </div>
          `;
        }).join('')}
      </div>
      ` : ''}

      <div class="card" style="margin-top: 14px;">
        <h3>Next Actions</h3>
        <div style="display: flex; gap: 8px; flex-wrap: wrap;">
          ${phase.drivers.map((d) => `<button data-act="run-driver" data-arg="${escape(d)}">Run /${escape(d)}</button>${helpFor(`啟動 ${d} skill — 這是 ${escape(phase.label)} 的主導 driver。會在 terminal 跑（先彈確認對話框）。`)}`).join('')}
          ${(phase.parallelDrivers ?? []).map((d) => `<button class="secondary" data-act="run-driver" data-arg="${escape(d)}">Run /${escape(d)} (parallel)</button>${helpFor(`啟動 ${d} skill — 與主 driver 並行的子 skill，可同時跑增加產出速度。`)}`).join('')}
        </div>
      </div>
    `;

    return wrap(cspStr, n, cls, body);
  }

  private async handle(msg: { type: string; act?: string; arg?: string }): Promise<void> {
    if (msg.type !== 'action' || !msg.act) return;
    const terminal = vscode.window.activeTerminal ?? vscode.window.createTerminal('Architect Copilot');
    terminal.show();
    if (msg.act === 'run-driver' && msg.arg) {
      terminal.sendText(`claude /${msg.arg}`, false);
    } else if (msg.act === 'freeze-gate' && msg.arg) {
      terminal.sendText(`claude /devteam-freeze ${msg.arg}`, false);
    } else if (msg.act === 'review-gate' && msg.arg) {
      terminal.sendText(`claude /devteam-review ${msg.arg}`, false);
    }
  }

  public dispose(): void {
    PhaseDetailPanel.panels.delete(this.phaseId);
    this.panel.dispose();
    while (this.disposables.length) {
      const d = this.disposables.pop();
      if (d) d.dispose();
    }
  }
}

function docExists(root: string, pattern: string, feature?: string): boolean {
  let p = pattern.replace('{feature}', feature ?? '');
  if (p.includes('*')) {
    const dir = path.join(root, path.dirname(p));
    if (!fs.existsSync(dir)) return false;
    try {
      return fs.readdirSync(dir).some((f) => f.endsWith('.md') || f.endsWith('.yaml'));
    } catch {
      return false;
    }
  }
  return fs.existsSync(path.join(root, p));
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
    document.querySelectorAll('[data-act]').forEach((b) => {
      b.addEventListener('click', () => {
        vscode.postMessage({ type: 'action', act: b.getAttribute('data-act'), arg: b.getAttribute('data-arg') });
      });
    });
  </script>
</body>
</html>`;
}
