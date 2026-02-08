import { NextResponse } from "next/server";
import { computeDuplicates, getLeadsFromSheet } from "@/lib/server/lead-data";
import { withCors, corsOptions } from "@/lib/api-cors";

export async function OPTIONS() {
  return corsOptions();
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const partnerName = url.searchParams.get("partner_name");

    const { b2bLeads } = await getLeadsFromSheet();
    let filteredLeads = b2bLeads;
    const normalizeOrg = (value?: string | null) =>
      value?.toString().trim().toLowerCase().replace(/\s+/g, " ") ?? "";

    if (partnerName) {
      const normalized = normalizeOrg(partnerName);
      filteredLeads = b2bLeads.filter((lead) => normalizeOrg(lead.orgName) === normalized);
    }

    const duplicates = filteredLeads
      .filter((lead) => lead.duplicateSame || lead.duplicateOther)
      .map((lead) => ({
        id: lead.id,
        rule: "flag",
        type: lead.duplicateOther ? "other_partners" : "same_partner",
        createdAt: lead.createdAt,
        original: {
          id: lead.id,
          firstName: lead.firstName,
          lastName: lead.lastName,
          email: lead.emailRaw,
          partner: lead.orgName,
        },
        matched: {
          id: `${lead.id}-flag`,
          firstName: undefined,
          lastName: undefined,
          email: lead.emailRaw,
          partner: lead.duplicateOther ? "Otro partner" : lead.orgName,
        },
      }));

    const res = NextResponse.json({ duplicates });
    return withCors(res);
  } catch (error) {
    const res = NextResponse.json(
      { error: (error as Error).message ?? "Failed to read duplicates." },
      { status: 500 }
    );
    return withCors(res);
  }
}

