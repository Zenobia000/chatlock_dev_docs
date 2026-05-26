---
id: FR-0018
title: 客服接管對話（三層解決機制）
tier: 2
priority: P0
status: active
lifecycle: partial
lifecycle-reason: "LINE Push API 整合 TODO"
last-synced-with: 4e9658e90324cbceb26f5e5445f481fc5678df1f
sync-source: doc
synced-at: 2026-05-15
legacy_id: REQ-018
trace_to_flow: F-018
related:
  - "../../0-principles/id-mapping-legacy.md §A.3 (REQ→FR)"
  - "../../0-principles/PRIN-0001-product-principles.md"
  - "../flows/business/"
  - "../api/openapi.yaml"
---

# FR-0018 — 客服接管對話（三層解決機制）

> 從 `docs/_flows-bdd-test/north-star-requirements.md REQ-018` 抽出，升級為 4-digit FR ID。

## §1 Description

客服接管對話（三層解決機制）

## §2 Priority

**P0** (Must-have for V1)

## §3 Acceptance Criteria

### §3.1 SLO（正常路徑）

AI agent 偵測「找主管 / 投訴 / 退費」等關鍵詞 → 立即 transfer human + audit。

### §3.2 邊界案例

- 隱含不滿（無關鍵詞但語氣強烈）→ confidence ≥ 0.85 仍升級
- 非營業時間升 L3 → 留言給 next-business-day admin
- **客服接管後判斷需派工**（cascade from S1 2026-05-26）：客服走 CS 路徑直接呼叫工單系統 Tool，自動 CS 1-click（不需走客戶確認流程）；WorkOrder.create_trigger=cs_path_csagent_triggered
- **客服接管後純客服解決**：客服判斷可口頭 / 知識庫處理完畢 → 標 PC.resolved → 進 CustAck 結案；不開工單

### §3.3 異常處理

- LINE Push 通知 admin 失敗 → audit 記錄 + retry queue
- 客戶撤回投訴 → 對話續寫，但 audit 不刪

### §3.4 TC Coverage

涵蓋之 TC（per `docs/2-contracts/test-cases/registry.yaml`）: IT-0141~0146 (sentiment-triage-engine 6 cases), BDD-0036~0046 (Sentiment Triage)

## §4 Trace

| Aspect | Reference |
| :-- | :-- |
| Legacy ID | REQ-018 |
| Legacy F-XXX flow | F-018 |
| Implementation status | ⚠ partial（LINE Push API 整合 TODO） |

## §5 Change Log

| Date | Change |
| :--- | :--- |
| 2026-05-10 | 從 north-star-requirements REQ-018→FR-0018 split |
| 2026-05-26 | **S1 cascade**：客服接管後分流為「需派工 → CS 觸發工單 Tool（auto 1-click）」與「純客服解決 → PC.resolved → CustAck」兩條 |
