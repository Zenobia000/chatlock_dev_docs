---
title: Lane A Critique — ADR-0040 Refund Approval Tiers
date: 2026-05-28
target: docs/architecture/adr/ADR-0040-refund-approval-tiers.md
lane: A
intensity: standard
personas: [BA, PM, Orchestrator]
reviewed_against: docs/_source/01-workorder-erp.md (final spec 2026-05-20)
verdict: PARTIAL_UPDATE
verdict_confidence: HIGH
conflicts_count: 1
related:
  - ADR-0100 §1 (REVIEW_REQUIRED row 4/6)
  - FR-0014 (refund.md 殼)
  - Roundtable A 2026-05-27 (退款核准分層 P0 規則)
---

# Lane A Critique Merge Report — ADR-0040 退款核准分層

**Target**: `docs/architecture/adr/ADR-0040-refund-approval-tiers.md`
**Intensity**: standard
**Personas**: BA / PM / Orchestrator
**Per**: [`13_doc_migration_playbook §2`](../../../devteam_knowledge_base/13_doc_migration_playbook.md) REVIEW_REQUIRED 進入決策結論

---

## 📋 Executive Summary (TL;DR 30s)

ADR-0040 五層金額分層**主體保留**（與 final spec P2-11 default 1-to-1 對齊），但**需 PARTIAL_UPDATE 補三項**：(1) **SoD 矩陣**（誰可發起 / 誰可核准 / 誰可執行，AI 永禁），(2) **Partial refund 分類**（product/labor/material/travel/inspection — spec BR-M11-02 強制），(3) **可配置語義**（金額門檻 = configurable，非 hardcoded — spec 反覆強調）。

**Verdict**: `PARTIAL_UPDATE` — 不 SUPERSEDE（核心 5 層門檻 spec 直引）、亦非純 STILL_VALID（缺 partial refund 分類 + SoD 顯化）。原 ADR 升 v2，frontmatter 改 `status: partial-updated`。

> **業主 Roundtable A 預期判定 = SUPERSEDE**，本次 critique 證據鏈顯示應為 PARTIAL_UPDATE：spec P2-11 default 5-tier 與 ADR-0040 5-tier **完全一致**，不存在「新規格覆寫」。但 spec 引入 BR-M11-02 partial refund classification + 「configurable, do not hardcode」原則為 ADR 未涵蓋的維度 — 屬補強而非取代。

---

## 🔍 三 persona 結論

| Persona | 判定 | 核心理由 |
|:--------|:-----|:---------|
| **BA** | PARTIAL_UPDATE | spec P2-11 + BR-M11-02 與 ADR-0040 5-tier **無衝突**，但缺 SoD (initiator / approver / executor) 三維拆分；缺 partial refund 分類欄位（product/labor/material/travel/inspection） |
| **PM** | PARTIAL_UPDATE | 退款率 KPI / SLA 風險可控，5-tier 對 P50 case 友好；但「主管 + 會計 + Sponsor」L5 雙簽未定義 Sponsor 角色，可能 block 高金額退款 → 影響客訴 lag time |
| **Orchestrator** | PARTIAL_UPDATE | 兩 persona 共識，conflicts_count=1（L5 Sponsor 角色定義），不觸發 Lane B 升級 |

---

## §1 BA Persona Critique

### 1.1 ADR-0040 vs Final Spec 逐條對比

