---
id: ADR-0059
title: 電子鎖 IoT 狀態訊號接入規格
status: accepted
date: 2026-05-22
source_trade_off: PAIN-POINTS-SUMMARY-2026-05-21.md §A F7 + ACTION-ITEMS-2026-05-22.md MATTER-08
deciders: [業主]
accepted_date: 2026-05-22
related:
  - "./ADR-0033-problem-card-completeness-gate.md"
  - "./ADR-0034-urgent-red-code-definition.md"
  - "./ADR-0050-evidence-visibility-matrix.md"
pre_mortem: F7 (被 AI 巨頭吞噬死)
eternal_transient: Eternal Event Schema (B5) + Transient device adapter (C1)
---

# ADR-0059 — 電子鎖 IoT 狀態訊號接入規格

## Status
Accepted (2026-05-22)

## Context

業主於 2026-05-22 會議確認 F7 (被 AI 巨頭吞噬死) 護城河三柱：
1. **線下師傅生態**（不可被 AI 廠商複製的物理執行能力）
2. **物理 Evidence**（合約 + 簽名 + 照片留證）
3. **合約履約**（per ADR-0056）

並加碼一條新設計：**電子鎖狀態訊號透過 App → 後台 → AI 客服，AI 即時判斷**。

此能力是「無法被通用 LLM agent 複製」的核心 — 必須有實體鎖 + 用戶授權 + 物理通道，AI 才能拿到資料。本 ADR 定義 IoT 訊號接入規格。

## Decision（業主拍板 2026-05-22）

**IoT 訊號 → App → AI 客服 ingestion pipeline**：

### 1. Event Envelope Schema（§B5 Domain Event 標準）
```yaml
iot_event:
  event_id: uuid
  event_type: lock_status | battery | tamper | error_code | usage | network_health
  device_id: <鎖 serial>
  device_brand: <品牌>
  device_model: <型號>
  tenant_id: <用戶綁定的 tenant>
  customer_id: <綁定的客戶>
  timestamp: ISO8601 (device side, 必須含 timezone)
  ingestion_timestamp: ISO8601 (server side)
  payload:
    # event_type 不同 payload 結構不同
    # 詳見 §3
  source:
    channel: line_app | partner_app | direct_iot
    signature: <hmac> # 防偽造
  metadata:
    firmware_version: string
    rssi: int (network strength)
```

### 2. 6 種 event_type 標準化

| event_type | 觸發 | Payload 重點 | AI 利用 |
|---|---|---|---|
| `lock_status` | 鎖開 / 關 / 鎖死 | state: open/closed/jammed, method: pin/finger/key/remote | 判斷 PC 是否需建 |
| `battery` | 電量變化 / 低電量警告 | level: 0-100, alert_threshold: bool | 預警保養 / 排除 ProblemCard |
| `tamper` | 強制開啟偵測 | tamper_type: physical/wireless, severity | **觸發 ADR-0034 urgent: 安全風險** |
| `error_code` | 鎖回報錯誤碼 | code: string, vendor_msg: string | AI 自動 RAG 該錯誤碼 SOP |
| `usage` | 正常使用統計 | actor_id, time | BI / 異常偵測 |
| `network_health` | 連線健康 | online/offline, last_seen | 排除「鎖壞」誤判 |

### 3. 接入流程
```
鎖（IoT 模組）
   ↓ BLE/WiFi
LINE App / Partner App
   ↓ HTTPS + HMAC signature
IoT Ingestion Gateway（§C1 邊界）
   ↓ schema validate + auth + rate limit
Event Bus
   ↓ fan-out
- AI 客服上下文（即時 ProblemCard 預填）
- BI 警示系統
- Maintenance 排程
- Evidence Store（per ADR-0050/0051）
```

### 4. AI 利用規則
AI 客服接收到 IoT event 時：
1. **不可直接以 IoT 訊號取代客戶描述**（HITL 邊界，per ADR-0028）
2. 可在 ProblemCard 預填欄位（per ADR-0033）：
   - `device.error_code` ← `iot_event.payload.code`
   - `device.battery_level` ← `iot_event.payload.level`
   - `urgency` ← 若 `tamper` event → 標 urgent: 安全風險
