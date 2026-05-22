---
id: ADR-0019
title: V1.0 金流範圍
status: accepted
date: 2026-05-07
deciders: [PM, Tech Lead, QA Lead]
legacy_id: PM-Q7
supersedes: []
superseded_by: []
related:
  - "../0-principles/id-mapping-legacy.md §A.6 (PM Q → ADR)"
  - "_pending-split-pm-alignment-Q1-Q10.md (原始決策矩陣)"
---

# ADR-0019 — V1.0 金流範圍

## Status

**Accepted** (拍板於 2026-05-07，作為 PM Q1-Q10 90 分鐘對齊會議產物)

## Decision

**B 拆 V1.0a/V1.0b + 待 provider 選型**

## Context, Options, Consequences (從 PM 決策矩陣 §8 摘錄)

## 8. Q7 — V1.0 是否含金流？

### 業務脈絡

F-011 消費者付款 + F-014 退款回沖。V1.0 是否要整合金流 provider？影響整套 V1.0 上線範圍。

### 影響流程

- F-011 消費者付款（🔴）
- F-014 退款金流回沖（🟡）
- F-016 SLA 賠償（綁 Q5 = A）

### 候選方案


| 選項                           | 說明                      | 上線時間               | 第三方依賴            | 測試                         |
| ---------------------------- | ----------------------- | ------------------ | ---------------- | -------------------------- |
| **A. V1.0 不含金流**             | 工單完成 → 客戶現金 / 轉帳給技師（線下） | 不延                 | 0                | fake provider stub         |
| **B. V1.0 整合 provider X**    | 必須先選型 + 整合              | +30 dev-day        | provider sandbox | sandbox 測試 + VCR cassettes |
| **C. V1.0 上 fake，V1.5 補真整合** | 程式 hot-swap，V1.0 跑 fake | 不延（fake 1 dev-day） | 0                | fake provider stub         |


### 推薦預設

**A — V1.0 不含金流**。理由：

1. 客戶 100% 是傳統電子鎖維修商，現有金流（現金 / LINE Pay）已運作
2. V1.0 主價值是「派工 + 知識庫 + AI 客服」，非「金流」
3. 金流整合需要 PCI compliance 審查 → 至少 60 dev-day

### 反向選項後果

- B：上線延 1.5 個月；測試需 sandbox 帳號（信用卡 test number 等）
- C：與 A 等價，但 fake provider 介面需要先定（綁未來真整合的 provider 形狀）

### PM 決策

```
[ ] A — V1.0 不含金流（線下）
[ ] B — V1.0 整合 provider _____（請指定）
[ ] C — V1.0 fake，V1.5 補真整合

理由：__________________________________
拍板日期：______________
拍板人：______________

⚠ 商業交叉確認：是否影響 SaaS 訂閱費收取？訂閱費走哪個金流？
```

### 拍板後續更新

- `docs/01-define/E2--statement-of-work.md`：V1.0 範圍
- `api/providers/payment.py`（若 C）：fake interface
- `tests/fixtures/`：若 C，加 `fake_payment.py`
- `docs/_flows-bdd-test/v-model-right/E7x--test-plan-and-readiness.md` §4.4：刪掉 V2.0 阻塞項

---
