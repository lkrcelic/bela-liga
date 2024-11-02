import {NextResponse} from "next/server";
import {STATUS} from "@/app/lib/statusCodes";
import {extractPlayersSeatingOrder} from "@/app/lib/service/ongoingMatch/extractPlayersSeatingOrder";
import {OngoingMatchResponseValidation} from "@/app/interfaces/match";
import {findOngoingMatchWithResultsAndPlayers} from "@/app/lib/service/ongoingMatch/findOneWithResultsAndPlayers";

export async function GET(request: Request, {params}: { params: { id: string } }) {
    const {id} = params;

    try {
        const dbOngoingMatch = await findOngoingMatchWithResultsAndPlayers(Number(id));
        const seatingOrder = await extractPlayersSeatingOrder(dbOngoingMatch);

        const ongoingMatch = OngoingMatchResponseValidation.parse(dbOngoingMatch);
        ongoingMatch.seating_order = seatingOrder;

        return NextResponse.json(ongoingMatch, {status: STATUS.OK});
    } catch (error) {
        console.error(error);
        return NextResponse.json({error: "Failed to fetch ongoing match."}, {status: STATUS.BadRequest});
    }
}
