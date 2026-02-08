import { NextResponse } from "next/server";
import { readSheetValues } from "@/lib/server/google-sheets";

const USERS_TAB = process.env.GOOGLE_USERS_SHEET_TAB || "Users";

const normalizeHeader = (value: string) =>
  value.toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "");

const findHeaderIndex = (headers: string[], candidates: string[]) => {
  const normalized = headers.map(normalizeHeader);
  for (const candidate of candidates) {
    const index = normalized.indexOf(normalizeHeader(candidate));
    if (index !== -1) return index;
  }
  return -1;
};

export async function GET() {
  try {
    const rows = await readSheetValues(USERS_TAB);
    if (rows.length === 0) {
      return NextResponse.json({ partners: [] });
    }

    const headerRowIndex = rows.findIndex((row, index) => {
      if (index > 4) return false;
      const normalized = row.map(normalizeHeader);
      return normalized.includes("user") || normalized.includes("email");
    });

    const headers = headerRowIndex >= 0 ? rows[headerRowIndex] : rows[0];
    const dataRows = headerRowIndex >= 0 ? rows.slice(headerRowIndex + 1) : rows;
    const partnerIndex = findHeaderIndex(headers, ["partner", "org", "company", "empresa"]);

    if (partnerIndex === -1) {
      return NextResponse.json({ partners: [] });
    }

    // From A4 onwards in the Users sheet (skip first 3 data rows)
    const partners = dataRows
      .slice(3)
      .map((row) => row[partnerIndex]?.toString().trim())
      .filter((value) => value && value.length > 0);

    const uniquePartners = Array.from(new Set(partners)).sort((a, b) =>
      a.localeCompare(b)
    );

    return NextResponse.json({ partners: uniquePartners });
  } catch (error) {
    console.error("users/partners error:", error);
    return NextResponse.json(
      { error: (error as Error).message ?? "Failed to read partners." },
      { status: 500 }
    );
  }
}
