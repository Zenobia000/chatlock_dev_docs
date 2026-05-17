# 06 — Quality Attributes Catalog

NFR / SLO / 業界標準的「驗收常數」目錄。供 devteam-arch 寫 NFR matrix 時引用，供各 persona critique 時查驗。

對應 deep-research-report 引用的 **ISO/IEC/IEEE 29148**（需求工程）、**NIST SSDF**（安全 SDLC）、**Google SRE**（可靠性）、**DORA**（交付指標）。

---

## 1. NFR 矩陣標準維度

| Dimension | 常見指標 | 量測方法 | 來源 |
|:----------|:---------|:---------|:-----|
| **Performance** | latency p50/p95/p99、throughput rps、p95 ttfb | RUM、APM、load test | Google SRE |
| **Availability** | uptime %、MTBF、MTTR | SLO 監控 | Google SRE |
| **Reliability** | error rate、success rate、retry budget | SLI | Google SRE |
| **Scalability** | concurrent users、data volume growth、shard count | capacity planning | AWS Builders' Library |
| **Security** | auth method、data classification、CVE response time | NIST SSDF | NIST SP 800-218 |
| **Privacy** | PII classification、retention、subject access | GDPR / 個資法 | regulatory |
| **Accessibility** | WCAG level (A/AA/AAA)、screen reader、keyboard nav | a11y audit | W3C WCAG 2.2 |
| **Auditability** | log retention、who-changed-what、immutability | compliance | SOX / HIPAA / 內控 |
| **Operability** | runbook coverage、alert MTTA、rollback time | SRE | Google SRE |
| **Maintainability** | code complexity、test coverage、doc coverage | static analysis | ISO/IEC 25010 |

---

## 2. SLI / SLO 參考集

### 常見 SLI 類型

| SLI 類型 | 範例 |
|:---------|:-----|
| Availability | successful_requests / total_requests |
| Latency | requests faster than 200ms / total_requests |
| Throughput | rps over time window |
| Correctness | duplicate-free events / total events |
| Freshness | rows updated in last N min / total rows |
| Durability | recovered objects / total objects |

### SLO 目標範例（依產品類型調整）

| 產品類型 | Availability SLO | Latency SLO | Error budget / 30 天 |
|:---------|:-----------------|:------------|:---------------------|
| 內部工具 | 99.0% | p95 < 1s | 7.2h |
| 一般 SaaS | 99.5% | p95 < 500ms | 3.6h |
| 商業關鍵 | 99.9% | p95 < 300ms | 43m |
| 金流 / 醫療 | 99.95%+ | p95 < 200ms | 21m |

---

## 3. DORA 4 大交付指標

| 指標 | Elite | High | Medium | Low |
|:-----|:------|:-----|:-------|:----|
| Deployment Frequency | on-demand (multi/day) | between once/day and once/week | between once/week and once/month | less than once/month |
| Lead Time for Changes | <1 hour | <1 day | <1 week | >1 month |
| Change Failure Rate | 0-5% | 10-15% | 10-15% | 16-30%+ |
| Time to Restore Service | <1 hour | <1 day | <1 day | >1 week |

NFR 應該對齊團隊目標 DORA 等級（不是越 Elite 越好，符合產品與團隊成熟度即可）。

---

## 4. ISO/IEC/IEEE 29148 — Requirement Information Items

每個需求至少包含這些 information items（PRD/system-spec 必檢）：

- **Identifier**：唯一 ID（FR-001、NFR-001…）
- **Description**：陳述（avoid ambiguity）
- **Rationale**：為什麼
- **Source**：誰提出 / 從哪個文件來
- **Priority**：MoSCoW / 數值
- **Verification method**：怎麼驗證（inspection / analysis / test / demo）
- **Dependencies**：上下游
- **Risk**：若沒實作 / 實作錯誤的風險

不滿足 → critique 該標 blocker。

---

## 5. NIST SSDF（Secure Software Development Framework）控制項

deep-research-report 行 11 強調這份。SSDF 的四大組：

| 組 | 控制要點 | DevTeam 對應 |
|:---|:---------|:--------------|
| **PO** (Prepare the Organization) | 角色、政策、工具鏈 | RACI（01 KB）、commands、CI/CD pipeline |
| **PS** (Protect the Software) | 程式碼完整性、保密 | API auth in OpenAPI、secrets management ADR |
| **PW** (Produce Well-Secured Software) | 安全設計、code review、測試 | NFR security 維度、QA test plan 含 security cases |
| **RV** (Respond to Vulnerabilities) | 漏洞回報、修補 | postmortem template、SRE runbook 含 incident path |

freeze gate 4（NFR）與 gate 7（Release）必查 SSDF。

---

## 6. C4 Model 層級對照

| Level | 抽象度 | 內容 | DevTeam 範本 |
|:------|:-------|:-----|:--------------|
| L1 Context | 系統與外部 actor / system | 一張圖 | `templates/c4-l1.md` |
| L2 Container | 系統內部 deployable units | 一張圖 | `templates/c4-l2.md` |
| L3 Component | 容器內部的主要 component | 一張圖（按需） | `templates/c4-l3.md` |
| L4 Code | class / function 層級 | 通常不畫，交給 IDE | — |

devteam-arch 預設產出 L1 + L2，L3 按需。

---

## 7. OpenAPI 3.x 必填欄位（API Contract Freeze 必檢）

- `openapi: 3.1.0`
- `info`：title / version / description
- `servers`
- `paths`：每個 endpoint 至少 summary + operationId + tags + responses
- `components/schemas`：所有 request/response body
- `components/securitySchemes`
- 自訂 `x-governance`：owner / contract_freeze_date / change_policy

缺一 → API Contract Freeze blocker。

---

## 8. Test Plan 必填欄位（ISTQB 概念）

- Scope
- Levels（unit / integration / E2E / NFR）
- Environment
- Data strategy
- Test cases（含 id / steps / expected）
- Automation coverage（哪些自動 / 哪些手動）
- Entry criteria（什麼條件才能開始測）
- Exit criteria（什麼條件算測完）
- Defect triage rules

缺 exit criteria → Test Ready blocker（最常見遺漏）。

---

## 9. Runbook 必填欄位（Google SRE）

- Service overview
- Architecture diagram link
- Owner / on-call rotation
- Deploy procedure
- Rollback procedure
- Dashboards（連結）
- Alerts（每個 alert 對應的處置 SOP）
- Common incidents & resolutions
- Escalation path

缺 rollback or alerts → Release Ready blocker。
