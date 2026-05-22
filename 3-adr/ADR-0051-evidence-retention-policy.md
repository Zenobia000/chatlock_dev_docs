---
id: ADR-0051
title: Evidence 保存期 — 1y default / RMA+3y / 法律永久
status: accepted
date: 2026-05-21
source_trade_off: §F.3 AI-053 PAIN-POINTS-SUMMARY-2026-05-21.md
deciders: [業主]
accepted_date: 2026-05-22
related:
  - "./ADR-0050-evidence-visibility-matrix.md"
  - 01-workorder-erp-final-spec-20260520.xlsx (M09 Evidence)
  - 01-workorder-erp-final-spec-20260520.xlsx#sheet-18 (AI-053)
pre_mortem: F4 (合規崩潰 — GDPR 違反 或 法律糾紛無證據)
eternal_transient: Eternal Policy (B3 + B5)
---

# ADR-0051 — Evidence 保存期

## Status
Draft

## Context

Evidence 保留多久是兩難：
- 太短（90 天）：法律糾紛 / RMA 爭議無證據
- 太長（永久）：GDPR / 個資法違反 + 儲存成本爆炸

需依案件性質分層 + 與 PII retention 對齊。

源自 Excel-01 sheet 18 AI-053；M09 Evidence。

## Decision（推薦）

**三層保存期 + 自動清理 + 客戶刪除權執行**：

| 案件類型 | 保存期 | 觸發 |
|---------|-------|------|
| 一般完工案件 | **1 年**（從結案日起算）| 預設 |
| RMA / 客訴案件 | **至解決日 + 3 年** | RMA 進入 |
| 法律 / 安全相關 | **永久** | Legal flag |
| 客戶請求刪除（GDPR）| 7 天內執行 | Forget Memory 觸發（與 §E2 對齊）|

實作：
- Evidence schema 含 `retention_until` 欄位
- 每日 cron job 清理 `retention_until < now AND legal_flag != true` 的 Evidence
- 清理動作進 audit log（不是直接 delete，而是 archive + 刪存儲）
- 客戶請求刪除：呼叫 `forget_user_data` API → 標記 legal_flag = false，重新計算 retention

## Alternatives Considered

### Option A — 永久全保留
- 風險：F4 GDPR / 個資法違反
- 儲存成本爆炸（10 年累積 PB 級照片）

### Option B — 90 天統一
- 風險：F4 重大
- 法律糾紛 / RMA 爭議無證據

## Consequences

**Positive**：
- 三層分層覆蓋 99% case
- GDPR / 個資法執行有路徑（forget memory）
- 與 §E2 Forget List + §B5 Evidence 對齊

**Negative**：
- Retention 判定需在 Evidence 建立時就設定 mode
- 跨層轉換（如 RMA 開啟時把原工單 Evidence 延長）需 trigger

**Mitigation**：
- RMA 開啟自動 trigger 關聯 Evidence 延長 retention
- Legal flag 一旦設定不可逆（除非 ADR 變更）

## Pre-mortem Mapping

對應 §A F4。GDPR 違反 / 法律糾紛無證據都是 F4 死因。

## Eternal/Transient Classification

- **Eternal**：§B3 Retention policy + §B5 Evidence + §E2 Forget List
- **Transient**：清理 cron 實作（§C5）

## Acceptance Criteria
- [ ] 業主圈選：**✅ 推薦** / Option A / Option B
- [ ] Legal 簽核三層保存期符合台灣個資法 + GDPR
- [ ] Evidence schema 加 `retention_until` + `legal_flag`
- [ ] 每日 cron 清理 + audit 留證
- [ ] RMA 開啟自動延長關聯 Evidence retention
- [ ] 客戶 forget request 7 天內執行（合約 + 法律要求）
- [ ] BI 報表「Evidence 儲存量 + retention 分布」

## See also
- §F.3 AI-053 PAIN-POINTS-SUMMARY-2026-05-21.md
- Excel-01 sheet 18 / M09 Evidence
- ADR-0050 Evidence 可見性
- §E2 Memory 7 層（Forget List）
