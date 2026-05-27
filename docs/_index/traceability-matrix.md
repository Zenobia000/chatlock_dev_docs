---
id: traceability-matrix
title: FR ↔ BR ↔ ADR Traceability Matrix (auto-generated)
last_generated: 2026-05-28
generated_by: tools/traceability_matrix.py
source_specs:
  - docs/_source/01-workorder-erp.md
  - docs/_source/02-ai-chatbot-sync.md
---

# Traceability Matrix (auto-generated)

> 自動生成自 `tools/traceability_matrix.py`，請勿手改。
> Last generated: **2026-05-28**
> 改 frontmatter 後重跑此 script 即可刷新。

---

## §1 Coverage Dashboard

| 指標 | 計數 | 健康 |
|:-----|:-----|:-----|
| Total FR | 53 | — |
| Total BR | 122 | — |
| Total ADR | 75 | — |
| FR status: active | 51 | — |
| FR status: superseded | 2 | ✅ tracked |
| FR with empty `mapped_to` (orphan) | 0 | ✅ |
| ADR migration_status: STILL_VALID | 50 | ✅ |
| ADR migration_status: HISTORICAL | 14 | ✅ |
| ADR migration_status: REVIEW_REQUIRED | 0 | 🟡 awaiting A2.4 critique |
| ADR migration_status: PARTIAL_UPDATE | 1 | 🟢 Lane A done, 6 dim cascade pending |
| ADR not yet classified (incl. new post-2026-05-28 ADRs) | 10 | 🟡 |

---

## §2 FR → mapped_to / events / status

| FR ID | Title | Status | mapped_to | superseded_clauses | emits_events | NFR-flavored |
|:------|:------|:-------|:----------|:-------------------|:-------------|:-------------|
| [FR-0001](docs/analysis/fr/FR-0001-line-intake.md) | LINE 客服報修受理（圖片 + 文字 + 對話） | active | M01, A01, M16 | BR-M01-01, BR-M01-02, BR-A01-01 | InquiryReceived, ConversationStarted, UrgencyDetected | - |
| [FR-0002](docs/analysis/fr/FR-0002-problem-card-triage.md) | ProblemCard 智能分診 | active | M03, A06, A03 | BR-M03-01, BR-M03-02, BR-M03-NN, BR-M03-NN, BR-A06-01 | ProblemCardDrafted, ProblemCardConfirmed, AiResponded, HumanHandoffTriggered | - |
| [FR-0003](docs/analysis/fr/FR-0003-auto-dispatch.md) | 自動派工演算法（規則引擎） | active | M06, M07, M08 | BR-M06-01, BR-M06-02, BR-M06-NN, BR-M06-NN, BR-M06-NN, BR-M06-NN | DispatchProposed, DispatchPending, DispatchAutoReassigned | - |
| [FR-0004](docs/analysis/fr/FR-0004-manual-dispatch-audit.md) | 手動派工 + audit log | active | M06, M17, M15 | BR-M06-NN, BR-M17-01, BR-M17-NN, BR-M17-NN | ManualDispatchAssigned, AuditLogWritten, DispatchOverridden | - |
| [FR-0005](docs/analysis/fr/FR-0005-technician-accept.md) | 技師接單與出發回報 | active | M07, M06 | BR-M06-NN, BR-M07-NN, BR-M07-NN | DispatchAccepted, DispatchDeclined, TechnicianDeparted | - |
| [FR-0006](docs/analysis/fr/FR-0006-onsite-photo.md) | 到場拍照存證 | active | M08, M09 | BR-M08-NN, BR-M09-01, BR-M09-NN, BR-M09-NN, BR-M09-NN | EvidenceUploaded, ArrivalProofRecorded | - |
| [FR-0007](docs/analysis/fr/FR-0007-material-request.md) | 材料申請與庫存扣減 | active | M10, M08 | BR-M10-NN, BR-M10-NN, BR-M10-NN, BR-M10-NN | MaterialRequested, MaterialConsumed, InventoryBelowReorderPoint, MaterialReturned | - |
| [FR-0008](docs/analysis/fr/FR-0008-scope-change.md) | Scope Change 流程（增項 / 改價） | active | M15, M17, M16, M08 | BR-M15-01, BR-M15-NN, BR-M15-NN, BR-M08-NN, BR-M17-NN | ChangeRequestSubmitted, ChangeRequestApproved, ChangeRequestRejected, WorkOrderPaused | - |
| [FR-0009](docs/analysis/fr/FR-0009-completion-sign.md) | 完工簽名 + 雙方確認 | active | M08, M09, M16 | BR-M08-NN, BR-M08-NN, BR-M09-NN, BR-M08-NN | WorkOrderCompleted, CustomerConfirmedCompletion, AutoConfirmedAfterTimeout | - |
| [FR-0010](docs/analysis/fr/FR-0010-reschedule-delay.md) | 改約 / 延遲通知 / 取消（V1.0 LINE only） | active | M06, M07, M11, M15, M16 | BR-M06-NN, BR-M07-NN, BR-CANCEL-001, BR-CANCEL-002, BR-CANCEL-003, BR-CANCEL-004, BR-CANCEL-005, BR-CANCEL-006, BR-CANCEL-007, BR-CANCEL-008, BR-M16-NN | WorkOrderRescheduled, WorkOrderDelayed, WorkOrderCancelled, TechnicianInitiatedCancel, TechnicianPenaltyApplied, WorkOrderRescheduleRejected | - |
| [FR-0011](docs/analysis/fr/FR-0011-consumer-payment.md) | 消費者付款（V1.0 升級！） | draft | M11, M08, M17 | BR-M11-NN, BR-M11-NN, BR-M11-NN, BR-M11-NN, BR-M11-NN | PaymentReceived, PaymentFailed, PaymentDisputed, VoucherIssued | - |
| [FR-0012](docs/analysis/fr/FR-0012-monthly-settlement.md) | 技師月結撥款（V1.0 升級！） | draft | M11, M12, M17 | BR-M12-NN, BR-M12-NN, BR-M12-NN, BR-M12-NN, BR-M12-NN | SettlementCalculated, SettlementPayoutInitiated, SettlementPayoutFailed | - |
| [FR-0013](docs/analysis/fr/FR-0013-dual-sign-dispute.md) | 對帳爭議雙簽 | active | M15, M17 | BR-M15-NN, BR-M15-NN, BR-M15-NN, BR-M15-NN, BR-M15-NN | DisputeOpened, DisputeApprovedBySingleParty, DisputeClosed, DisputeEscalated | - |
| [FR-0014](docs/analysis/fr/FR-0014-refund.md) | 退款流程（5-tier + SoD 三維） | active | M11, M15, M17 | BR-REFUND-001, BR-REFUND-002, BR-REFUND-003, BR-REFUND-004, BR-REFUND-005, BR-REFUND-006 | RefundRequested, RefundApproved, RefundRejected, RefundExecuted, RefundNotificationFailed | - |
| [FR-0015](docs/analysis/fr/FR-0015-warranty-claim.md) | 保固申訴受理（3-mode start_date + B2B negotiated + Phase II ship_date placeholder + RMA 重算 + Phase I 整機） | active | M13, M15, M02 | BR-WARRANTY-001, BR-WARRANTY-002, BR-WARRANTY-003, BR-WARRANTY-004, BR-WARRANTY-005, BR-WARRANTY-006, BR-WARRANTY-007 | WarrantyClaimSubmitted, WarrantyClaimApproved, WarrantyClaimDenied, WarrantyClaimDisputed, WarrantyB2BOverride, WarrantyRecalculatedAfterRMA | - |
| [FR-0016](docs/analysis/fr/FR-0016-sla-2hr-soft.md) | SLA 2hr 到場（Soft 警報） | ↶ superseded | _(empty)_ | - | - | ⚠️ yes |
| [FR-0017](docs/analysis/fr/FR-0017-sop-draft-review.md) | SOP 草稿審核（AI 自進化） | active | A10, M20, A04 | BR-A10-NN, BR-A10-NN, BR-A10-NN, BR-A10-NN, BR-A04-NN | SopDraftSubmitted, SopDraftApproved, SopDraftRejected, FamilyReviewCompleted, SopPublished | - |
| [FR-0018](docs/analysis/fr/FR-0018-cs-takeover.md) | 客服接管對話（三層解決機制） | active | A07, M16, M03 | BR-A07-01, BR-A07-NN, BR-A07-NN, BR-A07-NN, BR-A07-NN, BR-A07-NN, BR-A07-NN | HumanHandoffTriggered, CsAgentTookOver, WorkOrderCreatedByCs, ConversationResolved, CustomerAcknowledged | - |
| [FR-0019](docs/analysis/fr/FR-0019-rbac-dynamic.md) | 動態 RBAC 角色管理 | draft | M17, M18 | BR-M17-NN, BR-M17-NN, BR-M17-NN | RoleAssigned, RoleRevoked, PermissionChanged | - |
| [FR-0020](docs/analysis/fr/FR-0020-audit-log-export.md) | 稽核日誌完整性與匯出 | active | M17 | BR-M17-NN, BR-M17-NN, BR-M17-NN, BR-M17-NN | AuditLogExported, AuditTamperDetected | - |
| [FR-0021](docs/analysis/fr/FR-0021-dashboard-reports.md) | Dashboard / 報表（KPI / Revenue / Tech ranking） | active | M19 | BR-M19-NN, BR-M19-NN, BR-M19-NN | ReportGenerated | - |
| [FR-0022](docs/analysis/fr/FR-0022-consumer-tracking.md) | 消費者端工單追蹤（LINE + Web 並存） | draft | M16, M01 | BR-M16-NN, BR-M16-NN, BR-M16-NN | ConsumerTrackingOpened | - |
| [FR-0023](docs/analysis/fr/FR-0023-error-offline-page.md) | 錯誤頁 / 離線體驗（cross-cutting） | active | cross-cutting | BR-XCUT-NN, BR-XCUT-NN, BR-XCUT-NN | ErrorPageRendered | - |
| [FR-0024](docs/analysis/fr/FR-0024-line-webhook-ha.md) | LINE Webhook 高可用（ack < 200ms） | ↶ superseded | _(empty)_ | - | - | ⚠️ yes |
| [FR-0025](docs/analysis/fr/FR-0025-multimodal-understanding.md) | 對話多模態理解（圖、語音、影片） | active | A08, A03 | BR-A08-01, BR-A08-NN, BR-A08-NN, BR-A08-NN | MediaProcessed, MediaProcessingFailed | - |
| [FR-0026](docs/analysis/fr/FR-0026-chatbot-debounce-merge.md) | Chatbot 進線 Debounce 與訊息合併 | active | A01, M01, M16 | BR-A01-01, BR-A01-02, BR-A01-03, BR-A01-04 | MergedTurnReady, ConversationStarted | - |
| [FR-0027](docs/analysis/fr/FR-0027-brand-profile-resolver.md) | Chatbot 品牌型號與用戶資料 Resolver | active | A02, M02, M10 | BR-A02-01, BR-A02-02, BR-A02-03, BR-A02-04, BR-A02-05 | UserFactsUpdated, UserFactsConflictDetected, DeviceRegistered, CustomerProfileLinked | - |
| [FR-0028](docs/analysis/fr/FR-0028-skill-gated-react-agent.md) | Chatbot Skill-Gated ReAct Agent | active | A03, M20, M17 | BR-A03-01, BR-A03-02, BR-A03-03, BR-A03-04, BR-A03-05 | SkillInvoked, SkillResultReceived, SkillForbidden, ReActLoopExceeded, ReasoningTraceLogged | - |
| [FR-0029](docs/analysis/fr/FR-0029-skill-knowledge-base.md) | SKILL 知識庫 (SKILL.md + RAG) | active | A04, M20 | BR-A04-01, BR-A04-02, BR-A04-NN, BR-A04-NN | SkillLoaded, RagQueryExecuted | - |
| [FR-0030](docs/analysis/fr/FR-0030-guardrails-output-validator.md) | Chatbot Guardrails & Output Validator | active | A05, M20, M15 | BR-A05-01, BR-A05-02, BR-A05-03, BR-A05-04, BR-A05-05, BR-A05-06, BR-A05-07 | GuardrailViolationDetected, GuardrailRegenSucceeded, GuardrailBlocked, PromptInjectionAttempted | - |
| [FR-0031](docs/analysis/fr/FR-0031-problemcard-bridge.md) | ProblemCard Bridge — 自動建立問題卡（A06 → Admin API） | active | A06, M03 | BR-A06-01, BR-A06-02, BR-A06-NN, BR-A06-NN | ProblemCardCreatedByA06, ProblemCardSyncFailed | - |
| [FR-0032](docs/analysis/fr/FR-0032-eval-observability.md) | AI Eval / 觀測（quality_check + audit + token cost） | active | A09, M19 | BR-A09-01, BR-A09-02, BR-A09-NN, BR-A09-NN | EvalRunStarted, EvalRunCompleted, EvalRegression | - |
| [FR-0033](docs/analysis/fr/FR-0033-deploy-health.md) | Chatbot 部署 / 健康檢查 (Cloud Run + health) | active | A11 | BR-A11-01, BR-A11-02, BR-A11-NN, BR-A11-NN | HealthCheckFailed, DbReconnected | - |
| [FR-0034](docs/analysis/fr/FR-0034-ai-employee-charter.md) | AI Employee Charter / PRD 治理（Phase II） | draft | A12, M20 | BR-A12-01, BR-A12-02, BR-A12-NN | CharterUpdated, GovernanceGateApproved | - |
| [FR-0035](docs/analysis/fr/FR-0035-sync-intake-capture.md) | Sync — Intake 資料捕捉（LINE/user turn → 結構化） | active | S-M01, M01 | BR-S-M01-01, BR-S-M01-02, BR-S-M01-NN | IntakeCaptured, IntakeSyncFailed | - |
| [FR-0036](docs/analysis/fr/FR-0036-sync-facts-master.md) | Sync — Facts 主檔同步（phone/address/device → ERP） | active | S-M02, M02, M17 | BR-S-M02-01, BR-S-M02-02, BR-S-M02-NN, BR-S-M02-NN | FactsSynced, FactsConflictDetected | - |
| [FR-0037](docs/analysis/fr/FR-0037-sync-pc-convert.md) | Sync — ProblemCard 轉換（chatbot ↔ ERP） | active | S-M03, M03, A06 | BR-S-M03-01, BR-S-M03-02, BR-S-M03-NN | ProblemCardSynced, ProblemCardSyncRejected | - |
| [FR-0038](docs/analysis/fr/FR-0038-sync-convert-to-wo.md) | Sync — confirmed ProblemCard 轉 WorkOrder（強制 human gate） | active | S-M04, M03, M05 | BR-S-M04-01, BR-S-M04-02, BR-S-M04-NN, BR-S-M04-NN | WorkOrderConverted, ConvertGateRejected | - |
| [FR-0039](docs/analysis/fr/FR-0039-sync-dispatch.md) | Sync — Dispatch 同步（WO created → 派工 queue） | active | S-M05, M06 | BR-S-M05-01, BR-S-M05-02, BR-S-M05-NN | DispatchQueued, DispatchSyncFailed | - |
| [FR-0040](docs/analysis/fr/FR-0040-sync-evidence-writeback.md) | Sync — Evidence 回寫（photo / sign / completion / payment） | active | S-M06, M09, M08 | BR-S-M06-01, BR-S-M06-02, BR-S-M06-NN | EvidenceWrittenBack, EvidenceWritebackFailed | - |
| [FR-0041](docs/analysis/fr/FR-0041-customer-site-device-master.md) | Customer / Site / Device Master 維護 | active | M02, M14 | BR-M02-01, BR-M02-02, BR-M02-03 | CustomerCreated, CustomerMerged, SiteCreated, DeviceRegistered, DeviceWarrantyUpdated | - |
| [FR-0042](docs/analysis/fr/FR-0042-quote-internal-vs-external-view.md) | Quote 內外部視圖（客戶實收 vs 內部成本） | active | M04, M11, M17 | BR-M04-01, BR-M04-02, BR-M04-03, BR-M04-04, BR-M04-05 | QuoteCreated, QuoteApproved, QuoteRejected, QuoteExpired | - |
| [FR-0043](docs/analysis/fr/FR-0043-m18-admin-config-workflow.md) | M18 Admin Config Workflow（user-maintained runtime config） | active | M18, M17 | BR-M18-01, BR-M18-02, BR-M18-03, BR-M18-04, BR-M18-05 | ConfigChangeProposed, ConfigChangeApproved, ConfigChangeRolledOut, ConfigChangeRolledBack, ConfigValidationFailed, ConfigVersionPublished | - |
| [FR-0044](docs/analysis/fr/FR-0044-technician-onboarding-suspension.md) | Technician Onboarding 與停權 | placeholder | M07, M17 | - | - | - |
| [FR-0045](docs/analysis/fr/FR-0045-technician-ap-settlement.md) | Technician AP 月結 | placeholder | M12, M07 | - | - | - |
| [FR-0046](docs/analysis/fr/FR-0046-dispatcher-commission.md) | 派工人 Commission 月結 | placeholder | M12, M06 | - | - | - |
| [FR-0047](docs/analysis/fr/FR-0047-brand-monthly-settlement.md) | 品牌月結 + B2B Settlement | placeholder | M12, M14 | - | - | - |
| [FR-0048](docs/analysis/fr/FR-0048-rma-quality-feedback-loop.md) | RMA 品質回饋迴圈 | placeholder | M13, M20, M07 | - | - | - |
| [FR-0049](docs/analysis/fr/FR-0049-exception-approval-inbox.md) | Exception Approval Inbox（M15 完整深化） | placeholder | M15, M17, M16 | - | - | - |
| [FR-0050](docs/analysis/fr/FR-0050-ai-governance-prd-trace.md) | AI Governance & PRD Traceability（A12） | placeholder | A12, M20 | - | - | - |
| [FR-0051](docs/analysis/fr/FR-0051-sop-feedback-spiral-deep.md) | SOP Feedback Spiral 深化（A10） | placeholder | A10, M20, M13 | - | - | - |
| [FR-0052](docs/analysis/fr/FR-0052-cancellation-fee-tiers-flow.md) | Cancellation Fee 6-Tier Flow（取消費分層 + reason code + 師傅 initiated） | active | M15, M17, M16, M18, M11 | BR-CANCEL-001, BR-CANCEL-002, BR-CANCEL-003, BR-CANCEL-004, BR-CANCEL-005, BR-CANCEL-006, BR-CANCEL-007, BR-CANCEL-008 | WorkOrderCancelled, TechnicianInitiatedCancel, CancellationFeeCharged, CancellationOverrideAudited | - |
| [FR-0053](docs/analysis/fr/FR-0053-dpo-forget-gdpr-flow.md) | DPO Forget / GDPR Right-to-be-Forgotten Flow（cross-cutting） | placeholder | M17, cross-cutting | - | - | - |

