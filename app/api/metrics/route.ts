import { NextResponse } from "next/server";
import {
  buildMetrics,
  computeDuplicates,
  getLeadsFromSheet,
} from "@/lib/server/lead-data";

// ✅ Ajusta aquí si tu preview cambia.
// (puedes permitir varios si quieres)
function isAllowedOrigin(origin: string) {
  return (
    (origin.startsWith("https://id-preview--") && origin.endsWith(".lovable.app")) ||
    origin === "http://localhost:5173" ||
    origin === "http://localhost:3000"
  );
}

function withCors(res: NextResponse, origin: string | null) {
if (origin && isAllowedOrigin(origin)) {
    res.headers.set("Access-Control-Allow-Origin", origin);
    res.headers.set("Access-Control-Allow-Credentials", "true");
    res.headers.set("Vary", "Origin");
  }
  res.headers.set(
    "Access-Control-Allow-Methods",
    "GET,POST,PUT,DELETE,OPTIONS"
  );
  res.headers.set(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization"
  );
  return res;
}

// ✅ Preflight (CORS)
export async function OPTIONS(request: Request) {
  const origin = request.headers.get("origin");
  const res = new NextResponse(null, { status: 204 });
  return withCors(res, origin);
}

export async function GET(request: Request) {
  const origin = request.headers.get("origin");

  try {
    const url = new URL(request.url);
    const partnerName = url.searchParams.get("partner_name");

    const { leads, b2bLeads } = await getLeadsFromSheet();
    let filteredLeads = leads;
    let filteredB2b = b2bLeads;

    const normalizeOrg = (value?: string | null) =>
      value?.toString().trim().toLowerCase().replace(/\s+/g, " ") ?? "";

    if (partnerName) {
      const normalized = normalizeOrg(partnerName);
      filteredLeads = leads.filter(
        (lead) => normalizeOrg(lead.orgName) === normalized
      );
      filteredB2b = b2bLeads.filter(
        (lead) => normalizeOrg(lead.orgName) === normalized
      );
    }

    const duplicates = computeDuplicates(filteredLeads);
    const metrics = buildMetrics(filteredLeads, duplicates, filteredB2b);

    const lossReasonMap = new Map<string, number>();
    filteredLeads
      .filter((lead) => lead.lossReason)
      .forEach((lead) => {
        const key = lead.lossReason!.toString().trim();
        if (!key) return;
        lossReasonMap.set(key, (lossReasonMap.get(key) ?? 0) + 1);
      });

    const lossReasons = Array.from(lossReasonMap.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([reason, count]) => ({ reason, count }));

    const res = NextResponse.json({ ...metrics, lossReasons });
    return withCors(res, origin);
  } catch (error) {
    const res = NextResponse.json(
      { error: (error as Error).message ?? "Failed to compute metrics." },
      { status: 500 }
    );
    return withCors(res, origin);
  }
}
