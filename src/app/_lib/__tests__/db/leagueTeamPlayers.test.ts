import assert from "node:assert/strict";
import {after, before, test} from "node:test";
import {prisma} from "@/app/_lib/prisma";
import {listLeagueTeams} from "@/app/_lib/service/league/leagues";

// #41: the league's teams (Novo kolo, Upravljanje ligom · Ekipe) say how many of their players are active, so a team
// left with one player after a teammate is deactivated or taken off the team is marked before the night. Run with
// `npm run test:db` on a throwaway database with the migrations applied (it adds its own league, teams and players and
// removes them afterwards).

const tag = `ltp${Date.now()}`;
let leagueId: number;
const teams: Record<string, number> = {};
const players: number[] = [];

async function player(name: string, active = true): Promise<number> {
  const p = await prisma.player.create({
    data: {username: `${tag}${name}`.toLowerCase(), email: `${tag}${name}@example.com`.toLowerCase(), password_hash: "x", player_role: "PLAYER", first_name: name, last_name: tag, active},
  });
  players.push(p.id);
  return p.id;
}

before(async () => {
  leagueId = (await prisma.league.create({data: {league_name: `${tag} liga`}})).league_id;
  // Puna: two active players; Jedan: one of its two deactivated; Prazna: its only player deactivated; Tri: three
  const rosters: Record<string, [string, boolean][]> = {
    Puna: [["p1", true], ["p2", true]],
    Jedan: [["j1", true], ["j2", false]],
    Prazna: [["x1", false]],
    Tri: [["t1", true], ["t2", true], ["t3", true]],
  };
  for (const [name, roster] of Object.entries(rosters)) {
    const ids = [];
    for (const [p, active] of roster) ids.push(await player(p, active));
    const team = await prisma.team.create({data: {team_name: `${tag} ${name}`, teamPlayers: {create: ids.map((player_id) => ({player_id}))}}});
    teams[name] = team.team_id;
    await prisma.leagueTeam.create({data: {league_id: leagueId, team_id: team.team_id}});
  }
});

after(async () => {
  await prisma.league.delete({where: {league_id: leagueId}});
  await prisma.teamPlayer.deleteMany({where: {team_id: {in: Object.values(teams)}}});
  await prisma.team.deleteMany({where: {team_id: {in: Object.values(teams)}}});
  await prisma.player.deleteMany({where: {id: {in: players}}});
  await prisma.$disconnect();
});

const counts = async () => Object.fromEntries((await listLeagueTeams(leagueId)).map((t) => [t.team_name.slice(tag.length + 1), [t.players.length, t.active_players]]));

test("each league team counts its active players beside its whole roster", async () => {
  assert.deepEqual(await counts(), {Jedan: [2, 1], Prazna: [1, 0], Puna: [2, 2], Tri: [3, 3]});
});

test("a teammate deactivated or taken off the team leaves the team with one active player", async () => {
  const [p1, p2] = (await prisma.teamPlayer.findMany({where: {team_id: teams.Puna}, orderBy: {player_id: "asc"}})).map((tp) => tp.player_id);
  await prisma.player.update({where: {id: p2}, data: {active: false}});
  await prisma.teamPlayer.deleteMany({where: {team_id: teams.Tri, player_id: players[players.length - 1]}});
  const now = await counts();
  assert.deepEqual(now.Puna, [2, 1]);
  assert.deepEqual(now.Tri, [2, 2]);
  await prisma.player.update({where: {id: p1}, data: {active: false}});
  assert.deepEqual((await counts()).Puna, [2, 0]);
});
