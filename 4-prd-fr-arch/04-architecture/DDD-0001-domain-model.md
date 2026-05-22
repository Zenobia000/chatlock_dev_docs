---
id: DDD-0001
title: 06 — Entity Relationship Diagram（實體關聯圖）
tier: 1
status: accepted
date: 2026-05-16
deciders: [Tech Lead]
---

# 06 — Entity Relationship Diagram（實體關聯圖）

> **為什麼重要？** 定義資料核心，確保資料模型正確支撐所有業務場景。

## 概述

本圖定義平台所有核心實體（Entity）、屬性及其關聯，分為 V1.0 客服領域與 V2.0 派工帳務領域。

---

## 完整 ERD

```mermaid
erDiagram
    %% ===== V1.0 AI Customer Service =====

    USER {
        uuid id PK
        string line_user_id UK
        string display_name
        enum role "line_user | admin | reviewer | technician"
        timestamp created_at
        timestamp updated_at
    }

    USER_FACTS {
        serial id PK
        string user_id FK
        string attr_key "phone | address | device_model | device_brand"
        string attr_val
        boolean is_current
        timestamp start_date
        timestamp end_date
    }

    CONVERSATION {
        uuid id PK
        string user_id FK
        enum state "idle | collecting | resolving | resolved"
        string thread_id "smart_lock_{user_id}"
        text summary "壓縮後的對話摘要"
        timestamp created_at
        timestamp updated_at
    }

    MESSAGE {
        serial id PK
        uuid conversation_id FK
        enum role "user_raw | user | ai"
        text content
        jsonb metadata
        timestamp created_at
    }

    PROBLEM_CARD {
        varchar card_id PK "pc_{uuid8}"
        varchar user_id FK
        varchar session_id
        varchar status "open | diagnosing | resolved | escalated"
        text symptom_summary "domain-agnostic core"
        varchar category "hardware_fault | software_setting | ..."
        float completeness_score "0.0~1.0"
        jsonb domain_attributes "domain-specific fields from config"
        text resolution_summary
        varchar resolution_level "L1_self_service | L2_rag | L3_escalation"
        jsonb attempts_json "ResolutionAttempt checkpoints"
        boolean is_novel "L8 entropy trigger"
        boolean sop_generated
        timestamp created_at
        timestamp updated_at
    }

    CASE_ENTRY {
        uuid id PK
        string brand
        string model
        text problem_description
        text solution
        vector embedding "768 dim"
        float success_rate
        integer usage_count
        enum status "active | archived"
        timestamp created_at
    }

    MANUAL_CHUNK {
        uuid id PK
        string source_file "PDF 檔名"
        integer chunk_index
        text content
        vector embedding "768 dim"
        jsonb metadata "brand | model | chapter"
        timestamp created_at
    }

    SOP_DRAFT {
        uuid id PK
        uuid source_conversation_id FK
        string title
        text content
        enum status "draft | pending_review | approved | rejected"
        string reviewed_by FK
        text review_notes
        timestamp created_at
        timestamp reviewed_at
    }

    AUDIT_LOG {
        serial id PK
        string user_id
        enum role "user_raw | user | ai"
        text content
        timestamp created_at
    }

    %% ===== V2.0 Dispatch & Accounting =====

    TECHNICIAN {
        uuid id PK
        uuid user_id FK
        string name
        jsonb skill_set "品牌技能列表"
        jsonb service_regions "服務區域"
        float rating "1.0 ~ 5.0"
        enum availability "available | busy | offline"
        string phone
        timestamp created_at
    }

    WORK_ORDER {
        uuid id PK
        uuid problem_card_id FK
        uuid technician_id FK
        enum status "created | assigned | in_progress | completed | cancelled"
        text customer_address
        string customer_phone
        timestamp scheduled_at
        timestamp accepted_at
        timestamp completed_at
        text completion_notes
        jsonb photos "完工照片 URL"
    }

    PRICE_RULE {
        uuid id PK
        string brand
        string lock_type
        enum difficulty "easy | medium | hard"
        decimal base_price
        decimal night_surcharge
        decimal holiday_surcharge
        decimal remote_surcharge
        timestamp effective_from
        timestamp effective_to
    }

    INVOICE {
        uuid id PK
        uuid work_order_id FK
        decimal amount
        decimal surcharges
        decimal total
        enum payment_status "pending | paid | disputed"
        string payment_method
        timestamp issued_at
        timestamp paid_at
    }

    RECONCILIATION {
        uuid id PK
        uuid technician_id FK
        string period "YYYY-MM"
        decimal total_earnings
        decimal deductions
        decimal net_payout
        enum status "draft | confirmed | paid"
        timestamp created_at
        timestamp confirmed_at
    }

    %% ===== Relationships =====

    USER ||--o{ USER_FACTS : "has facts (SCD Type 2)"
    USER ||--o{ CONVERSATION : "initiates"
    CONVERSATION ||--o{ MESSAGE : "contains"
    CONVERSATION ||--o| PROBLEM_CARD : "generates"
    PROBLEM_CARD ||--o| WORK_ORDER : "escalates to (L3)"
    SOP_DRAFT }o--|| CONVERSATION : "generated from"
    SOP_DRAFT }o--o| CASE_ENTRY : "approved becomes"

    USER ||--o| TECHNICIAN : "is a"
    TECHNICIAN ||--o{ WORK_ORDER : "assigned to"
    WORK_ORDER ||--|| INVOICE : "billed via"
    TECHNICIAN ||--o{ RECONCILIATION : "settled in"
    PRICE_RULE }o--o{ INVOICE : "calculates"
```

---

