---
id: ADR-0062
title: Pricing Engine V2 Bounded Context — api/pricing/ Sub-module（不抽獨立 service）
status: accepted
date: 2026-05-26
deciders: [業主, arch, sd, dba]
supersedes: []
related: [ARCH-0003, ARCH-0006, ADR-0028, ADR-0035, ADR-0046, ADR-0054, ADR-0060, ADR-0061, ADR-0063, ADR-0064, ADR-0066]
source: Forum 2026-05-26-2241-Q01 final-report（arch-B-01 + sd Q-2 + arch OQ-arch-01）
pre_mortem: F2 (擴展崩塌) + F3 (HITL 邊界漂移)
eternal_transient: Eternal Boundary (B2)
---

> 
> **🔄 Migration Status (2026-05-28)**: `STILL_VALID_UNDER_M04`
> **Reviewed against**: 2026-05-20 final spec (xlsx)
> **Reviewed on**: 2026-05-28
> **Module scope**: M04
> **Per ADR-0100 §1 classification** (.claude/context/devteam/meetings/2026-05-27-1130-final-spec-migration-strategy/MoM.md)


# ADR-0062: Pricing Engine V2 Bounded Context

## Status

Accepted (2026-05-26)

## Context

Forum Q-01 收斂 D1-B「內部 rule-based pricing engine + per-contract override」，arch-B-01 質問落點：抽獨立 service（仿 DGS / ADR-0061）還是落 `api/` 內 sub-module。

DGS 走獨立 service 的理由是「合規 audit 必獨立 release + 法務 sign-off artifact」剛性要求，pricing engine 業務邏輯雖含 audit 但不到「法務簽核 artifact 獨立 release」層級。抽 service 對 V2 工期 +4-6 sprint，超出 forum 範圍。

同時要回答對下游介面（Quote / WO / AI agent / Settlement）的邊界、V2 → V2.5 OPA 升級的演進路徑、以及 pricing engine down 的降級策略。

## Decision Drivers

| Priority | Driver | Weight | Reference |
|:---:|:---|:---|:---|
| 1 | Bounded context coupling（pricing ↔ quote 高 cohesion）| high | KB §06 modularity |
| 2 | V1 工期（避免 +4-6 sprint）| high | bootstrap.timeline |
| 3 | V2.5 OPA 升級可逆性 | high | ARCH-0006 reversal pattern |
| 4 | Charter 邊界 enforce（AI 不直接呼 pricing）| high | ADR-0028 / 0035 / 0054 |
| 5 | Operability（fallback 退路）| medium | NFR-Avail / failure modes |

## Options Considered

### Option A — 抽獨立 service（仿 DGS）

| 維度 | 內容 |
|:---|:---|
| **Pros** | • 邊界硬性 enforce<br>• 獨立 SLO / SLA<br>• 升 OPA 可獨立 release |
| **Cons** | • V1 +4-6 sprint<br>• 跨 service hop +50ms latency<br>• Quote → Pricing 90% co-change rate（強耦合下抽 service 反模式）<br>• 法務 sign-off artifact 規模不到 DGS 等級 |
| **Fit** | DGS-tier 合規 audit / 跨組織 release cycle |
| **Anti-fit** | Pricing 與 Quote 同 PR co-change 高的場景 |
| **Cost / Effort** | L（+4-6 sprint）|

### Option B — api/pricing/ sub-module（與 api/quote/ 平級）

| 維度 | 內容 |
|:---|:---|
| **Pros** | • V1 工期不延伸<br>• in-process call latency 可忽略<br>• Quote handler 內呼 pricing 為 90% pattern，零跨 service 額外複雜度<br>• 對 AI agent 透過 quote aggregate read，charter 邊界仍 enforce<br>• V3 抽出獨立 service 預估 ~3 sprint（rule_payload jsonb 已 portable）|
| **Cons** | • Sub-module 邊界靠 code review 維護（非 service boundary）<br>• 與 api/quote/ 同 codebase deploy / rollback |
| **Fit** | V2 業務邏輯 audit 等級，未跨組織 release cycle |
| **Anti-fit** | 法務 sign-off artifact 必獨立 release（不適用本案）|
| **Cost / Effort** | S（落在既有 api/ container 內）|

