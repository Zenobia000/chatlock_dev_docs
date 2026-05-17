# Handoff — <feature_id>

> **目的**: 給外部 coding agent（Claude Code / Cursor / Aider）的單一入口契約。
> **產出日期**: <YYYY-MM-DD>
> **DevTeam Session**: <session_id>
> **Release**: <release_id>

---

## Frozen Artifacts

| Path | Version | SHA | Frozen At | Owner |
|:-----|:--------|:----|:----------|:------|
| docs/prd/<feature>.md | v<n> | <sha> | <ISO> | pm |
| docs/ux/user-flow-<feature>.md | v<n> | <sha> | <ISO> | ux |
| docs/analysis/system-spec-<feature>.md | v<n> | <sha> | <ISO> | analyst |
| docs/architecture/c4-<feature>.md | v<n> | <sha> | <ISO> | arch |
| docs/api/openapi-<service>.yaml | v<n> | <sha> | <ISO> | design |
| docs/data/erd-<feature>.md | v<n> | <sha> | <ISO> | design |
| docs/qa/test-plan-<release>.md | v<n> | <sha> | <ISO> | qa |
| docs/ops/runbook-<service>.md | v<n> | <sha> | <ISO> | ops |

## Acceptance Criteria

| ID | Criterion | Source |
|:---|:----------|:-------|
| AC-001 | ... | FR-001 in PRD |

## API Contract Ref
`docs/api/openapi-<service>.yaml` @ v<n>

**Breaking change policy**: 見 spec 內 `x-governance` 區塊。

## DB Migration Ref
`docs/data/migrations/<id>.sql`

**Rollback**: 見對應的 `<id>-rollback.sql`。

## Out of Scope
- <coding agent 不該動的範圍>

## Test Plan Ref
`docs/qa/test-plan-<release>.md`

**Exit criteria**: <link to section>

## Runbook Ref
`docs/ops/runbook-<service>.md`

## Rollback Plan Ref
`docs/release/readiness-<date>.md#rollback`

## ADR Index (relevant only)

| ID | Topic | Why coder needs to know |
|:---|:------|:------------------------|
| ADR-<NNN> | <topic> | <one line> |

## Telemetry Hooks

| Event / Metric | 來源 | 用途 |
|:---------------|:-----|:-----|
| event: <name> | <where to emit> | <observability use> |
| metric: <name> | <where to emit> | <SLO use> |

## Open Questions for Coder
- **Q1**: <edge case / clarification needed before commit>
- **Q2**: ...

## 不變式（coding agent 必須遵守）
- 不得修改本 handoff 引用的 frozen 文件，若需變更請回 devteam harness 寫 ADR/DR
- API 變更必須維持 OpenAPI spec 的 backward compatibility（依 `x-governance` 政策）
- DB migration 必須有對應 rollback
- 新增功能不在本 handoff 範圍 → 回 devteam 新 session

## 對應的 DevTeam 入口
若 coding agent 發現本 handoff 有歧義或需求變更，回呼業主使用：
- `/devteam-status` 看當前 session 狀態
- `/devteam-<role> "我需要 X 變更"` 觸發新 ADR/DR
