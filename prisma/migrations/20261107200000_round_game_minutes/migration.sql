-- Otključaj partiju (DECISIONS #89): an admin who unlocks a locked table chooses how long the game may run, and that
-- Vrijeme partije belongs to the table alone. Null on every table that exists: its tournament's or its league's limit
-- keeps deciding, exactly as until now.
ALTER TABLE "Round" ADD COLUMN "game_minutes" INTEGER;
ALTER TABLE "Round" ADD CONSTRAINT "Round_game_minutes_check" CHECK ("game_minutes" IS NULL OR ("game_minutes" >= 5 AND "game_minutes" <= 180));
