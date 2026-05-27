# Lane A Critique Merge Report: ADR-0044 Warranty Start Date Modes

**日期**：2026-05-28
**Target**：[`docs/architecture/adr/ADR-0044-warranty-start-date-modes.md`](../../architecture/adr/ADR-0044-warranty-start-date-modes.md)
**Critique Personas**：BA (Business Analyst) / SA (Systems Analyst)
**Intensity**：standard
**Reviewed against**：2026-05-20 final spec (`docs/_source/01-workorder-erp.md`) + FR-0015 D5 殼
**Convergence**：✅ **2/2 PARTIAL_UPDATE**（無 SUPERSEDE / 無 STILL_VALID）
**Per**：[`13_doc_migration_playbook §2`](../../../devteam_knowledge_base/13_doc_migration_playbook.md) REVIEW_REQUIRED 判定樹
**ADR-0100 上游分類**：REVIEW_REQUIRED（Group D, ADR-0044 列 M02 + M13）

---

## 📋 Verdict: PARTIAL_UPDATE

ADR-0044 的核心 Decision（**Device.warranty_start_date + warranty_start_mode 多模式 enum**）**保留**，但 mode 列表與 spec 對齊不全、跨 line-of-business 規則覆蓋有 gap、edge case（多次維修保固重算 / 部分零件 / B2B 客製）完全未談。**不需寫新 ADR 取代**，原地 update v2 + cascade 到 FR-0015 / Device schema / BR-WARRANTY-001 即可。

> 同時：ADR-0044 與 FR-0015 frontmatter 寫 `superseded_clauses: BR-WARRANTY-001 (handover_date 起算)` 與 ADR Decision 「purchase_date 為 B2C 預設」邏輯互斥 — FR 殼把 handover_date 當預設、ADR 把 purchase_date 當預設。**這條交叉不一致必須在 v2 解掉**。

---

## 🔍 兩 persona 結論

| Persona | 判定 | 核心理由 |
|:--------|:-----|:---------|
| BA | PARTIAL_UPDATE | ① ADR mode enum 與 spec G002/Q107/BR-M02-02/BR-M14-02 用語不對齊（spec 用 `install_date`/`handover_date`，ADR 用 `purchase_date`/`activation_date`）；② Site Group / Project 級保固條件（BR-M02-03、BR-M14-02、G003 「共用保固條件」）完全沒寫進 ADR；③ B2B contract.warranty_start_mode 與 ADR mode 對應規則只在 Decision 提一句，無 schema |
| SA | PARTIAL_UPDATE | ① 5 種 mode 完全無 Use Case 對映 / Acceptance Criteria 用 G/W/T；② edge case 三大盲區（**多次 RMA 後保固重算**、**部分零件保固獨立計算**、**B2B 客製保固期** = warranty_period_months 非標準）全部缺；③ 證據鏈（拍照 / 簽收 / SOP）對應到哪個 mode 切換時必須蒐證沒寫；④ AI 不可猜 → 轉真人的 trigger 條件無 testable 規格 |

---

## 🎯 必補 7 個維度（cascade work）

