---
id: ADR-0012
date: 2026-05-09
title: Notification Channel Strategy — V1.0 / V1.5+ 通知 channel 策略
phase: DESIGN
gate: TR4
status: accepted
owners:
  - PM
  - Tech Lead
  - Product Designer
related:
  - "[[_flows-bdd-test/v-model-right/E7x--test-plan-and-readiness]]"
  - "[[02-design/specs/sla-policy]]"
  - "[[decision-log/E7x--pm-alignment-Q1-Q10]]"
last_reviewed: 2026-05-07
---

> 
> **🔄 Migration Status (2026-05-28)**: `STILL_VALID_UNDER_M16`
> **Reviewed against**: 2026-05-20 final spec (xlsx)
> **Reviewed on**: 2026-05-28
> **Module scope**: M16
> **Per ADR-0100 §1 classification** (.claude/context/devteam/meetings/2026-05-27-1130-final-spec-migration-strategy/MoM.md)


# 通知 Channel 策略（Notification Channel Strategy）

## 0. Purpose

本文件為 V1.0 / V1.5+ 通知 channel 之 **唯一策略文件**，提供：
1. V1.0 範圍：only LINE，明確拒收非 LINE 用戶
2. V1.5+ 規劃：SMS / Email / FCM 評估時程
3. 抽象層設計提示（為 V1.5+ 預留 per-channel adapter pattern）

**對應 PM 拍板**：
- [[decision-log/E7x--pm-alignment-Q1-Q10|Q8=A]]：V1.0 only LINE，**範圍縮小**；通知 channel 抽象層降級至 V1.5+

## 1. V1.0 範圍：LINE Only

### 1.1 涵蓋情境
- 工單派發通知（技師端）
- 工單狀態更新（消費者端）
- 紅色警報升級（管理端）
- 客訴 / 退款進度（消費者 + 管理端）
- 月結爭議通知（客戶端）

### 1.2 拒收非 LINE 用戶
- **註冊流程**：必須完成 LINE 綁定才能成為平台用戶
- **錯誤訊息**：「目前僅支援 LINE 通知，請先加入官方帳號」
- **Edge case**：技師若未綁 LINE → 無法被派工（dispatch_engine 過濾）

### 1.3 LINE Channel 實作
- **Push API**：`agent/core/line_bot.py` 已封裝
- **Flex Message**：技師端工單卡用 Flex；消費者端進度用 Bubble
- **Quick Reply**：互動按鈕（接單 / 拒單 / 查狀態）
- **Webhook**：`agent/app.py` `POST /webhook` 處理事件

### 1.4 失敗處理
- LINE API 失敗 → retry 3 次（exponential backoff: 1s / 5s / 15s）
- 3 次仍失敗 → 寫 `notifications.failed` table → dashboard 警報
- **不 fallback 到其他 channel**（V1.0 限制）

## 2. V1.5+ 規劃：多 Channel 評估

| Channel | 預計排程 | 採購難度 | 主要用途 |
|---|---|---|---|
| **SMS** | V1.5（2026 Q4）| 低（多家國內供應商）| 紅色警報 fallback / 月結爭議催收 |
| **Email** | V1.5（2026 Q4）| 低（SES / SendGrid）| 月結對帳單 / 報表寄送 |
| **FCM**（Android）| V2.0（2027 Q1）| 中（需 Firebase 專案）| 技師端 native app |
| **APNs**（iOS）| V2.0（2027 Q1）| 中（需 Apple Developer）| 技師端 native app |

### 2.1 採購評估面向
- 月成本（含 AUS 預估流量 ×3）
- 國內 / 跨境 SLA
- API 穩定性（看官方 status page 1 年紀錄）
- 失敗回報機制（webhook callback）
- 法規遵循（個資法、TLS 1.3）

## 3. V1.5+ 抽象層設計提示（per-channel adapter pattern）

> 本節為 V1.5+ 實作 hint，**V1.0 不需實作**。

### 3.1 介面設計
```python
# api/services/notification/channels/base.py
class NotificationChannel(ABC):
    @abstractmethod
    async def send(self, recipient: Recipient, message: Message) -> SendResult: ...

    @abstractmethod
    async def can_handle(self, recipient: Recipient) -> bool: ...
```

### 3.2 實作範例
```python
class LineChannel(NotificationChannel): ...
class SmsChannel(NotificationChannel): ...
class EmailChannel(NotificationChannel): ...
```

### 3.3 路由策略
- **Primary + Fallback**：依 user preference 取主要 channel；失敗 N 次後 fallback
- **Multi-channel broadcast**：紅色警報同時推 LINE + SMS
- **User opt-out**：每 channel 有獨立 opt-out 設定

### 3.4 配置存放
- `api/config.toml` `[notification]` section
- 各 channel 的 API key 透過 GCP Secret Manager 注入

## 4. 影響範圍

- **V1.0 後端**：`api/services/notification_service.py` 僅實作 LineChannel；不需抽象層
- **V1.0 前端**：客戶設定頁不顯示 channel preference 選項（僅顯示 LINE 綁定狀態）
- **V1.5+ 後端**：抽象層 + 2 channel（SMS / Email）
- **V2.0+ 後端**：FCM / APNs 整合（含 mobile push token 管理）

## 5. Verification

- [ ] V1.0：grep `notification_service.py` 不含 SMS / Email / FCM import
- [ ] V1.0：註冊流程 BDD scenario 涵蓋「未綁 LINE → 拒絕註冊」
- [ ] V1.0：技師端 dispatch_engine BDD 涵蓋「未綁 LINE → 不出現在候選清單」
- [ ] V1.5+：抽象層介面設計 review（待 V1.5 spec 補充本文 §3 詳細）

## 6. Change Log

| Date | Author | Change |
|------|--------|--------|
| 2026-05-07 | Claude (assisted) | 初版：V1.0 LINE only + V1.5+ 規劃 + 抽象層設計提示（Q8=A 拍板，範圍縮小） |
