-- Atualiza links públicos dos SkillCards para card.html?slug=…&tab=…
-- Execute no PostgreSQL após deploy (ou combine com dotnet ef se preferir migração EF).

UPDATE "SkillCards"
SET
  "LinkBeginner" = 'card.html?slug=' || LOWER(TRIM("Slug")) || '&tab=beginner',
  "LinkRef"      = 'card.html?slug=' || LOWER(TRIM("Slug")) || '&tab=ref'
WHERE TRIM(COALESCE("Slug", '')) <> '';
