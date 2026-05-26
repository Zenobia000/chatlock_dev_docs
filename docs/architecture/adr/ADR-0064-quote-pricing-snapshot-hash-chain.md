---
id: ADR-0064
title: Quote Pricing Snapshot — Immutable Content-Addressable Table + Independent Hash Chain
status: accepted
date: 2026-05-26
deciders: [業主, dba, arch]
supersedes: []
related: [ADR-0050, ADR-0051, ADR-0061, ADR-0062, ADR-VCH-001, ADR-VCH-002]
source: Forum 2026-05-26-2241-Q01 final-report（dba-B-3(a) accept + dba-B-3(b) reject + arch-B-04）
pre_mortem: F4 (合規崩潰) + F6 (audit chain 斷裂)
eternal_transient: Eternal Audit Pattern (B4)
---

# ADR-0064: Quote Pricing Snapshot Hash Chain（獨立鏈）

## Status

Accepted (2026-05-26)

## Context

Forum Q-01 dba R2 提兩條 blocker：
1. **dba-B-3(a)**：`quote.pricing_rule_version_snapshot jsonb` embed 還是抽 FK 到 immutable snapshot table？
2. **dba-B-3(b)**：snapshot 是否要進 7 帳本 `journal_entry` hash chain？

R3 處置：
- (a) **Accept** dba hybrid 方案：建 `pricing_rule_snapshot` immutable table（content-addressable by sha256），`quote.snapshot_hash text` FK
- (b) **Reject** 入 journal_entry hash chain。理由：pricing snapshot 是「業務 audit」非「財務憑證」，合鏈會混淆兩者；replace 為 reference pointer 模式

DBA R3 ack **withdraw**（reject 理由 sound）。本 ADR 將該 hybrid 模式 + 拒絕合鏈正式化。

## Decision Drivers

| Priority | Driver | Weight | Reference |
|:---:|:---|:---|:---|
| 1 | Audit chain 完整性（K6 仲裁可追溯）| critical | ADR-VCH-001 / 002 |
| 2 | 業務 audit vs 財務憑證分流 | high | KB §07 audit |
| 3 | Snapshot dedup（row size / storage）| medium | NFR-Scal |
| 4 | Quote 重發版本鏈不破壞 | high | dba-B-4 |
| 5 | 不破壞 journal_entry 既有 hash chain | critical | ADR-VCH-001 |

## Options Considered

### Option A — jsonb embed in quote.pricing_rule_version_snapshot

| 維度 | 內容 |
|:---|:---|
| **Pros** | • 一個 query 拿 quote + snapshot<br>• 無 FK join |
| **Cons** | • Row size 重複（同 rule 版本被 N 個 quote embed）<br>• Snapshot 可變性無 enforcement（理論可被 UPDATE）<br>• 無 content-addressable dedup |
| **Fit** | V0 PoC |
| **Anti-fit** | V2 audit / dedup 要求 |
| **Cost / Effort** | XS |

### Option B — FK to immutable `pricing_rule_snapshot` table + enter journal_entry hash chain

| 維度 | 內容 |
|:---|:---|
| **Pros** | • 一條鏈到底，K6 仲裁可一鏈追溯 |
| **Cons** | • **混淆業務 audit 與財務憑證**<br>• 影響 ADR-VCH-001 既有 hash chain 不變式（憑證鏈每 append 需重簽）<br>• Snapshot 變更頻率（pricing rule 改版）會推爆 journal_entry chain<br>• 稅務 audit 看到 pricing snapshot 入鏈 → 混淆「rule 版本」與「會計憑證」|
| **Fit** | 單一財務 audit 系統 |
| **Anti-fit** | 業務 audit + 財務 audit 並存的本系統 |
| **Cost / Effort** | M（chain 重設計）|

### Option C — FK to immutable `pricing_rule_snapshot` table + **independent hash chain via reference pointer**（採用）

| 維度 | 內容 |
|:---|:---|
| **Pros** | • Content-addressable by sha256 → 本就 immutable 不需 hash_prev 鏈式設計<br>• Snapshot dedup（同 rule 版本只存一份）<br>• journal_entry hash chain 不變動（ADR-VCH-001 / 002 鏈條完整）<br>• K6 仲裁透過 `journal_entry.audit_trail.snapshot_hash` reference pointer 串接，evidence-pointed-to 而非 chain-member<br>• 業務 audit 與財務憑證分流，責任邊界清晰 |
| **Cons** | • 需 FK join 拿 snapshot 內容<br>• Reference pointer 模式要在 ADR-VCH-002 加註腳明文 |
| **Fit** | 業務 + 財務 audit 並存 |
| **Anti-fit** | — |
| **Cost / Effort** | S |

