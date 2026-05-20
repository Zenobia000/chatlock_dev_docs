import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { getDevTeamContextDir, getDocsRoot, getSnapshotsDir } from './paths';

export interface HardResetOptions {
  /** Delete .claude/context/devteam/* (state, sessions, bootstrap, documents/, adr-ledger.json, roundtables/, evidence/, reviews/). */
  resetContext: boolean;
  /** Delete generated docs/* (PRD, governance, ux, analysis, architecture, design, qa, ops, release). */
  resetDocs: boolean;
  /** Delete .claude/context/devteam/snapshots/* (version history). Independent of resetContext. */
  resetSnapshots: boolean;
  /** Delete Claude Code conversation history (~/.claude/projects/<this-project>/*.jsonl + memory/). L4 + L3 reset. Both Windows and WSL locations scanned. */
  resetConversationHistory: boolean;
}

export interface HardResetReport {
  removedPaths: string[];
  removedJsonlCount: number;
  scannedConversationDirs: string[];
  errors: { path: string; error: string }[];
}

/**
 * Hard reset playbook. Never touches:
 *   - .claude/skills/, .claude/agents/, .claude/commands/, .claude/CLAUDE.md, .claude/settings.json  (project knowledge)
 *   - devteam_knowledge_base/*                                                                       (KB catalog)
 *   - git history, .gitignore, .gitattributes                                                        (vcs)
 *   - vscode-extension/*                                                                             (this extension)
 *
 * What cannot be cleared by this function (L5 — current Claude conversation context window):
 *   Even after this runs, the active Claude Code chat still remembers everything we discussed.
 *   The only way to clear L5 is `/clear` slash command or starting a new Claude Code conversation.
 *   The caller should display this caveat to the user after invoking performHardReset.
 */
export function performHardReset(root: string, opts: HardResetOptions): HardResetReport {
  const report: HardResetReport = {
    removedPaths: [],
    removedJsonlCount: 0,
    scannedConversationDirs: [],
    errors: [],
  };

  if (opts.resetContext) {
    const contextDir = getDevTeamContextDir(root);
    const snapshotsDir = getSnapshotsDir(root);

    const keepSnapshots = !opts.resetSnapshots && fs.existsSync(snapshotsDir);
    let tmpSnapshotsBackup: string | undefined;
    if (keepSnapshots) {
      tmpSnapshotsBackup = path.join(root, '.claude', 'context', '.snapshots-backup-' + Date.now());
      try {
        fs.renameSync(snapshotsDir, tmpSnapshotsBackup);
      } catch (e) {
        report.errors.push({ path: snapshotsDir, error: 'failed to backup snapshots: ' + (e as Error).message });
        tmpSnapshotsBackup = undefined;
      }
    }

    rmRecursive(contextDir, report);

    if (tmpSnapshotsBackup && fs.existsSync(tmpSnapshotsBackup)) {
      try {
        fs.mkdirSync(contextDir, { recursive: true });
        fs.renameSync(tmpSnapshotsBackup, snapshotsDir);
      } catch (e) {
        report.errors.push({
          path: snapshotsDir,
          error: 'snapshots backed up but restore failed: ' + (e as Error).message + ' — manually move ' + tmpSnapshotsBackup,
        });
      }
    }
  } else if (opts.resetSnapshots) {
    rmRecursive(getSnapshotsDir(root), report);
  }

  if (opts.resetDocs) {
    rmRecursive(getDocsRoot(root), report);
  }

  if (opts.resetConversationHistory) {
    const dirs = findConversationDirs(root);
    report.scannedConversationDirs = dirs;
    for (const dir of dirs) {
      report.removedJsonlCount += deleteJsonlAndMemory(dir, report);
    }
  }

  return report;
}

/**
 * Compute canonical encoded segment for Claude Code's projects/ directory.
 * Rule: any character not in [a-zA-Z0-9.] becomes "-". Strip trailing separator first.
 * Examples:
 *   "/mnt/d/python_workspace/github/Architecture_Autopilot"
 *     → "-mnt-d-python-workspace-github-Architecture-Autopilot"
 *   "D:\\python_workspace\\github\\Architecture_Autopilot"
 *     → "D--python-workspace-github-Architecture-Autopilot"
 */
function encodeProjectPath(p: string): string {
  return p.replace(/[\\/]+$/, '').replace(/[^a-zA-Z0-9.]/g, '-');
}

