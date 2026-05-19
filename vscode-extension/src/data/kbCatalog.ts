export interface KbDoc {
  id: string;
  label: string;
  path: string;
  description: string;
}

export const KB_DOCS: KbDoc[] = [
  { id: '01', label: 'KB 01 — Role responsibilities', path: 'devteam_knowledge_base/01_role_responsibilities.md', description: '12 persona cheat sheet + RACI' },
  { id: '02', label: 'KB 02 — Lifecycle phases', path: 'devteam_knowledge_base/02_lifecycle_phases.md', description: 'Phase DAG / re-entry / cascade policy' },
  { id: '03', label: 'KB 03 — Document templates', path: 'devteam_knowledge_base/03_document_templates.md', description: '範本索引與使用規則' },
  { id: '04', label: 'KB 04 — Freeze gates', path: 'devteam_knowledge_base/04_freeze_gates.md', description: '7 gates × owner × evidence × personas' },
  { id: '05', label: 'KB 05 — Meeting protocols', path: 'devteam_knowledge_base/05_meeting_protocols.md', description: 'Multi-role review + Forum-Lite orchestrator 合併' },
  { id: '06', label: 'KB 06 — Quality attributes catalog', path: 'devteam_knowledge_base/06_quality_attributes_catalog.md', description: 'NFR / SLO / DORA / ISO 29148 / NIST SSDF' },
  { id: '07', label: 'KB 07 — Diagram picker', path: 'devteam_knowledge_base/07_diagram_picker.md', description: 'C4 / sequence / flow chart 選擇指南' },
  { id: '08', label: 'KB 08 — API design catalog', path: 'devteam_knowledge_base/08_api_design_catalog.md', description: 'REST / GraphQL / gRPC / 版控' },
  { id: '09', label: 'KB 09 — Observability catalog', path: 'devteam_knowledge_base/09_observability_catalog.md', description: 'Log / metric / trace / alert 策略' },
  { id: '10', label: 'KB 10 — Resilience patterns', path: 'devteam_knowledge_base/10_resilience_patterns.md', description: 'Rollout / rollback / circuit breaker / retry' },
  { id: '11', label: 'KB 11 — Data & stack catalog', path: 'devteam_knowledge_base/11_data_and_stack_catalog.md', description: '資料分級 / PII / stack 選型' },
];

export interface KbTemplate {
  id: string;
  label: string;
  path: string;
}

export const KB_TEMPLATES: KbTemplate[] = [
  { id: 'prd', label: 'PRD', path: 'devteam_knowledge_base/templates/prd.md' },
  { id: 'user-flow', label: 'User Flow', path: 'devteam_knowledge_base/templates/user-flow.md' },
  { id: 'system-spec', label: 'System Spec', path: 'devteam_knowledge_base/templates/system-spec.md' },
  { id: 'c4-l1', label: 'C4 L1 (System Context)', path: 'devteam_knowledge_base/templates/c4-l1.md' },
  { id: 'c4-l2', label: 'C4 L2 (Containers)', path: 'devteam_knowledge_base/templates/c4-l2.md' },
  { id: 'c4-l3', label: 'C4 L3 (Components)', path: 'devteam_knowledge_base/templates/c4-l3.md' },
  { id: 'adr', label: 'ADR', path: 'devteam_knowledge_base/templates/adr.md' },
  { id: 'dr', label: 'Decision Record (DR)', path: 'devteam_knowledge_base/templates/decision-record.md' },
  { id: 'openapi', label: 'OpenAPI', path: 'devteam_knowledge_base/templates/openapi.yaml' },
  { id: 'erd', label: 'ERD', path: 'devteam_knowledge_base/templates/erd.md' },
  { id: 'test-plan', label: 'Test Plan', path: 'devteam_knowledge_base/templates/test-plan.md' },
  { id: 'runbook', label: 'Runbook', path: 'devteam_knowledge_base/templates/runbook.md' },
  { id: 'release-readiness', label: 'Release Readiness', path: 'devteam_knowledge_base/templates/release-readiness.md' },
  { id: 'handoff', label: 'Handoff Package', path: 'devteam_knowledge_base/templates/handoff.md' },
  { id: 'mom', label: 'MoM (Meeting Notes)', path: 'devteam_knowledge_base/templates/mom.md' },
  { id: 'forum-topic', label: 'Forum Topic', path: 'devteam_knowledge_base/templates/forum-topic.md' },
  { id: 'forum-final-report', label: 'Forum Final Report', path: 'devteam_knowledge_base/templates/forum-final-report.md' },
];
