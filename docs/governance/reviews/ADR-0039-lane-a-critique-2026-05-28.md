# Lane A Critique Merge Report: ADR-0039 Cancellation Fee Tiers

**日期**：2026-05-28
**Target**：`docs/architecture/adr/ADR-0039-cancellation-fee-tiers.md`
**Critique Personas**：BA / PM
**Intensity**：standard
**Convergence**：✅ **2/2 PARTIAL_UPDATE → SUPERSEDE**（升級結論：原 ADR 階段切分與金額已被新規格部分覆寫，需寫新 ADR-XXXX 取代）
**Per**：[`13_doc_migration_playbook §8`](../../../devteam_knowledge_base/13_doc_migration_playbook.md) Superseded 認定條件 + Roundtable A P0「取消費分層」cascade rule（[`cascade-2026-05-28-context-pack.md §1.1`](../../../.claude/context/devteam/cascade-2026-05-28-context-pack.md)）

---

## 📋 Verdict: **SUPERSEDE**

ADR-0039 的 **Decision 表 §S2 金額** 與 **階段切分顆粒度** 與 new spec §08 P2-06 + P2-07 直接衝突。雖然 ADR Decision 的「5 階段 + 客服覆寫 + audit + partial 公式 + configurable」**架構骨架仍 valid**，但**最終金額表 + 階段邊界**已被新規格重新定義，符合 `§8.1 Superseded 認定`：「新規格 P0/BR clause 與 ADR Decision 段落直接衝突 + 業主明確改口徑」。

**升級理由**（從 PARTIAL_UPDATE → SUPERSEDE）：
1. **S2「已派工未出發 = NTD 0」** 與 new spec P2-07「一般取消費 NTD 300-500，需主管 override」**金額方向相反**
2. **「已確認報價未派工」階段** ADR 併入 S1（業主備註），new spec 顯式拆出來為獨立階段（"可免或收行政費"）→ **顆粒度回歸 6 階段**
3. **業主原始註記**：「前期 未決，需定義付款後、當日、出發後、到場後」→ Roundtable A 明文「P0 級規則，極高機率 SUPERSEDE」
4. cascade impact 跨 ADR-0040 / ADR-0041 / ADR-0046 / ADR-0049 / ADR-0066 → 牽動的決策邊界改變，光 update v2 無法乾淨表達

→ 寫新 ADR：`ADR-XXXX-cancellation-fee-tiers-v2-final-spec`，原 ADR-0039 改 `status: Superseded by ADR-XXXX`。

---

## 🔍 兩 persona 結論

| Persona | 判定 | 核心理由 |
|:--------|:-----|:---------|
| BA      | SUPERSEDE | new spec 顆粒度由 5 階段擴為 6 階段；S2 金額方向相反（0 ↔ 收取消費）；新增「customer not onsite」「customer_quote_rejected_after_dispatch」「師傅延遲」等取消情境，ADR 表未覆蓋；M15 異常核准 sheet 已 "Accepted"，rule 已凍 |
| PM      | SUPERSEDE | 業主原始政策意圖（"前期 未決，4 段時間軸"）與 ADR-0039 v1 落點不同；KPI / 商業考量：S2 改收費影響毛利線 + 客訴口徑；ADR-0039 v1 屬 "Eternal Policy" 標記但金額骨架已過時，需 freeze 新 v2 給 Phase II finance scope |

---

## 🎯 ADR-0039 v1 vs Final Spec 條條對比

### §A 階段對比（核心衝突）

| 階段邊界 | ADR-0039 v1 | Final Spec (§08 P2-06) | 衝突等級 |
|:---------|:------------|:------------------------|:---------|
| 報價未確認前 | S1 = NTD 0 | = 0 | ✅ 一致 |
| **已確認報價、未派工** | （業主備註：併入 S1） | **獨立階段** = 可免或收行政費 | 🔴 **顆粒度衝突** |
| **已派工、師傅未出發** | S2 = **NTD 0**（業主：師傅未出發無實質成本） | = **收取消費 NTD 300-500（P2-07）+ 主管 override** | 🔴 **金額方向相反** |
| 師傅已出發、未到場 | S3 = 車馬費 NTD 500-1,200 | = 收車馬費 | ✅ 對齊 |
| 已到場、無法/不施工 | S4 = 車馬費 + 檢測費 NTD 300 | = 車馬費 + 檢測費 | ✅ 對齊 |
| 已施工後取消 | S5 = partial 公式 | = 依完成比例/材料/人工計費 | ✅ 概念對齊（公式需對齊細項） |

