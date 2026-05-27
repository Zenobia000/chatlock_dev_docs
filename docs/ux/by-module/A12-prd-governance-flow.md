---
doc_id: UX-MOD-A12
title: A12 PRD 治理 — 決策與 source trace
version: v1
status: draft
phase: II (延後)
owner: UX
mapped_to: [A12]
parent_flow: docs/ux/user-flow-smart-lock-saas.md
wcag_level: AA
related_kb: [KB-07]
related_modules: [M18]
last_updated: 2026-05-28
---

# A12 PRD 治理 — 決策與 source trace（Phase II 延後）

> **30 秒摘要**：A12 給 PM / Tech Lead 用，把每個 gate / 決策對應 owner / 狀態 / source。Phase II 才啟動（業主裁決 Q2=C — A12 延 Phase II）；Phase I 暫用 ad-hoc decision_log。

## Sequence Diagram — decision log workflow

```mermaid
sequenceDiagram
    autonumber
    actor pm as PM / Tech Lead
    participant a12 as A12 PRD Governance UI
    participant ledger as decision_log
    participant trace as source trace
    actor reviewer as reviewer

    pm ->> a12: 新增 decision (gate, owner, source)
    a12 ->> ledger: write entry (ts, who, status=pending)
    a12 ->> reviewer: assign reviewer
    reviewer ->> a12: review + approve/reject
    a12 ->> ledger: update status
    a12 ->> trace: link to ADR / spec / PRD section
```

## State Machine — decision lifecycle

```mermaid
stateDiagram-v2
    [*] --> pending
    pending --> approved : reviewer 同意
    pending --> rejected : reviewer 退回
    pending --> superseded : 新決策取代
    approved --> active
    active --> superseded
    rejected --> [*]
    superseded --> [*]
```

## UI State Coverage

| Step | Happy | Empty | Loading | Error | Offline | annotation |
|:---|:---|:---|:---|:---|:---|:---|
| decision log 列表 | ✓ 列表 + filter | empty 「無決策」 | < 1s | 403 顯示「無權限」 | banner | decision: any |
| 新增 decision | ✓ form 提交 | required 欄空白 → block | spinner | validation fail inline | local cache | pending |
| reviewer 審核 | ✓ approve / reject | empty queue | spinner | conflict 兩人同改 → optimistic lock | banner 無法 review | pending → approved/rejected |

## a11y notes
- 後台 PRD governance UI 走 WCAG 2.2 AA
- decision diff view 走 semantic HTML
- approve / reject 按鈕 ≥ 44×44

## FR 反向指
| Step | FR | AC |
|:---|:---|:---|
| decision_log | FR-TBD-A12-001 (Phase II) | AC-01 ts/who/status/source 完整 |
| source trace | FR-TBD-A12-002 (Phase II) | AC-01 link to ADR/spec/PRD |
| reviewer workflow | FR-TBD-A12-003 (Phase II) | AC-01 assign + approve/reject |

## 相關
- 主檔：[`../user-flow-smart-lock-saas.md`](../user-flow-smart-lock-saas.md)
- M18 admin UI：[`./M18-system-setup-flow.md`](./M18-system-setup-flow.md)
- Source：[`../../_source/02-ai-chatbot-sync.md#a-m12-prd治理`](../../_source/02-ai-chatbot-sync.md)
