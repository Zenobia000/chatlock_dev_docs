---
id: ADR-0032
title: 缺地址處理 — 追問 + 後台補填 + 無地址 422 hard stop
status: accepted
date: 2026-05-21
source_trade_off: §F.1 GAP-D02 PAIN-POINTS-SUMMARY-2026-05-21.md
deciders: [業主]
accepted_date: 2026-05-22
related:
  - "./ADR-0031-ai-auto-convert-to-work-order.md"
  - 02-ai-chatbot-sync-final-spec-20260520.xlsx#sheet-15
  - 02-ai-chatbot-sync-final-spec-20260520.xlsx#sheet-19 (D02)
pre_mortem: F2 (知識被技術綁架) + F5 (規模困境)
eternal_transient: Eternal State Machine (B2)
---

> 
> **🔄 Migration Status (2026-05-28)**: `STILL_VALID_UNDER_M01_M02`
> **Reviewed against**: 2026-05-20 final spec (xlsx)
> **Reviewed on**: 2026-05-28
> **Module scope**: M01, M02
> **Per ADR-0100 §1 classification** (.claude/context/devteam/meetings/2026-05-27-1130-final-spec-migration-strategy/MoM.md)


# ADR-0032 — 缺地址時的處理規則

## Status
Accepted (2026-05-22)

## Context

地址是 WorkOrder 派工的物理必要欄位。若允許「先建單再補地址」會造成派工到不全地址的師傅空跑、客戶不滿、難對帳。但若強制 conversation 內 100% 收齊才能建 PC，會導致 50% 客戶在地址環節放棄。

需要在「資料完整性」與「客戶體驗」間找平衡點。

源自 DISC-0001 §3 第 D02 條；Excel-02 sheet 15（資料對照 address 欄）+ sheet 19。

## Decision（業主拍板 2026-05-22）

**三段補 + 結案前硬 gate（推薦做法 + 客製 gate 位置）**：

1. **AI 對話階段（最佳努力收集）**：
   - LINE 追問（AI 主動 Quick Reply：「請提供完整地址（路 / 街 / 號 / 樓）」）
   - 後台補填（客服可在 PC confirm 前手動補）
   - **無地址仍允許轉 WO**（與舊版差異，派工不擋）

2. **派工階段（軟性處理）**：
   - WorkOrder 可在 `address = null` 狀態下進入 `assigned`
   - 師傅 App 顯示「地址待補」標籤
   - 師傅若已知客戶地址 → 可在 App 內標記 `address_known_by_locksmith = true` 並 skip 進入施工

3. **結案階段（硬 gate）**：
   - WorkOrder 從 `completed` 進入 `closed` 時，**backend 強制 validate** `address != null AND address.length >= MIN_ADDRESS_LENGTH`
   - 不符合 → API 回 `422 VALIDATION_ERROR` + `error_code: ADDRESS_REQUIRED_BEFORE_CLOSE`
   - 師傅或客服可從 App / 後台補填，補完才能結案
   - 月結對帳前已硬 gate，不會有地址缺失工單漏網

4. **監控**：
   - BI 報表加「無地址工單 vs 結案前回填率」儀表板
   - 警示：若回填率 < 95%，視為流程瓶頸

```yaml
# WorkOrder state machine 前置條件
state_transitions:
  created → assigned:
    requires:
      - problem_card.status == confirmed
      # address 可為 null（派工不擋）
  completed → closed:
    requires:
      - work_order.customer_address != null
      - work_order.customer_address.length >= MIN_ADDRESS_LENGTH (configurable, default 12)
    on_fail: 422 ADDRESS_REQUIRED_BEFORE_CLOSE
```

## Alternatives Considered

### Option A — 允許 WO 建立後再補地址（無 close gate）
- 風險：F5 規模困境（地址永久空白工單漏進對帳）
- 代價：師傅空跑 / 客訴 / 月結對帳混亂
- 已捨棄

### Option B — 強制 conversation 內 100% 收齊才能建 PC
- 風險：F1 弱（過嚴流失客戶）
- 代價：50% PC 在地址環節放棄
- 已捨棄

### Option C — 派工前 hard gate（舊版推薦做法）
- 風險：與業主現場流程衝突 — 師傅可能已知地址 / 可由 LINE GPS 補
- 代價：派工卡關率 +20%
- 已捨棄（改為結案前 gate，給足補救機會）

## Consequences

**Positive**：
- 地址是 WO 生命必要欄位 → schema 契約而非建議
- 422 hard stop 強制 backend 一致性
- 三段式 fallback 提供 UX 緩衝

**Negative**：
- ~5% PC 因地址沒齊放棄轉 WO（vs 客服可介入補填，預期可降至 2%）

**Mitigation**：
- 未來若有可信 GPS / LBS API（如 LINE GPS）可從通道帶入 → 評估 Option A 的部分自動補填
- `MIN_ADDRESS_LENGTH` configurable per locale（台灣 vs 新加坡可不同）

## Pre-mortem Mapping

對應 §A F2 + F5。地址欄位若埋在 prompt 預設或 application logic，換 LINE 後資料散失（F2）；換國家後台灣地址格式 hardcode 全部要改（F5）。

把地址視為 §B1 業務物件 Customer.address / Site.address 一級欄位，schema 強制驗證，與通道 / LLM provider 無關。

## Eternal/Transient Classification

- **Eternal**：§B2 WO state machine `created` 前置條件、§B1 Customer/Site address 欄位
- **Transient**：Quick Reply UI 模板（§C1 IngressChannel）、地址解析 service（§C3 / 第三方）

## Acceptance Criteria
- [x] 業主拍板 2026-05-22：✅ 推薦做法 + 客製「結案前 gate」
- [ ] Tech Lead 簽核 `MIN_ADDRESS_LENGTH` 預設值（建議 12 中文字元）
- [ ] Backend 實作 WO state machine：`created → assigned` 不擋地址 / `completed → closed` 422 hard gate
- [ ] Backend 實作 error_code `ADDRESS_REQUIRED_BEFORE_CLOSE`
- [ ] 師傅 App 加「地址待補」標籤 + `address_known_by_locksmith` flag + 補填 UI
- [ ] BI 報表加「無地址工單 vs 結案前回填率」儀表板（警示閾值 < 95%）
- [ ] QA 補 TC-SYNC-05（缺地址不擋派工）+ TC-SYNC-06（缺地址擋結案 422）回歸測試
- [ ] PII 影響評估：地址屬 PII，retention 與 evidence 可見性對齊 ADR-0050/0051

## See also
- §F.1 GAP-D02 PAIN-POINTS-SUMMARY-2026-05-21.md
- Excel-02 sheet 15（資料對照 address）、sheet 19 D02、sheet 20 TC-SYNC-05
- ADR-0031（convert_to_wo 前置條件）
- ADR-0050 Evidence 可見性（地址屬 PII）
