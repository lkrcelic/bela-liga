import {NextResponse} from "next/server";
import {STATUS} from "@/app/_lib/statusCodes";
import {isDbId} from "@/app/_lib/helpers/query/dbId";
import {InvalidResultError} from "@/app/_lib/validation/validateResult";
import type {Viewer} from "@/app/_lib/players/privacy";
import {getAdminTournament, TOURNAMENT_NOT_FOUND} from "./tournaments";

// Shared bits of the tournament routes

// a tournament id from the URL, or null for one that can't be a row (answered as not found)
export function tournamentIdOf(raw: string): number | null {
  const id = Number(raw);
  return isDbId(id) ? id : null;
}

// a new response each time (a response body can be sent only once)
export const tournamentNotFound = () => NextResponse.json({error: TOURNAMENT_NOT_FOUND}, {status: STATUS.NotFound});

// public reads change with every table: never cached
export const NO_STORE = {"Cache-Control": "private, no-store"};

// A finished tournament's sign-ups and waiting list stay as they were (its Kolos, results and details can still change):
// Dodaj ekipu, Makni, Ubaci, Označi dolazak, Aktivna, Isključi and Vrati are refused
export async function refuseIfFinished(id: number, viewer: Viewer): Promise<void> {
  if ((await getAdminTournament(id, viewer)).phase === "finished") throw new InvalidResultError("Turnir je završen: prijave i lista čekanja se više ne mijenjaju.");
}
