import type { PersonaScript, PetPolicy, Screening, SeedContext } from "@/domain/types";

export async function addProperty(
  ctx: SeedContext,
  row: {
    id: string;
    name: string;
    street: string;
    city?: string;
    region?: string;
    postal_code?: string;
    property_type?: string;
    pet_policy: PetPolicy;
    screening: Screening;
    renewal_policy?: string;
    notes?: string;
  },
): Promise<void> {
  await ctx.insert("properties", {
    city: "Cedarwick",
    region: "OR",
    postal_code: "97499",
    property_type: "multifamily",
    renewal_policy: "",
    notes: "",
    seeded: true,
    ...row,
  });
}

export async function addUnit(
  ctx: SeedContext,
  row: {
    id: string;
    property_id: string;
    label: string;
    beds: number;
    baths: number;
    sqft: number;
    rent_cents: number;
    deposit_cents?: number;
    status: string;
    available_on?: string | null;
    pet_policy?: PetPolicy | null;
    description?: string;
  },
): Promise<void> {
  await ctx.insert("units", {
    deposit_cents: row.deposit_cents ?? row.rent_cents,
    available_on: row.available_on ?? null,
    pet_policy: row.pet_policy ?? null,
    description: row.description ?? "",
    seeded: true,
    ...row,
  });
}

export async function addPerson(
  ctx: SeedContext,
  row: {
    id: string;
    full_name: string;
    email: string;
    phone?: string;
    role?: string;
    household_notes?: string;
  },
): Promise<void> {
  await ctx.insert("people", {
    phone: row.phone ?? "",
    role: row.role ?? "lead",
    household_notes: row.household_notes ?? "",
    seeded: true,
    ...row,
  });
}

export async function addPersona(
  ctx: SeedContext,
  row: {
    id: string;
    person_id?: string | null;
    email: string;
    style: string;
    facts: string;
    scripts: PersonaScript[];
  },
): Promise<void> {
  await ctx.insert("personas", {
    person_id: row.person_id ?? null,
    seeded: true,
    ...row,
  });
}

export async function addLead(
  ctx: SeedContext,
  row: {
    id: string;
    person_id: string;
    property_id?: string | null;
    unit_id?: string | null;
    source?: string;
    status: string;
    desired_move_in?: string | null;
    beds_wanted?: number | null;
    budget_cents?: number | null;
    pets?: string;
    toured_on?: string | null;
  },
): Promise<void> {
  await ctx.insert("leads", {
    property_id: row.property_id ?? null,
    unit_id: row.unit_id ?? null,
    source: row.source ?? "stoop",
    desired_move_in: row.desired_move_in ?? null,
    beds_wanted: row.beds_wanted ?? null,
    budget_cents: row.budget_cents ?? null,
    pets: row.pets ?? "",
    toured_on: row.toured_on ?? null,
    seeded: true,
    ...row,
  });
}

export async function addApplication(
  ctx: SeedContext,
  row: {
    id: string;
    lead_id: string;
    person_id: string;
    unit_id: string;
    status?: string;
    monthly_income_cents: number;
    credit_band: string;
    rental_history: string;
    household_size: number;
    employer?: string;
    move_in_on?: string | null;
    decision_note?: string;
  },
): Promise<void> {
  await ctx.insert("applications", {
    status: row.status ?? "submitted",
    employer: row.employer ?? "",
    move_in_on: row.move_in_on ?? null,
    decision_note: row.decision_note ?? "",
    seeded: true,
    ...row,
  });
}

export async function addLease(
  ctx: SeedContext,
  row: {
    id: string;
    unit_id: string;
    person_id: string;
    start_on: string;
    end_on: string;
    rent_cents: number;
    deposit_cents?: number;
    status?: string;
  },
): Promise<void> {
  await ctx.insert("leases", {
    deposit_cents: row.deposit_cents ?? row.rent_cents,
    status: row.status ?? "active",
    seeded: true,
    ...row,
  });
}

export async function addLedger(
  ctx: SeedContext,
  row: {
    id: string;
    lease_id: string;
    posted_on: string;
    kind: string;
    amount_cents: number;
    memo?: string;
  },
): Promise<void> {
  await ctx.insert("ledger_entries", {
    memo: row.memo ?? "",
    seeded: true,
    ...row,
  });
}

