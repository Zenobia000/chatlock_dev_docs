---
id: ADR-PIVOT-001
title: V2 重啟 trigger 機制（OQ-NEW-1 + OQ-NEW-3 降級後）
status: accepted
date: 2026-05-24
deciders: [CEO (autonomous), pm, arch, po]
related: [ADR-0060, ADR-0061, DR-0004, MoM #1]
source: MoM #1 (Q5 業主裁決 = A 6 個月 ROI 視窗)
---

> 
> **🔄 Migration Status (2026-05-28)**: `HISTORICAL`
> **Reviewed against**: 2026-05-20 final spec (xlsx)
> **Reviewed on**: 2026-05-28
> **Per ADR-0100 §1 classification** (.claude/context/devteam/meetings/2026-05-27-1130-final-spec-migration-strategy/MoM.md)


# ADR-PIVOT-001: V2 重啟 trigger 機制

## Context

OQ-NEW-1 + OQ-NEW-3 降級後（家族覆核改 retrospective / 第二甲方對外 API 砍），需要明確 trigger 機制決定何時升回 P0。PM R2 + 業主 Q5 確認 ROI 視窗 6 個月 + 兩條件。

## Decision

### 1. ROI 視窗：6 個月（V1 上線起算）

### 2. 升回 P0 觸發條件（**任一**滿足即觸發）

**Trigger A — 家族覆核業務驗證**：
- 月活甲方 ≥ 50
- **AND** 家族覆核 event log 顯示 retrospective dispute rate ≥ 5%
- 含義：代表「retrospective 不夠用，市場真的要同步阻擋」

**Trigger B — 第二甲方商業簽約**：
- 第二甲方候選簽 LOI（Letter of Intent）
- 含義：multi-tenant 對外 API 變商業必須

### 3. 6 個月內未觸發

→ **V3 重評**（不浪費 capacity）
- ADR-pivot trigger 改為「下次合約簽約週期前重議」
- 不自動轉 P0，需業主明示

### 4. 觸發後動作

- Trigger A：dispatch devteam-arch 把 ADR-0061 OPA Rego BR-PII-001a status 從 dormant 改 active；FR-NEW-5 從 event-only 升回 synchronous gate
- Trigger B：dispatch devteam-design 把 ADR-0060 對外 API restore（schema 已預埋，僅需 ~3-5 天加 endpoint + auth scope）

### 5. Capacity 預留

PO 已預留 **5 天 V2 重啟 capacity reservation**（W24 Q3 sprint pre-book）。

### 6. 觸發後 review 機制

每月 1 號 ops 跑 trigger check job：
- query KPI K2 / K3 + 月活甲方數 + dispute rate
- 任一觸發 → page PM + Tech Lead + arch
- 走 ADR-pivot decision meeting（roundtable Lane C）

### 7. Trigger metric instrumentation

```yaml
# Grafana panel
- monthly_active_tenants
- family_review_dispute_rate_30d  # retrospective dispute / event log total
- second_tenant_loi_signed  # boolean from CRM
```

## Consequences

### 正面
- Capacity 不浪費（無 trigger 就 V3 重評）
- 升回 P0 有客觀 criteria 不是 PM 主觀判斷
- Trigger A 防「業主拍腦袋砍掉但用戶其實需要」
- Trigger B 防「等到第二甲方簽完才開始準備就來不及」

### 負面
- 月活甲方 50 + 5% dispute rate 都是業界經驗值，可能不準（沒有 baseline data）
- 6 個月後若數字介於閾值附近，仍需業主 judgement call

### 中性
- V3 重評不代表永遠不做，僅代表「重新討論是否做」

## NFR 達成
- NFR-Comp-001~006（合約 / DORA）
- NFR-Maint-004（ADR/DR coverage）

## Acceptance Criteria
- ✅ Trigger check job deployed in V1 production
- ✅ KPI panel 含 trigger metrics
- ✅ Capacity reservation 5 天寫進 state.json
- ✅ 6 個月後 review cadence 寫進 release-readiness §6

## Cross References
- MoM #1 Q5
- DR-0004 Option A 降級履約
- ADR-0060 / ADR-0061 dormant rule 升 active 流程
- state.json `active_forums` 預留 V2 pivot slot
