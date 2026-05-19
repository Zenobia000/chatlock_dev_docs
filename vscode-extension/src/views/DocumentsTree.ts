import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';
import { PHASES, PHASE_BY_ID } from '../data/phaseCatalog';
import { StateStore } from '../state/StateStore';
import { DocIndexEntry } from '../state/types';
import {
  getBootstrapYamlPath,
  getDocsRoot,
  getSessionReportPath,
  getStatePath,
  toDocRelPath,
} from '../state/paths';

type Node =
  | { kind: 'feature'; feature: string }
  | { kind: 'phase-folder'; feature: string; phaseId: string }
  | { kind: 'doc'; relPath: string }
  | { kind: 'system' }
  | { kind: 'system-file'; absPath: string; label: string }
  | { kind: 'roundtables-root' }
  | { kind: 'roundtable'; filename: string };

const PHASE_FOLDER_HINTS: Array<{ phaseId: string; subdir: string; label: string }> = [
  { phaseId: 'P0_DISCOVERY', subdir: 'prd', label: 'prd/' },
  { phaseId: 'P0_DISCOVERY', subdir: 'governance', label: 'governance/' },
  { phaseId: 'P1_ANALYSIS', subdir: 'ux', label: 'ux/' },
  { phaseId: 'P1_ANALYSIS', subdir: 'analysis', label: 'analysis/' },
  { phaseId: 'P2_ARCHITECTURE', subdir: 'architecture', label: 'architecture/' },
  { phaseId: 'P3_DESIGN', subdir: 'design', label: 'design/' },
  { phaseId: 'P4_DELIVERY', subdir: 'qa', label: 'qa/' },
  { phaseId: 'P5_RELEASE', subdir: 'ops', label: 'ops/' },
  { phaseId: 'P5_RELEASE', subdir: 'release', label: 'release/' },
];

export class DocumentsTreeProvider implements vscode.TreeDataProvider<Node> {
  private _onDidChangeTreeData = new vscode.EventEmitter<Node | undefined | null | void>();
  readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

  constructor(private store: StateStore) {
    store.on('changed', () => this._onDidChangeTreeData.fire());
  }

  getTreeItem(node: Node): vscode.TreeItem {
    const snap = this.store.snapshot();

    if (node.kind === 'feature') {
      const item = new vscode.TreeItem(
        node.feature,
        vscode.TreeItemCollapsibleState.Expanded
      );
      item.id = `feature:${node.feature}`;
      item.description = 'active feature';
      item.iconPath = new vscode.ThemeIcon('folder-active');
      item.contextValue = 'feature';
      return item;
    }

    if (node.kind === 'phase-folder') {
      const hint = PHASE_FOLDER_HINTS.find(
        (h) => h.subdir === extractSubdir(node, snap)
      );
      const subdirLabel = node['phaseId'] === 'system' ? 'system' : node['phaseId'];
      const count = countDocsInFolder(this.store.getRoot(), getSubdirForPhase(node));
      const phaseLabel = PHASE_BY_ID[node.phaseId]?.shortLabel ?? '';
      const item = new vscode.TreeItem(
        getSubdirForPhase(node) + '/',
        count > 0 ? vscode.TreeItemCollapsibleState.Expanded : vscode.TreeItemCollapsibleState.Collapsed
      );
      item.id = `phasefolder:${node.feature}:${getSubdirForPhase(node)}`;
      item.description = count > 0 ? `${count} docs` : `pending ${phaseLabel}`;
      item.iconPath = new vscode.ThemeIcon(count > 0 ? 'folder-opened' : 'folder');
      item.contextValue = 'phase-folder';
      return item;
    }

    if (node.kind === 'doc') {
      const meta: DocIndexEntry = snap.documents[node.relPath] ?? {};
      const item = new vscode.TreeItem(
        path.basename(node.relPath),
        vscode.TreeItemCollapsibleState.None
      );
      item.id = `doc:${node.relPath}`;
      const status = meta.status ?? 'unknown';
      const ver = meta.version ?? '?';
      const gate1 = meta.gate1_status;
      const blockerCount = meta.blockers?.length ?? 0;
      let desc = `v${ver} • ${status}`;
      if (gate1) desc += ` • ${gate1}`;
      if (blockerCount > 0) desc += ` • ❗${blockerCount}`;
      item.description = desc;
      item.iconPath = new vscode.ThemeIcon(docIcon(status));
      item.tooltip = `${node.relPath}\nstatus: ${status}\nversion: ${ver}`;
      item.contextValue = `doc-${status}`;
      item.command = {
        command: 'architectCopilot.openDocumentDetail',
        title: 'Open Document Detail',
        arguments: [node.relPath],
      };
      return item;
    }

    if (node.kind === 'system') {
      const item = new vscode.TreeItem('system', vscode.TreeItemCollapsibleState.Collapsed);
      item.id = 'system';
      item.description = 'state & bootstrap';
      item.iconPath = new vscode.ThemeIcon('gear');
      return item;
    }

    if (node.kind === 'roundtables-root') {
      const count = snap.roundtables.length;
      const item = new vscode.TreeItem(
        'roundtables',
        count > 0 ? vscode.TreeItemCollapsibleState.Expanded : vscode.TreeItemCollapsibleState.Collapsed
      );
      item.id = 'roundtables-root';
      item.description = count > 0 ? `${count} MoM(s)` : 'empty';
      item.iconPath = new vscode.ThemeIcon('comment-discussion');
      return item;
    }

    if (node.kind === 'roundtable') {
      const item = new vscode.TreeItem(node.filename, vscode.TreeItemCollapsibleState.None);
      item.id = `roundtable:${node.filename}`;
      item.iconPath = new vscode.ThemeIcon('comment-discussion');
      item.contextValue = 'roundtable';
      item.command = {
        command: 'architectCopilot.openRoundtable',
        title: 'Open Roundtable',
        arguments: [node.filename],
      };
      return item;
    }

    // system-file
    const item = new vscode.TreeItem(node.label, vscode.TreeItemCollapsibleState.None);
    item.id = `sys:${node.absPath}`;
    item.iconPath = new vscode.ThemeIcon(node.label.endsWith('.json') ? 'json' : 'file');
    item.command = {
      command: 'architectCopilot.openFile',
      title: 'Open file',
      arguments: [node.absPath],
    };
    return item;
  }

