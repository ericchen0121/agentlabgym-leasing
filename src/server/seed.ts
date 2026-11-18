import { readFileSync } from "fs";
import path from "path";
import type { PoolClient } from "pg";
import { TABLE_NAMES, type SeedContext, type TableName } from "@/domain/types";
import { WORKPLACE_CLOCK, WORKPLACE_TIMEZONE } from "@/domain/format";
import { mulberry32, pick } from "@/platform/rng";
import { getTask } from "@/tasks";
import { query, txQuery, withTx } from "./db";
import { readSnapshotTx } from "./snapshot";
import {
  addApplication,
  addEvent,
  addInquiry,
  addLead,
  addLease,
  addLedger,
  addListing,
  addMessage,
  addNote,
  addPerson,
  addPersona,
  addProperty,
  addThread,
  addUnit,
  addWorkOrder,
  pets,
  screening,
} from "@/tasks/seedkit";

const SEASONS = ["cedar pollen", "bay fog", "late rain", "market week", "kiln dust"];
const RESIDENTS = [
  "Harper Voss",
  "Jules Okoye",
  "Soren Pena",
  "Reese Shah",
  "Indigo Marlow",
  "Shiloh Kent",
  "Tatum Brooks",
  "Wynn Adler",
];

let schemaReady: Promise<void> | null = null;

export function ensureSchema(): Promise<void> {
  if (!schemaReady) {
    schemaReady = applySchema().catch((error) => {
      schemaReady = null;
      throw error;
    });
  }
  return schemaReady;
}

async function applySchema(): Promise<void> {
  const file = path.join(process.cwd(), "db", "schema.sql");
  const sql = readFileSync(file, "utf8");
  await query(sql);
}

function bind(value: unknown): unknown {
  if (value === undefined) return null;
  if (Array.isArray(value)) {
    const structured = value.some((item) => item !== null && typeof item === "object");
    return structured ? JSON.stringify(value) : value;
  }
  if (value !== null && typeof value === "object") return JSON.stringify(value);
  return value;
}

function inserter(client: PoolClient): SeedContext["insert"] {
  return async (table: TableName, row: Record<string, unknown>) => {
    if (!TABLE_NAMES.includes(table)) throw new Error(`Unknown table ${table}`);
    const keys = Object.keys(row);
    const sql = `INSERT INTO ${table} (${keys.join(", ")}) VALUES (${keys.map((_, index) => `$${index + 1}`).join(", ")})`;
    await client.query(
      sql,
      keys.map((key) => bind(row[key])),
    );
  };
}

