import "server-only";

import { google } from "googleapis";

const SHEET_ID = process.env.GOOGLE_SHEETS_ID;
const SHEET_TAB = process.env.GOOGLE_SHEETS_TAB;
const SERVICE_ACCOUNT_EMAIL = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
const PRIVATE_KEY = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY;
const PRIVATE_KEY_B64 = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY_B64;

function resolvePrivateKey() {
  if (PRIVATE_KEY_B64) {
    const normalized = PRIVATE_KEY_B64.replace(/\s+/g, "");
    const decoded = Buffer.from(normalized, "base64").toString("utf8");
    if (decoded.includes('"private_key"')) {
      const parsed = JSON.parse(decoded);
      return parsed.private_key as string;
    }
    return decoded;
  }
  if (PRIVATE_KEY) {
    return PRIVATE_KEY.replace(/\\n/g, "\n");
  }
  return null;
}

function getAuthClient(scope: "readonly" | "readwrite" = "readonly") {
  const resolvedKey = resolvePrivateKey();
  if (!SERVICE_ACCOUNT_EMAIL || !resolvedKey) {
    throw new Error("Missing Google service account credentials.");
  }
  if (!resolvedKey.includes("BEGIN PRIVATE KEY")) {
    throw new Error("Invalid Google private key format. Expected PEM.");
  }

  return new google.auth.JWT({
    email: SERVICE_ACCOUNT_EMAIL,
    key: resolvedKey,
    scopes: [
      scope === "readwrite"
        ? "https://www.googleapis.com/auth/spreadsheets"
        : "https://www.googleapis.com/auth/spreadsheets.readonly",
    ],
  });
}

async function getSheetTabTitle(sheets: ReturnType<typeof google.sheets>, tabOverride?: string) {
  if (tabOverride) return tabOverride;
  if (SHEET_TAB) return SHEET_TAB;
  const response = await sheets.spreadsheets.get({
    spreadsheetId: SHEET_ID,
    fields: "sheets(properties(title))",
  });
  const firstSheet = response.data.sheets?.[0]?.properties?.title;
  if (!firstSheet) {
    throw new Error("No sheet tab found.");
  }
  return firstSheet;
}

export async function readSheetValues(tabOverride?: string) {
  if (!SHEET_ID) {
    throw new Error("Missing GOOGLE_SHEETS_ID.");
  }

  const auth = getAuthClient();
  const sheets = google.sheets({ version: "v4", auth });
  const tabTitle = await getSheetTabTitle(sheets, tabOverride);

  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: `${tabTitle}`,
  });

  return response.data.values ?? [];
}

export async function appendSheetValues(tabOverride: string, values: string[][]) {
  if (!SHEET_ID) {
    throw new Error("Missing GOOGLE_SHEETS_ID.");
  }

  const auth = getAuthClient("readwrite");
  const sheets = google.sheets({ version: "v4", auth });
  const tabTitle = await getSheetTabTitle(sheets, tabOverride);

  await sheets.spreadsheets.values.append({
    spreadsheetId: SHEET_ID,
    range: `${tabTitle}`,
    valueInputOption: "USER_ENTERED",
    requestBody: {
      values,
    },
  });
}

