---
id: BR-WARRANTY-001
title: Handover_date 起算
status: active
phase: I
module: M13
mapped_to:
- M13
source: docs/_source/01-workorder-erp.md
referenced_by:
- FR-0015
---

# BR-WARRANTY-001 — Handover_date 起算

## Rule

保固起算日：建商案用交屋 / 點交日（handover_date）；零售案用安裝日 / 品牌保固日（install_date）。保固期長度依品牌 SLA。

## Source

- docs/_source/01-workorder-erp.md §M13 RMA 品質（Q107）+ §M02（G002）

## Constraints

- 起算日 source 依 case_type

## Cross-Refs

- FR: FR-0015
- Related BR / ADR:
- BR-M02-02
