---
doc_id: WF-S5-STAGED-ROLLOUT
status: placeholder (待繪)
wcag_level: AA
parent_step: docs/ux/user-flow-smart-lock-saas.md#flow-s5 step 4
related_fr: FR-0043
related_adr: ADR-0067
last_updated: 2026-05-28
---

# Wireframe: S5 M18 Staged Rollout Progress

> **待繪**：M18 admin UI 顯示 staged rollout 進度的畫面 — 包含 progress bar、observation timer、SLI dashboard、canary fail 一鍵 rollback。依據 ADR-0067。

## 30 秒摘要
admin approve config 後啟動 staged rollout，本畫面顯示 3 階段進度（10% canary → 50% → 100%），每段 10min observation timer + SLI / error rate dashboard；canary fail 自動 rollback 並 alert。

## 對應
- 主檔 flow：[`../user-flow-smart-lock-saas.md#flow-s5`](../user-flow-smart-lock-saas.md) step 4 (staged rollout)
- by-module：[`../by-module/M18-system-setup-flow.md`](../by-module/M18-system-setup-flow.md)
- ADR-0067 §staged rollout

## 5 UI state 描述

| State | 描述 |
|:------|:-----|
| **happy** | 3 段 progress bar (10% → 50% → 100%) + observation timer countdown + SLI dashboard (error rate / p99) + 「強制全量」escape hatch (需雙簽) |
| **empty** | n/a (rollout 啟動後一定有 phase) |
| **loading** | observation timer 跑中 + spinner on stage transition |
| **error** | canary fail → 自動 rollback + red banner「Canary 10% 觀察期失敗：error rate 超標 → 已自動回退至 v42」+ incident link |
| **offline** | banner「無連線 — staged rollout 持續進行，但您看不到 update」 |

## a11y notes (WCAG 2.2 AA)
- progress bar 不僅靠 width % — 加文字「目前進度：10% canary，剩餘 8 分鐘」
- 紅 / 黃 / 綠燈 alert 不僅靠顏色，加 ARIA `role="alert"` + 文字 severity
- **2.4.11 Focus not obscured (WCAG 2.2 新)** — progress bar 不可被 modal 遮 focus
- **2.5.7 Dragging movements (WCAG 2.2 新)** — 「強制全量」滑桿必有點擊替代
- observation timer 用 toast 非 blocking modal
- 雙簽對話框：兩個 input 各有 label + autocomplete="username"

## ADR-0067 對應驗證
- ✅ 10% / 50% / 100% staged rollout
- ✅ 每段 ≥ 10min observation
- ✅ canary fail 自動 rollback
- ✅ rollback window ≤ 24h
- ✅ 「強制全量」escape hatch 需雙簽 + audit log highlight

## FR 反向指
| Step | FR | AC |
|:---|:---|:---|
| staged rollout 進度 | FR-0043 | AC-01 三段 / AC-02 observation timer / AC-03 canary fail auto rollback |
| 強制全量 escape hatch | FR-0043 | AC-04 雙簽 + audit highlight |
