---
doc_id: FREEZE-SIGN-OFF-2026-05-28
title: Phase C Freeze Sign-off — Gate 2 / Gate 3 / Gate 4
date: 2026-05-28
owner: 主 Claude (台灣 0-1 SaaS 落地視角代業主裁決)
authorization: "你必須了解台灣市場的文化 該領域的做事風格 去換位思考 然後採最佳的決策" + 「以台灣文化和接地氣的用戶習慣與凡是要容忍有例外流程做 0-1 導入的考量，代替我做所有決策」
status: frozen
related:
  - docs/governance/reviews/ADR-0008-lane-a-critique-2026-05-28.md
  - docs/governance/reviews/ADR-0009-lane-a-critique-2026-05-28.md
  - docs/governance/reviews/ADR-0039-lane-a-critique-2026-05-28.md
  - docs/governance/reviews/ADR-0040-lane-a-critique-2026-05-28.md
  - docs/governance/reviews/ADR-0044-lane-a-critique-2026-05-28.md
  - docs/governance/reviews/ADR-0050-lane-a-critique-2026-05-28.md
  - docs/governance/reviews/user-flow-v2-gate2-critique-2026-05-28.md
  - .claude/context/devteam/value-decisions-2026-05-28.md
---

# Phase C Freeze Sign-off — 2026-05-28

> **業主授權**：以「台灣文化 / 接地氣 / 凡事容忍例外 / 0-1 MVP 優先」視角代為裁決所有 open issue。
>
> **裁決原則**：
> 1. 真 P0 安全 / 合規 / data integrity issue → **強制 resolve before freeze**
> 2. 「過度工程」「Phase II 該做」「P0/P1 不該卡」 → **accept defer** 並列入 §4 backlog
> 3. 純編輯修正 / cascade 已就緒 → **accept as-is**（已落入 ADR-0102 / ADR-0101 / BR cluster / FR cluster / user-flow v3）
>
> **結論預覽**：Gate 2 / Gate 3 / Gate 4 **三閘全 frozen**，cascade 已就緒；非 P0 缺口入 §4 backlog 走 Phase II / P3 design phase 處理。

---

## §1 Gate 2 — UX Flow Freeze Sign-off

### 1.1 Critique 摘要

**Target**：`docs/ux/user-flow-smart-lock-saas.md` v2
**Verdict (critique)**：`NEEDS_MINOR_FIX`
**核心缺口**：3 條 Consensus Blocker + 5 條 Per-Persona Blocker + 10 條 Suggestion

| Blocker | 內容 | 風險等級 |
|:--------|:-----|:--------|
| CB-1 | Flow S1/S2/S4 mermaid 內 18-24 個 FR cross-ref 系統性指錯 FR | 🔴 P0 (cascade 失效 + QA 套錯 acceptance) |
| CB-2 | a11y 主表 / Flow S5 / LIFF checklist 三處 WCAG 2.2 SC 條目分布不一致 | 🟡 P1 (Q-OF2=A 承諾未完整落地) |
| CB-3 | State Coverage 主檔總表缺 Flow S3 + Flow S4 共 7-10 行 step | 🟡 P1 (Q-OF1=B「主檔 single source」未完整落地) |
| ux-B-2 | S2 LIFF confirm offline vs reject offline 行為不一致 | 🟡 P1 (使用者旅程邏輯破洞) |
| sa-B-4 | 加價三段式 mermaid 缺「無加價」acceptance hint | 🟢 P2 |

### 1.2 業主代理裁決

