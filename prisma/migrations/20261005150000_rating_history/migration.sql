-- A player's rating after each league night they played. Filled by the rating replay (npm run ratings:replay, or
-- the next round that closes). Additive.
CREATE TABLE "PlayerRatingHistory" (
    "player_id" INTEGER NOT NULL,
    "night" DATE NOT NULL,
    "rating" INTEGER NOT NULL,
    "rating_deviation" DOUBLE PRECISION NOT NULL,
    "change" INTEGER NOT NULL,
    "rounds" INTEGER NOT NULL,

    CONSTRAINT "PlayerRatingHistory_pkey" PRIMARY KEY ("player_id","night")
);

ALTER TABLE "PlayerRatingHistory" ADD CONSTRAINT "PlayerRatingHistory_player_id_fkey" FOREIGN KEY ("player_id") REFERENCES "Player"("id") ON DELETE CASCADE ON UPDATE CASCADE;
