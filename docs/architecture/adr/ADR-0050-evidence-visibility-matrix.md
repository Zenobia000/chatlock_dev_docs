---
id: ADR-0050
title: Evidence 可見性矩陣 — 角色 × 案件生命週期 × action × attr_mask 四維權限
status: Accepted (PARTIAL_UPDATE 2026-05-28)
date: 2026-05-21
last_updated: 2026-05-28
source_trade_off: §F.3 AI-052 PAIN-POINTS-SUMMARY-2026-05-21.md
deciders: [業主]
accepted_date: 2026-05-22
related:
  - "./ADR-0042-rbac-four-tier-principle.md"
  - "./ADR-0051-evidence-retention-policy.md"
  - "./ADR-0067-m18-runtime-config-governance.md"
  - "../../analysis/fr/FR-0010.md"  # M07 site visit evidence
  - "../../analysis/fr/FR-0014.md"  # M11 refund evidence
  - "../../analysis/br/BR-CANCEL-005.md"
  - "../../analysis/br/BR-CANCEL-006.md"
  - "../../analysis/br/BR-CANCEL-007.md"
  - "../../analysis/br/BR-CANCEL-008.md"
  - 01-workorder-erp-final-spec-20260520.xlsx (M09 Evidence)
  - 01-workorder-erp-final-spec-20260520.xlsx#sheet-18 (AI-052)
pre_mortem: F4 (合規崩潰 — PII 外洩)
eternal_transient: Eternal RBAC (B3 + B5)
partial_update_history:
  - date: 2026-05-28
    update_type: PARTIAL_UPDATE
    update_reason: "Lane A critique 3/3 persona 共識（Architect / SA / DBA）：矩陣升維至 role × lifecycle_phase × action(view/edit/approve) × attr_mask 四維（BR-M17-01 強制）；補 IT support 臨時權限 time-boxed + audit；每列補 G/W/T acceptance；scope 屬性擴階層 {tenant, brand, project, household} for Phase III；column 級 PII classification + mask matrix；retention 改引用 ADR-0051。對齊 M07/M17 audit 邏輯 + FR-0010/FR-0014 + BR-CANCEL-005..008。"
    decided_by: 業主
    cascade_refs:
      - FR-0010
      - FR-0014
      - BR-CANCEL-005
      - BR-CANCEL-006
      - BR-CANCEL-007
      - BR-CANCEL-008
      - ADR-0042
      - ADR-0051
      - ADR-0067
---

> 
> **🔄 Migration Status (2026-05-28)**: `PARTIAL_UPDATE (Lane A critique done — 3/3 persona consensus)`
> **Reviewed against**: 2026-05-20 final spec (xlsx)
> **Reviewed on**: 2026-05-28
> **Critique merge report**: [`.claude/context/devteam/reviews/2026-05-28-adr-0050-critique/merge-report.md`](../../../.claude/context/devteam/reviews/2026-05-28-adr-0050-critique/merge-report.md)
> **Per ADR-0100 §1 classification** ([roundtable MoM](../../../.claude/context/devteam/meetings/2026-05-27-1130-final-spec-migration-strategy/MoM.md))
>
> **🛠 待 cascade 補強（per critique merge report 6 維度）**：
> 1. 矩陣升維：role × `lifecycle_phase` × `action(view/edit/approve)` × `attr_mask`（Architect: BR-M17-01 強制三維拆分）
> 2. 補 actor: IT support 臨時權限 (time-boxed + audit)（SA + Architect）
> 3. 每列補 G/W/T acceptance（SA：目前全自然語言 QA 無法套）
> 4. scope 屬性擴階層 `{tenant, brand, project, household}` for Phase III（SA）
> 5. column 級 PII classification + mask matrix（DBA）
> 6. retention 改引用 ADR-0051，DB 補 `(tenant_id, brand_scope, visible_until)` composite index + `closed_at` 月分區（DBA）
>
> Decision 主體（9 角色矩陣概念）**保留**；本 ADR 原地 update 為 v2 即可，**不需新 ADR 取代**。


# ADR-0050 — Evidence 可見性矩陣

## Status
Draft

## Context

Evidence（施工前後照片、客戶簽名、聊天記錄、發票）涉及 PII + 商業機密 + 法律憑據。不同角色該看到不同子集：
- 客戶不該看到平台成本拆分
- 師傅不該看到其他師傅的 Evidence
- 品牌商不該看到競品的 Evidence
- 稽核員可全看但唯讀

