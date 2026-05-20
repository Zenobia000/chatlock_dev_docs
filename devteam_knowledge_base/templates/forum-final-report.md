# Forum Final Report — {topic-id}

> **📋 Status**: ✅ converged | ⚠️ escalated | ❌ degraded
> **🗓 Date**: YYYY-MM-DDTHH:MM:SS+TZ
> **👤 Facilitator**: `devteam-facilitator`
> **🔖 Rounds**: {n} / 3
> **🎯 Target doc**: {path}
> **👥 Personas**: {list}
> **🔗 Related**: [`KB 05 meeting protocols`](../05_meeting_protocols.md) §Forum-Lite · [`templates/forum-topic.md`](./forum-topic.md)

---

## 📋 Executive Summary

> [!TIP]
> **TL;DR (30s)**: Forum on **{topic}** ran **{n} round(s)** with **{N} personas**. Outcome: **{✅ converged / ⚠️ escalated / ❌ degraded}**. {1-line: 「Forum 建議業主 X」}.

| 維度 | 摘要 |
|:---|:---|
| **🎯 議題** | {topic short description} |
| **🚀 Verdict** | ✅ converged · ⚠️ escalated · ❌ degraded |
| **📊 衝突數** | {N} remaining conflicts |
| **🔖 Rounds** | {n} / 3 |
| **🎯 下一步** | 業主裁決 → ADR / 重 freeze / 整份打回 |

> [!IMPORTANT]
> 業主必讀區：**收斂版本**（若 converged）或 **剩餘未解衝突**（若 escalated/degraded）下方需明文簽核。

---

## 🔔 三訊號判定結果

> [!NOTE]
> Lane B Forum-Lite 收斂判定採三訊號 AND（任一缺一即 escalate）：

| # | 訊號 | 結果 | 證據 |
|:---:|:---|:---:|:---|
| (a) | 連續兩輪無新 blocker | ✅ / ❌ | `round-{N-1}` 有 X 條 blocker，`round-N` 有 Y 條，新增 Z 條 |
| (b) | 剩餘衝突點 ≤ 3 | ✅ / ❌ (count={N}) | 列出剩餘衝突 ID |
| (c) | Critics binary ack | ✅ / ❌ / parse-fail | 列 ack 內容或失敗原因 |

**Verdict**: ✅ **converged** · ⚠️ **escalated** · ❌ **degraded**

---

## 📜 Round-by-Round 簡史

### R1 — Proposer 提案

| 欄位 | 內容 |
|:---|:---|
| Proposer 傾向 | Option {X} |
| Trade-off 選項數 | {n} |
| Affected dimensions | {list — e.g., reliability / cost / TTM} |
| 連結 | [`round-1/proposer.md`](./round-1/proposer.md) |

### R2 — Critics Critique

| Persona | Blockers 提出 | Suggestions | Stance |
|:---|:---:|:---:|:---:|
| pm | {n} | {n} | ⚠️ |
| sre | {n} | {n} | ❌ |
| ba | {n} | {n} | ✅ |
| ... | ... | ... | ... |

### R3 — Proposer Response

| 欄位 | 數量 / 內容 |
|:---|:---|
| 接受 blockers | {n} |
| 拒絕 blockers | {n} |
| 修改 Option | yes / no |
| 連結 | [`round-3/proposer-response.md`](./round-3/proposer-response.md) |

### R3 末 — Critics Acknowledge

| Persona | Withdraw | Retain | Escalate |
|:---|:---:|:---:|:---:|
| pm | 2 | 0 | 0 |
| sre | 0 | 1 | 0 |
| ba | 0 | 0 | 0 |

---

## ✅ 收斂版本（若 status=converged）

### 最終議案

> [!IMPORTANT]
> 引用 [`round-3/proposer-response.md`](./round-3/proposer-response.md) 的 Modified Proposal 段落，明文列出最終版本：

```
Option {X}' (modified from Option {X}):
  變動點:
    - ...
  預期影響:
    - ...
  預期 trade-off:
    - ...
```

