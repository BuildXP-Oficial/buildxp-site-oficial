// BuildXP — página README Lab (editor markdown + auth leve)
(function () {
  const TOKEN_KEY = 'buildxp_md_token';
  const GUEST_KEY = 'buildxp_md_guest';
  const XP_README_WORDS = 100;
  const XP_README_HEADINGS = 3;

  const SNIPPETS = {
    h1: '# Título\n',
    h2: '## Subtítulo\n',
    h3: '### Seção\n',
    h4: '#### Item\n',
    h5: '##### Detalhe\n',
    h6: '###### Nota\n',
    bold: '**negrito**',
    italic: '*itálico*',
    boldItalic: '***destaque***',
    codeInline: '`código`',
    codeBlock: '```\nseu código aqui\n```\n',
    ul: '- item\n- item\n',
    ol: '1. primeiro\n2. segundo\n',
    check: '- [ ] pendente\n- [x] feito\n',
    quote: '> citação\n',
    hr: '\n---\n\n',
    link: '[texto do link](https://exemplo.com)\n',
    image: '![{voce pode mudar esse titulo}](inserir URL aqui)\n',
    gif: '![{voce pode mudar esse titulo}](inserir URL aqui)\n',
    table:
      '| Coluna A | Coluna B |\n| --- | --- |\n| valor | valor |\n',
    alertNote: '> [!NOTE]\n> Informação útil para o leitor.\n',
    alertTip: '> [!TIP]\n> Dica prática.\n',
    alertImportant: '> [!IMPORTANT]\n> Ponto importante.\n',
    alertWarning: '> [!WARNING]\n> Atenção com isto.\n',
    alertCaution: '> [!CAUTION]\n> Risco / cuidado.\n',
  };

  const TUTORIAL_STEPS = [
    {
      snip: 'h1',
      badge: 'H1',
      title: 'Título principal',
      body: 'Cria o título grande da tua apresentação — o nome ou o headline que aparece no topo do README.',
      example: '# Olá, eu sou Maria',
    },
    {
      snip: 'h2',
      badge: 'H2',
      title: 'Subtítulo',
      body: 'Secções principais da página: Sobre mim, Tech, Projetos, Contato…',
      example: '## Sobre mim',
    },
    {
      snip: 'h3',
      badge: 'H3',
      title: 'Subsecção',
      body: 'Divide uma secção em partes menores, por exemplo “Em órbita agora” dentro de Projetos.',
      example: '### Em órbita agora',
    },
    {
      snip: 'h4',
      badge: 'H4',
      title: 'Título nível 4',
      body: 'Mais um nível de hierarquia, útil para detalhar um projeto ou skill.',
      example: '#### BuildXP',
    },
    {
      snip: 'h5',
      badge: 'H5',
      title: 'Título nível 5',
      body: 'Título pequeno — raro, mas disponível se precisares de muita estrutura.',
      example: '##### Detalhe',
    },
    {
      snip: 'h6',
      badge: 'H6',
      title: 'Título nível 6',
      body: 'O título mais discreto. Serve para notas mínimas dentro de uma secção.',
      example: '###### Nota',
    },
    {
      snip: 'bold',
      badge: 'B',
      title: 'Negrito',
      body: 'Destaca palavras importantes no texto.',
      example: '**BuildXP**',
    },
    {
      snip: 'italic',
      badge: 'I',
      title: 'Itálico',
      body: 'Enfase suave — nomes, termos ou frases laterais.',
      example: '*em construção*',
    },
    {
      snip: 'boldItalic',
      badge: 'BI',
      title: 'Negrito + itálico',
      body: 'Combina os dois para um destaque ainda mais forte.',
      example: '***destaque***',
    },
    {
      snip: 'codeInline',
      badge: '</>',
      title: 'Código inline',
      body: 'Marca tecnologias, comandos ou badges curtas no meio da frase.',
      example: '`C#` `ASP.NET`',
    },
    {
      snip: 'codeBlock',
      badge: '```',
      title: 'Bloco de código',
      body: 'Caixa multi-linha — perfeita para ASCII art, banners ou trechos maiores.',
      example: '```txt\n╔══ NOME: … ══╗\n```',
    },
    {
      snip: 'ul',
      badge: '• Lista',
      title: 'Lista com bullets',
      body: 'Lista skills, interesses, equipamentos ou qualquer conjunto de itens.',
      example: '- Curiosidade\n- Voluntária em missões web',
    },
    {
      snip: 'ol',
      badge: '1. Lista',
      title: 'Lista numerada',
      body: 'Passos em ordem: missões, roadmap, próximos passos.',
      example: '1. Aprender .NET\n2. Publicar o BuildXP',
    },
    {
      snip: 'check',
      badge: '☑',
      title: 'Checklist',
      body: 'Tarefas com caixas — o que já fizeste e o que ainda falta.',
      example: '- [x] Conta GitHub\n- [ ] Profile README',
    },
    {
      snip: 'quote',
      badge: '”',
      title: 'Citação',
      body: 'Bloco de citação — ótimo para a tua missão, bio curta ou frase de impacto.',
      example: '> Rumo à Constelação Back-end',
    },
    {
      snip: 'hr',
      badge: '―',
      title: 'Linha divisória',
      body: 'Separa visualmente as partes do README (como os --- do profile).',
      example: '---',
    },
    {
      snip: 'table',
      badge: 'Tabela',
      title: 'Tabela',
      body: 'Organiza tech stack, stats ou coordenadas em colunas.',
      example: '| Front | Back |\n| --- | --- |\n| JS | C# |',
    },
    {
      snip: 'link',
      badge: 'Link',
      title: 'Link',
      body: 'Liga para LinkedIn, portfolio, repos ou qualquer URL.',
      example: '[LinkedIn](https://linkedin.com/in/…)',
    },
    {
      snip: 'image',
      badge: 'IMG',
      title: 'Imagem',
      body: 'Insere o molde de imagem. Troca o título entre {} e cola o URL (opções em baixo na página).',
      example: '![{voce pode mudar esse titulo}](inserir URL aqui)',
    },
    {
      snip: 'gif',
      badge: 'GIF',
      title: 'GIF',
      body: 'Igual à imagem, mas pensado para GIFs animados (Giphy, Tenor, etc.).',
      example: '![{voce pode mudar esse titulo}](inserir URL aqui)',
    },
    {
      snip: 'help-media',
      badge: '?',
      title: 'Dicas de URL',
      body: 'Leva-te à zona “Onde pegar URLs” — Giphy, Tenor, skillicons, shields e mais.',
      example: '',
    },
    {
      snip: 'alertNote',
      badge: 'NOTE',
      title: 'Alerta NOTE',
      body: 'Caixa de nota do GitHub — informação útil para quem lê o teu perfil.',
      example: '> [!NOTE]\n> Informação útil.',
    },
    {
      snip: 'alertTip',
      badge: 'TIP',
      title: 'Alerta TIP',
      body: 'Caixa de dica — truques ou sugestões para quem visita o README.',
      example: '> [!TIP]\n> Dica prática.',
    },
    {
      snip: 'alertImportant',
      badge: 'IMP',
      title: 'Alerta IMPORTANT',
      body: 'Destaca algo que não pode passar despercebido.',
      example: '> [!IMPORTANT]\n> Ponto importante.',
    },
    {
      snip: 'alertWarning',
      badge: 'WARN',
      title: 'Alerta WARNING',
      body: 'Aviso — atenção a algo sensível ou em mudança.',
      example: '> [!WARNING]\n> Atenção.',
    },
    {
      snip: 'alertCaution',
      badge: 'CAUT',
      title: 'Alerta CAUTION',
      body: 'Cuidado / risco — o alerta mais forte do GitHub.',
      example: '> [!CAUTION]\n> Cuidado.',
    },
  ];

  let state = {
    mode: null, // 'guest' | 'auth'
    token: '',
    usuario: '',
    nome: '',
    dirty: false,
    saving: false,
  };

  let tutorialIndex = 0;
  let tutorialBound = false;
  let tutorialRepositionBound = false;
  let tutorialPlaceTimer = 0;
  let tutorialPlacing = false;
  /** Em modo sem guardar: fecha só nesta visita; na próxima entrada o guia volta. */
  let tutorialDismissedThisVisit = false;

  function apiBase() {
    return typeof getBuildXpApiBase === 'function'
      ? String(getBuildXpApiBase()).replace(/\/$/, '')
      : '';
  }

  function el(id) {
    return document.getElementById(id);
  }

  function setStatus(msg, kind) {
    const box = el('md-status');
    if (!box) return;
    box.textContent = msg || '';
    box.className = 'md-status' + (kind ? ` md-status--${kind}` : '');
  }

  function wordCount(text) {
    return String(text || '')
      .trim()
      .split(/\s+/)
      .filter(Boolean).length;
  }

  function headingCount(text) {
    let n = 0;
    for (const line of String(text || '').replace(/\r\n/g, '\n').split('\n')) {
      const m = line.trimStart().match(/^#{1,6}\s+\S/);
      if (m) n += 1;
    }
    return n;
  }

  function insertAtCursor(textarea, snippet) {
    const start = textarea.selectionStart ?? textarea.value.length;
    const end = textarea.selectionEnd ?? start;
    const before = textarea.value.slice(0, start);
    const after = textarea.value.slice(end);
    textarea.value = before + snippet + after;
    const caret = start + snippet.length;
    textarea.focus();
    textarea.setSelectionRange(caret, caret);
    textarea.dispatchEvent(new Event('input', { bubbles: true }));
  }

  function clearTutorialFocus() {
    document.querySelectorAll('.md-tool.md-tool--tour-focus').forEach((b) => {
      b.classList.remove('md-tool--tour-focus');
    });
  }

  function isMobileTutorial() {
    return window.matchMedia('(max-width: 900px)').matches;
  }

  function navOffset() {
    const nav = document.querySelector('.navbar');
    return (nav?.getBoundingClientRect().height || 62) + 8;
  }

  function applySpotlightRect(tool) {
    const spot = el('md-tutorial-spotlight');
    if (!spot || !tool) return;
    const r = tool.getBoundingClientRect();
    if (r.width < 2 || r.height < 2) {
      spot.style.display = 'none';
      return;
    }
    const pad = 5;
    spot.style.display = '';
    spot.style.top = `${r.top - pad}px`;
    spot.style.left = `${r.left - pad}px`;
    spot.style.width = `${r.width + pad * 2}px`;
    spot.style.height = `${r.height + pad * 2}px`;
  }

  function clamp(n, min, max) {
    return Math.min(max, Math.max(min, n));
  }

  /** Cartão acompanha o botão: abaixo, acima ou ao lado — sem cobrir o botão. */
  function placeTutorialCardNear(tool) {
    const card = el('md-tutorial-card');
    const pin = el('md-tutorial-pin');
    if (!card) return;

    const mobile = isMobileTutorial();
    document.body.classList.toggle('md-tutorial-mobile', mobile);
    const margin = 12;
    const gap = 14;

    if (mobile) {
      card.classList.add('md-tutorial-card--sheet');
      card.style.top = '';
      card.style.left = '12px';
      card.style.right = '12px';
      card.style.bottom = 'max(12px, env(safe-area-inset-bottom))';
      card.style.width = 'auto';
      card.style.transform = 'none';
      if (pin) pin.textContent = '↑ Botão destacado na toolbar';
      return;
    }

    card.classList.remove('md-tutorial-card--sheet');
    card.style.bottom = '';
    card.style.right = '';
    card.style.transform = 'none';

    const cardW = Math.min(400, window.innerWidth - margin * 2);
    card.style.width = `${cardW}px`;

    if (!tool) {
      card.style.left = `${(window.innerWidth - cardW) / 2}px`;
      card.style.top = `${navOffset() + 72}px`;
      if (pin) pin.textContent = 'Botão da toolbar';
      return;
    }

    const r = tool.getBoundingClientRect();
    const cardH = Math.min(card.offsetHeight || 300, window.innerHeight * 0.7);
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const centerLeft = clamp(r.left + r.width / 2 - cardW / 2, margin, vw - cardW - margin);

    const options = [
      {
        top: r.bottom + gap,
        left: centerLeft,
        pin: '↑ Este botão na toolbar',
        ok: r.bottom + gap + cardH <= vh - margin,
        score: 100,
      },
      {
        top: r.top - gap - cardH,
        left: centerLeft,
        pin: '↓ Este botão na toolbar',
        ok: r.top - gap - cardH >= margin,
        score: 90,
      },
      {
        top: clamp(r.top + r.height / 2 - cardH / 2, margin, vh - cardH - margin),
        left: r.right + gap,
        pin: '← Este botão na toolbar',
        ok: r.right + gap + cardW <= vw - margin,
        score: 80,
      },
      {
        top: clamp(r.top + r.height / 2 - cardH / 2, margin, vh - cardH - margin),
        left: r.left - gap - cardW,
        pin: 'Este botão na toolbar →',
        ok: r.left - gap - cardW >= margin,
        score: 70,
      },
    ];

    const fit = options.filter((o) => o.ok).sort((a, b) => b.score - a.score)[0];
    const best = fit || options[0];
    card.style.top = `${clamp(best.top, margin, Math.max(margin, vh - cardH - margin))}px`;
    card.style.left = `${clamp(best.left, margin, Math.max(margin, vw - cardW - margin))}px`;
    if (pin) pin.textContent = best.pin;
  }

  function positionTutorialAround(tool, opts) {
    const allowScroll = !opts || opts.scroll !== false;
    const spot = el('md-tutorial-spotlight');
    const card = el('md-tutorial-card');
    if (!spot || !card) return;

    if (!tool) {
      spot.style.display = 'none';
      placeTutorialCardNear(null);
      return;
    }

    const finish = () => {
      applySpotlightRect(tool);
      placeTutorialCardNear(tool);
      // Remedeia altura real do cartão e reposiciona uma vez
      requestAnimationFrame(() => placeTutorialCardNear(tool));
    };

    if (allowScroll && !tutorialPlacing) {
      tutorialPlacing = true;
      const bar = document.querySelector('.md-toolbar-bar');
      if (bar) {
        bar.scrollIntoView({ block: 'start', behavior: 'auto' });
        window.scrollBy(0, -navOffset());
      }
      tool.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'auto' });
      const r0 = tool.getBoundingClientRect();
      const topNeed = navOffset() + 4;
      if (r0.top < topNeed) {
        window.scrollTo({
          top: Math.max(0, window.scrollY + r0.top - topNeed - 6),
          behavior: 'auto',
        });
      }
      window.setTimeout(() => {
        finish();
        tutorialPlacing = false;
      }, 50);
    } else {
      finish();
    }
  }

  function setTutorialNavButtons() {
    const total = TUTORIAL_STEPS.length;
    const isFirst = tutorialIndex <= 0;
    const isLast = tutorialIndex >= total - 1;
    const prevBtn = el('md-tutorial-prev');
    const nextBtn = el('md-tutorial-next');
    const doneBtn = el('md-tutorial-done');

    if (prevBtn) {
      if (isFirst) prevBtn.setAttribute('hidden', '');
      else prevBtn.removeAttribute('hidden');
    }
    if (nextBtn) {
      if (isLast) nextBtn.setAttribute('hidden', '');
      else nextBtn.removeAttribute('hidden');
    }
    if (doneBtn) {
      if (isLast) doneBtn.removeAttribute('hidden');
      else doneBtn.setAttribute('hidden', '');
    }
  }

  function renderTutorialStep() {
    const step = TUTORIAL_STEPS[tutorialIndex];
    if (!step) return;
    const total = TUTORIAL_STEPS.length;
    const progress = el('md-tutorial-progress');
    const badge = el('md-tutorial-badge');
    const title = el('md-tutorial-title');
    const body = el('md-tutorial-body');
    const example = el('md-tutorial-example');

    if (progress) progress.textContent = `${tutorialIndex + 1} / ${total}`;
    if (badge) badge.textContent = step.badge;
    if (title) title.textContent = step.title;
    if (body) body.textContent = step.body;
    if (example) {
      const code = example.querySelector('code');
      if (step.example) {
        if (code) code.textContent = step.example;
        example.removeAttribute('hidden');
      } else {
        if (code) code.textContent = '';
        example.setAttribute('hidden', '');
      }
    }

    setTutorialNavButtons();
    clearTutorialFocus();
    const tool = document.querySelector(`#md-toolbar [data-md-snip="${step.snip}"]`);
    tool?.classList.add('md-tool--tour-focus');
    positionTutorialAround(tool, { scroll: true });
  }

  function onTutorialViewportChange() {
    if (el('md-tutorial')?.hasAttribute('hidden')) return;
    if (tutorialPlacing) return;
    window.clearTimeout(tutorialPlaceTimer);
    tutorialPlaceTimer = window.setTimeout(() => {
      const step = TUTORIAL_STEPS[tutorialIndex];
      if (!step) return;
      const tool = document.querySelector(`#md-toolbar [data-md-snip="${step.snip}"]`);
      // Só reposiciona o spotlight — evita loop de scroll
      positionTutorialAround(tool, { scroll: false });
    }, 80);
  }

  function openTutorial(fromGuide) {
    tutorialIndex = 0;
    const box = el('md-tutorial');
    if (!box) return;
    box.removeAttribute('hidden');
    document.body.classList.add('md-tutorial-open');
    document.body.classList.toggle('md-tutorial-mobile', isMobileTutorial());
    renderTutorialStep();
    if (fromGuide) setStatus('', '');
  }

  function closeTutorial(markDone) {
    if (markDone) tutorialDismissedThisVisit = true;
    clearTutorialFocus();
    el('md-tutorial')?.setAttribute('hidden', '');
    document.body.classList.remove('md-tutorial-open', 'md-tutorial-mobile');
    el('md-tutorial-card')?.classList.remove('md-tutorial-card--sheet');
  }

  function maybeShowTutorial() {
    // Com cadastro: não força o tutorial (usa o botão GUIA).
    if (state.mode === 'auth') return;
    // Sem guardar: mostra sempre ao entrar; se pulou nesta visita, não reabre sozinho.
    if (tutorialDismissedThisVisit) return;
    openTutorial(false);
  }

  function bindTutorial() {
    if (tutorialBound) return;
    tutorialBound = true;

    el('md-btn-open-guide')?.addEventListener('click', () => openTutorial(true));

    el('md-tutorial-skip')?.addEventListener('click', () => closeTutorial(true));

    el('md-tutorial-prev')?.addEventListener('click', () => {
      if (tutorialIndex <= 0) return;
      tutorialIndex -= 1;
      renderTutorialStep();
    });

    el('md-tutorial-next')?.addEventListener('click', () => {
      if (tutorialIndex >= TUTORIAL_STEPS.length - 1) return;
      tutorialIndex += 1;
      renderTutorialStep();
    });

    el('md-tutorial-done')?.addEventListener('click', () => closeTutorial(true));

    if (!tutorialRepositionBound) {
      tutorialRepositionBound = true;
      window.addEventListener('resize', onTutorialViewportChange);
      window.addEventListener('scroll', onTutorialViewportChange, true);
    }
  }

  function refreshPreview() {
    const src = el('md-editor')?.value ?? '';
    const preview = el('md-preview');
    if (preview && typeof buildxpRenderMarkdown === 'function') {
      preview.innerHTML = buildxpRenderMarkdown(src) || '<p class="md-preview-empty">O preview aparece aqui…</p>';
    }
    const wc = wordCount(src);
    const hc = headingCount(src);
    const meta = el('md-word-count');
    if (meta) {
      const done = wc >= XP_README_WORDS && hc >= XP_README_HEADINGS;
      if (done) {
        meta.textContent = `${wc} palavras · ${hc} títulos · README completo ✓`;
      } else {
        const parts = [];
        if (wc < XP_README_WORDS) parts.push(`faltam ${XP_README_WORDS - wc} palavras`);
        if (hc < XP_README_HEADINGS) parts.push(`faltam ${XP_README_HEADINGS - hc} títulos`);
        meta.textContent = `${wc} palavras · ${hc} títulos · ${parts.join(' · ')} p/ XP`;
      }
    }
  }

  function collectPayload() {
    return {
      titulo: el('md-title')?.value ?? 'Minha apresentação',
      conteudoMarkdown: el('md-editor')?.value ?? '',
    };
  }

  function applyDoc(doc) {
    if (!doc) return;
    if (el('md-title')) el('md-title').value = doc.titulo ?? 'Minha apresentação';
    if (el('md-editor')) el('md-editor').value = doc.conteudo_markdown ?? '';
    const xp = el('md-xp-total');
    if (xp) xp.textContent = String(doc.xp_total ?? 0);
    refreshPreview();
    state.dirty = false;
  }

  async function saveDoc(reason) {
    if (state.mode !== 'auth' || !state.token || state.saving) return;
    state.saving = true;
    setStatus(reason === 'blur' ? 'A guardar…' : 'A sincronizar…', 'dim');
    try {
      const res = await fetch(`${apiBase()}/api/markdown/doc`, {
        method: 'PUT',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          Authorization: `Bearer ${state.token}`,
        },
        credentials: 'same-origin',
        body: JSON.stringify(collectPayload()),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setStatus(data.message || 'Falha ao guardar.', 'bad');
        return;
      }
      if (data.doc) applyDoc(data.doc);
      const awards = Array.isArray(data.awards) ? data.awards : [];
      if (awards.length) {
        const parts = awards.map((a) => `+${a.points} XP · ${a.label}`);
        setStatus(`Guardado. ${parts.join(' · ')}`, 'ok');
      } else {
        setStatus('Guardado.', 'ok');
      }
      state.dirty = false;
    } catch (_) {
      setStatus('Sem ligação à API. Tente novamente.', 'bad');
    } finally {
      state.saving = false;
    }
  }

  function bindEditor() {
    const editor = el('md-editor');
    if (!editor) return;

    editor.addEventListener('input', () => {
      state.dirty = true;
      refreshPreview();
    });

    editor.addEventListener('blur', () => {
      if (state.mode === 'auth' && state.dirty) void saveDoc('blur');
    });

    ['md-title'].forEach((id) => {
      el(id)?.addEventListener('blur', () => {
        if (state.mode === 'auth') void saveDoc('blur');
      });
      el(id)?.addEventListener('input', () => {
        state.dirty = true;
      });
    });

    el('md-copy')?.addEventListener('click', async () => {
      const text = editor.value;
      const feedback = el('md-copy-feedback');
      const showOk = () => {
        if (!feedback) return;
        feedback.hidden = false;
        clearTimeout(showOk._t);
        showOk._t = setTimeout(() => {
          feedback.hidden = true;
        }, 2200);
      };
      try {
        await navigator.clipboard.writeText(text);
        showOk();
      } catch (_) {
        editor.select();
        showOk();
      }
    });

    el('md-toolbar')?.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-md-snip]');
      if (!btn) return;
      const key = btn.getAttribute('data-md-snip');
      if (key === 'help-media') {
        el('md-media-help')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        return;
      }
      const snip = SNIPPETS[key];
      if (snip) insertAtCursor(editor, snip);
    });

    window.addEventListener('beforeunload', (e) => {
      if (state.mode === 'guest' && (state.dirty || (editor.value || '').trim())) {
        e.preventDefault();
        e.returnValue = '';
      }
    });

    document.querySelectorAll('a[href]').forEach((a) => {
      a.addEventListener('click', (ev) => {
        if (state.mode !== 'guest') return;
        if (!(state.dirty || (editor.value || '').trim())) return;
        const href = a.getAttribute('href') || '';
        if (href.startsWith('#') || href === '' || a.target === '_blank') return;
        const ok = window.confirm(
          'Não estás a guardar esta sessão. Se saíres agora, vais perder tudo. Queres sair mesmo assim?',
        );
        if (!ok) ev.preventDefault();
      });
    });
  }

  function showWorkspace() {
    el('md-gate')?.setAttribute('hidden', '');
    document.body.classList.remove('md-gate-open');
    el('md-workspace')?.classList.remove('md-workspace--dimmed');
    el('md-workspace')?.removeAttribute('hidden');
    const badge = el('md-session-badge');
    if (badge) {
      badge.textContent =
        state.mode === 'auth'
          ? `Conta: ${state.usuario || state.nome}`
          : 'Sessão sem guardar — o conteúdo perde-se ao sair';
    }
    bindEditor();
    bindTutorial();
    refreshPreview();
    maybeShowTutorial();
  }

  function showGatePanel(name) {
    ['md-gate-home', 'md-gate-register', 'md-gate-login', 'md-gate-recover'].forEach((id) => {
      const node = el(id);
      if (!node) return;
      if (id === name) node.removeAttribute('hidden');
      else node.setAttribute('hidden', '');
    });
  }

  async function loadSecurityQuestions(selectEl) {
    if (!selectEl) return;
    try {
      const res = await fetch(`${apiBase()}/api/markdown/security-questions`, {
        headers: { Accept: 'application/json' },
        cache: 'no-store',
      });
      const list = await res.json();
      selectEl.innerHTML = '';
      (list || []).forEach((q) => {
        const opt = document.createElement('option');
        opt.value = String(q.id);
        opt.textContent = q.text;
        selectEl.appendChild(opt);
      });
    } catch (_) {
      selectEl.innerHTML =
        '<option value="0">Qual seria o código secreto da sua base lunar imaginária?</option>';
    }
  }

  function bindGate() {
    el('md-btn-guest')?.addEventListener('click', () => {
      state.mode = 'guest';
      sessionStorage.setItem(GUEST_KEY, '1');
      sessionStorage.removeItem(TOKEN_KEY);
      tutorialDismissedThisVisit = false;
      try {
        localStorage.removeItem('buildxp_md_tutorial_done');
      } catch (_) {}
      showWorkspace();
      setStatus('Modo sem guardar. Ao sair, o conteúdo é perdido.', 'warn');
    });

    el('md-btn-show-register')?.addEventListener('click', () => {
      showGatePanel('md-gate-register');
      void loadSecurityQuestions(el('md-reg-question'));
    });
    el('md-btn-show-login')?.addEventListener('click', () => showGatePanel('md-gate-login'));
    el('md-btn-show-recover')?.addEventListener('click', () => showGatePanel('md-gate-recover'));
    document.querySelectorAll('[data-md-gate-back]').forEach((b) => {
      b.addEventListener('click', () => showGatePanel('md-gate-home'));
    });

    el('md-form-register')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const body = {
        usuario: el('md-reg-user')?.value ?? '',
        nome: el('md-reg-name')?.value ?? '',
        senha: el('md-reg-pass')?.value ?? '',
        securityQuestionId: Number(el('md-reg-question')?.value ?? 0),
        securityAnswer: el('md-reg-answer')?.value ?? '',
      };
      const err = el('md-reg-error');
      if (err) err.textContent = '';
      try {
        const res = await fetch(`${apiBase()}/api/markdown/register`, {
          method: 'POST',
          headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
        const data = await res.json().catch(() => ({}));
        if (res.status === 409 || data.message === 'user_exists') {
          if (err) err.textContent = 'Este usuário já existe. Faça login ou escolha outro nome.';
          return;
        }
        if (!res.ok) {
          if (err) err.textContent = data.detail || data.message || 'Não foi possível criar a conta.';
          return;
        }
        state.mode = 'auth';
        state.token = data.token;
        state.usuario = data.usuario;
        state.nome = data.nome;
        sessionStorage.setItem(TOKEN_KEY, data.token);
        sessionStorage.removeItem(GUEST_KEY);
        showWorkspace();
        applyDoc(data.doc);
        setStatus('Conta criada. O documento será guardado ao sair de cada campo.', 'ok');
      } catch (_) {
        if (err) err.textContent = 'API indisponível. Confirme que o servidor está a correr.';
      }
    });

    el('md-form-login')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const body = {
        usuario: el('md-login-user')?.value ?? '',
        senha: el('md-login-pass')?.value ?? '',
      };
      const err = el('md-login-error');
      if (err) err.textContent = '';
      try {
        const res = await fetch(`${apiBase()}/api/markdown/login`, {
          method: 'POST',
          headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
        const data = await res.json().catch(() => ({}));
        if (data.message === 'user_not_found' || res.status === 404) {
          if (err) err.textContent = 'Usuário não encontrado. Crie um cadastro.';
          return;
        }
        if (data.message === 'wrong_password' || res.status === 401) {
          if (err) err.textContent = 'Senha incorreta.';
          return;
        }
        if (!res.ok) {
          if (err) err.textContent = data.detail || data.message || 'Falha no login.';
          return;
        }
        state.mode = 'auth';
        state.token = data.token;
        state.usuario = data.usuario;
        state.nome = data.nome;
        sessionStorage.setItem(TOKEN_KEY, data.token);
        sessionStorage.removeItem(GUEST_KEY);
        showWorkspace();
        applyDoc(data.doc);
        setStatus(`Olá, ${data.nome}. Documento carregado.`, 'ok');
      } catch (_) {
        if (err) err.textContent = 'API indisponível.';
      }
    });

    el('md-recover-load-q')?.addEventListener('click', async () => {
      const u = el('md-recover-user')?.value ?? '';
      const qEl = el('md-recover-qtext');
      const err = el('md-recover-error');
      if (err) err.textContent = '';
      try {
        const res = await fetch(
          `${apiBase()}/api/markdown/security-question/${encodeURIComponent(u.trim())}`,
          { headers: { Accept: 'application/json' } },
        );
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          if (err) err.textContent = 'Usuário não encontrado.';
          if (qEl) qEl.textContent = '';
          return;
        }
        if (qEl) qEl.textContent = data.security_question || '';
      } catch (_) {
        if (err) err.textContent = 'API indisponível.';
      }
    });

    el('md-form-recover')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const body = {
        usuario: el('md-recover-user')?.value ?? '',
        securityAnswer: el('md-recover-answer')?.value ?? '',
        novaSenha: el('md-recover-pass')?.value ?? '',
      };
      const err = el('md-recover-error');
      if (err) err.textContent = '';
      try {
        const res = await fetch(`${apiBase()}/api/markdown/recover`, {
          method: 'POST',
          headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
        const data = await res.json().catch(() => ({}));
        if (data.message === 'wrong_answer' || res.status === 401) {
          if (err) err.textContent = 'Resposta de segurança incorreta.';
          return;
        }
        if (data.message === 'user_not_found' || res.status === 404) {
          if (err) err.textContent = 'Usuário não encontrado.';
          return;
        }
        if (!res.ok) {
          if (err) err.textContent = data.message || 'Não foi possível recuperar.';
          return;
        }
        showGatePanel('md-gate-login');
        const loginErr = el('md-login-error');
        if (loginErr) loginErr.textContent = 'Senha atualizada. Entre com a nova senha.';
      } catch (_) {
        if (err) err.textContent = 'API indisponível.';
      }
    });
  }

  async function tryResumeAuth() {
    const token = sessionStorage.getItem(TOKEN_KEY);
    if (!token) return false;
    try {
      const res = await fetch(`${apiBase()}/api/markdown/doc`, {
        headers: { Accept: 'application/json', Authorization: `Bearer ${token}` },
        credentials: 'same-origin',
        cache: 'no-store',
      });
      if (!res.ok) {
        sessionStorage.removeItem(TOKEN_KEY);
        return false;
      }
      const doc = await res.json();
      state.mode = 'auth';
      state.token = token;
      showWorkspace();
      applyDoc(doc);
      setStatus('Sessão restaurada.', 'ok');
      return true;
    } catch (_) {
      return false;
    }
  }

  async function buildxpInitMarkdownBuilderPage() {
    if (!el('md-app')) return;
    bindGate();
    bindTutorial();
    const resumed = await tryResumeAuth();
    if (!resumed) {
      el('md-workspace')?.removeAttribute('hidden');
      el('md-workspace')?.classList.add('md-workspace--dimmed');
      el('md-gate')?.removeAttribute('hidden');
      document.body.classList.add('md-gate-open');
      showGatePanel('md-gate-home');
      refreshPreview();
    }
  }

  window.buildxpInitMarkdownBuilderPage = buildxpInitMarkdownBuilderPage;
})();
