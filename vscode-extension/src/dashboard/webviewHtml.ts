import { PHASES, phaseIndex, PhaseDef } from '../data/phaseCatalog';
import { GATES, gatesByPhase } from '../data/gateCatalog';
import { DocIndexEntry, DevTeamState, PendingDecision } from '../state/types';
import { COMMON_STYLES } from '../panels/shared/styles';
import { csp, escape, helpFor, nonce as makeNonce, pill, truncate } from '../panels/shared/htmlUtils';

export interface PilotDashboardData {
  state: DevTeamState | null;
  documents: Record<string, DocIndexEntry>;
  hasBootstrapYaml: boolean;
  feature: string | null;
  recentHistory: { phase: string; driver: string; at: string; artifact: string }[];
  bodyClass?: string;
  roundtableCount?: number;
}

export function getDashboardHtml(cspSource: string, data: PilotDashboardData): string {
  const n = makeNonce();
  const cspStr = csp(cspSource, n);
  const body = data.state ? renderFull(data) : renderEmpty();
  const cls = data.bodyClass ?? '';

  return `<!DOCTYPE html>
<html lang="zh-Hant">
<head>
  <meta charset="UTF-8" />
  <meta http-equiv="Content-Security-Policy" content="${cspStr}" />
  <title>Architect Copilot — Pilot Dashboard</title>
  <style>
    ${COMMON_STYLES}
    body { padding: 24px 32px; }

    /* Vertical phase timeline */
    .timeline { position: relative; padding-left: 28px; }
    .timeline::before {
      content: '';
      position: absolute;
      left: 11px;
      top: 6px;
      bottom: 6px;
      width: 2px;
      background: var(--border);
    }
    .phase-row { position: relative; padding: 0 0 14px 14px; }
    .phase-row::before {
      content: '';
      position: absolute;
      left: -22px;
      top: 6px;
      width: 18px;
      height: 18px;
      border-radius: 50%;
      background: var(--bg);
      border: 2px solid var(--pending);
      box-sizing: border-box;
    }
    .phase-row.past::before {
      background: var(--good);
      border-color: var(--good);
    }
    .phase-row.current::before {
      background: var(--accent);
      border-color: var(--accent);
      box-shadow: 0 0 0 4px var(--info-bg);
    }
    body.vscode-high-contrast .phase-row.current::before,
    body.vscode-high-contrast-light .phase-row.current::before,
    body.force-hc .phase-row.current::before {
      box-shadow: 0 0 0 4px var(--vscode-editor-foreground);
    }
    .phase-card {
      border: 1px solid var(--border);
      border-radius: 6px;
      padding: 12px 14px;
      background: var(--card-bg);
    }
    .phase-card.current {
      border-color: var(--accent);
      border-width: 2px;
    }
    body.vscode-high-contrast .phase-card.current,
    body.vscode-high-contrast-light .phase-card.current,
    body.force-hc .phase-card.current {
      border-width: 2px;
      background: var(--bg);
    }
    .phase-card .ph-header {
      display: flex;
      align-items: baseline;
      gap: 10px;
      margin-bottom: 6px;
    }
    .phase-card .ph-header h3 {
      margin: 0;
      font-size: 14px;
      color: var(--fg);
      text-transform: none;
      letter-spacing: normal;
    }
    .phase-card.current .ph-header h3 { color: var(--accent); }
    .phase-card.past .ph-header h3 { color: var(--good); }
    .phase-card .ph-meta { color: var(--muted); font-size: 11px; }
    .phase-card .ph-body { font-size: 12px; line-height: 1.55; }
    .phase-card .ph-body .row { display: flex; gap: 6px; padding: 3px 0; align-items: center; flex-wrap: wrap; }
    .phase-card .ph-body .row .label { color: var(--muted); min-width: 78px; font-size: 11px; }
    .phase-card .ph-actions { display: flex; gap: 6px; margin-top: 8px; flex-wrap: wrap; }

    /* Decisions block */
    .decisions-list .row {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 8px 0;
      border-bottom: 1px var(--dashed-style) var(--border);
    }
    .decisions-list .row:last-child { border-bottom: none; }
    .decisions-list .row .topic { flex: 1; font-size: 12px; }
    .decisions-list .row .gate { font-family: monospace; font-size: 11px; color: var(--muted); }

    .activity { font-size: 12px; }
    .activity .row {
      padding: 5px 0;
      border-bottom: 1px var(--dashed-style) var(--border);
      display: flex; gap: 10px;
    }
    .activity .row:last-child { border-bottom: none; }
    .activity .time { color: var(--muted); font-family: monospace; font-size: 11px; min-width: 100px; }
    .activity .driver { color: var(--accent); font-weight: 600; min-width: 80px; }

    .actions-bar { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 16px; }
  </style>
</head>
<body class="${cls}">
  ${body}
  <script nonce="${n}">
    const vscode = acquireVsCodeApi();
    document.querySelectorAll('[data-act]').forEach((b) => {
      b.addEventListener('click', () => {
        const act = b.getAttribute('data-act');
        const arg = b.getAttribute('data-arg') || undefined;
        vscode.postMessage({ type: 'action', action: act, arg });
      });
    });
  </script>
</body>
</html>`;
}

