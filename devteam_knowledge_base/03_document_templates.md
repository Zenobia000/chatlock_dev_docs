# 03 — Document Templates 索引

所有 DevTeam 規範文件範本都在 `devteam_knowledge_base/templates/`。Driver skill 產出時必讀對應範本，**先填能填的、無資訊處標 `<TBD by stakeholder>` 而非編造**。

---

## 範本清單

| 範本檔案 | 對應 docs/ 位置 | Owner driver | Owner persona | 何時用 |
|:---------|:----------------|:-------------|:--------------|:-------|
| `prd.md` | `docs/prd/<feature>.md` | devteam-pm | pm | P0 Discovery |
| `user-flow.md` | `docs/ux/user-flow-<feature>.md` | devteam-ux | ux | P1 Analysis（並行） |
| `system-spec.md` | `docs/analysis/system-spec-<feature>.md` | devteam-analyst | sa | P1 Analysis |
| `c4-l1.md` | `docs/architecture/c4-l1-<feature>.md` | devteam-arch | arch | P2 Architecture |
| `c4-l2.md` | `docs/architecture/c4-l2-<feature>.md` | devteam-arch | arch | P2 Architecture |
| `c4-l3.md` | `docs/architecture/c4-l3-<feature>.md` | devteam-arch | arch | P2 Architecture（按需） |
| `adr.md` | `docs/architecture/adr/ADR-<NNN>-<topic>.md` | devteam-arch | arch | 任何架構決策 |
| `decision-record.md` | `docs/architecture/dr/DR-<NNN>-<topic>.md` | 對應 driver | 對應 persona | 非架構決策（產品/流程） |
| `openapi.yaml` | `docs/api/openapi-<service>.yaml` | devteam-design | sd | P3 Design |
| `erd.md` | `docs/data/erd-<feature>.md` | devteam-design | dba | P3 Design |
| `test-plan.md` | `docs/qa/test-plan-<release>.md` | devteam-qa | qa | P4 Delivery |
| `runbook.md` | `docs/ops/runbook-<service>.md` | devteam-ops | devops | P5 Release |
| `release-readiness.md` | `docs/release/readiness-<date>.md` | devteam-ops | sre | P5 Release |
| `handoff.md` | `specs/<feature>/handoff.md` | (router 內建) | — | Gate 7 後 |

---

## 範本使用規則

### 1. 「填能填的、其他標 TBD」

絕不為了「看起來完整」而編造數值、persona、competitor。沒有資訊的欄位用：

```
<TBD by stakeholder>
<!-- ASSUMPTION: 假設 X，待 stakeholder 確認 -->
```

### 2. 版本控制在 frontmatter

每份文件開頭有 metadata block：

```markdown
> **Owner**: <role>
> **Status**: draft | reviewed | frozen | superseded
> **Version**: v<n>
> **Last updated**: <YYYY-MM-DD>
> **Related ADR/DR**: <ADR-NNN>, <DR-NNN>
```

### 3. 引用其他文件用相對路徑

```markdown
- Related PRD: docs/prd/<feature>.md
- See ADR-007: docs/architecture/adr/ADR-007-event-bus.md
```

不要用絕對路徑或 URL（這份文件會跟著 repo 移動）。

### 4. 對下游有強耦合的欄位要明示

特別是：
- PRD 的「Functional Requirements」→ system spec 的 use cases 來源
- System Spec 的 acceptance criteria → test plan 的 cases 來源
- OpenAPI 的 endpoint → frontend / coding agent 的 API client 來源
- ERD 的 table → migration script 來源

每份文件結尾應該有「Downstream consumers」段落（已在 `.meta.json` 內 `downstream_deps` 記錄）。

---

## 範本擴展

如果需要新範本（例：mobile release plan、security threat model），請：

1. 在 `templates/` 加新檔
2. 在本檔加一列
3. 在對應 driver skill 的 SKILL.md 補產出邏輯
4. 更新 `02_lifecycle_phases.md` 的 downstream 依賴關係表
