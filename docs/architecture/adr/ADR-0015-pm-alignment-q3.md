---
id: ADR-0015
title: 消費者端追蹤入口
status: accepted
date: 2026-05-07
deciders: [PM, Tech Lead, QA Lead]
legacy_id: PM-Q3
supersedes: []
superseded_by: []
related:
  - "../0-principles/id-mapping-legacy.md §A.6 (PM Q → ADR)"
  - "_pending-split-pm-alignment-Q1-Q10.md (原始決策矩陣)"
---

# ADR-0015 — 消費者端追蹤入口

## Status

**Accepted** (拍板於 2026-05-07，作為 PM Q1-Q10 90 分鐘對齊會議產物)

## Decision

**C HMAC token web link + LINE**

## Context, Options, Consequences (從 PM 決策矩陣 §4 摘錄)

## 4. Q3 — 消費者端追蹤入口？

### 業務脈絡

F-022 消費者端工單追蹤（已派工後查進度）需要入口。LINE Bot 還是 Web（短連結 + 匿名 token）？

### 影響流程

- F-022 消費者端工單追蹤
- F-008 Scope Change 同意（部分相關，但 Q9 才主要決策）
- F-010 改約 / 延遲通知

### 候選方案


| 選項               | 說明                       | UX         | 開發成本                       | 測試成本               |
| ---------------- | ------------------------ | ---------- | -------------------------- | ------------------ |
| **A. LINE only** | 消費者透過原 LINE 對話查進度        | 與報修體驗一致    | 0 新頁；agent 加查詢 intent      | LINESimulator 即可   |
| **B. Web only**  | SMS/email 給短連結 → Web 匿名查 | 跳出 LINE 流程 | 1 新頁 + 1 公開 API + token 機制 | Playwright 公開 spec |
| **C. 兩者並存**      | LINE 主、Web 備（VIP 客戶）     | 最完整        | 兩倍成本                       | 兩倍測試               |


### 推薦預設

**A — LINE only**。理由：

1. V1.0 客戶 100% LINE 用戶（[[01-define/E2--statement-of-work]] §2）
2. Web 匿名 token API 是新設計，需要 ADR + 安全 review
3. 跳過 Web E2E → 解鎖 F-022 從 🔴 變 🟢

### 反向選項後果

- B：必須先做 `getWorkOrderPublicStatus` API（[[_flows-bdd-test/v-model-right/E7x--test-plan-and-readiness]] §4.3）+ 匿名 token + Playwright 公開測試 → +5 dev-day
- C：A + B 工作量

### PM 決策

```
[ ] A — LINE only
[ ] B — Web only
[ ] C — 兩者並存

理由：__________________________________
拍板日期：______________
拍板人：______________
```

### 拍板後續更新

- `agent/skills/data/_common/`：若 A，新增 `customer-status-query` skill
- `docs/02-design/specs/openapi.yaml`：若 B/C，加 `getWorkOrderPublicStatus` operationId
- `web/src/app/track/[token]/page.tsx`：若 B/C，新建公開頁
- `tests/fixtures/line_simulator.py`：若 A，加 query intent fixture

---
