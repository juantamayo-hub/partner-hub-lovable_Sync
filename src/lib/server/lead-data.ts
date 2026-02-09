import "server-only";

import { readSheetValues } from "./google-sheets";
import { mapSheetRows, RawLead } from "./lead-mapping";

export type NormalizedLead = {
  id: string;
  emailRaw?: string;
  emailNorm?: string;
  phoneRaw?: string;
  phoneNorm?: string;
  nameRaw?: string;
  firstName?: string;
  lastName?: string;
  status?: string;
  stage?: string;
  source?: string;
  createdAt: Date;
  partner?: string;
  orgName?: string;
  dealId?: string;
  lossReason?: string;
  duplicateSame?: boolean;
  duplicateOther?: boolean;
};

export type LeadDuplicate = {
  id: string;
  leadId: string;
  matchedLeadId: string;
  rule: "email" | "phone" | "flag";
  type: "same_partner" | "other_partners";
  createdAt: Date;
  original: NormalizedLead;
  matched: NormalizedLead;
};

const normalizeEmail = (email?: string) =>
  email ? email.trim().toLowerCase() : undefined;

const normalizePhone = (phone?: string) => {
  if (!phone) return undefined;
  const digits = phone.replace(/\D/g, "");
  return digits.length > 0 ? digits : undefined;
};

const parseDate = (value?: string) => {
  if (!value) return new Date();
  const parsed = new Date(value);
  if (!Number.isNaN(parsed.getTime())) return parsed;
  return new Date();
};

const buildLeadId = (lead: RawLead, index: number) =>
  `${lead.email || "lead"}-${lead.phone || "phone"}-${index}`.replace(/\s+/g, "-");

const LEADS_TAB = process.env.GOOGLE_LEADS_SHEET_TAB || "Bayteca_leads_2026";
const DUPES_TAB = process.env.GOOGLE_DUPES_SHEET_TAB || "B2B Copy";

const buildDuplicateMap = (rows: RawLead[]) => {
  const mapByEmail = new Map<string, { same: boolean; other: boolean }>();
  const mapByPhone = new Map<string, { same: boolean; other: boolean }>();

  rows.forEach((lead) => {
    const emailNorm = normalizeEmail(lead.email);
    const phoneNorm = normalizePhone(lead.phone);
    const same = lead.duplicateSame?.toString().trim() === "1";
    const other = lead.duplicateOther?.toString().trim() === "1";
    if (emailNorm) {
      mapByEmail.set(emailNorm, { same, other });
    }
    if (phoneNorm) {
      mapByPhone.set(phoneNorm, { same, other });
    }
  });

  return { mapByEmail, mapByPhone };
};

const splitName = (name?: string) => {
  if (!name) return { firstName: undefined, lastName: undefined };
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) {
    return { firstName: parts[0], lastName: undefined };
  }
  return { firstName: parts[0], lastName: parts.slice(1).join(" ") };
};

const normalizeLead = (lead: RawLead, index: number) => {
  const emailNorm = normalizeEmail(lead.email);
  const phoneNorm = normalizePhone(lead.phone);
  const nameParts = splitName(lead.name);
  const firstName = lead.firstName ?? nameParts.firstName;
  const lastName = lead.lastName ?? nameParts.lastName;
  return {
    id: buildLeadId(lead, index),
    emailRaw: lead.email,
    emailNorm,
    phoneRaw: lead.phone,
    phoneNorm,
    nameRaw: lead.name,
    firstName,
    lastName,
    status: lead.status?.toLowerCase(),
    stage: lead.stage?.toString().trim() || undefined,
    source: lead.source,
    createdAt: parseDate(lead.createdAt),
    partner: lead.partner,
    orgName: lead.orgName,
    dealId: lead.dealId,
    lossReason: lead.lossReason,
  } as NormalizedLead;
};

export async function getLeadsFromSheet() {
  const [leadsRows, dupesRows] = await Promise.all([
    readSheetValues(LEADS_TAB),
    readSheetValues(DUPES_TAB),
  ]);

  const rawLeads = mapSheetRows(leadsRows);
  const dupesRaw = mapSheetRows(dupesRows);
  const { mapByEmail, mapByPhone } = buildDuplicateMap(dupesRaw);

  const leads = rawLeads.map((lead, index) => {
    const normalizedLead = normalizeLead(lead, index);
    const emailDupes = normalizedLead.emailNorm ? mapByEmail.get(normalizedLead.emailNorm) : undefined;
    const phoneDupes = normalizedLead.phoneNorm ? mapByPhone.get(normalizedLead.phoneNorm) : undefined;
    return {
      ...normalizedLead,
      duplicateSame: emailDupes?.same || phoneDupes?.same || false,
      duplicateOther: emailDupes?.other || phoneDupes?.other || false,
    };
  });

  const b2bLeads = dupesRaw.map((lead, index) => {
    const normalizedLead = normalizeLead(lead, index);
    return {
      ...normalizedLead,
      duplicateSame: lead.duplicateSame?.toString().trim() === "1",
      duplicateOther: lead.duplicateOther?.toString().trim() === "1",
    };
  });

  return { leads, b2bLeads };
}

