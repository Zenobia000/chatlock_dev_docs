---
id: ADR-0066
title: Quote ↔ WorkOrder Lifecycle Hard Binding（with Emergency Carve-out）
status: accepted
date: 2026-05-26
deciders: [業主, arch, sd, ba, ux]
supersedes: []
related: [ADR-0031, ADR-0032, ADR-0033, ADR-0034, ADR-0039, ADR-0046, ADR-0048, ADR-0049, ADR-0062, ADR-0063, ADR-0065]
source: Forum 2026-05-26-2241-Q01 final-report（arch-B-03 + sd-B-1 + ux-B-2 + 業主 Q1=A + Q3=A）
pre_mortem: F1 (UX friction) + F3 (HITL 邊界漂移) + F6 (audit chain 斷裂)
eternal_transient: Eternal Lifecycle Invariant (B3)
---

# ADR-0066: Quote ↔ WorkOrder Lifecycle Hard Binding（with Emergency Carve-out）

## Status

Accepted (2026-05-26)

## Context

Forum Q-01 D2 與 D5 兩議題交織：

- **D2**：quote ↔ WO lifecycle 銜接（軟綁定 vs 硬綁定）
- **D5**：急件 4 類 quote 處理（locked_out / trapped_inside / safety_risk / angry_customer_high_risk）

業主原話「客服報價 → 客人確認 → 才立工單」字面是 D2-A 硬綁定（quote.customer_confirmed 為 WO.created 前置）。R1 proposer 推薦 D2-B 軟綁定（customer_confirmed 為 WO.completed 前置而非 created）以避免撞 ADR-0048 5min 急件規則。

R3 升業主 binary choice Q1（D2 軟硬綁定）+ Q3（急件路徑）。

**業主 2026-05-26 裁決**：

- **Q1 = A 硬綁定**：嚴守原話字面，`WO.created` precondition += `Quote.customer_confirmed`
- **Q3 = A 急件跳過 quote**：急件 `pc.emergency_class IS NOT NULL` 時跳過 quote 直接 WO，事後 4h 內補 quote audit

本 ADR 把兩條裁決合成 lifecycle 不變式（hard binding + emergency carve-out），與既有 ADR-0031 / 0032 / 0048 / 0049 框架對齊。

## Decision Drivers

| Priority | Driver | Weight | Reference |
|:---:|:---|:---|:---|
| 1 | 業主原話字面詮釋（不曲解）| critical | 業主直接裁決 |
| 2 | 急件路徑不被綁定阻塞（ADR-0048 5min）| critical | ADR-0048 |
| 3 | Audit chain 完整性（即使 carve-out 也要事後補）| high | ADR-0049 evidence |
| 4 | AI 不直接觸發 WO（ADR-0031 charter）| critical | ADR-0028 / 0031 |
| 5 | 結案 422 address hard gate 同框架 | high | ADR-0032 |

## Options Considered

### Option A — 硬綁定 + 急件 carve-out（採用）

| 維度 | 內容 |
|:---|:---|
| **Pros** | • 嚴守業主原話<br>• 派工後客戶拒絕場景不存在（quote 已 confirmed）<br>• Audit chain 標準路徑完整<br>• 急件 carve-out 與 ADR-0048 5min 規則對齊 |
| **Cons** | • 客服建 WO 從 1-click → 2-step（建 quote → 等 confirmed → 建 WO）<br>• +1.5 sprint vs 軟綁定<br>• 急件事後補 quote audit 需特設 SLA（4h）|
| **Fit** | 業主原話 strict 詮釋 + ADR-0048 5min 急件框架 |
| **Anti-fit** | 高頻派工 / 慢確認的 SLA |
| **Cost / Effort** | M（+1.5 sprint）|

### Option B — 軟綁定（D2-B'，customer_confirmed 為 WO.completed 前置）

| 維度 | 內容 |
|:---|:---|
| **Pros** | • 1-click 維持<br>• 派工 / 結案並行<br>• 急件零調整<br>• +0.5 sprint |
| **Cons** | • 不符業主原話字面<br>• 派工後客戶拒絕 → 需新 WO.disputed state + ADR-0039 補 reason code<br>• 需重新教育業主「customer_confirmed 為 completed 前置而非 created 前置」 |
| **Fit** | 商業實用主義詮釋 |
| **Anti-fit** | 業主裁決 Q1=A |
| **Cost / Effort** | S（+0.5 sprint）|

## Decision

> [!IMPORTANT]
> **選擇**: Option A — Hard binding（標準路徑）+ Emergency carve-out（急件路徑）

### 1. 標準路徑 — `WO.created` Precondition

```
WO.created precondition = PC.confirmed
                          AND Quote.customer_confirmed = true
```

派 WO 之前 quote 必須 customer_confirmed。

**對應 endpoint enforce**（呼應 sd-B-1）：

```yaml
POST /work-orders:
  required: [pc_id, tenant_id, created_by_role, quote_id]
  properties:
    quote_id: { type: string, format: uuid }  # required
  errors:
    425 QUOTE_NOT_CUSTOMER_CONFIRMED  # quote.state != customer_confirmed
    409 QUOTE_STATE_INVALID            # quote.state IN {expired, rejected}
```

