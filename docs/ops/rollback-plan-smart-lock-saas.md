---
id: rollback-plan-smart-lock-saas
title: Rollback Plan — 智慧鎖 SaaS 平台
status: v1 draft (Gate 7 ready)
date: 2026-05-28
owner: devteam-ops (DevOps + SRE)
phase: P5_RELEASE
related_adrs:
  - ADR-0067   # M18 governance — Decision 組件 4 rollback window ≥ 24h
  - ADR-0068   # M18 anti-corruption
  - ADR-0064   # quote hash chain — DB rollback constraint
  - ADR-VCH-001  # voucher hash chain
  - ADR-VCH-002  # voucher 7y retention
  - ADR-0061   # DGS boundary
  - ADR-0050   # evidence visibility
related_brs:
  - BR-M18-01..05  # M18 staged rollout 5 件套
related_nfr:
  - NFR-Ops-003   # rollback ≤ 30 min (overall)
  - NFR-Ops-005   # M18 config rollback ≤ 1 min
  - NFR-Ops-006   # M18 staged rollout
related_docs:
  - docs/ops/pipeline-spec-smart-lock-saas.md
  - docs/ops/runbook-smart-lock-saas.md
  - docs/ops/slo-spec-smart-lock-saas.md
---

# Rollback Plan — 智慧鎖 SaaS 平台

> **狀態**：v1 draft（Gate 7 ready）
> **更新**：2026-05-28
> **負責人**：DevOps + SRE
> **設計原則**：rollback 是基本能力，不是失敗的證據。三層分流 + 每層獨立 SLA + 完整 audit。
> **對應**：BR-M18-01..05 staged rollout 5 件套 + ADR-0067 §Decision 組件 4 rollback window

---

## §0 設計原則

> [sre 視角] Rollback 不是「失敗」，是 error budget 還在的證據。Postmortem 重點是學習，不是究責。
> [devops 視角] 三層 rollback 路徑彼此**不可相依**：M18 config rollback 不該需要 redeploy app；app rollback 不該需要 schema rollback。

**三層 rollback 模型**：

```
┌─────────────────────────────────────────────────┐
│  Layer 3: DB Schema (compensating migration)    │  RTO ≤ 4h
│  - Forward-only migration                       │
│  - Compensating script (非 reverse DDL)         │
├─────────────────────────────────────────────────┤
│  Layer 2: App Version (k8s / Cloud Run revision)│  RTO ≤ 30 min
│  - Revision pinning to last green               │
│  - Image immutable + SHA-tagged                 │
├─────────────────────────────────────────────────┤
│  Layer 1: M18 Config (admin UI instant)         │  RTO ≤ 1 min
│  - Version-controlled config_versions ledger    │
│  - 24h window + staged 10% verification         │
└─────────────────────────────────────────────────┘
```

**經驗法則**：
1. 出問題時**先試 Layer 1 (M18 config)** — 90% 的 ops policy 改動失敗都是 config 問題
2. 確定不是 config 才動 Layer 2 (app version)
3. 只有 schema 設計失誤才動 Layer 3 (DB)

---

## §1 Layer 1 — M18 Config Rollback（instant, ≤ 1 min）

> 對齊 BR-M18-01..05 + ADR-0067 §Decision 組件 4 + NFR-Ops-005

### §1.1 觸發條件

| 觸發 | Auto/Manual | Owner |
|:---|:---|:---|
| Staged rollout SLO breach (P99 latency / error rate > baseline) | **auto-halt + alert** | system → DevOps on-call |
| KPI K3 sentiment 連動退化（M18 config 改動後 24h 內） | manual | PM + QA |
| 業主後悔 / mis-config 發現（如金額多打一個 0） | manual | M18 admin |
| Audit / 合規通報（如取消費分層改動違反合約） | manual + audit log highlight | 法務 / DPO + IT-admin 雙簽 |
| Forbidden Eval drop > 2%（M18 改動 prompt template 後） | auto-halt | QA + dev |

### §1.2 操作步驟（admin UI 一鍵回退）

