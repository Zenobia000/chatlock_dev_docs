# Module Boundary Map — Smart Lock SaaS Platform (Phase I MVP)

> **Status**: v1.0 (Gate 5b companion artefact)
> **Date**: 2026-05-28
> **Owner**: devteam-design (sd)
> **Scope**: All Phase I MVP modules — M01-M20 (ERP) + A01-A12 (Chatbot) + S-M01-S-M06 (Sync)
> **Companion**:
> - API: [`openapi-smart-lock-saas.yaml`](../api/openapi-smart-lock-saas.yaml) (tags = module ID)
> - Data: [`erd-smart-lock-saas.md`](../data/erd-smart-lock-saas.md) (table ownership)

> **Cross-ref ADRs**:
> ADR-0062 Pricing Engine bounded context ·
> ADR-0063 AI utterance boundary ·
> ADR-0067 M18 runtime config governance ·
> ADR-0068 M18 ACL (Config Read API) ·
> ADR-0101 KB × final-spec contract

---

## §0 Reading order

Each module entry follows the same template:

| Field | Meaning |
|:------|:--------|
| **Owner persona** | Primary maintainer (per RACI in `01_role_responsibilities.md`) |
| **Phase** | I (MVP) / II (deferred) / III-V (sketch only) |
| **Upstream consumers** | Inbound events / API this module accepts |
| **Downstream producers** | Outbound events / API this module emits |
| **Public API surface** | OpenAPI tag (`docs/architecture/api/openapi-smart-lock-saas.yaml`) |
| **DB ownership** | Tables in `erd-smart-lock-saas.md` this module mutates |
| **Cross-module call boundary** | sync REST / async event / event-driven (outbox) |
| **Config dependency** | M18 namespaces consumed via ADR-0068 ACL |

Boundaries describe **contract level only** (event names, API tags, table ownership) — internal
schema details live in ERD / OpenAPI.

---

## §1 ERP modules (M01-M20)

### M01 Channel Intake (Phase I)

| Field | Value |
|:------|:------|
| Owner persona | sd (chatbot adjacency) |
| Upstream consumers | External: LINE webhook (`INT-001`), web form, hotline transcript |
| Downstream producers | `conversation.message.received` event → A01 Chatbot Intake |
| Public API surface | `M01 Channel Intake` tag (`/webhook/line`, `/channels`, `/channels/{id}/status`) |
| DB ownership | `saas.conversation` (create), `saas.message` (write) |
| Cross-module call boundary | **sync** to A01 debounce (≤ 100ms); **async** Bronze emit |
| Config dependency | `sla_intake`, `channel_ha_thresholds` (via ADR-0068 ACL) |

### M02 Brand & Product Master (Phase I)

| Field | Value |
|:------|:------|
| Owner persona | dba + ba (data steward) |
| Upstream consumers | Admin UI (M17 RBAC L4); KB ingestion pipeline |
| Downstream producers | `brand.created`, `model.created` events → KB sync, M14 partner sync |
| Public API surface | `M02 Brand & Product Master` (`/brands`, `/brands/{id}/models`) |
| DB ownership | `saas.brand`, `saas.model` |
| Cross-module call boundary | **async** event to KB via outbox; **sync** read by M03 / M04 / M10 |
| Config dependency | `model_serial_policy` (ADR-0053 threshold) |

### M03 ProblemCard (Phase I)

| Field | Value |
|:------|:------|
| Owner persona | sa |
| Upstream consumers | A06 ProblemCard Bridge (chatbot draft); CS direct create |
| Downstream producers | `problem_card.created/confirmed/resolved` → M06 Dispatch, M11 (quote trigger) |
| Public API surface | `M03 ProblemCard` (covered by sibling `openapi.yaml` `/problem-cards`) |
| DB ownership | `saas.problem_card`, `saas.work_order_status_history` (PC transitions) |
| Cross-module call boundary | **sync** human-gate confirm via S-M03; **async** event after confirm |
| Config dependency | `pc_completeness_threshold` (ADR-0033 — default 0.85), `urgent_class_4_keywords` |

### M04 Customer-Site-Device (Phase I)

