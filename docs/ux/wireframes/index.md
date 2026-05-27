---
doc_id: UX-WIREFRAMES-INDEX
title: Wireframe 目錄索引
version: v1
status: placeholder
phase: TBD (待 figma / Pencil MCP 階段補實際 wireframe 圖檔)
owner: UX
parent_flow: docs/ux/user-flow-smart-lock-saas.md
related_kb: [KB-13 §資產拆分]
last_updated: 2026-05-28
---

# Wireframe 目錄索引

> **狀態**：Placeholder 階段（Roundtable B D5）— wireframe 抽離 user flow doc 獨立檔，圖檔本身待 figma / Pencil MCP 階段補；本檔先列每個 flow / step 對應的 wireframe placeholder。
>
> **拆檔依據**：粒度不同 (per-screen)、cascade 頻率不同 (UI 改動快過 flow)、體積大 (圖檔)。state coverage matrix **留主檔**（與 journey 同層）。

---

## 索引

### Flow S1：消費者 LINE 報修

| Step | Wireframe placeholder | UI state 對應 (主檔表) |
|:-----|:----------------------|:----------------------|
| 1. LINE 報修入口 | [`S1-line-intake.placeholder.md`](./S1-line-intake.placeholder.md) | happy / empty / loading / error / offline |
| 2. 多輪對話 (A01-A03) | [`S1-multi-turn-conversation.placeholder.md`](./S1-multi-turn-conversation.placeholder.md) | 同 |
| 3. 問題卡確認 (Flex Message) | [`S1-problem-card-flex.placeholder.md`](./S1-problem-card-flex.placeholder.md) | 同 |
| 4. 三層解決 (案例庫 / RAG / 真人) | [`S1-triage-3layer.placeholder.md`](./S1-triage-3layer.placeholder.md) | 同 |
| 5. 問題釐清確認 (Clarify gate) | [`S1-clarify-gate.placeholder.md`](./S1-clarify-gate.placeholder.md) | 同 |
| 6. 工單建立 Quick Reply (AI 路徑) | [`S1-convert-to-wo-trigger.placeholder.md`](./S1-convert-to-wo-trigger.placeholder.md) | 同 |
| 7. 急件 4 類強制轉真人 | [`S1-emergency-handoff.placeholder.md`](./S1-emergency-handoff.placeholder.md) | 同 |

### Flow S2：派工 + LIFF 報價二段確認

| Step | Wireframe placeholder | UI state 對應 |
|:-----|:----------------------|:--------------|
| 1. 客服 review PC inbox | [`S2-cs-pc-review-inbox.placeholder.md`](./S2-cs-pc-review-inbox.placeholder.md) | happy / empty / loading / error / offline |
| 2. 客服內部報價 UI (Pricing Engine) | [`S2-cs-internal-quote.placeholder.md`](./S2-cs-internal-quote.placeholder.md) | 同 |
| 3. LINE Flex 報價通知 (announce only) | [`S2-line-quote-flex.placeholder.md`](./S2-line-quote-flex.placeholder.md) | 同 |
| 4. LIFF 報價明細頁 (只顯示總額 / P0) | [`S2-liff-quote-detail.placeholder.md`](./S2-liff-quote-detail.placeholder.md) | 同 |
| 5. LIFF checkbox + 確認 | [`S2-liff-checkbox-confirm.placeholder.md`](./S2-liff-checkbox-confirm.placeholder.md) | 同 |
| 6. 師傅推播 Top-5 | [`S2-tech-top5-push.placeholder.md`](./S2-tech-top5-push.placeholder.md) | 同 |
| 7. 師傅 Web App 接單 | [`S2-tech-accept.placeholder.md`](./S2-tech-accept.placeholder.md) | 同 |
| 8. 師傅 ETA + 客戶 LINE 通知 | [`S2-tech-eta-notify.placeholder.md`](./S2-tech-eta-notify.placeholder.md) | 同 |
| 9. 現場拍照 + 簽名 + 完工 | [`S2-onsite-evidence.placeholder.md`](./S2-onsite-evidence.placeholder.md) | 同 |
| 10. Onsite scope_change 加價三段式 | [`S2-onsite-scope-change.placeholder.md`](./S2-onsite-scope-change.placeholder.md) | 同 |
| 11. 結案 hard gate (address + quote) | [`S2-close-gate.placeholder.md`](./S2-close-gate.placeholder.md) | 同 |

### Flow S3：SOP 螺旋

