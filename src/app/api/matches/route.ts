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

