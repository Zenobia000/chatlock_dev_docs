# KB 12 — Document Format Standard (Big-Corp Visual Style)

> **📋 Status**: standard · binding for all templates in `devteam_knowledge_base/templates/`
> **🗓 Last updated**: 2026-05-20
> **👤 Owner**: DevTeam Harness
> **🔖 Version**: v1
> **🔗 Related**: KB 03 (template index) · all 17 `templates/*.md`

---

## 📋 Executive Summary

> [!TIP]
> **TL;DR (30s)**: 所有產出文件採「**Balanced** 大廠視覺標準」— universal header + 📋 Executive Summary 置頂 + emoji-headed sections + 表格主導 + 重要警示用 GitHub callouts。目標：人類讀者 30 秒抓重點、5 分鐘讀完關鍵節、想深入時用 drill-down `<details>`。

| 維度 | 規範 |
|:---|:---|
| **適用範圍** | 17 個 `templates/*.md`、所有 driver skills 寫到 `docs/` 的檔案、所有 persona log（reviews/, roundtables/, sessions） |
| **視覺強度** | Balanced（不極簡也不裝飾過度） |
| **跨平台** | GitHub web · VS Code markdown preview · 擴充內 marked.js |
| **強制度** | Tier 1 模板必填 · Tier 2 建議 · openapi.yaml 豁免 |

---

## 🎯 設計三原則

### 1. 30/300/3000 規則

| 讀者時間 | 看什麼 |
|:---|:---|
| **30 秒** | Universal Header + 📋 Executive Summary（TL;DR callout + 4-行摘要表格） |
| **300 秒** | 上面 + 重要章節（Decisions / Risks / Action Items / FR / Gate evidence 等） |
| **3000 秒** | 全文 + drill-down `<details>` 展開的細節 |

### 2. 可掃讀 > 可閱讀

- 用**表格**取代散文（structured data 永遠勝出）
- 用**條列**取代段落（重點壓到行首）
- 用 **bold** 標出 row 內關鍵詞
- 散文只用於 reasoning / 背景脈絡，不超過 3 行

### 3. 狀態 always 可見

每節 heading 加 emoji status indicator，每個 row / item 帶 status pill：

| Emoji | 意義 | 典型場景 |
|:---|:---|:---|
| ✅ | done / passed / accepted | gate frozen, decision approved, test passed |
| ⚠️ | warning / pending | gate ready_to_review, blocking risk, OQ pending |
| ❌ | blocked / rejected / failed | failed checks, blocked gate, rejected proposal |
| 🚀 | active / current | current_phase indicator, in-progress driver |
| ⏳ | pending / future / deferred | future phases, deferred items |
| 🔒 | frozen / locked / immutable | frozen docs, signed-off ADR |
| ↶ | undo / reverted / superseded | reverted decisions, superseded ADR |
| 💬 | discussion / drill-down / roundtable | Lane C MoM refs |
| 📋 | doc / artifact / spec | doc cross-refs |
| 🎯 | action item / next step / goal | action queue, KPI |
| ❓ | open question / unresolved | OQ-NNN entries |
| 🔗 | reference / link / cross-doc | KB refs, ADR ledger refs |

---

## 🏗 Universal Header（每份文件統一）

每個 Tier 1 / Tier 2 模板的開頭：

```markdown
# {Document Type} — {Subject}

> **📋 Status**: draft | reviewed | frozen | superseded
> **🗓 Last updated**: YYYY-MM-DD
> **👤 Owner**: <role-or-name>
> **🔖 Version**: vN
> **🔗 Related**: ADR-NNN · DR-NNN · KB-N §X

---

## 📋 Executive Summary

> [!TIP]
> **TL;DR (30s)**: 一段話講完此文件核心結論 / 變更影響 / 業主必讀重點。

| 維度 | 摘要 |
|:---|:---|
| **目標** | ... |
| **範圍** | ... |
| **狀態** | {emoji} {status} |
| **下一步** | ... |

---

(內容章節從這裡開始)
```