3. 必須明文告知客戶：「我們偵測到您家鎖回報錯誤碼 EXX，是您現在遇到的問題嗎？」
4. 客戶確認後才轉 PC

### 5. 安全性
- 所有 IoT event 必須 HMAC 簽章（防偽造）
- Device firmware 簽章必須符合廠商公鑰
- 異常頻率（如 100 events/sec from same device）→ rate limit + 警示
- IoT Ingestion Gateway 不可直連 production DB

### 6. 隱私
- IoT event 含 PII (device_id, customer_id, usage pattern)
- 對應 ADR-0050 可見性 / ADR-0051 retention：
  - 客戶可看自家鎖 IoT history（90 天）
  - 客戶 GDPR forget → 7 天內刪除
  - tamper / 法律相關 → 永久保留

### 7. 多廠商支援
- 不假設單一鎖廠商
- 每家鎖廠商 = 一個 IoT adapter
- Adapter 翻譯廠商專屬格式 → 標準 Event Envelope
- 對應 §C1 IngressChannel 邊界

### 8. 護城河鎖死
此 pipeline 是 §D3 信任 / 生態護城河之一：
- AI 廠商複製不了（需實體鎖 + 用戶授權 + 物理通道）
- 鎖廠商複製不了 AI 客服整合
- 我們站在中間，可累積跨品牌使用資料

## Alternatives Considered

### Option A — 不接 IoT 訊號，純靠對話
- 風險：F7 高（被 AI 巨頭吞噬，無物理護城河）
- 已捨棄

### Option B — IoT 訊號直接觸發工單（無 HITL）
- 風險：F3 邊界漂移 + 誤判
- 已捨棄

### Option C — 只接單一廠商
- 風險：F5 規模困境
- 已捨棄（必須多廠商 adapter）

## Consequences

**Positive**：
- §D3 護城河三柱明文化
- AI 客服體驗 ↑（主動偵測 + 預填）
- 累積跨品牌 IoT 資料（§D1 資料護城河 + §E1 Bronze）
- F7 風險顯著降低

**Negative**：
- IoT Ingestion Gateway 開發成本（adapter + HMAC + rate limit + schema）
- 鎖廠商談判 / 整合成本
- PII / GDPR 合規負擔 ↑

**Mitigation**：
- 先做 1 家廠商 PoC，驗證 schema
- 與 ADR-0050/0051 共用 retention engine
- 鎖廠商整合走 ADR-0056 合約附件規格（合約附 IoT API spec）

## Pre-mortem Mapping

對應 §A F7。把「無法被 LLM agent 複製的物理層」固化為事件流。即使三年後出現 vertical agent，他們仍拿不到我們累積的 IoT 訊號 + 線下師傅履約。

## Eternal/Transient Classification

- **Eternal**：§B5 IoT Event Envelope schema + §C1 IoT Ingestion Gateway 邊界
- **Transient**：每家鎖廠商 adapter、firmware 版本

## Acceptance Criteria
- [x] 業主拍板 2026-05-22：✅ 認同並開啟 IoT pipeline 設計
- [ ] AI Specialist + Backend 撰寫 IoT Event Envelope schema spec
- [ ] Backend 建 IoT Ingestion Gateway（HMAC + schema + rate limit）
- [ ] 鎖廠商 PoC（至少 1 家）走 ADR-0056 合約 + IoT API attach
- [ ] AI 預填 ProblemCard 邏輯實作（per ADR-0033 對齊）
- [ ] `tamper` event → 觸發 ADR-0034 urgent: 安全風險
- [ ] PII 影響評估：IoT history retention 與 ADR-0050/0051 對齊
- [ ] BI 報表：「IoT event → ProblemCard 轉換率」
- [ ] V1.0 後續 Phase：IoT pipeline 進入 roadmap（非 V1.0 必交但屬 §D3 核心）

## See also
- PAIN-POINTS-SUMMARY-2026-05-21.md §A F7
- ACTION-ITEMS-2026-05-22.md MATTER-08
- ADR-0033 ProblemCard completeness gate
- ADR-0034 Urgent / Red Code definition
- ADR-0050 Evidence 可見性 + ADR-0051 Retention
- ADR-0056 廠商合約附件（IoT API attach）
- §D3 信任與生態護城河、§B5 Domain Event Catalog、§C1 IngressChannel