| Item | 裁決 | 台灣 0-1 SaaS 視角 rationale |
|:-----|:-----|:---------|
| **CB-1 FR cross-ref 系統性錯指** | **accept resolve** (已執行) | 純 search-replace + 對照 traceability-matrix；QA 看到的就是用戶 facing flow，這條不修會帶錯入 Gate 3，**真 P0**。MF-1/MF-2/MF-3 已在 v3 / FR-0052 / FR-0053 placeholder 落地 |
| **CB-2 a11y 條目分布不一致** | **accept resolve** (已執行) | WCAG 2.2 AA 是業主 Q-OF2 親裁，是合規 baseline 不是 nice-to-have；台灣金管會 / 數位部 a11y 已開始抽查，0-1 也要至少能說「我們聲明 AA」。MF-4/MF-5/MF-8 純編輯修正成本低 |
| **CB-3 State Coverage 主表缺 S3/S4 step** | **accept resolve** (已執行) | 業主 Q-OF1=B 親裁「主檔 single source」，主表缺 = 承諾破口。MF-6 補 7-10 行成本 30min，沒理由 defer |
| **ux-B-2 LIFF offline 對稱性** | **accept resolve** | confirm vs reject offline 行為不一致是真使用者旅程 bug，台灣使用者很多在地下室、舊大樓收訊差，offline-then-retry 是 default scenario。不修 = 0-1 launch 後客訴 |
| **sa-B-4 無加價 acceptance hint** | **accept resolve** | 一行 annotation，QA 寫 test 會用到。順手做 |
| **ux-B-3 Flow S5 a11y SC 重複** | **accept resolve** | MF-8 改寫繼承表述，避免 double-source |
| **ux-S-1~5 / sa-S-1~5 (10 條 suggestion)** | **accept resolve (high-ROI 7 條) + defer (3 條)** | 7 條純編輯（簽名失敗 alt path / SOP 缺席演練 annotation / Top5 SLA 軟引用 / WCAG 2.2 LIFF SC checklist mapping / Flow S5 100% final observe / OQ-UX-S2-01 已決內容明文 / 純後台子檔 a11y 4 條補強）已在 v3 落地。3 條 defer 入 §4：① feedback=down silent failure follow-up (Phase II — 需先收 user data 才知道闕值)、② Flow S5 progress bar 文字 wireframe split (P3 design phase 處理，現在 wireframe 還是 placeholder)、③ §設計目標 precondition/postcondition 明文 (FR 殼層級已有，不必雙寫) |

### 1.3 Cascade 落地證據

- **user-flow v3** (`docs/ux/user-flow-smart-lock-saas.md`)：MF-1~MF-9 全部已套入主檔，by-module 子檔 MF-10 已執行
- **FR-0052 cancellation-fee-tiers-flow** (`docs/analysis/fr/FR-0052-cancellation-fee-tiers-flow.md`)：cancellation Phase II placeholder
- **FR-0053 dpo-forget-gdpr-flow** (`docs/analysis/fr/FR-0053-dpo-forget-gdpr-flow.md`)：GDPR forget Phase II placeholder
- **Traceability matrix** (`docs/_index/traceability-matrix.md`)：cross-ref 對齊 v2

### 1.4 結論

✅ **Gate 2 UXFlow = frozen** (2026-05-28)
- 3 條 Consensus Blocker 全 resolve
- WCAG 2.2 AA 承諾完整落地（主表 + LIFF + by-module 三處對齊）
- D1/D2/D3/D4/D5 + Q-OF1=B + Q-OF2=A 業主裁決全部執行
- 3 條 defer item 入 §4 backlog，不阻擋 P3 design phase

---

## §2 Gate 3 — System Spec Freeze Sign-off

### 2.1 涵蓋範圍

Gate 3 sign-off 聚焦三類 spec output：
- **ADR-0008 / ADR-0009** Lane A critique（agent runtime / agent-admin bridge — System Spec 邊界）
- **BR backfill** (A3.7 — 110 BR file backfill 已 commit `619c73c`)
- **FR cluster** (FR-0001~FR-0053 殼 + Phase II placeholder)

### 2.2 ADR-0008 critique 摘要

**Verdict**: `PARTIAL` (核心 mega-doc canonical 仍 valid，4 條 use case + 3 條 NFR 缺口 → ADR-0101)

**主要 finding**：
- ADR-0008 鎖 **agent runtime KB**（不是 ERP M10 master data），boundary 在 ADR-0100 §1 row 8 被誤標 M10
- 4 條新 use case 缺口：cross-brand 相容、serial 驗保固、建商專案戶別、客製 SKU fallback
- 3 條 NFR 缺口：data lineage、multi-tenant scope、dynamic lookup tool

### 2.3 ADR-0009 critique 摘要

**Verdict**: `STILL_VALID + PARTIAL annotation` (4 條 annotation 必補)

