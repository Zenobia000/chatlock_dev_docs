---
title: 業主必答問題清單（2026-05-22 會議後）
date: 2026-05-22
audience: 業主（PM / 甲方）
purpose: 阻擋 V1.0 進入 Coding 階段的待決事項
status: fully-answered (2026-05-22, 3 rounds) — V1.0 scope 確認為完整 SaaS
answered_date: 2026-05-22
revision_history:
  - 2026-05-22 r1: Q1/Q4/Q6/Q7 已答 + Q2/Q3 follow-up 已答
  - 2026-05-22 r2: Q8 工單平台 detail 補答（一度誤判為 master system）
  - 2026-05-22 r3: 校正誤判 — 工單平台是我們開發的 SaaS，ChatLock = first customer
---

## 🟢 業主答覆摘要（2026-05-22，三輪後最終版）

| # | 業主答案 | 狀態 |
|---|---|---|
| Q1 部署環境 | ✅ **GCP 雲端** | 落地 |
| Q2 真人轉接 | ✅ **LINE → 我們系統 web → 撥客服手機 + 錄音** | 落地 |
| Q3 LIFF | ✅ **取消 LIFF，改 LINE Flex + 我們 web** | 落地 |
| Q4 知識平台 | ✅ **AEOS**，離線批次匯入 | 落地 |
| Q5 會計軟體 | ⏸ TBD（W10 前回）| 延後 |
| Q6 消費者付款 | ✅ **現金 / 刷卡 / 匯款後 5 碼比對** | 落地 |
| Q7 IoT 廠商 | ✅ **ChatLock**（與 Q8 customer 合一）| 業務聯繫 LOI |
| Q8 工單平台 | ✅ **我們自己開發的 SaaS**，ChatLock 是 first 客戶 | 落地 |
| F2.1 通話 audit | ✅ **B 錄音 + STT 摘要** | 待開 ADR-0060 |
| ChatLock 銷售階段 | ✅ **LOI** | 可做 alpha tester |
| ChatLock 雙身份 | ✅ **單一 entity**（customer + locks_vendor）| ADR-0043 / 0056 schema 調整 |

**整體結論**：**7 題 + 3 follow-up 全部落地**。V1.0 完整 SaaS scope 確認，29 條 ADR 假設全部正確，可立即進入 P3 Design 階段。

---

# 智慧鎖平台 V1.0 — 業主必答 7 件事

> **背景**：5/22 會議拍板 29 條 ADR，技術方向已定。但有 **7 件事必須業主拍板**，否則設計階段（OpenAPI / ERD / Migration）無法啟動。
>
> **建議回覆方式**：在每題下方寫「✅ 選 X」或「✅ 我的答案：...」+ 簡短理由。

---

## 🔴 緊急 — 已逾期，阻擋整個開發起跑（4 件）

### Q1. 部署環境要放哪？（原 Q-005，逾 W1）

**問題**：V1.0 系統要部署在哪裡？

| 選項 | 利 | 弊 |
|---|---|---|
| **A. 甲方自有伺服器** | 資料完全自家掌控、無雲端訂閱費 | 需要 IT 人員維運、災難復原靠自己 |
| **B. 雲端（AWS / GCP）** | 自動 scaling、災備、安全更新自動 | 月費 NT$ 8K-25K 起跳、資料在雲端供應商手上 |
| **C. VPS（Linode / DigitalOcean）** | 月費低（NT$ 2K-8K）、彈性中等 | 需要少量維運能力 |

**為什麼必須現在決定**：影響整個基礎建設選型（CI/CD、監控、備份策略），動工後改成本極高。

**Tech Lead 建議**：B 雲端（GCP）— 因為 AI 用的 Gemini 在 GCP 體驗最好、IAM / 監控整合最省事。

✅ **業主決定（2026-05-22）：B 雲端 GCP**

---

### Q2. 客戶要「找真人」時，AI 怎麼把對話轉出去？（原 Q-004，逾 W2）

**問題**：當 AI 判定需轉真人客服時，要轉到哪裡？

| 選項 | 利 | 弊 |
|---|---|---|
| **A. 轉到甲方既有的客服 LINE 群組** | 客服不用學新工具、零改變現況 | 對話記錄分散在 LINE，難稽核、無 audit log |
| **B. Admin Panel 內建客服聊天介面** | 完整 audit log、合約 4.4(d) 覆核機制可掛上 | 客服要學新介面、開發成本 +2 週 |

