import {BelaResultRequest} from "@/app/interfaces/belaResult";
import {prisma} from "@/app/lib/prisma";
import {transformBelaResult} from "@/app/lib/helpers/databaseHelpers";
import {belaResultIsValid} from "@/app/lib/validation/validateResult";

export async function createBelaResult(resultData: BelaResultRequest): Promise<void> {
    if (!belaResultIsValid(resultData)) {
        throw new Error("Invalid bela result entry.");
    }

    // TODO: Validate one of the 4 players playing the game is entering the result?

    const createNested = transformBelaResult(resultData); // TODO DO I NEED THIS
    await prisma.ongoingBelaResult.create({data: createNested});
}