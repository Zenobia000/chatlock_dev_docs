---
id: ADR-0044
title: 保固起算多模式 — Device.warranty_start_date + mode 欄位（spec 對齊版）
status: Accepted (PARTIAL_UPDATE 2026-05-28)
date: 2026-05-21
last_updated: 2026-05-28
update_type: PARTIAL_UPDATE
update_reason: "Final spec 2026-05-20 G002 / Q107 / BR-M02-02 / BR-M14-02 用語對齊：mode enum 改 install_date / handover_date / brand_warranty_date 等，並補 RMA reset (業主 Q5) / B2B contract override (業主 Q6) / part-level 升維時機 (業主 Q7) 三項業主拍板。Lane A critique 2026-05-28 2/2 PARTIAL_UPDATE。"
source_trade_off: §F.2 保固起算 PAIN-POINTS-SUMMARY-2026-05-21.md
deciders: [業主 (2026-05-28 value decision Q5/Q6/Q7)]
accepted_date: 2026-05-22
related:
  - "./ADR-0043-brand-project-tenant-scope.md"
  - "./ADR-0046-change-request-object.md"  # B2B override 走 CR
  - "./ADR-0053-serial-control-policy.md"
  - "./ADR-0067-m18-runtime-config-governance.md"  # warranty_period_months configurable
  - "../../analysis/br/BR-WARRANTY-005.md"  # mode enum 對齊 spec G002/Q107
  - "../../analysis/br/BR-WARRANTY-006.md"  # RMA reset (被修期間延長 + 換新零件 90 天)
  - "../../analysis/br/BR-WARRANTY-007.md"  # B2B 覆寫機制 (PDF + 主管 approve + 上限 5 年)
  - 01-workorder-erp-final-spec-20260520.xlsx#sheet-04 (P0)
  - 01-workorder-erp-final-spec-20260520.xlsx (M02 Customer/Site/Device)
  - 01-workorder-erp-final-spec-20260520.xlsx (M10 BOM/Inventory)
  - 01-workorder-erp-final-spec-20260520.xlsx (M13 RMA Quality)
  - 01-workorder-erp-final-spec-20260520.xlsx (M14 Builder Partner)
  - 01-workorder-erp-final-spec-20260520.xlsx (G002 / Q107)
  - 01-workorder-erp-final-spec-20260520.xlsx (BR-M02-02 / BR-M14-02)
pre_mortem: F5 (規模困境) + F4 (合規崩潰 — 保固爭議)
eternal_transient: Eternal (B1 Device schema + mode enum 骨架 + RMA reset 政策 + part-level hook) / Transient (warranty_period_months 可 contract override；mode 列表可走 ChangeRequest 新增)
partial_update_history:
  - date: 2026-05-28
    update_type: PARTIAL_UPDATE
    update_reason: "Final spec 2026-05-20 G002/Q107/BR-M02-02/BR-M14-02 引入新術語對齊原 mode enum；補三項業主 value decision (Q5/Q6/Q7)：(1) mode enum 對齊 spec safety_install_date / first_use_date / ship_date / negotiated_date 概念 ↔ install_date / handover_date / brand_warranty_date / contract_date (BR-WARRANTY-005)；(2) RMA 後重算 = 被修期間延長 + 換新零件 90 天獨立 (BR-WARRANTY-006，消保法第 22/24 條相容)；(3) B2B 覆寫 = PDF + 主管 approve + audit + 上限 5 年 (BR-WARRANTY-007)；(4) Phase II part-level 升維 placeholder。"
    decided_by: 業主
    cascade_refs:
      - BR-WARRANTY-005
      - BR-WARRANTY-006
      - BR-WARRANTY-007
      - ADR-0043
      - ADR-0046
      - ADR-0067
---

