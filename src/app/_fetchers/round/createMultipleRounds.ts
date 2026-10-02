import {RoundCreateRequest} from "@/app/_interfaces/round";
import {responseErrorMessage} from "@/app/_fetchers/errorMessage";

export async function createMultipleRoundsAPI(
  selectedLeagueId: number,
  teamIds: number[],
  numberOfRounds?: number,
  windowSize?: number,
): Promise<number> {
  const response = await fetch("/api/rounds/generate-multiple", {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({
      league_id: selectedLeagueId,
      present_teams: teamIds,
      numberOfRounds,
      windowSize,
    } as RoundCreateRequest),
  });
  if (!response.ok) {
    throw new Error(await responseErrorMessage(response, "Failed to create rounds"));
  }
  const data = await response.json();
  return data.round_number;
}
