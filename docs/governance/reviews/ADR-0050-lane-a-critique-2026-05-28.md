---
id: review-adr-0050-lane-a-2026-05-28
target: docs/architecture/adr/ADR-0050-evidence-visibility-matrix.md
target_version: PARTIAL_UPDATE (as of 2026-05-28)
gate: N/A (REVIEW_REQUIRED follow-up per ADR-0100 §1)
intensity: standard
personas: [arch, dba]
lane: A
date: 2026-05-28
verdict: PARTIAL_NEEDS_MORE
upgrade_recommended: false
related:
  - ../../architecture/adr/ADR-0050-evidence-visibility-matrix.md
  - ../../architecture/adr/ADR-0051-evidence-retention-policy.md
  - ../../architecture/adr/ADR-VCH-002-voucher-retention-7y.md
  - ../../architecture/adr/ADR-0100-legacy-adr-supersede-index.md
  - ../../analysis/fr/FR-0006-onsite-photo.md
  - ../../analysis/fr/FR-0019-rbac-dynamic.md
  - ../../analysis/fr/FR-0020-audit-log-export.md
  - ../../_source/01-workorder-erp.md (M07 / M09 / M17 / M19)
  - ../../../.claude/context/devteam/reviews/2026-05-28-adr-0050-critique/merge-report.md
---

# Lane A Critique (收尾) — ADR-0050 Evidence Visibility Matrix

> **Round 2 critique** on the **PARTIAL_UPDATE** that landed 2026-05-28.
> Round 1 已產 3/3 PARTIAL_UPDATE consensus（Architect / SA / DBA）— 列 6 個 cascade 維度。
> 本次 round 2 確認 PARTIAL_UPDATE 是否充分。

---

## Executive Summary

| 維度 | 結論 |
|:-----|:-----|
| **Verdict** | **PARTIAL_NEEDS_MORE**（PARTIAL_UPDATE 形式正確，但實質落地不足；不需升級為 FULL SUPERSEDE） |
| **核心理由** | Round 1 merge report 點出 6 維度，但 ADR-0050 本體 Decision 段（L51-66）與 Acceptance Criteria 段（L101-107）**未實際改寫** — 只把 6 維度列在 frontmatter 上方的 migration banner 當「待 cascade 補強」TODO，body 仍是 1D 矩陣 + 自然語言 retention 硬編碼天數 |
| **是否 SUPERSEDE** | **不需要**。9 角色 / case-lifecycle / attr-scope 概念主體與 final spec M09 BR-M09-02 / M17 BR-M17-01 同源，沒有理論衝突，純粹是「升維後沒寫進 Decision body」 |
| **是否 STILL_VALID** | **不可降為 STILL_VALID**。1D 矩陣若直接 freeze 會被 BR-M17-01 的「can-view / can-edit / can-approve」三維強制要求打回 |
| **下一步** | Round 1 列的 F1（改寫 v2 body）必須在 Gate 4 NFR/ADR Baseline freeze 前完成；本 critique 不重啟議題，僅將 F1 從 P0 升為 **Gate-blocking** |

---

## §1 背景與 Round 1 回顧

- **2026-05-28 Round 1** (`.claude/context/devteam/reviews/2026-05-28-adr-0050-critique/merge-report.md`)：3/3 PARTIAL_UPDATE，列 6 個必補維度（矩陣升維 / IT support actor / G/W/T / scope 階層 / column-level PII / retention 改引用 ADR-0051 + DB 索引策略）。
- **2026-05-28 PARTIAL_UPDATE 動作**：Architect 在 ADR-0050 第 19-33 行加 migration banner，把 6 個維度寫成「待 cascade 補強」清單，未動 Decision 段與 Acceptance Criteria 段。
- **本次 critique 任務**：確認此 PARTIAL_UPDATE 是「形式充分」還是「需升級」。

---

## §2 Persona Critique

### §2.1 Architect persona

**視角邊界**：NFR / boundary / failure modes / cross-module consistency。

