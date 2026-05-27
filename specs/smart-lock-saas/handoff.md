# Handoff Specs — 智慧鎖 SaaS 平台 V1.1

> **狀態**：✅ ready for coding agent
> **發佈**：2026-05-28（V1.1 final spec migration cascade）
> **版本**：v1.1（接續 v1.0 2026-05-22）
> **來源**：devteam DAG 7 個 freeze gate 全過（含 final spec 2026-05-20 完整 cascade）
> **對象**：External coding agent / 內部開發團隊
> **核心視角**：台灣 0-1 SaaS 落地、容忍例外、接地氣 — 業主明文授權主 Claude 代裁決所有 value decisions

---

## §0 V1.1 vs V1.0 變化摘要（必讀）

如果你之前讀過 V1.0 handoff，以下是 2026-05-22 → 2026-05-28 期間的 cascade：

| 維度 | V1.0 (2026-05-22) | V1.1 (2026-05-28) | 變動原因 |
|:-----|:------------------|:------------------|:---------|
| PRD | v2.1 | **v2.3** | A4 Chatbot Phase scope + 5 KPI with counter-metric |
| FR | 25 條 | **53 條** (51 active + 2 superseded) | 26 既有 → 殼 + A01-A12 / S-M01-M06 / M14 / M18 + cancellation/DPO 新增 |
| BR | 64 條 | **122 條** | A3.7 BR backfill (80+ placeholder) + value-decision cascade (CANCEL/REFUND/WARRANTY) |
| ADR | 66 → 73 | **75 條** + ADR-100 supersede index | ADR-0067 (M18 config) + 0068 (ACL) + 0101 (KB) + 0102 (cancellation v2) + 4 PARTIAL_UPDATE |
| User Flow | v1 (4 flow) | **v3** (5 flow + 20 by-module) | Final spec migration 套 P0 規則 + Chatbot/Sync 對話流 + M18 admin Flow S5 |
| OpenAPI | v1.0 (quote/pricing core) | **+ companion** `openapi-smart-lock-saas.yaml` (57 paths) | 補 M01-M07/M11/M13-M18 + A01-A12 + S-M01-S-M06 endpoint |
| ERD | v1 | **+ companion** `erd-smart-lock-saas.md` (33 entities) + DDL init 53 tables | Chatbot / Config / KB / Evidence 新表 |
| Test plan | v1 | **v2.3** (114 cases) + test-data-strategy + automation-coverage-map | 55 條 P0 critical test 新增 |
| Ops | runbook 10 IR | **runbook 19 IR** + SLO 7 條 + 三層 rollback + release readiness 30-item | M18/PII/chatbot/RBAC sync incident playbook |

---

## §1 Executive Brief

> [pm 視角] V1.0 上線（W1-W17）+ V1.1 final spec migration cascade 全套規範。所有上游文件 frozen，業主明文授權 + 主 Claude 代裁決全部 value decisions（台灣 0-1 SaaS 落地視角）。**合約紅線 + 業主 value decisions 一條都不能破**。

**最高優先 constraint（合約紅線 = 絕對）**：

1. **合約 4.4(a)** 負面情緒識別 ≥ 90%（UAT + 持續監控）
2. **合約 4.4(d)** 家族覆核員 100% 覆核率 + append-only ledger 不可篡改
3. **合約 9.3** PC 完整率 ≥ 85%（彙總率）
4. **合約 SOW 2.1(4)** AI 影像辨識**禁用** violation count = 0
5. **AI Forbidden Eval ≥ 95%** 每次 deploy（block-deploy gate）
6. **Cross-tenant isolation** ZERO leak（ADR-0030 + RLS policy）
7. **GDPR forget ≤ 7d** OR customer notice within 7d（BR-PII-001b）

**V1.1 新增最高優先 constraint（業主 value decisions 2026-05-28）**：

