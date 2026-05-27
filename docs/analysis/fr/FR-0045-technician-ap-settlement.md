---
id: FR-0045
title: Technician AP 月結
status: placeholder
phase: II
placeholder_only: true
placeholder_reason: "Phase II — per D3 規範"
mapped_to:
  - M12    # AP / Commission / Monthly Settlement primary
  - M07    # Workforce (技師 AP 對象)
owner: 會計 / Settlement owner
related_adrs:
  - ADR-0041   # travel-fee-split (與 AP 互動)
created_in: "Phase II placeholder"
---

# FR-0045 — Technician AP 月結 [PLACEHOLDER]

> **Phase II placeholder (per D3)**。

## §1 Scope Intent

師傅工資月結：依完工 WO 累計 → 扣車馬費 / 代收抵扣 / 暫扣爭議金額 → 產 technician statement → 主管核准 → 匯款執行。含技師 self-service 查詢 statement + dispute window。

對應 new spec：
- `docs/_source/01-workorder-erp.md#m12-ap月結` BR-M12 全段
- new spec P0「月結：師傅月結、派工人月結、品牌月結分表」

## §2 Out-of-Scope

- 派工人 commission（屬 FR-0046）
- 品牌月結（屬 FR-0047）
- 退款（屬 FR-0014）

## §3 Phase II 啟動時需補

- 完整 §1 Use Case Skeleton（含 dispute window 與 retrospective adjustment）
- §2 G/W/T 含「暫扣 → 釋放」流程
- 對應 BR-M12-NN
