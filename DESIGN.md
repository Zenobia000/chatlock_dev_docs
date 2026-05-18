# DevTeam Harness — Design Document

> AI agent harness 扮演整個軟體開發團隊，產出規範文件而非程式碼，讓外部 coding agent 有明確依循、人類能透過文件了解狀況並加入開發。

本文件記錄設計動機、哲學、權衡與限制。讀完後你應該能回答：「為什麼是這樣設計？哪些考慮過但沒採用？以後要怎麼演進？」

---

## 1. 問題定義

### 1.1 為什麼需要這套東西

2026 年的 AI coding 已經把「寫出程式碼」壓到接近零成本。但真實軟體開發的痛點從來不是「打字慢」，而是：

1. **文件債（doc rot）**：寫了沒人讀、freeze 後實作偏離、半年後維運接手找不到當初決策原因
2. **架構漂移**：AI 沒有 tribal knowledge，不會去 Slack 問 senior，看不出 PRD 與實作不一致
3. **判斷外包陷阱**：把 problem definition、scope、trade-off 一起交給 AI 處理，會得到「看起來合理但長期維護爆炸」的方案
4. **缺乏可審計的決策鏈**：技術選型半年後沒人記得為什麼，新人 onboarding 靠口傳

這些都不是「程式碼問題」，是**規範文件 + 決策鏈管理**的問題。

### 1.2 本系統的定位

不是「AI 取代開發團隊」，而是：

- **業主**（提痛點的人）→ 不需懂技術細節
- **DevTeam Harness**（本系統）→ 產出所有規範文件 + 追蹤決策鏈 + 確保 freeze 不漏 evidence
- **外部 coding agent**（Claude Code / Cursor / Aider）→ 拿到 `specs/<feature>/handoff.md` 開工
- **人類開發者** → 隨時可讀 `docs/` 加入開發

**核心斷言：規範文件是 source of truth，程式碼是規範的具體化**。這對應 spec-driven development 與 "dark factory" 概念——當 coding agent 不會自己問問題、不會自己對齊上下游，規範文件就必須升格為一階公民。

---

## 2. 真實軟體團隊運作模式（設計依據）

設計前對「真實團隊怎麼運作」做了系統性整理（見 `deep-research-report.md`）。幾個關鍵觀察：

### 2.1 三條並行主線

不是序列式「PRD → UX → Architecture → Build」，而是三條並行：

- **User Flow**（PM/UX 主導）：使用者如何達標
- **System Flow**（BA/SA 主導）：業務規則與資料如何流動
- **Architecture Flow**（Architect/Dev Lead 主導）：系統邊界與品質屬性如何撐住

這三條從需求分析就同時開始，在關鍵決策節點對齊。

### 2.2 分層 Freeze 而非單一閘門

不同產出物有不同 freeze 時機：

| 產出物 | 何時 freeze | 為什麼 |
|:-------|:-----------|:------|
| PRD | 開發切片估算前 | 鎖問題定義 |
| UX Flow | 高保真 UI 與 FE 實作前 | 鎖互動 |
| NFR + ADR Baseline | Cross-team implementation 前 | 鎖品質屬性 |
| API Contract | FE/BE/Mobile 平行開發前 | 鎖跨團隊介面 |
| DB Schema | Integration test 前 | 鎖資料整合 |
| Test Ready | Full regression 前 | 鎖測試策略 |
| Release Ready | Production deploy 前 | 鎖上線證據 |

每個 freeze 都是 **baseline + change policy**，不是「永遠不能改」。改了要寫 ADR/DR，cascade 到下游。

### 2.3 角色看交付物，不看職稱

PM/PO/BA/SA/UX/UI/Architect/SD/DBA/QA/DevOps/SRE 這些角色，職稱在不同公司意思不一樣。真正能分清楚的是「誰對哪份輸出物負責、誰有最後決策權」。

### 2.4 不同議題召集不同人馬

