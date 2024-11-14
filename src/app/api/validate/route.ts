import {NextResponse, NextRequest} from "next/server";
import {getAuthorizedUser} from "@/app/lib/auth";

export async function GET(req: NextRequest) {
  const user = await getAuthorizedUser(req);
  if (!user) {
    return NextResponse.json({authorized: false});
  }
  return NextResponse.json({authorized: true});
}
