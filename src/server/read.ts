import type { PetPolicy, Screening } from "@/domain/types";
import { query, queryOne } from "./db";

export type Meta = {
  seed: number;
  task_id: string | null;
  clock: string;
  company_name: string;
  agent_name: string;
  agent_email: string;
  timezone: string;
};

export async function getMeta(): Promise<Meta> {
  const row = await queryOne<Meta>(
    "SELECT seed, task_id, clock::text, company_name, agent_name, agent_email, timezone FROM env_state WHERE id = 1",
  );
  if (!row) throw new Error("Environment is not seeded.");
  return { ...row, seed: Number(row.seed), clock: String(row.clock).replace("T", " ").slice(0, 19) };
}

export type PropertyView = {
  id: string;
  name: string;
  street: string;
  city: string;
  region: string;
  postal_code: string;
  property_type: string;
  pet_policy: PetPolicy;
  screening: Screening;
  renewal_policy: string;
  notes: string;
  unit_count: number;
};

export async function listProperties(): Promise<PropertyView[]> {
  return query<PropertyView>(
    `SELECT p.*, (SELECT count(*)::int FROM units u WHERE u.property_id = p.id) AS unit_count
     FROM properties p ORDER BY p.name`,
  );
}

export async function getProperty(id: string): Promise<PropertyView | null> {
  return queryOne<PropertyView>(
    `SELECT p.*, (SELECT count(*)::int FROM units u WHERE u.property_id = p.id) AS unit_count
     FROM properties p WHERE p.id = $1`,
    [id],
  );
}

export type UnitView = {
  id: string;
  property_id: string;
  property_name: string;
  label: string;
  beds: number;
  baths: number;
  sqft: number;
  rent_cents: number;
  deposit_cents: number;
  status: string;
  available_on: string | null;
  pet_policy: PetPolicy | null;
  property_pet_policy: PetPolicy;
  screening: Screening;
  renewal_policy: string;
  description: string;
};

const UNIT_SQL = `
  SELECT u.id, u.property_id, p.name AS property_name, u.label, u.beds, u.baths, u.sqft,
         u.rent_cents, u.deposit_cents, u.status, u.available_on::text, u.pet_policy, u.description,
         p.pet_policy AS property_pet_policy, p.screening, p.renewal_policy
  FROM units u JOIN properties p ON p.id = u.property_id
`;

export async function listUnits(propertyId?: string): Promise<UnitView[]> {
  if (propertyId) {
    return query<UnitView>(`${UNIT_SQL} WHERE u.property_id = $1 ORDER BY u.label`, [propertyId]);
  }
  return query<UnitView>(`${UNIT_SQL} ORDER BY p.name, u.label`);
}

export async function getUnit(id: string): Promise<UnitView | null> {
  return queryOne<UnitView>(`${UNIT_SQL} WHERE u.id = $1`, [id]);
}

export type LeadView = {
  id: string;
  person_id: string;
  full_name: string;
  email: string;
  phone: string;
  household_notes: string;
  property_id: string | null;
  property_name: string | null;
  unit_id: string | null;
  unit_label: string | null;
  source: string;
  status: string;
  desired_move_in: string | null;
  beds_wanted: number | null;
  budget_cents: number | null;
  pets: string;
  toured_on: string | null;
};

const LEAD_SQL = `
  SELECT l.id, l.person_id, pe.full_name, pe.email, pe.phone, pe.household_notes,
         l.property_id, pr.name AS property_name, l.unit_id, u.label AS unit_label,
         l.source, l.status, l.desired_move_in::text, l.beds_wanted, l.budget_cents, l.pets, l.toured_on::text
  FROM leads l
  JOIN people pe ON pe.id = l.person_id
  LEFT JOIN properties pr ON pr.id = l.property_id
  LEFT JOIN units u ON u.id = l.unit_id
`;

export async function listLeads(): Promise<LeadView[]> {
  return query<LeadView>(`${LEAD_SQL} ORDER BY pe.full_name`);
}

