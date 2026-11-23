import {Prisma} from "@prisma/client";
import {prisma} from "@/app/_lib/prisma";
import {BYE_TEAM_ID} from "@/app/_lib/bye";
import {ratedPlayerIds} from "@/app/_lib/lineup";
import {PROVISIONAL_ROUNDS} from "@/app/_lib/rating/glicko2";
import {roundGames} from "@/app/_lib/rating/season";
import {RATINGS_FROM} from "@/app/_lib/service/admin/recalc";
import {NotFoundError} from "@/app/_lib/service/admin/tables";
import {PlayerRatingDetail, RatingNight, RatingRow, RatingsList} from "@/app/_interfaces/ratings";
import {PLAYER_NOT_FOUND} from "@/app/_interfaces/player";
import {displayName} from "@/app/_lib/players/names";
import {ratingSummary, RatingSummary} from "@/app/_lib/ui/ratings";
import {PUBLISHED_ROUND} from "@/app/_lib/roundStatus";
import {Viewer} from "@/app/_lib/players/privacy";
import {playerPhotoUrls} from "@/app/_lib/service/players/photos";

// Player ratings across all leagues: everyone on a team or with a rated round, highest rating first. Deleted players
// aren't listed (their rounds still count for everyone else's rating); the username is public (#88), so the search
// matches it and the detail shows it.

type Row = {
  id: number;
  first_name: string;
  last_name: string;
  username: string;
  rating: number;
  team: string | null;
  rounds: number;
  change: number | null;
  rank: number;
  total: number;
};

export async function listRatings(viewer: Viewer): Promise<RatingsList> {
  const list = await allRatings();
  const photos = await playerPhotoUrls(viewer, list.map((p) => p.id));
  return {players: list.map((p) => ({...p, photo_url: photos.get(p.id) ?? null})), me: list.some((p) => p.id === viewer.id) ? viewer.id : null};
}

// Who is on the list: not deleted, and on a team or with a rated night
const LISTED = Prisma.sql`
    SELECT p.id, p.rating
    FROM "Player" p
    WHERE p.deleted_at IS NULL
      AND (EXISTS (SELECT 1 FROM "PlayerRatingHistory" h WHERE h.player_id = p.id)
        OR EXISTS (SELECT 1 FROM "TeamPlayer" tp WHERE tp.player_id = p.id AND tp.team_id <> ${BYE_TEAM_ID}))`;

// Rows of the list, ranked over the whole list (players with the same rating share a place), with the list's length:
// all of them, or only these players'. The team and the rated rounds are worked out only for the rows returned, so
// one player's or one team's page doesn't pay for the whole list (#51).
async function ratingRows(ids?: number[]): Promise<{rows: RatingRow[]; total: number}> {
  const rows = await prisma.$queryRaw<Row[]>`
      WITH ranked AS (SELECT l.id,
                             (RANK() OVER (ORDER BY l.rating DESC))::int AS rank,
                             (COUNT(*) OVER ())::int                     AS total
                      FROM (${LISTED}) l)
      SELECT p.id, p.first_name, p.last_name, p.username, p.rating, k.rank, k.total,
             team.team_name                AS team,
             COALESCE(h.rounds, 0)::int    AS rounds,
             h.change
      FROM ranked k
               JOIN "Player" p ON p.id = k.id
               LEFT JOIN LATERAL (SELECT SUM(rounds)                                AS rounds,
                                         (ARRAY_AGG(change ORDER BY night DESC))[1] AS change
                                  FROM "PlayerRatingHistory"
                                  WHERE player_id = p.id) h ON true
               -- the player's team that played most recently (a player can be on more than one)
               LEFT JOIN LATERAL (
          SELECT t.team_name
          FROM "TeamPlayer" tp
                   JOIN "Team" t ON t.team_id = tp.team_id
          WHERE tp.player_id = p.id
            AND t.team_id <> ${BYE_TEAM_ID}
          ORDER BY (SELECT MAX(r.round_date)
                    FROM "Round" r
                    WHERE (r.team1_id = t.team_id OR r.team2_id = t.team_id)
                      AND r.status = 'PUBLISHED') DESC NULLS LAST,
                   t.team_name
          LIMIT 1) team ON true
      ${ids ? Prisma.sql`WHERE p.id = ANY(${ids}::int[])` : Prisma.empty}`;

  const total = rows[0]?.total ?? (ids ? (await prisma.$queryRaw<{n: number}[]>`SELECT COUNT(*)::int AS n FROM (${LISTED}) l`)[0].n : 0);
  const players = rows
    .map((r) => ({...r, name: displayName(r)}))
    .sort((a, b) => b.rating - a.rating || a.name.localeCompare(b.name, "hr"));
  return {
    total,
    rows: players.map((p) => ({
      id: p.id,
      rank: p.rank,
      name: p.name,
      username: p.username,
      team: p.team,
      rating: p.rating,
      change: p.change,
      rounds: p.rounds,
      provisional: p.rounds < PROVISIONAL_ROUNDS,
    })),
  };
}