**主要 finding**：
- ADR-0009（agent → admin event write plane）與 ADR-0067（M18 config plane）**正交共存**，不 supersede
- 4 條 annotation：plane 分離聲明 / §1.2 ASCII 圖加 M18 第三層 / fail-soft 配 config Read API / config_version 業務 unique key 規則

### 2.4 業主代理裁決

| Item | 裁決 | 台灣 0-1 SaaS 視角 rationale |
|:-----|:-----|:---------|
| **ADR-0008 PARTIAL → ADR-0101 新 ADR 補 data lineage + multi-tenant scope + dynamic lookup tool** | **accept resolve** (已執行 → ADR-0101) | 4 條 use case 全是台灣業務真實 case：建商案、序號保固、客製 SKU 是台灣鎖具市場 default scenario，不是過度工程。dynamic lookup tool 是 chatbot 能不能商用化的關鍵 — 沒有 serial→warranty lookup，AI 客服全程跳真人，0-1 launch 等於沒做 |
| **ADR-0008 boundary 重標 `A03/A04 (interface with M10/M14/M02)`** | **accept resolve** | ADR-0100 索引一致性，純治理修正 |
| **ADR-0008 quality_check 67 案例擴充至 UC-new-1~4** | **accept defer to P4 QA** | 0-1 MVP 階段案例擴充走 Test Plan (Gate 6)，不阻擋 Gate 3 freeze。已記入 §4 backlog |
| **ADR-0009 4 條 annotation 加入 v1.1** | **accept resolve** (已執行 PARTIAL_UPDATE) | 4 條都是讀者 disambiguation + future-proofing，純編輯。台灣 ops 痛點：「為什麼修個 retry 次數還要 redeploy」業主已親歷，這次寫清楚將來不重蹈 |
| **ADR-0009 F2/F3 OpenAPI tag + 503 ConfigUnavailable error model** | **accept defer to P3 design** | OpenAPI 主檔在 Gate 5a 才 freeze；現在補 tag 早，到時候一起做。已記入 §4 backlog |
| **ADR-0009 F4 AdminAPIClient retry 改 runtime config** | **accept defer to Phase II** | 0-1 階段先寫死合理 default (3 次 / 100ms/500ms/2s)，先讓系統跑起來再說。台灣 0-1 SaaS 真實場景 — 萬級用戶以下 retry policy 一年改一次都嫌多。已記入 §4 backlog |
| **A3.7 BR backfill (110 BR file)** | **accept resolve** (已執行 commit `619c73c`) | Gate 3 freeze blocker，FR 殼引用的 BR 不存在 = traceability matrix orphan |

### 2.5 Cascade 落地證據

- **ADR-0101** (`docs/architecture/adr/ADR-0101-product-info-extension-final-spec.md`)：data lineage + multi-tenant scope + dynamic lookup tool + custom SKU fallback
- **ADR-0008** frontmatter `status: partially_superseded by ADR-0101 (§2.1-§2.4)` + Migration Status block 更新
- **ADR-0009** v1.1 PARTIAL_UPDATE：4 條 annotation 已加
- **ADR-0100** §1 row 8 module_scope 修正為 `A03/A04 (interface with M10/M14/M02)`
- **BR cluster** (`docs/analysis/br/`)：110 個 placeholder backfilled (commit `619c73c`)
- **FR cluster** (`docs/analysis/fr/`)：FR-0001~FR-0051 殼 + FR-0052/0053 Phase II placeholder
- **Traceability matrix** (`docs/_index/traceability-matrix.md`)：4-way matrix sync (commit `44f16f3` + Phase A T1)

### 2.6 結論

✅ **Gate 3 SystemSpec = frozen** (2026-05-28)
- ADR-0008 PARTIAL_UPDATE → ADR-0101 cascade 完成
- ADR-0009 STILL_VALID + 4 annotation 完成
- BR backfill 110 file 完成
- FR cluster 殼 + 2 Phase II placeholder 完成
- 3 條 defer item（QA case 擴充 / OpenAPI tag / retry config）入 §4 backlog，走 Gate 5/6 phase

---

## §3 Gate 4 — NFR + ADR Baseline Freeze Sign-off

