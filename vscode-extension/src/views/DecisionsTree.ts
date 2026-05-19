import * as vscode from 'vscode';
import { StateStore } from '../state/StateStore';
import { PendingDecision } from '../state/types';

type Node =
  | { kind: 'group'; label: string; items: PendingDecision[] }
  | { kind: 'decision'; decision: PendingDecision }
  | { kind: 'resolved-group'; count: number };

export class DecisionsTreeProvider implements vscode.TreeDataProvider<Node> {
  private _onDidChangeTreeData = new vscode.EventEmitter<Node | undefined | null | void>();
  readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

  constructor(private store: StateStore) {
    store.on('changed', () => this._onDidChangeTreeData.fire());
  }

  getTreeItem(node: Node): vscode.TreeItem {
    if (node.kind === 'group') {
      const item = new vscode.TreeItem(
        node.label,
        vscode.TreeItemCollapsibleState.Expanded
      );
      item.id = `group:${node.label}`;
      item.description = `${node.items.length}`;
      item.iconPath = new vscode.ThemeIcon('warning');
      return item;
    }
    if (node.kind === 'resolved-group') {
      const item = new vscode.TreeItem(
        'Resolved (history)',
        vscode.TreeItemCollapsibleState.Collapsed
      );
      item.id = 'resolved-group';
      item.description = `${node.count}`;
      item.iconPath = new vscode.ThemeIcon('history');
      return item;
    }
    // decision
    const d = node.decision;
    const item = new vscode.TreeItem(
      `${d.id}: ${d.topic}`,
      vscode.TreeItemCollapsibleState.None
    );
    item.id = `decision:${d.id}`;
    item.description = d.blocking_gate ?? '';
    item.iconPath = new vscode.ThemeIcon('question');
    item.tooltip = `${d.id}: ${d.topic}${d.blocking_gate ? `\nBlocking: ${d.blocking_gate}` : ''}`;
    item.contextValue = 'decision';
    item.command = {
      command: 'architectCopilot.openDecisionCard',
      title: 'Open Decision Card',
      arguments: [d.id],
    };
    return item;
  }

  getChildren(node?: Node): Node[] {
    const snap = this.store.snapshot();
    const pending = snap.state?.pending_user_decisions ?? [];
    const resolved = snap.state?.resolved_decisions ?? [];

    if (!node) {
      if (pending.length === 0 && resolved.length === 0) return [];
      const out: Node[] = [];
      if (pending.length > 0) {
        // group by blocking_gate
        const byGate: Record<string, PendingDecision[]> = {};
        for (const d of pending) {
          const key = d.blocking_gate ?? '(no gate)';
          (byGate[key] ||= []).push(d);
        }
        for (const [gate, items] of Object.entries(byGate)) {
          out.push({ kind: 'group', label: gate, items });
        }
      }
      if (resolved.length > 0) {
        out.push({ kind: 'resolved-group', count: resolved.length });
      }
      return out;
    }
    if (node.kind === 'group') {
      return node.items.map((d) => ({ kind: 'decision' as const, decision: d }));
    }
    if (node.kind === 'resolved-group') {
      return resolved.map((d) => ({ kind: 'decision' as const, decision: d as PendingDecision }));
    }
    return [];
  }
}
