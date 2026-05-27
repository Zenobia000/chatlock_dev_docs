---
id: ADR-0101
title: Agent Knowledge Base × Final Spec Integration Contract — Data Lineage + Tool Extension + Multi-tenant Scope + Custom SKU Fallback
status: Accepted
date: 2026-05-28
deciders: [業主 (2026-05-28 value decision)]
related:
  - "./ADR-0008-product-info-architecture-canonical.md"  # partially_superseded by ADR-0101 §2.1-§2.4
  - "./ADR-0030-tenant-id-propagation.md"
  - "./ADR-0042-rbac-four-tier-principle.md"
  - "./ADR-0043-brand-project-tenant-scope.md"
  - "./ADR-0044-warranty-start-date-modes.md"
  - "./ADR-0053-serial-control-policy.md"
  - "./ADR-0057-rag-document-retrieval-not-prompt.md"
  - "./ADR-0058-external-knowledge-platform-ingestion-contract.md"
  - "./ADR-0067-m18-runtime-config-governance.md"
  - 01-workorder-erp-final-spec-20260520.xlsx (M02 Customer/Site/Device)
  - 01-workorder-erp-final-spec-20260520.xlsx (M10 BOM/Inventory)
  - 01-workorder-erp-final-spec-20260520.xlsx (M14 Partner Portal)
source_trade_off: Lane A critique 2026-05-28 (Arch + SA 2/2 PARTIAL_SUPERSEDE)
pre_mortem: F4 (合規崩潰 — PII / 商業機密跨 tenant 外洩) + F2 (綁品牌 — flat brand/model 結構)
eternal_transient: Eternal (data lineage contract + tool extension + multi-tenant scope rule + custom SKU fallback) / Transient (mega-doc format 沿用 ADR-0008，可逐步演化)
---

# ADR-0101 — Agent Knowledge Base × Final Spec Integration Contract

> **📋 Status**: ✅ Accepted (2026-05-28)
> **🗓 Date**: 2026-05-28
> **👤 Owner**: `devteam-arch` (Architect persona)
> **🔖 Version**: v1
> **🎯 Scope**: A03 Skill-Gated ReAct Agent + A04 RAG Pipeline (interface with M02 / M10 / M14)
> **🏷 Tags**: agent-kb, data-lineage, multi-tenant, dynamic-lookup, custom-sku, a03, a04, m10-interface, m14-interface
> **🔗 Feature**: workorder-erp-final-spec-2026-05-20
> **🔗 Related KB**: [[06_quality_attributes_catalog]] §1.4 Auditability · §1.5 Multi-tenancy
> **🔗 Partially supersedes**: [`ADR-0008`](./ADR-0008-product-info-architecture-canonical.md) §1 工具集封閉性 + §1 mega-doc 結構維度 + §5 例外清單（multi-tenant data scope）
> **🔗 Source spec**: [`docs/_source/01-workorder-erp.md`](../../_source/01-workorder-erp.md) §M02 + §M10 + §M14
> **🔗 Lane A critique**: [`docs/governance/reviews/ADR-0008-lane-a-critique-2026-05-28.md`](../../governance/reviews/ADR-0008-lane-a-critique-2026-05-28.md) (2/2 PARTIAL — Arch + SA)

---

## 📋 Executive Summary

> [!TIP]
> **TL;DR (30s)**: ADR-0008 鎖 `agent/product_info/{Brand}/{Model}.md` mega-doc 為 agent KB 唯一正典格式，**核心 §1 mega-doc canonical 保留**。但 final spec 2026-05-20 引入 M10 (BOM / Inventory / Serial) + M14 (Brand / Dealer / Builder / Project / Site / Unit) + M02 (Device-to-Customer) 後，ADR-0008 在 **(1) data lineage（M10 master → mega-doc 同步契約）**、**(2) tool extension（serial→warranty / project→unit→model / cross-brand compatibility dynamic lookup）**、**(3) multi-tenant scope（partner portal 場景 `[可用產品資料]` 注入過濾規則）**、**(4) custom SKU fallback（型號不在 catalog 內的 transfer_to_human 路徑）** 四個維度有缺口。本 ADR 補這四項契約。ADR-0008 §1 mega-doc 格式 / §1 工具集 happy path / §3 反 revert 立場 / §4.1 模組路徑禁區仍 valid，標記為 `partially_superseded by ADR-0101 (§2.1-§2.4)`。

