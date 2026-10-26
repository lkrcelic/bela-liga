import {Prisma} from "@prisma/client";
import {prisma} from "@/app/_lib/prisma";
import {Viewer} from "@/app/_lib/players/privacy";
import {displayName} from "@/app/_lib/players/names";
import {InvalidResultError} from "@/app/_lib/validation/validateResult";
import {NotFoundError} from "@/app/_lib/service/admin/tables";
import {playerPhotoUrls, teamPhotoUrls} from "@/app/_lib/service/players/photos";
import {AdminTournament, MyResult, MyTeamOption, TournamentCard, TournamentDetail, TournamentRequest, TournamentResults} from "@/app/_interfaces/tournament";
import {playersInOtherEntries, rebalance} from "@/app/_lib/tournamentEntries";
import {lockTournament} from "./lock";
import {loadSnapshot, loadSnapshots, Snapshot} from "./load";
import {adminView, cardView, entriesList, myEntryOf, myMatches, resultsView} from "./views";

// Creating, changing, cancelling and deleting a tournament (the admin's Turniri), and what its pages read.

type Tx = Prisma.TransactionClient;

export const TOURNAMENT_NOT_FOUND = "Turnir ne postoji.";
export const STARTED_LOCKED = "Turnir je počeo: datum, broj ekipa, partije po kolu i zvanja se više ne mijenjaju.";

const dateValue = (iso: string) => new Date(`${iso}T00:00:00.000Z`);
const blankToNull = (v: string | null | undefined) => (v && v.trim() ? v.trim() : null);

function fields(r: TournamentRequest) {
  return {
    tournament_name: r.name.trim(),
    date: dateValue(r.date),
    gathering_time: blankToNull(r.gathering_time),
    start_time: blankToNull(r.start_time),
    location_name: blankToNull(r.location_name),
    location_address: blankToNull(r.location_address),
    location_url: blankToNull(r.location_url),
    rounds: r.rounds,
    matches_per_round: r.matches_per_round,
    declarations: r.declarations,
    max_teams: r.max_teams,
    entry_fee: r.entry_fee,
    rules_url: blankToNull(r.rules_url),
  };
}

async function savePrizes(tx: Tx, tournamentId: number, prizes: TournamentRequest["prizes"]) {
  await tx.tournamentPrize.deleteMany({where: {tournament_id: tournamentId}});
  if (prizes.length === 0) return;
  await tx.tournamentPrize.createMany({
    data: prizes.map((p, i) => ({tournament_id: tournamentId, place: i + 1, prize: p.prize.trim(), description: (p.description ?? "").trim()})),
  });
}

// Novi turnir: it is published at once, with sign-ups open
export async function createTournament(request: TournamentRequest): Promise<number> {
  return prisma.$transaction(async (tx) => {
    const t = await tx.tournament.create({data: fields(request), select: {tournament_id: true}});
    await savePrizes(tx, t.tournament_id, request.prizes);
    return t.tournament_id;
  });
}

// The tables of a Kolo not published yet (a draft), deleted with what hangs on them (a bye table's matches). above: only
// the drafts of Kolos after that one
export async function dropDrafts(tx: Tx, tournamentId: number, above = 0) {
  const drafts = await tx.round.findMany({
    where: {tournamentRounds: {some: {tournament_id: tournamentId}}, status: {not: "PUBLISHED"}, round_number: {gt: above}},
    select: {id: true},
  });
  if (drafts.length === 0) return;
  const ids = drafts.map((d) => d.id);
  await tx.ongoingMatch.deleteMany({where: {round_id: {in: ids}}});
  await tx.match.deleteMany({where: {round_id: {in: ids}}});
  await tx.round.deleteMany({where: {id: {in: ids}}});
}

