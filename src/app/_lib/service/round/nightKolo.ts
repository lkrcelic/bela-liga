import {nightKolo} from "@/app/_lib/roundStatus";
import {prisma} from "@/app/_lib/prisma";

// "Kolo 1/3" on a league table (Započni igru, Nastavi igru): which of its place's published Kola tonight it is, out of
// how many the place has (both places of a two-place night share the Kolo numbers, each counts its own; a one-place
// night counts the league's). Null for a tournament's table or one without a number or night.
export async function tableNightKolo(round: {id: number; round_number: number | null; round_date: Date | null; location_slot: number | null}): Promise<[number, number] | null> {
  if (round.round_number == null || round.round_date == null) return null;
  const link = await prisma.leagueRound.findFirst({where: {round_id: round.id}, select: {league_id: true}});
  if (!link) return null;
  const rows = await prisma.round.findMany({
    where: {leagueRounds: {some: {league_id: link.league_id}}, round_date: round.round_date, status: "PUBLISHED", location_slot: round.location_slot, round_number: {not: null}},
    select: {round_number: true},
    distinct: ["round_number"],
  });
  return nightKolo(round.round_number, rows.map((r) => r.round_number!));
}
