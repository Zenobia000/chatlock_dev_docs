---
id: ADR-0065
title: ChangeRequest.type Lookup Table Migration — Break ADR-0046 V1 Enum Freeze
status: accepted
date: 2026-05-26
deciders: [業主, dba, ba, arch]
supersedes_in_part: [ADR-0046]
related: [ADR-0040, ADR-0042, ADR-0046, ADR-0062, ADR-0066]
source: Forum 2026-05-26-2241-Q01 final-report（dba-B-1 + ba-B-2 + 業主 Q4=A）
pre_mortem: F4 (合規崩潰) + F5 (規模困境)
eternal_transient: Eternal Schema Pattern (B4)
---

> 
> **🔄 Migration Status (2026-05-28)**: `STILL_VALID_UNDER_M15_M18`
> **Reviewed against**: 2026-05-20 final spec (xlsx)
> **Reviewed on**: 2026-05-28
> **Module scope**: M15, M18
> **Per ADR-0100 §1 classification** (.claude/context/devteam/meetings/2026-05-27-1130-final-spec-migration-strategy/MoM.md)


# ADR-0065: ChangeRequest.type Lookup Table Migration

## Status

Accepted (2026-05-26)

## Context

Forum Q-01 D7-B 設計新增 `pricing_rule` 為 `change_request.type` 的 enum value。DBA R2 blocker（dba-B-1）指出：

- PostgreSQL `ALTER TYPE ADD VALUE` 不可單獨 `DROP VALUE`，違反 ERD §9「Down migration mandatory」紀律
- ADR-0046 spec 明文「未來 type 會擴充 ai_sop, template, contract...」，每加一個就累積一個 dead value 風險
- 與既有 `journal_entry.reason_code v2.2` 已踩過坑的 enum 化策略不一致

R3 升業主 binary choice Q4：
- **A**：lookup table（dba 推薦，破壞 ADR-0046 V1 enum schema freeze，~3 sprint）
- **B**：ALTER TYPE + dead value BI mitigation（V1 妥協，~0.5 sprint，dead value 永久污染）

**業主 2026-05-26 裁決：Q4=A**（lookup table，破 ADR-0046 V1 freeze）。

本 ADR 將該裁決正式化為 schema migration plan，並對 ADR-0046 加 supersedes-in-part pointer。

## Decision Drivers

| Priority | Driver | Weight | Reference |
|:---:|:---|:---|:---|
| 1 | Down migration mandatory（ERD §9）| critical | ERD discipline |
| 2 | 未來 type 擴充頻率（ai_sop / template / pricing_rule / emergency_pricing_track）| high | ADR-0046 spec |
| 3 | BI / data dictionary 不被 dead value 污染 | high | NFR-Maint |
| 4 | 與既有 `journal_entry.reason_code` enum 化策略一致 | high | dba 既有踩坑 |
| 5 | V1 工期成本 | medium | 3 sprint vs 0.5 sprint |

## Options Considered

### Option A — `change_request_type_dim` lookup table + FK migration（採用）

| 維度 | 內容 |
|:---|:---|
| **Pros** | • Down migration 可逆（lookup row 可下架）<br>• 未來 type 擴充零 schema 變更（INSERT row）<br>• 與 `journal_entry.reason_code v2.2` 策略一致<br>• BI / data dictionary 不污染<br>• 符合 ADR-0046 spec「未來會擴充」精神（schema 為這個準備）|
| **Cons** | • **破壞 ADR-0046 V1 enum schema freeze**<br>• 4-phase dual-write migration（~3 sprint）<br>• 既有 row 需 backfill |
| **Fit** | 長期 V2+ platform |
| **Anti-fit** | 一次性 V1 PoC |
| **Cost / Effort** | M-L（3 sprint）|

### Option B — `ALTER TYPE ADD VALUE 'pricing_rule'` + BI 過濾規則

| 維度 | 內容 |
|:---|:---|
| **Pros** | • 0.5 sprint<br>• ADR-0046 V1 schema freeze 不破壞 |
| **Cons** | • **無單獨 DROP VALUE**（PostgreSQL 限制）<br>• Dead value 永遠在 schema / data dictionary 內<br>• 每加一個 type（ai_sop / template / emergency_pricing_track）累積一個 dead value 風險<br>• 違反 ERD §9 down migration mandatory<br>• BI 報表分類規則需每次新增 type 改寫 |
| **Fit** | V1 緊急上線 |
| **Anti-fit** | 預期會擴充 type（已知 ai_sop / template / pricing_rule / emergency_pricing_track 四個將到位）|
| **Cost / Effort** | XS（0.5 sprint）但 tech debt 累積 |

