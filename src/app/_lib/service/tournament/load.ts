import {Prisma, Tournament, TournamentPrize} from "@prisma/client";
import {prisma} from "@/app/_lib/prisma";
import {isByeTeam} from "@/app/_lib/bye";
import {visibleRounds} from "@/app/_lib/roundStatus";
import {Viewer} from "@/app/_lib/players/privacy";
import {isAdminRole} from "@/app/_lib/players/admin";
import {displayName} from "@/app/_lib/players/names";
import {playerPhotoUrls, teamPhotoUrls} from "@/app/_lib/service/players/photos";
import {completedKolos, KoloSummary, liveKolo, rankTeams, TableResult, TeamTotals, tournamentPhase, TournamentPhase, tournamentTotals} from "@/app/_lib/tournaments";

// Everything the tournament screens are built from, read in a few queries: the tournament, its entries with their
// players, and the tables of its Kolos. A player and a visitor see only the published Kolos; an admin sees the draft too.

type Db = Prisma.TransactionClient | typeof prisma;

export type LoadedPlayer = {id: number; name: string; rating: number; username: string; photo_url: string | null};

export type LoadedEntry = {
  team_id: number;
  team_name: string;
  photo_url: string | null;
  status: "REGISTERED" | "WAITING";
  registered_at: Date;
  registered_by: number | null;
  // the team's players with an account (deleted ones are left out)
  players: LoadedPlayer[];
};

export type LoadedTable = {
  id: number;
  kolo: number;
  table_number: number | null;
  smoking_table: boolean;
  team1_id: number;
  team2_id: number;
  team1_wins: number;
  team2_wins: number;
  open: boolean;
  active: boolean;
  status: "DRAFT" | "APPROVED" | "PUBLISHED";
  // matches played at it, and team1's points minus team2's over them
  played: number;
  diff: number;
  // the running match's points
  ongoing: {player_pair1_score: number; player_pair2_score: number} | null;
  // the players who played it (Tko igra)
  lineup: {player_id: number; team_id: number}[];
};

export type Snapshot = {
  tournament: Tournament & {prizes: TournamentPrize[]};
  entries: LoadedEntry[];
  tables: LoadedTable[];
  // names and photos of the teams at the tables (the bye's too), whether they are entered or not
  teams: Map<number, {name: string; photo_url: string | null}>;
  kolos: KoloSummary[];
  phase: TournamentPhase;
  // the standings of the teams in (and of any team that played and left), in order
  standings: {team_id: number; name: string; totals: TeamTotals}[];
  completed: number;
  live: number | null;
  admin: boolean;
};

const playerSelect = {
  id: true,
  first_name: true,
  last_name: true,
  username: true,
  rating: true,
  active: true,
  deleted_at: true,
  photo_updated_at: true,
  photo_visibility: true,
} as const;

// A table counts as being played once a match is running at it or was played
export const tableStarted = (t: Pick<LoadedTable, "active" | "played" | "ongoing" | "open">) => !t.open || t.active || t.played > 0 || t.ongoing != null;

