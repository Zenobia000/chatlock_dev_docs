---
id: FR-0044
title: Technician Onboarding 與停權
status: placeholder
phase: II
placeholder_only: true
placeholder_reason: "Phase II — per D3 規範，只列 module ID + owner + scope intent + out-of-scope；不寫 NFR baseline / 完整 G/W/T，等 Phase II Gate1 啟動再補"
mapped_to:
  - M07    # Workforce primary
  - M17    # Audit (停權 audit)
owner: 派工主管 / 師傅管理 / 主管 (停權核准)
related_adrs: []
created_in: "Phase II placeholder — Roundtable A 2026-05-27 fr-mapping §3"
---

# FR-0044 — Technician Onboarding 與停權 [PLACEHOLDER]

> **Phase II placeholder (per D3)**：只列範圍，等 Phase II Gate1 啟動再展開完整 use case + acceptance。

## §1 Scope Intent

師傅完整生命週期管理：onboarding 資格驗證（身分 / 技能 / 品牌授權 / 服務區）→ 上線審核 → 績效追蹤 → 停權 / 復權流程（含證照過期 / 評分跌破 threshold / 重大客訴 / 詐欺 / 主動離職）。

對應 new spec：
- `docs/_source/01-workorder-erp.md#m07-師傅管理` BR-M07 全段
- new spec P0「師傅 onboarding 與停權：上線資格、品牌授權、停權/恢復門檻」

## §2 Out-of-Scope

- 派工演算法（屬 FR-0003）
- 接單流程（屬 FR-0005）
- 月結 AP（屬 FR-0045）

## §3 Phase II 啟動時需補

- 完整 §1 Use Case Skeleton
- 完整 §2 Acceptance Criteria (G/W/T)
- frontmatter 補 `superseded_clauses` / `emits_events` / `related_adrs`
- 對應 BR-M07-NN 規則拆細