→ **2 個衝突點 + 4 個對齊** = 部分覆寫達 "金額表骨架重定義" 強度，業主政策口徑已明顯不同。

### §B 新規格引入的取消情境（ADR-0039 v1 未覆蓋）

| 情境 | new spec 來源 | ADR-0039 v1 處理 | Gap |
|:-----|:--------------|:------------------|:-----|
| **客戶不在場（customer not onsite）** | Q047 row 210 / G038 row 322 / Q047 row 1254：「客戶不在且師傅確認客戶無法到場，工單取消」+「客戶不在是否收車馬費？可以要收」 | ❌ 未覆蓋 | 需補 reason code + 對應階段（通常 S3/S4） |
| **師傅延遲 / 師傅單方面取消** | Q047 row 210（FR-0010 已處理 reschedule 但取消費未掛） | ❌ 未提及師傅方取消是否收客戶取消費（合理應 = 0 + 師傅 penalty） | 需補：師傅 initiated cancel 政策 |
| **customer_quote_rejected_after_dispatch** | ADR-0039 v2 update note 已補（連動 Forum Q-01 / ADR-0066）| ✅ v2 已補 | 但只覆蓋 onsite v+1 加價拒絕，**標準路徑客戶 confirm 後又拒** 因 Q1=A 硬綁定被宣告不存在 — 與 new spec Q092「仍需決策」邊界對齊度需 PM 確認 |
| **客戶投訴升級轉退款 (FR-0014)** | FR-0014 / ADR-0040 退款分層 | ⚠️ 邊界註記有但未對齊 ADR-0040 v2 | cascade |
| **付款不符 / 客戶未回覆**（Q065 row 228 新規格加入） | Q065：「另建議加入付款不符、師傅延遲、客戶未回覆」（業主答 YES） | ❌ 未覆蓋 | 需補 reason code 與費別 |

---

## 📊 PM persona — 商業 / KPI 視角

| 維度 | 觀察 | 影響 |
|:-----|:-----|:-----|
| **政策口徑** | 業主在 ADR-0039 寫「S2 = 0」基於「師傅未出發無實質成本」；final spec 改回「收取消費 NTD 300-500」基於 P2-07「一般取消 admin 成本」邏輯 | 客服話術腳本要重寫；客戶溝通模板（LINE 通知文案）需 v2 化 |
| **毛利線** | S2 從 0 → 300-500/case：以每月 ~3-5% 取消率估算（Phase II 預估 1000 case/月），月增 NTD 9k-25k 收入；但若觸發客訴升級 → 退款成本反彈 | 邊際正向但客服 escalation 風險 ↑ |
| **客訴爭議** | 多出「已確認未派工」階段給客服「可免或收行政費」彈性 → 降低客訴升級率 | 正向；但需配套 SOP |
| **scope** | new spec 將 cancellation matrix 歸 Phase II Finance（sheet-08）→ V1 預設金額 freeze 時程從「Phase I launch」改為「Phase II finance ready」 | ADR Acceptance Criteria 第 2 條「主管 + 會計簽核」要 retag 為 Phase II milestone |
| **與 ADR-0040 / 0041 cascade** | ADR-0040 退款分層 同被標 REVIEW_REQUIRED；取消費 → 部分退款 路徑要對齊 | 需 ADR-0040 v2 同步 |
| **AI 永禁直接告知金額** | ADR-0039 已寫；new spec P2-29 進一步明文 AI 不可核准退款 / 修改月結 / 判定保固責任 / 承諾法律安全結果 | ADR v2 引用 P2-29 更精確 |

---

## 🎯 必補維度（cascade work）

