---
name: devteam-roundtable
description: 多龍蝦圓桌會議（Lane C）。業主用自然語言發起「對 X 開會」「找 Y 跟 Z 討論」，主 Claude 變 facilitator，dispatch N 個 subagent 在背景跑完整場會議。預設 background mode — 業主不看 transcript，只看大廠 PM 風格 MoM（Executive Summary / Decisions / Action Items / Open Questions）。Drill-down 機制讓業主想看詳細對話時隨叫隨到。為未來 Level 3（Discord multi-instance）遷移鋪路。
---

# DevTeam Roundtable: 虛擬公司圓桌會議（MoM-First）

## Overview

當業主用自然語言觸發「對 X 開個會」「找 PM 跟 UX 討論一下」「開個圓桌」，
**主 Claude 變 facilitator**，dispatch 多個 subagent 在背景跑會議。

**核心設計（與其他 Lane 最大差異）**：
- **業主預設不看 transcript** — 龍蝦對話過於技術，符號太多，上位者沒空細讀
- **業主只看 MoM**（Minutes of Meeting，大廠 PM 風格）— Executive Summary / Decisions / Action Items / Open Questions
- **業主只在 Open Questions 動** — value 判斷、跨領域 trade-off、組織政策
- **Drill-down 隨叫隨到** — 業主想看完整對話時，一句「給我看」就 render

**宣告**：「正在使用 devteam-roundtable skill — 開圓桌會議（background mode）。」

### 跟既有 review / forum 的差異

| Skill | 用途 | 業主看到的 | 業主動作 |
|:------|:-----|:----------|:--------|
| `devteam-review`（Lane A） | Gate critique | Persona 各自寫 markdown report | 看完報告裁決 |
| `devteam-forum`（Lane B） | 衝突收斂辯論 | Proposer / critics 結構化 3 round | 看 final report 裁決 |
| **`devteam-roundtable`（Lane C）** | **探索 + 開放討論** | **MoM 一頁，3 個區塊** | **只回 Open Questions** |

---

## Presence Mode（預設 vs Opt-in）

| Mode | 觸發 | 業主體驗 |
|:-----|:-----|:--------|
| **background**（**預設**） | 業主說「開會」「討論」自然語言 | 龍蝦背景跑 → 結束後 ping「MoM 出爐」→ 業主讀 1 分鐘 → 回 Open Questions |
| foreground（opt-in） | 業主說「我想看他們怎麼討論」「在現場看」「show me the conversation」 | 渲染 transcript 給業主即時看（舊版行為） |

**預設 background 是設計核心**。foreground 是 escape hatch（業主想學習 / debug / 好奇）。

---

## Phase 1: 會議啟動

### 1a. 解析議題與與會者

主 Claude 從業主訊息抽取：

| 欄位 | 來源 |
|:-----|:-----|
| `topic` | 業主訊息核心議題（一句話） |
| `attendees` | 業主明指 → 用業主指定；未指 → 依 topic keyword 推斷 |
| `presence_mode` | 預設 background；偵測「我想看 / 在現場 / show me」→ foreground |
| `context_refs` | 相關 frozen docs（PRD 草案、ADR、active session 文件） |

**Attendees 推斷規則**（業主沒明指時）：

| Topic keyword | 預設與會者 |
|:--------------|:-----------|
| KPI / 成功指標 / scope | pm, ux, sa |
| user flow / a11y / 互動 | ux, pm, ui |
| API / contract / breaking | sd, ux, qa |
| schema / migration / PII | dba, sd, architect |
| NFR / SLO / capacity | architect, sre, sd |
| testing / exit criteria | qa, sd, devops |
| release / rollback / runbook | devops, sre, qa |
| 法規 / compliance / retention | ba, dba, architect |

預設與會 **2-4 人**（含主 Claude 自己當 facilitator）。

### 1b. 給業主的「會議開始」訊息（**極簡**）

不是 menu，不渲染 attendees 列表細節。一句話：

> 「OK，我安排 PM、UX、Architect 三隻龍蝦討論『請假系統 KPI』，
> 預計 2 round（約 5 分鐘）。完成後給你 MoM。
>
> 不對勁告訴我，不然就開始了。」

5 秒（或業主下一句話）無 override 就開會。

### 1c. 建立 meeting room

寫 `.claude/context/devteam/meetings/<YYYY-MM-DD-HHmm>-<topic-slug>/`：

| 檔案 | 用途 | 業主預設看？ |
|:-----|:-----|:------------|
| `MoM.md` | 大廠 PM 風格會議紀錄 | ✅ **是**（主產出） |
| `notes.yaml` | 結構化 metadata + outcomes | ❌ 否（agent / Discord migration 用） |
| `transcript.md` | 完整對話流 | ❌ 否（drill-down 才看） |
| `stances/<role>.md` | 各與會者立場詳細 | ❌ 否（drill-down 才看） |
| `round-N/<role>.md` | 每 round 原始發言 | ❌ 否（agent 中轉用） |

