# Handoff Specs — 智慧鎖 SaaS 平台 V1.0

> **狀態**：✅ ready for coding agent
> **發佈**：2026-05-22
> **版本**：v1.0
> **來源**：devteam DAG 7 個 freeze gate 全過
> **對象**：External coding agent / 內部開發團隊

---

## §1 Executive Brief

> [pm 視角] 你接的是 V1.0 上線（W1-W17）的全套規範。所有上游文件 frozen，CEO autonomous mode 簽核。**合約紅線一條都不能破**。

**最高優先 constraint（合約紅線 = 絕對）**：

1. **合約 4.4(a)** 負面情緒識別 ≥ 90%（UAT + 持續監控）
2. **合約 4.4(d)** 家族覆核員 100% 覆核率 + append-only ledger 不可篡改
3. **合約 9.3** PC 完整率 ≥ 85%（彙總率）
4. **合約 SOW 2.1(4)** AI 影像辨識**禁用** violation count = 0
5. **AI Forbidden Eval ≥ 95%** 每次 deploy（block-deploy gate）
6. **Cross-tenant isolation** ZERO leak（ADR-0030 + RLS policy）
7. **GDPR forget ≤ 7d** OR customer notice within 7d（BR-PII-001b）

任一違反 = block release / 合約 §9 終止風險。

---

## §2 文件索引（frozen，禁止修改）

| Phase | 文件 | 路徑 | 主要內容 |
|:---|:---|:---|:---|
| P0 | PRD v2.1 | `docs/prd/smart-lock-saas.md` | KPI / Scope / FR / 商業價值 |
| P0 | Stakeholder map | `docs/governance/stakeholders.md` | 18 角色 + 4 層 RBAC + DPO + 法務 |
| P0 | Lane A review | `.claude/context/devteam/reviews/Gate1_PRD-smart-lock-saas-2026-05-22.md` | 4 CB + 5 conflicts |
| P0 | Forum F-01 | `.claude/context/devteam/forum/2026-05-22-1800-C01-contract-template-v0/final-report.md` | Option C++ |
| P0 | Forum F-02 | `.claude/context/devteam/forum/2026-05-22-1800-C02-k2-self-service-rate/final-report.md` | Option A++ |
| P0 | Forum F-04 | `.claude/context/devteam/forum/2026-05-22-1800-C04-pii-evidence-enforcement/final-report.md` | Option C++ + DGS service |
| P1 | User flow | `docs/ux/user-flow-smart-lock-saas.md` | 4 main flows + 12 edge cases + state coverage |
| P1 | System spec | `docs/analysis/system-spec-smart-lock-saas.md` | 14 物件 + 7 狀態機 + 64 BR + 18 UC + 21 events + 14 integrations |
| P2 | NFR matrix | `docs/architecture/nfr-matrix-smart-lock-saas.md` | 9 NFR 維度 + Failure modes + 4 SLI |
| P2 | C4 L3 | `docs/architecture/c4-l3-smart-lock-saas.md` | Bounded context + Component + module boundary |
| P2 | 62 ADRs | `docs/architecture/adr/` + `3-adr/` + `4-prd-fr-arch/04-architecture/adr/` | 含 new ADR-0060, ADR-0061 |
| P2 | OPA Rego artifact | `docs/policy/br-pii-001.rego` | Versioned policy；@legal @dpo CODEOWNERS |
| P3 | OpenAPI v1.0 | `docs/architecture/api/openapi.yaml` | V1 endpoints + V2 :action 命名 convention 預留 |
| P3 | ERD | `docs/architecture/data/erd.md` | Schema + partition + RLS + outbox + migration |
| P4 | Test plan | `docs/qa/test-plan-smart-lock-saas.md` | 9 test levels + KPI scenarios + 8 BDD + 200 Forbidden Eval |
| P5 | Runbook | `docs/ops/runbook-smart-lock-saas.md` | 10 incident playbooks + Kill switch + Pipeline |
| P5 | Release readiness | `docs/ops/release-readiness.md` | V1 launch checklist + rollback triggers |
| Baseline | PRD-0001 v1.1 | `4-prd-fr-arch/01-prd/PRD-0001-2026-q1-v1-launch.md` | 40 user stories baseline |
| Baseline | 25 FR-XXXX | `4-prd-fr-arch/02-fr/` | Existing functional specs |
| Baseline | ARCH-0001 C4 L1/L2 | `4-prd-fr-arch/04-architecture/ARCH-0001-architecture-overview.md` | Container view |

---

## §3 建議建構順序（W1-W17）

> [po 視角] backlog priority 由「合約紅線 > 上線必備 > 學習迴路」排序。每個 sprint 都要量化 capacity / DoD。

