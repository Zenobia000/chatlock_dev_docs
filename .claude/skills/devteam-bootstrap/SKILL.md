---
name: devteam-bootstrap
description: Junior Architect Copilot 的初始化問卷。用 12 題結構化問卷把 senior 隱性思考（規模 / 合規 / 團隊 / stack / 學習目標）顯化，產出 bootstrap-intent.yaml 餵給 devteam-pm 預填 PRD。取代 P0 三題輕量問答，是 agentic 模式（higgsfield / lovart 風格）的 init 階段核心。
references:
  - devteam_knowledge_base/06_quality_attributes_catalog.md
  - devteam_knowledge_base/11_data_and_stack_catalog.md
  - devteam_knowledge_base/02_lifecycle_phases.md
---

# DevTeam Bootstrap: Architect Bootstrap Questionnaire

## Why this skill exists

Junior 工程師的核心 gap 不是「無法描述痛點」，而是「不會自動補上 senior 隱性思考的維度」。Senior 看到「做訂單系統」會自動想：
規模？延遲？合規？資料敏感度？團隊規模？既有 stack？deadline？

Junior 不會主動想。**本 skill 用結構化問卷強制把這些隱性問題顯化**，每題附 *why this matters*，等同於「邊填邊學 senior 怎麼思考」。填完後系統有足夠資訊預填 PRD draft，業主進入 P1+ 時不需要再被問規模 / 合規這類基礎題。

**對應 agentic 應用模式的「init 階段」** — 不同於對話式 P0，本 skill 必須**先把問卷完成**才推進到 P1。

**宣告：** 「正在使用 devteam-bootstrap skill — 進行 Architect Bootstrap Questionnaire。」

---

## Phase 1: 讀取上下文與啟動

1. 讀 `.claude/context/devteam/state.json`
   - 若 `phase != "P0_DISCOVERY"` 且 bootstrap 已執行過 → 提示業主：「已有 bootstrap-intent.yaml，是否要覆寫？」需業主明確 confirm
   - 若 phase 為空 → 初始化 session（產 session id、建 state.json）
2. 確認 feature slug（從業主輸入或預設 `default-feature`）
3. 對業主說明流程：

```
我會問你 12 個問題，分成 6 組（業務 / 規模 / 合規 / 團隊 / stack / 學習目標），約 3-5 分鐘。
每題下面會說明「為什麼這題重要」—— 這就是 senior 規劃時會想的維度。
你不確定的題目可以選「我不知道 / 還沒想過」，系統會把它列為 open question 之後補。
```

---

## Phase 2: 問卷（4 批 AskUserQuestion）

每批用 `AskUserQuestion` 工具發送 3 題。每題的 `description` 欄位就是 *why this matters* 教育內容。

### Batch 1: 業務脈絡 + 規模

```
Q1. 你的產品要解決什麼核心問題？目標用戶是誰？
  (free-form via follow-up — 用一般訊息收集)

Q2. 預期用戶規模（首年 MAU）？
  - < 100 (內部工具 / PoC)
  - 100 – 10k (小型產品)
  - 10k – 1M (中型產品)
  - > 1M (大型 / 高流量)
  → Why: 規模決定 NFR baseline、infra 選型、是否需要分散式架構。10k 是 single VM vs cluster 的常見分水嶺。

Q3. 延遲敏感度？
  - 即時 (< 100ms，如遊戲 / 交易)
  - 互動 (< 1s，如一般 Web)
  - 批次 (秒級，如報表)
  - 離線 (分鐘級+，如 ETL)
  → Why: 決定是否需要快取 / CDN / read replica / async queue。延遲要求愈高、架構複雜度愈高。
```

由於 Q1 是 free-form，先用一般 message 問，再用 AskUserQuestion 問 Q2 + Q3。

### Batch 2: 合規 + 資料敏感度

```
Q4. 你的系統會處理什麼資料？（多選）
  - 無敏感資料 (公開內容、匿名數據)
  - PII (姓名 / Email / 電話 / 地址)
  - 金流 (信用卡 / 銀行帳號 / 交易紀錄)
  - 醫療 (病歷 / 健保 / 用藥)
  - 兒少資料 (< 13 歲使用者)
  → Why: 決定加密 (at-rest / in-transit)、audit log、retention 策略、是否需要 DPIA。資料等級錯估會在 P3 設計階段被打回票。

Q5. 需要符合的合規框架？（多選）
  - 無 / 不確定
  - SOC2 (B2B SaaS 客戶常要求)
  - GDPR (有歐盟用戶)
  - HIPAA (美國醫療)
  - PCI-DSS (處理信用卡)
  - 其他（如 ISO 27001 / 個資法）
  → Why: 合規框架決定文件 / 流程 / observability 的優先級。SOC2 audit 會要求 access log、change log；GDPR 會要求 right-to-be-forgotten 流程。

Q6. 是否需要稽核軌跡 (audit trail)？
  - 不需要
  - 重要操作要 (登入 / 權限變更)
  - 所有寫操作都要
  → Why: audit log 影響 DB schema (created_by / updated_by)、event sourcing 決策、儲存成本估算。
```

