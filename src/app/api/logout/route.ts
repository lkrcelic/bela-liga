import {lucia, validateRequest} from "@/app/_lib/auth";
import {STATUS} from "@/app/_lib/statusCodes";
import {NextRequest, NextResponse} from "next/server";

export async function POST(req: NextRequest) {
  try {
    const res = NextResponse.json({}, {status: STATUS.OK});
    const val = await validateRequest(req);
    if (val) {
      await lucia.invalidateSession(val.session.id);
    }
    res.cookies.set(lucia.createBlankSessionCookie());
    return res;
  } catch (error) {
    return NextResponse.json({error: "Could not signout user."}, {status: STATUS.ServerError});
  }
}
