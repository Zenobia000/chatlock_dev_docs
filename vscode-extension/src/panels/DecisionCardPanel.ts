import * as path from 'path';
import * as vscode from 'vscode';
import { COMMON_STYLES } from './shared/styles';
import { csp, escape, helpFor, nonce, pill, truncate } from './shared/htmlUtils';
import { StateStore } from '../state/StateStore';
import { PendingDecision, AdrLedgerEntry } from '../state/types';
import {
  appendAdrLedgerEntry,
  appendSessionNarrative,
  resolvePendingDecision,
  supersedeAdr,
} from '../state/writer';
import { toDocRelPath } from '../state/paths';
import { undoResolveDecision } from '../state/decisionLog';
import { findSimilarPrecedents, recommend } from '../data/recommendDefaults';
import { bodyClass } from '../config';

export interface DecisionCardArgs {
  prefillText?: string;
  prefillSourceFile?: string;
}

export class DecisionCardPanel {
  private static panels = new Map<string, DecisionCardPanel>();
  private readonly panel: vscode.WebviewPanel;
  private disposables: vscode.Disposable[] = [];
  private prefillText?: string;
  private prefillSourceFile?: string;

  public static show(decisionId: string, store: StateStore, args?: DecisionCardArgs): void {
    const existing = DecisionCardPanel.panels.get(decisionId);
    if (existing) {
      if (args?.prefillText) {
        existing.prefillText = args.prefillText;
        existing.prefillSourceFile = args.prefillSourceFile;
        existing.refresh();
      }
      existing.panel.reveal();
      return;
    }
    const panel = vscode.window.createWebviewPanel(
      'architectCopilot.decisionCard',
      `Decision: ${decisionId}`,
      vscode.ViewColumn.Active,
      { enableScripts: true, retainContextWhenHidden: true }
    );
    DecisionCardPanel.panels.set(decisionId, new DecisionCardPanel(panel, decisionId, store, args));
  }

