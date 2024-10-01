// src/app/api/teams/route.ts

import { prisma } from "@/app/lib/prisma";
import { z } from "zod";
import { matchValidation } from "@/app/lib/interfaces/match";
import { NextResponse } from "next/server";
import { STATUS } from "@/app/lib/statusCodes";

export async function GET() {
  try {
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
            results: [{result1}, {result2} ...],
            players: [{team1ids}, {team2ids}]
        }
  */
  try {
    const req_data = await request.json();

    let matchData = matchValidation.parse(req_data);

    // TODO: validate data adheres to game rules
    // TODO: check both teams approved match/result!
    // TODO: insert playerPair combinations
    // calcualte_scores(match);
    // validate(match);

    // assumes validation and calculate_scores have been successful
    // strip results from matchData and treat it as a separate array
    let resultData = matchData.results;
    delete matchData.results;

    let match = await prisma.match.create({data: matchData});
    if (resultData !== undefined)
    {
        resultData.forEach(async belaResult => {
            belaResult.match_id = match.id;
            let announcements = belaResult.announcements;
            delete belaResult.announcements;
            let belaRes = await prisma.belaResult.create({data: belaResult});
            if (belaRes && announcements){
              announcements.forEach(announcement => {
                announcement.result_id = belaRes.result_id;
              });
              await prisma.belaPlayerAnnouncement.createMany({data: announcements});
            }
        });
        // TODO: try-catch in case inserting fails, rollback change to match table
        //results = await prisma.belaResult.createManyAndReturn({data: resultData});
    }

    return NextResponse.json({ "match": match }, { status: STATUS.OK });
  } catch (error) {
    if (error instanceof z.ZodError){
      return NextResponse.json({ error: error.issues }, { status: STATUS.BadRequest });
    }
    return NextResponse.json({ error: error }, { status: STATUS.ServerError });
  }
}
