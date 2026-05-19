import * as path from 'path';
import * as vscode from 'vscode';
import { PERSONAS, PERSONA_GROUPS, PersonaGroup } from '../data/personaCatalog';
import { StateStore } from '../state/StateStore';

type Node =
  | { kind: 'group'; group: PersonaGroup; label: string }
  | { kind: 'persona'; personaId: string };

export class PersonasTreeProvider implements vscode.TreeDataProvider<Node> {
  private _onDidChangeTreeData = new vscode.EventEmitter<Node | undefined | null | void>();
  readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

  constructor(private store: StateStore) {
    store.on('changed', () => this._onDidChangeTreeData.fire());
  }

  getTreeItem(node: Node): vscode.TreeItem {
    const state = this.store.snapshot().state;
    const currentPhase = state?.current_phase ?? 'BOOTSTRAP';

    if (node.kind === 'group') {
      const personas = PERSONAS.filter((p) => p.group === node.group);
      const activeCount = personas.filter((p) => p.phaseIds.includes(currentPhase)).length;
      const item = new vscode.TreeItem(
        node.label,
        activeCount > 0
          ? vscode.TreeItemCollapsibleState.Expanded
          : vscode.TreeItemCollapsibleState.Collapsed
      );
      item.id = `pg:${node.group}`;
      item.description = activeCount > 0 ? `${activeCount} active` : `${personas.length} personas`;
      item.iconPath = new vscode.ThemeIcon(activeCount > 0 ? 'person-add' : 'organization');
      return item;
    }

    // persona
    const persona = PERSONAS.find((p) => p.id === node.personaId)!;
    const isActive = persona.phaseIds.includes(currentPhase);
    const item = new vscode.TreeItem(
      persona.label,
      vscode.TreeItemCollapsibleState.None
    );
    item.id = `persona:${persona.id}`;
    item.description = isActive
      ? `● active ${persona.kind}`
      : persona.kind;
    item.iconPath = new vscode.ThemeIcon(
      persona.kind === 'driver'
        ? 'rocket'
        : persona.kind === 'meta'
          ? 'symbol-namespace'
          : 'eye'
    );
    item.tooltip = `${persona.label}\n${persona.description}\n\nactive phases: ${persona.phaseIds.join(', ') || 'cross-phase'}`;
    item.contextValue = `persona-${persona.kind}`;
    item.command = {
      command: 'architectCopilot.openFile',
      title: 'Open agent definition',
      arguments: [path.join(this.store.getRoot(), persona.agentFile)],
    };
    return item;
  }

  getChildren(node?: Node): Node[] {
    if (!node) {
      return PERSONA_GROUPS.map((g) => ({ kind: 'group' as const, group: g.id, label: g.label }));
    }
    if (node.kind === 'group') {
      return PERSONAS.filter((p) => p.group === node.group).map((p) => ({
        kind: 'persona' as const,
        personaId: p.id,
      }));
    }
    return [];
  }
}
