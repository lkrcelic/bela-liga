-- CreateTable
CREATE TABLE "TeamScore" (
    "id" SERIAL NOT NULL,
    "team_id" INTEGER NOT NULL,
    "league_id" INTEGER,
    "tournament_id" INTEGER,
    "score" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "TeamScore_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "TeamScore" ADD CONSTRAINT "TeamScore_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "Team"("team_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamScore" ADD CONSTRAINT "TeamScore_league_id_fkey" FOREIGN KEY ("league_id") REFERENCES "League"("league_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamScore" ADD CONSTRAINT "TeamScore_tournament_id_fkey" FOREIGN KEY ("tournament_id") REFERENCES "Tournament"("tournament_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- THIS LINE WAS ADDED MANUALLY
ALTER TABLE "TeamScore" ADD CONSTRAINT "team_score_league_or_tournament_check" CHECK ((league_id IS NOT NULL) OR (tournament_id IS NOT NULL));