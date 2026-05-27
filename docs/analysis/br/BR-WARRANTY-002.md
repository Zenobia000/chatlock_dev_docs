---
id: BR-WARRANTY-002
title: AI 禁止自動報價（保固案）
status: active
phase: I
module: M13
mapped_to:
- M13
source: docs/_source/01-workorder-erp.md
referenced_by:
- FR-0015
---

# BR-WARRANTY-002 — AI 禁止自動報價（保固案）

## Rule

保固案 ProblemCard 必連品牌 / 序號 / 發票 / 購買日，且禁止 AI 最終報價（safety_gate 攔截）。

## Source

- docs/_source/01-workorder-erp.md §M03（Q018）+ §M20（G019）

## Constraints

- hard_gate: case_type=warranty → block AI final quote

## Cross-Refs

- FR: FR-0015
- Related BR / ADR:
- BR-A05-01
