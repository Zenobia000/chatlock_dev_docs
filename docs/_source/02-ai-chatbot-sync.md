# AI Chatbot + WorkOrder Sync Final Spec (2026-05-20)

> **Source of Truth Mirror** — 自動 dump 自 [`02-ai-chatbot-sync-final-spec-20260520.xlsx`](../../02-ai-chatbot-sync-final-spec-20260520.xlsx)

> **Generated**: 2026-05-27 from Excel (44 sheets)

> **Status**: read-only mirror; 業主編輯只改 xlsx，docs 自動同步

> **D4 雙存治理**: docs 內引用走 markdown anchor (`#sheet-NN-name`)，不直接引 xlsx


## Table of Contents

- [00 使用說明](#00)
- [01 全階段Roadmap](#01-roadmap)
- [02 Chatbot模組A01-A12](#02-chatbot-a01-a12)
- [03 Chatbot流程](#03-chatbot)
- [04 Chatbot Gate](#04-chatbot-gate)
- [05 RAG知識治理](#05-rag)
- [06 Agent訓練規格](#06-agent)
- [07 Eval品質系統](#07-eval)
- [08 風險治理](#08)
- [09 AI Employee](#09-ai-employee)
- [10 Memory](#10-memory)
- [11 Model Routing](#11-model-routing)
- [12 Tool Registry](#12-tool-registry)
- [13 Chatbot對ERP](#13-chatbot-erp)
- [14 Sync架構](#14-sync)
- [15 Sync資料對照](#15-sync)
- [16 Sync狀態對照](#16-sync)
- [17 Sync整合](#17-sync)
- [18 Outbox事件](#18-outbox)
- [19 Sync Gap決策](#19-sync-gap)
- [20 Sync測試矩陣](#20-sync)
- [21 Idempotency DLQ](#21-idempotency-dlq)
- [22 Domain Events](#22-domain-events)
- [23 Cross Contract](#23-cross-contract)
- [24 Sync對ERP](#24-sync-erp)
- [25 Phase III-V](#25-phase-iii-v)
- [A M01 進線Debounce](#a-m01-debounce)
- [A M02 品牌型號Profile](#a-m02-profile)
- [A M03 ReAct Agent](#a-m03-react-agent)
- [A M04 Skill知識庫](#a-m04-skill)
- [A M05 安全驗證](#a-m05)
- [A M06 ProblemCard](#a-m06-problemcard)
- [A M07 真人轉接](#a-m07)
- [A M08 多模態](#a-m08)
- [A M09 Eval觀測](#a-m09-eval)
- [A M10 SOP螺旋](#a-m10-sop)
- [A M11 部署健康](#a-m11)
- [A M12 PRD治理](#a-m12-prd)
- [S M01 Intake資料捕捉](#s-m01-intake)
- [S M02 Facts主檔同步](#s-m02-facts)
- [S M03 ProblemCard轉換](#s-m03-problemcard)
- [S M04 ConvertToWO](#s-m04-converttowo)
- [S M05 Dispatch同步](#s-m05-dispatch)
- [S M06 Evidence回寫](#s-m06-evidence)

---

## 00 使用說明

> AI Chatbot + WorkOrder Sync Final Blueprint｜2026-05-20

> 本 workbook 已合併聊天機器人藍圖與工單同步藍圖；不再拆兩份讓 AI Specialist 自己對。

| 項目 | 內容 | Coding 使用方式 |
|---|---|---|
| 文件定位 | AI Chatbot + WorkOrder Sync final decision blueprint。 | 同一份 Excel 查 chatbot、ProblemCard、sync、guardrail、RAG/Eval。 |
| 包含兩份原始藍圖 | 聊天機器人系統開發藍圖 + 聊天機器人與工單同步藍圖。 | 已整合成同一份 final spec。 |
| 保留內容 | 營運原始輸入、AI/ERP Consultant 建議答案、module rules、sync contract、AI guardrails。 | coding 發生疑問時查本表。 |
| AI 邊界 | AI 可分診、摘要、建議、補資料、草擬 ProblemCard；不可 final quote/refund/warranty/settlement。 | 所有高風險案例 human-in-the-loop。 |
| Phase 原則 | Phase 0-I-II 可開始 coding；Phase III-IV-V 保留 roadmap 與後續 scope。 | 先做 launch-safe AI，再擴 AI Ops / KPI。 |

## 01 全階段Roadmap

> AI Chatbot + Sync 全階段 Roadmap

> 涵蓋 Phase 0 到 Phase V，Phase I/II 是可開始 coding 的重點。

| Phase | 名稱 | Coding 狀態 | Chatbot Scope | Sync Scope | Exit Criteria |
|---|---|---|---|---|---|
| Phase 0 | AI Policy / Contract Freeze | 可開始 | guardrails、tool permission、ProblemCard fields、handoff rule | AI 可讀/可寫邊界、human gate | forbidden actions 有測試案例 |
| Phase I | Chatbot + ProblemCard + WorkOrder Sync Core | 可開始 coding | intake、debounce、brand/model、triage、ProblemCard、evidence、handoff | ProblemCard -> WorkOrder conversion gate、status read、evidence sync | 客服可從 AI 對話安全轉 ProblemCard / WorkOrder |
| Phase II | Finance / Settlement Awareness | 可開始 coding，以 guardrail 方式做 | AI 辨識付款、退款、取消費、車馬費、爭議、月結問題 | 建立 accounting task / proof request，不改 AR/AP/settlement | Finance intent 都會正確轉人工或 queue |
| Phase III | Partner / B2B / Warranty Sync | 後續階段 | partner/builder/warranty context aware | Partner visibility、brand RMA、builder project sync | 權限與合約規則確定後才開放 |
| Phase IV | AI Ops Governance | 後續階段，basic guardrails 先做 | RAG/SOP versioning、Eval、feedback loop、quality review | AI action/event/audit 與 ERP rule version 對齊 | AI 有來源、有版本、有品質檢查 |
| Phase V | AI KPI / Observability Scale | 後續階段 | resolution、handoff、failure、cost、latency | Dashboard 與 BI event 對齊 | 管理層可用 AI KPI 做改善 |

## 02 Chatbot模組A01-A12

> Chatbot 模組地圖 A01-A12

> 聊天機器人系統開發藍圖已合併進此 final spec。

| ID | 模組 | 中文 | Owner | 現有成熟度 | 主要輸出 | 上游 | 下游 | 是否阻擋 PRD |
|---|---|---|---|---|---|---|---|---|
| A01 | Channel Intake & Debounce | 進線與訊息合併 | LINE/backend | 高 | Merged turn、reply token | LINE | A02/A03 | 否 |
| A02 | Brand/Profile Resolver | 品牌型號與用戶資料 | 客服主管 / Data steward | 高 | device_brand/device_model/phone/address facts | A01 | A03/A06 | 否 |
| A03 | Skill-Gated ReAct Agent | 技能守門代理 | AI engineer | 高 | 工具軌跡、AI 回覆 | A01/A02/A04 | A05/A06 | 是 |
| A04 | Knowledge & RAG Pipeline | 知識與 RAG 螺旋 | Knowledge owner | 中高 | SKILL.md、manual chunks、SOP drafts | data pipeline | A03/A10 | 是 |
| A05 | Guardrails & Output Validator | 安全與輸出驗證 | AI QA lead | 中高 | blocked reply、regen prompt、transfer guard | A03 | A07/A09 | 是 |
| A06 | ProblemCard Bridge | ProblemCard 自動觸發 | ERP/backend | 中 | ProblemCard create request | A02/A03 | 工單整合藍圖 | 是 |
| A07 | Human Handoff | 真人轉接與資料表單 | 客服主管 | 中高 | handoff reason、contact form | A03/A05 | 客服後台 | 否 |
| A08 | Multimodal Understanding | 圖片/影音處理 | AI/backend | 中 | media ref、vision input | LINE media | A03/A06 | 部分 |
| A09 | Eval & Observability | 評測與觀測 | AI QA lead | 中高 | quality report、audit、cost trace | A03/A05 | A10/A12 | 是 |
| A10 | SOP Feedback Spiral | SOP 回饋迴圈 | Knowledge owner | 中 | SOP draft、approval queue | A06/A09 | A04 | 部分 |
| A11 | Deployment & Health | 部署與健康檢查 | SRE/backend | 中高 | /health、Cloud Run、DB reconnect | all | operations | 否 |
| A12 | Governance & PRD Trace | 治理與 PRD 追溯 | PM/Tech Lead | 中 | source trace、decision log | all | final PRD | 是 |

## 03 Chatbot流程

> Chatbot End-to-End Flow

> 從 LINE/chat 進線到 AI 回覆、ProblemCard、handoff。

| Step | 流程 | 系統動作 | 資料輸出 | 失敗 fallback |
|---|---|---|---|---|
| 1 | LINE webhook 收訊 | 簽章驗證後分流文字、貼圖、媒體 | raw message / reply_token | 媒體先放 pending placeholder |
| 2 | Debounce 合併 | 1.5 秒內訊息合併為一個 logical turn | Block list / merged text | 逾時送出 fallback text |
| 3 | Inbound audit | 先寫入 user_raw/user content | audit_logs | DB fail-soft |
| 4 | Safety / data correction | 危險字阻擋；#資料修正 直接入庫 | blocked reply / data correction | 跳過 agent |
| 5 | Quick Reply | 品牌未知先問品牌；品牌已知但型號缺失時問型號 | user_facts | 不認得品牌時仍可有限回答 |
| 6 | Agent run | 注入可用技能、用戶資料、前情提要後呼叫 ReAct agent | AI messages / tool calls | timeout friendly reply |
| 7 | Output validation | 檢查禁語、內部機制外洩、口頭轉真人但未呼工具 | validated reply | 再生或 fallback |
| 8 | Profile update | 背景抽取電話、地址、品牌、型號等 facts | user_facts SCD2 | 失敗不阻塞回覆 |
| 9 | ProblemCard trigger | facts 有 brand 且症狀足夠時背景呼 admin API 建 PC | ProblemCard create | outbox/fail-soft |
| 10 | Reply / memory cleanup | 送 LINE 回覆並壓縮長對話、清理 tool/media checkpoint | reply / summary | LINE push fail audit |

## 04 Chatbot Gate

> Chatbot Decision Gates

> 把 AI 對話從會回答改成按營運風險 gate。

| Gate | 問題 | 通過條件 | 失敗時動作 | Owner | PRD / Coding 需落地 |
|---|---|---|---|---|---|
| G1 | 是否屬於電子鎖/服務範圍 | 意圖非 off-topic 或可導回 | 禮貌導回電子鎖 | 客服主管 | domain boundary 話術 |
| G2 | 是否已知品牌/型號 | 品牌已知；型號視技能需要 | Quick Reply 收集或限定共用技能 | 客服主管 / AI owner | 品牌與型號 master data |
| G3 | 是否需要完整 SOP | 與某技能 trigger 符合 | 必須 load_skill 後回答 | AI engineer | 所有高頻問題對應技能 |
| G4 | 是否可遠端解決 | 安全、可操作、非高風險 | L1/L2 回覆 | AI owner | 遠端解決關閉條件 |
| G5 | 是否需要真人 | 急件、生氣、高金額、保固不明、退款、法律安全、三次失敗 | transfer_to_human | 客服主管 | 轉真人觸發清單 |
| G6 | 是否需要 ProblemCard | 症狀足夠且 brand 已知 | 建立 PC 或補問資訊 | ERP owner | 最小 PC 欄位 |
| G7 | 是否可轉 WorkOrder | PC confirmed + 地址/電話齊全 + 服務類型需現場 | 呼 convertToWorkOrder 或人工審 PC | 派工主管 | AI 是否可自動轉單 |
| G8 | 是否可報價 | 固定規則已核准且非保固/建案/高風險 | 只給 range 或轉真人 | 會計/主管 | AI 不可 final quote 清單 |

## 05 RAG知識治理

> RAG / Skill Knowledge Governance

> 知識來源、chunk、skill draft、approval、release、rollback。

| Stage | 輸入 | 處理 | 輸出 | 評測 | 治理控制 |
|---|---|---|---|---|---|
| S1 Source | PDF 手冊、影片、門市資訊、歷史 LINE 對話、客服修正 | source_to_raw / raw_to_bronze | raw assets | 來源盤點完整率 | 來源 owner 與授權 |
| S2 Chunk/Classify | raw/bronze text | semantic chunking、分類、品牌/型號標籤 | silver chunks | chunk 覆蓋率 | 不得混品牌 |
| S3 Skill Draft | silver chunks | silver_to_skill 草擬 SKILL.md | draft skill | 人工審核通過率 | YAML frontmatter 與路徑 metadata |
| S4 Agent Use | approved SKILL.md | load_skill 工具按品牌/型號載入 | tool messages / answer | tool-call correctness | 品牌 gate |
| S5 Audit / Eval | 對話、工具、回覆 | quality_check、LLM-as-Judge、禁語檢查 | quality report | pass rate / cost | 每次改版跑 mini/full eval |
| S6 Human Correction | 客服 #資料修正、人工作業結果 | save context / SOP draft | correction queue | 修正 SLA | 主管核准後才入庫 |
| S7 Release | approved updates | skill version bump / PRD trace update | new skill pack | 回歸測試 | 版本與 rollback |

## 06 Agent訓練規格

> Agent Training / Skill Spec

> Agent 訓練、技能、工具與上線 gate。

| 項目 | 規格 | 現有基礎 | 需要補強 | Owner |
|---|---|---|---|---|
| System prompt | 所有對外語氣、工具使用、禁答範圍需集中在 prompts/system.md | agent/prompts/system.md | 新增 PRD trace ID 與 forbidden action checklist | AI owner |
| Skill routing | 頂層技能只列 router；ts/app/ss 子技能由母技能引導 | skills/tools.py、skills_prefix.py | 補齊每個高頻症狀的 router 規則 | Knowledge owner |
| Brand/model facts | device_brand/device_model 為技能開鎖前置條件 | quick_reply.py、ProfileManager | 與 ERP brand-model master data 同步 | Data steward |
| Transfer policy | 明確轉真人可直接 transfer；其他情境需先 load_skill | transfer_to_human guard | 加上高風險事故/保固/退款政策 | 客服主管 |
| Evaluation set | 67 cases floor，完整版本 擴到 300 cases | quality_check.py、agent/evals | 依真實工單與客服修正擴充 | AI QA lead |
| Observation | 每輪記 tool calls、latency、model/cost、skill metadata | agent_audit.py、Opik optional | 儀表板按 skill/problem type 看品質 | AI Ops |
| Release gate | prompt/skill 改版需 mini eval 通過；major release 需 full eval | quality reports | 自動阻擋 PR 規則 | Tech Lead |

## 07 Eval品質系統

> AI Eval / Quality System

> AI 品質、tool correctness、forbidden action、RAG source quality。

| Eval 類型 | 測什麼 | 目前來源 | 目標 | Fail 後處理 | Owner |
|---|---|---|---|---|---|
| Golden Q&A | 硬體、報價、門市、APP、多意圖、圍籬、品牌路由 | quality_check.py 67+ cases | 完整版本 300 cases | 修 prompt/skill 後 retry failed | AI QA |
| Keyword match | 答案需含關鍵詞 | quality_check --no-judge | PR mini <5 min | 關鍵詞或 SOP 修正 | AI QA |
| LLM-as-Judge | 正確性、完整性、是否亂報價 | quality_check judge | major release 必跑 | 人工抽查前 10 fail | AI QA / domain expert |
| Tool-call correctness | load_skill/update_user_info/transfer_to_human 是否正確 | agent messages | 關鍵流 100% | 修 router / guard | AI engineer |
| Safety / output | 禁語、內部機制、危險內容 | safety_gate/output_validator | 100% blocked | 新增黑名單與再生 prompt | Security / AI owner |
| RAG source quality | 是否引用正確品牌/型號手冊或技能 | Skill path metadata | 跨品牌錯誤 0 | 凍結錯誤 skill | Knowledge owner |
| Ops quality | 轉真人、ProblemCard 建立、工單同步成功率 | audit/admin API | 核心流程 >99% | 進 bug triage | Ops owner |

## 08 風險治理

> AI Risk Governance

> 亂報價、退款、保固責任、PII、prompt injection、知識污染等風險。

| 風險 | 例子 | 允許 AI 做什麼 | 禁止 AI 做什麼 | 控制點 | Owner |
|---|---|---|---|---|---|
| 錯誤技術指導 | 錯品牌、錯型號、門鎖安全風險 | 引用已核准技能並提醒限制 | 保證一定可開門/自行拆鎖危險步驟 | 品牌 gate + eval | AI owner |
| 亂報價 | 保固/建案/高金額案件 | 收集資訊、說明需真人確認 | final price、折扣承諾 | pricing approval gate | 會計/主管 |
| 退款/保固責任 | 客戶要求退費或判定誰負責 | 受理並轉人工 | 核准退款、判定法律責任 | intent short-circuit | 客服主管 |
| PII 與資料留存 | 電話、地址、照片、影片 | 依目的蒐集、audit | 在非必要回覆中暴露 PII | RBAC + retention | Security |
| Prompt injection | 要求忽略系統規則/洩漏 prompt | 拒絕並回到電子鎖服務 | 透露 system prompt/tool internals | H6/H7.5 | Security / AI QA |
| 工單重複建立 | 同一對話多次轉單 | 使用 idempotency key | 無確認直接重複建立 WO | PC/WO unique key | Backend |
| 知識污染 | 錯誤 #資料修正 入庫 | 保存待審 | 未審核直接改正式 SOP | SOP review queue | Knowledge owner |

## 09 AI Employee

> AI Employee Resume / Role

> AI 角色責任、能力邊界與營運使用方式。

| 欄位 | 內容 | 上線必填 |
|---|---|---|
| Job Title | AI 鎖匠客服助理 v1 (Smart Lock Customer Assistant) | Yes |
| Reports To | 客服主管 + AI Ops Lead | Yes |
| Mission | 在 LINE 入口替客戶遠端排除 70% 高頻電子鎖問題，並建立可派工的 ProblemCard，符合品牌 SOP 且不越權 | Yes |
| Independent Capabilities (可獨立做) | FAQ；品牌/型號 Quick Reply；SOP 引導 (load_skill)；資料修正 (#資料修正)；對話摘要；建議轉真人 | Yes |
| Collaborative (需協作) | 高金額報價草擬 (人審)；ProblemCard 草擬 (客服確認)；圖片初判 (人覆核) | Yes |
| Forbidden (禁止) | final quote / 退款核准 / 保固責任判定 / 法律安全承諾 / convert_to_work_order / 跨租戶資料存取 | Yes |
| Tool Permissions | load_skill(L1)｜update_user_info(L1)｜transfer_to_human(L1)｜create_problem_card(L2 HITL) | Yes |
| Knowledge Sources | Static: 品牌手冊 + SKILL.md｜Policy: 保固/退款內規｜Dynamic: ProblemCard/WorkOrder API | Yes |
| Memory Boundary | 見「11 Memory Architecture」；session 24h；user_facts SCD2 永久；不記 PII raw 於 log | Yes |
| KPIs | auto-resolve ≥70%｜eval pass ≥85%｜escalation correct ≥95%｜latency p95 ≤8s｜LLM cost ≤110% budget | Yes |
| Probation Plan | 30d shadow (不回客戶, 只記錄)｜60d canary 10%｜90d full + HITL on 高風險 | Yes |
| Promotion Criteria | 連續 4 週 KPI 全綠 → 開放更多品牌 / 自動建 PC (完整版本 限低風險) | Yes |
| Off-board Triggers | P0 事故 (洩漏/承諾退款/錯誤指引致安全事件) / 連續 2 週 pass<70 / 法規變更 | Yes |
| Audit Schema | audit_event(turn_id, conv_id, actor=ai, tool, before, after, source_skill, version, decision_id, tenant_id) | Yes |
| Approval Chain | 上線/改版：客服主管 + AI Ops Lead 雙簽；下線：客服主管 / Sponsor 任一即可 | Yes |

## 10 Memory

> Memory Architecture

> AI memory、user facts、conversation context 與 retention。

| 記憶層 | 範圍 | TTL | 儲存 | 讀取觸發 | 寫入觸發 | PII 規則 | AI 鎖匠實作 |
|---|---|---|---|---|---|---|---|
| Working (Turn Buffer) | 單一 user turn 內 | 1 turn | in-memory | agent 每步 | 每步 | raw OK (進 audit 時 mask) | harness/debounce.py merged turn |
| Session (Short-term) | 單一對話 thread | 24h or 5 turn beyond resolved | LangGraph checkpointer + Redis | agent run 開始 | 每 turn 結束 | PII 加密 at rest | agent checkpoint + summary |
| Episodic (User Facts) | 用戶層級事實 (品牌/型號/電話/地址) | 永久 (SCD2) | facts_db (Postgres) | agent run + handoff | profile_updater 寫回 | PII 加密 + access RBAC | user_facts SCD2 已實作 |
| Semantic (Knowledge) | 可重用 SOP / FAQ / 品牌資料 | 依 SKILL.md 版本 | Skill registry + Vector DB | load_skill / RAG query | Knowledge Owner approve | 無 PII (應全 dehydrated) | agent/skills/data + SKILL.md |
| Procedural (Policy) | 規則 / 政策 / 禁區 | 依 policy version | Policy engine (規則表) | 高風險 action 前 | Legal + 客服主管 | 無 PII | output_validator + safety_gate |
| Archival (Audit) | 完整可重播 | ≥1 年 (爭議案 ≥3 年) | audit_db + cold storage | 稽核 / 客訴查詢 | 每事件 | PII tokenize | audit_logs (已有) |
| Forget List | 客戶刪除請求 / GDPR right-to-be-forgotten | ≤30 天執行 | delete pipeline | 客戶提出 / 法務指令 | Legal + Ops 雙簽 | PII 永久刪除證明 | 需新增 (P1) |

## 11 Model Routing

> Model Routing

> 模型路由、成本、品質與 fallback。

| 場景 | 首選 | 備援 | 為何 | Budget/turn | Latency p95 | 備註 |
|---|---|---|---|---|---|---|
| Quick Reply (品牌/型號詢問) | Haiku 4.5 | Sonnet 4.6 | 結構化、低意圖、高頻 | $0.001 | ≤1s | 結構化輸出；無 RAG |
| 一般 FAQ (RAG) | Haiku 4.5 或 Sonnet 4.6 | Opus | 依 confidence 切換 | $0.005 | ≤3s | RAG k=3；citation 必開 |
| SOP 引導 (load_skill → ReAct) | Sonnet 4.6 | Opus | 中度推理 + 多工具 | $0.02 | ≤6s | ReAct + max_iter=4 |
| 保固 / 退款 / 法律 | Sonnet 4.6 草擬 + HITL | Opus 4.7 (人審用) | 禁止 final ; 一定 HITL | $0.05 | ≤10s (異步) | 輸出進客服佇列 |
| 圖片 (門鎖損壞照片) | Sonnet 4.6 vision | Gemini 2.5 Pro vision | 判斷 / 引導補拍 | $0.05 | ≤6s | PII 部分遮蔽 (人臉) |
| LLM-as-Judge (Eval) | Opus 4.7 | Sonnet 4.6 | judge 必須高品質 | $0.05 | off-line | 不可省 |
| 對話壓縮 / 摘要 | Haiku 4.5 | Sonnet 4.6 | summary 容錯高 | $0.002 | ≤2s | checkpointer compress |
| Fallback (cost spike / outage) | Haiku 4.5 | — | Circuit breaker | $0.001 | ≤1s | 降級回覆 + 主動轉真人 |

## 12 Tool Registry

> Tool / MCP Registry

> AI tool permission 與可用工具邊界。

| Tool ID | 用途 | Input Schema (簡) | Output Schema (簡) | Auth / Tenant | Risk Class | HITL? | Audit Event |
|---|---|---|---|---|---|---|---|
| load_skill | 依品牌/型號載入 SKILL.md | {brand, model, problem_hint} | {skill_id, content_chunks, version} | tenant + RBAC: agent | L1 低 (純讀) | 否 | skill.loaded(skill_id, version) |
| update_user_info | 回寫 user_facts (電話/地址/品牌) | {user_id, facts:{...}} | {ok, facts_version} | tenant + RBAC: agent | L1 (PII 寫入) | 否 | facts.updated(user_id, fields, version) |
| transfer_to_human | 轉真人客服 | {reason, summary, contact, urgency} | {handoff_id} | tenant | L1 | 否 (本身就是 HITL 觸發) | handoff.created(...) |
| create_problem_card | 建 ProblemCard | {conv_id, brand, model, symptom, urgency, media, idempotency_key} | {pc_id, status} | tenant; Outbox | L2 中 (寫業務物件) | 建議 V1 草擬 + 人審 | pc.create_requested + pc.created |
| convert_to_work_order | PC → WO 轉換 | {pc_id, address_override?, idempotency_key} | {wo_id, status} | tenant; admin api token | L3 高 (現場派工) | Yes V1 必須人審 | wo.create_requested + wo.created |
| query_wo_status | 查詢工單狀態 (擬議) | {wo_id or user_id} | {wo_list} | tenant + 限 owner / 客服 | L1 | 否 | wo.read(wo_id) |
| search_knowledge | 全文 / 向量檢索 (擬議) | {query, brand?, top_k} | {chunks:[{source, score, text}]} | tenant; citation required | L1 | 否 | rag.search(query, hits) |
| MCP Server (對外擬議) | 未來開放 partner 整合 | MCP 1.0 spec | MCP 1.0 spec | OAuth + tenant scoping | 依 tool | 依 tool | mcp.* events |

## 13 Chatbot對ERP

> Chatbot 對 WorkOrder ERP Mapping

> Chatbot modules 對應 ERP modules 與 phase handling。

| Chatbot Module | Current Meaning | Final ERP Mapping | Phase Handling | AI Specialist Action |
|---|---|---|---|---|
| A01 Channel Intake & Debounce | LINE intake and message merge | M01 Intake + M16 Communication | Phase I Build Now | Preserve source channel, conversation ID, audit and debounce rule. |
| A02 Brand/Profile Resolver | Brand, model, customer facts | M02 Customer/Site/Device + M10 Product/BOM light | Phase I Build Now / Light master data | Align brand/model facts with ERP master data and warranty identity. |
| A03 Skill-Gated ReAct Agent | Agent answers through approved skills/tools | M20 AI Ops + M17 RBAC/Audit | Phase 0 guardrails, Phase IV deeper AI Ops | Define allowed tools, forbidden actions, audit trail and HITL rules. |
| A04 Knowledge & RAG Pipeline | SOP/manual/FAQ retrieval and update loop | M20 AI Ops + M18 System Setup | Phase 0 minimum, Phase IV governance | Version AI SOP, brand FAQ, price range and escalation rules. |
| A05 Guardrails & Output Validator | Validate risky AI replies | M20 AI Ops + M15 Exception | Phase I Build Guardrails | Convert P0-20 into test cases: no final price/refund/warranty/legal promise. |
| A06 ProblemCard Bridge | Create ProblemCard draft/request | M03 AI ProblemCard + Sync M03 | Phase I Build Now | ProblemCard must have required fields, risk tags, evidence needs and human escalation. |
| A07 Human Handoff | Transfer to customer service | M03 + M15 + M16 | Phase I Build Now | Handoff reason, summary, urgency and next owner must be captured. |
| A08 Multimodal Understanding | Image/video inputs | M09 Evidence + M08 Onsite | Phase I evidence request, advanced analysis later | Store media as evidence references; do not keep only temporary chat media. |
| A09 Eval & Observability | Quality, audit and cost trace | M20 AI Ops + M19 BI/KPI | Phase I minimum tests, Phase IV/V deeper | Create regression tests for AI guardrails and ProblemCard quality. |
| A10 SOP Feedback Spiral | Feedback loop for SOP improvement | M20 AI Ops | Manual First / Phase IV | Route AI feedback to approved knowledge owner before publication. |
| A11 Deployment & Health | Operational health and kill switch | M18 System Admin | Phase 0 minimum | Define kill switch owner, scope, audit and recovery rule. |
| A12 Governance & PRD Trace | Decision/source trace | Final Answer Register + handoff PRD | Phase 0 | Trace every AI behavior back to Final rule, source or explicit AI specialist decision. |
| Final Required Update | Default Answer To Use | Must Ask 營運 Again? | Owner |  |
| Replace old v9 references | Use Final module IDs M01-M20 and Phase 0/I/II/III/IV/V. | No | AI Specialist |  |
| AI final quote | AI may provide range/draft only; final customer price needs approved fixed-price rule or human confirmation. | No | AI Specialist |  |
| AI refund/warranty/settlement | AI cannot approve refund, decide warranty liability, or modify settlement. | No | AI Specialist |  |
| ProblemCard to WorkOrder | Phase I requires human review before convert-to-WorkOrder; low-risk automation may be later. | No unless AI proposes automation | AI Specialist / Operator Leader |  |
| RAG/Skill update | AI SOP and price/brand content require owner, approval, version and effective date. | No | AI Specialist / System Admin |  |
| Human escalation | Urgent, angry, high amount, warranty unclear, refund, legal/safety, or 3 failed attempts must transfer to human. | No | AI Specialist |  |
| Phase II / System Setup Update | Accepted Rule | AI Specialist Instruction | Coding Risk If Ignored |  |
| Phase II review status | 營運 accepted all 30 suggested Phase II default answers on 2026-05-18. | Do not ask 營運 to re-answer Phase II finance questions before starting module contracts. | Repeated discovery and delayed coding. |  |
| Configurable rule principle | Phase II values are default business rules, not hardcoded constants. | AI chatbot must read price/rule/version from approved System Setup / Admin Configuration or approved tool/API, not from prompt text. | AI may give outdated fee/refund/settlement information. |  |
| AI finance limitation | AI cannot approve refund, modify settlement, decide warranty liability, or promise legal/safety outcome. | Keep these in guardrail tests and human handoff rules. | AI overreach and business liability. |  |
| Rule versioning | Confirmed WorkOrders keep the rule version used at quote/payment/dispatch/settlement. | Chatbot responses must not silently apply new rules to old cases without authorized adjustment. | Wrong customer/accounting answer. |  |
| Knowledge/RAG rule | Fee, refund, payout and settlement content must be versioned and approved before AI uses it. | Route finance SOP edits through Knowledge Owner + System Admin approval. | Unapproved finance policy in customer conversation. |  |

## 14 Sync架構

> WorkOrder Sync Architecture

> 聊天機器人與工單同步架構。

| Layer | 資料物件 | 轉換規則 | 下游 | 控制點 |
|---|---|---|---|---|
| L1 Message | LINE text/media/sticker | debounce 合併，media 轉 ref | Conversation/Audit | raw 與 processed 分離 |
| L2 User Facts | brand/model/phone/address | SCD Type 2 user_facts | ProblemCard | 事實可追溯與可修正 |
| L3 Conversation | thread_id、summary、messages | 長對話壓縮但保留 facts | ProblemCard | conversation_id 必須可查 |
| L4 ProblemCard | brand/model/symptom/category/urgency/status/media | brand known + symptom enough → draft/incomplete；人工確認 → confirmed | WorkOrder | Completeness gate |
| L5 WorkOrder | problem_card_id、address、phone、priority、status | confirmed PC + address → created WO | Dispatch/SLA/Accounting | Idempotency + tenant isolation |
| L6 Execution | assignment、arrival、completion、evidence、payment | 狀態機轉換 | Reports/AI feedback | Audit + rollback |

## 15 Sync資料對照

> AI 對話欄位到 ERP 欄位對照

> 前端、AI、營運共同的資料契約檢查表。

| AI/LINE 欄位 | DB/ERP 欄位 | 必填時機 | 缺失時動作 | 備註 |
|---|---|---|---|---|
| line_user_id | users.line_user_id | 首次進線 | 建立 user 或回錯 | tenant 隔離需由 admin api 處理 |
| display_name | users.display_name / WO customer_name | 轉工單前 | 可人工補 | body customer_name 優先 |
| phone | users.phone / user_facts.phone / WO customer_phone | 派工前 | 補問或人工補 | PII |
| address | users.address / user_facts.address / WO customer_address | convertToWorkOrder 前 | 無地址 422 | district 由 address prefix 解析 |
| device_brand | problem_cards.brand | ProblemCard 建立前 | 品牌未知不建 PC | 品牌也控制 skill gate |
| device_model | problem_cards.model | 可後補；型號技能前必填 | 缺失填 未知 或追問 | 要與 brand-model master 同步 |
| symptom text | problem_cards.symptoms JSONB | ProblemCard 建立前 | 症狀太短 skip | 完整版本 需結構化抽取 |
| urgency | problem_cards.urgency / work_orders.priority | 分診後 | 預設 medium/normal | locked_out 建議 urgent |
| media refs | problem_cards.media_urls / evidence | 照片 gate | 請客戶補傳 | 不能只存在 checkpoint |
| resolution layer | problem_cards.resolution_layer / completion report | 解決或轉單後 | 人工補 | 用於品質與 SOP |

## 16 Sync狀態對照

> Conversation / ProblemCard / WorkOrder 狀態對照

> 避免 AI、後台、工單用不同狀態講同一件事。

| 階段 | Conversation | ProblemCard | WorkOrder DB | OpenAPI 顯示 | 允許下一步 | Owner |
|---|---|---|---|---|---|---|
| 初始諮詢 | active/collecting | 未建立 | 無 | 無 | 補資料或 AI 回覆 | 客服 |
| 分診中 | resolving | incomplete/draft | 無 | draft | confirm 或補問 | 客服/AI |
| AI 遠端解決 | resolved | resolved | 無 | resolved | 關閉或 SOP feedback | 客服主管 |
| 需現場服務 | escalated/awaiting human | confirmed | created | inquiring | 派工 matching | 派工主管 |
| 已派工 | n/a | confirmed | assigned | assigned | 技師 accept/reassign | 派工 |
| 技師接受 | n/a | confirmed | accepted | accepted | 到場/改期/取消 | 技師 |
| 施工中 | n/a | confirmed | in_progress | in_progress | 完工/範圍變更/缺料 | 技師 |
| 完工待確認 | n/a | resolved | completed | completed | 客戶確認/返工/爭議 | 客服 |
| 結案 | resolved | resolved | confirmed | closed | 月結/歸檔 | 會計 |
| 取消 | closed | resolved/escalated | cancelled | cancelled | 不得再派工 | 主管 |

## 17 Sync整合

> Sync Integration Contract

> 整合同步的 contract-level 規則；不是 backend implementation。

| Operation | Endpoint / Function | 前置條件 | 成功輸出 | 錯誤 | 測試來源 |
|---|---|---|---|---|---|
| createProblemCard | POST /api/v1/problem-cards | conversation_id、brand、model、symptom | ProblemCardEnvelope | 422/404 | problem_card_service.py |
| confirmProblemCard | POST /api/v1/problem-cards/{id}/confirm | status incomplete | confirmed PC | 409 | problem_card_service.py |
| resolveProblemCard | POST /api/v1/problem-cards/{id}/resolve | status confirmed、layer L1/L2/L3 | resolved PC | 409/422 | problem_card_service.py |
| convertToWorkOrder | POST /api/v1/problem-cards/{id}/convert-to-work-order | PC confirmed + address | 201 new WO / 200 existing | 404/409/422 | test_pc_convert_to_wo.py |
| listWorkOrders | GET /api/v1/work-orders | tenant_id | WorkOrderPage | 503 | work_order_service.py |
| assignWorkOrder | POST /api/v1/work-orders/{id}/assign | WO created/assigned + active technician | assigned WO | 404/409 | work_order_service.py |
| acceptWorkOrder | POST /api/v1/work-orders/{id}/accept | WO assigned | accepted WO | 409 | work_order_service.py |
| completeWorkOrder | POST /api/v1/work-orders/{id}/complete | WO accepted/in_progress | completed WO | 409/422 | work_order_service.py |
| cancelWorkOrder | POST /api/v1/work-orders/{id}/cancel | non-terminal | cancelled WO | 409 | work_order_service.py |

## 18 Outbox事件

> Events / Outbox

> 事件、重試、可補償同步。

| 事件 | 觸發 | Payload 最小欄位 | 同步方式 | 失敗策略 | 需要監控 |
|---|---|---|---|---|---|
| problem_card.create_requested | agent H_PC | conversation_id、brand、model、symptom、urgency、idempotency_key | Admin API HTTP | agent_outbox + retry + alert | outbox age |
| problem_card.created | api create_card | pc_id、conversation_id、status | DB + WS | idempotent response | PC count |
| problem_card.confirmed | 客服確認 | pc_id、status | REST | 409 state conflict | confirmation SLA |
| work_order.created | convertToWorkOrder | wo_id、pc_id、priority、address | DB + WS publish | publish fail non-fatal | WO created events |
| work_order.assigned | auto/manual dispatch | wo_id、technician_id、score/reason | REST + WS | reassign or pending | accept timeout |
| work_order.completed | 技師完工 | wo_id、summary、photos、amount | REST + WS | retry upload/evidence | completion quality |
| ai_quality.feedback | 客服修正/客訴/低分 | pc_id、turn_id、reason、corrected_answer | Admin queue | 待審不入正式知識 | feedback backlog |

## 19 Sync Gap決策

> Sync Gap Decisions

> 同步前必須落地的管理與流程決策。

| ID | 決策問題 | 建議預設 | 阻擋 Coding | Owner | 備註 |
|---|---|---|---|---|---|
| D01 | AI 是否可自動 convert ProblemCard to WorkOrder？ | V1 需客服確認 PC；完整版本 可針對低風險固定場景自動轉單 | 是 | 客服主管 / ERP owner |  |
| D02 | 缺地址時要怎麼補？ | LINE 追問 + 後台補填；無地址不得轉 WO | 是 | 客服主管 |  |
| D03 | ProblemCard completeness score 是否控制派工？ | 低於門檻不可自動派工，可人工 override | 是 | Tech Lead / Ops |  |
| D04 | urgent/Red Code 定義 | 被鎖門外、門內受困、安全風險、怒客高風險 | 是 | 營運主管 |  |
| D05 | 保固/建案案件是否報價？ | AI 禁止 final quote；真人查詢後回覆 | 是 | 主管 / 會計 |  |
| D06 | 同 conversation 多 PC 規則 | 同一 active issue 僅一張 PC；新症狀/新設備可另建 | 部分 | 客服主管 |  |
| D07 | 對話解決後是否客戶確認關閉？ | 遠端解決需 quick confirm 或 48 小時自動關閉 | 部分 | 客服主管 |  |
| D08 | AI feedback 誰審核？ | 客服主管 + domain expert 雙審高風險 SOP | 是 | Knowledge owner |  |

## 20 Sync測試矩陣

> Sync Test Matrix

> 同步、轉單、狀態、evidence、failure 的測試矩陣。

| TC | 場景 | Arrange | Act | Expected | 現有測試 |
|---|---|---|---|---|---|
| TC-SYNC-01 | confirmed PC + user.address → WO | PC confirmed, address exists | convertToWorkOrder | 201 + WO created | test_convert_happy_path |
| TC-SYNC-02 | 同 PC 重複轉單 | existing WO | convert twice | 200 + same WO id | test_convert_idempotent |
| TC-SYNC-03 | draft/incomplete PC | PC incomplete | convert | 409 STATE_CONFLICT | test_convert_draft_rejected |
| TC-SYNC-04 | resolved PC | PC resolved | convert | 409 | test_convert_resolved_rejected |
| TC-SYNC-05 | 缺地址 | user.address null, body empty | convert | 422 VALIDATION_ERROR | test_convert_missing_address_422 |
| TC-SYNC-06 | 地址覆寫 | user old address + body new address | convert | body address wins | test_convert_address_override |
| TC-SYNC-07 | 跨 tenant | PC in other tenant | convert | 404 | test_convert_cross_tenant_404 |
| TC-SYNC-08 | agent 背景建 PC 失敗 | Admin API down | H_PC trigger | outbox/alert; user reply not blocked | 需補 |
| TC-SYNC-09 | Quick Reply 後建 PC | brand unknown first turn | select brand/model | facts saved; PC can create | 需補 |
| TC-SYNC-10 | 多媒體照片 gate | photo + symptom | media resolved | media_urls/evidence linked | 需補 |

## 21 Idempotency DLQ

> Idempotency / DLQ

> 失敗可重試、可查詢、可人工補償、不重複建單。

| 操作 | Idempotency Key 公式 | Dedup 視窗 | DLQ 名稱 | Retry 策略 | Alert 門檻 | 人工補償 SOP | 主責 |
|---|---|---|---|---|---|---|---|
| create_problem_card | sha256(conv_id + first_unresolved_symptom + brand) | 24h | dlq_pc_create | exp-backoff: 1,2,4,8,16s; max 5 | queue age >5min OR retry>3 | Admin 後台 → 手動建 PC → 寫回 conv_id | Backend |
| pc.confirm | pc_id + actor | no dedup needed (idem on state) | — | 在 API 層 409 即正確 | — | — | Backend |
| pc.resolve | pc_id + resolution_layer | — | — | API 409 正確 | — | — | Backend |
| convert_to_work_order | pc_id (PK lookup; 若已存在回 200) | 永久 (1:1) | dlq_wo_create | exp-backoff; max 3 + manual | 失敗或 retry>2 | 客服重新確認地址 / 手動建 WO 並回寫 pc_id | Backend |
| wo.assign | wo_id + technician_id + sched_slot | 1h | dlq_dispatch | no auto retry (人工) | 未派工 >SLA (urgent 5min/normal 10min) | 派工主管手動指派 | 派工 |
| wo.complete | wo_id + completion_hash | 永久 | dlq_completion | max 3 with photo upload retry | 完工資料缺 | 技師補上傳 / 客服協助 | 技師主管 |
| evidence.upload | wo_id + file_hash | 永久 | dlq_evidence | exp-backoff; max 10 (大檔 + 網路) | 失敗 >2 | 客服 / 技師後台補上傳 | Backend |
| audit.write | auto UUID + monotonic seq | no dedup | dlq_audit (高優先) | no retry (critical, 直接 fail loud) | 任何失敗都 P1 | 立即 ops 介入 + 客戶通知 | SRE |
| ai_quality.feedback | turn_id + corrector_id | no dedup | — | in-app retry on submit | feedback queue age >24h | AI Ops review | AI Ops |

## 22 Domain Events

> Domain Event Catalog

> 跨模組事件命名、payload、retention、replay、audit trace。

| 事件名 | Producer | Consumer(s) | Payload (核心欄) | Retention | Replay 可 | Tenant Key | Audit Trace |
|---|---|---|---|---|---|---|---|
| conversation.message.received | LINE webhook | agent runtime, audit | {conv_id, tenant_id, msg_type, text, media_ref, line_user_id, ts} | 90d | Yes | tenant_id | audit_logs (raw) |
| user_facts.updated | update_user_info tool | PC creator, ERP customer sync | {user_id, tenant_id, fields, version, source} | 永久 (SCD2) | Yes | tenant_id | facts.updated |
| skill.loaded | agent runtime | audit, eval, cost | {conv_id, skill_id, version, brand?, model?} | 1y | No (純觀察) | tenant_id | skill_loads |
| problem_card.create_requested | agent / pc_creator | admin API, audit | {conv_id, brand, model, symptom, urgency, idempotency_key} | 1y | Yes (via Outbox) | tenant_id | pc.create_requested |
| problem_card.created | admin API | WS, eval, BI | {pc_id, conv_id, status=draft, ts} | 永久 | Yes | tenant_id | pc.created |
| problem_card.confirmed | 客服 / API | WO converter, audit | {pc_id, actor, ts} | 永久 | Yes | tenant_id | pc.confirmed |
| problem_card.resolved | 客服 / agent (L1) | BI, SOP feedback | {pc_id, resolution_layer, summary} | 永久 | Yes | tenant_id | pc.resolved |
| work_order.created | convert_to_wo API | Dispatch, WS, BI | {wo_id, pc_id, priority, address} | 永久 | Yes | tenant_id | wo.created |
| work_order.assigned | dispatch | Technician app, WS, alert | {wo_id, tech_id, slot, reason} | 永久 | Yes | tenant_id | wo.assigned |
| work_order.accepted | 技師 | Dispatch, customer notify | {wo_id, tech_id} | 永久 | Yes | tenant_id | wo.accepted |
| work_order.completed | Mobile app | Evidence, AR, BI | {wo_id, summary, photos, amount} | 永久 | Yes | tenant_id | wo.completed |
| evidence.uploaded | Mobile / 客服 | Audit, RMA, AR | {wo_id or pc_id, kind, url, sha256} | 案件結案 + 3y | Yes | tenant_id | evidence.uploaded |
| ai_quality.feedback | 客服修正 / #資料修正 / 客訴 | AI Ops queue | {turn_id, conv_id, reason, corrected_answer} | 1y | Yes | tenant_id | ai_qc.feedback |
| policy.decision | Guardrail / Tool Gateway | Audit, BI | {conv_id, policy, decision, reason} | 1y | Yes | tenant_id | policy.decision |
| kill_switch.activated | Admin / SRE | Agent runtime | {scope=employee\|skill\|tool, target, actor, reason} | 永久 | — | tenant_id (or global) | kill_switch.activated |

## 23 Cross Contract

> Cross-Blueprint Contract Surface

> 誰擁有、誰可寫、衝突怎麼解。

| 邊界 / 物件 | 欄位 | 擁有者藍圖 | 讀取者 | 寫入時機 | 驗證規則 | Source of Truth | 衝突解決規則 |
|---|---|---|---|---|---|---|---|
| User | line_user_id | Chatbot | Sync, ERP | 首次進線 | unique per tenant | Chatbot (LINE) | First-write wins |
| User | phone | Chatbot (capture) → ERP (master) | Both | Quick Reply / Handoff form / 後台補 | E.164 / TW pattern | ERP (使用者主檔) | ERP wins; Chatbot 更新需經 update_user_info + audit |
| User | address | Chatbot (capture) → ERP (master) | Both | Handoff form / 後台 / convert_to_wo body | non-empty for WO; district resolvable | ERP | convert_to_wo body 可 override (audit 留底) |
| ProblemCard | brand / model / symptom | Chatbot | Sync, ERP | AI 建單 | brand in master; symptom ≥ min length | Chatbot (建立時) | Chatbot 寫入；客服可修正 → audit |
| ProblemCard | status (draft / incomplete / confirmed / resolved) | ERP (state machine) | Chatbot (read), Sync | API call only | state transition 合法 | ERP | ERP wins always |
| ProblemCard | media_urls | Chatbot + 客服 | Sync, ERP | 媒體上傳 | url 有效 + 儲存策略 | ERP (持久化) | append-only |
| WorkOrder | all fields | ERP | Chatbot (read only) | convert_to_wo / 派工 / 完工 | 依 state machine | ERP | ERP-only writes; AI 禁寫 |
| Conversation Audit | raw text / tool calls | Chatbot | Audit, AI Ops, BI | 每 turn | PII 加密 at rest | Chatbot (raw) + ERP (mirror summary) | Chatbot wins for raw; ERP 只存 summary |
| Skill / SOP version | skill_id + version | Chatbot (Skill Registry) | ERP (M20 AI Ops) | Knowledge Owner approve | version monotonic | Chatbot Skill Registry | Chatbot wins; ERP 顯示 read-only |
| Eval Set | test cases | Chatbot (AI QA) | ERP M20 read | 每次改版 | 覆蓋率 ≥ X | Chatbot | Chatbot wins |
| Pricing rules | skill 中是否引用價格 | ERP M04 / M18 | Chatbot read (via skill or API) | 主管核准 | version + effective_date | ERP | ERP wins; Chatbot 不可硬編碼 |
| RBAC / Role | role + permission | ERP M17 | Chatbot (tenant/policy) | Admin 設定 | policy YAML | ERP | ERP wins |

## 24 Sync對ERP

> Sync 對 WorkOrder ERP Mapping

> 同步模組對應 ERP modules 與 phase handling。

| Sync Module / Sheet | Current Meaning | Final ERP Mapping | Phase Handling |
|---|---|---|---|
| M01 Intake資料捕捉 | Capture AI/LINE facts | M01 Intake + M02 Customer/Site/Device | Phase I Build Now |
| M02 Facts主檔同步 | Sync user facts/master data | M02 + M18 System Setup | Phase I Build Now |
| M03 ProblemCard轉換 | Create/confirm ProblemCard | M03 AI ProblemCard | Phase I Build Now |
| M04 ConvertToWO | Convert ProblemCard to WorkOrder | M04 Quote + M11 Payment + M05 WorkOrder | Phase I Build Now with human gate |
| M05 Dispatch同步 | Assign/accept/dispatch status | M06 Dispatch + M07 Workforce | Phase I Build Now |
| M06 Evidence回寫 | Evidence written back to ERP | M09 Evidence + M08 Onsite + M16 Communication | Phase I Build Now |
| Domain Event Catalog | Event names and payloads | M17 Audit + M20 AI Ops + all core modules | Phase 0/I |
| Cross-Blueprint Contract | Ownership rules between chatbot and ERP | M17 RBAC + M18 System Setup | Phase 0 |
| Final Missing Gate To Add | Default Final Rule | Phase I Handling | Owner |
| Quote gate | Customer sees total receivable; internal cost split remains internal. | Build Now | AI Specialist + Accounting |
| Payment gate | WorkOrder may proceed only after required deposit/payment proof when applicable. | Build Now; amount details manual-first if not final | AI Specialist + Accounting |
| AI convert-to-WorkOrder | Phase I requires human confirmation before conversion. | Build Now | AI Specialist / Operator Leader |
| Exception approval inbox | Warranty unclear, high risk, refund, safety/legal, customer refuses added price must pause for approval. | Build Now | AI Specialist / Supervisor |
| Cancellation/travel/refund fee | Do not hardcode exact fees until accounting confirms; use manual approval note. | Manual First | Accounting |
| Communication templates | Quote, photo request, payment, dispatch, delay, extra price, completion, RMA, refund need approved templates. | Build Now | AI Specialist / Operator Leader |
| RBAC/audit | No all access for brand or locksmith; can-view/can-edit/can-approve must be split. | Build Now | AI Specialist / System Admin |
| Old Gap ID | Use This Final-Aligned Answer | Must Ask 營運 Again? | Owner |
| D01 AI auto convert PC to WO | Phase I: No auto conversion. Customer service/human confirms PC, quote/time/payment gate, then WorkOrder. | No | AI Specialist |
| D02 Missing address | LINE asks customer or back office fills it. No WorkOrder dispatch without service address. | No | AI Specialist |
| D03 PC completeness score | Low completeness cannot auto-dispatch; human override allowed with reason. | No | AI Specialist / Ops |
| D04 Urgent / Red Code | Locked out, trapped/safety risk, angry/high-risk customer, urgent appointment and similar cases escalate. | No | Operator Leader if changing wording |
| D05 Warranty/builder quote | AI cannot final quote; human checks warranty/brand/builder rule. | No | AI Specialist + Accounting |
| D06 Multiple PC in one conversation | Same active issue keeps one PC; new symptom/device may create another. | No | AI Specialist |
| D07 Remote solved close | Remote resolved needs quick confirmation or timed auto-close rule; keep visible in ProblemCard status. | No | AI Specialist |
| D08 AI feedback review | Knowledge owner + AI Ops review; high-risk SOP changes need approval/version/effective date. | No | AI Specialist / System Admin |
| Phase II / System Setup Update | Accepted Rule | Sync / Coding Instruction | Required Events Or Controls |
| Phase II review status | 營運 accepted all 30 suggested Phase II default answers on 2026-05-18. | Treat `Final Phase II Accepted 20260518` as the finance/settlement source. | No blank Phase II Q&A restart. |
| Configurable rule principle | Amounts, percentages, thresholds, approval levels, reason codes and templates are configurable. | Sync must store rule_version / effective_date when quote, payment, refund, settlement or withholding decision is made. | rule.version_applied / config.changed audit |
| Payment / refund gate | Payment proof, AR status, refund request, cancellation/travel/inspection fee and approval level are accepted defaults. | Build workflow around configurable rules and approval inbox. | payment.proof_received, refund.requested, approval.requested, approval.approved |
| Settlement gate | Technician AP, dispatcher commission, brand settlement, cash offset, monthly close and dispute withholding defaults are accepted. | Generate settlement/export from applied rules; do not recompute closed cases from latest config. | settlement.generated, withholding.created, adjustment.released |
| AI limitation | AI may classify and summarize but cannot approve finance decisions. | Tool/API gateway must require human approval for refund, settlement, warranty liability and legal/safety decisions. | policy.decision / human_approval.required |

## 25 Phase III-V

> 後續 Phase III / IV / V AI Scope

> 後續 phase 仍納入 blueprint，但不阻塞 Phase I/II。

| Phase | Area | Scope | 現在要保留什麼 | 提醒 |
|---|---|---|---|---|
| Phase III | Partner / B2B / Warranty Sync | partner/builder/warranty context aware、brand RMA sync、builder project sync | partner role、brand/project/warranty fields、visibility boundary | 權限與合約規則確定後才開放 |
| Phase IV | AI Ops Governance | RAG/SOP versioning、Eval、feedback loop、quality review、rollback | action audit、source version、Eval hooks、forbidden action tests | Phase I 先做 basic guardrails |
| Phase V | AI KPI / Observability | resolution rate、handoff rate、failure rate、cost、latency | event logs、quality signals、AI action trace | KPI 等 production data 後凍結 |

## A M01 進線Debounce

> M01 進線Debounce：LINE 入口與訊息合併

> Chatbot module detail：保留建議預設答案、Gate 與 coding 檢查題。

> 模組規則 / Gate

| Rule ID | 規則範圍 | 建議預設答案 | 負責人 | 是否阻擋 Coding | 營運 備註 |
|---|---|---|---|---|---|
| BR-M01-01 | 核心責任 | 文字/媒體/貼圖分流；buffer_wait 合併；media pending 補齊 | LINE owner | 部分 |  |
| BR-M01-02 | 主要輸出 | merged turn | LINE owner | 否 |  |
| BR-M01-03 | 上線 Gate | 有對應測試、audit 與 rollback 才能 release | Tech Lead | 是 |  |
| 模組 Q&A / Coding 檢查題 |  |  |  |  |  |
| QID | 需確認問題 / Coding檢查題 | ERP / AI 建議答案 | Owner | PRD 影響 | 決策狀態 |
| Q-M01-01 | LINE 入口與訊息合併 的最小可接受上線條件是什麼？ | 先採本頁 Gate；重大風險交主管審批。 | LINE owner | Acceptance criteria |  |
| Q-M01-02 | LINE 入口與訊息合併 是否需要同步到 ERP 工單？ | 依資料輸出決定。 | ERP owner | Integration |  |

## A M02 品牌型號Profile

> M02 品牌型號Profile：Quick Reply + facts

> Chatbot module detail：保留建議預設答案、Gate 與 coding 檢查題。

> 模組規則 / Gate

| Rule ID | 規則範圍 | 建議預設答案 | 負責人 | 是否阻擋 Coding | 營運 備註 |
|---|---|---|---|---|---|
| BR-M02-01 | 核心責任 | 品牌未知問品牌；型號缺失問型號；facts 寫 DB | 客服主管 | 部分 |  |
| BR-M02-02 | 主要輸出 | device facts | 客服主管 | 否 |  |
| BR-M02-03 | 上線 Gate | 有對應測試、audit 與 rollback 才能 release | Tech Lead | 是 |  |
| 模組 Q&A / Coding 檢查題 |  |  |  |  |  |
| QID | 需確認問題 / Coding檢查題 | ERP / AI 建議答案 | Owner | PRD 影響 | 決策狀態 |
| Q-M02-01 | Quick Reply + facts 的最小可接受上線條件是什麼？ | 先採本頁 Gate；重大風險交主管審批。 | 客服主管 | Acceptance criteria |  |
| Q-M02-02 | Quick Reply + facts 是否需要同步到 ERP 工單？ | 依資料輸出決定。 | ERP owner | Integration |  |

## A M03 ReAct Agent

> M03 ReAct Agent：LangGraph + tools

> Chatbot module detail：保留建議預設答案、Gate 與 coding 檢查題。

> 模組規則 / Gate

| Rule ID | 規則範圍 | 建議預設答案 | 負責人 | 是否阻擋 Coding | 營運 備註 |
|---|---|---|---|---|---|
| BR-M03-01 | 核心責任 | load_skill、update_user_info、transfer_to_human | AI engineer | 部分 |  |
| BR-M03-02 | 主要輸出 | AI 回覆/工具紀錄 | AI engineer | 否 |  |
| BR-M03-03 | 上線 Gate | 有對應測試、audit 與 rollback 才能 release | Tech Lead | 是 |  |
| 模組 Q&A / Coding 檢查題 |  |  |  |  |  |
| QID | 需確認問題 / Coding檢查題 | ERP / AI 建議答案 | Owner | PRD 影響 | 決策狀態 |
| Q-M03-01 | LangGraph + tools 的最小可接受上線條件是什麼？ | 先採本頁 Gate；重大風險交主管審批。 | AI engineer | Acceptance criteria |  |
| Q-M03-02 | LangGraph + tools 是否需要同步到 ERP 工單？ | 依資料輸出決定。 | ERP owner | Integration |  |

## A M04 Skill知識庫

> M04 Skill知識庫：SKILL.md

> Chatbot module detail：保留建議預設答案、Gate 與 coding 檢查題。

> 模組規則 / Gate

| Rule ID | 規則範圍 | 建議預設答案 | 負責人 | 是否阻擋 Coding | 營運 備註 |
|---|---|---|---|---|---|
| BR-M04-01 | 核心責任 | 路徑 metadata 控制品牌/型號，router skill 引導子技能 | Knowledge owner | 部分 |  |
| BR-M04-02 | 主要輸出 | SOP 知識 | Knowledge owner | 否 |  |
| BR-M04-03 | 上線 Gate | 有對應測試、audit 與 rollback 才能 release | Tech Lead | 是 |  |
| 模組 Q&A / Coding 檢查題 |  |  |  |  |  |
| QID | 需確認問題 / Coding檢查題 | ERP / AI 建議答案 | Owner | PRD 影響 | 決策狀態 |
| Q-M04-01 | SKILL.md 的最小可接受上線條件是什麼？ | 先採本頁 Gate；重大風險交主管審批。 | Knowledge owner | Acceptance criteria |  |
| Q-M04-02 | SKILL.md 是否需要同步到 ERP 工單？ | 依資料輸出決定。 | ERP owner | Integration |  |

## A M05 安全驗證

> M05 安全驗證：Safety + output validator

> Chatbot module detail：保留建議預設答案、Gate 與 coding 檢查題。

> 模組規則 / Gate

| Rule ID | 規則範圍 | 建議預設答案 | 負責人 | 是否阻擋 Coding | 營運 備註 |
|---|---|---|---|---|---|
| BR-M05-01 | 核心責任 | 危險字、內部話術、轉真人 guard | AI QA | 部分 |  |
| BR-M05-02 | 主要輸出 | validated response | AI QA | 否 |  |
| BR-M05-03 | 上線 Gate | 有對應測試、audit 與 rollback 才能 release | Tech Lead | 是 |  |
| 模組 Q&A / Coding 檢查題 |  |  |  |  |  |
| QID | 需確認問題 / Coding檢查題 | ERP / AI 建議答案 | Owner | PRD 影響 | 決策狀態 |
| Q-M05-01 | Safety + output validator 的最小可接受上線條件是什麼？ | 先採本頁 Gate；重大風險交主管審批。 | AI QA | Acceptance criteria |  |
| Q-M05-02 | Safety + output validator 是否需要同步到 ERP 工單？ | 依資料輸出決定。 | ERP owner | Integration |  |

## A M06 ProblemCard

> M06 ProblemCard：自動建立問題卡

> Chatbot module detail：保留建議預設答案、Gate 與 coding 檢查題。

> 模組規則 / Gate

| Rule ID | 規則範圍 | 建議預設答案 | 負責人 | 是否阻擋 Coding | 營運 備註 |
|---|---|---|---|---|---|
| BR-M06-01 | 核心責任 | facts 有 brand + 症狀足夠 → Admin API create | ERP backend | 部分 |  |
| BR-M06-02 | 主要輸出 | ProblemCard | ERP backend | 否 |  |
| BR-M06-03 | 上線 Gate | 有對應測試、audit 與 rollback 才能 release | Tech Lead | 是 |  |
| 模組 Q&A / Coding 檢查題 |  |  |  |  |  |
| QID | 需確認問題 / Coding檢查題 | ERP / AI 建議答案 | Owner | PRD 影響 | 決策狀態 |
| Q-M06-01 | 自動建立問題卡 的最小可接受上線條件是什麼？ | 先採本頁 Gate；重大風險交主管審批。 | ERP backend | Acceptance criteria |  |
| Q-M06-02 | 自動建立問題卡 是否需要同步到 ERP 工單？ | 需要，詳見第二份同步藍圖。 | ERP owner | Integration |  |

## A M07 真人轉接

> M07 真人轉接：transfer_to_human

> Chatbot module detail：保留建議預設答案、Gate 與 coding 檢查題。

> 模組規則 / Gate

| Rule ID | 規則範圍 | 建議預設答案 | 負責人 | 是否阻擋 Coding | 營運 備註 |
|---|---|---|---|---|---|
| BR-M07-01 | 核心責任 | 收電話/地址/設備/照片，帶已知 facts | 客服主管 | 部分 |  |
| BR-M07-02 | 主要輸出 | handoff form | 客服主管 | 否 |  |
| BR-M07-03 | 上線 Gate | 有對應測試、audit 與 rollback 才能 release | Tech Lead | 是 |  |
| 模組 Q&A / Coding 檢查題 |  |  |  |  |  |
| QID | 需確認問題 / Coding檢查題 | ERP / AI 建議答案 | Owner | PRD 影響 | 決策狀態 |
| Q-M07-01 | transfer_to_human 的最小可接受上線條件是什麼？ | 先採本頁 Gate；重大風險交主管審批。 | 客服主管 | Acceptance criteria |  |
| Q-M07-02 | transfer_to_human 是否需要同步到 ERP 工單？ | 需要，詳見第二份同步藍圖。 | ERP owner | Integration |  |

## A M08 多模態

> M08 多模態：圖片影音處理

> Chatbot module detail：保留建議預設答案、Gate 與 coding 檢查題。

> 模組規則 / Gate

| Rule ID | 規則範圍 | 建議預設答案 | 負責人 | 是否阻擋 Coding | 營運 備註 |
|---|---|---|---|---|---|
| BR-M08-01 | 核心責任 | 下載、儲存、替換 placeholder、checkpoint cleanup | AI/backend | 部分 |  |
| BR-M08-02 | 主要輸出 | media refs | AI/backend | 否 |  |
| BR-M08-03 | 上線 Gate | 有對應測試、audit 與 rollback 才能 release | Tech Lead | 是 |  |
| 模組 Q&A / Coding 檢查題 |  |  |  |  |  |
| QID | 需確認問題 / Coding檢查題 | ERP / AI 建議答案 | Owner | PRD 影響 | 決策狀態 |
| Q-M08-01 | 圖片影音處理 的最小可接受上線條件是什麼？ | 先採本頁 Gate；重大風險交主管審批。 | AI/backend | Acceptance criteria |  |
| Q-M08-02 | 圖片影音處理 是否需要同步到 ERP 工單？ | 依資料輸出決定。 | ERP owner | Integration |  |

## A M09 Eval觀測

> M09 Eval觀測：quality_check / audit

> Chatbot module detail：保留建議預設答案、Gate 與 coding 檢查題。

> 模組規則 / Gate

| Rule ID | 規則範圍 | 建議預設答案 | 負責人 | 是否阻擋 Coding | 營運 備註 |
|---|---|---|---|---|---|
| BR-M09-01 | 核心責任 | 67+ cases、LLM judge、token/cost | AI QA | 部分 |  |
| BR-M09-02 | 主要輸出 | quality report | AI QA | 否 |  |
| BR-M09-03 | 上線 Gate | 有對應測試、audit 與 rollback 才能 release | Tech Lead | 是 |  |
| 模組 Q&A / Coding 檢查題 |  |  |  |  |  |
| QID | 需確認問題 / Coding檢查題 | ERP / AI 建議答案 | Owner | PRD 影響 | 決策狀態 |
| Q-M09-01 | quality_check / audit 的最小可接受上線條件是什麼？ | 先採本頁 Gate；重大風險交主管審批。 | AI QA | Acceptance criteria |  |
| Q-M09-02 | quality_check / audit 是否需要同步到 ERP 工單？ | 依資料輸出決定。 | ERP owner | Integration |  |

## A M10 SOP螺旋

> M10 SOP螺旋：成功案例到 SOP

> Chatbot module detail：保留建議預設答案、Gate 與 coding 檢查題。

> 模組規則 / Gate

| Rule ID | 規則範圍 | 建議預設答案 | 負責人 | 是否阻擋 Coding | 營運 備註 |
|---|---|---|---|---|---|
| BR-M10-01 | 核心責任 | resolved + rating>=4 觸發 draft；待審核後入庫 | Knowledge owner | 部分 |  |
| BR-M10-02 | 主要輸出 | SOP draft | Knowledge owner | 否 |  |
| BR-M10-03 | 上線 Gate | 有對應測試、audit 與 rollback 才能 release | Tech Lead | 是 |  |
| 模組 Q&A / Coding 檢查題 |  |  |  |  |  |
| QID | 需確認問題 / Coding檢查題 | ERP / AI 建議答案 | Owner | PRD 影響 | 決策狀態 |
| Q-M10-01 | 成功案例到 SOP 的最小可接受上線條件是什麼？ | 先採本頁 Gate；重大風險交主管審批。 | Knowledge owner | Acceptance criteria |  |
| Q-M10-02 | 成功案例到 SOP 是否需要同步到 ERP 工單？ | 依資料輸出決定。 | ERP owner | Integration |  |

## A M11 部署健康

> M11 部署健康：Cloud Run/health

> Chatbot module detail：保留建議預設答案、Gate 與 coding 檢查題。

> 模組規則 / Gate

| Rule ID | 規則範圍 | 建議預設答案 | 負責人 | 是否阻擋 Coding | 營運 備註 |
|---|---|---|---|---|---|
| BR-M11-01 | 核心責任 | facts_db + audit_db health；DB reconnect | SRE | 部分 |  |
| BR-M11-02 | 主要輸出 | health status | SRE | 否 |  |
| BR-M11-03 | 上線 Gate | 有對應測試、audit 與 rollback 才能 release | Tech Lead | 是 |  |
| 模組 Q&A / Coding 檢查題 |  |  |  |  |  |
| QID | 需確認問題 / Coding檢查題 | ERP / AI 建議答案 | Owner | PRD 影響 | 決策狀態 |
| Q-M11-01 | Cloud Run/health 的最小可接受上線條件是什麼？ | 先採本頁 Gate；重大風險交主管審批。 | SRE | Acceptance criteria |  |
| Q-M11-02 | Cloud Run/health 是否需要同步到 ERP 工單？ | 依資料輸出決定。 | ERP owner | Integration |  |

## A M12 PRD治理

> M12 PRD治理：決策與 source trace

> Chatbot module detail：保留建議預設答案、Gate 與 coding 檢查題。

> 模組規則 / Gate

| Rule ID | 規則範圍 | 建議預設答案 | 負責人 | 是否阻擋 Coding | 營運 備註 |
|---|---|---|---|---|---|
| BR-M12-01 | 核心責任 | 每個 gate 對應 owner、狀態、source | PM/Tech Lead | 部分 |  |
| BR-M12-02 | 主要輸出 | final PRD inputs | PM/Tech Lead | 否 |  |
| BR-M12-03 | 上線 Gate | 有對應測試、audit 與 rollback 才能 release | Tech Lead | 是 |  |
| 模組 Q&A / Coding 檢查題 |  |  |  |  |  |
| QID | 需確認問題 / Coding檢查題 | ERP / AI 建議答案 | Owner | PRD 影響 | 決策狀態 |
| Q-M12-01 | 決策與 source trace 的最小可接受上線條件是什麼？ | 先採本頁 Gate；重大風險交主管審批。 | PM/Tech Lead | Acceptance criteria |  |
| Q-M12-02 | 決策與 source trace 是否需要同步到 ERP 工單？ | 依資料輸出決定。 | ERP owner | Integration |  |

## S M01 Intake資料捕捉

> M01 Intake資料捕捉：從 LINE/user turn 萃取可結構化資訊

> Sync module detail：保留同步規則、Gate 與 coding 檢查題。

> 模組規則 / Gate

| Rule ID | 規則範圍 | 建議預設答案 | 主要輸出 | Gate | Owner | 營運 備註 |
|---|---|---|---|---|---|---|
| BR-M01-01 | 資料輸入 | 從 LINE/user turn 萃取可結構化資訊 | channel、raw_text、media_ref、reply context | 不要直接開 WO | 客服/AI |  |
| BR-M01-02 | 失敗處理 | 所有同步失敗需可重試、可查詢、可人工補償 | outbox/audit | no silent fail | Backend/SRE |  |
| BR-M01-03 | PRD trace | 本模組需在 final PRD 標示 FR/API/DB/test 對應 | trace row | TR4 | PM |  |

## S M02 Facts主檔同步

> M02 Facts主檔同步：phone/address/device facts 與 ERP customer/site/device 對齊

> Sync module detail：保留同步規則、Gate 與 coding 檢查題。

> 模組規則 / Gate

| Rule ID | 規則範圍 | 建議預設答案 | 主要輸出 | Gate | Owner | 營運 備註 |
|---|---|---|---|---|---|---|
| BR-M02-01 | 資料輸入 | phone/address/device facts 與 ERP customer/site/device 對齊 | user_facts、users | PII 與 SCD2 | Data steward |  |
| BR-M02-02 | 失敗處理 | 所有同步失敗需可重試、可查詢、可人工補償 | outbox/audit | no silent fail | Backend/SRE |  |
| BR-M02-03 | PRD trace | 本模組需在 final PRD 標示 FR/API/DB/test 對應 | trace row | TR4 | PM |  |

## S M03 ProblemCard轉換

> M03 ProblemCard轉換：symptom/brand/model/category/urgency/media_urls 建卡

> Sync module detail：保留同步規則、Gate 與 coding 檢查題。

> 模組規則 / Gate

| Rule ID | 規則範圍 | 建議預設答案 | 主要輸出 | Gate | Owner | 營運 備註 |
|---|---|---|---|---|---|---|
| BR-M03-01 | 資料輸入 | symptom/brand/model/category/urgency/media_urls 建卡 | problem_cards | complete gate | ERP backend |  |
| BR-M03-02 | 失敗處理 | 所有同步失敗需可重試、可查詢、可人工補償 | outbox/audit | no silent fail | Backend/SRE |  |
| BR-M03-03 | PRD trace | 本模組需在 final PRD 標示 FR/API/DB/test 對應 | trace row | TR4 | PM |  |

## S M04 ConvertToWO

> M04 ConvertToWO：confirmed PC 轉 created WO

> Sync module detail：保留同步規則、Gate 與 coding 檢查題。

> 模組規則 / Gate

| Rule ID | 規則範圍 | 建議預設答案 | 主要輸出 | Gate | Owner | 營運 備註 |
|---|---|---|---|---|---|---|
| BR-M04-01 | 資料輸入 | confirmed PC 轉 created WO | work_orders | idempotency + address | Backend |  |
| BR-M04-02 | 失敗處理 | 所有同步失敗需可重試、可查詢、可人工補償 | outbox/audit | no silent fail | Backend/SRE |  |
| BR-M04-03 | PRD trace | 本模組需在 final PRD 標示 FR/API/DB/test 對應 | trace row | TR4 | PM |  |

## S M05 Dispatch同步

> M05 Dispatch同步：WO created 後進派工 queue、候選技師、SLA

> Sync module detail：保留同步規則、Gate 與 coding 檢查題。

> 模組規則 / Gate

| Rule ID | 規則範圍 | 建議預設答案 | 主要輸出 | Gate | Owner | 營運 備註 |
|---|---|---|---|---|---|---|
| BR-M05-01 | 資料輸入 | WO created 後進派工 queue、候選技師、SLA | dispatch queue | no candidates fallback | 派工主管 |  |
| BR-M05-02 | 失敗處理 | 所有同步失敗需可重試、可查詢、可人工補償 | outbox/audit | no silent fail | Backend/SRE |  |
| BR-M05-03 | PRD trace | 本模組需在 final PRD 標示 FR/API/DB/test 對應 | trace row | TR4 | PM |  |

## S M06 Evidence回寫

> M06 Evidence回寫：照片、簽名、完工報告、付款證明回寫

> Sync module detail：保留同步規則、Gate 與 coding 檢查題。

> 模組規則 / Gate

| Rule ID | 規則範圍 | 建議預設答案 | 主要輸出 | Gate | Owner | 營運 備註 |
|---|---|---|---|---|---|---|
| BR-M06-01 | 資料輸入 | 照片、簽名、完工報告、付款證明回寫 | evidence/work_order_events | RMA/爭議 | 技師主管 |  |
| BR-M06-02 | 失敗處理 | 所有同步失敗需可重試、可查詢、可人工補償 | outbox/audit | no silent fail | Backend/SRE |  |
| BR-M06-03 | PRD trace | 本模組需在 final PRD 標示 FR/API/DB/test 對應 | trace row | TR4 | PM |  |
