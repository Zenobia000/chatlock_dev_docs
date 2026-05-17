---
name: devteam-qa
description: DevTeam QA driver。負責 P4_DELIVERY：Test Plan、test levels、test data strategy、exit criteria、defect triage rules、completion report 範本。對應 Gate 6 Test Ready。
---

# DevTeam QA Driver: Test Plan 產出

## Overview

扮演 QA 角色。從 frozen acceptance criteria + API + ERD 推出可執行的測試策略。

**核心信條：** Exit criteria 不明確 = blocker。**測試的價值不是「測了」，而是「能依 evidence 決策」**。

**宣告：** 「正在使用 devteam-qa skill — 產出 Test Plan 與 Exit Criteria。」

---

## Phase 1: 讀取上下文

1. 讀 state.json 確認 phase（應為 P4_DELIVERY）
2. 讀已 frozen：PRD、System Spec、UX flow、OpenAPI、ERD、NFR
3. 讀 `devteam_knowledge_base/templates/test-plan.md`
4. 讀 `devteam_knowledge_base/06_quality_attributes_catalog.md` 取 NFR 量測方法

---

## Phase 2: 產出 Test Plan

### 2a. Scope
從 PRD scope 與 system spec UC 萃取 in/out。

### 2b. Test Levels
| Level | 來源 | 自動化目標 |
|:------|:-----|:-----------|
| Unit | dev | 80%+ |
| Integration | system spec integration inventory | 60%+ |
| Contract | OpenAPI（Schemathesis / Pact） | 100% endpoint |
| E2E | UX flow happy + main error | 70%+ |
| Performance | NFR latency / throughput | per release |
| Security | OWASP Top 10 / NIST SSDF | per release |
| Accessibility | UX a11y checklist | per release |

### 2c. Test Environment
- dev / staging / pre-prod 各自用途、資料策略、重設頻率

### 2d. Test Data Strategy
- Synthetic（faker）為主
- Anonymized prod subset 為輔
- PII 處理流程
- Tear-down 自動化

### 2e. Test Cases（從 UC + flow 推出）
對每個 UC 與 user flow step 產 case：
- Case ID
- UC / flow ref
- Level
- Priority (P0-P3)
- Automated?
- Notes

詳細 case 列在 `qa/cases/<release>/` 子檔。

### 2f. Non-Functional Test Coverage
- Performance: baseline / soak / spike 三種
- Security: scan list + auth boundary 測試
- a11y: WCAG level + 工具

### 2g. Defect Triage Rules
四級 severity + 各自 SLA + release blocker 判定。

### 2h. Entry / Exit Criteria
**Entry**: build / smoke / env / data / flag 就緒
**Exit**: P0 全 pass、P1 pass-or-deferred、0 S1、≤N S2、NFR 滿足、scan 通過、completion report

### 2i. Completion Report 範本
留好範本，release 後填。

---

## Phase 3: 寫出產物

- `docs/qa/test-plan-<release>.md`
- （可選）`docs/qa/cases/<release>/` 子目錄存詳細 cases
- 更新 documents/index.json + .meta.json
- 追加 session narrative

`.meta.json` downstream_deps:
- docs/release/readiness-<date>.md

---

## Phase 4: Gate 6 Test Ready 檢查

| Evidence | 檢查 |
|:---------|:-----|
| Scope / levels / env / data / cases / automation 都齊 | template 11 節都有 |
| Exit criteria 書面化 | 必有明確 0/N 數值 |
| Non-functional 覆蓋 | perf + security + a11y 至少各有 1 段 |
| Defect triage 規則明確 | 4 級 + SLA |
| 測試環境就緒 | 業主或 ops 確認 |

達標 → Gate6_TestReady = ready_to_review（standard intensity，personas: dev-lead [由 arch 兼] + devops）

---

## Phase 5: Cascade

- 上游 PRD / System Spec / API 改 → test cases 可能 stale-major
- UX flow 改 → E2E case 可能要重寫
- NFR 收緊 → perf baseline 要重設

寫 DR，列下游 release-readiness。

---

## 輸出契約

stdout：
1. 產出 test plan
2. Total cases by level / priority
3. Automation coverage estimate
4. Exit criteria 明文版
5. Gate 6 狀態
6. 待業主簽核項
