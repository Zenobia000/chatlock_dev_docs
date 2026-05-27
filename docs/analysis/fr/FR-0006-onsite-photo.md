---
id: FR-0006
title: 到場拍照存證
status: active
phase: I
mapped_to:
  - M08    # Onsite (primary - 拍照觸發點)
  - M09    # Evidence (存證 + visibility)
superseded_clauses:
  - BR-M08-NN    # GPS 打卡到場 proof
  - BR-M09-01    # 施工前後各 ≥ 3 張照片
  - BR-M09-NN    # 圖檔 size limit 10MB / format JPG-PNG
  - BR-M09-NN    # GCS retry 3 次 + local queue fallback
  - BR-M09-NN    # 完工後 2y retention (依 ADR-0051)
emits_events:
  - EvidenceUploaded
  - ArrivalProofRecorded
nfr_flavored: false
priority: P0
tier: 2
owner: 派工主管 / 師傅管理 / Compliance owner
last_reviewed: 2026-05-28
related_adrs:
  - ADR-0050    # evidence-visibility-matrix (PARTIAL_UPDATE per 2026-05-28 critique)
  - ADR-0051    # evidence-retention-policy
related:
  - "../../_source/01-workorder-erp.md#m08-現場施工"
  - "../../_source/01-workorder-erp.md#m09-evidence證據"
legacy_id: REQ-006
trace_to_flow: F-006
---

# FR-0006 — 到場拍照存證

> **B' 殼 (2026-05-28 D5)**：rule clause 搬 BR-M08-NN + BR-M09-NN；本檔僅保留 use case skeleton + acceptance G/W/T。

## §1 Use Case Skeleton

| 欄位 | 內容 |
|:-----|:-----|
| **Actor** | 技師 (現場操作) |
| **Secondary Actors** | M09 Evidence store (GCS), 客戶 (作為 visibility 受眾，依 ADR-0050) |
| **Trigger** | 技師到達現場按「打卡到場」（或 GPS 自動偵測進入服務地址範圍） |
| **Precondition** | WorkOrder.assignment = confirmed；TechnicianDeparted 事件已 emit；技師 mobile APP online (或 offline queue available) |
| **Main Flow** | 詳見 §1.1 |
| **Alternative Flow** | 詳見 §1.2 |
| **Postcondition** | 施工前後各 ≥ 3 張照片上傳 GCS；wo.photos JSONB 含 metadata；emit `EvidenceUploaded` (per photo) + `ArrivalProofRecorded` |
| **Out-of-Scope** | 客戶簽名 (FR-0009)；photo visibility 矩陣 (屬 ADR-0050 governance)；photo retention 規則 (屬 ADR-0051) |

### §1.1 Main Flow

1. 技師到達現場，APP 觸發 GPS 打卡（[ref: BR-M08-NN]）
2. 系統驗證 GPS 座標在服務地址 100m 半徑內
3. emit `ArrivalProofRecorded` (含 timestamp + GPS coords + WorkOrder ID)
4. 技師在 APP 拍施工前照片（≥ 3 張，包含現場全景 + 設備特寫 + 損壞處）
5. 系統 validate 格式 (JPG/PNG) + size (≤ 10MB) ([ref: BR-M09-NN])
6. 系統上傳 GCS，更新 wo.photos JSONB 含 metadata (timestamp, GPS, EXIF, file_hash)
7. emit `EvidenceUploaded` per photo
8. 技師執行施工
9. 施工後拍施工後照片（≥ 3 張，包含同視角對比 + 完工特寫 + 整體環境）
10. 重複第 5-7 步
11. END：postcondition 達成

### §1.2 Alternative Flow

```
A1. GPS 不在服務地址 100m 半徑 (第 2 步):
    A1.1 系統提示「不在指定地址，是否確認到場？」
    A1.2 技師確認 + 填 reason → emit ArrivalProofRecorded with manual_override=true
    A1.3 audit log highlight「GPS_OVERRIDE」
    A1.4 派工主管收 alert (PII 注意：客戶地址未匹配可能是地址錯誤或客戶移動)

A2. 圖檔 > 10MB (第 5 步):
    A2.1 系統回 413
    A2.2 APP 提示「圖檔過大，請壓縮」
    A2.3 APP 可選自動壓縮重傳（preserve EXIF）

A3. 非 JPG/PNG 格式 (第 5 步):
    A3.1 系統 reject + 提示格式
    A3.2 不接受 HEIC（iOS 預設）→ APP 端轉檔為 JPG 後重傳

A4. GCS 上傳失敗 (第 6 步):
    A4.1 系統 retry 3 次 ([ref: BR-M09-NN])
    A4.2 3 次失敗 → 保留 base64 於 APP local queue
    A4.3 連線恢復後 APP 自動 sync local queue
    A4.4 sync 完成前 wo.photos JSONB 不更新（避免空 URL）

A5. 施工前未拍滿 3 張 (第 4 步):
    A5.1 系統不允許進入施工階段（hard gate）
    A5.2 提示「請補拍至少 3 張」

A6. 施工後未拍滿 3 張 (第 9 步):
    A6.1 完工簽名 (FR-0009) 不允許開啟
    A6.2 提示「請補拍施工後照片」

A7. 客戶要求不拍特定角度 (privacy concerns):
    A7.1 技師 APP 標 reason="customer_refused_specific_angle"
    A7.2 允許跳過該角度，但仍需總計 ≥ 3 張
    A7.3 audit log 記錄 reason，視覺呈現給品管 review

A8. 連線完全離線 (第 1-9 步任一):
    A8.1 GPS 打卡走 local timestamp + GPS coords，標 offline_at
    A8.2 照片 base64 存 local queue
    A8.3 連線恢復後 sync (依 A4 邏輯)
    A8.4 audit log 記 offline_duration
```

