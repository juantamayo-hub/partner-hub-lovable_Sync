import "server-only";

import { readSheetValues } from "./google-sheets";

const USERS_TAB = process.env.GOOGLE_USERS_SHEET_TAB || "Users";

export type SheetUser = {
  email: string;
  role?: string;
  partner?: string;
};

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

export async function getUsersFromSheet() {
  const tryTabs = [USERS_TAB, USERS_TAB.toLowerCase(), USERS_TAB.toUpperCase()].filter(
    (value, index, self) => self.indexOf(value) === index
  );

  let rows: string[][] = [];
  for (const tab of tryTabs) {
    rows = await readSheetValues(tab);
    if (rows.length > 0) break;
  }
  if (rows.length === 0) return [];

  const headerRowIndex = rows.findIndex((row, index) => {
    if (index > 4) return false;
    const normalized = row.map(normalizeHeader);
    return normalized.includes("user") || normalized.includes("email");
  });

  const headers = headerRowIndex >= 0 ? rows[headerRowIndex] : rows[0];
  const dataRows = headerRowIndex >= 0 ? rows.slice(headerRowIndex + 1) : rows;

  let emailIndex = findHeaderIndex(headers, ["user", "email", "correo"]);
  const roleIndex = findHeaderIndex(headers, ["role", "rol"]);
  const partnerIndex = findHeaderIndex(headers, ["partner", "org", "company", "empresa"]);

  if (emailIndex === -1) {
    emailIndex = 2; // fallback to column C ("user")
  }

  return dataRows
    .filter((row) => row.some((cell) => String(cell || "").trim().length > 0))
    .map((row) => ({
      email: (row[emailIndex] ?? "").toString().trim().toLowerCase(),
      role: roleIndex >= 0 ? row[roleIndex]?.toString().trim().toLowerCase() : undefined,
      partner: partnerIndex >= 0 ? row[partnerIndex]?.toString().trim() : undefined,
    }))
    .filter((user) => user.email);
}