---

## §3 By-Module Reverse Index

### (agent

**ADRs**:
- [ADR-0009-agent-admin-bridge-pattern](docs/architecture/adr/ADR-0009-agent-admin-bridge-pattern.md) — ADR-009: Agent ↔ Admin 資料同步機制（Bridge Pattern） (NOT_CLASSIFIED)

### (config

**ADRs**:
- [ADR-0009-agent-admin-bridge-pattern](docs/architecture/adr/ADR-0009-agent-admin-bridge-pattern.md) — ADR-009: Agent ↔ Admin 資料同步機制（Bridge Pattern） (NOT_CLASSIFIED)

### A01

**FRs**:
- [FR-0001](docs/analysis/fr/FR-0001-line-intake.md) — LINE 客服報修受理（圖片 + 文字 + 對話）
- [FR-0026](docs/analysis/fr/FR-0026-chatbot-debounce-merge.md) — Chatbot 進線 Debounce 與訊息合併

**ADRs**:
- [ADR-0004-line-bot-architecture](docs/architecture/adr/ADR-0004-line-bot-architecture.md) — ADR-004: LINE Bot 對話架構設計 (STILL_VALID_UNDER_M01_A01)

### A02

**FRs**:
- [FR-0027](docs/analysis/fr/FR-0027-brand-profile-resolver.md) — Chatbot 品牌型號與用戶資料 Resolver

### A03

**FRs**:
- [FR-0002](docs/analysis/fr/FR-0002-problem-card-triage.md) — ProblemCard 智能分診
- [FR-0025](docs/analysis/fr/FR-0025-multimodal-understanding.md) — 對話多模態理解（圖、語音、影片）
- [FR-0028](docs/analysis/fr/FR-0028-skill-gated-react-agent.md) — Chatbot Skill-Gated ReAct Agent

