---
id: FR-0017
title: SOP 草稿審核（AI 自進化）
tier: 2
priority: P1
status: active
last-synced-with: 4e9658e90324cbceb26f5e5445f481fc5678df1f
sync-source: doc
synced-at: 2026-05-15
legacy_id: REQ-017
trace_to_flow: F-017
related:
  - "../../0-principles/id-mapping-legacy.md §A.3 (REQ→FR)"
  - "../../0-principles/PRIN-0001-product-principles.md"
  - "../flows/business/"
  - "../api/openapi.yaml"
---

# FR-0017 — SOP 草稿審核（AI 自進化）

> 從 `docs/_flows-bdd-test/north-star-requirements.md REQ-017` 抽出，升級為 4-digit FR ID。

## §1 Description

SOP 草稿審核（AI 自進化）

## §2 Priority

**P1** (Should-have)

## §3 Acceptance Criteria

### §3.1 SLO（正常路徑）

SOP 草稿須 admin 初審 + family_reviewer 終審 (per 合約 4.4(d) 100% 覆核率)。

> **拍板 2026-05-22 (ADR-0038)**：高風險 SOP（報價 / 退款 / 法律）走**雙審**（客服主管 + Domain expert）；FAQ 類走 Knowledge Owner **單審**。

> **拍板 2026-05-22 (ADR-0058)**：**外部知識傳承平台**輸入的 SOP 草稿同樣走此審核流程（不可繞過）。Ingestion Gateway 必經 schema validate + 對應 ADR-0038 分流。

### §3.2 邊界案例

- Admin reject 後 SOP 回 draft，可再次提交
- family_reviewer 多人 → 任一人 approve 即通過 (per V1.0 simple rule)
- 外部平台 ingestion 來源 SOP 進入此流程時，保留 source attribution 與 contributor 資訊（ADR-0058）

### §3.3 異常處理

- 覆核紀錄不可刪除/改寫（APPEND-ONLY）→ DB trigger 攔截 + audit tamper_attempt
- 嘗試繞過 family_review 直接 publish → 403 family_review_required

### §3.4 TC Coverage

涵蓋之 TC（per `docs/2-contracts/test-cases/registry.yaml`）: IT-0063~0068 (family-review-engine 6 cases), IT-0023~0030 (sop-generator)

## §4 Trace

| Aspect | Reference |
| :-- | :-- |
| Legacy ID | REQ-017 |
| Legacy F-XXX flow | F-017 |
| Implementation status | ✅ Live |

## §5 Change Log

| Date | Change |
| :--- | :--- |
| 2026-05-10 | 從 north-star-requirements REQ-017→FR-0017 split |
| 2026-05-22 | 加入 ADR-0038 雙審/單審分流 + ADR-0058 外部平台 ingestion contract 引用 |
