# Roundtable Example: 業主視角

> 給業主第一次用 roundtable 時，看「跑起來長什麼樣」的範例。
> 場景：請假 MVP session，業主想討論 KPI 設定。
>
> **重點：業主從頭到尾看到的東西不到 1 分鐘閱讀量。**

---

## 業主視角 — 從頭到尾長這樣

### Step 1: 業主啟動（自然語言）

```
業主: 對請假系統的 KPI 開個會
```

### Step 2: Claude 確認後開會

```
[Claude] OK，我安排 PM、UX、Architect 三隻龍蝦討論「請假系統 KPI」，
         預計 2 round（約 5 分鐘），完成後給你 MoM。
         不對勁告訴我，不然就開始了。
```

業主沒回 → 5 秒後自動開始。

### Step 3: 會議進行中（業主看不到內容）

```
[Claude] 龍蝦會議中 ⏳ Round 1 (3 隻龍蝦並行發言)
[Claude] 龍蝦會議中 ⏳ Round 2 (順序響應收斂)
[Claude] 龍蝦會議中 ⏳ 提煉 MoM...
```

業主可以**完全離開**，去做別的事。

### Step 4: MoM 出爐（業主收到通知）

```
[Claude] ✅ MoM 出爐：meetings/2026-05-18-1130-leave-kpi-discussion/MoM.md

         你只要回 §Open Questions 兩題：
         - Q1: 假別 catalog 是否支援 vendor 自訂？(建議 B 折衷)
         - Q2: 主管 escalation 對象？(建議 A 主管的主管)

         一句話就行。想看完整對話再說，我可以 render。
```

### Step 5: 業主讀 MoM（< 1 分鐘）

業主打開 `MoM.md`，看到：

> # MoM: 請假系統 KPI 設定
>
> **日期**：2026-05-18 11:30 ~ 11:48（18 分鐘） · **狀態**：✅ Converged
>
> ## 📋 Executive Summary
> 討論請假系統 KPI 設定，敲定「月活躍員工 ≥ 70%」+「主管 48h 簽核 + escalation」。
> 三方共識，2 個 Open Question 等業主回應。
>
> ## ✅ Decisions Made
> | # | 決議 | Confidence | 可逆性 | 影響範圍 |
> |:--|:-----|:-----------|:-------|:---------|
> | D1 | KPI #1 月活躍員工 ≥ 70%（T+3 month） | 高 | 可逆 | PRD §2.3 |
> | D2 | KPI #2 主管 48h 簽核 ≥ 70% + escalation | 高 | 可逆 | PRD §2.3 / ADR-005 |
> | D3 | NFR：approval 48h escalate | 中（延後） | 不可逆 | NFR matrix |
>
> ## 🎯 Action Items
> | # | Action | Owner | Due | Status |
> | A1 | 更新 PRD §2.3 | devteam-pm | 明天 | 🟡 |
> | A2 | 寫 ADR-005 | devteam-arch | 後天 | ⚪ |
>
> ## ❓ Open Questions（需要業主回應）
> | # | 問題 | 提案選項 | 建議 |
> | Q1 | 假別 catalog 是否支援 vendor 自訂 | A 不支援 / B 限 5 種 / C 完全自訂 | **B** |
> | Q2 | escalation 對象 | A 主管的主管 / B HR / C 申請人指定 | **A** |
>
> ## 🔗 Cross References
> - PRD: docs/prd/leave-mvp.md §2.3
> - 未來 ADR-005（A2 產出後）
>
> ## 🔍 Drill-down
> 想看完整對話？告訴我，我 render `transcript.md`。

### Step 6: 業主一句話回應

```
業主: 都照建議走
```

### Step 7: Claude 執行

```
[Claude] OK，鎖定 Q1=B、Q2=A 寫進 MoM decision log。

         動手：
         - A1: dispatch devteam-pm 更新 PRD §2.3
         - A2: dispatch devteam-arch 寫 ADR-005 草稿（完成後等你 review）

         會議完成。
```

---

## 業主總時長

| 步驟 | 業主動作 | 時長 |
|:-----|:--------|:-----|
| Step 1 | 打字「對 KPI 開個會」 | 5 秒 |
| Step 2-4 | 完全離開做別的事 | 0 秒（5 分鐘掛機） |
| Step 5 | 讀 MoM | 50 秒 |
| Step 6 | 打字「都照建議走」 | 3 秒 |
| **業主總投入時間** | | **< 1 分鐘** |

**業主看到的東西**：
- 啟動確認 1 句
- 進度指示 3 行
- MoM 1 頁
- 完成通知 1 段

**業主沒看到的東西**：
- 9 條龍蝦發言（round 1 + round 2）
- 內部收斂判定
- @mentions
- yaml metadata
- transcript

---

## Drill-down 範例（業主好奇時）

```
業主: 等等，給我看 PM 龍蝦對 KPI #2 怎麼想的
```

```
[Claude] [從 stances/pm.md render]

         PM 龍蝦對 KPI #2 的論證流程：

         Round 1 立場：「主管 24h 內簽核 ≥ 80%」
         理由：對應 PRD §1.2 現況痛點（簽核漏接）
               24h 是業界平均
               80% 是新系統合理目標

         遭遇 Architect 質疑：「主管放假時怎麼辦？」
         遭遇業主立場：「UX 講得對，量法要明確」

         Round 2 修正：「主管 48h 內簽核 ≥ 70% + escalation」
         妥協點：
         - 24h → 48h（接受 Architect 質疑）
         - 80% → 70%（接受業主折衷意見）
         - 加 escalation rule（接受 Architect 提案）

         相關文件：
         - PRD §2.3（修正後版本）
         - 未來 ADR-005（escalation rule）
```

