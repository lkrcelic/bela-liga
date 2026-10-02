import {NextResponse} from "next/server";
import {STATUS} from "@/app/_lib/statusCodes";
import {getOngoingMatchWithResults} from "@/app/_lib/service/ongoingMatch/getOneWithResults";

export async function GET(request: Request, {params}: { params: { id: string } }) {
    const {id} = params;

    try {
        const ongoingMatch = await getOngoingMatchWithResults(Number(id));

        return NextResponse.json(ongoingMatch, {status: STATUS.OK});
    } catch (error) {
        console.error(error);
        return NextResponse.json({error: "Failed to fetch ongoing match."}, {status: STATUS.BadRequest});
    }
}
