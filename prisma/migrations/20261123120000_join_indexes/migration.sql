-- #50: the join and filter columns that the standings, Rejting, team pages, scorepads and permission checks read get an
-- index. Postgres doesn't index a foreign key by itself, and a composite primary key only serves a lookup by its first
-- column (TeamPlayer, RoundPlayer and LeagueRound are looked up by their second). Indexes only: no row changes.

-- CreateIndex
CREATE INDEX "Session_userId_idx" ON "Session"("userId");

-- CreateIndex
CREATE INDEX "LuciaSession_userId_idx" ON "LuciaSession"("userId");

-- CreateIndex
CREATE INDEX "TeamPlayer_player_id_idx" ON "TeamPlayer"("player_id");

-- CreateIndex
CREATE INDEX "Round_team1_id_idx" ON "Round"("team1_id");

-- CreateIndex
CREATE INDEX "Round_team2_id_idx" ON "Round"("team2_id");

-- CreateIndex
CREATE INDEX "Round_round_date_idx" ON "Round"("round_date");

-- CreateIndex
CREATE INDEX "RoundPlayer_player_id_idx" ON "RoundPlayer"("player_id");

-- CreateIndex
CREATE INDEX "LeagueRound_round_id_idx" ON "LeagueRound"("round_id");

-- CreateIndex
CREATE INDEX "Match_round_id_idx" ON "Match"("round_id");

-- CreateIndex
CREATE INDEX "OngoingMatch_round_id_idx" ON "OngoingMatch"("round_id");

-- CreateIndex
CREATE INDEX "BelaResult_match_id_idx" ON "BelaResult"("match_id");

-- CreateIndex
CREATE INDEX "OngoingBelaResult_match_id_idx" ON "OngoingBelaResult"("match_id");

-- CreateIndex
CREATE INDEX "BelaPlayerAnnouncement_result_id_idx" ON "BelaPlayerAnnouncement"("result_id");

-- CreateIndex
CREATE INDEX "OngoingBelaPlayerAnnouncement_result_id_idx" ON "OngoingBelaPlayerAnnouncement"("result_id");