```
PRD Review          → PM, PO, BA, UX, Dev Lead, Stakeholders
Design Critique     → UX, UI, PM, FE/Mobile, QA
Architecture Review → Architect, SA, Dev Lead, DBA, DevOps/SRE
API Contract Freeze → SD, FE, BE, Mobile, QA, SA
Data Design Review  → DBA, BE, Architect, QA, SRE
Test Readiness      → QA, Dev Lead, DevOps, PO
Release Readiness   → Dev Lead, QA, DevOps, SRE, PO
```

這是「臨時組隊」的真實樣貌，不是固定 12 個 persona 每次都到齊。

### 2.5 衝突解決四步

1. 先寫成選項，不要只講立場
2. 把 trade-off 明文化（時間 / 風險 / 成本 / 運維影響）
3. 能留下的決策寫 ADR
4. 只有在 deadline、風險承擔、資源衝突無法解時才升級

對應 Thoughtworks 的 **advice process**：靠近工作的團隊先決策，向受影響者求 advice，ADR 留下。

### 2.6 Fall back 是日常

PRD KPI 上線一個月才發現不反映用戶價值、選型撞牆、客服反饋規則矛盾、migration 在 prod 撞 lock——這些都是常態。設計必須擁抱「不可逆決策後仍能改」的事實。

---

## 3. 設計哲學七條

從上述觀察提煉的設計原則：

### 哲學 1: 規範文件是 Source of Truth

程式碼隨時可由 coding agent 重新生成，但「為什麼做、做什麼、不做什麼」必須有人類可審計的紀錄。所有 driver skill 的輸出都是 markdown 文件，不直接產 code。

### 哲學 2: 角色為軸，Phase 為 View

Skill 是「能力容器」（PM 能寫 PRD），phase 是「角色組合的 view」。`/devteam-arch` 任何時候都能叫，不一定要在 P2_ARCHITECTURE 階段。Phase 退化為 dashboard 而非控制流程。

### 哲學 3: ADR-style 決策鏈

所有重要決策寫 ADR/DR，**變更用 superseded 鏈而非覆寫**。半年後可以回溯「為什麼 OAuth 改成 SSO？」→ ADR-007 取代 ADR-001，看當初的 trade-off。

- **ADR**（Architectural Decision Record）：跨團隊、跨服務、不可逆、影響 NFR
- **DR**（Decision Record）：產品 / 流程 / 局部設計變更

兩者都進 `adr-ledger.json`，可 replay 重現任意時間點的 frozen state。

### 哲學 4: Freeze 不是鎖死，是 Baseline + Change Policy

每個 freeze gate 後文件可以再改，但要：
1. 對應 role 寫 DR/ADR 紀錄變更
2. 系統列 cascade impact preview（哪些下游 stale）
3. 業主授權後才標 stale 並重跑 driver

預設 `cascade_policy: manual_confirm`——避免 PRD 一改就觸發十幾個下游 review 風暴。

### 哲學 5: Multi-role Review 是 Critique 而非 Approval

Freeze gate 前 dispatch personas 並行 critique，**每個只盯自己最該盯的一件事**：

- PM 盯：問題值不值得做、KPI 可量測
- SRE 盯：可觀測、可回滾、SLO 真實
- DBA 盯：migration 可演練、PII / retention

Persona 不嘗試裁決衝突，orchestrator 不嘗試合理化分歧。最終裁決權永遠在業主。

### 哲學 6: 衝突要辯論不要投票

Lane A critique pipeline 是單向（critique → merge → 業主裁決）。當 critique 出現 `conflicts_count ≥ 2`，升級到 Lane B Forum-Lite 多輪辯論：

- R1: Proposer 提案 + trade-off 選項
- R2: Critics 並行 critique
- R3: Proposer 回應每條 blocker（accept / reject / modify）
- R3 末: Critics binary acknowledge（withdraw / retain / escalate）
- Facilitator: 三訊號 AND 判定收斂或強制升級