#### [B-1] Decision body 與 final spec BR-M17-01 仍然不一致（Round 1 F1 未落地）

- **引用**：
  - ADR-0050 L51-66（Decision 表）：欄位仍是「角色 / 可見 Evidence / 案件生命週期限制 / 屬性過濾」，**單欄表達 view 權限**，沒有 edit / approve 維度。
  - `docs/_source/01-workorder-erp.md` L1301 BR-M17-01：「每個角色必須拆成 can-view、can-edit、can-approve；除 audited admin 外，不接受 all access」。
- **為什麼是阻礙**：Round 1 merge report 第 1 條（矩陣升維至 role × lifecycle_phase × action × attr_mask）標 P0，但 PARTIAL_UPDATE 僅在 banner 寫「待補」，沒實際拆三維。Gate 4 NFR/ADR Baseline freeze 時這份 ADR 會被同一條 BR-M17-01 反覆打回。
- **建議改法**：把 L51-66 表格拆三表（view / edit / approve），或拆四欄（role × lifecycle_phase × action × attr_mask）。可放在 Decision §A、§B、§C 三段，或抽出 §D「Action Matrix（view/edit/approve）」獨立小節。

#### [B-2] M03 brand/project/site 階層引入後，`brand_scope` 過濾語意未升維

- **引用**：
  - ADR-0050 L61 Brand User 欄位：`brand_scope` 過濾。
  - `docs/_source/01-workorder-erp.md` L107 M02：「客戶/地址/設備主檔 ... 客戶去重、地址/社區/建案」與 L119 M14 Partner Portal：「品牌、經銷、建商與合作夥伴」+「專案價、建商點交日」。
  - Round 1 第 4 條已點出 scope 屬性需擴階層 `{tenant, brand, project, household}` for Phase III。
- **為什麼是阻礙**：M14 + M02 引入「建商專案 / 社區 / 戶別」後，原本平面的 `brand_scope` 無法表達「同建商不同社區可見 / 同社區不同戶別不可見」這類 Phase III 必要 case。Phase I 不阻擋 freeze，但 ADR Decision 應在 §Negative 或 §Mitigation 明示「Phase III 需擴階層，hook 已預留」，避免 v2 改寫又要動 Decision schema。
- **建議改法**：在 Decision 段補一小節「§Scope Filter 升維路徑」明示 `attr_mask.scope = {tenant_id, brand_scope, project_id (Phase II+), household_id (Phase III+)}`，並在 ERD 預留欄位（cross-ref FR-0019 / FR-0041 customer-site-device-master）。

#### [S-1] Family Reviewer 角色與 M07 / M19 對齊薄弱

- **引用**：
  - ADR-0050 L64 Family Reviewer：「SOP 入庫相關 Evidence（合約 4.4(d)）」。
  - M07（L1045-1063）完全未提 family reviewer；M19 BI L1349-1367 也未提。
- **為什麼是建議而非阻礙**：family reviewer 屬合約 4.4(d) eternal RBAC，不是 final spec 直接源；但 M07 workforce + M19 BI 兩處 BR 集都應該交叉引用（M07 BR-M07-NN「角色關係」、M19 BR-M19-02「report download audit by role」）。
- **建議改法**：ADR-0050 v2 改寫時，把 family reviewer 列入「§Cross-module references」明示與 M07 / M19 的對應點。

#### [S-2] AI Bot 列在最後一列但缺 lifecycle 維度

- **引用**：ADR-0050 L65 AI Bot：「不主動暴露 Evidence URL ... 與當前 conversation_id 綁定」。
- **為什麼是建議**：AI Bot 沒有 lifecycle 階段（永遠是「conversation 內」），但矩陣升維後 9 個角色都要填 lifecycle 欄。建議 AI Bot 在升維後標 `lifecycle_phase = N/A` + `action = view-by-reference-only`。