### Option C — 直接寫進 api/quote/（無 sub-module）

| 維度 | 內容 |
|:---|:---|
| **Pros** | 最小工期 |
| **Cons** | • Pricing rule 計算邏輯與 quote lifecycle 混雜<br>• 將來抽出獨立 service 成本爆炸<br>• 對 settlement / WO 介面不清 |
| **Fit** | 一次性 PoC |
| **Anti-fit** | 長期 V2 platform |
| **Cost / Effort** | XS（但 tech debt 爆炸）|

## Decision

> [!IMPORTANT]
> **選擇**: Option B — `api/pricing/` sub-module（與 `api/quote/` 平級）

### 1. Sub-module 落點

- 路徑：`api/pricing/`
- Owner：**SD lead（primary）+ DBA（secondary，pricing_rule schema / snapshot）**
- 與 `api/quote/` 平級（兩個 sub-module 在 ARCH-0003 module-boundary 內展開）

### 2. 對下游介面（4 條）

| 下游 | 呼叫方式 | 介面 |
|:---|:---|:---|
| **Pricing → Quote** | in-process call | `PricingEngineService.calculate(input) → PricingResult`。Quote sub-module 在 `POST /quotes` handler 內呼 |
| **Pricing → WO** | **無直接介面** | WO 透過 `quote_id` reference 拿快照，**不重算**金額 |
| **Pricing → AI agent** | 透過 `quote` aggregate read | AI 不直接呼 pricing engine（enforce ADR-0028 / 0035 / 0054 邊界）|
| **Pricing → Settlement** | 透過 `quote.snapshot_hash` reference | Settlement 不重算，讀已 frozen snapshot（呼應 ADR-0064）|

### 3. Endpoint Surface

| Endpoint | Visibility | Idempotency |
|:---|:---|:---|
| `POST /pricing/calculate` | **internal-only**（同租戶內 quote handler 才呼）| idempotent by `hash(pc_id, contract_template_id, distance, rule_version)` + 5min cache |

> 拒絕 public exposure：客戶 LIFF 預覽前自己探價 → K6 爭議升（「為什麼預覽 2,500 變最終 2,800」）成本 > K5 提升收益。LIFF 看到的是 `quote.amount_breakdown` snapshot（已 frozen at draft）。

### 4. Domain Event Bus

- 命名：`pricing.calculated` / `pricing.confirmed` / `pricing.overridden`
- 走 in-process domain event bus + outbox poller
- **不**進 ChangeRequest 體系（ChangeRequest 是 governance artifact；pricing event 是 business event）
- `pricing.overridden` event 餵 `pricing_override_rate_7d` SLI alert

### 5. V2 → V2.5 OPA 升級 Reversal Trigger（仿 ARCH-0006）

以下三條任一 trigger 開啟 V2.5 OPA 評估 ADR：

- `pricing_override_rate_7d` > **30%** 連續 3 月
- 跨 tenant > **5** 個 active brand
- `pricing_rule` 表 row 數 > **10k**

### 6. 抽出獨立 service 的可逆性成本（量化）

- rule_payload jsonb 抽離 abstraction：~2 sprint（已 portable，無 ORM 緊耦合）
- endpoint surface + release pipeline：~1 sprint
- **Net：+3 sprint**（V3 多幣別 / OPA 升級觸發時可考慮）

### 7. Pricing Engine Down 降級策略

D1-B 上線必依賴 pricing engine down 時可降級到 **D1-A 客服手填模式**，這是**保底退路而非 optional fallback**：

- pricing engine down → admin banner alert + 客服降級為手填金額（走 ChangeRequest type=`price` 個案核可）
- 60min 內未恢復 → SLO breach 走 ADR-0024 incident pipeline

