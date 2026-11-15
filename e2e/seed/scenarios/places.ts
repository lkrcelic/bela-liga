// The places the generated world plays at (Lokacije, DECISIONS #98): a league, a night and a tournament point at a
// Location. Each is made on first use; the seed starts from an empty database, so a name finds the one made earlier.
import type {TournamentRequest} from "@/app/_interfaces/tournament";
import type {Ctx} from "../context";

export type Place = {name: string; address: string; url: string};

export const PITANIK: Place = {
  name: "Caffe bar Pitanik",
  address: "Ilica 1, Zagreb",
  url: "https://maps.app.goo.gl/e2eTestPitanik",
};

export async function placeId(ctx: Ctx, place: Place = PITANIK): Promise<number> {
  const found = await ctx.prisma.location.findFirst({where: {name: place.name}, select: {location_id: true}});
  return found?.location_id ?? (await ctx.prisma.location.create({data: place, select: {location_id: true}})).location_id;
}

// A tournament request at Pitanik, unless it names a place of its own
export async function atPitanik(ctx: Ctx, request: TournamentRequest): Promise<TournamentRequest> {
  return request.location_id != null ? request : {...request, location_id: await placeId(ctx)};
}
