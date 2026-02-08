import { NextResponse } from "next/server";
import { getUsersFromSheet } from "@/lib/server/users-sheet";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const email = url.searchParams.get("email")?.toLowerCase();
    if (!email) {
      return NextResponse.json({ allowed: false }, { status: 400 });
    }

    const users = await getUsersFromSheet();
    const user = users.find((entry) => entry.email === email);
    const debug = url.searchParams.get("debug") === "1";

    return NextResponse.json({
      allowed: !!user,
      role: user?.role ?? null,
      partner: user?.partner ?? null,
      debug: debug
        ? {
            totalUsers: users.length,
            sampleEmails: users.slice(0, 5).map((entry) => entry.email),
          }
        : undefined,
    });
  } catch (error) {
    console.error("users/allowed error:", error);
    return NextResponse.json(
      { error: (error as Error).message ?? "Failed to read users." },
      { status: 500 }
    );
  }
}

