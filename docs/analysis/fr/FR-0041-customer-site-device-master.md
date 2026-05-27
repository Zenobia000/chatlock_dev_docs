---
id: FR-0041
title: Customer / Site / Device Master 維護
status: active
phase: I
mapped_to:
  - M02    # Customer / Site / Device Master (primary)
  - M14    # Partner Portal (建商 site group 來源)
superseded_clauses:
  - BR-M02-01    # Customer 去重：phone + LINE userId
  - BR-M02-02    # 主鎖 / 高價零件 → 建 Device record (brand/model/serial/purchase/install/warranty date)
  - BR-M02-03    # 建商 / 社區案使用 Site Group
emits_events:
  - CustomerCreated
  - CustomerMerged
  - SiteCreated
  - DeviceRegistered
  - DeviceWarrantyUpdated
nfr_flavored: false
priority: P0
tier: 2
owner: 客服主管 / Data steward / Partner manager
last_reviewed: 2026-05-28
related_adrs:
  - ADR-PII-002
  - ADR-0030    # tenant-id-propagation
  - ADR-0043    # brand-project-tenant-scope
  - ADR-0044    # warranty-start-date-modes (REVIEW_REQUIRED)
related:
  - "../../_source/01-workorder-erp.md#m02-客戶地址設備"
created_in: "Phase I — A3.4 ERP 缺漏補（M02 未被既有 FR 涵蓋）"
---

# FR-0041 — Customer / Site / Device Master 維護

> **Phase I 新增 (2026-05-28)** — M02 master data 維護 use case。非 user-facing chatbot FR，不需 §2.1 dialogue。

## §1 Use Case Skeleton

| 欄位 | 內容 |
|:-----|:-----|
| **Actor** | CSM (manual create/update) / A02 Resolver (auto from chatbot) / Data steward (batch import / cleanup) |
| **Secondary Actors** | M01 Intake (新客戶觸發 create)，M10 Product (device 與 model 對應)，M14 Partner Portal (建商 site group)，M13 RMA (warranty 引用) |
| **Trigger** | (a) 新 case 進來但 customer 不存在；(b) A02 fact 更新 (FR-0027)；(c) Data steward batch import；(d) 建商案 site group 設定 |
| **Precondition** | Actor 具備 master data write permission ([ref: ADR-0042])；tenant_id 強制 ([ref: ADR-0030]) |
| **Main Flow** | 詳見 §1.1 |
| **Alternative Flow** | 詳見 §1.2 |
| **Postcondition** | customer / site / device row 落地；emit 對應 events；ready for downstream FR (warranty / RMA / dispatch) |
| **Out-of-Scope** | A02 fact resolver 流程 (FR-0027)；warranty 判定 (FR-0015)；M10 product master 維護 |

### §1.1 Main Flow

1. Actor 提交 customer / site / device create or update
2. validate 必填欄位：customer (phone + LINE userId OR name) / site (address + tenant_id) / device (brand + model in M10 + serial)
3. dedup check：
   - customer：phone + LINE userId 為 unique key ([ref: BR-M02-01])
   - device：serial 為 unique key in tenant
4. write to M02 master
5. emit 對應 event (CustomerCreated / SiteCreated / DeviceRegistered)
6. 若 device 為主鎖 / 高價零件 → 建 warranty 起算紀錄 ([ref: BR-M02-02])
7. END

### §1.2 Alternative Flow

