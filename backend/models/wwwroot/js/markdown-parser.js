// BuildXP — parser markdown (subconjunto GFM) para "Construa aqui"
function mdEscape(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Permite <img> HTTPS seguro em conteúdo misto (títulos README / typing SVG). */
function mdSanitizeImgTag(tag) {
  const src = (tag.match(/\bsrc\s*=\s*"([^"]+)"/i) || [])[1] || '';
  if (!/^https:\/\//i.test(src)) return '';
  const alt = (tag.match(/\balt\s*=\s*"([^"]*)"/i) || [])[1] || '';
  const width = (tag.match(/\bwidth\s*=\s*"([^"]+)"/i) || [])[1] || '';
  const height = (tag.match(/\bheight\s*=\s*"([^"]+)"/i) || [])[1] || '';
  const valign = (tag.match(/\bvalign\s*=\s*"([^"]+)"/i) || [])[1] || '';
  let out = `<img src="${mdEscape(src)}" alt="${mdEscape(alt)}" loading="lazy" referrerpolicy="no-referrer"`;
  if (width) out += ` width="${mdEscape(width)}"`;
  if (height) out += ` height="${mdEscape(height)}"`;
  if (valign) out += ` style="vertical-align:${mdEscape(valign)}"`;
  out += ' />';
  return out;
}

function mdInline(raw) {
  const imgs = [];
  let s = String(raw ?? '').replace(/<img\b[^>]*\/?>/gi, (tag) => {
    const safe = mdSanitizeImgTag(tag);
    if (!safe) return '';
    const token = `\u0000IMG${imgs.length}\u0000`;
    imgs.push(safe);
    return token;
  });
  s = mdEscape(s);
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
  imgs.forEach((html, idx) => {
    s = s.replace(`\u0000IMG${idx}\u0000`, html);
  });
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

    // HTML comments (hidden on GitHub; skip in preview)
    if (/^\s*<!--[\s\S]*-->\s*$/.test(line)) {
      i += 1;
      continue;
    }

    // <br/> solo (espaçamento em READMEs)
    if (/^\s*<br\s*\/?>\s*$/i.test(line)) {
      flushList();
      out.push('<br />');
      i += 1;
      continue;
    }

    // <p align="...">...</p> (typing SVG / blocos centrais)
    if (/^\s*<p\b/i.test(line)) {
      flushList();
      const buf = [line];
      const openOnly = !/<\/p>\s*$/i.test(line);
      i += 1;
      while (openOnly && i < lines.length) {
        buf.push(lines[i]);
        if (/<\/p>/i.test(lines[i])) {
          i += 1;
          break;
        }
        i += 1;
      }
      const block = buf.join('\n');
      const align = ((block.match(/<p\b[^>]*\balign\s*=\s*"([^"]*)"/i) || [])[1] || '').toLowerCase();
      const style = align === 'center' ? ' text-align:center;' : '';
      const inner = block
        .replace(/^\s*<p\b[^>]*>/i, '')
        .replace(/<\/p>\s*$/i, '')
        .trim();
      out.push(`<p style="${style}">${mdInline(inner)}</p>`);
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
