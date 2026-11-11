-- Histórico de moderação: quem aprovou/rejeitou (corre manualmente se não usar dotnet ef database update)
ALTER TABLE "Feedbacks" ADD COLUMN IF NOT EXISTS "ModeradoPor" character varying(120) NULL;
