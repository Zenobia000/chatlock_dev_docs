---
id: FR-0048
title: RMA 品質回饋迴圈
status: placeholder
phase: II
placeholder_only: true
placeholder_reason: "Phase II — per D3 規範"
mapped_to:
  - M13    # Complaint / Warranty / RMA / Quality primary
  - M20    # AI Ops (品質訊號回饋)
  - M07    # Workforce (技師品質績效)
owner: 客服主管 / 品牌商 / AI Specialist
related_adrs: []
created_in: "Phase II placeholder"
---

# FR-0048 — RMA 品質回饋迴圈 [PLACEHOLDER]

> **Phase II placeholder (per D3)**。FR-0015 (warranty-claim) 已 Phase I 落地基本流程；本 FR 是 quality feedback loop 深化。

## §1 Scope Intent

RMA 結案後品質訊號回收：(a) 共通故障模式 → 品牌商 feedback；(b) 技師處理品質 → M07 績效；(c) AI 分診準確度 → M20 SOP / Eval cascade；(d) 客戶滿意度 → 月結 commission 調整。建立 closed loop quality system。

對應 new spec：
- `docs/_source/01-workorder-erp.md#m13-rma品質` BR-M13 quality feedback 段
- `docs/_source/02-ai-chatbot-sync.md#10-sop螺旋` SOP feedback

## §2 Out-of-Scope

- RMA case 建立（屬 FR-0015）
- 保固判定（屬 FR-0015）
- AI Eval 機制（屬 FR-0032 / Phase IV）

## §3 Phase II 啟動時需補

- closed loop event flow 詳列
- 跨 M13 / M20 / M07 cascade matrix
