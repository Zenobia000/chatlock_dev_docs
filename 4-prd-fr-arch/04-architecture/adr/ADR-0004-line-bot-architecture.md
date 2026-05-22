---
id: ADR-0004
title: LINE Bot 對話架構設計
tier: 1
status: accepted
date: 2026-02-17
deciders: [技術負責人, 開發團隊]
---

# ADR-004: LINE Bot 對話架構設計

> **ADR 狀態更新（2026-04-21）**
> V1.0 實作未使用 Redis。Session 管理改由 LangGraph AsyncPostgresSaver checkpoint 處理。
> 對話狀態持久化於 PostgreSQL，per-user thread 隔離（`thread_id = "line_{user_id}"`）。
> Redis 規劃保留給 V2.0 作為快取層使用。

**狀態:** 已接受 (Accepted)
**決策者:** 技術負責人, 開發團隊
**日期:** 2026-02-17

---

## 1. 背景與問題陳述

LINE Bot 是本平台面對終端使用者的主要通道。使用者透過 LINE 與 AI 客服進行以下互動：

### 核心對話場景

1. **故障報修（多輪對話）：** 使用者描述電子鎖問題，AI 逐步蒐集 ProblemCard 所需欄位：
   - 第 1 輪：使用者報告「鎖打不開」
   - 第 2 輪：AI 詢問「請問是哪個型號的電子鎖？」→ 使用者回覆型號
   - 第 3 輪：AI 詢問「面板是否有顯示錯誤代碼？」→ 使用者傳送照片
   - 第 4 輪：AI 根據完整 ProblemCard 提供解決方案或轉派技師
   - 整個流程可能橫跨 5-15 輪對話，持續 3-30 分鐘。

2. **進度查詢：** 使用者查詢已建立工單的處理進度、技師預計到達時間。

3. **簡單問答：** 營業時間、服務範圍、收費標準等常見問題。

4. **圖片傳送：** 使用者傳送電子鎖故障照片、錯誤代碼螢幕截圖，AI 需要進行 Vision 分析。

### 技術挑戰

- **LINE Webhook 特性：** LINE 平台發送 Webhook 事件到伺服器，要求在 1 秒內回應 HTTP 200，否則會重試。但 AI 推論需要 2-10 秒。
- **對話上下文維護：** 多輪對話中，每條訊息都是獨立的 Webhook 事件，需要在 server 端維護對話上下文（已蒐集的 ProblemCard 欄位、對話階段、歷史訊息）。
- **並發對話：** 多個使用者可能同時進行故障報修對話，每個對話的上下文必須隔離。
- **對話超時：** 使用者可能中途離開，隔數小時或數天後回來繼續，系統需要合理處理對話恢復與超時。
- **圖片處理：** LINE 的圖片透過 Content API 取得（需要 Channel Access Token），需要下載後轉發給 Vision API。

**核心問題：** 如何設計 LINE Bot 的對話狀態管理架構，在滿足 LINE Webhook 延遲要求的同時，支援複雜的多輪故障診斷流程？

## 2. 考量的選項

### 選項一: Stateless 逐訊息處理

- **概述：** 每條訊息獨立處理，不維護 server 端狀態。所有上下文由 LLM 的 conversation history 承載。
- **優點：**
  - 架構最簡單，無需額外的狀態儲存元件。
  - 天然支援水平擴展（任何 server instance 都能處理任何訊息）。
  - 無對話超時問題。
- **缺點：**
  - **ProblemCard 累積困難：** 每次都需要從完整對話歷史重新解析 ProblemCard 欄位，LLM token 消耗隨對話輪次線性增長，15 輪對話的最後一輪需要處理前 14 輪的完整歷史。
  - **LLM 成本爆炸：** Gemini 3 Pro 的 input token 成本隨對話長度快速增加。
  - **對話歷史查詢：** 需要從 PostgreSQL 查詢完整歷史後組裝，在 LINE Webhook 的 1 秒限制內可能來不及。
  - **結構化狀態丟失：** 無法在 server 端追蹤「ProblemCard 目前已蒐集了哪些欄位、還缺哪些」的結構化狀態。

### 選項二: Stateful Session（Redis 熱資料 + PostgreSQL 持久化）

- **概述：** 使用 Redis 儲存活躍對話的 session 資料（ProblemCard 當前狀態、對話階段、最近 N 輪歷史），PostgreSQL 持久化完整對話紀錄。
- **優點：**
  - **Redis 讀取延遲 < 1ms：** Webhook handler 收到訊息後，可在毫秒級取得當前對話上下文，立即決定回應策略。
  - **結構化狀態管理：** ProblemCard 的蒐集進度（已填欄位、缺失欄位、當前對話階段）以結構化 JSON 儲存在 Redis 中，無需每次重新解析。
  - **LLM Token 最佳化：** 只需傳送最近 N 輪歷史 + 當前 ProblemCard 摘要給 LLM，不需要完整歷史，顯著降低 token 消耗。
  - **對話恢復：** 使用者中斷後回來，Redis 若有 session 直接恢復；Redis session 過期後，可從 PostgreSQL 重建。
  - **TTL 自動過期：** Redis 的 TTL 機制天然處理對話超時（例如 30 分鐘無互動自動過期）。
