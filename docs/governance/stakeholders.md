# Stakeholder 地圖 — 智慧鎖 SaaS 平台

> **狀態**：v1 draft
> **更新**：2026-05-23
> **負責人**：PM
> **關聯**：[PRD](../prd/smart-lock-saas.md) · ADR-0042（RBAC 四層）· ADR-0050（Evidence 可見性）

---

## 📋 一句話

平台有 18 個角色，依 ADR-0042 切四層權限。這份盤點他們是誰、影響力多大、決策什麼，給下游 UX / 分析師 / 架構師當人物設定起點。

---

## 🎯 主要 stakeholder（V1.0 / V2.0 都會用到）

| 誰 | 權限層 | 影響力 | 決策什麼 | 怎麼跟我們互動 |
|:---|:---|:---:|:---|:---|
| **甲方專案負責人** | 治理 | 🔴 最高 | 合約執行、scope、KPI 簽核、終止條款 | UAT 驗收、月度 review |
| **甲方資深技師（Domain Expert）** | 治理 | 🔴 最高 | SOP 審核、急件定義、知識品質 | SOP 螺旋雙審、Eval corpus 製作 |
| **客服主管** | 營運 | 🟠 高 | SOP 高風險雙審、客訴、異常 work order | Admin Panel + LINE 監看 |
| **客服 / 派工人員** | 營運 | 🟡 中 | Exception 處理、PC override、客訴接手 | Admin Panel / LINE Internal |
| **簽約師傅** | 營運 | 🔴 最高（生態關鍵）| 接單、ETA、完工報告、月結對帳 | 師傅 Web App（V2）|
| **LINE 消費者** | 顧客 | 🟠 高（量大）| 問題描述、確認 PC、接受報價、確認結案 | LINE Bot |
| **管理員（HQ Admin）** | 治理 | 🔴 最高 | 知識庫、RBAC、報價、ChangeRequest 核准 | Admin Panel |
| **會計 / 財務** | 財務 | 🔴 最高 | 7 帳本對帳、退款核准、月結匯出 | Admin Panel 財務模組 |
| **家族覆核員（Family Reviewer）** | 治理 | 🔴 合約紅線 | SOP 雙審第二關、重要決策覆核（合約 4.4(d)）| Admin Panel 專屬 UI |
| **品牌商 / 經銷商** | 治理（受限）| 🟠 中高 | 自家案件、月結、SLA 履約 | Partner Portal（V2+）|
| **建商 / 案主** | 治理（受限）| 🟡 中 | 點交日、保固模式、月結 | Partner Portal（V2+）|

---

## 🔍 次要 stakeholder（合規 / 治理觸點，V1/V2 內必須有 read access）

| 誰 | 權限層 | 影響力 | 決策什麼 | 觸點 |
|:---|:---|:---:|:---|:---|
| **稽核員 / 法務** | 治理 | 🟠 中高（合規關鍵）| 唯讀 Evidence + audit log、GDPR forget 確認 | Admin Panel 唯讀模式 |
| **DPO（資料保護官）**（v2.1 新加）| 治理 | 🔴 合約紅線 | 個資 retention、GDPR / 個資法、簽 OPA policy artifact | OPA artifact PR + 季度 audit |
| **IT / SRE / DevOps（乙方）** | 治理 | 🟠 中高 | Kill switch、SLO 監控、Runbook 執行 | 監控系統 + on-call |
| **平台開發團隊（乙方）** | — | 🟡 中 | 架構決策、ADR、OpenAPI、部署 | devteam DAG 全程 |
| **PM / Tech Lead（乙方）** | — | 🔴 最高 | scope 對齊、dependency、risk mitigation | devteam DAG + freeze gate |

---

## ⚙️ 影響力 × 興趣矩陣

| | 興趣低 | 興趣高 |
|:---|:---|:---|
| **影響力高** | 稽核員 / 法務（合規觸發才參與） | 甲方專案負責人 / Domain Expert / 客服主管 / **DPO** / **Family Reviewer** / 管理員 / 會計 / Tech Lead |
| **影響力低** | 建商 / 經銷商（V2+ 才進場） | LINE 消費者（量大但個體影響小）/ 師傅（生態關鍵但個別決策有限）/ 客服 / 派工 |

