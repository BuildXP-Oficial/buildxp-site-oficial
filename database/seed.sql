-- Dados iniciais = espelho dos cards atuais da home (index.html)
-- psql "$DATABASE_URL" -f database/seed.sql

INSERT INTO skill_cards (
  slug, theme, rarity_label, card_class, display_name,
  icon_layout, icon_primary_src, icon_primary_alt, icon_primary_css_class,
  icon_secondary_src, icon_secondary_alt,
  xp_current, xp_max, description_html,
  link_beginner, link_ref, sort_order, ui_features
) VALUES
(
  'git',
  'git',
  'ESSENTIAL',
  'VERSION CONTROL',
  'Git & GitHub',
  'dual',
  'imagens/gitlogobr.png',
  'Git',
  'icon-git',
  'imagens/githublogo.png',
  'GitHub',
  2400,
  3000,
  '<p class="card-desc">Do primeiro <code>git init</code> até branches, P Rs e fluxos avançados. Guia completo para iniciantes e Cheat Codes para quem já usa e não lembra um comando específico.<br>Clique no botão para começar a aprender Git e GitHub.</p>',
  'git.html?tab=beginner',
  'git.html?tab=ref',
  1,
  '{"first_slide_mobile_swipe_hint": true}'::jsonb
),
(
  'docker',
  'docker',
  'ADVANCED',
  'CONTAINERIZATION',
  'Docker',
  'single',
  'imagens/dockerlogo.png',
  'Docker',
  NULL,
  NULL,
  NULL,
  1800,
  3000,
  '<p class="card-desc">Containers, imagens, Dockerfile e Docker Compose. Do conceito básico ao ambiente completo rodando com um comando.<br>Clique no botão para começar a aprender Docker.</p>',
  'docker.html?tab=beginner',
  'docker.html?tab=ref',
  2,
  '{"first_slide_mobile_swipe_hint": true}'::jsonb
),
(
  'npm',
  'npm',
  'CORE',
  'PACKAGE MANAGER',
  'NPM',
  'single',
  'imagens/npmlogo.png',
  'NPM',
  NULL,
  NULL,
  NULL,
  1200,
  3000,
  '<p class="card-desc">Gerencie pacotes, scripts e dependências de projetos Node.js. Do <code>npm init</code> ao publish no registry.<br>Clique no botão para começar a aprender NPM e para o que ele serve.</p>',
  'npm.html?tab=beginner',
  'npm.html?tab=ref',
  3,
  '{"first_slide_mobile_swipe_hint": true}'::jsonb
),
(
  'dotnet',
  'dotnet',
  'SPECIALIST',
  'RUNTIME & CLI',
  '.NET / dotnet',
  'single',
  'imagens/csharplogo.png',
  '.NET',
  NULL,
  NULL,
  NULL,
  900,
  3000,
  '<p class="card-desc">CLI do .NET para criar, buildar, testar e publicar projetos. Essencial para quem trabalha com C#, ASP.NET e afins (ou quer entender como funciona).<br>Clique no botão para começar a aprender C# e .NET.</p>',
  'dotnet.html?tab=beginner',
  'dotnet.html?tab=ref',
  4,
  '{"first_slide_mobile_swipe_hint": true}'::jsonb
);

-- Metadados das páginas de curso (hero). Slides/conteúdo podem ser importados depois.
INSERT INTO card_pages (skill_card_id, route_path, page_title, page_class, lvl_badge_label, xp_bar_percent, xp_points_label)
SELECT id, 'git.html', 'Git & GitHub', 'VERSION CONTROL', 'LVL 8 · ESSENTIAL', 80, '2400 XP' FROM skill_cards WHERE slug = 'git'
UNION ALL
SELECT id, 'docker.html', 'Docker', 'CONTAINERIZATION', 'LVL 8 · ADVANCED', 60, '1800 XP' FROM skill_cards WHERE slug = 'docker'
UNION ALL
SELECT id, 'npm.html', 'NPM', 'PACKAGE MANAGER', 'LVL 8 · CORE', 40, '1200 XP' FROM skill_cards WHERE slug = 'npm'
UNION ALL
SELECT id, 'dotnet.html', '.NET / dotnet', 'RUNTIME & CLI', 'LVL 8 · SPECIALIST', 30, '900 XP' FROM skill_cards WHERE slug = 'dotnet';