export async function addWorkOrder(
  ctx: SeedContext,
  row: {
    id: string;
    unit_id: string;
    lease_id?: string | null;
    title: string;
    description?: string;
    priority?: string;
    status?: string;
  },
): Promise<void> {
  await ctx.insert("work_orders", {
    lease_id: row.lease_id ?? null,
    description: row.description ?? "",
    priority: row.priority ?? "normal",
    status: row.status ?? "open",
    seeded: true,
    ...row,
  });
}

export async function addNote(
  ctx: SeedContext,
  row: { id: string; entity_type: string; entity_id: string; author?: string; body: string },
): Promise<void> {
  await ctx.insert("notes", {
    author: row.author ?? "Desk import",
    created_at: ctx.clock,
    seeded: true,
    ...row,
  });
}

export async function addListing(
  ctx: SeedContext,
  row: {
    id: string;
    unit_id: string;
    title: string;
    description?: string;
    rent_cents: number;
    beds: number;
    baths: number;
    pet_summary?: string;
    status: string;
  },
): Promise<void> {
  await ctx.insert("listings", {
    description: row.description ?? "",
    pet_summary: row.pet_summary ?? "",
    seeded: true,
    ...row,
  });
}

export async function addThread(ctx: SeedContext, row: { id: string; subject: string }): Promise<void> {
  await ctx.insert("threads", { seeded: true, ...row });
}

export async function addMessage(
  ctx: SeedContext,
  row: {
    id: string;
    thread_id: string;
    from_email: string;
    from_name: string;
    to_emails: string[];
    subject: string;
    body: string;
    labels?: string[];
    direction?: string;
    folder?: string;
  },
): Promise<void> {
  await ctx.insert("messages", {
    direction: row.direction ?? "inbound",
    folder: row.folder ?? "inbox",
    cc_emails: [],
    labels: row.labels ?? [],
    is_read: false,
    sent_at: ctx.clock,
    seeded: true,
    ...row,
  });
}

export async function addInquiry(
  ctx: SeedContext,
  row: {
    id: string;
    listing_id: string;
    person_id?: string | null;
    name: string;
    email: string;
    message: string;
    thread_id?: string | null;
    status?: string;
  },
): Promise<void> {
  await ctx.insert("inquiries", {
    person_id: row.person_id ?? null,
    thread_id: row.thread_id ?? null,
    status: row.status ?? "new",
    created_at: ctx.clock,
    seeded: true,
    ...row,
  });
}

export async function addEvent(
  ctx: SeedContext,
  row: {
    id: string;
    title: string;
    starts_at: string;
    ends_at: string;
    location?: string;
    details?: string;
    kind: string;
    status?: string;
    unit_id?: string | null;
    attendee?: { id: string; email: string; name: string };
  },
): Promise<void> {
  await ctx.insert("events", {
    location: row.location ?? "",
    details: row.details ?? "",
    status: row.status ?? "confirmed",
    unit_id: row.unit_id ?? null,
    seeded: true,
    id: row.id,
    title: row.title,
    starts_at: row.starts_at,
    ends_at: row.ends_at,
    kind: row.kind,
  });
  if (row.attendee) {
    await ctx.insert("attendees", {
      id: row.attendee.id,
      event_id: row.id,
      email: row.attendee.email,
      name: row.attendee.name,
      response: "accepted",
      seeded: true,
    });
  }
}

export function pets(input: {
  summary: string;
  cats?: PetPolicy["cats"];
  dogs?: PetPolicy["dogs"];
  dogWeightLimitLb?: number;
  petDepositCents?: number;
  petRentCents?: number;
}): PetPolicy {
  return {
    cats: input.cats ?? "allowed",
    dogs: input.dogs ?? "no",
    dogWeightLimitLb: input.dogWeightLimitLb,
    petDepositCents: input.petDepositCents,
    petRentCents: input.petRentCents,
    summary: input.summary,
  };
}

export function screening(written: string, incomeMultiple = 3): Screening {
  return {
    incomeMultiple,
    minCredit: "good",
    eviction: "deny",
    brokenLease: "review",
    written,
  };
}
