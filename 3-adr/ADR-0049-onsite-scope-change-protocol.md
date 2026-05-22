---
id: ADR-0049
title: 現場加價三件套 — 客戶簽 + Evidence 照片 + audit
status: accepted
date: 2026-05-21
source_trade_off: §F.3 AI-051 PAIN-POINTS-SUMMARY-2026-05-21.md
deciders: [業主]
accepted_date: 2026-05-22
related:
  - 01-workorder-erp-final-spec-20260520.xlsx#sheet-18 (AI-051)
  - 01-workorder-erp-final-spec-20260520.xlsx (M08 Onsite, M09 Evidence, M15 Exception)
  - "./ADR-0050-evidence-visibility-matrix.md"
pre_mortem: F4 (合規崩潰 — 加價爭議)
eternal_transient: Eternal (B3 + B5)
---

# ADR-0049 — 現場加價三件套

## Status
Draft

## Context

師傅到場後發現需加價（追加工項 / 材料費），目前流程不一致：有的口頭通知、有的拍照、有的事後補客服。爭議發生時無法追溯。

源自 Excel-01 sheet 18 AI-051；M08 Onsite；M09 Evidence；M15 Exception。

## Decision（推薦）

**現場加價三件套（缺一不可）**：

1. **客戶簽名**（e-signature on tablet / LINE LIFF）
2. **Evidence 照片**（現場拍攝顯示問題照片 + 加價單照片）
3. **Audit log**（時間戳 + GPS + 師傅 ID + 客服紀錄）

師傅 App UI 強制流程：
- 加價金額輸入 → 拍 2 張 Evidence 照片 → 客戶簽名 → 提交
- 任一缺失 → API 422 拒絕，加價無效

加價金額分層：
- ≤ NTD 500 → 師傅可現場確認
- NTD 501-2,000 → 需客服 LINE 即時確認
- > NTD 2,000 → 需主管核可 + 客戶簽名 + 客服三方在線

## Alternatives Considered

### Option A — 客戶口頭 + 客服紀錄
- 風險：F4 嚴重
- 法律爭議風險高，無 Evidence 不可追溯

### Option B — 客戶簽名即可（無照片）
- 風險：F4 部分
- Evidence 缺失，保固 / RMA 時責任不清

## Consequences

**Positive**：
- 三件套構成完整證據鏈（與 §B5 對齊）
- 加價金額分層平衡效率與管控
- 與 ADR-0050 Evidence 可見性 + ADR-0051 保存期整合

**Negative**：
- 加價流程 +2 min（vs 口頭 +0 min）
- 師傅 App UI 複雜度 +20%

**Mitigation**：
- 師傅 App UI 設計優先（一步一步引導）
- 客戶簽名走 LINE LIFF（無需安裝額外 App）
- 異常爭議走 Exception module 主管核可

## Pre-mortem Mapping

對應 §A F4。加價爭議是高頻客訴源之一；證據鏈缺失 → 合規崩潰。

## Eternal/Transient Classification

- **Eternal**：§B3 加價 policy + §B5 Evidence 三件套
- **Transient**：簽名 / 拍照 UI 實作（§C1 channel + §C5 device）

## Acceptance Criteria
- [ ] 業主圈選：**✅ 推薦** / Option A / Option B
- [ ] 主管 + 派工主管 + 會計簽核三件套 + 金額分層
- [ ] Backend API 對加價要求三件套，缺失 422
- [ ] 師傅 App UI 強制流程
- [ ] 客戶 LIFF e-signature 整合
- [ ] BI 報表「加價金額分布 + 爭議率」

## See also
- §F.3 AI-051 PAIN-POINTS-SUMMARY-2026-05-21.md
- Excel-01 sheet 18 / M08 Onsite / M09 Evidence / M15 Exception
- ADR-0050 Evidence 可見性
- ADR-0051 Evidence 保存期
- ADR-0039 取消費 S5/S6（已施工階段 ≈ 已加價執行）