源自 Excel-01 sheet 18 AI-052；M09 Evidence。

## Decision（推薦）

**Evidence 可見性矩陣：角色 × 案件生命週期 × 屬性 scope**：

| 角色 | 可見 Evidence | 案件生命週期限制 | 屬性過濾 |
|------|--------------|----------------|---------|
| Customer | 自家工單的施工前後照片 + 完工簽名 | 結案後 90 天可查 | `customer_id == self` |
| Locksmith | 自己負責工單的全部 Evidence | 結案後 30 天可查 | `assigned_locksmith_id == self` |
| Customer Service | 經辦工單的全部 Evidence | 結案後 1y 內 | `created_by == self OR assigned == self` |
| Accounting | 全工單財務 Evidence（發票 / 收款證明 / 退款）+ 必要工單 Evidence | 永久（依 retention）| `tenant_id` 內 |
| Brand User | 自家品牌工單的 Evidence（不含其他品牌）| 結案後 1y 內 | `brand_scope` 過濾 |
| Supervisor | 全 tenant Evidence | 永久 | `tenant_id` |
| Auditor | 全 Evidence | 永久（唯讀）| `tenant_id` |
| Family Reviewer | SOP 入庫相關 Evidence（合約 4.4(d)）| 永久（唯讀）| `tenant_id` |
| AI Bot | **不主動暴露 Evidence URL 給對話**；可引用內部 ID 給 transfer_to_human | N/A | 與當前 conversation_id 綁定 |

## Alternatives Considered

### Option A — 全公開（所有角色看全部）
- 風險：F4 PII 外洩
- 個資外洩 + 商業機密外洩

### Option B — 全私有（僅平台 Supervisor 可看）
- 風險：F1 弱
- 品牌 / 師傅 / 客戶體驗差，無法自助查詢

## Consequences

**Positive**：
- 與 ADR-0042 RBAC 4 層 + tenant_id / brand_scope 整合
- 案件生命週期限制防止永久暴露
- 合約 4.4(d) 家族覆核員角色明文

**Negative**：
- 可見性 engine 複雜度 +20%
- 跨域 case（如客戶要求查保固歷史）需特殊路徑

**Mitigation**：
- 客戶查歷史走「客服代查」流程（不直接開放）
- BI 報表「Evidence 訪問 by role × case stage」異常偵測

## Pre-mortem Mapping

對應 §A F4。PII / 商業機密外洩是 F4 最大風險之一。

## Eternal/Transient Classification

- **Eternal**：§B3 RBAC 可見性矩陣 + §B5 Evidence
- **Transient**：UI 過濾實作（§C5）

## Acceptance Criteria
- [ ] 業主圈選：**✅ 推薦** / Option A / Option B
- [ ] Security + 主管 + Legal 簽核矩陣
- [ ] Backend RBAC engine 支援案件生命週期 + 屬性過濾
- [ ] PII retention 與 ADR-0051 保存期整合
- [ ] BI 報表「Evidence 訪問異常」監控
- [ ] AI 在對話中不主動暴露 Evidence URL（charter Forbidden 對齊）

## See also
- §F.3 AI-052 PAIN-POINTS-SUMMARY-2026-05-21.md
- Excel-01 sheet 18 / M09 Evidence / M17 Auth-Audit
- ADR-0042 RBAC 4 層
- ADR-0051 Evidence 保存期
- ADR-0028 charter（AI PII 邊界）
- ADR-0067 M18 runtime config governance（retention + mask matrix configurable plane）
- FR-0010 M07 site visit evidence emit
- FR-0014 M11 refund evidence emit
- BR-CANCEL-005..008 cancellation evidence audit rule
- 合約 4.4(d) 家族覆核員

---

## §v2 Body Update (PARTIAL_UPDATE 2026-05-28)

> Lane A critique 3/3 persona 共識（Architect / SA / DBA），業主 2026-05-28 接受 PARTIAL_UPDATE（不 SUPERSEDE — 9 角色矩陣概念保留，補強四維、IT support、G/W/T、scope 階層、PII mask、retention 引用）。
> Source: [`docs/governance/reviews/ADR-0050-lane-a-critique-2026-05-28.md`](../../governance/reviews/ADR-0050-lane-a-critique-2026-05-28.md)

### §v2.1 — 四維矩陣 (role × lifecycle_phase × action × attr_mask)