export async function getLead(id: string): Promise<LeadView | null> {
  return queryOne<LeadView>(`${LEAD_SQL} WHERE l.id = $1`, [id]);
}

export type ApplicationView = {
  id: string;
  lead_id: string | null;
  person_id: string;
  full_name: string;
  email: string;
  household_notes: string;
  unit_id: string;
  unit_label: string;
  property_name: string;
  property_id: string;
  rent_cents: number;
  screening: Screening;
  status: string;
  monthly_income_cents: number;
  credit_band: string;
  rental_history: string;
  household_size: number;
  employer: string;
  move_in_on: string | null;
  decision_note: string;
};

export async function listApplications(): Promise<ApplicationView[]> {
  return query<ApplicationView>(
    `SELECT a.id, a.lead_id, a.person_id, pe.full_name, pe.email, pe.household_notes,
            a.unit_id, u.label AS unit_label, p.name AS property_name, p.id AS property_id, u.rent_cents, p.screening,
            a.status, a.monthly_income_cents, a.credit_band, a.rental_history, a.household_size,
            a.employer, a.move_in_on::text, a.decision_note
     FROM applications a
     JOIN people pe ON pe.id = a.person_id
     JOIN units u ON u.id = a.unit_id
     JOIN properties p ON p.id = u.property_id
     ORDER BY a.status, pe.full_name`,
  );
}

export async function getApplication(id: string): Promise<ApplicationView | null> {
  return queryOne<ApplicationView>(
    `SELECT a.id, a.lead_id, a.person_id, pe.full_name, pe.email, pe.household_notes,
            a.unit_id, u.label AS unit_label, p.name AS property_name, p.id AS property_id, u.rent_cents, p.screening,
            a.status, a.monthly_income_cents, a.credit_band, a.rental_history, a.household_size,
            a.employer, a.move_in_on::text, a.decision_note
     FROM applications a
     JOIN people pe ON pe.id = a.person_id
     JOIN units u ON u.id = a.unit_id
     JOIN properties p ON p.id = u.property_id
     WHERE a.id = $1`,
    [id],
  );
}

export type LeaseView = {
  id: string;
  unit_id: string;
  unit_label: string;
  property_name: string;
  property_id: string;
  renewal_policy: string;
  person_id: string;
  full_name: string;
  email: string;
  start_on: string;
  end_on: string;
  rent_cents: number;
  deposit_cents: number;
  status: string;
};

export async function listLeases(): Promise<LeaseView[]> {
  return query<LeaseView>(
    `SELECT ls.id, ls.unit_id, u.label AS unit_label, p.name AS property_name, p.id AS property_id, p.renewal_policy,
            ls.person_id, pe.full_name, pe.email, ls.start_on::text, ls.end_on::text, ls.rent_cents, ls.deposit_cents, ls.status
     FROM leases ls
     JOIN units u ON u.id = ls.unit_id
     JOIN properties p ON p.id = u.property_id
     JOIN people pe ON pe.id = ls.person_id
     ORDER BY pe.full_name`,
  );
}

export async function getLease(id: string): Promise<LeaseView | null> {
  return queryOne<LeaseView>(
    `SELECT ls.id, ls.unit_id, u.label AS unit_label, p.name AS property_name, p.id AS property_id, p.renewal_policy,
            ls.person_id, pe.full_name, pe.email, ls.start_on::text, ls.end_on::text, ls.rent_cents, ls.deposit_cents, ls.status
     FROM leases ls
     JOIN units u ON u.id = ls.unit_id
     JOIN properties p ON p.id = u.property_id
     JOIN people pe ON pe.id = ls.person_id
     WHERE ls.id = $1`,
    [id],
  );
}

export type LedgerView = {
  id: string;
  lease_id: string;
  posted_on: string;
  kind: string;
  amount_cents: number;
  memo: string;
};

