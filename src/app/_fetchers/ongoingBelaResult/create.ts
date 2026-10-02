import {responseErrorMessage} from "@/app/_fetchers/errorMessage";
import {BelaResultResponse} from "@/app/_interfaces/belaResult";

type CreateOngoingBelaResultAPIProps = {
    result: unknown;
}

export async function createOngoingBelaResultAPI({result}: CreateOngoingBelaResultAPIProps): Promise<BelaResultResponse> {
    const response = await fetch(`/api/ongoing-bela-result`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({...result}),
    });

    if (!response.ok) {
        throw new Error(await responseErrorMessage(response, "Failed to save the hand"));
    }

    return response.json();
}