/**
 * Enumerate plausible locations for Claude Code conversation history of this workspace.
 * Handles bi-directional Windows ↔ WSL access:
 *   - extension running in Windows Cursor → reaches \\wsl$\<distro>\home\<user> via UNC
 *   - extension running in WSL Cursor / Linux → reaches /mnt/c/Users/<user> via WSL mount
 */
function findConversationDirs(workspaceRoot: string): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  const add = (p: string) => {
    if (!seen.has(p) && fs.existsSync(p)) {
      seen.add(p);
      out.push(p);
    }
  };

  const encodedCurrent = encodeProjectPath(workspaceRoot);

  // 1. Current-OS home with current-OS encoded path
  add(path.join(os.homedir(), '.claude', 'projects', encodedCurrent));

  // 2. Cross-OS translation: derive equivalent path in the other OS, then look in its homes
  const winMatch = workspaceRoot.match(/^([a-zA-Z]):[\\/]?(.*)$/);
  const wslMatch = workspaceRoot.match(/^\/mnt\/([a-z])\/(.+)$/);

  let crossEncoded: string | undefined;
  if (winMatch) {
    const wslPath = `/mnt/${winMatch[1].toLowerCase()}/${winMatch[2].replace(/\\/g, '/')}`;
    crossEncoded = encodeProjectPath(wslPath);
  } else if (wslMatch) {
    const winPath = `${wslMatch[1].toUpperCase()}:\\${wslMatch[2].replace(/\//g, '\\')}`;
    crossEncoded = encodeProjectPath(winPath);
  }

  const candidateHomes: string[] = [];

  // From Windows view → WSL distros via UNC
  if (process.platform === 'win32') {
    for (const distro of ['Ubuntu', 'Ubuntu-22.04', 'Ubuntu-20.04', 'Debian', 'kali-linux']) {
      const distroHome = `\\\\wsl$\\${distro}\\home`;
      if (safeExists(distroHome)) {
        try {
          for (const u of fs.readdirSync(distroHome)) {
            candidateHomes.push(path.join(distroHome, u));
          }
        } catch {
          // ignore
        }
      }
    }
  }

  // From WSL/Linux view → Windows users via /mnt/c
  if (safeExists('/mnt/c/Users')) {
    try {
      for (const u of fs.readdirSync('/mnt/c/Users')) {
        if (u !== 'Default' && u !== 'Public' && u !== 'All Users' && !u.startsWith('Default')) {
          candidateHomes.push(`/mnt/c/Users/${u}`);
        }
      }
    } catch {
      // ignore
    }
  }

  for (const home of candidateHomes) {
    add(path.join(home, '.claude', 'projects', encodedCurrent));
    if (crossEncoded) {
      add(path.join(home, '.claude', 'projects', crossEncoded));
    }
  }

  return out;
}

function safeExists(p: string): boolean {
  try {
    return fs.existsSync(p);
  } catch {
    return false;
  }
}

function deleteJsonlAndMemory(convDir: string, report: HardResetReport): number {
  let removedCount = 0;
  try {
    for (const f of fs.readdirSync(convDir)) {
      const fp = path.join(convDir, f);
      if (f.endsWith('.jsonl')) {
        try {
          fs.unlinkSync(fp);
          report.removedPaths.push(fp);
          removedCount++;
        } catch (e) {
          report.errors.push({ path: fp, error: (e as Error).message });
        }
      } else if (f === 'memory') {
        // auto-memory directory (L3) — wipe its contents but keep the folder
        try {
          if (fs.statSync(fp).isDirectory()) {
            for (const mf of fs.readdirSync(fp)) {
              const mfp = path.join(fp, mf);
              try {
                fs.rmSync(mfp, { recursive: true, force: true });
                report.removedPaths.push(mfp);
              } catch (e) {
                report.errors.push({ path: mfp, error: (e as Error).message });
              }
            }
          }
        } catch (e) {
          report.errors.push({ path: fp, error: (e as Error).message });
        }
      }
    }
  } catch (e) {
    report.errors.push({ path: convDir, error: (e as Error).message });
  }
  return removedCount;
}

function rmRecursive(targetPath: string, report: HardResetReport): void {
  if (!fs.existsSync(targetPath)) return;
  try {
    fs.rmSync(targetPath, { recursive: true, force: true });
    report.removedPaths.push(targetPath);
  } catch (e) {
    report.errors.push({ path: targetPath, error: (e as Error).message });
  }
}
