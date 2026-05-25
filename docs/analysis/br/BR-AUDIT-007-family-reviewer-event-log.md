---
id: BR-AUDIT-007
title: Family Reviewer event log 三要件（履約紅線詮釋）
status: accepted
date: 2026-05-24
owner: ba
source: MoM #1 (DR-0004 Option A 降級履約)
related: [ADR-0050, ADR-0061, ADR-PII-002, FR-NEW-5, 法務一頁式詮釋備忘, 合約 §V21 4.4(d)]
---

# BR-AUDIT-007: Family Reviewer Event Log 三要件

## Scope

OQ-NEW-1 業主裁決「家族覆核先不考慮」，採 Option A 降級履約 — 改 event log 不阻擋流程 + 7 日 retrospective dispute window。

依合約 §V21 4.4(d)「家族成員覆核紀錄」屬 evidence-class authority requirement（條文沒寫「同步阻擋」），可詮釋為 retrospective review event log。本 BR 列三條件，**全中**即構成「覆核紀錄」，**不需修約**（詳見法務一頁式備忘）。

## Business Rule

### 三要件（全中）

#### 條件 1：Event log 內容齊備

每筆覆核相關事件須含：
- `actor`（user_id + role enum {family_reviewer / cs_supervisor / domain_expert / system}）
- `timestamp`（ISO 8601 with timezone）
- `decision_payload`（approve / reject / no_action / dispute_filed + comment）
- `subject_type` enum {sop, evidence, refund, scope_change, quote}
- `subject_id`
- `policy_version_id`（連動 ADR-0061 OPA Rego version）

#### 條件 2：不可竄改

- **Append-only** ledger（DB-level REVOKE UPDATE/DELETE）
- **Hash chain**：每筆 row 含 `hash_prev` + `hash_self = sha256(hash_prev + content)`
- 沿用 `purge_audit_ledger` 模式（連動 ADR-0061）
- Nightly verify job 對 hash chain 做 rollback-safe 驗證

#### 條件 3：家族成員 7 日 retrospective dispute window

- 家族覆核員可在事件發生後 **7 日內** 提 dispute
- Dispute 寫入同 ledger（不修改原 row，append 新 row + `disputes_event_id` FK）
- Dispute decision 路徑：
  - 撤回原 action：寫 reverse_event + 通知相關 actor
  - 維持原 action：寫 dispute_overruled event + 通知家族覆核員理由
  - 升級業主：dispute escalated → ChangeRequest workflow

## Rule Enforcement

| Layer | Mechanism |
|:---|:---|
| API | event log endpoint 強制驗 actor / timestamp / decision 三必填欄位 |
| DB | append-only via `BEFORE UPDATE/DELETE RAISE EXCEPTION` trigger |
| DB | hash chain 由 `BEFORE INSERT` trigger 計算 `hash_self` |
| Cron | nightly hash chain verify job + alert on mismatch |
| UI | Admin Panel 家族覆核員 view 顯示「7 日內可 dispute」倒數 |

## Compliance Mapping

| 法源 / 合約 | 對應 |
|:---|:---|
| 合約 §V21 4.4(d) | 「家族成員覆核紀錄」= event log（不需同步阻擋）|
| 商業會計法 §83 | 「足資證明事項之經過」= append-only + hash chain |
| 個資法 §27 | 安全維護義務 = read-side access log（連動 ADR-0061 §9）|
| 個資法 §12 | 事故通報 = dispute_filed event 可 query |

## Acceptance Criteria

- ✅ Event log schema 含 6 必填欄位
- ✅ DB-level REVOKE UPDATE/DELETE on event log table
- ✅ Hash chain 沿用 ADR-0061 模式（trigger + nightly verify）
- ✅ 7 日 retrospective dispute window UI 顯示
- ✅ 100 筆 hash chain 隨機抽驗 pass
- ✅ Dispute 三決議路徑 BDD test pass
- ✅ 法務一頁式備忘簽核 → 詮釋為「覆核紀錄」

## Out-of-scope

- 同步阻擋審批流程（已被 Option A 降級）— 若 V2 重啟（ADR-PIVOT-001 trigger）再評估
- 跨組織 audit 串接（V3+）

## Cross References

- MoM #1 D4 + DR-0004
- ADR-0061 OPA Rego（dormant status 因 BR 詮釋為 retrospective 而生效）
- ADR-PII-002 schema 約束 + CI gate
- FR-NEW-5 (v2.2 修為 event-only)
- 法務一頁式詮釋備忘：`docs/governance/legal-memo-retrospective-review.md`
