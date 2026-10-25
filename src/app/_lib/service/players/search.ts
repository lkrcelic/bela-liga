import {prisma} from "@/app/_lib/prisma";
import {Viewer} from "@/app/_lib/players/privacy";
import {displayName} from "@/app/_lib/players/names";
import {playerPhotoUrls} from "./photos";

export type TeammateHit = {id: number; name: string; photo_url: string | null};

// Players with an account whose first or last name match every word of the query (from 2 letters), for a player
// making a new team with a teammate. Names only: the username, like the rest of a player's personal data, isn't
// shown to other players (handoff §6 "Privacy").
export async function searchTeammates(query: string, viewer: Viewer): Promise<TeammateHit[]> {
  const words = query.trim().split(/\s+/).filter(Boolean).slice(0, 4);
  if (words.join("").length < 2) return [];
  const players = await prisma.player.findMany({
    where: {
      id: {not: viewer.id},
      active: true,
      deleted_at: null,
      AND: words.map((w) => ({OR: [{first_name: {contains: w, mode: "insensitive" as const}}, {last_name: {contains: w, mode: "insensitive" as const}}]})),
    },
    select: {id: true, first_name: true, last_name: true},
    orderBy: [{last_name: "asc"}, {first_name: "asc"}],
    take: 8,
  });
  const photos = await playerPhotoUrls(viewer, players.map((p) => p.id));
  return players
    .map((p) => ({id: p.id, name: displayName(p), photo_url: photos.get(p.id) ?? null}))
    .sort((a, b) => a.name.localeCompare(b.name, "hr"));
}
