// Tournaments (Turniri): how far one has got, its standings and the words the screens use for it. Framework free so it
// can be unit tested.
import {BYE_TEAM_ID, isByeTeam} from "@/app/_lib/bye";
import {count, NOUN, plural} from "@/app/_lib/ui/text";

// upcoming: before Kolo 1 is published (sign-ups); active: from then until the last Kolo is played; cancelled: Otkaži
export type TournamentPhase = "upcoming" | "active" | "finished" | "cancelled";

// One Kolo: its tables (the bye's included), how many are played and how many are being played
export type KoloSummary = {number: number; published: boolean; tables: number; done: number; live: number};

export function tournamentPhase(t: {startedAt: Date | string | null; cancelledAt: Date | string | null; rounds: number}, kolos: KoloSummary[]): TournamentPhase {
  if (t.cancelledAt) return "cancelled";
  if (!t.startedAt) return "upcoming";
  const published = kolos.filter((k) => k.published);
  const last = Math.max(0, ...published.map((k) => k.number));
  return last >= t.rounds && published.every(kolosDone) ? "finished" : "active";
}

const kolosDone = (k: KoloSummary) => k.tables > 0 && k.done === k.tables;

// The Kolos played to the end ("Nakon 2 od 9 kola")
export function completedKolos(kolos: KoloSummary[]): number {
  return kolos.filter((k) => k.published && kolosDone(k)).length;
}

// The Kolo being played: the last one published while it isn't over; null before Kolo 1 and between Kolos
export function liveKolo(kolos: KoloSummary[]): number | null {
  const published = kolos.filter((k) => k.published).sort((a, b) => b.number - a.number);
  return published.length > 0 && !kolosDone(published[0]) ? published[0].number : null;
}

// Each of the tournament's Kolos as the admin's list shows it (Kola): played, being played, a draft waiting to be
// published, or still to come
export type KoloStep = "played" | "live" | "draft" | "waiting";

export function koloSteps(rounds: number, kolos: KoloSummary[]): {number: number; step: KoloStep}[] {
  const byNumber = new Map(kolos.map((k) => [k.number, k]));
  const last = Math.max(rounds, ...kolos.map((k) => k.number));
  return Array.from({length: last}, (_, i) => {
    const k = byNumber.get(i + 1);
    const step: KoloStep = !k ? "waiting" : !k.published ? "draft" : kolosDone(k) ? "played" : "live";
    return {number: i + 1, step};
  });
}

// ---------- standings ----------

// A published table as the standings read it
export type TableResult = {
  kolo: number;
  team1Id: number;
  team2Id: number;
  team1Wins: number;
  team2Wins: number;
  open: boolean;
  // play has started at it (a match is running or was played)
  started: boolean;
  // team1's points minus team2's, over the matches played
  diff: number;
};

export type TeamTotals = {
  teamId: number;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  // a win 2, a draw 1
  points: number;
  difference: number;
  // a table of the team is being played
  live: boolean;
};

// Every team's totals from the tables played to the end, as in the league: a table won (more matches won) is a win,
// equal matches a draw; the difference is of the points of every match played, the bye's 301:0 matches too. Teams
// without a table yet have zeros.
export function tournamentTotals(teamIds: number[], tables: TableResult[]): Map<number, TeamTotals> {
  const totals = new Map<number, TeamTotals>(
    teamIds.map((id) => [id, {teamId: id, played: 0, wins: 0, draws: 0, losses: 0, points: 0, difference: 0, live: false}])
  );
  const side = (id: number) => {
    if (isByeTeam(id)) return null;
    let t = totals.get(id);
    if (!t) {
      // a team that left the tournament after it played keeps its results
      t = {teamId: id, played: 0, wins: 0, draws: 0, losses: 0, points: 0, difference: 0, live: false};
      totals.set(id, t);
    }
    return t;
  };
  for (const table of tables) {
    const sides: [TeamTotals | null, number, number, number][] = [
      [side(table.team1Id), table.team1Wins, table.team2Wins, table.diff],
      [side(table.team2Id), table.team2Wins, table.team1Wins, -table.diff],
    ];
    for (const [t, won, lost, diff] of sides) {
      if (!t) continue;
      if (table.open) {
        if (table.started) t.live = true;
        continue;
      }
      t.played += 1;
      if (won > lost) t.wins += 1;
      else if (won === lost) t.draws += 1;
      else t.losses += 1;
      t.difference += diff;
    }
  }
  totals.forEach((t) => (t.points = 2 * t.wins + t.draws));
  return totals;
}

// The standings order: points, then the difference, then the name (as the league's table)
export function rankTeams<T extends {name: string; totals: TeamTotals}>(teams: T[]): T[] {
  return [...teams].sort(
    (a, b) => b.totals.points - a.totals.points || b.totals.difference - a.totals.difference || a.name.localeCompare(b.name, "hr")
  );
}

