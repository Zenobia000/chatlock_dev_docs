# Review Report — {Gate} {Feature}

> **📋 Status**: completed | escalated | superseded
> **🗓 Reviewed at**: YYYY-MM-DDTHH:MM:SS±TZ
> **👥 Personas**: {persona-1, persona-2, ...} ({N})
> **🔖 Version**: v1
> **🔗 Subject**: `docs/{path}/{file}.md` @ v{N}
> **🔗 Related**: [`KB 04 freeze gates`](../04_freeze_gates.md) · [`KB 05 meeting protocols`](../05_meeting_protocols.md)

---

> [!NOTE]
> 給 Lane A Multi-Role Critique Pipeline 用。由 `devteam-orchestrator` agent 合併 N 個 persona critique 後產出。
>
> 設計原則：
> - **業主 30 秒抓重點**（Executive Summary 置頂 + verdict callout）
> - **共識 blocker 與 per-persona concerns 分開**（避免重複指責）
> - **衝突顯化**（不自動裁決，交業主簽核）
> - **drill-down 收合原始 raw output**（讀者不被淹沒）

---

## 📋 Executive Summary

> [!TIP]
> **TL;DR (30s)**: {N} personas reviewed {subject} v{n}. **{X} consensus blockers** · **{Y} per-persona concerns** · **{Z} conflicts** · {W} suggestions.
> **Verdict**: ✅ ready to freeze | ⚠️ needs revision | ❌ blocked

| 維度 | 計數 | 嚴重度 |
|:---|:---:|:---|
| 🚫 Consensus blockers | {X} | high / medium / low |
| 👤 Per-persona concerns | {Y} | — |
| ⚠️ Conflicts | {Z} | escalate? Y/N |
| 💡 Suggestions (non-blocking) | {W} | — |

| 維度 | 摘要 |
|:---|:---|
| **Subject** | `docs/{path}/{file}.md` @ v{N} |
| **Personas** | {persona-1, persona-2, ...} |
| **Intensity** | light / standard / strict |
| **下一步** | 業主裁決 → freeze / revise / escalate to Lane B |

---

## 🚫 Consensus Blockers

> 多 persona 一致認為**必須先處理**才能 freeze。業主裁決可選：accept / reject / defer。

| ID | Issue | Severity | Personas | Recommendation |
|:---|:---|:---:|:---|:---|
| CB-01 | {問題簡述} | 🔴 high | ba, sa, po | {具體 fix 建議} |
| CB-02 | {問題簡述} | 🟡 medium | ux, sa | {具體 fix 建議} |

---

## 👤 Per-Persona Concerns

> 個別 persona 視角的 blocker / suggestion。不被其他 persona 同等強調的事項。

### 👤 {persona-1} (e.g., ba)

> [!IMPORTANT]
> **TL;DR**: {一句話 verdict + 主要關注}

**Blockers**（必須解才能 freeze）：
- {blocker 1 — 具體位置 + 為什麼是 blocker}
- {blocker 2}

**Suggestions**（建議改但不阻擋）：
- {suggestion 1}

**Out of scope concerns**（在此 gate 不討論但記錄）：
- {item 1}

### 👤 {persona-2} (e.g., sa)

> [!IMPORTANT]
> **TL;DR**: ...

**Blockers**:
- ...

**Suggestions**:
- ...

### 👤 {persona-3}

...

---

## ⚠️ Conflicts (持有不同立場 — 不自動裁決)

> [!WARNING]
> 當 `conflicts_count ≥ 2` 時系統會自動提示業主升級到 **Lane B Forum-Lite** 多輪辯論。
> 業主也可直接在下方簽核裁決，不進 forum。

| Topic | {persona-A} 立場 | {persona-B} 立場 | Owner Resolution |
|:---|:---|:---|:---|
| C-01: {議題} | {A 的觀點 + 理由} | {B 的觀點 + 理由} | ☐ 採 A · ☐ 採 B · ☐ 折衷 · ☐ 升 Lane B |
| C-02: {議題} | ... | ... | ☐ ... |

---

## 💡 Suggestions (non-blocking)

> 改善建議，不擋 freeze。業主可選擇接受 / 延後 / 拒絕。

| ID | Suggestion | Effort | Persona | Accept? |
|:---|:---|:---|:---|:---:|
| S-01 | {建議內容} | S / M / L | sa | ☐ |
| S-02 | {建議內容} | S | ux | ☐ |

---

## ✅ Pass-Through Items

> 多 persona 確認**沒問題**的部分，記下來證明該節已被審過。

- ✅ §1 Problem Statement: 所有 persona 認可
- ✅ §3 Users & Scenarios: scope 清楚
- ...

---

## 🔍 Drill-down: Original Per-Persona Reports

<details>
  <summary>Click to expand full raw per-persona output ({N} personas, ~{lines} lines)</summary>

  ### 👤 {persona-1} raw output

  ```markdown
  {完整 raw critique from persona-1 agent}
  ```

  ---

  ### 👤 {persona-2} raw output

  ```markdown
  {完整 raw critique from persona-2 agent}
  ```

  ---

  ### 👤 {persona-3} raw output

  ```markdown
  {...}
  ```

</details>

---

## ✍️ Owner Verdict

> [!IMPORTANT]
> 業主簽核區。在每個 Consensus Blocker / Conflict 旁勾選決定後，於下方寫總體 verdict。

**Overall verdict**:

- [ ] ✅ **Accept all** — 所有 CB 同意處理，relevant doc revise + 重 freeze
- [ ] ⚠️ **Accept partial** — 接受部分 CB / suggestions（在上方表格逐項勾）
- [ ] ❌ **Reject review** — 不接受此次 review 結論（reason: ____________）
- [ ] ⏸️ **Defer** — 延後處理（revisit at: ____________）
- [ ] 💬 **Escalate to Lane B** — 轉 Forum-Lite 多輪辯論（topic: ____________）

**Signed**: ____________
**Date**: ____________
**Next action**: ____________

---

## 🔗 Cross References

**本 review 引用的 catalog**：
- [[06_quality_attributes_catalog]] §X — 影響 CB-01 / CB-02 嚴重度判定
- [[10_resilience_patterns]] §Y — 影響 S-03 建議內容

**Output 流向**：
- 寫入 `.claude/context/devteam/reviews/{Gate}-{feature}-{date}.md`
- Gate freeze 簽核後在 `state.json.freeze_gates.{Gate}` 標 `frozen`
- 若 escalate to Lane B → 觸發 `devteam-forum` skill

---

## 📊 Review Metadata (給 agent / 系統用)

```yaml
review_id: {ISO timestamp + gate + feature}
template_version: review-report-v1
gate: {Gate1_PRD | Gate2_UXFlow | ...}
intensity: light | standard | strict
personas:
  - id: ba
    role: critique
    blockers_raised: 2
    suggestions_raised: 1
  - id: sa
    role: critique
    blockers_raised: 1
    suggestions_raised: 3
conflicts_count: {N}
escalation_recommended: false | true
total_token_used: ~{N}
catalog_refs:
  - kb: 06_quality_attributes_catalog
    section: "§1"
    impact: "CB-01 severity"
```

---

**End of Review Report**

> 給業主：你只需要看 **📋 Executive Summary** + **🚫 Consensus Blockers** + **⚠️ Conflicts** + **✍️ Owner Verdict** 四段，
> 全部加起來 < 2 分鐘。其他段落是給 driver skill / 追溯歷史用的。
