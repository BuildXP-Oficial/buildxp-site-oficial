// BuildXP - cards-home
/* ── DASHBOARD (admin UI → API) ─────────────────────────────*/
function getBuildXpApiBase() {
  if (typeof window.BUILDXP_API_BASE === 'string' && window.BUILDXP_API_BASE.trim()) {
    return window.BUILDXP_API_BASE.trim().replace(/\/$/, '');
  }
  return '';
}

/** Slug do card de treino a partir de `{slug}.html` no URL ou `window.BUILDXP_TRAINING_CARD_SLUG`. */
function buildxpTrainingSlugFromPath() {
  const custom =
    typeof window.BUILDXP_TRAINING_CARD_SLUG === 'string' ? window.BUILDXP_TRAINING_CARD_SLUG.trim() : '';
  if (custom) return custom.toLowerCase();
  try {
    const name = (window.location.pathname || '').split('/').pop() || '';
    const m = name.match(/^([a-z0-9][a-z0-9-]{0,47})\.html$/i);
    if (!m) return '';
    const slug = m[1].toLowerCase();
    const reserved = new Set(['index', 'dashboard', 'feedback']);
    if (reserved.has(slug)) return '';
    return slug;
  } catch (_) {
    return '';
  }
}

function buildxpSlugFromPage() {
  try {
    const q = new URLSearchParams(window.location.search).get('slug');
    if (q && String(q).trim()) return String(q).trim().toLowerCase();
  } catch (_) {
    /* ignore */
  }
  return buildxpTrainingSlugFromPath();
}

