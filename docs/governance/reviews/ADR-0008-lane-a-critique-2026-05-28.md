# Lane A Critique: ADR-0008 product-info-architecture-canonical

> Date: 2026-05-28 | Intensity: standard | Personas: arch + sa
> Reviewer: `devteam-arch-persona` + `devteam-sa-persona` (merged by `devteam-orchestrator`)
> Reviewed against: final spec 2026-05-20 (`docs/_source/01-workorder-erp.md` §M03 / §M10 / §M14)
> Trigger: ADR-0100 §1 row 8 — initial classification `REVIEW_REQUIRED`
> Protocol: KB-05 §Persona Agent 標準 Prompt + Q4=C (Roundtable A 2026-05-27)

---

## Scope correction（先校正提問範圍）

業主 prompt 提到「M03 (Brand/Project/Site Master)」，但 final spec 2026-05-20 §M03 = **AI ProblemCard / AI Service Triage**，不是 master data。實際的 brand / project / site hierarchy 分布在：

- **§M10 Product BOM** — Brand / Model / BOM / Inventory / Serial Control（BR-M10-01 two-layer BOM、BR-M10-02 material ownership、BR-M10-03 serial control）
- **§M14 Partner Portal** — Brand / Dealer / Builder / Project / Site / Unit hierarchy（BR-M14-01 partner scope、BR-M14-02 builder project setup）
- **§M02 客戶地址設備** — Device-to-Customer 綁定（serial → 保固 → customer site）

下方 critique 以 M10 + M14 + M02 為對照基準（M03 在此案無相關 catalog 變動）。

---

## Arch Critique

ADR-0008 鎖的是 **agent runtime knowledge base 的 mega-doc 格式**（`agent/product_info/{Brand}/{Model}.md` + `load_product_info` tool + `[可用產品資料]` prompt block），bounded context 屬於 **A03 Skill-Gated ReAct Agent / A04 RAG Pipeline**。Final spec M10 鎖的是 **ERP 端 Product Master / BOM / Inventory bounded context**，兩者不是同一個 BC，因此「直接覆寫」不成立 — ADR-0008 的 core decision（mega-doc canonical for agent KB）在 A03/A04 scope 內仍 hold。

但 NFR 與 failure mode 層面有三個破口需要點明：

1. **Data lineage 未定義**：M10 引入 brand master / two-layer BOM / material ownership / serial 為 ERP 端 source of truth；ADR-0008 把 `agent/product_info/*.md` 視為「knowledge canonical」，但**沒寫**這份 mega-doc 跟 M10 master 的同步契約（手動 curate？ETL 從 M10 dump？trigger 條件？stale window NFR？）。一旦 M10 主檔更新，agent 端是否 stale → blast radius 涵蓋整個 AI 客服回答正確性。
2. **Boundary 漂移**：ADR-0008 ⓪a 自承本 ADR 在 `main`/`dev` 為 SUPERSEDED、僅在已 archive 的 `refactor/agent-port` REINSTATED；ADR-0100 §1 把它劃為 `M10 scope` 也與其原 scope（agent runtime）錯位。Boundary 不一致是 ADR governance 的 anti-pattern，必須整治。
3. **Multi-tenant blast radius 未處理**：M14 引入 brand-scoped / project-scoped 資料邊界（BR-M14-01 partner 只能看自己 case；G007 brand 資料邊界），但 ADR-0008 的 mega-doc 是 **flat brand/model**，沒有 project / partner scope 維度。若 agent 在 partner portal 場景被叫用，prompt 注入的 `[可用產品資料]` 清單會跨越 tenant 邊界 → potential PII / business confidentiality leak。

建議：ADR-0008 boundary 重新標 `bounded_context: A03/A04 agent runtime KB`（不是 M10），同時開新 ADR 補 data lineage + multi-tenant scope。

---

## SA Critique

從 use case 完整性看，ADR-0008 原 §1 決議涵蓋的場景是「**LLM 接到客戶 query → 依 brand/model 載入 mega-doc → 回答**」，對應的 actor = customer + chatbot；precondition = brand/model 已識別；postcondition = 客戶得到型號相關回答。Final spec 後，這個 happy path use case **仍可驗收**（quality_check 67 案例可繼續跑）。

但 final spec 衍生出 4 條新 use case ADR 沒涵蓋，逐條 acceptance 都有缺口：