**ADRs**:
- [ADR-0003-llm-integration-framework](docs/architecture/adr/ADR-0003-llm-integration-framework.md) — ADR-003: 選擇 LangChain 作為 LLM 整合框架 (STILL_VALID_UNDER_M20_A03_A04)
- [ADR-0006-llm-model-selection](docs/architecture/adr/ADR-0006-llm-model-selection.md) — ADR-006: LLM 模型選擇策略 (STILL_VALID_UNDER_M20_A03)
- [ADR-0007-llm-registry-pattern](docs/architecture/adr/ADR-0007-llm-registry-pattern.md) — ADR-007: LLM Registry 形式 — 承認 LiteLLM 字串路由為 dict registry 替代方案 (STILL_VALID_UNDER_M20_A03)
- [ADR-0010-belief-augmented-react](docs/architecture/adr/ADR-0010-belief-augmented-react.md) — ADR-010: Belief-Augmented ReAct（Turn Cycle 實驗） (STILL_VALID_UNDER_A03)
- [ADR-0026-memory-architecture](docs/architecture/adr/ADR-0026-memory-architecture.md) — ADR-0026 — Agent 記憶層分層架構（7 層） (STILL_VALID_UNDER_A03_A04)
- [ADR-0027-model-routing-policy](docs/architecture/adr/ADR-0027-model-routing-policy.md) — ADR-0027 — 模型路由策略 (STILL_VALID_UNDER_M20_A03)
- [ADR-0037-conversation-auto-close](docs/architecture/adr/ADR-0037-conversation-auto-close.md) — ADR-0037 — 對話解決後客戶確認關閉 (STILL_VALID_UNDER_A03_M03)
- [ADR-0054-ai-quote-range-only](docs/architecture/adr/ADR-0054-ai-quote-range-only.md) — ADR-0054 — AI 報價邊界（range only） (STILL_VALID_UNDER_A03_M04)
- [ADR-0055-skill-llm-decoupling-contract](docs/architecture/adr/ADR-0055-skill-llm-decoupling-contract.md) — ADR-0055 — SKILL ↔ LLM 解耦合約 (STILL_VALID_UNDER_A03_A04)

### A04

**FRs**:
- [FR-0017](docs/analysis/fr/FR-0017-sop-draft-review.md) — SOP 草稿審核（AI 自進化）
- [FR-0029](docs/analysis/fr/FR-0029-skill-knowledge-base.md) — SKILL 知識庫 (SKILL.md + RAG)

**ADRs**:
- [ADR-0003-llm-integration-framework](docs/architecture/adr/ADR-0003-llm-integration-framework.md) — ADR-003: 選擇 LangChain 作為 LLM 整合框架 (STILL_VALID_UNDER_M20_A03_A04)
- [ADR-0026-memory-architecture](docs/architecture/adr/ADR-0026-memory-architecture.md) — ADR-0026 — Agent 記憶層分層架構（7 層） (STILL_VALID_UNDER_A03_A04)
- [ADR-0055-skill-llm-decoupling-contract](docs/architecture/adr/ADR-0055-skill-llm-decoupling-contract.md) — ADR-0055 — SKILL ↔ LLM 解耦合約 (STILL_VALID_UNDER_A03_A04)
- [ADR-0057-rag-document-retrieval-not-prompt](docs/architecture/adr/ADR-0057-rag-document-retrieval-not-prompt.md) — ADR-0057 — 合約 / 規則走 RAG 文件檢索，禁寫進 prompt (STILL_VALID_UNDER_A04)
- [ADR-0058-external-knowledge-platform-ingestion-contract](docs/architecture/adr/ADR-0058-external-knowledge-platform-ingestion-contract.md) — ADR-0058 — 外部知識傳承平台 → AI Agent ingestion contract (STILL_VALID_UNDER_A04_M20)

### A05

**FRs**:
- [FR-0030](docs/analysis/fr/FR-0030-guardrails-output-validator.md) — Chatbot Guardrails & Output Validator

**ADRs**:
- [ADR-0029-fail-soft-to-durable-three-pack](docs/architecture/adr/ADR-0029-fail-soft-to-durable-three-pack.md) — ADR-0029: Fail-soft 路徑統一收斂到 Outbox + Audit + Review Queue 三件組 (STILL_VALID_UNDER_A05_cross-cutting)
- [ADR-0047-ai-forbidden-list-as-charter](docs/architecture/adr/ADR-0047-ai-forbidden-list-as-charter.md) — ADR-0047 — AI 禁止決策清單入 charter (STILL_VALID_UNDER_A05_M20)
- [ADR-0063-ai-utterance-boundary](docs/architecture/adr/ADR-0063-ai-utterance-boundary.md) — ADR-0063: AI Quote-related Utterance Boundary (STILL_VALID_UNDER_A05_M20)

### A06

**FRs**:
- [FR-0002](docs/analysis/fr/FR-0002-problem-card-triage.md) — ProblemCard 智能分診
- [FR-0031](docs/analysis/fr/FR-0031-problemcard-bridge.md) — ProblemCard Bridge — 自動建立問題卡（A06 → Admin API）
- [FR-0037](docs/analysis/fr/FR-0037-sync-pc-convert.md) — Sync — ProblemCard 轉換（chatbot ↔ ERP）

### A07

**FRs**:
- [FR-0018](docs/analysis/fr/FR-0018-cs-takeover.md) — 客服接管對話（三層解決機制）

**ADRs**:
- [ADR-0048-ai-human-handoff-rules](docs/architecture/adr/ADR-0048-ai-human-handoff-rules.md) — ADR-0048 — AI 轉真人 7 條件 (STILL_VALID_UNDER_A07_M16)

### A08

**FRs**:
- [FR-0025](docs/analysis/fr/FR-0025-multimodal-understanding.md) — 對話多模態理解（圖、語音、影片）

### A09

**FRs**:
- [FR-0032](docs/analysis/fr/FR-0032-eval-observability.md) — AI Eval / 觀測（quality_check + audit + token cost）

### A10

**FRs**:
- [FR-0017](docs/analysis/fr/FR-0017-sop-draft-review.md) — SOP 草稿審核（AI 自進化）
- [FR-0051](docs/analysis/fr/FR-0051-sop-feedback-spiral-deep.md) — SOP Feedback Spiral 深化（A10）

**ADRs**:
- [ADR-0038-ai-feedback-review-policy](docs/architecture/adr/ADR-0038-ai-feedback-review-policy.md) — ADR-0038 — AI feedback / SOP 審核機制 (STILL_VALID_UNDER_M20_A10)

### A11

**FRs**:
- [FR-0033](docs/analysis/fr/FR-0033-deploy-health.md) — Chatbot 部署 / 健康檢查 (Cloud Run + health)

**ADRs**:
- [ADR-0009-agent-admin-bridge-pattern](docs/architecture/adr/ADR-0009-agent-admin-bridge-pattern.md) — ADR-009: Agent ↔ Admin 資料同步機制（Bridge Pattern） (NOT_CLASSIFIED)

### A12

**FRs**:
- [FR-0034](docs/analysis/fr/FR-0034-ai-employee-charter.md) — AI Employee Charter / PRD 治理（Phase II）
- [FR-0050](docs/analysis/fr/FR-0050-ai-governance-prd-trace.md) — AI Governance & PRD Traceability（A12）

**ADRs**:
- [ADR-0028-ai-employee-charter](docs/architecture/adr/ADR-0028-ai-employee-charter.md) — ADR-0028 — AI 鎖匠客服助理 Employee Charter (STILL_VALID_UNDER_M20_A12)

### M01

**FRs**:
- [FR-0001](docs/analysis/fr/FR-0001-line-intake.md) — LINE 客服報修受理（圖片 + 文字 + 對話）
- [FR-0022](docs/analysis/fr/FR-0022-consumer-tracking.md) — 消費者端工單追蹤（LINE + Web 並存）
- [FR-0026](docs/analysis/fr/FR-0026-chatbot-debounce-merge.md) — Chatbot 進線 Debounce 與訊息合併
- [FR-0035](docs/analysis/fr/FR-0035-sync-intake-capture.md) — Sync — Intake 資料捕捉（LINE/user turn → 結構化）

**ADRs**:
- [ADR-0004-line-bot-architecture](docs/architecture/adr/ADR-0004-line-bot-architecture.md) — ADR-004: LINE Bot 對話架構設計 (STILL_VALID_UNDER_M01_A01)
- [ADR-0032-missing-address-policy](docs/architecture/adr/ADR-0032-missing-address-policy.md) — ADR-0032 — 缺地址時的處理規則 (STILL_VALID_UNDER_M01_M02)

### M02

**FRs**:
- [FR-0015](docs/analysis/fr/FR-0015-warranty-claim.md) — 保固申訴受理（3-mode start_date + B2B negotiated + Phase II ship_date placeholder + RMA 重算 + Phase I 整機）
- [FR-0027](docs/analysis/fr/FR-0027-brand-profile-resolver.md) — Chatbot 品牌型號與用戶資料 Resolver
- [FR-0036](docs/analysis/fr/FR-0036-sync-facts-master.md) — Sync — Facts 主檔同步（phone/address/device → ERP）
- [FR-0041](docs/analysis/fr/FR-0041-customer-site-device-master.md) — Customer / Site / Device Master 維護

**ADRs**:
- [ADR-0032-missing-address-policy](docs/architecture/adr/ADR-0032-missing-address-policy.md) — ADR-0032 — 缺地址時的處理規則 (STILL_VALID_UNDER_M01_M02)
- [ADR-PII-002-data-minimization-schema-ci-double-defense](docs/architecture/adr/ADR-PII-002-data-minimization-schema-ci-double-defense.md) — ADR-PII-002: 資料極小化雙層防線 (STILL_VALID_UNDER_M17_M02_cross-cutting)

### M03

**FRs**:
- [FR-0002](docs/analysis/fr/FR-0002-problem-card-triage.md) — ProblemCard 智能分診
- [FR-0018](docs/analysis/fr/FR-0018-cs-takeover.md) — 客服接管對話（三層解決機制）
- [FR-0031](docs/analysis/fr/FR-0031-problemcard-bridge.md) — ProblemCard Bridge — 自動建立問題卡（A06 → Admin API）
- [FR-0037](docs/analysis/fr/FR-0037-sync-pc-convert.md) — Sync — ProblemCard 轉換（chatbot ↔ ERP）
- [FR-0038](docs/analysis/fr/FR-0038-sync-convert-to-wo.md) — Sync — confirmed ProblemCard 轉 WorkOrder（強制 human gate）

