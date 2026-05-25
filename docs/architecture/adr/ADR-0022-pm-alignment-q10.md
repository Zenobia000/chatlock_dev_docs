---
id: ADR-0022
title: 派工/接單失敗 rollback
status: accepted
date: 2026-05-07
deciders: [PM, Tech Lead, QA Lead]
legacy_id: PM-Q10
supersedes: []
superseded_by: []
related:
  - "../0-principles/id-mapping-legacy.md §A.6 (PM Q → ADR)"
  - "_pending-split-pm-alignment-Q1-Q10.md (原始決策矩陣)"
---

# ADR-0022 — 派工/接單失敗 rollback

## Status

**Accepted** (拍板於 2026-05-07，作為 PM Q1-Q10 90 分鐘對齊會議產物)

## Decision

**採預設方案 (待補)**

## Context, Options, Consequences (從 PM 決策矩陣 §10 摘錄)

## 11. Q10 — 派工 / 接單失敗 rollback policy？

### 業務脈絡

自動派工指派 → 技師沒接 / 拒接，怎麼辦？

### 影響流程

- F-003 自動派工
- F-005 技師接單

### 候選方案


| 選項                             | 說明                                   | 客戶感知             | 技師壓力    |
| ------------------------------ | ------------------------------------ | ---------------- | ------- |
| **A. 自動重派 3 次後升級**             | 拒接 / 超時 → 派下一名 best match × 3 → 客服介入 | 透明（推播看到「正在派下一位」） | 個別技師可拒  |
| **B. 立刻升級客服**                  | 拒接 → 客服手動派                           | 慢                | 拒接無懲罰   |
| **C. 自動重派 + fairness penalty** | A + 拒接率列入 fairness 計分                | 同 A              | 累積拒接會扣分 |


### 推薦預設

**A — 自動重派 3 次後升級**。理由：

1. 客戶體驗最好（不感知技師拒接）
2. 3 次是經驗值（avoid infinite loop）
3. fairness penalty 留給 V1.5 + 拒接率有數據後再決

### 反向選項後果

- B：F-016 SLA 破線率高（每次都等客服）
- C：[[02-design/specs/dispatch-weights]] 需加 `rejection_rate` 因子，權重要重算

### PM 決策

```
[ ] A — 自動重派 3 次後升級
[ ] B — 立刻升級客服
[ ] C — 自動重派 + fairness penalty

理由：__________________________________
拍板日期：______________
拍板人：______________

技術問題：「拒接」如何定義？ 5 分鐘無回應 / 主動 reject / 兩者 ?
回答：__________________________________
```

### 拍板後續更新

- `api/services/dispatch_service.py`：retry loop（max=3 if A）
- `docs/02-design/specs/dispatch-weights.md`：若 C，加 fairness column
- `agent/skills/data/_common/`：dispatch-retry-status notification

---

## 12. 決策追蹤總表

每題拍板後，QA 把對應 row 的 status 改為 ✅ 並填日期。


| #   | 問題              | 預設                 | **PM 決策**                                   | 拍板日        | 影響 sprint                   | 反向預設？                                                   |
| --- | --------------- | ------------------ | ------------------------------------------- | ---------- | --------------------------- | ------------------------------------------------------- |
| Q1  | 派工員角色           | A 新角色              | ✅ **A**（dispatcher 新角色）                     | 2026-05-07 | F-004 / F-019               | —                                                       |
| Q2  | 雙簽終簽人           | A 階層               | ✅ **A**（Director > Manager 階層）              | 2026-05-07 | F-013 / F-014               | —                                                       |
| Q3  | 消費者追蹤入口         | A LINE only        | ✅ **C**（兩者並存：LINE 主 + Web VIP 備）            | 2026-05-07 | F-022                       | ⚠ **反向** — 需建 Web 匿名 token + Playwright spec            |
| Q4  | 月結 SLA 計時       | B 自然日              | ✅ **C**（工作日 + 國定假日跳過）                       | 2026-05-07 | F-013                       | ⚠ **反向** — 需 calendar lib + 維護台灣國定假日 JSON               |
| Q5  | F-016 SLA 屬性    | B Soft             | ✅ **B**（Soft Target，dashboard 變紅 + 升主管，無賠償） | 2026-05-07 | F-016 / F-013 / F-014       | —                                                       |
| Q6  | 客服繞過派工          | A 可 + audit        | ✅ **A**（可繞過 + 強制 audit log）                 | 2026-05-07 | F-004                       | —                                                       |
| Q7  | V1.0 金流         | A 不含               | ✅ **B**（V1.0 整合金流 provider）                 | 2026-05-07 | F-011 / F-014 / **整體 V1.0** | 🔴 **反向 + 重大** — 上線延 ~30 dev-day，需 PCI 審查 + provider 選型 |
| Q8  | 非 LINE fallback | A 拒收               | ✅ **A**（V1.0 only LINE，非 LINE 拒收）           | 2026-05-07 | F-001 / F-010               | —                                                       |
| Q9  | Scope Change 同意 | A LINE quick reply | ✅ **B**（Web 匿名 token + Playwright）          | 2026-05-07 | F-008                       | ⚠ **反向** — 與 Q3=C 共用 Web 匿名 token 機制（marginal cost 降低）  |
| Q10 | 派工失敗 rollback   | A 重派 3 次           | ✅ **A**（自動重派 3 次後升級客服）                      | 2026-05-07 | F-003 / F-005               | —                                                       |


