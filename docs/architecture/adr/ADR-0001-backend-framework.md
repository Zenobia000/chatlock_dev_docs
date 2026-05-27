---
id: ADR-0001
title: 選擇 FastAPI 作為後端框架
tier: 1
status: accepted
date: 2026-02-17
deciders: [技術負責人, 開發團隊]
---

> 
> **🔄 Migration Status (2026-05-28)**: `STILL_VALID_UNDER_cross-cutting`
> **Reviewed against**: 2026-05-20 final spec (xlsx)
> **Reviewed on**: 2026-05-28
> **Module scope**: cross-cutting
> **Per ADR-0100 §1 classification** (.claude/context/devteam/meetings/2026-05-27-1130-final-spec-migration-strategy/MoM.md)


# ADR-001: 選擇 FastAPI 作為後端框架

**狀態:** 已接受 (Accepted)
**決策者:** 技術負責人, 開發團隊
**日期:** 2026-02-17

---

## 1. 背景與問題陳述

本平台「電子鎖智能客服與派工 SaaS 平台」需要一個 Python 後端框架來承載以下核心職責：

1. **LINE Bot Webhook Server** — 接收 LINE Messaging API 的 Webhook 事件（文字訊息、圖片、Postback），需要快速回應以避免 LINE 平台的 timeout 重試機制（LINE 要求 Webhook 在 1 秒內回應 HTTP 200）。
2. **REST API for Admin Panel** — 提供管理後台所需的 CRUD API，包括案件管理、技師管理、知識庫管理、報表查詢等。
3. **非同步 LLM 呼叫** — 三層 AI 解析引擎（案例庫向量搜尋 -> PDF RAG -> 人工轉接）中，每次 LLM 推論呼叫（Google Gemini 3 Pro）耗時約 2-10 秒，必須以非同步方式處理，避免阻塞其他請求。
4. **技師派工 API** — 類 Uber 派工匹配引擎需要即時推播與狀態更新，對 API 延遲敏感。
5. **自動化對帳 API** — 標準化報價引擎與對帳系統需要嚴格的資料驗證。

框架選型直接影響開發效率、執行效能、以及未來維護成本。

## 2. 考量的選項

### 選項一: FastAPI

- **概述：** 基於 Starlette 與 Pydantic 的現代 Python 非同步 Web 框架。
- **優點：**
  - 原生支援 `async/await`，非同步 I/O 處理 LLM API 呼叫不阻塞主執行緒。
  - 自動生成 OpenAPI (Swagger) 文件，前後端協作效率高。
  - Pydantic v2 提供高效的資料驗證與序列化，適合 ProblemCard 結構化診斷資料的嚴格校驗。
  - 搭配 Uvicorn (ASGI server) 效能在 Python 框架中處於頂端。
  - Dependency Injection 系統簡潔且強大，適合管理 DB session、LLM client 等共享資源。
  - 原生 WebSocket 支援，為未來即時通知功能預留空間。
- **缺點：**
  - 生態系相較 Flask/Django 較年輕，部分第三方套件整合可能需要額外工作。
  - 團隊若無非同步程式設計經驗，學習曲線略高。

### 選項二: Flask

- **概述：** 成熟的 Python 微框架，WSGI 同步模型為主。
- **優點：**
  - 極高的社群成熟度，豐富的 extension 生態系。
  - 入門門檻低，大多數 Python 開發者已有經驗。
  - 簡潔的 API，快速建立 prototype。
- **缺點：**
  - WSGI 同步模型下，LLM API 呼叫（2-10 秒）會阻塞 worker process，嚴重限制並發處理能力。
  - 需要額外引入 Celery 等任務佇列來處理耗時操作，增加系統複雜度。
  - 缺乏內建的資料驗證機制，需額外整合 Marshmallow 或 Pydantic。
  - 缺乏自動 API 文件生成，需額外整合 flask-restx 或 flasgger。
  - LINE Webhook 的快速回應需求在高並發場景下難以保證。

### 選項三: Django + Django REST Framework

- **概述：** 全功能 Python Web 框架，batteries-included 設計哲學。
- **優點：**
  - 內建 ORM、Admin 後台、認證系統，開箱即用。
  - Django REST Framework 提供成熟的 API 開發體驗。
  - 最成熟的 Python Web 框架生態系。
- **缺點：**
  - 框架整體較為笨重，大量內建功能（模板引擎、Form 處理等）在本專案中不需要。
  - 非同步支援雖然在 Django 4.x+ 有進步，但 ORM 等核心組件仍以同步為主，async 支援不完整。
  - 與 LangChain/LlamaIndex 等 AI 框架的整合不如輕量框架靈活。
  - 「約定優於配置」的哲學在需要高度客製化的 AI pipeline 場景中反而是束縛。