## Decision

> [!IMPORTANT]
> **選擇**: Option C — Immutable snapshot table（content-addressable）+ **獨立 hash chain via reference pointer**

### 1. Immutable Snapshot Table Schema

```sql
CREATE TABLE pricing_rule_snapshot (
  snapshot_hash text PRIMARY KEY,           -- sha256 of canonical_form
  engine_type text NOT NULL                 -- V2 = 'rule_based', V2.5 = 'opa'
    CHECK (engine_type IN ('rule_based', 'opa')),
  version_id text NOT NULL,                  -- e.g. "v2026.05.26-r3"
  policy_hash text NOT NULL,                 -- engine 內部 rule rows hash
  rule_payload jsonb NOT NULL,               -- V2 = rule_rows array; V2.5 = Rego artifact
  effective_at timestamptz NOT NULL,
  contract_template_id uuid NULL,            -- 個案 override 時填
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Append-only — DB role 禁 UPDATE / DELETE（trigger / RLS enforce）
REVOKE UPDATE, DELETE ON pricing_rule_snapshot FROM application_role;
```

**Content-addressable 性質**：

- `snapshot_hash` = sha256(canonical_form(rule_payload + engine_type + version_id + policy_hash + effective_at))
- 同 rule 版本被 N 個 quote 引用時，table 內僅 1 row（dedup）
- INSERT ON CONFLICT (snapshot_hash) DO NOTHING — 計算端 idempotent

### 2. quote.snapshot_hash FK

```sql
ALTER TABLE quote
  ADD COLUMN snapshot_hash text NOT NULL
    REFERENCES pricing_rule_snapshot(snapshot_hash);
```

取代 R1 提案的 `pricing_rule_version_snapshot jsonb` embed。Quote 重發版本（v2 / v3）時：

- 同 rule 版本 → `quote_v2.snapshot_hash = quote_v1.snapshot_hash`（dedup）
- 不同 rule 版本 → 新 snapshot row（content-addressable insert）

### 3. **Reject** 入 journal_entry hash chain

**拒絕原因**：

| 維度 | 理由 |
|:---|:---|
| **責任分類** | journal_entry hash chain 是稅務 / 會計憑證鏈（ADR-VCH-001/002 規範），具憑證等級不可變性。pricing snapshot 是「報價當下 rule 凍結」屬業務 audit。**合鏈會混淆兩者邊界** |
| **變更頻率** | pricing rule 改版 → 新 snapshot；若入 journal chain，每次 rule 改版需推 chain 重簽（成本爆炸）|
| **設計冗餘** | snapshot 是 immutable + content-addressable（hash = PK），**本就無時序鏈式需求**。每個 quote 引用獨立 snapshot，snapshot 之間無時序關係 |

### 4. K6 仲裁 Audit 完整性（reference pointer 模式）

K6 爭議仲裁需要回溯「客戶當時看到的金額計算根據」。設計：

- `journal_entry.audit_trail jsonb` 內嵌 `snapshot_hash` reference
- 仲裁 query：journal_entry → audit_trail.snapshot_hash → pricing_rule_snapshot row
- **Reference 而非合鏈**：journal_entry hash chain 仍保持 ADR-VCH-001/002 稅務鏈條完整，pricing snapshot 是 **evidence-pointed-to 而非 chain-member**

### 5. ADR-VCH-002 加註腳

ADR-VCH-002 更新加註腳明文：

> `quote.snapshot_hash` 為 pricing rule **evidence pointer**，非 `journal_entry` hash chain member。
> K6 仲裁透過 `journal_entry.audit_trail.snapshot_hash` reference 串接 pricing_rule_snapshot table，
> 不影響 voucher / journal hash chain 既有不變式（見 ADR-0064）。

### 6. Snapshot Retention（連動 DPO）

- pricing_rule_snapshot 本表保留：與 quote 同生命週期（settlement 後 5 年 hard delete）
- `contract_template_id` 欄位可反推客戶 → 列入 BR-PII-001b purge 連動清單（DPO sign-off）
- Hard delete 時：先 verify 該 snapshot 無 active quote 引用，否則 fail-closed（與 ADR-0061 fail-closed 模式對齊）

