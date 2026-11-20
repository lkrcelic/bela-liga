// C3's own setup: a tournament made for one test through the admin's routes (Novi turnir, Dodaj ekipu, Označi dolazak,
// Prijave zatvorene, Složi kolo, Objavi kolo), with teams nobody else uses today, and removed again afterwards (with its
// tables, its bans and, when a table was played, the ratings counted again without it). Every test starts from the
// same point, so --repeat-each never meets the last one's tournament; the seeded tournaments stay as seeded.
import type {APIRequestContext, Page} from "@playwright/test";
import type {TournamentRequest} from "@/app/_interfaces/tournament";
import {CRON_HEADERS, ONBOARDED, type Db} from "./db";
import {expect, test as base} from "./fixtures";
import {addHands, startMatch, type ApiHand} from "./scorepad";

export {expect} from "./fixtures";

// every tournament this section makes is called so; a run that died half-way leaves its own, removed at the next start
const PREFIX = "C3 · ";

const zagrebDay = new Intl.DateTimeFormat("en-CA", {timeZone: "Europe/Zagreb", year: "numeric", month: "2-digit", day: "2-digit"});

// The calendar day in Zagreb (YYYY-MM-DD), the day a tournament is played on; plus days after it
export function day(plus = 0, from = new Date()): string {
  const today = zagrebDay.format(from);
  return new Date(Date.parse(`${today}T00:00:00Z`) + plus * 86_400_000).toISOString().slice(0, 10);
}

// A day a month later (the last day of a shorter month), as a Kolo-1 no-show's ban runs (NO_SHOW_BAN_MONTHS)
export function monthLater(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  const last = new Date(Date.UTC(y, m + 1, 0)).getUTCDate();
  return new Date(Date.UTC(y, m, Math.min(d, last))).toISOString().slice(0, 10);
}

// "9:43": a moment as the screens write a time of day in Zagreb
export const clock = (moment: Date) =>
  new Intl.DateTimeFormat("hr-HR", {timeZone: "Europe/Zagreb", hour: "numeric", minute: "2-digit", hourCycle: "h23"}).format(moment);

export const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// ---------- teams ----------

export type Player = {id: number; username: string; first_name: string; last_name: string};

export type Entry = {
  id: number;
  name: string;
  // its active players
  players: Player[];
  // one of them who opens any page without an onboarding sheet (only for the teams asked for with `phones`)
  phone: string | null;
};

// Teams a test may sign up anywhere: two or more active players, none banned and no ban on the team, no player shared
// with another team picked, and nobody in a tournament of today or a league table of tonight (so no other table, and no
// question about another table, reaches their phones). The first `phones` of them have a player who is onboarded. By
// team id, so every run picks the same. notIn: tournaments (of any day) none of their players may be in either.
export async function pickTeams(db: Db, n: number, {phones = 0, notIn = []}: {phones?: number; notIn?: number[]} = {}): Promise<Entry[]> {
  const today = new Date(`${day()}T00:00:00.000Z`);
  const busy = new Set<number>();
  const entries = await db.tournamentTeam.findMany({
    where: {OR: [{tournament: {date: {gte: new Date(today.getTime() - 86_400_000), lte: today}}}, {tournament_id: {in: notIn}}]},
    select: {team: {select: {teamPlayers: {select: {player_id: true}}}}},
  });
  entries.forEach((e) => e.team.teamPlayers.forEach((tp) => busy.add(tp.player_id)));
  const tables = await db.round.findMany({
    where: {round_date: {gte: new Date(today.getTime() - 86_400_000), lte: today}},
    select: {roundPlayers: {select: {player_id: true}}, team1: {select: {teamPlayers: {select: {player_id: true}}}}, team2: {select: {teamPlayers: {select: {player_id: true}}}}},
  });
  tables.forEach((r) => [...r.roundPlayers, ...r.team1.teamPlayers, ...r.team2.teamPlayers].forEach((p) => busy.add(p.player_id)));
  const bans = await db.signupBan.findMany({where: {lifted_at: null, OR: [{until: null}, {until: {gt: today}}]}, select: {team_id: true, player_id: true}});
  const bannedTeams = new Set(bans.map((b) => b.team_id).filter((id): id is number => id != null));
  const bannedPlayers = new Set(bans.map((b) => b.player_id).filter((id): id is number => id != null));
  const onboarded = new Set((await db.player.findMany({where: ONBOARDED, select: {id: true}})).map((p) => p.id));

  const teams = await db.team.findMany({
    where: {team_id: {not: 0}},
    orderBy: {team_id: "asc"},
    select: {
      team_id: true,
      team_name: true,
      teamPlayers: {select: {player: {select: {id: true, username: true, first_name: true, last_name: true, active: true, deleted_at: true}}}},
    },
  });
  const used = new Set<number>();
  const out: Entry[] = [];
  for (const t of teams) {
    if (out.length === n) break;
    const all = t.teamPlayers.map((tp) => tp.player).filter((p) => p.deleted_at == null);
    const active = all.filter((p) => p.active);
    if (active.length < 2 || bannedTeams.has(t.team_id)) continue;
    if (all.some((p) => bannedPlayers.has(p.id) || busy.has(p.id) || used.has(p.id))) continue;
    const phone = active.find((p) => onboarded.has(p.id)) ?? null;
    if (out.length < phones && !phone) continue;
    all.forEach((p) => used.add(p.id));
    out.push({
      id: t.team_id,
      name: t.team_name,
      players: active.map(({id, username, first_name, last_name}) => ({id, username, first_name, last_name})),
      phone: phone?.username ?? null,
    });
  }
  if (out.length < n) throw new Error(`only ${out.length} of ${n} free teams`);
  return out;
}

