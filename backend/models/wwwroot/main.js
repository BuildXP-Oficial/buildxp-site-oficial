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
  document.querySelectorAll('.copy-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const block = btn.closest('.cmd-block');
      const code = getCmdBlockCopyText(block);
      doCopy(btn, code, 'copy');
    });
  });
  document.querySelectorAll('.cmd-copy').forEach(btn => {
    btn.addEventListener('click', () => {
      const code = btn.closest('.cmd-item').querySelector('.cmd-text').innerText;
      doCopy(btn, code, 'copy');
    });
  });
}

/* ── SLIDER (Beginner steps) ────────────────────────────────*/
function initStepsSlider() {
  document.querySelectorAll('[data-steps-slider]').forEach(root => {
    const track = root.querySelector('.steps-track');
    const prev = root.querySelector('[data-slide-prev]');
    const next = root.querySelector('[data-slide-next]');
    if (!track || !prev || !next) return;

    const stepEls = () => [...track.querySelectorAll('.step')];

    function getIndexMount() {
      return root.querySelector('[data-steps-index]') ?? null;
    }

    function scrollToStep(el) {
      if (!el) return;
      track.scrollTo({ left: el.offsetLeft, behavior: 'smooth' });
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

      const items = stepEls()
        .map((el) => {
          const numRaw = el.querySelector('.step-num')?.textContent?.trim() ?? '';
          const title = el.querySelector('.step-title')?.textContent?.trim() ?? '';
          const n = Number.parseInt(numRaw, 10);
          if (!Number.isFinite(n) || !title) return null; // ignore "PAUSA", "FIM", etc.
          return { el, num: String(n).padStart(2, '0'), title };
        })
        .filter(Boolean);

      if (!items.length) return;

      mount.innerHTML = `
        <div class="steps-index-title">Índice do card</div>
        <div class="steps-index-list" role="list"></div>
      `;

      const list = mount.querySelector('.steps-index-list');
      items.forEach((it) => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'steps-index-item';
        btn.setAttribute('role', 'listitem');
        btn.textContent = `${it.num} — ${it.title}`;
        btn.addEventListener('click', () => scrollToStep(it.el));
        list.appendChild(btn);
      });

      const setActive = () => {
        const center = track.scrollLeft + track.clientWidth * 0.5;
        let bestIdx = 0;
        let bestDist = Infinity;
        items.forEach((it, idx) => {
          const mid = it.el.offsetLeft + it.el.clientWidth * 0.5;
          const d = Math.abs(mid - center);
          if (d < bestDist) { bestDist = d; bestIdx = idx; }
        });
        [...list.querySelectorAll('.steps-index-item')].forEach((b, i) => {
          b.classList.toggle('active', i === bestIdx);
        });
      };

      track.addEventListener('scroll', () => {
        setActive();
        scheduleSyncTrackHeight();
      }, { passive: true });
      window.addEventListener('resize', () => {
        setActive();
        scheduleSyncTrackHeight();
      });
      setActive();
      scheduleSyncTrackHeight();
    }

    function updateButtons() {
      const maxScroll = Math.max(0, track.scrollWidth - track.clientWidth - 1);
      prev.disabled = track.scrollLeft <= 0;
      next.disabled = track.scrollLeft >= maxScroll;
    }

    function scrollByOne(dir) {
      const first = stepEls()[0];
      if (!first) return;
      const gap = parseFloat(getComputedStyle(track).columnGap || getComputedStyle(track).gap || '0') || 0;
      const width = first.getBoundingClientRect().width + gap;
      track.scrollBy({ left: dir * width, behavior: 'smooth' });
    }

    prev.addEventListener('click', () => scrollByOne(-1));
    next.addEventListener('click', () => scrollByOne(1));

    root.querySelectorAll('[data-steps-restart]').forEach(btn => {
      btn.addEventListener('click', () => track.scrollTo({ left: 0, behavior: 'smooth' }));
    });

    track.addEventListener('scroll', () => updateButtons(), { passive: true });
    window.addEventListener('resize', () => updateButtons());

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

/* ── FEEDBACK (Public wall) ─────────────────────────────────*/
function initFeedback() {
  const app = document.getElementById('feedback-app');
  if (!app) return;

  const LS_KEY = 'buildxp_feedback_v1';
  const banned = [
    'idiota','burro','bosta','merda','fdp','foda-se','foda se','caralho',
    'porra','desgraça','desgraca','otario','otária','otaria','imbecil',
    'racista','nazista','lixo','vagabundo','vagabunda', 'puta', 'puto', 'horrível', 'merda', 'fdp', 'foda-se', 'foda se', 'caralho', 'porra', 'desgraça', 'desgraca', 'otario', 'otária', 'otaria', 'imbecil'  ];

  const form = document.getElementById('fb-form');
  const nameEl = document.getElementById('fb-name');
  const kindEl = document.getElementById('fb-kind');
  const msgEl = document.getElementById('fb-msg');
  const statusEl = document.getElementById('fb-status');
  const listEl = document.getElementById('fb-list');
  const emptyEl = document.getElementById('fb-empty');
  const searchEl = document.getElementById('fb-search');

  const norm = (s) =>
    String(s ?? '')
      .trim()
      .replace(/\s+/g, ' ')
      .toLowerCase();

  const containsBanned = (text) => {
    const t = norm(text);
    return banned.find(w => t.includes(w)) ?? null;
  };

  const load = () => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      const arr = raw ? JSON.parse(raw) : [];
      return Array.isArray(arr) ? arr : [];
    } catch {
      return [];
    }
  };

  const save = (items) => localStorage.setItem(LS_KEY, JSON.stringify(items));

  const fmtDate = (iso) => {
    try {
      const d = new Date(iso);
      return d.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
    } catch {
      return '';
    }
  };

  function setStatus(text, type) {
    statusEl.textContent = text || '';
    statusEl.classList.toggle('ok', type === 'ok');
    statusEl.classList.toggle('bad', type === 'bad');
  }

  const feedbackApiPrefix = () =>
    typeof getBuildXpApiBase === 'function' ? String(getBuildXpApiBase()).replace(/\/$/, '') : '';

  function mapApiFeedbackToWallItem(f) {
    const rawMsg = f.mensagem ?? '';
    const bracket = String(rawMsg).match(/^\[([^\]]+)\]\s*\n*/);
    const kind = bracket ? bracket[1] : 'Feedback';
    const msg = bracket ? String(rawMsg).slice(bracket[0].length).trim() : String(rawMsg);
    return {
      id: String(f.id ?? ''),
      name: String(f.nome ?? '').slice(0, 100),
      kind,
      msg: msg.slice(0, 1000),
      createdAt: f.criadoEm ?? new Date().toISOString(),
    };
  }

  async function fetchApprovedFromApi() {
    try {
      const url = `${feedbackApiPrefix()}/api/feedback/aprovados`;
      const res = await fetch(url, {
        credentials: 'same-origin',
        headers: { Accept: 'application/json' },
      });
      if (!res.ok) return null;
      const data = await res.json();
      if (!Array.isArray(data)) return null;
      return data.map(mapApiFeedbackToWallItem);
    } catch {
      return null;
    }
  }

  /** Itens do mural: API (aprovados) quando disponível; senão cache local. */
  let displayItems = load();

  function render() {
    const q = norm(searchEl.value);
    const items = displayItems;
    const filtered = !q
      ? items
      : items.filter(
          (it) =>
            norm(it.name).includes(q) ||
            norm(it.kind).includes(q) ||
            norm(it.msg).includes(q),
        );

    listEl.innerHTML = '';
    emptyEl.style.display = filtered.length === 0 ? '' : 'none';

    filtered
      .slice()
      .sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''))
      .forEach((it) => {
        const div = document.createElement('div');
        div.className = 'fb-item';
        div.innerHTML = `
          <div class="fb-item-top">
            <span class="fb-kind"></span>
            <span class="fb-meta"></span>
          </div>
          <div class="fb-msg"></div>
        `;
        div.querySelector('.fb-kind').textContent = it.kind;
        div.querySelector('.fb-meta').textContent = `${it.name ? `${it.name} · ` : ''}${fmtDate(it.createdAt)}`;
        div.querySelector('.fb-msg').textContent = it.msg;
        listEl.appendChild(div);
      });
  }

  async function refreshWall() {
    const remote = await fetchApprovedFromApi();
    if (remote !== null) {
      displayItems = remote;
    } else {
      displayItems = load();
    }
    render();
  }

  searchEl?.addEventListener('input', () => render());

  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    setStatus('', '');

    const name = String(nameEl.value || '').trim().slice(0, 40);
    const kind = String(kindEl.value || 'Sugestão de ajuste').trim().slice(0, 40);
    const msg = String(msgEl.value || '').trim();

    if (msg.length < 6) {
      setStatus('Escreva uma mensagem um pouco maior (mínimo 6 caracteres).', 'bad');
      return;
    }

    const badWord = containsBanned(msg + ' ' + name);
    if (badWord) {
      setStatus(`Não foi possível publicar. Palavra não permitida detectada.`, 'bad');
      return;
    }

    const mensagem = `[${kind}]\n\n${msg}`.slice(0, 1000);
    const payload = {
      nome: name.slice(0, 100),
      mensagem,
    };

    try {
      const url = `${feedbackApiPrefix()}/api/feedback`;
      const res = await fetch(url, {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        msgEl.value = '';
        setStatus('Recebido! Após moderação pode aparecer no mural.', 'ok');
        await refreshWall();
        return;
      }
    } catch {
      /* fallback local abaixo */
    }

    const items = load();
    items.push({
      id: crypto?.randomUUID ? crypto.randomUUID() : String(Date.now()) + Math.random().toString(16).slice(2),
      name,
      kind,
      msg: msg.slice(0, 400),
      createdAt: new Date().toISOString(),
    });
    save(items);
    displayItems = load();
    msgEl.value = '';
    setStatus('Enviado só neste navegador (API indisponível).', 'ok');
    render();
  });

  refreshWall();
}

/* ── TRAINING TERMINAL ──────────────────────────────────────*/
const TRAIN_TOPICS = ['Git', 'Docker', 'NPM', '.NET'];
const TRAIN_LEVELS = [
  { id: 'beginner', label: 'INICIANTE' },
  { id: 'advanced', label: 'AVANÇADO' },
  { id: 'mixed', label: 'ARENA' },
];

