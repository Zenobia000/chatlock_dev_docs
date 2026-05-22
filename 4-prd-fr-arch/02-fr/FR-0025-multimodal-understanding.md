---
id: FR-0025
title: 對話多模態理解（圖、語音、影片）
tier: 2
priority: P0
status: active
last-synced-with: 4e9658e90324cbceb26f5e5445f481fc5678df1f
sync-source: doc
synced-at: 2026-05-15
legacy_id: REQ-025
trace_to_flow: F-001
related:
  - "../../0-principles/id-mapping-legacy.md §A.3 (REQ→FR)"
  - "../../0-principles/PRIN-0001-product-principles.md"
  - "../flows/business/"
  - "../api/openapi.yaml"
---

# FR-0025 — 對話多模態理解（圖、語音、影片）

> 從 `docs/_flows-bdd-test/north-star-requirements.md REQ-025` 抽出，升級為 4-digit FR ID。

## §1 Description

對話多模態理解（圖、語音、影片）

## §2 Priority

**P0** (Must-have for V1)

## §3 Acceptance Criteria

### §3.1 SLO（正常路徑）

LINE 多模態（文字 + 圖片 + 貼圖 + 語音）統一進 conversation；圖片不做 AI 辨識（V1.0 SOW 排除）。

### §3.2 邊界案例

- 貼圖 → 友善回覆但不啟動 problem-card 流程
- 語音檔 → V1.0 不解析，回覆「請以文字描述」

### §3.3 異常處理

- 圖片 > 10MB → 拒絕 + 提示重傳
- 非 JPG/PNG → 拒絕 + 提示格式

### §3.4 TC Coverage

涵蓋之 TC（per `docs/2-contracts/test-cases/registry.yaml`）: BDD-0003 (User sends photo), IT-0123~0128 (vision-processing V1.0 scope)

## §4 Trace

| Aspect | Reference |
| :-- | :-- |
| Legacy ID | REQ-025 |
| Legacy F-XXX flow | F-001 |
| Implementation status | ✅ Live |

## §5 Change Log

| Date | Change |
| :--- | :--- |
| 2026-05-10 | 從 north-star-requirements REQ-025→FR-0025 split |
