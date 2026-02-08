import "server-only";

/**
 * Canonical stages from the Bayteca leads pipeline.
 * The order represents the progression in the sales funnel.
 * 
 * Stage name matching is case-insensitive and tolerant to minor variations.
 * If a stage cannot be matched, it will be grouped as "Other".
 */
export const CANONICAL_STAGES = [
  "Lead",
  "Trying to connect",
  "Qualifying",
  "Doc Collection",
  "Doc. Completed",
  "Dossier validated",
  "Bank Submission",
  "Bank offers received",
  "Pre - Valuation",
  "Valuation",
  "FEIN",
  "Notary - Formalization",
  "Notary - Signature",
] as const;

export type CanonicalStage = (typeof CANONICAL_STAGES)[number] | "Other";

/**
 * Short labels for UI display (used in compact views)
 */
export const STAGE_SHORT_LABELS: Record<string, string> = {
  "Lead": "Lead",
  "Trying to connect": "Connect",
  "Qualifying": "Qualify",
  "Doc Collection": "Docs",
  "Doc. Completed": "Docs Done",
  "Dossier validated": "Validated",
  "Bank Submission": "Submission",
  "Bank offers received": "Offers",
  "Pre - Valuation": "Pre-Val",
  "Valuation": "Valuation",
  "FEIN": "FEIN",
  "Notary - Formalization": "Notary",
  "Notary - Signature": "Signature",
  "Other": "Other",
};

/**
 * Colors for each stage (HSL values matching the Bayteca palette)
 */
export const STAGE_COLORS: Record<string, string> = {
  "Lead": "hsl(142, 76%, 36%)",
  "Trying to connect": "hsl(142, 69%, 42%)",
  "Qualifying": "hsl(82, 85%, 45%)",
  "Doc Collection": "hsl(82, 85%, 50%)",
  "Doc. Completed": "hsl(45, 93%, 47%)",
  "Dossier validated": "hsl(142, 71%, 30%)",
  "Bank Submission": "hsl(201, 96%, 32%)",
  "Bank offers received": "hsl(201, 90%, 40%)",
  "Pre - Valuation": "hsl(271, 76%, 53%)",
  "Valuation": "hsl(142, 76%, 26%)",
  "FEIN": "hsl(142, 76%, 20%)",
  "Notary - Formalization": "hsl(170, 50%, 35%)",
  "Notary - Signature": "hsl(170, 50%, 25%)",
  "Other": "hsl(215, 14%, 60%)",                   // Muted gray
};

/**
 * Normalizes a raw stage name to a canonical stage.
 * Uses fuzzy matching (case-insensitive, prefix matching).
 * 
 * @param raw - The raw stage name from the spreadsheet
 * @returns The matched canonical stage or "Other" if no match
 */
export function normalizeStage(raw?: string): CanonicalStage {
  if (!raw) return "Other";
  
  const trimmed = raw.trim().toLowerCase();
  if (trimmed.length === 0) return "Other";

  // Try exact match first (case-insensitive)
  for (const canonical of CANONICAL_STAGES) {
    if (trimmed === canonical.toLowerCase()) {
      return canonical;
    }
  }

  // Try prefix matching (handles variations like "First contact with..." or "Underwriting - ...")
  for (const canonical of CANONICAL_STAGES) {
    const canonicalLower = canonical.toLowerCase();
    if (trimmed.startsWith(canonicalLower) || canonicalLower.startsWith(trimmed)) {
      return canonical;
    }
  }

  // Try partial matching (any word overlap)
  const rawWords = trimmed.split(/[\s\-_]+/).filter(w => w.length > 2);
  for (const canonical of CANONICAL_STAGES) {
    const canonicalWords = canonical.toLowerCase().split(/[\s\-_]+/).filter(w => w.length > 2);
    const hasOverlap = rawWords.some(rw => 
      canonicalWords.some(cw => rw === cw || cw.includes(rw) || rw.includes(cw))
    );
    if (hasOverlap) {
      return canonical;
    }
  }

  return "Other";
}

export type StageCount = {
  stage: CanonicalStage;
  rawStage: string;
  count: number;
  percentage: number;
  shortLabel: string;
  color: string;
};

/**
 * Aggregates leads by their normalized stage.
 * Preserves the funnel order from CANONICAL_STAGES.
 * 
 * @param leads - Array of leads with stage property
 * @returns Object with total count, counts by stage (ordered), and raw stage mappings
 */
export function aggregateByStage(leads: Array<{ stage?: string }>): {
  total: number;
  countsByStage: StageCount[];
  rawToCanonical: Map<string, CanonicalStage>;
} {
  const rawToCanonical = new Map<string, CanonicalStage>();
  const stageCountMap = new Map<CanonicalStage, { count: number; rawExamples: string[] }>();

  // Initialize all canonical stages with 0 count
  for (const stage of CANONICAL_STAGES) {
    stageCountMap.set(stage, { count: 0, rawExamples: [] });
  }
  stageCountMap.set("Other", { count: 0, rawExamples: [] });

  // Count leads per stage
  for (const lead of leads) {
    const rawStage = lead.stage ?? "";
    const normalized = normalizeStage(rawStage);
    rawToCanonical.set(rawStage, normalized);
    
    const entry = stageCountMap.get(normalized)!;
    entry.count += 1;
    if (entry.rawExamples.length < 3 && rawStage && !entry.rawExamples.includes(rawStage)) {
      entry.rawExamples.push(rawStage);
    }
  }

  const total = leads.length;

  // Build ordered result (maintain funnel order)
  const countsByStage: StageCount[] = [];
  
  for (const stage of [...CANONICAL_STAGES, "Other" as const]) {
    const entry = stageCountMap.get(stage)!;
    if (entry.count > 0 || stage !== "Other") {
      countsByStage.push({
        stage,
        rawStage: entry.rawExamples[0] || stage,
        count: entry.count,
        percentage: total > 0 ? (entry.count / total) * 100 : 0,
        shortLabel: STAGE_SHORT_LABELS[stage] || stage,
        color: STAGE_COLORS[stage] || STAGE_COLORS["Other"],
      });
    }
  }

  // Only add "Other" if it has counts
  const otherEntry = stageCountMap.get("Other")!;
  if (otherEntry.count > 0 && !countsByStage.some(s => s.stage === "Other")) {
    countsByStage.push({
      stage: "Other",
      rawStage: otherEntry.rawExamples[0] || "Other",
      count: otherEntry.count,
      percentage: total > 0 ? (otherEntry.count / total) * 100 : 0,
      shortLabel: STAGE_SHORT_LABELS["Other"],
      color: STAGE_COLORS["Other"],
    });
  }

  return { total, countsByStage, rawToCanonical };
}