> 📝 **PARTIAL_UPDATE BANNER (2026-05-28)**
>
> 本 ADR 主體（Device.warranty_start_date + warranty_start_mode 多模式 enum）**保留**，補三項業主 value decision：
> - **Q5 RMA 重算**: 加被修期間延長 + 換新零件部分獨立重算 90 天（含消保法第 22 條引用）
> - **Q6 B2B 覆寫**: 可覆寫 = 合約 PDF + 主管 approve + audit trail + 上限 5 年
> - **Q7 Part-level 升維時機**: Phase II 才升；Phase I 整機 1 年但 BOM 階層紀錄留 Phase II 鋪路
>
> **Mode enum 對齊 spec 詞彙**: `safety_install_date` → `install_date`（spec G002 零售零售 install_date）、`activation_date` → `handover_date`（spec G002 建商）、新增 `brand_warranty_date`（spec G002 品牌保固）。
>
> **Lane A critique merge report**: [`docs/governance/reviews/ADR-0044-lane-a-critique-2026-05-28.md`](../../governance/reviews/ADR-0044-lane-a-critique-2026-05-28.md)
> **Per ADR-0100 §1 classification** (.claude/context/devteam/meetings/2026-05-27-1130-final-spec-migration-strategy/MoM.md)


# ADR-0044 — 保固起算多模式

## Status
Accepted (PARTIAL_UPDATE 2026-05-28)
> 原 Status: Draft (Excel sheet 04 P0 標「未決」) → 2026-05-22 業主推薦 → 2026-05-28 PARTIAL_UPDATE per value decision Q5/Q6/Q7

## Context

保固起算日不同情境不同：
- B2C 散戶：購買日起算
- 建商案件：點交日起算（可能比購買日晚數月）
- 大型專案：啟用日 / 驗收日起算
- 部分品牌：序號註冊日起算

若 hardcode「購買日」會傷建案客戶；若靠每次 case-by-case 判斷會混亂。

源自 Excel-01 sheet 04 P0 保固；M02 Device master；M13 RMA Quality。

## Decision（推薦）

**`Device.warranty_start_date` 支援多模式（mode 欄位）**：

Device schema 加：
```yaml
device:
  warranty_start_date: <date>
  warranty_start_mode: enum [
    purchase_date,        # B2C 預設
    handover_date,        # 建商點交
    activation_date,      # 啟用日 / 序號註冊
    contract_date,        # 大型專案合約日
    manual_override       # 手動指定（需主管核可）
  ]
  warranty_period_months: <int>  # 24 / 36 / 60 視品牌
  warranty_end_date: <computed: start + period>
```

預設規則：
- 一般 B2C 案件：`purchase_date`
- 建商案件（透過 Contract Template ADR-0043 判定）：`handover_date`
- 缺資料 → AI 不可猜，必須轉真人

## Alternatives Considered

### Option A — 強制購買日
- 風險：F1 弱（建案 use case 不支援）
- 建商客戶體驗差，需大量手動 override

### Option B — 依品牌規則動態判斷
- 風險：F2 綁品牌
- 邏輯散落在每個品牌 SOP，難維護

## Consequences

**Positive**：
- Schema 一次設計，覆蓋所有 use case
- 與 ADR-0043 Contract Template 整合（合約決定 mode）
- 與 §F.3 AI-055 Serial 控制對齊（serial 註冊 → activation_date）

**Negative**：
- Device schema 多 2 欄
- 既有 Device record 需 migration 補 mode 欄位

**Mitigation**：
- Migration：既有 Device 預設 `purchase_date`，後續 RMA 時校正
- AI 偵測「保固爭議」→ 強制轉真人（與 §F.3 AI-040 對齊）

## Pre-mortem Mapping

對應 §A F5 + F4。保固規則 hardcode = F5；保固爭議引發法務糾紛 = F4。Schema 化是 future-proof。

## Eternal/Transient Classification

- **Eternal**：§B1 Device.warranty_start_date + warranty_start_mode 欄位
- **Transient**：mode 列表本身（可新增 mode 走 ChangeRequest）

## Acceptance Criteria
- [ ] 業主圈選：**✅ 推薦** / Option A / Option B
- [ ] 主管 + 品牌商簽核 5 種 mode 覆蓋所有 use case
- [ ] Backend migration：既有 Device 補 mode 欄位（預設 purchase_date）
- [ ] 與 ADR-0043 Contract Template `warranty.start_mode` 整合
- [ ] AI 對保固爭議 case 強制轉真人（charter Forbidden 對齊）
- [ ] BI 報表加「warranty.start_mode 分布」監控

