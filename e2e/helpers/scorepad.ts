// The scorepad, as a phone uses it: enter a hand, open a saved one, correct it, finish a match. The same steps work on
// the players' scoreboard (/ongoing-match/<id>) and on the admin's phone scorepad (a table opened from Večer lige or
// Dnevni poredak), whose hand sheet adds "Ispravi korak po korak" before the same three steps.
// Teams are named as the scorepad shows them, never left/right: the viewer's own team is on the left.
//
// Below that, the setup a scorepad test needs through the app's own routes (an admin's request context from the `api`
// fixture): a table of tonight's league night, started, with hands, and the night's rounds removed again afterwards.
import {expect, type APIRequestContext, type Locator, type Page} from "@playwright/test";
import type {Db} from "./db";

export type Zvanje = 20 | 50 | 100 | 150 | 200;

export type Hand = {
  // the team that called trumps
  caller: string;
  // the game points typed for one team (the other gets the rest of 162), or Štiglja for the team that took every trick
  points: {team: string; game: number} | {stiglja: string};
  // each team's zvanja (bela is a 20); a team left out has none
  zvanja?: Record<string, Zvanje[]>;
};

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// ---------- reading the board ----------

// every saved hand of the match on the board ("Igra 3: 92 prema 70, ukupno …")
export const handRows = (page: Page): Locator => page.getByRole("button", {name: /^Igra \d+: /});

// hand n (1-based); its name reads "Igra n: <left> prema <right>, ukupno <left> prema <right>, razlika <lead>"
export const handRow = (page: Page, n: number): Locator => page.getByRole("button", {name: new RegExp(`^Igra ${n}: `)});

// The team's total on the board, from the panel's screen-reader line ("Purgeri: 232 boda", ", pobjeda" once it won)
export async function expectTotal(page: Page, team: string, points: number) {
  await expect(page.getByText(new RegExp(`^${escape(team)}: ${points} bod(a|ova)?(, pobjeda)?$`))).toHaveCount(1);
}

// ---------- entering and correcting ----------

// Upiši igru on the board, the three steps, Spremi; resolves once the board lists the new hand
export async function enterHand(page: Page, hand: Hand): Promise<Locator> {
  const add = page.getByRole("button", {name: "Upiši igru", exact: true});
  await expect(add).toBeVisible();
  const before = await handRows(page).count();
  await add.click();
  await fillHand(page, hand);
  await saveHand(page);
  await expect(handRows(page)).toHaveCount(before + 1);
  return handRow(page, before + 1);
}

// A tap on hand n: on the players' board it opens the hand's first step; on the admin's scorepad its sheet, where
// "Ispravi korak po korak" leads to the same first step. Resolves on Izaberi tko je zvao.
export async function openHand(page: Page, n: number) {
  await handRow(page, n).click();
  const firstStep = page.getByRole("heading", {name: "Izaberi tko je zvao"});
  const stepByStep = page.getByRole("button", {name: /^Ispravi korak po korak/});
  await expect(firstStep.or(stepByStep)).toBeVisible();
  if (await stepByStep.isVisible()) await stepByStep.click();
  await expect(firstStep).toBeVisible();
}

// Corrects saved hand n through its three steps: what `change` names is replaced (zvanja: both teams', a team left out
// gets none), the rest stays as it was saved. Resolves back on the board, with as many hands as before.
export async function correctHand(page: Page, n: number, change: Partial<Hand>) {
  await expect(handRow(page, n)).toBeVisible();
  const before = await handRows(page).count();
  await openHand(page, n);
  await fillHand(page, change);
  await saveHand(page);
  await expect(handRows(page)).toHaveCount(before);
}

// Završi meč: resolves on the next match's board ("next") or on Kraj kola ("end")
export async function finishMatch(page: Page): Promise<"next" | "end"> {
  const from = page.url();
  await page.getByRole("button", {name: "Završi meč"}).click();
  await expect(page).not.toHaveURL(from);
  const end = page.getByRole("heading", {name: "Kraj kola"});
  await expect(end.or(page.getByRole("button", {name: "Upiši igru", exact: true}))).toBeVisible();
  return (await end.isVisible()) ? "end" : "next";
}