const TRAIN_BANK = {
  Git: {
    beginner: [
      { q: 'Inicialize um repositório Git na pasta atual.', accept: ['git init'], must: ['git', 'init'] },
      { q: 'Veja o status do repositório (arquivos staged/unstaged).', accept: ['git status'], must: ['git', 'status'] },
      { q: 'Adicione TODOS os arquivos modificados ao stage.', accept: ['git add .'], must: ['git', 'add', '.'] },
      { q: 'Crie e mude para a branch "minha-feature".', accept: ['git checkout -b minha-feature', 'git switch -c minha-feature'], must: ['git', 'branch'] },
      { q: 'Mostre o histórico resumido (uma linha por commit).', accept: ['git log --oneline'], must: ['git', 'log'] },
    ],
    advanced: [
      { q: 'Aplique o último stash e remova-o da pilha.', accept: ['git stash pop'], must: ['git', 'stash'] },
      { q: 'Desfaça um arquivo do stage (sem apagar as mudanças).', accept: ['git restore --staged <arquivo>'], must: ['git', 'restore', '--staged'] },
      { q: 'Faça rebase da branch atual em cima de main.', accept: ['git rebase main'], must: ['git', 'rebase'] },
      { q: 'Mostre quais commits existem na sua branch e não estão em main (resumido).', accept: ['git log --oneline main..HEAD'], must: ['git', 'log'] },
      { q: 'Mostre as diferenças entre working tree e stage.', accept: ['git diff'], must: ['git', 'diff'] },
    ],
  },
  Docker: {
    beginner: [
      { q: 'Liste containers em execução.', accept: ['docker ps'], must: ['docker', 'ps'] },
      { q: 'Liste TODOS os containers (incluindo parados).', accept: ['docker ps -a'], must: ['docker', 'ps', '-a'] },
      { q: 'Baixe a imagem nginx.', accept: ['docker pull nginx'], must: ['docker', 'pull', 'nginx'] },
      { q: 'Build a imagem do diretório atual com tag "minha-app".', accept: ['docker build -t minha-app .'], must: ['docker', 'build'] },
      { q: 'Remova um container chamado "meu-nginx".', accept: ['docker rm meu-nginx'], must: ['docker', 'rm'] },
    ],
    advanced: [
      { q: 'Rode nginx em background expondo 8080:80 e nome "web".', accept: ['docker run -d -p 8080:80 --name web nginx'], must: ['docker', 'run', '-d'] },
      { q: 'Veja logs de um container chamado "web".', accept: ['docker logs web'], must: ['docker', 'logs'] },
      { q: 'Entre no shell de um container em execução chamado "web".', accept: ['docker exec -it web sh', 'docker exec -it web bash'], must: ['docker', 'exec', '-it'] },
      { q: 'Remova imagens sem uso (dangling).', accept: ['docker image prune'], must: ['docker', 'prune'] },
      { q: 'Suba um docker compose em background.', accept: ['docker compose up -d'], must: ['docker', 'compose', 'up'] },
    ],
  },
  NPM: {
    beginner: [
      { q: 'Inicialize um projeto com defaults (sem perguntas).', accept: ['npm init -y'], must: ['npm', 'init', '-y'] },
      { q: 'Instale express como dependência de produção.', accept: ['npm i express', 'npm install express'], must: ['npm', 'install'] },
      { q: 'Instale nodemon como devDependency.', accept: ['npm i -D nodemon', 'npm install --save-dev nodemon'], must: ['npm', 'nodemon'] },
      { q: 'Rode o script "build" do package.json.', accept: ['npm run build'], must: ['npm', 'run', 'build'] },
      { q: 'Veja a versão do NPM.', accept: ['npm --version'], must: ['npm', '--version'] },
    ],
    advanced: [
      { q: 'Faça uma instalação limpa usando package-lock (CI).', accept: ['npm ci'], must: ['npm', 'ci'] },
      { q: 'Liste pacotes desatualizados.', accept: ['npm outdated'], must: ['npm', 'outdated'] },
      { q: 'Remova um pacote chamado "lodash".', accept: ['npm uninstall lodash', 'npm remove lodash'], must: ['npm', 'uninstall'] },
      { q: 'Limpe o cache forçando.', accept: ['npm cache clean --force'], must: ['npm', 'cache', 'clean'] },
      { q: 'Liste pacotes globais no nível 0.', accept: ['npm list -g --depth=0'], must: ['npm', 'list', '-g'] },
    ],
  },
  '.NET': {
    beginner: [
      { q: 'Crie um novo projeto console.', accept: ['dotnet new console'], must: ['dotnet', 'new', 'console'] },
      { q: 'Mostre a versão do dotnet instalada.', accept: ['dotnet --version'], must: ['dotnet', '--version'] },
      { q: 'Rode o projeto atual.', accept: ['dotnet run'], must: ['dotnet', 'run'] },
      { q: 'Compile o projeto atual.', accept: ['dotnet build'], must: ['dotnet', 'build'] },
      { q: 'Liste os SDKs instalados.', accept: ['dotnet --list-sdks'], must: ['dotnet', '--list-sdks'] },
    ],
    advanced: [
      { q: 'Publique em Release na pasta ./publish.', accept: ['dotnet publish -c Release -o ./publish'], must: ['dotnet', 'publish'] },
      { q: 'Rode os testes do projeto/solução.', accept: ['dotnet test'], must: ['dotnet', 'test'] },
      { q: 'Restaure dependências.', accept: ['dotnet restore'], must: ['dotnet', 'restore'] },
      { q: 'Liste pacotes NuGet do projeto.', accept: ['dotnet list package'], must: ['dotnet', 'list', 'package'] },
      { q: 'Crie um projeto xUnit chamado "MeuApp.Tests".', accept: ['dotnet new xunit -n MeuApp.Tests'], must: ['dotnet', 'new', 'xunit'] },
    ],
  },
};

