import {Lucia} from "lucia";
import {PrismaAdapter} from "@lucia-auth/adapter-prisma";
import {prisma} from "./prisma";

import type {Player, Session} from "@prisma/client";
import {NextRequest, NextResponse} from "next/server";

const adapter = new PrismaAdapter(prisma.session, prisma.player);

const authCookieName = process.env.AUTH_COOKIE ?? "BelaTresetaSession";

export const lucia = new Lucia(adapter, {
  sessionCookie: {
    name: authCookieName,
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
  const cookie = req.cookies.get(authCookieName);
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
  const cookie = req.cookies.get(authCookieName);
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
  const cookie = req.cookies.get(authCookieName);
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

/*
 * TODO: Consider replacing current authentication with signed cookies
 * as this would avoid the need for (excess) api calls in middleware
 * and would make checking for login as simple as verifying the cookie (no database calls)
 */

// const SECRET_KEY = process.env.SECRET_KEY || "zbla-ima-malu-kitu";

// export async function loginUser(user) {
//   const existingUser = await prisma.player.findUnique({
//     where: { username: user.username }
//   });

//   if (!existingUser) {
//     return { error: "User not found" };
//   }

//   // Here, we would validate the password, e.g., using bcrypt or argon2
//   const validPassword = await argon2.verify(existingUser.password_hash, user.password);
//   if (!validPassword) {
//     return { error: "Invalid password" };
//   }

//   const session = await lucia.createSession(existingUser.id, {}, { randomUUID() });

//   // Create a signed session cookie with session data
//   const cookieValue = signCookie({ sessionId, userId: existingUser.id });

//   // Set the cookie as a secure, HTTP-only cookie
//   const response = NextResponse.json({ message: "Login successful" });
//   response.cookies.set('sessionToken', cookieValue, {
//     httpOnly: true,
//     secure: process.env.NODE_ENV === 'production', // Only set the cookie on HTTPS in production
//     maxAge: 60 * 60, // 1 hour for example
//     sameSite: 'Strict', // Adjust based on your needs
//   });

//   return response;
// }

// function signCookie(data: any) {
//   const cookieData = JSON.stringify(data);
//   const signedCookie = crypto.createHmac('sha256', SECRET_KEY).update(cookieData).digest('hex');
//   return `${cookieData}.${signedCookie}`;
// }

// export async function verifySignedCookie(req: NextRequest) {
//   const cookie = req.cookies.get('sessionToken');

//   if (!cookie) {
//     return null; // No session cookie found
//   }

//   // Extract session data and the signature from the cookie
//   const [cookieData, providedSignature] = cookie.value.split('.');

//   if (!cookieData || !providedSignature) {
//     return null; // Invalid cookie format
//   }

//   const verified = verifySignature(cookieData, providedSignature);

//   if (!verified) {
//     return null; // Signature does not match, invalid session
//   }

//   // If signature matches, parse the session data (cookieData)
//   const sessionData = JSON.parse(cookieData);

//   return sessionData; // Return session data (e.g., user ID, session ID)
// }

// function verifySignature(cookieData: string, providedSignature: string): boolean {
//   const computedSignature = crypto
//     .createHmac('sha256', SECRET_KEY)
//     .update(cookieData)
//     .digest('hex');

//   return computedSignature === providedSignature; // Compare signatures
// }
