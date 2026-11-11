using BuildXP.API.Models;

namespace BuildXP.API.Repositories;

public class TerminalQuestaoRepository : ITerminalQuestaoRepository
{
    private static readonly IReadOnlyList<TerminalQuestao> Catalogo = CriarBase();

    public Task<IEnumerable<TerminalQuestao>> ObterTodas() =>
        Task.FromResult<IEnumerable<TerminalQuestao>>(Catalogo);

    private static List<TerminalQuestao> CriarBase()
    {
        var id = 1;
        var lista = new List<TerminalQuestao>(180);

        void Add(
            string tema,
            string nivel,
            string titulo,
            string enunciado,
            string comando,
            int xp)
        {
            lista.Add(new TerminalQuestao
            {
                Id = id++,
                Tema = tema,
                Nivel = nivel,
                Titulo = titulo,
                Enunciado = enunciado,
                ComandoEsperado = comando,
                XpRecompensa = xp,
            });
        }

        // ── Git iniciante (cheap codes: setup, repo, stage, branch, push) ──
        Add("git", "iniciante", "Versão do Git", "Verifique a versão do Git instalada na máquina.", "git --version", 10);
        Add("git", "iniciante", "Nome do usuário", "Defina o nome global do usuário Git como BuildXP.", "git config --global user.name \"BuildXP\"", 10);
        Add("git", "iniciante", "E-mail do usuário", "Defina o e-mail global do Git como buildxp@example.com.", "git config --global user.email \"buildxp@example.com\"", 10);
        Add("git", "iniciante", "Listar configs", "Liste todas as configurações do Git.", "git config --list", 10);
        Add("git", "iniciante", "Branch padrão", "Faça novos repositórios nascerem com a branch main.", "git config --global init.defaultBranch main", 10);
        Add("git", "iniciante", "Repositório local", "Inicialize um repositório Git na pasta atual.", "git init", 10);
        Add("git", "iniciante", "Status do working tree", "Veja o status do repositório (arquivos staged e unstaged).", "git status", 10);
        Add("git", "iniciante", "Stage completo", "Adicione todos os arquivos modificados ao stage.", "git add .", 10);
        Add("git", "iniciante", "Stage de um arquivo", "Coloque apenas o arquivo README.md no stage.", "git add README.md", 10);
        Add("git", "iniciante", "Primeiro commit", "Crie um commit com a mensagem feat: inicio.", "git commit -m \"feat: inicio\"", 10);
        Add("git", "iniciante", "Histórico resumido", "Mostre o histórico resumido, uma linha por commit.", "git log --oneline", 10);
        Add("git", "iniciante", "Listar branches", "Liste as branches locais.", "git branch", 10);
        Add("git", "iniciante", "Nova branch", "Crie e mude para a branch minha-feature.", "git checkout -b minha-feature", 10);
        Add("git", "iniciante", "Trocar de branch", "Mude para a branch main com o comando moderno de troca.", "git switch main", 10);
        Add("git", "iniciante", "Push com upstream", "Envie a branch atual ao origin já definindo o upstream.", "git push -u origin main", 10);

        // ── Git avançado (cheap codes: rebase, stash, restore, bisect, reflog) ──
        Add("git", "avancado", "Diff do working tree", "Mostre as diferenças entre working tree e stage.", "git diff", 25);
        Add("git", "avancado", "Diff do stage", "Mostre o diff do que já está no stage, antes do commit.", "git diff --staged", 25);
        Add("git", "avancado", "Unstage seguro", "Remova um arquivo do stage sem apagar as mudanças.", "git restore --staged <arquivo>", 25);
        Add("git", "avancado", "Stash rápido", "Guarde as mudanças locais temporariamente no stash.", "git stash", 25);
        Add("git", "avancado", "Listar stash", "Liste as entradas salvas no stash.", "git stash list", 25);
        Add("git", "avancado", "Aplicar stash", "Aplique o último stash e remova-o da pilha.", "git stash pop", 25);
        Add("git", "avancado", "Rebase em main", "Faça rebase da branch atual em cima de main.", "git rebase main", 25);
        Add("git", "avancado", "Pull com rebase", "Puxe do remoto reaplicando seus commits em cima da base.", "git pull --rebase", 25);
        Add("git", "avancado", "Commits exclusivos", "Mostre os commits da branch atual que ainda não estão em main, em formato resumido.", "git log --oneline main..HEAD", 25);
        Add("git", "avancado", "Fetch com prune", "Baixe refs do origin e remova as de branches já apagadas no remoto.", "git fetch --prune origin", 25);
        Add("git", "avancado", "Reset suave", "Desfaça o último commit mantendo as mudanças no stage.", "git reset --soft HEAD~1", 25);
        Add("git", "avancado", "Cherry-pick", "Aplique o commit abc123 na branch atual com cherry-pick.", "git cherry-pick abc123", 25);
        Add("git", "avancado", "Reflog", "Mostre o histórico de onde o HEAD esteve, para recuperar commits.", "git reflog", 25);
        Add("git", "avancado", "Bisect", "Inicie uma busca binária para achar o commit que introduziu um bug.", "git bisect start", 25);
        Add("git", "avancado", "Revert seguro", "Crie um commit que desfaz o hash abc123 sem apagar o histórico.", "git revert abc123", 25);

        // ── Docker iniciante (cheap codes: ps, images, pull, build, rm) ──
        Add("docker", "iniciante", "Versão do Docker", "Mostre a versão do Docker instalada.", "docker --version", 10);
        Add("docker", "iniciante", "Containers ativos", "Liste os containers em execução.", "docker ps", 10);
        Add("docker", "iniciante", "Todos os containers", "Liste todos os containers, inclusive os parados.", "docker ps -a", 10);
        Add("docker", "iniciante", "Listar imagens", "Liste as imagens Docker locais.", "docker images", 10);
        Add("docker", "iniciante", "Baixar imagem", "Baixe a imagem nginx.", "docker pull nginx", 10);
        Add("docker", "iniciante", "Build local", "Faça build da imagem do diretório atual com a tag minha-app.", "docker build -t minha-app .", 10);
        Add("docker", "iniciante", "Parar container", "Pare o container chamado web.", "docker stop web", 10);
        Add("docker", "iniciante", "Iniciar container", "Inicie o container parado chamado web.", "docker start web", 10);
        Add("docker", "iniciante", "Remover container", "Remova o container chamado meu-nginx.", "docker rm meu-nginx", 10);
        Add("docker", "iniciante", "Remover imagem", "Remova a imagem chamada minha-app.", "docker rmi minha-app", 10);
        Add("docker", "iniciante", "Logs simples", "Veja os logs do container chamado web.", "docker logs web", 10);
        Add("docker", "iniciante", "Run interativo", "Rode a imagem ubuntu de forma interativa removendo o container ao sair.", "docker run -it --rm ubuntu", 10);
        Add("docker", "iniciante", "Inspecionar imagem", "Inspecione a imagem nginx.", "docker inspect nginx", 10);
        Add("docker", "iniciante", "Info do daemon", "Mostre informações do Docker daemon (sistema, containers, imagens).", "docker info", 10);
        Add("docker", "iniciante", "Ajuda do run", "Abra a ajuda do comando docker run.", "docker run --help", 10);

        // ── Docker avançado (cheap codes: run -d, exec, compose, volume, network) ──
        Add("docker", "avancado", "Run em background", "Rode nginx em background expondo 8080:80 com o nome web.", "docker run -d -p 8080:80 --name web nginx", 25);
        Add("docker", "avancado", "Shell no container", "Entre no shell de um container em execução chamado web.", "docker exec -it web sh", 25);
        Add("docker", "avancado", "Logs em follow", "Acompanhe os logs do container web em tempo real.", "docker logs -f web", 25);
        Add("docker", "avancado", "Limpar imagens dangling", "Remova imagens dangling sem uso.", "docker image prune", 25);
        Add("docker", "avancado", "Compose up", "Suba um docker compose em background.", "docker compose up -d", 25);
        Add("docker", "avancado", "Compose down", "Derrube os serviços do compose removendo volumes órfãos.", "docker compose down -v", 25);
        Add("docker", "avancado", "Compose logs", "Veja os logs de todos os serviços do compose.", "docker compose logs", 25);
        Add("docker", "avancado", "Compose ps", "Liste os serviços do compose e o estado de cada um.", "docker compose ps", 25);
        Add("docker", "avancado", "Criar volume", "Crie um volume chamado dados-app.", "docker volume create dados-app", 25);
        Add("docker", "avancado", "Listar volumes", "Liste os volumes Docker.", "docker volume ls", 25);
        Add("docker", "avancado", "Criar rede", "Crie a rede bridge chamada app-net.", "docker network create app-net", 25);
        Add("docker", "avancado", "Inspecionar rede", "Inspecione a rede chamada app-net.", "docker network inspect app-net", 25);
        Add("docker", "avancado", "Stats ao vivo", "Mostre uso de CPU e memória dos containers em tempo real.", "docker stats", 25);
        Add("docker", "avancado", "Copiar arquivo", "Copie o arquivo app.log de dentro do container web para a pasta atual.", "docker cp web:/app.log .", 25);
        Add("docker", "avancado", "System prune", "Limpe containers, redes e imagens parados sem uso (incluindo dangling).", "docker system prune", 25);

        // ── NPM iniciante (cheap codes: init, install, run, version) ──
        Add("npm", "iniciante", "Versão do NPM", "Mostre a versão do NPM instalada.", "npm --version", 10);
        Add("npm", "iniciante", "Init rápido", "Inicialize um projeto NPM com as respostas padrão, sem perguntas.", "npm init -y", 10);
        Add("npm", "iniciante", "Dependência de produção", "Instale express como dependência de produção.", "npm install express", 10);
        Add("npm", "iniciante", "DevDependency", "Instale nodemon como dependência de desenvolvimento.", "npm install --save-dev nodemon", 10);
        Add("npm", "iniciante", "Script start", "Execute o script start do package.json.", "npm start", 10);
        Add("npm", "iniciante", "Script build", "Execute o script build do package.json.", "npm run build", 10);
        Add("npm", "iniciante", "Script test", "Execute o script test do package.json.", "npm test", 10);
        Add("npm", "iniciante", "Instalar o projeto", "Instale as dependências descritas no package.json.", "npm install", 10);
        Add("npm", "iniciante", "Ajuda do init", "Abra a ajuda do comando npm init.", "npm init --help", 10);
        Add("npm", "iniciante", "Ver o package", "Mostre os metadados do pacote da pasta atual.", "npm pkg get", 10);
        Add("npm", "iniciante", "Listar scripts", "Liste os scripts disponíveis no package.json.", "npm run", 10);
        Add("npm", "iniciante", "Instalar lodash", "Instale lodash como dependência de produção.", "npm install lodash", 10);
        Add("npm", "iniciante", "Versão do Node", "Mostre a versão do Node.js (útil no mesmo fluxo NPM da trilha).", "node --version", 10);
        Add("npm", "iniciante", "Doctor", "Rode o diagnóstico do NPM para checar a instalação.", "npm doctor", 10);
        Add("npm", "iniciante", "Whoami", "Mostre o usuário logado no registry NPM.", "npm whoami", 10);

        // ── NPM avançado (cheap codes: ci, outdated, audit, cache, globais) ──
        Add("npm", "avancado", "Install de CI", "Faça uma instalação limpa usando o package-lock (ambiente de CI).", "npm ci", 25);
        Add("npm", "avancado", "Pacotes desatualizados", "Liste os pacotes desatualizados.", "npm outdated", 25);
        Add("npm", "avancado", "Remover pacote", "Remova o pacote lodash.", "npm uninstall lodash", 25);
        Add("npm", "avancado", "Limpar cache", "Limpe o cache do NPM forçando a operação.", "npm cache clean --force", 25);
        Add("npm", "avancado", "Pacotes globais", "Liste os pacotes globais no nível 0.", "npm list -g --depth=0", 25);
        Add("npm", "avancado", "Audit", "Verifique vulnerabilidades conhecidas nas dependências.", "npm audit", 25);
        Add("npm", "avancado", "Audit fix", "Aplique correções automáticas de vulnerabilidades.", "npm audit fix", 25);
        Add("npm", "avancado", "Atualizar pacote", "Atualize o express para a versão mais recente permitida pelo range.", "npm update express", 25);
        Add("npm", "avancado", "Dedup", "Otimize a árvore de dependências removendo duplicatas.", "npm dedupe", 25);
        Add("npm", "avancado", "Arborist ls", "Liste a árvore de dependências do projeto no nível 0.", "npm ls --depth=0", 25);
        Add("npm", "avancado", "Publish", "Publique o pacote atual no registry.", "npm publish", 25);
        Add("npm", "avancado", "Workspaces", "Instale as dependências de todos os workspaces.", "npm install --workspaces", 25);
        Add("npm", "avancado", "Cache verify", "Verifique a integridade do cache do NPM.", "npm cache verify", 25);
        Add("npm", "avancado", "Config list", "Liste a configuração efetiva do NPM.", "npm config list", 25);
        Add("npm", "avancado", "Pack", "Gere o tarball do pacote sem publicar.", "npm pack", 25);

        // ── Python iniciante (cheap codes: version, venv, pip, run) ──
        Add("python", "iniciante", "Versão do Python", "Mostre a versão do Python instalada.", "python --version", 10);
        Add("python", "iniciante", "Ambiente virtual", "Crie um ambiente virtual chamado .venv na pasta do projeto.", "python -m venv .venv", 10);
        Add("python", "iniciante", "Ativar no Windows", "Ative o ambiente virtual .venv no Windows.", ".venv\\Scripts\\activate", 10);
        Add("python", "iniciante", "Sair do venv", "Saia do ambiente virtual ativo.", "deactivate", 10);
        Add("python", "iniciante", "Atualizar pip", "Atualize o pip usando o módulo do Python ativo.", "python -m pip install --upgrade pip", 10);
        Add("python", "iniciante", "Instalar pacote", "Instale o pacote requests com pip.", "pip install requests", 10);
        Add("python", "iniciante", "Listar pacotes", "Liste os pacotes instalados no ambiente.", "pip list", 10);
        Add("python", "iniciante", "Rodar script", "Execute o arquivo main.py.", "python main.py", 10);
        Add("python", "iniciante", "REPL rápido", "Execute um print de oi como one-liner no terminal.", "python -c \"print('oi')\"", 10);
        Add("python", "iniciante", "Servidor estático", "Suba o servidor HTTP estático da stdlib na porta 8000.", "python -m http.server 8000", 10);
        Add("python", "iniciante", "Help do Python", "Abra o help interativo do Python.", "python -h", 10);
        Add("python", "iniciante", "Módulo pip", "Instale pandas usando python -m pip (pip do interpretador ativo).", "python -m pip install pandas", 10);
        Add("python", "iniciante", "Show de pacote", "Mostre metadados e versão do pacote requests.", "pip show requests", 10);
        Add("python", "iniciante", "Instalar requirements", "Instale as dependências a partir de requirements.txt.", "pip install -r requirements.txt", 10);
        Add("python", "iniciante", "Compilar pasta", "Verifique a sintaxe de todos os .py da pasta atual.", "python -m compileall .", 10);

        // ── Python avançado (cheap codes: freeze, pytest, fastapi, django) ──
        Add("python", "avancado", "Freeze", "Exporte as dependências instaladas para requirements.txt.", "pip freeze > requirements.txt", 25);
        Add("python", "avancado", "Instalar editável", "Instale o projeto local em modo editável.", "pip install -e .", 25);
        Add("python", "avancado", "Uninstall", "Remova o pacote requests.", "pip uninstall requests", 25);
        Add("python", "avancado", "Pytest", "Rode os testes via módulo pytest.", "python -m pytest", 25);
        Add("python", "avancado", "Uvicorn reload", "Suba o FastAPI em main:app com hot reload na porta 8000.", "uvicorn main:app --reload --port 8000", 25);
        Add("python", "avancado", "Flask debug", "Rode o app Flask chamado main em modo debug.", "flask --app main run --debug", 25);
        Add("python", "avancado", "Django projeto", "Crie um projeto Django chamado meu_proj na pasta atual.", "django-admin startproject meu_proj .", 25);
        Add("python", "avancado", "Django migrate", "Aplique as migrations do Django.", "python manage.py migrate", 25);
        Add("python", "avancado", "Django runserver", "Suba o servidor de desenvolvimento do Django.", "python manage.py runserver", 25);
        Add("python", "avancado", "Venv com deps novas", "Crie o venv .venv já com pip e setuptools atualizados.", "python -m venv --upgrade-deps .venv", 25);
        Add("python", "avancado", "Index versions", "Liste as versões disponíveis do pandas no PyPI.", "pip index versions pandas", 25);
        Add("python", "avancado", "Módulo como app", "Execute o pacote atual como módulo chamado app.", "python -m app", 25);
        Add("python", "avancado", "REPL após script", "Execute script.py e abra o REPL interativo no fim.", "python -i script.py", 25);
        Add("python", "avancado", "Httpx", "Instale o cliente HTTP moderno httpx.", "pip install httpx", 25);
        Add("python", "avancado", "FastAPI stack", "Instale FastAPI com extras standard e o uvicorn.", "pip install \"fastapi[standard]\" uvicorn", 25);

        // ── Java iniciante (trilha Java da plataforma: JDK, javac, java) ──
        Add("java", "iniciante", "Versão do Java", "Mostre a versão do Java instalada.", "java -version", 10);
        Add("java", "iniciante", "Versão do javac", "Mostre a versão do compilador javac.", "javac -version", 10);
        Add("java", "iniciante", "Compilar classe", "Compile o arquivo App.java.", "javac App.java", 10);
        Add("java", "iniciante", "Executar classe", "Execute a classe App.", "java App", 10);
        Add("java", "iniciante", "Compilar para out", "Compile App.java gerando os .class na pasta out.", "javac -d out App.java", 10);
        Add("java", "iniciante", "Classpath out", "Execute a classe App usando o classpath out.", "java -cp out App", 10);
        Add("java", "iniciante", "Listar JAVA_HOME", "Mostre o valor da variável JAVA_HOME.", "echo %JAVA_HOME%", 10);
        Add("java", "iniciante", "Help do java", "Abra a ajuda do comando java.", "java -help", 10);
        Add("java", "iniciante", "JAR simples", "Empacote as classes do diretório atual em app.jar.", "jar cf app.jar *.class", 10);
        Add("java", "iniciante", "Listar JAR", "Liste o conteúdo do arquivo app.jar.", "jar tf app.jar", 10);
        Add("java", "iniciante", "Rodar JAR", "Execute o JAR app.jar.", "java -jar app.jar", 10);
        Add("java", "iniciante", "Onde está o java", "Mostre o caminho do executável java no Windows.", "where java", 10);
        Add("java", "iniciante", "Propriedades da JVM", "Mostre as propriedades do sistema da JVM.", "java -XshowSettings:properties -version", 10);
        Add("java", "iniciante", "Compilar vários", "Compile todos os .java da pasta atual.", "javac *.java", 10);
        Add("java", "iniciante", "Verbose compile", "Compile App.java mostrando detalhes do javac.", "javac -verbose App.java", 10);

        // ── Java avançado (jar executável, módulos, Maven/Gradle da prática Java) ──
        Add("java", "avancado", "JAR executável", "Crie um JAR executável app.jar com manifesto apontando para App.", "jar cfe app.jar App *.class", 25);
        Add("java", "avancado", "Javac encoding", "Compile App.java forçando encoding UTF-8.", "javac -encoding UTF-8 App.java", 25);
        Add("java", "avancado", "Release 17", "Compile App.java visando bytecode Java 17.", "javac --release 17 App.java", 25);
        Add("java", "avancado", "Jdeps", "Analise as dependências da classe App com jdeps.", "jdeps App.class", 25);
        Add("java", "avancado", "Jlink help", "Abra a ajuda do jlink (runtime customizado).", "jlink --help", 25);
        Add("java", "avancado", "Maven compile", "Compile o projeto Maven.", "mvn compile", 25);
        Add("java", "avancado", "Maven test", "Execute os testes do projeto Maven.", "mvn test", 25);
        Add("java", "avancado", "Maven package", "Gere o artefato do projeto Maven.", "mvn package", 25);
        Add("java", "avancado", "Maven wrapper", "Rode o wrapper Maven com o goal compile.", "mvnw compile", 25);
        Add("java", "avancado", "Gradle build", "Faça o build do projeto Gradle.", "gradle build", 25);
        Add("java", "avancado", "Gradle test", "Execute os testes do projeto Gradle.", "gradle test", 25);
        Add("java", "avancado", "Gradle wrapper", "Rode o wrapper Gradle com a task build.", "gradlew build", 25);
        Add("java", "avancado", "Javap", "Descompile a classe App para inspecionar bytecode.", "javap -c App", 25);
        Add("java", "avancado", "Native memory", "Rode App com log resumido da JVM (info).", "java -Xlog:gc App", 25);
        Add("java", "avancado", "Modular run", "Execute o módulo app/App no classpath de módulos mods.", "java --module-path mods -m app/App", 25);

        // ── .NET iniciante (cheap codes: new, run, build, sdks) ──
        Add("dotnet", "iniciante", "Versão do SDK", "Mostre a versão do dotnet instalada.", "dotnet --version", 10);
        Add("dotnet", "iniciante", "Listar SDKs", "Liste os SDKs instalados.", "dotnet --list-sdks", 10);
        Add("dotnet", "iniciante", "Listar runtimes", "Liste os runtimes instalados.", "dotnet --list-runtimes", 10);
        Add("dotnet", "iniciante", "Novo console", "Crie um novo projeto console.", "dotnet new console", 10);
        Add("dotnet", "iniciante", "Novo webapi", "Crie um novo projeto Web API.", "dotnet new webapi", 10);
        Add("dotnet", "iniciante", "Listar templates", "Liste os templates disponíveis do dotnet new.", "dotnet new list", 10);
        Add("dotnet", "iniciante", "Rodar projeto", "Execute o projeto atual.", "dotnet run", 10);
        Add("dotnet", "iniciante", "Compilar", "Compile o projeto atual.", "dotnet build", 10);
        Add("dotnet", "iniciante", "Limpar build", "Limpe os artefatos de compilação.", "dotnet clean", 10);
        Add("dotnet", "iniciante", "Restaurar", "Restaure as dependências NuGet do projeto.", "dotnet restore", 10);
        Add("dotnet", "iniciante", "Watch", "Rode o projeto recarregando ao salvar arquivos.", "dotnet watch run", 10);
        Add("dotnet", "iniciante", "Info", "Mostre informações do ambiente .NET.", "dotnet --info", 10);
        Add("dotnet", "iniciante", "Help new", "Abra a ajuda do comando dotnet new.", "dotnet new --help", 10);
        Add("dotnet", "iniciante", "User-secrets", "Liste os user-secrets do projeto (se houver).", "dotnet user-secrets list", 10);
        Add("dotnet", "iniciante", "Add package", "Adicione o pacote Newtonsoft.Json ao projeto.", "dotnet add package Newtonsoft.Json", 10);

        // ── .NET avançado (cheap codes: publish, test, ef, list package) ──
        Add("dotnet", "avancado", "Publicar Release", "Publique em Release na pasta ./publish.", "dotnet publish -c Release -o ./publish", 25);
        Add("dotnet", "avancado", "Testes", "Execute os testes do projeto ou da solução.", "dotnet test", 25);
        Add("dotnet", "avancado", "Listar pacotes", "Liste os pacotes NuGet do projeto.", "dotnet list package", 25);
        Add("dotnet", "avancado", "Projeto xUnit", "Crie um projeto xUnit chamado MeuApp.Tests.", "dotnet new xunit -n MeuApp.Tests", 25);
        Add("dotnet", "avancado", "Referência de projeto", "Adicione referência do projeto MeuApp.Tests para MeuApp.", "dotnet add MeuApp.Tests reference MeuApp", 25);
        Add("dotnet", "avancado", "EF migrations", "Aplique as migrations do Entity Framework ao banco.", "dotnet ef database update", 25);
        Add("dotnet", "avancado", "EF add migration", "Crie uma migration chamada Inicial.", "dotnet ef migrations add Inicial", 25);
        Add("dotnet", "avancado", "Outdated packages", "Liste pacotes NuGet com atualização disponível.", "dotnet list package --outdated", 25);
        Add("dotnet", "avancado", "Format", "Formate o código do projeto com dotnet format.", "dotnet format", 25);
        Add("dotnet", "avancado", "Tool restore", "Restaure as ferramentas locais definidas no manifesto.", "dotnet tool restore", 25);
        Add("dotnet", "avancado", "Workload list", "Liste os workloads instalados no SDK.", "dotnet workload list", 25);
        Add("dotnet", "avancado", "User-jwts", "Crie um JWT de desenvolvimento para a API.", "dotnet user-jwts create", 25);
        Add("dotnet", "avancado", "Sln add", "Adicione o projeto MeuApp.csproj à solução atual.", "dotnet sln add MeuApp.csproj", 25);
        Add("dotnet", "avancado", "Remove package", "Remova o pacote Newtonsoft.Json do projeto.", "dotnet remove package Newtonsoft.Json", 25);
        Add("dotnet", "avancado", "Publish self-contained", "Publique self-contained para win-x64 em ./publish.", "dotnet publish -c Release -r win-x64 --self-contained true -o ./publish", 25);

        return lista;
    }
}
