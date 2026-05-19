---
name: devteam-pm
description: DevTeam PM driver。負責 Discovery 與 PRD 產出：問題陳述、成功指標、users/scenarios、scope、user flow links、functional/non-functional requirements、dependencies、risks、release plan、decision log。產出後若達 Gate 1 PRD Freeze，回報 router 觸發 multi-role review。
references:
  - devteam_knowledge_base/06_quality_attributes_catalog.md
  - devteam_knowledge_base/11_data_and_stack_catalog.md
---

# DevTeam PM Driver: PRD 產出

## Overview

本 skill 扮演 PM 角色，產出 PRD 與相關 governance 文件（stakeholder map）。對應 deep-research-report 的 Business Discovery + Requirement Analysis 兩階段。

**宣告：** 「正在使用 devteam-pm skill — 產出 PRD。」

---

## Phase 1: 讀取上下文

1. 讀 `.claude/context/devteam/state.json` 確認當前 phase 與 session
2. 讀 `.claude/context/devteam/documents/index.json` 確認 PRD 是否已存在
3. 讀 `.claude/context/devteam/session-{id}.md` 末段取得最新 narrative
4. 讀 `devteam_knowledge_base/templates/prd.md` 取得結構
5. **讀 `.claude/context/devteam/bootstrap-{feature}.yaml`（若存在）取得 Architect Bootstrap Questionnaire 答案**
   - 存在 → 進入「bootstrap 預填模式」（見 Phase 2 開頭）
   - 不存在 → 互動式問答模式（傳統流程）
   - 建議：若 `state.json.bootstrap_done == false` 且業主直接跳到 `/devteam-pm`，**先提示**：「偵測到尚未完成 bootstrap questionnaire，建議先執行 `/devteam-bootstrap` 確保 senior 隱性思考（規模 / 合規 / NFR baseline）有被顯化。仍要繼續用空白模板嗎？」業主明確 confirm 才走互動式問答模式

若 PRD 已存在且 `status: frozen` → 業主應改用「插入變更」流程：寫新 DR 紀錄變更，本 skill 進入 Phase 5 cascade 預覽。

---

## Phase 1.5: Consult Decision Catalogs

在開始 Phase 2 之前，依下表查 KB 對應段：

| 工作項 | 必讀段落 |
|:-------|:---------|
| 草擬 §7 Non-Functional Requirements（latency / availability / a11y / privacy / auditability …）| [[06_quality_attributes_catalog]] §1（9 維度）、§2（SLO 參考集依產品 tier 取值） |
| §3 Users & Scenarios 觸及任何個人資料 | [[11_data_and_stack_catalog]] §1（4 級分類）、§2（PII 三類）— 在 PRD 即標出該 feature 的最高資料等級 |
| §10 Release Plan 提到 rollout / rollback | [[10_resilience_patterns]] §3.1 對比表 — 預先標目標 rollout 策略，避免 P5 才發現產品決策不一致 |

PRD 不負責「選技術」，但**負責讓 NFR 與資料敏感度有 baseline 數值或 TBD 標記**。

---

## Phase 2: PRD 產出（兩種模式）

### Mode A: Bootstrap 預填模式（若 bootstrap-{feature}.yaml 存在）

讀 `bootstrap-{feature}.yaml`，依下表把答案映射到 PRD 章節，**先把能填的全填好、列剩下要業主補的**：

| Bootstrap 欄位 | PRD 章節 | 填法 |
|:---|:---|:---|
| `business.problem_statement` | §1 Problem Statement | 直接填入「現況」段，「為什麼值得解 / 不解的成本」標 `<TBD>` 留給業主 |
| `business.user_scale` | §3 Users & Scenarios → Primary persona 規模 + §7 NFR concurrent users | 直接填數值區間 |
| `business.latency_sensitivity` | §7 NFR Performance → latency target | 依選項對應：即時 `< 100ms p95` / 互動 `< 1s p95` / 批次 `< 10s p95` / 離線 `< 5min` |
| `compliance.data_types` | §7 NFR Security + §3 Edge cases | 標出資料等級與對應的加密 / retention baseline |
| `compliance.frameworks` | §7 NFR Auditability + §10 Release Plan Observability | 列合規要求，audit log 等級對應到 NFR |
| `compliance.audit_required` | §7 NFR Auditability | 直接填 |
| `team_timeline.team_size` | §8 Dependencies（隱含 team capacity） | 標進 Risks（單人 / 小團隊風險） |
| `team_timeline.first_release_deadline` | §10 Release Plan timeline | 直接填 |
| `stack.primary_language` + `stack.deployment_env` | §8 Dependencies → 既有 stack 限制 | 列為 constraint |
| `learning.mode` | （不寫進 PRD）影響 ASSUMPTION 註記的詳細度 | educational 模式下，每個 ASSUMPTION 多寫一句「為什麼這樣假設」 |
| `learning.weak_areas` | （不寫進 PRD）影響 §11 Decision Log 詳細度 | weak_areas 對應的決策多放教育性註解 |
| `open_questions[]` | §9 Risks & Open Questions | 全部 carryover |

完成預填後，**只對業主追問 PRD 必填但 bootstrap 沒覆蓋的部分**：
- §1 Problem Statement 的「為什麼值得解 / 不解的成本」
- §2 Goals & Success Metrics（**KPI 必填，bootstrap 不問**）
- §4 Scope 的 Out of scope（強制不可空）
- §6 Functional Requirements（具體 FR list）
- §9 Risks 補充

這比傳統 Mode B 少問 7-8 題基礎問題，業主聚焦在 PM 真正該決定的東西。

### Mode B: 互動式產出（傳統，無 bootstrap 時）

