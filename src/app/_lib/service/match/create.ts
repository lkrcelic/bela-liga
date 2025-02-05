import {prisma} from "@/app/_lib/prisma";
import {BelaMatchAllIncluded, transformBelaMatch} from "@/app/_lib/helpers/databaseHelpers";
import {Match} from "@prisma/client";

export async function createMatch(ongoingMatch: unknown): Promise<Match> {
  const ongoingMatchNested = transformBelaMatch(ongoingMatch as BelaMatchAllIncluded);
  return prisma.match.create({data: ongoingMatchNested});
}
