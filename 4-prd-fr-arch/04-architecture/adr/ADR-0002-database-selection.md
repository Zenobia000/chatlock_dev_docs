---
id: ADR-0002
title: 選擇 PostgreSQL + pgvector 作為主要資料庫
tier: 1
status: accepted
date: 2026-02-17
deciders: [技術負責人, 開發團隊]
---

# ADR-002: 選擇 PostgreSQL + pgvector 作為主要資料庫

**狀態:** 已接受 (Accepted)
**決策者:** 技術負責人, 開發團隊
**日期:** 2026-02-17

---

## 1. 背景與問題陳述

本平台的資料儲存需求分為兩大類：

### 結構化關聯式資料

- **使用者與帳戶：** LINE 用戶資料、管理員帳號、技師資料（含技能矩陣、服務區域、評分）。
- **ProblemCard：** 結構化故障診斷卡片，包含鎖型型號、故障症狀分類、錯誤代碼、使用者描述、AI 診斷結果、圖片附件參照等。
- **服務工單：** 派工單（ServiceOrder）包含工單狀態流轉、技師指派、預計到達時間、實際完工時間。
- **報價與對帳：** 標準化報價項目、服務費用明細、技師結算、發票資料等財務相關資料，需要 ACID 事務保證。
- **知識庫中繼資料：** SOP 文件紀錄、PDF 手冊索引、案例庫中繼資料。

### 向量相似度搜尋資料

- **案例庫 Embedding：** 歷史案例的向量表示（維度約 1536，使用 Google `text-embedding-004`），用於三層 AI 解析引擎的第一層「案例庫向量搜尋」。
- **PDF 手冊 Embedding：** 電子鎖安裝手冊、維修手冊的分段向量化，用於第二層 RAG 檢索。
- **SOP Embedding：** 自動生成的 SOP 文件向量化，用於知識庫自進化搜尋。
- **相似度門檻：** 業務需求設定 RAG 相似度閾值 >= 0.75，低於此值轉入下一層處理。

**核心問題：** 如何在一個可維運的架構中同時滿足 ACID 事務需求與向量相似度搜尋需求？

## 2. 考量的選項

### 選項一: PostgreSQL + pgvector（單一資料庫方案）

- **概述：** 使用 PostgreSQL 作為唯一資料庫，透過 pgvector extension 在同一資料庫內處理向量搜尋。
- **優點：**
  - 單一資料庫引擎，維運複雜度最低（備份、監控、故障排除統一處理）。
  - 向量資料與關聯式資料可在同一個 SQL 查詢中 JOIN，例如「搜尋相似案例並同時取得對應的 ProblemCard 詳情與技師處理記錄」。
  - pgvector 支援 HNSW 與 IVFFlat 索引，HNSW 在召回率與查詢速度之間提供良好平衡。
  - ACID 事務覆蓋向量資料——新增案例時，ProblemCard 與其 Embedding 在同一個 transaction 中寫入，保證一致性。
  - 基礎設施成本低，不需要額外的向量資料庫服務。
  - pgvector 0.7+ 支援 halfvec（半精度向量），可降低 50% 儲存空間。
- **缺點：**
  - 超大規模向量搜尋（百萬級以上）效能不如專用向量資料庫。
  - pgvector 功能更新速度不如商業向量資料庫（如 Pinecone）。
  - HNSW 索引建構時間隨資料量增長。

### 選項二: PostgreSQL + Pinecone（關聯式 + 託管向量資料庫）

- **概述：** PostgreSQL 處理結構化資料，Pinecone 專門處理向量搜尋。
- **優點：**
  - Pinecone 為全託管服務，向量搜尋效能與可擴展性極佳。
  - Serverless 定價模式，按使用量付費。
  - 自動處理索引最佳化與備份。
- **缺點：**
  - **資料一致性風險：** ProblemCard 寫入 PostgreSQL 與 Embedding 寫入 Pinecone 是兩個獨立操作，無法保證原子性。需自建補償機制（Saga Pattern 或定時同步）。
  - **額外的外部依賴：** 增加一個託管服務，帶來供應商鎖定風險與額外費用。
  - **跨資料來源查詢：** 無法在單一查詢中 JOIN 向量搜尋結果與關聯式資料，需在應用層進行兩階段查詢與合併。
  - **延遲增加：** 跨服務網路呼叫增加查詢延遲。
  - **合規考量：** 資料儲存於境外（Pinecone 目前無台灣區域），可能有資料落地合規問題。

### 選項三: PostgreSQL + Milvus（關聯式 + 自建向量資料庫）

- **概述：** PostgreSQL 處理結構化資料，自建 Milvus 叢集處理向量搜尋。
- **優點：**
  - Milvus 為開源方案，無供應商鎖定。
  - 支援多種索引類型（HNSW、IVF_FLAT、IVF_PQ 等），彈性高。
  - 可部署在本地或自有雲環境，資料完全自主。
- **缺點：**
  - **維運成本高：** Milvus 叢集需要 etcd、MinIO、Pulsar 等依賴元件，生產環境維運複雜度顯著提高。
  - **資源消耗：** Milvus 叢集最小部署也需要 8GB+ RAM，對於預期初期資料量（< 10 萬向量）而言是殺雞用牛刀。
  - **同樣存在跨資料來源一致性問題。**
  - **團隊學習成本：** 需要額外學習 Milvus 的部署、監控與調優。