## Decision

> [!IMPORTANT]
> **選擇**: Option A — `change_request_type_dim` lookup table + 4-phase dual-write migration

### 1. Lookup Table Schema

```sql
CREATE TABLE change_request_type_dim (
  type_id smallserial PRIMARY KEY,
  code text NOT NULL UNIQUE,                -- e.g. 'pricing_rule'
  display_name text NOT NULL,                -- '計價規則變更'
  scope_level text NOT NULL                  -- 'global' / 'per_contract' / 'per_case' / 'emergency'
    CHECK (scope_level IN ('global', 'per_contract', 'per_case', 'emergency')),
  approval_chain jsonb NOT NULL,             -- ba-B-2 authority matrix 引用
  effective_from date NOT NULL,
  effective_to date NULL,                    -- NULL = 永久 active
  retired_reason text NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 不允許 hard DELETE；retired 走 effective_to 軟下架
REVOKE DELETE ON change_request_type_dim FROM application_role;
```

### 2. V1 初始 Type Rows（8 個）

| code | scope_level | 引用 |
|:---|:---|:---|
| `policy` | global | ADR-0046 既有 |
| `price` | per_case | ADR-0039 / 0046 |
| `rbac` | global | ADR-0042 |
| `sla` | global | ADR-0045 |
| `template` | global | ADR-0060 |
| `contract` | per_contract | ADR-0043 |
| `pricing_rule` | global / per_contract | **新增（本 ADR）** |
| `emergency_pricing_track` | emergency | **新增（本 ADR，呼應 ADR-0066 急件 carve-out）** |

### 3. 4-Phase Dual-Write Migration

**Phase 1 — Add column（V1.x）**

```sql
ALTER TABLE change_request
  ADD COLUMN type_id smallint NULL REFERENCES change_request_type_dim(type_id);

-- 同時建 lookup table + 初始化 8 個 type rows
```

**Phase 2 — Backfill**

```sql
-- 既有 row 依 type enum 反查 type_id 填入
UPDATE change_request cr
  SET type_id = (SELECT type_id FROM change_request_type_dim WHERE code = cr.type::text);

-- Backfill 完成後加 NOT NULL constraint
ALTER TABLE change_request ALTER COLUMN type_id SET NOT NULL;
```

**Phase 3 — Swap reads**

- App code 改讀 `type_id`（透過 JOIN `change_request_type_dim`）
- Dual-write 期：app code 寫入時同時設 `type` enum + `type_id`
- BI 報表改用 `change_request_type_dim.display_name` 顯示

**Phase 4 — Drop enum column（V3）**

```sql
-- 確認所有 read path 已切到 type_id 後
ALTER TABLE change_request DROP COLUMN type;
DROP TYPE change_request_type;
```

**Down migration（each phase reversible）**：

- Phase 1 down：`ALTER TABLE DROP COLUMN type_id; DROP TABLE change_request_type_dim;`
- Phase 2 down：清空 backfilled `type_id`，drop NOT NULL
- Phase 3 down：app code revert 讀 `type` enum
- Phase 4 down：**不可逆**（drop column 後）→ Phase 4 前需業主 + ops 簽核

### 4. ba-B-2 Authority Matrix（lookup table 內 jsonb 結構）

```jsonb
{
  "pricing_rule": {
    "scope": "global",
    "approvers": ["platform_lead", "legal", "accounting", "domain_expert"],
    "min_signatures": 4,
    "reference_adr": ["ADR-0028", "BR-SOP-001"]
  },
  "pricing_rule_per_contract": {
    "scope": "per_contract",
    "approvers": ["brand_lead", "legal", "accounting"],
    "min_signatures": 3,
    "reference_clause": "合約 §V21"
  },
  "price": {
    "scope": "per_case",
    "approvers": ["customer_service_lead"],
    "min_signatures": 1,
    "audit_required": true,
    "reference_adr": ["ADR-0046"]
  },
  "emergency_pricing_track": {
    "scope": "emergency",
    "approvers": ["customer_service_lead"],
    "min_signatures": 1,
    "backfill_within_hours": 24,
    "backfill_approvers": ["accounting"],
    "reference_adr": ["ADR-0066", "BR-CR-002"]
  }
}
```

### 5. ADR-0046 Supersedes-in-part Pointer

ADR-0046 V1 enum schema freeze 在 `change_request.type` 欄位上由本 ADR 取代。其他部分（state machine / approval workflow / audit trail）仍 active。ADR-0046 的 `See also` 將加 `Superseded in part by ADR-0065 (lookup table migration)`。

### 6. 與 `journal_entry.reason_code v2.2` 策略對齊

