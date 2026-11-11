// BuildXP — parser markdown (GFM + HTML sanitizado estilo GitHub README)
// Nota: GitHub não executa JS no README — este preview também não.

function mdEscape(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

const MD_ALLOWED_TAGS = new Set([
  'a', 'abbr', 'b', 'blockquote', 'br', 'code', 'dd', 'del', 'details', 'div', 'dl', 'dt',
  'em', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'hr', 'i', 'img', 'ins', 'kbd', 'li', 'mark',
  'ol', 'p', 'pre', 'q', 's', 'samp', 'small', 'span', 'strong', 'sub', 'summary', 'sup',
  'table', 'tbody', 'td', 'tfoot', 'th', 'thead', 'tr', 'u', 'ul',
]);

const MD_VOID_TAGS = new Set(['br', 'hr', 'img']);

const MD_ALLOWED_ATTRS = {
  '*': ['align', 'class', 'id', 'title', 'dir', 'lang'],
  a: ['href', 'name', 'target', 'rel'],
  img: ['src', 'alt', 'title', 'width', 'height', 'align', 'loading', 'referrerpolicy'],
  td: ['align', 'colspan', 'rowspan', 'width', 'height'],
  th: ['align', 'colspan', 'rowspan', 'width', 'height'],
  table: ['align', 'border', 'cellpadding', 'cellspacing', 'width'],
  div: ['align'],
  p: ['align'],
  details: ['open'],
};

function mdIsSafeUrl(url, kind) {
  const u = String(url || '').trim();
  if (!u) return false;
  if (/^#/i.test(u)) return kind === 'href';
  if (/^mailto:/i.test(u)) return kind === 'href';
  if (/^https?:\/\//i.test(u)) return true;
  return false;
}

function mdSanitizeStyle(raw) {
  const s = String(raw || '');
  const allowed = [];
  const parts = s.split(';');
  for (const part of parts) {
    const m = part.match(/^\s*([a-zA-Z-]+)\s*:\s*(.+)\s*$/);
    if (!m) continue;
    const prop = m[1].toLowerCase();
    let val = m[2].trim();
    if (/expression|url\s*\(|javascript:|@import|behavior/i.test(val)) continue;
    if (
      [
        'color',
        'background',
        'background-color',
        'text-align',
        'width',
        'height',
        'max-width',
        'max-height',
        'margin',
        'padding',
        'border',
        'border-radius',
        'font-size',
        'font-weight',
        'display',
        'vertical-align',
        'opacity',
      ].includes(prop)
    ) {
      // só valores “simples”
      if (/^[^;{}]+$/.test(val) && val.length < 80) allowed.push(`${prop}:${val}`);
    }
  }
  return allowed.join(';');
}

function mdAllowedAttrsFor(tag) {
  const base = MD_ALLOWED_ATTRS['*'] || [];
  const extra = MD_ALLOWED_ATTRS[tag] || [];
  return new Set([...base, ...extra, 'style']);
}

/** Sanitiza fragmento HTML (allowlist GitHub-like). Sem script/eventos. */
function mdSanitizeHtml(html) {
  if (typeof DOMParser === 'undefined') {
    return mdEscape(html);
  }
  const parser = new DOMParser();
  const doc = parser.parseFromString(`<div id="md-root">${html}</div>`, 'text/html');
  const root = doc.getElementById('md-root');
  if (!root) return '';

  const walk = (node, outParent) => {
    const children = Array.from(node.childNodes);
    for (const child of children) {
      if (child.nodeType === 3) {
        outParent.appendChild(document.createTextNode(child.textContent || ''));
        continue;
      }
      if (child.nodeType !== 1) continue;
      const tag = child.tagName.toLowerCase();
      if (tag === 'script' || tag === 'style' || tag === 'iframe' || tag === 'object' || tag === 'embed') {
        continue;
      }
      if (!MD_ALLOWED_TAGS.has(tag)) {
        walk(child, outParent);
        continue;
      }

      const el = document.createElement(tag);
      const allow = mdAllowedAttrsFor(tag);
      for (const attr of Array.from(child.attributes)) {
        const name = attr.name.toLowerCase();
        if (name.startsWith('on')) continue;
        if (!allow.has(name)) continue;
        let val = attr.value;
        if (name === 'href' || name === 'src') {
          if (!mdIsSafeUrl(val, name === 'src' ? 'src' : 'href')) continue;
          if (name === 'href' && /^https?:/i.test(val)) {
            el.setAttribute('target', '_blank');
            el.setAttribute('rel', 'noopener noreferrer');
          }
        }
        if (name === 'style') {
          const safeStyle = mdSanitizeStyle(val);
          if (!safeStyle) continue;
          el.setAttribute('style', safeStyle);
          continue;
        }
        if (name === 'class') {
          val = String(val)
            .split(/\s+/)
            .filter((c) => /^[a-zA-Z0-9_-]+$/.test(c))
            .join(' ');
          if (!val) continue;
        }
        el.setAttribute(name, val);
      }

      if (tag === 'img') {
        el.setAttribute('loading', 'lazy');
        el.setAttribute('referrerpolicy', 'no-referrer');
        const w = el.getAttribute('width');
        const h = el.getAttribute('height');
        if (w || h) el.classList.add('md-img--sized');
        else el.classList.add('md-img--auto');
      }

      if (!MD_VOID_TAGS.has(tag)) walk(child, el);
      outParent.appendChild(el);
    }
  };

  const holder = document.createElement('div');
  walk(root, holder);
  return holder.innerHTML;
}

/** Permite <img> HTTPS seguro em conteúdo misto (títulos README / typing SVG). */
function mdSanitizeImgTag(tag) {
  const src = (tag.match(/\bsrc\s*=\s*"([^"]+)"/i) || [])[1] || '';
  if (!/^https:\/\//i.test(src)) return '';
  const alt = (tag.match(/\balt\s*=\s*"([^"]*)"/i) || [])[1] || '';
  const width = (tag.match(/\bwidth\s*=\s*"([^"]+)"/i) || [])[1] || '';
  const height = (tag.match(/\bheight\s*=\s*"([^"]+)"/i) || [])[1] || '';
  const valign = (tag.match(/\bvalign\s*=\s*"([^"]+)"/i) || [])[1] || '';
  const sized = !!(width || height);
  let out = `<img src="${mdEscape(src)}" alt="${mdEscape(alt)}" loading="lazy" referrerpolicy="no-referrer" class="${sized ? 'md-img--sized' : 'md-img--auto'}"`;
  if (width) out += ` width="${mdEscape(width)}"`;
  if (height) out += ` height="${mdEscape(height)}"`;
  if (valign) out += ` align="${mdEscape(valign)}"`;
  out += ' />';
  return out;
}

function mdSanitizeOpenTag(raw) {
  const m = String(raw ?? '').match(/^\s*<([a-zA-Z][a-zA-Z0-9]*)\b([^>]*)>/);
  if (!m) return '';
  const tag = m[1].toLowerCase();
  if (!MD_ALLOWED_TAGS.has(tag)) return '';
  const allow = mdAllowedAttrsFor(tag);
  const attrs = [];
  const attrRe = /([a-zA-Z_:][\w:.-]*)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/g;
  let am;
  const attrStr = m[2] || '';
  while ((am = attrRe.exec(attrStr))) {
    const name = am[1].toLowerCase();
    if (name.startsWith('on') || !allow.has(name)) continue;
    let val = am[2] ?? am[3] ?? am[4] ?? '';
    if (name === 'href' || name === 'src') {
      if (!mdIsSafeUrl(val, name === 'src' ? 'src' : 'href')) continue;
    }
    if (name === 'style') {
      val = mdSanitizeStyle(val);
      if (!val) continue;
    }
    if (name === 'class') {
      val = String(val)
        .split(/\s+/)
        .filter((c) => /^[a-zA-Z0-9_-]+$/.test(c))
        .join(' ');
      if (!val) continue;
    }
    attrs.push(` ${name}="${mdEscape(val)}"`);
  }
  if (tag === 'a') {
    attrs.push(' target="_blank"', ' rel="noopener noreferrer"');
  }
  return `<${tag}${attrs.join('')}>`;
}

function mdSanitizeCloseTag(raw) {
  const m = String(raw ?? '').match(/^\s*<\/\s*([a-zA-Z][a-zA-Z0-9]*)\s*>/);
  if (!m) return '';
  const tag = m[1].toLowerCase();
  if (!MD_ALLOWED_TAGS.has(tag)) return '';
  return `</${tag}>`;
}

/** GitHub: markdown dentro de HTML com linha em branco após abrir / antes de fechar. */
function mdHtmlInnerShouldParseMarkdown(openLine, innerLines) {
  if (!innerLines.length) return false;
  const openAlone = /^\s*<[a-zA-Z][^>]*>\s*$/.test(openLine);
  const blankAfterOpen = !String(innerLines[0] ?? '').trim();
  const blankBeforeClose = !String(innerLines[innerLines.length - 1] ?? '').trim();
  const inner = innerLines.join('\n');
  const looksMd =
    /(?:^|\n)\s*(?:#{1,6}\s|[-*+]\s|\d+\.\s|!\[|\[[^\]]+\]\(|\*\*[^*]|\*[^*]|```|>\s)/m.test(inner);
  // Padrão README: <div> sozinho + conteúdo markdown (com ou sem blank lines)
  if (openAlone && looksMd) return true;
  return blankAfterOpen || blankBeforeClose;
}

/**
 * Renderiza bloco HTML; se o GitHub permitiria markdown no interior, processa o miolo.
 * @param {string[]} bufLines
 * @param {(src: string) => string} renderMd
 */
function mdRenderHtmlBlock(bufLines, renderMd) {
  if (!bufLines.length) return '';
  const openLine = bufLines[0];
  const openTagName = (openLine.match(/^\s*<([a-zA-Z][a-zA-Z0-9]*)\b/) || [])[1];
  if (!openTagName) return mdSanitizeHtml(bufLines.join('\n'));

  const tag = openTagName.toLowerCase();
  if (MD_VOID_TAGS.has(tag)) {
    return mdSanitizeHtml(bufLines.join('\n'));
  }

  const closerRe = new RegExp(`</${tag}\\s*>`, 'i');
  const closedSame = closerRe.test(openLine);
  if (closedSame && bufLines.length === 1) {
    // <p>texto</p> numa linha — sanitiza e aplica inline no texto interior se possível
    const one = bufLines[0];
    const parts = one.match(new RegExp(`^(\\s*<${tag}\\b[^>]*>)([\\s\\S]*)(</${tag}\\s*>)\\s*$`, 'i'));
    if (parts) {
      const open = mdSanitizeOpenTag(parts[1]);
      const close = mdSanitizeCloseTag(parts[3]);
      if (!open || !close) return mdSanitizeHtml(one);
      const inner = parts[2];
      if (/[*_`!\[]/.test(inner) || /https?:\/\//.test(inner)) {
        return open + mdInline(inner) + close;
      }
      return mdSanitizeHtml(one);
    }
    return mdSanitizeHtml(one);
  }

  const closeLine = bufLines[bufLines.length - 1];
  const hasClose = closerRe.test(closeLine);
  const innerLines = hasClose ? bufLines.slice(1, -1) : bufLines.slice(1);

  if (!mdHtmlInnerShouldParseMarkdown(openLine, innerLines)) {
    return mdSanitizeHtml(bufLines.join('\n'));
  }

  const open = mdSanitizeOpenTag(openLine);
  const close = hasClose ? mdSanitizeCloseTag(closeLine) : '';
  if (!open) return mdSanitizeHtml(bufLines.join('\n'));

  // Remove blank lines de borda (regra GitHub) só para o parse; estrutura visual via CSS align
  let start = 0;
  let end = innerLines.length;
  while (start < end && !String(innerLines[start]).trim()) start += 1;
  while (end > start && !String(innerLines[end - 1]).trim()) end -= 1;
  const innerMd = innerLines.slice(start, end).join('\n');
  const innerHtml = innerMd.trim() ? renderMd(innerMd) : '';
  return `${open}\n${innerHtml}\n${close}`;
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

  const htmlBits = [];
  s = s.replace(/<(br|hr)\s*\/?>/gi, (tag) => {
    const token = `\u0000H${htmlBits.length}\u0000`;
    htmlBits.push(mdSanitizeHtml(tag));
    return token;
  });
  s = s.replace(
    /<(span|strong|em|b|i|u|s|sub|sup|mark|kbd|samp|small|a|code)\b[^>]*>[\s\S]*?<\/\1>/gi,
    (block) => {
      const safe = mdSanitizeHtml(block);
      if (!safe) return '';
      const token = `\u0000H${htmlBits.length}\u0000`;
      htmlBits.push(safe);
      return token;
    },
  );

  s = mdEscape(s);

  // Imagem clicável: [![alt](imgUrl)](href) — comum em badges / typing SVG
  // URLs com query (?a=1&b=2) entram em [^)\s]+ sem cortar nos &
  s = s.replace(
    /\[!\[([^\]]*)\]\((https?:\/\/[^)\s]+)\)\]\((https?:\/\/[^)\s]+)\)/g,
    '<a href="$3" target="_blank" rel="noopener noreferrer"><img src="$2" alt="$1" loading="lazy" referrerpolicy="no-referrer" class="md-img--auto" /></a>',
  );
  // images ![alt](url)
  s = s.replace(
    /!\[([^\]]*)\]\((https?:\/\/[^)\s]+)\)/g,
    '<img src="$2" alt="$1" loading="lazy" referrerpolicy="no-referrer" class="md-img--auto" />',
  );
  // links [text](url)
  s = s.replace(
    /\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g,
    '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>',
  );
  s = s.replace(/\*\*\*([^*]+)\*\*\*/g, '<strong><em>$1</em></strong>');
  s = s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  s = s.replace(/(^|[^*])\*([^*]+)\*(?!\*)/g, '$1<em>$2</em>');
  s = s.replace(/`([^`]+)`/g, '<code>$1</code>');
  imgs.forEach((html, idx) => {
    s = s.replace(`\u0000IMG${idx}\u0000`, html);
  });
  htmlBits.forEach((html, idx) => {
    s = s.replace(`\u0000H${idx}\u0000`, html);
  });
  return s;
}

let mdRenderDepth = 0;

function buildxpRenderMarkdown(src) {
  if (mdRenderDepth > 10) {
    return mdEscape(src);
  }
  mdRenderDepth += 1;
  try {
    return buildxpRenderMarkdownInner(src);
  } finally {
    mdRenderDepth -= 1;
  }
}

function buildxpRenderMarkdownInner(src) {
  const lines = String(src ?? '').replace(/\r\n/g, '\n').split('\n');
  const out = [];
  let i = 0;
  let inCode = false;
  let codeBuf = [];
  let listType = null;
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

    // HTML comments
    if (/^\s*<!--/.test(line)) {
      flushList();
      if (/-->/.test(line)) {
        i += 1;
        continue;
      }
      i += 1;
      while (i < lines.length && !/-->/.test(lines[i])) i += 1;
      if (i < lines.length) i += 1;
      continue;
    }

    // Bloco HTML — markdown no interior (estilo GitHub) quando aplicável
    if (/^\s*<\/?[a-zA-Z]/.test(line) && !/^\s*<br\s*\/?>\s*$/i.test(line)) {
      flushList();
      const buf = [line];
      i += 1;
      const openTag = (line.match(/^\s*<([a-zA-Z][a-zA-Z0-9]*)\b/) || [])[1];
      const isVoid = openTag && MD_VOID_TAGS.has(openTag.toLowerCase());
      const isCloseOnly = /^\s*<\//.test(line);
      const closedSame = openTag && new RegExp(`</${openTag}\\s*>`, 'i').test(line);
      if (!isVoid && !isCloseOnly && openTag && !closedSame) {
        const closer = new RegExp(`</${openTag}\\s*>`, 'i');
        while (i < lines.length) {
          buf.push(lines[i]);
          if (closer.test(lines[i])) {
            i += 1;
            break;
          }
          i += 1;
          if (buf.length > 200) break;
        }
      }
      out.push(mdRenderHtmlBlock(buf, buildxpRenderMarkdown));
      continue;
    }

    if (/^\s*<br\s*\/?>\s*$/i.test(line)) {
      flushList();
      out.push('<br />');
      i += 1;
      continue;
    }

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
      let html = '<div class="md-table-wrap"><table class="md-table"><thead><tr>';
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
      html += '</tbody></table></div>';
      out.push(html);
      continue;
    }

    if (/^(-{3,}|\*{3,}|_{3,})\s*$/.test(line)) {
      flushList();
      out.push('<hr />');
      i += 1;
      continue;
    }

    const h = line.match(/^(#{1,6})\s+(.+)$/);
    if (h) {
      flushList();
      const level = h[1].length;
      out.push(`<h${level}>${mdInline(h[2])}</h${level}>`);
      i += 1;
      continue;
    }

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

    const ul = line.match(/^[-*]\s+(.+)$/);
    if (ul) {
      if (listType && listType !== 'ul') flushList();
      listType = 'ul';
      listBuf.push(`<li>${mdInline(ul[1])}</li>`);
      i += 1;
      continue;
    }

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
window.mdSanitizeHtml = mdSanitizeHtml;
window.mdInline = mdInline;
