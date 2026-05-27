---
id: FR-0012
title: 技師月結撥款（V1.0 升級！）
status: draft
phase: I
mapped_to:
  - M11    # Settlement (primary)
  - M12    # Monthly costing
  - M17    # Audit
superseded_clauses:
  - BR-M12-NN    # 月結 cron 每月 1 日 02:00
  - BR-M12-NN    # negative settlement (材料費 > 收款)
  - BR-M12-NN    # disputes 未結排除當月
  - BR-M12-NN    # 匯款 API 失敗 3 次 → manual_payout
  - BR-M12-NN    # settlement DB unique constraint
emits_events:
  - SettlementCalculated
  - SettlementPayoutInitiated
  - SettlementPayoutFailed
nfr_flavored: false
priority: P0
tier: 2
owner: 財務 / Backend
last_reviewed: 2026-05-28
related_adrs:
  - ADR-0019
  - ADR-0041
  - ADR-VCH-002
blocked_by:
  - Q7=B
legacy_id: REQ-012
trace_to_flow: F-012
last-synced-with: 4e9658e90324cbceb26f5e5445f481fc5678df1f
related:
  - "../../_source/01-workorder-erp.md#m12-月結"
---

# FR-0012 — 技師月結撥款（V1.0 升級！）

> **Migration**: 2026-05-28 改為 D5 殼結構（rule → BR）。Status: draft（Q7=B 待 provider）。

## §1 Use Case Skeleton

| 欄位 | 內容 |
|:-----|:-----|
| **Actor** | System (cron) / 財務 (manual override) |
| **Secondary Actors** | 技師 (recipient), Bank API, M17 Audit |
| **Trigger** | 每月 1 日 02:00 cron |
| **Precondition** | 上月 WO 已 settled；無 active dispute |
| **Main Flow** | 詳見 §1.1 → user-flow:S4-step1 |
| **Alternative Flow** | 詳見 §1.2 |
| **Postcondition** | settlement row 落地；emit `SettlementPayoutInitiated` |
| **Out-of-Scope** | 消費者付款 (FR-0011)；爭議 (FR-0013) |

### §1.1 Main Flow

1. Cron 啟動 02:00 → user-flow:S4-step1
2. 系統聚合上月 WO（排除 active dispute，[ref: BR-M12-NN]）
3. 計算 應收 = 收款 - 材料費
4. emit `SettlementCalculated` per technician
5. 呼叫 Bank API 匯款
6. emit `SettlementPayoutInitiated`
7. END

### §1.2 Alternative Flow

```
A1. 材料費 > 收款 (第 3 步):
    A1.1 結算 = negative；技師應付公司差額

A2. Bank API 失敗 3 次 (第 5 步):
    A2.1 retry 3 次仍失敗 → 標 manual_payout
    A2.2 emit `SettlementPayoutFailed`
    A2.3 alert finance

A3. unique constraint 衝突 (第 4 步):
    A3.1 同 wo 雙重計算 → DB 拒絕 + alert

A4. dispute 未結 (第 2 步):
    A4.1 該 wo 排除當月，進下月 cron retry
```

## §2 Acceptance Criteria (G/W/T)

### AC-01: Happy path

```gherkin
Given 上月 30 件 WO 已 settled
When cron 2026-06-01 02:00 跑
Then emit `SettlementCalculated` × 30 + `SettlementPayoutInitiated` × N
```

### AC-02: negative settlement

```gherkin
Given 技師 T-001 收款 5000, 材料費 6000
Then settlement = -1000
```

### AC-03: Bank fail

```gherkin
Given Bank 5xx
When retry 3 次仍失敗
Then 標 manual_payout + emit `SettlementPayoutFailed`
```

### AC-04: dispute exclude

```gherkin
Given WO-005 active dispute
When 月結 cron
Then WO-005 排除當月
```

### AC-05: unique constraint

```gherkin
When 同 wo_id 重複計算
Then DB 拒絕 + alert
```

## §3 Reference Map

| 類型 | ID | 用途 |
|:-----|:---|:-----|
| BR | BR-M12-NN | cron / negative / dispute / retry / unique |
| ADR | ADR-0041 | travel fee |
| ADR | ADR-VCH-002 | voucher 7y |
| Event | SettlementCalculated | finance |
| Event | SettlementPayoutInitiated | bank |
| Event | SettlementPayoutFailed | manual |

## §4 Change Log

| Date | Change | Why |
|:-----|:-------|:----|
| 2026-05-10 | REQ-012→FR-0012 split | — |
| 2026-05-28 | **D5 殼 rewrite**：rule 搬 BR-M12-NN；補 §1 + 4 alt + 5 AC | Roundtable 2026-05-27 D5 |
