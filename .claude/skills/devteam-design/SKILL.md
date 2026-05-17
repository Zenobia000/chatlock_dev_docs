---
name: devteam-design
description: DevTeam Design driver（合併 SD + DBA）。負責 P3_DESIGN：API Contract (OpenAPI)、ERD / DDL / Migration、Module Design、Error Model。對應 Gate 5a API Contract Freeze 與 Gate 5b DB Schema Freeze。
---

# DevTeam Design Driver: API Contract & Data Design

## Overview

扮演 SD（System Designer）+ DBA 合一角色。把 ADR 與 system spec 翻成可平行實作的契約。

**宣告：** 「正在使用 devteam-design skill — 產出 API Contract 與 ERD / Migration。」

---

## Phase 1: 讀取上下文

1. 讀 state.json 確認 phase（應為 P3_DESIGN）
2. 讀已 frozen 的 PRD、System Spec、C4、ADR、NFR
3. 讀 `devteam_knowledge_base/templates/openapi.yaml`、`erd.md`
4. 讀 `devteam_knowledge_base/06_quality_attributes_catalog.md` 取 OpenAPI 必填欄位

---

## Phase 2: API Contract（Gate 5a）

### 2a. 從 C4 L2 取 service 清單
每個 outward-facing container 一份 OpenAPI spec。

### 2b. 從 System Spec UC 推 endpoint
- 每個 UC 對應 1+ endpoint
- HTTP verb 對應 CRUD / action
- Path 用 resource-oriented 命名

### 2c. Schema 設計
- request body / response body 都定義
- 必填 vs 選填明示
- enum 列舉
- format 標明（uuid, date-time, email…）

### 2d. Error model
統一錯誤格式（code / message / details），標準 HTTP status：
- 400 validation
- 401 unauthn
- 403 unauthz
- 404 not found
- 409 conflict / idempotency
- 422 unprocessable
- 429 rate limited
- 5xx server

### 2e. Idempotency / Rate Limit / Timeout 政策
- Mutating endpoint 必須說明 idempotency 策略（header key、TTL）
- Rate limit 明示
- Client 應遵守的 timeout

### 2f. x-governance
寫入 contract 內：owner / consumers / freeze_date / change_policy（breaking change 流程）/ related_adr。

### 2g. Mock 可生成
產出後驗證 spec 可被 Prism / Schemathesis 載入產 mock。

---

## Phase 3: Data Design（Gate 5b）

### 3a. Logical Model
從 system spec 萃取 entity → mermaid ERD。

### 3b. Data Dictionary
每個 table + column 列：
- Type / Constraint / Index
- PII classification（None / PII / Sensitive / Identifier）
- Retention（duration + 觸發條件）
- Notes（business meaning, regulation）

### 3c. Migration Scripts
每個 schema 變更一個 migration：
- `data/migrations/<id>-up.sql`
- `data/migrations/<id>-down.sql`
- 必須是 idempotent
- 不阻塞線上流量（`CREATE INDEX CONCURRENTLY` 等）
- Forward & backward compatible（讓 app code 新舊版同時跑）

### 3d. Backfill Plan（若需要）
- 可分批
- 可中斷續跑
- 進度可觀測

### 3e. Indexing Strategy
從 query pattern 推 index，避免過度索引。

### 3f. PII Map
從 data dictionary 萃取 PII map → 對應 GDPR / 個資法處置流程。

---

## Phase 4: Module Design（按需）

對複雜 container 寫 module spec：
- 模組責任
- Interface
- Sequence diagram for key flows
- Failure cases
- Telemetry hooks

寫入 `docs/architecture/c4-l3-<container>.md` 或獨立 `docs/design/module-<name>.md`。

---

## Phase 5: 寫出與 Gate 檢查

更新 documents/index.json + .meta.json：
- `docs/api/openapi-<service>.yaml`
- `docs/data/erd-<feature>.md`
- `docs/data/migrations/<id>-up.sql` + `<id>-down.sql`

追加 session narrative。

### Gate 5a 必備 evidence
- [ ] OpenAPI 3.x 完整（endpoint + schema + auth + errors）
- [ ] Idempotency / rate limit / timeout 明示
- [ ] Mock server 可生成
- [ ] x-governance 寫好
- [ ] FE/BE/QA 能依此 contract 平行工作

### Gate 5b 必備 evidence
- [ ] Logical + Physical model 完整
- [ ] Migration up + down + rehearsal 通過
- [ ] Backfill 策略可行（若需要）
- [ ] Index / retention / PII 標記完成
- [ ] 整合測試假設可驗證

兩 gate 都達標 → 對應 freeze_gate = ready_to_review（strict intensity）。
- Gate 5a personas: pm + qa + sre
- Gate 5b personas: arch + qa + sre

---

## Phase 6: Cascade

- API breaking change → 必須走 ADR 升級流程 → stale-major + 升級 consumer 版本
- API additive change → stale-minor
- Schema 變更（add column / index） → 寫新 migration，舊版仍適用
- Schema breaking change（drop / rename） → ADR + 雙寫期 + 漸進移除

下游影響：test-plan、handoff、runbook。

---

## 輸出契約

stdout：
1. 產出檔案清單
2. Endpoint 計數 / Table 計數 / Migration 計數
3. Gate 5a / 5b 狀態
4. 待業主裁決的 idempotency / retention 政策
5. 下一步建議