**不投票**（多 LLM agent 同模型輸出高度相關，投票會給假信心）。**不用 LLM 判斷「達成共識」**（會出現 sycophancy 假同意）。用結構化終止條件。

### 哲學 7: Token 預算與儀式負擔分級

不同議題用不同強度的 review：

| Intensity | 用途 | Token |
|:----------|:-----|:------|
| `light` | 低風險迭代版本 | ~3-5k |
| `standard` | 預設 | ~8-15k |
| `strict` | PRD / NFR / API / Schema / Release 高耦合 gate | ~20-30k |
| `dry-run` | 業主預覽 | <1k |
| `forum (Lane B)` | 跨領域 trade-off 與衝突收斂 | ~45k |

不是越嚴越好。Soft freeze 用 light，hard freeze 用 strict，trade-off 衝突才升 forum。

---

## 4. 架構決策與權衡

每個關鍵決策都附「為什麼選這個 / 考慮過什麼 / trade-off」。

### 4.1 命名前綴：`devteam-`

**選**：所有 skill / command / agent 用 `devteam-` 前綴。

**考慮過**：`saap-`（Software Architecture AutoPilot）、`spec-`、`devteam-`。

**為什麼**：使用者選了「角色為主軸」設計，前綴強調「團隊」而非「自動化工具」。

### 4.2 7 個 Driver Skill（合併 RACI 角色）

**選**：合併為 pm / analyst (BA+SA) / ux (UX+UI) / arch / design (SD+DBA) / qa / ops (DevOps+SRE)。

**考慮過**：11 個獨立 skill（每 RACI 角色一個）/ 極小 5 個（按 phase）。

**為什麼**：
- 11 個太碎，BA+SA 與 SD+DBA 與 DevOps+SRE 在實務上常合一（中小型團隊更明顯）
- 5 個太粗，丟失「角色為軸」的設計中心
- 7-8 個是 sweet spot：driver skill 是「主動產文件」單位，persona 是 review 視角，兩者解耦

### 4.3 Phase DAG with Re-entry，而非線性 Enum

**選**：Phase 是 DAG，任何 phase 都可 re-entry（業主 `/devteam-<role>` 改已 frozen 文件）。

**考慮過**：嚴格線性序列（TRIZ 模板原樣）/ 完全 event-driven 無預設順序。

**為什麼**：
- 嚴格線性違反「模糊到清晰、迭代式」的真實樣貌
- 完全無順序會讓業主迷失（哪個該先做？）
- DAG with re-entry 是中庸：有預設推進方向，但允許跨 phase 改動

### 4.4 State 三層 Schema

**選**：拆三層
- `state.json`（輕量：session metadata + phase + freeze gates）
- `documents/index.json` + 每文件 `<doc>.meta.json`（成熟度 / deps / review history）
- `adr-ledger.json`（跨 feature 決策鏈）

**考慮過**：單一 `state.json`（沿用 TRIZ 模板）/ 拆五層（每 phase 一個 state）。

**為什麼**：
- 單一 JSON 在多 feature 場景會膨脹到讀不動（5 features × 11 docs = 55 entries）
- 拆五層過度抽象（同類資料分散）
- 三層各有單一職責：state 是 session / index 是文件 / ledger 是決策

### 4.5 規範文件分散在 `docs/`，不在 `.claude/context/`

**選**：規範文件落在 repo 的 `docs/`（PRD / UX / Analysis / Architecture / API / Data / QA / Ops / Release）。

**考慮過**：全放 `.claude/context/devteam/`（沿用 TRIZ 模板，無 repo 污染）/ `specs/<feature>/`（一功能一目錄）。

**為什麼**：
- `.claude/context/` 是 harness 內部 state，業主拿不走「規範包」
- `specs/<feature>/` 跟「一個 release 含多 feature」場景衝突
- `docs/` 是業界慣例，coding agent 跟人類都認得

