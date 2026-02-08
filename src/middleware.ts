import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  // 👇 ESTE ES EL DEBUG QUE QUEREMOS
  const res = NextResponse.next();
  res.headers.set("x-cors-mw", "1");
  return res;
}

export const config = {
  matcher: ["/api/:path*"],
};
