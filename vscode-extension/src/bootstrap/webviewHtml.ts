import { GROUPS, QUESTIONS } from './questions';

export function getBootstrapHtml(nonce: string, cspSource: string, bodyClass: string = ''): string {
  const groupedQuestions = GROUPS.map((g) => ({
    group: g,
    items: QUESTIONS.filter((q) => q.group === g),
  }));

  const questionsJson = JSON.stringify(QUESTIONS);

  const groupsHtml = groupedQuestions
    .map(
      (g, gi) => `
    <section class="group" data-group="${gi}">
      <h2><span class="group-num">${gi + 1}</span> ${g.group}</h2>
      ${g.items
        .map((q) => renderQuestion(q))
        .join('\n')}
    </section>`
    )
    .join('\n');

  return `<!DOCTYPE html>
<html lang="zh-Hant">
<head>
  <meta charset="UTF-8" />
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${cspSource} 'unsafe-inline'; script-src 'nonce-${nonce}';" />
  <title>Architect Bootstrap Questionnaire</title>
  <style>
    :root {
      --bg: var(--vscode-editor-background);
      --fg: var(--vscode-editor-foreground);
      --accent: var(--vscode-textLink-foreground);
      --muted: var(--vscode-descriptionForeground);
      --border: var(--vscode-panel-border);
      --input-bg: var(--vscode-input-background);
      --input-fg: var(--vscode-input-foreground);
      --btn-bg: var(--vscode-button-background);
      --btn-fg: var(--vscode-button-foreground);
      --btn-hover: var(--vscode-button-hoverBackground);
    }
    * { box-sizing: border-box; }
    body { margin: 0; padding: 24px 32px; font-family: var(--vscode-font-family); color: var(--fg); background: var(--bg); }
    header { border-bottom: 1px solid var(--border); padding-bottom: 16px; margin-bottom: 24px; }
    header h1 { margin: 0 0 6px; font-size: 20px; }
    header p { margin: 0; color: var(--muted); font-size: 13px; line-height: 1.5; }
    .group { margin-bottom: 32px; padding: 16px; border: 1px solid var(--border); border-radius: 6px; }
    .group h2 { margin: 0 0 16px; font-size: 15px; color: var(--accent); display: flex; align-items: center; gap: 10px; }
    .group-num { display: inline-flex; align-items: center; justify-content: center; width: 22px; height: 22px; border-radius: 50%; background: var(--accent); color: var(--bg); font-size: 11px; font-weight: 700; }
    .q { margin-bottom: 20px; padding-bottom: 16px; border-bottom: 1px dashed var(--border); }
    .q:last-child { border-bottom: none; padding-bottom: 0; margin-bottom: 0; }
    .q-prompt { font-weight: 600; margin: 0 0 4px; font-size: 14px; }
    .q-id { color: var(--muted); font-size: 11px; margin-right: 6px; font-family: monospace; }
    .why { font-size: 12px; color: var(--muted); margin: 4px 0 10px; padding: 6px 10px; border-left: 2px solid var(--accent); background: rgba(127, 127, 127, 0.06); line-height: 1.5; }
    .why::before { content: "💡 Why this matters — "; font-weight: 600; color: var(--accent); }
    textarea, input[type=text] { width: 100%; min-height: 60px; padding: 8px; background: var(--input-bg); color: var(--input-fg); border: 1px solid var(--border); border-radius: 4px; font-family: var(--vscode-font-family); font-size: 13px; resize: vertical; }
    .options { display: flex; flex-direction: column; gap: 6px; }
    .opt { display: flex; align-items: flex-start; gap: 8px; padding: 6px 10px; border-radius: 4px; cursor: pointer; }
    .opt:hover { background: rgba(127, 127, 127, 0.08); }
    .opt input[type="radio"], .opt input[type="checkbox"] { margin-top: 2px; flex-shrink: 0; }
    .opt label { cursor: pointer; flex: 1; font-size: 13px; line-height: 1.4; }
    .other-opt { margin-top: 4px; border-top: 1px dashed var(--border, rgba(127,127,127,0.3)); padding-top: 10px; }
    .other-opt input[type="text"] { margin-left: 0; }
    body.vscode-high-contrast .other-opt, body.vscode-high-contrast-light .other-opt, body.force-hc .other-opt {
      border-top-style: solid; border-top-width: 1px;
    }
    footer { display: flex; gap: 12px; align-items: center; justify-content: flex-end; padding-top: 16px; border-top: 1px solid var(--border); position: sticky; bottom: 0; background: var(--bg); margin-top: 24px; }
    .progress { margin-right: auto; color: var(--muted); font-size: 12px; }
    button { padding: 8px 16px; background: var(--btn-bg); color: var(--btn-fg); border: none; border-radius: 4px; cursor: pointer; font-size: 13px; font-family: var(--vscode-font-family); }
    button:hover { background: var(--btn-hover); }
    button.secondary { background: transparent; color: var(--fg); border: 1px solid var(--border); }
    button.secondary:hover { background: rgba(127, 127, 127, 0.08); }
    .meta-input { margin-bottom: 24px; padding: 12px; background: rgba(127, 127, 127, 0.05); border-radius: 4px; }
    .meta-input label { display: block; font-size: 12px; color: var(--muted); margin-bottom: 4px; }
    .meta-input input { width: 320px; max-width: 100%; padding: 6px 10px; background: var(--input-bg); color: var(--input-fg); border: 1px solid var(--border); border-radius: 4px; font-size: 13px; }
    .banner { padding: 10px 14px; border-radius: 4px; margin-bottom: 16px; font-size: 13px; line-height: 1.5; }
    .banner.info { background: rgba(58, 144, 224, 0.08); border-left: 3px solid #3a90e0; }
    /* High-contrast overrides */
    body.vscode-high-contrast, body.vscode-high-contrast-light, body.force-hc {
      --bg: var(--vscode-editor-background);
      --fg: var(--vscode-editor-foreground);
      --muted: var(--vscode-editor-foreground);
      --border: var(--vscode-contrastBorder, var(--vscode-editor-foreground));
      --input-bg: var(--vscode-input-background);
      --accent: var(--vscode-editor-foreground);
    }
    body.vscode-high-contrast .group, body.vscode-high-contrast-light .group, body.force-hc .group {
      border-width: 1px;
      background: var(--vscode-editor-background);
    }
    body.vscode-high-contrast .why, body.vscode-high-contrast-light .why, body.force-hc .why {
      background: transparent;
      border-left-width: 3px;
      font-weight: 500;
    }
    body.vscode-high-contrast button, body.vscode-high-contrast-light button, body.force-hc button {
      border: 1px solid currentColor;
      font-weight: 700;
    }
    body.vscode-high-contrast .group-num, body.vscode-high-contrast-light .group-num, body.force-hc .group-num {
      background: transparent;
      color: var(--vscode-editor-foreground);
      border: 1px solid currentColor;
    }
    body.vscode-high-contrast .banner.info, body.vscode-high-contrast-light .banner.info, body.force-hc .banner.info {
      background: transparent;
      border: 1px solid var(--border);
      border-left-width: 3px;
    }
    body.vscode-high-contrast .opt:hover, body.vscode-high-contrast-light .opt:hover, body.force-hc .opt:hover {
      background: var(--vscode-list-hoverBackground, transparent);
      outline: 1px solid currentColor;
    }
  </style>
</head>
<body class="${bodyClass}">
  <header>
    <h1>Architect Bootstrap Questionnaire</h1>
    <p>12 題，6 分組，約 3-5 分鐘。每題下面有「為什麼這題重要」—— 這就是 senior 規劃時會想的維度。</p>
  </header>

  <div class="banner info">
    這 12 題顯化的是 senior 工程師看到任何新需求時會自動跑一遍的 mental checklist。填完即進入 PRD 預填模式。
  </div>

  <div class="meta-input">
    <label for="feature">Feature slug（檔名用、英文小寫加連字號）</label>
    <input id="feature" type="text" value="architect-copilot" />
  </div>

  ${groupsHtml}

  <footer>
    <span class="progress" id="progress">0 / ${QUESTIONS.length} 已回答</span>
    <button class="secondary" id="cancel">取消</button>
    <button id="submit" disabled>產出 bootstrap-intent.yaml</button>
  </footer>

  <script nonce="${nonce}">
    const vscode = acquireVsCodeApi();
    const questions = ${questionsJson};
    const total = questions.length;

    function readOtherText(qid) {
      const t = document.getElementById(qid + '_other_text');
      return t ? t.value.trim() : '';
    }

    function getAnswers() {
      const out = {};
      for (const q of questions) {
        if (q.type === 'text') {
          const el = document.querySelector('[name="' + q.id + '"]');
          out[q.id] = el ? el.value.trim() : '';
        } else if (q.type === 'single') {
          const el = document.querySelector('[name="' + q.id + '"]:checked');
          if (el && el.value === '__OTHER__') {
            const t = readOtherText(q.id);
            out[q.id] = t; // empty string if not yet typed → counts as unanswered
          } else {
            out[q.id] = el ? el.value : '';
          }
        } else if (q.type === 'multi') {
          const els = document.querySelectorAll('[name="' + q.id + '"]:checked');
          const vals = Array.from(els).map((e) => e.value);
          const idx = vals.indexOf('__OTHER__');
          if (idx >= 0) {
            const otherText = readOtherText(q.id);
            if (otherText) vals[idx] = otherText;
            else vals.splice(idx, 1);
          }
          out[q.id] = vals;
        }
      }
      return out;
    }

    function answeredCount(answers) {
      let n = 0;
      for (const q of questions) {
        const v = answers[q.id];
        if (q.type === 'text' && typeof v === 'string' && v.length > 0) n++;
        if (q.type === 'single' && typeof v === 'string' && v.length > 0) n++;
        if (q.type === 'multi' && Array.isArray(v) && v.length > 0) n++;
      }
      return n;
    }

    function refresh() {
      const a = getAnswers();
      const n = answeredCount(a);
      document.getElementById('progress').textContent = n + ' / ' + total + ' 已回答';
      document.getElementById('submit').disabled = n < total;
    }

    document.addEventListener('input', refresh);
    document.addEventListener('change', refresh);

    // UX 串接：當 Other 文字框 focus 或開始打字 → 自動勾上對應的 radio/checkbox
    document.querySelectorAll('[data-other-input-for]').forEach((input) => {
      const qid = input.getAttribute('data-other-input-for');
      const otherToggle = document.querySelector('[data-other-for="' + qid + '"]');
      const autoCheck = () => {
        if (otherToggle && !otherToggle.checked && input.value.length > 0) {
          otherToggle.checked = true;
          refresh();
        }
      };
      input.addEventListener('input', autoCheck);
      input.addEventListener('focus', () => {
        if (otherToggle && !otherToggle.checked) {
          otherToggle.checked = true;
          refresh();
        }
      });
      // prevent label click from also flipping toggle when clicking inside text input
      input.addEventListener('click', (e) => e.stopPropagation());
    });

    // 當 Other radio/checkbox 被勾 → focus 文字框
    document.querySelectorAll('[data-other-for]').forEach((toggle) => {
      toggle.addEventListener('change', () => {
        if (toggle.checked) {
          const qid = toggle.getAttribute('data-other-for');
          const input = document.getElementById(qid + '_other_text');
          if (input) input.focus();
        }
      });
    });

    document.getElementById('submit').addEventListener('click', () => {
      const feature = document.getElementById('feature').value.trim() || 'default-feature';
      vscode.postMessage({ type: 'submit', feature, answers: getAnswers() });
    });
    document.getElementById('cancel').addEventListener('click', () => {
      vscode.postMessage({ type: 'cancel' });
    });

    refresh();
  </script>
</body>
</html>`;
}

