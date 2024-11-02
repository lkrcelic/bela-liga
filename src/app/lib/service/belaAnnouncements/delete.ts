import {prisma} from "@/app/lib/prisma";

export async function deleteBelaAnnouncements(id: number): Promise<void> {
    await prisma.bela.delete({where: {id: id}});
}