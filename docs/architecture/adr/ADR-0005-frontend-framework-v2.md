---
id: ADR-0005
title: 選擇 Next.js 作為 V2.0 前端框架
tier: 1
status: accepted
date: 2026-02-17
deciders: [技術負責人, 開發團隊]
---

> 
> **🔄 Migration Status (2026-05-28)**: `STILL_VALID_UNDER_cross-cutting`
> **Reviewed against**: 2026-05-20 final spec (xlsx)
> **Reviewed on**: 2026-05-28
> **Module scope**: cross-cutting
> **Per ADR-0100 §1 classification** (.claude/context/devteam/meetings/2026-05-27-1130-final-spec-migration-strategy/MoM.md)


# ADR-005: 選擇 Next.js 作為 V2.0 前端框架

**狀態:** 已接受 (Accepted)
**決策者:** 技術負責人, 開發團隊
**日期:** 2026-02-17

---

## 1. 背景與問題陳述

平台 V2.0 階段需要開發兩個核心前端應用：

### 技師工作台（Technician Workbench）

- **使用情境：** 技師在外出場時使用手機操作，需要 Mobile-first 設計。
- **核心功能：**
  - 即時接收派工通知（類 Uber 搶單/派單模式）。
  - 查看工單詳情：ProblemCard 診斷結果、客戶地址、導航連結。
  - 更新工單狀態：出發、到達、維修中、完工。
  - 拍照上傳：維修前後照片、零件更換紀錄。
  - 費用確認：標準化報價確認、客戶簽名。
  - 歷史工單查詢與統計（本月接單數、收入、評分）。
- **效能需求：** 技師在電梯、地下室等弱網路環境下操作，頁面必須快速載入，支援離線基本瀏覽。

### 管理後台（Admin Panel）

- **使用情境：** 管理員在桌機上操作，需要 Desktop-optimized 設計。
- **核心功能：**
  - 工單管理儀表板：即時工單狀態總覽、篩選、搜尋。
  - 技師管理：技師資料 CRUD、技能矩陣編輯、服務區域設定。
  - 知識庫管理：案例庫 CRUD、PDF 手冊上傳與向量化觸發、SOP 審核與發布。
  - 報表與對帳：服務費用統計、技師結算明細、月度對帳報表。
  - AI 對話紀錄：查看使用者與 AI 的完整對話歷史、ProblemCard 詳情。
  - 系統設定：LINE Bot 設定、通知規則、報價規則。

### 技術考量

- **V1.0 階段無前端：** V1.0 以 LINE Bot + 後台 API 為主，前端是 V2.0 的新需求。
- **BFF (Backend for Frontend) 需求：** 技師工作台與管理後台的 API 需求不同，需要 BFF 層做 API 聚合與裁剪。
- **SEO 不重要：** 兩個應用都是登入後使用，不需要搜尋引擎優化。但 SSR 對首屏效能仍有價值。
- **TypeScript 需求：** 前後端 schema 共享（Pydantic model <-> TypeScript interface），強型別減少整合錯誤。

## 2. 考量的選項

### 選項一: Next.js（React 生態系）

- **概述：** 基於 React 的全端框架，由 Vercel 維護，支援 SSR、SSG、ISR、API Routes 等多種渲染策略。
- **優點：**
  - **App Router + Server Components：** Next.js 14+ 的 App Router 與 React Server Components 提供更細粒度的渲染控制，減少客戶端 JavaScript bundle。
  - **API Routes 作為 BFF：** 內建 API Routes 可直接作為 BFF 層，聚合 FastAPI 的多個端點，為前端提供最佳化的資料結構。
  - **React 生態系成熟度：** 元件庫（shadcn/ui、Ant Design、Material UI）、狀態管理（Zustand、Jotai）、表單（React Hook Form）等選擇豐富。
  - **TypeScript 支援：** 原生 TypeScript 支援，搭配自動產生的 OpenAPI client（openapi-typescript-codegen），可從 FastAPI 的 OpenAPI spec 直接生成 TypeScript API client。
  - **Mobile-first PWA：** 搭配 `next-pwa` 支援 Progressive Web App，技師工作台可安裝到手機桌面，支援離線快取與推播通知。
  - **Image Optimization：** 內建 `next/image` 最佳化圖片載入，對技師上傳的現場照片處理有幫助。
  - **Middleware：** Edge Middleware 可用於認證檢查、角色路由（技師 vs 管理員）。
- **缺點：**
  - 框架功能豐富，學習曲線較陡（App Router vs Pages Router、Server Components vs Client Components 的選擇）。
  - Vercel 部署生態與 self-hosted 部署之間存在功能差異（部分功能在 self-hosted 模式下受限）。
  - React 生態系選擇過多，需要花時間做技術選型。