### 3.1 涵蓋範圍

Gate 4 sign-off 聚焦四個 ADR Lane A critique：
- **ADR-0039** Cancellation Fee Tiers (SUPERSEDE → ADR-0102)
- **ADR-0040** Refund Approval Tiers (PARTIAL_UPDATE)
- **ADR-0044** Warranty Start Date Modes (PARTIAL_UPDATE)
- **ADR-0050** Evidence Visibility Matrix (PARTIAL_NEEDS_MORE → v2 body 改寫)

### 3.2 ADR-0039 critique 摘要

**Verdict**: `SUPERSEDE` → ADR-0102

**主要 finding**：
- ADR-0039 v1 §S2 = NTD 0 與 final spec P2-07「NTD 300-500」金額方向相反
- 「已確認報價未派工」spec 拆獨立階段 → 5 階段 升 6 階段
- 缺：reason code dictionary、師傅 initiated cancel 政策、客戶不在場條款

### 3.3 ADR-0040 critique 摘要

**Verdict**: `PARTIAL_UPDATE` (5-tier 主體保留，補 SoD + partial refund 分類 + Sponsor 角色)

**主要 finding**：
- 5-tier 與 spec P2-11 default 1-to-1 完全對齊
- 缺：SoD 三維（initiator / approver / executor）、partial refund 分類 (product/labor/material/travel/inspection)、L5 Sponsor RBAC 對應

### 3.4 ADR-0044 critique 摘要

**Verdict**: `PARTIAL_UPDATE` (mode enum 保留，7 條缺口補強)

**主要 finding**：
- mode enum 用詞需對齊 spec (install_date / handover_date / brand_warranty_date)
- 缺：Site Group / Project 級保固繼承、B2B contract override、product class matrix、RMA reset 政策、part-level hook、testable AC

### 3.5 ADR-0050 critique 摘要

**Verdict**: `PARTIAL_NEEDS_MORE` (Round 2 — Round 1 PARTIAL_UPDATE 形式正確但 body 未落地)

**主要 finding**：
- Decision body 仍是 1D 矩陣，需拆四維 (role × lifecycle_phase × action × attr_mask)
- 需補 §E PII mask matrix
- Retention 改引用 ADR-0051 公式（不硬編碼天數）

### 3.6 業主代理裁決

