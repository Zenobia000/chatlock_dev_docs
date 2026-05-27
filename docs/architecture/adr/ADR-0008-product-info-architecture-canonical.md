---
id: ADR-0008
title: Agent 知識庫架構以 `product_info/` 為唯一正典（Architecture Lock）
tier: 1
status: Active + partially_superseded_by ADR-0101 (§2.1-§2.4)
date: 2026-05-09
last_updated: 2026-05-28
partially_superseded_by: ADR-0101
partially_superseded_scope: "§1 工具集封閉性 (僅 3 個 static/write tool 不夠涵蓋 UC-new-2 serial→warranty / UC-new-3 project→unit→model / UC-new-1 cross-brand compatibility) + §1 mega-doc 結構維度 (Brand/Model 雙層不夠，缺 Project/Site/Unit 維度) + §5 例外清單 (未涵蓋 multi-tenant data scope governance M14 / BR-M14-01 / G007)"
scope_clarification: "本 ADR 鎖 agent runtime KB (A03/A04 bounded context)，不是 ERP M10 master data。M10 master 為 source of truth，product_info mega-doc 為 derived view。"
module_scope: "A03 Skill-Gated ReAct Agent + A04 RAG Pipeline (interface with M02 / M10 / M14)"
deciders: [Imding1211, "2026-05-13 reinstate 附註: Claude（與 Imding1211 在 hermes-cs 進度回顧時 confirm）", "2026-05-28 PARTIAL_SUPERSEDE annotation: devteam-arch (per ADR-0101)"]
related:
  - "./ADR-0101-product-info-extension-final-spec.md"  # 補 4 個契約段 (§2.1-§2.4)
  - "./ADR-0030-tenant-id-propagation.md"
  - "./ADR-0057-rag-document-retrieval-not-prompt.md"
  - "./ADR-0058-external-knowledge-platform-ingestion-contract.md"
---

> 📝 **PARTIAL_SUPERSEDE BANNER (2026-05-28)**
>
> 本 ADR §1 mega-doc canonical 主體 + §3 反 revert 立場 + §4.1 模組路徑禁區 + §4.4 quality_check baseline **保留 STILL_VALID under A03/A04 bounded context**。
>
> 以下三個段落被 [`ADR-0101 — Agent Knowledge Base × Final Spec Integration Contract`](./ADR-0101-product-info-extension-final-spec.md) §2.1-§2.4 補強 / partially superseded：
> 1. **§1 工具集封閉性** — 「3 個 tool 已足夠」在 UC-new-2 / UC-new-3 不成立；ADR-0101 §2.2 補 dynamic lookup tool (serial→warranty / project→unit→model / cross-brand compatibility)
> 2. **§1 mega-doc 結構維度** — 「Brand/Model 雙層」不夠涵蓋 UC-new-3 (建商戶別反查) + UC-new-1 (cross-brand compatibility)；ADR-0101 §2.3 補 multi-tenant scope + scope filter；ADR-0101 §2.4 補 custom SKU fallback
> 3. **§5 例外清單** — 未涵蓋 multi-tenant data scope governance；ADR-0101 §2.3 補 partner portal 場景過濾規則
>
> **Scope clarification**: 本 ADR 鎖 **agent runtime KB (A03/A04 BC)**，**不是 ERP M10 master data**。M10 master = source of truth；product_info mega-doc = derived view。
>
> **ADR-0100 §1 row 8 module_scope** 從 `M10` 改為 `A03/A04 (interface with M10/M14/M02)`。
>
> **Status 整治**: 不撤回 main / dev 既有 SUPERSEDED 附註（per ⓪a 既有 audit trail），只在 frontmatter / banner 加 partial_supersede 註。
>
> **Lane A critique**: [`docs/governance/reviews/ADR-0008-lane-a-critique-2026-05-28.md`](../../governance/reviews/ADR-0008-lane-a-critique-2026-05-28.md)
> **Per ADR-0100 §1 classification** (.claude/context/devteam/meetings/2026-05-27-1130-final-spec-migration-strategy/MoM.md)


# ADR-008: Agent 知識庫架構以 `product_info/` 為唯一正典（Architecture Lock）

**版本**: v1.0（2026-05-09）/ v1.1（2026-05-13，本 branch 加 reinstate 附註）
**日期**: 2026-05-09
**狀態**:
- on `main` / `dev`: 仍是 **SUPERSEDED**（未撤回該分支上的翻案）
- on `refactor/agent-port`: **REINSTATED**（2026-05-11 A-1～A-3b 實質執行原始決議；見下方 §0a）
**作者**: Imding1211 / 2026-05-13 reinstate 附註: Claude（與 Imding1211 在 hermes-cs 進度回顧時 confirm）
**對應 commits**: `integrate/sunny-onto-zenobia0000-20260508` 系列（2825cbe → 整合分支 tip） + 本 branch `6787843` ~ `e6ed743`

