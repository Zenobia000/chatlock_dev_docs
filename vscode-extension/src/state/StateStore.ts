import { EventEmitter } from 'events';
import * as fs from 'fs';
import * as path from 'path';
import {
  AdrLedgerEntry,
  BootstrapIntent,
  DevTeamState,
  DocIndexEntry,
  DocMeta,
} from './types';
import {
  readAdrLedger,
  readBootstrapIntent,
  readDocMeta,
  readDocumentsIndex,
  listRoundtables,
  readReviewsList,
  readState,
  ReviewReport,
} from './reader';
import {
  getBootstrapYamlPath,
  getDocsRoot,
  getDocumentsIndexPath,
} from './paths';
import { StateWatcher } from './StateWatcher';

export interface Snapshot {
  state: DevTeamState | null;
  documents: Record<string, DocIndexEntry>;
  adrLedger: AdrLedgerEntry[];
  reviews: ReviewReport[];
  bootstrap: BootstrapIntent | null;
  docFiles: string[];
  roundtables: { filename: string; path: string; modified: number }[];
}

export class StateStore extends EventEmitter {
  private watcher: StateWatcher;
  private snapshotCache: Snapshot;

  constructor(private root: string) {
    super();
    this.watcher = new StateWatcher(root);
    this.snapshotCache = this.computeSnapshot();
    this.watcher.on('change', () => this.refresh());
  }

  /**
   * Events emitted (extension code subscribes):
   *   - 'changed'        : snapshot recomputed (any field changed)
   *   - 'context-reset'  : state.json went from present → absent (typically because
   *                        user deleted .claude/context/devteam/ manually or via
   *                        Hard Reset command). Triggers UI to show "fresh project" mode.
   */

  start(): void {
    this.watcher.start();
  }

  stop(): void {
    this.watcher.stop();
  }

  snapshot(): Snapshot {
    return this.snapshotCache;
  }

  refresh(): void {
    const prevHadState = this.snapshotCache?.state !== null && this.snapshotCache?.state !== undefined;
    const prevSessionId = this.snapshotCache?.state?.session_id;
    this.snapshotCache = this.computeSnapshot();
    const nowHasState = this.snapshotCache.state !== null;

    if (prevHadState && !nowHasState) {
      // state.json was just deleted — emit reset signal so panels can show
      // a "fresh project" landing UI and toast can pop once.
      this.emit('context-reset', { previousSessionId: prevSessionId });
    }
    this.emit('changed', this.snapshotCache);
  }

  getDocMeta(docPath: string): DocMeta | null {
    return readDocMeta(this.root, docPath);
  }

  getRoot(): string {
    return this.root;
  }

  private computeSnapshot(): Snapshot {
    const state = readState(this.root);
    const documents = readDocumentsIndex(this.root, getDocumentsIndexPath(this.root));
    const adrLedger = readAdrLedger(this.root);
    const reviews = readReviewsList(this.root);
    const feature = state?.active_features?.[0] ?? null;
    const bootstrap = feature ? readBootstrapIntent(this.root, feature) : null;
    const docFiles = listDocs(this.root);
    const roundtables = listRoundtables(this.root);
    return { state, documents, adrLedger, reviews, bootstrap, docFiles, roundtables };
  }
}

/**
 * Walk docs/ and return canonical docRelPaths (always starting with `docs/`,
 * forward-slash, relative to project root).
 *
 * See state/paths.ts header for path convention.
 */
function listDocs(projectRoot: string): string[] {
  const docsRoot = path.join(projectRoot, 'docs');
  const out: string[] = [];
  if (!fs.existsSync(docsRoot)) return out;
  walk(projectRoot, docsRoot, out);
  return out;
}

function walk(projectRoot: string, dir: string, out: string[]): void {
  let entries: fs.Dirent[];
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      walk(projectRoot, full, out);
    } else if (e.isFile() && (e.name.endsWith('.md') || e.name.endsWith('.yaml'))) {
      // path.relative(<root>, <root>/docs/prd/foo.md) → 'docs/prd/foo.md' (forward-slash normalized)
      out.push(path.relative(projectRoot, full).replace(/\\/g, '/'));
    }
  }
}
