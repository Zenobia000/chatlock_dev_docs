# NFR Matrix — 智慧鎖 SaaS 平台

> **狀態**：v1 draft（Gate 4 ready）
> **更新**：2026-05-23
> **負責人**：Architect
> **關聯**：[PRD v2.1](../prd/smart-lock-saas.md) §NFR · KB §06 quality_attributes_catalog · Forum F-04 final-report

---

## §0 Trade-off Frame

NFR 不是「越高越好」，而是「目標 tier 與 product tier 對齊」。本系統有兩個 NFR boundary：

- **合約 baseline**（系統下限）：合約 4.4 / SOW 2.1(4) / §9 終止條款定義，違反 = block release
- **營運目標**（系統上限）：bounded context 內 SLO 自我約束，達不到不擋上線但影響 error budget

對齊 ISO/IEC/IEEE 29148 + Google SRE SLI/SLO + NIST SSDF + DORA。Trade-off 軸：performance vs cost / availability vs operability / privacy vs auditability。

| 維度 | 目標 tier | 主要指標 |
|:---|:---|:---|
| Performance | 一般 SaaS | AI 5s p95 / RAG 8s p95 / Admin 2s p95 |
| Availability | 一般 SaaS / 商業關鍵 | 95% 合約 baseline / 99.5% 營運 |
| Reliability | 商業關鍵 | LINE webhook ≥ 99.9%（含 retry + DLQ）|
| Privacy | 金流 / 醫療 tier | PII 銷毀加密金鑰 + GDPR forget ≤ 7d |
| Auditability | 金流 tier | append-only ledger + hash chain |
| DORA | High | Lead time <1d / CFR <15% / MTTR <1d |

---

## §1 Performance

| ID | NFR | Target | 驗證方式 | 來源 |
|:---|:---|:---|:---|:---|
| NFR-Perf-001 | LINE AI 首回應 latency | p95 < 5s（V1）/ p99 < 8s | k6 load 50 concurrent | PRD K6 |
| NFR-Perf-002 | 案例庫向量搜尋 | p95 < 3s | benchmark | US-008 |
| NFR-Perf-003 | RAG Pipeline | p95 < 8s | benchmark | US-009 |
| NFR-Perf-004 | Admin Panel 頁面 | p95 < 2s | RUM | US-017 |
| NFR-Perf-005 | DGS purge API | p95 < 500ms / p99 < 2s | APM | Forum F-04 |
| NFR-Perf-006 | DGS read snapshot | p95 < 50ms（cache hit）/ p95 < 200ms（miss）| APM | Forum F-04 |
| NFR-Perf-007 | Outbox bus lag | p99 ≤ 30s / p99.9 ≤ 2min | metric | Forum F-04 |

---

## §2 Availability + Reliability

| ID | NFR | Target | 驗證 | 來源 |
|:---|:---|:---|:---|:---|
| NFR-Avail-001 | 系統 Uptime（合約 baseline）| ≥ 95%（V1）| 30-day rolling SLO | 合約 |
| NFR-Avail-002 | 系統 Uptime（營運目標）| ≥ 99.5% | 30-day rolling | KB §2 |
| NFR-Avail-003 | DGS service | ≥ 99.95% | SLO | ADR-0061 |
| NFR-Avail-004 | LINE webhook | ≥ 99.9%（含 24h dedup + DLQ retry）| 自動化 webhook test | FR-0024 |
| NFR-Rel-001 | Error rate | < 0.5%（5xx + business errors）| APM | KB §1 |
| NFR-Rel-002 | DLQ 處理 | 失敗事件 1h 內人工 review | runbook | ADR-0029 |

---

## §3 Scalability

| ID | NFR | Target | 驗證 |
|:---|:---|:---|:---|
| NFR-Scal-001 | V1 並發 | ≥ 50 同時在線 | k6 load test |
| NFR-Scal-002 | V2 並發 | ≥ 100 同時在線 | k6 load test |
| NFR-Scal-003 | 註冊用戶（3-5 年）| ≥ 30 萬戶 | capacity plan |
| NFR-Scal-004 | ProblemCard 累積（3-5 年）| ≥ 50 萬 | retention plan |
| NFR-Scal-005 | Evidence storage（3-5 年）| ≥ 30 萬個（avg 2MB）≈ 600GB | storage plan |
| NFR-Scal-006 | Tenant 數 | V1: 1 / V2: 10 / V3+: 30+ | Contract Template instance |

