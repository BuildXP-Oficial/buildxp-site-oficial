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

function initCopy() {
  document.querySelectorAll('.copy-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const code = btn.closest('.cmd-block').querySelector('code').innerText;
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

    track.addEventListener('scroll', () => updateButtons(), { passive: true });
    window.addEventListener('resize', () => updateButtons());

    updateButtons();
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
  search.addEventListener('input', () => {
    const q = search.value.toLowerCase();
    document.querySelectorAll('.cmd-item').forEach(item => {
      const cmd  = item.querySelector('.cmd-text')?.textContent.toLowerCase() ?? '';
      const desc = item.querySelector('.cmd-desc')?.textContent.toLowerCase() ?? '';
      item.style.display = (cmd.includes(q) || desc.includes(q)) ? '' : 'none';
    });
    // Hide empty section titles
    document.querySelectorAll('.ref-section').forEach(sec => {
      const visible = [...sec.querySelectorAll('.cmd-item')].some(i => i.style.display !== 'none');
      sec.style.display = visible ? '' : 'none';
    });
  });
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

/* ── TRAINING TERMINAL (replaces quiz) ──────────────────────*/
const TRAIN_TOPICS = ['Git', 'Docker', 'NPM', '.NET'];
const TRAIN_LEVELS = [
  { id: 'beginner', label: 'INICIANTE' },
  { id: 'advanced', label: 'AVANÇADO' },
  { id: 'mixed', label: 'MISTO' },
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
  const mount = document.getElementById('quiz');
  if (!mount) return;

  const state = {
    topic: 'Git',
    levelMode: 'beginner',
    runLevel: 1,
    questionIdx: 0,
    totalXp: 0,
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
    mount.innerHTML = `
      <div class="term-intro">
        <div class="term-title">TERMINAL TRAINING</div>
        <div class="term-sub">
          Responda como se estivesse no terminal: eu faço a pergunta, você digita o comando.<br>
          Pontuação: <span class="term-good">+20 XP</span> certo · <span class="term-warn">+10 XP</span> parcial · <span class="term-bad">+0 XP</span> errado
        </div>

        <div class="term-pick" id="pick-topic"></div>
        <div class="term-pick" id="pick-level"></div>

        <div class="term-actions">
          <button class="term-btn primary" type="button" id="term-start">▶ INICIAR</button>
        </div>
      </div>
    `;

    const topicWrap = mount.querySelector('#pick-topic');
    const levelWrap = mount.querySelector('#pick-level');
    TRAIN_TOPICS.forEach(t => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'term-chip' + (state.topic === t ? ' active' : '');
      b.textContent = t;
      b.addEventListener('click', () => {
        state.topic = t;
        // update accent on the fly (CSS uses --accent)
        const root = document.documentElement;
        const map = { Git: 'var(--blue)', Docker: 'var(--docker)', NPM: 'var(--blue-2)', '.NET': 'var(--dotnet)' };
        root.style.setProperty('--accent', map[t] ?? 'var(--blue)');
        root.style.setProperty('--accent-glow', 'var(--blue-glow)');
        renderIntro();
      });
      topicWrap.appendChild(b);
    });

    TRAIN_LEVELS.forEach(l => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'term-chip' + (state.levelMode === l.id ? ' active' : '');
      b.textContent = l.label;
      b.addEventListener('click', () => { state.levelMode = l.id; renderIntro(); });
      levelWrap.appendChild(b);
    });

    mount.querySelector('#term-start').addEventListener('click', () => startRun(true));
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
            XP: <strong id="term-xp">${state.totalXp}</strong>
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

  function xpPop(xp) {
    const screen = mount.querySelector('#term-screen');
    if (!screen) return;
    const div = document.createElement('div');
    div.className = 'term-line term-xp-pop';
    div.textContent = `+${xp} XP`;
    screen.appendChild(div);
    screen.scrollTop = screen.scrollHeight;
  }

  function updateXp() {
    const xpEl = mount.querySelector('#term-xp');
    if (xpEl) xpEl.textContent = String(state.totalXp);
  }

  function startRun(resetLevel) {
    if (resetLevel) state.runLevel = 1;
    state.questionIdx = 0;
    state.totalXp = 0;
    state.currentSet = pickQuestions(state.topic, state.levelMode, state.runLevel);
    renderTerminalShell();

    line(`BuildXP Terminal Training — ${state.topic}`, 'term-dim');
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

    // partial: user contains at least 2 required tokens OR matches command prefix
    const ut = new Set(tokenize(user));
    const must = (q.must ?? []).map(norm);
    const mustHits = must.filter(t => ut.has(t)).length;
    const looksLike = accepted.some(a => a.split(' ')[0] && user.startsWith(a.split(' ')[0]));

    if (mustHits >= Math.min(2, must.length) || (looksLike && user.length >= 3)) {
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

    if (g.xp > 0) {
      xpPop(g.xp);
      state.totalXp += g.xp;
      updateXp();
    }

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
  initTrainingTerminal();
});
