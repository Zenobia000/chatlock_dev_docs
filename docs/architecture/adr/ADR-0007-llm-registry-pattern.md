---
id: ADR-0007
title: LLM Registry 形式 — 承認 LiteLLM 字串路由為 dict registry 替代方案
tier: 1
status: accepted
date: 2026-05-07
deciders: [技術負責人, 開發團隊]
---

> 
> **🔄 Migration Status (2026-05-28)**: `STILL_VALID_UNDER_M20_A03`
> **Reviewed against**: 2026-05-20 final spec (xlsx)
> **Reviewed on**: 2026-05-28
> **Module scope**: M20, A03
> **Per ADR-0100 §1 classification** (.claude/context/devteam/meetings/2026-05-27-1130-final-spec-migration-strategy/MoM.md)


# ADR-007: LLM Registry 形式 — 承認 LiteLLM 字串路由為 dict registry 替代方案

**狀態:** Accepted
**決策者:** 技術負責人, 開發團隊
**日期:** 2026-05-07

---

## 背景

`agent/` 模組對 provider 抽象層有四種寫法，形式不對稱：

| 模組 | 形式 | 切換方式 | 範例 |
|------|------|---------|------|
| `agent/memory/` | **dict registry** + `"memory"` if/else fast-path | `config.toml [memory].type` 對應 `MEMORY_REGISTRY` key | `"sqlite"` → `build_sqlite_saver`、`"postgres"` → `build_postgres_saver` |
| `agent/storage/` | **dict registry** | `config.toml [storage].type` 對應 `STORAGE_REGISTRY` key | `"sqlite"` → `build_sqlite_storage`、`"postgres"` → `build_postgres_storage` |
| `agent/llms/` | **LiteLLM 字串前綴路由** | `config.toml [llm].model` 字串前綴 | `"vertex_ai/gemini-2.5-pro"`、`"anthropic/claude-sonnet-4"`、`"ollama/gemma3:4b"` |
| `agent/embeddings/` | dict registry | `config.toml` 對應區塊的 `embedding_provider` | `"vertexai"`、`"ollama"` |

### 這個 ADR 為什麼存在

2026-05-06 的程式碼架構審查（`docs/_audit/code-architecture-review-2026-05-06-1521.md`）§C2 與一致性矩陣（`docs/_audit/consistency-matrix-2026-05-06-1521.md`）U17、D1 指出：

- **U17（docs 端）已修正**：將 `architecture-and-design` 系列文件中「memory/storage/llms/embeddings 都是 registry」的概化描述精確化為三段描述（dict registry / LiteLLM 字串路由 / 直接 build 函式）。
- **D1（code 端待決）**：docs 已精確化，但「llms/ 要不要補 dict registry 與 memory/storage 對齊」仍未拍板。
- **§E1**：審查報告把此題列為「待開新 ADR」，建議檔名 `adr-007-llm-registry-pattern.md`。

ADR-006 描述的舊版 `LLM_REGISTRY` 字典（含 `"ollama"` / `"gemini"` / `"vertexai"` 三個 provider builder）已於後續重構中移除，現行實作為單一 `build_litellm()` 入口（`agent/llms/litellm_model.py`），所有 provider 切換交給 LiteLLM 內建的字串前綴路由處理。本 ADR 旨在正式承認這個現況，並為後續維護提供決策依據。

---

## 決策

**採用選項 B：正式承認 LiteLLM 字串前綴路由為合法的 registry 替代方案。不在 `agent/llms/__init__.py` 補 dict registry。**

連帶確認：

1. **docs 描述採三段式**，不再用「registry pattern」一詞概化所有 provider 抽象層。具體用語：
  - `memory/`、`storage/`：「**dict registry**」（key → builder 函式）
  - `llms/`：「**LiteLLM 字串前綴路由**」（config-driven，但形式不同於 dict registry）
  - `embeddings/`：「**直接 build 函式**」（小規模，未抽 registry）

2. **共同特徵保留**：四個模組都是 **config-driven provider 抽象**，差異僅在「分派機制」。docs 在需要橫向比較時可使用「config-driven 路由」這個上位概念，但不可再把所有四者統稱為「registry」。

3. **`agent/llms/__init__.py` 維持現狀**（`get_llm()` → `build_litellm(config)`），不引入 `LLM_REGISTRY = {...}`。

---

## 理由

### 1. 不重複抽象

LiteLLM 上游已維護超過 100 個 provider 的字串前綴路由（`vertex_ai/`、`anthropic/`、`openai/`、`ollama/`、`bedrock/`、`azure/` 等）。在 `agent/llms/__init__.py` 自建 dict registry 等於：

- 包裝既有功能：`LLM_REGISTRY["vertexai"] = build_vertexai_llm`，但 `build_vertexai_llm` 內部仍呼叫 LiteLLM。
- 增加一層 indirection，新增 provider 時要同時改 dict registry 與 LiteLLM 設定。
- 違反 Linus 第一準則「拒絕為臆想問題寫程式碼」與「拒絕重複抽象」。