---

## §4 Security

| ID | NFR | Target | 驗證 |
|:---|:---|:---|:---|
| NFR-Sec-001 | TLS | 1.2+ | SSL Labs |
| NFR-Sec-002 | Auth | JWT + Refresh Token | OWASP ASVS |
| NFR-Sec-003 | At-rest encryption | AES-256 | 平台保證 |
| NFR-Sec-004 | Prompt injection 攔截率 | ≥ 95% | 50 題誘導測試 |
| NFR-Sec-005 | 內容過濾誤攔率 | < 1% | 100 題正常對話 |
| NFR-Sec-006 | Output Guardrail | 政治 / 宗教 / 競品禁回 | 50 題誘導 |
| NFR-Sec-007 | AI Forbidden Eval | pass rate ≥ 95%（block deploy）| 200 題 |
| NFR-Sec-008 | Image moderation gate（SOW 2.1(4)）| violation count = 0 | webhook + runtime double-gate |
| NFR-Sec-009 | Secrets management | GCP Secret Manager，無 env-var leak | scan + audit |
| NFR-Sec-010 | CVE response | high ≤ 7d / critical ≤ 24h | SCA tooling |

---

## §5 Privacy

| ID | NFR | Target | 驗證 |
|:---|:---|:---|:---|
| NFR-Priv-001 | PII 分類 | L4 sensitive（phone / address / signature）| data classification |
| NFR-Priv-002 | PII retention default | 1y | DGS cron + audit |
| NFR-Priv-003 | RMA / 客訴 retention | +3y | DGS rule |
| NFR-Priv-004 | 法律相關 retention | eternal（legal_hold=true）| DGS + ADR change required |
| NFR-Priv-005 | GDPR forget | ≤ 7d 執行 OR customer notice | DGS pipeline + audit |
| NFR-Priv-006 | Cross-tenant isolation | 0 leakage | tenant_id propagation test |
| NFR-Priv-007 | DEK rotation | 90d | KMS schedule |
| NFR-Priv-008 | Two-phase purge | T0 銷毀加密金鑰 + T+30d 硬刪 | DGS phase audit |

---

## §6 Accessibility

| ID | NFR | Target |
|:---|:---|:---|
| NFR-A11y-001 | LINE 端 | LINE 原生 a11y |
| NFR-A11y-002 | Admin Panel + 師傅 Web App | WCAG 2.2 AA |
| NFR-A11y-003 | 對比 | ≥ 4.5:1 |
| NFR-A11y-004 | 鍵盤導覽 | 全功能 |
| NFR-A11y-005 | Screen reader | ARIA labels |

> [ux 視角] WCAG 2.2 AA 為合約 baseline，所有 Web 介面均適用。

---

## §7 Auditability

| ID | NFR | Target |
|:---|:---|:---|
| NFR-Aud-001 | 全變更 audit log | append-only, JSON+trace_id, retention eternal |
| NFR-Aud-002 | 7 ledger | borrow=lend, reason code 制 |
| NFR-Aud-003 | Evidence retention | 1y / RMA+3y / eternal / GDPR 7d |
| NFR-Aud-004 | Family Reviewer 紀錄 | 100% 不可篡改, SLA ≤ 24h |
| NFR-Aud-005 | Read-side access log | snapshot + DGS 雙路徑入同 stream |
| NFR-Aud-006 | Policy artifact versioning（OPA Rego）| git history + CODEOWNERS @legal @dpo + DGS hash-check |

---

## §8 Operability + Compliance

| ID | NFR | Target |
|:---|:---|:---|
| NFR-Ops-001 | Runbook 覆蓋 | 100% 關鍵 incident path |
| NFR-Ops-002 | Alert MTTA | < 15min（office）/ < 30min（off-hours）|
| NFR-Ops-003 | Rollback | < 30min |
| NFR-Ops-004 | Observability SLI | snapshot staleness / invalidation lag / DGS queue depth / bus lag |
| NFR-Comp-001 | 合約 4.4(a) 負面情緒識別 | ≥ 90% UAT；連續 2 週 < 88% block / 4 週 < 85% incident |
| NFR-Comp-002 | 合約 4.4(d) 家族覆核 | 100% 覆核率 |
| NFR-Comp-003 | 合約 SOW 2.1(4) | AI 影像辨識禁用 violation count = 0 |
| NFR-Comp-004 | DORA Lead Time | < 1 day |
| NFR-Comp-005 | DORA CFR | < 15% |
| NFR-Comp-006 | DORA MTTR | < 1 day |

