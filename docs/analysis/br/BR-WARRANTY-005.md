---
id: BR-WARRANTY-005
title: RMA 後保固重算規則
status: active
phase: I
module: M13
mapped_to:
- M13
source: ADR-0044 (warranty start date modes, PARTIAL_UPDATE 2026-05-28)
referenced_by:
- FR-0015
---

# BR-WARRANTY-005 — RMA 後保固重算規則

## Rule

保固期內發生 RMA（送修 / 換新零件）後，保固重算規則：

1. **整機保固期延長 = 被修期間天數**（送修日起到取回日，停錶後接續原期）
2. **換新的零件 part-level 保固獨立重算 90 天**（自換裝日起算）
3. 原機未換零件部分保固延續原 end_date + 延長天數

不可整機重算 1 年（防惡意利用「修一次 reset 保固」）。

## Source

- ADR-0044 v2 §rma-recalculation
- value-decisions 2026-05-28 Q5
- 消費者保護法 §22（提供商品應符合通常合理可期待之安全性）

## Rationale

業界 default：被修期間延長 + 換新零件 90 天獨立重算。台灣消保法第 22 條相容（避免商品瑕疵連續發生）。「整機重算 1 年」為消費者期待但平台無法吸收成本，且導致惡意利用循環送修。

## Constraints

- 被修期間 = (rma_return_date - rma_send_date) days
- 新零件 90 天重算需在 BOM table 標記 part_id + new_warranty_end_date（Phase I 整機階層，Phase II 升 part-level — 對齊 BR-WARRANTY-007）
- audit log 記錄三段日期：original_end / extended_end / part_new_end
- B2B 合約若有覆寫走 BR-WARRANTY-006

## Cross-Refs

- FR: FR-0015
- Related BR / ADR:
- ADR-0044 v2
- BR-WARRANTY-001 (起算日)
- BR-WARRANTY-003 (boundary)
- BR-WARRANTY-007 (Phase I 整機)
