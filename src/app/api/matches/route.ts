// src/app/api/matches/route.ts

import { prisma } from "@/app/lib/prisma";
import { z } from "zod";
import { MatchRequestValidation } from "@/app/lib/interfaces/match";
import { NextResponse } from "next/server";
import { STATUS } from "@/app/lib/statusCodes";
import { checkPlayersValid, insertPlayerPair } from "@/app/lib/belaValidation/playersValidation";

export async function GET() {
  try {
    // TODO: check user!
    // TODO?: implement limit/offset
    const allMatches = await prisma.match.findMany();

    return NextResponse.json(allMatches, { status: STATUS.OK });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch matches." }, { status: STATUS.ServerError });
  }
}

export async function POST(request: Request) {
  /*
    Expected input data format:
        body:
        {
            score_threshold: ...,
            start_time: ...,
            ...,
            players: [{team1ids}, {team2ids}]
        }
  */
  try {
    const req_data = await request.json();
    let matchData = MatchRequestValidation.parse(req_data);
    let players = matchData.players;
    delete matchData.players;

    if (!await checkPlayersValid(players))
      return NextResponse.json({ error: "Valid players for both teams must be provided!" },
                               { status: STATUS.BadRequest });

    matchData.player_pair_id1 = await insertPlayerPair(players?.team1);
    matchData.player_pair_id2 = await insertPlayerPair(players?.team2);

    const ongoingMatch = await prisma.ongoingMatch.create({data: matchData});

    return NextResponse.json({ "match": ongoingMatch }, { status: STATUS.OK });
  } catch (error) {
    if (error instanceof z.ZodError){
      return NextResponse.json({ error: error.issues }, { status: STATUS.BadRequest });
    }
    return NextResponse.json({ error: error }, { status: STATUS.ServerError });
  }
}