業主再追問：

```
業主: 為什麼 UX 講「量法要明確」？
```

```
[Claude] [從 stances/ux.md round 1 render]

         UX 龍蝦原話：
         「『使用』這個量法太模糊。
         『曾用過』會被一次性測試員工灌水。
         建議改『月活躍員工』= 當月有過 1 次申請 OR 1 次審核。」

         業主在當下回應：「UX 講得對，量法要明確」
         → 注入 round 2 → PM 接受並修正為「月活 70%」
```

**這些 drill-down 都不重跑會議**，只是 render 已有資料。

---

## Foreground Mode 範例（業主想在現場看）

業主有時想學習 / 好奇龍蝦怎麼思考：

```
業主: 我想看他們怎麼討論 假別 catalog
```

```
[Claude] 偵測到「我想看」→ 切 foreground mode。
         龍蝦發言會即時 stream 給你，可隨時插話。

         安排 PM、BA、UX 三隻龍蝦討論「假別 catalog」，預計 2-3 round。
         開始。

         ═══ Round 1 ═══

         [PM龍蝦, 14:31]
         立場：catalog 用 enum 列舉常見假別（特休 / 病假 / 婚假 / 喪假 / 育嬰）
         理由：80 人公司不需要 vendor 自訂
         @BA 法定假別有遺漏嗎？

         [BA龍蝦, 14:31]
         @PM 你列的少了「家庭照顧假」（勞基法 §43-1）
         台灣法定還有產檢假、安胎假、生理假...
         建議至少 10 種
         @UX UI 上能容納 10 種嗎？

         [UX龍蝦, 14:32]
         @BA 10 種 dropdown 還好。
         但建議分組（個人假 / 家庭假 / 特殊假），不然滾動找很煩
         @PM 真要 vendor 自訂？

         ═══ Round 2 ═══
         ...
```

Foreground mode 下業主看完整 transcript，**但這是 opt-in 不是 default**。

---

## Appendix: 完整 transcript（業主預設看不到）

> 以下內容存在 `transcript.md`，業主不主動 render 不會看到。
> 這裡列出是讓「實作 PoC 的人」知道對話流到底長什麼樣。

```
═══ Round 1 ═══

[PM龍蝦, 11:31]
立場：建議兩個 KPI:
- KPI #1「3 個月內 80% 員工使用」呼應 PRD §1.2 目標
- KPI #2「主管 24h 內簽核 ≥ 80%」對應現況痛點
@UX 「使用」要怎麼量？

[UX龍蝦, 11:31]
立場：「使用」量法太模糊。
- 「曾用過」會被測試員工灌水
- 建議「月活躍員工」= 當月有 ≥ 1 次申請或審核
- 80% 太高，T+3 month 達 60% 已不錯
@PM 60% 你能接受？
@Architect 80% 同時用會撞 NFR？
[VALUE_DECISION_NEEDED] 60% 還是 80%？

[Architect龍蝦, 11:31]
立場：UX 的量法對。QPS 不是問題。
- 80 人公司 peak QPS ~5
- 真正風險是「24h」— 主管放假時誰簽？
- 建議加 escalation rule
@PM 24h 改 48h + escalation 可接受？

═══ Round 2 ═══

[PM龍蝦, 11:35]
收到業主立場（量法明確 + 70% 折衷）：
- KPI #1: 月活躍員工 ≥ 70%（T+3 month）
- KPI #2: 主管 48h 簽核 ≥ 70% + escalation
@UX 70% reasonable？

[UX龍蝦, 11:36]
@PM 70% 可接受。補充：
- 月活 = calendar month 內 ≥ 1 申請或審核
- 不算「登入但沒申請」
- 從 T+3 開始量
無補充。

[Architect龍蝦, 11:36]
@PM 48h + escalation 可接受。我會在 P2 寫 NFR：
- approval workflow MUST escalate if 48h 無回應
- escalation target = 主管的主管
無補充。

═══ 收斂訊號 ═══
✓ 無新議題（Round 2 都是響應 Round 1）
✓ 立場趨同（PM 修正版本，UX/Architect 同意）
✓ 業主立場明確（70% + escalation）
→ 滿足 3/3 訊號，會議收斂。

═══ Open Questions（提煉給業主）═══
Q1: 假別 catalog 是否支援 vendor 自訂？（Round 1 PM 提，沒展開討論）
Q2: escalation 對象？（Architect 提 "主管的主管"，但需業主確認組織政策）
```

---

## 對比：舊版（透明對話流）vs 新版（MoM-first）

| | 舊版 | 新版 |
|:--|:-----|:-----|
| 業主看到的內容 | 9 條龍蝦發言 + @mentions + 進度 | MoM 1 頁 |
| 業主閱讀時間 | 5-10 分鐘 | < 1 分鐘 |
| 業主介入點 | 中途插話（可能多次） | 只在 Open Questions |
| 業主感受 | 「我在參與會議」 | 「我授權團隊去開會，看結果」 |
| 適合場景 | 想學 / debug / 好奇 | **預設正常工作流** |
| 切換方式 | — | 「show me the conversation」可切回舊版 |

**新版預設**是大廠 PM 的工作流。
**舊版**保留為 foreground mode（opt-in），給好奇 / 學習場景用。