// Podaci · Spremi promjene. Before the start everything changes (a lower limit sends the last teams to sign up to the
// waiting list, a higher one lets teams in, a new number of matches per table drops a Kolo 1 draft, which is made
// again); once it has started only what doesn't change the Kolos played: the name, place, times, fee, prizes, rules
// and Broj kola, down to the Kolos already published (so the admin can end it early).
export async function updateTournament(id: number, request: TournamentRequest): Promise<void> {
  await prisma.$transaction(async (tx) => {
    await lockTournament(tx, id);
    const t = await tx.tournament.findUnique({where: {tournament_id: id}});
    if (!t) throw new NotFoundError(TOURNAMENT_NOT_FOUND);
    if (t.cancelled_at) throw new InvalidResultError("Turnir je otkazan.");
    const next = fields(request);

    if (t.started_at) {
      const locked =
        next.date.getTime() !== t.date.getTime() ||
        next.matches_per_round !== t.matches_per_round ||
        next.declarations !== t.declarations ||
        next.max_teams !== t.max_teams;
      if (locked) throw new InvalidResultError(STARTED_LOCKED);
      const published = await tx.round.aggregate({
        _max: {round_number: true},
        where: {tournamentRounds: {some: {tournament_id: id}}, status: "PUBLISHED"},
      });
      const played = published._max.round_number ?? 0;
      if (next.rounds < played) throw new InvalidResultError(`Objavljeno je već ${played} kola: broj kola ne može biti manji.`);
      // a draft of a Kolo the tournament no longer has goes (it would be published as a Kolo past the last)
      if (next.rounds < t.rounds) await dropDrafts(tx, id, next.rounds);
    } else {
      if (next.matches_per_round !== t.matches_per_round) await dropDrafts(tx, id);
      const drafts = {tournamentRounds: {some: {tournament_id: id}}, status: {not: "PUBLISHED" as const}};
      if (next.date.getTime() !== t.date.getTime()) await tx.round.updateMany({where: drafts, data: {round_date: next.date}});
      if (next.declarations !== t.declarations) await tx.round.updateMany({where: drafts, data: {declarations: next.declarations}});
    }

    await tx.tournament.update({where: {tournament_id: id}, data: next});
    await savePrizes(tx, id, request.prizes);
    if (!t.started_at && next.max_teams !== t.max_teams) await applyLimit(tx, id, next.max_teams);
  });
}

// Puts the entries right for the limit (rebalance)
export async function applyLimit(tx: Tx, tournamentId: number, maxTeams: number | null) {
  const entries = await tx.tournamentTeam.findMany({where: {tournament_id: tournamentId}, select: {team_id: true, status: true, registered_at: true}});
  const changes = rebalance(entries.map((e) => ({teamId: e.team_id, status: e.status, registeredAt: e.registered_at})), maxTeams);
  for (const c of changes) {
    await tx.tournamentTeam.update({where: {tournament_id_team_id: {tournament_id: tournamentId, team_id: c.teamId}}, data: {status: c.status}});
  }
}

// Otkaži: it stays in the list as Otkazan; the teams signed up get no notice. Only before it starts.
export async function cancelTournament(id: number): Promise<void> {
  await prisma.$transaction(async (tx) => {
    await lockTournament(tx, id);
    const t = await tx.tournament.findUnique({where: {tournament_id: id}, select: {started_at: true, cancelled_at: true}});
    if (!t) throw new NotFoundError(TOURNAMENT_NOT_FOUND);
    if (t.started_at) throw new InvalidResultError("Turnir je već počeo i ne može se otkazati.");
    if (t.cancelled_at) return;
    await dropDrafts(tx, id);
    await tx.tournament.update({where: {tournament_id: id}, data: {cancelled_at: new Date(), registrations_open: false}});
  });
}

// Obriši: the tournament and its sign-ups are gone. Only before it starts.
export async function deleteTournament(id: number): Promise<void> {
  await prisma.$transaction(async (tx) => {
    await lockTournament(tx, id);
    const t = await tx.tournament.findUnique({where: {tournament_id: id}, select: {started_at: true}});
    if (!t) throw new NotFoundError(TOURNAMENT_NOT_FOUND);
    if (t.started_at) throw new InvalidResultError("Turnir se može obrisati samo prije početka.");
    await dropDrafts(tx, id);
    await tx.tournament.delete({where: {tournament_id: id}});
  });
}

// ---------- reading ----------

// The tournaments the lists show (newest date first)
async function tournamentIds(): Promise<number[]> {
  const rows = await prisma.tournament.findMany({orderBy: [{date: "desc"}, {tournament_id: "desc"}], select: {tournament_id: true}, take: 200});
  return rows.map((r) => r.tournament_id);
}

// Početna · Turniri, Nadolazeći turniri, Završeni turniri (a visitor too)
export async function listTournaments(viewer: Viewer | null): Promise<TournamentCard[]> {
  const snapshots = await loadSnapshots(await tournamentIds(), viewer);
  return snapshots.map((s) => cardView(s, viewer));
}

// The admin's Turniri list
export async function listAdminTournaments(viewer: Viewer): Promise<TournamentCard[]> {
  return listTournaments(viewer);
}

async function snapshotOrThrow(id: number, viewer: Viewer | null): Promise<Snapshot> {
  const s = await loadSnapshot(id, viewer);
  if (!s) throw new NotFoundError(TOURNAMENT_NOT_FOUND);
  return s;
}

