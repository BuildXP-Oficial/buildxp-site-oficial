using BuildXP.API.Models.Dtos;

namespace BuildXP.API.Services;

public class ConhecimentoChatService
{
    private readonly ILogger<ConhecimentoChatService> _logger;

    public ConhecimentoChatService(ILogger<ConhecimentoChatService> logger)
    {
        _logger = logger;
    }

    public Task<ConhecimentoChatRespostaDto> ResponderAsync(ConhecimentoChatRequisicaoDto requisicao)
    {
        var resposta = new ConhecimentoChatRespostaDto
        {
            RespostaAgente = MontarResposta(requisicao),
        };
        return Task.FromResult(resposta);
    }

    private string MontarResposta(ConhecimentoChatRequisicaoDto? requisicao)
    {
        var mensagem = (requisicao?.MensagemUsuario ?? string.Empty).Trim();
        var tema = NormalizarTema(requisicao?.TemaOuCardAtual);

        if (string.IsNullOrWhiteSpace(mensagem))
            return $"Estou aqui como especialista em {Rotulo(tema)}. Pergunte sobre o que acabou de ler no card — um comando, um conceito ou um trecho que não fechou.";

        if (string.IsNullOrWhiteSpace(tema) || tema == "geral")
        {
            _logger.LogInformation("Chat de conhecimento sem tema específico. Mensagem={Mensagem}", Recortar(mensagem));
            return "Me diga em qual card você está (Git, Docker, NPM, .NET, Python, Java ou API) para eu responder no contexto certo da trilha.";
        }

        _logger.LogInformation(
            "Chat de conhecimento. Tema={Tema} Mensagem={Mensagem}",
            tema,
            Recortar(mensagem));

        return ResponderComoEspecialista(tema, mensagem);
    }

    private static string ResponderComoEspecialista(string tema, string mensagem)
    {
        var q = Compactar(mensagem);

        if (PareceSaudacao(q))
            return $"Oi. Sou o agente deste card de {Rotulo(tema)}. Manda a dúvida sobre a explicação — pode ser um comando, um termo ou o porquê de um passo.";

        foreach (var (chave, resposta) in Catalogo(tema))
        {
            if (q.Contains(chave, StringComparison.Ordinal))
                return resposta;
        }

        return tema switch
        {
            "git" => "No Git, pense no fluxo working tree → stage (`git add`) → commit. Me diga o comando ou o trecho do card que travou (status, branch, merge, remote) que eu explico no contexto desta trilha.",
            "docker" => "No Docker, separe imagem (receita) de container (instância em execução). Diga se a dúvida é `run`, `ps`, volumes, portas ou Dockerfile que eu amarro na explicação do card.",
            "npm" => "No NPM, o `package.json` descreve o projeto e o lockfile congela versões. Pergunte sobre `install`, scripts, `-D` ou `npx` com o trecho que você leu.",
            "dotnet" => "No .NET, `dotnet new` cria, `restore` baixa pacotes, `build` compila e `run` executa. Aponte o comando ou o conceito do card (SDK, NuGet, publish) que eu detalho.",
            "python" => "Em Python, o interpretador + venv isolam dependências. Diga se a dúvida é `venv`, `pip`, script ou o trecho da trilha que não encaixou.",
            "java" => "Em Java, `javac` gera `.class` e `java` executa. Pergunte sobre classpath, JAR, main ou o passo do card que ficou confuso.",
            "api" => "Em APIs, o cliente chama um endpoint (método + URL) e recebe JSON. Fale se a dúvida é GET/POST, status HTTP, headers ou o exemplo do card.",
            _ => $"Posso te ajudar neste card de {Rotulo(tema)}. Reformule a pergunta com o comando ou o conceito que aparece na explicação.",
        };
    }

