---
id: FR-0024
title: LINE Webhook 高可用（ack < 200ms）
tier: 2
priority: P0
status: superseded
superseded_by: ../../architecture/nfr-matrix-smart-lock-saas.md#§2-availability--reliability (NFR-Avail-004 ~ NFR-Avail-007)
superseded_on: 2026-05-28
superseded_reason: "Roundtable Q3=A — NFR-flavored FR 搬到 NFR matrix"
nfr_flavored: true
last-synced-with: 4e9658e90324cbceb26f5e5445f481fc5678df1f
sync-source: doc
synced-at: 2026-05-15
legacy_id: REQ-024
trace_to_flow: F-001
related:
  - "../../0-principles/id-mapping-legacy.md §A.3 (REQ→FR)"
  - "../../0-principles/PRIN-0001-product-principles.md"
  - "../flows/business/"
  - "../api/openapi.yaml"
---

> [!IMPORTANT]
> **🔄 SUPERSEDED 2026-05-28**: 本 FR 已被搬到 `docs/architecture/nfr-matrix-smart-lock-saas.md#§2-availability--reliability` (NFR-Avail-004 ~ NFR-Avail-007)。
> **Reason**: Roundtable 2026-05-27 D5 + 業主 Q3=A — NFR-flavored FR (`nfr_flavored: true`) 從 FR 列表搬到 NFR matrix。
> **本檔保留**作 audit trail；新引用請走 NFR matrix。

# FR-0024 — LINE Webhook 高可用（ack < 200ms） [SUPERSEDED]

> 從 `docs/_flows-bdd-test/north-star-requirements.md REQ-024` 抽出，升級為 4-digit FR ID。

## §1 Description

LINE Webhook 高可用（ack < 200ms）

## §2 Priority

**P0** (Must-have for V1)

## §3 Acceptance Criteria

### §3.1 SLO（正常路徑）

LINE webhook 多 instance 部署（Cloud Run 自動擴展），P99 latency ≤ 200ms。

### §3.2 邊界案例

- 突發流量 10x → autoscale 60s 內補 instance
- Webhook 處理時間 > 5s → return 200 後 BackgroundTask 繼續

### §3.3 異常處理

- instance crash → load balancer 自動標 unhealthy + retry 其他 instance
- DB 連線池滿 → 503 retry-after 5s

### §3.4 TC Coverage

涵蓋之 TC（per `docs/2-contracts/test-cases/registry.yaml`）: BDD-0001 (response time < 3s), IT-0057~0061 (sla-monitor uptime + degraded)

## §4 Trace

| Aspect | Reference |
| :-- | :-- |
| Legacy ID | REQ-024 |
| Legacy F-XXX flow | F-001 |
| Implementation status | ✅ Live |

## §5 Change Log

| Date | Change |
| :--- | :--- |
| 2026-05-10 | 從 north-star-requirements REQ-024→FR-0024 split |