## See also
- §F.2 PAIN-POINTS-SUMMARY-2026-05-21.md
- Excel-01 sheet 04 / M02 / M10 / M13 RMA / M14 Builder
- ADR-0043 Contract Template
- ADR-0028 AI 不可判保固責任
- ADR-0053 Serial 控制（serial 註冊與 install_date 關聯）
- ADR-0046 ChangeRequest（B2B contract override 走 CR）
- ADR-0067 M18 runtime config governance（warranty_period_months configurable plane）

---

## §v2 Body Update (PARTIAL_UPDATE 2026-05-28)

> 業主 2026-05-28 value decision Q5/Q6/Q7 拍板 + Lane A critique 2/2 PARTIAL_UPDATE

### §v2.1 — Mode Enum 對齊 Spec 詞彙

原 ADR-0044 §Decision 5 種 mode 對齊 final spec 2026-05-20 用語：

```yaml
device:
  warranty_start_date: <date>
  warranty_start_mode: enum [
    purchase_date,        # B2C 零售 default (spec Q107)
    install_date,         # 零售安裝完工日 (spec G002 「safety_install_date」舊稱對齊 spec)
    handover_date,        # 建商點交日 (spec G002 / Q107 / BR-M14-02)
    brand_warranty_date,  # 品牌保固起算日 (spec G002 — 部分品牌另計)
    contract_date,        # B2B 合約日 (BR-M14-02)
    manual_override       # exception；需主管核可 + 審計
  ]
  warranty_period_months: <int>  # default 24 / 36 / 60 視品牌；B2B 可 override 見 §v2.3
  warranty_period_months_override: <nullable int>  # B2B contract override (see §v2.3)
  warranty_end_date: <computed: start + period>
  warranty_scope: enum [device, component]  # Phase II 升 part-level hook (見 §v2.4)
  warranty_inherit_from_site_group: bool   # 建商社區共用保固條件 (BR-M02-03 / G003)
```

**Mode 與 spec 對應表**：

| Mode | Spec 來源 | 適用場景 | Default for |
|:-----|:---------|:---------|:-----------|
| `purchase_date` | Q107 | B2C 零售 | B2C 散戶 |
| `install_date` | G002（原 ADR 的 `safety_install_date` 對齊） | 零售安裝完工 | 智慧鎖零售（高於 B2C default 取此） |
| `handover_date` | G002 / Q107 / BR-M14-02 | 建商點交 | 建商案件 |
| `brand_warranty_date` | G002 | 品牌另計保固 | 部分品牌（如 OEM rebadged） |
| `contract_date` | BR-M14-02 | B2B 合約 | 大型專案 / B2B 合約客戶 |
| `manual_override` | — | exception | 缺資料時走人工 + 主管核可 |

**預設規則**：
- B2C 案件：`purchase_date`
- B2C 零售安裝（透過 install_date 可考據時）：`install_date`
- 建商案件（透過 ADR-0043 Contract Template 判定）：`handover_date`
- 缺資料 → AI 不可猜，必須轉真人 (per ADR-0028)

### §v2.2 — RMA Reset Policy (業主 Q5)

> **業主 Q5 = 加被修期間延長 + 換新零件部分獨立重算 90 天**
> Rationale: 消保法第 22 條相容；業界 default；避免「修一次重算 1 年」惡意利用

**規則**：

| 情境 | Warranty 重算規則 | 證據要求 |
|:----|:------------------|:--------|
| **被修期間延長**（任何維修） | 原 `warranty_end_date` += 維修天數 (RMA in 到 RMA out) | RMA case ID + in/out timestamp |
| **換新主鎖**（device-level RMA） | warranty_end_date 從 RMA 完工日起算原期（不重新給 1 年） + 該被換 component 90 天獨立保固 | 換新照片 + RMA case ID + serial 新舊對照 |
| **換新零件**（component-level RMA, Phase II 起） | 主鎖 warranty 不變；該零件 warranty 從 RMA 完工日起算 **90 天獨立保固** | 同上 + part_serial |
| **維修不換主件** | warranty 不重算（僅 §v2.2 第 1 條延長被修期間） | RMA case ID |

**法律依據**：
- 消保法第 22 條（廣告承諾或實質提供應屬保固範疇）
- 消保法第 24 條（維修期間視為保固期延長）