8. **Cancellation 6-stage** (ADR-0102) — S1=0 / S1.5=0 / S2=300 / S3=500 / S4=800 / S5=full + 師傅 initiated 首次免責 + 同月 ≥2 扣款 + 不可抗力憑證 escape
9. **Refund SoD 三維** (BR-REFUND-006) — initiator/approver/executor 不可同人；L5 Sponsor (`ops_director`) RBAC
10. **Warranty mode enum** (ADR-0044 v2) — `safety_install_date` / `first_use_date` / `ship_date` / `negotiated_date` 對齊 spec G002/Q107；RMA 延長 + 換新零件 90 天獨立重算；B2B 覆寫上限 5 年
11. **Chatbot reply token cap** = 1500 (BR-A01-02) — LINE 200 字掃讀邊界，避免切尾
12. **報價有效期** = 14d 一般 / 3d 急件 (BR-M04-05) — 對齊台灣居家修繕業 default
13. **M18 staged rollout** = 5→50→100% × 30min observation + fast-track 15min (BR-M18) — 萬級 SaaS ops alarm + 客服回饋 cycle
14. **三層 rollback** (rollback-plan) — config ≤ 1min / app ≤ 30min / DB schema ≤ 4h，三層獨立 SLA 不可相依

任一違反 = block release / 合約 §9 終止風險 / 業主裁決破口。

---

## §2 文件索引（frozen，禁止修改）

| Phase | 文件 | 路徑 | 主要內容 |
|:---|:---|:---|:---|
| P0 | PRD v2.3 | `docs/prd/smart-lock-saas.md` | KPI / Scope / FR / 商業價值 + Chatbot Phase scope + 5 KPI counter-metric |
| P0 | Stakeholder map | `docs/governance/stakeholders.md` | 18 角色 + 4 層 RBAC + DPO + 法務 + ops_director (L5) |
| P0 | Final spec source | `docs/_source/01-workorder-erp.md` + `02-ai-chatbot-sync.md` | 1387 + 855 LoC（read-only mirror，SoT = repo root xlsx） |
| P1 | User flow v3 | `docs/ux/user-flow-smart-lock-saas.md` + `docs/ux/by-module/*` + `docs/ux/wireframes/` | 5 flows (S1-S5) + 20 by-module + a11y WCAG 2.2 AA + state coverage UI-only |
| P1 | System spec | `docs/analysis/system-spec-smart-lock-saas.md` + `docs/analysis/fr/` + `docs/analysis/br/` | 53 FR + 122 BR + use case skeleton + G/W/T |
| P1 | Traceability matrix | `docs/_index/traceability-matrix.md` | FRs 53 / BRs 122 / ADRs 75 / orphan 0 |
| P2 | NFR matrix | `docs/architecture/nfr-matrix-smart-lock-saas.md` | NFR 維度 + Failure modes + SLI + M18 4 條補強 |
| P2 | C4 L3 | `docs/architecture/c4-l3-smart-lock-saas.md` | Bounded context + Component + module boundary |
| P2 | 75 ADRs | `docs/architecture/adr/` | 含 baseline + ADR-0067 (M18 config) + 0068 (ACL) + 0101 (KB) + 0102 (cancellation v2) + ADR-100 supersede index |
| P2 | OPA Rego artifact | `docs/policy/br-pii-001.rego` | Versioned policy；@legal @dpo CODEOWNERS |
| P3 | OpenAPI V1 + V1.1 | `docs/architecture/api/openapi.yaml` + `openapi-smart-lock-saas.yaml` | V1 (quote/pricing) + companion (57 paths M01-M18/A01-A12/S-M01-M06) |
| P3 | ERD V1 + V1.1 | `docs/architecture/data/erd.md` + `erd-smart-lock-saas.md` + `ddl-migration-001-init.sql` | 33 new entities + 53 table init + partition + hash chain trigger |
| P3 | Module boundary | `docs/architecture/module-boundary/module-boundary-smart-lock-saas.md` | 20 ERP + 12 chatbot + 6 sync module 上下游 |
| P4 | Test plan v2.3 | `docs/qa/test-plan-smart-lock-saas.md` + `test-data-strategy-*.md` + `automation-coverage-map.md` | 114 cases (55 P0 new) + fixture + 57 endpoint × test layer matrix |
| P5 | Pipeline | `docs/ops/pipeline-spec-smart-lock-saas.md` | CI 10 stages + 10 block-deploy gates + canary 10%→50%→100% |
| P5 | Runbook | `docs/ops/runbook-smart-lock-saas.md` | IR-001..019 + comms 三層 LINE/SMS/Email |
| P5 | SLO spec | `docs/ops/slo-spec-smart-lock-saas.md` | 7 SLO + burn rate 1h/6h/24h + error budget |
| P5 | Rollback plan | `docs/ops/rollback-plan-smart-lock-saas.md` | 三層獨立 SLA (config 1min / app 30min / DB 4h) |
| P5 | Release readiness | `docs/ops/release-readiness-smart-lock-saas.md` | 30-item checklist + 台灣 release window blacklist |
| Gov | Final freeze sign-off | `docs/governance/freeze-sign-off-2026-05-28.md` + `freeze-sign-off-2026-05-28-final.md` | Gate 1-7 全 frozen evidence + 7 value decisions |
| Gov | Lane A critique | `docs/governance/reviews/` | 6 ADR + user-flow v2 critique (2026-05-28) |
| Baseline | PRD-0001 v1.1 | `archive/prd-baseline/PRD-0001-2026-q1-v1-launch.md` | 40 user stories baseline |

