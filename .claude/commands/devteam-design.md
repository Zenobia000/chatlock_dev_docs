---
description: DevTeam Design driver（SD+DBA）。產 OpenAPI / ERD / Migration / Module Design；對應 Gate 5a + 5b。
---

# DevTeam Design Driver

載入 **devteam-design** skill。

## 使用方式

```
/devteam-design                                # 接續推進 API + Schema
/devteam-design "新增 /refund 端點"             # API 迭代
/devteam-design "加 order_status enum 'refunded'" # Schema 變更
```

## 產出位置

- `docs/api/openapi-<service>.yaml`
- `docs/data/erd-<feature>.md`
- `docs/data/migrations/<id>-up.sql` + `<id>-down.sql`
- （可選）`docs/architecture/c4-l3-<container>.md`

## Gate 5a (API) 條件
- OpenAPI 3.x 完整（endpoint + schema + auth + errors）
- Idempotency / rate limit / timeout 明示
- Mock server 可生成
- x-governance 寫好

## Gate 5b (Schema) 條件
- Logical + Physical model 完整
- Migration up + down 演練通過
- Backfill 策略可行
- PII / retention / index 標記完成