function renderEmpty(): string {
  return `
    <header class="portal-header">
      <h1>🚀 Architect Copilot</h1>
      <span class="subtitle">no active session</span>
    </header>
    <div style="text-align:center; padding: 48px 12px;">
      <p class="empty-hint">尚未開始 DevTeam session。先跑 Bootstrap Questionnaire 把 senior 隱性思考顯化。</p>
      <button data-act="start-bootstrap" style="margin-top: 14px;">Start Bootstrap Questionnaire</button>
    </div>`;
}

function renderFull(data: PilotDashboardData): string {
  const s = data.state!;
  const feature = data.feature ?? '(no feature)';

  return `
    <header class="portal-header">
      <h1>🚀 Pilot Dashboard</h1>
      <span class="subtitle">session: <code>${escape(s.session_id)}</code></span>
      <span class="subtitle">feature: <code>${escape(feature)}</code></span>
      <span class="subtitle">UX mode: ${pill(s.ux_mode ?? 'not set', s.ux_mode ? 'info' : 'pending')}</span>
    </header>

    ${renderDecisionsCard(s.pending_user_decisions)}

    <div class="card" style="margin-top: 16px;">
      <h3>Phase Timeline</h3>
      <div class="timeline">
        ${PHASES.map((p) => renderPhaseRow(p, s, data.documents)).join('')}
      </div>
    </div>

    <div style="margin-top: 16px;">
      ${renderActivityCard(data.recentHistory)}
    </div>

    <div class="actions-bar">
      <button data-act="start-bootstrap">${s.bootstrap_done ? '↺ Re-run Bootstrap' : 'Start Bootstrap'}</button>${helpFor(s.bootstrap_done ? '重跑 Architect Bootstrap Questionnaire — 12 題重填，會覆蓋既有的 bootstrap yaml。Stack/規模/合規改變時用這個。' : '啟動 12 題 Architect Bootstrap Questionnaire — 把 senior 隱性思考（規模 / 合規 / 團隊 / stack / 學習目標）顯化。完成後 PRD 會自動 prefill。')}
      ${s.pending_user_decisions.length > 0 ? `<button data-act="resolve-next">⚡ Resolve Next Decision</button>${helpFor('打開 pending list 第一筆 OQ 的 Decision Card — 系統會顯示 4 層脈絡（Why/Files/Precedents/Recommended）幫你決定。可一鍵 Approve 推薦答案。')}` : ''}
      <button class="secondary" data-act="run-pm">▶ Run /devteam-pm</button>${helpFor('在 terminal 啟動 PM driver skill — 會讀 bootstrap yaml 預填 PRD，業主只需補關鍵欄位。會先彈確認對話框。')}
      <button class="secondary" data-act="run-freeze">🚩 Freeze Active Gate</button>${helpFor('凍結當前 ready_to_review 狀態的 Gate — 觸發 multi-role critique（依 KB 04 配置 personas），產出 review report。')}
      <button class="secondary" data-act="open-state">📄 Open state.json</button>${helpFor('開啟 raw state.json — 給技術使用者直接看 / 手動編輯。一般情境用 UI 操作即可。')}
      <button class="secondary" data-act="reload">⟳ Reload</button>${helpFor('強制重新讀取 .claude/context/devteam/ 所有狀態檔。檔案 watcher 失效（WSL/網路磁碟常見）時用這個。')}
    </div>`;
}

function renderDecisionsCard(decisions: PendingDecision[]): string {
  const count = decisions.length;
  if (count === 0) {
    return `
      <div class="card" style="margin-top: 16px; border-color: var(--good);">
        <h3 style="color: var(--good);">✓ Decisions</h3>
        <p class="empty-hint">All caught up — no pending decisions.</p>
      </div>`;
  }
  const top = decisions.slice(0, 5);
  return `
    <div class="card" style="margin-top: 16px; border-color: var(--warn);">
      <h3 class="warn" style="color: var(--warn);">⚠ Decisions Needing Confirmation (${count})</h3>
      <p class="empty-hint" style="margin-top: 0;">每張卡都附「推薦答案 + 理由」，你只需 Approve 或 Modify。</p>
      <div class="decisions-list">
        ${top.map((d) => `
          <div class="row">
            <code>${escape(d.id)}</code>
            <span class="topic">${escape(truncate(d.topic, 80))}</span>
            <span class="gate">${escape(d.blocking_gate ?? '')}</span>
            <button data-act="open-decision" data-arg="${escape(d.id)}">Review →</button>
          </div>
        `).join('')}
        ${count > 5 ? `<p class="empty-hint">+${count - 5} more in Decisions tree (sidebar).</p>` : ''}
      </div>
    </div>`;
}