---

## §3 Acceptance Criteria — 開工前必看

通過 AC 後才能 PR。每條都對應 PRD FR / NFR / ADR / BR。

### §3.1 P0 合約紅線 AC

| ID | Criterion | Source | Verification |
|:---|:----------|:-------|:-------------|
| AC-CONTRACT-01 | 負面情緒識別 ≥ 90% | 合約 4.4(a) / PRD KPI | UAT + monitor |
| AC-CONTRACT-02 | 家族覆核員 100% 覆核率 + append-only ledger | 合約 4.4(d) / ADR-VCH-001/002 | E2E test + hash chain verify |
| AC-CONTRACT-03 | PC 完整率 ≥ 85% | 合約 9.3 | metric + alert |
| AC-CONTRACT-04 | AI 影像辨識 violation = 0 | 合約 SOW 2.1(4) / ADR-0047 | Forbidden Eval gate |
| AC-CONTRACT-05 | AI Forbidden Eval ≥ 95% | block-deploy gate | CI gate |
| AC-CONTRACT-06 | Cross-tenant isolation ZERO leak | ADR-0030 + RLS | integration test |
| AC-CONTRACT-07 | GDPR forget ≤ 7d OR customer notice | BR-PII-001b + FR-0053 | E2E |

### §3.2 V1.1 業主 value decisions AC

| ID | Criterion | Source | Verification |
|:---|:----------|:-------|:-------------|
| AC-V11-08 | Cancellation 6-stage fee 計算正確 | ADR-0102 / BR-CANCEL-001..008 / FR-0010 / FR-0052 | E2E 15 cases (CNL-S1..S5) |
| AC-V11-09 | Refund SoD initiator≠approver≠executor | BR-REFUND-006 / FR-0014 | DB CHECK + 409 attack test |
| AC-V11-10 | Warranty 5-mode 判定 + RMA 90d extension + B2B override audit | ADR-0044 v2 / BR-WARRANTY-005..007 / FR-0015 | E2E 12 cases |
| AC-V11-11 | Chatbot reply token ≤ 1500 + truncate fallback | BR-A01-02 | unit + integration |
| AC-V11-12 | 報價有效期 = 14d 一般 / 3d 急件 | BR-M04-05 | unit + state machine |
| AC-V11-13 | M18 staged rollout 5/50/100 + 30min obs + fast-track 15min + rollback ≤ 1min | BR-M18-01..05 / ADR-0067 | E2E + load test |
| AC-V11-14 | 三層 rollback 各層獨立 SLA達成 | rollback-plan | DR drill (annual) |

### §3.3 P0 SLO / NFR AC

| ID | Criterion | Source | Verification |
|:---|:----------|:-------|:-------------|
| AC-SLO-01 | API availability ≥ 99.9% | slo-spec §SLO-1 | burn rate alert |
| AC-SLO-02 | Config read P99 ≤ 50ms (cache hit) | NFR-Perf-008 / slo-spec §SLO-3 | perf test |
| AC-SLO-03 | Chatbot reply P95 ≤ 5s | slo-spec §SLO-4 | E2E perf |
| AC-SLO-04 | Audit log delivery 100% (zero loss) | ADR-0050 / slo-spec §SLO-6 | chaos test |
| AC-SLO-05 | Hash chain integrity (quote_version / journal_entry) | ADR-0064 / slo-spec §SLO-5 | tamper test |

---

## §4 API Contract