| # | 維度 | 來源 persona | 動作 |
|:--|:-----|:-------------|:-----|
| 1 | **階段表升 6 階段**：拆出 S1.5「已確認報價未派工 = 可免 / 收行政費」 | BA | new ADR Decision 表加 1 列 |
| 2 | **S2 金額改為 configurable default NTD 300-500 + 主管 override**（業主 confirm）| BA + PM | 對齊 P2-07；ADR Acceptance Criteria 補「業主第二次拍板 S2 ≠ 0」decision log |
| 3 | **新增 reason code dictionary**（customer_not_onsite / technician_initiated_cancel / unpaid_no_response / quote_rejected_after_dispatch / customer_dispute_to_refund / customer_quote_rejected_after_dispatch） | BA | new ADR 補 reason code enum；audit log 必填 |
| 4 | **師傅 initiated cancel** 政策獨立段落：客戶側取消費 = 0，師傅 penalty 走 ADR-0045 acceptance SLA + FR-0010 penalty | BA + PM | new ADR 補一段 §技師方取消 |
| 5 | **客戶不在場「可以要收」明文化**（Q047 業主決議）→ 對應 S3/S4 階段，需 GPS + timestamp 為 evidence（BR-M08-01）| BA | new ADR 補一段 §客戶不在場費；引用 ADR-0050 evidence visibility v2 |
| 6 | **Acceptance Criteria 重 retag**：Phase II milestone owner = 會計 + 主管；M15 sheet "Accepted" 已凍 → 引用 sheet-04 P0 + sheet-08 + sheet-15 M15 final | PM | new ADR Acceptance Criteria 加 traceability |
| 7 | **與 ADR-0040 cascade**：取消費 → partial refund 路徑同步 v2（refund tier 表也是 REVIEW_REQUIRED）| BA + PM | new ADR cross-ref ADR-0040 v2（下個 task） |
| 8 | **partial 公式 (S5) 對齊 ADR-0049 onsite scope change** | BA | new ADR 保留 + 明引 ADR-0049 三件套 evidence + ADR-0066 quote version |

---

## ⚠️ 跨 persona 衝突點（已記錄）

| 議題 | 衝突 | 處理建議 |
|:-----|:-----|:---------|
| BA 主張「S2 改 0 → 300-500 是業主政策變更」；PM 主張「S2 仍可保留 0 但加 supervisor override 為 default」 | 兩派同向但口徑不同 | 建議 new ADR 寫「S2 default = NTD 300-500 configurable per brand；客服可 override to 0 with reason code = goodwill_waiver」→ 兩派共識 |
| 「已確認未派工」階段：PM 認為和 S1 經濟意義一樣（成本未產生）；BA 認為應拆獨立階段以對應 spec sheet 顆粒度 | 顆粒度 vs 簡潔度 | 建議拆獨立階段（合 spec）但 default 金額 = 0 或低額行政費（合 PM 直覺） |
| Cascade：ADR-0066 Q1=A 硬綁定使「customer confirm 後拒絕原 quote」case 不存在；但 new spec Q092 仍寫「仍需決策」 | ADR vs spec 邊界不一致 | new ADR 內 §B 表明文標 case = "標準路徑：N/A（Q1=A 硬綁定下不存在）；onsite v+1：走 customer_quote_rejected_after_dispatch + ADR-0049 三件套" |

→ 無需升 Lane B（兩 persona 共識 SUPERSEDE，分歧落在執行細節）。

---

## 📐 New ADR 大綱：`ADR-XXXX-cancellation-fee-tiers-v2-final-spec`

```yaml
---
id: ADR-XXXX  # 待 ADR-0100 ledger 分配
title: 取消費分段 v2 — 6 階段 + reason code dictionary（final spec 2026-05-20 對齊）
status: proposed
date: 2026-05-28
supersedes: ADR-0039
source_trade_off: docs/_source/01-workorder-erp.md §04 P0 (row 143) + §08 P2-06/P2-07 + §15 M15
deciders: [業主, 會計, 主管]
related:
  - ADR-0040  # refund-approval-tiers v2（同 cascade）
  - ADR-0041  # travel-fee-split（still valid）
  - ADR-0045  # acceptance-sla-policy（師傅 initiated cancel）
  - ADR-0046  # change-request-object（金額變更）
  - ADR-0049  # onsite-scope-change-protocol（S5 partial 對齊）
  - ADR-0050-v2  # evidence-visibility-matrix（GPS + 不在場證據）
  - ADR-0066  # quote-WO hard binding（S1 邊界）
pre_mortem: F4 (合規崩潰) + F1 (顆粒度)
eternal_transient: Eternal (6 階段骨架 + override + audit + reason code dict) / Transient (具體金額 configurable)
---
```

### Decision §1 — 6 階段表（取代 ADR-0039 5 階段）