> 進度視覺：⬜ 待拍 / ⏳ 討論中 / ✅ 拍板（請補日期）/ 🔄 翻案中
> **2026-05-07 拍板統計**：10/10 全部 ✅ — 6 採預設 + 4 採反向（Q3 / Q4 / Q7 / Q9）

### 12.1 反向選項決策影響摘要

PM 採 4 題反向選項，需特別追蹤後續影響：


| Q          | 反向 →                            | 額外成本                                                      | 後續行動                                                               |
| ---------- | ------------------------------- | --------------------------------------------------------- | ------------------------------------------------------------------ |
| **Q3 = C** | LINE only → 兩者並存                | +5 dev-day（Web 追蹤頁 + getWorkOrderPublicStatus + token）    | 開新 PR 補 API spec + Playwright 公開 spec；F-022 從 ❌ orphan → ⚠ partial |
| **Q4 = C** | 自然日 → 工作日+國定假日                  | +1 dev-day（calendar lib）+ 每年 12 月維護假日 JSON                | 引入 `holidays` 套件；fixture 設計跨週/連假 case                              |
| **Q7 = B** | 不含 → 含金流                        | **+30 dev-day**，PCI compliance 審查（60 dev-day），上線延 ~1.5 個月 | **🔴 詳細決策矩陣已建**：[[Q7-followup--payment-provider-decision]]（4 候選 provider 對比 + V1.0a/V1.0b 拆分方案 + PCI SAQ-A 推薦 + 30 天行動清單 + 預算估算 NT$270k setup + NT$180k/年）。**待 90 min PM/TL/CEO/Finance 會議拍板 4 個 sub-decision (D1-D4)** |
| **Q9 = B** | LINE quick reply → Web 匿名 token | 與 Q3=C 共用機制，marginal cost 0                               | 與 Q3 同 PR 處理                                                       |


> **Q7=B 是本次最重大決策**，影響 V1.0 整體上線時程。建議 PM/TL/CEO 立即評估：
>
> - 是否願意延 1.5 個月上線換取金流整合？
> - 或拆 V1.0a（不含金流）+ V1.0b（含金流）兩階段？
> - PCI compliance 是否有預算？

---

## 13. 拍板後的下游更新清單

對應 [[_flows-bdd-test/v-model-right/E7x--test-plan-and-readiness|E7x]] §10 Sprint 1 解鎖項：

```
Q1 拍板 → [✓] §10 #11–#18 Happy Path E2E (F-004 解鎖)
Q2 拍板 → [✓] §10 #16 (F-013 BDD scenario 完整化)
Q3 拍板 → [✓] §4.3 getWorkOrderPublicStatus 是否要建
Q4 拍板 → [✓] §10 #24 Settlement golden dataset 計時邏輯
Q5 拍板 → [✓] §10 #23 SLA 警報自動化測試 (hard / soft)
Q6 拍板 → [✓] §10 #11–#18 (F-004 actor 矩陣)
Q7 拍板 → [✓] §10 #7 fake provider 介面定稿
Q8 拍板 → [✓] §10 #11 F-001 邊界 case
Q9 拍板 → [✓] §2 F-008 從 🟡 變 🟢
Q10 拍板 → [✓] §10 #19 negative case 各 Happy Path × 2
```

拍板完成後執行：

```bash
# 1. 開新 PR：sync-pm-decisions-to-spec
git checkout -b docs/sync-pm-decisions-Q1-Q10 dev

# 2. 對應每題更新下游檔案（見各題「拍板後續更新」清單）
# 3. E7x §10 Sprint 1 task table 標記 [✓]
# 4. E7x §15 加 Change Log row
# 5. 本檔 §12 status 改 ✅
# 6. PR 標題：docs(spec): sync PM Q1-Q10 decisions
```

---

## 14. Verification — 怎麼驗證對齊文件落地

對齊會議結束後 24 小時內：

1. **本檔 §12 表全部填妥**（10 row 都不是 ⬜ 待拍）
2. **下游 PR 建立**：`docs/sync-pm-decisions-Q1-Q10` 分支
3. **E7x test plan §3 表更新**：把「合理預設」column 改為「拍板結論」
4. **新增 ADR**（若有任一題反向選項拍板）：`docs/01-define/adrs/ADR-NNNN-pm-Q*-decision.md`
5. **WBS 解鎖**：[[01-define/E2x--wbs-project-schedule]] 將綁定 Q1–Q10 的 task 從 blocked 改 ready

---

## 15. Change Log


| Date       | Author             | Change                                                                                                                                                                                                                                                        |
| ---------- | ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-05-07 | Claude (assisted)  | 初版：從 E7x §3 摘要展開為 11 章完整版（含 90 分鐘議程、各題 3 選項對比、PM 決策欄位、追蹤表、下游更新清單）                                                                                                                                                                                             |
| 2026-05-07 | PM + Claude (sync) | **Q1-Q10 全部拍板**（10/10 ✅）：6 採預設（Q1/Q2/Q5/Q6/Q8/Q10）+ 4 採反向（Q3=C / Q4=C / Q7=B / Q9=B）。§12 追蹤表全更新、§12.1 反向選項影響摘要、_SSOT-alignment-matrix 同步狀態升級、E7x test-plan §1/§2/§3 同步。**Q7=B（V1.0 含金流）為最重大決策**，需 PM/TL/CEO 立即評估 1.5 個月延期換金流整合、provider 選型、PCI compliance 預算。 |
