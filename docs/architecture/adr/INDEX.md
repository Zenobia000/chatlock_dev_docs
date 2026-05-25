---
title: ADR Drafts (2026-05-21) — §F Trade-off 落地索引
date: 2026-05-21
last_updated: 2026-05-22
status: 24 accepted + 5 new accepted (2026-05-22 業主拍板)
source: dev_docs/archive/strategy/PAIN-POINTS-SUMMARY-2026-05-21.md §F + dev_docs/archive/meetings/2026-05-22/ACTION-ITEMS-2026-05-22.md
---

# ADR Drafts — §F Trade-off 落地索引

> 把 PAIN-POINTS-SUMMARY v2 §F 的 27 個 Trade-off 收斂為 **24 個獨立 ADR 草稿**（扣除 3 個 §F.3 與 §F.1/F.2 重複者）。每份 ADR 含：Context / Decision（推薦）/ Alternatives A/B / Consequences / Pre-mortem mapping / Eternal/Transient 分類 / 業主圈選驗收條件。
>
> **圈選流程**：
> 1. 業主針對每份 ADR 在 `### Acceptance Criteria` 圈選 ✅推薦 / A / B
> 2. 圈完一批後改 `status: draft → accepted` 並補 `deciders` 簽核欄
> 3. promote 到 `docs/architecture/adr/` 正式 ADR 系列（ADR-0031~0054）
>
> **編號規劃**：既有 ADR 編到 ADR-0030，本批草稿從 **ADR-0031** 起。

---

## 索引表

### Group 1 — GAP Decisions（§F.1，對應 DISC-0001 §3 + Excel-02 sheet 19）

| ADR | 主題 | 來源 | 阻擋層 | 推薦摘要 |
|-----|------|------|--------|---------|
| [ADR-0031](./ADR-0031-ai-auto-convert-to-work-order.md) | AI 是否可自動 `convert_to_work_order` | GAP-D01 | Eternal Policy (B3) | AI 草擬 + 1-click 人審 |
| [ADR-0032](./ADR-0032-missing-address-policy.md) | 缺地址處理 | GAP-D02 | Eternal State Machine (B2) | 追問 + 後台補填 + 無地址 422 hard stop |
| [ADR-0033](./ADR-0033-problem-card-completeness-gate.md) | ProblemCard completeness score 控派工 | GAP-D03 | Eternal Policy (B3) | 0.85 hard gate + 人工 override |
| [ADR-0034](./ADR-0034-urgent-red-code-definition.md) | urgent / Red Code 定義 | GAP-D04 | Eternal Event Type (B5) | 4 類具名 Event Type |
| [ADR-0035](./ADR-0035-warranty-project-quote-policy.md) | 保固 / 建案 AI 報價邊界 | GAP-D05 | Eternal Policy (B3) | AI 可給 range，永禁 final quote |
| [ADR-0036](./ADR-0036-multi-problem-card-rule.md) | 同 conversation 多 ProblemCard | GAP-D06 | Eternal State Machine (B2) | 一 active issue 一 PC，新症狀可另建 |
| [ADR-0037](./ADR-0037-conversation-auto-close.md) | 對話解決後客戶確認關閉 | GAP-D07 | Eternal Process (B2) | quick confirm + 48h 自動關閉 |
| [ADR-0038](./ADR-0038-ai-feedback-review-policy.md) | AI feedback / SOP 審核機制 | GAP-D08 | Eternal Process (D2) | 高風險雙審 / 低風險單審 |

### Group 2 — P0 核心決策（§F.2，對應 Excel-01 sheet 04）

| ADR | 主題 | 來源 | 阻擋層 | 推薦摘要 |
|-----|------|------|--------|---------|
| [ADR-0039](./ADR-0039-cancellation-fee-tiers.md) | 取消費分段 | BIZ-03 / AI-029 | Eternal Policy + Configurable (B3+B4) | 5 階段門檻 + Configurable |
| [ADR-0040](./ADR-0040-refund-approval-tiers.md) | 退款核准分層 | BIZ-04 | Eternal RBAC (B3+B4) | 5 層金額分層 |
| [ADR-0041](./ADR-0041-travel-fee-split.md) | 車馬費歸屬 | BIZ-05 | Eternal + Configurable | 80% 師傅 / 20% 平台 |
| [ADR-0042](./ADR-0042-rbac-four-tier-principle.md) | 角色權限矩陣 4 層原則 | BIZ-11 / AI-016 | Eternal Principle + Transient field (B3) | 4 層原則 + 具體 configurable |
| [ADR-0043](./ADR-0043-brand-project-tenant-scope.md) | 品牌 / 建商專案邊界 | BIZ-14 | Eternal (B1 tenant_id) | 合約模板 + tenant scope |
| [ADR-0044](./ADR-0044-warranty-start-date-modes.md) | 保固起算多模式 | BIZ-16 | Eternal (B1 Device) | warranty_start_date + mode 欄位 |
| [ADR-0045](./ADR-0045-acceptance-sla-policy.md) | 接單 SLA 10/5 min | BIZ-08 / AI-048 | Eternal Process + Transient config | 一般 10min / 急件 5min + per brand override |

### Group 3 — AI 跟進清單（§F.3，對應 Excel-01 sheet 18）

