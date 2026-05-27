---
id: BR-REFUND-006
title: Refund Separation of Duties（SoD 三維）
status: active
phase: I
module: M11
mapped_to:
- M11
- M17
source: ADR-0040 (refund approval tiers, PARTIAL_UPDATE 2026-05-28)
referenced_by:
- FR-0014
---

# BR-REFUND-006 — Refund SoD 三維

## Rule

每筆 refund 必須區分 3 個獨立角色 (Separation of Duties)：

| 角色 | 職責 | RBAC |
|:-----|:-----|:-----|
| **initiator** | 提出退款 request，填金額 + 理由 + 必填欄位 | CSM / 客服 |
| **approver** | 簽核（依金額分層 L1-L5） | 會計 / 主管 / ops_manager / finance / L5 Sponsor |
| **executor** | 實際呼叫 Payment Provider 執行扣款 | 系統 service account / 財務 |

**同一人不可同時擔任同一筆 refund 的 initiator + approver**（系統強制；違反回 409）。executor 可以是系統，但 audit log 必須記錄觸發 service account。

## Source

- ADR-0040 v2 §sod (PARTIAL_UPDATE 2026-05-28)
- value-decisions 2026-05-28 Q4=PARTIAL_UPDATE
- 商業會計法 §28 / SOX-style internal control

## Rationale

退款是高風險財務動作，無 SoD → 一人可自行偽造 request + 自簽核 + 自執行 → 內控失敗。三維拆分對齊台灣商業會計法與一般 SaaS 內控要求。

## Constraints

- DB 強制 initiator_id ≠ approver_id（CHECK constraint 或 trigger）
- audit log 三角色 ID 皆寫入（BR-REFUND-002 7-event 內 approved 與 paid 必含）
- L5 Sponsor 走 ADR-0040 v2 §rbac-mapping（> 500k 或 > 公司年收 1%）
- executor = system 時必須記錄觸發 user（initiator 或 cron）

## Cross-Refs

- FR: FR-0014
- Related BR / ADR:
- ADR-0040 (refund approval tiers v2)
- BR-REFUND-001..005
- BR-AUDIT-007
