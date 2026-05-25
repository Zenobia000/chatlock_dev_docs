# Architecture Autopilot — DevTeam Harness

> 業主提出痛點 → AI agent harness 扮演整個軟體開發團隊 → 產出所有規範文件 → 交給外部 coding agent 實作。

把「梳理邏輯、產出規範、追蹤決策鏈、確保 freeze 不漏 evidence」這些勞役式的工作 harness 化，讓業主把心力放在**架構品味與系統判斷**——這是 AI 取代不了的稀缺能力。

---

## 為什麼做這件事

AI Agent 把「寫程式碼」壓到零成本，但真正稀缺的不是打字速度，是**上下文管理、驗證能力、架構品味、責任承擔**。本系統不取代這些判斷——它把判斷之外的事自動化：

- **產出 PRD / User Flow / System Spec / ADR / C4 / OpenAPI / ERD / Test Plan / Runbook / Release Readiness** — 真實軟體團隊會有的文件全部都產
- **依照 Phase DAG 迭代式推進** — 不是序列式一步到位，從模糊到清晰，每次變更都寫 ADR/DR 並追蹤 cascade
- **Freeze gate 前自動 multi-role critique** — 12 個角色視角並行 review，orchestrator 合併，業主只裁決不勞役
- **最後產出 handoff brief** — 給 Claude Code / Cursor / Aider 一個入口，coding agent 不需要再讀 11 份分散文件推理依賴

設計依據：本 repo 內的 [`archive/strategy/deep-research-report.md`](./archive/strategy/deep-research-report.md)（11 階段 × 12 角色 × 三條並行主線 × 分層 freeze 的真實軟體團隊運作模式）。

---

## 快速開始

在這個 repo 內開啟 Claude Code，輸入：

```
/devteam 我要做訂閱制讀書筆記系統，痛點是試用 7 天後流失率太高
```

接下來會發生：

1. Router 建立 session（state.json / documents/index.json / adr-ledger.json / session narrative）
2. 進入 **P0_DISCOVERY** → dispatch `devteam-pm` 寫 PRD draft 到 `docs/prd/`
3. 達 **Gate 1 PRD Freeze** 條件 → 自動 dispatch `ba + sa + ux` 三 personas 並行 critique → orchestrator 合併為 review report
4. 業主裁決 → frozen → 進入 **P1_ANALYSIS**（`devteam-analyst` 與 `devteam-ux` 並行）
5. ...依此類推到 P5_RELEASE
6. 最後 `/devteam-handoff <feature>` → 產出 `specs/<feature>/handoff.md` 交給外部 coding agent

任何時刻：

- `/devteam-status` 看 phase / freeze gate / 文件成熟度 / pending decisions / stale 清單
- `/devteam-<role> "改 X"` 手動插入變更（已 frozen 文件會自動寫 DR 並列 cascade preview）
- `/devteam-review <doc>` 對任意文件做 multi-role critique（不需 gate ready）

---

## 12 個指令

| 指令 | 用途 |
| :--- | :--- |
| `/devteam` | 主入口，依 Phase DAG 路由 |
| `/devteam-pm` | P0 / PRD |
| `/devteam-analyst` | P1 / System Spec + Rules |
| `/devteam-ux` | P1 / User Flow + State Coverage |
| `/devteam-arch` | P2 / ADR + C4 + NFR |
| `/devteam-design` | P3 / OpenAPI + ERD + Migration |
| `/devteam-qa` | P4 / Test Plan + Exit Criteria |
| `/devteam-ops` | P5 / Runbook + SLO + Release Readiness |
| `/devteam-status` | Session 狀態速覽 |
| `/devteam-freeze <Gate>` | 觸發 freeze gate multi-role review |
| `/devteam-review <doc>` | 任意文件 critique |
| `/devteam-handoff <feature>` | 產 handoff.md 給 coding agent |

---

## Phase DAG

```
P0_DISCOVERY ──▶ Gate1_PRD ──▶ P1_ANALYSIS (analyst + ux 並行)
              ──▶ Gate2_UXFlow + Gate3_SystemSpec ──▶ P2_ARCHITECTURE
              ──▶ Gate4_NFR_ADR ──▶ P3_DESIGN ──▶ Gate5a_API + Gate5b_DBSchema
              ──▶ P4_DELIVERY ──▶ Gate6_TestReady
              ──▶ P5_RELEASE ──▶ Gate7_Release ──▶ Handoff
```

任何 phase 都可 re-entry（業主用 `/devteam-<role>` 改已 frozen 的文件），但**變更必寫 ADR/DR**，cascade 預設為 `manual_confirm` 避免 review 風暴。

---

## 12 個 Critique Persona + Orchestrator

每個 freeze gate 前並行 dispatch 對應 personas，每個只盯自己「最該盯的一件事」：

