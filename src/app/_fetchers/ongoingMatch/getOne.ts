import {apiFetch, responseErrorMessage} from "@/app/_fetchers/errorMessage";
import {OngoingMatchExtendedResponse} from "@/app/_interfaces/match";

// The match no longer exists: it was finished (possibly on another phone)
export class OngoingMatchGoneError extends Error {}

// The logged-in player doesn't play at this match's table, so the server doesn't send it ("Ne igraš u ovoj rundi.",
// 403): the scorepad says so instead of offering a board and hand steps that can't be saved (#88)
export class NotYourMatchError extends Error {}

export async function getOngoingMatchAPI(matchId: number): Promise<OngoingMatchExtendedResponse> {
  const response = await apiFetch(`/api/ongoing-matches/${matchId}`);

  if (response.status === 404) {
    throw new OngoingMatchGoneError("Ovaj meč je završen.");
  }
  if (response.status === 403) {
    throw new NotYourMatchError(await responseErrorMessage(response, "Ne igraš u ovoj rundi."));
  }
  if (!response.ok) {
    throw new Error(await responseErrorMessage(response, "Meč se nije učitao."));
  }

  return response.json();
}