function renderPhaseRow(phase: PhaseDef, state: DevTeamState, documents: Record<string, DocIndexEntry>): string {
  const idx = phaseIndex(phase.id);
  const currentIdx = phaseIndex(state.current_phase);
  const cls = idx === currentIdx ? 'current' : idx < currentIdx ? 'past' : 'future';

  // artifacts for this phase: filter documents/index.json
  const phaseDocs = Object.entries(documents).filter(([p]) => {
    return phase.expectedDocs.some((d) => {
      const prefix = d.path.replace(/{feature}.*$/, '').replace(/\*.*$/, '');
      return p.startsWith(prefix.replace(/\/$/, '').replace(/^docs\//, 'docs/'));
    });
  });

  // gates for this phase
  const phaseGates = gatesByPhase(phase.id);
  const gateInfo = phaseGates
    .map((g) => {
      const st = state.freeze_gates[g.id] ?? 'not_reached';
      return `${escape(g.id)} ${pill(st, gateKind(st))}`;
    })
    .join(' &nbsp; ');

  // count pending decisions blocking this phase's gates
  const blockingDecisions = state.pending_user_decisions.filter(
    (d) => d.blocking_gate && phaseGates.some((g) => g.id === d.blocking_gate)
  ).length;

  const driverChips =
    phase.drivers.map((d) => `<span class="tag">${escape(d)}</span>`).join('') +
    (phase.parallelDrivers ?? [])
      .map((d) => `<span class="tag">${escape(d)} (parallel)</span>`)
      .join('');

  const isFolded = cls === 'past' || (cls === 'future' && idx > currentIdx + 1);
  const summary = isFolded
    ? `
      <div class="ph-body">
        <span class="empty-hint">${cls === 'past' ? `✓ done — ${phaseDocs.length} artifact(s)` : `pending — driver: ${phase.drivers.join(', ')}`}</span>
      </div>
    `
    : `
      <div class="ph-body">
        <div class="row"><span class="label">Drivers</span>${driverChips}</div>
        ${phaseGates.length > 0 ? `<div class="row"><span class="label">Gates</span>${gateInfo}</div>` : ''}
        ${blockingDecisions > 0 ? `<div class="row"><span class="label">Blockers</span><span style="color: var(--warn);">❗ ${blockingDecisions} pending decision(s)</span></div>` : ''}
        <div class="row"><span class="label">Artifacts</span>${
          phaseDocs.length === 0
            ? `<span class="empty-hint">(待 ${phase.shortLabel} driver 產出)</span>`
            : phaseDocs.map(([p, meta]) => `<code>${escape(p.replace(/^docs\//, ''))}</code> ${pill(meta.status ?? '?', docKind(meta.status))}`).join(' &nbsp; ')
        }</div>
      </div>
      <div class="ph-actions">
        ${phase.drivers.map((d) => `<button data-act="run-driver" data-arg="${escape(d)}">▶ Run /${escape(d)}</button>${helpFor(`在 terminal 啟動 ${d} skill — 該 skill 會讀當前 phase 上下文，產出對應文件並更新 documents/index.json。會先彈確認對話框。`)}`).join('')}
        ${phaseGates.map((g) => `<button class="secondary" data-act="freeze-gate" data-arg="${escape(g.id)}">🚩 Freeze ${escape(g.id)}</button>${helpFor(`凍結 ${g.id} — 觸發 multi-role critique。會先彈確認對話框。Gate 必須先到 ready_to_review 狀態。`)}`).join('')}
        <button class="secondary" data-act="open-phase" data-arg="${escape(phase.id)}">View Detail →</button>${helpFor('打開 Phase Detail 面板 — 看完整 evidence checklist + drivers + 預期 artifacts，學習這個 phase 該交付什麼。')}
      </div>
    `;

  return `
    <div class="phase-row ${cls}">
      <div class="phase-card ${cls}">
        <div class="ph-header">
          <h3>${escape(phase.label)}</h3>
          <span class="ph-meta">${cls === 'current' ? '◀ CURRENT' : cls === 'past' ? '✓ done' : '⏳ pending'}</span>
        </div>
        ${summary}
      </div>
    </div>`;
}

function renderActivityCard(history: { phase: string; driver: string; at: string; artifact: string }[]): string {
  if (history.length === 0) {
    return `<div class="card"><h3>Recent Activity</h3><p class="empty-hint">No history yet.</p></div>`;
  }
  const recent = history.slice(-5).reverse();
  return `
    <div class="card">
      <h3>Recent Activity</h3>
      <div class="activity">
        ${recent.map((h) => `
          <div class="row">
            <span class="time">${escape(h.at.slice(11, 19))}</span>
            <span class="driver">${escape(h.driver)}</span>
            <span>${escape(h.artifact)}</span>
          </div>
        `).join('')}
      </div>
    </div>`;
}

function gateKind(status: string): 'good' | 'warn' | 'bad' | 'pending' | 'info' {
  if (status === 'frozen') return 'good';
  if (status === 'ready_to_review' || status === 'in_review') return 'warn';
  if (status === 'blocked') return 'bad';
  return 'pending';
}

function docKind(status?: string): 'good' | 'warn' | 'bad' | 'pending' | 'info' {
  if (status === 'frozen') return 'good';
  if (status === 'reviewed') return 'info';
  if (status === 'draft') return 'warn';
  if (status === 'superseded') return 'pending';
  return 'pending';
}