### 4.6 對外契約：`specs/<feature>/handoff.md`

**選**：所有 freeze 通過後產出單一 handoff brief 給 coding agent。

**為什麼**：coding agent 不該也不需要再讀 11 份分散文件推理依賴。handoff 是「合約」，列 frozen artifacts + acceptance + ADR index + telemetry hooks + 不變式（必須遵守的約束）。

### 4.7 Multi-role Review with Intensity Dial

**選**：4 檔 intensity（light / standard / strict / dry-run），預設依 freeze gate 風險分配。

**考慮過**：固定 N personas / 每 gate 全 12 personas / 業主每次手動選。

**為什麼**：
- 固定 N 不分輕重，PRD 跟 test-ready 用同強度 = 浪費
- 全 12 personas 每 gate = token 爆炸（18 次 sub-agent dispatch / 7 gates = 126 次）
- 業主手動選太煩 → 預設 + 業主可 override

### 4.8 Lane A + Lane B 雙軌（Phase 2 新增）

**選**：Critique Pipeline（Lane A）保留，Forum-Lite（Lane B）並存。

**考慮過**：全面換成 agent team 辯論 / 不做 Lane B / 完整 5-round forum + standing forums。

**為什麼**：
- 全面換掉太激進，90% review 適合 single-shot critique
- 不做 Lane B 會把所有衝突推給業主（業主可能不具備所有領域判斷力）
- 完整 5-round forum + standing forums 是過度設計（無 daemon 環境硬模擬週節奏會議）

採用最小可用 Forum-Lite：max 3 rounds + 三訊號 AND + ad-hoc only。

### 4.9 衝突自動升級提示，不自動觸發

**選**：Lane A `conflicts_count ≥ 2` 時 router 提示業主升級，業主確認才走 Lane B。

**考慮過**：自動觸發（不問）/ 業主完全手動 / ADR severity 自動分流。

**為什麼**：
- 自動觸發會 token 爆炸（誤判時 ~45k 直接燒掉）
- 完全手動可能漏判（業主可能不知道何時該升級）
- 自動分流要重寫 ADR template，過度工程

提示但不執行，業主裁判是中庸路線。

### 4.10 三訊號 AND 收斂，不用 LLM 自然語言

**選**：Facilitator 用結構化三訊號 AND（無新 blocker + 剩餘 ≤3 + binary acknowledge）。

**考慮過**：LLM 判斷「達成共識」/ Critic 投票 / Proposer 主動宣告收斂。

**為什麼**：
- LLM 判斷會 sycophancy 假同意（multi-agent 公認失敗模式）
- 多 LLM agent 同模型投票高度相關（假信心）
- Proposer 主動宣告 = 球員兼裁判
- 結構化三訊號可審計、可 replay、不依賴 LLM 判斷力

---

## 5. 雙軌 Review 機制詳解

### 5.1 Lane A — Critique Pipeline

```
freeze gate ready  /  /devteam-review <doc>
        │
        ▼
依 04 KB 查必到 personas + 預設 intensity
        │
        ▼
並行 dispatch N personas（按 intensity）
        │
        ├─ 每 persona 從自己視角讀文件 + state
        ├─ 產出 critique (blockers + suggestions + 通過 + 衝突點)
        │
        ▼
devteam-orchestrator 合併
        ├─ 去重升 Consensus Blocker
        ├─ 衝突點顯化（不裁決）
        ├─ 輸出結構化欄位（conflicts_count / escalation_recommended）
        │
        ▼
寫 reviews/<gate>-<feature>-<date>.md
        │
        ├─ conflicts_count < 2 → 業主直接裁決
        └─ conflicts_count ≥ 2 → router 提示業主升級到 Lane B
```

**用途**：90% 的 review（quality check、單一文件 critique、低風險變更）。

**Token**：5-30k 依 intensity。

### 5.2 Lane B — Forum-Lite

