import * as path from 'path';
import * as vscode from 'vscode';
import { KB_DOCS, KB_TEMPLATES } from '../data/kbCatalog';
import { StateStore } from '../state/StateStore';

type Node =
  | { kind: 'section'; id: 'kb' | 'templates' }
  | { kind: 'kb-doc'; index: number }
  | { kind: 'template'; index: number };

export class KnowledgeBaseTreeProvider implements vscode.TreeDataProvider<Node> {
  private _onDidChangeTreeData = new vscode.EventEmitter<Node | undefined | null | void>();
  readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

  constructor(private store: StateStore) {}

  getTreeItem(node: Node): vscode.TreeItem {
    if (node.kind === 'section') {
      const isKb = node.id === 'kb';
      const item = new vscode.TreeItem(
        isKb ? `Reference catalog (${KB_DOCS.length})` : `Templates (${KB_TEMPLATES.length})`,
        vscode.TreeItemCollapsibleState.Collapsed
      );
      item.id = `section:${node.id}`;
      item.iconPath = new vscode.ThemeIcon(isKb ? 'book' : 'file-text');
      return item;
    }
    if (node.kind === 'kb-doc') {
      const doc = KB_DOCS[node.index];
      const item = new vscode.TreeItem(doc.label, vscode.TreeItemCollapsibleState.None);
      item.id = `kb:${doc.id}`;
      item.description = doc.description;
      item.tooltip = `${doc.label}\n${doc.description}\n${doc.path}`;
      item.iconPath = new vscode.ThemeIcon('book');
      item.command = {
        command: 'architectCopilot.openFile',
        title: 'Open KB',
        arguments: [path.join(this.store.getRoot(), doc.path)],
      };
      return item;
    }
    // template
    const tmpl = KB_TEMPLATES[node.index];
    const item = new vscode.TreeItem(tmpl.label, vscode.TreeItemCollapsibleState.None);
    item.id = `tmpl:${tmpl.id}`;
    item.description = path.basename(tmpl.path);
    item.iconPath = new vscode.ThemeIcon('file-code');
    item.command = {
      command: 'architectCopilot.openFile',
      title: 'Open template',
      arguments: [path.join(this.store.getRoot(), tmpl.path)],
    };
    return item;
  }

  getChildren(node?: Node): Node[] {
    if (!node) {
      return [
        { kind: 'section', id: 'kb' },
        { kind: 'section', id: 'templates' },
      ];
    }
    if (node.kind === 'section') {
      if (node.id === 'kb') {
        return KB_DOCS.map((_, i) => ({ kind: 'kb-doc' as const, index: i }));
      }
      return KB_TEMPLATES.map((_, i) => ({ kind: 'template' as const, index: i }));
    }
    return [];
  }
}
