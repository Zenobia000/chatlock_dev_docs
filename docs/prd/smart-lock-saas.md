# PRD — 智慧鎖 AI 客服與派工平台

> **狀態**：v2.2 frozen，給開發團隊接手（OQ 全 closed）
> **更新**：2026-05-24
> **負責人**：PM
> **版本**：v2.2（吸收 2 場 roundtable owner verdict — Option A 降級履約 + Voucher keeper 路線）

---

## 📋 一頁讀完（業主 / PM 主看這段）

> **30 秒摘要**：把電子鎖售後從「靠老師傅腦袋」變成「LINE 進來、AI 接、結構化資料、可分潤」。V1.0 上線 AI 客服（W17）、V2.0 接上派工帳務（W31）。一句話爭議：**AI 不能亂承諾，合約紅線一條都不能破**，這兩件 V1.0 內必須做完。

| 維度 | 結論 |
|:---|:---|
| **這次解什麼問題** | 售後服務沒人標準化，新客服要訓幾個月、對帳要吵半個月、派錯案件就賠錢 |
| **使用者是誰** | LINE 上的消費者（V1 同時 50 人 / V2 100 人 / 3-5 年 30 萬戶）/ 簽約師傅（V2 目標 500 人 / 22 縣市）/ 客服 + 管理員 / 家族覆核員（合約規定的稽核角色）|
| **要做到什麼** | AI 準確率 ≥ 80% · 自助解決率 ≥ 60% · 接單 SLA 10/5 分 · 系統不掉線 95% |
| **最大風險** | 合約 4.4 條沒過 → 甲方可終止合約 → 現金流斷。這條 V1 必交 |
| **下一步** | 開發團隊接手 `specs/smart-lock-saas/handoff.md` |

---

## 🎯 為什麼要做這個

**現況**：客服全靠老師傅。LINE 訊息湧進來，人工一條一條問品牌、型號、地址，問完還要紙本記、Excel 對帳、電話催收。新人要 3 個月才上手，師傅、客戶、品牌方一個月吵一次帳。

**做了能省什麼**：
1. 自助解決率拉到 60%，客服人力直接省 60%
2. 月結對帳從 3 天降到 4 小時
3. 第二個甲方來簽約時，不用重寫系統（多甲方架構先做）
4. SOP 沉澱到平台，老師傅離職也帶不走 know-how

**不做會死什麼**：
- **合規崩潰**（最大）：合約 4.4 條規定情緒識別 ≥ 90% / 個資保留期 / 家族覆核紀錄，這些沒做 → 甲方可依合約終止
- **AI 越權**：AI 哪天答應客人「免費保固」，截圖一傳，品牌就賠
- **資料沒沉澱**：3 年後資料都是 raw log，被大廠 vertical agent 取代

---

## 📊 KPI 怎麼衡量

> 全部都要可量化、有觀測週期、有副指標（counter-metric）防 gaming。

| 編號 | 指標 | 目標 | 怎麼量 |
|:---|:---|:---|:---|
| **K1** | AI 準確率 | ≥ 80% | 50 題標準集（甲方提供），UAT 跑一次 + 每月回歸 |
| **K2** | 自助解決率 | ≥ 60%（上線 3 個月後） | 看對話日誌，分母排除急件硬轉真人；W8 量基準線、上線前重校 |
| **K3** (v2.2 改 counter-metric) | 家族覆核履約 — 改 event log 不阻擋 + retrospective dispute | event log 完整率 ≥ **95%** + retrospective dispute rate ≤ **3%** | 合約 4.4(d) 履約方式詮釋（不需修約）；每週 BI |
| **K4** (v2.2 V1 移除) | ~~問題卡完整率~~ | ~~≥ 85%~~ | V2 才量；V1 OQ-NEW-3 第二甲方延後，K4 跟著延 |
| **K5** | 接單 SLA | 10 分 / 急件 5 分，達成率 ≥ 95% | 即時監控 |
| **K6** | AI 首次回應 | 5 秒內 p95 | RUM + APM |
| **K7** | 系統 Uptime | ≥ 95%（合約）/ 99.5%（內部目標）| 30 天 rolling |
| **K8** | AI 不該做的事 Eval | ≥ 95% pass，否則禁止部署 | 200 題 corpus（**Domain Expert 出題**）每次 deploy 跑 |
| **K9** | 同時在線 | V1 50 / V2 100 | 壓測 |
| **K11** (v2.2 新) | 月結匯出退件率 | ≤ **5%**（甲方會計收到匯出檔的退件率）| V2.1 export endpoint 上線後每月量 |