**為什麼必須現在決定**：Epic 1 LINE Bot 核心流程、合約 4.4(a) 負面情緒識別轉真人都依賴這個答案。

**Tech Lead 建議**：B Admin Panel 內建 — 因為合約 4.4 要求 audit trail，A 方案的 LINE 群組無法滿足。

✅ **業主決定（2026-05-22）：選項 C 自訂方案** — LINE 訊息含外部連結 → 客戶點連結跳網頁 → 網頁顯示「撥打客服」按鈕（`tel:` link）→ 通話。

⚠️ **本答案衍生新議題（需追問，見文末「Q2 Follow-up」）**：
- 通話內容 audit 怎麼留？（合約 4.4(a) 負面情緒轉真人需通知 + audit）
- 客服接電話時要不要先看 ProblemCard / 對話歷史？看不到怎麼接？
- 合約 4.4(d) Family Reviewer 怎麼覆核「通話」這個 Evidence？
- 此設計需新開 **ADR-0060「電話轉接 + 通話 audit 機制」**

---

### Q3. 要不要做 LINE LIFF（在 LINE App 內開網頁）？（原 Q-010，逾 W2）

**問題**：消費者確認報價 / 簽收的畫面，要做成普通網頁連結還是 LIFF？

| 選項 | 利 | 弊 |
|---|---|---|
| **A. 用 LIFF（LINE 內開）** | 消費者不用切出 LINE、體驗順 | 開發複雜度 +30%、要過 LINE 審查 |
| **B. 普通網頁連結** | 開發快、相容性好 | 消費者要切瀏覽器，跳出率較高 |

**為什麼必須現在決定**：影響前端架構（React+Vite 還是 Next.js）+ Epic 9 報價確認流程。

**Tech Lead 建議**：B 普通連結（V1.0），等 V1.0 跑穩再評估升級 LIFF。

✅ **業主決定（2026-05-22）：A 採用 LIFF**（體驗較好）

⚠️ **本答案有未決依賴（需追問，見文末「Q3 Follow-up」）**：
> 「工單系統是外部開發，不確定怎麼整合」

需釐清：
- 「外部開發的工單系統」是什麼？甲方既有 ERP 還是另一個 vendor 開發中？
- LIFF 要顯示什麼？（報價確認 / 進度查詢 / 完工簽收 / 全部？）
- LIFF 後端走我們 V1.0 系統還是直連外部工單系統？
- 資料同步：兩個系統的 ProblemCard / WorkOrder 怎麼合一？

**設計層面影響**：
- 若 LIFF 直連外部工單系統 → V1.0 規範要寫 outbound API contract（誰先誰後？）
- 若 LIFF 走 V1.0 → V1.0 系統要自己做工單 mini-CRUD（與外部系統 reconcile 怎麼處理？）

---

### Q4. 外部知識傳承平台叫什麼？API 規格？（ADR-0058 缺料）

**問題**：5/22 會議您提到「我們有一套平台專門做知識傳承，到時候導入 AI Agent」—— 請提供：

1. **平台名稱**：_______________________
2. **平台 URL / 帳號**：_______________________
3. **是否有 API / Webhook**：☐ 有　☐ 無　☐ 不確定
4. **平台聯絡窗口**（如需技術對接）：_______________________

**為什麼必須提供**：ADR-0058「外部知識傳承平台 → AI Agent ingestion contract」要寫實作規格，必須先知道資料怎麼進來。

如果業主說「先不接，等 V2 再說」也 OK，請明確回答：☐ 確認 V1.0 不接，ADR-0058 延後到 V2

✅ **業主答覆（2026-05-22）**：
- **平台名稱**：**AEOS platform**
- **API**：**還沒定，先採離線作業**（即人工從 AEOS 匯出 → 人工匯入 SOP 庫）
- **影響**：ADR-0058 簡化為「offline batch ingestion」模式，不需要 API webhook / realtime gateway
  - V1.0 落地：手動 CSV / Markdown 匯入 → 走 ADR-0038 雙審 / 單審
  - V2+ 規劃：等 AEOS API 定義後升級為 online ingestion gateway

---

## 🟡 中後期 — V1.0 上線前要決定（3 件，可緩 1-2 個月）