## 3. 決策

**選擇 PostgreSQL + pgvector extension 作為主要資料庫方案。**

技術規格：
- **PostgreSQL 版本：** 16.x
- **pgvector 版本：** 0.7+（支援 HNSW 索引與 halfvec）
- **Embedding 維度：** 1536（Google `text-embedding-004`）
- **索引策略：** HNSW（`lists` 參數根據資料量動態調整）
- **距離函數：** Cosine similarity（`vector_cosine_ops`）
- **Python Driver：** asyncpg（搭配 SQLAlchemy 2.0 async）

## 4. 決策的後果與影響

### 正面影響

- **維運簡化：** 只需要管理一個資料庫服務，Docker Compose 中僅需一個 PostgreSQL 容器（掛載 pgvector extension）。備份策略、監控告警、容量規劃全部統一。
- **資料一致性保證：** 新增歷史案例時，可在同一個 transaction 中：
  ```sql
  BEGIN;
  INSERT INTO problem_cards (...) VALUES (...) RETURNING id;
  INSERT INTO case_embeddings (problem_card_id, embedding) VALUES ($1, $2);
  COMMIT;
  ```
  ProblemCard 與其 Embedding 始終一致，不存在「案例存在但向量缺失」的中間狀態。
- **單一查詢搞定搜尋 + 詳情：**
  ```sql
  SELECT pc.*, ce.embedding <=> $1 AS distance
  FROM case_embeddings ce
  JOIN problem_cards pc ON pc.id = ce.problem_card_id
  WHERE ce.embedding <=> $1 < 0.25  -- cosine distance < 0.25 即 similarity >= 0.75
  ORDER BY distance
  LIMIT 5;
  ```
  一條 SQL 同時完成向量搜尋與 ProblemCard 關聯查詢，無需應用層二次組裝。
- **成本可控：** 無需額外的向量資料庫服務費用，PostgreSQL 本身是開源免費軟體。
- **效能足夠：** 根據 pgvector 基準測試，HNSW 索引在 100 萬 1536 維向量下，查詢延遲仍在 10ms 以下，召回率 > 95%。本平台初期預估案例庫 < 5 萬筆，完全在舒適範圍內。

### 負面影響與風險

- **規模上限：** 若未來案例庫增長至百萬級（極端情況），pgvector 效能可能成為瓶頸。
- **pgvector 功能限制：** 相較 Pinecone/Milvus，缺乏 metadata filtering 與向量搜尋的深度整合（需透過 SQL WHERE 子句實現，但這在 PostgreSQL 中本就自然）。
- **PostgreSQL 單點：** 單一資料庫承載所有負載，需規劃 Read Replica 與連線池管理。

### 風險緩解措施

| 風險 | 緩解措施 |
|------|----------|
| 向量資料量爆發增長 | 監控 embedding 表大小，設定告警閾值（50 萬筆）；屆時可遷移至 pgvector + 分區表或獨立向量 DB |
| PostgreSQL 單點故障 | Docker 部署搭配 Volume 持久化 + 定時 pg_dump 備份；生產環境升級至 PostgreSQL HA（Patroni） |
| 查詢效能退化 | 定期 `VACUUM ANALYZE`；監控慢查詢；根據資料量調整 HNSW `m` 與 `ef_construction` 參數 |
| 連線池耗盡 | 使用 PgBouncer 作為連線池代理，限制最大連線數 |

## 5. 執行計畫概要

1. **Docker Image 準備：** 使用 `pgvector/pgvector:pg16` 官方 Docker image，已預裝 pgvector extension。
2. **Extension 啟用：** 在資料庫初始化 migration 中執行 `CREATE EXTENSION IF NOT EXISTS vector;`。
3. **Schema 設計：**
   - 向量欄位使用 `vector(1536)` 類型。
   - 建立 HNSW 索引：`CREATE INDEX ON case_embeddings USING hnsw (embedding vector_cosine_ops) WITH (m = 16, ef_construction = 64);`。
   - ProblemCard 表與 case_embeddings 表以 Foreign Key 關聯。
4. **SQLAlchemy Model 整合：** 使用 `pgvector-python` 套件提供的 SQLAlchemy 類型支援。
5. **相似度搜尋封裝：** 建立 `VectorSearchRepository` 類，封裝向量搜尋邏輯，統一處理距離閾值（cosine distance < 0.25 = similarity >= 0.75）轉換。
6. **效能基準測試：** 在開發環境中灌入模擬資料（1 萬筆 embedding），驗證查詢延遲與召回率。

## 6. 相關參考

- [pgvector GitHub](https://github.com/pgvector/pgvector)
- [pgvector-python](https://github.com/pgvector/pgvector-python)
- [PostgreSQL 16 Documentation](https://www.postgresql.org/docs/16/)
- [HNSW 索引原理](https://arxiv.org/abs/1603.09320)
- [Google AI Embeddings Guide](https://ai.google.dev/gemini-api/docs/embeddings)
- ADR-001: 後端框架選型（FastAPI）
- ADR-003: LLM 整合框架選型（LangChain）