**Counter-metric**（防 KPI 被 gaming）：
- **C1**：AI 違反禁區次數 < 1 / 萬次對話
- **C2**：AI 主動轉真人率 ≤ 25%（**用程式判定，不是 AI 自己標**；K2 算 60% 不能靠減少硬轉真人來灌水）
- **C2b**：K1 漂移警報——AI 準確率單日 < 79% 立刻 page，連兩天觸發 rollback
- **C2c**：客戶放棄率 ≤ 8%（防 AI 拖延讓客人 48h 自動結案 gaming）
- **C3**：個資刪除請求 ≤ 7 天完成
- **C4** (v2.2 新)：voucher hash mismatch 0 / 月（任何 mismatch = 帳本不可信 = 立即 incident）

> [!IMPORTANT]
> K1, K3, K8 是合約承諾值。UAT 沒過 = V1 不能交付。
> K3 從原「同步阻擋負面情緒識別 ≥ 90%」改為「event log 完整率 + dispute rate」**雙計法**，是 Option A 降級履約 cascade 的結果。**負面情緒識別本身仍 ≥ 90%**（在 FR-NEW-8 acceptance 維持），只是 family review 路徑改 retrospective。

---

## 🎯 範圍：做什麼 / 不做什麼

### ✅ V1.0（W1-W17）做這些

**必做（合約紅線 / 上線必備）**：
- LINE Bot AI 客服（文字、圖、對話記憶、情緒分流）
- 自動產問題卡（含主動引導補資訊）
- 三層解決機制（案例庫 → 手冊 RAG → 轉真人）
- 後台管理（知識庫、對話監看、儀表板、RBAC 四層權限）
- 合約 4.4 整套（90% 情緒識別、家族覆核員、個資保留期）
- 多甲方架構先打底（合約模板 schema + API，UI 延 V2 — 細節見折疊區）
- AI 禁區的 200 題 Eval pipeline（沒過就不准 deploy）

**延後（不影響上線）**：
- **Epic 4 自進化知識庫** → **升回 V1**（v2.2 業主裁決）。理由：OQ-NEW-1 + OQ-NEW-3 砍掉省的 capacity 挪過來，Family Reviewer 改 retrospective（不再卡 SOP 螺旋）。
- **家族覆核** → **降級履約**（Option A）：改 event log 不阻擋 + 7 日 retrospective dispute window。BA 主導法務一頁式詮釋備忘證明「retrospective review = 覆核紀錄」（不需修約）。
- **第二甲方** → **延後**（OQ-NEW-3）：ADR-0060 schema reserved nullable + 對外 API 砍；V2 重啟 ~3-5 天。
- **FR-0012 月結** → **加 voucher**（V1 內部憑證 schema + read API + void 流程）；export endpoint 延 V2.1（OQ-007 cascade）。

### ✅ V2.0（W18-W31）做這些

- 師傅 Web App（案件池、接單、ETA、完工報告、帳戶中心）
- 智慧派工（自動匹配 + 手動指派）
- 報價引擎（標準矩陣 + 特殊加價）
- 帳務系統（7 帳本、墊款追蹤、月結、退款分層）
- Admin V2.0（案件全生命週期、客訴、技師管理、變更請求工作流）

### ❌ 不做（避免 scope creep）

| 不做 | 原因 |
|:---|:---|
| 多語言 | V1/V2 繁中為主，schema 預留 locale，海外擴張再開 |
| 消費者 App | LINE 為主管道，不另開 App |
| 線上金流 | 付款線下處理，未來再評估 |
| 技師 GPS 即時追蹤 | 只記出發 / 到達時間 |
| 庫存管理 | 師傅自管 |
| 消費者評分系統 | 未來規劃 |
| 語音對話 | 只支援文字 + 圖 |
| **AI 影像辨識** | **合約 SOW 2.1(4) 明文禁止**，圖只當附件存 |
| **AI 給 final quote / 折扣 / 免費保固** | **永禁**，只能給範圍價 |
| **AI 直接開工單** | 永遠要客服 1-click 確認 |
| **跨租戶資料可見** | tenant_id 強制隔離 |
| V1 完整多租戶 | V1 單一甲方，schema 預埋租戶欄位但不開放第二租戶 |

