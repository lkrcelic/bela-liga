-- Automatska kola: once a Kolo is over, the next one is made and published by itself (no Skica for the admin)
ALTER TABLE "Tournament" ADD COLUMN "auto_publish" BOOLEAN NOT NULL DEFAULT false;
