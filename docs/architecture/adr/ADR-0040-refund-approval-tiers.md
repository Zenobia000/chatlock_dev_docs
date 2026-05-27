---
id: ADR-0040
title: 退款核准分層 — 5 層金額分層 + SoD 三維 + Partial Refund 分類
status: Accepted (PARTIAL_UPDATE 2026-05-28)
date: 2026-05-21
last_updated: 2026-05-28
update_type: PARTIAL_UPDATE
update_reason: "Final spec 2026-05-20 P2-11 5-tier 與 ADR-0040 完全一致（不 SUPERSEDE），但缺三項補強：(1) Partial refund 分類 (product/labor/material/travel/inspection, BR-M11-02 強制)；(2) SoD 三維拆分 (initiator / approver / executor)；(3) L5 Sponsor 角色 RBAC 對應 (ADR-0042 對齊)。業主 2026-05-28 value decision Q4 = PARTIAL_UPDATE（不 SUPERSEDE，subagent 證據強，治理成本翻倍沒效益）。"
source_trade_off: §F.2 退款核准分層 PAIN-POINTS-SUMMARY-2026-05-21.md
deciders: [業主]
accepted_date: 2026-05-22
related:
  - "./ADR-0042-rbac-four-tier-principle.md"
  - "./ADR-0067-m18-runtime-config-governance.md"
  - "./ADR-0102-cancellation-fee-tiers-v2-final-spec.md"
  - "../../analysis/br/BR-REFUND-006.md"  # partial refund 分類強制 (起點)
  - 01-workorder-erp-final-spec-20260520.xlsx#sheet-04 (P0)
  - 01-workorder-erp-final-spec-20260520.xlsx#sheet-08 (Phase II)
  - 01-workorder-erp-final-spec-20260520.xlsx#sheet-11 (RBAC)
pre_mortem: F4 (合規崩潰)
eternal_transient: Eternal RBAC (B3 + B4) + SoD invariant
partial_update_history:
  - date: 2026-05-28
    update_type: PARTIAL_UPDATE
    update_reason: "Final spec 2026-05-20 P2-11 5-tier 與 ADR-0040 完全一致（不 SUPERSEDE），補三項：(1) Partial refund 分類 (起點 BR-REFUND-006, BR-M11-02 強制) / (2) SoD 三維拆分 (initiator / approver / executor, BR-M17-01) / (3) L5 Sponsor 角色 RBAC 對應 (沿用 ADR-0042 既有 ops_director, 不開新 RBAC 角色)"
    decided_by: 業主
    cascade_refs:
      - BR-REFUND-006
      - ADR-0102
      - ADR-0042
      - ADR-0067
---

> 📝 **PARTIAL_UPDATE BANNER (2026-05-28)**
>
> 本 ADR 原 5-tier 主體保留，**新增 §v2 body**（見下方）補三項：
> 1. **Partial refund 分類**（product / labor / material / travel / inspection — BR-M11-02 強制）
> 2. **SoD 三維**（initiator / approver / executor — 對齊 BR-M17-01）
> 3. **L5 Sponsor 角色 RBAC 對應**（沿用 ADR-0042 既有 ops_director 不開新角色）
>
> **業主 2026-05-28 value decision Q4 = PARTIAL_UPDATE**（subagent 證據強：spec 5-tier 跟原 ADR 一致，差在補強。SUPERSEDE 治理成本翻倍沒效益）。
>
> **Lane A critique merge report**: [`docs/governance/reviews/ADR-0040-lane-a-critique-2026-05-28.md`](../../governance/reviews/ADR-0040-lane-a-critique-2026-05-28.md)
> **Per ADR-0100 §1 classification** (.claude/context/devteam/meetings/2026-05-27-1130-final-spec-migration-strategy/MoM.md)


# ADR-0040 — 退款核准分層

## Status
Accepted (PARTIAL_UPDATE 2026-05-28)
> 原 Status: Draft (Excel sheet 04 P0 標「未決」) → 2026-05-22 業主推薦 Accepted → 2026-05-28 PARTIAL_UPDATE