---

## 👥 使用者場景

**消費者**（量大但個體影響小）→ LINE 報修 → AI 對話 → 自助解決 / 或派工 → 確認結案
**簽約師傅**（生態關鍵）→ 接單 → 到場 → 拍照 → 完工報告 → 月結
**客服**（人不多但天天用）→ 監看異常 → 處理 escalation → 審 SOP
**家族覆核員**（合約規定）→ SOP 雙審第二關，24 小時內審完

**關鍵 edge case**（這幾條最會出事）：
- 急件 4 類（被鎖門外 / 門內受困 / 安全風險 / 怒客）→ 5 分鐘強制轉真人
- 地址沒填齊 → 派工不擋，但結案前一定要回填（系統強制）
- AI 想說 final quote / 折扣 / 免費保固 → 自動攔截 + 重講
- 同對話多個問題卡 → 一個 active issue 一張卡，新症狀 / 新設備可另開
- 第二個甲方來簽約 → 不能改 code，走合約模板設定就行

---

## ⚠️ 風險清單

| 編號 | 風險 | 嚴重度 | 怎麼擋 |
|:---|:---|:---|:---|
| **R-F4** | **合規崩潰** — 4.4 / 個資沒做 → 甲方終止合約 | 🔴 最高（V1 必交）| 4.4(a) 90% 跑 UAT；4.4(d) 家族覆核員 100%；個資刪除 7 天執行 |
| R-F3 | AI 越權承諾 | 🟡 中 | 200 題 Eval block deploy + 程式判定硬規則（不靠 AI 自報）|
| R-F1 | 3 年後資料只是 log，被大廠取代 | 🟡 中 | Bronze 資料 V1 先收齊；Silver/Gold ETL Phase 0+ 排程 |
| R-F2 | 換 LLM 廠商等於重寫 SOP | 🟡 中 | SKILL 跟 LLM 解耦（已立 ADR）；規則走 RAG 不寫 prompt |
| R-F5 | 第二甲方來要重寫系統 | 🟡 中 | tenant_id / brand_scope / locale 一級欄位；合約模板物件化 |
| R-F6 | 老師傅離職帶走 know-how | 🟡 中 | SOP 螺旋 + 外部知識傳承平台接入 |
| R-F7 | 大廠出 vertical agent 取代我們 | 🟡 中 | 護城河三柱：師傅生態 + 物理證據 + 合約履約 |
| R-001 | LLM API 費用爆預算 | 🟡 中 | 速率限制 + 月度上限 + Embedding cache + Model Routing |
| R-005 | 消費者描述模糊，AI 抓不到問題卡 | 🟠 高頻 | 漸進引導 + 主動照片引導 |
| R-NEW-1 | 家族覆核員審不過來變瓶頸 | 🟡 中 | 高低風險分流：高風險雙審 / FAQ 單審 + 缺席 fallback |

---

## ✅ 已答完的問題（OQ — Open Questions Closed）

> 全部 11 條 OQ 於 2026-05-24 業主裁決 closed。詳見 2 場 roundtable MoM。