**ADRs**:
- [ADR-0031-ai-auto-convert-to-work-order](docs/architecture/adr/ADR-0031-ai-auto-convert-to-work-order.md) — ADR-0031 — AI 是否可自動 `convert_to_work_order` (STILL_VALID_UNDER_M03_S-M04)
- [ADR-0033-problem-card-completeness-gate](docs/architecture/adr/ADR-0033-problem-card-completeness-gate.md) — ADR-0033 — ProblemCard completeness score 是否控制派工 (STILL_VALID_UNDER_M03)
- [ADR-0034-urgent-red-code-definition](docs/architecture/adr/ADR-0034-urgent-red-code-definition.md) — ADR-0034 — urgent / Red Code 定義 (STILL_VALID_UNDER_M03_M15)
- [ADR-0036-multi-problem-card-rule](docs/architecture/adr/ADR-0036-multi-problem-card-rule.md) — ADR-0036 — 同 conversation 多 ProblemCard 規則 (STILL_VALID_UNDER_M03)
- [ADR-0037-conversation-auto-close](docs/architecture/adr/ADR-0037-conversation-auto-close.md) — ADR-0037 — 對話解決後客戶確認關閉 (STILL_VALID_UNDER_A03_M03)

### M04

**FRs**:
- [FR-0042](docs/analysis/fr/FR-0042-quote-internal-vs-external-view.md) — Quote 內外部視圖（客戶實收 vs 內部成本）

**ADRs**:
- [ADR-0035-warranty-project-quote-policy](docs/architecture/adr/ADR-0035-warranty-project-quote-policy.md) — ADR-0035 — 保固 / 建案案件 AI 報價邊界 (STILL_VALID_UNDER_M04_M13)
- [ADR-0054-ai-quote-range-only](docs/architecture/adr/ADR-0054-ai-quote-range-only.md) — ADR-0054 — AI 報價邊界（range only） (STILL_VALID_UNDER_A03_M04)
- [ADR-0062-pricing-engine-bounded-context](docs/architecture/adr/ADR-0062-pricing-engine-bounded-context.md) — ADR-0062: Pricing Engine V2 Bounded Context (STILL_VALID_UNDER_M04)
- [ADR-0064-quote-pricing-snapshot-hash-chain](docs/architecture/adr/ADR-0064-quote-pricing-snapshot-hash-chain.md) — ADR-0064: Quote Pricing Snapshot Hash Chain（獨立鏈） (STILL_VALID_UNDER_M04_M11)
- [ADR-0066-quote-workorder-lifecycle-binding](docs/architecture/adr/ADR-0066-quote-workorder-lifecycle-binding.md) — ADR-0066: Quote ↔ WorkOrder Lifecycle Hard Binding（with Emergency Carve-out） (STILL_VALID_UNDER_M04_M05)

### M05

**FRs**:
- [FR-0038](docs/analysis/fr/FR-0038-sync-convert-to-wo.md) — Sync — confirmed ProblemCard 轉 WorkOrder（強制 human gate）

**ADRs**:
- [ADR-0066-quote-workorder-lifecycle-binding](docs/architecture/adr/ADR-0066-quote-workorder-lifecycle-binding.md) — ADR-0066: Quote ↔ WorkOrder Lifecycle Hard Binding（with Emergency Carve-out） (STILL_VALID_UNDER_M04_M05)

### M06

**FRs**:
- [FR-0003](docs/analysis/fr/FR-0003-auto-dispatch.md) — 自動派工演算法（規則引擎）
- [FR-0004](docs/analysis/fr/FR-0004-manual-dispatch-audit.md) — 手動派工 + audit log
- [FR-0005](docs/analysis/fr/FR-0005-technician-accept.md) — 技師接單與出發回報
- [FR-0010](docs/analysis/fr/FR-0010-reschedule-delay.md) — 改約 / 延遲通知 / 取消（V1.0 LINE only）
- [FR-0039](docs/analysis/fr/FR-0039-sync-dispatch.md) — Sync — Dispatch 同步（WO created → 派工 queue）
- [FR-0046](docs/analysis/fr/FR-0046-dispatcher-commission.md) — 派工人 Commission 月結

**ADRs**:
- [ADR-0045-acceptance-sla-policy](docs/architecture/adr/ADR-0045-acceptance-sla-policy.md) — ADR-0045 — 接單 SLA (STILL_VALID_UNDER_M06)

### M07

**FRs**:
- [FR-0003](docs/analysis/fr/FR-0003-auto-dispatch.md) — 自動派工演算法（規則引擎）
- [FR-0005](docs/analysis/fr/FR-0005-technician-accept.md) — 技師接單與出發回報
- [FR-0010](docs/analysis/fr/FR-0010-reschedule-delay.md) — 改約 / 延遲通知 / 取消（V1.0 LINE only）
- [FR-0044](docs/analysis/fr/FR-0044-technician-onboarding-suspension.md) — Technician Onboarding 與停權
- [FR-0045](docs/analysis/fr/FR-0045-technician-ap-settlement.md) — Technician AP 月結
- [FR-0048](docs/analysis/fr/FR-0048-rma-quality-feedback-loop.md) — RMA 品質回饋迴圈

**ADRs**:
- [ADR-0041-travel-fee-split](docs/architecture/adr/ADR-0041-travel-fee-split.md) — ADR-0041 — 車馬費歸屬 (STILL_VALID_UNDER_M11_M07)
- [ADR-0052-material-ownership-field](docs/architecture/adr/ADR-0052-material-ownership-field.md) — ADR-0052 — 庫存歸屬 (STILL_VALID_UNDER_M10_M07)

### M08

**FRs**:
- [FR-0003](docs/analysis/fr/FR-0003-auto-dispatch.md) — 自動派工演算法（規則引擎）
- [FR-0006](docs/analysis/fr/FR-0006-onsite-photo.md) — 到場拍照存證
- [FR-0007](docs/analysis/fr/FR-0007-material-request.md) — 材料申請與庫存扣減
- [FR-0008](docs/analysis/fr/FR-0008-scope-change.md) — Scope Change 流程（增項 / 改價）
- [FR-0009](docs/analysis/fr/FR-0009-completion-sign.md) — 完工簽名 + 雙方確認
- [FR-0011](docs/analysis/fr/FR-0011-consumer-payment.md) — 消費者付款（V1.0 升級！）
- [FR-0040](docs/analysis/fr/FR-0040-sync-evidence-writeback.md) — Sync — Evidence 回寫（photo / sign / completion / payment）

**ADRs**:
- [ADR-0046-change-request-object](docs/architecture/adr/ADR-0046-change-request-object.md) — ADR-0046 — ChangeRequest 物件化 (STILL_VALID_UNDER_M15_M08)
- [ADR-0049-onsite-scope-change-protocol](docs/architecture/adr/ADR-0049-onsite-scope-change-protocol.md) — ADR-0049 — 現場加價三件套 (STILL_VALID_UNDER_M08_M15)

### M09

**FRs**:
- [FR-0006](docs/analysis/fr/FR-0006-onsite-photo.md) — 到場拍照存證
- [FR-0009](docs/analysis/fr/FR-0009-completion-sign.md) — 完工簽名 + 雙方確認
- [FR-0040](docs/analysis/fr/FR-0040-sync-evidence-writeback.md) — Sync — Evidence 回寫（photo / sign / completion / payment）

**ADRs**:
- [ADR-0051-evidence-retention-policy](docs/architecture/adr/ADR-0051-evidence-retention-policy.md) — ADR-0051 — Evidence 保存期 (STILL_VALID_UNDER_M09_M17)

### M10

**FRs**:
- [FR-0007](docs/analysis/fr/FR-0007-material-request.md) — 材料申請與庫存扣減
- [FR-0027](docs/analysis/fr/FR-0027-brand-profile-resolver.md) — Chatbot 品牌型號與用戶資料 Resolver

**ADRs**:
- [ADR-0052-material-ownership-field](docs/architecture/adr/ADR-0052-material-ownership-field.md) — ADR-0052 — 庫存歸屬 (STILL_VALID_UNDER_M10_M07)
- [ADR-0053-serial-control-policy](docs/architecture/adr/ADR-0053-serial-control-policy.md) — ADR-0053 — Serial 控制範圍 (STILL_VALID_UNDER_M10)

### M11

**FRs**:
- [FR-0010](docs/analysis/fr/FR-0010-reschedule-delay.md) — 改約 / 延遲通知 / 取消（V1.0 LINE only）
- [FR-0011](docs/analysis/fr/FR-0011-consumer-payment.md) — 消費者付款（V1.0 升級！）
- [FR-0012](docs/analysis/fr/FR-0012-monthly-settlement.md) — 技師月結撥款（V1.0 升級！）
- [FR-0014](docs/analysis/fr/FR-0014-refund.md) — 退款流程（5-tier + SoD 三維）
- [FR-0042](docs/analysis/fr/FR-0042-quote-internal-vs-external-view.md) — Quote 內外部視圖（客戶實收 vs 內部成本）
- [FR-0052](docs/analysis/fr/FR-0052-cancellation-fee-tiers-flow.md) — Cancellation Fee 6-Tier Flow（取消費分層 + reason code + 師傅 initiated）

**ADRs**:
- [ADR-0041-travel-fee-split](docs/architecture/adr/ADR-0041-travel-fee-split.md) — ADR-0041 — 車馬費歸屬 (STILL_VALID_UNDER_M11_M07)
- [ADR-0064-quote-pricing-snapshot-hash-chain](docs/architecture/adr/ADR-0064-quote-pricing-snapshot-hash-chain.md) — ADR-0064: Quote Pricing Snapshot Hash Chain（獨立鏈） (STILL_VALID_UNDER_M04_M11)
- [ADR-VCH-001-platform-as-voucher-keeper](docs/architecture/adr/ADR-VCH-001-platform-as-voucher-keeper.md) — ADR-VCH-001: Platform = Voucher Keeper (STILL_VALID_UNDER_M11_M16)
- [ADR-VCH-002-voucher-retention-7y](docs/architecture/adr/ADR-VCH-002-voucher-retention-7y.md) — ADR-VCH-002: Voucher Retention 7 年 (STILL_VALID_UNDER_M11_M17)

### M12

