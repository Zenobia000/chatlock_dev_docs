---
id: FR-0034
title: AI Employee Charter / PRD 治理（Phase II）
status: draft
phase: II
mapped_to:
  - A12    # PRD 治理
  - M20    # AI Charter
superseded_clauses:
  - BR-A12-01    # 每 gate 對應 owner / status / source
  - BR-A12-02    # 主要輸出 — final PRD inputs
  - BR-A12-NN    # AI 鎖匠客服助理 Employee Charter (ADR-0028)
emits_events:
  - CharterUpdated
  - GovernanceGateApproved
nfr_flavored: false
priority: P2
tier: 3
owner: PM / Tech Lead
last_reviewed: 2026-05-28
related_adrs:
  - ADR-0028    # AI Charter
note: "Phase II 延後 per Q2=C 業主裁決。本 FR 為骨架。"
related:
  - "../../_source/02-ai-chatbot-sync.md#a-m12-prd治理"
---

# FR-0034 — AI Employee Charter / PRD 治理（Phase II）

> **新增 FR (2026-05-28)** — A12 module。**Phase II** 延後（per Q2=C）。本檔僅骨架。

## §1 Use Case Skeleton (骨架)

| 欄位 | 內容 |
|:-----|:-----|
| **Actor** | PM / Tech Lead |
| **Secondary Actors** | M20 AI Charter, audit |
| **Trigger** | 新 AI behavior gate 提案 |
| **Precondition** | Phase I A03-A11 已穩定 |
| **Main Flow** | (TBD Phase II) |
| **Alternative Flow** | (TBD) |
| **Postcondition** | Charter rule 落地 + audit |

## §2 Acceptance Criteria (骨架)

- AC-01: Charter 變更走 ADR + audit
- AC-02: AI Employee 行為 boundary 可審計
- AC-03: Gate 變動含 owner / status / source

## §3 Reference Map

| 類型 | ID | 用途 |
|:-----|:---|:-----|
| BR | BR-A12-01/02/NN | gate / output / charter |
| ADR | ADR-0028 | AI Charter |

## §4 Change Log

| Date | Change |
|:-----|:-------|
| 2026-05-28 | **新建** — A12 骨架（Phase II 延後）|