| Field | Value |
|:------|:------|
| Owner persona | dba + ba (PII steward, DPO-aligned) |
| Upstream consumers | CS via Admin Panel; M01 chat-derived facts via S-M02 |
| Downstream producers | `customer.created/updated`, `device.registered`, `gdpr_forget.requested` |
| Public API surface | `M04 Customer-Site-Device` (`/customers`, `/sites`, `/devices`) |
| DB ownership | `saas.customer`, `saas.site`, `saas.device`, `saas.tenant_dek` |
| Cross-module call boundary | **sync** KMS for envelope encryption; **sync** to M13 Warranty for derived expiry; **async** DGS forget |
| Config dependency | `pii_retention_default`, `pii_retention_custom_brands` |

### M05 Technician (Phase I)

| Field | Value |
|:------|:------|
| Owner persona | ba + ops |
| Upstream consumers | Onboarding workflow (CR); suspension request from M07 / M15 |
| Downstream producers | `technician.activated/suspended/terminated`, `technician.penalty.applied` |
| Public API surface | `M05 Technician` (`/technicians`, `/technicians/{id}:suspend`) |
| DB ownership | `saas.user_account` (tech subset), `saas.rbac_role`, technician extension table (TBD §3 Phase II) |
| Cross-module call boundary | **sync** to M11 (penalty ledger); **async** to A01 (channel push notification) |
| Config dependency | `technician_suspension_reasons`, `technician_cumulative_penalty_threshold` (ADR-0102 §C tech-initiated) |

### M06 Dispatch (Phase I)

| Field | Value |
|:------|:------|
| Owner persona | sa + sd |
| Upstream consumers | `work_order.created` → plan; manual assign UI |
| Downstream producers | `work_order.assigned/accepted/sla_expired`, `dispatcher.commission.accrued` |
| Public API surface | `M06 Dispatch` (`/dispatch:plan`, `/work-orders/{id}:assign`, `:accept`) |
| DB ownership | reads `saas.work_order`; writes `saas.work_order_status_history` |
| Cross-module call boundary | **sync** to M05 tech availability; **async** push notification via A01 |
| Config dependency | `sla_dispatch` (10/5 min per ADR-0045), `dispatch_weight_scheme` (distance / load / brand familiarity) |

### M07 Onsite (Phase I)

| Field | Value |
|:------|:------|
| Owner persona | sa + qa |
| Upstream consumers | Tech mobile app; M06 hand-off after accept |
| Downstream producers | `onsite.arrived`, `scope_change`, `completion.submitted`, `evidence.uploaded` |
| Public API surface | `M07 Onsite` (`/work-orders/{id}/onsite/arrival`, `/scope-change`, `/completion`) |
| DB ownership | `saas.onsite_event`, writes to `saas.evidence_attachment` |
| Cross-module call boundary | **sync** to M11 (re-quote ≥ 501 NTD trigger); **async** evidence outbox → DGS |
| Config dependency | `onsite_scope_change_tiers` (≤500 / 501-2000 / >2000 per ADR-0049), `evidence_visibility_matrix` (ADR-0050 v2) |

### M08-M10 (Phase I light — full Phase II)

> M08 Completion sign, M09 Customer feedback, M10 BOM/Inventory are Phase I light;
> M10 boundary is sketched here because ADR-0101 §2 ties KB lineage to M10 master.

| Module | Phase I scope | Boundary note |
|:-------|:--------------|:--------------|
| M08 Completion sign | Read-by-M11 for payment trigger | Implemented as `onsite_event(event_type=completed)` |
| M09 Customer feedback | LINE Quick-Reply feedback only | Writes to `audit_event` with `event_type='customer_feedback'` |
| M10 BOM / Inventory | Master read-only V1 (KB lineage) | `model.list_price` is the V1 anchor; full BOM tree → Phase II |

### M11 AR / Payment (Phase I — cancellation + refund + payment record)

| Field | Value |
|:------|:------|
| Owner persona | ba + dba (ledger SoD) |
| Upstream consumers | M07 (completion → AR), M03 (quote → AR placeholder), M15 (cancel/refund inbox) |
| Downstream producers | `cancellation.posted`, `refund.executed`, `journal.entry.appended` |
| Public API surface | `M11 AR / Payment` (`/work-orders/{id}/cancel`, `/refunds`, `/payments`) |
| DB ownership | `saas.cancellation`, `saas.refund`, `saas.payment`, `saas.journal_entry` |
| Cross-module call boundary | **sync** ACL to M18 (resolve fee tier per current config version); **async** journal outbox |
| Config dependency | `cancellation_reason_codes`, `cancellation_fee_tiers`, `refund_tier_thresholds`, `travel_fee_distance_tiers` — **all** via ADR-0068 ACL with `X-Config-Version` snapshot |

