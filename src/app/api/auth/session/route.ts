import { NextRequest, NextResponse } from "next/server";
import { verifySessionToken } from "@/lib/authSession";

export async function GET(req: NextRequest) {
  const sessionCookie = req.cookies.get("sivsha_session")?.value;

  if (!sessionCookie) {
    return NextResponse.json({ authenticated: false });
  }

  const { valid, payload } = verifySessionToken(sessionCookie);

  if (!valid || !payload) {
    return NextResponse.json({ authenticated: false });
  }

  return NextResponse.json({
    authenticated: true,
    recipient: payload.recipient,
  });
}
