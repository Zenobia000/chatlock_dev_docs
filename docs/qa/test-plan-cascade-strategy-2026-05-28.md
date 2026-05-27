---
id: test-plan-cascade-strategy
title: Test Plan Cascade Strategy — Final Spec 2026-05-20 Migration
status: strategy (governance doc)
date: 2026-05-28
owner: devteam-qa
parent_doc: docs/qa/test-plan-smart-lock-saas.md
related_roundtable: 2026-05-27 final-spec-migration-strategy + 2026-05-28 user-flow-IA-strategy
---

# Test Plan Cascade Strategy

> A3.7 task — 因 FR 結構大幅改變（25 → 51 FR、引入 B' 殼、cross-module FR、新 chatbot+sync 系列），舊 test plan 需 cascade migration。
>
> **本 doc 是 strategy，不個別寫 test case**。test case 由 owner 依本策略逐 FR cascade（estimate 250+ test scenario）。

---

## §1 What changed (test plan 受影響範圍)

| 變動 | 對 test plan 影響 |
|:-----|:------------------|
| 49 active FR（從 25 → 49） | test scenario count +96%；舊 25 FR test 結構需 re-map 到新 mapped_to (M01-M20 / A01-A12 / S-M01-M06) |
| FR-0016 / FR-0024 → NFR matrix | 對應 test 移到 NFR test set；保留原 TC-IT-0062 等做 traceability |
| 新增 chatbot FR (FR-0026~0034) 含 §2.1 Example Dialogue | dialogue scenarios 自動成為 test fixture（QA 可從 §2.1 dialog 跑 E2E） |
| 新增 sync FR (FR-0035~0040) 含 idempotency + DLQ | integration test 大幅擴張（cross-system contract） |
| Cross-module FR (FR-0008 / FR-0013 / FR-0038) | 需 E2E scenario 跨多 module；不適合 unit-level test |
| ADR-0067 M18 config 治理 + ADR-0068 anti-corruption | config staged rollout test / config_version snapshot test / X-Config-Version 409 test 是新 test class |
| Phase II placeholder (FR-0044~0051) | 不在 Phase I test plan，列 placeholder 在 future scope |
| ADR-0050 PARTIAL_UPDATE | 9 列 visibility matrix 補 G/W/T → 對應 9 個 scenario 補進 RBAC test set |

---

## §2 Cascade Strategy

### §2.1 採 by-FR auto-generation 模式（不手動寫 250+ test case）

每個 FR 的 §2 Acceptance Criteria (G/W/T) **本身就是 test scenario spec**。Tool 從 FR frontmatter + G/W/T block 抽出，生成 test case stub：

```
FR-NNNN.md
└── §2 Acceptance Criteria
    ├── AC-01 (G/W/T) ──→ TC-FR-NNNN-AC-01 (auto-gen stub)
    ├── AC-02 (G/W/T) ──→ TC-FR-NNNN-AC-02
    └── ...
```

**新工具**：`tools/generate_test_stubs.py`（待寫，本 doc 列入 A3.7 follow-up）

優點：
- QA 不重寫 G/W/T（已在 FR 內）
- 自動 traceability (FR → TC 1:1 對應)
- FR rewrite 時 test stub 自動 sync

缺點 / mitigation：
- 自動生成 stub 不含實作（mock setup / assertion code）→ QA 仍需填實作層
- Cross-module FR 需手動補 integration scenario (auto-gen 只給 unit-level stub)

### §2.2 Test 分層策略（保持原 §1 Test Pyramid 結構）

