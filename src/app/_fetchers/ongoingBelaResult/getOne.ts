import {apiFetch, responseErrorMessage} from "@/app/_fetchers/errorMessage";
import {BelaResultResponse} from "@/app/_interfaces/belaResult";

export async function getOngoingBelaResultAPI(resultId: number): Promise<BelaResultResponse> {
    const response = await apiFetch(`/api/ongoing-bela-result/${resultId}`);

    if (!response.ok) {
        throw new Error(await responseErrorMessage(response, "Igra se nije učitala."));
    }

    return response.json();
}