function initTrainingTerminal() {
  const mount = document.getElementById('terminal');
  if (!mount) return;

  /** Prova silenciosa → dashboard (qualquer terminal: intro ou treino; sem área dedicada). */
  let adminGateBuffer = [];

  const normAdmin = (s) =>
    String(s ?? '')
      .trim()
      .replace(/\s+/g, ' ');

  const compactCs = (s) => String(s).replace(/\s+/g, '');

  /** Remove espaços + aspas “tipográficas” / zero-width (cópia de editores). */
  function compactAdminBody(s) {
    return String(s)
      .replace(/[\u200B-\u200D\uFEFF]/g, '')
      .replace(/[\u201C\u201D\u201E\u201F\u00AB\u00BB]/g, '"')
      .replace(/\s+/g, '');
  }

  /** Quatro linhas (compactadas na validação). */
  const ADMIN_BRACE_OPEN = compactAdminBody('{');
  const ADMIN_ACESSO = compactAdminBody(
    'public static object Acesso = new { id = 0xB1D, fecho = "AdminDash"};',
  );
  const ADMIN_BRACE_CLOSE = compactAdminBody('}');

  function isFirstLineAdminDash(s) {
    const t = normAdmin(s);
    return t === 'private class AdminDash' || t === 'private class AdminDash {';
  }

  function validateAdminGate(lines) {
    if (lines.length !== 4) return false;
    if (!isFirstLineAdminDash(lines[0])) return false;
    if (compactAdminBody(lines[1]) !== ADMIN_BRACE_OPEN) return false;
    if (compactAdminBody(lines[2]) !== ADMIN_ACESSO) return false;
    if (compactAdminBody(lines[3]) !== ADMIN_BRACE_CLOSE) return false;
    return true;
  }

  function gateLog(text, cls = '') {
    const screen = mount.querySelector('#term-screen');
    if (!screen) return;
    const div = document.createElement('div');
    div.className = 'term-line' + (cls ? ` ${cls}` : '');
    div.textContent = text;
    screen.appendChild(div);
    screen.scrollTop = screen.scrollHeight;
  }

  function replayAdminGate() {
    const screen = mount.querySelector('#term-screen');
    if (!screen) return;
    screen.innerHTML = '';
    adminGateBuffer.forEach((l) => gateLog(`$ ${l}`, 'term-dim'));
    if (adminGateBuffer.length === 1 && isFirstLineAdminDash(adminGateBuffer[0])) {
      gateLog('A seguir: { , a linha do Acesso, e }', 'term-dim');
    }
  }

  /**
   * @param {string} raw
   * @param {'intro'|'run'} mode — intro: ignora silenciosamente o que não for a 1.ª linha da prova
   * @returns {boolean} true = input tratado pela prova (não passar ao quiz / não fazer mais nada)
   */
  function tryConsumeAdminGate(raw, mode) {
    const trimmed = String(raw ?? '').trim();
    if (!trimmed) return false;

    if (adminGateBuffer.length === 0) {
      if (!isFirstLineAdminDash(trimmed)) {
        return mode === 'intro';
      }
      adminGateBuffer.push(trimmed);
      gateLog(`$ ${trimmed}`, 'term-dim');
      gateLog('A seguir: { , a linha do Acesso, e }', 'term-dim');
      return true;
    }

    adminGateBuffer.push(trimmed);
    gateLog(`$ ${trimmed}`, 'term-dim');

    if (adminGateBuffer.length > 4) {
      gateLog('Ainda a finalizar', 'term-pending');
      return true;
    }

    if (adminGateBuffer.length === 4) {
      if (validateAdminGate(adminGateBuffer)) {
        window.location.href = 'dashboard.html';
        return true;
      }
      gateLog('Classe ou objeto inválido. Recomece.', 'term-bad');
      adminGateBuffer = [];
      return true;
    }

    return true;
  }

  const state = {
    topic: 'Git',
    levelMode: 'beginner',
    introStep: 'topic', // 'topic' | 'level'
    runLevel: 1,
    questionIdx: 0,
    totalXp: 0,
    goalXp: 80,
    asked: [],
    currentSet: [],
  };

  const norm = (s) =>
    String(s ?? '')
      .trim()
      .replace(/\s+/g, ' ')
      .toLowerCase();

  const tokenize = (s) =>
    norm(s)
      .split(' ')
      .filter(Boolean)
      .map(t => t.replace(/^['"]|['"]$/g, ''));

  function pickQuestions(topic, levelMode, runLevel) {
    const poolBeginner = TRAIN_BANK[topic].beginner;
    const poolAdvanced = TRAIN_BANK[topic].advanced;
    let pool = poolBeginner;
    if (levelMode === 'advanced') pool = poolAdvanced;
    if (levelMode === 'mixed') pool = [...poolBeginner, ...poolAdvanced];

    // Lightweight “leveling”: shift selection window as runLevel grows
    const shift = Math.min(pool.length - 5, Math.max(0, runLevel - 1));
    const rotated = [...pool.slice(shift), ...pool.slice(0, shift)];
    return rotated.slice(0, 5);
  }

  function renderIntro() {
    const isTopicStep = state.introStep === 'topic';
    mount.innerHTML = `
      <div class="term-intro">
        <div class="term-title">TERMINAL TRAINING</div>
        <div class="term-sub">
          Responda como se estivesse no terminal: eu faço a pergunta, você digita o comando.<br>
          Pontuação: <span class="term-good">+50 XP</span> certo · <span class="term-warn">+25 XP</span> parcialmente correto · <span class="term-bad">-1 XP</span> errado
        </div>

        ${isTopicStep ? `
          <div class="term-dim" style="text-align:center;margin-bottom:0.75rem;font-family:var(--f-mono);font-size:0.72rem;letter-spacing:2px;">
            1/2 · ESCOLHA O TEMA
          </div>
          <div class="term-pick" id="pick-topic"></div>
        ` : `
          <div class="term-dim" style="text-align:center;margin-bottom:0.75rem;font-family:var(--f-mono);font-size:0.72rem;letter-spacing:2px;">
            2/2 · ESCOLHA O NÍVEL
          </div>
          <div class="term-pick" style="justify-content:center;margin-bottom:0.8rem;">
            <span class="term-chip active" style="cursor:default;">${state.topic}</span>
          </div>
          <div class="term-pick" id="pick-level"></div>
          <div class="term-actions">
            <button class="term-btn primary" type="button" id="term-start">▶ INICIAR</button>
            <button class="term-btn ghost" type="button" id="term-back">← TROCAR TEMA</button>
          </div>
        `}
      </div>
    `;

    const setAccentForTopic = (t) => {
      const root = document.documentElement;
      const map = { Git: 'var(--blue)', Docker: 'var(--docker)', NPM: 'var(--blue-2)', '.NET': 'var(--dotnet)' };
      root.style.setProperty('--accent', map[t] ?? 'var(--blue)');
      root.style.setProperty('--accent-glow', 'var(--blue-glow)');
    };

    if (isTopicStep) {
      const topicWrap = mount.querySelector('#pick-topic');
      TRAIN_TOPICS.forEach(t => {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'term-chip' + (state.topic === t ? ' active' : '');
        b.textContent = t;
        b.addEventListener('click', () => {
          state.topic = t;
          setAccentForTopic(t);
          state.introStep = 'level';
          renderIntro();
        });
        topicWrap.appendChild(b);
      });
    } else {
      const levelWrap = mount.querySelector('#pick-level');
      TRAIN_LEVELS.forEach(l => {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'term-chip' + (state.levelMode === l.id ? ' active' : '');
        b.textContent = l.label;
        b.addEventListener('click', () => {
          state.levelMode = l.id;
          renderIntro();
        });
        levelWrap.appendChild(b);
      });

      mount.querySelector('#term-start').addEventListener('click', () => startRun(true));
      mount.querySelector('#term-back').addEventListener('click', () => {
        state.introStep = 'topic';
        renderIntro();
      });
    }
  }

  function renderTerminalShell() {
    mount.innerHTML = `
      <div class="term-frame">
        <div class="term-topbar">
          <div class="term-meta">
            <span class="term-badge">${state.topic}</span>
            <span class="term-dim">NÍVEL</span>
            <span class="term-badge">LVL ${state.runLevel}</span>
            <span class="term-dim">MODO</span>
            <span class="term-badge">${state.levelMode.toUpperCase()}</span>
          </div>
          <div class="term-meta term-xp">
            <span class="term-xp-wrap" id="term-xp-wrap">XP: <strong id="term-xp">${state.totalXp}</strong></span>
            <span class="term-goal">OBJ: <strong id="term-goal">${state.goalXp}</strong></span>
          </div>
        </div>
        <div class="term-screen" id="term-screen" aria-live="polite"></div>
        <div class="term-inputbar">
          <span class="term-prompt">$</span>
          <input class="term-input" id="term-input" autocomplete="off" spellcheck="false" placeholder="digite o comando e pressione Enter..." />
          <button class="term-send" type="button" id="term-send">ENVIAR</button>
        </div>
        <div class="term-actions" style="padding: 1rem;">
          <button class="term-btn ghost" type="button" id="term-restart">↺ REINICIAR</button>
          <button class="term-btn ghost" type="button" id="term-exit">✕ SAIR</button>
        </div>
      </div>
    `;
  }

  function line(text, cls = '') {
    const screen = mount.querySelector('#term-screen');
    if (!screen) return;
    const div = document.createElement('div');
    div.className = 'term-line' + (cls ? ` ${cls}` : '');
    div.textContent = text;
    screen.appendChild(div);
    screen.scrollTop = screen.scrollHeight;
  }

  function updateXpInstant() {
    const xpEl = mount.querySelector('#term-xp');
    if (xpEl) xpEl.textContent = String(state.totalXp);
  }

  function animateXpGain(delta) {
    if (!delta) return;
    const xpEl = mount.querySelector('#term-xp');
    const wrap = mount.querySelector('#term-xp-wrap');
    if (!xpEl || !wrap) {
      state.totalXp += delta;
      updateXpInstant();
      return;
    }

    const start = state.totalXp;
    const end = start + delta;
    state.totalXp = end;

    // fly +XP from terminal area into the counter
    const screen = mount.querySelector('#term-screen');
    const wrapRect = wrap.getBoundingClientRect();
    const startRect = screen?.getBoundingClientRect?.();
    const fromX = (startRect?.left ?? wrapRect.left) + (startRect?.width ?? 0) * 0.55;
    const fromY = (startRect?.top ?? wrapRect.top) + (startRect?.height ?? 0) * 0.62;
    const toX = wrapRect.left + wrapRect.width - 10;
    const toY = wrapRect.top + 6;

    const fly = document.createElement('span');
    fly.className = 'xp-fly';
    fly.textContent = `+${delta}`;
    fly.style.left = `${fromX}px`;
    fly.style.top = `${fromY}px`;
    document.body.appendChild(fly);

    if (fly.animate) {
      fly.animate(
        [
          { transform: 'translate3d(0, 0, 0) scale(1)', opacity: 0.0 },
          { transform: 'translate3d(0, -6px, 0) scale(1.08)', opacity: 1.0, offset: 0.2 },
          { transform: `translate3d(${toX - fromX}px, ${toY - fromY}px, 0) scale(0.85)`, opacity: 0.0 }
        ],
        { duration: 760, easing: 'cubic-bezier(0.18, 0.8, 0.2, 1)' }
      ).onfinish = () => fly.remove();
    } else {
      // fallback: float near counter
      fly.remove();
      const floatEl = document.createElement('span');
      floatEl.className = 'term-xp-float';
      floatEl.textContent = `+${delta}`;
      wrap.appendChild(floatEl);
      setTimeout(() => floatEl.remove(), 800);
    }

    // animate the number counting up
    const t0 = performance.now();
    const dur = 520;
    const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);

    function frame(now) {
      const p = Math.min(1, (now - t0) / dur);
      const eased = easeOutCubic(p);
      const val = Math.round(start + (end - start) * eased);
      xpEl.textContent = String(val);
      if (p < 1) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);

    // bump effect
    xpEl.classList.remove('xp-bump');
    // eslint-disable-next-line no-unused-expressions
    xpEl.offsetHeight;
    xpEl.classList.add('xp-bump');
  }

  function startRun(resetLevel) {
    if (resetLevel) state.runLevel = 1;
    state.questionIdx = 0;
    state.totalXp = 0;
    state.goalXp = 80;
    state.currentSet = pickQuestions(state.topic, state.levelMode, state.runLevel);
    renderTerminalShell();

    replayAdminGate();

    line(`BuildXP Terminal Training — ${state.topic}`, 'term-dim');
    line(`Objetivo: ${state.goalXp} XP.`, 'term-dim');
    line(`Regras: 5 desafios. +20 certo, +10 parcial, +0 errado.`, 'term-dim');
    line(`Dica: ignore os <arquivo> e foque na estrutura do comando.`, 'term-dim');
    line('', '');
    askCurrent();

    const input = mount.querySelector('#term-input');
    const send = mount.querySelector('#term-send');
    const onSend = () => submitAnswer();
    send.addEventListener('click', onSend);
    input.addEventListener('keydown', (e) => { if (e.key === 'Enter') onSend(); });
    input.focus();

    mount.querySelector('#term-restart').addEventListener('click', () => startRun(true));
    mount.querySelector('#term-exit').addEventListener('click', () => renderIntro());
  }

  function askCurrent() {
    const q = state.currentSet[state.questionIdx];
    line(`[${state.questionIdx + 1}/5] ${q.q}`, '');
  }

  function gradeAnswer(raw, q) {
    const user = norm(raw);
    const accepted = q.accept.map(norm);

    if (accepted.includes(user)) return { result: 'correct', xp: 20 };

    // partial: match enough required tokens (ignoring placeholders like <arquivo>)
    const ut = new Set(tokenize(user));
    const must = (q.must ?? [])
      .map(norm)
      .filter(t => t && !t.startsWith('<') && !t.endsWith('>'));
    const mustHits = must.filter(t => ut.has(t)).length;
    const needed = Math.max(2, Math.ceil(must.length * 0.6));
    const looksLike = accepted.some(a => a.split(' ')[0] && user.startsWith(a.split(' ')[0]));

    if ((must.length > 0 && mustHits >= Math.min(needed, must.length)) || (looksLike && user.length >= 3)) {
      return { result: 'partial', xp: 10 };
    }
    return { result: 'wrong', xp: 0 };
  }

  function submitAnswer() {
    const input = mount.querySelector('#term-input');
    if (!input) return;
    const raw = input.value;
    if (!raw.trim()) return;

    if (tryConsumeAdminGate(raw, 'run')) {
      input.value = '';
      return;
    }

    const q = state.currentSet[state.questionIdx];
    if (!q) return;

    line(`$ ${raw}`, 'term-dim');

    const g = gradeAnswer(raw, q);
    if (g.result === 'correct') line('✔ Correto.', 'term-good');
    else if (g.result === 'partial') line('◐ Parcialmente correto.', 'term-warn');
    else line('✖ Incorreto.', 'term-bad');

    if (g.xp > 0) animateXpGain(g.xp);

    line(`Resposta esperada: ${q.accept[0]}`, 'term-dim');
    line('', '');

    state.questionIdx++;
    input.value = '';

    if (state.questionIdx >= 5) finishRun();
    else askCurrent();
  }

  function finishRun() {
    line('—'.repeat(32), 'term-dim');
    line(`Fim do treino. XP total: ${state.totalXp}`, 'term-good');
    line(state.totalXp >= state.goalXp ? 'Meta batida. Boa!' : `Meta não batida (obj: ${state.goalXp} XP).`, state.totalXp >= state.goalXp ? 'term-good' : 'term-warn');
    line('Quer continuar? Suba o nível e faça mais 5.', 'term-dim');
    line('', '');

    const actions = document.createElement('div');
    actions.className = 'term-actions';
    actions.innerHTML = `
      <button class="term-btn primary" type="button" id="term-nextlvl">▲ PRÓXIMO NÍVEL</button>
      <button class="term-btn ghost" type="button" id="term-again">↺ REINICIAR</button>
      <button class="term-btn ghost" type="button" id="term-exit2">✕ SAIR</button>
    `;
    mount.querySelector('#term-screen')?.appendChild(actions);

    const input = mount.querySelector('#term-input');
    const send = mount.querySelector('#term-send');
    if (input) input.disabled = true;
    if (send) send.disabled = true;

    mount.querySelector('#term-nextlvl')?.addEventListener('click', () => {
      state.runLevel++;
      state.questionIdx = 0;
      state.currentSet = pickQuestions(state.topic, state.levelMode, state.runLevel);
      // keep XP accumulating per run? requirement says sum appears at end of test; each test 5 questions.
      // so reset XP for the new run, but keep level.
      state.totalXp = 0;
      startRun(false);
    });
    mount.querySelector('#term-again')?.addEventListener('click', () => startRun(true));
    mount.querySelector('#term-exit2')?.addEventListener('click', () => renderIntro());
  }

  renderIntro();
}

/* ── DASHBOARD (admin UI → API) ─────────────────────────────*/
function getBuildXpApiBase() {
  if (typeof window.BUILDXP_API_BASE === 'string' && window.BUILDXP_API_BASE.trim()) {
    return window.BUILDXP_API_BASE.trim().replace(/\/$/, '');
  }
  return '';
}

const BUILDXP_INDEX_ORDER_KEY = 'buildxp_index_card_order';
const BUILDXP_INDEX_CARD_DEFS = [
  { id: 1, slug: 'git', theme: 'git', label: 'Git & GitHub', page: 'git.html' },
  { id: 2, slug: 'docker', theme: 'docker', label: 'Docker', page: 'docker.html' },
  { id: 3, slug: 'npm', theme: 'npm', label: 'NPM', page: 'npm.html' },
  { id: 4, slug: 'dotnet', theme: 'dotnet', label: '.NET / dotnet', page: 'dotnet.html' },
];
const BUILDXP_INDEX_SLUGS = BUILDXP_INDEX_CARD_DEFS.map((c) => c.slug);
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
    link_beginner: 'git.html?tab=beginner',
    link_ref: 'git.html?tab=ref',
    btn_primary_label: '▶ COMEÇAR',
    btn_secondary_label: '🎮 CHEAT CODES',
    description_html:
      '<p>Do primeiro <code>git init</code> até branches, PRs e fluxos avançados. Guia completo para iniciantes e Cheat Codes para quem já usa e não lembra um comando específico.<br>Clique no botão para começar a aprender Git e GitHub.</p>',
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
    rarity_label: 'ADVANCED',
    card_class: 'CONTAINERIZATION',
    xp_current: 1800,
    xp_max: 3000,
    sort_order: 1,
    link_beginner: 'docker.html?tab=beginner',
    link_ref: 'docker.html?tab=ref',
    btn_primary_label: '▶ COMEÇAR',
    btn_secondary_label: '🎮 CHEAT CODES',
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
    link_beginner: 'npm.html?tab=beginner',
    link_ref: 'npm.html?tab=ref',
    btn_primary_label: '▶ COMEÇAR',
    btn_secondary_label: '🎮 CHEAT CODES',
    description_html:
      '<p>Gerencie pacotes, scripts e dependências de projetos Node.js. Do <code>npm init</code> ao publish no registry.<br>Clique no botão para começar a aprender NPM e para o que ele serve.</p>',
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
    link_beginner: 'dotnet.html?tab=beginner',
    link_ref: 'dotnet.html?tab=ref',
    btn_primary_label: '▶ COMEÇAR',
    btn_secondary_label: '🎮 CHEAT CODES',
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
  const def = BUILDXP_INDEX_CARD_DEFS.find((d) => d.slug === slug);
  if (!def) return [];
  const base = dashResolveTrainingHtmlBase();
  if (!base) return [];
  try {
    const pageUrl = new URL(def.page.replace(/^\//, ''), `${base}/`).href;
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

async function dashLoadSlidesForSlug(slug) {
  const local = dashReadSlidesFromLocalStorage(slug);
  const remote = await dashFetchParsedSlidesOnly(slug);
  /* localStorage com só `fin` (rascunho antigo) ou vazio útil não deve bloquear o HTML publicado */
  if (dashSlidesHasEditableContent(local)) return local;
  if (dashSlidesHasEditableContent(remote)) return remote;
  return local.length ? local : remote;
}

function getIndexCardOrder() {
  try {
    const raw = localStorage.getItem(BUILDXP_INDEX_ORDER_KEY);
    const arr = raw ? JSON.parse(raw) : null;
    if (Array.isArray(arr) && arr.length) {
      const valid = arr.filter((s) => BUILDXP_INDEX_SLUGS.includes(s));
      if (valid.length) return valid;
    }
  } catch (_) { /* ignore */ }
  return [...BUILDXP_INDEX_SLUGS];
}

function setIndexCardOrder(order) {
  const next = order.filter((s) => BUILDXP_INDEX_SLUGS.includes(s));
  try {
    localStorage.setItem(BUILDXP_INDEX_ORDER_KEY, JSON.stringify(next.length ? next : [...BUILDXP_INDEX_SLUGS]));
  } catch (_) { /* ignore */ }
}

function applyIndexCardOrder() {
  const grid = document.getElementById('index-cards-grid');
  if (!grid) return;
  const nodes = {};
  grid.querySelectorAll('[data-card-slug]').forEach((el) => {
    nodes[el.dataset.cardSlug] = el;
  });
  getIndexCardOrder().forEach((slug) => {
    const n = nodes[slug];
    if (n) grid.appendChild(n);
  });
}

function dashEscapeHtml(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function dashNormalizeFeedbackStatus(raw) {
  const v = raw?.status ?? raw?.Status;
  if (typeof v === 'number') {
    if (v === 0) return 'pending';
    if (v === 1) return 'approved';
    if (v === 2) return 'rejected';
  }
  const s = String(v ?? '').toLowerCase();
  if (s === 'pendente' || s === 'pending') return 'pending';
  if (s === 'aprovado' || s === 'approved') return 'approved';
  if (s === 'rejeitado' || s === 'rejected') return 'rejected';
  return 'pending';
}

function dashNormalizePending(raw) {
  const id = raw.id ?? raw.Id ?? raw.uuid;
  if (id === undefined || id === null) return null;
  const name = raw.author_name ?? raw.name ?? raw.nome ?? '';
  const rawMsg = raw.message ?? raw.msg ?? raw.body ?? raw.mensagem ?? '';
  const status = dashNormalizeFeedbackStatus(raw);
  let kind = raw.category ?? raw.kind ?? '';
  let msg = typeof rawMsg === 'string' ? rawMsg : String(rawMsg ?? '');
  if (!kind && msg.length) {
    const bracket = msg.match(/^\[([^\]]+)\]\s*\n*/);
    if (bracket) {
      kind = bracket[1];
      msg = msg.slice(bracket[0].length).trim();
    }
  }
  if (!kind) kind = '—';
  const createdAt = raw.created_at ?? raw.createdAt ?? raw.criadoEm ?? '';
  return {
    id: String(id),
    name,
    kind,
    msg,
    createdAt,
    status,
  };
}

function dashNormalizeCard(raw) {
  const slug = raw.slug ?? '';
  const display =
    raw.display_name ??
    raw.displayName ??
    raw.title ??
    (slug || null) ??
    '—';
  return {
    slug,
    display_name: display || '—',
    theme: raw.theme ?? '',
    rarity: raw.rarity_label ?? raw.rarity ?? '',
  };
}

function dashApplyCardToForm(raw) {
  if (!document.getElementById('dash-card-slug')) return;
  const el = (id) => document.getElementById(id);
  el('dash-card-slug').value = raw.slug ?? '';
  el('dash-card-theme').value = raw.theme ?? 'git';
  el('dash-card-display').value = raw.display_name ?? raw.displayName ?? '';
  el('dash-card-rarity').value = raw.rarity_label ?? raw.rarity ?? '';
  el('dash-card-class').value = raw.card_class ?? raw.cardClass ?? '';
  el('dash-card-xpc').value = raw.xp_current ?? raw.xpCurrent ?? 0;
  el('dash-card-xpm').value = raw.xp_max ?? raw.xpMax ?? 3000;
  el('dash-card-sort').value = raw.sort_order ?? raw.sortOrder ?? 0;
  el('dash-card-link-b').value = raw.link_beginner ?? raw.linkBeginner ?? '';
  el('dash-card-link-r').value = raw.link_ref ?? raw.linkRef ?? '';
  el('dash-card-btn1').value = raw.btn_primary_label ?? raw.btnPrimaryLabel ?? '';
  el('dash-card-btn2').value = raw.btn_secondary_label ?? raw.btnSecondaryLabel ?? '';
  el('dash-card-desc').value = raw.description_html ?? raw.descriptionHtml ?? '';
  el('dash-card-icon-layout').value = raw.icon_layout ?? raw.iconLayout ?? 'single';
  el('dash-card-icon-pri').value = raw.icon_primary_src ?? raw.iconPrimarySrc ?? '';
  el('dash-card-icon-pri-alt').value = raw.icon_primary_alt ?? raw.iconPrimaryAlt ?? '';
  el('dash-card-icon-sec').value = raw.icon_secondary_src ?? raw.iconSecondarySrc ?? '';
  el('dash-card-icon-sec-alt').value = raw.icon_secondary_alt ?? raw.iconSecondaryAlt ?? '';
  const pub = raw.is_published ?? raw.isPublished ?? true;
  el('dash-card-published').checked = pub !== false;
}

function getDashApiPath(key) {
  const defaults = {
    login: '/api/Auth/login',
    forgotRequest: '/api/auth/recuperar-senha',
    validateRecoveryCode: '/api/auth/validar-codigo-recuperacao',
    resetPassword: '/api/auth/redefinir-senha',
    inviteCollaborator: '/api/Colaborador/convidar',
  };
  const p = window.BUILDXP_API_PATHS || {};
  return p[key] || defaults[key] || '';
}

async function dashFetchNoThrow(path, options = {}) {
  const base = getBuildXpApiBase();
  const url = `${base}${path}`;
  const token = getToken(); // pega o JWT salvo no login

  try {
    const res = await fetch(url, {
      credentials: 'include',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        // envia o token JWT em toda requisição
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(options.headers || {}),
      },
      ...options,
    });
    const text = await res.text();
    let data = null;
    try {
      data = text ? JSON.parse(text) : null;
    } catch (_) {
      data = text;
    }
    return { ok: res.ok, status: res.status, data };
  } catch (e) {
    return { ok: false, status: 0, data: null, error: e };
  }
}

// ── TOKEN JWT ────────────────────────────────────────────────
// guarda o token JWT na sessão para enviar em todas as requisições
const BUILDXP_JWT_KEY = 'buildxp_jwt';
function getToken()       { try { return sessionStorage.getItem(BUILDXP_JWT_KEY) || ''; } catch(_) { return ''; } }
function saveToken(t)     { try { sessionStorage.setItem(BUILDXP_JWT_KEY, t); } catch(_) {} }
function removeToken()    { try { sessionStorage.removeItem(BUILDXP_JWT_KEY); } catch(_) {} }

/** Ex.: gislanesenaa@gmail.com → gis*********@gm*****com */
function maskRecoveryEmailDisplay(email) {
  const raw = String(email || '').trim();
  const at = raw.indexOf('@');
  if (at < 1 || at === raw.length - 1) return '***';
  const local = raw.slice(0, at);
  const host = raw.slice(at + 1);
  if (!host) return '***';
  const dot = host.lastIndexOf('.');
  const domain = dot > 0 ? host.slice(0, dot) : host;
  const tld = dot > 0 ? host.slice(dot + 1) : '';

  let localMasked;
  if (local.length <= 2) {
    localMasked = `${local[0] || '*'}**`;
  } else {
    localMasked = `${local.slice(0, 3)}${'*'.repeat(9)}`;
  }

  let domMasked;
  if (tld) {
    domMasked =
      domain.length <= 2
        ? `${domain.padEnd(2, '*').slice(0, 2)}*****${tld}`
        : `${domain.slice(0, 2)}*****${tld}`;
  } else {
    domMasked = `${domain.slice(0, 2)}*****`;
  }

  return `${localMasked}@${domMasked}`;
}

async function tryAdminLogin(username, password) {
  // nosso backend espera {usuario, senha} e retorna {token}
  const r = await dashFetchNoThrow('/api/Auth/login', {
    method: 'POST',
    body: JSON.stringify({ usuario: username, senha: password }),
  });

  // se o backend retornou token, salva e libera acesso
  if (r.ok && r.data?.token) {
    saveToken(r.data.token);
    return true;
  }

  // fallback local: PIN abre o painel, mas convites/API exigem JWT — obtém token com credenciais de dev do HTML
  const pin = typeof window.BUILDXP_ADMIN_DEV_PIN === 'string' ? window.BUILDXP_ADMIN_DEV_PIN : '';
  const devUser = String(window.BUILDXP_DASH_TEST_USER || '').trim().toLowerCase();
  if (pin !== '' && password === pin && String(username || '').trim().toLowerCase() === devUser) {
    const tu = typeof window.BUILDXP_DASH_TEST_USER === 'string' ? window.BUILDXP_DASH_TEST_USER.trim() : '';
    const tp = typeof window.BUILDXP_DASH_TEST_PASSWORD === 'string' ? window.BUILDXP_DASH_TEST_PASSWORD : '';
    if (tu && tp) {
      const r2 = await dashFetchNoThrow('/api/Auth/login', {
        method: 'POST',
        body: JSON.stringify({ usuario: tu, senha: tp }),
      });
      if (r2.ok && r2.data?.token) {
        saveToken(r2.data.token);
        return true;
      }
    }
    // Abre o painel mesmo sem token; convidar colaborador exige JWT (alinhe BUILDXP_DASH_TEST_* com appsettings).
    return true;
  }

  return false;
}

function initDashboard() {
  const loginEl = document.getElementById('dash-login');
  const shellEl = document.getElementById('dash-shell');
  if (!loginEl || !shellEl) return;

  document.getElementById('dash-nav-logo')?.addEventListener('click', (e) => {
    e.preventDefault();
    if (typeof window.__dashGoHome === 'function') window.__dashGoHome();
  });

  const ADMIN_SESSION_KEY = 'buildxp_admin_session';
  const loginForm = document.getElementById('dash-login-form');
  const loginUser = document.getElementById('dash-login-username');
  const loginPw = document.getElementById('dash-login-password');
  const loginStatus = document.getElementById('dash-login-status');

  const forgotModal = document.getElementById('dash-forgot-modal');
  const forgotBackdrop = document.getElementById('dash-forgot-backdrop');
  const forgotClose = document.getElementById('dash-forgot-close');
  const forgotCancel = document.getElementById('dash-forgot-cancel');
  const forgotOpen = document.getElementById('dash-open-forgot');
  const forgotPanelEmail = document.getElementById('dash-forgot-panel-email');
  const forgotPanelCode = document.getElementById('dash-forgot-panel-code');
  const forgotPanelPassword = document.getElementById('dash-forgot-panel-password');
  const forgotEmailEl = document.getElementById('dash-forgot-email');
  const forgotStep1Status = document.getElementById('dash-forgot-step1-status');
  const forgotCodeStatus = document.getElementById('dash-forgot-code-status');
  const forgotPasswordStatus = document.getElementById('dash-forgot-step-password-status');
  const forgotVerifyCodeBtn = document.getElementById('dash-forgot-verify-code');
  const forgotResendBtn = document.getElementById('dash-forgot-resend');
  const forgotBackToEmail = document.getElementById('dash-forgot-back-to-email');
  const forgotBackToCode = document.getElementById('dash-forgot-back-to-code');
  const FORGOT_RESEND_SEC = 50;
  let pendingForgotEmail = '';
  let pendingForgotCode = '';
  let forgotResendTimer = null;

  function clearForgotResendTimer() {
    if (forgotResendTimer) {
      clearInterval(forgotResendTimer);
      forgotResendTimer = null;
    }
  }

  function updateForgotResendButton(sec) {
    if (!forgotResendBtn) return;
    if (sec > 0) {
      forgotResendBtn.disabled = true;
      forgotResendBtn.textContent = `Reenviar código (${sec}s)`;
    } else {
      forgotResendBtn.disabled = false;
      forgotResendBtn.textContent = 'Reenviar código';
    }
  }

  function startForgotResendCooldown() {
    clearForgotResendTimer();
    let sec = FORGOT_RESEND_SEC;
    updateForgotResendButton(sec);
    forgotResendTimer = setInterval(() => {
      sec -= 1;
      if (sec <= 0) {
        clearForgotResendTimer();
        updateForgotResendButton(0);
      } else {
        updateForgotResendButton(sec);
      }
    }, 1000);
  }

  function showForgotStep(which) {
    if (forgotPanelEmail) forgotPanelEmail.hidden = which !== 'email';
    if (forgotPanelCode) forgotPanelCode.hidden = which !== 'code';
    if (forgotPanelPassword) forgotPanelPassword.hidden = which !== 'password';
    const maskedEl = document.getElementById('dash-forgot-email-masked');
    if (maskedEl) {
      maskedEl.textContent =
        which === 'code' && pendingForgotEmail ? maskRecoveryEmailDisplay(pendingForgotEmail) : '';
    }
  }

  function openForgotModal() {
    if (!forgotModal) return;
    pendingForgotEmail = '';
    pendingForgotCode = '';
    clearForgotResendTimer();
    if (forgotResendBtn) {
      forgotResendBtn.disabled = true;
      forgotResendBtn.textContent = `Reenviar código (${FORGOT_RESEND_SEC}s)`;
    }
    showForgotStep('email');
    if (forgotEmailEl) forgotEmailEl.value = '';
    const codeEl = document.getElementById('dash-forgot-code');
    if (codeEl) codeEl.value = '';
    const np = document.getElementById('dash-forgot-newpw');
    const np2 = document.getElementById('dash-forgot-newpw2');
    if (np) np.value = '';
    if (np2) np2.value = '';
    if (forgotStep1Status) {
      forgotStep1Status.textContent = '';
      forgotStep1Status.classList.remove('ok', 'bad');
    }
    if (forgotCodeStatus) {
      forgotCodeStatus.textContent = '';
      forgotCodeStatus.classList.remove('ok', 'bad');
    }
    if (forgotPasswordStatus) {
      forgotPasswordStatus.textContent = '';
      forgotPasswordStatus.classList.remove('ok', 'bad');
    }
    const maskedReset = document.getElementById('dash-forgot-email-masked');
    if (maskedReset) maskedReset.textContent = '';
    forgotModal.removeAttribute('hidden');
    document.body.style.overflow = 'hidden';
  }

  function closeForgotModal() {
    if (!forgotModal) return;
    clearForgotResendTimer();
    forgotModal.setAttribute('hidden', '');
    document.body.style.overflow = '';
  }

  forgotOpen?.addEventListener('click', () => openForgotModal());
  forgotClose?.addEventListener('click', () => closeForgotModal());
  forgotCancel?.addEventListener('click', () => closeForgotModal());
  forgotBackdrop?.addEventListener('click', () => closeForgotModal());

  forgotBackToEmail?.addEventListener('click', () => {
    pendingForgotCode = '';
    showForgotStep('email');
    if (forgotCodeStatus) {
      forgotCodeStatus.textContent = '';
      forgotCodeStatus.classList.remove('ok', 'bad');
    }
    forgotEmailEl?.focus();
  });

  forgotBackToCode?.addEventListener('click', () => {
    pendingForgotCode = '';
    showForgotStep('code');
    if (forgotPasswordStatus) {
      forgotPasswordStatus.textContent = '';
      forgotPasswordStatus.classList.remove('ok', 'bad');
    }
    const np = document.getElementById('dash-forgot-newpw');
    const np2 = document.getElementById('dash-forgot-newpw2');
    if (np) np.value = '';
    if (np2) np2.value = '';
    document.getElementById('dash-forgot-code')?.focus();
  });

  document.getElementById('dash-forgot-step1')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!forgotEmailEl || !forgotStep1Status) return;
    const email = forgotEmailEl.value.trim();
    if (!email) return;
    forgotStep1Status.textContent = '';
    forgotStep1Status.classList.remove('ok', 'bad');
    const path = getDashApiPath('forgotRequest');
    const r = await dashFetchNoThrow(path, {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
    if (r.ok) {
      pendingForgotEmail = email;
      pendingForgotCode = '';
      forgotStep1Status.textContent = '';
      forgotStep1Status.classList.add('ok');
      showForgotStep('code');
      const codeEl = document.getElementById('dash-forgot-code');
      if (codeEl) {
        codeEl.value = '';
        codeEl.focus();
      }
      if (forgotCodeStatus) {
        forgotCodeStatus.textContent = '';
        forgotCodeStatus.classList.remove('ok', 'bad');
      }
      startForgotResendCooldown();
    } else {
      forgotStep1Status.textContent =
        (r.data && typeof r.data === 'object' && r.data.message) || 'Não foi possível enviar o código.';
      forgotStep1Status.classList.add('bad');
    }
  });

  forgotVerifyCodeBtn?.addEventListener('click', async () => {
    if (!forgotCodeStatus || !pendingForgotEmail) return;
    const code = document.getElementById('dash-forgot-code')?.value?.trim() || '';
    forgotCodeStatus.textContent = '';
    forgotCodeStatus.classList.remove('ok', 'bad');
    if (!code) {
      forgotCodeStatus.textContent = 'Informe o código.';
      forgotCodeStatus.classList.add('bad');
      return;
    }
    const path = getDashApiPath('validateRecoveryCode');
    const r = await dashFetchNoThrow(path, {
      method: 'POST',
      body: JSON.stringify({ email: pendingForgotEmail, codigo: code }),
    });
    if (r.ok) {
      pendingForgotCode = code;
      forgotCodeStatus.classList.add('ok');
      showForgotStep('password');
      document.getElementById('dash-forgot-newpw')?.focus();
    } else {
      const msg =
        (r.data && typeof r.data === 'object' && r.data.message) || 'Código inválido ou expirado.';
      forgotCodeStatus.textContent = msg;
      forgotCodeStatus.classList.add('bad');
    }
  });

  forgotResendBtn?.addEventListener('click', async () => {
    if (!pendingForgotEmail || forgotResendBtn?.disabled) return;
    if (forgotCodeStatus) {
      forgotCodeStatus.textContent = '';
      forgotCodeStatus.classList.remove('ok', 'bad');
    }
    const path = getDashApiPath('forgotRequest');
    const r = await dashFetchNoThrow(path, {
      method: 'POST',
      body: JSON.stringify({ email: pendingForgotEmail }),
    });
    if (r.ok) {
      startForgotResendCooldown();
      if (forgotCodeStatus) {
        forgotCodeStatus.textContent = 'Novo código enviado.';
        forgotCodeStatus.classList.remove('bad');
        forgotCodeStatus.classList.add('ok');
      }
    } else if (forgotCodeStatus) {
      forgotCodeStatus.textContent =
        (r.data && typeof r.data === 'object' && r.data.message) || 'Não foi possível reenviar.';
      forgotCodeStatus.classList.add('bad');
    }
  });

  document.getElementById('dash-forgot-step-password')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!forgotPasswordStatus) return;
    const np = document.getElementById('dash-forgot-newpw')?.value || '';
    const np2 = document.getElementById('dash-forgot-newpw2')?.value || '';
    if (!pendingForgotEmail || !pendingForgotCode) {
      forgotPasswordStatus.textContent = 'Valide o código novamente.';
      forgotPasswordStatus.classList.add('bad');
      return;
    }
    if (!np) {
      forgotPasswordStatus.textContent = 'Informe a nova senha.';
      forgotPasswordStatus.classList.add('bad');
      return;
    }
    if (np !== np2) {
      forgotPasswordStatus.textContent = 'As senhas não conferem.';
      forgotPasswordStatus.classList.add('bad');
      return;
    }
    forgotPasswordStatus.textContent = '';
    forgotPasswordStatus.classList.remove('ok', 'bad');
    const path = getDashApiPath('resetPassword');
    const r = await dashFetchNoThrow(path, {
      method: 'POST',
      body: JSON.stringify({
        email: pendingForgotEmail,
        codigo: pendingForgotCode,
        novaSenha: np,
      }),
    });
    if (r.ok) {
      forgotPasswordStatus.textContent = 'Senha alterada com sucesso.';
      forgotPasswordStatus.classList.add('ok');
      setTimeout(() => {
        closeForgotModal();
      }, 400);
    } else {
      const msg =
        (r.data && typeof r.data === 'object' && r.data.message) ||
        (typeof r.data === 'string' ? r.data : null) ||
        'Não foi possível redefinir a senha.';
      forgotPasswordStatus.textContent = msg;
      forgotPasswordStatus.classList.add('bad');
    }
  });

  function readSession() {
    try {
      return sessionStorage.getItem(ADMIN_SESSION_KEY) === '1';
    } catch (_) {
      return false;
    }
  }

  function writeSession() {
    try {
      sessionStorage.setItem(ADMIN_SESSION_KEY, '1');
    } catch (_) {
      /* ignore */
    }
  }

  function clearSession() {
    try {
      sessionStorage.removeItem(ADMIN_SESSION_KEY);
    } catch (_) {
      /* ignore */
    }
  }

  function resetDashViewsToHome() {
    const app = document.getElementById('dash-app');
    if (!app) return;
    app.querySelectorAll('[data-dash-view]').forEach((el) => {
      const on = el.getAttribute('data-dash-view') === 'home';
      el.toggleAttribute('hidden', !on);
      el.classList.toggle('dash-view--active', on);
    });
    const collab = document.getElementById('dash-collab-section');
    if (collab) collab.hidden = false;
  }

  function showLogin() {
    closeForgotModal();
    document.body.classList.remove('dash-body--authed');
    loginEl.hidden = false;
    loginEl.removeAttribute('aria-hidden');
    shellEl.hidden = true;
    shellEl.setAttribute('aria-hidden', 'true');
    resetDashViewsToHome();
    if (loginUser) loginUser.value = '';
    if (loginPw) loginPw.value = '';
    if (loginStatus) {
      loginStatus.textContent = '';
      loginStatus.classList.remove('ok', 'bad');
    }
  }

  let shellStarted = false;
  let fbScope = 'pending';
  let editingCardSlug = null;

  function showShell() {
    document.body.classList.add('dash-body--authed');
    loginEl.hidden = true;
    loginEl.setAttribute('aria-hidden', 'true');
    shellEl.hidden = false;
    shellEl.removeAttribute('aria-hidden');
    if (!shellStarted) {
      shellStarted = true;
      startShell();
    } else {
      refreshAll();
    }
  }

  let dashReloadAll = null;

  function refreshAll() {
    if (typeof dashReloadAll === 'function') dashReloadAll();
  }

  loginForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!loginStatus || !loginPw || !loginUser) return;
    const username = loginUser.value.trim();
    const password = loginPw.value;
    if (!username) {
      loginStatus.textContent = '';
      loginStatus.classList.remove('ok', 'bad');
      return;
    }

    
    loginStatus.textContent = '';
    loginStatus.classList.remove('ok', 'bad');
    const ok = await tryAdminLogin(username, password);
    if (ok) {
      writeSession();
      loginStatus.textContent = '';
      loginStatus.classList.remove('bad');
      showShell();
    } else {
      loginStatus.textContent = 'Senha incorreta.';
      loginStatus.classList.remove('ok');
      loginStatus.classList.add('bad');
    }
  });

