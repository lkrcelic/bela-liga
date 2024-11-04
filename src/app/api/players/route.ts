// src/app/api/players/route.ts

import {prisma} from "@/app/lib/prisma";
import {playersOutput} from "@/app/interfaces/player";
import {NextRequest, NextResponse} from "next/server";
import {getAuthorizedUser} from "@/app/lib/auth";
import {STATUS} from "@/app/lib/statusCodes";
import {Player} from "@prisma/client";

export async function GET(req: NextRequest) {
  try {
    let user = await getAuthorizedUser(req);
    if (!user) {
      return NextResponse.json({message: "You are not authorized for this action."}, {status: STATUS.NotAllowed});
    }

    // This is just for testing cookies/authorization
    // If user has role PLAYER, then he can only see himself

    let dbPlayers: Player[];

    if (user.player_role === "PLAYER") {
      dbPlayers = [user];
    } else {
      dbPlayers = await prisma.player.findMany();
    }
    const players = playersOutput.parse(dbPlayers);

    return NextResponse.json(players, {status: STATUS.OK});
  } catch (error) {
    return NextResponse.json({error: "Failed to fetch players."}, {status: STATUS.ServerError});
  }
}