| 項目 | 內容 |
|:-----|:-----|
| OpenAPI V1 spec | `docs/architecture/api/openapi.yaml`（quote/pricing/contract/SOP/voucher core） |
| OpenAPI V1.1 companion | `docs/architecture/api/openapi-smart-lock-saas.yaml`（M01-M18 + A01-A12 + S-M01-M06，57 paths） |
| Auth | OAuth2 client_credentials + JWT bearer |
| Tenant 路由 | `X-Tenant-Id` header + `/tenants/{tenantId}/...` path scope |
| SoD enforcement | `X-Initiator` / `X-Approver` / `X-Executor` header (refund/cancellation/config/audit) |
| Error model | RFC 7807 problem+json + 自訂 `trace_id` |
| Pagination | cursor-based `?cursor=&limit=` |
| Idempotency | POST/PUT/DELETE 強制 `Idempotency-Key`（ADR-0066 / ADR-0064 對齊） |
| Versioning | URL versioning + header version + Phase II 用 `x-phase: II` 標 + 501 NOT_IMPLEMENTED_V1 |
| Config Read API | `/m18/config-read/*` 走 ACL（ADR-0068），cache hit P99 ≤ 50ms |

> ⚠ **API 變更必須維持 backward compat**。Breaking change → DR back to harness，不在 coder 工作分支動。

---

## §5 DB Migration

| 項目 | 內容 |
|:-----|:-----|
| Schema | `saas`（避免 public） |
| Init migration | `docs/architecture/data/ddl-migration-001-init.sql`（53 tables / 41 indexes / 14 triggers） |
| Strategy | **forward-only**（hash chain integrity）+ compensating migration for repair |
| Partition | work_order/journal_entry/audit_event monthly RANGE；message weekly RANGE；evidence_attachment LIST by retention_class |
| PII | 全走 `*_enc bytea`；不出現於 API schema |
| Audit trigger | updated_at / updated_by 全表強制 |
| Append-only trigger | `tg_block_mutation()` 攔 BEFORE UPDATE/DELETE on quote_version + journal_entry |
| Retention | ADR-0051 → 4 LIST partition (`retention_class`)；evidence legal-hold 走 column flag |
| Rollback policy | DB layer ≤ 4h（compensating migration only，**禁用 backward migration**） |

---

## §6 Out of Scope（V1.1）

> ⚠ 以下範圍**不在本 handoff 內**，coding agent 不應動。若實作需要，**回呼 DevTeam 開新 session**。

- **Phase II** 全部 module（M11/M12 結算 enrich / A12 PRD governance / M14 Partner Portal 完整 FR / FR-TBD-DPO / FR-TBD-M14-001..005）
- **Phase II part-level warranty 升維**（ADR-0044 v2 Q7 placeholder）
- **K-AI-11 long-tail KB ≥ 60%** — 需 Knowledge owner 半人月 budget
- **Multi-region disaster recovery** — Phase III
- **Auto-gen test stub** — Post-launch
- **歷史 200 筆 case anonymize 後 commit public git** — 走 private LFS（OQ-TDS-01 業主裁決）
- **Shadow run W4-W8 real LINE traffic 不 opt-in** — 強制 opt-in + 個資告知（OQ-TDS-03 業主裁決）

---

## §7 Test Plan

| 項目 | 內容 |
|:-----|:-----|
| Test plan ref | `docs/qa/test-plan-smart-lock-saas.md` v2.3（813 LoC / 114 cases） |
| Test data strategy | `docs/qa/test-data-strategy-smart-lock-saas.md`（291 LoC / fixture + PII anon） |
| Automation coverage | `docs/qa/automation-coverage-map.md`（57 endpoint × layer matrix） |
| Cascade strategy | `docs/qa/test-plan-cascade-strategy-2026-05-28.md`（auto-gen + OQ + 9 action item） |
| 目標 | P0 BR=100% / P1 BR ≥ 90% / 自動化 ≥ 70% (weighted) |
| 規模 | 55 P0 critical test new + 59 preserved = 114 total |
| Defect SLA | S0 ack ≤ 15min / fix ≤ 4hr ; S1 ack ≤ 1h / fix ≤ 24hr ; S2/S3 next sprint |
| Exit criteria | 0 S0/S1 outstanding + NFR baseline pass + Forbidden Eval ≥ 95% |

---

## §8 Ops & Release

