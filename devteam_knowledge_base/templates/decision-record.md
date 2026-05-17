# DR-<NNN> — <Decision Title>

> **Type**: Decision Record（非架構性，產品 / 流程 / 局部設計）
> **Status**: Proposed | Accepted | Superseded by DR-<NNN>
> **Date**: <YYYY-MM-DD>
> **Owner role**: <pm | analyst | ux | qa | ops>
> **Scope**: <feature / process>

---

## Context
- 什麼觸發這個變更
- 涉及哪些已 frozen 的文件

## Drivers
- <為什麼要改：新需求 / stakeholder feedback / metric 不如預期 / 法規>

## Decision
- 改成什麼
- 不改什麼

## Affected Documents

| 文件 | 預期影響 | 嚴重度 |
|:-----|:---------|:-------|
| docs/<path> | <how it changes> | stale-major / stale-minor |

## Consequences
- **Positive**: ...
- **Negative**: ...
- **Follow-up work**: ...

## Approval
- 業主裁決日期: <YYYY-MM-DD>
- Cascade policy 套用: manual_confirm / auto_cascade / ignore
- 後續執行：
  - [ ] 標下游 stale
  - [ ] 重跑 driver <list>
  - [ ] 更新 documents/index.json
  - [ ] 寫入 adr-ledger.json
