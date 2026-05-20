# Handoff Package — {feature_id}

> **📋 Status**: ready for coding agent | superseded
> **🗓 Generated at**: YYYY-MM-DD
> **👤 Owner**: DevTeam Harness (session: {session_id})
> **🔖 Version**: v1
> **🚀 Release**: {release_id}
> **🎯 Target**: external coding agent (Claude Code · Cursor · Aider · human dev)

---

## 📋 Executive Summary

> [!TIP]
> **TL;DR (30s)**: This handoff packages **{N} frozen artifacts** for `{feature_id}` implementation. **{M} acceptance criteria** to satisfy. Out-of-scope is explicit below. **DO NOT modify frozen docs** — bounce back via `/devteam-{role}` if change needed.

| 維度 | 摘要 |
|:---|:---|
| **🎯 Feature** | {feature_id} |
| **📦 Frozen artifacts** | {N} docs |
| **✅ Acceptance criteria** | {M} testable items |
| **🚫 Out of scope** | {one-line scope guardrail} |
| **🎯 First action for coder** | review `docs/prd/{feature}.md` + `docs/api/openapi-{service}.yaml` |

> [!IMPORTANT]
> **Critical contract**: coding agent must respect all 不變式 in the bottom section. Frozen docs are immutable — any change triggers DR + cascade in DevTeam harness, not in coder's working branch.

---

## 🔒 Frozen Artifacts

> 所有 path 的 SHA 是 freeze 當下的，coder 應從 main branch 讀對應 SHA。

| Path | Version | SHA | Frozen At | Owner |
|:---|:---|:---|:---|:---|
| `docs/prd/{feature}.md` | v{n} | `{sha}` | {ISO} | pm |
| `docs/ux/user-flow-{feature}.md` | v{n} | `{sha}` | {ISO} | ux |
| `docs/analysis/system-spec-{feature}.md` | v{n} | `{sha}` | {ISO} | analyst |
| `docs/architecture/c4-{feature}.md` | v{n} | `{sha}` | {ISO} | arch |
| `docs/api/openapi-{service}.yaml` | v{n} | `{sha}` | {ISO} | design |
| `docs/data/erd-{feature}.md` | v{n} | `{sha}` | {ISO} | design |
| `docs/qa/test-plan-{release}.md` | v{n} | `{sha}` | {ISO} | qa |
| `docs/ops/runbook-{service}.md` | v{n} | `{sha}` | {ISO} | ops |

---

## ✅ Acceptance Criteria

> 通過全部 AC 後才能 PR。每條都對應 PRD 的 FR / NFR。

| ID | Criterion | Source | Verification |
|:---|:---|:---|:---|
| AC-001 | {testable criterion} | PRD FR-001 | E2E test |
| AC-002 | {testable criterion} | PRD FR-002 | unit test |
| AC-003 | latency p95 < {ms} | PRD NFR Performance | perf test |
| ... | ... | ... | ... |

---

## 🌐 API Contract

| 項目 | 內容 |
|:---|:---|
| **OpenAPI spec** | [`docs/api/openapi-{service}.yaml`](../../docs/api/openapi-{service}.yaml) @ v{n} |
| **Breaking change policy** | 見 spec 內 `x-governance` 區塊 |
| **Versioning strategy** | URL versioning · header versioning · (per ADR-NNN) |

> [!WARNING]
> API 變更必須維持 OpenAPI spec 的 backward compatibility（依 `x-governance` 政策）。若需 breaking change → DR back to harness。

---

## 💾 DB Migration

| 項目 | 內容 |
|:---|:---|
| **Migration script** | [`docs/data/migrations/{id}.sql`](../../docs/data/migrations/{id}.sql) |
| **Rollback script** | [`docs/data/migrations/{id}-rollback.sql`](../../docs/data/migrations/{id}-rollback.sql) |
| **Strategy** | expand-contract / hot upgrade / downtime window |

> [!CAUTION]
> **DB migration 必須有對應 rollback**。無 rollback 的 migration 違反不變式，將被 QA gate block。

---

## 🚫 Out of Scope

> [!WARNING]
> 以下範圍**不在本 handoff 內**，coding agent 不應動。若實作需要這些範圍，**回呼 DevTeam 開新 session**。

