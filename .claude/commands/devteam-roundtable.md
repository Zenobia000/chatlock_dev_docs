---
description: 多龍蝦圓桌會議。對指定議題開會，主 Claude 變 facilitator dispatch 多個 subagent 模擬聊天室對話。對話形式而非 critique pipeline，業主可中途自然語言插話。Meeting notes 雙寫 yaml + markdown，為 Level 3 (Discord) 遷移鋪路。
---

# DevTeam Roundtable

虛擬公司圓桌會議。業主用自然語言發起，主 Claude 主持，多隻龍蝦輪流發言。

## 使用方式

### 自然語言（推薦）

業主直接講就行，**不必背指令**：

```
對請假系統的 KPI 開個會
找 PM 跟 UX 討論一下假別 catalog
我想聽 Architect 跟 SRE 對 retention 策略的看法
開個圓桌討論 X
```

主 Claude 偵測到「開會 / 討論 / 找 X 跟 Y / 圓桌」這類關鍵字會自動 load 本 skill。

### Slash command（fallback）

```
/devteam-roundtable <topic>
/devteam-roundtable KPI 設定 --attendees=pm,ux,architect
/devteam-roundtable 假別 catalog --attendees=pm,ba --rounds=2
```

## 參數

- `<topic>`（必填）：議題一句話。可以是「請假系統 KPI」也可以是 yes/no 問題「要不要做代理人簽核」
- `--attendees=A,B,C`：override 自動推斷。**必須是 12 既有 role 之一**（pm/po/ba/sa/ux/ui/arch/sd/dba/qa/devops/sre）
- `--rounds=2|3`：上限 3，預設 2（收斂訊號滿足就停）
- `--context=<doc-path>`：明指要讀的背景文件（預設自動從 active session state 抓）

## 操作流程

詳見 `.claude/skills/devteam-roundtable/SKILL.md`。簡述：

```
Phase 1: 解析議題 + 推斷與會者 + 建 meeting room
Phase 2: Round 1 並行 → 業主插話 → Round 2 順序 → 收斂判定
Phase 3: 業主介入點（value 叉路強制問）
Phase 4: 寫 notes.yaml + notes.md + 提案 outcome
Phase 5: 業主自然語言 confirm → 走對應 driver skill 寫 ADR/PRD
```

## 跟 review / forum 的差異

| Skill | 用途 | 業主看到的 | 業主投入時間 |
|:------|:-----|:----------|:------------|
| `/devteam-review` | Gate 前 critique | Persona 各自寫 markdown report | 看 report 5-10 分鐘 |
| `/devteam-forum` | 衝突收斂辯論 | Proposer / critics 結構化 3 round | 看 final report 5 分鐘 |
| `/devteam-roundtable` | **探索 / brainstorm** | **MoM 1 頁**（不看 transcript） | **< 1 分鐘 / 場** |

Roundtable 適用「還沒到 critique 階段、需要先聊聊」。

## 核心設計（MoM-first）

- **業主預設 background mode** — 龍蝦背景跑完整場會議，業主中途不看任何東西
- **產出大廠 PM 風格 MoM**（Executive Summary / Decisions / Action Items / Open Questions / Risks / Cross-refs）
- **業主只在 Open Questions 動** — value 判斷、組織政策、無法收斂的 trade-off
- **Drill-down 隨叫隨到** — 業主想看 transcript / 單一立場 / 特定論證，自然語言一句話就 render
- **Foreground mode 為 opt-in** — 業主說「我想看他們怎麼討論」「show me the conversation」才切回舊版透明對話流

當前是 **Level 1 模擬**：單一 Claude 順序 dispatch subagent，不是真 multi-instance。
MoM + yaml + transcript 多寫格式為 Level 3（Discord）遷移鋪路。

## 不在範圍

- 不寫 ADR/DR（roundtable 只寫 meeting notes；裁決後走 driver skill）
- 不觸發 freeze gate
- 不模擬「龍蝦自主發起會議」（需 Level 2 hook/cron）
- 不取代 Lane A / Lane B

## Token 預算

預設 2 round ~23k token。Round 3 啟動再 +8k。

## 範例

完整 mock transcript 見 `.claude/skills/devteam-roundtable/example-transcript.md`。