| 編號 | 問題 | 答案 | 來源 |
|:---|:---|:---|:---|
| OQ-001 | 向量資料庫 | ✅ **pgvector**（ADR-0002 升 accepted）| 業主裁決 2026-05-24 |
| OQ-003 | 部署環境 | ✅ **GCP**（ADR-0005 升 accepted）| 業主裁決 2026-05-24 |
| OQ-004 | 人工轉接 | ✅ **提供連結，客戶點擊撥接客服**（取代 FR-0018 內建 chat 設計）| 業主裁決 2026-05-24 |
| OQ-007 | 記帳憑證 | ✅ **先行定義 — Platform = keeper / retention 7y**（詳見 ADR-VCH-001/002 + MoM #2）| roundtable #2 |
| OQ-008 | 付款方式 | ✅ **現場 + 繳費連結 + 匯款**（FR-0011 拆 3 story）| 業主裁決 2026-05-24 |
| OQ-009 | LINE LIFF | ✅ **不做** | 業主裁決 2026-05-24 |
| **OQ-NEW-1** | **家族覆核員** | 🔁 **先不考慮 → 採 Option A 降級履約**（event log 不阻擋 + 7 日 retrospective dispute window）。BA 主導法務一頁式詮釋備忘證明「retrospective review = 覆核紀錄」，不需修約 | roundtable #1 + 業主裁決 |
| **OQ-NEW-2** | **個資法規** | ✅ **同時符合 GDPR + 個資法**（BR-PII-001 已 dual-regime）| 業主裁決 |
| OQ-NEW-3 | 第二甲方 onboarding | ✅ **先不考慮**（ADR-0060 schema reserved nullable / 對外 API 砍 / V2 重啟 ~3-5 天）| roundtable #1 + 業主裁決 |
| OQ-NEW-4 | AI Forbidden 200 題 corpus | ✅ **從 Domain Expert 來**（QA + Domain Expert 共同 ownership）| 業主裁決 |
| OQ-NEW-5 | IoT 訊號 | ✅ **V3 deferred**（ADR-0059 status = deferred）| 業主裁決 |
| **OQ-NEW-6** (新) | 為何 OQ-007 此刻先行定義？ | ✅ **D 純清 OQ-007**（無外部 deadline），但 keeper schema 路線確認啟動 | roundtable #2 業主裁決 |

> [!NOTE]
> Q1=D 表示「沒外部時程壓力」— A1 三方 sign-off matrix 可放寬到 V2 sprint planning 前，不必硬卡 W18。

---

## 🚀 上線計畫

| 項目 | 內容 |
|:---|:---|
| **V1 怎麼上** | W13-W15 UAT（合約 4.4 驗收）→ W16 灰度 10% → W17 全量 |
| **V2 怎麼上** | W30 灰度 10% → 50% → 100%，師傅平行運轉舊流程 2 週 |
| **時程** | V1：W17（2026-Q2 末）/ V2：W31（2026-Q3 末）|
| **監控什麼** | KPI K1-K9 全 Dashboard + 4.4 合規即時監控 |
| **什麼狀況要 rollback** | K1 < 70% / K8 < 90% / Uptime < 90% / 合約 4.4 UAT 不過 / 個資外洩 |
| **誰決定 rollback** | DevOps on-call 執行 + PM 決策 + Tech Lead 技術判斷 |
| **緊急開關** | 三層 kill switch：全域 / 單一 AI 員工 / 單一 SKILL |

---

## ✍️ 簽核

- [x] **PM**：devteam-pm autonomous / 2026-05-22
- [x] **業主（CEO autonomous mode）**：xdxd2455789@gmail.com / 2026-05-22
- [x] **Review**：[`reviews/Gate1_PRD-smart-lock-saas-2026-05-22.md`](../../.claude/context/devteam/reviews/Gate1_PRD-smart-lock-saas-2026-05-22.md) + 3 場 forum final report
- [x] **PO**（Forum F-01）：accept Option C++ + Epic 4 → V1.5 / 2026-05-22
- [x] **Lane B Forum**：3/3 收斂 / 2026-05-22
- [x] **Gate 1 狀態**：🔒 frozen（2026-05-22）

---

<details>
<summary><strong>📦 技術 Appendix（開發 / 架構 / QA 看的）</strong> — click to expand</summary>

> 以下內容給開發團隊、架構師、QA 用。業主 / PM 主要決策不在這層。

### A. Functional Requirements 明細