---

## §9 Maintainability

| ID | NFR | Target |
|:---|:---|:---|
| NFR-Maint-001 | 後端 test 覆蓋率 | ≥ 70%（pytest）|
| NFR-Maint-002 | SKILL ↔ LLM 解耦 | LLM swap < 5d / IngressChannel swap < 14d |
| NFR-Maint-003 | OpenAPI additive-only | breaking change requires DR |
| NFR-Maint-004 | ADR/DR coverage | 重大決策都有 ADR/DR |

---

## §10 Failure Modes Catalogue

> Bounded context 切完，每個 boundary 都要盤 failure mode + blast radius。沒寫就上線 = 上線後盲飛。

| Failure Mode | 影響 SLO | Blast Radius | 緩解 |
|:---|:---|:---|:---|
| LINE webhook 失敗 | NFR-Avail-004 | LINE 對話 BC | retry 3x → DLQ → 1h 內 review |
| LLM API 超時 / quota | NFR-Perf-001 | AI agent BC | timeout 8s → fallback canned response → 轉真人 |
| Gemini quota 爆 | cost / NFR-Perf-001 | AI agent BC | cost ceiling + rate limit + caching |
| 案例庫向量索引 stale | K1 準確率 | KB BC | 60s 強制刷新 + nightly full reindex |
| DGS service down | NFR-Avail-003 + mutation 全停 | DGS BC（mutation 集中是 trade-off cost）| circuit breaker + cron pause + token bucket recovery |
| Snapshot cache stale | BR-PII-001 違反 | read path BC | flagged item full deny + push invalidation ≤ 5s |
| Outbox poller lag > 2min | bus lag SLO 破 | DGS BC + read path | incident + fail-closed read flagged |
| Family Reviewer 缺席 | 合約 4.4(d) | SOP BC | 24h SLA / 暫停 SOP publish / ChangeRequest 替補 |
| AI gaming K2（假自助）| K2 漂移 | KPI 量測 BC | C2b K1 trip-wire + C2c abandon counter + reopen 回退 |
| AI gaming C2（偽硬規則）| C2 unreliability | KPI 量測 BC | rule_triggered_by 由 deterministic engine 寫入 |
| Image vision API call leak | SOW 2.1(4) 違反 | Security BC | webhook + runtime double-gate |
| 跨 tenant 寫入 | ADR-0030 | Tenant BC（blast radius 全平台）| RLS policy + ChangeRequest enforce + audit |

---

## §11 Observability Hooks（給 SRE）

> [sre 視角] 4 條 SLI 進 Grafana board，對齊使用者體驗（不是 infra metric）。

主 SLI：
- `snapshot_staleness_p99_seconds`（retention/visibility ≤ 60s，legal-hold ≤ 5s）
- `dgs_invalidation_lag_p99_seconds`（≤ 30s）
- `dgs_mutation_queue_depth`（alert > 1000）
- `outbox_lag_p99_seconds`（≤ 30s，page > 120s）

KPI metrics：
- `ai_accuracy_50qa`（K1, weekly）
- `self_service_rate_pc_unit`（K2, weekly + W8 milestone）
- `sentiment_negative_detection_rate`（K3, weekly N=100 + monthly audit）
- `pc_completeness_rate`（K4, daily）
- `acceptance_sla_compliance`（K5, daily）
- `ai_first_response_p95`（K6）
- `uptime_30d`（K7）
- `forbidden_eval_pass_rate`（K8, every deploy）
- `concurrent_users_max`（K9, weekly）
- `ai_proactive_human_transfer_rate`（C2, weekly）
- `k1_k2_drift_7d`（C2b, daily）
- `abandon_rate_pc_unit`（C2c, daily）
- `gdpr_forget_completion_time`（C3, monthly）

---

**Gate 4 NFR + ADR Baseline Freeze** — ✅ ready
