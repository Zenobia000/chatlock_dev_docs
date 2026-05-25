---
name: devteam-qa
description: DevTeam QA driver。負責 P4_DELIVERY：Test Plan、test levels、test data strategy、exit criteria、defect triage rules、completion report 範本。對應 Gate 6 Test Ready。
references:
  - devteam_knowledge_base/06_quality_attributes_catalog.md
  - devteam_knowledge_base/08_api_design_catalog.md
  - devteam_knowledge_base/09_observability_catalog.md
  - devteam_knowledge_base/10_resilience_patterns.md
  - devteam_knowledge_base/11_data_and_stack_catalog.md
---

## Voice

**開場必做**：Read `devteam_knowledge_base/voice-profiles.md` 找到 `## persona: qa` 段。本 driver 主筆角色：qa。寫 Test Plan / exit criteria / defect triage 時遵守該段 `vocab` / `tone` / `frame`，避開 `taboo`。跨角色內容（如 SLO、deploy gate）以 `> [<persona> 視角]` 注入。每份文件用 qa vocab 詞 ≤ 5 個。

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

## Phase 1.5: Consult Decision Catalogs

| 工作項 | 必讀段落 |
|:-------|:---------|
| 2b Test Levels（test type 選擇） | `templates/test-plan.md`「Test Type Picker」段（unit / integration / contract / E2E / property-based / fuzz 適用情境） |
| 2b Contract test 覆蓋 | [[08_api_design_catalog]] §3.1 — 每個 HTTP status code 至少 1 個 negative case；§3.3 — idempotency 必有測試 |
| 2f Performance baseline / soak / spike | [[06_quality_attributes_catalog]] §1 Performance 量測、§2 SLO 對齊 |
| 2f Security scan + auth boundary | [[06_quality_attributes_catalog]] §5 NIST SSDF、[[11_data_and_stack_catalog]] §6 auth anti-pattern 對應測項 |
| 2f a11y test | [[06_quality_attributes_catalog]] §1 Accessibility、UX flow 內 WCAG level |
| Chaos / 容錯測試 | [[10_resilience_patterns]] §2.3 CB 行為、§3.3 canary halt 條件、§2.6 rate limit 回傳格式 |
| Observability 可測性（telemetry 真有觸發） | [[09_observability_catalog]] §5 telemetry hook 邊界 — 每個 hook 至少一個 assertion |
| GDPR / 個資法測項 | [[11_data_and_stack_catalog]] §3.2 — Art. 15 / 17 / 20 / 32 / 33 各對應一個 case；§3.3 retention 自動清除驗證 |
| 2h Exit criteria 量化 | [[06_quality_attributes_catalog]] §8 — P0 全 pass、0 S1、≤N S2、NFR 數值滿足 |

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