> 完整 40 個 user stories（US-001~US-040）見 [`PRD-0001 v1.1 §3`](../../archive/prd-baseline/PRD-0001-2026-q1-v1-launch.md#第-3-部分使用者故事與允收標準-user-stories--uat---做什麼)；25 個 FR 規格見 [`../../docs/analysis/fr/`](../../docs/analysis/fr/)。

| FR ID | 內容摘要 | 優先級 | 對應 ADR |
|:---|:---|:---:|:---|
| FR-0001 | LINE intake（webhook / 多媒體 / Quick Reply）| P0 | — |
| FR-0002 | ProblemCard（自動生成 / completeness ≥ 0.85 gate）| P0 | ADR-0033, ADR-0036 |
| FR-0003~0010 | 派工、接單、ETA、現場、完工 | V2 | ADR-0045, ADR-0049 |
| FR-0011~0015 | 報價、月結、雙簽、退款、保固 | V2 | ADR-0040, ADR-0041, ADR-0044 |
| FR-0017 | SOP 自動生成 / 雙審 / 發布 | V1.5 | ADR-0038 |
| FR-0018 | 三層解決 + 轉真人 7 條硬規則 | P0 | ADR-0048 |
| FR-0019 | RBAC 動態（4 層 + 後台設定）| P0 | ADR-0042 |
| FR-0021 | 儀表板 / BI / KPI | P1 | — |
| FR-0024 | LINE webhook HA（retry / DLQ / 24h dedup）| P0 | ADR-0029 |
| FR-0025 | 多模態理解（文字 + 圖 + 位置，圖不做 AI 辨識）| P0 | 合約 SOW 2.1(4) |
| **FR-NEW-1**（v2.1）| **個資保留 engine via DGS + OPA Policy Artifact**：（a）BR-PII-001 (Rego) 版本化 + 法務 / DPO CODEOWNERS + DGS 啟動 hash-check + policy_version_id 入 audit。（b）兩階段清除：T0 銷毀加密金鑰 + 軟刪 → T+30 天硬刪。（c）cron = 候選掃描器 / DGS = 唯一執行者 + advisory lock + transactional outbox。（d）GDPR 7 天含 customer notice（若 legal-hold 衝突）| P0-critical | ADR-0051 + ADR-0061 + Forum F-04 |
| **FR-NEW-2**（v2.2 修）| **合約模板 Schema 預埋 only（V1 對外 API 砍）**：（a）Schema 凍結 + 多 partner 欄位 nullable reserved（OQ-NEW-3 第二甲方延後，schema 留結構但不開放）。（b）內部 admin form 仍保留（單一甲方 ops 用）。（c）對外 API 砍，V2 重啟僅 ~3-5 天（schema 已就緒）。原 (a)-(e) 規格在 V2 重啟時生效 | **V1 P0-launch (schema only)** / V2 重啟 P0 | ADR-0043 + **ADR-0060 (v2 update)** + Forum F-01 + MoM #1 |
| **FR-NEW-3**（v2.1）| **AI Forbidden 200 題 Eval pipeline**：pass < 95% block deploy；corpus 來源 mixed（人工 + 歷史挖掘）；W4 baseline 60 題、W8 full 200 題 | P0-critical | ADR-0047 |
| **FR-NEW-4**（v2.1）| **ChangeRequest 物件化 workflow**：政策 / 價格 / 權限 / SLA / 模板 / 合約 instance 變更走 申請 → 核准 → 生效日 → audit；先於 FR-NEW-2 audit hook | P0-launch | ADR-0046 |
| **FR-NEW-5**（v2.2 修為 event-only）| **家族覆核 event log（不阻擋流程）**：（a）event log append-only + hash chain（沿用 purge_audit_ledger 模式）含 actor / timestamp / decision payload。（b）7 日 retrospective dispute window（家族覆核員可事後 dispute）。（c）合約 §4.4(d) 履約方式詮釋 = retrospective review event log（法務一頁式備忘證明，不需修約）。（d）BA + PM 共同 ownership | **V1 P0-critical**（履約紅線從同步阻擋改 retrospective） | BR-AUDIT-007 + ADR-0050 + 法務備忘 + MoM #1 |
| **FR-NEW-6**（v2.1）| **Evidence visibility matrix V1（屬性過濾延 V2）**：（a）V1 = 角色 × 案件生命週期 過濾。（b）Fail-closed 三層：mutation full deny / read flagged full deny / read unflagged last-known-good + X-Policy-Cache-Stale header。（c）V2 加屬性過濾 | P0-critical | ADR-0050 + ADR-0061 |
| **FR-NEW-7**（v2.1 new）| **Security guardrail bundle (US-018~020)**：（a）Prompt Injection 攔截率 ≥ 95%。（b）內容過濾誤攔率 < 1%。（c）Output Guardrail 限定電子鎖話題。三者整合 deterministic rule engine 寫入 rule_triggered_by（防 AI gaming C2）| P0-critical | ADR-0028 + Forum F-02 |
| **FR-NEW-8**（v2.1 new）| **負面情緒識別 + 主動照片引導 (US-038~039)**：（a）4.4(a) 90%，產線持續監控（每週 N=100 LLM-judge + 每月人工 audit；連續 2 週 < 88% block / 4 週 < 85% incident）。（b）US-039 PC < 0.85 時 LINE Flex Message 引導。圖片僅 attachment（SOW 2.1(4)）| P0-critical | ADR-0034 |
| **FR-NEW-9**（v2.1 new）| **Image content moderation gate（SOW 2.1(4) 反向強制）**：webhook 入口攔截任何 image-to-text vision API call，pre-commit + runtime double-gate，violation count = 0；列入 Eval 200 題的一個 category | P0-critical | ADR-0047 |

### B. NFR / 技術約束摘要

完整見 [`../architecture/nfr-matrix-smart-lock-saas.md`](../architecture/nfr-matrix-smart-lock-saas.md)。

- 通訊加密 HTTPS / TLS 1.2+；資料加密 AES-256 at rest；認證 JWT + Refresh Token
- LINE webhook ≥ 99.9% success（含 retry / DLQ）
- DGS service availability ≥ 99.95%（合規 audit 獨立性）
- snapshot cache 雙軌：retention/visibility 60s TTL OK；legal-hold/forget push invalidation ≤ 5s
- 後端測試覆蓋率 ≥ 70%；WCAG 2.2 AA（Web App）/ LINE 原生 a11y
- SKILL ↔ LLM 解耦（vendor swap < 5 天）

### C. Decision Log（37+ ADR 對 PRD 影響最重要）

| ID | 主題 | 狀態 |
|:---|:---|:---:|
| ADR-0001~0030 | Backend / DB / LLM / LINE / Frontend 等 baseline 技術選型 | ✅ accepted |
| ADR-0028 | AI Employee Charter（Forbidden 集中）| ✅ accepted |
| ADR-0029 | Fail-soft to durable three-pack | ✅ accepted |
| ADR-0030 | Tenant ID propagation | ✅ accepted |
| ADR-0031 | AI 1-click 人審才能 convert_to_work_order | ✅ accepted |
| ADR-0032 | 地址政策（派工不擋 / 結案 422 hard gate）| ✅ accepted |
| ADR-0033 | PC completeness ≥ 0.85 gate | ✅ accepted |
| ADR-0034 | Urgent / Red Code 4 類具名 | ✅ accepted |
| ADR-0035 / 0054 | AI 報價只給 range，永禁 final | ✅ accepted |
| ADR-0038 | SOP 雙審（高風險）/ 單審（FAQ）| ✅ accepted |
| ADR-0039 | 取消費 5 階段 + 全階段客服可覆寫 | ✅ accepted |
| ADR-0040 | 退款依責任歸屬分層 5×3 | ✅ accepted |
| ADR-0041 | 車馬費 80/20 + 距離級距 | ✅ accepted |
| ADR-0042 | RBAC 4 層固化 + 後台 configurable | ✅ accepted |
| ADR-0043 | Contract Template + tenant scope | ✅ accepted |
| ADR-0044 | Device warranty_start_mode 5 模式 | ✅ accepted |
| ADR-0045 | 師傅接單 SLA（10/5 min + per-brand override）| ✅ accepted |
| ADR-0046 | ChangeRequest workflow | ✅ accepted |
| ADR-0047 | AI Forbidden 集中 + 200 題 Eval block deploy | ✅ accepted |
| ADR-0048 | AI 轉真人 7 條硬規則 | ✅ accepted |
| ADR-0049 | 現場 scope change 三件套 + 金額分層 | ✅ accepted |
| ADR-0050 | Evidence visibility matrix | ✅ accepted |
| ADR-0051 | Evidence retention 分層 | ✅ accepted |
| ADR-0052 | Material owner 三選一 | ✅ accepted |
| ADR-0053 | Serial 強制（主鎖 + >1000 高價）| ✅ accepted |
| ADR-0055 | SKILL ↔ LLM 解耦 | ✅ accepted |
| ADR-0056 | 每廠商合約附件規格 | ✅ accepted |
| ADR-0057 | 合約 / 規則走 RAG，禁寫 prompt | ✅ accepted |
| ADR-0058 | 外部知識傳承平台 ingestion | ✅ accepted |
| ADR-0059 | 電子鎖 IoT 狀態訊號接入規格 | 🔻 V3 deferred（OQ-NEW-5 業主裁決） |
| **ADR-0060** (v2 update) | Contract Template Schema Reserved Nullable（V1 對外 API 砍，schema 預埋）| ✅ accepted |
| **ADR-0061** (update) | DGS Boundary + OPA Rego BR-PII-001a status=dormant（家族覆核降級 cascade）| ✅ accepted |
| **ADR-PII-002** (new) | 資料極小化：schema 約束 + CI gate 雙層防線 | ✅ accepted (2026-05-24) |
| **ADR-VCH-001** (new) | Platform = Voucher Keeper（非 Issuer）合規路線 | ✅ accepted (2026-05-24) |
| **ADR-VCH-002** (new) | Voucher Retention 7y（hot 2y PG + cold 5y S3 Glacier）+ DPA 條文 | ✅ accepted (2026-05-24) |
| **ADR-PIVOT-001** (new) | V2 重啟 trigger 機制（月活甲方 ≥ 50 + dispute rate ≥ 5%；或第二甲方 LOI；6 個月內未觸發 → V3 重評）| ✅ accepted (2026-05-24) |
| **BR-AUDIT-007** (new) | Family Reviewer event log 三要件（append-only + hash chain + 7 日 dispute window）| ✅ accepted (2026-05-24) |
| **DR-0001** | ~~Epic 4 → V1.5 deferred~~ → **撤回（v2.2 升回 V1）** | ❌ withdrawn (v2.2) |
| **DR-0002** | K2 60% + W8 recalibration（Forum F-02）| ✅ accepted |
| **DR-0003** | DGS = independent service | ✅ accepted |
| **DR-0004** (new) | Option A 降級履約 — 家族覆核 event log 不阻擋 + retrospective | ✅ accepted (2026-05-24) |
| **DR-0005** (new) | Voucher V1 內部憑證 scope freeze；export 延 V2.1 | ✅ accepted (2026-05-24) |

### D. 下游文件對應

| Asset | Location | Status |
|:---|:---|:---:|
| Stakeholder map | [`../governance/stakeholders.md`](../governance/stakeholders.md) | ✅ |
| User flow | [`../ux/user-flow-smart-lock-saas.md`](../ux/user-flow-smart-lock-saas.md) | ✅ |
| System spec | [`../analysis/system-spec-smart-lock-saas.md`](../analysis/system-spec-smart-lock-saas.md) | ✅ |
| C4 L1/L2 | [`../../docs/architecture/ARCH-0001-architecture-overview.md`](../../docs/architecture/ARCH-0001-architecture-overview.md) | ✅ baseline |
| C4 L3 | [`../architecture/c4-l3-smart-lock-saas.md`](../architecture/c4-l3-smart-lock-saas.md) | ✅ |
| OpenAPI | [`../architecture/api/openapi.yaml`](../architecture/api/openapi.yaml) | ✅ |
| ERD | [`../architecture/data/erd.md`](../architecture/data/erd.md) | ✅ |
| NFR matrix | [`../architecture/nfr-matrix-smart-lock-saas.md`](../architecture/nfr-matrix-smart-lock-saas.md) | ✅ |
| Test plan | [`../qa/test-plan-smart-lock-saas.md`](../qa/test-plan-smart-lock-saas.md) | ✅ |
| Runbook | [`../ops/runbook-smart-lock-saas.md`](../ops/runbook-smart-lock-saas.md) | ✅ |
| Release readiness | [`../ops/release-readiness.md`](../ops/release-readiness.md) | ✅ |
| Handoff | [`../../specs/smart-lock-saas/handoff.md`](../../specs/smart-lock-saas/handoff.md) | ✅ |

</details>

---

**End of PRD v2.1**

> 業主 / PM 主要看的是：**📋 一頁讀完** + **🎯 為什麼要做** + **📊 KPI** + **⚠️ 風險** + **⚠️ 還沒答的問題** + **🚀 上線計畫**。
>
> 折疊區的技術 Appendix 是開發團隊用的，業主可略過。
