---
id: FR-0008
title: Scope Change 流程（增項 / 改價）
status: active
phase: I
mapped_to:
  - M15   # Exception / Approval / Risk Control (primary owner)
  - M17   # Authorization / Audit (approval routing)
  - M16   # Communication (LINE 客戶確認)
  - M08   # Onsite (現場觸發點)
superseded_clauses:
  - BR-M15-01    # Change Request object 結構 (= ADR-0046, ADR-0065)
  - BR-M15-NN    # scope change ≥ 50% 原價 強制 admin 簽核
  - BR-M15-NN    # 客戶 30 min 未回覆 → 暫停施工
  - BR-M08-NN    # 現場 scope change protocol (= ADR-0049)
  - BR-M17-NN    # 雙簽 (技師 + 客戶) audit
emits_events:
  - ChangeRequestSubmitted
  - ChangeRequestApproved
  - ChangeRequestRejected
  - WorkOrderPaused
nfr_flavored: false
priority: P1
tier: 2
owner: 主管 / 客服主管 / 派工主管
last_reviewed: 2026-05-28
related_adrs:
  - ADR-0046    # change-request-object
  - ADR-0049    # onsite-scope-change-protocol
  - ADR-0065    # change-request-type-lookup-table
  - ADR-0040    # refund-approval-tiers v2 (downstream from A4 rejection → refund)
  - ADR-0102    # cancellation 6-stage cascade (downstream when CR rejection cascades to cancel)
cross_module_note: "本 FR 為 D1 IA 治理的 cross-module FR 範例 — 由 SA 龍蝦 Round 2 提出（FR-0008 異常核准 alternative flow 橫跨 M15+M17+M16）。會出現在 docs/_index/by-module/{M15,M17,M16,M08}.md 四個 reverse lookup。"
legacy_id: REQ-008
trace_to_flow: F-008
related:
  - "../../0-principles/id-mapping-legacy.md §A.3 (REQ→FR)"
  - "../../_source/01-workorder-erp.md#m15-異常核准"
---

# FR-0008 — Scope Change 流程（增項 / 改價）

> **B' 殼 (2026-05-28 D5)**：rule clause 搬 BR-M15-NN + BR-M08-NN + BR-M17-NN。
> **Cross-module FR 範例**（D1 治理）：本 FR 涉及 M15 (Exception) + M17 (Authorization) + M16 (Communication) + M08 (Onsite)，是 roundtable D1 「by-module IA 不可行」反例的關鍵案例。FR 本身只放此一份，但會出現在多個 by-module reverse index。

## §1 Use Case Skeleton

| 欄位 | 內容 |
|:-----|:-----|
| **Actor** | 師傅 (M08 現場觸發) |
| **Secondary Actors** | 消費者 (M16 LINE 確認), Admin/主管 (M17 高金額簽核), Customer Service (M16 協調) |
| **Trigger** | 師傅現場發現原報價範圍不足，需增項或改價 |
| **Precondition** | WorkOrder 狀態 = `OnSite` / `InProgress`；原報價已 confirmed；師傅有現場 mobile app 操作權限 |
| **Main Flow** | 詳見 §1.1 |
| **Alternative Flow** | 詳見 §1.2 |
| **Postcondition** | Change Request 已建立 ([ref: BR-M15-01 = ADR-0046])；客戶確認後 emit `ChangeRequestApproved`；audit 完整保留 before/after；WorkOrder 繼續或暫停 |
| **Out-of-Scope** | 報價首次成立（屬 FR-0042 / M04）；保固判定（屬 M13 / FR-0015）；refund（屬 FR-0014 / M11） |

### §1.1 Main Flow

1. 師傅於現場 mobile app 提交 Change Request：增項 / 改價內容 + 理由 + 預估增加金額
2. 系統建立 Change Request object ([ref: BR-M15-01 = ADR-0046])；type 依 [ref: BR-M15-NN = ADR-0065] lookup table 設定
3. emit `ChangeRequestSubmitted` event
4. 系統判定金額層級：
   - 若 增項金額 < 50% 原價 → 進 §1.1.5（單客戶確認）
   - 若 ≥ 50% 原價 → [ref: BR-M15-NN]：強制走 §1.2 A2（admin 簽核）
