# 13 · Doc Migration Playbook

> **📋 Status**: catalog · gold reference
> **🗓 Last updated**: 2026-05-27
> **👤 Owner**: DevTeam Facilitator
> **🔖 Version**: v1.0
> **🔗 Related**: [`04_freeze_gates`](04_freeze_gates.md) · [`05_meeting_protocols`](05_meeting_protocols.md) · [`12_document_format_standard`](12_document_format_standard.md)
> **🪵 Origin**: 2026-05-27 roundtable `final-spec-migration-strategy` → CATALOG_GAP backfill (raised by pm-r1 / arch-r1)

---

## §1 何時用這份 playbook

| 觸發場景 | 是否走 playbook |
|:---------|:----------------|
| 業主拿來一份新 final spec 要取代既有 docs | ✅ 必走 |
| 單一 ADR 被新決策取代 | ❌ 直接寫新 ADR + 標 superseded by |
| Phase rollout 文件更新 | ❌ 走 driver skill |
| 跨多份 doc 的 schema/contract 改版 | ✅ 走 playbook §3 cascade 章節 |

**Playbook 三大原則**：
1. **不刪舊檔**（業主治理底線，除非業主明示 `git rm`）
2. **舊檔標 superseded、不修改內容**（保留 audit trail）
3. **新檔走完整 driver skill 與 freeze gate**（不偷工）

---

## §2 ADR Supersede 判定樹

> 收 70+ ADR 想 cascade 時，每條照下面跑。`04_freeze_gates` 配合使用。

```
對每一條既有 ADR：
  ├─ 新規格 P0 決策 / BR clause 與該 ADR Decision 段落 直接衝突？
  │   ├─ 是 → 標 [SUPERSEDE]，寫新 ADR-NNNN，舊 ADR frontmatter:
  │   │       status: superseded
  │   │       superseded_by: ADR-NNNN
  │   │       superseded_on: <YYYY-MM-DD>
  │   │       superseded_reason: <quote 新規格段落>
  │   │
  │   └─ 否 → 進下一題
  │
  ├─ 新規格的 module 重組是否讓該 ADR 的 Context 段落部分失效？
  │   ├─ 是（如 ADR 講「smart-lock-saas」概念，新規格拆 M01-M20）
  │   │   → 標 [REVIEW_REQUIRED]，走 Lane A critique 判定：
  │   │     ├─ critique 多數認為仍 valid → 標 [STILL_VALID_UNDER_M-NN]
  │   │     └─ critique 多數認為應退役 → 標 [SUPERSEDE]
  │   │
  │   └─ 否 → 進下一題
  │
  ├─ 該 ADR 只是「決策歷史記錄」（如 PM-alignment、PIVOT、tactical-refactor）？
  │   ├─ 是 → 標 [HISTORICAL]，保留原狀，frontmatter 加：
  │   │       status: historical
  │   │       still_referenceable_for: <用途>
  │   │
  │   └─ 否 → 標 [STILL_VALID_UNDER_M-NN]，frontmatter 加：
  │           status: active
  │           reviewed_against: <new-spec-name + date>
  │           module_scope: M-NN
  │
  └─ END
```

### 判定 case study

| Case | 判定 |
|:-----|:-----|
| `ADR-0031-ai-auto-convert-to-work-order` vs 新規格「D01 Phase I: No auto conversion. Customer service/human confirms PC」 | [SUPERSEDE]（直接衝突） |
| `ADR-0039-cancellation-fee-tiers` vs 新規格「取消費 前期 未決」 | [STILL_VALID_UNDER_M11/M15]（新規格未蓋過） |
| `ADR-0023-tactical-refactor-2026-q2` | [HISTORICAL]（決策歷史） |
| `ADR-PIVOT-001-v2-restart-trigger` | [HISTORICAL]（決策歷史） |
| `ADR-0050-evidence-visibility-matrix` vs 新規格 M09 evidence permissions | [REVIEW_REQUIRED]（部分覆寫，需 critique） |

---

## §3 FR / Spec Cascade 規則

新規格進來後，下游 doc 更新順序與 fan-out：

```
1. 兩份 source spec → dump 到 docs/_source/ (D4)
   ↓
2. 寫 ADR-100 supersede index（不寫個別 supersede 內容，只列對照表）
   ↓
3. 對每個被 [SUPERSEDE] 的 ADR：
   ├─ 寫新 ADR
   ├─ 舊 ADR frontmatter 加 superseded_by
   └─ 找出該 ADR 被引用之處（grep），加 cross-ref 註記
   ↓
4. FR 改寫（依 B' 殼策略 — 見 templates/fr-skeleton.md）
   ↓
5. ERD / OpenAPI / Test Plan / Runbook / NFR matrix cascade
   ↓
6. PRD 最後更新（PRD 是上層 narrative，改在最後）
```