| Step | Wireframe placeholder | UI state 對應 |
|:-----|:----------------------|:--------------|
| 1. SOP 雙審 inbox (客服主管 + Domain Expert) | [`S3-sop-dual-review-inbox.placeholder.md`](./S3-sop-dual-review-inbox.placeholder.md) | happy / empty / loading / error / offline |
| 2. Family Reviewer 審核頁 | [`S3-family-reviewer.placeholder.md`](./S3-family-reviewer.placeholder.md) | 同 |
| 3. SOP draft diff view | [`S3-sop-diff-view.placeholder.md`](./S3-sop-diff-view.placeholder.md) | 同 |

### Flow S4：合規稽核 / 取消 / 退款

| Step | Wireframe placeholder | UI state 對應 |
|:-----|:----------------------|:--------------|
| 1. GDPR forget request UI | [`S4-gdpr-forget.placeholder.md`](./S4-gdpr-forget.placeholder.md) | happy / empty / loading / error / offline |
| 2. 稽核員 唯讀 evidence view | [`S4-auditor-readonly.placeholder.md`](./S4-auditor-readonly.placeholder.md) | 同 |
| 3. 取消 / 改期 reason code 選擇 | [`S4-cancel-reason.placeholder.md`](./S4-cancel-reason.placeholder.md) | 同 |
| 4. 退款核准分層 (低 / 中 / 高 SoD) | [`S4-refund-approval.placeholder.md`](./S4-refund-approval.placeholder.md) | 同 |

### Flow S5：M18 admin journey (v2 新增)

| Step | Wireframe placeholder | UI state 對應 |
|:-----|:----------------------|:--------------|
| 1. M18 admin login + role pick | [`S5-m18-login.placeholder.md`](./S5-m18-login.placeholder.md) | happy / empty / loading / error / offline |
| 2. Config schema editor (draft) | [`S5-config-editor.placeholder.md`](./S5-config-editor.placeholder.md) | 同 |
| 3. Validation error inline | [`S5-validation-error.placeholder.md`](./S5-validation-error.placeholder.md) | 同 |
| 4. 主管 approval inbox | [`S5-approval-inbox.placeholder.md`](./S5-approval-inbox.placeholder.md) | 同 |
| 5. Staged rollout progress + observation | [`S5-staged-rollout-progress.placeholder.md`](./S5-staged-rollout-progress.placeholder.md) | 同 |
| 6. Audit view (filter + diff) | [`S5-audit-view.placeholder.md`](./S5-audit-view.placeholder.md) | 同 |
| 7. Rollback confirm dialog | [`S5-rollback-confirm.placeholder.md`](./S5-rollback-confirm.placeholder.md) | 同 |

### Partner Portal (M14)

| Step | Wireframe placeholder | UI state 對應 |
|:-----|:----------------------|:--------------|
| 1. Partner login (三角色 entry) | [`M14-partner-login.placeholder.md`](./M14-partner-login.placeholder.md) | happy / empty / loading / error / offline |
| 2. Brand dashboard (僅自家品牌) | [`M14-brand-dashboard.placeholder.md`](./M14-brand-dashboard.placeholder.md) | 同 |
| 3. Dealer 代客建案 form | [`M14-dealer-create-case.placeholder.md`](./M14-dealer-create-case.placeholder.md) | 同 |
| 4. Builder 專案主檔 setup | [`M14-builder-project-setup.placeholder.md`](./M14-builder-project-setup.placeholder.md) | 同 |
| 5. 月結對帳 audit download | [`M14-monthly-settlement.placeholder.md`](./M14-monthly-settlement.placeholder.md) | 同 |

---

## Placeholder 規範

每個 `.placeholder.md` 至少包含：
1. **30 秒摘要** — 這個 screen 做什麼，給誰用
2. **對應 flow / step** — 指回主檔或 by-module 子檔
3. **5 個 UI state 描述** (happy / empty / loading / error / offline) — 文字描述（圖檔等 figma 階段補）
4. **a11y notes** — WCAG 2.2 AA 關鍵點（target size / focus / aria-label / contrast）
5. **FR 反向指** — `→ FR-NNNN / AC-NN`

實際 wireframe 圖檔 (figma .fig / Pencil .pen) 後續以 link 形式補入 placeholder。

---

## 引用 KB
- [KB-13 §資產拆分] — wireframe 抽離 user flow doc 的拆檔原則

## 相關文件
- 主檔：[`../user-flow-smart-lock-saas.md`](../user-flow-smart-lock-saas.md)
- By-module 子檔：[`../by-module/`](../by-module/)