### 2. 使用 pattern 不同 — 形式對稱性是表面目標

`memory/` 與 `storage/` 的 dict registry 解決的是**部署環境差異**：

- 本機開發：`type = "sqlite"`（無外部依賴）
- CI / 整合測試：`type = "memory"`（in-process MemorySaver）
- 生產：`type = "postgres"`（CloudSQL）

這三者在不同環境間切換頻率高、需求穩定，dict 註冊一次後幾乎不變。

`llms/` 的切換場景則是**模型升級與多模型路由**：

- 模型版本演進（Gemini 2.5 → 3.0、Claude 3.5 → 4）
- 任務分流（FAQ 走 Flash、診斷推理走 Sonnet）
- A/B 測試（同一 provider 內換模型字串即可）

這些場景下，「provider 切換」本身不是常見動作；常見的是「model 字串切換」。LiteLLM 字串路由直接命中這個需求 — 改 `[llm].model` 即可。

形式對稱（都用 dict registry）只能讓 `__init__.py` 看起來整齊，不會降低實際維護成本。

### 3. 切換頻率與抽象層級匹配

| 模組 | 切換頻率 | 抽象顆粒 | 適合形式 |
|------|---------|---------|---------|
| memory | 每環境一次 | provider type | dict registry |
| storage | 每環境一次 | provider type | dict registry |
| llms | 每模型版本 / 每任務類型 | model 字串 | LiteLLM 字串路由（顆粒更細） |
| embeddings | 極少（生產主要用 vertexai） | provider type | 直接 build 函式（規模小，無需抽象） |

dict registry 適合「provider 切換」這種粗顆粒、低頻率動作；LiteLLM 字串路由適合「model 切換」這種細顆粒、中頻率動作。**用對工具，不要用同一把錘子敲所有釘子。**

### 4. 與 LiteLLM 上游同步

把分派邏輯交給 LiteLLM，意味著：

- 新 provider 上市時（如 Vertex AI 新增模型、Anthropic 開放新區域），LiteLLM 升級即取得；本地零改動。
- LiteLLM 修 bug 直接受惠（例如 token 計算、retry 策略）。
- 自建 dict registry 等於背負 fork 維護成本。

### 5. ADR-006 的影響

ADR-006「LLM 模型選擇策略」的「行動項目」表中，P1 任務「實作 `agent/llms/anthropic_model.py` 並註冊至 `LLM_REGISTRY`」需要更新解讀：

- 在當前 LiteLLM 架構下，**新增 Anthropic 支援不需要新增 builder 檔案**，只需在 `config.toml` 改 `model = "anthropic/claude-sonnet-4-20250514"` 即可（LiteLLM 已支援 Anthropic Vertex AI Model Garden 與直連 API）。
- ADR-006 的核心決策（V1.0 用 Gemini 2.5 Flash、V2.0 採多模型路由）**不受本 ADR 影響**；只是實作路徑從「擴充 LLM_REGISTRY」改為「擴充 LiteLLM model 字串設定」。
- 後續 V2.0 的 model-router 仍可在 `config.toml` 拆 `[llm.default]` / `[llm.reasoning]` / `[llm.safety]` 三個區塊，每個區塊持有自己的 LiteLLM model 字串，由 `get_llm()` 多次呼叫產生多個 ChatLiteLLM 實例。

---

## 替代方案

### 方案 A：補 `agent/llms/__init__.py` dict registry，與 memory/storage 對齊

實作示意：

```python
LLM_REGISTRY = {
    "vertexai": build_vertexai_llm,   # 內部仍呼叫 LiteLLM 並前綴 "vertex_ai/"
    "anthropic": build_anthropic_llm, # 內部仍呼叫 LiteLLM 並前綴 "anthropic/"
    "openai":   build_openai_llm,
    "ollama":   build_ollama_llm,
}

def get_llm(config: dict):
    provider = config.get("provider", "vertexai")
    model    = config.get("model_name")
    builder  = LLM_REGISTRY[provider]
    return builder(model, config)
```

- **優點**：四個模組形式統一；新成員一眼看懂「dict + key 分派」。
- **缺點**：
  - **重複抽象**：每個 builder 內部仍呼叫 LiteLLM，等於包裝既有功能。
  - **新增 provider 多一步**：除了 LiteLLM 升級外，要在 `__init__.py` 加一行 + 寫對應 builder 檔。
  - **config 改寫**：現行 `model = "vertex_ai/gemini-2.5-pro"` 一行設定，會被拆為 `provider = "vertexai"; model_name = "gemini-2.5-pro"` 兩行，反而更冗長。
  - **與 LiteLLM 上游脫鉤**：LiteLLM 新增 provider 時需要手動補 `LLM_REGISTRY` 才能用。
- **否決原因**：解決的是「形式不對稱」這個臆想問題，而不是真實維護痛點。增加程式碼、增加維護成本，零實質收益。

