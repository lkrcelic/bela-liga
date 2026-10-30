import {prisma} from "@/app/_lib/prisma";
import {leagueNight} from "@/app/_lib/dates";
import {expireDueMatches} from "@/app/_lib/service/match/timeLimit";
import {closeArrival} from "./day";
import {skipDueTables} from "./attendance";
import {ensureNextKoloDraft} from "./kola";
import {lockTournament} from "./lock";

// The tournament's clock. Nothing runs on a timer: whatever is due by now happens when someone reads the tournament
// (its pages, the admin's, the players' check for the question at their table, the scorepads), once, under the
// tournament's lock: the start time's switch (sign-ups close, unconfirmed teams inactive, confirmed waiting teams in),
// the tables skipped at 10 minutes, the matches whose time is up, and the next Kolo's draft.

// one run per tournament this often per server instance is enough (the pages ask every few seconds)
const MIN_GAP_MS = 4_000;
const lastRun = new Map<number, number>();

export async function syncTournament(tournamentId: number, {force = false}: {force?: boolean} = {}): Promise<void> {
  const now = new Date();
  const last = lastRun.get(tournamentId) ?? 0;
  if (!force && now.getTime() - last < MIN_GAP_MS) return;
  lastRun.set(tournamentId, now.getTime());

  const t = await prisma.tournament.findUnique({
    where: {tournament_id: tournamentId},
    select: {date: true, cancelled_at: true, arrival_closed_at: true, started_at: true, start_time: true},
  });
  if (!t || t.cancelled_at) return;
  // only a tournament of today (or one that hasn't run its switch yet) has anything due
  const today = leagueNight(now);
  if (t.date.getTime() > today.getTime()) return;

  if (!t.arrival_closed_at && !t.started_at && t.start_time) {
    await prisma.$transaction(async (tx) => {
      await lockTournament(tx, tournamentId);
      await closeArrival(tx, tournamentId, now);
    });
  }
  if (t.date.getTime() === today.getTime()) {
    await skipDueTables(tournamentId, now);
    const open = await prisma.round.findMany({
      where: {tournamentRounds: {some: {tournament_id: tournamentId}}, status: "PUBLISHED", open: true},
      select: {id: true},
    });
    if (open.length > 0) await expireDueMatches({roundIds: open.map((r) => r.id)});
  }
  await ensureNextKoloDraft(tournamentId);
}

// The tournaments of today (for the players' check and the lists)
export async function syncToday(): Promise<number[]> {
  const today = leagueNight();
  const rows = await prisma.tournament.findMany({where: {date: today, cancelled_at: null}, select: {tournament_id: true}});
  for (const r of rows) await syncTournament(r.tournament_id);
  return rows.map((r) => r.tournament_id);
}
