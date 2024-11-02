import {prisma} from "@/app/lib/prisma";
import {transformBelaMatch} from "@/app/lib/helpers/databaseHelpers";

export async function createMatch(ongoingMatch: any): Promise<any> {
    const ongoingMatchNested = transformBelaMatch(ongoingMatch);
    return prisma.match.create({data: ongoingMatchNested});
}