| Persona | 最該盯的一件事 |
| :------ | :-------------- |
| PM | 問題 / KPI / scope 對齊商業目標 |
| PO | Backlog priority / accountable owner |
| BA | Stakeholder 覆蓋 / business rules 完整 / 合規 |
| SA | Use case / acceptance G/W/T / edge case |
| UX | Task success / state coverage / a11y |
| UI | Component state / token / responsive |
| Architect | NFR / boundary / failure modes / operability |
| SD | API 平行實作性 / error model |
| DBA | Migration / PII / index 策略 |
| QA | 可測性 / exit criteria 數值化 |
| DevOps | Pipeline gate / rollback 可執行 |
| SRE | SLO/SLI / alert 可動作 / incident path |

`devteam-orchestrator` 收 N 份 critique → 去重 → 分類為 Consensus Blocker / Per-Persona / Suggestions / Conflicts → 寫 review report 給業主裁決。失敗時降級為列原始 critique。

Intensity dial：`light` (1 persona) / `standard` (2 + orchestrator) / `strict` (3 + 衝突點顯化) / `dry-run`。

---

## Repo 結構

```
architecture_autopilot/
├── README.md                       ← 本檔
├── .claude/
│   ├── CLAUDE.md                   ← 專案層 instructions
│   ├── USAGE.md                    ← 使用指南
│   ├── settings.json
│   ├── skills/                     ← 9 個 driver skill + INDEX.md
│   ├── commands/                   ← 12 個 slash commands
│   ├── agents/                     ← 13 個 critique agents (12 personas + orchestrator)
│   └── context/devteam/            ← session state（執行時建立）
│       ├── state.json
│       ├── documents/index.json + <doc>.meta.json
│       ├── adr-ledger.json
│       ├── session-<id>.md
│       ├── reviews/
│       └── evidence/
├── devteam_knowledge_base/
│   ├── 01_role_responsibilities.md
│   ├── 02_lifecycle_phases.md
│   ├── 03_document_templates.md
│   ├── 04_freeze_gates.md
│   ├── 05_meeting_protocols.md
│   ├── 06_quality_attributes_catalog.md
│   └── templates/                  ← 14 份規範文件範本
├── docs/                           ← driver skills 產出的真實規範文件（依 feature）
│   ├── prd/
│   ├── ux/
│   ├── analysis/
│   ├── architecture/c4-*.md + adr/ + dr/
│   ├── api/openapi-*.yaml
│   ├── data/erd-*.md + migrations/
│   ├── qa/test-plan-*.md
│   ├── ops/runbook-*.md + slo.md + postmortem/
│   └── release/readiness-*.md
├── specs/<feature>/handoff.md      ← 對外 coding agent 契約
├── archive/strategy/deep-research-report.md  ← 設計依據文件
├── CLAUDE_TEMPLATE.md              ← 通用初始化範本
├── MCP_SETUP_GUIDE.md
└── .mcp.json.*.example
```

---

## 規範產出 → 外部 Coding Agent

所有 7 個 freeze gate passed 後，執行：

```
/devteam-handoff subscription-v1
```

會產出 `specs/subscription-v1/handoff.md`，包含：

- Frozen artifacts（path + version + SHA + frozen_at）
- Acceptance criteria
- API contract ref
- DB migration ref
- Test plan ref + exit criteria
- Runbook ref + rollback plan
- ADR index (only relevant)
- Telemetry hooks
- Open questions for coder
- 不變式（coding agent 必須遵守的約束）

把這個檔案連同 `docs/` 整包丟給 Claude Code / Cursor / Aider，coding agent 從一個入口開工，不需要也不應該再讀 11 份分散文件推理依賴。若 coding agent 發現歧義 → 回呼 `/devteam-<role>` 觸發新 ADR/DR。

---

## 設計哲學

1. **角色為軸** — Skill 是「能力容器」（PM 能寫 PRD），phase 是「角色組合的 view」
2. **ADR-style 決策鏈** — 所有重要決策寫 ADR / DR，變更用 superseded 鏈而非覆寫；ADR 跨團隊不可逆，DR 產品 / 流程局部
3. **Freeze 不是鎖死** — 是讓並行不失控的 baseline + change policy
4. **Cascade 預設 manual_confirm** — 避免 PRD 一改就 18 次 sub-agent dispatch
5. **Multi-role review intensity dial** — 高耦合 gate（PRD / NFR / API / Schema / Release）才 strict，其餘 standard，迭代版本可 light
6. **State 三層拆分** — `state.json` 輕量 + `documents/index.json` + 每 doc `.meta.json` + `adr-ledger.json`，避免單一 JSON 膨脹

完整哲學見 `.claude/CLAUDE.md`、`.claude/USAGE.md`、`devteam_knowledge_base/` 6 份 KB。

---

## 名稱由來

`architecture_autopilot` — 不是「AI 取代架構師」，而是「把架構師的勞役工作（產文件、追決策鏈、確保 freeze evidence）打 autopilot，讓人專注在真正稀缺的判斷上」。

口訣：**快不等於對，長不等於懂，能寫不等於能設計**。

---

## 📁 專案文件導航（智慧鎖平台 2026-Q1）

> 2026-05-22 重新歸檔。新結構以「**生命週期階段**」分層：策略 → 來源 → 會議 → 決策 → 規範。

