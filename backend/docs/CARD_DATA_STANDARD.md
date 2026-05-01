# Padrão de dados e backend — BuildXP

Este documento reúne **stack do backend**, **pastas MVC** e **contrato de dados** espelhado no PostgreSQL (`database/schema.sql`, na raiz do repositório). Stack: **C# ou Java**, sem Node.js. O front atual (`index.html`, `*.html`, `style.css`) **continua igual** até consumir a API para montar a home.

---

## PostgreSQL (raiz do repo)

| Artefato | Função |
|----------|--------|
| `database/schema.sql` | Esquema |
| `database/seed.sql` | Dados iniciais |

---

## Esqueleto MVC (`backend/`)

Pastas para mapear camadas ao gerar o projeto (nomes em minúsculo na pasta física; em C# costuma espelhar para `Controllers`, `Services`, …):

| Pasta | Função |
|--------|--------|
| `controllers/` | HTTP / rotas |
| `services/` | Regras de negócio |
| `repositories/` | Acesso ao banco |
| `models/` | DTOs / entidades |
| `views/` | Telas do dashboard (se houver View no servidor) |

Em Java: pacotes equivalentes (`…controller`, `…service`, `…repository`, `…dto`).

**Produção:** proteger `/api/admin/**` com autenticação antes de expor o dashboard.

---

## Resumo — campos padrão do **card da home** (`skill_cards`)

| Campo | Uso |
|--------|-----|
| `slug` | Identificador único (`git`, `docker`, …). |
| `theme` | `git` \| `docker` \| `npm` \| `dotnet` → CSS `.c-{theme}` e accent da página. |
| `rarity_label` | Texto do badge (ESSENTIAL, CORE, …). |
| `card_class` | Subtítulo mono em maiúsculas (VERSION CONTROL, …). |
| `display_name` | Título principal do card (Git & GitHub, …). |
| `icon_layout` | `single` \| `dual` → `.card-icon` ou `.card-icon.dual`. |
| `icon_primary_src` / `alt` | Primeira imagem; `icon_primary_css_class` ex.: `icon-git` (altura Git). |
| `icon_secondary_*` | Segunda imagem só em `dual`. |
| `xp_current` / `xp_max` | Barra XP; percentual pode ser calculado (`xp_current / xp_max`). |
| `description_html` | Corpo do texto (HTML seguro/sanitizado no dashboard); pode incluir `<code>`. |
| `link_beginner` / `link_ref` | URLs relativas para abas iniciante / referência. |
| `btn_primary_label` / `btn_secondary_label` | Textos dos botões (padrão: ▶ COMEÇAR / CHEAT CODES). |
| `sort_order` | Ordem na grelha. |
| `ui_features` | JSON, ex.: `{"first_slide_mobile_swipe_hint": true}` — alinha com a seta animada **só no 1º slide** (CSS já trata `.steps-track > .step:first-of-type`). |

**Responsividade:** não é campo na BD; mantém-se no **`style.css`** (breakpoints, grid dos cards, blocos de comando no mobile, etc.).

---

## Página do curso (`card_pages`)

Metadados do hero (`git.html`, …): `route_path`, `page_title`, `page_class`, `lvl_badge_label`, `xp_bar_percent`, `xp_points_label`.

---

## Slides (`slides` + `slide_blocks`)

Cada linha em `slides` é um passo do carrossel:

| Campo | Valor |
|--------|--------|
| `step_kind` | `numbered` \| `pause` \| `end` |
| `step_label` | `01`, `PAUSA`, `FIM`, … |
| `slide_title` | Título opcional (nullable em pausas). |

`slide_blocks` guarda o miolo em **`payload` (JSONB)** conforme `block_type`:

### `step_desc`

Texto do parágrafo (equivale a `.step-desc`). Pode conter HTML ou só texto; no render o front envolve em `<div class="step-desc">`.

```json
{ "html": "Texto com <code>git status</code>." }
```

### `callout_tip` | `callout_info` | `callout_warn`

```json
{ "html": "💡 Mensagem da callout." }
```

### `cmd_block`

Bloco copiável + linhas de comando.

```json
{
  "aria_label": "Comandos status, add e commit",
  "lines": [
    { "kind": "two_column", "cmd_part": "git status", "cmd_note": "# mostra o que mudou" },
    { "kind": "single", "cmd_part": "brew install git", "cmd_note": "" },
    { "kind": "full_note", "cmd_note": "# só comentário / URL" }
  ]
}
```

- **`kind`** espelha classes `.cmd-line`, `.cmd-line-single`, `.cmd-line-full`.
- **`cmd_part`**: trecho “executável” (verde); **`cmd_note`**: comentário após `#`.

### `term_actions`

Botões do slide final.

```json
{
  "actions": [
    { "label": "← VOLTAR AO INÍCIO", "type": "restart_slider" },
    { "label": "INICIAR TREINAMENTO", "href": "index.html#terminal", "variant": "primary" }
  ]
}
```

---

## Identificação estável de comandos (`command_refs`)

Para o dashboard filtrar/editar linhas sem depender só da ordem:

| Campo | Descrição |
|--------|-----------|
| `ref_key` | Chave estável, ex.: `git.status`, `docker.compose.up`. |
| `slide_block_id` | FK para o `cmd_block`. |
| `line_index` | Índice da linha dentro do bloco. |
| `cmd_executable` / `cmd_comment` | Cópia espelhada opcional para busca. |

---

## Referência rápida (`ref_sections` + `ref_commands`)

Espelha abas “Cheat codes”: seções e linhas `cmd_text` + `description`; `ref_key` opcional.

---

## Feedback (`feedback_posts`)

| Campo | Descrição |
|--------|-----------|
| `status` | `pending` → dashboard aprova/rejeita → `approved` \| `rejected`. |
| Mural público | Consumir só `approved` (`GET /api/feedback/approved`). |

---

## API alvo (implementar no backend)

| Método | Rota | Função |
|--------|------|--------|
| GET | `/api/cards` | Lista cards publicados (home). |
| GET | `/api/cards/:slug` | Um card. |
| POST | `/api/feedback` | Novo feedback `pending`. |
| GET | `/api/feedback/approved` | Mural público. |
| GET | `/api/admin/feedback/pending` | Fila moderação (proteger com login). |
| PATCH | `/api/admin/feedback/:id` | Body `{ "status": "approved"\|"rejected", "moderator": "..." }`. |

**Banco:** criar BD PostgreSQL → `psql … -f database/schema.sql` → `psql … -f database/seed.sql`. Servir o site estático continua podendo ser Nginx/IIS ou `wwwroot` do ASP.NET Core.
