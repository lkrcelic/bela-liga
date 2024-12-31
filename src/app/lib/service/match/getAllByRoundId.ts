import {ExtendedRoundResponseValidation} from "@/app/interfaces/round";
import {prisma} from "@/app/lib/prisma";
import {MatchResponseValidation} from "@/app/interfaces/match";
import {z} from "zod";


export async function getAllMatchesByRoundId(id: number): Promise<ExtendedRoundResponseValidation> {
  const matches = await prisma.match.findMany({
    where: {
      round_id: Number(id),
    },
  });

  if (!matches) {
    throw new Error("");
  }

  return z.array(MatchResponseValidation).parse(matches);
}