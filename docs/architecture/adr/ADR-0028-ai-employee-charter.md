---
id: ADR-0028
title: AI 鎖匠客服助理 Employee Charter（任職章程）
status: accepted
date: 2026-05-16
deciders: [CEO, AI Ops Lead, 客服主管, Legal]
source: docs/_archive/blueprints/AI鎖匠聊天機器人系統開發藍圖_v2.xlsx#sheet-10
related:
  - "../0-principles/PRIN-0001-product-principles.md"
  - "./ADR-0006-llm-model-selection.md"
  - "./ADR-0026-memory-architecture.md"
  - "../2-contracts/tool-registry.md"
  - "../3-process/PROC-0010-security-readiness-checklist.md"
supersedes: []
superseded_by: []
---

> 
> **🔄 Migration Status (2026-05-28)**: `STILL_VALID_UNDER_M20_A12`
> **Reviewed against**: 2026-05-20 final spec (xlsx)
> **Reviewed on**: 2026-05-28
> **Module scope**: M20, A12
> **Per ADR-0100 §1 classification** (.claude/context/devteam/meetings/2026-05-27-1130-final-spec-migration-strategy/MoM.md)


# ADR-0028 — AI 鎖匠客服助理 Employee Charter

## Status

**Accepted** — 2026-05-16。把 AI 當 employee 而非 feature 來管：明文寫死它可以做什麼、必須協作做什麼、絕對禁止做什麼。本表是上線／改版／下線的雙簽依據。

## Context

「AI 可以做 X 嗎？」這類問題目前散在 ADR、PRD、SKILL.md、`safety_gate` code 各處，每次問都要重新對齊。法務／客服／工程的口徑經常不一致。源自 AEOS 16 表 Employee Resume 模板，落地到鎖匠專案。

## Charter

| 欄位 | 內容 | Reviewer |
|---|---|---|
| Job Title | AI 鎖匠客服助理 v1（Smart Lock Customer Assistant）| 客服主管 |
| Reports To | 客服主管 + AI Ops Lead | CEO |
| Mission | 在 LINE 入口替客戶遠端排除 70% 高頻電子鎖問題，建立可派工的 ProblemCard，符合品牌 SOP 且不越權 | 客服主管 |
| Independent Capabilities（可獨立做）| FAQ；品牌／型號 Quick Reply；SOP 引導（`load_product_info`）；資料修正（`#資料修正`）；對話摘要；建議轉真人 | AI QA |
| Collaborative（需協作）| 高金額報價草擬（人審）；ProblemCard 草擬（客服確認）；圖片初判（人覆核）| 客服主管 |
| **Forbidden（禁止）** | final quote；退款核准；保固責任判定；法律安全承諾；`convert_to_work_order` 自動呼叫；跨租戶資料存取 | Legal + 客服主管 |
| Tool Permissions | `load_product_info`(L1)｜`update_user_info`(L1)｜`transfer_to_human`(L1)｜`create_problem_card`(L2 HITL) | AI Lead |
| Knowledge Sources | Static：品牌手冊 + `product_info/` mega-doc；Policy：保固／退款內規；Dynamic：ProblemCard / WorkOrder API | Knowledge Owner |
| Memory Boundary | 見 [ADR-0026](./ADR-0026-memory-architecture.md)；session 24h；user_facts SCD2 永久；raw PII 不入 log | AI Architect |
| KPIs | auto-resolve ≥70%；eval pass ≥85%；escalation correct ≥95%；latency p95 ≤8s；LLM cost ≤110% budget | AI Ops |
| Probation Plan | 30d shadow（不回客戶，只記錄）→ 60d canary 10% → 90d full + HITL on 高風險 | 客服主管 + AI Lead |
| Promotion Criteria | 連續 4 週 KPI 全綠 → 開放更多品牌 / 自動建 PC（V2 限低風險）| 客服主管 |
| Off-board Triggers | P0 事故（洩漏／承諾退款／錯誤指引致安全事件）；連續 2 週 pass<70；法規變更 | CEO + AI Lead |
| Audit Schema | `audit_event(turn_id, conv_id, actor=ai, tool, before, after, source_skill, version, decision_id, tenant_id)` | Security |
| Approval Chain | 上線／改版：客服主管 + AI Ops Lead 雙簽；下線：客服主管 / Sponsor 任一即可 | CEO |

## Hard constraints

1. **Forbidden 清單不可由工程單方面解除** — 任何一項移出 Forbidden 必須開新 ADR + Legal 簽字。
2. **Off-board Triggers 自動執行** — KPI 連續 2 週 pass<70 觸發後 ops 必須在 48h 內 hand-off 到人工 fallback，無須再開會。
3. **Promotion 條件不可調鬆** — KPI 全綠 4 週是 hard gate，不接受「最後一週只少一點」。

## Open items

- 30d shadow 階段尚未啟動（目前 v1 已上 production；shadow 是 v2 / 新品牌的條件）
- Off-board automation 尚需 SRE 寫 KPI monitor + auto-rollback

## See also

- 原始藍圖：sheet「10 AI Employee Resume」
- [`PRIN-0001`](../0-principles/PRIN-0001-product-principles.md) — Mission / 非任務上層約束
- [`PROC-0010`](../3-process/PROC-0010-security-readiness-checklist.md) — Forbidden 清單對應的 security gate