| ADR | 主題 | 來源 | 阻擋層 | 推薦摘要 |
|-----|------|------|--------|---------|
| [ADR-0046](./ADR-0046-change-request-object.md) | ChangeRequest 物件化 | AI-017 | Eternal Process (B3) | apply→approve→effective_date→audit |
| [ADR-0047](./ADR-0047-ai-forbidden-list-as-charter.md) | AI 禁止決策清單入 charter | AI-020 | Eternal Policy (B3) | ADR-0028 charter + auto guardrail test |
| [ADR-0048](./ADR-0048-ai-human-handoff-rules.md) | AI 轉真人 7 條件 | AI-040 | Eternal Policy (B3) + E3 | 7 硬規則 + Eval set 自動化 |
| [ADR-0049](./ADR-0049-onsite-scope-change-protocol.md) | 現場加價三件套 | AI-051 | Eternal (B3+B5) | 客戶簽 + Evidence 照片 + audit |
| [ADR-0050](./ADR-0050-evidence-visibility-matrix.md) | Evidence 可見性矩陣 | AI-052 | Eternal RBAC (B3+B5) | 角色 × 案件生命週期權限 |
| [ADR-0051](./ADR-0051-evidence-retention-policy.md) | Evidence 保存期 | AI-053 | Eternal Policy (B3+B5) | 1y default / RMA+3y / 法律永久 |
| [ADR-0052](./ADR-0052-material-ownership-field.md) | 庫存歸屬 Material.owner | AI-054 | Eternal (B1+B4) | platform/brand/locksmith 三選 |
| [ADR-0053](./ADR-0053-serial-control-policy.md) | Serial 控制範圍 | AI-055 | Eternal (B1 Device) | 主鎖 + 高價零件強制 |
| [ADR-0054](./ADR-0054-ai-quote-range-only.md) | AI 報價邊界（range only） | AI-041 | Eternal Policy (B3) | 同 ADR-0035；獨立 ADR for charter 一致性 |

### Group 4 — 2026-05-22 會議新增（從 Pre-mortem 備註提煉）

| ADR | 主題 | 來源 | 阻擋層 | 摘要 |
|-----|------|------|--------|------|
| [ADR-0055](./ADR-0055-skill-llm-decoupling-contract.md) | SKILL ↔ LLM 解耦合約 | F2 / MATTER-04 | Eternal Contract (B3+C2) | LLMGateway adapter + vendor-neutral SKILL |
| [ADR-0056](./ADR-0056-per-vendor-contract-attachment-spec.md) | 每廠商合約附件規格 + 接入流程 | F3 / MATTER-05 | Eternal Schema (B1) | Contract Instance + 6 步接入 SOP |
| [ADR-0057](./ADR-0057-rag-document-retrieval-not-prompt.md) | 合約 / 規則走 RAG 文件檢索 | F2+F3 / MATTER-05 | Eternal Pattern (B3+C2) | 規則禁寫 prompt，走向量檢索 + citation |
| [ADR-0058](./ADR-0058-external-knowledge-platform-ingestion-contract.md) | 外部知識傳承平台 ingestion contract | F6 / MATTER-07 | Eternal Contract (B3+C4) | 外部知識走 ADR-0038 雙審入 SOP 庫 |
| [ADR-0059](./ADR-0059-smart-lock-iot-signal-ingestion-spec.md) | 電子鎖 IoT 狀態訊號接入規格 | F7 / MATTER-08 | Eternal Event Schema (B5+C1) | 6 類 event + Ingestion Gateway + AI 預填 PC |

---

## 重複合併規則（避免一事二議）

下列 §F.3 條目已併入 §F.1 / §F.2 對應 ADR：

| §F.3 編號 | 併入 | 原因 |
|----------|------|------|
| AI-029 取消費 5 階段 | ADR-0039（BIZ-03 取消費） | 同一決策 |
| AI-048 Acceptance SLA | ADR-0045（BIZ-08 接單 SLA） | 同一決策 |
| ~~AI-041~~ | 獨立寫 ADR-0054 | 雖與 D05 同主題，但 charter 一致性需獨立留證 |

---

## ADR 草稿格式

統一格式（每份約 40-60 行）：

```markdown
---
id: ADR-NNNN
title: <Title>
status: draft
date: 2026-05-21
source_trade_off: §F.X.X PAIN-POINTS-SUMMARY-2026-05-21.md
deciders: [TBD pending 業主圈選]
related: [list]
pre_mortem: F<X>
eternal_transient: <classification>
---

# ADR-NNNN — <Title>

## Status
Draft — 待業主於 §Acceptance Criteria 圈選 ✅/A/B

## Context
<為什麼此決策必要、利害關係人、現況>

## Decision（推薦）
<推薦答案 + 為什麼 + 落地細節>

## Alternatives Considered
### Option A
### Option B

## Consequences
- Positive
- Negative
- Mitigation

## Pre-mortem Mapping
<對應 §A 哪劇本 + 風險量化>

## Eternal/Transient Classification
<§B 哪層 / §C 哪層>

## Acceptance Criteria
- [ ] 業主圈選：✅ 推薦 / A / B / 其他
- [ ] <測試 / guardrail / migration>
- [ ] <Owner 簽核>

## See also
- §F.X.X PAIN-POINTS-SUMMARY-2026-05-21.md
- Excel-0X sheet YY
- 相關 ADR
```

---

## Promotion Workflow（draft → accepted）

1. 業主在每份 ADR 的 Acceptance Criteria 圈選
2. AI Specialist 補完 Consequences / Mitigation 量化數字
3. Owner / Reviewer 簽核（frontmatter `deciders` 補名）
4. 改 `status: draft → accepted`
5. 複製到 `docs/architecture/adr/`（snapshot 不直接編輯，只接收 accepted 版本）
6. 更新 PAIN-POINTS-SUMMARY §0 TL;DR：標 ✅ 已關閉

---

*產出於 2026-05-21；source: §F PAIN-POINTS-SUMMARY-2026-05-21.md v2 Pre-mortem 升維。*
