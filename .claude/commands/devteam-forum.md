---
description: Forum-Lite 多輪辯論。對指定文件啟動 proposer + 動態 critics + facilitator 的 2-3 輪辯論流程，max 3 rounds，超過強制升級業主。
---

# DevTeam Forum-Lite

Lane B 多輪辯論。Lane A critique pipeline 出現 `Conflicts ≥ 2` 時自動提示升級到此，或業主主動觸發。

## 使用方式

```
# 從既有 critique 升級
/devteam-forum docs/api/openapi-billing.yaml --from-review=Gate5a-billing-2026-05-18

# 業主主動發起，自動推斷 personas
/devteam-forum docs/architecture/adr/ADR-007.md

# 明指 personas
/devteam-forum docs/prd/feature-x.md --personas=pm,qa,sre --rounds=3

# 業主從議題描述發起（非單一文件）
/devteam-forum "支付重試策略要不要 idempotency key" --personas=sd,sre,dba
```

## 參數

- `<doc-or-topic>`（必填）：目標文件路徑或議題一句話
- `--personas=A,B,C`：override 自動推斷。**必須是 12 既有 personas 之一**（pm/po/ba/sa/ux/ui/arch/sd/dba/qa/devops/sre）。不在清單會被拒絕
- `--rounds=2|3`：上限 3，預設 3
- `--from-review=<review-id>`：引用 Lane A review report 作為 R1 輸入

## 操作流程

### Phase 0: 解析與驗證

1. 解析 doc-or-topic（若是路徑驗證存在；若是議題建臨時 topic.md）
2. 驗證 `--personas` 每個都在 12 既有清單，否則拒絕並顯示完整清單
3. 若無 `--personas`，由 router 用 LLM 從議題描述推斷（從 12 既有挑選）+ 顯示給業主確認
4. 產生 `topic_id` = `<YYYY-MM-DD-HHmm>-<topic-slug>`

### Phase 1: 建立 Forum

1. 建立 `.claude/context/devteam/forum/<topic-id>/` 與 `round-1/`、`round-2/`、`round-3/` 目錄
2. 套 `devteam_knowledge_base/templates/forum-topic.md` 寫 `topic.md`（元資料）
3. 更新 `state.json.active_forums[]` 加新 entry，status=in_progress、current_round=1

### Phase 2: Round 1 — Proposer 提案

Dispatch `devteam-proposer` agent（mode=R1）：
- 讀 target doc + from-review（若有）+ topic.md
- 產出 `forum/<topic-id>/round-1/proposer.md`（議題 + dimensions + trade-off 選項 + proposer 傾向）

### Phase 3: Round 2 — Critics 並行 Critique

並行 dispatch 指定 personas 的 critique agents（沿用 `.claude/agents/devteam-<persona>-persona.md`）：
- 每個 agent 讀 `forum/<topic-id>/round-1/proposer.md`
- 用標準 persona critique 格式寫 `forum/<topic-id>/round-2/<persona>.md`

### Phase 4: Facilitator 第一次判定

Dispatch `devteam-facilitator`：
- 跑三訊號 AND
- R2 後 (a) 必然 fail（沒有前一輪可比） → 必然 continue
- 進入 Round 3

### Phase 5: Round 3 — Proposer 回應

Dispatch `devteam-proposer`（mode=R3）：
- 讀所有 R2 critique
- 對每條 blocker 明文 accept / reject / modify + 修案
- 寫 `forum/<topic-id>/round-3/proposer-response.md`

### Phase 6: Round 3 末段 — Critics Acknowledge

並行 dispatch critics agents（mode=acknowledge）：
- 讀 proposer-response.md
- 寫 `forum/<topic-id>/round-3/<persona>-ack.md`（binary：withdraw / retain / escalate per blocker）

### Phase 7: Facilitator 終局判定

Dispatch `devteam-facilitator`：
- 跑三訊號 AND
- 滿足 → 寫 `final-report.md` status=converged → 升級業主
- 不滿足 + round==max → 寫 `final-report.md` status=escalated → 升級業主
- Parse fail (c) → 寫 `final-report.md` status=degraded → 升級業主

### Phase 8: 業主裁決

不在本 command 範圍。業主讀 final-report.md 後：
- `/devteam-<role>` 寫 ADR/DR 並 cascade（接受 converged 版本）
- 或手動編輯 final-report.md 明文裁決 + 走相同 driver 路徑

## 不在 forum 範圍

- 不寫 ADR/DR（業主裁決後走 driver skill）
- 不 freeze 文件（業主走 `/devteam-freeze`）
- 不取代 Lane A critique pipeline
- 不做超過 3 輪（強制升級）

## 與 Lane A 整合

Lane A `/devteam-review` 或 freeze gate review 完成後：

```
orchestrator 輸出 conflicts_count >= 2
    │
    ▼
router 提示業主：
  ⚠ Critique 發現 N 個衝突點，建議升級到 Forum：
    /devteam-forum <doc> --from-review=<review-id>
  [Y/n]
    │
    ▼ Y
本 command 觸發，--from-review 引用該 review 作為 R1 背景
```

## Token 預算參考

| Round | 動作 | 估算 |
|:------|:-----|:-----|
| R1 | proposer 提案 | ~5k |
| R2 | 3 personas 並行 critique | ~15k |
| R3 | proposer 回應 | ~10k |
| R3 末 | 3 critics ack | ~6k |
| Facilitator × 2 次 | 判定 + final-report | ~9k |
| **總計** | | **~45k**（1.8x strict review） |
