// src/app/api/belaResult/route.ts

import {prisma} from "@/app/lib/prisma";
import {z} from "zod";
import {BelaResultValidationRequestValidation} from "@/app/lib/interfaces/belaResult";
import {NextResponse} from "next/server";
import {STATUS} from "@/app/lib/statusCodes";
import {belaResultIsValid} from "@/app/lib/belaValidation/validateResult";
import {updateMatchAndCheckIfOver} from "@/app/lib/belaValidation/updateMatchAndCheckIfOver";
import {transformBelaMatch, transformBelaResult} from "@/app/lib/helpers/databaseHelpers";

export async function GET() {
    try {
        // TODO: check user!
        // TODO?: implement limit/offset
        const allResults = await prisma.belaResult.findMany();

        return NextResponse.json(allResults, {status: STATUS.OK});
    } catch (error) {
        return NextResponse.json({error: "Failed to fetch results."}, {status: STATUS.ServerError});
    }
}

export async function POST(request: Request) {
    /*
      Expected input data format:
          body:
          {
              match_id: ...,
              player_pair1_game_points: ...,
              ...,
              announcements: [
                  { player_id: ... ,
                    announcement_type: ...
                  },
                  ...
              ]
          }
    */
    try {
        const req_data = await request.json();
        const resultData = BelaResultValidationRequestValidation.parse(req_data);

        if (!belaResultIsValid(resultData)) {
            return NextResponse.json({error: "Invalid bela result entry."}, {status: STATUS.BadRequest});
        }

        // TODO: Validate one of the 4 players playing the game is entering the result?
        const match_over = await updateMatchAndCheckIfOver(resultData);
        const createNested = transformBelaResult(resultData); // TODO DO I NEED THIS
        const result = await prisma.ongoingBelaResult.create({data: createNested});

        if (match_over) {
            // match is over after entering this result. Move it to 'persisted' table
            const dbMatch = await prisma.ongoingMatch.findUnique({
                where: {id: result.match_id},
                include: {belaResults: {include: {belaPlayerAnnouncements: true}}}
            });
            if (!dbMatch)
                throw new Error("Something went wrong...");

            const matchNested = transformBelaMatch(dbMatch);
            const matchPersisted = await prisma.match.create({data: matchNested});

            // Is await needed here or is then/catch better?
            await prisma.ongoingMatch.delete({where: {id: result.match_id}});
            // .then((match) => console.log('ongoing match deleted!'))
            // .catch((error) => console.log(error));

            return NextResponse.json({"match": matchPersisted, "matchOver": match_over},
                {status: STATUS.OK});
        }

        const announcements = await prisma.ongoingBelaPlayerAnnouncement.findMany({
            where: {
                result_id: result.result_id
            }
        });

        return NextResponse.json({"result": result, "announcements": announcements, "matchOver": match_over},
            {status: STATUS.OK});
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({error: error.issues}, {status: STATUS.BadRequest});
        }
        return NextResponse.json({error: error}, {status: STATUS.ServerError});
    }
}
