---
id: DISC-0001
title: Blueprint Snapshot — AI 鎖匠系統 + 工單同步藍圖（2026-05-16 group-leader review）
tier: 4
status: shipped
shipped-as:
  - "../1-decisions/ADR-0026-memory-architecture.md"
  - "../1-decisions/ADR-0027-model-routing-policy.md"
  - "../1-decisions/ADR-0028-ai-employee-charter.md"
  - "../2-contracts/events/EVT-0001-domain-event-catalog.md"
  - "../2-contracts/cross-context-ownership.md"
  - "../2-contracts/tool-registry.md"
  - "../3-process/PROC-0011-idempotency-dlq-runbook.md"
shipped-at: 2026-05-16
source:
  - "../_archive/blueprints/AI鎖匠聊天機器人系統開發藍圖_v2.xlsx"
  - "../_archive/blueprints/AI鎖匠聊天機器人與工單同步藍圖_v2.xlsx"
authors: [Operational Lead, AI Specialist]
---

# DISC-0001 — Blueprint Snapshot（2026-05-16）

> 這是 group leaders 週會用的「全景圖」快照——把兩份 Excel 藍圖（系統開發 + 工單同步）拆解到正確的 tier，列出哪些已經有正典文件、哪些是新產生的決策、哪些是 PM 還沒拍板的 Gap。
>
> **本文件 = exploration snapshot，不是 source of truth**。實際規格走 §2 表中對應的 ADR / contract / runbook。

---

## 1. 兩份藍圖的角色

| 藍圖 | 焦點 | 主責 |
|---|---|---|
| `AI鎖匠聊天機器人系統開發藍圖_v2.xlsx` | AI chatbot 內部架構（1-6 層系統、12 個模組、Memory / Model / Tool Registry、Eval、風險治理）| AI Specialist + Operational Lead |
| `AI鎖匠聊天機器人與工單同步藍圖_v2.xlsx` | Chatbot → DB → ProblemCard → WorkOrder 的同步契約（資料／狀態／API／事件／Idempotency／Gap 決策）| Operational Lead + Backend |

兩份檔案的觀點都是「**站在 group leader 視角審核」**，因此偏組合視圖而非 source-of-truth。實質決策已在本快照產出時拆到對應 tier。

---

## 2. 內容拆解對照表（去重 / 防 AI slop 的核心）

