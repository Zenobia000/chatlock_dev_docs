---
id: BR-CANCEL-007
title: '師傅 initiated cancel 政策（首次免責 / 同月 ≥2 扣款 / 不可抗力憑證明免責）'
status: active
phase: I
module: M07
mapped_to:
- M07
- M15
source: ADR-0102 (cancellation 6-stage cascade)
referenced_by:
- FR-0010
---

# BR-CANCEL-007 — 師傅 initiated cancel 政策

## Rule

師傅單方取消已 accepted 的 WorkOrder：

| 條件 | 處置 |
|:-----|:-----|
| 同月首次 (1st) | 免責、無扣款、weight -5（業界 default warning） |
| 同月第 2 次以上 | 扣款 NTD 500 / 次 + weight -10 + 自動 reassign |
| 不可抗力（醫療 / 災害 / 親屬重大事故）+ 憑證明 | 免責、weight 不扣 |

不可抗力 = ops 主管手動審 + audit log + 證明文件 retention ≥ 1 年。

## Source

- ADR-0102 §technician-initiated
- value-decisions 2026-05-28 Q3（業主裁：混合政策）

## Rationale

台灣師傅半獨立生態：硬扣 → 師傅跳家 / supply 流失；零扣 → 惡意刷單。業界混合做法：首次寬鬆 + 累犯扣 + 不可抗力出口。

## Constraints

- 觸發條件：technician.cancel_request = true AND wo.status ∈ {accepted, en_route}（NOT on_site / in_progress — 那些走 BR-CANCEL-004~006 客戶端流程）
- 同月計數 reset 每月 1 日
- 不可抗力 audit log + 證明文件 ≥ 1 yr
- 自動 reassign 走 FR-0003
- emit `TechnicianInitiatedCancel` event with reason + 是否扣款

## Cross-Refs

- FR: FR-0010
- Related BR / ADR:
- ADR-0102
- BR-M07-NN (技師失約 penalty)
- BR-CANCEL-008
