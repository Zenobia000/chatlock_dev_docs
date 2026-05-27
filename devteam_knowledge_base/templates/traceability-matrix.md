---
id: traceability-matrix
title: FR ↔ BR ↔ ADR ↔ Domain Event 三向追溯矩陣
status: template
generated_by: tool (聚合自各 doc frontmatter)
mirror_of: ../../../docs/_source/  # SoT 來源
last_generated: YYYY-MM-DD
---

# Traceability Matrix

> **本檔由 tool 自動生成，請勿手改**。
> 變動方式：改各 FR / BR / ADR 的 frontmatter `mapped_to` / `superseded_clauses` / `emits_events` / `related_adrs` 欄位，重跑 tool。
>
> **目的**：給 QA / audit / Lane A critique 一份 global view 看 FR ↔ BR ↔ ADR ↔ Event 對應關係，避免 orphan（FR 沒對 BR、event 沒人 emit、ADR 沒被 FR 引用）。

---

## §1 Coverage Dashboard

> 自動聚合計數，每次重跑刷新。

| 指標 | 數量 | 健康狀態 |
|:-----|:-----|:--------|
| Total FR | N | — |
| Total BR | N | — |
| Total ADR | N | — |
| Total Domain Events | N | — |
| FR with `mapped_to` 為空 (orphan FR) | N | 🔴 if > 0 |
| BR 未被任何 FR 引用 (orphan BR) | N | 🟡 if > 0 |
| ADR 未被任何 FR/BR 引用 (lonely ADR) | N | 🟡 if > 5 |
| Domain Event 未被任何 FR 的 `emits_events` 列 (zombie event) | N | 🔴 if > 0 |
| ADR `status: superseded` 但 `superseded_by` 為空 (broken supersede) | N | 🔴 if > 0 |

---

## §2 FR ↔ BR ↔ ADR ↔ User Flow 四向追溯矩陣（主視角）

> Source: Roundtable A (2026-05-27) D5 + Roundtable B (2026-05-28) D3 — user flow 反向指 FR 之後，traceability matrix 補 user flow 欄。
> 從 FR 角度看四向 traceability。每行一個 FR。

### §2.1 欄位定義

| 欄位 | 值域 | 來源 | 必填 |
|:-----|:-----|:-----|:-----|
| `FR ID` | FR-NNNN | scan `docs/analysis/fr/*.md` | ✅ |
| `Title` | string | FR frontmatter `title` | ✅ |
| `Phase` | 0 / I / II / III / IV / V | FR frontmatter `phase` | ✅ |
| `mapped_to` | M01..M20 / A01..A12 / S-M01..S-M06（可多值） | FR frontmatter `mapped_to` | ✅（空 → orphan FR） |
| `Linked BRs` | BR-M??-NN 清單 | FR frontmatter `superseded_clauses` | 大部分 FR ✅ |
| `Linked ADRs` | ADR-NNNN 清單 | FR frontmatter `related_adrs` | 視情況 |
| `Emits Events` | Domain Event 名稱清單 | FR frontmatter `emits_events` | chatbot / sync FR ✅ |
| `Referenced By User Flows` | user flow doc path + step | 反向 scan（user flow 標 `→ FR-NNNN`，[ref: KB-13 §10]） | 自動聚合（FR 不手填） |

### §2.2 矩陣範例

| FR ID | Title | Phase | mapped_to | Linked BRs | Linked ADRs | Emits Events | Referenced By User Flows |
|:------|:------|:------|:----------|:-----------|:------------|:-------------|:--------------------------|
| FR-0003 | PC drafting | I | M03 | BR-M03-01, BR-M03-02 | ADR-0033 | PCDrafted | `docs/ux/user-flow-smart-lock-saas.md` S2.step2 |
| FR-0004 | PC approval | I | M03, M15 | BR-M03-03 | ADR-0039 | PCSubmittedForApproval, PCApproved | `docs/ux/user-flow-smart-lock-saas.md` S2.step3 |
| FR-0027 | Chatbot intake | I | A06 | BR-A06-01 | ADR-0067 | InquiryReceived | `docs/ux/by-module/A06-flow.md` step1-3 |
| FR-0028 | Chatbot handoff | I | A09 | BR-A09-02 | ADR-0040 | HandoffQueued, HandoffAccepted | `docs/ux/by-module/A09-flow.md` step5 |
| ... | ... | ... | ... | ... | ... | ... | ... |

### §2.3 四向反向視角

從**任一**維度都可 lookup 其他三個：

| 起點 | 找 | 方法 |
|:-----|:---|:-----|
| FR | BR / ADR / Event / User Flow | §2 主表 |
| BR | FR | scan FR frontmatter `superseded_clauses` 含本 BR |
| ADR | FR | scan FR frontmatter `related_adrs` 含本 ADR + 本檔 §4 |
| Event | FR | §5 表 |
| User Flow step | FR | 看 step 後 `→ FR-NNNN` 標記 |
| User Flow doc | 所有引用 FR | 整檔 scan `→ FR-\d{4}` |