### 2. 標準路徑 — `WO.completed` Precondition（含 address hard gate）

```
WO.completed precondition = address IS NOT NULL                       -- ADR-0032
                           AND Quote.customer_confirmed = true         -- 本 ADR
                           AND pc.emergency_class IS NULL              -- 標準路徑
```

呼應 ADR-0032 結案 422 address hard gate，本 ADR 加 quote.customer_confirmed 為第二硬條件。

### 3. 急件 Carve-out — Skip Quote 直接 WO

業主 Q3=A 裁決：locked_out / trapped_inside / safety_risk / angry_customer_high_risk 四類急件路徑跳過 quote。

**`WO.created` precondition（含 carve-out）**：

```
WO.created precondition =
   PC.confirmed
   AND (
     Quote.customer_confirmed = true               -- 標準路徑
     OR pc.emergency_class IS NOT NULL             -- 急件 carve-out
   )
```

### 4. 急件事後補 Quote Audit（4h SLA）

急件路徑跳過 quote 直接 WO，但 audit chain 不可缺位。事後補：

| 階段 | 動作 | SLA |
|:---|:---|:---|
| WO.in_progress / completed | 客服必補 quote（state: `retrospective_audit_only`）| onsite 結束後 **4h 內** |
| WO.completed | quote.state 從 `retrospective_audit_only` → `customer_audit_complete`（客戶 LIFF 簽 / 紙本簽 / ADR-0049 三件套）| 24h 內 |
| Audit alert | 4h 內未補 quote → page customer service lead + ChangeRequest type=`emergency_pricing_track` 進客服 escalate queue | hard alert |

### 5. `WO.completed` Precondition（含 carve-out）

```
WO.completed precondition =
   address IS NOT NULL                              -- ADR-0032
   AND (
     (Quote.customer_confirmed = true
      AND pc.emergency_class IS NULL)               -- 標準路徑
     OR
     (pc.emergency_class IS NOT NULL
      AND retrospective_quote_audit_complete = true)  -- 急件 + 事後補 audit 完成
   )
```

`retrospective_quote_audit_complete` 為新 application-level field（dba-C-3 應用層 422，非 DB CHECK）。

### 6. Emergency Class 4 類（對齊 ADR-0034）

| `pc.emergency_class` | 觸發條件 | 是否走 carve-out |
|:---|:---|:---:|
| `urgent.locked_out` | 客戶被鎖門外 | ✅ |
| `urgent.trapped_inside` | 門內受困（小孩 / 長輩 / 寵物）| ✅ |
| `urgent.safety_risk` | 安全風險（門鎖損壞 / 闖空門）| ✅ |
| `urgent.angry_high_risk` | 怒客高風險 | ✅ |

### 7. 與既有 ADR 對齊

| ADR | 對齊點 |
|:---|:---|
| **ADR-0031** AI 永不直接 `convert_to_work_order` | WO.created 由客服 `created_by_role` 觸發；本 ADR 加 quote.customer_confirmed 前置不改變 AI 邊界 |
| **ADR-0032** 結案 422 address hard gate | 本 ADR `WO.completed` precondition 與 address gate **AND** 串接 |
| **ADR-0034** urgent / Red Code 4 類 | `pc.emergency_class` 直接引用本 ADR 4 類 enum |
| **ADR-0048** 急件 5min 強制轉真人 | 急件路徑跳過 quote 流程，與 5min 轉真人計時器無互踩 |
| **ADR-0049** Onsite Scope Change 三件套 | 急件事後補 quote audit 走 ADR-0049 三件套作 evidence |
| **ADR-0039** Cancellation Fee Tiers | 標準路徑 S1「報價未確認前取消 NTD 0」與本 ADR `WO.created` 前 quote 必須 confirmed 對齊 |
| **ADR-0063** AI Utterance Boundary | AI 不複誦 quote 個案數字，customer_confirmed 由客戶在 LIFF 主動操作觸發，不靠 AI 朗讀 |
| **ADR-0065** ChangeRequest.type lookup table | 急件事後 audit 走 `change_request.type = emergency_pricing_track` lookup row |

### 8. WO State Machine 不新增 disputed State

業主 Q1=A 後，「派工後客戶拒絕」場景不存在（quote 已 confirmed）。**不**新增 WO.disputed state（軟綁定路徑下才會需要）。

但 onsite scope change（v+1 加價）仍可能觸發拒絕路徑，走 ADR-0049 既有 `customer_disagreed_partial` onsite 中間態（呼應 ux-S-2 / dba-C-5 transactional outbox）。

| 範疇 | 說明 |
|:---|:---|
| **適用範圍** | 所有 quote ↔ WO lifecycle binding |
| **不適用** | onsite scope change v+1 加價路徑（走 ADR-0049 customer_disagreed_partial）|
| **可逆性** | 半可逆（降級為軟綁定需另開 ADR + ADR-0039 補 reason code + WO.disputed state）|

