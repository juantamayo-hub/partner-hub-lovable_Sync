import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

function isAllowedOrigin(origin: string) {
  return (
    (origin.startsWith("https://id-preview--") &&
      origin.endsWith(".lovable.app")) ||
    origin === "http://localhost:5173" ||
    origin === "http://localhost:3000"
  );
}

export function middleware(req: NextRequest) {
  const origin = req.headers.get("origin");

  // Preflight
  if (req.method === "OPTIONS") {
    const res = new NextResponse(null, { status: 204 });
    if (origin && isAllowedOrigin(origin)) {
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
  if (origin && isAllowedOrigin(origin)) {
    res.headers.set("Access-Control-Allow-Origin", origin);
    res.headers.set("Access-Control-Allow-Credentials", "true");
    res.headers.set("Vary", "Origin");
  }

  return res;
}

export const config = {
  matcher: ["/api/:path*"],
};
