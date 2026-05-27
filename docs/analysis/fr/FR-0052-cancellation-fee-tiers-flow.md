---
id: FR-0052
title: Cancellation Fee 6-Tier Flow（取消費分層 + reason code + 師傅 initiated）
status: active
phase: I
mapped_to:
  - M15    # Exception / cancellation primary
  - M17    # Audit / SoD
  - M16    # Comms (cancellation notification)
  - M18    # reason_code lookup table 管轄
  - M11    # Settlement (cancellation fee ledger)
superseded_clauses:
  - BR-CANCEL-001    # S1 報價未確認 — 0 元
  - BR-CANCEL-002    # S1.5 已確認未派工 — 0 元（業主 Q2 拆出免收費）
  - BR-CANCEL-003    # S2 派工未出發 — NTD 300（業主 Q1）
  - BR-CANCEL-004    # S3 出發後 / 未到場 — NTD 500
  - BR-CANCEL-005    # S4 到場後 / 未施工 — NTD 800
  - BR-CANCEL-006    # S5 已施工 — 按比例 + floor 800
  - BR-CANCEL-007    # 師傅 initiated cancel 政策（業主 Q3 混合）
  - BR-CANCEL-008    # reason code dictionary
emits_events:
  - WorkOrderCancelled
  - TechnicianInitiatedCancel
  - CancellationFeeCharged
  - CancellationOverrideAudited
owner: 客服 / 派工主管 / 客戶
last_reviewed: 2026-05-28
related_adrs:
  - ADR-0102   # cancellation-fee-policy v2（業主 value decision cascade，supersedes ADR-0039）
  - ADR-0065   # change-request-type-lookup-table（reason_code）
  - ADR-0050   # evidence-visibility-matrix v2 (PARTIAL — 客戶不在場 cancellation evidence)
  - ADR-0067   # m18-runtime-config-governance（configurable 金額）
  - ADR-0041   # travel-fee-split（S3 車馬費歸屬）
  - ADR-0049   # onsite-scope-change-protocol（S4/S5 partial 計算）
created_in: "Gate 2 UX MF-3 placeholder (2026-05-28)"
upgraded_to_active: "2026-05-28 — Analyst driver D-3 cascade after ADR-0102 + BR-CANCEL-001..008 published"
related_user_flow: docs/ux/user-flow-smart-lock-saas.md#flow-s4
related:
  - "../../_source/01-workorder-erp.md#m15-exception"
---

# FR-0052 — Cancellation Fee 6-Tier Flow

> **狀態**: 2026-05-28 由 placeholder 升為 active。對齊 ADR-0102 + BR-CANCEL-001..008 + ADR-0050 v2 cascade。
> **Note**: 主流程已由 FR-0010 §1.2 完整實作（reschedule + cancellation 同檔）；本 FR 為 user-flow Flow S4 反向定位入口，**rule 全部委由 BR-CANCEL-001..008 與 FR-0010 G/W/T**（不重複）。

## §1 Use Case Skeleton

| 欄位 | 內容 |
|:-----|:-----|
| **Actor** | 客戶 / 客服 (override) / 派工主管 / 師傅 (initiated path) |
| **Secondary Actors** | M11 AR (fee ledger), M15 Exception, M16 Comms, M17 Audit, M18 Config (reason_code lookup) |
| **Trigger** | 客戶 / 師傅 / 客服 / 派工主管發起 cancel |
| **Precondition** | WO 屬 cancel-able 狀態（S1 ~ S5 對應 wo.status + technician.gps_status） |
| **Main Flow** | 委派 FR-0010 §1.2（6-stage cancellation cascade） |
| **Alternative Flow** | 委派 FR-0010 §1.3 A4 / A5 / A6 |
| **Postcondition** | wo.cancelled + fee 落 M11 ledger + reason_code audited + emit `WorkOrderCancelled` |
| **Out-of-Scope** | 退款發起 / 核准（屬 FR-0014）；保固爭議取消（屬 FR-0015）；WO 狀態機本身（屬 FR-0010 / FR-0009） |

### §1.1 6-Stage Cancellation Cascade