**FRs**:
- [FR-0012](docs/analysis/fr/FR-0012-monthly-settlement.md) — 技師月結撥款（V1.0 升級！）
- [FR-0045](docs/analysis/fr/FR-0045-technician-ap-settlement.md) — Technician AP 月結
- [FR-0046](docs/analysis/fr/FR-0046-dispatcher-commission.md) — 派工人 Commission 月結
- [FR-0047](docs/analysis/fr/FR-0047-brand-monthly-settlement.md) — 品牌月結 + B2B Settlement

### M13

**FRs**:
- [FR-0015](docs/analysis/fr/FR-0015-warranty-claim.md) — 保固申訴受理（3-mode start_date + B2B negotiated + Phase II ship_date placeholder + RMA 重算 + Phase I 整機）
- [FR-0048](docs/analysis/fr/FR-0048-rma-quality-feedback-loop.md) — RMA 品質回饋迴圈
- [FR-0051](docs/analysis/fr/FR-0051-sop-feedback-spiral-deep.md) — SOP Feedback Spiral 深化（A10）

**ADRs**:
- [ADR-0035-warranty-project-quote-policy](docs/architecture/adr/ADR-0035-warranty-project-quote-policy.md) — ADR-0035 — 保固 / 建案案件 AI 報價邊界 (STILL_VALID_UNDER_M04_M13)

### M14

**FRs**:
- [FR-0041](docs/analysis/fr/FR-0041-customer-site-device-master.md) — Customer / Site / Device Master 維護
- [FR-0047](docs/analysis/fr/FR-0047-brand-monthly-settlement.md) — 品牌月結 + B2B Settlement

**ADRs**:
- [ADR-0043-brand-project-tenant-scope](docs/architecture/adr/ADR-0043-brand-project-tenant-scope.md) — ADR-0043 — 品牌 / 建商專案邊界 (STILL_VALID_UNDER_M14_M17)
- [ADR-0056-per-vendor-contract-attachment-spec](docs/architecture/adr/ADR-0056-per-vendor-contract-attachment-spec.md) — ADR-0056 — 每廠商合約附件規格 + 接入流程 (STILL_VALID_UNDER_M14)
- [ADR-0060-contract-template-schema-freeze-v1](docs/architecture/adr/ADR-0060-contract-template-schema-freeze-v1.md) — ADR-0060: Contract Template Schema Reserved Nullable (V1) (STILL_VALID_UNDER_M14_M18)

### M15

**FRs**:
- [FR-0004](docs/analysis/fr/FR-0004-manual-dispatch-audit.md) — 手動派工 + audit log
- [FR-0008](docs/analysis/fr/FR-0008-scope-change.md) — Scope Change 流程（增項 / 改價）
- [FR-0010](docs/analysis/fr/FR-0010-reschedule-delay.md) — 改約 / 延遲通知 / 取消（V1.0 LINE only）
- [FR-0013](docs/analysis/fr/FR-0013-dual-sign-dispute.md) — 對帳爭議雙簽
- [FR-0014](docs/analysis/fr/FR-0014-refund.md) — 退款流程（5-tier + SoD 三維）
- [FR-0015](docs/analysis/fr/FR-0015-warranty-claim.md) — 保固申訴受理（3-mode start_date + B2B negotiated + Phase II ship_date placeholder + RMA 重算 + Phase I 整機）
- [FR-0030](docs/analysis/fr/FR-0030-guardrails-output-validator.md) — Chatbot Guardrails & Output Validator
- [FR-0049](docs/analysis/fr/FR-0049-exception-approval-inbox.md) — Exception Approval Inbox（M15 完整深化）
- [FR-0052](docs/analysis/fr/FR-0052-cancellation-fee-tiers-flow.md) — Cancellation Fee 6-Tier Flow（取消費分層 + reason code + 師傅 initiated）

**ADRs**:
- [ADR-0034-urgent-red-code-definition](docs/architecture/adr/ADR-0034-urgent-red-code-definition.md) — ADR-0034 — urgent / Red Code 定義 (STILL_VALID_UNDER_M03_M15)
- [ADR-0046-change-request-object](docs/architecture/adr/ADR-0046-change-request-object.md) — ADR-0046 — ChangeRequest 物件化 (STILL_VALID_UNDER_M15_M08)
- [ADR-0049-onsite-scope-change-protocol](docs/architecture/adr/ADR-0049-onsite-scope-change-protocol.md) — ADR-0049 — 現場加價三件套 (STILL_VALID_UNDER_M08_M15)
- [ADR-0065-change-request-type-lookup-table](docs/architecture/adr/ADR-0065-change-request-type-lookup-table.md) — ADR-0065: ChangeRequest.type Lookup Table Migration (STILL_VALID_UNDER_M15_M18)

### M16

**FRs**:
- [FR-0001](docs/analysis/fr/FR-0001-line-intake.md) — LINE 客服報修受理（圖片 + 文字 + 對話）
- [FR-0008](docs/analysis/fr/FR-0008-scope-change.md) — Scope Change 流程（增項 / 改價）
- [FR-0009](docs/analysis/fr/FR-0009-completion-sign.md) — 完工簽名 + 雙方確認
- [FR-0010](docs/analysis/fr/FR-0010-reschedule-delay.md) — 改約 / 延遲通知 / 取消（V1.0 LINE only）
- [FR-0018](docs/analysis/fr/FR-0018-cs-takeover.md) — 客服接管對話（三層解決機制）
- [FR-0022](docs/analysis/fr/FR-0022-consumer-tracking.md) — 消費者端工單追蹤（LINE + Web 並存）
- [FR-0026](docs/analysis/fr/FR-0026-chatbot-debounce-merge.md) — Chatbot 進線 Debounce 與訊息合併
- [FR-0049](docs/analysis/fr/FR-0049-exception-approval-inbox.md) — Exception Approval Inbox（M15 完整深化）
- [FR-0052](docs/analysis/fr/FR-0052-cancellation-fee-tiers-flow.md) — Cancellation Fee 6-Tier Flow（取消費分層 + reason code + 師傅 initiated）

**ADRs**:
- [ADR-0012-notification-channels](docs/architecture/adr/ADR-0012-notification-channels.md) — 通知 Channel 策略（Notification Channel Strategy） (STILL_VALID_UNDER_M16)
- [ADR-0048-ai-human-handoff-rules](docs/architecture/adr/ADR-0048-ai-human-handoff-rules.md) — ADR-0048 — AI 轉真人 7 條件 (STILL_VALID_UNDER_A07_M16)
- [ADR-VCH-001-platform-as-voucher-keeper](docs/architecture/adr/ADR-VCH-001-platform-as-voucher-keeper.md) — ADR-VCH-001: Platform = Voucher Keeper (STILL_VALID_UNDER_M11_M16)

### M17

**FRs**:
- [FR-0004](docs/analysis/fr/FR-0004-manual-dispatch-audit.md) — 手動派工 + audit log
- [FR-0008](docs/analysis/fr/FR-0008-scope-change.md) — Scope Change 流程（增項 / 改價）
- [FR-0011](docs/analysis/fr/FR-0011-consumer-payment.md) — 消費者付款（V1.0 升級！）
- [FR-0012](docs/analysis/fr/FR-0012-monthly-settlement.md) — 技師月結撥款（V1.0 升級！）
- [FR-0013](docs/analysis/fr/FR-0013-dual-sign-dispute.md) — 對帳爭議雙簽
- [FR-0014](docs/analysis/fr/FR-0014-refund.md) — 退款流程（5-tier + SoD 三維）
- [FR-0019](docs/analysis/fr/FR-0019-rbac-dynamic.md) — 動態 RBAC 角色管理
- [FR-0020](docs/analysis/fr/FR-0020-audit-log-export.md) — 稽核日誌完整性與匯出
- [FR-0028](docs/analysis/fr/FR-0028-skill-gated-react-agent.md) — Chatbot Skill-Gated ReAct Agent
- [FR-0036](docs/analysis/fr/FR-0036-sync-facts-master.md) — Sync — Facts 主檔同步（phone/address/device → ERP）
- [FR-0042](docs/analysis/fr/FR-0042-quote-internal-vs-external-view.md) — Quote 內外部視圖（客戶實收 vs 內部成本）
- [FR-0043](docs/analysis/fr/FR-0043-m18-admin-config-workflow.md) — M18 Admin Config Workflow（user-maintained runtime config）
- [FR-0044](docs/analysis/fr/FR-0044-technician-onboarding-suspension.md) — Technician Onboarding 與停權
- [FR-0049](docs/analysis/fr/FR-0049-exception-approval-inbox.md) — Exception Approval Inbox（M15 完整深化）
- [FR-0052](docs/analysis/fr/FR-0052-cancellation-fee-tiers-flow.md) — Cancellation Fee 6-Tier Flow（取消費分層 + reason code + 師傅 initiated）
- [FR-0053](docs/analysis/fr/FR-0053-dpo-forget-gdpr-flow.md) — DPO Forget / GDPR Right-to-be-Forgotten Flow（cross-cutting）

**ADRs**:
- [ADR-0030-tenant-id-propagation](docs/architecture/adr/ADR-0030-tenant-id-propagation.md) — ADR-0030: Tenant ID Propagation — Agent 層補對稱隔離 (STILL_VALID_UNDER_M17_cross-cutting)
- [ADR-0042-rbac-four-tier-principle](docs/architecture/adr/ADR-0042-rbac-four-tier-principle.md) — ADR-0042 — 角色權限矩陣 4 層原則 (STILL_VALID_UNDER_M17)
- [ADR-0043-brand-project-tenant-scope](docs/architecture/adr/ADR-0043-brand-project-tenant-scope.md) — ADR-0043 — 品牌 / 建商專案邊界 (STILL_VALID_UNDER_M14_M17)
- [ADR-0051-evidence-retention-policy](docs/architecture/adr/ADR-0051-evidence-retention-policy.md) — ADR-0051 — Evidence 保存期 (STILL_VALID_UNDER_M09_M17)
- [ADR-0061-data-governance-service-boundary](docs/architecture/adr/ADR-0061-data-governance-service-boundary.md) — ADR-0061: Data Governance Service (DGS) Boundary — Independent Service (STILL_VALID_UNDER_M17_M18)
- [ADR-PII-002-data-minimization-schema-ci-double-defense](docs/architecture/adr/ADR-PII-002-data-minimization-schema-ci-double-defense.md) — ADR-PII-002: 資料極小化雙層防線 (STILL_VALID_UNDER_M17_M02_cross-cutting)
- [ADR-VCH-002-voucher-retention-7y](docs/architecture/adr/ADR-VCH-002-voucher-retention-7y.md) — ADR-VCH-002: Voucher Retention 7 年 (STILL_VALID_UNDER_M11_M17)