| # | 維度 | 來源 persona | 改 ADR / cascade 動作 |
|:--|:-----|:-------------|:----------------------|
| 1 | **mode enum 對齊 spec 詞彙** — 把 ADR 的 `purchase_date / handover_date / activation_date / contract_date / manual_override` 對應到 spec 真正用的詞彙：`install_date`（零售 G002）、`handover_date`（建商 G002 / Q107 / BR-M14-02）、`purchase_date`（B2C 預設 Q107）、`brand_warranty_date`（品牌保固 G002）、`contract_date`（B2B / BR-M14-02）、`manual_override`（exception，需主管核可） | BA | 改 ADR Decision §1 enum 表 + 加 mapping table 對到 spec G-row 與 BR-row |
| 2 | **Project / Site Group 級保固條件** — BR-M02-03 / G003 / BR-M14-02 明示「同社區共用保固條件」「Builder projects 必須有 site group, unit list, handover/warranty date」。ADR 0044 只在 Device 層處理 mode，沒講「同一 site group 內 N 個 Device 是否一律繼承 site_group.warranty_start_date」 | BA | ADR 加 §Site Group Inheritance 段：device.warranty_start_date 可選 inherit_from_site_group: bool；inherit=true 時 device 層 override 需 P0 主管核可 |
| 3 | **B2B 客製保固期（warranty_period_months）非 24/36/60 標準**　— BR-M14-02 寫「Builder projects 必須有 contract price, SLA, invoice rules」隱含可客製。ADR 寫死 24/36/60 + 視品牌，沒給 contract-level override | BA | ADR 加 contract.warranty_period_months override 規則：B2B contract template 可覆寫 Device.warranty_period_months；變更需 ChangeRequest（對齊 ADR-0046） |
| 4 | **跨產品線一致性** — 智慧鎖（主鎖）/ 配件（電池、感應卡）/ 服務（安裝工資）的保固規則差異未顯化。spec BR-M10-03「主鎖、保固件、高價電子件需 serial 綁定」隱含分層 | BA + SA | ADR 加 §Product Class Matrix 表：product_class (lock/accessory/service/consumable) × applicable_mode list × default_period_months × need_serial。AI 對 service/consumable warranty claim 預設轉真人 |
| 5 | **Edge Case 1: 多次 RMA 後保固重算** — 完全缺。Q104 + BR-M13-02 場景：原裝置 RMA 換新鎖，保固期是延續舊機（從原 warranty_start_date 起算）還是從換貨日重新起算？ADR 沒規則 | SA | ADR 加 §RMA Reset Policy 段：預設「換新主鎖 → warranty 從 RMA 完工日起算 90 天延長保固」「維修不換主件 → warranty 不重算」「換零件 → 零件獨立計算，主鎖原期續用」。需主管核可 + 留證據鏈（換新照片 + RMA case ID） |
| 6 | **Edge Case 2: 部分零件保固獨立** — spec BR-M10-03「保固件需 serial」+ BR-M10-02「Material owner 決定 warranty responsibility」隱含每個 serial 件可獨立保固。ADR 是 Device 級單一 warranty_start_date，無 part-level | SA + BA | 升維：把 ADR scope 從「Device.warranty_*」擴到「Device.warranty_* + DeviceComponent.warranty_*」。或補一個附屬 ADR（ADR-0044a）處理零件級保固，但若做這層升維 → cascade 到 ERD/Migration |
| 7 | **Edge Case 3 + Acceptance Criteria** — ADR Acceptance Criteria 只列「業主圈選 / 主管核可 / migration / BI 監控」，**沒有 G/W/T 可給 QA 套**。FR-0015 §2 AC-01/02/03/04/05 有 G/W/T 但範圍只在 claim_date vs warranty_end_date 邊界，沒有測 mode 切換、site group inheritance、RMA reset、part-level | SA | ADR 加 §Testable Acceptance：至少 6 條 G/W/T 覆蓋（① 零售=install_date ② 建商=handover_date ③ B2B contract override period ④ site group inheritance ⑤ RMA 換主鎖重算 90 天 ⑥ 缺資料 → AI 強制轉真人）— FR-0015 cascade 補對應 AC |

---

## ⚠️ 跨 persona 衝突點

| 議題 | 衝突 | 處理建議 |
|:-----|:-----|:--------|
| **預設 mode** | FR-0015 frontmatter 寫 `superseded_clauses: BR-WARRANTY-001 (handover_date 起算)`；ADR-0044 Decision 寫「B2C 預設 purchase_date / 建商預設 handover_date」 | 不真衝突 — BR-WARRANTY-001 是被「mode 多模式」整體取代，不是被某單一 mode 取代。但 v2 必須把 FR-0015 frontmatter `superseded_clauses` 的註解改成「BR-WARRANTY-001 被 ADR-0044 mode enum 取代，handover_date 變成其中一個 mode」 |
| **mode 列表權威來源** | BA 主張對齊 spec 用語（install_date / brand_warranty_date）；ADR 原用 activation_date / purchase_date | 採 spec 用語為準（單一 source of truth）。Eternal/Transient 標記要強化：「mode 列表本身為 Transient（可走 ChangeRequest 新增）」這條保留 |
| **part-level warranty 升維**（維度 6） | SA 主張升維到 DeviceComponent；BA 認為現階段 Device 級 + part 例外 manual_override 足夠 | 不在 ADR-0044 v2 解 — 抽出成 follow-up ADR-0044a，v2 只加 hook 欄位 `warranty_scope: enum [device, component]` 預設 device |

`conflicts_count` = 1 真衝突（part-level 升維時機）+ 2 表面衝突。**未達 Lane B 升級門檻（≥2）**，但維度 6 follow-up 必須在 ADR-0050 evidence cascade 之前先決，否則 ERD/Migration 會 rework。

---

## 🎯 Follow-up Actions