## Context

退款是高風險財務動作。若無分層核准，小額退款卡主管 / 大額退款卻被客服輕易放行，都是合規風險。

源自 Excel-01 sheet 04 P0 退款核准條目；sheet 08 Phase II Finance；sheet 11 RBAC。

## Decision（推薦）

**5 層金額分層核准**：

| 層級 | 金額區間 | 核准 |
|------|---------|------|
| L1 | ≤ NTD 1,000 | 客服主管 |
| L2 | NTD 1,001 - 5,000 | 營運主管 |
| L3 | NTD 5,001 - 30,000 | 營運主管 + 會計 |
| L4 | NTD 30,001 - 100,000 | 主管 + 會計 |
| L5 | > NTD 100,000 | 雙簽（主管 + 會計 + Sponsor）|

退款理由必填（reason code）：
- `customer_dispute` / `quality_issue` / `wrong_dispatch` / `warranty_coverage` / `goodwill` / `other`

所有退款進 Refund Ledger（B4），audit trail 永久留證。

## Alternatives Considered

### Option A — 責任歸屬導向（品牌 / 平台 / 師傅 各自分層）
- Pre-mortem 風險：F3 邊界更穩定但複雜度高
- 矩陣維度 ↑ 2x（金額 × 責任 = 5 × 3 = 15 種組合）
- Eternal 但實作成本高

### Option B — 全走主管 + 會計雙簽
- 風險：F1 弱（過嚴）
- 小額退款 SLA -50%，客訴上升

## Consequences

**Positive**：
- 5 層金額分層清晰
- L5 雙簽防止大額異常
- 與 RBAC 4 層原則（ADR-0042）對齊

**Negative**：
- 跨層退款（如 4,999 vs 5,001）邊界需嚴格
- 責任歸屬另作為 BI 維度，不影響核准層

**Mitigation**：
- 金額判定以「實際退款金額」非「原案件金額」
- BI 報表加「退款 by reason code × 責任歸屬」分析
- 半年 review 各層退款比例，調整門檻

## Pre-mortem Mapping

對應 §A F4。沒有退款分層 → 大額退款被誤批 / 小額退款卡關 → 客訴 + 合規風險。RBAC + Ledger 雙重把關。

## Eternal/Transient Classification

- **Eternal**：§B3 RBAC 退款核准邏輯 + §B4 Refund Ledger
- **Transient**：金額門檻數字（configurable via ChangeRequest）

## Acceptance Criteria
- [ ] 業主圈選：**✅ 推薦** / Option A / Option B
- [ ] 主管 + 會計簽核 5 層門檻金額
- [ ] Backend 實作 Refund Ledger + 核准 workflow
- [ ] 與 ADR-0042 RBAC 4 層整合（誰可核准哪層）
- [ ] AI 永禁核准退款（charter ADR-0028 Forbidden）
- [ ] 6 個月後 review 門檻

## See also
- §F.2 PAIN-POINTS-SUMMARY-2026-05-21.md
- Excel-01 sheet 04 / sheet 08 / sheet 11 / M11 AR-Refund
- ADR-0028 AI 不可核准退款
- ADR-0042 RBAC 4 層原則
- ADR-0039 取消費分段（取消費 ≠ 退款，但同 ledger 系列） → 2026-05-28 已 superseded by ADR-0102
- ADR-0102 取消費分段 v2（partial refund 路徑 cascade）
- ADR-0067 M18 runtime config governance（金額門檻 configurable plane）
- BR-REFUND-006（partial refund 分類強制 — 起點 BR）
- BR-M11-02（M11 service-level 落地規則）
- BR-M17-01（SoD 三維拆分強制）

---

## §v2 Body Update (PARTIAL_UPDATE 2026-05-28)