- **缺點：**
  - 增加一個 Redis 基礎設施元件。
  - 需要處理 Redis 與 PostgreSQL 之間的資料同步。
  - Session affinity 或 shared Redis 的部署考量。

### 選項三: Stateful Session（僅 PostgreSQL）

- **概述：** 所有 session 資料直接存在 PostgreSQL 中，不使用 Redis。
- **優點：**
  - 不增加額外基礎設施元件。
  - 資料天然持久化，不存在 Redis 掛掉後 session 丟失的問題。
  - 簡單直接。
- **缺點：**
  - **查詢延遲較高：** PostgreSQL 查詢延遲（1-5ms，含網路）相較 Redis（< 1ms）較高。在 LINE Webhook 的 1 秒限制內，每毫秒都珍貴（因為後續還有 LLM 呼叫要排程）。
  - **頻繁讀寫壓力：** 活躍對話的每條訊息都要讀寫 session 資料，對 PostgreSQL 造成額外的 I/O 壓力。
  - **缺乏 TTL 機制：** 需要自行實作定時清理過期 session 的排程任務。
  - **JSONB 欄位的部分更新效率不如 Redis 的 HSET。**

## 3. 決策

**選擇 Stateful Session 管理架構，使用 Redis 作為熱 session 儲存 + PostgreSQL 作為持久化層。**

技術規格：

- **Redis 版本：** 7.x（Docker 部署）
- **Session Key 格式：** `session:line:{user_id}`
- **Session TTL：** 30 分鐘（活躍對話每次互動重置 TTL）
- **Session 資料結構：** JSON，包含 ProblemCard 狀態、對話階段、最近 10 輪歷史摘要
- **持久化時機：** 每次 session 更新時同步寫入 PostgreSQL（async background task）
- **Python Redis Client：** `redis.asyncio`（搭配 FastAPI async 架構）

### 對話處理流程

```
LINE Webhook Event (HTTP POST)
    |
    v
[FastAPI Handler] -- 立即回應 HTTP 200
    |
    v (Background Task)
[Redis 讀取 Session] -- < 1ms
    |
    v
[對話狀態機判斷] -- 根據 session.stage 決定處理策略
    |
    ├── stage: GREETING → 歡迎訊息
    ├── stage: COLLECTING → 繼續蒐集 ProblemCard 欄位
    ├── stage: DIAGNOSING → 執行三層 AI 解析引擎
    ├── stage: DISPATCHING → 派工流程互動
    └── stage: FOLLOWUP → 售後追蹤
    |
    v
[LLM 推論] -- 2-10 秒
    |
    v
[更新 Redis Session + 寫入 PostgreSQL]
    |
    v
[LINE Reply API] -- 回覆使用者
```

## 4. 決策的後果與影響

### 正面影響

- **Webhook 回應零延遲：** FastAPI handler 收到 Webhook 後，立即回應 HTTP 200，LLM 推論在 background task 中非同步執行。LINE 平台不會觸發重試機制。
- **ProblemCard 漸進式蒐集：** Redis session 中維護 ProblemCard 的當前狀態：
  ```json
  {
    "session_id": "sess_abc123",
    "user_id": "U1234567890",
    "stage": "COLLECTING",
    "problem_card": {
      "lock_model": "Yale YDM-4109",
      "symptom_category": "UNLOCK_FAILURE",
      "error_code": null,
      "user_description": "密碼輸入後沒反應",
      "image_urls": [],
      "missing_fields": ["error_code", "occurrence_time"]
    },
    "recent_history": [
      {"role": "user", "content": "我的鎖打不開"},
      {"role": "assistant", "content": "請問是哪個型號的電子鎖？"},
      {"role": "user", "content": "Yale YDM-4109"}
    ],
    "created_at": "2026-02-17T10:30:00Z",
    "last_active_at": "2026-02-17T10:32:15Z"
  }
  ```
  每輪對話只需要將新蒐集到的欄位更新到 `problem_card` 中，不需要 LLM 重新解析整段歷史。
