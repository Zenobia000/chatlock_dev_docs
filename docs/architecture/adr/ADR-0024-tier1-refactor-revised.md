---
id: ADR-0024
title: Tier 1 戰術級重構（2026 Q2）— hands-on 修正版
status: accepted
date: 2026-05-11
deciders: [Tech Lead, Architect]
legacy_id: null
supersedes: [ADR-0023]
superseded_by: []
related:
  - "./ADR-0023-tactical-refactor-2026-q2.md (初版，已 superseded)"
  - "../5-views/VIEW-0004-project-structure.md"
  - "../0-principles/PRIN-0001-product-principles.md"
  - "../4-exploration/WBS-0002-2026-q2-tactical-refactor.md (同步修正)"
---

> 
> **🔄 Migration Status (2026-05-28)**: `HISTORICAL`
> **Reviewed against**: 2026-05-20 final spec (xlsx)
> **Reviewed on**: 2026-05-28
> **Per ADR-0100 §1 classification** (.claude/context/devteam/meetings/2026-05-27-1130-final-spec-migration-strategy/MoM.md)


# ADR-0024 — Tier 1 戰術級重構（2026 Q2）— hands-on 修正版

## Status

**Accepted** (拍板於 2026-05-11)；**Supersedes ADR-0023**

---

## §1 為何 supersede ADR-0023

ADR-0023 於 2026-05-11 PR #62 merge 後 30 分鐘進入 Phase 1.1 hands-on 階段，於 grep 真實 code reference 與讀檔內容後發現：

| 發現 | 影響 |
|---|---|
| `report/` 內含 95 個 `v1.x.x.md` release notes（非執行期垃圾） | 原 plan 「加 .gitignore + 移 .dev-logs」**錯誤** |
| `api/data/` 已正確對應 `agent/data/`（runtime data 軸） | 原 plan 「對齊 agent/storage」基於**命名類比錯誤** |

繼而派 3 個 Explore agent 對 ADR-0023 全部 5 訊號做 **hands-on 深度驗證**（讀實際 page.tsx、orchestrator.py、project-structure.md、flow 檔案、`.github/workflows/`），發現：

- **5 個訊號中 4 個處方不合理或過度設計**（詳見 §3）
- **ADR-0023 內文 3 處事實錯誤**（詳見 §2）
- 整體工期估 **2-3 週 → 1 週內**

依「決策必須建立在事實上、不可在錯誤前提上累積技術債」原則，supersede ADR-0023 並改採此修正版。

> **保留 ADR-0023 的部分仍有效**：6-tier docs 與 4 大模組邊界保留不動的核心結論成立；hands-on 修正主要在「執行處方」而非「審查結論」。

---

## §2 ADR-0023 三處事實錯誤的處理