export async function listLedger(leaseId: string): Promise<LedgerView[]> {
  return query<LedgerView>(
    `SELECT id, lease_id, posted_on::text, kind, amount_cents, memo
     FROM ledger_entries WHERE lease_id = $1 ORDER BY posted_on, id`,
    [leaseId],
  );
}

export type WorkOrderView = {
  id: string;
  unit_id: string;
  unit_label: string;
  property_name: string;
  title: string;
  description: string;
  priority: string;
  status: string;
};

export async function listWorkOrders(): Promise<WorkOrderView[]> {
  return query<WorkOrderView>(
    `SELECT w.id, w.unit_id, u.label AS unit_label, p.name AS property_name, w.title, w.description, w.priority, w.status
     FROM work_orders w
     JOIN units u ON u.id = w.unit_id
     JOIN properties p ON p.id = u.property_id
     ORDER BY CASE w.status WHEN 'open' THEN 0 WHEN 'in_progress' THEN 1 ELSE 2 END, w.id`,
  );
}

export type NoteView = {
  id: string;
  entity_type: string;
  entity_id: string;
  author: string;
  body: string;
  created_at: string;
};

export async function listNotes(entityType: string, entityId: string): Promise<NoteView[]> {
  return query<NoteView>(
    `SELECT id, entity_type, entity_id, author, body, created_at::text
     FROM notes WHERE entity_type = $1 AND entity_id = $2 ORDER BY created_at, id`,
    [entityType, entityId],
  );
}

export async function listRecentNotes(): Promise<NoteView[]> {
  return query<NoteView>(
    `SELECT id, entity_type, entity_id, author, body, created_at::text
     FROM notes ORDER BY created_at DESC, id DESC LIMIT 40`,
  );
}

export type ListingView = {
  id: string;
  unit_id: string;
  unit_label: string;
  property_name: string;
  property_id: string;
  title: string;
  description: string;
  rent_cents: number;
  beds: number;
  baths: number;
  pet_summary: string;
  status: string;
  unit_rent_cents: number;
  unit_beds: number;
  unit_baths: number;
  unit_status: string;
  available_on: string | null;
  unit_pet_summary: string;
};

const LISTING_SQL = `
  SELECT l.id, l.unit_id, u.label AS unit_label, p.name AS property_name, p.id AS property_id,
         l.title, l.description, l.rent_cents, l.beds, l.baths, l.pet_summary, l.status,
         u.rent_cents AS unit_rent_cents, u.beds AS unit_beds, u.baths AS unit_baths, u.status AS unit_status,
         u.available_on::text,
         COALESCE(u.pet_policy->>'summary', p.pet_policy->>'summary', '') AS unit_pet_summary
  FROM listings l
  JOIN units u ON u.id = l.unit_id
  JOIN properties p ON p.id = u.property_id
`;

export async function listListings(publishedOnly = false): Promise<ListingView[]> {
  const where = publishedOnly ? "WHERE l.status = 'published'" : "";
  return query<ListingView>(`${LISTING_SQL} ${where} ORDER BY p.name, u.label`);
}

export async function getListing(id: string): Promise<ListingView | null> {
  return queryOne<ListingView>(`${LISTING_SQL} WHERE l.id = $1`, [id]);
}

export type InquiryView = {
  id: string;
  listing_id: string;
  listing_title: string;
  name: string;
  email: string;
  message: string;
  status: string;
  thread_id: string | null;
  created_at: string;
};

export async function listInquiries(): Promise<InquiryView[]> {
  return query<InquiryView>(
    `SELECT i.id, i.listing_id, l.title AS listing_title, i.name, i.email, i.message, i.status, i.thread_id, i.created_at::text
     FROM inquiries i JOIN listings l ON l.id = i.listing_id
     ORDER BY i.created_at DESC, i.id`,
  );
}

export type MessageView = {
  id: string;
  thread_id: string;
  direction: string;
  from_email: string;
  from_name: string;
  to_emails: string[];
  subject: string;
  body: string;
  folder: string;
  labels: string[];
  is_read: boolean;
  sent_at: string;
};

