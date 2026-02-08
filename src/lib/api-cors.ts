import { NextResponse } from "next/server";

/**
 * CORS for /api/* on Vercel. Lovable frontend runs on *.lovable.app (different origin).
 * Headers are set at response creation time (init) so Vercel preserves them.
 */
export const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Max-Age": "86400",
};

/** Apply CORS headers to an existing NextResponse (for error paths). */
export function withCors(res: NextResponse): NextResponse {
  Object.entries(corsHeaders).forEach(([key, value]) => {
    res.headers.set(key, value);
  });
  return res;
}

/** Preflight OPTIONS response (204). */
export function corsOptions(): NextResponse {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}