### M12 Settlement (Phase II)

| Field | Value |
|:------|:------|
| Owner persona | ba + dba |
| Phase | **II** — `x-phase: II` in OpenAPI (`/settlements/monthly` returns 501) |
| Boundary stub | Reads `saas.journal_entry` aggregations; produces `settlement.monthly.posted` |

### M13 Warranty (Phase I)

| Field | Value |
|:------|:------|
| Owner persona | ba |
| Upstream consumers | M04 device registration; ACL inquiry to brand partner |
| Downstream producers | `warranty_claim.filed/approved`, evidence → M07 RMA path |
| Public API surface | `M13 Warranty` (`/devices/{id}/warranty`, `/warranty-claims`) |
| DB ownership | `saas.device_warranty`, `saas.warranty_claim` (extension TBD) |
| Cross-module call boundary | **sync** ACL `/acl/brand-warranty/inquire`; **sync** to M07 for RMA dispatch |
| Config dependency | `warranty_mode_defaults_per_brand`, `warranty_inquiry_timeout_ms` |

### M14 Partner Portal (Phase I read-only / Phase III full)

| Field | Value |
|:------|:------|
| Owner persona | sa + ba |
| Phase | I read-only dashboard only; full B2B in Phase III |
| Public API surface | `M14 Partner Portal` (`/partners/{id}/dashboard`) — scope enforced to own brand (ADR-0043) |
| DB ownership | reads aggregated from M01-M11; no writes V1 |
| Cross-module call boundary | **sync** read-only; **async** dashboard refresh via materialized view |
| Config dependency | `partner_dashboard_kpi_set`, `partner_brand_scope_policy` |

### M15 Exception / ChangeRequest (Phase I)

| Field | Value |
|:------|:------|
| Owner persona | sa + qa |
| Upstream consumers | M07 onsite escalate (≥ NTD 2000); M11 refund L3+ inbox; M05 tech penalty appeal |
| Downstream producers | `exception.approved/rejected`, `change_request.effective` |
| Public API surface | `M15 Exception / ChangeRequest` (`/exceptions:inbox`, `:approve`); `/change-requests` (sibling) |
| DB ownership | `saas.change_request`, `saas.change_request_approval`, `saas.change_request_type_dim` |
| Cross-module call boundary | **sync** ACL to M18 for type lookup (ADR-0065); **sync** writes to M11 / M17 when effective |
| Config dependency | `change_request_approval_chain_per_type` |

### M16 Consumer Tracking (Phase I)

| Field | Value |
|:------|:------|
| Owner persona | ux + sd |
| Upstream consumers | Public — consumer with signed tracking token |
| Downstream producers | `consumer.tracking.viewed` (analytics only) |
| Public API surface | `M16 Consumer Tracking` (`/consumer/work-orders/{trackingToken}`) — unauthenticated |
| DB ownership | reads `saas.work_order`, `saas.onsite_event`, `saas.user_account`(masked tech name) |
| Cross-module call boundary | **sync** read-only with PII redaction at handler entry |
| Config dependency | `consumer_view_field_whitelist`, `consumer_token_ttl_days` (default 30) |

### M17 RBAC / Audit (Phase I)

| Field | Value |
|:------|:------|
| Owner persona | sa + dba |
| Upstream consumers | All modules emit `audit_event`; admin UI for RBAC config |
| Downstream producers | `audit.exported`, `rbac.matrix.changed` |
| Public API surface | `M17 RBAC / Audit` (`/rbac/roles`, `/audit/events`, `/audit/exports`) |
| DB ownership | `saas.rbac_role`, `saas.rbac_permission`, `saas.user_role_binding`, `saas.audit_event` |
| Cross-module call boundary | **sync** read at handler entry (cached); **async** audit outbox to S3 |
| Config dependency | `rbac_4tier_role_codes`, `audit_export_retention_days` |

### M18 Config Governance (Phase 0 — critical path)

