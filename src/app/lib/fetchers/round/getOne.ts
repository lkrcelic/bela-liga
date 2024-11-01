import {RoundType} from "@/app/lib/interfaces/round";

export async function getRoundData(roundId: number): Promise<RoundType> {
    const response = await fetch(`/api/rounds/${roundId}`);
    if (!response.ok) {
        throw new Error(`Failed to fetch team data: ${response.statusText}`);
    }
    return response.json();
}