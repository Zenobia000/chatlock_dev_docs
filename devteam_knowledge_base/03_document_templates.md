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

---

## Reference Catalogs（KB 07-11）

Template 規範「填什麼欄位」，KB 07-11 規範「該選哪一個」。Driver skill 的 `Phase 1.5: Consult Decision Catalogs` 段會把工作項 → 必讀段落對應好，這裡只是索引。

| KB | 涵蓋 | 主要 driver 使用者 | 對應 critique persona |
|:---|:-----|:-------------------|:----------------------|
| `07_diagram_picker.md` | UML 7 種圖選擇樹、C4 4 層、ERD 3 種 notation、wireframe 4 個粒度、state coverage checklist | analyst / arch / design / ux | sa / arch / sd / ux |
| `08_api_design_catalog.md` | REST/GraphQL/gRPC/event 選型、resource / event naming、HTTP × domain error code、idempotency、versioning | analyst / arch / design / qa / ops | sd / qa |
| `09_observability_catalog.md` | log/metric/trace 三柱決策、SLI 命名、telemetry hook 邊界、alert routing、burn rate alert | arch / design / qa / ops | sre |
| `10_resilience_patterns.md` | retry/CB/bulkhead/timeout/fallback、藍綠/canary/feature flag、expand-contract migration、RTO/RPO/MTTR | arch / design / qa / ops | sre / arch |
| `11_data_and_stack_catalog.md` | 資料 4 級分類、PII 3 類、GDPR / 個資法欄位、DB / messaging / auth / cache 選型 | analyst / arch / design / qa / ops | dba |

### Template 與 KB 對應快表（重點欄位）

| Template | 該欄位 | 引用 KB |
|:---------|:-------|:--------|
| `system-spec.md` | State Model | KB 07 §2.1 |
| `system-spec.md` | Events | KB 08 §2.4 + §6.3 |
| `system-spec.md` | Integration Inventory | KB 08 §1、KB 11 §6 |
| `openapi.yaml` | Error schema + components | KB 08 §3.2 + §6.1 |
| `openapi.yaml` | Idempotency-Key | KB 08 §3.3 |
| `openapi.yaml` | x-governance.change_policy | KB 08 §4 |
| `erd.md` | Data Dictionary（含 jurisdictions / consent） | KB 11 §3.1 |
| `erd.md` | Migration Plan | KB 10 §3.5 expand-contract |
| `erd.md` | PII / Compliance Map | KB 11 §3.2 |
| `runbook.md` | Canary | KB 10 §3.3 |
| `runbook.md` | Rollback | KB 10 §3.5 |
| `runbook.md` | Alerts（含 runbook/dashboard link） | KB 09 §6 |
| `runbook.md` | Common Incidents | KB 10 §2 |
| `runbook.md` | Disaster Recovery RTO/RPO | KB 10 §4 |
| `release-readiness.md` | Rollout Strategy | KB 10 §3 |
| `release-readiness.md` | Compliance / Risk | KB 11 §3.2 |
| `test-plan.md` | Test Type Picker（in-template） | 本 template 內建 |
| `adr.md` | Tags / Feature / Related KB（供 indexes 提取） | `.claude/context/devteam/indexes/README.md` |

### ADR / DR 索引機制

每份 ADR / DR 必含 frontmatter 三欄：`Tags:`、`Feature:`、`Related KB:`。這三欄由 router 在寫入後 rebuild 成 `.claude/context/devteam/indexes/` 下三份 derived 檔，供：

- 新 driver 接手某 feature 時，快查既有決議避免衝突
- arch driver 起草新 ADR 前，快查相關 topic 既有 ADR
- 累積 KB 引用 case law（觀察哪些 KB 段真被引用 / 哪些設計失敗無人用）

**目錄結構（runtime，由 router 動態建立，不入 repo）**：

```
.claude/context/devteam/
├── adr-ledger.json              # source of truth, append-only（driver 寫入）
└── indexes/                     # derived，router post-hook rebuild
    ├── feature_index.json       # { "<feature-slug>": [ADR/DR entries] }
    ├── topic_index.json         # { "<tag>": [ADR/DR entries] }
    └── catalog_usage.json       # { "<KB filename>": [ADR/DR entries with section] }
```

**Rebuild 來源**：
1. `.claude/context/devteam/adr-ledger.json` 內的 ledger entry
2. `docs/architecture/adr/ADR-*.md` frontmatter（`Tags:`、`Feature:`、`Related KB:`）
3. `docs/architecture/dr/DR-*.md` 同上

**Rebuild 時機**：driver 寫入新 ADR / DR 後（router post-hook）；router session 初始化時 lazy rebuild（若 indexes 不存在或舊於 adr-ledger.json）；手動 `/devteam-status --rebuild-indexes`。

**Schema 範例**：

```json
// feature_index.json
{
  "<feature-slug>": [
    {"id": "ADR-007", "title": "Event bus choice", "status": "Accepted", "date": "2026-05-18", "scope": "orders"}
  ]
}

// topic_index.json
{
  "messaging": [{"id": "ADR-007", "feature": "orders-mvp", "date": "2026-05-18"}],
  "auth":      [{"id": "ADR-012", "feature": "user-auth", "date": "2026-05-20"}]
}

// catalog_usage.json
{
  "08_api_design_catalog.md": [
    {"id": "ADR-009", "section": "§3.2 error code structure", "feature": "orders-mvp"}
  ]
}
```

**規則**：ADR / DR 缺三欄之一 → 不阻擋寫入，但於 Phase 5a critique 時請 arch persona 補；KB 完全無人引用 → 設計失敗信號，應於 retrospective 檢討。
