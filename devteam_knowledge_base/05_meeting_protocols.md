# 05 — Meeting Protocols（Multi-role Review Prompt 模板）

當 freeze gate ready_to_review 時，router dispatch persona agents 並行 critique。本檔定義每個 persona agent 的**標準 prompt 結構**與 orchestrator 合併邏輯。

---

## Persona Agent 標準 Prompt 結構

每個 persona agent 收到的 prompt 都是這個結構（router 動態填入）：

```
你是 <persona> critique 視角（見 .claude/agents/devteam-<persona>-persona.md）。

## 任務
對目標文件做 freeze gate review，從你的視角找問題。

## 目標文件
路徑: docs/<path>
版本: v<n>
Status: ready_to_review

## 相關背景
- Session: <session_id>
- Feature: <feature>
- 該 gate: <Gate_N>
- 上游文件: <list>
- 已知 open questions: <list>
- 已寫的 ADR/DR: <list>

## 你必須回傳的格式

```markdown
## [<persona>] critique on docs/<path>

### 重大阻礙（必修才能 freeze）
- [B-1] <具體問題 + 引用文件段落 + 為什麼是阻礙 + 建議改法>
- [B-2] ...

### 建議調整（可接受但建議改）
- [S-1] ...

### 通過項
- <哪些段落符合你的視角>

### 跨 persona 衝突點
- <若你的視角與其他 persona 可能衝突，列出衝突點>
```

## 你的視角邊界
<從 01_role_responsibilities.md 取對應 persona 的「最該盯的一件事」與「Critique 視角」>

## 嚴禁
- 不要扮演其他 persona 的視角
- 不要重新設計文件（只指出問題與建議方向）
- 不要編造資訊（不知道就標「需要 stakeholder 確認」）
```

---

## Orchestrator 合併邏輯

`devteam-orchestrator` 收到 N 份 persona critique 後：

### 1. 合併

對每份 critique 提取：
- 所有 [B-*] 阻礙項
- 所有 [S-*] 建議項
- 所有衝突點

### 2. 去重與分類

- 同一段落被多個 persona 點出 → 升格為 "consensus blocker"
- 只有單一 persona 點出 → 保留為該 persona 觀點
- 衝突點 → 獨立段落列出，**不嘗試裁決**

### 3. 產出 review report

寫入 `.claude/context/devteam/reviews/<gate>-<feature>-<date>.md`：

```markdown
# Review Report: <gate> — <feature>

> **Gate**: <Gate_N>
> **Feature**: <feature>
> **Target document**: docs/<path> @ v<n>
> **Intensity**: <light | standard | strict>
> **Personas involved**: <list>
> **Date**: <ISO>

---

## Consensus Blockers（多 persona 一致認為阻礙）

| ID | 問題 | 提出者 | 建議改法 |
|:---|:-----|:-------|:---------|
| CB-1 | ... | pm, qa | ... |

## Per-Persona Blockers

### [pm] blockers
- [pm-B-1] ...

### [arch] blockers
- [arch-B-1] ...

...

## Suggestions（非阻礙）

| Persona | 建議 |
|:--------|:-----|
| ... | ... |

## Conflicts（跨 persona 觀點衝突）

### Conflict 1: <topic>
- pm 主張: ...
- arch 主張: ...
- 建議由業主裁決

## Pass-Through Items（一致通過項）
- ...

---

## 業主裁決

[ ] 接受全部 CB + Per-Persona blockers
[ ] 逐項接受/拒絕（見下方）
[ ] 整份打回（不 freeze）

### 逐項裁決
- CB-1: [接受 / 拒絕（理由）]
- ...
```

### 4. 失敗降級

若 orchestrator 無法合併（如 persona 輸出格式不符）：

1. 跳過合併步驟
2. 直接把 N 份原始 critique 串接
3. 在開頭標註：

```markdown
> ⚠️ Orchestrator 降級模式：未能自動合併。請業主逐份檢視。
```

5. 不卡 freeze 流程，業主直接讀

---

## Intensity Dial 與 Persona 選取

| 等級 | persona 數量 | 包含 orchestrator | 適用 |
|:-----|:------------|:------------------|:-----|
| `light` | 1（取該 gate 的 primary persona） | 否 | 低風險 / 迭代版本 |
| `standard` | 2（primary + 1 secondary） | 是 | 預設 |
| `strict` | 3（依 04 KB 的 required_personas 全到） | 是 + 衝突點顯化 | PRD/NFR/API/Schema/Release |
| `dry-run` | 0（只列 critique 框架，不 dispatch） | 否 | 業主預覽 |

`required_personas` 由 `04_freeze_gates.md` 定義。

---

## Token 預算建議

| Intensity | 預估 token / freeze gate |
|:----------|:-------------------------|
| light | ~3-5k |
| standard | ~8-15k |
| strict | ~20-30k |
| dry-run | <1k |

業主可在 state.json 改 `review_intensity_default` 控制總成本。
