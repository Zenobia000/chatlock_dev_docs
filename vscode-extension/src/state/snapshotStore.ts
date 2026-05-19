import * as fs from 'fs';
import * as path from 'path';
import { Snapshot } from './types';
import { getSnapshotsForDoc } from './paths';

const MAX_KEEP = 10;

export function ensureSnapshotDir(root: string, docPath: string): string {
  const dir = getSnapshotsForDoc(root, docPath);
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

export function listSnapshots(root: string, docPath: string): Snapshot[] {
  const dir = getSnapshotsForDoc(root, docPath);
  if (!fs.existsSync(dir)) return [];
  try {
    const entries = fs.readdirSync(dir);
    const snaps: Snapshot[] = [];
    for (const f of entries) {
      // skip archived / pruned markers — they live alongside but are not listed as current versions
      if (f.startsWith('.archived-') || f.startsWith('.pruned-')) continue;
      const m = f.match(/^v(\d+)-(.+?)(?:--(.+))?\.md$/);
      if (!m) continue;
      const stat = fs.statSync(path.join(dir, f));
      snaps.push({
        version: parseInt(m[1], 10),
        timestamp: m[2].replace(/-/g, ':').replace(/T(\d\d):(\d\d):(\d\d)/, 'T$1:$2:$3'),
        source: ((m[3] as Snapshot['source']) || 'cli'),
        filename: f,
        size: stat.size,
      });
    }
    return snaps.sort((a, b) => b.version - a.version);
  } catch {
    return [];
  }
}

export function readSnapshot(root: string, docPath: string, filename: string): string | null {
  const full = path.join(getSnapshotsForDoc(root, docPath), filename);
  if (!fs.existsSync(full)) return null;
  try {
    return fs.readFileSync(full, 'utf-8');
  } catch {
    return null;
  }
}

export function createSnapshot(args: {
  root: string;
  docPath: string;
  content: string;
  source: Snapshot['source'];
  note?: string;
}): Snapshot {
  const dir = ensureSnapshotDir(args.root, args.docPath);
  const existing = listSnapshots(args.root, args.docPath);
  const nextVersion = existing.length > 0 ? existing[0].version + 1 : 1;
  const ts = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `v${nextVersion}-${ts}--${args.source}.md`;
  const full = path.join(dir, filename);
  fs.writeFileSync(full, args.content, 'utf-8');
  prune(args.root, args.docPath);
  return {
    version: nextVersion,
    timestamp: new Date().toISOString(),
    source: args.source,
    filename,
    note: args.note,
    size: fs.statSync(full).size,
  };
}

export function restoreSnapshot(args: {
  root: string;
  docPath: string;
  filename: string;
}): { ok: boolean; restoredVersion?: number; error?: string } {
  const dir = getSnapshotsForDoc(args.root, args.docPath);
  const src = path.join(dir, args.filename);
  if (!fs.existsSync(src)) return { ok: false, error: `snapshot ${args.filename} not found` };
  const content = fs.readFileSync(src, 'utf-8');
  const targetDoc = path.join(args.root, args.docPath);
  fs.mkdirSync(path.dirname(targetDoc), { recursive: true });
  fs.writeFileSync(targetDoc, content, 'utf-8');
  const snap = createSnapshot({
    root: args.root,
    docPath: args.docPath,
    content,
    source: 'vscode-restore',
    note: `restored from ${args.filename}`,
  });
  return { ok: true, restoredVersion: snap.version };
}

export function archiveDocument(args: {
  root: string;
  docPath: string;
}): { ok: boolean; archivedTo?: string; error?: string } {
  const docFull = path.join(args.root, args.docPath);
  if (!fs.existsSync(docFull)) return { ok: false, error: `doc ${args.docPath} not found` };

  const content = fs.readFileSync(docFull, 'utf-8');
  const dir = ensureSnapshotDir(args.root, args.docPath);
  const ts = new Date().toISOString().replace(/[:.]/g, '-');
  const archivedName = `.archived-${ts}.md`;
  const archivedPath = path.join(dir, archivedName);
  fs.writeFileSync(archivedPath, content, 'utf-8');
  fs.unlinkSync(docFull);
  return { ok: true, archivedTo: archivedPath };
}

function prune(root: string, docPath: string): void {
  const dir = getSnapshotsForDoc(root, docPath);
  const snaps = listSnapshots(root, docPath);
  if (snaps.length <= MAX_KEEP) return;
  const toPrune = snaps.slice(MAX_KEEP); // oldest beyond MAX_KEEP
  const prunedDir = path.join(dir, '.pruned-archive');
  fs.mkdirSync(prunedDir, { recursive: true });
  for (const s of toPrune) {
    try {
      fs.renameSync(path.join(dir, s.filename), path.join(prunedDir, s.filename));
    } catch {
      // ignore
    }
  }
}
