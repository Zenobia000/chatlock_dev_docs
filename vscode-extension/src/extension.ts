import * as vscode from 'vscode';
import { BootstrapPanel } from './bootstrap/BootstrapPanel';
import { DashboardPanel } from './dashboard/DashboardPanel';
import { DecisionCardPanel } from './panels/DecisionCardPanel';
import { DocumentDetailPanel } from './panels/DocumentDetailPanel';
import { DocumentEditorPanel } from './panels/DocumentEditorPanel';
import { PhaseDetailPanel } from './panels/PhaseDetailPanel';
import { RoundtableDetailPanel } from './panels/RoundtableDetailPanel';
import { createSnapshot } from './state/snapshotStore';
import * as fs from 'fs';
import * as path from 'path';
import { KB_TEMPLATES } from './data/kbCatalog';
import { readMarkdown } from './state/reader';
import { toDocRelPath } from './state/paths';
import { StateStore } from './state/StateStore';
import { getProjectRoot } from './state/paths';
import { MissionControlViewProvider } from './views/MissionControlView';
import { PhasesGatesTreeProvider } from './views/PhasesGatesTree';
import { DocumentsTreeProvider } from './views/DocumentsTree';
import { DecisionsTreeProvider } from './views/DecisionsTree';
import { PersonasTreeProvider } from './views/PersonasTree';
import { KnowledgeBaseTreeProvider } from './views/KnowledgeBaseTree';
import { StatusBarItem } from './status/StatusBarItem';
import {
  getThemeMode,
  isForceHighContrast,
  isGuidanceMode,
  setForceHighContrast,
  setGuidanceMode,
  setThemeMode,
  ThemeMode,
} from './config';

let store: StateStore | undefined;
let statusBar: StatusBarItem | undefined;

