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
| **Forum-Lite (Lane B)** | **~45k**（3 round × 3 personas） |

業主可在 state.json 改 `review_intensity_default` 控制總成本。Lane B forum 不在此 dial 內，由業主明文 `/devteam-forum` 觸發。

---

# Forum-Lite Round 結構（Lane B）

當 Lane A critique 出現 `conflicts_count >= 2`，router Phase 5b 提示業主升級到 Forum-Lite。本段定義 forum 各 round 的 prompt 結構與收斂判定。

## Round 階段對照

| Round | 階段 | 觸發 agent | 寫入位置 | 任務 |
|:------|:-----|:----------|:---------|:-----|
| R1 | Proposer 提案 | `devteam-proposer` (mode=R1) | `forum/<topic-id>/round-1/proposer.md` | 議題 + affected dimensions + trade-off 選項 |
| R2 | Critics 並行 critique | 12 personas 中指定者 | `forum/<topic-id>/round-2/<persona>.md` | 標準 persona critique 格式 |
| R3 | Proposer 回應 | `devteam-proposer` (mode=R3) | `forum/<topic-id>/round-3/proposer-response.md` | blocker-by-blocker accept/reject/modify |
| R3 末 | Critics acknowledge | 同 R2 personas | `forum/<topic-id>/round-3/<persona>-ack.md` | binary 勾選：withdraw / retain / escalate |
| — | Facilitator 收斂判定 | `devteam-facilitator` | `forum/<topic-id>/final-report.md`（converged / escalated 才寫） | 三訊號 AND 判定 |

## R2 Critic Prompt 結構（與 Lane A persona critique 一致）

Persona agent 在 forum mode 收到的額外 context：

```
你正在參與 Forum-Lite Round 2 critique。

## 議題
讀 forum/<topic-id>/round-1/proposer.md，理解 proposer 提出的：
- 議題陳述
- Affected dimensions
- Trade-off 選項 A/B/C
- Proposer 傾向

## 你的任務
從你的 persona 視角（見 .claude/agents/devteam-<你>-persona.md）對「議題本身」與「proposer 提案」做 critique。

特別針對 proposer 的「給 critics 的問題」段落直接回應。

輸出格式維持標準 persona critique（[B-*] blockers + suggestions + 通過項 + 跨 persona 衝突點）。

## 與 Lane A 的差異
- 你的 critique 預期會被 proposer 在 R3 回應
- 你會在 R3 末有 acknowledge round 決定撤回或保留 blocker
- 不要在這輪「結論性裁決」，留辯論空間
```

## R3 Proposer Response 格式

見 `.claude/agents/devteam-proposer.md` Mode R3 段落。重點：

- **每一條** R2 blocker 都要明文回應（accept / reject / modify）
- Reject 必須給理由
- Modify 必須產出 Modified Option（如 Option A'）
- 不可改變 affected dimensions（R1 鎖定）

## R3 末 Critic Acknowledge 格式

```markdown
# Round 3 Acknowledge — [persona]

> 讀 proposer-response.md 後對每條我提的 blocker 給出 binary 標記。

## My Blockers Status

| Blocker ID | Original problem | Proposer response | My decision |
|:-----------|:-----------------|:------------------|:------------|
| [<persona>-B-1] | <quoted> | accept / reject / modify | [x] withdraw / [ ] retain / [ ] escalate |
| [<persona>-B-2] | <quoted> | ... | [ ] withdraw / [x] retain / [ ] escalate |

## 動作定義

- **withdraw**：proposer 的回應或修案讓我認為這 blocker 已解
- **retain**：我仍認為這是 blocker 但可由業主裁決
- **escalate**：我認為這 blocker 嚴重到 forum 無法解，業主必須立刻介入

## 嚴禁

- 不可不勾選（每條 blocker 必須有 binary 標記）
- 不可勾多於一個（withdraw / retain / escalate 互斥）
- 不可發明新 blocker（新 blocker 開新 forum）
```

## 三訊號 AND 收斂判定

`devteam-facilitator` 在每個 round 完成後跑此判定：

| 訊號 | 滿足條件 | 不滿足時 |
|:-----|:---------|:---------|
| **(a) 連續兩輪無新 blocker** | round-N blocker 集合 ⊆ round-(N-1) blocker 集合 | continue |
| **(b) 剩餘衝突點 ≤ 3** | 最新 round 中 critics 標 retain 或 escalate 的 blocker 數 ≤ 3 | continue（若可進下一輪）或 escalate（若已 max_rounds） |
| **(c) Critics binary ack** | 所有 critics 都明文勾選 binary（無 parse fail，無 escalate） | parse fail → degraded escalate / 有 escalate → 強制升級 |

### 終止表

| (a) | (b) | (c) | round vs max | Verdict | 動作 |
|:---:|:---:|:---:|:------------:|:--------|:-----|
| ✓ | ✓ | ✓ | — | **converged** | 寫 final-report.md → 升級業主 |
| ✗ | — | — | < max | **continue** | 進入下一輪 R3 / R4 / 重判 |
| ✗ | — | — | == max | **escalated** | 強制寫 final-report → 升級業主 |
| — | — | parse fail | — | **degraded** | 寫 final-report 標 ⚠ → 升級業主 |
| — | — | 有 escalate | — | **escalated** | 任一 critic 勾 escalate → 立即升級 |

### 為什麼是三訊號 AND 而非 OR / LLM 判斷

- **AND** 避免單一訊號偶然滿足造成假收斂
- **不靠 LLM 判斷**：多 agent 同模型輸出高度相關，會出現 sycophancy 假同意，這在 multi-agent 系統是公認失敗模式
- **Binary acknowledge**：強制 critics 明文勾選，避免「我同意但...（隱含反對）」的模糊回應
- **3 訊號** 對應「沒新問題 + 剩餘可控 + 大家明確態度」三件實質可驗證的事

## Forum 不做的

- 不做 standing forums（harness 無 daemon，不模擬週節奏會議）
- 不做超過 3 round（強制升級給業主裁決）
- 不做 critic 投票（多 LLM agent 投票高度相關 = 假信心）
- 不做自動 ADR 寫入（業主裁決後走既有 driver skill）
- 不做 dimensions → personas hard-coded 映射表（LLM 推斷 + 業主 override）