### W1-W2：Foundation
- Setup GCP project + Cloud Run + KMS per-tenant DEK
- Postgres + pgvector + partitioning skeleton
- LINE Messaging API channel setup
- CI/CD pipeline skeleton（block-deploy gates placeholder）
- Domain Expert + Family Reviewer onboarding kickoff

### W3-W5：Core V1 P0-launch（Epic 1-3）
- LINE webhook + idempotency（FR-0001 / FR-0024）
- AI agent（LangGraph + LiteLLM + Gemini 2.5 Flash）
- ProblemCard pipeline + completeness scorer（FR-0002 / ADR-0033 / ADR-0036）
- Three-layer resolution（FR-0018）
- Memory 7-layer

### W4-W8：Shadow Run + Compliance V1 P0-critical（Epic 6, 12）
- Shadow run for K2 / K3 baseline
- AI Forbidden Eval pipeline（FR-NEW-3）— W4 60 題 baseline / W8 200 題 full
- Image moderation gate（FR-NEW-9）
- Sentiment detector（FR-NEW-8 → 4.4(a) 90%）
- Photo guide（US-039）
- Deterministic Rule Engine for transfer_event.rule_triggered_by（FR-NEW-7）

### W6-W10：Data Governance Service V1 P0-critical（ADR-0061）
- DGS independent service（Cloud Run）
- OPA Engine + br-pii-001.rego loading
- Two-phase purge + crypto-shred DEK
- Cron scanner + DGS executor pattern
- Transactional outbox + invalidation bus
- Snapshot cache dual-track（60s vs ≤5s push）
- Audit ledger append-only + hash chain
- Customer notice pipeline for GDPR forget × legal_hold

### W8-W12：Admin Panel + Contract Template（Epic 5, FR-NEW-2, ADR-0060）
- RBAC 4-tier configurable（FR-0019 / ADR-0042）
- Contract Template Schema + CRUD draft-state V1（ADR-0060）
- Contract Template Admin Form（non-engineer UI）
- ChangeRequest workflow（FR-NEW-4 / ADR-0046）
- Knowledge Base manager（FR-0017 V1 manual entry；auto-gen V1.5）
- Conversation monitor + dashboards（FR-0021）

### W10-W14：Family Reviewer（FR-NEW-5）
- SOP dual review UI（CS Supervisor + Domain Expert）
- Family Reviewer UI + 24h SLA
- Fallback escalation（3-pending → ChangeRequest replacement）
- 不可篡改 ledger + hash chain verification

### W13-W15：UAT（合約紅線驗收）
- 50 題 K1 standard set
- 100 題 K3 sentiment UAT
- 200 題 K8 Forbidden Eval full
- Edge case BDD scenarios all pass
- 50 concurrent load test
- Compliance verifications（4.4(a)(d) / 9.3 / SOW 2.1(4) / GDPR / cross-tenant）
- 業主 + 法務 + DPO sign-off

### W16-W17：Staged Rollout
- Canary 10% → 50% → 100%
- Real-time KPI monitoring
- Rollback ready

---

## §4 關鍵 Business Rules（dev 必看）

> [ba 視角] 64 條 BR 詳見 system spec。下列為「違反 = block release」的紅線：

| BR | 規則 | Where to enforce |
|:---|:---|:---|
| BR-WO-001 | AI 不可直接呼叫 `convert_to_work_order`；CS 1-click 確認 | Application layer + API permission |
| BR-WO-002 | 結案 422 hard gate on `address IS NOT NULL` | DB check + API validation |
| BR-PC-001 | 同一 active issue 一張 PC | DB unique constraint |
| BR-PC-002 | PC.completeness ≥ 0.85 才自動派工 | Dispatch service guard |
| BR-Quote-001 | AI 永禁 final quote / 折扣 / 保固免費 | Output Guardrail + Forbidden Eval |
| BR-PII-001a | legal_hold 永久且不可逆 | OPA Rego + DB constraint |
| BR-PII-001b | GDPR forget 7d 或 customer notice | DGS pipeline + 7d job |
| BR-PII-001d | Read visibility filter fail-closed | DGS + snapshot client |
| BR-SOP-002 | Family Reviewer 100% + SLA 24h + fallback | SOP pipeline + scheduled job |
| BR-CT-001 | V1 Contract Template CRUD limited to draft state | API + DB state machine |
| BR-AI-002 | 7 條轉真人硬規則 by deterministic rule engine | Application middleware（**NOT** LLM）|
| BR-CR-001 | 所有 policy/price/rbac/sla/template/contract 變更 via ChangeRequest | API enforcement + RLS for direct DB write |

---

## §5 Definition of Done（每 Sprint）

> [qa 視角] 對抗思維起手 — 每個 sprint 都要證明 negative case 過。