| 維度 | ADR-0040 原版 | Final Spec (2026-05-20) | 對齊度 |
|:-----|:--------------|:------------------------|:------|
| L1 ≤ NTD 1,000 | 客服主管 | ≤ 1,000 客服主管 (P2-11) | ✅ 完全對齊 |
| L2 1,001-5,000 | 營運主管 | 1,001-5,000 營運主管 (P2-11) | ✅ 完全對齊 |
| L3 5,001-30,000 | 營運主管 + 會計 | 5,001-30,000 營運主管 + 會計 (P2-11) | ✅ 完全對齊 |
| L4 30,001-100,000 | 主管 + 會計 | 30,001+ management approval (P2-11) | ✅ 對齊 |
| L5 > 100,000 | 雙簽（主管 + 會計 + Sponsor） | > 100,000 必須 double approval (P2-11) + operations + finance double sign (BR-M11-02) | ⚠️ 部分對齊 — spec 未提 Sponsor 第三方 |
| 退款理由 reason code | 6 種 (customer_dispute / quality_issue / wrong_dispatch / warranty_coverage / goodwill / other) | spec 要求 reason code 但未列舉清單 | ✅ ADR 補充 |
| Refund Ledger | 永久留證 audit trail | M11/M15 Refund Ledger「依金額分層核准」(line 603) | ✅ 對齊 |
| **Partial refund 分類** | **❌ 缺** | **BR-M11-02 強制**：partial refund 必須分類 product / labor / material / travel / inspection (line 365, 884, 1151) | 🔴 **ADR 缺項** |
| **SoD 矩陣** | 只有「核准」欄；無 initiator / executor 分工 | G019: AI 不可退款核准 (line 303); §F partial refund workflow 暗示需 SoD | 🔴 **ADR 缺項** |
| 可配置性 | Transient 段標「金額門檻 configurable」 | 多處強調：「不可 hardcode money 或 refund rules」(Q094); 「Keep configurable」(P2-11); BR-M11-02 owner 會計/主管 | ⚠️ ADR 提及但未顯化為 schema requirement |

### 1.2 SoD (Separation of Duties) 強化判定

**結論**：spec 雖未明文標「SoD」字眼，但**強隱含 SoD 結構**：

1. **AI 永禁核准退款**（G019, P0-20）→ AI 可作 initiator 草擬但不可 approve（已對齊 ADR-0028 charter）
2. **主管 vs 會計分簽**（L3/L4/L5）→ 兩個獨立角色強制 co-sign，即 SoD 的核准側
3. **客服 → 主管 → 會計 → Sponsor**（L1→L5）→ 升級鏈即 SoD 階梯
4. **發起 / 核准 / 執行**（Payment Provider 執行 = M11 系統側） → 三方分離

但 ADR-0040 矩陣**只有「核准」一欄**，未顯化：
- 誰可 **initiate** refund request（客服 / CSM / AI draft → 人審）
- 誰可 **execute**（系統呼叫 Payment Provider，非人工觸發）
- **角色互斥規則**（initiator ≠ approver；同一單退款，主管不可同時是會計）

**BA 建議補**：5-tier 表加 3 column → `initiator | approver(s) | executor`，並標互斥條款。

### 1.3 缺項 / 不一致

| # | 項目 | 風險 |
|:--|:-----|:-----|
| B-01 | Partial refund classification (product/labor/material/travel/inspection) 在 ADR 中缺 | 🔴 HIGH — spec BR-M11-02 直接要求 |
| B-02 | SoD 三維（initiator / approver / executor）未顯化 | 🟡 MED — 隱含 OK，但 acceptance test 套不上 |
| B-03 | L5 Sponsor 角色未在 RBAC（ADR-0042）+ M17 矩陣定義 | 🟡 MED — 實作時誰是 Sponsor 不明 |
| B-04 | reason code 6 種 vs spec 未列舉 — 可能 spec 後續會擴 | 🟢 LOW — ADR 已開 `other` escape hatch |
| B-05 | FR-0014 殼簡化為「≤100k 單簽 / >100k 雙簽」與 ADR-0040 5-tier 不一致 | 🔴 HIGH — FR/ADR mismatch，QA 寫 test 會混亂 |

---

## §2 PM Persona Critique

### 2.1 KPI / SLA 影響

| KPI | ADR-0040 5-tier 影響 | 風險 |
|:----|:--------------------|:-----|
| 退款處理 SLA（從 request → executed） | L1 (≤1k) 單簽，預期 < 4hr；L5 (>100k) 三方簽，可能 > 48hr | L4/L5 lag time 影響客訴 → 二次升級 |
| 退款率（refund_count / order_count） | 5-tier 對 P50 case (1k-30k) 友好，不卡關 | ✅ 合理 |
| 退款異常率（>100k 大額占比） | L5 強制三方審查 → 降低異常 refund | ✅ 風控正向 |
| 客訴升級率（refund 卡關引發二次 ticket） | L1/L2 快速通道有效；L3+ 多人簽可能 bottleneck | ⚠️ 需 SLA matrix 對應每層 |

### 2.2 商業考量：核准 lag vs 風控

**核心 trade-off**：核准 lag time ↑ vs 風控強度 ↑

