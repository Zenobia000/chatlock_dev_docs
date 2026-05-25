---
id: ADR-0060
title: Contract Template Schema Reserved Nullable (V1 對外 API 砍)
status: accepted
date: 2026-05-22
updated: 2026-05-24
deciders: [CEO (autonomous), arch, po, sd, ba, pm]
supersedes: []
related: [ADR-0030, ADR-0042, ADR-0043, ADR-0046]
source: Forum F-01 final-report + MoM #1 (OQ-NEW-3 業主裁決)
---

# ADR-0060: Contract Template Schema Reserved Nullable (V1)

## v2 Update Note (2026-05-24)

業主裁決 OQ-NEW-3「第二甲方先不考慮」cascade：
- **V1 對外 CRUD API 砍** — 改為內部 admin form only（甲方自己 ops 用）
- **Schema 仍預埋 reserved nullable**（多 partner 欄位保留結構但不開放）
- **V2 重啟成本下修為 ~3-5 天**（從原 1 sprint，因 schema 不需 retrofit）
- **ARCH-0006 reversal trigger** 仍適用：≥ 2 partner active 時抽離為獨立 `contract-governance` module
- **新增約束**：schema-level CHECK constraint 擋寫入 reserved 欄位（防 data minimization 違規，§5 個資法）

詳見 MoM #1：`.claude/context/devteam/meetings/2026-05-24-1430-oq-cascade-review/MoM.md` D9 Option A 降級履約

---

# ADR-0060: Contract Template Schema Freeze V1 (原文)

## Context

Lane B Forum F-01 收斂結論：V1.0 必須把 Contract Template schema + CRUD API（draft-state only）鎖到欄位級。UI + 狀態機物件化延 V2。

**Trade-off frame**：
- Schema 是「絕對不可逆」層 — V2 想加欄位破口就是 migration + audit chain 全部重簽
- API contract 是「第二不可逆」層 — V2 想改 PATCH semantics 會 break V1 client
- UI 是「可逆呈現」層 — V2 補也不會回頭破壞 V1

把不可逆層先 V1 凍住，可逆層延 V2，blast radius 限縮到 UI BC，不會跨到 schema / API BC。

## Decision

### V1 必交付（W17 內）

1. **Schema 凍結到欄位級**：
   - 一級欄位：`tenant_id` / `partner_id` / `version` / `effective_date` / `scope[]`（含 brand_scope + site_group_scope）
   - `liability_matrix`（6 slot）：`{ brand%, platform%, locksmith%, customer%, dispute_resolution_party, secondary_responsible }`
   - `visibility_rule` + effective scope snapshot（**不是** RBAC reference；要 snapshot 當時 effective 的 scope，否則 RBAC 規則改版會 break 歷史合約 audit chain）
   - `sla_definition` / `monthly_settlement_rule` / `cancellation_fee_tiers` / `travel_fee_split`

2. **V1 API: CRUD draft-state only**：
   - `POST /v1/contract-templates`（強制 `Idempotency-Key` header）
   - `GET /v1/contract-templates`（cursor pagination）
   - `PATCH /v1/contract-templates/{id}`（限 state=draft）
   - `DELETE /v1/contract-templates/{id}`（限 state=draft，soft-delete）
   - **Error model 鎖死**：`409 CONTRACT_VERSION_CONFLICT` / `403 CROSS_TENANT_WRITE` / `422 SCOPE_OVERLAP`

3. **V2 物件化 workflow 延後**：
   - 狀態轉移走 sub-resource action 命名 convention `:action`（避開 sub-resource collection 撞名）：
     - `POST /v1/contract-templates/{id}:submit`
     - `POST /v1/contract-templates/{id}:approve`
     - `POST /v1/contract-templates/{id}:publish`
     - `POST /v1/contract-templates/{id}:retire`
     - `POST /v1/contract-templates/{id}:clone-version`
     - `POST /v1/contract-templates/{id}:diff`
   - V1 client 不會 break（superset 設計）

4. **Operability 雙保險**（boundary 防破口）：
   - Row-level policy 禁 DB 直改（DBA add trigger / Postgres RLS）
   - ChangeRequest 強制入口（ADR-0046 hook），所有寫入產 ChangeRequest draft（V1 auto-approve；V2 接 workflow）
   - 內部 ops admin form（admin-panel +0.5 週），非工程師可建 instance

5. **Telemetry hook V1 預埋**：
   - `contract_template_changed` domain event 進 asyncapi.yaml
   - ChangeRequest hook V1 即整合
   - Observability metrics: instance count / partner_id 分布 / scope[] 重疊偵測

6. **Dogfood 第一甲方 W-2 前用 API 建出 instance**（exit criteria）

### Module owner

V1 不新增 `contract-governance` module（bounded context coupling 還沒到拆分臨界點），落 `admin-panel` backend；保留 `/v1/contract-templates` path prefix 預留 V2 抽離。`sd lead` = FR-NEW-2 driver，dba/qa supporting。

### Reversal trigger（ARCH-0006）

當 ≥ 2 partner active 時，coupling 開始升高，重新評估抽離為獨立 `contract-governance` module。

### Additive-only OpenAPI 紀律

V2 補 UI 時 schema 只能加欄不破欄；breaking change 需新 DR。

## Consequences

### 正面
- F5 schema 不可逆風險 V1 mitigated
- V2 workflow superset 設計不 break V1 client
- 第一甲方 dogfood 強制暴露 schema bug
- ChangeRequest 強制 → F4 合規 audit 路徑封閉

### 負面
- V1 timeline +1 週（含 admin form +0.5 週）
- 第二甲方 onboarding 需手動填表（V2 補 UI 才能由非開發者操作）

### 中性
- Eval threshold 降為 schema lint + 1 happy path test（非 0.95），仍可在 V1 落地

## NFR 達成

- NFR-Scal-006（V1 tenant 數 = 1，schema 可承載到 30+）
- NFR-Maint-003（OpenAPI additive-only）
- NFR-Comp（合約 4.4 audit 路徑封閉）

## Failure Modes

| Mode | Blast Radius | Mitigation |
|:---|:---|:---|
| DB 直改繞過 ChangeRequest | F4 合規崩潰 | RLS policy 禁 direct UPDATE |
| V2 補 UI 想改 schema | 全平台 migration | Additive-only 紀律 + DR review |
| Visibility rule 版本破壞歷史合約 | audit chain 斷裂 | Effective scope snapshot |
| Dogfood 沒暴露 internal slot 不足 | V2 才發現 schema 不夠 | Eval threshold 強制 cross-scope + 6-slot liability_matrix |

## Acceptance Criteria（V1 exit）

- ✅ Schema 凍結到欄位級（含 6 slot liability_matrix + visibility_rule snapshot）
- ✅ V1 CRUD draft-state API + 3 error codes + Idempotency + cursor pagination
- ✅ Row-level policy 禁 DB 直改測試 1 案 + ChangeRequest hook 100% 觸發測試 1 案
- ✅ Admin form 可建 instance（非工程師可操作）
- ✅ Dogfood 第一甲方 W-2 前建 instance（含 cross-scope visibility_rule + 完整 liability_matrix）
- ✅ Observability 3 metrics 在 Grafana

## Cross References

- Forum F-01 final-report: `.claude/context/devteam/forum/2026-05-22-1800-C01-contract-template-v0/final-report.md`
- 對應 PRD FR-NEW-2 (v2.1)
- 連動 ADR-0043 Contract Template + tenant scope（baseline）
- 連動 ADR-0046 ChangeRequest workflow
- 預期 ARCH-0006 module-boundary-contract-governance reversal trigger（P3 補）
