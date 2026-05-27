---
doc_id: WF-S2-LIFF-QUOTE-DETAIL
status: placeholder (待繪)
wcag_level: AA
parent_step: docs/ux/user-flow-smart-lock-saas.md#flow-s2 step 4
related_fr: FR-0009
last_updated: 2026-05-28
---

# Wireframe: S2 LIFF 報價明細頁

> **待繪**：LIFF 開啟後客戶看到的報價明細頁。**P0**：只顯示總額 / 實收（external price），不顯示內部成本拆分。

## 30 秒摘要
LIFF 開啟後展示 quote 明細：line item / 小計 / 條款 progressive disclosure (摘要 3 點 + 完整條款展開) / checkbox 同意條款 / 確認按鈕。**金額用 large text 7:1 contrast**（高齡客戶 + 法律金額雙重保險）。

## 對應
- 主檔 flow：[`../user-flow-smart-lock-saas.md#flow-s2`](../user-flow-smart-lock-saas.md) step 4 (LIFF 看明細)
- LIFF state coverage 表：主檔 §S2 LIFF state coverage row 3

## 5 UI state 描述

| State | 描述 |
|:------|:-----|
| **happy** | 明細 line item (僅總額 / 實收) + 條款摘要 (3 點) + 「展開完整條款」link + checkbox + 確認按鈕 (disabled until checkbox) |
| **empty** | 0 元 line item 標「平台出」；contract_template 沒費用條款 fallback 預設文字 |
| **loading** | Pricing engine spinner 250ms |
| **error** | `quote.expired` → 「報價已失效，請聯繫客服重新報價」+ 客服 1-tap 觸發按鈕 |
| **offline** | banner「需連線才能確認報價」+ confirm button 鎖死 |

## a11y notes (WCAG 2.2 AA)
- 金額 large text **7:1 contrast** (高於 AA 4.5:1)
- 金額 `aria-label="NTD 兩千八百元整"` (不可只給數字字串)
- checkbox 沒勾按確認 → `aria-describedby` + `aria-live="polite"` 提示「請先勾選同意條款後再確認」
- 條款連結 label「報價條款（含車馬費 / 保固 / 爭議處理）」(WCAG 2.4.4)
- 確認 / 拒絕按鈕 ≥ 44×44 (WCAG 2.5.5 enhanced)
- 所有可互動元件 ≥ 24×24 (WCAG 2.5.8 minimum，新)
- 1.4.10 Reflow — 320px 寬不橫向滾動

## P0 規則遵守驗證
- ✅ **報價可見性 (P0)**：僅顯示總額 / 實收，內部成本 (locksmith cost / commission / B2B brand price) 不可見
- ✅ **AI 不複誦金額 (Q2=A)**：金額僅在 LIFF 顯示，LINE 訊息不複誦
- ✅ **checkbox 強制**：avoid 「概括同意」爭議 (Legal sign-off)

## FR 反向指
| Step | FR | AC |
|:---|:---|:---|
| LIFF 看明細 | FR-0009 | AC-02 progressive disclosure / AC-03 internal cost mask |
| checkbox + 確認 | FR-0009 | AC-04 disabled-until-checked / AC-05 Idempotency-Key |
