---
id: ADR-0039
title: 取消費分段 — 5 階段門檻 + Configurable
status: accepted
date: 2026-05-21
source_trade_off: §F.2 取消費分段 + §F.3 AI-029 PAIN-POINTS-SUMMARY-2026-05-21.md
deciders: [業主]
accepted_date: 2026-05-22
related:
  - 01-workorder-erp-final-spec-20260520.xlsx#sheet-04 (P0)
  - 01-workorder-erp-final-spec-20260520.xlsx#sheet-08 (Phase II)
  - 01-workorder-erp-final-spec-20260520.xlsx#sheet-18 (AI-029)
  - "./ADR-0040-refund-approval-tiers.md"
pre_mortem: F4 (合規崩潰 — 取消費爭議引發法務糾紛)
eternal_transient: Eternal Policy (B3) + Configurable rule (B4 ledger)
---

> 
> **🔄 Migration Status (2026-05-28)**: `REVIEW_REQUIRED (Lane A critique pending — A2.4)`
> **Reviewed against**: 2026-05-20 final spec (xlsx)
> **Reviewed on**: 2026-05-28
> **Per ADR-0100 §1 classification** (.claude/context/devteam/meetings/2026-05-27-1130-final-spec-migration-strategy/MoM.md)


# ADR-0039 — 取消費分段

## Status
Accepted (2026-05-22)

## Context

客戶取消案件時收多少費用？目前未決議導致 AR module 阻擋 + 客服面對爭議無一致說法。需在「客戶體驗」與「平台 / 師傅成本回收」間找平衡。

源自 Excel-01 sheet 04 P0 取消費條目；sheet 08 Phase II Finance；sheet 18 AI-029。

## Decision（業主拍板 2026-05-22）

**5 階段 system 自動推算 + 全階段客服可覆寫 + audit log**：

| 階段 | 觸發點 | 收費標準（V1 預設） | 客服覆寫 |
|------|-------|------------------|---------|
| S1 | 報價未確認前取消 | NTD 0 | ✅ |
| S2 | 已派工、師傅未出發 | **NTD 0**（業主決議：師傅未出發無實質成本，免費）| ✅ |
| S3 | 師傅已出發、未到場 | 收取**車馬費** NTD 500-1,200（依距離）| ✅ |
| S4 | 已到場、無法 / 不施工 | 車馬費 + 檢測費 NTD 300 | ✅ |
| S5 | 已施工後取消 | **按比例 partial**：`partial = 完工項目% × 完整費用 + 車馬費` | ✅ |

**核心規則**：
1. **System 自動推算階段**：依 WorkOrder state machine 即時判定，不依賴 AI / 客服人工
2. **全階段客服可覆寫**：所有 5 階段金額客服皆可手動修改，但必須：
   - 留 audit log（操作人 / 時間 / 原值 / 新值 / 原因）
   - 若調整 > 50% 或免收，需主管覆核
   - 進 Refund Ledger 留證
3. **「已施工按比例」partial 公式**（合約常見條款，必須保留）：
   - `cancellation_fee = (完工項目數 / 全部項目數) × 工項總額 + 車馬費`
   - 對應 ADR-0049 現場加價的 onsite scope change 規則
4. **金額 configurable per brand**：透過 ChangeRequest (ADR-0046) 修改

**與舊版差異**（業主備註調整）：
- 舊「已派工未出發 收檢測費 NTD 300」→ 改為**不收費**（業主：師傅未出發無實質成本）
- 舊「已確認報價未派工 24h 反悔期」階段併入 S1「報價未確認」
- 新增**全階段客服可覆寫**機制（舊版未提）

## Alternatives Considered

### Option A — 純 5 階段（無客服覆寫）
- 風險：F4 客服無爭議處理彈性 → 客訴升級
- 已捨棄

### Option B — 3 階段簡化（未派 / 已派 / 已施工）
- 風險：F1（顆粒度太粗）
- 客訴爭議 ↑，師傅出發 vs 到場 的差異無法表達
- 已捨棄

