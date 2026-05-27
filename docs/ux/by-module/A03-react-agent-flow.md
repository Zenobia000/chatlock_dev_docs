---
doc_id: UX-MOD-A03
title: A03 ReAct Agent — LangGraph + tools
version: v1
status: draft
phase: I (MVP)
owner: UX
mapped_to: [A03]
parent_flow: docs/ux/user-flow-smart-lock-saas.md#flow-s1
wcag_level: AA
related_kb: [KB-07]
related_modules: [A02, A04, A05, A06, A07, A08]
last_updated: 2026-05-28
---

# A03 ReAct Agent — LangGraph + tools

> **30 秒摘要**：A03 是 chatbot 大腦，用 LangGraph 跑 ReAct loop（reason → act → observe）；可用 tools = `load_skill` / `update_user_info` / `transfer_to_human` / `invoke_convert_to_wo`（後者必經 human gate）。

## Sequence Diagram — ReAct loop 一輪

```mermaid
sequenceDiagram
    autonumber
    actor user as 消費者
    participant a03 as A03 ReAct
    participant llm as LLM
    participant tools as Tool Registry

    user ->> a03: merged turn (from A01)
    a03 ->> llm: reason (current state + tools list)
    llm -->> a03: action: load_skill("三聯-鎖舌卡死")
    a03 ->> tools: load_skill
    tools -->> a03: SOP content
    a03 ->> llm: observe (SOP + reason next)
    llm -->> a03: action: respond_to_user
    a03 ->> user: 回覆 + Quick Reply
    Note over a03: 若連 3 輪未收斂 → transfer_to_human
```

## State Machine — agent session

```mermaid
stateDiagram-v2
    [*] --> reasoning
    reasoning --> tool_invoking : 選擇 tool
    tool_invoking --> observing : tool 返回
    observing --> reasoning : 還需更多 step
    observing --> responding : 收斂可回覆
    responding --> waiting_user : 訊息送出
    waiting_user --> reasoning : 用戶回覆 / 新 turn
    reasoning --> handoff : 連 3 輪未收斂 / safety block
    handoff --> [*]
    responding --> [*]
```

## UI State Coverage

| Step | Happy | Empty | Loading | Error | Offline | annotation |
|:---|:---|:---|:---|:---|:---|:---|
| AI thinking | ✓ typing indicator | n/a | < 3s p95 | LLM timeout → fallback message | LINE banner | session: reasoning |
| tool invoke | ✓ tool 返回 | tool 無結果 → 改問 | < 1s | tool fail → 降級 / handoff | offline 無法呼叫 → handoff | tool_invoking → observing |
| 回覆送出 | ✓ Flex / text | n/a | < 500ms | render fail → 純文字 | LINE 暫存 | exit: waiting_user |

## a11y notes
- typing indicator 走 LINE 原生
- 回覆 Flex Message 朗讀順序：標題 → 內文 → button label
- Quick Reply ≥ 44×44 (LINE 原生)

## FR 反向指
| Step | FR | AC |
|:---|:---|:---|
| ReAct loop | FR-0028 | AC-01 load_skill / AC-02 update_user_info / AC-03 transfer_to_human |
| 連 3 輪 fallback | FR-0028 | AC-01 自動 handoff |

## 相關
- 主檔：[`../user-flow-smart-lock-saas.md#flow-s1`](../user-flow-smart-lock-saas.md)
- Source：[`../../_source/02-ai-chatbot-sync.md#a-m03-react-agent`](../../_source/02-ai-chatbot-sync.md)