function buildxpEscapeHtml(s) {
  if (typeof dashEscapeHtml === 'function') return dashEscapeHtml(s);
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** HTML do slide FIM fixo (terminal + cheap codes) — sempre o último da trilha. */
function buildxpFinSlideHtml(slug, finSlide) {
  const safeSlug = String(slug || '').trim().toLowerCase();
  let fimTitulo = 'Parabéns! 🏆';
  let fimBody =
    '<div class="step-desc">Você concluiu a trilha iniciante. Pratique no terminal ou consulte os cheap codes.</div>';
  if (finSlide) {
    const ft = String(finSlide.titulo ?? finSlide.Titulo ?? '').trim();
    const fd = String(finSlide.descricao ?? finSlide.Descricao ?? '').trim();
    if (ft && ft !== BUILDXP_SLIDE_PAUSE_TITULO && !/^pausa$/i.test(ft)) fimTitulo = ft;
    if (fd) {
      fimBody = /<[a-z][\s\S]*>/i.test(fd)
        ? fd
        : `<div class="step-desc">${buildxpEscapeHtml(fd).replace(/\n/g, '<br>')}</div>`;
    }
  }
  const cheatHref = safeSlug
    ? `card.html?slug=${encodeURIComponent(safeSlug)}&tab=ref`
    : 'card.html?tab=ref';
  return `
    <div class="step step--fim">
      <div class="step-num">🏆</div>
      <div class="card-fim-body">
        <div class="step-title">${buildxpEscapeHtml(fimTitulo)}</div>
        ${fimBody}
        <div class="term-actions card-fim-actions">
          <a href="index.html#terminal" class="term-btn primary">INICIAR TREINAMENTO</a>
          <a href="${cheatHref}" class="term-btn ghost">🎮 VERIFICAR CHEAP CODES</a>
        </div>
      </div>
    </div>`;
}

function buildxpAppendFinSlideToTrack(track, slug, finSlideFromApi) {
  if (!track) return;
  const holder = document.createElement('div');
  holder.innerHTML = buildxpFinSlideHtml(slug, finSlideFromApi);
  const fin = holder.firstElementChild;
  if (fin) track.appendChild(fin);
}

function buildxpFindFinStepClone(track) {
  if (!track) return null;
  for (const el of track.querySelectorAll('.step')) {
    const num = (el.querySelector('.step-num')?.textContent || '').trim().toUpperCase();
    if (num === 'FIM' || el.querySelector('.term-actions')) return el.cloneNode(true);
  }
  return null;
}

/** Título reservado na API para slides «pausa». */
const BUILDXP_SLIDE_PAUSE_TITULO = '__buildxp_pause__';

/** Converte um slide da API (titulo/descricao) para o mesmo DOM que o HTML estático usa. */
function buildxpApiSlideToDom(slide) {
  const ordem = Number(slide.ordem ?? slide.Ordem ?? 0) || 0;
  const tituloRaw = String(slide.titulo ?? slide.Titulo ?? '');
  const titulo = tituloRaw.trim();
  const descricao = String(slide.descricao ?? slide.Descricao ?? '');
  const codigo = String(slide.codigo_bloco ?? slide.codigoBloco ?? '').trim() || '';

  const isPause = tituloRaw === BUILDXP_SLIDE_PAUSE_TITULO || /^pausa$/i.test(titulo);

  const wrap = document.createElement('div');
  wrap.className = isPause ? 'step step-pause' : 'step';
  const numEl = document.createElement('div');
  numEl.className = 'step-num';
  numEl.textContent = isPause ? 'PAUSA' : String(ordem).padStart(2, '0');
  const body = document.createElement('div');

  if (isPause) {
    if (/<[a-z][\s\S]*>/i.test(descricao)) body.innerHTML = descricao;
    else
      body.innerHTML = descricao
        ? `<div class="step-desc">${dashEscapeHtml(descricao).replace(/\n/g, '<br>')}</div>`
        : '';
  } else {
    const titleEl = document.createElement('div');
    titleEl.className = 'step-title';
    titleEl.textContent = titulo;
    body.appendChild(titleEl);
    if (descricao) {
      const holder = document.createElement('div');
      holder.innerHTML = descricao;
      while (holder.firstChild) body.appendChild(holder.firstChild);
    }
    if (codigo) {
      const block = document.createElement('div');
      block.className = 'cmd-block';
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'copy-btn';
      btn.textContent = 'copy';
      const code = document.createElement('code');
      code.textContent = codigo;
      block.appendChild(btn);
      block.appendChild(code);
      body.appendChild(block);
    }
  }

  wrap.appendChild(numEl);
  wrap.appendChild(body);
  return wrap;
}

/**
 * Substitui os slides da aba Iniciante pelo conteúdo do GET público `/api/card/{slug}` quando existir slides na BD.
 * Mantém o slide final (FIM + botões) clonado do HTML publicado.
 * @returns {Promise<boolean>}
 */
async function buildxpHydrateTrainingSlidesFromApi() {
  const slug = buildxpSlugFromPage();
  if (!slug) return false;

  const track =
    document.querySelector('#beginner .steps.steps-track') ||
    document.querySelector('#beginner .steps-track') ||
    document.querySelector('.tab-pane#beginner .steps-track') ||
    document.querySelector('.tab-pane#beginner .steps.steps-track');
  if (!track) return false;

  const base = getBuildXpApiBase();
  const url = `${base}/api/card/${encodeURIComponent(slug)}`;
  let data;
  try {
    const res = await fetch(url, {
      credentials: 'same-origin',
      cache: 'no-store',
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) return false;
    data = await res.json();
  } catch (_) {
    return false;
  }

  const slidesRaw = data.slides ?? data.Slides;
  if (!Array.isArray(slidesRaw) || slidesRaw.length === 0) return false;

  track.innerHTML = '';

  const sorted = [...slidesRaw].sort(
    (a, b) => (Number(a.ordem ?? a.Ordem) || 0) - (Number(b.ordem ?? b.Ordem) || 0),
  );
  let finFromApi = null;
  sorted.forEach((s) => {
    const titulo = String(s.titulo ?? s.Titulo ?? '').trim();
    const desc = String(s.descricao ?? s.Descricao ?? '').toLowerCase();
    const isFin =
      titulo === 'FIM' ||
      /^conclus(ão|ao)?$/i.test(titulo) ||
      (titulo === '' && /chegou|chegaste|voando|reflexo|🏆/.test(desc));
    if (isFin) {
      if (!finFromApi) finFromApi = s;
      return;
    }
    track.appendChild(buildxpApiSlideToDom(s));
  });
  buildxpAppendFinSlideToTrack(track, slug, finFromApi);
  return true;
}

const BUILDXP_INDEX_ORDER_KEY = 'buildxp_index_card_order';
const BUILDXP_INDEX_CARD_DEFS = [
  { id: 1, slug: 'git', theme: 'git', label: 'Git & GitHub', page: 'git.html' },
  { id: 2, slug: 'docker', theme: 'docker', label: 'Docker', page: 'docker.html' },
  { id: 3, slug: 'npm', theme: 'npm', label: 'NPM', page: 'npm.html' },
  { id: 4, slug: 'dotnet', theme: 'dotnet', label: '.NET / dotnet', page: 'dotnet.html' },
];
const BUILDXP_INDEX_SLUGS = BUILDXP_INDEX_CARD_DEFS.map((c) => c.slug);
/** Hex por tema preset — mesmo mapa que CardService.CorParaTema no backend. */
const BUILDXP_THEME_PRESET_HEX = Object.freeze({
  git: '#39d353',
  docker: '#2496ed',
  npm: '#cb3837',
  dotnet: '#512bd4',
  api: '#22d3ee',
  python: '#3776ab',
});

function buildxpNormalizeHexColor(raw) {
  if (raw == null || raw === '') return null;
  let s = String(raw).trim();
  if (!s.startsWith('#')) s = `#${s}`;
  const h = s.slice(1);
  if (/^[0-9a-fA-F]{3}$/.test(h)) {
    const a = h[0];
    const b = h[1];
    const c = h[2];
    return `#${a}${a}${b}${b}${c}${c}`.toLowerCase();
  }
  if (/^[0-9a-fA-F]{6}$/.test(h)) return `#${h.toLowerCase()}`;
  return null;
}

function buildxpPresetHexForTheme(themeRaw) {
  const t = String(themeRaw ?? 'git').trim().toLowerCase();
  return BUILDXP_THEME_PRESET_HEX[t] || BUILDXP_THEME_PRESET_HEX.git;
}

/** URL dos botões do index / API — sempre card.html (conteúdo via API + fallback estático). */
function buildxpPublicCardHref(slug, tab) {
  const s = String(slug || '').trim().toLowerCase();
  const t = tab === 'ref' ? 'ref' : 'beginner';
  return `card.html?slug=${encodeURIComponent(s)}&tab=${t}`;
}

/** Marca do site: «cheat code(s)» → «cheap code(s)». */
function buildxpNormalizeCheapCodesBranding(text) {
  return String(text ?? '').replace(/\bcheat(\s+codes?\b)/gi, (match, suffix) => {
    const replacement = `cheap${suffix}`;
    if (match === match.toUpperCase()) return replacement.toUpperCase();
    if (match[0] === match[0].toUpperCase()) {
      return replacement[0].toUpperCase() + replacement.slice(1);
    }
    return replacement;
  });
}

window.buildxpNormalizeCheapCodesBranding = buildxpNormalizeCheapCodesBranding;

/** Migra links antigos tipo integrandoumaapi.html?tab=… para card.html?slug=… (slug do card é a fonte de verdade). */
function buildxpNormalizeLegacyCardListHref(href, slug, tab) {
  const sl = String(slug || '').trim().toLowerCase();
  const t = tab === 'ref' ? 'ref' : 'beginner';
  const fallback = sl ? `card.html?slug=${encodeURIComponent(sl)}&tab=${t}` : '';
  let l = String(href || '').trim();
  if (l.startsWith('./')) l = l.slice(2);
  l = l.replace(/^\/+/, '');
  if (!l) return fallback;
  if (/^card\.html/i.test(l)) return String(href || '').trim();
  if (l.includes('://')) return String(href || '').trim();
  if (/^[a-z0-9][a-z0-9_-]*\.html([\?#][^\s]*)?$/i.test(l))
    return sl ? `card.html?slug=${encodeURIComponent(sl)}&tab=${t}` : String(href || '').trim();
  return String(href || '').trim();
}

const BUILDXP_WIZ_DRAFT_KEY = 'buildxp_card_wizard_drafts';

function dashNewSlideId() {
  return `s_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

function dashSlidesStorageKey(slug) {
  return `buildxp_slides_${slug}`;
}

/** Metadados padrão dos 4 cards do index (quando a API não responde). */
const INDEX_CARD_STATIC_DEFAULTS = {
  git: {
    slug: 'git',
    theme: 'git',
    display_name: 'Git & GitHub',
    rarity_label: 'ESSENTIAL',
    card_class: 'VERSION CONTROL',
    xp_current: 2400,
    xp_max: 3000,
    sort_order: 0,
    link_beginner: 'card.html?slug=git&tab=beginner',
    link_ref: 'card.html?slug=git&tab=ref',
    btn_primary_label: '▶ COMEÇAR',
    btn_secondary_label: '🎮 CHEAP CODES',
    description_html:
      '<p>Do primeiro <code>git init</code> até branches, PRs e fluxos avançados. Guia completo para iniciantes e Cheap Codes para quem já usa e não lembra um comando específico.<br>Clique no botão para começar a aprender Git e GitHub.</p>',
    icon_layout: 'dual',
    icon_primary_src: 'imagens/gitlogobr.png',
    icon_primary_alt: 'Git',
    icon_secondary_src: 'imagens/githublogo.png',
    icon_secondary_alt: 'GitHub',
    is_published: true,
  },
  docker: {
    slug: 'docker',
    theme: 'docker',
    display_name: 'Docker',
    rarity_label: 'CORE',
    card_class: 'CONTAINERIZATION',
    xp_current: 1800,
    xp_max: 3000,
    sort_order: 1,
    link_beginner: 'card.html?slug=docker&tab=beginner',
    link_ref: 'card.html?slug=docker&tab=ref',
    btn_primary_label: '▶ COMEÇAR',
    btn_secondary_label: '🎮 CHEAP CODES',
    description_html:
      '<p>Containers, imagens, Dockerfile e Docker Compose. Do conceito básico ao ambiente completo rodando com um comando.<br>Clique no botão para começar a aprender Docker.</p>',
    icon_layout: 'single',
    icon_primary_src: 'imagens/dockerlogo.png',
    icon_primary_alt: 'Docker',
    icon_secondary_src: '',
    icon_secondary_alt: '',
    is_published: true,
  },
  npm: {
    slug: 'npm',
    theme: 'npm',
    display_name: 'NPM',
    rarity_label: 'CORE',
    card_class: 'PACKAGE MANAGER',
    xp_current: 1200,
    xp_max: 3000,
    sort_order: 2,
    link_beginner: 'card.html?slug=npm&tab=beginner',
    link_ref: 'card.html?slug=npm&tab=ref',
    btn_primary_label: '▶ COMEÇAR',
    btn_secondary_label: '🎮 CHEAP CODES',
    description_html:
      '<p>Gerencie pacotes, scripts e dependências de projetos Node.js. Do <code>npm init</code> ao publish no registry. Inclui também Prisma como pacote npm e comandos <code>npx prisma</code> (generate e migrations).<br>Clique no botão para começar a aprender NPM e para o que ele serve.</p>',
    icon_layout: 'single',
    icon_primary_src: 'imagens/npmlogo.png',
    icon_primary_alt: 'NPM',
    icon_secondary_src: '',
    icon_secondary_alt: '',
    is_published: true,
  },
  dotnet: {
    slug: 'dotnet',
    theme: 'dotnet',
    display_name: '.NET / dotnet',
    rarity_label: 'SPECIALIST',
    card_class: 'RUNTIME & CLI',
    xp_current: 900,
    xp_max: 3000,
    sort_order: 3,
    link_beginner: 'card.html?slug=dotnet&tab=beginner',
    link_ref: 'card.html?slug=dotnet&tab=ref',
    btn_primary_label: '▶ COMEÇAR',
    btn_secondary_label: '🎮 CHEAP CODES',
    description_html:
      '<p>CLI do .NET para criar, buildar, testar e publicar projetos. Essencial para quem trabalha com C#, ASP.NET e afins (ou quer entender como funciona).<br>Clique no botão para começar a aprender C# e .NET.</p>',
    icon_layout: 'single',
    icon_primary_src: 'imagens/csharplogo.png',
    icon_primary_alt: '.NET',
    icon_secondary_src: '',
    icon_secondary_alt: '',
    is_published: true,
  },
};

function dashParseOneStepEl(stepEl) {
  const id = dashNewSlideId();
  const numRaw = (stepEl.querySelector('.step-num')?.textContent || '').trim();
  const numUp = numRaw.replace(/\s/g, '').toUpperCase();
  let body = stepEl.querySelector(':scope > div:nth-child(2)');
  if (!body) {
    const sn = stepEl.querySelector(':scope > .step-num');
    body = sn?.nextElementSibling;
  }
  if (!body) return null;

  if (stepEl.classList.contains('step-pause')) {
    const descs = [...body.querySelectorAll('.step-desc')];
    const text = descs.map((d) => d.innerHTML.trim()).filter(Boolean).join('\n\n');
    const callouts = [...body.querySelectorAll('.callout')];
    const observation = callouts.map((c) => c.innerHTML.trim()).filter(Boolean).join('\n\n');
    return { id, type: 'pause', text, observation: observation || '' };
  }

  const titleEl = body.querySelector('.step-title');
  const title = titleEl ? titleEl.textContent.trim() : '';
  const descs = [...body.querySelectorAll('.step-desc')];
  const text = descs.map((d) => d.innerHTML.trim()).filter(Boolean).join('\n\n');
  const hasFinActions = !!body.querySelector('.term-actions');
  if (numUp === 'FIM' || hasFinActions) {
    return { id, type: 'fin', title: title || 'Conclusão', text };
  }

  const cmdBlock = body.querySelector('.cmd-block');
  let commands = '';
  if (cmdBlock) {
    const code = cmdBlock.querySelector('code');
    if (code) commands = code.innerText.trim();
    else commands = getCmdBlockCopyText(cmdBlock) || '';
  }
  const callouts = [...body.querySelectorAll('.callout')];
  const observation = callouts.map((c) => c.innerHTML.trim()).filter(Boolean).join('\n\n');
  return { id, type: 'content', title, text, commands, observation: observation || '' };
}

function dashParseSlidesFromTrainingHtml(html) {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  if (doc.querySelector('parsererror')) return [];

  let track =
    doc.querySelector('#beginner .steps.steps-track')
    || doc.querySelector('#beginner .steps-track')
    || doc.querySelector('.tab-pane#beginner .steps-track')
    || doc.querySelector('.tab-pane#beginner .steps.steps-track');

  if (!track) {
    const beginner = doc.querySelector('#beginner') || doc.querySelector('.tab-pane#beginner');
    if (beginner) {
      track = beginner.querySelector('.steps-track') || beginner.querySelector('.steps.steps-track');
    }
  }

  if (!track) return [];

  let stepEls = [...track.children].filter(
    (el) => el.nodeType === 1 && el.classList && el.classList.contains('step'),
  );
  if (!stepEls.length) {
    stepEls = [...track.querySelectorAll('.step')];
  }

  const out = [];
  stepEls.forEach((el) => {
    const one = dashParseOneStepEl(el);
    if (one) out.push(one);
  });
  return out;
}

/** Pasta base dos ficheiros git.html, etc. (evita 404 quando o URL do dashboard não é da mesma pasta). */
function dashResolveTrainingHtmlBase() {
  const custom =
    typeof window.BUILDXP_TRAINING_PAGE_BASE === 'string' ? window.BUILDXP_TRAINING_PAGE_BASE.trim() : '';
  if (custom) return custom.replace(/\/$/, '');
  try {
    const s = document.querySelector('script[src*="main.js"]');
    if (s && s.src) return new URL('.', s.src).href.replace(/\/$/, '');
  } catch (_) {
    /* ignore */
  }
  try {
    return new URL('.', window.location.href).href.replace(/\/$/, '');
  } catch (_) {
    return '';
  }
}

async function dashFetchParsedSlidesOnly(slug) {
  if (!slug || !/^[a-z0-9][a-z0-9-]{0,47}$/.test(String(slug))) return [];
  const def = BUILDXP_INDEX_CARD_DEFS.find((d) => d.slug === slug);
  const page = def ? def.page : `${slug}.html`;
  const base = dashResolveTrainingHtmlBase();
  if (!base) return [];
  try {
    const pageUrl = new URL(page.replace(/^\//, ''), `${base}/`).href;
    const res = await fetch(pageUrl, {
      credentials: 'same-origin',
      cache: 'no-store',
    });
    if (!res.ok) return [];
    return dashParseSlidesFromTrainingHtml(await res.text());
  } catch (_) {
    return [];
  }
}

function dashReadSlidesFromLocalStorage(slug) {
  const key = dashSlidesStorageKey(slug);
  try {
    const raw = localStorage.getItem(key);
    if (!raw || raw === '[]') return [];
    const data = JSON.parse(raw);
    const slides = Array.isArray(data) ? data : data?.slides;
    if (!Array.isArray(slides) || slides.length === 0) return [];
    const normalized = slides
      .filter((s) => s && typeof s === 'object')
      .map((s) => ({
        ...s,
        id: s.id || dashNewSlideId(),
        type: ['pause', 'fin', 'content'].includes(s.type) ? s.type : 'content',
      }));
    return normalized.length ? normalized : [];
  } catch (_) {
    return [];
  }
}

/** Slides editáveis na trilha (exclui só o slide final fixo na página). */
function dashSlidesHasEditableContent(slides) {
  return Array.isArray(slides) && slides.some((s) => s && typeof s === 'object' && s.type !== 'fin');
}

/** Separa HTML guardado em `Slide.Descricao` nos campos do editor (texto / comandos / observação). */
function dashParseSlideDescricaoToEditorFields(descricao) {
  const html = String(descricao ?? '').trim();
  if (!html) return { text: '', commands: '', observation: '' };
  try {
    const doc = new DOMParser().parseFromString(`<div id="dash-parse-desc">${html}</div>`, 'text/html');
    const wrap = doc.getElementById('dash-parse-desc');
    if (!wrap) return { text: dashNormalizeSlideBoldTags(html), commands: '', observation: '' };

    const cmdBlock = wrap.querySelector('.cmd-block');
    let commands = '';
    if (cmdBlock) {
      const code = cmdBlock.querySelector('code');
      commands = (code ? code.textContent : cmdBlock.textContent).trim();
      cmdBlock.remove();
    }

    const callouts = [...wrap.querySelectorAll('.callout')];
    const observation = callouts
      .map((c) => c.innerHTML.trim())
      .filter(Boolean)
      .join('\n\n');
    callouts.forEach((c) => c.remove());

    const stepDescs = [...wrap.querySelectorAll('.step-desc')];
    let text;
    if (stepDescs.length) {
      text = stepDescs
        .map((d) => d.innerHTML.trim())
        .filter(Boolean)
        .join('\n\n');
    } else {
      text = wrap.innerHTML.trim();
    }

    return {
      text: dashNormalizeSlideBoldTags(text),
      commands,
      observation: observation ? dashNormalizeSlideBoldTags(observation) : '',
    };
  } catch (_) {
    return { text: dashNormalizeSlideBoldTags(html), commands: '', observation: '' };
  }
}

/** Converte array de slides da API para o formato do editor do dashboard. */
function dashParseApiSlidesArrayForEditor(slidesRaw) {
  if (!Array.isArray(slidesRaw) || !slidesRaw.length) return [];
  const sorted = [...slidesRaw].sort(
    (a, b) => (Number(a.ordem ?? a.Ordem) || 0) - (Number(b.ordem ?? b.Ordem) || 0),
  );
  const out = [];
  for (const s of sorted) {
    const titulo = String(s.titulo ?? s.Titulo ?? '').trim();
    const desc = String(s.descricao ?? s.Descricao ?? '');
    const up = titulo.toUpperCase();
    if (up === 'FIM' || /conclusão|conclusao/i.test(titulo)) continue;

    if (titulo === BUILDXP_SLIDE_PAUSE_TITULO) {
      const fields = dashParseSlideDescricaoToEditorFields(desc);
      out.push({
        id: dashNewSlideId(),
        type: 'pause',
        text: fields.text,
        observation: fields.observation,
      });
      continue;
    }

    const fields = dashParseSlideDescricaoToEditorFields(desc);
    out.push({
      id: dashNewSlideId(),
      type: 'content',
      title: titulo,
      text: fields.text,
      commands: fields.commands,
      observation: fields.observation,
    });
  }
  return out;
}

async function dashTryLoadSlidesFromPublicCardApi(slug) {
  try {
    const base = getBuildXpApiBase();
    const url = `${base}/api/card/${encodeURIComponent(slug)}`;
    const res = await fetch(url, {
      headers: { Accept: 'application/json' },
      cache: 'no-store',
      credentials: 'same-origin',
    });
    if (!res.ok) return [];
    const data = await res.json();
    const slidesRaw = data.slides ?? data.Slides;
    return dashParseApiSlidesArrayForEditor(slidesRaw);
  } catch (_) {
    return [];
  }
}

/**
 * Carrega slides para o editor.
 * @param {string} slug
 * @param {{ preferApi?: boolean }} [opts] — no dashboard use `preferApi: true` para não sobrescrever a BD com rascunho antigo do navegador.
 */
async function dashLoadSlidesForSlug(slug, opts = {}) {
  const preferApi = opts.preferApi === true;
  const fromApi = await dashTryLoadSlidesFromPublicCardApi(slug);
  const local = dashReadSlidesFromLocalStorage(slug);
  if (preferApi && dashSlidesHasEditableContent(fromApi)) return fromApi;
  if (dashSlidesHasEditableContent(local)) return local;
  if (dashSlidesHasEditableContent(fromApi)) return fromApi;
  return local.length ? local : fromApi;
}

function getIndexCardOrder() {
  try {
    const raw = localStorage.getItem(BUILDXP_INDEX_ORDER_KEY);
    const arr = raw ? JSON.parse(raw) : null;
    if (Array.isArray(arr) && arr.length) {
      return arr
        .filter((s) => typeof s === 'string' && s.trim())
        .map((s) => s.trim().toLowerCase());
    }
  } catch (_) { /* ignore */ }
  return [...BUILDXP_INDEX_SLUGS];
}

function setIndexCardOrder(order) {
  const next = order
    .filter((s) => typeof s === 'string' && s.trim())
    .map((s) => s.trim().toLowerCase());
  try {
    localStorage.setItem(
      BUILDXP_INDEX_ORDER_KEY,
      JSON.stringify(next.length ? next : [...BUILDXP_INDEX_SLUGS]),
    );
  } catch (_) { /* ignore */ }
}

function buildxpNormalizeHomeCardFromDto(raw) {
  const slug = String(raw.slug ?? '').trim().toLowerCase();
  if (!slug) return null;
  const published = raw.is_published ?? raw.IsPublished;
  if (published === false) return null;
  const themeRaw = String(raw.theme ?? 'git').toLowerCase();
  const theme = ['docker', 'npm', 'dotnet', 'api'].includes(themeRaw) ? themeRaw : 'git';
  const xpMax = Math.max(1, Number(raw.xp_max ?? raw.xpMax ?? 3000));
  const xpCurrent = Math.max(0, Number(raw.xp_current ?? raw.xpCurrent ?? 0));
  const border_color =
    buildxpNormalizeHexColor(raw.border_color ?? raw.BorderColor ?? raw.cor_borda) ??
    buildxpPresetHexForTheme(themeRaw);
  return {
    slug,
    theme,
    border_color,
    display_name: buildxpNormalizeCheapCodesBranding(raw.display_name ?? raw.DisplayName ?? slug),
    rarity_label: String(raw.rarity_label ?? raw.RarityLabel ?? ''),
    card_class: String(raw.card_class ?? raw.CardClass ?? ''),
    description_html: buildxpNormalizeCheapCodesBranding(
      raw.description_html ?? raw.DescriptionHtml ?? '',
    ),
    link_beginner:
      buildxpNormalizeLegacyCardListHref(
        String(raw.link_beginner ?? raw.LinkBeginner ?? '').trim(),
        slug,
        'beginner',
      ) || buildxpPublicCardHref(slug, 'beginner'),
    link_ref:
      buildxpNormalizeLegacyCardListHref(String(raw.link_ref ?? raw.LinkRef ?? '').trim(), slug, 'ref') ||
      buildxpPublicCardHref(slug, 'ref'),
    btn_primary_label: String(raw.btn_primary_label ?? raw.BtnPrimaryLabel ?? '▶ COMEÇAR'),
    btn_secondary_label: buildxpNormalizeCheapCodesBranding(
      raw.btn_secondary_label ?? raw.BtnSecondaryLabel ?? '🎮 CHEAP CODES',
    ),
    icon_layout: String(raw.icon_layout ?? raw.IconLayout ?? 'single').toLowerCase(),
    icon_primary_src: String(raw.icon_primary_src ?? raw.IconPrimarySrc ?? ''),
    icon_primary_alt: String(raw.icon_primary_alt ?? raw.IconPrimaryAlt ?? ''),
    icon_secondary_src: raw.icon_secondary_src ?? raw.IconSecondarySrc ?? '',
    icon_secondary_alt: String(raw.icon_secondary_alt ?? raw.IconSecondaryAlt ?? ''),
    xp_current: xpCurrent,
    xp_max: xpMax,
    sort_order: Number(raw.sort_order ?? raw.SortOrder ?? 0),
  };
}

function buildxpRenderIndexCardEl(c) {
  const tileTheme = c.theme === 'dotnet' ? 'dotnet' : c.theme;
  const pct = Math.min(100, Math.round((c.xp_current / c.xp_max) * 100));
  const dual =
    c.icon_layout === 'dual' && String(c.icon_secondary_src ?? '').trim();
  const primarySrc = String(c.icon_primary_src || '').trim() || 'imagens/gitlogobr.png';
  const primaryAlt = dashEscapeHtml(c.icon_primary_alt || c.display_name || c.slug);
  let iconHtml;
  if (dual) {
    const secSrc = String(c.icon_secondary_src).trim();
    const secAlt = dashEscapeHtml(c.icon_secondary_alt || '');
    iconHtml = `<div class="card-icon dual"><img class="icon-git" src="${dashEscapeHtml(primarySrc)}" alt="${primaryAlt}" /><img src="${dashEscapeHtml(secSrc)}" alt="${secAlt}" /></div>`;
  } else {
    iconHtml = `<div class="card-icon"><img src="${dashEscapeHtml(primarySrc)}" alt="${primaryAlt}" /></div>`;
  }
  const wrap = document.createElement('div');
  wrap.className = `card c-${tileTheme}`;
  wrap.dataset.cardSlug = c.slug;
  if (c.border_color) wrap.style.setProperty('--cc', c.border_color);
  wrap.innerHTML = `
    <span class="card-rarity">${dashEscapeHtml(c.rarity_label || '—')}</span>
    ${iconHtml}
    <div>
      <div class="card-class">${dashEscapeHtml(c.card_class || '')}</div>
      <div class="card-name">${dashEscapeHtml(c.display_name)}</div>
    </div>
    <div>
      <div class="xp-row"><span>XP</span><span>${dashEscapeHtml(String(c.xp_current))} / ${dashEscapeHtml(String(c.xp_max))}</span></div>
      <div class="xp-track"><div class="xp-fill" style="width:${pct}%"></div></div>
    </div>
    <div class="card-desc">${c.description_html || ''}</div>
    <div class="card-actions">
      <a href="${dashEscapeHtml(c.link_beginner)}" class="card-btn btn-primary">${dashEscapeHtml(c.btn_primary_label)}</a>
      <a href="${dashEscapeHtml(c.link_ref)}" class="card-btn btn-secondary">${dashEscapeHtml(c.btn_secondary_label)}</a>
    </div>
  `;
  return wrap;
}

async function buildxpHydrateIndexCardsFromApi() {
  const grid = document.getElementById('index-cards-grid');
  if (!grid) return;
  const base = getBuildXpApiBase();
  const url = `${base}/api/card`;
  try {
    const res = await fetch(url, {
      headers: { Accept: 'application/json' },
      cache: 'no-store',
      credentials: 'same-origin',
    });
    if (!res.ok) return;
    const arr = await res.json();
    if (!Array.isArray(arr) || !arr.length) return;
    const normalized = arr
      .map(buildxpNormalizeHomeCardFromDto)
      .filter((c) => c != null);
    if (!normalized.length) return;
    normalized.sort((a, b) => (a.sort_order - b.sort_order) || a.slug.localeCompare(b.slug));

    const existingSlugs = new Set(
      [...grid.querySelectorAll('[data-card-slug]')].map((el) => el.dataset.cardSlug),
    );
    const newNorm = normalized.filter((c) => !existingSlugs.has(c.slug));
    newNorm.forEach((c) => grid.appendChild(buildxpRenderIndexCardEl(c)));

    let order = getIndexCardOrder().filter((s) =>
      grid.querySelector(`[data-card-slug="${CSS.escape(s)}"]`),
    );
    newNorm.forEach((c) => {
      if (!order.includes(c.slug)) order.push(c.slug);
    });
    setIndexCardOrder(order);
  } catch (_) {
    /* mantém HTML estático */
  }
}

function applyIndexCardOrder() {
  const grid = document.getElementById('index-cards-grid');
  if (!grid) return;
  const nodes = {};
  grid.querySelectorAll('[data-card-slug]').forEach((el) => {
    nodes[el.dataset.cardSlug] = el;
  });
  const order = getIndexCardOrder();
  const used = new Set();
  order.forEach((slug) => {
    const n = nodes[slug];
    if (n) {
      grid.appendChild(n);
      used.add(slug);
    }
  });
  Object.keys(nodes).forEach((slug) => {
    if (!used.has(slug)) grid.appendChild(nodes[slug]);
  });
}

let indexCardsMarqueeRafId = null;
let indexMarqueeNavAbort = null;
let indexMarqueeResizeObs = null;

function stopIndexCardsMarqueeLoop() {
  if (indexCardsMarqueeRafId != null) {
    cancelAnimationFrame(indexCardsMarqueeRafId);
    indexCardsMarqueeRafId = null;
  }
}

/**
 * Marquee infinito: move o track com translateX (direita → esquerda).
 * scrollLeft falha quando a linha cabe na viewport (sem overflow); transform funciona sempre.
 */
function initIndexCardsHomeMarquee() {
  const viewport = document.getElementById('index-cards-viewport');
  const track = document.getElementById('index-cards-marquee-track');
  const grid = document.getElementById('index-cards-grid');
  const prev = document.getElementById('index-cards-strip-prev');
  const next = document.getElementById('index-cards-strip-next');
  const hoverShell = viewport?.closest('.cards-strip-viewport-shell');
  if (!viewport || !track || !grid || !prev || !next) return;

  stopIndexCardsMarqueeLoop();
  indexMarqueeNavAbort?.abort();
  indexMarqueeNavAbort = new AbortController();
  const sig = indexMarqueeNavAbort.signal;
  indexMarqueeResizeObs?.disconnect();

  track.querySelectorAll('.cards-marquee-clone').forEach((n) => n.remove());
  track.classList.remove('cards-marquee-track--animated');
  delete grid.dataset.marqueeInit;
  track.style.transform = '';

  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const cards = grid.querySelectorAll('.card');

  function scrollAmount() {
    const card = grid.querySelector('.card');
    const w = card?.offsetWidth ?? 280;
    return Math.max(220, Math.round(w + 24));
  }

  function loopHalfWidth() {
    return Math.max(1, track.scrollWidth / 2);
  }

  /** Offset horizontal do track (px); valores mais negativos = faixa anda para a esquerda. */
  let tx = 0;

  function normalizeTx() {
    const half = loopHalfWidth();
    let guard = 0;
    while (tx <= -half && guard++ < 64) tx += half;
    guard = 0;
    while (tx > 0 && guard++ < 64) tx -= half;
  }

  function applyTransform() {
    track.style.transform = `translate3d(${tx}px, 0, 0)`;
  }

  function updateNavDisabled() {
    const half = loopHalfWidth();
    const canStep = cards.length >= 2 && half > 1;
    prev.disabled = !canStep;
    next.disabled = !canStep;
  }

  if (cards.length < 2) {
    updateNavDisabled();
    return;
  }

  const clone = grid.cloneNode(true);
  clone.removeAttribute('id');
  clone.setAttribute('aria-hidden', 'true');
  clone.classList.add('cards-marquee-clone');
  track.appendChild(clone);
  grid.dataset.marqueeInit = '1';

  tx = 0;
  applyTransform();

  const desktopHoverPause = window.matchMedia('(hover: hover) and (min-width: 769px)').matches;
  let pausedByHover = false;
  let pausedByDrag = false;
  let dragPointerId = null;
  let dragStartX = 0;
  let dragStartTx = 0;
  let dragDidMove = false;
  let suppressCardClickUntil = 0;
  const dragThresholdPx = 8;

  function bindPauseHover(el) {
    el.addEventListener('mouseenter', () => { pausedByHover = true; }, { signal: sig });
    el.addEventListener('mouseleave', () => { pausedByHover = false; }, { signal: sig });
  }
  if (desktopHoverPause) {
    if (hoverShell) bindPauseHover(hoverShell);
    else bindPauseHover(viewport);
  }

  function isMarqueeInteractiveTarget(target) {
    return !!target?.closest?.(
      'a, button, input, textarea, select, label, .card-btn, .card-actions',
    );
  }

  function bindMarqueeDrag(el) {
    el.addEventListener(
      'pointerdown',
      (e) => {
        if (isMarqueeInteractiveTarget(e.target)) return;
        if (e.pointerType === 'mouse' && e.button !== 0) return;
        dragPointerId = e.pointerId;
        dragStartX = e.clientX;
        dragStartTx = tx;
        dragDidMove = false;
        el.setPointerCapture?.(e.pointerId);
      },
      { signal: sig },
    );

    el.addEventListener(
      'pointermove',
      (e) => {
        if (dragPointerId !== e.pointerId) return;
        const dx = e.clientX - dragStartX;
        if (!dragDidMove && Math.abs(dx) < dragThresholdPx) return;
        if (!dragDidMove) {
          dragDidMove = true;
          pausedByDrag = true;
          viewport.classList.add('cards-strip-viewport--dragging');
        }
        e.preventDefault();
        tx = dragStartTx + dx;
        applyTransform();
      },
      { signal: sig, passive: false },
    );

    const endDrag = (e) => {
      if (dragPointerId === null || e.pointerId !== dragPointerId) return;
      dragPointerId = null;
      pausedByDrag = false;
      viewport.classList.remove('cards-strip-viewport--dragging');
      try {
        el.releasePointerCapture(e.pointerId);
      } catch {
        /* ignore */
      }
      if (dragDidMove) {
        normalizeTx();
        applyTransform();
        suppressCardClickUntil = Date.now() + 400;
        e.preventDefault();
      }
      dragDidMove = false;
    };

    el.addEventListener('pointerup', endDrag, { signal: sig });
    el.addEventListener('pointercancel', endDrag, { signal: sig });

    el.addEventListener(
      'click',
      (e) => {
        if (isMarqueeInteractiveTarget(e.target)) return;
        if (Date.now() < suppressCardClickUntil) {
          e.preventDefault();
          e.stopPropagation();
        }
      },
      { signal: sig, capture: true },
    );
  }
  bindMarqueeDrag(viewport);
  viewport.classList.add('cards-strip-viewport--swipe');

  let lastTs = 0;
  const pxPerSec = 38;

  function tick(ts) {
    indexCardsMarqueeRafId = requestAnimationFrame(tick);
    const animate = !prefersReduced && !pausedByHover && !pausedByDrag && !document.hidden;
    if (!animate) {
      lastTs = 0;
      applyTransform();
      return;
    }
    if (!lastTs) lastTs = ts;
    const dt = Math.min(ts - lastTs, 48);
    lastTs = ts;
    const half = loopHalfWidth();
    tx -= (pxPerSec * dt) / 1000;
    while (tx <= -half) tx += half;
    applyTransform();
  }

  prev.addEventListener(
    'click',
    () => {
      tx += scrollAmount();
      normalizeTx();
      applyTransform();
      updateNavDisabled();
    },
    { signal: sig },
  );
  next.addEventListener(
    'click',
    () => {
      tx -= scrollAmount();
      normalizeTx();
      applyTransform();
      updateNavDisabled();
    },
    { signal: sig },
  );

  window.addEventListener('resize', () => {
    normalizeTx();
    applyTransform();
    updateNavDisabled();
  }, { signal: sig });

  if (typeof ResizeObserver !== 'undefined') {
    indexMarqueeResizeObs = new ResizeObserver(() => {
      normalizeTx();
      applyTransform();
      updateNavDisabled();
    });
    indexMarqueeResizeObs.observe(viewport);
    indexMarqueeResizeObs.observe(track);
  }

  indexCardsMarqueeRafId = requestAnimationFrame(tick);
  updateNavDisabled();
}
