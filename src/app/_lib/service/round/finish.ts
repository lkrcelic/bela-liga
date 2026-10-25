import {Prisma} from "@prisma/client";
import {replayRatings} from "@/app/_lib/service/admin/recalc";
import {RoundStatus} from "@/app/_lib/roundStatus";

// A round between two teams is two matches in a league; a tournament's table plays one or two (its Partija po kolu),
// which every Round row keeps in matches_per_round.
export const MATCHES_PER_ROUND = 2;

export async function lockRound(tx: Prisma.TransactionClient, roundId: number) {
  const [round] = await tx.$queryRaw<{id: number, open: boolean, status: RoundStatus, matches_per_round: number}[]>`
      SELECT id, open, status, matches_per_round FROM "Round" WHERE id = ${roundId} FOR UPDATE`;
  return round;
}

// "Oba meča ove runde već su odigrana." / "Meč ove runde već je odigran." (a table of one match)
export function roundPlayedMessage(matchesPerRound: number): string {
  return matchesPerRound === 1 ? "Meč ove runde već je odigran." : "Oba meča ove runde već su odigrana.";
}

// Marks the round as played, recomputes both teams' standings and the ratings.
// Call it inside a transaction that holds the round lock, so it runs once per round.
export async function closeRound(tx: Prisma.TransactionClient, roundId: number): Promise<void> {
  const round = await tx.round.update({
    where: {id: roundId},
    data: {open: false, active: false},
    include: {
      leagueRounds: {select: {league_id: true}},
    },
  });

  for (const {league_id} of round.leagueRounds) {
    await tx.$executeRaw`CALL update_team_score(${round.team1_id}, ${league_id})`;
    await tx.$executeRaw`CALL update_team_score(${round.team2_id}, ${league_id})`;
  }

  // the whole season again (Glicko-2 rates a night as one period, so tonight's earlier rounds are rated again with
  // this one); an admin's replay and this one must not interleave, which replayRatings' lock takes care of
  await replayRatings(tx);
}
