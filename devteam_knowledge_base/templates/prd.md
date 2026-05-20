# PRD — {Feature Name}

> **📋 Status**: draft | reviewed | frozen | superseded
> **🗓 Last updated**: YYYY-MM-DD
> **👤 Owner**: {PM name}
> **🔖 Version**: v{n}
> **🔗 Related**: ADR-NNN · DR-NNN · KB-N §X

---

## 📋 Executive Summary

> [!TIP]
> **TL;DR (30s)**: {一句話講完此 feature 解什麼問題、給誰用、最大爭議是什麼。30 秒讓任何讀者抓到「為什麼這個 feature 值得 build」。}

| 維度 | 摘要 |
|:---|:---|
| **🎯 目標** | {一句話商業目標} |
| **👥 主要 persona** | {role + scale} |
| **📊 主要 KPI** | {K1 名稱 + 目標值} |
| **🚀 狀態** | {emoji} {status — e.g. ⚠️ ready_to_review, 🔒 frozen} |
| **🎯 下一步** | {next concrete action} |

---

## 🎯 Problem Statement

- **現況**: {現在發生什麼事；who suffers from what}
- **為什麼值得解**: {商業 / 用戶價值，最好量化}
- **不解的成本**: {量化或可推論的影響 — churn / cost / risk}

> [!NOTE]
> 三項都不可空。若無資訊用 `<TBD by stakeholder>` 佔位，列入下方 Open Questions。

---

## 📊 Goals & Success Metrics

| 類別 | 目標 | 量化指標 | 觀測週期 |
|:---|:---|:---|:---|
| **Business Goal** | {定性目標} | — | — |
| **User Goal** | {定性目標} | — | — |
| **KPI K1** | {what} | {target value} | {weekly / monthly / quarterly} |
| **KPI K2** | {what} | {target value} | {period} |
| **Counter-metric C1** | 避免 over-optimization | {副指標 + 上限} | — |

> [!IMPORTANT]
> KPI 必填且可量化。不可寫「使用度高」這類無法測量的描述。

---

## 👥 Users & Scenarios

- **Primary Persona**: {角色 + 關鍵脈絡 + 規模 (e.g. < 100 / 100-10k / > 1M)}
- **Secondary Persona**: {若有}
- **Key Scenario**（主任務流）:
  1. {step 1}
  2. {step 2}
  3. {step 3}
- **Edge Cases**:
  - {edge 1}
  - {edge 2}

---

## 🎯 Scope

### ✅ In Scope
- {item 1}
- {item 2}

### ❌ Out of Scope

> [!WARNING]
> Out of Scope **不可空** — 明確界定不做什麼，避免日後 scope creep。

- {explicitly excluded item 1}
- {explicitly excluded item 2}

---

## 🔗 User Flow Links

| Asset | Location |
|:---|:---|
| Journey | [`docs/ux/user-flow-{feature}.md`](../ux/user-flow-{feature}.md) |
| Wireframe | {link / TBD} |
| Prototype | {link / TBD} |

---

## 📋 Functional Requirements

| ID | Description | Acceptance Criteria | Priority |
|:---|:---|:---|:---:|
| FR-001 | {what user / system does} | {testable criterion} | P0 |
| FR-002 | ... | ... | P1 |

---

## 🛡 Non-Functional Requirements

| Dimension | Requirement | Target | Reference |
|:---|:---|:---|:---|
| **⚡ Performance** | {latency / throughput} | p95 < {ms} | [[06_quality_attributes_catalog]] §1 |
| **🔁 Reliability** | {availability target / SLO} | {99.9% / best-effort} | [[06_quality_attributes_catalog]] §2 |
| **🔒 Security** | {auth / data classification} | {PII / SOC2 / N/A} | [[11_data_and_stack_catalog]] §1 |
| **♿ Accessibility** | WCAG level | {AA / N/A} | — |
| **📜 Auditability** | {log retention / read access} | {30d / 90d / N/A} | — |
| **📈 Scalability** | {concurrent users / data volume} | {N users / N GB} | — |

---

## 🔌 Dependencies

| Type | Detail |
|:---|:---|
| **Upstream** | {上游系統 / 團隊} |
| **Downstream** | {下游消費者} |
| **External systems** | {3rd-party APIs / vendors} |
| **Data / API** | {input / output sources} |
| **Stack constraint** | {language / framework / cloud — from bootstrap} |

---

## ⚠️ Risks & Open Questions

> [!IMPORTANT]
> Risks 與 OQ 是業主主要決策區。每條都需 owner + by-when。

### Risks

| ID | Risk | Severity | Mitigation |
|:---|:---|:---:|:---|
| R-001 | {what could go wrong} | 🔴 high | {how to mitigate} |
| R-002 | ... | 🟡 medium | ... |

### Open Questions

| ID | Question | Why ask | Options | Recommendation | Owner | Due |
|:---|:---|:---|:---|:---|:---|:---|
| OQ-001 | {question} | {value judgment / scope / risk} | A: {opt} · B: {opt} | {推薦 + 理由} | 業主 | {date} |
| OQ-002 | ... | ... | ... | ... | ... | ... |

---

## 🚀 Release Plan

| 項目 | 說明 |
|:---|:---|
| **Rollout strategy** | canary · staged · big-bang ({依規模選 — 見 [[10_resilience_patterns]] §3.1}) |
| **Timeline** | {first release deadline} |
| **Observability** | {key metrics / dashboard link} |
| **Rollback trigger** | {what condition triggers rollback} |
| **Rollback owner** | {role / on-call} |

---

## 📝 Decision Log

> 此處 list ADR / DR 而非詳述。完整內容在 `docs/architecture/adr/` 與 `docs/architecture/dr/`。

| ID | Type | Topic | Status |
|:---|:---|:---|:---:|
| ADR-NNN | ADR | {one-line topic} | ✅ accepted |
| DR-NNN | DR | {one-line topic} | ✅ accepted |

---

## 🔗 Cross References

- **Stakeholder map**: [`docs/governance/stakeholders.md`](../../docs/governance/stakeholders.md)
- **User flow**: [`docs/ux/user-flow-{feature}.md`](../../docs/ux/user-flow-{feature}.md)
- **System spec** (downstream): [`docs/analysis/system-spec-{feature}.md`](../../docs/analysis/system-spec-{feature}.md)
- **C4 diagram** (downstream): [`docs/architecture/c4-{feature}.md`](../../docs/architecture/c4-{feature}.md)
- **KB catalog refs**: [[06_quality_attributes_catalog]] · [[10_resilience_patterns]] · [[11_data_and_stack_catalog]]

---

## ✍️ Sign-off

> [!IMPORTANT]
> Gate 1 PRD Freeze 需要業主明確簽核。Reviewer 在 multi-role critique 後才簽。

- [ ] **PM** (owner): ____________ / Date: ____________
- [ ] **Stakeholder**: ____________ / Date: ____________
- [ ] **Review verdict**（from `reviews/Gate1_PRD-{feature}-{date}.md`）: ✅ ready / ⚠️ revise / ❌ blocked

---

**End of PRD**

> 給業主：你主要要看的是 **📋 Executive Summary** + **🎯 Goals & KPI** + **⚠️ Risks & Open Questions** + **✍️ Sign-off** 四段。
> 其他段落是給下游 phase（analyst / ux / arch）作為輸入。
