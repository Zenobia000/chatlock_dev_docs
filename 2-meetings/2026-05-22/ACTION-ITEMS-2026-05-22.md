---
title: 決策會議 Action Items
date: 2026-05-22
source: decision-dashboard.html 匯出 + 會議備註
status: blocked-pending-owner-adjudication
---

# 決策會議 Action Items — 2026-05-22

> **狀態**：🟢 全綠燈，cascade 執行中（2026-05-22 18:00 更新）
> - **24 / 24 ADR 全部拍板** ✅
> - **8 / 8 MATTER 矛盾全裁決** ✅
> - **5 條新 ADR 已指派 ID**：ADR-0055~0059
> - Claude 正在執行 Level 1~4 cascade。

---

## §1 阻擋項一覽（必須先解 → 才能往下推 PRD/FR/ARCH）

| 阻擋類 | 原數量 | 已解 | 剩餘 | 解法 |
|---|---|---|---|---|
| 報告截斷 — ADR-0044 ~ 0054 未見圈選 | 11 條 | 11 ✅ | 0 | (`meeting-report-2026-05-22.md` 已找到全部) |
| 圈選 vs 備註矛盾（ADR） | 2 條 | 2 ✅ | 0 | (MATTER-01, 02 已裁決) |
| 投票 vs 備註矛盾（Pre-mortem） | 6 條 | 6 ✅ | 0 | (MATTER-03~08 全裁決) |

---

## §2 矛盾裁決（6 件已決 / 2 件待決）

### 2.1 ADR 圈選 vs 備註矛盾（2 條）

#### MATTER-01 — ADR-0032 地址政策 ✅ 已裁決 (a)
- **圈選**：替代方案 A — 工單可以先開，地址後補
- **備註原文**：「工單可以接受暫時不填寫住址 師父假如確認有這個客戶的地址它知道 它可以直接 skip, 但是工單結案以前要把住址回填」
- **裁決 (2026-05-22)**：✅ **(a) 推薦做法 + 客製「結案前 gate」**
- **最終規則**（要寫進 ADR-0032 Decision 段）：
  1. AI 對話階段優先嘗試 3 段補（對話追問 → 後台補 → 仍無 → 422 不擋派工）
  2. 派工階段：師傅 App 顯示「地址待補」狀態；師傅若已知客戶地址可 skip
  3. **結案階段為硬 gate**：師傅標「結案」時 backend 強制 validate `address != null`，否則 422 拒絕結案
  4. BI 報表加「無地址工單 vs 結案前回填率」監控

#### MATTER-02 — ADR-0039 取消費分階段 ✅ 已裁決 (c)
- **圈選**：✓ 推薦做法 — 5 階段
- **備註原文**：3 階段 + 客服可覆寫
- **裁決 (2026-05-22)**：✅ **(c) 混合方案**
- **最終規則**（要重寫進 ADR-0039 Decision 段）：

  | 階段 | 自動判定 | 收費 | 客服可覆寫 |
  |---|---|---|---|
  | 1. 報價未確認 | system 自判 | 免費 | ✅ |
  | 2. 已派工未出發 | system 自判 | **不收費** | ✅ |
  | 3. 出發後未到場 | system 自判 | 車馬費 | ✅ |
  | 4. 到場後無法施工 | system 自判 | 車馬費 + 檢測費 | ✅ |
  | 5. 已施工取消 | system 自判 | 按比例（partial） | ✅ |

  - 所有階段 system 自動推算（依工單 state machine），**客服可全域覆寫**並留 audit trail
  - 「已施工按比例」公式：`partial = 完工項目% × 完整費用 + 車馬費`（合約常見條款，必須保留）
  - 金額 configurable per brand / contract

### 2.2 Pre-mortem 投票 vs 備註矛盾（5 條）

