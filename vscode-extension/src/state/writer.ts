import * as fs from 'fs';
import * as path from 'path';
import * as YAML from 'yaml';
import {
  AdrLedgerEntry,
  BootstrapIntent,
  DevTeamState,
  PendingDecision,
  ResolvedDecision,
} from './types';
import {
  getAdrLedgerPath,
  getBootstrapYamlPath,
  getDevTeamContextDir,
  getSessionReportPath,
  getStatePath,
} from './paths';
import { readAdrLedger, readState } from './reader';

export function ensureContextDir(root: string): void {
  const dir = getDevTeamContextDir(root);
  fs.mkdirSync(path.join(dir, 'documents'), { recursive: true });
  fs.mkdirSync(path.join(dir, 'reviews'), { recursive: true });
  fs.mkdirSync(path.join(dir, 'evidence'), { recursive: true });
}

export function writeState(root: string, state: DevTeamState): void {
  ensureContextDir(root);
  fs.writeFileSync(getStatePath(root), JSON.stringify(state, null, 2) + '\n', 'utf-8');
}

export function writeBootstrapIntent(root: string, intent: BootstrapIntent): void {
  ensureContextDir(root);
  fs.writeFileSync(getBootstrapYamlPath(root, intent.feature), YAML.stringify(intent), 'utf-8');
}

export function appendSessionNarrative(root: string, sessionId: string, content: string): void {
  const p = getSessionReportPath(root, sessionId);
  const exists = fs.existsSync(p);
  if (!exists) {
    fs.writeFileSync(p, `# Session: ${sessionId}\n\n---\n\n`, 'utf-8');
  }
  fs.appendFileSync(p, content, 'utf-8');
}

export function buildInitialState(args: {
  sessionId: string;
  feature: string;
  problemDescription: string;
}): DevTeamState {
  return {
    schema_version: 1,
    session_id: args.sessionId,
    release_id: null,
    created_at: new Date().toISOString(),
    current_phase: 'P0_DISCOVERY',
    active_features: [args.feature],
    problem_description: args.problemDescription,
    phase_history: [],
    bootstrap_done: false,
    ux_mode: null,
    weak_areas: [],
    freeze_gates: {
      Gate1_PRD: 'not_reached',
      Gate2_UXFlow: 'not_reached',
      Gate3_SystemSpec: 'not_reached',
      Gate4_NFR_ADR: 'not_reached',
      Gate5a_API: 'not_reached',
      Gate5b_DBSchema: 'not_reached',
      Gate6_TestReady: 'not_reached',
      Gate7_Release: 'not_reached',
    },
    pending_user_decisions: [],
    cascade_policy: 'manual_confirm',
    review_intensity_default: 'standard',
    session_report: `.claude/context/devteam/session-${args.sessionId}.md`,
  };
}

export function resolvePendingDecision(args: {
  root: string;
  decisionId: string;
  mode: ResolvedDecision['resolution_mode'];
  resolutionText?: string;
  chosenOption?: string;
  relatedAdr?: string;
}): { ok: boolean; resolved?: ResolvedDecision; error?: string } {
  const state = readState(args.root);
  if (!state) return { ok: false, error: 'state.json not found' };

  const idx = state.pending_user_decisions.findIndex((d) => d.id === args.decisionId);
  if (idx < 0) return { ok: false, error: `decision ${args.decisionId} not in pending list` };

  const pending = state.pending_user_decisions[idx];
  const resolved: ResolvedDecision = {
    ...pending,
    resolution_mode: args.mode,
    resolution_text: args.resolutionText,
    chosen_option: args.chosenOption,
    related_adr: args.relatedAdr,
    resolved_at: new Date().toISOString(),
  };

  state.pending_user_decisions.splice(idx, 1);
  if (!state.resolved_decisions) state.resolved_decisions = [];
  state.resolved_decisions.push(resolved);
  if (!state.decision_log) state.decision_log = [];
  state.decision_log.push({
    decision_id: args.decisionId,
    event: 'resolved',
    at: new Date().toISOString(),
    by: 'vscode-portal',
    mode: args.mode,
    note: args.resolutionText,
  });
  state.phase_history.push({
    phase: state.current_phase,
    driver: 'vscode-portal',
    at: new Date().toISOString(),
    artifact: `decision ${args.decisionId} resolved (${args.mode})`,
  });

  writeState(args.root, state);
  return { ok: true, resolved };
}

export function supersedeAdr(root: string, adrId: string, supersededByNote: string): boolean {
  const ledger = readAdrLedger(root);
  const entry = ledger.find((e) => e.id === adrId);
  if (!entry) return false;
  entry.status = 'superseded';
  fs.writeFileSync(getAdrLedgerPath(root), JSON.stringify(ledger, null, 2) + '\n', 'utf-8');
  return true;
}

export function appendAdrLedgerEntry(root: string, entry: AdrLedgerEntry): void {
  ensureContextDir(root);
  const ledger = readAdrLedger(root);
  ledger.push(entry);
  fs.writeFileSync(getAdrLedgerPath(root), JSON.stringify(ledger, null, 2) + '\n', 'utf-8');
}

export function addPendingDecision(root: string, decision: PendingDecision): boolean {
  const state = readState(root);
  if (!state) return false;
  if (state.pending_user_decisions.some((d) => d.id === decision.id)) return false;
  state.pending_user_decisions.push(decision);
  writeState(root, state);
  return true;
}
