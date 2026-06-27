// BuildXP — página cards.html (grid + pesquisa inteligente como cheap codes)

const BUILDXP_CATALOG_STOP = new Set([
  'a', 'o', 'as', 'os', 'um', 'uma', 'uns', 'umas',
  'de', 'do', 'da', 'dos', 'das', 'no', 'na', 'nos', 'nas', 'em', 'por', 'pra', 'para', 'pro', 'com', 'sem',
  'e', 'ou', 'que', 'como', 'qual', 'quais', 'quando', 'onde', 'porque', 'pq', 'se', 'ao', 'aos',
  'eu', 'voce', 'voces', 'vc', 'me', 'minha', 'meu', 'minhas', 'meus', 'seu', 'sua', 'seus', 'suas',
  'faco', 'faz', 'fazer', 'quero', 'preciso', 'posso', 'pode', 'queria', 'seria', 'tipo', 'sobre',
  'isso', 'isto', 'aquilo', 'aqui', 'ai', 'la', 'ja', 'tambem', 'tb', 'muito', 'mais', 'menos',
]);

const BUILDXP_CATALOG_SYN = {
  salvar: ['save', 'salvar', 'guardar', 'gravar', 'persistir', 'registrar'],
  apagar: ['apagar', 'remover', 'delete', 'deletar', 'excluir'],
  listar: ['listar', 'lista', 'ver', 'mostrar', 'exibir', 'ls'],
  iniciar: ['iniciar', 'inicializar', 'criar', 'novo', 'new', 'init'],
  configurar: ['configurar', 'config', 'set', 'definir'],
  branch: ['branch', 'branches', 'ramo'],
  commit: ['commit', 'commitar', 'salvar', 'registrar'],
  push: ['push', 'enviar', 'subir', 'publicar'],
  pull: ['pull', 'puxar', 'baixar', 'atualizar'],
  merge: ['merge', 'juntar', 'unir'],
  rebase: ['rebase'],
  stash: ['stash', 'guardar', 'salvar'],
  remoto: ['remote', 'remoto', 'origin', 'upstream'],
  tag: ['tag', 'marcar', 'versao', 'versão'],
  container: ['container', 'containers'],
  imagem: ['imagem', 'image', 'images'],
  build: ['build', 'buildar', 'compilar'],
  logs: ['logs', 'log'],
  compose: ['compose', 'docker-compose', 'dockercompose'],
  prisma: ['prisma', 'migrate', 'migration', 'generate', 'npx', 'schema', 'orm'],
  instalar: ['install', 'instalar', 'i', 'add'],
  atualizar: ['update', 'upgrade', 'atualizar'],
  remover: ['uninstall', 'remove', 'rm', 'remover'],
  script: ['run', 'script', 'scripts'],
  projeto: ['projeto', 'project', 'sln', 'solution', 'solucao', 'solução'],
  teste: ['test', 'teste', 'testes'],
  publicar: ['publish', 'publicar', 'deploy'],
  panda: ['panda', 'pandas'],
  pandas: ['pandas', 'panda'],
  python: ['python', 'py', 'pip'],
};