#### MATTER-03 — F1 資料淺薄死 ✅ 已裁決 (b)
- **原投票**：× 過慮了 → **改投 ✓ 認同 + 標 Phase 0**
- **裁決 (2026-05-22)**：認同方向，但實作排程放 Phase 0（先 Bronze 收齊資料，Silver/Gold 延後）
- **行動**：
  - PAIN-POINTS §A F1 狀態：紅燈 → **黃燈 (Phase 0 排程中)**
  - SOW Medallion 章節加註：「V1.0 僅 Bronze，Silver/Gold 屬 Phase 0+ 範圍」
  - 副廠 / 維修廠商資料累積路徑加入 Bronze schema 設計

#### MATTER-04 — F2 知識被技術綁架死 ✅ 已裁決 (b)
- **原投票**：× 過慮了 → **改投 ✓ 認同**
- **裁決 (2026-05-22)**：認同，並訂為設計鐵律：
  1. SKILL 可被抽換
  2. LLM 可被抽換
  3. SKILL 與 LLM 必須解耦
- **行動**：觸發 **ADR-NEW-1「SKILL ↔ LLM 解耦合約」**（§4 紀錄）

#### MATTER-05 — F3 HITL 邊界漂移死 ✅ 已裁決 (b)
- **原投票**：× 過慮了 → **改投 ✓ 認同**
- **裁決 (2026-05-22)**：認同 + 加兩條硬規則：
  - 每家活做的廠商合約必須 attach 到系統，每家規則不同
  - LLM 透過**文件檢索 (RAG)** 取得規則，**禁止寫死在 prompt**
- **行動**：觸發 **ADR-NEW-2「每廠商合約附件規格」** + **ADR-NEW-3「合約 / 規則走 RAG，禁寫 prompt」**（§4 紀錄）

#### MATTER-06 — F4 合規崩潰死 ✅ 已裁決 (b)
- **原投票**：× 過慮了 → **改投 ✓ 認同**
- **裁決 (2026-05-22)**：認同，必須把合規從「附加項」拉成「主動脈」
- **行動**：
  - 啟動 ADR-0050 / ADR-0051 / ADR-0042 中 Family Reviewer 角色路徑
  - 合約 4.4(a) 90% 情緒識別 UAT 必須有測試集（PRD US-038 acceptance criteria 加碼）
  - 合約 4.4(d) 家族覆核機制必須在 RBAC matrix 明文（ADR-0042 鎖住）
  - PII retention engine 必須在 V1.0 內建，**不可延後** (ADR-0051)
  - PAIN-POINTS §A F4 狀態：紅燈 → **進行中 (V1.0 必交)**

#### MATTER-07 — F6 人才流失死 ✅ 已裁決 (c)
- **投票**：✓ 認同是大風險
- **備註**：「先不考慮 因為我們有一套平台專門在做 知識傳承 到時候在導入到 ai agent」
- **裁決 (2026-05-22)**：✅ **(c) 兩者並行**
- **最終規則**：
  1. SOP 螺旋仍跑（依 ADR-0038 高風險雙審 / FAQ 單審）
  2. 外部知識傳承平台知識**最終 ingestion 進 SOP 庫**（必須走 ADR-0038 審核流程）
  3. ingestion 介面規格寫進 **ADR-0058「外部知識傳承平台 → AI Agent ingestion contract」**
  4. PAIN-POINTS §A F6 狀態：紅燈 → **進行中（雙路徑並行）**

#### MATTER-08 — F7 被 AI 巨頭吞噬死 ✅ 已裁決 (a)
- **投票**：[未表態] → **確認 ✓ 認同**
- **備註**：「我們的護城河是線下師父 物理 合約；電子鎖的狀態訊號透過 app 串送到 AI 客服，然後做判斷」
- **裁決 (2026-05-22)**：✅ **(a) 確認 ✓ 認同 + 開 ADR-0059**
- **最終規則**：
  1. 護城河三柱明文化：線下師傅生態 / 物理 Evidence / 合約履約
  2. **新開 ADR-0059「電子鎖 IoT 狀態訊號接入規格」** — 定義 IoT → App → AI 客服訊號 schema
  3. PAIN-POINTS §A F7 狀態：黃燈 → **進行中（IoT pipeline 待建）**

