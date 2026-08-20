// BuildXP - terminal
/* ── TRAINING TERMINAL ──────────────────────────────────────*/
const TRAIN_TOPICS = ['Git', 'Docker', 'NPM', '.NET', 'Python', 'Java'];
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
  /** Treino Python: dados / análise simples — sem OOP; validação por estrutura. */
  Python: {
    beginner: [
      {
        kind: 'python',
        q: '[Python · dados] Lista de notas (ex.: 7, 8, 9). Calcule a média com sum() e len() (ou /) e print(). Nomes livres. ###',
        feedback: 'Precisa: lista de números, sum(), len() (ou divisão) e print().',
        pyChecks: [
          (n) => /\[[\d\s.,]+\]/.test(n) || /\blist\s*\(/.test(n),
          (n) => /\bsum\s*\(/.test(n),
          (n) => /\blen\s*\(/.test(n) || /\//.test(n),
          (n) => /\bprint\s*\(/.test(n),
        ],
      },
      {
        kind: 'python',
        q: '[Python · dados] Peça um valor com input(), converta com int() ou float() e print() o resultado. ###',
        feedback: 'Precisa: input(), int() ou float() e print().',
        pyChecks: [
          (n) => /input\s*\(/.test(n),
          (n) => /\bint\s*\(/.test(n) || /\bfloat\s*\(/.test(n),
          (n) => /\bprint\s*\(/.test(n),
        ],
      },
      {
        kind: 'python',
        q: '[Python · dados] Lista de nomes de colunas ou produtos; use for ... in e print() cada item. ###',
        feedback: 'Precisa: lista (strings), for ... in e print().',
        pyChecks: [
          (n) => /\[[^\]]+\]/.test(n),
          (n) => /\bfor\s+\w+\s+in\b/.test(n),
          (n) => /\bprint\s*\(/.test(n),
        ],
      },
      {
        kind: 'python',
        q: '[Python · dados] Uma variável numérica (ex. vendas). Use if / else para dizer se bateu meta (>= 100) e print(). ###',
        feedback: 'Precisa: if, else e print().',
        pyChecks: [
          (n) => /\bif\s+/.test(n),
          (n) => /\belse\s*:/.test(n),
          (n) => /\bprint\s*\(/.test(n),
          (n) => />=|>|<=|</.test(n),
        ],
      },
      {
        kind: 'python',
        q: '[Python · dados] Lista de temperaturas: for e if para contar ou listar só as acima de 25. print() o resultado. ###',
        feedback: 'Precisa: lista, for, if (condição com 25) e print().',
        pyChecks: [
          (n) => /\[[\d\s.,]+\]/.test(n),
          (n) => /\bfor\s+\w+/.test(n),
          (n) => /\bif\s+/.test(n),
          (n) => /\b25\b/.test(n),
          (n) => /\bprint\s*\(/.test(n),
        ],
      },
    ],
    advanced: [
      {
        kind: 'python',
        q: '[Python · dados] Dicionário (ex. produto: preço). Acesse uma chave, use if/elif/else e print() o valor ou mensagem. ###',
        feedback: 'Precisa: dict { }, acesso por chave, if/elif ou if/else e print().',
        pyChecks: [
          (n) => /\{[^}]+\}/.test(n),
          (n) => /\[[^\]]+\]/.test(n) || /\.get\s*\(/.test(n),
          (n) => /\bif\s+/.test(n),
          (n) => /\belif\s+/.test(n) || /\belse\s*:/.test(n),
          (n) => /\bprint\s*\(/.test(n),
        ],
      },
      {
        kind: 'python',
        q: '[Python · dados] Duas listas (nomes e notas). Use zip() no for ou índice para print() cada par. ###',
        feedback: 'Precisa: duas listas, zip() ou índice, for e print().',
        pyChecks: [
          (n) => (n.match(/\[[^\]]+\]/g) || []).length >= 2 || (n.match(/\blist\s*\(/g) || []).length >= 2,
          (n) => /\bzip\s*\(/.test(n) || /\blen\s*\(/.test(n) || /\[\s*\w+\s*\]/.test(n),
          (n) => /\bfor\s+\w+/.test(n),
          (n) => /\bprint\s*\(/.test(n),
        ],
      },
      {
        kind: 'python',
        q: '[Python · dados] Monte lista só com valores positivos: for, if e .append() (ou list comprehension [x for ... if]). ###',
        feedback: 'Precisa: for, if, append ou list comprehension com if.',
        pyChecks: [
          (n) => /\bfor\s+\w+/.test(n),
          (n) => /\bif\s+/.test(n),
          (n) => /\.append\s*\(/.test(n) || /\bfor\s+[\w\s,]+in\s+[\w\s,]+\bif\b/.test(n),
        ],
      },
      {
        kind: 'python',
        q: '[Python · ML leve] Lista de números: ache o maior com for e if (sem max()), ou use max(); print(). ###',
        feedback: 'Precisa: lista, for+if comparando maior OU max(), e print().',
        pyChecks: [
          (n) => /\[[\d\s.,]+\]/.test(n),
          (n) => /\bprint\s*\(/.test(n),
          (n) => /\bmax\s*\(/.test(n) || (/\bfor\s+\w+/.test(n) && /\bif\s+/.test(n) && />|>=/.test(n)),
        ],
      },
      {
        kind: 'python',
        q: '[Python · dados] try/except ao converter input() com float() (dado inválido) e print() no except. ###',
        feedback: 'Precisa: try, except, input(), float() e print().',
        pyChecks: [
          (n) => /\btry\s*:/.test(n),
          (n) => /\bexcept\b/.test(n),
          (n) => /input\s*\(/.test(n),
          (n) => /\bfloat\s*\(/.test(n),
          (n) => /\bprint\s*\(/.test(n),
        ],
      },
    ],
  },
  /** Treino Java: só lógica de programação — sem CLI; validação por estrutura. */
  Java: {
    beginner: [
      {
        kind: 'java',
        q: '[Java] public static void main que calcule a área de um retângulo (base 4 e altura 5), use * e System.out.println. Nomes livres. ###',
        feedback: 'Precisa: main estático, * com 4 e 5 (ou 20) e System.out.println.',
        javaChecks: [
          (n) => /public\s+static\s+void\s+main\s*\(/.test(n),
          (n) => /system\.out\.println\s*\(/.test(n),
          (n) =>
            /\*/.test(n) &&
            ((/\b4\b/.test(n) && /\b5\b/.test(n)) || /\b20\b/.test(n)),
        ],
      },
      {
        kind: 'java',
        q: '[Java] No main: if / else (ou if / else if) para classificar um número (positivo, negativo ou zero) e System.out.println em cada ramo. ###',
        feedback: 'Precisa: main, if, else e System.out.println.',
        javaChecks: [
          (n) => /public\s+static\s+void\s+main\s*\(/.test(n),
          (n) => /\bif\s*\(/.test(n),
          (n) => /\belse\b/.test(n),
          (n) => (n.match(/system\.out\.println/g) || []).length >= 2,
        ],
      },
      {
        kind: 'java',
        q: '[Java] for que conta de 1 até 5 (int i = 1; i <= 5; i++) e System.out.println de cada valor. ###',
        feedback: 'Precisa: for com int iniciando em 1, limite 5, ++ e System.out.println.',
        javaChecks: [
          (n) => /public\s+static\s+void\s+main\s*\(/.test(n),
          (n) => /\bfor\s*\(\s*int\s+\w+\s*=\s*1\b/.test(n),
          (n) => /<=\s*5\b|<\s*6\b/.test(n),
          (n) => /\+\+/.test(n),
          (n) => /system\.out\.println/.test(n),
        ],
      },
      {
        kind: 'java',
        q: '[Java] while (ou do-while) que repita enquanto uma condição for verdadeira e System.out.println dentro do loop. ###',
        feedback: 'Precisa: while (ou do+while), main e System.out.println.',
        javaChecks: [
          (n) => /public\s+static\s+void\s+main\s*\(/.test(n),
          (n) => /\bwhile\s*\(/.test(n),
          (n) => /system\.out\.println/.test(n),
        ],
      },
      {
        kind: 'java',
        q: '[Java] Array (int[] ou String[]) e for-each (for (tipo x : arr)) imprimindo cada elemento com System.out.println. ###',
        feedback: 'Precisa: array [], for-each com :, e System.out.println.',
        javaChecks: [
          (n) => /\[\s*\]/.test(n) || /new\s+\w+\s*\[/.test(n),
          (n) => /\bfor\s*\(\s*\w+(\s*\[\s*\])?\s+\w+\s*:/.test(n),
          (n) => /system\.out\.println/.test(n),
          (n) => /public\s+static\s+void\s+main\s*\(/.test(n),
        ],
      },
    ],
    advanced: [
      {
        kind: 'java',
        q: '[Java] Método estático com return (ex.: soma ou maior). No main: chame o método e System.out.println do resultado. ###',
        feedback: 'Precisa: método com return, main, chamada e System.out.println.',
        javaChecks: [
          (n) => /\breturn\b/.test(n),
          (n) => /static\s+\w+\s+\w+\s*\(/.test(n),
          (n) => /public\s+static\s+void\s+main\s*\(/.test(n),
          (n) => /system\.out\.println/.test(n),
        ],
      },
      {
        kind: 'java',
        q: '[Java] Uma classe (além da Main) com atributo e método. No main: new, use o objeto e System.out.println. ###',
        feedback: 'Precisa: class, new, main e System.out.println.',
        javaChecks: [
          (n) => (n.match(/\bclass\s+\w+/g) || []).length >= 1,
          (n) => /\bnew\s+\w+\s*\(/.test(n),
          (n) => /public\s+static\s+void\s+main\s*\(/.test(n),
          (n) => /system\.out\.println/.test(n),
        ],
      },
      {
        kind: 'java',
        q: '[Java] try { ... } catch (...) { ... } no main (ex.: Integer.parseInt inválido) e System.out.println no catch. ###',
        feedback: 'Precisa: try, catch, main e System.out.println.',
        javaChecks: [
          (n) => /\btry\s*\{/.test(n),
          (n) => /\bcatch\s*\(/.test(n),
          (n) => /public\s+static\s+void\s+main\s*\(/.test(n),
          (n) => /system\.out\.println/.test(n),
        ],
      },
      {
        kind: 'java',
        q: '[Java] switch com pelo menos duas case diferentes + default, e System.out.println. Pode usar Scanner ou variável fixa. ###',
        feedback: 'Precisa: switch, 2+ case, default e System.out.println.',
        javaChecks: [
          (n) => /\bswitch\s*\(/.test(n),
          (n) => (n.match(/\bcase\b/g) || []).length >= 2,
          (n) => /\bdefault\s*:/.test(n),
          (n) => /system\.out\.println/.test(n),
          (n) => /public\s+static\s+void\s+main\s*\(/.test(n),
        ],
      },
      {
        kind: 'java',
        q: '[Java] if com && ou || (duas condições). main + System.out.println. ###',
        feedback: 'Precisa: if com && ou || e System.out.println.',
        javaChecks: [
          (n) => /public\s+static\s+void\s+main\s*\(/.test(n),
          (n) => /\bif\s*\(/.test(n),
          (n) => /&&|\|\|/.test(n),
          (n) => /system\.out\.println/.test(n),
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

/** Normaliza Python para checagens flexíveis (comentários e strings neutras). */
function normPyForMatch(raw) {
  return String(raw)
    .replace(/#[^\n]*/g, ' ')
    .replace(/'''[\s\S]*?'''|"""[\s\S]*?"""/g, '""')
    .replace(/'(?:[^'\\]|\\.)*'|"(?:[^"\\]|\\.)*"/g, '""')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

function gradePython(raw, q) {
  const checks = q.pyChecks || [];
  const n = normPyForMatch(raw);
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

/** Normaliza Java para checagens (comentários e strings neutras). */
function normJavaForMatch(raw) {
  return normCsForMatch(raw);
}

function gradeJava(raw, q) {
  const checks = q.javaChecks || [];
  const n = normJavaForMatch(raw);
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

function isCodeBlockQuestion(q) {
  return q?.kind === 'csharp' || q?.kind === 'python' || q?.kind === 'java';
}

function gradeCodeBlock(raw, q) {
  if (q.kind === 'python') return gradePython(raw, q);
  if (q.kind === 'java') return gradeJava(raw, q);
  return gradeCSharp(raw, q);
}

function terminalApiBase() {
  if (typeof getBuildXpApiBase === 'function') return getBuildXpApiBase();
  if (typeof window.BUILDXP_API_BASE === 'string' && window.BUILDXP_API_BASE.trim()) {
    return window.BUILDXP_API_BASE.trim().replace(/\/$/, '');
  }
  return '';
}

function mapearTemaApiTerminal(tema) {
  const t = String(tema ?? '').trim().toLowerCase();
  if (t === '.net' || t === 'c#' || t === 'csharp' || t === 'net') return 'dotnet';
  return t || 'git';
}

function mapearNivelApiTerminal(nivel) {
  const n = String(nivel ?? '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
  if (n === 'beginner' || n === 'iniciante') return 'iniciante';
  if (n === 'advanced' || n === 'avancado') return 'avancado';
  if (n === 'mixed' || n === 'arena') return 'arena';
  return n || 'iniciante';
}

function preencherDesafioTerminalNaTela(dto, erro) {
  const root = document.getElementById('term-desafio');
  const tituloEl = document.getElementById('term-desafio-titulo');
  const enunciadoEl = document.getElementById('term-desafio-enunciado');
  const xpEl = document.getElementById('term-desafio-xp');
  const erroEl = document.getElementById('term-desafio-erro');
  if (!root) return;

  root.hidden = false;
  if (erroEl) {
    erroEl.hidden = !erro;
    erroEl.textContent = erro || '';
  }
  if (!dto) {
    if (tituloEl) tituloEl.textContent = '';
    if (enunciadoEl) enunciadoEl.textContent = '';
    if (xpEl) {
      xpEl.textContent = '';
      xpEl.hidden = true;
    }
    if (!erro) root.hidden = true;
    return;
  }
  if (tituloEl) tituloEl.textContent = dto.titulo || '';
  if (enunciadoEl) enunciadoEl.textContent = dto.enunciado || '';
  if (xpEl) {
    xpEl.textContent = '';
    xpEl.hidden = true;
  }
}

function desafioApiParaQuestao(dto) {
  const comando = String(dto?.comandoEsperado ?? '').trim();
  const enunciado = String(dto?.enunciado ?? '').trim();
  const titulo = String(dto?.titulo ?? '').trim();
  const tokens = comando.split(/\s+/).filter(Boolean);
  return {
    q: enunciado || titulo,
    titulo,
    accept: comando ? [comando] : [],
    must: tokens.slice(0, 4),
    xpRecompensa: Number(dto?.xpRecompensa) || 20,
    id: Number(dto?.id) || 0,
  };
}

async function carregarDesafioTerminal(tema, nivel) {
  const params = new URLSearchParams();
  const temaApi = mapearTemaApiTerminal(tema);
  const nivelApi = mapearNivelApiTerminal(nivel);
  if (temaApi) params.set('tema', temaApi);
  if (nivelApi) params.set('nivel', nivelApi);
  const qs = params.toString();
  const url = `${terminalApiBase()}/api/terminal/desafio${qs ? `?${qs}` : ''}`;

  preencherDesafioTerminalNaTela({
    titulo: 'Carregando desafio…',
    enunciado: 'Buscando um desafio no servidor.',
    xpRecompensa: 0,
  });

  try {
    const res = await fetch(url, {
      credentials: 'same-origin',
      cache: 'no-store',
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) {
      preencherDesafioTerminalNaTela(
        null,
        'Não foi possível carregar o desafio agora. Tente novamente em instantes.',
      );
      return null;
    }
    const data = await res.json();
    if (!data || typeof data !== 'object') {
      preencherDesafioTerminalNaTela(
        null,
        'O servidor devolveu um desafio inválido. Tente novamente.',
      );
      return null;
    }
    const dto = {
      id: data.id ?? data.Id ?? 0,
      tema: String(data.tema ?? data.Tema ?? ''),
      nivel: String(data.nivel ?? data.Nivel ?? ''),
      titulo: String(data.titulo ?? data.Titulo ?? ''),
      enunciado: String(data.enunciado ?? data.Enunciado ?? ''),
      comandoEsperado: String(data.comandoEsperado ?? data.ComandoEsperado ?? ''),
      xpRecompensa: Number(data.xpRecompensa ?? data.XpRecompensa) || 0,
    };
    preencherDesafioTerminalNaTela(dto);
    return dto;
  } catch {
    preencherDesafioTerminalNaTela(
      null,
      'Falha de conexão ao buscar o desafio. Verifique a internet e tente de novo.',
    );
    return null;
  }
}

async function consultarAgenteMentor(comandoUsuario, comandoEsperado, meta) {
  const extra = meta && typeof meta === 'object' ? meta : {};
  const criterios = Array.isArray(extra.criterios)
    ? extra.criterios.map((c) => String(c).trim()).filter(Boolean)
    : [];
  const res = await fetch(`${terminalApiBase()}/api/terminal/mentor`, {
    method: 'POST',
    credentials: 'same-origin',
    cache: 'no-store',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      comandoUsuario: String(comandoUsuario ?? ''),
      comandoEsperado: String(comandoEsperado ?? ''),
      linguagem: String(extra.linguagem ?? ''),
      enunciado: String(extra.enunciado ?? ''),
      feedback: String(extra.feedback ?? ''),
      criterios,
    }),
  });
  if (!res.ok) {
    let mensagem = 'Não foi possível consultar o mentor agora. Tente de novo em instantes.';
    try {
      const err = await res.json();
      if (err?.mensagem) mensagem = String(err.mensagem);
    } catch {
      /* mantém a mensagem padrão */
    }
    throw new Error(mensagem);
  }
  const data = await res.json();
  const explicacao = String(data?.explicacao ?? data?.Explicacao ?? '').trim();
  if (!explicacao) throw new Error('O mentor não devolveu uma explicação. Tente de novo.');
  return explicacao;
}

function metaMentorDoDesafio(q) {
  if (!q || typeof q !== 'object') return {};
  const feedback = String(q.feedback ?? '');
  const criterios = feedback
    .replace(/^precisa:\s*/i, '')
    .split(/[·,;]/)
    .map((s) => s.trim())
    .filter((s) => s.length > 1);
  return {
    linguagem: String(q.kind ?? '').toLowerCase(),
    enunciado: String(q.q ?? ''),
    feedback,
    criterios,
  };
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
    asked: [],
    currentSet: [],
    pausadoNoDesafio: false,
  };

  function getBankTopic() {
    if (state.topic === '.NET' && state.dotnetTrack === 'csharp') return 'C#';
    return state.topic;
  }

  function isCodeBlockBankTopic() {
    const t = getBankTopic();
    return t === 'C#' || t === 'Python' || t === 'Java';
  }

  function termBadgeLabel() {
    if (state.topic === '.NET' && state.dotnetTrack === 'csharp') return '.NET · CÓDIGO C#';
    if (state.topic === '.NET' && state.dotnetTrack === 'cli') return '.NET · CLI';
    if (state.topic === 'Python') return 'PYTHON · CÓDIGO';
    if (state.topic === 'Java') return 'JAVA · CÓDIGO';
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
          <span class="term-nowrap"><span class="term-purple">Dica:</span> se travar, peça ajuda ao Agente Mentor.</span>
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
        Python: { c: '#3776ab', g: '0 0 28px rgba(55,118,171,0.35)' },
        Java: { c: '#f89820', g: '0 0 28px rgba(248,152,32,0.35)' },
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

      mount.querySelector('#term-start').addEventListener('click', () => { void startRun(true); });
      mount.querySelector('#term-back').addEventListener('click', () => {
        if (state.topic === '.NET') state.introStep = 'dotnetMode';
        else state.introStep = 'topic';
        renderIntro();
      });
    }
  }

  function renderTerminalShell() {
    const inputPh = isCodeBlockBankTopic()
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
              <span class="term-dim">MODO</span>
              <span class="term-badge">${state.levelMode.toUpperCase()}</span>
            </span>
          </div>
        </div>
        <div class="term-desafio" id="term-desafio" hidden>
          <div class="term-desafio-titulo" id="term-desafio-titulo"></div>
          <div class="term-desafio-enunciado" id="term-desafio-enunciado"></div>
          <div class="term-desafio-xp" id="term-desafio-xp"></div>
          <div class="term-desafio-erro" id="term-desafio-erro" hidden></div>
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

  function criarBotaoMentor(comandoUsuario, comandoEsperado, meta) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'term-btn ghost term-mentor-btn';
    btn.setAttribute('aria-label', 'Pedir ajuda ao Agente Mentor');

    const icon = document.createElement('span');
    icon.className = 'term-mentor-btn-icon';
    icon.setAttribute('aria-hidden', 'true');
    icon.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18h6"/><path d="M10 21h4"/><path d="M12 3a6 6 0 0 0-3.5 10.8c.6.5 1 1.2 1.1 2 .1.4.4.7.8.7h3.2c.4 0 .7-.3.8-.7.1-.8.5-1.5 1.1-2A6 6 0 0 0 12 3z"/></svg>';

    const label = document.createElement('span');
    label.className = 'term-mentor-btn-label';
    label.textContent = 'Pedir ajuda ao Agente Mentor';

    btn.append(icon, label);
    btn.addEventListener('click', () => {
      void pedirAjudaMentor(btn, label, comandoUsuario, comandoEsperado, meta);
    });
    return btn;
  }

  async function pedirAjudaMentor(btn, label, comandoUsuario, comandoEsperado, meta) {
    if (btn.disabled) return;
    btn.disabled = true;
    const original = label.textContent;
    label.textContent = 'Consultando o Agente Mentor…';
    bloquearInputDoTerminal();

    try {
      const explicacao = await consultarAgenteMentor(comandoUsuario, comandoEsperado, meta);

      const tip = document.createElement('div');
      tip.className = 'term-line term-mentor-tip';
      tip.setAttribute('unselectable', 'on');
      const tipLabel = document.createElement('span');
      tipLabel.className = 'term-mentor-tip-label';
      tipLabel.textContent = 'Agente Mentor: ';
      const body = document.createElement('span');
      body.textContent = explicacao;
      tip.appendChild(tipLabel);
      tip.appendChild(body);
      ['copy', 'cut', 'contextmenu', 'selectstart', 'dragstart'].forEach((evt) => {
        tip.addEventListener(evt, (e) => e.preventDefault());
      });

      const actions = btn.closest('.term-retry-actions');
      if (actions) actions.insertAdjacentElement('beforebegin', tip);
      else btn.parentElement?.insertAdjacentElement('afterend', tip);

      btn.remove();
      bloquearInputDoTerminal();

      const screen = mount.querySelector('#term-screen');
      if (screen) screen.scrollTop = screen.scrollHeight;
    } catch (err) {
      btn.disabled = false;
      label.textContent = original;
      const msg = err instanceof Error ? err.message : 'Não foi possível consultar o mentor agora.';
      line(msg, 'term-bad');
      liberarInputDoTerminal();
    }
  }

  function removerAcoesPosErro() {
    mount.querySelectorAll('.term-retry-actions').forEach((el) => el.remove());
  }

  function removerBlocoMentor() {
    const screen = mount.querySelector('#term-screen');
    if (!screen) return;
    screen.querySelectorAll('.term-mentor-tip, .term-mentor-row, .term-mentor-btn').forEach((el) => el.remove());
  }

  function bloquearInputDoTerminal() {
    const input = mount.querySelector('#term-input');
    const send = mount.querySelector('#term-send');
    if (input) {
      input.blur();
      input.value = '';
      input.disabled = true;
    }
    if (send) send.disabled = true;
  }

  function liberarInputDoTerminal() {
    const input = mount.querySelector('#term-input');
    const send = mount.querySelector('#term-send');
    if (input) {
      input.disabled = false;
      input.focus();
    }
    if (send) send.disabled = false;
  }

  function limparInputDoTerminal() {
    const input = mount.querySelector('#term-input');
    if (input) input.value = '';
    liberarInputDoTerminal();
  }

  function resetarAcumuloDoDesafioAtual() {
    const q = state.currentSet[state.questionIdx];
    state.codeBlockAccum = isCodeBlockQuestion(q) ? [] : null;
  }

  function tentarNovamenteMesmoDesafio() {
    state.pausadoNoDesafio = false;
    removerBlocoMentor();
    removerAcoesPosErro();
    resetarAcumuloDoDesafioAtual();
    limparInputDoTerminal();
  }

  function avancarDesafio() {
    state.pausadoNoDesafio = false;
    removerAcoesPosErro();
    limparInputDoTerminal();
    state.questionIdx++;
    if (state.questionIdx >= 5) finishRun();
    else void askCurrent();
  }

  function exibirAcoesPosErro(comandoUsuario, comandoEsperado, desafio) {
    state.pausadoNoDesafio = true;
    removerAcoesPosErro();
    const screen = mount.querySelector('#term-screen');
    if (!screen) return;

    const actions = document.createElement('div');
    actions.className = 'term-actions term-retry-actions';

    const mentor = criarBotaoMentor(comandoUsuario, comandoEsperado, metaMentorDoDesafio(desafio));

    const retry = document.createElement('button');
    retry.type = 'button';
    retry.className = 'term-btn ghost';
    retry.textContent = '🔄 Tentar novamente';
    retry.addEventListener('click', () => tentarNovamenteMesmoDesafio());

    const next = document.createElement('button');
    next.type = 'button';
    next.className = 'term-btn primary';
    next.textContent = '➡️ Ir para o próximo desafio';
    next.addEventListener('click', () => avancarDesafio());

    actions.append(mentor, retry, next);
    screen.appendChild(actions);
    screen.scrollTop = screen.scrollHeight;
    bloquearInputDoTerminal();
  }

  async function startRun(resetLevel) {
    if (resetLevel) state.runLevel = 1;
    state.questionIdx = 0;
    state.codeBlockAccum = null;
    state.pausadoNoDesafio = false;
    state.currentSet = pickQuestions(getBankTopic(), state.levelMode, state.runLevel);
    renderTerminalShell();

    replayAdminGate();

    line(`BuildXP Terminal Training — ${termBadgeLabel()}`, 'term-dim');
    if (isCodeBlockBankTopic()) {
      const bank = getBankTopic();
      const lang = bank === 'Python' ? 'Python' : bank === 'Java' ? 'Java' : 'C#';
      const hint =
        bank === 'Python'
          ? 'listas, dicts, loops e dados; nomes livres — validamos a estrutura.'
          : bank === 'Java'
            ? 'lógica Java (main, if, for, classes); nomes livres — validamos a estrutura.'
            : 'nomes de classes e variáveis livres; validamos a estrutura.';
      line(`Modo ${lang}: ${hint}`, 'term-dim');
      line(`Bloco: uma linha por Enter; linha só com ### envia o bloco.`, 'term-dim');
    } else {
      line(`Dica: foque na estrutura do comando.`, 'term-dim');
    }
    line('', '');

    const input = mount.querySelector('#term-input');
    const send = mount.querySelector('#term-send');
    if (input) input.disabled = true;
    if (send) send.disabled = true;

    await askCurrent();

    const onSend = () => { void submitAnswer(); };
    send?.addEventListener('click', onSend);
    input?.addEventListener('keydown', (e) => { if (e.key === 'Enter') onSend(); });
    if (input) {
      input.disabled = false;
      input.focus();
    }
    if (send) send.disabled = false;

    mount.querySelector('#term-restart').addEventListener('click', () => { void startRun(true); });
    mount.querySelector('#term-exit').addEventListener('click', () => renderIntro());
  }

  async function askCurrent() {
    if (isCodeBlockBankTopic()) {
      const q = state.currentSet[state.questionIdx];
      if (!q) return;
      preencherDesafioTerminalNaTela({
        titulo: termBadgeLabel(),
        enunciado: q.q,
        xpRecompensa: 20,
      });
      line(`${q.q}`, '');
      if (isCodeBlockQuestion(q)) {
        state.codeBlockAccum = [];
        line('Bloco: uma linha por Enter; última linha só ### para enviar.', 'term-dim');
      } else {
        state.codeBlockAccum = null;
      }
      return;
    }

    const dto = await carregarDesafioTerminal(state.topic, state.levelMode);
    if (!dto) {
      const fallback = state.currentSet[state.questionIdx];
      if (!fallback) return;
      preencherDesafioTerminalNaTela(
        { titulo: 'Desafio local', enunciado: fallback.q, xpRecompensa: 20 },
        'Não foi possível buscar no servidor. Usando um desafio local.',
      );
      line('Usando um desafio local enquanto o servidor não responde.', 'term-dim');
      line(`${fallback.q}`, '');
      state.codeBlockAccum = null;
      return;
    }

    const q = desafioApiParaQuestao(dto);
    state.currentSet[state.questionIdx] = q;
    line(q.titulo ? `${q.titulo} — ${q.q}` : `${q.q}`, '');
    state.codeBlockAccum = null;
  }

  function gradeAnswer(raw, q) {
    const user = norm(raw);
    const accepted = (q.accept ?? []).map(norm);

    const xpFull = Number(q.xpRecompensa) > 0 ? Number(q.xpRecompensa) : 20;
    const xpPartial = Math.max(1, Math.floor(xpFull / 2));

    if (accepted.includes(user)) return { result: 'correct', xp: xpFull };

    // partial: match enough required tokens (ignoring placeholders like <arquivo>)
    const ut = new Set(tokenize(user));
    const must = (q.must ?? [])
      .map(norm)
      .filter(t => t && !t.startsWith('<') && !t.endsWith('>'));
    const mustHits = must.filter(t => ut.has(t)).length;
    const needed = Math.max(2, Math.ceil(must.length * 0.6));
    const looksLike = accepted.some(a => a.split(' ')[0] && user.startsWith(a.split(' ')[0]));

    if ((must.length > 0 && mustHits >= Math.min(needed, must.length)) || (looksLike && user.length >= 3)) {
      return { result: 'partial', xp: xpPartial };
    }
    return { result: 'wrong', xp: 0 };
  }

  async function submitAnswer() {
    const input = mount.querySelector('#term-input');
    if (!input || input.disabled) return;
    const raw = input.value;
    if (!raw.trim()) return;

    const q = state.currentSet[state.questionIdx];
    if (!q) return;

    removerAcoesPosErro();
    state.pausadoNoDesafio = false;

    /* Modo C# acumula linhas em bloco (###); tem de passar antes pelo portão admin. */
    if (tryConsumeAdminGate(raw, 'run')) {
      input.value = '';
      return;
    }

    if (isCodeBlockQuestion(q)) {
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

      const g = gradeCodeBlock(full, q);
      if (g.result === 'correct') line('✔ Correto.', 'term-good');
      else if (g.result === 'partial') line('◐ Parcialmente correto.', 'term-warn');
      else line('✖ Incorreto.', 'term-bad');

      if (g.result !== 'correct') bloquearInputDoTerminal();

      line(q.feedback || 'Confira o enunciado e os elementos obrigatórios.', 'term-dim');
      if (g.result !== 'correct') {
        exibirAcoesPosErro(full, q.accept?.[0] || '', q);
        return;
      }
      line('', '');
      avancarDesafio();
      return;
    }

    line(`$ ${raw}`, 'term-dim');

    const g = gradeAnswer(raw, q);
    if (g.result === 'correct') line('✔ Correto.', 'term-good');
    else if (g.result === 'partial') line('◐ Parcialmente correto.', 'term-warn');
    else line('✖ Incorreto.', 'term-bad');

    if (g.result !== 'correct') bloquearInputDoTerminal();

    if (g.result !== 'correct') {
      exibirAcoesPosErro(raw, q.accept?.[0] || '', q);
      return;
    }

    line('', '');
    avancarDesafio();
  }

  function finishRun() {
    line('—'.repeat(32), 'term-dim');
    line('Fim do treino. Boa sessão.', 'term-good');
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
      void startRun(false);
    });
    mount.querySelector('#term-again')?.addEventListener('click', () => { void startRun(true); });
    mount.querySelector('#term-exit2')?.addEventListener('click', () => renderIntro());
  }

  renderIntro();
}
