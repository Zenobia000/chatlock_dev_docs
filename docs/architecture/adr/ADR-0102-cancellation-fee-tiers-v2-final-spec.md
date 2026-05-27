---
id: ADR-0102
title: 取消費分段 v2 — 6 階段 + reason code dictionary + 師傅 initiated 政策（final spec 2026-05-20 對齊）
status: Accepted
date: 2026-05-28
supersedes: ADR-0039
deciders: [業主 (2026-05-28 value decision)]
related:
  - "./ADR-0039-cancellation-fee-tiers.md"  # superseded
  - "./ADR-0040-refund-approval-tiers.md"   # partial refund cascade
  - "./ADR-0041-travel-fee-split.md"        # 車馬費歸屬
  - "./ADR-0042-rbac-four-tier-principle.md"
  - "./ADR-0045-acceptance-sla-policy.md"   # 師傅 initiated cancel penalty
  - "./ADR-0046-change-request-object.md"   # 金額變更走 CR
  - "./ADR-0049-onsite-scope-change-protocol.md"  # S5 partial 對齊
  - "./ADR-0050-evidence-visibility-matrix.md"    # 客戶不在場 evidence
  - "./ADR-0066-quote-workorder-lifecycle-binding.md"  # quote_version
  - "./ADR-0067-m18-runtime-config-governance.md"  # configurable plane
  - 01-workorder-erp-final-spec-20260520.xlsx#sheet-04 (P0)
  - 01-workorder-erp-final-spec-20260520.xlsx#sheet-08 (Phase II Finance)
  - 01-workorder-erp-final-spec-20260520.xlsx#sheet-15 (M15 Exception)
source_trade_off: docs/_source/01-workorder-erp.md §04 P0 (row 143) + §08 P2-06/P2-07 + §15 M15
pre_mortem: F4 (合規崩潰) + F1 (顆粒度太粗)
eternal_transient: Eternal (6 階段骨架 + override + audit + reason code dict + 師傅 initiated 政策) / Transient (具體金額 configurable per brand via ADR-0067)
---

# ADR-0102 — 取消費分段 v2（6 階段 + reason code dictionary + 師傅 initiated 政策）

> **📋 Status**: ✅ Accepted (2026-05-28 業主 value decision Q1/Q2/Q3)
> **🗓 Date**: 2026-05-28
> **👤 Owner**: `devteam-arch` (Architect persona)
> **🔖 Version**: v2
> **🎯 Scope**: M11 AR + M15 Exception (cancellation fee policy + audit + reason code lookup)
> **🏷 Tags**: cancellation-fee, refund-ledger, sod, audit, configurable, m11, m15
> **🔗 Feature**: workorder-erp-final-spec-2026-05-20
> **🔗 Supersedes**: [`ADR-0039`](./ADR-0039-cancellation-fee-tiers.md) (5 階段 + S2 = 0 + 師傅 initiated 未提)
> **🔗 Source spec**: [`docs/_source/01-workorder-erp.md`](../../_source/01-workorder-erp.md) §04 P0 (row 143) + §08 P2-06/P2-07 + §15 M15
> **🔗 Lane A critique**: [`docs/governance/reviews/ADR-0039-lane-a-critique-2026-05-28.md`](../../governance/reviews/ADR-0039-lane-a-critique-2026-05-28.md) (2/2 SUPERSEDE)
> **🔗 業主 value decision**: [`.claude/context/devteam/value-decisions-2026-05-28.md`](../../../.claude/context/devteam/value-decisions-2026-05-28.md) Q1 / Q2 / Q3

---

## 📋 Executive Summary

> [!TIP]
> **TL;DR (30s)**: ADR-0039 5 階段表 + S2 = NTD 0 + 缺師傅 initiated 政策被 final spec 2026-05-20 與業主 2026-05-28 value decision 整體覆寫。新 ADR 改 6 階段（拆出 S1.5「已確認未派工」獨立階段），**S2 default = NTD 300**（30% 案件單價門檻、業界類比 Uber/Foodpanda 50-100 元行政成本），**S1.5 免收費**（客戶取消未占師傅資源），新增 **師傅 initiated cancel 政策**（首次免責 + 同月 ≥2 次扣款 + 不可抗力憑證明免責），補完整 **reason code dictionary**（business / customer / technician / system 四向分類）。全階段客服可覆寫 + audit log 保留 ADR-0039 v1 已有機制。Configurable 金額透過 ADR-0067 M18 runtime config plane 治理。

