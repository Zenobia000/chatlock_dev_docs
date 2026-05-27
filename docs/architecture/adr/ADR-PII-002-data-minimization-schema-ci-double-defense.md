---
id: ADR-PII-002
title: 資料極小化以 schema 約束 + CI gate 雙層防線
status: accepted
date: 2026-05-24
deciders: [CEO (autonomous), arch, ba, dba]
related: [ADR-0030, ADR-0050, ADR-0051, ADR-0060, ADR-0061]
source: MoM #1 (OQ-NEW-1 cascade — Option A 降級履約附帶 §5 殘留 rule)
---

> 
> **🔄 Migration Status (2026-05-28)**: `STILL_VALID_UNDER_M17_M02_cross-cutting`
> **Reviewed against**: 2026-05-20 final spec (xlsx)
> **Reviewed on**: 2026-05-28
> **Module scope**: M17, M02, cross-cutting
> **Per ADR-0100 §1 classification** (.claude/context/devteam/meetings/2026-05-27-1130-final-spec-migration-strategy/MoM.md)


# ADR-PII-002: 資料極小化雙層防線

## Context

Option A 降級履約後（家族覆核改 event log），ADR-0061 OPA Rego BR-PII-001a status = dormant。但個資法 §5（資料蒐集極小化）殘留要求：「不收集就不留」。schema 預埋 + dormant rule 等於「結構存在但 NULL」— 須補額外防線避免誤寫入。

審計層面需要書面 control description（不能只看 code）。

## Decision

### 防線一：Schema-level CHECK constraint

dormant 欄位（含 ADR-0060 reserved 多 partner 欄位、ADR-0061 dormant rule 對應的 PII 欄位）強制：

```sql
ALTER TABLE <table> ADD CONSTRAINT chk_<field>_dormant
  CHECK (<field> IS NULL);
-- 任何寫入嘗試 → 23514 check_violation
```

### 防線二：CI lint gate

```yaml
# .github/workflows/data-minimization-lint.yml
- name: Check no INSERT/UPDATE on dormant fields
  run: |
    rg "INSERT.*<dormant_field>|UPDATE.*SET.*<dormant_field>" src/ --type sql
    if [ $? -eq 0 ]; then exit 1; fi
```

### 防線三：Audit hook（最低層 fail-safe）

DGS 啟動時掃描 dormant rule status；若任何 dormant rule 在 runtime 被觸發 → emit `policy.minimization_violation` event + alert。

### Control description（書面）

寫進 `docs/policy/data-minimization-controls.md`：
1. List of dormant rules + dormant fields（with policy_version_id）
2. Each control 對應 §5 個資法條文引用
3. Audit 抽查方式（季度 grep + EXPLAIN check）

## Consequences

### 正面
- §5 individual control 在 schema、CI、runtime 三層守住
- 審計可拿書面 control description（不只看 code）
- 不需 runtime 額外 audit overhead（CHECK constraint 是 DB level cheap）

### 負面
- 開發者誤寫入時 PR fail（friction 上升 ~5%）
- dormant 欄位 schema 改動需走 ChangeRequest

### 中性
- 若 OQ-NEW-1 / OQ-NEW-3 業主未來反悔（升回 P0）→ 走 ADR change 把 dormant 改 active，schema CHECK constraint 同步移除

## NFR 達成
- NFR-Priv-001~008（個資 + GDPR 雙合規）
- NFR-Aud-001~006（audit 書面 + 可重播）
- NFR-Comp-003（個資法 §5 / §27）

## Acceptance Criteria
- ✅ CHECK constraint deployed 在所有 dormant 欄位
- ✅ CI lint gate active；至少 1 個 negative case PR 證明 fail
- ✅ DGS minimization_violation event 在 staging 演練 1 次
- ✅ `docs/policy/data-minimization-controls.md` 法務 sign-off

## Cross References
- ADR-0061 OPA Rego dormant status
- ADR-0060 reserved nullable 多 partner 欄位
- ADR-0050 / 0051 Evidence visibility / retention
- BR-AUDIT-007 event log（同源於 Option A cascade）
