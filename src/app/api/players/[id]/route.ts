// src/app/api/players/[id]/route.ts
import {NextRequest, NextResponse} from "next/server";
import {STATUS} from "@/app/_lib/statusCodes";
import {getPlayerById} from "@/app/_lib/service/players/getById";
import {isAdmin, requireUser} from "@/app/_lib/service/auth/requireUser";
import {PlayerBirthDateUpdate, PlayerPartialResponseValidation} from "@/app/_interfaces/player";
import {prisma} from "@/app/_lib/prisma";
import {errorResponse} from "@/app/_lib/apiErrors";

// Handle GET request to fetch a single player by ID.
// Email and role are only shown to the player themselves and to admins.
export async function GET(request: NextRequest, {params}: { params: { id: string } }) {
  const auth = await requireUser(request);
  if (auth.response) return auth.response;
  const id = Number(params.id);

  try {
    const player = await getPlayerById(id);

    if (!player) {
      return NextResponse.json({error: "Player not found."}, {status: STATUS.NotFound});
    }

    const canSeeDetails = auth.user.id === id || isAdmin(auth.user);
    return NextResponse.json(canSeeDetails ? player : PlayerPartialResponseValidation.parse(player), {status: STATUS.OK});
  } catch (error) {
    console.log(error);
    return NextResponse.json({error: "Failed to fetch player."}, {status: STATUS.ServerError});
  }
}

// A player sets their own birth date (asked after a Google sign-up). Admins may set anyone's.
export async function PATCH(request: NextRequest, {params}: { params: { id: string } }) {
  const auth = await requireUser(request);
  if (auth.response) return auth.response;
  const id = Number(params.id);
  if (auth.user.id !== id && !isAdmin(auth.user)) {
    return NextResponse.json({error: "You can only change your own profile."}, {status: STATUS.Forbidden});
  }

  try {
    const {birth_date} = PlayerBirthDateUpdate.parse(await request.json());
    const {count} = await prisma.player.updateMany({where: {id}, data: {birth_date: new Date(birth_date)}});
    if (count === 0) {
      return NextResponse.json({error: "Player not found."}, {status: STATUS.NotFound});
    }
    return NextResponse.json({birth_date}, {status: STATUS.OK});
  } catch (error) {
    return errorResponse(error, "Failed to update player.");
  }
}
