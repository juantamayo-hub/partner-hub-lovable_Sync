import { NextRequest, NextResponse } from "next/server";

export function middleware(req: NextRequest) {
  const origin = req.headers.get("origin") || "";

  const allowed =
    origin.endsWith(".lovable.app") ||
    origin === "https://partner-hub-lovable-csih.vercel.app";

  // Preflight requests
  if (req.method === "OPTIONS") {
    const res = new NextResponse(null, { status: 204 });
    if (allowed) {
      res.headers.set("Access-Control-Allow-Origin", origin);
      res.headers.set(
        "Access-Control-Allow-Methods",
        "GET,POST,PUT,DELETE,OPTIONS"
      );
      res.headers.set(
        "Access-Control-Allow-Headers",
        "Content-Type, Authorization"
      );
      res.headers.set("Access-Control-Allow-Credentials", "true");
      res.headers.set("Vary", "Origin");
    }
    return res;
  }

  const res = NextResponse.next();
  if (allowed) {
    res.headers.set("Access-Control-Allow-Origin", origin);
    res.headers.set("Access-Control-Allow-Credentials", "true");
    res.headers.set("Vary", "Origin");
  }

  return res;
}

export const config = {
  matcher: ["/api/:path*"],
};


