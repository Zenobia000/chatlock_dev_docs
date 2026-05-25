---
id: ADR-0048
title: AI 轉真人 7 條件 — 硬規則 + Eval 自動化驗證
status: accepted
date: 2026-05-21
source_trade_off: §F.3 AI-040 PAIN-POINTS-SUMMARY-2026-05-21.md
deciders: [業主]
accepted_date: 2026-05-22
related:
  - "./ADR-0028-ai-employee-charter.md"
  - "./ADR-0034-urgent-red-code-definition.md"
  - "./ADR-0047-ai-forbidden-list-as-charter.md"
  - 02-ai-chatbot-sync-final-spec-20260520.xlsx#sheet-04 (G5)
pre_mortem: F3 + F4
eternal_transient: Eternal Policy (B3) + E3 治理
---

# ADR-0048 — AI 轉真人 7 條件

## Status
Draft

## Context

AI 何時該升級到真人？目前由 prompt 引導 + LLM 自判，但模糊。一旦 AI 該轉沒轉 → F3 邊界漂移；該不轉硬轉 → F1 AI ROI 下降。

源自 Excel-01 sheet 18 AI-040；Excel-02 sheet 04 G5。

## Decision（推薦）

**7 硬規則 + Eval set 自動化驗證**：

| # | 觸發條件 | 判定方式 |
|---|---------|---------|
| 1 | **Urgent**（4 類 ADR-0034）| 關鍵字 + 規則匹配 |
| 2 | **Angry customer**（情緒分流 ≥ 高）| 情緒分類 ≥ 0.9（合約 4.4(a)）|
| 3 | **High amount**（quote > brand threshold）| 金額閾值（per Contract Template）|
| 4 | **Warranty unclear** | 保固判定爭議（與 ADR-0028 forbidden 對齊）|
| 5 | **Refund request** | 客戶提退款（與 ADR-0040 對齊）|
| 6 | **Legal / safety inquiry** | 法律 / 安全關鍵字（與 ADR-0035 對齊）|
| 7 | **3+ failed attempts** | conversation 內 AI 嘗試 ≥ 3 次未解決 |

任一觸發 → AI 強制呼叫 `transfer_to_human` tool（B3 + E3 治理）。

Eval set：每條至少 30 題 regression（總 200+ 題），含正例 + 反例（誘導 / 偽裝）。

## Alternatives Considered

### Option A — LLM 自判斷（無硬規則）
- 風險：F3 高（綁特定模型）
- 評測難建，model swap 重訓

### Option B — 全部轉真人（最保守）
- 風險：F1 弱
- AI ROI -50%，自助率歸零

## Consequences

**Positive**：
- 7 條規則明文，與 charter Forbidden 對齊
- Eval 量化判斷準確率
- Model swap 仍生效

**Negative**：
- 轉真人率 +5-10%（vs 純 LLM 自判可能更低）
- 規則覆蓋率不足時可能 edge case 漏轉

**Mitigation**：
- 客服可手動發現漏轉，後續補入 Eval set
- 每季 review 7 條規則（新增 case → 走 ChangeRequest ADR-0046）

## Pre-mortem Mapping

對應 §A F3 + F4。轉真人時機是 HITL 邊界核心；合約 4.4(a) 負面情緒識別 ≥ 90% 直接是 F4 防線。

## Eternal/Transient Classification

- **Eternal**：§B3 7 條 handoff 規則 + §E3 治理
- **Transient**：情緒分類器、金額閾值、Eval set 內容（§C4）

## Acceptance Criteria
- [ ] 業主圈選：**✅ 推薦** / Option A / Option B
- [ ] 客服主管 + AI Lead 簽核 7 條規則
- [ ] Eval set 200+ 題建置
- [ ] 情緒分類器準確率 ≥ 90%（合約 4.4(a)）
- [ ] AI 觸發 7 條件之一 → 強制 `transfer_to_human`，無 LLM judgment 餘地
- [ ] BI 報表「handoff by trigger」分布監控
- [ ] 每季 review 7 條規則

## See also
- §F.3 AI-040 PAIN-POINTS-SUMMARY-2026-05-21.md
- Excel-01 sheet 18 / Excel-02 sheet 04 G5 / sheet 08
- ADR-0028 / 0034 / 0035 / 0040 / 0047
- 合約 4.4(a) 負面情緒 ≥ 90%
