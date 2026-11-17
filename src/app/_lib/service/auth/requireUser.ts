import {Player} from "@prisma/client";
import {NextRequest, NextResponse} from "next/server";
import {prisma} from "@/app/_lib/prisma";
import {STATUS} from "@/app/_lib/statusCodes";
import {adminCheck, isAdminRole} from "@/app/_lib/players/admin";
import {can, Capability} from "@/app/_lib/auth/permissions";
import {FORBIDDEN} from "@/app/_lib/auth/forbidden";
import {PUBLISHED_ROUND} from "@/app/_lib/roundStatus";
import {getAuthorizedUser} from "./getAuthorizedUser";
import {isMyTable} from "@/app/_lib/service/admin/tables";

// The middleware lets every /api request through, so each route checks the session itself with these helpers:
//   const auth = await requireUser(request);
//   if (auth.response) return auth.response;
export type AuthResult = {user: Player; response?: undefined} | {user?: undefined; response: NextResponse};

// A deactivated player has no session (resolveSession), so they get the 401 too and the app sends them to /login
export async function requireUser(req: NextRequest): Promise<AuthResult> {
  const user = await getAuthorizedUser(req);
  if (!user) return {response: unauthorizedResponse()};
  return {user};
}

// Every admin endpoint starts with this (checked by __tests__/adminGuards.test.ts)
export async function requireAdmin(req: NextRequest): Promise<AuthResult> {
  const user = await getAuthorizedUser(req);
  const check = adminCheck(user);
  if (check === "unauthorized") return {response: unauthorizedResponse()};
  if (check === "forbidden") return {response: forbiddenResponse()};
  return {user};
}

/**
 * A route that more than one role may reach: `requireCan(request, "tournament.create")`. The map in
 * _lib/auth/permissions.ts answers, so a new role costs nothing here (DECISIONS #86).
 *
 * This says WHAT the player may do, never on which row. Whose tournament it is is the next check, inside the handler
 * (refuseUnlessMine / canManageTournament), because only there is the row read.
 *
 * `requireAdmin` stays and means "only ADMIN": the routes an organizer may not reach anyway are left as they are.
 */
export async function requireCan(req: NextRequest, cap: Capability): Promise<AuthResult> {
  const user = await getAuthorizedUser(req);
  if (!user) return {response: unauthorizedResponse()};
  if (!can(user, cap)) return {response: forbiddenResponse()};
  return {user};
}

// the same rule under the name the routes use
export {isAdminRole as isAdmin};

export function forbiddenResponse(): NextResponse {
  return NextResponse.json({error: FORBIDDEN}, {status: STATUS.Forbidden});
}

function unauthorizedResponse(): NextResponse {
  return NextResponse.json({error: "Prijava je istekla. Prijavi se ponovno."}, {status: STATUS.Unauthorized});
}

// Who runs a table: the admin, and the organizer at the tables of their own tournament (DECISIONS #86, #83). They
// may do there what an admin does: Tko igra, also for a finished table, and the scorepad.
export async function managesRound(user: Player, roundId: number | null | undefined): Promise<boolean> {
  if (isAdminRole(user)) return true;
  if (roundId == null || !can(user, "tournament.manage.own")) return false;
  return isMyTable(roundId, user);
}

// Only the players of the two teams in a round (or whoever runs the table, managesRound) may enter or change its
// results, and the players only once the round is published (Upravljanje ligom · Skica). Nobody starts a match or
// confirms a lineup in an unpublished round: the services refuse that for admins too, saying why.
export async function canPlayRound(user: Player, roundId: number | null | undefined): Promise<boolean> {
  if (await managesRound(user, roundId)) return true;
  if (roundId == null) return false;

  const round = await prisma.round.findFirst({
    where: {
      id: roundId,
      ...PUBLISHED_ROUND,
      OR: [
        {team1: {teamPlayers: {some: {player_id: user.id}}}},
        {team2: {teamPlayers: {some: {player_id: user.id}}}},
      ],
    },
    select: {id: true},
  });
  return round !== null;
}

// Tko igra (GET and PUT /api/rounds/[id]/lineup): who may open it, and whether they run the table, which also gives
// them a finished table's lineup to see and correct (getLineup, saveLineup)
export async function lineupAccess(user: Player, roundId: number): Promise<{allowed: boolean; manages: boolean}> {
  const manages = await managesRound(user, roundId);
  return {allowed: manages || (await canPlayRound(user, roundId)), manages};
}

export function notYourRoundResponse(): NextResponse {
  return NextResponse.json({error: "Ne igraš u ovoj rundi."}, {status: STATUS.Forbidden});
}
