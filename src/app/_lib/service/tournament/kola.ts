import {Prisma} from "@prisma/client";
import {prisma} from "@/app/_lib/prisma";
import {isByeTeam} from "@/app/_lib/bye";
import {InvalidResultError} from "@/app/_lib/validation/validateResult";
import {addCompetitionTable, NotFoundError} from "@/app/_lib/service/admin/tables";
import {createByeMatches} from "@/app/_lib/service/round/insertPairRounds";
import {firstKoloPairs, KoloPair, swissPairs} from "@/app/_lib/matching/tournamentPairing";
import {opponentsOf, rankTeams, TableResult, tournamentTotals} from "@/app/_lib/tournaments";
import {lockTournament} from "./lock";
import {TOURNAMENT_NOT_FOUND} from "./tournaments";

// A tournament's Kolos (Turniri · Kola). A Kolo is made as a draft only the admins see (Skica Kola N): Kolo 1 drawn
// at random once sign-ups are closed, every later one paired by the standings once the Kolo before it is played to
// the end. Objavi kolo publishes it; publishing Kolo 1 starts the tournament. Players never see a draft.

type Tx = Prisma.TransactionClient;

// Publishing a Kolo 1 drawn from other teams than the ones in now (someone signed off or was added after it)
export const STALE_DRAFT = "STALE_DRAFT";
export const STALE_DRAFT_ERROR = "Popis ekipa se promijenio nakon što je Kolo 1 složeno. Složi ga ponovo pa objavi.";

export class StaleDraftError extends Error {
  constructor() {
    super(STALE_DRAFT_ERROR);
    this.name = "StaleDraftError";
  }
}

export type MadeKolo = {number: number; tables: number; repeats: KoloPair[]};

const roundSelect = {
  id: true,
  round_number: true,
  status: true,
  open: true,
  team1_id: true,
  team2_id: true,
  team1_wins: true,
  team2_wins: true,
  active: true,
  matches: {select: {player_pair1_score: true, player_pair2_score: true}},
} as const;

async function tournamentRounds(tx: Tx, tournamentId: number) {
  return tx.round.findMany({where: {tournamentRounds: {some: {tournament_id: tournamentId}}}, select: roundSelect});
}

type RoundRow = Awaited<ReturnType<typeof tournamentRounds>>[number];

const lastPublished = (rounds: RoundRow[]) => Math.max(0, ...rounds.filter((r) => r.status === "PUBLISHED").map((r) => r.round_number ?? 0));

async function dropTables(tx: Tx, ids: number[]) {
  if (ids.length === 0) return;
  await tx.ongoingMatch.deleteMany({where: {round_id: {in: ids}}});
  await tx.match.deleteMany({where: {round_id: {in: ids}}});
  await tx.round.deleteMany({where: {id: {in: ids}}});
}

// The next Kolo's pairs: drawn for Kolo 1, by the standings after the published Kolos for the others
async function pairsFor(tx: Tx, number: number, rounds: RoundRow[], teamIds: number[]): Promise<{pairs: KoloPair[]; repeats: KoloPair[]}> {
  if (number === 1) return {pairs: firstKoloPairs(teamIds), repeats: []};
  const results: TableResult[] = rounds
    .filter((r) => r.status === "PUBLISHED")
    .map((r) => ({
      kolo: r.round_number ?? 0,
      team1Id: r.team1_id,
      team2Id: r.team2_id,
      team1Wins: r.team1_wins,
      team2Wins: r.team2_wins,
      open: r.open,
      started: true,
      diff: r.matches.reduce((sum, m) => sum + m.player_pair1_score - m.player_pair2_score, 0),
    }));
  const totals = tournamentTotals(teamIds, results);
  const names = new Map((await tx.team.findMany({where: {team_id: {in: teamIds}}, select: {team_id: true, team_name: true}})).map((t) => [t.team_id, t.team_name]));
  const opponents = opponentsOf(results);
  const ranked = rankTeams(teamIds.map((id) => ({id, name: names.get(id) ?? "", totals: totals.get(id)!})));
  return swissPairs(ranked.map((t) => ({id: t.id, points: t.totals.points, difference: t.totals.difference, opponents: opponents.get(t.id) ?? []})));
}

// Složi Kolo N (and Složi ponovo with redo): makes the next Kolo's draft, or makes the waiting one again. Without redo a
// draft that is already there is kept (two taps make one draft).
export async function makeKoloDraft(tournamentId: number, {redo = false}: {redo?: boolean} = {}): Promise<MadeKolo> {
  return prisma.$transaction(async (tx) => {
    await lockTournament(tx, tournamentId);
    const t = await tx.tournament.findUnique({where: {tournament_id: tournamentId}});
    if (!t) throw new NotFoundError(TOURNAMENT_NOT_FOUND);
    if (t.cancelled_at) throw new InvalidResultError("Turnir je otkazan.");

    const rounds = await tournamentRounds(tx, tournamentId);
    const last = lastPublished(rounds);
    const number = last + 1;
    if (number > t.rounds) throw new InvalidResultError("Sva kola su već objavljena.");
    const draft = rounds.filter((r) => r.status !== "PUBLISHED");
    if (draft.length > 0 && !redo) return {number, tables: draft.length, repeats: []};

    if (number === 1 && t.registrations_open) throw new InvalidResultError("Prvo zatvori prijave, zatim složi Kolo 1.");
    if (number > 1 && rounds.some((r) => r.status === "PUBLISHED" && r.round_number === last && r.open)) {
      throw new InvalidResultError(`Kolo ${last} još traje: sljedeće se slaže kad svi stolovi završe.`);
    }
    const teams = await tx.tournamentTeam.findMany({where: {tournament_id: tournamentId, status: "REGISTERED"}, select: {team_id: true}, orderBy: {registered_at: "asc"}});
    if (teams.length < 2) throw new InvalidResultError("Za turnir trebaju barem dvije prijavljene ekipe.");

    await dropTables(tx, draft.map((r) => r.id));
    const {pairs, repeats} = await pairsFor(tx, number, rounds, teams.map((e) => e.team_id));
    for (let i = 0; i < pairs.length; i++) {
      const [team1, team2] = pairs[i];
      const bye = isByeTeam(team1) || isByeTeam(team2);
      const round = await tx.round.create({
        data: {
          round_number: number,
          round_date: t.date,
          team1_id: team1,
          team2_id: team2,
          table_number: i + 1,
          status: "DRAFT",
          matches_per_round: t.matches_per_round,
          declarations: t.declarations,
          // the bye's table is won by the real team at once (2:0, 1:0 at a table of one match), as in a league
          ...(bye && {
            team1_wins: isByeTeam(team1) ? 0 : t.matches_per_round,
            team2_wins: isByeTeam(team1) ? t.matches_per_round : 0,
            open: false,
          }),
          tournamentRounds: {create: {tournament_id: tournamentId}},
        },
        select: {id: true},
      });
      if (bye) await createByeMatches(tx, round.id, team1, t.date, t.matches_per_round);
    }
    return {number, tables: pairs.length, repeats};
  }, {timeout: 30_000});
}

