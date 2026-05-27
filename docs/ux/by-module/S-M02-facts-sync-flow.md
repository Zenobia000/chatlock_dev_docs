---
doc_id: UX-MOD-SM02
title: S-M02 Facts 主檔同步 — phone/address/device → ERP
version: v1
status: draft
phase: I (MVP)
owner: UX
mapped_to: [S-M02]
parent_flow: docs/ux/user-flow-smart-lock-saas.md
wcag_level: AA
related_modules: [A02, M01, M02]
last_updated: 2026-05-28
---

# S-M02 Facts 主檔同步

> **30 秒摘要**：phone / address / device facts 與 ERP customer / site / device 對齊；PII 處理 + SCD2（slowly changing dimension 第二型，保留歷史）；對接 ERP `users` / `user_facts` table。

## Sequence Diagram

```mermaid
sequenceDiagram
    autonumber
    participant a02 as A02 Brand/Facts
    participant sm02 as S-M02 Facts Sync
    participant erp as ERP customer/site/device
    participant pii as PII Vault

    a02 ->> sm02: facts (phone, address, device)
    sm02 ->> pii: tokenize PII (phone → token)
    pii -->> sm02: tokens
    sm02 ->> erp: upsert (LINE_user_id → customer_id mapping)
    alt 新 customer
        erp -->> sm02: customer_id (created)
    else 既有 customer
        erp -->> sm02: customer_id + SCD2 history append
    end
    sm02 ->> sm02: outbox emit (facts.synced)
```

## State Machine — facts entity

```mermaid
stateDiagram-v2
    [*] --> incoming
    incoming --> tokenized : PII vault 處理
    tokenized --> matched : 找到既有 customer
    tokenized --> new_customer : 找不到 → create
    matched --> scd2_appended : 屬性變更 → SCD2 historize
    matched --> idempotent_skip : 完全一樣 → skip
    new_customer --> [*]
    scd2_appended --> [*]
    idempotent_skip --> [*]
```

## UI State Coverage

| Step | Happy | Empty | Loading | Error | Offline | annotation |
|:---|:---|:---|:---|:---|:---|:---|
| PII tokenize | ✓ 200ms | n/a | < 200ms | vault down → fail-closed | n/a | incoming → tokenized |
| upsert ERP | ✓ idempotent | n/a | < 500ms | conflict → SCD2 / DLQ | n/a | matched / new_customer |
| outbox emit | ✓ async | n/a | n/a | DLQ + alert | n/a | scd2_appended |

## a11y notes（後台 admin 查 facts 歷史 / diff view UI — WCAG 2.2 AA 繼承自主檔）

- **純後台同步**，無客戶端 UI；後台 admin 查 facts 歷史走 WCAG 2.2 AA（diff view）
- **PII 顯示需 mask**（除 audited admin 外）；mask 不可單靠顏色 — 加 `*` 字元 + aria-label "masked"
- **Keyboard navigation (2.1.1)**：facts 歷史列表 / diff view / SCD2 版本切換全鍵盤可達；無 keyboard trap
- **Focus indicator (2.4.7)**：diff view 中當前選取段落 focus ring ≥ 2px / ≥ 3:1 contrast
- **Screen reader (4.1.2)**：SCD2 版本 metadata（valid_from / valid_to / actor）用 semantic HTML + ARIA roles；diff `<ins>` / `<del>` 可朗讀
- **Color contrast (1.4.3)**：diff highlight ≥ 4.5:1；不單靠紅綠（色盲 fallback：`+` / `-` prefix）

## FR 反向指
| Step | FR | AC |
|:---|:---|:---|
| PII tokenize | FR-0036 | AC-01 vault 前置 |
| SCD2 historize | FR-0036 | AC-01 變更保留歷史 / AC-02 idempotent skip |

## 相關
- 主檔：[`../user-flow-smart-lock-saas.md`](../user-flow-smart-lock-saas.md)
- Source：[`../../_source/02-ai-chatbot-sync.md#s-m02-facts主檔同步`](../../_source/02-ai-chatbot-sync.md)
