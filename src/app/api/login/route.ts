import { getAuthorizedUser, lucia } from "@/app/lib/auth";
import { prisma } from "@/app/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";

import argon2 from "argon2";
import { LoginUser } from "@/app/lib/interfaces/login";
import { STATUS } from "@/app/lib/statusCodes";

const notFoundResponse = NextResponse.json({ error: "Incorrect username or password." }, 
                                           { status: STATUS.NotFound });
const alreadyLoggedIn = NextResponse.json({ error: "You are already logged it."}, 
                                          { status: STATUS.BadRequest});

export async function POST(req: NextRequest) {
    try {
      const body = await req.json();
      const user = LoginUser.parse(body);

      let currentUser = await getAuthorizedUser(req);
      // TODO?: Check if the user is already logged in, decide what to do
      // Disallow log in?, Logout from other device and log in on this one?, Both logged in?
      if (currentUser) {
        return alreadyLoggedIn;
      }
      const existingUser = await prisma.player.findUnique({ where: { username: user.username }});
      if (!existingUser){
        return notFoundResponse;
      }
      const validPassword = await argon2.verify(existingUser.password_hash, user.password);
      if (!validPassword){
        return notFoundResponse;
      }

      /*  
        It is neccessary to provide sessionId because lucia implements a different kind of id generator
        which is not conformant with postgresql for some reason.
      */
      const session = await lucia.createSession(existingUser.id, {}, { sessionId: randomUUID() });
      const cookie = lucia.createSessionCookie(session.id);

      const response = NextResponse.json({ message: "Login successful." }, { status: STATUS.OK });
      response.cookies.set(cookie);
      return response;
    } catch (error) {
      return NextResponse.json({ message: "Login unsuccessful."}, { status: STATUS.ServerError });
    }
}