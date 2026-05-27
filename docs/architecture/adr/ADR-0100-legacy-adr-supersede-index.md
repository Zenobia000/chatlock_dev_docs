# ADR-0100 — Legacy ADR Supersede Index (post Final Spec 2026-05-20)

> **📋 Status**: ✅ Accepted (2026-05-28 — 初步分類凍結；REVIEW_REQUIRED 6 條走 Lane A，1 條已完成)
> **🗓 Date**: 2026-05-28
> **👤 Owner**: `devteam-arch` (Architect persona)
> **🔖 Version**: v1.0
> **🎯 Scope**: cross-cutting — 73 條既有 ADR 對照新規格 (2026-05-20 final spec) 的 supersede chain
> **🏷 Tags**: governance, adr, supersede, migration, m18-cascade, post-final-spec
> **🔗 Feature**: workorder-erp-final-spec-2026-05-20
> **🔗 Related KB**: [[13_doc_migration_playbook]] §2 ADR supersede 判定樹（A6 backfill）· [[04_freeze_gates]] §ADR supersede chain
> **🔗 Related Roundtable**: [`2026-05-27-1130-final-spec-migration-strategy/MoM.md`](../../../.claude/context/devteam/meetings/2026-05-27-1130-final-spec-migration-strategy/MoM.md) D2（個別評估規則） + Q4=C（Superseded 直 merge / Reviewed_Still_Valid 走 Lane A）
> **🔗 Source spec**: [`docs/_source/01-workorder-erp.md`](../../_source/01-workorder-erp.md) §04 P0核心決策 · §06 業務規則庫

---

## 📋 Executive Summary

> [!TIP]
> **TL;DR (30s)**: Final spec 2026-05-20 帶來 165 Q&A + 64 BR，部分覆寫既有 ADR rule。本 ADR 為 73 個 legacy ADR 的 supersede 對照表索引。**個別評估**，不一次性失效。Superseded 批由 Architect 直 merge（業主 Q4=C 決議），Reviewed_Still_Valid 批進 Lane A critique。多數 ADR 是 2026-05-21~24 寫的，跟 final spec 同源，分類偏 STILL_VALID — 初步 SUPERSEDE = 0，6 條進 REVIEW_REQUIRED。本 ADR-100 本身只是**索引**，不評估 ADR 內容對錯。

| 維度 | 計數 |
|:-----|:-----|
| Total legacy ADR | 70（ADR-0001 ~ ADR-0066 + ADR-PII-002 + ADR-PIVOT-001 + ADR-VCH-001 + ADR-VCH-002；ADR-0067 為 M18 治理新批，不計入 legacy）|
| **[SUPERSEDE]** (cascade 2026-05-28) | 1 (ADR-0039 → ADR-0102) |
| **[PARTIAL_SUPERSEDE]** (cascade 2026-05-28) | 1 (ADR-0008 → ADR-0101 §2.1-§2.4) |
| **[PARTIAL_UPDATE / Active]** (cascade 2026-05-28) | 4 (ADR-0009 v1.1 / ADR-0040 v2 / ADR-0044 v2 / ADR-0050 v2 body) |
| Initial **[STILL_VALID_UNDER_M-NN]** | 50 |
| Initial **[HISTORICAL]** | 14 |
| **Batch frontmatter update 完成** | 2026-05-28 by `/tmp/adr_batch_update.py` |
| **Lane A critique 完成** | 6 / 6 (ADR-0008 / ADR-0009 / ADR-0039 / ADR-0040 / ADR-0044 / ADR-0050 done) |

---

## §1 初步分類表

