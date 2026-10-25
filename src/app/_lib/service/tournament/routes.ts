import {NextResponse} from "next/server";
import {STATUS} from "@/app/_lib/statusCodes";
import {isDbId} from "@/app/_lib/helpers/query/dbId";
import {TOURNAMENT_NOT_FOUND} from "./tournaments";

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