function buildxpCatalogNormField(s) {
  return String(s ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/[^a-z0-9+_.#\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function buildxpCatalogStripHtml(html) {
  try {
    const tmp = document.createElement('div');
    tmp.innerHTML = String(html ?? '');
    return tmp.textContent || tmp.innerText || '';
  } catch (_) {
    return String(html ?? '').replace(/<[^>]*>/g, ' ');
  }
}

function buildxpCatalogExpandToken(t) {
  const out = new Set([t]);
  const direct = BUILDXP_CATALOG_SYN[t];
  if (direct) direct.forEach((x) => out.add(x));
  if (t === 'salvar') ['commit', 'push', 'stash'].forEach((x) => out.add(x));
  if (t === 'branch') ['checkout', 'switch'].forEach((x) => out.add(x));
  return [...out];
}

function buildxpCatalogTokenizeQuery(query) {
  const base = buildxpCatalogNormField(query);
  if (!base) return [];
  const parts = base.split(' ').filter(Boolean);
  const tokens = parts
    .filter((w) => w.length >= 2 && !BUILDXP_CATALOG_STOP.has(w))
    .flatMap(buildxpCatalogExpandToken);
  return [...new Set(tokens)];
}

function buildxpCatalogAddChunk(chunks, cmd, desc, wCmd = 6, wDesc = 3) {
  const c = buildxpCatalogNormField(cmd);
  const d = buildxpCatalogNormField(desc);
  if (!c && !d) return;
  chunks.push({ cmd: c, desc: d, wCmd, wDesc });
}

function buildxpCatalogSearchChunks(raw) {
  const chunks = [];

  buildxpCatalogAddChunk(
    chunks,
    raw.display_name ?? raw.DisplayName,
    [
      raw.slug ?? raw.Slug,
      raw.card_class ?? raw.CardClass,
      raw.rarity_label ?? raw.RarityLabel,
      buildxpCatalogStripHtml(raw.description_html ?? raw.DescriptionHtml),
    ].join(' '),
    4,
    5,
  );

  const slides = raw.slides ?? raw.Slides ?? [];
  slides.forEach((s) => {
    buildxpCatalogAddChunk(
      chunks,
      s.titulo ?? s.Titulo,
      buildxpCatalogStripHtml(s.descricao ?? s.Descricao),
      5,
      4,
    );
    const conteudos = s.conteudos ?? s.Conteudos ?? [];
    conteudos.forEach((c) => {
      buildxpCatalogAddChunk(
        chunks,
        c.texto ?? c.Texto,
        c.descricao ?? c.Descricao,
        6,
        3,
      );
    });
  });

  const refs = raw.referencias ?? raw.Referencias ?? [];
  refs.forEach((r) => {
    buildxpCatalogAddChunk(
      chunks,
      r.comando ?? r.Comando,
      [r.categoria ?? r.Categoria, r.descricao ?? r.Descricao].filter(Boolean).join(' '),
      6,
      3,
    );
  });

  return chunks;
}

function buildxpCatalogParseCheatHtmlChunks(html) {
  const chunks = [];
  if (!html) return chunks;

  const parts = String(html).split(/<div\s+class="ref-section">/i);
  for (let i = 1; i < parts.length; i += 1) {
    const block = parts[i];
    const titleMatch = block.match(/<div\s+class="ref-section-title">([^<]*)<\/div>/i);
    const categoria = titleMatch ? titleMatch[1].trim() : '';
    const itemRx =
      /<span\s+class="cmd-text">([\s\S]*?)<\/span>\s*<span\s+class="cmd-desc">([\s\S]*?)<\/span>/gi;
    let itemMatch;
    while ((itemMatch = itemRx.exec(block)) !== null) {
      buildxpCatalogAddChunk(
        chunks,
        itemMatch[1],
        [categoria, itemMatch[2]].filter(Boolean).join(' '),
        6,
        3,
      );
    }
  }

  return chunks;
}

function buildxpCatalogCheatHtmlSlug(slug) {
  const s = String(slug ?? '').trim().toLowerCase();
  if (s === 'integrandoumaapi') return 'api';
  return s;
}

async function buildxpCatalogFetchCheatHtmlChunks(slug) {
  const fileSlug = buildxpCatalogCheatHtmlSlug(slug);
  if (!fileSlug) return [];
  try {
    const res = await fetch(`data/cheat-html/${encodeURIComponent(fileSlug)}.html`, {
      cache: 'no-store',
      credentials: 'same-origin',
    });
    if (!res.ok) return [];
    const html = await res.text();
    return buildxpCatalogParseCheatHtmlChunks(html);
  } catch (_) {
    return [];
  }
}

function buildxpCatalogScoreCard(chunks, tokens) {
  if (!tokens.length) return 1;
  let score = 0;
  for (const t of tokens) {
    if (!t) continue;
    for (const ch of chunks) {
      if (ch.cmd.includes(t)) score += ch.wCmd;
      if (ch.desc.includes(t)) score += ch.wDesc;
    }
  }
  return score;
}

function buildxpCatalogCardMatchesQuery(chunks, query) {
  const tokens = buildxpCatalogTokenizeQuery(query);
  return buildxpCatalogScoreCard(chunks, tokens) > 0;
}

async function buildxpCatalogFetchCardDetail(base, slug) {
  const url = `${base}/api/card/${encodeURIComponent(slug)}`;
  const res = await fetch(url, {
    headers: { Accept: 'application/json' },
    cache: 'no-store',
    credentials: 'same-origin',
  });
  if (!res.ok) return null;
  return res.json();
}

async function buildxpCatalogLoadPublishedCards() {
  const base = getBuildXpApiBase();
  const listRes = await fetch(`${base}/api/card`, {
    headers: { Accept: 'application/json' },
    cache: 'no-store',
    credentials: 'same-origin',
  });
  if (!listRes.ok) throw new Error('list');
  const list = await listRes.json();
  if (!Array.isArray(list) || !list.length) return [];

  const slugs = list
    .map((c) => String(c.slug ?? c.Slug ?? '').trim().toLowerCase())
    .filter(Boolean);

  const loaded = await Promise.all(
    slugs.map(async (slug) => {
      const [raw, cheatChunks] = await Promise.all([
        buildxpCatalogFetchCardDetail(base, slug),
        buildxpCatalogFetchCheatHtmlChunks(slug),
      ]);
      if (!raw) return null;

      const norm = buildxpNormalizeHomeCardFromDto(raw);
      if (!norm) return null;

      const chunks = buildxpCatalogSearchChunks(raw);
      cheatChunks.forEach((ch) => chunks.push(ch));

      return { norm, chunks };
    }),
  );

  return loaded
    .filter((x) => x != null)
    .sort(
      (a, b) =>
        (a.norm.sort_order - b.norm.sort_order) ||
        a.norm.slug.localeCompare(b.norm.slug),
    );
}

function buildxpCatalogSetStatus(statusEl, query, visible, total) {
  if (!statusEl) return;
  const q = String(query ?? '').trim();
  if (!total) {
    statusEl.textContent = 'Nenhum card publicado no momento.';
    return;
  }
  if (!q) {
    statusEl.textContent = `${total} card${total === 1 ? '' : 's'}`;
    return;
  }
  if (!visible) {
    statusEl.textContent = `Nenhum card encontrado para «${q}».`;
    return;
  }
  statusEl.textContent = `${visible} de ${total} card${total === 1 ? '' : 's'}`;
}

function buildxpCatalogApplyFilter(entries, query, grid, statusEl, emptyEl) {
  const q = String(query ?? '').trim();
  let visible = 0;

  entries.forEach(({ el, chunks }) => {
    const show = !q || buildxpCatalogCardMatchesQuery(chunks, q);
    el.classList.toggle('cards-catalog-card--hidden', !show);
    if (show) {
      el.removeAttribute('hidden');
      visible += 1;
    } else {
      el.hidden = true;
    }
  });

  buildxpCatalogSetStatus(statusEl, q, visible, entries.length);

  if (grid) {
    grid.classList.toggle('cards-catalog-grid--filtered', Boolean(q));
    grid.classList.toggle('cards-catalog-grid--empty', Boolean(q) && visible === 0);
  }
  if (emptyEl) emptyEl.hidden = !(Boolean(q) && visible === 0);
}

async function buildxpInitCardsCatalogPage() {
  const grid = document.getElementById('cards-catalog-grid');
  if (!grid) return;

  const searchInput = document.getElementById('cards-catalog-search');
  const statusEl = document.getElementById('cards-catalog-status');
  const emptyEl = document.getElementById('cards-catalog-empty');

  grid.innerHTML =
    '<p class="cards-catalog-loading" aria-live="polite">Carregando cards…</p>';

  let entries = [];

  try {
    const loaded = await buildxpCatalogLoadPublishedCards();
    grid.innerHTML = '';
    entries = loaded.map(({ norm, chunks }) => {
      const el = buildxpRenderIndexCardEl(norm);
      el.dataset.catalogSlug = norm.slug;
      grid.appendChild(el);
      return { el, chunks };
    });
  } catch (_) {
    grid.innerHTML =
      '<p class="cards-catalog-loading cards-catalog-loading--error">Não foi possível carregar os cards. Tente recarregar a página.</p>';
    buildxpCatalogSetStatus(statusEl, '', 0, 0);
    return;
  }

  if (!entries.length) {
    grid.classList.add('cards-catalog-grid--empty');
    if (emptyEl) emptyEl.hidden = false;
    buildxpCatalogSetStatus(statusEl, '', 0, 0);
    return;
  }

  if (emptyEl) emptyEl.hidden = true;

  const applyNow = () =>
    buildxpCatalogApplyFilter(entries, searchInput?.value ?? '', grid, statusEl, emptyEl);

  applyNow();

  if (!searchInput) return;

  let debounceId = null;
  const onSearch = () => {
    if (debounceId != null) clearTimeout(debounceId);
    debounceId = setTimeout(() => {
      debounceId = null;
      applyNow();
    }, 120);
  };

  searchInput.addEventListener('input', onSearch);
  searchInput.addEventListener('search', onSearch);
  searchInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (debounceId != null) clearTimeout(debounceId);
      applyNow();
    }
  });
}

window.buildxpInitCardsCatalogPage = buildxpInitCardsCatalogPage;