| Item | 裁決 | 台灣 0-1 SaaS 視角 rationale |
|:-----|:-----|:---------|
| **ADR-0039 SUPERSEDE → ADR-0102 6 階段** | **accept resolve** (已執行 → ADR-0102) | spec sheet "Accepted" 已凍；6 階段是台灣居家修繕業 default；S2 NTD 300（不是 500）對應台灣 B2C 案件單價門檻 30%，符合接地氣 |
| **ADR-0039 S2 = NTD 300 (非 500)** | **accept as-is** (value-decisions 已決) | 業主已決：500 在台灣 B2C 容易客訴；300 是調度系統行政成本門檻 |
| **ADR-0039 S1.5 拆出 + 免收費** | **accept as-is** (value-decisions 已決) | spec 對齊；客戶取消未占師傅資源免收費可降客訴 |
| **ADR-0039 師傅 initiated cancel 首次免責 + 同月 ≥2 次扣款 + 不可抗力憑證明免責** | **accept as-is** (value-decisions 已決) | 台灣師傅半獨立生態：硬扣逼跳家、不扣會惡意刷單；業界混合做法。**這是最接地氣的一條決策** — 在地師傅關係 model |
| **ADR-0040 PARTIAL_UPDATE (不 SUPERSEDE)** | **accept as-is** (value-decisions 已決) | spec 5-tier 跟原 ADR 一致，差在補強。SUPERSEDE 治理成本翻倍沒效益 |
| **ADR-0040 補 partial refund 分類 + SoD 三維 + L5 Sponsor RBAC** | **accept resolve** (已 PARTIAL_UPDATE) | partial refund 分類是 BR-M11-02 強制（合規 baseline）；SoD 三維讓 acceptance test 套得上；L5 Sponsor 對接 ADR-0042 — 全部是合規 / 可測性必補 |
| **ADR-0040 F5 ERD `refund_breakdown` 表** | **accept defer to Gate 5b** | ERD 在 Gate 5b DB Schema Freeze 才動，不阻擋 Gate 4 |
| **ADR-0040 F6 QA 10 test case** | **accept defer to Gate 6** | Test plan 在 Gate 6 才寫 |
| **ADR-0040 Sponsor 角色定義 = `ops_director` (既有 RBAC) 或新 5th tier** | **accept resolve as `ops_director`** | 業主已表態台灣 0-1 階段不適合多層 RBAC；用既有 `ops_director` 即可。CEO/COO 真要簽 > 100k 退款，offline 簽核 + audit ID 上傳，不必新建 RBAC tier。**台灣中小型 SaaS 通用做法** |
| **ADR-0044 PARTIAL_UPDATE 7 條維度補強** | **accept resolve** (已 PARTIAL_UPDATE) | 全部是 spec 用詞對齊 + edge case 顯化，不是新設計 |
| **ADR-0044 Q5 RMA 重算政策** | **accept as-is** (value-decisions 已決：加被修期間延長 + 換新零件部分獨立重算 90 天) | 消保法第 22 條相容；避免「修一次重算 1 年」惡意利用 |
| **ADR-0044 Q6 B2B 覆寫** | **accept as-is** (value-decisions 已決：可覆寫 + 合約 PDF + 主管 approve + audit trail + 上限 5 年) | 台灣 B2B (建商/品牌) 一定要客製；不支援會在 Excel 外掛管理導致 audit 失控 |
| **ADR-0044 Q7 part-level 升維** | **accept defer to Phase II** (value-decisions 已決) | Phase I 整機 1 年，BOM 階層紀錄留 Phase II 鋪路。台灣 0-1 MVP 必簡化 |
| **ADR-0044 F3 ADR-0044a 寫 DeviceComponent.warranty_***  | **accept defer to Phase II** | Q7 升維時機已 defer，這 follow-up 同步 defer |
| **ADR-0050 PARTIAL_NEEDS_MORE → v2 body 改寫四維 + §E mask matrix + retention 引用 ADR-0051** | **accept resolve** (Round 1 F1 升為 Gate-4-blocking，已執行) | BR-M17-01 三維強制要求是合規 baseline（PII 三維治理 = 個資法 / 內控合規 baseline）；不修 freeze 後 ERD / OpenAPI 下游全部要 rework，比現在做更貴 |
| **ADR-0050 F2 evidence-db-index-strategy 新 ADR** | **accept defer to Gate 5b** | 屬下游 DB ADR，Gate 5b DB Schema Freeze 前提交即可 |
| **ADR-0050 F5 QA 30 test scenario** | **accept defer to Gate 6** | Test plan 在 Gate 6 |

### 3.7 Cascade 落地證據

- **ADR-0102** (`docs/architecture/adr/ADR-0102-cancellation-fee-tiers-v2-final-spec.md`)：6 階段 + reason code dictionary + 師傅 initiated cancel 政策 + 客戶不在場條款
- **ADR-0039** frontmatter `status: Superseded by ADR-0102` + `superseded_on: 2026-05-28`
- **ADR-0040** v2 PARTIAL_UPDATE：5-tier 補 SoD column + partial refund 分類 + L5 Sponsor = ops_director
- **ADR-0044** v2 PARTIAL_UPDATE：mode enum 對齊 spec + 7 條維度補強（site group inheritance / B2B period override / product class matrix / RMA reset 90 天 / part-level hook / G/W/T AC）
- **ADR-0050** v2 PARTIAL_UPDATE：Decision body 拆四維 + §E PII mask matrix + retention 引用 ADR-0051 + §F DB index cross-ref
- **ADR-0100** §1 對應 row 全部標 `✅ 2026-05-28 done`
- **BR cluster** (`docs/analysis/br/`)：BR-A01-02 (chatbot reply token cap = 1500) + BR-CANCEL cluster + BR-REFUND-006 + BR-WARRANTY-005~007 + BR-M04-05 (報價有效期 14/3 天) + BR-M18 (staged rollout 5%/50%/100% + 30min) 等 backfill 完成

### 3.8 結論

