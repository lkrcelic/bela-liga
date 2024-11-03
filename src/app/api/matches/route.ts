// src/app/api/matches/route.ts

import {prisma} from "@/app/lib/prisma";
import {NextResponse} from "next/server";
import {STATUS} from "@/app/lib/statusCodes";
import {MatchRequestValidation} from "@/app/interfaces/match";
import {updateRoundWins} from "@/app/lib/service/round/updateWins";
import {createMatch} from "@/app/lib/service/match/create";
import {deleteOngoingMatch} from "@/app/lib/service/ongoingMatch/delete";
import {findOngoingMatchWithResultsAndAnnouncements} from "@/app/lib/service/ongoingMatch/findOneWithResultAndAnnouncements";
import {updateScores} from "@/app/lib/updateScores";

export async function GET() {
  try {
    // TODO: check user!
    // TODO?: implement limit/offset
    const allMatches = await prisma.match.findMany();

    return NextResponse.json(allMatches, {status: STATUS.OK});
  } catch (error) {
    return NextResponse.json({error: "Failed to fetch matches."}, {status: STATUS.ServerError});
  }
}

export async function POST(request: Request) {
  try {
    const req_data = await request.json();
    const ongoingMatchId = MatchRequestValidation.parse(req_data);

    const dbOngoingMatch = await findOngoingMatchWithResultsAndAnnouncements(ongoingMatchId);

    if (!dbOngoingMatch) {
      throw new Error("Something went wrong no ongoing match with that id");
    }

    const match = await createMatch(dbOngoingMatch);
    await deleteOngoingMatch(ongoingMatchId);

    if (match.round_id) {
      await updateRoundWins(match.round_id, match.player_pair1_score, match.player_pair2_score);
      await updateScores(match.round_id);
    }

    return NextResponse.json({message: "Match successfully created"}, {status: STATUS.OK});
  } catch (error) {
    console.error(error);
    return NextResponse.json({error: error}, {status: STATUS.BadRequest});
  }
}
