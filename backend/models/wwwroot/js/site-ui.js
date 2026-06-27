// BuildXP - site-ui
// ============================================================
//  BuildXP — main.js
// ============================================================

/* ── COPY TO CLIPBOARD ──────────────────────────────────────*/
function doCopy(btn, text, label) {
  navigator.clipboard.writeText(text.trim()).then(() => {
    btn.textContent = '✓ ok';
    btn.classList.add('copied');
    setTimeout(() => { btn.textContent = label; btn.classList.remove('copied'); }, 2000);
  }).catch(() => {
    // Fallback for older browsers
    const ta = document.createElement('textarea');
    ta.value = text.trim();
    document.body.appendChild(ta); ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
    btn.textContent = '✓ ok'; btn.classList.add('copied');
    setTimeout(() => { btn.textContent = label; btn.classList.remove('copied'); }, 2000);
  });
}

function getCmdBlockCopyText(block) {
  const linesRoot = block.querySelector('.cmd-lines');
  if (!linesRoot) {
    const code = block.querySelector('code');
    return code ? code.innerText : '';
  }
  const rows = [];
  linesRoot.querySelectorAll('.cmd-line').forEach((line) => {
    if (line.classList.contains('cmd-line-full')) {
      rows.push(line.textContent.trimEnd());
      return;
    }
    if (line.classList.contains('cmd-line-single')) {
      const main = line.querySelector('.cmd-part');
      if (main) rows.push(main.textContent.trimEnd());
      return;
    }
    const main = line.querySelector('.cmd-part');
    const note = line.querySelector('.cmd-note');
    const m = main ? main.textContent.trimEnd() : '';
    const n = note ? note.textContent.trim() : '';
    if (m && n) rows.push(`${m} ${n}`);
    else if (m) rows.push(m);
    else if (n) rows.push(n);
  });
  return rows.join('\n');
}

function initCopy() {
  document.querySelectorAll('.copy-btn:not([data-bxp-copy-init])').forEach((btn) => {
    btn.setAttribute('data-bxp-copy-init', '1');
    btn.addEventListener('click', () => {
      const block = btn.closest('.cmd-block');
      const code = getCmdBlockCopyText(block);
      doCopy(btn, code, 'copy');
    });
  });
  document.querySelectorAll('.cmd-copy:not([data-bxp-copy-init])').forEach((btn) => {
    btn.setAttribute('data-bxp-copy-init', '1');
    btn.addEventListener('click', () => {
      const code = btn.closest('.cmd-item').querySelector('.cmd-text').innerText;
      doCopy(btn, code, 'copy');
    });
  });
}

