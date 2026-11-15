// C2's own setup: the seeded table tables.twoPhones (league "E2E · Scorepad", the first match in play with 2 hands)
// and two phones of its team1, each in its own browser context, both on the match's board. The match is used as it was
// seeded (it has no Vrijeme partije, so nothing closes it by time); afterwards every hand the test added is deleted the
// way the admin deletes one (the server takes it off the score), and the seeded hands are saved back as they were.
import {expect, type Page} from "@playwright/test";
import {test as base} from "./fixtures";
import {handRows, putHand, savedHand} from "./scorepad";

export type TwoPhones = {
  matchId: number;
  // the team names as the boards show them: both phones are team1's, so team1 is on the left of both
  team1: string;
  team2: string;
  // the seeded hands, oldest first, by absolute side (1 = the round's team1)
  seeded: {id: number; total1: number; total2: number}[];
  // the two phones of team1's players at the table (the round's lineup), each on the board with the seeded hands
  phones: [Page, Page];
};

export const test = base.extend<{twoPhones: TwoPhones}>({
  twoPhones: async ({api, as, db, world}, use) => {
    const table = world.tables.twoPhones;
    const matchId = table.matchId!;
    const admin = await api("admin");
    const round = await db.round.findUniqueOrThrow({where: {id: table.roundId}, include: {team1: true, team2: true}});
    const rows = await db.ongoingBelaResult.findMany({where: {match_id: matchId}, orderBy: {result_id: "asc"}});
    if (rows.length !== 2) throw new Error(`tables.twoPhones should hold 2 hands, it has ${rows.length}: reseed with e2e/local/app.sh`);
    const saved = await Promise.all(rows.map((r) => savedHand(admin, r.result_id)));
    const lineup = await db.roundPlayer.findMany({where: {round_id: table.roundId, team_id: round.team1_id}, include: {player: true}, orderBy: {player_id: "asc"}});
    expect(lineup.map((p) => p.player.username).sort(), "team1's lineup is the catalog's team1").toEqual([...table.team1].sort());

    const phones = [await as(lineup[0].player.username), await as(lineup[1].player.username)] as [Page, Page];
    for (const phone of phones) {
      await phone.goto(`/ongoing-match/${matchId}`);
      await expect(handRows(phone)).toHaveCount(2);
    }
    await use({
      matchId,
      team1: round.team1.team_name,
      team2: round.team2.team_name,
      seeded: rows.map((r) => ({id: r.result_id, total1: r.player_pair1_total_points, total2: r.player_pair2_total_points})),
      phones,
    });

    const seededIds = new Set(rows.map((r) => r.result_id));
    for (const added of await db.ongoingBelaResult.findMany({where: {match_id: matchId, result_id: {notIn: [...seededIds]}}})) {
      const res = await admin.delete(`/api/admin/hands/ongoing/${added.result_id}`);
      expect(res.ok(), `delete hand ${added.result_id}: ${await res.text()}`).toBeTruthy();
    }
    for (const [i, r] of rows.entries()) await putHand(admin, r.result_id, saved[i]);
  },
});

export {expect} from "./fixtures";

// Upiši igru on the board, without filling anything: the entry remembers how many hands the board showed
export async function openNewHand(page: Page) {
  await page.getByRole("button", {name: "Upiši igru", exact: true}).click();
  await expect(page.getByRole("heading", {name: "Izaberi tko je zvao"})).toBeVisible();
}

// The question a phone gets when another phone saved a hand while it was entering its own
export const sameHandQuestion = (page: Page) => page.getByRole("dialog", {name: "Je li ovo nova igra?"});
