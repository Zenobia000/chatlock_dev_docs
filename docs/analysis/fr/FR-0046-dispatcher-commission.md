---
id: FR-0046
title: 派工人 Commission 月結
status: placeholder
phase: II
placeholder_only: true
placeholder_reason: "Phase II — per D3 規範"
mapped_to:
  - M12    # AP / Commission primary
  - M06    # Dispatch (commission 計算依派工數)
owner: 會計 / Settlement owner / 派工主管
related_adrs: []
created_in: "Phase II placeholder"
---

# FR-0046 — 派工人 Commission 月結 [PLACEHOLDER]

> **Phase II placeholder (per D3)**。

## §1 Scope Intent

派工人 commission 月結：依當月成功派工數 / 完工率 / 客戶滿意度計算抽成 → 產 dispatcher statement → 主管核准 → 匯款。**與技師 AP 分表**（per new spec P0）。

對應 new spec：
- `docs/_source/01-workorder-erp.md#m12-ap月結` BR-M12 dispatcher 段
- new spec P0「月結：師傅月結、派工人月結、品牌月結分表」

## §2 Out-of-Scope

- 技師 AP（屬 FR-0045）
- 派工演算法（屬 FR-0003）

## §3 Phase II 啟動時需補

- 完整 G/W/T 含 commission 計算公式 (依 M18 config)
- BR-M12 規則拆細
