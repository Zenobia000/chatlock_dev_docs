import * as vscode from 'vscode';
import { StateStore } from '../state/StateStore';
import { PHASE_BY_ID } from '../data/phaseCatalog';

export class StatusBarItem {
  private item: vscode.StatusBarItem;
  private disposables: vscode.Disposable[] = [];

  constructor(private store: StateStore) {
    this.item = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
    this.item.command = 'architectCopilot.openDashboard';
    this.item.tooltip = 'Architect Copilot — click to open Pilot Dashboard';
    this.refresh();
    this.item.show();
    const onChange = () => this.refresh();
    this.store.on('changed', onChange);
    this.disposables.push({ dispose: () => this.store.off('changed', onChange) });
  }

  private refresh(): void {
    const snap = this.store.snapshot();
    const state = snap.state;
    if (!state) {
      this.item.text = '$(rocket) Architect Copilot: no session';
      return;
    }
    const phase = PHASE_BY_ID[state.current_phase];
    const phaseLabel = phase?.shortLabel ?? state.current_phase;
    const pendingCount = state.pending_user_decisions.length;
    const activeGate = Object.entries(state.freeze_gates).find(
      ([, s]) => s === 'ready_to_review' || s === 'in_review'
    );
    const gateBit = activeGate ? ` $(eye) ${activeGate[0]}` : '';
    const decBit = pendingCount > 0 ? ` $(warning) ${pendingCount}` : '';
    this.item.text = `$(rocket) ${phaseLabel}${gateBit}${decBit}`;
  }

  dispose(): void {
    this.item.dispose();
    while (this.disposables.length) {
      const d = this.disposables.pop();
      if (d) d.dispose();
    }
  }
}
