import {NextResponse} from "next/server";
import type {NextRequest} from "next/server";

// TODO: Prisma currently doesn’t natively support running on
// Edge Runtime due to limitations in how Prisma Client interacts with databases.
// So currently the workaround solution is to hit an API endpoint to validate the session and
// check if the user is logged in. An alternative solution is proposed in @/app/lib/auth
export async function middleware(req: NextRequest) {
  // pass our session cookie to the new request
  const cookie = req.cookies.get(process.env.AUTH_COOKIE ?? "");
  let strCookie = "";
  if (cookie) {
    strCookie = `${cookie.name}=${cookie.value}; `;
  }

  // Send the fetch request to the API, with forwarded the Cookie header
  const res = await fetch(new URL("/api/validate", req.url).toString(), {
    headers: {
      Cookie: strCookie,
    },
  });
  const {authorized} = await res.json();

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
