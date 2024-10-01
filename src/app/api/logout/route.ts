import { lucia, validateRequest } from "@/app/lib/auth";
import { STATUS } from "@/app/lib/statusCodes";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    let res = NextResponse.json({}, { status: STATUS.OK });
    const val = await validateRequest(req);
    if (!val) {
      return NextResponse.json({ error: "Could not signout user." }, { status: STATUS.Forbidden });
    }
    await lucia.invalidateSession(val.session.id);
    res.cookies.set(lucia.createBlankSessionCookie());
    return res;
  } catch (error) {
    return NextResponse.json({ error: "Could not signout user." }, { status: STATUS.ServerError });
  }
}