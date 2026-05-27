---
doc_id: REVIEW-GATE2-UXFLOW-2026-05-28
title: Gate 2 UX Flow Freeze Critique — user-flow-smart-lock-saas v2
gate: Gate2_UXFlow
target_doc: docs/ux/user-flow-smart-lock-saas.md
target_version: v2
intensity: standard
personas: [ux, sa]
orchestrator: lane-a-critique
date: 2026-05-28
status: critique_complete
verdict: NEEDS_MINOR_FIX
---

# Review Report: Gate 2 UX Flow Freeze — smart-lock-saas

> **Gate**: Gate2_UXFlow
> **Feature**: smart-lock-saas
> **Target document**: `docs/ux/user-flow-smart-lock-saas.md` @ v2
> **Intensity**: standard (2 personas: UX + SA)
> **Date**: 2026-05-28
> **Roundtable B decisions reviewed**: D1 hybrid IA / D2 sequence+state / D3 粒度切分 / D4 Flow S5 / D5 wireframe split / Q-OF1=B / Q-OF2=A

---

## [ux] critique on docs/ux/user-flow-smart-lock-saas.md

> 站使用者旅程視角，看 task success rate / state 覆蓋率 / a11y WCAG level / friction 點。

### 重大阻礙（必修才能 freeze）

- **[ux-B-1] State Coverage 主檔總表（§State Coverage 主檔總表）缺 Flow S3 SOP 螺旋 + Flow S4 合規稽核兩條 flow 的 step 行**。
  - 引用：主檔 §State Coverage 主檔總表只列 LINE 報修入口 / 多輪對話 / 問題卡 / 三層 / Clarify / 工單建立 / 接單 / 拍照 / Admin Panel / SOP 雙審 / Staged rollout — 但「GDPR forget」「auditor 唯讀」「取消費 5 階段」「退款核准三層」「Family Reviewer 缺席替補」這幾條 S3/S4 的 step 完全沒列。
  - 為什麼是阻礙：Q-OF1=B 業主裁決說「UI state matrix 留主檔」— 主檔就是 single source。S3/S4 step 沒進主檔表 = 五狀態交付責任空懸；UI 設計師拿不到完整 mockup 清單，QA 寫 test plan 也少一塊。
  - 建議改法：補 7-10 行到主檔總表：`Family Reviewer 審核` / `Family Reviewer 缺席 escalate` / `GDPR forget request` / `auditor read flagged item` / `auditor read unflagged (cache)` / `取消費 5 階段 reason code 選擇` / `退款分層核准 (低/中/高)`，每行五個 UI state 與 domain state annotation 都填上。

- **[ux-B-2] S2 LIFF state coverage table 缺「offline 暫存意圖 + 上線重送」的 Idempotency-Key 一致性說明**。
  - 引用：主檔 §Flow S2 — LIFF 二段確認 UI state coverage 表第 4 行（勾 checkbox + 確認）— Offline 欄寫「offline banner，confirm button 鎖死」；第 5 行（拒絕路徑）— Offline 欄寫「offline 暫存拒絕意圖 + 上線重送（Idempotency-Key）」— 兩行同一 step 對 offline 處理不一致（confirm 鎖死 vs 拒絕暫存重送）。
  - 為什麼是阻礙：使用者「確認」和「拒絕」是同一個決策瞬間的兩面，offline 行為不一致 → 客戶在地下室確認後上線變空白，但拒絕能重送 = 邏輯不對稱。task success 被破壞。
  - 建議改法：兩行統一行為。建議「confirm offline 也走暫存意圖 + 上線重送 + Idempotency-Key dedup」（與 LIFF NFR `confirm p95 ≤ 2s` 不衝突，offline 是降級 fallback 不在 NFR 計算內），或明文鎖死兩邊一致「offline 都鎖死」。

