# DevTeam Skills 索引

業主提出痛點 → AI 扮演整個軟體開發團隊產出所有規範文件 → 交付給外部 coding agent。

模板形狀：Router + 角色 driver skills + critique persona sub-agents + 靜態 KB + JSON state + session 報告檔。

---

## 角色 Driver Skills

| 角色 / 用途 | Skill | 指令 |
| :----------- | :---- | :--- |
| 入口路由 + Phase DAG dispatcher | **devteam-router** | `/devteam` |
| PM driver（PRD / KPI / scope） | **devteam-pm** | `/devteam-pm` |
| BA+SA driver（system spec / rules） | **devteam-analyst** | `/devteam-analyst` |
| UX driver（user flow / state coverage / a11y） | **devteam-ux** | `/devteam-ux` |
| Architect driver（ADR / C4 / NFR） | **devteam-arch** | `/devteam-arch` |
| SD+DBA driver（API / ERD / migration） | **devteam-design** | `/devteam-design` |
| QA driver（test plan / exit criteria） | **devteam-qa** | `/devteam-qa` |
| DevOps+SRE driver（runbook / SLO / release） | **devteam-ops** | `/devteam-ops` |
| Session 狀態速覽 | **devteam-status** | `/devteam-status` |
| Freeze gate review 觸發 | (router 內建) | `/devteam-freeze` |
| 手動 review（任意文件） | (router + agents) | `/devteam-review` |
| **Forum-Lite 多輪辯論（Lane B）** | (router + agents) | `/devteam-forum` |
| **Roundtable 圓桌會議（Lane C, 探索性對話）** | **devteam-roundtable** | `/devteam-roundtable` |
| 對外 handoff（產 specs/handoff.md） | (router 內建) | `/devteam-handoff` |

---

## Critique Persona Agents

每個 freeze gate / 手動 review 時，由 router 並行 dispatch 對應 personas 做 critique，再由 orchestrator 合併。

| Persona | Agent | 最該盯的一件事 |
| :------ | :---- | :-------------- |
| PM | `devteam-pm-persona` | 問題定義 / KPI 可量測 / scope 對齊商業目標 |
| PO | `devteam-po-persona` | Backlog priority / accountable owner / iteration 切片 |
| BA | `devteam-ba-persona` | Stakeholder 覆蓋 / business rules 完整 / 合規 |
| SA | `devteam-sa-persona` | Use case 完整 / acceptance G/W/T / edge case |
| UX | `devteam-ux-persona` | Task success / state coverage / a11y |
| UI | `devteam-ui-persona` | Component state / token / responsive / handoff |
| Architect | `devteam-arch-persona` | Bounded context / NFR / failure modes / operability |
| SD | `devteam-sd-persona` | API 平行實作性 / error model / telemetry |
| DBA | `devteam-dba-persona` | Migration / PII / retention / index 策略 |
| QA | `devteam-qa-persona` | 可測性 / exit criteria 數值化 / 自動化 |
| DevOps | `devteam-devops-persona` | Pipeline gate / rollback 可執行 / 環境一致 |
| SRE | `devteam-sre-persona` | SLO/SLI / alert 可動作 / incident path |
| (merger) | `devteam-orchestrator` | 合併 N 份 critique 為單一 review report，失敗時降級 |
| (proposer) | `devteam-proposer` | Forum-Lite R1 提案 + R3 回應 critique；Lane B 專用 |
| (facilitator) | `devteam-facilitator` | Forum-Lite 三訊號 AND 收斂判定 + 升級裁決；Lane B 專用 |

---

## DevTeam KB

| KB 檔案 | 內容 |
| :--- | :--- |
| `01_role_responsibilities.md` | 12 persona 的 cheat sheet + RACI 表 + driver-persona 對應 |
| `02_lifecycle_phases.md` | Phase DAG + re-entry 規則 + cascade policy + stale 嚴重度 |
| `03_document_templates.md` | 範本索引 + 使用規則 |
| `04_freeze_gates.md` | 7 個 gate 的 owner / evidence / personas / intensity |
| `05_meeting_protocols.md` | Multi-role review prompt 模板 + orchestrator 合併邏輯 |
| `06_quality_attributes_catalog.md` | NFR / SLO / DORA / ISO 29148 / NIST SSDF / C4 / OpenAPI / Test Plan / Runbook 必填欄位 |

---

## DevTeam Templates（`devteam_knowledge_base/templates/`）

