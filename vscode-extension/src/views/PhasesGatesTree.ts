import * as vscode from 'vscode';
import { PHASES, phaseIndex } from '../data/phaseCatalog';
import { GATES, gatesByPhase } from '../data/gateCatalog';
import { StateStore } from '../state/StateStore';
import { GateStatus } from '../state/types';

type Node =
  | { kind: 'phase'; phaseId: string }
  | { kind: 'gate'; gateId: string; phaseId: string };

export class PhasesGatesTreeProvider implements vscode.TreeDataProvider<Node> {
  private _onDidChangeTreeData = new vscode.EventEmitter<Node | undefined | null | void>();
  readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

  constructor(private store: StateStore) {
    store.on('changed', () => this._onDidChangeTreeData.fire());
  }

  refresh(): void {
    this._onDidChangeTreeData.fire();
  }

  getTreeItem(node: Node): vscode.TreeItem {
    const state = this.store.snapshot().state;
    const currentPhase = state?.current_phase ?? 'BOOTSTRAP';
    const currentIdx = phaseIndex(currentPhase);

    if (node.kind === 'phase') {
      const phase = PHASES.find((p) => p.id === node.phaseId)!;
      const idx = phaseIndex(node.phaseId);
      const isCurrent = node.phaseId === currentPhase;
      const isPast = idx < currentIdx;
      const phaseGates = gatesByPhase(node.phaseId);
      const hasChildren = phaseGates.length > 0;

      const item = new vscode.TreeItem(
        phase.label,
        hasChildren
          ? isCurrent
            ? vscode.TreeItemCollapsibleState.Expanded
            : vscode.TreeItemCollapsibleState.Collapsed
          : vscode.TreeItemCollapsibleState.None
      );
      item.id = `phase:${node.phaseId}`;
      item.description = isCurrent
        ? '◀ current'
        : isPast
          ? '✓ past'
          : 'pending';
      item.iconPath = new vscode.ThemeIcon(
        isCurrent ? 'play-circle' : isPast ? 'check' : 'circle-large-outline'
      );
      item.tooltip = phase.description;
      item.contextValue = isCurrent ? 'phase-current' : 'phase';
      item.command = {
        command: 'architectCopilot.openPhaseDetail',
        title: 'Open Phase Detail',
        arguments: [node.phaseId],
      };
      return item;
    }

    // gate
    const gate = GATES.find((g) => g.id === node.gateId)!;
    const status: GateStatus = (state?.freeze_gates?.[node.gateId] ?? 'not_reached') as GateStatus;
    const item = new vscode.TreeItem(gate.label, vscode.TreeItemCollapsibleState.None);
    item.id = `gate:${node.gateId}`;
    item.description = status;
    item.iconPath = new vscode.ThemeIcon(gateIcon(status));
    item.tooltip = `${gate.description}\n\nOwner: ${gate.ownerRole}\nPersonas: ${gate.requiredPersonas.join(', ')}`;
    item.contextValue = `gate-${status}`;
    item.command = {
      command: 'architectCopilot.openPhaseDetail',
      title: 'Open Phase Detail',
      arguments: [node.phaseId, node.gateId],
    };
    return item;
  }

  getChildren(node?: Node): Node[] {
    if (!node) return PHASES.map((p) => ({ kind: 'phase', phaseId: p.id }));
    if (node.kind === 'phase') {
      return gatesByPhase(node.phaseId).map((g) => ({
        kind: 'gate' as const,
        gateId: g.id,
        phaseId: node.phaseId,
      }));
    }
    return [];
  }
}

function gateIcon(status: GateStatus): string {
  switch (status) {
    case 'frozen':
      return 'lock';
    case 'ready_to_review':
      return 'eye';
    case 'in_review':
      return 'sync';
    case 'blocked':
      return 'error';
    default:
      return 'circle-large-outline';
  }
}
