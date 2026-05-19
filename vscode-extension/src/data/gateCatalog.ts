export interface GateDef {
  id: string;
  label: string;
  phaseId: string;
  ownerRole: string;
  requiredPersonas: string[];
  evidence: string[];
  description: string;
}

export const GATES: GateDef[] = [
  {
    id: 'Gate1_PRD',
    label: 'Gate 1 — PRD Freeze',
    phaseId: 'P0_DISCOVERY',
    ownerRole: 'pm',
    requiredPersonas: ['ba', 'sa', 'ux', 'po'],
    evidence: [
      'Problem Statement 三項（現況 / 為什麼值得解 / 不解的成本）皆不為空',
      '至少 1 個可量化 KPI（含目標數值與觀測週期）',
      'In Scope 與 Out of Scope 都列出（Out 不可空）',
      'Risks 區段非空',
      'Open Questions 已標記（含 decider / by-when）',
      'Stakeholder map 存在',
    ],
    description: 'PRD draft 滿足 freeze 條件，由 PM 角色擔保',
  },
  {
    id: 'Gate2_UXFlow',
    label: 'Gate 2 — UX Flow Freeze',
    phaseId: 'P1_ANALYSIS',
    ownerRole: 'ux',
    requiredPersonas: ['ux', 'ui', 'sa'],
    evidence: [
      'User flow 主任務 + 至少 1 條 alternate 流',
      'State coverage：loading / empty / error / success 全列',
      'Wireframe 或 description 對應',
      'a11y 等級宣告（WCAG）',
      'Handoff 到 design phase 的 token 與 component 列表',
    ],
    description: 'User flow 與 state coverage 完整',
  },
  {
    id: 'Gate3_SystemSpec',
    label: 'Gate 3 — System Spec Freeze',
    phaseId: 'P1_ANALYSIS',
    ownerRole: 'analyst',
    requiredPersonas: ['ba', 'sa', 'arch'],
    evidence: [
      'Use case 列表完整（含 actor / pre / post / main / alt / exception）',
      'Business rules 與 PRD §6 FR 對應',
      'Event / State model 確定',
      'Integration inventory（上下游系統 + API + data）',
      '驗收條件可機讀',
    ],
    description: 'System Spec 與 Business Rules 可驗收',
  },
  {
    id: 'Gate4_NFR_ADR',
    label: 'Gate 4 — NFR + ADR Baseline',
    phaseId: 'P2_ARCHITECTURE',
    ownerRole: 'arch',
    requiredPersonas: ['arch', 'sd', 'sre'],
    evidence: [
      'C4 L1 至少存在；L2/L3 按需',
      '重要架構決策都有 ADR（含 alternatives + consequences）',
      'NFR matrix 9 維度有數值或 N/A',
      'Failure modes 盤點完成',
      'Observability 前置需求列表（metric / log / trace）',
    ],
    description: '架構決策與 NFR 已 baseline',
  },
  {
    id: 'Gate5a_API',
    label: 'Gate 5a — API Contract Freeze',
    phaseId: 'P3_DESIGN',
    ownerRole: 'sd',
    requiredPersonas: ['sd', 'sa', 'qa'],
    evidence: [
      'OpenAPI / GraphQL schema / gRPC proto 完整',
      '所有 endpoint 有 request/response/error schema',
      '版控策略宣告',
      '後向相容性條款',
      'Auth / authz 模型對應 NFR Security',
    ],
    description: 'API contract 可平行實作',
  },
  {
    id: 'Gate5b_DBSchema',
    label: 'Gate 5b — DB Schema Freeze',
    phaseId: 'P3_DESIGN',
    ownerRole: 'dba',
    requiredPersonas: ['dba', 'sd', 'sa'],
    evidence: [
      'ERD 完整（含 cardinality + constraints）',
      'DDL / migration script 可演練',
      'Rollback 步驟可執行',
      'PII / sensitive 欄位標記',
      'Index 策略宣告',
      'Retention policy',
    ],
    description: 'DB schema 與 migration 可演練可回滾',
  },
  {
    id: 'Gate6_TestReady',
    label: 'Gate 6 — Test Ready',
    phaseId: 'P4_DELIVERY',
    ownerRole: 'qa',
    requiredPersonas: ['qa', 'sa', 'sre'],
    evidence: [
      'Test plan 涵蓋 unit / integration / e2e 比例',
      'Test data strategy（含 PII 處理）',
      'Exit criteria 量化',
      'Defect triage rules',
      'Completion report 範本',
    ],
    description: '測試計畫與退場條件 ready',
  },
  {
    id: 'Gate7_Release',
    label: 'Gate 7 — Release Ready',
    phaseId: 'P5_RELEASE',
    ownerRole: 'ops',
    requiredPersonas: ['devops', 'sre', 'qa'],
    evidence: [
      'Pipeline 規格定義',
      'Runbook 含 incident response',
      'SLO / SLI / alert 配置',
      'Rollout strategy 確定',
      'Rollback plan 可執行',
      'Release readiness checklist 全綠',
    ],
    description: 'Release 條件齊全，可 handoff',
  },
];

export const GATE_BY_ID: Record<string, GateDef> = Object.fromEntries(GATES.map((g) => [g.id, g]));

export function gatesByPhase(phaseId: string): GateDef[] {
  return GATES.filter((g) => g.phaseId === phaseId);
}
