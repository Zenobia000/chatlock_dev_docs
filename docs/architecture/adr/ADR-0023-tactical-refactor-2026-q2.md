---
id: ADR-0023
title: Tier 1 戰術級資料夾與整合層重構（2026 Q2）
status: superseded
date: 2026-05-11
deciders: [Tech Lead, Architect]
legacy_id: null
supersedes: []
superseded_by: [ADR-0024]
related:
  - "./ADR-0024-tier1-refactor-revised.md (修正版，已取代本 ADR)"
  - "../5-views/VIEW-0004-project-structure.md"
  - "../0-principles/PRIN-0001-product-principles.md"
  - "./module-boundary/ARCH-0002-module-boundary-agent.md"
  - "./module-boundary/ARCH-0003-module-boundary-api.md"
  - "./module-boundary/ARCH-0004-module-boundary-web.md"
  - "./module-boundary/ARCH-0005-module-boundary-data-pipeline.md"
  - "../4-exploration/WBS-0002-2026-q2-tactical-refactor.md"
---

> 
> **🔄 Migration Status (2026-05-28)**: `HISTORICAL`
> **Reviewed against**: 2026-05-20 final spec (xlsx)
> **Reviewed on**: 2026-05-28
> **Per ADR-0100 §1 classification** (.claude/context/devteam/meetings/2026-05-27-1130-final-spec-migration-strategy/MoM.md)


# ADR-0023 — Tier 1 戰術級資料夾與整合層重構（2026 Q2）

> ⚠ **本 ADR 已被 [ADR-0024](./ADR-0024-tier1-refactor-revised.md) 取代** — 詳見本檔 §8 變更紀錄
> 本 ADR 保留作為決策足跡，所有實際執行依 ADR-0024。

## Status

**Superseded** by ADR-0024 (於 2026-05-11，merge 後 30 分鐘 hands-on 驗證發現 4/5 訊號處方不合理 + 3 處事實錯誤)

> 本決策對應 Tier 1 架構審查結果。決策原始計畫文件路徑：
> `~/.claude/plans/home-sunny-python-workstation-github-sm-snuggly-cascade.md`

## Decision

**保留** 6-tier docs 結構與 4 大 first-class 模組邊界（agent / api / web / data）**不動**；
**執行** 5 個戰術級改進（不破壞既有結構），分 5 個 Phase 漸進交付。

---

## 1. 背景與問題

### 上下文

repo 目前已具備 Tier 1 架構成熟度的多項訊號：

- 文檔治理為 6-tier 結構（`docs/0-principles/` ~ `docs/5-views/`），對應 Tier 0 不變憲法 → Tier 5 衍生視圖
- 契約驅動已就位：`docs/2-contracts/api/openapi.yaml`（5890 行）+ `asyncapi.yaml`，自動產出 `api/models/generated.py` 與 `web/types/api.generated.ts`
- 四大模組邊界由 `docs/1-decisions/module-boundary/{agent,api,data-pipeline,web}.md` 鎖定
- Flow ID 系統（BF / SF / FR / ADR / UF）跨代碼、文檔、測試、PR 統一引用
- 架構紀律有 `reverse-import-lint.yml` 強制 import 方向
- harness 已重構為 *thin coordinator*（`agent/harness/orchestrator.py`），邏輯散在 11+ sibling modules

### 問題

但有 **5 個 Tier 1 訊號** 在 V2.0 派工/帳務上線、V3 多租戶/多通道擴展、團隊擴大三股驅動力下會變成痛點：

| # | 訊號 | 痛點 | 主要驅動力 |
|---|------|------|-----------|
| S1 | `web/src/` 缺 `api/` + `hooks/` 層 | 52 個 page.tsx 直接 import `lib/api.ts`；每 component 重複 loading/error/cache 邏輯；無 domain hooks | 團隊擴大、易讀性 |
| S2 | harness 是 module-level wiring 而非 registry | `orchestrator.py` 用 module-level state；V2.0 新增 dispatch/refund 層需直接改 orchestrator | V2.0 上線、技術債 |
| S3 | 頂層雜訊 + legacy 殘留 | `CLAUDE_TEMPLATE.md` 在 root；`report/` 等執行時產物路徑未統一；`api/data/` 與 `agent/storage/` 命名不一致 | 易讀性、新人 onboarding |
| S4 | Tier 5 自動化未完成 | `docs/5-views/VIEW-0004-project-structure.md` 標 AI-AUTO 但實際 manual；檔內第 29-30 行兩條 `docs/` 重複（bug） | 技術債、文檔可信度 |
| S5 | 跨模組整合層缺索引 | `docs/2-contracts/flows/BF-*` 沒有直接連結到 OpenAPI operationId；FR ↔ Flow ↔ API ↔ Page 需手動串 | V3 多通道擴展 |

