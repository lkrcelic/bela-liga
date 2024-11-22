import {prisma} from "@/app/lib/prisma";
import {TeamPair} from "@/app/lib/matching/matching";
import {Round} from "@prisma/client";

export async function insertPairRounds(pairs: TeamPair[]): Promise<number> {
  const maxRound = await prisma.round.aggregate({
    _max: {round_number: true},
  });
  const now = new Date();
  const roundNum = (maxRound._max.round_number ?? 0) + 1;

  const insertData = pairs.map(
    (pair: TeamPair) =>
      ({
        round_number: roundNum,
        round_date: now,
        team1_id: pair.teamOne.id,
        team2_id: pair.teamTwo.id,
      } as Round)
  );

  setRoundWinsForBYE(insertData);

  await prisma.round.createMany({data: insertData});
  return roundNum;
}

function setRoundWinsForBYE(rounds: Round[]): void {
  const bye_id = parseInt(process.env.BYE_ID ?? "0");
  const byeRound = rounds.find((round) => round.team1_id === bye_id || round.team2_id === bye_id);

  if (!byeRound) return;

  byeRound.team1_id === bye_id ? (byeRound.team2_wins = 2) : (byeRound.team1_wins = 2);
}