// Every team's opponents so far, for the next Kolo's pairing (the bye counts as an opponent, BYE_TEAM_ID)
export function opponentsOf(tables: TableResult[]): Map<number, number[]> {
  const out = new Map<number, number[]>();
  const add = (team: number, opponent: number) => {
    if (isByeTeam(team)) return;
    out.set(team, [...(out.get(team) ?? []), isByeTeam(opponent) ? BYE_TEAM_ID : opponent]);
  };
  for (const t of tables) {
    add(t.team1Id, t.team2Id);
    add(t.team2Id, t.team1Id);
  }
  return out;
}

// ---------- words ----------

// "Danas", "Sutra", "Za 6 dana" before the day; "" after it (today: YYYY-MM-DD in league time)
export function daysUntilLabel(date: string, today: string): string {
  const days = Math.round((Date.parse(`${date}T00:00:00Z`) - Date.parse(`${today}T00:00:00Z`)) / 86_400_000);
  if (Number.isNaN(days) || days < 0) return "";
  if (days === 0) return "Danas";
  if (days === 1) return "Sutra";
  return `Za ${days} ${plural(days, "dan", "dana", "dana")}`;
}

// Pravila igre's line: "1001 · zvanja" or "1001 · bez zvanja"
export function rulesLabel(declarations: boolean): string {
  return declarations ? "1001 · zvanja" : "1001 · bez zvanja";
}

// The format line: "9 kola" (two matches a table, as in a league) or "9 kola · 1 partija po kolu"
export function formatLabel(rounds: number, matchesPerRound: number): string {
  const kola = count(rounds, NOUN.kolo);
  return matchesPerRound === 1 ? `${kola} · 1 partija po kolu` : kola;
}

// The entry fee's row: "Kotizacija 20 € po igraču" (paid on the day), or no fee: "Bez stresa, bez obveza"
export function feeLabel(entryFee: number): {title: string; sub: string; free: boolean} {
  return entryFee > 0
    ? {title: `Kotizacija ${entryFee} € po igraču`, sub: "Plaća se na dan turnira", free: false}
    : {title: "Bez stresa, bez obveza", sub: "Nema kotizacije", free: true};
}

export type Prize = {place: number; prize: string; description: string};

const MONEY = /^\s*(\d+(?:[.,]\d+)?)\s*€\s*$/;

// "prvo mjesto", "prva dva mjesta", "prva tri mjesta", "prvih 5 mjesta"
function placesLabel(n: number): string {
  if (n === 1) return "prvo mjesto";
  if (n === 2) return "prva dva mjesta";
  if (n === 3) return "prva tri mjesta";
  if (n === 4) return "prva četiri mjesta";
  return `prvih ${n} mjesta`;
}

// The closed Nagrade card's line: "Ukupno 600 € · prva tri mjesta" when every prize is an amount in euros, else the
// prizes themselves ("Pehar, Medalje · prva tri mjesta"); null without prizes
export function prizeSummary(prizes: Prize[]): string | null {
  if (prizes.length === 0) return null;
  const places = placesLabel(prizes.length);
  const amounts = prizes.map((p) => MONEY.exec(p.prize));
  if (amounts.every((m) => m != null)) {
    const total = amounts.reduce((sum, m) => sum + Number(m![1].replace(",", ".")), 0);
    return `Ukupno ${Number.isInteger(total) ? total : total.toFixed(2).replace(".", ",")} € · ${places}`;
  }
  const names = Array.from(new Set(prizes.map((p) => p.prize.trim()).filter(Boolean)));
  return `${names.join(", ")} · ${places}`;
}

// "22 / 24" with a limit, "22" without one
export function capacityLabel(registered: number, maxTeams: number | null): string {
  return maxTeams == null ? String(registered) : `${registered} / ${maxTeams}`;
}

// The admin's status of a tournament (Turniri list): what it needs next, in the list's words
export type TournamentStatusLabel =
  | {kind: "cancelled"; label: "Otkazan"}
  | {kind: "finished"; label: "Završeno"}
  | {kind: "live"; label: "Uživo"}
  | {kind: "waiting"; label: string}
  | {kind: "open"; label: "Prijave otvorene"}
  | {kind: "closed"; label: "Prijave zatvorene"};

export function tournamentStatus(phase: TournamentPhase, registrationsOpen: boolean, waiting: number): TournamentStatusLabel {
  if (phase === "cancelled") return {kind: "cancelled", label: "Otkazan"};
  if (phase === "finished") return {kind: "finished", label: "Završeno"};
  if (phase === "active") return {kind: "live", label: "Uživo"};
  if (waiting > 0) return {kind: "waiting", label: `Lista čekanja · ${waiting}`};
  return registrationsOpen ? {kind: "open", label: "Prijave otvorene"} : {kind: "closed", label: "Prijave zatvorene"};
}