### M18

**FRs**:
- [FR-0019](docs/analysis/fr/FR-0019-rbac-dynamic.md) — 動態 RBAC 角色管理
- [FR-0043](docs/analysis/fr/FR-0043-m18-admin-config-workflow.md) — M18 Admin Config Workflow（user-maintained runtime config）
- [FR-0052](docs/analysis/fr/FR-0052-cancellation-fee-tiers-flow.md) — Cancellation Fee 6-Tier Flow（取消費分層 + reason code + 師傅 initiated）

**ADRs**:
- [ADR-0009-agent-admin-bridge-pattern](docs/architecture/adr/ADR-0009-agent-admin-bridge-pattern.md) — ADR-009: Agent ↔ Admin 資料同步機制（Bridge Pattern） (NOT_CLASSIFIED)
- [ADR-0060-contract-template-schema-freeze-v1](docs/architecture/adr/ADR-0060-contract-template-schema-freeze-v1.md) — ADR-0060: Contract Template Schema Reserved Nullable (V1) (STILL_VALID_UNDER_M14_M18)
- [ADR-0061-data-governance-service-boundary](docs/architecture/adr/ADR-0061-data-governance-service-boundary.md) — ADR-0061: Data Governance Service (DGS) Boundary — Independent Service (STILL_VALID_UNDER_M17_M18)
- [ADR-0065-change-request-type-lookup-table](docs/architecture/adr/ADR-0065-change-request-type-lookup-table.md) — ADR-0065: ChangeRequest.type Lookup Table Migration (STILL_VALID_UNDER_M15_M18)

### M19

**FRs**:
- [FR-0021](docs/analysis/fr/FR-0021-dashboard-reports.md) — Dashboard / 報表（KPI / Revenue / Tech ranking）
- [FR-0032](docs/analysis/fr/FR-0032-eval-observability.md) — AI Eval / 觀測（quality_check + audit + token cost）

### M20

**FRs**:
- [FR-0017](docs/analysis/fr/FR-0017-sop-draft-review.md) — SOP 草稿審核（AI 自進化）
- [FR-0028](docs/analysis/fr/FR-0028-skill-gated-react-agent.md) — Chatbot Skill-Gated ReAct Agent
- [FR-0029](docs/analysis/fr/FR-0029-skill-knowledge-base.md) — SKILL 知識庫 (SKILL.md + RAG)
- [FR-0030](docs/analysis/fr/FR-0030-guardrails-output-validator.md) — Chatbot Guardrails & Output Validator
- [FR-0034](docs/analysis/fr/FR-0034-ai-employee-charter.md) — AI Employee Charter / PRD 治理（Phase II）
- [FR-0048](docs/analysis/fr/FR-0048-rma-quality-feedback-loop.md) — RMA 品質回饋迴圈
- [FR-0050](docs/analysis/fr/FR-0050-ai-governance-prd-trace.md) — AI Governance & PRD Traceability（A12）
- [FR-0051](docs/analysis/fr/FR-0051-sop-feedback-spiral-deep.md) — SOP Feedback Spiral 深化（A10）

**ADRs**:
- [ADR-0003-llm-integration-framework](docs/architecture/adr/ADR-0003-llm-integration-framework.md) — ADR-003: 選擇 LangChain 作為 LLM 整合框架 (STILL_VALID_UNDER_M20_A03_A04)
- [ADR-0006-llm-model-selection](docs/architecture/adr/ADR-0006-llm-model-selection.md) — ADR-006: LLM 模型選擇策略 (STILL_VALID_UNDER_M20_A03)
- [ADR-0007-llm-registry-pattern](docs/architecture/adr/ADR-0007-llm-registry-pattern.md) — ADR-007: LLM Registry 形式 — 承認 LiteLLM 字串路由為 dict registry 替代方案 (STILL_VALID_UNDER_M20_A03)
- [ADR-0027-model-routing-policy](docs/architecture/adr/ADR-0027-model-routing-policy.md) — ADR-0027 — 模型路由策略 (STILL_VALID_UNDER_M20_A03)
- [ADR-0028-ai-employee-charter](docs/architecture/adr/ADR-0028-ai-employee-charter.md) — ADR-0028 — AI 鎖匠客服助理 Employee Charter (STILL_VALID_UNDER_M20_A12)
- [ADR-0038-ai-feedback-review-policy](docs/architecture/adr/ADR-0038-ai-feedback-review-policy.md) — ADR-0038 — AI feedback / SOP 審核機制 (STILL_VALID_UNDER_M20_A10)
- [ADR-0047-ai-forbidden-list-as-charter](docs/architecture/adr/ADR-0047-ai-forbidden-list-as-charter.md) — ADR-0047 — AI 禁止決策清單入 charter (STILL_VALID_UNDER_A05_M20)
- [ADR-0058-external-knowledge-platform-ingestion-contract](docs/architecture/adr/ADR-0058-external-knowledge-platform-ingestion-contract.md) — ADR-0058 — 外部知識傳承平台 → AI Agent ingestion contract (STILL_VALID_UNDER_A04_M20)
- [ADR-0063-ai-utterance-boundary](docs/architecture/adr/ADR-0063-ai-utterance-boundary.md) — ADR-0063: AI Quote-related Utterance Boundary (STILL_VALID_UNDER_A05_M20)

### S-M01

**FRs**:
- [FR-0035](docs/analysis/fr/FR-0035-sync-intake-capture.md) — Sync — Intake 資料捕捉（LINE/user turn → 結構化）

### S-M02

**FRs**:
- [FR-0036](docs/analysis/fr/FR-0036-sync-facts-master.md) — Sync — Facts 主檔同步（phone/address/device → ERP）

### S-M03

**FRs**:
- [FR-0037](docs/analysis/fr/FR-0037-sync-pc-convert.md) — Sync — ProblemCard 轉換（chatbot ↔ ERP）

### S-M04

**FRs**:
- [FR-0038](docs/analysis/fr/FR-0038-sync-convert-to-wo.md) — Sync — confirmed ProblemCard 轉 WorkOrder（強制 human gate）

**ADRs**:
- [ADR-0031-ai-auto-convert-to-work-order](docs/architecture/adr/ADR-0031-ai-auto-convert-to-work-order.md) — ADR-0031 — AI 是否可自動 `convert_to_work_order` (STILL_VALID_UNDER_M03_S-M04)

### S-M05

**FRs**:
- [FR-0039](docs/analysis/fr/FR-0039-sync-dispatch.md) — Sync — Dispatch 同步（WO created → 派工 queue）

### S-M06

**FRs**:
- [FR-0040](docs/analysis/fr/FR-0040-sync-evidence-writeback.md) — Sync — Evidence 回寫（photo / sign / completion / payment）

### boundary

**ADRs**:
- [ADR-0009-agent-admin-bridge-pattern](docs/architecture/adr/ADR-0009-agent-admin-bridge-pattern.md) — ADR-009: Agent ↔ Admin 資料同步機制（Bridge Pattern） (NOT_CLASSIFIED)

### bridge)

**ADRs**:
- [ADR-0009-agent-admin-bridge-pattern](docs/architecture/adr/ADR-0009-agent-admin-bridge-pattern.md) — ADR-009: Agent ↔ Admin 資料同步機制（Bridge Pattern） (NOT_CLASSIFIED)

### cross-cutting

**FRs**:
- [FR-0023](docs/analysis/fr/FR-0023-error-offline-page.md) — 錯誤頁 / 離線體驗（cross-cutting）
- [FR-0053](docs/analysis/fr/FR-0053-dpo-forget-gdpr-flow.md) — DPO Forget / GDPR Right-to-be-Forgotten Flow（cross-cutting）

**ADRs**:
- [ADR-0001-backend-framework](docs/architecture/adr/ADR-0001-backend-framework.md) — ADR-001: 選擇 FastAPI 作為後端框架 (STILL_VALID_UNDER_cross-cutting)
- [ADR-0002-database-selection](docs/architecture/adr/ADR-0002-database-selection.md) — ADR-002: 選擇 PostgreSQL + pgvector 作為主要資料庫 (STILL_VALID_UNDER_cross-cutting)
- [ADR-0005-frontend-framework-v2](docs/architecture/adr/ADR-0005-frontend-framework-v2.md) — ADR-005: 選擇 Next.js 作為 V2.0 前端框架 (STILL_VALID_UNDER_cross-cutting)
- [ADR-0011-i18n-strategy](docs/architecture/adr/ADR-0011-i18n-strategy.md) — i18n Strategy — 多語系實作決策 (STILL_VALID_UNDER_cross-cutting)
- [ADR-0029-fail-soft-to-durable-three-pack](docs/architecture/adr/ADR-0029-fail-soft-to-durable-three-pack.md) — ADR-0029: Fail-soft 路徑統一收斂到 Outbox + Audit + Review Queue 三件組 (STILL_VALID_UNDER_A05_cross-cutting)
- [ADR-0030-tenant-id-propagation](docs/architecture/adr/ADR-0030-tenant-id-propagation.md) — ADR-0030: Tenant ID Propagation — Agent 層補對稱隔離 (STILL_VALID_UNDER_M17_cross-cutting)
- [ADR-0059-smart-lock-iot-signal-ingestion-spec](docs/architecture/adr/ADR-0059-smart-lock-iot-signal-ingestion-spec.md) — ADR-0059 — 電子鎖 IoT 狀態訊號接入規格 (STILL_VALID_UNDER_cross-cutting)
- [ADR-PII-002-data-minimization-schema-ci-double-defense](docs/architecture/adr/ADR-PII-002-data-minimization-schema-ci-double-defense.md) — ADR-PII-002: 資料極小化雙層防線 (STILL_VALID_UNDER_M17_M02_cross-cutting)

### plane)

**ADRs**:
- [ADR-0009-agent-admin-bridge-pattern](docs/architecture/adr/ADR-0009-agent-admin-bridge-pattern.md) — ADR-009: Agent ↔ Admin 資料同步機制（Bridge Pattern） (NOT_CLASSIFIED)

### ↔

**ADRs**:
- [ADR-0009-agent-admin-bridge-pattern](docs/architecture/adr/ADR-0009-agent-admin-bridge-pattern.md) — ADR-009: Agent ↔ Admin 資料同步機制（Bridge Pattern） (NOT_CLASSIFIED)

---

