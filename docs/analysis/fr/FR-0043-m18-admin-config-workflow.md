---
id: FR-0043
title: M18 Admin Config Workflow（user-maintained runtime config）
status: active
phase: I
depends_on:
  - ADR-0067   # M18 config governance — Phase 0 critical path
mapped_to:
  - M18    # System Admin / Master Config / IT Ops (primary)
  - M17    # Audit
superseded_clauses:
  - BR-M18-01    # config 改動需 propose + validate + approve + staged rollout (per ADR-0067 5 組件)
  - BR-M18-02    # config_version 每改 +1 (audit)
  - BR-M18-03    # rollback ≤ 1min + 前版本保留 ≥ 24h
  - BR-M18-04    # JSON schema validation 前置 (admin UI + backend 雙驗)
  - BR-M18-05    # 跨模組讀 config 走 Config Read API (anti-corruption per ADR-0067 follow-up)
emits_events:
  - ConfigChangeProposed
  - ConfigChangeApproved
  - ConfigChangeRolledOut       # staged rollout step
  - ConfigChangeRolledBack
  - ConfigValidationFailed
  - ConfigVersionPublished
nfr_flavored: false       # 部分 NFR 對齊但本 FR 含 user-facing admin UI workflow
related_nfrs:
  - NFR-Perf-008    # config read P99 ≤ 50ms
  - NFR-Avail-NN    # staged rollout SLO
  - NFR-Ops-005     # rollback ≤ 1min
  - NFR-Ops-006     # staged rollout 三段
  - NFR-Aud-007     # config change audit 100% / retention 7y
priority: P0
tier: 1
owner: System Admin / IT Admin / 主管
last_reviewed: 2026-05-28
related_adrs:
  - ADR-0067    # M18 config governance (主對齊)
  - ADR-VCH-002 # 7y retention 對齊
  - ADR-0042    # RBAC (admin permission)
related:
  - "../../_source/01-workorder-erp.md#m18-system-admin"
  - "../../architecture/adr/ADR-0067-m18-runtime-config-governance.md"
created_in: "Phase I — A3.4 ERP 缺漏補 (M18 admin workflow)；對應 ADR-0067 落地"
---

# FR-0043 — M18 Admin Config Workflow

> **Phase I 新增 (2026-05-28)** — ADR-0067 的 user-facing 落地 FR。Phase 0 critical path blocker 已 freeze ADR，本 FR 為實作對應 admin UI / API。
> Admin user-facing 但非 chatbot，不需 §2.1 dialogue。

## §1 Use Case Skeleton

| 欄位 | 內容 |
|:-----|:-----|
| **Actor** | System Admin (config change proposer) / IT Admin (approver / rollback executor) / 主管 (high-risk approver) |
| **Secondary Actors** | M18 Config Store, M17 Audit, 跨模組 config readers (M04 quote / M11 refund / M06 dispatch / etc.) |
| **Trigger** | Admin 在 admin UI 提 config change（如取消費調整 / SLA 改 / approval limit 調 / template 改 / role permission 改） |
| **Precondition** | Actor 具備 config-write permission ([ref: ADR-0042]); schema 已定義 |
| **Main Flow** | 詳見 §1.1 |
| **Alternative Flow** | 詳見 §1.2 |
| **Postcondition** | config_version+1 publish；staged rollout 完成；emit `ConfigVersionPublished`；跨模組讀者 cache invalidation 完成 |
| **Out-of-Scope** | code-level config (env var / secret，走 deploy)；user data |

### §1.1 Main Flow

1. Admin 在 admin UI 選 config key + 提 new value + reason
2. 系統依 JSON schema validate ([ref: BR-M18-04])
3. validation fail → §1.2 A1
4. validation pass → 建 change_proposal row (status="pending_approval")
5. emit `ConfigChangeProposed`
6. Approver review + approve (per RBAC level)
7. approve → emit `ConfigChangeApproved`
8. 進 staged rollout (per [ref: ADR-0067 組件 3])：
   - canary 10% (≥ 10 min)
   - ramp 50% (≥ 10 min)
   - full 100%
9. 每段 emit `ConfigChangeRolledOut` (含 stage)
10. 監控 SLO (error rate / P99 latency) 每段卡 baseline
11. 全段過 → config_version+1 publish ([ref: BR-M18-02])
12. emit `ConfigVersionPublished` + 跨模組 invalidation broadcast
13. END

### §1.2 Alternative Flow