---

## §3 已確認可執行（13 條 ADR 拍板，無矛盾）

> 這 13 條 §2 解阻擋前**可先動 Level 1**（frontmatter status: draft → accepted）。
> Level 2~4（內容改寫 + PRD/FR/ARCH 同步）建議**等全部 24 條 + 7 矛盾全解完再一次推**，避免局部推完又因下游矛盾要回滾。

### 3.1 GAP 跨團隊決策（8/8 條已確認 ✅）

| ADR | 圈選 | 摘要 |
|---|---|---|
| ADR-0031 | ✓ 推薦 | AI 先草擬 → 客服 1-click 確認，才呼叫 `convert_to_work_order` |
| **ADR-0032** | **推薦+客製 gate** | **3 段補 + 結案前硬 gate**：派工可暫缺，師傅可 skip，**結案 422 強制驗證 address** |
| ADR-0033 | ✓ 推薦 | ProblemCard completeness ≥ 0.85 才自動派工，低分走 Exception |
| ADR-0034 | ✓ 推薦 | urgent 4 類具名：被鎖門外 / 門內受困 / 安全風險 / 怒客高風險 |
| ADR-0035 | ✓ 推薦 | AI 可給範圍報價（NTD 1500-3500），永禁 final quote |
| ADR-0036 | ✓ 推薦 | 同 active issue 一張 PC，新症狀 / 新設備可另開 |
| ADR-0037 | ✓ 推薦 | 客戶點「已解決」或 48h 沒回應自動關，7 天可 reopen |
| ADR-0038 | ✓ 推薦 | 高風險 SOP 雙審（客服主管 + Domain expert），FAQ 單審 |

### 3.2 P0 業務規則（5/5 條已確認 ✅，0044/0045 拆到 §3.3）

| ADR | 圈選 | 摘要 |
|---|---|---|
| **ADR-0039** | **5 階段全量 + 客服覆寫 + partial** | 報價未確認 / 派工未出發 / 出發未到 / 到場無法施工 / 已施工按比例，全 system 自判，**全階段客服可覆寫**（audit log）|
| ADR-0040 | 替代方案 A | 退款依**責任歸屬**分層（品牌 / 平台 / 師傅），矩陣 5×3=15 |
| ADR-0041 | ✓ 推薦 | 車馬費 80% 師傅 / 20% 平台（同區 500 / 跨區 800 / 遠距 1200）|
| ADR-0042 | ✓ 推薦 | RBAC 4 層原則固化（顧客/營運/財務/治理），具體欄位 configurable，**備註要求**「設定要透過後台可以轉換管理」 |
| ADR-0043 | ✓ 推薦 | 合約模板物件（Contract Template）+ tenant scope，30 品牌各自合約 instance |

### 3.3 P0 業務規則補充（ADR-0044~0045 已補齊）

| ADR | 圈選 | 摘要 |
|---|---|---|
| ADR-0044 | ✓ 推薦 | Device 加 `warranty_start_mode` 5 模式：purchase / handover / activation / contract / manual_override |
| ADR-0045 | ✓ 推薦 | 師傅接單 SLA：一般 10 min / 急件 5 min + 合約可 override（VIP 客戶可調）|

### 3.4 AI 邊界 + 治理（9/9 條已確認 ✅）

