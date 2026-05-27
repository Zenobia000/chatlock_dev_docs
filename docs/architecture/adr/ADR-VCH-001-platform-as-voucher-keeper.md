---
id: ADR-VCH-001
title: Platform = Voucher Keeper（非 Issuer）合規路線
status: accepted
date: 2026-05-24
deciders: [CEO (autonomous), ba, pm, dba, sd]
related: [ADR-VCH-002, BR-VCH-001-012, ERD §5]
source: MoM #2 (OQ-007 cascade — Q2 業主裁決 = keeper)
---

> 
> **🔄 Migration Status (2026-05-28)**: `STILL_VALID_UNDER_M11_M16`
> **Reviewed against**: 2026-05-20 final spec (xlsx)
> **Reviewed on**: 2026-05-28
> **Module scope**: M11, M16
> **Per ADR-0100 §1 classification** (.claude/context/devteam/meetings/2026-05-27-1130-final-spec-migration-strategy/MoM.md)


# ADR-VCH-001: Platform = Voucher Keeper

## Context

OQ-007 業主裁決「記帳憑證先行定義」。Roundtable #2 4 龍蝦 + 業主 Q2 確認：Platform 是「保管帳本者（keeper）」，不是「開立發票者（issuer）」。

Trade-off frame：
- **Issuer**：平台收所有客戶錢、開發票、報營業稅 → 需稅籍登記 + 開票責任 + 可能踩第三方支付專法
- **Keeper**：平台只記帳本 + 存 voucher reference，發票由師傅自己開 → 商業會計法 §33 keeper-only OK

業主選 keeper（A），blast radius 限縮在 SaaS 平台範疇，不變身金流業者。

## Decision

### 1. Platform 法律定位 = Keeper

- 客戶付款給師傅（不是付給平台），平台代收代付 + 記 voucher
- 發票由師傅自己開（個人收據或工作室發票），平台不開發票
- 平台**自己的收入**（服務費 / 平台費 / 分潤抽成）才開自己的發票

### 2. 法源支撐（BA 確認）

- 商業會計法 §33（憑證由帳務處理者保管）— keeper-only OK
- 商業會計法 §83（足資證明事項之經過）— 平台須證明 immutability（append-only + hash chain，沿用 ADR-0061 模式）
- 個資法 §27（保有者安全維護義務）— keeper 即 controller，PII export 不豁免
- 統一發票使用辦法 §29（發票本身由「開立人」保存）— 平台只存 reference 不存影像

### 3. Schema 設計（連動 ERD §5）

```sql
journal_entry / voucher 表須含：
- issuer_party ENUM('platform', 'locksmith', 'brand')  -- 標明這筆是誰開的發票
- tax_doc_ref JSONB CHECK (... 'type', 'doc_id', 'issuer_tax_id')  -- 指向外部稅務憑證
- legal_basis ENUM('TAX_ACT_§38', 'BIZ_ACCT_§11_1', 'BOTH')  -- 保存期法源
```

### 4. 三方 sign-off matrix（W18 hard DoR for V2，Q1=D 允許彈性）

甲方 PM + 甲方會計 + 法務三方須在 V2 sprint planning 前簽 BR-VCH-001~012 共 12 條 business rule。

### 5. 三條件式履約（BA R2）

1. event log append-only + hash chain（連動 BR-AUDIT-007）
2. 三方 sign-off matrix 完成
3. retention 7y 寫進 DPA（ADR-VCH-002）

### 6. Out-of-scope（V1 明確排除）

- 政府電子發票 ED4 對接（V2.1 export endpoint）
- 第二甲方 / 多租戶（OQ-NEW-3 業主裁決延後）
- 平台變身 issuer（需稅籍登記 + 發票機制，至少延 4-6 sprint）
- 退款 5×3 分層的會計科目對映（V2 P2 細化）

## Consequences

### 正面
- V1 可上線（不需稅籍登記 + 發票系統）
- 平台責任邊界清楚（不是金流業者）
- 商業模式 SaaS pure-play，scope 不爆
- BA 確認 keeper 在台灣法規站得住（3 條法源 + 1 條件 / 3 條限制）

### 負面
- 客戶報帳時公司抬頭是師傅 / 工作室名（不是平台 brand）
- 若未來想做月費訂閱 / 賣設備收平台名 → 須走 issuer 升級路線（另開 roundtable + 4-6 sprint）

### 中性
- DPA / 法務一頁式備忘須補書面 control description（不只 code）

## NFR 達成
- NFR-Comp-001~006（合約 / DORA）
- NFR-Aud-001~006（憑證 audit chain）
- NFR-Priv-001~008（PII as keeper-controller）

## Acceptance Criteria
- ✅ Schema 加 `issuer_party` + `tax_doc_ref` + `legal_basis` 三欄
- ✅ BA 起草 data dictionary + BR-VCH-001~012 共 12 條
- ✅ 三方 sign-off matrix 在 V2 sprint planning 前完成
- ✅ 法務 sign-off keeper 路線（一頁式備忘，類似家族覆核備忘）

## Cross References
- MoM #2: `.claude/context/devteam/meetings/2026-05-24-1500-finance-voucher-spec/MoM.md`
- ADR-VCH-002 retention 7y
- BR-VCH-001~012（待 BA 撰寫）
- ERD §5 update（待 DBA）
- OpenAPI voucher section（待 SD）