**反向：禁止 PRD 先改**。PRD 是 narrative 引用 ADR/FR/Spec，PRD 先改會讓 cross-ref 半空懸。

---

## §4 Cross-Reference 維護

舊 doc supersede 後，repo 內可能還有 N 個地方引用它。**不修改引用方，只在被引用方加 alias**。

| 動作 | 做法 |
|:-----|:-----|
| ADR 被 supersede | 舊 ADR frontmatter 加 `redirects_to:`；正文不動 |
| FR 改寫 B' 殼 | 舊 rule clause 不刪，移到 `superseded_clauses_archive:` 段 |
| Spec 大改 | 舊版加 `archived_as: <commit-hash>`；新版同檔名覆寫 |

引用方（如 test plan 引用 FR-NNNN）**永遠走最新檔名**，由被引用方的 frontmatter 處理重定向。

---

## §5 Phase Rollout 對 doc PR 節奏

Migration 不可 big bang。對應 [`10_resilience_patterns §3 rollout`](10_resilience_patterns.md)：

| Phase | 寫 doc 範圍 | exit criteria |
|:------|:------------|:--------------|
| Phase 0 (Blueprint Freeze) | 影響全系統的 cross-cutting ADR + System Setup 主檔 | 所有後續 phase 的 boundary 已 freeze |
| Phase I | Phase I scope 內所有 module 的 FR + spec + test plan | Phase I 可 coding，feature 集合定義完整 |
| Phase II | Phase II scope 內所有 module | 同上 |
| Phase III/IV/V | **只列 module ID + owner + scope intent + out-of-scope bullet**，**不寫 NFR baseline** | 等該 phase 進入 Gate1 再補 |

過早 freeze 未進入 critical path 的 phase 的 NFR 會綁死 capacity 估算且 ROI 無法驗證。

---

## §6 工具與自動化

| 工具 | 用途 |
|:-----|:-----|
| `docs/_source/` auto-dump pipeline | xlsx → markdown mirror，業主改 xlsx CI 自動更新 mirror |
| `docs/_index/by-module/M??.md` 自動生成 | grep 全 repo 列該 module 涉及所有 FR/BR/ADR/event |
| `docs/_index/traceability-matrix.md` 自動生成 | FR ↔ BR ↔ ADR 三向矩陣（從各 doc frontmatter 抽 `mapped_to` 聚合） |
| ADR-100 dashboard | 從各 ADR frontmatter `status:` 聚合，列當前 active / superseded / historical 統計 |

自動化前提：所有 doc 採用 [`12_document_format_standard`](12_document_format_standard.md) frontmatter 規範，欄位齊全才能聚合。

---

## §7 Anti-patterns（避免）

| Anti-pattern | 為什麼錯 | 正確做法 |
|:-------------|:---------|:---------|
| 把 supersede 的舊 ADR `git rm` 掉 | 破壞 audit trail，未來無法回推為什麼當初這樣決 | 標 superseded，內容保留 |
| 一次性 ADR-100 直接 retire 所有舊 ADR | scope creep，無 case-by-case 評估 → 誤殺 still-valid ADR | 個別評估走 §2 判定樹 |
| FR retire 全部、rule 同時搬 BR + 新增 use case | 同時動 acceptance 結構與 rule 內容，QA 套不上 case，回歸測試斷 | B' 殼：FR 留 acceptance，rule 搬 BR |
| 新 spec 一進 repo 就改 PRD | PRD 引用的 ADR/FR/Spec 還沒 cascade，PRD cross-ref 半空懸 | PRD 最後改（見 §3） |
| 用 xlsx 直接被 docs 引用 (`xlsx#sheet:cell`) | git diff 看不到變動 blast radius，PR review 無法檢視 | docs/_source/ 雙存（D4） |

---

## §8 Legacy Doc Supersede 邊界決策樹（補 Roundtable A D2）

> Source: Roundtable A (2026-05-27) D2 — 73 個既有 ADR 個別評估標準。
> 對應 [`04_freeze_gates §ADR Supersede Chain`](04_freeze_gates.md)（boundary criteria 在那邊延伸）。
> §2 是高層判定樹（SUPERSEDE / REVIEW_REQUIRED / HISTORICAL / STILL_VALID），§8 補**邊界 criteria**：何時該歸 Superseded vs Reviewed_Still_Valid。