// Objavi kolo: the draft's tables go out to the players. Publishing Kolo 1 starts the tournament: sign-ups are closed
// for good and the waiting list stays as it is.
export async function publishKolo(tournamentId: number, number: number): Promise<{publishedAt: string}> {
  return prisma.$transaction(async (tx) => {
    await lockTournament(tx, tournamentId);
    const t = await tx.tournament.findUnique({where: {tournament_id: tournamentId}});
    if (!t) throw new NotFoundError(TOURNAMENT_NOT_FOUND);
    if (t.cancelled_at) throw new InvalidResultError("Turnir je otkazan.");
    const rounds = await tournamentRounds(tx, tournamentId);
    const tables = rounds.filter((r) => r.round_number === number && r.status !== "PUBLISHED");
    if (tables.length === 0) throw new NotFoundError("Skica tog kola ne postoji.");
    if (rounds.some((r) => r.status === "PUBLISHED" && r.round_number === number - 1 && r.open)) {
      throw new InvalidResultError(`Kolo ${number - 1} još traje.`);
    }
    if (number === 1) {
      const registered = await tx.tournamentTeam.findMany({where: {tournament_id: tournamentId, status: "REGISTERED"}, select: {team_id: true}});
      const seated = new Set(tables.flatMap((r) => [r.team1_id, r.team2_id]).filter((id) => !isByeTeam(id)));
      if (seated.size !== registered.length || registered.some((e) => !seated.has(e.team_id))) throw new StaleDraftError();
    }
    const now = new Date();
    await tx.round.updateMany({where: {id: {in: tables.map((r) => r.id)}}, data: {status: "PUBLISHED", published_at: now, draft_order: null}});
    if (number === 1) await tx.tournament.update({where: {tournament_id: tournamentId}, data: {started_at: now, registrations_open: false}});
    return {publishedAt: now.toISOString()};
  }, {timeout: 30_000});
}

// Once every table of the last Kolo published is played, the next Kolo's draft is made by itself (the admin still
// publishes it). Called after a tournament's table closes and when the admin's page is read; quiet when it isn't time.
export async function ensureNextKoloDraft(tournamentId: number): Promise<void> {
  const t = await prisma.tournament.findUnique({where: {tournament_id: tournamentId}, select: {started_at: true, cancelled_at: true, rounds: true}});
  if (!t || !t.started_at || t.cancelled_at) return;
  const rounds = await prisma.round.findMany({where: {tournamentRounds: {some: {tournament_id: tournamentId}}}, select: {round_number: true, status: true, open: true}});
  const last = Math.max(0, ...rounds.filter((r) => r.status === "PUBLISHED").map((r) => r.round_number ?? 0));
  if (last === 0 || last >= t.rounds) return;
  if (rounds.some((r) => r.status !== "PUBLISHED")) return;
  if (rounds.some((r) => r.round_number === last && r.open)) return;
  try {
    await makeKoloDraft(tournamentId);
  } catch (error) {
    // another request made it first, or the admin changed something meanwhile: the page shows what is there
    if (!(error instanceof InvalidResultError)) throw error;
  }
}

// The tournament a table belongs to (null for a league's table)
export async function tournamentOfRound(roundId: number): Promise<number | null> {
  const link = await prisma.tournamentRound.findFirst({where: {round_id: roundId}, select: {tournament_id: true}});
  return link?.tournament_id ?? null;
}

// After a table of a tournament closed: the next Kolo's draft, if it was the last table of its Kolo. Never fails the
// request that closed the table.
export async function afterTableClosed(roundId: number | null): Promise<void> {
  if (roundId == null) return;
  try {
    const tournamentId = await tournamentOfRound(roundId);
    if (tournamentId != null) await ensureNextKoloDraft(tournamentId);
  } catch (error) {
    console.error(error);
  }
}

// Novi stol in a tournament's Kolo (a draft or a published one), with two teams in the tournament or one and the bye
export async function addKoloTable(tournamentId: number, number: number, team1Id: number, team2Id: number): Promise<number> {
  const t = await prisma.tournament.findUnique({where: {tournament_id: tournamentId}, select: {date: true}});
  if (!t) throw new NotFoundError(TOURNAMENT_NOT_FOUND);
  return addCompetitionTable({kind: "tournament", id: tournamentId}, t.date, number, team1Id, team2Id);
}