> 業主 2026-05-28 value decision Q4 = **PARTIAL_UPDATE**（不 SUPERSEDE）
> Rationale: subagent Lane A critique 2026-05-28 顯示 spec P2-11 5-tier 與 ADR-0040 5-tier **完全一致**，無「新規格覆寫」。spec 補強的（partial refund 分類、SoD、Sponsor、SLA）皆為「ADR 缺項」而非「ADR 錯誤」→ 升 v2 即可，不需新 ADR。SUPERSEDE 治理成本翻倍沒效益。

### §v2.1 — 5-tier 金額分層核准矩陣（強化版）

| Tier | 金額區間 (NTD) | Initiator | Approver(s) | Executor | SLA target | Co-sign 逾時升級 |
|:-----|:--------------|:----------|:------------|:---------|:-----------|:----------------|
| L1 | ≤ 1,000 | CSM | 客服主管 | M11 system → Payment Provider | < 4 hr | n/a |
| L2 | 1,001-5,000 | CSM | 營運主管 | 同上 | < 8 hr | n/a |
| L3 | 5,001-30,000 | CSM | 營運主管 + 會計（互斥） | 同上 | < 24 hr | 12 hr 未 ack 升 L4 |
| L4 | 30,001-100,000 | CSM 或 主管 | 主管 + 會計（互斥） | 同上 | < 48 hr | 24 hr 未 ack 升 L5 |
| L5 | > 100,000 | CSM 或 主管 | 主管 + 會計 + Sponsor (ops_director) | 同上 | < 72 hr | 36 hr 未 ack 升 CEO + 觸發 incident |

**金額門檻 configurable** via ADR-0067 M18 runtime config plane（per BR-M18 業主 value decision staged rollout 5% → 50% → 100%, 30 min observation）。

### §v2.2 — SoD 三維（initiator / approver / executor）

對齊 BR-M17-01「每個角色必須拆成 can-view、can-edit、can-approve；除 audited admin 外，不接受 all access」：

**SoD 強制規則**：

1. **AI 永禁 approver / executor**：AI 可作 initiator draft（人審必經），永禁 approve 或 execute（沿用 ADR-0028 charter Forbidden）
2. **同筆退款互斥**：`approver != initiator`；若同人需 reject + return 422 `sod_violation`
3. **L3+ 雙簽角色互斥**：兩位 approver 必須是獨立 RBAC 角色（如「主管 ≠ 會計」），不可同一 user 兼兩角色
4. **L5 三方互斥**：主管 ≠ 會計 ≠ Sponsor（ops_director）
5. **Executor 永遠是系統**：人類角色禁 manually trigger payment provider call；走 M11 service tx with `RefundApproved` event emit
6. **Audit trail 必填**：`initiator_id`, `approver_ids[]`, `executor_system_id`, `co_sign_timestamps[]`, `sod_check_passed: bool`

**Acceptance G/W/T 範例**：

```gherkin
# L3 雙簽 happy path
Given refund amount = 10000 AND initiator = csm_alice
When approver_1 (營運主管 bob) approve AND approver_2 (會計 carol) approve
Then status = APPROVED AND RefundApproved emit
  AND audit trail 含 (csm_alice, bob, carol, M11_system) 四角色 timestamp
  AND sod_check_passed = true

# L5 互斥違反
Given refund amount = 200000 AND initiator = manager_dave
When approver_1 = manager_dave (same user)
Then reject + 422 sod_violation
  AND audit log reason = "initiator_equals_approver"

# AI initiator + 人審
Given refund draft created by ai_bot
When ai_bot attempts approve
Then reject + 403 forbidden
  AND charter_violation log emit
```

### §v2.3 — Partial Refund 分類（BR-REFUND-006 起點 / BR-M11-02 對齊）

> **起點 BR**: `BR-REFUND-006` — 退款必填 `refund_breakdown`，總額 = Σ各類，每類 amount ≥ 0；BR-M11-02 為 M11 service-level 落地規則。

退款必填 `refund_breakdown`，每類獨立記 ledger，audit 可拆：

