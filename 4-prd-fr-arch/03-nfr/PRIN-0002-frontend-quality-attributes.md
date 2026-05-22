---
title: Frontend Quality Attributes — SLA / Core Web Vitals / A11y / 響應式
tier: 0
status: active
last_updated: 2026-05-10
sources_merged:
  - "_pending-split-performance-baseline.md §1 SLA Targets (per-endpoint)"
  - "../2-contracts/modules/MC-0019-sla-monitor.md §SLA targets"
  - "product-principles.md §3 Quality Bars"
related:
  - "product-principles.md"
  - "../3-process/TP-0001-test-plan.md (Performance test scenarios)"
  - "../1-decisions/frontend-tech-stack.md"
---

# Frontend Quality Attributes

> tier-0 hard constraint：前端品質目標。違反需開 ADR + 主管核可。

---

## §1 API SLA Targets (per-endpoint)

> 從 `_pending-split-performance-baseline.md §1` 抽出 baseline，所有 API 必須滿足。
> 對應 ISO/IEC 25010 Performance Efficiency。

| API operationId | p50 | p95 | p99 | max RPS | Status |
| :-- | :-- | :-- | :-- | :-- | :-- |
| `createConversation` | < 80ms | < 200ms | < 500ms | 100 | ⚠ TBD baseline |
| `analyzeMedia` | < 1s | < 3s | < 6s | 30 | ⚠ TBD |
| `createProblemCard` | < 200ms | < 500ms | < 1s | 50 | ⚠ TBD |
| `listProblemCards` | < 50ms | < 100ms | < 200ms | 200 | ⚠ TBD |
| `runDispatch` | < 800ms | < 2s | < 5s | 10 | ⚠ TBD |
| `claimOrder` | < 80ms | < 200ms | < 500ms | 30 | ⚠ TBD |
| `updateWorkOrderStatus` | < 50ms | < 100ms | < 200ms | 100 | ⚠ TBD |
| `submitRefundDecision` | < 200ms | < 500ms | < 1s | 20 | ⚠ TBD |
| `exportAuditEvents` (≤100k) | < 2s | < 5s | < 10s | 5 | ⚠ TBD |
| `exportAuditEvents` (>100k bg) | < 10s | < 30s | < 60s | 1 | ⚠ TBD |
| `listWorkOrders` (paginated) | < 80ms | < 200ms | < 500ms | 100 | ⚠ TBD |
| `getDashboardStats` | < 200ms | < 500ms | < 1s | 50 | ⚠ TBD |
| `listSopDrafts` | < 80ms | < 200ms | < 500ms | 30 | ⚠ TBD |
| `getKpiReport` | < 400ms | < 1s | < 2s | 20 | ⚠ TBD |
| AsyncAPI WS publish | < 20ms | < 50ms | < 100ms | event-driven | ⚠ TBD |

**規範**：
- 每個 operationId 必須有 SLA；無 SLA 的端點在 spec lint 時報警
- `max RPS` 為單實例 baseline；水平擴展能力見 `3-process/TP-0001-test-plan.md §capacity-planning`

實際 baseline 數字由 DevOps 跑 k6 後填入（CR follow-up）。

---

## §2 Core Web Vitals (前端)

| 指標 | 目標 | 80%-ile 用戶 |
| :-- | :-- | :-- |
| LCP (Largest Contentful Paint) | < 2.5s | desktop 4G |
| FID (First Input Delay) | < 100ms | desktop 4G |
| INP (Interaction to Next Paint) | < 200ms | mobile 4G |
| CLS (Cumulative Layout Shift) | < 0.1 | both |
| TTFB (Time to First Byte) | < 600ms | desktop 4G |
| FCP (First Contentful Paint) | < 1.8s | desktop 4G |

工具：Lighthouse CI on every PR（待 Phase 後加入 quality gate）。

---

## §3 Accessibility (WCAG 2.1)

- **目標等級**：AA
- 必通過：
  - 鍵盤可達（所有互動元素）
  - 焦點可見
  - 顏色對比度 ≥ 4.5:1（normal text）/ ≥ 3:1（large text）
  - alt text 完整（所有 img / icon button）
  - 表單 label 連結 input
  - 語意 HTML（h1-h6 階層、landmarks）
- 工具：axe DevTools / WAVE / Lighthouse a11y

---

## §4 Browser Support

| Browser | Version | 必支援 |
| :-- | :-- | :-- |
| Chrome | 最新 + 前 2 版 | ✅ |
| Edge | 最新 + 前 2 版 | ✅ |
| Safari | 最新 + 前 1 版 | ✅ |
| Firefox | 最新 | 🟡 best effort |
| iOS Safari | 14+ | ✅（技師 PWA 主戰場）|
| Android Chrome | 最新 | ✅（技師 PWA 主戰場）|
| IE 11 | — | ❌ 不支援 |

---

## §5 響應式 Breakpoints

| Token | Width | 主要場景 |
| :-- | :-- | :-- |
| `sm` | 640px | 手機橫向 |
| `md` | 768px | 平板直向 |
| `lg` | 1024px | 平板橫向 / 小筆電 |
| `xl` | 1280px | 桌上型主流 |
| `2xl` | 1536px | 大型桌機 / 4K 縮放 |

技師 PWA 必須在 `sm` 完全可用。Admin Panel 主用 `lg+`。

---

## §6 圖片 / 資源限制

- 單次 LINE 多媒體上傳：< 10MB（agent 端 multimodal limit）
- Web 圖片 lazy load 預設啟用
- WebP 優先；fallback PNG

---

## §7 Bundle Size Budget

| 路由群 | First Load JS | 警示閾值 |
| :-- | :-- | :-- |
| `/dashboard` | < 250KB | 超 = block PR |
| `/conversations`, `/problem-cards` | < 200KB | 超 = warn |
| `/work-orders/*` | < 300KB | 超 = warn |
| `/admin/*` | < 350KB | 超 = warn |

工具：`@next/bundle-analyzer` on PR。

---

## §8 變更紀錄

| 日期 | 內容 |
| :--- | :--- |
| 2026-05-10 | 初版 — 整合 performance-baseline §1 SLA targets + Core Web Vitals + a11y + 響應式 |