- **[ux-B-3] Flow S5 §Flow S5 a11y 段落只「繼承 §Flow S2 LIFF a11y」+ 2 條加強，但 §Flow S5 admin journey 的 staged rollout progress bar 在 §a11y 規範段已寫 `2.4.11 Focus not obscured`，與 Flow S5 §a11y 段加強 `2.4.11` 重複；同時 Flow S5 的 `3.3.4 Error prevention` 條目在 §a11y 規範主表中沒列**。
  - 引用：§Flow S5 — admin UI a11y WCAG 2.2 AA 段 + §a11y 規範 — WCAG 2.2 AA 段「WCAG 2.2 新增 SC (v2 special attention)」。
  - 為什麼是阻礙：Q-OF2=A 裁決說「所有 by-module 子檔強制繼承 WCAG 2.2 AA」— 主檔的 a11y 條目就是繼承的 source，主表漏 3.3.4 → 子檔不知道要繼承；2.4.11 兩處寫法不一 → critique 時無法判定哪邊為準。
  - 建議改法：主檔 §a11y 規範表加 `3.3.4 Error prevention` 一行（標 LIFF 金額確認 / M18 config 改動雙重確認 / 退款核准三層）；Flow S5 §a11y 改寫「繼承主檔，特別強調 3.3.4 在 config 改動場景的應用 + 2.4.11 在 staged rollout progress bar 場景」（不重複定義條目，只說明場景）。

### 建議調整（可接受但建議改）

- **[ux-S-1] Flow S1 §S1 journey 重點清單第 6 點「有幫助 / 沒幫助是平行品質訊號」應補一句**：「但 feedback 訊號 = down 時，需在 N 秒內 follow-up 問題釐清確認」。原文目前只說「不影響案件流轉」— 但「沒幫助」+ 客戶沉默 48h auto_closed 形成 silent failure，task success 訊號被淹沒。建議補 follow-up 機制（A09 子檔已寫 SOP gap analysis trigger，但客戶端的 UX follow-up 流沒寫）。

- **[ux-S-2] Flow S2 mermaid graph 中 `Sign[客戶簽名]` 後直接到 `Report[完工報告]`，沒列「簽名失敗 / 客戶不在現場」的 alt path**。對應 by-module S-M06 有寫「render fail → 紙本 fallback」但主檔 mermaid 沒呈現。Roundtable B D3 說 user flow 寫 journey level — 「簽名失敗、紙本替代」是真實使用者旅程，建議補一條 alt branch。

- **[ux-S-3] §Flow S5 progress bar a11y 寫「進度 10% canary 剩餘 8 分鐘」— 這已是 placeholder S5-staged-rollout-progress 的 a11y 文字；主檔此處與 placeholder 內容部分重複**。建議主檔保留「不僅靠顏色 + ARIA + 文字 severity」抽象規則，具體文字（「剩餘 8 分鐘」）只留在 wireframe placeholder。否則違反 D3 粒度切分（journey vs wireframe）。

- **[ux-S-4] By-module 子檔 A02 / A04 / A11 / A12 / S-M01 / S-M02 / S-M03 / S-M05 的 §a11y 段都只 1-3 行，相較 A05 / A06 / A07 / S-M04 / S-M06 / M14 / M18 寫了 4-7 行詳細條目**。這些「純後台 sync / 純後台 service」雖然「無客戶端 UI」，但都有 admin 後台或 reviewer UI — a11y 條目應該至少對齊 WCAG 2.2 AA 13 條 criterion 中與其相關的子集（如 admin 後台必含 keyboard / focus / contrast / target size 4 條）。Q-OF2=A 「強制繼承」不能用「無 UI」打發。

- **[ux-S-5] Flow S2 §LIFF a11y WCAG checklist 表 13 條 SC 漂亮，但 §a11y 規範主表「WCAG 2.2 新增 SC」段列 9 條卻沒提 LIFF checklist 已 commit 哪幾條 (2.5.8 / 2.4.11 已涵蓋 / 2.5.7 / 3.2.6 / 3.3.7 / 3.3.8 沒有)**。建議在主檔 §a11y 規範 — Channel-specific a11y inheritance 表新增「LIFF 已 commit 2.4.4 / 2.4.6 / 2.4.7 / 2.5.5 / 2.5.8 / 3.2.4 / 3.3.1 / 3.3.3 / 4.1.2 + 1.4.3/10/12」一行，剩餘 4 條（2.5.7 / 3.2.6 / 3.3.7 / 3.3.8）標「pending / N/A 理由」，讓 QA 知道哪些不需測試。

### 通過項

