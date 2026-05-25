---
id: ADR-VCH-002
title: Voucher Retention 7y（hot 2y PG + cold 5y S3 Glacier）+ DPA
status: accepted
date: 2026-05-24
deciders: [CEO (autonomous), ba, dba]
related: [ADR-VCH-001, ADR-0051, ERD §5]
source: MoM #2 (OQ-007 cascade — Q3 業主裁決 = 7y)
---

# ADR-VCH-002: Voucher Retention 7 年

## Context

OQ-007 cascade — voucher 保存期。BA R2 列三條法源：

| 法源 | 保存期 |
|:---|:---|
| 商業會計法 §38 | 會計憑證 5 年、會計帳簿 10 年 |
| 稅捐稽徵法 §11-1 | 5 年 |
| 統一發票使用辦法 §29 | 5 年 |

業主 Q3 選 **7y（取嚴）**。理由：取交集上限（5y 不夠 / 10y 過嚴），業界 SaaS 慣例 B2B SMB 可承受。

## Decision

### 1. 雙層儲存

| Tier | 保存期 | 儲存體 | rehydrate SLA |
|:---|:---|:---|:---|
| Hot | 2y | PostgreSQL primary | n/a（即時 query）|
| Cold | 5y | S3 Glacier Parquet | 12h（稅務查調可接受）|

PITR window 14d 覆蓋 hot tier。

### 2. Partition 策略（DBA 修正）

原 monthly partition 7y = 84 partition → query plan 退化。

改 **yearly partition + monthly sub-partition**（PG14 declarative partitioning）：
- 每年 archive 整個 yearly partition 到 cold（DETACH PARTITION 不 lock）
- monthly close query 只掃當月 sub-partition

### 3. Cold archive job

monthly cron job：
- T+2y end of month → DETACH yearly partition → export Parquet → upload S3 Glacier
- 留 `partition_archive_log` ledger 紀錄哪個 partition / S3 path / Glacier vault

### 4. DPA 條文

寫進 `docs/governance/dpa.md`：
- 「Voucher 資料保存 7 年（hot 2y + cold 5y），符合商業會計法 §38 + 稅捐稽徵法 §11-1 取嚴」
- 「個資（issuer_tax_id 等）依個資法 §11 + GDPR Art.17 可 forget；voucher 本體去識別化保留」
- 「rehydrate SLA 12h（不適用即時查詢）」

### 5. Cost estimate（給業主備忘）

3-5 年規模假設：30 萬戶 × 200 voucher × 7y avg ≈ 4.2 億 row。
- Hot 2y：~1.2 億 row × 1KB ≈ 120GB（PostgreSQL OK）
- Cold 5y：~3 億 row × 0.5KB（Parquet 壓縮）≈ 150GB Glacier
- S3 Glacier Deep Archive：~$0.00099/GB/month ≈ $0.15/month for cold（OPEX 可忽略）

## Consequences

### 正面
- 取嚴 7y 滿足台灣 + GDPR 雙合規
- yearly+monthly partition 避免 84 partition query plan 退化
- cold tier 成本可忽略（Glacier Deep Archive）
- 12h rehydrate SLA 對稅務查調可接受

### 負面
- monthly archive cron job 需 ops 維護
- 跨 tier rehydrate 流程要演練（避免 cold 出問題時找不回）
- DPA 條文 7y 高於業界 5y（B2B SMB 可承受但要明示）

### 中性
- 若未來上 ADR-VCH-001 issuer 升級（變開立人），retention 仍 7y（沒影響）

## NFR 達成
- NFR-Comp-001~006（合約 / DORA）
- NFR-Priv-001~008（PII keeper-controller）
- NFR-Ops-001~004（cold archive job runbook）

## Failure Modes

| Mode | Blast Radius | Mitigation |
|:---|:---|:---|
| Cold archive job fail | 帳本不齊 | DLQ + alert + 人工 rerun |
| Glacier rehydrate > 12h | 稅務查調超時 | SLA 寫進 DPA 預期值；提早 24h request |
| Partition pruning regression | query 變 seq scan | 每季 EXPLAIN 驗證 |
| Hash chain rehydrate 驗證失敗（cold tier）| 帳本不可信 = 合規崩潰 | nightly verify job + alert（連動 BR-AUDIT-007）|

## Acceptance Criteria
- ✅ Hot 2y PostgreSQL + cold 5y S3 Glacier 部署
- ✅ Yearly+monthly partition migration drilled in staging
- ✅ Monthly archive cron job + DLQ
- ✅ Rehydrate SLA 12h 演練 1 次
- ✅ DPA 條文 7y 法務 sign-off
- ✅ Cost estimate $0.15/month/30 萬戶 確認

## Cross References
- MoM #2: `.claude/context/devteam/meetings/2026-05-24-1500-finance-voucher-spec/MoM.md`
- ADR-VCH-001 keeper 路線
- ADR-0051 Evidence retention（不同 retention table 但同設計模式）
- ERD §5 yearly+monthly partition spec
- Runbook §8 backup（含 cold archive runbook）