| Layer | Source | Auto-gen? | Owner |
|:------|:-------|:---------:|:------|
| Unit test | per FR G/W/T AC | ✅ (stub) | dev (補實作) |
| Integration test (cross-module) | FR `mapped_to` 含多個 M | partial (matrix 提示) | QA + dev |
| E2E test | FR `mapped_to` 含 A 系列 + §2.1 Example Dialogue | partial (dialogue 變 fixture) | QA |
| Contract test (API) | OpenAPI + FR emits_events | ✅ (schema 對齊) | dev |
| Compliance test (合約紅線) | 合約 4.4 / SOW 2.1(4) / 個資 | ❌ 手動維護 | Compliance owner + QA |
| Performance test (NFR) | NFR matrix | ❌ 手動 (k6 / benchmark) | SRE |
| Regression test | failed-then-fixed history | ❌ 手動 | QA |
| Chaos test (M18 config) | ADR-0067/0068 fail-mode | ❌ 手動 (chaos engineering) | SRE |

### §2.3 Cascade 執行順序

```
Phase 1: Foundation (本 turn ~ 下 turn)
  ├─ 寫 tools/generate_test_stubs.py
  └─ 跑 baseline 生成 ~250+ test stub (per FR auto-gen)

Phase 2: Augment (~2 weeks)
  ├─ Compliance owner 補 §3 合約紅線 test set（手動）
  ├─ SRE 補 NFR matrix 對應 performance test
  └─ QA 補 cross-module FR integration scenario

Phase 3: ADR-0067/0068 Specific (~1 week)
  ├─ M18 config staged rollout test (chaos)
  ├─ X-Config-Version 409 test set
  └─ Per-transaction snapshot test

Phase 4: Integrate to CI/CD
  ├─ test stub 進 CI gate
  ├─ Compliance test 在 deploy gate 跑
  └─ Performance test 排程跑（夜間）
```

---

## §3 Test Stub Auto-gen Spec

### Input

- `docs/analysis/fr/FR-*.md`（49 active FR + 8 placeholder）
- frontmatter 抽 `id`, `mapped_to`, `superseded_clauses`, `emits_events`, `priority`, `phase`
- markdown body 抽 §2 Acceptance Criteria 內所有 ` ```gherkin ` block

### Output

- `tests/auto-gen/test_FR-NNNN.py` (Python test stub) — 一個 FR 一檔
- 每個 AC 生 `def test_FR_NNNN_AC_NN()` skeleton
- 含 `# TODO: implement` markers
- 含 frontmatter cross-ref

### Pseudocode

```python
def generate_stub(fr_path):
    fm = parse_frontmatter(fr_path)
    if fm.get('status') == 'placeholder':
        return None  # skip Phase II placeholder
    if fm.get('status') == 'superseded':
        emit_redirect_stub(fm)  # 標 superseded_by
        return
    acs = extract_gherkin_blocks(fr_path)
    test_file = []
    test_file.append(f'"""Auto-generated test stub for {fm.id}."""')
    test_file.append(f'# Source: {fr_path}')
    test_file.append(f'# Mapped to: {fm.mapped_to}')
    test_file.append(f'# Emits: {fm.emits_events}')
    test_file.append('')
    for i, ac in enumerate(acs, 1):
        test_file.append(f'def test_{fm.id}_AC_{i:02d}():')
        test_file.append(f'    """{ac.title}"""')
        test_file.append(f'    # Given')
        for line in ac.given_lines: test_file.append(f'    # {line}')
        test_file.append(f'    # When')
        for line in ac.when_lines: test_file.append(f'    # {line}')
        test_file.append(f'    # Then')
        for line in ac.then_lines: test_file.append(f'    # {line}')
        test_file.append(f'    raise NotImplementedError("TODO: implement")')
        test_file.append('')
    write(f'tests/auto-gen/test_{fm.id}.py', test_file)
```

### Coverage Targets (per [[06_quality_attributes_catalog]] §1)

| Layer | Target | Measure |
|:------|:-------|:--------|
| Unit (per FR AC) | 100% AC 有 stub | `pytest --collect-only` |
| Unit (實作率) | ≥ 80% AC 有實作 (非 NotImplementedError) | pytest pass rate |
| Integration | 100% cross-module FR 有 E2E | manual checklist |
| Compliance | 100% 合約紅線 + 200 題 forbidden corpus | 手動 + CI gate |

---

## §4 既有 Test Plan Doc 處理

