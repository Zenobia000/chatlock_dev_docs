---
id: ADR-0047
title: AI 禁止決策清單入 charter — ADR-0028 + auto guardrail test
status: accepted
date: 2026-05-21
source_trade_off: §F.3 AI-020 PAIN-POINTS-SUMMARY-2026-05-21.md
deciders: [業主]
accepted_date: 2026-05-22
related:
  - "./ADR-0028-ai-employee-charter.md"
  - "./ADR-0035-warranty-project-quote-policy.md"
  - "./ADR-0054-ai-quote-range-only.md"
  - 02-ai-chatbot-sync-final-spec-20260520.xlsx#sheet-08 (風險治理)
pre_mortem: F3 (HITL 邊界漂移)
eternal_transient: Eternal Policy (B3 永恆禁區)
---

> 
> **🔄 Migration Status (2026-05-28)**: `STILL_VALID_UNDER_A05_M20`
> **Reviewed against**: 2026-05-20 final spec (xlsx)
> **Reviewed on**: 2026-05-28
> **Module scope**: A05, M20
> **Per ADR-0100 §1 classification** (.claude/context/devteam/meetings/2026-05-27-1130-final-spec-migration-strategy/MoM.md)


# ADR-0047 — AI 禁止決策清單入 charter

## Status
Draft

## Context

AI 不可做的事散落在多份文件（ADR-0028 charter / SKILL.md / safety_gate code / 客服 SOP）。每次新增 skill / 新 tool 都要重新對齊邊界，工程 / 法務 / 客服口徑不一致 → F3 邊界漂移最大來源。

源自 Excel-01 sheet 18 AI-020；Excel-02 sheet 08 風險治理。

## Decision（推薦）

**AI Forbidden List 集中至 ADR-0028 Charter + 自動 guardrail test**：

ADR-0028 charter `Forbidden` 欄位明文寫入：
```yaml
ai_forbidden:
  finance:
    - final_price_commitment       # 同 ADR-0054
    - refund_approval              # 同 ADR-0040
    - settlement_modification
  warranty_legal:
    - warranty_liability_judgment  # 保固責任判定
    - legal_safety_promise         # 法律 / 安全承諾
  operational:
    - convert_to_work_order_direct # AI 不可直接呼叫，需 1-click 人審（同 ADR-0031）
    - dangerous_repair_instruction # 危險操作指引（拆電路 / 自行拆鎖）
  data:
    - cross_tenant_data_access     # 跨租戶資料存取
    - pii_disclosure_in_reply      # 非必要回覆中暴露 PII
```

**自動 guardrail test**：每次部署前跑 ≥ 200 題 regression eval，覆蓋每一條 forbidden + 邊界 case + 誘導 injection。Eval pass < 95% → deploy block。

**任何項目移出 Forbidden → 必須開新 ADR + Legal 簽字**（ADR-0028 已明定，本 ADR 補上 enforcement 機制）。

## Alternatives Considered

### Option A — LLM 自判斷邊界
- 風險：F3 高（綁特定模型）
- 邊界漂移，model swap 重訓

### Option B — 全黑名單關鍵字
- 風險：F3 高 false positive
- UX 差，正常對話被誤攔

## Consequences

**Positive**：
- 邊界寫進 ADR + 自動測試，model swap 仍生效
- F3 主防線
- 與 ADR-0028 charter 對齊

**Negative**：
- Eval pipeline 需建（與 §G 三層 lint gate 對齊）
- 200 題 regression 每次 +5-10 min build time

**Mitigation**：
- Eval 可平行化
- Eval set 隨業務演進更新，每季 review

## Pre-mortem Mapping

對應 §A F3。這是防 F3 的主防線 ADR。

## Eternal/Transient Classification

- **Eternal**：§B3 Forbidden 清單 + ADR-0028 charter
- **Transient**：guardrail classifier 實作（§C4 AgentRuntime）

## Acceptance Criteria
- [ ] 業主圈選：**✅ 推薦** / Option A / Option B
- [ ] Legal + 客服主管 + AI Lead 簽核 Forbidden 清單
- [ ] Eval set 200 題建置（含每條 Forbidden + 誘導 case）
- [ ] CI pipeline 加 eval gate（pass < 95% 阻擋 deploy）
- [ ] 每季 review Forbidden 清單 + Eval set
- [ ] 任何 Forbidden 項目移除走新 ADR + Legal 簽字

## See also
- §F.3 AI-020 PAIN-POINTS-SUMMARY-2026-05-21.md
- Excel-01 sheet 18 / Excel-02 sheet 08
- ADR-0028 AI Employee Charter
- ADR-0031 / 0035 / 0040 / 0054（各 Forbidden 細項對應）
- §G PAIN-POINTS-SUMMARY 工程治理
