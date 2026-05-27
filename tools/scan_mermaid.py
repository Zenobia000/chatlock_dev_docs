"""Scan mermaid blocks in docs/ux/by-module/ for known problematic patterns."""
import re, pathlib

DOCS = list(pathlib.Path('docs/ux/by-module').glob('*.md'))
DOCS.sort()

ISSUES = []

def extract_blocks(text):
    """Return list of (start_line, kind, code) for each mermaid block."""
    blocks = []
    lines = text.split('\n')
    i = 0
    while i < len(lines):
        if lines[i].startswith('```mermaid'):
            start = i + 1
            j = i + 1
            while j < len(lines) and not lines[j].startswith('```'):
                j += 1
            code = '\n'.join(lines[start:j])
            first_real = next((l.strip() for l in code.split('\n') if l.strip()), '')
            kind = 'unknown'
            if first_real.startswith('sequenceDiagram'): kind = 'sequence'
            elif first_real.startswith('stateDiagram'): kind = 'state'
            elif first_real.startswith('flowchart') or first_real.startswith('graph'): kind = 'flowchart'
            elif first_real.startswith('classDiagram'): kind = 'class'
            elif first_real.startswith('erDiagram'): kind = 'er'
            blocks.append((start + 1, kind, code))
            i = j + 1
        else:
            i += 1
    return blocks

def check_sequence(code):
    """Check sequenceDiagram patterns."""
    issues = []
    # Self-message + activate (Pattern 1)
    lines = code.split('\n')
    has_activate = any('activate ' in l for l in lines)
    self_msg = re.findall(r'(\w+)\s*->>?\s*\1\s*:', code)
    if self_msg and has_activate:
        issues.append(f'Pattern 1: self-message {self_msg} + activate (may not crash but suspicious)')
    # Multi-actor Note over (Pattern 2)
    for m in re.finditer(r'[Nn]ote\s+over\s+([\w,\s]+):', code):
        actors = [a.strip() for a in m.group(1).split(',')]
        if len(actors) >= 3:
            issues.append(f'Pattern 2: Note over {len(actors)} actors ({", ".join(actors)})')
    # Long message label
    for line in lines:
        m = re.match(r'\s*\w+\s*-+>>?\s*\w+\s*:\s*(.+)', line)
        if m and len(m.group(1)) > 80:
            issues.append(f'Pattern 6: long message label ({len(m.group(1))} chars): {m.group(1)[:60]}...')
    return issues

def check_state(code):
    """Check stateDiagram patterns."""
    issues = []
    # Self-transition (Pattern 3)
    for m in re.finditer(r'(\w+)\s*-+>\s*\1\b', code):
        issues.append(f'Pattern 3: self-transition {m.group(1)} --> {m.group(1)}')
    # Long transition label (Pattern 4)
    for m in re.finditer(r'-+>\s*\w+\s*:\s*(.+)', code):
        label = m.group(1).strip()
        if len(label) > 40:
            issues.append(f'Pattern 4: long transition label ({len(label)} chars): {label[:50]}...')
    # Choice node with many branches
    choice_count = len(re.findall(r'<<choice>>', code))
    branch_count = code.count('-->')
    if choice_count > 0 and branch_count > 15:
        issues.append(f'Pattern 4b: {choice_count} choice node(s) with {branch_count} branches (complex layout)')
    # Composite state nesting depth
    nest = 0
    max_nest = 0
    for line in code.split('\n'):
        s = line.strip()
        if s.startswith('state ') and '{' in s:
            nest += 1
            max_nest = max(max_nest, nest)
        if s == '}':
            nest -= 1
    if max_nest >= 3:
        issues.append(f'Pattern 4c: composite state nesting depth = {max_nest} (>= 3 may break layout)')
    return issues

def check_flowchart(code):
    """Check flowchart patterns."""
    issues = []
    # subgraph + cross-cutting (Pattern 5) — heuristic
    subgraph_nodes = set()
    in_sg = False
    for line in code.split('\n'):
        s = line.strip()
        if s.startswith('subgraph'): in_sg = True
        elif s == 'end': in_sg = False
        elif in_sg:
            m = re.match(r'(\w+)\s*[\[\(\{]', s)
            if m: subgraph_nodes.add(m.group(1))
    # Find edges where one side is in subgraph_nodes and other isn't
    # (this is rough — only flag if many)
    cross = 0
    for m in re.finditer(r'(\w+)\s*-+>\s*(\w+)', code):
        a, b = m.group(1), m.group(2)
        if (a in subgraph_nodes) != (b in subgraph_nodes):
            cross += 1
    if cross > 5:
        issues.append(f'Pattern 5: {cross} cross-subgraph edges (may confuse layout)')
    # Cycle detection (simple)
    edges = re.findall(r'(\w+)\s*-+>\s*(\w+)', code)
    if len(edges) > 30:
        issues.append(f'Pattern 5b: {len(edges)} edges (large graph, slow layout)')
    return issues

for path in DOCS:
    text = path.read_text(encoding='utf-8')
    blocks = extract_blocks(text)
    for start_line, kind, code in blocks:
        if kind == 'sequence':
            problems = check_sequence(code)
        elif kind == 'state':
            problems = check_state(code)
        elif kind == 'flowchart':
            problems = check_flowchart(code)
        else:
            problems = []
        if problems:
            ISSUES.append((path.name, start_line, kind, problems))

if not ISSUES:
    print('✅ No problematic patterns found in 20 by-module flow docs.')
else:
    print(f'⚠️  Found {len(ISSUES)} blocks with suspicious patterns:\n')
    by_file = {}
    for f, ln, k, ps in ISSUES:
        by_file.setdefault(f, []).append((ln, k, ps))
    for f in sorted(by_file):
        print(f'\n## {f}')
        for ln, k, ps in by_file[f]:
            print(f'  Line {ln} ({k}):')
            for p in ps:
                print(f'    - {p}')