對齊 BR-M17-01「每個角色必須拆成 can-view、can-edit、can-approve；除 audited admin 外，不接受 all access」：

**Lifecycle phases**：

| Phase | 定義 |
|:------|:-----|
| `pre_dispatch` | PC 已建立 / 工單未派工 |
| `in_progress` | 派工後 / 完工前（含 onsite） |
| `pending_review` | 完工已上傳 evidence / 客戶或主管未驗收 |
| `closed_30d` | 結案 ≤ 30 天（active window） |
| `closed_30d_to_1y` | 結案 30 天 ~ 1 年（mid-archive） |
| `closed_1y_plus` | 結案 > 1 年（cold archive，per ADR-0051 retention rule） |

**Actions**：`view` / `edit` / `approve` / `download`（download 為 view 子集，受 PII mask 制約）

**Attr mask layers**：
- `pii_full`：客戶姓名 / 電話 / 地址 / 身分證 / 收件人簽名
- `pii_redacted`：客戶代號 + 區域；地址截至區為止
- `business_full`：成本 / 退款金額拆分 / 師傅單價
- `business_redacted`：總金額 only；不顯成本 / 拆分
- `technical_full`：施工照片 / serial / installer_id
- `technical_redacted`：施工縮圖 + watermark + 不含 serial

**主矩陣**（節錄；完整見 §v2.7 cascade ERD）：

| Role | Phase | View | Edit | Approve | PII Mask | Business Mask | Technical Mask | Scope Filter |
|:-----|:------|:-----|:-----|:--------|:---------|:--------------|:---------------|:-------------|
| Customer | in_progress | ✅ (own) | ❌ | ❌ | pii_full (self only) | business_redacted | technical_full | `customer_id == self` |
| Customer | closed_30d | ✅ | ❌ | ❌ | pii_full (self) | business_redacted | technical_full | 同上 |
| Customer | closed_30d_to_1y | ✅ (search only) | ❌ | ❌ | pii_full (self) | business_redacted | technical_redacted | 同上 + audit log |
| Customer | closed_1y_plus | ❌ (走 CS 代查) | ❌ | ❌ | — | — | — | 不直接訪問 |
| Locksmith | in_progress | ✅ (assigned) | ✅ (upload) | ❌ | pii_redacted | ❌ (不可看金額) | technical_full | `assigned_locksmith_id == self` |
| Locksmith | closed_30d | ✅ | ❌ | ❌ | pii_redacted | ❌ | technical_full | 同上 |
| Locksmith | closed_30d_to_1y | ❌ | ❌ | ❌ | — | — | — | 不可訪問 |
| CSM | pre_dispatch ~ closed_1y_plus | ✅ | ✅ (限自己工單) | ❌ | pii_full | business_redacted | technical_full | `created_by == self OR assigned == self` |
| Ops Supervisor | 全 phase | ✅ | ✅ | ✅ (退款/RMA) | pii_full | business_full | technical_full | `tenant_id` |
| Accounting | pre_dispatch ~ closed_1y_plus | ✅ (財務維度) | ✅ (限發票/退款) | ✅ (限 L2-L3) | pii_full | business_full | technical_redacted | `tenant_id` |
| Brand User | in_progress ~ closed_1y_plus | ✅ (自家品牌) | ❌ | ❌ | pii_redacted | business_redacted | technical_full | `brand_scope == self.brand` |
| Auditor | 全 phase | ✅ (read-only) | ❌ | ❌ | pii_full | business_full | technical_full | `tenant_id` |
| Family Reviewer | closed_30d ~ closed_1y_plus | ✅ (SOP 入庫 evidence only) | ❌ | ❌ | pii_redacted | ❌ | technical_redacted | `tenant_id` (合約 4.4(d)) |
| **IT Support** (new) | 全 phase | ✅ (time-boxed) | ❌ | ❌ | pii_redacted | ❌ | technical_full | time-boxed ≤ 4 hr + audit |
| AI Bot | conversation only | ❌ (不暴露 URL) | ❌ | ❌ | — | — | — | conversation_id 綁定 |

### §v2.2 — IT Support 臨時權限 (Lane A critique 補項)

IT support 為 troubleshooting 場景需臨時授權 evidence 訪問。規則：