#### 通過項
- 9 角色矩陣本身概念與 final spec Q077 / Q110 / Q111 / Q112 / Q113 對齊（已涵蓋 customer / locksmith / CS / accounting / brand / supervisor / auditor 七類）。
- Pre-mortem mapping (F4) 與 Eternal/Transient 分類正確。
- 與 ADR-0042 RBAC 4 層、ADR-0051 retention 的 related 引用正確。

#### 跨 persona 衝突點（給 orchestrator）
- 與 DBA：Architect 主張「lifecycle_phase 拆四階段（pre-accept / post-accept / closed / warranty）」，DBA 可能主張「lifecycle_phase 拆兩階段 + warranty boolean」以簡化 partition key。本 critique 不裁決，留 orchestrator 或 Lane B。

---

### §2.2 DBA persona

**視角邊界**：PII / retention / index strategy / 資料一致性 / migration risk。

#### [B-3] Column-level PII classification 仍未進 ADR body（Round 1 F1 未落地）

- **引用**：
  - ADR-0050 L51-66 Decision 表：屬性過濾欄只列邏輯條件（`customer_id == self` / `brand_scope` 等），**未列 attr-level mask matrix**（chat / 簽名 / GPS / 發票 / 手機 / LINE ID 各對應哪個 PII tier、哪個角色看到哪個 mask 規則）。
  - `docs/_source/01-workorder-erp.md` L1301-1316 BR-M17 連續多條都明示 PII 分級（Q077 內部成本 / Q111 品牌商不看內部工資 / Q112 師傅不看品牌成本 / G014 IT support 預設不看客戶隱私）。
  - Round 1 第 5 條已點出 column-level PII tier + mask matrix。
- **為什麼是阻礙**：Decision body 沒有 column-level mask matrix，下游 ERD / OpenAPI / FR-0006 photo metadata schema 無法精確產生。FR-0006 L227 已掛 ADR-0050 為依賴；若 ADR-0050 v2 不補 mask matrix，FR-0006 §1.1 第 6 步「wo.photos JSONB 含 metadata (timestamp, GPS, EXIF, file_hash)」無法回答「GPS 對 brand user 應該 mask 嗎？對 family reviewer 應該嗎？」。
- **建議改法**：v2 加 §E「Attribute-Level PII Tier + Mask Matrix」表，欄位 = `attribute (chat / 簽名 / GPS / 發票 / 手機 / LINE_ID / 內部成本)` × `PII tier (T0 / T1 / T2 / T3)` × `mask rule per role (clear / partial / hash / null)`。

#### [B-4] Retention 仍硬編碼天數，未真正引用 ADR-0051 公式

- **引用**：
  - ADR-0050 L57-66：仍寫「結案後 90 天可查」/「結案後 30 天可查」/「結案後 1y 內」/「永久」等具體天數。
  - ADR-0051 L42-49 三層保存期（1y / RMA+3y / Legal 永久 / GDPR forget 7 天）— 本身就是 retention 唯一 source of truth。
  - ADR-VCH-002 L11-15 對 voucher 已 7y + S3 Glacier；M17 audit 走 BR-M17 7 yr 對齊 ADR-VCH-002 + FR-0020 L11-15。
  - Round 1 第 6 條已點出 retention 改引用 ADR-0051 + 加 composite index。
- **為什麼是阻礙**：兩處 retention 數字若被同步維護，必出現雙寫漂移；MOM-level decision 應該只有一份。Decision body 不改的話，Lane A 永遠卡在 retention 維護點上。此外，「可查」（visibility window）與「保存」（retention）是兩個正交概念 — ADR-0050 應該只管 visibility，retention 全交 ADR-0051。
- **建議改法**：
  1. 把 L57-66 表內「案件生命週期限制」欄改為 `visibility_window` 並引用 ADR-0051 公式：`visibility_window = retention_until` 或 `min(retention_until, post_close + role_specific_grace)`。
  2. 移除所有硬編碼天數，改為「per ADR-0051 §Decision 表 + per role grace」。

#### [B-5] Composite index + partition 策略未進 ADR (DBA round 1 第 6 條缺收)

