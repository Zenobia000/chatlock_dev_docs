---
description: 手動觸發 freeze gate 的 multi-role review，產出 critique report 後請業主簽核。
---

# DevTeam Freeze Gate Review

對指定的 freeze gate 啟動 multi-role critique。讀 `devteam_knowledge_base/04_freeze_gates.md` 取得該 gate 的必到 personas 與預設 intensity，再依 `--intensity` 旗標調整。

## 使用方式

```
/devteam-freeze Gate1_PRD                     # 預設 intensity（看 04 KB）
/devteam-freeze Gate4_NFR_ADR --intensity=strict
/devteam-freeze Gate5_APIContract --intensity=light
/devteam-freeze Gate1_PRD --dry-run           # 只列 critique 框架，不真實 dispatch
```

## 操作流程

1. 讀 state.json 確認該 gate 是否 `ready_to_review`
2. 讀 04 KB 取得 `required_personas` 與預設 intensity
3. 依 intensity 並行 dispatch 對應 persona agents（見 `.claude/agents/devteam-*-persona.md`）
4. 各 persona 從自己視角讀目標文件 + state，產出 critique（{重大阻礙, 建議調整, 通過項}）
5. `devteam-orchestrator` agent 合併為單一 review report
6. 寫入 `.claude/context/devteam/reviews/<gate>-<feature>-<date>.md`
7. 呈現給業主裁決 → 業主決定：
   - `/devteam approve <gate>` → 標 frozen + 寫 evidence
   - `/devteam revise <gate>` → 回 driver skill 修正
   - 業主可逐條接受 / 拒絕 critique 項

## Intensity Dial

| 等級 | 行為 | 適用 |
|:-----|:-----|:-----|
| `light` | 1 persona self-critique | 低風險 gate、迭代版本 |
| `standard` | 2 personas + orchestrator | 預設 |
| `strict` | 3 personas + orchestrator + 衝突點顯化 | PRD/NFR/API/Release 等高耦合 gate |
| `dry-run` | 列框架不 dispatch | 業主預覽用 |

## Orchestrator 失敗降級

若 orchestrator 無法產出 coherent merge，自動降級為「列原始 critique + 標衝突點」，不卡 freeze 流程。
