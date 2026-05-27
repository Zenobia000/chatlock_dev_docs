---
id: FR-0013
title: 對帳爭議雙簽
status: active
phase: I
mapped_to:
  - M15    # Exception
  - M17    # Audit
superseded_clauses:
  - BR-M15-NN    # 雙簽 CSM + ops_manager
  - BR-M15-NN    # 60 天未解 → 升 ops_director
  - BR-M15-NN    # 撤銷 → closed_withdrawn
  - BR-M15-NN    # 單方 close → 409 dual_sign_required
  - BR-M15-NN    # close 後 reopen → dispute_v2
emits_events:
  - DisputeOpened
  - DisputeApprovedBySingleParty
  - DisputeClosed
  - DisputeEscalated
nfr_flavored: false
priority: P0
tier: 2
owner: CSM / 運營主管
last_reviewed: 2026-05-28
related_adrs:
  - ADR-0014    # 雙簽終簽人階層 (historical)
  - ADR-0040    # refund-approval-tiers v2 (PARTIAL_UPDATE 2026-05-28 — dispute → refund 出口)
legacy_id: REQ-013
trace_to_flow: F-013
last-synced-with: 4e9658e90324cbceb26f5e5445f481fc5678df1f
related:
  - "../../_source/01-workorder-erp.md#m15-exception"
---

# FR-0013 — 對帳爭議雙簽

> **Migration**: 2026-05-28 改為 D5 殼結構（rule → BR）。

## §1 Use Case Skeleton

| 欄位 | 內容 |
|:-----|:-----|
| **Actor** | 客戶 (open dispute) / CSM (review) / ops_manager (co-sign) |
| **Secondary Actors** | M17 Audit, M15 Exception |
| **Trigger** | 客戶 / 技師發起 dispute |
| **Precondition** | 標的 wo / payment / settlement 存在 |
| **Main Flow** | 詳見 §1.1 → user-flow:S4-step5 |
| **Alternative Flow** | 詳見 §1.2 |
| **Postcondition** | dispute row 落地；雙簽後 close |

### §1.1 Main Flow

1. 客戶開 dispute（subject + reason） → user-flow:S4-step5
2. emit `DisputeOpened`
3. CSM review + propose resolution
4. ops_manager co-sign （[ref: BR-M15-NN dual sign]）
5. 兩方都 approve → status = closed
6. emit `DisputeClosed`
7. END

### §1.2 Alternative Flow

```
A1. 單方 close 嘗試 (第 5 步):
    A1.1 系統 409 dual_sign_required

A2. 60 天未解 (cron):
    A2.1 自動升 ops_director
    A2.2 emit `DisputeEscalated`

A3. 客戶撤銷:
    A3.1 status = closed_withdrawn

A4. close 後 reopen:
    A4.1 拒絕直接 reopen
    A4.2 必須新建 dispute_v2 引用原 dispute
```

## §2 Acceptance Criteria

### AC-01: Dual sign close

```gherkin
Given dispute D-001 opened
When CSM approve + ops_manager co-sign
Then status = closed + emit `DisputeClosed`
```

### AC-02: Single party reject

```gherkin
When CSM 單方 close
Then 409 dual_sign_required
```

### AC-03: 60 天升 director

```gherkin
Given D-001 open 60 天
When cron
Then 升 ops_director + emit `DisputeEscalated`
```

### AC-04: 撤銷

```gherkin
When 客戶撤銷
Then status = closed_withdrawn
```

### AC-05: reopen → v2

```gherkin
Given D-001 closed
When 客戶嘗試 reopen
Then 必須新建 D-001-v2 引用 D-001
```

## §3 Reference Map

| 類型 | ID | 用途 |
|:-----|:---|:-----|
| BR | BR-M15-NN | dual sign / 60d / 撤銷 / reopen |
| ADR | ADR-0040 v2 | refund tiers + SoD |
| BR (downstream) | BR-REFUND-001/006 | dispute 若觸發 refund 出口，使用 5-tier + SoD 三維（owner FR-0014） |
| Event | DisputeOpened/Closed/Escalated | — |

## §4 Change Log

| Date | Change |
|:-----|:-------|
| 2026-05-10 | REQ-013→FR-0013 |
| 2026-05-28 | **D5 殼 rewrite** |
| 2026-05-28 | **Cross-ref backfill**：補 BR-REFUND-001/006 為下游引用（dispute → refund 出口時的 5-tier + SoD），ADR-0040 標記 v2 PARTIAL_UPDATE | ADR cascade 2026-05-28 |