1. **UC-new-1 多品牌混搭安裝場景**（Q082 Q083 material owner 可是 brand / company / locksmith / customer）：客戶問「我的 Chatlock 主鎖配大內高手把手相容嗎？」— actor = customer + chatbot；目前 mega-doc 是單品牌單型號文件，**沒有 cross-brand compatibility 章節**，acceptance 無法驗收。
2. **UC-new-2 序號驗保固查詢**（BR-M10-03 + Q085 主鎖/保固件須 serial 綁 WorkOrder）：客戶問「我這顆序號 SN-XXX 還在保固嗎？」— actor = customer + chatbot + ERP；precondition = serial 已建檔；postcondition = 回傳保固狀態。mega-doc 是 static knowledge，**serial → warranty 是 ERP 動態查詢**，ADR-0008 工具集（`load_product_info` / `update_user_info` / `transfer_to_human`）**沒有 serial lookup tool**，這條 use case 直接不可驗收。
3. **UC-new-3 建商專案戶別查詢**（BR-M14-02 builder project + site group + unit list + handover date）：客戶問「我住三民社區 1502，我家門鎖是哪一型？」— actor = builder customer + chatbot；precondition = 客戶綁 project + unit；postcondition = 回傳該 unit 配的 model + 點交日 + 保固起算。mega-doc flat 結構**沒有 project → unit → model 反查路徑**，acceptance 缺 alternative flow（unknown unit、未點交、跨建商）。
4. **UC-new-4 客製 SKU / 改鑄品**（G035 替代料與相容性、Q081 兩層 BOM only）：建商案常見的 OEM rebadged 鎖，型號不在 standard catalog 內。ADR-0008 mega-doc 是 enumerable model list，**edge case：型號不存在於 product_info/ 時的 fallback** 沒定義 — 應該 transfer_to_human？回 "查無此型號"？目前 acceptance 沒寫。

加上原 ADR §4.3 CI guard「待補」、§4.4 quality_check 67 案例 baseline 在 final spec 後**沒重測**，可驗收性實質下降。

---

## Orchestrator Merge

### Consensus（兩 persona 一致）

| # | 共識點 | arch 視角 | SA 視角 |
|:--|:-------|:----------|:--------|
| C1 | ADR-0008 **核心決議**（mega-doc canonical for agent KB）**未被 final spec 直接覆寫** | A03/A04 BC 與 M10 ERP BC 不同 | UC-happy-path 仍可驗收 |
| C2 | **Multi-tenant / project scope 是新缺口** | M14 brand/project boundary → mega-doc flat 結構潛在 leak | UC-new-3 建商專案戶別查詢無 acceptance |
| C3 | **Serial / dynamic lookup 不在原工具集** | ADR §1 工具集只有 3 個 static / write tool | UC-new-2 serial→warranty 不可驗收 |
| C4 | **ADR boundary 應重標** | 原 ADR 鎖 agent runtime，不是 M10 ERP；ADR-0100 §1 標 M10 有誤 | use case actor 含 ERP integration，spec 應明文 |
| C5 | **ADR-0008 自身 status 矛盾需整治** | main/dev = SUPERSEDED，refactor/agent-port = REINSTATED；governance anti-pattern | （非 SA 主視角，但同意阻擋驗收） |

### Conflict points

無實質衝突。Arch 強調 NFR / boundary / blast radius，SA 強調 use case / acceptance；兩者在 C1-C5 互補無對撞。`conflicts_count = 0` → 不觸發 Lane B 升級。

### Final 判定

依 KB-04 §ADR Supersede Chain 規則 + Roundtable A Q4=C：

- ADR-0008 **原 §1 主體決議**（mega-doc 為 agent KB 唯一正典格式）**未被覆寫** → 不是 SUPERSEDE
- ADR-0008 **沒涵蓋的 4 條新 use case + 3 條 NFR 缺口** → 不是純 STILL_VALID
- 結論 = **PARTIAL**

---

## Verdict

- **Status**: **PARTIAL**
- **Valid 段（標 `Reviewed_Still_Valid_Under_A03/A04`）**：
  - §1 mega-doc canonical 格式（`agent/product_info/{Brand}/{Model}.md`）
  - §1 工具集對既有 happy path use case 的工具切分（`load_product_info` / `update_user_info` / `transfer_to_human`）
  - §1 系統 prompt 約束（`[可用產品資料]` / `load_product_info` 文字）
  - §2 mega-doc vs SKILL.md trade-off 論證
  - §3 反 revert 立場（拒絕重新引入 skills/）
  - §4.1 模組路徑禁區
  - §4.4 quality_check baseline（但 67 案例需依 final spec 重測）
