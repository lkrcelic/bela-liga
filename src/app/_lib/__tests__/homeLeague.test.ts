// Početna's Dnevni poredak, Ukupni poredak and Sponzori lige open the player's own league, not the one played now (#29)
import {describe, it} from "node:test";
import assert from "node:assert/strict";
import type {MyLeague, MySchedule} from "@/app/_interfaces/burza";
import {homeLeagueId, ownLeagueId} from "@/app/_lib/league";

// league 3 is played now (the latest published round); the player's team plays in league 2
const leagues = [
  {id: 2, active: false},
  {id: 3, active: true},
];

describe("homeLeagueId", () => {
  it("nothing picked: the league of the player's next night, not the one played now", () => {
    assert.equal(homeLeagueId(null, leagues, 2), 2);
  });

  it("a league picked in a league picker wins over the player's own", () => {
    assert.equal(homeLeagueId(3, leagues, 2), 3);
  });

  it("a picked league that no longer exists is ignored", () => {
    assert.equal(homeLeagueId(9, leagues, 2), 2);
  });

  it("a player with no night ahead gets the league played now", () => {
    assert.equal(homeLeagueId(null, leagues, null), 3);
  });

  it("still loading while the player's schedule loads, so no tile flashes another league", () => {
    assert.equal(homeLeagueId(null, leagues, undefined), undefined);
  });

  it("still loading while the leagues load; null when there are no leagues", () => {
    assert.equal(homeLeagueId(null, undefined, 2), undefined);
    assert.equal(homeLeagueId(null, [], null), null);
  });
});

// only the fields the next night is chosen by; the rest of a MyLeague doesn't matter here
const myLeague = (league_id: number, nights: string[], active = true) => ({league_id, nights, active}) as unknown as MyLeague;

describe("ownLeagueId", () => {
  it("the league of the player's next night", () => {
    const schedule: MySchedule = {today: "2026-11-17", leagues: [myLeague(2, ["2026-11-10", "2026-11-24"])]};
    assert.equal(ownLeagueId(schedule, null), 2);
  });

  it("on Početna the tiles follow the player's league 2 while league 3 is played now (#29)", () => {
    const schedule: MySchedule = {today: "2026-11-17", leagues: [myLeague(2, ["2026-11-24"])]};
    assert.equal(homeLeagueId(null, leagues, ownLeagueId(schedule, null)), 2);
  });

  it("the soonest night of a league where the team is active, before one where it is inactive", () => {
    const schedule: MySchedule = {
      today: "2026-11-17",
      leagues: [myLeague(4, ["2026-11-18"], false), myLeague(2, ["2026-11-24"])],
    };
    assert.equal(ownLeagueId(schedule, null), 2);
  });

  it("no night ahead: null, so the league played now is used", () => {
    const schedule: MySchedule = {today: "2026-11-17", leagues: [myLeague(2, ["2026-11-10"])]};
    assert.equal(ownLeagueId(schedule, null), null);
    assert.equal(homeLeagueId(null, leagues, ownLeagueId(schedule, null)), 3);
  });

  it("undefined while the schedule loads, null when it failed", () => {
    assert.equal(ownLeagueId(null, null), undefined);
    assert.equal(ownLeagueId(null, "Greška"), null);
  });
});
