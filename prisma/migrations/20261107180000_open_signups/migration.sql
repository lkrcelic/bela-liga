-- Otvorene prijave (DECISIONS #88): a tournament where teams may sign up while it is being played, right up to the
-- Kolo before the last. False = the tournament as it was: the start time closes sign-ups for good.
ALTER TABLE "Tournament" ADD COLUMN "open_signups" BOOLEAN NOT NULL DEFAULT false;
