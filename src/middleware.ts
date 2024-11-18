import {NextResponse} from "next/server";
import type {NextRequest} from "next/server";
import {verifyCookie} from "@/app/lib/signCookie";
import {Cookie} from "lucia";

// TODO: Prisma currently doesn’t natively support running on
// Edge Runtime due to limitations in how Prisma Client interacts with databases.
// So currently the workaround solution is to hit an API endpoint to validate the session and
// check if the user is logged in. An alternative solution is proposed in @/app/lib/auth
export async function middleware(req: NextRequest) {
  // pass our session cookie to the new request
  const reqCookie = req.cookies.get(process.env.AUTH_COOKIE ?? "BelaTresetaSession");
  const cookie = await verifyCookie(reqCookie as Cookie);
  const authorized = cookie === null ? false : true;

  if (!authorized) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  return NextResponse.next();
}

// TODO: Implement rate limiting per IP address.

export const config = {
  matcher: [
    /*
     * Match all pages except for:
     * - /login
     * - /signup
     * - Static files (/_next/ and /public)
     * - API routes (/api/*)
     */
    "/((?!login|signup|_next|static|favicon.ico|api).*)",
  ],
};