```
A1. Schema validation fail (第 3 步):
    A1.1 emit `ConfigValidationFailed` (含 error detail)
    A1.2 admin UI 顯示具體 error
    A1.3 **永不**寫入 DB (即使 admin 強制送)

A2. Staged rollout 中 SLO breach (第 10 步):
    A2.1 自動 halt + alert SRE
    A2.2 emit `ConfigChangeRolledBack`
    A2.3 回 previous version (≤ 1min per NFR-Ops-005)
    A2.4 audit 標 rollback reason

A3. Manual rollback (admin 主動):
    A3.1 admin UI tap "rollback" 按鈕
    A3.2 rollback 也走 staged 機制 (先 10% 回退驗證)
    A3.3 emit `ConfigChangeRolledBack`
    A3.4 audit 標 actor + reason

A4. 高風險 config change (e.g. RBAC / pricing):
    A4.1 強制走 IT Admin + 主管雙簽
    A4.2 staged rollout 階段拉長 (canary ≥ 30 min)
    A4.3 強制業務時間執行 (不可半夜偷改)

A5. 跨模組讀者 cache 不一致 (第 12 步 broadcast 後):
    A5.1 監控 invalidation lag P99
    A5.2 > 5s 觸發 alert (per ADR-0067 §Negative mitigation)
    A5.3 TTL 30s 兜底

A6. Force flag override (escape hatch):
    A6.1 [per ADR-0067 §Negative mitigation] 「強制全量」需 IT-admin 雙簽 + audit highlight
    A6.2 跳過 staged rollout 直接 100%
    A6.3 audit log 必含「FORCE_FULL_ROLLOUT」+ 高度顯示給 SRE

A7. Config 改動但有 in-flight transaction (per ADR-0067 §Decision 組件 5):
    A7.1 交易開始時 snapshot config_version
    A7.2 後續所有計算用 snapshot version (不切換)
    A7.3 confirm WorkOrder / payment / settlement 保留原 version

A8. Audit retention check (cron):
    A8.1 [ref: BR-M18-NN] 7y retention
    A8.2 cron 檢查超期 audit 是否 archived (per ADR-VCH-002)
```

## §2 Acceptance Criteria (G/W/T)

### AC-01: Happy path config change

```gherkin
Given Admin 提取消費 config: 1500 → 2000，reason="物價調整"
When 系統 validate schema (number, range 500~5000) pass
Then change_proposal 建立 status="pending_approval"
  And emit `ConfigChangeProposed`

When IT Admin approve
Then emit `ConfigChangeApproved`
  And 進 staged rollout: canary 10% → 50% → 100% (各 ≥ 10 min)
  And emit `ConfigVersionPublished` (v=N+1)
```

### AC-02: Schema validation fail

```gherkin
Given Admin 提取消費 = "abc" (非 number)
When validate
Then 422 + 顯示「值必須為 number」
  And emit `ConfigValidationFailed`
  And **不**寫入 DB
```

### AC-03: Staged rollout SLO halt

```gherkin
Given canary 10% rollout 中
When 取消費相關 module error rate > baseline 5%
Then 自動 halt
  And emit `ConfigChangeRolledBack`
  And 回 v=N
  And SLO 恢復 ≤ 1min ([ref: NFR-Ops-005])
```

### AC-04: Manual rollback

```gherkin
Given config v=N+1 已 full rollout
When Admin tap "rollback to v=N"
Then 走 staged rollback (10% 先驗)
  And 全段過 → 回 v=N
  And emit `ConfigChangeRolledBack`
```

### AC-05: 高風險雙簽

```gherkin
Given Admin 提 RBAC permission 矩陣變更
When 系統識別為高風險 (per category)
Then 強制 IT Admin + 主管雙簽
  And staged rollout canary ≥ 30 min (拉長)
  And 不允許半夜時段執行
```

### AC-06: In-flight transaction snapshot

```gherkin
Given 月結 batch 開始時 config v=N
When 跑到一半 admin publish v=N+1
Then batch 仍用 v=N (snapshot)
  And 新交易才用 v=N+1
  And ([ref: ADR-0067 組件 5])
```

### AC-07: Cache invalidation broadcast

```gherkin
Given config v=N+1 publish
When 跨模組 readers (M04 / M11 / M06) 收到 broadcast
Then 5s 內全部 cache refetch
  And invalidation lag P99 < 5s
  And 超過 → alert
```

### AC-08: Force full rollout escape hatch

```gherkin
Given 緊急 config 需立即生效 (e.g. block 攻擊 IP)
When Admin tap "force full rollout" + IT Admin 雙簽
Then 跳過 staged
  And audit log highlight "FORCE_FULL_ROLLOUT"
  And SRE 收 alert
```

### AC-09: Audit retention 7y

```gherkin
Given config change audit log 6.5y old
When cron 跑 retention check
Then 不 archive (未滿 7y)

Given audit log 7.1y old
When cron 跑
Then archive to cold storage ([ref: ADR-VCH-002 align])
```

## §3 Reference Map

| 類型 | ID | 用途 |
|:-----|:---|:-----|
| BR | BR-M18-01~05 | propose flow / version / rollback / validation / Read API |
| ADR | ADR-0067 | 主對齊 — M18 config governance |
| ADR | ADR-VCH-002 / ADR-0042 | retention / RBAC |
| NFR | NFR-Perf-008 / NFR-Ops-005/006 / NFR-Aud-007 | config read / rollback / staged / audit |
| Domain Event | ConfigChange* / ConfigValidation* / ConfigVersion* | M17 audit + M18 dashboard |
| Source spec | `docs/_source/01-workorder-erp.md#m18-system-admin` | M18 |

## §4 Change Log

| Date | Change | Why |
|:-----|:-------|:----|
| 2026-05-28 | **新建** A3.4 ERP 缺漏補 (M18 admin workflow — ADR-0067 落地 FR) | Phase 0 critical path 落地對應 |