| 維度 | 摘要 |
|:---|:---|
| **🎯 Decision** | 6 階段 (S1/S1.5/S2/S3/S4/S5) + reason code dictionary + 師傅 initiated 政策 + SoD + audit |
| **🤔 Why** | spec 顆粒度由 5 階段擴為 6 階段；S2 金額方向相反；新增「customer not onsite」「technician initiated」「unpaid_no_response」等情境 ADR-0039 未覆蓋 |
| **🚀 Status** | ✅ Accepted (2026-05-28) |
| **📊 Reversibility** | 半可逆（金額透過 ChangeRequest configurable；階段骨架 / reason code enum / 師傅 initiated 政策變更需新 ADR） |
| **🎯 下一步** | analyst 寫 BR-M15-CANCEL-01~10 + FR-0010 / FR-0014 G/W/T 對齊；design 寫 M18 schema for cancellation_reason_codes |

---

## 🎯 Context

- **觸發此決策的情境**：
  - ADR-0039 v1 (2026-05-22 業主拍板) 與 final spec 2026-05-20 §08 P2-06/P2-07 階段表發生兩個直接衝突：S2「已派工未出發 = NTD 0」vs spec「一般取消費 NTD 300-500」金額方向相反；「已確認未派工」階段 ADR 併入 S1 vs spec 顯式拆出獨立階段。
  - Lane A critique 2026-05-28（BA + PM）2/2 SUPERSEDE：spec 引入「customer_not_onsite」「technician_initiated_cancel」「unpaid_no_response」等取消情境 ADR-0039 未覆蓋，且 M15 異常核准 sheet 已 Accepted。
  - 業主 2026-05-28 value decision Q1/Q2/Q3 對三個關鍵裁決點拍板，需新 ADR 取代 v1 並補完整 reason code dictionary + 師傅 initiated 政策。
- **業務限制**：
  - 台灣居家修繕業實況：案件單價 NTD 1500-3000；取消費 ≤ 30% 案件單價可在 B2C 不引發大量客訴（業界類比 Uber/Foodpanda 行政取消費 NTD 50-100 仍可接受）。
  - 師傅生態為半獨立：硬扣每次都罰會逼師傅跳家、不扣會被惡意刷單利用；業界混合做法為首次免責 + 累犯扣款 + 不可抗力豁免。
  - Phase II finance scope freeze 倒推 V1 預設金額拍板期 ≤ 2026-05-30。
- **技術限制**：
  - 6 階段需 backend state machine 自動推算（不依賴 AI / 客服人工）。
  - reason code enum 必須 configurable（spec Q094「不可 hardcode money 或 refund rules」），走 ADR-0067 M18 config plane。
  - audit log SoD 三維（initiator / approver / executor）必須顯化，符合 BR-M17-01。
- **相關 NFR**：
  - **Auditability**：每筆 cancellation 必須留 audit trail（who / when / what diff / why / evidence_ids）；retention 對齊 ADR-VCH-002 7y。
  - **Configurability**：金額 / reason code 中文文案 / 客服覆寫門檻可在 admin UI 改，staged rollout (per ADR-0067) 5% → 50% → 100%。
  - **Correctness**：師傅 initiated cancel 不可被誤計算客戶取消費；客戶不在場 evidence (GPS + timestamp) 必填 (per BR-M08-01)。

---

## 📐 Decision Drivers

| Priority | Driver | Weight | Reference |
|:---:|:---|:---|:---|
| 1 | 合規 / Audit — 取消費爭議引發法務糾紛是 §A F4 | high | [[06_quality_attributes_catalog]] §1.4 |
| 2 | 顆粒度 — 階段切分必須對齊 spec 不可粗於 spec | high | Lane A critique §A |
| 3 | 客戶體驗 — S2 金額避免引發大量客訴 | high | 業主 value decision Q1 rationale |
| 4 | 師傅生態 — 不破壞半獨立師傅供給穩定性 | high | 業主 value decision Q3 rationale |
| 5 | Configurability — 金額 per brand 差異化能力 | medium | ADR-0067 §M18 BR-M18-01 |
| 6 | Reversibility — 金額調整無需 new ADR | medium | ADR-0046 ChangeRequest |

