# WorkOrder ERP Final Spec (2026-05-20)

> **Source of Truth Mirror** — 自動 dump 自 [`01-workorder-erp-final-spec-20260520.xlsx`](../../01-workorder-erp-final-spec-20260520.xlsx)

> **Generated**: 2026-05-27 from Excel (40 sheets)

> **Status**: read-only mirror; 業主編輯只改 xlsx，docs 自動同步

> **D4 雙存治理**: docs 內引用走 markdown anchor (`#sheet-NN-name`)，不直接引 xlsx


## Table of Contents

- [00 使用說明](#00)
- [01 全階段Roadmap](#01-roadmap)
- [02 官方架構](#02)
- [03 模組地圖M01-M20](#03-m01-m20)
- [04 P0核心決策](#04-p0)
- [05 全部Q&A決策庫](#05-q-a)
- [06 業務規則庫](#06)
- [07 Phase I Scope](#07-phase-i-scope)
- [08 Phase II Finance](#08-phase-ii-finance)
- [09 Phase III-V](#09-phase-iii-v)
- [10 流程Gate](#10-gate)
- [11 權限角色矩陣](#11)
- [12 角色維護者](#12)
- [13 狀態異常](#13)
- [14 付款月結](#14)
- [15 Coding必做](#15-coding)
- [16 Coding順序](#16-coding)
- [17 AI工程交接](#17-ai)
- [18 AI跟進清單](#18-ai)
- [19 Answer Register](#19-answer-register)
- [M01 客戶入口](#m01)
- [M02 客戶地址設備](#m02)
- [M03 AI ProblemCard](#m03-ai-problemcard)
- [M04 報價價格](#m04)
- [M05 WorkOrder狀態](#m05-workorder)
- [M06 派工排程](#m06)
- [M07 師傅管理](#m07)
- [M08 現場施工](#m08)
- [M09 Evidence證據](#m09-evidence)
- [M10 Product BOM](#m10-product-bom)
- [M11 AR退款](#m11-ar)
- [M12 AP月結](#m12-ap)
- [M13 RMA品質](#m13-rma)
- [M14 Partner Portal](#m14-partner-portal)
- [M15 異常核准](#m15)
- [M16 Comms通知](#m16-comms)
- [M17 Auth Audit](#m17-auth-audit)
- [M18 System Admin](#m18-system-admin)
- [M19 BI KPI](#m19-bi-kpi)
- [M20 AI Ops](#m20-ai-ops)

---

## 00 使用說明

> 智慧鎖工單 ERP Final Blueprint｜2026-05-20

> 本 workbook 保留完整決策、Q&A、業務規則與 coding gate；已移除歷史路徑、舊版整理欄位與重新問卷欄位。

| 項目 | 內容 | Coding 使用方式 |
|---|---|---|
| 文件定位 | WorkOrder ERP final decision blueprint。 | PRD 看方向；本 Excel 查完整 decision / Q&A / rules。 |
| 保留內容 | 營運原始輸入、ERP Consultant 建議答案、final default、coding gate、owner。 | coding 發生疑問時查本表，不重新問空白問題。 |
| 移除內容 | 舊版本整理欄位、歷史檔案路徑、重複版本資訊。 | 避免 AI Specialist 混淆。 |
| Phase 原則 | Phase 0-I-II 可開始 coding；Phase III-IV-V 保留 roadmap 與後續 scope。 | Phase I/II 先 launch，後續 phase 不丟失。 |
| 規則原則 | 金額、比例、threshold、approval level、template、reason code 必須 configurable。 | System Setup / rule versioning 先做。 |

## 01 全階段Roadmap

> 全階段 Roadmap

> 涵蓋 Phase 0 到 Phase V，Phase I/II 是可開始 coding 的重點。

| Phase | 名稱 | Coding 狀態 | 範圍 | Exit Criteria | Primary Owner |
|---|---|---|---|---|---|
| Phase 0 | Blueprint Freeze / System Setup | 可開始 | System Setup、RBAC、audit、P0 rules、UAT baseline | 服務項目、價格表、SLA、角色、狀態、template、approval owner 可設定 | AI Specialist + System Admin |
| Phase I | Market Launch Core | 可開始 coding | Intake -> ProblemCard -> Quote -> Payment Gate -> WorkOrder -> Dispatch -> Onsite -> Evidence -> Completion | 可跑標準案件、急件、改派、加價、取消、退款申請、基本報表 | AI Specialist + Operator Leader |
| Phase II | Finance / Settlement | 可開始 coding，全部 configurable | AR、refund、取消費、車馬費、檢測費、AP、commission、brand settlement、monthly close | 付款與月結可 export、可審核、可追 evidence、可調 config | Accounting + AI Specialist |
| Phase III | Partner / B2B / Warranty | 後續階段 | Partner Portal、品牌/經銷/門市/建商、專案/社區/戶別、保固起算、B2B settlement | Partner visibility、contract rule、warranty responsibility 被正式定義 | Brand/Partner + Operator Leader |
| Phase IV | AI Ops / Governance | 後續階段，guardrails 先做 | RAG / SOP versioning、AI Eval、feedback loop、quality review、forbidden action test | AI 回答有來源、有版本、有評測、有 rollback | AI Specialist |
| Phase V | BI / KPI Scale | 後續階段 | Management dashboard、brand/project/technician performance、download audit、KPI governance | KPI 依真實資料穩定，管理層可用報表做決策 | Management + Operator Leader |

## 02 官方架構

> 1-3 層官方架構

> 只保留 business architecture，不展開 backend/database/API。

| Layer | 定義 | 包含內容 | Coding 用途 |
|---|---|---|---|
| Layer 1 Domain | 大業務域 | Market / Customer、Service-to-Cash、Finance、Governance、AI Ops、BI | 決定主選單、資料責任與 owner。 |
| Layer 2 Module | M01-M20 模組 | Intake、Customer、ProblemCard、Quote、WorkOrder、Dispatch、AR、AP、RBAC 等 | 拆 tickets、screens、state machine、UAT。 |
| Layer 3 Workflow Gate / Rule | 每個流程的 gate / rule | 必填欄位、狀態、approval、exception、reason code、config | 直接作為 coding acceptance criteria。 |

## 03 模組地圖M01-M20

> 模組地圖 M01-M20

> 完整 ERP module map，包含 Phase I/II/III/IV/V 所需模組。

| ID | Layer 1 Domain | 前期 模組 | 前期 建議名稱 | 中文 | 負責人 | 前期 建議 | 原因 | 目的 | Scope | 主要輸出 | 問題數 | Sheet |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| M01 | D1 Market / Customer（市場 / 客戶） | Customer & Channel Intake（客戶與入口來源） | Customer & Omnichannel Intake（客戶與全渠道入口） | 客戶入口與案件建立 | 客服主管 / CRM owner | 保留，微調名稱 | 保留獨立模組，因為 channel ownership 與 source tracking 是 ProblemCard 前置資料。 | 把 LINE、電話、Web、品牌商、門市、經銷商、建商等入口統一變成可追蹤 Case。 | 入口來源、Case 建立、客戶聯絡資訊、需求摘要、來源歸因、是否升級 ProblemCard。 | Case / Inquiry、customer contact、source channel、first SLA clock | 2 | M01 Intake |
| M02 | D1 Market / Customer（市場 / 客戶） | Customer / Site / Device Master（客戶/地址/設備主檔） | Customer / Site / Device Master（客戶/地址/設備主檔） | 客戶、地址、設備主檔 | 客服主管 / Data steward | 保留 | 保留為 master data 模組，因為它支援 warranty、RMA、repeat service 與 project sites。 | 管理客戶、地址、原住址、設備、品牌型號、購買來源與歷史案件。 | 客戶去重、地址/社區/建案、設備序號、保固起算、歷史工單與客訴連結。 | Customer profile、Site profile、Device registry、service history | 5 | M02 Customer Site |
| M03 | D2 Service-to-Cash Core | AI Triage & ProblemCard（AI 分診與 ProblemCard） | AI Service Triage & ProblemCard（AI 分診與 ProblemCard） | AI 分診與 ProblemCard | 客服主管 / AI SOP owner | 保留，微調名稱 | 保留獨立模組，因為 AI / human triage rules 的變動速度比 WorkOrder execution 更快。 | 把需求轉成可報價、可派工、可追責的服務卡。 | 案件類型、必填欄位、照片影片 gate、AI 轉真人、保固/急件/客訴分流。 | ProblemCard、triage result、missing-info checklist、escalation flag | 9 | M03 ProblemCard |
| M04 | D2 Service-to-Cash Core | Quote / Pricing / Approval（報價/價格/核准） | Pricing, Quote & Commercial Approval（價格、報價與商務核准） | 報價、價格、核准 | 客服主管 / 會計 / 主管 | 保留，改名 | 保留獨立模組，因為 pricing、internal cost 與 customer-facing quote 需要強 approval control。 | 建立內外部價格、訂金、付款條件、加價與折讓規則。 | 價格表、區間價、內部成本、客戶實收、訂金、報價有效期、核准門檻。 | Internal quote、customer quote、approval requirement、payment gate | 10 | M04 Quote Price |
| M05 | D2 Service-to-Cash Core | WorkOrder Lifecycle & Status（工單生命週期與狀態） | WorkOrder Lifecycle & Status Control（WorkOrder 生命週期與狀態控制） | 工單生命週期與狀態 | 派工主管 / System process owner | 保留 | 保留獨立模組，作為正式 state machine 與 handoff object。 | 定義從報價成立到派工、施工、完工、結案的狀態機。 | 狀態、按鈕、可改角色、狀態原因、取消/改期/重開/結案 gate。 | WorkOrder、status history、state transition audit | 7 | M05 WorkOrder |
| M06 | D2 Service-to-Cash Core | Dispatch / Matching / Scheduling（派工/媒合/排程） | Dispatch, Matching, Scheduling & Capacity（派工、媒合、排程與產能） | 派工、媒合、排程 | 派工主管 | 保留 | 保留獨立模組，因為 scheduling 有自己的 SLA、availability 與 matching logic。 | 用距離、技能、空檔、品牌經驗、庫存、SLA 等規則媒合師傅。 | 系統推薦、搶單、人工指派、schedule book、接單逾時、改派。 | Dispatch assignment、schedule slot、acceptance SLA、reassignment reason | 8 | M06 Dispatch |
| M07 | D3 Workforce / Supply（師傅人力 / 供應） | Locksmith / Technician Workforce（師傅人力管理） | Workforce & Technician Qualification（師傅資格與人力管理） | 師傅與技術人力管理 | 派工主管 / 師傅管理 | 保留 | 保留獨立模組，用於 onboarding、eligibility、skill matrix 與 suspension rules。 | 管理師傅、派工者、外包商的資格、服務區、技能、排班、評分與停權。 | 師傅 onboarding、技能證照、品牌授權、服務區、可接案件、評分、扣款、黑名單。 | Technician profile、skill matrix、availability、eligibility、performance score | 4 | M07 Workforce |
| M08 | D2 Service-to-Cash Core | Field Execution / Mobile Workflow（現場施工/行動流程） | Mobile Field Execution（現場施工行動流程） | 現場施工與行動流程 | 派工主管 / 師傅管理 | 保留，改名 | 保留為師傅端 onsite workflow 模組。 | 讓師傅在現場完成到場、施工、異常、用料、收款、簽名與完工回報。 | GPS 打卡、施工 checklist、加價、用料、完工照片、客戶簽名、使用教學。 | Arrival proof、completion report、material usage、customer sign-off | 9 | M08 Onsite |
| M09 | D6 Governance / Platform Ops（治理 / 平台營運） | Evidence / Document / Media（證據/文件/媒體） | Evidence & Document Control（證據與文件控管） | 照片、影片、文件與證據 | 客服主管 / Compliance owner | 保留為 shared service | 不要併入 onsite；evidence 會被 quote、RMA、finance、audit 與 brand visibility 共用。 | 把施工前後照片、影片、聊天、簽名、發票與保固文件變成可稽核證據。 | 照片 checklist、影片、簽名、保卡/發票、可見權限、保存期限、匿名化。 | Evidence package、media permissions、retention rule、audit proof | 7 | M09 Evidence |
| M10 | D3 Workforce / Supply（師傅人力 / 供應） | Product / Brand / BOM / Inventory（品牌商品/BOM/庫存） | Product, BOM, Inventory & Serial Control（商品、BOM、庫存與序號） | 品牌、商品、BOM、庫存 | 品牌 / 庫存管理 / 派工 | 保留，改名 | 保留獨立模組；material ownership 與 serial rules 會影響 dispatch、warranty 與 settlement。 | 管理品牌型號、兩層 BOM、料件歸屬、庫存、序號、退換料。 | 品牌主檔、型號、BOM、庫存位置、保固件、材料費歸屬、退回期限。 | Product master、BOM、material reservation、usage record、inventory exception | 11 | M10 Product BOM |
| M11 | D4 Finance / Settlement（財務 / 結算） | Customer Payment / AR / Refund（客戶付款/AR/退款） | Customer AR, Payment & Refund（客戶 AR、付款與退款） | 客戶付款、應收、退款 | 會計 / 主管 | 保留 | 與 AP 分開，因為 customer-facing payment/refund controls 需要 accounting approval。 | 管理客戶付款、訂金、收款、未收款、退款、發票與支付證明。 | 信用卡、轉帳末五碼、現金、LINE Pay、付款連結、退款分層核准、發票。 | Customer ledger、payment proof、AR status、refund request、invoice requirement | 8 | M11 AR Refund |
| M12 | D4 Finance / Settlement（財務 / 結算） | AP / Commission / Monthly Settlement（AP/抽成/月結） | Technician / Partner AP & Monthly Settlement（師傅/Partner AP 與月結） | 師傅、派工者、品牌月結 | 會計 / Settlement owner | 保留 | 與 AR 分開，因為 technician、dispatcher 與 brand settlement 需要 independent ledgers。 | 管理師傅工資、派工人抽成、品牌月結、代收抵扣、暫扣與扣款。 | Technician AP、dispatcher commission、brand AR/AP、月結單、暫扣爭議金額。 | Technician statement、partner statement、brand settlement、payable amount | 9 | M12 AP Settlement |
| M13 | D5 Quality / After-sales（品質 / 售後） | Complaint / Warranty / RMA / Quality（客訴/保固/RMA/品質） | Complaint, Warranty, RMA & Quality（客訴、保固、RMA 與品質） | 客訴、保固、RMA、品質 | 客服主管 / 品牌商 | 保留 | 保留為 after-sales lifecycle 與 quality feedback loop。 | 管理售後、保固、返修、品質責任、折讓、換貨、退款與升級主管。 | RMA 編號、責任矩陣、原工單連結、返修派工、保固判斷、客訴證據。 | RMA case、warranty decision、liability split、corrective action、quality record | 12 | M13 RMA Quality |
| M14 | D1 Market / Customer（市場 / 客戶） | Brand / Dealer / Builder Partner Portal（品牌/經銷/建商 Partner Portal） | Brand / Dealer / Builder Partner Portal（品牌/經銷/建商 Partner Portal） | 品牌商、經銷商、建商與合作夥伴 | Partner manager / 主管 | 保留 | 保留獨立模組，因為 partner access、project rules 與 B2B settlement 不同於 internal users。 | 支援品牌商、派工者、經銷商、門市、建商專案與 B2B 合約規則。 | 品牌入口、合作夥伴權限、專案價、建商點交日、B2B SLA、月結與資料邊界。 | Partner account、brand case、project contract、B2B settlement rule | 5 | M14 Partner Portal |
| M15 | D2 Service-to-Cash Core | Exception / Approval / Risk Control（異常/核准/風控） | Exception, Approval & Risk Control（異常、核准與風險控制） | 異常、核准、風險控制 | 主管 / 派工主管 / 會計 | 保留為 control tower | 保留獨立模組，因為 abnormal flows 不能藏在各模組內。 | 把缺料、改期、加價、取消、退款、爭議、安全風險轉成可控分流。 | 異常代碼、暫停、return path、核准門檻、責任歸屬、雙簽。 | Exception case、approval task、return path、risk flag、liability reason | 14 | M15 Exception |
| M16 | D6 Governance / Platform Ops（治理 / 平台營運） | Communication / Notification / Conversation（溝通/通知/對話） | Communication, Notification & Conversation（溝通、通知與對話） | 聊天、通知、溝通紀錄 | 客服主管 / Ops owner | 保留為 shared service | 不要併入 WorkOrder；messages 會被 customer、brand、finance、RMA 與 audit 使用。 | 管理客戶、師傅、品牌、內部、會計之間的溝通頻道與通知節點。 | LINE/電話/Email/群組、訊息寫入工單、角色可見性、通知模板、逾時提醒。 | Conversation record、notification task、message visibility rule | 7 | M16 Comms |
| M17 | D6 Governance / Platform Ops（治理 / 平台營運） | Authorization / Security / Audit（權限/安全/Audit） | Authorization, Security & Audit（權限、安全與 Audit） | 權限、安全、稽核 | Central admin / IT admin / 主管 | 保留 | 保留獨立且 coding 前必須確認，因為涉及 finance / brand / customer visibility。 | 定義誰可看、誰可改、誰可核准，以及所有敏感操作的稽核。 | 角色權限、品牌資料邊界、師傅資料邊界、會計權限、audit log、資料保存。 | Permission matrix、approval limit、audit event、data access boundary | 11 | M17 Auth Audit |
| M18 | D6 Governance / Platform Ops（治理 / 平台營運） | System Setup / Master Configuration / IT Ops（系統設定/主檔配置/IT Ops） | System Setup, Master Configuration & IT Ops（系統設定、主檔配置與 IT Ops） | 系統設定、主檔配置、IT 維運 | System admin / IT support（系統管理 / IT 支援） | 保留 | 保留獨立模組；這是 user-maintained configuration layer，不是 backend engineering。 | 讓使用者端系統管理員可設定組織、角色、服務區、價格表、狀態、SLA、模板與主檔。 | 公司/分店/服務區、角色、狀態代碼、服務項目、價格表、通知模板、資料匯入、IT 支援單。 | System configuration、master setup、change request、support ticket | 15 | M18 System Admin |
| M19 | D6 Governance / Platform Ops（治理 / 平台營運） | Reporting / BI / KPI（報表 / BI / KPI） | Reporting, BI & KPI（報表、BI 與 KPI） | 報表、BI、KPI | 主管 / BI owner | 保留 | 保留為 management 與 operations visibility layer。 | 產出工單、派工、財務、庫存、客訴、品質、師傅績效與品牌報表。 | KPI 公式、報表權限、下載、月結報表、異常監控、毛利、未收款。 | Dashboard、export、KPI definition、operational report | 4 | M19 BI KPI |
| M20 | D6 Governance / Platform Ops（治理 / 平台營運） | AI Operations / Knowledge Governance（AI Ops / 知識治理） | AI Operations & Knowledge Governance（AI Ops 與知識治理） | AI 營運、知識庫、品質治理 | AI ops owner / 客服主管 | 保留 | 保留獨立模組，因為 AI SOP、knowledge、escalation 與 quality versioning 需要 governance。 | 管理 AI 回答、分診、報價草稿、轉真人、知識庫、測試案例與版本核准。 | AI 知識庫、prompt / SOP 版本、不可回答清單、轉真人規則、測試與品質回饋。 | AI policy、knowledge article、escalation rule、AI quality review | 4 | M20 AI Ops |

## 04 P0核心決策

> Phase 0 / P0 核心決策

> Coding 前要先放入 System Setup 或 module contract 的核心業務規則。

| 優先級 | 決策 | 目前建議預設答案 | 決策 Owner | 最終規則 |
|---|---|---|---|---|
| P0 | 報價顯示規則 | 客戶只看實收總額；內部看成本拆分 | 主管 / 客服主管 | 客戶只看實收總額；內部看成本拆分 |
| P0 | 訂金 / 預付款 | 高金額、急件、新客戶需在報價定義 | 主管 / 會計 | 高金額、急件、新客戶需在報價定義 |
| P0 | 報價有效期 | 依案件：3、7、15、30 天、品牌規則 | 主管 | 依案件：3、7、15、30 天、品牌規則 |
| P0 | 工單成立點 | 客戶確認最終價格與時間後成立；需付款案件需付款 gate | 主管 / 派工 | 客戶確認最終價格與時間後成立；需付款案件需付款 gate |
| P0 | 接單 SLA | 一般 10 分鐘，急件 5 分鐘 | 派工主管 | 一般 10 分鐘，急件 5 分鐘 |
| P0 | 搶單限制 | 標準、低風險、一般地區、1 小時車程內 | 派工主管 | 標準、低風險、一般地區、1 小時車程內 |
| P0 | 加價確認 | 師傅提出，客戶簽名，客服留紀錄 | 主管 | 師傅提出，客戶簽名，客服留紀錄 |
| P0 | 客戶不同意加價 | 收檢測費 / 車馬費 / 改期 / 客服協調 | 主管 | 收檢測費 / 車馬費 / 改期 / 客服協調 |
| P0 | 取消費 | 前期 未決，需定義付款後、當日、出發後、到場後 | 主管 / 會計 | 前期 未決，需定義付款後、當日、出發後、到場後 |
| P0 | 車馬費 | 到場才收，需定金額與歸屬 | 主管 / 派工 | 到場才收，需定金額與歸屬 |
| P0 | 退款核准 | 前期 未決，需依金額分層 | 主管 / 會計 | 前期 未決，需依金額分層 |
| P0 | 權限 | 品牌商 / 師傅不建議 all access | 主管 | 品牌商 / 師傅不建議 all access |
| P0 | 月結 | 師傅月結、派工人月結、品牌月結分表 | 會計 | 師傅月結、派工人月結、品牌月結分表 |
| P0 | RMA 編號 | RMA + 年月 + 流水號 | 客服主管 | RMA + 年月 + 流水號 |
| P0 | 保固 | 購買日 + 序號；建商案是否點交日需補 | 主管 / 品牌商 | 購買日 + 序號；建商案是否點交日需補 |
| P0 | 角色權限矩陣 | 品牌、師傅、會計、IT、AI ops 需分可看/可改/可核准 | 主管 / IT / 管理員 | 品牌、師傅、會計、IT、AI ops 需分可看/可改/可核准 |
| P0 | 系統設定變更流程 | 價格、權限、SLA、模板、AI SOP 需申請/核准/生效日 | 主管 / System admin | 價格、權限、SLA、模板、AI SOP 需申請/核准/生效日 |
| P0 | 師傅 onboarding 與停權 | 上線資格、品牌授權、停權/恢復門檻 | 派工主管 | 上線資格、品牌授權、停權/恢復門檻 |
| P0 | 品牌/建商專案邊界 | B2B 權限、點交日、月結、責任與 SLA | 主管 / 品牌商 | B2B 權限、點交日、月結、責任與 SLA |
| P0 | AI 不可決策清單 | 不可 final price、退款、保固責任、法律安全承諾 | 客服主管 / AI owner | 不可 final price、退款、保固責任、法律安全承諾 |

## 05 全部Q&A決策庫

> 全部 Q&A 決策庫

> 保留營運原始輸入與 ERP Consultant 建議答案；不再保留舊版整理欄位。

| QID | Layer 1 Domain | 模組 ID | 模組 | 章節 | 問題主題 | 營運原始輸入 / 既有答案 | ERP Consultant 建議答案 | 營運原始輸入 / 確認內容 | 流程 Gate / Coding Gate | Owner | 營運 備註 | 關聯模組 | AI Engineering / Coding 提醒 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Q001 | D6 Governance / Platform Ops（治理 / 平台營運） | M18 | M18 System Setup / Master Configuration / IT Ops（系統設定/主檔配置/IT Ops） | 0. 系統定位與訪談方式 | 核心定位 | Customer inquiry、WorkOrder dispatching、monthly payment（客戶詢問、工單派工、月結付款）。 | 定位為完整 Service-to-Cash ERP：詢問、報價、派工、完工、付款、月結。AI 客服只是入口之一，不是整個系統。 | 是否同意系統名稱可定為「智慧鎖工單 ERP / 派工月結系統」？OK | System configuration、master setup、change request、support ticket | System admin / IT support（系統管理 / IT 支援） | name is ok | 全部模組 | Engineering 必須等 role/config/AI governance 確認後，才能做最終 workflow automation。 |
| Q002 | D6 Governance / Platform Ops（治理 / 平台營運） | M18 | M18 System Setup / Master Configuration / IT Ops（系統設定/主檔配置/IT Ops） | 0. 系統定位與訪談方式 | 訪談方式 | 先收意見再統一規則。 | 正確。Full 完整版本 仍需先收所有角色答案，再由主管統一正式規則。 | 規則統一會議由誰主持？Sunny and 營運 | System configuration、master setup、change request、support ticket | System admin / IT support（系統管理 / IT 支援） | Co-founder decision | 全部模組 | Engineering 必須等 role/config/AI governance 確認後，才能做最終 workflow automation。 |
| Q003 | D1 Market / Customer（市場 / 客戶） | M14 | M14 Brand / Dealer / Builder Partner Portal（品牌/經銷/建商 Partner Portal） | 0. 系統定位與訪談方式 | 參與方 | 以上全部。 | Full 完整版本 支援客戶、AI、真人客服、派工、師傅、品牌商、會計、主管、經銷商、社區 / 建商。 | 是否有第三方派工廠商角色？Keep the room for future | Partner account、brand case、project contract、B2B settlement rule | Partner manager / 主管 | Keep the 3rd party dispatch chance but not for now, operational leader decide | M01,M11,M12,M17 | Engineering 可依此列草擬 screens/workflow，但 final gates 需依 營運 review status。 |
| Q004 | D6 Governance / Platform Ops（治理 / 平台營運） | M18 | M18 System Setup / Master Configuration / IT Ops（系統設定/主檔配置/IT Ops） | 0. 系統定位與訪談方式 | 案件類型 | 全部：安裝、維修、保固、客訴、急件、改期/取消、退款、品牌專案、建商專案。 | 全部列入 Full 完整版本 模組，不再拆 Phase I launch scope / 完整版本。 | 建商專案是否與品牌專案分開權限和月結？YES | System configuration、master setup、change request、support ticket | System admin / IT support（系統管理 / IT 支援） | Need to define Phase I launch scope or difference phases | 全部模組 | Engineering 必須等 role/config/AI governance 確認後，才能做最終 workflow automation。 |
| Q005 | D6 Governance / Platform Ops（治理 / 平台營運） | M18 | M18 System Setup / Master Configuration / IT Ops（系統設定/主檔配置/IT Ops） | 0. 系統定位與訪談方式 | 正式規則確認 | 共同確認。 | ERP 上可共同討論，但每個規則要有最後 owner，不可只寫共同確認。 | 請指定報價、派工、月結、客訴、品牌權限的最後拍板人。Admin and IT | System configuration、master setup、change request、support ticket | System admin / IT support（系統管理 / IT 支援） | System admin / IT support（系統管理 / IT 支援） | 全部模組 | Engineering 必須等 role/config/AI governance 確認後，才能做最終 workflow automation。 |
| Q006 | D1 Market / Customer（市場 / 客戶） | M01 | M01 Customer & Channel Intake（客戶與入口來源） | 1. 客戶入口、案件建立與現行流程 | 客戶入口 | 早期版本 只使用 LINE。 | Full 完整版本 不再只限 LINE。LINE 是主入口，但電話、Web Chat、品牌商入口、官網、門市、經銷商、熟客介紹都應可建 Case。 | 哪些入口只由客服代建，不讓外部自行登入？Full 完整版本 不再只限 LINE。LINE 是主入口，但電話、Web Chat、品牌商入口、官網、門市、經銷商、熟客介紹都應可建 Case。電話、Web Chat will be handled by 客服 | Case / Inquiry、customer contact、source channel、first SLA clock | 客服主管 / CRM owner | Full 完整版本 不再只限 LINE。LINE 是主入口，但電話、Web Chat、品牌商入口、官網、門市、經銷商、熟客介紹都應可建 Case。 | M02,M03,M16 | Engineering 可依此列草擬 screens/workflow，但 final gates 需依 營運 review status。 |
| Q007 | D2 Service-to-Cash Core | M04 | M04 Quote / Pricing / Approval（報價/價格/核准） | 1. 客戶入口、案件建立與現行流程 | 是否每個需求建案件 | 全部建立；所有 quotation 要含預付款 / 訂金、付款方式、匯款末五碼、現場現金、信用卡、web link payment。 | 建議所有進線先建 Case；凡涉及報價、付款、派工、客訴都升為 ProblemCard / WorkOrder。付款條件要在報價階段定義。 | 訂金金額是固定金額還是比例？比例 | Internal quote、customer quote、approval requirement、payment gate | 客服主管 / 會計 / 主管 | 建議所有進線先建 Case；凡涉及報價、付款、派工、客訴都升為 ProblemCard / WorkOrder。付款條件要在報價階段定義。 | M03,M11,M15 | Engineering 可依此列草擬 screens/workflow，但 final gates 需依 營運 review status。 |
| Q008 | D1 Market / Customer（市場 / 客戶） | M02 | M02 Customer / Site / Device Master（客戶/地址/設備主檔） | 1. 客戶入口、案件建立與現行流程 | 自動建立客戶資料 | 一定要。 | 正確。Full 完整版本 一進線即建 Customer，後續補設備、地址、品牌型號、購買來源。 | 客戶去重依電話、LINE ID 還是地址？地址 | Customer profile、Site profile、Device registry、service history | 客服主管 / Data steward | 正確。Full 完整版本 一進線即建 Customer，後續補設備、地址、品牌型號、購買來源。 | M01,M03,M13 | Engineering 可依此列草擬 screens/workflow，但 final gates 需依 營運 review status。 |
| Q009 | D2 Service-to-Cash Core | M05 | M05 WorkOrder Lifecycle & Status（工單生命週期與狀態） | 1. 客戶入口、案件建立與現行流程 | 現行進線到派工 | LINE chatbot 收需求，確認工單內容與總金額，報價轉訂單，確認信用卡或匯款末五碼，轉工單，媒合師傅，chatbot 確認時程，進 schedule book，師傅確認 BOM / 材料，完工上照片，客戶簽名，AR confirmed。 | 這就是 Full 完整版本 主流程。需正式拆成：Inquiry → ProblemCard → Internal Quote → Customer Confirm → Payment Gate → WorkOrder → Dispatch → Schedule → Onsite → Completion → AR。 | 是否所有訂單都要 payment gate 後才派工？可選擇跳過 | WorkOrder、status history、state transition audit | 派工主管 / System process owner | 這就是 Full 完整版本 主流程。需正式拆成：Inquiry → ProblemCard → Internal Quote → Customer Confirm → Payment Gate → WorkOrder → Dispatch → Schedule → Onsite → Completion → AR。 | M04,M06,M08,M15 | Engineering 可依此列草擬 screens/workflow，但 final gates 需依 營運 review status。 |
| Q010 | D6 Governance / Platform Ops（治理 / 平台營運） | M18 | M18 System Setup / Master Configuration / IT Ops（系統設定/主檔配置/IT Ops） | 1. 客戶入口、案件建立與現行流程 | 現行工具 | LINE 群、電話、Excel、Google Sheet、Email、紙本、口頭；派工廠商 LINE 群記事本放 schedule。 | Full 完整版本 要把 LINE 群記事本的排程搬到系統 schedule book，否則派工仍不受控。 | 哪些派工廠商需要自己的 schedule view？All of them | System configuration、master setup、change request、support ticket | System admin / IT support（系統管理 / IT 支援） | Full 完整版本 要把 LINE 群記事本的排程搬到系統 schedule book，否則派工仍不受控。 | 全部模組 | Engineering 必須等 role/config/AI governance 確認後，才能做最終 workflow automation。 |
| Q011 | D2 Service-to-Cash Core | M15 | M15 Exception / Approval / Risk Control（異常/核准/風控） | 1. 客戶入口、案件建立與現行流程 | 流程斷點 | 全部：資料漏填、報價不清、找不到師傅、未回覆、缺料、付款不清、客訴未追、月結不清；現場問題不清，客戶未回必要問題，影響找對材料與師傅。 | 這些斷點對應 Full 完整版本 的必做控制點：ProblemCard 必填、照片 gate、報價 gate、派工 SLA、BOM gate、付款 ledger、客訴 RMA、月結。 | 最痛的前三個斷點是什麼？找不到師傅、現場問題不清，客戶未回必要問題，影響找對材料與師傅。 | Exception case、approval task、return path、risk flag、liability reason | 主管 / 派工主管 / 會計 | 這些斷點對應 Full 完整版本 的必做控制點：ProblemCard 必填、照片 gate、報價 gate、派工 SLA、BOM gate、付款 ledger、客訴 RMA、月結。 | M04,M05,M08,M11,M13 | Engineering 必須建模 approvals 與 audit trail；不可 hardcode money 或 refund rules。 |
| Q012 | D1 Market / Customer（市場 / 客戶） | M02 | M02 Customer / Site / Device Master（客戶/地址/設備主檔） | 1. 客戶入口、案件建立與現行流程 | 保留案件歷史 | 每件都保留，派工、客訴、保固全部。 | 正確。Full 完整版本 每件 Case / ProblemCard / WorkOrder / RMA 都要保留歷史。照片另依保存規則。 | 歷史保存是 1 年、保固期，還是更久？One year | Customer profile、Site profile、Device registry、service history | 客服主管 / Data steward | 正確。Full 完整版本 每件 Case / ProblemCard / WorkOrder / RMA 都要保留歷史。照片另依保存規則。 | M01,M03,M13 | Engineering 可依此列草擬 screens/workflow，但 final gates 需依 營運 review status。 |
| Q013 | D2 Service-to-Cash Core | M03 | M03 AI Triage & ProblemCard（AI 分診與 ProblemCard） | 2. AI 客服分診與 ProblemCard | AI 第一輪判斷 | 安裝/維修/保固/客訴、急件、可否報價、是否需真人、是否需照片，全部。 | AI 第一輪要做五向分診，不只分類案件。 | 急件關鍵字要由誰提供？師傅 | ProblemCard、triage result、missing-info checklist、escalation flag | 客服主管 / AI SOP owner | AI 第一輪要做五向分診，不只分類案件。 | M04,M06,M09,M20 | Engineering 可依此列草擬 screens/workflow，但 final gates 需依 營運 review status。 |
| Q014 | D2 Service-to-Cash Core | M03 | M03 AI Triage & ProblemCard（AI 分診與 ProblemCard） | 2. AI 客服分診與 ProblemCard | ProblemCard 核心 | 一定要；不一定都連 WorkOrder，AI chatbot 有時可處理完。 | 正確。ProblemCard 是 Service Ticket；遠端處理完可關閉，不一定轉 WorkOrder。 | 遠端解決的 ProblemCard 是否需要客戶確認關閉？Line message ok then close | ProblemCard、triage result、missing-info checklist、escalation flag | 客服主管 / AI SOP owner | 正確。ProblemCard 是 Service Ticket；遠端處理完可關閉，不一定轉 WorkOrder。 | M04,M06,M09,M20 | Engineering 可依此列草擬 screens/workflow，但 final gates 需依 營運 review status。 |
| Q015 | D2 Service-to-Cash Core | M03 | M03 AI Triage & ProblemCard（AI 分診與 ProblemCard） | 2. AI 客服分診與 ProblemCard | ProblemCard 必填 | 姓名、電話、地址/區域、品牌、型號、問題類型、照片、保固、預約時間、付款狀態，全部。 | Full 完整版本 可全部納入，但要分必填 / 可後補 / 派工前必填，避免客戶卡太久。 | 哪些欄位缺少不得報價？電話、地址/區域、品牌、型號、問題類型、預約時間 | ProblemCard、triage result、missing-info checklist、escalation flag | 客服主管 / AI SOP owner | Full 完整版本 可全部納入，但要分必填 / 可後補 / 派工前必填，避免客戶卡太久。 | M04,M06,M09,M20 | Engineering 可依此列草擬 screens/workflow，但 final gates 需依 營運 review status。 |
| Q016 | D2 Service-to-Cash Core | M03 | M03 AI Triage & ProblemCard（AI 分診與 ProblemCard） | 2. AI 客服分診與 ProblemCard | 安裝必問 | 是否已購買、品牌型號、門型、門厚、舊鎖照片、地址、希望時間、是否需材料，且確認價格與訂單。 | 安裝 ProblemCard 應加上「價格可接受」與「LINE 確認」。 | 門厚是否一定要客戶提供，還是照片判斷即可？All ok | ProblemCard、triage result、missing-info checklist、escalation flag | 客服主管 / AI SOP owner | 安裝 ProblemCard 應加上「價格可接受」與「LINE 確認」。 | M04,M06,M09,M20 | Engineering 可依此列草擬 screens/workflow，但 final gates 需依 營運 review status。 |
| Q017 | D2 Service-to-Cash Core | M03 | M03 AI Triage & ProblemCard（AI 分診與 ProblemCard） | 2. AI 客服分診與 ProblemCard | 維修必問 | 全部；另需門型、內外門、是否仍有原鑰匙、人在門內是否可開門。 | 很重要。維修分診需判斷急件、是否被鎖、能否遠端排除、是否需要開鎖。 | 被鎖門外是否直接 Red Code？YES | ProblemCard、triage result、missing-info checklist、escalation flag | 客服主管 / AI SOP owner | 很重要。維修分診需判斷急件、是否被鎖、能否遠端排除、是否需要開鎖。 | M04,M06,M09,M20 | Engineering 可依此列草擬 screens/workflow，但 final gates 需依 營運 review status。 |
| Q018 | D2 Service-to-Cash Core | M03 | M03 AI Triage & ProblemCard（AI 分診與 ProblemCard） | 2. AI 客服分診與 ProblemCard | 保固必問 | 購買日、安裝日、品牌、型號、序號、發票/保卡、故障照片、品牌判斷，全部。 | 保固 ProblemCard 必須連品牌 / 序號 / 發票 / 購買日，並禁止 AI 最終報價。 | 保固判斷由品牌、客服還是主管？品牌 | ProblemCard、triage result、missing-info checklist、escalation flag | 客服主管 / AI SOP owner | 保固 ProblemCard 必須連品牌 / 序號 / 發票 / 購買日，並禁止 AI 最終報價。 | M04,M06,M09,M20 | Engineering 可依此列草擬 screens/workflow，但 final gates 需依 營運 review status。 |
| Q019 | D2 Service-to-Cash Core | M03 | M03 AI Triage & ProblemCard（AI 分診與 ProblemCard） | 2. AI 客服分診與 ProblemCard | 客訴分類 | 先連原工單 + 原住址。 | Full 完整版本 建議建立獨立 RMA / Complaint Case，但一定連原工單與原地址。 | RMA 編號格式是否採年月流水號？YES | ProblemCard、triage result、missing-info checklist、escalation flag | 客服主管 / AI SOP owner | Full 完整版本 建議建立獨立 RMA / Complaint Case，但一定連原工單與原地址。 | M04,M06,M09,M20 | Engineering 可依此列草擬 screens/workflow，但 final gates 需依 營運 review status。 |
| Q020 | D2 Service-to-Cash Core | M03 | M03 AI Triage & ProblemCard（AI 分診與 ProblemCard） | 2. AI 客服分診與 ProblemCard | AI 轉真人 | 急件、生氣、高金額、保固不明、退款、現場異常、品牌責任、法律/安全，另加 AI 超過三輪錯誤。 | Full 完整版本 採轉真人規則：高風險立即轉，AI 3 cycle 失敗轉。 | AI 失敗幾次轉真人：3 次 | ProblemCard、triage result、missing-info checklist、escalation flag | 客服主管 / AI SOP owner | Full 完整版本 採轉真人規則：高風險立即轉，AI 3 cycle 失敗轉。 | M04,M06,M09,M20 | Engineering 可依此列草擬 screens/workflow，但 final gates 需依 營運 review status。 |
| Q021 | D2 Service-to-Cash Core | M04 | M04 Quote / Pricing / Approval（報價/價格/核准） | 2. AI 客服分診與 ProblemCard | AI 報價 | 只可給區間，需真人確認最後價格。 | 正確。AI 可產生 quote draft / range，不可 final price。 | 哪些固定價可不用真人確認？新機安裝 | Internal quote、customer quote、approval requirement、payment gate | 客服主管 / 會計 / 主管 | 正確。AI 可產生 quote draft / range，不可 final price。 | M03,M11,M15 | Engineering 可依此列草擬 screens/workflow，但 final gates 需依 營運 review status。 |
| Q022 | D6 Governance / Platform Ops（治理 / 平台營運） | M09 | M09 Evidence / Document / Media（證據/文件/媒體） | 3. 照片、影片與證據 | 安裝前照片 | 門正面、側邊/鎖舌、門框、舊鎖正背面、型號貼紙、現場環境，全部。 | Full 完整版本 設為安裝照片 checklist。 | 哪些照片缺少時禁止報價？不會 | Evidence package、media permissions、retention rule、audit proof | 客服主管 / Compliance owner | Full 完整版本 設為安裝照片 checklist。 | M03,M08,M13,M17 | Engineering 可依此列草擬 screens/workflow，但 final gates 需依 營運 review status。 |
| Q023 | D6 Governance / Platform Ops（治理 / 平台營運） | M09 | M09 Evidence / Document / Media（證據/文件/媒體） | 3. 照片、影片與證據 | 維修前照片影片 | 故障影片、錯誤訊息、App、鎖體、門狀態、電池電源；門打不開 100% 要影片。 | 維修 ProblemCard 要有 video gate，尤其無法開門。 | 影片可由客戶上傳 LINE 嗎？Yes | Evidence package、media permissions、retention rule、audit proof | 客服主管 / Compliance owner | 維修 ProblemCard 要有 video gate，尤其無法開門。 | M03,M08,M13,M17 | Engineering 可依此列草擬 screens/workflow，但 final gates 需依 營運 review status。 |
| Q024 | D6 Governance / Platform Ops（治理 / 平台營運） | M09 | M09 Evidence / Document / Media（證據/文件/媒體） | 3. 照片、影片與證據 | 影響派工照片 | 門型、舊鎖、門框、型號、施工空間、現場風險、門厚度，全部。 | 這些是 dispatch gate，決定師傅與材料。 | 缺照片是否允許人工 override？OK | Evidence package、media permissions、retention rule、audit proof | 客服主管 / Compliance owner | 這些是 dispatch gate，決定師傅與材料。 | M03,M08,M13,M17 | Engineering 可依此列草擬 screens/workflow，但 final gates 需依 營運 review status。 |
| Q025 | D6 Governance / Platform Ops（治理 / 平台營運） | M09 | M09 Evidence / Document / Media（證據/文件/媒體） | 3. 照片、影片與證據 | 完工照片 | 完工正面、門側邊、鎖舌/門框、App 綁定、配件/材料、客戶簽名，全部。 | 完工照片連到收款、保固、客訴。 | App 綁定照片是否所有品牌都需要？Yes | Evidence package、media permissions、retention rule、audit proof | 客服主管 / Compliance owner | 完工照片連到收款、保固、客訴。 | M03,M08,M13,M17 | Engineering 可依此列草擬 screens/workflow，但 final gates 需依 營運 review status。 |
| Q026 | D6 Governance / Platform Ops（治理 / 平台營運） | M17 | M17 Authorization / Security / Audit（權限/安全/Audit） | 3. 照片、影片與證據 | 照片可見權限 | 依權限。 | 正確。客戶、師傅、品牌、會計看到的照片不同。客戶、師傅 will see, 品牌 no need 、會計 one of those picture will be enough | 品牌商可否看客戶家中環境照？No | Permission matrix、approval limit、audit event、data access boundary | Central admin / IT admin / 主管 | 正確。客戶、師傅、品牌、會計看到的照片不同。客戶、師傅 will see, 品牌 no need 、會計 one of those picture will be enough | M09,M11,M14,M18 | Engineering 必須等 role/config/AI governance 確認後，才能做最終 workflow automation。 |
| Q027 | D6 Governance / Platform Ops（治理 / 平台營運） | M09 | M09 Evidence / Document / Media（證據/文件/媒體） | 3. 照片、影片與證據 | 保存多久 | 1 年，放在工單下，不顯示客戶姓名。 | Full 完整版本 採 1 年匿名展示；保固 / 客訴案件建議至少保留至保固或客訴結案後。 | 保固案件是否超過 1 年保存？Keep 2 years | Evidence package、media permissions、retention rule、audit proof | 客服主管 / Compliance owner | Full 完整版本 採 1 年匿名展示；保固 / 客訴案件建議至少保留至保固或客訴結案後。 | M03,M08,M13,M17 | Engineering 可依此列草擬 screens/workflow，但 final gates 需依 營運 review status。 |
| Q028 | D2 Service-to-Cash Core | M04 | M04 Quote / Pricing / Approval（報價/價格/核准） | 4. 報價、訂單與價格 | 報價前提 | ProblemCard 完整、照片、地址、保固、品牌、師傅確認，全部；客戶確認 ProblemCard clear。 | Full 完整版本 報價 gate：ProblemCard clear + evidence enough + customer confirms issue. | 師傅是否每張都需確認報價可施工？可以跳過，若有急件 | Internal quote、customer quote、approval requirement、payment gate | 客服主管 / 會計 / 主管 | Full 完整版本 報價 gate：ProblemCard clear + evidence enough + customer confirms issue. | M03,M11,M15 | Engineering 可依此列草擬 screens/workflow，但 final gates 需依 營運 review status。 |
| Q029 | D2 Service-to-Cash Core | M04 | M04 Quote / Pricing / Approval（報價/價格/核准） | 4. 報價、訂單與價格 | 固定價 | 標準安裝、標準維修、檢測費、軟體更新。 | 固定價項目可進價格表；仍需保留例外加價。 | 車馬費與急件費是否也固定？要由師傅跟人確認，自行填寫 | Internal quote、customer quote、approval requirement、payment gate | 客服主管 / 會計 / 主管 | 固定價項目可進價格表；仍需保留例外加價。 | M03,M11,M15 | Engineering 可依此列草擬 screens/workflow，但 final gates 需依 營運 review status。 |
| Q030 | D2 Service-to-Cash Core | M04 | M04 Quote / Pricing / Approval（報價/價格/核准） | 4. 報價、訂單與價格 | 區間價 | 維修、特殊門型、舊鎖拆除、額外開孔、缺料、保固判斷，全部；最終價格送 chatbot，客戶確認 schedule + final price。 | Full 完整版本 區間價轉 final quote 的 gate 是現場或客服確認。 | 區間價是否可先收訂金？有要收訂金狀況 | Internal quote、customer quote、approval requirement、payment gate | 客服主管 / 會計 / 主管 | Full 完整版本 區間價轉 final quote 的 gate 是現場或客服確認。 | M03,M11,M15 | Engineering 可依此列草擬 screens/workflow，但 final gates 需依 營運 review status。 |
| Q031 | D2 Service-to-Cash Core | M04 | M04 Quote / Pricing / Approval（報價/價格/核准） | 4. 報價、訂單與價格 | 不能 AI 自動報價 | 維修、保固、特殊門型、高金額、客訴、品牌責任、照片不足，全部；所有價格需客服或師傅確認。 | AI 只輔助，不做 final commercial decision。 | 固定價安裝是否例外？新機安裝一品牌不同 | Internal quote、customer quote、approval requirement、payment gate | 客服主管 / 會計 / 主管 | AI 只輔助，不做 final commercial decision。 | M03,M11,M15 | Engineering 可依此列草擬 screens/workflow，但 final gates 需依 營運 review status。 |
| Q032 | D2 Service-to-Cash Core | M04 | M04 Quote / Pricing / Approval（報價/價格/核准） | 4. 報價、訂單與價格 | 報價有效期限 | 3、7、15、30 天、依品牌，全部。 | Full 完整版本 支援依案件類型設定：一般 3 天、標準安裝 7 天、品牌/建商 15-30 天。 | Full 完整版本 支援依案件類型設定：一般 3 天、標準安裝 7 天、品牌/建商 15-30 天。 | Internal quote、customer quote、approval requirement、payment gate | 客服主管 / 會計 / 主管 | Full 完整版本 支援依案件類型設定：一般 3 天、標準安裝 7 天、品牌/建商 15-30 天。 | M03,M11,M15 | Engineering 可依此列草擬 screens/workflow，但 final gates 需依 營運 review status。 |
| Q033 | D2 Service-to-Cash Core | M04 | M04 Quote / Pricing / Approval（報價/價格/核准） | 4. 報價、訂單與價格 | 訂單成立 | 客戶同意、付款、客服確認、品牌確認、師傅接單、系統建立；主要 gate 是客戶和師傅在 chatbot 同意。 | Full 完整版本 建議分兩個 gate：Order Created = 客戶確認價格；Dispatch Confirmed = 師傅接單。付款 gate 依報價規則。 | 哪些案件必須付款後才派工？個案選擇 | Internal quote、customer quote、approval requirement、payment gate | 客服主管 / 會計 / 主管 | Full 完整版本 建議分兩個 gate：Order Created = 客戶確認價格；Dispatch Confirmed = 師傅接單。付款 gate 依報價規則。 | M03,M11,M15 | Engineering 可依此列草擬 screens/workflow，但 final gates 需依 營運 review status。 |
| Q034 | D2 Service-to-Cash Core | M04 | M04 Quote / Pricing / Approval（報價/價格/核准） | 4. 報價、訂單與價格 | 報價欄位 | 內部報價含原價、折扣、客戶實付、退款、產品費、工資、材料、車馬、急件；外部只顯示客戶實付。 | 正確。客戶只看總額，內部才拆成本與師傅工資。 | 客戶是否可看工資與材料拆分？不可，客戶只看到，客戶最終價格，一班報價單，要先由內部計價使用，客戶看不到真正內容 | Internal quote、customer quote、approval requirement、payment gate | 客服主管 / 會計 / 主管 | 正確。客戶只看總額，內部才拆成本與師傅工資。 | M03,M11,M15 | Engineering 可依此列草擬 screens/workflow，但 final gates 需依 營運 review status。 |
| Q035 | D4 Finance / Settlement（財務 / 結算） | M12 | M12 AP / Commission / Monthly Settlement（AP/抽成/月結） | 4. 報價、訂單與價格 | 客戶付款與師傅工資 | 一定分開；付款支援匯款末五碼、現金、現場信用卡、訂金；師傅工資月結，需拆代收產品款、代工費、加班費、異常處理費。 | Full 完整版本 必須雙 ledger：Customer AR 與 Technician AP。 | 師傅代收產品款如何與工資抵扣？不要抵扣 | Technician statement、partner statement、brand settlement、payable amount | 會計 / Settlement owner | Full 完整版本 必須雙 ledger：Customer AR 與 Technician AP。 | M07,M11,M14 | Engineering 必須建模 approvals 與 audit trail；不可 hardcode money 或 refund rules。 |
| Q036 | D4 Finance / Settlement（財務 / 結算） | M12 | M12 AP / Commission / Monthly Settlement（AP/抽成/月結） | 4. 報價、訂單與價格 | 是否 Uber 兩條帳 | 需要三條帳以上：平台代收、師傅請款、品牌、派工人月結。 | 正確。Full 完整版本 至少 Customer Ledger、Technician Ledger、Brand / Dispatch Partner Ledger。 | 派工人月結是否與師傅月結不同表？是 | Technician statement、partner statement、brand settlement、payable amount | 會計 / Settlement owner | 正確。Full 完整版本 至少 Customer Ledger、Technician Ledger、Brand / Dispatch Partner Ledger。 | M07,M11,M14 | Engineering 必須建模 approvals 與 audit trail；不可 hardcode money 或 refund rules。 |
| Q037 | D1 Market / Customer（市場 / 客戶） | M14 | M14 Brand / Dealer / Builder Partner Portal（品牌/經銷/建商 Partner Portal） | 4. 報價、訂單與價格 | 品牌案報價對象 | 依案件類型；客戶只看總額，品牌或派工價可能是 B2B，品牌對師傅、鎖店對師傅。 | Full 完整版本 需支援 B2C price、B2B brand price、internal technician cost。 | 品牌商可見哪一種價格？全部 | Partner account、brand case、project contract、B2B settlement rule | Partner manager / 主管 | Full 完整版本 需支援 B2C price、B2B brand price、internal technician cost。 | M01,M11,M12,M17 | Engineering 可依此列草擬 screens/workflow，但 final gates 需依 營運 review status。 |
| Q038 | D2 Service-to-Cash Core | M06 | M06 Dispatch / Matching / Scheduling（派工/媒合/排程） | 5. 派工、媒合與排程 | 派工模式 | 系統推薦、搶單、人工指派、推薦後人工確認、原師傅返修，全部。 | Full 完整版本 全部支援，但按案件類型決定預設模式。 | 哪些案件不得搶單？都可以 | Dispatch assignment、schedule slot、acceptance SLA、reassignment reason | 派工主管 | Full 完整版本 全部支援，但按案件類型決定預設模式。 | M05,M07,M10 | Engineering 可依此列草擬 screens/workflow，但 final gates 需依 營運 review status。 |
| Q039 | D2 Service-to-Cash Core | M06 | M06 Dispatch / Matching / Scheduling（派工/媒合/排程） | 5. 派工、媒合與排程 | 可搶單案件 | 標準安裝、標準維修、低風險、一般地區；車程不可超過 1 小時。 | 合理。Full 完整版本 搶單池限制為低風險 + 1 小時車程內。 | 1 小時是單程還是來回？單程 | Dispatch assignment、schedule slot、acceptance SLA、reassignment reason | 派工主管 | 合理。Full 完整版本 搶單池限制為低風險 + 1 小時車程內。 | M05,M07,M10 | Engineering 可依此列草擬 screens/workflow，但 final gates 需依 營運 review status。 |
| Q040 | D2 Service-to-Cash Core | M06 | M06 Dispatch / Matching / Scheduling（派工/媒合/排程） | 5. 派工、媒合與排程 | 必須人工指派 | 急件、高金額、客訴、保固、特殊門型、品牌指定、資深師傅，全部。 | 正確。高風險案件不自動搶單。 | 品牌指定師傅是否能 override 系統排序？可以 | Dispatch assignment、schedule slot、acceptance SLA、reassignment reason | 派工主管 | 正確。高風險案件不自動搶單。 | M05,M07,M10 | Engineering 可依此列草擬 screens/workflow，但 final gates 需依 營運 review status。 |
| Q041 | D2 Service-to-Cash Core | M06 | M06 Dispatch / Matching / Scheduling（派工/媒合/排程） | 5. 派工、媒合與排程 | 媒合排序 | 距離、地區、空檔、工資、品牌經驗、型號經驗、評分、接單率、客訴率、庫存。 | Full 完整版本 可採此順序；ERP 註解：工資排太前面可能影響品質，建議距離/空檔/技能先於工資。 | 是否要把技能排在工資前？是 | Dispatch assignment、schedule slot、acceptance SLA、reassignment reason | 派工主管 | Full 完整版本 可採此順序；ERP 註解：工資排太前面可能影響品質，建議距離/空檔/技能先於工資。 | M05,M07,M10 | Engineering 可依此列草擬 screens/workflow，但 final gates 需依 營運 review status。 |
| Q042 | D6 Governance / Platform Ops（治理 / 平台營運） | M17 | M17 Authorization / Security / Audit（權限/安全/Audit） | 5. 派工、媒合與排程 | 接單前可見 | 區域、完整地址、照片、品牌型號、報價、預約時間、付款狀態、客戶備註；另含 internal quotation + external customer total。 | 權限要分接單前/後。建議接單前看區域與摘要，接單後看完整地址。 | 師傅接單前是否能看完整地址？不行 | Permission matrix、approval limit、audit event、data access boundary | Central admin / IT admin / 主管 | 權限要分接單前/後。建議接單前看區域與摘要，接單後看完整地址。 | M09,M11,M14,M18 | Engineering 必須等 role/config/AI governance 確認後，才能做最終 workflow automation。 |
| Q043 | D2 Service-to-Cash Core | M06 | M06 Dispatch / Matching / Scheduling（派工/媒合/排程） | 5. 派工、媒合與排程 | 回覆時間 | 一般 10 分鐘，急件 5 分鐘。 | 採用 前期 答案。逾時要自動重派。 | 人工指定件是否也 10 分鐘？不用 | Dispatch assignment、schedule slot、acceptance SLA、reassignment reason | 派工主管 | 採用 前期 答案。逾時要自動重派。 | M05,M07,M10 | Engineering 可依此列草擬 screens/workflow，但 final gates 需依 營運 review status。 |
| Q044 | D3 Workforce / Supply（師傅人力 / 供應） | M07 | M07 Locksmith / Technician Workforce（師傅人力管理） | 5. 派工、媒合與排程 | 拒單理由 | 一定要，且影響評分。 | 正確。拒單 reason code 連技師評分與派工排序。 | 拒單率超過多少暫停派工？3 次以上 | Technician profile、skill matrix、availability、eligibility、performance score | 派工主管 / 師傅管理 | 正確。拒單 reason code 連技師評分與派工排序。 | M06,M12,M19 | Engineering 可依此列草擬 screens/workflow，但 final gates 需依 營運 review status。 |
| Q045 | D2 Service-to-Cash Core | M06 | M06 Dispatch / Matching / Scheduling（派工/媒合/排程） | 5. 派工、媒合與排程 | 接單後取消或逾時 | 未填。 | Full 完整版本 建議：逾時自動改派；接單後取消需客服接手、記錄原因、必要時主管處理；客戶改期需新 schedule。 | 是否允許原師傅找代班？不可以 | Dispatch assignment、schedule slot、acceptance SLA、reassignment reason | 派工主管 | Full 完整版本 建議：逾時自動改派；接單後取消需客服接手、記錄原因、必要時主管處理；客戶改期需新 schedule。 | M05,M07,M10 | Engineering 可依此列草擬 screens/workflow，但 final gates 需依 營運 review status。 |
| Q046 | D2 Service-to-Cash Core | M06 | M06 Dispatch / Matching / Scheduling（派工/媒合/排程） | 5. 派工、媒合與排程 | 預約精度 | 1 小時區間 + 師傅聯絡，工單要有客戶電話。 | 採用。客戶端顯示 1 小時區間，師傅接單後可電話聯絡，但改期必須回系統。 | 師傅電話聯絡是否需記錄結果？保留未來可記錄方式 | Dispatch assignment、schedule slot、acceptance SLA、reassignment reason | 派工主管 | 採用。客戶端顯示 1 小時區間，師傅接單後可電話聯絡，但改期必須回系統。 | M05,M07,M10 | Engineering 可依此列草擬 screens/workflow，但 final gates 需依 營運 review status。 |
| Q047 | D2 Service-to-Cash Core | M15 | M15 Exception / Approval / Risk Control（異常/核准/風控） | 5. 派工、媒合與排程 | 延遲 / 客戶不在 | 師傅延遲需直接打給客戶並在系統回報；急件需另派；客戶不在且師傅確認客戶無法到場，工單取消。 | Full 完整版本 需補明取消費 / 車馬費 / 是否新工單。 | 客戶不在是否收車馬費？可以要收 | Exception case、approval task、return path、risk flag、liability reason | 主管 / 派工主管 / 會計 | Full 完整版本 需補明取消費 / 車馬費 / 是否新工單。 | M04,M05,M08,M11,M13 | Engineering 必須建模 approvals 與 audit trail；不可 hardcode money 或 refund rules。 |
| Q048 | D2 Service-to-Cash Core | M05 | M05 WorkOrder Lifecycle & Status（工單生命週期與狀態） | 6. 工單狀態與生命週期 | 狀態機 | 先簡化，only admin can modify。 | Full 完整版本 用簡化前台狀態 + 內部細狀態；只有 admin / authorized role 可改核心狀態。 | 師傅可以改哪些狀態？現場需要臨時加價，其他通一打給客服 | WorkOrder、status history、state transition audit | 派工主管 / System process owner | Full 完整版本 用簡化前台狀態 + 內部細狀態；只有 admin / authorized role 可改核心狀態。 | M04,M06,M08,M15 | Engineering 可依此列草擬 screens/workflow，但 final gates 需依 營運 review status。 |
| Q049 | D2 Service-to-Cash Core | M05 | M05 WorkOrder Lifecycle & Status（工單生命週期與狀態） | 6. 工單狀態與生命週期 | 報價前狀態 | 與 ProblemCard 共用，Yes。 | 正確。Inquiry / ProblemCard status 與 quote gate 連動。 | 待照片、待報價是否都在 ProblemCard？不用，可以選擇跳過 | WorkOrder、status history、state transition audit | 派工主管 / System process owner | 正確。Inquiry / ProblemCard status 與 quote gate 連動。 | M04,M06,M08,M15 | Engineering 可依此列草擬 screens/workflow，但 final gates 需依 營運 review status。 |
| Q050 | D2 Service-to-Cash Core | M05 | M05 WorkOrder Lifecycle & Status（工單生命週期與狀態） | 6. 工單狀態與生命週期 | 報價到派工狀態 | 已報價、待客戶確認、待付款、已付款、待派工、派工中，全部。 | 正確。這是 Quote-to-Dispatch 狀態。 | 已付款是否一定在待派工之前？Yes | WorkOrder、status history、state transition audit | 派工主管 / System process owner | 正確。這是 Quote-to-Dispatch 狀態。 | M04,M06,M08,M15 | Engineering 可依此列草擬 screens/workflow，但 final gates 需依 營運 review status。 |
| Q051 | D2 Service-to-Cash Core | M05 | M05 WorkOrder Lifecycle & Status（工單生命週期與狀態） | 6. 工單狀態與生命週期 | 派工到上工狀態 | 已指派、待師傅接單、已接單、已改派、已取消、已到場、上工中；師傅按鈕含待接單、已接單、已改派、已取消、已到場。 | Full 完整版本 需清楚區分「派工狀態」與「師傅端按鈕」。 | 師傅是否可按已取消？不可以 | WorkOrder、status history、state transition audit | 派工主管 / System process owner | Full 完整版本 需清楚區分「派工狀態」與「師傅端按鈕」。 | M04,M06,M08,M15 | Engineering 可依此列草擬 screens/workflow，但 final gates 需依 營運 review status。 |
| Q052 | D2 Service-to-Cash Core | M05 | M05 WorkOrder Lifecycle & Status（工單生命週期與狀態） | 6. 工單狀態與生命週期 | 完工狀態 | 待完工回報、待照片、待客戶確認、待客服審核、已完工、已結案，全部。 | 正確。完工後進帳務前需客服 / 客戶 gate。 | 客服審核是否每單都要？ 每有客戶審核的，月底可以由客服批量審核 | WorkOrder、status history、state transition audit | 派工主管 / System process owner | 正確。完工後進帳務前需客服 / 客戶 gate。 | M04,M06,M08,M15 | Engineering 可依此列草擬 screens/workflow，但 final gates 需依 營運 review status。 |
| Q053 | D2 Service-to-Cash Core | M15 | M15 Exception / Approval / Risk Control（異常/核准/風控） | 6. 工單狀態與生命週期 | 異常狀態 | 現場異常、待客戶確認、待 locksmith 確認、待品牌確認、缺料、改期、取消、退款、爭議；異常等師傅、客戶、派工人確定，可能 cancel 並新建工單。 | Full 完整版本 建議異常不要全部自動 cancel；應先判斷 return path：回施工、改期、新工單、取消、退款、爭議。 | 哪些異常一定取消重開？錯誤材料, 不對現場資訊 | Exception case、approval task、return path、risk flag、liability reason | 主管 / 派工主管 / 會計 | Full 完整版本 建議異常不要全部自動 cancel；應先判斷 return path：回施工、改期、新工單、取消、退款、爭議。 | M04,M05,M08,M11,M13 | Engineering 必須建模 approvals 與 audit trail；不可 hardcode money 或 refund rules。 |
| Q054 | D5 Quality / After-sales（品質 / 售後） | M13 | M13 Complaint / Warranty / RMA / Quality（客訴/保固/RMA/品質） | 6. 工單狀態與生命週期 | 客訴售後狀態 | 一定獨立；獨立案件，但連同一住址與原工單可查詢。 | 正確。Full 完整版本 使用 RMA / Complaint Case。 | RMA 是否連原 ProblemCard？Yes | RMA case、warranty decision、liability split、corrective action、quality record | 客服主管 / 品牌商 | 正確。Full 完整版本 使用 RMA / Complaint Case。 | M02,M09,M10,M15 | Engineering 可依此列草擬 screens/workflow，但 final gates 需依 營運 review status。 |
| Q055 | D6 Governance / Platform Ops（治理 / 平台營運） | M17 | M17 Authorization / Security / Audit（權限/安全/Audit） | 6. 工單狀態與生命週期 | 狀態記錄 | 全部要 audit log。 | 正確。所有狀態變更需記錄操作者與時間。 | Audit 保存多久？2 years | Permission matrix、approval limit、audit event、data access boundary | Central admin / IT admin / 主管 | 正確。所有狀態變更需記錄操作者與時間。 | M09,M11,M14,M18 | Engineering 必須等 role/config/AI governance 確認後，才能做最終 workflow automation。 |
| Q056 | D2 Service-to-Cash Core | M08 | M08 Field Execution / Mobile Workflow（現場施工/行動流程） | 7. 現場上工、完工與交付 | 到場打卡 | GPS。 | Full 完整版本 採 GPS + 時間 + 可選照片，支援客戶不在與車馬費證據。 | GPS 是否所有師傅同意？They need to agree | Arrival proof、completion report、material usage、customer sign-off | 派工主管 / 師傅管理 | Full 完整版本 採 GPS + 時間 + 可選照片，支援客戶不在與車馬費證據。 | M05,M09,M10,M15 | Engineering 可依此列草擬 screens/workflow，但 final gates 需依 營運 review status。 |
| Q057 | D2 Service-to-Cash Core | M08 | M08 Field Execution / Mobile Workflow（現場施工/行動流程） | 7. 現場上工、完工與交付 | 施工前報價確認 | 可能加價時。 | 正確。標準案不重複確認，有加價 / 範圍變更才確認。 | 多少加價要客服介入？Any on site adding price, need customer agree and sign up final price change | Arrival proof、completion report、material usage、customer sign-off | 派工主管 / 師傅管理 | 正確。標準案不重複確認，有加價 / 範圍變更才確認。 | M05,M09,M10,M15 | Engineering 可依此列草擬 screens/workflow，但 final gates 需依 營運 review status。 |
| Q058 | D2 Service-to-Cash Core | M08 | M08 Field Execution / Mobile Workflow（現場施工/行動流程） | 7. 現場上工、完工與交付 | 外觀風險 | 所有案件，尤其特殊門。 | Full 完整版本 可做簡化：所有案件有基本外觀提醒，特殊門 / 開孔 / 切割需簽名。 | 是否所有案件都要簽外觀同意？YES | Arrival proof、completion report、material usage、customer sign-off | 派工主管 / 師傅管理 | Full 完整版本 可做簡化：所有案件有基本外觀提醒，特殊門 / 開孔 / 切割需簽名。 | M05,M09,M10,M15 | Engineering 可依此列草擬 screens/workflow，但 final gates 需依 營運 review status。 |
| Q059 | D2 Service-to-Cash Core | M08 | M08 Field Execution / Mobile Workflow（現場施工/行動流程） | 7. 現場上工、完工與交付 | 完工回報 | 施工內容、用料、照片、加價、收款、客戶簽名，全部。 | 還應加使用教學與保固說明。 | 使用教學是否必填？可以跳過，客戶要同意 | Arrival proof、completion report、material usage、customer sign-off | 派工主管 / 師傅管理 | 還應加使用教學與保固說明。 | M05,M09,M10,M15 | Engineering 可依此列草擬 screens/workflow，但 final gates 需依 營運 review status。 |
| Q060 | D2 Service-to-Cash Core | M08 | M08 Field Execution / Mobile Workflow（現場施工/行動流程） | 7. 現場上工、完工與交付 | 客戶簽名 | 一定要。 | 正確。Full 完整版本 完工 gate = 客戶簽名 / LINE 確認。 | 電子簽名形式？Line or sign on our web app | Arrival proof、completion report、material usage、customer sign-off | 派工主管 / 師傅管理 | 正確。Full 完整版本 完工 gate = 客戶簽名 / LINE 確認。 | M05,M09,M10,M15 | Engineering 可依此列草擬 screens/workflow，但 final gates 需依 營運 review status。 |
| Q061 | D2 Service-to-Cash Core | M08 | M08 Field Execution / Mobile Workflow（現場施工/行動流程） | 7. 現場上工、完工與交付 | 使用教學 | 新安裝要。 | 正確。新安裝需教學紀錄。 | 是否需要影片或 checklist？YES | Arrival proof、completion report、material usage、customer sign-off | 派工主管 / 師傅管理 | 正確。新安裝需教學紀錄。 | M05,M09,M10,M15 | Engineering 可依此列草擬 screens/workflow，但 final gates 需依 營運 review status。 |
| Q062 | D2 Service-to-Cash Core | M08 | M08 Field Execution / Mobile Workflow（現場施工/行動流程） | 7. 現場上工、完工與交付 | 誰確認結案 | 師傅 + 客服。 | Full 完整版本 建議：師傅提交完工，客服審核，客戶簽收，會計確認 AR。 | 客戶簽收是否也是結案 gate？YES, but allow customer service end those case in a monthly patch | Arrival proof、completion report、material usage、customer sign-off | 派工主管 / 師傅管理 | Full 完整版本 建議：師傅提交完工，客服審核，客戶簽收，會計確認 AR。 | M05,M09,M10,M15 | Engineering 可依此列草擬 screens/workflow，但 final gates 需依 營運 review status。 |
| Q063 | D2 Service-to-Cash Core | M08 | M08 Field Execution / Mobile Workflow（現場施工/行動流程） | 7. 現場上工、完工與交付 | 客戶未回覆自動結案 | 24 小時。 | 採用 前期：標準案件 24 小時；客訴、保固、退款、爭議不得自動。 | 24 小時是否太短？72 hours | Arrival proof、completion report、material usage、customer sign-off | 派工主管 / 師傅管理 | 採用 前期：標準案件 24 小時；客訴、保固、退款、爭議不得自動。 | M05,M09,M10,M15 | Engineering 可依此列草擬 screens/workflow，但 final gates 需依 營運 review status。 |
| Q064 | D2 Service-to-Cash Core | M15 | M15 Exception / Approval / Risk Control（異常/核准/風控） | 8. 現場異常、範圍變更與加價 | 異常分類 | 一定要，需要 identify。 | 正確。Full 完整版本 建立 exception taxonomy。 | 是否需要異常代碼？YES | Exception case、approval task、return path、risk flag、liability reason | 主管 / 派工主管 / 會計 | 正確。Full 完整版本 建立 exception taxonomy。 | M04,M05,M08,M11,M13 | Engineering 必須建模 approvals 與 audit trail；不可 hardcode money 或 refund rules。 |
| Q065 | D2 Service-to-Cash Core | M15 | M15 Exception / Approval / Risk Control（異常/核准/風控） | 8. 現場異常、範圍變更與加價 | 常見異常 | 門型不符、型號不符、舊鎖拆不下、額外開孔、缺料、客戶不在、產品故障、保固不明、客戶改需求，全部。 | 正確。另建議加入付款不符、師傅延遲、客戶未回覆。 | 是否增加付款不符？YES | Exception case、approval task、return path、risk flag、liability reason | 主管 / 派工主管 / 會計 | 正確。另建議加入付款不符、師傅延遲、客戶未回覆。 | M04,M05,M08,M11,M13 | Engineering 必須建模 approvals 與 audit trail；不可 hardcode money 或 refund rules。 |
| Q066 | D2 Service-to-Cash Core | M15 | M15 Exception / Approval / Risk Control（異常/核准/風控） | 8. 現場異常、範圍變更與加價 | 異常回報 | 1 選異常類型、2 填原因、3 填加價、4 打電話、5 等客服確認。 | Full 完整版本 應固定這個順序，並加照片。 | 是否所有異常都要照片？YES | Exception case、approval task、return path、risk flag、liability reason | 主管 / 派工主管 / 會計 | Full 完整版本 應固定這個順序，並加照片。 | M04,M05,M08,M11,M13 | Engineering 必須建模 approvals 與 audit trail；不可 hardcode money 或 refund rules。 |
| Q067 | D2 Service-to-Cash Core | M15 | M15 Exception / Approval / Risk Control（異常/核准/風控） | 8. 現場異常、範圍變更與加價 | 可繼續施工 | 師傅及客戶同意即可：客戶同意、加價同意。 | ERP 風險註解：低風險可師傅+客戶；高金額 / 品牌 / 保固需客服或主管。 | 哪些異常需主管？ALL | Exception case、approval task、return path、risk flag、liability reason | 主管 / 派工主管 / 會計 | ERP 風險註解：低風險可師傅+客戶；高金額 / 品牌 / 保固需客服或主管。 | M04,M05,M08,M11,M13 | Engineering 必須建模 approvals 與 audit trail；不可 hardcode money 或 refund rules。 |
| Q068 | D2 Service-to-Cash Core | M15 | M15 Exception / Approval / Risk Control（異常/核准/風控） | 8. 現場異常、範圍變更與加價 | 必須暫停 | 保固不明、產品故障、高風險開孔、客戶不同意、品牌責任、安全風險，全部；師傅聯絡客服確認後 stop and cancel work order。 | Full 完整版本 不應一律 cancel；先暫停，決定改期、重報價、取消或新工單。 | 暫停後是否自動取消？NO | Exception case、approval task、return path、risk flag、liability reason | 主管 / 派工主管 / 會計 | Full 完整版本 不應一律 cancel；先暫停，決定改期、重報價、取消或新工單。 | M04,M05,M08,M11,M13 | Engineering 必須建模 approvals 與 audit trail；不可 hardcode money 或 refund rules。 |
| Q069 | D2 Service-to-Cash Core | M15 | M15 Exception / Approval / Risk Control（異常/核准/風控） | 8. 現場異常、範圍變更與加價 | 加價前確認 | 師傅自行決定 + 客戶 + 客服。 | 建議表述為：師傅提出加價，客戶確認，客服留紀錄；師傅不可單獨決定最終收款。 | 加價是否需客服每次確認？YES | Exception case、approval task、return path、risk flag、liability reason | 主管 / 派工主管 / 會計 | 建議表述為：師傅提出加價，客戶確認，客服留紀錄；師傅不可單獨決定最終收款。 | M04,M05,M08,M11,M13 | Engineering 必須建模 approvals 與 audit trail；不可 hardcode money 或 refund rules。 |
| Q070 | D2 Service-to-Cash Core | M15 | M15 Exception / Approval / Risk Control（異常/核准/風控） | 8. 現場異常、範圍變更與加價 | 加價證據 | 客戶簽名。 | 正確。Full 完整版本 也可接受 LINE 按鈕 / 電子簽名。 | 電話確認是否可用？NO | Exception case、approval task、return path、risk flag、liability reason | 主管 / 派工主管 / 會計 | 正確。Full 完整版本 也可接受 LINE 按鈕 / 電子簽名。 | M04,M05,M08,M11,M13 | Engineering 必須建模 approvals 與 audit trail；不可 hardcode money 或 refund rules。 |
| Q071 | D2 Service-to-Cash Core | M15 | M15 Exception / Approval / Risk Control（異常/核准/風控） | 8. 現場異常、範圍變更與加價 | 客戶不同意加價 | 收檢測費、車馬費、客服協調、改期。 | Full 完整版本 需依責任歸屬決定收費；客戶原因可收，前期判斷錯誤需主管裁決。 | 檢測費 / 車馬費金額？By base | Exception case、approval task、return path、risk flag、liability reason | 主管 / 派工主管 / 會計 | Full 完整版本 需依責任歸屬決定收費；客戶原因可收，前期判斷錯誤需主管裁決。 | M04,M05,M08,M11,M13 | Engineering 必須建模 approvals 與 audit trail；不可 hardcode money 或 refund rules。 |
| Q072 | D2 Service-to-Cash Core | M15 | M15 Exception / Approval / Risk Control（異常/核准/風控） | 8. 現場異常、範圍變更與加價 | 減價折讓 | 師傅 + 派工，告知客服。 | ERP 風險註解：折讓會影響帳務，必須客服 / 派工留紀錄，超過門檻主管核准。 | 師傅可折讓上限？20% | Exception case、approval task、return path、risk flag、liability reason | 主管 / 派工主管 / 會計 | ERP 風險註解：折讓會影響帳務，必須客服 / 派工留紀錄，超過門檻主管核准。 | M04,M05,M08,M11,M13 | Engineering 必須建模 approvals 與 audit trail；不可 hardcode money 或 refund rules。 |
| Q073 | D6 Governance / Platform Ops（治理 / 平台營運） | M16 | M16 Communication / Notification / Conversation（溝通/通知/對話） | 9. 聊天群組、通知與紀錄 | 工單溝通空間 | 未填。 | Full 完整版本 需要客戶頻道、內部派工頻道、品牌商頻道、會計備註、售後客訴頻道。 | 是否仍保留 LINE 群同步？YES | Conversation record、notification task、message visibility rule | 客服主管 / Ops owner | Full 完整版本 需要客戶頻道、內部派工頻道、品牌商頻道、會計備註、售後客訴頻道。 | M01,M03,M05,M17 | Engineering 可依此列草擬 screens/workflow，但 final gates 需依 營運 review status。 |
| Q074 | D6 Governance / Platform Ops（治理 / 平台營運） | M16 | M16 Communication / Notification / Conversation（溝通/通知/對話） | 9. 聊天群組、通知與紀錄 | 客戶可否聯絡師傅 | 可以電話。 | 採用，但改價、改期、取消必須回系統記錄。 | 客戶可否加師傅 LINE？No | Conversation record、notification task、message visibility rule | 客服主管 / Ops owner | 採用，但改價、改期、取消必須回系統記錄。 | M01,M03,M05,M17 | Engineering 可依此列草擬 screens/workflow，但 final gates 需依 營運 review status。 |
| Q075 | D6 Governance / Platform Ops（治理 / 平台營運） | M16 | M16 Communication / Notification / Conversation（溝通/通知/對話） | 9. 聊天群組、通知與紀錄 | 品牌商看聊天 | 只看品牌案件。 | 正確。品牌商不可看其他品牌或內部成本。 | 品牌商可看客戶聊天全文嗎？YES | Conversation record、notification task、message visibility rule | 客服主管 / Ops owner | 正確。品牌商不可看其他品牌或內部成本。 | M01,M03,M05,M17 | Engineering 可依此列草擬 screens/workflow，但 final gates 需依 營運 review status。 |
| Q076 | D6 Governance / Platform Ops（治理 / 平台營運） | M16 | M16 Communication / Notification / Conversation（溝通/通知/對話） | 9. 聊天群組、通知與紀錄 | 自動寫入工單訊息 | 報價只寫客戶實收，不寫 internal quotation；付款、派工、接單、改期、異常、加價、完工、客訴、退款都寫入。 | 正確。Quote note 要區分 external price 與 internal cost。 | 客戶端是否可查所有歷史？NO | Conversation record、notification task、message visibility rule | 客服主管 / Ops owner | 正確。Quote note 要區分 external price 與 internal cost。 | M01,M03,M05,M17 | Engineering 可依此列草擬 screens/workflow，但 final gates 需依 營運 review status。 |
| Q077 | D6 Governance / Platform Ops（治理 / 平台營運） | M17 | M17 Authorization / Security / Audit（權限/安全/Audit） | 9. 聊天群組、通知與紀錄 | 內部資訊 | 內部成本、師傅工資、品牌成本、責任、折讓、會計備註全內部；客戶只看工單 + 客戶實收金額 + 時間 + 簽收。 | 這是 Full 完整版本 權限核心。 | 師傅可否看客戶實收？YES | Permission matrix、approval limit、audit event、data access boundary | Central admin / IT admin / 主管 | 這是 Full 完整版本 權限核心。 | M09,M11,M14,M18 | Engineering 必須等 role/config/AI governance 確認後，才能做最終 workflow automation。 |
| Q078 | D6 Governance / Platform Ops（治理 / 平台營運） | M16 | M16 Communication / Notification / Conversation（溝通/通知/對話） | 9. 聊天群組、通知與紀錄 | 通知 | 補照片、報價確認、付款、派工、接單逾時、改期、延遲、完工、客訴、月結；每月 5 號通知派工人與客服，師傅下載月結單。 | Full 完整版本 通知中心需按角色推送。 | 月結通知日是否固定每月 5 號？YES | Conversation record、notification task、message visibility rule | 客服主管 / Ops owner | Full 完整版本 通知中心需按角色推送。 | M01,M03,M05,M17 | Engineering 可依此列草擬 screens/workflow，但 final gates 需依 營運 review status。 |
| Q079 | D3 Workforce / Supply（師傅人力 / 供應） | M10 | M10 Product / Brand / BOM / Inventory（品牌商品/BOM/庫存） | 10. BOM、料件、庫存與品牌資料 | 品牌型號資料庫 | 先做常用品牌：Chatlock、大內高手。 | Full 完整版本 仍可先從常用品牌建完整主檔，再逐步補全。 | 第一批品牌清單是否只有這兩個？Will include more | Product master、BOM、material reservation、usage record、inventory exception | 品牌 / 庫存管理 / 派工 | Full 完整版本 仍可先從常用品牌建完整主檔，再逐步補全。 | M06,M08,M12,M13 | Engineering 可依此列草擬 screens/workflow，但 final gates 需依 營運 review status。 |
| Q080 | D3 Workforce / Supply（師傅人力 / 供應） | M10 | M10 Product / Brand / BOM / Inventory（品牌商品/BOM/庫存） | 10. BOM、料件、庫存與品牌資料 | 每品牌型號 BOM | 一定要；品牌、型號、相對應零件一覽表。 | Full 完整版本 BOM 是派工與用料基礎。 | BOM 誰維護？品牌商還是派工？品牌商＋派工 | Product master、BOM、material reservation、usage record、inventory exception | 品牌 / 庫存管理 / 派工 | Full 完整版本 BOM 是派工與用料基礎。 | M06,M08,M12,M13 | Engineering 可依此列草擬 screens/workflow，但 final gates 需依 營運 review status。 |
| Q081 | D3 Workforce / Supply（師傅人力 / 供應） | M10 | M10 Product / Brand / BOM / Inventory（品牌商品/BOM/庫存） | 10. BOM、料件、庫存與品牌資料 | BOM 料件 | 型號下有主鎖、鎖體、鎖芯、把手、門扣板、螺絲包、墊片、電池、感應卡、轉接件、工具；Two layers only。 | 採兩層：品牌型號 → 料件清單。符合你不想超過 2-3 層的要求。 | 是否需要第三層規格替代料？No | Product master、BOM、material reservation、usage record、inventory exception | 品牌 / 庫存管理 / 派工 | 採兩層：品牌型號 → 料件清單。符合你不想超過 2-3 層的要求。 | M06,M08,M12,M13 | Engineering 可依此列草擬 screens/workflow，但 final gates 需依 營運 review status。 |
| Q082 | D3 Workforce / Supply（師傅人力 / 供應） | M10 | M10 Product / Brand / BOM / Inventory（品牌商品/BOM/庫存） | 10. BOM、料件、庫存與品牌資料 | 料件歸屬 | 品牌商提供、師傅自備。 | Full 完整版本 還應允許公司提供、客戶自備，否則帳務無法完整。 | 公司是否也有庫存料？應允許公司提供、客戶自備，否則帳務無法完整。 | Product master、BOM、material reservation、usage record、inventory exception | 品牌 / 庫存管理 / 派工 | Full 完整版本 還應允許公司提供、客戶自備，否則帳務無法完整。 | M06,M08,M12,M13 | Engineering 可依此列草擬 screens/workflow，但 final gates 需依 營運 review status。 |
| Q083 | D3 Workforce / Supply（師傅人力 / 供應） | M10 | M10 Product / Brand / BOM / Inventory（品牌商品/BOM/庫存） | 10. BOM、料件、庫存與品牌資料 | 派工前庫存確認 | 一定要，但不需阻擋，只需備著。 | Full 完整版本 採 soft gate：提醒與備料，不預設阻擋；高價/保固件可 hard gate。 | 哪些料件無料不得派？可以跳過，都可以派 | Product master、BOM、material reservation、usage record、inventory exception | 品牌 / 庫存管理 / 派工 | Full 完整版本 採 soft gate：提醒與備料，不預設阻擋；高價/保固件可 hard gate。 | M06,M08,M12,M13 | Engineering 可依此列草擬 screens/workflow，但 final gates 需依 營運 review status。 |
| Q084 | D3 Workforce / Supply（師傅人力 / 供應） | M10 | M10 Product / Brand / BOM / Inventory（品牌商品/BOM/庫存） | 10. BOM、料件、庫存與品牌資料 | 現場用料登記 | 選料件、拍照；BOM 帶出，打勾，加照片。 | 正確。用料回報應由 BOM checklist 帶出。 | 是否需要填數量與金額？要 | Product master、BOM、material reservation、usage record、inventory exception | 品牌 / 庫存管理 / 派工 | 正確。用料回報應由 BOM checklist 帶出。 | M06,M08,M12,M13 | Engineering 可依此列草擬 screens/workflow，但 final gates 需依 營運 review status。 |
| Q085 | D3 Workforce / Supply（師傅人力 / 供應） | M10 | M10 Product / Brand / BOM / Inventory（品牌商品/BOM/庫存） | 10. BOM、料件、庫存與品牌資料 | 序號綁工單 | 主鎖一定要、保固件要。 | 正確。高價件也建議綁序號。 | 鎖體 / 主機板是否要序號？YEAS | Product master、BOM、material reservation、usage record、inventory exception | 品牌 / 庫存管理 / 派工 | 正確。高價件也建議綁序號。 | M06,M08,M12,M13 | Engineering 可依此列草擬 screens/workflow，但 final gates 需依 營運 review status。 |
| Q086 | D3 Workforce / Supply（師傅人力 / 供應） | M10 | M10 Product / Brand / BOM / Inventory（品牌商品/BOM/庫存） | 10. BOM、料件、庫存與品牌資料 | 退換瑕疵料 | 師傅退回、品牌回收；師傅 + 派工人負責。 | Full 完整版本 需定義期限、照片、退回狀態。 | 幾天內退回？3 days | Product master、BOM、material reservation、usage record、inventory exception | 品牌 / 庫存管理 / 派工 | Full 完整版本 需定義期限、照片、退回狀態。 | M06,M08,M12,M13 | Engineering 可依此列草擬 screens/workflow，但 final gates 需依 營運 review status。 |
| Q087 | D3 Workforce / Supply（師傅人力 / 供應） | M10 | M10 Product / Brand / BOM / Inventory（品牌商品/BOM/庫存） | 10. BOM、料件、庫存與品牌資料 | 材料費入帳 | 品牌吸收、公司吸收、月結扣款、向客戶收，all possible。 | Full 完整版本 需每個料件選費用歸屬，連到客戶帳、品牌帳或師傅帳。 | 預設材料費由誰負擔？派工/品牌商 | Product master、BOM、material reservation、usage record、inventory exception | 品牌 / 庫存管理 / 派工 | Full 完整版本 需每個料件選費用歸屬，連到客戶帳、品牌帳或師傅帳。 | M06,M08,M12,M13 | Engineering 可依此列草擬 screens/workflow，但 final gates 需依 營運 review status。 |
| Q088 | D4 Finance / Settlement（財務 / 結算） | M11 | M11 Customer Payment / AR / Refund（客戶付款/AR/退款） | 11. 付款、退款、代收與月結 | 付款方式 | 轉帳、現金、LINE Pay、平台代收、師傅代收；前文另有信用卡與 web link。 | Full 完整版本 支援全部：信用卡、轉帳末五碼、現金、LINE Pay、平台代收、師傅代收、品牌月結、付款連結。 | 信用卡由平台還是師傅現場收？Onsite and pltform | Customer ledger、payment proof、AR status、refund request、invoice requirement | 會計 / 主管 | Full 完整版本 支援全部：信用卡、轉帳末五碼、現金、LINE Pay、平台代收、師傅代收、品牌月結、付款連結。 | M04,M12,M15 | Engineering 必須建模 approvals 與 audit trail；不可 hardcode money 或 refund rules。 |
| Q089 | D4 Finance / Settlement（財務 / 結算） | M11 | M11 Customer Payment / AR / Refund（客戶付款/AR/退款） | 11. 付款、退款、代收與月結 | 事前付款 | 高金額、急件、新客戶，需在 quotation 定義。 | 正確。付款條件是 quote rule。 | 高金額門檻是多少？20000NTD | Customer ledger、payment proof、AR status、refund request、invoice requirement | 會計 / 主管 | 正確。付款條件是 quote rule。 | M04,M12,M15 | Engineering 必須建模 approvals 與 audit trail；不可 hardcode money 或 refund rules。 |
| Q090 | D4 Finance / Settlement（財務 / 結算） | M11 | M11 Customer Payment / AR / Refund（客戶付款/AR/退款） | 11. 付款、退款、代收與月結 | 事後付款 | 熟客、品牌月結、低金額、保固，需在 internal quotation 定義。 | 正確。事後付款要連未收款報表。 | 熟客標準？客服可定義 | Customer ledger、payment proof、AR status、refund request、invoice requirement | 會計 / 主管 | 正確。事後付款要連未收款報表。 | M04,M12,M15 | Engineering 必須建模 approvals 與 audit trail；不可 hardcode money 或 refund rules。 |
| Q091 | D4 Finance / Settlement（財務 / 結算） | M12 | M12 AP / Commission / Monthly Settlement（AP/抽成/月結） | 11. 付款、退款、代收與月結 | 師傅代收 | 可以；只限現金、特定師傅、低金額可；月結。 | Full 完整版本 需代收核銷與月結抵扣。 | 代收上限金額？No limit | Technician statement、partner statement、brand settlement、payable amount | 會計 / Settlement owner | Full 完整版本 需代收核銷與月結抵扣。 | M07,M11,M14 | Engineering 必須建模 approvals 與 audit trail；不可 hardcode money 或 refund rules。 |
| Q092 | D4 Finance / Settlement（財務 / 結算） | M11 | M11 Customer Payment / AR / Refund（客戶付款/AR/退款） | 11. 付款、退款、代收與月結 | 取消費 | 仍需決策。 | Full 完整版本 必須主管拍板：付款後、當日、師傅出發後、到場後的取消費。 | 請主管定金額。 | Customer ledger、payment proof、AR status、refund request、invoice requirement | 會計 / 主管 | Full 完整版本 必須主管拍板：付款後、當日、師傅出發後、到場後的取消費。 | M04,M12,M15 | Engineering 必須建模 approvals 與 audit trail；不可 hardcode money 或 refund rules。 |
| Q093 | D4 Finance / Settlement（財務 / 結算） | M12 | M12 AP / Commission / Monthly Settlement（AP/抽成/月結） | 11. 付款、退款、代收與月結 | 車馬費 | 師傅到場才收；師傅 + 派工人 + 客戶。 | Full 完整版本 可定為到場費 / 車馬費，需明確誰收誰得款。 | 車馬費固定還是依地區？All different | Technician statement、partner statement、brand settlement、payable amount | 會計 / Settlement owner | Full 完整版本 可定為到場費 / 車馬費，需明確誰收誰得款。 | M07,M11,M14 | Engineering 必須建模 approvals 與 audit trail；不可 hardcode money 或 refund rules。 |
| Q094 | D4 Finance / Settlement（財務 / 結算） | M11 | M11 Customer Payment / AR / Refund（客戶付款/AR/退款） | 11. 付款、退款、代收與月結 | 退款核准 | 仍需決策。 | 建議依金額分層：客服主管、主管、會計 / 雙簽、品牌商參與。 | 退款門檻要定。不要訂，都退 | Customer ledger、payment proof、AR status、refund request、invoice requirement | 會計 / 主管 | 建議依金額分層：客服主管、主管、會計 / 雙簽、品牌商參與。 | M04,M12,M15 | Engineering 必須建模 approvals 與 audit trail；不可 hardcode money 或 refund rules。 |
| Q095 | D4 Finance / Settlement（財務 / 結算） | M11 | M11 Customer Payment / AR / Refund（客戶付款/AR/退款） | 11. 付款、退款、代收與月結 | 部分退款 | 人工計算。 | Full 完整版本 可以人工計算，但系統需欄位：退產品費、工資、材料、扣車馬、扣檢測。 | 哪些項目永不退款？沒有 | Customer ledger、payment proof、AR status、refund request、invoice requirement | 會計 / 主管 | Full 完整版本 可以人工計算，但系統需欄位：退產品費、工資、材料、扣車馬、扣檢測。 | M04,M12,M15 | Engineering 必須建模 approvals 與 audit trail；不可 hardcode money 或 refund rules。 |
| Q096 | D4 Finance / Settlement（財務 / 結算） | M12 | M12 AP / Commission / Monthly Settlement（AP/抽成/月結） | 11. 付款、退款、代收與月結 | 客訴期間付款給師傅 | 只暫停爭議金額。 | 正確。避免整單暫扣傷害師傅關係。 | 責任未定多久後主管介入？1 day | Technician statement、partner statement、brand settlement、payable amount | 會計 / Settlement owner | 正確。避免整單暫扣傷害師傅關係。 | M07,M11,M14 | Engineering 必須建模 approvals 與 audit trail；不可 hardcode money 或 refund rules。 |
| Q097 | D4 Finance / Settlement（財務 / 結算） | M12 | M12 AP / Commission / Monthly Settlement（AP/抽成/月結） | 11. 付款、退款、代收與月結 | 師傅月結欄位 | 工單號、日期、服務類型、工資、加價、材料、代收、扣款、暫扣。 | 建議加備註、客訴 / 返修、實撥金額。 | 師傅是否可下載 Excel？Only for monthly AR | Technician statement、partner statement、brand settlement、payable amount | 會計 / Settlement owner | 建議加備註、客訴 / 返修、實撥金額。 | M07,M11,M14 | Engineering 必須建模 approvals 與 audit trail；不可 hardcode money 或 refund rules。 |
| Q098 | D4 Finance / Settlement（財務 / 結算） | M12 | M12 AP / Commission / Monthly Settlement（AP/抽成/月結） | 11. 付款、退款、代收與月結 | 品牌商月結欄位 | 填入類似師傅月結欄位。 | Full 完整版本 應另定品牌月結：工單號、品牌、型號、服務、品牌價、材料、退款、客訴、發票。 | 品牌商是否看工資？Ok | Technician statement、partner statement、brand settlement、payable amount | 會計 / Settlement owner | Full 完整版本 應另定品牌月結：工單號、品牌、型號、服務、品牌價、材料、退款、客訴、發票。 | M07,M11,M14 | Engineering 必須建模 approvals 與 audit trail；不可 hardcode money 或 refund rules。 |
| Q099 | D4 Finance / Settlement（財務 / 結算） | M11 | M11 Customer Payment / AR / Refund（客戶付款/AR/退款） | 11. 付款、退款、代收與月結 | 發票 | 依案件；B2C 平台，B2B 派工人。 | 採用。Full 完整版本 發票規則按 B2C / B2B / 品牌 / 建商切分。 | 建商專案誰開票？客服 | Customer ledger、payment proof、AR status、refund request、invoice requirement | 會計 / 主管 | 採用。Full 完整版本 發票規則按 B2C / B2B / 品牌 / 建商切分。 | M04,M12,M15 | Engineering 必須建模 approvals 與 audit trail；不可 hardcode money 或 refund rules。 |
| Q100 | D5 Quality / After-sales（品質 / 售後） | M13 | M13 Complaint / Warranty / RMA / Quality（客訴/保固/RMA/品質） | 12. 客訴、售後、保固與爭議 | 客訴獨立案件 | 一定要，RMA + date / month serial number。 | 正確。Full 完整版本 建立 RMA 售後案件編號。 | RMA 格式：RMA-YYYYMM-流水號？OK | RMA case、warranty decision、liability split、corrective action、quality record | 客服主管 / 品牌商 | 正確。Full 完整版本 建立 RMA 售後案件編號。 | M02,M09,M10,M15 | Engineering 可依此列草擬 screens/workflow，但 final gates 需依 營運 review status。 |
| Q101 | D5 Quality / After-sales（品質 / 售後） | M13 | M13 Complaint / Warranty / RMA / Quality（客訴/保固/RMA/品質） | 12. 客訴、售後、保固與爭議 | 客訴分類 | 施工品質、產品故障、報價爭議、師傅態度、延遲、未完成、教學不足、付款爭議、保固爭議，全部。 | 正確。分類連責任矩陣。 | 是否增加「缺料延誤」分類？YES | RMA case、warranty decision、liability split、corrective action、quality record | 客服主管 / 品牌商 | 正確。分類連責任矩陣。 | M02,M09,M10,M15 | Engineering 可依此列草擬 screens/workflow，但 final gates 需依 營運 review status。 |
| Q102 | D5 Quality / After-sales（品質 / 售後） | M13 | M13 Complaint / Warranty / RMA / Quality（客訴/保固/RMA/品質） | 12. 客訴、售後、保固與爭議 | 責任初判 | 產品-品牌商；安裝-師傅/品牌商/派工人；客戶使用-品牌商；環境-師傅；客服報價-品牌商/派工人；派工錯誤-派工人/平台；缺料延誤-品牌商/師傅。 | Full 完整版本 需責任矩陣，避免客訴只靠人工印象。 | 缺料延誤優先責任怎麼判？派工，客服，師傅 | RMA case、warranty decision、liability split、corrective action、quality record | 客服主管 / 品牌商 | Full 完整版本 需責任矩陣，避免客訴只靠人工印象。 | M02,M09,M10,M15 | Engineering 可依此列草擬 screens/workflow，但 final gates 需依 營運 review status。 |
| Q103 | D5 Quality / After-sales（品質 / 售後） | M13 | M13 Complaint / Warranty / RMA / Quality（客訴/保固/RMA/品質） | 12. 客訴、售後、保固與爭議 | 產品問題 | 依序：品牌商、公司、師傅、客戶、依保固。 | 採用。產品問題先看品牌與保固，再看公司和師傅。 | 公司何時吸收？換新機，或補貨 | RMA case、warranty decision、liability split、corrective action、quality record | 客服主管 / 品牌商 | 採用。產品問題先看品牌與保固，再看公司和師傅。 | M02,M09,M10,M15 | Engineering 可依此列草擬 screens/workflow，但 final gates 需依 營運 review status。 |
| Q104 | D5 Quality / After-sales（品質 / 售後） | M13 | M13 Complaint / Warranty / RMA / Quality（客訴/保固/RMA/品質） | 12. 客訴、售後、保固與爭議 | 安裝問題 | 原師傅、品牌商、客服、依原因。 | Full 完整版本 預設原師傅負責，若品牌安裝規範問題或客服報價錯誤則轉責任。 | 原師傅是否一定返修？不用 | RMA case、warranty decision、liability split、corrective action、quality record | 客服主管 / 品牌商 | Full 完整版本 預設原師傅負責，若品牌安裝規範問題或客服報價錯誤則轉責任。 | M02,M09,M10,M15 | Engineering 可依此列草擬 screens/workflow，但 final gates 需依 營運 review status。 |
| Q105 | D5 Quality / After-sales（品質 / 售後） | M13 | M13 Complaint / Warranty / RMA / Quality（客訴/保固/RMA/品質） | 12. 客訴、售後、保固與爭議 | 客戶使用問題 | 收教學費、收車馬費、首次免費、保固內免費，給 price range。 | Full 完整版本 建議按保固 / 首次 / 是否到場分費用。 | 首次免費限幾天內？依品牌定義 | RMA case、warranty decision、liability split、corrective action、quality record | 客服主管 / 品牌商 | Full 完整版本 建議按保固 / 首次 / 是否到場分費用。 | M02,M09,M10,M15 | Engineering 可依此列草擬 screens/workflow，但 final gates 需依 營運 review status。 |
| Q106 | D5 Quality / After-sales（品質 / 售後） | M13 | M13 Complaint / Warranty / RMA / Quality（客訴/保固/RMA/品質） | 12. 客訴、售後、保固與爭議 | 客訴結果 | 返修、折讓、退款、換貨、重新派工、拒絕客訴、升級主管；都可能影響原工單金額。 | 正確。每個結果要連帳務調整。 | 哪些結果需要主管核准？返修、折讓、退款、換貨、重新派工、拒絕客訴、升級主管；都可能影響原工單金額。 | RMA case、warranty decision、liability split、corrective action、quality record | 客服主管 / 品牌商 | 正確。每個結果要連帳務調整。 | M02,M09,M10,M15 | Engineering 可依此列草擬 screens/workflow，但 final gates 需依 營運 review status。 |
| Q107 | D5 Quality / After-sales（品質 / 售後） | M13 | M13 Complaint / Warranty / RMA / Quality（客訴/保固/RMA/品質） | 12. 客訴、售後、保固與爭議 | 保固期判斷 | 購買日期 + 序號。 | Full 完整版本 採購買日期 + 序號；建商案可能另有點交日期，需要規則補充。 | 建商案是否採點交日？Define by 建商 | RMA case、warranty decision、liability split、corrective action、quality record | 客服主管 / 品牌商 | Full 完整版本 採購買日期 + 序號；建商案可能另有點交日期，需要規則補充。 | M02,M09,M10,M15 | Engineering 可依此列草擬 screens/workflow，但 final gates 需依 營運 review status。 |
| Q108 | D5 Quality / After-sales（品質 / 售後） | M13 | M13 Complaint / Warranty / RMA / Quality（客訴/保固/RMA/品質） | 12. 客訴、售後、保固與爭議 | 保固返修派工 | 優先原師傅。 | 採用，但若原師傅被客訴或客戶拒絕，派資深師傅。 | 例外條件？採用，但若原師傅被客訴或客戶拒絕，派資深師傅, but if there is no any other locksmith, still can do it | RMA case、warranty decision、liability split、corrective action、quality record | 客服主管 / 品牌商 | 採用，但若原師傅被客訴或客戶拒絕，派資深師傅。 | M02,M09,M10,M15 | Engineering 可依此列草擬 screens/workflow，但 final gates 需依 營運 review status。 |
| Q109 | D5 Quality / After-sales（品質 / 售後） | M13 | M13 Complaint / Warranty / RMA / Quality（客訴/保固/RMA/品質） | 12. 客訴、售後、保固與爭議 | 客訴證據 | 完工照、聊天紀錄、報價、加價確認、客戶簽名、付款紀錄。 | 建議加施工前照片與品牌判斷，否則責任不足。 | 缺施工前照是否能扣師傅？NO | RMA case、warranty decision、liability split、corrective action、quality record | 客服主管 / 品牌商 | 建議加施工前照片與品牌判斷，否則責任不足。 | M02,M09,M10,M15 | Engineering 可依此列草擬 screens/workflow，但 final gates 需依 營運 review status。 |
| Q110 | D6 Governance / Platform Ops（治理 / 平台營運） | M17 | M17 Authorization / Security / Audit（權限/安全/Audit） | 13. 權限、後台、報表與稽核 | 角色權限 | 客服 all、派工 all、師傅 can only modify price、品牌商 all、會計 all、主管 all、管理員 all。 | ERP 風險註解：Full 完整版本 可以支援所有角色，但不建議品牌商 / 師傅 all access。需改成可看 / 可改矩陣。 | 品牌商 all 是否真的允許？客服 all、派工 only on their own orders、師傅 can only modify price、品牌商 all only their own brand work orders 、會計 all、主管 all、管理員 all。 | Permission matrix、approval limit、audit event、data access boundary | Central admin / IT admin / 主管 | ERP 風險註解：Full 完整版本 可以支援所有角色，但不建議品牌商 / 師傅 all access。需改成可看 / 可改矩陣。 | M09,M11,M14,M18 | Engineering 必須等 role/config/AI governance 確認後，才能做最終 workflow automation。 |
| Q111 | D6 Governance / Platform Ops（治理 / 平台營運） | M17 | M17 Authorization / Security / Audit（權限/安全/Audit） | 13. 權限、後台、報表與稽核 | 品牌商資料 | all。 | 風險很高。建議品牌商只看品牌案件、照片、保固、客訴、月結，不看內部價格與其他品牌。 | 品牌商可否看內部工資？師傅工資 Only | Permission matrix、approval limit、audit event、data access boundary | Central admin / IT admin / 主管 | 風險很高。建議品牌商只看品牌案件、照片、保固、客訴、月結，不看內部價格與其他品牌。 | M09,M11,M14,M18 | Engineering 必須等 role/config/AI governance 確認後，才能做最終 workflow automation。 |
| Q112 | D6 Governance / Platform Ops（治理 / 平台營運） | M17 | M17 Authorization / Security / Audit（權限/安全/Audit） | 13. 權限、後台、報表與稽核 | 師傅資料 | all。 | 風險高。建議師傅看自己案件、客戶必要資料、照片、報價總額、付款狀態、月結，不看品牌成本與他人案件。 | 師傅可否看內部報價？Only for their own work orders | Permission matrix、approval limit、audit event、data access boundary | Central admin / IT admin / 主管 | 風險高。建議師傅看自己案件、客戶必要資料、照片、報價總額、付款狀態、月結，不看品牌成本與他人案件。 | M09,M11,M14,M18 | Engineering 必須等 role/config/AI governance 確認後，才能做最終 workflow automation。 |
| Q113 | D6 Governance / Platform Ops（治理 / 平台營運） | M17 | M17 Authorization / Security / Audit（權限/安全/Audit） | 13. 權限、後台、報表與稽核 | 會計資料 | all。 | 會計可看財務全資料，但不應隨意改施工流程狀態。 | 會計可改工單狀態嗎？No | Permission matrix、approval limit、audit event、data access boundary | Central admin / IT admin / 主管 | 會計可看財務全資料，但不應隨意改施工流程狀態。 | M09,M11,M14,M18 | Engineering 必須等 role/config/AI governance 確認後，才能做最終 workflow automation。 |
| Q114 | D6 Governance / Platform Ops（治理 / 平台營運） | M17 | M17 Authorization / Security / Audit（權限/安全/Audit） | 13. 權限、後台、報表與稽核 | 稽核事件 | all。 | 正確。所有報價、改價、退款、派工、改派、取消、客訴責任、月結、權限變更都 audit。 | 保存期限？1 year | Permission matrix、approval limit、audit event、data access boundary | Central admin / IT admin / 主管 | 正確。所有報價、改價、退款、派工、改派、取消、客訴責任、月結、權限變更都 audit。 | M09,M11,M14,M18 | Engineering 必須等 role/config/AI governance 確認後，才能做最終 workflow automation。 |
| Q115 | D6 Governance / Platform Ops（治理 / 平台營運） | M19 | M19 Reporting / BI / KPI | 13. 權限、後台、報表與稽核 | 後台報表 | all。 | Full 完整版本 全部報表列入：工單、派工、客訴、退款、師傅績效、月結、庫存、品牌。 | 報表權限如何切？Full 完整版本 全部報表列入：工單、派工、客訴、退款、師傅績效、月結、庫存、品牌。Pls open system for final setting | Dashboard、export、KPI definition、operational report | 主管 / BI owner | Full 完整版本 全部報表列入：工單、派工、客訴、退款、師傅績效、月結、庫存、品牌。 | M06,M07,M11,M12,M13 | Engineering 可依此列草擬 screens/workflow，但 final gates 需依 營運 review status。 |
| Q116 | D6 Governance / Platform Ops（治理 / 平台營運） | M19 | M19 Reporting / BI / KPI | 13. 權限、後台、報表與稽核 | KPI | all。 | Full 完整版本 KPI 全部列入：派工時間、接單率、準時率、完工率、客訴率、返修率、退款率、毛利、未收款。 | KPI 公式誰定義？派工，品牌商 | Dashboard、export、KPI definition、operational report | 主管 / BI owner | Full 完整版本 KPI 全部列入：派工時間、接單率、準時率、完工率、客訴率、返修率、退款率、毛利、未收款。 | M06,M07,M11,M12,M13 | Engineering 可依此列草擬 screens/workflow，但 final gates 需依 營運 review status。 |
| Q117 | D6 Governance / Platform Ops（治理 / 平台營運） | M18 | M18 System Setup / Master Configuration / IT Ops（系統設定/主檔配置/IT Ops） | 14. 輸出與主管決策 | 訪談後輸出 | all：現行流程圖、未來流程圖、狀態表、權限表、ProblemCard、派工、報價、異常、帳務、BOM。 | 正確。Full 完整版本 需全部輸出為 business contract。 | 要先產哪三份？All ；未來流程圖、ProblemCard、派工、報價、 | System configuration、master setup、change request、support ticket | System admin / IT support（系統管理 / IT 支援） | 正確。Full 完整版本 需全部輸出為 business contract。 | 全部模組 | Engineering 必須等 role/config/AI governance 確認後，才能做最終 workflow automation。 |
| Q118 | D6 Governance / Platform Ops（治理 / 平台營運） | M18 | M18 System Setup / Master Configuration / IT Ops（系統設定/主檔配置/IT Ops） | 14. 輸出與主管決策 | 必做功能 | ProblemCard、報價、派工、師傅接單、異常回報、付款、客訴、照片回報、月結。 | 因本版不分 Phase I launch scope，這些全部列入 Full 完整版本 目標。 | 是否還缺品牌入口與庫存？YES | System configuration、master setup、change request、support ticket | System admin / IT support（系統管理 / IT 支援） | 因本版不分 Phase I launch scope，這些全部列入 Full 完整版本 目標。 | 全部模組 | Engineering 必須等 role/config/AI governance 確認後，才能做最終 workflow automation。 |
| Q119 | D6 Governance / Platform Ops（治理 / 平台營運） | M20 | M20 AI Operations / Knowledge Governance（AI Ops / 知識治理） | 14. 輸出與主管決策 | 可暫緩功能 | 原填進階 KPI、AI 自動報價。 | 本次已取消暫緩概念。改為：Full 完整版本 全部納入，只標示「需主管決策」或「需詳細規格」。AI 自動報價仍限草稿 / 區間。 | 是否同意不再列 defer？YES | AI policy、knowledge article、escalation rule、AI quality review | AI ops owner / 客服主管 | 本次已取消暫緩概念。改為：Full 完整版本 全部納入，只標示「需主管決策」或「需詳細規格」。AI 自動報價仍限草稿 / 區間。 | M03,M04,M16,M18 | Engineering 必須等 role/config/AI governance 確認後，才能做最終 workflow automation。 |
| Q120 | D6 Governance / Platform Ops（治理 / 平台營運） | M18 | M18 System Setup / Master Configuration / IT Ops（系統設定/主檔配置/IT Ops） | 14. 輸出與主管決策 | 交技術前必決策 | 價格、加價、退款、師傅工資、派工模式、客訴責任、品牌權限、月結；期限 end of May。 | 正確。Full 完整版本 的 P0 決策清單。 | End of May 是否仍是期限？YES | System configuration、master setup、change request、support ticket | System admin / IT support（系統管理 / IT 支援） | 正確。Full 完整版本 的 P0 決策清單。 | 全部模組 | Engineering 必須等 role/config/AI governance 確認後，才能做最終 workflow automation。 |
| Q121 | D6 Governance / Platform Ops（治理 / 平台營運） | M18 | M18 System Setup / Master Configuration / IT Ops（系統設定/主檔配置/IT Ops） | 14. 輸出與主管決策 | 主管拍板 | all：價格表、師傅扣款、退款上限、品牌責任、客訴賠償、資料權限、月結規則。 | 正確。這些都不能交給 AI 或工程師自行假設。 | 主管決策會日期？End of May | System configuration、master setup、change request、support ticket | System admin / IT support（系統管理 / IT 支援） | 正確。這些都不能交給 AI 或工程師自行假設。 | 全部模組 | Engineering 必須等 role/config/AI governance 確認後，才能做最終 workflow automation。 |
| G001 | D1 Market / Customer（市場 / 客戶） | M02 | M02 Customer / Site / Device Master（客戶/地址/設備主檔） | 前期 補充 ERP 模組 / Gap Questions | 客戶主檔去重規則 | 前期 無固定答案 | 建議以電話 + LINE ID 為主、地址為輔；同電話多地址允許，需合併歷史查詢。 | 確認客戶去重主鍵與人工合併權限。 LINE ID and 地址為主；同電話多地址允許，需合併歷史查詢。 | Data quality gate | 客服主管 / Data steward | 建議以電話 + LINE ID 為主、地址為輔；同電話多地址允許，需合併歷史查詢。 | M01,M09,M13 | Engineering 可依此列草擬 screens/workflow，但 final gates 需依 營運 review status。 |
| G002 | D1 Market / Customer（市場 / 客戶） | M02 | M02 Customer / Site / Device Master（客戶/地址/設備主檔） | 前期 補充 ERP 模組 / Gap Questions | 設備主檔與保固起算 | 前期 無固定答案 | 每個主鎖/高價件建立 Device record，綁品牌、型號、序號、購買日、安裝日、保固起算日；建商案預設用交屋/點交日，零售案用安裝日或品牌保固日。 | 確認建商案是否固定用交屋/點交日，零售案是否用安裝日。ＯＫ | Warranty gate | 客服主管 / Data steward | 每個主鎖/高價件建立 Device record，綁品牌、型號、序號、購買日、安裝日、保固起算日；建商案預設用交屋/點交日，零售案用安裝日或品牌保固日。 | M10,M13 | Engineering 可依此列草擬 screens/workflow，但 final gates 需依 營運 review status。 |
| G003 | D1 Market / Customer（市場 / 客戶） | M02 | M02 Customer / Site / Device Master（客戶/地址/設備主檔） | 前期 補充 ERP 模組 / Gap Questions | 社區/建案/多戶資料 | 前期 無固定答案 | 建商或社區案需 Site Group：同社區可批次派工、批次月結、共用保固條件。 | 確認建商專案是否需要批次工單。YES | Project site gate | 客服主管 / Data steward | 建商或社區案需 Site Group：同社區可批次派工、批次月結、共用保固條件。 | M14,M12 | Engineering 可依此列草擬 screens/workflow，但 final gates 需依 營運 review status。 |
| G004 | D3 Workforce / Supply（師傅人力 / 供應） | M07 | M07 Locksmith / Technician Workforce（師傅人力管理） | 前期 補充 ERP 模組 / Gap Questions | 師傅 onboarding | 前期 無固定答案 | 師傅不可只是一個帳號；需建立身份資料、服務區、可接類型、品牌授權、銀行帳戶、合約狀態。 | 確認師傅上線前必填資料。YES | Eligibility gate | 派工主管 / 師傅管理 | 師傅不可只是一個帳號；需建立身份資料、服務區、可接類型、品牌授權、銀行帳戶、合約狀態。 | M17,M12 | Engineering 可依此列草擬 screens/workflow，但 final gates 需依 營運 review status。 |
| G005 | D3 Workforce / Supply（師傅人力 / 供應） | M07 | M07 Locksmith / Technician Workforce（師傅人力管理） | 前期 補充 ERP 模組 / Gap Questions | 品牌/型號技能矩陣 | 前期 無固定答案 | 每位師傅要有品牌與型號技能等級；特殊門型、高價件、客訴返修需指定等級。 | 確認技能等級是否分初階/一般/資深。YES | Dispatch eligibility | 派工主管 / 師傅管理 | 每位師傅要有品牌與型號技能等級；特殊門型、高價件、客訴返修需指定等級。 | M06,M10,M13 | Engineering 可依此列草擬 screens/workflow，但 final gates 需依 營運 review status。 |
| G006 | D3 Workforce / Supply（師傅人力 / 供應） | M07 | M07 Locksmith / Technician Workforce（師傅人力管理） | 前期 補充 ERP 模組 / Gap Questions | 師傅停權與恢復 | 前期 無固定答案 | 高客訴率、拒單率、逾時、未退料、帳務異常可自動警示；停權需主管核准。 | 確認停權門檻與恢復條件。No show three times, 3 months later | Risk control | 派工主管 / 師傅管理 | 高客訴率、拒單率、逾時、未退料、帳務異常可自動警示；停權需主管核准。 | M15,M19 | Engineering 可依此列草擬 screens/workflow，但 final gates 需依 營運 review status。 |
| G007 | D1 Market / Customer（市場 / 客戶） | M14 | M14 Brand / Dealer / Builder Partner Portal（品牌/經銷/建商 Partner Portal） | 前期 補充 ERP 模組 / Gap Questions | 品牌商帳號與資料邊界 | 前期 提到 brand 可能可看全部，但 ERP 風險高。 | 品牌商只看自己品牌案件、保固、照片、RMA、月結；不能看其他品牌、內部工資、平台毛利。 | 確認品牌商資料權限邊界。品牌商只看自己品牌案件、保固、照片、RMA、月結；不能看其他品牌、內部工資、平台毛利。 | Authorization gate | Partner manager / 主管 | 品牌商只看自己品牌案件、保固、照片、RMA、月結；不能看其他品牌、內部工資、平台毛利。 | M17,M12 | Engineering 可依此列草擬 screens/workflow，但 final gates 需依 營運 review status。 |
| G008 | D1 Market / Customer（市場 / 客戶） | M14 | M14 Brand / Dealer / Builder Partner Portal（品牌/經銷/建商 Partner Portal） | 前期 補充 ERP 模組 / Gap Questions | 經銷商/門市入口 | 已部分涵蓋於 intake。 | 經銷商與門市可代客建案，但要標示來源、佣金/責任、是否可看後續狀態。 | 確認經銷商是否可自行登入。YES, 依品牌商登入 | Partner case gate | Partner manager / 主管 | 經銷商與門市可代客建案，但要標示來源、佣金/責任、是否可看後續狀態。 | M01,M12 | Engineering 可依此列草擬 screens/workflow，但 final gates 需依 營運 review status。 |
| G009 | D1 Market / Customer（市場 / 客戶） | M14 | M14 Brand / Dealer / Builder Partner Portal（品牌/經銷/建商 Partner Portal） | 前期 補充 ERP 模組 / Gap Questions | 建商專案合約規則 | 已部分涵蓋於 project type。 | 建商案需專案主檔：案場、戶數、點交日、保固期、月結/發票/責任人。 | 確認建商案與品牌案是否分開流程。YES | B2B project gate | Partner manager / 主管 | 建商案需專案主檔：案場、戶數、點交日、保固期、月結/發票/責任人。 | M02,M13,M12 | Engineering 可依此列草擬 screens/workflow，但 final gates 需依 營運 review status。 |
| G010 | D6 Governance / Platform Ops（治理 / 平台營運） | M18 | M18 System Setup / Master Configuration / IT Ops（系統設定/主檔配置/IT Ops） | 前期 補充 ERP 模組 / Gap Questions | 公司/分店/服務區設定 | 前期 無固定答案 | Central admin 需可設定公司、分店、服務區、區域負責人、可派工範圍與假日。 | 確認是否有多分店或不同公司帳。YES | System setup | System admin / IT support（系統管理 / IT 支援） | Central admin 需可設定公司、分店、服務區、區域負責人、可派工範圍與假日。 | M06,M07 | Engineering 必須等 role/config/AI governance 確認後，才能做最終 workflow automation。 |
| G011 | D6 Governance / Platform Ops（治理 / 平台營運） | M18 | M18 System Setup / Master Configuration / IT Ops（系統設定/主檔配置/IT Ops） | 前期 補充 ERP 模組 / Gap Questions | 服務項目與價格表主檔 | 前期 有 pricing，但未定義 setup owner。 | 服務項目、標準工資、檢測費、車馬費、急件費、加班費要由 admin 維護並留版本。 | 確認誰可改價格主檔。Admin | Master data approval | System admin / IT support（系統管理 / IT 支援） | 服務項目、標準工資、檢測費、車馬費、急件費、加班費要由 admin 維護並留版本。 | M04,M11,M12 | Engineering 必須等 role/config/AI governance 確認後，才能做最終 workflow automation。 |
| G012 | D6 Governance / Platform Ops（治理 / 平台營運） | M18 | M18 System Setup / Master Configuration / IT Ops（系統設定/主檔配置/IT Ops） | 前期 補充 ERP 模組 / Gap Questions | 狀態與原因代碼設定 | 前期 有 statuses，但未定義 admin setup。 | 工單狀態、異常代碼、取消原因、拒單原因、退款原因都需主檔維護。 | 確認哪些代碼允許前線新增。NO | Process control | System admin / IT support（系統管理 / IT 支援） | 工單狀態、異常代碼、取消原因、拒單原因、退款原因都需主檔維護。 | M05,M15 | Engineering 必須等 role/config/AI governance 確認後，才能做最終 workflow automation。 |
| G013 | D6 Governance / Platform Ops（治理 / 平台營運） | M17 | M17 Authorization / Security / Audit（權限/安全/Audit） | 前期 補充 ERP 模組 / Gap Questions | 職責分離 SoD | 前期 無固定答案 | 同一人不應同時建立退款、核准退款、完成付款核銷；高風險操作需主管/會計雙簽。 | 確認退款和折讓是否採雙簽。YES | Financial control | Central admin / IT admin / 主管 | 同一人不應同時建立退款、核准退款、完成付款核銷；高風險操作需主管/會計雙簽。 | M11,M15 | Engineering 必須等 role/config/AI governance 確認後，才能做最終 workflow automation。 |
| G014 | D6 Governance / Platform Ops（治理 / 平台營運） | M17 | M17 Authorization / Security / Audit（權限/安全/Audit） | 前期 補充 ERP 模組 / Gap Questions | IT user 與 support access | 前期 無固定答案 | IT support 可協助查問題，但預設不看客戶隱私或財務明細；臨時權限需有效期限與 audit。 | 確認 IT 維運權限和資料遮罩。IT support 可協助查問題，但預設不看客戶隱私或財務明細；臨時權限需有效期限與 audit。 | Security gate | Central admin / IT admin / 主管 | IT support 可協助查問題，但預設不看客戶隱私或財務明細；臨時權限需有效期限與 audit。 | M18,M09 | Engineering 必須等 role/config/AI governance 確認後，才能做最終 workflow automation。 |
| G015 | D6 Governance / Platform Ops（治理 / 平台營運） | M18 | M18 System Setup / Master Configuration / IT Ops（系統設定/主檔配置/IT Ops） | 前期 補充 ERP 模組 / Gap Questions | 資料匯入與初始建置 | 前期 無固定答案 | 上線前需匯入品牌、型號、BOM、師傅、價格、服務區、角色、現有客戶與未結工單。 | 確認第一批匯入範圍。上線前需匯入品牌、型號、BOM、師傅、價格、服務區、角色、現有客戶與未結工單。 | Implementation setup | System admin / IT support（系統管理 / IT 支援） | 上線前需匯入品牌、型號、BOM、師傅、價格、服務區、角色、現有客戶與未結工單。 | M02,M07,M10,M04 | Engineering 必須等 role/config/AI governance 確認後，才能做最終 workflow automation。 |
| G016 | D6 Governance / Platform Ops（治理 / 平台營運） | M19 | M19 Reporting / BI / KPI | 前期 補充 ERP 模組 / Gap Questions | KPI 公式 owner | 前期 有問誰定義公式。 | KPI 需有公式 owner；派工速度、接單率、準時率、完工率、返修率、退款率、毛利與未收款要定義一致。 | 確認 KPI 公式拍板人。品牌商＋派工人 | BI governance | 主管 / BI owner | KPI 需有公式 owner；派工速度、接單率、準時率、完工率、返修率、退款率、毛利與未收款要定義一致。 | M06,M11,M13 | Engineering 可依此列草擬 screens/workflow，但 final gates 需依 營運 review status。 |
| G017 | D6 Governance / Platform Ops（治理 / 平台營運） | M19 | M19 Reporting / BI / KPI | 前期 補充 ERP 模組 / Gap Questions | 報表下載與權限 | 前期 提到全部報表。 | 報表需分角色：師傅只看自己月結；品牌看品牌；會計看財務；主管看全部；下載要 audit。 | 確認報表下載權限。報表需分角色：師傅只看自己月結；品牌看品牌；會計看財務；主管看全部；下載要 audit。 | Reporting access | 主管 / BI owner | 報表需分角色：師傅只看自己月結；品牌看品牌；會計看財務；主管看全部；下載要 audit。 | M17 | Engineering 可依此列草擬 screens/workflow，但 final gates 需依 營運 review status。 |
| G018 | D6 Governance / Platform Ops（治理 / 平台營運） | M20 | M20 AI Operations / Knowledge Governance（AI Ops / 知識治理） | 前期 補充 ERP 模組 / Gap Questions | AI 知識庫 owner | 前期 提到 AI triage，但未定義 knowledge governance。 | AI SOP、品牌 FAQ、價格範圍、不能回答清單、轉真人規則需有 owner 和版本核准。 | 確認 AI 知識庫由客服主管還是品牌共同維護。Together | AI governance | AI ops owner / 客服主管 | AI SOP、品牌 FAQ、價格範圍、不能回答清單、轉真人規則需有 owner 和版本核准。 | M03,M04,M14 | Engineering 必須等 role/config/AI governance 確認後，才能做最終 workflow automation。 |
| G019 | D6 Governance / Platform Ops（治理 / 平台營運） | M20 | M20 AI Operations / Knowledge Governance（AI Ops / 知識治理） | 前期 補充 ERP 模組 / Gap Questions | AI 不可決策清單 | 前期 提到 AI 只做 draft / range。 | AI 不可 final price、不可退款核准、不可保固責任判定、不可法律/安全承諾、不可改月結。 | 確認不可由 AI 決策的清單。AI 不可 final price、不可退款核准、不可保固責任判定、不可法律/安全承諾、不可改月結。 | AI risk control | AI ops owner / 客服主管 | AI 不可 final price、不可退款核准、不可保固責任判定、不可法律/安全承諾、不可改月結。 | M04,M11,M13,M17 | Engineering 必須等 role/config/AI governance 確認後，才能做最終 workflow automation。 |
| G020 | D6 Governance / Platform Ops（治理 / 平台營運） | M20 | M20 AI Operations / Knowledge Governance（AI Ops / 知識治理） | 前期 補充 ERP 模組 / Gap Questions | AI 品質回饋閉環 | 前期 無固定答案 | 客服修正 AI 分診/報價/回答時，需回寫原因，作為 SOP 與知識庫更新來源。 | 確認 AI 錯誤要由誰審核。客服＋主管 | AI quality gate | AI ops owner / 客服主管 | 客服修正 AI 分診/報價/回答時，需回寫原因，作為 SOP 與知識庫更新來源。 | M03,M16 | Engineering 必須等 role/config/AI governance 確認後，才能做最終 workflow automation。 |
| G021 | D6 Governance / Platform Ops（治理 / 平台營運） | M09 | M09 Evidence / Document / Media（證據/文件/媒體） | 前期 補充 ERP 模組 / Gap Questions | 證據包標準 | 前期 分別列出照片項目。 | 每張工單結案時自動形成 Evidence Package：施工前、施工後、簽名、加價、付款、聊天與用料。 | 確認哪些案件不需完整證據包。APP 教學 | Completion control | 客服主管 / Compliance owner | 每張工單結案時自動形成 Evidence Package：施工前、施工後、簽名、加價、付款、聊天與用料。 | M08,M13 | Engineering 可依此列草擬 screens/workflow，但 final gates 需依 營運 review status。 |
| G022 | D6 Governance / Platform Ops（治理 / 平台營運） | M09 | M09 Evidence / Document / Media（證據/文件/媒體） | 前期 補充 ERP 模組 / Gap Questions | 資料保存與匿名化政策 | 前期 提到照片保存 1 年。 | 一般照片 1 年；保固/RMA/爭議至少保存至結案後指定期間；展示給品牌或師傅時可遮蔽姓名。 | 確認保固與爭議案件保存年限。2 Years | Privacy retention | 客服主管 / Compliance owner | 一般照片 1 年；保固/RMA/爭議至少保存至結案後指定期間；展示給品牌或師傅時可遮蔽姓名。 | M17,M13 | Engineering 可依此列草擬 screens/workflow，但 final gates 需依 營運 review status。 |
| G023 | D6 Governance / Platform Ops（治理 / 平台營運） | M16 | M16 Communication / Notification / Conversation（溝通/通知/對話） | 前期 補充 ERP 模組 / Gap Questions | 通知模板與語氣 | 前期 列出通知項目。 | 報價、付款、補照片、派工、延遲、加價、完工、客訴、退款需有模板和多語/品牌版。 | 確認模板誰批准。主管 | Comms setup | 客服主管 / Ops owner | 報價、付款、補照片、派工、延遲、加價、完工、客訴、退款需有模板和多語/品牌版。 | M18,M14 | Engineering 可依此列草擬 screens/workflow，但 final gates 需依 營運 review status。 |
| G024 | D6 Governance / Platform Ops（治理 / 平台營運） | M16 | M16 Communication / Notification / Conversation（溝通/通知/對話） | 前期 補充 ERP 模組 / Gap Questions | 電話紀錄與口頭確認 | 前期 允許電話聯絡。 | 電話聯絡應記錄結果；涉及改價、改期、取消、退款不可只靠口頭，需補 LINE/系統確認。 | 確認口頭確認可否作為正式證據。Need to get 客服填入證據 | Evidence gate | 客服主管 / Ops owner | 電話聯絡應記錄結果；涉及改價、改期、取消、退款不可只靠口頭，需補 LINE/系統確認。 | M09,M15 | Engineering 可依此列草擬 screens/workflow，但 final gates 需依 營運 review status。 |
| G025 | D2 Service-to-Cash Core | M15 | M15 Exception / Approval / Risk Control（異常/核准/風控） | 前期 補充 ERP 模組 / Gap Questions | Approval task inbox | 前期 有 supervisor decisions，但未定義 approval queue。 | 所有需主管/會計/品牌核准事項應進 approval inbox，不散落在聊天。 | 確認各 approval SLA。所有需主管/會計/品牌核准事項應進 approval inbox，不散落在聊天。 | Approval control | 主管 / 派工主管 / 會計 | 所有需主管/會計/品牌核准事項應進 approval inbox，不散落在聊天。 | M17,M18 | Engineering 必須建模 approvals 與 audit trail；不可 hardcode money 或 refund rules。 |
| G026 | D2 Service-to-Cash Core | M15 | M15 Exception / Approval / Risk Control（異常/核准/風控） | 前期 補充 ERP 模組 / Gap Questions | 異常 return path | 前期 已指出不一定要 cancel。 | 異常需固定 return path：繼續施工、重報價、改期、改派、新工單、取消、退款、RMA、爭議。 | 確認異常 return path 清單。異常需固定 return path：繼續施工、重報價、改期、改派、新工單、取消、退款、RMA、爭議。 | Exception control | 主管 / 派工主管 / 會計 | 異常需固定 return path：繼續施工、重報價、改期、改派、新工單、取消、退款、RMA、爭議。 | M05,M08 | Engineering 必須建模 approvals 與 audit trail；不可 hardcode money 或 refund rules。 |
| G027 | D4 Finance / Settlement（財務 / 結算） | M11 | M11 Customer Payment / AR / Refund（客戶付款/AR/退款） | 前期 補充 ERP 模組 / Gap Questions | 付款 reconciliation | 前期 有付款方式。 | 每筆付款要核銷到工單/訂金/尾款/退款；末五碼和付款連結要能對帳。 | 確認會計每日或每週核銷。每週 | AR control | 會計 / 主管 | 每筆付款要核銷到工單/訂金/尾款/退款；末五碼和付款連結要能對帳。 | M12 | Engineering 必須建模 approvals 與 audit trail；不可 hardcode money 或 refund rules。 |
| G028 | D4 Finance / Settlement（財務 / 結算） | M12 | M12 AP / Commission / Monthly Settlement（AP/抽成/月結） | 前期 補充 ERP 模組 / Gap Questions | 代收抵扣規則 | 前期 提到師傅代收 / monthly。 | 師傅代收客戶款項要進代收 ledger，月結時抵扣，逾期未繳或證據不足需暫扣。 | 確認代收繳回期限。隔月 5 號 | Settlement control | 會計 / Settlement owner | 師傅代收客戶款項要進代收 ledger，月結時抵扣，逾期未繳或證據不足需暫扣。 | M11,M07 | Engineering 必須建模 approvals 與 audit trail；不可 hardcode money 或 refund rules。 |
| G029 | D4 Finance / Settlement（財務 / 結算） | M12 | M12 AP / Commission / Monthly Settlement（AP/抽成/月結） | 前期 補充 ERP 模組 / Gap Questions | 派工者 commission | 前期 提到 dispatcher monthly settlement。 | 派工者、合作派工廠商、平台抽成需獨立月結，不和師傅工資混在一起。 | 確認派工者抽成公式。By case | Partner settlement | 會計 / Settlement owner | 派工者、合作派工廠商、平台抽成需獨立月結，不和師傅工資混在一起。 | M14 | Engineering 必須建模 approvals 與 audit trail；不可 hardcode money 或 refund rules。 |
| G030 | D5 Quality / After-sales（品質 / 售後） | M13 | M13 Complaint / Warranty / RMA / Quality（客訴/保固/RMA/品質） | 前期 補充 ERP 模組 / Gap Questions | 品質責任回寫 | 前期 有 responsibility matrix。 | RMA/客訴結案後需回寫師傅、品牌、產品、客服報價或派工錯誤，影響 KPI 與派工排序。 | 確認責任回寫是否影響師傅評分。No | Quality feedback | 客服主管 / 品牌商 | RMA/客訴結案後需回寫師傅、品牌、產品、客服報價或派工錯誤，影響 KPI 與派工排序。 | M07,M19 | Engineering 可依此列草擬 screens/workflow，但 final gates 需依 營運 review status。 |
| G031 | D2 Service-to-Cash Core | M04 | M04 Quote / Pricing / Approval（報價/價格/核准） | 前期 補充 ERP 模組 / Gap Questions | 價格版本管理 | 前期 有 quote rules。 | 價格表需要生效日、停用日、適用品牌/區域/案件類型；已成立工單不得被新價格覆蓋。 | 確認改價格是否需主管核准。YES | Pricing control | 客服主管 / 會計 / 主管 | 價格表需要生效日、停用日、適用品牌/區域/案件類型；已成立工單不得被新價格覆蓋。 | M18 | Engineering 可依此列草擬 screens/workflow，但 final gates 需依 營運 review status。 |
| G032 | D2 Service-to-Cash Core | M05 | M05 WorkOrder Lifecycle & Status（工單生命週期與狀態） | 前期 補充 ERP 模組 / Gap Questions | 工單重開與關聯 | 前期 提到 RMA independent。 | 取消重開、返修、新需求都應關聯原工單，不直接覆蓋原狀態。 | 確認重開是否用新工單號。YES but need to add the original work order number relevant | Lifecycle control | 派工主管 / System process owner | 取消重開、返修、新需求都應關聯原工單，不直接覆蓋原狀態。 | M13,M15 | Engineering 可依此列草擬 screens/workflow，但 final gates 需依 營運 review status。 |
| G033 | D2 Service-to-Cash Core | M06 | M06 Dispatch / Matching / Scheduling（派工/媒合/排程） | 前期 補充 ERP 模組 / Gap Questions | 多師傅/多段工單 | 前期 未涵蓋。 | 大型案或建商案可能一張案件多師傅、多日期、多戶；需支援 parent case + child work orders。 | 確認是否需要多師傅/多戶模式。YES | Scheduling model | 派工主管 | 大型案或建商案可能一張案件多師傅、多日期、多戶；需支援 parent case + child work orders。 | M14,M12 | Engineering 可依此列草擬 screens/workflow，但 final gates 需依 營運 review status。 |
| G034 | D3 Workforce / Supply（師傅人力 / 供應） | M10 | M10 Product / Brand / BOM / Inventory（品牌商品/BOM/庫存） | 前期 補充 ERP 模組 / Gap Questions | 庫存位置與保管責任 | 前期 有 material owner。 | 料件可在品牌、公司倉、師傅車上、客戶現場；每個位置要有保管責任和轉移紀錄。 | 確認公司是否有中央庫存。NO | Inventory control | 品牌 / 庫存管理 / 派工 | 料件可在品牌、公司倉、師傅車上、客戶現場；每個位置要有保管責任和轉移紀錄。 | M07,M12 | Engineering 可依此列草擬 screens/workflow，但 final gates 需依 營運 review status。 |
| G035 | D3 Workforce / Supply（師傅人力 / 供應） | M10 | M10 Product / Brand / BOM / Inventory（品牌商品/BOM/庫存） | 前期 補充 ERP 模組 / Gap Questions | 替代料與相容性 | 前期 提到 two layers only。 | 維持兩層 BOM，但可用相容/替代料欄位，不新增深層結構。 | 確認是否允許替代料。YES | BOM control | 品牌 / 庫存管理 / 派工 | 維持兩層 BOM，但可用相容/替代料欄位，不新增深層結構。 | M03,M08 | Engineering 可依此列草擬 screens/workflow，但 final gates 需依 營運 review status。 |
| G036 | D1 Market / Customer（市場 / 客戶） | M01 | M01 Customer & Channel Intake（客戶與入口來源） | 前期 補充 ERP 模組 / Gap Questions | Lead source 與 marketing attribution | 前期 未涵蓋。 | 每個 Case 應保留入口來源，方便知道 LINE、官網、品牌、門市、經銷商與熟客介紹的轉換。 | 確認是否要追蹤來源成效。YES | CRM control | 客服主管 / CRM owner | 每個 Case 應保留入口來源，方便知道 LINE、官網、品牌、門市、經銷商與熟客介紹的轉換。 | M19 | Engineering 可依此列草擬 screens/workflow，但 final gates 需依 營運 review status。 |
| G037 | D2 Service-to-Cash Core | M03 | M03 AI Triage & ProblemCard（AI 分診與 ProblemCard） | 前期 補充 ERP 模組 / Gap Questions | ProblemCard completeness score | 前期 有 required fields。 | ProblemCard 可顯示 completeness score：可報價、可派工、需補資料、需真人。 | 確認 score 是否影響派工。YES | Triage quality | 客服主管 / AI SOP owner | ProblemCard 可顯示 completeness score：可報價、可派工、需補資料、需真人。 | M04,M06 | Engineering 可依此列草擬 screens/workflow，但 final gates 需依 營運 review status。 |
| G038 | D2 Service-to-Cash Core | M08 | M08 Field Execution / Mobile Workflow（現場施工/行動流程） | 前期 補充 ERP 模組 / Gap Questions | 客戶現場不在場流程 | 前期 有 customer not onsite 流程。 | 師傅到場但客戶不在需記錄 GPS/時間/聯絡紀錄，決定取消費、車馬費或改期。 | 確認不在場收費規則。No | Onsite exception | 派工主管 / 師傅管理 | 師傅到場但客戶不在需記錄 GPS/時間/聯絡紀錄，決定取消費、車馬費或改期。 | M15,M11 | Engineering 可依此列草擬 screens/workflow，但 final gates 需依 營運 review status。 |
| G039 | D6 Governance / Platform Ops（治理 / 平台營運） | M18 | M18 System Setup / Master Configuration / IT Ops（系統設定/主檔配置/IT Ops） | 前期 補充 ERP 模組 / Gap Questions | Change request process | 前期 未涵蓋。 | 價格、權限、狀態、SLA、模板、AI SOP 的設定變更應有申請、核准、生效日與回滾紀錄。 | 主管決策會日期？End of May | System governance | System admin / IT support（系統管理 / IT 支援） | 價格、權限、狀態、SLA、模板、AI SOP 的設定變更應有申請、核准、生效日與回滾紀錄。 | M17,M20 | Engineering 必須等 role/config/AI governance 確認後，才能做最終 workflow automation。 |
| G040 | D6 Governance / Platform Ops（治理 / 平台營運） | M18 | M18 System Setup / Master Configuration / IT Ops（系統設定/主檔配置/IT Ops） | 前期 補充 ERP 模組 / Gap Questions | IT support ticket workflow（IT 支援工單流程） | 前期 未涵蓋。 | 系統問題、帳號問題、資料修正、匯入錯誤應建立 IT support ticket，不混在工單。 | 確認內部 IT 支援流程。 | IT ops | System admin / IT support（系統管理 / IT 支援） | 系統問題、帳號問題、資料修正、匯入錯誤應建立 IT support ticket，不混在工單。 | M17 | Engineering 必須等 role/config/AI governance 確認後，才能做最終 workflow automation。 |

## 06 業務規則庫

> 模組業務規則庫

> 每個 module 的 rule、default answer、owner 與 coding impact。

| Rule ID | 模組 ID | 模組 | 中文 | 規則範圍 | 建議預設答案 | 負責人 | 是否阻擋 Coding | 營運 備註 |
|---|---|---|---|---|---|---|---|---|
| BR-M01-01 | M01 | Customer & Channel Intake（客戶與入口來源） | 客戶入口與案件建立 | Channel source 必填 | 每個 Case 必須保留 source channel：LINE、電話、web、brand、store、dealer、builder、referral。 | 客服主管 | 是 |  |
| BR-M01-02 | M01 | Customer & Channel Intake（客戶與入口來源） | 客戶入口與案件建立 | 先建立 Case，再進報價 | 凡可能報價、派工、退款或客訴的 inquiry，必須先建立 Case。 | 客服主管 | 否 |  |
| BR-M01-03 | M01 | Customer & Channel Intake（客戶與入口來源） | 客戶入口與案件建立 | External portal 權限限制 | External partners 只能建立或查看自己被允許的 cases；internal staff 可代為建立。 | Partner manager / 主管 | 是 |  |
| BR-M02-01 | M02 | Customer / Site / Device Master（客戶/地址/設備主檔） | 客戶、地址、設備主檔 | Customer 去重規則 | 預設 duplicate key 為 phone + LINE ID；address 可輔助比對，但不能作為唯一 key。 | Data steward | 是 |  |
| BR-M02-02 | M02 | Customer / Site / Device Master（客戶/地址/設備主檔） | 客戶、地址、設備主檔 | 保固用 Device record | 主鎖與高價零件應建立 Device record，包含 brand、model、serial、purchase/install/warranty date。 | 客服主管 / 品牌 | 是 |  |
| BR-M02-03 | M02 | Customer / Site / Device Master（客戶/地址/設備主檔） | 客戶、地址、設備主檔 | Project / site group | 建商 / 社區案應使用 Site Group，以支援 batch dispatch、warranty、settlement、reporting。 | 主管 / Partner manager | 部分 |  |
| BR-M03-01 | M03 | AI Triage & ProblemCard（AI 分診與 ProblemCard） | AI 分診與 ProblemCard | ProblemCard completeness gate | ProblemCard status 應顯示 Ready for Quote、Need Info、Need Photo、Need Human 或 Closed Remote。 | 客服主管 | 否 |  |
| BR-M03-02 | M03 | AI Triage & ProblemCard（AI 分診與 ProblemCard） | AI 分診與 ProblemCard | AI escalation | 遇到 urgent、angry customer、高金額、保固不明、refund、safety/legal 或 3 次失敗循環，AI 必須轉真人。 | 客服主管 / AI owner | 是 |  |
| BR-M03-03 | M03 | AI Triage & ProblemCard（AI 分診與 ProblemCard） | AI 分診與 ProblemCard | AI 不做 final quote | AI 只能建議 range / draft；final customer price 需真人或已核准 fixed-price rule。 | 客服主管 / 主管 | 是 |  |
| BR-M04-01 | M04 | Quote / Pricing / Approval（報價/價格/核准） | 報價、價格、核准 | Internal quote 與 customer quote 分離 | Customer 只看 total receivable；internal view 保留 labor、material、travel、margin、brand cost。 | 主管 / 會計 | 是 |  |
| BR-M04-02 | M04 | Quote / Pricing / Approval（報價/價格/核准） | 報價、價格、核准 | Price table 版本管理 | Price table 必須有 effective date 與 owner；已確認 WorkOrder 保留原核准價格。 | System admin / 主管 | 是 |  |
| BR-M04-03 | M04 | Quote / Pricing / Approval（報價/價格/核准） | 報價、價格、核准 | 依金額 / 風險核准 | 高金額、特殊門、保固不明、discount、類 refund adjustment，在 customer confirmation 前需 approval。 | 主管 | 是 |  |
| BR-M05-01 | M05 | WorkOrder Lifecycle & Status（工單生命週期與狀態） | 工單生命週期與狀態 | 正式 state machine | 只有 approved roles 可推動 core states；cancel、reopen、reschedule、refund、dispute 必須填 status reason。 | System admin / 派工主管 | 是 |  |
| BR-M05-02 | M05 | WorkOrder Lifecycle & Status（工單生命週期與狀態） | 工單生命週期與狀態 | Reopen 必須建立關聯 | Rework、warranty return、cancelled-recreated jobs 必須連回原 WorkOrder，不可覆蓋歷史。 | 派工主管 | 否 |  |
| BR-M05-03 | M05 | WorkOrder Lifecycle & Status（工單生命週期與狀態） | 工單生命週期與狀態 | Customer confirmation gate | 只有 customer price/time/payment gate 滿足後，WorkOrder 才可進入 dispatch。 | 主管 / 派工主管 | 是 |  |
| BR-M06-01 | M06 | Dispatch / Matching / Scheduling（派工/媒合/排程） | 派工、媒合、排程 | Dispatch eligibility | 符合資格的 locksmith 必須符合 area、availability、skill、brand/model experience、inventory、suspension status。 | 派工主管 | 否 |  |
| BR-M06-02 | M06 | Dispatch / Matching / Scheduling（派工/媒合/排程） | 派工、媒合、排程 | 搶單限制 | 只有核准 travel time 內的 low-risk standard jobs 可進入 grab-order pool。 | 派工主管 | 是 |  |
| BR-M06-03 | M06 | Dispatch / Matching / Scheduling（派工/媒合/排程） | 派工、媒合、排程 | Acceptance SLA | 建議 acceptance SLA：normal 15 分鐘、urgent 5 分鐘；前期 的 normal 10 分鐘是較嚴格選項，需 supervisor 確認。 | 派工主管 | 是 |  |
| BR-M07-01 | M07 | Locksmith / Technician Workforce（師傅人力管理） | 師傅與技術人力管理 | Technician onboarding | Technician 在 dispatch 前必須有 profile、bank/payment info、service area、skill matrix、brand authorization、contract status。 | 派工主管 | 是 |  |
| BR-M07-02 | M07 | Locksmith / Technician Workforce（師傅人力管理） | 師傅與技術人力管理 | 停權條件 | 高 complaint rate、no-show、未繳回代收款、未退料、嚴重安全問題，可暫停 dispatch eligibility。 | 派工主管 / 主管 | 是 |  |
| BR-M07-03 | M07 | Locksmith / Technician Workforce（師傅人力管理） | 師傅與技術人力管理 | Performance feedback | RMA responsibility、on-time rate、acceptance rate、rejection rate、customer feedback 會影響 dispatch ranking。 | 派工主管 / BI owner | 部分 |  |
| BR-M08-01 | M08 | Field Execution / Mobile Workflow（現場施工/行動流程） | 現場施工與行動流程 | GPS 到場 | 到場需 GPS + timestamp；customer not onsite、dispute、travel fee evidence 可要求照片。 | 派工主管 | 部分 |  |
| BR-M08-02 | M08 | Field Execution / Mobile Workflow（現場施工/行動流程） | 現場施工與行動流程 | 現場 scope change | 任何 onsite scope change 或 extra charge，繼續施工前都需要 customer confirmation 與 evidence。 | 主管 / 派工主管 | 是 |  |
| BR-M08-03 | M08 | Field Execution / Mobile Workflow（現場施工/行動流程） | 現場施工與行動流程 | Completion package | Completion 需 photos、materials used、payment status、customer signature / LINE confirmation，以及必要 teaching note。 | 派工主管 / 客服 | 否 |  |
| BR-M09-01 | M09 | Evidence / Document / Media（證據/文件/媒體） | 照片、影片、文件與證據 | Evidence package 標準 | 每張完成 WorkOrder 應自動收集 before/after photos、quote、added-price approval、payment proof、signature、chat links。 | Compliance owner | 否 |  |
| BR-M09-02 | M09 | Evidence / Document / Media（證據/文件/媒體） | 照片、影片、文件與證據 | Evidence visibility | Brand、locksmith、accounting、customer 依角色與 case ownership 看到不同 evidence sets。 | Central admin / 主管 | 是 |  |
| BR-M09-03 | M09 | Evidence / Document / Media（證據/文件/媒體） | 照片、影片、文件與證據 | Retention policy | 預設照片保存 1 年；warranty/RMA/dispute evidence 保存至 warranty/dispute period 加核准 buffer。 | 主管 / Compliance owner | 是 |  |
| BR-M10-01 | M10 | Product / Brand / BOM / Inventory（品牌商品/BOM/庫存） | 品牌、商品、BOM、庫存 | Two-layer BOM | BOM 保持 Brand/Model -> material list；用 substitute-compatible fields，不增加更深層級。 | 庫存管理 / 品牌 | 否 |  |
| BR-M10-02 | M10 | Product / Brand / BOM / Inventory（品牌商品/BOM/庫存） | 品牌、商品、BOM、庫存 | Inventory ownership | Material owner 可為 brand、company、locksmith、customer；ownership 決定 billing、return、warranty responsibility。 | 會計 / 庫存管理 | 是 |  |
| BR-M10-03 | M10 | Product / Brand / BOM / Inventory（品牌商品/BOM/庫存） | 品牌、商品、BOM、庫存 | Serial control | 主鎖、保固件、高價電子件需 serial 綁定 WorkOrder / Device record。 | 品牌 / 主管 | 是 |  |
| BR-M11-01 | M11 | Customer Payment / AR / Refund（客戶付款/AR/退款） | 客戶付款、應收、退款 | Payment reconciliation | 每筆 payment 必須 reconcile 到 WorkOrder、deposit、balance、travel fee、refund 或 RMA adjustment。 | 會計 | 是 |  |
| BR-M11-02 | M11 | Customer Payment / AR / Refund（客戶付款/AR/退款） | 客戶付款、應收、退款 | Refund approval levels | Refund 需依金額分層 approval；建議預設：refund > NTD 100,000 需 operations + finance double sign；partial refund 必須分類 product、labor、material、travel、inspection。 | 會計 / 主管 | 是 |  |
| BR-M11-03 | M11 | Customer Payment / AR / Refund（客戶付款/AR/退款） | 客戶付款、應收、退款 | Invoice responsibility | Invoice issuer 依 B2C、B2B brand、builder project 或 platform collection model 決定。 | 會計 | 是 |  |
| BR-M12-01 | M12 | AP / Commission / Monthly Settlement（AP/抽成/月結） | 師傅、派工者、品牌月結 | 分開 AP ledgers | Technician AP、dispatcher commission、brand settlement、partner settlement 必須分開 ledger / report。 | 會計 | 是 |  |
| BR-M12-02 | M12 | AP / Commission / Monthly Settlement（AP/抽成/月結） | 師傅、派工者、品牌月結 | 代收款抵扣 | Technician cash collection 抵扣 monthly payable；未繳回代收款可 hold payout。 | 會計 / 派工主管 | 是 |  |
| BR-M12-03 | M12 | AP / Commission / Monthly Settlement（AP/抽成/月結） | 師傅、派工者、品牌月結 | Dispute withholding | 除非疑似 fraud 或 severe misconduct，只應暫扣 disputed amount。 | 主管 / 會計 | 是 |  |
| BR-M13-01 | M13 | Complaint / Warranty / RMA / Quality（客訴/保固/RMA/品質） | 客訴、保固、RMA、品質 | RMA 獨立案件 | Complaint / warranty 必須是獨立 RMA case，並連結原 customer/site/device/WorkOrder/payment。 | 客服主管 | 否 |  |
| BR-M13-02 | M13 | Complaint / Warranty / RMA / Quality（客訴/保固/RMA/品質） | 客訴、保固、RMA、品質 | Responsibility matrix | RMA 必須分類 responsibility：product/brand、installation/technician、customer use、environment、quote/customer service、dispatch、material delay。 | 客服主管 / 品牌 | 是 |  |
| BR-M13-03 | M13 | Complaint / Warranty / RMA / Quality（客訴/保固/RMA/品質） | 客訴、保固、RMA、品質 | Quality feedback loop | Closed RMA 回寫 technician rating、brand/product quality、quote rule 與 dispatch eligibility。 | 客服主管 / BI owner | 部分 |  |
| BR-M14-01 | M14 | Brand / Dealer / Builder Partner Portal（品牌/經銷/建商 Partner Portal） | 品牌商、經銷商、建商與合作夥伴 | Partner account scope | Brand / dealer / builder users 只能依 contract 查看自己的 cases、projects、settlement。 | Partner manager / 主管 | 是 |  |
| BR-M14-02 | M14 | Brand / Dealer / Builder Partner Portal（品牌/經銷/建商 Partner Portal） | 品牌商、經銷商、建商與合作夥伴 | Builder project setup | Builder projects 必須有 site group、unit list、handover/warranty date、contract price、SLA、invoice rules。 | Partner manager / 會計 | 是 |  |
| BR-M14-03 | M14 | Brand / Dealer / Builder Partner Portal（品牌/經銷/建商 Partner Portal） | 品牌商、經銷商、建商與合作夥伴 | Partner-created case | 除 contract 另有規定，Partner-created cases 仍需通過平台 ProblemCard、quote/payment、dispatch gates。 | Partner manager | 部分 |  |
| BR-M15-01 | M15 | Exception / Approval / Risk Control（異常/核准/風控） | 異常、核准、風險控制 | Exception return path | 每個 exception 必須選一個 return path：continue、requote、reschedule、reassign、new WorkOrder、cancel、refund、RMA、dispute。 | 主管 / 派工主管 | 是 |  |
| BR-M15-02 | M15 | Exception / Approval / Risk Control（異常/核准/風控） | 異常、核准、風險控制 | Approval inbox | Supervisor / accounting / brand approvals 應進 approval inbox，不應只留在 chat。 | Central admin / 主管 | 是 |  |
| BR-M15-03 | M15 | Exception / Approval / Risk Control（異常/核准/風控） | 異常、核准、風險控制 | High-risk stop rule | Warranty unclear、brand responsibility、safety risk、customer refuses added price、high-risk drilling/opening 必須 pause 到核准後才繼續。 | 主管 | 是 |  |
| BR-M16-01 | M16 | Communication / Notification / Conversation（溝通/通知/對話） | 聊天、通知、溝通紀錄 | Conversation visibility | Customer、technician、brand、accounting、internal notes 必須依 visibility rules 分開。 | Central admin / 客服主管 | 是 |  |
| BR-M16-02 | M16 | Communication / Notification / Conversation（溝通/通知/對話） | 聊天、通知、溝通紀錄 | 電話確認限制 | Phone calls 可記錄結果，但 price/time/refund/cancel confirmation 必須寫入 system 或 LINE。 | 客服主管 | 部分 |  |
| BR-M16-03 | M16 | Communication / Notification / Conversation（溝通/通知/對話） | 聊天、通知、溝通紀錄 | Notification templates | Quote、photo request、payment、dispatch、delay、extra price、completion、RMA、refund 需要 approved templates。 | System admin / 客服主管 | 是 |  |
| BR-M17-01 | M17 | Authorization / Security / Audit（權限/安全/Audit） | 權限、安全、稽核 | Can view / edit / approve matrix | 每個角色必須拆成 can-view、can-edit、can-approve；除 audited admin 外，不接受 all access。 | Central admin / 主管 | 是 |  |
| BR-M17-02 | M17 | Authorization / Security / Audit（權限/安全/Audit） | 權限、安全、稽核 | Segregation of duties | 同一 user 不應在無 second approval 下同時 create、approve、reconcile refund。 | 會計 / 主管 | 是 |  |
| BR-M17-03 | M17 | Authorization / Security / Audit（權限/安全/Audit） | 權限、安全、稽核 | Temporary IT support access | IT support sensitive access 必須 time-limited、reason-coded、audit logged。 | IT admin / 主管 | 是 |  |
| BR-M18-01 | M18 | System Setup / Master Configuration / IT Ops（系統設定/主檔配置/IT Ops） | 系統設定、主檔配置、IT 維運 | Master configuration owner | Service items、price tables、status codes、SLA、templates、roles、regions 需要明確 owner 與 approval。 | System admin / 主管 | 是 |  |
| BR-M18-02 | M18 | System Setup / Master Configuration / IT Ops（系統設定/主檔配置/IT Ops） | 系統設定、主檔配置、IT 維運 | Change request process | Configuration changes 需要 request、owner approval、effective date、rollback note。 | System admin / 主管 | 是 |  |
| BR-M18-03 | M18 | System Setup / Master Configuration / IT Ops（系統設定/主檔配置/IT Ops） | 系統設定、主檔配置、IT 維運 | Initial setup import | Coding / UAT 前，先確認 first import list：brands、models、BOM、technicians、price、regions、roles、customers、open WorkOrders。 | 主管 / System admin | 是 |  |
| BR-M19-01 | M19 | Reporting / BI / KPI（報表 / BI / KPI） | 報表、BI、KPI | KPI formula ownership | 每個 KPI 在 dashboard 成為 official 前，都必須有 formula owner 與穩定定義。 | 主管 / BI owner | 是 |  |
| BR-M19-02 | M19 | Reporting / BI / KPI（報表 / BI / KPI） | 報表、BI、KPI | Report download audit | Financial、brand、technician、customer report downloads 應依 role access 控管並 audit logged。 | Central admin / BI owner | 是 |  |
| BR-M19-03 | M19 | Reporting / BI / KPI（報表 / BI / KPI） | 報表、BI、KPI | Management dashboard scope | Default dashboard 涵蓋 WorkOrders、dispatch、completion、RMA、refund、AR、AP、inventory、technician performance。 | 主管 / BI owner | 部分 |  |
| BR-M20-01 | M20 | AI Operations / Knowledge Governance（AI Ops / 知識治理） | AI 營運、知識庫、品質治理 | AI knowledge owner | AI SOP、brand FAQ、price range、escalation rules、forbidden actions 需要 owner 與 version approval。 | AI ops owner / 客服主管 | 是 |  |
| BR-M20-02 | M20 | AI Operations / Knowledge Governance（AI Ops / 知識治理） | AI 營運、知識庫、品質治理 | AI forbidden decisions | AI 不可 final quote、approve refund、decide warranty liability、promise legal/safety outcome 或 modify settlement。 | 主管 / AI owner | 是 |  |
| BR-M20-03 | M20 | AI Operations / Knowledge Governance（AI Ops / 知識治理） | AI 營運、知識庫、品質治理 | AI quality feedback | Human 對 AI triage / quote / answer 的 corrections，應將原因寫回 AI quality review queue。 | AI ops owner | 部分 |  |

## 07 Phase I Scope

> Phase I Market Launch Scope

> Phase I 可開始 coding 的 market-ready 範圍。

| Phase | Module | Scope 決策 | Phase I Market Scope | Use 營運 Answer From | AI Specialist 要產出 | Acceptance Criteria | Risk if skipped |
|---|---|---|---|---|---|---|---|
| 0 | M18 System Setup | Build Now | service items、price table、SLA、status、template、role、region、initial import list。 | 10 Coding前必決 / 13 P0決策 | 產出 system setup checklist：service items、price table、SLA、status、templates、roles、regions、change approval。 | setup owner / approval / effective date 已定義。 | 沒有 master config，後面 coding 會一直改。 |
| 0 | M17 RBAC / Audit | Build Now | brand、locksmith、accounting、admin、IT、AI ops 分 can-view / edit / approve。 | 10 Coding前必決 / 13 P0決策 | 產出 RBAC matrix：can-view / can-edit / can-approve、approval limit、audit events。 | role matrix approved by management。 | 資料權限錯會造成品牌/師傅/會計資料外洩。 |
| I | M01 Intake | Build Now | LINE / phone / web / brand / store / dealer / builder source tracking; Case before quote。 | 04 全部Q&A / 09 業務規則 | 把 營運 final rule 轉成 module acceptance criteria 與 Codex / Claude coding task。 | 每個 Case 有 source channel、customer contact、first SLA clock。 | 無法追蹤案件來源與責任。 |
| I | M02 Customer Site Device | Build Now | customer duplicate、site/device profile、warranty identity basic version。 | 04 全部Q&A / 09 業務規則 | 把 營運 final rule 轉成 module acceptance criteria 與 Codex / Claude coding task。 | phone + LINE ID duplicate; device record for warranty locks。 | 保固/RMA/重複服務無法連回正確資料。 |
| I | M03 AI ProblemCard | Build Now | AI triage assistant、missing info、required photos、human escalation。 | 04 全部Q&A / 09 業務規則 | 把 ProblemCard 轉成 business fields、required evidence、risk tags、escalation rules。 | ProblemCard = Ready / Need Info / Need Photo / Need Human / Closed Remote。 | 客服和派工會拿不到一致資訊。 |
| I | M04 Quote | Build Now | customer total vs internal cost split; approval gate for high-risk price changes。 | 10 Coding前必決 | 產出 quote contract：customer-visible total、internal cost split、approval gate、price validity。 | fixed / interval / special quote examples approved。 | 價格、成本與客戶顯示會混亂。 |
| I | M11 Payment / AR / Refund | Build Now | payment proof、deposit trigger、AR status、refund request；退款可先 approval/manual。 | 10 Coding前必決 / 13 P0決策 | 產出 finance gate：payment proof、deposit, refund approval, cancellation/travel fee, AR status。 | payment gate controls dispatch; refund approval levels known。 | 無法安全收款、派工或退款。 |
| I | M05 WorkOrder | Build Now | official state machine、allowed actions、reason code、reopen/cancel/reschedule。 | 10 Coding前必決 | 產出 WorkOrder state machine：status、allowed next action、reason code、reopen/cancel rules。 | state transition matrix approved。 | 核心工單流程不穩。 |
| I | M06 Dispatch | Build Now | skill / area / time / SLA / inventory eligibility; accept/reject/timeout。 | 10 Coding前必決 / 17 Source Conflicts | 產出 dispatch contract：matching criteria、accept/reject/timeout、reassign、urgent path。 | normal/urgent/reject/timeout scenario approved。 | 派工無法控 SLA 與師傅責任。 |
| I | M07 Workforce | Build Now | technician profile、skill matrix、service area、brand authorization、suspension rule。 | 10 Coding前必決 | 產出 technician setup：profile、skill matrix、brand authorization、suspension/recovery rules。 | onboarding checklist approved。 | 不合格師傅可能被派工。 |
| I | M08 Onsite | Build Now | GPS arrival、scope change、completion package、customer sign-off。 | 10 Coding前必決 | 產出 onsite workflow：arrival proof、scope change, completion package, customer confirmation。 | happy path + exception examples approved。 | 現場加價、完工、爭議難以追蹤。 |
| I | M09 Evidence | Build Now | photos/video/docs evidence package, role visibility, 1-year default retention。 | 09 業務規則 | 產出 evidence checklist：photos/video/docs, visibility, retention, dispute/RMA proof。 | evidence package sample approved。 | 客訴、會計、保固沒有證據。 |
| I | M15 Exception | Build Now | continue/requote/reschedule/reassign/new WorkOrder/cancel/refund/RMA/dispute return path。 | 09 業務規則 | 產出 exception matrix：return path, approval inbox, stop rules, responsible owner。 | exception matrix and approval inbox approved。 | 異常會留在 chat，不可控。 |
| I | M16 Communication | Build Now | message visibility、phone record、notification templates。 | 09 業務規則 | 產出 notification template list：quote, payment, dispatch, delay, completion, RMA, refund。 | quote/payment/dispatch/delay/completion/RMA/refund templates approved。 | 通知不能成為證據。 |
| I | M10 Product BOM | Manual First / Light | 只做 brand/model/two-layer BOM/material owner/serial high-value basic support。 | 09 業務規則 | 產出 light product/BOM rule：brand/model, material owner, serial control, inventory exception。 | first two brands and BOM reviewed。 | 庫存太深會拖慢 Phase I。 |
| I | M12 AP Settlement | Manual First / Export | 先做 monthly settlement export; disputed amount withheld manually。 | 10 Coding前必決 | 產出 settlement rule：technician AP、dispatcher commission、brand settlement、dispute withholding。 | monthly statement sample approved。 | 全自動月結太早會增加風險。 |
| I | M13 RMA Quality | Manual First / Light | complaint/RMA can be opened and linked to original WorkOrder；責任矩陣先 manual。 | 09 業務規則 | 產出 RMA business contract：RMA ID、warranty start, responsibility matrix, link to original WorkOrder。 | one complaint/warranty sample approved。 | 售後無法連回原工單。 |
| I | M19 BI KPI | Manual First / Basic Dashboard | basic counts only: WorkOrder, dispatch, completion, payment, RMA, refund。 | 09 業務規則 | 產出 KPI/report definition：formula owner, download permission, Phase I dashboard minimum。 | basic dashboard review by operator。 | 一開始不要等完整 BI 才 launch。 |
| I | M20 AI Ops | Manual First / Guardrails | AI forbidden decisions, escalation, SOP version owner；不做 AI auto diagnosis。 | 10 Coding前必決 / 13 P0決策 | 產出 AI guardrails：allowed actions、forbidden decisions、handoff to human、quality review queue。 | AI allowed/forbidden action tests approved。 | AI 若沒有 guardrails 會做錯承諾。 |
| III | M14 Partner Portal | Later | full brand/dealer/builder portal moves to Phase III；Phase I only internal staff can act on behalf。 | 09 業務規則 | 產出 partner boundary：brand/dealer/builder visibility, project setup, B2B settlement rule。 | partner data boundary sample approved before Phase III。 | 太早做 portal 會拖慢 market launch。 |

## 08 Phase II Finance

> Phase II Finance / Settlement

> 已接受的 finance / settlement default answers，全部需 configurable。

| ID | Area | 問題 | 已接受預設答案 | Owner | Priority | Phase II 最終規則 | AI Specialist 要做什麼 |
|---|---|---|---|---|---|---|---|
| P2-01 | A. 收款、訂金與 AR | 哪些案件需要訂金 / 預付款？ | 建議 Phase II 設為 configurable rule。預設需要訂金的案件：急件、高金額、新客戶、特殊門型、需預購材料、跨區或超過 1 小時車程、品牌/建商非標準案件。 | Accounting / Operator Leader | High | 建議 Phase II 設為 configurable rule。預設需要訂金的案件：急件、高金額、新客戶、特殊門型、需預購材料、跨區或超過 1 小時車程、品牌/建商非標準案件。 | Use as Phase II default rule. Keep configurable; do not hardcode money amounts unless management later freezes exact config. |
| P2-02 | A. 收款、訂金與 AR | 訂金金額怎麼算？ | 建議預設：報價金額 30% 或 NTD 1,000，取高者；特殊材料案件可收材料成本 100%。金額不要 hardcode，放在 System Setup config。 | Accounting | High | 建議預設：報價金額 30% 或 NTD 1,000，取高者；特殊材料案件可收材料成本 100%。金額不要 hardcode，放在 System Setup config。 | Use as Phase II default rule. Keep configurable; do not hardcode money amounts unless management later freezes exact config. |
| P2-03 | A. 收款、訂金與 AR | 哪些付款方式 Phase II 要支援？ | Phase II 建議支援：轉帳、信用卡、LINE Pay、現金、品牌月結。每筆 payment 都要綁定 WorkOrder、payer、amount、method、proof、received date。 | Accounting / AI Specialist | Medium | Phase II 建議支援：轉帳、信用卡、LINE Pay、現金、品牌月結。每筆 payment 都要綁定 WorkOrder、payer、amount、method、proof、received date。 | Use as Phase II default rule. Keep configurable; do not hardcode money amounts unless management later freezes exact config. |
| P2-04 | A. 收款、訂金與 AR | Payment proof 要哪些欄位？ | 必填：WorkOrder ID、付款方式、金額、付款人、收款人、時間、末五碼或交易序號、截圖/照片、客服/會計確認人。現金需師傅上傳收款確認。 | Accounting | High | 必填：WorkOrder ID、付款方式、金額、付款人、收款人、時間、末五碼或交易序號、截圖/照片、客服/會計確認人。現金需師傅上傳收款確認。 | Use as Phase II default rule. Keep configurable; do not hardcode money amounts unless management later freezes exact config. |
| P2-05 | A. 收款、訂金與 AR | AR 狀態要怎麼設？ | 建議 AR status：Not Required、Deposit Required、Deposit Paid、Balance Due、Paid、Partial Refund Pending、Refunded、Disputed、Write-off Requested。 | Accounting / AI Specialist | Medium | 建議 AR status：Not Required、Deposit Required、Deposit Paid、Balance Due、Paid、Partial Refund Pending、Refunded、Disputed、Write-off Requested。 | Use as Phase II default rule. Keep configurable; do not hardcode money amounts unless management later freezes exact config. |
| P2-06 | B. 取消費、車馬費、檢測費與退款 | 客戶取消費怎麼分階段？ | 建議預設 matrix：報價未確認前取消 = 0；已確認但未派工 = 可免或收行政費；已派工未出發 = 收取消費；師傅已出發 = 收車馬費；已到場 = 收車馬費 + 檢測費；已施工 = 依完成比例/材料/人工計費。 | Accounting / Operator Leader | High | 建議預設 matrix：報價未確認前取消 = 0；已確認但未派工 = 可免或收行政費；已派工未出發 = 收取消費；師傅已出發 = 收車馬費；已到場 = 收車馬費 + 檢測費；已施工 = 依完成比例/材料/人工計費。 | Use as Phase II default rule. Keep configurable; do not hardcode money amounts unless management later freezes exact config. |
| P2-07 | B. 取消費、車馬費、檢測費與退款 | 取消費預設金額是多少？ | 建議不要先 hardcode。Phase II 可先設 configurable default：一般取消費 NTD 300-500；急件或特殊安排 NTD 500-1,000；需主管 override。 | Accounting | High | 建議不要先 hardcode。Phase II 可先設 configurable default：一般取消費 NTD 300-500；急件或特殊安排 NTD 500-1,000；需主管 override。 | Use as Phase II default rule. Keep configurable; do not hardcode money amounts unless management later freezes exact config. |
| P2-08 | B. 取消費、車馬費、檢測費與退款 | 車馬費什麼時候收？ | 建議：師傅已出發或到場後，客戶取消、聯絡不上、不願施工、現場條件不符，收車馬費。未出發不收車馬費。 | Accounting / Dispatch Lead | High | 建議：師傅已出發或到場後，客戶取消、聯絡不上、不願施工、現場條件不符，收車馬費。未出發不收車馬費。 | Use as Phase II default rule. Keep configurable; do not hardcode money amounts unless management later freezes exact config. |
| P2-09 | B. 取消費、車馬費、檢測費與退款 | 車馬費金額與歸屬？ | 建議預設：同區 NTD 500、跨區 NTD 800、遠距/急件 NTD 1,200 起；80% 給師傅，20% 留平台作 dispatch/admin cost。若品牌合約另有規定，以 brand contract 優先。 | Accounting / Dispatch Lead | High | 建議預設：同區 NTD 500、跨區 NTD 800、遠距/急件 NTD 1,200 起；80% 給師傅，20% 留平台作 dispatch/admin cost。若品牌合約另有規定，以 brand contract 優先。 | Use as Phase II default rule. Keep configurable; do not hardcode money amounts unless management later freezes exact config. |
| P2-10 | B. 取消費、車馬費、檢測費與退款 | 檢測費什麼時候收？ | 建議：師傅已到場並完成判斷，但客戶拒絕維修/加價/更換零件時，收檢測費。檢測費可與車馬費合併顯示給客戶，但內部要分開 ledger。 | Accounting / Operator Leader | Medium | 建議：師傅已到場並完成判斷，但客戶拒絕維修/加價/更換零件時，收檢測費。檢測費可與車馬費合併顯示給客戶，但內部要分開 ledger。 | Use as Phase II default rule. Keep configurable; do not hardcode money amounts unless management later freezes exact config. |
| P2-11 | B. 取消費、車馬費、檢測費與退款 | 退款 approval levels 怎麼設？ | 建議預設：NTD 1,000 以下客服主管；1,001-5,000 營運主管；5,001-30,000 營運主管 + 會計；30,001 以上 management approval；100,000 以上必須 double approval。 | Accounting / Management | High | 建議預設：NTD 1,000 以下客服主管；1,001-5,000 營運主管；5,001-30,000 營運主管 + 會計；30,001 以上 management approval；100,000 以上必須 double approval。 | Use as Phase II default rule. Keep configurable; do not hardcode money amounts unless management later freezes exact config. |
| P2-12 | B. 取消費、車馬費、檢測費與退款 | 退款原因分類要有哪些？ | 建議分類：重複付款、取消退款、服務未完成、價格調整、材料退貨、保固/品牌責任、客訴 goodwill、會計錯帳、爭議處理。每筆 refund 必須有 reason code。 | Accounting | Medium | 建議分類：重複付款、取消退款、服務未完成、價格調整、材料退貨、保固/品牌責任、客訴 goodwill、會計錯帳、爭議處理。每筆 refund 必須有 reason code。 | Use as Phase II default rule. Keep configurable; do not hardcode money amounts unless management later freezes exact config. |
| P2-13 | B. 取消費、車馬費、檢測費與退款 | 現場加價客戶不同意怎麼處理？ | 建議 return path：主管協調、改期、取消並收車馬/檢測費、維持原報價但縮小 scope、建立新報價或新 WorkOrder。不得只留在 chat，必須進 Exception approval。 | Operator Leader / Accounting | High | 建議 return path：主管協調、改期、取消並收車馬/檢測費、維持原報價但縮小 scope、建立新報價或新 WorkOrder。不得只留在 chat，必須進 Exception approval。 | Use as Phase II default rule. Keep configurable; do not hardcode money amounts unless management later freezes exact config. |
| P2-14 | C. 師傅 AP、派工者抽成與品牌月結 | 師傅 payout formula 怎麼算？ | 建議預設：師傅應付 = 核准人工費 + 核准車馬/檢測費 + 核准材料代墊 - 平台服務費/抽成 - 未繳回現金 - 扣款 - 爭議暫扣。 | Accounting / Dispatch Lead | High | 建議預設：師傅應付 = 核准人工費 + 核准車馬/檢測費 + 核准材料代墊 - 平台服務費/抽成 - 未繳回現金 - 扣款 - 爭議暫扣。 | Use as Phase II default rule. Keep configurable; do not hardcode money amounts unless management later freezes exact config. |
| P2-15 | C. 師傅 AP、派工者抽成與品牌月結 | 材料費如何進師傅月結？ | 建議依 material owner 判斷：師傅自備且核准使用 = reimbursable；品牌提供 = 不付給師傅；公司庫存 = 記用料不付 reimbursement；客戶自備 = 不計材料收入。 | Accounting / Inventory Owner | Medium | 建議依 material owner 判斷：師傅自備且核准使用 = reimbursable；品牌提供 = 不付給師傅；公司庫存 = 記用料不付 reimbursement；客戶自備 = 不計材料收入。 | Use as Phase II default rule. Keep configurable; do not hardcode money amounts unless management later freezes exact config. |
| P2-16 | C. 師傅 AP、派工者抽成與品牌月結 | 派工者 commission 怎麼算？ | 建議 Phase II 先 config：依案件類型固定金額或服務人工費 5%-10%。不建議對材料、車馬費、退款金額抽成，除非 management 明確決定。 | Accounting / Management | High | 建議 Phase II 先 config：依案件類型固定金額或服務人工費 5%-10%。不建議對材料、車馬費、退款金額抽成，除非 management 明確決定。 | Use as Phase II default rule. Keep configurable; do not hardcode money amounts unless management later freezes exact config. |
| P2-17 | C. 師傅 AP、派工者抽成與品牌月結 | 派工者 commission 什麼時候成立？ | 建議：WorkOrder completed + customer payment confirmed + 無重大爭議時成立；取消、退款、返工或爭議案件可暫緩或按實收比例計算。 | Accounting / Dispatch Lead | High | 建議：WorkOrder completed + customer payment confirmed + 無重大爭議時成立；取消、退款、返工或爭議案件可暫緩或按實收比例計算。 | Use as Phase II default rule. Keep configurable; do not hardcode money amounts unless management later freezes exact config. |
| P2-18 | C. 師傅 AP、派工者抽成與品牌月結 | 品牌商 / Partner 月結怎麼處理？ | 建議 Phase II 分兩種：平台代收客戶款時，品牌走 monthly settlement；品牌付款案件，平台對品牌月結請款。完整 Partner Portal 留到 Phase III。 | Accounting / Brand Manager | Medium | 建議 Phase II 分兩種：平台代收客戶款時，品牌走 monthly settlement；品牌付款案件，平台對品牌月結請款。完整 Partner Portal 留到 Phase III。 | Use as Phase II default rule. Keep configurable; do not hardcode money amounts unless management later freezes exact config. |
| P2-19 | C. 師傅 AP、派工者抽成與品牌月結 | 品牌 warranty / RMA 費用誰負責？ | 建議按 responsibility matrix：產品瑕疵 = brand；安裝問題 = technician/platform；客戶使用問題 = customer；環境/門況問題 = 依 quote/onsite evidence 判斷。 | Brand / Accounting / Operator Leader | Medium | 建議按 responsibility matrix：產品瑕疵 = brand；安裝問題 = technician/platform；客戶使用問題 = customer；環境/門況問題 = 依 quote/onsite evidence 判斷。 | Use as Phase II default rule. Keep configurable; do not hardcode money amounts unless management later freezes exact config. |
| P2-20 | D. 月結、現金代收、爭議暫扣 | 月結 cutoff 與付款日？ | 建議預設：每月最後一天 cutoff；次月第 3 個工作日出 preliminary statement；第 5 個工作日前完成 review；第 10 或第 15 個工作日付款。 | Accounting / Management | High | 建議預設：每月最後一天 cutoff；次月第 3 個工作日出 preliminary statement；第 5 個工作日前完成 review；第 10 或第 15 個工作日付款。 | Use as Phase II default rule. Keep configurable; do not hardcode money amounts unless management later freezes exact config. |
| P2-21 | D. 月結、現金代收、爭議暫扣 | 師傅現金代收怎麼控管？ | 建議：師傅現場收現金必須當日上傳收款紀錄，2 個工作日內繳回。未繳回金額自下期 payout 抵扣；逾期可暫停派工資格。 | Accounting / Dispatch Lead | High | 建議：師傅現場收現金必須當日上傳收款紀錄，2 個工作日內繳回。未繳回金額自下期 payout 抵扣；逾期可暫停派工資格。 | Use as Phase II default rule. Keep configurable; do not hardcode money amounts unless management later freezes exact config. |
| P2-22 | D. 月結、現金代收、爭議暫扣 | 爭議暫扣要扣多少？ | 建議：只暫扣 disputed amount，不扣整張月結；但疑似詐欺、未繳回現金、嚴重客訴、未退料、no-show 可暫扣更多並需主管 reason code。 | Accounting / Operator Leader | High | 建議：只暫扣 disputed amount，不扣整張月結；但疑似詐欺、未繳回現金、嚴重客訴、未退料、no-show 可暫扣更多並需主管 reason code。 | Use as Phase II default rule. Keep configurable; do not hardcode money amounts unless management later freezes exact config. |
| P2-23 | D. 月結、現金代收、爭議暫扣 | 扣款類型有哪些？ | 建議類型：未繳回現金、未退料、客訴責任、返工成本、違約/no-show、錯誤施工、證據未上傳、主管核准扣款。扣款必須有 evidence 和 approval。 | Accounting / Dispatch Lead | Medium | 建議類型：未繳回現金、未退料、客訴責任、返工成本、違約/no-show、錯誤施工、證據未上傳、主管核准扣款。扣款必須有 evidence 和 approval。 | Use as Phase II default rule. Keep configurable; do not hardcode money amounts unless management later freezes exact config. |
| P2-24 | D. 月結、現金代收、爭議暫扣 | 爭議解除後怎麼付款？ | 建議：dispute resolved 後進入下一期月結，或由 accounting 手動加開 adjustment payout。所有 release / adjustment 都要 audit。 | Accounting | Medium | 建議：dispute resolved 後進入下一期月結，或由 accounting 手動加開 adjustment payout。所有 release / adjustment 都要 audit。 | Use as Phase II default rule. Keep configurable; do not hardcode money amounts unless management later freezes exact config. |
| P2-25 | E. 發票、報表與 Phase II UAT | 發票 / 收據誰開？ | 建議：B2C 平台收款由平台開立；品牌/建商案件依 contract 決定由品牌、平台或合作方開立。Phase II 先記 invoice responsibility，不先做完整稅務自動化。 | Accounting / Brand Manager | Medium | 建議：B2C 平台收款由平台開立；品牌/建商案件依 contract 決定由品牌、平台或合作方開立。Phase II 先記 invoice responsibility，不先做完整稅務自動化。 | Use as Phase II default rule. Keep configurable; do not hardcode money amounts unless management later freezes exact config. |
| P2-26 | E. 發票、報表與 Phase II UAT | 月結報表需要哪些欄位？ | 建議至少包含：WorkOrder ID、完成日、客戶/品牌、師傅、派工者、服務類型、收款方式、實收、退款、材料、車馬費、扣款、暫扣、應付、approval status、evidence link。 | Accounting / AI Specialist | High | 建議至少包含：WorkOrder ID、完成日、客戶/品牌、師傅、派工者、服務類型、收款方式、實收、退款、材料、車馬費、扣款、暫扣、應付、approval status、evidence link。 | Use as Phase II default rule. Keep configurable; do not hardcode money amounts unless management later freezes exact config. |
| P2-27 | E. 發票、報表與 Phase II UAT | 會計 review dashboard 要看什麼？ | 建議 dashboard：未收款 AR、退款待核、現金未繳回、爭議暫扣、師傅應付、派工者 commission、品牌月結、取消/車馬/檢測費統計。 | Accounting / AI Specialist | Medium | 建議 dashboard：未收款 AR、退款待核、現金未繳回、爭議暫扣、師傅應付、派工者 commission、品牌月結、取消/車馬/檢測費統計。 | Use as Phase II default rule. Keep configurable; do not hardcode money amounts unless management later freezes exact config. |
| P2-28 | E. 發票、報表與 Phase II UAT | Phase II UAT 要測哪些案例？ | 建議至少測：正常完工付款、訂金+尾款、現金代收、取消費、車馬費、檢測費、退款、加價不同意、品牌保固、爭議暫扣、師傅月結、派工者抽成。 | Operator Leader / Accounting / AI Specialist | High | 建議至少測：正常完工付款、訂金+尾款、現金代收、取消費、車馬費、檢測費、退款、加價不同意、品牌保固、爭議暫扣、師傅月結、派工者抽成。 | Use as Phase II default rule. Keep configurable; do not hardcode money amounts unless management later freezes exact config. |
| P2-29 | E. 發票、報表與 Phase II UAT | AI 在 Phase II 可以做什麼？ | AI 可以分類 payment/refund/settlement issue、提示缺資料、草擬客服回覆、提醒 evidence；AI 不可核准退款、不可修改月結、不可判定保固責任、不可承諾法律/安全結果。 | AI Specialist / Operator Leader | High | AI 可以分類 payment/refund/settlement issue、提示缺資料、草擬客服回覆、提醒 evidence；AI 不可核准退款、不可修改月結、不可判定保固責任、不可承諾法律/安全結果。 | Use as Phase II default rule. Keep configurable; do not hardcode money amounts unless management later freezes exact config. |
| P2-30 | E. 發票、報表與 Phase II UAT | Phase II 不應先自動化什麼？ | 建議不要先自動化：完整稅務申報、銀行自動 reconciliation、payroll、完整 Partner Portal、自動保固責任判定、自動 refund approval。先做 workflow + report + approval。 | Accounting / Management / AI Specialist | Medium | 建議不要先自動化：完整稅務申報、銀行自動 reconciliation、payroll、完整 Partner Portal、自動保固責任判定、自動 refund approval。先做 workflow + report + approval。 | Use as Phase II default rule. Keep configurable; do not hardcode money amounts unless management later freezes exact config. |
| Priority | Decision | Accepted Direction | Related IDs |  |  |  |  |
| 1 | Deposit / prepayment threshold | Use configurable trigger rules; urgent, high amount, new customer, special door/material/cross-area cases default to deposit required. | P2-01 / P2-02 |  |  |  |  |
| 2 | Cancellation fee matrix | Use stage-based cancellation fee matrix; exact amounts configurable and supervisor override allowed. | P2-06 / P2-07 |  |  |  |  |
| 3 | Travel / inspection fee | Charge when technician has departed/arrived or completed inspection; default split 80% technician / 20% platform unless contract overrides. | P2-08 / P2-09 / P2-10 |  |  |  |  |
| 4 | Refund approval | Use amount-based approval levels and reason codes. | P2-11 / P2-12 |  |  |  |  |
| 5 | Technician payout | Approved labor + approved travel/inspection + material reimbursement - platform fee - cash not returned - deductions - dispute withholding. | P2-14 / P2-15 |  |  |  |  |
| 6 | Dispatcher commission | Configurable fixed amount or 5%-10% of service labor; becomes payable after completed + paid + no major dispute. | P2-16 / P2-17 |  |  |  |  |
| 7 | Monthly close | Month-end cutoff; preliminary statement by 3rd business day, review by 5th, payment by 10th/15th business day. | P2-20 |  |  |  |  |
| 8 | Dispute withholding | Withhold only disputed amount by default; severe cases may hold more with reason code and approval. | P2-22 / P2-23 / P2-24 |  |  |  |  |
| Final Sheets To Treat As Updated By This 更新整理 | Update Meaning |  |  |  |  |  |  |
| 08 付款月結 | Phase II finance / settlement defaults are accepted. |  |  |  |  |  |  |
| M11 AR退款 | Payment proof, AR status, refund reason and refund approval defaults are accepted. |  |  |  |  |  |  |
| M12 AP月結 | Technician AP, dispatcher commission, brand settlement, cash offset and dispute withholding defaults are accepted. |  |  |  |  |  |  |
| M15 異常核准 | Customer cancellation, added-price refusal, refund and dispute approval return paths are accepted. |  |  |  |  |  |  |
| 10 Coding前必決 | Phase II finance open items from 04 review are no longer unanswered; they are accepted defaults unless later modified by accounting. |  |  |  |  |  |  |
| Final AI Follow-up | AI Specialist should convert these accepted answers into module contracts and configurable rules. |  |  |  |  |  |  |
| Configurable Rule Requirement | Accepted Direction | AI Specialist Instruction |  |  |  |  |  |
| System setup principle | Final / Phase II answers are initial default business rules, not hardcoded constants. | Build these as System Setup / Admin Configuration rules. |  |  |  |  |  |
| Change governance | Every rule change needs request owner, approval owner, old value, new value, effective date, audit log and rollback note where needed. | Create approval + audit contract before automation. |  |  |  |  |  |
| Rule versioning | Confirmed or closed WorkOrders should keep the rule version used at quote / payment / dispatch / settlement. | Do not silently recalculate old WorkOrders after future config changes. |  |  |  |  |  |
| Configurable items | Deposit threshold, cancellation fee, travel/inspection fee, refund approval, payout formula, commission rule, monthly cutoff, dispute withholding, reason codes, templates and brand settlement rules. | Expose to authorized users only; no all-access defaults. |  |  |  |  |  |
| AI limitation | AI may classify, summarize and flag missing evidence; AI cannot approve refund, modify settlement, decide warranty liability or promise legal/safety result. | Add finance guardrail tests. |  |  |  |  |  |

## 09 Phase III-V

> 後續 Phase III / IV / V Scope

> 後續 phase 仍納入 blueprint，但不阻塞 Phase I/II。

| Phase | Area | Scope | 前置條件 | 提醒 |
|---|---|---|---|---|
| Phase III | Partner Portal | 品牌商、經銷、門市、建商可依 contract 查看案件、報表、月結 | Partner visibility、contract rule、role boundary | 不得在 Phase I/II 暴露 partner data |
| Phase III | Builder Project / Unit List | 建商 project、site group、building/floor/unit、handover warranty date | 需 partner/brand 決策 | Phase I/II 只保留欄位與 export |
| Phase III | Warranty / RMA Responsibility | 品牌責任、師傅責任、客戶損壞、平台 goodwill 分類 | 需 responsibility matrix | AI 不可決定責任 |
| Phase IV | AI Ops Governance | RAG/SOP/source version、Eval、feedback queue、quality review | source owner、approval、rollback | Phase I 先做 forbidden action guardrails |
| Phase IV | Advanced AI QA | Golden Q&A、tool correctness、RAG accuracy、safety tests | AI Specialist 定義 thresholds | 不阻塞 Phase I/II launch |
| Phase V | BI / KPI Dashboard | 管理層、會計、營運、品牌/partner 報表 | 真實資料後凍結 KPI formula | Phase I/II 先確保 event/audit data |

## 10 流程Gate

| 核心流程 Gate | col_2 | col_3 | col_4 | col_5 | col_6 | col_7 | 核心流程 Gate |
|---|---|---|---|---|---|---|---|
| 從進線到完工、付款、異常與月結的 gate 清單。 |  |  |  |  |  |  | 從進線到完工、付款、異常與月結的 gate 清單。 |
| 步驟 | 業務流程 | Primary Module | 流程 Gate / Coding Gate | 輸出 | 關聯模組 | 營運 備註 | 步驟 |
| 1 | Customer/channel intake | M01 | 已取得 customer / channel / source | Case created | M02,M03 |  | 2 |
| 2 | 補齊 customer、site、device 資料 | M02 | 已檢查 customer 重複；site/device 已連結 | Customer/Site/Device profile ready | M03,M13 |  | 3 |
| 3 | AI 或客服分診 | M03 | ProblemCard 完整度與風險分類 | ProblemCard 可進下一步 / escalation | M04,M06,M20 |  | 4 |
| 4 | Evidence collection | M09 | Required photos/video/documents attached | Evidence gate passed | M04,M06,M13 |  | 5 |
| 5 | 報價與價格核准 | M04 | customer total 與 internal cost 分離；必要時需 approval | Customer quote ready | M11,M15 |  | 6 |
| 6 | Customer confirmation/payment gate | M11 | customer 確認 price/time；必要時收 deposit | Order accepted | M05 |  | 7 |
| 7 | 建立 WorkOrder 並控制 lifecycle | M05 | 正確狀態與允許的下一步 | WorkOrder 可進派工 | M06 |  | 8 |
| 8 | Dispatch/matching/schedule | M06 | 依 skill、area、time、SLA、inventory 確認合格 locksmith | Accepted assignment | M07,M10 |  | 9 |
| 9 | Technician readiness | M07 | 已檢查 skill/brand authorization、availability、pay rules | Technician ready | M08 |  | 10 |
| 10 | BOM/material readiness | M10 | 已檢查 BOM、serial、stock、material owner | 材料 ready 或進 exception | M08,M15 |  | 11 |
| 11 | Onsite execution | M08 | GPS arrival、checklist、scope control | 已施工或已提出 exception | M09,M15 |  | 12 |
| 12 | Exception/approval handling | M15 | 已選 return path：continue / requote / reschedule / cancel / RMA / refund | Approved exception action | M05,M11,M13 |  | 13 |
| 13 | Completion/evidence package | M08 | photos、usage、signature、teaching、payment proof | Completion submitted | M09,M11 |  | 14 |
| 14 | AR/AP/monthly settlement | M11/M12 | customer payment 已 reconcile；technician/partner/brand settlement 已準備 | Finance cleared | M19 |  | 15 |
| 15 | Complaint/warranty/RMA | M13 | after-sales 已連結原 case/site/device/payment | RMA resolved | M07,M10,M19 |  | 16 |
| 16 | Communication and notifications | M16 | 通知正確角色，messages 依 visibility 記錄 | Conversation complete | M17 |  | 17 |
| 17 | Authorization/audit | M17 | sensitive changes 已記錄，access boundary 已執行 | Audit compliant | M18 |  | 18 |
| 18 | System setup 與 AI ops governance | M18/M20 | rules、templates、AI SOP、master data 已版本控管 | configuration 已可支援 coding / operations | 全部模組 |  | 19 |

## 11 權限角色矩陣

> 角色與權限矩陣

> 誰可以看、改、核准、維護。

| 角色 | 中文 | 職責 | 預設可見範圍 | 限制 | 模組存取預設 | 待確認決策 | 營運 備註 |
|---|---|---|---|---|---|---|---|
| Customer | 客戶 | 提出需求、補照片、確認價格/時間、付款、簽收 | 只看自己的工單、報價總額、預約、付款、售後狀態 | 不可看內部成本、師傅工資、品牌責任 | 僅限角色相關模組 | 必須確認精確 can-view / can-edit / can-approve 矩陣 | Only can sign up approval and customer final totoal price |
| AI Bot | AI 客服 | 分診、收資料、提醒補件、草擬區間報價、轉真人 | 可讀必要 SOP/知識庫與當前聊天內容 | 不可 final price、退款、保固責任、法律/安全承諾 | 僅限角色相關模組 | 必須確認精確 can-view / can-edit / can-approve 矩陣 |  |
| Customer Service | 真人客服 | 建立/修正 ProblemCard、報價溝通、客訴處理 | 看客戶資料、工單、聊天、證據、基本付款狀態 | 高金額折讓/退款需主管或會計 | 僅限角色相關模組 | 必須確認精確 can-view / can-edit / can-approve 矩陣 |  |
| Dispatcher | 派工者/派工主管 | 媒合師傅、排程、改派、處理延遲 | 看派工必要資訊、師傅狀態、區域、技能、SLA | 不可任意改會計核銷或退款 | 僅限角色相關模組 | 必須確認精確 can-view / can-edit / can-approve 矩陣 |  |
| Locksmith | 師傅 | 接單、到場、施工、回報、收款/代收、完工 | 看自己案件必要地址、照片、工單內容、收款狀態、月結 | 不可看其他師傅、內部毛利、品牌全資料 | 只看自己的 M06/M08/M10/M12 紀錄 | 必須確認精確 can-view / can-edit / can-approve 矩陣 |  |
| Brand User | 品牌商 | 保固判斷、品牌案件追蹤、RMA 支援、B2B 月結 | 只看自己品牌案件、必要照片、保固與月結 | 不可看其他品牌、內部師傅工資與平台毛利 | 只看自己品牌的 M10/M13/M14/M12 紀錄 | 必須確認精確 can-view / can-edit / can-approve 矩陣 |  |
| Dealer / Store / Builder（經銷 / 門市 / 建商） | 經銷商/門市/建商 | 代客建案、批次專案、追蹤 B2B 工單 | 只看自己來源/專案案件與合約可見欄位 | 不可看平台內部派工成本 | 僅限角色相關模組 | 必須確認精確 can-view / can-edit / can-approve 矩陣 |  |
| Accounting | 會計 | AR/AP、收款核銷、退款、月結、發票 | 看財務全資料與必要工單證據 | 不應任意改施工狀態 | M11、M12、M19；讀取指定 M05/M09/M13 | 必須確認精確 can-view / can-edit / can-approve 矩陣 |  |
| Supervisor | 主管 | 價格、退款、權限、責任、客訴、月結規則拍板 | 看全域報表與高風險案件 | 重大操作需 audit | 全部模組，但必須 audit | 必須確認精確 can-view / can-edit / can-approve 矩陣 |  |
| Central Admin | 中央管理員 | 建立角色、組織、主檔、模板、流程設定 | 看系統設定與必要資料 | 不應直接代替業務核准財務例外 | 全部模組，但必須 audit | 必須確認精確 can-view / can-edit / can-approve 矩陣 |  |
| System Setup Admin | 系統設定者 | 服務項目、價格表、狀態代碼、SLA、通知模板 | 看設定與版本歷史 | 設定變更需 owner approval | 僅限角色相關模組 | 必須確認精確 can-view / can-edit / can-approve 矩陣 |  |
| IT Support | IT 維運使用者 | 帳號協助、故障排除、資料修正支援 | 預設不看敏感個資/財務，必要時臨時授權 | 所有支援存取需期限與 audit | M18 搭配 temporary audited access | 必須確認精確 can-view / can-edit / can-approve 矩陣 |  |
| AI Ops Admin | AI 營運管理者 | AI 知識庫、SOP、測試案例、轉真人規則 | 看 AI 對話品質與知識庫 | 不可直接更改財務/派工正式規則 | M20,M03,M16 read/testing | 必須確認精確 can-view / can-edit / can-approve 矩陣 |  |
| Auditor | 稽核/只讀 | 稽核流程、權限、付款、客訴、設定變更 | 只讀 audit log、報表、抽樣工單 | 不可改任何營運資料 | 僅限角色相關模組 | 必須確認精確 can-view / can-edit / can-approve 矩陣 |  |

## 12 角色維護者

> 角色與系統維護者

> 系統使用者、維護者、IT/admin、AI Ops 角色定義。

| 角色 | 中文 | 主要職責 | 預設可見範圍 | 預設限制 |
|---|---|---|---|---|
| Customer | 客戶 | 提出需求、補照片、確認價格/時間、付款、簽收 | 只看自己的工單、報價總額、預約、付款、售後狀態 | 不可看內部成本、師傅工資、品牌責任 |
| AI Bot | AI 客服 | 分診、收資料、提醒補件、草擬區間報價、轉真人 | 可讀必要 SOP/知識庫與當前聊天內容 | 不可 final price、退款、保固責任、法律/安全承諾 |
| Customer Service | 真人客服 | 建立/修正 ProblemCard、報價溝通、客訴處理 | 看客戶資料、工單、聊天、證據、基本付款狀態 | 高金額折讓/退款需主管或會計 |
| Dispatcher | 派工者/派工主管 | 媒合師傅、排程、改派、處理延遲 | 看派工必要資訊、師傅狀態、區域、技能、SLA | 不可任意改會計核銷或退款 |
| Locksmith | 師傅 | 接單、到場、施工、回報、收款/代收、完工 | 看自己案件必要地址、照片、工單內容、收款狀態、月結 | 不可看其他師傅、內部毛利、品牌全資料 |
| Brand User | 品牌商 | 保固判斷、品牌案件追蹤、RMA 支援、B2B 月結 | 只看自己品牌案件、必要照片、保固與月結 | 不可看其他品牌、內部師傅工資與平台毛利 |
| Dealer / Store / Builder（經銷 / 門市 / 建商） | 經銷商/門市/建商 | 代客建案、批次專案、追蹤 B2B 工單 | 只看自己來源/專案案件與合約可見欄位 | 不可看平台內部派工成本 |
| Accounting | 會計 | AR/AP、收款核銷、退款、月結、發票 | 看財務全資料與必要工單證據 | 不應任意改施工狀態 |
| Supervisor | 主管 | 價格、退款、權限、責任、客訴、月結規則拍板 | 看全域報表與高風險案件 | 重大操作需 audit |
| Central Admin | 中央管理員 | 建立角色、組織、主檔、模板、流程設定 | 看系統設定與必要資料 | 不應直接代替業務核准財務例外 |
| System Setup Admin | 系統設定者 | 服務項目、價格表、狀態代碼、SLA、通知模板 | 看設定與版本歷史 | 設定變更需 owner approval |
| IT Support | IT 維運使用者 | 帳號協助、故障排除、資料修正支援 | 預設不看敏感個資/財務，必要時臨時授權 | 所有支援存取需期限與 audit |
| AI Ops Admin | AI 營運管理者 | AI 知識庫、SOP、測試案例、轉真人規則 | 看 AI 對話品質與知識庫 | 不可直接更改財務/派工正式規則 |
| Auditor | 稽核/只讀 | 稽核流程、權限、付款、客訴、設定變更 | 只讀 audit log、報表、抽樣工單 | 不可改任何營運資料 |

## 13 狀態異常

> 狀態與異常矩陣

> 正常狀態、異常狀態、return path 與 owner。

| 對象 | 正常狀態 | 異常 / 風險狀態 | Owner 模組 | Return Path / 業務動作 | 營運 備註 |
|---|---|---|---|---|---|
| Case | New / Need Info / Converted / Closed | 缺客戶資料、重複客戶、錯入口 | M01/M02 | 補資料、合併、升 ProblemCard |  |
| ProblemCard | Draft / Need Photo / Ready for Quote / Escalated / Closed Remote | 照片不足、保固不明、AI 失敗 | M03/M09/M20 | 補件、真人客服、關閉或轉報價 |  |
| Quote | Draft / Internal Approved / Customer Sent / Customer Confirmed / Expired | 高金額、特殊門型、價格爭議 | M04/M15 | 主管核准、重報價、過期重開 |  |
| Payment | Deposit Required / Paid / Pending / Failed / Refund Requested | 末五碼不符、現金代收未繳、退款爭議 | M11/M12 | 會計核銷、暫扣、退款核准 |  |
| WorkOrder | Created / Waiting Dispatch / Assigned / Accepted / Rescheduled / Cancelled | 無師傅、拒單、逾時、客戶改期 | M05/M06 | 改派、重排、取消費判斷 |  |
| Onsite | Arrived / Working / Scope Change / Completed / Customer Not Onsite | 客戶不在、加價、缺料、安全風險 | M08/M15 | 照片、客戶確認、暫停或改期 |  |
| Material | Reserved / Missing / Used / Returned / Defective | 缺料、未退料、序號缺失 | M10/M12 | 備料、改期、扣款、RMA |  |
| RMA | Opened / Investigating / Assigned / Resolved / Rejected | 責任不明、品牌保固爭議、退款爭議 | M13/M15 | 責任矩陣、返修、折讓、退款 |  |
| System Config | Draft / Pending Approval / Active / Retired | 錯價格、錯權限、錯模板 | M18/M17 | 變更申請、核准、生效日、回滾 |  |
| AI Rule | Draft / Test / Approved / Active / Suspended | AI 錯答、誤報價、未轉真人 | M20/M03 | 停用規則、修 SOP、測試後發布 |  |

## 14 付款月結

> 付款與月結 Matrix

> Customer AR、Technician AP、Partner/Brand settlement、refund、cash offset。

| Ledger / 流程 | 中文 | 涵蓋範圍 | 模組 | 負責人 | 核心控制 | 營運 備註 |
|---|---|---|---|---|---|---|
| Customer AR | 客戶應收 | 訂金、尾款、檢測費、車馬費、加價、退款 | M11 | 會計 | 每筆金流需核銷到工單或 RMA |  |
| Technician AP | 師傅應付 | 工資、加班、加價分潤、扣款、暫扣 | M12 | 會計 / 派工主管 | 客訴爭議只暫扣爭議金額 |  |
| Cash Collection | 師傅代收 | 現金、現場收款、代收產品款 | M11/M12 | 師傅 / 會計 | 需上傳收款證明並月結抵扣 |  |
| Brand Settlement | 品牌月結 | 品牌價、保固件、品牌責任費、退款/折讓 | M12/M14 | 會計 / 品牌 | 品牌只能看品牌相關資料 |  |
| Dispatcher Commission | 派工者月結 | 派工佣金、合作廠商抽成、扣款 | M12/M14 | 會計 | 需和師傅工資分表 |  |
| Refund Ledger | 退款帳 | 全額退款、部分退款、扣車馬、扣檢測、產品退款 | M11/M15 | 主管 / 會計 | 依金額分層核准 |  |
| Invoice / Tax | 發票稅務 | B2C、B2B、品牌、建商、平台代收 | M11/M12 | 會計 | 開票責任依案件類型 |  |

## 15 Coding必做

> Coding 前必做 / 必決

> 已保留 final rule 與 coding impact；不保留歷史 decision marker。

| 優先級 | Decision ID | 模組 | 決策範圍 | 建議預設答案 | 決策 Owner | Coding 影響 | 最終規則 |
|---|---|---|---|---|---|---|---|
| P0 | 前期-P0-01 | Cross | 報價顯示規則 | 客戶只看實收總額；內部看成本拆分 | 主管 / 客服主管 | 會阻擋完整 business contract / UAT sign-off | 客戶只看實收總額；內部看成本拆分 |
| P0 | 前期-P0-02 | Cross | 訂金 / 預付款 | 高金額、急件、新客戶需在報價定義 | 主管 / 會計 | 會阻擋完整 business contract / UAT sign-off | 高金額、急件、新客戶需在報價定義 |
| P0 | 前期-P0-03 | Cross | 報價有效期 | 依案件：3、7、15、30 天、品牌規則 | 主管 | 會阻擋完整 business contract / UAT sign-off | 依案件：3、7、15、30 天、品牌規則 |
| P0 | 前期-P0-04 | Cross | 工單成立點 | 客戶確認最終價格與時間後成立；需付款案件需付款 gate | 主管 / 派工 | 會阻擋完整 business contract / UAT sign-off | 客戶確認最終價格與時間後成立；需付款案件需付款 gate |
| P0 | 前期-P0-05 | Cross | 接單 SLA | 一般 10 分鐘，急件 5 分鐘 | 派工主管 | 會阻擋完整 business contract / UAT sign-off | 一般 10 分鐘，急件 5 分鐘 |
| P0 | 前期-P0-06 | Cross | 搶單限制 | 標準、低風險、一般地區、1 小時車程內 | 派工主管 | 會阻擋完整 business contract / UAT sign-off | 標準、低風險、一般地區、1 小時車程內 |
| P0 | 前期-P0-07 | Cross | 加價確認 | 師傅提出，客戶簽名，客服留紀錄 | 主管 | 會阻擋完整 business contract / UAT sign-off | 師傅提出，客戶簽名，客服留紀錄 |
| P0 | 前期-P0-08 | Cross | 客戶不同意加價 | 收檢測費 / 車馬費 / 改期 / 客服協調 | 主管 | 會阻擋完整 business contract / UAT sign-off | 收檢測費 / 車馬費 / 改期 / 客服協調 |
| P0 | 前期-P0-09 | Cross | 取消費 | 前期 未決，需定義付款後、當日、出發後、到場後 | 主管 / 會計 | 會阻擋完整 business contract / UAT sign-off | 前期 未決，需定義付款後、當日、出發後、到場後 |
| P0 | 前期-P0-10 | Cross | 車馬費 | 到場才收，需定金額與歸屬 | 主管 / 派工 | 會阻擋完整 business contract / UAT sign-off | 到場才收，需定金額與歸屬 |
| P0 | 前期-P0-11 | Cross | 退款核准 | 前期 未決，需依金額分層 | 主管 / 會計 | 會阻擋完整 business contract / UAT sign-off | 前期 未決，需依金額分層 |
| P0 | 前期-P0-12 | Cross | 權限 | 品牌商 / 師傅不建議 all access | 主管 | 會阻擋完整 business contract / UAT sign-off | 品牌商 / 師傅不建議 all access |
| P0 | 前期-P0-13 | Cross | 月結 | 師傅月結、派工人月結、品牌月結分表 | 會計 | 會阻擋完整 business contract / UAT sign-off | 師傅月結、派工人月結、品牌月結分表 |
| P0 | 前期-P0-14 | Cross | RMA 編號 | RMA + 年月 + 流水號 | 客服主管 | 會阻擋完整 business contract / UAT sign-off | RMA + 年月 + 流水號 |
| P0 | 前期-P0-15 | Cross | 保固 | 購買日 + 序號；建商案是否點交日需補 | 主管 / 品牌商 | 會阻擋完整 business contract / UAT sign-off | 購買日 + 序號；建商案是否點交日需補 |
| P0 | BR-M01-01 | M01 | 客戶入口與案件建立 - Channel source is mandatory | 每個 Case 必須保留 source channel：LINE、電話、web、brand、store、dealer、builder、referral。 | 客服主管 | 會阻擋模組 coding 或 acceptance testing | 每個 Case 必須保留 source channel：LINE、電話、web、brand、store、dealer、builder、referral。 |
| P0 | BR-M01-03 | M01 | 客戶入口與案件建立 - External portal limit | External partners 只能建立或查看自己被允許的 cases；internal staff 可代為建立。 | Partner manager / 主管 | 會阻擋模組 coding 或 acceptance testing | External partners 只能建立或查看自己被允許的 cases；internal staff 可代為建立。 |
| P0 | BR-M02-01 | M02 | 客戶、地址、設備主檔 - Customer duplicate rule | 預設 duplicate key 為 phone + LINE ID；address 可輔助比對，但不能作為唯一 key。 | Data steward | 會阻擋模組 coding 或 acceptance testing | 預設 duplicate key 為 phone + LINE ID；address 可輔助比對，但不能作為唯一 key。 |
| P0 | BR-M02-02 | M02 | 客戶、地址、設備主檔 - Device record for warranty | 主鎖與高價零件應建立 Device record，包含 brand、model、serial、purchase/install/warranty date。 | 客服主管 / 品牌 | 會阻擋模組 coding 或 acceptance testing | 主鎖與高價零件應建立 Device record，包含 brand、model、serial、purchase/install/warranty date。 |
| P0 | BR-M03-02 | M03 | AI 分診與 ProblemCard - AI escalation | 遇到 urgent、angry customer、高金額、保固不明、refund、safety/legal 或 3 次失敗循環，AI 必須轉真人。 | 客服主管 / AI owner | 會阻擋模組 coding 或 acceptance testing | 遇到 urgent、angry customer、高金額、保固不明、refund、safety/legal 或 3 次失敗循環，AI 必須轉真人。 |
| P0 | BR-M03-03 | M03 | AI 分診與 ProblemCard - No final AI quote | AI 只能建議 range / draft；final customer price 需真人或已核准 fixed-price rule。 | 客服主管 / 主管 | 會阻擋模組 coding 或 acceptance testing | AI 只能建議 range / draft；final customer price 需真人或已核准 fixed-price rule。 |
| P0 | BR-M04-01 | M04 | 報價、價格、核准 - Internal and customer quote separation | Customer 只看 total receivable；internal view 保留 labor、material、travel、margin、brand cost。 | 主管 / 會計 | 會阻擋模組 coding 或 acceptance testing | Customer 只看 total receivable；internal view 保留 labor、material、travel、margin、brand cost。 |
| P0 | BR-M04-02 | M04 | 報價、價格、核准 - Price table versioning | Price table 必須有 effective date 與 owner；已確認 WorkOrder 保留原核准價格。 | System admin / 主管 | 會阻擋模組 coding 或 acceptance testing | Price table 必須有 effective date 與 owner；已確認 WorkOrder 保留原核准價格。 |
| P0 | BR-M04-03 | M04 | 報價、價格、核准 - Approval by amount/risk | 高金額、特殊門、保固不明、discount、類 refund adjustment，在 customer confirmation 前需 approval。 | 主管 | 會阻擋模組 coding 或 acceptance testing | 高金額、特殊門、保固不明、discount、類 refund adjustment，在 customer confirmation 前需 approval。 |
| P0 | BR-M05-01 | M05 | 工單生命週期與狀態 - Official state machine | 只有 approved roles 可推動 core states；cancel、reopen、reschedule、refund、dispute 必須填 status reason。 | System admin / 派工主管 | 會阻擋模組 coding 或 acceptance testing | 只有 approved roles 可推動 core states；cancel、reopen、reschedule、refund、dispute 必須填 status reason。 |
| P0 | BR-M05-03 | M05 | 工單生命週期與狀態 - Customer confirmation gate | 只有 customer price/time/payment gate 滿足後，WorkOrder 才可進入 dispatch。 | 主管 / 派工主管 | 會阻擋模組 coding 或 acceptance testing | 只有 customer price/time/payment gate 滿足後，WorkOrder 才可進入 dispatch。 |
| P0 | BR-M06-02 | M06 | 派工、媒合、排程 - Grab-order restriction | 只有核准 travel time 內的 low-risk standard jobs 可進入 grab-order pool。 | 派工主管 | 會阻擋模組 coding 或 acceptance testing | 只有核准 travel time 內的 low-risk standard jobs 可進入 grab-order pool。 |
| P0 | BR-M06-03 | M06 | 派工、媒合、排程 - Acceptance SLA | 建議 acceptance SLA：normal 15 分鐘、urgent 5 分鐘；前期 的 normal 10 分鐘是較嚴格選項，需 supervisor 確認。 | 派工主管 | 會阻擋模組 coding 或 acceptance testing | 建議 acceptance SLA：normal 15 分鐘、urgent 5 分鐘；前期 的 normal 10 分鐘是較嚴格選項，需 supervisor 確認。 |
| P0 | BR-M07-01 | M07 | 師傅與技術人力管理 - Technician onboarding | Technician 在 dispatch 前必須有 profile、bank/payment info、service area、skill matrix、brand authorization、contract status。 | 派工主管 | 會阻擋模組 coding 或 acceptance testing | Technician 在 dispatch 前必須有 profile、bank/payment info、service area、skill matrix、brand authorization、contract status。 |
| P0 | BR-M07-02 | M07 | 師傅與技術人力管理 - Suspension criteria | 高 complaint rate、no-show、未繳回代收款、未退料、嚴重安全問題，可暫停 dispatch eligibility。 | 派工主管 / 主管 | 會阻擋模組 coding 或 acceptance testing | 高 complaint rate、no-show、未繳回代收款、未退料、嚴重安全問題，可暫停 dispatch eligibility。 |
| P0 | BR-M08-02 | M08 | 現場施工與行動流程 - Scope change at site | 任何 onsite scope change 或 extra charge，繼續施工前都需要 customer confirmation 與 evidence。 | 主管 / 派工主管 | 會阻擋模組 coding 或 acceptance testing | 任何 onsite scope change 或 extra charge，繼續施工前都需要 customer confirmation 與 evidence。 |
| P0 | BR-M09-02 | M09 | 照片、影片、文件與證據 - Evidence visibility | Brand、locksmith、accounting、customer 依角色與 case ownership 看到不同 evidence sets。 | Central admin / 主管 | 會阻擋模組 coding 或 acceptance testing | Brand、locksmith、accounting、customer 依角色與 case ownership 看到不同 evidence sets。 |
| P0 | BR-M09-03 | M09 | 照片、影片、文件與證據 - Retention policy | 預設照片保存 1 年；warranty/RMA/dispute evidence 保存至 warranty/dispute period 加核准 buffer。 | 主管 / Compliance owner | 會阻擋模組 coding 或 acceptance testing | 預設照片保存 1 年；warranty/RMA/dispute evidence 保存至 warranty/dispute period 加核准 buffer。 |
| P0 | BR-M10-02 | M10 | 品牌、商品、BOM、庫存 - Inventory ownership | Material owner 可為 brand、company、locksmith、customer；ownership 決定 billing、return、warranty responsibility。 | 會計 / 庫存管理 | 會阻擋模組 coding 或 acceptance testing | Material owner 可為 brand、company、locksmith、customer；ownership 決定 billing、return、warranty responsibility。 |
| P0 | BR-M10-03 | M10 | 品牌、商品、BOM、庫存 - Serial control | 主鎖、保固件、高價電子件需 serial 綁定 WorkOrder / Device record。 | 品牌 / 主管 | 會阻擋模組 coding 或 acceptance testing | 主鎖、保固件、高價電子件需 serial 綁定 WorkOrder / Device record。 |
| P0 | BR-M11-01 | M11 | 客戶付款、應收、退款 - Payment reconciliation | 每筆 payment 必須 reconcile 到 WorkOrder、deposit、balance、travel fee、refund 或 RMA adjustment。 | 會計 | 會阻擋模組 coding 或 acceptance testing | 每筆 payment 必須 reconcile 到 WorkOrder、deposit、balance、travel fee、refund 或 RMA adjustment。 |
| P0 | BR-M11-02 | M11 | 客戶付款、應收、退款 - Refund approval levels | Refund 需依金額分層 approval；建議預設：refund > NTD 100,000 需 operations + finance double sign；partial refund 必須分類 product、labor、material、travel、inspection。 | 會計 / 主管 | 會阻擋模組 coding 或 acceptance testing | Refund 需依金額分層 approval；建議預設：refund > NTD 100,000 需 operations + finance double sign；partial refund 必須分類 product、labor、material、travel、inspection。 |
| P0 | BR-M11-03 | M11 | 客戶付款、應收、退款 - Invoice responsibility | Invoice issuer 依 B2C、B2B brand、builder project 或 platform collection model 決定。 | 會計 | 會阻擋模組 coding 或 acceptance testing | Invoice issuer 依 B2C、B2B brand、builder project 或 platform collection model 決定。 |
| P0 | BR-M12-01 | M12 | 師傅、派工者、品牌月結 - Separate AP ledgers | Technician AP、dispatcher commission、brand settlement、partner settlement 必須分開 ledger / report。 | 會計 | 會阻擋模組 coding 或 acceptance testing | Technician AP、dispatcher commission、brand settlement、partner settlement 必須分開 ledger / report。 |
| P0 | BR-M12-02 | M12 | 師傅、派工者、品牌月結 - Cash collection offset | Technician cash collection 抵扣 monthly payable；未繳回代收款可 hold payout。 | 會計 / 派工主管 | 會阻擋模組 coding 或 acceptance testing | Technician cash collection 抵扣 monthly payable；未繳回代收款可 hold payout。 |
| P0 | BR-M12-03 | M12 | 師傅、派工者、品牌月結 - Dispute withholding | 除非疑似 fraud 或 severe misconduct，只應暫扣 disputed amount。 | 主管 / 會計 | 會阻擋模組 coding 或 acceptance testing | 除非疑似 fraud 或 severe misconduct，只應暫扣 disputed amount。 |
| P0 | BR-M13-02 | M13 | 客訴、保固、RMA、品質 - Responsibility matrix | RMA 必須分類 responsibility：product/brand、installation/technician、customer use、environment、quote/customer service、dispatch、material delay。 | 客服主管 / 品牌 | 會阻擋模組 coding 或 acceptance testing | RMA 必須分類 responsibility：product/brand、installation/technician、customer use、environment、quote/customer service、dispatch、material delay。 |
| P0 | BR-M14-01 | M14 | 品牌商、經銷商、建商與合作夥伴 - Partner account scope | Brand / dealer / builder users 只能依 contract 查看自己的 cases、projects、settlement。 | Partner manager / 主管 | 會阻擋模組 coding 或 acceptance testing | Brand / dealer / builder users 只能依 contract 查看自己的 cases、projects、settlement。 |
| P0 | BR-M14-02 | M14 | 品牌商、經銷商、建商與合作夥伴 - Builder project setup | Builder projects 必須有 site group、unit list、handover/warranty date、contract price、SLA、invoice rules。 | Partner manager / 會計 | 會阻擋模組 coding 或 acceptance testing | Builder projects 必須有 site group、unit list、handover/warranty date、contract price、SLA、invoice rules。 |
| P0 | BR-M15-01 | M15 | 異常、核准、風險控制 - Exception return path | 每個 exception 必須選一個 return path：continue、requote、reschedule、reassign、new WorkOrder、cancel、refund、RMA、dispute。 | 主管 / 派工主管 | 會阻擋模組 coding 或 acceptance testing | 每個 exception 必須選一個 return path：continue、requote、reschedule、reassign、new WorkOrder、cancel、refund、RMA、dispute。 |
| P0 | BR-M15-02 | M15 | 異常、核准、風險控制 - Approval inbox | Supervisor / accounting / brand approvals 應進 approval inbox，不應只留在 chat。 | Central admin / 主管 | 會阻擋模組 coding 或 acceptance testing | Supervisor / accounting / brand approvals 應進 approval inbox，不應只留在 chat。 |
| P0 | BR-M15-03 | M15 | 異常、核准、風險控制 - High-risk stop rule | Warranty unclear、brand responsibility、safety risk、customer refuses added price、high-risk drilling/opening 必須 pause 到核准後才繼續。 | 主管 | 會阻擋模組 coding 或 acceptance testing | Warranty unclear、brand responsibility、safety risk、customer refuses added price、high-risk drilling/opening 必須 pause 到核准後才繼續。 |
| P0 | BR-M16-01 | M16 | 聊天、通知、溝通紀錄 - Conversation visibility | Customer、technician、brand、accounting、internal notes 必須依 visibility rules 分開。 | Central admin / 客服主管 | 會阻擋模組 coding 或 acceptance testing | Customer、technician、brand、accounting、internal notes 必須依 visibility rules 分開。 |
| P0 | BR-M16-03 | M16 | 聊天、通知、溝通紀錄 - Notification templates | Quote、photo request、payment、dispatch、delay、extra price、completion、RMA、refund 需要 approved templates。 | System admin / 客服主管 | 會阻擋模組 coding 或 acceptance testing | Quote、photo request、payment、dispatch、delay、extra price、completion、RMA、refund 需要 approved templates。 |
| P0 | BR-M17-01 | M17 | 權限、安全、稽核 - Can view/edit/approve matrix | 每個角色必須拆成 can-view、can-edit、can-approve；除 audited admin 外，不接受 all access。 | Central admin / 主管 | 會阻擋模組 coding 或 acceptance testing | 每個角色必須拆成 can-view、can-edit、can-approve；除 audited admin 外，不接受 all access。 |
| P0 | BR-M17-02 | M17 | 權限、安全、稽核 - Segregation of duties | 同一 user 不應在無 second approval 下同時 create、approve、reconcile refund。 | 會計 / 主管 | 會阻擋模組 coding 或 acceptance testing | 同一 user 不應在無 second approval 下同時 create、approve、reconcile refund。 |
| P0 | BR-M17-03 | M17 | 權限、安全、稽核 - Temporary IT support access | IT support sensitive access 必須 time-limited、reason-coded、audit logged。 | IT admin / 主管 | 會阻擋模組 coding 或 acceptance testing | IT support sensitive access 必須 time-limited、reason-coded、audit logged。 |
| P0 | BR-M18-01 | M18 | 系統設定、主檔配置、IT 維運 - Master configuration owner | Service items、price tables、status codes、SLA、templates、roles、regions 需要明確 owner 與 approval。 | System admin / 主管 | 會阻擋模組 coding 或 acceptance testing | Service items、price tables、status codes、SLA、templates、roles、regions 需要明確 owner 與 approval。 |
| P0 | BR-M18-02 | M18 | 系統設定、主檔配置、IT 維運 - Change request process | Configuration changes 需要 request、owner approval、effective date、rollback note。 | System admin / 主管 | 會阻擋模組 coding 或 acceptance testing | Configuration changes 需要 request、owner approval、effective date、rollback note。 |
| P0 | BR-M18-03 | M18 | 系統設定、主檔配置、IT 維運 - Initial setup import | Coding / UAT 前，先確認 first import list：brands、models、BOM、technicians、price、regions、roles、customers、open WorkOrders。 | 主管 / System admin | 會阻擋模組 coding 或 acceptance testing | Coding / UAT 前，先確認 first import list：brands、models、BOM、technicians、price、regions、roles、customers、open WorkOrders。 |
| P0 | BR-M19-01 | M19 | 報表、BI、KPI - KPI formula ownership | 每個 KPI 在 dashboard 成為 official 前，都必須有 formula owner 與穩定定義。 | 主管 / BI owner | 會阻擋模組 coding 或 acceptance testing | 每個 KPI 在 dashboard 成為 official 前，都必須有 formula owner 與穩定定義。 |
| P0 | BR-M19-02 | M19 | 報表、BI、KPI - Report download audit | Financial、brand、technician、customer report downloads 應依 role access 控管並 audit logged。 | Central admin / BI owner | 會阻擋模組 coding 或 acceptance testing | Financial、brand、technician、customer report downloads 應依 role access 控管並 audit logged。 |
| P0 | BR-M20-01 | M20 | AI 營運、知識庫、品質治理 - AI knowledge owner | AI SOP、brand FAQ、price range、escalation rules、forbidden actions 需要 owner 與 version approval。 | AI ops owner / 客服主管 | 會阻擋模組 coding 或 acceptance testing | AI SOP、brand FAQ、price range、escalation rules、forbidden actions 需要 owner 與 version approval。 |
| P0 | BR-M20-02 | M20 | AI 營運、知識庫、品質治理 - AI forbidden decisions | AI 不可 final quote、approve refund、decide warranty liability、promise legal/safety outcome 或 modify settlement。 | 主管 / AI owner | 會阻擋模組 coding 或 acceptance testing | AI 不可 final quote、approve refund、decide warranty liability、promise legal/safety outcome 或 modify settlement。 |

## 16 Coding順序

> Codex / Claude Coding Sequence

> 依 phase 與 module 拆 coding 順序。

| 順序 | 階段 | 模組 ID | 前期 模組名稱 | Build 目標 | 前置業務決策 | 主要角色 | Business Acceptance Check | Engineering Note | 營運 備註 |
|---|---|---|---|---|---|---|---|---|---|
| 1 | Phase 0 - 確認 business contract | M18 | System Setup, Master Configuration & IT Ops（系統設定、主檔配置與 IT Ops） | 定義 service items、roles、statuses、SLA、templates、import list | BR-M18-01, BR-M18-02, BR-M18-03 | Central admin、System admin、IT support | Configuration workbook 與 owner approvals 已確認 | setup owners 確認前，不開始 operational automation。 |  |
| 2 | Phase 0 - 確認 business contract | M17 | Authorization, Security & Audit（權限、安全與 Audit） | 定義 role can-view / can-edit / can-approve 與 audit events | BR-M17-01, BR-M17-02, BR-M17-03 | Supervisor、Accounting、IT admin | Role matrix 已由 management 核准 | Sensitive modules 依賴此決策。 |  |
| 3 | Phase 1 - Master data（主檔） | M02 | Customer / Site / Device Master（客戶/地址/設備主檔） | 建立 customer/site/device review flows 與 warranty identity | BR-M02-01, BR-M02-02, BR-M02-03 | Customer service、Data steward | Duplicate、device、site 範例通過 review | RMA 與 repeat-service logic 前必須完成。 |  |
| 4 | Phase 1 - Master data（主檔） | M10 | Product, BOM, Inventory & Serial Control（商品、BOM、庫存與序號） | 建立 brand/model/BOM/material ownership 與 serial rules | BR-M10-01, BR-M10-02, BR-M10-03 | Brand, Inventory, Accounting | 前兩個 brands 與 BOM 已 review | Keep BOM two-layer. |  |
| 5 | Phase 1 - Workforce / partner setup | M07 | Workforce & Technician Qualification（師傅資格與人力管理） | 建立 technician profile、skill matrix、service area、eligibility | BR-M07-01, BR-M07-02, BR-M07-03 | Dispatcher, Technician manager | Technician onboarding checklist 已核准 | Dispatch 依賴此 eligibility。 |  |
| 6 | Phase 1 - Workforce / partner setup | M14 | Brand / Dealer / Builder Partner Portal（品牌/經銷/建商 Partner Portal） | 定義 partner accounts、B2B projects 與 data boundaries | BR-M14-01, BR-M14-02, BR-M14-03 | Partner manager、Brand、Builder | Partner visibility 與 project sample 已核准 | 不可過度暴露 platform cost。 |  |
| 7 | Phase 2 - Intake and triage（進線與分診） | M01 | Customer & Omnichannel Intake（客戶與全渠道入口） | 建立 omnichannel Case creation 與 source tracking | BR-M01-01, BR-M01-02, BR-M01-03 | Customer service、Partner users | 各 channel Case creation 範例已核准 | customer-facing flow 從這裡開始。 |  |
| 8 | Phase 2 - Intake and triage（進線與分診） | M03 | AI Service Triage & ProblemCard（AI 分診與 ProblemCard） | 建立 ProblemCard completeness、AI transfer 與 human review flow | BR-M03-01, BR-M03-02, BR-M03-03 | Customer service、AI ops | install/repair/warranty/complaint 的 ProblemCard 範例已核准 | AI 可以 draft，不可 decide。 |  |
| 9 | Phase 2 - Commercial gate（商務關卡） | M04 | Pricing, Quote & Commercial Approval（價格、報價與商務核准） | 建立 quote draft、internal/customer quote split 與 approval gates | BR-M04-01, BR-M04-02, BR-M04-03 | Customer service、Accounting、Supervisor | fixed / interval / special quote 範例已核准 | Money rules 不可猜測。 |  |
| 10 | Phase 2 - Commercial gate（商務關卡） | M11 | Customer AR, Payment & Refund（客戶 AR、付款與退款） | 建立 payment proof、AR status、refund request 與 invoice decision flow | BR-M11-01, BR-M11-02, BR-M11-03 | Accounting, Customer service | deposit、transfer、cash、card、refund 範例已核准 | Payment gate 控制 dispatch。 |  |
| 11 | Phase 3 - WorkOrder core | M05 | WorkOrder Lifecycle & Status Control（WorkOrder 生命週期與狀態控制） | 建立 state machine 與 allowed actions | BR-M05-01, BR-M05-02, BR-M05-03 | Dispatcher、System process owner | Status transition matrix 已核准 | 這會成為核心 WorkOrder contract。 |  |
| 12 | Phase 3 - WorkOrder core | M06 | Dispatch, Matching, Scheduling & Capacity（派工、媒合、排程與產能） | 建立 assignment、schedule、grab-order、acceptance SLA | BR-M06-01, BR-M06-02, BR-M06-03 | Dispatcher, Technician manager | normal、urgent、reject、timeout scenarios 已核准 | Requires M07/M10 readiness. |  |
| 13 | Phase 3 - WorkOrder core | M08 | Mobile Field Execution（現場施工行動流程） | 建立 onsite check-in、scope change、completion package | BR-M08-01, BR-M08-02, BR-M08-03 | Locksmith、Dispatcher、Customer service | Onsite happy path 與 exception examples 已核准 | 使用簡單 technician workflow。 |  |
| 14 | Phase 3 - Shared controls（共用控制） | M09 | Evidence & Document Control（證據與文件控管） | 建立 evidence checklist、visibility 與 retention review | BR-M09-01, BR-M09-02, BR-M09-03 | Compliance、Brand、Customer service | Evidence package sample 已核准 | 供 RMA、finance 與 audit 使用。 |  |
| 15 | Phase 3 - Shared controls（共用控制） | M15 | Exception, Approval & Risk Control（異常、核准與風險控制） | 建立 abnormal flow return path 與 approval inbox | BR-M15-01, BR-M15-02, BR-M15-03 | Supervisor, Accounting, Dispatcher | Exception matrix examples 已核准 | 避免隱藏的一次性決策。 |  |
| 16 | Phase 3 - Shared controls（共用控制） | M16 | Communication, Notification & Conversation（溝通、通知與對話） | 建立 message visibility、phone record 與 templates | BR-M16-01, BR-M16-02, BR-M16-03 | Customer service、System admin | Notification templates approved | Communication 是 evidence，不只是 chat。 |  |
| 17 | Phase 4 - Settlement and after-sales（月結與售後） | M12 | Technician / Partner AP & Monthly Settlement（師傅/Partner AP 與月結） | 建立 technician/dispatcher/brand monthly statements 與 offsets | BR-M12-01, BR-M12-02, BR-M12-03 | Accounting, Dispatcher, Brand | Monthly statement examples 已核准 | AP 與 customer AR 必須分開。 |  |
| 18 | Phase 4 - Settlement and after-sales（月結與售後） | M13 | Complaint, Warranty, RMA & Quality（客訴、保固、RMA 與品質） | 建立 RMA lifecycle、responsibility matrix 與 quality feedback | BR-M13-01, BR-M13-02, BR-M13-03 | Customer service、Brand、Supervisor | RMA product / install / use cases 已核准 | After-sales 必須連回原 WorkOrder。 |  |
| 19 | Phase 5 - Reporting and AI ops | M19 | Reporting, BI & KPI（報表、BI 與 KPI） | 建立 management、operations、accounting、partner report definitions | BR-M19-01, BR-M19-02, BR-M19-03 | Supervisor、BI owner、Accounting | KPI formulas 與 download permissions 已核准 | Reports 只能反映已確認規則。 |  |
| 20 | Phase 5 - Reporting and AI ops | M20 | AI Operations & Knowledge Governance（AI Ops 與知識治理） | 建立 AI SOP governance、forbidden decisions 與 quality feedback | BR-M20-01, BR-M20-02, BR-M20-03 | AI ops、Customer service、Supervisor | AI escalation 與 forbidden-action tests 已核准 | AI module 應在人工作業規則穩定後再做。 |  |

## 17 AI工程交接

> AI Engineering Handoff

> AI Specialist 需要產出的 module contract、UAT、acceptance criteria。

| 模組 ID | 模組 | 中文 | Domain | 業務目的 | 主要輸出 | Engineering 指示 | Coding 準備度備註 |
|---|---|---|---|---|---|---|---|
| M01 | Customer & Omnichannel Intake（客戶與全渠道入口） | 客戶入口與案件建立 | D1 Market / Customer（市場 / 客戶） | 把 LINE、電話、Web、品牌商、門市、經銷商、建商等入口統一變成可追蹤 Case。 | Case / Inquiry、customer contact、source channel、first SLA clock | Build UI/workflow around gates, owners, status, evidence, approval and review columns. Do not assume final business rules where Status = 主管決策. | Operational module：module sheet review 與 cross-module gates 確認後再 code。 |
| M02 | Customer / Site / Device Master（客戶/地址/設備主檔） | 客戶、地址、設備主檔 | D1 Market / Customer（市場 / 客戶） | 管理客戶、地址、原住址、設備、品牌型號、購買來源與歷史案件。 | Customer profile、Site profile、Device registry、service history | Build UI/workflow around gates, owners, status, evidence, approval and review columns. Do not assume final business rules where Status = 主管決策. | Operational module：module sheet review 與 cross-module gates 確認後再 code。 |
| M03 | AI Service Triage & ProblemCard（AI 分診與 ProblemCard） | AI 分診與 ProblemCard | D2 Service-to-Cash Core | 把需求轉成可報價、可派工、可追責的服務卡。 | ProblemCard、triage result、missing-info checklist、escalation flag | Build UI/workflow around gates, owners, status, evidence, approval and review columns. Do not assume final business rules where Status = 主管決策. | Operational module：module sheet review 與 cross-module gates 確認後再 code。 |
| M04 | Pricing, Quote & Commercial Approval（價格、報價與商務核准） | 報價、價格、核准 | D2 Service-to-Cash Core | 建立內外部價格、訂金、付款條件、加價與折讓規則。 | Internal quote、customer quote、approval requirement、payment gate | Build UI/workflow around gates, owners, status, evidence, approval and review columns. Do not assume final business rules where Status = 主管決策. | Operational module：module sheet review 與 cross-module gates 確認後再 code。 |
| M05 | WorkOrder Lifecycle & Status Control（WorkOrder 生命週期與狀態控制） | 工單生命週期與狀態 | D2 Service-to-Cash Core | 定義從報價成立到派工、施工、完工、結案的狀態機。 | WorkOrder、status history、state transition audit | Build UI/workflow around gates, owners, status, evidence, approval and review columns. Do not assume final business rules where Status = 主管決策. | Operational module：module sheet review 與 cross-module gates 確認後再 code。 |
| M06 | Dispatch, Matching, Scheduling & Capacity（派工、媒合、排程與產能） | 派工、媒合、排程 | D2 Service-to-Cash Core | 用距離、技能、空檔、品牌經驗、庫存、SLA 等規則媒合師傅。 | Dispatch assignment、schedule slot、acceptance SLA、reassignment reason | Build UI/workflow around gates, owners, status, evidence, approval and review columns. Do not assume final business rules where Status = 主管決策. | Operational module：module sheet review 與 cross-module gates 確認後再 code。 |
| M07 | Workforce & Technician Qualification（師傅資格與人力管理） | 師傅與技術人力管理 | D3 Workforce / Supply（師傅人力 / 供應） | 管理師傅、派工者、外包商的資格、服務區、技能、排班、評分與停權。 | Technician profile、skill matrix、availability、eligibility、performance score | Build UI/workflow around gates, owners, status, evidence, approval and review columns. Do not assume final business rules where Status = 主管決策. | Operational module：module sheet review 與 cross-module gates 確認後再 code。 |
| M08 | Mobile Field Execution（現場施工行動流程） | 現場施工與行動流程 | D2 Service-to-Cash Core | 讓師傅在現場完成到場、施工、異常、用料、收款、簽名與完工回報。 | Arrival proof、completion report、material usage、customer sign-off | Build UI/workflow around gates, owners, status, evidence, approval and review columns. Do not assume final business rules where Status = 主管決策. | Operational module：module sheet review 與 cross-module gates 確認後再 code。 |
| M09 | Evidence & Document Control（證據與文件控管） | 照片、影片、文件與證據 | D6 Governance / Platform Ops（治理 / 平台營運） | 把施工前後照片、影片、聊天、簽名、發票與保固文件變成可稽核證據。 | Evidence package、media permissions、retention rule、audit proof | Build UI/workflow around gates, owners, status, evidence, approval and review columns. Do not assume final business rules where Status = 主管決策. | Operational module：module sheet review 與 cross-module gates 確認後再 code。 |
| M10 | Product, BOM, Inventory & Serial Control（商品、BOM、庫存與序號） | 品牌、商品、BOM、庫存 | D3 Workforce / Supply（師傅人力 / 供應） | 管理品牌型號、兩層 BOM、料件歸屬、庫存、序號、退換料。 | Product master、BOM、material reservation、usage record、inventory exception | Build UI/workflow around gates, owners, status, evidence, approval and review columns. Do not assume final business rules where Status = 主管決策. | Operational module：module sheet review 與 cross-module gates 確認後再 code。 |
| M11 | Customer AR, Payment & Refund（客戶 AR、付款與退款） | 客戶付款、應收、退款 | D4 Finance / Settlement（財務 / 結算） | 管理客戶付款、訂金、收款、未收款、退款、發票與支付證明。 | Customer ledger、payment proof、AR status、refund request、invoice requirement | Build UI/workflow around gates, owners, status, evidence, approval and review columns. Do not assume final business rules where Status = 主管決策. | Operational module：module sheet review 與 cross-module gates 確認後再 code。 |
| M12 | Technician / Partner AP & Monthly Settlement（師傅/Partner AP 與月結） | 師傅、派工者、品牌月結 | D4 Finance / Settlement（財務 / 結算） | 管理師傅工資、派工人抽成、品牌月結、代收抵扣、暫扣與扣款。 | Technician statement、partner statement、brand settlement、payable amount | Build UI/workflow around gates, owners, status, evidence, approval and review columns. Do not assume final business rules where Status = 主管決策. | Operational module：module sheet review 與 cross-module gates 確認後再 code。 |
| M13 | Complaint, Warranty, RMA & Quality（客訴、保固、RMA 與品質） | 客訴、保固、RMA、品質 | D5 Quality / After-sales（品質 / 售後） | 管理售後、保固、返修、品質責任、折讓、換貨、退款與升級主管。 | RMA case、warranty decision、liability split、corrective action、quality record | Build UI/workflow around gates, owners, status, evidence, approval and review columns. Do not assume final business rules where Status = 主管決策. | Operational module：module sheet review 與 cross-module gates 確認後再 code。 |
| M14 | Brand / Dealer / Builder Partner Portal（品牌/經銷/建商 Partner Portal） | 品牌商、經銷商、建商與合作夥伴 | D1 Market / Customer（市場 / 客戶） | 支援品牌商、派工者、經銷商、門市、建商專案與 B2B 合約規則。 | Partner account、brand case、project contract、B2B settlement rule | Build UI/workflow around gates, owners, status, evidence, approval and review columns. Do not assume final business rules where Status = 主管決策. | Operational module：module sheet review 與 cross-module gates 確認後再 code。 |
| M15 | Exception, Approval & Risk Control（異常、核准與風險控制） | 異常、核准、風險控制 | D2 Service-to-Cash Core | 把缺料、改期、加價、取消、退款、爭議、安全風險轉成可控分流。 | Exception case、approval task、return path、risk flag、liability reason | Build UI/workflow around gates, owners, status, evidence, approval and review columns. Do not assume final business rules where Status = 主管決策. | Operational module：module sheet review 與 cross-module gates 確認後再 code。 |
| M16 | Communication, Notification & Conversation（溝通、通知與對話） | 聊天、通知、溝通紀錄 | D6 Governance / Platform Ops（治理 / 平台營運） | 管理客戶、師傅、品牌、內部、會計之間的溝通頻道與通知節點。 | Conversation record、notification task、message visibility rule | Build UI/workflow around gates, owners, status, evidence, approval and review columns. Do not assume final business rules where Status = 主管決策. | Operational module：module sheet review 與 cross-module gates 確認後再 code。 |
| M17 | Authorization, Security & Audit（權限、安全與 Audit） | 權限、安全、稽核 | D6 Governance / Platform Ops（治理 / 平台營運） | 定義誰可看、誰可改、誰可核准，以及所有敏感操作的稽核。 | Permission matrix、approval limit、audit event、data access boundary | Build UI/workflow around gates, owners, status, evidence, approval and review columns. Do not assume final business rules where Status = 主管決策. | Platform / governance module：business owners 確認 roles、change control 與 audit requirements 後再 code。 |
| M18 | System Setup, Master Configuration & IT Ops（系統設定、主檔配置與 IT Ops） | 系統設定、主檔配置、IT 維運 | D6 Governance / Platform Ops（治理 / 平台營運） | 讓使用者端系統管理員可設定組織、角色、服務區、價格表、狀態、SLA、模板與主檔。 | System configuration、master setup、change request、support ticket | Build UI/workflow around gates, owners, status, evidence, approval and review columns. Do not assume final business rules where Status = 主管決策. | Platform / governance module：business owners 確認 roles、change control 與 audit requirements 後再 code。 |
| M19 | Reporting, BI & KPI（報表、BI 與 KPI） | 報表、BI、KPI | D6 Governance / Platform Ops（治理 / 平台營運） | 產出工單、派工、財務、庫存、客訴、品質、師傅績效與品牌報表。 | Dashboard、export、KPI definition、operational report | Build UI/workflow around gates, owners, status, evidence, approval and review columns. Do not assume final business rules where Status = 主管決策. | Operational module：module sheet review 與 cross-module gates 確認後再 code。 |
| M20 | AI Operations & Knowledge Governance（AI Ops 與知識治理） | AI 營運、知識庫、品質治理 | D6 Governance / Platform Ops（治理 / 平台營運） | 管理 AI 回答、分診、報價草稿、轉真人、知識庫、測試案例與版本核准。 | AI policy、knowledge article、escalation rule、AI quality review | Build UI/workflow around gates, owners, status, evidence, approval and review columns. Do not assume final business rules where Status = 主管決策. | Platform / governance module：business owners 確認 roles、change control 與 audit requirements 後再 code。 |

## 18 AI跟進清單

> AI Specialist 跟進清單

> 不是要營運重新回答，而是 AI Specialist 要把答案轉成工程規格。

| Follow-up ID | Phase | Blue Owner Area | 營運主管 Answer Already Provided | AI Specialist Must Produce | Scope 決策 | AI Specialist Answer / Notes |
|---|---|---|---|---|---|---|
| AI-001 | Phase 0 - Blueprint Freeze | Cross | 報價顯示規則: 客戶只看實收總額；內部看成本拆分 | 產出 quote contract：customer-visible total、internal cost split、approval gate、price validity。 | Build Now - Dependency |  |
| AI-002 | Phase 0 - Blueprint Freeze | Cross | 訂金 / 預付款: 高金額、急件、新客戶需在報價定義 | 產出 finance gate：payment proof、deposit, refund approval, cancellation/travel fee, AR status。 | Build Now - Dependency |  |
| AI-003 | Phase 0 - Blueprint Freeze | Cross | 報價有效期: 依案件：3、7、15、30 天、品牌規則 | 產出 quote contract：customer-visible total、internal cost split、approval gate、price validity。 | Build Now - Dependency |  |
| AI-004 | Phase 0 - Blueprint Freeze | Cross | 工單成立點: 客戶確認最終價格與時間後成立；需付款案件需付款 gate, 但是可以跳過 | 產出 WorkOrder state machine：status、allowed next action、reason code、reopen/cancel rules。 | Build Now - Dependency |  |
| AI-005 | Phase 0 - Blueprint Freeze | Cross | 接單 SLA: 一般 10 分鐘，急件 5 分鐘 | 產出 dispatch contract：matching criteria、accept/reject/timeout、reassign、urgent path。 | Build Now - Dependency |  |
| AI-006 | Phase 0 - Blueprint Freeze | Cross | 搶單限制: 標準、低風險、一般地區、1 小時車程內 | 產出 dispatch contract：matching criteria、accept/reject/timeout、reassign、urgent path。 | Build Now - Dependency |  |
| AI-007 | Phase 0 - Blueprint Freeze | Cross | 加價確認: 師傅提出，客戶簽名，客服留紀錄 | 產出 quote contract：customer-visible total、internal cost split、approval gate、price validity。 | Build Now - Dependency |  |
| AI-008 | Phase 0 - Blueprint Freeze | Cross | 客戶不同意加價: 收檢測費 / 車馬費 / 改期 / 客服協調 | 產出 quote contract：customer-visible total、internal cost split、approval gate、price validity。 | Build Now - Dependency |  |
| AI-009 | Phase 0 - Blueprint Freeze | Cross | 取消費: 前期 未決，需定義付款後、當日、出發後、到場後 | 產出 finance gate：payment proof、deposit, refund approval, cancellation/travel fee, AR status。 | Build Now - Dependency |  |
| AI-010 | Phase 0 - Blueprint Freeze | Cross | 車馬費: 到場才收，需定金額與歸屬 | 產出 finance gate：payment proof、deposit, refund approval, cancellation/travel fee, AR status。 | Build Now - Dependency |  |
| AI-011 | Phase 0 - Blueprint Freeze | Cross | 退款核准: 前期 未決，需依金額分層 | 產出 finance gate：payment proof、deposit, refund approval, cancellation/travel fee, AR status。 | Build Now - Dependency |  |
| AI-012 | Phase 0 - Blueprint Freeze | Cross | 權限: 品牌商 / 師傅不建議 all access | 產出 RBAC matrix：can-view / can-edit / can-approve、approval limit、audit events。 | Build Now - Dependency |  |
| AI-013 | Phase 0 - Blueprint Freeze | Cross | 月結: 師傅月結、派工人月結、品牌月結分表 | 產出 settlement rule：technician AP、dispatcher commission、brand settlement、dispute withholding。 | Build Now - Dependency |  |
| AI-014 | Phase I - Market Launch Core | Cross | RMA 編號: RMA + 年月 + 流水號 | 產出 RMA business contract：RMA ID、warranty start, responsibility matrix, link to original WorkOrder。 | Build Now - Dependency |  |
| AI-015 | Phase 0 - Blueprint Freeze | Cross | 保固: 購買日 + 序號；建商案是否點交日需補 | 產出 RMA business contract：RMA ID、warranty start, responsibility matrix, link to original WorkOrder。 | Build Now - Dependency |  |
| AI-016 | Phase 0 - Blueprint Freeze | Cross | 角色權限矩陣: 品牌、師傅、會計、IT、AI ops 需分可看/可改/可核准 | 產出 RBAC matrix：can-view / can-edit / can-approve、approval limit、audit events。 | Build Now - Dependency |  |
| AI-017 | Phase 0 - Blueprint Freeze | Cross | 系統設定變更流程: 價格、權限、SLA、模板、AI SOP 需申請/核准/生效日 | 產出 system setup checklist：service items、price table、SLA、status、templates、roles、regions、change approval。 | Build Now - Dependency |  |
| AI-018 | Phase 0 - Blueprint Freeze | Cross | 師傅 onboarding 與停權: 上線資格、品牌授權、停權/恢復門檻 | 產出 technician setup：profile、skill matrix、brand authorization、suspension/recovery rules。 | Build Now - Dependency |  |
| AI-019 | Phase 0 - Blueprint Freeze | Cross | 品牌/建商專案邊界: B2B 權限、點交日、月結、責任與 SLA | 產出 partner boundary：brand/dealer/builder visibility, project setup, B2B settlement rule。 | Build Now - Dependency |  |
| AI-020 | Phase 0 - Blueprint Freeze | Cross | AI 不可決策清單: 不可 final price、退款、保固責任、法律安全承諾 | 產出 AI guardrails：allowed actions、forbidden decisions、handoff to human、quality review queue。 | Build Now - Dependency |  |
| AI-021 | Phase 0 - Blueprint Freeze | Cross | 報價顯示規則: 客戶只看實收總額；內部看成本拆分 | 產出 quote contract：customer-visible total、internal cost split、approval gate、price validity。 | Build Now - Dependency |  |
| AI-022 | Phase 0 - Blueprint Freeze | Cross | 訂金 / 預付款: 高金額、急件、新客戶需在報價定義 | 產出 finance gate：payment proof、deposit, refund approval, cancellation/travel fee, AR status。 | Build Now - Dependency |  |
| AI-023 | Phase 0 - Blueprint Freeze | Cross | 報價有效期: 依案件：3、7、15、30 天、品牌規則 | 產出 quote contract：customer-visible total、internal cost split、approval gate、price validity。 | Build Now - Dependency |  |
| AI-024 | Phase 0 - Blueprint Freeze | Cross | 工單成立點: 客戶確認最終價格與時間後成立；需付款案件需付款 gate | 產出 WorkOrder state machine：status、allowed next action、reason code、reopen/cancel rules。 | Build Now - Dependency |  |
| AI-025 | Phase 0 - Blueprint Freeze | Cross | 接單 SLA: 一般 10 分鐘，急件 5 分鐘 | 產出 dispatch contract：matching criteria、accept/reject/timeout、reassign、urgent path。 | Build Now - Dependency |  |
| AI-026 | Phase 0 - Blueprint Freeze | Cross | 搶單限制: 標準、低風險、一般地區、1 小時車程內 | 產出 dispatch contract：matching criteria、accept/reject/timeout、reassign、urgent path。 | Build Now - Dependency |  |
| AI-027 | Phase 0 - Blueprint Freeze | Cross | 加價確認: 師傅提出，客戶簽名，客服留紀錄 | 產出 quote contract：customer-visible total、internal cost split、approval gate、price validity。 | Build Now - Dependency |  |
| AI-028 | Phase 0 - Blueprint Freeze | Cross | 客戶不同意加價: 收檢測費 / 車馬費 / 改期 / 客服協調 | 產出 quote contract：customer-visible total、internal cost split、approval gate、price validity。 | Build Now - Dependency |  |
| AI-029 | Phase 0 - Blueprint Freeze | Cross | 取消費: 前期 未決，需定義付款後、當日、出發後、到場後 | 產出 finance gate：payment proof、deposit, refund approval, cancellation/travel fee, AR status。 | Build Now - Dependency |  |
| AI-030 | Phase 0 - Blueprint Freeze | Cross | 車馬費: 到場才收，需定金額與歸屬 | 產出 finance gate：payment proof、deposit, refund approval, cancellation/travel fee, AR status。 | Build Now - Dependency |  |
| AI-031 | Phase 0 - Blueprint Freeze | Cross | 退款核准: 前期 未決，需依金額分層 | 產出 finance gate：payment proof、deposit, refund approval, cancellation/travel fee, AR status。 | Build Now - Dependency |  |
| AI-032 | Phase 0 - Blueprint Freeze | Cross | 權限: 品牌商 / 師傅不建議 all access | 產出 RBAC matrix：can-view / can-edit / can-approve、approval limit、audit events。 | Build Now - Dependency |  |
| AI-033 | Phase 0 - Blueprint Freeze | Cross | 月結: 師傅月結、派工人月結、品牌月結分表 | 產出 settlement rule：technician AP、dispatcher commission、brand settlement、dispute withholding。 | Build Now - Dependency |  |
| AI-034 | Phase I - Market Launch Core | Cross | RMA 編號: RMA + 年月 + 流水號 | 產出 RMA business contract：RMA ID、warranty start, responsibility matrix, link to original WorkOrder。 | Build Now - Dependency |  |
| AI-035 | Phase 0 - Blueprint Freeze | Cross | 保固: 購買日 + 序號；建商案是否點交日需補 | 產出 RMA business contract：RMA ID、warranty start, responsibility matrix, link to original WorkOrder。 | Build Now - Dependency |  |
| AI-036 | Phase I - Market Launch Core | M01 | 客戶入口與案件建立 - Channel source is mandatory: 每個 Case 必須保留 source channel：LINE、電話、web、brand、store、dealer、builder、referral。 | 把 營運 final rule 轉成 module acceptance criteria 與 Codex / Claude coding task。 | Build Now - Dependency |  |
| AI-037 | Phase I - Market Launch Core | M01 | 客戶入口與案件建立 - External portal limit: External partners 只能建立或查看自己被允許的 cases；internal staff 可代為建立。 | 把 營運 final rule 轉成 module acceptance criteria 與 Codex / Claude coding task。 | Build Now - Dependency |  |
| AI-038 | Phase I - Market Launch Core | M02 | 客戶、地址、設備主檔 - Customer duplicate rule: 預設 duplicate key 為 phone + LINE ID；address 可輔助比對，但不能作為唯一 key。 | 把 營運 final rule 轉成 module acceptance criteria 與 Codex / Claude coding task。 | Build Now - Dependency |  |
| AI-039 | Phase I - Market Launch Core | M02 | 客戶、地址、設備主檔 - Device record for warranty: 主鎖與高價零件應建立 Device record，包含 brand、model、serial、purchase/install/warranty date。 | 把 營運 final rule 轉成 module acceptance criteria 與 Codex / Claude coding task。 | Build Now - Dependency |  |
| AI-040 | Phase 0 - Blueprint Freeze | M03 | AI 分診與 ProblemCard - AI escalation: 遇到 urgent、angry customer、高金額、保固不明、refund、safety/legal 或 3 次失敗循環，AI 必須轉真人。 | 產出 AI guardrails：allowed actions、forbidden decisions、handoff to human、quality review queue。 | Build Now - Dependency |  |
| AI-041 | Phase 0 - Blueprint Freeze | M03 | AI 分診與 ProblemCard - No final AI quote: AI 只能建議 range / draft；final customer price 需真人或已核准 fixed-price rule。 | 產出 AI guardrails：allowed actions、forbidden decisions、handoff to human、quality review queue。 | Build Now - Dependency |  |
| AI-042 | Phase 0 - Blueprint Freeze | M04 | 報價、價格、核准 - Internal and customer quote separation: Customer 只看 total receivable；internal view 保留 labor、material、travel、margin、brand cost。 | 產出 quote contract：customer-visible total、internal cost split、approval gate、price validity。 | Build Now - Dependency |  |
| AI-043 | Phase 0 - Blueprint Freeze | M04 | 報價、價格、核准 - Price table versioning: Price table 必須有 effective date 與 owner；已確認 WorkOrder 保留原核准價格。 | 產出 quote contract：customer-visible total、internal cost split、approval gate、price validity。 | Build Now - Dependency |  |
| AI-044 | Phase 0 - Blueprint Freeze | M04 | 報價、價格、核准 - Approval by amount/risk: 高金額、特殊門、保固不明、discount、類 refund adjustment，在 customer confirmation 前需 approval。 | 產出 quote contract：customer-visible total、internal cost split、approval gate、price validity。 | Build Now - Dependency |  |
| AI-045 | Phase I - Market Launch Core | M05 | 工單生命週期與狀態 - Official state machine: 只有 approved roles 可推動 core states；cancel、reopen、reschedule、refund、dispute 必須填 status reason。 | 產出 WorkOrder state machine：status、allowed next action、reason code、reopen/cancel rules。 | Build Now - Dependency |  |
| AI-046 | Phase I - Market Launch Core | M05 | 工單生命週期與狀態 - Customer confirmation gate: 只有 customer price/time/payment gate 滿足後，WorkOrder 才可進入 dispatch。 | 產出 WorkOrder state machine：status、allowed next action、reason code、reopen/cancel rules。 | Build Now - Dependency |  |
| AI-047 | Phase I - Market Launch Core | M06 | 派工、媒合、排程 - Grab-order restriction: 只有核准 travel time 內的 low-risk standard jobs 可進入 grab-order pool。 | 產出 dispatch contract：matching criteria、accept/reject/timeout、reassign、urgent path。 | Build Now - Dependency |  |
| AI-048 | Phase 0 - Blueprint Freeze | M06 | 派工、媒合、排程 - Acceptance SLA: 建議 acceptance SLA：normal 15 分鐘、urgent 5 分鐘；前期 的 normal 10 分鐘是較嚴格選項，需 supervisor 確認。 | 產出 dispatch contract：matching criteria、accept/reject/timeout、reassign、urgent path。 | Build Now - Dependency |  |
| AI-049 | Phase 0 - Blueprint Freeze | M07 | 師傅與技術人力管理 - Technician onboarding: Technician 在 dispatch 前必須有 profile、bank/payment info、service area、skill matrix、brand authorization、contract status。 | 產出 technician setup：profile、skill matrix、brand authorization、suspension/recovery rules。 | Build Now - Dependency |  |
| AI-050 | Phase I - Market Launch Core | M07 | 師傅與技術人力管理 - Suspension criteria: 高 complaint rate、no-show、未繳回代收款、未退料、嚴重安全問題，可暫停 dispatch eligibility。 | 產出 technician setup：profile、skill matrix、brand authorization、suspension/recovery rules。 | Build Now - Dependency |  |
| AI-051 | Phase I - Market Launch Core | M08 | 現場施工與行動流程 - Scope change at site: 任何 onsite scope change 或 extra charge，繼續施工前都需要 customer confirmation 與 evidence。 | 產出 onsite workflow：arrival proof、scope change, completion package, customer confirmation。 | Build Now - Dependency |  |
| AI-052 | Phase I - Market Launch Core | M09 | 照片、影片、文件與證據 - Evidence visibility: Brand、locksmith、accounting、customer 依角色與 case ownership 看到不同 evidence sets。 | 產出 evidence checklist：photos/video/docs, visibility, retention, dispute/RMA proof。 | Build Now - Dependency |  |
| AI-053 | Phase I - Market Launch Core | M09 | 照片、影片、文件與證據 - Retention policy: 預設照片保存 1 年；warranty/RMA/dispute evidence 保存至 warranty/dispute period 加核准 buffer。 | 產出 evidence checklist：photos/video/docs, visibility, retention, dispute/RMA proof。 | Build Now - Dependency |  |
| AI-054 | Phase I - Light Master Data | M10 | 品牌、商品、BOM、庫存 - Inventory ownership: Material owner 可為 brand、company、locksmith、customer；ownership 決定 billing、return、warranty responsibility。 | 產出 light product/BOM rule：brand/model, material owner, serial control, inventory exception。 | Manual First / Light Version |  |
| AI-055 | Phase I - Light Master Data | M10 | 品牌、商品、BOM、庫存 - Serial control: 主鎖、保固件、高價電子件需 serial 綁定 WorkOrder / Device record。 | 產出 light product/BOM rule：brand/model, material owner, serial control, inventory exception。 | Manual First / Light Version |  |
| AI-056 | Phase 0 - Blueprint Freeze | M11 | 客戶付款、應收、退款 - Payment reconciliation: 每筆 payment 必須 reconcile 到 WorkOrder、deposit、balance、travel fee、refund 或 RMA adjustment。 | 產出 finance gate：payment proof、deposit, refund approval, cancellation/travel fee, AR status。 | Build Now - Dependency |  |
| AI-057 | Phase 0 - Blueprint Freeze | M11 | 客戶付款、應收、退款 - Refund approval levels: Refund 需依金額分層 approval；建議預設：refund > NTD 100,000 需 operations + finance double sign；partial refund 必須分類 product、labor、material、travel、inspection。 | 產出 finance gate：payment proof、deposit, refund approval, cancellation/travel fee, AR status。 | Build Now - Dependency |  |
| AI-058 | Phase 0 - Blueprint Freeze | M11 | 客戶付款、應收、退款 - Invoice responsibility: Invoice issuer 依 B2C、B2B brand、builder project 或 platform collection model 決定。 | 產出 finance gate：payment proof、deposit, refund approval, cancellation/travel fee, AR status。 | Build Now - Dependency |  |
| AI-059 | Phase II - Finance / Settlement | M12 | 師傅、派工者、品牌月結 - Separate AP ledgers: Technician AP、dispatcher commission、brand settlement、partner settlement 必須分開 ledger / report。 | 產出 settlement rule：technician AP、dispatcher commission、brand settlement、dispute withholding。 | Manual First / Light Version |  |
| AI-060 | Phase II - Finance / Settlement | M12 | 師傅、派工者、品牌月結 - Cash collection offset: Technician cash collection 抵扣 monthly payable；未繳回代收款可 hold payout。 | 產出 settlement rule：technician AP、dispatcher commission、brand settlement、dispute withholding。 | Manual First / Light Version |  |
| AI-061 | Phase II - Finance / Settlement | M12 | 師傅、派工者、品牌月結 - Dispute withholding: 除非疑似 fraud 或 severe misconduct，只應暫扣 disputed amount。 | 產出 settlement rule：technician AP、dispatcher commission、brand settlement、dispute withholding。 | Manual First / Light Version |  |
| AI-062 | Phase III - Warranty / RMA Deepening | M13 | 客訴、保固、RMA、品質 - Responsibility matrix: RMA 必須分類 responsibility：product/brand、installation/technician、customer use、environment、quote/customer service、dispatch、material delay。 | 產出 RMA business contract：RMA ID、warranty start, responsibility matrix, link to original WorkOrder。 | Manual First / Light Version |  |
| AI-063 | Phase III - Partner / B2B | M14 | 品牌商、經銷商、建商與合作夥伴 - Partner account scope: Brand / dealer / builder users 只能依 contract 查看自己的 cases、projects、settlement。 | 產出 partner boundary：brand/dealer/builder visibility, project setup, B2B settlement rule。 | Later |  |
| AI-064 | Phase III - Partner / B2B | M14 | 品牌商、經銷商、建商與合作夥伴 - Builder project setup: Builder projects 必須有 site group、unit list、handover/warranty date、contract price、SLA、invoice rules。 | 產出 partner boundary：brand/dealer/builder visibility, project setup, B2B settlement rule。 | Later |  |
| AI-065 | Phase I - Market Launch Core | M15 | 異常、核准、風險控制 - Exception return path: 每個 exception 必須選一個 return path：continue、requote、reschedule、reassign、new WorkOrder、cancel、refund、RMA、dispute。 | 產出 exception matrix：return path, approval inbox, stop rules, responsible owner。 | Build Now - Dependency |  |
| AI-066 | Phase I - Market Launch Core | M15 | 異常、核准、風險控制 - Approval inbox: Supervisor / accounting / brand approvals 應進 approval inbox，不應只留在 chat。 | 產出 exception matrix：return path, approval inbox, stop rules, responsible owner。 | Build Now - Dependency |  |
| AI-067 | Phase I - Market Launch Core | M15 | 異常、核准、風險控制 - High-risk stop rule: Warranty unclear、brand responsibility、safety risk、customer refuses added price、high-risk drilling/opening 必須 pause 到核准後才繼續。 | 產出 exception matrix：return path, approval inbox, stop rules, responsible owner。 | Build Now - Dependency |  |
| AI-068 | Phase I - Market Launch Core | M16 | 聊天、通知、溝通紀錄 - Conversation visibility: Customer、technician、brand、accounting、internal notes 必須依 visibility rules 分開。 | 產出 notification template list：quote, payment, dispatch, delay, completion, RMA, refund。 | Build Now - Dependency |  |
| AI-069 | Phase I - Market Launch Core | M16 | 聊天、通知、溝通紀錄 - Notification templates: Quote、photo request、payment、dispatch、delay、extra price、completion、RMA、refund 需要 approved templates。 | 產出 notification template list：quote, payment, dispatch, delay, completion, RMA, refund。 | Build Now - Dependency |  |
| AI-070 | Phase 0 - Blueprint Freeze | M17 | 權限、安全、稽核 - Can view/edit/approve matrix: 每個角色必須拆成 can-view、can-edit、can-approve；除 audited admin 外，不接受 all access。 | 產出 RBAC matrix：can-view / can-edit / can-approve、approval limit、audit events。 | Build Now - Dependency |  |
| AI-071 | Phase 0 - Blueprint Freeze | M17 | 權限、安全、稽核 - Segregation of duties: 同一 user 不應在無 second approval 下同時 create、approve、reconcile refund。 | 產出 RBAC matrix：can-view / can-edit / can-approve、approval limit、audit events。 | Build Now - Dependency |  |
| AI-072 | Phase 0 - Blueprint Freeze | M17 | 權限、安全、稽核 - Temporary IT support access: IT support sensitive access 必須 time-limited、reason-coded、audit logged。 | 產出 RBAC matrix：can-view / can-edit / can-approve、approval limit、audit events。 | Build Now - Dependency |  |
| AI-073 | Phase 0 - Blueprint Freeze | M18 | 系統設定、主檔配置、IT 維運 - Master configuration owner: Service items、price tables、status codes、SLA、templates、roles、regions 需要明確 owner 與 approval。 | 產出 system setup checklist：service items、price table、SLA、status、templates、roles、regions、change approval。 | Build Now - Dependency |  |
| AI-074 | Phase 0 - Blueprint Freeze | M18 | 系統設定、主檔配置、IT 維運 - Change request process: Configuration changes 需要 request、owner approval、effective date、rollback note。 | 產出 system setup checklist：service items、price table、SLA、status、templates、roles、regions、change approval。 | Build Now - Dependency |  |
| AI-075 | Phase 0 - Blueprint Freeze | M18 | 系統設定、主檔配置、IT 維運 - Initial setup import: Coding / UAT 前，先確認 first import list：brands、models、BOM、technicians、price、regions、roles、customers、open WorkOrders。 | 產出 system setup checklist：service items、price table、SLA、status、templates、roles、regions、change approval。 | Build Now - Dependency |  |
| AI-076 | Phase V - BI / KPI Scale | M19 | 報表、BI、KPI - KPI formula ownership: 每個 KPI 在 dashboard 成為 official 前，都必須有 formula owner 與穩定定義。 | 產出 KPI/report definition：formula owner, download permission, Phase I dashboard minimum。 | Manual First / Light Version |  |
| AI-077 | Phase V - BI / KPI Scale | M19 | 報表、BI、KPI - Report download audit: Financial、brand、technician、customer report downloads 應依 role access 控管並 audit logged。 | 產出 KPI/report definition：formula owner, download permission, Phase I dashboard minimum。 | Manual First / Light Version |  |
| AI-078 | Phase IV - AI Ops | M20 | AI 營運、知識庫、品質治理 - AI knowledge owner: AI SOP、brand FAQ、price range、escalation rules、forbidden actions 需要 owner 與 version approval。 | 產出 AI guardrails：allowed actions、forbidden decisions、handoff to human、quality review queue。 | Manual First / Light Version |  |
| AI-079 | Phase IV - AI Ops | M20 | AI 營運、知識庫、品質治理 - AI forbidden decisions: AI 不可 final quote、approve refund、decide warranty liability、promise legal/safety outcome 或 modify settlement。 | 產出 AI guardrails：allowed actions、forbidden decisions、handoff to human、quality review queue。 | Manual First / Light Version |  |

## 19 Answer Register

> Final Answer Register

> 營運答案與 AI Specialist follow-up action 的完整 register。

| ID | Module | Phase | Scope 決策 | 決策 / 規則範圍 | 營運主管 Final Answer | Owner | AI Specialist 要產出 |
|---|---|---|---|---|---|---|---|
| P0-01 | Cross | Phase 0 - Blueprint Freeze | Build Now - Dependency | 報價顯示規則 | 客戶只看實收總額；內部看成本拆分 | 主管 / 客服主管 | 產出 quote contract：customer-visible total、internal cost split、approval gate、price validity。 |
| P0-02 | Cross | Phase 0 - Blueprint Freeze | Build Now - Dependency | 訂金 / 預付款 | 高金額、急件、新客戶需在報價定義 | 主管 / 會計 | 產出 finance gate：payment proof、deposit, refund approval, cancellation/travel fee, AR status。 |
| P0-03 | Cross | Phase 0 - Blueprint Freeze | Build Now - Dependency | 報價有效期 | 依案件：3、7、15、30 天、品牌規則 | 主管 | 產出 quote contract：customer-visible total、internal cost split、approval gate、price validity。 |
| P0-04 | Cross | Phase 0 - Blueprint Freeze | Build Now - Dependency | 工單成立點 | 客戶確認最終價格與時間後成立；需付款案件需付款 gate | 主管 / 派工 | 產出 WorkOrder state machine：status、allowed next action、reason code、reopen/cancel rules。 |
| P0-05 | Cross | Phase 0 - Blueprint Freeze | Build Now - Dependency | 接單 SLA | 一般 10 分鐘，急件 5 分鐘 | 派工主管 | 產出 dispatch contract：matching criteria、accept/reject/timeout、reassign、urgent path。 |
| P0-06 | Cross | Phase 0 - Blueprint Freeze | Build Now - Dependency | 搶單限制 | 標準、低風險、一般地區、1 小時車程內 | 派工主管 | 產出 dispatch contract：matching criteria、accept/reject/timeout、reassign、urgent path。 |
| P0-07 | Cross | Phase 0 - Blueprint Freeze | Build Now - Dependency | 加價確認 | 師傅提出，客戶簽名，客服留紀錄 | 主管 | 產出 quote contract：customer-visible total、internal cost split、approval gate、price validity。 |
| P0-08 | Cross | Phase 0 - Blueprint Freeze | Build Now - Dependency | 客戶不同意加價 | 收檢測費 / 車馬費 / 改期 / 客服協調 | 主管 | 產出 quote contract：customer-visible total、internal cost split、approval gate、price validity。 |
| P0-09 | Cross | Phase 0 - Blueprint Freeze | Build Now - Dependency | 取消費 | 前期 未決，需定義付款後、當日、出發後、到場後 | 主管 / 會計 | 產出 finance gate：payment proof、deposit, refund approval, cancellation/travel fee, AR status。 |
| P0-10 | Cross | Phase 0 - Blueprint Freeze | Build Now - Dependency | 車馬費 | 到場才收，需定金額與歸屬 | 主管 / 派工 | 產出 finance gate：payment proof、deposit, refund approval, cancellation/travel fee, AR status。 |
| P0-11 | Cross | Phase 0 - Blueprint Freeze | Build Now - Dependency | 退款核准 | 前期 未決，需依金額分層 | 主管 / 會計 | 產出 finance gate：payment proof、deposit, refund approval, cancellation/travel fee, AR status。 |
| P0-12 | Cross | Phase 0 - Blueprint Freeze | Build Now - Dependency | 權限 | 品牌商 / 師傅不建議 all access | 主管 | 產出 RBAC matrix：can-view / can-edit / can-approve、approval limit、audit events。 |
| P0-13 | Cross | Phase 0 - Blueprint Freeze | Build Now - Dependency | 月結 | 師傅月結、派工人月結、品牌月結分表 | 會計 | 產出 settlement rule：technician AP、dispatcher commission、brand settlement、dispute withholding。 |
| P0-14 | Cross | Phase I - Market Launch Core | Build Now - Dependency | RMA 編號 | RMA + 年月 + 流水號 | 客服主管 | 產出 RMA business contract：RMA ID、warranty start, responsibility matrix, link to original WorkOrder。 |
| P0-15 | Cross | Phase 0 - Blueprint Freeze | Build Now - Dependency | 保固 | 購買日 + 序號；建商案是否點交日需補 | 主管 / 品牌商 | 產出 RMA business contract：RMA ID、warranty start, responsibility matrix, link to original WorkOrder。 |
| P0-16 | Cross | Phase 0 - Blueprint Freeze | Build Now - Dependency | 角色權限矩陣 | 品牌、師傅、會計、IT、AI ops 需分可看/可改/可核准 | 主管 / IT / 管理員 | 產出 RBAC matrix：can-view / can-edit / can-approve、approval limit、audit events。 |
| P0-17 | Cross | Phase 0 - Blueprint Freeze | Build Now - Dependency | 系統設定變更流程 | 價格、權限、SLA、模板、AI SOP 需申請/核准/生效日 | 主管 / System admin | 產出 system setup checklist：service items、price table、SLA、status、templates、roles、regions、change approval。 |
| P0-18 | Cross | Phase 0 - Blueprint Freeze | Build Now - Dependency | 師傅 onboarding 與停權 | 上線資格、品牌授權、停權/恢復門檻 | 派工主管 | 產出 technician setup：profile、skill matrix、brand authorization、suspension/recovery rules。 |
| P0-19 | Cross | Phase 0 - Blueprint Freeze | Build Now - Dependency | 品牌/建商專案邊界 | B2B 權限、點交日、月結、責任與 SLA | 主管 / 品牌商 | 產出 partner boundary：brand/dealer/builder visibility, project setup, B2B settlement rule。 |
| P0-20 | Cross | Phase 0 - Blueprint Freeze | Build Now - Dependency | AI 不可決策清單 | 不可 final price、退款、保固責任、法律安全承諾 | 客服主管 / AI owner | 產出 AI guardrails：allowed actions、forbidden decisions、handoff to human、quality review queue。 |
| 前期-P0-01 | Cross | Phase 0 - Blueprint Freeze | Build Now - Dependency | 報價顯示規則 | 客戶只看實收總額；內部看成本拆分 | 主管 / 客服主管 | 產出 quote contract：customer-visible total、internal cost split、approval gate、price validity。 |
| 前期-P0-02 | Cross | Phase 0 - Blueprint Freeze | Build Now - Dependency | 訂金 / 預付款 | 高金額、急件、新客戶需在報價定義 | 主管 / 會計 | 產出 finance gate：payment proof、deposit, refund approval, cancellation/travel fee, AR status。 |
| 前期-P0-03 | Cross | Phase 0 - Blueprint Freeze | Build Now - Dependency | 報價有效期 | 依案件：3、7、15、30 天、品牌規則 | 主管 | 產出 quote contract：customer-visible total、internal cost split、approval gate、price validity。 |
| 前期-P0-04 | Cross | Phase 0 - Blueprint Freeze | Build Now - Dependency | 工單成立點 | 客戶確認最終價格與時間後成立；需付款案件需付款 gate | 主管 / 派工 | 產出 WorkOrder state machine：status、allowed next action、reason code、reopen/cancel rules。 |
| 前期-P0-05 | Cross | Phase 0 - Blueprint Freeze | Build Now - Dependency | 接單 SLA | 一般 10 分鐘，急件 5 分鐘 | 派工主管 | 產出 dispatch contract：matching criteria、accept/reject/timeout、reassign、urgent path。 |
| 前期-P0-06 | Cross | Phase 0 - Blueprint Freeze | Build Now - Dependency | 搶單限制 | 標準、低風險、一般地區、1 小時車程內 | 派工主管 | 產出 dispatch contract：matching criteria、accept/reject/timeout、reassign、urgent path。 |
| 前期-P0-07 | Cross | Phase 0 - Blueprint Freeze | Build Now - Dependency | 加價確認 | 師傅提出，客戶簽名，客服留紀錄 | 主管 | 產出 quote contract：customer-visible total、internal cost split、approval gate、price validity。 |
| 前期-P0-08 | Cross | Phase 0 - Blueprint Freeze | Build Now - Dependency | 客戶不同意加價 | 收檢測費 / 車馬費 / 改期 / 客服協調 | 主管 | 產出 quote contract：customer-visible total、internal cost split、approval gate、price validity。 |
| 前期-P0-09 | Cross | Phase 0 - Blueprint Freeze | Build Now - Dependency | 取消費 | 前期 未決，需定義付款後、當日、出發後、到場後 | 主管 / 會計 | 產出 finance gate：payment proof、deposit, refund approval, cancellation/travel fee, AR status。 |
| 前期-P0-10 | Cross | Phase 0 - Blueprint Freeze | Build Now - Dependency | 車馬費 | 到場才收，需定金額與歸屬 | 主管 / 派工 | 產出 finance gate：payment proof、deposit, refund approval, cancellation/travel fee, AR status。 |
| 前期-P0-11 | Cross | Phase 0 - Blueprint Freeze | Build Now - Dependency | 退款核准 | 前期 未決，需依金額分層 | 主管 / 會計 | 產出 finance gate：payment proof、deposit, refund approval, cancellation/travel fee, AR status。 |
| 前期-P0-12 | Cross | Phase 0 - Blueprint Freeze | Build Now - Dependency | 權限 | 品牌商 / 師傅不建議 all access | 主管 | 產出 RBAC matrix：can-view / can-edit / can-approve、approval limit、audit events。 |
| 前期-P0-13 | Cross | Phase 0 - Blueprint Freeze | Build Now - Dependency | 月結 | 師傅月結、派工人月結、品牌月結分表 | 會計 | 產出 settlement rule：technician AP、dispatcher commission、brand settlement、dispute withholding。 |
| 前期-P0-14 | Cross | Phase I - Market Launch Core | Build Now - Dependency | RMA 編號 | RMA + 年月 + 流水號 | 客服主管 | 產出 RMA business contract：RMA ID、warranty start, responsibility matrix, link to original WorkOrder。 |
| 前期-P0-15 | Cross | Phase 0 - Blueprint Freeze | Build Now - Dependency | 保固 | 購買日 + 序號；建商案是否點交日需補 | 主管 / 品牌商 | 產出 RMA business contract：RMA ID、warranty start, responsibility matrix, link to original WorkOrder。 |
| BR-M01-01 | M01 | Phase I - Market Launch Core | Build Now - Dependency | 客戶入口與案件建立 - Channel source is mandatory | 每個 Case 必須保留 source channel：LINE、電話、web、brand、store、dealer、builder、referral。 | 客服主管 | 把 營運 final rule 轉成 module acceptance criteria 與 Codex / Claude coding task。 |
| BR-M01-03 | M01 | Phase I - Market Launch Core | Build Now - Dependency | 客戶入口與案件建立 - External portal limit | External partners 只能建立或查看自己被允許的 cases；internal staff 可代為建立。 | Partner manager / 主管 | 把 營運 final rule 轉成 module acceptance criteria 與 Codex / Claude coding task。 |
| BR-M02-01 | M02 | Phase I - Market Launch Core | Build Now - Dependency | 客戶、地址、設備主檔 - Customer duplicate rule | 預設 duplicate key 為 phone + LINE ID；address 可輔助比對，但不能作為唯一 key。 | Data steward | 把 營運 final rule 轉成 module acceptance criteria 與 Codex / Claude coding task。 |
| BR-M02-02 | M02 | Phase I - Market Launch Core | Build Now - Dependency | 客戶、地址、設備主檔 - Device record for warranty | 主鎖與高價零件應建立 Device record，包含 brand、model、serial、purchase/install/warranty date。 | 客服主管 / 品牌 | 把 營運 final rule 轉成 module acceptance criteria 與 Codex / Claude coding task。 |
| BR-M03-02 | M03 | Phase 0 - Blueprint Freeze | Build Now - Dependency | AI 分診與 ProblemCard - AI escalation | 遇到 urgent、angry customer、高金額、保固不明、refund、safety/legal 或 3 次失敗循環，AI 必須轉真人。 | 客服主管 / AI owner | 產出 AI guardrails：allowed actions、forbidden decisions、handoff to human、quality review queue。 |
| BR-M03-03 | M03 | Phase 0 - Blueprint Freeze | Build Now - Dependency | AI 分診與 ProblemCard - No final AI quote | AI 只能建議 range / draft；final customer price 需真人或已核准 fixed-price rule。 | 客服主管 / 主管 | 產出 AI guardrails：allowed actions、forbidden decisions、handoff to human、quality review queue。 |
| BR-M04-01 | M04 | Phase 0 - Blueprint Freeze | Build Now - Dependency | 報價、價格、核准 - Internal and customer quote separation | Customer 只看 total receivable；internal view 保留 labor、material、travel、margin、brand cost。 | 主管 / 會計 | 產出 quote contract：customer-visible total、internal cost split、approval gate、price validity。 |
| BR-M04-02 | M04 | Phase 0 - Blueprint Freeze | Build Now - Dependency | 報價、價格、核准 - Price table versioning | Price table 必須有 effective date 與 owner；已確認 WorkOrder 保留原核准價格。 | System admin / 主管 | 產出 quote contract：customer-visible total、internal cost split、approval gate、price validity。 |
| BR-M04-03 | M04 | Phase 0 - Blueprint Freeze | Build Now - Dependency | 報價、價格、核准 - Approval by amount/risk | 高金額、特殊門、保固不明、discount、類 refund adjustment，在 customer confirmation 前需 approval。 | 主管 | 產出 quote contract：customer-visible total、internal cost split、approval gate、price validity。 |
| BR-M05-01 | M05 | Phase I - Market Launch Core | Build Now - Dependency | 工單生命週期與狀態 - Official state machine | 只有 approved roles 可推動 core states；cancel、reopen、reschedule、refund、dispute 必須填 status reason。 | System admin / 派工主管 | 產出 WorkOrder state machine：status、allowed next action、reason code、reopen/cancel rules。 |
| BR-M05-03 | M05 | Phase I - Market Launch Core | Build Now - Dependency | 工單生命週期與狀態 - Customer confirmation gate | 只有 customer price/time/payment gate 滿足後，WorkOrder 才可進入 dispatch。 | 主管 / 派工主管 | 產出 WorkOrder state machine：status、allowed next action、reason code、reopen/cancel rules。 |
| BR-M06-02 | M06 | Phase I - Market Launch Core | Build Now - Dependency | 派工、媒合、排程 - Grab-order restriction | 只有核准 travel time 內的 low-risk standard jobs 可進入 grab-order pool。 | 派工主管 | 產出 dispatch contract：matching criteria、accept/reject/timeout、reassign、urgent path。 |
| BR-M06-03 | M06 | Phase 0 - Blueprint Freeze | Build Now - Dependency | 派工、媒合、排程 - Acceptance SLA | 建議 acceptance SLA：normal 15 分鐘、urgent 5 分鐘；前期 的 normal 10 分鐘是較嚴格選項，需 supervisor 確認。 | 派工主管 | 產出 dispatch contract：matching criteria、accept/reject/timeout、reassign、urgent path。 |
| BR-M07-01 | M07 | Phase 0 - Blueprint Freeze | Build Now - Dependency | 師傅與技術人力管理 - Technician onboarding | Technician 在 dispatch 前必須有 profile、bank/payment info、service area、skill matrix、brand authorization、contract status。 | 派工主管 | 產出 technician setup：profile、skill matrix、brand authorization、suspension/recovery rules。 |
| BR-M07-02 | M07 | Phase I - Market Launch Core | Build Now - Dependency | 師傅與技術人力管理 - Suspension criteria | 高 complaint rate、no-show、未繳回代收款、未退料、嚴重安全問題，可暫停 dispatch eligibility。 | 派工主管 / 主管 | 產出 technician setup：profile、skill matrix、brand authorization、suspension/recovery rules。 |
| BR-M08-02 | M08 | Phase I - Market Launch Core | Build Now - Dependency | 現場施工與行動流程 - Scope change at site | 任何 onsite scope change 或 extra charge，繼續施工前都需要 customer confirmation 與 evidence。 | 主管 / 派工主管 | 產出 onsite workflow：arrival proof、scope change, completion package, customer confirmation。 |
| BR-M09-02 | M09 | Phase I - Market Launch Core | Build Now - Dependency | 照片、影片、文件與證據 - Evidence visibility | Brand、locksmith、accounting、customer 依角色與 case ownership 看到不同 evidence sets。 | Central admin / 主管 | 產出 evidence checklist：photos/video/docs, visibility, retention, dispute/RMA proof。 |
| BR-M09-03 | M09 | Phase I - Market Launch Core | Build Now - Dependency | 照片、影片、文件與證據 - Retention policy | 預設照片保存 1 年；warranty/RMA/dispute evidence 保存至 warranty/dispute period 加核准 buffer。 | 主管 / Compliance owner | 產出 evidence checklist：photos/video/docs, visibility, retention, dispute/RMA proof。 |
| BR-M10-02 | M10 | Phase I - Light Master Data | Manual First / Light Version | 品牌、商品、BOM、庫存 - Inventory ownership | Material owner 可為 brand、company、locksmith、customer；ownership 決定 billing、return、warranty responsibility。 | 會計 / 庫存管理 | 產出 light product/BOM rule：brand/model, material owner, serial control, inventory exception。 |
| BR-M10-03 | M10 | Phase I - Light Master Data | Manual First / Light Version | 品牌、商品、BOM、庫存 - Serial control | 主鎖、保固件、高價電子件需 serial 綁定 WorkOrder / Device record。 | 品牌 / 主管 | 產出 light product/BOM rule：brand/model, material owner, serial control, inventory exception。 |
| BR-M11-01 | M11 | Phase 0 - Blueprint Freeze | Build Now - Dependency | 客戶付款、應收、退款 - Payment reconciliation | 每筆 payment 必須 reconcile 到 WorkOrder、deposit、balance、travel fee、refund 或 RMA adjustment。 | 會計 | 產出 finance gate：payment proof、deposit, refund approval, cancellation/travel fee, AR status。 |
| BR-M11-02 | M11 | Phase 0 - Blueprint Freeze | Build Now - Dependency | 客戶付款、應收、退款 - Refund approval levels | Refund 需依金額分層 approval；建議預設：refund > NTD 100,000 需 operations + finance double sign；partial refund 必須分類 product、labor、material、travel、inspection。 | 會計 / 主管 | 產出 finance gate：payment proof、deposit, refund approval, cancellation/travel fee, AR status。 |
| BR-M11-03 | M11 | Phase 0 - Blueprint Freeze | Build Now - Dependency | 客戶付款、應收、退款 - Invoice responsibility | Invoice issuer 依 B2C、B2B brand、builder project 或 platform collection model 決定。 | 會計 | 產出 finance gate：payment proof、deposit, refund approval, cancellation/travel fee, AR status。 |
| BR-M12-01 | M12 | Phase II - Finance / Settlement | Manual First / Light Version | 師傅、派工者、品牌月結 - Separate AP ledgers | Technician AP、dispatcher commission、brand settlement、partner settlement 必須分開 ledger / report。 | 會計 | 產出 settlement rule：technician AP、dispatcher commission、brand settlement、dispute withholding。 |
| BR-M12-02 | M12 | Phase II - Finance / Settlement | Manual First / Light Version | 師傅、派工者、品牌月結 - Cash collection offset | Technician cash collection 抵扣 monthly payable；未繳回代收款可 hold payout。 | 會計 / 派工主管 | 產出 settlement rule：technician AP、dispatcher commission、brand settlement、dispute withholding。 |
| BR-M12-03 | M12 | Phase II - Finance / Settlement | Manual First / Light Version | 師傅、派工者、品牌月結 - Dispute withholding | 除非疑似 fraud 或 severe misconduct，只應暫扣 disputed amount。 | 主管 / 會計 | 產出 settlement rule：technician AP、dispatcher commission、brand settlement、dispute withholding。 |
| BR-M13-02 | M13 | Phase III - Warranty / RMA Deepening | Manual First / Light Version | 客訴、保固、RMA、品質 - Responsibility matrix | RMA 必須分類 responsibility：product/brand、installation/technician、customer use、environment、quote/customer service、dispatch、material delay。 | 客服主管 / 品牌 | 產出 RMA business contract：RMA ID、warranty start, responsibility matrix, link to original WorkOrder。 |
| BR-M14-01 | M14 | Phase III - Partner / B2B | Later | 品牌商、經銷商、建商與合作夥伴 - Partner account scope | Brand / dealer / builder users 只能依 contract 查看自己的 cases、projects、settlement。 | Partner manager / 主管 | 產出 partner boundary：brand/dealer/builder visibility, project setup, B2B settlement rule。 |
| BR-M14-02 | M14 | Phase III - Partner / B2B | Later | 品牌商、經銷商、建商與合作夥伴 - Builder project setup | Builder projects 必須有 site group、unit list、handover/warranty date、contract price、SLA、invoice rules。 | Partner manager / 會計 | 產出 partner boundary：brand/dealer/builder visibility, project setup, B2B settlement rule。 |
| BR-M15-01 | M15 | Phase I - Market Launch Core | Build Now - Dependency | 異常、核准、風險控制 - Exception return path | 每個 exception 必須選一個 return path：continue、requote、reschedule、reassign、new WorkOrder、cancel、refund、RMA、dispute。 | 主管 / 派工主管 | 產出 exception matrix：return path, approval inbox, stop rules, responsible owner。 |
| BR-M15-02 | M15 | Phase I - Market Launch Core | Build Now - Dependency | 異常、核准、風險控制 - Approval inbox | Supervisor / accounting / brand approvals 應進 approval inbox，不應只留在 chat。 | Central admin / 主管 | 產出 exception matrix：return path, approval inbox, stop rules, responsible owner。 |
| BR-M15-03 | M15 | Phase I - Market Launch Core | Build Now - Dependency | 異常、核准、風險控制 - High-risk stop rule | Warranty unclear、brand responsibility、safety risk、customer refuses added price、high-risk drilling/opening 必須 pause 到核准後才繼續。 | 主管 | 產出 exception matrix：return path, approval inbox, stop rules, responsible owner。 |
| BR-M16-01 | M16 | Phase I - Market Launch Core | Build Now - Dependency | 聊天、通知、溝通紀錄 - Conversation visibility | Customer、technician、brand、accounting、internal notes 必須依 visibility rules 分開。 | Central admin / 客服主管 | 產出 notification template list：quote, payment, dispatch, delay, completion, RMA, refund。 |
| BR-M16-03 | M16 | Phase I - Market Launch Core | Build Now - Dependency | 聊天、通知、溝通紀錄 - Notification templates | Quote、photo request、payment、dispatch、delay、extra price、completion、RMA、refund 需要 approved templates。 | System admin / 客服主管 | 產出 notification template list：quote, payment, dispatch, delay, completion, RMA, refund。 |
| BR-M17-01 | M17 | Phase 0 - Blueprint Freeze | Build Now - Dependency | 權限、安全、稽核 - Can view/edit/approve matrix | 每個角色必須拆成 can-view、can-edit、can-approve；除 audited admin 外，不接受 all access。 | Central admin / 主管 | 產出 RBAC matrix：can-view / can-edit / can-approve、approval limit、audit events。 |
| BR-M17-02 | M17 | Phase 0 - Blueprint Freeze | Build Now - Dependency | 權限、安全、稽核 - Segregation of duties | 同一 user 不應在無 second approval 下同時 create、approve、reconcile refund。 | 會計 / 主管 | 產出 RBAC matrix：can-view / can-edit / can-approve、approval limit、audit events。 |
| BR-M17-03 | M17 | Phase 0 - Blueprint Freeze | Build Now - Dependency | 權限、安全、稽核 - Temporary IT support access | IT support sensitive access 必須 time-limited、reason-coded、audit logged。 | IT admin / 主管 | 產出 RBAC matrix：can-view / can-edit / can-approve、approval limit、audit events。 |
| BR-M18-01 | M18 | Phase 0 - Blueprint Freeze | Build Now - Dependency | 系統設定、主檔配置、IT 維運 - Master configuration owner | Service items、price tables、status codes、SLA、templates、roles、regions 需要明確 owner 與 approval。 | System admin / 主管 | 產出 system setup checklist：service items、price table、SLA、status、templates、roles、regions、change approval。 |
| BR-M18-02 | M18 | Phase 0 - Blueprint Freeze | Build Now - Dependency | 系統設定、主檔配置、IT 維運 - Change request process | Configuration changes 需要 request、owner approval、effective date、rollback note。 | System admin / 主管 | 產出 system setup checklist：service items、price table、SLA、status、templates、roles、regions、change approval。 |
| BR-M18-03 | M18 | Phase 0 - Blueprint Freeze | Build Now - Dependency | 系統設定、主檔配置、IT 維運 - Initial setup import | Coding / UAT 前，先確認 first import list：brands、models、BOM、technicians、price、regions、roles、customers、open WorkOrders。 | 主管 / System admin | 產出 system setup checklist：service items、price table、SLA、status、templates、roles、regions、change approval。 |
| BR-M19-01 | M19 | Phase V - BI / KPI Scale | Manual First / Light Version | 報表、BI、KPI - KPI formula ownership | 每個 KPI 在 dashboard 成為 official 前，都必須有 formula owner 與穩定定義。 | 主管 / BI owner | 產出 KPI/report definition：formula owner, download permission, Phase I dashboard minimum。 |
| BR-M19-02 | M19 | Phase V - BI / KPI Scale | Manual First / Light Version | 報表、BI、KPI - Report download audit | Financial、brand、technician、customer report downloads 應依 role access 控管並 audit logged。 | Central admin / BI owner | 產出 KPI/report definition：formula owner, download permission, Phase I dashboard minimum。 |
| BR-M20-01 | M20 | Phase IV - AI Ops | Manual First / Light Version | AI 營運、知識庫、品質治理 - AI knowledge owner | AI SOP、brand FAQ、price range、escalation rules、forbidden actions 需要 owner 與 version approval。 | AI ops owner / 客服主管 | 產出 AI guardrails：allowed actions、forbidden decisions、handoff to human、quality review queue。 |
| BR-M20-02 | M20 | Phase IV - AI Ops | Manual First / Light Version | AI 營運、知識庫、品質治理 - AI forbidden decisions | AI 不可 final quote、approve refund、decide warranty liability、promise legal/safety outcome 或 modify settlement。 | 主管 / AI owner | 產出 AI guardrails：allowed actions、forbidden decisions、handoff to human、quality review queue。 |

## M01 客戶入口

> M01 Customer & Omnichannel Intake（客戶與全渠道入口）

> 模組明細：營運原始輸入 + ERP Consultant 建議答案 + Coding Gate。

> 模組業務規則 / 建議預設答案

| Rule ID | 規則範圍 | 建議預設答案 | 負責人 | 是否阻擋 Coding | 營運 備註 | col_7 | col_8 | col_9 |
|---|---|---|---|---|---|---|---|---|
| BR-M01-01 | Channel source 必填 | 每個 Case 必須保留 source channel：LINE、電話、web、brand、store、dealer、builder、referral。 | 客服主管 | 是 | 每個 Case 必須保留 source channel：LINE、電話、web、brand、store、dealer、builder、referral。 |  |  |  |
| BR-M01-02 | 先建立 Case，再進報價 | 凡可能報價、派工、退款或客訴的 inquiry，必須先建立 Case。 | 客服主管 | 否 | 凡可能報價、派工、退款或客訴的 inquiry，必須先建立 Case。 |  |  |  |
| BR-M01-03 | External portal 權限限制 | External partners 只能建立或查看自己被允許的 cases；internal staff 可代為建立。 | Partner manager / 主管 | 是 | External partners 只能建立或查看自己被允許的 cases；internal staff 可代為建立。 |  |  |  |
| 模組 Q&A：營運原始輸入 + ERP 建議答案 |  |  |  |  |  |  |  |  |
| QID | Topic | 營運原始輸入 / 既有答案 | ERP Suggested Answer | 業務確認 | 流程 Gate / Coding Gate | 營運 備註 | 關聯模組 | AI Engineering / Coding 提醒 |
| Q006 | 客戶入口 | 早期版本 只使用 LINE。 | Full 完整版本 不再只限 LINE。LINE 是主入口，但電話、Web Chat、品牌商入口、官網、門市、經銷商、熟客介紹都應可建 Case。 | 哪些入口只由客服代建，不讓外部自行登入？ | Case / Inquiry、customer contact、source channel、first SLA clock | Full 完整版本 不再只限 LINE。LINE 是主入口，但電話、Web Chat、品牌商入口、官網、門市、經銷商、熟客介紹都應可建 Case。 | M02,M03,M16 | Engineering 可依此列草擬 screens/workflow，但 final gates 需依 營運 review status。 |
| G036 | Lead source 與 marketing attribution | 前期 未涵蓋。 | 每個 Case 應保留入口來源，方便知道 LINE、官網、品牌、門市、經銷商與熟客介紹的轉換。 | 確認是否要追蹤來源成效。 | CRM control | 每個 Case 應保留入口來源，方便知道 LINE、官網、品牌、門市、經銷商與熟客介紹的轉換。 | M19 | Engineering 可依此列草擬 screens/workflow，但 final gates 需依 營運 review status。 |

## M02 客戶地址設備

> M02 Customer / Site / Device Master（客戶/地址/設備主檔）

> 模組明細：營運原始輸入 + ERP Consultant 建議答案 + Coding Gate。

> 模組業務規則 / 建議預設答案

| Rule ID | 規則範圍 | 建議預設答案 | 負責人 | 是否阻擋 Coding | 營運 備註 | col_7 | col_8 | col_9 |
|---|---|---|---|---|---|---|---|---|
| BR-M02-01 | Customer 去重規則 | 預設 duplicate key 為 phone + LINE ID；address 可輔助比對，但不能作為唯一 key。 | Data steward | 是 | 預設 duplicate key 為 phone + LINE ID；address 可輔助比對，但不能作為唯一 key。 |  |  |  |
| BR-M02-02 | 保固用 Device record | 主鎖與高價零件應建立 Device record，包含 brand、model、serial、purchase/install/warranty date。 | 客服主管 / 品牌 | 是 | 主鎖與高價零件應建立 Device record，包含 brand、model、serial、purchase/install/warranty date。 |  |  |  |
| BR-M02-03 | Project / site group | 建商 / 社區案應使用 Site Group，以支援 batch dispatch、warranty、settlement、reporting。 | 主管 / Partner manager | 部分 | 建商 / 社區案應使用 Site Group，以支援 batch dispatch、warranty、settlement、reporting。 |  |  |  |
| 模組 Q&A：營運原始輸入 + ERP 建議答案 |  |  |  |  |  |  |  |  |
| QID | Topic | 營運原始輸入 / 既有答案 | ERP Suggested Answer | 業務確認 | 流程 Gate / Coding Gate | 營運 備註 | 關聯模組 | AI Engineering / Coding 提醒 |
| Q008 | 自動建立客戶資料 | 一定要。 | 正確。Full 完整版本 一進線即建 Customer，後續補設備、地址、品牌型號、購買來源。 | 客戶去重依電話、LINE ID 還是地址？ | Customer profile、Site profile、Device registry、service history | 正確。Full 完整版本 一進線即建 Customer，後續補設備、地址、品牌型號、購買來源。 | M01,M03,M13 | Engineering 可依此列草擬 screens/workflow，但 final gates 需依 營運 review status。 |
| Q012 | 保留案件歷史 | 每件都保留，派工、客訴、保固全部。 | 正確。Full 完整版本 每件 Case / ProblemCard / WorkOrder / RMA 都要保留歷史。照片另依保存規則。 | 歷史保存是 1 年、保固期，還是更久？ | Customer profile、Site profile、Device registry、service history | 正確。Full 完整版本 每件 Case / ProblemCard / WorkOrder / RMA 都要保留歷史。照片另依保存規則。 | M01,M03,M13 | Engineering 可依此列草擬 screens/workflow，但 final gates 需依 營運 review status。 |
| G001 | 客戶主檔去重規則 | 前期 無固定答案 | 建議以電話 + LINE ID 為主、地址為輔；同電話多地址允許，需合併歷史查詢。 | 確認客戶去重主鍵與人工合併權限。 | Data quality gate | 建議以電話 + LINE ID 為主、地址為輔；同電話多地址允許，需合併歷史查詢。 | M01,M09,M13 | Engineering 可依此列草擬 screens/workflow，但 final gates 需依 營運 review status。 |
| G002 | 設備主檔與保固起算 | 前期 無固定答案 | 每個主鎖/高價件建立 Device record，綁品牌、型號、序號、購買日、安裝日、保固起算日；建商案預設用交屋/點交日，零售案用安裝日或品牌保固日。 | 確認建商案是否固定用交屋/點交日，零售案是否用安裝日。 | Warranty gate | 每個主鎖/高價件建立 Device record，綁品牌、型號、序號、購買日、安裝日、保固起算日；建商案預設用交屋/點交日，零售案用安裝日或品牌保固日。 | M10,M13 | Engineering 可依此列草擬 screens/workflow，但 final gates 需依 營運 review status。 |
| G003 | 社區/建案/多戶資料 | 前期 無固定答案 | 建商或社區案需 Site Group：同社區可批次派工、批次月結、共用保固條件。 | 確認建商專案是否需要批次工單。 | Project site gate | 建商或社區案需 Site Group：同社區可批次派工、批次月結、共用保固條件。 | M14,M12 | Engineering 可依此列草擬 screens/workflow，但 final gates 需依 營運 review status。 |

## M03 AI ProblemCard

> M03 AI Service Triage & ProblemCard（AI 分診與 ProblemCard）

> 模組明細：營運原始輸入 + ERP Consultant 建議答案 + Coding Gate。

> 模組業務規則 / 建議預設答案

| Rule ID | 規則範圍 | 建議預設答案 | 負責人 | 是否阻擋 Coding | 營運 備註 | col_7 | col_8 | col_9 |
|---|---|---|---|---|---|---|---|---|
| BR-M03-01 | ProblemCard completeness gate | ProblemCard status 應顯示 Ready for Quote、Need Info、Need Photo、Need Human 或 Closed Remote。 | 客服主管 | 否 | ProblemCard status 應顯示 Ready for Quote、Need Info、Need Photo、Need Human 或 Closed Remote。 |  |  |  |
| BR-M03-02 | AI escalation | 遇到 urgent、angry customer、高金額、保固不明、refund、safety/legal 或 3 次失敗循環，AI 必須轉真人。 | 客服主管 / AI owner | 是 | 遇到 urgent、angry customer、高金額、保固不明、refund、safety/legal 或 3 次失敗循環，AI 必須轉真人。 |  |  |  |
| BR-M03-03 | AI 不做 final quote | AI 只能建議 range / draft；final customer price 需真人或已核准 fixed-price rule。 | 客服主管 / 主管 | 是 | AI 只能建議 range / draft；final customer price 需真人或已核准 fixed-price rule。 |  |  |  |
| 模組 Q&A：營運原始輸入 + ERP 建議答案 |  |  |  |  |  |  |  |  |
| QID | Topic | 營運原始輸入 / 既有答案 | ERP Suggested Answer | 業務確認 | 流程 Gate / Coding Gate | 營運 備註 | 關聯模組 | AI Engineering / Coding 提醒 |
| Q013 | AI 第一輪判斷 | 安裝/維修/保固/客訴、急件、可否報價、是否需真人、是否需照片，全部。 | AI 第一輪要做五向分診，不只分類案件。 | 急件關鍵字要由誰提供？ | ProblemCard、triage result、missing-info checklist、escalation flag | AI 第一輪要做五向分診，不只分類案件。 | M04,M06,M09,M20 | Engineering 可依此列草擬 screens/workflow，但 final gates 需依 營運 review status。 |
| Q014 | ProblemCard 核心 | 一定要；不一定都連 WorkOrder，AI chatbot 有時可處理完。 | 正確。ProblemCard 是 Service Ticket；遠端處理完可關閉，不一定轉 WorkOrder。 | 遠端解決的 ProblemCard 是否需要客戶確認關閉？ | ProblemCard、triage result、missing-info checklist、escalation flag | 正確。ProblemCard 是 Service Ticket；遠端處理完可關閉，不一定轉 WorkOrder。 | M04,M06,M09,M20 | Engineering 可依此列草擬 screens/workflow，但 final gates 需依 營運 review status。 |
| Q015 | ProblemCard 必填 | 姓名、電話、地址/區域、品牌、型號、問題類型、照片、保固、預約時間、付款狀態，全部。 | Full 完整版本 可全部納入，但要分必填 / 可後補 / 派工前必填，避免客戶卡太久。 | 哪些欄位缺少不得報價？ | ProblemCard、triage result、missing-info checklist、escalation flag | Full 完整版本 可全部納入，但要分必填 / 可後補 / 派工前必填，避免客戶卡太久。 | M04,M06,M09,M20 | Engineering 可依此列草擬 screens/workflow，但 final gates 需依 營運 review status。 |
| Q016 | 安裝必問 | 是否已購買、品牌型號、門型、門厚、舊鎖照片、地址、希望時間、是否需材料，且確認價格與訂單。 | 安裝 ProblemCard 應加上「價格可接受」與「LINE 確認」。 | 門厚是否一定要客戶提供，還是照片判斷即可？ | ProblemCard、triage result、missing-info checklist、escalation flag | 安裝 ProblemCard 應加上「價格可接受」與「LINE 確認」。 | M04,M06,M09,M20 | Engineering 可依此列草擬 screens/workflow，但 final gates 需依 營運 review status。 |
| Q017 | 維修必問 | 全部；另需門型、內外門、是否仍有原鑰匙、人在門內是否可開門。 | 很重要。維修分診需判斷急件、是否被鎖、能否遠端排除、是否需要開鎖。 | 被鎖門外是否直接 Red Code？ | ProblemCard、triage result、missing-info checklist、escalation flag | 很重要。維修分診需判斷急件、是否被鎖、能否遠端排除、是否需要開鎖。 | M04,M06,M09,M20 | Engineering 可依此列草擬 screens/workflow，但 final gates 需依 營運 review status。 |
| Q018 | 保固必問 | 購買日、安裝日、品牌、型號、序號、發票/保卡、故障照片、品牌判斷，全部。 | 保固 ProblemCard 必須連品牌 / 序號 / 發票 / 購買日，並禁止 AI 最終報價。 | 保固判斷由品牌、客服還是主管？ | ProblemCard、triage result、missing-info checklist、escalation flag | 保固 ProblemCard 必須連品牌 / 序號 / 發票 / 購買日，並禁止 AI 最終報價。 | M04,M06,M09,M20 | Engineering 可依此列草擬 screens/workflow，但 final gates 需依 營運 review status。 |
| Q019 | 客訴分類 | 先連原工單 + 原住址。 | Full 完整版本 建議建立獨立 RMA / Complaint Case，但一定連原工單與原地址。 | RMA 編號格式是否採年月流水號？ | ProblemCard、triage result、missing-info checklist、escalation flag | Full 完整版本 建議建立獨立 RMA / Complaint Case，但一定連原工單與原地址。 | M04,M06,M09,M20 | Engineering 可依此列草擬 screens/workflow，但 final gates 需依 營運 review status。 |
| Q020 | AI 轉真人 | 急件、生氣、高金額、保固不明、退款、現場異常、品牌責任、法律/安全，另加 AI 超過三輪錯誤。 | Full 完整版本 採轉真人規則：高風險立即轉，AI 3 cycle 失敗轉。 | AI 失敗幾次轉真人：2 次還是 3 次？ | ProblemCard、triage result、missing-info checklist、escalation flag | Full 完整版本 採轉真人規則：高風險立即轉，AI 3 cycle 失敗轉。 | M04,M06,M09,M20 | Engineering 可依此列草擬 screens/workflow，但 final gates 需依 營運 review status。 |
| G037 | ProblemCard completeness score | 前期 有 required fields。 | ProblemCard 可顯示 completeness score：可報價、可派工、需補資料、需真人。 | 確認 score 是否影響派工。 | Triage quality | ProblemCard 可顯示 completeness score：可報價、可派工、需補資料、需真人。 | M04,M06 | Engineering 可依此列草擬 screens/workflow，但 final gates 需依 營運 review status。 |

## M04 報價價格

> M04 Pricing, Quote & Commercial Approval（價格、報價與商務核准）

> 模組明細：營運原始輸入 + ERP Consultant 建議答案 + Coding Gate。

> 模組業務規則 / 建議預設答案

| Rule ID | 規則範圍 | 建議預設答案 | 負責人 | 是否阻擋 Coding | 營運 備註 | col_7 | col_8 | col_9 |
|---|---|---|---|---|---|---|---|---|
| BR-M04-01 | Internal quote 與 customer quote 分離 | Customer 只看 total receivable；internal view 保留 labor、material、travel、margin、brand cost。 | 主管 / 會計 | 是 | Customer 只看 total receivable；internal view 保留 labor、material、travel、margin、brand cost。 |  |  |  |
| BR-M04-02 | Price table 版本管理 | Price table 必須有 effective date 與 owner；已確認 WorkOrder 保留原核准價格。 | System admin / 主管 | 是 | Price table 必須有 effective date 與 owner；已確認 WorkOrder 保留原核准價格。 |  |  |  |
| BR-M04-03 | 依金額 / 風險核准 | 高金額、特殊門、保固不明、discount、類 refund adjustment，在 customer confirmation 前需 approval。 | 主管 | 是 | 高金額、特殊門、保固不明、discount、類 refund adjustment，在 customer confirmation 前需 approval。 |  |  |  |
| 模組 Q&A：營運原始輸入 + ERP 建議答案 |  |  |  |  |  |  |  |  |
| QID | Topic | 營運原始輸入 / 既有答案 | ERP Suggested Answer | 業務確認 | 流程 Gate / Coding Gate | 營運 備註 | 關聯模組 | AI Engineering / Coding 提醒 |
| Q007 | 是否每個需求建案件 | 全部建立；所有 quotation 要含預付款 / 訂金、付款方式、匯款末五碼、現場現金、信用卡、web link payment。 | 建議所有進線先建 Case；凡涉及報價、付款、派工、客訴都升為 ProblemCard / WorkOrder。付款條件要在報價階段定義。 | 訂金金額是固定金額還是比例？ | Internal quote、customer quote、approval requirement、payment gate | 建議所有進線先建 Case；凡涉及報價、付款、派工、客訴都升為 ProblemCard / WorkOrder。付款條件要在報價階段定義。 | M03,M11,M15 | Engineering 可依此列草擬 screens/workflow，但 final gates 需依 營運 review status。 |
| Q021 | AI 報價 | 只可給區間，需真人確認最後價格。 | 正確。AI 可產生 quote draft / range，不可 final price。 | 哪些固定價可不用真人確認？ | Internal quote、customer quote、approval requirement、payment gate | 正確。AI 可產生 quote draft / range，不可 final price。 | M03,M11,M15 | Engineering 可依此列草擬 screens/workflow，但 final gates 需依 營運 review status。 |
| Q028 | 報價前提 | ProblemCard 完整、照片、地址、保固、品牌、師傅確認，全部；客戶確認 ProblemCard clear。 | Full 完整版本 報價 gate：ProblemCard clear + evidence enough + customer confirms issue. | 師傅是否每張都需確認報價可施工？ | Internal quote、customer quote、approval requirement、payment gate | Full 完整版本 報價 gate：ProblemCard clear + evidence enough + customer confirms issue. | M03,M11,M15 | Engineering 可依此列草擬 screens/workflow，但 final gates 需依 營運 review status。 |
| Q029 | 固定價 | 標準安裝、標準維修、檢測費、軟體更新。 | 固定價項目可進價格表；仍需保留例外加價。 | 車馬費與急件費是否也固定？ | Internal quote、customer quote、approval requirement、payment gate | 固定價項目可進價格表；仍需保留例外加價。 | M03,M11,M15 | Engineering 可依此列草擬 screens/workflow，但 final gates 需依 營運 review status。 |
| Q030 | 區間價 | 維修、特殊門型、舊鎖拆除、額外開孔、缺料、保固判斷，全部；最終價格送 chatbot，客戶確認 schedule + final price。 | Full 完整版本 區間價轉 final quote 的 gate 是現場或客服確認。 | 區間價是否可先收訂金？ | Internal quote、customer quote、approval requirement、payment gate | Full 完整版本 區間價轉 final quote 的 gate 是現場或客服確認。 | M03,M11,M15 | Engineering 可依此列草擬 screens/workflow，但 final gates 需依 營運 review status。 |
| Q031 | 不能 AI 自動報價 | 維修、保固、特殊門型、高金額、客訴、品牌責任、照片不足，全部；所有價格需客服或師傅確認。 | AI 只輔助，不做 final commercial decision。 | 固定價安裝是否例外？ | Internal quote、customer quote、approval requirement、payment gate | AI 只輔助，不做 final commercial decision。 | M03,M11,M15 | Engineering 可依此列草擬 screens/workflow，但 final gates 需依 營運 review status。 |
| Q032 | 報價有效期限 | 3、7、15、30 天、依品牌，全部。 | Full 完整版本 支援依案件類型設定：一般 3 天、標準安裝 7 天、品牌/建商 15-30 天。 | 預設天數請主管拍板。 | Internal quote、customer quote、approval requirement、payment gate | Full 完整版本 支援依案件類型設定：一般 3 天、標準安裝 7 天、品牌/建商 15-30 天。 | M03,M11,M15 | Engineering 可依此列草擬 screens/workflow，但 final gates 需依 營運 review status。 |
| Q033 | 訂單成立 | 客戶同意、付款、客服確認、品牌確認、師傅接單、系統建立；主要 gate 是客戶和師傅在 chatbot 同意。 | Full 完整版本 建議分兩個 gate：Order Created = 客戶確認價格；Dispatch Confirmed = 師傅接單。付款 gate 依報價規則。 | 哪些案件必須付款後才派工？ | Internal quote、customer quote、approval requirement、payment gate | Full 完整版本 建議分兩個 gate：Order Created = 客戶確認價格；Dispatch Confirmed = 師傅接單。付款 gate 依報價規則。 | M03,M11,M15 | Engineering 可依此列草擬 screens/workflow，但 final gates 需依 營運 review status。 |
| Q034 | 報價欄位 | 內部報價含原價、折扣、客戶實付、退款、產品費、工資、材料、車馬、急件；外部只顯示客戶實付。 | 正確。客戶只看總額，內部才拆成本與師傅工資。 | 客戶是否可看工資與材料拆分？ | Internal quote、customer quote、approval requirement、payment gate | 正確。客戶只看總額，內部才拆成本與師傅工資。 | M03,M11,M15 | Engineering 可依此列草擬 screens/workflow，但 final gates 需依 營運 review status。 |
| G031 | 價格版本管理 | 前期 有 quote rules。 | 價格表需要生效日、停用日、適用品牌/區域/案件類型；已成立工單不得被新價格覆蓋。 | 確認改價格是否需主管核准。 | Pricing control | 價格表需要生效日、停用日、適用品牌/區域/案件類型；已成立工單不得被新價格覆蓋。 | M18 | Engineering 可依此列草擬 screens/workflow，但 final gates 需依 營運 review status。 |

## M05 WorkOrder狀態

> M05 WorkOrder Lifecycle & Status Control（WorkOrder 生命週期與狀態控制）

> 模組明細：營運原始輸入 + ERP Consultant 建議答案 + Coding Gate。

> 模組業務規則 / 建議預設答案

| Rule ID | 規則範圍 | 建議預設答案 | 負責人 | 是否阻擋 Coding | 營運 備註 | col_7 | col_8 | col_9 |
|---|---|---|---|---|---|---|---|---|
| BR-M05-01 | 正式 state machine | 只有 approved roles 可推動 core states；cancel、reopen、reschedule、refund、dispute 必須填 status reason。 | System admin / 派工主管 | 是 | 只有 approved roles 可推動 core states；cancel、reopen、reschedule、refund、dispute 必須填 status reason。 |  |  |  |
| BR-M05-02 | Reopen 必須建立關聯 | Rework、warranty return、cancelled-recreated jobs 必須連回原 WorkOrder，不可覆蓋歷史。 | 派工主管 | 否 | Rework、warranty return、cancelled-recreated jobs 必須連回原 WorkOrder，不可覆蓋歷史。 |  |  |  |
| BR-M05-03 | Customer confirmation gate | 只有 customer price/time/payment gate 滿足後，WorkOrder 才可進入 dispatch。 | 主管 / 派工主管 | 是 | 只有 customer price/time/payment gate 滿足後，WorkOrder 才可進入 dispatch。 |  |  |  |
| 模組 Q&A：營運原始輸入 + ERP 建議答案 |  |  |  |  |  |  |  |  |
| QID | Topic | 營運原始輸入 / 既有答案 | ERP Suggested Answer | 業務確認 | 流程 Gate / Coding Gate | 營運 備註 | 關聯模組 | AI Engineering / Coding 提醒 |
| Q009 | 現行進線到派工 | LINE chatbot 收需求，確認工單內容與總金額，報價轉訂單，確認信用卡或匯款末五碼，轉工單，媒合師傅，chatbot 確認時程，進 schedule book，師傅確認 BOM / 材料，完工上照片，客戶簽名，AR confirmed。 | 這就是 Full 完整版本 主流程。需正式拆成：Inquiry → ProblemCard → Internal Quote → Customer Confirm → Payment Gate → WorkOrder → Dispatch → Schedule → Onsite → Completion → AR。 | 是否所有訂單都要 payment gate 後才派工？ | WorkOrder、status history、state transition audit | 這就是 Full 完整版本 主流程。需正式拆成：Inquiry → ProblemCard → Internal Quote → Customer Confirm → Payment Gate → WorkOrder → Dispatch → Schedule → Onsite → Completion → AR。 | M04,M06,M08,M15 | Engineering 可依此列草擬 screens/workflow，但 final gates 需依 營運 review status。 |
| Q048 | 狀態機 | 先簡化，only admin can modify。 | Full 完整版本 用簡化前台狀態 + 內部細狀態；只有 admin / authorized role 可改核心狀態。 | 師傅可以改哪些狀態？ | WorkOrder、status history、state transition audit | Full 完整版本 用簡化前台狀態 + 內部細狀態；只有 admin / authorized role 可改核心狀態。 | M04,M06,M08,M15 | Engineering 可依此列草擬 screens/workflow，但 final gates 需依 營運 review status。 |
| Q049 | 報價前狀態 | 與 ProblemCard 共用，Yes。 | 正確。Inquiry / ProblemCard status 與 quote gate 連動。 | 待照片、待報價是否都在 ProblemCard？ | WorkOrder、status history、state transition audit | 正確。Inquiry / ProblemCard status 與 quote gate 連動。 | M04,M06,M08,M15 | Engineering 可依此列草擬 screens/workflow，但 final gates 需依 營運 review status。 |
| Q050 | 報價到派工狀態 | 已報價、待客戶確認、待付款、已付款、待派工、派工中，全部。 | 正確。這是 Quote-to-Dispatch 狀態。 | 已付款是否一定在待派工之前？ | WorkOrder、status history、state transition audit | 正確。這是 Quote-to-Dispatch 狀態。 | M04,M06,M08,M15 | Engineering 可依此列草擬 screens/workflow，但 final gates 需依 營運 review status。 |
| Q051 | 派工到上工狀態 | 已指派、待師傅接單、已接單、已改派、已取消、已到場、上工中；師傅按鈕含待接單、已接單、已改派、已取消、已到場。 | Full 完整版本 需清楚區分「派工狀態」與「師傅端按鈕」。 | 師傅是否可按已取消？ | WorkOrder、status history、state transition audit | Full 完整版本 需清楚區分「派工狀態」與「師傅端按鈕」。 | M04,M06,M08,M15 | Engineering 可依此列草擬 screens/workflow，但 final gates 需依 營運 review status。 |
| Q052 | 完工狀態 | 待完工回報、待照片、待客戶確認、待客服審核、已完工、已結案，全部。 | 正確。完工後進帳務前需客服 / 客戶 gate。 | 客服審核是否每單都要？ | WorkOrder、status history、state transition audit | 正確。完工後進帳務前需客服 / 客戶 gate。 | M04,M06,M08,M15 | Engineering 可依此列草擬 screens/workflow，但 final gates 需依 營運 review status。 |
| G032 | 工單重開與關聯 | 前期 提到 RMA independent。 | 取消重開、返修、新需求都應關聯原工單，不直接覆蓋原狀態。 | 確認重開是否用新工單號。 | Lifecycle control | 取消重開、返修、新需求都應關聯原工單，不直接覆蓋原狀態。 | M13,M15 | Engineering 可依此列草擬 screens/workflow，但 final gates 需依 營運 review status。 |

## M06 派工排程

> M06 Dispatch, Matching, Scheduling & Capacity（派工、媒合、排程與產能）

> 模組明細：營運原始輸入 + ERP Consultant 建議答案 + Coding Gate。

> 模組業務規則 / 建議預設答案

| Rule ID | 規則範圍 | 建議預設答案 | 負責人 | 是否阻擋 Coding | 營運 備註 | col_7 | col_8 | col_9 |
|---|---|---|---|---|---|---|---|---|
| BR-M06-01 | Dispatch eligibility | 符合資格的 locksmith 必須符合 area、availability、skill、brand/model experience、inventory、suspension status。 | 派工主管 | 否 | 符合資格的 locksmith 必須符合 area、availability、skill、brand/model experience、inventory、suspension status。 |  |  |  |
| BR-M06-02 | 搶單限制 | 只有核准 travel time 內的 low-risk standard jobs 可進入 grab-order pool。 | 派工主管 | 是 | 只有核准 travel time 內的 low-risk standard jobs 可進入 grab-order pool。 |  |  |  |
| BR-M06-03 | Acceptance SLA | 建議 acceptance SLA：normal 15 分鐘、urgent 5 分鐘；前期 的 normal 10 分鐘是較嚴格選項，需 supervisor 確認。 | 派工主管 | 是 | 建議 acceptance SLA：normal 15 分鐘、urgent 5 分鐘；前期 的 normal 10 分鐘是較嚴格選項，需 supervisor 確認。 |  |  |  |
| 模組 Q&A：營運原始輸入 + ERP 建議答案 |  |  |  |  |  |  |  |  |
| QID | Topic | 營運原始輸入 / 既有答案 | ERP Suggested Answer | 業務確認 | 流程 Gate / Coding Gate | 營運 備註 | 關聯模組 | AI Engineering / Coding 提醒 |
| Q038 | 派工模式 | 系統推薦、搶單、人工指派、推薦後人工確認、原師傅返修，全部。 | Full 完整版本 全部支援，但按案件類型決定預設模式。 | 哪些案件不得搶單？ | Dispatch assignment、schedule slot、acceptance SLA、reassignment reason | Full 完整版本 全部支援，但按案件類型決定預設模式。 | M05,M07,M10 | Engineering 可依此列草擬 screens/workflow，但 final gates 需依 營運 review status。 |
| Q039 | 可搶單案件 | 標準安裝、標準維修、低風險、一般地區；車程不可超過 1 小時。 | 合理。Full 完整版本 搶單池限制為低風險 + 1 小時車程內。 | 1 小時是單程還是來回？ | Dispatch assignment、schedule slot、acceptance SLA、reassignment reason | 合理。Full 完整版本 搶單池限制為低風險 + 1 小時車程內。 | M05,M07,M10 | Engineering 可依此列草擬 screens/workflow，但 final gates 需依 營運 review status。 |
| Q040 | 必須人工指派 | 急件、高金額、客訴、保固、特殊門型、品牌指定、資深師傅，全部。 | 正確。高風險案件不自動搶單。 | 品牌指定師傅是否能 override 系統排序？ | Dispatch assignment、schedule slot、acceptance SLA、reassignment reason | 正確。高風險案件不自動搶單。 | M05,M07,M10 | Engineering 可依此列草擬 screens/workflow，但 final gates 需依 營運 review status。 |
| Q041 | 媒合排序 | 距離、地區、空檔、工資、品牌經驗、型號經驗、評分、接單率、客訴率、庫存。 | Full 完整版本 可採此順序；ERP 註解：工資排太前面可能影響品質，建議距離/空檔/技能先於工資。 | 是否要把技能排在工資前？ | Dispatch assignment、schedule slot、acceptance SLA、reassignment reason | Full 完整版本 可採此順序；ERP 註解：工資排太前面可能影響品質，建議距離/空檔/技能先於工資。 | M05,M07,M10 | Engineering 可依此列草擬 screens/workflow，但 final gates 需依 營運 review status。 |
| Q043 | 回覆時間 | 一般 10 分鐘，急件 5 分鐘。 | 採用 前期 答案。逾時要自動重派。 | 人工指定件是否也 10 分鐘？ | Dispatch assignment、schedule slot、acceptance SLA、reassignment reason | 採用 前期 答案。逾時要自動重派。 | M05,M07,M10 | Engineering 可依此列草擬 screens/workflow，但 final gates 需依 營運 review status。 |
| Q045 | 接單後取消或逾時 | 未填。 | Full 完整版本 建議：逾時自動改派；接單後取消需客服接手、記錄原因、必要時主管處理；客戶改期需新 schedule。 | 是否允許原師傅找代班？ | Dispatch assignment、schedule slot、acceptance SLA、reassignment reason | Full 完整版本 建議：逾時自動改派；接單後取消需客服接手、記錄原因、必要時主管處理；客戶改期需新 schedule。 | M05,M07,M10 | Engineering 可依此列草擬 screens/workflow，但 final gates 需依 營運 review status。 |
| Q046 | 預約精度 | 1 小時區間 + 師傅聯絡，工單要有客戶電話。 | 採用。客戶端顯示 1 小時區間，師傅接單後可電話聯絡，但改期必須回系統。 | 師傅電話聯絡是否需記錄結果？ | Dispatch assignment、schedule slot、acceptance SLA、reassignment reason | 採用。客戶端顯示 1 小時區間，師傅接單後可電話聯絡，但改期必須回系統。 | M05,M07,M10 | Engineering 可依此列草擬 screens/workflow，但 final gates 需依 營運 review status。 |
| G033 | 多師傅/多段工單 | 前期 未涵蓋。 | 大型案或建商案可能一張案件多師傅、多日期、多戶；需支援 parent case + child work orders。 | 確認是否需要多師傅/多戶模式。 | Scheduling model | 大型案或建商案可能一張案件多師傅、多日期、多戶；需支援 parent case + child work orders。 | M14,M12 | Engineering 可依此列草擬 screens/workflow，但 final gates 需依 營運 review status。 |

## M07 師傅管理

> M07 Workforce & Technician Qualification（師傅資格與人力管理）

> 模組明細：營運原始輸入 + ERP Consultant 建議答案 + Coding Gate。

> 模組業務規則 / 建議預設答案

| Rule ID | 規則範圍 | 建議預設答案 | 負責人 | 是否阻擋 Coding | 營運 備註 | col_7 | col_8 | col_9 |
|---|---|---|---|---|---|---|---|---|
| BR-M07-01 | Technician onboarding | Technician 在 dispatch 前必須有 profile、bank/payment info、service area、skill matrix、brand authorization、contract status。 | 派工主管 | 是 |  |  |  |  |
| BR-M07-02 | 停權條件 | 高 complaint rate、no-show、未繳回代收款、未退料、嚴重安全問題，可暫停 dispatch eligibility。 | 派工主管 / 主管 | 是 |  |  |  |  |
| BR-M07-03 | Performance feedback | RMA responsibility、on-time rate、acceptance rate、rejection rate、customer feedback 會影響 dispatch ranking。 | 派工主管 / BI owner | 部分 |  |  |  |  |
| 模組 Q&A：營運原始輸入 + ERP 建議答案 |  |  |  |  |  |  |  |  |
| QID | Topic | 營運原始輸入 / 既有答案 | ERP Suggested Answer | 業務確認 | 流程 Gate / Coding Gate | 營運 備註 | 關聯模組 | AI Engineering / Coding 提醒 |
| Q044 | 拒單理由 | 一定要，且影響評分。 | 正確。拒單 reason code 連技師評分與派工排序。 | 拒單率超過多少暫停派工？ | Technician profile、skill matrix、availability、eligibility、performance score |  | M06,M12,M19 | Engineering 可依此列草擬 screens/workflow，但 final gates 需依 營運 review status。 |
| G004 | 師傅 onboarding | 前期 無固定答案 | 師傅不可只是一個帳號；需建立身份資料、服務區、可接類型、品牌授權、銀行帳戶、合約狀態。 | 確認師傅上線前必填資料。 | Eligibility gate |  | M17,M12 | Engineering 可依此列草擬 screens/workflow，但 final gates 需依 營運 review status。 |
| G005 | 品牌/型號技能矩陣 | 前期 無固定答案 | 每位師傅要有品牌與型號技能等級；特殊門型、高價件、客訴返修需指定等級。 | 確認技能等級是否分初階/一般/資深。 | Dispatch eligibility |  | M06,M10,M13 | Engineering 可依此列草擬 screens/workflow，但 final gates 需依 營運 review status。 |
| G006 | 師傅停權與恢復 | 前期 無固定答案 | 高客訴率、拒單率、逾時、未退料、帳務異常可自動警示；停權需主管核准。 | 確認停權門檻與恢復條件。 | Risk control |  | M15,M19 | Engineering 可依此列草擬 screens/workflow，但 final gates 需依 營運 review status。 |

## M08 現場施工

> M08 Mobile Field Execution（現場施工行動流程）

> 模組明細：營運原始輸入 + ERP Consultant 建議答案 + Coding Gate。

> 模組業務規則 / 建議預設答案

| Rule ID | 規則範圍 | 建議預設答案 | 負責人 | 是否阻擋 Coding | 營運 備註 | col_7 | col_8 | col_9 |
|---|---|---|---|---|---|---|---|---|
| BR-M08-01 | GPS 到場 | 到場需 GPS + timestamp；customer not onsite、dispute、travel fee evidence 可要求照片。 | 派工主管 | 部分 |  |  |  |  |
| BR-M08-02 | 現場 scope change | 任何 onsite scope change 或 extra charge，繼續施工前都需要 customer confirmation 與 evidence。 | 主管 / 派工主管 | 是 |  |  |  |  |
| BR-M08-03 | Completion package | Completion 需 photos、materials used、payment status、customer signature / LINE confirmation，以及必要 teaching note。 | 派工主管 / 客服 | 否 |  |  |  |  |
| 模組 Q&A：營運原始輸入 + ERP 建議答案 |  |  |  |  |  |  |  |  |
| QID | Topic | 營運原始輸入 / 既有答案 | ERP Suggested Answer | 業務確認 | 流程 Gate / Coding Gate | 營運 備註 | 關聯模組 | AI Engineering / Coding 提醒 |
| Q056 | 到場打卡 | GPS。 | Full 完整版本 採 GPS + 時間 + 可選照片，支援客戶不在與車馬費證據。 | GPS 是否所有師傅同意？ | Arrival proof、completion report、material usage、customer sign-off |  | M05,M09,M10,M15 | Engineering 可依此列草擬 screens/workflow，但 final gates 需依 營運 review status。 |
| Q057 | 施工前報價確認 | 可能加價時。 | 正確。標準案不重複確認，有加價 / 範圍變更才確認。 | 多少加價要客服介入？ | Arrival proof、completion report、material usage、customer sign-off |  | M05,M09,M10,M15 | Engineering 可依此列草擬 screens/workflow，但 final gates 需依 營運 review status。 |
| Q058 | 外觀風險 | 所有案件，尤其特殊門。 | Full 完整版本 可做簡化：所有案件有基本外觀提醒，特殊門 / 開孔 / 切割需簽名。 | 是否所有案件都要簽外觀同意？ | Arrival proof、completion report、material usage、customer sign-off |  | M05,M09,M10,M15 | Engineering 可依此列草擬 screens/workflow，但 final gates 需依 營運 review status。 |
| Q059 | 完工回報 | 施工內容、用料、照片、加價、收款、客戶簽名，全部。 | 還應加使用教學與保固說明。 | 使用教學是否必填？ | Arrival proof、completion report、material usage、customer sign-off |  | M05,M09,M10,M15 | Engineering 可依此列草擬 screens/workflow，但 final gates 需依 營運 review status。 |
| Q060 | 客戶簽名 | 一定要。 | 正確。Full 完整版本 完工 gate = 客戶簽名 / LINE 確認。 | 電子簽名形式？ | Arrival proof、completion report、material usage、customer sign-off |  | M05,M09,M10,M15 | Engineering 可依此列草擬 screens/workflow，但 final gates 需依 營運 review status。 |
| Q061 | 使用教學 | 新安裝要。 | 正確。新安裝需教學紀錄。 | 是否需要影片或 checklist？ | Arrival proof、completion report、material usage、customer sign-off |  | M05,M09,M10,M15 | Engineering 可依此列草擬 screens/workflow，但 final gates 需依 營運 review status。 |
| Q062 | 誰確認結案 | 師傅 + 客服。 | Full 完整版本 建議：師傅提交完工，客服審核，客戶簽收，會計確認 AR。 | 客戶簽收是否也是結案 gate？ | Arrival proof、completion report、material usage、customer sign-off |  | M05,M09,M10,M15 | Engineering 可依此列草擬 screens/workflow，但 final gates 需依 營運 review status。 |
| Q063 | 客戶未回覆自動結案 | 24 小時。 | 採用 前期：標準案件 24 小時；客訴、保固、退款、爭議不得自動。 | 24 小時是否太短？ | Arrival proof、completion report、material usage、customer sign-off |  | M05,M09,M10,M15 | Engineering 可依此列草擬 screens/workflow，但 final gates 需依 營運 review status。 |
| G038 | 客戶現場不在場流程 | 前期 有 customer not onsite 流程。 | 師傅到場但客戶不在需記錄 GPS/時間/聯絡紀錄，決定取消費、車馬費或改期。 | 確認不在場收費規則。 | Onsite exception |  | M15,M11 | Engineering 可依此列草擬 screens/workflow，但 final gates 需依 營運 review status。 |

## M09 Evidence證據

> M09 Evidence & Document Control（證據與文件控管）

> 模組明細：營運原始輸入 + ERP Consultant 建議答案 + Coding Gate。

> 模組業務規則 / 建議預設答案

| Rule ID | 規則範圍 | 建議預設答案 | 負責人 | 是否阻擋 Coding | 營運 備註 | col_7 | col_8 | col_9 |
|---|---|---|---|---|---|---|---|---|
| BR-M09-01 | Evidence package 標準 | 每張完成 WorkOrder 應自動收集 before/after photos、quote、added-price approval、payment proof、signature、chat links。 | Compliance owner | 否 |  |  |  |  |
| BR-M09-02 | Evidence visibility | Brand、locksmith、accounting、customer 依角色與 case ownership 看到不同 evidence sets。 | Central admin / 主管 | 是 |  |  |  |  |
| BR-M09-03 | Retention policy | 預設照片保存 1 年；warranty/RMA/dispute evidence 保存至 warranty/dispute period 加核准 buffer。 | 主管 / Compliance owner | 是 |  |  |  |  |
| 模組 Q&A：營運原始輸入 + ERP 建議答案 |  |  |  |  |  |  |  |  |
| QID | Topic | 營運原始輸入 / 既有答案 | ERP Suggested Answer | 業務確認 | 流程 Gate / Coding Gate | 營運 備註 | 關聯模組 | AI Engineering / Coding 提醒 |
| Q022 | 安裝前照片 | 門正面、側邊/鎖舌、門框、舊鎖正背面、型號貼紙、現場環境，全部。 | Full 完整版本 設為安裝照片 checklist。 | 哪些照片缺少時禁止報價？ | Evidence package、media permissions、retention rule、audit proof |  | M03,M08,M13,M17 | Engineering 可依此列草擬 screens/workflow，但 final gates 需依 營運 review status。 |
| Q023 | 維修前照片影片 | 故障影片、錯誤訊息、App、鎖體、門狀態、電池電源；門打不開 100% 要影片。 | 維修 ProblemCard 要有 video gate，尤其無法開門。 | 影片可由客戶上傳 LINE 嗎？ | Evidence package、media permissions、retention rule、audit proof |  | M03,M08,M13,M17 | Engineering 可依此列草擬 screens/workflow，但 final gates 需依 營運 review status。 |
| Q024 | 影響派工照片 | 門型、舊鎖、門框、型號、施工空間、現場風險、門厚度，全部。 | 這些是 dispatch gate，決定師傅與材料。 | 缺照片是否允許人工 override？ | Evidence package、media permissions、retention rule、audit proof |  | M03,M08,M13,M17 | Engineering 可依此列草擬 screens/workflow，但 final gates 需依 營運 review status。 |
| Q025 | 完工照片 | 完工正面、門側邊、鎖舌/門框、App 綁定、配件/材料、客戶簽名，全部。 | 完工照片連到收款、保固、客訴。 | App 綁定照片是否所有品牌都需要？ | Evidence package、media permissions、retention rule、audit proof |  | M03,M08,M13,M17 | Engineering 可依此列草擬 screens/workflow，但 final gates 需依 營運 review status。 |
| Q027 | 保存多久 | 1 年，放在工單下，不顯示客戶姓名。 | Full 完整版本 採 1 年匿名展示；保固 / 客訴案件建議至少保留至保固或客訴結案後。 | 保固案件是否超過 1 年保存？ | Evidence package、media permissions、retention rule、audit proof |  | M03,M08,M13,M17 | Engineering 可依此列草擬 screens/workflow，但 final gates 需依 營運 review status。 |
| G021 | 證據包標準 | 前期 分別列出照片項目。 | 每張工單結案時自動形成 Evidence Package：施工前、施工後、簽名、加價、付款、聊天與用料。 | 確認哪些案件不需完整證據包。 | Completion control |  | M08,M13 | Engineering 可依此列草擬 screens/workflow，但 final gates 需依 營運 review status。 |
| G022 | 資料保存與匿名化政策 | 前期 提到照片保存 1 年。 | 一般照片 1 年；保固/RMA/爭議至少保存至結案後指定期間；展示給品牌或師傅時可遮蔽姓名。 | 確認保固與爭議案件保存年限。 | Privacy retention |  | M17,M13 | Engineering 可依此列草擬 screens/workflow，但 final gates 需依 營運 review status。 |

## M10 Product BOM

> M10 Product, BOM, Inventory & Serial Control（商品、BOM、庫存與序號）

> 模組明細：營運原始輸入 + ERP Consultant 建議答案 + Coding Gate。

> 模組業務規則 / 建議預設答案

| Rule ID | 規則範圍 | 建議預設答案 | 負責人 | 是否阻擋 Coding | 營運 備註 | col_7 | col_8 | col_9 |
|---|---|---|---|---|---|---|---|---|
| BR-M10-01 | Two-layer BOM | BOM 保持 Brand/Model -> material list；用 substitute-compatible fields，不增加更深層級。 | 庫存管理 / 品牌 | 否 |  |  |  |  |
| BR-M10-02 | Inventory ownership | Material owner 可為 brand、company、locksmith、customer；ownership 決定 billing、return、warranty responsibility。 | 會計 / 庫存管理 | 是 |  |  |  |  |
| BR-M10-03 | Serial control | 主鎖、保固件、高價電子件需 serial 綁定 WorkOrder / Device record。 | 品牌 / 主管 | 是 |  |  |  |  |
| 模組 Q&A：營運原始輸入 + ERP 建議答案 |  |  |  |  |  |  |  |  |
| QID | Topic | 營運原始輸入 / 既有答案 | ERP Suggested Answer | 業務確認 | 流程 Gate / Coding Gate | 營運 備註 | 關聯模組 | AI Engineering / Coding 提醒 |
| Q079 | 品牌型號資料庫 | 先做常用品牌：Chatlock、大內高手。 | Full 完整版本 仍可先從常用品牌建完整主檔，再逐步補全。 | 第一批品牌清單是否只有這兩個？ | Product master、BOM、material reservation、usage record、inventory exception |  | M06,M08,M12,M13 | Engineering 可依此列草擬 screens/workflow，但 final gates 需依 營運 review status。 |
| Q080 | 每品牌型號 BOM | 一定要；品牌、型號、相對應零件一覽表。 | Full 完整版本 BOM 是派工與用料基礎。 | BOM 誰維護？品牌商還是派工？ | Product master、BOM、material reservation、usage record、inventory exception |  | M06,M08,M12,M13 | Engineering 可依此列草擬 screens/workflow，但 final gates 需依 營運 review status。 |
| Q081 | BOM 料件 | 型號下有主鎖、鎖體、鎖芯、把手、門扣板、螺絲包、墊片、電池、感應卡、轉接件、工具；Two layers only。 | 採兩層：品牌型號 → 料件清單。符合你不想超過 2-3 層的要求。 | 是否需要第三層規格替代料？ | Product master、BOM、material reservation、usage record、inventory exception |  | M06,M08,M12,M13 | Engineering 可依此列草擬 screens/workflow，但 final gates 需依 營運 review status。 |
| Q082 | 料件歸屬 | 品牌商提供、師傅自備。 | Full 完整版本 還應允許公司提供、客戶自備，否則帳務無法完整。 | 公司是否也有庫存料？ | Product master、BOM、material reservation、usage record、inventory exception |  | M06,M08,M12,M13 | Engineering 可依此列草擬 screens/workflow，但 final gates 需依 營運 review status。 |
| Q083 | 派工前庫存確認 | 一定要，但不需阻擋，只需備著。 | Full 完整版本 採 soft gate：提醒與備料，不預設阻擋；高價/保固件可 hard gate。 | 哪些料件無料不得派？ | Product master、BOM、material reservation、usage record、inventory exception |  | M06,M08,M12,M13 | Engineering 可依此列草擬 screens/workflow，但 final gates 需依 營運 review status。 |
| Q084 | 現場用料登記 | 選料件、拍照；BOM 帶出，打勾，加照片。 | 正確。用料回報應由 BOM checklist 帶出。 | 是否需要填數量與金額？ | Product master、BOM、material reservation、usage record、inventory exception |  | M06,M08,M12,M13 | Engineering 可依此列草擬 screens/workflow，但 final gates 需依 營運 review status。 |
| Q085 | 序號綁工單 | 主鎖一定要、保固件要。 | 正確。高價件也建議綁序號。 | 鎖體 / 主機板是否要序號？ | Product master、BOM、material reservation、usage record、inventory exception |  | M06,M08,M12,M13 | Engineering 可依此列草擬 screens/workflow，但 final gates 需依 營運 review status。 |
| Q086 | 退換瑕疵料 | 師傅退回、品牌回收；師傅 + 派工人負責。 | Full 完整版本 需定義期限、照片、退回狀態。 | 幾天內退回？ | Product master、BOM、material reservation、usage record、inventory exception |  | M06,M08,M12,M13 | Engineering 可依此列草擬 screens/workflow，但 final gates 需依 營運 review status。 |
| Q087 | 材料費入帳 | 品牌吸收、公司吸收、月結扣款、向客戶收，all possible。 | Full 完整版本 需每個料件選費用歸屬，連到客戶帳、品牌帳或師傅帳。 | 預設材料費由誰負擔？ | Product master、BOM、material reservation、usage record、inventory exception |  | M06,M08,M12,M13 | Engineering 可依此列草擬 screens/workflow，但 final gates 需依 營運 review status。 |
| G034 | 庫存位置與保管責任 | 前期 有 material owner。 | 料件可在品牌、公司倉、師傅車上、客戶現場；每個位置要有保管責任和轉移紀錄。 | 確認公司是否有中央庫存。 | Inventory control |  | M07,M12 | Engineering 可依此列草擬 screens/workflow，但 final gates 需依 營運 review status。 |
| G035 | 替代料與相容性 | 前期 提到 two layers only。 | 維持兩層 BOM，但可用相容/替代料欄位，不新增深層結構。 | 確認是否允許替代料。 | BOM control |  | M03,M08 | Engineering 可依此列草擬 screens/workflow，但 final gates 需依 營運 review status。 |

## M11 AR退款

> M11 Customer AR, Payment & Refund（客戶 AR、付款與退款）

> 模組明細：營運原始輸入 + ERP Consultant 建議答案 + Coding Gate。

> 模組業務規則 / 建議預設答案

| Rule ID | 規則範圍 | 建議預設答案 | 負責人 | 是否阻擋 Coding | 營運 備註 | col_7 | col_8 | col_9 |
|---|---|---|---|---|---|---|---|---|
| BR-M11-01 | Payment reconciliation | 每筆 payment 必須 reconcile 到 WorkOrder、deposit、balance、travel fee、refund 或 RMA adjustment。 | 會計 | 是 |  |  |  |  |
| BR-M11-02 | Refund approval levels | Refund 需依金額分層 approval；建議預設：refund > NTD 100,000 需 operations + finance double sign；partial refund 必須分類 product、labor、material、travel、inspection。 | 會計 / 主管 | 是 |  |  |  |  |
| BR-M11-03 | Invoice responsibility | Invoice issuer 依 B2C、B2B brand、builder project 或 platform collection model 決定。 | 會計 | 是 |  |  |  |  |
| 模組 Q&A：營運原始輸入 + ERP 建議答案 |  |  |  |  |  |  |  |  |
| QID | Topic | 營運原始輸入 / 既有答案 | ERP Suggested Answer | 業務確認 | 流程 Gate / Coding Gate | 營運 備註 | 關聯模組 | AI Engineering / Coding 提醒 |
| Q088 | 付款方式 | 轉帳、現金、LINE Pay、平台代收、師傅代收；前文另有信用卡與 web link。 | Full 完整版本 支援全部：信用卡、轉帳末五碼、現金、LINE Pay、平台代收、師傅代收、品牌月結、付款連結。 | 信用卡由平台還是師傅現場收？ | Customer ledger、payment proof、AR status、refund request、invoice requirement |  | M04,M12,M15 | Engineering 必須建模 approvals 與 audit trail；不可 hardcode money 或 refund rules。 |
| Q089 | 事前付款 | 高金額、急件、新客戶，需在 quotation 定義。 | 正確。付款條件是 quote rule。 | 高金額門檻是多少？ | Customer ledger、payment proof、AR status、refund request、invoice requirement |  | M04,M12,M15 | Engineering 必須建模 approvals 與 audit trail；不可 hardcode money 或 refund rules。 |
| Q090 | 事後付款 | 熟客、品牌月結、低金額、保固，需在 internal quotation 定義。 | 正確。事後付款要連未收款報表。 | 熟客標準？ | Customer ledger、payment proof、AR status、refund request、invoice requirement |  | M04,M12,M15 | Engineering 必須建模 approvals 與 audit trail；不可 hardcode money 或 refund rules。 |
| Q092 | 取消費 | 仍需決策。 | Full 完整版本 必須主管拍板：付款後、當日、師傅出發後、到場後的取消費。 | 請主管定金額。 | Customer ledger、payment proof、AR status、refund request、invoice requirement |  | M04,M12,M15 | Engineering 必須建模 approvals 與 audit trail；不可 hardcode money 或 refund rules。 |
| Q094 | 退款核准 | 仍需決策。 | 建議依金額分層：客服主管、主管、會計 / 雙簽、品牌商參與。 | 退款門檻要定。 | Customer ledger、payment proof、AR status、refund request、invoice requirement |  | M04,M12,M15 | Engineering 必須建模 approvals 與 audit trail；不可 hardcode money 或 refund rules。 |
| Q095 | 部分退款 | 人工計算。 | Full 完整版本 可以人工計算，但系統需欄位：退產品費、工資、材料、扣車馬、扣檢測。 | 哪些項目永不退款？ | Customer ledger、payment proof、AR status、refund request、invoice requirement |  | M04,M12,M15 | Engineering 必須建模 approvals 與 audit trail；不可 hardcode money 或 refund rules。 |
| Q099 | 發票 | 依案件；B2C 平台，B2B 派工人。 | 採用。Full 完整版本 發票規則按 B2C / B2B / 品牌 / 建商切分。 | 建商專案誰開票？ | Customer ledger、payment proof、AR status、refund request、invoice requirement |  | M04,M12,M15 | Engineering 必須建模 approvals 與 audit trail；不可 hardcode money 或 refund rules。 |
| G027 | 付款 reconciliation | 前期 有付款方式。 | 每筆付款要核銷到工單/訂金/尾款/退款；末五碼和付款連結要能對帳。 | 確認會計每日或每週核銷。 | AR control |  | M12 | Engineering 必須建模 approvals 與 audit trail；不可 hardcode money 或 refund rules。 |

## M12 AP月結

> M12 Technician / Partner AP & Monthly Settlement（師傅/Partner AP 與月結）

> 模組明細：營運原始輸入 + ERP Consultant 建議答案 + Coding Gate。

> 模組業務規則 / 建議預設答案

| Rule ID | 規則範圍 | 建議預設答案 | 負責人 | 是否阻擋 Coding | 營運 備註 | col_7 | col_8 | col_9 |
|---|---|---|---|---|---|---|---|---|
| BR-M12-01 | 分開 AP ledgers | Technician AP、dispatcher commission、brand settlement、partner settlement 必須分開 ledger / report。 | 會計 | 是 |  |  |  |  |
| BR-M12-02 | 代收款抵扣 | Technician cash collection 抵扣 monthly payable；未繳回代收款可 hold payout。 | 會計 / 派工主管 | 是 |  |  |  |  |
| BR-M12-03 | Dispute withholding | 除非疑似 fraud 或 severe misconduct，只應暫扣 disputed amount。 | 主管 / 會計 | 是 |  |  |  |  |
| 模組 Q&A：營運原始輸入 + ERP 建議答案 |  |  |  |  |  |  |  |  |
| QID | Topic | 營運原始輸入 / 既有答案 | ERP Suggested Answer | 業務確認 | 流程 Gate / Coding Gate | 營運 備註 | 關聯模組 | AI Engineering / Coding 提醒 |
| Q035 | 客戶付款與師傅工資 | 一定分開；付款支援匯款末五碼、現金、現場信用卡、訂金；師傅工資月結，需拆代收產品款、代工費、加班費、異常處理費。 | Full 完整版本 必須雙 ledger：Customer AR 與 Technician AP。 | 師傅代收產品款如何與工資抵扣？ | Technician statement、partner statement、brand settlement、payable amount |  | M07,M11,M14 | Engineering 必須建模 approvals 與 audit trail；不可 hardcode money 或 refund rules。 |
| Q036 | 是否 Uber 兩條帳 | 需要三條帳以上：平台代收、師傅請款、品牌、派工人月結。 | 正確。Full 完整版本 至少 Customer Ledger、Technician Ledger、Brand / Dispatch Partner Ledger。 | 派工人月結是否與師傅月結不同表？ | Technician statement、partner statement、brand settlement、payable amount |  | M07,M11,M14 | Engineering 必須建模 approvals 與 audit trail；不可 hardcode money 或 refund rules。 |
| Q091 | 師傅代收 | 可以；只限現金、特定師傅、低金額可；月結。 | Full 完整版本 需代收核銷與月結抵扣。 | 代收上限金額？ | Technician statement、partner statement、brand settlement、payable amount |  | M07,M11,M14 | Engineering 必須建模 approvals 與 audit trail；不可 hardcode money 或 refund rules。 |
| Q093 | 車馬費 | 師傅到場才收；師傅 + 派工人 + 客戶。 | Full 完整版本 可定為到場費 / 車馬費，需明確誰收誰得款。 | 車馬費固定還是依地區？ | Technician statement、partner statement、brand settlement、payable amount |  | M07,M11,M14 | Engineering 必須建模 approvals 與 audit trail；不可 hardcode money 或 refund rules。 |
| Q096 | 客訴期間付款給師傅 | 只暫停爭議金額。 | 正確。避免整單暫扣傷害師傅關係。 | 責任未定多久後主管介入？ | Technician statement、partner statement、brand settlement、payable amount |  | M07,M11,M14 | Engineering 必須建模 approvals 與 audit trail；不可 hardcode money 或 refund rules。 |
| Q097 | 師傅月結欄位 | 工單號、日期、服務類型、工資、加價、材料、代收、扣款、暫扣。 | 建議加備註、客訴 / 返修、實撥金額。 | 師傅是否可下載 Excel？ | Technician statement、partner statement、brand settlement、payable amount |  | M07,M11,M14 | Engineering 必須建模 approvals 與 audit trail；不可 hardcode money 或 refund rules。 |
| Q098 | 品牌商月結欄位 | 填入類似師傅月結欄位。 | Full 完整版本 應另定品牌月結：工單號、品牌、型號、服務、品牌價、材料、退款、客訴、發票。 | 品牌商是否看工資？ | Technician statement、partner statement、brand settlement、payable amount |  | M07,M11,M14 | Engineering 必須建模 approvals 與 audit trail；不可 hardcode money 或 refund rules。 |
| G028 | 代收抵扣規則 | 前期 提到師傅代收 / monthly。 | 師傅代收客戶款項要進代收 ledger，月結時抵扣，逾期未繳或證據不足需暫扣。 | 確認代收繳回期限。 | Settlement control |  | M11,M07 | Engineering 必須建模 approvals 與 audit trail；不可 hardcode money 或 refund rules。 |
| G029 | 派工者 commission | 前期 提到 dispatcher monthly settlement。 | 派工者、合作派工廠商、平台抽成需獨立月結，不和師傅工資混在一起。 | 確認派工者抽成公式。 | Partner settlement |  | M14 | Engineering 必須建模 approvals 與 audit trail；不可 hardcode money 或 refund rules。 |

## M13 RMA品質

> M13 Complaint, Warranty, RMA & Quality（客訴、保固、RMA 與品質）

> 模組明細：營運原始輸入 + ERP Consultant 建議答案 + Coding Gate。

> 模組業務規則 / 建議預設答案

| Rule ID | 規則範圍 | 建議預設答案 | 負責人 | 是否阻擋 Coding | 營運 備註 | col_7 | col_8 | col_9 |
|---|---|---|---|---|---|---|---|---|
| BR-M13-01 | RMA 獨立案件 | Complaint / warranty 必須是獨立 RMA case，並連結原 customer/site/device/WorkOrder/payment。 | 客服主管 | 否 |  |  |  |  |
| BR-M13-02 | Responsibility matrix | RMA 必須分類 responsibility：product/brand、installation/technician、customer use、environment、quote/customer service、dispatch、material delay。 | 客服主管 / 品牌 | 是 |  |  |  |  |
| BR-M13-03 | Quality feedback loop | Closed RMA 回寫 technician rating、brand/product quality、quote rule 與 dispatch eligibility。 | 客服主管 / BI owner | 部分 |  |  |  |  |
| 模組 Q&A：營運原始輸入 + ERP 建議答案 |  |  |  |  |  |  |  |  |
| QID | Topic | 營運原始輸入 / 既有答案 | ERP Suggested Answer | 業務確認 | 流程 Gate / Coding Gate | 營運 備註 | 關聯模組 | AI Engineering / Coding 提醒 |
| Q054 | 客訴售後狀態 | 一定獨立；獨立案件，但連同一住址與原工單可查詢。 | 正確。Full 完整版本 使用 RMA / Complaint Case。 | RMA 是否連原 ProblemCard？ | RMA case、warranty decision、liability split、corrective action、quality record |  | M02,M09,M10,M15 | Engineering 可依此列草擬 screens/workflow，但 final gates 需依 營運 review status。 |
| Q100 | 客訴獨立案件 | 一定要，RMA + date / month serial number。 | 正確。Full 完整版本 建立 RMA 售後案件編號。 | RMA 格式：RMA-YYYYMM-流水號？ | RMA case、warranty decision、liability split、corrective action、quality record |  | M02,M09,M10,M15 | Engineering 可依此列草擬 screens/workflow，但 final gates 需依 營運 review status。 |
| Q101 | 客訴分類 | 施工品質、產品故障、報價爭議、師傅態度、延遲、未完成、教學不足、付款爭議、保固爭議，全部。 | 正確。分類連責任矩陣。 | 是否增加「缺料延誤」分類？ | RMA case、warranty decision、liability split、corrective action、quality record |  | M02,M09,M10,M15 | Engineering 可依此列草擬 screens/workflow，但 final gates 需依 營運 review status。 |
| Q102 | 責任初判 | 產品-品牌商；安裝-師傅/品牌商/派工人；客戶使用-品牌商；環境-師傅；客服報價-品牌商/派工人；派工錯誤-派工人/平台；缺料延誤-品牌商/師傅。 | Full 完整版本 需責任矩陣，避免客訴只靠人工印象。 | 缺料延誤優先責任怎麼判？ | RMA case、warranty decision、liability split、corrective action、quality record |  | M02,M09,M10,M15 | Engineering 可依此列草擬 screens/workflow，但 final gates 需依 營運 review status。 |
| Q103 | 產品問題 | 依序：品牌商、公司、師傅、客戶、依保固。 | 採用。產品問題先看品牌與保固，再看公司和師傅。 | 公司何時吸收？ | RMA case、warranty decision、liability split、corrective action、quality record |  | M02,M09,M10,M15 | Engineering 可依此列草擬 screens/workflow，但 final gates 需依 營運 review status。 |
| Q104 | 安裝問題 | 原師傅、品牌商、客服、依原因。 | Full 完整版本 預設原師傅負責，若品牌安裝規範問題或客服報價錯誤則轉責任。 | 原師傅是否一定返修？ | RMA case、warranty decision、liability split、corrective action、quality record |  | M02,M09,M10,M15 | Engineering 可依此列草擬 screens/workflow，但 final gates 需依 營運 review status。 |
| Q105 | 客戶使用問題 | 收教學費、收車馬費、首次免費、保固內免費，給 price range。 | Full 完整版本 建議按保固 / 首次 / 是否到場分費用。 | 首次免費限幾天內？ | RMA case、warranty decision、liability split、corrective action、quality record |  | M02,M09,M10,M15 | Engineering 可依此列草擬 screens/workflow，但 final gates 需依 營運 review status。 |
| Q106 | 客訴結果 | 返修、折讓、退款、換貨、重新派工、拒絕客訴、升級主管；都可能影響原工單金額。 | 正確。每個結果要連帳務調整。 | 哪些結果需要主管核准？ | RMA case、warranty decision、liability split、corrective action、quality record |  | M02,M09,M10,M15 | Engineering 可依此列草擬 screens/workflow，但 final gates 需依 營運 review status。 |
| Q107 | 保固期判斷 | 購買日期 + 序號。 | Full 完整版本 採購買日期 + 序號；建商案可能另有點交日期，需要規則補充。 | 建商案是否採點交日？ | RMA case、warranty decision、liability split、corrective action、quality record |  | M02,M09,M10,M15 | Engineering 可依此列草擬 screens/workflow，但 final gates 需依 營運 review status。 |
| Q108 | 保固返修派工 | 優先原師傅。 | 採用，但若原師傅被客訴或客戶拒絕，派資深師傅。 | 例外條件？ | RMA case、warranty decision、liability split、corrective action、quality record |  | M02,M09,M10,M15 | Engineering 可依此列草擬 screens/workflow，但 final gates 需依 營運 review status。 |
| Q109 | 客訴證據 | 完工照、聊天紀錄、報價、加價確認、客戶簽名、付款紀錄。 | 建議加施工前照片與品牌判斷，否則責任不足。 | 缺施工前照是否能扣師傅？ | RMA case、warranty decision、liability split、corrective action、quality record |  | M02,M09,M10,M15 | Engineering 可依此列草擬 screens/workflow，但 final gates 需依 營運 review status。 |
| G030 | 品質責任回寫 | 前期 有 responsibility matrix。 | RMA/客訴結案後需回寫師傅、品牌、產品、客服報價或派工錯誤，影響 KPI 與派工排序。 | 確認責任回寫是否影響師傅評分。 | Quality feedback |  | M07,M19 | Engineering 可依此列草擬 screens/workflow，但 final gates 需依 營運 review status。 |

## M14 Partner Portal

> M14 Brand / Dealer / Builder Partner Portal（品牌/經銷/建商 Partner Portal）

> 模組明細：營運原始輸入 + ERP Consultant 建議答案 + Coding Gate。

> 模組業務規則 / 建議預設答案

| Rule ID | 規則範圍 | 建議預設答案 | 負責人 | 是否阻擋 Coding | 營運 備註 | col_7 | col_8 | col_9 |
|---|---|---|---|---|---|---|---|---|
| BR-M14-01 | Partner account scope | Brand / dealer / builder users 只能依 contract 查看自己的 cases、projects、settlement。 | Partner manager / 主管 | 是 |  |  |  |  |
| BR-M14-02 | Builder project setup | Builder projects 必須有 site group、unit list、handover/warranty date、contract price、SLA、invoice rules。 | Partner manager / 會計 | 是 |  |  |  |  |
| BR-M14-03 | Partner-created case | 除 contract 另有規定，Partner-created cases 仍需通過平台 ProblemCard、quote/payment、dispatch gates。 | Partner manager | 部分 |  |  |  |  |
| 模組 Q&A：營運原始輸入 + ERP 建議答案 |  |  |  |  |  |  |  |  |
| QID | Topic | 營運原始輸入 / 既有答案 | ERP Suggested Answer | 業務確認 | 流程 Gate / Coding Gate | 營運 備註 | 關聯模組 | AI Engineering / Coding 提醒 |
| Q003 | 參與方 | 以上全部。 | Full 完整版本 支援客戶、AI、真人客服、派工、師傅、品牌商、會計、主管、經銷商、社區 / 建商。 | 是否有第三方派工廠商角色？ | Partner account、brand case、project contract、B2B settlement rule |  | M01,M11,M12,M17 | Engineering 可依此列草擬 screens/workflow，但 final gates 需依 營運 review status。 |
| Q037 | 品牌案報價對象 | 依案件類型；客戶只看總額，品牌或派工價可能是 B2B，品牌對師傅、鎖店對師傅。 | Full 完整版本 需支援 B2C price、B2B brand price、internal technician cost。 | 品牌商可見哪一種價格？ | Partner account、brand case、project contract、B2B settlement rule |  | M01,M11,M12,M17 | Engineering 可依此列草擬 screens/workflow，但 final gates 需依 營運 review status。 |
| G007 | 品牌商帳號與資料邊界 | 前期 提到 brand 可能可看全部，但 ERP 風險高。 | 品牌商只看自己品牌案件、保固、照片、RMA、月結；不能看其他品牌、內部工資、平台毛利。 | 確認品牌商資料權限邊界。 | Authorization gate |  | M17,M12 | Engineering 可依此列草擬 screens/workflow，但 final gates 需依 營運 review status。 |
| G008 | 經銷商/門市入口 | 已部分涵蓋於 intake。 | 經銷商與門市可代客建案，但要標示來源、佣金/責任、是否可看後續狀態。 | 確認經銷商是否可自行登入。 | Partner case gate |  | M01,M12 | Engineering 可依此列草擬 screens/workflow，但 final gates 需依 營運 review status。 |
| G009 | 建商專案合約規則 | 已部分涵蓋於 project type。 | 建商案需專案主檔：案場、戶數、點交日、保固期、月結/發票/責任人。 | 確認建商案與品牌案是否分開流程。 | B2B project gate |  | M02,M13,M12 | Engineering 可依此列草擬 screens/workflow，但 final gates 需依 營運 review status。 |

## M15 異常核准

> M15 Exception, Approval & Risk Control（異常、核准與風險控制）

> 模組明細：營運原始輸入 + ERP Consultant 建議答案 + Coding Gate。

> 模組業務規則 / 建議預設答案

| Rule ID | 規則範圍 | 建議預設答案 | 負責人 | 是否阻擋 Coding | 營運 備註 | col_7 | col_8 | col_9 |
|---|---|---|---|---|---|---|---|---|
| BR-M15-01 | Exception return path | 每個 exception 必須選一個 return path：continue、requote、reschedule、reassign、new WorkOrder、cancel、refund、RMA、dispute。 | 主管 / 派工主管 | 是 |  |  |  |  |
| BR-M15-02 | Approval inbox | Supervisor / accounting / brand approvals 應進 approval inbox，不應只留在 chat。 | Central admin / 主管 | 是 |  |  |  |  |
| BR-M15-03 | High-risk stop rule | Warranty unclear、brand responsibility、safety risk、customer refuses added price、high-risk drilling/opening 必須 pause 到核准後才繼續。 | 主管 | 是 |  |  |  |  |
| 模組 Q&A：營運原始輸入 + ERP 建議答案 |  |  |  |  |  |  |  |  |
| QID | Topic | 營運原始輸入 / 既有答案 | ERP Suggested Answer | 業務確認 | 流程 Gate / Coding Gate | 營運 備註 | 關聯模組 | AI Engineering / Coding 提醒 |
| Q011 | 流程斷點 | 全部：資料漏填、報價不清、找不到師傅、未回覆、缺料、付款不清、客訴未追、月結不清；現場問題不清，客戶未回必要問題，影響找對材料與師傅。 | 這些斷點對應 Full 完整版本 的必做控制點：ProblemCard 必填、照片 gate、報價 gate、派工 SLA、BOM gate、付款 ledger、客訴 RMA、月結。 | 最痛的前三個斷點是什麼？ | Exception case、approval task、return path、risk flag、liability reason |  | M04,M05,M08,M11,M13 | Engineering 必須建模 approvals 與 audit trail；不可 hardcode money 或 refund rules。 |
| Q047 | 延遲 / 客戶不在 | 師傅延遲需直接打給客戶並在系統回報；急件需另派；客戶不在且師傅確認客戶無法到場，工單取消。 | Full 完整版本 需補明取消費 / 車馬費 / 是否新工單。 | 客戶不在是否收車馬費？ | Exception case、approval task、return path、risk flag、liability reason |  | M04,M05,M08,M11,M13 | Engineering 必須建模 approvals 與 audit trail；不可 hardcode money 或 refund rules。 |
| Q053 | 異常狀態 | 現場異常、待客戶確認、待 locksmith 確認、待品牌確認、缺料、改期、取消、退款、爭議；異常等師傅、客戶、派工人確定，可能 cancel 並新建工單。 | Full 完整版本 建議異常不要全部自動 cancel；應先判斷 return path：回施工、改期、新工單、取消、退款、爭議。 | 哪些異常一定取消重開？ | Exception case、approval task、return path、risk flag、liability reason |  | M04,M05,M08,M11,M13 | Engineering 必須建模 approvals 與 audit trail；不可 hardcode money 或 refund rules。 |
| Q064 | 異常分類 | 一定要，需要 identify。 | 正確。Full 完整版本 建立 exception taxonomy。 | 是否需要異常代碼？ | Exception case、approval task、return path、risk flag、liability reason |  | M04,M05,M08,M11,M13 | Engineering 必須建模 approvals 與 audit trail；不可 hardcode money 或 refund rules。 |
| Q065 | 常見異常 | 門型不符、型號不符、舊鎖拆不下、額外開孔、缺料、客戶不在、產品故障、保固不明、客戶改需求，全部。 | 正確。另建議加入付款不符、師傅延遲、客戶未回覆。 | 是否增加付款不符？ | Exception case、approval task、return path、risk flag、liability reason |  | M04,M05,M08,M11,M13 | Engineering 必須建模 approvals 與 audit trail；不可 hardcode money 或 refund rules。 |
| Q066 | 異常回報 | 1 選異常類型、2 填原因、3 填加價、4 打電話、5 等客服確認。 | Full 完整版本 應固定這個順序，並加照片。 | 是否所有異常都要照片？ | Exception case、approval task、return path、risk flag、liability reason |  | M04,M05,M08,M11,M13 | Engineering 必須建模 approvals 與 audit trail；不可 hardcode money 或 refund rules。 |
| Q067 | 可繼續施工 | 師傅及客戶同意即可：客戶同意、加價同意。 | ERP 風險註解：低風險可師傅+客戶；高金額 / 品牌 / 保固需客服或主管。 | 哪些異常需主管？ | Exception case、approval task、return path、risk flag、liability reason |  | M04,M05,M08,M11,M13 | Engineering 必須建模 approvals 與 audit trail；不可 hardcode money 或 refund rules。 |
| Q068 | 必須暫停 | 保固不明、產品故障、高風險開孔、客戶不同意、品牌責任、安全風險，全部；師傅聯絡客服確認後 stop and cancel work order。 | Full 完整版本 不應一律 cancel；先暫停，決定改期、重報價、取消或新工單。 | 暫停後是否自動取消？ | Exception case、approval task、return path、risk flag、liability reason |  | M04,M05,M08,M11,M13 | Engineering 必須建模 approvals 與 audit trail；不可 hardcode money 或 refund rules。 |
| Q069 | 加價前確認 | 師傅自行決定 + 客戶 + 客服。 | 建議表述為：師傅提出加價，客戶確認，客服留紀錄；師傅不可單獨決定最終收款。 | 加價是否需客服每次確認？ | Exception case、approval task、return path、risk flag、liability reason |  | M04,M05,M08,M11,M13 | Engineering 必須建模 approvals 與 audit trail；不可 hardcode money 或 refund rules。 |
| Q070 | 加價證據 | 客戶簽名。 | 正確。Full 完整版本 也可接受 LINE 按鈕 / 電子簽名。 | 電話確認是否可用？ | Exception case、approval task、return path、risk flag、liability reason |  | M04,M05,M08,M11,M13 | Engineering 必須建模 approvals 與 audit trail；不可 hardcode money 或 refund rules。 |
| Q071 | 客戶不同意加價 | 收檢測費、車馬費、客服協調、改期。 | Full 完整版本 需依責任歸屬決定收費；客戶原因可收，前期判斷錯誤需主管裁決。 | 檢測費 / 車馬費金額？ | Exception case、approval task、return path、risk flag、liability reason |  | M04,M05,M08,M11,M13 | Engineering 必須建模 approvals 與 audit trail；不可 hardcode money 或 refund rules。 |
| Q072 | 減價折讓 | 師傅 + 派工，告知客服。 | ERP 風險註解：折讓會影響帳務，必須客服 / 派工留紀錄，超過門檻主管核准。 | 師傅可折讓上限？ | Exception case、approval task、return path、risk flag、liability reason |  | M04,M05,M08,M11,M13 | Engineering 必須建模 approvals 與 audit trail；不可 hardcode money 或 refund rules。 |
| G025 | Approval task inbox | 前期 有 supervisor decisions，但未定義 approval queue。 | 所有需主管/會計/品牌核准事項應進 approval inbox，不散落在聊天。 | 確認各 approval SLA。 | Approval control |  | M17,M18 | Engineering 必須建模 approvals 與 audit trail；不可 hardcode money 或 refund rules。 |
| G026 | 異常 return path | 前期 已指出不一定要 cancel。 | 異常需固定 return path：繼續施工、重報價、改期、改派、新工單、取消、退款、RMA、爭議。 | 確認異常 return path 清單。 | Exception control |  | M05,M08 | Engineering 必須建模 approvals 與 audit trail；不可 hardcode money 或 refund rules。 |

## M16 Comms通知

> M16 Communication, Notification & Conversation（溝通、通知與對話）

> 模組明細：營運原始輸入 + ERP Consultant 建議答案 + Coding Gate。

> 模組業務規則 / 建議預設答案

| Rule ID | 規則範圍 | 建議預設答案 | 負責人 | 是否阻擋 Coding | 營運 備註 | col_7 | col_8 | col_9 |
|---|---|---|---|---|---|---|---|---|
| BR-M16-01 | Conversation visibility | Customer、technician、brand、accounting、internal notes 必須依 visibility rules 分開。 | Central admin / 客服主管 | 是 |  |  |  |  |
| BR-M16-02 | 電話確認限制 | Phone calls 可記錄結果，但 price/time/refund/cancel confirmation 必須寫入 system 或 LINE。 | 客服主管 | 部分 |  |  |  |  |
| BR-M16-03 | Notification templates | Quote、photo request、payment、dispatch、delay、extra price、completion、RMA、refund 需要 approved templates。 | System admin / 客服主管 | 是 |  |  |  |  |
| 模組 Q&A：營運原始輸入 + ERP 建議答案 |  |  |  |  |  |  |  |  |
| QID | Topic | 營運原始輸入 / 既有答案 | ERP Suggested Answer | 業務確認 | 流程 Gate / Coding Gate | 營運 備註 | 關聯模組 | AI Engineering / Coding 提醒 |
| Q073 | 工單溝通空間 | 未填。 | Full 完整版本 需要客戶頻道、內部派工頻道、品牌商頻道、會計備註、售後客訴頻道。 | 是否仍保留 LINE 群同步？ | Conversation record、notification task、message visibility rule |  | M01,M03,M05,M17 | Engineering 可依此列草擬 screens/workflow，但 final gates 需依 營運 review status。 |
| Q074 | 客戶可否聯絡師傅 | 可以電話。 | 採用，但改價、改期、取消必須回系統記錄。 | 客戶可否加師傅 LINE？ | Conversation record、notification task、message visibility rule |  | M01,M03,M05,M17 | Engineering 可依此列草擬 screens/workflow，但 final gates 需依 營運 review status。 |
| Q075 | 品牌商看聊天 | 只看品牌案件。 | 正確。品牌商不可看其他品牌或內部成本。 | 品牌商可看客戶聊天全文嗎？ | Conversation record、notification task、message visibility rule |  | M01,M03,M05,M17 | Engineering 可依此列草擬 screens/workflow，但 final gates 需依 營運 review status。 |
| Q076 | 自動寫入工單訊息 | 報價只寫客戶實收，不寫 internal quotation；付款、派工、接單、改期、異常、加價、完工、客訴、退款都寫入。 | 正確。Quote note 要區分 external price 與 internal cost。 | 客戶端是否可查所有歷史？ | Conversation record、notification task、message visibility rule |  | M01,M03,M05,M17 | Engineering 可依此列草擬 screens/workflow，但 final gates 需依 營運 review status。 |
| Q078 | 通知 | 補照片、報價確認、付款、派工、接單逾時、改期、延遲、完工、客訴、月結；每月 5 號通知派工人與客服，師傅下載月結單。 | Full 完整版本 通知中心需按角色推送。 | 月結通知日是否固定每月 5 號？ | Conversation record、notification task、message visibility rule |  | M01,M03,M05,M17 | Engineering 可依此列草擬 screens/workflow，但 final gates 需依 營運 review status。 |
| G023 | 通知模板與語氣 | 前期 列出通知項目。 | 報價、付款、補照片、派工、延遲、加價、完工、客訴、退款需有模板和多語/品牌版。 | 確認模板誰批准。 | Comms setup |  | M18,M14 | Engineering 可依此列草擬 screens/workflow，但 final gates 需依 營運 review status。 |
| G024 | 電話紀錄與口頭確認 | 前期 允許電話聯絡。 | 電話聯絡應記錄結果；涉及改價、改期、取消、退款不可只靠口頭，需補 LINE/系統確認。 | 確認口頭確認可否作為正式證據。 | Evidence gate |  | M09,M15 | Engineering 可依此列草擬 screens/workflow，但 final gates 需依 營運 review status。 |

## M17 Auth Audit

> M17 Authorization, Security & Audit（權限、安全與 Audit）

> 模組明細：營運原始輸入 + ERP Consultant 建議答案 + Coding Gate。

> 模組業務規則 / 建議預設答案

| Rule ID | 規則範圍 | 建議預設答案 | 負責人 | 是否阻擋 Coding | 營運 備註 | col_7 | col_8 | col_9 |
|---|---|---|---|---|---|---|---|---|
| BR-M17-01 | Can view / edit / approve matrix | 每個角色必須拆成 can-view、can-edit、can-approve；除 audited admin 外，不接受 all access。 | Central admin / 主管 | 是 |  |  |  |  |
| BR-M17-02 | Segregation of duties | 同一 user 不應在無 second approval 下同時 create、approve、reconcile refund。 | 會計 / 主管 | 是 |  |  |  |  |
| BR-M17-03 | Temporary IT support access | IT support sensitive access 必須 time-limited、reason-coded、audit logged。 | IT admin / 主管 | 是 |  |  |  |  |
| 模組 Q&A：營運原始輸入 + ERP 建議答案 |  |  |  |  |  |  |  |  |
| QID | Topic | 營運原始輸入 / 既有答案 | ERP Suggested Answer | 業務確認 | 流程 Gate / Coding Gate | 營運 備註 | 關聯模組 | AI Engineering / Coding 提醒 |
| Q026 | 照片可見權限 | 依權限。 | 正確。客戶、師傅、品牌、會計看到的照片不同。 | 品牌商可否看客戶家中環境照？ | Permission matrix、approval limit、audit event、data access boundary |  | M09,M11,M14,M18 | Engineering 必須等 role/config/AI governance 確認後，才能做最終 workflow automation。 |
| Q042 | 接單前可見 | 區域、完整地址、照片、品牌型號、報價、預約時間、付款狀態、客戶備註；另含 internal quotation + external customer total。 | 權限要分接單前/後。建議接單前看區域與摘要，接單後看完整地址。 | 師傅接單前是否能看完整地址？ | Permission matrix、approval limit、audit event、data access boundary |  | M09,M11,M14,M18 | Engineering 必須等 role/config/AI governance 確認後，才能做最終 workflow automation。 |
| Q055 | 狀態記錄 | 全部要 audit log。 | 正確。所有狀態變更需記錄操作者與時間。 | Audit 保存多久？ | Permission matrix、approval limit、audit event、data access boundary |  | M09,M11,M14,M18 | Engineering 必須等 role/config/AI governance 確認後，才能做最終 workflow automation。 |
| Q077 | 內部資訊 | 內部成本、師傅工資、品牌成本、責任、折讓、會計備註全內部；客戶只看工單 + 客戶實收金額 + 時間 + 簽收。 | 這是 Full 完整版本 權限核心。 | 師傅可否看客戶實收？ | Permission matrix、approval limit、audit event、data access boundary |  | M09,M11,M14,M18 | Engineering 必須等 role/config/AI governance 確認後，才能做最終 workflow automation。 |
| Q110 | 角色權限 | 客服 all、派工 all、師傅 can only modify price、品牌商 all、會計 all、主管 all、管理員 all。 | ERP 風險註解：Full 完整版本 可以支援所有角色，但不建議品牌商 / 師傅 all access。需改成可看 / 可改矩陣。 | 品牌商 all 是否真的允許？ | Permission matrix、approval limit、audit event、data access boundary |  | M09,M11,M14,M18 | Engineering 必須等 role/config/AI governance 確認後，才能做最終 workflow automation。 |
| Q111 | 品牌商資料 | all。 | 風險很高。建議品牌商只看品牌案件、照片、保固、客訴、月結，不看內部價格與其他品牌。 | 品牌商可否看內部工資？ | Permission matrix、approval limit、audit event、data access boundary |  | M09,M11,M14,M18 | Engineering 必須等 role/config/AI governance 確認後，才能做最終 workflow automation。 |
| Q112 | 師傅資料 | all。 | 風險高。建議師傅看自己案件、客戶必要資料、照片、報價總額、付款狀態、月結，不看品牌成本與他人案件。 | 師傅可否看內部報價？ | Permission matrix、approval limit、audit event、data access boundary |  | M09,M11,M14,M18 | Engineering 必須等 role/config/AI governance 確認後，才能做最終 workflow automation。 |
| Q113 | 會計資料 | all。 | 會計可看財務全資料，但不應隨意改施工流程狀態。 | 會計可改工單狀態嗎？ | Permission matrix、approval limit、audit event、data access boundary |  | M09,M11,M14,M18 | Engineering 必須等 role/config/AI governance 確認後，才能做最終 workflow automation。 |
| Q114 | 稽核事件 | all。 | 正確。所有報價、改價、退款、派工、改派、取消、客訴責任、月結、權限變更都 audit。 | 保存期限？ | Permission matrix、approval limit、audit event、data access boundary |  | M09,M11,M14,M18 | Engineering 必須等 role/config/AI governance 確認後，才能做最終 workflow automation。 |
| G013 | 職責分離 SoD | 前期 無固定答案 | 同一人不應同時建立退款、核准退款、完成付款核銷；高風險操作需主管/會計雙簽。 | 確認退款和折讓是否採雙簽。 | Financial control |  | M11,M15 | Engineering 必須等 role/config/AI governance 確認後，才能做最終 workflow automation。 |
| G014 | IT user 與 support access | 前期 無固定答案 | IT support 可協助查問題，但預設不看客戶隱私或財務明細；臨時權限需有效期限與 audit。 | 確認 IT 維運權限和資料遮罩。 | Security gate |  | M18,M09 | Engineering 必須等 role/config/AI governance 確認後，才能做最終 workflow automation。 |

## M18 System Admin

> M18 System Setup, Master Configuration & IT Ops（系統設定、主檔配置與 IT Ops）

> 模組明細：營運原始輸入 + ERP Consultant 建議答案 + Coding Gate。

> 模組業務規則 / 建議預設答案

| Rule ID | 規則範圍 | 建議預設答案 | 負責人 | 是否阻擋 Coding | 營運 備註 | col_7 | col_8 | col_9 |
|---|---|---|---|---|---|---|---|---|
| BR-M18-01 | Master configuration owner | Service items、price tables、status codes、SLA、templates、roles、regions 需要明確 owner 與 approval。 | System admin / 主管 | 是 |  |  |  |  |
| BR-M18-02 | Change request process | Configuration changes 需要 request、owner approval、effective date、rollback note。 | System admin / 主管 | 是 |  |  |  |  |
| BR-M18-03 | Initial setup import | Coding / UAT 前，先確認 first import list：brands、models、BOM、technicians、price、regions、roles、customers、open WorkOrders。 | 主管 / System admin | 是 |  |  |  |  |
| 模組 Q&A：營運原始輸入 + ERP 建議答案 |  |  |  |  |  |  |  |  |
| QID | Topic | 營運原始輸入 / 既有答案 | ERP Suggested Answer | 業務確認 | 流程 Gate / Coding Gate | 營運 備註 | 關聯模組 | AI Engineering / Coding 提醒 |
| Q001 | 核心定位 | Customer inquiry、WorkOrder dispatching、monthly payment（客戶詢問、工單派工、月結付款）。 | 定位為完整 Service-to-Cash ERP：詢問、報價、派工、完工、付款、月結。AI 客服只是入口之一，不是整個系統。 | 是否同意系統名稱可定為「智慧鎖工單 ERP / 派工月結系統」？ | System configuration、master setup、change request、support ticket |  | 全部模組 | Engineering 必須等 role/config/AI governance 確認後，才能做最終 workflow automation。 |
| Q002 | 訪談方式 | 先收意見再統一規則。 | 正確。Full 完整版本 仍需先收所有角色答案，再由主管統一正式規則。 | 規則統一會議由誰主持？ | System configuration、master setup、change request、support ticket |  | 全部模組 | Engineering 必須等 role/config/AI governance 確認後，才能做最終 workflow automation。 |
| Q004 | 案件類型 | 全部：安裝、維修、保固、客訴、急件、改期/取消、退款、品牌專案、建商專案。 | 全部列入 Full 完整版本 模組，不再拆 Phase I launch scope / 完整版本。 | 建商專案是否與品牌專案分開權限和月結？ | System configuration、master setup、change request、support ticket |  | 全部模組 | Engineering 必須等 role/config/AI governance 確認後，才能做最終 workflow automation。 |
| Q005 | 正式規則確認 | 共同確認。 | ERP 上可共同討論，但每個規則要有最後 owner，不可只寫共同確認。 | 請指定報價、派工、月結、客訴、品牌權限的最後拍板人。 | System configuration、master setup、change request、support ticket |  | 全部模組 | Engineering 必須等 role/config/AI governance 確認後，才能做最終 workflow automation。 |
| Q010 | 現行工具 | LINE 群、電話、Excel、Google Sheet、Email、紙本、口頭；派工廠商 LINE 群記事本放 schedule。 | Full 完整版本 要把 LINE 群記事本的排程搬到系統 schedule book，否則派工仍不受控。 | 哪些派工廠商需要自己的 schedule view？ | System configuration、master setup、change request、support ticket |  | 全部模組 | Engineering 必須等 role/config/AI governance 確認後，才能做最終 workflow automation。 |
| Q117 | 訪談後輸出 | all：現行流程圖、未來流程圖、狀態表、權限表、ProblemCard、派工、報價、異常、帳務、BOM。 | 正確。Full 完整版本 需全部輸出為 business contract。 | 要先產哪三份？ | System configuration、master setup、change request、support ticket |  | 全部模組 | Engineering 必須等 role/config/AI governance 確認後，才能做最終 workflow automation。 |
| Q118 | 必做功能 | ProblemCard、報價、派工、師傅接單、異常回報、付款、客訴、照片回報、月結。 | 因本版不分 Phase I launch scope，這些全部列入 Full 完整版本 目標。 | 是否還缺品牌入口與庫存？ | System configuration、master setup、change request、support ticket |  | 全部模組 | Engineering 必須等 role/config/AI governance 確認後，才能做最終 workflow automation。 |
| Q120 | 交技術前必決策 | 價格、加價、退款、師傅工資、派工模式、客訴責任、品牌權限、月結；期限 end of May。 | 正確。Full 完整版本 的 P0 決策清單。 | End of May 是否仍是期限？ | System configuration、master setup、change request、support ticket |  | 全部模組 | Engineering 必須等 role/config/AI governance 確認後，才能做最終 workflow automation。 |
| Q121 | 主管拍板 | all：價格表、師傅扣款、退款上限、品牌責任、客訴賠償、資料權限、月結規則。 | 正確。這些都不能交給 AI 或工程師自行假設。 | 主管決策會日期？ | System configuration、master setup、change request、support ticket |  | 全部模組 | Engineering 必須等 role/config/AI governance 確認後，才能做最終 workflow automation。 |
| G010 | 公司/分店/服務區設定 | 前期 無固定答案 | Central admin 需可設定公司、分店、服務區、區域負責人、可派工範圍與假日。 | 確認是否有多分店或不同公司帳。 | System setup |  | M06,M07 | Engineering 必須等 role/config/AI governance 確認後，才能做最終 workflow automation。 |
| G011 | 服務項目與價格表主檔 | 前期 有 pricing，但未定義 setup owner。 | 服務項目、標準工資、檢測費、車馬費、急件費、加班費要由 admin 維護並留版本。 | 確認誰可改價格主檔。 | Master data approval |  | M04,M11,M12 | Engineering 必須等 role/config/AI governance 確認後，才能做最終 workflow automation。 |
| G012 | 狀態與原因代碼設定 | 前期 有 statuses，但未定義 admin setup。 | 工單狀態、異常代碼、取消原因、拒單原因、退款原因都需主檔維護。 | 確認哪些代碼允許前線新增。 | Process control |  | M05,M15 | Engineering 必須等 role/config/AI governance 確認後，才能做最終 workflow automation。 |
| G015 | 資料匯入與初始建置 | 前期 無固定答案 | 上線前需匯入品牌、型號、BOM、師傅、價格、服務區、角色、現有客戶與未結工單。 | 確認第一批匯入範圍。 | Implementation setup |  | M02,M07,M10,M04 | Engineering 必須等 role/config/AI governance 確認後，才能做最終 workflow automation。 |
| G039 | Change request process | 前期 未涵蓋。 | 價格、權限、狀態、SLA、模板、AI SOP 的設定變更應有申請、核准、生效日與回滾紀錄。 | 確認誰可提交與核准變更。 | System governance |  | M17,M20 | Engineering 必須等 role/config/AI governance 確認後，才能做最終 workflow automation。 |
| G040 | IT support ticket workflow（IT 支援工單流程） | 前期 未涵蓋。 | 系統問題、帳號問題、資料修正、匯入錯誤應建立 IT support ticket，不混在工單。 | 確認內部 IT 支援流程。 | IT ops |  | M17 | Engineering 必須等 role/config/AI governance 確認後，才能做最終 workflow automation。 |

## M19 BI KPI

> M19 Reporting, BI & KPI（報表、BI 與 KPI）

> 模組明細：營運原始輸入 + ERP Consultant 建議答案 + Coding Gate。

> 模組業務規則 / 建議預設答案

| Rule ID | 規則範圍 | 建議預設答案 | 負責人 | 是否阻擋 Coding | 營運 備註 | col_7 | col_8 | col_9 |
|---|---|---|---|---|---|---|---|---|
| BR-M19-01 | KPI formula ownership | 每個 KPI 在 dashboard 成為 official 前，都必須有 formula owner 與穩定定義。 | 主管 / BI owner | 是 |  |  |  |  |
| BR-M19-02 | Report download audit | Financial、brand、technician、customer report downloads 應依 role access 控管並 audit logged。 | Central admin / BI owner | 是 |  |  |  |  |
| BR-M19-03 | Management dashboard scope | Default dashboard 涵蓋 WorkOrders、dispatch、completion、RMA、refund、AR、AP、inventory、technician performance。 | 主管 / BI owner | 部分 |  |  |  |  |
| 模組 Q&A：營運原始輸入 + ERP 建議答案 |  |  |  |  |  |  |  |  |
| QID | Topic | 營運原始輸入 / 既有答案 | ERP Suggested Answer | 業務確認 | 流程 Gate / Coding Gate | 營運 備註 | 關聯模組 | AI Engineering / Coding 提醒 |
| Q115 | 後台報表 | all。 | Full 完整版本 全部報表列入：工單、派工、客訴、退款、師傅績效、月結、庫存、品牌。 | 報表權限如何切？ | Dashboard、export、KPI definition、operational report |  | M06,M07,M11,M12,M13 | Engineering 可依此列草擬 screens/workflow，但 final gates 需依 營運 review status。 |
| Q116 | KPI | all。 | Full 完整版本 KPI 全部列入：派工時間、接單率、準時率、完工率、客訴率、返修率、退款率、毛利、未收款。 | KPI 公式誰定義？ | Dashboard、export、KPI definition、operational report |  | M06,M07,M11,M12,M13 | Engineering 可依此列草擬 screens/workflow，但 final gates 需依 營運 review status。 |
| G016 | KPI 公式 owner | 前期 有問誰定義公式。 | KPI 需有公式 owner；派工速度、接單率、準時率、完工率、返修率、退款率、毛利與未收款要定義一致。 | 確認 KPI 公式拍板人。 | BI governance |  | M06,M11,M13 | Engineering 可依此列草擬 screens/workflow，但 final gates 需依 營運 review status。 |
| G017 | 報表下載與權限 | 前期 提到全部報表。 | 報表需分角色：師傅只看自己月結；品牌看品牌；會計看財務；主管看全部；下載要 audit。 | 確認報表下載權限。 | Reporting access |  | M17 | Engineering 可依此列草擬 screens/workflow，但 final gates 需依 營運 review status。 |

## M20 AI Ops

> M20 AI Operations & Knowledge Governance（AI Ops 與知識治理）

> 模組明細：營運原始輸入 + ERP Consultant 建議答案 + Coding Gate。

> 模組業務規則 / 建議預設答案

| Rule ID | 規則範圍 | 建議預設答案 | 負責人 | 是否阻擋 Coding | 營運 備註 | col_7 | col_8 | col_9 |
|---|---|---|---|---|---|---|---|---|
| BR-M20-01 | AI knowledge owner | AI SOP、brand FAQ、price range、escalation rules、forbidden actions 需要 owner 與 version approval。 | AI ops owner / 客服主管 | 是 |  |  |  |  |
| BR-M20-02 | AI forbidden decisions | AI 不可 final quote、approve refund、decide warranty liability、promise legal/safety outcome 或 modify settlement。 | 主管 / AI owner | 是 |  |  |  |  |
| BR-M20-03 | AI quality feedback | Human 對 AI triage / quote / answer 的 corrections，應將原因寫回 AI quality review queue。 | AI ops owner | 部分 |  |  |  |  |
| 模組 Q&A：營運原始輸入 + ERP 建議答案 |  |  |  |  |  |  |  |  |
| QID | Topic | 營運原始輸入 / 既有答案 | ERP Suggested Answer | 業務確認 | 流程 Gate / Coding Gate | 營運 備註 | 關聯模組 | AI Engineering / Coding 提醒 |
| Q119 | 可暫緩功能 | 原填進階 KPI、AI 自動報價。 | 本次已取消暫緩概念。改為：Full 完整版本 全部納入，只標示「需主管決策」或「需詳細規格」。AI 自動報價仍限草稿 / 區間。 | 是否同意不再列 defer？ | AI policy、knowledge article、escalation rule、AI quality review |  | M03,M04,M16,M18 | Engineering 必須等 role/config/AI governance 確認後，才能做最終 workflow automation。 |
| G018 | AI 知識庫 owner | 前期 提到 AI triage，但未定義 knowledge governance。 | AI SOP、品牌 FAQ、價格範圍、不能回答清單、轉真人規則需有 owner 和版本核准。 | 確認 AI 知識庫由客服主管還是品牌共同維護。 | AI governance |  | M03,M04,M14 | Engineering 必須等 role/config/AI governance 確認後，才能做最終 workflow automation。 |
| G019 | AI 不可決策清單 | 前期 提到 AI 只做 draft / range。 | AI 不可 final price、不可退款核准、不可保固責任判定、不可法律/安全承諾、不可改月結。 | 確認不可由 AI 決策的清單。 | AI risk control |  | M04,M11,M13,M17 | Engineering 必須等 role/config/AI governance 確認後，才能做最終 workflow automation。 |
| G020 | AI 品質回饋閉環 | 前期 無固定答案 | 客服修正 AI 分診/報價/回答時，需回寫原因，作為 SOP 與知識庫更新來源。 | 確認 AI 錯誤要由誰審核。 | AI quality gate |  | M03,M16 | Engineering 必須等 role/config/AI governance 確認後，才能做最終 workflow automation。 |