**約束**：
- RMA reset 觸發必須主管核可（per BR-M13-NN）
- audit trail 必填 `original_warranty_end_date`, `new_warranty_end_date`, `rma_case_id`, `evidence_ids[]`, `supervisor_approval_id`
- AI 永禁判定 RMA reset（per ADR-0028）

### §v2.3 — B2B Contract Override (業主 Q6)

> **業主 Q6 = 可覆寫 = 合約 PDF + 主管 approve + audit trail + 上限 5 年**
> Rationale: 台灣 B2B（建商/品牌）一定要客製；不支援會在 Excel 外掛管理導致 audit 失控

**規則**：

| 維度 | 限制 |
|:----|:-----|
| **可 override 的欄位** | `warranty_period_months_override`, `warranty_start_mode` (限 contract_date / handover_date / brand_warranty_date), `warranty_inherit_from_site_group` |
| **上限** | `warranty_period_months_override ≤ 60`（5 年）。超過必須走 Sponsor 核可（per ADR-0040 v2 §v2.4 L5 Sponsor 機制） |
| **必要條件** | (1) 合約 PDF 上傳到 contract_documents 表 + linked `contract_id`；(2) 主管 (>= ops_supervisor) approve；(3) audit log 留證；(4) 走 ChangeRequest (ADR-0046) |
| **變更 lifecycle** | 第一次設定 → 走 ChangeRequest approval；後續修改 → 同流程，audit 留 diff |
| **稽核** | M19 BI 每月 report B2B override 比率 + 異常監控（如 50% 以上 override 觸 alarm） |

**Audit Schema 要求**：

```yaml
device_warranty_b2b_override:
  contract_id: string                # 必填
  contract_pdf_doc_id: string        # 必填，linked to contract_documents 表
  original_warranty_period_months: int
  override_warranty_period_months: int  # ≤ 60
  override_mode: enum
  approver_id: string                # 必填 (>= ops_supervisor)
  sponsor_id: nullable               # 當 > 60 時必填
  change_request_id: string          # cascade ADR-0046
  approved_at: timestamp
  audit_diff: json
```

### §v2.4 — Part-level 升維時機 (業主 Q7)

> **業主 Q7 = A Phase II 才升；Phase I 整機 1 年但 BOM 階層紀錄留 Phase II 鋪路**
> Rationale: 智慧鎖多零件 (鎖體/馬達/感應器/電池/面板)，業界 default 分零件保固，但 Phase I MVP 簡化重要

**規則**：

| Phase | Warranty Scope | BOM 紀錄 |
|:------|:---------------|:---------|
| **Phase I (MVP launch)** | `warranty_scope = device`（整機 1 年 / 24 個月，per brand default） | M10 two-layer BOM (主鎖 → 零件) **必填紀錄**，但 warranty 仍整機計算 |
| **Phase II** | `warranty_scope` 可改 `component`，每個 component 獨立 warranty_start_date / warranty_period_months | 沿用 Phase I 已建立的 BOM 階層 |
| **升維觸發** | Phase II ADR-0044a 寫成 + ERD migration script + UI 升維 | follow-up ADR-0044a |

**Phase I BOM 階層紀錄要求**（給 Phase II 鋪路）：
- M10 `device_components` 子表必填：`part_serial`, `part_type` (lock/motor/sensor/battery/panel), `installed_at`, `replaced_at (nullable)`
- 即使 Phase I warranty 是整機 1 年，BOM 階層紀錄一個都不能漏
- RMA 換零件時必須紀錄 part_serial 對照（per §v2.2 第 3 條，雖然 Phase I warranty 仍整機計，但 Phase II 升維時可以 backfill 計算）

**Phase II 升維 hook**:
- `warranty_scope` 欄位 Phase I 預設 `device`，Phase II 可改 `component`
- ERD 預留 `device_component_warranty` 子表 schema（Phase I 不寫資料、Phase II 啟用）
- 升維 ADR-0044a 將決定（a）main rule 是 component-level（b）migration 策略（c）UI / API 升維時程

### §v2.5 — Site Group Inheritance (Lane A critique 補項)