### Q5. 記帳憑證要符合哪個會計軟體格式？（原 Q-008，W19）

**問題**：月結時系統要產出對帳檔給會計，這個檔案要相容哪個會計軟體？

**請業主與會計確認**：
- 目前使用的會計軟體：_______________________（例：用友、金蝶、SAP、自製 Excel）
- 需要的匯出格式：☐ Excel ☐ CSV ☐ 該軟體特定格式（請附範例檔）
- 對帳檔包含哪些欄位（請列）：_______________________

**為什麼可緩**：Epic 10 帳務在 W19 才啟動。但建議 W10 前回，留時間設計欄位。

⏸ **業主答覆（2026-05-22）：TBD**（延後到 W10 前再回）

---

### Q6. 消費者怎麼付款給師傅？（原 Q-009，W19）

**問題**：師傅收完工後，消費者怎麼付錢？

| 選項 | 利 | 弊 |
|---|---|---|
| **A. 現場現金 / 轉帳（線下）** | 簡單、無金流費用 | 沒收到錢的爭議多、對帳要手動 |
| **B. 系統產生付款連結（線上）** | 自動對帳、有金流憑證 | 要串第三方金流 + 手續費 2.5-3% |
| **C. 兩者並行（消費者選）** | 涵蓋所有場景 | 開發成本最高 |

**為什麼可緩**：Phase II Finance（V2.0）才啟動。但合約已寫 V1.0 階段消費者可由 LINE 確認付款方式，建議 W12 前回。

✅ **業主答覆（2026-05-22）：三種付款方式並存**：
1. **現金**（師傅現場收）
2. **刷卡**（師傅 mobile POS 或店家結帳）
3. **匯款**（消費者轉帳後回報帳號**後 5 碼**，客服比對對帳）

**設計層面**：
- 不需串第三方金流（無 Stripe / TapPay 等）
- 系統需新增「等待匯款驗證」WO state
- 客服需有「匯款 5 碼比對 UI」+ audit log
- 三種付款方式對應不同 Settlement ledger entry（per ADR-0040 / ADR-0041）

---

### Q7. IoT 智慧鎖訊號接入 — 哪一家鎖廠商先試？（ADR-0059）

**問題**：5/22 您提到「電子鎖狀態訊號透過 App 串到 AI 客服」是護城河關鍵。要先跟哪一家鎖廠商做 PoC？

**請提供**：
- 候選廠商名稱（排序）：_______________________
- 該廠商是否已開放 API / SDK：☐ 已開放　☐ 需談合作　☐ 不確定
- 預計 PoC 啟動時間：☐ V1.0 同步　☐ V1.0 後 3 個月內　☐ V2.0 才開始

**為什麼可緩**：ADR-0059 已標 V2+ Roadmap，V1.0 不阻擋。但建議 W6 前選定，方便提前談 API。

✅ **業主答覆（2026-05-22）：chatlock**

**接下來行動**：
- 業務 / BD 聯繫 chatlock 取得 API / SDK 規格
- 走 ADR-0056 廠商合約附件規格的 6 步接入流程
- 完成後更新 ADR-0059 的 PoC 廠商欄位 + 具體 event schema

---

## ✅ 架構定位（r3 校正後 — 2026-05-22）

> ⚠️ **r2 曾誤判「工單平台 = master system，我們 = satellite」，r3 業主澄清後撤回**。
> 正確版本如下：

### 三方角色

| 角色 | 是誰 | 職責 |
|---|---|---|
| **我們** | 開發團隊 | 開發完整的 **客服機器人 + 工單系統 SaaS** 平台 |
| **ChatLock** | first 目標客戶（**LOI 階段**）| 賣鎖的代工廠起家、軟硬體自研；同時是 **first 客戶 + first IoT 鎖供應商**，**雙身份合一**為單一 partner entity |
| **AEOS** | 知識傳承平台 vendor | 提供 domain expert 知識，**離線批次匯入**到我們 SOP 庫 |

### V1.0 完整 Scope（所有 29 條 ADR 假設正確，**無需 revisit**）

