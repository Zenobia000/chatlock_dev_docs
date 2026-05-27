---
doc_id: UX-MOD-A05
title: A05 安全驗證 — safety + output validator + 越權邊界
version: v1
status: draft
phase: I (MVP — P0 critical)
owner: UX
mapped_to: [A05]
parent_flow: docs/ux/user-flow-smart-lock-saas.md#flow-s1
wcag_level: AA
related_kb: [KB-07]
related_modules: [A03, A06, A07, S-M04]
last_updated: 2026-05-28
---

# A05 安全驗證 — safety + output validator + 越權邊界

> **30 秒摘要**：A05 是 chatbot 的 guardrail — 偵測危險字、內部話術、AI 越權嘗試（如承諾 final quote / 折扣 / 免費保固 / 自行建單）；失敗就改口給範圍價 或 觸發 transfer_to_human。**P0 critical**：BR-AI-越權邊界全靠這層。

## Sequence Diagram

```mermaid
sequenceDiagram
    autonumber
    participant a03 as A03 ReAct
    participant a05 as A05 Safety
    participant detector as Pattern Detector
    participant rewriter as Output Rewriter
    participant audit as Audit Log
    actor user as 消費者

    a03 ->> a05: validate(response_draft)
    a05 ->> detector: scan (final_quote / 折扣 / 免費保固 / 我幫您開工單)
    alt 命中越權 pattern
        detector -->> a05: violation
        a05 ->> rewriter: rewrite (用範圍價 / 引導客戶觸發)
        rewriter -->> a05: cleaned response
        a05 ->> audit: log violation_attempt
        a05 -->> a03: cleaned response
    else 安全通過
        a05 -->> a03: pass-through
    end
    a03 ->> user: 送出回覆
```

## State Machine — safety check session

```mermaid
stateDiagram-v2
    [*] --> scanning
    scanning --> safe : 無 pattern 命中
    scanning --> violation_detected : 命中越權 pattern
    violation_detected --> rewritten : output rewriter 改口
    rewritten --> audit_logged
    audit_logged --> [*]
    safe --> [*]
    scanning --> hard_block : 命中 hard block (危險指令)
    hard_block --> handoff_triggered : 強制 transfer_to_human
    handoff_triggered --> [*]
```

## 越權 pattern decision matrix

| Pattern 範例 | 觸發行為 | annotation |
|:------------|:---------|:-----------|
| 「總額 NT$3500」(具體金額) | rewrite → 「範圍 NT$2000-5000，最終以客服報價為準」 | violation_detected → rewritten |
| 「我幫您開工單」 | rewrite → 「您可以點下方按鈕觸發派工」 | violation_detected → rewritten |
| 「免費保固」 | rewrite → 「保固以您購買時的條款為準」 | violation_detected → rewritten |
| 「打 80 折」 | rewrite → block + 引導客服 | violation_detected → handoff_triggered |
| 危險字 / 暴力 / hate speech | hard block + handoff | hard_block |

## UI State Coverage

| Step | Happy | Empty | Loading | Error | Offline | annotation |
|:---|:---|:---|:---|:---|:---|:---|
| safety scan | ✓ pass-through | n/a | < 50ms | detector down → fail-closed (block) | n/a | scanning → safe/violation |
| rewrite | ✓ 改口輸出 | n/a | < 200ms | rewriter fail → fallback handoff | n/a | violation_detected → rewritten |
| 客戶端看到 | ✓ 看不到原始越權內容 | n/a | n/a | n/a | n/a | n/a |
| audit log | ✓ violation_attempt 記錄 | n/a | async | log fail → DLQ | n/a | audit_logged |

## a11y notes
- 客戶端只看到改寫後的訊息（不知道有 guardrail），UX 透明處理
- 改寫後訊息語意完整、可被 screen reader 順讀

## FR 反向指
| Step | FR | AC |
|:---|:---|:---|
| 越權 pattern 偵測 | FR-TBD-A05-001 | AC-01 final quote 攔截 / AC-02 自行建單 攔截 / AC-03 免費保固 攔截 |
| 越權嘗試 audit | FR-TBD-A05-002 | AC-01 log + alert |
| hard block 觸發 handoff | FR-TBD-A05-003 | AC-01 危險字命中 → 強制 transfer_to_human |

## 相關
- 主檔 Flow S1：[`../user-flow-smart-lock-saas.md#flow-s1`](../user-flow-smart-lock-saas.md)
- S-M04 越權邊界第二道：[`./S-M04-convert-to-wo-flow.md`](./S-M04-convert-to-wo-flow.md)
- Source：[`../../_source/02-ai-chatbot-sync.md#a-m05-安全驗證`](../../_source/02-ai-chatbot-sync.md)
