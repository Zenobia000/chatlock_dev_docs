# Forum Topic: <topic-id>

> **Created at**: <ISO>
> **Created by**: <user | router-auto-escalate>
> **Target**: <docs/path or "議題：xxx">
> **Status**: in_progress | converged | escalated_to_user | degraded
> **Max rounds**: 3

---

## 議題一句話

<one-line topic statement>

## 觸發來源

- [ ] 業主主動 `/devteam-forum`
- [ ] Router auto-escalate from Lane A review（`--from-review=<id>`）
- [ ] Driver skill 內部升級（如 PRD scope 重大變更）

## 參與 Personas

| Persona | 受邀理由 |
|:--------|:---------|
| pm | <一句話為何邀請此 persona> |
| sre | ... |
| ... | ... |

> **限制**：必須是 12 既有 personas 之一，不可發明新 persona。
> 12 既有清單：pm / po / ba / sa / ux / ui / arch / sd / dba / qa / devops / sre

## Affected Dimensions（預判，proposer 在 R1 會確認）

從 `06_quality_attributes_catalog.md` 9 維度中標記：

- [ ] Performance
- [ ] Availability
- [ ] Reliability
- [ ] Scalability
- [ ] Security
- [ ] Privacy
- [ ] Accessibility
- [ ] Auditability
- [ ] Operability

## 引用上游 review（若有）

- `from_review`: `.claude/context/devteam/reviews/<review-id>.md`
- 該 review 標記的 conflicts 數: <n>

## Forum 進度

| Round | Status | 路徑 | Facilitator verdict |
|:------|:-------|:-----|:--------------------|
| R1 (Proposer) | pending / done | `round-1/proposer.md` | — |
| R2 (Critics) | pending / done | `round-2/*.md` | continue / converged |
| R3 (Proposer response) | pending / done | `round-3/proposer-response.md` | — |
| R3 末 (Critics ack) | pending / done | `round-3/*-ack.md` | converged / escalate / degrade |

## Final Report

連到 `final-report.md`（facilitator 收斂或強制升級後產出）。