| 階段 | WO state | 取消費 | BR |
|:-----|:---------|:------|:---|
| **S1** 報價未確認 | quote_pending / quote_sent_unconfirmed | NTD 0 | BR-CANCEL-001 |
| **S1.5** 已確認未派工 | quote_confirmed AND technician_id IS NULL | NTD 0 | BR-CANCEL-002 |
| **S2** 派工未出發 | dispatched AND gps='not_departed' | NTD 300 | BR-CANCEL-003 |
| **S3** 出發後 / 未到場 | en_route | NTD 500（含車馬，ADR-0041） | BR-CANCEL-004 |
| **S4** 到場後 / 未施工 | on_site AND work_started=false | NTD 800（車馬 + 檢測） | BR-CANCEL-005 |
| **S5** 已施工 | in_progress | 按完工比例 + 材料 + 車馬，floor NTD 800 | BR-CANCEL-006 |

師傅 initiated cancel 政策（[ref: BR-CANCEL-007]）：
- 首次免責 + weight -5
- 同月 ≥2 次 → 扣 NTD 500 + weight -10 + 自動 reassign
- 不可抗力（醫療 / 車禍 / 重大事故）需 ops 主管 approve + 證明文件 audit retain ≥ 1 yr

reason_code 必填（[ref: BR-CANCEL-008]）：採 4 大類 enum（business / customer / technician / system），enum 維護於 M18 config，free-text 補充 ≤ 200 字。

## §2 Acceptance Criteria（委派 FR-0010 §2 AC-02 ~ AC-12）

本 FR 不重複 G/W/T；rule + AC 在 FR-0010 §2.AC-02..12 + BR-CANCEL-001..008 處實作。本 FR 的責任是**對齊 user-flow Flow S4 入口**並提供 6-tier 概覽。

cross-AC mapping：

| FR-0010 AC | 階段 | BR |
|:-----------|:-----|:---|
| AC-02 | S1 | BR-CANCEL-001 |
| AC-03 | S1.5 | BR-CANCEL-002 |
| AC-04 | S2 (NTD 300) | BR-CANCEL-003 |
| AC-05 | S3 (NTD 500) | BR-CANCEL-004 |
| AC-06 | S4 (NTD 800) | BR-CANCEL-005 |
| AC-07 | S5 (按比例 + floor 800) | BR-CANCEL-006 |
| AC-08 | 客服覆寫 > 50% 調降 → 主管覆核 | BR-CANCEL-003..006 |
| AC-09 | 師傅同月首次免責 | BR-CANCEL-007 |
| AC-10 | 師傅同月第 2 次扣 NTD 500 | BR-CANCEL-007 |
| AC-11 | 師傅不可抗力憑證明免責 | BR-CANCEL-007 |
| AC-12 | 缺 reason code → 422 | BR-CANCEL-008 |

## §3 Evidence / SoD Cross-Cuts

- **客戶不在場 cancellation**（S3 / S4 客戶聯絡不上）→ 走 ADR-0050 v2 evidence-visibility-matrix（photo evidence + GPS + timestamp）
- **SoD 三維**（initiator 客戶 / approver 客服 / executor 系統）→ 對齊 ADR-0102 §sod-cancel
- **客服覆寫 audit**（> 50% 調降或免收）→ emit `CancellationOverrideAudited` event 進 M19 BI

## §4 Out-of-Scope

- 退款發起 / 核准（屬 FR-0014 + BR-REFUND-001/006）
- 保固爭議取消（屬 FR-0015 + BR-WARRANTY-005..007）
- WO 狀態機本身（屬 FR-0010 reschedule-delay 與 FR-0009 completion-sign）
- Phase II 預留：bulk cancel（活動 / 系統異常）、客戶端取消費明細 LIFF view、跨平台統一入口（LINE / Web / 客服電話）

## §5 相關文件

- **Owner FR**：[FR-0010 reschedule-delay](./FR-0010-reschedule-delay.md) — 6-stage cancellation cascade 完整實作
- **User Flow**：[`../../ux/user-flow-smart-lock-saas.md#flow-s4`](../../ux/user-flow-smart-lock-saas.md)
- **ADR**：ADR-0102 (cancellation v2 + reason code + 師傅 initiated) / ADR-0050 v2 (evidence) / ADR-0067 (configurable 金額)
- **BR**：BR-CANCEL-001..008（rule clause SoT）
- **Source spec**：`docs/_source/01-workorder-erp.md` Q047 / Q069 / Q070 / Q071 / §15 M15

## §6 Change Log

| Date | Change | Why |
|:-----|:-------|:----|
| 2026-05-28 | placeholder → active（Analyst driver D-3 cascade） | ADR-0102 + BR-CANCEL-001..008 published; 對齊 value-decisions 2026-05-28 Q1/Q2/Q3 |
