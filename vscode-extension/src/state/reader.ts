import * as fs from 'fs';
import * as path from 'path';
import * as YAML from 'yaml';
import {
  AdrLedgerEntry,
  BootstrapIntent,
  DevTeamState,
  DocIndexEntry,
  DocMeta,
  RoundtableMom,
} from './types';
import {
  getAdrLedgerPath,
  getBootstrapYamlPath,
  getDocMetaPath,
  getReviewsDir,
  getRoundtablesDir,
  getStatePath,
} from './paths';

export function readState(root: string): DevTeamState | null {
  const p = getStatePath(root);
  if (!fs.existsSync(p)) return null;
  try {
    return JSON.parse(fs.readFileSync(p, 'utf-8')) as DevTeamState;
  } catch {
    return null;
  }
}

export function readBootstrapIntent(root: string, feature: string): BootstrapIntent | null {
  const p = getBootstrapYamlPath(root, feature);
  if (!fs.existsSync(p)) return null;
  try {
    return YAML.parse(fs.readFileSync(p, 'utf-8')) as BootstrapIntent;
  } catch {
    return null;
  }
}

export function readDocumentsIndex(
  root: string,
  indexPath: string
): Record<string, DocIndexEntry> {
  if (!fs.existsSync(indexPath)) return {};
  try {
    return JSON.parse(fs.readFileSync(indexPath, 'utf-8'));
  } catch {
    return {};
  }
}

export function readDocMeta(root: string, docPath: string): DocMeta | null {
  const p = getDocMetaPath(root, docPath);
  if (!fs.existsSync(p)) return null;
  try {
    return JSON.parse(fs.readFileSync(p, 'utf-8')) as DocMeta;
  } catch {
    return null;
  }
}

export function readAdrLedger(root: string): AdrLedgerEntry[] {
  const p = getAdrLedgerPath(root);
  if (!fs.existsSync(p)) return [];
  try {
    const data = JSON.parse(fs.readFileSync(p, 'utf-8'));
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

export interface ReviewReport {
  path: string;
  filename: string;
  modified: number;
}

export function readReviewsList(root: string): ReviewReport[] {
  const dir = getReviewsDir(root);
  if (!fs.existsSync(dir)) return [];
  try {
    return fs
      .readdirSync(dir)
      .filter((f) => f.endsWith('.md'))
      .map((f) => {
        const full = path.join(dir, f);
        const stat = fs.statSync(full);
        return { path: full, filename: f, modified: stat.mtimeMs };
      })
      .sort((a, b) => b.modified - a.modified);
  } catch {
    return [];
  }
}

export function readMarkdown(filePath: string): string | null {
  if (!fs.existsSync(filePath)) return null;
  try {
    return fs.readFileSync(filePath, 'utf-8');
  } catch {
    return null;
  }
}

export function listRoundtables(root: string): { filename: string; path: string; modified: number }[] {
  const dir = getRoundtablesDir(root);
  if (!fs.existsSync(dir)) return [];
  try {
    return fs
      .readdirSync(dir)
      .filter((f) => f.endsWith('.md'))
      .map((f) => {
        const full = path.join(dir, f);
        const stat = fs.statSync(full);
        return { filename: f, path: full, modified: stat.mtimeMs };
      })
      .sort((a, b) => b.modified - a.modified);
  } catch {
    return [];
  }
}

export function readRoundtableMom(root: string, filename: string): RoundtableMom | null {
  const full = path.join(getRoundtablesDir(root), filename);
  if (!fs.existsSync(full)) return null;
  try {
    const raw = fs.readFileSync(full, 'utf-8');
    return parseMom(raw, full, filename);
  } catch {
    return null;
  }
}

function parseMom(raw: string, filePath: string, filename: string): RoundtableMom {
  const fm = parseFrontmatter(raw);
  const body = fm.body;

  // attempt to extract MoM sections by markdown headers
  const sections = splitByH2(body);
  const get = (...names: string[]): string => {
    for (const n of names) {
      const lower = n.toLowerCase();
      for (const [title, content] of sections) {
        if (title.toLowerCase().includes(lower)) return content;
      }
    }
    return '';
  };
  const bullets = (s: string): string[] =>
    s
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => /^[-*+]\s+/.test(l))
      .map((l) => l.replace(/^[-*+]\s+/, ''));

  // derive feature & related_decision: frontmatter first, then filename heuristic
  const filenameOq = filename.match(/oq[-_]?(\d+)/i);
  const fmRelated = typeof fm.data.related_decision === 'string' ? (fm.data.related_decision as string) : undefined;
  const related: string | undefined = fmRelated || (filenameOq ? `OQ-${filenameOq[1].padStart(3, '0')}` : undefined);

  return {
    topic: (fm.data.topic as string) || (sections[0]?.[0] ?? filename.replace(/\.md$/, '')),
    feature: fm.data.feature as string | undefined,
    related_decision: related,
    executive_summary: get('Executive Summary', '摘要', 'Summary'),
    decisions: bullets(get('Decisions', '決議')),
    action_items: bullets(get('Action Items', 'TODO', '行動項')),
    open_questions: bullets(get('Open Questions', '待裁決', '懸案')),
    raw_markdown: raw,
    file_path: filePath,
  };
}

function parseFrontmatter(raw: string): { data: Record<string, unknown>; body: string } {
  const m = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!m) return { data: {}, body: raw };
  const data: Record<string, unknown> = {};
  for (const line of m[1].split('\n')) {
    const kv = line.match(/^(\w+):\s*(.+)$/);
    if (kv) data[kv[1]] = kv[2].trim().replace(/^["']|["']$/g, '');
  }
  return { data, body: m[2] };
}

function splitByH2(body: string): [string, string][] {
  const lines = body.split('\n');
  const out: [string, string][] = [];
  let title = '';
  let buf: string[] = [];
  for (const line of lines) {
    const h = line.match(/^##\s+(.+)$/);
    if (h) {
      if (title) out.push([title, buf.join('\n').trim()]);
      title = h[1].trim();
      buf = [];
    } else {
      buf.push(line);
    }
  }
  if (title) out.push([title, buf.join('\n').trim()]);
  return out;
}
