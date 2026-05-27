---
id: ADR-0056
title: 每廠商合約附件規格 + 接入流程
status: accepted
date: 2026-05-22
source_trade_off: PAIN-POINTS-SUMMARY-2026-05-21.md §A F3 + ACTION-ITEMS-2026-05-22.md MATTER-05
deciders: [業主]
accepted_date: 2026-05-22
related:
  - "./ADR-0043-brand-project-tenant-scope.md"
  - "./ADR-0057-rag-document-retrieval-not-prompt.md"
  - "./ADR-0046-change-request-object.md"
pre_mortem: F3 (HITL 邊界漂移) + F5 (規模困境)
eternal_transient: Eternal Schema (B1) + Transient content (per partner)
---

> 
> **🔄 Migration Status (2026-05-28)**: `STILL_VALID_UNDER_M14`
> **Reviewed against**: 2026-05-20 final spec (xlsx)
> **Reviewed on**: 2026-05-28
> **Module scope**: M14
> **Per ADR-0100 §1 classification** (.claude/context/devteam/meetings/2026-05-27-1130-final-spec-migration-strategy/MoM.md)


# ADR-0056 — 每廠商合約附件規格 + 接入流程

## Status
Accepted (2026-05-22)

## Context

業主於 2026-05-22 會議明文：**「每家活做的廠商要把合約附上，每一家都不一樣」**。

意思是不同的施工廠商 / 品牌商 / 建商，各自有獨立合約，內含不同 SLA、保固規則、責任分配、價格、可見性。若這些規則散落工程師硬編碼或 prompt 內，會發生：
- 換廠商要重新訓練 AI
- 客服無一致來源查規則
- 法務出糾紛找不到當時版本
- 對應 F3 (邊界漂移) + F5 (規模困境)

本 ADR 為 ADR-0043 Contract Template 的**接入流程補充**。

## Decision（業主拍板 2026-05-22）

**每廠商合約附件規格**：

### 1. Contract Instance 物件（延伸 ADR-0043）
每個施工廠商 / 品牌 / 建商 = 一個 Contract Instance，schema：
```yaml
contract:
  id: contract-uuid
  tenant_id: <partner-id>
  partner_type: brand | locksmith_vendor | builder | other
  effective_date: ISO8601
  expiry_date: ISO8601
  signed_pdf_url: <object-storage-path>  # 必填，原始合約 PDF
  signed_pdf_sha256: <hash>
  parsed_clauses:                          # 結構化條款（人工 + LLM parse 後人工校對）
    sla:
      response_time_min: 10
      arrival_time_min: 60
      override_rules: [...]
    warranty:
      duration_days: 365
      start_mode: purchase_date | handover_date | activation_date | contract_date | manual
      exclusions: [...]
    pricing:
      base_visit_fee: 500
      travel_fee_tiers: [...]
      cancellation_policy: ref(ADR-0039)
      refund_approval_tier: ref(ADR-0040)
    evidence_retention_override: ref(ADR-0051)
    family_review_required: bool          # 對應合約 4.4(d)
  attachments:
    - type: nda
      url: ...
    - type: tax_invoice_template
      url: ...
```

### 2. 接入流程
新廠商簽約必經 6 步：

| 步 | 動作 | 負責人 |
|---|---|---|
| 1 | 業務取得簽名 PDF + 附件 | Sales |
| 2 | 上傳到 object storage + 計算 sha256 | Backend (auto) |
| 3 | LLM 初步 parse 條款 → 結構化 yaml | AI Specialist |
| 4 | 法務 + 主管校對 parsed_clauses 與原文 | Legal + Supervisor |
| 5 | ChangeRequest (ADR-0046) 提交 → 簽核 → 生效日 | All |
| 6 | RAG index 建立 (ADR-0057)，AI 可即時檢索 | Backend (auto) |

### 3. 規則覆蓋優先序
當 partner-specific contract 與平台預設規則衝突時：
```
Partner Contract > Brand 預設 > Platform 預設
```
覆蓋必須留 audit log。

### 4. 合約版本管理
- 合約改版走 ChangeRequest (ADR-0046)
- 舊版必須保留（永久），新版生效日後僅新工單適用新規則
- BI 報表加「per contract version 工單分布」

### 5. AI 取用合約方式
AI 不可直接讀 contract object；必須透過 §C3 ContractGateway API：
```python
gateway.get_clause(contract_id, clause_path)  # 如 "sla.response_time_min"
```
所有取用記 audit log。對應 ADR-0057：規則走 RAG 文件檢索，不寫進 prompt。

## Alternatives Considered

### Option A — 全部寫進工程師硬編碼
- 風險：F5 規模困境
- 30 廠商 = 30 套程式碼分支，維護惡夢
- 已捨棄

### Option B — 全部寫進 LLM prompt
- 風險：F2 + F3
- prompt 爆量 + token 成本 + 換模型全失效
- 已捨棄

### Option C — 用外部 CRM
- 風險：F1 資料主權外移
- 第三方供應商斷供 → 無法營運
- 已捨棄

## Consequences

**Positive**：
- 30+ 廠商可平行接入，每家獨立 contract instance
- 法務糾紛時可調原版 PDF + 對應結構化條款
- 對應 §B1 業務物件（合約為一級資料）

**Negative**：
- 每廠商初次接入 6 步流程 ~3 工作日
- 結構化解析 + 法務校對人力成本

**Mitigation**：
- 步驟 3 LLM 初步 parse 可大幅降低人工成本
- 標準合約模板可加速新廠商接入

## Pre-mortem Mapping

對應 §A F3 + F5。把「每家不同的規則」固化為資料層（contract instance）而非程式碼 / prompt，model swap / 廠商更替都不影響規則。

## Eternal/Transient Classification

- **Eternal**：§B1 Contract instance schema + §C3 ContractGateway API
- **Transient**：每個 partner 的具體 contract 內容（per partner，可改版）

## Acceptance Criteria
- [x] 業主拍板 2026-05-22：✅ 認同並訂為硬規則
- [ ] Backend 實作 Contract Instance schema + ContractGateway API
- [ ] Legal 撰寫「6 步接入流程」SOP 與檢核表
- [ ] AI Specialist 訓練 LLM parse 條款流程（人工校對為主）
- [ ] 與 ADR-0043 Contract Template 對齊
- [ ] 與 ADR-0057 對齊：合約檢索走 RAG
- [ ] 與 ADR-0050 對齊：Contract attachment 屬 Evidence，retention 永久
- [ ] V1.0 上線前完成至少 1 個 brand + 1 個 locksmith vendor 合約接入

## See also
- PAIN-POINTS-SUMMARY-2026-05-21.md §A F3
- ACTION-ITEMS-2026-05-22.md MATTER-05
- ADR-0043 Contract Template
- ADR-0046 ChangeRequest
- ADR-0057 RAG 文件檢索
- ADR-0050 Evidence 可見性、ADR-0051 Evidence Retention
- 合約 4.4(d) 家族覆核員