- **引用**：
  - Round 1 merge report L31 已點：DB 補 `(tenant_id, brand_scope, visible_until)` composite index + `closed_at` 月分區。
  - ADR-VCH-002 L48 已示範 yearly partition + monthly sub-partition pattern（PG14 declarative partitioning），可直接抄到 evidence 表。
  - ADR-0050 PARTIAL_UPDATE 銜接點：完全未進 body，僅 banner 提及。
- **為什麼是阻礙**：role-based scope filter 在 final spec scale（多 tenant × 多 brand × 多 project × 多 household）下，若沒設計 composite index，query plan 必退化成 seq scan。但這條本質上屬於「下游 DB ADR」（per Round 1 F3），不必完全寫進 ADR-0050；ADR-0050 應加一行 cross-ref 即可。
- **建議改法**：
  1. v2 加一行「§F Database Index Strategy → see ADR-NNNN (TBD by devteam-design + devteam-dba per Round 1 F3)」。
  2. 不阻擋 ADR-0050 v2 freeze，但 ADR-NNNN 必須在 Gate 5b DB Schema Freeze 前提交。

#### [S-3] Audit log 與 visibility 矩陣的關係未明示

- **引用**：
  - ADR-0050 沒提 audit log 動作；FR-0020 L43 / BR-M17-NN 卻明文「所有狀態變更需記錄操作者與時間」+「matrix read access also audited」（per Q026 / Q114）。
- **為什麼是建議**：每次 evidence visibility check 是否要寫 audit row？這是 evidence access 防外洩的關鍵 — auditor 可回溯誰看過哪張照片。BR-M19-02 report download audit 已有對齊，但 evidence view 本身呢？
- **建議改法**：v2 §Consequences 補一句：「Evidence read access 寫 audit log（per FR-0020 + BR-M19-02），grain = (user_id, evidence_id, role_at_view_time, masked_or_clear)」。

#### [S-4] GDPR forget 與 visibility window 的競態關係未明示

- **引用**：ADR-0051 L49「客戶請求刪除（GDPR）：7 天內執行」+ L55「呼叫 forget_user_data API」。
- **為什麼是建議**：客戶按 GDPR forget 後，「customer 自己」這列 visibility 應該如何？是「立即不可見」還是「retention 提早歸零」？目前 ADR-0050 未表態。對 brand user / supervisor / auditor 又應如何（auditor 通常合法保留 7y）？
- **建議改法**：v2 §Consequences 補「Forget 觸發後，customer 自己 visibility = false；其他角色保留至 retention 自然到期（per ADR-0051 §forget 與 retention 的優先序）」。

#### 通過項
- ADR-0050 與 ADR-0051 / ADR-0042 / ADR-0028 的 cross-ref 完整。
- 已正確識別 PII / 商業機密 / 法律憑據三類資料邊界（L43-46）。
- Phase I tenant_id / brand_scope 二維 partition 足以支撐 launch（先不引入 project / household 不阻 Phase I）。

#### 跨 persona 衝突點（給 orchestrator）
- 與 Architect：DBA 主張 retention 完全外抽到 ADR-0051，Architect 可能主張 ADR-0050 保留「visibility window」作為 retention 的子集（避免雙寫）。實際上兩者一致：visibility 與 retention 是兩維度，前者短後者長，前者引用後者公式。

---

## §3 Orchestrator Merge

### §3.1 Consensus Blockers（Arch + DBA 兩 persona 一致）

| ID | 問題 | 提出者 | 建議改法 |
|:---|:-----|:-------|:---------|
| CB-1 | **Decision body 未實際升維**（Round 1 第 1 條 + 第 5 條 + 第 6 條全部停在 banner，未進 Decision 段） | arch (B-1), dba (B-3, B-4) | v2 改寫 Decision 段為四維（role × lifecycle_phase × action × attr_mask）+ 加 §E PII mask matrix + retention 改引用 ADR-0051 |
| CB-2 | **Cross-module references 薄弱**（M03 階層 / M07 family reviewer / M19 audit / FR-0006 metadata 都依賴 ADR-0050 v2，但 Decision body 沒給 hook） | arch (B-2, S-1), dba (B-5, S-3) | v2 補 §F Database Index Strategy cross-ref + §Cross-module references 表 |

