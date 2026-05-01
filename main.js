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
      const pane = root.closest('.tab-pane') || root.parentElement;
      return pane?.querySelector?.('[data-steps-index]') ?? null;
    }

    function scrollToStep(el) {
      if (!el) return;
      track.scrollTo({ left: el.offsetLeft, behavior: 'smooth' });
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

      track.addEventListener('scroll', () => setActive(), { passive: true });
      window.addEventListener('resize', () => setActive());
      setActive();
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

  function render() {
    const q = norm(searchEl.value);
    const items = load();
    const filtered = !q
      ? items
      : items.filter(it =>
          norm(it.name).includes(q) ||
          norm(it.kind).includes(q) ||
          norm(it.msg).includes(q)
        );

    listEl.innerHTML = '';
    emptyEl.style.display = (filtered.length === 0) ? '' : 'none';

    filtered
      .slice()
      .sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''))
      .forEach(it => {
        const div = document.createElement('div');
        div.className = 'fb-item';
        div.innerHTML = `
          <div class="fb-item-top">
            <span class="fb-kind">${it.kind}</span>
            <span class="fb-meta">${it.name ? it.name + ' · ' : ''}${fmtDate(it.createdAt)}</span>
          </div>
          <div class="fb-msg"></div>
        `;
        div.querySelector('.fb-msg').textContent = it.msg;
        listEl.appendChild(div);
      });
  }

  searchEl?.addEventListener('input', () => render());

  form?.addEventListener('submit', (e) => {
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

    const items = load();
    items.push({
      id: crypto?.randomUUID ? crypto.randomUUID() : String(Date.now()) + Math.random().toString(16).slice(2),
      name,
      kind,
      msg: msg.slice(0, 400),
      createdAt: new Date().toISOString(),
    });
    save(items);

    msgEl.value = '';
    setStatus('Publicado no mural! Obrigado por contribuir.', 'ok');
    render();
  });

  render();
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
    const q = state.currentSet[state.questionIdx];
    if (!q) return;
    if (!raw.trim()) return;

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
});
