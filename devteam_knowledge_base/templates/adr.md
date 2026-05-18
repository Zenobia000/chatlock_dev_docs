# ADR-<NNN> — <Decision Title>

> **Status**: Proposed | Accepted | Superseded by ADR-<NNN>
> **Date**: <YYYY-MM-DD>
> **Owner**: devteam-arch (Architect persona)
> **Scope**: <feature / service / cross-team>
> **Tags**: <topic1>, <topic2>  <!-- 供 indexes/topic_index.json 提取；建議用 auth / data-model / messaging / rollout / observability / api-style / stack / resilience / privacy 等慣用詞 -->
> **Feature**: <feature-slug>  <!-- 對應 docs/prd/<feature>.md 的 slug；供 indexes/feature_index.json 提取 -->
> **Related KB**: <KB-NN §X>  <!-- 引用了哪幾段 KB；供 indexes/catalog_usage.json 提取 -->


---

## Context
- 目前問題 / 觸發此決策的情境
- 業務與技術限制
- 相關 NFR

## Decision Drivers
- Reliability
- Time-to-market
- Cost
- Security
- Operability
- 其他：<list>

## Options Considered

### Option A — <name>
- Pros: ...
- Cons: ...

### Option B — <name>
- Pros: ...
- Cons: ...

### Option C — <name>
- Pros: ...
- Cons: ...

## Decision
- **選擇**: Option <X>
- **適用範圍**: <where this applies>
- **不適用**: <where this does NOT apply>

## Consequences
- **Positive**: ...
- **Negative**: ...
- **Follow-up work**: ...
- **影響的下游文件**:
  - docs/api/openapi-*.yaml
  - docs/data/erd-*.md
  - docs/ops/runbook-*.md

## Links
- Related PRD: docs/prd/<feature>.md
- C4 Diagram: docs/architecture/c4-<feature>.md
- API Spec: docs/api/openapi-<service>.yaml
- Migration Plan: docs/data/migrations/<id>.sql