- **小額（L1 ≤ 1k）**：客服主管單簽是對的，SLA < 4hr。若提升為主管簽 → 小額退款卡關 → SLA -50% → 客訴 ↑（ADR-0040 Option B 已 reject）
- **大額（L5 > 100k）**：三方簽是對的，但 **Sponsor 角色未在 ADR-0042 RBAC 4 層中定義**。若 Sponsor = CEO/COO，可能不在系統內，需 offline 簽核 → audit 缺證據
- **中段（L3/L4 5k-100k）**：營運主管 + 會計 co-sign，覆蓋 P80 退款案件。建議補 **co-sign SLA**（如雙方須 24hr 內 ack，逾時自動升級）

### 2.3 PM 結論

- 5-tier 商業邏輯**合理**，不建議改門檻數字（與業主 P2-11 default 一致）
- 必補：**Sponsor 角色定義**（RBAC 對應）、**co-sign SLA**、**每層 SLA 目標**
- 與 ADR-0039（取消費）同 ledger 系列，需 cross-ref 共用 SoD pattern

---

## §3 Orchestrator Merge

### 3.1 共識點

| # | 共識 | 來源 persona |
|:--|:-----|:-------------|
| C-1 | 5-tier 主體與 final spec P2-11 default 一致，**不 SUPERSEDE** | BA, PM |
| C-2 | 必補 partial refund 分類（product/labor/material/travel/inspection） | BA |
| C-3 | 必補 SoD 三維（initiator / approver / executor） | BA |
| C-4 | 必補 Sponsor 角色定義 + 對接 ADR-0042 RBAC | PM, BA |
| C-5 | 必補每層 SLA matrix + co-sign 逾時升級規則 | PM |
| C-6 | FR-0014 殼需同步修正（從 2-tier 改回 5-tier 引用 ADR-0040） | BA |

### 3.2 衝突點

| # | 衝突 | 處理 |
|:--|:-----|:-----|
| CONF-1 | L5 Sponsor 角色定義：PM 主張「Sponsor 可能 = 外部 CEO，offline 簽核」；BA 主張「Sponsor 必須在 RBAC 內，否則 audit 不全」 | **取 BA 路線**（Sponsor 入 RBAC + ADR-0042 加第 5 角色 or 用既有 ops_director），spec line 482 也要求 audit trail 完整。建議 ADR-0040 v2 + ADR-0042 同步 update |

`conflicts_count = 1` → 不觸發 Lane B 升級（門檻 ≥ 2）。

### 3.3 必補 cascade work

| # | 維度 | 來源 | 動作 |
|:--|:-----|:-----|:-----|
| F1 | ADR-0040 升 v2，矩陣加 column：`initiator | approver(s) | executor | partial_refund_class | sla_target | escalation_rule` | BA + PM | ADR-0040 in-place update |
| F2 | Partial refund 分類欄位 schema 寫進 BR-M11-02 / FR-0014 / M11 ERD | BA | FR-0014 + BR + ERD cascade |
| F3 | Sponsor 角色加進 ADR-0042 RBAC 4-tier（or 升 5-tier） | PM + Architect | ADR-0042 cascade（可能升 v2） |
| F4 | FR-0014 殼 §1.1 / AC-01/02 從 2-tier 改寫成 5-tier，並引 ADR-0040 v2 | BA | FR-0014 cascade |
| F5 | 每層 SLA matrix + co-sign 逾時規則寫進 BR-M11-02b（新增） | PM | BR cascade |
| F6 | ADR-0040 v2 frontmatter: `status: partial-updated`, `reviewed_against: 2026-05-20 final spec`, `last_reviewed: 2026-05-28` | Architect | metadata cascade |

---

## §4 Verdict Detail

### 4.1 Verdict: PARTIAL_UPDATE（NOT SUPERSEDE）

**為什麼不是 SUPERSEDE**：
1. final spec P2-11 default 5-tier 與 ADR-0040 5-tier **完全一致**（金額門檻、核准角色一對一）
2. spec 無「新規格覆寫」內容 — BR-M11-02 是補充規則（partial refund 分類 + double sign 強化），非取代
3. AI 永禁核准（G019）與 ADR-0040「AI 永禁核准退款」charter 一致
4. Refund Ledger / audit trail / reason code 三項與 ADR-0040 一致