> [!IMPORTANT]
> **2026-05-25 大重構**：開發團隊**單一事實 = [`docs/`](./docs/)**。舊 0/2/3/4 目錄已整併進 [`archive/`](./archive/)（歷史 reference）或 `docs/` 對應 subdir（仍 active 的內容）。

| 區塊 | 資料夾 | 用途 | 關鍵入口 |
|:---|:---|:---|:---|
| 🎯 **Single Source of Truth** | [`docs/`](./docs/) | 開發團隊的唯一規範（PRD v2.2 / 66 ADR / OpenAPI / ERD / Test Plan / Runbook / Policy）| [`docs/prd/smart-lock-saas.md`](./docs/prd/smart-lock-saas.md)（PRD 主檔）<br>[`docs/architecture/ARCH-0001-architecture-overview.md`](./docs/architecture/ARCH-0001-architecture-overview.md)（架構主檔）<br>[`docs/architecture/adr/INDEX.md`](./docs/architecture/adr/INDEX.md)（ADR 索引）|
| 🚚 **給 coding agent 的 handoff** | [`specs/`](./specs/) | 7 freeze gate 通過後給開發團隊接手的入口 | [`specs/smart-lock-saas/handoff.md`](./specs/smart-lock-saas/handoff.md) |
| 📚 **歷史 reference（純存底）** | [`archive/`](./archive/) | superseded PRD-0001 / 業主拍板會議 / 痛點 strategy / Excel 原始規格 | [`archive/strategy/PAIN-POINTS-SUMMARY-2026-05-21.md`](./archive/strategy/PAIN-POINTS-SUMMARY-2026-05-21.md)（F1~F7 失敗劇本）<br>[`archive/meetings/2026-05-22/decision-dashboard.html`](./archive/meetings/2026-05-22/decision-dashboard.html)（互動式 ADR 圈選）<br>[`archive/prd-baseline/PRD-0001-2026-q1-v1-launch.md`](./archive/prd-baseline/PRD-0001-2026-q1-v1-launch.md)（baseline，superseded by docs/prd/smart-lock-saas.md v2.2）|
| 🧠 **DevTeam harness 框架** | [`devteam_knowledge_base/`](./devteam_knowledge_base/) · [`.claude/`](./.claude/) | 12 persona + 7 driver skill + 範本 + voice profile | [`devteam_knowledge_base/voice-profiles.md`](./devteam_knowledge_base/voice-profiles.md) |

### 推薦閱讀路徑

| 我是誰 | 從哪入手 |
|:---|:---|
| **新加入的工程師** | [`docs/prd/smart-lock-saas.md`](./docs/prd/smart-lock-saas.md) → [`docs/architecture/ARCH-0001`](./docs/architecture/ARCH-0001-architecture-overview.md) → [`docs/architecture/adr/INDEX.md`](./docs/architecture/adr/INDEX.md) → [`specs/smart-lock-saas/handoff.md`](./specs/smart-lock-saas/handoff.md) |
| **PM / BA** | [`docs/prd/smart-lock-saas.md`](./docs/prd/smart-lock-saas.md) → [`docs/analysis/system-spec-smart-lock-saas.md`](./docs/analysis/system-spec-smart-lock-saas.md) → [`archive/strategy/PAIN-POINTS-SUMMARY-2026-05-21.md`](./archive/strategy/PAIN-POINTS-SUMMARY-2026-05-21.md) |
| **法務 / 合規** | [`docs/prd/smart-lock-saas.md`](./docs/prd/smart-lock-saas.md) §合約 4.4 → [`docs/governance/legal-memo-retrospective-review.md`](./docs/governance/legal-memo-retrospective-review.md) → ADR-0042（RBAC）+ ADR-0050（Evidence）+ ADR-0051（Retention）+ ADR-VCH-001（Voucher Keeper）|
| **DPO / 個資官** | [`docs/policy/br-pii-001.rego`](./docs/policy/br-pii-001.rego) → ADR-0061 DGS → ADR-PII-002 資料極小化 |
| **QA / Test Lead** | [`docs/qa/test-plan-smart-lock-saas.md`](./docs/qa/test-plan-smart-lock-saas.md) → [`docs/analysis/system-spec-smart-lock-saas.md`](./docs/analysis/system-spec-smart-lock-saas.md) BR-X catalog |
| **DevOps / SRE** | [`docs/ops/runbook-smart-lock-saas.md`](./docs/ops/runbook-smart-lock-saas.md) → [`docs/ops/release-readiness.md`](./docs/ops/release-readiness.md) → [`docs/architecture/nfr-matrix-smart-lock-saas.md`](./docs/architecture/nfr-matrix-smart-lock-saas.md) |
| **AI Specialist** | ADR-0028 charter + ADR-0047 Forbidden + ADR-0055 SKILL↔LLM 解耦 + ADR-0057 RAG（皆在 [`docs/architecture/adr/`](./docs/architecture/adr/)）|
| **業主回顧決策** | [`archive/meetings/2026-05-22/decision-dashboard.html`](./archive/meetings/2026-05-22/decision-dashboard.html)（瀏覽器開）+ [`.claude/context/devteam/`](./.claude/context/devteam/) MoM / forum final reports |
