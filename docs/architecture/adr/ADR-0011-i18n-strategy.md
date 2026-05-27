---
id: ADR-0011
date: 2026-05-09
title: i18n Strategy — 多語系實作決策
phase: DESIGN
gate: TR5
status: accepted
owners:
  - FE Lead
  - Tech Lead
related:
  - "[[_flows-bdd-test/v-model-right/E7x--test-plan-and-readiness]]"
  - "[[02-design/specs/notification-channel-strategy]]"
last_reviewed: 2026-05-09
last_updated: 2026-05-09
---

> 
> **🔄 Migration Status (2026-05-28)**: `STILL_VALID_UNDER_cross-cutting`
> **Reviewed against**: 2026-05-20 final spec (xlsx)
> **Reviewed on**: 2026-05-28
> **Module scope**: cross-cutting
> **Per ADR-0100 §1 classification** (.claude/context/devteam/meetings/2026-05-27-1130-final-spec-migration-strategy/MoM.md)


# i18n Strategy — 多語系實作決策

**版本**：v1.0（2026-05-09）
**對應 branch**：`feat/i18n-scaffold`
**狀態**：Active — scaffold 已上 dev

---

## 1. 背景

V1.0 範圍原本不含 i18n（[[_flows-bdd-test/v-model-right/E7x--test-plan-and-readiness#42-前端-ui-缺口|E7x §4.2]] 列為 ❌），但與深色模式（commit `098caa3`）、通知 channel 抽象層（`6ea4802`）相同，採「**範圍外提前做 scaffold**」策略：

- 為什麼提前：基礎設施類功能（provider + toggle + JSON message store）做完後，**漸進遷移近 0 邊際成本**；如果等到「真有客戶要 en」時才開工，會被擋在客戶整合期。
- 為什麼不全量：41 頁全量字串抽 keys 是 ~3-5 dev-day，但 V1.0 沒有 en 客戶，做完後字串會 rot（每次新功能要動到 zh-TW + en 兩份）。

**結論**：本期只做 scaffold + 3 個示範頁（Header / Settings / login 待 follow-up），41 頁字串保持硬編 zh-TW，動到該頁時順手抽 keys。

---

## 2. 技術選型

### 2.1 候選比較

| 方案 | 優點 | 缺點 | 結論 |
|------|------|------|------|
| **next-intl** | 業界標準、ICU MessageFormat、SSR、URL routing | 新 npm dep；middleware 設定；41 頁要全部走 namespace；admin tool 沒 SEO 需求；URL routing 會破 41 條既有路徑 | ❌ 過度工程 |
| **next-i18next** | 老牌成熟 | App Router 支援差（pages router focused） | ❌ 不適用 |
| **react-i18next** | 生態最大、外掛多 | 需手動整合 SSR；沒專屬 Next.js 整合 | ❌ 沒對齊本專案 |
| **DIY（context + JSON）** | 0 npm dep；鏡像 ThemeProvider；漸進採用；hook 形狀可對齊 next-intl | 缺 ICU；缺 lazy loading；缺 SSR 預載入 | ✅ **採用** |

### 2.2 為什麼 DIY 是當前最對的選擇

- **無 SEO 需求**：admin dashboard 在登入後使用，URL routing 多語系（`/en/dashboard`）反而徒增複雜度
- **零依賴**：對齊深色模式 / 通知抽象層的「無新 npm package」基調
- **形狀相容遷移路徑**：`useTranslations(namespace)` API 與 next-intl 完全相同，**未來真要換只需改 provider 內部**，components callsite 零改動
- **JSON 簡單**：兩個 < 5 KB JSON 檔內聯到 bundle（gzipped 後 < 2 KB），沒 lazy loading 反而更快（admin tool 用戶會用所有頁）

### 2.3 何時遷移至 next-intl

觸發條件（任一）：

1. 第一個 en-only 客戶上線，且需要 plurals / 數字 / 日期格式化（"You have 5 orders" → "You have one order"）
2. 需要 SEO（公開消費者頁面如 `/track/[token]`、`/scope-change/[token]`）
3. 加第三個語系（zh-CN / ja），需要 lazy loading 避免 bundle 膨脹

遷移工作集中於：

- `LocaleProvider.tsx` → 換成 `NextIntlClientProvider`
- `lib/translate.ts` → 移除（next-intl 內建）
- `messages/*.json` → 結構不變，next-intl 直接吃同款 nested namespace JSON
- **`useTranslations("namespace")` callsite 零改動**（這是 DIY 形狀對齊 next-intl 的設計目的）

---

## 3. 架構

```
src/i18n/
├── config.ts                   # 支援語系 + 型別 + storage key
└── messages/
    ├── zh-TW.json              # 預設語系
    └── en.json                 # 第二語系（同款 nested namespace 結構）

src/components/i18n/
├── LocaleProvider.tsx          # context + localStorage + html.lang 同步
└── LocaleToggle.tsx            # icon（Header）/ segmented（Settings）兩變體

src/lib/translate.ts            # 純函式 lookup（React 外可用）
```

### 3.1 Provider 嵌套

```tsx
// app/layout.tsx
<ThemeProvider>          // 最外：影響色票，最早套用
  <LocaleProvider>       // 設定 html.lang，screen reader / 字型 fallback 需要
    <ToastProvider>      // 內：登入畫面也能用 toast；t() 透過 Locale context
      <AuthGuard>{children}</AuthGuard>
    </ToastProvider>
  </LocaleProvider>
</ThemeProvider>
```

### 3.2 Hook API

```tsx
import { useTranslations } from "@/components/i18n/LocaleProvider";

const t = useTranslations("settings.profile");
<span>{t("displayName")}</span>                    // → "顯示名稱" / "Display name"
<span>{t("greeting", { name: "Alice" })}</span>    // → "Hello Alice"（{name} 占位符）
```

支援的占位語法：`{name}`（簡單字串替換）。**不支援** ICU 複數（`{count, plural, ...}`）— 真需要時遷移 next-intl。

### 3.3 缺 key 行為

```
1. 找 currentLocale → 有則用
2. fallback DEFAULT_LOCALE → 有則用
3. 都沒有 → 回傳 path 字串本身（"settings.foo.bar"）
```

回傳 path 而非空字串：在 UI 直接看到 `settings.foo.bar` 比看到空白好 debug；CI 可掃 component output 抓出未翻譯 key。

---

## 4. 與 ThemeProvider 模式對齊

| 維度 | ThemeProvider | LocaleProvider | 同/異 |
|------|---------------|----------------|------|
| Storage key | `localStorage("theme")` | `localStorage("locale")` | 同 |
| 預設值 | `"system"` | `"zh-TW"` | 異（locale 沒「跟系統」概念） |
| Mount 前同步邏輯 | inline FOUC script set `[data-theme]` | 無 | 異（見下） |
| HTML attribute 動態同步 | `data-theme` | `lang` | 同概念 |
| Toggle UI 變體 | icon（Header）/ segmented（Settings） | icon / segmented | 同 |
| 三選 / N 選 popover 自寫 | ✅ | ✅ | 同 |

**為什麼 locale 沒做 inline FOUC script**：theme 切換閃白會被注意到（RGB 視覺差大）；locale 切換看到 zh-TW 字 ~50ms 才換 en，認知上是「載入完成」而非「閃爍」。admin tool 只在登入後使用，不投資 SSR-aware 解法。如果未來要做訪客端公開頁（`/track/[token]`、`/scope-change/[token]`），可以個別頁面加 SSR locale 解析。

---

## 5. 遷移工作流

### 5.1 加新語系（如 zh-CN / ja）

1. 在 `messages/` 加新 JSON 檔（鏡像 `zh-TW.json` 結構）
2. 在 `i18n/config.ts` 的 `LOCALES` 陣列加一筆
3. 更新 `lib/translate.ts` 的 `MESSAGES` map（import + 註冊）
4. 完成 — UI 切換器自動列入新選項

### 5.2 加新翻譯 key（漸進遷移）

1. 在 `messages/zh-TW.json` 加 key（**所有 locale 必須結構同步**）
2. 同步加到 `en.json`（即使先 fallback 也須建好結構，避免 future PR 漏抽）
3. 在 component 用 `t("path.to.key")` 讀取

### 5.3 整頁字串抽 keys（每次動到該頁時順手做）

範例（settings 頁本期已示範）：

1. import `useTranslations`
2. 把所有硬編字串改為 `t("namespace.key")`
3. 把字串收進 `messages/zh-TW.json` + `messages/en.json`
4. 視覺驗證兩語系切換正常（手動切 LocaleToggle）

**禁止**：開單獨 PR 做 mass extraction，會造成大 diff 但無業務價值。

---

## 6. 範圍與限制

### 6.1 V1 scaffold 涵蓋

- ✅ Header（搜尋框 placeholder / aria-label）
- ✅ Settings 頁（4 tabs / Profile / Security / 共用按鈕）
- ✅ LocaleToggle / ThemeToggle a11y label

### 6.2 未涵蓋（41 頁中其餘 ~38 頁）

- 字串仍硬編 zh-TW
- 不影響 V1.0 上線（所有用戶仍預設 zh-TW）
- 漸進遷移：每次動到該頁時順手抽

### 6.3 已知限制

| 限制 | 影響 | 緩解 |
|------|------|------|
| 無 ICU MessageFormat | 不能做複數 / 性別變化 | 遷移 next-intl 時解決；目前無業務需求 |
| 無 SSR locale 解析 | 首屏可能閃 ~50ms zh-TW 才切到 en | admin tool 已登入用戶，不影響使用體驗 |
| 無 lazy loading | 兩 JSON 檔內聯（< 5 KB 各） | 加第三語系時評估；目前 bundle 影響 < 2 KB gzipped |
| 字串可能 rot | 41 頁中只有 3 頁有 keys，新 key 需手動同步兩語系 | scaffold README 強調 `messages/*.json` 結構同步原則 |

---

## 7. 驗證

```bash
# Type check
cd web && npx tsc --noEmit

# 確認 LocaleToggle 在 Header / Settings 渲染
cd web && npm run dev
# 開 http://localhost:3000/settings → 切換語系 segmented toggle
# Header 右上角 Languages icon → 切換語系 popover

# 確認 html.lang 動態切換
# 在 DevTools console:
document.documentElement.lang  // 應該反映當前 locale
```

---

## 8. 版本紀錄

| 日期 | 版本 | 變更 |
|------|------|------|
| 2026-05-09 | v1.0 | 初版 — DIY scaffold（鏡像 ThemeProvider 模式）+ Header / Settings 示範 + ADR |