// The three steps of a hand, from Izaberi tko je zvao to the keypad, without saving; anything left out is kept as it
// is (a new hand: none). On its own for a test that looks at what Spremi answers itself (a second phone's "Je li ovo
// nova igra?", a match closed meanwhile).
export async function fillHand(page: Page, hand: Partial<Hand>) {
  // 1 · Izaberi tko je zvao
  await expect(page.getByRole("heading", {name: "Izaberi tko je zvao"})).toBeVisible();
  if (hand.caller) {
    const card = page.getByRole("radiogroup", {name: "Tko je zvao"}).getByRole("radio", {name: hand.caller, exact: true});
    await card.click();
    await expect(card).toBeChecked();
  }
  await page.getByRole("button", {name: "Dalje", exact: true}).click();

  // 2 · Zvanja: a box per team picks whose zvanja the buttons add
  const zvanjaFor = page.getByRole("radiogroup", {name: "Zvanja: upis za ekipu"});
  await expect(zvanjaFor).toBeVisible();
  if (hand.zvanja) {
    const teams = await teamsOf(zvanjaFor, "zvanja");
    const unknown = Object.keys(hand.zvanja).filter((t) => !teams.includes(t));
    if (unknown.length) throw new Error(`no team ${unknown.join(", ")} at this table (${teams.join(", ")})`);
    for (const team of teams) {
      const box = zvanjaFor.getByRole("radio", {name: new RegExp(`^${escape(team)}: zvanja \\d+$`)});
      await box.click();
      await expect(box).toBeChecked();
      const buttons = page.getByRole("group", {name: `Zvanja: ${team}`});
      await buttons.getByRole("button", {name: "Obriši zvanja"}).click();
      const list = hand.zvanja[team] ?? [];
      // a tournament "bez zvanja" names its only button "Zvanje bela 20"
      for (const z of list) await buttons.getByRole("button", {name: new RegExp(`^Zvanje (bela )?${z}(,|$)`)}).click();
      await expect(box).toHaveAccessibleName(`${team}: zvanja ${list.reduce((s, z) => s + z, 0)}`);
    }
  }
  // "Nema zvanja" (the admin's) or "Nema Zvanja" (the players') when nobody has any
  await page.getByRole("button", {name: /^(Dalje|Nema zvanja)$/i}).click();

  // 3 · Igra: the keypad types the picked team's game points
  const keypad = page.getByRole("group", {name: "Bodovi igre"});
  await expect(keypad).toBeVisible();
  const points = hand.points;
  if (points) {
    const team = "stiglja" in points ? points.stiglja : points.team;
    const box = page.getByRole("radiogroup", {name: "Igra: upis za ekipu"}).getByRole("radio", {name: new RegExp(`^${escape(team)}: igra \\d+$`)});
    // Obriši bodove first: a saved Štiglja switches the digits off
    await keypad.getByRole("button", {name: "Obriši bodove"}).click();
    await box.click();
    await expect(box).toBeChecked();
    if ("stiglja" in points) await keypad.getByRole("button", {name: "Štiglja"}).click();
    else for (const d of String(points.game)) await keypad.getByRole("button", {name: d, exact: true}).click();
    await expect(box).toHaveAccessibleName(`${team}: igra ${"stiglja" in points ? 252 : points.game}`);
  }
}

// Spremi on the last step; resolves once the steps are gone (back on the board)
// A save the app refuses keeps the step open with its reason (an error note: "Igra nije spremljena.", "Meč je već
// završen, …") or asks first (the sheet "Je li ovo nova igra?"): the failure then quotes it instead of only timing out.
export async function saveHand(page: Page) {
  const keypad = page.getByRole("group", {name: "Bodovi igre"});
  const refusal = page.getByRole("main").getByRole("alert").or(page.getByRole("dialog"));
  await page.getByRole("button", {name: "Spremi", exact: true}).click();
  await expect
    .poll(async () => ((await refusal.count()) > 0 ? `not saved: ${(await refusal.first().innerText()).trim()}` : (await keypad.count()) > 0 ? "saving" : "saved"), {
      message: "Spremi should save the hand and go back to the board",
    })
    .toBe("saved");
}