`docs/qa/test-plan-smart-lock-saas.md` (483 行) 處理方式：

| 段落 | 動作 |
|:----|:----|
| §0 對抗思維 | 保留（governance frame，仍 valid）|
| §1 Test Pyramid | 保留 + 補 chatbot E2E layer |
| §2 KPI Test Scenarios (K1-K9) | 保留 + 補新 K-AI-1~6 (per PRD v2.3 §E.3) |
| §3 合約紅線 Test Plan | 保留 + 補 ADR-0067 config governance compliance |
| §後續 sections (~300 行) | 標 v2.3 Migration Note：refer to per-FR test stub |
| 頂部 frontmatter | 加 `v2.3 — migration in progress per A3.7 strategy` |

**不重寫 483 行**。本 strategy doc 是補強，原 test plan 加 frontmatter note 指向新 cascade 模式。

---

## §5 Open Questions (給業主)

| # | 問題 | 提案選項 | 建議 |
|:--|:-----|:---------|:-----|
| OQ-A3.7-1 | Test stub auto-gen 用什麼語言? | A) Python (與 dump tool 同)<br>B) Node/TS (與 frontend 同) | A (與既有 tools/ 一致) |
| OQ-A3.7-2 | Phase II placeholder FR 要不要也生 stub? | A) 生 (with `@pytest.mark.skip("Phase II")`)<br>B) 不生，Phase II 啟動再生 | B (避免噪音) |
| OQ-A3.7-3 | 自動生成 test stub commit 進 git 還是 .gitignore? | A) commit (snapshot) <br>B) gitignore (每次 CI 重生) | A (snapshot 利 PR review 看變動) |
| OQ-A3.7-4 | Cross-module FR (FR-0008/0013/0038) E2E scenario 誰寫? | A) QA 主導<br>B) Tech lead 主導<br>C) 隨 FR owner | C (FR owner 最熟 cross-module 邏輯) |

---

## §6 Follow-up Action Items

| # | Action | Owner | Priority | Depends |
|:--|:-------|:------|:---------|:--------|
| A3.7.1 | 業主回 §5 4 個 OQ | 業主 | P0 | (本 strategy) |
| A3.7.2 | 寫 `tools/generate_test_stubs.py` | `devteam-devops` | P0 | A3.7.1 |
| A3.7.3 | 跑 baseline 生成 ~250+ test stub | `devteam-qa` | P0 | A3.7.2 |
| A3.7.4 | Compliance owner 補 §3 合約紅線 test set | Compliance + QA | P0 | A3.7.3 |
| A3.7.5 | SRE 補 NFR performance test | `devteam-sre` | P1 | A3.7.3 |
| A3.7.6 | QA 補 cross-module FR integration scenarios | `devteam-qa` + FR owners | P1 | A3.7.3 |
| A3.7.7 | ADR-0067/0068 specific test set (config governance chaos) | `devteam-sre` | P1 | ADR-0068 SDK ready |
| A3.7.8 | Integrate to CI/CD gate | `devteam-devops` | P1 | A3.7.3~6 |
| A3.7.9 | 既有 test-plan.md frontmatter 加 v2.3 migration note | `devteam-qa` | P2 | A3.7.1 |

---

## §7 Cross-references

- 既有 test plan: [`docs/qa/test-plan-smart-lock-saas.md`](test-plan-smart-lock-saas.md)
- FR 範本: [`devteam_knowledge_base/templates/fr-skeleton.md`](../../devteam_knowledge_base/templates/fr-skeleton.md) §2 G/W/T 為 test source
- Traceability matrix: [`docs/_index/traceability-matrix.md`](../_index/traceability-matrix.md) §2 FR → events
- ADR-0067/0068: 新 test class 來源
- KB: [[06_quality_attributes_catalog]] §1 9 維度 / [[09_observability_catalog]] §3 SLI test mapping

---

**A3.7 strategy 完成 — 後續 cascade 由 owner 依本策略執行 9 個 action items**
