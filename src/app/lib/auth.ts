import {Lucia} from "lucia";
import {PrismaAdapter} from "@lucia-auth/adapter-prisma";
import {prisma} from "./prisma";

import type {Player, Session} from "@prisma/client";
import {NextRequest, NextResponse} from "next/server";

const adapter = new PrismaAdapter(prisma.session, prisma.player);

const cookieName = "BelaTresetaSession";

export const lucia = new Lucia(adapter, {
  sessionCookie: {
    name: cookieName,
    // this sets cookies with super long expiration
    // since Next.js doesn't allow Lucia to extend cookie expiration when rendering pages
    expires: false,
    attributes: {
      // set to `true` when using HTTPS
      secure: process.env.NODE_ENV === "production",
    },
  },
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
  const cookie = req.cookies.get(cookieName);
  if (!cookie || !cookie.value || cookie.value === "") {
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
  return await prisma.player.findUnique({
    where: {id: result.user.id},
  });
}

export async function validateRequest(req: NextRequest): Promise<{userId: number; session: Session} | null> {
  const cookie = req.cookies.get(cookieName);
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
  const cookie = req.cookies.get(cookieName);
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
