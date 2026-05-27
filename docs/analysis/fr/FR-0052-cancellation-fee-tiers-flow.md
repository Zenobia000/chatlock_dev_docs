---
id: FR-0052
title: Cancellation Fee 5-Tier Flow（取消費分層 + reason code + 師傅 initiated）
status: placeholder
phase: I
placeholder_only: true
placeholder_reason: "Gate 2 critique MF-3 / Roundtable B cascade — 主檔 Flow S4 取消費分層流程缺對應 FR。Body 由 Analyst driver D-3 補 (BR-CANCEL-* + G/W/T)，依 ADR-0039 v2 cascade（業主 value decision Q1=NTD 300 / Q2=S1.5 拆出免收費 / Q3=師傅 initiated 混合政策）"
mapped_to:
  - M15    # Exception / cancellation primary
  - M17    # Audit / SoD
  - M16    # Comms (cancellation notification)
  - M18    # reason_code lookup table 管轄
owner: 客服 / 派工主管 / 客戶
related_adrs:
  - ADR-0039   # cancellation-fee-policy v2（業主 value decision cascade）
  - ADR-0065   # change-request-type-lookup-table（reason_code）
created_in: "Gate 2 UX MF-3 placeholder (2026-05-28)"
related_user_flow: docs/ux/user-flow-smart-lock-saas.md#flow-s4
---

# FR-0052 — Cancellation Fee 5-Tier Flow [PLACEHOLDER]

> **Phase I placeholder** — 主檔 user-flow Flow S4 §S4 cancellation 段落已寫 mermaid + 5 階段定義 + reason_code lookup，但缺正式 FR 殼。本 placeholder 占位，待 Analyst driver D-3 補 BR + G/W/T。

## §1 Scope Intent

涵蓋客戶 / 客服 / 派工 / 師傅發起的取消 / 改期請求，依當前 WO state 套用 5 階段取消費政策：

| 階段 | WO state | 取消費 |
|:-----|:---------|:------|
| **S1** 報價未確認 | quote_pending | 0 元 |
| **S1.5** 已確認未派工 | quote_confirmed | 0 元（業主 Q2 拆出免收費）|
| **S2** 派工未出發 | dispatched | NTD 300（業主 Q1 取代 spec 500）|
| **S3** 出發後 / 未到場 | en_route | 車馬費 |
| **S4** 到場後 / 未施工 | onsite | 車馬費 + 檢測費 |
| **S5** 已施工 | working | 按比例收費 |

師傅 initiated cancel 政策（業主 Q3 混合）：
- 首次免責
- 同月 ≥2 次扣款
- 不可抗力憑證明免責

reason_code 來自 M18 admin UI 維護的 lookup table（ADR-0065）。

## §2 Acceptance Criteria（待 Analyst driver 補 G/W/T）

- AC-01 5 階段取消費計算正確（給 G/W/T 對應 ADR-0039 v2 §費率表）
- AC-02 reason_code 必填 + 從 M18 lookup table 拉
- AC-03 audit log 完整（who / when / which stage / fee_amount / reason_code）
- AC-04 師傅 initiated 政策：首次免責 + 同月計數器 + 不可抗力憑證 escape hatch
- AC-05 SoD：客戶端 cancel ≠ 客服 cancel ≠ 師傅 cancel；各路徑權限分離

## §3 Out-of-Scope

- 退款發起 / 核准（屬 FR-0014）
- 保固爭議取消（屬 FR-0015）
- WO 狀態機本身（屬 FR-0010 reschedule-delay 與 FR-0009 completion-sign）

## §4 Phase II 預留

- bulk cancel（活動 / 系統異常）
- 客戶端取消費明細透明化 LIFF view（目前僅後台計算）
- 跨平台取消（LINE / 客服電話 / Web）統一入口

## §5 相關文件

- User Flow：[`../../ux/user-flow-smart-lock-saas.md#flow-s4`](../../ux/user-flow-smart-lock-saas.md)
- ADR-0039 v2（待 Arch driver D-2 補 body）：cancellation fee policy v2
- ADR-0065：change-request-type lookup table
- Source spec：`docs/_source/01-workorder-erp.md` Q047 / Q069 / Q070 / Q071
- Business Rules：BR-CANCEL-* (Analyst driver D-3 待建)