✅ **要做的（完整 SaaS）**：
1. LINE Bot 接入 + 對話管理
2. AI 客服（ProblemCard 收集 + 三層解決 L1/L2/L3）
3. 知識庫 / RAG（per ADR-0057）+ SOP 螺旋（AEOS 離線批次 per ADR-0058）
4. **工單系統 + Admin Panel + Web**（V1.0 Epic 5 per ADR-0042 RBAC）
5. LINE Flex Message 模板（取代 LIFF）+ deeplink 跳我們的 Admin Panel
6. AI 行為 charter / Forbidden / Eval pipeline（ADR-0028 / 0047 / 0055 / 0057）
7. 情緒分流（合約 4.4(a)）+ 推播給客服
8. **客服系統**（在 Admin Panel 內，含 ProblemCard view + **通話錄音 audit** + audit log）
9. 派工 / 帳務 / 退款 / 月結（V2.0 per PRD-0001 Epic 7-10）
10. **多租戶 essentials**（per ADR-0030 / ADR-0043，雖然 V1.0 first tenant 是 ChatLock）
11. **ChatLock IoT 鎖訊號接入**（per ADR-0059，因 ChatLock 雙身份）
12. Evidence retention + Family Reviewer（per ADR-0050 / 0051 / ADR-0042）

❌ **不在 V1.0 scope**（per PRD）：
- LIFF（業主決議取消，改 LINE Flex Message）
- 線上金流串接（Q6 採現金 / 刷卡 / 匯款 5 碼比對）
- 多語言（合約 SOW Out of Scope）

### 對既有 29 條 ADR 的影響

✅ **無需 revisit**。r2 那份「12 條 ADR 失效」清單**已作廢**。所有 29 條 ADR 原假設與 r3 校正後架構一致。

### r3 業主新答覆（解鎖最後 3 件）

| Follow-up | 業主答案 | 影響 |
|---|---|---|
| **F2.1 通話 audit** | ✅ **B 錄音** | 通話自動錄音 + STT 摘要 + 寫回 ProblemCard。需新開 **ADR-0060「通話錄音 + audit 機制」**。PII 風險（需消費者通話前同意）+ 儲存成本需設計 |
| **ChatLock 銷售階段** | ✅ **LOI（意向書）** | 可拿 ChatLock 做 alpha tester / 需求對齊，但合約細節 still negotiating。V1.0 設計**不可寫死 ChatLock 特性**，必須 generic 多租戶 |
| **ChatLock 雙身份合一** | ✅ **單一 entity**（customer + locks_vendor）| ChatLock 是代工廠起家、軟硬體自研，雙角色由同一 partner 提供。ADR-0043 Contract Template + ADR-0056 廠商合約附件 schema 採 `partner_roles: [customer, locks_vendor]` 而非分兩筆 |

---

## 🗑 Q8「工單平台」追問（已作廢）

> r2 一度誤判工單平台為外部系統，列出 F8.1~F8.4 追問題。r3 業主澄清：
> **工單平台是我們自己開發的，ChatLock 是客戶。本 Q8 整段追問作廢。**

歷史紀錄保留於 r2 git commit（`1318755`），供日後 audit。

---

## 🔁 原 Follow-up Questions（部分已答覆）

### Q2 Follow-up：電話轉接的 audit 與 context 設計 ✅ 大部分已答（2026-05-22）

業主補答：
- ✅ **通話是透過手機**（客戶直接撥客服私人 / 公司手機）
- ✅ **F2.2 客服接電話時，可從工單平台看到 ProblemCard**
- ✅ **F2.3 客服系統和工單平台是同一個**
- ✅ **F2.4 「外部網站」= 工單平台**

剩餘待釐清：

#### F2.1 通話 audit 的層級？（未明確答）

合約 4.4(a) 規定負面情緒識別 ≥ 90% 觸發後需通知 + audit。目前設計接電話會「斷掉 audit」，請業主選：

| 選項 | 做法 | 利 | 弊 |
|---|---|---|---|
| **A. 不錄音，僅留通話 metadata** | 系統只記「客戶 X 在時間 T 撥打電話給客服 Y，通話 X 分鐘」 | 簡單、不踩個資紅線 | 通話內容無法稽核，合約 4.4(d) Family Reviewer 看不到實際對話 |
| **B. 錄音 + 自動轉文字** | 通話自動錄音上傳 + Speech-to-Text 摘要 | 完整 audit、Family Reviewer 可覆核 | 需消費者同意錄音、儲存成本高、PII 風險高 |
| **C. 客服通話後手動補摘要** | 客服掛電話後在客服系統填 5 分鐘摘要 + 結論 | 中庸、合規可過 | 客服多 5 分鐘工作量 / 摘要可能漏內容 |

