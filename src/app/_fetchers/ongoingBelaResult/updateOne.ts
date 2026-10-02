import {responseErrorMessage} from "@/app/_fetchers/errorMessage";
import {BelaResultResponse} from "@/app/_interfaces/belaResult";

type UpdateOngoingBelaResultAPIProps = {
    resultId: string | string[];
    result: unknown;
}

export async function updateOngoingBelaResultAPI({
                                                     resultId,
                                                     result
                                                 }: UpdateOngoingBelaResultAPIProps): Promise<BelaResultResponse> {
    const response = await fetch(`/api/ongoing-bela-result/${resultId}`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({...result}),
    });

    if (!response.ok) {
        throw new Error(await responseErrorMessage(response, "Failed to update the hand"));
    }

    return response.json();
}