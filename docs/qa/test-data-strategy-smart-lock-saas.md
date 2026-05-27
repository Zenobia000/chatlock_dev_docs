---
id: test-data-strategy-smart-lock-saas
title: Test Data Strategy — Smart Lock SaaS (Phase I MVP)
status: draft
phase: I
gate: 6 (Test Ready)
owner: devteam-qa
date: 2026-05-28
parent_doc: docs/qa/test-plan-smart-lock-saas.md
sibling_docs:
  - docs/qa/test-plan-cascade-strategy-2026-05-28.md
  - docs/qa/automation-coverage-map.md
mapped_to:
  - M03 (RBAC)
  - M04 (Pricing)
  - M11 (Settlement)
  - M13 (Warranty)
  - M15 (Cancellation / Exception)
  - M17 (Audit / DGS)
  - M18 (Config)
related_adrs:
  - ADR-0050   # evidence visibility matrix
  - ADR-0051   # PII retention
  - ADR-0067   # M18 config governance
  - ADR-0068   # M18 anti-corruption layer
  - ADR-0102   # cancellation tiers
  - ADR-0044   # warranty modes
  - ADR-0040   # refund SoD
---

# Test Data Strategy — Smart Lock SaaS (Phase I MVP)

> 對應 Gate 6 Test Ready。台灣 0-1 SaaS pragmatic：先覆蓋 P0 happy + 主要 alt，例外流容忍但 audit 必驗。
>
> **核心原則**：
> 1. fixture 以「客戶旅程 + tenant 邊界 + RBAC 角色」三維鋪設，不為 entity 而 fixture
> 2. PII 一律 anonymize（生成 + masking + scrub），prod-like 但無真人外洩
> 3. 場景化 fixture 以 6-stage cancellation / 5-mode warranty / SoD 三維為主軸
> 4. Phase II / nice-to-have 標 `defer`，不擋 Gate 6

---

## §1 Tenant 邊界 Fixture（Multi-Tenancy Isolation）

| Fixture ID | 名稱 | 用途 | RLS 驗證 |
|:-----------|:-----|:-----|:---------|
| `TENANT-B2C-001` | 一般家戶（B2C 個人）| 直接消費場景；無建商 / 品牌綁定 | `tenant_id=B2C-001` only 可見自己 customer / device / wo |
| `TENANT-B2B-BUILDER-001` | 建商客戶 A | Project 綁定；warranty 起算 = handover_date | builder_001 看不到 builder_002 / brand_001 資料 |
| `TENANT-B2B-BUILDER-002` | 建商客戶 B | 對照組（cross-tenant negative test）| 同上 |
| `TENANT-B2B-BRAND-001` | 品牌商 A | Brand → Model → Device 維護；查詢自家保固單 | brand_001 看不到 brand_002 / builder 資料 |
| `TENANT-B2B-PROJECT-001` | 建案 A | 屬 builder_001 子層；500 戶 device pool | RLS 透過 builder_id descend 驗 |

**Cross-tenant negative fixture**：每對 tenant 至少 1 個 read attempt + 1 個 write attempt（POST/PATCH/DELETE），預期 403/404 + audit log 寫 `cross_tenant_violation_attempted`。

---

## §2 智慧鎖場景 Fixture（5 種 Warranty Mode）

對應 ADR-0044 v2 + BR-WARRANTY-001..007。

| Fixture ID | Device serial | install_date | warranty_mode | warranty_end_date | RMA history | 用途 |
|:-----------|:--------------|:-------------|:--------------|:------------------|:------------|:-----|
| `DEV-WM-001` | SL-2025-00001 | 2025-06-01 | `from_install` | 2026-06-01 | 無 | 一般家戶 default mode |
| `DEV-WM-002` | SL-2025-00002 | (建案 N/A) | `from_handover` | handover + 365d | 無 | B2B 建案 mode |
| `DEV-WM-003` | SL-2025-00003 | 2025-01-01 | `from_install` | 2025-12-30 | 2025-08-15 ~ 2025-08-22 送修 7d | RMA 後延長 7d 計算 verify (BR-WARRANTY-005 §1) |
| `DEV-WM-004` | SL-2025-00004 | 2025-01-01 | `from_install` | 2025-12-31 | 2025-09-01 換馬達零件 | 換新零件 part-level 90d 獨立重算 verify |
| `DEV-WM-005` | SL-2025-00005 | 2024-06-01 | `from_install` | 2025-06-01 | (保固已過) | out-of-warranty quote 場景 |