**為什麼不是純 STILL_VALID**：
1. ADR-0040 缺 partial refund 分類（spec BR-M11-02 強制）
2. ADR-0040 缺 SoD 三維顯化（spec 隱含但 ADR 應顯化以利 acceptance test）
3. L5 Sponsor 未定義（spec line 482 audit trail 要求完整 RBAC）
4. FR-0014 殼簡化錯誤需同步修正
5. SLA / co-sign 逾時規則 ADR 與 spec 都未明訂，但 ADR-0040 既然是 single source 應補

### 4.2 Verdict Confidence: HIGH

- 2/2 persona 共識（BA + PM）
- 證據鏈完整（spec P2-11 / BR-M11-02 / G019 / Refund Ledger / Q094 / line 482 都引用）
- conflicts_count = 1（L5 Sponsor 角色），可在 ADR 內解，不需 Lane B

### 4.3 業主預期 vs critique 結果差異說明

業主在 Roundtable A 預期「ADR-0040 極高機率 SUPERSEDE」，本次 critique 結果為 PARTIAL_UPDATE。差異原因：
- 業主可能基於「P0 規則 = 已決議」反推「ADR 必被 supersede」
- 實際上 ADR-0040 與 final spec P2-11 同源（業主同週對齊），5-tier 主體 final spec 直接吸納
- spec 補強的（partial refund 分類、SoD、Sponsor、SLA）皆為「ADR 缺項」而非「ADR 錯誤」→ 升 v2 即可，不需新 ADR
- 若業主仍堅持 SUPERSEDE，可改判為 SUPERSEDE 並寫 ADR-0040b/-0040v2 取代；但治理成本較高，**建議 PARTIAL_UPDATE**

---

## §5 ADR-0040 v2 大綱（若採 PARTIAL_UPDATE）

```markdown
# ADR-0040 v2 — 退款核准分層（partial-updated 2026-05-28）

## Status
partial-updated（reviewed against 2026-05-20 final spec; Lane A critique 2026-05-28）

## Decision

### 5.1 5-tier 金額分層核准矩陣（強化版）

| Tier | 金額區間 (NTD) | Initiator | Approver(s) | Executor | SLA target | Co-sign 逾時升級 |
|:-----|:--------------|:----------|:------------|:---------|:-----------|:----------------|
| L1 | ≤ 1,000 | CSM | 客服主管 | M11 system → Payment Provider | < 4 hr | n/a |
| L2 | 1,001-5,000 | CSM | 營運主管 | 同上 | < 8 hr | n/a |
| L3 | 5,001-30,000 | CSM | 營運主管 + 會計（互斥） | 同上 | < 24 hr | 12 hr 未 ack 升 L4 |
| L4 | 30,001-100,000 | CSM 或 主管 | 主管 + 會計（互斥） | 同上 | < 48 hr | 24 hr 未 ack 升 L5 |
| L5 | > 100,000 | CSM 或 主管 | 主管 + 會計 + Sponsor (ops_director) | 同上 | < 72 hr | 36 hr 未 ack 升 CEO + 觸發 incident |

**SoD 規則**：
- AI 可作 initiator draft（人審），永禁 approver / executor
- 同筆退款：approver 不可同時是 initiator
- L3+ 雙簽：兩位 approver 必須是獨立 RBAC 角色（如「主管 ≠ 會計」）

### 5.2 Partial Refund 分類（BR-M11-02 對齊）

退款必填 `refund_breakdown`：
| 類別 | 說明 |
|:-----|:-----|
| product | 產品本身 |
| labor | 工資 / 安裝費 |
| material | 耗材 |
| travel | 車馬費 |
| inspection | 檢測費 |

總額 = Σ各類，每類獨立記 ledger，audit 可拆。

### 5.3 Reason Code（保留 ADR v1 6 種，未變）

`customer_dispute / quality_issue / wrong_dispatch / warranty_coverage / goodwill / other`

### 5.4 Configurable 邊界

- **金額門檻**（1k / 5k / 30k / 100k）= configurable via M18 ChangeRequest（ADR-0067 治理）
- **Approver 角色**（主管 / 會計 / Sponsor）= configurable via M17 RBAC
- **SLA / 逾時升級規則** = configurable via M16 Comms / M15 Exception template
- **Reason code 清單** = configurable lookup table（ADR-0065）

### 5.5 Acceptance Criteria（G/W/T 範本，QA 套用）

每層各補 ≥ 1 條，例：
```gherkin
# L3 雙簽 happy path
Given refund amount = 10000 AND initiator = csm_alice
When approver_1 (營運主管 bob) approve AND approver_2 (會計 carol) approve
Then status = APPROVED AND RefundApproved emit AND audit trail 含三角色 timestamp