| Field | Value |
|:------|:------|
| Owner persona | sd + arch |
| Phase | **0 — Phase 0 critical path blocker** (ADR-0067) |
| Upstream consumers | All M01-M17 modules consume config via ACL (ADR-0068) |
| Downstream producers | `config.draft_created`, `rollout.stage_advanced`, `config.activated/rolled_back` |
| Public API surface | `M18 Config Governance` (write path) + `M18 Config Read API` (ACL read path) |
| DB ownership | `saas.config_namespace`, `saas.config_version`, `saas.config_rollout`, `saas.config_audit` |
| Cross-module call boundary | **all reads** go through `/m18/config-read/{namespace}/{key}` (ADR-0068 ACL — direct DB query **forbidden**) |
| Config dependency | Self (bootstrap config in migration seed) |

### M19 BI / KPI (Phase I light — full Phase V)

| Module | Phase I scope |
|:-------|:--------------|
| M19 BI / KPI | KPI Dashboard reads `audit_event` + materialized views; full Gold tier ETL → Phase V |

### M20 AI Ops (Phase I light — full Phase IV)

| Module | Phase I scope |
|:-------|:--------------|
| M20 AI Ops | SOP draft/review + eval triggers → A09 + A12 (Phase II governance) |

---

## §2 Chatbot modules (A01-A12)

### A01 Chatbot Intake (Debounce) (Phase I)

| Field | Value |
|:------|:------|
| Owner persona | ai engineer |
| Upstream consumers | M01 LINE webhook |
| Downstream producers | `intake.debounced.fired` → A03 ReAct |
| Public API surface | `A01 Chatbot Intake` (`/chatbot/intake:debounce-check`) |
| DB ownership | writes `saas.message` (chatbot side) |
| Cross-module call boundary | **sync** server-authoritative debounce window check (K-AI-9 800ms ± 100ms) |
| Config dependency | `chatbot_debounce_window_ms` |

### A03 ReAct Agent (Phase I)

| Field | Value |
|:------|:------|
| Owner persona | ai engineer |
| Upstream consumers | A01 (debounced) |
| Downstream producers | `agent.response.emitted`, `agent.handoff.requested`, `skill.invoked` |
| Public API surface | `A03 ReAct Agent` (`/chatbot/agent:respond`) |
| DB ownership | writes `saas.skill_invocation` |
| Cross-module call boundary | **sync** A04 RAG + A05 Guardrails; **async** A09 telemetry; **sync** A06 PC draft for confirmed intent |
| Config dependency | `forbidden_topic_corpus_ref` (FR-NEW-3); `agent_max_iterations` |

### A04 RAG Pipeline (Phase I)

| Field | Value |
|:------|:------|
| Owner persona | ai engineer + knowledge owner |
| Upstream consumers | A03 (search query) |
| Downstream producers | `rag.retrieved` (with citations); `rag.stale_warning` (ADR-0101 ≥ 24h lag) |
| Public API surface | `A04 RAG Pipeline` (`/chatbot/rag:search`) |
| DB ownership | reads `saas.knowledge_doc`, `saas.knowledge_chunk_embedding` |
| Cross-module call boundary | **sync** KB scope check via `X-Brand-Scope` / `X-Project-Scope` (ADR-0101 §2.3) |
| Config dependency | `rag_top_k_default`, `rag_stale_threshold_hours` |

### A05 Guardrails (Phase I)

| Field | Value |
|:------|:------|
| Owner persona | qa + ai engineer |
| Upstream consumers | A03 (pre-output validator) |
| Downstream producers | `guardrail.rejected` (writes A09 telemetry with `rule_triggered_by`) |
| Public API surface | `A05 Guardrails` (`/chatbot/guardrails:check`) |
| DB ownership | reads guardrail config (no writes) |
| Cross-module call boundary | **sync** deterministic rule engine (BR-AI-003 — no LLM self-report) |
| Config dependency | `guardrail_rules` (ADR-0028 hard constraints) |

### A06 ProblemCard Bridge (Phase I — Q2=C)

| Field | Value |
|:------|:------|
| Owner persona | sa + ai engineer |
| Upstream consumers | A03 (confirmed intent) |
| Downstream producers | `problem_card.draft.created` → S-M03 → M03 CS queue |
| Public API surface | `A06 ProblemCard Bridge` (`/chatbot/problem-cards:draft`) |
| DB ownership | writes `saas.problem_card(state='draft')` |
| Cross-module call boundary | **sync** S-M03 with mandatory `human_confirmed=true` gate (ADR-0031 / G-Sync-3) — AI direct convert → 403 |
| Config dependency | `pc_draft_completeness_minimum` |