| 維度 | 限制 |
|:----|:-----|
| **觸發** | 客戶 / CSM 報告問題 → CS Manager 開 ITSupport ChangeRequest (ADR-0046) |
| **時限** | ≤ 4 hr time-boxed（自動失效） |
| **可見範圍** | 與該 ticket 相關之 evidence only；不可全 tenant scan |
| **Audit** | 必填 `it_support_user_id`, `granted_by`, `granted_at`, `expires_at`, `ticket_id`, `evidence_ids_accessed[]` |
| **PII mask** | 強制 pii_redacted（不可看真名 / 電話 / 身分證） |
| **延長** | 需重新走 ChangeRequest approval（不可自行展期） |

### §v2.3 — Scope 屬性階層 (Phase III 鋪路)

對齊 M14 Partner Portal + 建商三維資料邊界：

```
tenant
  └─ brand_scope (per-brand subset)
       └─ project_scope (per builder project / Phase II 階層深一層)
            └─ household_scope (per unit / Phase III)
```

**規則**：
- Phase I：`{tenant, brand_scope}` 兩階即可
- Phase II：補 `project_scope`（建商 partner portal 跨 site/unit 場景）
- Phase III：補 `household_scope`（B2B SaaS multi-tenant 進階場景）

**Evidence row schema 必填**：`tenant_id`, `brand_scope`, `project_scope (nullable Phase I)`, `household_scope (nullable Phase I/II)`。

### §v2.4 — Column 級 PII Classification + Mask Matrix

對齊 ADR-PII-002（data minimization schema CI double defense）：

| Column | PII Class | View Allowed Roles (default) | Mask Strategy |
|:-------|:----------|:----------------------------|:--------------|
| `customer_name` | PII-L1 (high) | Customer (self) / CSM / Ops Supervisor / Auditor | pii_redacted → 姓 + 0 |
| `customer_phone` | PII-L1 | 同上 | last 4 digits only when redacted |
| `customer_address_full` | PII-L1 | 同上 | 至區為止 when redacted |
| `customer_id_number` | PII-L0 (critical) | Ops Supervisor / Accounting (限 RMA 場景) / Auditor | 永遠 redacted 顯示，原始走 RBAC + log |
| `signature_image` | PII-L1 | Customer (self) / CSM / Ops Supervisor / Auditor | 縮圖 + watermark when not full |
| `installer_id` | PII-L2 (mid) | Locksmith (self) / CSM / Ops Supervisor / Auditor | hash code when redacted |
| `cost_breakdown` | Business-L1 | Ops Supervisor / Accounting / Auditor | 完全隱藏 when not full |
| `serial_number` | Tech-L1 | Locksmith (self) / Brand User / Ops Supervisor / Auditor | last 4 digits when redacted |
| `installation_photo` | Tech-L2 | Locksmith / CSM / Customer (self) | watermark + 縮圖 when redacted |

**強制要求**：所有 Evidence 表 column 必須在 schema migration 標 `pii_class` metadata（ADR-PII-002 CI lint）。

### §v2.5 — Retention 引用 ADR-0051 + DB 索引

**Retention 政策**：細節走 [`ADR-0051 evidence-retention-policy`](./ADR-0051-evidence-retention-policy.md)，本 ADR 只負責「visibility」維度。

**DB 索引補強**：
- 複合索引 `(tenant_id, brand_scope, visible_until)` 加速 visibility query
- `closed_at` 月分區（partition by month）加速 cold archive query
- Evidence row 必填 `visible_until`（computed from retention rule）

### §v2.6 — M07/M17 audit 邏輯對齊

對齊 M07 site visit + M17 audit-trail：

**M07 邏輯改寫**（per FR-0010）：
- onsite evidence upload 必觸發 `EvidenceUploaded` event → emit 給 M17 audit log
- visibility 立即生效（不等批次同步）
- locksmith 上傳後立即可 view（in_progress phase）

**M17 audit 邏輯**：
- 每次 evidence access (view / download) 必寫 audit log row：`who / when / what (evidence_id) / why (context, e.g. ticket_id / case_id) / pii_mask_applied`
- 對 PII-L0 / PII-L1 access 觸發 BI 異常監控（如同一 CSM 1 小時內 access > 50 條）
- audit log retention ≥ 7 年（per ADR-0067 audit retention）

### §v2.7 — Cancellation Evidence 對齊 (BR-CANCEL-005..008)

對齊 ADR-0102 取消費分段 v2 + BR-CANCEL series：