### Batch 3: 團隊 + 時程 + Stack

```
Q7. 目前 team size？
  - 單人 (你一個)
  - 2-5 人 (小團隊)
  - 6-20 人 (中型團隊)
  - > 20 人 (大型 / 多團隊)
  → Why: 決定 code review 流程、observability 投入比、是否需要 service ownership 邊界。單人專案不需要 micro-service 切分。

Q8. 第一版上線 deadline？
  - < 1 個月 (MVP 衝刺)
  - 1-3 個月 (短期)
  - 3-6 個月 (一般)
  - 6 個月+ (長期 / 沒有)
  → Why: 決定技術選型激進度。1 個月 deadline 不適合自研 framework；6 個月可以接受嘗試新技術。

Q9. 主要程式語言 / 既有 stack 限制？
  - Python (data / ML / 後端)
  - TypeScript / Node (全端 / 前端重)
  - Java / Kotlin (企業 / Android)
  - Go (高效能後端)
  - Rust (系統 / 高效能)
  - 其他 / 開放 (沒偏好)
  → Why: 後續 framework 推薦會基於此。「開放」會收到比較多選項與 trade-off；有限制會跳過不相關選項。
```

### Batch 4: 部署 + 學習目標

```
Q10. 部署環境？
  - Local / 自架 VPS
  - AWS
  - GCP
  - Azure
  - Cloudflare / Vercel / Netlify (Edge)
  - Kubernetes (任一 cloud)
  - 其他 / 還沒決定
  → Why: 決定 IaC 工具 (Terraform / CDK / Pulumi)、observability 選型 (CloudWatch / Stackdriver / Grafana)、CI/CD 模板。

Q11. 你想了解每個決策的程度？
  - Educational：每個決策我都想懂為什麼（會看每張 decision card）
  - Balanced：只看重要決策 (架構 / DB / API)，其他自動就好
  - Fast-handoff：盡快產出 spec 給 coder，少打擾我
  → Why: 決定後續 decision card 出現頻率與深度。Educational 會慢但學最多；fast-handoff 最快但你會錯過學習機會。

Q12. 你對哪些領域最沒把握？（多選）
  - 架構選型 (mono / micro / serverless)
  - 資料庫設計 (schema / index / migration)
  - API 設計 (REST / GraphQL / gRPC / 版控)
  - 部署 / CI/CD
  - 監控 / observability (log / metric / trace)
  - 測試策略 (unit / integration / e2e 比例)
  - 合規 / 資安
  - 都還好 (我有底)
  → Why: 系統會在這些領域多花教育成本（多 callout、多 trade-off 對比）。誠實選會得到最好的引導。
```

---

## Phase 3: 寫 bootstrap-intent.yaml

問卷完成後，把答案結構化寫入 `.claude/context/devteam/bootstrap-{feature}.yaml`：

```yaml
schema_version: 1
feature: {feature-slug}
created_at: {ISO}
created_by: devteam-bootstrap

business:
  problem_statement: |
    {Q1 業主回答}
  user_scale: "{Q2 選項}"
  latency_sensitivity: "{Q3 選項}"

compliance:
  data_types: [{Q4 多選}]
  frameworks: [{Q5 多選}]
  audit_required: "{Q6 選項}"

team_timeline:
  team_size: "{Q7 選項}"
  first_release_deadline: "{Q8 選項}"

stack:
  primary_language: "{Q9 選項}"
  deployment_env: "{Q10 選項}"

learning:
  mode: "{Q11: educational / balanced / fast-handoff}"
  weak_areas: [{Q12 多選}]

open_questions:
  # 任何業主回「不知道 / 還沒想過」的題目列在這
  - question_id: Q5
    reason: "業主未確認合規框架"
```

### 更新 state.json

把 bootstrap 完成旗標、學習模式、弱項一併寫進 `.claude/context/devteam/state.json`：