// The snapshots of these tournaments (unknown ids are left out), in the order of ids
export async function loadSnapshots(ids: number[], viewer: Viewer | null, db: Db = prisma): Promise<Snapshot[]> {
  if (ids.length === 0) return [];
  const admin = viewer != null && isAdminRole(viewer);
  const [tournaments, entries, rounds] = await Promise.all([
    db.tournament.findMany({where: {tournament_id: {in: ids}}, include: {prizes: {orderBy: {place: "asc"}}}}),
    db.tournamentTeam.findMany({
      where: {tournament_id: {in: ids}},
      orderBy: [{registered_at: "asc"}, {team_id: "asc"}],
      include: {
        team: {
          select: {
            team_id: true,
            team_name: true,
            photo_updated_at: true,
            photo_visibility: true,
            teamPlayers: {select: {player: {select: playerSelect}}},
          },
        },
      },
    }),
    db.round.findMany({
      where: {tournamentRounds: {some: {tournament_id: {in: ids}}}, ...visibleRounds(admin)},
      orderBy: [{round_number: "asc"}, {table_number: "asc"}, {id: "asc"}],
      select: {
        id: true,
        round_number: true,
        table_number: true,
        smoking_table: true,
        team1_id: true,
        team2_id: true,
        team1_wins: true,
        team2_wins: true,
        open: true,
        active: true,
        status: true,
        tournamentRounds: {select: {tournament_id: true}},
        matches: {select: {player_pair1_score: true, player_pair2_score: true}},
        ongoingMatches: {select: {player_pair1_score: true, player_pair2_score: true}, orderBy: {id: "desc"}, take: 1},
        roundPlayers: {select: {player_id: true, team_id: true}},
        team1: {select: {team_id: true, team_name: true, photo_updated_at: true, photo_visibility: true}},
        team2: {select: {team_id: true, team_name: true, photo_updated_at: true, photo_visibility: true}},
      },
    }),
  ]);

  // photos the viewer may see (none for a visitor)
  const playerIds = Array.from(new Set(entries.flatMap((e) => e.team.teamPlayers.map((tp) => tp.player.id))));
  const teamIds = Array.from(new Set([...entries.map((e) => e.team_id), ...rounds.flatMap((r) => [r.team1_id, r.team2_id])].filter((id) => !isByeTeam(id))));
  const [playerPhotos, teamPhotos] = await Promise.all([playerPhotoUrls(viewer, playerIds), teamPhotoUrls(viewer, teamIds)]);

  return ids
    .map((id) => tournaments.find((t) => t.tournament_id === id))
    .filter((t): t is NonNullable<typeof t> => t != null)
    .map((tournament) => {
      const own = entries.filter((e) => e.tournament_id === tournament.tournament_id);
      const loadedEntries: LoadedEntry[] = own.map((e) => ({
        team_id: e.team_id,
        team_name: e.team.team_name,
        photo_url: teamPhotos.get(e.team_id) ?? null,
        status: e.status,
        registered_at: e.registered_at,
        registered_by: e.registered_by,
        players: e.team.teamPlayers
          .map((tp) => tp.player)
          .filter((p) => p.deleted_at == null)
          .map((p) => ({id: p.id, name: displayName(p), rating: p.rating, username: p.username, photo_url: playerPhotos.get(p.id) ?? null}))
          .sort((a, b) => a.name.localeCompare(b.name, "hr")),
      }));

      const ownRounds = rounds.filter((r) => r.tournamentRounds.some((tr) => tr.tournament_id === tournament.tournament_id));
      const tables: LoadedTable[] = ownRounds.map((r) => ({
        id: r.id,
        kolo: r.round_number ?? 0,
        table_number: r.table_number,
        smoking_table: r.smoking_table,
        team1_id: r.team1_id,
        team2_id: r.team2_id,
        team1_wins: r.team1_wins,
        team2_wins: r.team2_wins,
        open: r.open,
        active: r.active,
        status: r.status,
        played: r.matches.length,
        diff: r.matches.reduce((sum, m) => sum + m.player_pair1_score - m.player_pair2_score, 0),
        ongoing: r.ongoingMatches[0] ?? null,
        lineup: r.roundPlayers,
      }));

      const teams = new Map<number, {name: string; photo_url: string | null}>();
      for (const r of ownRounds) {
        for (const t of [r.team1, r.team2]) teams.set(t.team_id, {name: t.team_name, photo_url: teamPhotos.get(t.team_id) ?? null});
      }
      for (const e of loadedEntries) teams.set(e.team_id, {name: e.team_name, photo_url: e.photo_url});

      const kolos = koloSummaries(tables);
      const phase = tournamentPhase({startedAt: tournament.started_at, cancelledAt: tournament.cancelled_at, rounds: tournament.rounds}, kolos);
      const published = tables.filter((t) => t.status === "PUBLISHED");
      const registered = loadedEntries.filter((e) => e.status === "REGISTERED");
      const totals = tournamentTotals(registered.map((e) => e.team_id), published.map(toResult));
      const standings = rankTeams(
        Array.from(totals.values()).map((t) => ({team_id: t.teamId, name: teams.get(t.teamId)?.name ?? `Ekipa ${t.teamId}`, totals: t}))
      );

      return {
        tournament,
        entries: loadedEntries,
        tables,
        teams,
        kolos,
        phase,
        standings,
        completed: completedKolos(kolos),
        live: liveKolo(kolos),
        admin,
      };
    });
}

export async function loadSnapshot(id: number, viewer: Viewer | null, db: Db = prisma): Promise<Snapshot | null> {
  return (await loadSnapshots([id], viewer, db))[0] ?? null;
}

export function toResult(t: LoadedTable): TableResult {
  return {
    kolo: t.kolo,
    team1Id: t.team1_id,
    team2Id: t.team2_id,
    team1Wins: t.team1_wins,
    team2Wins: t.team2_wins,
    open: t.open,
    started: tableStarted(t),
    diff: t.diff,
  };
}

// Every Kolo with its tables: a Kolo's tables share its status (a draft until it is published)
export function koloSummaries(tables: LoadedTable[]): KoloSummary[] {
  const byKolo = new Map<number, LoadedTable[]>();
  for (const t of tables) byKolo.set(t.kolo, [...(byKolo.get(t.kolo) ?? []), t]);
  return Array.from(byKolo, ([number, list]) => ({
    number,
    published: list.every((t) => t.status === "PUBLISHED"),
    tables: list.length,
    done: list.filter((t) => !t.open).length,
    live: list.filter((t) => t.open && tableStarted(t)).length,
  })).sort((a, b) => a.number - b.number);
}