| ADR | 圈選 | 摘要 |
|---|---|---|
| ADR-0046 | ✓ 推薦 | ChangeRequest 物件化：所有政策/價格/權限/SLA/模板變更走 申請→核准→生效日→audit；緊急走 emergency track |
| ADR-0047 | ✓ 推薦 | AI Forbidden 集中入 charter + 200 題 Eval pipeline，pass<95% block deploy |
| ADR-0048 | ✓ 推薦 | AI 轉真人 7 條硬規則：急件 / 怒客 / 高金額 / 保固不明 / 退款 / 法律安全 / 3 次失敗 |
| ADR-0049 | ✓ 推薦 | 現場加價三件套：客戶簽名 + Evidence 照片 + audit log；金額分層 (≤500 師傅 / 501-2000 客服 / >2000 主管+三方) |
| ADR-0050 | ✓ 推薦 | Evidence 可見性矩陣：角色 × 案件生命週期 × 屬性過濾（客戶 90 天 / 師傅 30 天 / 會計永久 / 稽核唯讀全看）|
| ADR-0051 | ✓ 推薦 | Evidence retention：1 年預設 / RMA+3 年 / 法律相關永久 / 客戶 GDPR forget 7 天執行 |
| ADR-0052 | ✓ 推薦 | Material 加 `owner` 欄位：platform / brand / locksmith 三選一，月結依 owner 自動分流 |
| ADR-0053 | ✓ 推薦 | Serial 強制：主鎖 + 高價零件 (>1000) 強制，低價選填，OCR 條碼掃描輔助 |
| ADR-0054 | ✓ 推薦 | AI 全域報價邊界：永禁 final quote + 折扣承諾 + 保固免費承諾；Guardrail 三規則偵測 |

---

## §4 新發現 ADR（已指派正式 ID）

| 正式 ID | 來源 | 範圍 | 狀態 |
|---|---|---|---|
| **ADR-0055** | MATTER-04 (F2) | SKILL ↔ LLM 解耦合約 — vendor swap 可移植 | 撰寫中 |
| **ADR-0056** | MATTER-05 (F3) | 每廠商合約附件規格 + 接入流程 | 撰寫中 |
| **ADR-0057** | MATTER-05 (F3) | 合約 / 規則走 RAG 文件檢索，禁寫 prompt | 撰寫中 |
| **ADR-0058** | MATTER-07 (F6) | 外部知識傳承平台 → AI Agent ingestion contract | 撰寫中 |
| **ADR-0059** | MATTER-08 (F7) | 電子鎖 IoT 狀態訊號接入規格 | 撰寫中 |

---

## §5 Cascade Scope — 24 條 ADR 全綠燈後要動的下游文件

### 5.1 Level 1 — 24 個 ADR frontmatter
```yaml
status: draft → accepted
accepted_by: [業主]
accepted_date: 2026-05-22
```

### 5.2 Level 2 — ADR Decision 段內容改寫
- 對純 ✓ 推薦做法（無矛盾）：不需改寫，只需 frontmatter 切 accepted
- 對 MATTER-01 / MATTER-02：需依裁決結果重寫 Decision + Alternatives 段
- 對所有 ADR：補 `accepted_*` metadata 區塊

### 5.3 Level 3 — PAIN-POINTS-SUMMARY-2026-05-21.md 同步
- §F.1 GAP 清單（D01-D08）：標記每條對應 ADR 已 accepted
- §F.2 角色權限矩陣：ADR-0042 拍板後可結束「sheet 11 全 11 行待確認」狀態
- §F.3 AI-XXX 清單：對應 ADR 0033 / 0035 / 0036 / 0047 / 0048 / 0050 / 0051 / 0052 / 0053 / 0054
- Pre-mortem F1-F7：依 §2 裁決結果更新狀態（紅燈 / 黃燈 / 綠燈 + Phase 排程）

### 5.4 Level 4 — PRD / FR / ARCH 同步

