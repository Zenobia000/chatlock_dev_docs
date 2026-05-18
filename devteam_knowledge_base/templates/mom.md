# Minutes of Meeting (MoM) Template

> 給 Lane C Roundtable 使用。寫給**業主**讀的版本（大廠 PM 風格）。
>
> 設計原則：
> - **上位者 30 秒可懂**（Executive Summary 在最頂）
> - **沒有技術符號**（不出現 @mention / yaml / round 1/2）
> - **每個決議都標出 owner 跟下一步**
> - **所有引用文件都有 link**
> - **完整對話流不在這份檔案**，在 `transcript.md` appendix（drill-down）

---

# MoM: {meeting_title}

**日期**：{YYYY-MM-DD HH:MM} ~ {HH:MM}（{duration_min} 分鐘）
**主持**：DevTeam Facilitator
**與會**：{role_1}、{role_2}、{role_3}
**狀態**：✅ Converged / ⚠️ Pending Owner Decision / 🔴 Escalated

---

## 📋 Executive Summary

> 一句話：{會議目的與結果，業主 30 秒可懂}

例：「討論請假系統 KPI 設定，敲定月活躍員工 ≥ 70% 為主要指標，
新增主管 48h 簽核 + escalation 規則。會議共識，無 open question。」

---

## ✅ Decisions Made

不是討論過程，是**最終決議**。每條附 confidence 與 reversibility。

| # | 決議 | Confidence | 可逆性 | 影響範圍 |
|:--|:-----|:-----------|:-------|:---------|
| D1 | KPI #1 改為「月活躍員工 ≥ 70%（T+3 month）」 | 高（三方共識） | 可逆（DR 紀錄即可） | PRD §2.3 |
| D2 | KPI #2 改為「主管 48h 簽核 ≥ 70% + escalation」 | 高（三方共識） | 可逆 | PRD §2.3 / ADR-005 |
| D3 | 新增 NFR：approval workflow MUST 48h escalate | 中（延後 P2 phase 細化） | 不可逆（架構約束） | NFR matrix（待建） |

**Confidence 標示**：
- 高 = 與會 ≥ 2/3 明文同意 + 業主已表態
- 中 = 與會多數同意但業主未明確表態 / 或延後細化
- 低 = 收斂於妥協但有明顯保留意見

**可逆性**：
- 可逆 = 改了寫 DR 即可
- 半可逆 = 改了要 cascade + 寫 ADR
- 不可逆 = 公開 commitment / 法規 / 跨組織承諾

---

## 🎯 Action Items

每條都有 owner 跟 due date。**業主不在 owner 清單中**（業主只批准，不執行）。

| # | Action | Owner | Priority | Due | Status |
|:--|:-------|:------|:---------|:----|:-------|
| A1 | 更新 PRD §2.3 KPI 段落 | `devteam-pm` | P0 | 2026-05-19 | 🟡 In Progress |
| A2 | 寫 ADR-005（escalation rule） | `devteam-arch` | P0 | 2026-05-20 | ⚪ Open |
| A3 | NFR matrix 加 escalation 約束 | `devteam-arch` | P1 | P2 phase 啟動時 | ⏸️ Deferred |

**Priority**：
- P0 = 阻塞下游 / 本週要動
- P1 = 重要但不阻塞 / 本月內
- P2 = 改善類 / 有空再做

**Status**：
- ⚪ Open / 🟡 In Progress / ✅ Done / ⏸️ Deferred / 🔴 Blocked

---

## ❓ Open Questions（需要業主回應）

**業主只在這段需要動**。其他段落業主看 summary 即可。

| # | 問題 | 為什麼問業主 | 提案選項 | 建議 |
|:--|:-----|:------------|:---------|:-----|
| Q1 | 假別 catalog 是否要支援 vendor 自訂 | Value 判斷（影響 scope ~15%） | A: 不支援（簡單）<br>B: 支援但限 5 種<br>C: 完全 vendor 自訂 | B（折衷，避免後期改） |
| Q2 | 主管 escalation 對象是誰 | 組織政策 | A: 主管的主管<br>B: HR<br>C: 申請人指定 | A（最常見） |

> **業主**：在每條後面直接回「A」/「B」/「C」/「我有別的想法」，
> 或選「先擱著」就標 deferred。

