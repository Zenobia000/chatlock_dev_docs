import * as vscode from 'vscode';
import { getBootstrapHtml } from './webviewHtml';
import { QUESTIONS } from './questions';
import { getProjectRoot } from '../state/paths';
import { appendSessionNarrative, buildInitialState, writeBootstrapIntent, writeState } from '../state/writer';
import { readState } from '../state/reader';
import { BootstrapIntent, DevTeamState, UxMode } from '../state/types';
import { bodyClass } from '../config';

type AnswerMap = Record<string, string | string[]>;

export class BootstrapPanel {
  public static current: BootstrapPanel | undefined;
  private readonly panel: vscode.WebviewPanel;
  private disposables: vscode.Disposable[] = [];

  public static show(context: vscode.ExtensionContext): void {
    if (BootstrapPanel.current) {
      BootstrapPanel.current.panel.reveal();
      return;
    }
    const panel = vscode.window.createWebviewPanel(
      'architectCopilot.bootstrap',
      'Architect Bootstrap',
      vscode.ViewColumn.Active,
      { enableScripts: true, retainContextWhenHidden: true }
    );
    BootstrapPanel.current = new BootstrapPanel(panel, context);
  }

  private constructor(panel: vscode.WebviewPanel, _context: vscode.ExtensionContext) {
    this.panel = panel;
    this.panel.webview.html = this.render();
    this.panel.onDidDispose(() => this.dispose(), null, this.disposables);
    this.panel.webview.onDidReceiveMessage((msg) => this.handle(msg), null, this.disposables);
  }

  private render(): string {
    const nonce = createNonce();
    return getBootstrapHtml(nonce, this.panel.webview.cspSource, bodyClass());
  }

  private async handle(msg: { type: string; feature?: string; answers?: AnswerMap }): Promise<void> {
    if (msg.type === 'cancel') {
      this.panel.dispose();
      return;
    }
    if (msg.type !== 'submit' || !msg.answers || !msg.feature) return;

    const root = getProjectRoot();
    if (!root) {
      vscode.window.showErrorMessage('No workspace folder open. Open the Architecture_Autopilot project first.');
      return;
    }

    const feature = msg.feature;
    const answers = msg.answers;
    const intent = buildIntent(feature, answers);
    writeBootstrapIntent(root, intent);
    this.updateState(root, feature, intent);
    this.appendNarrative(root, feature, intent);

    vscode.window.showInformationMessage(
      `Bootstrap completed. Wrote bootstrap-${feature}.yaml — UX mode: ${intent.learning.mode}.`,
      'Open Dashboard',
      'Run /devteam-pm in terminal'
    ).then((sel) => {
      if (sel === 'Open Dashboard') {
        vscode.commands.executeCommand('architectCopilot.openDashboard');
      } else if (sel === 'Run /devteam-pm in terminal') {
        vscode.commands.executeCommand('architectCopilot.runPM');
      }
    });

    this.panel.dispose();
  }

  private updateState(root: string, feature: string, intent: BootstrapIntent): void {
    let state = readState(root);
    if (!state) {
      const sessionId = `s-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${feature}`;
      state = buildInitialState({
        sessionId,
        feature,
        problemDescription: intent.business.problem_statement,
      });
    } else if (!state.active_features.includes(feature)) {
      state.active_features.push(feature);
    }
    state.bootstrap_done = true;
    state.ux_mode = intent.learning.mode;
    state.weak_areas = intent.learning.weak_areas;
    state.bootstrap_metadata = {
      completed_at: new Date().toISOString(),
      intent_file: `.claude/context/devteam/bootstrap-${feature}.yaml`,
      open_questions_count: intent.open_questions.length,
    };
    state.phase_history.push({
      phase: 'P0_DISCOVERY',
      driver: 'devteam-bootstrap (vscode)',
      at: new Date().toISOString(),
      artifact: `bootstrap-${feature}.yaml`,
    });
    writeState(root, state);
  }

  private appendNarrative(root: string, feature: string, intent: BootstrapIntent): void {
    const state = readState(root);
    if (!state) return;
    const lines = [
      '',
      `## [${new Date().toISOString()}] devteam-bootstrap (vscode-extension)`,
      '',
      `完成 Architect Bootstrap Questionnaire — feature \`${feature}\`。`,
      '',
      `- 用戶規模：${intent.business.user_scale}`,
      `- 延遲敏感度：${intent.business.latency_sensitivity}`,
      `- 資料等級：${intent.compliance.data_types.join(', ')}`,
      `- 合規：${intent.compliance.frameworks.join(', ')}`,
      `- 團隊：${intent.team_timeline.team_size} / Deadline：${intent.team_timeline.first_release_deadline}`,
      `- Stack：${intent.stack.primary_language} on ${intent.stack.deployment_env}`,
      `- 學習模式：${intent.learning.mode}`,
      `- Weak areas (${intent.learning.weak_areas.length}/7)：${intent.learning.weak_areas.join(', ')}`,
      `- Open questions：${intent.open_questions.length}`,
      '',
      `下一步：執行 \`/devteam-pm\` 進入 PRD 撰寫（Mode A 預填模式）。`,
      '',
    ];
    appendSessionNarrative(root, state.session_id, lines.join('\n'));
  }