### §8.1 Superseded 認定條件（全要符合）

`Status: Superseded by <new-ADR-or-clause>` 的硬性條件：

| 條件 | 說明 | 反例（不算 Superseded） |
|:-----|:-----|:------------------------|
| **C1: 直接衝突** | 新規格 P0 規則 / BR clause 明文與該 ADR 的 Decision 段落核心結論不可共存 | ADR 提到「LINE bot 用 webhook」，新規格沒講 channel 細節 → 不算衝突 |
| **C2: 同一 scope** | 新規格的覆寫範圍與舊 ADR 的 scope 完全或近完全重疊 | 舊 ADR 講「全系統 retry 策略」，新規格只覆寫「Chatbot 重試窗口」→ 部分覆寫，走 REVIEW_REQUIRED |
| **C3: 無共存路徑** | 不存在能同時 honor 舊 ADR + 新規格的實作方案 | 舊 ADR 講「異步處理」、新規格講「同步即時回應」→ 無共存（Superseded）；舊講「retry 3 次」新講「retry 5 次」→ 數值微調，走 REVIEW_REQUIRED |

**Case 範例**：
- `ADR-0031-ai-auto-convert-to-work-order` vs 新規格 D01 "No auto conversion, human confirms PC"
  → C1 ✅（明文衝突）C2 ✅（同 scope）C3 ✅（無共存）→ **Superseded**

### §8.2 Reviewed_Still_Valid 認定條件

`Status: Reviewed, Still Valid Under M-NN` 的條件（任一即可，且**非 §8.1 三條全 yes**）：

| 條件 | 說明 | 範例 |
|:-----|:-----|:------|
| **V1: 架構/技術選型基底未變** | ADR 講技術基底（DB 選型、framework、cache 策略），新規格只動 business rule | `ADR-0010-postgres-as-primary-db` vs 新規格 M03 規則調整 → V1 |
| **V2: 新規格未蓋過 ADR scope** | 新規格的 module 拆分沒涵蓋 ADR 的 cross-cutting 主題 | `ADR-0039-cancellation-fee-tiers` vs 新規格「取消費前期未決」→ V2（未蓋過） |
| **V3: ADR Context 段部分過時但 Decision 仍適用** | Context 講舊 module 名稱，但 Decision 描述的決策原則對新模組仍適用 | `ADR-0050-evidence-visibility-matrix` 在新規格下需手動 review，confirm Decision 段仍適用 → V3 |

### §8.3 Boundary Case 處理（部分被覆寫）

當 ADR 與新規格**部分衝突部分仍 valid** 時：

```
是否能拆？
├─ 是（ADR 含 N 個 sub-decision，新規格只覆寫其中 M 個）
│   → 標 [PARTIALLY_SUPERSEDED]，frontmatter:
│      status: partially_superseded
│      superseded_clauses:
│        - "Decision §2.1 by <new-ADR>"
│        - "Decision §3 by BR-M??-NN"
│      still_valid_clauses:
│        - "Decision §2.2, §4"
│      → 新寫一條補充 ADR 或在 ADR-100 標 partial
│
└─ 否（單一 Decision 段，部分模糊地不一致）
    → 強制走 Lane A critique（不可由 Architect 單獨 merge）
       critique 結論：
       ├─ 多數認為實質衝突 → 升 Superseded
       └─ 多數認為可詮釋仍 valid → 標 Reviewed_Still_Valid + 在 ADR 加 "Interpretation Note" 段
```

### §8.4 ADR-100 表格欄位定義（Source: Roundtable A D2 + 業主 Q4=C）

`docs/architecture/adr/ADR-0100-legacy-adr-supersede-index.md` 每行欄位：

| 欄位 | 值域 | 來源 |
|:-----|:-----|:-----|
| `ADR-ID` | ADR-NNNN | scan |
| `title` | string | scan ADR frontmatter |
| `status` | active / superseded / partially_superseded / reviewed_still_valid / historical | §8.1-8.3 判定 |
| `superseded_by` | ADR-NNNN \| BR-M??-NN \| — | 若 superseded 則必填 |
| `M-NN scope` | M01..M20 / A01..A12 / S-M01..S-M06 / cross-cutting | 對應新規格 module |
| `reviewer` | role (Architect / Lane A critique) | superseded 走 Architect 直 merge；其餘 Lane A |
| `decision_date` | YYYY-MM-DD | 寫入 ADR frontmatter 同步 |