```
業主 /devteam-forum <doc> [--from-review=<id>] [--personas=A,B,C]
        │
        ▼
建 forum/<topic-id>/ + topic.md + active_forums entry
        │
        ▼
R1: devteam-proposer (mode=R1)
    ├─ 讀目標文件 + from-review（若有）
    ├─ 寫 round-1/proposer.md
    │   - 議題陳述
    │   - Affected dimensions（從 06 KB 9 維度）
    │   - Trade-off Options（≥2 個，禁兩全其美）
    │   - Proposer 傾向（必須有立場）
    │   - 給 critics 的問題（≤3）
        │
        ▼
R2: 並行 dispatch 指定 personas
    └─ 每 persona 從視角 critique（標準格式）
        │
        ▼
devteam-facilitator 第一次判定（R2 後 (a) 必 fail → continue）
        │
        ▼
R3: devteam-proposer (mode=R3)
    ├─ 讀所有 R2 critique
    ├─ 對每條 blocker 明文 accept / reject / modify
    ├─ 若 modify → 產出 Modified Option（如 Option A'）
        │
        ▼
R3 末: critics acknowledge round
    └─ 每 persona binary 勾選每條自己提的 blocker:
        [x] withdraw  [ ] retain  [ ] escalate
        │
        ▼
devteam-facilitator 終局判定（三訊號 AND）
        ├─ 全滿足 → converged → 寫 final-report → 升級業主
        ├─ 任一失敗 + round < max → continue（不會發生，已 max=3）
        ├─ 任一失敗 + round == max → escalated → 強制升級
        └─ parse fail (c) → degraded → 升級業主

業主裁決 → 走 /devteam-<role> 寫 ADR/DR + cascade
```

**用途**：跨領域 trade-off、衝突收斂、ADR 高耦合決策。

**Token**：~45k（1.8x strict review）。

### 5.3 兩 Lane 並存而非取代

| 場景 | 用哪條 |
|:-----|:-------|
| PRD 第一次 freeze | Lane A standard |
| API contract 變更 review | Lane A strict |
| 文字潤飾後 review | Lane A light |
| Test plan 例行 review | Lane A standard |
| PRD KPI 與 NFR latency 衝突 | Lane A → 偵測 conflicts ≥ 2 → 提示升 Lane B |
| 業主想對某 ADR 召集 SRE+DBA 辯論 | 直接 Lane B `/devteam-forum` |

Lane A 永遠是預設。Lane B 是升級選項。

---

## 6. ADR / DR 決策鏈設計

### 6.1 為什麼決策要寫成文件

半年後沒人記得「為什麼 OAuth 改成 SSO？」這種情況太常見。ADR/DR 是「決策的程式碼版本控制」——可審計、可 replay、可 supersede。

### 6.2 ADR vs DR 的分級

| 類型 | 適用 | Owner | 範例 |
|:-----|:-----|:------|:-----|
| **ADR** | 跨團隊 / 跨服務 / 不可逆 / 影響 NFR | Architect | Kafka vs RabbitMQ / auth 機制 / 分庫策略 |
| **DR** | 產品 / 流程 / 局部設計變更 | 對應 role | PRD scope 切割 / KPI 換指標 / test exit criteria 調整 |

兩者都進 `adr-ledger.json`，編號連續、跨 feature 共用。

### 6.3 Superseded 鏈

不可逆變更不能直接覆寫文件：

```
ADR-001 (Status: Superseded by ADR-007)
    │
    └─▶ ADR-007 (Status: Accepted)
        └─ Context: 為什麼取代 ADR-001
```

`adr-ledger.json` 可以 replay 任何時間點的 frozen state。

### 6.4 與 Cascade 機制連動

業主改 frozen 文件 → 自動寫對應 ADR/DR → 列下游 cascade impact preview → 業主授權後標 stale → 重跑 driver。整個鏈是顯性化、可追溯的。

---

## 7. State 三層 Schema 詳解

### 7.1 為什麼拆三層

