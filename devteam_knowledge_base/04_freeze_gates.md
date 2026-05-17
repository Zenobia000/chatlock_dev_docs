# 04 — Freeze Gates

7 個 freeze gates 的 owner、必備 evidence、預設 review intensity、必到 personas。

**設計原則：** Freeze 不是鎖死，是讓並行不失控。每個 gate 都允許後續變更（透過寫新 ADR/DR + cascade），但變更要明文留下決策鏈。

---

## 7 個 Freeze Gates 總表

| Gate | 名稱 | Owner driver | 預設 intensity | 必到 review personas |
|:-----|:-----|:-------------|:---------------|:--------------------|
| 1 | PRD Freeze | devteam-pm | **strict** | ba, sa, ux |
| 2 | UX Flow Freeze | devteam-ux | standard | pm, qa |
| 3 | System Spec Freeze | devteam-analyst | standard | arch, qa |
| 4 | NFR + ADR Baseline | devteam-arch | **strict** | pm, sre, dba |
| 5a | API Contract Freeze | devteam-design | **strict** | pm, qa, sre |
| 5b | DB Schema Freeze | devteam-design | **strict** | arch, qa, sre |
| 6 | Test Ready | devteam-qa | standard | dev-lead, devops |
| 7 | Release Ready | devteam-ops | **strict** | pm, qa, arch |

---

## Gate 1: PRD Freeze

**Owner**: devteam-pm（PM persona）

**必備 evidence**:
- [ ] Problem Statement 三項都填（現況 / 為什麼解 / 不解的成本）
- [ ] 至少 1 個可量化 KPI
- [ ] Primary persona + Key scenario 已定義
- [ ] In-scope 與 Out-of-scope 都列出
- [ ] 主要 risks 已揭露
- [ ] Open questions 已標記（不可以「沒問題」帶過）

**Review personas**:
- `ba`: stakeholder 是否齊、商業規則是否合理
- `sa`: 需求是否可翻成系統規格
- `ux`: persona 與 scenario 是否支援設計

**變更規則**: PRD frozen 後再改 → 寫 `DR`（產品決策），影響 scope 升格為 `ADR`。

---

## Gate 2: UX Flow Freeze

**Owner**: devteam-ux

**必備 evidence**:
- [ ] 核心任務 flow 完整（入口 → 成功）
- [ ] Error path、empty state、loading state 都列
- [ ] a11y 檢查項已標
- [ ] 高風險互動已有 prototype 或驗證假設

**Review personas**:
- `pm`: flow 是否支援 PRD scenarios
- `qa`: 可測性 + 測試 hook 是否存在

---

## Gate 3: System Spec Freeze

**Owner**: devteam-analyst

**必備 evidence**:
- [ ] use cases 完整（含 actor / trigger / steps / acceptance）
- [ ] business rules 表（每條有 ID + source + priority）
- [ ] 例外流與 edge case 已列
- [ ] 外部依賴與假設可追溯
- [ ] Acceptance criteria 可被 QA 直接使用

**Review personas**:
- `arch`: 系統行為是否需要新架構決策
- `qa`: acceptance 是否可測

---

## Gate 4: NFR + ADR Baseline

**Owner**: devteam-arch

**必備 evidence**:
- [ ] NFR matrix（latency / availability / security / a11y / auditability）已 baseline
- [ ] 至少 1 份 ADR 涵蓋主要技術選型
- [ ] C4 Level 1（Context）+ Level 2（Container）已畫
- [ ] Failure modes 初步盤點
- [ ] Observability 需求已前置（不是上線前才補）

**Review personas**:
- `pm`: NFR 是否回應 KPI 與商業目標
- `sre`: SLO / 可觀測 / rollback 路徑是否可行
- `dba`: 資料相關 NFR（retention / PII / audit）是否被涵蓋

---

## Gate 5a: API Contract Freeze

**Owner**: devteam-design

**必備 evidence**:
- [ ] OpenAPI 3.x spec 完整（endpoint + schema + auth + error code）
- [ ] Idempotency / rate limit / timeout 政策明示
- [ ] Mock server 可生成
- [ ] FE / BE / QA 能依此 contract 平行工作
- [ ] Breaking change 政策已寫入 `x-governance`

**Review personas**:
- `pm`: contract 是否支援所有 use cases
- `qa`: error / edge case 是否可測
- `sre`: rate limit / timeout / error code 是否與運維能力對齊

---

## Gate 5b: DB Schema Freeze

**Owner**: devteam-design（DBA persona）

**必備 evidence**:
- [ ] Logical model + Physical model 完整
- [ ] Migration script + Rollback script 都演練過
- [ ] Backfill 策略已定（若需要）
- [ ] Index / retention / PII map 已標
- [ ] 資料一致性與整合測試假設可驗證

**Review personas**:
- `arch`: schema 是否符合 bounded context
- `qa`: 測試資料策略可行
- `sre`: backup / capacity / migration 風險可承受

---

## Gate 6: Test Ready

**Owner**: devteam-qa

**必備 evidence**:
- [ ] Test plan：scope / levels / env / data / cases / automation / exit criteria
- [ ] 測試環境就緒，資料策略可行
- [ ] Non-functional test 覆蓋（perf / security / a11y）已規劃
- [ ] Defect triage 規則清楚

**Review personas**:
- `dev-lead`（合併到 arch persona 觀點）: 測試覆蓋與切片是否對齊
- `devops`: pipeline gate 是否能執行測試

---

## Gate 7: Release Ready

**Owner**: devteam-ops（Dev Lead / SRE persona）

**必備 evidence**:
- [ ] Build / defect / perf / security 證據齊
- [ ] Runbook + Alerts + Dashboards 已就緒
- [ ] Rollback plan 可執行（不只是寫「rollback」）
- [ ] Go / No-go 標準明文，依 evidence 決策非氣氛
- [ ] Canary / staged rollout 策略已定

**Review personas**:
- `pm`: 是否符合 release plan 的 rollout
- `qa`: defect 已清或被接受
- `arch`: 重大架構風險已標 known + mitigation

---

## Review Intensity Dial

| 等級 | 行為 | Token 規模 | 適用 |
|:-----|:-----|:-----------|:-----|
| `light` | 1 persona self-critique | 低 | 低風險 gate、迭代版本 |
| `standard` | 2 personas 並行 + orchestrator 合併 | 中 | 預設 |
| `strict` | 3 personas 並行 + orchestrator + 衝突點顯化 | 高 | PRD/NFR/API/Schema/Release |
| `dry-run` | 列 critique 框架不真實 dispatch | 極低 | 業主預覽用 |

業主可在 state.json 改 `review_intensity_default`，或對個別 gate 用 `/devteam-freeze <gate> --intensity=<level>`。

---

## Evidence 儲存

每個 gate 的 evidence 寫入 `.claude/context/devteam/evidence/<gate>-<feature>-<date>.md`，至少含：

```markdown
# Evidence: <gate> — <feature>

> **日期**: <ISO>
> **Owner driver**: <driver>
> **Intensity**: <level>

## Checklist 滿足項
- [x] ...
- [x] ...

## Review report
連到 .claude/context/devteam/reviews/<gate>-<feature>-<date>.md

## 業主裁決
- 接受項: ...
- 拒絕項 + 理由: ...
- 後續 follow-up: ...
```