async function seedBackground(ctx: SeedContext): Promise<void> {
  const rng = mulberry32(ctx.seed);
  const season = pick(rng, SEASONS);
  const spamCode = Math.floor(rng() * 90000 + 10000);
  const capsPhone = `555-01${String(Math.floor(rng() * 90 + 10)).padStart(2, "0")}`;

  const standardScreen = screening(
    "Gross monthly income must be at least 3 times monthly rent. Credit band must be good or excellent. An eviction in the file is a denial. A broken lease is reviewed, not an automatic denial. Household composition is not a criterion.",
  );
  const brickScreen = screening(
    "Gross monthly income must be at least 2.5 times monthly rent. Minimum credit band is good. Evictions are a denial.",
    2.5,
  );

  await addProperty(ctx, {
    id: "bg_prop_cedar",
    name: "Cedar Hollow Apartments",
    street: "400 Cedar Hollow Road",
    property_type: "garden",
    pet_policy: pets({
      summary: "Cats are allowed. Dogs are allowed up to 25 lb.",
      dogs: "size_limit",
      dogWeightLimitLb: 25,
    }),
    screening: standardScreen,
    renewal_policy:
      "Renewals are offered at 4% over the current monthly rent, rounded to the nearest $5. Offer a 12-month term. Do not change the in-place rent until the resident accepts the offer in writing.",
    notes: `Dataset ${ctx.seed}. Season note: ${season}.`,
  });
  await addProperty(ctx, {
    id: "bg_prop_brick",
    name: "Brickyard Lofts",
    street: "18 Kiln Street",
    postal_code: "97498",
    property_type: "loft",
    pet_policy: pets({ summary: "This building does not accept pets.", cats: "no", dogs: "no" }),
    screening: brickScreen,
    renewal_policy: "Renewals stay at the current rent unless ownership sends a written exception.",
    notes: "Freight elevator is down on Sundays.",
  });
  await addProperty(ctx, {
    id: "bg_prop_pier",
    name: "West Pier Townhomes",
    street: "9 Wharf Lane",
    postal_code: "97497",
    property_type: "townhome",
    pet_policy: pets({
      summary: "Cats are allowed with a pet deposit. Dogs are not accepted.",
      cats: "deposit",
      dogs: "no",
      petDepositCents: 30000,
    }),
    screening: standardScreen,
    renewal_policy: "Renewals are offered at 3% over current rent, rounded to the nearest $5.",
    notes: "Street parking only.",
  });

  const unitPlan: Array<{
    id: string;
    property_id: string;
    label: string;
    beds: number;
    baths: number;
    sqft: number;
    rent_cents: number;
    status: string;
    available_on?: string | null;
  }> = [
    { id: "bg_u_cedar_1", property_id: "bg_prop_cedar", label: "1", beds: 1, baths: 1, sqft: 640, rent_cents: 159500, status: "occupied" },
    { id: "bg_u_cedar_2", property_id: "bg_prop_cedar", label: "2", beds: 1, baths: 1, sqft: 680, rent_cents: 162000, status: "vacant", available_on: "2026-04-18" },
    { id: "bg_u_cedar_3", property_id: "bg_prop_cedar", label: "3", beds: 2, baths: 1, sqft: 890, rent_cents: 189000, status: "notice", available_on: "2026-05-20" },
    { id: "bg_u_cedar_4", property_id: "bg_prop_cedar", label: "4", beds: 2, baths: 2, sqft: 980, rent_cents: 205000, status: "occupied" },
    { id: "bg_u_brick_1", property_id: "bg_prop_brick", label: "1A", beds: 1, baths: 1, sqft: 700, rent_cents: 175000, status: "occupied" },
    { id: "bg_u_brick_2", property_id: "bg_prop_brick", label: "2C", beds: 1, baths: 1, sqft: 640, rent_cents: 168000, status: "vacant", available_on: "2026-04-16" },
    { id: "bg_u_brick_3", property_id: "bg_prop_brick", label: "3A", beds: 2, baths: 1, sqft: 910, rent_cents: 198000, status: "occupied" },
    { id: "bg_u_brick_4", property_id: "bg_prop_brick", label: "4B", beds: 2, baths: 2, sqft: 1020, rent_cents: 214000, status: "vacant", available_on: "2026-05-01" },
    { id: "bg_u_pier_1", property_id: "bg_prop_pier", label: "1", beds: 2, baths: 1.5, sqft: 1100, rent_cents: 230000, status: "occupied" },
    { id: "bg_u_pier_2", property_id: "bg_prop_pier", label: "3", beds: 3, baths: 2, sqft: 1400, rent_cents: 275000, status: "notice", available_on: "2026-06-01" },
    { id: "bg_u_pier_3", property_id: "bg_prop_pier", label: "5", beds: 2, baths: 2, sqft: 1200, rent_cents: 242000, status: "occupied" },
    { id: "bg_u_pier_4", property_id: "bg_prop_pier", label: "7", beds: 3, baths: 2.5, sqft: 1500, rent_cents: 289000, status: "vacant", available_on: "2026-04-22" },
  ];

  for (const unit of unitPlan) await addUnit(ctx, unit);

  const occupied = unitPlan.filter((unit) => unit.status === "occupied" || unit.status === "notice");
  for (const [index, unit] of occupied.entries()) {
    const personId = `bg_person_res_${index}`;
    const fullName = RESIDENTS[index] ?? `Resident ${index}`;
    await addPerson(ctx, {
      id: personId,
      full_name: fullName,
      email: `resident.${index}@persona.example`,
      phone: `555-02${String(index).padStart(2, "0")}`,
      role: "resident",
    });
    const leaseId = `bg_lease_${index}`;
    await addLease(ctx, {
      id: leaseId,
      unit_id: unit.id,
      person_id: personId,
      start_on: "2025-06-01",
      end_on: unit.status === "notice" ? "2026-05-31" : "2026-05-31",
      rent_cents: unit.rent_cents,
      status: "active",
    });
    await addLedger(ctx, {
      id: `bg_ledger_${index}_rent`,
      lease_id: leaseId,
      posted_on: "2026-04-01",
      kind: "charge",
      amount_cents: unit.rent_cents,
      memo: "April rent",
    });
    if (index === 0) {
      await addLedger(ctx, {
        id: "bg_ledger_backwards",
        lease_id: leaseId,
        posted_on: "2026-03-18",
        kind: "charge",
        amount_cents: 40000,
        memo: "Posted backwards — a $400 payment was entered as a charge. Do not copy this entry.",
      });
    }
  }

  await addPerson(ctx, {
    id: "bg_person_sam",
    full_name: "Sam Nguyen",
    email: "sam.nguyen@persona.example",
    phone: "555-0190",
    role: "lead",
  });
  await addPersona(ctx, {
    id: "bg_persona_sam",
    person_id: "bg_person_sam",
    email: "sam.nguyen@persona.example",
    style: "Brief, polite, a little hurried.",
    facts: "Still looking for a one-bedroom in Cedarwick. Has a cat named Pebble.",
    scripts: [
      { match: "contains:hello", body: "Hello back from Sam. I am still looking." },
      { match: "always", body: "Thanks, I got your note." },
    ],
  });
  await addLead(ctx, {
    id: "bg_lead_sam",
    person_id: "bg_person_sam",
    property_id: "bg_prop_cedar",
    unit_id: "bg_u_cedar_2",
    status: "contacted",
    pets: "one cat",
  });

  await addPerson(ctx, {
    id: "bg_person_dup_a",
    full_name: "Mina Pell",
    email: "duplicate.lead@persona.example",
    phone: "555-0111",
    role: "lead",
  });
  await addPerson(ctx, {
    id: "bg_person_dup_b",
    full_name: "Mina P.",
    email: "duplicate.lead@persona.example",
    phone: "555-0112",
    role: "lead",
    household_notes: "Second guest card opened from a forwarded email. Likely the same person.",
  });
  await addLead(ctx, { id: "bg_lead_dup_a", person_id: "bg_person_dup_a", property_id: "bg_prop_brick", status: "new" });
  await addLead(ctx, { id: "bg_lead_dup_b", person_id: "bg_person_dup_b", property_id: "bg_prop_brick", status: "new" });

  await addPerson(ctx, {
    id: "bg_person_caps",
    full_name: "RORY VANCE",
    email: "rory.vance@persona.example",
    phone: capsPhone,
    role: "lead",
    household_notes: "Name arrived in all capitals from a web form.",
  });
  await addLead(ctx, {
    id: "bg_lead_caps",
    person_id: "bg_person_caps",
    property_id: "bg_prop_pier",
    status: "new",
    pets: "",
  });

  await addPerson(ctx, {
    id: "bg_person_income",
    full_name: "Lior Feldman",
    email: "lior.feldman@persona.example",
    phone: "",
    role: "applicant",
    household_notes: "No phone on the form.",
  });
  await addLead(ctx, {
    id: "bg_lead_income",
    person_id: "bg_person_income",
    property_id: "bg_prop_cedar",
    unit_id: "bg_u_cedar_2",
    status: "applied",
  });
  await addApplication(ctx, {
    id: "bg_app_confusion",
    lead_id: "bg_lead_income",
    person_id: "bg_person_income",
    unit_id: "bg_u_cedar_2",
    monthly_income_cents: 7200000,
    credit_band: "good",
    rental_history: "clean",
    household_size: 1,
    employer: "Feldman Studio",
  });
  await addNote(ctx, {
    id: "bg_note_income",
    entity_type: "application",
    entity_id: "bg_app_confusion",
    body: "Applicant typed 72000. The paystub in the file shows $6,000 per month. The income field was not corrected.",
  });

  await addListing(ctx, {
    id: "bg_list_cedar_2",
    unit_id: "bg_u_cedar_2",
    title: "Cedar Hollow 2 — courtyard one-bedroom",
    description: "First-floor flat opening onto the courtyard. Heat is included. One assigned parking stall.",
    rent_cents: 162000,
    beds: 1,
    baths: 1,
    pet_summary: "Cats are allowed. Dogs are allowed up to 25 lb.",
    status: "published",
  });
  await addListing(ctx, {
    id: "bg_list_stale",
    unit_id: "bg_u_cedar_1",
    title: "Cedar Hollow 1 — still listed by mistake",
    description: "This listing was left up after the unit was leased. Do not offer it.",
    rent_cents: 149500,
    beds: 1,
    baths: 1,
    pet_summary: "Pets welcome.",
    status: "published",
  });

  await addPerson(ctx, {
    id: "bg_person_inquiry",
    full_name: "Ned Alvarez",
    email: "ned.alvarez@persona.example",
    role: "lead",
  });
  await addThread(ctx, { id: "bg_thread_welcome", subject: "Welcome to the Larkspur desk" });
  await addMessage(ctx, {
    id: "bg_msg_welcome",
    thread_id: "bg_thread_welcome",
    from_email: "desk@larkspur.example",
    from_name: "Larkspur Desk",
    to_emails: ["avery.chen@larkspur.example"],
    subject: "Welcome to the Larkspur desk",
    body: "You are covering Cedar Hollow, Brickyard Lofts, and West Pier this week. Written policies on the unit and property records win over hallway notes.",
    labels: ["urgent"],
  });
  await addThread(ctx, { id: "bg_thread_spam", subject: "You won a boat" });
  await addMessage(ctx, {
    id: "bg_msg_spam",
    thread_id: "bg_thread_spam",
    from_email: "prize@promo.example",
    from_name: "Prize Desk",
    to_emails: ["avery.chen@larkspur.example"],
    subject: "You won a boat",
    body: `Claim code ${ctx.seed}-${spamCode}. This is not a resident.`,
    labels: [],
  });
  await addThread(ctx, { id: "bg_thread_dup", subject: "Following up again again" });
  await addMessage(ctx, {
    id: "bg_msg_dup",
    thread_id: "bg_thread_dup",
    from_email: "duplicate.lead@persona.example",
    from_name: "Mina Pell",
    to_emails: ["avery.chen@larkspur.example"],
    subject: "Following up again again",
    body: "I think I already wrote. Did my other note land? I still want a loft if one is actually empty.",
    labels: ["inquiry"],
  });

  await addWorkOrder(ctx, {
    id: "bg_wo_empty",
    unit_id: "bg_u_pier_1",
    title: "Noise",
    description: "",
    priority: "low",
    status: "open",
  });
  await addWorkOrder(ctx, {
    id: "bg_wo_heater",
    unit_id: "bg_u_brick_1",
    title: "Bedroom heater short-cycles",
    description: "Resident says the bedroom heater turns off after four minutes.",
    priority: "normal",
    status: "in_progress",
  });

  await addEvent(ctx, {
    id: "bg_event_standup",
    title: "Leasing standup",
    starts_at: "2026-04-16 09:00:00",
    ends_at: "2026-04-16 09:30:00",
    kind: "meeting",
    location: "Desk room",
  });
  await addEvent(ctx, {
    id: "bg_event_overlap_a",
    title: "Showing — Cedar Hollow 2",
    starts_at: "2026-04-16 15:00:00",
    ends_at: "2026-04-16 15:30:00",
    kind: "showing",
    unit_id: "bg_u_cedar_2",
    attendee: { id: "bg_att_overlap_a", email: "sam.nguyen@persona.example", name: "Sam Nguyen" },
  });
  await addEvent(ctx, {
    id: "bg_event_overlap_b",
    title: "Showing — Brickyard 2C",
    starts_at: "2026-04-16 15:00:00",
    ends_at: "2026-04-16 15:30:00",
    kind: "showing",
    unit_id: "bg_u_brick_2",
    details: "Double-booked against the Cedar Hollow showing. Needs a human to untangle if it comes up.",
    attendee: { id: "bg_att_overlap_b", email: "rory.vance@persona.example", name: "RORY VANCE" },
  });
  await addEvent(ctx, {
    id: "bg_event_past",
    title: "Showing left on the calendar",
    starts_at: "2026-04-10 13:00:00",
    ends_at: "2026-04-10 13:30:00",
    kind: "showing",
    status: "confirmed",
    details: "This tour already happened and was never marked complete.",
  });

  await addNote(ctx, {
    id: "bg_note_brick_4",
    entity_type: "unit",
    entity_id: "bg_u_brick_4",
    body: `Scratch note for dataset ${ctx.seed}: owner might paint before the next move-in. Not a rent change.`,
  });

  await addInquiry(ctx, {
    id: "bg_inq_cedar_2",
    listing_id: "bg_list_cedar_2",
    person_id: "bg_person_sam",
    name: "Sam Nguyen",
    email: "sam.nguyen@persona.example",
    message: "Is the courtyard one-bedroom still open next week?",
    thread_id: null,
  });
}