---

## 🔍 Options Considered

### Option A — 沿用 ADR-0039 5 階段 + S2 = NTD 0（baseline）

| 維度 | 內容 |
|:---|:---|
| **Pros** | • 不需改 ADR；• 客戶體驗順 |
| **Cons** | • 與 spec §08 P2-06/P2-07 顆粒度不對齊；• 不含師傅 initiated cancel 政策 → 師傅 no-show 客戶被收 NTD 0 但平台不能對師傅 penalty；• 缺 customer_not_onsite / unpaid_no_response 等 reason code |
| **Fit** | 早期 MVP / 無 Phase II finance scope |
| **Anti-fit** | Phase II finance freeze 後 |
| **Cost / Effort** | S (不改) |

### Option B — 全 5 階段 + S2 = NTD 500（spec upper bound）

| 維度 | 內容 |
|:---|:---|
| **Pros** | • 完全對齊 spec upper bound；• 平台行政成本回收最大 |
| **Cons** | • NTD 500 在台灣 B2C 容易客訴（案件 1500-3000 的 17-33%）；• 仍缺 S1.5 拆分顆粒度；• 仍缺師傅 initiated 政策 |
| **Fit** | B2B 大客戶 |
| **Anti-fit** | B2C 散戶（主要客群） |
| **Cost / Effort** | M |

### Option C — 6 階段 + S2 = NTD 300 + S1.5 免費 + 師傅 initiated 三段政策（✅ Recommended）

| 維度 | 內容 |
|:---|:---|
| **Pros** | • 對齊 spec 顆粒度；• S2 = 300 在 spec lower bound + 客訴可控；• S1.5 免費降客訴；• 師傅 initiated 三段政策（首次免責 / 累犯扣款 / 不可抗力憑證明免責）平衡師傅生態；• 完整 reason code dictionary 給 BI / AI / audit；• 透過 ADR-0067 configurable |
| **Cons** | • 客服 UI 多 1 階段 + reason code 下拉 → 訓練成本；• Phase II finance freeze 需業主 + 會計同步簽核；• 師傅 initiated 政策需配套 M07 weight penalty engine |
| **Fit** | 台灣居家修繕業 B2C + 配套 B2B configurable per brand |
| **Anti-fit** | 早期 prototype（顆粒度過細） |
| **Cost / Effort** | M (一次性投入，攤提到全 cancel flow) |

---

## ✅ Decision

> [!IMPORTANT]
> **選擇**: Option C — 6 階段 + reason code dictionary + 師傅 initiated 政策（對齊 final spec 2026-05-20 + 業主 2026-05-28 value decision）
>
> **理由**: 業主 value decision Q1/Q2/Q3 明文拍板 S2 = NTD 300 / S1.5 免費 / 師傅首次免責 + 累犯扣款 + 不可抗力豁免；spec §08 P2-06/P2-07 階段表顆粒度為 6 階段；Lane A critique 兩 persona 共識 SUPERSEDE。本決議完整覆蓋 spec 所有取消情境並對齊台灣產業實況。

| 範疇 | 說明 |
|:---|:---|
| **✅ 適用範圍** | M11 AR cancellation ledger + M15 Exception override workflow + FR-0010 reschedule cancel + FR-0014 partial refund cascade + Backend state machine 自動推算階段 |
| **❌ 不適用** | 非 cancellation 性質的 refund（純品質問題退款走 ADR-0040 v2）；保固覆蓋下的維修取消（走 ADR-0044 RMA 路徑） |
| **🔓 可逆性** | 半可逆（金額 + reason code 中文文案 configurable via ADR-0067；6 階段骨架 + reason code enum + 師傅 initiated 政策變更需新 ADR） |

---

### §A 6 階段表（取代 ADR-0039 5 階段）