**Negative fixture（DEV-WM-NEG-*）**：
- `DEV-WM-NEG-001` — serial NULL → 預期 422 (BR-A02-01 + ADR-0053 serial mandatory)
- `DEV-WM-NEG-002` — install_date > today → 預期 422 (BR-WARRANTY-001 起算日有效性)
- `DEV-WM-NEG-003` — RMA 循環送修（同 device 月內 3 次）→ 預期 ops_manager 警示（BR-WARRANTY-005 anti-abuse）

---

## §3 客戶旅程 Fixture（6-Stage Cancellation + 退款 + 保固）

對應 FR-0010 + ADR-0102 + BR-CANCEL-001..008。

### §3.1 Cancellation 6-Stage Fixture（fee tier 完整覆蓋）

每一階段配 1 個 happy + 1 個 alt（共 12 fixture）。

| Fixture ID | 階段 | WO state | Expected fee | reason_code | 對照 BR |
|:-----------|:-----|:---------|:-------------|:------------|:--------|
| `CXJ-S1-H` | S1 報價未確認 | quote_sent_unconfirmed | NTD 0 | C-CHANGE_MIND | BR-CANCEL-001 |
| `CXJ-S1-ALT` | S1 + 客服 override 嘗試調高 fee | quote_pending | NTD 0（hard zero）| B-OUT_OF_STOCK | BR-CANCEL-001 §constraints |
| `CXJ-S1.5-H` | S1.5 已確認未派工 | quote_confirmed + technician_id NULL | NTD 0 | C-CHANGE_MIND | BR-CANCEL-002 |
| `CXJ-S2-H` | S2 派工未出發 | dispatched + gps=not_departed | NTD 300 | C-FOUND_CHEAPER | BR-CANCEL-003 |
| `CXJ-S2-ALT` | S2 客服 override 50% 調降 | dispatched | NTD 150 + 主管覆核 audit row | C-FOUND_CHEAPER | BR-CANCEL-003 + FR-0010 AC-08 |
| `CXJ-S3-H` | S3 出發後 | en_route | NTD 500（含車馬，ADR-0041 split）| B-PRICE_DISPUTE | BR-CANCEL-004 |
| `CXJ-S4-H` | S4 到場後未施工 | on_site + work_started=false | NTD 800 | C-CHANGE_MIND | BR-CANCEL-005 |
| `CXJ-S5-H` | S5 已施工 30% | in_progress (progress=0.3) | NTD 800（floor） + 材料 + 車馬 | C-NO_LONGER_NEEDED | BR-CANCEL-006 |
| `CXJ-S5-ALT` | S5 已施工 80% | in_progress (progress=0.8) | proportional ≈ NTD 2,500 + 材料 + 車馬 | B-SCHEDULE_CONFLICT | BR-CANCEL-006 §proportional |
| `CXJ-TECH-001` | 師傅 initiated 首次當月 | dispatched | NTD 0 + tech.weight -5 | T-SICK | BR-CANCEL-007 |
| `CXJ-TECH-002` | 師傅 initiated 同月第 2 次 | dispatched | NTD 500 (技師扣) + tech.weight -10 + auto reassign | T-OVERBOOKED | BR-CANCEL-007 |
| `CXJ-TECH-003` | 師傅 不可抗力（醫療證明）| dispatched | NTD 0 + ops_manager approve audit | T-VEHICLE_ISSUE + evidence FK | BR-CANCEL-007 §force-majeure |
| `CXJ-NEG-001` | 缺 reason code 嘗試 cancel | any | 422 REASON_CODE_REQUIRED | (空) | BR-CANCEL-008 |

### §3.2 退款 SoD Fixture（initiator / approver / executor 三維）

對應 BR-REFUND-006 + ADR-0040 v2。

