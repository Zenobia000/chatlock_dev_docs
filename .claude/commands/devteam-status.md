---
description: 查看當前 devteam session 狀態：phase、freeze gate、文件成熟度、pending decisions、stale 清單。
---

# DevTeam Session 狀態

載入 **devteam-status** skill，純讀取輸出，不寫任何檔案。

## 使用方式

```
/devteam-status                # 顯示當前 session 狀態
```

## 輸出內容

- Session metadata（id、release、phase、active features）
- 7 個 Freeze Gate 進度
- 所有文件成熟度（frozen / reviewed / draft / stale / superseded）
- Pending user decisions（業主待裁決事項）
- Stale documents（等業主授權 cascade）
- ADR / DR ledger 摘要
- 下一步建議指令

完整邏輯：`.claude/skills/devteam-status/SKILL.md`。