| 範疇 | 說明 |
|:---|:---|
| **適用範圍** | V2 pricing engine（rule_based）+ V2.5 OPA 升級評估 |
| **不適用** | V3 多幣別跨國（觸發抽 service 評估）/ 法務 sign-off artifact tier |
| **可逆性** | 半可逆（V3 抽 service ~3 sprint，rule_payload jsonb portable）|

## Consequences

### Positive

- V1 工期不延伸（不抽 service）
- Quote ↔ Pricing 強耦合在同 codebase 演進更自然
- AI agent 透過 quote read，charter ADR-0028 / 0035 / 0054 邊界靠 4 條對下游介面 enforce
- D1-A fallback 為「保底退路」非 optional，failure mode 已 mitigated
- V3 抽 service 路徑明確（rule_payload jsonb 已 portable，~3 sprint）

### Negative

> [!WARNING]
> Sub-module 邊界靠 code review 維護，非 service boundary 硬隔離。需要：
>
> - module-boundary import 規則（`api/quote/` 才能 import `api/pricing/`，AI agent / WO / Settlement 不可直接 import）→ lint rule
> - PR CODEOWNERS：`api/pricing/` = sd lead + dba secondary

### Follow-up Work

| Action | Owner | Due | Reference |
|:---|:---|:---|:---|
| ARCH-0003 §「Owns」展開 `api/pricing/` + `api/quote/` 平級 sub-module | arch | P3 | C4 L3 §2 |
| Lint rule: 禁 AI agent / WO / Settlement import `api/pricing/` | sd | P3 | Module boundary |
| `pricing_override_rate_7d` SLI 進 Grafana | sre | P4 | NFR matrix §11 |
| Triple-trigger 評估 cron（quarterly check）| ops | P5 | Reversal trigger §5 |

### 影響的下游文件

| Doc | Impact |
|:---|:---|
| `docs/architecture/c4-l3-smart-lock-saas.md` | §2 API Container 加 `pricing/` sub-module |
| `docs/architecture/nfr-matrix-smart-lock-saas.md` | 補 NFR-Perf-008 / NFR-Avail-005 / failure mode-013 / override SLI |
| `docs/architecture/api/openapi.yaml` | 加 `POST /pricing/calculate`（internal）|
| `docs/architecture/data/erd.md` | 加 `pricing_rule` table（dba-B-2 schema）|

## Pre-mortem Mapping

- **F2 擴展崩塌**：抽 service 在 90% co-change 下反而成本爆炸；sub-module 保留 V3 抽 service 可逆性
- **F3 HITL 邊界漂移**：AI agent 透過 quote aggregate read，不直接呼 pricing → charter ADR-0028 hard constraint #1 邊界靠介面 enforce

## Eternal/Transient Classification

- **Eternal**：sub-module 落點 + 4 條對下游介面 + AI 不直接呼 pricing 邊界
- **Transient**：V2 rule-based engine 實作（V2.5 可換 OPA）+ specific reversal trigger 閾值

## Acceptance Criteria

- [ ] `api/pricing/` sub-module 建立 + CODEOWNERS = sd lead + dba secondary
- [ ] Lint rule 上線：AI agent / WO / Settlement 禁 import `api/pricing/`
- [ ] `POST /pricing/calculate` endpoint internal-only + idempotency hash + 5min TTL cache
- [ ] `pricing.calculated` / `confirmed` / `overridden` domain event bus 接 outbox
- [ ] `pricing_override_rate_7d` SLI 進 Grafana（alert threshold 20%）
- [ ] D1-A fallback path 演練 1 次（pricing engine kill switch + 客服手填）

## Cross References

- Forum final-report: `.claude/context/devteam/forum/2026-05-26-2241-Q01-quote-pricing-engine/final-report.md`
- ARCH-0003 module-boundary（V2.1 擴展 sub-module）
- ARCH-0006 reversal trigger 模式
- ADR-0061（DGS 對比，為何 pricing 不抽 service）
- ADR-0063（AI Utterance Boundary，pricing → AI 介面對齊）
- ADR-0064（Snapshot independent hash chain）
- ADR-0066（Quote ↔ WO lifecycle binding）
