-- =============================================================================
-- Migration 001 — Initial Schema (Phase I MVP)
-- =============================================================================
-- Target: PostgreSQL 16 + pgvector 0.6+
-- Schema:  saas (avoid public)
-- Scope:   M01-M07 / M11 / M13-M18 + A01-A12 + S-M01-S-M06 — Phase I MVP
-- Cross:   docs/architecture/data/erd-smart-lock-saas.md
-- Author:  devteam-design (sd + dba)
-- Date:    2026-05-28
--
-- Rollback: see § ROLLBACK at end of file (or `migration-001-rollback.sql`)
-- PII columns: customer.{phone_enc,name_enc}, site.address_enc, user_account.email_enc,
--              message.text (read-time mask), evidence_attachment.storage_uri (blob)
-- Retention: ADR-0051 (evidence) / ADR-VCH-002 (config_audit, journal_entry ≥ 7y)
-- =============================================================================

BEGIN;

-- -----------------------------------------------------------------------------
-- 0. Extensions + schema
-- -----------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "pgcrypto";   -- gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS "pgvector";   -- vector type
CREATE EXTENSION IF NOT EXISTS "pg_trgm";    -- trigram (for fuzzy address search)

CREATE SCHEMA IF NOT EXISTS saas;
SET search_path TO saas, public;

-- -----------------------------------------------------------------------------
-- 1. Roles (created idempotently — actual GRANT in migration 002)
-- -----------------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'app_role') THEN
    CREATE ROLE app_role NOLOGIN;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'cron_role') THEN
    CREATE ROLE cron_role NOLOGIN;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'dgs_role') THEN
    CREATE ROLE dgs_role NOLOGIN;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'm18_admin_role') THEN
    CREATE ROLE m18_admin_role NOLOGIN;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'm18_acl_reader_role') THEN
    CREATE ROLE m18_acl_reader_role NOLOGIN;
  END IF;
END $$;

-- -----------------------------------------------------------------------------
-- 2. Audit trigger function (updated_at + updated_by)
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION saas.tg_touch_updated_at() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION saas.tg_block_mutation() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'append-only table — mutation blocked (% on %)', TG_OP, TG_TABLE_NAME;
END;
$$;

-- -----------------------------------------------------------------------------
-- 3. Identity & RBAC (7 tables)
-- -----------------------------------------------------------------------------
CREATE TABLE saas.tenant (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name          text NOT NULL,
  locale        text NOT NULL DEFAULT 'zh-TW',
  tenant_status text NOT NULL CHECK (tenant_status IN ('active','suspended','archived')),
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);
CREATE TRIGGER tenant_touch BEFORE UPDATE ON saas.tenant
  FOR EACH ROW EXECUTE FUNCTION saas.tg_touch_updated_at();

CREATE TABLE saas.tenant_dek (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   uuid NOT NULL REFERENCES saas.tenant(id),
  kek_alias   text NOT NULL,             -- KMS CMK alias
  wrapped_dek bytea NOT NULL,            -- KMS-wrapped data encryption key
  created_at  timestamptz NOT NULL DEFAULT now(),
  retired_at  timestamptz                -- rotation marker
);