- **§Journey Map（高層）** — 把 5 個 actor × 5 條 flow 在 30 行內畫清楚，task success criteria 明文（「按已解決 / 48h auto_closed」「客服佇列空了」「Family Reviewer 100% 覆核率」「mis-config 限制 canary」）。Linus 會說：好品味 — 沒有特殊情況。
- **§設計目標 — 成功狀態（success state）** 段：明文每個 actor 的 success criteria，可被 QA 直接拿去寫 acceptance。
- **Q-OF1=B annotation 實作**：每個 state coverage table 標 `entry=X / exit=Y`，PC / quote / WO / config / phase / SOP / rollback / decision 各 lifecycle annotation 都齊全。
- **WCAG 2.2 AA 13 條 SC checklist (§Flow S2 LIFF)** — 是整份 doc 最紮實的段落，target size minimum/enhanced 雙標 + 金額升 7:1 + reduced-motion 都到位。QA 可以直接套 NVDA / VoiceOver test plan。
- **Flow S5 staged rollout 三段式 (10% → 50% → 100%) + observation timer + rollback ≤ 24h** 與 ADR-0067 對齊明確，UI state 表寫得清楚。
- **By-module 子檔 (A05 / A06 / A07 / S-M04 / M18 / M14)** sequence + state machine 雙圖混合落實 D2 / KB-07 picker；FR 反向指表完整。

### 跨 persona 衝突點

無明顯衝突。UX 與 SA 對 D3 粒度切分（journey vs FR 殼）共識一致；對 a11y level commitment（WCAG 2.2 AA）也共識；對 cross-ref（→ FR-NNNN）規範一致認同。

---

## [sa] critique on docs/ux/user-flow-smart-lock-saas.md

> 站 use case 完整性 / acceptance 可驗收性 / edge case 完備 / cross-ref 對齊視角。

### 重大阻礙（必修才能 freeze）

- **[sa-B-1] Flow S1 mermaid 圖中 9 個 FR cross-ref 標記有 5 個指向錯誤 FR**。對照 `docs/_index/traceability-matrix.md`：
  - `Triage[三層解決 → FR-0004 / AC-01]` — FR-0004 = "手動派工 + audit log"，不是三層解決。三層解決應對應 FR-0018 (cs-takeover) 與 FR-0028 (skill-gated ReAct agent)。
  - `PCComplete{資料齊 ≥0.85 → FR-0003 / AC-01}` — FR-0003 = "自動派工演算法"，不是 PC completeness。PC completeness gate 應對應 FR-0031 (problemcard-bridge) 與 FR-0037 (sync-pc-convert)。
  - `Clarify{AI 主動確認：問題釐清了嗎？→ FR-0005 / AC-02}` — FR-0005 = "技師接單與出發回報"，與 Clarify gate 無關。Clarify gate 對應 ADR-0037 (conversation-auto-close)，FR 上應重指 FR-0018 (cs-takeover) AC 或 FR-0002 (problem-card-triage)。
  - `AIResp[AI 給回應 → FR-0030 safety guardrail]` — FR-0030 是 Guardrails (正確)，但 AI 給回應的 atomic step 應該是 FR-0028 (ReAct agent)；guardrail 是攔截不是「給回應」。建議 step 拆兩個 ref：`→ FR-0028 + 同步檢查 FR-0030`。
  - `Emergency{急件 4 類？→ FR-0002 / AC-01}` — FR-0002 = "problem-card-triage" 涵蓋 urgency detection 部分正確；但急件偵測本身在 ADR-0034 (urgent / Red Code 定義)，FR 層面應指 FR-0001 AC-emergency 或新建 FR。**建議**：保留 FR-0002 但加註「(urgency detection)」。
  - 為什麼是阻礙：D3 粒度切分規則 + KB-13 §10 cross-ref 維護寫明「→ TBD 暫無對應 FR（critique 必抓 → 必須補 FR 或刪 step）」與「Orphan ref (FR 不存在或指錯) 🔴 UX driver 必補 FR 或刪 step」。指錯的 ref 比 TBD 更危險 — QA 跟 FR 殼，會驗錯 acceptance。

