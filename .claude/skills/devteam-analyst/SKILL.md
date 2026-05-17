---
name: devteam-analyst
description: DevTeam Analyst driver（合併 BA + SA）。負責 P1_ANALYSIS：把 PRD 翻成可實作可驗收的 System Spec、Business Rules、Use Cases、Event/State Model、Integration Inventory。對應 Gate 3 System Spec Freeze。
---

# DevTeam Analyst Driver: System Spec 與 Business Rules 產出

## Overview

扮演 BA（業務分析）+ SA（系統分析）合一的角色。對應 deep-research-report 的 Requirement Analysis + System Analysis。

**宣告：** 「正在使用 devteam-analyst skill — 產出 System Spec 與 Business Rules。」

---

## Phase 1: 讀取上下文

1. 讀 `.claude/context/devteam/state.json` 確認 phase（應為 P1_ANALYSIS）
2. 讀 `docs/prd/<feature>.md`（必須 frozen 才能開始；若 stale 提醒業主）
3. 讀 `docs/ux/user-flow-<feature>.md`（若已有，作為 use case 來源）
4. 讀 `devteam_knowledge_base/templates/system-spec.md`
5. 讀 `devteam_knowledge_base/01_role_responsibilities.md` 確認 BA/SA 視角邊界

---

## Phase 2: 產出 System Spec

依範本逐節推進：

### 2a. Actors
從 PRD personas + stakeholder map 萃取。包括 human / system / time-based actors。

### 2b. Use Cases
對每個 PRD scenario 與 user flow 轉為 UC：
- Actor / Trigger / Pre-conditions / Main flow / Alternative / Exception / Post-conditions
- **Acceptance Criteria 用 Given/When/Then**（給 QA 直接套用）
- Source 回連到 PRD FR-ID

### 2c. Business Rules
萃取規則並編號（BR-NNN）：
- Rule statement
- Source（stakeholder / regulation）
- Priority（MoSCoW）
- Exception（何時不適用）
- Owner

### 2d. State Model
若涉及狀態機（如 order status），畫 mermaid stateDiagram 並列轉換條件。

### 2e. Events
列系統 events：producer / consumer / payload schema。

### 2f. Integration Inventory
列所有外部系統依賴：direction / protocol / auth / failure handling。

### 2g. Functional Boundary
明示 in/out of scope。Out 必須引用 PRD 對應段落或寫明本 spec 額外排除的理由。

---

## Phase 3: 寫出產物

### 3a. 主檔
`docs/analysis/system-spec-<feature>.md`

### 3b. Business Rules Catalog（可選分檔）
若規則多於 20 條，分檔到 `docs/governance/rule-catalog.md` 並在 system-spec 引用。

### 3c. 更新 state
- `documents/index.json`: 新增 entry，status=draft
- `.meta.json`: downstream_deps = [c4, adr, openapi, erd, test-plan]
- session narrative 追加

---

## Phase 4: Gate 3 條件檢查

| 必備 evidence | 檢查方式 |
|:--------------|:---------|
| Use cases 完整 | 每個 PRD scenario 都有對應 UC |
| Business rules 有 ID | 全部 BR-NNN 編號且 source 不為空 |
| Acceptance criteria 可被 QA 用 | 至少 70% UC 有 G/W/T |
| Exception flows 已列 | 每個主要 UC 至少 1 個 E1 |
| Integration inventory 完整 | 外部系統都有 failure handling 欄位 |

達標 → `state.json.freeze_gates.Gate3_SystemSpec = "ready_to_review"` 並回報 router。

未達 → 列出缺項並建議業主補充或接受 draft 留 open question。

---

## Phase 5: Cascade（業主改 frozen System Spec）

1. 分類變更：
   - 新 use case / 新規則 / acceptance 變動 → stale-major
   - 補充細節 / 補 example → stale-minor
2. 寫 DR（非架構性）或請業主升格為 ADR（若涉及架構決策）
3. 列下游影響：c4 / adr / openapi / erd / test-plan
4. 不自動 dispatch review，等業主授權 cascade

---

## 輸出契約

每次執行 stdout 至少：
1. 產出 / 更新的 docs/ 檔案清單
2. 新增的 UC / BR / event 計數
3. Gate 3 狀態（ready/blocked/not_yet）
4. 對業主的下一步建議