| 階段 | 觸發點 | 客戶側收費（V1 default） | 業主 value decision | 客服覆寫 |
|:-----|:-------|:------------------------|:-------------------|:--------|
| **S1** | 報價未確認前取消 | NTD 0 | (sync ADR-0039 v1) | ✅ |
| **S1.5（NEW，業主 Q2）** | **已確認報價、未派工** | **NTD 0 — 免收費**（客戶取消未占師傅資源，免收費降客訴） | Q2 = 拆出 + 免收費 | ✅ |
| **S2（金額改，業主 Q1）** | 已派工、師傅未出發 | **NTD 300（default，configurable per brand via ADR-0067）+ goodwill_waiver 可 override → 0** | Q1 = NTD 300（30% 案件單價門檻，業界 Uber/Foodpanda 類比） | ✅ |
| **S3** | 已出發、未到場 | 車馬費 NTD 500-1,200（依距離）+ 取消費（同 S2） | (sync ADR-0039 v1 + spec) | ✅ |
| **S4** | 已到場、無法/不施工 | 車馬費 + 檢測費 NTD 300 + 取消費（同 S2） | (sync ADR-0039 v1 + spec) | ✅ |
| **S5** | 已施工後取消 | partial 公式（引 ADR-0049 + ADR-0066 quote_version）+ 車馬費 | (sync ADR-0039 v1) | ✅ |

**核心規則**（沿用 ADR-0039 v1 並強化）：

1. **System 自動推算階段**：依 WorkOrder state machine 即時判定，不依賴 AI / 客服人工。S1.5 對應 `quote.status = customer_confirmed AND workorder.status = pending_dispatch`。
2. **全階段客服可覆寫**，必須：
   - 留 audit log（operator_id / operator_role / original_amount / new_amount / delta_pct / reason_code / supervisor_approval_id / quote_id / quote_version / evidence_ids）
   - 若調整 > 50% 或免收，需主管覆核
   - 進 Refund Ledger 留證（per ADR-VCH-002 7y）
3. **partial 公式 (S5) 沿用 ADR-0039 v1**：`cancellation_fee = (完工項目數 / 全部項目數) × 工項總額 + 車馬費`；onsite v+1 加價拒絕走 `customer_quote_rejected_after_dispatch` + ADR-0049 三件套 evidence。
4. **金額 configurable per brand** via ADR-0067 M18 runtime config plane（staged rollout 5% → 50% → 100% per BR-M18 業主 value decision）。

---

### §B Reason Code Dictionary（NEW，業主 value decision 落地）

四向分類（business / customer / technician / system）對齊 BI / AI / audit 需求：

```yaml
cancellation_reason_codes:
  # === Customer Initiated (客戶側觸發) ===
  - code: quote_not_confirmed
    stage: S1
    semantic: 客戶在報價未確認前取消
    customer_fee: NTD 0
    technician_penalty: false
  - code: quote_confirmed_no_dispatch
    stage: S1.5
    semantic: 客戶已確認報價、平台未派工前取消
    customer_fee: NTD 0  # 業主 Q2 = 免收費
    technician_penalty: false
  - code: dispatched_not_departed
    stage: S2
    semantic: 已派工、師傅未出發前客戶取消
    customer_fee: NTD 300 (default)  # 業主 Q1
    technician_penalty: false
  - code: en_route_cancelled
    stage: S3
    semantic: 師傅已出發、未到場前客戶取消
    customer_fee: 車馬費 + 取消費 (per stage)
    technician_penalty: false
  - code: customer_not_onsite
    stage: S3/S4
    semantic: 師傅到達但客戶不在現場 (Q047 業主答 YES「可以要收」)
    customer_fee: 車馬費 + 取消費
    technician_penalty: false
    evidence_required: [gps, timestamp, photo]  # 對齊 BR-M08-01 + ADR-0050 v2
  - code: onsite_not_executed
    stage: S4
    semantic: 已到場，因客戶因素無法施工
    customer_fee: 車馬費 + 檢測費 + 取消費
    technician_penalty: false
  - code: customer_refused
    stage: S4
    semantic: 已到場，客戶最終拒絕施工
    customer_fee: 車馬費 + 檢測費 + 取消費
    technician_penalty: false
  - code: partial_completed_cancel
    stage: S5
    semantic: 已施工後客戶取消（partial 公式）
    customer_fee: partial 公式 + 車馬費
    technician_penalty: false
  - code: customer_quote_rejected_after_dispatch
    stage: S5
    semantic: onsite v+1 加價拒絕（v2 ADR-0039 已補；對應 ADR-0049 customer_disagreed_partial）
    customer_fee: v1 完工項目按 v1 quote 收費 + v+1 走 ADR-0049 三件套吸收
    technician_penalty: false

  # === Technician Initiated (師傅側觸發 — 客戶側 fee = 0) ===
  - code: technician_initiated_cancel
    stage: any
    semantic: 師傅單方面取消（含 no-show、聯絡不上）
    customer_fee: NTD 0  # 業主 Q3 — 客戶側不負擔
    technician_penalty: conditional  # 業主 Q3 三段政策見 §C
    evidence_required: [contact_log_or_force_majeure_proof]

  # === System Initiated (系統觸發) ===
  - code: unpaid_no_response
    stage: any
    semantic: 客戶未付款 / 未回覆達 timeout (Q065 業主答 YES 新增)
    customer_fee: NTD 0 (system cancel, no penalty)
    technician_penalty: false

  # === Business Initiated (平台/業務側觸發) ===
  - code: business_cancel
    stage: any
    semantic: 平台主動取消（如品牌方臨時要求、合約終止）
    customer_fee: NTD 0
    technician_penalty: false  # 若已派工需補償師傅，走 M07 compensation queue

  # === Override Codes (客服覆寫專用) ===
  - code: goodwill_waiver
    stage: any
    semantic: 客服主動善意豁免（如重複客戶 / 客訴升級補償）
    requires: supervisor_approval if amount = 0 OR delta_pct > 50%
  - code: supervisor_override
    stage: any
    semantic: 主管覆核任意金額調整
    requires: supervisor_approval
```

