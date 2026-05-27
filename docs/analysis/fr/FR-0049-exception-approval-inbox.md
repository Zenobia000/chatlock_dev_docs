---
id: FR-0049
title: Exception Approval Inbox（M15 完整深化）
status: placeholder
phase: II
placeholder_only: true
placeholder_reason: "Phase II — per D3 規範。M15 Phase I 已落地基本 ChangeRequest (FR-0008)，本 FR 是統一 inbox 深化"
mapped_to:
  - M15    # Exception / Approval primary
  - M17    # Audit
  - M16    # Comms (approval notification)
owner: 主管 / 派工主管 / 會計
related_adrs:
  - ADR-0046   # change-request-object
  - ADR-0065   # change-request-type-lookup-table
created_in: "Phase II placeholder"
---

# FR-0049 — Exception Approval Inbox [PLACEHOLDER]

> **Phase II placeholder (per D3)**。

## §1 Scope Intent

統一 exception approval inbox：M15 集中收所有 approval task（scope change / refund / cancellation / warranty escalation / high-risk dispatch / config change / etc.）。提供：(a) 統一 routing engine 依規則 dispatch to approver；(b) SLA monitor 與 escalation；(c) bulk operations；(d) 跨類別優先順序；(e) audit trail unified view。

對應 new spec：
- `docs/_source/01-workorder-erp.md#m15-異常核准` 全段
- new spec P0「異常代碼、暫停、return path、核准門檻、責任歸屬、雙簽」

## §2 Out-of-Scope

- 個別 ChangeRequest 建立（屬 FR-0008，已 Phase I）
- 個別 refund approval（屬 FR-0014，已 Phase I）
- audit log 核心機制（屬 FR-0020）

## §3 Phase II 啟動時需補

- 統一 routing engine 規則
- escalation matrix per category × SLA
- bulk operations spec