| 維度 | 摘要 |
|:---|:---|
| **🎯 Decision** | 補 4 個契約段：data lineage / tool extension / multi-tenant scope / custom SKU fallback |
| **🤔 Why** | Final spec M10/M14/M02 引入 ERP master 與 partner portal 資料邊界，ADR-0008 mega-doc 沒有對應 hook |
| **🚀 Status** | ✅ Accepted (2026-05-28) |
| **📊 Reversibility** | 半可逆（4 個契約段為 cross-BC 同步策略，調整需 cascade 至 A03 ReAct + A04 RAG + M10 ETL pipeline） |
| **🎯 下一步** | analyst 寫 UC-new-1~4 FR 殼；design 寫 dynamic lookup tool API contract；qa 擴充 quality_check 67 案例 |

---

## 🎯 Context

- **觸發此決策的情境**：
  - ADR-0008 鎖 agent runtime KB 為 mega-doc canonical（quality_check 2026-05-09 整合驗收 67 案例 93% pass）。
  - Final spec 2026-05-20 引入 M10 BOM/Inventory (BR-M10-01~03 含 two-layer BOM / material ownership / serial control) + M14 Partner Portal (BR-M14-01~02 含 brand/dealer/builder/project/site hierarchy + builder project setup) + M02 Device-to-Customer 綁定 (BR-M02-02/03 含 device 主檔與 site group 共用條件)。
  - Lane A critique 2026-05-28 (Arch + SA) 2/2 PARTIAL：ADR-0008 mega-doc 主體保留，但有 4 條新 use case + 3 條 NFR 缺口：
    - UC-new-1 多品牌混搭安裝相容性查詢
    - UC-new-2 序號驗保固查詢 (BR-M10-03)
    - UC-new-3 建商專案戶別查詢 (BR-M14-02)
    - UC-new-4 客製 SKU / 改鑄品 fallback
  - 業主 2026-05-28 value decision 授權：「採台灣市場文化、領域做事風格、最佳決策」— 本 ADR 對齊台灣建商 OEM rebadged 鎖實況 + brand-scoped multi-tenant 邊界。
- **業務限制**：
  - 台灣建商案件常見 OEM rebadged 鎖具，型號不在 standard catalog 內，需 fallback 路徑（transfer_to_human + log + 補 KB ticket）。
  - 建商管理常見「同社區共用保固條件 / 同社區不同戶別不同 model」，agent 需能依 customer site 反查 model。
  - Partner portal scope 嚴格：brand A 不可看 brand B 資料；agent prompt 注入 `[可用產品資料]` 清單必須過濾。
- **技術限制**：
  - mega-doc 為 static knowledge，serial → warranty 是 ERP 動態查詢，工具集 (`load_product_info / update_user_info / transfer_to_human`) 缺 dynamic lookup tool。
  - M10 主檔在 ERP，mega-doc 在 agent；sync 不能 split-brain（quote 用 mega-doc v3 但 ERP 已 v4 會誤判 BOM）。
  - ADR-0008 §4.1 模組路徑禁區（不可 `from skills import`）必須保留，新增 tool 走 `agent_tools/` 命名空間。
- **相關 NFR**：
  - **Auditability**：dynamic lookup 必須 audit (per BR-M19-02)；agent 跨 tenant 查 model 行為需 log。
  - **Multi-tenancy**：partner portal 場景 `[可用產品資料]` 注入清單必須過濾，對齊 ADR-0030 tenant_id 傳遞。
  - **Correctness**：mega-doc 與 M10 master sync 必須有 stale SLA（建議 ≤ 24h）。

---

## 📐 Decision Drivers

| Priority | Driver | Weight | Reference |
|:---:|:---|:---|:---|
| 1 | Multi-tenant 邊界 — partner portal PII / 商業機密邊界 | high | ADR-0030 + ADR-0042 + ADR-0050 v2 |
| 2 | Correctness — mega-doc vs M10 master 同步契約 | high | Lane A critique [arch-1] |
| 3 | Use case 覆蓋 — UC-new-1~4 可驗收 | high | Lane A critique SA §UC-new-1~4 |
| 4 | 反 revert — 不可破壞 ADR-0008 §4.1 路徑禁區 | high | ADR-0008 §3 + §4.1 |
| 5 | Time-to-market — 不阻擋 Phase I MVP launch | medium | Phase I scope |

---

