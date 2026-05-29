-- BuildXP — PostgreSQL schema
-- Rode: psql "$DATABASE_URL" -f database/schema.sql

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Temas = cores CSS (--git, --docker, --npm, --dotnet) → classes .c-git, etc.
CREATE TYPE theme_key AS ENUM ('git', 'docker', 'npm', 'dotnet');

CREATE TYPE icon_layout AS ENUM ('single', 'dual');

CREATE TYPE slide_step_kind AS ENUM ('numbered', 'pause', 'end');

CREATE TYPE slide_block_type AS ENUM (
  'step_desc',
  'callout_tip',
  'callout_info',
  'callout_warn',
  'cmd_block',
  'term_actions'
);

CREATE TYPE cmd_line_kind AS ENUM ('two_column', 'single', 'full_note');

CREATE TYPE feedback_status AS ENUM ('pending', 'approved', 'rejected');

-- ========== Cards da home (skill cards) ==========
CREATE TABLE skill_cards (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug            TEXT NOT NULL UNIQUE,
  theme           theme_key NOT NULL,
  rarity_label    TEXT NOT NULL,
  card_class      TEXT NOT NULL,
  display_name    TEXT NOT NULL,
  icon_layout     icon_layout NOT NULL DEFAULT 'single',
  icon_primary_src    TEXT NOT NULL,
  icon_primary_alt    TEXT NOT NULL DEFAULT '',
  icon_primary_css_class TEXT,
  icon_secondary_src  TEXT,
  icon_secondary_alt  TEXT,
  xp_current      INTEGER NOT NULL DEFAULT 0 CHECK (xp_current >= 0),
  xp_max          INTEGER NOT NULL DEFAULT 3000 CHECK (xp_max > 0),
  description_html TEXT NOT NULL DEFAULT '',
  link_beginner   TEXT NOT NULL,
  link_ref        TEXT NOT NULL,
  btn_primary_label TEXT NOT NULL DEFAULT '▶ COMEÇAR',
  btn_secondary_label TEXT NOT NULL DEFAULT '🎮 CHEAP CODES',
  sort_order      INTEGER NOT NULL DEFAULT 0,
  is_published    BOOLEAN NOT NULL DEFAULT true,
  ui_features     JSONB NOT NULL DEFAULT '{"first_slide_mobile_swipe_hint": true}',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_skill_cards_sort ON skill_cards (sort_order);

-- Página do tutorial (git.html, docker.html, …) — metadados do hero + abas
CREATE TABLE card_pages (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  skill_card_id   UUID NOT NULL REFERENCES skill_cards(id) ON DELETE CASCADE,
  route_path      TEXT NOT NULL UNIQUE,
  page_title      TEXT NOT NULL,
  page_class      TEXT NOT NULL,
  lvl_badge_label TEXT,
  xp_bar_percent  SMALLINT CHECK (xp_bar_percent BETWEEN 0 AND 100),
  xp_points_label TEXT,
  UNIQUE (skill_card_id)
);

-- Slides da aba iniciante (ordem linear + tipo PAUSA/FIM)
CREATE TABLE slides (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  card_page_id    UUID NOT NULL REFERENCES card_pages(id) ON DELETE CASCADE,
  sort_order      INTEGER NOT NULL DEFAULT 0,
  step_kind       slide_step_kind NOT NULL DEFAULT 'numbered',
  step_label      TEXT NOT NULL,
  slide_title     TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_slides_page_order ON slides (card_page_id, sort_order);

-- Blocos dentro do slide (ordem + tipo discriminated)
CREATE TABLE slide_blocks (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slide_id        UUID NOT NULL REFERENCES slides(id) ON DELETE CASCADE,
  sort_order      INTEGER NOT NULL DEFAULT 0,
  block_type      slide_block_type NOT NULL,
  payload         JSONB NOT NULL DEFAULT '{}',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_slide_blocks_slide ON slide_blocks (slide_id, sort_order);

-- Opcional: índice por identificador de comando (para dashboard filtrar/editar)
CREATE TABLE command_refs (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slide_block_id  UUID NOT NULL REFERENCES slide_blocks(id) ON DELETE CASCADE,
  line_index      INTEGER NOT NULL DEFAULT 0,
  ref_key         TEXT NOT NULL,
  cmd_executable  TEXT NOT NULL DEFAULT '',
  cmd_comment     TEXT NOT NULL DEFAULT ''
);

CREATE INDEX idx_command_refs_key ON command_refs (ref_key);

-- Referência rápida (seções + itens) — futura migração do HTML
CREATE TABLE ref_sections (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  card_page_id    UUID NOT NULL REFERENCES card_pages(id) ON DELETE CASCADE,
  sort_order      INTEGER NOT NULL DEFAULT 0,
  section_title   TEXT NOT NULL
);

CREATE TABLE ref_commands (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  section_id      UUID NOT NULL REFERENCES ref_sections(id) ON DELETE CASCADE,
  sort_order      INTEGER NOT NULL DEFAULT 0,
  cmd_text        TEXT NOT NULL,
  description     TEXT NOT NULL DEFAULT '',
  ref_key         TEXT
);

-- Feedback público + moderação dashboard
CREATE TABLE feedback_posts (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  author_name     TEXT,
  category        TEXT NOT NULL,
  message         TEXT NOT NULL,
  status          feedback_status NOT NULL DEFAULT 'pending',
  moderated_at    TIMESTAMPTZ,
  moderated_by    TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_feedback_status ON feedback_posts (status, created_at DESC);

COMMENT ON TABLE skill_cards IS 'Cards da home; theme → CSS .c-{theme} e :root --accent';
COMMENT ON COLUMN skill_cards.ui_features IS 'Ex.: {"first_slide_mobile_swipe_hint": true} — espelha CSS só no 1º slide';
COMMENT ON COLUMN slide_blocks.payload IS 'Ver backend/docs/CARD_DATA_STANDARD.md por block_type';
COMMENT ON COLUMN command_refs.ref_key IS 'Identificador estável ex.: git.status, docker.compose.up';
