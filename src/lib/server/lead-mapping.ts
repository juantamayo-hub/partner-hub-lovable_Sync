import "server-only";

export type RawLead = {
  email?: string;
  phone?: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  status?: string;
  stage?: string;
  source?: string;
  createdAt?: string;
  partner?: string;
  orgName?: string;
  dealId?: string;
  lossReason?: string;
  duplicateSame?: string;
  duplicateOther?: string;
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

export function mapSheetRows(rows: string[][]): RawLead[] {
  if (rows.length === 0) return [];
  const headers = rows[0];
  const dataRows = rows.slice(1);

  // Bayteca_leads_2026: Person name (E), Organization name (D), Lost reason Opportunity (R), Stage name (I)
  // B2B Copy: Name (B), Phone Numb (C), Email (D), Lead Source (G)
  const emailIndex = findHeaderIndex(headers, [
    "email",
    "Contact email 1T",
  ]);
  const phoneIndex = findHeaderIndex(headers, [
    "Contact phone 1T",
    "phone"
  ]);
  const nameIndex = findHeaderIndex(headers, [
    "person_name",
    "person name",
    "name",
    "full_name",
    "full name",
    "nombre_completo",
    "nombre completo",
    "contact name",
    "lead name",
    "nombre",
  ]);
  const firstNameIndex = findHeaderIndex(headers, [
    "first_name",
    "first name",
    "nombre",
    "given name",
    "nombre_first",
  ]);
  const lastNameIndex = findHeaderIndex(headers, [
    "last_name",
    "last name",
    "apellido",
    "apellidos",
    "family name",
  ]);
  const statusIndex = findHeaderIndex(headers, ["status", "estado"]);
  const stageIndex = findHeaderIndex(headers, [
    "stage_name",
    "stage name",
    "stage",
    "etapa",
    "fase",
    "pipeline_stage",
    "pipeline",
  ]);
  const sourceIndex = findHeaderIndex(headers, [
    "organization_name",
    "organization name",
    "lead source",
    "lead_source",
    "source",
    "fuente",
    "origen",
  ]);
  const createdAtIndex = findHeaderIndex(headers, [
    "created_at",
    "created",
    "fecha",
    "date",
    "timestamp",
    "deal created",
  ]);
  const partnerIndex = findHeaderIndex(headers, [
    "partner",
    "partner_name",
    "org",
    "org_name",
    "company",
    "empresa",
  ]);
  const orgNameIndex = findHeaderIndex(headers, [
    "organization_name",
    "organization name",
    "org_name",
    "organization",
  ]);
  const dealIdIndex = findHeaderIndex(headers, ["deal_id", "deal id", "id", "record_id"]);
  const lossReasonIndex = findHeaderIndex(headers, [
    "lost_reason_opportunity",
    "lost reason opportunity",
    "[residents] loss reason opportunity",
    "[residents] lost reason opportunity",
    "loss reason",
    "loss_reason",
    "motivo cierre",
    "motivo_cierre",
  ]);
  const duplicateSameIndex = findHeaderIndex(headers, ["duplicados", "dup_same", "duplicate_same"]);
  const duplicateOtherIndex = findHeaderIndex(headers, [
    "duplicado_otros_partners",
    "duplicado_otro_partner",
    "dup_other",
    "duplicate_other",
  ]);

  return dataRows
    .filter((row) => row.some((cell) => String(cell || "").trim().length > 0))
    .map((row) => ({
      email: emailIndex >= 0 ? row[emailIndex]?.toString().trim() : undefined,
      phone: phoneIndex >= 0 ? row[phoneIndex]?.toString().trim() : undefined,
      name: nameIndex >= 0 ? row[nameIndex]?.toString().trim() : undefined,
      firstName: firstNameIndex >= 0 ? row[firstNameIndex]?.toString().trim() : undefined,
      lastName: lastNameIndex >= 0 ? row[lastNameIndex]?.toString().trim() : undefined,
      status: statusIndex >= 0 ? row[statusIndex]?.toString().trim() : undefined,
      stage: stageIndex >= 0 ? row[stageIndex]?.toString().trim() : undefined,
      source: sourceIndex >= 0 ? row[sourceIndex]?.toString().trim() : undefined,
      createdAt: createdAtIndex >= 0 ? row[createdAtIndex]?.toString().trim() : undefined,
      partner: partnerIndex >= 0 ? row[partnerIndex]?.toString().trim() : undefined,
      orgName: orgNameIndex >= 0 ? row[orgNameIndex]?.toString().trim() : undefined,
      dealId: dealIdIndex >= 0 ? row[dealIdIndex]?.toString().trim() : undefined,
      lossReason: lossReasonIndex >= 0 ? row[lossReasonIndex]?.toString().trim() : undefined,
      duplicateSame: duplicateSameIndex >= 0 ? row[duplicateSameIndex]?.toString().trim() : undefined,
      duplicateOther: duplicateOtherIndex >= 0 ? row[duplicateOtherIndex]?.toString().trim() : undefined,
    }));
}