`journal_entry.reason_code` 已於 v2.2 走 lookup table 模式（dba 既有踩坑經驗）。本 ADR 將同一模式套用於 `change_request.type`，避免 schema 不一致導致 ORM mapping / BI 報表額外特例。

| 範疇 | 說明 |
|:---|:---|
| **適用範圍** | `change_request.type` 欄位 schema migration |
| **不適用** | 其他 enum 欄位（如 `WO.state` / `quote.state` 為 finite 狀態機，無擴充需求，保持 enum）|
| **可逆性** | Phase 1-3 可逆；Phase 4 drop column 不可逆（需業主 + ops 簽核）|

## Consequences

### Positive

- Down migration 紀律恢復（ERD §9）
- 未來 type 擴充（ai_sop / template / pricing_rule / emergency_pricing_track）零 schema 變更
- 與 `journal_entry.reason_code v2.2` 策略一致，dba 不再例外處理
- BI / data dictionary 不污染 dead value
- ba-B-2 authority matrix 透過 lookup table jsonb 結構化（替代 ADR-0046 原本 `approvers: [<required_role_list>]` 自由文字）

### Negative

> [!WARNING]
> - **3 sprint 工期**（4-phase dual-write，跨 V1.x 與 V2）
> - 破壞 ADR-0046 V1 schema freeze → 需更新 ADR-0046 supersedes pointer + ledger 登記
> - Dual-write 期 app code 複雜度上升（同時 set `type` enum + `type_id` FK）
> - BI 報表現有 query 需改寫（從讀 enum 改 JOIN dim table）

### Follow-up Work

| Action | Owner | Due | Reference |
|:---|:---|:---|:---|
| Phase 1 migration（add column + lookup table + 8 rows）| dba | P3 Gate 5b | §3 |
| ADR-0046 加 supersedes-in-part pointer | arch | P2 | §5 |
| Phase 2 backfill script + verify | dba | P3 | §3 |
| App code dual-write 改造 | sd | P4 | §3 |
| BI 報表 query 改寫 + 文件 | po + bi | P4 | §3 |
| Phase 4（V3）business case + 業主 sign-off | arch + ops | V3 | §3 |

### 影響的下游文件

| Doc | Impact |
|:---|:---|
| `docs/architecture/adr/ADR-0046-change-request-object.md` | 加 supersedes-in-part pointer |
| `docs/architecture/data/erd.md` | §2 加 `change_request_type_dim` lookup table + `change_request.type_id` FK |
| `docs/architecture/data/migrations/` | 4-phase migration SQL |
| `docs/analysis/system-spec-smart-lock-saas.md` | §3 BR-CR-002 authority matrix 引用 lookup table |
| `docs/qa/test-plan-*.md` | dual-write 一致性測項 + down migration 演練 |

## Pre-mortem Mapping

- **F4 合規崩潰**：authority matrix 結構化進 lookup table jsonb，避免散落 ADR-0028 / 0046 多處
- **F5 規模困境**：未來 type 擴充零 schema 變更，30 partner active 時 schema 仍穩

## Eternal/Transient Classification

- **Eternal**：「擴充頻繁的 enum → lookup table」schema 設計原則 + down migration mandatory 紀律
- **Transient**：4-phase 具體 SQL 寫法 + V1 初始 8 個 type rows（會隨時間擴充）

## Acceptance Criteria

- [x] 業主 2026-05-26 Q4=A 裁決
- [ ] `change_request_type_dim` table 建立 + 8 個初始 type rows
- [ ] Phase 1 migration with down script 演練 1 次
- [ ] Phase 2 backfill script + verify（既有 row 100% mapped）
- [ ] Phase 3 dual-write app code 上線 + 一致性測項 pass
- [ ] BI 報表全數改寫並驗證 row count 對齊
- [ ] ADR-0046 supersedes-in-part pointer 已加
- [ ] ba-B-2 authority matrix 落地進 `change_request_type_dim.approval_chain` jsonb
- [ ] Phase 4 drop column 暫不執行（待 V3 + 業主 sign-off）

## Cross References

- Forum final-report: `.claude/context/devteam/forum/2026-05-26-2241-Q01-quote-pricing-engine/final-report.md`
- ADR-0046 ChangeRequest Object（supersedes in part）
- ADR-0040 Refund Approval Tiers（type=`refund` 將透過 lookup row 接入）
- ADR-0042 RBAC 4-tier（authority matrix 連動）
- ADR-0062 Pricing Engine Bounded Context（pricing_rule type 落地）
- ADR-0066 Quote ↔ WO Lifecycle Binding（emergency_pricing_track type 落地）
