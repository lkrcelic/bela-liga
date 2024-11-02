import {NextResponse} from "next/server";
import {STATUS} from "@/app/lib/statusCodes";
import {findOneRound} from "@/app/lib/service/round/findOne";

export async function GET(request: Request, {params}: { params: { id: string } }) {
    const {id} = params;

    try {
        const round = await findOneRound(Number(id))

        return NextResponse.json(round, {status: STATUS.OK});
    } catch (error) {
        console.error(error);
        return NextResponse.json({error: "Failed to fetch round."}, {status: STATUS.BadRequest});
    }
}