| # | Action | Owner | Priority |
|:--|:-------|:------|:---------|
| F1 | 改寫 ADR-0044 為 v2：套上 7 個維度補強（mode 對齊 spec / site group inheritance / B2B period override / product class matrix / RMA reset / part hook / G-W-T AC），frontmatter 加 `status: partial-updated` + `reviewed_against: 2026-05-20 final spec` + `lane_a_review: 2026-05-28` | `devteam-arch` | P0 |
| F2 | FR-0015 cascade：§3 Reference Map 加 BR-M02-02 / BR-M02-03 / BR-M10-03 / BR-M14-02；§2 Acceptance Criteria 補 AC-06（site group inherit）/ AC-07（建商 vs 零售 mode 預設切換）/ AC-08（RMA 換新主鎖重算 90 天）；`superseded_clauses` 註解修正為「被 ADR-0044 mode enum 整體取代」 | `devteam-analyst` | P0 |
| F3 | 寫 ADR-0044a（follow-up）：DeviceComponent.warranty_* part-level 保固模型；待 RMA test scenario 完整後決定升維時機 | `devteam-arch` | P1 |
| F4 | M02 / M13 / M14 spec sheet 補完：把 ADR 補的「site group inheritance default / contract override / RMA reset 90 天」回寫 spec BR-row（保 spec ↔ ADR 雙向同源） | `devteam-analyst` | P1 |
| F5 | ERD / Migration cascade：Device 加 `warranty_start_mode`（enum）、`warranty_scope`（device/component hook）、`warranty_period_months_override`（B2B nullable）；Migration 既有 record 預設 `purchase_date` + 後續 RMA 校正（與 ADR Consequence Mitigation 一致） | `devteam-design` | P1 |
| F6 | QA test plan：依 ADR-0044 v2 AC 與 FR-0015 cascade AC 套 ≥ 8 個 test scenario（含 RMA reset、site group inheritance、B2B override 三條新邊界） | `devteam-qa` | P1 |
| F7 | BI 監控：除原 ADR 寫的「warranty.start_mode 分布」外，加「mode 切換頻次」「manual_override 比率」「RMA reset trigger 比率」三個指標 | `devteam-ops` | P2 |

---

## 📊 Confidence

- **Verdict confidence**: HIGH（2/2 persona 共識 PARTIAL_UPDATE，論證互補）
- **7 維度 cascade 完整性**: MEDIUM-HIGH（BA 覆蓋 boundary / cross-LOB，SA 覆蓋 edge case / acceptance；缺 DBA / Architect 視角對 ERD/index 的補充，但本次 standard intensity 不要求）
- **Lane B 升級必要性**: ❌ 不需（conflicts_count = 1，未達 ≥2 門檻；維度 6 升維時機已給 follow-up 路徑）
- **業主裁決需要**: ✅ 需 — 三個關鍵決定：① RMA 換新主鎖 reset 90 天的天數 ② B2B contract 可否覆寫 warranty_period_months（合約優先 vs 品牌標準優先）③ part-level 升維時機（v2 加 hook vs ADR-0044a 等待）

---

## 🔗 Drill-down

- ADR 原檔：[`docs/architecture/adr/ADR-0044-warranty-start-date-modes.md`](../../architecture/adr/ADR-0044-warranty-start-date-modes.md)
- FR 殼：[`docs/analysis/fr/FR-0015-warranty-claim.md`](../../analysis/fr/FR-0015-warranty-claim.md)
- Source spec：[`docs/_source/01-workorder-erp.md`](../../_source/01-workorder-erp.md)
  - §M02 Device master：L107, L286-287 (G002 / G003), L338-339 (BR-M02-02 / BR-M02-03)
  - §M10 Serial / Material：L362-363 (BR-M10-02 / BR-M10-03)
  - §M13 RMA：L118, L370-372 (BR-M13-01~03)
  - §M14 Builder Partner：L119, L373-375 (BR-M14-01~03)
  - §P0：L149 (保固 P0), L153 (建商邊界 P0)
  - §Q107：L270（保固期判斷：購買日 + 序號；建商案點交日另議）
- 上游：[`docs/architecture/adr/ADR-0100-legacy-adr-supersede-index.md`](../../architecture/adr/ADR-0100-legacy-adr-supersede-index.md) §1 Group D（ADR-0044 列 REVIEW_REQUIRED）
- 鄰近 ADR：
  - [`ADR-0035-warranty-project-quote-policy.md`](../../architecture/adr/ADR-0035-warranty-project-quote-policy.md)（AI 不可 final warranty quote）
  - [`ADR-0043-brand-project-tenant-scope.md`](../../architecture/adr/ADR-0043-brand-project-tenant-scope.md)（Contract Template；與 ADR-0044 §Decision 已 cross-ref）
  - ADR-0028（AI 不可判保固責任）
  - ADR-0053（Serial 控制；activation_date / serial 註冊邊界）

> 本次 critique 為 **A2.4 task 6 條 REVIEW_REQUIRED 的第 2 條**（ADR-0050 已完成）。
> 餘 4 條（ADR-0008 / 0009 / 0039 / 0040）流程相同，下個 session 推進。