  getChildren(node?: Node): Node[] {
    const snap = this.store.snapshot();
    if (!node) {
      const features = snap.state?.active_features ?? [];
      const out: Node[] = features.map((f) => ({ kind: 'feature' as const, feature: f }));
      out.push({ kind: 'roundtables-root' });
      out.push({ kind: 'system' });
      return out;
    }
    if (node.kind === 'roundtables-root') {
      return snap.roundtables.map((r) => ({ kind: 'roundtable' as const, filename: r.filename }));
    }
    if (node.kind === 'feature') {
      // group phase folders that exist or are planned
      return PHASE_FOLDER_HINTS.map((h) => ({
        kind: 'phase-folder' as const,
        feature: node.feature,
        phaseId: h.subdir, // reuse phaseId field for subdir matching
      }));
    }
    if (node.kind === 'phase-folder') {
      const root = this.store.getRoot();
      const subdir = getSubdirForPhase(node);
      const folder = path.join(getDocsRoot(root), subdir);
      if (!fs.existsSync(folder)) return [];
      try {
        return fs
          .readdirSync(folder)
          .filter((f) => f.endsWith('.md') || f.endsWith('.yaml'))
          .map((f) => ({ kind: 'doc' as const, relPath: toDocRelPath(subdir, f) }));
      } catch {
        return [];
      }
    }
    if (node.kind === 'system') {
      const root = this.store.getRoot();
      const out: Node[] = [];
      const state = snap.state;
      out.push({ kind: 'system-file', absPath: getStatePath(root), label: 'state.json' });
      if (state) {
        for (const f of state.active_features) {
          const p = getBootstrapYamlPath(root, f);
          if (fs.existsSync(p)) out.push({ kind: 'system-file', absPath: p, label: `bootstrap-${f}.yaml` });
        }
        const sessionPath = getSessionReportPath(root, state.session_id);
        if (fs.existsSync(sessionPath)) {
          out.push({ kind: 'system-file', absPath: sessionPath, label: `session-${state.session_id}.md` });
        }
      }
      return out;
    }
    return [];
  }
}

function getSubdirForPhase(node: { kind: 'phase-folder'; phaseId: string }): string {
  return node.phaseId; // we stored subdir in phaseId field
}

function extractSubdir(node: any, _snap: any): string {
  return node.phaseId ?? '';
}

function countDocsInFolder(root: string, subdir: string): number {
  const folder = path.join(getDocsRoot(root), subdir);
  if (!fs.existsSync(folder)) return 0;
  try {
    return fs
      .readdirSync(folder)
      .filter((f) => f.endsWith('.md') || f.endsWith('.yaml')).length;
  } catch {
    return 0;
  }
}

function docIcon(status: string): string {
  switch (status) {
    case 'frozen':
      return 'lock';
    case 'reviewed':
      return 'verified';
    case 'draft':
      return 'edit';
    case 'superseded':
      return 'history';
    default:
      return 'file';
  }
}
