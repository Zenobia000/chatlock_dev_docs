export type PersonaGroup =
  | 'discovery'
  | 'analysis'
  | 'architecture'
  | 'design'
  | 'delivery'
  | 'release'
  | 'meta';

export interface PersonaDef {
  id: string;
  label: string;
  group: PersonaGroup;
  groupLabel: string;
  phaseIds: string[];
  kind: 'driver' | 'critique' | 'meta';
  description: string;
  agentFile: string;
}

export const PERSONAS: PersonaDef[] = [
  // Discovery — P0
  {
    id: 'pm',
    label: 'PM',
    group: 'discovery',
    groupLabel: 'Discovery (P0)',
    phaseIds: ['P0_DISCOVERY'],
    kind: 'driver',
    description: 'PM driver — problem statement / KPI / scope / FR-NFR / risks',
    agentFile: '.claude/agents/devteam-pm-persona.md',
  },
  {
    id: 'po',
    label: 'PO',
    group: 'discovery',
    groupLabel: 'Discovery (P0)',
    phaseIds: ['P0_DISCOVERY'],
    kind: 'critique',
    description: 'PO critique — backlog priority / ownership',
    agentFile: '.claude/agents/devteam-po-persona.md',
  },
  {
    id: 'ba',
    label: 'BA',
    group: 'discovery',
    groupLabel: 'Discovery (P0)',
    phaseIds: ['P0_DISCOVERY', 'P1_ANALYSIS'],
    kind: 'critique',
    description: 'BA critique — stakeholder coverage / business rules / 合規',
    agentFile: '.claude/agents/devteam-ba-persona.md',
  },

  // Analysis — P1
  {
    id: 'sa',
    label: 'SA',
    group: 'analysis',
    groupLabel: 'Analysis (P1)',
    phaseIds: ['P1_ANALYSIS'],
    kind: 'critique',
    description: 'SA critique — use case 完整性 / acceptance / edge cases',
    agentFile: '.claude/agents/devteam-sa-persona.md',
  },
  {
    id: 'ux',
    label: 'UX',
    group: 'analysis',
    groupLabel: 'Analysis (P1)',
    phaseIds: ['P1_ANALYSIS'],
    kind: 'critique',
    description: 'UX critique — task success / state coverage / a11y',
    agentFile: '.claude/agents/devteam-ux-persona.md',
  },
  {
    id: 'ui',
    label: 'UI',
    group: 'analysis',
    groupLabel: 'Analysis (P1)',
    phaseIds: ['P1_ANALYSIS'],
    kind: 'critique',
    description: 'UI critique — state coverage / tokens / responsive / handoff',
    agentFile: '.claude/agents/devteam-ui-persona.md',
  },

  // Architecture — P2
  {
    id: 'arch',
    label: 'Architect',
    group: 'architecture',
    groupLabel: 'Architecture (P2)',
    phaseIds: ['P2_ARCHITECTURE'],
    kind: 'critique',
    description: 'Architect critique — NFR / bounded context / failure modes',
    agentFile: '.claude/agents/devteam-arch-persona.md',
  },
  {
    id: 'sd',
    label: 'SD',
    group: 'architecture',
    groupLabel: 'Architecture (P2)',
    phaseIds: ['P2_ARCHITECTURE', 'P3_DESIGN'],
    kind: 'critique',
    description: 'SD critique — module responsibility / API 平行實作 / error model',
    agentFile: '.claude/agents/devteam-sd-persona.md',
  },

  // Design — P3
  {
    id: 'dba',
    label: 'DBA',
    group: 'design',
    groupLabel: 'Design (P3)',
    phaseIds: ['P3_DESIGN'],
    kind: 'critique',
    description: 'DBA critique — migration / PII / index / 資料一致性',
    agentFile: '.claude/agents/devteam-dba-persona.md',
  },

  // Delivery — P4
  {
    id: 'qa',
    label: 'QA',
    group: 'delivery',
    groupLabel: 'Delivery (P4)',
    phaseIds: ['P4_DELIVERY'],
    kind: 'critique',
    description: 'QA critique — 可測性 / exit criteria / 自動化覆蓋',
    agentFile: '.claude/agents/devteam-qa-persona.md',
  },

  // Release — P5
  {
    id: 'devops',
    label: 'DevOps',
    group: 'release',
    groupLabel: 'Release (P5)',
    phaseIds: ['P5_RELEASE'],
    kind: 'critique',
    description: 'DevOps critique — pipeline gate / rollback / 環境自動化',
    agentFile: '.claude/agents/devteam-devops-persona.md',
  },
  {
    id: 'sre',
    label: 'SRE',
    group: 'release',
    groupLabel: 'Release (P5)',
    phaseIds: ['P5_RELEASE'],
    kind: 'critique',
    description: 'SRE critique — SLO/SLI / error budget / incident path / postmortem',
    agentFile: '.claude/agents/devteam-sre-persona.md',
  },

  // Meta
  {
    id: 'orchestrator',
    label: 'Orchestrator',
    group: 'meta',
    groupLabel: 'Meta',
    phaseIds: [],
    kind: 'meta',
    description: 'Multi-role critique 合併、衝突顯化、失敗降級',
    agentFile: '.claude/agents/devteam-orchestrator.md',
  },
  {
    id: 'facilitator',
    label: 'Facilitator',
    group: 'meta',
    groupLabel: 'Meta',
    phaseIds: [],
    kind: 'meta',
    description: 'Lane B Forum-Lite — 三訊號 AND 收斂判定 + 升級裁決',
    agentFile: '.claude/agents/devteam-facilitator.md',
  },
  {
    id: 'proposer',
    label: 'Proposer',
    group: 'meta',
    groupLabel: 'Meta',
    phaseIds: [],
    kind: 'meta',
    description: 'Lane B Forum-Lite — R1 提案 / R3 回應 critique',
    agentFile: '.claude/agents/devteam-proposer.md',
  },
];

export const PERSONA_GROUPS: { id: PersonaGroup; label: string }[] = [
  { id: 'discovery', label: 'Discovery (P0)' },
  { id: 'analysis', label: 'Analysis (P1)' },
  { id: 'architecture', label: 'Architecture (P2)' },
  { id: 'design', label: 'Design (P3)' },
  { id: 'delivery', label: 'Delivery (P4)' },
  { id: 'release', label: 'Release (P5)' },
  { id: 'meta', label: 'Meta (Cross-phase)' },
];

export function personasByGroup(group: PersonaGroup): PersonaDef[] {
  return PERSONAS.filter((p) => p.group === group);
}

export function activePersonaIds(currentPhaseId: string): string[] {
  return PERSONAS.filter((p) => p.phaseIds.includes(currentPhaseId)).map((p) => p.id);
}
