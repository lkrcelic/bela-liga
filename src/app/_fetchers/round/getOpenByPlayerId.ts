import {responseErrorMessage} from "@/app/_fetchers/errorMessage";

export async function getOpenRoundByPlayerIdAPI(): Promise<{roundId: number, ongoingMatchId: number | null}> {
  const response = await fetch(`/api/rounds/open`);

  if (!response.ok) {
    throw new Error(await responseErrorMessage(response, "Failed to fetch round"));
  }

  return response.json();
}