> [!TIP]
> 高影響力 + 高興趣 = 每週都要溝通。高影響力 + 低興趣 = 出事再拉進來。

---

## 🚨 stakeholder 期待落差（潛在衝突點）

> 這些衝突早攤開、晚出事。每條都已對齊到 ADR / counter-metric。

| 衝突點 | A 立場 | B 立場 | 怎麼對齊 |
|:---|:---|:---|:---|
| AI 自助 vs 強制轉真人 | 甲方要 KPI 自助率 ≥ 60% | 客服主管怕 AI 越權承諾 | KPI K2 + counter-metric C2（轉真人率上限）+ 7 條硬規則 |
| 報價 final vs range | 消費者要明確數字 | 法務 / 管理員永禁 final 防越權 | AI 給 range + 客服真人接 final |
| SOP 入庫速度 vs 品質 | 客服主管要新 SOP 快上線 | Family Reviewer + Domain Expert 雙審慢 | 高低風險分流（高風險雙審 / FAQ 單審）|
| 取消費 system 自判 vs 客服覆寫 | 系統依工單狀態自動算 5 階段 | 客服遇特殊情境要覆寫 | 全階段客服可覆寫 + audit log |
| Evidence 可見性廣度 | 稽核員要看全部 | 客戶不看成本拆分 / 品牌商不看競品 | 角色 × 案件生命週期 × 屬性過濾矩陣 |
| 個資保留寬鬆 vs 嚴格 | 法務要 GDPR 嚴格 7 天刪除 | 客服 / Domain Expert 要長期歷史學習 | 分層保留：1 年 / RMA+3 年 / 永久 / GDPR 7 天 |
| 租戶隔離 vs 跨租戶 insight | 第二甲方要絕對隔離 | 平台方想做跨 brand BI | tenant_id 強制 + 跨 brand 必須匿名化 |

---

## 📞 溝通節奏

| 對象 | 頻率 | 形式 | 內容 |
|:---|:---|:---|:---|
| 甲方專案負責人 | 每週 | Meeting + decision dashboard | KPI、合約紅線進度、OQ 答覆 |
| Domain Expert | 雙週 | Workshop | SOP 雙審、Eval corpus、急件規則校準 |
| 客服主管 | 每日（V1 上線後）| Admin Panel + LINE | 異常、客訴、高風險 SOP |
| 簽約師傅 | Ad-hoc | Web App 推播 + LINE | 派工、接單、完工、月結 |
| Family Reviewer | 每週（SOP 入庫節奏）| Admin Panel 覆核佇列 | SOP 雙審第二關 |
| 稽核員 / 法務 / DPO | 季度 + ad-hoc 觸發 | Audit export + 唯讀 Admin | GDPR forget、合約 4.4 抽查 |
| 品牌商 / 建商 | 月度 | Partner Portal（V2+）+ Email | 月結、SLA 履約 |
| 平台開發團隊 | 每日 | devteam DAG + state.json | freeze gate、cascade、ADR |

---

## 🔗 相關文件

- **PRD**：[`../prd/smart-lock-saas.md`](../prd/smart-lock-saas.md) §使用者場景（本表為延伸版）
- **RBAC 四層**：ADR-0042（顧客 / 營運 / 財務 / 治理）
- **Family Reviewer 落地**：FR-NEW-5 + ADR-0050
- **租戶範圍**：ADR-0030 + ADR-0043 合約模板
- **OPA Policy artifact 簽核**：ADR-0061 + [`../policy/br-pii-001.rego`](../policy/br-pii-001.rego)

---

## ⚠️ 待確認

- **OQ-NEW-1**：Family Reviewer 角色定義（誰、幾人、SLA）— 待甲方
- **OQ-NEW-3**：第二甲方 onboarding 流程誰負責 — 待甲方

> 這兩條沒答，V1 上線必有阻礙。
