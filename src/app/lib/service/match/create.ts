import {prisma} from "@/app/lib/prisma";
import {BelaMatchAllIncluded, transformBelaMatch} from "@/app/lib/helpers/databaseHelpers";
import {Match} from "@prisma/client";

export async function createMatch(ongoingMatch: unknown): Promise<Match> {
  const ongoingMatchNested = transformBelaMatch(ongoingMatch as BelaMatchAllIncluded);
  return prisma.match.create({data: ongoingMatchNested});
}
