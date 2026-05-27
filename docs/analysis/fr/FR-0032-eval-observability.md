---
id: FR-0032
title: AI Eval / 觀測（quality_check + audit + token cost）
status: active
phase: I
mapped_to:
  - A09    # Eval 觀測
  - M19    # BI / dashboard
superseded_clauses:
  - BR-A09-01    # 核心責任 — 67+ cases / LLM judge / token cost
  - BR-A09-02    # 主要輸出 quality report
  - BR-A09-NN    # nightly eval cron
  - BR-A09-NN    # eval set 版本控制
emits_events:
  - EvalRunStarted
  - EvalRunCompleted
  - EvalRegression
nfr_flavored: false
priority: P0
tier: 2
owner: AI QA
last_reviewed: 2026-05-28
related_adrs:
  - ADR-0038    # AI feedback / SOP 審核
related:
  - "../../_source/02-ai-chatbot-sync.md#a-m09-eval觀測"
---

# FR-0032 — AI Eval / 觀測

> **新增 FR (2026-05-28)** — A09。Phase I per Q2=C。

## §1 Use Case Skeleton

| 欄位 | 內容 |
|:-----|:-----|
| **Actor** | AI QA / System (nightly cron) |
| **Secondary Actors** | LLM judge, M19 dashboard |
| **Trigger** | Nightly cron OR PR merge gate |
| **Precondition** | eval set ready；67+ cases checked-in |
| **Main Flow** | 詳見 §1.1 → user-flow:A09-step1 |
| **Alternative Flow** | 詳見 §1.2 |
| **Postcondition** | quality_report 落 BI；regression 通知 |

### §1.1 Main Flow

1. 啟動 eval run → user-flow:A09-step1
2. emit `EvalRunStarted`
3. 跑 67+ cases through agent
4. LLM judge 評分 (accuracy / helpfulness / handoff rate)
5. 計算 token cost
6. 落 BI dashboard
7. emit `EvalRunCompleted`
8. 若 regression > threshold → emit `EvalRegression` + alert
9. END

### §1.2 Alternative Flow

```
A1. Eval set 變動:
    A1.1 version bump
    A1.2 audit 紀錄

A2. LLM judge timeout:
    A2.1 retry / fallback 人工 review

A3. Cost > budget:
    A3.1 alert finance
```

## §2 Acceptance Criteria

### AC-01: Nightly eval

```gherkin
When cron 02:00 跑
Then `EvalRunStarted` + `EvalRunCompleted`
  And quality_report 入 BI
```

### AC-02: Regression alert

```gherkin
Given accuracy 從 88% 降至 80%
Then `EvalRegression` emit + alert
```

### AC-03: Eval set version

```gherkin
When eval case 變動
Then version bump + audit
```

## §3 Reference Map

| 類型 | ID | 用途 |
|:-----|:---|:-----|
| BR | BR-A09-01/02/NN | core / output / cron / version |
| ADR | ADR-0038 | AI feedback |
| Event | EvalRun* / EvalRegression | — |

## §4 Change Log

| Date | Change |
|:-----|:-------|
| 2026-05-28 | **新建** — A09 module FR 殼 |
