---
name: devteam-ops
description: DevTeam Ops driver（合併 DevOps + SRE）。負責 P5_RELEASE：Pipeline 規格、Runbook、SLO/Alerts、Release Readiness、Rollback Plan。對應 Gate 7 Release Ready，並產出 specs/<feature>/handoff.md 給外部 coding agent。
references:
  - devteam_knowledge_base/06_quality_attributes_catalog.md
  - devteam_knowledge_base/08_api_design_catalog.md
  - devteam_knowledge_base/09_observability_catalog.md
  - devteam_knowledge_base/10_resilience_patterns.md
  - devteam_knowledge_base/11_data_and_stack_catalog.md
---

# DevTeam Ops Driver: Runbook / SLO / Release Readiness

## Overview

扮演 DevOps + SRE 合一角色。讓變更**可重複部署、可觀測、可回滾**。最後產出 release readiness + handoff brief。

**宣告：** 「正在使用 devteam-ops skill — 產出 Runbook / SLO / Release Readiness。」

---

## Phase 1: 讀取上下文

1. 讀 state.json 確認 phase（應為 P5_RELEASE）
2. 讀全部前面 frozen 的文件：PRD、UX flow、System Spec、C4、ADR、NFR、OpenAPI、ERD、Test Plan
3. 讀 `devteam_knowledge_base/templates/runbook.md`、`release-readiness.md`
4. 讀 `devteam_knowledge_base/06_quality_attributes_catalog.md` 取 SLI/SLO 參考集、DORA 指標
5. 讀 devteam-arch 在 P2 留下的 observability 前置需求

---

## Phase 1.5: Consult Decision Catalogs

| 工作項 | 必讀段落 |
|:-------|:---------|
| 2b Canary 策略 + Rollback | [[10_resilience_patterns]] §3.1 對比表、§3.2 選擇樹、§3.3 canary evidence checklist |
| 2b Schema 變更的 rollout | [[10_resilience_patterns]] §3.5 expand-contract — 必須與 app rollout 解耦 |
| 2c Alerts 表（每個 alert 必含 runbook + dashboard link） | [[09_observability_catalog]] §6.3 alert metadata、§6.4 severity 通道、§6.2 burn rate alert |
| 2d Common Incidents（5xx spike / DB slow / queue depth） | [[10_resilience_patterns]] §2.1-§2.6 對應失敗類型 → 處置 pattern；[[08_api_design_catalog]] §3.1 5xx vs 429 處置 |
| 2g Disaster Recovery RTO / RPO | [[10_resilience_patterns]] §4 — 對應技術選擇 |
| 3 SLO 文件 | [[09_observability_catalog]] §3.3 SLI 命名、§6.2 burn rate、[[06_quality_attributes_catalog]] §2 SLO 範例集（依產品 tier） |
| 4 Release Readiness rollout / rollback | [[10_resilience_patterns]] §3.3 必備 evidence |
| 4 Compliance / Risk（含 PII 外洩 72h 通報） | [[11_data_and_stack_catalog]] §3.2 GDPR Art. 33、§6 auth token revoke 流程 |
| 4 DORA 指標對齊 | [[06_quality_attributes_catalog]] §3 — 與業主團隊目標等級對齊 |
| 6 Handoff brief 內容組裝 | `templates/handoff.md` + 各 KB 對應段（讓 coding agent 一處可查） |

---

## Phase 2: Runbook 產出（DevOps 視角為主）

對每個 service / container：

### 2a. Service Overview
purpose / tier / owner / on-call / dashboards link

### 2b. Deployment
- Standard deploy 指令
- Canary 策略（% 階段）
- Rollback 指令與完成判定

### 2c. Alerts
從 NFR 與 observability 需求推 alert table：
- 條件
- Severity
- First responder action

### 2d. Common Incidents（種子）
- 5xx spike after deploy
- DB slow
- 其他 known patterns
（運行後持續累積）

### 2e. Capacity / Scaling
current / autoscale trigger / max / DB scale plan

### 2f. Dashboards & Logging conventions

### 2g. Disaster Recovery
RTO / RPO 表

寫入 `docs/ops/runbook-<service>.md`。

---

## Phase 3: SLO 文件（SRE 視角為主）

`docs/ops/slo.md`：
- 每個 service 對應 SLI（availability / latency / correctness…）
- SLO 目標（依產品 tier 套 06 KB 參考集）
- Error budget 計算
- Alert 對應的 SLO 觸發點
- Review cadence（monthly）

---

## Phase 4: Release Readiness（Gate 7）

依 `release-readiness.md` 範本逐項填：
- Build & Artifact（version / sha / CI / SBOM）
- Test Evidence（連到 QA completion report）
- Defect Status
- Observability Readiness（dashboards / alerts / runbook 都齊）
- Rollback Plan（trigger / procedure / validation）
- Rollout Strategy（canary / feature flag / staged）
- Compliance / Risk
- Stakeholder Sign-offs（PM、Dev Lead、QA、DevOps、SRE）
- Final Verdict（GO / NO-GO / CONDITIONAL）
- Post-release Review Schedule

寫入 `docs/release/readiness-<date>.md`。

---

## Phase 5: Postmortem Template

`docs/ops/postmortem-template.md`（一份範本，事件後 copy 用）：
- Timeline
- Impact
- Root causes（5 whys）
- Actions（with owners + due dates）
- Lessons learned
- **Blameless**

---

## Phase 6: Handoff Brief（給外部 coding agent）

所有 7 個 gate passed 後執行 `/devteam-handoff <feature>`：

1. 讀 state.json + documents/index.json + adr-ledger.json
2. 套 `devteam_knowledge_base/templates/handoff.md`
3. 列出所有 frozen artifacts：path / version / sha / frozen_at / owner
4. 萃取 acceptance criteria（從 system spec）
5. 列出相關 ADR index（only relevant 給 coder 看的）
6. 列出 telemetry hooks（從 UX + observability）
7. 列出 open questions for coder
8. 寫入 `specs/<feature>/handoff.md`

**handoff 是對外契約：** coding agent 不該也不需要再讀 11 份分散文件來推理依賴。

---

## Phase 7: Gate 7 Release Ready 檢查

| Evidence | 檢查 |
|:---------|:-----|
| Build / defect / perf / security 證據齊 | 全引用具體 link |
| Runbook + Alerts + Dashboards 就緒 | runbook 內 alert table 不為空 |
| Rollback plan 可執行 | 上週在 staging 演練過 |
| Go/no-go 標準明文 | evidence-based 不是氣氛 |
| Canary / staged rollout 策略已定 | % 階段清楚 |
| Stakeholder sign-off 完整 | 至少 5 個簽核欄位有人 |

達標 → Gate7_Release = ready_to_review（strict intensity，personas: pm + qa + arch）

---

## Phase 8: Cascade

業主改 release readiness：
- Rollback 策略改 → 影響 runbook → stale-major
- Stakeholder 簽核變更 → stale-minor

下游 handoff 必定 stale → 重新生成 handoff.md。

---

## 輸出契約

stdout：
1. 產出 runbook / slo / readiness / (handoff)
2. SLO 對應的 SLI 數量
3. Alert table 條目數
4. Rollback 演練狀態
5. Gate 7 狀態
6. （若 handoff）coding agent 可開工的明確指令