- **Supersede 段（需另開新 ADR）**：
  - **§1 工具集封閉性** —「3 個 tool 已足夠」的隱含命題在 UC-new-2 / UC-new-3 不成立；需加 dynamic lookup tool（serial / project / warranty）
  - **§1 mega-doc 結構維度** —「Brand/Model 雙層」在 UC-new-3 不夠（缺 Project/Site/Unit 維度）、UC-new-1 不夠（缺 cross-brand compatibility 章節）
  - **§5 例外清單** — 未涵蓋 multi-tenant data scope governance（M14 / BR-M14-01 / G007）

### New ADR 內容大綱（不寫完整，只列章節骨架）

**ADR-0101 — Agent Knowledge Base × Final Spec Integration Contract**

1. Context
   - ADR-0008 鎖 agent KB mega-doc canonical；final spec M10/M14/M02 引入 ERP 端 brand/project/serial 主檔
   - 跨 BC 同步契約與 multi-tenant scope 在 ADR-0008 留白
2. Decision
   - **2.1 Data Lineage**：M10 master → agent mega-doc 同步策略（pull-based ETL / event-driven / 手動 curate 三選一），含 stale SLA
   - **2.2 Tool Extension**：補 dynamic lookup tool（serial→warranty、project→unit→model、cross-brand compatibility），不破 ADR-0008 §4.1 路徑禁區
   - **2.3 Multi-tenant Scope**：agent 在 partner portal 場景的 `[可用產品資料]` 注入規則 — 依 caller tenant 過濾（對齊 ADR-0030 tenant-id-propagation）
   - **2.4 Custom SKU Fallback**：mega-doc 無此型號時的處理（transfer_to_human + log + 補 KB ticket）
3. Consequences
   - ADR-0008 標 `partially superseded by ADR-0101 §2.1-§2.4`，其餘段落 `Reviewed_Still_Valid_Under_A03/A04`
   - quality_check 67 案例需擴充至涵蓋 UC-new-1~4
4. Boundary 重新標
   - ADR-0008 `bounded_context: agent runtime KB (A03/A04)`
   - ADR-0008 不是 M10 owner，ADR-0100 §1 row 8 module_scope 從 `M10` 改為 `A03/A04 (interface with M10/M14/M02)`
5. Status 整治
   - ADR-0008 frontmatter `status` 從目前混亂的「SUPERSEDED on main / REINSTATED on archived branch」整治成單一狀態：`status: partially_superseded`、`superseded_by: ADR-0101 (§2.1-§2.4)`、`reviewed_against: 2026-05-20 final spec`、`scope_clarification: agent runtime KB only, not ERP master data`

---

## Recommended Next

1. **ADR-0008 自身**：
   - 在 `🔄 Migration Status` block 把 `REVIEW_REQUIRED (Lane A critique pending — A2.4)` 改為 `PARTIAL — partially superseded by ADR-0101 (§2.1-§2.4 pending draft); core §1 mega-doc canonical reviewed_still_valid under A03/A04`
   - 補 `scope_clarification` 段，明文：本 ADR 鎖 agent runtime KB，不是 ERP M10 master data；M10 master 是 source of truth，product_info mega-doc 是 derived view
   - 不動 §1-§5 原文（保留歷史 audit trail），只在 frontmatter / Migration Status block 加註

2. **ADR-0100 §1 row 8 修正**：
   - `Initial Classification` 從 `REVIEW_REQUIRED` 改 `PARTIAL_SUPERSEDE` 並補註「(2026-05-28 Lane A done)」
   - `Module Scope` 從 `M10` 改 `A03/A04 (interface with M10/M14/M02)`
   - `Notes` 補：「Lane A critique 2026-05-28：core mega-doc canonical still valid；data lineage + multi-tenant scope + dynamic lookup tool 三大缺口走 ADR-0101」
   - §2 統計表 SUPERSEDE 由 0 改為 0 + 1 PARTIAL（或新增 PARTIAL_SUPERSEDE 欄位，建議業主先答 OQ-100-1）
   - §2 REVIEW_REQUIRED 進度表 row 1 標 `✅ 2026-05-28 done` → `PARTIAL_SUPERSEDE`，rel link 指向本 critique report

3. **後續 driver dispatch**（不在本 critique 範圍，但列給 router）：
   - `devteam-arch` 起草 ADR-0101 draft（含 4 個 decision 段大綱已列）
   - `devteam-analyst` 把 UC-new-1~4 寫成 FR 殼（A03/A04 系列 FR 中）
   - `devteam-qa` 把 UC-new-1~4 加入 quality_check 67 案例擴充清單

---

**End of critique**