單一 state.json 在多 feature × 多 release 場景會膨脹到讀不動。三層各有單一職責。

### 7.2 `state.json`（頂層，輕量）

```json
{
  "session_id": "2026-05-17-1430-subscription",
  "release_id": "R-2026Q2",
  "current_phase": "P2_ARCHITECTURE",
  "active_features": ["subscription-v1"],
  "freeze_gates": { "Gate1_PRD": "passed", ... },
  "pending_user_decisions": [...],
  "cascade_policy": "manual_confirm",
  "review_intensity_default": "standard",
  "active_forums": [...]
}
```

### 7.3 `documents/index.json` + `<doc>.meta.json`

`index.json` 全文件清單。每文件一個 `.meta.json` 含 version / owner / deps / review_history。拆檔避免 index 膨脹。

### 7.4 `adr-ledger.json`（跨 feature 決策鏈）

```json
[
  {"id": "ADR-001", "type": "ADR", "topic": "...", "status": "Superseded by ADR-007"},
  {"id": "ADR-007", "type": "ADR", "topic": "...", "status": "Accepted"},
  {"id": "DR-012", "type": "DR", "topic": "...", "status": "Accepted"}
]
```

跨 feature 共用，編號連續。

---

## 8. Persona 系統

### 8.1 12 個 Critique Personas

| Persona | 最該盯的一件事 |
|:--------|:-------------|
| PM | 問題 / KPI / scope 對齊商業目標 |
| PO | Backlog priority / accountable owner |
| BA | Stakeholder 覆蓋 / business rules / 合規 |
| SA | Use case / acceptance G/W/T / edge case |
| UX | Task success / state coverage / a11y |
| UI | Component state / token / responsive |
| Architect | NFR / boundary / failure modes / operability |
| SD | API 平行實作性 / error model |
| DBA | Migration / PII / index 策略 |
| QA | 可測性 / exit criteria 數值化 |
| DevOps | Pipeline / rollback / 環境一致 |
| SRE | SLO/SLI / alert 可動作 / incident path |

### 8.2 Driver 與 Persona 的關係

Driver skill = 主動產文件（如 `devteam-arch` 寫 ADR）。
Persona = freeze gate review 時的視角（如 `devteam-arch-persona` 從架構視角 critique）。

一個 RACI 角色可同時是 driver owner 與 critique persona，但兩者解耦——driver 是「能力容器」，persona 是「眼鏡」。

### 8.3 嚴禁幻覺角色

只能從 12 既有 personas 挑選，不允許 LLM 自由發明「devsecops-persona」「ml-engineer-persona」。這保證 review 視角邊界穩定、可審計。

---

## 9. Forum-Lite 多輪辯論機制

### 9.1 為什麼需要 Lane B

當前 critique pipeline 對 quality check 已夠，但有結構性缺口：

1. **Critique 是單向的** — persona 寫 critique → merge → 業主裁決，沒有「proposer 回應 → critic 反駁或撤回」的辯論
2. **衝突沒有收斂路徑** — orchestrator 明文「不裁決衝突」，全推給業主，但業主可能不具備所有領域判斷
3. **跨領域 trade-off 需要辯論** — 「API 改 breaking change 還是 deprecation」這種議題要 SD + QA + SRE + 消費端一起辯，不是各自寫個 critique 就能解

### 9.2 為什麼不做完整 5-round forum

考慮過完整 forum（5 round + standing forums + 衝突 4 步升級流程），但批判性權衡後砍掉：

- **Standing forums**（Product Triad / Architecture Review）— harness 無 daemon，週節奏會議是強行模擬人類文化
- **5 round 上限** — Token 6-10x strict review，邊際效益遞減
- **LLM 判斷收斂** — Sycophancy 假同意風險高
- **多 forum types** — 過早抽象，MVP 只需 ad-hoc

留下「Forum-Lite」最小可用版本：3 round + 三訊號 AND + binary acknowledge + ad-hoc only。