| 項目 | 內容 |
|:-----|:-----|
| Pipeline | `docs/ops/pipeline-spec-smart-lock-saas.md` (CI 10 stages + 10 block-deploy gates) |
| Canary | 10% → 50% → 100%（業主 DEC-1 統一 ADR-0067 value）+ fast-track 15min (schema pass + 5% no-error) |
| Runbook | `docs/ops/runbook-smart-lock-saas.md` (IR-001..019) |
| SLO | `docs/ops/slo-spec-smart-lock-saas.md` (7 SLO + burn rate 1h/6h/24h) |
| Rollback | `docs/ops/rollback-plan-smart-lock-saas.md`（三層獨立 SLA） |
| Release readiness | `docs/ops/release-readiness-smart-lock-saas.md`（30-item checklist） |
| Release window | 禁週五下午 / 連假前 24h / 月底結帳 25-31 / 發薪日 5/10/25（自動擋 + IT-admin override，業主 DEC-2） |
| SLO 對外承諾 | 合約 95% / 對內 budget 99.5%（業主 DEC-3） |
| DR drill | Annual 必跑（業主 DEC-4） |
| M18 強制全量 escape | 保留 + 雙簽 + audit（業主 DEC-5） |
| Comms | 三層 LINE → SMS → Email（台灣業主習慣） |

---

## §9 Freeze Gate 狀態

| Gate | 狀態 | Evidence |
|:-----|:-----|:---------|
| Gate 1 PRD | 🔒 frozen v2.3 | `docs/prd/smart-lock-saas.md` |
| Gate 2 UX Flow | 🔒 frozen v3 | `docs/ux/user-flow-smart-lock-saas.md` + 20 by-module + wireframes |
| Gate 3 System Spec | 🔒 frozen | `docs/analysis/system-spec-smart-lock-saas.md` + 53 FR + 122 BR |
| Gate 4 NFR + ADR | 🔒 frozen | NFR matrix + 75 ADR (含 ADR-100 supersede index) |
| Gate 5a API | 🔒 frozen | `docs/architecture/api/openapi.yaml` + `openapi-smart-lock-saas.yaml` |
| Gate 5b DB Schema | 🔒 frozen | `docs/architecture/data/erd.md` + `erd-smart-lock-saas.md` + DDL init |
| Gate 6 Test Ready | 🔒 frozen | `docs/qa/test-plan-smart-lock-saas.md` v2.3 |
| Gate 7 Release Ready | 🔒 frozen | Runbook + SLO + Rollback + Release readiness |

---

## §10 Cross References

- DevTeam state: `.claude/context/devteam/state.json`
- Session narratives:
  - `.claude/context/devteam/session-2026-05-22-reset.md` (V1.0)
  - `.claude/context/devteam/session-2026-05-28-1200-user-flow-rewrite.md` (V1.1)
- Cascade context pack: `.claude/context/devteam/cascade-2026-05-28-context-pack.md`
- Value decisions: `.claude/context/devteam/value-decisions-2026-05-28.md`
- Roundtable MoMs:
  - `.claude/context/devteam/meetings/2026-05-27-1130-final-spec-migration-strategy/MoM.md`
  - `.claude/context/devteam/meetings/2026-05-28-1200-user-flow-IA-strategy/MoM.md`
- Strategy context: `archive/strategy/PAIN-POINTS-SUMMARY-2026-05-21.md` + `deep-research-report.md`

---

## §11 Sign-off

- [x] **CEO（autonomous mode）** — 2026-05-22 — V1.0 ready
- [x] **業主明文授權主 Claude 代裁決 V1.1 value decisions（台灣 0-1 SaaS 視角）** — 2026-05-28
- [x] **主 Claude V1.1 cascade sign-off** — 2026-05-28（7 freeze gate + 7 value decisions + 10 backlog defer）
- [ ] External coding agent / dev team acknowledge — ___________
- [ ] PM sign once internal team picks up — ___________

---

## §12 Coding Agent 開工順序建議

1. **先讀**（30 min）：本 handoff §1-§3 + PRD v2.3 §A 摘要 + freeze sign-off final §3-§4
2. **API 對照**（1 hr）：OpenAPI companion `openapi-smart-lock-saas.yaml` + module boundary
3. **DB 對照**（1 hr）：ERD companion + DDL init.sql
4. **挑 P0 vertical slice**（Day 1）：建議從 cancellation 6-stage（ADR-0102 + BR-CANCEL-001..008 + FR-0010 + FR-0052）切入，因為它跨 API/DB/audit/SoD/test 五個維度都有 P0
5. **驗收**：跑 §3 AC 全部通過 + Forbidden Eval ≥ 95% + test plan §4.6 P0 critical 55 cases

> **Ready to build.** 上線祝順利。
