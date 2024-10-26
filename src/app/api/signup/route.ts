import {NextRequest, NextResponse} from "next/server";
import {playerOutput, playerValidation} from "@/app/lib/interfaces/player";
import {prisma} from "@/app/lib/prisma";
import {z} from "zod";
import argon2 from "argon2";
import {STATUS} from "@/app/lib/statusCodes";


export async function POST(request: NextRequest) {
    try {
        const req_data = await request.json();

        /* TODO: check if - data is valid
                          - username/email already in db
                          - generate salt, hash ptPassword and store in db
        */
        let playerVal = playerValidation.parse(req_data);

        playerVal.password_hash = await argon2.hash(playerVal.password_hash);

        const createdPlayer = await prisma.player.create({data: playerVal});
        const player = playerOutput.parse(createdPlayer);

        return NextResponse.json(player, {status: STATUS.OK});
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({error: error.issues}, {status: STATUS.BadRequest});
        }
        return NextResponse.json({error: error}, {status: STATUS.ServerError});
    }
}