```
[admin UI] → 「Config Rollback」按鈕
     │
     ▼
[Confirm dialog] ← 顯示：要回退到哪個 version (default: 前一個 active)
     │              + 影響的下游模組（per ADR-0068 reader registry）
     │              + 預計 staged rollout 時間
     ▼
[Validation] ← schema 驗證舊 version 仍合規（避免回退到已 deprecate 的 schema）
     │
     ▼
[Staged rollout (reverse)] ← 10% (10 min) → 50% (10 min) → 100%
     │
     ▼
[Audit log] ← rollback event 寫入 config_versions ledger
     │              + 標 reason = "rollback" + 觸發者 + 觸發 ticket / incident ID
     ▼
[Verify] ← downstream module 各 emit 一個 health probe 確認讀到新 version
     │              （per ADR-0068 X-Config-Version header）
     ▼
[Notify] ← Slack #ops-alerts + 影響甲方時 LINE/SMS 通知
```

### §1.3 SLA & Constraints

| 維度 | Target |
|:---|:---|
| Detect → Trigger | ≤ 30s（auto-halt 走自動）/ ≤ 5 min（manual） |
| Trigger → Full rollback | ≤ 1 min（per NFR-Ops-005） |
| Rollback window 保留 | ≥ 24h（per ADR-0067 §Decision 組件 4） |
| Force full rollout（跳過 staged） | 禁用；除非 IT-admin 雙簽 + audit highlight |
| 同一 config_key 24h 內 rollback 次數 | ≤ 3（超過 freeze 該 key 24h，必須走 ticket） |

### §1.4 Anti-pattern（禁止）

- **禁** 直接 SQL UPDATE config DB（per ADR-0068 anti-corruption layer — 必走 M18 Config Read API + admin UI）
- **禁** rollback 跳過 staged rollout（除非 emergency override）
- **禁** rollback 已被 marked-as-deprecated 的 schema version（必須先升級到下一個 still-valid version）

---

## §2 Layer 2 — App Version Rollback（≤ 30 min）

### §2.1 觸發條件（per Runbook IR-001..010 escalation）

| 觸發 | Trigger source |
|:---|:---|
| AI 準確率 K1 < 70% | nightly KPI batch |
| Forbidden Eval K8 < 90% | every deploy |
| SLO-1 API avail < 95% 7d rolling | burn rate alert |
| Uptime < 90% rolling 7d | SLO breach |
| 合約 4.4 UAT 不過 | UAT report |
| PII leak event / cross-tenant 寫入 | IR-007 |
| Image moderation violation (SOW 2.1(4)) > 0 | IR-008 |
| 部署後 Forbidden Eval drop > 5% | post-deploy verification |

### §2.2 操作步驟（Cloud Run revision pin）

```
[Decision gate] ← PM + Tech Lead + DevOps on-call 三人快速簽核（≤ 10 min）
                  P0 emergency 可由 on-call 單人決策 + 事後 audit
     │
     ▼
[Identify target revision] ← 上一個 green artifact tag (commit SHA + build timestamp)
     │                      保留 5 個 green tag for emergency
     ▼
[Pin Cloud Run service to target revision]
  gcloud run services update-traffic <service> --to-revisions=<target>=100
     │
     ▼
[Smoke test] ← 5 min；含 LINE webhook ack + DGS read + M18 config read
     │
     ▼
[Verify SLO recovery] ← 15 min watch
     │
     ▼
[Comms] ← LINE notice (if user-facing) + Admin Panel banner + 甲方 email
     │
     ▼
[Postmortem] ← 1 週內出 RCA
```

### §2.3 Cross-service consistency

App rollback 時必須評估：
- **M18 config compatibility**：rollback 後的舊 app version 能否讀新 M18 config schema？若 schema 已演進 → 同時 rollback config（Layer 1 + 2 同步）
- **OpenAPI version compatibility**：rollback 後 API 是否與 mobile app / 師傅 web app 客戶端不相容？additive-only 紀律下應該都向後相容
- **OPA Rego artifact version**：rollback 後 DGS startup hash check 是否會失敗？保留 5 個 green artifact + rego version pin

### §2.4 SLA

| 維度 | Target |
|:---|:---|
| Decision gate | ≤ 10 min（P0 single-person decision 5 min） |
| Revision pin | ≤ 5 min |
| Verify + smoke | ≤ 15 min |
| Total | **≤ 30 min** (per NFR-Ops-003) |
| Green revision 保留數 | ≥ 5 |

