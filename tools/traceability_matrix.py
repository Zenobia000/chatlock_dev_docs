"""Generate docs/_index/traceability-matrix.md from doc frontmatter.

Aggregates:
- FRs in docs/analysis/fr/ — mapped_to / superseded_clauses / emits_events / status
- BRs in docs/analysis/br/  — id / module
- ADRs in docs/architecture/adr/ — status / Migration Status block / module_scope

Outputs orphan/zombie/health flags.

Run: python3 tools/traceability_matrix.py
"""
import pathlib, re, yaml, sys, json
from collections import defaultdict
from datetime import date

ROOT = pathlib.Path(__file__).resolve().parent.parent
FR_DIR = ROOT / 'docs/analysis/fr'
BR_DIR = ROOT / 'docs/analysis/br'
ADR_DIR = ROOT / 'docs/architecture/adr'
OUT = ROOT / 'docs/_index/traceability-matrix.md'

FRONTMATTER_RE = re.compile(r'^---\n(.*?)\n---\n', re.DOTALL)
MIGRATION_BLOCK_RE = re.compile(r'🔄 Migration Status \(2026-05-28\)\*\*: `([^`]+)`')
MODULE_SCOPE_RE = re.compile(r'Module scope\*\*: ([^\n]+)')

def parse_yaml_frontmatter(path):
    try:
        text = path.read_text(encoding='utf-8')
    except Exception:
        return None, ''
    m = FRONTMATTER_RE.match(text)
    if not m:
        return None, text
    try:
        return yaml.safe_load(m.group(1)) or {}, text
    except Exception as e:
        return {'_parse_error': str(e)}, text

def parse_adr_migration(text):
    """ADR uses quoted markdown block, not yaml frontmatter."""
    mig = MIGRATION_BLOCK_RE.search(text)
    scope = MODULE_SCOPE_RE.search(text)
    return {
        'migration_status': mig.group(1) if mig else None,
        'module_scope': scope.group(1).strip() if scope else None,
    }

def adr_title(path):
    """Extract H1 title from ADR markdown."""
    try:
        for line in path.read_text(encoding='utf-8').splitlines()[:50]:
            if line.startswith('# '):
                return line[2:].strip()
    except Exception:
        pass
    return path.stem

def scan_frs():
    out = []
    for f in sorted(FR_DIR.glob('FR-*.md')):
        fm, _ = parse_yaml_frontmatter(f)
        if fm is None: continue
        out.append({
            'id': fm.get('id', f.stem),
            'title': fm.get('title', ''),
            'status': fm.get('status', 'unknown'),
            'mapped_to': fm.get('mapped_to', []) or [],
            'superseded_clauses': fm.get('superseded_clauses', []) or [],
            'emits_events': fm.get('emits_events', []) or [],
            'nfr_flavored': fm.get('nfr_flavored', False),
            'superseded_by': fm.get('superseded_by', None),
            'phase': fm.get('phase', None),
            'path': str(f.relative_to(ROOT)),
        })
    return out

def scan_brs():
    out = []
    if not BR_DIR.exists():
        return out
    for f in sorted(BR_DIR.glob('BR-*.md')):
        fm, _ = parse_yaml_frontmatter(f)
        if fm is None: continue
        out.append({
            'id': fm.get('id', f.stem),
            'title': fm.get('title', ''),
            'module': fm.get('module', ''),
            'path': str(f.relative_to(ROOT)),
        })
    return out

def scan_adrs():
    out = []
    for f in sorted(ADR_DIR.glob('ADR-*.md')):
        text = f.read_text(encoding='utf-8')
        mig = parse_adr_migration(text)
        title = adr_title(f)
        out.append({
            'id': f.stem.split('-')[0] + '-' + (f.stem.split('-')[1] if len(f.stem.split('-')) > 1 else ''),
            'file_id': f.stem.split('-')[0:2],
            'full_stem': f.stem,
            'title': title,
            'migration_status': mig['migration_status'] or 'NOT_CLASSIFIED',
            'module_scope': mig['module_scope'] or '-',
            'path': str(f.relative_to(ROOT)),
        })
    return out