### 方案 C：擴大範圍 — `embeddings/` 也補完整 registry，所有 provider 抽象層全用 dict registry

- **優點**：四個模組徹底形式統一。
- **缺點**：
  - `embeddings/` 已經有 dict registry（`REGISTRY = {"ollama": ..., "vertexai": ...}`），現況可接受。本方案實際要解決的還是 `llms/`，與方案 A 同樣命中「重複抽象」問題。
  - 範圍擴大但不解決核心爭點。
- **否決原因**：問題不在 embeddings/，不需要動它；llms/ 的決策回到方案 A vs B 的爭點。

### 方案 B（採用）：承認 LiteLLM 字串路由為 registry 替代方案 + docs 三段式描述

- **優點**：零 code 變更、不重複抽象、與 LiteLLM 上游同步、docs 描述精確反映實況。
- **缺點**：四個模組形式不對稱，新成員需理解兩種 config-driven 機制。
- **緩解**：在 `agent/CLAUDE.md` 與 `docs/02-design` 系列 architecture 文件明確記錄此差異及其理由（已由 U17 完成 docs 端精確化）。

---

## 影響

### 正面影響

- **零 code 變更**：本 ADR 為 docs-only 決議，不需動 `agent/llms/__init__.py`。
- **保持簡單**：避免引入無實質收益的抽象層。
- **與上游同步**：LiteLLM 升級即取得新 provider 支援。
- **docs 一致性**：`docs/02-design/E5x--frontend-architecture.md` 等文件 U17 已落實三段式描述，本 ADR 為其提供正式背書。
- **解決 audit 條目**：
  - `code-architecture-review-2026-05-06-1521.md` §E1（待開 ADR-007）→ 已建。
  - `code-architecture-review-2026-05-06-1521.md` §C2（registry 形式不一致）→ llms/ 部分有最終決議。
  - `consistency-matrix-2026-05-06-1521.md` U17 / D1 → 完整收尾。

### 負面影響

| 風險 | 嚴重度 | 緩解措施 |
|------|-------|---------|
| 新成員看到四種不同形式時困惑 | 中 | `agent/CLAUDE.md` 增補一段「provider 抽象層形式說明」；ADR-007 列為新成員必讀 |
| LiteLLM 上游改變字串前綴格式 | 低 | 字串路由集中在 `litellm_model.py:43-48`，異動範圍可控 |
| 未來若有需求要在 LLM 層加 provider-specific middleware（例如自動降級、成本上限） | 中 | 屆時可在 `litellm_model.py` 內以裝飾器或 wrapper 處理；若複雜度上升再開新 ADR 重新評估 |

### 不影響

- ADR-006 的 V2.0 多模型路由策略仍適用，只需把實作從「擴充 `LLM_REGISTRY`」改為「擴充 `config.toml` 多區塊 + 多次呼叫 `get_llm()`」。
- `memory/` 與 `storage/` 的 dict registry 不受本 ADR 影響，繼續維持現有形式。
- `embeddings/` 的小規模 dict registry 不受本 ADR 影響，未達補完整抽象的規模門檻。

---

## 行動項目

| 優先序 | 項目 | 負責人 | 目標時程 |
|-------|------|-------|---------|
| P0 | 本 ADR 提交至 `docs/01-define/adrs/`，更新 `_MOC.md` 索引 | 文件負責人 | 2026-05-07 |
| P1 | 在 `agent/CLAUDE.md`「Module map」段落增補 provider 抽象層三段式說明 | 開發團隊 | 下個維護視窗 |
| P2 | ADR-006 行動項目「實作 `anthropic_model.py` 並註冊至 LLM_REGISTRY」改寫為「在 `config.toml` 增加 Anthropic 模型字串設定，驗證 LiteLLM 路由」 | 技術負責人 | V2.0 Sprint 1 |
| P3 | 若 V2.0 多模型路由實作時發現 LiteLLM 字串路由不敷使用，重新檢視本 ADR 並評估是否升級為 dict registry | 技術負責人 | V2.0 GA + 1 個月 |

---

## 相關文件

- ADR-003: 選擇 LangChain 作為 LLM 整合框架
- ADR-006: LLM 模型選擇策略（本 ADR 影響其行動項目實作路徑）
- `agent/llms/__init__.py` — 現行 LiteLLM 統一接口
- `agent/llms/litellm_model.py` — `build_litellm()` 實作
- `agent/memory/__init__.py` — dict registry 範例（含 `"memory"` if/else fast-path）
- `agent/storage/__init__.py` — 純 dict registry 範例
- `agent/embeddings/__init__.py` — 小規模 dict registry 範例
- `docs/_audit/code-architecture-review-2026-05-06-1521.md` §C2、§E1 — 提案來源
- `docs/_audit/consistency-matrix-2026-05-06-1521.md` U17、D1 — docs 端精確化紀錄