// The whole list, highest rating first. One query per call (not cached), so a caller that needs it twice passes it on.
export async function allRatings(): Promise<RatingRow[]> {
  return (await ratingRows()).rows;
}

// Only these players' rows (in the list's order; those not on the list are left out) and the list's length
export async function ratingsOf(ids: number[]): Promise<{rows: RatingRow[]; total: number}> {
  return ratingRows(Array.from(new Set(ids)));
}

// These players' ratings as Rejting shows them (a team's players on the Team page). A player who isn't on the list
// keeps their stored rating, unranked and Privremeno (ratingSummary).
export async function ratingSummaries(players: {id: number; rating: number}[]): Promise<Map<number, RatingSummary>> {
  const {rows} = await ratingsOf(players.map((p) => p.id));
  return new Map(players.map((p) => [p.id, ratingSummary(rows, p)]));
}

// A deleted player (or one never on a team) isn't on the list: 404 "Igrač ne postoji."
export async function getPlayerRating(playerId: number, viewer: Viewer): Promise<PlayerRatingDetail> {
  const {rows, total} = await ratingsOf([playerId]);
  const found = rows[0];
  if (!found) throw new NotFoundError(PLAYER_NOT_FOUND);
  const player = {...found, photo_url: (await playerPhotoUrls(viewer, [playerId])).get(playerId) ?? null};

  const history = await prisma.playerRatingHistory.findMany({
    where: {player_id: playerId},
    orderBy: {night: "asc"},
    select: {night: true, rating: true, change: true},
  });

  return {
    player,
    total,
    history: history.map((h) => ({night: isoDate(h.night), rating: h.rating})),
    lastNights: await lastNights(playerId, history.slice(-5).reverse()),
  };
}

const isoDate = (d: Date) => d.toISOString().slice(0, 10);

// What the player played on each of these nights (newest first, as given): the opponents and the matches won and
// lost, from the same rounds the rating replay counted for them. Rejting's detail and the Player page.
export async function lastNights(playerId: number, nights: {night: Date; change: number}[]): Promise<RatingNight[]> {
  if (nights.length === 0) return [];
  const teamIds = (await prisma.teamPlayer.findMany({where: {player_id: playerId}, select: {team_id: true}})).map((t) => t.team_id);
  const rounds = await prisma.round.findMany({
    where: {
      open: false,
      ...PUBLISHED_ROUND,
      round_date: {in: nights.map((n) => n.night), gte: RATINGS_FROM},
      team1_id: {not: BYE_TEAM_ID},
      team2_id: {not: BYE_TEAM_ID},
      OR: [{roundPlayers: {some: {player_id: playerId}}}, {team1_id: {in: teamIds}}, {team2_id: {in: teamIds}}],
    },
    orderBy: [{round_number: "asc"}, {id: "asc"}],
    select: {
      round_date: true,
      team1_id: true,
      team2_id: true,
      team1_wins: true,
      team2_wins: true,
      team1: {select: {team_name: true, teamPlayers: {select: {player_id: true}}}},
      team2: {select: {team_name: true, teamPlayers: {select: {player_id: true}}}},
      roundPlayers: {select: {player_id: true, team_id: true}},
      matches: {select: {player_pair1_score: true, player_pair2_score: true}, orderBy: {id: "asc"}},
      leagueRounds: {select: {league_id: true}, orderBy: {league_id: "asc"}, take: 1},
    },
  });

  return nights.map(({night, change}) => {
    const out: RatingNight = {night: isoDate(night), opponents: [], won: 0, lost: 0, change, league_id: null, team_id: null};
    for (const r of rounds) {
      if (isoDate(r.round_date!) !== out.night) continue;
      const teamA = ratedPlayerIds(r.roundPlayers, r.team1_id, r.team1.teamPlayers.map((p) => p.player_id));
      const teamB = ratedPlayerIds(r.roundPlayers, r.team2_id, r.team2.teamPlayers.map((p) => p.player_id));
      const side = teamA.includes(playerId) ? 1 : teamB.includes(playerId) ? 2 : 0;
      if (!side) continue;
      if (out.league_id == null && r.leagueRounds[0]) {
        out.league_id = r.leagueRounds[0].league_id;
        out.team_id = side === 1 ? r.team1_id : r.team2_id;
      }
      out.opponents.push(side === 1 ? r.team2.team_name : r.team1.team_name);
      const games = roundGames({
        night: out.night,
        teamA,
        teamB,
        matches: r.matches.map((m) => [m.player_pair1_score, m.player_pair2_score]),
        wins: [r.team1_wins, r.team2_wins],
      });
      for (const g of games) {
        const mine = side === 1 ? g.scoreA : 1 - g.scoreA;
        if (mine === 1) out.won++;
        else if (mine === 0) out.lost++;
      }
    }
    return out;
  });
}