- {coding agent 不該動的範圍 1}
- {coding agent 不該動的範圍 2}

---

## 🧪 Test Plan

| 項目 | 內容 |
|:---|:---|
| **Test plan ref** | [`docs/qa/test-plan-{release}.md`](../../docs/qa/test-plan-{release}.md) |
| **Exit criteria** | [link to section] |
| **Required pass rate** | unit 100% · integration ≥ 95% · E2E ≥ 90% |

---

## 🩺 Operations

| 項目 | 內容 |
|:---|:---|
| **Runbook** | [`docs/ops/runbook-{service}.md`](../../docs/ops/runbook-{service}.md) |
| **Rollback plan** | [`docs/release/readiness-{date}.md#rollback`](../../docs/release/readiness-{date}.md) |
| **SLO** | [`docs/ops/slo.md`](../../docs/ops/slo.md) |
| **Dashboards** | {Grafana link} |

---

## 📋 ADR Index (relevant only)

> 只列與本 handoff 強相關的 ADR，避免 coder 被淹沒。

| ID | Topic | Why coder needs to know |
|:---|:---|:---|
| ADR-{NNN} | {topic} | {one line} |
| ADR-{NNN} | {topic} | {one line} |

---

## 📡 Telemetry Hooks

> coder 在實作時必須 emit 以下事件 / metric，否則 observability 不完整。

| Event / Metric | 來源 (where to emit) | 用途 |
|:---|:---|:---|
| `event: {name}` | {trigger point} | {observability use} |
| `metric: {name}` | {trigger point} | {SLO compliance} |

---

## ❓ Open Questions for Coder

> 這些是 freeze 時尚未完全收斂的點。**implementation 過程中遇到要先問，不要自行假設。**

| ID | Question | Decider | Suggested escalation |
|:---|:---|:---|:---|
| Q1 | {edge case / clarification needed before commit} | 業主 | `/devteam-analyst "我需要 X 釐清"` |
| Q2 | ... | ... | ... |

---

## 🚧 不變式（coding agent 必須遵守）

> [!CAUTION]
> 違反任何一條 = 退回業主重 handoff。

1. **🔒 不得修改本 handoff 引用的 frozen 文件** — 若需變更請回 DevTeam harness 寫 ADR/DR
2. **🌐 API 變更必須維持 OpenAPI spec 的 backward compatibility**（依 `x-governance` 政策）
3. **💾 DB migration 必須有對應 rollback**
4. **🆕 新增功能不在本 handoff 範圍** → 回 DevTeam 開新 session
5. **📡 Telemetry hooks 必須 emit** — 不能因為「先 demo 再加」就 skip

---

## 🔁 對應的 DevTeam 入口

若 coding agent 發現本 handoff 有歧義或需求變更，回呼業主使用：

| Situation | Command |
|:---|:---|
| 查當前 session 狀態 | `/devteam-status` |
| PRD 範圍需要變更 | `/devteam-pm "{change}"` |
| Architecture / ADR 需要修 | `/devteam-arch "{change}"` |
| API contract 需要修 | `/devteam-design "{change}"` |
| DB schema 需要修 | `/devteam-design "{change in ERD}"` |
| 新需求超出 handoff | `/devteam "{new feature description}"` |

---

## 🔗 Cross References

- **DevTeam Session**: [`session-{session_id}.md`](../../.claude/context/devteam/session-{session_id}.md)
- **ADR ledger**: [`adr-ledger.json`](../../.claude/context/devteam/adr-ledger.json)
- **All frozen docs**: see 🔒 Frozen Artifacts table above
- **KB references**: [[02_lifecycle_phases]] §Handoff · [[04_freeze_gates]] §Gate7

---

## ✍️ Handoff Sign-off

- [ ] **DevTeam Harness** (auto-generated): ____________ / Date: ____________
- [ ] **Release owner** (acknowledged complete): ____________ / Date: ____________
- [ ] **Coding agent / dev lead** (accepted package): ____________ / Date: ____________

---

**End of Handoff Package**

> 給 coding agent: 看 **📋 Executive Summary** + **✅ Acceptance Criteria** + **🚧 不變式** 三段。其他段落是引用清單，按需打開。
