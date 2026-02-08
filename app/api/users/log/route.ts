import { NextResponse } from "next/server";
import { appendSheetValues } from "@/lib/server/google-sheets";
import { getUsersFromSheet } from "@/lib/server/users-sheet";
import { withCors, corsOptions } from "@/lib/api-cors";

const LOG_TAB = "Sign in -Log Bayteca";

export async function OPTIONS() {
  return corsOptions();
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = body?.email?.toString().trim().toLowerCase();
    const userName = body?.user?.toString().trim();
    if (!email) {
      const res = NextResponse.json({ error: "Missing email." }, { status: 400 });
      return withCors(res);
    }

    const users = await getUsersFromSheet();
    const isAllowed = users.some((entry) => entry.email === email);
    if (!isAllowed) {
      const res = NextResponse.json({ error: "Not authorized." }, { status: 403 });
      return withCors(res);
    }

    const timestamp = new Date().toISOString();
    const row = [userName || email, email, timestamp];

    await appendSheetValues(LOG_TAB, [row]);
    const res = NextResponse.json({ ok: true });
    return withCors(res);
  } catch (error) {
    console.error("users/log error:", error);
    const res = NextResponse.json(
      { error: (error as Error).message ?? "Failed to log sign in." },
      { status: 500 }
    );
    return withCors(res);
  }
}
