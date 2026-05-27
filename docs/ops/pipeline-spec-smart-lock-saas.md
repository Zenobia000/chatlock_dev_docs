---
id: pipeline-spec-smart-lock-saas
title: CI/CD Pipeline Spec — 智慧鎖 SaaS 平台
status: v1 draft (Gate 7 ready)
date: 2026-05-28
owner: devteam-ops (DevOps + SRE)
phase: P5_RELEASE
related_adrs:
  - ADR-0067   # M18 runtime config governance — staged rollout 紀律來源
  - ADR-0068   # M18 anti-corruption layer — Config Read API gate
  - ADR-0050   # evidence visibility matrix — PII gate
  - ADR-0051   # evidence retention policy
  - ADR-0061   # DGS boundary
  - ADR-0064   # quote hash chain — DB migration safety
  - ADR-VCH-001  # voucher hash chain
  - ADR-VCH-002  # voucher retention 7y
  - ADR-PII-002  # data minimization double defense
related_brs:
  - BR-M18-01..05  # M18 staged rollout 五件套
related_nfr:
  - NFR-Perf-008   # M18 read P99 ≤ 50ms
  - NFR-Avail-005..007  # LINE webhook
  - NFR-Ops-005..006   # M18 rollback ≤ 1 min + staged observation
  - NFR-Aud-007    # M18 config audit ≥ 7y
  - NFR-Maint-001  # backend coverage ≥ 70%
related_docs:
  - docs/ops/runbook-smart-lock-saas.md
  - docs/ops/slo-spec-smart-lock-saas.md
  - docs/ops/rollback-plan-smart-lock-saas.md
  - docs/ops/release-readiness-smart-lock-saas.md
---

# Pipeline Spec — 智慧鎖 SaaS 平台

> **狀態**：v1 draft（Gate 7 ready）
> **更新**：2026-05-28
> **負責人**：DevOps + SRE
> **對應**：Gate 7 Release Ready · 對齊 ADR-0067 (M18 governance) + BR-M18-01..05 staged rollout

---

## §0 設計原則

> [devops 視角] Pipeline 通過率 / artifact 可追溯 / drift 偵測 / promotion gate 自動化優先。對 0-1 SaaS，**先 cover P0 阻擋型 gate，nice-to-have defer**。
> [sre 視角] 每個 gate 都要綁 SLO / error budget；rollback 路徑必畫；不可重現的 artifact 不能上線。

**容忍例外原則**：
- **必含**：lint / contract conformance / migration gate / staged rollout (M18 + app) / rollback drill
- **可 defer 到 V1.1**：mutation testing / chaos drill 自動化 / DORA dashboard 全自動採集（先手動 weekly）

---

## §1 Git Flow

```
main (protected, prod)
  ├─ release/v1.0.x (cherry-pick hotfix)
  ├─ release/v1.1.x
  └─ feature/*  → PR → main
       hotfix/* → PR → main + release/*
```

| Branch | 用途 | Merge gate |
|:---|:---|:---|
| `main` | 線上版本 SoT | PR + 2 reviewer + CI green + ADR mention if cross-cutting |
| `release/<ver>` | release window 緊縮版（freeze new feature） | cherry-pick from main only |
| `hotfix/<ver>-<issue>` | P0/P1 緊急修復 | fast-track 1 reviewer + 強制 rollback plan |
| `feature/<name>` | 一般功能分支 | squash to main |

**禁止**：force push to `main` / `release/*`；commit 含 secrets；branch 超過 14 天未 rebase。

**Commit message**：Conventional Commits（`feat`/`fix`/`docs`/`refactor`/`chore`），cross-cutting change 必引 ADR 編號（如 `feat(m18): add config read api per ADR-0068`）。

---

## §2 CI Stages（PR → main 全部通過才能 merge）

