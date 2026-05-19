import { DecisionLogEntry, DevTeamState, PendingDecision, ResolvedDecision } from './types';
import { readState } from './reader';
import { writeState } from './writer';

export function appendLog(state: DevTeamState, entry: DecisionLogEntry): void {
  if (!state.decision_log) state.decision_log = [];
  state.decision_log.push(entry);
}

export function undoResolveDecision(
  root: string,
  decisionId: string
): { ok: boolean; restored?: PendingDecision; error?: string } {
  const state = readState(root);
  if (!state) return { ok: false, error: 'state.json not found' };
  const idx = (state.resolved_decisions ?? []).findIndex((d) => d.id === decisionId);
  if (idx < 0) return { ok: false, error: `decision ${decisionId} not in resolved_decisions` };

  const resolved = state.resolved_decisions![idx];

  // strip resolution fields, keep base PendingDecision
  const restored: PendingDecision = {
    id: resolved.id,
    topic: resolved.topic,
    blocking_gate: resolved.blocking_gate,
    context_ref: resolved.context_ref,
    options: resolved.options,
    raised_at: resolved.raised_at,
    raised_by: resolved.raised_by,
  };

  state.resolved_decisions!.splice(idx, 1);
  state.pending_user_decisions.unshift(restored); // bring back to top for visibility

  appendLog(state, {
    decision_id: decisionId,
    event: 'undone',
    at: new Date().toISOString(),
    by: 'vscode-portal',
    note: `Undone resolution (was: ${resolved.resolution_mode})${resolved.related_adr ? `, related ${resolved.related_adr} flagged superseded` : ''}`,
  });

  state.phase_history.push({
    phase: state.current_phase,
    driver: 'vscode-portal',
    at: new Date().toISOString(),
    artifact: `decision ${decisionId} undone`,
  });

  writeState(root, state);
  return { ok: true, restored };
}

export function logResolvedEvent(
  state: DevTeamState,
  decisionId: string,
  mode: 'quick' | 'pick-option' | 'roundtable',
  note?: string
): void {
  appendLog(state, {
    decision_id: decisionId,
    event: 'resolved',
    at: new Date().toISOString(),
    by: 'vscode-portal',
    mode,
    note,
  });
}