`MoM.md` 採用 `devteam_knowledge_base/templates/mom.md` 模板。

---

## Phase 2: Round-based 對話（**業主預設不看**）

> background mode 下，整個 Phase 2 對業主不可見。
> 主 Claude 顯示一個 progress indicator：「龍蝦會議中 ⏳ Round 1...」即可。

### 2a. Round 1 — 並行 dispatch 初始發言

對每位龍蝦並行 dispatch（用 Task tool，subagent_type 對應 driver skill 或 persona agent）：

**Dispatch prompt 模板**（每位龍蝦）：

```
你是 {role} 龍蝦，現在出席一場關於「{topic}」的圓桌會議。

與會者：{attendees_list}
業主指示：{user_quote}
背景文件：{context_refs}

你的任務：用聊天室發言的口吻寫 **150 字以內**，包含：
1. 你的初始立場（一句話）
2. 理由（2-3 點）
3. 對其他與會者的 @mention 提問（1-2 個）

格式：
[時間 HH:MM]
立場：...
理由:
- ...
@{role} {問題}

額外要求（這是 MoM-first 模式新增）：
- 你的發言會被 facilitator 提煉成 MoM 條目，不會直接給業主看
- 因此**不要客套、不要鋪陳**，直接給立場與理由
- 出現 value 判斷或 trade-off 時明文標 [VALUE_DECISION_NEEDED] 註記，方便 facilitator 抽出來給業主
```

每位龍蝦寫到 `round-N/<role>.md`。

### 2b. Facilitator 內部整合（**不渲染給業主**）

主 Claude 讀所有 `round-N/*.md`，內部記錄但不給業主看。
**只在以下情況打擾業主**：
- 偵測到 `[VALUE_DECISION_NEEDED]` 標記
- 偵測到無法收斂的 trade-off
- 偵測到組織政策需求（法務 / HR / 合規）

打擾的形式是**極簡通知**（不是 transcript）：

> 「龍蝦們在討論 X 時撞到一個 value 叉路 — 要繼續還是先聊？
> （我可以先擱著，他們繼續討論其他點，最後 MoM 一起問你。）」

業主回應後 facilitator 注入下一輪。

### 2c. Round 2 — 順序 dispatch 響應

Round 2 不能完全並行（龍蝦要看到彼此 round 1 + 業主插話如有）。

**順序 dispatch**，每位龍蝦的 prompt 加入：

```
Round 1 完整對話：
{round-1 transcript}

業主立場（如有）：
{user_interjection}

其他龍蝦 Round 2 已發言（如有）：
{prior_round_2_speakers}

任務：響應、修正、反駁、撤回，或建立在他人觀點之上。
**Round 2 是收斂輪 — 如果你的立場已被前面的人完整講過，
明文說「我同意 @X 的論點，無補充」，不要重複。**
```

### 2d. 收斂判定

| 收斂訊號 | 判斷 |
|:---------|:-----|
| 無新議題 | Round 2 三位龍蝦都沒提出 round 1 沒有的論點 |
| 立場趨同 | 至少 2/3 龍蝦明文同意主導方案 |
| 業主立場明確（如有 interjection） | 業主已表態傾向某選項 |

**滿足 ≥ 2 個訊號 → 進 Phase 3 寫 MoM**。
否則 → Round 3（最後一輪，prompt 加「這是最後一輪，請給最終立場」）。

---

## Phase 3: 產出 MoM（**給業主看的版本**）

主 Claude 把整場會議提煉成 `MoM.md`（套用 `templates/mom.md`），結構：

```markdown
# MoM: 請假系統 KPI 設定

**日期**：2026-05-18 11:30 ~ 11:48（18 分鐘）
**與會**：PM 龍蝦、UX 龍蝦、Architect 龍蝦
**狀態**：✅ Converged

## 📋 Executive Summary
討論請假系統 KPI 設定，敲定...

## ✅ Decisions Made
| # | 決議 | Confidence | 可逆性 | 影響範圍 |
| D1 | ... | 高 | 可逆 | PRD §2.3 |

## 🎯 Action Items
| # | Action | Owner | Priority | Due | Status |
| A1 | 更新 PRD §2.3 | devteam-pm | P0 | tomorrow | 🟡 |

## ❓ Open Questions（需要業主回應）
| # | 問題 | 為什麼問業主 | 提案選項 | 建議 |
| Q1 | ... | Value 判斷 | A/B/C | B |

## ⚠️ Risks Identified
| R1 | ... |

## 🔗 Cross References
- PRD: docs/prd/leave-mvp.md §2.3
- ADR: 即將產出 ADR-005

## 📌 Next Steps
1. A1 / A2 本週完成
2. 業主回 Q1 後排第二場 roundtable

## 🔍 Drill-down (optional)
- 完整對話：transcript.md
- 各立場詳細：stances/
- Metadata: notes.yaml
```