## 🔍 Options Considered

### Option A — 不補契約，使用既有 mega-doc + 3 個 tool 應付所有場景

| 維度 | 內容 |
|:---|:---|
| **Pros** | • 0 工程成本；• ADR-0008 §1 完整保留 |
| **Cons** | • UC-new-2 serial→warranty 不可驗收；• UC-new-3 建商戶別反查無路徑；• partner portal scope leak 風險（F4）；• mega-doc 與 M10 master sync 漂移無 SLA |
| **Fit** | (無 — 規格已演化，stay 已不可行) |
| **Anti-fit** | Phase II partner portal + builder use case |
| **Cost / Effort** | S (但 cost of failure = HIGH) |

### Option B — 全面 SUPERSEDE ADR-0008，重寫 agent KB 為動態 ERP 直連

| 維度 | 內容 |
|:---|:---|
| **Pros** | • 單一 source of truth (ERP M10)；• 無 sync 問題 |
| **Cons** | • LLM 每次查 ERP 高 latency + 高成本；• 違反 ADR-0008 §3 反 revert（67 案例 quality_check 全重測）；• 違反 ADR-0057 rag-document-retrieval-not-prompt（已決議用 RAG）；• Phase I 重寫成本 L |
| **Fit** | 完全 dynamic 需求且能接受高 latency |
| **Anti-fit** | LINE 1s 限制 + Phase I MVP |
| **Cost / Effort** | L |

### Option C — PARTIAL SUPERSEDE + 4 個契約段補強（✅ Recommended）

| 維度 | 內容 |
|:---|:---|
| **Pros** | • ADR-0008 §1 主體保留 + quality_check 67 案例 baseline 不重測；• 4 個契約段對齊 spec；• mega-doc + dynamic lookup tool 混合架構 latency 可控；• multi-tenant scope hook 預留 |
| **Cons** | • ADR-0008 自身 status 須整治（main/dev SUPERSEDED + refactor/agent-port REINSTATED）為 `partially_superseded`；• 4 個契約段下游 cascade 工作量 M |
| **Fit** | Phase I MVP launch + Phase II partner portal 演化 |
| **Anti-fit** | (無明顯) |
| **Cost / Effort** | M |

---

## ✅ Decision

> [!IMPORTANT]
> **選擇**: Option C — PARTIAL SUPERSEDE + 4 個契約段補強
>
> **理由**: ADR-0008 mega-doc canonical 主體未被 final spec 直接覆寫（Lane A critique 兩 persona 共識），但 M10/M14/M02 引入後在 data lineage / tool extension / multi-tenant scope / custom SKU fallback 四個維度有缺口。Option C 保留 §1 mega-doc + 67 案例 baseline，並補 4 個契約段對齊 spec，是治理成本與 use case 完整性的最佳平衡。

| 範疇 | 說明 |
|:---|:---|
| **✅ 適用範圍** | A03 Skill-Gated ReAct Agent + A04 RAG Pipeline 對接 M10/M14/M02 master 的 interface contract |
| **❌ 不適用** | M10/M14/M02 模組內部主檔治理（屬 ERP 模組責任）；非 agent 場景的 ERP UI 操作 |
| **🔓 可逆性** | 半可逆（4 個契約段是 cross-BC 同步策略，調整 cascade 至 A03 / A04 / M10 ETL pipeline） |

---

### §2.1 Data Lineage — M10 master ↔ agent mega-doc 同步契約

**Source of Truth**：
- **M10 ERP master** = brand / model / two-layer BOM / material ownership / serial control 主檔的 source of truth
- **agent/product_info/{Brand}/{Model}.md mega-doc** = derived view（給 LLM 用的 humanized snapshot）

**同步策略**：**pull-based ETL with manual gating**（Phase I）

| 項目 | 內容 |
|:-----|:-----|
| **觸發** | M10 master 任一欄位 update → emit `M10MasterChanged` event → agent KB curator queue |
| **頻率** | 每日批次（≤ 24h stale SLA）+ ad-hoc trigger（業主可在 admin UI 強制重 sync 某 brand/model） |
| **Curation gating** | M10 raw → curator review (LLM-assisted draft + human approval) → mega-doc commit (per CLAUDE.md bronze-only rule) |
| **Stale 偵測** | mega-doc frontmatter 加 `m10_master_version` + `last_synced_at`；M10 master 加 `current_version`；mismatch 顯示 stale warning |
| **Phase II 升維** | 評估 event-driven push（無 manual curation）或 hybrid（高頻欄位 push、低頻欄位 pull）；屬 follow-up ADR |

