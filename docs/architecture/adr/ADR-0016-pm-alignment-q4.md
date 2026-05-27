---
id: ADR-0016
title: 月結爭議 SLA 計時
status: accepted
date: 2026-05-07
deciders: [PM, Tech Lead, QA Lead]
legacy_id: PM-Q4
supersedes: []
superseded_by: []
related:
  - "../0-principles/id-mapping-legacy.md §A.6 (PM Q → ADR)"
  - "_pending-split-pm-alignment-Q1-Q10.md (原始決策矩陣)"
---

> 
> **🔄 Migration Status (2026-05-28)**: `HISTORICAL`
> **Reviewed against**: 2026-05-20 final spec (xlsx)
> **Reviewed on**: 2026-05-28
> **Per ADR-0100 §1 classification** (.claude/context/devteam/meetings/2026-05-27-1130-final-spec-migration-strategy/MoM.md)


# ADR-0016 — 月結爭議 SLA 計時

## Status

**Accepted** (拍板於 2026-05-07，作為 PM Q1-Q10 90 分鐘對齊會議產物)

## Decision

**C 工作日 (使用 holidays 套件)**

## Context, Options, Consequences (從 PM 決策矩陣 §5 摘錄)

## 5. Q4 — 月結爭議 SLA 7 日是工作日嗎？

### 業務脈絡

F-013 月結對帳爭議 SLA 7 日。是 7 個工作日（Mon-Fri）還是 7 個自然日？影響跨週末 / 連假計時與賠償。

### 影響流程

- F-013 對帳爭議 SLA
- F-016 SLA 紅色警報（部分相關）

### 候選方案


| 選項                  | 說明               | 客戶體驗              | 計時複雜度                |
| ------------------- | ---------------- | ----------------- | -------------------- |
| **A. 工作日**（Mon-Fri） | 跨週末跳過；遇連假 ?（需另定） | 客戶有預期；技師壓力低       | 高—need calendar lib  |
| **B. 自然日**（24h × 7） | 不分平假日            | 簡單；可能違反勞基（週末加班壓力） | 低—單純 timedelta       |
| **C. 工作日 + 國定假日跳過** | A 加台灣 calendar   | 最人性               | 最高—需維護 calendar JSON |


### 推薦預設

**B — 自然日**。理由：

1. SLA 起算後通知都自動，技師壓力來源是工單分派（已有 F-016 ack 機制）
2. 計時邏輯簡單—`now - submitted_at < timedelta(days=7)`
3. V2.5 可改 A，現階段不寫 calendar lib

### 反向選項後果

- A：需引入 `holidays` 套件 + 維護台灣國定假日 + 跨週 fixture 設計
- C：A 的成本 + 每年 12 月更新 calendar

### PM 決策

```
[ ] A — 工作日（Mon-Fri）
[ ] B — 自然日（24h × 7）
[ ] C — 工作日 + 國定假日跳過

理由：__________________________________
拍板日期：______________
拍板人：______________

⚠ 法務交叉確認：勞基法對「客戶投訴回應 SLA」是否有強制要求？
```

### 拍板後續更新

- `api/services/dispute_service.py`：SLA 計時邏輯
- `docs/_flows-bdd-test/v-model-left/E5x--workflow-admin-governance.md`：SLA 表格
- `tests/factories/`：若 A/C，加 `WeekdayClock` fixture

---
