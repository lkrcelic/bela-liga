import { Player } from "@prisma/client";
import { NextRequest } from "next/server";
import { prisma } from "../../prisma";
import { extractCookieWithoutSignature } from "./signCookie";
import { lucia } from "../../luciaAuth";

export async function getAuthorizedUser(req: NextRequest): Promise<Player | null> {

  // Try NextAuth authentication first
  const nextAuthCookie = req.cookies.get(process.env.GOOGLE_AUTH_COOKIE);
  if (nextAuthCookie && nextAuthCookie.value && nextAuthCookie.value !== "") {
    try {
      const session = await prisma.session.findUnique({
        where: {
          sessionToken: nextAuthCookie.value,
          expires: {
            gt: new Date(), // Only valid sessions
          }
        },
        include: {
          user: true,
        },
      });

      // an expired Google session doesn't end a valid password login, so fall through to the Lucia cookie
      if (session?.user) {
        return session.user;
      }
    } catch (error) {
      console.error("Error validating NextAuth session:", error);
    }
  }

    // If NextAuth auth fails, try Lucia
    const signedCookie = req.cookies.get(process.env.AUTH_COOKIE);
    if (signedCookie && signedCookie.value && signedCookie.value !== "") {
      const cookie = extractCookieWithoutSignature(signedCookie);
      if (cookie) {
        try {
          const result = await lucia.validateSession(cookie.value);
          if (result.user) {
            return prisma.player.findUnique({
              where: {id: result.user.id},
            });
          }
        } catch (error) {
          console.error("Error validating session:", error);
        }
      }
    }
  
    return null;
  }