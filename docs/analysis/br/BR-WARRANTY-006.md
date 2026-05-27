---
id: BR-WARRANTY-006
title: B2B 合約覆寫保固規則
status: active
phase: I
module: M13
mapped_to:
- M13
- M02
source: ADR-0044 (warranty start date modes, PARTIAL_UPDATE 2026-05-28)
referenced_by:
- FR-0015
---

# BR-WARRANTY-006 — B2B 合約覆寫保固

## Rule

B2B 客戶（建商 / 品牌 / 大型物管）可在標準保固外 negotiate 覆寫，需 4 條件 AND：

1. **合約 PDF 上傳**（附件 retention ≥ 5 yr）
2. **主管 approve**（L3 以上 RBAC，audit log 記錄 approver_id + 時間）
3. **audit trail**（who / when / 原值 / 新值 / 合約 ref）
4. **上限 5 年**（不可無限期）

預設 mode = `negotiated_date`（對齊 spec G002）。

## Source

- ADR-0044 v2 §b2b-override
- value-decisions 2026-05-28 Q6

## Rationale

台灣 B2B（建商 / 品牌）一定要客製化保固條款。系統不支援 → ops 在 Excel 外掛管理 → audit 失控 + 法務糾紛無法追查。內建 + 4 條件 gating 防濫用。

## Constraints

- 4 條件 AND（缺一回 422）
- 合約 PDF MIME = application/pdf，size ≤ 20 MB
- 保固期上限 5 yr（hard limit；超過需走 ChangeRequest + 業主裁）
- 任一 B2B 覆寫須 emit `WarrantyB2BOverride` event 給 BI

## Cross-Refs

- FR: FR-0015
- Related BR / ADR:
- ADR-0044 v2
- BR-WARRANTY-001 (起算日 mode)
- BR-WARRANTY-005 (RMA 重算)
- BR-M02-02 (建案資料)