/* ── SLIDER (Beginner steps) ────────────────────────────────*/
function initStepsSlider() {
  document.querySelectorAll('[data-steps-slider]').forEach(root => {
    if (root.dataset.stepsSliderInit === '1') return;
    root.dataset.stepsSliderInit = '1';

    const track = root.querySelector('.steps-track');
    const prev = root.querySelector('[data-slide-prev]');
    const next = root.querySelector('[data-slide-next]');
    if (!track || !prev || !next) return;

    /** Desktop: setas + clique no índice. Mobile: arrastar o trilho ou clique no índice. Sem autoplay. */
    const isDesktopSteps = window.matchMedia('(hover: hover) and (min-width: 769px)').matches;
    const stepEls = () => [...track.querySelectorAll('.step')];
    let indexItems = [];
    let indexButtons = [];

    function getIndexMount() {
      return root.querySelector('[data-steps-index]') ?? null;
    }

    function scrollToStep(el) {
      if (!el) return;
      track.scrollTo({ left: el.offsetLeft, behavior: 'smooth' });
    }

    function stepIndexFromScroll() {
      const center = track.scrollLeft + track.clientWidth * 0.5;
      const steps = stepEls();
      let bestIdx = 0;
      let bestDist = Infinity;
      steps.forEach((el, idx) => {
        const mid = el.offsetLeft + el.clientWidth * 0.5;
        const d = Math.abs(mid - center);
        if (d < bestDist) {
          bestDist = d;
          bestIdx = idx;
        }
      });
      return bestIdx;
    }

    function indexFromScroll() {
      const activeStep = stepEls()[stepIndexFromScroll()];
      if (!activeStep || !indexItems.length) return 0;
      const found = indexItems.findIndex((it) => it.el === activeStep);
      return found >= 0 ? found : 0;
    }

    function setActiveIndex(bestIdx) {
      indexButtons.forEach((b, i) => {
        b.classList.toggle('active', i === bestIdx);
      });
    }

    function syncIndexForStep(el) {
      if (!indexItems.length) return;
      const idx = indexItems.findIndex((it) => it.el === el);
      if (idx >= 0) setActiveIndex(idx);
      else indexButtons.forEach((b) => b.classList.remove('active'));
    }

    function goToIndex(idx) {
      const it = indexItems[idx];
      if (!it) return;
      scrollToStep(it.el);
      setActiveIndex(idx);
    }

    function goToStepIndex(idx) {
      const steps = stepEls();
      if (!steps.length) return;
      const next = Math.max(0, Math.min(steps.length - 1, idx));
      const el = steps[next];
      scrollToStep(el);
      syncIndexForStep(el);
    }

    /** Altura do trilho = slide mais central (evita espaço vazio até o índice em slides curtos) */
    let trackHeightRaf = null;
    function syncTrackHeight() {
      const items = stepEls();
      if (!items.length) return;
      if (track.clientWidth <= 0) return;
      const center = track.scrollLeft + track.clientWidth * 0.5;
      let bestEl = items[0];
      let bestDist = Infinity;
      items.forEach((el) => {
        const mid = el.offsetLeft + el.clientWidth * 0.5;
        const d = Math.abs(mid - center);
        if (d < bestDist) {
          bestDist = d;
          bestEl = el;
        }
      });
      const padBottom = parseFloat(getComputedStyle(track).paddingBottom) || 0;
      const h = Math.max(0, Math.ceil(bestEl.offsetHeight + padBottom));
      track.style.minHeight = '0';
      track.style.height = `${h}px`;
    }

    function scheduleSyncTrackHeight() {
      if (trackHeightRaf !== null) cancelAnimationFrame(trackHeightRaf);
      trackHeightRaf = requestAnimationFrame(() => {
        syncTrackHeight();
        trackHeightRaf = null;
      });
    }

    function buildIndex() {
      const mount = getIndexMount();
      if (!mount) return;
      if (mount.dataset.built === '1') return;
      mount.dataset.built = '1';

      let pauseCount = 0;
      indexItems = stepEls()
        .map((el) => {
          if (el.classList.contains('step--fim')) return null;

          if (el.classList.contains('step-pause')) {
            pauseCount += 1;
            const sub = el.querySelector('.step-title')?.textContent?.trim() ?? '';
            return {
              el,
              num: '⏸',
              title: sub ? `PAUSA — ${sub}` : `PAUSA ${pauseCount}`,
            };
          }

          const numRaw = el.querySelector('.step-num')?.textContent?.trim() ?? '';
          const title = el.querySelector('.step-title')?.textContent?.trim() ?? '';
          const n = Number.parseInt(numRaw, 10);
          if (!Number.isFinite(n) || !title) return null;
          return { el, num: String(n).padStart(2, '0'), title };
        })
        .filter(Boolean);

      if (!indexItems.length) return;

      mount.innerHTML = `
        <div class="steps-index-title">Índice do card</div>
        <div class="steps-index-list" role="list"></div>
      `;

      const list = mount.querySelector('.steps-index-list');
      indexButtons = indexItems.map((it, idx) => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'steps-index-item';
        btn.setAttribute('role', 'listitem');
        btn.textContent = `${it.num} — ${it.title}`;
        btn.addEventListener('mousedown', (e) => e.preventDefault());
        btn.addEventListener('click', () => goToIndex(idx));
        list.appendChild(btn);
        return btn;
      });

      setActiveIndex(0);
      scheduleSyncTrackHeight();
    }

    function updateButtons() {
      const steps = stepEls();
      if (!steps.length) {
        prev.disabled = true;
        next.disabled = true;
        return;
      }
      const cur = stepIndexFromScroll();
      prev.disabled = cur <= 0;
      next.disabled = cur >= steps.length - 1;
    }

    prev.addEventListener('click', () => {
      goToStepIndex(stepIndexFromScroll() - 1);
      updateButtons();
    });
    next.addEventListener('click', () => {
      goToStepIndex(stepIndexFromScroll() + 1);
      updateButtons();
    });

    root.querySelectorAll('[data-steps-restart]').forEach(btn => {
      btn.addEventListener('click', () => {
        track.scrollTo({ left: 0, behavior: 'smooth' });
        setActiveIndex(0);
        updateButtons();
      });
    });

    track.addEventListener('scroll', () => {
      scheduleSyncTrackHeight();
      if (!isDesktopSteps) updateButtons();
    }, { passive: true });

    if (isDesktopSteps) {
      track.classList.add('steps-track--click-nav');
      track.addEventListener(
        'wheel',
        (e) => {
          if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) e.preventDefault();
        },
        { passive: false },
      );
    } else {
      track.classList.add('steps-track--touch-nav');
      track.addEventListener(
        'scrollend',
        () => {
          syncIndexForStep(stepEls()[stepIndexFromScroll()]);
          updateButtons();
        },
        { passive: true },
      );
    }

    window.addEventListener('resize', () => {
      scheduleSyncTrackHeight();
      updateButtons();
    });

    updateButtons();
    buildIndex();
    scheduleSyncTrackHeight();
    window.addEventListener('load', () => scheduleSyncTrackHeight(), { once: true });

    if (typeof ResizeObserver !== 'undefined') {
      const ro = new ResizeObserver(() => scheduleSyncTrackHeight());
      ro.observe(track);
    }

    track.addEventListener('scrollend', () => scheduleSyncTrackHeight(), { passive: true });
  });
}