# L5 互斥違反
Given refund amount = 200000 AND initiator = manager_dave
When approver_1 = manager_dave (same user)
Then reject + 422 sod_violation
```

## Cross-References
- ADR-0042 v2（RBAC 升 5-tier 含 Sponsor）
- ADR-0067（M18 config governance）
- BR-M11-02 / BR-M11-02b
- FR-0014 v2
- ADR-0039（取消費，同 ledger 系列）
- ADR-0028（AI 永禁核准 charter）
```

---

## §6 Follow-up Actions

| # | Action | Owner | Priority | Depends |
|:--|:-------|:------|:---------|:--------|
| F1 | ADR-0040 in-place 升 v2（套上 §5 大綱） | `devteam-arch` | P0 | 業主拍板 PARTIAL_UPDATE |
| F2 | ADR-0042 RBAC 評估是否升 5-tier（加 Sponsor）or 用既有 ops_director | `devteam-arch` | P0 | F1 平行 |
| F3 | BR-M11-02b 新增（SLA matrix + 逾時升級） | `devteam-analyst` | P1 | F1 |
| F4 | FR-0014 殼 §1.1 / §1.2 / AC 從 2-tier 改 5-tier | `devteam-analyst` | P1 | F1 |
| F5 | M11 ERD 加 `refund_breakdown` 表（product/labor/material/travel/inspection） | `devteam-design` + `devteam-dba` | P1 | F3 |
| F6 | QA test plan：5 tier × 至少 2 scenario (happy + sod violation) = ≥ 10 test cases | `devteam-qa` | P2 | F1+F3+F4 |
| F7 | ADR-0100 §1 更新 ADR-0040 行：`REVIEW_REQUIRED → PARTIAL_UPDATE` + 引本 critique 連結 | `devteam-arch` | P0 | F1 |

---

## §7 Confidence

- **Verdict confidence**: HIGH（2/2 persona 共識 + 證據鏈完整）
- **PARTIAL_UPDATE rationale**: HIGH（spec 5-tier 直引 ADR + 補強三項缺失皆為「補」非「改」）
- **無需 Round 2 / Lane B 升級**: 證據充分，conflicts_count=1（L5 Sponsor）可在 ADR 內解
- **業主預期差異**: 已在 §4.3 說明；若業主堅持 SUPERSEDE 可改判

---

## 🔗 Drill-down

- ADR 原檔：`docs/architecture/adr/ADR-0040-refund-approval-tiers.md`
- Final spec 對照：`docs/_source/01-workorder-erp.md` line 145, 257, 365, 442, 466, 482, 603, 624, 650, 749-750, 770, 838, 858, 884, 1151, 1159
- 相關 ADR：
  - ADR-0028 AI 不可核准退款（charter）— STILL_VALID
  - ADR-0039 取消費分段（同 ledger 系列）— REVIEW_REQUIRED 待 Lane A
  - ADR-0042 RBAC 4-tier — STILL_VALID（本 critique 可能觸發升 v2）
  - ADR-0065 change-request lookup table（reason code 落地）— STILL_VALID
  - ADR-0067 M18 config governance（門檻 configurable 依據）— Accepted
- FR 殼：`docs/analysis/fr/FR-0014-refund.md`（需 cascade fix per F4）
- ADR-100 索引：`docs/architecture/adr/ADR-0100-legacy-adr-supersede-index.md` §1 row 4/6

---

## ✍️ Sign-off

- [x] **BA persona**: critique done / Date: 2026-05-28
- [x] **PM persona**: critique done / Date: 2026-05-28
- [x] **Orchestrator**: merge + verdict = PARTIAL_UPDATE / Date: 2026-05-28
- [ ] **業主**: 拍板 PARTIAL_UPDATE 或改判 SUPERSEDE / Date: ____________
- [ ] **Architect (devteam-arch)**: 接 F1 寫 ADR-0040 v2 / Date: ____________

---

**End of Lane A Critique — ADR-0040**