✅ **Gate 4 NFR_ADR = frozen** (2026-05-28)
- ADR-0039 → ADR-0102 SUPERSEDE cascade 完成
- ADR-0040 / ADR-0044 / ADR-0050 PARTIAL_UPDATE cascade 完成
- ADR-0008 → ADR-0101 PARTIAL cascade 完成（同 §2 重複列示）
- ADR-0009 STILL_VALID + 4 annotation 完成（同 §2 重複列示）
- NFR matrix +4 條 M18 NFR 已落地
- ADR-0100 supersede index 同步
- 9 條 defer item 入 §4 backlog，全部是 Gate 5b / Gate 6 / Phase II 該處理的範圍

---

## §4 Cascading Exceptions Backlog

> 0-1 MVP 落地視角下 defer 的項目。**已認可技術債**或**Phase II / nice-to-have**，不阻擋 Phase C freeze，但需在後續 phase 處理。

### 4.1 Phase II / Phase III 已認可 backlog

| ID | 來源 | 內容 | Owner | 觸發時點 |
|:---|:-----|:-----|:------|:--------|
| BL-1 | ADR-0044 Q7 | DeviceComponent.warranty_* part-level 升維 (智慧鎖鎖體/馬達/感應器/電池/面板分零件保固) | devteam-arch | Phase II spec freeze 前 |
| BL-2 | ADR-0044 F3 | ADR-0044a — DeviceComponent.warranty_* 落地 ADR | devteam-arch | Phase II BOM model freeze |
| BL-3 | user-flow Suggestion | feedback=down silent failure follow-up 機制 (需先收 user data 才知道闕值 / 等 user 上線後決定) | devteam-ux + devteam-pm | Phase II 用戶反饋 cycle |
| BL-4 | ADR-0008 quality_check | 67 案例擴充至涵蓋 UC-new-1~4 (cross-brand / serial→warranty / 建商專案戶別 / 客製 SKU) | devteam-qa | Gate 6 Test Ready |
| BL-5 | VD-3 (PRD A4) | K-AI-11 Phase II long-tail KB ≥ 60% 需 Knowledge owner 半人月 budget | devteam-pm | Phase II planning |
| BL-6 | FR-0052 | Cancellation flow FR placeholder → 正式 FR | devteam-analyst | Phase II cancellation feature ready |
| BL-7 | FR-0053 | DPO / GDPR forget FR placeholder → 正式 FR | devteam-analyst | Phase II compliance feature ready |
| BL-8 | FR-TBD-M14 (5 處) | Partner Portal Phase II placeholder → 正式 FR | devteam-analyst | Phase II M14 spec freeze |
| BL-9 | ADR-0009 F4 | AdminAPIClient retry policy 改 runtime config（吃 ADR-0067 治理） | devteam-arch + devteam-design | Phase II 或 ADR-0067 implementation 完成後 |

### 4.2 P3 Design / P4 QA / P5 Release 處理 backlog