## §4 ADR Migration Status (per ADR-0100 §1)

| ADR | Title | Migration Status | Module Scope |
|:----|:------|:-----------------|:-------------|
| [ADR-0001-backend-framework](docs/architecture/adr/ADR-0001-backend-framework.md) | ADR-001: 選擇 FastAPI 作為後端框架 | STILL_VALID_UNDER_cross-cutting | cross-cutting |
| [ADR-0002-database-selection](docs/architecture/adr/ADR-0002-database-selection.md) | ADR-002: 選擇 PostgreSQL + pgvector 作為主要資料庫 | STILL_VALID_UNDER_cross-cutting | cross-cutting |
| [ADR-0003-llm-integration-framework](docs/architecture/adr/ADR-0003-llm-integration-framework.md) | ADR-003: 選擇 LangChain 作為 LLM 整合框架 | STILL_VALID_UNDER_M20_A03_A04 | M20, A03, A04 |
| [ADR-0004-line-bot-architecture](docs/architecture/adr/ADR-0004-line-bot-architecture.md) | ADR-004: LINE Bot 對話架構設計 | STILL_VALID_UNDER_M01_A01 | M01, A01 |
| [ADR-0005-frontend-framework-v2](docs/architecture/adr/ADR-0005-frontend-framework-v2.md) | ADR-005: 選擇 Next.js 作為 V2.0 前端框架 | STILL_VALID_UNDER_cross-cutting | cross-cutting |
| [ADR-0006-llm-model-selection](docs/architecture/adr/ADR-0006-llm-model-selection.md) | ADR-006: LLM 模型選擇策略 | STILL_VALID_UNDER_M20_A03 | M20, A03 |
| [ADR-0007-llm-registry-pattern](docs/architecture/adr/ADR-0007-llm-registry-pattern.md) | ADR-007: LLM Registry 形式 — 承認 LiteLLM 字串路由為 dict registry 替代方案 | STILL_VALID_UNDER_M20_A03 | M20, A03 |
| [ADR-0008-product-info-architecture-canonical](docs/architecture/adr/ADR-0008-product-info-architecture-canonical.md) | ADR-008: Agent 知識庫架構以 `product_info/` 為唯一正典（Architecture Lock） | NOT_CLASSIFIED | - |
| [ADR-0009-agent-admin-bridge-pattern](docs/architecture/adr/ADR-0009-agent-admin-bridge-pattern.md) | ADR-009: Agent ↔ Admin 資料同步機制（Bridge Pattern） | NOT_CLASSIFIED | A11 (agent bridge) ↔ M18 (config plane) boundary |
| [ADR-0010-belief-augmented-react](docs/architecture/adr/ADR-0010-belief-augmented-react.md) | ADR-010: Belief-Augmented ReAct（Turn Cycle 實驗） | STILL_VALID_UNDER_A03 | A03 |
| [ADR-0011-i18n-strategy](docs/architecture/adr/ADR-0011-i18n-strategy.md) | i18n Strategy — 多語系實作決策 | STILL_VALID_UNDER_cross-cutting | cross-cutting |
| [ADR-0012-notification-channels](docs/architecture/adr/ADR-0012-notification-channels.md) | 通知 Channel 策略（Notification Channel Strategy） | STILL_VALID_UNDER_M16 | M16 |
| [ADR-0013-pm-alignment-q1](docs/architecture/adr/ADR-0013-pm-alignment-q1.md) | ADR-0013 — 派工員角色定位 | HISTORICAL | - |
| [ADR-0014-pm-alignment-q2](docs/architecture/adr/ADR-0014-pm-alignment-q2.md) | ADR-0014 — 雙簽終簽人階層 | HISTORICAL | - |
| [ADR-0015-pm-alignment-q3](docs/architecture/adr/ADR-0015-pm-alignment-q3.md) | ADR-0015 — 消費者端追蹤入口 | HISTORICAL | - |
| [ADR-0016-pm-alignment-q4](docs/architecture/adr/ADR-0016-pm-alignment-q4.md) | ADR-0016 — 月結爭議 SLA 計時 | HISTORICAL | - |
| [ADR-0017-pm-alignment-q5](docs/architecture/adr/ADR-0017-pm-alignment-q5.md) | ADR-0017 — F-016 SLA 性質 | HISTORICAL | - |
| [ADR-0018-pm-alignment-q6](docs/architecture/adr/ADR-0018-pm-alignment-q6.md) | ADR-0018 — 客服繞過自動派工 | HISTORICAL | - |
| [ADR-0019-pm-alignment-q7](docs/architecture/adr/ADR-0019-pm-alignment-q7.md) | ADR-0019 — V1.0 金流範圍 | HISTORICAL | - |
| [ADR-0020-pm-alignment-q8](docs/architecture/adr/ADR-0020-pm-alignment-q8.md) | ADR-0020 — 非 LINE 用戶 fallback | HISTORICAL | - |
| [ADR-0021-pm-alignment-q9](docs/architecture/adr/ADR-0021-pm-alignment-q9.md) | ADR-0021 — Scope Change 同意入口 | HISTORICAL | - |
| [ADR-0022-pm-alignment-q10](docs/architecture/adr/ADR-0022-pm-alignment-q10.md) | ADR-0022 — 派工/接單失敗 rollback | HISTORICAL | - |
| [ADR-0023-tactical-refactor-2026-q2](docs/architecture/adr/ADR-0023-tactical-refactor-2026-q2.md) | ADR-0023 — Tier 1 戰術級資料夾與整合層重構（2026 Q2） | HISTORICAL | - |
| [ADR-0024-tier1-refactor-revised](docs/architecture/adr/ADR-0024-tier1-refactor-revised.md) | ADR-0024 — Tier 1 戰術級重構（2026 Q2）— hands-on 修正版 | HISTORICAL | - |
| [ADR-0025-harness-branching-pipeline](docs/architecture/adr/ADR-0025-harness-branching-pipeline.md) | ADR-0025 — Harness 採 branching pipeline，PIPELINE list 為 introspection-only | HISTORICAL | - |
| [ADR-0026-memory-architecture](docs/architecture/adr/ADR-0026-memory-architecture.md) | ADR-0026 — Agent 記憶層分層架構（7 層） | STILL_VALID_UNDER_A03_A04 | A03, A04 |
| [ADR-0027-model-routing-policy](docs/architecture/adr/ADR-0027-model-routing-policy.md) | ADR-0027 — 模型路由策略 | STILL_VALID_UNDER_M20_A03 | M20, A03 |
| [ADR-0028-ai-employee-charter](docs/architecture/adr/ADR-0028-ai-employee-charter.md) | ADR-0028 — AI 鎖匠客服助理 Employee Charter | STILL_VALID_UNDER_M20_A12 | M20, A12 |
| [ADR-0029-fail-soft-to-durable-three-pack](docs/architecture/adr/ADR-0029-fail-soft-to-durable-three-pack.md) | ADR-0029: Fail-soft 路徑統一收斂到 Outbox + Audit + Review Queue 三件組 | STILL_VALID_UNDER_A05_cross-cutting | A05, cross-cutting |
| [ADR-0030-tenant-id-propagation](docs/architecture/adr/ADR-0030-tenant-id-propagation.md) | ADR-0030: Tenant ID Propagation — Agent 層補對稱隔離 | STILL_VALID_UNDER_M17_cross-cutting | M17, cross-cutting |
| [ADR-0031-ai-auto-convert-to-work-order](docs/architecture/adr/ADR-0031-ai-auto-convert-to-work-order.md) | ADR-0031 — AI 是否可自動 `convert_to_work_order` | STILL_VALID_UNDER_M03_S-M04 | M03, S-M04 |
| [ADR-0032-missing-address-policy](docs/architecture/adr/ADR-0032-missing-address-policy.md) | ADR-0032 — 缺地址時的處理規則 | STILL_VALID_UNDER_M01_M02 | M01, M02 |
| [ADR-0033-problem-card-completeness-gate](docs/architecture/adr/ADR-0033-problem-card-completeness-gate.md) | ADR-0033 — ProblemCard completeness score 是否控制派工 | STILL_VALID_UNDER_M03 | M03 |
| [ADR-0034-urgent-red-code-definition](docs/architecture/adr/ADR-0034-urgent-red-code-definition.md) | ADR-0034 — urgent / Red Code 定義 | STILL_VALID_UNDER_M03_M15 | M03, M15 |
| [ADR-0035-warranty-project-quote-policy](docs/architecture/adr/ADR-0035-warranty-project-quote-policy.md) | ADR-0035 — 保固 / 建案案件 AI 報價邊界 | STILL_VALID_UNDER_M04_M13 | M04, M13 |
| [ADR-0036-multi-problem-card-rule](docs/architecture/adr/ADR-0036-multi-problem-card-rule.md) | ADR-0036 — 同 conversation 多 ProblemCard 規則 | STILL_VALID_UNDER_M03 | M03 |
| [ADR-0037-conversation-auto-close](docs/architecture/adr/ADR-0037-conversation-auto-close.md) | ADR-0037 — 對話解決後客戶確認關閉 | STILL_VALID_UNDER_A03_M03 | A03, M03 |
| [ADR-0038-ai-feedback-review-policy](docs/architecture/adr/ADR-0038-ai-feedback-review-policy.md) | ADR-0038 — AI feedback / SOP 審核機制 | STILL_VALID_UNDER_M20_A10 | M20, A10 |
| [ADR-0039-cancellation-fee-tiers](docs/architecture/adr/ADR-0039-cancellation-fee-tiers.md) | ADR-0039 — 取消費分段 | NOT_CLASSIFIED | - |
| [ADR-0040-refund-approval-tiers](docs/architecture/adr/ADR-0040-refund-approval-tiers.md) | ADR-0040 — 退款核准分層 | NOT_CLASSIFIED | - |
| [ADR-0041-travel-fee-split](docs/architecture/adr/ADR-0041-travel-fee-split.md) | ADR-0041 — 車馬費歸屬 | STILL_VALID_UNDER_M11_M07 | M11, M07 |
| [ADR-0042-rbac-four-tier-principle](docs/architecture/adr/ADR-0042-rbac-four-tier-principle.md) | ADR-0042 — 角色權限矩陣 4 層原則 | STILL_VALID_UNDER_M17 | M17 |
| [ADR-0043-brand-project-tenant-scope](docs/architecture/adr/ADR-0043-brand-project-tenant-scope.md) | ADR-0043 — 品牌 / 建商專案邊界 | STILL_VALID_UNDER_M14_M17 | M14, M17 |
| [ADR-0044-warranty-start-date-modes](docs/architecture/adr/ADR-0044-warranty-start-date-modes.md) | ADR-0044-warranty-start-date-modes | NOT_CLASSIFIED | - |
| [ADR-0045-acceptance-sla-policy](docs/architecture/adr/ADR-0045-acceptance-sla-policy.md) | ADR-0045 — 接單 SLA | STILL_VALID_UNDER_M06 | M06 |
| [ADR-0046-change-request-object](docs/architecture/adr/ADR-0046-change-request-object.md) | ADR-0046 — ChangeRequest 物件化 | STILL_VALID_UNDER_M15_M08 | M15, M08 |
| [ADR-0047-ai-forbidden-list-as-charter](docs/architecture/adr/ADR-0047-ai-forbidden-list-as-charter.md) | ADR-0047 — AI 禁止決策清單入 charter | STILL_VALID_UNDER_A05_M20 | A05, M20 |
| [ADR-0048-ai-human-handoff-rules](docs/architecture/adr/ADR-0048-ai-human-handoff-rules.md) | ADR-0048 — AI 轉真人 7 條件 | STILL_VALID_UNDER_A07_M16 | A07, M16 |
| [ADR-0049-onsite-scope-change-protocol](docs/architecture/adr/ADR-0049-onsite-scope-change-protocol.md) | ADR-0049 — 現場加價三件套 | STILL_VALID_UNDER_M08_M15 | M08, M15 |
| [ADR-0050-evidence-visibility-matrix](docs/architecture/adr/ADR-0050-evidence-visibility-matrix.md) | ADR-0050-evidence-visibility-matrix | PARTIAL_UPDATE (Lane A critique done — 3/3 persona consensus) | - |
| [ADR-0051-evidence-retention-policy](docs/architecture/adr/ADR-0051-evidence-retention-policy.md) | ADR-0051 — Evidence 保存期 | STILL_VALID_UNDER_M09_M17 | M09, M17 |
| [ADR-0052-material-ownership-field](docs/architecture/adr/ADR-0052-material-ownership-field.md) | ADR-0052 — 庫存歸屬 | STILL_VALID_UNDER_M10_M07 | M10, M07 |
| [ADR-0053-serial-control-policy](docs/architecture/adr/ADR-0053-serial-control-policy.md) | ADR-0053 — Serial 控制範圍 | STILL_VALID_UNDER_M10 | M10 |
| [ADR-0054-ai-quote-range-only](docs/architecture/adr/ADR-0054-ai-quote-range-only.md) | ADR-0054 — AI 報價邊界（range only） | STILL_VALID_UNDER_A03_M04 | A03, M04 |
| [ADR-0055-skill-llm-decoupling-contract](docs/architecture/adr/ADR-0055-skill-llm-decoupling-contract.md) | ADR-0055 — SKILL ↔ LLM 解耦合約 | STILL_VALID_UNDER_A03_A04 | A03, A04 |
| [ADR-0056-per-vendor-contract-attachment-spec](docs/architecture/adr/ADR-0056-per-vendor-contract-attachment-spec.md) | ADR-0056 — 每廠商合約附件規格 + 接入流程 | STILL_VALID_UNDER_M14 | M14 |
| [ADR-0057-rag-document-retrieval-not-prompt](docs/architecture/adr/ADR-0057-rag-document-retrieval-not-prompt.md) | ADR-0057 — 合約 / 規則走 RAG 文件檢索，禁寫進 prompt | STILL_VALID_UNDER_A04 | A04 |
| [ADR-0058-external-knowledge-platform-ingestion-contract](docs/architecture/adr/ADR-0058-external-knowledge-platform-ingestion-contract.md) | ADR-0058 — 外部知識傳承平台 → AI Agent ingestion contract | STILL_VALID_UNDER_A04_M20 | A04, M20 |
| [ADR-0059-smart-lock-iot-signal-ingestion-spec](docs/architecture/adr/ADR-0059-smart-lock-iot-signal-ingestion-spec.md) | ADR-0059 — 電子鎖 IoT 狀態訊號接入規格 | STILL_VALID_UNDER_cross-cutting | cross-cutting |
| [ADR-0060-contract-template-schema-freeze-v1](docs/architecture/adr/ADR-0060-contract-template-schema-freeze-v1.md) | ADR-0060: Contract Template Schema Reserved Nullable (V1) | STILL_VALID_UNDER_M14_M18 | M14, M18 |
| [ADR-0061-data-governance-service-boundary](docs/architecture/adr/ADR-0061-data-governance-service-boundary.md) | ADR-0061: Data Governance Service (DGS) Boundary — Independent Service | STILL_VALID_UNDER_M17_M18 | M17, M18 |
| [ADR-0062-pricing-engine-bounded-context](docs/architecture/adr/ADR-0062-pricing-engine-bounded-context.md) | ADR-0062: Pricing Engine V2 Bounded Context | STILL_VALID_UNDER_M04 | M04 |
| [ADR-0063-ai-utterance-boundary](docs/architecture/adr/ADR-0063-ai-utterance-boundary.md) | ADR-0063: AI Quote-related Utterance Boundary | STILL_VALID_UNDER_A05_M20 | A05, M20 |
| [ADR-0064-quote-pricing-snapshot-hash-chain](docs/architecture/adr/ADR-0064-quote-pricing-snapshot-hash-chain.md) | ADR-0064: Quote Pricing Snapshot Hash Chain（獨立鏈） | STILL_VALID_UNDER_M04_M11 | M04, M11 |
| [ADR-0065-change-request-type-lookup-table](docs/architecture/adr/ADR-0065-change-request-type-lookup-table.md) | ADR-0065: ChangeRequest.type Lookup Table Migration | STILL_VALID_UNDER_M15_M18 | M15, M18 |
| [ADR-0066-quote-workorder-lifecycle-binding](docs/architecture/adr/ADR-0066-quote-workorder-lifecycle-binding.md) | ADR-0066: Quote ↔ WorkOrder Lifecycle Hard Binding（with Emergency Carve-out） | STILL_VALID_UNDER_M04_M05 | M04, M05 |
| [ADR-0067-m18-runtime-config-governance](docs/architecture/adr/ADR-0067-m18-runtime-config-governance.md) | ADR-0067 — M18 Runtime Configuration Governance | NOT_CLASSIFIED | - |
| [ADR-0068-m18-anti-corruption-layer](docs/architecture/adr/ADR-0068-m18-anti-corruption-layer.md) | ADR-0068 — M18 Cross-Module Anti-Corruption Layer (Config Read API) | NOT_CLASSIFIED | - |
| [ADR-0100-legacy-adr-supersede-index](docs/architecture/adr/ADR-0100-legacy-adr-supersede-index.md) | ADR-0100 — Legacy ADR Supersede Index (post Final Spec 2026-05-20) | NOT_CLASSIFIED | - |
| [ADR-0101-product-info-extension-final-spec](docs/architecture/adr/ADR-0101-product-info-extension-final-spec.md) | ADR-0101 — Agent Knowledge Base × Final Spec Integration Contract | NOT_CLASSIFIED | - |
| [ADR-0102-cancellation-fee-tiers-v2-final-spec](docs/architecture/adr/ADR-0102-cancellation-fee-tiers-v2-final-spec.md) | ADR-0102 — 取消費分段 v2（6 階段 + reason code dictionary + 師傅 initiated 政策） | NOT_CLASSIFIED | - |
| [ADR-PII-002-data-minimization-schema-ci-double-defense](docs/architecture/adr/ADR-PII-002-data-minimization-schema-ci-double-defense.md) | ADR-PII-002: 資料極小化雙層防線 | STILL_VALID_UNDER_M17_M02_cross-cutting | M17, M02, cross-cutting |
| [ADR-PIVOT-001-v2-restart-trigger](docs/architecture/adr/ADR-PIVOT-001-v2-restart-trigger.md) | ADR-PIVOT-001: V2 重啟 trigger 機制 | HISTORICAL | - |
| [ADR-VCH-001-platform-as-voucher-keeper](docs/architecture/adr/ADR-VCH-001-platform-as-voucher-keeper.md) | ADR-VCH-001: Platform = Voucher Keeper | STILL_VALID_UNDER_M11_M16 | M11, M16 |
| [ADR-VCH-002-voucher-retention-7y](docs/architecture/adr/ADR-VCH-002-voucher-retention-7y.md) | ADR-VCH-002: Voucher Retention 7 年 | STILL_VALID_UNDER_M11_M17 | M11, M17 |

