import {RoundExtendedResponseValidation} from "@/app/_interfaces/round";
import {prisma} from "@/app/_lib/prisma";
import {MatchResponseValidation} from "@/app/_interfaces/match";
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