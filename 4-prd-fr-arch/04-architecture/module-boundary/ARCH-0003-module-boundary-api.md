---
id: ARCH-0003
date: 2026-05-10
deciders: [Tech Lead, Architecture team]
title: Module Boundary — api/
tier: 1
status: accepted
last_updated: 2026-05-10
source_paths:
  - api/
related:
  - "../architecture-overview.md"
  - "../../2-contracts/api/openapi.yaml (REST 契約)"
  - "../../2-contracts/api/asyncapi.yaml (WS / SSE / webhook 契約)"
---

# Module Boundary — api/

> **角色**：FastAPI REST/WebSocket backend；負責工單、派工、技師、帳務、退款、保固、爭議、RBAC、稽核全套後台 API。

## Owns

- REST API surface（OpenAPI 3.1，見 `2-contracts/api/openapi.yaml`）
- WebSocket / SSE realtime（AsyncAPI 2.6，見 `2-contracts/api/asyncapi.yaml`）
- JWT 認證 + RBAC middleware
- 7 個 system role（super_admin / tenant_admin / ops_director / ops_manager / dispatch_officer / support_agent / auditor；見 `2-contracts/modules/MC-0015-rbac.md`）
- Work Order 16 狀態機（含 SLA 監控）
- 派工演算法（auto + manual + 拒單重派）
- 報價引擎（V2.0）
- 帳務模組（V2.0）
- 退款 / 保固 / 爭議流程
- Audit log 寫入（hash chain TBD per V3 ADR-0010）

## Does NOT Own

- LINE Bot / AI 對話 → `agent/`
- Admin Panel UI → `web/`
- 知識庫資料產出 → `data/pipeline/`
- DB schema 演進 → `SQL/` + Alembic（待整理）

## Dependencies

| 依賴 | 介面 | 用途 |
| :-- | :-- | :-- |
| PostgreSQL | SQLAlchemy 2.0 async + asyncpg | 主資料庫 |
| Redis | aioredis | session cache + rate limit |
| Google Maps API | HTTP | 派工距離計算 |
| line-push-service | HTTP | 通知消費者（reschedule / SLA）|
| 金流 provider | TBD | Q7=B 待選型（Stripe / 綠界 / 藍新 / Linepay） |

## ACL

- 入口 input validation：Pydantic v2 schemas
- 跨模組事件：domain events（asyncapi.yaml §domain-events）
- LINE Push retry：1s / 2s / 4s 三層 + audit + fail-soft

## Public API

完整見 OpenAPI；主要 endpoint 群：

- `/api/v1/work-orders/*`
- `/api/v1/admin/dispatch-queue`、`/api/v1/admin/refunds`、`/api/v1/admin/disputes`
- `/api/v1/technicians/*`
- `/api/v1/admin/audit-events`、`/api/v1/admin/roles`
- `/api/v1/realtime/*`（WS）
- `/api/v1/public/work-orders/{token}`（消費者匿名 token，UF-0014）
- `/api/admin/tenants/*`（V3 多租戶生命週期，未實作）

## Health Boundaries

- DB 失敗 → `/health` 503，所有 endpoint 503
- 金流 provider 失敗 → 退款 / 撥款 stuck（pending state），人工介入
- LINE Push 全失敗（4 retry 後）→ audit log 記錄，不阻擋主流程

## 待整理

詳細 V2.0 模組規格見 source `docs/01-define/E3x--module-breakdown.md` §4.1~4.5（M9 派工引擎、M10 報價引擎、M11 帳務模組、M12 技師 Web App backend、M13 Admin Panel V2.0 backend）。
