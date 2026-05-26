// BuildXP - terminal
/* ── TRAINING TERMINAL ──────────────────────────────────────*/
const TRAIN_TOPICS = ['Git', 'Docker', 'NPM', '.NET'];
const TRAIN_LEVELS = [
  { id: 'beginner', label: 'INICIANTE' },
  { id: 'advanced', label: 'AVANÇADO' },
  { id: 'mixed', label: 'ARENA' },
];
const TRAIN_LEVEL_ORDER = ['beginner', 'advanced', 'mixed'];

function getNextTrainLevelMode(current) {
  const i = TRAIN_LEVEL_ORDER.indexOf(current);
  return TRAIN_LEVEL_ORDER[(i + 1) % TRAIN_LEVEL_ORDER.length];
}

function trainLevelLabel(modeId) {
  return TRAIN_LEVELS.find((l) => l.id === modeId)?.label ?? String(modeId ?? '').toUpperCase();
}

function resetGlobalSiteAccent() {
  document.documentElement.style.removeProperty('--accent');
  document.documentElement.style.removeProperty('--accent-glow');
}

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
  /** Treino só no site: validação por estrutura (nomes de classe/variáveis livres). */
  'C#': {
    beginner: [
      {
        kind: 'csharp',
        q: '[C#] Programa com static void Main que calcule a área de um retângulo com base 4 e altura 5 (use variáveis ou literais), multiplique com * e imprima com Console.WriteLine. Nomes livres. Várias linhas; envie com ###',
        feedback: 'Precisa: Main estático, operador * com 4 e 5 (ou resultado 20) e Console.WriteLine.',
        csChecks: [
          (n) => /static\s+void\s+main\s*\(/.test(n),
          (n) => /console\.writeline\s*\(/.test(n),
          (n) =>
            /\*/.test(n) &&
            ((/\b4\b/.test(n) && /\b5\b/.test(n)) || /\b20\b/.test(n) || /=?\s*20\b/.test(n)),
        ],
      },
      {
        kind: 'csharp',
        q: '[C#] Uma classe qualquer com um método que use return. No Main: new, chame o método e Console.WriteLine com o resultado. ###',
        feedback: 'Precisa: class, return, new, Main e Console.WriteLine.',
        csChecks: [
          (n) => /\bclass\s+\w+/.test(n),
          (n) => /\breturn\b/.test(n),
          (n) => /\bnew\s+\w+\s*\(/.test(n),
          (n) => /static\s+void\s+main\s*\(/.test(n),
          (n) => /console\.writeline/.test(n),
        ],
      },
      {
        kind: 'csharp',
        q: '[C#] Herança básica: uma classe derivada com sintaxe class Filha : Pai (nomes livres). No Main instancie a derivada e use Console.WriteLine. ###',
        feedback: 'Precisa: class Derivada : Base, Main, new e Console.WriteLine.',
        csChecks: [
          (n) => /\bclass\s+\w+\s*:\s*\w+/.test(n),
          (n) => /static\s+void\s+main/.test(n),
          (n) => /\bnew\s+\w+\s*\(/.test(n),
          (n) => /console\.writeline/.test(n),
        ],
      },
      {
        kind: 'csharp',
        q: '[C#] No Main, um for que conta de 1 até 5 com int e imprima cada valor com Console.WriteLine. ###',
        feedback: 'Precisa: for com int iniciando em 1, limite 5 (<=5 ou <6), ++ e Console.WriteLine.',
        csChecks: [
          (n) => /static\s+void\s+main/.test(n),
          (n) => /\bfor\s*\(\s*int\s+\w+\s*=\s*1\b/.test(n),
          (n) => /<=\s*5\b|<\s*6\b/.test(n),
          (n) => /\+\+/.test(n),
          (n) => /console\.writeline/.test(n),
        ],
      },
      {
        kind: 'csharp',
        q: '[C#] Menu interativo: do { } while (...), switch com pelo menos duas cases diferentes + default, e Console.ReadLine. ###',
        feedback: 'Precisa: do/while, switch, 2+ case, default e Console.ReadLine.',
        csChecks: [
          (n) => /\bdo\s*\{/.test(n),
          (n) => /\bwhile\s*\(/.test(n),
          (n) => /\bswitch\s*\(/.test(n),
          (n) => (n.match(/\bcase\b/g) || []).length >= 2,
          (n) => /\bdefault\s*:/.test(n),
          (n) => /console\.readline/.test(n),
        ],
      },
    ],
    advanced: [
      {
        kind: 'csharp',
        q: '[C#] No Main, encadeie if / else (classificar número: positivo, negativo ou zero) e Console.WriteLine em cada ramo. ###',
        feedback: 'Precisa: if, else e Console.WriteLine.',
        csChecks: [
          (n) => /static\s+void\s+main/.test(n),
          (n) => /\bif\s*\(/.test(n),
          (n) => /\belse\b/.test(n),
          (n) => (n.match(/console\.writeline/g) || []).length >= 2,
        ],
      },
      {
        kind: 'csharp',
        q: '[C#] foreach sobre array ou lista e Console.WriteLine para cada item. ###',
        feedback: 'Precisa: foreach ... in e Console.WriteLine.',
        csChecks: [
          (n) => /\bforeach\s*\(/.test(n),
          (n) => /\bin\b/.test(n),
          (n) => /console\.writeline/.test(n),
          (n) => /\[\s*\]/.test(n) || /new\s+int\s*\[/.test(n) || /list\s*</.test(n),
        ],
      },
      {
        kind: 'csharp',
        q: '[C#] try { ... } catch (...) { ... } no Main (por exemplo int.Parse inválido) e mensagem com Console.WriteLine no catch. ###',
        feedback: 'Precisa: try, catch e Console.WriteLine.',
        csChecks: [
          (n) => /\btry\s*\{/.test(n),
          (n) => /\bcatch\s*\(/.test(n),
          (n) => /static\s+void\s+main/.test(n),
          (n) => /console\.writeline/.test(n),
        ],
      },
      {
        kind: 'csharp',
        q: '[C#] Classe com propriedade automática { get; set; }, Main atribui/lê a propriedade e Console.WriteLine. ###',
        feedback: 'Precisa: class, get e set na propriedade, Main e Console.WriteLine.',
        csChecks: [
          (n) => /\bclass\s+\w+/.test(n),
          (n) => /\bget\b/.test(n) && /\bset\b/.test(n),
          (n) => /static\s+void\s+main/.test(n),
          (n) => /console\.writeline/.test(n),
        ],
      },
      {
        kind: 'csharp',
        q: '[C#] Condicional com && ou || no if (duas condições). Main + Console.WriteLine. ###',
        feedback: 'Precisa: if com && ou || e Console.WriteLine.',
        csChecks: [
          (n) => /static\s+void\s+main/.test(n),
          (n) => /\bif\s*\(/.test(n),
          (n) => /&&|\|\|/.test(n),
          (n) => /console\.writeline/.test(n),
        ],
      },
    ],
  },
};

/** Normaliza C# para checagens flexíveis (comentários e strings neutras). */
function normCsForMatch(raw) {
  return String(raw)
    .replace(/\/\/[^\n]*/g, ' ')
    .replace(/\/\*[\s\S]*?\*\//g, ' ')
    .replace(/"(?:[^"\\]|\\.)*"|@"(?:""|[^"])*"|'(?:[^'\\]|\\.)*'/g, '""')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

function gradeCSharp(raw, q) {
  const checks = q.csChecks || [];
  const n = normCsForMatch(raw);
  let passed = 0;
  for (const fn of checks) {
    try {
      if (fn(n)) passed++;
    } catch (_) {
      /* ignore */
    }
  }
  const total = checks.length;
  if (total === 0) return { result: 'wrong', xp: 0 };
  if (passed === total) return { result: 'correct', xp: 20 };
  if (passed >= Math.ceil(total * 0.65)) return { result: 'partial', xp: 10 };
  return { result: 'wrong', xp: 0 };
}

function initTrainingTerminal() {
  const mount = document.getElementById('terminal');
  if (!mount) return;

  resetGlobalSiteAccent();

  /** Prova silenciosa → dashboard (qualquer terminal: intro ou treino; sem área dedicada). */
  let adminGateBuffer = [];

  const normAdmin = (s) =>
    String(s ?? '')
      .trim()
      .replace(/\s+/g, ' ');

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
    const compact = compactAdminBody(normAdmin(s));
    return compact === 'privateclassAdminDash' || compact === 'privateclassAdminDash{';
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
    introStep: 'topic', // 'topic' | 'dotnetMode' | 'level'
    dotnetTrack: 'cli', // 'cli' | 'csharp' — só para tema .NET
    codeBlockAccum: null,
    runLevel: 1,
    questionIdx: 0,
    totalXp: 0,
    goalXp: 80,
    asked: [],
    currentSet: [],
  };

  function getBankTopic() {
    if (state.topic === '.NET' && state.dotnetTrack === 'csharp') return 'C#';
    return state.topic;
  }

  function termBadgeLabel() {
    if (state.topic === '.NET' && state.dotnetTrack === 'csharp') return '.NET · CÓDIGO C#';
    if (state.topic === '.NET' && state.dotnetTrack === 'cli') return '.NET · CLI';
    return state.topic;
  }

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

  function pickQuestions(bankTopic, levelMode, runLevel) {
    const poolBeginner = TRAIN_BANK[bankTopic].beginner;
    const poolAdvanced = TRAIN_BANK[bankTopic].advanced;
    let pool = poolBeginner;
    if (levelMode === 'advanced') pool = poolAdvanced;
    if (levelMode === 'mixed') pool = [...poolBeginner, ...poolAdvanced];

    // Lightweight “leveling”: shift selection window as runLevel grows
    const shift = Math.min(pool.length - 5, Math.max(0, runLevel - 1));
    const rotated = [...pool.slice(shift), ...pool.slice(0, shift)];
    return rotated.slice(0, 5);
  }

  function termMissionMsgHtml() {
    return `
        <div class="term-mission-msg">
          <p class="term-mission-msg__title">Jogador Identificado</p>
          <p class="term-mission-msg__body">Sua missão aqui é simples: evoluir suas habilidades através da prática.</p>
        </div>`;
  }

  function termIntroCopyHtml() {
    return `
        <div class="term-sub term-sub--copy">
          Cada comando executado gera experiência para sua jornada. Não existe &ldquo;falhar&rdquo;, existe aprender, testar novamente e desbloquear novos conhecimentos.<br>
          <span class="term-purple">Como funciona:</span> Eu lanço um desafio e você digita o comando.<br>
          <span class="term-purple">Pontuação</span><br>
          <span class="term-good">+50 XP</span> certo · <span class="term-warn">+25 XP</span> parcialmente correto · <span class="term-bad">-1 XP</span> errado<br>
          <span class="term-purple">Nível atual:</span> Em construção.<br>
          <span class="term-nowrap"><span class="term-purple">Próximo desbloqueio:</span> você do futuro</span>
        </div>`;
  }

  function renderIntro() {
    const isTopicStep = state.introStep === 'topic';
    const isDotnetModeStep = state.introStep === 'dotnetMode';
    const stepLabel = isTopicStep
      ? 'ESCOLHA O TEMA'
      : isDotnetModeStep
        ? 'COMANDOS OU CÓDIGO (.NET)'
        : 'ESCOLHA O NÍVEL';

    mount.innerHTML = `
      <div class="term-intro">
        <div class="term-title">TERMINAL TRAINING</div>
        ${termIntroCopyHtml()}

        ${isTopicStep ? `
          <div class="term-dim" style="text-align:center;margin-bottom:0.75rem;font-family:var(--f-mono);font-size:0.72rem;letter-spacing:2px;">
            ${stepLabel}
          </div>
          <div class="term-pick" id="pick-topic"></div>
        ` : isDotnetModeStep ? `
          <div class="term-dim" style="text-align:center;margin-bottom:0.75rem;font-family:var(--f-mono);font-size:0.72rem;letter-spacing:2px;">
            ${stepLabel}
          </div>
          <div class="term-pick" style="justify-content:center;margin-bottom:0.8rem;">
            <span class="term-chip active" style="cursor:default;">.NET/C#</span>
          </div>
          ${termMissionMsgHtml()}
          <div class="term-pick" id="pick-dotnet-track"></div>
          <div class="term-actions">
            <button class="term-btn primary" type="button" id="term-dotnet-next">▶ CONTINUAR</button>
            <button class="term-btn ghost" type="button" id="term-back-dotnet">← TROCAR TEMA</button>
          </div>
        ` : `
          <div class="term-dim" style="text-align:center;margin-bottom:0.75rem;font-family:var(--f-mono);font-size:0.72rem;letter-spacing:2px;">
            ${stepLabel}
          </div>
          <div class="term-pick" style="justify-content:center;margin-bottom:0.8rem;">
            <span class="term-chip active" style="cursor:default;">${termBadgeLabel()}</span>
          </div>
          ${state.topic === '.NET' ? '' : termMissionMsgHtml()}
          <div class="term-pick" id="pick-level"></div>
          <div class="term-actions">
            <button class="term-btn primary" type="button" id="term-start">▶ INICIAR</button>
            <button class="term-btn ghost" type="button" id="term-back">${state.topic === '.NET' ? '← VOLTAR' : '← TROCAR TEMA'}</button>
          </div>
        `}
      </div>
    `;

    const setAccentForTopic = (t) => {
      const presets = {
        Git: { c: '#39d353', g: '0 0 28px rgba(57,211,83,0.35)' },
        Docker: { c: '#00c8ff', g: '0 0 28px rgba(0,200,255,0.35)' },
        NPM: { c: '#ff4545', g: '0 0 28px rgba(255,69,69,0.35)' },
        '.NET': { c: '#b455f5', g: '0 0 28px rgba(180,85,245,0.35)' },
      };
      const p = presets[t] ?? presets.Git;
      mount.style.setProperty('--term-accent', p.c);
      mount.style.setProperty('--term-accent-glow', p.g);
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
          state.introStep = t === '.NET' ? 'dotnetMode' : 'level';
          if (t === '.NET') state.dotnetTrack = 'cli';
          renderIntro();
        });
        topicWrap.appendChild(b);
      });
    } else if (isDotnetModeStep) {
      const trackWrap = mount.querySelector('#pick-dotnet-track');
      [
        { id: 'cli', label: 'COMANDOS DOTNET' },
        { id: 'csharp', label: 'CÓDIGO C#' },
      ].forEach(({ id, label }) => {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'term-chip' + (state.dotnetTrack === id ? ' active' : '');
        b.textContent = label;
        b.addEventListener('click', () => {
          state.dotnetTrack = id;
          renderIntro();
        });
        trackWrap.appendChild(b);
      });
      mount.querySelector('#term-back-dotnet').addEventListener('click', () => {
        state.introStep = 'topic';
        renderIntro();
      });
      mount.querySelector('#term-dotnet-next').addEventListener('click', () => {
        state.introStep = 'level';
        renderIntro();
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
        if (state.topic === '.NET') state.introStep = 'dotnetMode';
        else state.introStep = 'topic';
        renderIntro();
      });
    }
  }

  function renderTerminalShell() {
    const inputPh =
      state.topic === '.NET' && state.dotnetTrack === 'csharp'
        ? 'linha de código e Enter · linha só com ### envia o bloco'
        : 'digite o comando e pressione Enter...';
    mount.innerHTML = `
      <div class="term-frame">
        <div class="term-topbar">
          <div class="term-meta">
            <span class="term-stat">
              <span class="term-badge">${termBadgeLabel()}</span>
            </span>
            <span class="term-stat">
              <span class="term-dim">NÍVEL</span>
              <span class="term-badge">LVL ${state.runLevel}</span>
            </span>
            <span class="term-stat">
              <span class="term-dim">MODO</span>
              <span class="term-badge">${state.levelMode.toUpperCase()}</span>
            </span>
          </div>
          <div class="term-meta term-xp">
            <span class="term-xp-wrap" id="term-xp-wrap">XP: <strong id="term-xp">${state.totalXp}</strong></span>
            <span class="term-goal">OBJ: <strong id="term-goal">${state.goalXp}</strong></span>
          </div>
        </div>
        <div class="term-screen" id="term-screen" aria-live="polite"></div>
        <div class="term-inputbar">
          <span class="term-prompt">$</span>
          <input class="term-input" id="term-input" autocomplete="off" spellcheck="false" placeholder="${inputPh.replace(/"/g, '&quot;')}" />
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

  function lineHtml(html, cls = '') {
    const screen = mount.querySelector('#term-screen');
    if (!screen) return;
    const div = document.createElement('div');
    div.className = 'term-line' + (cls ? ` ${cls}` : '');
    div.innerHTML = html;
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
    state.codeBlockAccum = null;
    state.currentSet = pickQuestions(getBankTopic(), state.levelMode, state.runLevel);
    renderTerminalShell();

    replayAdminGate();

    line(`BuildXP Terminal Training — ${termBadgeLabel()}`, 'term-dim');
    lineHtml(
      '<span class="term-bad">Importante:</span> Este terminal não salva progresso. O objetivo é que você observe sua própria evolução durante a jornada.',
      'term-dim',
    );
    line(`Objetivo: ${state.goalXp} XP.`, 'term-dim');
    if (getBankTopic() === 'C#') {
      line(`Modo C#: nomes de classe e variáveis livres; importa a montagem e operadores.`, 'term-dim');
      line(`Bloco: uma linha por Enter; linha que começa com # encerra o bloco.`, 'term-dim');
    } else {
      line(`Dica: foque na estrutura do comando.`, 'term-dim');
    }
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
    line(`${q.q}`, '');
    if (q.kind === 'csharp') {
      state.codeBlockAccum = [];
      line('Bloco: uma linha por Enter; última linha só ### para enviar.', 'term-dim');
    } else {
      state.codeBlockAccum = null;
    }
  }

  function gradeAnswer(raw, q) {
    const user = norm(raw);
    const accepted = (q.accept ?? []).map(norm);

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

    const q = state.currentSet[state.questionIdx];
    if (!q) return;

    /* Modo C# acumula linhas em bloco (###); tem de passar antes pelo portão admin. */
    if (tryConsumeAdminGate(raw, 'run')) {
      input.value = '';
      return;
    }

    if (q.kind === 'csharp') {
      if (!Array.isArray(state.codeBlockAccum)) state.codeBlockAccum = [];

      if (raw.trim() !== '###') {
        state.codeBlockAccum.push(raw);
        line(`· ${raw}`, 'term-dim');
        input.value = '';
        return;
      }

      const full = state.codeBlockAccum.join('\n');
      state.codeBlockAccum = [];
      input.value = '';
      line('$ ###', 'term-dim');

      if (!full.trim()) {
        line('Envie pelo menos uma linha de código antes de ###.', 'term-bad');
        line('Mesmo desafio: reenvie o bloco terminando em ###.', 'term-dim');
        state.codeBlockAccum = [];
        return;
      }

      const g = gradeCSharp(full, q);
      if (g.result === 'correct') line('✔ Correto.', 'term-good');
      else if (g.result === 'partial') line('◐ Parcialmente correto.', 'term-warn');
      else line('✖ Incorreto.', 'term-bad');

      if (g.xp > 0) animateXpGain(g.xp);

      line(q.feedback || 'Confira o enunciado e os elementos obrigatórios.', 'term-dim');
      line('', '');

      state.questionIdx++;

      if (state.questionIdx >= 5) finishRun();
      else askCurrent();
      return;
    }

    line(`$ ${raw}`, 'term-dim');

    const g = gradeAnswer(raw, q);
    if (g.result === 'correct') line('✔ Correto.', 'term-good');
    else if (g.result === 'partial') line('◐ Parcialmente correto.', 'term-warn');
    else line('✖ Incorreto.', 'term-bad');

    if (g.xp > 0) animateXpGain(g.xp);

    if (q.accept?.length) line(`Resposta esperada: ${q.accept[0]}`, 'term-dim');
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
    line('', '');

    const nextMode = getNextTrainLevelMode(state.levelMode);
    const actions = document.createElement('div');
    actions.className = 'term-actions';
    actions.innerHTML = `
      <button class="term-btn primary" type="button" id="term-nextlvl">CONTINUAR — ${trainLevelLabel(nextMode)}</button>
      <button class="term-btn ghost" type="button" id="term-again">↺ REINICIAR</button>
      <button class="term-btn ghost" type="button" id="term-exit2">✕ SAIR</button>
    `;
    mount.querySelector('#term-screen')?.appendChild(actions);

    const input = mount.querySelector('#term-input');
    const send = mount.querySelector('#term-send');
    if (input) input.disabled = true;
    if (send) send.disabled = true;

    mount.querySelector('#term-nextlvl')?.addEventListener('click', () => {
      state.levelMode = nextMode;
      state.questionIdx = 0;
      state.currentSet = pickQuestions(getBankTopic(), state.levelMode, state.runLevel);
      state.totalXp = 0;
      startRun(false);
    });
    mount.querySelector('#term-again')?.addEventListener('click', () => startRun(true));
    mount.querySelector('#term-exit2')?.addEventListener('click', () => renderIntro());
  }

  renderIntro();
}