| 藍圖內容 | 拆到哪 | 為什麼 |
|---|---|---|
| **系統 sheet 01** 系統分層（L1-L6）| 已存在 → [`ARCH-0001-architecture-overview`](../1-decisions/ARCH-0001-architecture-overview.md) | 同一份 6 層架構；不重複建檔 |
| **系統 sheet 02** 模組地圖 A01-A12 | 已存在 → [`docs/2-contracts/modules/INDEX.md`](../2-contracts/modules/INDEX.md)（MC-0001~MC-0023）| 模組契約已細到單檔；本表是 rollup view |
| **系統 sheet 03** 端到端流程 | 已存在 → [`docs/2-contracts/flows/business/`](../2-contracts/flows/business/) + [`CLAUDE.md`「Request Processing Flow」](../../CLAUDE.md)| BF 已細化 |
| **系統 sheet 04** Chatbot 邏輯 Gate（G1-G8）| 已存在 → [`QG-0001-quality-gates`](../3-process/QG-0001-quality-gates.md) + [`PROC-0010-security-readiness-checklist`](../3-process/PROC-0010-security-readiness-checklist.md) | Gate 邏輯散在 quality + security gate |
| **系統 sheet 05** RAG 知識螺旋（S1-S7）| 已存在 → [`ADR-0008-product-info-architecture`](../1-decisions/ADR-0008-product-info-architecture-canonical.md) + `data/pipeline` 各層 README | mega-doc 是 S4；S6/S7 是 SOP feedback |
| **系統 sheet 06** Agent 訓練規格 | 已存在 → `agent/prompts/system.md` + `agent/quality/` | prompt + eval 是程式碼，不是文件 |
| **系統 sheet 07** Eval 品質系統 | 已存在 → [`TP-0001-test-plan`](../3-process/TP-0001-test-plan.md) + `agent/quality/quality_check.py` | quality_check 已 production |
| **系統 sheet 08** 風險治理 | 已存在 → [`PROC-0010-security-readiness-checklist`](../3-process/PROC-0010-security-readiness-checklist.md) + [`ADR-0028`](../1-decisions/ADR-0028-ai-employee-charter.md) §Forbidden | Forbidden 清單上提到 ADR-0028 |
| **系統 sheet 09** Source Trace | 已存在 → [`VIEW-0005-traceability-matrix`](../5-views/VIEW-0005-traceability-matrix.md) | 5-views 自動產生，這份是 manual subset |
| **系統 sheet M01-M12** 模組規格 | 已存在 → [`docs/2-contracts/modules/MC-*.md`](../2-contracts/modules/) | 既有 MC-0001~MC-0023 都對得上 |
| **系統 sheet 10** AI Employee Resume | 🆕 **新檔** → [`ADR-0028-ai-employee-charter`](../1-decisions/ADR-0028-ai-employee-charter.md) | 之前散落各處，現集中為 charter |
| **系統 sheet 11** Memory Architecture | 🆕 **新檔** → [`ADR-0026-memory-architecture`](../1-decisions/ADR-0026-memory-architecture.md) | 7 層記憶第一次完整成文 |
| **系統 sheet 12** Model Routing | 🆕 **新檔** → [`ADR-0027-model-routing-policy`](../1-decisions/ADR-0027-model-routing-policy.md) | 補 ADR-0006 / 0007 的場景路由細節 |
| **系統 sheet 13** Tool MCP Registry | 🆕 **新檔** → [`tool-registry.md`](../2-contracts/tool-registry.md) | 集中 5 個 production tools + 3 個 P1/P2 |
| **系統 sheet 14** QID Cross-Ref | 部分 → [`VIEW-0005-traceability-matrix`](../5-views/VIEW-0005-traceability-matrix.md) | AEOS Q001-Q050 對照是 view，可自動 regen |
| **同步 sheet 01** 同步架構 L1-L6 | 已存在 → [`ARCH-0001-architecture-overview`](../1-decisions/ARCH-0001-architecture-overview.md) §資料流 | 同一份分層 |
| **同步 sheet 02** 資料對照（Conv ↔ ERP）| 已存在 → [`openapi.yaml`](../2-contracts/api/openapi.yaml) + [`MDS-0002-customer-device`](../2-contracts/master-data/MDS-0002-customer-device.md) | OpenAPI 與 master data 已細化 |
| **同步 sheet 03** 狀態對照 | 已存在 → [`SM-0001-work-order`](../2-contracts/state-machines/SM-0001-work-order.md) + `SM-0002` | 狀態機已成文 |
| **同步 sheet 04** API 整合 | 已存在 → [`openapi.yaml`](../2-contracts/api/openapi.yaml) + [`API-0001-error-codes`](../2-contracts/api/API-0001-error-codes.md) | OpenAPI 即 source of truth |
| **同步 sheet 05** 事件與 Outbox | 🆕 部分 → [`EVT-0001-domain-event-catalog`](../2-contracts/events/EVT-0001-domain-event-catalog.md) + [`PROC-0011`](../3-process/PROC-0011-idempotency-dlq-runbook.md) | 事件型錄 + DLQ 分兩檔 |
| **同步 sheet 06** Gap 決策清單 | 👇 本檔 §3 | PM 待拍板；未來轉 ADR / CIA |
| **同步 sheet 07** 測試矩陣（TC-SYNC-01~10）| 已存在 → `api/tests/test_pc_convert_to_wo.py` + [`TP-0001`](../3-process/TP-0001-test-plan.md) | TC-SYNC-08/09/10 列為 P1 待補 |
| **同步 sheet 08** Source Trace | 已存在 → [`VIEW-0005-traceability-matrix`](../5-views/VIEW-0005-traceability-matrix.md) | 同上 |
| **同步 sheet M01-M06** 模組規格 | 已存在 → 各 [`MC-*`](../2-contracts/modules/) | 與 ERP 模組對應 |
| **同步 sheet 09** Idempotency & DLQ | 🆕 **新檔** → [`PROC-0011-idempotency-dlq-runbook`](../3-process/PROC-0011-idempotency-dlq-runbook.md) | 從 sheet 05 Outbox 抽出細節 |
| **同步 sheet 10** Domain Event Catalog | 🆕 **新檔** → [`EVT-0001`](../2-contracts/events/EVT-0001-domain-event-catalog.md) | 跨模組事件第一次集中登記 |
| **同步 sheet 11** Cross-Blueprint Contract | 🆕 **新檔** → [`cross-context-ownership.md`](../2-contracts/cross-context-ownership.md) | Chatbot ↔ ERP 擁有者規則 |

