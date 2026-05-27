---
doc_id: UX-MOD-A06
title: A06 ProblemCard 自動建卡 — chatbot 對話流
version: v1
status: draft
phase: I (MVP)
owner: UX
mapped_to: [A06]
parent_flow: docs/ux/user-flow-smart-lock-saas.md#flow-s1
wcag_level: AA
related_kb: [KB-07]
related_adr: []
related_modules: [A01-debounce, A02-brand-facts, A03-react, A05-safety, A08-multimodal, S-M03]
last_updated: 2026-05-28
---

# A06 ProblemCard 自動建卡 — chatbot 對話流

> **30 秒摘要**：A06 在 LINE 對話中當 facts 收齊（brand + 症狀夠用）→ 呼叫 Admin API create ProblemCard。本檔涵蓋：A06 與 A01 (debounce) / A02 (brand facts) / A03 (ReAct agent) / A05 (safety) / A08 (multimodal) 的握手 sequence 與 ProblemCard lifecycle state machine。**Phase I 核心**：A06 是 chatbot → ERP 的第一個資料化節點，沒這個就無法走 S-M03 / S-M04 同步。

---

## Sequence Diagram — facts 收齊 → PC 建卡

```mermaid
sequenceDiagram
    autonumber
    actor user as 消費者 (LINE)
    participant a01 as A01 Debounce
    participant a02 as A02 Brand/Facts
    participant a03 as A03 ReAct Agent
    participant a05 as A05 Safety
    participant a08 as A08 Multimodal
    participant a06 as A06 PC Builder
    participant erp as ERP Admin API
    participant smm03 as S-M03 Sync

    user ->> a01: text + 照片 + 連發訊息
    a01 ->> a01: buffer_wait (合併多訊息)
    a01 -->> a03: merged turn
    a03 ->> a02: extract brand/model/symptom
    a02 -->> a03: facts (brand: 三聯/model: ?/symptom: 鎖舌卡死)
    a03 ->> user: Quick Reply 「請選型號」
    user ->> a01: 選 model X
    a01 -->> a03: merged turn
    a03 ->> a08: process 照片 → media_ref
    a08 -->> a03: media_ref[s3://...]
    a03 ->> a06: facts complete? (brand + symptom + media)
    a06 ->> a06: completeness check (≥ 0.85)
    a06 ->> a05: safety check (no 越權 / 無 final quote)
    a05 -->> a06: pass
    a06 ->> erp: POST /admin/problem-cards
    erp -->> a06: PC id (state=draft)
    a06 -->> a03: PC created
    a03 ->> user: Flex「我們已記錄您的問題（單號 PC-1234），稍候客服 review」
    erp ->> smm03: outbox event (PC.created)
    smm03 -->> erp: sync OK
```

---

## State Machine — ProblemCard lifecycle

```mermaid
stateDiagram-v2
    [*] --> collecting : 對話開始
    collecting --> collectingNext : facts 不齊 (< 0.85) 繼續多輪
    collectingNext --> collecting : 新一輪輸入
    collecting --> photo_pending : A08 引導拍照
    photo_pending --> collecting : 收到照片
    collecting --> safety_check : facts ≥ 0.85
    safety_check --> draft : A05 pass (no 越權)
    safety_check --> human_handoff : A05 fail / 連 3 次不齊
    draft --> reviewed : 客服 1-click review
    reviewed --> resolved : 客戶按已解決 / 三層解決成功
    reviewed --> converted : S-M04 ConvertToWO (human gate)
    resolved --> closed : 客戶確認結案 / 48h auto_closed
    converted --> [*]
    closed --> reopened : 7d 內重發訊息
    reopened --> collecting
    human_handoff --> [*]
```

---

## Session state（對話 state machine — chatbot 特有）

```mermaid
stateDiagram-v2
    [*] --> idle : 用戶未進線
    idle --> typing : 用戶輸入中
    typing --> waiting : 訊息送出，AI 處理中
    waiting --> typing : AI 回覆，繼續對話
    waiting --> handoff_queued : 觸發 A07 transfer_to_human
    waiting --> fallback : AI 失敗 / safety block / 連 3 次收不齊
    fallback --> handoff_queued
    handoff_queued --> human_handling : 客服接手
    human_handling --> closed : 結案
    waiting --> resolved_check : Clarify gate
    resolved_check --> typing : 客戶答「未釐清」
    resolved_check --> closed : 客戶答「已釐清」+ 結案
    closed --> [*]
```