```
A1. Customer 重複 (phone + LINE userId 命中):
    A1.1 提示「該客戶已存在」+ 顯示 existing customer_id
    A1.2 actor 可選 merge profile → emit `CustomerMerged` + audit
    A1.3 若不 merge → 拒絕 create

A2. Device serial 衝突 (cross-customer):
    A2.1 已歸屬其他 customer (per FR-0027 A07)
    A2.2 alert CSM 介入處理 ownership dispute
    A2.3 不自動 reassign

A3. 建商案 Site Group (per BR-M02-03):
    A3.1 actor (Partner manager) 建 site group
    A3.2 該 group 內 individual site 共享 contract / SLA / settlement rules
    A3.3 支援 batch dispatch / batch warranty
    A3.4 emit `SiteCreated` per individual + `SiteGroupCreated`

A4. Warranty 起算 conflict (per ADR-0044 REVIEW_REQUIRED):
    A4.1 建商案點交日 vs 購買日 vs 安裝日衝突
    A4.2 暫時 fallback 採購買日 ([ref: FR-0015 §1.2 A5])
    A4.3 等 ADR-0044 Lane A critique 結論 cascade

A5. Cross-tenant attempt:
    A5.1 actor 嘗試 write 跨 tenant_id
    A5.2 403 forbidden ([ref: ADR-0030])
    A5.3 audit

A6. Batch import 部分失敗 (data steward):
    A6.1 系統 transactional per row (不 all-or-nothing)
    A6.2 失敗 row 進 import_errors table
    A6.3 成功 row commit
    A6.4 alert steward review failed rows
```

## §2 Acceptance Criteria (G/W/T)

### AC-01: Happy path create customer

```gherkin
Given CSM 提交 customer (phone="0912345678", LINE userId="U-001", tenant=T-001)
When 系統 validate + dedup check pass
Then row 寫入 M02 customer table
  And event `CustomerCreated` emit
  And tenant_id 強制設為 T-001
```

### AC-02: Dedup phone + LINE 命中

```gherkin
Given customer (phone="0912345678", LINE userId="U-001") 已存在
When CSM 嘗試 create 相同 key
Then 系統提示「該客戶已存在 customer_id=C-001」
  And actor 可選 merge → emit `CustomerMerged`
```

### AC-03: Device serial unique in tenant

```gherkin
Given device (serial="SN-001") 已歸屬 tenant T-001 customer C-001
When CSM 在 tenant T-001 嘗試 register SN-001 給 C-002
Then alert CSM 處理 ownership dispute
  And 不自動 reassign
```

### AC-04: 建商 Site Group

```gherkin
Given Partner manager 建 site_group "BC-2024-社區A"
When 加入 50 個 individual site
Then 50 個 site 共享 contract / SLA / settlement rules
  And emit `SiteCreated` x 50 + `SiteGroupCreated`
  And 支援後續 batch dispatch
```

### AC-05: Warranty start-date fallback (ADR-0044 pending)

```gherkin
Given 建商案 device 點交日 missing
When 系統建 warranty 起算
Then fallback 採購買日
  And audit highlight "WARRANTY_START_DATE_FALLBACK"
  And 等 ADR-0044 critique 結論
```

### AC-06: Cross-tenant 拒絕

```gherkin
Given CSM 屬 tenant T-001
When 嘗試 create customer with tenant_id=T-002
Then 403 forbidden
```

### AC-07: Batch import 部分失敗

```gherkin
Given Data steward 上傳 1000 row CSV，其中 50 row data invalid
When 系統處理
Then 950 row commit (transactional per row)
  And 50 row 進 import_errors table
  And alert steward review
```

## §3 Reference Map

| 類型 | ID | 用途 |
|:-----|:---|:-----|
| BR | BR-M02-01~03 | dedup / device record / site group |
| ADR | ADR-PII-002 / ADR-0030 / ADR-0043 / ADR-0044 | PII / tenant / partner scope / warranty start |
| Domain Event | CustomerCreated/Merged | M02 + M11 downstream |
| Domain Event | SiteCreated | M14 partner |
| Domain Event | DeviceRegistered | M13 warranty + M10 link |
| Source spec | `docs/_source/01-workorder-erp.md#m02-客戶地址設備` | M02 |

## §4 Change Log

| Date | Change | Why |
|:-----|:-------|:----|
| 2026-05-28 | **新建** A3.4 ERP 缺漏補 (M02 master) | Roundtable A D5 |
