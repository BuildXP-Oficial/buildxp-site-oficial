-- Corrige links antigos do card API FOUNDATIONS (slug integrandoumaapi).
UPDATE "SkillCards"
SET
  "LinkBeginner" = 'card.html?slug=' || LOWER(TRIM("Slug")) || '&tab=beginner',
  "LinkRef"      = 'card.html?slug=' || LOWER(TRIM("Slug")) || '&tab=ref'
WHERE LOWER(TRIM("Slug")) = 'integrandoumaapi';