---

## UI State Coverage（業主 Q-OF1=B: UI-only + annotation）

| Step | Happy | Empty | Loading | Error | Offline | domain state annotation |
|:-----|:------|:------|:--------|:------|:--------|:------------------------|
| **A01 debounce buffer** | ✓ 合併 turn 後給 A03 | 無 media → 跳過 A08 | buffer_wait timer (2s) | media 下載失敗 → 提示重傳 | LINE webhook retry | session: typing → waiting |
| **A02 quick reply brand/model** | ✓ Quick Reply 顯示品牌列表 | 品牌不在清單 → 「其他」進 free text | typing indicator | Quick Reply render fail → fallback 純文字 | LINE 暫存後重發 | facts: collecting |
| **A08 photo guide** | ✓ Flex「請拍鎖舌正面」+ 範例圖 | 客戶說無相機 → 改文字描述 | upload progress bar | 照片 > 10MB → 壓縮失敗，提示重拍 | local 暫存 + 上線重送 | PC entry=photo_pending / exit=collecting |
| **A06 PC create** | ✓ Flex「已記錄問題（PC-1234）」 | n/a (facts 齊才觸發) | API 200ms p95 | ERP 500 → DLQ + 客服 alert | LINE banner + 後台 outbox 補送 | PC entry=null / exit=draft |
| **Clarify gate** | ✓ AI 主動問 | n/a (resolved 一定觸發) | 30s 等回應 | 30s 未回再問 1 次 | banner 重發機制 | PC entry=draft / exit=resolved |

---

## a11y notes — WCAG 2.2 AA

繼承主檔 §a11y，**A06 / chatbot 特有**：
- **LINE 端**：Quick Reply 按鈕走 LINE 原生 a11y；TalkBack 朗讀 Quick Reply label 順序
- **multimodal (A08)**：照片必附 alt-text（人工填，合約禁 AI 影像辨識）；影片附字幕
- **Screen reader (NVDA/VoiceOver)**：Flex Message bubble 朗讀順序 = 標題 → 內文 → button label
- **Keyboard-only**：LIFF onboarding 全可 Tab 完成；無 keyboard trap
- **3.3.7 Redundant entry (WCAG 2.2 新)**：facts 已給過的資訊不重複問（A02 brand 已收，A06 不再問）

---

## FR 反向指

| Step | FR 反向指 | AC |
|:-----|:----------|:---|
| A01 訊息合併 | FR-0026 | AC-01 buffer_wait 合併 / AC-02 media pending 補齊 |
| A02 brand/model facts | FR-0027 | AC-01 brand quick reply / AC-02 model fallback free text |
| A03 ReAct agent | FR-0028 | AC-01 load_skill / AC-02 update_user_info / AC-03 transfer_to_human |
| A05 safety guardrail | FR-0030 | AC-01 越權字串攔截 / AC-02 final quote 改口 |
| A06 PC create | FR-0031 | AC-01 completeness ≥ 0.85 / AC-02 PC.draft → 客服 review |
| A08 multimodal | FR-0025 | AC-01 photo guide / AC-02 alt-text 必填 |
| Clarify gate | FR-0005 | AC-02 客戶答「已釐清」才 resolved |

---

## 引用 KB

- [KB-07 §chatbot multimodal + 多輪異步 diagram picker] — sequence + state 雙圖混合（A6_addition 待補）

---

## 相關文件

- 主檔 Flow S1：[`../user-flow-smart-lock-saas.md#flow-s1`](../user-flow-smart-lock-saas.md)
- Source spec：[`../../_source/02-ai-chatbot-sync.md#a-m06-problemcard`](../../_source/02-ai-chatbot-sync.md)
- 同步藍圖：[`./S-M03-problemcard-convert-flow.md`](./S-M03-problemcard-convert-flow.md)
