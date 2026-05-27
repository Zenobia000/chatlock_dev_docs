---
id: FR-0050
title: AI Governance & PRD Traceability（A12）
status: placeholder
phase: II
placeholder_only: true
placeholder_reason: "Phase II — per Q2=C 業主決議 A12 從 Phase I 延 Phase II"
mapped_to:
  - A12    # Governance & PRD Trace primary
  - M20    # AI Ops
owner: PM / Tech Lead / AI Specialist
related_adrs:
  - ADR-0028   # ai-employee-charter
  - ADR-0038   # ai-feedback-review-policy
created_in: "Phase II placeholder — Q2=C 業主裁決 A12 延 Phase II"
related:
  - "../../_source/02-ai-chatbot-sync.md#a-m12-prd治理"
---

# FR-0050 — AI Governance & PRD Traceability [PLACEHOLDER]

> **Phase II placeholder (per Q2=C)**：業主裁決 A12 從 Phase I MVP scope 延 Phase II。Phase I 只做 A06+A09，A12 governance trace 等 Phase II 啟動。

## §1 Scope Intent

每個 AI 行為（reasoning / tool call / output）可回溯到 PRD source / Final rule / 業主 explicit decision：(a) AI decision trace store；(b) source → action 反向 lookup；(c) audit-grade traceability for compliance review；(d) governance dashboard for AI QA lead。

對應 new spec：
- `docs/_source/02-ai-chatbot-sync.md#a-m12-prd治理` 全段
- new spec P0「AI 不可決策清單」charter
- ADR-0028 ai-employee-charter

## §2 Out-of-Scope

- AI guardrails（屬 FR-0030，已 Phase I）
- AI eval（屬 FR-0032，已 Phase I）
- AI charter rule changes（屬 governance process，非 FR scope）

## §3 Phase II 啟動時需補

- Trace store schema
- Source → action 反向 lookup API
- Governance dashboard UX
- Cross-ref to A09 Eval & Observability 共用 trace