| BR | Evidence 要求 | Visibility |
|:---|:--------------|:-----------|
| BR-CANCEL-005 | 取消理由 (reason_code) + 取消時間戳 + 取消方 actor | Customer (self) / CSM / Ops Supervisor / Auditor |
| BR-CANCEL-006 | S3 客戶不在場 → 師傅照片 + 時間戳 (GPS optional) | Locksmith (self) / CSM / Ops Supervisor / Auditor |
| BR-CANCEL-007 | 師傅 initiated cancel 不可抗力憑證（醫療單 / 警示通知 / 天氣警報） | Ops Supervisor / Accounting / Auditor (不對 customer / locksmith peer 開放) |
| BR-CANCEL-008 | 取消費 override audit log（CSM 覆寫金額 + 理由 + approver） | Ops Supervisor / Accounting / Auditor |

### §v2.8 — Acceptance Criteria (v2 G/W/T 範例)

```gherkin
# AC-50-01 客戶看自家工單 evidence (in_progress)
Given customer_id = C001 AND case_id = WO-001 (assigned_customer = C001) phase = in_progress
When customer fetch evidence
Then return list 含 施工前照片 + 簽名 (mask: technical_full, pii_full self)
  AND audit log emit "evidence_view: C001 viewed WO-001"

# AC-50-02 客戶看他人工單 evidence
Given customer_id = C001 AND case_id = WO-002 (assigned_customer = C002)
When customer fetch evidence
Then 403 forbidden AND audit log emit "scope_violation"

# AC-50-03 IT support 臨時權限
Given it_support user IT001 + ChangeRequest CR-100 approved time-boxed 4 hr
When IT001 query evidence within 4 hr (matching ticket_id in CR-100)
Then return list (mask: pii_redacted, business hidden)
  AND audit log emit "it_support_view: IT001 (granted_by CSM_X, expires 2026-05-28T16:00)"

# AC-50-04 IT support 過期
Given IT001 query at 4 hr + 1 min
Then 403 forbidden + expired AND audit log emit "it_support_expired"

# AC-50-05 closed_1y_plus 客戶查歷史
Given customer C001 query closed_1y_plus evidence
Then 403 forbidden + 提示「請聯絡客服代查」 AND emit cs_proxy_required event

# AC-50-06 AI 對話中查詢
Given conversation Conv-001 (customer C001) AND C001 詢問「我之前的施工照」
Then AI 不可暴露 evidence URL；可回「請至 [我的工單] 查詢，或我可以幫您轉客服」
  AND audit log emit "ai_evidence_redirect"
```

### §v2.9 — 影響的下游文件（v2 cascade）

| Doc | Impact |
|:---|:---|
| `docs/analysis/fr/FR-0010-site-visit-evidence.md` | AC 段補 evidence visibility scope filter + pii mask 規則對應 §v2.4 |
| `docs/analysis/fr/FR-0014-refund.md` | refund evidence 段對齊 §v2.4 column 級 mask + IT support 臨時權限 |
| `docs/analysis/br/BR-CANCEL-005..008` | 補 evidence visibility 對齊 §v2.7 |
| `docs/data/erd-m09.md` | Evidence 表加 `pii_class`, `visible_until`, `tenant_id`, `brand_scope`, `project_scope`, `household_scope`；複合索引 `(tenant_id, brand_scope, visible_until)` + `closed_at` 月分區 |
| `docs/api/openapi-m09.yaml` | evidence list endpoint 加 phase / scope / mask query params + 403 forbidden response code |
| `docs/qa/test-plan-m09.md` | ≥ 12 TC (4 維度 × 至少 3 scenario) 涵蓋 §v2.8 AC-50-01~06 |
| `docs/architecture/adr/ADR-0051-evidence-retention-policy.md` | cross-ref：visibility 維度 vs retention 維度分離治理 |

### §v2.10 — Acceptance Criteria (v2 補項)

- [x] Lane A critique 3/3 共識（Architect / SA / DBA）
- [x] 業主 2026-05-28 接受 PARTIAL_UPDATE
- [ ] FR-0010 / FR-0014 cascade (analyst)
- [ ] BR-CANCEL-005..008 evidence visibility 段對齊 (analyst)
- [ ] M09 ERD migration (design + dba): pii_class + visible_until + composite index + 月分區
- [ ] OpenAPI-m09 endpoint 升級
- [ ] QA 補 12 TC
- [ ] M17 audit log monitoring + BI 異常偵測 alarm rule
- [ ] IT Support ChangeRequest template (ADR-0046 cascade)