對齊 BR-M02-03 / G003：「同社區共用保固條件」「Builder projects 必須有 site group, unit list, handover/warranty date」。

**規則**：

```yaml
site_group:
  default_warranty_start_mode: enum    # 同社區共用
  default_warranty_period_months: int
  default_handover_date: date

device:
  warranty_inherit_from_site_group: bool  # Phase I 預設 true (建商案件)
  # 若 inherit=true: warranty_start_date / mode / period 從 site_group 取
  # 若 inherit=false: device 層 override 需主管核可
```

### §v2.6 — Acceptance Criteria (v2 G/W/T)

```gherkin
# AC-44-01 零售 install_date 為 default
Given device 屬 B2C 零售 AND brand 預設 install_date AND installer 已回報 install_date = 2026-01-15
When warranty 計算
Then warranty_start_date = 2026-01-15 AND mode = install_date AND warranty_end_date = 2027-01-15

# AC-44-02 建商 handover_date
Given device 屬 builder project P-001 AND P-001.handover_date = 2026-03-20
When warranty 計算
Then warranty_start_date = 2026-03-20 AND mode = handover_date

# AC-44-03 RMA 換主鎖 reset 90 天
Given device 原 warranty_end_date = 2027-01-15 AND RMA in 2026-06-01 AND out 2026-06-10
When 換新主鎖完成
Then 主鎖 warranty_end_date = 2026-06-10 + 1 year + 9 days (10-1 維修延長)
  AND 換新主鎖 component_warranty_end_date = 2026-06-10 + 90 days

# AC-44-04 B2B contract override 上限 5 年
Given B2B contract C-100 設定 override = 84 months (7 年)
When 系統 validate
Then reject + 422 over_limit AND 提示 Sponsor 核可路徑

# AC-44-05 Site group inheritance
Given site_group SG-001 default_handover_date = 2026-02-01 AND device D-001 inherit=true
When warranty 計算
Then D-001.warranty_start_date = 2026-02-01 AND mode = handover_date

# AC-44-06 缺資料 → AI 強制轉真人
Given device 缺 warranty_start_date AND warranty_start_mode = null
When AI 收客戶保固查詢
Then transfer_to_human (reason = warranty_data_missing) AND audit log
```

### §v2.7 — 影響的下游文件（v2 cascade）

| Doc | Impact |
|:---|:---|
| `docs/analysis/fr/FR-0015-warranty-claim.md` | superseded_clauses 註解修正為「BR-WARRANTY-001 被 ADR-0044 mode enum 整體取代」；補 AC-06 (site group inherit) / AC-07 (建商 vs 零售 mode 預設) / AC-08 (RMA 換新主鎖重算 90 天) |
| `docs/data/erd-m02.md` | Device 加 `warranty_start_mode`, `warranty_inherit_from_site_group`, `warranty_period_months_override`, `warranty_scope` 欄位；site_group 加 default_warranty_* 欄位；新增 `device_warranty_b2b_override` 子表（含合約 PDF refs + audit） |
| `docs/data/erd-m10.md` | `device_components` 子表 schema（part_serial, part_type, installed_at, replaced_at）必填 — Phase I 紀錄、Phase II 啟用 part-level warranty |
| `docs/api/openapi-m02.yaml` | warranty_start_mode enum + B2B override endpoint contract |
| `docs/qa/test-plan-m02.md` | ≥ 8 TC 涵蓋 §v2.6 AC-44-01~06 + RMA reset + B2B override + Phase II hook |
| `docs/architecture/adr/ADR-0044a-component-level-warranty.md` | follow-up Phase II ADR（待 RMA test scenario 完整後寫） |

### §v2.8 — Acceptance Criteria 重 retag

- [x] 業主 Q5/Q6/Q7 拍板（2026-05-28 value decision）
- [x] mode enum 對齊 spec 詞彙（install_date / handover_date / brand_warranty_date）
- [ ] FR-0015 cascade (analyst)
- [ ] M02 / M10 ERD migration (design + dba)
- [ ] QA 補 8 條 G/W/T TC
- [ ] M19 BI 加 「B2B override 比率 / RMA reset 比率 / mode 切換頻次」 監控
- [ ] ADR-0044a follow-up (Phase II 升維)