| 範疇 | 說明 |
|:---|:---|
| **適用範圍** | quote / pricing_rule audit 鏈 |
| **不適用** | journal_entry / voucher 稅務憑證鏈（仍走 ADR-VCH-001 / 002 既有 hash chain）|
| **可逆性** | 半可逆（reference pointer 模式改回入鏈需重寫 audit_trail 結構 + ADR-VCH-002 update）|

## Consequences

### Positive

- 業務 audit 與財務憑證分流，責任邊界清晰
- Snapshot table dedup → row size 收斂
- journal_entry hash chain 既有不變式不破壞（ADR-VCH-001 / 002 鏈條完整）
- K6 仲裁鏈透過 reference pointer 仍可追溯，evidence-grade 不退化
- Content-addressable insert idempotent（INSERT ON CONFLICT DO NOTHING）

### Negative

> [!WARNING]
> - Snapshot 與 journal_entry 拆鏈，K6 仲裁需 join 兩 table（追溯 query 多一跳）→ audit_trail.snapshot_hash index 補上
> - Audit 訓練：稅務 audit 看 journal_entry chain；業務 audit 看 reference pointer。需在 Runbook 寫明
> - `pricing_rule_snapshot` immutable 靠 RLS / trigger enforce，不靠 DB 物理不可變（PostgreSQL 限制）

### Follow-up Work

| Action | Owner | Due | Reference |
|:---|:---|:---|:---|
| `pricing_rule_snapshot` table + content-addressable insert | dba | P3 Gate 5b | ERD §2 |
| `quote.snapshot_hash` FK migration | dba | P3 Gate 5b | dba-B-3(a) |
| RLS / trigger 禁 UPDATE / DELETE on snapshot table | dba | P3 | append-only |
| ADR-VCH-002 加註腳（reference pointer 模式）| arch | P2 | 本 ADR §5 |
| `audit_trail.snapshot_hash` index | dba | P3 | K6 query path |
| Snapshot purge 連動 BR-PII-001b（DPO sign-off）| dpo + dba | P5 | ADR-0061 |

### 影響的下游文件

| Doc | Impact |
|:---|:---|
| `docs/architecture/data/erd.md` | §2 加 `pricing_rule_snapshot` immutable table + `quote.snapshot_hash` FK |
| `docs/architecture/adr/ADR-VCH-002-voucher-retention-7y.md` | 加註腳（§5）|
| `docs/qa/test-plan-*.md` | append-only enforcement 測項（嘗試 UPDATE / DELETE 應失敗）|
| `docs/ops/runbook-*.md` | 業務 audit vs 財務 audit 分流追溯路徑 |

## Pre-mortem Mapping

- **F4 合規崩潰**：业务 audit 與財務憑證合鏈會在 Phase II Finance 啟動後造成稅務 audit 混淆，本決策提前隔離
- **F6 audit chain 斷裂**：journal_entry chain 既有不變式不破壞；K6 仲裁透過 reference pointer 仍可追溯

## Eternal/Transient Classification

- **Eternal**：「業務 audit 與財務憑證分流」原則 + content-addressable snapshot pattern
- **Transient**：具體 sha256 算法（未來可換 sha512 + 鏈共存期）+ snapshot retention 期（連動 BR-PII-001b）

## Acceptance Criteria

- [ ] `pricing_rule_snapshot` table 建立 + append-only enforce（RLS / trigger）
- [ ] `quote.snapshot_hash` FK migration with down script
- [ ] Content-addressable insert idempotent test（同 hash 重覆 insert = 0 row affected）
- [ ] `journal_entry.audit_trail.snapshot_hash` reference pointer test（K6 query 可 join）
- [ ] ADR-VCH-002 註腳已加（reference pointer 明文）
- [ ] Snapshot UPDATE / DELETE 嘗試 fail-closed test pass
- [ ] Snapshot purge 連動 BR-PII-001b DPO sign-off

## Cross References

- Forum final-report: `.claude/context/devteam/forum/2026-05-26-2241-Q01-quote-pricing-engine/final-report.md`
- ADR-VCH-001 Platform as Voucher Keeper（journal hash chain baseline）
- ADR-VCH-002 Voucher Retention 7y（本 ADR §5 加註腳）
- ADR-0061 DGS（fail-closed 模式對齊）
- ADR-0050 / 0051 Evidence visibility / retention（reference pointer 模式類比）
- ADR-0062 Pricing Engine Bounded Context（snapshot 由 pricing engine 寫入）