### 業主下一步

| Step | Action |
|:---:|:---|
| 1 | 接受此版本 → 走 `/devteam-{role}` 寫 ADR/DR |
| 2 | 走 `/devteam-freeze {gate}` 重 freeze target doc |

---

## ⚠️ 剩餘未解衝突（若 status=escalated · degraded）

> [!WARNING]
> 三訊號未通過，需要業主明文裁決下列每個 conflict。

| Conflict ID | 持保留方 | Proposer 立場 | 推薦業主裁決選項 |
|:---|:---|:---|:---|
| C-1 | sre | proposer 主張 X，sre 主張 Y | A: 採 sre · B: 採 proposer · C: 折衷 Z |
| C-2 | ... | ... | ... |

### 業主下一步（每個 conflict 都要明文裁決）

**逐項裁決**：在本檔下方追加裁決區塊：

```
### 業主裁決 C-1
- 選擇: A / B / C
- 理由: ...
- 後續動作: /devteam-arch 寫 ADR-{n} 紀錄此裁決
```

**或整份打回**：forum 結束，原文件保持原狀，無 ADR。

---

## 📝 ADR/DR 起草建議

> [!NOTE]
> 給業主或 driver skill 參考。Facilitator **不直接寫 ADR/DR**，這只是建議。

| 欄位 | 建議 |
|:---|:---|
| **ADR/DR ID** | 下一個編號（依 `adr-ledger.json` 計算） |
| **Type** | ADR（架構性）/ DR（產品 · 流程） |
| **Status** | Accepted（若 converged）/ Proposed（若 escalated） |
| **Scope** | {feature 或 cross-cutting} |
| **Decision Drivers** | 從 R1 affected dimensions 帶過來 |
| **Options Considered** | R1 提的 Option A / B / C |
| **Consequences** | R3 修案後的影響面 |

---

## ✍️ 業主裁決區塊

> [!IMPORTANT]
> 業主簽核此 forum 的最終裁決。

**簽核人**: ____________
**簽核日期**: YYYY-MM-DD

**裁決結果**（單選）：

- [ ] ✅ 接受 converged 版本（直接走下游 ADR + freeze）
- [ ] ⚠️ 採用 conflict 選項（明指：C-1: __ · C-2: __ · ...）
- [ ] ❌ 整份打回（forum 結束，無 ADR，原文件保持原狀）

**後續動作**：

- [ ] 走 `/devteam-{role}` 寫 ADR/DR
- [ ] 走 `/devteam-freeze {gate}` 重 freeze
- [ ] 走 `/devteam continue cascade`（若有下游 stale 文件）

---

## 🔍 Drill-down

<details>
  <summary>Click to see full per-round transcripts</summary>

  - **R1 proposer raw**: [`round-1/proposer.md`](./round-1/proposer.md)
  - **R2 critics raw**: [`round-2/critic-{persona}.md`](./round-2/)
  - **R3 proposer-response raw**: [`round-3/proposer-response.md`](./round-3/proposer-response.md)
  - **R3 critics-ack raw**: [`round-3/critic-{persona}-ack.md`](./round-3/)
  - **Facilitator decision log**: [`facilitator-log.md`](./facilitator-log.md)
</details>

---

## 🔗 Cross References

- **Forum topic** (R1 入口): [`templates/forum-topic.md`](./forum-topic.md) → 對應實例 [`forum/{topic-id}/topic.md`](./topic.md)
- **MoM gold reference**: [`templates/mom.md`](./mom.md)
- **Lane A review report**: [`templates/review-report.md`](./review-report.md)
- **KB references**: [[05_meeting_protocols]] §Forum-Lite

---

**End of Forum Final Report**

> 給業主：你主要看 **📋 Executive Summary** + **✅ 收斂版本**（或 **⚠️ 剩餘未解衝突**）+ **✍️ 業主裁決區塊** 三段。Round-by-Round 是給未來追溯用的審計軌跡。
