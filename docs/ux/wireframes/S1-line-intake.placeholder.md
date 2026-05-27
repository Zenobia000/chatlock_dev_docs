---
doc_id: WF-S1-LINE-INTAKE
status: placeholder (待繪)
wcag_level: AA
parent_step: docs/ux/user-flow-smart-lock-saas.md#flow-s1 step 1
related_fr: FR-0001
last_updated: 2026-05-28
---

# Wireframe: S1 LINE 報修入口

> **待繪**：consumer LIFF / LINE bot 對話入口畫面。figma / Pencil MCP 階段補實際 wireframe。

## 30 秒摘要
消費者在 LINE 第一次接觸 chatbot 的入口畫面 — 包括歡迎訊息、Quick Reply 引導（報修 / 諮詢 / 投訴 / 其他）、急件直接按鈕（鎖在門外 / 受困）。

## 對應
- 主檔 flow：[`../user-flow-smart-lock-saas.md#flow-s1`](../user-flow-smart-lock-saas.md) step 1 (AI 認意圖)
- by-module 子檔：[`../by-module/A01-debounce-flow.md`](../by-module/A01-debounce-flow.md)、[`../by-module/A03-react-agent-flow.md`](../by-module/A03-react-agent-flow.md)

## 5 UI state 描述

| State | 描述 |
|:------|:-----|
| **happy** | 歡迎 Flex Message + 4 個 Quick Reply 按鈕 (報修 / 諮詢 / 投訴 / 其他) + 緊急按鈕「我被鎖在門外」紅色 highlight |
| **empty** | 第一次互動 → 加入 onboarding bubble「歡迎使用智慧鎖修繕服務，我可以幫您 ...」 |
| **loading** | LINE typing indicator < 1s |
| **error** | webhook 失敗 → 顯示「系統繁忙，請稍候再試」+ retry button |
| **offline** | LINE app 顯示「無網路」banner，訊息會於連線後送出 |

## a11y notes (WCAG 2.2 AA)
- Quick Reply button label 清楚（「報修服務」非「報修」）
- 緊急按鈕**不僅靠紅色** — 加 `aria-label="緊急 - 鎖在門外，立即轉接客服"`
- Flex Message 朗讀順序：歡迎標題 → 內文 → 按鈕清單
- Target size ≥ 44×44（LINE 原生 Quick Reply 符合）

## FR 反向指
| Step | FR | AC |
|:---|:---|:---|
| 意圖識別入口 | FR-0001 | AC-01 4 類 quick reply / AC-02 緊急按鈕 bypass |