### A07 Human Handoff (Phase I — OQ-004 link-based)

| Field | Value |
|:------|:------|
| Owner persona | sd + customer service lead |
| Upstream consumers | A03 (7 hard rules per ADR-0048) or customer explicit request |
| Downstream producers | `handoff.requested` (with `trigger` enum from deterministic engine) |
| Public API surface | `A07 Human Handoff` (`/chatbot/handoff:request`) |
| DB ownership | writes `saas.audit_event(event_type='handoff_requested')` |
| Cross-module call boundary | **sync** returns CS callback link (OQ-004 — no embedded chat) |
| Config dependency | `handoff_hard_rules`, `cs_callback_url_template` |

### A08 Multimodal (Phase I — image attach only, no vision API)

| Field | Value |
|:------|:------|
| Owner persona | ai engineer + security |
| Upstream consumers | M01 LINE image webhook |
| Downstream producers | `image.attached`, `image.quality_rejected` (K-AI-10 < 15%) |
| Public API surface | `A08 Multimodal` (`/chatbot/multimodal:image`) |
| DB ownership | writes `saas.evidence_attachment(evidence_type='photo')` |
| Cross-module call boundary | **sync** double-gate (pre-commit + runtime) against vision API (SOW 2.1(4) hard ban — FR-NEW-9) |
| Config dependency | `image_quality_min_resolution`, `image_format_allowlist` |

### A09 Eval & Observability (Phase I — Q2=C)

| Field | Value |
|:------|:------|
| Owner persona | qa |
| Upstream consumers | A03/A04/A05 telemetry; manual eval triggers |
| Downstream producers | `eval.completed`, `eval.block_deploy` (K1 / K8 < threshold) |
| Public API surface | `A09 Eval & Observability` (`/chatbot/eval/runs`, `/eval/runs/{id}`) |
| DB ownership | eval results stored in S3; metadata in `saas.audit_event(event_type='eval_run_*')` |
| Cross-module call boundary | **sync** to A11 health for deploy gate; **async** dashboard refresh |
| Config dependency | `eval_corpus_versions`, `eval_block_deploy_threshold` (95% per FR-NEW-3) |

### A11 Deployment Health (Phase I)

| Field | Value |
|:------|:------|
| Owner persona | sre + devops |
| Upstream consumers | A03/A04/A05/A06/A07/A08 component status |
| Downstream producers | `system.degraded/down` alerts |
| Public API surface | `A11 Deployment Health` (`/chatbot/health`) |
| DB ownership | reads infra metrics; no business DB writes |
| Cross-module call boundary | **sync** synthetic probe; **async** alert dispatch |
| Config dependency | `health_check_targets`, `degradation_threshold_per_component` |

### A12 Governance & PRD Trace (Phase II — deferred per business Q2=C)

| Module | Phase II scope |
|:-------|:--------------|
| A12 | Long-tail KB feedback loop, model version rollback, A03 prompt change governance — landed in Phase II |

> A02 Brand Profile Resolver / A10 SOP Feedback are existing FR-0027 / FR-0051 components; Phase I MVP boundary defined in their respective FR docs, not duplicated here.

---

## §3 Sync modules (S-M01 to S-M06)

All sync modules expose a single contract style:

- **Inbound** envelope = `SyncEventEnvelope` (`event_type`, `event_payload`, `source_module`, `target_module`, `correlation_id`)
- **Async** by default (returns `202` + receipt); transactional outbox on the ERP side
- **G-Sync gates** enforced per `PRD §E.4`:
  - G-Sync-3: S-M04 convert-to-WO MUST carry `human_confirmed=true` in Phase I
  - G-Sync-4: exception inbox routes high-risk events to M15 instead of auto-apply

