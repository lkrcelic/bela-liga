import {prisma} from "@/app/lib/prisma";
import {Team} from "../../matching/matching";

export async function getLeagueTeamsWithScores(leagueId: number): Promise<Team[]> {
  console.log(leagueId);
  let data: any[] = await prisma.$queryRaw`
    SELECT
      t.team_id AS id,
      t.team_name AS name,
      ts.score AS score,
      ARRAY_AGG(CASE WHEN r.team1_id = t.team_id THEN r.team2_id ELSE r.team1_id END) AS played_against
    FROM "Team" t
    JOIN "TeamScore" ts ON (t.team_id = ts.team_id) AND (ts.league_id = ${leagueId})
    JOIN "Round" r ON (r.team1_id = t.team_id OR r.team2_id = t.team_id)
    GROUP BY t.team_id, t.team_name, ts.score;
    `;

  return data as Team[];
}