---

### §C 師傅 initiated cancel 政策（NEW 段落，業主 Q3 落地）

師傅單方面取消（含 no-show、聯絡不上）三段政策：

| 情境 | 處理 | 業主 Q3 rationale |
|:-----|:-----|:------------------|
| **首次（當月第 1 次）** | **免責**：客戶側 fee = 0；師傅無 penalty；自動 re-dispatch (FR-0003) | 「硬扣每次逼師傅跳家」— 給予容錯空間 |
| **同月累犯（當月第 ≥ 2 次）** | **扣款**：客戶側 fee = 0；師傅 weight -5 (per M07)；走 FR-0010 / ADR-0045 acceptance SLA penalty | 「不扣會被惡意刷單利用」— 累犯機制 |
| **不可抗力憑證明免責** | 提供證明（醫療單據 / 颱風警報 / 家中急事 + 第三方文件）→ 主管核可後免 weight penalty | 業界混合做法：颱風 / 急事 / 醫療不應扣 |

**對應系統流程**：

1. 客戶側自動 emit `WorkOrderRescheduleRejected` → re-dispatch (FR-0003)
2. M07 workforce 自動累計當月 technician_initiated_cancel 次數
3. 第 ≥ 2 次時主管 escalation queue 收到通知，預設扣 weight -5
4. 師傅可提交不可抗力證明（M07 admin UI），主管核可後 reverse weight
5. Audit log 必填 `reason_code = technician_initiated_cancel`, `evidence_required: contact_log_or_force_majeure_proof`, `monthly_occurrence_count`, `force_majeure_proof_id`

---

### §D Override + Audit Log Schema（強化 ADR-0039 v1）

Override audit log 必填欄位：

```yaml
cancellation_override_audit:
  operator_id: string         # 客服 ID
  operator_role: enum         # csm / supervisor / accounting
  original_amount: int        # system 自動推算金額
  new_amount: int             # 覆寫後金額
  delta_pct: float            # (new - original) / original × 100
  reason_code: enum           # 必須在 §B reason_codes 內
  supervisor_approval_id: nullable  # when delta_pct > 50% OR new_amount = 0
  quote_id: string            # cascade ADR-0066
  quote_version: int          # cascade ADR-0066
  evidence_ids: list[string]  # GPS / chat / signature / force majeure proof
  config_version_applied: int # cascade ADR-0067 — 寫入時 snapshot M18 config version
  created_at: timestamp
  workorder_id: string
  cancellation_stage: enum    # S1 / S1.5 / S2 / S3 / S4 / S5
  technician_initiated: bool
  technician_monthly_count: nullable int  # 當月師傅 initiated 次數 (僅 technician_initiated=true 時填)
```