### §3.2 Per-Persona Blockers

| ID | 問題 | Persona | 嚴重度 |
|:---|:-----|:--------|:-------|
| B-1 | BR-M17-01 三維拆分未落 body | arch | 阻礙 Gate 4 |
| B-2 | scope 階層升維 hook 未明示 | arch | 阻礙 Phase III readiness |
| B-3 | Column-level PII mask matrix 未落 body | dba | 阻礙 ERD / OpenAPI 下游 |
| B-4 | Retention 硬編碼天數雙寫 | dba | 阻礙維護 |
| B-5 | Composite index + partition 策略未 cross-ref | dba | 阻礙 Gate 5b |

### §3.3 Suggestions

| ID | 建議 | Persona |
|:---|:-----|:--------|
| S-1 | Family reviewer 與 M07 / M19 對齊 | arch |
| S-2 | AI Bot 升維後標 lifecycle_phase = N/A | arch |
| S-3 | Evidence read access 寫 audit log | dba |
| S-4 | GDPR forget 與 visibility window 競態關係明示 | dba |

### §3.4 跨 persona 衝突點

| 議題 | 衝突描述 | 建議處理 |
|:-----|:---------|:---------|
| Lifecycle phase 拆分粒度 | Arch 主張 4 階段（pre-accept / post-accept / closed / warranty）；DBA 可能傾向 2 階段 + warranty flag（partition friendly） | **不升 Lane B**。Round 1 第 1 條已明示 4 階段，本次接受 Arch 主張；DBA 的 partition concern 在 ADR-NNNN（Round 1 F3）解決 |
| Retention 抽出 vs 內含 | Arch + DBA 表面對立，實質一致：ADR-0050 只引用 ADR-0051 公式，DB 層的 visible_until column 由新 ADR 落 | 已收斂，無需 Lane B |

**`conflicts_count` = 0**（兩個議題都已 in-line 收斂；不觸發 Lane B 升級）。

---

## §4 Verdict 判定

### §4.1 升級判定三選一

| 判定 | 條件 | 命中？ |
|:-----|:-----|:-------|
| **SUPERSEDE** | 9 角色矩陣概念與 final spec 直接衝突 | ❌ 不命中。M09 BR-M09-02 + M17 BR-M17-01 都把 ADR-0050 9 角色當 superset 接受 |
| **STILL_VALID** | PARTIAL_UPDATE banner 已等同 v2 body | ❌ 不命中。banner 是 TODO 清單，不是 Decision 段；BR-M17-01 三維強制要求不允許 1D Decision freeze |
| **PARTIAL_NEEDS_MORE** | PARTIAL_UPDATE 形式正確但 body 未落地 | ✅ **命中** |

### §4.2 為什麼不是 PARTIAL_SUFFICIENT

> **核心反證**：把 Round 1 列的 6 個維度寫在 frontmatter 的 banner 上**等於 TODO list**，不等於**已修正的 Decision body**。下游 ERD / OpenAPI / FR-0006 metadata schema / FR-0019 RBAC SCD2 / FR-0020 audit log export 都會直接讀 Decision 段，banner 不會被引用方解析。形式上 status 改為 partial-updated，實質仍是 v1 body。

### §4.3 Verdict

**PARTIAL_NEEDS_MORE** — Round 1 verdict 正確，PARTIAL_UPDATE 的 banner 也正確，但 v2 body 改寫工作（Round 1 F1）必須真正執行才算收尾。

---

## §5 Follow-up Actions

