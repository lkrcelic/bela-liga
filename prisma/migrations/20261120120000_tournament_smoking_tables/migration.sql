/*
  Pušački stolovi in a tournament (DECISIONS 100).

  - Tournament.smoking_tables: the table numbers where smoking is allowed, set in the tournament's form (empty: none).
    Every Kolo seats the matches with the most smokers there; only this tournament's earlier Kolos count. A tournament
    made before this has none, as before.
  The tables keep Round.smoking_table and team1_smokers / team2_smokers, as a league's tables do.
*/

-- AlterTable
ALTER TABLE "Tournament" ADD COLUMN     "smoking_tables" INTEGER[] DEFAULT ARRAY[]::INTEGER[];