export function computeDuplicates(leads: NormalizedLead[]) {
  const duplicates: LeadDuplicate[] = [];
  const seenPairs = new Set<string>();

  const emailMap = new Map<string, NormalizedLead[]>();
  const phoneMap = new Map<string, NormalizedLead[]>();

  for (const lead of leads) {
    if (lead.emailNorm) {
      emailMap.set(lead.emailNorm, [...(emailMap.get(lead.emailNorm) ?? []), lead]);
    }
    if (lead.phoneNorm) {
      phoneMap.set(lead.phoneNorm, [...(phoneMap.get(lead.phoneNorm) ?? []), lead]);
    }
  }

  const buildDuplicates = (map: Map<string, NormalizedLead[]>, rule: "email" | "phone") => {
    for (const [, items] of map.entries()) {
      if (items.length < 2) continue;
      for (let i = 0; i < items.length; i += 1) {
        for (let j = i + 1; j < items.length; j += 1) {
          const original = items[i];
          const matched = items[j];
          const pairKey = [original.id, matched.id, rule].sort().join("|");
          if (seenPairs.has(pairKey)) continue;
          seenPairs.add(pairKey);

          const type =
            original.partner && matched.partner && original.partner !== matched.partner
              ? "other_partners"
              : "same_partner";

          duplicates.push({
            id: pairKey,
            leadId: original.id,
            matchedLeadId: matched.id,
            rule,
            type,
            createdAt: original.createdAt,
            original,
            matched,
          });
        }
      }
    }
  };

  buildDuplicates(emailMap, "email");
  buildDuplicates(phoneMap, "phone");

  leads.forEach((lead, index) => {
    if (!lead.duplicateSame && !lead.duplicateOther) return;
    const hasExisting = duplicates.some((dup) => dup.leadId === lead.id);
    if (hasExisting) return;

    if (lead.duplicateSame) {
      const placeholder: NormalizedLead = {
        id: `${lead.id}-flag-same-${index}`,
        createdAt: lead.createdAt,
        partner: lead.partner,
      };
      duplicates.push({
        id: `${lead.id}-flag-same`,
        leadId: lead.id,
        matchedLeadId: placeholder.id,
        rule: "flag",
        type: "same_partner",
        createdAt: lead.createdAt,
        original: lead,
        matched: placeholder,
      });
    }

    if (lead.duplicateOther) {
      const placeholder: NormalizedLead = {
        id: `${lead.id}-flag-other-${index}`,
        createdAt: lead.createdAt,
        partner: lead.partner ? "Otro partner" : undefined,
      };
      duplicates.push({
        id: `${lead.id}-flag-other`,
        leadId: lead.id,
        matchedLeadId: placeholder.id,
        rule: "flag",
        type: "other_partners",
        createdAt: lead.createdAt,
        original: lead,
        matched: placeholder,
      });
    }
  });

  return duplicates;
}

export function buildMetrics(
  leads: NormalizedLead[],
  duplicates: LeadDuplicate[],
  b2bLeads: NormalizedLead[] = []
) {
  const now = new Date();
  const daysAgo = (days: number) => new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

  const last30 = daysAgo(30);
  const last90 = daysAgo(90);

  const leads30 = leads.filter((lead) => lead.createdAt >= last30);
  const leadsCreated = leads30.length;
  const totalLeads = leads.length;
  const leadsContacted = leads30.filter((lead) => lead.status === "contacted").length;
  const leadsWon = leads30.filter((lead) => lead.status === "won" || lead.status === "converted").length;
  const lostLeads = leads.filter((lead) => !!lead.lossReason?.toString().trim()).length;
  const activeLeads = totalLeads - lostLeads;
  const bankSubmissionCount = leads.filter(
    (lead) => lead.stage?.toLowerCase() === "bank submission"
  ).length;

  const duplicateSource = b2bLeads.length > 0 ? b2bLeads : leads;
  const duplicates30 = duplicateSource.filter((lead) => lead.createdAt >= last30);
  const duplicatesSame = duplicates30.filter((lead) => lead.duplicateSame).length;
  const duplicatesOther = duplicates30.filter((lead) => lead.duplicateOther).length;

  const conversionRate = leadsCreated > 0 ? (leadsWon / leadsCreated) * 100 : 0;
  const bankSubmissionRate = totalLeads > 0 ? (bankSubmissionCount / totalLeads) * 100 : 0;

  const dailySource = b2bLeads.length > 0 ? b2bLeads : leads;
  const daily = Array.from({ length: 30 }, (_, index) => {
    const day = new Date(now.getFullYear(), now.getMonth(), now.getDate() - (29 - index));
    const dayKey = day.toISOString().slice(0, 10);
    const leadsForDay = dailySource.filter(
      (lead) => lead.createdAt.toISOString().slice(0, 10) === dayKey
    );
    const converted = leadsForDay.filter((lead) => lead.status === "won" || lead.status === "converted").length;
    return { day: dayKey, leads: leadsForDay.length, converted };
  });

  const weeklyMap = new Map<string, { same: number; other: number }>();
  duplicateSource
    .filter((lead) => lead.createdAt >= last90)
    .forEach((lead) => {
      const date = new Date(lead.createdAt);
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - date.getDay());
      const weekKey = weekStart.toISOString().slice(0, 10);
      const entry = weeklyMap.get(weekKey) ?? { same: 0, other: 0 };
      if (lead.duplicateSame) entry.same += 1;
      if (lead.duplicateOther) entry.other += 1;
      weeklyMap.set(weekKey, entry);
    });

  const weekly = Array.from(weeklyMap.entries())
    .sort((a, b) => (a[0] > b[0] ? 1 : -1))
    .map(([week, counts]) => ({
      week,
      same: counts.same,
      other: counts.other,
    }));

  return {
    summary: {
      totalLeads,
      activeLeads,
      lostLeads,
      leadsCreated,
      leadsContacted,
      leadsWon,
      duplicatesSame,
      duplicatesOther,
      conversionRate,
      bankSubmissionCount,
      bankSubmissionRate,
    },
    daily,
    weekly,
  };
}

