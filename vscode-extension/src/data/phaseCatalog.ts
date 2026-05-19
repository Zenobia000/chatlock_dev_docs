export interface PhaseDef {
  id: string;
  label: string;
  shortLabel: string;
  drivers: string[];
  parallelDrivers?: string[];
  gates: string[];
  expectedDocs: { path: string; description: string }[];
  description: string;
}

export const PHASES: PhaseDef[] = [
  {
    id: 'BOOTSTRAP',
    label: 'Bootstrap',
    shortLabel: 'Boot',
    drivers: ['devteam-bootstrap'],
    gates: [],
    expectedDocs: [
      { path: '.claude/context/devteam/bootstrap-{feature}.yaml', description: 'Architect Bootstrap Questionnaire 答案' },
    ],
    description: '12 題問卷把 senior 隱性思考顯化。產出 bootstrap-intent.yaml + 設 ux_mode + weak_areas',
  },
  {
    id: 'P0_DISCOVERY',
    label: 'P0 Discovery',
    shortLabel: 'P0',
    drivers: ['devteam-pm'],
    gates: ['Gate1_PRD'],
    expectedDocs: [
      { path: 'docs/prd/{feature}.md', description: 'PRD（11 節）' },
      { path: 'docs/governance/stakeholders.md', description: 'Stakeholder map' },
    ],
    description: 'PRD 產出（問題陳述 / KPI / users / scope / NFR / FR / risks）',
  },
  {
    id: 'P1_ANALYSIS',
    label: 'P1 Analysis',
    shortLabel: 'P1',
    drivers: ['devteam-analyst'],
    parallelDrivers: ['devteam-ux'],
    gates: ['Gate2_UXFlow', 'Gate3_SystemSpec'],
    expectedDocs: [
      { path: 'docs/analysis/system-spec-{feature}.md', description: 'System Spec + Business Rules + Use Cases' },
      { path: 'docs/ux/user-flow-{feature}.md', description: 'User flow + state coverage + a11y' },
    ],
    description: 'PRD → System Spec + User Flow。analyst 與 ux 並行',
  },
  {
    id: 'P2_ARCHITECTURE',
    label: 'P2 Architecture',
    shortLabel: 'P2',
    drivers: ['devteam-arch'],
    gates: ['Gate4_NFR_ADR'],
    expectedDocs: [
      { path: 'docs/architecture/c4-{feature}.md', description: 'C4 L1/L2/L3 圖' },
      { path: 'docs/architecture/adr/*.md', description: 'ADR 重要決策' },
      { path: 'docs/architecture/nfr-matrix.md', description: 'NFR matrix + failure modes' },
    ],
    description: 'C4 + ADR + NFR matrix + observability 前置',
  },
  {
    id: 'P3_DESIGN',
    label: 'P3 Design',
    shortLabel: 'P3',
    drivers: ['devteam-design'],
    gates: ['Gate5a_API', 'Gate5b_DBSchema'],
    expectedDocs: [
      { path: 'docs/design/openapi.yaml', description: 'API Contract (OpenAPI)' },
      { path: 'docs/design/erd.md', description: 'ERD / DDL / Migration' },
      { path: 'docs/design/module-design.md', description: 'Module Design + Error Model' },
    ],
    description: 'API Contract + ERD + Module Design',
  },
  {
    id: 'P4_DELIVERY',
    label: 'P4 Delivery',
    shortLabel: 'P4',
    drivers: ['devteam-qa'],
    gates: ['Gate6_TestReady'],
    expectedDocs: [
      { path: 'docs/qa/test-plan-{feature}.md', description: 'Test Plan + Exit Criteria + Defect Triage' },
    ],
    description: 'Test Plan + 測試層級 + 退場條件',
  },
  {
    id: 'P5_RELEASE',
    label: 'P5 Release',
    shortLabel: 'P5',
    drivers: ['devteam-ops'],
    gates: ['Gate7_Release'],
    expectedDocs: [
      { path: 'docs/ops/runbook-{feature}.md', description: 'Runbook + Alerts' },
      { path: 'docs/release/release-readiness-{feature}.md', description: 'Release Readiness + Rollback' },
      { path: 'specs/{feature}/handoff.md', description: 'Handoff package 給外部 coding agent' },
    ],
    description: 'Pipeline + Runbook + SLO + Release Readiness + Handoff',
  },
];

export const PHASE_BY_ID: Record<string, PhaseDef> = Object.fromEntries(PHASES.map((p) => [p.id, p]));

export function phaseIndex(id: string): number {
  return PHASES.findIndex((p) => p.id === id);
}
