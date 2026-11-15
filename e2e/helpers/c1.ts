// C1's own setup: the league "E2E · Novo kolo" (leagues.newRound: 8 teams, no start time, so no Tu smo) with tonight
// empty before and after each test, so every test builds its own Kolo and --repeat-each never meets the last one's.
import type {APIRequestContext} from "@playwright/test";
import {ONBOARDED, type Db} from "./db";
import {test as base} from "./fixtures";
import {removeNight} from "./scorepad";

export type Night = {
  league: {id: number; name: string};
  night: string;
  // the admin's request context, for setup through the app's routes
  admin: APIRequestContext;
};

export const test = base.extend<{night: Night}>({
  night: async ({api, db, world}, use) => {
    const {id, name, tonight} = world.leagues.newRound;
    const admin = await api("admin");
    // Novo kolo remembers the admin's choices for tonight (Broj kola, who sits out) on the server
    const clear = async () => {
      await removeNight(admin, id, tonight!);
      await db.createRoundDraft.deleteMany({where: {league_id: id}});
    };
    await clear();
    await use({league: {id, name}, night: tonight!, admin});
    await clear();
  },
});

export {expect} from "./fixtures";

export type Side = {id: number; name: string; players: {id: number; username: string}[]};

// Two teams of the league for a table, each with exactly two active players (so Tko igra has them picked already):
// `home` has a player who opens Početna without an onboarding sheet (`phone`), `away` is the first other such team.
// In alphabetical order, so every run picks the same.
export async function pickTeams(db: Db, leagueId: number): Promise<{home: Side; away: Side; phone: string}> {
  const teams = await db.team.findMany({
    where: {leagueTeams: {some: {league_id: leagueId}}},
    orderBy: {team_name: "asc"},
    include: {teamPlayers: {include: {player: true}}},
  });
  const sides = teams.map((t) => ({
    id: t.team_id,
    name: t.team_name,
    players: t.teamPlayers.filter((tp) => tp.player.active).map((tp) => ({id: tp.player.id, username: tp.player.username})),
  }));
  const ready = new Set(
    (await db.player.findMany({where: {...ONBOARDED, id: {in: sides.flatMap((s) => s.players.map((p) => p.id))}}, select: {id: true}})).map((p) => p.id),
  );
  const home = sides.find((s) => s.players.length === 2 && s.players.some((p) => ready.has(p.id)));
  const away = sides.find((s) => s !== home && s.players.length === 2);
  if (!home || !away) throw new Error(`league ${leagueId} has no two teams of two players, one with an onboarded player`);
  return {home, away, phone: home.players.find((p) => ready.has(p.id))!.username};
}