// ---------- a tournament of the test's own ----------

export type Spec = Partial<TournamentRequest> & {name: string; date: string};

// Novi turnir as the seed's tournaments are made (e2e/seed/scenarios/tournaments.ts). Every tournament has Okupljanje
// and Početak: 23:58 and 23:59 unless the test says otherwise, so a tournament of today keeps Potvrda dolaska shut and
// its start time doesn't come while the test runs
function request(spec: Spec): TournamentRequest {
  return {
    gathering_time: "23:58",
    start_time: "23:59",
    // no place from Lokacije (DECISIONS #98): nothing here reads it
    location_id: null,
    rounds: 3,
    matches_per_round: 1,
    declarations: true,
    max_teams: 16,
    entry_fee: 10,
    rules_url: null,
    prizes: [{prize: "200 €", description: "i pehar"}],
    game_minutes: 35,
    auto_publish: false,
    open_signups: false,
    hide_entries: false,
    organizer_phone: "+385 91 000 0001",
    smoking_tables: [],
    ...spec,
    name: `${PREFIX}${spec.name}`,
  };
}

export type Admin = APIRequestContext;

const admin = (id: number) => `/api/admin/tournaments/${id}`;

async function ok(res: Awaited<ReturnType<APIRequestContext["get"]>>, what: string) {
  expect(res.ok(), `${what}: ${res.status()} ${await res.text()}`).toBeTruthy();
  return res;
}

// Dodaj ekipu, one after another (so the waiting list is in this order)
export async function addTeams(a: Admin, id: number, teams: Entry[]) {
  for (const t of teams) await ok(await a.post(`${admin(id)}/teams`, {data: {team_id: t.id}}), `Dodaj ekipu ${t.name}`);
}

// Označi dolazak
export async function markArrived(a: Admin, id: number, teams: Entry[]) {
  for (const t of teams) await ok(await a.patch(`${admin(id)}/teams/${t.id}`, {data: {arrived: true}}), `Označi dolazak ${t.name}`);
}

// Prijave otvorene / zatvorene
export async function setSignUps(a: Admin, id: number, open: boolean) {
  await ok(await a.patch(`${admin(id)}/registrations`, {data: {open}}), "Prijave");
}

// As tournaments.ready: today, every team signed up and here, sign-ups closed, nothing drafted
export async function makeReady(make: Fixtures["tournaments"]["make"], a: Admin, teams: Entry[], spec: Partial<Spec> = {}) {
  const t = await make({name: "Turnir spreman za start", date: day(), rounds: 3, max_teams: 8, ...spec});
  await addTeams(a, t.id, teams);
  await markArrived(a, t.id, teams);
  await setSignUps(a, t.id, false);
  return t;
}

// Složi Kolo N, then Objavi kolo: the Kolo's tables (table number order, the bye's last)
export async function publishNextKolo(a: Admin, db: Db, id: number) {
  const made = await ok(await a.post(`${admin(id)}/kola`, {data: {}}), "Složi kolo");
  const {number} = ((await made.json()) as {made: {number: number}}).made;
  await ok(await a.post(`${admin(id)}/kola/${number}/publish`), `Objavi Kolo ${number}`);
  return {number, tables: await koloTables(db, id, number)};
}

export async function koloTables(db: Db, id: number, kolo: number) {
  return db.round.findMany({
    where: {tournamentRounds: {some: {tournament_id: id}}, round_number: kolo},
    orderBy: {table_number: "asc"},
    include: {team1: {select: {team_name: true}}, team2: {select: {team_name: true}}},
  });
}

// The admin's read of the tournament runs its clock at once (the start time's switch, the skip at 10 minutes, the next
// Kolo's draft); the players' pages and /api/cron/tick run it at most every 4 s per tournament
export async function runClock(a: Admin, id: number) {
  await ok(await a.get(admin(id)), "Upravljanje turnirom");
}

// /api/cron/tick, as the scheduler calls it
export async function tick(a: Admin) {
  await ok(await a.get("/api/cron/tick", {headers: CRON_HEADERS}), "cron tick");
}

