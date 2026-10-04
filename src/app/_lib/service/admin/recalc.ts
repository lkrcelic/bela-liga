import {Prisma} from "@prisma/client";
import {BYE_TEAM_ID, isByeTeam} from "@/app/_lib/bye";
import {MU0, PHI0, SIGMA0, updateTeams} from "@/app/_lib/rating/ratingService";

// Recalculation after an admin changes results that were already counted (edited hands of a finished match, a table
// re-paired or removed, a round deleted).

// Ratings were introduced on this date (migration add_player_ratings); rounds before it were never rated, so the
// replay starts here and gives the same ratings as the live updates when nothing was edited.
export const RATINGS_FROM = new Date("2025-10-07T00:00:00Z");

// Held by every rating write (round close and replay), so a replay never interleaves with a live update
export const RATINGS_LOCK = 7314001;

export async function lockRatings(tx: Prisma.TransactionClient) {
  await tx.$executeRaw`SELECT pg_advisory_xact_lock(${RATINGS_LOCK})`;
}

// Recomputes the season table rows of these teams from their closed rounds
export async function recalcTeamScores(tx: Prisma.TransactionClient, leagueId: number, teamIds: Iterable<number>) {
  for (const teamId of Array.from(new Set(teamIds))) {
    if (isByeTeam(teamId)) continue;
    await tx.$executeRaw`CALL update_team_score(${teamId}, ${leagueId})`;
  }
}

// Ratings from scratch: every player starts at the default and every rated round (closed, no bye, since
// RATINGS_FROM) is applied again in the order it was played. Rosters are today's, as the app doesn't keep history.
export async function replayRatings(tx: Prisma.TransactionClient) {
  await lockRatings(tx);

  const players = await tx.player.findMany({select: {id: true}});
  const ratings = new Map(players.map((p) => [p.id, {rating: MU0, rd: PHI0, vol: SIGMA0}]));

  const rounds = await tx.round.findMany({
    where: {
      open: false,
      team1_id: {not: BYE_TEAM_ID},
      team2_id: {not: BYE_TEAM_ID},
      round_date: {gte: RATINGS_FROM},
    },
    orderBy: [{round_date: "asc"}, {round_number: "asc"}, {table_number: "asc"}, {id: "asc"}],
    select: {
      team1_wins: true,
      team2_wins: true,
      team1: {select: {teamPlayers: {select: {player_id: true}}}},
      team2: {select: {teamPlayers: {select: {player_id: true}}}},
    },
  });

  for (const r of rounds) {
    const a = r.team1.teamPlayers.map((p) => p.player_id).filter((id) => ratings.has(id));
    const b = r.team2.teamPlayers.map((p) => p.player_id).filter((id) => ratings.has(id));
    if (a.length === 0 || b.length === 0) continue;
    const score = r.team1_wins > r.team2_wins ? 1 : r.team1_wins === r.team2_wins ? 0.5 : 0;
    const {teamA, teamB} = updateTeams(
      a.map((id) => ratings.get(id)!),
      b.map((id) => ratings.get(id)!),
      score
    );
    a.forEach((id, i) => ratings.set(id, teamA[i]));
    b.forEach((id, i) => ratings.set(id, teamB[i]));
  }

  if (ratings.size === 0) return;
  const rows = Array.from(ratings, ([id, r]) => Prisma.sql`(${id}::int, ${r.rating}::int, ${r.rd}::float8, ${r.vol}::float8)`);
  await tx.$executeRaw`
      UPDATE "Player" AS p
      SET rating = v.rating, rating_deviation = v.rd, volatility = v.vol
      FROM (VALUES ${Prisma.join(rows)}) AS v(id, rating, rd, vol)
      WHERE p.id = v.id`;
}

// A round whose result counts for ratings: closed and without a bye
export function isRatedRound(r: {open: boolean; team1_id: number; team2_id: number}) {
  return !r.open && !isByeTeam(r.team1_id) && !isByeTeam(r.team2_id);
}
