# Smart Lock SaaS — 智慧鎖 AI 客服與派工平台

> LINE Bot AI 客服 + 智慧派工 + 自動結算的 SaaS 平台。把電子鎖售後從「靠老師傅腦袋」變成「LINE 進來、AI 接、結構化資料、可分潤」。
>
> **狀態**：📋 PRD v2.2 frozen（2026-05-24）／ V1.0 上線目標 W17 ／ V2.0 W31

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Docs](https://img.shields.io/badge/docs-single--source--of--truth-blue)](./docs/)
[![ADR](https://img.shields.io/badge/ADR-66%20accepted-green)](./docs/architecture/adr/)

---

## 📋 30 秒摘要

售後客服痛點：新人 3 個月才上手、紙本對帳一個月吵一次、派錯案件就賠錢。本平台用 LINE Bot AI 把對話自動結構化成 ProblemCard，三層解決（案例庫 → 手冊 RAG → 真人），失敗時草擬工單給客服一鍵確認派工。V1.0 上線 AI 客服 + 後台（W17）；V2.0 接派工與帳務（W31）。

**最大爭議 + 紅線**：AI 不能亂承諾報價 / 退款 / 保固，合約 4.4 條規定的情緒識別 ≥ 90% / 家族覆核 / 個資保留期一條都不能破。

---

## 📚 Table of Contents

- [產品定位](#-產品定位)
- [KPI 與合約紅線](#-kpi-與合約紅線)
- [V1.0 / V2.0 範圍](#-v10--v20-範圍)
- [技術架構](#-技術架構)
- [文件導覽 by 角色](#-文件導覽-by-角色)
- [Repo 結構](#-repo-結構)
- [開發團隊起手式](#-開發團隊起手式)
- [業主決策歷程](#-業主決策歷程)
- [這個 repo 怎麼來的](#-這個-repo-怎麼來的)

---

## 🎯 產品定位

| 維度 | 內容 |
|:---|:---|
| **解什麼問題** | 售後服務沒人標準化，新客服訓練成本高、對帳爭議頻繁、派工容易出錯 |
| **使用者是誰** | LINE 上的消費者（V1 同時 50 人 / V2 100 人 / 3-5 年 30 萬戶）、簽約師傅（V2 目標 500 人 / 22 縣市）、客服 + 管理員 |
| **要做到什麼** | AI 準確率 ≥ 80% · 自助解決率 ≥ 60% · 接單 SLA 10/5 分 · 系統 Uptime ≥ 95% |
| **商業目標** | 客服人力省 60% · 月結對帳從 3 天降到 4 小時 · 多甲方架構先打底 |

詳細見 [`docs/prd/smart-lock-saas.md`](./docs/prd/smart-lock-saas.md)（PM 主檔，業主 / PM < 5 分鐘讀完）。

---

## 📊 KPI 與合約紅線

### KPI（業主簽核）

| 編號 | 指標 | 目標 |
|:---|:---|:---|
| **K1** | AI 準確率 | ≥ **80%**（50 題標準集） |
| **K2** | 自助解決率 | ≥ **60%**（上線 3 個月後） |
| **K3** ⚠️ | 家族覆核 event log 完整率 | ≥ **95%** + dispute rate ≤ 3%（合約 4.4(d) 履約方式詮釋）|
| **K5** | 接單 SLA | 10 分 / 急件 5 分，達成率 ≥ 95% |
| **K7** | 系統 Uptime | ≥ **95%**（合約 baseline） |
| **K8** ⚠️ | AI Forbidden Eval | ≥ **95%**，否則禁止部署（200 題 Domain Expert 出題）|

完整 K1~K9 + counter-metric C1~C4 見 PRD §KPI 表。

### 🚨 合約紅線（違反 = 合約 §9 終止風險）

1. **合約 4.4(a)** 負面情緒識別 ≥ 90%（UAT + 持續監控）
2. **合約 4.4(d)** 家族覆核紀錄（採 [Option A 降級履約](./docs/governance/legal-memo-retrospective-review.md)）
3. **合約 9.3** ProblemCard 完整率 ≥ 85%
4. **合約 SOW 2.1(4)** AI 影像辨識**禁用**（violation count = 0）
5. **AI Forbidden Eval ≥ 95%** 每次 deploy
6. **跨租戶資料零洩漏**（[ADR-0030](./docs/architecture/adr/ADR-0030-tenant-id-propagation.md)）
7. **GDPR forget ≤ 7 天**（[BR-PII-001](./docs/policy/br-pii-001.rego)）

任一違反 = block release。

---

## 🎯 V1.0 / V2.0 範圍

### ✅ V1.0（W1-W17）— AI 客服 + 合規

- LINE Bot AI 客服（文字、圖、對話記憶、情緒分流）
- ProblemCard 結構化問題卡 + 主動引導補資訊
- 三層解決機制（案例庫 → 手冊 RAG → 轉真人）
- 後台管理（知識庫、對話監看、儀表板、RBAC 四層權限）
- 合約 4.4 整套（90% 情緒識別、家族覆核 event log、個資保留期）
- 多甲方架構底層 schema 預埋（[ADR-0060](./docs/architecture/adr/ADR-0060-contract-template-schema-freeze-v1.md)）
- Data Governance Service 獨立服務（[ADR-0061](./docs/architecture/adr/ADR-0061-data-governance-service-boundary.md)）
- AI 禁區 200 題 Eval pipeline（block-deploy gate）
- Voucher 內部憑證 schema（[ADR-VCH-001](./docs/architecture/adr/ADR-VCH-001-platform-as-voucher-keeper.md)）

### ✅ V2.0（W18-W31）— 派工 + 帳務

- 師傅 Web App（案件池、接單、ETA、完工報告、帳戶中心）
- 智慧派工（自動匹配 + 手動指派）
- 報價引擎（標準矩陣 + 特殊加價）
- 帳務系統（7 帳本、墊款追蹤、月結、退款分層）
- Admin V2.0（案件全生命週期、客訴、技師管理、ChangeRequest workflow）
- 月結匯出（電子發票 / ERP CSV）→ V2.1

### ❌ 明確不做（避免 scope creep）

多語言（繁中為主）、消費者 App、線上金流、技師 GPS 追蹤、庫存管理、語音對話、AI 影像辨識、AI final quote、跨租戶資料可見。詳見 [PRD §範圍](./docs/prd/smart-lock-saas.md#-範圍做什麼--不做什麼)。

---

## 🏗 技術架構

```
[LINE 用戶]──▶ LINE Messaging API ──▶ FastAPI Backend ──▶ Gemini 2.5 Flash
                                           │                    (via LiteLLM)
                                           ▼
[技師 Web App (V2)]──▶ Next.js Frontend ──▶ PostgreSQL + pgvector
                                           │
[管理員 Admin Panel]──▶                    ├─▶ Data Governance Service (獨立)
                                           │      └─ OPA Rego policy artifact
                                           ▼
                                       GCP Cloud Run
```

| 層 | 技術 | ADR |
|:---|:---|:---|
| Backend | FastAPI (Python 3.10+) | [ADR-0001](./docs/architecture/adr/ADR-0001-backend-framework.md) |
| Database | PostgreSQL + pgvector | [ADR-0002](./docs/architecture/adr/ADR-0002-database-selection.md) |
| LLM | Gemini 2.5 Flash V1 / 3 Pro V2+ | [ADR-0006](./docs/architecture/adr/ADR-0006-llm-model-selection.md) |
| LLM 框架 | LangGraph + LiteLLM | [ADR-0003](./docs/architecture/adr/ADR-0003-llm-integration-framework.md) |
| Frontend | Next.js (V2) | [ADR-0005](./docs/architecture/adr/ADR-0005-frontend-framework-v2.md) |
| Channel | LINE Messaging API | [ADR-0004](./docs/architecture/adr/ADR-0004-line-bot-architecture.md) |
| Cloud | GCP Cloud Run | [PRD OQ-003](./docs/prd/smart-lock-saas.md) |
| 合規 | OPA Rego + DGS service | [ADR-0061](./docs/architecture/adr/ADR-0061-data-governance-service-boundary.md) |

完整：[`docs/architecture/ARCH-0001-architecture-overview.md`](./docs/architecture/ARCH-0001-architecture-overview.md)（C4 L1/L2）+ [`docs/architecture/c4-l3-smart-lock-saas.md`](./docs/architecture/c4-l3-smart-lock-saas.md)（C4 L3）+ [`docs/architecture/nfr-matrix-smart-lock-saas.md`](./docs/architecture/nfr-matrix-smart-lock-saas.md)（NFR 9 維度）

---

## 📖 文件導覽 by 角色

### 🎯 我是業主 / PM
1. [`docs/prd/smart-lock-saas.md`](./docs/prd/smart-lock-saas.md) — PRD v2.2（一頁讀完 + KPI + 範圍 + 風險）
2. [`docs/governance/stakeholders.md`](./docs/governance/stakeholders.md) — 18 角色 stakeholder map
3. [`archive/strategy/PAIN-POINTS-SUMMARY-2026-05-21.md`](./archive/strategy/PAIN-POINTS-SUMMARY-2026-05-21.md) — F1~F7 失敗劇本 / 護城河

### 🛠 我是新加入的工程師
1. [`docs/prd/smart-lock-saas.md`](./docs/prd/smart-lock-saas.md) — 先讀產品定位
2. [`docs/architecture/ARCH-0001-architecture-overview.md`](./docs/architecture/ARCH-0001-architecture-overview.md) — 看架構
3. [`docs/architecture/adr/INDEX.md`](./docs/architecture/adr/INDEX.md) — 66 條決策索引
4. [`specs/smart-lock-saas/handoff.md`](./specs/smart-lock-saas/handoff.md) — 開工入口

### 👤 我是 SA / BA
1. [`docs/analysis/system-spec-smart-lock-saas.md`](./docs/analysis/system-spec-smart-lock-saas.md) — 14 物件 / 7 狀態機 / 64 BR / 18 UC / 21 events
2. [`docs/analysis/fr/`](./docs/analysis/fr/) — 25 條 FR 規格
3. [`docs/analysis/br/`](./docs/analysis/br/) — Business Rules（含 BR-AUDIT-007）
4. [`docs/ux/user-flow-smart-lock-saas.md`](./docs/ux/user-flow-smart-lock-saas.md) — 4 main flows + 12 edge cases

### 🏛 我是 Architect / SD
1. [`docs/architecture/c4-l3-smart-lock-saas.md`](./docs/architecture/c4-l3-smart-lock-saas.md) — Component + bounded context
2. [`docs/architecture/nfr-matrix-smart-lock-saas.md`](./docs/architecture/nfr-matrix-smart-lock-saas.md) — 9 NFR 維度 + failure mode
3. [`docs/architecture/adr/`](./docs/architecture/adr/) — 66 條 ADR
4. [`docs/architecture/api/openapi.yaml`](./docs/architecture/api/openapi.yaml) — OpenAPI v1.0 frozen

### 🗄 我是 DBA
1. [`docs/architecture/data/erd.md`](./docs/architecture/data/erd.md) — ERD（含 partition / RLS / outbox / migration）
2. [`docs/architecture/adr/ADR-0051-evidence-retention-policy.md`](./docs/architecture/adr/ADR-0051-evidence-retention-policy.md) — PII retention
3. [`docs/architecture/adr/ADR-VCH-002-voucher-retention-7y.md`](./docs/architecture/adr/ADR-VCH-002-voucher-retention-7y.md) — Voucher 7y retention + cold tier

### 🧪 我是 QA / Test Lead
1. [`docs/qa/test-plan-smart-lock-saas.md`](./docs/qa/test-plan-smart-lock-saas.md) — 9 test levels + KPI scenarios + 8 BDD + 200 Forbidden Eval
2. [`docs/analysis/system-spec-smart-lock-saas.md`](./docs/analysis/system-spec-smart-lock-saas.md) §3 BR catalog

### 🚀 我是 DevOps / SRE
1. [`docs/ops/runbook-smart-lock-saas.md`](./docs/ops/runbook-smart-lock-saas.md) — 11 incident playbooks + Kill switch + Pipeline
2. [`docs/ops/release-readiness.md`](./docs/ops/release-readiness.md) — V1 launch checklist
3. [`docs/architecture/nfr-matrix-smart-lock-saas.md`](./docs/architecture/nfr-matrix-smart-lock-saas.md) §SLI/SLO

### ⚖️ 我是法務 / DPO / 合規
1. [`docs/governance/legal-memo-retrospective-review.md`](./docs/governance/legal-memo-retrospective-review.md) — 合約 §4.4(d) 履約方式詮釋備忘
2. [`docs/policy/br-pii-001.rego`](./docs/policy/br-pii-001.rego) — OPA Rego PII policy artifact（CODEOWNERS @legal @dpo）
3. ADR-0042（RBAC）+ ADR-0050（Evidence visibility）+ ADR-0051（Retention）+ ADR-VCH-001（Voucher Keeper）+ ADR-PII-002（資料極小化）

### 🤖 我是 AI Specialist
1. [ADR-0028 AI Employee Charter](./docs/architecture/adr/ADR-0028-ai-employee-charter.md) — Forbidden 清單
2. [ADR-0047 200 題 Eval](./docs/architecture/adr/ADR-0047-ai-forbidden-list-as-charter.md) — block-deploy gate
3. [ADR-0055 SKILL ↔ LLM 解耦](./docs/architecture/adr/ADR-0055-skill-llm-decoupling-contract.md)
4. [ADR-0057 RAG](./docs/architecture/adr/ADR-0057-rag-document-retrieval-not-prompt.md) — 規則走 RAG 不寫 prompt

---

## 🗂 Repo 結構

```
chatlock_dev_docs/
├── README.md                         ← 本檔
│
├── docs/                             ← 🎯 開發團隊單一事實（SoT）
│   ├── prd/                          ←   PM 層
│   │   ├── smart-lock-saas.md        ←     PRD v2.2 主檔
│   │   ├── SOW-0001-2026-q1.md
│   │   ├── BIZ-0001-...md
│   │   └── DISC-0001-...md
│   ├── ux/                           ←   UX 層
│   ├── analysis/                     ←   SA / BA 層
│   │   ├── system-spec-smart-lock-saas.md
│   │   ├── fr/                       ←     25 條 FR
│   │   └── br/                       ←     Business Rules
│   ├── architecture/                 ←   架構層
│   │   ├── ARCH-0001-...md           ←     C4 L1/L2
│   │   ├── c4-l3-smart-lock-saas.md  ←     C4 L3
│   │   ├── nfr-matrix-smart-lock-saas.md  ← NFR 9 維度
│   │   ├── DDD-0001-domain-model.md
│   │   ├── adr/                      ←     66 條 ADR + INDEX.md
│   │   ├── module-boundary/          ←     4 條 module boundary
│   │   ├── api/openapi.yaml          ←     OpenAPI v1.0 frozen
│   │   ├── data/erd.md               ←     ERD
│   │   └── nfr/                      ←     baseline NFR
│   ├── qa/                           ←   QA / 測試
│   ├── ops/                          ←   DevOps / SRE
│   ├── policy/br-pii-001.rego        ←   OPA Rego 政策 artifact
│   └── governance/                   ←   合規 / 法務
│
├── specs/smart-lock-saas/            ← 🚚 給 coding agent 的 handoff
│   └── handoff.md
│
├── archive/                          ← 📚 純歷史 reference
│   ├── strategy/                     ←   F1~F7 痛點 + deep research
│   ├── meetings/2026-05-22/          ←   業主拍板會議 + decision dashboard
│   ├── prd-baseline/                 ←   PRD-0001 v1.1 (superseded)
│   └── raw-spec/                     ←   2 份 Excel 原始規格
│
├── devteam_knowledge_base/           ← 🧠 文件產生框架（DevTeam harness）
│   ├── voice-profiles.md
│   ├── 01_role_responsibilities.md
│   ├── 02_lifecycle_phases.md
│   ├── ...
│   └── templates/                    ←   13 份規範文件範本
│
├── .claude/                          ← Claude Code agent / skill 設定
│   ├── CLAUDE.md
│   ├── agents/                       ←   12 persona + orchestrator + ...
│   ├── skills/                       ←   7 driver skill (pm/analyst/ux/arch/design/qa/ops)
│   └── context/devteam/              ←   session state（MoM / forum / reviews，gitignored）
│
└── vscode-extension/                 ← VSCode 擴充（產品週邊工具）
```

---

## 🚚 開發團隊起手式

如果你是 **coding agent / 內部開發團隊**，從這個入口開工：

👉 **[`specs/smart-lock-saas/handoff.md`](./specs/smart-lock-saas/handoff.md)**

裡面有：
- 7 條合約紅線（最高優先 constraint，不可違反）
- 21 份 frozen artifact 索引（PRD / ADR / OpenAPI / ERD / Test Plan / Runbook 全在 `docs/`）
- 建議建構順序 W1-W17（Foundation → Core V1 → Compliance → DGS → Admin Panel → UAT → Rollout）
- 12 條關鍵 Business Rule（dev 必看）
- Sprint DoD（70% coverage / Forbidden Eval ≥ 95% / negative case 覆蓋）
- 9 條 Hard Boundary（do NOT do）

> ⚠️ **單一事實**：開發團隊只看 `docs/`。`archive/` 是純歷史 reference，不是 active spec。

---

## 🏛 業主決策歷程

從 2026-05-21 痛點盤點到 2026-05-24 PRD v2.2 frozen 的完整決策鏈：

| 階段 | 時間 | 產出 | 連結 |
|:---|:---|:---|:---|
| Pre-mortem 戰略 | 5/21 | F1~F7 失敗劇本 + §A-§G CEO 視角 | [`archive/strategy/PAIN-POINTS-SUMMARY-2026-05-21.md`](./archive/strategy/PAIN-POINTS-SUMMARY-2026-05-21.md) |
| 業主拍板會議 | 5/22 | 29 條 ADR (ADR-0031~0059) accepted | [`archive/meetings/2026-05-22/`](./archive/meetings/2026-05-22/) |
| 互動式 ADR 圈選 | 5/22 | 24/24 ADR + 8 矛盾全裁決 | [`archive/meetings/2026-05-22/decision-dashboard.html`](./archive/meetings/2026-05-22/decision-dashboard.html)（瀏覽器開）|
| PRD draft v2 | 5/22 | 依 devteam harness 重產 | [`docs/prd/smart-lock-saas.md`](./docs/prd/smart-lock-saas.md) v2 |
| Lane A multi-role critique | 5/22 | 4 CB + 5 conflicts → 升 Lane B | `.claude/context/devteam/reviews/`（gitignored） |
| 3 場 Forum-Lite 衝突收斂 | 5/22 | Option C++ (Contract Template) / A++ (K2) / C++ (DGS) | `.claude/context/devteam/forum/`（gitignored）|
| Owner Verdict | 5/22 | 5 conflicts 全裁決 + PRD v2.1 frozen | PRD §Decision Log |
| 11 條 OQ 業主答覆 | 5/24 | Option A 降級履約 + Voucher Keeper 路線 | [Roundtable MoM #1 & #2](https://github.com/Zenobia000/chatlock_dev_docs)（gitignored 在 .claude/context/）|
| PRD v2.2 frozen + cascade | 5/24 | 7 個新 ADR (ADR-PII-002 / VCH-001/002 / PIVOT-001 + 0060/0061 update + BR-AUDIT-007) | [`docs/`](./docs/) |
| 文件大重構 | 5/25 | docs/ = SoT / archive/ = 歷史 | 本 commit |

---

## 🤖 這個 repo 怎麼來的

> 全 100+ 份規範文件由 **DevTeam Harness** 產出 — 一套讓 AI agent 扮演 12 角色軟體團隊的框架。
>
> 業主提出痛點 → Router 依 Phase DAG 路由 → 12 角色並行產出 PRD / ADR / OpenAPI / ERD / Test Plan / Runbook → Multi-role critique → Forum-Lite 收斂衝突 → Owner Verdict → Handoff。

技術細節見 [`devteam_knowledge_base/`](./devteam_knowledge_base/)（KB）+ [`.claude/skills/`](./.claude/skills/)（7 driver skill）+ [`.claude/agents/`](./.claude/agents/)（12 persona agent + orchestrator）。

Voice profile（每個 persona 的語言指紋）：[`devteam_knowledge_base/voice-profiles.md`](./devteam_knowledge_base/voice-profiles.md)。

設計依據：[`archive/strategy/deep-research-report.md`](./archive/strategy/deep-research-report.md)（11 階段 × 12 角色 × 三條並行主線 × 分層 freeze 的真實軟體團隊運作模式）。

> Harness 本身的 OSS 版本：[`Zenobia000/Architecture_Autopilot`](https://github.com/Zenobia000/Architecture_Autopilot)

---

## 📜 授權與版權

| 項目 | 授權 |
|:---|:---|
| 規範文件（`docs/` / `archive/` / `specs/`） | © Smart Lock SaaS Platform，業主保留所有權 |
| DevTeam Harness 框架（`devteam_knowledge_base/` + `.claude/skills/` + `.claude/agents/`） | MIT License（與 Architecture_Autopilot 同源）|
| 第三方 reference（合約條文 / 法規條文）| 引用原條文版權所有人 |

---

## 🔗 重要連結

- **PRD 主檔**：[`docs/prd/smart-lock-saas.md`](./docs/prd/smart-lock-saas.md)
- **架構主檔**：[`docs/architecture/ARCH-0001-architecture-overview.md`](./docs/architecture/ARCH-0001-architecture-overview.md)
- **ADR 索引（66 條）**：[`docs/architecture/adr/INDEX.md`](./docs/architecture/adr/INDEX.md)
- **OpenAPI v1.0**：[`docs/architecture/api/openapi.yaml`](./docs/architecture/api/openapi.yaml)
- **Coding Agent Handoff**：[`specs/smart-lock-saas/handoff.md`](./specs/smart-lock-saas/handoff.md)
- **DevTeam 框架 OSS**：https://github.com/Zenobia000/Architecture_Autopilot

---

**Built with DevTeam Harness · v2.2 frozen 2026-05-24 · Single Source of Truth in [`docs/`](./docs/)**
