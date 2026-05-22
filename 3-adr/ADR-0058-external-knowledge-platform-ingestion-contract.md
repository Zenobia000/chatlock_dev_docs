---
id: ADR-0058
title: 外部知識傳承平台 → AI Agent ingestion contract
status: accepted
date: 2026-05-22
source_trade_off: PAIN-POINTS-SUMMARY-2026-05-21.md §A F6 + ACTION-ITEMS-2026-05-22.md MATTER-07
deciders: [業主]
accepted_date: 2026-05-22
related:
  - "./ADR-0038-ai-feedback-review-policy.md"
  - "./ADR-0057-rag-document-retrieval-not-prompt.md"
  - "./ADR-0050-evidence-visibility-matrix.md"
pre_mortem: F6 (人才流失死)
eternal_transient: Eternal Contract (B3) + Transient adapter (C4)
---

# ADR-0058 — 外部知識傳承平台 → AI Agent ingestion contract

## Status
Accepted (2026-05-22)

## Context

業主於 2026-05-22 會議：F6 人才流失風險認同，但揭示**已有外部知識傳承平台**專門做資深技師 / Domain expert 的隱性知識萃取。

決議：兩者並行 ——
- SOP 螺旋仍跑（依 ADR-0038 高風險雙審 / FAQ 單審）
- 外部知識傳承平台知識最終必須 **ingest 進 SOP 庫**，AI Agent 才能取用

若無 ingestion contract 定義，兩個系統會脫鉤，知識散失，F6 風險未解除。

## Decision（業主拍板 2026-05-22）

**Ingestion Contract 規格**：

### 1. 外部平台輸出 schema
外部知識傳承平台輸出必須符合：
```yaml
knowledge_item:
  id: external-uuid
  source_platform: <平台名稱>
  source_url: <原始連結>
  knowledge_type: troubleshooting | sop | faq | case_study | policy
  title: string
  body_markdown: string             # vendor-neutral markdown
  applicable_scope:
    brands: [...]
    lock_models: [...]
    locale: [...]
  contributor:
    expert_id: string
    expert_name: string
    expertise_years: int
  attachments:
    - type: image | video | pdf
      url: ...
  metadata:
    created_at: ISO8601
    last_updated: ISO8601
    confidence_score: float (0-1)   # 平台對該知識的可信度
```

### 2. Ingestion Pipeline
```
外部平台 webhook / API
   ↓ (push or pull)
Ingestion Gateway（schema 驗證）
   ↓ (schema valid?)
分流：
  - knowledge_type ∈ [policy, troubleshooting]
      → ADR-0038 雙審（客服主管 + Domain expert）
  - knowledge_type ∈ [faq, case_study]
      → ADR-0038 單審（Knowledge Owner）
   ↓ (approved)
SOP 庫 + RAG index (per ADR-0057)
   ↓
AI Agent 可檢索使用
```

### 3. 強制走 ADR-0038 雙審 / 單審
**不允許** 外部平台知識直接入 RAG，必須經過 SOP 審核流程。理由：
- 外部平台可信度 ≠ 本平台合規要求
- 高風險知識需 Domain expert 校對
- 對應 F6 mitigation：人才流失但流程保留

### 4. Audit Trail
每筆 ingestion 留 audit：
- 外部來源 platform + url + contributor
- Ingestion 時間
- 審核人 + 審核結果 + 修改差異
- 入 SOP 庫後的 SOP id

### 5. 反向回饋（optional）
若 SOP 庫使用後發現外部知識有誤，可走 ChangeRequest (ADR-0046) 反向通知外部平台。

### 6. 版本管理
- 外部平台知識改版 → 新 ingestion + 走審核
- 舊版 SOP 不刪除，標 deprecated
- AI 預設只用 active 版本

### 7. 安全邊界
- 外部平台 API 不可直連 production DB
- 必經 Ingestion Gateway（rate limit + schema validate + auth）
- Ingestion Gateway 屬於 §C4 ACL 邊界

## Alternatives Considered

### Option A — 完全不接外部平台，純走 SOP 螺旋
- 風險：F6 高（內部 SOP 螺旋一年才跑完）
- 已捨棄（業主備註已表明有外部平台）

### Option B — 外部平台直接入 RAG，跳過審核
- 風險：知識污染 + 法務風險
- 已捨棄

### Option C — Hybrid（FAQ 直接入，policy 雙審）
- 風險：界線模糊，外部平台可能標錯類型
- 已捨棄（決議全部走 ADR-0038 審核）

## Consequences

**Positive**：
- F6 風險顯著降低（外部 + 內部雙路徑）
- 知識最終仍經本平台合規審核
- 外部平台可換廠商（只需新 adapter）

**Negative**：
- Ingestion Gateway 開發成本
- 審核人力負擔 ↑（外部知識量可能很大）
- 外部平台 schema 改版需 adapter 跟進

**Mitigation**：
- Ingestion 可批次（非即時），審核走 queue
- AI 輔助初審 SOP 草稿（per ADR-0038）
- 外部平台 schema 鎖定版本，改版走 ChangeRequest

## Pre-mortem Mapping

對應 §A F6。把「外部知識傳承平台」變成可插拔的知識來源 adapter，最終仍歸進本平台 SOP 庫。即使外部平台斷供，本平台仍保有已 ingestion 的知識。

## Eternal/Transient Classification

- **Eternal**：§B3 Ingestion contract schema + §C4 Ingestion Gateway 邊界
- **Transient**：具體外部平台 adapter、批次節奏

## Acceptance Criteria
- [x] 業主拍板 2026-05-22：✅ 兩者並行（SOP 螺旋 + 外部平台 ingestion）
- [ ] 業主提供外部知識傳承平台名稱 / API spec
- [ ] Backend 實作 Ingestion Gateway + schema validation
- [ ] 與 ADR-0038 對齊：所有 ingestion 走雙審 / 單審
- [ ] 與 ADR-0057 對齊：審核通過後入 RAG index
- [ ] Audit trail：來源 + 審核人 + 差異 留證永久
- [ ] V1.0 上線前完成至少 1 個外部平台 PoC
- [ ] BI 報表：「外部 vs 內部 SOP 比例 + 審核通過率」

## See also
- PAIN-POINTS-SUMMARY-2026-05-21.md §A F6
- ACTION-ITEMS-2026-05-22.md MATTER-07
- ADR-0038 SOP 雙審入庫
- ADR-0057 RAG 文件檢索
- ADR-0050 Evidence 可見性（外部知識來源 attribution）
- ADR-0046 ChangeRequest（外部平台改版）
- §D2 知識護城河、§E2 7 層記憶 (Episodic / Semantic)