// The viewer's teams for the sign-up sheet, and why one can't sign up
async function myTeams(s: Snapshot, viewer: Viewer): Promise<MyTeamOption[]> {
  const teams = await prisma.team.findMany({
    where: {teamPlayers: {some: {player_id: viewer.id}}},
    orderBy: {team_name: "asc"},
    select: {
      team_id: true,
      team_name: true,
      teamPlayers: {select: {player: {select: {id: true, first_name: true, last_name: true, active: true, deleted_at: true}}}},
    },
  });
  const [teamPhotos, playerPhotos] = await Promise.all([
    teamPhotoUrls(viewer, teams.map((t) => t.team_id)),
    playerPhotoUrls(viewer, teams.flatMap((t) => t.teamPlayers.map((tp) => tp.player.id))),
  ]);
  const entryOf = new Map(s.entries.map((e) => [e.team_id, e]));
  return teams.map((team) => {
    const players = team.teamPlayers.map((tp) => tp.player).filter((p) => p.deleted_at == null);
    const entry = entryOf.get(team.team_id);
    const others = s.entries.filter((e) => e.team_id !== team.team_id).map((e) => ({teamId: e.team_id, playerIds: e.players.map((p) => p.id)}));
    const taken = playersInOtherEntries(players.map((p) => p.id), others);
    let reason: string | null = null;
    if (!entry) {
      if (players.filter((p) => p.active).length < 2) reason = "Ekipa treba barem dva igrača s računom.";
      else if (taken.length > 0) {
        const who = players.find((p) => p.id === taken[0])!;
        const where = s.entries.find((e) => e.players.some((p) => p.id === who.id))!;
        reason = who.id === viewer.id ? `Već si prijavljen s ekipom ${where.team_name}.` : `${displayName(who)} je već prijavljen s ekipom ${where.team_name}.`;
      }
    }
    return {
      team_id: team.team_id,
      team_name: team.team_name,
      photo_url: teamPhotos.get(team.team_id) ?? null,
      players: players
        .map((p) => ({id: p.id, name: displayName(p), photo_url: playerPhotos.get(p.id) ?? null, me: p.id === viewer.id}))
        .sort((a, b) => Number(b.me) - Number(a.me) || a.name.localeCompare(b.name, "hr")),
      entry: entry?.status ?? null,
      reason,
    };
  });
}

// Vaš rezultat: the viewer's team's place and record once it is over, and the viewer's rating over the tournament's day
async function myResult(s: Snapshot, viewer: Viewer | null): Promise<MyResult | null> {
  const mine = myEntryOf(s, viewer);
  if (!viewer || !mine || mine.status !== "REGISTERED" || s.phase !== "finished") return null;
  const index = s.standings.findIndex((r) => r.team_id === mine.team_id);
  if (index < 0) return null;
  const row = s.standings[index];
  const history = await prisma.playerRatingHistory.findUnique({
    where: {player_id_night: {player_id: viewer.id, night: s.tournament.date}},
    select: {rating: true, change: true},
  });
  const ids = new Set(s.tables.filter((t) => t.status === "PUBLISHED").flatMap((t) => t.lineup.filter((l) => l.team_id === mine.team_id).map((l) => l.player_id)));
  const played = mine.players.filter((p) => ids.has(p.id)).map((p) => p.name);
  return {
    place: index + 1,
    of: s.standings.length,
    team_id: mine.team_id,
    team_name: mine.team_name,
    players: played.length > 0 ? played : mine.players.map((p) => p.name),
    wins: row.totals.wins,
    draws: row.totals.draws,
    losses: row.totals.losses,
    rating: history ? {before: history.rating - history.change, after: history.rating, change: history.change} : null,
  };
}

// The tournament page (public: a visitor sees it without the ratings, photos and sign-up)
export async function getTournamentDetail(id: number, viewer: Viewer | null): Promise<TournamentDetail> {
  const s = await snapshotOrThrow(id, viewer);
  const t = s.tournament;
  const [teams, result] = await Promise.all([
    viewer && s.phase === "upcoming" && t.registrations_open ? myTeams(s, viewer) : Promise.resolve([]),
    myResult(s, viewer),
  ]);
  return {
    ...cardView(s, viewer),
    rules_url: t.rules_url,
    prizes: t.prizes.map((p) => ({place: p.place, prize: p.prize, description: p.description})),
    entries: entriesList(s, viewer),
    my_teams: teams,
    my_matches: myMatches(s, viewer),
    my_result: result,
    cancelled: t.cancelled_at != null,
  };
}

// Poredak i rezultati (public)
export async function getTournamentResults(id: number, viewer: Viewer | null): Promise<TournamentResults> {
  return resultsView(await snapshotOrThrow(id, viewer), viewer);
}

// Upravljanje turnirom
export async function getAdminTournament(id: number, viewer: Viewer): Promise<AdminTournament> {
  return adminView(await snapshotOrThrow(id, viewer), viewer);
}