## 實體說明

### V1.0 核心實體

| 實體 | 領域 | 說明 | 關鍵特性 |
|:-----|:-----|:-----|:---------|
| **User** | 身份管理 | 統一使用者（LINE 用戶、管理員、技師） | RBAC 角色區分 |
| **User Facts** | 使用者資料 | SCD Type 2 歷史追蹤（電話、地址、設備品牌型號） | is_current + start/end_date |
| **Conversation** | 客服對話 | 對話 Session，含狀態機與記憶壓縮 | thread_id 對應 LangGraph |
| **Message** | 客服對話 | 單則訊息（含原始/處理後/AI 回覆三類） | 審計追蹤 |
| **ProblemCard** | 問題診斷 | 結構化問題卡 (domain-agnostic core + JSONB domain_attributes) | Harness L1 核心 artifact，支援多領域切換 |
| **Case Entry** | 知識庫 | 歷史案例 + 768 維向量，供 L1 搜尋 | HNSW 索引 + MMR |
| **Manual Chunk** | 知識庫 | PDF 手冊分段 + 向量，供 L2 RAG | 分段索引 |
| **SOP Draft** | 知識庫 | AI 自動生成 SOP，待審核發佈 | 審核工作流 |
| **Audit Log** | 審計 | 全訊息記錄（user_raw / user / ai） | 合規追蹤 |

### V2.0 核心實體

| 實體 | 領域 | 說明 | 關鍵特性 |
|:-----|:-----|:-----|:---------|
| **Technician** | 派工 | 技師 Profile（技能/區域/評分/可用性） | JSON 技能矩陣 |
| **Work Order** | 派工 | 工單生命週期管理 | 狀態機 5 階段 |
| **Price Rule** | 計價 | 品牌×鎖型×難度定價矩陣 | 加成規則 |
| **Invoice** | 帳務 | 服務帳單 | 付款狀態追蹤 |
| **Reconciliation** | 帳務 | 技師月結對帳 | 審核工作流 |

---

## 向量知識庫集合

| 集合名稱 | 資料來源 | 維度 | 索引 | Agent 使用者 |
|:---------|:---------|:-----|:-----|:------------|
| kb_video | 硬體維修影片 | 768 | HNSW | hardware_technician |
| kb_line_chat | LINE 對話紀錄 | 768 | HNSW | sales_representative |
| kb_website | 門市網站資訊 | 768 | HNSW | store_assistant |
| kb_youtube | APP 教學影片 | 768 | HNSW | app_specialist |
| kb_gdrive | PDF 產品手冊 | 768 | HNSW | manual_librarian |

---

## V2.0 工單異常處理擴展

```mermaid
erDiagram
    %% ===== V2.0 Work Order Exception Handling Extension =====

    COMPLAINT {
        uuid id PK
        uuid work_order_id FK
        uuid customer_id FK
        varchar category
        varchar severity
        varchar status
        uuid assigned_to FK
        text description
        text resolution
        float compensation_amount
        timestamp sla_deadline
    }

    SCOPE_CHANGE {
        uuid id PK
        uuid work_order_id FK
        uuid technician_id FK
        text reason
        jsonb original_scope
        jsonb new_scope
        float original_price
        float new_price
        varchar status
        varchar customer_decision
    }

    MATERIAL_REQUEST {
        uuid id PK
        uuid work_order_id FK
        uuid technician_id FK
        jsonb items
        varchar status
        float total_cost
        varchar source
        timestamp estimated_arrival
    }

    DISPUTE {
        uuid id PK
        uuid work_order_id FK
        uuid invoice_id FK
        uuid filed_by FK
        varchar dispute_type
        varchar status
        text description
        jsonb evidence
        text resolution
        float resolution_amount
    }

    DISPATCH_LOG {
        uuid id PK
        uuid work_order_id FK
        varchar action
        uuid technician_id FK
        float match_score
        jsonb match_factors
        text rejection_reason
    }

    REFUND_REQUEST {
        uuid id PK
        uuid work_order_id FK
        uuid invoice_id FK
        uuid complaint_id FK
        float amount
        varchar status
        jsonb approval_chain
        boolean requires_dual_sign
    }

    WARRANTY_CLAIM {
        uuid id PK
        uuid work_order_id FK
        uuid customer_id FK
        varchar device_brand
        varchar device_model
        date warranty_start_date
        date warranty_end_date
        boolean is_within_warranty
        varchar status
    }

    APPEARANCE_CHANGE_CONSENT {
        uuid id PK
        uuid work_order_id FK
        uuid technician_id FK
        uuid customer_id FK
        text change_description
        boolean customer_consented
        varchar consent_method
    }

    %% ===== Relationships =====

    WORK_ORDER ||--o{ COMPLAINT : "triggers"
    WORK_ORDER ||--o{ SCOPE_CHANGE : "reports"
    WORK_ORDER ||--o{ MATERIAL_REQUEST : "needs"
    WORK_ORDER ||--o{ DISPUTE : "disputes"
    WORK_ORDER ||--o{ DISPATCH_LOG : "logs"
    WORK_ORDER ||--o{ REFUND_REQUEST : "refunds"
    WORK_ORDER ||--o| WARRANTY_CLAIM : "claims"
    WORK_ORDER ||--o| APPEARANCE_CHANGE_CONSENT : "consents"
    COMPLAINT ||--o| REFUND_REQUEST : "leads to"
    COMPLAINT ||--o| DISPUTE : "escalates to"
    INVOICE ||--o{ DISPUTE : "challenged by"
    INVOICE ||--o{ REFUND_REQUEST : "refunds from"
```
