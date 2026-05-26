---
id: ADR-0063
title: AI Quote-related Utterance Boundary — Announce Existence, Never Echo NTD Numbers
status: accepted
date: 2026-05-26
deciders: [業主, ba, arch]
supersedes: []
related: [ADR-0028, ADR-0031, ADR-0035, ADR-0047, ADR-0054, ADR-0062, ADR-0066]
source: Forum 2026-05-26-2241-Q01 final-report（ba-B-1 + sd-B-2 + 業主 Q2=A）
pre_mortem: F3 (HITL 邊界漂移) + F4 (合規崩潰)
eternal_transient: Eternal Policy (B3)
---

# ADR-0063: AI Quote-related Utterance Boundary

## Status

Accepted (2026-05-26)

## Context

Forum Q-01 D3 議題：AI agent 在報價流程的可說邊界。R1 proposer 提案 D3-B：「您的維修費用是 NTD 2,800（系統報價編號 Q-12345）」朗讀數字 + 引用 quote_id。

BA R2 blocker（ba-B-1）指出：此 utterance 就是 ADR-0035 / ADR-0054 charter 明文禁止的「final quote」逐字版本，違反 ADR-0028 hard constraint #1「Forbidden 清單不可由工程單方面解除」。BA 視角為 utterance-level ban，工程語意辯護不解 Legal 風險。

R3 proposer 升級 binary choice 給業主：
- **Q2=A**（重構句型，charter 零破壞，proposer 推薦）
- **Q2=B**（朗讀原版，需開「AI Forbidden carve-out ADR」+ Legal + CEO + 客服主管簽核，3+ sprint）

**業主 2026-05-26 裁決：Q2=A**。本 ADR 將該裁決正式化為 charter 邊界，讓未來 reviewer 不再爭。

## Decision Drivers

| Priority | Driver | Weight | Reference |
|:---:|:---|:---|:---|
| 1 | Charter 紅線（ADR-0028 hard constraint #1）| critical | ADR-0028 |
| 2 | Utterance-level enforcement（非工程語意辯護）| critical | ADR-0035 / 0054 |
| 3 | V2 工期（不啟動 Legal review cycle）| high | bootstrap.timeline |
| 4 | Server-side enforcement（不依賴 prompt）| high | ADR-0047 |
| 5 | 客戶體驗（金額仍需即時可見）| medium | K5 acceptance |

## Options Considered

### Option A — 重構句型（announce existence, never echo number）

| 維度 | 內容 |
|:---|:---|
| **Pros** | • Charter ADR-0028/0035/0054 零衝突<br>• Guardrail 規則零變動（原 `NTD <number>` regen 規則保留）<br>• 無 Legal review cycle<br>• 0 sprint 啟動成本<br>• Server-side enforce 透過 flex_message_template_id |
| **Cons** | • 客戶 LIFF 多一跳（從 LINE chat → LIFF mini-app）|
| **Fit** | V2 charter freeze 期 |
| **Anti-fit** | — |
| **Cost / Effort** | XS（句型即可生效）|

### Option B — 朗讀原版數字 + 引用 quote_id

| 維度 | 內容 |
|:---|:---|
| **Pros** | • 客戶 LINE chat 直接看數字（省 LIFF 一跳）|
| **Cons** | • 違反 ADR-0035 utterance ban + ADR-0028 hard constraint #1<br>• 必先開「AI Forbidden carve-out ADR」+ Legal + CEO + 客服主管簽核<br>• 3+ sprint 工期（Legal review cycle 不可預估）<br>• Guardrail 需升級 + 補 Eval 200 題 20 題<br>• Charter 邊界一旦開洞，未來其他 Forbidden 條目皆受壓力 |
| **Fit** | 已過 Legal sign-off 的 V3+ 場景 |
| **Anti-fit** | V2 charter freeze 期 |
| **Cost / Effort** | L（3+ sprint + Legal cycle）|

## Decision

> [!IMPORTANT]
> **選擇**: Option A — AI 不複誦個案金額，僅 announce existence

### 1. AI Utterance 句型（鎖定）

**Allowed pattern**：

> 「客服已準備好您的報價，請點選下方按鈕查看詳細金額與條款。系統報價編號 Q-12345。」

**Forbidden pattern**（保持 ADR-0035 utterance ban）：

> 「您的維修費用是 NTD 2,800」「您這個案件大約 NTD 2,800-3,000」 ❌

AI 不複誦個案數字，僅引導客戶至 LIFF / Flex Message（system-of-record 直接呈現）。

### 2. Server-side Enforcement（不依賴 prompt）

AI 訊息以模板形式由 server 限定，AI 無自由文 NTD 數字能力：

```yaml
POST /quotes/{id}:send-to-customer:
  required: [channel, sender_role]
  properties:
    channel: { enum: [line_flex, liff_invite] }
    sender_role: { enum: [customer_service, ai_agent] }
  server-side enforce:
    - sender_role = ai_agent AND quote.state < internal_approved
      → 403 AI_FORBIDDEN_FINAL_QUOTE
    - sender_role = ai_agent AND pc.case_type IN [warranty, project]
      → 403 AI_FORBIDDEN_WARRANTY_PROJECT  # 呼應 ADR-0035
  response:
    flex_message_template_id: <server-generated UUID>  # AI 不能自由組合數字
    quote_id: <id>
    trace_id: <W3C traceparent>
```

