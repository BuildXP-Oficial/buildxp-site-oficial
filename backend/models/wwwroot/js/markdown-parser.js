// BuildXP — parser markdown (subconjunto GFM) para "Construa aqui"
function mdEscape(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function mdInline(raw) {
  let s = mdEscape(raw);
  // images ![alt](url)
  s = s.replace(
    /!\[([^\]]*)\]\((https?:\/\/[^)\s]+)\)/g,
    '<img src="$2" alt="$1" loading="lazy" referrerpolicy="no-referrer" />',
  );
  // links [text](url)
  s = s.replace(
    /\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g,
    '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>',
  );
  // bold+italic ***
  s = s.replace(/\*\*\*([^*]+)\*\*\*/g, '<strong><em>$1</em></strong>');
  // bold **
  s = s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  // italic *
  s = s.replace(/(^|[^*])\*([^*]+)\*(?!\*)/g, '$1<em>$2</em>');
  // inline code
  s = s.replace(/`([^`]+)`/g, '<code>$1</code>');
  return s;
}

function buildxpRenderMarkdown(src) {
  const lines = String(src ?? '').replace(/\r\n/g, '\n').split('\n');
  const out = [];
  let i = 0;
  let inCode = false;
  let codeBuf = [];
  let listType = null; // 'ul' | 'ol' | 'check'
  let listBuf = [];

  const flushList = () => {
    if (!listType || !listBuf.length) {
      listType = null;
      listBuf = [];
      return;
    }
    if (listType === 'check') {
      out.push(`<ul class="md-checklist">${listBuf.join('')}</ul>`);
    } else if (listType === 'ol') {
      out.push(`<ol>${listBuf.join('')}</ol>`);
    } else {
      out.push(`<ul>${listBuf.join('')}</ul>`);
    }
    listType = null;
    listBuf = [];
  };

  const flushCode = () => {
    out.push(`<pre class="md-code"><code>${mdEscape(codeBuf.join('\n'))}</code></pre>`);
    codeBuf = [];
    inCode = false;
  };

  while (i < lines.length) {
    const line = lines[i];

    if (inCode) {
      if (/^```/.test(line)) flushCode();
      else codeBuf.push(line);
      i += 1;
      continue;
    }

    if (/^```/.test(line)) {
      flushList();
      inCode = true;
      codeBuf = [];
      i += 1;
      continue;
    }

    // GitHub alerts: > [!NOTE] etc.
    const alertMatch = line.match(/^>\s*\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]\s*$/i);
    if (alertMatch) {
      flushList();
      const kind = alertMatch[1].toLowerCase();
      const body = [];
      i += 1;
      while (i < lines.length && /^>/.test(lines[i])) {
        body.push(lines[i].replace(/^>\s?/, ''));
        i += 1;
      }
      out.push(
        `<div class="md-alert md-alert-${kind}"><div class="md-alert-title">${mdEscape(kind.toUpperCase())}</div><div class="md-alert-body">${mdInline(body.join(' '))}</div></div>`,
      );
      continue;
    }

    // blockquote
    if (/^>\s?/.test(line)) {
      flushList();
      const body = [];
      while (i < lines.length && /^>\s?/.test(lines[i])) {
        body.push(lines[i].replace(/^>\s?/, ''));
        i += 1;
      }
      out.push(`<blockquote>${mdInline(body.join(' '))}</blockquote>`);
      continue;
    }

    // table
    if (
      /^\|.+\|/.test(line) &&
      i + 1 < lines.length &&
      /^\|?\s*:?-+:?\s*(\|\s*:?-+:?\s*)+\|?\s*$/.test(lines[i + 1])
    ) {
      flushList();
      const headerCells = line
        .replace(/^\|/, '')
        .replace(/\|$/, '')
        .split('|')
        .map((c) => c.trim());
      i += 2;
      const rows = [];
      while (i < lines.length && /^\|.+\|/.test(lines[i])) {
        rows.push(
          lines[i]
            .replace(/^\|/, '')
            .replace(/\|$/, '')
            .split('|')
            .map((c) => c.trim()),
        );
        i += 1;
      }
      let html = '<table class="md-table"><thead><tr>';
      headerCells.forEach((c) => {
        html += `<th>${mdInline(c)}</th>`;
      });
      html += '</tr></thead><tbody>';
      rows.forEach((r) => {
        html += '<tr>';
        r.forEach((c) => {
          html += `<td>${mdInline(c)}</td>`;
        });
        html += '</tr>';
      });
      html += '</tbody></table>';
      out.push(html);
      continue;
    }

    // HR
    if (/^(-{3,}|\*{3,}|_{3,})\s*$/.test(line)) {
      flushList();
      out.push('<hr />');
      i += 1;
      continue;
    }

    // headings
    const h = line.match(/^(#{1,6})\s+(.+)$/);
    if (h) {
      flushList();
      const level = h[1].length;
      out.push(`<h${level}>${mdInline(h[2])}</h${level}>`);
      i += 1;
      continue;
    }

    // checklist
    const check = line.match(/^[-*]\s+\[([ xX])\]\s+(.+)$/);
    if (check) {
      if (listType && listType !== 'check') flushList();
      listType = 'check';
      const done = check[1].toLowerCase() === 'x';
      listBuf.push(
        `<li class="md-check-item">${done ? '☑' : '☐'} ${mdInline(check[2])}</li>`,
      );
      i += 1;
      continue;
    }

    // ul
    const ul = line.match(/^[-*]\s+(.+)$/);
    if (ul) {
      if (listType && listType !== 'ul') flushList();
      listType = 'ul';
      listBuf.push(`<li>${mdInline(ul[1])}</li>`);
      i += 1;
      continue;
    }

    // ol
    const ol = line.match(/^\d+\.\s+(.+)$/);
    if (ol) {
      if (listType && listType !== 'ol') flushList();
      listType = 'ol';
      listBuf.push(`<li>${mdInline(ol[1])}</li>`);
      i += 1;
      continue;
    }

    if (!line.trim()) {
      flushList();
      i += 1;
      continue;
    }

    flushList();
    out.push(`<p>${mdInline(line)}</p>`);
    i += 1;
  }

  flushList();
  if (inCode) flushCode();
  return out.join('\n');
}

window.buildxpRenderMarkdown = buildxpRenderMarkdown;
window.mdEscape = mdEscape;
