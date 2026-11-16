import type {CandidateTeam} from "@/app/_interfaces/tournament";

// Dodaj ekipu (Upravljanje turnirom): a team the admin just added stays in the search with where it went, so the
// sheet confirms the add in place instead of dropping the row (#30)

// position: its place on the waiting list, null when it is in the tournament
export type Added = {position: number | null};
export type CandidateHit = CandidateTeam & {added?: Added};

type Entries = {entries: {team_id: number}[]; waiting_list: {team_id: number; position: number | null}[]};

// the hits after teamId was added; t is the tournament the add returned
export function markAdded<H extends CandidateHit>(hits: H[] | null, teamId: number, t: Entries): H[] | null {
  if (hits == null) return hits;
  const waiting = t.waiting_list.find((e) => e.team_id === teamId);
  const added: Added = {position: waiting ? (waiting.position ?? t.waiting_list.indexOf(waiting) + 1) : null};
  return hits.map((h) => (h.team_id === teamId ? {...h, added} : h));
}

export function addedLabel(a: Added): string {
  return a.position == null ? "Dodano" : `Na čekanju · ${a.position}.`;
}
