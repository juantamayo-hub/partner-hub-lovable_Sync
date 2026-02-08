import { NextResponse } from "next/server";

/**
 * CORS for /api/* on Vercel. Lovable frontend runs on *.lovable.app (different origin).
 * We use a shared helper + OPTIONS in each route because:
 * - next.config headers apply to responses but OPTIONS requests need 204 (not 405).
 * - Per-route OPTIONS + response headers are reliable on Vercel (no middleware dependency).
 */
const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Max-Age": "86400",
} as const;

/** Apply CORS headers to any NextResponse. Use on every API response. */
export function withCors(res: NextResponse): NextResponse {
  Object.entries(CORS_HEADERS).forEach(([key, value]) => {
    res.headers.set(key, value);
  });
  return res;
}

/** Preflight OPTIONS response (204). Use in every route: export async function OPTIONS() { return corsOptions(); } */
export function corsOptions(): NextResponse {
  return withCors(new NextResponse(null, { status: 204 }));
}
