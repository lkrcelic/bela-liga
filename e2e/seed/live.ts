// Playing a table now, through the app's own services, exactly as the phones do it: Tko igra (saveLineup), the first
// match (createOngoingMatch), each hand (createBelaResult, which normalizes and validates it), Završi meč
// (finishOngoingMatch, which closes the table, updates the standings and replays the ratings).
import {matchWinner} from "@/app/_lib/bela/scoring";
import {createBelaResult} from "@/app/_lib/service/ongoingBelaResult/create";
import {createOngoingMatch} from "@/app/_lib/service/ongoingMatch/create";
import {finishOngoingMatch} from "@/app/_lib/service/match/finishOngoingMatch";
import {saveLineup} from "@/app/_lib/service/round/lineup";
import {afterTableClosed} from "@/app/_lib/service/tournament/kola";
import type {Ctx} from "./context";
import {type Hand, lineups, makeHand} from "./play";
import type {Rng} from "./rng";

export type LivePlan = {
  // matches played to the end and closed with Završi meč (a league table has 2, a tournament table 1 or 2)
  finished: number;
  // hands entered in the match after them (0 = the next match is open but empty)
  handsInOpenMatch?: number;
  // play the open match until a team passes 1001 but leave Završi meč to the test
  toThreshold?: boolean;
  // no lineup and no match: the table waits for Tko igra
  untouched?: boolean;
};

export type LiveTable = {roundId: number; openMatchId: number | null; closed: boolean};

function request(matchId: number, hand: Hand) {
  return {
    match_id: matchId,
    player_pair1_game_points: hand.gp1,
    player_pair2_game_points: hand.gp2,
    player_pair1_announcement_points: hand.ap1,
    player_pair2_announcement_points: hand.ap2,
    player_pair1_total_points: hand.tp1,
    player_pair2_total_points: hand.tp2,
    trump_caller_team: hand.caller,
    pass: hand.pass,
    complete_victory: hand.completeVictory,
    announcements: hand.announcements.map((a) => ({team: a.team, announcement_type: a.type})),
  };
}

export async function playLiveTable(
  ctx: Ctx,
  rng: Rng,
  table: {roundId: number; team1: number; team2: number; matchesPerRound: number; declarations: boolean; edge: number},
  rosters: Map<number, number[]>,
  plan: LivePlan,
): Promise<LiveTable> {
  if (plan.untouched) return {roundId: table.roundId, openMatchId: null, closed: false};
  const [players1, players2] = lineups(rng, rosters.get(table.team1) ?? [], rosters.get(table.team2) ?? []);
  await saveLineup(table.roundId, {
    teams: [
      {team_id: table.team1, player_ids: players1},
      {team_id: table.team2, player_ids: players2},
    ],
  });
  let matchId: number | null = (await createOngoingMatch({round_id: table.roundId, score_threshold: 1001})).id;

  const playHands = async (limit: number, stopBeforeWinner: boolean) => {
    let s1 = 0;
    let s2 = 0;
    for (let n = 0; n < limit; n++) {
      let hand = makeHand(rng, table.edge, table.declarations);
      // an open match stops short of 1001 unless the plan wants it at the threshold
      for (let tries = 0; stopBeforeWinner && matchWinner(s1 + hand.tp1, s2 + hand.tp2, 1001) !== null && tries < 20; tries++) {
        hand = makeHand(rng, table.edge, table.declarations);
      }
      if (stopBeforeWinner && matchWinner(s1 + hand.tp1, s2 + hand.tp2, 1001) !== null) return;
      await createBelaResult(request(matchId!, hand));
      s1 += hand.tp1;
      s2 += hand.tp2;
      if (matchWinner(s1, s2, 1001) !== null) return;
    }
  };

  for (let m = 0; m < plan.finished; m++) {
    await playHands(60, false);
    const outcome = await finishOngoingMatch(matchId!);
    matchId = outcome.nextOngoingMatchId ?? null;
    if (outcome.roundFinished) {
      await afterTableClosed(outcome.roundId);
      return {roundId: table.roundId, openMatchId: null, closed: true};
    }
  }
  if (plan.toThreshold) await playHands(60, false);
  else if (plan.handsInOpenMatch) await playHands(plan.handsInOpenMatch, true);
  return {roundId: table.roundId, openMatchId: matchId, closed: false};
}

// usernames of a team's players, for the catalog (the tests log in as them)
export async function usernames(ctx: Ctx, rosters: Map<number, number[]>, teamId: number): Promise<string[]> {
  const ids = rosters.get(teamId) ?? [];
  const rows = await ctx.prisma.player.findMany({where: {id: {in: ids}, active: true}, select: {username: true}});
  return rows.map((r) => r.username);
}