// depois — com o removeToken()
  document.getElementById('dash-logout')?.addEventListener('click', () => {
  clearSession();
  removeToken(); // ← adiciona essa linha
  showLogin();
});

  if (readSession()) showShell();
  else showLogin();

  function startShell() {
    const root = document.getElementById('dash-app');
    if (!root) return;

    const collabSection = document.getElementById('dash-collab-section');
    const moderatorEl = document.getElementById('dash-moderator');
    const fbList = document.getElementById('dash-fb-list');
    const fbEmpty = document.getElementById('dash-fb-empty');
    const fbStatus = document.getElementById('dash-fb-status');
    const fbRefresh = document.getElementById('dash-fb-refresh');
    const cardsGrid = document.getElementById('dash-cards-grid');
    const cardsEmpty = document.getElementById('dash-cards-empty');
    const cardsStatus = document.getElementById('dash-cards-status');
    const cardsRefresh = document.getElementById('dash-cards-refresh');

    function setDashView(name) {
      const view = String(name || 'home').trim() || 'home';
      root.querySelectorAll('[data-dash-view]').forEach((el) => {
        const v = el.getAttribute('data-dash-view');
        const on = v === view;
        el.toggleAttribute('hidden', !on);
        el.classList.toggle('dash-view--active', on);
      });
      if (collabSection) {
        collabSection.hidden = view !== 'home';
      }
    }

    window.__dashGoHome = () => setDashView('home');

    document.getElementById('dash-open-feedback')?.addEventListener('click', () => {
      setDashView('feedback');
      loadFeedback();
    });
    document.getElementById('dash-open-cards-hub')?.addEventListener('click', () => setDashView('cards-hub'));
    document.getElementById('dash-open-cards-edit')?.addEventListener('click', () => {
      setDashView('cards-edit');
      renderIndexOrderList();
      loadCards();
    });
    document.getElementById('dash-open-cards-create')?.addEventListener('click', () => {
      resetCardWizard();
      setDashView('cards-create');
    });

    /** Delegação: clique no texto dentro do botão «VOLTAR» também volta ao destino certo. */
    root.addEventListener('click', (e) => {
      const el = e.target instanceof Element ? e.target : e.target.parentElement;
      const back = el?.closest('[data-dash-back]');
      if (!back || !root.contains(back)) return;
      e.preventDefault();
      const target = back.getAttribute('data-dash-back') || 'home';
      setDashView(target);
    });

    root.querySelectorAll('[data-dash-fb-scope]').forEach((btn) => {
      btn.addEventListener('click', () => {
        fbScope = btn.dataset.dashFbScope || 'pending';
        root.querySelectorAll('[data-dash-fb-scope]').forEach((b) => {
          b.classList.toggle('active', b.dataset.dashFbScope === fbScope);
        });
        loadFeedback();
      });
    });

    function renderIndexOrderList() {
      const ul = document.getElementById('dash-index-order-list');
      if (!ul) return;
      ul.innerHTML = '';
      const order = getIndexCardOrder();
      order.forEach((slug, idx) => {
        const def = BUILDXP_INDEX_CARD_DEFS.find((d) => d.slug === slug);
        if (!def) return;
        const li = document.createElement('li');
        li.className = 'dash-index-order-item';
        const row = document.createElement('div');
        row.className = 'dash-index-order-row';
        row.innerHTML = `
          <span class="dash-index-order-label">${dashEscapeHtml(def.label)}</span>
          <code class="dash-index-order-slug">${dashEscapeHtml(slug)}</code>
          <div class="dash-index-order-btns">
            <button type="button" class="term-btn ghost" data-idx-move="${idx}" data-dir="-1" ${idx === 0 ? 'disabled' : ''}>↑</button>
            <button type="button" class="term-btn ghost" data-idx-move="${idx}" data-dir="1" ${idx === order.length - 1 ? 'disabled' : ''}>↓</button>
          </div>
          <button type="button" class="term-btn primary" data-edit-slug="${slug}">FORM + SLIDES</button>
        `;
        li.appendChild(row);
        ul.appendChild(li);
      });
      ul.querySelectorAll('[data-edit-slug]').forEach((btn) => {
        btn.addEventListener('click', () => {
          const slug = btn.getAttribute('data-edit-slug');
          if (slug) openIndexCardForDeepEdit(slug);
        });
      });
      ul.querySelectorAll('[data-idx-move]').forEach((b) => {
        b.addEventListener('click', () => {
          const i = Number.parseInt(b.getAttribute('data-idx-move'), 10);
          const dir = Number.parseInt(b.getAttribute('data-dir'), 10);
          const o = getIndexCardOrder();
          const j = i + dir;
          if (j < 0 || j >= o.length) return;
          const t = o[i];
          o[i] = o[j];
          o[j] = t;
          setIndexCardOrder(o);
          renderIndexOrderList();
          applyIndexCardOrder();
        });
      });
    }

    let editSlides = [];
    let editSlidesSlug = null;
    let cardEditorStepIndex = 0;

    function syncSlideEditThemeFromForm() {
      const panel = document.getElementById('dash-card-editor-theme-host');
      if (!panel) return;
      const raw = String(document.getElementById('dash-card-theme')?.value || 'git')
        .toLowerCase()
        .replace(/[^a-z]/g, '');
      const theme = ['docker', 'npm', 'dotnet'].includes(raw) ? raw : 'git';
      panel.classList.remove('c-git', 'c-docker', 'c-npm', 'c-dotnet', 'dash-slide-theme-host');
      panel.classList.add('dash-slide-theme-host', `c-${theme}`);
    }

    function getEditSlidesContentOnly() {
      return editSlides.filter((s) => s && s.type !== 'fin');
    }

    function getCardEditorStepCount() {
      return 1 + getEditSlidesContentOnly().length;
    }

    async function loadCardEditorSlidesData(slug) {
      if (!slug) {
        editSlidesSlug = null;
        editSlides = [];
        renderEditSlides();
        return false;
      }
      const def = BUILDXP_INDEX_CARD_DEFS.find((d) => d.slug === slug);
      if (!def) {
        editSlidesSlug = null;
        editSlides = [];
        renderEditSlides();
        return false;
      }
      editSlidesSlug = slug;
      editSlides = await dashLoadSlidesForSlug(slug);
      renderEditSlides();
      return true;
    }

    function setCardEditorScreenTitles(primary, sub) {
      const t = document.getElementById('dash-card-editor-screen-title');
      const s = document.getElementById('dash-card-editor-screen-sub');
      if (t) t.textContent = primary || 'Editar';
      if (s) s.textContent = sub || '';
    }

    function mountOneSlideEditor(rootEl, slide, headTitle) {
      if (!slide || slide.type === 'fin') return;
      try {
        const wrap = document.createElement('div');
        wrap.className = 'dash-wiz-slide-editor';
        wrap.dataset.slideId = slide.id || dashNewSlideId();
        if (!slide.id) slide.id = wrap.dataset.slideId;
        if (!slide.type) slide.type = 'content';

        if (slide.type === 'pause') {
          wrap.innerHTML = `
            <div class="dash-wiz-slide-head">
              <span class="ref-section-title" style="margin:0;">${dashEscapeHtml(headTitle)}</span>
              <button type="button" class="term-btn ghost danger dash-wiz-remove" data-rid="${slide.id}">REMOVER</button>
            </div>
            <label class="fb-label">Texto (corpo da pausa, como no site)</label>
            <div class="dash-slide-pause-text">
              <textarea class="fb-input fb-textarea dash-wiz-ta" data-f="text" rows="5"></textarea>
            </div>
            <label class="fb-label">Observação (opcional — mesmo padrão de borda do site)</label>
            <div class="callout callout-tip dash-slide-obs-wrap">
              <textarea class="dash-slide-obs-ta dash-wiz-ta" data-f="observation" rows="3" spellcheck="false"></textarea>
            </div>
          `;
          wrap.querySelector('[data-f="text"]').value = slide.text || '';
          wrap.querySelector('[data-f="observation"]').value = slide.observation || '';
        } else {
          wrap.innerHTML = `
            <div class="dash-wiz-slide-head">
              <span class="ref-section-title" style="margin:0;">${dashEscapeHtml(headTitle)}</span>
              <button type="button" class="term-btn ghost danger dash-wiz-remove" data-rid="${slide.id}">REMOVER</button>
            </div>
            <label class="fb-label">Título do slide
              <input type="text" class="fb-input dash-wiz-title-inp" maxlength="200" />
            </label>
            <div class="dash-wiz-inner-tabs" role="tablist">
              <button type="button" class="dash-wiz-inner-tab active" data-itab="text">TEXTO</button>
              <button type="button" class="dash-wiz-inner-tab" data-itab="cmd">COMANDOS</button>
              <button type="button" class="dash-wiz-inner-tab" data-itab="obs">OBSERVAÇÃO</button>
            </div>
            <div class="dash-wiz-inner-pane active" data-ipane="text">
              <label class="fb-label">Conteúdo (HTML)
                <textarea class="fb-input fb-textarea dash-wiz-ta" data-f="text" rows="6"></textarea>
              </label>
            </div>
            <div class="dash-wiz-inner-pane" data-ipane="cmd" hidden>
              <p class="dash-muted dash-slide-tab-hint">Bloco de comandos — mesma caixa colorida do treino (cor do card em Tema).</p>
              <div class="cmd-block dash-slide-cmd-block">
                <textarea class="dash-slide-cmd-ta dash-wiz-ta mono" data-f="commands" rows="10" spellcheck="false" placeholder="Comandos, um por linha…"></textarea>
              </div>
            </div>
            <div class="dash-wiz-inner-pane" data-ipane="obs" hidden>
              <p class="dash-muted dash-slide-tab-hint">Observação — mesmo estilo de callout (borda) das páginas publicadas.</p>
              <div class="callout callout-tip dash-slide-obs-wrap">
                <textarea class="dash-slide-obs-ta dash-wiz-ta" data-f="observation" rows="5" spellcheck="false" placeholder="Opcional — deixe vazio se não quiser observação neste slide."></textarea>
              </div>
            </div>
          `;
          const tin = wrap.querySelector('.dash-wiz-title-inp');
          if (tin) tin.value = slide.title || '';
          tin?.addEventListener('input', () => {
            slide.title = tin.value;
          });
          wrap.querySelector('[data-f="text"]').value = slide.text || '';
          wrap.querySelector('[data-f="commands"]').value = slide.commands || '';
          wrap.querySelector('[data-f="observation"]').value = slide.observation || '';
        }

        wrap.querySelectorAll('.dash-wiz-ta').forEach((ta) => {
          ta.addEventListener('input', () => {
            const f = ta.getAttribute('data-f');
            if (f) slide[f] = ta.value;
          });
        });

        wrap.querySelectorAll('.dash-wiz-remove').forEach((rb) => {
          rb.addEventListener('click', () => {
            const rid = rb.getAttribute('data-rid');
            const csBefore = getEditSlidesContentOnly();
            const removedIdx = csBefore.findIndex((x) => x.id === rid);
            editSlides = editSlides.filter((s) => s.id !== rid);
            const newCount = getCardEditorStepCount();
            if (cardEditorStepIndex > 0 && removedIdx >= 0 && removedIdx < cardEditorStepIndex) {
              cardEditorStepIndex -= 1;
            }
            if (cardEditorStepIndex >= newCount) cardEditorStepIndex = Math.max(0, newCount - 1);
            renderEditSlides();
          });
        });

        wrap.querySelectorAll('.dash-wiz-inner-tab').forEach((tab) => {
          tab.addEventListener('click', () => {
            const key = tab.getAttribute('data-itab');
            wrap.querySelectorAll('.dash-wiz-inner-tab').forEach((t) => t.classList.toggle('active', t === tab));
            wrap.querySelectorAll('.dash-wiz-inner-pane').forEach((p) => {
              p.hidden = p.getAttribute('data-ipane') !== key;
              p.classList.toggle('active', p.getAttribute('data-ipane') === key);
            });
          });
        });

        rootEl.appendChild(wrap);
      } catch (_) {
        /* ignorado */
      }
    }

    function renderCardEditorChrome() {
      const meta = document.getElementById('dash-card-editor-step-meta');
      const slidesPane = document.getElementById('dash-card-editor-step-slides');
      const rootEl = document.getElementById('dash-edit-slides-root');
      const stepLabelEl = document.getElementById('dash-card-editor-step-label');
      const prevBtn = document.getElementById('dash-card-editor-prev');
      const nextBtn = document.getElementById('dash-card-editor-next');
      const addBar = document.getElementById('dash-card-editor-addbar');
      if (!meta || !slidesPane || !rootEl) return;

      const n = getCardEditorStepCount();
      if (cardEditorStepIndex >= n) cardEditorStepIndex = Math.max(0, n - 1);
      if (cardEditorStepIndex < 0) cardEditorStepIndex = 0;

      if (addBar) addBar.hidden = !editSlidesSlug;

      if (cardEditorStepIndex === 0) {
        meta.hidden = false;
        slidesPane.hidden = true;
        if (stepLabelEl) stepLabelEl.textContent = `1 / ${n} · Card (metadados · API)`;
      } else {
        meta.hidden = true;
        slidesPane.hidden = false;
        const cs = getEditSlidesContentOnly();
        const idx = cardEditorStepIndex - 1;
        const slide = cs[idx];
        if (stepLabelEl) {
          const kind = slide?.type === 'pause' ? 'Pausa' : 'Conteúdo';
          stepLabelEl.textContent = `${cardEditorStepIndex + 1} / ${n} · ${kind}`;
        }
        rootEl.innerHTML = '';
        if (slide) {
          let headTitle = `SLIDE ${idx + 1}`;
          if (slide.type === 'pause') {
            headTitle = `PAUSA ${cs.slice(0, idx + 1).filter((x) => x.type === 'pause').length}`;
          } else {
            headTitle = `SLIDE ${cs.slice(0, idx + 1).filter((x) => x.type !== 'pause').length}`;
          }
          mountOneSlideEditor(rootEl, slide, headTitle);
        } else if (editSlidesSlug) {
          const def = BUILDXP_INDEX_CARD_DEFS.find((d) => d.slug === editSlidesSlug);
          const pageHint = def ? dashEscapeHtml(def.page) : editSlidesSlug;
          rootEl.innerHTML = `
            <div class="dash-edit-slides-empty dash-muted" style="padding:1rem;border:1px dashed rgba(255,255,255,0.2);border-radius:8px;">
              <p style="margin:0 0 0.5rem;"><strong>Nenhum slide de conteúdo carregado</strong> para <code>${dashEscapeHtml(editSlidesSlug)}</code>.</p>
              <p style="margin:0;">Sirva o dashboard por HTTP na mesma pasta que <code>${pageHint || '—'}</code> para o navegador carregar o HTML do treino, ou use «+ slide» acima. Abrir em <code>file://</code> costuma bloquear o carregamento.</p>
            </div>`;
        }
      }
      if (prevBtn) prevBtn.disabled = cardEditorStepIndex <= 0;
      if (nextBtn) nextBtn.disabled = cardEditorStepIndex >= n - 1;
      syncSlideEditThemeFromForm();
    }

    function renderEditSlides() {
      renderCardEditorChrome();
    }

    async function openIndexCardForDeepEdit(slug) {
      const def = BUILDXP_INDEX_CARD_DEFS.find((d) => d.slug === slug);
      if (!def) return;
      const staticD = INDEX_CARD_STATIC_DEFAULTS[slug];
      editingCardSlug = slug;
      if (staticD) dashApplyCardToForm(staticD);
      try {
        const raw = await fetchJson(`/api/card/${encodeURIComponent(slug)}`);
        dashApplyCardToForm(raw);
      } catch (_) {
        /* mantém estático */
      }
      setSlugLocked(true);
      await loadCardEditorSlidesData(slug);
      setDashView('card-editor');
      setCardEditorScreenTitles(`Editar · ${def.label}`, `slug: ${slug}`);
      cardEditorStepIndex = getEditSlidesContentOnly().length ? 1 : 0;
      renderCardEditorChrome();
    }

    function insertEditSlideBeforeFin(newSlide) {
      const finIdx = editSlides.findIndex((s) => s.type === 'fin');
      if (finIdx >= 0) editSlides.splice(finIdx, 0, newSlide);
      else editSlides.push(newSlide);
    }

    document.getElementById('dash-slides-save')?.addEventListener('click', async () => {
      if (!editSlidesSlug) return;

      const def = BUILDXP_INDEX_CARD_DEFS.find((d) => d.slug === editSlidesSlug);
      if (!def) return;

      let cardId = typeof def.id === 'number' ? def.id : 0;
      if (!cardId) {
        try {
          const data = await fetchJson('/api/card');
          const arr = Array.isArray(data) ? data : data?.items ?? data?.data ?? [];
          const raw = arr.find(
            (c) => String(c.slug ?? c.Slug ?? '').toLowerCase() === String(editSlidesSlug).toLowerCase(),
          );
          cardId = Number(raw?.id ?? raw?.Id ?? 0) || 0;
        } catch (_) { /* ignore */ }
      }

      const slidesParaSalvar = getEditSlidesContentOnly();

      try {
        for (const [idx, slide] of slidesParaSalvar.entries()) {
          const body = {
            cardId: cardId || 0,
            ordem: idx + 1,
            titulo: slide.title || '',
            descricao: slide.text || '',
            codigoBloco: slide.commands || null,
            tipo: slide.type === 'pause' ? 'Pausa' : 'Conteudo',
          };

          if (slide._apiId) {
            await fetchJson(`/api/card/slides/${slide._apiId}`, {
              method: 'PUT',
              body: JSON.stringify(body),
            });
          } else {
            const postPath =
              cardId > 0
                ? `/api/card/${cardId}/slides`
                : `/api/card/${encodeURIComponent(editSlidesSlug)}/slides`;
            const criado = await fetchJson(postPath, {
              method: 'POST',
              body: JSON.stringify(body),
            });
            slide._apiId = criado?.id ?? criado?.Id ?? null;
          }
        }

        try {
          localStorage.setItem(dashSlidesStorageKey(editSlidesSlug), JSON.stringify(editSlides));
        } catch (_) { /* ignore */ }

        const btn = document.getElementById('dash-slides-save');
        if (btn) {
          const original = btn.textContent;
          btn.textContent = '✓ SALVO';
          btn.disabled = true;
          setTimeout(() => {
            btn.textContent = original;
            btn.disabled = false;
          }, 2000);
        }
      } catch (e) {
        try {
          localStorage.setItem(dashSlidesStorageKey(editSlidesSlug), JSON.stringify(editSlides));
        } catch (_) { /* ignore */ }
        const extra =
          e?.status === 401
            ? ' Faça login com o utilizador admin (JWT).'
            : e?.message
              ? ` (${e.message})`
              : '';
        alert('Erro ao salvar na API. Salvo apenas localmente.' + extra);
      }
    });

    document.getElementById('dash-card-editor-prev')?.addEventListener('click', () => {
      if (cardEditorStepIndex > 0) {
        cardEditorStepIndex -= 1;
        renderCardEditorChrome();
      }
    });
    document.getElementById('dash-card-editor-next')?.addEventListener('click', () => {
      const n = getCardEditorStepCount();
      if (cardEditorStepIndex < n - 1) {
        cardEditorStepIndex += 1;
        renderCardEditorChrome();
      }
    });

    document.getElementById('dash-edit-add-content')?.addEventListener('click', () => {
      if (!editSlidesSlug) return;
      insertEditSlideBeforeFin({
        id: dashNewSlideId(),
        type: 'content',
        title: '',
        text: '',
        commands: '',
        observation: '',
      });
      cardEditorStepIndex = getCardEditorStepCount() - 1;
      renderCardEditorChrome();
    });

    document.getElementById('dash-edit-add-pause')?.addEventListener('click', () => {
      if (!editSlidesSlug) return;
      insertEditSlideBeforeFin({
        id: dashNewSlideId(),
        type: 'pause',
        text: '',
        observation: '',
      });
      cardEditorStepIndex = getCardEditorStepCount() - 1;
      renderCardEditorChrome();
    });

    let wizSlides = [];
    let wizIconDataUrl = '';

    function resetCardWizard() {
      wizSlides = [];
      wizIconDataUrl = '';
      const ids = ['dash-wiz-title', 'dash-wiz-badge', 'dash-wiz-class', 'dash-wiz-desc', 'dash-wiz-xpc', 'dash-wiz-xpm'];
      ids.forEach((id) => {
        const el = document.getElementById(id);
        if (!el) return;
        if (el.type === 'number') el.value = id === 'dash-wiz-xpm' ? '3000' : '0';
        else el.value = '';
      });
      const file = document.getElementById('dash-wiz-icon-file');
      if (file) file.value = '';
      const prev = document.getElementById('dash-wiz-icon-preview');
      if (prev) {
        prev.removeAttribute('src');
        prev.hidden = true;
      }
      const meta = document.getElementById('dash-create-step-meta');
      const slides = document.getElementById('dash-create-step-slides');
      if (meta) meta.hidden = false;
      if (slides) slides.hidden = true;
      const st = document.getElementById('dash-wiz-status');
      if (st) st.textContent = '';
    }

    function buildWizMeta() {
      return {
        title: document.getElementById('dash-wiz-title')?.value?.trim() || '',
        badge: document.getElementById('dash-wiz-badge')?.value?.trim() || '',
        cardClass: document.getElementById('dash-wiz-class')?.value?.trim() || '',
        desc: document.getElementById('dash-wiz-desc')?.value?.trim() || '',
        xpCurrent: Number.parseInt(document.getElementById('dash-wiz-xpc')?.value, 10) || 0,
        xpMax: Number.parseInt(document.getElementById('dash-wiz-xpm')?.value, 10) || 3000,
        iconDataUrl: wizIconDataUrl || null,
      };
    }

    function renderWizSlides() {
      const rootEl = document.getElementById('dash-wiz-slides-root');
      if (!rootEl) return;
      rootEl.innerHTML = '';
      wizSlides.forEach((slide, slideIndex) => {
        const wrap = document.createElement('div');
        wrap.className = 'dash-wiz-slide-editor';
        wrap.dataset.slideId = slide.id;

        if (slide.type === 'pause') {
          wrap.innerHTML = `
            <div class="dash-wiz-slide-head">
              <span class="ref-section-title" style="margin:0;">PAUSA ${slideIndex + 1}</span>
              <button type="button" class="term-btn ghost danger dash-wiz-remove" data-rid="${slide.id}">REMOVER</button>
            </div>
            <label class="fb-label">Texto
              <textarea class="fb-input fb-textarea dash-wiz-ta" data-f="text" rows="4"></textarea>
            </label>
            <label class="fb-label">Observação (opcional — some no slide se vazio)
              <textarea class="fb-input fb-textarea dash-wiz-ta" data-f="observation" rows="2"></textarea>
            </label>
          `;
          wrap.querySelector('[data-f="text"]').value = slide.text || '';
          wrap.querySelector('[data-f="observation"]').value = slide.observation || '';
        } else {
          wrap.innerHTML = `
            <div class="dash-wiz-slide-head">
              <span class="ref-section-title" style="margin:0;">SLIDE ${slideIndex + 1}</span>
              <button type="button" class="term-btn ghost danger dash-wiz-remove" data-rid="${slide.id}">REMOVER</button>
            </div>
            <div class="dash-wiz-inner-tabs" role="tablist">
              <button type="button" class="dash-wiz-inner-tab active" data-itab="text">TEXTO</button>
              <button type="button" class="dash-wiz-inner-tab" data-itab="cmd">COMANDOS</button>
              <button type="button" class="dash-wiz-inner-tab" data-itab="obs">OBSERVAÇÃO</button>
            </div>
            <div class="dash-wiz-inner-pane active" data-ipane="text">
              <label class="fb-label">Conteúdo (texto / HTML simples)
                <textarea class="fb-input fb-textarea dash-wiz-ta" data-f="text" rows="6"></textarea>
              </label>
            </div>
            <div class="dash-wiz-inner-pane" data-ipane="cmd" hidden>
              <label class="fb-label">Bloco verde (comandos)
                <textarea class="fb-input fb-textarea dash-wiz-ta mono" data-f="commands" rows="8" placeholder="npm install ..."></textarea>
              </label>
            </div>
            <div class="dash-wiz-inner-pane" data-ipane="obs" hidden>
              <label class="fb-label">Observação na borda verde (opcional)
                <textarea class="fb-input fb-textarea dash-wiz-ta" data-f="observation" rows="3"></textarea>
              </label>
            </div>
          `;
          wrap.querySelector('[data-f="text"]').value = slide.text || '';
          wrap.querySelector('[data-f="commands"]').value = slide.commands || '';
          wrap.querySelector('[data-f="observation"]').value = slide.observation || '';
        }

        wrap.querySelectorAll('.dash-wiz-ta').forEach((ta) => {
          ta.addEventListener('input', () => {
            const f = ta.getAttribute('data-f');
            if (f) slide[f] = ta.value;
          });
        });

        wrap.querySelectorAll('.dash-wiz-remove').forEach((rb) => {
          rb.addEventListener('click', () => {
            const rid = rb.getAttribute('data-rid');
            wizSlides = wizSlides.filter((s) => s.id !== rid);
            renderWizSlides();
          });
        });

        wrap.querySelectorAll('.dash-wiz-inner-tab').forEach((tab) => {
          tab.addEventListener('click', () => {
            const key = tab.getAttribute('data-itab');
            wrap.querySelectorAll('.dash-wiz-inner-tab').forEach((t) => t.classList.toggle('active', t === tab));
            wrap.querySelectorAll('.dash-wiz-inner-pane').forEach((p) => {
              p.hidden = p.getAttribute('data-ipane') !== key;
              p.classList.toggle('active', p.getAttribute('data-ipane') === key);
            });
          });
        });

        rootEl.appendChild(wrap);
      });
    }

    document.getElementById('dash-wiz-icon-file')?.addEventListener('change', (ev) => {
      const f = ev.target.files?.[0];
      if (!f) return;
      const reader = new FileReader();
      reader.onload = () => {
        wizIconDataUrl = typeof reader.result === 'string' ? reader.result : '';
        const img = document.getElementById('dash-wiz-icon-preview');
        if (img && wizIconDataUrl) {
          img.src = wizIconDataUrl;
          img.hidden = false;
        }
      };
      reader.readAsDataURL(f);
    });

    document.getElementById('dash-wiz-to-slides')?.addEventListener('click', () => {
      const m = buildWizMeta();
      if (!m.title || !m.badge || !m.cardClass) {
        const st = document.getElementById('dash-wiz-status');
        if (st) st.textContent = '';
        return;
      }
      const metaEl = document.getElementById('dash-create-step-meta');
      const slidesEl = document.getElementById('dash-create-step-slides');
      if (metaEl) metaEl.hidden = true;
      if (slidesEl) slidesEl.hidden = false;
      if (!wizSlides.length) {
        wizSlides.push({ id: dashNewSlideId(), type: 'content', text: '', commands: '', observation: '' });
      }
      renderWizSlides();
    });

    document.getElementById('dash-wiz-back-meta')?.addEventListener('click', () => {
      const metaEl = document.getElementById('dash-create-step-meta');
      const slidesEl = document.getElementById('dash-create-step-slides');
      if (metaEl) metaEl.hidden = false;
      if (slidesEl) slidesEl.hidden = true;
    });

    document.getElementById('dash-wiz-add-content')?.addEventListener('click', () => {
      wizSlides.push({ id: dashNewSlideId(), type: 'content', text: '', commands: '', observation: '' });
      renderWizSlides();
    });

    document.getElementById('dash-wiz-add-pause')?.addEventListener('click', () => {
      wizSlides.push({ id: dashNewSlideId(), type: 'pause', text: '', observation: '' });
      renderWizSlides();
    });

    document.getElementById('dash-wiz-save-draft')?.addEventListener('click', () => {
      const meta = buildWizMeta();
      if (!meta.title) return;
      const publishedSlides = wizSlides.map((s) => {
        if (s.type === 'pause') {
          return {
            type: 'pause',
            text: s.text || '',
            observation: (s.observation || '').trim() || null,
          };
        }
        return {
          type: 'content',
          text: s.text || '',
          commands: s.commands || '',
          observation: (s.observation || '').trim() || null,
        };
      });
      const finalSlide = {
        type: 'fin',
        title: 'Conclusão',
        actions: ['voltar_inicio', 'iniciar_treinamento'],
      };
      const bundle = {
        version: 1,
        meta,
        slides: publishedSlides,
        finalSlide,
        savedAt: new Date().toISOString(),
      };
      try {
        let arr = [];
        try {
          arr = JSON.parse(localStorage.getItem(BUILDXP_WIZ_DRAFT_KEY) || '[]');
        } catch (_) {
          arr = [];
        }
        if (!Array.isArray(arr)) arr = [];
        arr.push(bundle);
        localStorage.setItem(BUILDXP_WIZ_DRAFT_KEY, JSON.stringify(arr));
        const st = document.getElementById('dash-wiz-status');
        if (st) st.textContent = '';
      } catch (_) { /* ignore */ }
    });

    try {
      moderatorEl.value = sessionStorage.getItem('buildxp_moderator') || '';
    } catch (_) { /* ignore */ }

    moderatorEl?.addEventListener('change', () => {
      try {
        sessionStorage.setItem('buildxp_moderator', String(moderatorEl.value || '').trim());
      } catch (_) { /* ignore */ }
    });

    document.getElementById('dash-card-theme')?.addEventListener('change', () => {
      syncSlideEditThemeFromForm();
    });

    function setFbStatus(msg, type) {
      if (!fbStatus) return;
      fbStatus.textContent = msg || '';
      fbStatus.classList.toggle('ok', type === 'ok');
      fbStatus.classList.toggle('bad', type === 'bad');
    }

    function setCardsStatus(msg, type) {
      if (!cardsStatus) return;
      cardsStatus.textContent = msg || '';
      cardsStatus.classList.toggle('ok', type === 'ok');
      cardsStatus.classList.toggle('bad', type === 'bad');
    }

    async function fetchJson(path, opts = {}) {
      const base = getBuildXpApiBase();
      const url = `${base}${path}`;
      const token = getToken(); // mesmo token JWT
    
      const res = await fetch(url, {
        ...opts,
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          ...(opts.headers || {}),
        },
      });
      const text = await res.text();
      let data = null;
      try {
        data = text ? JSON.parse(text) : null;
      } catch (_) {
        data = text;
      }
      if (!res.ok) {
        const msg =
          typeof data === 'object' && data !== null && data.message
            ? String(data.message)
            : res.statusText || 'Erro HTTP';
        const err = new Error(msg);
        err.status = res.status;
        err.body = data;
        throw err;
      }
      return data;
    }

    function fmtDate(iso) {
      try {
        const d = new Date(iso);
        return d.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
      } catch (_) {
        return String(iso || '');
      }
    }

    async function loadFeedback() {
      if (!fbList || !fbEmpty) return;
      fbList.innerHTML = '';
      fbEmpty.hidden = true;
      setFbStatus('', '');
      const path =
      fbScope === 'history'
        ? '/api/feedback/dashboard'
        : '/api/feedback/dashboard?status=Pendente';
      try {
        const data = await fetchJson(path);
        const arr = Array.isArray(data) ? data : data?.items ?? data?.data ?? [];
        let items = arr.map(dashNormalizePending).filter(Boolean);
        if (fbScope === 'history') {
          items = items.filter((it) => {
            const st = String(it.status || '').toLowerCase();
            return st === 'approved' || st === 'rejected';
          });
        }
        setFbStatus('', '');
        if (!items.length) {
          fbEmpty.hidden = false;
          fbEmpty.textContent = '';
          return;
        }
        items.forEach((it) => {
        const st = String(it.status || 'pending').toLowerCase();
        const stClass = st.replace(/[^a-z]/g, '') || 'pending';
        const canModerate = st === 'pending';
        const row = document.createElement('article');
        row.className = 'dash-queue-item';
        row.innerHTML = `
          <div class="dash-queue-top">
            <span class="fb-kind">${dashEscapeHtml(it.kind)}</span>
            <span class="dash-fb-status dash-fb-status--${stClass}">${dashEscapeHtml(st)}</span>
          </div>
          <div class="fb-meta">${dashEscapeHtml(it.name ? `${it.name} · ` : '')}${dashEscapeHtml(fmtDate(it.createdAt))}</div>
          <div class="dash-queue-msg"></div>
          <div class="dash-queue-actions"></div>
        `;
        row.querySelector('.dash-queue-msg').textContent = it.msg;
        const actions = row.querySelector('.dash-queue-actions');
        if (canModerate) {
          const approveBtn = document.createElement('button');
          approveBtn.type = 'button';
          approveBtn.className = 'term-btn primary';
          approveBtn.textContent = 'APROVAR';
          approveBtn.addEventListener('click', () => moderate(it.id, 'approved'));
          const rejectBtn = document.createElement('button');
          rejectBtn.type = 'button';
          rejectBtn.className = 'term-btn ghost danger';
          rejectBtn.textContent = 'REJEITAR';
          rejectBtn.addEventListener('click', () => moderate(it.id, 'rejected'));
          actions.appendChild(approveBtn);
          actions.appendChild(rejectBtn);
        }
        fbList.appendChild(row);
      });
    } catch (e) {
      setFbStatus('', '');
      fbEmpty.hidden = false;
      fbEmpty.textContent = '';
    }
  }

  async function moderate(id, action) {
    const mod = String(moderatorEl?.value || '').trim() || 'moderador';
    setFbStatus('', '');
    try {
      // nosso backend tem rotas separadas para aprovar e rejeitar
      const endpoint = action === 'approved'
        ? `/api/feedback/${encodeURIComponent(id)}/aprovar`
        : `/api/feedback/${encodeURIComponent(id)}/rejeitar`;
  
      await fetchJson(endpoint, { method: 'PATCH' });
      setFbStatus('', '');
      await loadFeedback();
    } catch (e) {
      setFbStatus('', '');
    }
  }

  async function loadCards() {
    if (!cardsGrid || !cardsEmpty) return;
    cardsGrid.innerHTML = '';
    cardsEmpty.hidden = true;
    setCardsStatus('', '');
    try {
      const data = await fetchJson('/api/card');
      const arr = Array.isArray(data) ? data : data?.items ?? data?.data ?? [];
      const cards = arr.map(dashNormalizeCard).filter((c) => c.slug);
      setCardsStatus('', '');
      if (!cards.length) {
        cardsEmpty.hidden = false;
        cardsEmpty.textContent = '';
        return;
      }
      cards.forEach((c) => {
        const theme = String(c.theme || 'git').toLowerCase().replace(/[^a-z]/g, '') || 'git';
        const tileTheme = theme === 'dotnet' ? 'dotnet' : theme;
        const el = document.createElement('div');
        el.className = `dash-card-tile c-${tileTheme}`;
        el.innerHTML = `
          <div class="dash-card-tile-rarity">${dashEscapeHtml(c.rarity || '—')}</div>
          <div class="dash-card-tile-name">${dashEscapeHtml(c.display_name)}</div>
          <div class="dash-card-tile-slug"><code>${dashEscapeHtml(c.slug)}</code></div>
          <div class="dash-card-tile-actions"></div>
        `;
        const act = el.querySelector('.dash-card-tile-actions');
        const editBtn = document.createElement('button');
        editBtn.type = 'button';
        editBtn.className = 'term-btn ghost';
        editBtn.textContent = 'FORM + SLIDES';
        editBtn.addEventListener('click', () => loadCardForEdit(c.slug));
        act.appendChild(editBtn);
        cardsGrid.appendChild(el);
      });
    } catch (e) {
      setCardsStatus('', '');
      cardsEmpty.hidden = false;
      cardsEmpty.textContent = '';
    }
  }

  const cardForm = document.getElementById('dash-card-form');
  const cardFormStatus = document.getElementById('dash-card-form-status');

  function setCardFormStatus(msg, type) {
    if (!cardFormStatus) return;
    cardFormStatus.textContent = msg || '';
    cardFormStatus.classList.toggle('ok', type === 'ok');
    cardFormStatus.classList.toggle('bad', type === 'bad');
  }

  function setSlugLocked(locked) {
    const s = document.getElementById('dash-card-slug');
    if (s) s.readOnly = !!locked;
  }

  async function loadCardForEdit(slug) {
    setCardFormStatus('', '');
    try {
      const raw = await fetchJson(`/api/card/${encodeURIComponent(slug)}`);
      editingCardSlug = slug;
      dashApplyCardToForm(raw);
      setSlugLocked(true);
      setCardFormStatus('', '');
      await loadCardEditorSlidesData(slug);
      setDashView('card-editor');
      const disp = document.getElementById('dash-card-display')?.value?.trim() || slug;
      setCardEditorScreenTitles(`Editar · ${disp}`, `slug: ${slug}`);
      cardEditorStepIndex = getEditSlidesContentOnly().length ? 1 : 0;
      renderCardEditorChrome();
    } catch (e) {
      editingCardSlug = null;
      setSlugLocked(false);
      setCardFormStatus('', '');
      await loadCardEditorSlidesData(null);
    }
  }

  const cardsEditViewEl = () => root.querySelector('[data-dash-view="cards-edit"]');
  const isCardsEditViewActive = () => {
    const el = cardsEditViewEl();
    return !!(el && !el.hasAttribute('hidden'));
  };
  const isCardEditorViewActive = () => {
    const el = root.querySelector('[data-dash-view="card-editor"]');
    return !!(el && !el.hasAttribute('hidden'));
  };

  cardForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    if ((isCardsEditViewActive() || isCardEditorViewActive()) && !editingCardSlug) {
      setCardFormStatus('Selecione um card (FORM + SLIDES na grade ou na lista «CARDS NO INDEX»). Criar card novo é só na aba «Criar card».', 'bad');
      return;
    }
    const slugInput = document.getElementById('dash-card-slug').value.trim();
    const slug = editingCardSlug || slugInput;
    if (!slug) {
      setCardFormStatus('', '');
      return;
    }
    const secondary = document.getElementById('dash-card-icon-sec').value.trim();
    const body = {
      slug,
      theme: document.getElementById('dash-card-theme').value,
      rarity_label: document.getElementById('dash-card-rarity').value.trim(),
      card_class: document.getElementById('dash-card-class').value.trim(),
      display_name: document.getElementById('dash-card-display').value.trim(),
      description_html: document.getElementById('dash-card-desc').value,
      link_beginner: document.getElementById('dash-card-link-b').value.trim(),
      link_ref: document.getElementById('dash-card-link-r').value.trim(),
      xp_current: Number.parseInt(document.getElementById('dash-card-xpc').value, 10) || 0,
      xp_max: Number.parseInt(document.getElementById('dash-card-xpm').value, 10) || 3000,
      sort_order: Number.parseInt(document.getElementById('dash-card-sort').value, 10) || 0,
      btn_primary_label: document.getElementById('dash-card-btn1').value.trim() || '▶ COMEÇAR',
      btn_secondary_label: document.getElementById('dash-card-btn2').value.trim() || '🎮 CHEAT CODES',
      icon_layout: document.getElementById('dash-card-icon-layout').value || 'single',
      icon_primary_src: document.getElementById('dash-card-icon-pri').value.trim() || 'imagens/logo2buildxpret.png',
      icon_primary_alt: document.getElementById('dash-card-icon-pri-alt').value.trim(),
      icon_secondary_src: secondary || null,
      icon_secondary_alt: document.getElementById('dash-card-icon-sec-alt').value.trim(),
      is_published: document.getElementById('dash-card-published').checked,
    };
    setCardFormStatus('', '');
    try {
      // Rotas corretas: singular /api/card; PUT para atualizar (backend).
      if (editingCardSlug) {
        await fetchJson(`/api/card/${encodeURIComponent(editingCardSlug)}`, {
          method: 'PUT', // backend usa PUT para editar
          body: JSON.stringify(body),
        });
      } else if (!isCardsEditViewActive() && !isCardEditorViewActive()) {
        await fetchJson('/api/card', {
          method: 'POST',
          body: JSON.stringify(body),
        });
      } else {
        setCardFormStatus('Não é possível criar card nesta aba.', 'bad');
        return;
      }
      setCardFormStatus('', '');
      await loadCards();
    } catch (err) {
      setCardFormStatus(
        (err && err.message) || 'Não foi possível salvar. Verifique o login e a consola do servidor.',
        'bad',
      );
    }
  });

  const collabEmail = document.getElementById('dash-collab-email');
  const collabStatus = document.getElementById('dash-collab-status');
  const submitCollabInvite = async () => {
    if (!collabEmail || !collabStatus) return;
    const email = collabEmail.value.trim();
    if (!email) {
      collabStatus.textContent = 'Informe o e-mail do colaborador.';
      collabStatus.classList.remove('ok');
      collabStatus.classList.add('bad');
      return;
    }
    collabStatus.classList.remove('ok', 'bad');
    collabStatus.textContent = 'Enviando convite…';
    const submitBtn = document.getElementById('dash-collab-submit');
    if (submitBtn) submitBtn.disabled = true;
    const path = getDashApiPath('inviteCollaborator');
    const r = await dashFetchNoThrow(path, {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
    if (submitBtn) submitBtn.disabled = false;
    const apiMsg = r.data && typeof r.data === 'object' && !Array.isArray(r.data) ? r.data.message : null;
    if (r.ok) {
      collabStatus.textContent =
        apiMsg ||
        'Colaborador adicionado com sucesso! Foi enviado um e-mail com o link para criar a senha.';
      collabStatus.classList.add('ok');
      collabStatus.classList.remove('bad');
      collabEmail.value = '';
    } else {
      let msg = apiMsg;
      if (!msg) {
        if (r.status === 401) {
          msg = 'Sem autorização. Faça login de novo com usuário e senha de admin (o PIN de dev agora também pede o token à API).';
        } else if (r.status === 0) {
          msg = 'Sem conexão com a API. Verifique se o servidor está rodando.';
        } else {
          msg = 'Não foi possível enviar o convite.';
        }
      }
      collabStatus.textContent = msg;
      collabStatus.classList.add('bad');
      collabStatus.classList.remove('ok');
    }
  };
  document.getElementById('dash-collab-submit')?.addEventListener('click', submitCollabInvite);
  collabEmail?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      submitCollabInvite();
    }
  });

    fbRefresh?.addEventListener('click', loadFeedback);
    cardsRefresh?.addEventListener('click', loadCards);

    setDashView('home');
    loadFeedback();
    loadCards();
    dashReloadAll = () => {
      loadFeedback();
      loadCards();
    };
  }

}

/* ── INIT ───────────────────────────────────────────────────*/
document.addEventListener('DOMContentLoaded', () => {
  initCopy();
  initStepsSlider();
  initTabs();
  initSearch();
  initMenu();
  initScroll();
  initFeedback();
  initTrainingTerminal();
  initDashboard();
  applyIndexCardOrder();
});
