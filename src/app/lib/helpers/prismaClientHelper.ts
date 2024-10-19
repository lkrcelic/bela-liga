import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

export async function runPrismaQuery<T>(query: Prisma.PrismaPromise<T>): Promise<T> {
    return query;
}

export { prisma };
