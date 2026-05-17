# 02 — Lifecycle Phases & Cascade Policy

DevTeam 的 phase machine 不是線性 enum，而是 **DAG with re-entry tokens**。每個 phase 都可以被「業主插入」回到並寫新 ADR/DR，但 cascade 預設不自動重跑下游。

---

## Phase DAG

```
P0_DISCOVERY ──▶ Gate1_PRD ──▶ P1_ANALYSIS ──┬─▶ Gate2_UXFlow ──┐
                                              │                  │
                                              └─▶ Gate3_SysSpec ─┤
                                                                 ▼
                                                          P2_ARCHITECTURE
                                                                 │
                                                                 ▼
                                                          Gate4_NFR_ADR
                                                                 │
                                                                 ▼
                                                            P3_DESIGN
                                                          ┌──────┴──────┐
                                                          ▼             ▼
                                                  Gate5a_API     Gate5b_DBSchema
                                                          └──────┬──────┘
                                                                 ▼
                                                            P4_DELIVERY
                                                                 │
                                                                 ▼
                                                          Gate6_TestReady
                                                                 │
                                                                 ▼
                                                            P5_RELEASE
                                                                 │
                                                                 ▼
                                                          Gate7_Release
                                                                 │
                                                                 ▼
                                                              Handoff
```

**re-entry token**：任何 phase 都可以被 `/devteam-<role>` 重新觸發，但要先寫新 ADR/DR 紀錄變更原因。

---

## Phase 定義

| Phase | 主導 driver | 平行可選 | 主要產出 docs/ | 對應 Gate |
|:------|:------------|:---------|:---------------|:----------|
| **P0_DISCOVERY** | devteam-pm | — | `prd/<feature>.md`、`governance/stakeholders.md` | Gate 1 |
| **P1_ANALYSIS** | devteam-analyst | devteam-ux | `analysis/system-spec-<feature>.md`、`ux/user-flow-<feature>.md`、`governance/rule-catalog.md` | Gate 2 + 3 |
| **P2_ARCHITECTURE** | devteam-arch | — | `architecture/c4-<feature>.md`、`architecture/adr/ADR-*.md`、NFR matrix | Gate 4 |
| **P3_DESIGN** | devteam-design | — | `api/openapi-<service>.yaml`、`data/erd-<feature>.md`、`data/migrations/*.sql` | Gate 5a + 5b |
| **P4_DELIVERY** | devteam-qa | — | `qa/test-plan-<release>.md`、exit criteria | Gate 6 |
| **P5_RELEASE** | devteam-ops | — | `ops/runbook-<service>.md`、`release/readiness-<date>.md`、`ops/slo.md` | Gate 7 |
| **P6_HANDOFF** | (router) | — | `specs/<feature>/handoff.md` | — |

---

## Phase 推進規則

1. **Forward**：當前 phase 對應的所有 freeze gates 都 `passed` → router 自動推進到下一 phase
2. **Re-entry**：業主執行 `/devteam-<role>` 觸發已過 phase 對應的 driver
   - driver skill 偵測該文件已 frozen → 自動寫新 ADR 或 DR（依分級）
   - 列出 cascade preview，等業主授權
3. **Parallel**：P1 的 analyst 與 ux 可同時推進，但兩個 gate 各自獨立 freeze
4. **Branch**：P3 的 API 與 DB Schema 可在同一 phase 內由 design driver 連續產出，兩個 gate 也獨立

---

## Cascade Policy

state.json 內 `cascade_policy` 三種值：

| 值 | 行為 |
|:---|:-----|
| `manual_confirm`（預設） | 列影響面，等業主下指令 `/devteam continue cascade` |
| `auto_cascade` | 偵測 stale 後自動重跑下游 driver（會觸發 review 風暴，慎用） |
| `ignore` | 只更新版本不重跑下游（適合純文字潤飾） |

---

## Stale 嚴重度分類

driver skill 偵測上游變更時，依以下規則標 stale：

| 嚴重度 | 觸發條件 | 行為 |
|:-------|:---------|:-----|
| `stale-major` | scope 變更、新 use case、新 NFR、API breaking change、schema migration 需求變化 | 必須重跑該 driver；重新走 freeze gate |
| `stale-minor` | KPI 微調、文字潤飾、補 open question 答覆 | 只需 owner 確認接受，不重新 dispatch review |
| `(no stale)` | 純 metadata（owner 改名、檔案搬移） | 無動作 |

---

## Downstream 依賴關係表

供 driver skill 判斷 cascade 影響面：

| 上游文件 | 直接下游 |
|:---------|:---------|
| `docs/prd/<feature>.md` | `ux/user-flow-*`、`analysis/system-spec-*` |
| `docs/ux/user-flow-<feature>.md` | `analysis/system-spec-*`、`qa/test-plan-*` |
| `docs/analysis/system-spec-<feature>.md` | `architecture/c4-*`、`architecture/adr/*`、`api/openapi-*`、`data/erd-*` |
| `docs/architecture/adr/ADR-*.md` | `api/openapi-*`、`data/erd-*`、`ops/runbook-*` |
| `docs/api/openapi-*.yaml` | `qa/test-plan-*`、`specs/<feature>/handoff.md` |
| `docs/data/erd-*.md` | `data/migrations/*`、`ops/runbook-*` |
| `docs/qa/test-plan-*.md` | `release/readiness-*` |

---

## Phase 進入/離開檢查清單

每個 driver skill 在開始與結束時都應自我檢查：

### 進入時
- [ ] 讀 state.json，確認當前 phase 與該 driver 匹配
- [ ] 讀 documents/index.json，確認上游依賴文件 status 為 `frozen` 或 `reviewed`
- [ ] 若上游有 `stale` → 提醒業主先解決上游，或明確覆寫繼續

### 離開時
- [ ] 更新 documents/index.json（新增 / 版本++）
- [ ] 寫對應 .meta.json（含 downstream_deps）
- [ ] 追加 session narrative
- [ ] 檢查對應 gate 的 evidence 條件（見 04 KB）
- [ ] 若達 ready_to_review，回報 router