| 階段 | 觸發點 | 客戶側收費（V1 default） | reason code 預設 | 客服覆寫 |
|:-----|:-------|:------------------------|:----------------|:--------|
| S1 | 報價未確認前 | NTD 0 | quote_not_confirmed | ✅ |
| **S1.5（NEW）** | **已確認報價、未派工** | **NTD 0 或行政費 NTD 100-200（configurable）** | quote_confirmed_no_dispatch | ✅ |
| **S2（金額改）** | 已派工、師傅未出發 | **NTD 300-500（configurable）+ goodwill_waiver 可 override → 0** | dispatched_not_departed | ✅ |
| S3 | 已出發、未到場 | 車馬費 NTD 500-1,200 + 取消費（同 S2） | en_route_cancelled / customer_not_onsite | ✅ |
| S4 | 已到場、無法/不施工 | 車馬費 + 檢測費 NTD 300 + 取消費（同 S2） | onsite_not_executed / customer_refused | ✅ |
| S5 | 已施工後取消 | partial 公式 + 車馬費（引 ADR-0049 + ADR-0066 quote_version） | partial_completed_cancel / customer_quote_rejected_after_dispatch (v+1) | ✅ |

### Decision §2 — Reason Code Dictionary（NEW）

引 new spec Q065 row 228 業主答 YES 補充：

```yaml
cancellation_reason_codes:
  - quote_not_confirmed          # S1
  - quote_confirmed_no_dispatch  # S1.5
  - dispatched_not_departed      # S2
  - en_route_cancelled           # S3 客戶取消
  - customer_not_onsite          # S3/S4 客戶不在
  - technician_initiated_cancel  # 師傅方（客戶側 0）
  - unpaid_no_response           # 客戶未回覆 / 付款不符 → 走系統取消
  - onsite_not_executed          # S4 不施工
  - customer_refused             # S4 拒絕
  - partial_completed_cancel     # S5
  - customer_quote_rejected_after_dispatch  # S5 onsite v+1 加價拒絕（v2 補）
  - goodwill_waiver              # 客服 override 用
  - supervisor_override          # > 50% / 免收 主管 override
```

### Decision §3 — 師傅方 initiated cancel（NEW 段落）

師傅單方面取消（含 no-show、聯絡不上）→ 客戶側取消費 = 0；師傅進 penalty queue：
- 走 FR-0010 / ADR-0045（acceptance SLA）
- 客戶側自動 emit `WorkOrderRescheduleRejected` → re-dispatch（FR-0003）
- M07 weight -5（同 30 min 內 reschedule penalty）

### Decision §4 — Override + Audit（沿用 ADR-0039 v1，補欄位）

Override audit log 必填欄位（補 v1 缺項）：
- `operator_id`, `operator_role`, `original_amount`, `new_amount`, `delta_pct`
- `reason_code`（來自 §2 dictionary，必須在 enum 內）
- `supervisor_approval_id`（when delta_pct > 50% or amount = 0）
- `quote_id`, `quote_version`（cascade ADR-0066）
- `evidence_ids`（GPS / chat / signature 等，cascade ADR-0050 v2）

### Decision §5 — Configurable per brand（沿用）

透過 ChangeRequest (ADR-0046) 修改：金額表 + reason code 中文文案 + 客服覆寫門檻。

### Acceptance Criteria（重 retag）

- [ ] 業主第二次拍板 6 階段 + S2 改收費（必須 2026-05-30 前確認，否則阻擋 Phase II finance scope freeze）
- [ ] 會計 + 主管簽核 V1 金額表（S1 / S1.5 / S2 / S3 / S4 各階段 default）
- [ ] M11 AR + M15 Exception sheet 對齊新階段表
- [ ] reason code dictionary 進 M18 System Setup（configurable + audit）
- [ ] Backend state machine 自動推算 6 階段（新增 S1.5 status）
- [ ] 客服 UI 顯示「當前階段 + system 預設金額 + 覆寫輸入框 + 試算 + reason code 下拉」
- [ ] AI 永禁直接告知金額（沿用 ADR-0035 + new spec P2-29）
- [ ] QA：6 階段切換、reason code enum 驗證、override audit、partial 計算、師傅 initiated cancel、客戶不在場、> 50% 主管覆核 全套 TC
- [ ] cascade：ADR-0040 v2 退款分層同步更新（取消費 → partial refund 路徑）
- [ ] cascade：FR-0010 改約 / FR-0014 退款 / FR-0018 客訴 cross-ref new ADR

### Consequences

**Positive**：
- 階段顆粒度完全對齊 new spec
- Reason code dictionary 給 BI / AI 分類提供結構化欄位
- 師傅 initiated cancel 明文化 → 客戶口徑統一
- cascade chain（ADR-0040 / 0041 / 0046 / 0049 / 0066）全部對齊

