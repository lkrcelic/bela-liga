import {isByeTeam, teamLabel} from "@/app/_lib/bye";
import {Viewer} from "@/app/_lib/players/privacy";
import {isAdminRole} from "@/app/_lib/players/admin";
import {
  AdminTournament,
  EntryPlayer,
  KoloTable,
  KoloView,
  MyEntry,
  MyMatch,
  TournamentCard,
  TournamentEntryView,
  TournamentResults,
  TournamentStandingsItem,
  TournamentWinner,
} from "@/app/_interfaces/tournament";
import {waitingList} from "@/app/_lib/tournamentEntries";
import {LoadedEntry, LoadedPlayer, LoadedTable, Snapshot} from "./load";

// The tournament API's answers, built from a snapshot (load.ts) for the viewer: the username of a player only for an
// admin (they are private), the ratings only for someone logged in, and the viewer's own team picked out.

const isoDay = (d: Date) => d.toISOString().slice(0, 10);

function entryPlayer(p: LoadedPlayer, admin: boolean): EntryPlayer {
  return {id: p.id, name: p.name, photo_url: p.photo_url, ...(admin && {username: p.username})};
}

// The average rating of a team's players (null without players or for a visitor)
function teamRating(e: LoadedEntry, viewer: Viewer | null): number | null {
  if (!viewer || e.players.length === 0) return null;
  return Math.round(e.players.reduce((sum, p) => sum + p.rating, 0) / e.players.length);
}

// The viewer's entry: the one whose players include them (in it or waiting)
export function myEntryOf(s: Snapshot, viewer: Viewer | null): LoadedEntry | null {
  if (!viewer) return null;
  return s.entries.find((e) => e.players.some((p) => p.id === viewer.id)) ?? null;
}

function positionOf(s: Snapshot, teamId: number): number | null {
  const i = waitingList(s.entries.map((e) => ({teamId: e.team_id, status: e.status, registeredAt: e.registered_at}))).findIndex((e) => e.teamId === teamId);
  return i >= 0 ? i + 1 : null;
}

export function entryView(s: Snapshot, e: LoadedEntry, viewer: Viewer | null): TournamentEntryView {
  const admin = viewer != null && isAdminRole(viewer);
  return {
    team_id: e.team_id,
    team_name: e.team_name,
    photo_url: e.photo_url,
    players: e.players.map((p) => entryPlayer(p, admin)),
    rating: teamRating(e, viewer),
    status: e.status,
    registered_at: e.registered_at.toISOString(),
    position: e.status === "WAITING" ? positionOf(s, e.team_id) : null,
    mine: viewer != null && e.players.some((p) => p.id === viewer.id),
  };
}

// Who of a team played its tables (Tko igra), else its players
function playedBy(s: Snapshot, teamId: number): string[] {
  const entry = s.entries.find((e) => e.team_id === teamId);
  const ids = new Set(s.tables.filter((t) => t.status === "PUBLISHED").flatMap((t) => t.lineup.filter((l) => l.team_id === teamId).map((l) => l.player_id)));
  const names = entry?.players.filter((p) => ids.has(p.id)).map((p) => p.name) ?? [];
  return names.length > 0 ? names : (entry?.players.map((p) => p.name) ?? []);
}

function winnerOf(s: Snapshot): TournamentWinner | null {
  if (s.phase !== "finished" || s.standings.length === 0) return null;
  const top = s.standings[0];
  return {
    team_id: top.team_id,
    team_name: top.name,
    photo_url: s.teams.get(top.team_id)?.photo_url ?? null,
    players: playedBy(s, top.team_id),
    wins: top.totals.wins,
    draws: top.totals.draws,
    losses: top.totals.losses,
  };
}

