---
id: FR-0053
title: DPO Forget / GDPR Right-to-be-Forgotten Flow（cross-cutting）
status: placeholder
phase: II
placeholder_only: true
placeholder_reason: "Gate 2 critique MF-3 cascade — 主檔 Flow S4 GDPR forget 段已寫 mermaid + 兩階段刪除 + legal-hold 衝突處理，但缺正式 FR 殼。屬 cross-cutting compliance；Body 由 Analyst driver D-3 補對齊 BR-PII-001 + DGS Service spec"
mapped_to:
  - M17    # Audit / DGS primary
  - cross-cutting  # GDPR / DPO 涵蓋全平台 PII
owner: DPO / 法務 / DGS service
related_adrs:
  - ADR-0061   # data-governance-service-boundary
  - ADR-PII-002  # 資料極小化雙層防線
  - ADR-0051   # evidence-retention-policy
created_in: "Gate 2 UX MF-3 placeholder (2026-05-28)"
related_user_flow: docs/ux/user-flow-smart-lock-saas.md#flow-s4
---

# FR-0053 — DPO Forget / GDPR Right-to-be-Forgotten Flow [PLACEHOLDER]

> **Phase II placeholder** — cross-cutting compliance FR；Phase I 主檔 user-flow Flow S4 mermaid 已涵蓋兩階段刪除流程 + legal-hold 衝突處理 + audit ledger。本 placeholder 占位，待 DGS service spec freeze 後 Analyst driver D-3 補 BR + G/W/T。

## §1 Scope Intent

客戶提 GDPR forget request 後，由 DGS (Data Governance Service) 套 BR-PII-001 兩階段刪除：

| 階段 | 時點 | 動作 |
|:-----|:-----|:-----|
| **T0** | 收到 request | 銷毀加密金鑰（crypto-shredding）+ 軟刪 row + audit log |
| **T+30 天** | 30 天冷卻期後 | 硬刪 row（physical delete）|
| **audit** | 全程 | append-only ledger + hash chain（≥ 7 yr retention）|

legal-hold 衝突處理：
- 若 row 處於 legal-hold（爭議 / 仲裁 / 警方調查中）→ 拒絕刪除
- 7 天內通知客戶 + 預計解除時間
- 法律暫存記錄入 audit log

稽核員唯讀路徑：
- flagged item → full deny + log
- unflagged item → snapshot cache 60s + stale header

## §2 Acceptance Criteria（待 Analyst driver 補 G/W/T）

- AC-01 兩階段刪除：T0 軟刪 + 金鑰銷毀；T+30 硬刪
- AC-02 legal-hold 衝突 → deny + 7d 內通知 + audit
- AC-03 audit ledger append-only + hash chain 完整性可驗證
- AC-04 稽核員唯讀 flagged/unflagged 分流正確
- AC-05 retention：audit 紀錄 ≥ 7 yr（對齊 voucher / 稅務）

## §3 Out-of-Scope

- M17 audit log 核心機制（屬 FR-0020）
- 一般客戶資料維護（屬 FR-0041 customer-site-device-master）
- PII tokenize（屬 FR-0036 sync-facts-master）

## §4 Phase II 啟動時需補

- DGS service spec（ADR-0061 boundary 已 freeze，但 service implementation 待 D-2）
- 跨服務 forget propagation 機制（chatbot / ERP / sync / vault 同步刪除）
- 客戶自助 forget request portal（LIFF / Web）

## §5 相關文件

- User Flow：[`../../ux/user-flow-smart-lock-saas.md#flow-s4`](../../ux/user-flow-smart-lock-saas.md)
- ADR-0061：data-governance-service-boundary
- ADR-PII-002：資料極小化雙層防線
- ADR-0051：evidence-retention-policy
- Business Rules：BR-PII-001（已存在）/ BR-PII-DPO-* (Analyst driver D-3 待補)
