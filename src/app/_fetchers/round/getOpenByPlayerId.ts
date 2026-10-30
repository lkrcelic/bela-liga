import {apiFetch, responseErrorMessage} from "@/app/_fetchers/errorMessage";

// Which open table: a league's (Početna · Liga), a tournament's (Početna · Turniri, the tournament page) or any
export type OpenScope = "league" | "tournament" | "any";

// ongoingScore: the running match's points, team1 first (null before a match is started); hasLineup: who plays the
// round is already confirmed; tournamentId: the tournament a tournament's table is in
export async function getOpenRoundByPlayerIdAPI(
  scope: OpenScope = "any"
): Promise<{roundId: number, ongoingMatchId: number | null, hasLineup: boolean, ongoingScore: [number, number] | null, tournamentId: number | null}> {
  const response = await apiFetch(scope === "any" ? `/api/rounds/open` : `/api/rounds/open?scope=${scope}`);

  if (!response.ok) {
    throw new Error(await responseErrorMessage(response, "Otvorena runda se nije učitala."));
  }

  return response.json();
}
