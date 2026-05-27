---
id: FR-0033
title: Chatbot 部署 / 健康檢查 (Cloud Run + health)
status: active
phase: I
mapped_to:
  - A11    # 部署健康
superseded_clauses:
  - BR-A11-01    # facts_db + audit_db health
  - BR-A11-02    # DB reconnect
  - BR-A11-NN    # health endpoint /healthz, /readyz
  - BR-A11-NN    # SLO definition
emits_events:
  - HealthCheckFailed
  - DbReconnected
nfr_flavored: false
priority: P0
tier: 2
owner: SRE
last_reviewed: 2026-05-28
related_adrs: []
related:
  - "../../_source/02-ai-chatbot-sync.md#a-m11-部署健康"
---

# FR-0033 — Chatbot 部署 / 健康檢查

> **新增 FR (2026-05-28)** — A11。Phase I。

## §1 Use Case Skeleton

| 欄位 | 內容 |
|:-----|:-----|
| **Actor** | SRE / Cloud Run platform |
| **Secondary Actors** | facts_db, audit_db |
| **Trigger** | Cloud Run health probe / DB connection event |
| **Precondition** | service deployed |
| **Main Flow** | 詳見 §1.1 |
| **Alternative Flow** | 詳見 §1.2 |
| **Postcondition** | healthy/unhealthy report |

### §1.1 Main Flow

1. Cloud Run probe `/readyz`
2. service 檢查 facts_db + audit_db connection ([ref: BR-A11-01])
3. 回 200 healthy

### §1.2 Alternative Flow

```
A1. DB disconnect:
    A1.1 service 自動 reconnect ([ref: BR-A11-02])
    A1.2 reconnect 失敗 → /readyz 503
    A1.3 emit `HealthCheckFailed`
    A1.4 Cloud Run rolling restart

A2. DB reconnect 成功:
    A2.1 emit `DbReconnected`
```

## §2 Acceptance Criteria

### AC-01: Healthy

```gherkin
When probe /readyz
Then 200 + facts_db + audit_db OK
```

### AC-02: DB fail

```gherkin
Given DB down
Then /readyz 503 + `HealthCheckFailed`
```

### AC-03: Reconnect

```gherkin
When DB 恢復
Then auto reconnect + `DbReconnected`
```

## §3 Reference Map

| 類型 | ID | 用途 |
|:-----|:---|:-----|
| BR | BR-A11-01/02/NN | health / reconnect / endpoint |
| Event | HealthCheckFailed / DbReconnected | — |

## §4 Change Log

| Date | Change |
|:-----|:-------|
| 2026-05-28 | **新建** — A11 module FR 殼 |