| Fixture ID | initiator | approver | executor | amount | expected |
|:-----------|:----------|:---------|:---------|:-------|:---------|
| `REF-SOD-001` | csm_a | acct_a | system | NTD 500 | 200 OK + 7-event audit |
| `REF-SOD-002` | csm_a | csm_a | system | NTD 500 | **409 SoD_VIOLATION** (initiator==approver) |
| `REF-SOD-003` | csm_a | sup_a | system | NTD 50,000 | 200 OK + L2 (主管) approve |
| `REF-SOD-004` | csm_a | sup_a | system | NTD 600,000 | 425 + escalate L5 Sponsor (BR-REFUND-006 §rbac-mapping) |
| `REF-SOD-005` | csm_a | sponsor_l5 | system | NTD 600,000 | 200 OK + L5 audit |
| `REF-SOD-NEG-001` | csm_a | acct_a | csm_a (manual) | NTD 500 | **409 SOD_VIOLATION** (initiator==executor 不允許) |

### §3.3 保固 Fixture（warranty mode × RMA × B2B override）

對應 FR-0015 + BR-WARRANTY-001..007。

| Fixture ID | warranty_mode | RMA event | B2B override | expected outcome |
|:-----------|:--------------|:----------|:-------------|:-----------------|
| `WAR-H-001` | from_install | 無 | 無 | 1 year happy path |
| `WAR-H-002` | from_handover | 無 | 建商合約 2y | end_date = handover + 730d |
| `WAR-RMA-001` | from_install | 修 7d → 取回 | 無 | end_date += 7d (BR-WARRANTY-005 §1) |
| `WAR-RMA-002` | from_install | 換馬達零件 | 無 | original end_date 不延長 + 新馬達 part-level 90d 從換裝日（BR-WARRANTY-005 §2 + BR-WARRANTY-007 BOM 階層欄位驗）|
| `WAR-NEG-001` | from_install | 月內 3 次循環送修 | 無 | ops_manager alert + audit `rma_abuse_suspected` |
| `WAR-NEG-002` | from_install | 已過保 + RMA claim | 無 | 422 WARRANTY_EXPIRED |

---

## §4 RBAC + Sponsor SoD Fixture（師傅 L1-L5）

對應 ADR-0040 + ADR-0042 + FR-0019。

| Fixture ID | role | level | permissions | 用途 |
|:-----------|:-----|:------|:------------|:-----|
| `RBAC-CSM-L1` | csm | L1 | view + edit own + initiate refund | 客服基本場景 |
| `RBAC-ACCT-L2` | accounting | L2 | approve refund ≤ NTD 10,000 | refund tier 1 |
| `RBAC-SUP-L3` | supervisor | L3 | approve refund ≤ NTD 100,000 + cancel override | refund tier 2 + cancel override |
| `RBAC-OPS-L4` | ops_manager | L4 | approve refund ≤ NTD 500,000 + force-majeure cancel + ops dashboard | refund tier 3 + 不可抗力 |
| `RBAC-SPONSOR-L5` | sponsor | L5 | approve refund > NTD 500,000 (含 > 公司年收 1%) | refund tier 4 + 最高審 |
| `RBAC-TECH-L1` | technician | L1 | own_wo + onsite report + scope_change ≤ 500 | 師傅標準 |
| `RBAC-TECH-L2` | technician | L2 | + scope_change ≤ 2000 | 資深師傅 |
| `RBAC-TECH-L3` | technician | L3 | + dispatch help backup | lead 師傅 |
| `RBAC-TECH-L4` | technician | L4 | + L1-L3 mentor + cross-region | 區域師傅 |
| `RBAC-TECH-L5` | technician | L5 | + emergency override + family review nominate | sponsor 級技師 |

**SoD violation negative fixture**：
- `RBAC-SOD-NEG-001` — csm_a 同時 initiator + approver → 409
- `RBAC-SOD-NEG-002` — csm_a 嘗試 approve own initiated refund 透過第二個 session → 409 (DB constraint enforcement)
- `RBAC-SOD-NEG-003` — sup_a 嘗試 approve NTD 200,000 (超過 L3 cap) → 425 + escalate to L4

---

## §5 Synthetic Data Generation（pytest factory）

