import * as fs from 'fs';
import * as path from 'path';
import { EventEmitter } from 'events';
import { getDevTeamContextDir, getDocsRoot } from './paths';

const DEBOUNCE_MS = 100;

export class StateWatcher extends EventEmitter {
  private contextWatcher?: fs.FSWatcher;
  private docsWatcher?: fs.FSWatcher;
  private debounceTimer?: NodeJS.Timeout;

  constructor(private root: string) {
    super();
  }

  start(): void {
    this.watchContextDir();
    this.watchDocsDir();
  }

  private watchContextDir(): void {
    const dir = getDevTeamContextDir(this.root);
    if (!fs.existsSync(dir)) {
      try {
        fs.mkdirSync(dir, { recursive: true });
      } catch {
        // no permission — fall through
      }
    }
    try {
      this.contextWatcher = fs.watch(dir, { recursive: true, persistent: false }, (event, filename) => {
        this.fire('context', filename ?? '');
      });
    } catch {
      // some filesystems (network, WSL on Windows mount) don't support recursive
      try {
        this.contextWatcher = fs.watch(dir, { persistent: false }, (event, filename) => {
          this.fire('context', filename ?? '');
        });
      } catch {
        // give up silently — manual reload button covers this
      }
    }
  }

  private watchDocsDir(): void {
    const dir = getDocsRoot(this.root);
    if (!fs.existsSync(dir)) return;
    try {
      this.docsWatcher = fs.watch(dir, { recursive: true, persistent: false }, (event, filename) => {
        this.fire('docs', filename ?? '');
      });
    } catch {
      // ignore
    }
  }

  private fire(scope: 'context' | 'docs', filename: string): void {
    if (this.debounceTimer) clearTimeout(this.debounceTimer);
    this.debounceTimer = setTimeout(() => {
      this.emit('change', { scope, filename });
    }, DEBOUNCE_MS);
  }

  stop(): void {
    if (this.debounceTimer) clearTimeout(this.debounceTimer);
    this.contextWatcher?.close();
    this.docsWatcher?.close();
  }
}
