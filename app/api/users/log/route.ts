import { NextResponse } from "next/server";
import { appendSheetValues } from "@/lib/server/google-sheets";
import { getUsersFromSheet } from "@/lib/server/users-sheet";

const LOG_TAB = "Sign in -Log Bayteca";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = body?.email?.toString().trim().toLowerCase();
    const userName = body?.user?.toString().trim();
    if (!email) {
      return NextResponse.json({ error: "Missing email." }, { status: 400 });
    }

    const users = await getUsersFromSheet();
    const isAllowed = users.some((entry) => entry.email === email);
    if (!isAllowed) {
      return NextResponse.json({ error: "Not authorized." }, { status: 403 });
    }

    const timestamp = new Date().toISOString();
    const row = [userName || email, email, timestamp];

    await appendSheetValues(LOG_TAB, [row]);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("users/log error:", error);
    return NextResponse.json(
      { error: (error as Error).message ?? "Failed to log sign in." },
      { status: 500 }
    );
  }
}