- **[sa-B-2] Flow S2 mermaid 圖中 11 個 FR cross-ref 標記有 7-8 個指向錯誤 FR**。Flow S2 是 P0 critical 流程（quote-pricing + WO + onsite scope change），錯指後果最嚴重。對照 traceability matrix：
  - `AIDraft[AI 草擬問題卡完整 → FR-0006 / AC-01]` — FR-0006 = "到場拍照存證"。問題卡草擬應對應 FR-0031 (problemcard-bridge) 或 FR-0002 (problem-card-triage)。
  - `CSReview[客服 review PC → FR-0037 human gate]` — FR-0037 = "Sync PC convert"，sync 不是 review。Review gate 應對應 FR-0002 或 FR-0031 (PC bridge AC)。
  - `InternalQuote[客服內部報價 → FR-0008 / AC-01]` — FR-0008 = "Scope Change"，不是 quote 內部報價。內部報價應對應 FR-0042 (quote-internal-vs-external-view)。
  - `Approve[客服主管 approve → FR-0008 / AC-02]` — 同上指錯，應 FR-0042。
  - `SendCustomer[客服 send LIFF → FR-0009 / AC-01]` — FR-0009 = "完工簽名"，不是 send LIFF。應 FR-0042 (quote) 或 FR-0022 (consumer-tracking)。
  - `LIFF[客戶 LIFF 看明細 → FR-0009 / AC-02]` — 同上錯指；正確是 FR-0042。
  - `WOCreated[WO.created → FR-0010 / AC-01]` — FR-0010 = "改約 / 延遲通知"，不是 WO creation。應 FR-0038 (sync-convert-to-wo)。
  - `CheckAddr{地址完整？→ FR-0011 / AC-01}` — FR-0011 = "消費者付款"，不是地址檢查。應 FR-0001 AC-address 或新 FR。
  - `Top5[Top-5 推播給師傅 → FR-0012 / AC-01]` — FR-0012 = "技師月結撥款"，與 dispatch 推播完全無關。應 FR-0003 (auto-dispatch) 或 FR-0039 (sync-dispatch)。
  - `NotifyCust[LINE 通知消費者 → FR-0013 / AC-01]` — FR-0013 = "對帳爭議雙簽"，與 ETA 通知無關。應 FR-0010 (reschedule-delay LINE notify)。
  - `PriceUp 三段式 → FR-0014 / AC-01/02/03` — FR-0014 = "退款流程"，不是 scope change。應 FR-0008 (scope-change)。
  - `CloseGate → FR-0015 / AC-01` — FR-0015 = "保固申訴受理"，不是結案 gate。應 FR-0009 (completion-sign)。
  - 為什麼是阻礙：(a) Roundtable B D3 + KB-13 §9/§10 明文：「user flow 每 step 標 → FR-NNNN / AC-NN 反向指；不重寫 atomic main flow」— 指錯 = 反向指失效，比沒指還糟；(b) QA Gate 6 寫 test plan 會用 user flow → FR ref，指錯 = test case 套錯 acceptance；(c) cascade rule (KB-13 §10.3) 失效 — FR-0006 改 acceptance 時，user flow 不知道要更新。
  - 建議改法：UX driver 對 Flow S1 (9 條) + Flow S2 (11 條) + Flow S4 (cancel/refund 6 條) 的所有 FR ref 重新對照 `docs/_index/traceability-matrix.md` 改寫；若無對應 FR 改標 `→ TBD-FR-XXX`，由 Analyst driver 補建 FR。**Flow S5 (M18) 與 by-module 子檔的 FR ref 已對齊正確（A06 → FR-0031, S-M04 → FR-0038, M18 → FR-0043, A09 → FR-0032, A08 → FR-0025, A07 → FR-0018, A05 → FR-0030 都對）**，僅主檔 Flow S1/S2/S4 嚴重失準。

- **[sa-B-3] §Flow S4 mermaid 中 6 個 step 標 `FR-TBD-DPO` / `FR-TBD-cancellation` / `FR-TBD-refund` placeholder，但 traceability matrix 已有 FR-0014 (refund) / FR-0049 (Exception Approval Inbox)，沒 DPO / cancellation 對應 FR**。
  - 引用：§Flow S4 mermaid 內 `GDPRReq → FR-TBD-DPO`、`CancelReq → FR-TBD-cancellation`、`RefundReq → FR-TBD-refund`。
  - 為什麼是阻礙：refund 已有 FR-0014（雖標 draft 但存在），TBD 應改為「→ FR-0014（已 draft）」；cancellation 確實沒對應 FR，是真 TBD — 應作為 Phase II FR placeholder 列入 backlog（建議 FR-0052 cancellation flow）；DPO / GDPR forget 也沒 FR，建議 FR-0053 dpo-forget。KB-13 §10.4 規定 TBD ref 🟡 → Analyst driver 必補 FR。
  - 建議改法：(a) refund TBD 改 `→ FR-0014`；(b) 主檔加一段「Phase II FR placeholder backlog」列 cancellation / DPO 兩條，附 issue link 或 placeholder ID（FR-0052 / FR-0053）；(c) Analyst driver 接手時補建這兩條 FR placeholder（status=placeholder，效法 FR-0044 ~ FR-0051）。

