import assert from "node:assert/strict";
import {after, before, test} from "node:test";
import {prisma} from "@/app/_lib/prisma";
import {leagueNight} from "@/app/_lib/dates";
import {leagueArrivals, myTonight, NO_PLACE_ERROR, teamArrivalAction} from "@/app/_lib/service/league/arrival";

// Tu smo on a night played at two places, against a real Postgres: only a team Podjela put at a place can press it (a
// banned one hears about its ban first), the last Kolo of the night counts at the team's own place against that place's
// Broj kola, and the admin's Novo kolo of a place lists that place's teams. Run with `npm run test:db` and DATABASE_URL on a throwaway database with the migrations applied.

const tag = `ap${Date.now()}`;
const tonight = leagueNight();
let leagueId = 0;
const places: number[] = [];
// A and D at Kartaš (1), B at Lanterna (2), C not placed
const teams: Record<"A" | "B" | "C" | "D", number> = {A: 0, B: 0, C: 0, D: 0};
const players: Record<string, number> = {};
const viewer = (name: keyof typeof teams) => ({id: players[name], player_role: "PLAYER"});

before(async () => {
  for (const name of ["Kartaš", "Lanterna"]) places.push((await prisma.location.create({data: {name: `${tag} ${name}`}})).location_id);
  // "00:00" on tonight's night: the night has started and Tu smo works until 08:00, whenever the test runs
  const league = await prisma.league.create({data: {league_name: `${tag} liga`, location_id: places[0], start_time: "00:00", rounds_per_night: 2}});
  leagueId = league.league_id;
  await prisma.leagueNight.create({data: {league_id: leagueId, night: tonight, second_location_id: places[1]}});
  for (const name of ["A", "B", "C", "D"] as const) {
    const player = await prisma.player.create({data: {username: `${tag}${name}`.toLowerCase(), email: `${tag}${name}@example.com`, password_hash: "x", player_role: "PLAYER", first_name: name, last_name: tag}});
    players[name] = player.id;
    const team = await prisma.team.create({data: {team_name: `${tag} ${name}`, teamPlayers: {create: {player_id: player.id}}}});
    teams[name] = team.team_id;
    await prisma.leagueTeam.create({data: {league_id: leagueId, team_id: team.team_id}});
  }
  await prisma.leagueNightTeam.createMany({
    data: [
      {league_id: leagueId, night: tonight, team_id: teams.A, slot: 1},
      {league_id: leagueId, night: tonight, team_id: teams.D, slot: 1},
      {league_id: leagueId, night: tonight, team_id: teams.B, slot: 2},
    ],
  });
});

after(async () => {
  await prisma.signupBan.deleteMany({where: {team_id: {in: Object.values(teams)}}});
  await prisma.round.deleteMany({where: {leagueRounds: {some: {league_id: leagueId}}}});
  await prisma.leagueArrival.deleteMany({where: {league_id: leagueId}});
  await prisma.league.delete({where: {league_id: leagueId}});
  await prisma.teamPlayer.deleteMany({where: {team_id: {in: Object.values(teams)}}});
  await prisma.team.deleteMany({where: {team_id: {in: Object.values(teams)}}});
  await prisma.player.deleteMany({where: {id: {in: Object.values(players)}}});
  await prisma.location.deleteMany({where: {location_id: {in: places}}});
  await prisma.$disconnect();
});

const entry = (name: keyof typeof teams) => ({league_id: leagueId, team_id: teams[name], start: "00:00"});

test("a team without a place asks the admin; a placed one comes in", async () => {
  await assert.rejects(teamArrivalAction(leagueId, teams.C, viewer("C"), "confirm"), {message: NO_PLACE_ERROR});
  assert.equal(await prisma.leagueArrival.count({where: {league_id: leagueId, team_id: teams.C}}), 0);

  const card = await teamArrivalAction(leagueId, teams.A, viewer("A"), "confirm");
  assert.equal(card.arrival?.here, true);
  assert.deepEqual([card.two_places, card.slot, card.last_round], [true, 1, false]);

  const cards = await myTonight(0, [entry("A"), entry("B"), entry("C")]);
  assert.deepEqual(
    ["A", "B", "C"].map((n) => {
      const c = cards.get(`${leagueId}|${teams[n as "A"]}`);
      return [c?.two_places, c?.slot];
    }),
    [
      [true, 1],
      [true, 2],
      [true, null],
    ]
  );
});