  public dispose(): void {
    BootstrapPanel.current = undefined;
    this.panel.dispose();
    while (this.disposables.length) {
      const d = this.disposables.pop();
      if (d) d.dispose();
    }
  }
}

function buildIntent(feature: string, answers: AnswerMap): BootstrapIntent {
  const get = (id: string): string => (typeof answers[id] === 'string' ? (answers[id] as string) : '');
  const getMulti = (id: string): string[] => (Array.isArray(answers[id]) ? (answers[id] as string[]) : []);

  const uxMode = parseUxMode(get('Q11'));
  const openQuestions = collectOpenQuestions(answers);

  return {
    schema_version: 1,
    feature,
    created_at: new Date().toISOString(),
    created_by: 'devteam-bootstrap (vscode-extension)',
    business: {
      problem_statement: get('Q1'),
      user_scale: get('Q2'),
      latency_sensitivity: get('Q3'),
    },
    compliance: {
      data_types: getMulti('Q4'),
      frameworks: getMulti('Q5'),
      audit_required: get('Q6'),
    },
    team_timeline: {
      team_size: get('Q7'),
      first_release_deadline: get('Q8'),
    },
    stack: {
      primary_language: get('Q9'),
      deployment_env: get('Q10'),
    },
    learning: {
      mode: uxMode,
      weak_areas: getMulti('Q12'),
    },
    open_questions: openQuestions,
  };
}

function parseUxMode(raw: string): UxMode {
  if (raw.startsWith('Educational')) return 'educational';
  if (raw.startsWith('Balanced')) return 'balanced';
  return 'fast-handoff';
}

function collectOpenQuestions(answers: AnswerMap): { question_id: string; reason: string }[] {
  const out: { question_id: string; reason: string }[] = [];

  // Q1 偵測過短的 problem statement
  const q1 = typeof answers['Q1'] === 'string' ? (answers['Q1'] as string) : '';
  if (q1.length < 40) {
    out.push({
      question_id: 'Q1',
      reason: 'Problem statement 偏精簡，PM 階段需補目標用戶情境、現有解法、新方案差異化',
    });
  }

  // educational + deadline < 1 月 張力
  const q8 = typeof answers['Q8'] === 'string' ? (answers['Q8'] as string) : '';
  const q11 = typeof answers['Q11'] === 'string' ? (answers['Q11'] as string) : '';
  if (q11.startsWith('Educational') && q8.startsWith('< 1')) {
    out.push({
      question_id: 'meta-tension',
      reason:
        'Educational mode + < 1 個月 deadline 有張力 — 每個決策都展開 trade-off 會拖慢 MVP 衝刺。建議 PM 階段確認是否：(a) 接受延長到 1.5-2 個月、(b) 改 balanced mode 換取速度、或 (c) MVP scope 再聚焦到 1-2 個核心決策面向。',
    });
  }

  // weak areas 全選
  const q12 = Array.isArray(answers['Q12']) ? (answers['Q12'] as string[]) : [];
  const total = QUESTIONS.find((q) => q.id === 'Q12')?.options?.length ?? 8;
  if (q12.length >= total - 1 && !q12.includes('都還好 (我有底)')) {
    out.push({
      question_id: 'meta-scope',
      reason: 'Weak areas 幾乎全選。意味全程需要 heavy callout。PM 階段建議聚焦 1-2 個學習目標當 MVP 主軸，其餘領域用既有預設值帶過。',
    });
  }

  // Q2 < 100 但合規含 SOC2/GDPR/HIPAA — 規模 vs 合規矛盾
  const q2 = typeof answers['Q2'] === 'string' ? (answers['Q2'] as string) : '';
  const q5 = Array.isArray(answers['Q5']) ? (answers['Q5'] as string[]) : [];
  const heavyCompliance = q5.some((f) => /SOC2|GDPR|HIPAA|PCI/.test(f));
  if (q2.startsWith('< 100') && heavyCompliance) {
    out.push({
      question_id: 'meta-scale-vs-compliance',
      reason: '< 100 用戶規模卻要 SOC2/GDPR/HIPAA/PCI — 多數情況不合理。PM 階段請確認：是 PoC 階段先預備合規、還是規模估錯？',
    });
  }

  return out;
}

function createNonce(): string {
  let text = '';
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 0; i < 32; i++) text += possible.charAt(Math.floor(Math.random() * possible.length));
  return text;
}

// re-export answers for buildIntent type
export type { AnswerMap };