---

## Phase 4: 業主介入（**只在 Open Questions**）

主 Claude 給業主**極簡通知**：

> 「MoM 出爐：`meetings/.../MoM.md`
>
> 你只要回 §Open Questions 兩題：
> - Q1: 假別 catalog 是否支援 vendor 自訂？建議 B（折衷）
> - Q2: 主管 escalation 對象？建議 A（主管的主管）
>
> 一句話就行（"Q1 B / Q2 A" 或 "都照建議走"）。
> 想看完整對話再說，我可以 render。」

業主回應：

| 業主回應 | 主 Claude 行動 |
|:--------|:--------------|
| 「都照建議」/「Q1 B Q2 A」 | 寫進 MoM `decision_log`，dispatch action items |
| 「Q1 改 C，Q2 A」 | 業主立場注入，可能觸發 round 3 或直接寫進 decision |
| 「給我看完整對話」 | 切 foreground mode → render `transcript.md` |
| 「先擱著」 | MoM status = pending_owner_decision，會議掛起 |
| 「Q1 我要再開會討論」 | 排第二場 roundtable，主議題改 Q1 |

---

## Phase 5: 失敗模式與降級

| 失敗 | 降級 |
|:-----|:-----|
| 某龍蝦 dispatch fail | 標該 round 該龍蝦 absent，繼續會議 |
| 龍蝦寫超過 150 字 / 寫成 report | facilitator 摘要成聊天室格式注入內部紀錄 |
| Round 3 仍未收斂 | MoM `status = escalated`，列衝突點塞進 Open Questions 給業主 |
| 業主長時間（>5 min）無回應 Open Questions | MoM 保留 pending，不催業主，下次 `/devteam-status` 提醒 |

---

## Drill-down 機制（業主好奇時）

業主隨時可說（自然語言）：
- 「給我看 PM 龍蝦對 KPI #2 的完整論證」
- 「show me the conversation」
- 「他們吵成什麼樣？」
- 「Architect 龍蝦的立場為什麼是這樣？」

主 Claude 偵測到 drill-down 意圖 → render 對應檔案：
- 完整對話 → `transcript.md`（從 `round-N/*.md` 渲染）
- 單一立場 → `stances/<role>.md`
- 特定議題的爭論 → 從 transcript filter 出該議題段落

**Drill-down 不重新跑會議**，只是把已有 raw data 渲染給業主看。

---

## 跟既有 KB 的整合

- **不取代 Lane A**（freeze gate critique）
- **不取代 Lane B**（Forum-Lite 衝突收斂）
- **Lane C 是早期探索 / brainstorm**，產出的 decision 若涉及 ADR/DR，業主在 Open Questions 確認後，主 Claude dispatch `devteam-arch` / 對應 driver skill 寫正式產物

**Roundtable 自己不寫 ADR**，只寫 MoM。

---

## Level 3 遷移注意事項

本 skill 為 Discord 環境刻意設計：

| Level 1（當前） | Level 3（Discord） |
|:----------------|:-------------------|
| `meetings/<id>/` 目錄 | Discord channel `#<id>` |
| `round-N/<role>.md` | Channel message stream |
| `MoM.md` | Channel pinned message + GitHub Issue mirror |
| `transcript.md` | Channel scrollback（drill-down 用） |
| Background mode | Bot 們在 channel 自由對話，業主不需在 channel |
| Open Questions ping | Discord DM / mention 業主 |
| Drill-down | 業主到 channel 看 message history |

`notes.yaml.discord_migration` 已預埋對應 channel 與 message format。

---

## 不在本 skill 範圍

- 不寫 ADR/DR（業主裁決後走 driver skill）
- 不觸發 freeze gate
- 不模擬「龍蝦自主發起會議」（需 Level 2 hook/cron）
- 不支援超過 3 round（強制升級業主 + MoM status=escalated）
- 不取代 Lane A / Lane B

---

## Token 預算參考

| 階段 | 動作 | 估算 |
|:-----|:-----|:-----|
| Phase 1 | parse + attendees 推斷 | ~1k |
| Round 1 | 3 龍蝦並行短發言 | ~6k |
| 內部整合 + value decision 偵測 | ~2k |
| Round 2 | 3 龍蝦順序發言（含 round 1 context） | ~9k |
| 收斂判定 | ~1k |
| Phase 3 MoM 產出 | ~4k |
| **總計** | | **~23k** |

Round 3 啟動再 +8k。
Drill-down 不重跑會議，每次 render ~1-2k。

---

## 範例

完整跑通的 mock 見 `example-transcript.md`：包含
- 業主視角（會議開始通知 + MoM 通知 + 回應）
- Drill-down 範例
- Appendix: 真實 transcript（業主預設看不到的部分）
