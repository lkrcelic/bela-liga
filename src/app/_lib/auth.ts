import {Lucia, TimeSpan} from "lucia";
import {PrismaAdapter} from "@lucia-auth/adapter-prisma";
import {prisma} from "./prisma";
import {RoleEnum} from "@prisma/client";

import type {Player, Session} from "@prisma/client";
import {NextRequest, NextResponse} from "next/server";
import {extractCookieWithoutSignature} from "./signCookie";

const adapter = new PrismaAdapter(prisma.session, prisma.player);

const authCookieName = process.env.AUTH_COOKIE ?? "BelaTresetaSession";

export const lucia = new Lucia(adapter, {
  sessionCookie: {
    name: authCookieName,
    expires: true,
    attributes: {
      // set to `true` when using HTTPS
      secure: process.env.NODE_ENV === "production",

    },
  },
  sessionExpiresIn: new TimeSpan(4, "h"),
  getUserAttributes: (attributes) => {
    return {
      // attributes has the type of DatabaseUserAttributes
      username: attributes.username,
    };
  },
});

declare module "lucia" {
  interface Register {
    Lucia: typeof lucia;
    UserId: number;
    DatabaseUserAttributes: DatabaseUserAttributes;
  }
}

interface DatabaseUserAttributes {
  username: string;
}

export async function getAuthorizedUser(req: NextRequest): Promise<Player | null> {
  const signedCookie = req.cookies.get(authCookieName);
  if (!signedCookie || !signedCookie.value || signedCookie.value === "") {
    return null;
  }
  const cookie = extractCookieWithoutSignature(signedCookie);
  const session = await prisma.session.findUnique({
    where: {id: cookie.value},
  });
  if (!session) {
    return null;
  }
  const result = await lucia.validateSession(session.id);
  if (!result.user) {
    return null;
  }
  return await prisma.player.findUnique({
    where: {id: result.user.id},
  });
}

export async function checkCurrentUserIsAdmin(req: NextRequest): Promise<boolean> {
  const user = await getAuthorizedUser(req);
  return user?.player_role === RoleEnum.ADMIN;
}

export async function validateRequest(req: NextRequest): Promise<{userId: number; session: Session} | null> {
  const signedCookie = req.cookies.get(authCookieName);
  if (!signedCookie || !signedCookie.value || signedCookie.value === "") {
    return null;
  }
  const cookie = extractCookieWithoutSignature(signedCookie);
  if (!cookie) {
    return null;
  }
  const session = await prisma.session.findUnique({
    where: {id: cookie.value},
  });
  if (!session) {
    return null;
  }
  const result = await lucia.validateSession(session.id);
  if (!result.user) {
    return null;
  }
  return {userId: result.user.id, session: result.session};
}

export async function validateRequestWithUpdate(
  req: NextRequest,
  res: NextResponse
): Promise<{userId: number; session: Session} | null> {
  const signedCookie = req.cookies.get(authCookieName);
  if (!signedCookie || !signedCookie.value || signedCookie.value === "") {
    return null;
  }
  const cookie = extractCookieWithoutSignature(signedCookie);
  if (!cookie) {
    return null;
  }
  const session = await prisma.session.findUnique({
    where: {id: cookie.value},
  });
  if (!session) {
    return null;
  }
  const result = await lucia.validateSession(session.id);
  if (!result.user) {
    return null;
  }
  if (result.session && result.session.fresh) {
    res.cookies.set(lucia.createSessionCookie(result.session.id));
  }
  if (!result.session) {
    res.cookies.set(lucia.createBlankSessionCookie());
  }
  return {userId: result.user.id, session: result.session};
}