| Sync ID | Direction | Source → Target | Public API tag | DB writes |
|:--------|:----------|:----------------|:---------------|:----------|
| S-M01 | chatbot → ERP | A01 raw intake → M01 conversation | `/sync/intake-capture` | `saas.conversation`, `saas.message` |
| S-M02 | chatbot ↔ ERP | A03 user_facts (SCD2) ↔ M04 customer master | `/sync/facts-master` | `saas.customer` (PII-aware merge) |
| S-M03 | chatbot → ERP | A06 PC draft → M03 confirmed PC | `/sync/pc-convert` | `saas.problem_card(state='draft')` |
| S-M04 | ERP → ERP | M03 confirmed PC → M06 WO (with G-Sync-3 human gate) | `/sync/convert-to-wo` | `saas.work_order(state='created')` |
| S-M05 | ERP → chatbot | M06 dispatch status → A01 customer push | `/sync/dispatch` | none (push only) |
| S-M06 | ERP → chatbot | M07 evidence → A03 context | `/sync/evidence-writeback` | `saas.evidence_attachment` (chatbot-side reference) |

---

## §4 Cross-module call boundary policy

| Pattern | Use case | Convention |
|:--------|:---------|:-----------|
| **Sync REST** | Same business transaction (e.g. M11 cancellation calls M18 ACL for fee tier) | Bearer JWT, `X-Tenant-Id`, `X-Config-Version`, idempotency key |
| **Async event (outbox)** | After commit fan-out (e.g. WO created → A01 push) | Transactional outbox in source DB → CDC → bus → consumer |
| **Event-driven (push)** | M18 config rollout invalidation | `config.stage_advanced` event → ACL cache invalidate ≤ 5s |
| **ACL boundary call** | Reading config or external partner | Strictly through `/m18/config-read/*` or `/acl/*` endpoints (ADR-0068) |
| **Forbidden** | Direct cross-module DB query, hard-coded fallback | DB GRANT enforces (migration 002); CI lint flag for hard-coded config keys |

---

## §5 Pricing engine bounded context (ADR-0062)

Pricing engine lives **inside** M11 module boundary as a sub-package (`api/pricing/`), per ADR-0062 §D1-B (not an independent service).

| Caller | Allowed? | Path |
|:-------|:---------|:-----|
| Quote (M11 sub) | ✅ | in-process `PricingEngineService.calculate(...)` |
| WorkOrder (M07) | ❌ direct call | must reference `quote.snapshot_hash` (immutable) |
| AI agent (A03) | ❌ direct call (ADR-0063) | reads `quote` aggregate read-model; never calls pricing |
| Settlement (M12, Phase II) | ✅ | via `quote.snapshot_hash` reference |

**Failure mode**: pricing engine down → admin banner alert + CS degraded mode (D1-A manual price entry per ADR-0062 §D1-B failure mode) + override SLI alert if > 20% sustained 7d.

---

## §6 KB × ERP boundary (ADR-0101)

| Boundary | Owner | Sync strategy |
|:---------|:------|:--------------|
| M02 (brand/model) ⟶ KB `knowledge_doc.mega_doc` | M02 / data steward | Daily batch + change event; stale SLA ≤ 24h |
| M10 (BOM master) ⟶ KB lineage | M10 / data steward | Read-only mirror; KB stale flag if hash mismatch |
| M14 (partner project hierarchy) ⟶ KB `project_scope` | M14 / partner admin | Phase III full; Phase I = manual register |
| Custom SKU / fallback | A03 + ops | `transfer_to_human` event → human CS adds KB ticket (UC-new-4 per ADR-0101 §2.4) |

---

## §7 Phase II/III/IV/V boundary sketches

> Per roundtable D3, future phases only sketch (module ID + owner + scope intent + out-of-scope bullets). No NFR baseline until that phase enters Gate1.

| Phase | New modules entering | Out-of-scope for I |
|:------|:--------------------|:-------------------|
| Phase II | M12 settlement (monthly export), A12 governance, M11 finance depth | M12 endpoints stubbed (`501`); A12 deferred (Q2=C) |
| Phase III | M14 Partner B2B full, M10 BOM depth, M13 partner warranty integration | Partner write-path; builder hierarchy |
| Phase IV | M20 AI Ops depth — RAG/SOP versioning, eval feedback loop, model rollback | Phase I keeps A12 stubbed |
| Phase V | M19 BI full — Gold tier ETL, KPI executive dashboards | Phase I = K1-K11 instrumentation only |

---

**End of module boundary map v1.0.**

> All boundaries reference **contract level** only. Internal schema lives in
> ERD / OpenAPI; behavior rules in System Spec / BR; quality attributes in NFR matrix.