**SoD 規則**（對齊 BR-M17-01 三維）：

- AI 永禁直接告知金額（沿用 ADR-0035 + new spec P2-29）+ 永禁 approve override
- Operator (initiator) ≠ Approver (supervisor)
- L5 Sponsor 沿用 ADR-0040 v2 RBAC（用既有 ops_director，避免再開角色）

---

### §E Configurable per brand（透過 ADR-0067）

以下參數透過 M18 admin UI 改，走 staged rollout (5% → 50% → 100%, 每段 30 min observation per BR-M18 業主 value decision)：

- 金額表 S2 / S3 車馬費上下限 / S4 檢測費 / S5 partial 公式參數
- reason code 中文文案（顯示給客服 + 客戶通知）
- 客服覆寫門檻（default delta_pct > 50% → 主管覆核）
- 師傅 monthly_initiated_cancel 累犯閾值（default = 2）
- 不可抗力證明審核 SLA

---

## 📊 Consequences

### ✅ Positive
- 階段顆粒度完全對齊 final spec 2026-05-20
- Reason code dictionary 給 BI / AI 分類提供結構化欄位
- 師傅 initiated cancel 政策明文化 → 客戶口徑統一 + 師傅生態穩定
- cascade chain（ADR-0040 v2 / 0041 / 0046 / 0049 / 0066）全部對齊
- 客戶不在場 evidence 必填，避免「師傅誣告客戶不在」爭議
- 透過 ADR-0067 configurable，未來金額調整無需 redeploy

### ⚠️ Negative

> [!WARNING]
> trade-off 清單：

- **S2 改收費可能觸發短期客訴爬升**（NTD 0 → 300） — mitigation: SOP + script 配套 + goodwill_waiver override 機制 + 14 天 staged rollout 觀察客訴 KPI
- **客服 UI 多 1 階段 + reason code 下拉** → 訓練成本 — mitigation: 預設 reason code 自動帶入 + 試算即時顯示
- **Phase II finance freeze 取決於業主 + 會計同步簽核** — mitigation: 業主 2026-05-28 已 Q1/Q2/Q3 拍板，會計簽核走 ChangeRequest 流程
- **師傅累犯閾值 default = 2 可能誤傷正當理由師傅** — mitigation: 不可抗力證明機制 + 主管 reverse 路徑 + audit trail 留證

### 🎯 Follow-up Work

| Action | Owner | Due | Reference |
|:---|:---|:---|:---|
| ADR-0039 frontmatter 改 `status: Superseded by ADR-0102` + banner | `devteam-arch` | 2026-05-28 | 本 ADR §F |
| ADR-100 §1 row ADR-0039 → SUPERSEDED (by ADR-0102) | `devteam-arch` | 2026-05-28 | ADR-0100 |
| BR-M15-CANCEL-01~10 + BR-M11-CANCEL-01~05（6 階段 / reason code / override / 師傅 initiated）| `devteam-analyst` | Phase II planning | analyst cascade |
| FR-0010 reschedule / FR-0014 refund / FR-0018 客訴 G/W/T 補對應 reason code AC | `devteam-analyst` | Phase II planning | analyst cascade |
| M18 System Setup config schema：cancellation_reason_codes enum + 金額表 + 累犯閾值 | `devteam-design` | Gate 5b | design cascade |
| M07 workforce: technician_initiated_cancel monthly counter + force majeure evidence admin UI | `devteam-design` | Phase II | design cascade |
| QA test plan: 6 階段 × reason code × override × 師傅 initiated × 客戶不在場 ≥ 24 TC | `devteam-qa` | Gate 6 | qa cascade |
| 業主 + 會計簽核 V1 預設金額表 + 累犯閾值 | 業主 + 會計 | 2026-05-30 | finance scope freeze |

### 📉 影響的下游文件

| Doc | Impact |
|:---|:---|
| `docs/architecture/adr/ADR-0039-cancellation-fee-tiers.md` | Superseded by ADR-0102 |
| `docs/architecture/adr/ADR-0040-refund-approval-tiers.md` | PARTIAL_UPDATE — partial refund 路徑同步 |
| `docs/analysis/fr/FR-0010-reschedule.md` | reason code en_route_cancelled / technician_initiated AC |
| `docs/analysis/fr/FR-0014-refund.md` | partial_completed_cancel cascade |
| `docs/api/openapi-m11.yaml` | cancellation endpoint reason_code enum + evidence_ids |
| `docs/data/erd-m11-ar.md` | cancellation_overrides table schema 強化 |