| # | Stage | Tool | Block-merge 條件 | Owner |
|:--|:---|:---|:---|:---|
| 1 | **Lint** | ruff / eslint / mypy / OpenAPI lint | any error | dev |
| 2 | **Unit test** | pytest / vitest | coverage < 70% (NFR-Maint-001) | dev |
| 3 | **Contract conformance** | OpenAPI diff vs main spec / Pact | breaking change without DR | sd |
| 4 | **Integration test** | docker-compose + testcontainers | P0 path fail | dev + qa |
| 5 | **NFR smoke** | k6 micro-load 5 min | NFR-Perf-008 (M18 read P99 ≤ 50ms) 破線 | sre |
| 6 | **Forbidden Eval** | 200 題 Eval corpus | pass rate < 95% (NFR-Sec-007) | qa |
| 7 | **Security scan** | trivy (container) + bandit (py) + npm audit | critical CVE > 0 / high > 7d age | sec |
| 8 | **Secret scan** | gitleaks | any secret detected | sec |
| 9 | **Schema validation (M18 config)** | ajv / pydantic against published M18 schema | any config-payload PR violates schema | dev |
| 10 | **Build** | Docker buildx → GHCR / Artifact Registry | build fail | devops |

**Artifact tagging**：`<commit-sha>-<build-timestamp>-<branch>`；image digest pinned 不可變；SBOM 隨 image 推送。

**0-1 容忍例外**：
- mutation testing 暫不擋 merge（V1.1 再評估）
- E2E test 跑在 nightly，不卡 PR（PR 跑 integration 即可）

---

## §3 CD Stages（merge to main → prod）

```
[merge to main]
     │
     ▼
[deploy-staging]  ← auto；含 migration dry-run
     │
     ▼
[smoke-test (staging)]  ← 10 min；包含 LINE webhook ack + DGS read snapshot + M18 config read
     │
     ▼
[manual gate: PM / Tech Lead approve]  ← release notes + ADR mention 必填
     │
     ▼
[canary 5%] ← 10 min observation；卡 SLO baseline（NFR-Ops-006）
     │
     ▼
[ramp 50%] ← 10 min observation
     │
     ▼
[full 100%]
     │
     ▼
[post-deploy verification]  ← KPI K1/K3/K8 + uptime + error rate 30 min watch
```

### §3.1 Staged rollout 紀律（對齊 BR-M18-01..05 + ADR-0067 §Decision 組件 3）

| 階段 | 流量 % | 最短觀察 | Auto-halt 條件 |
|:---|:---|:---|:---|
| canary | 5% | 10 min | error rate > baseline + 50% OR P99 latency > baseline + 30% OR Forbidden Eval drop > 2% |
| ramp | 50% | 10 min | 同上 |
| full | 100% | 30 min post-deploy | 同上 + KPI K3 sentiment 連動退化 |

**注意**：M18 config 改動的 staged rollout 走獨立軌道（admin UI 觸發），與 app version rollout **不可同時進行**（避免 confound 變因）。同時啟動 → 後送的 staged rollout 必須等前者 full 100% + 觀察期過。

### §3.2 Migration gate（DDL forward-only）

每次 release 若含 migration：
1. **dry-run on staging**：跑 migration + restore + 驗 row count + 驗 hash chain 連續性（ADR-0064 / ADR-VCH-001）
2. **forward-only**：禁 DROP COLUMN / DROP TABLE on 已 ship 欄位；改名走 expand-contract 兩 release
3. **rollback playbook**：每個 migration 必附 compensating migration script（補償，非反向 DDL）— 參 `rollback-plan-smart-lock-saas.md` §3
4. **hash chain 完整性檢查**：voucher / quote / journal_entry migration 後必跑 nightly verify job 一次 ad-hoc，無 mismatch 才允 prod apply
5. **PII migration gate**：涉及 PII 欄位（per ADR-PII-002 schema CI 雙層防線）必須過 PII-CI 檢查 + DPO sign-off

### §3.3 Secrets / Config Management

| 類別 | 機制 | CI 持密？ |
|:---|:---|:---|
| Infrastructure secrets（DB conn / API key / KMS key ref） | GCP Secret Manager | ❌ 不持密；runtime fetch |
| LINE channel token / OAuth credential | GCP Secret Manager + 90d rotation | ❌ |
| OPA Rego artifact signing key | KMS-managed | ❌ |
| M18 user-maintained config（金額 / 比例 / SLA / template） | M18 admin UI（per ADR-0067） | ❌ CI 無寫入權；只能讀 schema 做驗證 |
| Code-level constants（enum / UI 顏色） | code | n/a |

**業主自助場景**：M18 admin 在 admin UI 改 config → schema validation → staged rollout 5%/50%/100% → rollback window 24h；**全程繞過 CI/CD pipeline**（admin-only path）。