**雙閘**：sender_role + quote.state；response 含 server-generated `flex_message_template_id`（AI 拿 template ID 不拿原始金額字串）。

### 3. Guardrail 規則（不變）

ADR-0035 原文 guardrail 保留不動：

- 偵測 `NTD <number>` 且缺乏修飾語 → regen
- 偵測「您的維修費用是」等高風險 prefix → regen
- 偵測 token-level price utterance → block + audit

無需新 Eval 題目（句型重構不擴張 AI 自由度）。

### 4. 對齊 ADR-0054 Range Talk

ADR-0054 允許 AI 提及範圍：「依案件不同，一般落在 NTD 800-1,500 之間」。本 ADR 為 ADR-0054 在「個案 final quote」場景的特例：**已存在 quote 個案後，AI 不再以 range 形式描述本案**，必走 announce existence pattern。

### 5. Charter 邊界正式化

本 ADR 與 ADR-0028 / 0035 / 0054 同框架，明文：

- **Allowed**：announce existence + 引用 quote_id 給客服 / audit
- **Forbidden（永久）**：複誦個案 NTD 數字（口語 / Flex body text / Push message body）

未來若要朗讀數字 → 必走「AI Forbidden carve-out ADR」+ Legal + CEO + 客服主管簽核，**本 ADR 為 V2 charter baseline**。

| 範疇 | 說明 |
|:---|:---|
| **適用範圍** | 所有 AI agent 對客戶說的 utterance（LINE message / Push message / Flex header text）|
| **不適用** | 客服真人發 Flex（不過 AI guardrail）/ Settlement 對帳 / WO 結案憑證 |
| **可逆性** | **不可逆**（charter 邊界，工程不可單方面解除）|

## Consequences

### Positive

- Charter ADR-0028 / 0035 / 0054 zero conflict
- Guardrail 規則零變動，無 Eval 升級成本
- Server-side enforce 透過 `flex_message_template_id`，AI 即使 prompt injection 也組不出原始金額字串
- 0 sprint 啟動成本（句型即可生效）
- 與 ADR-0066 quote ↔ WO binding 同框架（AI 不直接觸發 WO + 不複誦 quote 數字）

### Negative

> [!WARNING]
> - 客戶 LIFF 多一跳 → 客服 30s 轉達節省由 LIFF 5s 自助體驗對沖
> - LIFF 授權失敗率 ~12-18%（業界值）→ K2 自助率 -8% ~ -12% sensitivity；客服 fallback 補位 + 72h cookie 對沖
> - 部分客戶仍會問「多少錢」 → 客服 macro 句型統一回覆「請查看下方系統訊息」

### Follow-up Work

| Action | Owner | Due | Reference |
|:---|:---|:---|:---|
| `POST /quotes/{id}:send-to-customer` endpoint 落 OpenAPI | sd | P3 Gate 5a | sd-B-2 |
| `flex_message_template_id` template library 建 | sd + ui | P3 | LIFF 模板 |
| 客服 macro「請查看下方系統訊息」上線 | po + 客服主管 | P4 | CS playbook |
| Eval 200 題加 20 題（AI 自報 vs AI 引用 quote_id 區辨）| qa | P4 | NFR-Sec-007 |

### 影響的下游文件

| Doc | Impact |
|:---|:---|
| `docs/architecture/api/openapi.yaml` | 加 `POST /quotes/{id}:send-to-customer` + 雙閘 |
| `docs/qa/test-plan-*.md` | Eval 200 題補 20 題 |
| `docs/analysis/system-spec-smart-lock-saas.md` | §3 BR-Quote-002 補第 4 條 guardrail（AI 不複誦個案數字）|

## Pre-mortem Mapping

- **F3 HITL 邊界漂移**：AI 邊界靠 server-side template enforce，不靠 prompt 訓練
- **F4 合規崩潰**：charter ADR-0028 hard constraint #1 邊界明文化，避免「工程語意辯護」攻擊面

## Eternal/Transient Classification

- **Eternal**：「AI 不複誦個案 NTD 數字」邊界 + server-side flex_message_template_id enforce 機制
- **Transient**：具體句型字面（可由 PO + 客服主管調整 macro，但保留「不複誦數字」邊界）

## Acceptance Criteria

- [x] 業主 2026-05-26 Q2=A 裁決
- [ ] `POST /quotes/{id}:send-to-customer` 雙閘上線（sender_role + quote.state）
- [ ] `flex_message_template_id` server-generated（AI 拿 template ID 不拿金額）
- [ ] Eval 200 題補 20 題（announce existence vs echo number 區辨）pass rate ≥ 95%
- [ ] Guardrail `NTD <number>` regen 規則不變動，Eval 回歸測試 pass
- [ ] 客服 macro「請查看下方系統訊息」上線 + 培訓 100%

## Cross References

- Forum final-report: `.claude/context/devteam/forum/2026-05-26-2241-Q01-quote-pricing-engine/final-report.md`
- ADR-0028 AI Employee Charter（hard constraint #1）
- ADR-0035 Warranty / Project Quote Policy（utterance ban 原文）
- ADR-0054 AI Quote Range Only（range talk 允許範圍）
- ADR-0047 AI Forbidden List as Charter
- ADR-0062 Pricing Engine Bounded Context（AI 不直接呼 pricing 邊界）
- ADR-0066 Quote ↔ WO Lifecycle Binding（AI 不觸發 WO + 不複誦數字同框架）