// the two team names of a step's boxes ("Purgeri: zvanja 20" → "Purgeri")
async function teamsOf(boxes: Locator, label: string): Promise<string[]> {
  const names = await boxes.getByRole("radio").evaluateAll((els) => els.map((e) => e.getAttribute("aria-label") ?? ""));
  return names.map((n) => n.replace(new RegExp(`: ${label} \\d+$`), ""));
}

// ---------- setup through the app's routes ----------

export type Table = {roundId: number; roundNumber: number; team1: {id: number; name: string}; team2: {id: number; name: string}};

// A hand as a phone sends it (the server recomputes its totals and whether the caller passed). Sides are absolute: 1 is
// the round's team1. Either game1, team1's game points (team2 gets the rest of 162), or stiglja, the side that took
// every trick (252 : 0).
export type ApiHand = {caller: 1 | 2; zvanja?: {team: 1 | 2; value: Zvanje}[]} & ({game1: number} | {stiglja: 1 | 2});

const ANNOUNCEMENT = {20: "TWENTY", 50: "FIFTY", 100: "ONE_HUNDRED", 150: "ONE_HUNDRED_FIFTY", 200: "TWO_HUNDRED"} as const;

// A new Kolo of tonight with one table for these two teams, made as the admin makes it (Novo kolo's pairing, Odobri
// sva, Objavi); the next Kolo number of the night, so the league's other tables stay as they are. Novo kolo refuses
// while the night has a Skica waiting (the current league has one), so it never publishes a draft it didn't make.
// The pairing decides which team is team1. Remove it afterwards with removeKolo(…, table.roundNumber).
export async function publishTable(admin: APIRequestContext, db: Db, leagueId: number, night: string, teams: [number, number]): Promise<Table> {
  const created = await admin.post("/api/rounds/generate-multiple", {
    data: {league_id: leagueId, present_teams: teams, numberOfRounds: 1, windowSize: 2, allowRepeats: true},
  });
  expect(created.status(), `Novo kolo: ${await created.text()}`).toBe(201);
  const approved = await admin.post(`/api/leagues/${leagueId}/nights/${night}/approve`);
  expect(approved.ok(), `Odobri sva: ${await approved.text()}`).toBeTruthy();
  const published = await admin.post(`/api/leagues/${leagueId}/nights/${night}/publish`);
  expect(published.ok(), `Objavi: ${await published.text()}`).toBeTruthy();
  const {rounds} = (await published.json()) as {rounds: number[]};
  expect(rounds, "Objavi published more than the new Kolo").toHaveLength(1);
  const round = await db.round.findFirstOrThrow({
    where: {leagueRounds: {some: {league_id: leagueId}}, round_date: new Date(night), round_number: rounds[0]},
    include: {team1: true, team2: true},
  });
  return {
    roundId: round.id,
    roundNumber: round.round_number!,
    team1: {id: round.team1_id, name: round.team1.team_name},
    team2: {id: round.team2_id, name: round.team2.team_name},
  };
}

// Tko igra with the suggested players, then the first match (Potvrdi i počni). Returns the open match's id.
export async function startMatch(api: APIRequestContext, roundId: number): Promise<number> {
  const lineup = await api.get(`/api/rounds/${roundId}/lineup`);
  expect(lineup.ok(), `lineup: ${await lineup.text()}`).toBeTruthy();
  const {teams} = (await lineup.json()) as {teams: {id: number; selected: number[]}[]};
  const saved = await api.put(`/api/rounds/${roundId}/lineup`, {data: {teams: teams.map((t) => ({team_id: t.id, player_ids: t.selected}))}});
  expect(saved.ok(), `lineup: ${await saved.text()}`).toBeTruthy();
  const match = await api.post("/api/ongoing-matches", {data: {round_id: roundId, score_threshold: 1001}});
  expect(match.ok(), `match: ${await match.text()}`).toBeTruthy();
  return ((await match.json()) as {id: number}).id;
}

