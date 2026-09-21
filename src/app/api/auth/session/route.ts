import { NextRequest, NextResponse } from "next/server";
import { verifySessionToken } from "@/lib/authSession";

export async function GET(req: NextRequest) {
  const sessionCookie = req.cookies.get("sivsha_session")?.value;

  const noCacheHeaders = {
    "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
    Pragma: "no-cache",
    Expires: "0",
  };

  if (!sessionCookie) {
    return NextResponse.json({ authenticated: false }, { headers: noCacheHeaders });
  }

  const { valid, payload } = verifySessionToken(sessionCookie);

  if (!valid || !payload) {
    return NextResponse.json({ authenticated: false }, { headers: noCacheHeaders });
  }

  return NextResponse.json(
    {
      authenticated: true,
      recipient: payload.recipient,
    },
    { headers: noCacheHeaders }
  );
}