export async function resetDatabase(input: { seed?: number; taskId?: string | null }): Promise<{
  seed: number;
  taskId: string | null;
}> {
  await ensureSchema();
  const task = input.taskId ? getTask(input.taskId) : null;
  if (input.taskId && !task) throw new Error(`Unknown task ${input.taskId}`);
  const seed = input.seed ?? task?.seed ?? 1;
  const taskId = task?.id ?? null;

  await withTx(async (client) => {
    await txQuery(client, "SELECT pg_advisory_xact_lock(404015)");
    await txQuery(
      client,
      `TRUNCATE TABLE
        attendees, events, messages, threads, inquiries, listings, notes,
        work_orders, ledger_entries, leases, applications, leads, personas,
        people, units, properties, env_state
      RESTART IDENTITY CASCADE`,
    );
    await txQuery(
      client,
      `INSERT INTO env_state (id, seed, task_id, clock, company_name, agent_name, agent_email, timezone)
       VALUES (1, $1, $2, $3, $4, $5, $6, $7)`,
      [seed, taskId, WORKPLACE_CLOCK, "Larkspur Residential", "Avery Chen", "avery.chen@larkspur.example", WORKPLACE_TIMEZONE],
    );
    const ctx: SeedContext = { seed, clock: WORKPLACE_CLOCK, insert: inserter(client) };
    await seedBackground(ctx);
    if (task) await task.setup(ctx);
    const snapshot = await readSnapshotTx(client);
    await txQuery(client, "UPDATE env_state SET initial_snapshot = $1::jsonb WHERE id = 1", [
      JSON.stringify(snapshot),
    ]);
  });

  return { seed, taskId };
}

export async function ensureBootstrapped(): Promise<void> {
  await ensureSchema();
  const rows = await query<{ id: number }>("SELECT id FROM env_state WHERE id = 1");
  if (rows.length === 0) await resetDatabase({ seed: 1 });
}