---

## §3 Layer 3 — DB Schema Rollback（≤ 4 h, compensating migration only）

### §3.1 紀律：Forward-Only + Compensating Migration

> 對齊 ADR-0064 / ADR-VCH-001 — hash chain 一旦 chain 建立，**不可 reverse**；只能寫 break marker + 新 chain（per Runbook IR-011 §Prevent）。

**禁止**：reverse DDL（如 `DROP COLUMN` 已 ship 過資料的欄位、`DROP TABLE` 含資料的表）。

**允許**：compensating migration — 用 forward migration 把資料 / schema 帶回**等價**舊狀態。

### §3.2 標準 expand-contract 模式

任何 schema 改動走 **2-release window**：

```
Release N:    expand        — 加新欄位 / 新表，雙寫；舊讀路徑仍可工作
Release N+1:  contract      — 切到只讀新；舊欄位標 deprecated
Release N+2:  drop (optional) — 確認無讀者後再 drop（最少 1 個 release 觀察期）
```

**rollback window**：Release N → N+1 之間（≥ 1 release）可安全 rollback；超過 contract 階段不可純 schema rollback，需走 compensating migration。

### §3.3 操作步驟

```
[Identify schema delta] ← 對比 prod schema vs 想 rollback 的 release schema
     │
     ▼
[Write compensating migration] ← forward migration，將 prod schema 帶回等價舊狀態
     │                          包含：(a) 新欄位 default backfill (b) FK 重新指向 (c) index 重建
     ▼
[Hash chain integrity check] ← 對 voucher / quote / journal_entry chain run nightly verify
     │                          per Runbook IR-011 §Diagnose SQL
     │                          mismatch → STOP，走 forensic + repair（不 rollback）
     ▼
[Stage on staging] ← run on staging copy of prod (24h fresh dump)
     │
     ▼
[Backup snapshot] ← PITR snapshot before applying on prod
     │
     ▼
[Apply on prod] ← 在 maintenance window (低流量 / 月底結帳後)
     │
     ▼
[Verify] ← row count + hash chain verify + smoke test ≥ 30 min
     │
     ▼
[Pair Layer 2 rollback] ← 通常 schema rollback 必伴隨 app rollback
```

### §3.4 SLA & Constraints

| 維度 | Target |
|:---|:---|
| Decision gate | ≤ 1h（DBA + Tech Lead + PM 三方簽核） |
| Compensating script 撰寫 + staging dry-run | ≤ 2h |
| Prod apply + verify | ≤ 1h |
| Total | **≤ 4h** |
| Maintenance window | **避開**：月底結帳期 (25-31)、發薪日 (5/10/25)、週五下午、國定假日連假前 24h |
| PITR window | ≥ 7 天（cover schema rollback decision time + dry-run + apply） |

### §3.5 Hash Chain 特殊處理（IR-011 / IR-013）

voucher / quote pricing snapshot 一旦發生 hash chain mismatch：
1. **不走 schema rollback**（rollback 不解決資料完整性問題）
2. 走 Runbook IR-011 forensic + repair（寫 `hash_chain_break_marker` row + 新 chain 從 marker 後重新計算）
3. DPO + 法務 + 甲方會計通報
4. board-level postmortem

---

## §4 跨層 rollback 決策矩陣

| 問題類型 | 試 Layer 1? | 試 Layer 2? | 試 Layer 3? |
|:---|:---:|:---:|:---:|
| 取消費 / 退款金額算錯 | ✅ first | ⚠️ if config 不解 | ❌ |
| Approval limit / SLA threshold 設錯 | ✅ first | ⚠️ if config 不解 | ❌ |
| Notification template 字錯 / 法律措辭錯 | ✅ first | ❌ | ❌ |
| AI prompt template 改壞（K3 退化） | ✅ first | ⚠️ if rollback config 不夠 | ❌ |
| Forbidden Eval drop（code path） | ❌ | ✅ first | ❌ |
| API contract bug（response shape 錯） | ❌ | ✅ first | ❌ |
| Migration 後 hash chain mismatch | ❌ | ❌ | ❌ → **IR-011 forensic + repair**（特殊路徑） |
| Schema 新欄位 nullable wrong / default 錯 | ❌ | ⚠️ if compatible | ✅ compensating migration |
| Cross-tenant leak / PII leak | **kill switch first** | ✅ urgent | ⚠️ if schema-level RLS bug |

