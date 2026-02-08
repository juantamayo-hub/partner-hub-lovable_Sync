import { NextResponse } from "next/server";
import { getLeadsFromSheet } from "@/lib/server/lead-data";
import { aggregateByStage } from "@/lib/server/stage-normalization";

/**
 * GET /api/leads/stages
 * 
 * Returns aggregated stage counts for leads.
 * Optionally filter by partner_name query parameter.
 * 
 * Response:
 * {
 *   total: number,
 *   countsByStage: Array<{
 *     stage: string,        // Canonical stage name
 *     rawStage: string,     // Example of original value from sheet
 *     count: number,
 *     percentage: number,
 *     shortLabel: string,
 *     color: string
 *   }>
 * }
 */
export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const partnerName = url.searchParams.get("partner_name");
    const activeOnly = url.searchParams.get("active_only") === "1";

    // Fetch leads from Google Sheets
    const { leads } = await getLeadsFromSheet();
    let filteredLeads = leads;

    // Filter by partner if specified
    if (partnerName) {
      const normalized = partnerName.toLowerCase();
      filteredLeads = leads.filter((lead) => lead.orgName?.toLowerCase() === normalized);
    }

    if (activeOnly) {
      filteredLeads = filteredLeads.filter((lead) => !lead.lossReason?.toString().trim());
    }

    // Aggregate by normalized stage
    const { total, countsByStage } = aggregateByStage(
      filteredLeads.map((l) => ({ stage: l.stage }))
    );

    return NextResponse.json({
      total,
      countsByStage,
    });
  } catch (error) {
    console.error("[API] /api/leads/stages error:", error);
    
    const message =
      error instanceof Error ? error.message : "Failed to fetch stage data";
    
    // Provide helpful error for missing credentials
    if (message.includes("Google") || message.includes("credentials")) {
      return NextResponse.json(
        {
          error: "Google Sheets credentials not configured",
          details: message,
          hint: "Ensure GOOGLE_SHEETS_ID, GOOGLE_SERVICE_ACCOUNT_EMAIL, and GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY are set.",
        },
        { status: 503 }
      );
    }

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
