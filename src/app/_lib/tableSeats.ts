import {isByeTeam} from "@/app/_lib/bye";
import {roundName} from "@/app/_lib/roundStatus";

// Re-pairing a table of a round (Dnevni poredak's and Skica's Uredi stolove): who sits where afterwards. The server
// seats the teams by it, and the pair dialog tells the admin from it what else changes. Framework free so it can be
// unit tested.

// The seats of a round after `tableId` gets `wanted` (team1, team2). A team taken from another table leaves its seat
// there to a team leaving this one, so every team keeps playing once; a team leaving with nobody to take its place
// doesn't play the round. The bye is no team: several tables can have it, so picking it takes nobody from another
// table. Returns a new map; the input is not changed.
export function planSeats(seats: Map<number, [number, number]>, tableId: number, wanted: [number, number]): Map<number, [number, number]> {
  const out = new Map(Array.from(seats, ([id, pair]) => [id, [pair[0], pair[1]] as [number, number]]));
  const old = out.get(tableId)!;
  const leaving = old.filter((id) => !wanted.includes(id));
  for (const team of wanted) {
    if (old.includes(team) || isByeTeam(team)) continue;
    for (const [id, pair] of Array.from(out)) {
      if (id === tableId) continue;
      const k = pair.indexOf(team);
      if (k >= 0) {
        // as many teams leave as come, so one is always there
        pair[k] = leaving.shift()!;
        break;
      }
    }
  }
  out.set(tableId, [wanted[0], wanted[1]]);
  return out;
}

type NumberedTable = {team1_id: number; team2_id: number; table_number: number | null};

// The number of a table added to a round (Dodaj stol): the lowest one free, so removing Stol 2 and adding the pair
// back gives Stol 2 again rather than a Stol 7 the hall doesn't have. A number the bye's table holds isn't free, and
// a table with the bye goes after all the others.
export function newTableNumber(tables: NumberedTable[], bye: boolean): number {
  const used = new Set(tables.map((t) => t.table_number ?? 0));
  if (bye) return Math.max(0, ...Array.from(used)) + 1;
  let n = 1;
  while (used.has(n)) n++;
  return n;
}

// A pair that already meets tonight, and where ("Kolo 1, stol 9", "Skica C, stol 2")
export type NightMeeting = {teams: [number, number]; where: string};

type NightRound = {roundNumber: number; letter: string | null; tables: {table: number | null; team1: {id: number}; team2: {id: number}}[]};

// The pairs of the night's rounds other than `roundNumber` (Skica: the published Kola and the other skice), so a
// re-paired table can say it repeats one, as Novo kolo keeps them apart (REPEAT_MATCHUPS). A bye table is no meeting.
export function nightMeetings(rounds: NightRound[], roundNumber: number): NightMeeting[] {
  return rounds
    .filter((r) => r.roundNumber !== roundNumber)
    .flatMap((r) =>
      r.tables
        .filter((t) => !isByeTeam(t.team1.id) && !isByeTeam(t.team2.id))
        .map((t, i): NightMeeting => ({teams: [t.team1.id, t.team2.id], where: `${roundName(r)}, stol ${t.table ?? i + 1}`}))
    );
}

// Where two teams already meet tonight (either order); undefined when they don't, or one of them is the bye
export function meetingOf(meetings: NightMeeting[], x: number, y: number): NightMeeting | undefined {
  if (x === y || isByeTeam(x) || isByeTeam(y)) return undefined;
  return meetings.find(({teams: [a, b]}) => (a === x && b === y) || (a === y && b === x));
}

// The tables of a round whose pair already meets in another round of the night (Skica marks them before Objavi)
export function repeatedTables(rounds: NightRound[], roundNumber: number): {table: number; where: string}[] {
  const round = rounds.find((r) => r.roundNumber === roundNumber);
  if (!round) return [];
  const met = nightMeetings(rounds, roundNumber);
  return round.tables.flatMap((t, i) => {
    const m = meetingOf(met, t.team1.id, t.team2.id);
    return m ? [{table: t.table ?? i + 1, where: m.where}] : [];
  });
}