/* ── TAB SWITCHING ──────────────────────────────────────────*/
function initTabs() {
  const tabs  = document.querySelectorAll('.tab-btn');
  const panes = document.querySelectorAll('.tab-pane');
  if (!tabs.length) return;

  function activateTab(id) {
    tabs.forEach(t  => t.classList.toggle('active', t.dataset.tab === id));
    panes.forEach(p => p.classList.toggle('active', p.id === id));
    if (id === 'beginner') {
      requestAnimationFrame(() => window.dispatchEvent(new Event('resize')));
    }
  }

  tabs.forEach(tab => tab.addEventListener('click', () => activateTab(tab.dataset.tab)));

  // URL param: ?tab=ref  → opens reference tab
  const param = new URLSearchParams(window.location.search).get('tab');
  activateTab(param === 'ref' ? 'ref' : 'beginner');
}

/* ── SEARCH / FILTER (Reference pages) ─────────────────────*/
function initSearch() {
  const search = document.getElementById('ref-search');
  if (!search) return;

  const norm = (s) =>
    String(s ?? '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim();

  const STOP = new Set([
    'a','o','as','os','um','uma','uns','umas',
    'de','do','da','dos','das','no','na','nos','nas','em','por','pra','para','pro','com','sem',
    'e','ou','que','como','qual','quais','quando','onde','porque','pq','se','ao','aos',
    'eu','voce','voces','vc','me','minha','meu','minhas','meus','seu','sua','seus','suas',
    'faco','faz','fazer','quero','preciso','posso','pode','queria','seria','tipo','sobre',
    'isso','isto','aquilo','aqui','ai','la','já','ja','tambem','tb','muito','mais','menos'
  ]);

  // Lightweight keyword expansion to better match natural language queries.
  // Keep this intentionally small: it should help, not overwhelm results.
  const SYN = {
    // generic
    salvar: ['save','salvar','guardar','gravar','persistir','registrar'],
    apagar: ['apagar','remover','delete','deletar','excluir'],
    listar: ['listar','lista','ver','mostrar','exibir','ls'],
    iniciar: ['iniciar','inicializar','criar','novo','new','init'],
    configurar: ['configurar','config','set','definir'],

    // git-ish
    branch: ['branch','branches','ramo'],
    commit: ['commit','commitar','salvar','registrar'],
    push: ['push','enviar','subir','publicar'],
    pull: ['pull','puxar','baixar','atualizar'],
    merge: ['merge','juntar','unir'],
    rebase: ['rebase'],
    stash: ['stash','guardar','salvar'],
    remoto: ['remote','remoto','origin','upstream'],
    tag: ['tag','marcar','versao','versão'],

    // docker-ish
    container: ['container','containers'],
    imagem: ['imagem','image','images'],
    build: ['build','buildar','compilar'],
    logs: ['logs','log'],
    compose: ['compose','docker-compose','dockercompose'],

    // npm-ish
    prisma: ['prisma','migrate','migration','generate','npx','schema','orm'],
    instalar: ['install','instalar','i','add'],
    atualizar: ['update','upgrade','atualizar'],
    remover: ['uninstall','remove','rm','remover'],
    script: ['run','script','scripts'],

    // dotnet-ish
    projeto: ['projeto','project','sln','solution','solucao','solução'],
    teste: ['test','teste','testes'],
    publicar: ['publish','publicar','deploy'],
  };

  const expandToken = (t) => {
    const out = new Set([t]);
    const direct = SYN[t];
    if (direct) direct.forEach(x => out.add(x));

    // Special intents (multi-word-ish) derived from a single token
    if (t === 'salvar') {
      ['commit','push','stash'].forEach(x => out.add(x));
    }
    if (t === 'branch') {
      ['checkout','switch'].forEach(x => out.add(x));
    }
    return [...out];
  };

  const tokenize = (q) => {
    const base = norm(q)
      .replace(/[^a-z0-9+_.#\s-]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    if (!base) return [];
    const parts = base.split(' ').filter(Boolean);
    const tokens = parts
      .filter(w => w.length >= 2 && !STOP.has(w))
      .flatMap(expandToken);
    return [...new Set(tokens)];
  };

  const items = [...document.querySelectorAll('.cmd-item')].map(el => {
    const cmdRaw = el.querySelector('.cmd-text')?.textContent ?? '';
    const descRaw = el.querySelector('.cmd-desc')?.textContent ?? '';
    return {
      el,
      cmd: norm(cmdRaw),
      desc: norm(descRaw),
    };
  });

  const scoreItem = (it, tokens) => {
    if (!tokens.length) return 1;
    let score = 0;
    for (const t of tokens) {
      if (!t) continue;
      if (it.cmd.includes(t)) score += 6;
      if (it.desc.includes(t)) score += 3;
    }
    return score;
  };

  const syncRefEmpty = () => {
    const emptyEl = document.getElementById('ref-empty');
    if (!emptyEl) return;
    const root = emptyEl.closest('#ref') ?? document.getElementById('ref');
    if (!root) return;
    const total = root.querySelectorAll('.cmd-item').length;
    if (total === 0) {
      emptyEl.hidden = false;
      return;
    }
    const anyShown = [...root.querySelectorAll('.cmd-item')].some((el) => el.style.display !== 'none');
    emptyEl.hidden = anyShown;
  };

  const apply = () => {
    const tokens = tokenize(search.value);
    items.forEach(it => {
      const s = scoreItem(it, tokens);
      it.el.style.display = s > 0 ? '' : 'none';
    });
    // Hide empty section titles
    document.querySelectorAll('.ref-section').forEach(sec => {
      const visible = [...sec.querySelectorAll('.cmd-item')].some(i => i.style.display !== 'none');
      sec.style.display = visible ? '' : 'none';
    });
    syncRefEmpty();
  };

  search.addEventListener('input', apply);
  apply();
}

/* ── MOBILE MENU ────────────────────────────────────────────*/
function initMenu() {
  const btn   = document.getElementById('hamburger');
  const links = document.getElementById('nav-links');
  if (!btn) return;
  btn.addEventListener('click', () => links.classList.toggle('open'));
  links.querySelectorAll('a').forEach(a => a.addEventListener('click', () => links.classList.remove('open')));
}

/* ── SMOOTH SCROLL ──────────────────────────────────────────*/
function initScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      const target = document.querySelector(a.getAttribute('href'));
      if (target) { e.preventDefault(); target.scrollIntoView({ behavior:'smooth' }); }
    });
  });
}