### 9.3 三訊號 AND 收斂判定

| 訊號 | 滿足條件 | 為什麼 |
|:-----|:---------|:------|
| (a) 連兩輪無新 blocker | round-N blocker 集合 ⊆ round-(N-1) | 證明辯論已飽和 |
| (b) 剩餘衝突 ≤ 3 | critics 標 retain/escalate 的 blocker ≤ 3 | 業主可裁決上限 |
| (c) Critics binary ack | 所有 critics 明文勾選 withdraw / retain / escalate | 不依賴 LLM 模糊判斷 |

**AND 而非 OR**：避免單一訊號偶然滿足造成假收斂。

### 9.4 觸發路徑

- **自動提示**：Lane A 出現 `conflicts_count ≥ 2` 時 router 顯示升級建議
- **業主主動**：`/devteam-forum <doc>` 任何時候可叫
- **不自動執行**：自動觸發會 token 爆炸 / 業主必須明文確認才走

---

## 10. 與外部 Coding Agent 的 Handoff

### 10.1 為什麼需要單一入口

Coding agent（Claude Code / Cursor / Aider）不會自己去 Slack 問 senior，不會自己 reverse-engineer 11 份分散文件的依賴關係。必須有單一 entry point。

### 10.2 `specs/<feature>/handoff.md` 結構

| 段落 | 內容 |
|:-----|:-----|
| Frozen Artifacts | 所有 frozen 文件的 path + version + SHA + owner |
| Acceptance Criteria | 從 system spec UC 萃取 |
| API Contract Ref | OpenAPI spec + breaking change policy |
| DB Migration Ref | Migration scripts + rollback |
| Out of Scope | Coding agent 不該動的範圍 |
| Test Plan Ref + Exit Criteria | QA test plan + 退出條件 |
| Runbook + Rollback Plan Ref | Ops 文件 |
| ADR Index (relevant only) | 只列 coding agent 需要懂的 ADR |
| Telemetry Hooks | Event / metric 對應的 emission 點 |
| Open Questions for Coder | 給 coding agent 看的歧義點 |
| 不變式 | Coding agent 必須遵守的約束 |

### 10.3 不變式範例

- 不得修改本 handoff 引用的 frozen 文件，需變更回 devteam 寫 ADR/DR
- API 變更必須維持 OpenAPI spec 的 backward compatibility
- DB migration 必須有對應 rollback
- 新功能不在本 handoff 範圍 → 回 devteam 新 session

---

## 11. 已知限制

### 11.1 Harness 無 Daemon

Claude Code 沒有背景常駐進程，所以：

- Standing forums（週節奏會議）無法主動觸發
- 自動「距上次 review 已 N 天」提示需依賴 Stop hook（次優）
- Cascade 偵測在業主每次互動時才跑，非即時

### 11.2 Sub-agent Stateless

每次 `Agent({subagent_type: ...})` dispatch 是獨立 context。多 round 辯論透過共享 markdown 檔案傳遞訊息，**不是真正的 multi-agent state**。這跟 AutoGen 之類真 multi-agent system 有本質差異。

### 11.3 LLM 行為依賴

- Critic acknowledge 依賴 LLM 正確輸出 binary 格式，parse fail 會觸發 degraded escalate
- Persona 視角邊界靠 prompt 約束，模型可能超界（如 PM persona 點技術細節）
- Orchestrator 合併品質依賴模型理解力

### 11.4 適用場景邊界

| 場景 | 適合 |
|:-----|:----:|
| 中型團隊 / 跨多角色 / 長期維運產品 | ✓ |
| 需要把架構知識傳給新人或 AI | ✓ |
| 規範文件需審計（合規 / 治理） | ✓ |
| 2-3 人 hackathon | ✗（過度結構化） |
| 早期探索性產品（problem statement 還在變） | ✗ |
| Legacy 維護直接套（無歷史 ADR） | ✗（需先補歷史紀錄） |
| 純內部腳本 / 一次性工具 | ✗ |