- **LLM Token 成本降低：** 傳送給 LLM 的 context 僅包含：最近 5-10 輪歷史 + ProblemCard 當前摘要 + system prompt。相較 stateless 方案（傳送完整歷史），token 消耗降低 50-70%。
- **對話恢復體驗：** 使用者中斷對話後 30 分鐘內回來，Redis session 仍在，AI 可以說「您剛才提到 Yale YDM-4109 密碼輸入後沒反應，請問面板有顯示錯誤代碼嗎？」直接延續上次的蒐集進度。
- **並發隔離：** 每個使用者的 session 以 `line:{user_id}` 為 key 完全隔離，不存在對話串擾問題。

### 負面影響與風險

- **Redis 基礎設施：** 增加一個需要維運的元件（Docker container）。
- **Session 資料一致性：** Redis（熱）與 PostgreSQL（冷）之間可能短暫不一致。
- **Redis 記憶體管理：** 若並發活躍對話數量暴增，Redis 記憶體消耗需要監控。
- **Session 丟失風險：** Redis 重啟時，未持久化到 PostgreSQL 的最新一輪對話可能丟失。

### 風險緩解措施

| 風險 | 緩解措施 |
|------|----------|
| Redis 故障 | Docker 部署搭配 Redis AOF 持久化；session 每次更新同步寫入 PostgreSQL，Redis 故障時 fallback 到 PostgreSQL 讀取 |
| 記憶體爆炸 | 設定 Redis `maxmemory` 與 `maxmemory-policy allkeys-lru`；監控 session 數量與記憶體用量 |
| 資料不一致 | Session 更新流程：先寫 PostgreSQL（async），再更新 Redis；若 Redis 寫入失敗，下次讀取時從 PostgreSQL 重建 |
| Session 丟失 | 每輪對話結束時確保 PostgreSQL 寫入完成再回覆使用者；Redis 僅作為加速快取 |

### 圖片處理流程

```
使用者傳送圖片 (LINE Image Message)
    |
    v
[取得 message_id] -- 從 Webhook event 解析
    |
    v
[LINE Content API] -- GET https://api-data.line.me/v2/bot/message/{id}/content
    |                   (需要 Channel Access Token)
    v
[暫存圖片] -- 儲存至本地暫存目錄或 S3
    |
    v
[Gemini 3 Pro Vision API] -- 傳送圖片進行分析
    |                    (辨識錯誤代碼、電子鎖型號、故障外觀)
    v
[更新 ProblemCard] -- 將 Vision 分析結果填入對應欄位
```

## 5. 執行計畫概要

1. **Redis 部署：** 在 Docker Compose 中加入 Redis 7.x 容器，啟用 AOF 持久化。
2. **Session Manager 實作：**
   ```
   src/app/session/
   ├── manager.py          # SessionManager class (Redis + PostgreSQL 雙寫)
   ├── models.py           # Session Pydantic model (SessionData, ProblemCardState)
   ├── state_machine.py    # 對話階段狀態機 (GREETING → COLLECTING → DIAGNOSING → ...)
   └── config.py           # TTL、history limit 等設定
   ```
3. **對話狀態機設計：**
   ```
   GREETING    → 初始問候，判斷使用者意圖
   COLLECTING  → 逐步蒐集 ProblemCard 欄位（多輪對話核心）
   DIAGNOSING  → ProblemCard 完整，觸發三層 AI 解析引擎
   RESOLVED    → AI 成功提供解決方案
   DISPATCHING → 需要派工，進入技師匹配流程
   FOLLOWUP    → 工單建立後的追蹤互動
   CLOSED      → 對話結束
   ```
4. **LINE Webhook Handler：**
   - 文字訊息：直接進入對話狀態機處理。
   - 圖片訊息：下載圖片 -> Vision 分析 -> 更新 ProblemCard -> 進入狀態機。
   - Postback 事件：處理 Rich Menu、Quick Reply 等互動元件的回調。
5. **LINE Reply 最佳化：**
   - 使用 Flex Message 呈現 ProblemCard 蒐集進度。
   - 使用 Quick Reply 提供常見選項（鎖型型號、故障類型），減少使用者打字。
   - 長時間 AI 推論時，先傳送「正在為您分析中...」的即時回覆。

## 6. 相關參考

- [LINE Messaging API Documentation](https://developers.line.biz/en/docs/messaging-api/)
- [LINE Messaging API - Webhook](https://developers.line.biz/en/docs/messaging-api/receiving-messages/)
- [LINE Flex Message](https://developers.line.biz/en/docs/messaging-api/using-flex-messages/)
- [Redis Documentation](https://redis.io/docs/)
- [redis.asyncio Python Client](https://redis-py.readthedocs.io/en/stable/examples/asyncio_examples.html)
- ADR-001: 後端框架選型（FastAPI — async background task）
- ADR-002: 資料庫選型（PostgreSQL — session 持久化）
- ADR-003: LLM 整合框架選型（LangChain — AI pipeline 編排）