### 選項二: Nuxt.js（Vue 生態系）

- **概述：** 基於 Vue.js 的全端框架，由 NuxtLabs 維護，與 Next.js 定位類似。
- **優點：**
  - Vue.js 的學習曲線較 React 平緩，模板語法更直觀。
  - Nuxt 3 基於 Nitro server engine，支援 SSR、SSG、ISR。
  - Vue 生態系的 UI 框架（Element Plus、Vuetify、Naive UI）品質高。
  - Auto-import 機制減少 boilerplate。
- **缺點：**
  - **Vue 生態系規模較小：** 相較 React，Vue 的第三方套件、元件庫、開發工具選擇較少。
  - **TypeScript 支援：** Vue 3 的 TypeScript 支援有顯著改善，但在某些場景（如 template 中的型別推導）仍不如 React + TSX 直觀。
  - **招募考量：** React 開發者的市場供給大於 Vue 開發者，未來團隊擴編時影響招募效率。
  - **Server Components 缺失：** Vue 目前沒有等同 React Server Components 的功能，在減少客戶端 JavaScript 的策略上選擇較少。

### 選項三: Plain React SPA（Create React App / Vite）

- **概述：** 純客戶端渲染的 React 單頁應用，不使用 SSR 框架。
- **優點：**
  - 架構最簡單，無 server 端渲染複雜度。
  - 部署簡單（靜態檔案 + CDN）。
  - 開發體驗直覺（所有程式碼都在瀏覽器端執行）。
- **缺點：**
  - **首屏效能差：** 所有 JavaScript 需要下載、解析、執行後才能渲染首屏。技師在弱網環境下，首屏載入可能超過 5 秒。
  - **缺乏 BFF 能力：** 純 SPA 沒有 server 端，無法實作 API Routes 作為 BFF，需要另外建構 BFF 服務或讓前端直接呼叫 FastAPI（增加耦合）。
  - **SEO（不適用但未來考量）：** 若未來需要公開頁面（如技師個人頁、服務區域頁），SPA 無法支援 SSR。
  - **缺乏 Middleware：** 無法在 server 端做認證前置檢查，所有安全邏輯都在客戶端處理。

## 3. 決策

**選擇 Next.js 作為 V2.0 前端框架。**

技術規格：
- **Next.js 版本：** 15.x（App Router）
- **React 版本：** 19.x
- **TypeScript：** 嚴格模式 (`strict: true`)
- **UI 元件庫：** shadcn/ui（基於 Radix UI + Tailwind CSS，高度可客製化）
- **狀態管理：** Zustand（輕量、TypeScript 友善）
- **表單處理：** React Hook Form + Zod（schema validation）
- **API Client：** openapi-typescript-codegen（從 FastAPI OpenAPI spec 自動生成）
- **PWA：** next-pwa（技師工作台 PWA 化）
- **部署：** Docker（self-hosted，搭配 Node.js standalone output）

### 應用架構

```
Next.js Application
├── /app
│   ├── /(admin)/          # 管理後台路由群組
│   │   ├── dashboard/     # 儀表板
│   │   ├── cases/         # 工單管理
│   │   ├── technicians/   # 技師管理
│   │   ├── knowledge/     # 知識庫管理
│   │   ├── billing/       # 對帳報表
│   │   └── settings/      # 系統設定
│   ├── /(technician)/     # 技師工作台路由群組
│   │   ├── orders/        # 我的工單
│   │   ├── dispatch/      # 即時派工
│   │   ├── history/       # 歷史紀錄
│   │   └── profile/       # 個人資料
│   └── /api/              # BFF API Routes
│       ├── admin/         # Admin BFF endpoints
│       └── technician/    # Technician BFF endpoints
├── /components
│   ├── ui/                # shadcn/ui base components
│   ├── admin/             # Admin-specific components
│   └── technician/        # Technician-specific components
└── /lib
    ├── api-client/        # Auto-generated API client
    └── hooks/             # Custom React hooks
```

## 4. 決策的後果與影響

### 正面影響

- **技師工作台效能：** SSR 確保首屏 HTML 在 server 端渲染完成後直接傳送，技師在弱網環境下首屏載入時間顯著縮短（目標 < 2 秒）。搭配 PWA Service Worker 快取，重複訪問可達到近即時載入。
- **BFF 層統一：** Next.js API Routes 作為 BFF：
  - 管理後台「儀表板」需要的資料可能來自 3-4 個 FastAPI 端點，BFF 聚合為單一呼叫。
  - 技師工作台「工單詳情」需要 ProblemCard + 客戶資訊 + 導航連結，BFF 組裝為最佳化的 payload。
  - 減少前端與 FastAPI 的直接耦合，API 變更時只需調整 BFF 層。