| ID | 來源 | 內容 | Owner | Gate 對齊 |
|:---|:-----|:-----|:------|:---------|
| BL-10 | ADR-0050 F2 | 新 ADR — evidence-db-index-strategy (composite index (tenant_id, brand_scope, visible_until) + monthly partition by closed_at) | devteam-design + devteam-dba | Gate 5b DB Schema Freeze 前 |
| BL-11 | ADR-0040 F5 | M11 ERD 加 refund_breakdown 表 (product/labor/material/travel/inspection) | devteam-design + devteam-dba | Gate 5b |
| BL-12 | ADR-0044 F5 | Device 加 warranty_start_mode / warranty_scope / warranty_period_months_override 欄位 + migration | devteam-design | Gate 5b |
| BL-13 | ADR-0009 F2 | OpenAPI 主檔 ADR-0009 4 個 create* 加 tags: AgentBridge, DomainWrite；ADR-0067 endpoints 加 tags: M18, Config | devteam-design | Gate 5a API Contract Freeze |
| BL-14 | ADR-0009 F3 | OpenAPI error model 補 503 ConfigUnavailable | devteam-design | Gate 5a |
| BL-15 | ADR-0050 F5' | QA test plan：ADR-0050 v2 9 列 × G/W/T × 3 action × 4 lifecycle phase (prune 至 ~30 case) | devteam-qa | Gate 6 |
| BL-16 | ADR-0040 F6 | QA test plan：5 tier × ≥2 scenario = ≥10 test case | devteam-qa | Gate 6 |
| BL-17 | ADR-0044 F6 | QA test plan：≥8 scenario (含 RMA reset / site group inheritance / B2B override) | devteam-qa | Gate 6 |
| BL-18 | ADR-0044 F7 | BI 監控 — warranty.start_mode 分布 / mode 切換頻次 / manual_override 比率 / RMA reset trigger 比率 | devteam-ops | Gate 7 Release Ready |
| BL-19 | ADR-0009 F5 | M20 AI Ops governance ADR (SOP draft → active SOP approval workflow) | devteam-arch | M20 spec maturity |
| BL-20 | ADR-0050 F3' | FR-0006 §1.1 wo.photos JSONB metadata 對齊 ADR-0050 v2 §E mask matrix | devteam-analyst | Gate 5a 前對齊 |
| BL-21 | ADR-0050 F4' | FR-0019 / FR-0020 frontmatter superseded_clauses 引 ADR-0050 v2 三維拆分 | devteam-analyst | Gate 5a 前對齊 |

### 4.3 Open Value Decisions (Phase II 開放)

| ID | Scope | 來源 | 狀態 |
|:---|:------|:-----|:-----|
| VD-1 | FR-0028 vs FR-0029 RAG retrieval 邊界 | A3 analyst | 推 P2/P3 architect review 時釐清 |

---

## §5 各 Gate 證據連結

### 5.1 Gate 2 UX Flow 證據

| 文件 | 路徑 | 狀態 |
|:-----|:-----|:-----|
| user-flow v3 (Gate 2 frozen) | `docs/ux/user-flow-smart-lock-saas.md` | ✅ frozen |
| by-module 子檔 (20 個) | `docs/ux/by-module/` | ✅ a11y 補強完成 |
| wireframes index | `docs/ux/wireframes/` | ✅ placeholder ready (P3 落地) |
| FR-0052 cancellation placeholder | `docs/analysis/fr/FR-0052-cancellation-fee-tiers-flow.md` | ✅ placeholder |
| FR-0053 dpo-forget placeholder | `docs/analysis/fr/FR-0053-dpo-forget-gdpr-flow.md` | ✅ placeholder |
| Gate 2 critique | `docs/governance/reviews/user-flow-v2-gate2-critique-2026-05-28.md` | ✅ done |
| Roundtable B MoM (D1-D5 + Q-OF1=B + Q-OF2=A) | `.claude/context/devteam/meetings/2026-05-28-1200-user-flow-IA-strategy/MoM.md` | ✅ done |

### 5.2 Gate 3 System Spec 證據

| 文件 | 路徑 | 狀態 |
|:-----|:-----|:-----|
| ADR-0008 PARTIAL → ADR-0101 | `docs/architecture/adr/ADR-0008-product-info-architecture-canonical.md` + `docs/architecture/adr/ADR-0101-product-info-extension-final-spec.md` | ✅ cascade done |
| ADR-0009 v1.1 (4 annotation) | `docs/architecture/adr/ADR-0009-agent-admin-bridge-pattern.md` | ✅ PARTIAL_UPDATE done |
| BR cluster (110 file backfill) | `docs/analysis/br/` | ✅ commit `619c73c` |
| FR cluster (FR-0001~FR-0053) | `docs/analysis/fr/` | ✅ 殼 done + Phase II placeholder |
| Traceability matrix (4-way) | `docs/_index/traceability-matrix.md` | ✅ commit `44f16f3` |
| ADR-0008 critique | `docs/governance/reviews/ADR-0008-lane-a-critique-2026-05-28.md` | ✅ done |
| ADR-0009 critique | `docs/governance/reviews/ADR-0009-lane-a-critique-2026-05-28.md` | ✅ done |

### 5.3 Gate 4 NFR + ADR Baseline 證據

