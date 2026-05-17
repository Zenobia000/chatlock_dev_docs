# Test Plan — <Release / Feature>

> **Owner**: devteam-qa
> **Status**: draft | reviewed | frozen | superseded
> **Version**: v<n>
> **Last updated**: <YYYY-MM-DD>
> **Related**: docs/prd/<feature>.md, docs/analysis/system-spec-<feature>.md, docs/api/openapi-<service>.yaml

---

## Scope

### In Scope
- <feature(s) covered>

### Out of Scope
- <explicit exclusions>

---

## Test Levels

| Level | Tools | Owner | 自動化率目標 |
|:------|:------|:------|:-------------|
| Unit | Jest / pytest | dev | 80%+ |
| Integration | testcontainers + supertest | QA + dev | 60%+ |
| Contract | Pact / Schemathesis (OpenAPI driven) | QA | 100% endpoint coverage |
| E2E | Playwright | QA | core happy + main error paths |
| Performance | k6 / Locust | QA | per release |
| Security | OWASP ZAP / Trivy / Semgrep | QA + security | per release |
| Accessibility | axe-core / manual screen reader | QA + UX | per release |

---

## Test Environment

| Env | Purpose | Data | Reset cadence |
|:----|:--------|:-----|:--------------|
| dev | developer self-test | synthetic | on demand |
| staging | full integration | anonymized prod subset | weekly |
| pre-prod | release validation | prod-like | per release |

---

## Test Data Strategy

- **Synthetic**: faker for 80% cases
- **Anonymized prod subset**: for performance + edge case
- **PII handling**: 任何離開 prod 的資料必須過 anonymizer
- **Tear-down**: 每次測試後自動清除

---

## Test Cases（高層摘要）

| Case ID | Use Case Ref | Level | Priority | Automated | Notes |
|:--------|:-------------|:------|:---------|:----------|:------|
| TC-001 | UC-001 happy | E2E | P0 | ✓ | core flow |
| TC-002 | UC-001 error: payment fail | Integration | P0 | ✓ | retry path |
| TC-003 | UC-001 a11y | E2E + manual | P1 | partial | screen reader manual |

詳細案例見 `qa/cases/<release>/`。

---

## Non-Functional Test Coverage

### Performance
- **Baseline**: p95 < 500ms @ 100 rps
- **Soak**: 2h sustained @ 50 rps，無 leak
- **Spike**: 10x baseline 30s，recover within 1m

### Security
- OWASP Top 10 掃描
- Authn / Authz boundary 測試（vertical + horizontal privilege escalation）
- Secret scan in artifacts
- Dependency vulnerability scan (Trivy / Snyk)

### Accessibility
- WCAG <level> conformance
- axe-core 自動掃描
- 鍵盤 only flow 走通
- Screen reader（NVDA / VoiceOver）spot check

---

## Defect Triage Rules

| Severity | 定義 | SLA 修復 | Blocker for release? |
|:---------|:-----|:---------|:---------------------|
| S1 (Critical) | 主功能不能用 / 安全漏洞 / 資料損毀 | 24h | yes |
| S2 (Major) | 重要功能受損 / 有 workaround | 3 days | yes (unless deferred by PM) |
| S3 (Minor) | 邊緣案例 / cosmetic | next release | no |
| S4 (Trivial) | 文字 / 視覺微調 | backlog | no |

---

## Entry Criteria（可以開始測試）

- [ ] Build 成功
- [ ] Smoke test 綠燈
- [ ] Test environment ready
- [ ] Test data loaded
- [ ] Feature flags configured

## Exit Criteria（測試完成）

- [ ] 所有 P0 test cases 執行且 passed
- [ ] 所有 P1 test cases 執行（pass 或 deferred with PM approval）
- [ ] 0 個 S1 defect
- [ ] ≤ N 個 S2 defect（N 由 PM 與 QA 商定）
- [ ] Performance baseline 滿足
- [ ] Security scan 無 high/critical
- [ ] a11y axe-core 0 critical
- [ ] Test completion report 寫好

---

## Test Completion Report 範本

文末或獨立檔案 `qa/completion-<release>.md`：

```markdown
## Test Completion — <release>

- Cases executed: X / Y
- Pass rate: ZZ%
- Open defects: <list by severity>
- Performance: <pass/fail vs baseline>
- Security: <findings>
- a11y: <findings>
- Recommendation: GO / NO-GO / CONDITIONAL（with conditions）
```

---

## Downstream Consumers
- docs/release/readiness-<date>.md（QA 證據來源）
- docs/ops/runbook-<service>.md（incident pattern from test findings）