export function cardView(s: Snapshot, viewer: Viewer | null): TournamentCard {
  const t = s.tournament;
  const admin = viewer != null && isAdminRole(viewer);
  const registered = s.entries.filter((e) => e.status === "REGISTERED");
  const mine = myEntryOf(s, viewer);
  const me: MyEntry | null = mine
    ? {team_id: mine.team_id, team_name: mine.team_name, status: mine.status, position: mine.status === "WAITING" ? positionOf(s, mine.team_id) : null, players: mine.players.map((p) => entryPlayer(p, admin))}
    : null;
  const place = mine && mine.status === "REGISTERED" && s.phase === "finished" ? s.standings.findIndex((r) => r.team_id === mine.team_id) + 1 : 0;
  return {
    id: t.tournament_id,
    name: t.tournament_name,
    date: isoDay(t.date),
    gathering_time: t.gathering_time,
    start_time: t.start_time,
    location: {name: t.location_name, address: t.location_address, url: t.location_url},
    rounds: t.rounds,
    matches_per_round: t.matches_per_round,
    declarations: t.declarations,
    entry_fee: t.entry_fee,
    max_teams: t.max_teams,
    registrations_open: t.registrations_open,
    phase: s.phase,
    teams: registered.length,
    waiting: s.entries.length - registered.length,
    players: new Set(registered.flatMap((e) => e.players.map((p) => p.id))).size,
    avatars: registered.flatMap((e) => e.players).slice(0, 3).map((p) => ({name: p.name, photo_url: p.photo_url})),
    completed_kolos: s.completed,
    live_kolo: s.live,
    winner: winnerOf(s),
    me,
    my_place: place > 0 ? place : null,
  };
}

// The teams in: the viewer's first, then by rating, then by name
export function entriesList(s: Snapshot, viewer: Viewer | null): TournamentEntryView[] {
  return s.entries
    .filter((e) => e.status === "REGISTERED")
    .map((e) => entryView(s, e, viewer))
    .sort((a, b) => Number(b.mine) - Number(a.mine) || (b.rating ?? 0) - (a.rating ?? 0) || a.team_name.localeCompare(b.team_name, "hr"));
}

// The viewer's team's tables, Kolo by Kolo, the viewer's team first (Vaši mečevi)
export function myMatches(s: Snapshot, viewer: Viewer | null): MyMatch[] {
  const mine = myEntryOf(s, viewer);
  if (!mine) return [];
  return s.tables
    .filter((t) => t.status === "PUBLISHED" && (t.team1_id === mine.team_id || t.team2_id === mine.team_id))
    .map((t): MyMatch => {
      const first = t.team1_id === mine.team_id;
      const opponentId = first ? t.team2_id : t.team1_id;
      return {
        kolo: t.kolo,
        round_id: t.id,
        opponent: teamLabel(opponentId, s.teams.get(opponentId)?.name ?? ""),
        opponent_id: opponentId,
        wins: first ? [t.team1_wins, t.team2_wins] : [t.team2_wins, t.team1_wins],
        done: !t.open,
        bye: isByeTeam(opponentId),
      };
    })
    .sort((a, b) => a.kolo - b.kolo);
}

function koloTable(s: Snapshot, t: LoadedTable): KoloTable {
  const team = (id: number) => ({team_name: teamLabel(id, s.teams.get(id)?.name ?? `Ekipa ${id}`), photo_url: s.teams.get(id)?.photo_url ?? null});
  return {
    id: t.id,
    table_number: t.table_number,
    smoking_table: t.smoking_table,
    team1_id: t.team1_id,
    team2_id: t.team2_id,
    team1: team(t.team1_id),
    team2: team(t.team2_id),
    team1_wins: t.team1_wins,
    team2_wins: t.team2_wins,
    // a match is being played at it (as the league's rounds: active)
    active: t.open && (t.active || t.ongoing != null),
    open: t.open,
    ongoingMatches: t.ongoing ? [t.ongoing] : [],
    status: t.status,
  };
}