---

## 12. 未來演進

### 12.1 Phase 3 候選（觀察 Phase 2 使用 1 個月後）

- 若 forum 使用率 > 30%，考慮加 standing forums（Stop hook 提示「距上次 Architecture Review 已 N 天」）
- 若 conflict auto-escalation 漏判率高，調整 router 規則加入更多 signal（如 ADR severity / 觸及 hard-frozen 文件）
- 若 personas 經常不夠用，考慮開放「業主自訂 ad-hoc persona」機制
- 若 token 成本變痛點，考慮 session memory 讓後續 round 不必重讀完整文件

### 12.2 可能的擴展方向

- **Hook 整合**：UserPromptSubmit 自動注入 session snapshot、PostToolUse 偵測 docs/ 變更自動跑 cascade
- **MCP 整合**：把 ADR 同步到 GitHub Issues、把 freeze review 推到 Slack、從 Linear 拉 stakeholder feedback
- **Local-first inference**：高頻 critique 改用本地模型降成本
- **Multi-feature parallel session**：當前一個 session 管多 feature 但 state 不夠精細，未來可拆 release-level state

### 12.3 永久排除（不會做）

- 全面取代 Lane A（critique pipeline 是 90% review 的最優解）
- LLM 多 agent 同模型投票（高度相關 = 假信心）
- 自由發明 persona（必須從 12 既有挑選）
- 自動寫 ADR/DR 不經業主簽核（決策權永遠在人類）
- 自動執行 cascade 重跑（業主必須授權）

---

## 13. 設計演進歷史

| 階段 | 範圍 | 關鍵決策 |
|:-----|:-----|:--------|
| **Phase 1**（initial） | 9 driver skills + 12 commands + 13 agents（12 personas + orchestrator）+ 6 KB + 14 templates + 3 層 state | 角色為軸、ADR-style 決策鏈、Phase DAG with re-entry、freeze gate intensity dial、cascade manual_confirm |
| **Phase 2**（Forum-Lite） | +1 command + 2 agents + 2 templates + 5 修改既有檔案 | Lane A/B 雙軌、proposer + facilitator agents、三訊號 AND 收斂、conflict auto-escalation 提示 |

每階段都通過 Plan agent 壓力測試後落地，不是一次到位。

---

## 14. 核心心法

如果整份文件只能留三句話：

1. **規範文件是 source of truth，程式碼是規範的具體化。**
2. **角色為軸（能力容器），Phase 為 view（dashboard），ADR 為決策鏈（不可逆變更的 git）。**
3. **Freeze 是 baseline + change policy，不是鎖死；衝突要辯論不要投票；judgment 不可外包。**

口訣三句：

- 快不等於對
- 長不等於懂
- 能寫不等於能設計

---

## 15. 參考來源

設計過程主要參考（皆為公開資料）：

- 自有 `deep-research-report.md`：11 階段 × 12 角色 × 三條並行主線的真實團隊運作整理
- Scrum Guide：accountabilities 與 ceremonies
- ISO/IEC/IEEE 29148：requirement information items
- NIST SSDF：Secure Software Development Framework
- C4 model（Simon Brown）：架構分層抽象
- ADR（Michael Nygard / Thoughtworks）：架構決策記錄
- Google SRE Book：SLO / SLI / error budget
- DORA：四大交付指標
- Thoughtworks Tech Radar：advice process 反對重型 ARB
- Atlassian PRD template
- GitLab Handbook 設計文件流程
- OpenAPI 3.x specification

社群討論：Wes McKinney、Simon Willison、Armin Ronacher、Drew Breunig、Sonar State of Code 對 AI coding 的觀察都有引用。

---

**作者**：設計與實作由業主與 Claude 協作完成。所有重要決策皆有壓力測試（Plan agent critique）與業主明文裁決。

**版本**：Phase 2 — Forum-Lite Lane B 落地後。