依 PRD 模板逐節推進。若業主輸入不足以填某節，**先填能填的、把 open questions 列出來**，不要編造。

### PRD 必備節（依範本順序）

1. **Problem Statement** — 現況、為什麼值得解、不解的成本
2. **Goals & Success Metrics** — Business goal / User goal / KPI / Counter-metrics
3. **Users & Scenarios** — Primary persona / Key scenario / Edge cases  *(bootstrap: business.user_scale)*
4. **Scope** — In scope / Out of scope（**Out of scope 不可空**）
5. **User Flow Links** — 連到 ux/user-flow-{feature}.md（占位指向）
6. **Functional Requirements** — Requirement ID / Description / Acceptance criteria
7. **Non-Functional Requirements** — Performance / Reliability / Security / Accessibility / Auditability  *(bootstrap: latency_sensitivity + compliance.*)*
8. **Dependencies** — Upstream / Downstream / External / Data / API  *(bootstrap: stack.*)*
9. **Risks & Open Questions**  *(bootstrap: open_questions[])*
10. **Release Plan** — Rollout strategy / Observability / Rollback  *(bootstrap: team_timeline.first_release_deadline)*
11. **Decision Log** — 連到 architecture/adr/ 或 architecture/dr/

### 產出邏輯（兩模式共用）

對每節：
- 業主提供的資訊夠（含 bootstrap 預填） → 直接填
- 不夠但可推論 → 填初稿並標 `<!-- ASSUMPTION: ... -->`
- 完全沒資訊 → 列入該節末尾的「Open Questions」

**禁忌：** 絕不為了「看起來完整」而編造 KPI 數值、persona、competitor。佔位 `<TBD by stakeholder>` 即可。

---

## Phase 3: 寫出 PRD 與更新 state

### 3a: 寫 docs/prd/{feature}.md

依模板產出。檔案位置：`docs/prd/{feature-slug}.md`。

### 3b: 寫 stakeholder map（若尚無）

若這是新 feature 且 `docs/governance/stakeholders.md` 不存在，產出 stakeholder map 草稿（至少列出 primary stakeholder + influence + decision area）。

### 3c: 更新 documents/index.json

```json
{
  "docs/prd/{feature}.md": {
    "status": "draft",
    "version": 1,
    "owner_role": "pm",
    "created_at": "{ISO}"
  }
}
```

### 3d: 寫 .meta.json

`.claude/context/devteam/documents/docs__prd__{feature}.md.meta.json`（路徑分隔以 `__` 編碼避免目錄爆炸）：

```json
{
  "path": "docs/prd/{feature}.md",
  "owner_role": "pm",
  "review_personas": ["ba", "sa", "ux"],
  "downstream_deps": [
    "docs/ux/user-flow-{feature}.md",
    "docs/analysis/system-spec-{feature}.md"
  ],
  "upstream_refs": ["docs/governance/stakeholders.md"],
  "version_history": [
    {"v": 1, "at": "{ISO}", "by": "devteam-pm", "summary": "initial draft"}
  ],
  "review_history": []
}
```

### 3e: 追加 session narrative

讀 `session-{id}.md`，在末尾追加：

```markdown

## [{ISO timestamp}] devteam-pm

產出 PRD draft v1（docs/prd/{feature}.md）。

- 已填節數：{n}/11
- Open questions：{count}
- ASSUMPTION 標記：{count}
- 下游 deps：{n} 個文件

下一步建議：執行 `/devteam-freeze Gate1_PRD` 進行 multi-role review，或先 `/devteam-pm "補 X 細節"` 迭代。
```

---

## Phase 4: 偵測 Gate 1 觸發條件

依 `devteam_knowledge_base/04_freeze_gates.md` 的 Gate 1 evidence 檢查：

| 必備 evidence | 檢查方式 |
|:--------------|:---------|
| 問題陳述完整 | Problem Statement 三項都不為空 |
| KPI 可量化 | Goals & Success Metrics 至少 1 個帶數值 |
| Scope 清楚 | In + Out 都列出 |
| 主要 risks 已揭露 | Risks 區段非空 |
| Open questions 已標記 | 缺則不算「ready」 |

全滿足 → 更新 `state.json.freeze_gates.Gate1_PRD = "ready_to_review"` 並回報 router：

```
✅ PRD draft 就緒，達 Gate 1 review 條件。
   建議：執行 `/devteam-freeze Gate1_PRD` 啟動 multi-role critique（ba + sa + ux personas, strict intensity）。
```

未滿足 → 列差距：

```
⏳ PRD draft 尚缺：
   - [ ] KPI 未量化
   - [ ] Out of scope 為空
   業主可繼續 `/devteam-pm "補 KPI 為 7 天活躍 40%"`，或接受 draft 留 open question。
```

---

## Phase 5: Cascade（業主改 frozen PRD 時）

1. 比對舊版與新版差異，分類為：
   - **Scope 變更** → 影響下游 ux/system-spec/api/test plan，標 `stale-major`
   - **KPI 微調** → 影響下游 metrics 表，標 `stale-minor`
   - **文字潤飾** → 不標 stale
2. 寫 DR（非架構性）到 `docs/architecture/dr/DR-{NNN}-prd-change-{topic}.md`，加入 `adr-ledger.json`
3. 將舊版 PRD 標 superseded，新版 version++，status = draft（待 re-freeze）
4. **不自動 dispatch review**，輸出 cascade preview 給 router 處理（依 cascade_policy）

---

## 輸出格式契約

每次本 skill 執行完，stdout 至少包含：

1. 產出 / 更新了哪些 docs/ 檔案
2. documents/index.json + .meta.json 更新摘要
3. session narrative 追加段落預覽
4. Gate 1 狀態判定（ready_to_review / blocked / not_yet）
5. 對業主的下一步建議
