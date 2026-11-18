export type PetRule = "allowed" | "deposit" | "no" | "size_limit";

export type PetPolicy = {
  cats: "allowed" | "deposit" | "no";
  dogs: PetRule;
  dogWeightLimitLb?: number;
  petDepositCents?: number;
  petRentCents?: number;
  summary: string;
};

export type CreditBand = "excellent" | "good" | "fair" | "poor" | "none";

export type Screening = {
  incomeMultiple: number;
  minCredit: CreditBand;
  eviction: "deny" | "review";
  brokenLease: "deny" | "review" | "allow";
  written: string;
};

export type PersonaScript = {
  match: "always" | `contains:${string}`;
  body: string;
};

export type EnvMeta = {
  seed: number;
  task_id: string | null;
  clock: string;
  company_name: string;
  agent_name: string;
  agent_email: string;
  timezone: string;
};

export type Property = {
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
  seeded: boolean;
};

export type Unit = {
  id: string;
  property_id: string;
  label: string;
  beds: number;
  baths: number;
  sqft: number;
  rent_cents: number;
  deposit_cents: number;
  status: string;
  available_on: string | null;
  pet_policy: PetPolicy | null;
  description: string;
  seeded: boolean;
};

export type Person = {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  role: string;
  household_notes: string;
  seeded: boolean;
};

export type Persona = {
  id: string;
  person_id: string | null;
  email: string;
  style: string;
  facts: string;
  scripts: PersonaScript[];
  seeded: boolean;
};

export type Lead = {
  id: string;
  person_id: string;
  property_id: string | null;
  unit_id: string | null;
  source: string;
  status: string;
  desired_move_in: string | null;
  beds_wanted: number | null;
  budget_cents: number | null;
  pets: string;
  toured_on: string | null;
  seeded: boolean;
};

export type Application = {
  id: string;
  lead_id: string | null;
  person_id: string;
  unit_id: string;
  status: string;
  monthly_income_cents: number;
  credit_band: string;
  rental_history: string;
  household_size: number;
  employer: string;
  move_in_on: string | null;
  decision_note: string;
  seeded: boolean;
};

export type Lease = {
  id: string;
  unit_id: string;
  person_id: string;
  start_on: string;
  end_on: string;
  rent_cents: number;
  deposit_cents: number;
  status: string;
  seeded: boolean;
};

export type LedgerEntry = {
  id: string;
  lease_id: string;
  posted_on: string;
  kind: string;
  amount_cents: number;
  memo: string;
  seeded: boolean;
};

export type WorkOrder = {
  id: string;
  unit_id: string;
  lease_id: string | null;
  title: string;
  description: string;
  priority: string;
  status: string;
  seeded: boolean;
};

export type Note = {
  id: string;
  entity_type: string;
  entity_id: string;
  author: string;
  body: string;
  created_at: string;
  seeded: boolean;
};

export type Listing = {
  id: string;
  unit_id: string;
  title: string;
  description: string;
  rent_cents: number;
  beds: number;
  baths: number;
  pet_summary: string;
  status: string;
  seeded: boolean;
};

export type Inquiry = {
  id: string;
  listing_id: string;
  person_id: string | null;
  name: string;
  email: string;
  message: string;
  status: string;
  thread_id: string | null;
  created_at: string;
  seeded: boolean;
};

export type Thread = {
  id: string;
  subject: string;
  seeded: boolean;
};

export type Message = {
  id: string;
  thread_id: string;
  direction: string;
  from_email: string;
  from_name: string;
  to_emails: string[];
  cc_emails: string[];
  subject: string;
  body: string;
  folder: string;
  labels: string[];
  is_read: boolean;
  sent_at: string;
  seeded: boolean;
};

export type CalendarEvent = {
  id: string;
  title: string;
  starts_at: string;
  ends_at: string;
  location: string;
  details: string;
  kind: string;
  status: string;
  unit_id: string | null;
  seeded: boolean;
};

export type Attendee = {
  id: string;
  event_id: string;
  email: string;
  name: string;
  response: string;
  seeded: boolean;
};

export type Snapshot = {
  meta: EnvMeta;
  properties: Property[];
  units: Unit[];
  people: Person[];
  personas: Persona[];
  leads: Lead[];
  applications: Application[];
  leases: Lease[];
  ledger: LedgerEntry[];
  workOrders: WorkOrder[];
  notes: Note[];
  listings: Listing[];
  inquiries: Inquiry[];
  threads: Thread[];
  messages: Message[];
  events: CalendarEvent[];
  attendees: Attendee[];
};

export const TABLE_NAMES = [
  "properties",
  "units",
  "people",
  "personas",
  "leads",
  "applications",
  "leases",
  "ledger_entries",
  "work_orders",
  "notes",
  "listings",
  "inquiries",
  "threads",
  "messages",
  "events",
  "attendees",
] as const;

export type TableName = (typeof TABLE_NAMES)[number];

export type SeedContext = {
  seed: number;
  clock: string;
  insert: (table: TableName, row: Record<string, unknown>) => Promise<void>;
};