## §2 Acceptance Criteria (G/W/T)

### AC-01: Happy path — 施工前後各 3 張

```gherkin
Given 技師 "T-001" 抵達 WorkOrder "WO-001" 現場
  And GPS 在服務地址 50m 範圍內
When T-001 APP 觸發到場打卡
Then event `ArrivalProofRecorded` emit (含 GPS coords)

When T-001 拍 3 張施工前照片 (JPG, 5MB each)
Then 3 張上傳 GCS
  And wo.photos JSONB 新增 3 個 entry
  And 3 個 `EvidenceUploaded` event emit

When 施工完成 + 拍 3 張施工後照片
Then 同樣寫入 + emit
  And FR-0009 簽名流程解鎖
```

### AC-02: 圖檔 10MB 邊界

```gherkin
When T-001 上傳 JPG size=10MB
Then 系統接受
  And 上傳 GCS

When T-001 上傳 JPG size=10.1MB
Then 系統回 413
  And APP 提示「圖檔過大」
```

### AC-03: 非 JPG/PNG 格式 reject

```gherkin
When T-001 上傳 HEIC 格式
Then 系統 reject
  And APP 提示轉檔
  And APP 自動轉成 JPG 重傳成功
```

### AC-04: GCS 上傳失敗 → retry + local queue

```gherkin
Given GCS 暫時不可用
When T-001 上傳照片
Then 系統 retry 3 次 ([ref: BR-M09-NN])
  And 3 次失敗 → APP 保留 base64 於 local queue

When 連線恢復
Then APP 自動 sync local queue
  And wo.photos JSONB update
  And `EvidenceUploaded` emit (delayed)
```

### AC-05: 施工前未拍滿 3 張 hard gate

```gherkin
Given T-001 只拍了 2 張施工前照片
When T-001 嘗試進入施工階段
Then 系統 hard gate 阻擋
  And 提示「請補拍至少 3 張」
```

### AC-06: 施工後未拍滿 3 張 → 完工 gate

```gherkin
Given T-001 完成施工但只拍 2 張施工後照片
When T-001 嘗試進入 FR-0009 簽名流程
Then FR-0009 不允許開啟
  And 提示「請補拍施工後照片」
```

### AC-07: GPS 不在範圍 → override + audit

```gherkin
Given 技師 GPS 不在服務地址 100m 範圍
When T-001 觸發到場打卡
Then 系統提示「不在指定地址，是否確認到場？」

When T-001 確認 + 填 reason="客戶在門外等"
Then ArrivalProofRecorded emit with manual_override=true
  And audit log highlight "GPS_OVERRIDE"
  And 派工主管收 alert
```

### AC-08: 客戶拒拍特定角度

```gherkin
Given 客戶要求不拍臥室角度
When T-001 跳過該角度 + 標 reason="customer_refused_specific_angle"
Then 允許跳過
  And 總計仍需 ≥ 3 張其他角度
  And audit log 記錄 reason
```

### AC-09: 完全離線情境

```gherkin
Given 技師現場無網路
When T-001 觸發打卡 + 拍照
Then GPS 打卡 local timestamp + coords，標 offline_at
  And 照片 base64 存 local queue

When 連線恢復
Then 所有 queue 內 photo + arrival proof sync
  And audit log 記 offline_duration
  And 不影響 retention 計算（以 commit timestamp 為準）
```

## §3 Reference Map

| 類型 | ID | 用途 |
|:-----|:---|:-----|
| Business Rule | BR-M08-NN | GPS 打卡 proof |
| Business Rule | BR-M09-01 | 前後各 ≥ 3 張 |
| Business Rule | BR-M09-NN | size / format / retry / retention |
| ADR | ADR-0050 | evidence-visibility-matrix (PARTIAL_UPDATE, see merge report) |
| ADR | ADR-0051 | evidence-retention-policy |
| Domain Event | EvidenceUploaded | M09 evidence store + M19 BI |
| Domain Event | ArrivalProofRecorded | dispatch SLA 達成證據 |
| Source spec | `docs/_source/01-workorder-erp.md#m08-現場施工` | M08 原始定義 |
| Source spec | `docs/_source/01-workorder-erp.md#m09-evidence證據` | M09 原始定義 |

## §4 Change Log

| Date | Change | Why |
|:-----|:-------|:----|
| 2026-05-10 | REQ-006→FR-0006 split | — |
| 2026-05-28 | **B' 殼 rewrite (D5)**：rule clause 搬 BR-M08-NN + BR-M09-NN；新增 frontmatter；補 §1 skeleton + 8 alt flow + 9 G/W/T AC（含 offline + GPS override + privacy refused 等 edge case） | Roundtable 2026-05-27 D5 |
