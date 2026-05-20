# ADR-{NNN} — {Decision Title}

> **📋 Status**: Proposed | Accepted | Superseded by ADR-{NNN}
> **🗓 Date**: YYYY-MM-DD
> **👤 Owner**: `devteam-arch` (Architect persona)
> **🔖 Version**: v1
> **🎯 Scope**: feature / service / cross-team
> **🏷 Tags**: topic1, topic2  <!-- 供 indexes/topic_index.json 提取 -->
> **🔗 Feature**: feature-slug  <!-- 對應 docs/prd/{feature}.md，供 indexes/feature_index.json -->
> **🔗 Related KB**: KB-NN §X  <!-- 供 indexes/catalog_usage.json 提取 -->

---

## 📋 Executive Summary

> [!TIP]
> **TL;DR (30s)**: We chose **Option {X} — {name}** because {one-line justification}. This applies to {scope}; it does **not** apply to {anti-scope}.

| 維度 | 摘要 |
|:---|:---|
| **🎯 Decision** | Option {X}: {name} |
| **🤔 Why** | {one-phrase rationale} |
| **🚀 Status** | ✅ Accepted / ⏳ Proposed / ↶ Superseded |
| **📊 Reversibility** | 可逆 / 半可逆 / 不可逆 |
| **🎯 下一步** | {follow-up — implement / migrate / monitor} |

---

## 🎯 Context

- **觸發此決策的情境**: {what happened that made this decision necessary}
- **業務限制**: {time / budget / team capacity}
- **技術限制**: {existing stack / external API / data model}
- **相關 NFR**: {availability / latency / security / scalability constraints}

---

## 📐 Decision Drivers

> 依本決策的權衡重要性排序：

| Priority | Driver | Weight | Reference |
|:---:|:---|:---|:---|
| 1 | {e.g., Reliability} | high | [[06_quality_attributes_catalog]] §2 |
| 2 | {e.g., Time-to-market} | high | bootstrap.team_timeline |
| 3 | {e.g., Cost} | medium | — |
| 4 | {e.g., Operability} | medium | [[09_observability_catalog]] |
| 5 | {e.g., Security} | medium | [[11_data_and_stack_catalog]] |

---

## 🔍 Options Considered

> 至少考慮 2 個選項。若只考慮 1 個就不是真決策。

### Option A — {name}

| 維度 | 內容 |
|:---|:---|
| **Pros** | • {pro 1}<br>• {pro 2} |
| **Cons** | • {con 1}<br>• {con 2} |
| **Fit** | {when this works well} |
| **Anti-fit** | {when this fails} |
| **Cost / Effort** | S / M / L |

### Option B — {name}

| 維度 | 內容 |
|:---|:---|
| **Pros** | ... |
| **Cons** | ... |
| **Fit** | ... |
| **Anti-fit** | ... |
| **Cost / Effort** | ... |

### Option C — {name}（optional）

...

---

## ✅ Decision

> [!IMPORTANT]
> **選擇**: Option {X} — {name}
>
> **理由**: {3-5 sentence rationale referencing the Decision Drivers above. Be specific about which trade-offs you accepted.}

| 範疇 | 說明 |
|:---|:---|
| **✅ 適用範圍** | {where this applies — be concrete} |
| **❌ 不適用** | {explicit anti-scope — where this does NOT apply} |
| **🔓 可逆性** | 可逆（寫 DR 即可） / 半可逆（cascade + ADR） / 不可逆（公開 commitment / 法規） |

---

## 📊 Consequences

### ✅ Positive
- {benefit 1}
- {benefit 2}

### ⚠️ Negative

> [!WARNING]
> 必須明列 trade-off。沒有負面後果通常代表選項分析不夠深入。

- {downside 1 + mitigation strategy}
- {downside 2}

### 🎯 Follow-up Work

| Action | Owner | Due | Reference |
|:---|:---|:---|:---|
| {action 1} | {role} | {date} | — |
| {action 2} | ... | ... | — |

### 📉 影響的下游文件

| Doc | Impact |
|:---|:---|
| `docs/api/openapi-{service}.yaml` | {what changes} |
| `docs/data/erd-{feature}.md` | {what changes} |
| `docs/ops/runbook-{feature}.md` | {what changes} |

---

## 🔗 Links

| Asset | Path |
|:---|:---|
| **Related PRD** | [`docs/prd/{feature}.md`](../../docs/prd/{feature}.md) |
| **C4 Diagram** | [`docs/architecture/c4-{feature}.md`](../../docs/architecture/c4-{feature}.md) |
| **API Spec** | [`docs/api/openapi-{service}.yaml`](../../docs/api/openapi-{service}.yaml) |
| **Migration Plan** | [`docs/data/migrations/{id}.sql`](../../docs/data/migrations/{id}.sql) |
| **KB references** | [[06_quality_attributes_catalog]] · [[10_resilience_patterns]] · ... |

---

## 🔍 Drill-down (optional)

<details>
  <summary>Click for full deliberation context, alternative discussions, and references</summary>

  ### Deliberation context
  {who participated, when, key arguments raised}

  ### Alternatives discussed but rejected early
  - Option D: {why dismissed}

  ### Detailed cost analysis
  ...
</details>

---

## ✍️ Sign-off

- [ ] **Architect** (owner): ____________ / Date: ____________
- [ ] **Tech Lead**: ____________ / Date: ____________
- [ ] **PM** (optional, for cross-functional): ____________ / Date: ____________

---

**End of ADR**

> 給業主：你主要要看的是 **📋 Executive Summary** + **✅ Decision** + **⚠️ Negative consequences** 三段。
> Options Considered 是「為什麼不選別的」的審計軌跡，給未來 reviewer 用。