// The Kolo went out `minutes` ago (time never passes for real: its tables' published_at moves)
export async function koloOutFor(db: Db, id: number, kolo: number, minutes: number) {
  const {count} = await db.round.updateMany({
    where: {tournamentRounds: {some: {tournament_id: id}}, round_number: kolo, status: "PUBLISHED"},
    data: {published_at: new Date(Date.now() - minutes * 60_000)},
  });
  expect(count, `Kolo ${kolo} has no published tables`).toBeGreaterThan(0);
}

// A table played to the end through the app, as the admin's phone does it: Tko igra, the match, the hands, Završi meč.
// game1: team1's game points of each hand (no zvanja; the caller is the team with more)
export async function playTable(a: Admin, roundId: number, game1: number[]) {
  const matchId = await startMatch(a, roundId);
  const hands: ApiHand[] = game1.map((g) => ({caller: g > 81 ? 1 : 2, game1: g}));
  await addHands(a, matchId, hands);
  await ok(await a.post("/api/matches", {data: matchId}), "Završi meč");
}

// ---------- what a player's phone reads ----------

export type Attention = {prompt: {round_id: number} | null; notices: {kind: string; round_id: number}[]};

// Opens a page and answers what the player's app asked the server on it (/api/tournaments/attention): the question
// about their table (prompt) and the skipped tables' notices. The screen draws the question and the notice from it.
export async function openAndAsk(page: Page, url: string): Promise<Attention> {
  const asked = page.waitForResponse((r) => new URL(r.url()).pathname === "/api/tournaments/attention" && r.ok());
  await page.goto(url);
  return (await (await asked).json()) as Attention;
}

// The tournament table a player's pages offer (Započni igru), as they read it: its round, or null for none (the
// route's 404); any other refusal fails
export async function openTable(phone: APIRequestContext): Promise<number | null> {
  const res = await phone.get("/api/rounds/open?scope=tournament");
  if (res.status() === 404) return null;
  await ok(res, "/api/rounds/open");
  return ((await res.json()) as {roundId: number}).roundId;
}

// Removes a tournament of this section with everything that hangs on it. A tournament whose table was played to the end
// first loses its Kolos through Obriši kolo with the results (the server counts the ratings again without them).
export async function removeTournament(a: Admin, db: Db, id: number) {
  const t = await db.tournament.findUnique({where: {tournament_id: id}, select: {rounds: true}});
  if (!t) return;
  const played = await db.match.count({
    // a no-show's 1001 : 700 and a bye's 301 : 0 are not play
    where: {round: {tournamentRounds: {some: {tournament_id: id}}, OR: [{attendance: null}, {attendance: "PRESENT"}], team1_id: {not: 0}, team2_id: {not: 0}}},
  });
  if (played > 0) {
    if (t.rounds < 2) await ok(await a.put(`${admin(id)}/kola/${t.rounds + 1}`), "Dodaj kolo");
    await ok(await a.delete(`${admin(id)}/kola/1?rezultati=1`), "Obriši kolo s rezultatima");
  }
  const rounds = (await db.tournamentRound.findMany({where: {tournament_id: id}, select: {round_id: true}})).map((r) => r.round_id);
  await db.ongoingMatch.deleteMany({where: {round_id: {in: rounds}}});
  await db.match.deleteMany({where: {round_id: {in: rounds}}});
  await db.round.deleteMany({where: {id: {in: rounds}}});
  await db.signupBan.deleteMany({where: {tournament_id: id}});
  await db.tournament.delete({where: {tournament_id: id}});
}

type Fixtures = {
  // the admin's request context
  admin: Admin;
  // make(spec): Novi turnir for this test alone, removed after it; by: made by another account (the organizer)
  tournaments: {make: (spec: Spec, by?: APIRequestContext) => Promise<{id: number; name: string}>};
};

export const test = base.extend<Fixtures>({
  admin: async ({api}, use) => {
    await use(await api("admin"));
  },
  tournaments: async ({admin: a, db}, use) => {
    for (const t of await db.tournament.findMany({where: {tournament_name: {startsWith: PREFIX}}, select: {tournament_id: true}})) {
      await removeTournament(a, db, t.tournament_id);
    }
    const made: number[] = [];
    await use({
      make: async (spec, by = a) => {
        // a tournament of today opens Potvrda dolaska at 23:58 and starts at 23:59 (request()), and from then until
        // 06:00 its clock makes every team not marked here inactive: too late to begin a test on one
        const now = new Intl.DateTimeFormat("en-GB", {timeZone: "Europe/Zagreb", hour: "2-digit", minute: "2-digit", hourCycle: "h23"}).format(new Date());
        base.info().skip(spec.date === day() && now >= "23:50", "after 23:50 a tournament of today reaches its start while the test runs");
        const body = request(spec);
        const res = await ok(await by.post("/api/admin/tournaments", {data: body}), "Novi turnir");
        const {id} = (await res.json()) as {id: number};
        made.push(id);
        return {id, name: body.name};
      },
    });
    for (const id of made.reverse()) await removeTournament(a, db, id);
  },
});
