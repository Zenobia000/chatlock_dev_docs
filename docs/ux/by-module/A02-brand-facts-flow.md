---
doc_id: UX-MOD-A02
title: A02 品牌型號 Profile — Quick Reply + facts
version: v1
status: draft
phase: I (MVP)
owner: UX
mapped_to: [A02]
parent_flow: docs/ux/user-flow-smart-lock-saas.md#flow-s1
wcag_level: AA
related_kb: [KB-07]
related_modules: [A01, A03, A06]
last_updated: 2026-05-28
---

# A02 品牌型號 Profile — Quick Reply + facts

> **30 秒摘要**：當 facts 中 brand 或 model 缺失時主動問；用 LINE Quick Reply 提供常見品牌列表，「其他」進 free text；收齊後寫 facts_db。

## Sequence Diagram

```mermaid
sequenceDiagram
    autonumber
    actor user as 消費者
    participant a03 as A03 ReAct
    participant a02 as A02 Brand/Facts
    participant db as facts_db

    a03 ->> a02: extract from turn
    a02 -->> a03: missing brand
    a03 ->> user: Quick Reply [三聯 / 美樂 / 其他]
    user ->> a03: 「三聯」
    a03 ->> a02: update brand=三聯
    a02 ->> db: write facts
    a02 -->> a03: missing model
    a03 ->> user: Quick Reply 三聯 models
    user ->> a03: model X
    a03 ->> a02: update model=X
    a02 ->> db: write facts
    a02 -->> a03: facts complete
```

## State Machine — facts collection

```mermaid
stateDiagram-v2
    [*] --> empty
    empty --> brand_pending : 抽取出無 brand
    brand_pending --> brand_known : 客戶選擇 / 輸入
    brand_known --> model_pending : 無 model
    model_pending --> model_known : 客戶選擇 / 輸入
    model_known --> symptom_pending : 無症狀描述
    symptom_pending --> complete : 客戶描述
    complete --> [*]
    brand_pending --> brand_other : 「其他」free text
    brand_other --> brand_known
```

## UI State Coverage

| Step | Happy | Empty | Loading | Error | Offline | annotation |
|:---|:---|:---|:---|:---|:---|:---|
| Quick Reply 品牌列表 | ✓ 顯示常見 4-6 個 + 「其他」 | 列表空 → 純 free text | typing indicator | Quick Reply render fail → fallback 純文字 | LINE cached | facts: empty → brand_pending |
| 客戶選「其他」 | ✓ free text 輸入 | n/a | n/a | text 含特殊字 → 清理 | 暫存 | brand_other → brand_known |
| 寫 facts_db | ✓ 200 OK | n/a | < 100ms | DB down → DLQ | 後台重送 | facts entry=complete |

## a11y notes（後台 Admin 端 + LINE 端混合 — WCAG 2.2 AA 繼承自主檔）

- **Quick Reply label 清楚**：「品牌：三聯」非「三聯」給 screen reader（4.1.2 Name/Role/Value）
- **WCAG 2.5.5 Target size**：Quick Reply button ≥ 44×44（LINE 原生符合）；後台 admin 品牌維護按鈕 ≥ 44×44
- **Keyboard navigation (2.1.1)**：後台 admin facts 編輯介面（PII 後台）全鍵盤可達，無 keyboard trap
- **Focus indicator (2.4.7)**：後台 admin facts 編輯欄位 focus ring ≥ 2px / ≥ 3:1 contrast
- **Color contrast (1.4.3)**：後台 admin 衝突警告（brand mismatch）≥ 4.5:1；不單靠紅色 — 加 icon + 文字「衝突」
- **3.3.7 Redundant entry**：客戶已於對話中提供品牌 / 型號 → 後台 admin 不要求重輸；自動帶入

## FR 反向指
| Step | FR | AC |
|:---|:---|:---|
| brand quick reply | FR-0027 | AC-01 常見品牌列表 / AC-02 「其他」free text |

## 相關
- 主檔：[`../user-flow-smart-lock-saas.md#flow-s1`](../user-flow-smart-lock-saas.md)
- Source：[`../../_source/02-ai-chatbot-sync.md#a-m02-品牌型號profile`](../../_source/02-ai-chatbot-sync.md)