    private static IEnumerable<(string Chave, string Resposta)> Catalogo(string tema) => tema switch
    {
        "git" =>
        [
            ("init", "O `git init` cria a pasta `.git` na pasta atual e transforma o diretório em repositório. Depois disso o Git passa a rastrear mudanças — ainda sem commit até você adicionar e gravar."),
            ("status", "`git status` mostra o que está modificado, o que já foi para o stage e o que ainda não foi commitado. Use sempre que o card falar em 'ver o estado' do repo."),
            ("add", "`git add` manda arquivos para o stage (a área de preparação). `git add .` inclui tudo da pasta atual; um arquivo específico entra só ele no próximo commit."),
            ("commit", "`git commit` grava o snapshot do que está no stage. Sem `add` antes, o commit não leva as mudanças novas. A mensagem descreve o porquê daquele snapshot."),
            ("branch", "Branch é uma linha de histórico. Criar/trocar (`checkout -b` ou `switch -c`) deixa o card de feature isolado da `main` até você mesclar."),
            ("merge", "O merge junta o histórico de outra branch na atual. Se os mesmos trechos mudaram nos dois lados, o Git pede para resolver o conflito antes de concluir."),
            ("clone", "`git clone` copia um repositório remoto (histórico + arquivos) para a sua máquina e já configura o `origin`."),
            ("push", "`git push` envia commits locais para o remoto. Sem o remoto e a branch configurados, o Git pede ` -u origin nome-da-branch` na primeira vez."),
            ("pull", "`git pull` busca e integra o que está no remoto. É `fetch` + `merge` (ou rebase, se configurado). Use antes de empilhar commits em cima de um remoto desatualizado."),
            ("log", "`git log` lista commits. `--oneline` resume em uma linha por commit — útil para ver o recado do card sobre histórico."),
        ],
        "docker" =>
        [
            ("image", "Imagem é o pacote imutável (camadas) com o que o container precisa para subir. Você baixa (`pull`) ou constrói (`build`); o container nasce a partir dela."),
            ("container", "Container é o processo isolado criado a partir de uma imagem. `docker ps` lista os que estão rodando; `-a` inclui os parados."),
            ("run", "`docker run` cria e inicia um container. `-d` é background, `-p 8080:80` publica porta, `--name` dá um nome estável. Sem `-d` o terminal fica preso no processo."),
            ("ps", "`docker ps` lista containers em execução. Com `-a` você vê também os que já pararam — comum quando o card pede para checar se o container existe."),
            ("build", "`docker build` lê o Dockerfile e gera uma imagem. `-t nome` coloca a tag; o `.` no final é o contexto (pasta enviada ao daemon)."),
            ("dockerfile", "O Dockerfile é a receita: `FROM` a base, `COPY` arquivos, `RUN` comandos na build, `CMD`/`ENTRYPOINT` o que sobe no `run`."),
            ("compose", "`docker compose up` sobe o conjunto definido no `compose.yml`. `-d` deixa em background. É o jeito de orquestrar vários serviços do card sem `run` solto."),
            ("volume", "Volume persiste dados fora do ciclo de vida do container. Sem volume, o que você escreve no filesystem do container some quando ele é removido."),
            ("port", "O mapeamento `-p hospedeiro:container` expõe o serviço. 8080:80 significa: você acessa 8080 na máquina, o processo escuta 80 dentro do container."),
            ("pull", "`docker pull` baixa a imagem do registry. Sem isso, o primeiro `run` também tenta baixar — o card costuma separar os dois passos de propósito."),
        ],
        "npm" =>
        [
            ("init", "`npm init -y` cria um `package.json` com defaults. É o ponto de partida do card: scripts e dependências passam a viver nesse arquivo."),
            ("install", "`npm install` / `npm i` baixa o que está no `package.json` (e no lockfile, se existir). Sem argumentos, restaura o projeto; com um pacote, adiciona dependência."),
            ("save-dev", "Pacotes `-D` / `--save-dev` vão em `devDependencies`: ferramentas de build e teste, não o que a app precisa em produção."),
            ("script", "`npm run nome` executa a chave em `scripts` do `package.json`. O card usa isso para `build`, `start` e `test` sem decorar o comando longo."),
            ("npx", "`npx` roda um binário de pacote sem instalar global. Útil para CLIs pontuais que o card menciona uma vez só."),
            ("lock", "O lockfile (`package-lock.json`) congela versões exatas. `npm ci` reinstala fiel a ele — o fluxo de CI do card."),
            ("outdated", "`npm outdated` lista o que tem versão mais nova. Não atualiza sozinho: só informa, como o card de inspeção."),
            ("uninstall", "`npm uninstall` tira o pacote do `node_modules` e do `package.json`. O lockfile também é atualizado."),
        ],
        "dotnet" =>
        [
            ("new", "`dotnet new console` (ou o template do card) gera o projeto. `-n` define o nome. Depois vem `restore`/`build`/`run`."),
            ("restore", "`dotnet restore` baixa pacotes NuGet. O `build` e o `run` já restauram se precisar, mas o card isola o passo para ficar explícito."),
            ("build", "`dotnet build` compila. Erro aqui é de código ou de referência, não de execução."),
            ("run", "`dotnet run` restaura se preciso, compila e executa o projeto atual. É o 'ver na prática' da trilha .NET."),
            ("publish", "`dotnet publish -c Release -o ./publish` gera o artefato para deploy. Release otimiza; `-o` escolhe a pasta de saída."),
            ("test", "`dotnet test` roda os testes da solução/projeto. Precisa de um projeto de teste (xUnit, NUnit etc.)."),
            ("sdk", "O SDK é o conjunto de ferramentas (`dotnet`). `--list-sdks` mostra o que está instalado — útil quando o card fala em versão alvo."),
            ("nuget", "NuGet é o repositório de pacotes. `dotnet add package` inclui referência; `dotnet list package` mostra o que o projeto usa."),
        ],
        "python" =>
        [
            ("venv", "`python -m venv .venv` cria um ambiente isolado. No Windows ative com `.venv\\Scripts\\activate`. Dependências do card ficam nesse ambiente, não no Python global."),
            ("pip", "`pip install` (de preferência `python -m pip`) instala no interpretador ativo. O `-m` garante o pip daquele Python/venv."),
            ("requirement", "`pip install -r requirements.txt` instala a lista do projeto. `pip freeze > requirements.txt` exporta o que está no ambiente."),
            ("script", "`python arquivo.py` executa o script com o interpretador ativo. Se o venv estiver ligado, usa os pacotes dele."),
            ("version", "`python --version` confirma qual interpretador está no PATH. Divergência de versão é causa clássica de 'no meu PC funciona'."),
        ],
        "java" =>
        [
            ("javac", "`javac App.java` gera `App.class`. Sem essa compilação, `java App` não encontra o bytecode do card."),
            ("class", "`java App` executa a classe que tem `public static void main`. O nome precisa bater com o arquivo compilado (e o classpath)."),
            ("classpath", "`-cp` / `-classpath` diz onde estão os `.class`. Pasta `out` no card: compile com `-d out` e rode `java -cp out App`."),
            ("jar", "JAR empacota classes. `jar cf` cria; `java -jar` executa se o manifesto apontar a classe principal."),
            ("main", "`public static void main(String[] args)` é a entrada. Sem esse método público e estático, a JVM não sabe por onde começar."),
        ],
        "api" =>
        [
            ("get", "GET busca um recurso. Não deve ter efeito colateral. A resposta costuma ser JSON; 200 é sucesso, 404 não achou."),
            ("post", "POST cria ou dispara uma ação. O corpo vai em JSON. 201 é criado; 400 indica payload inválido — leia a mensagem do card."),
            ("json", "JSON é o formato `{ \"chave\": valor }` que a API troca. No card, o exemplo de request/response é o contrato que o cliente precisa respeitar."),
            ("header", "Headers carregam metadados (`Content-Type`, `Authorization`). Sem `Content-Type: application/json`, o servidor pode recusar o corpo."),
            ("status", "O código HTTP resume o resultado: 2xx ok, 4xx erro do cliente, 5xx erro do servidor. O card usa isso para você ler a resposta além do texto."),
            ("endpoint", "Endpoint = método + caminho (`GET /api/card`). A base da URL (host/porta) + esse caminho forma o endereço completo."),
        ],
        _ => Array.Empty<(string, string)>(),
    };