---

## ⓪a 本分支 REINSTATE 附註（2026-05-13 後加，僅適用 `refactor/agent-port`）

> 本 ADR 在 2026-05-09 14:42 因 origin/dev force-push 被加上 SUPERSEDED 附註。但**本分支 `refactor/agent-port` 自 5/9 後獨立演化**，並於 2026-05-11 一日內以 5 個 commit 完成原始決議內容：
>
> - `6787843` Stage 0 — port product_info DB 基礎建設（45 mega-doc + filter_loadable）
> - `d9edd3f` A-1 — 新增 `load_product_info` tool（並存階段）
> - `5d46160` A-2 — system prompt catalog 從 `[可用技能]` 切 `[可用產品資料]`
> - `0eac531` A-3a — 退場 `load_skill` tool
> - `e6ed743` A-3b — 刪除 `agent/skills/data/` 全部 69 個 SKILL.md
>
> 對打結果：67 共同題 strict pass **89.6%**（vs 改回 skills/ 後的 dev baseline 83.6%）。
>
> 因此**在本 branch 上，ADR-008 的核心主張（product_info 為唯一正典）已重新成立並有實證**。下方 §1～§N 所有「禁止」「不可逆」「PR 拒收」條款**在本 branch 重新生效**。
>
> 不撤回 main / dev 分支上的 SUPERSEDED 是因為：
> 1. 該附註為其他分支原作者的決定，跨 branch 重寫他人附註不適當
> 2. main / dev 走自己的路線（roadmap 目前走向 hermes-cs，dev 可能直接砍 agent/）
> 3. 本 branch 是 archive 候選，附註僅為 audit trail 用途
>
> **附註對應手冊**: [Product Info Cutover Audit 2026-05-11](../../agent/docs/manuals/product_info_cutover_2026-05-11.md)

---

## ⚠️ SUPERSEDED 附註（2026-05-09 14:42 後加，跨 branch 適用）

> 本 ADR 於 2026-05-09 上午由 Imding1211 撰寫並推上 origin/dev (`dbfe75b`)，主張
> `product_info/` 為唯一正典、`skills/` 架構**不可逆向**。
>
> **同日 14:42 經團隊重新協商**，決議改以本地 dev（含 5/6 22:45 後續 137 commits
> 的 skills/ 架構 + RP3 重構 + V1.5 通知 + F-002/F-023 文件補強）為主，
> 並以 `--force-with-lease` 覆蓋 origin/dev → `a9d6fbb` (5/9 14:42)
> → 後 fast-forward 至 `f9cff16` (5/9 14:51 復原本附註所在的兩份檔案)。
>
> 本 ADR 即日起**狀態變為 SUPERSEDED**，僅作 5/9 上午架構決議的歷史紀錄保留。
> 下方所有「**禁止**」、「**不可逆**」、「**任何試圖把 agent/ 改回 skills/ 的 PR
> 都會被拒絕**」等敘述**均不再適用**。
>
> 後續如需正式確立 skills/ 為新正典，建議寫 ADR-009 補上：
> - 為何 5/6-5/8 的 skills/ 架構 + RP3 工作的價值優於 product_info/ mega-doc 路線
> - quality_check 退步可接受度與補救方案
> - `agent/agent_tools/` 是否重新 rename 回 `agent/skills/`、`product_info/` 去留、
>   SKILL.md vs mega-doc 取捨
> - 5/9 14:42 force-push 的決策過程、授權人、協商內容（口頭確認，無書面紀錄）
>
> 在 ADR-009 寫成前，當前 dev 架構（skills/ canonical）為 **de facto 狀態，
> 沒有書面 ADR 背書**。本附註只標記 ADR-008 失效，不構成新架構的論證。
>
> **附註人**: Sunny Weng（2026-05-09 14:5x）

---

## 0. 給未來的協作者（含所有 AI 助手）