export function activate(context: vscode.ExtensionContext): void {
  const root = getProjectRoot();
  if (!root) {
    vscode.window.showWarningMessage(
      'Architect Copilot needs a workspace folder. Open the Architecture_Autopilot project.'
    );
    return;
  }

  store = new StateStore(root);
  store.start();

  // Status bar
  statusBar = new StatusBarItem(store);
  context.subscriptions.push({ dispose: () => statusBar?.dispose() });

  // Mission Control webview view
  const missionControl = new MissionControlViewProvider(store);
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(
      MissionControlViewProvider.viewType,
      missionControl,
      { webviewOptions: { retainContextWhenHidden: true } }
    )
  );

  // Tree views
  const phasesProvider = new PhasesGatesTreeProvider(store);
  const documentsProvider = new DocumentsTreeProvider(store);
  const decisionsProvider = new DecisionsTreeProvider(store);
  const personasProvider = new PersonasTreeProvider(store);
  const kbProvider = new KnowledgeBaseTreeProvider(store);

  context.subscriptions.push(
    vscode.window.registerTreeDataProvider('architectCopilot.phasesGates', phasesProvider),
    vscode.window.registerTreeDataProvider('architectCopilot.documents', documentsProvider),
    vscode.window.registerTreeDataProvider('architectCopilot.decisions', decisionsProvider),
    vscode.window.registerTreeDataProvider('architectCopilot.personas', personasProvider),
    vscode.window.registerTreeDataProvider('architectCopilot.kb', kbProvider)
  );

  // Commands
  context.subscriptions.push(
    vscode.commands.registerCommand('architectCopilot.startBootstrap', () => {
      if (!ensureWorkspace()) return;
      BootstrapPanel.show(context);
    }),
    vscode.commands.registerCommand('architectCopilot.openDashboard', () => {
      if (!ensureWorkspace() || !store) return;
      DashboardPanel.show(store);
    }),
    vscode.commands.registerCommand('architectCopilot.openDecisionCard', (decisionId: string, args?: any) => {
      if (!store) return;
      DecisionCardPanel.show(decisionId, store, args);
    }),
    vscode.commands.registerCommand('architectCopilot.editDocument', (relPath: string) => {
      if (!store) return;
      DocumentEditorPanel.show(relPath, store);
    }),
    vscode.commands.registerCommand('architectCopilot.openRoundtable', (filename: string) => {
      if (!store) return;
      RoundtableDetailPanel.show(filename, store);
    }),
    vscode.commands.registerCommand('architectCopilot.newDocFromTemplate', async () => {
      if (!store) return;
      const root = store.getRoot();
      const tmpl = await vscode.window.showQuickPick(
        KB_TEMPLATES.map((t) => ({ label: t.label, description: t.path, id: t.id, srcPath: t.path })),
        { placeHolder: 'Select template' }
      );
      if (!tmpl) return;
      const feature = store.snapshot().state?.active_features[0] ?? 'feature';
      const name = await vscode.window.showInputBox({
        prompt: 'Document filename (without extension)',
        value: `${tmpl.id}-${feature}`,
      });
      if (!name) return;
      const subdir = await vscode.window.showQuickPick(
        ['prd', 'governance', 'ux', 'analysis', 'architecture', 'design', 'qa', 'ops', 'release'],
        { placeHolder: 'Target subdirectory under docs/' }
      );
      if (!subdir) return;
      const ext = tmpl.srcPath.endsWith('.yaml') ? 'yaml' : 'md';
      const relPath = toDocRelPath(subdir, `${name}.${ext}`);
      const abs = path.join(root, relPath);
      if (fs.existsSync(abs)) {
        const overwrite = await vscode.window.showWarningMessage(
          `${relPath} already exists. Overwrite?`,
          { modal: true },
          'Overwrite'
        );
        if (overwrite !== 'Overwrite') return;
      }
      const templateContent = readMarkdown(path.join(root, tmpl.srcPath)) ?? '';
      fs.mkdirSync(path.dirname(abs), { recursive: true });
      fs.writeFileSync(abs, templateContent, 'utf-8');
      createSnapshot({ root, docPath: relPath, content: templateContent, source: 'vscode-create' });
      vscode.window.showInformationMessage(`✓ Created ${relPath} from template ${tmpl.label}`);
      store.refresh();
      DocumentDetailPanel.show(relPath, store);
    }),
    vscode.commands.registerCommand('architectCopilot.runDriver', async (driverName: string) => {
      const choice = await vscode.window.showInformationMessage(
        `將執行 claude /${driverName}\n（會自動發送到 terminal）`,
        { modal: false },
        'Approve & Run',
        'Cancel'
      );
      if (choice !== 'Approve & Run') return;
      const terminal = vscode.window.activeTerminal ?? vscode.window.createTerminal('Architect Copilot');
      terminal.show();
      terminal.sendText(`claude /${driverName}`, true);
    }),
    vscode.commands.registerCommand('architectCopilot.freezeGate', async (gateId: string) => {
      const choice = await vscode.window.showInformationMessage(
        `將執行 claude /devteam-freeze ${gateId}\n（會自動發送到 terminal）`,
        { modal: false },
        'Approve & Run',
        'Cancel'
      );
      if (choice !== 'Approve & Run') return;
      const terminal = vscode.window.activeTerminal ?? vscode.window.createTerminal('Architect Copilot');
      terminal.show();
      terminal.sendText(`claude /devteam-freeze ${gateId}`, true);
    }),
    vscode.commands.registerCommand('architectCopilot.openDocumentDetail', (relPath: string) => {
      if (!store) return;
      DocumentDetailPanel.show(relPath, store);
    }),
    vscode.commands.registerCommand(
      'architectCopilot.openPhaseDetail',
      (phaseId: string, gateId?: string) => {
        if (!store) return;
        PhaseDetailPanel.show(phaseId, store, gateId);
      }
    ),
    vscode.commands.registerCommand('architectCopilot.openFile', async (absPath: string) => {
      try {
        const doc = await vscode.workspace.openTextDocument(absPath);
        await vscode.window.showTextDocument(doc);
      } catch (e) {
        vscode.window.showErrorMessage(`Cannot open ${absPath}: ${(e as Error).message}`);
      }
    }),
    vscode.commands.registerCommand('architectCopilot.runPM', () => {
      const terminal = vscode.window.activeTerminal ?? vscode.window.createTerminal('Architect Copilot');
      terminal.show();
      terminal.sendText('claude /devteam-pm', false);
    }),
    vscode.commands.registerCommand('architectCopilot.freezeActiveGate', () => {
      const state = store?.snapshot().state;
      if (!state) {
        vscode.window.showWarningMessage('No active session.');
        return;
      }
      const active = Object.entries(state.freeze_gates).find(
        ([, s]) => s === 'ready_to_review'
      );
      if (!active) {
        vscode.window.showInformationMessage('No gate currently ready_to_review.');
        return;
      }
      const terminal = vscode.window.activeTerminal ?? vscode.window.createTerminal('Architect Copilot');
      terminal.show();
      terminal.sendText(`claude /devteam-freeze ${active[0]}`, false);
    }),
    vscode.commands.registerCommand('architectCopilot.resolveNextDecision', () => {
      const state = store?.snapshot().state;
      if (!state || state.pending_user_decisions.length === 0) {
        vscode.window.showInformationMessage('No pending decisions.');
        return;
      }
      const next = state.pending_user_decisions[0];
      DecisionCardPanel.show(next.id, store!);
    }),
    vscode.commands.registerCommand('architectCopilot.refresh', () => {
      store?.refresh();
    }),
    vscode.commands.registerCommand('architectCopilot.toggleHighContrast', async () => {
      const current = isForceHighContrast();
      await setForceHighContrast(!current);
      vscode.window.showInformationMessage(
        `Architect Copilot: high-contrast mode ${!current ? 'enabled' : 'disabled'}. Reopen panels to apply.`
      );
      store?.refresh();
    }),
    vscode.commands.registerCommand('architectCopilot.toggleGuidanceMode', async () => {
      const current = isGuidanceMode();
      await setGuidanceMode(!current);
      vscode.window.showInformationMessage(
        `Architect Copilot: guidance mode ${!current ? 'ON — inline help visible under every button' : 'OFF — hover ? icons for tooltip'}.`
      );
      store?.refresh();
    }),
    vscode.commands.registerCommand('architectCopilot.setThemeMode', async () => {
      const current = getThemeMode();
      const pick = await vscode.window.showQuickPick(
        [
          {
            label: `$(color-mode) System (follow VS Code theme)${current === 'system' ? '  ✓' : ''}`,
            value: 'system' as ThemeMode,
            description: 'Default — extension UI adapts to your VS Code theme automatically',
          },
          {
            label: `$(circle-filled) Dark${current === 'dark' ? '  ✓' : ''}`,
            value: 'dark' as ThemeMode,
            description: 'Force dark palette in Architect Copilot webviews',
          },
          {
            label: `$(circle-outline) Light${current === 'light' ? '  ✓' : ''}`,
            value: 'light' as ThemeMode,
            description: 'Force light palette in Architect Copilot webviews',
          },
        ],
        { placeHolder: `Current: ${current}. Select theme mode for Architect Copilot panels.` }
      );
      if (!pick) return;
      await setThemeMode(pick.value);
      vscode.window.showInformationMessage(`Architect Copilot theme set to: ${pick.value}.`);
      store?.refresh();
    }),
    vscode.workspace.onDidChangeConfiguration((e) => {
      if (
        e.affectsConfiguration('architectCopilot.forceHighContrast') ||
        e.affectsConfiguration('architectCopilot.guidanceMode') ||
        e.affectsConfiguration('architectCopilot.themeMode')
      ) {
        store?.refresh();
      }
    })
  );
}

function ensureWorkspace(): boolean {
  if (!getProjectRoot()) {
    vscode.window.showErrorMessage(
      'Architect Copilot needs a workspace folder. Open the Architecture_Autopilot project first.'
    );
    return false;
  }
  return true;
}

export function deactivate(): void {
  store?.stop();
  store = undefined;
  statusBar?.dispose();
  statusBar = undefined;
}