### §3.4 Rollback SLA（per NFR-Ops-003 + NFR-Ops-005）

| 類型 | 目標 | 機制 |
|:---|:---|:---|
| M18 config rollback | ≤ 1 min | admin UI 一鍵 + staged 10% 驗 |
| App version rollback | ≤ 30 min | Cloud Run revision pin（保留 5 個 green tag） |
| DB schema rollback | ≤ 4 h | compensating migration + PITR window 7d |

詳見 `rollback-plan-smart-lock-saas.md`。

---

## §4 Block-Deploy Gates（自動化）

| Gate | Source | Threshold | Action |
|:---|:---|:---|:---|
| Coverage | CI | < 70% | block merge |
| Forbidden Eval | CI / nightly | < 95% pass | block deploy |
| KPI K3 sentiment | staging shadow run | < 88% (合約 4.4(a)) | block deploy |
| OpenAPI breaking change | CI | breaking without DR | block merge |
| Image moderation gate | CI + runtime | violation > 0 (SOW 2.1(4)) | block deploy |
| OPA Rego artifact hash | DGS startup | mismatch | DGS refuses start |
| Migration hash chain verify | CI on migration | any mismatch | block deploy |
| Schema validation (M18 config) | CI | any new config key 無 schema | block merge |
| Container CVE | trivy | critical > 0 | block deploy |
| Secrets in commit | gitleaks | any detection | block merge |

---

## §5 Drift Detection

| Layer | Tool | Cadence | Action on drift |
|:---|:---|:---|:---|
| Infrastructure (Terraform / Pulumi) | terraform plan diff | daily | alert + reconcile |
| Cloud Run env vars vs SoT | gcloud diff script | daily | alert + reconcile |
| M18 config vs `config_versions` ledger | DGS startup + nightly | nightly | hash mismatch → P0 (per ADR-0067 §Decision 組件 2) |
| OPA Rego artifact vs git SoT | DGS startup | every deploy | refuses start (per NFR-Aud-006) |

---

## §6 Observability Hooks（pipeline 自監控）

對齊 [DORA metrics](https://dora.dev) — 每月 review：

| Metric | Target | 來源 |
|:---|:---|:---|
| Deployment Frequency | ≥ 1/day (post-launch) | CI/CD logs |
| Lead Time for Changes | < 1 day (NFR-Comp-004) | git → prod timestamp |
| Change Failure Rate | < 15% (NFR-Comp-005) | rollback / hotfix count |
| MTTR | < 1 day (NFR-Comp-006) | PagerDuty incidents |

**0-1 容忍例外**：DORA dashboard 先手動 weekly 抽算，V1.1 自動採集。

---

## §7 Gate 7 Exit Criteria（pipeline 側）

- [x] Git flow 文檔化（main + release + hotfix）
- [x] CI 10 stages 定義 + block-merge gate
- [x] CD staged rollout 5%/50%/100% 對齊 ADR-0067
- [x] Migration gate（dry-run + forward-only + hash chain）
- [x] Secrets management（Secret Manager + CI 不持密）
- [x] Rollback SLA 三層（M18 / app / DB）
- [x] Block-deploy gates 10 條
- [x] Drift detection daily / nightly
- [x] DORA metrics targets 對齊 NFR-Comp-004..006
- [ ] **[VALUE_DECISION_NEEDED]** Canary 起步 % — 任務要求 5%，但 ADR-0067 §Decision 組件 3 + NFR-Ops-006 寫 10%；建議統一為 **10% (per ADR)** 以免 SLO baseline 樣本不足；若業主堅持 5% 則需更新 ADR-0067 + NFR-Ops-006
- [ ] **[VALUE_DECISION_NEEDED]** Release window 黑名單規則（週五下午 / 連假前 / 月底結帳）— pipeline 自動擋 vs 人工 override；建議**自動擋 + IT-admin override + audit highlight**

---

## §8 Sign-off

- [ ] **DevOps Lead**：___________ / Date: ___________
- [ ] **SRE Lead**：___________ / Date: ___________
- [ ] **Tech Lead**：___________ / Date: ___________
- [ ] **PM**：___________ / Date: ___________
- [x] **業主**（pragmatic ops 0-1 原則）：✅ 2026-05-28 透過 task brief

---

**Gate 7 Pipeline Spec Freeze** — ✅ ready
