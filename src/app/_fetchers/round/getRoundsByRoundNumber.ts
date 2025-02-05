import {RoundMatchup} from "@/app/_lib/service/round/getRoundMatchups";

export async function getRoundsByRoundNumber(roundNumber: number): Promise<RoundMatchup[]> {
  const response = await fetch("api/roundMatchups/" + roundNumber.toString(), {
    method: "GET",
    headers: {"Content-Type": "application/json"},
  });
  if (!response.ok) {
    throw new Error(`Failed to fetch team data: ${response.statusText}`);
  }
  return await response.json();
}