**Why pull + manual gating**：
1. ADR-0008 §3 強調 bronze-only data source；M10 raw 直 push 違反此原則
2. mega-doc 給 LLM 看，需 humanize（不是 raw schema dump）
3. 24h stale SLA 涵蓋 Phase I 多數 use case；高 stale-sensitive case（serial→warranty）走 §2.2 dynamic lookup

---

### §2.2 Tool Extension — Dynamic Lookup Tools（NEW）

新增 3 個 dynamic lookup tool，加進 `agent/agent_tools/`（不破 ADR-0008 §4.1 路徑禁區）：

```python
# 新增 dynamic lookup tools（與 ADR-0008 §1 三個 static / write tool 並存）

async def lookup_serial_warranty(serial_number: str, tenant_ctx: TenantContext) -> dict:
    """
    UC-new-2 — 序號驗保固查詢
    Returns: { device_id, model, warranty_start_date, warranty_end_date, warranty_status }
    Tenant filter: per ADR-0030 tenant_id_propagation
    Audit: per BR-M19-02 — log (user_id, serial_number, hit/miss, timestamp)
    """

async def lookup_unit_model(project_id: str, unit_id: str, tenant_ctx: TenantContext) -> dict:
    """
    UC-new-3 — 建商專案戶別查詢
    Returns: { unit_id, model, install_date, handover_date, warranty_start_mode }
    Tenant filter: per ADR-0030 + ADR-0043 (brand-project-tenant-scope)
    Audit: per BR-M19-02
    """

async def lookup_compatibility(model_a: str, model_b: str, tenant_ctx: TenantContext) -> dict:
    """
    UC-new-1 — 多品牌混搭安裝相容性查詢
    Returns: { compatible: bool, notes: str, evidence_refs: [doc_id] }
    Tenant filter: per ADR-0030
    Audit: per BR-M19-02
    """
```

**約束**：
- 所有 dynamic lookup 必須 propagate tenant_ctx (ADR-0030)，禁止無 scope 全表查
- LINE 1s 限制：每個 tool target P95 ≤ 200ms（從 ERP cache 取）
- 失敗 fallback：cache miss / ERP timeout → 不阻塞，回 `{ status: 'lookup_unavailable' }` + transfer_to_human suggestion
- audit log 必填 `tool_name`, `query_params (PII redacted)`, `result_hit`, `latency_ms`, `tenant_id`

---

### §2.3 Multi-tenant Scope — Partner Portal 場景 `[可用產品資料]` 注入過濾

**場景**：agent 在 partner portal 對話（例如 brand A 員工帳號）發 LINE event，prompt 拼裝時的 `[可用產品資料]` 清單必須過濾。

**過濾規則**：

| Caller tenant | `[可用產品資料]` 注入內容 |
|:---|:---|
| **B2C 客戶**（無 brand 綁定） | 平台所有 public brand × model 清單 |
| **Brand User**（brand_scope = brand_X） | 僅 brand_X 旗下 model 清單 |
| **Builder User**（project_scope = project_Y） | 僅 project_Y 涉及的 brand × model 清單（per ADR-0043） |
| **Customer Service**（tenant_id 內，可代查任意 brand）| 平台所有 model 清單 + audit log mark `service_query` |
| **Locksmith**（無 brand 限制但有 case-scope）| 平台所有 model 清單（per ADR-0050 v2 evidence visibility） |
| **AI Bot** | 等同呼叫者 tenant_ctx；無 standalone scope |

**對齊 ADR-0030 tenant-id-propagation**：
- LINE webhook handler 從 `line_user_id` 解析 → `TenantContext { tenant_id, brand_scope, project_scope, role }`
- system prompt 拼裝層讀 `TenantContext` 後 filter `product_info.all_docs()` → 注入過濾後清單
- agent runtime 任何 `load_product_info(name)` 呼叫，name 必須在過濾後清單內，否則 reject + audit

**Phase III scope 擴展 hook**：scope 屬性升維至 `{tenant_id, brand_scope, project_id, household_id}`（per ADR-0050 v2 §Scope Filter 升維路徑）。

---

### §2.4 Custom SKU Fallback — 型號不在 catalog 時的處理

