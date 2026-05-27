---
id: migration-fr-mapping-2026-05-27
title: FR Migration Mapping — 25 FR → Final Spec 2026-05-20 + 新增 FR Outline
status: partial (4 / ~49 FR sample done on 2026-05-28)
date: 2026-05-28
progress:
  rewrite_done: [FR-0001, FR-0002, FR-0008]
  new_done: [FR-0026]
  rewrite_remaining: 20
  new_remaining_phase_i: 17
  new_remaining_phase_ii: 8
owner: devteam-analyst
related: [[../../../devteam_knowledge_base/13_doc_migration_playbook]] §3 cascade · [[../../../devteam_knowledge_base/templates/fr-skeleton]] · [[../../../devteam_knowledge_base/templates/traceability-matrix]]
roundtable: 2026-05-27-1130-final-spec-migration-strategy MoM D5 + 業主 Q3=A
---

# FR Migration Mapping (skeleton)

> **A3 phase 1**：先給業主 review 這份 mapping，圈完後再進個別 FR rewrite (B' 殼) + 新增 FR 詳寫。
>
> **業主 review 動作**：在「業主圈選」欄填 ✅（同意）/ ⚠️（要改，註記）。

---

## §1 既有 25 FR → Final Spec 對應

> 對應原則：`mapped_to: [M??, A??, S-M??]` + 標明該 FR 是否需要搬到 NFR matrix（業主 Q3=A 決議）

| FR ID | 原 Title | mapped_to | 預估動作 | 預估 BR clauses (rule 搬 BR) | Emits Events | 業主圈選 |
|:------|:---------|:----------|:--------|:------------------------------|:-------------|:--------|
| FR-0001 | line-intake | M01 + A01 | Rewrite B' 殼 | BR-M01-01 (channel source 必填), BR-M01-02 (先建 Case) | InquiryReceived | [ ] |
| FR-0002 | problem-card-triage | M03 + A06 | Rewrite B' 殼 | BR-M03-01 (completeness gate), BR-M03-02 (AI escalation) | ProblemCardDrafted, ProblemCardConfirmed | [ ] |
| FR-0003 | auto-dispatch | M06 + M07 | Rewrite B' 殼 | BR-M06-NN (matching rules) | DispatchProposed | [ ] |
| FR-0004 | manual-dispatch-audit | M06 + M17 | Rewrite B' 殼 | BR-M06-NN (manual override) + BR-M17-NN (audit) | ManualDispatchAssigned, AuditLogWritten | [ ] |
| FR-0005 | technician-accept | M07 + M06 | Rewrite B' 殼 | BR-M06-NN (acceptance SLA = ADR-0045) | DispatchAccepted | [ ] |
| FR-0006 | onsite-photo | M08 + M09 | Rewrite B' 殼 | BR-M08-NN (arrival proof) + BR-M09-NN (photo checklist) | EvidenceUploaded | [ ] |
| FR-0007 | material-request | M10 + M15 | Rewrite B' 殼 | BR-M10-NN (material reservation) + BR-M15-NN (approval) | MaterialRequested, ApprovalRequested | [ ] |
| FR-0008 | scope-change | M15 + M17 + M16 (cross-module) | Rewrite B' 殼 — **cross-module FR 範例（roundtable SA 案例）** | BR-M15-NN (change-request object = ADR-0046) | ChangeRequestSubmitted | [ ] |
| FR-0009 | completion-sign | M08 + M09 | Rewrite B' 殼 | BR-M08-NN (completion checklist) | WorkOrderCompleted, EvidenceFinalized | [ ] |
| FR-0010 | reschedule-delay | M15 + M16 | Rewrite B' 殼 | BR-M15-NN (reschedule rule) | ScheduleChanged | [ ] |
| FR-0011 | consumer-payment | M11 | Rewrite B' 殼 | BR-M11-NN (payment proof) | PaymentReceived | [ ] |
| FR-0012 | monthly-settlement | M12 | Rewrite B' 殼 | BR-M12-NN (settlement export) | SettlementGenerated | [ ] |
| FR-0013 | dual-sign-dispute | M15 + M11 + M17 (cross-module) | Rewrite B' 殼 — **cross-module FR** | BR-M15-NN (dual sign) | DisputeOpened | [ ] |
| FR-0014 | refund | M11 + M15 | Rewrite B' 殼 | BR-M11-NN + BR-M15-NN (approval tier = ADR-0040) | RefundRequested, RefundApproved | [ ] |
| FR-0015 | warranty-claim | M13 + M10 | Rewrite B' 殼 | BR-M13-NN (warranty decision) | WarrantyClaimOpened | [ ] |
| **FR-0016** | **sla-2hr-soft** | **NFR matrix** (Q3=A 搬走) | **Move to NFR matrix** — `nfr_flavored: true` | （SLI/SLO 內容搬到 NFR matrix） | — | [ ] |
| FR-0017 | sop-draft-review | M20 + A10 | Rewrite B' 殼 | BR-M20-NN (SOP review) + BR-M20-NN (versioning) | SopDraftSubmitted, SopApproved | [ ] |
| FR-0018 | cs-takeover | A07 + M16 | Rewrite B' 殼 | BR-M16-NN (handoff rule = ADR-0048) | HumanHandoffTriggered | [ ] |
| FR-0019 | rbac-dynamic | M17 | Rewrite B' 殼 | BR-M17-NN (rbac four-tier = ADR-0042) | RbacChanged | [ ] |
| FR-0020 | audit-log-export | M17 | Rewrite B' 殼 | BR-M17-NN (audit export) | AuditLogExported | [ ] |
| FR-0021 | dashboard-reports | M19 | Rewrite B' 殼 | BR-M19-NN (KPI definition) | — (read-only) | [ ] |
| FR-0022 | consumer-tracking | M01 + M16 | Rewrite B' 殼 | BR-M16-NN (notification) | StatusUpdateSent | [ ] |
| FR-0023 | error-offline-page | M18 + NFR | Rewrite B' 殼（部分 NFR 可考慮搬）| BR-M18-NN (graceful degrade) | — | [ ] |
| **FR-0024** | **line-webhook-ha** | **NFR matrix** (Q3=A 搬走) | **Move to NFR matrix** — `nfr_flavored: true` | （SLI/SLO 搬 NFR） | — | [ ] |
| FR-0025 | multimodal-understanding | A08 + M09 | Rewrite B' 殼 | BR-M20-NN (multimodal policy) | MediaProcessed | [ ] |

### 統計

- Rewrite B' 殼：**23 條** (FR-0001~0015, 0017~0023, 0025)
- 搬 NFR matrix：**2 條** (FR-0016, FR-0024)
- cross-module FR (mapped_to 多個 M)：3 條 (FR-0008, FR-0013, 含跨 chatbot/erp 的 FR-0001~0006 等也是 multi-map)

---

## §2 新增 FR Outline — Phase I (estimated +18 條)

> 對應 final spec 的 A01-A12 / S M01-M06 / M02/M04/M07/M09/M10/M18/M20 缺漏。每條只列 outline，rewrite phase 詳寫。

### Chatbot 模組系列 (A01-A12 → 新 FR)

| FR ID (new) | Title (proposed) | mapped_to | Phase | 業主圈選 |
|:------------|:-----------------|:----------|:------|:--------|
| FR-0026 | chatbot-debounce-merge | A01 + M16 | I | [ ] |
| FR-0027 | brand-profile-resolver | A02 + M02 + M10 | I | [ ] |
| FR-0028 | skill-gated-react-agent | A03 + M20 + M17 | I | [ ] |
| FR-0029 | rag-pipeline-versioning | A04 + M20 + M18 | I | [ ] |
| FR-0030 | guardrails-output-validator | A05 + M20 + M15 | I | [ ] |
| FR-0031 | problemcard-bridge | A06 + M03 + S-M03 | I | [ ] |
| FR-0032 | human-handoff-form | A07 + M03 + M15 + M16 | I | [ ] |
| FR-0033 | eval-observability-pipeline | A09 + M20 + M19 | I | [ ] |
| FR-0034 | deployment-health-killswitch | A11 + M18 | I | [ ] |

### Sync 模組系列 (S M01-M06 → 新 FR)

| FR ID (new) | Title (proposed) | mapped_to | Phase | 業主圈選 |
|:------------|:-----------------|:----------|:------|:--------|
| FR-0035 | sync-intake-capture | S-M01 + M01 + M02 | I | [ ] |
| FR-0036 | sync-facts-master-update | S-M02 + M02 + M18 | I | [ ] |
| FR-0037 | sync-problemcard-conversion | S-M03 + M03 | I | [ ] |
| FR-0038 | sync-convert-to-workorder-human-gate | S-M04 + M04 + M11 + M05 | I | [ ] |
| FR-0039 | sync-dispatch-status-mirror | S-M05 + M06 + M07 | I | [ ] |
| FR-0040 | sync-evidence-writeback | S-M06 + M09 + M08 + M16 | I | [ ] |

### ERP 模組缺漏補充 (M02/M04/M07/M09/M10/M18/M20)

| FR ID (new) | Title (proposed) | mapped_to | Phase | 業主圈選 |
|:------------|:-----------------|:----------|:------|:--------|
| FR-0041 | customer-site-device-master | M02 | I | [ ] |
| FR-0042 | quote-internal-vs-external-view | M04 | I | [ ] |
| FR-0043 | m18-admin-config-workflow | M18 | I（**依賴 ADR-0067**） | [ ] |

### Phase I 新增小計：18 條

---

## §3 新增 FR Outline — Phase II (estimated +8 條)

| FR ID (new) | Title (proposed) | mapped_to | Notes | 業主圈選 |
|:------------|:-----------------|:----------|:------|:--------|
| FR-0044 | technician-onboarding-suspension | M07 + M17 | M07 完整 | [ ] |
| FR-0045 | technician-ap-settlement | M12 + M07 | M12 完整 | [ ] |
| FR-0046 | dispatcher-commission | M12 + M06 | M12 完整 | [ ] |
| FR-0047 | brand-monthly-settlement | M12 + M14 | M12 + M14 完整 | [ ] |
| FR-0048 | rma-quality-feedback-loop | M13 + M20 | M13 完整 | [ ] |
| FR-0049 | exception-approval-inbox | M15 完整 | depth | [ ] |
| FR-0050 | ai-governance-prd-trace | A12 + M20 | **A12 延 Phase II（Q2=C）** | [ ] |
| FR-0051 | sop-feedback-spiral-deep | A10 + M20 | A10 深化 | [ ] |

### Phase II 新增小計：8 條

---

## §4 總計

| 類別 | Count |
|:-----|:------|
| 既有 25 FR | 25 |
| 搬 NFR matrix（從 FR 移出） | -2 |
| 既有保留 + rewrite B' 殼 | 23 |
| Phase I 新增 | +18 |
| Phase II 新增 | +8 |
| **完整 FR 數（Phase II 結束時）** | **49** |

---

## §5 Cross-Module FR 治理規則（D1 IA 配合）

> 對應 roundtable D1 IA 決議：layer 主索引 + per-module reverse lookup。Cross-module FR 在多個 by-module reverse index 都會出現，**FR 本身只放在 `docs/analysis/fr/` 一份**（不複製）。

| Cross-module FR | 出現在哪些 by-module reverse index |
|:----------------|:-----------------------------------|
| FR-0008 scope-change | `M15.md`, `M17.md`, `M16.md` |
| FR-0013 dual-sign-dispute | `M15.md`, `M11.md`, `M17.md` |
| FR-0001 line-intake | `M01.md`, （chatbot index）`A01.md` |
| FR-0002 problem-card-triage | `M03.md`, `A06.md` |
| FR-0038 sync-convert-to-workorder-human-gate | `S-M04.md`, `M04.md`, `M11.md`, `M05.md` |
| ...其他 multi-map FR | （由 traceability matrix tool 自動聚合）|

---

## §6 Open Questions（給業主）

| # | 問題 | 為什麼問 | 建議 |
|:--|:-----|:---------|:-----|
| OQ-A3-1 | §1 mapping 有沒有錯誤對應？特別是 cross-module FR 的 mapped_to | 業主對業務邊界最熟 | （業主圈完再說） |
| OQ-A3-2 | §2/§3 新增 FR title 有沒有 ridiculous / 重複既有 FR 的？ | 命名一致性 | （業主圈完再說） |
| OQ-A3-3 | FR-0050 (A12 ai-governance) 確認延 Phase II 不延 Phase III/IV？ | 與 Q2=C 一致確認 | 延 Phase II（roundtable D3） |
| OQ-A3-4 | Phase II 新增 FR-0044~0051 是否現在就要寫 outline，還是等 Phase II 啟動再寫？ | 工作量平衡 | 等 Phase II 啟動再寫 outline，本表只列 placeholder |

---

## §7 Action Items (A3 detail phase, 待業主 review §1~§4 後啟動)

| # | Action | Owner | Priority | Depends |
|:--|:-------|:------|:---------|:--------|
| A3.1 | 業主 review §1 mapping + §2/§3 新增 FR outline，圈出需修正 | 業主 | P0 | (本表) |
| A3.2 | 23 條 FR rewrite B' 殼（套 `templates/fr-skeleton.md`） | `devteam-analyst` | P0 | A3.1 |
| A3.3 | FR-0016 / FR-0024 搬 NFR matrix（從 FR 目錄移出，NFR matrix 新增段落） | `devteam-analyst` + `devteam-arch` | P0 | A3.1 |
| A3.4 | Phase I 新增 18 條 FR 詳寫（套 fr-skeleton） | `devteam-analyst` | P0 | A3.1 |
| A3.5 | Phase II 新增 8 條 FR placeholder（只建檔，內容等 Phase II 啟動） | `devteam-analyst` | P1 | A3.1 |
| A3.6 | 跑 traceability matrix tool 生成 `docs/_index/traceability-matrix.md` 與 `docs/_index/by-module/M??.md` | `devteam-devops` | P0 | A3.2 + A3.4 |
| A3.7 | Test plan cascade（依新 FR 編號 + acceptance G/W/T 重生 test case） | `devteam-qa` | P1 | A3.6 |

---

**End of FR mapping skeleton**

> 業主圈完 §1~§4 後啟動 A3.2~A3.7。Total FR rewrite + 新增工作量約 5-8 小時，分多輪 session 完成。