🆕 共產出 **7 份新文件**（3 個 ADR、3 個 tier-2 contract、1 個 tier-3 runbook）。

---

## 3. Gap 決策清單（同步藍圖 sheet 06，PM 待拍板）

下列決策**阻擋 PRD 收斂**，需在下次 group-leader 例會關閉。每筆關閉時應產出對應 ADR 或 CIA。

| ID | 決策問題 | 建議預設 | 是否阻擋 coding | Owner | 狀態 |
|---|---|---|---|---|---|
| D01 | AI 是否可自動 `convert_to_work_order`？ | V1 需客服確認 PC；V2 限低風險固定場景可自動 | **是** | 客服主管 / ERP owner | 🔴 待決議 |
| D02 | 缺地址時怎麼補？ | LINE 追問 + 後台補填；無地址不得轉 WO | **是** | 客服主管 | 🔴 待決議 |
| D03 | ProblemCard completeness score 是否控制派工？ | 低於門檻不自動派工，人工可 override | **是** | Tech Lead / Ops | 🔴 待決議 |
| D04 | urgent / Red Code 定義 | 被鎖門外、門內受困、安全風險、怒客高風險 | **是** | 營運主管 | 🟡 預設可接受 |
| D05 | 保固 / 建案案件是否報價？ | AI 禁止 final quote；真人查詢後回覆 | **是** | 主管 / 會計 | 🟢 已對齊 ADR-0028 |
| D06 | 同 conversation 多 PC 規則 | 同一 active issue 僅一張 PC；新症狀／新設備可另建 | 部分 | 客服主管 | 🟡 待 PM 確認 |
| D07 | 對話解決後是否客戶確認關閉？ | 遠端解決需 quick confirm 或 48h 自動關閉 | 部分 | 客服主管 | 🔴 待決議 |
| D08 | AI feedback 誰審核？ | 客服主管 + domain expert 雙審高風險 SOP | **是** | Knowledge owner | 🟡 待流程細節 |

**處理流程**：每筆關閉時，跑 `sunnydata-change-impact-analysis` skill 產出 CIA，再依結論建新 ADR 或更新對應 contract。

---

## 4. 待補測試（同步藍圖 sheet 07）

| TC | 場景 | 狀態 |
|---|---|---|
| TC-SYNC-08 | agent 背景建 PC 失敗（Admin API down）| 🔴 需補 — 應對應 [`PROC-0011 dlq_pc_create`](../3-process/PROC-0011-idempotency-dlq-runbook.md) |
| TC-SYNC-09 | Quick Reply 後建 PC | 🔴 需補 |
| TC-SYNC-10 | 多媒體照片 gate | 🔴 需補 |

歸入 [`WBS-0003-phase-3.3-backlog-2026-q2`](./WBS-0003-phase-3.3-backlog-2026-q2.md) 或下季 WBS（看 PM 決策）。

---

## 5. AI slop 防護記錄

本快照產出時主動避開的重複建檔：

- ❌ 不重新寫「系統分層」（已是 ARCH-0001 §1）
- ❌ 不重新寫 12 個模組（已是 MC-0001~MC-0023）
- ❌ 不重新寫端到端流程（已是 BF + CLAUDE.md flow 段）
- ❌ 不重新寫 OpenAPI（已是 `openapi.yaml`）
- ❌ 不重新寫 Source Trace（已是 VIEW-0005 自動產生）
- ✅ 只把**新內容**（Memory / Model Routing / AI Charter / Event Catalog / Cross-Context / Tool Registry / DLQ Runbook）寫到對應 tier
- ✅ 所有新 tier-2 文件帶 `last-synced-with` frontmatter（鎖在 HEAD `dccfc001`）

---

## 6. 後續

1. 把兩份 xlsx 移到 [`docs/_archive/blueprints/`](../_archive/blueprints/)（已執行）。
2. 跑 `sunnydata-doc-freshness` 確認 7 份新 tier-2 / tier-3 文件 frontmatter 正確。
3. PM 例會關閉 §3 Gap 決策；逐筆走 CIA。
4. 把 TC-SYNC-08/09/10 入 WBS。
5. 90 天後（2026-08）重新檢視本 snapshot：哪些 Gap 已關閉、哪些 ADR 已生效；過期則本檔轉 `status: archived`。