**場景**：建商 OEM rebadged 鎖、客製品、停產老型號等 mega-doc 內無檔案的 case。

**Fallback 路徑**：

```python
# pseudocode
async def handle_model_query(model_query: str, tenant_ctx: TenantContext):
    if product_info.has_brand_model(model_query):
        return await load_product_info(model_query)

    # Tier 1: 模糊匹配（同 brand 相近型號）
    candidates = product_info.fuzzy_match(model_query, threshold=0.8)
    if candidates:
        return await prompt_user_clarify(candidates)

    # Tier 2: ERP M10 master 查（mega-doc stale 但 master 有）
    erp_hit = await m10_master_lookup(model_query, tenant_ctx)
    if erp_hit:
        # 觸發 §2.1 ad-hoc sync + log "kb_stale" alert
        await trigger_kb_curation_ticket(model_query, source='m10_hit_kb_miss')
        return await transfer_to_human(
            reason='custom_sku_kb_stale',
            context={'erp_data': erp_hit, 'model_query': model_query}
        )

    # Tier 3: 完全找不到（custom OEM / 停產）
    await trigger_kb_curation_ticket(model_query, source='unknown_sku')
    return await transfer_to_human(
        reason='custom_sku_unknown',
        context={'model_query': model_query, 'caller_tenant': tenant_ctx}
    )
```

**約束**：
- AI 永禁猜測 unknown SKU 規格（與 ADR-0028 charter Forbidden 一致）
- 所有 Tier 2/3 case 自動 log 進 KB curation ticket queue（M20 AI Ops 接手）
- transfer_to_human 必須帶完整 context 給客服

---

## 📊 Consequences

### ✅ Positive
- UC-new-1~4 全部可驗收（quality_check baseline 擴充至 ≥ 71 案例）
- Partner portal 場景無跨 tenant leak 風險
- mega-doc 與 M10 master 有明確 sync SLA + curation gating
- Custom SKU fallback 對台灣建商 OEM rebadged 鎖實況閉合
- ADR-0008 §1 主體保留 + §4.1 路徑禁區保留 + 67 案例 baseline 不重測

### ⚠️ Negative

> [!WARNING]
> trade-off 清單：

- **新增 3 個 dynamic lookup tool 增加 agent runtime 複雜度** — mitigation: tenant_ctx 強制注入 + audit log + LINE 1s timeout fallback
- **24h stale SLA 對 high-velocity master 更新有 gap** — mitigation: §2.4 Tier 2 ERP master fallback + ad-hoc sync trigger + Phase II 升維 event-driven 評估
- **Curation manual gating 加 agent KB owner 工作量** — mitigation: LLM-assisted draft 降低 review 成本；按 brand 分配 owner per ADR-0058
- **ADR-0008 自身 status 多 branch 矛盾仍存在** — mitigation: ADR-0008 frontmatter 加 `partially_superseded_by: ADR-0101 (§2.1-§2.4)` + `scope_clarification: agent runtime KB only`，不撤回 main/dev 既有 SUPERSEDED 附註

### 🎯 Follow-up Work

| Action | Owner | Due | Reference |
|:---|:---|:---|:---|
| ADR-0008 frontmatter 加 `partially_superseded_by: ADR-0101 (§2.1-§2.4)` + scope_clarification | `devteam-arch` | 2026-05-28 | 本 ADR §F |
| ADR-100 §1 row ADR-0008 → `PARTIAL_SUPERSEDE (by ADR-0101)` | `devteam-arch` | 2026-05-28 | ADR-0100 |
| UC-new-1~4 寫成 FR 殼 (A03/A04 系列 FR) | `devteam-analyst` | Phase II planning | analyst cascade |
| 3 個 dynamic lookup tool API contract (OpenAPI for internal ERP query) | `devteam-design` | Gate 5a | design cascade |
| quality_check 67 案例擴充至涵蓋 UC-new-1~4（≥ 71 cases） | `devteam-qa` | Phase II launch | qa cascade |
| M10 ETL pipeline 規格（curation queue + curator UI + stale 監控） | `devteam-ops` + `devteam-design` | Phase II planning | ops cascade |
| Multi-tenant prompt filter 實作（system prompt 拼裝層） | coding agent (Phase II) | Phase II launch | handoff |

### 📉 影響的下游文件