def main():
    frs = scan_frs()
    brs = scan_brs()
    adrs = scan_adrs()

    # Health checks
    orphan_fr = [f for f in frs if not f['mapped_to'] and f['status'] != 'superseded']
    superseded_fr = [f for f in frs if f['status'] == 'superseded']
    active_fr = [f for f in frs if f['status'] != 'superseded']

    adr_active = [a for a in adrs if 'STILL_VALID' in (a['migration_status'] or '')]
    adr_historical = [a for a in adrs if a['migration_status'] == 'HISTORICAL']
    adr_review = [a for a in adrs if 'REVIEW_REQUIRED' in (a['migration_status'] or '')]
    adr_partial = [a for a in adrs if 'PARTIAL_UPDATE' in (a['migration_status'] or '')]
    adr_unclassified = [a for a in adrs
                        if a['migration_status'] in (None, 'NOT_CLASSIFIED')
                        and not a['full_stem'].endswith('INDEX')
                        and a not in adr_partial
                        and a not in adr_active
                        and a not in adr_historical
                        and a not in adr_review]

    # by-module index
    by_module = defaultdict(lambda: {'frs': [], 'adrs': []})
    for f in frs:
        for m in f['mapped_to']:
            by_module[m]['frs'].append(f)
    for a in adrs:
        if a['module_scope'] and a['module_scope'] != '-':
            for m in re.split(r'[,，\s]+', a['module_scope']):
                m = m.strip()
                if m: by_module[m]['adrs'].append(a)

    today = date.today().isoformat()
    lines = []
    lines.append('---')
    lines.append('id: traceability-matrix')
    lines.append('title: FR ↔ BR ↔ ADR Traceability Matrix (auto-generated)')
    lines.append(f'last_generated: {today}')
    lines.append('generated_by: tools/traceability_matrix.py')
    lines.append('source_specs:')
    lines.append('  - docs/_source/01-workorder-erp.md')
    lines.append('  - docs/_source/02-ai-chatbot-sync.md')
    lines.append('---')
    lines.append('')
    lines.append('# Traceability Matrix (auto-generated)')
    lines.append('')
    lines.append(f'> 自動生成自 `tools/traceability_matrix.py`，請勿手改。')
    lines.append(f'> Last generated: **{today}**')
    lines.append('> 改 frontmatter 後重跑此 script 即可刷新。')
    lines.append('')
    lines.append('---')
    lines.append('')

    # §1 Dashboard
    lines.append('## §1 Coverage Dashboard')
    lines.append('')
    lines.append('| 指標 | 計數 | 健康 |')
    lines.append('|:-----|:-----|:-----|')
    lines.append(f'| Total FR | {len(frs)} | — |')
    lines.append(f'| Total BR | {len(brs)} | — |')
    lines.append(f'| Total ADR | {len(adrs)} | — |')
    lines.append(f'| FR status: active | {len(active_fr)} | — |')
    lines.append(f'| FR status: superseded | {len(superseded_fr)} | ✅ tracked |')
    lines.append(f'| FR with empty `mapped_to` (orphan) | {len(orphan_fr)} | {"🔴" if orphan_fr else "✅"} |')
    lines.append(f'| ADR migration_status: STILL_VALID | {len(adr_active)} | ✅ |')
    lines.append(f'| ADR migration_status: HISTORICAL | {len(adr_historical)} | ✅ |')
    lines.append(f'| ADR migration_status: REVIEW_REQUIRED | {len(adr_review)} | 🟡 awaiting A2.4 critique |')
    lines.append(f'| ADR migration_status: PARTIAL_UPDATE | {len(adr_partial)} | 🟢 Lane A done, 6 dim cascade pending |')
    lines.append(f'| ADR not yet classified (incl. new post-2026-05-28 ADRs) | {len(adr_unclassified)} | {"🟡" if adr_unclassified else "✅"} |')
    lines.append('')
    lines.append('---')
    lines.append('')

    # §2 FR table
    lines.append('## §2 FR → mapped_to / events / status')
    lines.append('')
    lines.append('| FR ID | Title | Status | mapped_to | superseded_clauses | emits_events | NFR-flavored |')
    lines.append('|:------|:------|:-------|:----------|:-------------------|:-------------|:-------------|')
    for f in frs:
        mapped = ', '.join(f['mapped_to']) if f['mapped_to'] else '_(empty)_'
        sc = ', '.join(f['superseded_clauses']) if f['superseded_clauses'] else '-'
        ev = ', '.join(f['emits_events']) if f['emits_events'] else '-'
        nfr = '⚠️ yes' if f['nfr_flavored'] else '-'
        status = f['status']
        if status == 'superseded':
            status = f'↶ superseded'
        lines.append(f"| [{f['id']}]({f['path']}) | {f['title']} | {status} | {mapped} | {sc} | {ev} | {nfr} |")
    lines.append('')
    lines.append('---')
    lines.append('')

    # §3 by-module
    lines.append('## §3 By-Module Reverse Index')
    lines.append('')
    for module in sorted(by_module.keys()):
        entry = by_module[module]
        if not entry['frs'] and not entry['adrs']:
            continue
        lines.append(f'### {module}')
        lines.append('')
        if entry['frs']:
            lines.append('**FRs**:')
            for f in entry['frs']:
                lines.append(f"- [{f['id']}]({f['path']}) — {f['title']}")
            lines.append('')
        if entry['adrs']:
            lines.append('**ADRs**:')
            for a in entry['adrs']:
                lines.append(f"- [{a['full_stem']}]({a['path']}) — {a['title']} ({a['migration_status']})")
            lines.append('')
    lines.append('---')
    lines.append('')

    # §4 ADR migration table
    lines.append('## §4 ADR Migration Status (per ADR-0100 §1)')
    lines.append('')
    lines.append('| ADR | Title | Migration Status | Module Scope |')
    lines.append('|:----|:------|:-----------------|:-------------|')
    for a in adrs:
        if a['full_stem'].endswith('INDEX'): continue
        lines.append(f"| [{a['full_stem']}]({a['path']}) | {a['title']} | {a['migration_status']} | {a['module_scope']} |")
    lines.append('')
    lines.append('---')
    lines.append('')

    # §5 Health issues
    lines.append('## §5 Health Issues')
    lines.append('')
    if orphan_fr:
        lines.append('### 🔴 Orphan FR (mapped_to empty + status != superseded)')
        for f in orphan_fr:
            lines.append(f"- {f['id']} — {f['title']} ({f['path']})")
        lines.append('')
    if adr_unclassified:
        lines.append('### 🟡 ADR not yet classified')
        for a in adr_unclassified:
            lines.append(f"- {a['full_stem']} ({a['path']})")
        lines.append('')
    if adr_review:
        lines.append('### 🟡 ADR awaiting Lane A critique (A2.4 task)')
        for a in adr_review:
            lines.append(f"- {a['full_stem']} — {a['title']}")
        lines.append('')
    if not orphan_fr and not adr_unclassified and not adr_review:
        lines.append('✅ No health issues detected.')
        lines.append('')

    # §6 Notes
    lines.append('---')
    lines.append('')
    lines.append('## §6 Notes')
    lines.append('')
    lines.append('- This is **baseline run 2026-05-28** before A3.2 FR rewrite (B\' 殼) and A3.4 new FR creation.')
    lines.append('- Orphan FRs are expected to be high right now — 23 active FRs don\'t have `mapped_to` because they\'re v2.2 era. A3.2 will fix this.')
    lines.append('- Zero `superseded_clauses` / `emits_events` will populate after A3.2 + A3.4.')
    lines.append('- BR directory only contains `BR-AUDIT-007` currently. 64 new BR-M??-NN files come from new spec, will be added in cascade phase.')

    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text('\n'.join(lines), encoding='utf-8')
    print(f'Generated {OUT.relative_to(ROOT)}')
    print(f'  FRs: {len(frs)} ({len(active_fr)} active + {len(superseded_fr)} superseded)')
    print(f'  BRs: {len(brs)}')
    print(f'  ADRs: {len(adrs)} ({len(adr_active)} active + {len(adr_historical)} historical + {len(adr_review)} review + {len(adr_partial)} partial-update + {len(adr_unclassified)} unclassified)')
    print(f'  Orphan FR: {len(orphan_fr)}')

if __name__ == '__main__':
    main()