| 類別 | 說明 | 對應業務場景 |
|:-----|:-----|:------------|
| `product` | 產品本身退費 | 商品瑕疵 / 品質爭議 |
| `labor` | 工資 / 安裝費退費 | 安裝失誤 / 客戶取消已完成工項 |
| `material` | 耗材退費 | 多餘耗材回收 / 用錯料 |
| `travel` | 車馬費退費 | 師傅未到場 / 客戶不在場（per ADR-0102 S3） |
| `inspection` | 檢測費退費 | 檢測誤判 / 客戶不認可檢測結果 |

**Schema 要求**：
- 總額 = Σ各類，每類 amount ≥ 0
- 每類獨立寫 M11 ledger row（5 個 ledger entry per refund，linked by `refund_id`）
- audit query 可按 `class` 維度聚合（供 BI / M19 月結報表）

### §v2.4 — L5 Sponsor 角色 RBAC 對應

**業主 value decision rationale**: 不開新 RBAC 角色，沿用 ADR-0042 既有 `ops_director`（避免 RBAC 矩陣升維至 5-tier 觸發 cascade 至所有 module）。

| Sponsor 場景 | RBAC mapping |
|:------------|:-------------|
| 內部 ops_director | `role = ops_director` (per ADR-0042 既有 4-tier 內) |
| 外部 CEO / COO offline 簽核 | 走 admin proxy：ops_director 代簽 + 上傳 CEO 書面授權 PDF + audit log 記 `proxy_signed_by: ops_director, on_behalf_of: ceo` |
| 緊急退款（業主直接決策） | 暫由 ops_director 代簽 + 業主補後置 ChangeRequest approval（per ADR-0046） |

**Audit 強化**：
- L5 退款 row 必填 `sponsor_role`, `sponsor_user_id`, `proxy_authorization_doc_id (nullable)`
- 每月對 L5 退款做 ops review（per M19 BI report）

### §v2.5 — Configurable 邊界（透過 ADR-0067）

以下參數透過 M18 admin UI 改，走 staged rollout：

- **金額門檻**（1k / 5k / 30k / 100k）= configurable
- **Approver 角色 mapping** = configurable via M17 RBAC
- **SLA target + 逾時升級規則** = configurable via M16 Comms / M15 Exception template
- **Reason code 清單** = configurable lookup table (per ADR-0065)
- **Partial refund 類別 enum** = configurable but 變更需主管 + 會計 approval（影響 BI 報表結構）

### §v2.6 — 影響的下游文件（v2 cascade）

| Doc | Impact |
|:---|:---|
| `docs/analysis/fr/FR-0014-refund.md` | §1.1 / §1.2 / AC 從 2-tier 改回 5-tier；補 G/W/T |
| `docs/api/openapi-m11.yaml` | refund endpoint payload 加 `refund_breakdown` 物件 + `sod_check` validator |
| `docs/data/erd-m11-ar.md` | `refund_breakdown` 子表 (product/labor/material/travel/inspection × amount) |
| `docs/architecture/adr/ADR-0042-rbac-four-tier-principle.md` | 確認 ops_director 為 L5 Sponsor 對應角色（無需升 5-tier） |
| `docs/qa/test-plan-m11.md` | 5 tier × 至少 2 scenario × SoD violation × partial breakdown ≥ 12 TC |

### §v2.7 — Acceptance Criteria（v2 補項）

- [x] 業主 2026-05-28 value decision Q4 = PARTIAL_UPDATE 拍板
- [ ] FR-0014 殼從 2-tier 改 5-tier + SoD G/W/T
- [ ] M11 ERD 加 `refund_breakdown` 子表
- [ ] M17 RBAC 確認 ops_director 為 L5 Sponsor 對應（不開新角色）
- [ ] QA 補 SoD violation + partial breakdown TC
- [ ] M18 config schema：金額門檻 / SLA / 逾時升級規則 / partial refund 類別 enum
