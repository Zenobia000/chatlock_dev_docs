# BR-PII-001 — PII Governance Decision Tree (OPA Rego)
#
# Version: v1.0.0
# Authority: @legal + @dpo (CODEOWNERS) + devteam-arch (technical)
# Status: draft — pending legal CODEOWNER sign
# Source: Forum F-04 final-report + ADR-0061
#
# Compliance binding（合約 / 法規 / 內控條文引用）:
#   - 合約 V21 §4.4(d) 家族覆核紀錄：legal-hold 永久且不可逆
#   - GDPR Art.17（被遺忘權）: 7d 完成清除 OR 7d 內 customer notice + 解除預計時間（Art.12(3)）
#   - 個資法 §11（資料當事人權利）: retention default 不得超過必要期間（1y / RMA+3y / eternal）
#   - 個資法 §27（資料安全維護）: read 路徑 visibility filter，fail-closed
#   - 個資法 §12（資料外洩通報）: read-side access log 須可查
#
# Authority matrix（誰可以做什麼）:
#   - data_subject: 提 GDPR forget request
#   - dpo: 執行 forget purge；legal-hold flip release（需 ADR change）
#   - legal: legal-hold flip set（單向，不可逆）
#   - auditor: 唯讀 evidence + audit log（含 flagged item）
#   - dgs_executor (system role): 唯一可呼叫 purge / DELETE 的角色
#   - cron (system role): 僅可 scan candidates，不可 DELETE
#
# Priority (high to low) — 依合規嚴重度排列:
#   1. BR-PII-001a legal-hold 永久且不可逆（合約紅線 §4.4(d)）
#   2. BR-PII-001b GDPR forget 7d，例外：legal-hold 時拒絕並 customer notice（GDPR Art.17 + Art.12(3)）
#   3. BR-PII-001c retention default (1y / RMA+3y / eternal)（個資法 §11）
#   4. BR-PII-001d visibility filter on read path, fail-closed（個資法 §27）
#
# Edge cases / exception handling:
#   - GDPR forget × legal-hold 衝突: 拒絕清除，發 customer_notice 7d 內 + 預計 unlock 日期
#   - Cross-tenant 嘗試: 一律 deny（ADR-0030 propagation invariant；不可 override）
#   - Auditor / legal 看 flagged item: 允許（authority 大於 visibility filter）
#   - DGS down 期間: cron 自動 pause（不允許繞過 audit）

package datagovernance.pii

import future.keywords.if
import future.keywords.in

# -------- Default deny (fail-closed for mutation) --------

default allow_mutation := false
default allow_read := false

# -------- BR-PII-001a: Legal hold (highest priority) --------

# Legal hold blocks ALL mutation (purge, forget, anything that touches PII)
deny_mutation_reason["legal_hold_active"] if {
    input.action in ["purge", "forget", "delete", "anonymize"]
    input.evidence.legal_hold == true
}

# Legal hold also blocks read for non-authorized actors
deny_read_reason["legal_hold_unauthorized_read"] if {
    input.evidence.legal_hold == true
    not actor_authorized_for_legal_hold(input.actor.role)
}

actor_authorized_for_legal_hold(role) if role == "auditor"
actor_authorized_for_legal_hold(role) if role == "legal"
actor_authorized_for_legal_hold(role) if role == "dpo"

# -------- BR-PII-001b: GDPR forget --------

allow_mutation if {
    input.action == "forget"
    input.evidence.legal_hold == false
    input.actor.role in ["dpo", "data_subject"]
}

# GDPR forget customer notice required if legal hold blocks it
require_customer_notice if {
    input.action == "forget"
    input.evidence.legal_hold == true
}

customer_notice := {
    "deadline_days": 7,
    "reason": "legal_hold_active",
    "expected_unlock_date": input.evidence.legal_hold_expected_release,
} if require_customer_notice

# -------- BR-PII-001c: Retention default --------

# Retention class -> cron-eligible
retention_eligible_for_purge if {
    input.action == "purge"
    input.evidence.legal_hold == false
    input.evidence.retention_class != "eternal"
    time.now_ns() / 1000000000 > input.evidence.retention_until_unix
}

allow_mutation if {
    input.action == "purge"
    input.actor.role == "dgs_executor"
    retention_eligible_for_purge
}

# -------- BR-PII-001d: Visibility filter (read path, fail-closed) --------

allow_read if {
    input.evidence.legal_hold == false
    input.evidence.purged_at == null
    visibility_match(input.actor, input.evidence)
}

# Visibility matrix from ADR-0050 (4-tier RBAC × case lifecycle × scope)
visibility_match(actor, evidence) if {
    actor.tenant_id == evidence.tenant_id
    actor.role in evidence.visibility_rule.allowed_roles
    within_lifecycle_window(actor, evidence)
}

# Different roles see different time windows
within_lifecycle_window(actor, evidence) if {
    actor.role == "customer"
    evidence.lifecycle_days <= 90
}

within_lifecycle_window(actor, evidence) if {
    actor.role == "locksmith"
    evidence.lifecycle_days <= 30
    evidence.assigned_locksmith_id == actor.id
}

within_lifecycle_window(actor, evidence) if {
    actor.role in ["accounting", "auditor", "supervisor", "family_reviewer"]
    # eternal access
}

# -------- Cross-tenant isolation (ADR-0030) --------

deny_read_reason["cross_tenant"] if {
    input.actor.tenant_id != input.evidence.tenant_id
    not input.actor.role in ["auditor", "platform_admin"]
}

deny_mutation_reason["cross_tenant_write"] if {
    input.actor.tenant_id != input.evidence.tenant_id
}

# -------- Audit decision (every call logs to audit stream) --------

decision_log := {
    "timestamp": time.now_ns(),
    "actor_id": input.actor.id,
    "actor_role": input.actor.role,
    "tenant_id": input.actor.tenant_id,
    "evidence_id": input.evidence.id,
    "evidence_tenant_id": input.evidence.tenant_id,
    "action": input.action,
    "decision": decision_outcome,
    "policy_version_id": "v1.0.0",
    "denial_reasons": deny_reasons,
    "customer_notice": customer_notice,
}

decision_outcome := "allow" if {
    input.action in ["purge", "forget", "delete", "anonymize"]
    allow_mutation
}

decision_outcome := "allow" if {
    input.action == "read"
    allow_read
}

decision_outcome := "deny" if not allow_mutation
decision_outcome := "deny" if not allow_read

deny_reasons := concat(", ", [reason | deny_mutation_reason[reason]] | [reason | deny_read_reason[reason]])