### 驅動因素 / 約束

- **驅動**：V2.0 派工/帳務上線（Phase 5-8 進行中）、V3 多租戶/多通道規劃、團隊擴大
- **約束 1**：Flow ID 命名空間已被數千個 PR / commit / FR 引用，不可改命名
- **約束 2**：`docs/2-contracts/` 路徑被 37 個 routers + CI pipeline 鎖定，不可改頂層
- **約束 3**：ADR-0010 已拍板 Shared DB + RLS（多租戶不需資料夾重組）
- **約束 4**：`uv workspace` 已穩定，不引入 Nx / Turborepo

---

## 2. 考量的選項

### 選項一: 戰術級調整（**選定**）

- **描述**：保留 6-tier 文檔 + 四大模組邊界，5 個改進均為「新增」或「局部歸位」，不破壞既有路徑
- **優點**：低風險、ROI 高、每項可獨立 PR、可獨立 revert；支持 V2.0/V3 擴展
- **缺點**：跨模組整合層仍散落（S5 僅做索引，不做程式碼層集中）
- **成本/複雜度**：中（2-3 週，1 名熟悉 codebase 工程師全職）

### 選項二: 中等重組

- **描述**：前後端共用 schema 抽出獨立 `contracts/` 頂層；harness plugin 化；agent/api/web/data 共用型別與 DTO 集中
- **優點**：整合層集中、未來新增模組更乾淨
- **缺點**：破壞既有路徑、需大量 PR 拆解；import path 全面變動會打亂 CI 與 review
- **成本/複雜度**：高（2-3 個月，需 2-3 名工程師）

### 選項三: 全面 monorepo 重組（Nx / Turborepo）

- **描述**：頂層改 `apps/` + `packages/` + `libs/`，引入 monorepo build tool
- **優點**：擴展模組時邊際成本最低
- **缺點**：與現有 `uv workspace` 衝突、breaking CI、Python/TypeScript 雙語 monorepo 工具支援有限
- **成本/複雜度**：極高（1-2 個月、會打破所有現有部署腳本）

---

## 3. 決策

**選擇**：選項一（戰術級調整）

**理由**：

1. **不動成熟結構** —— 6-tier docs 與 4 大模組邊界已是業界最佳實踐，無需重組
2. **改造而非革命** —— 5 項改進都是「新增層」或「局部歸位」，既有引用零中斷
3. **ROI 配比** —— 每項可在 0.5-1 週交付，立即解 V2.0 上線時的擴展痛點
4. **降低風險** —— 每項獨立 PR、獨立 revert；harness pipeline 切換採 staging 1 週 + dark launch

---

## 4. 後果

### 正面

- V2.0 工程師新增 harness 層只需動 `config.toml`，不需改 orchestrator
- web 頁面新增/變更時，loading/error/cache 邏輯收攏在 hooks 層，平均減少 30-50 行 component 碼
- Tier 5 文件自動化後，`project-structure.md` 不再過期
- 跨模組整合（Flow ↔ API ↔ Page）有單一 INDEX，新人 onboarding 路徑清晰

### 負面

- 5 Phase 共需 8-10 個 PR、跨 2-3 週
- Phase 3（harness pipeline）為最高風險點 —— 需 staging 1 週才合 main
- 短期內 web 會出現「新舊兩種 API 呼叫風格並存」（漸進遷移特性）

### 影響範圍

| 模組 | 影響 |
|---|---|
| `agent/` | Phase 3 新增 `harness/pipeline.py` + `harness/context.py`；`orchestrator.py` 改寫；`config.toml` 新增 `[harness.pipeline]` |
| `api/` | Phase 1.1 `api/data/` → `api/storage/`（含 deploy script + docker-compose 同步） |
| `web/` | Phase 2 新增 `src/api/` + `src/hooks/`；引入 SWR 依賴 |
| `docs/` | Phase 0 新增 ADR-0023/ADR-0024、wbs-2026-q2；Phase 1.2 修 project-structure.md generator；Phase 4 新增 `flows/INDEX.md` |
| `scripts/ci/` | Phase 1.2、4 新增 regen 腳本 |
| `.github/workflows/` | Phase 1.2 新增 `regen-docs.yml`；Phase 4 新增 `flow-index-sync.yml` |
| 部署腳本 | Phase 1.1 `api/data/` 改名需同步 `scripts/deploy/api.sh`、docker-compose、Cloud Run secrets |

