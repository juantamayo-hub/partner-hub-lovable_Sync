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

    // Usar la misma fuente que las métricas (filteredLeads = hoja principal) para que
    // "Perdidos" y la tabla "Cerrados" coincidan. Antes se devolvían solo B2B cuando había datos.
    const duplicates = computeDuplicates(filteredLeads);
    const duplicateMap = new Map<string, "same_partner" | "other_partners">();
    duplicates.forEach((dup) => {
      duplicateMap.set(dup.leadId, dup.type);
      duplicateMap.set(dup.matchedLeadId, dup.type);
    });

    const payload = filteredLeads.map((lead) => ({
      ...lead,
      stage: lead.stage?.toString().trim() ?? undefined,
      lossReason: lead.lossReason?.toString().trim() ?? undefined,
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