## Consequences

### Positive

- 嚴守業主原話字面，未來爭議裁決有明文依據
- 派工後客戶拒絕場景不存在（quote 已 confirmed），標準路徑 audit chain 完整
- 急件 carve-out 與 ADR-0048 5min 規則對齊，急件路徑零調整
- 急件事後補 quote audit（4h SLA + ADR-0049 三件套）maintain 急件路徑 audit chain
- AI 邊界靠 `WO.created` `created_by_role` enforce，不改 ADR-0031 charter

### Negative

> [!WARNING]
> - 客服建 WO 從 1-click → 2-step（建 quote → 等 customer_confirmed → 建 WO）
> - +1.5 sprint vs 軟綁定
> - 急件事後補 quote audit SLA 4h 為新增客服責任，需 macro / 培訓配套
> - `retrospective_quote_audit_complete` 為應用層 field，靠 422 + audit_trail 留證（dba-C-3 模式），不走 DB CHECK constraint

### Follow-up Work

| Action | Owner | Due | Reference |
|:---|:---|:---|:---|
| `WorkOrderCreate.quote_id` required + 425/409 error codes | sd | P3 Gate 5a | §1 |
| `pc.emergency_class IS NOT NULL` carve-out 在 endpoint enforce | sd | P3 | §3 |
| `retrospective_quote_audit_complete` field 加進 quote 表 | dba | P3 Gate 5b | §4 |
| 4h SLA 補 quote audit alert + ChangeRequest emergency_pricing_track 流程 | po + sre | P4 | §4 |
| 客服 macro 「急件已派工，請於 4h 內補報價 audit」 | po + 客服主管 | P4 | §4 |
| ADR-0039 補 reason code `customer_quote_rejected_after_dispatch`（onsite scope change 拒絕用）| arch | P2 | §8 |

### 影響的下游文件

| Doc | Impact |
|:---|:---|
| `docs/analysis/system-spec-smart-lock-saas.md` | §2.4 WO state machine precondition + §2.3 Quote state machine + §3 BR-WO-002 / BR-Quote-003 / BR-Quote-004 |
| `docs/ux/user-flow-smart-lock-saas.md` | Flow S2 補急件 carve-out 分支 + 客服建 WO 2-step UX |
| `docs/architecture/api/openapi.yaml` | `POST /work-orders` 加 `quote_id` required + 425/409 + emergency carve-out exempt |
| `docs/architecture/data/erd.md` | `quote.state` enum 加 `retrospective_audit_only` / `customer_audit_complete` + `quote.retrospective_audit_complete` field |
| `docs/qa/test-plan-*.md` | 標準路徑 + 急件 carve-out + 4h SLA alert 演練 |

## Pre-mortem Mapping

- **F1 UX friction**：客服建 WO 2-step 為已接受 trade-off（換業主原話字面 enforce）
- **F3 HITL 邊界漂移**：WO.created 由 `created_by_role=customer_service` 觸發，AI 邊界不變
- **F6 audit chain 斷裂**：急件 carve-out 4h SLA 補 audit + ADR-0049 三件套 evidence，audit chain 不缺位

## Eternal/Transient Classification

- **Eternal**：「quote.customer_confirmed 為 WO.created 前置（除急件）」+「急件事後補 audit」原則
- **Transient**：4h SLA 具體時長（可由業主 + 客服主管調整）+ emergency_class 4 類 enum（每年校準）

## Acceptance Criteria

- [x] 業主 2026-05-26 Q1=A + Q3=A 裁決
- [ ] `POST /work-orders` enforce `quote_id` required + 425/409 error codes
- [ ] `pc.emergency_class IS NOT NULL` carve-out endpoint test pass
- [ ] `retrospective_quote_audit_complete` field migration（dba）
- [ ] 4h SLA alert 進 Grafana + page customer service lead
- [ ] 急件 carve-out → ChangeRequest `emergency_pricing_track` 流程 demo（呼應 ADR-0065 lookup row）
- [ ] WO.completed 422 hard gate（address + quote.customer_confirmed OR 急件 + retrospective_audit_complete）測項 pass
- [ ] 客服 macro 上線 + 培訓 100%

## Cross References

- Forum final-report: `.claude/context/devteam/forum/2026-05-26-2241-Q01-quote-pricing-engine/final-report.md`
- ADR-0031 AI Never Auto-convert WO
- ADR-0032 Missing Address Policy（結案 422 同框架）
- ADR-0033 Problem Card Completeness Gate
- ADR-0034 Urgent / Red Code 4 類
- ADR-0039 Cancellation Fee Tiers（補 reason code）
- ADR-0046 ChangeRequest Object
- ADR-0048 AI ↔ Human Handoff Rules（急件 5min）
- ADR-0049 Onsite Scope Change Protocol（三件套 evidence）
- ADR-0062 Pricing Engine Bounded Context
- ADR-0063 AI Utterance Boundary
- ADR-0065 ChangeRequest.type Lookup Table（emergency_pricing_track row）
