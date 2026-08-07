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
    topWave:
      '<!-- Troca: SEU_NOME / SUA_FRASE e cores hex (ex. 4db5ff) na URL -->\n' +
      '![header](https://capsule-render.vercel.app/api?type=waving&height=200&color=0:4db5ff,100:061229&text=SEU_NOME&fontColor=ffffff&fontSize=60&desc=SUA_FRASE&descAlignY=72&descSize=18)\n',
    topRect:
      '<!-- Troca: SEU_NOME e cores hex (ex. 4db5ff) na URL -->\n' +
      '![header](https://capsule-render.vercel.app/api?type=rect&height=120&color=4db5ff&text=SEU_NOME&fontColor=061229&fontSize=50&fontAlignY=45)\n',
    topCylinder:
      '<!-- Troca: SEU_NOME / SUA_FRASE e cores hex na URL -->\n' +
      '![header](https://capsule-render.vercel.app/api?type=cylinder&height=180&color=0:2d7dff,100:4db5ff&text=SEU_NOME&fontColor=ffffff&fontSize=55&desc=SUA_FRASE&descAlignY=70&descSize=16)\n',
    topTyping:
      '<!-- Troca: SEU_NOME, cor do icone (%2300d4ff) e as frases em lines=... (separa com ;) -->\n' +
      '## <img src="https://api.iconify.design/lucide:zap.svg?color=%2300d4ff" width="28" valign="middle" />   SEU_NOME.sys\n' +
      '<br/>\n' +
      '\n' +
      '<br/>\n' +
      '\n' +
      '<p align="center">\n' +
      '  <img src="https://readme-typing-svg.demolab.com?font=Fira+Code&weight=600&size=18&pause=2000&color=00D4FF&center=true&vCenter=true&width=600&height=40&duration=500&lines=Frase+um+aqui;Frase+dois+aqui;Frase+tres+aqui" alt="Typing SVG" />\n' +
      '</p>\n',
    footLine:
      '<!-- Troca: SEU_NOME, SEU_USER e os links -->\n' +
      '\n---\n\n' +
      '**Feito com 💙 por SEU_NOME**\n\n' +
      '[GitHub](https://github.com/SEU_USER) · [LinkedIn](https://linkedin.com/in/SEU_USER)\n',
    footWave:
      '<!-- Troca: SEU_NOME e cores hex (ex. 4db5ff) na URL -->\n' +
      '![footer](https://capsule-render.vercel.app/api?type=waving&height=120&color=0:061229,100:4db5ff&section=footer&text=Obrigado%20pela%20visita&fontSize=28&fontColor=ffffff&desc=por%20SEU_NOME&descSize=14&descAlignY=75)\n',
  };

  const LEGEND_STEPS = [
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
    {
      snip: 'topWave',
      badge: 'TOP1',
      title: 'Top — onda',
      body: 'Banner superior com onda. Na URL, troca SEU_NOME, SUA_FRASE e as cores hex (ex. 4db5ff).',
      example: 'type=waving · text=SEU_NOME · color=4db5ff',
    },
    {
      snip: 'topRect',
      badge: 'TOP2',
      title: 'Top — faixa',
      body: 'Faixa reta com o teu nome. Edita SEU_NOME e o hex da cor na URL do capsule-render.',
      example: 'type=rect · text=SEU_NOME · color=4db5ff',
    },
    {
      snip: 'topCylinder',
      badge: 'TOP3',
      title: 'Top — cilindro',
      body: 'Banner em cilindro com título e frase. Só mudas texto e cores na URL.',
      example: 'type=cylinder · text=SEU_NOME · desc=SUA_FRASE',
    },
    {
      snip: 'topTyping',
      badge: 'TOP4',
      title: 'Top — typing',
      body: 'Cabeçalho transparente: ícone + nome + frases animadas. Edita SEU_NOME, a cor e as lines=…',
      example: 'SEU_NOME.sys + readme-typing-svg',
    },
    {
      snip: 'footLine',
      badge: 'FOOT1',
      title: 'Footer — linha',
      body: 'Rodapé com frase e links. Troca SEU_NOME, SEU_USER e os URLs do GitHub/LinkedIn.',
      example: '**Feito com 💙 por SEU_NOME**',
    },
    {
      snip: 'footWave',
      badge: 'FOOT2',
      title: 'Footer — onda',
      body: 'Banner inferior com onda. Edita SEU_NOME e as cores hex na URL.',
      example: 'section=footer · desc=por SEU_NOME',
    },
  ];

  const LEGEND_BY_SNIP = Object.fromEntries(LEGEND_STEPS.map((s) => [s.snip, s]));

  let state = {
    mode: null, // 'guest' | 'auth'
    token: '',
    usuario: '',
    nome: '',
    dirty: false,
    saving: false,
    sharing: false,
    editingTemplateId: null,
    saveGen: 0,
    suppressBlurSave: false,
    mobileView: 'editor',
  };

  /** Snippets que envolvem a seleção (before + after). */
  const WRAP_SNIPS = {
    bold: { before: '**', after: '**', empty: 'negrito' },
    italic: { before: '*', after: '*', empty: 'itálico' },
    boldItalic: { before: '***', after: '***', empty: 'destaque' },
    codeInline: { before: '`', after: '`', empty: 'código' },
    link: { before: '[', after: '](https://exemplo.com)', empty: 'texto do link' },
  };

  let legendBound = false;
  let shareUiBound = false;
  let editorBound = false;
  let legendHideTimer = 0;
  let legendAutoHideTimer = 0;
  let legendAnchor = null;
  let legendSnip = '';
  let legendMobileOpen = false;
  let savedSel = { start: 0, end: 0 };

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

  /**
   * Insere ou envolve texto no cursor sem deixar o blur/save apagar a alteração.
   * @param {HTMLTextAreaElement} textarea
   * @param {string} snippet — texto completo a inserir (se não for wrap)
   * @param {{ before?: string, after?: string, empty?: string } | null} wrap
   */
  function insertAtCursor(textarea, snippet, wrap) {
    if (!textarea) return;
    const start =
      typeof textarea.selectionStart === 'number' ? textarea.selectionStart : savedSel.start;
    const end =
      typeof textarea.selectionEnd === 'number' ? textarea.selectionEnd : savedSel.end;
    const selStart = Math.min(start, end);
    const selEnd = Math.max(start, end);
    const value = textarea.value;
    const selected = value.slice(selStart, selEnd);
    const before = value.slice(0, selStart);
    const after = value.slice(selEnd);

    let inserted;
    let caretStart;
    let caretEnd;

    if (wrap && (wrap.before != null || wrap.after != null)) {
      const b = wrap.before || '';
      const a = wrap.after || '';
      const inner = selected || wrap.empty || '';
      inserted = b + inner + a;
      if (selected) {
        caretStart = caretEnd = selStart + inserted.length;
      } else {
        caretStart = selStart + b.length;
        caretEnd = caretStart + inner.length;
      }
    } else {
      inserted = snippet || '';
      caretStart = caretEnd = selStart + inserted.length;
    }

    const scrollY = window.scrollY;
    const scrollTop = textarea.scrollTop;
    textarea.value = before + inserted + after;
    // Não chama focus() no mobile para evitar zoom/pulo; mousedown já preservou o foco
    try {
      textarea.setSelectionRange(caretStart, caretEnd);
    } catch (_) {}
    textarea.scrollTop = scrollTop;
    window.scrollTo(0, scrollY);
    savedSel = { start: caretStart, end: caretEnd };
    state.dirty = true;
    textarea.dispatchEvent(new Event('input', { bubbles: true }));
  }

  function rememberSelection(textarea) {
    if (!textarea) return;
    try {
      savedSel = {
        start: textarea.selectionStart ?? 0,
        end: textarea.selectionEnd ?? 0,
      };
    } catch (_) {}
  }

  function isMobileLegend() {
    return window.matchMedia('(max-width: 900px)').matches;
  }

  function clamp(n, min, max) {
    return Math.min(max, Math.max(min, n));
  }

  function clearLegendFocus() {
    document.querySelectorAll('.md-tool.md-tool--legend-focus').forEach((b) => {
      b.classList.remove('md-tool--legend-focus');
    });
  }

  function fillLegendContent(step) {
    const badge = el('md-legend-badge');
    const title = el('md-legend-title');
    const body = el('md-legend-body');
    const example = el('md-legend-example');

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
  }

  function placeLegendNear(tool) {
    const card = el('md-legend');
    if (!card) return;

    const mobile = isMobileLegend();
    const margin = 12;
    const gap = 10;

    card.classList.toggle('md-legend--sheet', mobile);
    document.body.classList.toggle('md-legend-mobile', mobile);

    if (mobile) {
      // Faixa no fluxo sob a toolbar — CSS trata o layout
      card.style.top = '';
      card.style.left = '';
      card.style.right = '';
      card.style.bottom = '';
      card.style.width = '';
      card.style.transform = '';
      return;
    }

    card.style.bottom = '';
    card.style.right = '';
    card.style.transform = 'none';

    const cardW = Math.min(340, window.innerWidth - margin * 2);
    card.style.width = `${cardW}px`;

    if (!tool) {
      card.style.left = `${(window.innerWidth - cardW) / 2}px`;
      card.style.top = `${margin + 72}px`;
      return;
    }

    const r = tool.getBoundingClientRect();
    const cardH = Math.min(card.offsetHeight || 220, window.innerHeight * 0.55);
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const centerLeft = clamp(r.left + r.width / 2 - cardW / 2, margin, vw - cardW - margin);

    const below = r.bottom + gap;
    const above = r.top - gap - cardH;
    if (below + cardH <= vh - margin) {
      card.style.top = `${below}px`;
      card.style.left = `${centerLeft}px`;
    } else if (above >= margin) {
      card.style.top = `${above}px`;
      card.style.left = `${centerLeft}px`;
    } else {
      card.style.top = `${clamp(r.top + r.height / 2 - cardH / 2, margin, vh - cardH - margin)}px`;
      const right = r.right + gap;
      if (right + cardW <= vw - margin) {
        card.style.left = `${right}px`;
      } else {
        card.style.left = `${clamp(r.left - gap - cardW, margin, vw - cardW - margin)}px`;
      }
    }
  }

  function hideLegend() {
    window.clearTimeout(legendHideTimer);
    legendHideTimer = 0;
    window.clearTimeout(legendAutoHideTimer);
    legendAutoHideTimer = 0;
    clearLegendFocus();
    legendAnchor = null;
    legendSnip = '';
    legendMobileOpen = false;
    el('md-legend')?.setAttribute('hidden', '');
    document.body.classList.remove('md-legend-open', 'md-legend-mobile');
    el('md-legend')?.classList.remove('md-legend--sheet');
  }

  function showLegend(snip, tool) {
    const step = LEGEND_BY_SNIP[snip];
    const card = el('md-legend');
    if (!step || !card) return;

    window.clearTimeout(legendHideTimer);
    legendHideTimer = 0;
    window.clearTimeout(legendAutoHideTimer);
    legendAutoHideTimer = 0;
    legendAnchor = tool || null;
    legendSnip = snip;
    legendMobileOpen = isMobileLegend();

    fillLegendContent(step);
    clearLegendFocus();
    tool?.classList.add('md-tool--legend-focus');

    card.removeAttribute('hidden');
    document.body.classList.toggle('md-legend-open', legendMobileOpen);
    placeLegendNear(tool);
    requestAnimationFrame(() => placeLegendNear(tool));
    // Mobile: legenda só fecha no X (sem auto-hide / clique fora)
  }

  function scheduleHideLegend() {
    window.clearTimeout(legendHideTimer);
    legendHideTimer = window.setTimeout(() => {
      if (legendMobileOpen) return;
      hideLegend();
    }, 140);
  }

  function cancelHideLegend() {
    window.clearTimeout(legendHideTimer);
    legendHideTimer = 0;
  }

  function onLegendViewportChange() {
    if (el('md-legend')?.hasAttribute('hidden')) return;
    if (!legendAnchor) return;
    if (legendMobileOpen) return; // sheet no fluxo — não reposiciona no scroll
    placeLegendNear(legendAnchor);
  }

  function bindToolLegend() {
    if (legendBound) return;
    legendBound = true;

    const toolbar = el('md-toolbar');
    const card = el('md-legend');

    toolbar?.querySelectorAll('[data-md-snip]').forEach((btn) => {
      btn.addEventListener('pointerenter', (e) => {
        if (isMobileLegend()) return;
        if (e.pointerType === 'touch') return;
        const key = btn.getAttribute('data-md-snip');
        if (!key || !LEGEND_BY_SNIP[key]) return;
        cancelHideLegend();
        showLegend(key, btn);
      });

      btn.addEventListener('pointerleave', (e) => {
        if (isMobileLegend()) return;
        if (e.pointerType === 'touch') return;
        scheduleHideLegend();
      });
    });

    card?.addEventListener('pointerenter', () => {
      if (isMobileLegend()) return;
      cancelHideLegend();
    });

    card?.addEventListener('pointerleave', () => {
      if (isMobileLegend()) return;
      scheduleHideLegend();
    });

    el('md-legend-close')?.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      hideLegend();
    });

    window.addEventListener('keydown', (e) => {
      if (e.key !== 'Escape') return;
      if (el('md-prepare') && !el('md-prepare').hasAttribute('hidden')) return;
      if (el('md-legend')?.hasAttribute('hidden')) return;
      hideLegend();
    });

    window.addEventListener('resize', onLegendViewportChange);
    window.addEventListener('scroll', onLegendViewportChange, true);
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

  function applyDoc(doc, opts) {
    if (!doc) return;
    const skipContent = opts && opts.skipContent;
    if (!skipContent) {
      if (el('md-title')) el('md-title').value = doc.titulo ?? 'Minha apresentação';
      if (el('md-editor')) el('md-editor').value = doc.conteudo_markdown ?? '';
      state.dirty = false;
    }
    const xp = el('md-xp-total');
    if (xp) xp.textContent = String(doc.xp_total ?? 0);
    refreshPreview();
  }

  async function saveDoc(reason) {
    if (state.mode !== 'auth' || !state.token || state.saving) return;
    if (state.suppressBlurSave && reason === 'blur') return;
    state.saving = true;
    const gen = ++state.saveGen;
    const payload = collectPayload();
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
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (gen !== state.saveGen) return;
      if (!res.ok) {
        setStatus(data.message || 'Falha ao guardar.', 'bad');
        return;
      }
      if (data.doc) {
        const now = collectPayload();
        const localChanged =
          now.conteudoMarkdown !== payload.conteudoMarkdown || now.titulo !== payload.titulo;
        applyDoc(data.doc, { skipContent: localChanged });
        if (!localChanged) state.dirty = false;
      }
      const awards = Array.isArray(data.awards) ? data.awards : [];
      if (awards.length) {
        const parts = awards.map((a) => `+${a.points} XP · ${a.label}`);
        setStatus(`Guardado. ${parts.join(' · ')}`, 'ok');
      } else {
        setStatus('Guardado.', 'ok');
      }
    } catch (_) {
      setStatus('Sem ligação à API. Tente novamente.', 'bad');
    } finally {
      if (gen === state.saveGen) state.saving = false;
    }
  }

  function bindEditor() {
    if (editorBound) return;
    editorBound = true;
    const editor = el('md-editor');
    if (!editor) return;

    editor.addEventListener('input', () => {
      state.dirty = true;
      refreshPreview();
    });

    editor.addEventListener('select', () => rememberSelection(editor));
    editor.addEventListener('keyup', () => rememberSelection(editor));
    editor.addEventListener('click', () => rememberSelection(editor));

    editor.addEventListener('blur', (e) => {
      if (state.suppressBlurSave) return;
      const rt = e.relatedTarget;
      if (rt && typeof rt.closest === 'function' && rt.closest('#md-toolbar, .md-tool')) return;
      if (state.mode === 'auth' && state.dirty) {
        window.setTimeout(() => {
          if (state.suppressBlurSave) return;
          if (state.mode === 'auth' && state.dirty) void saveDoc('blur');
        }, 120);
      }
    });

    ['md-title'].forEach((id) => {
      el(id)?.addEventListener('blur', () => {
        if (state.mode === 'auth' && state.dirty) void saveDoc('blur');
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

    const toolbar = el('md-toolbar');
    // Mantém o foco/seleção no textarea ao clicar nos botões
    toolbar?.addEventListener('mousedown', (e) => {
      const btn = e.target.closest('[data-md-snip]');
      if (!btn) return;
      e.preventDefault();
      rememberSelection(editor);
      state.suppressBlurSave = true;
    });

    toolbar?.addEventListener('mouseup', () => {
      window.setTimeout(() => {
        state.suppressBlurSave = false;
      }, 200);
    });

    toolbar?.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-md-snip]');
      if (!btn) return;
      e.preventDefault();
      rememberSelection(editor);
      // Restaura seleção salva antes de inserir (blur pode ter colapsado)
      try {
        editor.setSelectionRange(savedSel.start, savedSel.end);
      } catch (_) {}

      const key = btn.getAttribute('data-md-snip');
      if (key === 'help-media') {
        el('md-media-help')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        if (isMobileLegend()) showLegend(key, btn);
        return;
      }
      const wrap = WRAP_SNIPS[key];
      if (wrap) {
        insertAtCursor(editor, '', wrap);
      } else {
        const snip = SNIPPETS[key];
        if (snip) insertAtCursor(editor, snip, null);
      }
      if (isMobileLegend() && LEGEND_BY_SNIP[key]) showLegend(key, btn);
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

  function updateShareUi() {
    const wrap = el('md-share-wrap');
    const btn = el('md-share-btn');
    const upd = el('md-share-update-btn');
    if (!wrap || !btn) return;
    if (state.mode === 'auth') {
      wrap.removeAttribute('hidden');
      btn.textContent = 'Publicar como novo modelo';
      btn.dataset.mdShareAction = 'novo';
      btn.classList.add('ghost');
      btn.classList.remove('md-share-btn--on', 'primary');
      if (upd) {
        if (state.editingTemplateId) {
          upd.removeAttribute('hidden');
          upd.textContent = `Atualizar modelo #${state.editingTemplateId}`;
          upd.classList.add('primary');
          upd.classList.remove('ghost');
        } else {
          upd.setAttribute('hidden', '');
        }
      }
    } else {
      wrap.setAttribute('hidden', '');
      state.sharing = false;
      state.editingTemplateId = null;
      btn.textContent = 'Publicar como novo modelo';
      if (upd) upd.setAttribute('hidden', '');
    }
  }

  async function loadShareState() {
    if (state.mode !== 'auth' || !state.token) {
      state.sharing = false;
      updateShareUi();
      return;
    }
    try {
      const res = await fetch(`${apiBase()}/api/markdown/share`, {
        headers: { Accept: 'application/json', Authorization: `Bearer ${state.token}` },
        credentials: 'same-origin',
        cache: 'no-store',
      });
      const data = await res.json().catch(() => ({}));
      state.sharing = !!(res.ok && data.compartilhado);
    } catch (_) {
      state.sharing = false;
    }
    updateShareUi();
  }

  let prepareState = {
    acao: 'novo',
    templateId: null,
    markdown: '',
    original: '',
    replacements: [],
  };

  function formatTemplateDate(iso) {
    if (!iso) return '';
    try {
      const d = new Date(iso);
      if (Number.isNaN(d.getTime())) return '';
      return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch (_) {
      return '';
    }
  }

  function closePrepareModal() {
    el('md-prepare')?.setAttribute('hidden', '');
    document.body.classList.remove('md-prepare-open');
    const err = el('md-prepare-error');
    if (err) err.textContent = '';
  }

  function rebuildPrepareMarkdown() {
    const anonLines = String(prepareState.markdown || '').replace(/\r\n/g, '\n').split('\n');
    const merged = anonLines.slice();
    prepareState.replacements.forEach((r) => {
      const idx = (r.line || 0) - 1;
      if (idx < 0) return;
      while (merged.length <= idx) merged.push('');
      if (r.reverted) merged[idx] = r.original;
      else merged[idx] = r.current != null ? r.current : r.suggested;
    });
    prepareState.working = merged.join('\n');
    return prepareState.working;
  }

  function renderPreparePreview() {
    const md = rebuildPrepareMarkdown();
    const box = el('md-prepare-preview');
    if (box && typeof buildxpRenderMarkdown === 'function') {
      box.innerHTML = buildxpRenderMarkdown(md) || '';
      // destacar placeholders
      box.querySelectorAll('p, li, td, th, span').forEach((node) => {
        if (/Descreva aqui|Item de exemplo|\{\{seu-|\{\{nome-/.test(node.textContent || '')) {
          node.classList.add('md-anon-mark');
        }
      });
    }
  }

  function renderPrepareReplacements() {
    const host = el('md-prepare-repls');
    if (!host) return;
    if (!prepareState.replacements.length) {
      host.innerHTML = '<p class="md-templates-empty">Nenhuma substituição automática — só scrub de dados pessoais se houver.</p>';
      return;
    }
    host.innerHTML = prepareState.replacements
      .map((r, i) => {
        const val = r.reverted ? r.original : r.current != null ? r.current : r.suggested;
        return `
        <article class="md-prepare-repl" data-repl-idx="${i}">
          <div class="md-prepare-repl-meta">
            <span class="md-prepare-repl-kind">${escapeHtml(r.kind || 'texto')}</span>
            <span class="md-prepare-repl-line">linha ${Number(r.line) || '?'}</span>
          </div>
          <p class="md-prepare-repl-orig"><span>Original:</span> ${escapeHtml(r.original)}</p>
          <label class="fb-label">Substituição
            <textarea class="fb-input md-prepare-repl-input" rows="2" ${r.reverted ? 'disabled' : ''}>${escapeHtml(val)}</textarea>
          </label>
          <div class="md-prepare-repl-actions">
            <button type="button" class="term-btn ghost" data-repl-toggle>${r.reverted ? 'Usar sugestão' : 'Reverter original'}</button>
          </div>
        </article>`;
      })
      .join('');
  }

  async function openPrepareModal(acao, templateId) {
    if (state.mode !== 'auth' || !state.token) return;
    if (state.dirty) await saveDoc('share');
    const err = el('md-prepare-error');
    if (err) err.textContent = '';
    setStatus('A preparar modelo anonimizado…', 'dim');
    try {
      const res = await fetch(`${apiBase()}/api/markdown/templates/preview-anon`, {
        method: 'POST',
        headers: { Accept: 'application/json', Authorization: `Bearer ${state.token}` },
        credentials: 'same-origin',
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setStatus(data.message || 'Não foi possível preparar o modelo.', 'bad');
        return;
      }
      prepareState = {
        acao,
        templateId: templateId || null,
        markdown: data.markdown || '',
        original: data.original_markdown || '',
        working: data.markdown || '',
        replacements: (Array.isArray(data.replacements) ? data.replacements : []).map((r) => ({
          id: r.id,
          kind: r.kind,
          original: r.original,
          suggested: r.suggested,
          current: r.suggested,
          line: r.line,
          reverted: false,
        })),
      };
      if (el('md-prepare-titulo')) {
        el('md-prepare-titulo').value =
          el('md-title')?.value || data.titulo_sugerido || 'Modelo README';
      }
      if (el('md-prepare-desc')) el('md-prepare-desc').value = '';
      renderPrepareReplacements();
      renderPreparePreview();
      el('md-prepare')?.removeAttribute('hidden');
      document.body.classList.add('md-prepare-open');
      setStatus('', '');
    } catch (_) {
      setStatus('Sem ligação à API. Tente novamente.', 'bad');
    }
  }

  async function confirmPreparePublish() {
    const err = el('md-prepare-error');
    if (err) err.textContent = '';
    const titulo = (el('md-prepare-titulo')?.value || '').trim();
    const descricao = (el('md-prepare-desc')?.value || '').trim();
    if (!titulo) {
      if (err) err.textContent = 'Indica um título para o modelo.';
      return;
    }
    const markdown = rebuildPrepareMarkdown();
    const acao = prepareState.acao === 'atualizar' ? 'atualizar' : 'novo';
    try {
      const res = await fetch(`${apiBase()}/api/markdown/share`, {
        method: 'PUT',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          Authorization: `Bearer ${state.token}`,
        },
        credentials: 'same-origin',
        body: JSON.stringify({
          acao,
          templateId: prepareState.templateId,
          tituloModelo: titulo,
          descricao,
          conteudoMarkdown: markdown,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (err) err.textContent = data.message || 'Falha ao publicar.';
        return;
      }
      closePrepareModal();
      if (acao === 'novo') {
        state.editingTemplateId = data.template_id || null;
        setStatus('Novo modelo publicado na comunidade.', 'ok');
      } else {
        setStatus('Modelo atualizado.', 'ok');
      }
      state.sharing = true;
      updateShareUi();
      void loadTemplates();
      void loadMyTemplates();
    } catch (_) {
      if (err) err.textContent = 'Sem ligação à API.';
    }
  }

  async function shareAction(acao, templateId) {
    if (state.mode !== 'auth' || !state.token) return;
    if (acao === 'novo' || acao === 'atualizar') {
      void openPrepareModal(acao, templateId);
      return;
    }
    if (acao === 'excluir') {
      if (!window.confirm('Excluir este modelo definitivamente? Esta ação não tem volta.')) return;
    }
    try {
      const res = await fetch(`${apiBase()}/api/markdown/share`, {
        method: 'PUT',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          Authorization: `Bearer ${state.token}`,
        },
        credentials: 'same-origin',
        body: JSON.stringify({
          acao,
          templateId: templateId || state.editingTemplateId || null,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setStatus(data.message || 'Não foi possível atualizar o modelo.', 'bad');
        return;
      }
      if (acao === 'despublicar') {
        setStatus('Modelo despublicado (continua nos teus modelos).', 'ok');
      } else if (acao === 'republicar') {
        setStatus('Modelo republicado na galeria.', 'ok');
      } else if (acao === 'excluir') {
        if (state.editingTemplateId === templateId) state.editingTemplateId = null;
        setStatus('Modelo excluído.', 'ok');
      }
      updateShareUi();
      void loadTemplates();
      void loadMyTemplates();
    } catch (_) {
      setStatus('Sem ligação à API. Tente novamente.', 'bad');
    }
  }

  function escapeHtml(s) {
    return String(s ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function scrollTemplates(dir) {
    const track = el('md-templates-list');
    if (!track) return;
    const card = track.querySelector('.md-template-item');
    const step = card ? card.getBoundingClientRect().width + 12 : track.clientWidth * 0.85;
    track.scrollBy({ left: dir * step, behavior: 'smooth' });
  }

  async function loadTemplates() {
    const list = el('md-templates-list');
    if (!list) return;
    list.innerHTML = '<p class="md-templates-empty">A carregar modelos…</p>';
    try {
      const res = await fetch(`${apiBase()}/api/markdown/templates`, {
        headers: { Accept: 'application/json' },
        cache: 'no-store',
      });
      const data = await res.json().catch(() => []);
      if (!res.ok || !Array.isArray(data)) {
        list.innerHTML = '<p class="md-templates-empty">Não foi possível carregar os modelos.</p>';
        return;
      }
      if (!data.length) {
        list.innerHTML =
          '<p class="md-templates-empty">Ainda não há modelos partilhados. Sê o primeiro (com conta).</p>';
        return;
      }
      list.innerHTML = data
        .map((t) => {
          const date = formatTemplateDate(t.atualizado_em || t.criado_em);
          const usos = Number(t.usos) || 0;
          const desc = t.descricao || t.preview || 'Modelo README da comunidade';
          return `
        <article class="md-template-item" role="listitem" data-template-id="${Number(t.id)}">
          <div class="md-template-meta">
            <h4 class="md-template-title">${escapeHtml(t.titulo || 'Modelo README')}</h4>
            <p class="md-template-preview">${escapeHtml(desc)}</p>
            <div class="md-template-foot">
              ${date ? `<span>${escapeHtml(date)}</span>` : ''}
              <span>${usos} uso${usos === 1 ? '' : 's'}</span>
            </div>
          </div>
          <button type="button" class="term-btn primary md-gate-btn-primary md-template-use">Usar este modelo</button>
        </article>`;
        })
        .join('');
    } catch (_) {
      list.innerHTML = '<p class="md-templates-empty">Sem ligação à API.</p>';
    }
  }

  async function loadMyTemplates() {
    const wrap = el('md-my-templates');
    const list = el('md-my-templates-list');
    if (!wrap || !list) return;
    if (state.mode !== 'auth' || !state.token) {
      wrap.setAttribute('hidden', '');
      list.innerHTML = '';
      return;
    }
    wrap.removeAttribute('hidden');
    list.innerHTML = '<p class="md-templates-empty">A carregar os teus modelos…</p>';
    try {
      const res = await fetch(`${apiBase()}/api/markdown/templates/mine`, {
        headers: { Accept: 'application/json', Authorization: `Bearer ${state.token}` },
        credentials: 'same-origin',
        cache: 'no-store',
      });
      const data = await res.json().catch(() => []);
      if (!res.ok || !Array.isArray(data)) {
        list.innerHTML = '<p class="md-templates-empty">Não foi possível carregar os teus modelos.</p>';
        return;
      }
      if (!data.length) {
        list.innerHTML = '<p class="md-templates-empty">Ainda não publicaste nenhum modelo.</p>';
        return;
      }
      list.innerHTML = data
        .map((t) => {
          const ativo = !!t.ativo;
          const badge = ativo
            ? '<span class="md-template-badge md-template-badge--on">publicado</span>'
            : '<span class="md-template-badge">privado</span>';
          const pubBtn = ativo
            ? `<button type="button" class="term-btn ghost" data-my-action="despublicar">Despublicar</button>`
            : `<button type="button" class="term-btn ghost" data-my-action="republicar">Republicar</button>`;
          const date = formatTemplateDate(t.atualizado_em || t.criado_em);
          const usos = Number(t.usos) || 0;
          const desc = t.descricao || t.preview || '';
          return `
        <article class="md-template-item" data-template-id="${Number(t.id)}">
          <div class="md-template-meta">
            <h4 class="md-template-title">${escapeHtml(t.titulo || 'Modelo README')}${badge}</h4>
            <p class="md-template-preview">${escapeHtml(desc)}</p>
            <div class="md-template-foot">
              ${date ? `<span>${escapeHtml(date)}</span>` : ''}
              <span>${usos} uso${usos === 1 ? '' : 's'}</span>
            </div>
          </div>
          <div class="md-template-actions">
            <button type="button" class="term-btn ghost" data-my-action="ver">Ver</button>
            <button type="button" class="term-btn primary" data-my-action="editar">Editar</button>
            ${pubBtn}
            <button type="button" class="term-btn ghost" data-my-action="excluir">Excluir</button>
          </div>
        </article>`;
        })
        .join('');
    } catch (_) {
      list.innerHTML = '<p class="md-templates-empty">Sem ligação à API.</p>';
    }
  }

  async function applyTemplate(id, opts) {
    const asOwner = opts && opts.asOwner;
    try {
      const url = asOwner
        ? `${apiBase()}/api/markdown/templates/mine/${id}`
        : `${apiBase()}/api/markdown/templates/${id}`;
      const headers = { Accept: 'application/json' };
      if (asOwner && state.token) headers.Authorization = `Bearer ${state.token}`;
      const res = await fetch(url, {
        headers,
        credentials: asOwner ? 'same-origin' : 'omit',
        cache: 'no-store',
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setStatus(data.message || 'Modelo não encontrado.', 'bad');
        return;
      }
      if (el('md-title')) el('md-title').value = data.titulo || 'Modelo README';
      if (el('md-editor')) el('md-editor').value = data.conteudo_markdown || '';
      state.dirty = true;
      if (asOwner) state.editingTemplateId = id;
      else state.editingTemplateId = null;
      updateShareUi();
      refreshPreview();
      setStatus(
        asOwner
          ? `A editar modelo #${id}. Usa o botão para atualizar ou publica como novo.`
          : 'Modelo carregado no editor. Edita e guarda se tiveres conta.',
        'ok',
      );
      setMobileView('editor');
    } catch (_) {
      setStatus('Sem ligação à API. Tente novamente.', 'bad');
    }
  }

  function setMobileView(view) {
    state.mobileView = view === 'preview' ? 'preview' : 'editor';
    const tabs = el('md-view-tabs');
    tabs?.querySelectorAll('[data-md-view]').forEach((btn) => {
      const on = btn.getAttribute('data-md-view') === state.mobileView;
      btn.classList.toggle('is-active', on);
      btn.setAttribute('aria-selected', on ? 'true' : 'false');
    });
    el('md-pane-editor')?.classList.toggle('is-active', state.mobileView === 'editor');
    el('md-pane-preview')?.classList.toggle('is-active', state.mobileView === 'preview');
  }

  function bindShareUi() {
    if (shareUiBound) return;
    shareUiBound = true;

    el('md-share-btn')?.addEventListener('click', () => {
      void shareAction('novo');
    });
    el('md-share-update-btn')?.addEventListener('click', () => {
      if (state.editingTemplateId) void shareAction('atualizar', state.editingTemplateId);
    });

    el('md-templates-refresh')?.addEventListener('click', () => {
      void loadTemplates();
      void loadMyTemplates();
    });

    el('md-templates-prev')?.addEventListener('click', () => scrollTemplates(-1));
    el('md-templates-next')?.addEventListener('click', () => scrollTemplates(1));

    el('md-templates-list')?.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        scrollTemplates(1);
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        scrollTemplates(-1);
      }
    });

    el('md-templates-list')?.addEventListener('click', (e) => {
      const btn = e.target.closest('.md-template-use');
      if (!btn) return;
      const item = btn.closest('[data-template-id]');
      const id = Number(item?.getAttribute('data-template-id'));
      if (!id) return;
      void applyTemplate(id);
    });

    el('md-my-templates-list')?.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-my-action]');
      if (!btn) return;
      const item = btn.closest('[data-template-id]');
      const id = Number(item?.getAttribute('data-template-id'));
      const action = btn.getAttribute('data-my-action');
      if (!id || !action) return;
      if (action === 'ver' || action === 'editar') {
        void applyTemplate(id, { asOwner: true });
        return;
      }
      void shareAction(action, id);
    });

    el('md-view-tabs')?.addEventListener('click', (e) => {
      const tab = e.target.closest('[data-md-view]');
      if (!tab) return;
      setMobileView(tab.getAttribute('data-md-view'));
    });

    el('md-prepare-close')?.addEventListener('click', () => closePrepareModal());
    el('md-prepare-cancel')?.addEventListener('click', () => closePrepareModal());
    el('md-prepare-confirm')?.addEventListener('click', () => {
      void confirmPreparePublish();
    });
    el('md-prepare')?.addEventListener('click', (e) => {
      if (e.target === el('md-prepare')) closePrepareModal();
    });
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && el('md-prepare') && !el('md-prepare').hasAttribute('hidden')) {
        closePrepareModal();
      }
    });

    el('md-prepare-repls')?.addEventListener('click', (e) => {
      const toggle = e.target.closest('[data-repl-toggle]');
      if (!toggle) return;
      const card = toggle.closest('[data-repl-idx]');
      const idx = Number(card?.getAttribute('data-repl-idx'));
      const r = prepareState.replacements[idx];
      if (!r) return;
      r.reverted = !r.reverted;
      if (!r.reverted) r.current = r.suggested;
      renderPrepareReplacements();
      renderPreparePreview();
    });

    el('md-prepare-repls')?.addEventListener('input', (e) => {
      const input = e.target.closest('.md-prepare-repl-input');
      if (!input) return;
      const card = input.closest('[data-repl-idx]');
      const idx = Number(card?.getAttribute('data-repl-idx'));
      const r = prepareState.replacements[idx];
      if (!r || r.reverted) return;
      r.current = input.value;
      renderPreparePreview();
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
    bindToolLegend();
    bindShareUi();
    updateShareUi();
    setMobileView('editor');
    void loadShareState();
    void loadTemplates();
    void loadMyTemplates();
    refreshPreview();
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
