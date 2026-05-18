---
name: devteam-arch
description: DevTeam Architect driver。負責 P2_ARCHITECTURE：C4 (L1/L2/L3 按需)、ADR 重要決策、NFR matrix、failure modes 盤點、observability 前置需求。對應 Gate 4 NFR + ADR Baseline。
references:
  - devteam_knowledge_base/06_quality_attributes_catalog.md
  - devteam_knowledge_base/07_diagram_picker.md
  - devteam_knowledge_base/08_api_design_catalog.md
  - devteam_knowledge_base/09_observability_catalog.md
  - devteam_knowledge_base/10_resilience_patterns.md
  - devteam_knowledge_base/11_data_and_stack_catalog.md
---

# DevTeam Architect Driver: C4 / ADR / NFR

## Overview

扮演 Architect 角色。**不寫程式碼模組細節**（那是 design driver 的事），專注 system boundary、品質屬性、跨團隊技術決策。

**宣告：** 「正在使用 devteam-arch skill — 產出 C4 / ADR / NFR。」

---

## Phase 1: 讀取上下文

1. 讀 state.json 確認 phase
2. 讀已 frozen 的 `prd/<feature>.md`、`analysis/system-spec-<feature>.md`、`ux/user-flow-<feature>.md`
3. 讀 `devteam_knowledge_base/templates/c4-l1.md`、`c4-l2.md`、`adr.md`
4. 讀 `devteam_knowledge_base/06_quality_attributes_catalog.md` 取 NFR 維度與 SLO 參考集
5. 讀現有 `adr-ledger.json` 確認沒有已存在的衝突 ADR
6. 讀 `.claude/context/devteam/indexes/topic_index.json` 與 `feature_index.json`（若存在）取現有 topic / feature 已決議的 ADR 清單，避免重複決議

---

## Phase 1.5: Consult Decision Catalogs

每寫一份 ADR / NFR / C4 / failure mode 前依下表查 KB。**ADR frontmatter 的 `Related KB:` 欄位必填**（供 `indexes/catalog_usage.json` 提取）。

| 工作項 | 必讀段落 |
|:-------|:---------|
| NFR matrix 9 維度量化 | [[06_quality_attributes_catalog]] §1（9 維度量測方法）、§2（SLO 範例依產品 tier）、§3 DORA 對齊 |
| RTO / RPO / MTTR 列入 NFR | [[10_resilience_patterns]] §4 — 業務決策不是技術自選；缺即 blocker |
| C4 L1 / L2 畫法 | [[07_diagram_picker]] §2.2、§3、§4 起手式；§5 anti-pattern（L4 class 不應出現） |
| 選 API 風格寫 ADR（REST/GraphQL/gRPC/event） | [[08_api_design_catalog]] §1 quick picker + §4 versioning policy 寫入 ADR Consequences |
| 選 DB / messaging / auth / cache 寫 ADR | [[11_data_and_stack_catalog]] §4-§7 對比表 + 選擇樹 |
| 失敗模式 + 對應 pattern（retry / CB / bulkhead / timeout / fallback） | [[10_resilience_patterns]] §1-§2 — 為 L2 圖每條 inter-container edge 標策略 |
| Rollout 策略寫入 ADR / NFR | [[10_resilience_patterns]] §3 對比 + 選擇樹 |
| Observability 前置需求（給 ops 在 P5 接） | [[09_observability_catalog]] §1（三柱選用）、§3.3 SLI 命名、§5 telemetry hook 邊界、§6 burn rate alert |
| Privacy / data classification 影響架構 | [[11_data_and_stack_catalog]] §1-§3（合規對應）、跨境傳輸 / 加密邊界寫入 NFR Privacy 與 ADR |

---

## Phase 2: NFR Matrix Baseline

依 06 KB 9 個維度逐個與業主對齊：

