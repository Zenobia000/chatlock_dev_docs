---
description: DevTeam Architect driver。產 C4 / ADR / NFR matrix；對應 Gate 4。
---

# DevTeam Architect Driver

載入 **devteam-arch** skill。

## 使用方式

```
/devteam-arch                               # 接續推進 NFR + C4 + ADR
/devteam-arch "決定 event bus 用 Kafka"      # 觸發新 ADR
/devteam-arch "把 SLO 從 99.5% 收到 99.9%"   # NFR 變更（會觸發 cascade）
```

## 產出位置

- `docs/architecture/c4-l1-<feature>.md`
- `docs/architecture/c4-l2-<feature>.md`
- `docs/architecture/c4-l3-<container>.md`（按需）
- `docs/architecture/adr/ADR-<NNN>-<topic>.md`

## Gate 4 條件

- NFR matrix 9 維度都有值或 TBD
- C4 L1 + L2 完整
- 至少 1 份 ADR 涵蓋主要技術選型
- Failure modes 至少 5 個
- Observability 需求前置列出
