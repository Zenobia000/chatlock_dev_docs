# 法務一頁式詮釋備忘

**主題**：合約 §V21 4.4(d)「家族成員覆核紀錄」之履約方式詮釋
**日期**：2026-05-24 草擬 / 待法務 sign-off
**起草**：BA 龍蝦（業主 MoM #1 Q2 授權）
**法務簽核**：___________ / Date: ___________
**業主確認**：___________ / Date: ___________
**版本**：v1 draft

---

## 一、合約條文原文（標的）

> 合約 V21 §4.4(d)：「**家族成員覆核紀錄**」屬於甲方驗收要件之一，乙方須提供家族成員對 SOP / 重大決策的覆核紀錄。

**條文未明文規定**：覆核是否需「同步阻擋流程」、是否需「事前簽核」、是否需「特定 SLA」。

---

## 二、詮釋結論

「**家族成員覆核紀錄**」之履約方式採以下詮釋：

> **覆核紀錄 = retrospective review event log**（事後可追溯的事件記錄）+ **7 日 dispute window**（家族覆核員 7 日內可對任何已發生決策提異議）+ **append-only + hash chain**（不可篡改保證）

具體實作見：
- BR-AUDIT-007 Family Reviewer event log 三要件
- ADR-0061 v2 update（OPA Rego BR-PII-001a status = dormant；履約路徑改 retrospective）
- ADR-PII-002 資料極小化雙層防線

---

## 三、法源 / 慣例支撐

| 法源 / 業界慣例 | 支撐論點 |
|:---|:---|
| 合約 §V21 4.4(d) 條文文字 | 「覆核紀錄」是 evidence-class 要求，未指定 enforcement timing（同步 vs 事後） |
| 商業會計法 §83 | 「足資證明事項之經過」對應 audit log；append-only + hash chain 是業界公認 immutability 強度 |
| 個資法 §27 | 保有者安全維護義務 → keeper-style retrospective audit 路徑滿足 |
| 個資法 §12 | 事故通報義務 → dispute event 可 query，符合通報要件 |
| 美國 SOX / 國內金融業 audit 慣例 | 大量採 retrospective review + dispute window（4-eyes principle 不強制同步）|
| 業界 SaaS（如 Salesforce / Datadog audit log）| event log + retention 為合規工具，未強制每事件前置核准 |

---

## 四、風險評估

| 風險 | 等級 | Mitigation |
|:---|:---|:---|
| 甲方審計時不接受 retrospective 詮釋 | 🟡 中 | 本備忘 + BR-AUDIT-007 + 三方 sign-off matrix（甲方 PM + 會計 + 法務）於 V2 sprint planning 前完成 |
| 家族覆核員未在 7 日內 dispute → 視為默認 approve | 🟢 低 | UI 提示倒數 + email 提醒 + 缺席 ≥ 3 件觸發 ChangeRequest 提名替補 |
| 監管機關（個資法 / 商業會計法）抽查時要求補強 | 🟢 低 | hash chain + ADR-PII-002 雙層防線 + read-side access log 滿足 |

---

## 五、不需修約的依據

1. 合約原文未強制 enforcement timing（同步 vs retrospective）
2. retrospective + dispute + hash chain = 業界 audit 強度
3. 不影響甲方法定權益（家族覆核員仍可全程介入、7 日 dispute、escalate）

**結論**：本詮釋屬於「履約方式選擇」而非「合約條款變更」，不需走 contract amendment 流程。

---

## 六、簽核欄

- [ ] **BA**：起草確認 / Date: ___________
- [ ] **法務**：詮釋同意 / Date: ___________
- [ ] **業主**：合約代表確認 / Date: ___________
- [ ] **甲方 PM**：簽收備忘 / Date: ___________

---

## 七、關聯文件

- 合約 V21 §4.4(d) 原文（法務檔案）
- BR-AUDIT-007 event log 三要件規格
- ADR-0061 v2 update（OPA Rego dormant）
- ADR-PII-002 資料極小化
- MoM #1: `.claude/context/devteam/meetings/2026-05-24-1430-oq-cascade-review/MoM.md` D4 + DR-0004

---

**End of legal memo v1 draft**

> 此備忘為 W1 hard DoR blocker — 沒簽核 V1 sprint 不開（業主 PM R2 確認）。