### 重新評估觸發

| 觸發條件 | 動作 |
|---|---|
| V3 啟動且決定走非 Shared-DB 多租戶 | 重新評估是否拉出 `contracts/` 頂層 |
| 新增第 5 個 first-class 模組（如 mobile/） | 重新評估是否走 monorepo |
| harness pipeline migration 後 6 個月內無新層加入 | 視為 over-engineering，考慮回退至 module-level |

---

## 5. 執行計畫

詳見 [`../4-exploration/WBS-0002-2026-q2-tactical-refactor.md`](../4-exploration/WBS-0002-2026-q2-tactical-refactor.md)。

5 個 Phase 摘要：

| Phase | 內容 | 工作量 | 風險 |
|---|---|---|---|
| **0** | 本 ADR + WBS + CHANGELOG（純文檔） | 0.5 天 | 無 |
| **1.1** | 頂層雜訊清理 + `api/data/` → `api/storage/` | 1 天 | 低（需改部署腳本） |
| **1.2** | `project-structure.md` 自動生成器 + Makefile + CI 排程 | 1 天 | 低 |
| **2** | `web/src/api/` + `web/src/hooks/` + SWR；work-orders pilot → 7 個 domain 漸進遷移 | 1 週 | 中（多 PR） |
| **3** | harness declarative pipeline（dark launch → 3 layer pilot → 全面遷移） | 1 週 + staging 1 週 | **高**（agent 行為變更） |
| **4** | `docs/2-contracts/flows/INDEX.md` 自動生成器 + CI gate | 半週 | 低 |

Phase 1、2 與 Phase 3 可平行（不同工程師、不同模組）。
Phase 4 必須在 Phase 2 完成後（依賴 web routes metadata）。

---

## 6. 開放問題已拍板

於 2026-05-11 PM Q&A：

| Q | 拍板 |
|---|---|
| `web_design_spec_prompt_pipeline/` 處置 | **保持原狀**；僅在 `project-structure.md` 加註 `legacy - DO NOT USE` |
| Phase 2.2 data fetching lib | **SWR**（輕量、與既有 `lib/cache.ts` 模型一致） |
| `api/data/` → `api/storage/` 改名 | **納入 Phase 1.1** 一併處理（含部署腳本同步） |
| Phase 3 全面遷移是否需 staging | **需要 staging 1 週**；Phase 3.3 PR 通過 + dev 分支跑 quality_check + evals 連續 7 天零退化才 merge |

---

## 7. 不在本決策範圍

- ❌ Monorepo 化（Nx / Turborepo） —— `uv workspace` 已夠用
- ❌ 6-tier 文檔結構重組 —— 已成熟
- ❌ `docs/2-contracts/` 頂層化為 `/contracts/` —— 會破壞數千個引用
- ❌ Flow ID 命名空間重組 —— 同上
- ❌ V3 多租戶 schema 隔離 —— ADR-0010 已拍板 Shared DB + RLS
- ❌ agent/api/web/data 四大模組合併或拆分 —— module-boundary 文件已 lock

---

| 日期 | 審核人 | 備註 |
| :--- | :--- | :--- |
| 2026-05-11 | Tech Lead / Architect | 初版 — 對應 Q2 戰術級重構計畫 |
| 2026-05-11 | Tech Lead / Architect | Superseded by ADR-0024 (hands-on 修正版) |

---

## §8 變更紀錄 — 為何被 supersede

本 ADR merge 後（PR #62，commit `87e77e3`）進入 Phase 1.1 hands-on 階段，於 grep 真實 reference 與讀檔內容後發現多處基於假設而非事實的判斷。詳見 [ADR-0024 §1-§3](./ADR-0024-tier1-refactor-revised.md)。

**摘要：**

| 類別 | 數量 | 例子 |
|---|---|---|
| 處方誤判 | 4/5 訊號 | `report/` 不是垃圾、`api/data` 命名類比錯誤、harness 過度設計、Tier 5 自動化 ROI 不對 |
| 事實錯誤 | 3 處 | ADR-0010 懸空引用、UF flow 系統未實作、`api/agent/integrations/` 空目錄未提及 |
| 工期估計 | 偏差 2-3x | 原 2-3 週 → 實際 1 週內 |

**仍有效的部分**：6-tier docs 與 4 大模組邊界保留不動的核心結論成立。修正主要在「執行處方」而非「審查結論」。

**保留本 ADR 不刪的理由**：開源協作慣例 — 決策歷史不可改寫；新人可從 ADR-0023 → ADR-0024 看見「假設驅動 → hands-on 驗證」的學習過程。
