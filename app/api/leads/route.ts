import { NextResponse } from "next/server";
import { computeDuplicates, getLeadsFromSheet } from "@/lib/server/lead-data";
import { corsHeaders, corsOptions } from "@/lib/api-cors";

export async function OPTIONS() {
  return corsOptions();
}

export async function GET(request: Request) {
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
      filteredLeads = leads.filter((lead) => normalizeOrg(lead.orgName) === normalized);
      filteredB2b = b2bLeads.filter((lead) => normalizeOrg(lead.orgName) === normalized);
    }

    const leadsByEmail = new Map(
      filteredLeads
        .filter((lead) => lead.emailNorm)
        .map((lead) => [lead.emailNorm as string, lead])
    );
    const leadsByPhone = new Map(
      filteredLeads
        .filter((lead) => lead.phoneNorm)
        .map((lead) => [lead.phoneNorm as string, lead])
    );

    const mergedLeads = filteredB2b.length
      ? filteredB2b.map((lead) => {
          const match =
            (lead.emailNorm && leadsByEmail.get(lead.emailNorm)) ||
            (lead.phoneNorm && leadsByPhone.get(lead.phoneNorm));
          const resolvedStage = lead.stage?.toString().trim() || match?.stage;
          const resolvedStatus = lead.status?.toString().trim() || match?.status;
          return {
            ...lead,
            stage: resolvedStage,
            status: resolvedStatus,
            source: lead.orgName ?? partnerName ?? "B2B Copy",
            dealId: lead.dealId ?? match?.dealId,
          };
        })
      : filteredLeads;

    const duplicates = computeDuplicates(mergedLeads);
    const duplicateMap = new Map<string, "same_partner" | "other_partners">();
    duplicates.forEach((dup) => {
      duplicateMap.set(dup.leadId, dup.type);
      duplicateMap.set(dup.matchedLeadId, dup.type);
    });

    const payload = mergedLeads.map((lead) => ({
      ...lead,
      duplicateType:
        duplicateMap.get(lead.id) ??
        (lead.duplicateOther ? "other_partners" : lead.duplicateSame ? "same_partner" : null),
    }));

    return NextResponse.json({ leads: payload }, { headers: corsHeaders });
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message ?? "Failed to read leads." },
      { status: 500, headers: corsHeaders }
    );
  }
}

