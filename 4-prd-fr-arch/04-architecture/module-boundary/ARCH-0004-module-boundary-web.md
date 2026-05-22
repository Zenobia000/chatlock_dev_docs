---
id: ARCH-0004
date: 2026-05-10
deciders: [Tech Lead, Architecture team]
title: Module Boundary — web/
tier: 1
status: accepted
last_updated: 2026-05-10
source_paths:
  - web/
related:
  - "../architecture-overview.md"
  - "../frontend-tech-stack.md"
  - "../../2-contracts/frontend-design-system/"
  - "../../2-contracts/pages/"
---

# Module Boundary — web/

> **角色**：Next.js 15 + React 19 + TypeScript admin 後台 + 技師 Web App (PWA)。

## Owns

- Admin Panel 路由：`/dashboard`、`/conversations`、`/problem-cards`、`/work-orders`、`/technicians`、`/accounting`、`/knowledge-base`、`/admin/*`
- Technician Web App 路由：`/pool`、`/my-orders`、`/tech-login`、...
- Auth：JWT + Refresh + RBAC route guard
- Generated API types（`web/types/api.generated.ts` from openapi.yaml）
- shadcn/ui + Tailwind CSS 4 design system 實例（見 `2-contracts/frontend-design-system/`）
- Recharts 圖表 / Lucide 圖示
- Sidebar 導航（NavItem nested）
- Realtime UI：SSE / WebSocket 連線
- Path alias `@/*` → `./src/*`

## Does NOT Own

- 業務邏輯 → `api/`
- AI 對話 → `agent/`
- 知識庫產出 → `data/pipeline/`
- Master data 內容 → `SQL/seed/` + admin import flow

## Dependencies

| 依賴 | 介面 | 用途 |
| :-- | :-- | :-- |
| api/ | HTTP REST + WS | 全部後台資料 |
| openapi-typescript | build step | type generation |
| shadcn/ui | npm | UI components |
| Tailwind CSS 4 | postcss | styling |

## ACL

- API client wrapper：`web/src/lib/api.ts`（統一錯誤 envelope）
- Type-safe：所有 API 呼叫透過 generated types
- Auth interceptor：401 → refresh token → retry

## Public API

無；web 是 consumer，不 expose API。

對外 URL：
- 公開 token 路徑：`/track/{token}`（消費者工單追蹤，UF-0014）
- 其他全部需要 JWT

## Health Boundaries

- API 失敗：error boundary（global G4）→ 重試提示
- WS 中斷：自動重連 + UI 顯示「連線中」
- offline：service worker 快取靜態資源 + offline UI（G2）

## Page contracts & route map

- **Anchor page contracts**：[`../../2-contracts/pages/INDEX.md`](../../2-contracts/pages/INDEX.md) — 10 個關鍵入口
- **Full route → page.tsx mapping**：[`../../5-views/VIEW-0003-frontend-route-map.md`](../../5-views/VIEW-0003-frontend-route-map.md)（AUTO，含 IA 52 頁完整對照）
- **CRUD list/detail 頁**: 直接看 `web/src/app/<route>/page.tsx`，frontend-route-map 是 SSOT