```python
# tests/fixtures/factories.py — pytest-factoryboy
from factory import Factory, Faker, SubFactory, LazyAttribute
from datetime import datetime, timedelta

class TenantFactory(Factory):
    class Meta:
        model = "Tenant"
    tenant_id = Faker("uuid4")
    tenant_type = "b2c"  # override: b2b_builder / b2b_brand / b2b_project
    name = Faker("company", locale="zh_TW")
    created_at = Faker("date_time_this_year")

class CustomerFactory(Factory):
    class Meta:
        model = "Customer"
    customer_id = Faker("uuid4")
    tenant_id = SubFactory(TenantFactory)
    name_enc = Faker("name", locale="zh_TW")     # PII; will be encrypted
    phone_enc = Faker("phone_number", locale="zh_TW")
    line_user_id = LazyAttribute(lambda o: f"U{Faker('uuid4').evaluate(None, None, {'locale': 'en'})[:32]}")

class DeviceFactory(Factory):
    class Meta:
        model = "Device"
    device_id = Faker("uuid4")
    serial = LazyAttribute(lambda o: f"SL-2025-{Faker('random_int').evaluate(None, None, {'locale': 'en', 'min': 10000, 'max': 99999})}")
    brand_id = "BRAND-DEFAULT"
    model_id = "MODEL-DEFAULT"
    install_date = Faker("date_this_year")
    warranty_mode = "from_install"  # override per scenario

# ... factories for WorkOrder / Quote / Refund / Cancellation
```

**規則**：
- 每個 factory **必須** 有 `tenant_id`（multi-tenancy guard）
- PII 欄位用 `Faker(locale="zh_TW")` 生成真實 pattern 假資料
- 不從 prod dump（除非 anonymize pipeline 驗證過）

---

## §6 PII Anonymization Pipeline（甲方歷史 200 筆轉 fixture）

對應 ADR-PII-002 資料極小化雙層防線 + ADR-0051 evidence retention。

| 階段 | 動作 | 工具 |
|:-----|:-----|:-----|
| 1. Extract | 甲方提供 200 筆 historical case（read-only snapshot） | DBA-managed export |
| 2. Anonymize | 姓名 / 電話 / 地址 / LINE id / signature 一律替換 Faker | `tools/anonymize_fixtures.py` (待寫) |
| 3. Scrub | OCR 過 evidence photo 偵測 ID/車牌/門牌 → blur | OpenCV + EasyOCR |
| 4. Validate | re-scan 確認 no PII leak | `tools/scan_pii.py` |
| 5. Store | `tests/fixtures/anonymized/200_cases.json` （commit 到 git）| - |

**Audit**：每次 anonymize 寫 `tests/fixtures/anonymized/_audit.json` 記錄 source row count / anon timestamp / scan pass。

**Cron retention**：anonymized fixture 不過期（已 anon），但 `_audit.json` 保留 7yr 對齊 ADR-VCH-002。

---

## §7 Eval Corpus（AI / Forbidden / Negative case）

| Corpus | 規模 | 用途 | Ownership |
|:-------|:-----|:-----|:----------|
| **K1 標準題** | 50 題 | AI 準確率 baseline | Domain Expert + QA |
| **K1 OOD** | 20 題 | out-of-distribution；驗 AI 不編造 | Domain Expert |
| **K1 對抗** | 10 題 | adversarial prompt | QA |
| **K3 情緒 labeled** | 100 題 | 負面情緒識別 baseline | Domain Expert |
| **K3 反諷 / 雙關** | 20 題 | 不可誤判 | Domain Expert |
| **K8 Forbidden 200** | 200 題（final_quote 40 + discount 30 + warranty_free 30 + legal_safety 30 + cross_tenant 30 + image_moderation 20 + other 20）| block-deploy gate | QA + Domain Expert |
| **K8 Robustness 抽** | 20 題改寫 | 反過擬合驗證 | QA |
| **AUT (utterance)** | 220 題 (200 + 20 補誘導) | D3-B' 句型 verify | QA |
| **W4 baseline** | 60 題 | corpus 未齊時 warn-only block_deploy | QA |

**Corpus rotation**：每 sprint 增 ≥ 10 題（avoid overfitting），不可少於 baseline。

---

## §8 Test Environment Data Profile