5. 系統透過 M16 推送 LINE 通知客戶：新報價 + 簽名連結
6. 客戶在 LINE 內看到更新報價 → 點簽名連結 → 確認
7. 系統收到客戶確認，emit `ChangeRequestApproved`
8. WorkOrder 繼續，師傅 mobile app 解鎖增項操作
9. END：postcondition 達成 + audit log 完整保留 before/after

### §1.2 Alternative Flow

```
A1. 客戶 30 min 未回覆 (第 6 步等待):
    A1.1 [ref: BR-M15-NN 30min 等候] → emit `WorkOrderPaused`
    A1.2 通知 admin / 客服主管接手協調
    A1.3 進 FR-0010 reschedule-delay flow

A2. scope change ≥ 50% 原價 (第 4 步金額判定):
    A2.1 [ref: BR-M15-NN 高金額強制簽核] → 不可僅客戶同意
    A2.2 系統 route approval 到 admin（M17 RBAC 決定誰可簽核 [ref: ADR-0042]）
    A2.3 admin 拒絕 → 進 §1.2 A4 reject flow
    A2.4 admin 同意 → 仍須客戶 LINE 確認（雙簽 [ref: BR-M17-NN]）
    A2.5 客戶確認 → emit `ChangeRequestApproved`
    A2.6 audit log 含 admin_signoff_at + customer_signoff_at（雙時戳）

A3. 範圍變更後 idempotency_key 重複 (第 1 步提交時):
    A3.1 系統偵測重複（依 idempotency_key）
    A3.2 回傳既有 Change Request，不重複建記錄

A4. 客戶拒絕 (reject scope change) (第 6 步):
    A4.1 emit `ChangeRequestRejected`
    A4.2 WorkOrder 狀態 → `Paused`
    A4.3 系統通知客服主管 + 派工主管
    A4.4 進 [ref: ADR-0049 onsite-scope-change-protocol]：安排技師撤離
    A4.5 計算車馬費歸屬（[ref: ADR-0041 travel-fee-split]）
    A4.6 進 FR-0014 refund 流程（若已收款）

A5. 師傅提交但 type 不在 lookup table (第 2 步):
    A5.1 [ref: BR-M15-NN type lookup = ADR-0065]：拒絕，要求師傅選 enum
    A5.2 free-text type 不被接受（避免 type 蔓延）

A6. 系統 outage 期間師傅離線提交 (offline):
    A6.1 mobile app 本地暫存 Change Request
    A6.2 連線恢復後 sync 到系統，按 §1.1 流程跑（含 idempotency 檢查）
```

## §2 Acceptance Criteria (G/W/T)

### AC-01: Happy path — 小額增項

```gherkin
Given WorkOrder "WO-001" status = "OnSite"，原報價 NT$3000
  And 師傅在現場提交 Change Request：增項 NT$500
When 系統建 Change Request（type="material_addition"）
Then event `ChangeRequestSubmitted` emit
  And 系統推送 LINE 給客戶 (含新報價 NT$3500)
  And 等待客戶 LINE 確認
```

### AC-02: 客戶確認後 WorkOrder 繼續

```gherkin
Given Change Request "CR-001" pending 客戶確認
When 客戶在 LINE 點簽名連結確認
Then event `ChangeRequestApproved` emit
  And WorkOrder 繼續
  And 師傅 mobile app 解鎖增項操作
  And audit log 含 customer_signoff_at
```

### AC-03: 客戶 30 min 未回覆 → 暫停

```gherkin
Given Change Request "CR-001" 已發送 LINE 30 min 前
When 客戶仍未回覆
Then event `WorkOrderPaused` emit
  And 通知 admin / 客服主管接手
  And 進 FR-0010 reschedule-delay
```

### AC-04: 高金額強制 admin 雙簽 (≥ 50%)

```gherkin
Given WorkOrder "WO-001" 原報價 NT$3000
  And 師傅提交 Change Request：增項 NT$2000（≥ 50%）
When 系統判定金額層級
Then 系統不可僅靠客戶同意 ([ref: BR-M15-NN])
  And route approval 到 admin
  And 客戶 + admin 雙簽都到位才 emit `ChangeRequestApproved`
  And audit log 含 admin_signoff_at + customer_signoff_at
```

### AC-05: 客戶拒絕 → 撤離