**Tech Lead 建議**：給定客服在工單平台已能看 PC，最自然的 audit 路徑是 **C 客服掛電話後在工單平台填通話摘要 + 結論**。這也符合合約 4.4(d) Family Reviewer 覆核需求。

✅ 業主請確認：☐ A 僅 metadata　☐ B 錄音（手機通話需另外方案）　☐ C 客服寫摘要（建議）

---

### Q3 Follow-up：LIFF 變更 — ✅ 業主決議：**取消 LIFF，改用 LINE Flex Message + 工單平台**

業主決議：**不做 LIFF，所有 UI 走 LINE Flex Message + 連結到工單平台**。

設計影響：
- 報價確認、進度查詢、完工簽收等 → LINE Flex Message 渲染
- 點擊「查看詳情」按鈕 → 跳工單平台網頁
- 客戶不需要安裝 / 註冊 LIFF
- 前端複雜度大幅降低
- 但需要：**Flex Message 模板 + 工單平台 deep link contract**

---

## 📋 全部答覆後狀態速覽（r3 最終版）

| # | 業主答覆 | 狀態 | 阻擋 |
|---|---|---|---|
| Q1 部署 | ✅ GCP 雲端 | 落地 | 無 |
| Q2 真人轉接 | ✅ LINE → 我們 web → 撥客服手機 + 錄音 | 落地 | 無 |
| Q3 LIFF | ✅ 取消，改 LINE Flex | 落地 | 無 |
| Q4 知識平台 | ✅ AEOS 離線批次 | 落地 | 無 |
| Q5 會計軟體 | ⏸ TBD | 延後 W10 前回 | V1.0 後期才阻擋 |
| Q6 付款 | ✅ 現金 / 刷卡 / 匯款 5 碼 | 落地 | 無 |
| Q7 + Q8 ChatLock | ✅ first customer LOI + 雙身份合一 | 落地 | 業務需取 LOI 細節 |
| F2.1 | ✅ B 錄音 | 落地 | 待開 ADR-0060 |

**全綠燈**。V1.0 可立即進入 P3 Design 階段。

---

## 🎯 下一步 Action Items（r3 最終版）

| # | Action | Owner | 觸發 |
|---|---|---|---|
| 1 | ADR-0058 更新為「AEOS offline batch ingestion」 | Claude | 立即 |
| 2 | ADR-0059 PoC partner 寫入 ChatLock + 註記雙身份 | Claude | 立即 |
| 3 | 新開 **ADR-0060「真人轉接電話 + 錄音 audit 機制」** | Claude | 立即（F2.1 已答 B 錄音）|
| 4 | ADR-0043 / ADR-0056 加 `partner_roles: [customer, locks_vendor]` schema | Claude | 立即 |
| 5 | PRD-0001 + ARCH-0001 加 GCP 部署 + ChatLock LOI customer 定位 | Claude | 立即 |
| 6 | 業務 / BD 取 ChatLock LOI 簽署文件 + 啟動需求對齊 alpha test | 業務 | W1 內 |
| 7 | 啟動 **P3 Design** — Epic 2 ProblemCard OpenAPI + ERD（首切片）| Claude | **立即**（不阻擋）|
| 8 | r2 那段「12 條 ADR 失效」誤判內容**已撤回作廢** | Claude | 已完成 |

---

_本檔狀態：Q1/Q4/Q6/Q7 已落地，Q2/Q3 follow-up 待業主補答。完整脈絡見 [`../../0-strategy/PAIN-POINTS-SUMMARY-2026-05-21.md`](../../0-strategy/PAIN-POINTS-SUMMARY-2026-05-21.md) 與 [`ACTION-ITEMS-2026-05-22.md`](./ACTION-ITEMS-2026-05-22.md)。_

---

_本檔由 Claude 整理自 PRD-0001 §5.2 / ADR-0058 / ADR-0059 / PAIN-POINTS Pre-mortem 排程。完整脈絡見 [`../../0-strategy/PAIN-POINTS-SUMMARY-2026-05-21.md`](../../0-strategy/PAIN-POINTS-SUMMARY-2026-05-21.md) 與 [`ACTION-ITEMS-2026-05-22.md`](./ACTION-ITEMS-2026-05-22.md)。_
