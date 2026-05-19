export function nonce(): string {
  let text = '';
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 0; i < 32; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}

export function escape(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function truncate(s: string, n: number): string {
  if (!s) return '';
  return s.length <= n ? s : s.slice(0, n - 1) + '…';
}

export function csp(cspSource: string, nonceVal: string): string {
  return `default-src 'none'; style-src ${cspSource} 'unsafe-inline'; script-src 'nonce-${nonceVal}'; img-src ${cspSource} data:;`;
}

export function pill(label: string, kind: 'good' | 'warn' | 'bad' | 'pending' | 'info' = 'pending'): string {
  return `<span class="pill ${kind}">${escape(label)}</span>`;
}

/**
 * Help hint affordance — small "?" icon next to interactive elements.
 * Default: tooltip hidden. Hover (or keyboard focus) on the icon → popup tooltip.
 *
 * Guidance mode toggle:
 *   - ON  (default): ? icons visible, hover/focus shows popup
 *   - OFF: ? icons hidden entirely (clean expert UI)
 *
 * Usage:
 *   `<button>...</button>${helpFor('一鍵接受推薦答案...')}`
 */
export function helpFor(text: string): string {
  const safe = escape(text);
  return `<span class="help-wrap"><span class="help-hint" tabindex="0" title="${safe}" aria-label="help">?</span><span class="help-text" role="tooltip">${safe}</span></span>`;
}

/** Same behavior — kept for backwards compatibility. */
export function helpInline(text: string): string {
  return helpFor(text);
}
