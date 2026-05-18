# System Spec — <Feature Name>

> **Owner**: devteam-analyst (SA persona)
> **Status**: draft | reviewed | frozen | superseded
> **Version**: v<n>
> **Last updated**: <YYYY-MM-DD>
> **Related PRD**: docs/prd/<feature>.md
> **Related UX**: docs/ux/user-flow-<feature>.md
> **Related ADR/DR**: <list>

---

## Actors

| Actor | Type | 描述 |
|:------|:-----|:-----|
| <name> | human / system / time | ... |

## Use Cases

### UC-001: <name>

- **Actor**: <actor>
- **Trigger**: <event>
- **Pre-conditions**: <state required>
- **Main flow**:
  1. ...
  2. ...
- **Alternative flows**:
  - A1: <branch + steps>
- **Exception flows**:
  - E1: <error + handling>
- **Post-conditions**: <state after>
- **Acceptance Criteria** (Given/When/Then):
  - Given <state>
  - When <action>
  - Then <result>
- **Source**: PRD FR-001
- **Verification method**: test (E2E)

### UC-002: ...

---

## Business Rules Catalog

| Rule ID | Description | Source | Priority | Exception | Owner |
|:--------|:------------|:-------|:---------|:----------|:------|
| BR-001 | <rule statement> | <stakeholder / regulation> | M / S / C | <when does not apply> | BA |

**禁忌**：規則只在群組長口頭存在 → 升格 blocker。

---

## State Model（若適用）

<!-- HINT: 選圖前先讀 KB 07 §2.1 試金石：「現在處於什麼狀態」→ state machine；「誰對誰做什麼」→ sequence；「接下來做什麼」→ activity。State machine 必標 `[*]` 終結態 (KB 07 §5 anti-pattern)。 -->

```mermaid
stateDiagram-v2
    [*] --> Draft
    Draft --> Submitted: submit
    Submitted --> Approved: approve
    Submitted --> Rejected: reject
    Approved --> [*]
    Rejected --> Draft: revise
```

| State | Allowed transitions | Conditions |
|:------|:--------------------|:-----------|
| Draft | Submitted | 必填欄位齊 |
| ... | ... | ... |

---

## Events（系統事件目錄）

<!-- HINT: Event 命名 + payload schema 套 KB 08 §2.4（domain.entity.action.v1 過去式）與 §6.3 envelope（必含 event_id / occurred_at / trace_id）。 -->

| Event | Producer | Consumer | Payload schema |
|:------|:---------|:---------|:---------------|
| `orders.order.created.v1` | Order service | Inventory, Email | envelope per KB 08 §6.3 |

---

## Integration Inventory

<!-- HINT: Protocol 欄選擇參 KB 08 §1（REST/GraphQL/gRPC/event/WebSocket 決策樹）；Auth 欄選擇參 KB 11 §6.2（場景對應推薦）；Failure handling 欄套 KB 10 §1 quick picker（retry / CB / timeout / fallback）。 -->

| External System | Direction | Protocol | Auth | Failure handling | Data classification |
|:----------------|:----------|:---------|:-----|:-----------------|:--------------------|
| Stripe | outbound | REST | Bearer | retry + idempotency key | Restricted (payment) |
| ... | ... | ... | ... | ... | ... |

---

## Functional Boundary

### In Scope
- ...

### Out of Scope
- ... (引用 PRD scope)

---

## Assumptions & Open Questions

- **A-1**: <假設>
- **OQ-1**: <open question + who decides + by when>

---

## Downstream Consumers
- docs/architecture/c4-<feature>.md
- docs/architecture/adr/ADR-*.md
- docs/api/openapi-<service>.yaml
- docs/data/erd-<feature>.md
- docs/qa/test-plan-<release>.md
