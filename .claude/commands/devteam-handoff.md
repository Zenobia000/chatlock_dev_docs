---
description: 所有 7 個 freeze gate 通過後，產出 specs/<feature>/handoff.md 給外部 coding agent 接手。
---

# DevTeam Handoff to Coding Agent

讀 state.json + documents/index.json + adr-ledger.json，套 `devteam_knowledge_base/templates/handoff.md`，產出對外契約。

## 使用方式

```
/devteam-handoff <feature>                  # 產 specs/<feature>/handoff.md
/devteam-handoff <feature> --partial        # 即使尚未全部 freeze 也產出（會標警告）
/devteam-handoff <feature> --refresh        # 重新生成（取代既有 handoff.md）
```

## Pre-conditions

預設要求：所有 7 個 freeze gate `passed`（除非用 `--partial`）

- Gate1_PRD: passed
- Gate2_UXFlow: passed
- Gate3_SystemSpec: passed
- Gate4_NFR_ADR: passed
- Gate5a_APIContract: passed
- Gate5b_DBSchema: passed
- Gate6_TestReady: passed
- Gate7_Release: passed

未全 passed → 報告差距，建議用 `--partial` 或先完成 freeze。

## 輸出

`specs/<feature>/handoff.md`，含：

- **Frozen Artifacts**: path + version + sha + frozen_at + owner
- **Acceptance Criteria**: 從 system spec UC 萃取
- **API Contract Ref**: OpenAPI path + version + breaking-change policy
- **DB Migration Ref**: migration scripts + rollback ref
- **Out of Scope**: coding agent 不該動的範圍
- **Test Plan Ref + Exit Criteria**
- **Runbook Ref**
- **Rollback Plan Ref**
- **ADR Index**: only-relevant ADR for coder
- **Telemetry Hooks**: event/metric 對應的 emission 點
- **Open Questions for Coder**: 給 coding agent 看的歧義點
- **不變式**: coding agent 必須遵守的約束（不改 frozen 文件、API 維持 backward compat、migration 必有 rollback、新功能回呼業主 etc.）

## 後續

業主可：
1. 把 `specs/<feature>/handoff.md` 連同 `docs/` 整包丟給 Claude Code / Cursor / Aider
2. coding agent 從 handoff.md 一個入口開工，不需要再讀 11 份分散文件
3. coding agent 若發現歧義 → 回呼 `/devteam-<role>` 觸發 ADR/DR