CREATE TABLE saas.brand (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id  uuid NOT NULL REFERENCES saas.tenant(id),
  name       text NOT NULL,
  status     text NOT NULL DEFAULT 'active' CHECK (status IN ('active','archived')),
  partner_id uuid,                       -- Phase II partner portal
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX brand_tenant_idx ON saas.brand(tenant_id);

CREATE TABLE saas.project (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id  uuid NOT NULL REFERENCES saas.tenant(id),
  builder_id uuid,                       -- Phase III builder hierarchy
  name       text NOT NULL,
  unit_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX project_tenant_idx ON saas.project(tenant_id);

CREATE TABLE saas.user_account (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id    uuid NOT NULL REFERENCES saas.tenant(id),
  display_name text NOT NULL,
  email_enc    bytea,                    -- PII envelope encrypted (DEK)
  status       text NOT NULL DEFAULT 'active' CHECK (status IN ('active','suspended','terminated')),
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);
CREATE TRIGGER user_touch BEFORE UPDATE ON saas.user_account
  FOR EACH ROW EXECUTE FUNCTION saas.tg_touch_updated_at();
CREATE INDEX user_account_tenant_idx ON saas.user_account(tenant_id);

CREATE TABLE saas.rbac_role (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   uuid NOT NULL REFERENCES saas.tenant(id),
  role_code   text NOT NULL,
  tier        text NOT NULL CHECK (tier IN ('L1','L2','L3','L4')),
  description text,
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, role_code)
);

CREATE TABLE saas.rbac_permission (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  role_id        uuid NOT NULL REFERENCES saas.rbac_role(id),
  resource       text NOT NULL,                              -- e.g. 'work_order', 'evidence'
  action         text NOT NULL CHECK (action IN ('view','edit','approve')),
  scope          text NOT NULL CHECK (scope IN ('tenant','brand','project','household')),
  attr_mask      jsonb NOT NULL DEFAULT '{}'::jsonb,          -- column-level PII mask (ADR-0050 v2)
  effective_from timestamptz NOT NULL DEFAULT now(),
  effective_to   timestamptz                                  -- time-boxed for IT support
);
CREATE INDEX rbac_perm_role_idx ON saas.rbac_permission(role_id);

CREATE TABLE saas.user_role_binding (
  user_id    uuid NOT NULL REFERENCES saas.user_account(id),
  role_id    uuid NOT NULL REFERENCES saas.rbac_role(id),
  tenant_id  uuid NOT NULL,                                -- denormalized for RLS
  granted_at timestamptz NOT NULL DEFAULT now(),
  granted_by uuid REFERENCES saas.user_account(id),
  PRIMARY KEY (user_id, role_id)
);

-- -----------------------------------------------------------------------------
-- 4. Core entities (5 tables)
-- -----------------------------------------------------------------------------
CREATE TABLE saas.customer (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id            uuid NOT NULL REFERENCES saas.tenant(id),
  brand_scope          text[] NOT NULL DEFAULT '{}',
  locale               text NOT NULL DEFAULT 'zh-TW',
  line_user_id         text NOT NULL,
  phone_enc            bytea,                  -- PII envelope encrypted
  name_enc             bytea,                  -- PII envelope encrypted
  pii_retention_policy text NOT NULL DEFAULT 'default' CHECK (pii_retention_policy IN ('default','custom')),
  dek_id               uuid REFERENCES saas.tenant_dek(id),
  created_at           timestamptz NOT NULL DEFAULT now(),
  purged_at            timestamptz             -- two-phase purge anchor
);
CREATE UNIQUE INDEX customer_tenant_line_uniq ON saas.customer(tenant_id, line_user_id);
CREATE INDEX customer_purge_lookup_idx ON saas.customer(tenant_id, purged_at) WHERE purged_at IS NOT NULL;

CREATE TABLE saas.site (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   uuid NOT NULL REFERENCES saas.tenant(id),
  customer_id uuid NOT NULL REFERENCES saas.customer(id),
  project_id  uuid REFERENCES saas.project(id),
  address_enc bytea,                            -- PII envelope encrypted
  geo_district text,                            -- low-sensitivity, cleartext
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX site_customer_idx ON saas.site(customer_id);
CREATE INDEX site_project_idx ON saas.site(project_id) WHERE project_id IS NOT NULL;

CREATE TABLE saas.model (
  id        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES saas.tenant(id),
  brand_id  uuid NOT NULL REFERENCES saas.brand(id),
  sku       text NOT NULL,
  category  text NOT NULL,                      -- 'main_lock', 'auxiliary'
  list_price numeric(12,2),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (brand_id, sku)
);

CREATE TABLE saas.device (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     uuid NOT NULL REFERENCES saas.tenant(id),
  serial        text,                          -- ADR-0053: required if main_lock or price > 1000
  brand_id      uuid NOT NULL REFERENCES saas.brand(id),
  model_id      uuid NOT NULL REFERENCES saas.model(id),
  site_id       uuid NOT NULL REFERENCES saas.site(id),
  main_lock     boolean NOT NULL DEFAULT false,
  purchase_date date,
  created_at    timestamptz NOT NULL DEFAULT now()
);
-- ADR-0053: serial mandatory rule
ALTER TABLE saas.device ADD CONSTRAINT device_serial_required
  CHECK (
    serial IS NOT NULL
    OR (main_lock = false AND COALESCE((
        SELECT m.list_price FROM saas.model m WHERE m.id = device.model_id
      ), 0) <= 1000)
  );
-- Note: subquery CHECK only works as deferred trigger in some PG versions;
-- production-grade enforcement uses BEFORE INSERT/UPDATE trigger (see migration 002).

CREATE INDEX device_site_idx ON saas.device(site_id);
CREATE INDEX device_serial_lookup ON saas.device(serial) WHERE serial IS NOT NULL;

CREATE TABLE saas.device_warranty (
  device_id              uuid PRIMARY KEY REFERENCES saas.device(id),
  tenant_id              uuid NOT NULL,
  warranty_mode          text NOT NULL CHECK (warranty_mode IN ('purchase','handover','activation','contract','manual_override')),
  warranty_start_date    date NOT NULL,
  warranty_expiry_date   date NOT NULL,
  coverage_class         text NOT NULL CHECK (coverage_class IN ('full','parts_only','labor_only','expired')),
  manual_override_reason text,
  last_change_request_id uuid,
  updated_at             timestamptz NOT NULL DEFAULT now(),
  CHECK (warranty_mode != 'manual_override' OR manual_override_reason IS NOT NULL)
);
CREATE TRIGGER device_warranty_touch BEFORE UPDATE ON saas.device_warranty
  FOR EACH ROW EXECUTE FUNCTION saas.tg_touch_updated_at();

-- -----------------------------------------------------------------------------
-- 5. Conversation + chatbot (5 tables)
-- -----------------------------------------------------------------------------
CREATE TABLE saas.conversation (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id      uuid NOT NULL REFERENCES saas.tenant(id),
  customer_id    uuid NOT NULL REFERENCES saas.customer(id),
  channel_type   text NOT NULL CHECK (channel_type IN ('line','web','hotline')),
  state          text NOT NULL CHECK (state IN ('active','resolving','escalated','closed','auto_closed')),
  auto_closed_at timestamptz,
  reopen_count   integer NOT NULL DEFAULT 0,
  started_at     timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX conversation_state_idx ON saas.conversation(tenant_id, state);

-- message — partitioned by created_at weekly
CREATE TABLE saas.message (
  id              uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id       uuid NOT NULL,
  conversation_id uuid NOT NULL,
  sender_role     text NOT NULL CHECK (sender_role IN ('customer','ai_agent','cs_agent','system')),
  text            text,                           -- read-time PII mask via attr_mask
  media_refs      text[] NOT NULL DEFAULT '{}',
  created_at      timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (id, created_at)
) PARTITION BY RANGE (created_at);

-- Bootstrap 4 weekly partitions; migration 004 owns rolling creation via pg_partman
CREATE TABLE saas.message_w202622 PARTITION OF saas.message
  FOR VALUES FROM ('2026-05-25') TO ('2026-06-01');
CREATE TABLE saas.message_w202623 PARTITION OF saas.message
  FOR VALUES FROM ('2026-06-01') TO ('2026-06-08');
CREATE TABLE saas.message_w202624 PARTITION OF saas.message
  FOR VALUES FROM ('2026-06-08') TO ('2026-06-15');
CREATE TABLE saas.message_w202625 PARTITION OF saas.message
  FOR VALUES FROM ('2026-06-15') TO ('2026-06-22');

CREATE INDEX message_conv_idx ON saas.message(conversation_id, created_at DESC);

CREATE TABLE saas.skill_invocation (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id         uuid NOT NULL REFERENCES saas.tenant(id),
  conversation_id   uuid NOT NULL REFERENCES saas.conversation(id),
  skill_name        text NOT NULL,
  input_hash        text,
  output_hash       text,
  latency_ms        integer,
  guardrail_passed  boolean,
  rule_triggered_by text,                            -- BR-AI-003 deterministic engine writes
  citations         jsonb NOT NULL DEFAULT '[]'::jsonb,
  ts                timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX skill_inv_conv_idx ON saas.skill_invocation(conversation_id, ts DESC);

CREATE TABLE saas.knowledge_doc (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  doc_type       text NOT NULL CHECK (doc_type IN ('mega_doc','manual','sop','faq')),
  tenant_scope   text[] NOT NULL DEFAULT '{}',     -- empty = global (read-only for L4)
  brand_scope    text[] NOT NULL DEFAULT '{}',
  project_scope  text[] NOT NULL DEFAULT '{}',
  title          text NOT NULL,
  version        text NOT NULL,
  effective_date date,
  source_uri     text,
  content_hash   text,                             -- stale-detect vs ERP master (ADR-0101 §2.1)
  last_synced_at timestamptz,
  created_at     timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX kb_tenant_scope_gin   ON saas.knowledge_doc USING GIN (tenant_scope);
CREATE INDEX kb_brand_scope_gin    ON saas.knowledge_doc USING GIN (brand_scope);
CREATE INDEX kb_project_scope_gin  ON saas.knowledge_doc USING GIN (project_scope);

CREATE TABLE saas.knowledge_chunk_embedding (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  doc_id       uuid NOT NULL REFERENCES saas.knowledge_doc(id),
  chunk_text   text NOT NULL,
  embedding    vector(768) NOT NULL,                 -- Google text-embedding-004
  tenant_scope text[] NOT NULL DEFAULT '{}',         -- denorm for fast scope filter
  created_at   timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX kb_chunk_ann ON saas.knowledge_chunk_embedding
  USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
CREATE INDEX kb_chunk_scope_gin ON saas.knowledge_chunk_embedding USING GIN (tenant_scope);

-- -----------------------------------------------------------------------------
-- 6. Work order pipeline (8 tables)
-- -----------------------------------------------------------------------------
CREATE TABLE saas.problem_card (
  id                          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id                   uuid NOT NULL REFERENCES saas.tenant(id),
  conversation_id             uuid NOT NULL REFERENCES saas.conversation(id),
  device_id                   uuid REFERENCES saas.device(id),
  urgency                     text NOT NULL DEFAULT 'normal'
    CHECK (urgency IN ('normal','urgent_locked_out','urgent_trapped_inside','urgent_safety_risk','urgent_angry_customer_high_risk')),
  urgency_detected_at         timestamptz,
  completeness_score          numeric(3,2) NOT NULL DEFAULT 0.0 CHECK (completeness_score >= 0 AND completeness_score <= 1),
  state                       text NOT NULL DEFAULT 'incomplete'
    CHECK (state IN ('incomplete','draft','confirmed','ai_responded','resolved')),
  clarification_confirmed_at  timestamptz,
  clarification_attempts      integer NOT NULL DEFAULT 0,
  emergency_class             text,                              -- denorm of urgency for carve-out FK use
  created_at                  timestamptz NOT NULL DEFAULT now(),
  updated_at                  timestamptz NOT NULL DEFAULT now()
);
CREATE TRIGGER pc_touch BEFORE UPDATE ON saas.problem_card
  FOR EACH ROW EXECUTE FUNCTION saas.tg_touch_updated_at();

-- ADR-0036: one active PC per (conversation, device)
CREATE UNIQUE INDEX pc_active_unique
  ON saas.problem_card(conversation_id, device_id)
  WHERE state IN ('draft','confirmed','ai_responded') AND device_id IS NOT NULL;
CREATE INDEX pc_inbox_idx ON saas.problem_card(tenant_id, state, created_at DESC);

-- quote table itself lives in companion erd.md v1.1; we add only the version chain here
-- (assuming `quote` table is created by migration 000-quote-snapshot from earlier work).
-- For Phase I MVP standalone deployments, uncomment the next block:
--   CREATE TABLE saas.quote (...);  -- per erd.md §quote

CREATE TABLE saas.quote_version (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id         uuid NOT NULL REFERENCES saas.tenant(id),
  quote_id          uuid NOT NULL,                       -- FK to saas.quote (deferred)
  version_no        integer NOT NULL,
  snapshot_hash     text NOT NULL,                       -- sha256 canonical_form
  prev_hash         text,
  canonical_payload jsonb NOT NULL,
  created_at        timestamptz NOT NULL DEFAULT now(),
  UNIQUE (quote_id, version_no),
  UNIQUE (snapshot_hash)
);
-- Append-only: block UPDATE/DELETE
CREATE TRIGGER quote_version_no_update BEFORE UPDATE ON saas.quote_version
  FOR EACH ROW EXECUTE FUNCTION saas.tg_block_mutation();
CREATE TRIGGER quote_version_no_delete BEFORE DELETE ON saas.quote_version
  FOR EACH ROW EXECUTE FUNCTION saas.tg_block_mutation();

-- work_order — partitioned by created_at monthly
CREATE TABLE saas.work_order (
  id                                  uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id                           uuid NOT NULL,
  pc_id                               uuid NOT NULL,
  state                               text NOT NULL
    CHECK (state IN ('draft','created','assigned','accepted','in_progress','completed','cancelled')),
  address_enc                         bytea,                     -- ADR-0032: not null at close
  assigned_technician_id              uuid,
  create_trigger                      text NOT NULL
    CHECK (create_trigger IN ('ai_path_customer_triggered','cs_path_csagent_triggered')),
  created_by_user_id                  uuid NOT NULL,             -- ADR-0031 CS 1-click actor
  quote_id                            uuid,                      -- ADR-0066
  emergency_class                     text,                      -- ADR-0066 carve-out
  retrospective_quote_audit_complete  boolean NOT NULL DEFAULT false,
  idempotency_key                     text NOT NULL,
  created_at                          timestamptz NOT NULL DEFAULT now(),
  closed_at                           timestamptz,
  PRIMARY KEY (id, created_at),
  UNIQUE (tenant_id, idempotency_key, created_at)
) PARTITION BY RANGE (created_at);

-- ADR-0032: address must not be null at close
ALTER TABLE saas.work_order ADD CONSTRAINT wo_close_requires_address
  CHECK (state != 'completed' OR address_enc IS NOT NULL);
-- ADR-0066: quote OR emergency carve-out
ALTER TABLE saas.work_order ADD CONSTRAINT wo_quote_or_emergency
  CHECK (
    state IN ('draft','cancelled') OR quote_id IS NOT NULL OR emergency_class IS NOT NULL
  );

CREATE TABLE saas.work_order_y2026m05 PARTITION OF saas.work_order
  FOR VALUES FROM ('2026-05-01') TO ('2026-06-01');
CREATE TABLE saas.work_order_y2026m06 PARTITION OF saas.work_order
  FOR VALUES FROM ('2026-06-01') TO ('2026-07-01');
CREATE TABLE saas.work_order_y2026m07 PARTITION OF saas.work_order
  FOR VALUES FROM ('2026-07-01') TO ('2026-08-01');

CREATE INDEX wo_inbox_idx ON saas.work_order(tenant_id, state, created_at DESC);
CREATE INDEX wo_pc_idx    ON saas.work_order(pc_id);
CREATE INDEX wo_tech_idx  ON saas.work_order(assigned_technician_id) WHERE assigned_technician_id IS NOT NULL;

CREATE TABLE saas.work_order_status_history (
  id               bigserial PRIMARY KEY,
  tenant_id        uuid NOT NULL,
  work_order_id    uuid NOT NULL,
  from_state       text,
  to_state         text NOT NULL,
  transitioned_by  uuid,                                  -- nullable for system transitions
  transitioned_at  timestamptz NOT NULL DEFAULT now(),
  reason_code      text,
  evidence_ids     uuid[] NOT NULL DEFAULT '{}'
);
CREATE INDEX wo_hist_idx ON saas.work_order_status_history(work_order_id, transitioned_at);

CREATE TABLE saas.onsite_event (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     uuid NOT NULL REFERENCES saas.tenant(id),
  work_order_id uuid NOT NULL,
  event_type    text NOT NULL CHECK (event_type IN (
                    'arrived','started_work','scope_change','pending_quote_v2',
                    'completed','customer_not_onsite','customer_disagreed_partial')),
  gps_lat       numeric(9,6),
  gps_lng       numeric(9,6),
  gps_accuracy_m numeric,
  ts            timestamptz NOT NULL DEFAULT now(),
  evidence_ids  uuid[] NOT NULL DEFAULT '{}',
  notes         text
);
CREATE INDEX onsite_wo_idx ON saas.onsite_event(work_order_id, ts);

CREATE TABLE saas.cancellation (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id           uuid NOT NULL REFERENCES saas.tenant(id),
  work_order_id       uuid NOT NULL,
  cancellation_stage  text NOT NULL CHECK (cancellation_stage IN ('S1','S1_5','S2','S3','S4','S5')),
  initiator_role      text NOT NULL CHECK (initiator_role IN ('customer','customer_service','technician','system_auto')),
  reason_code         text NOT NULL,                    -- FK enforced at app layer via config namespace lookup
  customer_fee        numeric(12,2) NOT NULL DEFAULT 0,
  travel_fee          numeric(12,2) NOT NULL DEFAULT 0,
  technician_penalty  numeric(12,2),
  goodwill_waiver     boolean NOT NULL DEFAULT false,
  audit_event_id      uuid NOT NULL,
  config_version_used text NOT NULL,                    -- ADR-0067 §5 per-transaction snapshot
  created_at          timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX cancel_wo_idx ON saas.cancellation(work_order_id);
CREATE INDEX cancel_tenant_stage_idx ON saas.cancellation(tenant_id, cancellation_stage, created_at);

CREATE TABLE saas.refund (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id           uuid NOT NULL REFERENCES saas.tenant(id),
  work_order_id       uuid NOT NULL,
  amount              numeric(12,2) NOT NULL CHECK (amount > 0),
  tier                text NOT NULL CHECK (tier IN ('L1','L2','L3','L4','L5')),
  refund_class        text NOT NULL CHECK (refund_class IN ('product','labor','material','travel','inspection')),
  state               text NOT NULL DEFAULT 'pending'
                          CHECK (state IN ('pending','approved','executed','rejected')),
  initiator_user_id   uuid NOT NULL,
  approver_user_ids   uuid[] NOT NULL DEFAULT '{}',
  executor_user_id    uuid,                                -- system or payment provider
  evidence_ids        uuid[] NOT NULL DEFAULT '{}',
  audit_event_id      uuid NOT NULL,
  created_at          timestamptz NOT NULL DEFAULT now(),
  executed_at         timestamptz,
  CHECK (initiator_user_id <> ALL(approver_user_ids)),
  CHECK (executor_user_id IS NULL OR executor_user_id <> initiator_user_id)
);
CREATE INDEX refund_wo_idx ON saas.refund(work_order_id);
CREATE INDEX refund_state_idx ON saas.refund(tenant_id, state, created_at DESC);

-- -----------------------------------------------------------------------------
-- 7. Evidence + change-request (3 tables)
-- -----------------------------------------------------------------------------
-- evidence_attachment — LIST partition by retention_class
CREATE TABLE saas.evidence_attachment (
  sha256              text NOT NULL,
  tenant_id           uuid NOT NULL,
  work_order_id       uuid,
  evidence_type       text NOT NULL CHECK (evidence_type IN ('photo','signature','gps_proof','document')),
  visibility_scope    jsonb NOT NULL,                     -- ADR-0050 v2: {role_tier, lifecycle_phase, action[], attr_mask}
  retention_class     text NOT NULL CHECK (retention_class IN ('default_1y','rma_3y','eternal_audit','legal_hold')),
  legal_hold          boolean NOT NULL DEFAULT false,     -- column-level, NOT partition key
  dek_id              uuid,
  storage_uri         text NOT NULL,
  created_at          timestamptz NOT NULL DEFAULT now(),
  pending_purge_at    timestamptz,                        -- T0 — DEK destroyed, soft-delete
  purged_at           timestamptz,                        -- T+30d hard delete
  last_known_good_at  timestamptz,
  PRIMARY KEY (sha256, retention_class),
  CHECK (NOT legal_hold OR purged_at IS NULL)
) PARTITION BY LIST (retention_class);

CREATE TABLE saas.evidence_default_1y    PARTITION OF saas.evidence_attachment FOR VALUES IN ('default_1y');
CREATE TABLE saas.evidence_rma_3y        PARTITION OF saas.evidence_attachment FOR VALUES IN ('rma_3y');
CREATE TABLE saas.evidence_eternal_audit PARTITION OF saas.evidence_attachment FOR VALUES IN ('eternal_audit');
CREATE TABLE saas.evidence_legal_hold    PARTITION OF saas.evidence_attachment FOR VALUES IN ('legal_hold');

CREATE INDEX evidence_purge_scan_idx ON saas.evidence_attachment(tenant_id, retention_class, pending_purge_at)
  WHERE pending_purge_at IS NOT NULL;
CREATE INDEX evidence_wo_idx ON saas.evidence_attachment(work_order_id) WHERE work_order_id IS NOT NULL;

CREATE TABLE saas.change_request_type_dim (
  code        text PRIMARY KEY,         -- e.g. 'pricing_rule', 'rbac', 'sla', 'template', 'contract_instance', 'cancellation_reason'
  category    text NOT NULL,
  description text
);
INSERT INTO saas.change_request_type_dim(code, category, description) VALUES
  ('pricing_rule', 'finance', '價格 / 取消費 / 退款分層金額'),
  ('rbac',         'rbac',    'RBAC 矩陣'),
  ('sla',          'ops',     'SLA / 接單視窗'),
  ('template',     'content', '訊息 / 報價 / 合約 template'),
  ('contract_instance', 'partner', '合約 instance 變更 (Phase II)'),
  ('cancellation_reason', 'finance', '取消費 reason code 字典');

CREATE TABLE saas.change_request (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       uuid NOT NULL REFERENCES saas.tenant(id),
  type_code       text NOT NULL REFERENCES saas.change_request_type_dim(code),
  state           text NOT NULL DEFAULT 'draft'
                      CHECK (state IN ('draft','pending_approval','approved','rejected','effective','retired')),
  payload_diff    jsonb NOT NULL,
  effective_date  date,
  reason          text,
  created_by      uuid NOT NULL REFERENCES saas.user_account(id),
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);
CREATE TRIGGER cr_touch BEFORE UPDATE ON saas.change_request
  FOR EACH ROW EXECUTE FUNCTION saas.tg_touch_updated_at();
CREATE INDEX cr_state_idx ON saas.change_request(tenant_id, state, created_at DESC);

CREATE TABLE saas.change_request_approval (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  change_request_id  uuid NOT NULL REFERENCES saas.change_request(id),
  approver_user_id   uuid NOT NULL REFERENCES saas.user_account(id),
  decision           text NOT NULL CHECK (decision IN ('approve','reject','abstain')),
  decided_at         timestamptz NOT NULL DEFAULT now(),
  rationale          text
);
CREATE INDEX cra_cr_idx ON saas.change_request_approval(change_request_id);

-- -----------------------------------------------------------------------------
-- 8. Settlement light (Phase I — full M12 in Phase II)
-- -----------------------------------------------------------------------------
CREATE TABLE saas.payment (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     uuid NOT NULL REFERENCES saas.tenant(id),
  work_order_id uuid NOT NULL,
  method        text NOT NULL CHECK (method IN ('onsite_cash','link','bank_transfer')),
  amount        numeric(12,2) NOT NULL CHECK (amount > 0),
  state         text NOT NULL DEFAULT 'pending' CHECK (state IN ('pending','paid','failed')),
  evidence_id   text,                                     -- FK to evidence_attachment.sha256 (cross-partition)
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);
CREATE TRIGGER payment_touch BEFORE UPDATE ON saas.payment
  FOR EACH ROW EXECUTE FUNCTION saas.tg_touch_updated_at();
CREATE INDEX payment_wo_idx ON saas.payment(work_order_id);

-- journal_entry — append-only ledger; partitioned by created_at monthly
CREATE TABLE saas.journal_entry (
  id            bigserial NOT NULL,
  tenant_id     uuid NOT NULL,
  ledger_type   text NOT NULL CHECK (ledger_type IN (
                  'customer_ar','tech_ap','cash_collection','brand_settle',
                  'dispatcher_commission','refund','invoice_tax')),
  dr_account    text NOT NULL,
  cr_account    text NOT NULL,
  amount        numeric(12,2) NOT NULL,
  source_kind   text NOT NULL CHECK (source_kind IN ('work_order','cancellation','refund','voucher','payment','manual')),
  source_id     uuid NOT NULL,
  prev_hash     text,
  entry_hash    text NOT NULL,
  created_at    timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (id, created_at)
) PARTITION BY RANGE (created_at);

CREATE TABLE saas.journal_entry_y2026m05 PARTITION OF saas.journal_entry
  FOR VALUES FROM ('2026-05-01') TO ('2026-06-01');
CREATE TABLE saas.journal_entry_y2026m06 PARTITION OF saas.journal_entry
  FOR VALUES FROM ('2026-06-01') TO ('2026-07-01');
CREATE TABLE saas.journal_entry_y2026m07 PARTITION OF saas.journal_entry
  FOR VALUES FROM ('2026-07-01') TO ('2026-08-01');

CREATE INDEX je_source_idx ON saas.journal_entry(source_kind, source_id);
CREATE INDEX je_ledger_idx ON saas.journal_entry(tenant_id, ledger_type, created_at);

-- Append-only enforcement
CREATE TRIGGER je_no_update BEFORE UPDATE ON saas.journal_entry
  FOR EACH ROW EXECUTE FUNCTION saas.tg_block_mutation();
CREATE TRIGGER je_no_delete BEFORE DELETE ON saas.journal_entry
  FOR EACH ROW EXECUTE FUNCTION saas.tg_block_mutation();

-- -----------------------------------------------------------------------------
-- 9. Config governance (ADR-0067) — 4 tables
-- -----------------------------------------------------------------------------
CREATE TABLE saas.config_namespace (
  code             text PRIMARY KEY,                       -- 'pricing', 'cancellation_reason_codes', 'sla'
  description      text,
  json_schema      jsonb NOT NULL,                        -- pre-flight validation (ADR-0067 §1)
  owner_role_codes text[] NOT NULL DEFAULT '{}'
);

CREATE TABLE saas.config_version (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id           uuid REFERENCES saas.tenant(id),    -- nullable for global config
  namespace           text NOT NULL REFERENCES saas.config_namespace(code),
  key                 text NOT NULL,
  value               jsonb NOT NULL,
  state               text NOT NULL DEFAULT 'draft'
                          CHECK (state IN ('draft','rolling_out','active','retired','rolled_back')),
  parent_version_id   uuid REFERENCES saas.config_version(id),
  created_by          uuid NOT NULL,
  created_at          timestamptz NOT NULL DEFAULT now(),
  activated_at        timestamptz
);
-- At most one active version per (tenant, namespace, key)
CREATE UNIQUE INDEX config_one_active
  ON saas.config_version(tenant_id, namespace, key)
  WHERE state = 'active';
CREATE INDEX config_lookup_idx
  ON saas.config_version(tenant_id, namespace, key, state)
  INCLUDE (value);

CREATE TABLE saas.config_rollout (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  config_version_id  uuid NOT NULL REFERENCES saas.config_version(id),
  strategy           text NOT NULL CHECK (strategy IN ('canary_5_50_100','instant')),
  current_stage      text NOT NULL CHECK (current_stage IN ('5%','50%','100%','rolled_back')),
  stage_started_at   timestamptz NOT NULL DEFAULT now(),
  next_stage_eta     timestamptz,
  initiator_user_id  uuid NOT NULL,
  approver_user_id   uuid NOT NULL,
  CHECK (initiator_user_id <> approver_user_id)
);

CREATE TABLE saas.config_audit (
  id                bigserial PRIMARY KEY,
  tenant_id         uuid,
  config_version_id uuid NOT NULL REFERENCES saas.config_version(id),
  actor_user_id     uuid NOT NULL,
  action            text NOT NULL CHECK (action IN ('draft_created','rollout_started','stage_advanced','rolled_back','activated','retired')),
  diff              jsonb,
  ts                timestamptz NOT NULL DEFAULT now()
);
-- Append-only
CREATE TRIGGER config_audit_no_update BEFORE UPDATE ON saas.config_audit
  FOR EACH ROW EXECUTE FUNCTION saas.tg_block_mutation();
CREATE TRIGGER config_audit_no_delete BEFORE DELETE ON saas.config_audit
  FOR EACH ROW EXECUTE FUNCTION saas.tg_block_mutation();

-- Seed config namespaces (subset — full set per Phase I admin onboarding)
INSERT INTO saas.config_namespace(code, description, json_schema) VALUES
  ('cancellation_reason_codes', '取消費 reason code 字典 (ADR-0102)',
   '{"type":"object","required":["code","label_zh","applies_to"],"properties":{"code":{"type":"string"},"label_zh":{"type":"string"},"applies_to":{"type":"array","items":{"type":"string","enum":["customer","customer_service","technician","system_auto"]}}}}'::jsonb),
  ('cancellation_fee_tiers', '取消費 6 階段金額表 (S1/S1_5/S2/S3/S4/S5)',
   '{"type":"object"}'::jsonb),
  ('refund_tier_thresholds', '退款 5 tier 金額門檻 (ADR-0040 v2)',
   '{"type":"object","properties":{"L1_max":{"type":"number"},"L2_max":{"type":"number"},"L3_max":{"type":"number"},"L4_max":{"type":"number"}}}'::jsonb),
  ('sla_dispatch', '接單 SLA (一般 10 分 / 急件 5 分)',
   '{"type":"object","properties":{"normal_min":{"type":"integer"},"urgent_min":{"type":"integer"}}}'::jsonb),
  ('travel_fee_distance_tiers', '車馬費距離級距 (ADR-0041)',
   '{"type":"object"}'::jsonb),
  ('technician_suspension_reasons', '師傅停權 reason 字典',
   '{"type":"object"}'::jsonb);

-- -----------------------------------------------------------------------------
-- 10. Audit event (cross-cutting) — partitioned by ts monthly
-- -----------------------------------------------------------------------------
CREATE TABLE saas.audit_event (
  id              uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id       uuid NOT NULL,
  event_type      text NOT NULL,
  actor_user_id   uuid,
  actor_role      text,
  source_kind     text,
  source_id       uuid,
  diff_ref        text,                              -- S3 / GCS URI (PII masked server-side)
  trace_id        text,
  ts              timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (id, ts)
) PARTITION BY RANGE (ts);

CREATE TABLE saas.audit_event_y2026m05 PARTITION OF saas.audit_event
  FOR VALUES FROM ('2026-05-01') TO ('2026-06-01');
CREATE TABLE saas.audit_event_y2026m06 PARTITION OF saas.audit_event
  FOR VALUES FROM ('2026-06-01') TO ('2026-07-01');
CREATE TABLE saas.audit_event_y2026m07 PARTITION OF saas.audit_event
  FOR VALUES FROM ('2026-07-01') TO ('2026-08-01');

CREATE INDEX audit_actor_idx ON saas.audit_event(tenant_id, actor_user_id, ts DESC);
CREATE INDEX audit_type_idx  ON saas.audit_event(tenant_id, event_type, ts DESC);
CREATE INDEX audit_source_idx ON saas.audit_event(source_kind, source_id);

-- Append-only
CREATE TRIGGER audit_no_update BEFORE UPDATE ON saas.audit_event
  FOR EACH ROW EXECUTE FUNCTION saas.tg_block_mutation();
CREATE TRIGGER audit_no_delete BEFORE DELETE ON saas.audit_event
  FOR EACH ROW EXECUTE FUNCTION saas.tg_block_mutation();

COMMIT;

-- =============================================================================
-- POST-MIGRATION NOTES
-- =============================================================================
-- 1. RLS policies are created in **migration 003** (after dogfood verification).
--    Sample:
--      CREATE POLICY tenant_isolation ON saas.<table>
--        USING (tenant_id = current_setting('app.tenant_id', true)::uuid);
--      ALTER TABLE saas.<table> ENABLE ROW LEVEL SECURITY;
--
-- 2. ACL GRANT/REVOKE for config tables done in **migration 002**:
--      REVOKE SELECT ON saas.config_version, saas.config_rollout, saas.config_audit
--        FROM app_role, cron_role;
--      GRANT SELECT ON saas.config_version, saas.config_rollout, saas.config_audit
--        TO m18_admin_role, m18_acl_reader_role;
--
-- 3. Partition rollover (pg_partman) onboarded in **migration 004**. Pre-created
--    3 months of partitions in this init for cold-start.
--
-- 4. Backfill strategy for existing tenants: batched
--      DO $$ DECLARE r record; BEGIN
--        FOR r IN SELECT id FROM saas.tenant LOOP
--          PERFORM 1; -- backfill per-tenant default config_version, RBAC seed
--        END LOOP;
--      END $$;
--    Run during off-peak window with `LIMIT 10000` + `pg_sleep(0.1)`.
--
-- =============================================================================
-- ROLLBACK (forward migration only; run if init fails mid-way)
-- =============================================================================
-- BEGIN;
--   DROP SCHEMA saas CASCADE;
--   DROP ROLE IF EXISTS app_role, cron_role, dgs_role, m18_admin_role, m18_acl_reader_role;
-- COMMIT;
-- =============================================================================
-- PII column inventory (DPO reference)
-- =============================================================================
-- saas.customer.phone_enc, saas.customer.name_enc
-- saas.site.address_enc
-- saas.user_account.email_enc
-- saas.message.text                      (read-time mask via attr_mask)
-- saas.evidence_attachment.storage_uri   (blob — DEK at rest)
-- saas.audit_event.diff_ref              (server-side PII redaction before persist)
-- =============================================================================
-- Retention cross-ref (ADR-0051)
-- =============================================================================
-- saas.evidence_attachment.retention_class:
--   default_1y    → 1y hot PG
--   rma_3y        → 3y hot PG (cold S3 after 1y)
--   eternal_audit → indefinite hot PG (audit_event, journal_entry mirror)
--   legal_hold    → indefinite, column flag, clear via ADR change only
--
-- saas.audit_event / saas.journal_entry / saas.config_audit → ≥ 7y (ADR-VCH-002)
-- =============================================================================