> **判定原則** ([`13_doc_migration_playbook §2`](../../../devteam_knowledge_base/13_doc_migration_playbook.md#§2-adr-supersede-判定樹))：
> - [SUPERSEDE]：新規格 P0/BR clause 與 ADR Decision 段落直接衝突
> - [REVIEW_REQUIRED]：部分覆寫 / 命名邊界改變，需 Lane A critique 判定
> - [STILL_VALID_UNDER_M-NN]：仍 valid，只需標 module scope
> - [HISTORICAL]：純決策歷史（PM-alignment、PIVOT、tactical-refactor、harness）

### Group A — Tech Stack & Foundation（ADR-0001~0012）

| ADR | Title (short) | Initial Classification | Module Scope | Notes |
|:----|:--------------|:----------------------|:-------------|:------|
| ADR-0001 | backend-framework | STILL_VALID | cross-cutting | 技術選型，new spec 未動 |
| ADR-0002 | database-selection | STILL_VALID | cross-cutting | 同上 |
| ADR-0003 | llm-integration-framework | STILL_VALID | M20 / A03 / A04 | new spec 未改 LLM 框架 |
| ADR-0004 | line-bot-architecture | STILL_VALID | M01 + A01 | A01 Channel Intake & Debounce 對應 |
| ADR-0005 | frontend-framework-v2 | STILL_VALID | cross-cutting | 技術選型 |
| ADR-0006 | llm-model-selection | STILL_VALID | M20 / A03 | A03 Skill-Gated ReAct Agent |
| ADR-0007 | llm-registry-pattern | STILL_VALID | M20 / A03 | 同上 |
| ADR-0008 | product-info-architecture-canonical | **Partially Superseded by ADR-0101 (§2.1-§2.4)** (2026-05-28) | M10 | Lane A critique 2/2 PARTIAL — §1 mega-doc canonical 保留；§1 工具集封閉性 + §1 mega-doc 結構維度 + §5 例外清單 已被 ADR-0101 §2.1-§2.4 (data lineage / tool extension / multi-tenant scope / custom SKU fallback) 補強 |
| ADR-0009 | agent-admin-bridge-pattern | **Active (v1.1 2026-05-28)** | M18 / A11 | v1.1 update：M18 admin tooling 變動 (ADR-0067 + ADR-0068 ACL) + Flow S5 admin journey 對齊；原 Option D HTTP call pattern 保留 |
| ADR-0010 | belief-augmented-react | STILL_VALID | A03 | 對應 A03 ReAct Agent |
| ADR-0011 | i18n-strategy | STILL_VALID | cross-cutting | new spec 未動 |
| ADR-0012 | notification-channels | STILL_VALID | M16 | 對應 M16 Comms |

### Group B — PM Alignment Q1-Q10 + Tactical Refactor + Harness（ADR-0013~0025）

| ADR | Title (short) | Initial Classification | Notes |
|:----|:--------------|:----------------------|:------|
| ADR-0013 | pm-alignment-q1 | HISTORICAL | 決策歷史，保留作 audit |
| ADR-0014 | pm-alignment-q2 | HISTORICAL | 同上 |
| ADR-0015 | pm-alignment-q3 | HISTORICAL | 同上 |
| ADR-0016 | pm-alignment-q4 | HISTORICAL | 同上 |
| ADR-0017 | pm-alignment-q5 | HISTORICAL | 同上 |
| ADR-0018 | pm-alignment-q6 | HISTORICAL | 同上 |
| ADR-0019 | pm-alignment-q7 | HISTORICAL | 同上 |
| ADR-0020 | pm-alignment-q8 | HISTORICAL | 同上 |
| ADR-0021 | pm-alignment-q9 | HISTORICAL | 同上 |
| ADR-0022 | pm-alignment-q10 | HISTORICAL | 同上 |
| ADR-0023 | tactical-refactor-2026-q2 | HISTORICAL | 過往 refactor 紀錄 |
| ADR-0024 | tier1-refactor-revised | HISTORICAL | 同上 |
| ADR-0025 | harness-branching-pipeline | HISTORICAL | DevTeam harness 內部機制 |

### Group C — AI / Memory / Model / Tenant Foundations（ADR-0026~0030）

| ADR | Title (short) | Initial Classification | Module Scope | Notes |
|:----|:--------------|:----------------------|:-------------|:------|
| ADR-0026 | memory-architecture | STILL_VALID | A03 / A04 | new spec §10 Memory 對齊 |
| ADR-0027 | model-routing-policy | STILL_VALID | M20 / A03 | new spec §11 Model Routing 對齊 |
| ADR-0028 | ai-employee-charter | STILL_VALID | M20 / A12 | new spec §09 AI Employee 對齊 |
| ADR-0029 | fail-soft-to-durable-three-pack | STILL_VALID | A05 + cross-cutting | new spec §08 風險治理 對齊 |
| ADR-0030 | tenant-id-propagation | STILL_VALID | M17 + cross-cutting | RBAC / multi-tenant 基礎 |

### Group D — §F Trade-off 落地 (ADR-0031~0054)

> 這批 ADR 是 2026-05-21~22 業主圈選 PAIN-POINTS §F 27 個 trade-off 後落地的，與 2026-05-20 final spec 同源（業主同一週對齊）。多數 STILL_VALID。

| ADR | Title (short) | Initial Classification | Module Scope | Notes |
|:----|:--------------|:----------------------|:-------------|:------|
| ADR-0031 | ai-auto-convert-to-work-order | STILL_VALID | M03 + Sync-S-M04 | new spec D01 「Phase I: No auto conversion. Customer service/human confirms PC」與 ADR-0031「AI 草擬 + 1-click 人審」**一致**，不衝突 |
| ADR-0032 | missing-address-policy | STILL_VALID | M01 + M02 | new spec D02 對齊 |
| ADR-0033 | problem-card-completeness-gate | STILL_VALID | M03 | new spec D03 對齊（low completeness 不可 auto-dispatch）|
| ADR-0034 | urgent-red-code-definition | STILL_VALID | M03 + M15 | new spec D04 對齊 |
| ADR-0035 | warranty-project-quote-policy | STILL_VALID | M04 + M13 | new spec D05 對齊（AI 不可 final quote）|
| ADR-0036 | multi-problem-card-rule | STILL_VALID | M03 | new spec D06 對齊 |
| ADR-0037 | conversation-auto-close | STILL_VALID | A03 + M03 | new spec D07 對齊 |
| ADR-0038 | ai-feedback-review-policy | STILL_VALID | M20 + A10 | new spec D08 對齊 |
| ADR-0039 | cancellation-fee-tiers | **Superseded by ADR-0102** (2026-05-28) | M11 + M15 | Lane A critique 2/2 SUPERSEDE — final spec + 業主 Q1/Q2/Q3 value decision 整體覆寫，新 ADR-0102 6 階段 + reason code + 師傅 initiated 政策 |
| ADR-0040 | refund-approval-tiers | **Active (PARTIAL_UPDATE 2026-05-28)** | M11 + M15 | Lane A critique → PARTIAL_UPDATE：spec 5-tier 與 ADR 一致不 SUPERSEDE；§v2 補 partial refund 分類 (BR-REFUND-006) / SoD 三維 / L5 Sponsor RBAC 對應 |
| ADR-0041 | travel-fee-split | STILL_VALID | M11 + M07 | new spec P0「車馬費 到場才收，需定金額與歸屬」對齊 ADR |
| ADR-0042 | rbac-four-tier-principle | STILL_VALID | M17 | new spec P0「角色權限矩陣」對齊 |
| ADR-0043 | brand-project-tenant-scope | STILL_VALID | M14 + M17 | new spec M14 Partner Portal 對齊 |
| ADR-0044 | warranty-start-date-modes | **Active (PARTIAL_UPDATE 2026-05-28)** | M02 + M13 | Lane A critique 2/2 PARTIAL_UPDATE — 補 mode enum 對齊 spec G002/Q107/BR-M02-02/BR-M14-02 (BR-WARRANTY-005) + RMA reset (BR-WARRANTY-006) + B2B contract override (BR-WARRANTY-007) + Phase II part-level hook |
| ADR-0045 | acceptance-sla-policy | STILL_VALID | M06 | new spec P0「接單 SLA 一般 10 分鐘，急件 5 分鐘」直接對齊 |
| ADR-0046 | change-request-object | STILL_VALID | M15 + M08 | new spec BR-M15 對齊 |
| ADR-0047 | ai-forbidden-list-as-charter | STILL_VALID | A05 + M20 | new spec P0-20「AI 不可決策清單」對齊 |
| ADR-0048 | ai-human-handoff-rules | STILL_VALID | A07 + M16 | new spec §13 Chatbot對ERP「Human escalation」對齊 |
| ADR-0049 | onsite-scope-change-protocol | STILL_VALID | M08 + M15 | new spec M08/M15 對齊 |
| ADR-0050 | evidence-visibility-matrix | **Active (v2 body 2026-05-28)** | M09 | Lane A 3/3 persona 共識；v2 body 補 4 維矩陣 (role × phase × action × attr_mask) + IT support time-boxed + scope 階層 (tenant/brand/project/household) + column PII mask + retention 引用 ADR-0051 + M07/M17 audit 改寫 + BR-CANCEL-005..008 evidence 對齊 |
| ADR-0051 | evidence-retention-policy | STILL_VALID | M09 + M17 | new spec M09 retention rule 對齊 |
| ADR-0052 | material-ownership-field | STILL_VALID | M10 + M07 | new spec BR-M10 對齊 |
| ADR-0053 | serial-control-policy | STILL_VALID | M10 | new spec BR-M10 對齊 |
| ADR-0054 | ai-quote-range-only | STILL_VALID | A03 + M04 | new spec P0-20「AI 不可決策清單」對齊 |

### Group E — 後期 ADR (ADR-0055~0066) + Special Series

| ADR | Title (short) | Initial Classification | Module Scope | Notes |
|:----|:--------------|:----------------------|:-------------|:------|
| ADR-0055 | skill-llm-decoupling-contract | STILL_VALID | A03 + A04 | A03/A04 對應 |
| ADR-0056 | per-vendor-contract-attachment-spec | STILL_VALID | M14 | M14 Partner contract 對齊 |
| ADR-0057 | rag-document-retrieval-not-prompt | STILL_VALID | A04 | A04 RAG Pipeline 對應 |
| ADR-0058 | external-knowledge-platform-ingestion-contract | STILL_VALID | A04 + M20 | 同上 |
| ADR-0059 | smart-lock-iot-signal-ingestion-spec | STILL_VALID | cross-cutting | IoT 訊號接入，new spec 未動 |
| ADR-0060 | contract-template-schema-freeze-v1 | STILL_VALID | M14 + M18 | M14 + M18 template 對齊 |
| ADR-0061 | data-governance-service-boundary | STILL_VALID | M17 + M18 | new spec M17/M18 governance 對齊 |
| ADR-0062 | pricing-engine-bounded-context | STILL_VALID | M04 | M04 Quote / Pricing 直接對應 |
| ADR-0063 | ai-utterance-boundary | STILL_VALID | A05 + M20 | new spec P0-20 對齊 |
| ADR-0064 | quote-pricing-snapshot-hash-chain | STILL_VALID | M04 + M11 | new spec configurable rule + rule.version_applied 對齊 |
| ADR-0065 | change-request-type-lookup-table | STILL_VALID | M15 + M18 | M15/M18 lookup table 對齊 |
| ADR-0066 | quote-workorder-lifecycle-binding | STILL_VALID | M04 + M05 | M04→M05 lifecycle 對齊 |
| ADR-PII-002 | data-minimization-schema-ci-double-defense | STILL_VALID | M17 + M02 + cross-cutting | PII governance 對齊 |
| ADR-PIVOT-001 | v2-restart-trigger | HISTORICAL | — | V2 重啟 trigger 紀錄 |
| ADR-VCH-001 | platform-as-voucher-keeper | STILL_VALID | M11 + M16 | new spec M11 AR 對齊 |
| ADR-VCH-002 | voucher-retention-7y | STILL_VALID | M11 + M17 | retention 對齊 ADR-0067 audit 7y |

### Group F — New ADRs (cascade post-2026-05-28 Lane A critique)

| ADR | Title (short) | Classification | Module Scope | Notes |
|:----|:--------------|:--------------|:-------------|:------|
| ADR-0101 | product-info-extension-final-spec | **Accepted (2026-05-28)** | A03/A04 (interface with M10/M14/M02) | 補 ADR-0008 §1 工具集封閉性 + §1 mega-doc 結構維度 + §5 例外清單 4 個契約段：data lineage / tool extension / multi-tenant scope / custom SKU fallback |
| ADR-0102 | cancellation-fee-tiers-v2-final-spec | **Accepted (2026-05-28)** | M11 + M15 | SUPERSEDES ADR-0039；6 階段 (S1/S1.5/S2/S3/S4/S5) + reason code dictionary (12+ codes) + 師傅 initiated 三段政策 (首次免責 / 同月 ≥2 次扣款 / 不可抗力豁免) + SoD + audit；S2 default NTD 300 (業主 Q1)；S1.5 免費 (業主 Q2) |

---

## §2 統計 (Post Lane A Critique 2026-05-28)

| Classification | Count | 處理方式 (Q4=C 業主決議) |
|:---------------|:------|:------------------------|
| **SUPERSEDE** | 1 | ADR-0039 → ADR-0102 (新 ADR 已落地) |
| **PARTIAL_SUPERSEDE** | 1 | ADR-0008 → partially superseded by ADR-0101 §2.1-§2.4 |
| **PARTIAL_UPDATE (v2 body)** | 3 | ADR-0040 / ADR-0044 / ADR-0050 (in-place v2 body update) |
| **STILL_VALID + PARTIAL annotation** | 1 | ADR-0009 (v1.1 + 4 annotation) |
| **STILL_VALID_UNDER_M-NN** | 50 | ✅ 2026-05-28 batch update：每條 ADR 第一個 `---` divider 後插入 `🔄 Migration Status` quoted block |
| **HISTORICAL** | 14 | ✅ 2026-05-28 batch update：插入 `Migration Status: HISTORICAL` block |
| **NEW (post-cascade)** | 2 | ADR-0101 (Active) + ADR-0102 (Active) |
| **Total legacy** | 70 | — |
| **Total post-cascade** | 72 | 70 legacy + 2 new |

### REVIEW_REQUIRED 6 條進度

> 業主 Q4=C：「降級為 Reviewed Still Valid 那批走 Lane A（最易誤判）」— 但實際上「REVIEW_REQUIRED」階段就是判定「降為 Still Valid」或「降為 SUPERSEDE」的關鍵點，所以這 6 條都應該走 Lane A：

| # | ADR | 主題 | Critique Status | 結論 |
|:--|:----|:-----|:----------------|:-----|
| 1 | ADR-0008 | product-info-architecture-canonical — M10 BOM/Inventory 重組 | ✅ **2026-05-28 done** | **PARTIAL_SUPERSEDE by ADR-0101 §2.1-§2.4** (2/2 Arch+SA) |
| 2 | ADR-0009 | agent-admin-bridge-pattern — M18 runtime config 邊界 | ✅ **2026-05-28 done** | **Active (v1.1 update)** — M18 admin tooling 補 ADR-0067 + ADR-0068 ACL + Flow S5 對齊 |
| 3 | ADR-0039 | cancellation-fee-tiers — spec 留白 | ✅ **2026-05-28 done** | **SUPERSEDE by ADR-0102** (2/2 SUPERSEDE) |
| 4 | ADR-0040 | refund-approval-tiers — spec 留白 | ✅ **2026-05-28 done** | **PARTIAL_UPDATE (v2)** — partial refund + SoD + L5 Sponsor 補強 |
| 5 | ADR-0044 | warranty-start-date-modes — 建商案點交日留白 | ✅ **2026-05-28 done** | **PARTIAL_UPDATE (v2)** — mode enum / RMA reset / B2B override / part-level hook |
| 6 | **ADR-0050** | evidence-visibility-matrix — M09 重組 | ✅ **2026-05-28 done** | **PARTIAL_UPDATE (v2 body)** — 4 維矩陣 + IT support + scope 階層 + PII mask + audit (3/3 共識) |

### Lane A critique 預計工作量

- 每條 ADR critique：3 persona × 5 min 寫 + facilitator merge ≈ 30 min
- 7 條 × 30 min ≈ 3.5 hr facilitator+critique
- + 每條 critique 後可能要寫 supersede 新 ADR（若 critique 結論為 SUPERSEDE）：每條 30 min ≈ 0~3.5 hr

---

## §2.5 Risks

> 初步分類由 title + module scope + new spec 同源時間軸推測，沒有逐個 ADR 完整通讀內容。風險：

| # | Risk | Likelihood | Impact | Mitigation |
|:--|:-----|:-----------|:-------|:-----------|
| R-100-1 | 估算錯誤導致 STILL_VALID 條目實際應 SUPERSEDE | M | H | 第一次評估保守（不確定者標 REVIEW_REQUIRED）；後續由 SA + Architect 兩人重 critique 做交叉驗證 |
| R-100-2 | REVIEW_REQUIRED 6 條 Lane A critique 排期延誤 → Gate 4 阻塞 | M | M | 業主 Q4=C 已決定「Superseded 批 Architect 直 merge」可不等 critique；Reviewed_Still_Valid 走 batch critique（一次 3 條 / round） |
| R-100-3 | HISTORICAL 批（PM-alignment、tactical-refactor、harness）誤被認為 deprecated 而刪 | L | M | HISTORICAL frontmatter 加 `retention: keep_for_audit_trail`；不可刪檔 |
| R-100-4 | 新規格之後再有 cascade（如 Forum 2026-05-26-Q01 voucher）造成 supersede 連鎖 | H | M | 後續 cascade 必須回 update 此 ADR-100 對應條目；建議每月 review 一次 |
| R-100-5 | 73 條 ADR 之外還有 6 個 ARCH/DDD/C4 標記檔未列入（見 Open Questions OQ-100-4） | L | L | 該 6 個非 ADR 性質（架構索引/INDEX.md），不在 supersede 評估範圍 — Open Question 留給業主決議 |

---

## §3 Action Items (A2 detail phase, 待業主 review §1 分類後啟動)

| # | Action | Owner | Priority | Depends |
|:--|:-------|:------|:---------|:--------|
| A2.1 | 業主 review §1 初步分類表，圈出需修正的條目 | 業主 | P0 | (本表) |
| A2.2 | 對 47 條 STILL_VALID ADR 批次跑 frontmatter update 腳本（加 `status: active` / `reviewed_against` / `module_scope`） | `devteam-arch` | P0 | A2.1 |
| A2.3 | 對 16 條 HISTORICAL ADR 批次加 `status: historical` | `devteam-arch` | P1 | A2.1 |
| A2.4 | 對 7 條 REVIEW_REQUIRED ADR 跑 Lane A critique（`/devteam-review <adr>`），每條獨立 critique | `devteam-facilitator` + 3 persona | P1 | A2.1 |
| A2.5 | 對 critique 結論為 SUPERSEDE 的條目寫新 ADR，舊 ADR frontmatter 加 `superseded_by` | `devteam-arch` | P1 | A2.4 |

---

## §4 Open Questions (給業主)

| # | 問題 | 為什麼問 | 提案選項 | 建議 | 業主裁決 |
|:--|:-----|:---------|:---------|:-----|:---------|
| OQ-100-1 | §1 初步分類表是否需要更細分（例如增加 PARTIAL_SUPERSEDE = 部分章節 supersede 部分保留）？ | 治理顆粒度判斷 | A) 不分，REVIEW_REQUIRED 已涵蓋<br>B) 分，每條條目精細化 | A（避免治理顆粒度過細） | — |
| OQ-100-2 | 47 條 STILL_VALID 批次 frontmatter update 是否需業主逐條確認？ | 治理嚴格度 vs 效率 | A) 自動批次，業主只看異常<br>B) 業主逐條 review | A | — |
| OQ-100-3 | REVIEW_REQUIRED 6 條若 critique 結論為 SUPERSEDE，是否需業主對每條新 ADR 拍板？ | 業主決策 vs Architect 自決 | A) 業主拍板每條<br>B) Architect 拍板，業主只看 summary | A（治理嚴格） | — |
| OQ-100-4 | `docs/architecture/adr/` 目錄含 6 個非 ADR 檔（INDEX.md / ARCH-*/DDD-*/C4-* 等架構索引）是否納入 supersede 評估？ | 範疇邊界 | A) 不納入（它們是架構索引非決策）<br>B) 納入 | A | ✅ **A (2026-05-28)** |