---

## §5 Rollback Drill Schedule（DR 演練）

> [sre] 沒演練過的 rollback 路徑 = 等於沒有。

| Drill | Cadence | 演練範圍 | Owner |
|:---|:---|:---|:---|
| **M18 config rollback drill** | monthly | 隨機選一個 config_key，admin UI 改 → staged → rollback；驗 RTO ≤ 1 min | DevOps + M18 admin |
| **App version rollback drill** | quarterly | staging 環境模擬 P0；驗 RTO ≤ 30 min；驗 cross-service compatibility | DevOps + SRE |
| **DB schema compensating migration drill** | quarterly | staging dump → 模擬 expand-contract → compensating；驗 RTO ≤ 4h | DBA + DevOps |
| **Hash chain forensic drill** | semi-annual | 在 staging 人為製造 voucher mismatch → run IR-011 SQL → 修復；驗證 RPO | DBA + SRE + DPO |
| **Full DR drill**（含 cross-region restore） | annual | restore from backup to staging → 驗 RTO 4h / RPO 1h | DevOps + SRE + DPO |

**0-1 容忍例外**：
- 年度 full DR drill V1 launch 後 1 個月內跑第一次（W17+4）
- monthly M18 drill 從 W17+1 起跑

---

## §6 Communication During Rollback

| Audience | M18 config rollback | App version rollback | DB schema rollback |
|:---|:---|:---|:---|
| 甲方 PM | LINE notify（if user-facing impact） | LINE + email | LINE + email + maintenance window 提前 24h 公告 |
| 客服主管 | Slack | Slack + standby | Standby + briefing |
| Consumers（LINE） | 通常不需通知 | Service notice（if user-facing） | Maintenance window 公告 |
| 法務 / DPO | Audit log（automated） | Standby（if PII / 合約 4.4 涉及） | 強制 sign-off（if PII schema 涉及） |
| Internal team | Slack + war room（if P0） | Slack + war room | War room |

**台灣業主習慣（三層 comms）**：
1. **LINE**：即時、業務時間第一手；含「現況 + ETA + responsible owner」
2. **SMS**：after-hours / P0 / 法律時限相關
3. **Email**：formal incident report + RCA 與下次 action plan

---

## §7 Gate 7 Exit Criteria（rollback 側）

- [x] 三層 rollback 模型 + 各層獨立 SLA（1 min / 30 min / 4h）
- [x] 對齊 BR-M18-01..05 + ADR-0067 §Decision 組件 4
- [x] Forward-only + compensating migration 紀律（對齊 ADR-0064 + ADR-VCH-001）
- [x] 跨層決策矩陣
- [x] Rollback drill schedule（monthly / quarterly / annual）
- [x] Comms template 台灣慣例三層
- [ ] **[VALUE_DECISION_NEEDED]** M18 emergency 「強制全量」escape hatch — ADR-0067 §Negative §學習成本 提到「需 IT-admin 雙簽 + audit log highlight」；本 plan 直接禁用。建議**保留 escape hatch 但 24h 內 IT-admin + PM 雙簽 + 自動補 postmortem**
- [ ] **[VALUE_DECISION_NEEDED]** DB rollback maintenance window — 是否硬性「禁止月底 25-31 / 發薪日 5/10/25 / 週五下午」？建議**硬性禁止 + IT-admin override + 業主 sign-off**

---

## §8 Sign-off

- [ ] **DevOps Lead**：___________ / Date: ___________
- [ ] **SRE Lead**：___________ / Date: ___________
- [ ] **DBA Lead**（Layer 3）：___________ / Date: ___________
- [ ] **PM**：___________ / Date: ___________
- [ ] **法務**（hash chain / 合規）：___________ / Date: ___________
- [ ] **DPO**（PII / schema rollback）：___________ / Date: ___________
- [x] **業主**（pragmatic ops 0-1）：✅ 2026-05-28 透過 task brief

---

**Gate 7 Rollback Plan Freeze** — ✅ ready