| # | 錯誤 | 證據 | 處理 |
|---|---|---|---|
| E1 | ADR-0023 §約束3、§範圍引用「ADR-0010 已拍板 Shared DB + RLS」 | `ls docs/1-decisions/ADR-*.md` 無 ADR-0010（跳號） | 本 ADR 移除引用；多租戶方案改為「待 V3 開新 ADR 拍板」 |
| E2 | ADR-0023 §1 稱「BF/SF/FR/ADR/**UF** 統一引用」 | `find . -name "UF-*.md"` 無檔案 | 本 ADR 標明 UF 系統「規劃中、未實作」；不列入既有 ID 系統 |
| E3 | ADR-0023 未提及 `api/agent/integrations/` 是空目錄 | `ls api/agent/integrations/` 顯示 0 個檔 | 列入 Phase 2' backlog：確認後刪除（或補 README 說明保留原因）|

另：ADR-0023 §5.3「staging 7 天零退化」無自動化機制 — 本 ADR Phase 4' 補上具體驗證腳本路徑。

---

## §3 五個訊號 hands-on 驗證結果與修正處方

> 驗證方法：3 個 Explore agent 平行 hands-on 讀實際 code、grep 真實引用、計數真實檔數。

### S1 — `web/src/` 缺整合層

| 維度 | ADR-0023 原述 | hands-on 發現 |
|---|---|---|
| page.tsx 總數 | 52 | **61** |
| 直接 import api | 所有 | **13/61** |
| `lib/cache.ts` | 不存在 | **已存在**：30s staleTime + promise dedup、已整合 `lib/api.ts` L22 |
| 既有 hooks | 無 | **`lib/useSSEChannel.ts`**、**`lib/useBroadcast.ts`**、**`lib/useRealtimeChannel.ts`** 已存在 |
| setLoading/setError 重複 | 質性描述 | **340 次**（量化）|

**修正處方**：
- ❌ **不**新增 `web/src/api/` 層（cache + thin client 已存在於 `lib/`）
- ❌ **不**引入 SWR（`lib/cache.ts` 已具備 staleTime + dedup）
- ✅ 移既有 `lib/use{SSE,Broadcast,RealtimeChannel}.ts` 到 `web/src/hooks/` 統一位置
- ✅ 新增 `web/src/hooks/usePaginatedFetch.ts`（提煉 setLoading/setError + error envelope 共用）
- ✅ 改寫 **13 個** 直接 import api 的 page.tsx（不是 52 個）

**工期**：原 1 週 → **1-2 天**

---

### S2 — harness 缺 registry

| 維度 | ADR-0023 原述 | hands-on 發現 |
|---|---|---|
| module-level state | 11 | **8 個**（`_agent`, `_config`, `_templates`, `_profile_mgr`, `_audit_storage`, `_opik_tracer`, `_pending_store`, `_get_system_prompt`, `_get_conversation_id`）|
| V2.0 派工/帳務 → harness 層 | 假設「需直接改 orchestrator」 | **dispatch/refund 實際在 `api/services/`**（dispatch_service.py、refund_service.py 已存在 6+ 個月），**不在 harness** |
| 新增 harness 層案例 | 假設常見 | 近半年僅 `pc_creator.py` (H_PC) 加入；走「新 module + orchestrator 改 1 行」 |
| declarative pipeline ROI | 假設高 | **過度設計** — protocol + config + dark launch + 3 layer pilot + staging 1 週，遠超 V2 實際需求 |

**修正處方**：
- ❌ **不**做 declarative pipeline（config-driven + dark launch + 3 phase migration）
- ❌ **不**新增 `agent/harness/pipeline.py` + `context.py`
- ❌ **不**修改 `agent/config.toml` 加 `[harness.pipeline]`
- ✅ **簡化**：在 `agent/harness/__init__.py` 加 `PIPELINE = [safety_gate, data_correction, quick_reply, intent_handler, skills_prefix, validator_pipeline, profile_updater, pc_creator, memory_manager, agent_audit]` 清單常數
- ✅ `agent/harness/orchestrator.py` `agent_and_reply()` 改 `for layer in PIPELINE: await layer.apply(ctx)`
- ✅ 各 sibling module 補 `async def apply(ctx)` 介面（包現有邏輯）
- ✅ staging 1 週仍保留（agent 行為變更，風險仍在）

**工期**：原 1 週 + staging 1 週 → **2-3 天 + staging 1 週**

---

### S3 — 頂層雜訊 + legacy 殘留

| 項目 | ADR-0023 原述 | hands-on 發現 |
|---|---|---|
| `CLAUDE_TEMPLATE.md` | 應搬 `.claude/` | 是「使用者初始化範本 v4.1」（user-facing），root 位置使 SessionStart hook 更易定位；**搬家會降低首次 onboarding 可見性** |
| `report/` | runtime 產物、加 .gitignore | **95 個 `v1.x.x.md` release notes**，是版控內容 |
| `api/data/` 改名 | 對齊 `agent/storage/` | **命名類比錯誤**：對齊軸應是 `agent/data ↔ api/data`（runtime），命名已對齊 |
| `web_design_spec_prompt_pipeline/` | 保持原狀 | 確實 legacy（無 active 引用），但 root 留著造成新人困惑 |
| `.hypothesis/` `.pytest_cache/` | 未提及 | **未 gitignored 但 git ls-files 無結果**（漏網雜訊）|

**修正處方**：
- ❌ **不**搬 `CLAUDE_TEMPLATE.md`（保留 root）
- ❌ **不**動 `api/data/` 命名
- ❌ **不**動 `report/` 內容（但搬位置）
- ✅ 搬 `report/` → `docs/1-decisions/releases/`（內容性質正確歸位）+ 更新 `.gitignore` / hook / CLAUDE.md 中引用
- ✅ 搬 `web_design_spec_prompt_pipeline/` → `docs/_archive/legacy/web_design_spec_prompt_pipeline/`（明確 legacy 標記）
- ✅ `.gitignore` 補 `.hypothesis/`、`.pytest_cache/`
- ✅ 確認 `api/agent/integrations/` 空目錄處理（E3 處理）

**工期**：原 1 天 → **1-2 小時**

---

### S4 — Tier 5 自動化未完成

| 項目 | ADR-0023 原述 | hands-on 發現 |
|---|---|---|
| `project-structure.md` 重複 `docs/` bug | 第 29-30 行 | **CONFIRMED**（第 30 行縮排不同，明顯筆誤）|
| Tier 5 文件數 | 假設多份 | `docs/5-views/` 共 5 檔（`project-structure`、`class-relationships`、`file-dependencies`、`frontend-route-map`、`traceability-matrix`），**只有 1 份**標 AI-AUTO |
| 自動化 ROI | 假設高 | **低**：全檔 133 行中僅 20 行（統計 + tree）需 regen；其餘 113 行是穩定結構描述 |
| Plan 處方 | generator script + Makefile + CI workflow（150+ 行新 code）| **過度設計** |

**修正處方**：
- ❌ **不**新增 `scripts/ci/regen-project-structure.sh`
- ❌ **不**新增 `Makefile` target `docs-regen`
- ❌ **不**新增 `.github/workflows/regen-docs.yml`
- ✅ **3 行修正**：
  - 修 `project-structure.md` 第 30 行重複 `docs/` bug
  - frontmatter `generator: manual (sunnydata-auto-regen TBD)` → `generator: manual`（移除 AI-AUTO 旗幟）
  - 加 `last_updated: 2026-05-11`

**工期**：原 1 天 → **30 分鐘**

---

### S5 — 跨模組整合層缺索引

| 項目 | ADR-0023 原述 | hands-on 發現 |
|---|---|---|
| BF/SF 引用 operationId 方式 | 假設 frontmatter 結構化 | **內文 markdown 硬編碼**（`openapi#operationId=...`）|
| FR ↔ Flow 連結 | 假設新 BF/SF ID | FR-0005 等仍引用 **legacy F-id**（F-005），未更新 |
| INDEX.md 自動化前置工作 | 0.5 週 | **必須先補所有 BF/SF/FR frontmatter 加 `related_apis: []` 欄位**（25 BF/SF + 25 FR） |
| 實際工期 | 0.5 週 | **1-1.5 週**（含補欄位） |

**修正處方**：拆兩階段
- **5.1**（手工）：補 BF/SF/FR frontmatter `related_apis: []`、`related_pages: []` 欄位 — 3-5 天
- **5.2**（自動）：寫 generator 聚合 frontmatter 產出 `docs/2-contracts/flows/INDEX.md` — 0.5 天

**進入 backlog**：Phase 1-4 完成後重估 ROI，視 V3 多通道擴展時程決定是否啟動。

**工期**：原 0.5 週 → 拆兩階段（5.1: 3-5 天 / 5.2: 0.5 天）；**先進 backlog**

**2026-05-12 ROI 重評估**：Phase 1-4 完成後依本 ADR 排程進行重估，結論 **DEFER**（成本：75 檔手工補 + 高維護負擔 + 與 traceability-matrix.md 重疊；收益：V3 時程不明確、新人痛點未量化）。明確啟動觸發條件（T1-T4）與移除條件（R1-R2）詳見 [`docs/4-exploration/WBS-0004-phase-5-flow-index-backlog-2026-q2.md`](../4-exploration/WBS-0004-phase-5-flow-index-backlog-2026-q2.md)。

---

## §4 修正後總工期

| Phase | 原 ADR-0023 | 本 ADR-0024 |
|---|---|---|
| 0' ADR + WBS + CHANGELOG | 0.5 天 | 0.5 天 |
| 1' Tier 5 修 bug + gitignore | 1 天 | **30 分鐘** |
| 2' 頂層雜訊歸位 | 1 天 | **1-2 小時** |
| 3' web hooks 提煉 | 1 週 | **1-2 天** |
| 4' harness PIPELINE 列表化 | 1 週 + staging | **2-3 天 + staging 1 週** |
| 5' Flow INDEX 兩階段 | 0.5 週 | **進 backlog**（重估 ROI）|
| **總計** | 2-3 週 | **1 週（不含 5'）+ staging 1 週** |

---

## §5 後果（與 ADR-0023 §4 一致，差異標註）

### 正面（修正後）

- V2.0 工程師新增 harness 層只需動 `__init__.py` 的 `PIPELINE` list，不需改 orchestrator（**簡化方案，非 config-driven**）
- web 13 個高重複 page 簡化（不是 52 個）
- Tier 5 文件信號為真（`generator: manual` 而非懸空 TBD 旗幟）
- 頂層歸位後新人 onboarding 路徑清晰（report → docs/releases、legacy → docs/legacy）

### 負面（修正後）

- **不**做 declarative pipeline → 未來多通道擴展時若 PIPELINE 線性結構不足（如需 branching），仍可能要重構
- **不**做 web/src/api/ 層 → 若 hooks 內 fetch 邏輯仍重複，未來可能要二次抽取
- staging 1 週仍保留（harness PIPELINE 切換是行為變更）

### 影響範圍（修正後）

| 模組 | Phase | 變更類型 |
|---|---|---|
| `docs/1-decisions/` | 0' | 新增 ADR-0024；標 ADR-0023 superseded |
| `docs/4-exploration/` | 0' | 更新 wbs-2026-q2-tactical-refactor.md（覆寫，含變更紀錄）|
| `docs/5-views/VIEW-0004-project-structure.md` | 1' | **3 行修正**（不是 generator）|
| `.gitignore` | 1' | 補 `.hypothesis/`、`.pytest_cache/` |
| `docs/1-decisions/releases/`（新）、`docs/_archive/legacy/`（新）| 2' | 接收頂層歸位內容 |
| `report/`、`web_design_spec_prompt_pipeline/` | 2' | git mv（保留歷史）|
| `web/src/hooks/`（新）、`web/src/lib/use*.ts` | 3' | 遷移 + 新增 usePaginatedFetch |
| `web/src/app/**/page.tsx` | 3' | **13 個檔**（不是 52）|
| `agent/harness/__init__.py` | 4' | 加 `PIPELINE` 清單常數 |
| `agent/harness/orchestrator.py` | 4' | `agent_and_reply()` 改迴圈 |
| `agent/harness/{各 layer}.py` | 4' | 補 `async def apply(ctx)` 介面 |
| `api/agent/integrations/` | 2' E3 | 確認後刪或加 README |

**不變更**：`agent/storage/`（code module）、`agent/data/`（runtime）、`api/data/`（runtime）、`CLAUDE_TEMPLATE.md` 位置、`api/services/`、所有 `docs/2-contracts/`。

---

## §6 不在範圍（與 ADR-0023 §7 一致）

- ❌ Monorepo 化（Nx / Turborepo）
- ❌ 6-tier 文檔結構重組
- ❌ `docs/2-contracts/` 頂層化為 `/contracts/`
- ❌ Flow ID 命名空間改動
- ❌ V3 多租戶 schema 隔離（待 V3 開新 ADR）
- ❌ agent/api/web/data 四大模組合併或拆分
- ❌ `api/data/` 改名（ADR-0023 原排，本 ADR 取消）
- ❌ `report/` 加 gitignore（ADR-0023 原排，本 ADR 取消）

---

## §7 重新評估觸發

| 觸發條件 | 動作 |
|---|---|
| V3 啟動且決定走非 Shared-DB 多租戶 | 開新 ADR 拍板 schema 隔離方案（補 ADR-0010 空缺）|
| 新增第 5 個 first-class 模組 | 重新評估 monorepo |
| harness PIPELINE list 出現 branching 需求 | 重新評估 declarative pipeline（本 ADR §3 S2 預留路徑）|
| Flow INDEX backlog 滿 3 個月仍未啟動 | 從 backlog 移除（視為 over-optimization）|

---

## §8 預留 ADR 編號

- **ADR-0025** — 預留給 Phase 4' harness PIPELINE 切換時的決策記錄（原 ADR-0023 預留 ADR-0024，因本 ADR 占用 0024，下移）

## §9 Phase 4' 實作修正紀錄

> 2026-05-11 — Phase 4' hands-on 進入 orchestrator.py 後發現本 ADR §3 S2 的「PIPELINE 清單常數 + for layer in PIPELINE: await layer.apply(ctx) + 各 sibling module 補 apply(ctx) 介面」處方**部分不適用**。

### 發現

`agent_and_reply()` 是 **branching pipeline**：
- 4 個 stage 有 early return (short-circuit)
- 3 個 stage 是 fire-and-forget background
- 各 layer signature 非統一（不同參數組合）

統一 `apply(ctx)` 介面意味著 12+ 欄位 ctx god-object，將原本 explicit short-circuit 改為 implicit flag → 可讀性下降。

### 縮減版實作（與本 §3 S2 原處方差異）

| 項目 | §3 S2 原處方 | 實作 |
|---|---|---|
| `harness/__init__.py` | `PIPELINE = [layer1, ...]` + 各 layer 為 module 物件 | `PIPELINE: tuple[PipelineEntry, ...]` 結構化常數（phase_id, module, description, lifecycle, blocking）作為 doc/introspection |
| 各 sibling module | 補 `async def apply(ctx)` 介面 | 補 `PHASE: str = "..."` 模組層級常數（9 個 layer module） |
| `orchestrator.agent_and_reply()` | 改 `for layer in PIPELINE: await layer.apply(ctx)` | **不變更**（保留既有 branching control flow） |
| staging | 1 週 | **不需要**（零 runtime 變更） |

### 決策記錄

詳見 [ADR-0025](./ADR-0025-harness-branching-pipeline.md) — 「Harness 採 branching pipeline，PIPELINE list 為 introspection-only」。

ADR-0025 拍板的核心理由：
1. **承認 hands-on 發現** — 本 §3 S2 的線性 pipeline 假設基於對 agent_and_reply control flow 的誤判
2. **保留 explicit control flow** — Linus 「good taste」精神：explicit 優於 implicit
3. **doc/introspection 已解 80% 訴求** — 不需 ctx god-object 即可達成「新增 layer 路徑可預測」目標

---

| 日期 | 審核人 | 備註 |
| :--- | :--- | :--- |
| 2026-05-11 | Tech Lead / Architect | 初版 — supersede ADR-0023；基於 hands-on 驗證的修正版 |