| 範本 | 用途 |
| :--- | :--- |
| `prd.md` | PRD（PM 產出） |
| `user-flow.md` | User Flow + State Coverage（UX 產出） |
| `system-spec.md` | Use cases + Business rules + State model（Analyst 產出） |
| `c4-l1.md` / `c4-l2.md` / `c4-l3.md` | C4 三層 diagram（Arch 產出） |
| `adr.md` | 架構性決策（Architect 寫） |
| `decision-record.md` | 非架構性決策（其他 role 寫） |
| `openapi.yaml` | API contract（Design 產出） |
| `erd.md` | ERD + Data dictionary + Migration plan（Design 產出） |
| `test-plan.md` | Test plan + Exit criteria + Defect triage（QA 產出） |
| `runbook.md` | Service runbook（Ops 產出） |
| `release-readiness.md` | Release go/no-go 證據（Ops 產出） |
| `handoff.md` | 對外 coding agent 契約（router 產出） |
| `forum-topic.md` | Forum-Lite 議題元資料（proposer + critics 共讀） |
| `forum-final-report.md` | Forum-Lite 收斂或升級報告（facilitator 產出） |
| `mom.md` | **Lane C Roundtable MoM** — 大廠 PM 風格會議紀錄（業主主要閱讀產出） |

---

## State 持久化

`.claude/context/devteam/` 三層拆分：
- `state.json` — session metadata + current_phase + freeze_gates + pending_decisions + cascade_policy
- `documents/index.json` + 每文件 `<doc>.meta.json` — 成熟度 / 版本 / deps / review_history
- `adr-ledger.json` — 跨 feature 決策鏈（ADR + DR）
- `session-<id>.md` — 互動 narrative
- `reviews/<gate>-<feature>-<date>.md` — multi-role critique 合併報告
- `evidence/<gate>-<feature>-<date>.md` — freeze 證據與業主簽核紀錄
- `forum/<topic-id>/round-{1,2,3}/*.md` + `final-report.md` — Forum-Lite 多輪辯論紀錄

---

## Lane A vs Lane B（雙軌 Review 機制）

| Lane | 觸發 | 用途 | Token |
|:-----|:-----|:-----|:------|
| **A — Critique Pipeline** | Freeze gate ready / `/devteam-review` | 單向 critique → orchestrator merge → 業主裁決 | 5-30k |
| **B — Forum-Lite** | Lane A 出現 `conflicts_count ≥ 2` 提示業主 / `/devteam-forum` | 多輪辯論收斂：proposer ↔ critics 來回 + facilitator 三訊號判定 | ~45k |
| **C — Roundtable**（MoM-first PoC） | 業主自然語言「對 X 開會」/「找 Y 跟 Z 討論」/ `/devteam-roundtable` | 探索性對話。**預設 background mode** — 龍蝦背景跑、業主不看 transcript，只讀大廠 PM 風格 MoM（Executive Summary / Decisions / Action Items / Open Questions）。業主只在 Open Questions 動。Drill-down 可叫 transcript。未來 migrate Discord | ~23k |

三 lane 並存。Lane A 處理 90% review；Lane B 處理跨領域 trade-off 與衝突收斂；Lane C 是早期探索 / brainstorm 對話，**業主投入時間 < 1 分鐘 / 場**（看 MoM + 回 Open Questions）。

---

## 流程速查

```
業主痛點 ──/devteam──▶ devteam-router
                        │
                  讀 state，依 Phase DAG
                        │
        ┌───────────────┼───────────────┐
        ▼               ▼               ▼
   P0_DISCOVERY    P1_ANALYSIS     P2_ARCHITECTURE
   devteam-pm   devteam-analyst   devteam-arch
                devteam-ux (並行)        │
        │               │                ▼
        ▼               ▼          P3_DESIGN
     Gate 1         Gate 2/3      devteam-design
        │               │                │
        └─ multi-role critique ─┐        ▼
           (personas + orch)    │     Gate 5a/5b
                                │        │
                                ▼        ▼
                            P4_DELIVERY  P5_RELEASE
                            devteam-qa   devteam-ops
                                │           │
                                ▼           ▼
                              Gate 6      Gate 7
                                            │
                                            ▼
                                   /devteam-handoff
                                            │
                                            ▼
                                    specs/<feature>/handoff.md
                                            │
                                            ▼
                                      外部 coding agent
```