function renderQuestion(q: { id: string; type: string; prompt: string; why: string; options?: string[]; placeholder?: string }): string {
  const idAttr = q.id;
  if (q.type === 'text') {
    return `
      <div class="q">
        <p class="q-prompt"><span class="q-id">${idAttr}</span>${escape(q.prompt)}</p>
        <div class="why">${escape(q.why)}</div>
        <textarea name="${idAttr}" rows="3" placeholder="${escape(q.placeholder ?? '')}"></textarea>
      </div>`;
  }

  const inputType = q.type === 'single' ? 'radio' : 'checkbox';
  const opts = (q.options ?? [])
    .map(
      (o, i) => `
      <div class="opt">
        <input type="${inputType}" id="${idAttr}_${i}" name="${idAttr}" value="${escape(o)}" />
        <label for="${idAttr}_${i}">${escape(o)}</label>
      </div>`
    )
    .join('');

  // "Other (specify)" affordance for both single and multi
  const otherIndex = (q.options ?? []).length;
  const otherOpt = `
    <div class="opt other-opt">
      <input type="${inputType}" id="${idAttr}_${otherIndex}" name="${idAttr}" value="__OTHER__" data-other-for="${idAttr}" />
      <label for="${idAttr}_${otherIndex}" style="display: flex; align-items: center; gap: 8px; flex: 1;">
        <span style="white-space: nowrap;">Other (specify):</span>
        <input
          type="text"
          id="${idAttr}_other_text"
          data-other-input-for="${idAttr}"
          placeholder="自行輸入..."
          style="flex: 1; padding: 4px 8px; background: var(--input-bg); color: var(--input-fg); border: 1px solid var(--border); border-radius: 3px; font-size: 12px;"
        />
      </label>
    </div>`;

  return `
    <div class="q">
      <p class="q-prompt"><span class="q-id">${idAttr}</span>${escape(q.prompt)}</p>
      <div class="why">${escape(q.why)}</div>
      <div class="options">${opts}${otherOpt}</div>
    </div>`;
}

function escape(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