- **[sa-B-4] Flow S2 §S2 journey 重點清單第 7 點「加價三段式 (P0)：≤500 ADR-0049 三件套 / 501-2000 quote v+1 客戶 LIFF 確認 / >2000 強制主管覆核」缺失：「無加價」路徑（既 main flow 也是 acceptance 的關鍵 alt path）的後置 acceptance 描述**。
  - 引用：mermaid `PriceUp -->|無加價| Repair` 直接跳維修，沒寫「無加價時系統需 set scope_change=null」這類顯式 acceptance hint。
  - 為什麼是阻礙：SA 視角 — 無加價是「正常路徑」(happy path)，但 acceptance 必須能驗證「沒呼叫 quote v+1 也沒呼叫 ADR-0049 三件套」。沒有顯式 hint，QA 寫 test 時可能漏測「無加價 + 直接施工 + 結案 + 對帳金額 = 原 quote 不變」。建議補一行：「無加價 → no scope_change emitted → 結案金額 = quote_confirmed snapshot」。

### 建議調整（可接受但建議改）

- **[sa-S-1] §🎯 設計目標** 段「成功狀態（success state）」5 條條件寫得很好（按已解決 / 48h auto_closed / 月結對得起來 / Family Reviewer 100% / config audit trail），但**缺 precondition / postcondition 明文**。SA frame：use case 覆蓋需要 pre/post 雙標。建議補一段「平台前置條件」（如「使用者已加 LINE 好友」「客服已 onboarding」），讓 acceptance 起點明確。

- **[sa-S-2] Flow S2 mermaid 中 `Top5 --> Accept{師傅 10/5min 內接？}` — 10min / 5min 數字硬編碼**，但 ADR-0045 (acceptance-sla-policy) 規定 SLA。建議改為「→ FR-0005 / 依 ADR-0045 SLA」軟引用，避免 ADR 改了 user flow 也要改（D5 cascade rule）。

- **[sa-S-3] §Flow S3 SOP 螺旋的 acceptance** 僅在主檔 §AC 段一行帶過「雙審 SOP 100% 覆核率；24 小時內審完；缺席演練過 1 次」。對應 FR-0017 + ADR-0038 內容完整，但 user flow 主檔的「缺席演練 1 次」這個 acceptance 在 mermaid 圖中沒呈現（圖只到 `Pause → Replacement`）。建議補一個 annotation：「演練 trigger：每季 1 次 mock 缺席案件」。

- **[sa-S-4] §S2 Edge case 表第 7 行「Quote 48h 過期 ↔ conversation auto_closed 48h」標「OQ-UX-S2-01 已決」**，但全 doc 沒列「已決成什麼」。需明文：「48h auto_closed 時 quote 同步 expired_by_conversation_close」之外的 alt（提前重啟 conversation 是否 reactivate quote？）。SA 視角：edge case 需顯式 yes/no。

