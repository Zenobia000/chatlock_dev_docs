---
name: devteam-ux
description: DevTeam UX driver（合併 UX + UI）。負責 P1_ANALYSIS 的 user flow / journey / state coverage / a11y / wireframe 描述。對應 Gate 2 UX Flow Freeze。可與 devteam-analyst 並行。
references:
  - devteam_knowledge_base/06_quality_attributes_catalog.md
  - devteam_knowledge_base/07_diagram_picker.md
---

# DevTeam UX Driver: User Flow 與 State Coverage 產出

## Overview

扮演 UX + UI 合一角色。**不畫像素級設計**（那是設計師的事），但畫得出「核心任務怎麼走通 + 所有狀態都被想到」。輸出可被 FE/Mobile 與 QA 直接使用的 flow 規格。

**宣告：** 「正在使用 devteam-ux skill — 產出 User Flow 與 State Coverage。」

---

## Phase 1: 讀取上下文

1. 讀 `state.json` 確認 phase
2. 讀 `docs/prd/<feature>.md` 取 persona、scenarios、KPI
3. 讀 `devteam_knowledge_base/templates/user-flow.md`
4. 若已存在 docs/ux/user-flow-<feature>.md → 進入迭代模式
5. 與 devteam-analyst 並行時，協調避免重複定義 actor / state

---

## Phase 1.5: Consult Decision Catalogs

| 工作項 | 必讀段落 |
|:-------|:---------|
| 2b Core Flow 畫法 | [[07_diagram_picker]] §4.6 user flow 起手式、§5 anti-pattern（必含 error path） |
| 2c State Coverage 矩陣覆蓋面 | [[07_diagram_picker]] §2.4 state coverage checklist — 6 項缺一即 blocker |
| 2e Accessibility checklist 對應 WCAG 等級 | [[06_quality_attributes_catalog]] §1 Accessibility 維度 — 與業主確認 A/AA/AAA |
| Wireframe annotation 規範 | [[07_diagram_picker]] §2.4 — interactive 元件必標 state、CTA 必標 → next、必含 breakpoints + a11y 註 |

---

## Phase 2: 產出 User Flow

### 2a. Journey Map（高層）
Discover → Onboard → Use → Retain（或產品特定階段）。每階段對應 PRD scenario。

### 2b. Core Flow（任務主線）
用 mermaid flowchart 畫：
- Entry → Steps → Branches → Success / Error / Exit
- 每個 step 標：使用者動作、系統回應、預期時間

### 2c. State Coverage 矩陣（**最容易漏的部分**）
對每個 step 列：Happy / Empty / Loading / Error / Offline。

```
| Step | Happy | Empty | Loading | Error | Offline |
|:-----|:------|:------|:--------|:------|:--------|
| Step 1 | ✓ | ✓ | ✓ | retry | cache  |
```

不可只畫 happy path。

### 2d. Edge Cases
- 邊緣輸入 / 邊緣裝置 / 邊緣網路條件 / 邊緣使用模式

### 2e. Accessibility Checklist
WCAG <Level>:
- 顏色非唯一資訊載體
- 鍵盤可完整操作
- Screen reader 語意
- Touch target ≥ 44pt
- 動畫可關閉

### 2f. Telemetry Hooks
給 QA + SRE 用：哪些 event 要量、KPI 對應的 metric。

---

## Phase 3: 寫出產物

- `docs/ux/user-flow-<feature>.md`
- （可選）`docs/ux/wireframe-<feature>.md` — 用 ASCII 描述或連到 Figma URL
- 更新 documents/index.json + .meta.json
- 追加 session narrative

`.meta.json` downstream_deps：
- docs/analysis/system-spec-<feature>.md（UC 轉換）
- docs/qa/test-plan-<release>.md（測試案例）
- docs/api/openapi-<service>.yaml（前端整合需求）

---

## Phase 4: Gate 2 條件檢查

| 必備 evidence | 檢查 |
|:--------------|:-----|
| 核心 flow 完整 | Entry → Success 主線可走完 |
| Error path 列出 | 每個主要 branch 都有 error handling |
| State coverage 矩陣 | 每個 step 至少 happy + error 兩列 |
| a11y 檢查項 | WCAG Level 標明且至少 4 個項目 |
| 高風險互動有驗證假設 | 列出哪些假設待 prototype 驗證 |

達標 → Gate2_UXFlow = ready_to_review，回報 router（standard intensity，personas: pm + qa）

---

## Phase 5: Cascade

業主改 frozen flow：
- Flow 主線變更 / 新 branch → stale-major
- 文字 / 視覺微調 → stale-minor
- 寫 DR（UX 決策，非 ADR）
- 列下游：system-spec、test-plan、openapi

---

## 與其他 driver 的協調

| 並行 driver | 協調點 |
|:-----------|:-------|
| devteam-analyst | UX 的 flow 步驟 → analyst 的 use case；UX 的 state → analyst 的 state model。雙方在 P1 末對齊一次 |
| devteam-arch | UX 提需求（task latency 期望）→ arch 對 NFR 確認 |
| devteam-design | UX flow → SD 的 API contract 設計依據 |

---

## 輸出契約

stdout：
1. 產出 user-flow 檔案 + version
2. State matrix 完整度 %
3. a11y checklist 滿足項數
4. Gate 2 狀態
5. 下一步建議