[ref: KB-04 §ADR Supersede Chain 判定規則]

---

## §9 粒度切分檢核表（補 Roundtable B D3）

> Source: Roundtable B (2026-05-28) D3 — user flow vs FR 殼以**粒度**切分而非 scope。
> 用於 driver SOP：UX 寫 user flow 前 + Analyst 寫 FR 前，雙方先讀本表對齊。

### §9.1 粒度判定矩陣

| 維度 | User Flow doc（journey level） | FR 殼（atomic step） |
|:-----|:--------------------------------|:----------------------|
| **時間軸視角** | 使用者完整旅程（從 entry 到 exit，可跨多分鐘） | 單一 event → validate → emit event，毫秒 ~ 秒級 |
| **語法** | 「使用者看到 X → 做 Y → 螢幕轉到 Z」 | 「event_A → 系統執行 validation → emit event_B」 |
| **state 表達** | UI state（happy/empty/loading/error/offline）+ domain state 用 entry/exit annotation | 不重複 UI state；只列 acceptance G/W/T 觸發後的 persisted state |
| **rule 引用** | 不寫 rule 內容（只標「依規則進入分支」） | 不寫 rule 內容（引用 `[ref: BR-M??-NN]`） |
| **acceptance** | 不寫 G/W/T（標 `→ FR-NNNN / AC-NN`） | 寫 G/W/T 完整 |
| **粒度單位** | 一個 journey 通常含 5-15 個 step | 一個 FR 通常含 3-7 個 main flow step + 1-3 個 alternative |
| **acceptance owner** | 反向指 FR 殼 | 自己寫完整 G/W/T |
| **example dialogue / wireframe** | wireframe 標位置（抽到 `docs/ux/wireframes/`） | scripted dialogue 寫在 acceptance example 段（Roundtable B D2） |

### §9.2 檢核問題（driver 寫 doc 前自問）

寫 **user flow doc** 前：
- [ ] 我寫的是 journey level（多 step / 跨 screen / state 轉換）嗎？若只是「按鈕 → call API → 回應」→ 那是 FR atomic step，不該寫在 user flow
- [ ] 每個 step 是否標了 `→ FR-NNNN / AC-NN`？沒標 = orphan step
- [ ] 我是否複製了 FR 殼的 main flow 文字？若是 → 違反 D3，必須刪除並改成反向指
- [ ] state matrix 我是否只列 UI state？domain state 是否走 entry/exit annotation？

寫 **FR 殼** 前：
- [ ] 我的 main flow 是否每行都是 atomic step（單一 event + validate + emit）？若是 journey level 描述 → 屬於 user flow，不該寫在 FR
- [ ] 我是否在 FR 殼裡描述了 UI screen 跳轉？若是 → 違反 D3，要搬到 user flow doc
- [ ] 我是否寫了 rule clause 內容？若是 → 違反 D5，要搬到 BR-M??-NN

### §9.3 典型錯誤切分（critique 必抓）

| Anti-pattern | 為什麼錯 | 正確做法 |
|:-------------|:---------|:---------|
| user flow 寫「系統 validate password 長度 ≥ 8」 | rule + atomic = 應在 FR + BR | user flow 寫「使用者輸入密碼 → 系統驗證 → 進下一頁 [→ FR-0012 AC-02]」 |
| FR 殼 main flow 寫「使用者看到登入畫面 → 點擊登入按鈕 → 系統跳到 dashboard」 | journey level = 應在 user flow | FR main flow：「使用者提交 credentials event → 系統 validate → emit `UserAuthenticated` → END」 |
| user flow 列「state: authenticated / unauthenticated / locked」 | domain state = 應 entry/exit annotation | UI state 只列 happy/loading/error/empty；entry 標「→ authenticated」 |
| FR 殼放 wireframe 截圖 | wireframe = 應在 `docs/ux/wireframes/` | FR 不放 wireframe，只引用 `[ref: wireframes/login.md]` |
| FR 殼 + user flow 都各自寫 main flow 文字 | duplicate main flow = D3 違規 | user flow 只標 `→ FR-NNNN`，FR 殼負責完整 main flow |

### §9.4 範例：M03 報價 PC drafting flow 切分

