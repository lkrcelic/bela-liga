import {prisma} from "@/app/_lib/prisma";
import {leagueNightString} from "@/app/_lib/dates";
import {leagueEnded} from "@/app/_lib/league";
import {nightsPlayedOut} from "@/app/_lib/service/league/arrival";

type Db = Parameters<typeof nightsPlayedOut>[2];

// Whether each league is over (DECISIONS 104, #90), keyed by league_id: its last night (the end date's, else its last
// scheduled night) is behind the league night, or is tonight and has played its Broj kola at every place. Only the
// leagues whose last night is tonight need the tables. Dates are YYYY-MM-DD.
export async function leaguesEnded(
  leagues: {league_id: number; end_date: string | null; last_night: string | null}[],
  now: Date = new Date(),
  db: Db = prisma
): Promise<Map<number, boolean>> {
  const night = leagueNightString(now);
  const tonight = leagues.filter((l) => (l.end_date ?? l.last_night) === night).map((l) => l.league_id);
  const playedOut = await nightsPlayedOut(tonight, night, db);
  return new Map(leagues.map((l) => [l.league_id, leagueEnded(l.end_date, l.last_night, night, playedOut.has(l.league_id))]));
}