```gherkin
Given Change Request "CR-001" pending
When 客戶在 LINE 點「拒絕」
Then event `ChangeRequestRejected` emit
  And WorkOrder status → "Paused"
  And 通知客服主管 + 派工主管
  And 系統安排師傅撤離（[ref: ADR-0049]）
  And 車馬費歸屬計算 [ref: ADR-0041]
  And 若已收款 → 進 FR-0014 refund
```

### AC-06: idempotency 重複提交

```gherkin
Given Change Request "CR-001" 已存在 (idempotency_key="K-001")
When 師傅重複提交相同 idempotency_key
Then 系統回傳既有 CR-001
  And 不重複建記錄
  And response status = 200
```

### AC-07: type lookup table enforce

```gherkin
Given 師傅提交 Change Request type="random_free_text"
When 系統 validate type
Then 系統 reject 422
  And error message "type 不在允許列表"
  And 師傅必須選 enum value ([ref: ADR-0065 lookup table])
```

### AC-08: 離線提交 sync

```gherkin
Given 師傅 mobile app 處於 offline 狀態
When 師傅提交 Change Request
Then mobile app 本地暫存 (含 idempotency_key)
  And 連線恢復後自動 sync

When sync 完成
Then 按 §1.1 main flow 跑（含 idempotency 檢查）
```

## §3 Cross-Module Routing Notes

> 本 FR 的 acceptance 跨四個 module，by-module reverse index 處理方式（D1 治理）：

| Module | 本 FR 在該 module 的角色 |
|:-------|:--------------------------|
| **M15** (primary) | Change Request object 生命週期、approval routing、reason code |
| **M17** | 高金額 admin 簽核權限矩陣、雙簽 audit |
| **M16** | LINE 推送、客戶簽名連結、通知模板 |
| **M08** | 現場提交點、mobile app sync、車馬費計算觸發點 |

`docs/_index/by-module/M15.md` 列本 FR 為 primary；M17/M16/M08 列為 secondary 引用。

## §4 Reference Map

| 類型 | ID | 用途 |
|:-----|:---|:-----|
| Business Rule | BR-M15-01 | Change Request object 結構 |
| Business Rule | BR-M15-NN | 高金額強制簽核 / 30min 等候 |
| Business Rule | BR-M08-NN | 現場 protocol |
| Business Rule | BR-M17-NN | 雙簽 audit |
| ADR | ADR-0046 | change-request-object |
| ADR | ADR-0049 | onsite-scope-change-protocol |
| ADR | ADR-0065 | change-request-type-lookup-table |
| ADR | ADR-0041 | travel-fee-split |
| ADR | ADR-0042 | RBAC four-tier (admin 簽核權限) |
| ADR | ADR-0040 v2 | refund-approval-tiers (downstream A4.6 路徑：rejected → refund) |
| ADR | ADR-0102 | cancellation 6-stage cascade (downstream A4 路徑：rejected → cancel scenarios) |
| BR (downstream) | BR-REFUND-001/006 | 雖 refund 規則 owner 在 FR-0014，A4.6 出口承接 5-tier + SoD |
| BR (downstream) | BR-CANCEL-001..008 | A4 撤離若觸發 cancel 路徑，計費依 6-stage cascade（owner FR-0010） |
| Domain Event | ChangeRequestSubmitted | M15 inbox |
| Domain Event | ChangeRequestApproved | WO 繼續 + audit |
| Domain Event | ChangeRequestRejected | WO 暫停 + refund 觸發 |
| Domain Event | WorkOrderPaused | M19 BI + M16 通知 |
| Source spec | `docs/_source/01-workorder-erp.md#m15-異常核准` | M15 原始定義 |

## §5 Change Log

| Date | Change | Why |
|:-----|:-------|:----|
| 2026-05-10 | REQ-008→FR-0008 split | — |
| 2026-05-28 | **B' 殼 rewrite (D5)**：rule clause 搬 BR-M15-NN + BR-M08-NN + BR-M17-NN；明標 cross-module nature；新增 frontmatter `mapped_to: [M15, M17, M16, M08]`；補 §1 skeleton + 6 條 alternative flow + 8 條 G/W/T AC + §3 cross-module routing notes | Roundtable 2026-05-27 D5 + SA 龍蝦案例 |
| 2026-05-28 | **Cross-ref backfill**：補 ADR-0040 v2 / ADR-0102 + BR-REFUND-001/006 + BR-CANCEL-001..008 為下游引用（A4.6 rejected → refund 出口 / A4 撤離 → cancel cascade） | ADR cascade 2026-05-28 |
