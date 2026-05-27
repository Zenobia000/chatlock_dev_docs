---
id: BR-CANCEL-008
title: 'Cancellation reason code dictionary'
status: active
phase: I
module: M15
mapped_to:
- M15
- M17
source: ADR-0102 (cancellation 6-stage cascade)
referenced_by:
- FR-0010
---

# BR-CANCEL-008 — Cancellation reason code dictionary

## Rule

所有 cancellation（不論 S1~S5 或師傅 initiated）必須填 reason code，採 4 大類 enum：

| 類別 | 代碼前綴 | 範例 |
|:-----|:--------|:-----|
| business | B-* | B-OUT_OF_STOCK / B-PRICE_DISPUTE / B-SCHEDULE_CONFLICT |
| customer | C-* | C-CHANGE_MIND / C-FOUND_CHEAPER / C-NO_LONGER_NEEDED |
| technician | T-* | T-SICK / T-VEHICLE_ISSUE / T-OVERBOOKED |
| system | S-* | S-DUPLICATE_WO / S-DATA_ERROR / S-FRAUD_DETECTED |

每一代碼 mandatory free-text 補充欄位（≤ 200 字）。

## Source

- ADR-0102 §reason-code-dictionary
- value-decisions 2026-05-28（業主裁：reason code dictionary 必備）

## Rationale

無 reason code → BI 無法 root-cause cancellation 比例 → 無法回饋產品 / 排程 / 師傅管理。4 大類覆蓋 ops / 客服 / BI 場景且維護成本低。

## Constraints

- enum 維護於 M18 config（可擴充但需 BR-M18-04 staged rollout）
- free-text 補充 ≥ 1 字元 ≤ 200 字（不可空白繞過）
- BI dashboard 必須以類別 + 代碼 cross-tab WoW / MoM
- audit log 寫入 reason code + 補充文字

## Cross-Refs

- FR: FR-0010
- Related BR / ADR:
- ADR-0102
- BR-CANCEL-001..007
- BR-M18-04 (config rollout)