- **[sa-S-5] §Flow S5 staged rollout `Stage50` Observe2 fail → Rollback2 → RollbackAudit`，但 fall-through 到 100% 後沒 observation step**。SA 視角：100% 後是否還有 observation window？若沒有 = 沒 verification 就 marked active。建議補一行：「100% rollout 後再 10min final observation，failed → 全量 rollback within 24h window」。

### 通過項

- **§30 秒摘要** + **§設計目標** 段 — 把四種使用者 + 五條 flow 的「使用者想做的事」明文成 use case 形式，actor / 目標 / success state 三段式（雖未明標但隱含）。SA 可以直接抽出 use case header。
- **§S2 Edge case 與 P0 規則對應表** 9 行 — P0 規則 cross-ref 完整（M15 取消 / M15 加價 / M17 退款 SoD / M11 材料歸屬 / M10 零件序號 / Quote 48h ↔ conversation auto_closed / Onsite LIFF 失敗 fallback / Quote re-version auto-disable）。SA frame: edge case 完備度高。
- **§S4 Edge case 與 P0 規則對應表** 5 行 — GDPR × legal-hold / 取消費分層 / 退款 SoD / reason_code 缺項 / Read 路徑 — 業務規則 cross-ref 引用具體（BR-PII-001 / M15 Q047 Q071 / M17 G013 / M18 config 管轄 / audit policy）。
- **Flow S5 mermaid (M18 admin journey)** — 從 login → edit → schema validate → approve → staged rollout → audit view → rollback 完整 sequence，每個 decision diamond 都有 yes/no 分支 + edge case。完整度遠超 Flow S1-S4 mermaid。
- **By-module 子檔 (S-M04 ConvertToWO) human gate matrix 三行表** — AI 路徑 / 客服路徑 / AI 自行嘗試三個 actor × CS 1-click / 客戶 quote / bypass 三 dimension，把「強制 human gate (P0)」表達得很清楚，acceptance 可驗。
- **§AC 段 (給 QA 寫 test plan)** 19 條 — 每條都可被 QA 直接拿去寫 G/W/T。涵蓋 P0 規則、SLO、a11y、結案 hard gate 全套。

### 跨 persona 衝突點

無明顯衝突，與 UX critique 結論方向一致。

---

## Consensus Blockers（多 persona 一致認為阻礙）

| ID | 問題 | 提出者 | 建議改法 |
|:---|:-----|:-------|:---------|
| CB-1 | Flow S1/S2/S4 mermaid 圖中 18-24 個 FR cross-ref 標記**系統性指錯 FR**（如 FR-0006 寫成 PC draft 實為 onsite-photo；FR-0014 寫成 scope change 實為 refund 等），違反 KB-13 §10 cross-ref 維護規範與 D3 粒度切分檢核 | sa-B-1, sa-B-2, ux-B-1（間接，缺 S3/S4 主表行也與 cross-ref 連動）, KB-13 §10.4 CI check 預期會 flag 多條 🔴 Orphan ref | UX driver 對照 `docs/_index/traceability-matrix.md` 重新 map 主檔 (Flow S1/S2/S4) 全部 FR ref；無對應者改 `→ TBD` 並開 Phase II FR placeholder（FR-0052 cancellation / FR-0053 dpo-forget）；FR-0014 已存在（draft）— 用 `→ FR-0014` 而非 TBD |
| CB-2 | a11y 主檔 vs Flow S5 §a11y vs LIFF a11y checklist 之間 **WCAG 2.2 新 SC 條目分布不一致**（2.4.11 重複、3.3.4 主表缺、LIFF checklist 未對齊 WCAG 2.2 新 SC 9 條） | ux-B-3, ux-S-5 | 主檔 §a11y 規範主表補 3.3.4；統一 2.4.11 表述；§Channel-specific 表新增「LIFF 已 commit SC 清單」+ pending/N-A 標註 |
| CB-3 | State Coverage 主檔總表**缺 Flow S3 SOP 螺旋 + Flow S4 合規稽核 / 取消費 / 退款核准三層的 step 行**，違反 Q-OF1=B 「主檔 single source」承諾 | ux-B-1, sa-S-3（缺席演練 acceptance 未在 state matrix 體現） | 補 7-10 行到主表，每行五個 UI state + entry/exit annotation 完整 |

## Per-Persona Blockers

### [ux] blockers
- [ux-B-1] State Coverage 主表缺 S3/S4 step（同 CB-3）
- [ux-B-2] S2 LIFF table confirm offline vs reject offline 行為不一致
- [ux-B-3] a11y 重複 / 缺項（同 CB-2 部分）

### [sa] blockers
- [sa-B-1] Flow S1 FR ref 5 處錯指（CB-1）
- [sa-B-2] Flow S2 FR ref 7-8 處錯指（CB-1，重災區）
- [sa-B-3] Flow S4 TBD-FR placeholder 處理（refund 應對 FR-0014，cancellation / DPO 須補 placeholder FR）
- [sa-B-4] 加價三段式 mermaid 缺「無加價」acceptance hint

## Suggestions（非阻礙）

| Persona | 建議 |
|:--------|:-----|
| ux | [ux-S-1] feedback=down → silent failure follow-up 機制 |
| ux | [ux-S-2] Flow S2 簽名失敗 / 客戶不在現場 alt branch |
| ux | [ux-S-3] Flow S5 progress bar 具體文字應留 wireframe placeholder |
| ux | [ux-S-4] by-module 純後台子檔 a11y 條目至少 4 條（keyboard / focus / contrast / target size） |
| ux | [ux-S-5] LIFF a11y checklist 對齊 WCAG 2.2 新 SC 9 條 commit/pending 標註 |
| sa | [sa-S-1] §設計目標 補 precondition / postcondition 明文 |
| sa | [sa-S-2] Top5 SLA 改軟引用 ADR-0045 |
| sa | [sa-S-3] SOP 缺席演練 acceptance 在 state matrix 體現 |
| sa | [sa-S-4] OQ-UX-S2-01 「已決」內容明文化 |
| sa | [sa-S-5] Flow S5 100% rollout 後 final observation window |

## Conflicts（跨 persona 觀點衝突）

無。UX 與 SA critique 結論一致；對 D1-D5 與 Q-OF1=B / Q-OF2=A 業主裁決執行情況的判斷一致。

## Pass-Through Items（一致通過項）

- Journey Map 30 行覆蓋 5 actor × 5 flow
- §設計目標 — success state 5 條 actor-specific 明文
- Q-OF1=B annotation 在所有 state matrix 落實
- WCAG 2.2 AA 13 條 SC checklist (LIFF §S2) 是整份 doc 最紮實段落
- Flow S5 staged rollout 三段式與 ADR-0067 對齊
- By-module 子檔（A05 / A06 / A07 / S-M04 / S-M06 / M14 / M18）sequence + state machine 雙圖混合 D2 落實
- §S2 / §S4 Edge case 與 P0 規則 cross-ref 表（P0 套用驗證完整）
- §AC 19 條 — QA 可直接抽 G/W/T
- By-module S-M04 human gate matrix 三行表 — AI 越權邊界表達清晰

---

## Gate 2 Freeze Verdict

**Verdict**: **NEEDS_MINOR_FIX**

**理由**：v2 doc 整體骨架穩固 — D1/D2/D4/D5 全部落實、Q-OF1=B annotation 與 Q-OF2=A WCAG 2.2 AA 在 LIFF / S5 / by-module 子檔有實質執行；by-module 12 個子檔粒度切分（D3）正確、FR 反向指（在子檔層級）正確。

但**有 3 條 Consensus Blockers** 需在 freeze 前處理：
1. **CB-1（主檔 Flow S1/S2/S4 FR cross-ref 系統性錯指）** — 這條最嚴重，等同於 KB-13 §10.4 CI check 預期 flag 多條 🔴 Orphan ref。但**修法是純 search-and-replace 對照 traceability-matrix**（沒新概念引入、沒設計爭議、沒 trade-off），所以是 minor fix 不是 rewrite。
2. **CB-2（a11y 條目分布不一致）** — 純編輯修正，補 3.3.4 + 統一 2.4.11 表述 + LIFF SC 清單對齊。
3. **CB-3（State Coverage 主表缺 S3/S4 step）** — 純補表 7-10 行，無新設計。

**不評為 NEEDS_REWRITE** 因為：
- 沒有結構性問題（IA / 粒度切分 / a11y commitment / state annotation 模式都對）
- 沒有跨 persona 衝突需要 Lane B 升級
- 沒有需要業主裁決的 trade-off
- 修法純 mechanical（search-replace + 補表 + 補條目）

**不評為 READY** 因為：
- CB-1 影響 QA / cascade 機制，不能帶錯入 Gate 3
- CB-2 影響 by-module 子檔強制繼承，必須 source 對齊
- CB-3 違反業主 Q-OF1=B 「主檔 single source」承諾

---

## Minor Fix List（給 UX driver 接手執行）

| # | 範圍 | 動作 | Effort |
|:--|:-----|:-----|:-------|
| MF-1 | 主檔 Flow S1 mermaid (9 FR refs) | 對照 traceability-matrix 改寫所有 FR ref；確認對應 FR.AC 存在 | 30min |
| MF-2 | 主檔 Flow S2 mermaid (11 FR refs，重災區) | 同上；至少修：FR-0006→FR-0031/FR-0002, FR-0008→FR-0042, FR-0009→FR-0042, FR-0010→FR-0038, FR-0011→新或 FR-0001 AC-address, FR-0012→FR-0003/FR-0039, FR-0013→FR-0010, FR-0014→FR-0008, FR-0015→FR-0009 | 60min |
| MF-3 | 主檔 Flow S4 mermaid (6 FR-TBD) | refund TBD → FR-0014；cancellation / DPO 開 FR-0052 / FR-0053 placeholder（與 Analyst driver 協作） | 30min |
| MF-4 | 主檔 §a11y 規範 — WCAG 2.2 新 SC 段 | 補 3.3.4 Error prevention（legal/financial/data）一行；統一 2.4.11 表述 | 10min |
| MF-5 | 主檔 §Channel-specific a11y inheritance 表 | 新增「LIFF 已 commit SC 清單」列；標 pending / N-A 的 SC 4 條 | 15min |
| MF-6 | 主檔 §State Coverage 主檔總表 | 補 7-10 行：Family Reviewer 審 / Family Reviewer 缺席 / GDPR forget / auditor flagged / auditor unflagged cache / 取消費 5 階段 reason_code / 退款分層核准 | 30min |
| MF-7 | 主檔 Flow S2 mermaid `PriceUp -->|無加價| Repair` | 補 annotation：「no scope_change emitted → 結案金額 = quote_confirmed snapshot」 | 5min |
| MF-8 | 主檔 §Flow S5 a11y 段 | 改寫為「繼承主檔，特別強調 3.3.4 / 2.4.11 在 config 與 rollout 場景的應用」（不重複定義 SC 條目） | 10min |
| MF-9 | 主檔 §Flow S5 staged rollout mermaid | 補 `Stage100 → FinalObserve` 與 24h window 內 rollback | 10min |
| MF-10 | by-module A02 / A04 / A11 / A12 / S-M01 / S-M02 / S-M03 / S-M05 | §a11y notes 段擴充至少 4 條（keyboard / focus / contrast / target size），對應 admin 後台 / reviewer UI | 60min (8 檔 × ~7min) |

**總 effort 估**：約 4 小時，由 UX driver 一次 session 完成；不需 Analyst driver 介入除非 MF-3 placeholder FR 補建（可平行）。

---

## 業主裁決

[ ] 接受全部 CB + Per-Persona blockers，UX driver 執行 Minor Fix List 後 freeze Gate 2
[ ] 逐項接受/拒絕（見下方）
[ ] 整份打回（不 freeze）

### 逐項裁決

- CB-1（FR ref 系統性錯指）：[接受 / 拒絕（理由）]
- CB-2（a11y 條目分布不一致）：[接受 / 拒絕（理由）]
- CB-3（State Coverage 主表缺 S3/S4 step）：[接受 / 拒絕（理由）]
- 其他 Per-Persona / Suggestion：[全接受 / 逐項選擇]

---

## Recommended Next Steps

1. **業主裁決** 三條 CB
2. **UX driver 接手 Minor Fix List (MF-1 ~ MF-10)**，預計 4 小時內完成
3. **Analyst driver 平行協作 MF-3**：開 FR-0052 (cancellation) + FR-0053 (dpo-forget) placeholder（status=placeholder，effort 30min）
4. Minor fix 完成後 **重跑 Lane A standard critique（dry-run 即可）** 驗證 FR cross-ref CI check pass
5. Pass 後標 `Gate2_UXFlow = freezed` → 解鎖 Gate 3 System Spec Freeze（analyst driver 接手）

---

## 引用 KB / 上游文件

- KB-13 §9 粒度切分檢核表 / §10 cross-ref 維護規範 (especially §10.4 CI check)
- KB-05 Meeting Protocols / Lane A standard critique format
- voice-profiles.md persona: ux / persona: sa
- Roundtable B MoM `.claude/context/devteam/meetings/2026-05-28-1200-user-flow-IA-strategy/MoM.md`（D1-D5, Q-OF1=B, Q-OF2=A 業主裁決）
- `docs/_index/traceability-matrix.md`（FR ↔ BR ↔ ADR 反向對照）
- ADR-0067 (M18 config governance) — Flow S5 source of truth
- ADR-0066 (Quote-WO Lifecycle 硬綁定) — Flow S2 source of truth
- ADR-0045 (acceptance-sla-policy) — Flow S2 SLA 軟引用建議
- ADR-0049 (現場加價三件套) — Flow S2 加價三段式
- ADR-0037 (conversation-auto-close) — Flow S1 Clarify gate / auto_closed
