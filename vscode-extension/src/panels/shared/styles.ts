export const COMMON_STYLES = `
  :root {
    --bg: var(--vscode-editor-background);
    --fg: var(--vscode-editor-foreground);
    --accent: var(--vscode-textLink-foreground);
    --accent-active: var(--vscode-textLink-activeForeground);
    --muted: var(--vscode-descriptionForeground);
    --border: var(--vscode-panel-border, var(--vscode-editorWidget-border, currentColor));
    --input-bg: var(--vscode-input-background);
    --input-fg: var(--vscode-input-foreground);
    --btn-bg: var(--vscode-button-background);
    --btn-fg: var(--vscode-button-foreground);
    --btn-hover: var(--vscode-button-hoverBackground);

    /* Semantic colors — use VS Code chart palette (theme-aware) */
    --good: var(--vscode-charts-green, var(--vscode-terminal-ansiGreen, #4caf50));
    --warn: var(--vscode-charts-yellow, var(--vscode-terminal-ansiYellow, #ffb300));
    --bad: var(--vscode-charts-red, var(--vscode-errorForeground, #e53935));
    --pending: var(--vscode-descriptionForeground, #9e9e9e);
    --info: var(--vscode-charts-blue, var(--vscode-terminal-ansiBlue, #3a90e0));

    /* Tinted backgrounds — auto-hidden in HC themes via overrides below */
    --good-bg: rgba(76, 175, 80, 0.15);
    --warn-bg: rgba(255, 179, 0, 0.15);
    --bad-bg: rgba(229, 57, 53, 0.18);
    --pending-bg: rgba(158, 158, 158, 0.15);
    --info-bg: rgba(58, 144, 224, 0.15);
    --card-bg: rgba(127, 127, 127, 0.03);
    --hover-bg: rgba(127, 127, 127, 0.10);
    --dashed-style: dashed;
    --pill-font-weight: 600;
    --pill-border-width: 0px;
  }

  /* ════════════════════════════════════════════════════════════════
   *  Theme override (architectCopilot.themeMode)
   *  system (default): defer to VS Code CSS variables (above)
   *  dark / light    : force explicit palette regardless of VS Code theme
   * ════════════════════════════════════════════════════════════════ */
  body.theme-dark {
    --bg: #1e1e1e;
    --fg: #d4d4d4;
    --accent: #4fc1ff;
    --accent-active: #9cdcfe;
    --muted: #969696;
    --border: #3c3c3c;
    --input-bg: #3c3c3c;
    --input-fg: #d4d4d4;
    --btn-bg: #0e639c;
    --btn-fg: #ffffff;
    --btn-hover: #1177bb;
    --good: #73c991;
    --warn: #ffcc66;
    --bad: #f48771;
    --pending: #858585;
    --info: #4fc1ff;
    --good-bg: rgba(115, 201, 145, 0.15);
    --warn-bg: rgba(255, 204, 102, 0.15);
    --bad-bg: rgba(244, 135, 113, 0.18);
    --pending-bg: rgba(133, 133, 133, 0.15);
    --info-bg: rgba(79, 193, 255, 0.15);
    --card-bg: rgba(255, 255, 255, 0.025);
    --hover-bg: rgba(255, 255, 255, 0.06);
  }
  body.theme-light {
    --bg: #ffffff;
    --fg: #1f1f1f;
    --accent: #0451a5;
    --accent-active: #006ab1;
    --muted: #616161;
    --border: #d0d0d0;
    --input-bg: #f5f5f5;
    --input-fg: #1f1f1f;
    --btn-bg: #0078d4;
    --btn-fg: #ffffff;
    --btn-hover: #106ebe;
    --good: #1a7f37;
    --warn: #9a6700;
    --bad: #b3261e;
    --pending: #6c6c6c;
    --info: #0451a5;
    --good-bg: rgba(26, 127, 55, 0.10);
    --warn-bg: rgba(154, 103, 0, 0.10);
    --bad-bg: rgba(179, 38, 30, 0.10);
    --pending-bg: rgba(108, 108, 108, 0.10);
    --info-bg: rgba(4, 81, 165, 0.10);
    --card-bg: rgba(0, 0, 0, 0.025);
    --hover-bg: rgba(0, 0, 0, 0.06);
  }

  /* High-contrast detection (VS Code auto-adds these classes) and manual force */
  body.vscode-high-contrast,
  body.vscode-high-contrast-light,
  body.force-hc {
    --good-bg: transparent;
    --warn-bg: transparent;
    --bad-bg: transparent;
    --pending-bg: transparent;
    --info-bg: transparent;
    --card-bg: transparent;
    --hover-bg: var(--vscode-list-hoverBackground, transparent);
    --border: var(--vscode-contrastBorder, var(--vscode-editor-foreground));
    --muted: var(--vscode-editor-foreground);
    --dashed-style: solid;
    --pill-font-weight: 700;
    --pill-border-width: 1px;
    --good: var(--vscode-terminal-ansiBrightGreen, var(--vscode-editor-foreground));
    --warn: var(--vscode-terminal-ansiBrightYellow, var(--vscode-editor-foreground));
    --bad: var(--vscode-errorForeground, var(--vscode-editor-foreground));
    --info: var(--vscode-terminal-ansiBrightBlue, var(--vscode-editor-foreground));
    --accent: var(--vscode-textLink-foreground, var(--vscode-editor-foreground));
  }

  /* Force-HC override (user toggled) — even more pure B&W */
  body.force-hc {
    --good: var(--vscode-editor-foreground);
    --warn: var(--vscode-editor-foreground);
    --bad: var(--vscode-editor-foreground);
    --pending: var(--vscode-editor-foreground);
    --info: var(--vscode-editor-foreground);
    --accent: var(--vscode-editor-foreground);
    --muted: var(--vscode-editor-foreground);
  }

  * { box-sizing: border-box; }

  body {
    margin: 0;
    padding: 20px 28px;
    font-family: var(--vscode-font-family);
    color: var(--fg);
    background: var(--bg);
    font-size: 13px;
    line-height: 1.5;
  }

  header.portal-header {
    border-bottom: 1px solid var(--border);
    padding-bottom: 14px;
    margin-bottom: 20px;
    display: flex;
    align-items: center;
    gap: 14px;
    flex-wrap: wrap;
  }
  header.portal-header h1 {
    margin: 0;
    font-size: 18px;
    font-weight: 600;
  }
  header.portal-header .subtitle {
    color: var(--muted);
    font-size: 12px;
  }

  .card {
    border: 1px solid var(--border);
    border-radius: 6px;
    padding: 14px 16px;
    background: var(--card-bg);
  }
  body.vscode-high-contrast .card,
  body.vscode-high-contrast-light .card,
  body.force-hc .card {
    border-width: 1px;
    background: var(--bg);
  }

  .card h3 {
    margin: 0 0 10px;
    font-size: 11px;
    color: var(--accent);
    text-transform: uppercase;
    letter-spacing: 0.6px;
    font-weight: 700;
  }
  .card h3.warn { color: var(--warn); }
  .card h3.bad { color: var(--bad); }

  .grid {
    display: grid;
    gap: 14px;
  }
  .grid-2 { grid-template-columns: 1fr 1fr; }
  .grid-3 { grid-template-columns: 1fr 1fr 1fr; }

  .kv {
    display: grid;
    grid-template-columns: 130px 1fr;
    gap: 6px 12px;
  }
  .kv dt { color: var(--muted); font-size: 12px; }
  .kv dd { margin: 0; font-size: 13px; }

  .pill {
    display: inline-block;
    padding: 2px 8px;
    border-radius: 10px;
    font-size: 11px;
    font-weight: var(--pill-font-weight);
    background: var(--pending-bg);
    color: var(--pending);
    border: var(--pill-border-width) solid currentColor;
  }
  .pill.good { background: var(--good-bg); color: var(--good); }
  .pill.warn { background: var(--warn-bg); color: var(--warn); }
  .pill.bad { background: var(--bad-bg); color: var(--bad); }
  .pill.info { background: var(--info-bg); color: var(--info); }

  /* High-contrast pill — purely outlined, no fill */
  body.vscode-high-contrast .pill,
  body.vscode-high-contrast-light .pill,
  body.force-hc .pill {
    background: transparent !important;
    border-width: 1px;
    border-style: solid;
    border-color: currentColor;
    text-decoration: none;
  }

  button {
    padding: 7px 14px;
    background: var(--btn-bg);
    color: var(--btn-fg);
    border: 1px solid transparent;
    border-radius: 4px;
    cursor: pointer;
    font-size: 12px;
    font-family: var(--vscode-font-family);
  }
  button:hover { background: var(--btn-hover); }
  button:focus-visible {
    outline: 2px solid var(--vscode-focusBorder, var(--accent));
    outline-offset: 2px;
  }
  button.secondary {
    background: transparent;
    color: var(--fg);
    border: 1px solid var(--border);
  }
  button.secondary:hover { background: var(--hover-bg); }
  button.danger {
    background: var(--bad-bg);
    color: var(--bad);
    border-color: var(--bad);
  }
  button.danger:hover { background: var(--bad-bg); }
  button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  body.vscode-high-contrast button,
  body.vscode-high-contrast-light button,
  body.force-hc button {
    border: 1px solid var(--vscode-contrastBorder, currentColor);
    font-weight: 600;
  }
  body.vscode-high-contrast button:focus,
  body.vscode-high-contrast-light button:focus,
  body.force-hc button:focus {
    outline: 2px solid var(--vscode-contrastActiveBorder, currentColor);
    outline-offset: 2px;
  }

  code {
    background: var(--vscode-textCodeBlock-background, var(--hover-bg));
    padding: 1px 6px;
    border-radius: 3px;
    font-size: 11px;
    font-family: var(--vscode-editor-font-family);
    color: var(--fg);
  }
  body.vscode-high-contrast code,
  body.vscode-high-contrast-light code,
  body.force-hc code {
    background: transparent;
    border: 1px solid var(--border);
  }

  hr {
    border: none;
    border-top: 1px solid var(--border);
    margin: 16px 0;
  }

  .tag {
    display: inline-block;
    padding: 2px 8px;
    margin: 2px;
    background: var(--hover-bg);
    border-radius: 3px;
    font-size: 11px;
    color: var(--fg);
  }
  body.vscode-high-contrast .tag,
  body.vscode-high-contrast-light .tag,
  body.force-hc .tag {
    background: transparent;
    border: 1px solid var(--border);
  }

  .empty-hint {
    color: var(--muted);
    font-style: italic;
    font-size: 12px;
  }
  body.vscode-high-contrast .empty-hint,
  body.vscode-high-contrast-light .empty-hint,
  body.force-hc .empty-hint {
    font-style: normal;
    font-weight: 500;
  }

  /* Generic row separator — switches between dashed and solid by theme */
  .row-separator {
    border-bottom-style: var(--dashed-style);
    border-bottom-width: 1px;
    border-bottom-color: var(--border);
  }

  /* Override decorative dashed borders in HC mode */
  body.vscode-high-contrast [style*="dashed"],
  body.vscode-high-contrast-light [style*="dashed"],
  body.force-hc [style*="dashed"] {
    border-bottom-style: solid !important;
  }

  /* Focus ring for keyboard nav */
  a:focus-visible,
  input:focus-visible,
  textarea:focus-visible {
    outline: 2px solid var(--vscode-focusBorder, var(--accent));
    outline-offset: 2px;
  }

  /* ────────────────────────────────────────────────────────────
   * Help hints — hover-only popup tooltip
   *   guidanceMode ON (default): ? icons visible, hover → popup
   *   guidanceMode OFF: ? icons hidden entirely (expert UI)
   * ──────────────────────────────────────────────────────────── */

  /* Wrapper is anchor for absolute-positioned popup. Hidden when guidance off. */
  .help-wrap {
    display: none;
    position: relative;
    margin-left: 4px;
    vertical-align: middle;
  }
  body.guidance-mode .help-wrap {
    display: inline-flex;
    align-items: center;
  }

  .help-hint {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: rgba(127, 127, 127, 0.18);
    color: var(--muted);
    font-size: 10px;
    font-weight: 700;
    cursor: help;
    user-select: none;
    line-height: 1;
    flex-shrink: 0;
  }
  .help-hint:hover,
  .help-hint:focus-visible {
    background: var(--info);
    color: var(--btn-fg);
    outline: none;
  }
  body.vscode-high-contrast .help-hint,
  body.vscode-high-contrast-light .help-hint,
  body.force-hc .help-hint {
    background: transparent;
    border: 1px solid currentColor;
    color: var(--fg);
  }

  /* Hover popup — absolute-positioned, no layout shift */
  .help-text {
    display: none;
    position: absolute;
    top: calc(100% + 6px);
    left: 0;
    z-index: 1000;
    width: max-content;
    max-width: 360px;
    padding: 10px 12px;
    font-size: 12px;
    line-height: 1.55;
    color: var(--vscode-editorHoverWidget-foreground, var(--fg));
    background: var(--vscode-editorHoverWidget-background, var(--bg));
    border: 1px solid var(--vscode-editorHoverWidget-border, var(--border));
    border-radius: 4px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25);
    pointer-events: auto;
    white-space: normal;
  }
  /* Popup arrow */
  .help-text::before {
    content: '';
    position: absolute;
    top: -6px;
    left: 6px;
    width: 10px;
    height: 10px;
    background: var(--vscode-editorHoverWidget-background, var(--bg));
    border-top: 1px solid var(--vscode-editorHoverWidget-border, var(--border));
    border-left: 1px solid var(--vscode-editorHoverWidget-border, var(--border));
    transform: rotate(45deg);
  }
  .help-wrap:hover .help-text,
  .help-wrap:focus-within .help-text {
    display: block;
  }
  body.vscode-high-contrast .help-text,
  body.vscode-high-contrast-light .help-text,
  body.force-hc .help-text {
    background: var(--bg);
    border: 2px solid var(--vscode-editor-foreground);
    box-shadow: none;
  }

  /* If the popup would overflow right edge, anchor right instead */
  .help-wrap.right-anchor .help-text {
    left: auto;
    right: 0;
  }
  .help-wrap.right-anchor .help-text::before {
    left: auto;
    right: 6px;
  }

  /* ────────────────────────────────────────────────────────────
   * Markdown-rendered content (DocumentDetail / RoundtableDetail)
   * ──────────────────────────────────────────────────────────── */
  .md-rendered {
    line-height: 1.65;
    font-size: 13px;
    color: var(--fg);
    max-height: 600px;
    overflow-y: auto;
    padding: 4px 12px 12px;
  }
  .md-rendered > *:first-child { margin-top: 0; }
  .md-rendered > *:last-child { margin-bottom: 0; }
  .md-rendered h1 {
    font-size: 22px;
    font-weight: 700;
    margin: 24px 0 12px;
    padding-bottom: 6px;
    border-bottom: 1px solid var(--border);
    color: var(--fg);
  }
  .md-rendered h2 {
    font-size: 18px;
    font-weight: 700;
    margin: 22px 0 10px;
    padding-bottom: 4px;
    border-bottom: 1px solid var(--border);
    color: var(--fg);
  }
  .md-rendered h3 {
    font-size: 15px;
    font-weight: 700;
    margin: 18px 0 8px;
    color: var(--accent);
    text-transform: none;
    letter-spacing: normal;
  }
  .md-rendered h4 {
    font-size: 14px;
    font-weight: 700;
    margin: 16px 0 6px;
    color: var(--fg);
  }
  .md-rendered h5, .md-rendered h6 {
    font-size: 13px;
    font-weight: 700;
    margin: 14px 0 6px;
    color: var(--muted);
  }
  .md-rendered p { margin: 10px 0; }
  .md-rendered ul, .md-rendered ol { margin: 10px 0; padding-left: 24px; }
  .md-rendered li { margin: 4px 0; }
  .md-rendered li > p { margin: 4px 0; }
  .md-rendered code {
    background: var(--vscode-textCodeBlock-background, rgba(127,127,127,0.12));
    padding: 1px 6px;
    border-radius: 3px;
    font-family: var(--vscode-editor-font-family);
    font-size: 12px;
    color: var(--fg);
  }
  .md-rendered pre {
    background: var(--vscode-textCodeBlock-background, rgba(127,127,127,0.08));
    padding: 12px;
    border-radius: 4px;
    overflow-x: auto;
    font-family: var(--vscode-editor-font-family);
    font-size: 12px;
    line-height: 1.5;
    margin: 12px 0;
    border: 1px solid var(--border);
  }
  .md-rendered pre code {
    background: transparent;
    padding: 0;
    font-size: inherit;
  }
  .md-rendered blockquote {
    margin: 12px 0;
    padding: 8px 14px;
    border-left: 3px solid var(--accent);
    color: var(--muted);
    background: rgba(127, 127, 127, 0.05);
    font-style: italic;
  }
  .md-rendered a {
    color: var(--vscode-textLink-foreground);
    text-decoration: none;
  }
  .md-rendered a:hover { text-decoration: underline; }
  .md-rendered table {
    border-collapse: collapse;
    margin: 14px 0;
    width: 100%;
    font-size: 12px;
  }
  .md-rendered table th, .md-rendered table td {
    padding: 6px 10px;
    border: 1px solid var(--border);
    text-align: left;
  }
  .md-rendered table th {
    background: rgba(127, 127, 127, 0.08);
    font-weight: 700;
  }
  .md-rendered table tr:nth-child(even) td {
    background: rgba(127, 127, 127, 0.03);
  }
  .md-rendered hr {
    border: none;
    border-top: 1px solid var(--border);
    margin: 18px 0;
  }
  .md-rendered img {
    max-width: 100%;
    border-radius: 4px;
  }
  .md-rendered strong { font-weight: 700; color: var(--fg); }
  .md-rendered em { font-style: italic; }
  .md-rendered del { color: var(--muted); }

  /* Raw markdown view (toggle) */
  .md-raw {
    margin: 0;
    padding: 12px;
    background: rgba(127, 127, 127, 0.05);
    border-radius: 4px;
    border: 1px solid var(--border);
    font-family: var(--vscode-editor-font-family);
    font-size: 12px;
    line-height: 1.55;
    max-height: 600px;
    overflow-y: auto;
    white-space: pre-wrap;
    word-break: break-word;
  }

  /* HC overrides for markdown */
  body.vscode-high-contrast .md-rendered pre,
  body.vscode-high-contrast-light .md-rendered pre,
  body.force-hc .md-rendered pre,
  body.vscode-high-contrast .md-rendered code,
  body.vscode-high-contrast-light .md-rendered code,
  body.force-hc .md-rendered code,
  body.vscode-high-contrast .md-raw,
  body.vscode-high-contrast-light .md-raw,
  body.force-hc .md-raw {
    background: transparent;
    border: 1px solid var(--border);
  }
  body.vscode-high-contrast .md-rendered blockquote,
  body.vscode-high-contrast-light .md-rendered blockquote,
  body.force-hc .md-rendered blockquote {
    background: transparent;
    border-left-width: 4px;
    color: var(--fg);
    font-style: normal;
    font-weight: 500;
  }
  body.vscode-high-contrast .md-rendered table tr:nth-child(even) td,
  body.vscode-high-contrast-light .md-rendered table tr:nth-child(even) td,
  body.force-hc .md-rendered table tr:nth-child(even) td,
  body.vscode-high-contrast .md-rendered table th,
  body.vscode-high-contrast-light .md-rendered table th,
  body.force-hc .md-rendered table th {
    background: transparent;
  }
`;
