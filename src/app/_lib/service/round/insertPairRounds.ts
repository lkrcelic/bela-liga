import {prisma} from "@/app/_lib/prisma";
import {TeamPair} from "@/app/_lib/matching/matching";
import {Round} from "@prisma/client";

export async function insertPairRounds(pairs: TeamPair[], leagueId: number): Promise<number> {
  const maxRound = await prisma.round.aggregate({_max: {round_number: true}}); //TODO

  const now = new Date();
  const roundNum = (maxRound._max.round_number ?? 0) + 1;

  const insertData = pairs.map((pair: TeamPair) => ({
    round_number: roundNum,
    round_date: now,
    team1_id: pair.teamOne.id,
    team2_id: pair.teamTwo.id,
  }));

  setRoundWinsForBYE(insertData);

// Loop through each pair and create both Round and LeagueRound
  for (const roundData of insertData) {
    const createdRound = await prisma.round.create({
      data: roundData,
    });

    // Create LeagueRound entry
    await prisma.leagueRound.create({
      data: {
        league_id: leagueId,
        round_id: createdRound.id,
      },
    });
  }

  return roundNum;
}

function setRoundWinsForBYE(rounds: Round[]): void {
  const bye_id = parseInt(process.env.BYE_ID ?? "0");
  const byeRound = rounds.find((round) => round.team1_id === bye_id || round.team2_id === bye_id);

  if (!byeRound) return;

  byeRound.team1_id === bye_id ? (byeRound.team2_wins = 2) : (byeRound.team1_wins = 2);
}
