---
id: ADR-0010
title: Belief-Augmented ReAct（Turn Cycle 實驗）
tier: 1
status: experimental
date: 2026-05-11
deciders: [Imding1211, Claude（implementor）]
---

# ADR-010: Belief-Augmented ReAct（Turn Cycle 實驗）

**狀態:** **Experimental — On Hold**（2026-05-11 Stage B 完工 / 2026-05-13 roadmap 轉向 hermes-cs → 本 ADR 對應實驗暫不進 production）
**決策者:** Imding1211 + Claude（implementor）
**日期:** 2026-05-11（決議）/ 2026-05-13（追記 on-hold）
**作者:** Claude（with Imding1211 review）

**對應分支:** `refactor/agent-port`（其他 branch 無此實作）
**對應 commits:** Stage 0 `6787843` → Stage B `8cd45dd` ~ `c130dee` → B-fix-v2 `10c1f7d`（19 個）
**對應手冊:** [Turn Cycle / Belief-Augmented ReAct](../../agent/docs/manuals/turn_cycle_belief_augmented_react.md)、[Action Policy Thresholds](../../agent/docs/manuals/action_policy_thresholds.md)

---

## 0. TL;DR

在原 ReAct 外面再包一層**對客戶情境的明確 belief**：

```
原 ReAct ─── user input ─── LLM 自由 reason / act / reply
Belief-Augmented ── user ── Hypothesize → Decide → [Belief Hint] prefix → ReAct → Calibrate
```

**動機**：LLM 隱性決策（金錢字眼一律轉真人、追問沒給答案、過早派工）在邊界判斷上不穩定；改用「LLM 提議 + 規則層 sanity check」混合策略，從 LLM 自由發揮拉回受控的 four-action policy（COMMIT / PROBE / EXPLORE / ESCALATE）。

**結果**：67 共同題 LLM-judge strict pass **83.6% → 89.6%**、pass+partial **98.5% → 100.0%**、fail **1 → 0**。

**現況**：實驗成功但目前 roadmap 走向 hermes-cs 路線（[runtime-architecture-comparison](../_audit/runtime-architecture-comparison-2026-05-13-0125.md)），本 ADR 對應實作暫不進 production。本 branch 為 archive 候選，code/docs 保留方便未來 backport。

---

## 1. 背景與動機

### 1.1 原 ReAct 的痛點

dev agent baseline（refactor/agent-improvements，2026-05-11）跑 67-case quality_check 拿 83.6% strict pass / 1 fail，看似不錯但細看失敗模式：

| 模式 | 範例 | 為什麼難救 |
| --- | --- | --- |
| 該答的反問 | 客戶問「為什麼 X」→ LLM 反問「想了解為什麼還是怎麼操作」 | prompt 加「不要反問」會反向擠到「亂答」 |
| 過早 ESCALATE | 客戶問「派工流程」→ 直接轉真人 | system.md 寫「金錢字眼一律 transfer_to_human」誤觸 |
| 追問沒給答案 | 客戶一句多事 → 抓單 hypothesis 就 transfer，其他事沒答 | LLM 沒「多意圖意識」 |

這些都是 LLM 自由 reason 在「邊界判斷」上不穩。**根因不在知識**（mega-doc 都正確），而在**動作選擇**。

### 1.2 為什麼是 Belief 模式

從 agent_v2 + dev baseline 觀察：失敗 case 90% 共通點是「客戶情境抓錯」。如果先把「我認為客戶現在在問什麼」明確顯化（hypothesis 列表 + confidence），再用規則層決定動作，就能：

1. **顯化失誤點**：debug 時看 belief 表就知 LLM 抓錯方向，不必猜
2. **規則層守底**：高 confidence + gap 大才 COMMIT，低就 PROBE 或 EXPLORE — 不讓 LLM 在邊界自己亂判
3. **多輪修正**：Calibrate 看客戶下輪反應，DENY / SHIFT / IMPATIENT 直接更新 belief，下輪 Hypothesize 看到 prior 不會重蹈

---

## 2. 設計

### 2.1 Pipeline

```
turn N:
  user_input
    ↓
  Hypothesize (LLM)          ← BeliefState.prior（從 belief_store 拿上輪）
    ↓
  BeliefState (1-3 hypotheses, ranked by confidence)
    ↓
  decide() (rule)            ← agent/policy.py
    ↓
  ActionDecision (COMMIT / PROBE / EXPLORE / ESCALATE)
    ↓
  render_belief_hint()       ← agent/harness/belief_hint.py
    ↓
  [Belief Hint] string injected to system prompt prefix
    ↓
  原 ReAct (LangGraph create_react_agent)
    ↓
  reply to user

  (post-reply, async)
  Calibrate (LLM)            ← prior_belief + user_next_msg
    ↓
  CalibrationSignal (DENY/CONFIRM/ADD/SHIFT/IMPATIENT/NEUTRAL)
    ↓
  feed forward to turn N+1 的 Hypothesize
```

### 2.2 規則層 vs LLM 分工

| 環節 | 由誰 | 為什麼 |
| --- | --- | --- |
| 抽 hypothesis + 評 confidence | LLM | 自然語言理解 |
| 決動作（4 選 1）| 規則 | 確定性、可追溯、可調閾值 |
| 執行動作（寫 reply）| LLM | 自然語言生成 |
| 分類 calibration signal | LLM | 自然語言理解 |
| 修正 belief | LLM (下輪 Hypothesize) | 看 prior signal 自然產出新 belief |

### 2.3 為什麼選 four-action policy