---

## §5 Health Issues

### 🟡 ADR not yet classified
- ADR-0008-product-info-architecture-canonical (docs/architecture/adr/ADR-0008-product-info-architecture-canonical.md)
- ADR-0009-agent-admin-bridge-pattern (docs/architecture/adr/ADR-0009-agent-admin-bridge-pattern.md)
- ADR-0039-cancellation-fee-tiers (docs/architecture/adr/ADR-0039-cancellation-fee-tiers.md)
- ADR-0040-refund-approval-tiers (docs/architecture/adr/ADR-0040-refund-approval-tiers.md)
- ADR-0044-warranty-start-date-modes (docs/architecture/adr/ADR-0044-warranty-start-date-modes.md)
- ADR-0067-m18-runtime-config-governance (docs/architecture/adr/ADR-0067-m18-runtime-config-governance.md)
- ADR-0068-m18-anti-corruption-layer (docs/architecture/adr/ADR-0068-m18-anti-corruption-layer.md)
- ADR-0100-legacy-adr-supersede-index (docs/architecture/adr/ADR-0100-legacy-adr-supersede-index.md)
- ADR-0101-product-info-extension-final-spec (docs/architecture/adr/ADR-0101-product-info-extension-final-spec.md)
- ADR-0102-cancellation-fee-tiers-v2-final-spec (docs/architecture/adr/ADR-0102-cancellation-fee-tiers-v2-final-spec.md)

---

## §6 Notes

- This is **baseline run 2026-05-28** before A3.2 FR rewrite (B' 殼) and A3.4 new FR creation.
- Orphan FRs are expected to be high right now — 23 active FRs don't have `mapped_to` because they're v2.2 era. A3.2 will fix this.
- Zero `superseded_clauses` / `emits_events` will populate after A3.2 + A3.4.
- BR directory only contains `BR-AUDIT-007` currently. 64 new BR-M??-NN files come from new spec, will be added in cascade phase.