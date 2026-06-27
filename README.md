# BuildXP

**Build Skills. Gain XP. Ship Code.**

Plataforma de referência e aprendizado prático para desenvolvedores — cards de conhecimento, trilhas guiadas, cheap codes copiáveis e treino de terminal, tudo num só lugar.

---

## Sobre a plataforma

A **BuildXP** é uma base de conhecimento pensada **de dev para dev**. Em vez de documentação dispersa, ela organiza ferramentas do dia a dia (Git, Docker, NPM, .NET, Python e novos temas) em **Skill Cards**: cada card reúne trilha para iniciantes, referência rápida de comandos e progresso em XP.

A ideia é simples: **aprender no fluxo**, consultar quando esquecer um comando e ganhar confiança até “shippar” código de verdade.

### Para que serve

| Necessidade | O que a BuildXP oferece |
|-------------|-------------------------|
| Aprender do zero | Slides passo a passo na aba **Iniciante**, com pausas e slide final |
| Lembrar um comando | Aba **Cheap Codes** com busca e botão de copiar |
| Ver tudo disponível | Página **Cards** com grid e pesquisa por nome, trilha ou comando |
| Praticar no terminal | Seção de **treino** no site (comandos por card) |
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
    └── models/                  # API + site estático
        ├── Controllers/         # Rotas REST
        ├── services/            # Regras de negócio
        ├── database/            # Scripts SQL auxiliares
        ├── Migrations/          # EF Core
        └── wwwroot/             # Site público + dashboard
            ├── index.html       # Home (hero, carrossel, terminal)
            ├── cards.html       # Catálogo de todos os cards
            ├── card.html        # Página dinâmica por slug
            ├── feedback.html    # Feedback público
            ├── dashboard.html   # Painel editorial
            ├── css/             # Estilos modulares
            ├── js/              # Módulos (cards, terminal, dashboard…)
            └── data/cheat-html/ # Fallback HTML dos cheap codes
```

---

## Páginas públicas

| Página | URL | Descrição |
|--------|-----|-----------|
| Home | `/index.html` | Hero, carrossel de cards, terminal, contato |
| Catálogo | `/cards.html` | Todos os cards + pesquisa |
| Card | `/card.html?slug={slug}` | Trilha iniciante e cheap codes |
| Feedback | `/feedback.html` | Envio e mural de sugestões |
| Dashboard | `/dashboard.html` | Acesso restrito (login JWT) |

---

## API (resumo)

| Método | Rota | Uso |
|--------|------|-----|
| `GET` | `/api/card` | Lista cards publicados (home / catálogo) |
| `GET` | `/api/card/{slug}` | Card completo (slides + referências) |
| `GET` | `/api/feedback/aprovados` | Mural público |
| `POST` | `/api/feedback` | Enviar feedback |
| `POST` | `/api/auth/login` | Login dashboard |
| `GET` | `/api/card/dashboard` | Lista cards (admin/colaborador) |
| `PUT` | `/api/card/{slug}/slides/sync` | Substituir trilha de slides |

Documentação interativa: **`/swagger`** (ambiente de desenvolvimento).

---

## Como rodar localmente

### Pré-requisitos

- [.NET SDK 10](https://dotnet.microsoft.com/download)
- [PostgreSQL](https://www.postgresql.org/) em execução
- Connection string configurada

### Passos

1. Clone o repositório:

```bash
git clone https://github.com/SEU-USUARIO/buildxp-site-oficial.git
cd buildxp-site-oficial/backend/models
```

2. Configure `appsettings.json` (ou `appsettings.Development.json`):

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Host=localhost;Port=5432;Database=buildxp;Username=postgres;Password=SUA_SENHA"
  }
}
```

3. Aplique as migrations e suba a API:

```bash
dotnet restore
dotnet run
```

4. Abra no navegador:

| Ambiente | URL |
|----------|-----|
| Site + API | http://localhost:5021 |
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
| `ia` | Inteligência artificial |

Novos cards criados no dashboard entram na home (carrossel) e em **`cards.html`** assim que publicados.

---

## Contribuindo

Sugestões, bugs e pedidos de novos cards podem ser enviados pela página **Feedback** do site ou via **Issues** neste repositório.

---

## Licença

A definir pelo mantenedor do repositório.

---

<p align="center">
  <strong>BUILD</strong>XP — De dev pra dev.
</p>
