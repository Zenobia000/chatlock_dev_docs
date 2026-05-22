# PRD / FR / NFR / 技術架構 文件包

> 打包日期：2026-05-21
> 來源：`docs/` (Smart-Lock AI Support & Service Dispatch SaaS Platform)
> 總計：66 份 markdown 文件

⚠️ **此資料夾為 snapshot 副本，非 source of truth。請以原路徑為準，避免在此編輯造成漂移。**

---

## 結構

```
4-prd-fr-arch/
├── 01-prd/                  # 4 份 — PRD + SOW + 主管藍圖
├── 02-fr/                   # 25 份 — Functional Requirements
├── 03-nfr/                  # 1 份 — 非功能性 (前端品質屬性)
└── 04-architecture/         # 36 份
    ├── ARCH-0001            # 系統架構總覽 (SAD)
    ├── DDD-0001             # 領域模型
    ├── module-boundary/     # 4 份 — agent / api / web / data-pipeline
    └── adr/                 # 30 份 — ADR-0001 ~ ADR-0030
```

---

## 1. PRD 產品需求 (`01-prd/`)

| 檔名 | 原路徑 |
|---|---|
| PRD-0001-2026-q1-v1-launch.md | docs/4-exploration/ |
| SOW-0001-2026-q1.md | docs/4-exploration/ |
| BIZ-0001-executive-architecture-overview.md | docs/4-exploration/ |
| DISC-0001-blueprint-snapshot-2026-05-16.md | docs/4-exploration/ |

## 2. FR 功能需求 (`02-fr/`)

FR-0001 ~ FR-0025（25 份），原路徑 `docs/2-contracts/functional-requirements/`。

涵蓋：LINE Intake、Problem Card Triage、Auto/Manual Dispatch、Technician Accept、Onsite Photo、Material Request、Scope Change、Completion Sign、Reschedule、Payment、Settlement、Dual-Sign Dispute、Refund、Warranty Claim、SLA、SOP Draft Review、CS Takeover、RBAC、Audit Log、Dashboard Reports、Consumer Tracking、Error/Offline Page、Webhook HA、Multimodal Understanding。

## 3. NFR 非功能需求 (`03-nfr/`)

**目前無獨立 NFR-XXXX 檔案**，內容散落於以下文件章節：

| 文件 | 章節 | 位置 |
|---|---|---|
| PRD-0001-2026-q1-v1-launch.md | §4.2 非功能性需求 (NFRs) | L307 |
| SOW-0001-2026-q1.md | 非功能性需求目標 NFR Targets | L326 |
| ARCH-0001-architecture-overview.md | §2.2 非功能性需求 | L555 |
| PRIN-0002-frontend-quality-attributes.md | 前端品質屬性原則 | 全文 |

> 建議後續拆 `docs/2-contracts/non-functional-requirements/NFR-XXXX-*.md` 補齊 tier-2 契約。

## 4. 技術架構 (`04-architecture/`)

### 4.1 總覽
- `ARCH-0001-architecture-overview.md` — 系統架構總覽（SAD）
- `DDD-0001-domain-model.md` — 領域模型

### 4.2 模組邊界 (`module-boundary/`)
- ARCH-0002 agent
- ARCH-0003 api
- ARCH-0004 web
- ARCH-0005 data-pipeline

### 4.3 ADR (`adr/`) — 30 份

重點選讀：

| ADR | 主題 |
|---|---|
| ADR-0001 | Backend Framework |
| ADR-0002 | Database Selection |
| ADR-0003 | LLM Integration Framework |
| ADR-0004 | LINE Bot Architecture |
| ADR-0005 | Frontend Framework v2 |
| ADR-0006 | LLM Model Selection |
| ADR-0007 | LLM Registry Pattern |
| ADR-0008 ⭐ | Product Info Architecture (Canonical) |
| ADR-0009 | Agent-Admin Bridge Pattern |
| ADR-0010 ⭐ | Belief-Augmented ReAct |
| ADR-0011 | i18n Strategy |
| ADR-0012 | Notification Channels |
| ADR-0013~0022 | PM Alignment Q1~Q10 |
| ADR-0023 | Tactical Refactor 2026-Q2 |
| ADR-0024 | Tier1 Refactor Revised |
| ADR-0025 | Harness Branching Pipeline |
| ADR-0026 | Memory Architecture |
| ADR-0027 | Model Routing Policy |
| ADR-0028 | AI Employee Charter |
| ADR-0029 | Fail-Soft to Durable Three-Pack |
| ADR-0030 | Tenant ID Propagation |

---

## 重建這個 bundle

```bash
BUNDLE_DIR="docs/_bundles/4-prd-fr-arch"
mkdir -p "$BUNDLE_DIR"/{01-prd,02-fr,03-nfr,04-architecture/module-boundary,04-architecture/adr}

cp docs/4-exploration/PRD-0001-2026-q1-v1-launch.md "$BUNDLE_DIR/01-prd/"
cp docs/4-exploration/SOW-0001-2026-q1.md "$BUNDLE_DIR/01-prd/"
cp docs/4-exploration/BIZ-0001-executive-architecture-overview.md "$BUNDLE_DIR/01-prd/"
cp docs/4-exploration/DISC-0001-blueprint-snapshot-2026-05-16.md "$BUNDLE_DIR/01-prd/"

cp docs/2-contracts/functional-requirements/FR-*.md "$BUNDLE_DIR/02-fr/"
cp docs/0-principles/PRIN-0002-frontend-quality-attributes.md "$BUNDLE_DIR/03-nfr/"

cp docs/1-decisions/ARCH-0001-architecture-overview.md "$BUNDLE_DIR/04-architecture/"
cp docs/1-decisions/DDD-0001-domain-model.md "$BUNDLE_DIR/04-architecture/"
cp docs/1-decisions/module-boundary/ARCH-000*.md "$BUNDLE_DIR/04-architecture/module-boundary/"
cp docs/1-decisions/ADR-*.md "$BUNDLE_DIR/04-architecture/adr/"
```