---

## §3 Module → 全部 FR / BR / ADR / Event（by-module reverse index）

> 從 M-ID 角度看 traceability。`docs/_index/by-module/M??.md` 由本表生成。

### M01 — Customer & Channel Intake

| Type | ID | Title | Owner | Phase |
|:-----|:---|:------|:------|:------|
| FR | FR-0001 | LINE intake | 客服主管 | I |
| BR | BR-M01-01 | Channel source 必填 | 客服主管 | I |
| BR | BR-M01-02 | 先建 Case 再進報價 | 客服主管 | I |
| ADR | ADR-0004 | LINE Bot 架構 | Architect | 0 |
| Event | InquiryReceived | — | — | I |

### M02 — Customer / Site / Device Master
...

(每 M-ID 一個 H3 section)

---

## §4 ADR → Status / Supersede Chain

> 從 ADR 角度看 supersede 關係。對應 [`13_doc_migration_playbook §2`](../13_doc_migration_playbook.md#§2-adr-supersede-判定樹)。

| ADR ID | Title | Status | Superseded By | Reviewed Against | Module Scope |
|:-------|:------|:-------|:--------------|:-----------------|:-------------|
| ADR-0031 | ai-auto-convert-to-work-order | superseded | ADR-NNNN | 2026-05-20 final spec | M03 |
| ADR-0039 | cancellation-fee-tiers | active | — | 2026-05-20 (still valid) | M11, M15 |
| ADR-0023 | tactical-refactor-2026-q2 | historical | — | — | — |
| ADR-PIVOT-001 | v2-restart-trigger | historical | — | — | — |
| ... | ... | ... | ... | ... | ... |

### Supersede 統計

- Active: N
- Superseded: N
- Reviewed, Still Valid: N
- Historical: N

---

## §5 Domain Event → emitted by which FR

> 從 event 角度看 emit 源頭。Zombie event (沒 FR emit) 必須 flag。

| Event Name | Emitted By FR | Consumed By Module | Catalog Sheet Row |
|:-----------|:--------------|:-------------------|:------------------|
| WorkOrderConverted | FR-0XXX (M04→M05) | M06 Dispatch | `docs/_source/02-ai-chatbot-sync.md#22-domain-events` row 5 |
| DispatchAccepted | FR-0XXX | M07, M08 | ... |
| EvidenceUploaded | FR-0006, FR-0009 | M09, M13 | ... |
| ... | ... | ... | ... |

---

## §6 Health Issues (CI-flagged)

> 自動生成 — 每次 tool 跑完列出當前異常。

### 🔴 Critical

- **Orphan FR**: `FR-NNNN` 的 `mapped_to` 為空 → 必須補對應 M/A/S
- **Zombie Event**: `EventName` 未被任何 FR `emits_events` 列 → 補 FR 或從 event catalog 移除
- **Broken Supersede**: `ADR-NNNN` `status: superseded` 但 `superseded_by` 為空 → 補 supersede 對象

### 🟡 Warning

- **Orphan BR**: `BR-M??-NN` 未被任何 FR `superseded_clauses` 引用 → 補 FR 或 BR 是否真的需要
- **Lonely ADR**: `ADR-NNNN` 未被引用，且 status 不是 historical → review 是否仍 relevant

---

## §7 工具實作提示

```python
# pseudocode
def generate_traceability_matrix(repo_root):
    frs = scan_yaml_frontmatter('docs/analysis/fr/*.md')
    brs = scan_yaml_frontmatter('docs/analysis/br/*.md')  # 新建
    adrs = scan_yaml_frontmatter('docs/architecture/adr/*.md')
    events = parse_event_catalog('docs/_source/02-ai-chatbot-sync.md#22-domain-events')

    # 反向索引
    by_module = defaultdict(list)
    for f in frs: by_module[f.mapped_to].append(f)

    # 健康檢查
    orphan_fr = [f for f in frs if not f.mapped_to]
    zombie_event = [e for e in events if not any(e in f.emits_events for f in frs)]
    broken_supersede = [a for a in adrs if a.status == 'superseded' and not a.superseded_by]
    # ...

    # 渲染
    render_dashboard(...)
    render_fr_table(frs)
    render_by_module(by_module)
    render_adr_chain(adrs)
    render_event_emitters(events, frs)
    render_health_issues(orphan_fr, zombie_event, broken_supersede)
```

---

## §8 何時手動 review

雖然本檔自動生成，但下列場景需人工 review：

1. **Migration 收尾**：完成 D5 (FR 改 B' 殼) 後，跑一次 tool，人工檢視 §6 健康清單是否清空
2. **每個 freeze gate 前**：確保該 gate 涉及的 FR/BR/ADR 對應正常
3. **新增 Domain Event 時**：補對應 FR 的 `emits_events`，否則本表會 flag zombie