- **TypeScript 端到端型別安全：**
  ```
  FastAPI (Pydantic model)
      ↓ [自動生成 OpenAPI spec]
  openapi-typescript-codegen
      ↓ [生成 TypeScript types + API client]
  Next.js (TypeScript)
  ```
  ProblemCard 的 schema 從後端到前端保持一致，欄位新增或修改時，TypeScript 編譯器自動檢測前端需要調整的地方。
- **技師 PWA 體驗：**
  - 可安裝到手機桌面，全螢幕執行，接近原生 App 體驗。
  - Service Worker 快取靜態資源與最近的工單資料，離線時可查看已載入的工單。
  - Web Push Notification 支援即時派工通知。
- **角色路由隔離：** Next.js Middleware 在 Edge Runtime 執行認證與角色檢查：
  ```typescript
  // middleware.ts
  export function middleware(request: NextRequest) {
    const role = getUserRole(request);
    if (request.nextUrl.pathname.startsWith('/(admin)') && role !== 'admin') {
      return NextResponse.redirect('/unauthorized');
    }
  }
  ```

### 負面影響與風險

- **部署複雜度增加：** Next.js 需要 Node.js runtime（不像 SPA 只需靜態檔案伺服器），Docker 部署需要額外的 Node.js 容器。
- **學習曲線：** App Router、Server Components、Server Actions 等概念需要團隊學習。
- **Build 時間：** 大型 Next.js 應用的 build 時間可能較長（可透過 Turbopack 緩解）。
- **Vercel 生態偏向：** 部分 Next.js 功能（如 ISR On-Demand Revalidation）在 self-hosted 模式下行為可能不同。

### 風險緩解措施

| 風險 | 緩解措施 |
|------|----------|
| 部署複雜度 | 使用 `output: 'standalone'` 產生最小化 Docker image；Docker Compose 統一編排 |
| 學習曲線 | 初期建立 2-3 個參考頁面作為 pattern，團隊依循 pattern 開發 |
| Build 時間 | 啟用 Turbopack（`next dev --turbo`）加速開發；CI 中使用 build cache |
| Self-hosted 限制 | 本專案不依賴 Vercel 特有功能（Edge Functions、Image CDN 等），僅使用 Next.js core 功能 |

## 5. 執行計畫概要

1. **專案初始化：**
   ```bash
   npx create-next-app@latest admin-portal --typescript --tailwind --app --src-dir
   ```
   配置 ESLint、Prettier、Husky pre-commit hooks。

2. **UI 基礎建設：**
   - 安裝 shadcn/ui 並配置 Tailwind CSS theme（品牌色彩、字型）。
   - 建立共用 Layout 元件（Admin Layout with sidebar、Technician Layout with bottom nav）。
   - 建立 responsive breakpoints（技師工作台 mobile-first、管理後台 desktop-first）。

3. **API Client 自動生成：**
   - 從 FastAPI 的 `/openapi.json` 自動生成 TypeScript API client。
   - 建立 CI pipeline：FastAPI OpenAPI spec 變更時自動重新生成。

4. **核心頁面開發順序：**
   - Phase 1：管理後台登入、儀表板、工單列表/詳情。
   - Phase 2：技師工作台登入、即時派工、工單操作。
   - Phase 3：知識庫管理、報表對帳、系統設定。

5. **PWA 配置（技師工作台）：**
   - 配置 `next-pwa` 的 Service Worker 與 manifest.json。
   - 定義 cache strategy：App Shell (cache-first)、API data (network-first)。
   - 整合 Web Push Notification（派工通知）。

6. **Docker 部署：**
   ```dockerfile
   FROM node:20-alpine AS builder
   WORKDIR /app
   COPY . .
   RUN npm ci && npm run build

   FROM node:20-alpine AS runner
   WORKDIR /app
   COPY --from=builder /app/.next/standalone ./
   COPY --from=builder /app/.next/static ./.next/static
   COPY --from=builder /app/public ./public
   EXPOSE 3000
   CMD ["node", "server.js"]
   ```

## 6. 相關參考

- [Next.js Documentation](https://nextjs.org/docs)
- [React Server Components](https://react.dev/reference/rsc/server-components)
- [shadcn/ui](https://ui.shadcn.com/)
- [next-pwa](https://github.com/shadowwalker/next-pwa)
- [openapi-typescript-codegen](https://github.com/ferdikoomen/openapi-typescript-codegen)
- [Tailwind CSS](https://tailwindcss.com/)
- [Zustand](https://zustand-demo.pmnd.rs/)
- ADR-001: 後端框架選型（FastAPI — OpenAPI spec 自動生成）
- ADR-004: LINE Bot 對話架構設計（Redis session 共用）
