# Forum Final Report: <topic-id>

> **Status**: converged | escalated | degraded
> **Rounds completed**: <n> / 3
> **Target doc**: <path>
> **Personas involved**: <list>
> **Date**: <ISO>
> **Facilitator**: devteam-facilitator

---

## TL;DR（給業主的 30 秒摘要）

<1-2 sentences: 「Forum 結果 X，建議業主裁決 Y」>

---

## 三訊號判定結果

| 訊號 | 結果 | 證據 |
|:-----|:-----|:-----|
| (a) 連續兩輪無新 blocker | ✓ / ✗ | `round-{N-1}` 有 X 條 blocker，`round-N` 有 Y 條，新增 Z 條 |
| (b) 剩餘衝突點 ≤ 3 | ✓ / ✗ (count=N) | 列出剩餘衝突 ID |
| (c) Critics binary ack | ✓ / ✗ / parse-fail | 列 ack 內容或失敗原因 |

**Verdict**: converged / escalated / degraded

---

## Round 簡史

### R1 — Proposer 提案
- Proposer 傾向: Option <X>
- Trade-off 選項數: <n>
- 連到: `round-1/proposer.md`

### R2 — Critics Critique
| Persona | Blockers 提出數 | Suggestions 數 |
|:--------|:----------------|:---------------|
| pm | <n> | <n> |
| sre | <n> | <n> |
| ... | ... | ... |

### R3 — Proposer 回應
- 接受 blockers: <n>
- 拒絕 blockers: <n>
- 修改 Option: <yes/no>
- 連到: `round-3/proposer-response.md`

### R3 末 — Critics Acknowledge
| Persona | Withdraw | Retain | Escalate |
|:--------|:--------:|:------:|:--------:|
| pm | 2 | 0 | 0 |
| sre | 0 | 1 | 0 |
| ... | ... | ... | ... |

---

## 收斂版本（若 status=converged）

### 最終議案

引用 `forum/<topic-id>/round-3/proposer-response.md` 的 Modified Proposal 段落，明文列出最終版本：

```
Option A' (modified from Option A):
  - 變動點: ...
  - 預期影響: ...
  - 預期 trade-off: ...
```

### 業主下一步

1. 接受此版本 → 走 `/devteam-<role>` 寫 ADR/DR
2. 走 `/devteam-freeze` 重 freeze target doc

---

## 剩餘未解衝突（若 status=escalated | degraded）

| Conflict ID | 持保留方 (persona) | Proposer 立場 | 推薦業主裁決選項 |
|:------------|:-------------------|:--------------|:-----------------|
| C-1 | sre | proposer 主張 X，sre 主張 Y | A: 採 sre 觀點 / B: 採 proposer 觀點 / C: 折衷 Z |
| C-2 | ... | ... | ... |

### 業主下一步（每個 conflict 都要明文裁決）

1. **逐項裁決**：在本檔下方追加裁決區塊：
   ```
   ### 業主裁決 C-1
   - 選擇: A / B / C
   - 理由: ...
   - 後續動作: /devteam-arch 寫 ADR-<n> 紀錄此裁決
   ```
2. **整份打回**：forum 結束，原文件保持原狀，無 ADR

---

## ADR/DR 起草建議

> 給業主或 driver skill 參考。Facilitator 不直接寫 ADR/DR，這只是建議。

- 建議 ADR/DR ID: <下一個編號，依 adr-ledger.json 計算>
- 建議 type: ADR（架構性）/ DR（產品 / 流程）
- 建議 status: Accepted（若 converged）/ Proposed（若 escalated 仍待業主）
- 建議 scope: <feature 或 cross-cutting>
- 建議「Decision Drivers」: 從 R1 affected dimensions 帶過來
- 建議「Options Considered」: R1 提的 Option A/B/C
- 建議「Consequences」: R3 修案後的影響面

---

## 業主裁決區塊（待填）

```
### 業主簽核
- 簽核人: <name>
- 簽核日期: <ISO>
- 裁決結果:
  - [ ] 接受 converged 版本
  - [ ] 採用某個 conflict 選項（明指）
  - [ ] 整份打回
- 後續動作:
  - [ ] 走 `/devteam-<role>` 寫 ADR/DR
  - [ ] 走 `/devteam-freeze <gate>` 重 freeze
  - [ ] 走 `/devteam continue cascade`
```