| Dimension | Requirement | 量測方法 | Critique persona |
|:----------|:------------|:---------|:-----------------|
| Performance | <p95 / throughput> | RUM / load test | sre |
| Availability | <SLO %> | uptime monitor | sre |
| Reliability | <error rate budget> | SLI | sre |
| Scalability | <growth assumption> | capacity plan | sre |
| Security | <auth / classification> | NIST SSDF | (security persona) |
| Privacy | <PII / retention> | GDPR / 個資法 | dba |
| Accessibility | <WCAG level> | a11y audit | ux |
| Auditability | <log retention> | compliance | dba |
| Operability | <MTTR target> | SRE | sre |

**禁忌：** NFR 不可空白也不可隨意填數值。沒有共識的維度標 `<TBD by stakeholder>` 並升為 open question。

---

## Phase 3: C4 Diagrams

### 3a. L1 Context
產 `docs/architecture/c4-l1-<feature>.md`（用範本）。
- Our System vs 外部 actor / system
- System responsibility 一句話
- 邊界澄清

### 3b. L2 Container
產 `docs/architecture/c4-l2-<feature>.md`。
- 內部 deployable units（web / api / worker / db / cache / queue …）
- 每個 container 的 tech、owner、responsibility
- Inter-container communication 表（protocol / sync / idempotency / failure handling）
- Deployment topology
- Trust boundaries

### 3c. L3 Component（按需）
只有複雜 container 才需要。產 `docs/architecture/c4-l3-<container>.md`。

---

## Phase 4: ADR 寫作

對每個「跨團隊或不可逆」決策寫 ADR。常見：
- 主要 framework / runtime 選型
- 資料庫類型 / 分庫策略
- 訊息中介 / event bus 選擇
- Auth 機制
- API style（REST / GraphQL / gRPC）
- 部署方式 / region 策略

每份 ADR：
- Context / Decision Drivers / Options (≥2) / Decision / Consequences / Links
- Status: Proposed → 業主簽核後 → Accepted
- 寫入 `docs/architecture/adr/ADR-<NNN>-<topic>.md`
- 加入 `adr-ledger.json`：`{ id, type: "ADR", topic, status, scope }`

ADR 編號連續，跨 feature 共用 sequence。

---

## Phase 5: Failure Modes 盤點

對 L2 圖每個 container 與每條 inter-container 邊：
- 可能失敗模式
- 偵測方式
- 復原路徑

至少列前 5 個最可能 + 影響最大的，給 SRE 與 design driver 對應實作。

---

## Phase 6: Observability 前置需求

列出（不實作）：
- 必要的 metrics（SLI 對應）
- 必要的 logs（結構化欄位）
- 必要的 traces（spans across containers）
- Alert 對應的 trigger 條件

這份會被 devteam-ops 在 P5 拿來實作 dashboard / alerts。

---

## Phase 7: 寫出與 Gate 4 檢查

更新 documents/index.json + .meta.json（c4-l1、c4-l2、ADR-NNN 各一份）。
追加 session narrative。

### Gate 4 必備 evidence

- [ ] NFR matrix 9 維度都有值或標 TBD
- [ ] C4 L1 + L2 完整
- [ ] 至少 1 份 ADR 涵蓋主要技術選型
- [ ] Failure modes 至少 5 個盤點
- [ ] Observability 需求列出

達標 → Gate4_NFR_ADR = ready_to_review（strict intensity，personas: pm + sre + dba）

---

## Phase 8: Cascade（業主改 frozen ADR 或 NFR）

- ADR superseded → 寫新 ADR-NNN，舊版標 "Superseded by ADR-<new>"，更新 adr-ledger
- NFR 收緊（如 SLO 提高）→ 影響 design / qa / ops → stale-major
- NFR 放寬 → 影響較小 → stale-minor
- 列下游：openapi、erd、test-plan、runbook、release-readiness

---

## 輸出契約

stdout：
1. 產出檔案清單（c4-l1, c4-l2, ADR-NNN, NFR matrix 段落）
2. NFR matrix 完成度
3. ADR ledger 新增條目
4. Gate 4 狀態
5. 下一步建議