    private static string NormalizarTema(string? bruto)
    {
        var t = (bruto ?? string.Empty).Trim().ToLowerInvariant();
        t = t.Replace(" ", "", StringComparison.Ordinal);
        if (t.Contains("git", StringComparison.Ordinal)) return "git";
        if (t.Contains("docker", StringComparison.Ordinal)) return "docker";
        if (t.Contains("npm", StringComparison.Ordinal) || t.Contains("node", StringComparison.Ordinal)) return "npm";
        if (t.Contains("dotnet", StringComparison.Ordinal) || t.Contains(".net", StringComparison.Ordinal) || t.Contains("csharp", StringComparison.Ordinal) || t == "c#")
            return "dotnet";
        if (t.Contains("python", StringComparison.Ordinal) || t == "py") return "python";
        if (t.Contains("java", StringComparison.Ordinal)) return "java";
        if (t.Contains("api", StringComparison.Ordinal) || t.Contains("http", StringComparison.Ordinal)) return "api";
        return string.IsNullOrWhiteSpace(t) ? "geral" : t;
    }

    private static string Rotulo(string tema) => tema switch
    {
        "git" => "Git",
        "docker" => "Docker",
        "npm" => "NPM",
        "dotnet" => ".NET",
        "python" => "Python",
        "java" => "Java",
        "api" => "APIs",
        "geral" => "conhecimento",
        _ => tema,
    };

    private static bool PareceSaudacao(string q) =>
        q is "oi" or "ola" or "olá" or "hey" or "hello" or "eai" or "eae"
        || q.StartsWith("oi ", StringComparison.Ordinal)
        || q.StartsWith("olá", StringComparison.Ordinal)
        || q.StartsWith("ola ", StringComparison.Ordinal);

    private static string Compactar(string texto) =>
        string.Join(' ', texto.Trim().ToLowerInvariant().Split(' ', StringSplitOptions.RemoveEmptyEntries));

    private static string Recortar(string texto) =>
        texto.Length <= 120 ? texto : texto[..117] + "…";
}
