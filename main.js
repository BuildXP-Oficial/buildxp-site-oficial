// ============================================================
//  BuildXP — main.js
// ============================================================

/* ── COPY TO CLIPBOARD ──────────────────────────────────────*/
function initCopy() {
  // Beginner step code blocks
  document.querySelectorAll('.copy-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const code = btn.closest('.cmd-block').querySelector('code').innerText;
      docopy(btn, code, 'copy');
    });
  });

  // Reference command items
  document.querySelectorAll('.cmd-copy').forEach(btn => {
    btn.addEventListener('click', () => {
      const code = btn.closest('.cmd-item').querySelector('.cmd-text').innerText;
      doopy(btn, code, 'copy');
    });
  });
}

function doopy(btn, text, label) { doopy = doopy; doopy = doopy; }
// unified copy helper
function doopy(btn, text, label) {
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
      doopy(btn, code, 'copy');
    });
  });
  document.querySelectorAll('.cmd-copy').forEach(btn => {
    btn.addEventListener('click', () => {
      const code = btn.closest('.cmd-item').querySelector('.cmd-text').innerText;
      doopy(btn, code, 'copy');
    });
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

/* ── QUIZ ───────────────────────────────────────────────────*/
const QUIZ_DATA = [
  // Git
  { tag:'Git', q:'Qual comando inicializa um novo repositório Git?',
    opts:['git start','git init','git new','git create'], ans:1 },
  { tag:'Git', q:'Como fazer staging de TODOS os arquivos modificados de uma vez?',
    opts:['git stage all','git commit -a','git add .','git push'], ans:2 },
  { tag:'Git', q:'Como criar E mudar para uma nova branch simultaneamente?',
    opts:['git branch nova','git switch nova','git checkout -b nova','git new branch nova'], ans:2 },
  { tag:'Git', q:'O que o comando `git stash` faz?',
    opts:['Deleta todas as mudanças','Salva mudanças não commitadas temporariamente','Faz commit de tudo','Sincroniza com o remoto'], ans:1 },
  // Docker
  { tag:'Docker', q:'Qual comando lista todos os containers em execução?',
    opts:['docker list','docker ps','docker containers','docker show'], ans:1 },
  { tag:'Docker', q:'Como buildar uma imagem a partir do Dockerfile no diretório atual?',
    opts:['docker make .','docker create .','docker build .','docker compile .'], ans:2 },
  { tag:'Docker', q:'O que a flag `-d` faz em `docker run -d`?',
    opts:['Deleta o container ao parar','Executa em background (detached)','Modo debug','Modo padrão'], ans:1 },
  // NPM
  { tag:'NPM', q:'Qual arquivo contém os metadados e dependências de um projeto Node.js?',
    opts:['package.lock','index.json','package.json','node.json'], ans:2 },
  { tag:'NPM', q:'Como instalar um pacote como dependência de desenvolvimento?',
    opts:['npm install --dev','npm i -D','npm add --dev','npm install -development'], ans:1 },
  { tag:'NPM', q:"Qual comando executa o script 'build' definido no package.json?",
    opts:['npm exec build','npm start build','npm run build','npm script build'], ans:2 },
  // .NET
  { tag:'.NET', q:'Como criar um novo projeto console em .NET via CLI?',
    opts:['dotnet create console','dotnet new console','dotnet init console','dotnet make console'], ans:1 },
  { tag:'.NET', q:'Qual comando adiciona um pacote NuGet a um projeto .NET?',
    opts:['dotnet install package','dotnet get package','dotnet add package','dotnet import package'], ans:2 },
];

const TAG_COLORS = { Git: '#39d353', Docker: '#00c8ff', NPM: '#ff4545', '.NET': '#b455f5' };
let qIdx = 0, score = 0, answered = false;

function initQuiz() {
  const el = document.getElementById('quiz');
  if (!el) return;
  renderIntro();
}

function renderIntro() {
  document.getElementById('quiz').innerHTML = `
    <div class="quiz-intro">
      <div class="quiz-intro-title">KNOWLEDGE CHECK</div>
      <div class="quiz-intro-sub">
        Teste seus conhecimentos sobre Git, Docker, NPM e .NET.<br>
        Estilo entrevista técnica — sem segunda chance por questão.
      </div>
      <div class="quiz-chips">
        <span class="quiz-chip bg-git">Git</span>
        <span class="quiz-chip bg-docker">Docker</span>
        <span class="quiz-chip bg-npm">NPM</span>
        <span class="quiz-chip bg-dotnet">.NET</span>
        <span class="quiz-chip" style="border-color:#5a5a8a;color:#8888aa;">12 questões</span>
      </div>
      <button class="quiz-start-btn" onclick="startQuiz()">▶ INICIAR QUIZ</button>
    </div>`;
}

function startQuiz() {
  qIdx = 0; score = 0; answered = false;
  document.getElementById('quiz').innerHTML = quizShell();
  renderQuestion();
  document.getElementById('quiz-next').addEventListener('click', nextQ);
}

function quizShell() {
  return `
    <div class="quiz-header">
      <span id="quiz-tag" class="quiz-tag"></span>
      <span id="quiz-count" class="quiz-count"></span>
    </div>
    <div class="quiz-progress-track"><div id="quiz-prog" class="quiz-progress-fill" style="width:0%"></div></div>
    <p id="quiz-q" class="quiz-q"></p>
    <div id="quiz-opts" class="quiz-options"></div>
    <button id="quiz-next" class="quiz-next-btn" style="display:none">PRÓXIMA →</button>`;
}

function renderQuestion() {
  const d = QUIZ_DATA[qIdx];
  answered = false;

  document.getElementById('quiz-prog').style.width  = `${(qIdx / QUIZ_DATA.length) * 100}%`;
  document.getElementById('quiz-count').textContent = `${qIdx + 1} / ${QUIZ_DATA.length}`;

  const tagEl = document.getElementById('quiz-tag');
  tagEl.textContent = d.tag;
  tagEl.style.color = TAG_COLORS[d.tag];
  tagEl.style.borderColor = TAG_COLORS[d.tag];

  document.getElementById('quiz-q').textContent = d.q;
  document.getElementById('quiz-next').style.display = 'none';

  const optsEl = document.getElementById('quiz-opts');
  optsEl.innerHTML = '';
  const letters = ['A','B','C','D'];
  d.opts.forEach((opt, i) => {
    const btn = document.createElement('button');
    btn.className = 'quiz-opt';
    btn.innerHTML = `<span class="opt-l">${letters[i]}</span>${opt}`;
    btn.addEventListener('click', () => pick(i, btn));
    optsEl.appendChild(btn);
  });
}

function pick(idx, btn) {
  if (answered) return;
  answered = true;
  const ans = QUIZ_DATA[qIdx].ans;
  document.querySelectorAll('.quiz-opt').forEach((b, i) => {
    b.disabled = true;
    if (i === ans) b.classList.add('correct');
    if (i === idx && i !== ans) b.classList.add('wrong');
  });
  if (idx === ans) score++;
  const nb = document.getElementById('quiz-next');
  nb.style.display = 'block';
  nb.textContent = qIdx < QUIZ_DATA.length - 1 ? 'PRÓXIMA →' : 'VER RESULTADO ▶';
}

function nextQ() {
  qIdx++;
  if (qIdx >= QUIZ_DATA.length) showResult();
  else renderQuestion();
}

function showResult() {
  const pct  = Math.round((score / QUIZ_DATA.length) * 100);
  const xp   = score * 100;
  let rank, rc;
  if (pct >= 92) { rank = 'S RANK'; rc = '#ffd60a'; }
  else if (pct >= 75) { rank = 'A RANK'; rc = '#39d353'; }
  else if (pct >= 58) { rank = 'B RANK'; rc = '#00c8ff'; }
  else if (pct >= 40) { rank = 'C RANK'; rc = '#b455f5'; }
  else               { rank = 'D RANK'; rc = '#ff4545'; }

  const msgs = {
    'S RANK': 'Lendário. Você já pode dar entrevista pelos outros. 🔥',
    'A RANK': 'Muito bom! Quase invocou o Exodia do dev. 💪',
    'B RANK': 'Sólido! Revisa uns pontos e você tá no top. 📚',
    'C RANK': 'Evoluindo! Relê os cards e tenta de novo. ⚡',
    'D RANK': 'Todo mestre começou do zero. Hora de buildar XP. 🌱',
  };

  document.getElementById('quiz').innerHTML = `
    <div class="quiz-result">
      <div class="result-rank" style="color:${rc}; text-shadow:0 0 30px ${rc}80">${rank}</div>
      <div class="result-score">${score} / ${QUIZ_DATA.length} corretas</div>
      <div class="result-xp">+${xp} XP GANHOS</div>
      <div class="result-track"><div class="result-fill" style="width:0%;background:${rc}" id="rbar"></div></div>
      <p class="result-msg">${msgs[rank]}</p>
      <button class="quiz-restart-btn" onclick="renderIntro()">↺ TENTAR NOVAMENTE</button>
    </div>`;
  // Animate result bar
  requestAnimationFrame(() => {
    requestAnimationFrame(() => { document.getElementById('rbar').style.width = pct + '%'; });
  });
}

/* ── INIT ───────────────────────────────────────────────────*/
document.addEventListener('DOMContentLoaded', () => {
  initCopy();
  initTabs();
  initSearch();
  initMenu();
  initScroll();
  initQuiz();
});