test("a banned team that isn't placed hears about its ban, not about the place", async () => {
  const ban = await prisma.signupBan.create({data: {team_id: teams.C, until: null}});
  await assert.rejects(teamArrivalAction(leagueId, teams.C, viewer("C"), "confirm"), (e: Error) => e.message !== NO_PLACE_ERROR && /zabran/i.test(e.message));
  await prisma.signupBan.delete({where: {id: ban.id}});
  await assert.rejects(teamArrivalAction(leagueId, teams.C, viewer("C"), "confirm"), {message: NO_PLACE_ERROR});
});

test("the last Kolo of the night is counted at the team's own place", async () => {
  // Kartaš publishes both of its Kola (2 per night), Lanterna none yet
  for (const n of [1, 2]) {
    await prisma.round.create({
      data: {team1_id: teams.A, team2_id: teams.D, round_number: n, round_date: tonight, status: "PUBLISHED", published_at: new Date(), location_slot: 1, leagueRounds: {create: {league_id: leagueId}}},
    });
  }
  const cards = await myTonight(0, [entry("A"), entry("B"), entry("D")]);
  assert.equal(cards.get(`${leagueId}|${teams.D}`)?.last_round, true);
  assert.equal(cards.get(`${leagueId}|${teams.B}`)?.last_round, false);
  // D can't jump in at Kartaš any more; B still comes in at Lanterna
  await assert.rejects(teamArrivalAction(leagueId, teams.D, viewer("D"), "confirm"), {message: "Zadnje kolo večeri je već počelo: više se ne može uskočiti."});
  assert.equal((await teamArrivalAction(leagueId, teams.B, viewer("B"), "confirm")).arrival?.here, true);
});

test("Novo kolo of a place lists the teams that are here at that place", async () => {
  const all = await leagueArrivals(leagueId);
  assert.deepEqual(Object.keys(all.teams).map(Number).sort(), [teams.A, teams.B].sort());
  assert.deepEqual(Object.keys((await leagueArrivals(leagueId, new Date(), prisma, 1)).teams).map(Number), [teams.A]);
  assert.deepEqual(Object.keys((await leagueArrivals(leagueId, new Date(), prisma, 2)).teams).map(Number), [teams.B]);
});

test("a team that came and was taken out of the Podjela since asks the admin, and can still leave", async () => {
  await prisma.leagueNightTeam.delete({where: {league_id_night_team_id: {league_id: leagueId, night: tonight, team_id: teams.A}}});
  const card = (await myTonight(0, [entry("A")])).get(`${leagueId}|${teams.A}`);
  assert.deepEqual([card?.slot, card?.arrival?.here], [null, true]);
  const left = await teamArrivalAction(leagueId, teams.A, viewer("A"), "leave");
  assert.equal(left.arrival?.here, false);
});

test("the second place's own Broj kola ends its night on its own count", async () => {
  // Lanterna plays one Kolo tonight, Kartaš the league's two
  await prisma.leagueNight.update({where: {league_id_night: {league_id: leagueId, night: tonight}}, data: {second_rounds_per_night: 1}});
  await prisma.round.create({
    data: {team1_id: teams.B, team2_id: teams.C, round_number: 3, round_date: tonight, status: "PUBLISHED", published_at: new Date(), location_slot: 2, leagueRounds: {create: {league_id: leagueId}}},
  });
  assert.equal((await myTonight(0, [entry("B")])).get(`${leagueId}|${teams.B}`)?.last_round, true);
  // the same as the first place's again: Lanterna's one Kolo of two
  await prisma.leagueNight.update({where: {league_id_night: {league_id: leagueId, night: tonight}}, data: {second_rounds_per_night: null}});
  assert.equal((await myTonight(0, [entry("B")])).get(`${leagueId}|${teams.B}`)?.last_round, false);
});

test("a place whose own Broj kola are played ends its night there; the other place plays on", async () => {
  // Lanterna plays one Kolo tonight and has finished it; Kartaš's Kola are still being played
  await prisma.leagueNight.update({where: {league_id_night: {league_id: leagueId, night: tonight}}, data: {second_rounds_per_night: 1}});
  const atPlace = (slot: number) => ({round_date: tonight, location_slot: slot, leagueRounds: {some: {league_id: leagueId}}});
  await prisma.round.updateMany({where: atPlace(2), data: {open: false}});
  await prisma.round.updateMany({where: atPlace(1), data: {open: true}});
  const cards = await myTonight(0, [entry("B"), entry("D")]);
  assert.equal(cards.has(`${leagueId}|${teams.B}`), false);
  assert.equal(cards.has(`${leagueId}|${teams.D}`), true);
  await assert.rejects(teamArrivalAction(leagueId, teams.B, viewer("B"), "leave"), {message: "Večer je završila."});
});