| Action | 條件 | 對應 LLM 行為 |
| --- | --- | --- |
| COMMIT | conf ≥ 0.55 AND gap ≥ 0.15 | 直接答客戶 |
| PROBE | conf ≥ 0.4 | 拿 needs_probe 追問 + 仍要答能答的部分 |
| EXPLORE | 其他 | 開放式追問 |
| ESCALATE | intent ∈ {quote, dispatch} OR ownership=HUMAN | 轉真人 |

不選 3-action（沒 EXPLORE）是因為「完全模糊」場景多得很（短訊息「電池」）— 強制 PROBE 反而問錯題；不選 5-action 是因為太細，閾值難調。

---

## 3. 為什麼是「實驗 / On Hold」

### 3.1 預設關 + fail_open

`config.toml [turn_cycle].enabled=false`。理由：

1. **保守 default**：歷史上有過「打開 feature flag 直接上 production」需要回退的事件，本次設計上維持 hard default OFF。
2. **Hypothesize 失敗時走原 ReAct**（fail_open=true）— 不擋使用者
3. **未做 production 真實 LINE 流量驗證** — 只有 quality_check 合成題

### 3.2 Roadmap 轉向 hermes-cs

詳見 [runtime-architecture-comparison-2026-05-13-0125.md](../_audit/runtime-architecture-comparison-2026-05-13-0125.md)：

- 同題庫四方對打：agent_v2 strict 94% 第一、agent-port 89.6% 第二、agent-port-baseline 83.6% 第三
- 目前 roadmap 走 hermes-cs（minimal ReAct + product_info DB cache）為下一代 runtime（[ADR 待開]）
- agent-port 的 Belief-Augmented ReAct 暫不 port 到 hermes-cs，因 hermes-cs 設計鐵律之一是「儘量薄」

→ 本 ADR 對應實作**暫不進 production**，但保留：
- 程式碼不刪（git history）
- 手冊 + ADR 保留供未來決議參考
- 若 hermes-cs 跑久了發現「邊界判斷」是瓶頸，可 backport Hypothesize/Decide/Calibrate 三個 module（需重新對應 cs_runtime ReAct loop）

### 3.3 何時 revisit



| 觸發條件 | 建議動作 |
| --- | --- |
| hermes-cs production strict pass < 85% | revisit Belief 模式 |
| 業主回報「該答的還在反問」類抱怨集中 | 同上 |
| 多意圖客戶比例提高 → quality_check 加多意圖案件 | 同上 |
| 想做「客戶情境 dashboard」可視化 | Belief 持久化天然支援 |

---

## 4. Trade-offs

### ✅ Pros

- 對打數字明確提升（+6pp strict、fail 歸 0）
- belief 持久化天然支援「客戶情境 dashboard」可視化
- 規則層閾值可外部調整（policy.py 一行）— 不必改 prompt 重訓
- Hypothesize 失敗有 fail_open 兜底 — 安全

### ❌ Cons

- +1 個 LLM call/turn（Hypothesize），約 +0.8s latency
- +1 張 PG 表（belief_states），無 retention 策略
- code 多 7 個檔，增加 hermes-cs 路線「儘量薄」的相對距離
- Calibrate 在 post-reply 跑，多訊息客戶會有時序問題

---

## 5. 替代方案討論

| 方案 | 為什麼不選 |
| --- | --- |
| **純 prompt 加 self-check 區段** | 已試過，LLM 自己跳過 self-check 的 case 太多；無法用閾值穩 |
| **5-action policy（拆 COMMIT 為 ANSWER + GUIDE）** | 太細，邊界更難調；不解決核心問題 |
| **Hypothesize → 直接 LLM 選 action**（無規則層） | 失去「可調閾值」優勢；又回到 LLM 自由發揮 |
| **Belief 不持久化（每輪重抽）** | 失去 Calibrate 修正能力；多輪對話模糊問題救不到 |
| **改 baseline prompt 而非加 belief layer** | 試過，prompt 加「不要反問」會反向擠到「亂答」 |

---

## 6. 對 AI 助手與新進開發者的 lock

1. **三檔不准單獨 import 進 production path**：`belief.py` / `hypothesize.py` / `calibrate.py` 必須走 `harness/turn_cycle_runner.run_belief_cycle()` 入口
2. **`[turn_cycle].enabled` 預設必須 false**：本 branch 跑 production 任何 PR 想改成 true 都要附 production traffic A/B 數據
3. **policy 閾值調整需附對打數據**：詳見 [Action Policy Thresholds 手冊](../../agent/docs/manuals/action_policy_thresholds.md) §6 SOP
4. **不要在 hermes-cs 內 import agent/belief\***：兩個 codebase 完全隔離（[hermes-cs lock](../../agent_v2/../hermes-agent/README.cs.md)）；若要 backport 必須複寫到 cs_runtime/

---

## 7. 相關文件

- [Turn Cycle / Belief-Augmented ReAct manual](../../agent/docs/manuals/turn_cycle_belief_augmented_react.md)
- [Action Policy Thresholds](../../agent/docs/manuals/action_policy_thresholds.md)
- [Product Info Cutover Audit 2026-05-11](../../agent/docs/manuals/product_info_cutover_2026-05-11.md)
- [ADR-0008 — Product Info Architecture Canonical](ADR-0008-product-info-architecture-canonical.md)
- [runtime-architecture-comparison-2026-05-13-0125.md](../_audit/runtime-architecture-comparison-2026-05-13-0125.md) — 四方對打（dev / agent-port / agent_v2 / hermes-cs）
- `agent/quality/reports/quality_report_2026-05-11_2*.md` — B-fix 系列對打 raw report
