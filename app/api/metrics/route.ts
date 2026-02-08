import { NextResponse } from "next/server";
import {
  buildMetrics,
  computeDuplicates,
  getLeadsFromSheet,
} from "@/lib/server/lead-data";
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

    return NextResponse.json(
      { ...metrics, lossReasons },
      { headers: corsHeaders }
    );
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message ?? "Failed to compute metrics." },
      { status: 500, headers: corsHeaders }
    );
  }
}