## 3. 決策

**選擇 FastAPI 作為後端框架。**

搭配技術棧：
- **ASGI Server:** Uvicorn（生產環境搭配 Gunicorn 作為 process manager）
- **資料驗證:** Pydantic v2（FastAPI 原生整合）
- **ORM:** SQLAlchemy 2.0（async session 搭配 asyncpg driver）
- **API 文件:** FastAPI 自動生成 OpenAPI spec

## 4. 決策的後果與影響

### 正面影響

- **LLM 呼叫不阻塞：** LINE Webhook 收到訊息後，可立即回應 HTTP 200，再以 `asyncio.create_task()` 或 Background Task 非同步處理 LLM 推論與回覆，完全符合 LINE 平台的 timeout 要求。
- **高並發處理能力：** 單一 Uvicorn worker 即可處理大量並發請求（相較 Flask 的同步模型，在 I/O 密集場景下吞吐量提升數倍）。
- **ProblemCard 資料完整性：** Pydantic model 強制校驗 ProblemCard 的每個欄位（鎖型、故障症狀、錯誤代碼等），在 API 邊界就攔截不合法資料。
- **API 文件自動化：** 前端團隊（V2.0 管理後台、技師工作台）可直接使用自動生成的 Swagger UI 進行開發與測試。
- **Dependency Injection 管理資源：** DB session pool、Google AI client、Redis connection 等共享資源透過 FastAPI 的 `Depends()` 機制統一管理，避免資源洩漏。

### 負面影響與風險

- **非同步陷阱：** 若開發者不慎在 async handler 中使用同步阻塞呼叫（例如直接使用 `psycopg2` 而非 `asyncpg`），會造成 event loop 阻塞。需建立 code review 規範。
- **ORM 學習成本：** SQLAlchemy 2.0 async 模式與傳統同步模式有差異，團隊需要時間適應。
- **部分第三方套件相容性：** 少數 Python 套件僅提供同步 API，需要用 `asyncio.to_thread()` 包裝或尋找替代方案。

### 風險緩解措施

| 風險 | 緩解措施 |
|------|----------|
| 非同步阻塞呼叫 | 建立 linting 規則，CI 中檢測 async handler 內的同步呼叫 |
| SQLAlchemy async 學習曲線 | 建立統一的 Repository Pattern 基類，封裝常用資料庫操作 |
| 第三方套件同步 API | 統一使用 `asyncio.to_thread()` wrapper，集中管理同步套件呼叫 |

## 5. 執行計畫概要

> **更新（2026-05）**：依賴管理已從 pip + requirements.txt（早期版本）/ Poetry（本 ADR 原計畫）遷移至 **uv workspace**（根 `pyproject.toml`、子模組 `agent/api/data/pyproject.toml`、共享 `uv.lock`）。詳見 commit 75c0a21、e9ef158 與 `scripts/README.md`。本決策未變更框架選擇（仍為 FastAPI + Pydantic + SQLAlchemy 2.0），僅變更套件管理工具；以下原計畫保留作決策歷史紀錄。

1. **專案初始化：** 使用 Poetry 管理依賴（已超越，現用 uv），建立 FastAPI 專案骨架（`src/app/`）。
2. **Webhook 端點：** 實作 `/webhook/line` 端點，接收 LINE Messaging API 事件，立即回應 200 後非同步處理。
3. **API 模組化：** 依業務領域拆分 API Router — `routers/line.py`、`routers/cases.py`、`routers/technicians.py`、`routers/billing.py`。
4. **Pydantic Schema 定義：** 優先定義 ProblemCard、ServiceOrder、TechnicianProfile 等核心 Pydantic model。
5. **中介層設置：** CORS middleware（允許前端跨域）、Request logging middleware、Error handling middleware。
6. **部署配置：** Dockerfile 使用 `gunicorn -k uvicorn.workers.UvicornWorker` 啟動，搭配 Docker Compose 編排。

## 6. 相關參考

- [FastAPI 官方文件](https://fastapi.tiangolo.com/)
- [Uvicorn - ASGI Server](https://www.uvicorn.org/)
- [Pydantic v2 文件](https://docs.pydantic.dev/latest/)
- [SQLAlchemy 2.0 Async](https://docs.sqlalchemy.org/en/20/orm/extensions/asyncio.html)
- [LINE Messaging API - Webhook](https://developers.line.biz/en/docs/messaging-api/receiving-messages/)
- ADR-002: 資料庫選型（PostgreSQL + pgvector）
- ADR-003: LLM 整合框架選型（LangChain）
- ADR-004: LINE Bot 對話架構設計