| 拍板 | 下游檔案 | 動作 |
|---|---|---|
| ADR-0031 | `4-prd-fr-arch/02-fr/FR-XXXX-ai-work-order-convert.md`（待建）| 寫 UAT：「AI 永不直接 call `convert_to_work_order`」+ Eval set 200 題 |
| ADR-0032 | FR-XXXX 地址政策、`PRD-0001` Epic 11 | 結案前 gate 寫進 acceptance criteria |
| ADR-0033 | `FR-0002-problem-card-triage.md` §3.1 | completeness_score gate 0.85 從合約 9.3 條延伸到自動派工門檻 |
| ADR-0034 | `ARCH-0001` Domain Event Catalog、SLA monitor 章節 | 4 類 urgent 寫進 event schema |
| ADR-0035 | `ADR-0028 charter` Forbidden 區、Eval set | 「禁 final quote」入 200 題 guardrail |
| ADR-0036 | `FR-0002` §3.2 邊界案例、ProblemCard schema | unique constraint `(conv_id, device_id, active_status)` |
| ADR-0037 | Conversation state machine、BI 報表 | 加 `auto_closed` 狀態 + 7 天 reopen 視窗 |
| ADR-0038 | SOP 審核流程 FR、Knowledge Owner 角色定義 | 雙審 vs 單審 routing |
| ADR-0040 | `PRD-0001` 退款 user story、RBAC matrix | 責任歸屬 → 核准角色 mapping |
| ADR-0041 | Dispatcher Commission ledger schema、月結 FR | 80/20 分潤 + 距離級距 |
| ADR-0042 | `ARCH-0001` §RBAC bounded context、Admin Panel UI spec | 4 層原則 + 後台 config UI |
| ADR-0043 | `ARCH-0001` Tenant 章節、Contract Template schema | 合約模板物件化 |

---

## §6 Cascade 執行完成（2026-05-22）

| 階段 | 範圍 | 狀態 | 檔案 |
|---|---|---|---|
| Level 1 | 24 個 ADR frontmatter status: draft → accepted + accepted_date | ✅ 完成 | `3-adr/ADR-0031~0054.md` |
| Level 2 | ADR-0032 + ADR-0039 Decision 段重寫（業主備註版）| ✅ 完成 | `ADR-0032-missing-address-policy.md` / `ADR-0039-cancellation-fee-tiers.md` |
| 新 ADR | ADR-0055 ~ 0059 撰寫（5 條，全 accepted）| ✅ 完成 | `ADR-0055~0059`（5 個新檔）+ `INDEX.md` Group 4 |
| Level 3 | PAIN-POINTS-SUMMARY F1~F7 + GAP 表 + LEGAL 同步 | ✅ 完成 | `PAIN-POINTS-SUMMARY-2026-05-21.md` 新增 §A.1 / §F 表 / LEGAL-01/03 |
| Level 4 | PRD-0001 §5.1.1 / FR-0002 / FR-0017 / ARCH-0001 bounded context | ✅ 完成 | 4 個下游檔已加 ADR cross-reference |

---

## §7 進度追蹤

| 區塊 | 完成度 | 備註 |
|---|---|---|
| ADR 拍板 | **24 / 24（100%）✅** | ADR-0031~0054 |
| MATTER 矛盾裁決 | **8 / 8（100%）✅** | MATTER-01~08 全裁決 |
| 新 ADR 撰寫 | **5 / 5（100%）✅** | ADR-0055~0059 全 accepted |
| Level 1 frontmatter 切 accepted | **24 / 24 ✅** | sed 批次處理 |
| Level 2 ADR 內容改寫 | **2 / 2 ✅** | ADR-0032, ADR-0039 |
| Level 3 PAIN-POINTS 同步 | **完成 ✅** | §A.1 新增 / §F GAP / LEGAL-01,03 |
| Level 4 PRD/FR/ARCH cascade | **完成 ✅** | PRD-0001 §5.1.1 / FR-0002 / FR-0017 / ARCH-0001 |
| INDEX.md 更新 | **完成 ✅** | Group 4 新增 ADR-0055~0059 |

**規範閉環達成**：24 條原 ADR + 5 條新 ADR 全部 accepted、下游 PRD/FR/ARCH 加 cross-reference、PAIN-POINTS Pre-mortem 7 條風險狀態同步。

---

_由 Claude 自動生成於 2026-05-22，依據 `decision-dashboard.html` 匯出 Markdown 報告 + 會議備註。本檔在阻擋解除前為唯一 source of truth；解除後同步寫入 ADR 文件與 PAIN-POINTS-SUMMARY，本檔轉為歷史紀錄。_