**Negative**：
- 客服 UI 多 1 個階段 + reason code 下拉 → 訓練成本
- S2 金額改收費可能觸發短期客訴爬升（mitigation: SOP + script）
- Phase II finance freeze 取決於業主 + 會計同步簽核

### Pre-mortem Mapping
F4（合規崩潰）+ F1（顆粒度太粗）— 完全閉合。

---

## 🎯 Follow-up Actions

| # | Action | Owner | Priority |
|:--|:-------|:------|:---------|
| F1 | 寫 new ADR：`ADR-XXXX-cancellation-fee-tiers-v2-final-spec`（依上面大綱）| `devteam-arch` | P0 |
| F2 | ADR-0039 frontmatter 改 `status: Superseded by ADR-XXXX` + `superseded_on: 2026-05-28` + `superseded_reason: "new spec §08 P2-06 + P2-07 6 階段表 + S2 金額方向改變"` | `devteam-arch` | P0 |
| F3 | ADR-0100 ledger 更新：ADR-0039 從 REVIEW_REQUIRED → SUPERSEDE；分配 new ADR ID | `devteam-arch` | P0 |
| F4 | ADR-0040 v2 cascade（取消費 → partial refund 路徑同步）| `devteam-arch` | P1 |
| F5 | FR-0014 refund / FR-0010 reschedule frontmatter 補 related_adrs new ID + 對應 BR-M11/M15-NN | `devteam-analyst` | P1 |
| F6 | new BR sheet：`BR-M15-CANCEL-01~10`（6 階段 + reason code + override 規則 + 師傅 initiated）| `devteam-analyst` | P1 |
| F7 | M18 System Setup config：cancellation_reason_codes enum + 金額表 schema | `devteam-design` | P2 |
| F8 | QA test plan：6 階段 × reason code × override × cascade scenarios（估 ≥ 18 TC）| `devteam-qa` | P1 |
| F9 | 業主裁決會議：S2 改收費 + S1.5 拆出 + 師傅 initiated cancel 政策 三項拍板 | `devteam-router` 升級 | P0 |

---

## 📊 Confidence

- **Verdict confidence**: HIGH（2/2 persona 共識；spec sheet "Accepted" 已凍；Roundtable A 明文 P0 SUPERSEDE 預期）
- **Cascade 完整性**: MEDIUM-HIGH（已盤點 ADR-0040 / 0041 / 0046 / 0049 / 0066 + FR-0010 / 0014 / 0018，但 BR-M15 細項需 analyst 補）
- **無需 Round 2 / Lane B 升級**: 證據充分；唯一未決點（S2 default 金額、S1.5 default 金額、師傅 initiated 政策）為**業主裁決點**而非 persona 衝突，走 P0 升級即可

---

## 🔗 Drill-down

- 原 critique 完整內容：
  - BA persona: 本檔 §A + §B
  - PM persona: 本檔 §PM persona — 商業 / KPI 視角
- ADR 原檔：`docs/architecture/adr/ADR-0039-cancellation-fee-tiers.md`
- New spec 對照：
  - `docs/_source/01-workorder-erp.md` row 143（§04 P0 取消費 P0-09）
  - row 437-438（§08 P2-06 / P2-07 階段 matrix + 金額）
  - row 210 / 322 / 1088 / 1254（客戶不在場 / G038 / Q047）
  - row 228（Q065 新增取消情境 業主答 YES）
  - row 475（§08 M15 異常核准 Accepted）
- 相關 ADR ledger 更新點：`docs/architecture/adr/ADR-0100-legacy-adr-supersede-index.md` row 100 + row 158
- Cascade pack：`.claude/context/devteam/cascade-2026-05-28-context-pack.md` §1.1（Roundtable A P0 取消費分層）
- Roundtable A MoM：`.claude/context/devteam/meetings/2026-05-27-1130-final-spec-migration-strategy/MoM.md`

> 本次 critique 為 **A2.4 task 6 條 REVIEW_REQUIRED 中第 3 條**（ADR-0050 ✅ / ADR-0008 ⏳ / ADR-0009 ⏳ / **ADR-0039 ✅ 本次** / ADR-0040 ⏳ / ADR-0044 ⏳）。
> 餘 3 條（ADR-0008 / 0009 / 0044）下個 session 推進；ADR-0040 緊接同 session 推進（與本案 cascade 強耦合）。
