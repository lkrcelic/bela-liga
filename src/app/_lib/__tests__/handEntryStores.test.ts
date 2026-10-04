import "./helpers/memoryStorage";
import assert from "node:assert/strict";
import {beforeEach, test} from "node:test";
import {BelaPlayerAnnouncementResponse, BelaPlayerAnnouncementsRequest} from "@/app/_interfaces/belaPlayerAnnouncement";
import {BelaResultResponse} from "@/app/_interfaces/belaResult";
import useAnnouncementStore from "@/app/_store/bela/announcementStore";
import useResultStore from "@/app/_store/bela/resultStore";
import {resetHand} from "./helpers/handEntry";

// The keypad and zvanja logic behind the scoreboard's hand entry (phone wizard and desktop panel)

const result = () => useResultStore.getState();
const announcements = () => useAnnouncementStore.getState();
const gamePoints = () => [result().resultData.player_pair1_game_points, result().resultData.player_pair2_game_points];
const type = (digits: string) => {
  for (const d of digits) result().setGamePoints(Number(d));
};

beforeEach(resetHand);

test("typing points for one team fills in the other team's half of 162", () => {
  result().setActiveTeam("team1");
  type("92");
  assert.deepEqual(gamePoints(), [92, 70]);

  result().setActiveTeam("team2");
  type("100");
  assert.deepEqual(gamePoints(), [62, 100]);
});

test("a digit that would go over 162 is ignored", () => {
  result().setActiveTeam("team1");
  type("16");
  type("3"); // 163
  assert.deepEqual(gamePoints(), [16, 146]);
  type("2"); // 162
  assert.deepEqual(gamePoints(), [162, 0]);
});

test("after switching team the next digit starts a new number", () => {
  result().setActiveTeam("team1");
  type("92");
  result().setActiveTeam("team2");
  type("5");
  assert.deepEqual(gamePoints(), [157, 5]);
});

test("a saved hand opened for editing is replaced by the first digit, not appended to", () => {
  result().setResultData({
    ...result().resultData,
    player_pair1_game_points: 92,
    player_pair2_game_points: 70,
    trump_caller_team: 1,
    result_id: 7,
  });
  type("8");
  assert.deepEqual(gamePoints(), [8, 154]);
});

test("Štiglja gives the active team 252 to 0 and needs a trump caller first", () => {
  result().setActiveTeam("team2");
  assert.throws(() => result().setCompleteVictory(), /Trump caller/);

  result().setTrumpCallerTeam(1);
  result().setCompleteVictory();
  assert.equal(result().resultData.complete_victory, true);
  assert.deepEqual(gamePoints(), [0, 252]);
});

test("clearing the points keeps the announcements and drops Štiglja", () => {
  result().setTrumpCallerTeam(1);
  announcements().setAnnouncement(1, 50);
  result().updateAnnouncementPoints(announcements().teamsAnnouncements);
  result().setActiveTeam("team1");
  result().setCompleteVictory();

  result().resetScore();
  const r = result().resultData;
  assert.deepEqual(gamePoints(), [0, 0]);
  assert.equal(r.complete_victory, false);
  assert.equal(r.player_pair1_total_points, 50);
  assert.equal(r.player_pair2_total_points, 0);
});

test("totals can't be computed before the trump caller is chosen", () => {
  result().setActiveTeam("team1");
  type("92");
  assert.throws(() => result().setTotalPoints(), /Trump caller/);
});

test("totals follow the rules: the caller falls when not ahead", () => {
  result().setTrumpCallerTeam(2);
  result().setActiveTeam("team1");
  type("81"); // 81 : 81, team 2 called
  result().setTotalPoints();
  const r = result().resultData;
  assert.deepEqual([r.player_pair1_total_points, r.player_pair2_total_points, r.pass], [162, 0, false]);
});

test("zvanja add up per team and by type", () => {
  announcements().setAnnouncement(1, 20);
  announcements().setAnnouncement(1, 20);
  announcements().setAnnouncement(1, 50);
  announcements().setAnnouncement(2, 100);
  const t = announcements().teamsAnnouncements;
  assert.equal(t[1].totalAnnouncements, 90);
  assert.deepEqual(t[1].announcementCounts, {20: 2, 50: 1});
  assert.equal(t[2].totalAnnouncements, 100);
  assert.equal(announcements().noAnnouncements, false);
});

test("a team can't announce more cards than its two players hold (16)", () => {
  // 20 uses 3 cards, every other announcement 4
  announcements().setAnnouncement(1, 100); // 4
  announcements().setAnnouncement(1, 100); // 8
  announcements().setAnnouncement(1, 50); // 12
  announcements().setAnnouncement(1, 20); // 15
  announcements().setAnnouncement(1, 50); // would be 19: ignored
  announcements().setAnnouncement(1, 20); // would be 18: ignored
  const team1 = announcements().teamsAnnouncements[1];
  assert.equal(team1.cardCount, 15);
  assert.equal(team1.totalAnnouncements, 270);
});

test("clearing one team's zvanja leaves the other team's", () => {
  announcements().setAnnouncement(1, 50);
  announcements().setAnnouncement(2, 20);
  announcements().resetTeamAnnouncements(1);
  assert.equal(announcements().teamsAnnouncements[1].totalAnnouncements, 0);
  assert.equal(announcements().teamsAnnouncements[2].totalAnnouncements, 20);
  announcements().resetTeamAnnouncements(2);
  assert.equal(announcements().noAnnouncements, true);
});

test("a saved hand's zvanja load back into the counters", () => {
  announcements().setTeamsAnnouncements([
    {team: 1, announcement_type: "FIFTY"},
    {team: 1, announcement_type: "TWENTY"},
    {team: 2, announcement_type: "TWO_HUNDRED"},
  ] as BelaPlayerAnnouncementResponse[]);
  const t = announcements().teamsAnnouncements;
  assert.deepEqual(t[1].announcementCounts, {20: 1, 50: 1});
  assert.equal(t[1].cardCount, 7);
  assert.equal(t[2].totalAnnouncements, 200);
});

test("the zvanja become the request's announcement list and announcement points", () => {
  announcements().setAnnouncement(1, 20);
  announcements().setAnnouncement(1, 20);
  announcements().setAnnouncement(2, 150);
  result().updateAnnouncementPoints(announcements().teamsAnnouncements);
  const r = result().resultData as BelaResultResponse & {announcements?: BelaPlayerAnnouncementsRequest[]};
  assert.equal(r.player_pair1_announcement_points, 40);
  assert.equal(r.player_pair2_announcement_points, 150);
  assert.deepEqual(r.announcements, [
    {team: 1, announcement_type: "TWENTY"},
    {team: 1, announcement_type: "TWENTY"},
    {team: 2, announcement_type: "ONE_HUNDRED_FIFTY"},
  ]);
});
