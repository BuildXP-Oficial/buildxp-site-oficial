# BuildXP

**Build Skills. Gain XP. Ship Code.** 
<br>
[Acesse o site oficial:](https://www.buildxpdev.com.br/)

Plataforma de referência e aprendizado prático para desenvolvedores — cards de conhecimento, trilhas guiadas, cheap codes copiáveis, treino de terminal, plano de estudos, chat de ajuda no card e simulador de entrevistas, tudo num só lugar.

---

## Sobre a plataforma

A **BuildXP** é uma base de conhecimento pensada **de dev para dev**. Em vez de documentação dispersa, ela organiza ferramentas do dia a dia (Git, Docker, NPM, .NET, Python e novos temas) em **Skill Cards**: cada card reúne trilha para iniciantes, referência rápida de comandos e progresso em XP.

A ideia é simples: **aprender no fluxo**, consultar quando esquecer um comando, organizar o que revisar hoje e ganhar confiança até “shippar” código de verdade.

### Para que serve

| Necessidade | O que a BuildXP oferece |
|-------------|-------------------------|
| Aprender do zero | Slides passo a passo na aba **Iniciante**, com pausas e slide final |
| Lembrar um comando | Aba **Cheap Codes** com busca e botão de copiar |
| Tirar dúvida no card | Chat **AJUDA** no `card.html`, preso ao tema atual |
| Organizar o estudo | Página **Rotina** — plano de estudos e revisões por energia e tempo livre |
| Treinar entrevista | Página **Simulador** — RH, tech lead/gerente ou stakeholder, com relatório no final |
| Ver tudo disponível | Página **Cards** com grid e pesquisa por nome, trilha ou comando |
| Praticar no terminal | Seção de **treino** no site (comandos por card) |
| Montar um README | **README Lab** — editor Markdown com preview |
| Sugerir melhorias | **Feedback** público moderado antes de ir para o mural |
| Criar e editar conteúdo | **Dashboard** admin/colaborador (JWT) com editor de cards e slides |

---

## Principais funcionalidades

### Skill Cards

Cards publicados via API com ícone, raridade, barra de XP, descrição e links para:

- **▶ COMEÇAR** — trilha iniciante (`card.html?slug=…&tab=beginner`)
- **🎮 CHEAP CODES** — referência rápida (`card.html?slug=…&tab=ref`)

No **index**, os cards aparecem em carrossel; na página **`cards.html`**, todos ficam listados em grid (4 colunas no desktop, 1 no mobile) com barra de pesquisa inteligente.

### Cheap Codes

Comandos organizados por categoria, com descrição curta e cópia com um clique. A pesquisa filtra por comando, descrição e conteúdo dos slides (ex.: «biblioteca panda» encontra o card Python).

### Chat de conhecimento

No `card.html`, o botão **AJUDA** abre um chat em português. O agente responde só sobre o card aberto (slides + cheap codes), para esclarecer o tema sem sair da trilha.

### Plano de estudos (Rotina)

A página **`rotina.html`** monta o cronograma do dia com os temas/cards do BuildXP (Git, Docker, Python, .NET, Java e os demais publicados). O aluno informa energia e tempo livre, escolhe o que quer estudar ou revisar e define tempo estimado e foco. O agente atua como tutor: energia baixa concentra em um tema ou revisão leve; energia alta encadeia conteúdos mais densos, ainda dentro das horas disponíveis.

### Simulador de entrevistas e reuniões

A página **`simulador.html`** é um treino público (sem login). A pessoa escolhe a persona — recrutador de RH (cultura e STAR), tech lead/gerente (arquitetura, prazo e impacto) ou stakeholder de negócios (valor sem jargão) — descreve o cenário e conversa por turnos. Ao encerrar, a API devolve nota de 0 a 10, pontos fortes e pontos de melhoria. A conversa não é gravada no banco.

### README Lab

Editor de Markdown com preview ao vivo (`readme-lab.html`) para montar o README de perfil no GitHub. Dá para copiar o texto ou guardar com cadastro para voltar depois.

### Dashboard editorial

Painel protegido para admin e colaboradores:

- Criar e editar cards (slug, tema, ícones, XP, publicação)
- Sincronizar slides da trilha (`PUT /api/card/{slug}/slides/sync`)
- Moderar feedback da comunidade
- Gestão de colaboradores e perfil

---

## Stack técnica

| Camada | Tecnologia |
|--------|------------|
| Backend | ASP.NET Core **10** (C#) |
| ORM | Entity Framework Core |
| Banco de dados | **PostgreSQL** |
| Autenticação | JWT (dashboard) |
| Agentes (chat, rotina e simulador) | Groq (chave em `GROQ_API_KEY` ou User Secrets `GroqApiKey`) |
| Frontend | HTML, CSS modular, JavaScript (sem framework) |
| API | REST + Swagger (desenvolvimento) |
| Hospedagem estática | `wwwroot/` servido pelo próprio ASP.NET |

---

## Estrutura do repositório

```
buildxp-site-oficial/
├── README.md
├── buildxp-site-oficial.sln
└── backend/
    ├── docs/                    # Padrões de dados (cards, slides, refs)
    ├── tests/BuildXP.Tests/     # Testes sem banco (personas, DTOs, JWT, Groq mock, smoke)
    └── api/                     # API + site estático (projeto BuildXP.API)
        ├── Controllers/         # Rotas REST
        ├── Services/            # Regras de negócio (cards, chat, rotina…)
        ├── Models/              # Entidades
        ├── Dtos/                # Contratos da API
        ├── Data/                # EF Core (AppDbContext)
        ├── database/            # Scripts SQL auxiliares
        ├── Migrations/          # EF Core
        └── wwwroot/             # Site público + dashboard
            ├── index.html       # Home (hero, carrossel, terminal)
            ├── cards.html       # Catálogo de todos os cards
            ├── card.html        # Página dinâmica por slug (+ chat AJUDA)
            ├── rotina.html      # Plano de estudos e revisões
            ├── simulador.html   # Entrevistas e reuniões (3 personas)
            ├── readme-lab.html  # Editor Markdown
            ├── feedback.html    # Feedback público
            ├── dashboard.html   # Painel editorial
            ├── css/             # Estilos modulares
            ├── js/              # Módulos (cards, terminal, rotina, chat…)
            └── data/cheat-html/ # Fallback HTML dos cheap codes
```

---

## Páginas públicas

| Página | URL | Descrição |
|--------|-----|-----------|
| Home | `/index.html` | Hero, carrossel de cards, terminal, contato |
| Catálogo | `/cards.html` | Todos os cards + pesquisa |
| Card | `/card.html?slug={slug}` | Trilha iniciante, cheap codes e chat AJUDA |
| Rotina | `/rotina.html` | Plano de estudos e revisões dos cards |
| Simulador | `/simulador.html` | Entrevista/reunião com 3 personas + relatório |
| README Lab | `/readme-lab.html` | Editor Markdown com preview |
| Feedback | `/feedback.html` | Envio e mural de sugestões |
| Dashboard | `/dashboard.html` | Acesso restrito (login JWT) |

---

## API (resumo)

| Método | Rota | Uso |
|--------|------|-----|
| `GET` | `/api/card` | Lista cards publicados (home / catálogo / rotina) |
| `GET` | `/api/card/{slug}` | Card completo (slides + referências) |
| `POST` | `/api/conhecimento/chat` | Chat de ajuda preso ao card atual |
| `POST` | `/api/rotina` | Organizar o plano de estudos do dia |
| `POST` | `/api/simulacao/turno` | Próxima fala da persona |
| `POST` | `/api/simulacao/feedback` | Relatório final (nota 0–10) |
| `GET` | `/api/feedback/aprovados` | Mural público |
| `POST` | `/api/feedback` | Enviar feedback |
| `POST` | `/api/auth/login` | Login dashboard |
| `GET` | `/api/card/dashboard` | Lista cards (admin/colaborador) |
| `PUT` | `/api/card/{slug}/slides/sync` | Substituir trilha de slides |

Documentação interativa: **`/swagger`** (ambiente de desenvolvimento).

Chat, rotina e simulador usam a Groq. Sem `GROQ_API_KEY` (variável de ambiente) ou `GroqApiKey` em User Secrets, esses endpoints não respondem. Senhas e chaves **não** vão no `appsettings.json` versionado.

---

## Como rodar localmente

### Pré-requisitos

- [.NET SDK 10](https://dotnet.microsoft.com/download)
- Segredos configurados (User Secrets localmente, variáveis de ambiente em produção)
- Chave Groq (opcional, só para chat, rotina e simulador)
- [PostgreSQL](https://www.postgresql.org/) — **só** se for usar cards, dashboard, feedback persistido ou treino de terminal

Sem connection string, em desenvolvimento a API **sobe mesmo assim**: páginas estáticas, `/health`, simulador, rotina e chat. Cards e dashboard ficam indisponíveis até existir um PostgreSQL.

### Passos

1. Clone o repositório:

```bash
git clone https://github.com/brunagai/buildxp-site-oficial.git
cd buildxp-site-oficial
```

2. Configure os segredos **fora** do git. Em desenvolvimento, User Secrets (na pasta do projeto da API):

```bash
cd backend/api
dotnet user-secrets set "Jwt:Chave" "uma-chave-com-pelo-menos-32-caracteres"
dotnet user-secrets set "GroqApiKey" "gsk_..."
# opcional, só quando tiver PostgreSQL:
# dotnet user-secrets set "ConnectionStrings:DefaultConnection" "Host=localhost;Port=5432;Database=buildxp;Username=postgres;Password=SUA_SENHA"
# dotnet user-secrets set "Email:Senha" "palavra-passe-de-aplicacao"
# dotnet user-secrets set "Admin:Senha" "senha-do-admin"
cd ../..
```

Em produção, use variáveis de ambiente (`ConnectionStrings__DefaultConnection`, `Jwt__Chave`, `Email__Senha`, `Admin__Senha`, `GROQ_API_KEY`). Não commite `appsettings.Development.json`.

3. Suba a API (na raiz do repositório):

```bash
dotnet restore
dotnet test
dotnet run --project backend/api --launch-profile http
```

4. Abra no navegador:

| Ambiente | URL |
|----------|-----|
| Site + API | http://localhost:5021 |
| Saúde | http://localhost:5021/health |
| Rotina | http://localhost:5021/rotina.html |
| Simulador | http://localhost:5021/simulador.html |
| Swagger | http://localhost:5021/swagger |

> As migrations rodam automaticamente na inicialização. Cheap codes vazios na BD são repovoados a partir de `wwwroot/data/cheat-html/` quando aplicável.

---

## Cards disponíveis (exemplos)

| Slug | Tema |
|------|------|
| `git` | Git & GitHub |
| `docker` | Docker |
| `npm` | NPM / Node |
| `dotnet` | .NET |
| `python` | Python |
| `api` | APIs |
| `ia` | Inteligência artificial |

Novos cards criados no dashboard entram na home (carrossel), em **`cards.html`** e na lista de temas da **Rotina** assim que publicados.

---

## Contribuindo

Sugestões, bugs e pedidos de novos cards podem ser enviados pela página **Feedback** do site ou via **Fork + PR** neste repositório.

---

## Licença

A definir pelo mantenedor do repositório.

---

<p align="center">
  <strong>BUILD</strong>XP — De dev pra dev.
</p>
