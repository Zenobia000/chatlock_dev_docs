import * as vscode from 'vscode';
import { StateStore } from '../state/StateStore';
import { PHASE_BY_ID } from '../data/phaseCatalog';
import { GATE_BY_ID } from '../data/gateCatalog';
import { csp, escape, helpFor, nonce, pill } from '../panels/shared/htmlUtils';
import { COMMON_STYLES } from '../panels/shared/styles';
import { bodyClass } from '../config';

export class MissionControlViewProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = 'architectCopilot.missionControl';
  private view?: vscode.WebviewView;

  constructor(private store: StateStore) {
    store.on('changed', () => this.refresh());
  }

  resolveWebviewView(view: vscode.WebviewView): void {
    this.view = view;
    view.webview.options = { enableScripts: true };
    view.webview.html = this.render();
    view.webview.onDidReceiveMessage((m) => this.handle(m));
  }

  private refresh(): void {
    if (!this.view) return;
    this.view.webview.html = this.render();
  }

  private async handle(msg: { type: string }): Promise<void> {
    switch (msg.type) {
      case 'open-dashboard':
        vscode.commands.executeCommand('architectCopilot.openDashboard');
        break;
      case 'start-bootstrap':
        vscode.commands.executeCommand('architectCopilot.startBootstrap');
        break;
      case 'resolve-next':
        vscode.commands.executeCommand('architectCopilot.resolveNextDecision');
        break;
      case 'run-pm':
        vscode.commands.executeCommand('architectCopilot.runPM');
        break;
    }
  }

  private render(): string {
    if (!this.view) return '';
    const n = nonce();
    const cspStr = csp(this.view.webview.cspSource, n);
    const snap = this.store.snapshot();
    const state = snap.state;

    const cls = bodyClass();

    if (!state) {
      return wrap(cspStr, n, cls, `
        <div class="empty">
          <p class="empty-hint">No session yet.</p>
          <button data-act="start-bootstrap">Start Bootstrap Questionnaire</button>
        </div>
      `);
    }

    const phase = PHASE_BY_ID[state.current_phase];
    const phaseLabel = phase ? phase.label : state.current_phase;
    const pendingCount = state.pending_user_decisions.length;
    const feature = state.active_features[0] ?? '(no feature)';

    // find next gate (first non-frozen, non-not_reached gate by phase order)
    const gatesEntries = Object.entries(state.freeze_gates);
    const activeGate = gatesEntries.find(
      ([, s]) => s === 'ready_to_review' || s === 'in_review' || s === 'blocked'
    );
    const gateInfo = activeGate
      ? `${activeGate[0]} ${pill(activeGate[1], gateKind(activeGate[1]))}`
      : pill('all gates ready or done', 'good');

    const body = `
      <div class="mc-section">
        <div class="mc-label">FEATURE</div>
        <div class="mc-value"><code>${escape(feature)}</code></div>
      </div>
      <div class="mc-section">
        <div class="mc-label">PHASE</div>
        <div class="mc-value">${pill(phaseLabel, 'info')}</div>
      </div>
      <div class="mc-section">
        <div class="mc-label">ACTIVE GATE</div>
        <div class="mc-value">${gateInfo}</div>
      </div>
      <div class="mc-section">
        <div class="mc-label">DECISIONS</div>
        <div class="mc-value">
          ${pendingCount === 0 ? pill('none pending', 'good') : pill(`${pendingCount} pending`, 'warn')}
        </div>
      </div>
      <div class="mc-section">
        <div class="mc-label">UX MODE</div>
        <div class="mc-value">${pill(state.ux_mode ?? 'not set', state.ux_mode ? 'info' : 'pending')}</div>
      </div>

      <div class="mc-actions">
        <button data-act="open-dashboard">Open Pilot Dashboard</button>${helpFor('打開全螢幕 Pilot Dashboard — 看 Vertical Phase Timeline + Decisions + Recent Activity，是駕駛艙主介面。')}
        ${pendingCount > 0 ? `<button class="secondary" data-act="resolve-next">Resolve Next Decision</button>${helpFor('直接打開 pending list 第一筆 OQ 的 Decision Card。系統會提供推薦答案 + reasoning，一鍵 Approve 即可。')}` : ''}
        <button class="secondary" data-act="run-pm">Run /devteam-pm</button>${helpFor('在 terminal 啟動 PM driver — 會讀 bootstrap yaml 預填 PRD。會先彈確認對話框，按 Approve & Run 才執行。')}
      </div>
    `;

    return wrap(cspStr, n, cls, body);
  }
}

function wrap(cspStr: string, nonceVal: string, cls: string, body: string): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <meta http-equiv="Content-Security-Policy" content="${cspStr}" />
  <style>
    ${COMMON_STYLES}
    body { padding: 12px 14px; }
    .mc-section { margin-bottom: 10px; }
    .mc-label { font-size: 10px; color: var(--muted); text-transform: uppercase; letter-spacing: 0.6px; margin-bottom: 2px; }
    .mc-value { font-size: 13px; }
    .mc-actions { display: flex; flex-direction: column; gap: 6px; margin-top: 14px; }
    .mc-actions button { width: 100%; }
    .empty { padding: 12px 0; text-align: center; }
  </style>
</head>
<body class="${cls}">
  ${body}
  <script nonce="${nonceVal}">
    const vscode = acquireVsCodeApi();
    document.querySelectorAll('[data-act]').forEach((b) => {
      b.addEventListener('click', () => {
        vscode.postMessage({ type: b.getAttribute('data-act') });
      });
    });
  </script>
</body>
</html>`;
}

function gateKind(status: string): 'good' | 'warn' | 'bad' | 'pending' | 'info' {
  if (status === 'frozen') return 'good';
  if (status === 'ready_to_review' || status === 'in_review') return 'warn';
  if (status === 'blocked') return 'bad';
  return 'pending';
}
