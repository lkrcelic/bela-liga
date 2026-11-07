-- Until now a started tournament had to have its sign-ups shut (Tournament_started_check, 20261026120000). That still
-- holds for a closed tournament; one with Otvorene prijave keeps them open while it is played (DECISIONS #88).
ALTER TABLE "Tournament" DROP CONSTRAINT "Tournament_started_check";
ALTER TABLE "Tournament" ADD CONSTRAINT "Tournament_started_check" CHECK ("started_at" IS NULL OR "open_signups" OR NOT "registrations_open");