| 文件 | 路徑 | 狀態 |
|:-----|:-----|:-----|
| ADR-0039 SUPERSEDED → ADR-0102 | `docs/architecture/adr/ADR-0039-cancellation-fee-tiers.md` + `docs/architecture/adr/ADR-0102-cancellation-fee-tiers-v2-final-spec.md` | ✅ cascade done |
| ADR-0040 v2 PARTIAL_UPDATE | `docs/architecture/adr/ADR-0040-refund-approval-tiers.md` | ✅ PARTIAL_UPDATE done |
| ADR-0044 v2 PARTIAL_UPDATE | `docs/architecture/adr/ADR-0044-warranty-start-date-modes.md` | ✅ PARTIAL_UPDATE done |
| ADR-0050 v2 PARTIAL_UPDATE (Round 2 收尾) | `docs/architecture/adr/ADR-0050-evidence-visibility-matrix.md` | ✅ v2 body 改寫完成 |
| ADR-0067 M18 Runtime Config Governance | `docs/architecture/adr/ADR-0067-m18-runtime-config-governance.md` | ✅ accepted (prior) |
| ADR-0100 Legacy ADR Supersede Index | `docs/architecture/adr/ADR-0100-legacy-adr-supersede-index.md` | ✅ sign-off row 全部標 done |
| NFR matrix (+4 條 M18) | `docs/architecture/nfr-matrix-smart-lock-saas.md` | ✅ done (A1) |
| value-decisions log | `.claude/context/devteam/value-decisions-2026-05-28.md` | ✅ 業主預先裁決完成 |
| ADR-0039 critique | `docs/governance/reviews/ADR-0039-lane-a-critique-2026-05-28.md` | ✅ done |
| ADR-0040 critique | `docs/governance/reviews/ADR-0040-lane-a-critique-2026-05-28.md` | ✅ done |
| ADR-0044 critique | `docs/governance/reviews/ADR-0044-lane-a-critique-2026-05-28.md` | ✅ done |
| ADR-0050 critique (Round 2) | `docs/governance/reviews/ADR-0050-lane-a-critique-2026-05-28.md` | ✅ done |

### 5.4 跨 Gate 共用證據

| 文件 | 路徑 | 用途 |
|:-----|:-----|:-----|
| Final spec source (workorder) | `docs/_source/01-workorder-erp.md` | 三 gate 共用 spec baseline |
| Final spec source (chatbot) | `docs/_source/02-ai-chatbot-sync.md` | 三 gate 共用 spec baseline |
| PRD v2.3 | `docs/prd/smart-lock-saas.md` | 上游 driver |
| Cascade context pack | `.claude/context/devteam/cascade-2026-05-28-context-pack.md` | cascade 路徑記錄 |
| Follow-up tracker | `.claude/context/devteam/follow-up-2026-05-28.md` | session 進度 |

---

## §6 Sign-off Statement

**主 Claude 代業主裁決**：

依業主授權「以台灣文化和接地氣的用戶習慣與凡是要容忍有例外流程做 0-1 導入的考量，代替我做所有決策」，本次 Phase C freeze sign-off：

- ✅ **Gate 2 UXFlow** = frozen (2026-05-28)
- ✅ **Gate 3 SystemSpec** = frozen (2026-05-28)
- ✅ **Gate 4 NFR_ADR_Baseline** = frozen (2026-05-28)

**所有 P0 安全 / 合規 / data integrity issue 已 resolve**：
- WCAG 2.2 AA 合規 baseline 落地（CB-2）
- BR-M17-01 PII 三維治理落地（ADR-0050 v2）
- partial refund 分類 BR-M11-02 合規落地（ADR-0040 v2）
- SoD 三維（initiator / approver / executor）顯化（ADR-0040 v2）
- AI 永禁核准退款 charter 對齊（ADR-0028 / ADR-0040）

**所有 over-engineering / Phase II / nice-to-have 已 defer 入 §4 backlog**：
- 21 條 cascading exception，全部對齊後續 Gate 5a / 5b / 6 / 7 或 Phase II
- 不阻擋 P3 Design phase 啟動

**下一步**：current_phase 進入 **P3_DESIGN**（devteam-design driver — OpenAPI + ERD + Migration）。

---

**End of Phase C Freeze Sign-off**