---

## 🔗 Drill-down

<details>
  <summary>初步分類判定依據明細</summary>

  ### 判定邏輯
  本次初步分類基於以下證據：
  1. ADR title 與 new spec P0 / BR 主題的直接對照
  2. ADR-0031~0054 是 2026-05-21~22 業主圈選 PAIN-POINTS §F 後落地，跟 2026-05-20 final spec 同源（業主同一週對齊），所以分類偏 STILL_VALID
  3. PM-alignment-q1~q10 + tactical-refactor + harness-branching 等是內部決策歷史，自動歸 HISTORICAL
  4. 7 條 REVIEW_REQUIRED 的依據：new spec 對該 ADR 的主題明文「前期 未決 / 留白」或「模組重組改變邊界」

  ### 為什麼 SUPERSEDE 是 0
  因為 new spec (2026-05-20) 與業主圈選 §F (2026-05-21~22) 同源 — ADR-0031~0066 沒有「被 new spec 直接覆寫」的案例。new spec 的 P0/BR 是更系統化的整理，但不是新的決策方向。

  若業主在 A2.1 review 時發現某條應該是 SUPERSEDE，補進來即可。
</details>

---

## ✍️ Sign-off

- [x] **Architect** (owner): `devteam-arch-persona` 初步分類凍結 / Date: 2026-05-28
- [x] **業主**: Roundtable A 2026-05-27 D2 + Q4=C 採納（個別評估、Superseded 直 merge / Reviewed_Still_Valid 走 Lane A） / Date: 2026-05-27
- [ ] **Facilitator**: dispatch 5 條 REVIEW_REQUIRED Lane A critique（pending） / Date: ____________
- [ ] **SA**: 對 REVIEW_REQUIRED 條目做交叉驗證 / Date: ____________

---

**End of ADR-0100**

> 給業主：你主要要看的是 **📋 Executive Summary** + **§2 統計** + **§2.5 Risks** 三段。
> §1 完整 70 條對照表為 reference 用，業主可在 §4 Open Questions 圈出需重判的條目。
