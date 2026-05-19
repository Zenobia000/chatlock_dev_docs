import * as fs from 'fs';
import * as vscode from 'vscode';
import { getDashboardHtml, PilotDashboardData } from './webviewHtml';
import { getBootstrapYamlPath, getStatePath } from '../state/paths';
import { StateStore } from '../state/StateStore';
import { bodyClass } from '../config';

export class DashboardPanel {
  public static current: DashboardPanel | undefined;
  private readonly panel: vscode.WebviewPanel;
  private disposables: vscode.Disposable[] = [];

  public static show(store: StateStore): void {
    if (DashboardPanel.current) {
      DashboardPanel.current.panel.reveal();
      DashboardPanel.current.refresh();
      return;
    }
    const panel = vscode.window.createWebviewPanel(
      'architectCopilot.dashboard',
      'Architect Copilot — Pilot Dashboard',
      vscode.ViewColumn.Active,
      { enableScripts: true, retainContextWhenHidden: true }
    );
    DashboardPanel.current = new DashboardPanel(panel, store);
  }

  private constructor(panel: vscode.WebviewPanel, private store: StateStore) {
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
    const snap = this.store.snapshot();
    const root = this.store.getRoot();
    const state = snap.state;
    const feature = state?.active_features[0] ?? null;
    const hasBootstrapYaml = feature ? fs.existsSync(getBootstrapYamlPath(root, feature)) : false;
    const data: PilotDashboardData = {
      state,
      documents: snap.documents,
      hasBootstrapYaml,
      feature,
      recentHistory: state?.phase_history ?? [],
      bodyClass: bodyClass(),
    };
    return getDashboardHtml(this.panel.webview.cspSource, data);
  }

  private async handle(msg: { type: string; action?: string; arg?: string }): Promise<void> {
    if (msg.type !== 'action' || !msg.action) return;
    switch (msg.action) {
      case 'start-bootstrap':
        vscode.commands.executeCommand('architectCopilot.startBootstrap');
        break;
      case 'resolve-next':
        vscode.commands.executeCommand('architectCopilot.resolveNextDecision');
        break;
      case 'open-decision':
        if (msg.arg) vscode.commands.executeCommand('architectCopilot.openDecisionCard', msg.arg);
        break;
      case 'open-phase':
        if (msg.arg) vscode.commands.executeCommand('architectCopilot.openPhaseDetail', msg.arg);
        break;
      case 'run-driver':
        if (msg.arg) vscode.commands.executeCommand('architectCopilot.runDriver', msg.arg);
        break;
      case 'freeze-gate':
        if (msg.arg) vscode.commands.executeCommand('architectCopilot.freezeGate', msg.arg);
        break;
      case 'run-pm':
        vscode.commands.executeCommand('architectCopilot.runPM');
        break;
      case 'run-freeze':
        vscode.commands.executeCommand('architectCopilot.freezeActiveGate');
        break;
      case 'open-state':
        await openFile(getStatePath(this.store.getRoot()));
        break;
      case 'reload':
        this.store.refresh();
        this.refresh();
        break;
    }
  }

  public dispose(): void {
    DashboardPanel.current = undefined;
    this.panel.dispose();
    while (this.disposables.length) {
      const d = this.disposables.pop();
      if (d) d.dispose();
    }
  }
}

async function openFile(p: string): Promise<void> {
  try {
    const doc = await vscode.workspace.openTextDocument(p);
    await vscode.window.showTextDocument(doc);
  } catch (e) {
    vscode.window.showErrorMessage(`Cannot open ${p}: ${(e as Error).message}`);
  }
}