> **如果你看到這份文件就是要看完。** 你或 AI 之後可能會在程式碼裡看到歷史殘留（refactor commits / 早期文件提到 `skills/`、`SKILL.md`、`load_skill`、`agent_tools/` rename 等字眼）。**那些都是已被棄置的歷史**。
>
> 本專案的 agent 知識庫架構**已於 v1.3.4-v1.3.5 完成從 `skills/` 到 `product_info/` 的全面遷移**，並於 v1.3.6 把 `agent/skills/` 重新命名為 `agent/agent_tools/`（保留模組路徑、棄用 SKILL.md 概念）。
>
> **本 ADR 是團隊正式拍板的最終架構決議**，已在 2026-05-09 整合分支驗證通過（quality_check 67 案例 93% pass，無 import error / runtime error）。**任何試圖把 agent/ 改回 skills/ + SKILL.md 架構的 PR 都會被拒絕**。
>
> 如果你（或 AI）認為架構應該回退，請先讀完本 ADR 的「歷史脈絡」與「為何不接受 skills/ 重新引入」兩段，再到 issue tracker 提出反對意見並徵詢團隊。**不准片面 force-push 改回去**（曾於 2026-05-06 22:45 發生過一次，造成同步 fork 緊急介入）。

---

## 1. 決議

`agent/` 子模組的知識庫架構固定為：

| 項目 | 採納 | 棄用 |
|---|---|---|
| 知識庫格式 | **`agent/product_info/{Brand}/{Model}.md` mega-doc**（一個型號一份完整文件，YAML frontmatter） | `agent/skills/data/{Brand}/{Model}/skill-name/SKILL.md` 細粒度技能 |
| Agent 工具 | **`load_product_info(name)` + `update_user_info` + `transfer_to_human`**（共 3 個 tool） | `load_skill(skill_name)` |
| 系統 prompt 提示區塊 | **`[可用產品資料]`** | `[可用技能]` |
| Tool 定義模組路徑 | **`agent/agent_tools/tools.py`** | `agent/skills/tools.py` |
| 啟動載入函數 | **`product_info.load_all_docs(path)`** | `skills.load_skills(path)` |
| Profile gating 函數 | **`product_info.filter_loadable(brand, model)`** | `skills.filter_skills(brand, model)` |
| Python 套件管理 | **`agent/requirements.txt`**（pip） | `agent/pyproject.toml`（uv workspace）|
| Dockerfile | **單階段 `python:3.11-slim` + `pip install`** | 多階段 `ghcr.io/astral-sh/uv:0.11` build |

---

## 2. 為何選 `product_info/` 而非 `skills/`

| 維度 | `product_info/` mega-doc | `skills/` SKILL.md |
|---|---|---|
| **資料粒度** | 1 個 brand+model = 1 份大文件 | 1 個症狀/功能 = 1 份小技能 |
| **LLM 視角** | 收到 `[可用產品資料]` 清單 → 呼叫一次 `load_product_info` 拿完整脈絡 | 收到 `[可用技能]` 清單 → 多次呼叫 `load_skill` 拼湊答案 |
| **內容耦合** | 同型號的所有資訊在一份文件中，前後文連貫 | 跨技能拼接時容易遺漏前後文（如「先入管理員模式」步驟散在多份 SKILL）|
| **維護成本** | 一個型號 = 一個檔；新增/修改聚焦 | 一個品牌可能要改 10+ 份 SKILL，且需確保 trigger_keywords 不重疊 |
| **資料來源管控** | `data/storage/bronze/` 為唯一可信源（CLAUDE.md 規定）；PDF 不可信 | 每份 SKILL 都要單獨指定 `bronze_origin`，散亂 |
| **LLM 成本** | 載一次（單次 ~5KB） | 載多次（每次 ~1KB，但 round-trip 多）|
| **prompt 注入長度** | 清單較短（41 份文件條目 ~3KB） | 清單較長（67+ 份技能條目 ~6KB） |

→ v1.3.4 拍板選擇 mega-doc 是基於**LLM 一次取脈絡比多次拼接更不易出錯**的觀察。

---

## 3. 為何不接受 `skills/` 重新引入

具體事件：

- **2026-05-06 21:52** — `Imding1211` 把 Zenobia000/dev 同步到 Zenobia0000 dev (`2825cbe`)，這是**已完成 v1.3.4-v1.3.6 product_info 遷移**的版本
- **2026-05-06 22:45** — 協作者 `Sunny Weng` 在沒有 ADR / PR review 的情況下，從 `6c2616c` 快照拉回 `agent/skills/`、`agent/skills/data/SKILL.md`、`agent_tools/ → skills/` rename 等，並在後續 5/7-5/8 大量 RP3 重構**疊加**在這個被回退的架構上
- **2026-05-09** — 經團隊確認以 Zenobia0000 (`2825cbe`) post-skills 架構為主，把 Sunny **架構中立**的工作（web/api/docs/tests/scripts/SQL/notifications/core helpers）port 過來，**架構回退相關 commits 不採納**

技術上「skills/ 設計」並非錯誤，但本專案**已經完成遷移成本**且**驗證通過**（quality_check 93%）。**回退會造成**：

