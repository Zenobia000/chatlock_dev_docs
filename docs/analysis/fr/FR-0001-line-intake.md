---
id: FR-0001
title: LINE 客服報修受理（圖片 + 文字 + 對話）
tier: 2
priority: P0
status: active
last-synced-with: 4e9658e90324cbceb26f5e5445f481fc5678df1f
sync-source: doc
synced-at: 2026-05-15
legacy_id: REQ-001
trace_to_flow: F-001
related:
  - "../../0-principles/id-mapping-legacy.md §A.3 (REQ→FR)"
  - "../../0-principles/PRIN-0001-product-principles.md"
  - "../flows/business/"
  - "../api/openapi.yaml"
---

# FR-0001 — LINE 客服報修受理（圖片 + 文字 + 對話）

> 從 `docs/_flows-bdd-test/north-star-requirements.md REQ-001` 抽出，升級為 4-digit FR ID。

## §1 Description

LINE 客服報修受理（圖片 + 文字 + 對話）

## §2 Priority

**P0** (Must-have for V1)

## §3 Acceptance Criteria

### §3.1 SLO（正常路徑）

使用者透過 LINE 提交報修，AI 初判回覆 P95 ≤ 5s (含意圖辨識 + ProblemCard 啟動)。圖片附件接受 JPG/PNG ≤ 10MB。

### §3.2 邊界案例

- LINE webhook 重送（X-Line-Signature 相同）→ 冪等處理，不重複建 Conversation
- 圖片 = 10MB 邊界值仍接受；10.1MB 拒絕回 413
- 對話 4 輪後仍 intent_confidence < 0.7 → 升 L3 (per dispatch-engine §1)
- **急件 4 類偵測時機**（cascade from S1 flow 2026-05-26）：Intent 階段（**收到首筆訊息 + Intent 認意圖後立即判定**）就要識別「鎖外 / 內困 / 安全 / 怒客」四類，bypass 三層直接 5min 內轉真人；不可延後到 Triage 階段

### §3.3 異常處理

- LINE webhook 簽章驗證失敗 → 401，不寫入任何 conversation
- 下游 LLM timeout → 回覆「客服繁忙，稍候片刻」，不阻塞 webhook (FastAPI BackgroundTask)

### §3.4 TC Coverage

涵蓋之 TC（per `docs/2-contracts/test-cases/registry.yaml`）: BDD-0001~0011 (LINE Bot + ProblemCard 智慧分診), IT-0001~0008 (conversation-manager), IT-0017~0022 (problem-card-engine)

## §4 Trace

| Aspect | Reference |
| :-- | :-- |
| Legacy ID | REQ-001 |
| Legacy F-XXX flow | F-001 |
| Implementation status | ✅ Live |

## §5 Change Log

| Date | Change |
| :--- | :--- |
| 2026-05-10 | 從 north-star-requirements REQ-001→FR-0001 split |
| 2026-05-26 | **S1 cascade**：急件偵測時機移至 Intent 階段（bypass Triage），對應 UC-002 update + ProblemCard.urgency_detected_at 欄位 |