---

## ⚠️ Risks Identified

| 風險 | 描述 | 影響 | Mitigation |
|:-----|:-----|:-----|:-----------|
| R1 | 主管放長假時 escalation 失效 | KPI #2 達成率下降 | A2 ADR-005 寫入「假期 fallback」分支 |
| R2 | 月活定義被誤用為衡量員工 | HR 反彈 | 在 PRD §2.3 明文「KPI 是系統採用度，不評員工」 |

---

## 🔗 Cross References

**本次 MoM 引用**：
- PRD: [`docs/prd/leave-mvp.md`](../../docs/prd/leave-mvp.md) §1.2 目標 / §2.3 KPI
- Session narrative: [`session-2026-05-18-1110-leave-mvp.md`](../../.claude/context/devteam/session-2026-05-18-1110-leave-mvp.md)

**Catalog references used**（Phase 1.5 注入給龍蝦的決策依據，影響 §Decisions 條目）：
- [[06_quality_attributes_catalog]] §1 9 維度 → 影響 D1 / D2 量法選擇
- [[09_observability_catalog]] §3 SLI 命名 → 影響 D1 KPI #1 命名 "月活躍員工"
- [[10_resilience_patterns]] §4 RTO/RPO → 影響 D3 escalation rule 設計

> Catalog references 寫入 `notes.yaml.catalog_refs[]`，
> 供 `.claude/context/devteam/indexes/catalog_usage.json` 後台聚合，
> 半年後可 query「哪些 catalog 段落實際被引用、哪些從未被引用」。

**Catalog gaps**（龍蝦發言時標 [CATALOG_GAP] 的項目）：
- 無 / 或：[CATALOG_GAP: API design catalog 缺「企業內部 SaaS vs 外部 API」的選擇樹]

**本次 MoM 將被引用**：
- ADR-005（A2 產出後）
- PRD §2.3 v2（A1 完成後）

**相關 MoM**（前後 thread）：
- 前置：— （首次 KPI 討論）
- 後續：「假別 catalog 細節」會議（Q1 收到業主回應後排）

---

## 📌 Next Steps

1. **本週內**：A1（PRD 更新）+ A2（ADR-005 草稿）完成 → 給業主 review
2. **業主回應 Open Questions** → Q1 / Q2 確定 → 排第二場 roundtable（假別 catalog）
3. **P2 phase 啟動時**：A3 NFR matrix 統一處理

---

## 🔍 Drill-down（可選閱讀）

如果想看會議詳情：

- **完整對話 transcript**：[`transcript.md`](./transcript.md)
- **各與會者立場詳細**：[`stances/`](./stances/) 目錄
- **結構化 metadata (YAML)**：[`notes.yaml`](./notes.yaml)（給 agent / future Discord migration 用）

**業主預設不需要看上述檔案**。只在以下情境會用到：
- 半年後回顧「為什麼當初這樣決定」
- 跟新進團隊成員解釋決策背景
- 對某條決議存疑想看完整論證

---

## 📊 Meeting Metadata (給 agent / 系統用)

```yaml
meeting_id: {meeting_id}
template_version: mom-v1
status: converged | pending_owner | escalated
attendees_count: 3
rounds: 2
user_interjections: 1
decisions_count: 3
action_items_count: 3
open_questions_count: 2
risks_count: 2
total_token_used: ~23000
discord_channel: "#leave-kpi-discussion"  # Level 3 對應
# Catalog references（Phase 1.5 注入給龍蝦的決策依據）
catalog_refs:
  - kb: 06_quality_attributes_catalog
    section: "§1"
    impact: "D1, D2 量法選擇"
  - kb: 09_observability_catalog
    section: "§3"
    impact: "D1 KPI 命名"
  - kb: 10_resilience_patterns
    section: "§4"
    impact: "D3 escalation rule"
catalog_gaps:
  - kb: 08_api_design_catalog
    expected: "企業內部 SaaS vs 外部 API 的選擇樹"
    raised_by: pm
```

---

**End of MoM**

> 給業主：你只需要看 §Executive Summary / §Decisions / §Open Questions 三段，
> 全部加起來 < 1 分鐘。其他段落是執行單位用的。