export async function listMessages(input: { folder?: string; q?: string; label?: string }): Promise<MessageView[]> {
  const clauses = ["folder = $1"];
  const params: unknown[] = [input.folder || "inbox"];
  if (input.q) {
    params.push(`%${input.q}%`);
    clauses.push(`(subject ILIKE $${params.length} OR body ILIKE $${params.length} OR from_email ILIKE $${params.length} OR from_name ILIKE $${params.length})`);
  }
  if (input.label) {
    params.push(input.label);
    clauses.push(`$${params.length} = ANY(labels)`);
  }
  return query<MessageView>(
    `SELECT id, thread_id, direction, from_email, from_name, to_emails, subject, body, folder, labels, is_read, sent_at::text
     FROM messages WHERE ${clauses.join(" AND ")} ORDER BY sent_at DESC, id DESC`,
    params,
  );
}

export async function listThread(id: string): Promise<MessageView[]> {
  return query<MessageView>(
    `SELECT id, thread_id, direction, from_email, from_name, to_emails, subject, body, folder, labels, is_read, sent_at::text
     FROM messages WHERE thread_id = $1 ORDER BY sent_at, id`,
    [id],
  );
}

export type EventView = {
  id: string;
  title: string;
  starts_at: string;
  ends_at: string;
  location: string;
  details: string;
  kind: string;
  status: string;
  unit_id: string | null;
  unit_label: string | null;
  property_name: string | null;
  attendee_email: string | null;
  attendee_name: string | null;
};

export async function listEvents(): Promise<EventView[]> {
  return query<EventView>(
    `SELECT e.id, e.title, e.starts_at::text, e.ends_at::text, e.location, e.details, e.kind, e.status, e.unit_id,
            u.label AS unit_label, p.name AS property_name,
            a.email AS attendee_email, a.name AS attendee_name
     FROM events e
     LEFT JOIN units u ON u.id = e.unit_id
     LEFT JOIN properties p ON p.id = u.property_id
     LEFT JOIN LATERAL (
       SELECT email, name FROM attendees WHERE event_id = e.id ORDER BY id LIMIT 1
     ) a ON true
     ORDER BY e.starts_at, e.id`,
  );
}

export async function getEvent(id: string): Promise<EventView | null> {
  return queryOne<EventView>(
    `SELECT e.id, e.title, e.starts_at::text, e.ends_at::text, e.location, e.details, e.kind, e.status, e.unit_id,
            u.label AS unit_label, p.name AS property_name,
            a.email AS attendee_email, a.name AS attendee_name
     FROM events e
     LEFT JOIN units u ON u.id = e.unit_id
     LEFT JOIN properties p ON p.id = u.property_id
     LEFT JOIN LATERAL (
       SELECT email, name FROM attendees WHERE event_id = e.id ORDER BY id LIMIT 1
     ) a ON true
     WHERE e.id = $1`,
    [id],
  );
}

export async function counts(): Promise<{
  units: number;
  leads: number;
  applications: number;
  openWork: number;
  inbox: number;
}> {
  const row = await queryOne<{
    units: number;
    leads: number;
    applications: number;
    open_work: number;
    inbox: number;
  }>(
    `SELECT
       (SELECT count(*)::int FROM units) AS units,
       (SELECT count(*)::int FROM leads) AS leads,
       (SELECT count(*)::int FROM applications WHERE status = 'submitted') AS applications,
       (SELECT count(*)::int FROM work_orders WHERE status IN ('open','in_progress','scheduled')) AS open_work,
       (SELECT count(*)::int FROM messages WHERE folder = 'inbox') AS inbox`,
  );
  return {
    units: row?.units ?? 0,
    leads: row?.leads ?? 0,
    applications: row?.applications ?? 0,
    openWork: row?.open_work ?? 0,
    inbox: row?.inbox ?? 0,
  };
}