**user flow doc（journey level）**：
```
S2. PC drafting journey
  step 1: 客服在後台看到新 Case → 點「建立 PC」 [UI state: happy / empty if 沒附件]
  step 2: 系統 draft PC（向 AI 取建議模板）→ 客服編輯 [→ FR-0003 AC-01]
  step 3: 客服送出 → 主管 review [→ FR-0004 AC-01, entry: pending_approval]
  step 4: 主管核准 → 系統發報價單 PDF [→ FR-0005 AC-01, entry: confirmed]
```

**FR 殼 main flow（atomic step）**（FR-0004）：
```
1. 客服提交 PC draft event
2. 系統 validate 必填欄位完整，依 [ref: BR-M03-02]
3. 系統 emit `PCSubmittedForApproval`，狀態轉 pending_approval
4. END：postcondition = 主管 inbox 收到通知
```

→ 兩邊**不重複文字**，user flow 反向指 FR 殼。

[ref: KB-13 §10 cross-ref 維護]

---

## §10 User Flow ↔ FR 殼 Cross-Ref 維護規範（補 Roundtable B D3）

> Source: Roundtable B (2026-05-28) D3 — user flow 每 step 標 `→ FR-NNNN / AC-NN` 反向指，cascade 時雙向同步。

### §10.1 標記語法

user flow doc 內每個 step 結尾標：

```markdown
- step N: 使用者做 X [→ FR-NNNN AC-NN] [UI state: happy/error]
- step N+1: 系統做 Y [→ FR-MMMM AC-MM, entry: confirmed]
```

語法規則：
- `→ FR-NNNN` 單一對應
- `→ FR-NNNN AC-NN` 對應特定 acceptance（推薦）
- `→ FR-NNNN | FR-MMMM` 多個 FR 共同覆蓋同一 step（罕見，需註記原因）
- `→ TBD` 暫無對應 FR（critique 必抓 → 必須補 FR 或刪 step）

### §10.2 反向指 vs 雙向指

**規則**：user flow → FR 是**單向反向指**（user flow 引用 FR；FR 不引用 user flow）。

原因：FR 是 acceptance 殼 SoT，可被多個 user flow / journey 共用（如 FR-0008 異常核准跨 S2 / S3）。若 FR 反向列「我被哪些 user flow 引用」，cascade 時要回去改 N 處，**違反單一 source 原則**。

替代方案：user flow → FR 的反向 lookup 由 `docs/_index/traceability-matrix.md` 自動聚合（從 user flow doc scan `→ FR-NNNN` 標記）。

### §10.3 Cascade 同步檢查

當任一邊改動，另一邊的同步義務：

| 改動事件 | user flow 同步 | FR 殼同步 |
|:--------|:----------------|:----------|
| FR-NNNN 新增 acceptance AC-NN | （無，user flow 不一定要新增 step） | 自己更新 |
| FR-NNNN 刪 acceptance AC-NN | user flow 要找出 `→ FR-NNNN AC-NN` 引用並更新/移除 | 自己刪 |
| FR-NNNN superseded 整條 | user flow 把 `→ FR-NNNN` 改成 `→ FR-MMMM`（新 FR） | 新 FR 自己寫 |
| user flow 新增 step | 新 step 必須標 `→ FR-NNNN` 或 `→ TBD`（pending FR） | （無） |
| user flow 刪 step | （無） | FR 不受影響（FR 是 SoT） |

### §10.4 CI 檢查項

`docs/_index/traceability-matrix.md` tool 自動跑：

```python
# pseudo
for flow_file in glob('docs/ux/**/*.md'):
    refs = scan_pattern(flow_file, r'→ FR-\d{4}(\s+AC-\d+)?')
    for ref in refs:
        if not fr_exists(ref.fr_id):
            flag_orphan_ref(flow_file, ref)  # 🔴 user flow 指到不存在的 FR
        if ref.ac_id and not ac_exists(ref.fr_id, ref.ac_id):
            flag_stale_ac(flow_file, ref)  # 🟡 AC 已刪
        if ref == '→ TBD':
            flag_tbd(flow_file)  # 🟡 pending FR
```

| flag | severity | 行動 |
|:-----|:---------|:-----|
| Orphan ref (FR 不存在) | 🔴 | UX driver 必補 FR 或刪 step |
| Stale AC (AC 已刪) | 🟡 | UX driver 換最近 AC 或刪 step |
| TBD ref | 🟡 | Analyst driver 必補 FR |

[ref: KB-13 §9 粒度切分]、[ref: templates/traceability-matrix.md §2]