1. 重新撰寫 67 份 SKILL.md（已在 mega-doc 中的內容要拆解）
2. 重新調 trigger_keywords 防衝突
3. system.md prompt 大改（已圍繞 `[可用產品資料]` 寫成）
4. quality_check 67 案例需重測重調
5. 知識庫真實性審計（CLAUDE.md「bronze-only」規則）需重做

任何「改回 skills/」的提案，**舉證責任在提案人**，需要：

- 量化證據顯示 product_info/ 的某個 LLM 表現問題**只能**用 skills/ 架構解決（而非靠 prompt tuning / mega-doc 重寫修復）
- 通過 quality_check 67 案例不退步的承諾
- 寫入新 ADR-009 取代本 ADR-008

---

## 4. 約束與測試

### 4.1 模組路徑禁區

新程式碼**禁止**出現以下 import：

```python
from skills import ...      # ❌ 模組已不存在
from skills.tools import ...   # ❌
import skills              # ❌
```

正確：

```python
from agent_tools.tools import load_product_info, update_user_info, transfer_to_human  # ✓
from product_info import all_docs, filter_loadable, has_brand, get_doc, load_all_docs  # ✓
```

### 4.2 系統 prompt 文字約束

`agent/prompts/system.md` 必須使用：

- `[可用產品資料]`（不是 `[可用技能]`）
- `load_product_info`（不是 `load_skill`）
- `{{Brand}}/{{Model}}`、`_common/{{topic}}`（不是 `{{Brand}}/{{Model}}/{{skill-name}}`）

### 4.3 CI 守護（待補）

未來可加 lint workflow：

```yaml
# .github/workflows/architecture-lock.yml（建議）
- name: 禁止 skills/ 路徑復活
  run: |
    if grep -rn "from skills\|import skills\|load_skill" agent/ --include="*.py" | grep -v __pycache__; then
      echo "❌ 偵測到 skills/ import — 違反 ADR-008"
      exit 1
    fi
```

### 4.4 quality_check 基準

每次涉及 agent/ 或 prompts/ 的 PR，必須跑：

```bash
cd agent && python -m quality.quality_check --no-judge
```

並維持 **pass rate ≥ 90%**（67 案例中 ≥ 60 通過）。當前基準（2026-05-09 整合驗收）：62/67 = 93%。

---

## 5. 例外與已知差異

### 5.1 V1.5 通知抽象層 `agent/notifications/`

Sunny 5/8 加入的 V1.5+ 通知 channel 抽象層（`ChannelAdapter` ABC + LINE/SMS/Email/FCM adapters）**不屬於知識庫架構**，與本 ADR 無衝突，**已 port 進整合分支**並保留。

### 5.2 `agent/core/` helpers

以下 4 個從 Sunny 工作 port 過來的純 helper（無 `skills/` 耦合）保留：

- `agent/core/logging_config.py` — structlog 結構化日誌
- `agent/core/content_utils.py` — `extract_text` helper
- `agent/core/pg_pool.py` — `_ensure_conn` 連線管理
- `agent/core/workday.py` — 工作日計算（含 `holidays` 套件）

依賴新增至 `requirements.txt`：`structlog`、`holidays`。

### 5.3 不採納的 Sunny 工作

- `agent/core/blocks.py` — RP3 harness 拆分用，2825cbe 平面架構不需要
- `agent/core/brand_match.py` — 與既有 `harness/line_ui_factory` 雙寫
- `agent/core/tracing.py` — 只 Sunny 版 `app.py` 使用
- `agent/harness/{buffer, quick_reply, orchestrator, skills_prefix, brand_resolver, validator_pipeline, checkpoint_cleanup, agent_audit}.py` — RP3 模組化是建立在 skills/ 之上的優化，本架構不需要
- `agent/pyproject.toml`、`agent/Dockerfile (uv multi-stage)` — 採納 pip + 單階段

如未來想吸收這些工作，需在新 ADR 中個案論證**對 product_info 架構的具體效益**，且不可順帶重新引入 skills/。

---

## 6. 參考

- **CLAUDE.md** — 專案根 AI 助手指引（Architecture Overview / Product Info Knowledge Base 區段）
- **agent/docs/manuals/harness_comparison.md** — 框架比較（含名詞對照表）
- **agent/docs/manuals/product_info_authoring_guide.md** — mega-doc 撰寫指南
- **agent/docs/manuals/integration-history-2026-05-09.md** — 本次整合的時序紀錄
- **docs/02-design/agent-harness/agent-layering-rules.md** — Sunny 撰寫的分層規則（已加 ADR-008 引用）
- **docs/02-design/E6x--project-structure-guide.md** — 專案結構指南（已更新 product_info 路徑）
- **`integrate/sunny-onto-zenobia0000-20260508` 分支** — 本架構決議的可重現基準