**強制要求**：

- ✅ Universal Header 5 個 metadata field 全填（不知道就填 `TBD`）
- ✅ Executive Summary 在第一個內容章節（不可省略）
- ✅ TL;DR callout 必須在 Exec Summary 第一個元素
- ✅ 摘要表格 4 列：目標 / 範圍 / 狀態 / 下一步（內容類型可依文件調整名稱）

---

## 📞 Callout 對照表

採用 [GitHub Alert syntax](https://docs.github.com/en/get-started/writing-on-github/working-with-advanced-formatting/basic-writing-and-formatting-syntax#alerts)（GitHub web + VS Code 1.93+ + 擴充內 marked-alert plugin 都支援）：

| Callout | 用途 | 場景範例 |
|:---|:---|:---|
| `> [!NOTE]` | 補充說明（非阻擋） | 背景脈絡、ASSUMPTION 標註 |
| `> [!TIP]` | 最佳實踐 / 推薦 | TL;DR / KB 引用 / 推薦方案 / Quick tip |
| `> [!IMPORTANT]` | 業主必讀 / decision points | Approval needed / signoff 區塊 / 關鍵決策 |
| `> [!WARNING]` | 風險警示 | Breaking change / migration impact / risk |
| `> [!CAUTION]` | 嚴重後果 / 不可逆 | Destructive ops / unrecoverable changes / hard deletions |

**使用節制**：每份文件 callout 總數建議 ≤ 5 個（多了視覺疲勞）。`> [!TIP]` 用於 TL;DR 是固定用法，其他 callout 只在「真的有風險」時用。

---

## 📊 表格使用守則

| 場景 | 推薦表格欄位 |
|:---|:---|
| **Decisions** | `# / Decision / Confidence / Reversibility / Impact` |
| **Action Items** | `# / Action / Owner / Priority / Due / Status` |
| **Open Questions** | `# / Question / Why / Options / Recommendation` |
| **Risks** | `# / Risk / Severity / Impact / Mitigation` |
| **FR (Functional Reqs)** | `ID / Description / Acceptance Criteria` |
| **NFR** | `Dimension / Requirement / Target` |
| **Gate evidence** | `Evidence / Required / Status / Reference` |
| **Trade-off matrix** | `Option / Pros / Cons / Fit / Anti-fit / Recommendation` |

**約定**：
- ✅ Column align: `:---` (left) 為主，`:---:` (center) 用於 status emoji 欄
- ✅ Status 欄一律放 emoji + 文字（`✅ done`、`⚠️ pending`）
- ✅ 表格不超過 5 欄（多了難 scan）
- ✅ Row 數 > 10 時加 `> 共 N 筆，下方 drill-down 看全部` 提示

---

## 🔍 Drill-down 機制（長文件必備）

文件超過 200 行 OR 某章節超過 30 行時，用 `<details>` 折疊次要內容：

```markdown
## 🔍 Drill-down: Full per-persona reports

<details>
  <summary>Click to expand (3 personas, ~80 lines)</summary>

  ### ba persona raw output
  ...
</details>
```

**收合慣例**：
- ✅ 完整 raw output / transcript / per-persona detail → 收合
- ✅ Round-by-round 對話 → 收合
- ✅ Long YAML / JSON metadata → 收合
- ❌ Executive Summary / Decisions / Action Items / Open Questions → **不收合**

---

## 📝 Persona 互動 Log 標準格式

任何 multi-message log（`session-{id}.md` / `reviews/` / `roundtables/`），每筆新增訊息：

```markdown
## [2026-05-20T01:30:00+08:00] {persona-id} {event-type}

> [!TIP]
> **TL;DR**: 一句話結論

**Verdict / Stance**: ✅ accept | ⚠️ revise | ❌ block

**Detail**:
- 重點 1
- 重點 2

**Refers to**: [prior message anchor](#timestamp-id)
```

**強制約定**：

| 規則 | 為什麼 |
|:---|:---|
| TL;DR callout 永遠在第一段 | 讀者掃讀只看這個 |
| Verdict emoji 視覺定錨 | ✅⚠️❌ 三色一目了然 |
| Detail 用條列，不寫散文段落 | 降低認知負荷 |
| 跨訊息引用用 anchor link | 避免重複內容 |
| 訊題標題含 ISO timestamp + persona id + event-type | `grep` 友善 |

---

## 🎨 Markdown 視覺元素清單

按使用頻率排：

| 元素 | 使用度 | 用於 |
|:---|:---|:---|
| `#`–`####` headings | 必用 | 章節層次 |
| Tables | 必用 | 所有 structured data |
| Bullet lists `- ` | 必用 | non-structured 條列 |
| **Bold** | 常用 | row 內關鍵詞、callout TL;DR |
| Emoji | 常用 | heading + status pill + table emoji |
| `> [!TYPE]` callouts | 適度 | 風險 / 重點 / 必讀（≤5/文件） |
| Inline `code` | 常用 | 路徑、檔名、變數名、command |
| Fenced ` ```lang ` blocks | 常用 | code samples、YAML schemas、mermaid diagrams |
| Tables with status column | 必用 | 任何 Decision / Action / Risk / Gate 表 |
| `<details><summary>` | 常用 | drill-down 收合 |
| `---` HR | 必用 | 章節間視覺分隔 |
| *Italic* | 偶用 | 強調 / 外文 / 標記 ASSUMPTION |
| ~~Strikethrough~~ | 偶用 | 標 deprecated / superseded 項 |
| Blockquote `>` | 偶用 | metadata header / quote prior decision |
| Footnote `[^1]` | 少用 | 太囉嗦，少用為宜 |

---

## ⚠️ 反例（不要這樣寫）

> [!WARNING]
> 以下是新模板要避免的舊風格：

| 反例 | 為什麼不要 |
|:---|:---|
| 純散文 paragraph 講完 5 個重點 | 認知負荷重，不可掃讀 |
| 表格只有 1 列 / 沒 header | 不如直接寫條列 |
| 多重巢狀 `-` 超過 3 層 | 看不清層次 |
| Heading 跳級（h1 → h3） | 破壞文件 outline |
| Emoji 密集（每 row 多個 emoji） | 視覺嘈雜 |
| 全篇都用 `> [!IMPORTANT]` | 全部都重要 = 沒有重點 |
| 沒 Executive Summary | 違反 30 秒規則 |
| 沒 Universal Header metadata | 不知道誰寫的、何時、版本 |

---

## ✍️ Template 撰寫工作流（給 driver skills）

當 driver skill（如 `devteam-pm`）產 doc 時的順序：

1. 寫 Universal Header（5 個 metadata field）
2. 寫 📋 Executive Summary（TL;DR callout + 摘要表格）
3. 依模板章節順序填內容
4. 必要處加 callout（風險、重點、不可逆）
5. 長 raw output 用 `<details>` 收合
6. 末尾補 Cross References 段（連到 ADR / KB / 相關 docs）

---

## 🔗 Cross References

- 範本目錄索引：[`KB 03_document_templates.md`](./03_document_templates.md)
- Meeting / log 規範：[`KB 05_meeting_protocols.md`](./05_meeting_protocols.md)
- Gold reference 範例：[`templates/mom.md`](./templates/mom.md)
- New Lane A template：[`templates/review-report.md`](./templates/review-report.md)

**Tier 分層**（17 個模板套用程度）：

| Tier | Templates | 套用程度 |
|:---|:---|:---|
| **Tier 1（10 個）** | prd / adr / decision-record / system-spec / runbook / release-readiness / handoff / forum-final-report / mom / **review-report**（新） | 全部 4 強制要求都符合 |
| **Tier 2（6 個）** | test-plan / user-flow / c4-l1 / c4-l2 / c4-l3 / erd / forum-topic | Universal Header + Exec Summary，內容章節依需要 polish |
| **豁免** | `openapi.yaml` | OpenAPI 規範本身已結構化，渲染靠 swagger-ui |