---

## 🔗 Links

| Asset | Path |
|:---|:---|
| **Superseded ADR** | [`ADR-0039`](./ADR-0039-cancellation-fee-tiers.md) |
| **Related ADRs** | [`ADR-0040`](./ADR-0040-refund-approval-tiers.md) · [`ADR-0041`](./ADR-0041-travel-fee-split.md) · [`ADR-0045`](./ADR-0045-acceptance-sla-policy.md) · [`ADR-0049`](./ADR-0049-onsite-scope-change-protocol.md) · [`ADR-0050`](./ADR-0050-evidence-visibility-matrix.md) · [`ADR-0066`](./ADR-0066-quote-workorder-lifecycle-binding.md) · [`ADR-0067`](./ADR-0067-m18-runtime-config-governance.md) |
| **Lane A critique** | [`docs/governance/reviews/ADR-0039-lane-a-critique-2026-05-28.md`](../../governance/reviews/ADR-0039-lane-a-critique-2026-05-28.md) |
| **業主 value decision** | [`.claude/context/devteam/value-decisions-2026-05-28.md`](../../../.claude/context/devteam/value-decisions-2026-05-28.md) Q1/Q2/Q3 |
| **Source spec** | [`docs/_source/01-workorder-erp.md`](../../_source/01-workorder-erp.md) §04 P0 row 143 + §08 P2-06/P2-07 + §15 M15 |
| **KB references** | [[06_quality_attributes_catalog]] §1.4 Auditability · [[13_doc_migration_playbook]] §8 SUPERSEDE criteria |

---

## 🔍 Open Questions

| # | 問題 | 處理 |
|:--|:-----|:-----|
| OQ-102-1 | S2 金額是否需 per-brand 差異化 default？ | Phase II Finance 階段決，本 ADR default = NTD 300 |
| OQ-102-2 | 不可抗力證明 SLA（主管核可期）多長？ | 預設 24h，配套 M16 通知 |
| OQ-102-3 | 客戶不在場 evidence 缺 GPS 時的 fallback？ | 配套 BR-M08-01 邊界，建議走主管覆核 + 客服通話紀錄 |

---

## ⚠️ Risks

| # | Risk | Likelihood | Impact | Mitigation |
|:--|:-----|:-----------|:-------|:-----------|
| R-102-1 | S2 default 金額調整觸發客訴 KPI 突升 | M | M | 14 天 staged rollout + 客服 SOP + goodwill_waiver mechanism |
| R-102-2 | 師傅 monthly_count 計算錯誤導致誤罰 | L | H | M07 workforce engine 加 unit test；audit trail + reverse 路徑 |
| R-102-3 | reason code enum 在 staged rollout 期間 cache 不一致 | M | M | ADR-0067 §一致性段：寫入 cancellation row 必須 persist config_version_applied |
| R-102-4 | 客戶不在場 evidence GPS 缺失 / 偽造 | L | H | BR-M08-01 evidence 三件套；ADR-0050 v2 visibility matrix |
| R-102-5 | 累犯閾值 default = 2 在 B2C 散戶生態誤傷正當師傅 | M | M | 不可抗力 mechanism + 半年 review 閾值 + M19 BI 監控誤罰比率 |

---

## ✍️ Sign-off

- [x] **Architect** (owner): `devteam-arch` / Date: 2026-05-28
- [x] **業主**: value decision Q1/Q2/Q3 / Date: 2026-05-28
- [ ] **會計 / 主管**: V1 default 金額簽核 / Date: ____________ (2026-05-30 前)
- [ ] **Tech Lead**: ____________ / Date: ____________

---

**End of ADR-0102**

> 給業主：你主要要看的是 **📋 Executive Summary** + **§A 6 階段表** + **§C 師傅 initiated 政策** 三段。
> Reason Code Dictionary §B 是 BI / AI / audit 結構化欄位，給 analyst / design 接手用。