| # | Action | Owner | Priority | Gate 對齊 |
|:--|:-------|:------|:---------|:---------|
| F1' | **改寫 ADR-0050 Decision body 為 v2**：Decision 段拆四維（role × lifecycle_phase × action × attr_mask）；加 §E PII mask matrix；retention 改引用 ADR-0051；補 §Scope Filter 升維路徑（M03 階層 hook）；補 §Cross-module references 段 | `devteam-arch` | **P0 / Gate-4-blocking** | Gate 4 NFR/ADR Baseline freeze 前必交 |
| F2' | 寫新 ADR（暫名 ADR-NNNN-evidence-db-index-strategy）：composite index `(tenant_id, brand_scope, visible_until)` + monthly partition by `closed_at`，pattern 抄 ADR-VCH-002 §2 | `devteam-design` + `devteam-dba` | P1 / Gate-5b-blocking | Gate 5b DB Schema Freeze 前必交 |
| F3' | FR-0006 §1.1 第 6 步「wo.photos JSONB metadata」需對齊 ADR-0050 v2 §E mask matrix，補 metadata mask 規則 | `devteam-analyst` | P1 | Gate 3 System Spec Freeze 前對齊 |
| F4' | FR-0019 / FR-0020 frontmatter `superseded_clauses` 補引 ADR-0050 v2 三維拆分 + audit log read-access grain | `devteam-analyst` | P2 | Gate 3 對齊 |
| F5' | QA test plan: ADR-0050 v2 9 列 × G/W/T × 3 action × 4 lifecycle phase = 108 test scenario 上限（實際 prune 至 ~30）| `devteam-qa` | P1 | Gate 6 Test Ready 前 |

> **F1' = Round 1 F1 升級**：原 P0 升為 **Gate-4-blocking**（不可只是 P0 待辦，而是 freeze gate 阻擋條件）。

---

## §6 Confidence

| 維度 | Level | 說明 |
|:-----|:------|:-----|
| Verdict confidence | **HIGH** | Arch + DBA 兩個 critique 視角，5 個 blocker 全部指向同一個根因（Decision body 未落地） |
| 不需升 Lane B | **HIGH** | conflicts_count = 0，兩個 cross-persona 議題都在本報告內收斂 |
| 不需升 SUPERSEDE | **HIGH** | 9 角色概念與 final spec superset，無 P0 直接衝突 |
| 不需業主裁決 | **MEDIUM-HIGH** | F1' 升 Gate-4-blocking 屬流程升級，業主只需確認 priority 升格；不需重新評估技術 trade-off |

---

## §7 Drill-down references

- **Round 1 merge report**：[`.claude/context/devteam/reviews/2026-05-28-adr-0050-critique/merge-report.md`](../../../.claude/context/devteam/reviews/2026-05-28-adr-0050-critique/merge-report.md)
- **ADR-0050 current**：[`docs/architecture/adr/ADR-0050-evidence-visibility-matrix.md`](../../architecture/adr/ADR-0050-evidence-visibility-matrix.md)
- **ADR-0100 §1 supersede index**：[`docs/architecture/adr/ADR-0100-legacy-adr-supersede-index.md`](../../architecture/adr/ADR-0100-legacy-adr-supersede-index.md)
- **Final spec M09 / M17**：[`docs/_source/01-workorder-erp.md`](../../_source/01-workorder-erp.md) L1090-1112（M09）, L1291-1316（M17）
- **依賴 FR**：[FR-0006](../../analysis/fr/FR-0006-onsite-photo.md) / [FR-0019](../../analysis/fr/FR-0019-rbac-dynamic.md) / [FR-0020](../../analysis/fr/FR-0020-audit-log-export.md)
- **Retention 對齊**：[ADR-0051](../../architecture/adr/ADR-0051-evidence-retention-policy.md) / [ADR-VCH-002](../../architecture/adr/ADR-VCH-002-voucher-retention-7y.md)

---

## §8 Change Log

| Date | Change | Why |
|:-----|:-------|:----|
| 2026-05-28 | Round 2 Lane A critique (收尾 / standard intensity, arch + dba personas) | Round 1 PARTIAL_UPDATE 確認形式正確但 body 未落地，verdict = PARTIAL_NEEDS_MORE |
