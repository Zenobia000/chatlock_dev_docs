---
id: FR-0047
title: 品牌月結 + B2B Settlement
status: placeholder
phase: II
placeholder_only: true
placeholder_reason: "Phase II — per D3 規範"
mapped_to:
  - M12    # AP primary
  - M14    # Partner Portal (品牌 B2B contract)
owner: 會計 / Brand owner / Partner manager
related_adrs:
  - ADR-0043   # brand-project-tenant-scope
  - ADR-0056   # per-vendor-contract-attachment-spec
created_in: "Phase II placeholder"
---

# FR-0047 — 品牌月結 + B2B Settlement [PLACEHOLDER]

> **Phase II placeholder (per D3)**。

## §1 Scope Intent

品牌 / 經銷 / 建商 B2B 月結：依合約 SLA / 服務量 / 保固扣款計算 → 產 brand statement → 品牌方 review → 簽核 → 結算。含 B2B AR / AP 兩向（品牌付服務費 / 收 commission）。

對應 new spec：
- `docs/_source/01-workorder-erp.md#m12-ap月結` BR-M12 brand 段
- `docs/_source/01-workorder-erp.md#m14-partner-portal` Partner contract
- new spec Phase III scope（但月結 mechanism 在 Phase II 已可建）

## §2 Out-of-Scope

- 品牌 onboarding（屬 Phase III）
- Partner portal UI（屬 M14 / Phase III）
- contract 模板 schema（屬 ADR-0060）

## §3 Phase II 啟動時需補

- 完整 use case 含 B2B 雙向流（AR + AP）
- 多 contract 模板 cascade
- BR-M12 brand 段拆細
