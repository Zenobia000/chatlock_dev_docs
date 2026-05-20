# DR-{NNN} — {Decision Title}

> **📋 Type**: Decision Record（非架構性 — 產品 / 流程 / 局部設計）
> **📋 Status**: Proposed | Accepted | Superseded by DR-{NNN}
> **🗓 Date**: YYYY-MM-DD
> **👤 Owner role**: pm | analyst | ux | qa | ops
> **🔖 Version**: v1
> **🎯 Scope**: feature / process
> **🔗 Supersedes**: (optional) DR-{NNN} or ADR-{NNN}

---

## 📋 Executive Summary

> [!TIP]
> **TL;DR (30s)**: Changed **{what}** because **{why}**. Impacts **{N} doc(s)**, severity **{stale-major | stale-minor}**.

| 維度 | 摘要 |
|:---|:---|
| **🎯 變更** | {one-line: what changed} |
| **🤔 為什麼** | {trigger: new req / feedback / metric / regulation} |
| **🚀 Status** | ✅ Accepted / ⏳ Proposed |
| **📉 影響範圍** | {N} doc(s), stale-major / stale-minor |
| **🎯 下一步** | {next concrete action} |

---

## 🎯 Context

- **觸發**: {什麼事件觸發這個變更}
- **涉及的 frozen 文件**: {哪些已 frozen 的文件被影響}
- **替代方案**（若有考慮）: {alternatives briefly}

---

## 📐 Drivers

> 為什麼要改：

- {new requirement}
- {stakeholder feedback}
- {metric 不如預期 — 數字若有}
- {法規 / 合規要求}

---

## ✅ Decision

> [!IMPORTANT]
> **改成什麼**: {decision in 1-2 sentences}
>
> **不改什麼**: {explicit anti-scope}

---

## 📉 Affected Documents

| 文件 | 預期影響 | 嚴重度 | 重跑哪個 driver |
|:---|:---|:---:|:---|
| `docs/{path-1}` | {how it changes} | 🟡 stale-minor | `devteam-pm` |
| `docs/{path-2}` | {how it changes} | 🔴 stale-major | `devteam-arch` + `devteam-design` |

> [!NOTE]
> **stale-minor** = 文字修飾 / 局部欄位 / KPI 微調 — 不重跑下游 driver
> **stale-major** = scope 變動 / API 變動 / schema 變動 — 觸發 cascade 重跑

---

## 📊 Consequences

### ✅ Positive
- {benefit 1}
- {benefit 2}

### ⚠️ Negative
- {downside 1}

### 🎯 Follow-up Work

- [ ] 標下游 stale (`documents/index.json` 更新)
- [ ] 重跑 driver: {list}
- [ ] 更新 cascade-affected docs 內 ASSUMPTION 註解
- [ ] 寫入 `adr-ledger.json`

---

## ✍️ Approval

| 項目 | 內容 |
|:---|:---|
| **業主裁決日期** | YYYY-MM-DD |
| **Cascade policy 套用** | manual_confirm · auto_cascade · ignore |
| **PM / Owner sign-off** | ____________ |

### Cascade Execution Checklist

- [ ] 標下游 stale
- [ ] 重跑 driver(s): ____________
- [ ] 更新 `documents/index.json`
- [ ] 寫入 `adr-ledger.json`

---

## 🔗 Cross References

- **Related PRD**: [`docs/prd/{feature}.md`](../../docs/prd/{feature}.md)
- **Original ADR**（if superseding）: [`docs/architecture/adr/ADR-{NNN}.md`](../../docs/architecture/adr/ADR-{NNN}.md)
- **Session log**: [`session-{id}.md`](../../.claude/context/devteam/session-{id}.md)

---

**End of DR**

> 給業主：你主要看 **📋 Executive Summary** + **✅ Decision** + **📉 Affected Documents** 三段。
