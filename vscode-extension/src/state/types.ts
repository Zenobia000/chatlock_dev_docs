export type UxMode = 'educational' | 'balanced' | 'fast-handoff';

export type GateStatus = 'not_reached' | 'ready_to_review' | 'in_review' | 'frozen' | 'blocked';

export interface DevTeamState {
  schema_version: number;
  session_id: string;
  release_id: string | null;
  created_at: string;
  current_phase: string;
  active_features: string[];
  problem_description: string;
  phase_history: PhaseHistoryEntry[];
  bootstrap_done: boolean;
  ux_mode: UxMode | null;
  weak_areas: string[];
  bootstrap_metadata?: BootstrapMetadata;
  freeze_gates: Record<string, GateStatus>;
  pending_user_decisions: PendingDecision[];
  resolved_decisions?: ResolvedDecision[];
  decision_log?: DecisionLogEntry[];
  cascade_policy: string | Record<string, string>;
  review_intensity_default: 'light' | 'standard' | 'strict';
  session_report: string;
}

export interface PendingDecision {
  id: string;
  topic: string;
  blocking_gate?: string;
  context_ref?: string;
  options?: DecisionOption[];
  raised_at?: string;
  raised_by?: string;
}

export interface DecisionOption {
  label: string;
  summary?: string;
  pros?: string[];
  cons?: string[];
  fit?: string;
  anti_fit?: string;
  recommended?: boolean;
}

export interface ResolvedDecision extends PendingDecision {
  resolution_mode: 'quick' | 'pick-option' | 'roundtable';
  resolution_text?: string;
  chosen_option?: string;
  resolved_at: string;
  related_adr?: string;
}

export interface DocIndexEntry {
  status?: 'draft' | 'reviewed' | 'frozen' | 'superseded';
  version?: number;
  owner_role?: string;
  created_at?: string;
  updated_at?: string;
  generated_by?: string;
  gate1_status?: string;
  blockers?: string[];
  open_questions?: string[];
  review_personas?: string[];
  downstream_deps_count?: number;
  [k: string]: unknown;
}

export interface DocMeta {
  path: string;
  owner_role: string;
  review_personas?: string[];
  downstream_deps?: string[];
  upstream_refs?: string[];
  version_history?: { v: number; at: string; by: string; summary: string }[];
  review_history?: { at: string; persona: string; verdict: string; report?: string }[];
}

export interface AdrLedgerEntry {
  id: string;
  type: 'ADR' | 'DR';
  title: string;
  feature?: string;
  tags?: string[];
  related_kb?: string[];
  decided_at: string;
  decided_by?: string;
  status: 'proposed' | 'accepted' | 'superseded' | 'deprecated';
  related_decision?: string;
  supersedes?: string;
}

export interface Snapshot {
  version: number;
  timestamp: string;
  source: 'cli' | 'vscode-editor' | 'vscode-restore' | 'vscode-create';
  note?: string;
  filename: string; // file under snapshots/{slug}/
  size: number;
}

export interface DecisionLogEntry {
  decision_id: string;
  event: 'created' | 'resolved' | 'undone' | 'reopened';
  at: string;
  by: string;
  mode?: 'quick' | 'pick-option' | 'roundtable';
  note?: string;
}

export type DefaultSource =
  | 'oq-field'
  | 'options-flag'
  | 'catalog'
  | 'cascade-hints'
  | 'precedent'
  | 'none';

export interface DefaultRecommendation {
  option_label: string;
  reasoning: string;
  source: DefaultSource;
  source_ref?: string;
  confidence: 'high' | 'medium' | 'low';
}

export interface RoundtableMom {
  topic: string;
  feature?: string;
  related_decision?: string;
  executive_summary: string;
  decisions: string[];
  action_items: string[];
  open_questions: string[];
  raw_markdown: string;
  file_path: string;
}

export interface PhaseHistoryEntry {
  phase: string;
  driver: string;
  at: string;
  artifact: string;
}

export interface BootstrapMetadata {
  completed_at: string;
  intent_file: string;
  open_questions_count: number;
}

export interface BootstrapIntent {
  schema_version: number;
  feature: string;
  created_at: string;
  created_by: string;
  business: {
    problem_statement: string;
    user_scale: string;
    latency_sensitivity: string;
  };
  compliance: {
    data_types: string[];
    frameworks: string[];
    audit_required: string;
  };
  team_timeline: {
    team_size: string;
    first_release_deadline: string;
  };
  stack: {
    primary_language: string;
    deployment_env: string;
  };
  learning: {
    mode: UxMode;
    weak_areas: string[];
  };
  open_questions: { question_id: string; reason: string }[];
}