| Doc | Impact |
|:---|:---|
| `docs/architecture/adr/ADR-0008-product-info-architecture-canonical.md` | `partially_superseded_by: ADR-0101 (§2.1-§2.4)` |
| `docs/analysis/fr/FR-A03-XX (new)` | UC-new-1~4 FR 殼 |
| `docs/api/openapi-agent-internal.yaml` | 3 個 dynamic lookup endpoint contract |
| `docs/data/erd-m10.md` | M10 master ↔ agent mega-doc sync schema (m10_master_version / last_synced_at) |
| `docs/qa/test-plan-agent.md` | quality_check 71 案例擴充 |

---

## 🔗 Links

| Asset | Path |
|:---|:---|
| **Partially superseded ADR** | [`ADR-0008`](./ADR-0008-product-info-architecture-canonical.md) §1 工具集封閉性 + §1 mega-doc 結構維度 + §5 例外清單（multi-tenant data scope） |
| **Related ADRs** | [`ADR-0030`](./ADR-0030-tenant-id-propagation.md) · [`ADR-0042`](./ADR-0042-rbac-four-tier-principle.md) · [`ADR-0043`](./ADR-0043-brand-project-tenant-scope.md) · [`ADR-0044`](./ADR-0044-warranty-start-date-modes.md) · [`ADR-0053`](./ADR-0053-serial-control-policy.md) · [`ADR-0057`](./ADR-0057-rag-document-retrieval-not-prompt.md) · [`ADR-0058`](./ADR-0058-external-knowledge-platform-ingestion-contract.md) · [`ADR-0067`](./ADR-0067-m18-runtime-config-governance.md) |
| **Lane A critique** | [`docs/governance/reviews/ADR-0008-lane-a-critique-2026-05-28.md`](../../governance/reviews/ADR-0008-lane-a-critique-2026-05-28.md) |
| **Source spec** | [`docs/_source/01-workorder-erp.md`](../../_source/01-workorder-erp.md) §M02 + §M10 + §M14 |
| **業主 value decision** | [`.claude/context/devteam/value-decisions-2026-05-28.md`](../../../.claude/context/devteam/value-decisions-2026-05-28.md) |

---

## 🔍 Open Questions

| # | 問題 | 處理 |
|:--|:-----|:-----|
| OQ-101-1 | Phase II 是否升維至 event-driven push sync？ | follow-up ADR；Phase I 先用 pull batch 觀察 stale-sensitive case |
| OQ-101-2 | Custom SKU Tier 2 ERP master 查時是否觸發即時 mega-doc auto-curate？ | 預設不 auto-curate（CLAUDE.md bronze-only），人工 review queue |
| OQ-101-3 | Multi-tenant scope 升維至 household_id 的時間點？ | Phase III；本 ADR 保留 hook（per ADR-0050 v2） |

---

## ⚠️ Risks

| # | Risk | Likelihood | Impact | Mitigation |
|:--|:-----|:-----------|:-------|:-----------|
| R-101-1 | mega-doc 24h stale 期間 LLM 給錯資訊 | M | M | §2.4 Tier 2 ERP fallback + frontmatter stale warning + dynamic lookup 高 stale-sensitive case |
| R-101-2 | dynamic lookup ERP timeout 累積影響 LINE 1s 限制 | M | H | tool 級 P95 ≤ 200ms + cache + fallback transfer_to_human |
| R-101-3 | Multi-tenant prompt filter 漏掉某個 brand → cross-tenant leak | L | H | Unit test + integration test + audit log 監控異常注入 |
| R-101-4 | Custom SKU curation queue 累積太多 ticket | M | M | M20 AI Ops 配 owner SLA；半年 review queue 健康度 |
| R-101-5 | ADR-0008 §4.1 路徑禁區意外破壞 | L | H | CI guard (per ADR-0008 §4.3) + code review |

---

## ✍️ Sign-off

- [x] **Architect** (owner): `devteam-arch` / Date: 2026-05-28
- [x] **業主**: value decision 授權 / Date: 2026-05-28
- [ ] **Tech Lead**: ____________ / Date: ____________
- [ ] **agent owner / KB curator**: ____________ / Date: ____________

---

**End of ADR-0101**

> 給業主：你主要要看的是 **📋 Executive Summary** + **§2.3 Multi-tenant Scope 過濾規則** + **§2.4 Custom SKU Fallback** 三段。
> §2.1 Data Lineage 與 §2.2 Tool Extension 是 cross-BC 同步契約，給 design / ops 接手用。