### Option C — Per brand contract 各自定義（無平台預設）
- 風險：F5 規模困境
- 30 品牌 = 30 套規則，AI / 客服培訓成本爆炸
- 已捨棄

## Consequences

**Positive**：
- 5 階段對應實際業務點，師傅 / 客戶 / 客服三方好溝通
- Configurable 支援品牌差異化
- 與 ADR-0041 車馬費 / ADR-0049 現場加價對齊

**Negative**：
- AI 分類「目前處於哪階段」可能誤判 → 影響取消費計算
- 5 階段需 UI 清晰呈現給客服

**Mitigation**：
- 取消費計算交由 backend state machine 自動推算，不靠 AI
- 客服 UI 顯示「當前階段 + 預期取消費」即時試算
- 異常爭議走 Exception module 主管核可

## Pre-mortem Mapping

對應 §A F4。取消費規則不清 → 客戶爭議 → 法務糾紛 → 合規風險。把規則固化為 §B3 Policy + §B4 ledger entry，audit trail 永久留證。

## Eternal/Transient Classification

- **Eternal**：「5 階段門檻 + 取消費入 Refund Ledger」原則（§B3 + §B4）
- **Transient**：具體金額（configurable per brand via ChangeRequest）

## Acceptance Criteria
- [x] 業主拍板 2026-05-22：✅ Option (c) 混合方案（5 階段 system 自判 + 全階段客服覆寫 + partial 公式）
- [ ] 主管 + 會計簽核 5 階段門檻 + V1 預設金額（特別注意 S2 = 0 與舊版 NTD 300 差異）
- [ ] Backend 實作 state machine 自動推算階段（依 WO state）
- [ ] Backend 實作客服覆寫 API：必填操作人 / 原因；> 50% 或免收需主管覆核
- [ ] AR module 加 Cancellation Fee ledger entry + Override audit log
- [ ] 客服 UI 顯示「當前階段 + system 預設金額 + 覆寫輸入框 + 試算」
- [ ] AI 永禁直接告知客戶金額（與 ADR-0035 一致，只能說「依階段不同，NTD 0-1,500」）
- [ ] partial 公式 (S5) 與 ADR-0049 onsite scope change 對齊
- [ ] QA 補 TC：5 階段切換、覆寫 audit、partial 計算、> 50% 主管覆核回歸測試

## See also
- §F.2 + §F.3 AI-029 PAIN-POINTS-SUMMARY-2026-05-21.md
- Excel-01 sheet 04 / sheet 08 / sheet 18 / M11 AR / M15 Exception
- ADR-0040 退款核准分層（cancellation fee 屬於 refund 邊界）
- ADR-0041 車馬費歸屬
- ADR-0046 ChangeRequest（金額變更走此流程）
- ADR-0066 Quote ↔ WorkOrder Lifecycle Hard Binding（S1 階段對齊：標準路徑 `WO.created` 前 quote 必須 customer_confirmed）

---

## v2 Update Note (2026-05-26) — Reason Code 補充

連動 Forum Q-01 收斂（業主 Q1=A 硬綁定 + Q3=A 急件 carve-out，ADR-0066）：

**新增 reason code**：`customer_quote_rejected_after_dispatch`

| 適用場景 | 說明 |
|:---|:---|
| **適用** | onsite scope change v+1 加價路徑客戶拒絕（呼應 ADR-0049 customer_disagreed_partial onsite state）|
| **不適用** | 標準路徑派工後客戶拒絕原 quote（Q1=A 硬綁定下此 case 不存在，quote 已 customer_confirmed 才能建 WO）|

**S5 partial 公式延伸**：onsite v+1 加價被拒時，原 quote v1 已 confirmed → 完工項目按 v1 quote 收費；v+1 加項目走 `customer_disagreed_partial` 由 ADR-0049 三件套吸收 + 客服 escalate queue。

**Audit log 必填欄位**：

- `reason_code`: `customer_quote_rejected_after_dispatch`
- `quote_version`: v+1 拒絕版本
- `original_quote_id`: v1 已 confirmed 版本
- `onsite_evidence_ids`: ADR-0049 三件套 evidence_id 陣列