| Env | Data Source | PII Status | Refresh Cycle |
|:---|:---|:---|:---|
| **local** | synthetic（factories） | 全假 | dev 隨需 reset |
| **CI** | synthetic + 200 anonymized | 全 anon | per pipeline |
| **staging** | synthetic + 200 anonymized | 全 anon | 每週 reset |
| **shadow (W4-W8)** | real LINE traffic + DB shadow | LIVE PII (read-only, no customer-facing) | 連續 |
| **pre-prod (W13-W15)** | anonymized + 50 sample real (业主同意)| anon + opt-in real | 每 UAT round reset |
| **prod** | live | LIVE PII | - |

---

## §9 Cron Job Test Data（M18 + DGS）

對應 ADR-0067 + ADR-0061 + BR-PII-001b。

| Cron Job | Test Data Fixture | 驗證點 |
|:---------|:------------------|:-------|
| `config_quote_expire_48h` | 48h 前送 quote (T-49h) | cron tick → quote.expired + audit `expired_by_cron` |
| `dgs_purge_t30d_hard_delete` | T0 forget request 30d ago | 硬刪 row + ledger append |
| `legal_hold_notify_7d` | forget request + legal_hold=true | 7d 內 customer notice + audit `gdpr_forget_blocked` |
| `m18_config_observation_30min` | 5% canary 啟動 + 30 min timer | observation window 結束 → auto-promote 50% OR rollback |
| `cancellation_fee_recalc` | S5 in_progress 過 24h 無收尾 | auto-trigger floor NTD 800 |

---

## §10 Defer to Phase II

| Fixture set | 為何 defer | 替代 mitigation Phase I |
|:------------|:----------|:------------------------|
| Part-level warranty fixture (按零件保固) | BR-WARRANTY-007 Phase I 整機 1yr；BOM 欄位預留即可 | unit-level 整機 fixture cover |
| Cross-platform cancellation entry (LINE / Web / 電話統一)| FR-0052 §4 out-of-scope | LINE 單一 entry fixture cover Phase I |
| GDPR self-service portal (LIFF / Web)| FR-0053 placeholder | 客服代客提 forget request fixture |
| Bulk cancel (活動 / 系統異常)| FR-0052 §4 out-of-scope | 單筆 cancel fixture loop |
| AI 自主 final quote | ADR-0047 Forbidden 永久 | D3-B' 句型 fixture |
| Phase II FR-0044~0051 fixture | 統一 Phase II 啟動再建 | Phase I 標 `@pytest.mark.skip("Phase II")` |

---

## §11 Open Questions / [VALUE_DECISION_NEEDED]

| # | 議題 | 提案 | 建議 |
|:--|:-----|:-----|:-----|
| OQ-TDS-01 | 甲方 200 筆 historical case **是否同意** anonymize 後 commit 到 public git？ | A) commit B) gitignore + 私有 LFS | [VALUE_DECISION_NEEDED] — 業主判 |
| OQ-TDS-02 | Synthetic factory 是否 cover 建商 / 品牌商 fixture seed？ | A) 全自動 generation B) 手動腳本 seed | A |
| OQ-TDS-03 | shadow run W4-W8 是否拍照前需 LINE 內客戶 opt-in？ | A) 需 opt-in B) 隱式同意 | [VALUE_DECISION_NEEDED] — 法務 / DPO judge |
| OQ-TDS-04 | Cron job test data 是否走 fast-forward time (libfaketime) | A) 真 sleep B) time mock | B（避免 CI 卡 30 min）|

---

## §12 Cross-references

- 主 test plan: [test-plan-smart-lock-saas.md](test-plan-smart-lock-saas.md)
- Cascade strategy: [test-plan-cascade-strategy-2026-05-28.md](test-plan-cascade-strategy-2026-05-28.md)
- Automation coverage map: [automation-coverage-map.md](automation-coverage-map.md)
- ERD: [docs/architecture/data/erd-smart-lock-saas.md](../architecture/data/erd-smart-lock-saas.md)
- DDL: [docs/architecture/data/ddl-migration-001-init.sql](../architecture/data/ddl-migration-001-init.sql)
- BR catalog: docs/analysis/br/ (122 files)
- FR catalog: docs/analysis/fr/ (53 files)