每 sprint：
- ✅ Coverage ≥ 70% backend
- ✅ All P0 acceptance BDD scenarios pass
- ✅ Negative case 覆蓋（acceptance 對應的 negative 都有）
- ✅ OpenAPI compliance via schemathesis
- ✅ No high CVE（SCA scan）
- ✅ Forbidden Eval ≥ 95%（block-deploy）
- ✅ Code review by sd lead
- ✅ Postmortem if production incident in sprint

---

## §6 Boundaries / Don't do

> [arch 視角] Bounded context 不能跨。下面是 hard boundary，違反 = 設計破口。

- ❌ Do NOT bypass DGS for purge / forget / legal_hold flip（cron CANNOT directly DELETE）
- ❌ Do NOT call vision API for image content extraction（SOW 2.1(4)）
- ❌ Do NOT let AI write `transfer_event.rule_triggered_by`（must be deterministic rule engine；FR-NEW-7）
- ❌ Do NOT introduce breaking changes to OpenAPI without a DR（additive-only）
- ❌ Do NOT skip family review for SOP publish
- ❌ Do NOT skip ChangeRequest for any policy/price/RBAC change
- ❌ Do NOT add `contract-governance` module in V1（placed inside admin-panel backend；reversal at 2+ partners per ADR-0060）
- ❌ Do NOT change KPI K3 90% threshold（合約 4.4(a)）
- ❌ Do NOT bypass Forbidden Eval block-deploy gate

---

## §7 Operational Reality（上線後第一週你會用到的）

> [sre 視角] V1 上線後最常 page 的 5 條：

1. **LINE webhook 5xx spike** → IR-001
2. **Gemini quota / latency** → IR-002
3. **DGS down**（mutation 集中是 trade-off cost）→ IR-003
4. **Family Reviewer 缺席** → IR-006
5. **K3 sentiment drift**（合約紅線）→ IR-010

> [devops 視角] Rollback path artifact tag = `<commit SHA>-<build timestamp>`，Cloud Run revision pin 3 步驟內可回。

---

## §8 仍待業主答覆的問題（上線後可處理）

| ID | 問題 | Owner |
|:---|:---|:---|
| OQ-NEW-1 | Family Reviewer 具體人選（3 候選）| BA + PM 共同 |
| OQ-NEW-2 | PII GDPR vs 個資法 scope（已預設兩者同時符合）| 法務 |
| OQ-NEW-3 | Tenant onboarding 流程（Contract Template）| BA |
| OQ-NEW-4 | Forbidden Eval corpus 維護（已 resolved：QA + Domain Expert）| QA + Domain Expert |
| OQ-NEW-5 | IoT 訊號 V3+ 優先（出 V1/V2 scope）| PM |
| OQ-NEW-6 | K2 / abandon_rate W8 recalibration | PM + QA |
| — | DGS reversibility window：~2 sprints if 需從 independent service 退回 | arch |

---

## §9 DevTeam State

所有 freeze gate 於 2026-05-22 過：

| Gate | 狀態 | Evidence |
|:---|:---|:---|
| Gate 1 PRD | 🔒 frozen v2.1 | `docs/prd/smart-lock-saas.md` |
| Gate 2 UX Flow | 🔒 frozen | `docs/ux/user-flow-smart-lock-saas.md` |
| Gate 3 System Spec | 🔒 frozen | `docs/analysis/system-spec-smart-lock-saas.md` |
| Gate 4 NFR + ADR | 🔒 frozen | NFR matrix + C4 L3 + ADR-0060 + ADR-0061 + Rego |
| Gate 5a API | 🔒 frozen | `docs/architecture/api/openapi.yaml` |
| Gate 5b DB Schema | 🔒 frozen | `docs/architecture/data/erd.md` |
| Gate 6 Test Ready | 🔒 frozen | `docs/qa/test-plan-smart-lock-saas.md` |
| Gate 7 Release Ready | 🔒 frozen | Runbook + Release readiness |

---

## §10 Cross References

- DevTeam state：`.claude/context/devteam/state.json`
- Session narrative：`.claude/context/devteam/session-2026-05-22-reset.md`
- Strategy context：`0-strategy/PAIN-POINTS-SUMMARY-2026-05-21.md` + `deep-research-report.md`
- Meeting decisions：`2-meetings/2026-05-22/`
- 60 baseline ADRs：`3-adr/INDEX.md` + `4-prd-fr-arch/04-architecture/adr/`

---

## §11 Sign-off

- [x] **CEO（autonomous mode）** — 2026-05-22 — ready to hand off
- [ ] External coding agent / dev team acknowledge — ___________
- [ ] PM sign once internal team picks up — ___________

---

**Ready to build.** 上線祝順利。