export function resultsView(s: Snapshot, viewer: Viewer | null): TournamentResults {
  const t = s.tournament;
  const mine = myEntryOf(s, viewer);
  const standings: TournamentStandingsItem[] = s.standings.map((r) => ({
    id: r.team_id,
    team_id: r.team_id,
    team: {team_name: r.name},
    rounds_played: r.totals.played,
    wins: r.totals.wins,
    draws: r.totals.draws,
    losses: r.totals.losses,
    point_difference: r.totals.difference,
    score: r.totals.points,
    active_round_count: r.totals.live ? 1 : 0,
    photo_url: s.teams.get(r.team_id)?.photo_url ?? null,
    players: s.entries.find((e) => e.team_id === r.team_id)?.players.map((p) => (viewer && isAdminRole(viewer) ? p.username : p.name)) ?? [],
  }));
  const kolos: KoloView[] = s.kolos.map((k) => ({
    number: k.number,
    published: k.published,
    tables: s.tables.filter((x) => x.kolo === k.number).map((x) => koloTable(s, x)),
  }));
  return {
    id: t.tournament_id,
    name: t.tournament_name,
    date: isoDay(t.date),
    rounds: t.rounds,
    matches_per_round: t.matches_per_round,
    phase: s.phase,
    completed_kolos: s.completed,
    live_kolo: s.live,
    standings,
    kolos,
    my_team_id: mine && mine.status === "REGISTERED" ? mine.team_id : null,
  };
}

// The teams at a Kolo 1 draft are not the teams in now (someone signed off or was added after it was made)
export function staleDraft(s: Snapshot): boolean {
  const draft = s.tables.filter((t) => t.kolo === 1 && t.status !== "PUBLISHED");
  if (draft.length === 0) return false;
  const seated = new Set(draft.flatMap((t) => [t.team1_id, t.team2_id]).filter((id) => !isByeTeam(id)));
  const registered = new Set(s.entries.filter((e) => e.status === "REGISTERED").map((e) => e.team_id));
  return seated.size !== registered.size || Array.from(registered).some((id) => !seated.has(id));
}

// Which Kolo can be made next (Složi Kolo N), and why not yet
export function nextKolo(s: Snapshot): AdminTournament["next_kolo"] {
  if (s.phase === "cancelled" || s.phase === "finished") return null;
  const published = s.kolos.filter((k) => k.published);
  const last = Math.max(0, ...published.map((k) => k.number));
  const number = last + 1;
  if (number > s.tournament.rounds) return null;
  if (number === 1) {
    if (s.tournament.registrations_open) return {number, ready: false, reason: "Prvo zatvori prijave, zatim složi Kolo 1."};
    if (s.entries.filter((e) => e.status === "REGISTERED").length < 2) return {number, ready: false, reason: "Za turnir trebaju barem dvije prijavljene ekipe."};
    return {number, ready: true, reason: null};
  }
  const previous = s.kolos.find((k) => k.number === last)!;
  const playing = s.tables.filter((t) => t.kolo === last && t.open);
  if (playing.length > 0) return {number, ready: false, reason: `Kolo ${last} još traje: ${previous.done} od ${previous.tables} stolova je gotovo.`};
  return {number, ready: true, reason: null};
}

export function adminView(s: Snapshot, viewer: Viewer): AdminTournament {
  const t = s.tournament;
  const waiting = waitingList(s.entries.map((e) => ({teamId: e.team_id, status: e.status, registeredAt: e.registered_at})));
  return {
    ...cardView(s, viewer),
    rules_url: t.rules_url,
    prizes: t.prizes.map((p) => ({place: p.place, prize: p.prize, description: p.description})),
    started_at: t.started_at?.toISOString() ?? null,
    cancelled_at: t.cancelled_at?.toISOString() ?? null,
    entries: s.entries.filter((e) => e.status === "REGISTERED").map((e) => entryView(s, e, viewer)),
    waiting_list: waiting.map((w) => entryView(s, s.entries.find((e) => e.team_id === w.teamId)!, viewer)),
    results: resultsView(s, viewer),
    next_kolo: nextKolo(s),
    stale_draft: staleDraft(s),
  };
}