  private constructor(
    panel: vscode.WebviewPanel,
    private decisionId: string,
    private store: StateStore,
    args?: DecisionCardArgs
  ) {
    this.panel = panel;
    this.prefillText = args?.prefillText;
    this.prefillSourceFile = args?.prefillSourceFile;
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

  private findDecision(): { decision: PendingDecision; resolved: boolean } | null {
    const state = this.store.snapshot().state;
    if (!state) return null;
    const pending = state.pending_user_decisions.find((d) => d.id === this.decisionId);
    if (pending) return { decision: pending, resolved: false };
    const resolved = state.resolved_decisions?.find((d) => d.id === this.decisionId);
    if (resolved) return { decision: resolved as PendingDecision, resolved: true };
    return null;
  }

  private render(): string {
    const n = nonce();
    const cspStr = csp(this.panel.webview.cspSource, n);
    const cls = bodyClass();
    const found = this.findDecision();

    if (!found) {
      return wrap(cspStr, n, cls, `
        <header class="portal-header"><h1>Decision not found</h1></header>
        <p class="empty-hint">No decision with id <code>${escape(this.decisionId)}</code>.</p>
      `);
    }

    const { decision, resolved } = found;
    const snap = this.store.snapshot();
    const state = snap.state;
    const rec = state ? recommend({ decision, state, bootstrap: snap.bootstrap, ledger: snap.adrLedger }) : null;
    const precedents = findSimilarPrecedents(decision, snap.adrLedger);
    const relatedRoundtable = snap.roundtables.find((r) => {
      const filenameLower = r.filename.toLowerCase();
      const idLower = decision.id.toLowerCase().replace('-', '');
      return filenameLower.includes(idLower) || filenameLower.includes(decision.id.toLowerCase());
    });
    const hasOptions = !!(decision.options && decision.options.length > 0);

    const body = `
      <header class="portal-header">
        <h1>${escape(decision.id)}</h1>
        ${resolved ? pill('resolved', 'good') : pill('pending', 'warn')}
        ${decision.blocking_gate ? `<span class="subtitle">blocking ${escape(decision.blocking_gate)}</span>` : ''}
        ${resolved ? `<button class="danger" data-act="undo">↶ Undo Resolution</button>${helpFor('反悔這個已 resolved 的決定：搬回 pending list，相關 ADR/DR 標 superseded，並寫一筆反向 DR 進 adr-ledger.json。誤標 resolved 時用這個救回來。')}` : ''}
      </header>

      <div class="card" style="margin-bottom: 14px;">
        <h3>Topic</h3>
        <p style="font-size: 14px; margin: 0;">${escape(decision.topic)}</p>
      </div>

      ${this.renderLayer1Why(decision)}

      ${this.renderLayer2RelatedFiles(decision)}

      ${this.renderLayer3Precedents(precedents)}

      ${relatedRoundtable ? this.renderRoundtableBanner(relatedRoundtable.filename) : ''}

      ${hasOptions ? renderOptions(decision.options!) : ''}

      ${resolved ? this.renderResolvedSummary(decision as any) : this.renderLayer4Recommend(rec, hasOptions)}
    `;

    return wrap(cspStr, n, cls, body);
  }

  private renderLayer1Why(decision: PendingDecision): string {
    const gate = decision.blocking_gate ?? '(no gate)';
    const ref = decision.context_ref ?? '';
    return `
      <div class="card" style="margin-bottom: 12px;">
        <h3>📍 Layer 1 — Why this decision</h3>
        <p style="font-size: 12px; margin: 0;">
          這個問題從哪冒出來：<strong>${escape(gate)}</strong> 卡住此 OQ。
          ${ref ? `來源：<code>${escape(ref)}</code>` : '上游 driver 或 bootstrap 偵測到需要業主裁決。'}
        </p>
      </div>`;
  }

  private renderLayer2RelatedFiles(decision: PendingDecision): string {
    const snap = this.store.snapshot();
    const links: string[] = [];

    // PRD if blocking Gate1
    if (decision.blocking_gate === 'Gate1_PRD') {
      const feature = snap.state?.active_features[0];
      if (feature) links.push(toDocRelPath('prd', `${feature}.md`));
    }
    // bootstrap yaml always relevant
    const feature = snap.state?.active_features[0];
    if (feature) links.push(`.claude/context/devteam/bootstrap-${feature}.yaml`);
    // session report
    if (snap.state?.session_id) links.push(snap.state.session_report);
    // context_ref if any
    if (decision.context_ref) links.push(decision.context_ref);

    return `
      <div class="card" style="margin-bottom: 12px;">
        <h3>📎 Layer 2 — Related files</h3>
        ${links.length === 0 ? '<p class="empty-hint">No related files inferred.</p>' :
          `<ul style="margin: 0; padding-left: 20px; font-size: 12px;">${links.map((l) => `<li><code>${escape(l)}</code> <button class="secondary" data-act="open-file" data-arg="${escape(l)}" style="padding: 2px 6px; font-size: 10px;">Open</button></li>`).join('')}</ul>`}
      </div>`;
  }

  private renderLayer3Precedents(precedents: AdrLedgerEntry[]): string {
    return `
      <div class="card" style="margin-bottom: 12px;">
        <h3>🔍 Layer 3 — Similar precedents</h3>
        ${precedents.length === 0
          ? '<p class="empty-hint">無相似先例（adr-ledger 內未找到關鍵字匹配）。</p>'
          : `<ul style="margin: 0; padding-left: 20px; font-size: 12px;">${precedents.map((p) => `<li><code>${escape(p.id)}</code> ${escape(p.title)} <span class="empty-hint">(${escape(p.status)})</span></li>`).join('')}</ul>`
        }
      </div>`;
  }

  private renderRoundtableBanner(filename: string): string {
    return `
      <div class="card" style="margin-bottom: 12px; border-color: var(--info);">
        <h3 style="color: var(--info);">💬 Roundtable MoM 可參考</h3>
        <p style="margin: 0; font-size: 12px;">偵測到相關 Roundtable: <code>${escape(filename)}</code></p>
        <button class="secondary" data-act="open-roundtable" data-arg="${escape(filename)}" style="margin-top: 6px;">Open Roundtable Detail →</button>
      </div>`;
  }

  private renderLayer4Recommend(rec: any, hasOptions: boolean): string {
    if (!rec) return '';
    const prefill = this.prefillText ? `\n\n${this.prefillText}` : '';
    const isNoRec = rec.source === 'none';
    return `
      <div class="card" style="border-color: var(--good); margin-bottom: 12px;">
        <h3 style="color: var(--good);">💡 Layer 4 — Recommended answer</h3>

        ${isNoRec ? `
          <p class="empty-hint">${escape(rec.reasoning)}</p>
        ` : `
          <div style="padding: 10px; background: var(--card-bg); border: 1px solid var(--border); border-radius: 4px; margin-bottom: 10px;">
            <div style="font-weight: 700; font-size: 13px; margin-bottom: 4px;">▶ ${escape(rec.option_label)}</div>
            <div style="font-size: 12px; line-height: 1.55;">${escape(rec.reasoning)}</div>
            <div style="margin-top: 6px;">
              ${pill(rec.source, sourceKind(rec.source))}
              ${pill(`${rec.confidence} confidence`, confidenceKind(rec.confidence))}
              ${rec.source_ref ? `<span class="empty-hint" style="margin-left: 4px;">${escape(rec.source_ref)}</span>` : ''}
            </div>
          </div>

          <button data-act="approve-recommended">✓ Approve Recommended</button>${helpFor('一鍵接受上方推薦答案。會寫入 state.json + session narrative，OQ 移到 resolved 區。最快、最常用。不確定時就按這個 — 隨時可以 ↶ Undo。')}
        `}

        <details style="margin-top: 10px;">
          <summary style="cursor: pointer; font-size: 12px; color: var(--muted);">…or Modify / Pick / Discuss</summary>
          <div style="margin-top: 10px;">
            <p style="font-size: 12px; margin: 4px 0;"><strong>Modify</strong> — write your own resolution:</p>
            <textarea id="quick-text" placeholder="你的決定（會記到 state.json 與 session narrative）..." rows="3" style="width: 100%; padding: 6px 8px; background: var(--input-bg); color: var(--input-fg); border: 1px solid var(--border); border-radius: 4px; font-family: inherit; font-size: 13px;">${escape(prefill.trim())}</textarea>
            <button class="secondary" data-act="resolve-modify" style="margin-top: 6px;">📝 Save Modified Resolution</button>${helpFor('用左邊文字框的內容當作 resolution，覆蓋系統推薦。會寫入 state.json + session narrative。可隨時 ↶ Undo。')}

            ${hasOptions ? `
              <hr />
              <p style="font-size: 12px; margin: 4px 0;"><strong>Pick option</strong> — 選上方 options 區的一個選項：</p>
              <button class="secondary" data-act="resolve-pick">📋 Use Picked Option (writes DR)</button>${helpFor('從上方 Options 區選一個，會自動寫一筆 DR 到 adr-ledger.json（供下游 phase 引用）。適合 trade-off 明確的決策。')}
            ` : ''}

            <hr />
            <p style="font-size: 12px; margin: 4px 0;"><strong>Discuss</strong> — 開圓桌讓 AI agents 辯論：</p>
            <button class="secondary" data-act="resolve-roundtable">💬 Open Roundtable</button>${helpFor('啟動 /devteam-roundtable — 在 terminal 跑 background 圓桌會議，多個 AI persona 辯論後產出 MoM 檔案。會議結束後可從 Roundtable Detail 面板「Apply to OQ-X」一鍵回流。')}
          </div>
        </details>
      </div>`;
  }

  private renderResolvedSummary(resolved: any): string {
    return `
      <div class="card" style="border-color: var(--good); margin-bottom: 12px;">
        <h3 style="color: var(--good);">✓ Resolved</h3>
        <dl class="kv">
          <dt>Mode</dt><dd>${escape(resolved.resolution_mode ?? '?')}</dd>
          <dt>Resolved at</dt><dd>${escape(resolved.resolved_at ?? '?')}</dd>
          ${resolved.chosen_option ? `<dt>Chosen option</dt><dd>${escape(resolved.chosen_option)}</dd>` : ''}
          ${resolved.related_adr ? `<dt>Related ADR/DR</dt><dd><code>${escape(resolved.related_adr)}</code></dd>` : ''}
        </dl>
        ${resolved.resolution_text ? `
          <div style="margin-top: 10px; padding: 8px; background: var(--card-bg); border: 1px solid var(--border); border-radius: 4px;">
            <div class="empty-hint" style="font-size: 11px; margin-bottom: 4px;">Resolution note:</div>
            <pre style="margin: 0; white-space: pre-wrap; font-size: 12px;">${escape(resolved.resolution_text)}</pre>
          </div>
        ` : ''}
        <p class="empty-hint" style="margin-top: 10px;">改變主意？按上方 ↶ Undo Resolution 把這條搬回 pending list。</p>
      </div>`;
  }

  private async handle(msg: { type: string; act?: string; arg?: string; mode?: string; text?: string; option?: string }): Promise<void> {
    if (msg.type === 'action' && msg.act === 'undo') {
      const choice = await vscode.window.showWarningMessage(
        `把 ${this.decisionId} 從 resolved 搬回 pending list？`,
        { modal: true },
        'Undo'
      );
      if (choice !== 'Undo') return;
      const result = undoResolveDecision(this.store.getRoot(), this.decisionId);
      if (!result.ok) {
        vscode.window.showErrorMessage(`Undo failed: ${result.error}`);
        return;
      }
      // mark related ADR/DR as superseded if any
      const decision = this.findDecision()?.decision as any;
      if (decision?.related_adr) {
        supersedeAdr(this.store.getRoot(), decision.related_adr, `OQ ${this.decisionId} undone by manager`);
        appendAdrLedgerEntry(this.store.getRoot(), {
          id: `DR-${Date.now().toString().slice(-6)}`,
          type: 'DR',
          title: `Undo of ${decision.related_adr}: ${decision.topic} (manager reversed)`,
          decided_at: new Date().toISOString(),
          decided_by: 'vscode-portal',
          status: 'accepted',
          related_decision: this.decisionId,
          supersedes: decision.related_adr,
        });
      }
      vscode.window.showInformationMessage(`↶ ${this.decisionId} reverted to pending list.`);
      this.store.refresh();
      this.refresh();
      return;
    }

    if (msg.type === 'action' && msg.act === 'open-file' && msg.arg) {
      const abs = path.isAbsolute(msg.arg) ? msg.arg : path.join(this.store.getRoot(), msg.arg);
      vscode.commands.executeCommand('architectCopilot.openFile', abs);
      return;
    }

    if (msg.type === 'action' && msg.act === 'open-roundtable' && msg.arg) {
      vscode.commands.executeCommand('architectCopilot.openRoundtable', msg.arg);
      return;
    }

    if (msg.type !== 'resolve') return;

    const mode = msg.mode as 'quick' | 'pick-option' | 'roundtable';
    if (mode === 'roundtable') {
      const decision = this.findDecision()?.decision;
      const topic = decision ? `${decision.id} ${decision.topic}` : this.decisionId;
      const choice = await vscode.window.showInformationMessage(
        `將執行 /devteam-roundtable "${truncate(topic, 80)}"\n啟動圓桌會議？`,
        { modal: true },
        'Approve & Run'
      );
      if (choice !== 'Approve & Run') return;
      const terminal = vscode.window.activeTerminal ?? vscode.window.createTerminal('Architect Copilot');
      terminal.show();
      terminal.sendText(`claude /devteam-roundtable "${topic.replace(/"/g, '\\"')}"`, true); // auto-Enter
      return;
    }

    const decision = this.findDecision()?.decision;
    if (!decision) {
      vscode.window.showErrorMessage('Decision not found.');
      return;
    }

    let chosenOption: string | undefined;
    let resolutionText: string | undefined = msg.text?.trim();
    let relatedAdr: string | undefined;

    if (mode === 'pick-option') {
      chosenOption = msg.option;
      if (!chosenOption) {
        vscode.window.showWarningMessage('Pick an option first.');
        return;
      }
      const drId = `DR-${Date.now().toString().slice(-6)}`;
      appendAdrLedgerEntry(this.store.getRoot(), {
        id: drId,
        type: 'DR',
        title: `${decision.id}: chose "${chosenOption}"`,
        feature: this.store.snapshot().state?.active_features[0],
        decided_at: new Date().toISOString(),
        decided_by: 'vscode-portal',
        status: 'accepted',
        related_decision: decision.id,
      });
      relatedAdr = drId;
      resolutionText = resolutionText || `chosen option: ${chosenOption}`;
    }

    const result = resolvePendingDecision({
      root: this.store.getRoot(),
      decisionId: decision.id,
      mode,
      resolutionText,
      chosenOption,
      relatedAdr,
    });

    if (!result.ok) {
      vscode.window.showErrorMessage(`Resolve failed: ${result.error}`);
      return;
    }

    const state = this.store.snapshot().state;
    if (state) {
      appendSessionNarrative(
        this.store.getRoot(),
        state.session_id,
        `\n## [${new Date().toISOString()}] decision resolved (${mode}) via portal\n\n` +
          `- **${decision.id}**: ${decision.topic}\n` +
          (chosenOption ? `- Chosen option: ${chosenOption}\n` : '') +
          (resolutionText ? `- Note: ${resolutionText}\n` : '') +
          (relatedAdr ? `- Related: ${relatedAdr}\n` : '') +
          (this.prefillSourceFile ? `- From Roundtable: ${this.prefillSourceFile}\n` : '') +
          '\n'
      );
    }

    vscode.window.showInformationMessage(`✓ ${decision.id} resolved (${mode}).`);
    this.store.refresh();
    this.panel.dispose();
  }

  public dispose(): void {
    DecisionCardPanel.panels.delete(this.decisionId);
    this.panel.dispose();
    while (this.disposables.length) {
      const d = this.disposables.pop();
      if (d) d.dispose();
    }
  }
}

function renderOptions(options: NonNullable<PendingDecision['options']>): string {
  return `
    <div class="card" style="margin-bottom: 12px;">
      <h3>Options</h3>
      ${options.map((opt, i) => `
        <div style="padding: 10px; border: 1px solid var(--border); border-radius: 4px; margin-bottom: 8px;">
          <label style="display: flex; align-items: flex-start; gap: 8px; cursor: pointer;">
            <input type="radio" name="option" value="${escape(opt.label)}" data-opt="${i}" />
            <div style="flex: 1;">
              <div style="font-weight: 700;">${escape(opt.label)}${opt.recommended ? ' ' + pill('recommended', 'good') : ''}</div>
              ${opt.summary ? `<div style="font-size: 12px; color: var(--muted); margin-top: 4px;">${escape(opt.summary)}</div>` : ''}
              ${opt.pros ? `<div style="margin-top: 6px; font-size: 12px;"><strong>Pros:</strong> ${opt.pros.map(escape).join(' • ')}</div>` : ''}
              ${opt.cons ? `<div style="font-size: 12px;"><strong>Cons:</strong> ${opt.cons.map(escape).join(' • ')}</div>` : ''}
              ${opt.fit ? `<div style="font-size: 12px;"><strong>適用:</strong> ${escape(opt.fit)}</div>` : ''}
              ${opt.anti_fit ? `<div style="font-size: 12px;"><strong>反例:</strong> ${escape(opt.anti_fit)}</div>` : ''}
            </div>
          </label>
        </div>
      `).join('')}
    </div>`;
}

function sourceKind(source: string): 'good' | 'warn' | 'bad' | 'pending' | 'info' {
  if (source === 'options-flag' || source === 'precedent') return 'good';
  if (source === 'catalog' || source === 'cascade-hints') return 'info';
  return 'pending';
}

function confidenceKind(c: string): 'good' | 'warn' | 'bad' | 'pending' | 'info' {
  if (c === 'high') return 'good';
  if (c === 'medium') return 'warn';
  return 'pending';
}

function wrap(cspStr: string, nonceVal: string, cls: string, body: string): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <meta http-equiv="Content-Security-Policy" content="${cspStr}" />
  <style>${COMMON_STYLES}</style>
</head>
<body class="${cls}">
  ${body}
  <script nonce="${nonceVal}">
    const vscode = acquireVsCodeApi();
    function pickedOption() {
      const r = document.querySelector('input[name="option"]:checked');
      return r ? r.value : null;
    }
    function quickText() {
      const t = document.getElementById('quick-text');
      return t ? t.value : '';
    }
    document.querySelectorAll('[data-act]').forEach((b) => {
      b.addEventListener('click', () => {
        const act = b.getAttribute('data-act');
        const arg = b.getAttribute('data-arg') || undefined;
        if (act === 'approve-recommended') {
          vscode.postMessage({ type: 'resolve', mode: 'quick', text: 'approve-recommended' });
        } else if (act === 'resolve-modify') {
          vscode.postMessage({ type: 'resolve', mode: 'quick', text: quickText() });
        } else if (act === 'resolve-pick') {
          vscode.postMessage({ type: 'resolve', mode: 'pick-option', option: pickedOption() });
        } else if (act === 'resolve-roundtable') {
          vscode.postMessage({ type: 'resolve', mode: 'roundtable' });
        } else {
          vscode.postMessage({ type: 'action', act, arg });
        }
      });
    });
  </script>
</body>
</html>`;
}
