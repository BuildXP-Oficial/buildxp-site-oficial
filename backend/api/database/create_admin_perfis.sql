-- Cria a tabela de perfil do admin para permitir:
-- - foto de perfil
-- - username
-- - alteração de senha
--
-- Sem esta tabela, a conta admin fica apenas no appsettings (não editável pelo dashboard).

CREATE TABLE IF NOT EXISTS "AdminPerfis" (
  "Id"            SERIAL PRIMARY KEY,
  "Usuario"       VARCHAR(80) NOT NULL UNIQUE,
  "Email"         VARCHAR(320) NULL,
  "Senha"         VARCHAR(500) NOT NULL,
  "FotoBytes"     BYTEA NULL,
  "FotoMimeType"  VARCHAR(64) NULL,
  "AtualizadoEm"  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Opcional: criar o primeiro registo manualmente (ajuste valores).
-- INSERT INTO "AdminPerfis" ("Usuario","Email","Senha")
-- VALUES ('admin','admin@exemplo.com','SUA_SENHA_AQUI');

