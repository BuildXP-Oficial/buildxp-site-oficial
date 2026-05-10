-- Executar na base PostgreSQL se não aplicar migrações EF (`dotnet ef database update`).
ALTER TABLE "Colaboradores"
  ADD COLUMN IF NOT EXISTS "AcessoAdministrador" boolean NOT NULL DEFAULT false;