// Hands saved as another phone at the table saves them
export async function addHands(api: APIRequestContext, matchId: number, hands: ApiHand[]) {
  for (const h of hands) {
    const [game1, game2] = "stiglja" in h ? (h.stiglja === 1 ? [252, 0] : [0, 252]) : [h.game1, 162 - h.game1];
    const zvanja = h.zvanja ?? [];
    const sum = (team: 1 | 2) => zvanja.filter((z) => z.team === team).reduce((s, z) => s + z.value, 0);
    const res = await api.post("/api/ongoing-bela-result", {
      data: {
        match_id: matchId,
        player_pair1_game_points: game1,
        player_pair2_game_points: game2,
        player_pair1_announcement_points: sum(1),
        player_pair2_announcement_points: sum(2),
        // the server recomputes these
        player_pair1_total_points: 0,
        player_pair2_total_points: 0,
        trump_caller_team: h.caller,
        pass: true,
        complete_victory: "stiglja" in h,
        announcements: zvanja.map((z) => ({team: z.team, announcement_type: ANNOUNCEMENT[z.value]})),
      },
    });
    expect(res.ok(), `hand: ${await res.text()}`).toBeTruthy();
  }
}

// The scenario tables' open matches were started when the world was seeded, and Vrijeme partije (35 min) closes a
// match on the first read after its deadline (its scorepad, /api/cron/tick). A test on one gives it a fresh clock
// first, as if it had just started: call it before any page or request reads the match.
export async function freshClock(db: Db, matchId: number, minutes = 35) {
  const now = new Date();
  const {count} = await db.ongoingMatch.updateMany({where: {id: matchId}, data: {started_at: now, ends_at: new Date(now.getTime() + minutes * 60_000)}});
  if (count !== 1) throw new Error(`match ${matchId} is no longer open (closed by time or finished before this test): reseed with e2e/local/app.sh`);
}

// A saved hand as the scorepad loads it, to put back with putHand after a test changed it
export type SavedHand = {
  match_id: number;
  player_pair1_game_points: number;
  player_pair2_game_points: number;
  player_pair1_announcement_points: number;
  player_pair2_announcement_points: number;
  player_pair1_total_points: number;
  player_pair2_total_points: number;
  trump_caller_team: 1 | 2 | null;
  pass: boolean;
  complete_victory: boolean;
  belaPlayerAnnouncements?: {team: 1 | 2; announcement_type: string}[] | null;
};

export async function savedHand(api: APIRequestContext, resultId: number): Promise<SavedHand> {
  const res = await api.get(`/api/ongoing-bela-result/${resultId}`);
  expect(res.ok(), `hand ${resultId}: ${await res.text()}`).toBeTruthy();
  return (await res.json()) as SavedHand;
}

// Saves the hand as it was (the server moves the match score by the difference), as a phone's correction does
export async function putHand(api: APIRequestContext, resultId: number, hand: SavedHand) {
  const {belaPlayerAnnouncements, ...fields} = hand;
  const res = await api.put(`/api/ongoing-bela-result/${resultId}`, {
    data: {...fields, announcements: (belaPlayerAnnouncements ?? []).map((a) => ({team: a.team, announcement_type: a.announcement_type}))},
  });
  expect(res.ok(), `put back hand ${resultId}: ${await res.text()}`).toBeTruthy();
}

// Removes one Kolo of the night (every table of it, with what was played there), as the admin's Kola tab does: the
// server recounts the standings and replays the ratings, so the world is as it was before the Kolo
export async function removeKolo(admin: APIRequestContext, leagueId: number, night: string, roundNumber: number) {
  const res = await admin.delete(`/api/admin/leagues/${leagueId}/rounds?date=${night}&round_number=${roundNumber}`);
  expect(res.ok(), `delete Kolo ${roundNumber}: ${await res.text()}`).toBeTruthy();
}

// Removes EVERY Kolo of the league's night, drafts too. Only for a league whose night belongs to the test alone (C1's
// leagues.newRound): on leagues.scorepad or the current league it would wipe the seeded tables (tables.correction,
// tables.twoPhones …) for the rest of the run. Elsewhere use removeKolo with the Kolo the test made.
export async function removeNight(admin: APIRequestContext, leagueId: number, night: string) {
  const list = await admin.get(`/api/admin/leagues/${leagueId}/rounds`);
  expect(list.ok(), `rounds: ${await list.text()}`).toBeTruthy();
  const rounds = (await list.json()) as {date: string; roundNumber: number}[];
  for (const r of rounds.filter((r) => r.date === night)) await removeKolo(admin, leagueId, night, r.roundNumber);
}
