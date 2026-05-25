---
id: ADR-0021
title: Scope Change 同意入口
status: accepted
date: 2026-05-07
deciders: [PM, Tech Lead, QA Lead]
legacy_id: PM-Q9
supersedes: []
superseded_by: []
related:
  - "../0-principles/id-mapping-legacy.md §A.6 (PM Q → ADR)"
  - "_pending-split-pm-alignment-Q1-Q10.md (原始決策矩陣)"
---

# ADR-0021 — Scope Change 同意入口

## Status

**Accepted** (拍板於 2026-05-07，作為 PM Q1-Q10 90 分鐘對齊會議產物)

## Decision

**B 消費者 Web 二次確認**

## Context, Options, Consequences (從 PM 決策矩陣 §10 摘錄)

## 10. Q9 — Scope Change 同意入口？

### 業務脈絡

F-008 技師到場後發現問題比預期大（換鎖 → 加上換門框），需消費者同意加價。同意入口在 LINE 還是 Web？

### 影響流程

- F-008 Scope Change

### 候選方案


| 選項                      | 說明                             | UX   | 安全              |
| ----------------------- | ------------------------------ | ---- | --------------- |
| **A. LINE quick reply** | Bot 推 Flex Message + 同意 / 拒絕按鈕 | 客戶熟悉 | 用戶需登入 LINE—自動驗證 |
| **B. Web 匿名 token**     | SMS / LINE 給短連結 → Web 簽名       | 多步驟  | 需 token 機制      |
| **C. 純 LINE 對話**（無按鈕）   | 技師寫文字訊息 + 客戶回「同意」              | 最簡   | 易爭議（同意算數嗎？）     |


### 推薦預設

**A — LINE quick reply**。理由：

1. 既有 LINE Flex 機制可重用（F-018 已實作 sendChatMessage）
2. LINE 內建用戶認證（`source.userId`）
3. 法律有效性 ≥ Web 簽名（LINE Talk 紀錄可舉證）

### 反向選項後果

- B：必須建 Web 匿名 token API（同 Q3 = B 的工作量）
- C：法律風險—「同意」字眼不夠正式，爭議時不易舉證

### PM 決策

```
[ ] A — LINE quick reply
[ ] B — Web 匿名 token
[ ] C — 純 LINE 對話

理由：__________________________________
拍板日期：______________
拍板人：______________

⚠ 法務交叉確認：LINE quick reply 點擊是否視同電子簽章？
```

### 拍板後續更新

- `agent/skills/data/_common/`：scope-change-consent skill
- `agent/core/line_bot.py`：若 A，加 Flex template
- `docs/_flows-bdd-test/v-model-left/E5x--workflow-work-order.md` F-008

---
