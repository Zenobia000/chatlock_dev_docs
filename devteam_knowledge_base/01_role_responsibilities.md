# 01 — Role Responsibilities & RACI

DevTeam 區分 **driver skill**（主動產文件的角色）與 **critique persona**（freeze review 時的視角）。Driver = 「能力容器」，Persona = 「眼鏡」。同一個 RACI 角色可同時是 driver owner 與 critique persona。

---

## 11 Personas Cheat Sheet

| Persona | 最該盯的一件事 | 最重要交付物 | 最晚不能錯過 | Critique 視角 |
|:--------|:--------------|:-------------|:------------|:--------------|
| **PM** | 問題值不值得做 | PRD / KPI | 進入 delivery planning 前 | scope 對不對齊商業目標、KPI 是否可量測 |
| **PO** | 優先順序是否一致 | Ordered Backlog | Sprint planning 前 | 是否值得排進這個迭代、與其他 item 互斥嗎 |
| **BA** | Stakeholder 與規則是否漏掉 | Stakeholder Map / Rule Catalog | System analysis 前半段 | 規則完整性、stakeholder 覆蓋、合規 |
| **SA** | 系統行為是否可驗收 | System Spec | Architecture/System design 前 | use case 完整性、acceptance 可驗、edge case 覆蓋 |
| **UX** | 核心任務是否走得通 | User Flow / Prototype | UI handoff 前 | task success、error/empty/loading state、a11y |
| **UI** | 開發規格是否足夠精準 | Hi-fi / Component Spec | FE/Mobile build 前 | state coverage、token、responsive、handoff 完整 |
| **Architect** | 重要決策是否可追溯 | C4 / ADR / NFR | API/DB freeze 前 | bounded context、failure mode、operability、演進路徑 |
| **SD** | 模組設計是否可平行實作 | Module Design / API Spec | Implementation 前 | 模組責任清晰、API 穩定、平行可實作性 |
| **DBA** | migration 是否可演練 | DDL / Migration / Data Dict | Integration 前 | schema 變更可回滾、retention、PII、index |
| **QA** | 品質證據是否成立 | Test Plan / Completion Report | Go/No-Go 前 | 可測、exit criteria 明確、自動化覆蓋 |
| **DevOps** | 是否可重複部署 | Pipeline / Runbook | Release 前 | pipeline gate、rollback、env 自動化 |
| **SRE** | 是否可觀測、可回滾 | SLO / Alerts / Postmortem | Release 前與後 | observability、SLO、error budget、incident path |

---

## RACI 表（交付物 × 角色）

R = Responsible（執行），A = Accountable（最終負責），C = Consulted（諮詢），I = Informed（被告知）

| 交付物 / 決策 | PM/PO | BA/SA | UX/UI | Architect | Dev Lead | DBA | QA | DevOps/SRE | Stakeholders |
|:--------------|:------|:------|:------|:----------|:---------|:----|:---|:-----------|:-------------|
| Problem Statement / KPI | A | C | C | I | I | I | I | I | C |
| PRD | A | R | C | C | C | I | C | I | C |
| User Flow / Wireframe | C | C | A/R | I | C | I | C | I | C |
| System Spec | C | A/R | C | C | C | C | C | I | I |
| ADR / C4 / NFR | I | C | I | A/R | C | C | C | C | I |
| API Spec | I | C | C | C | A/R | I | C | I | I |
| DB Schema / Migration | I | C | I | C | C | A/R | C | C | I |
| Test Plan / Exit Criteria | I | C | C | I | C | I | A/R | C | I |
| Runbook / Rollback | I | I | I | C | C | I | C | A/R | I |
| Release Go/No-Go | C | I | I | C | R | C | R | R | I |

---

## Driver Skill 與 Persona 的對應

| Driver Skill | 涵蓋的 RACI 角色 | Owner critique persona | 邊界提醒 |
|:-------------|:-----------------|:----------------------|:---------|
| devteam-pm | PM, PO | pm + po | PM 偏商業/scope；PO 偏 backlog priority。同人可兼。 |
| devteam-analyst | BA, SA | ba + sa | BA 管 stakeholder/rules；SA 管 system spec。overlap 大但仍可區辨。 |
| devteam-ux | UX, UI | ux + ui | UX 流程；UI 視覺與 handoff。 |
| devteam-arch | Architect | arch | C4/ADR/NFR 都這裡。 |
| devteam-design | SD, DBA | sd + dba | SD 管 API/Module；DBA 管 schema/migration。 |
| devteam-qa | QA | qa | Test plan + exit criteria。 |
| devteam-ops | DevOps, SRE | devops + sre | DevOps 管 pipeline；SRE 管 SLO/observability/incident。 |

---

## Critique Persona 的責任邊界

freeze gate 前的 multi-role review，每個 persona 只該關注**自己最該盯的事**（見第一張表「最該盯的一件事」）。

### 標準 critique 輸出格式

每個 persona agent 產出三段：

```markdown
## [persona-name] critique on docs/<path>

### 重大阻礙（必修才能 freeze）
- [B-1] ...
- [B-2] ...

### 建議調整（可接受但建議改）
- [S-1] ...

### 通過項
- 哪些段落符合 persona 視角

### 跨 persona 衝突點
（若有，列出與其他 persona 觀點的潛在衝突）
```

由 `devteam-orchestrator` 合併為單一 review report。