```json
{
  "bootstrap_done": true,
  "ux_mode": "educational",  // 或 balanced / fast-handoff
  "weak_areas": ["架構選型", "API 設計"]
}
```

**重要**：`bootstrap_done = true` 是 router Phase 2 分流的依據。沒寫這個 flag → router 下次仍會 dispatch 回 bootstrap，造成迴圈。Partial 完成（業主中途 skip 一半）也要寫 `bootstrap_done = true`，未答題目走 `open_questions[]` 機制。

---

## Phase 4: 預填 PRD（呼叫 devteam-pm 預填模式）

bootstrap 完成後**自動推進**到 P0_DISCOVERY 的 PRD 階段。要做兩件事：

1. 在 `.claude/context/devteam/session-{id}.md` 追加 bootstrap 摘要：

```markdown
## [{ISO}] devteam-bootstrap

完成 Architect Bootstrap Questionnaire。

- 用戶規模：{Q2}
- 延遲敏感度：{Q3}
- 資料等級：{Q4}（最高）
- 合規：{Q5}
- 團隊：{Q7} / Deadline：{Q8}
- Stack：{Q9} on {Q10}
- 學習模式：{Q11}
- Open questions：{count}

下一步：自動呼叫 devteam-pm 預填 PRD，業主只需補 problem statement 細節與 KPI。
```

2. 對業主輸出建議：

```
✅ Bootstrap 完成。我已經知道：
   - 你要做 {Q1 摘要} 給 {規模} 用戶
   - 延遲 {Q3}，合規需 {Q5}
   - 你 {team-size} 人團隊，{deadline} 要上線
   - Stack：{Q9} + {Q10}
   - 學習模式：{ux_mode}

下一步建議：執行 `/devteam-pm` 進入 PRD 撰寫。
我會基於 bootstrap-intent.yaml 預填 PRD 的 §3 Users、§4 Scope、§7 NFR baseline、§8 Dependencies。
你只需要補 §1 Problem Statement 細節與 §2 KPI 數值。
```

---

## Phase 5: 教育型 callout（Educational mode only）

若 `ux_mode == "educational"`，在問卷結束後額外輸出一段「你剛學到什麼」：

```markdown
## 你剛剛學到的 senior 思考框架

你回答的這 12 題，其實是 senior 工程師看到任何新需求時會自動跑一遍的 mental checklist：

1. **業務脈絡** (Q1-2)：先問規模，因為 100 vs 1M 用戶的架構決策完全不同
2. **延遲** (Q3)：決定快取 / CDN / async 設計
3. **資料敏感度** (Q4-6)：合規不是後話，是 day-1 決定 schema 與 audit log
4. **團隊 / 時程** (Q7-8)：技術選型必須匹配團隊能力與時間預算
5. **既有 stack** (Q9-10)：避免「酷炫但團隊不會」的選型

下次你看到任何新需求，可以自己跑一遍這 12 題 — 這就是「架構思考」的入門 muscle memory。
```

Educational mode 下，後續每個 ADR 與 decision card 也會附類似 callout。Balanced / fast-handoff 則略。

---

## Phase 6: 重執行 / 修改

業主可以執行：

- `/devteam-bootstrap` (no args) — 從頭跑問卷
- `/devteam-bootstrap "改 Q5 為 GDPR"` — 修改單題（不重跑整份）
- `/devteam-bootstrap show` — 顯示當前 bootstrap-intent.yaml

修改單題後，重新寫 yaml，**並標記下游受影響文件為 stale-minor**（規模 / 合規變更標 stale-major）。

---

## 輸出格式契約

每次本 skill 執行完，stdout 至少包含：

1. 問卷完成度（12/12 或 部分）
2. bootstrap-intent.yaml 路徑與摘要
3. state.json ux_mode 更新
4. session narrative 追加段落預覽
5. 對業主的下一步建議（通常是 `/devteam-pm`）
6. Educational mode 時：「你剛學到的 senior 思考框架」callout

---

## 失敗模式與處理

- **業主不耐煩中途想跳過** → 接受「Skip」答案，把 unanswered 題目列入 open_questions，仍寫 yaml。但 educational mode 下提醒：「跳過的題目下游會多次被問，建議現在花 30 秒填」
- **業主答案彼此矛盾**（例如 < 100 用戶但要 SOC2）→ 不自動修正，把矛盾標進 open_questions，由 PM phase 跟業主確認
- **重複執行** → 必須業主明確 confirm 覆寫，避免誤觸丟失先前答案
