import type { PersonaScript } from "@/domain/types";
import { asDate, asTimestamp, dollarsToCents } from "@/domain/format";
import { query, queryOne, withTx } from "./db";
import { nid } from "./ids";
import { personaReply } from "./personas";

type State = {
  clock: string;
  agent_name: string;
  agent_email: string;
};

async function state(): Promise<State> {
  const row = await queryOne<State>(
    "SELECT clock::text, agent_name, agent_email FROM env_state WHERE id = 1",
  );
  if (!row) throw new Error("Environment is not seeded.");
  return { ...row, clock: String(row.clock).replace("T", " ").slice(0, 19) };
}

function text(form: FormData, key: string): string {
  return String(form.get(key) ?? "").trim();
}

function labelsFrom(form: FormData): string[] {
  return form
    .getAll("labels")
    .map((value) => String(value))
    .filter(Boolean);
}

export async function sendMail(form: FormData): Promise<void> {
  const env = await state();
  const to = text(form, "to").toLowerCase();
  const subject = text(form, "subject");
  const body = text(form, "body");
  const mode = text(form, "mode") || "send";
  const threadIdInput = text(form, "thread_id");
  if (!to.includes("@")) throw new Error("Recipient email is required.");
  if (!subject) throw new Error("Subject is required.");
  if (!body) throw new Error("Message body is required.");
  const folder = mode === "draft" ? "drafts" : "sent";

  await withTx(async (client) => {
    let threadId = threadIdInput;
    if (!threadId) {
      threadId = nid("thread");
      await client.query("INSERT INTO threads (id, subject, seeded) VALUES ($1, $2, false)", [threadId, subject]);
    }
    await client.query(
      `INSERT INTO messages (
        id, thread_id, direction, from_email, from_name, to_emails, cc_emails,
        subject, body, folder, labels, is_read, sent_at, seeded
      ) VALUES ($1,$2,'outbound',$3,$4,$5,'{}',$6,$7,$8,$9,true,$10,false)`,
      [nid("msg"), threadId, env.agent_email, env.agent_name, [to], subject, body, folder, labelsFrom(form), env.clock],
    );
    if (folder !== "sent") return;

    const persona = await queryOne<{
      email: string;
      style: string;
      facts: string;
      scripts: PersonaScript[];
      full_name: string | null;
    }>(
      `SELECT personas.email, personas.style, personas.facts, personas.scripts, people.full_name
       FROM personas
       LEFT JOIN people ON people.id = personas.person_id
       WHERE lower(personas.email) = lower($1)`,
      [to],
    );
    if (!persona) return;
    const reply = await personaReply({
      mode: process.env.PERSONA_MODE,
      style: persona.style,
      facts: persona.facts,
      scripts: persona.scripts,
      subject,
      body,
    });
    await client.query(
      `INSERT INTO messages (
        id, thread_id, direction, from_email, from_name, to_emails, cc_emails,
        subject, body, folder, labels, is_read, sent_at, seeded
      ) VALUES ($1,$2,'inbound',$3,$4,$5,'{}',$6,$7,'inbox',$8,false,$9,false)`,
      [
        nid("msg"),
        threadId,
        persona.email,
        persona.full_name || persona.email,
        [env.agent_email],
        subject.toLowerCase().startsWith("re:") ? subject : `Re: ${subject}`,
        reply.body,
        ["persona"],
        env.clock,
      ],
    );
  });
}

export async function setMessageFolder(form: FormData): Promise<void> {
  const id = text(form, "message_id");
  const folder = text(form, "folder");
  if (!["inbox", "sent", "drafts", "trash"].includes(folder)) throw new Error("Unknown folder.");
  await query("UPDATE messages SET folder = $2 WHERE id = $1", [id, folder]);
}

export async function setMessageLabels(form: FormData): Promise<void> {
  const id = text(form, "message_id");
  if (!id) throw new Error("Missing message.");
  await query("UPDATE messages SET labels = $2 WHERE id = $1", [id, labelsFrom(form)]);
}

export async function saveListing(form: FormData): Promise<string> {
  const unitId = text(form, "unit_id");
  const title = text(form, "title");
  const description = text(form, "description");
  const petSummary = text(form, "pet_summary");
  const status = text(form, "status");
  const listingId = text(form, "listing_id");
  if (!unitId) throw new Error("Choose a unit.");
  if (!title) throw new Error("Title is required.");
  if (!["draft", "published", "unlisted"].includes(status)) throw new Error("Unknown listing status.");
  const rent = dollarsToCents(text(form, "rent"));
  const beds = Number(text(form, "beds"));
  const baths = Number(text(form, "baths"));
  if (!Number.isFinite(beds) || !Number.isFinite(baths)) throw new Error("Beds and baths are required.");
  if (listingId) {
    await query(
      `UPDATE listings
       SET unit_id = $2, title = $3, description = $4, rent_cents = $5, beds = $6, baths = $7, pet_summary = $8, status = $9
       WHERE id = $1`,
      [listingId, unitId, title, description, rent, beds, baths, petSummary, status],
    );
    return `/stoop/portal/listings/${listingId}`;
  }
  const id = nid("listing");
  await query(
    `INSERT INTO listings (id, unit_id, title, description, rent_cents, beds, baths, pet_summary, status, seeded)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,false)`,
    [id, unitId, title, description, rent, beds, baths, petSummary, status],
  );
  return `/stoop/portal/listings/${id}`;
}

export async function saveEvent(form: FormData): Promise<string> {
  const title = text(form, "title");
  const kind = text(form, "kind");
  const status = text(form, "status");
  const starts = asTimestamp(text(form, "starts_at"));
  const ends = asTimestamp(text(form, "ends_at"));
  if (!title) throw new Error("Title is required.");
  if (!["showing", "blocked", "meeting", "reminder"].includes(kind)) throw new Error("Unknown event kind.");
  if (!["confirmed", "tentative", "cancelled"].includes(status)) throw new Error("Unknown event status.");
  if (ends <= starts) throw new Error("The end must be after the start.");
  const unitId = text(form, "unit_id") || null;
  const location = text(form, "location");
  const details = text(form, "details");
  const attendeeEmail = text(form, "attendee_email").toLowerCase();
  const attendeeName = text(form, "attendee_name");
  const existing = text(form, "event_id");

  const id = existing || nid("event");
  await withTx(async (client) => {
    if (existing) {
      await client.query(
        `UPDATE events
         SET title = $2, starts_at = $3, ends_at = $4, location = $5, details = $6, kind = $7, status = $8, unit_id = $9
         WHERE id = $1`,
        [id, title, starts, ends, location, details, kind, status, unitId],
      );
      await client.query("DELETE FROM attendees WHERE event_id = $1", [id]);
    } else {
      await client.query(
        `INSERT INTO events (id, title, starts_at, ends_at, location, details, kind, status, unit_id, seeded)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,false)`,
        [id, title, starts, ends, location, details, kind, status, unitId],
      );
    }
    if (attendeeEmail) {
      if (!attendeeEmail.includes("@")) throw new Error("Attendee email looks wrong.");
      await client.query(
        `INSERT INTO attendees (id, event_id, email, name, response, seeded) VALUES ($1,$2,$3,$4,'invited',false)`,
        [nid("att"), id, attendeeEmail, attendeeName],
      );
    }
  });
  return `/calendar/${id}`;
}

export async function saveNote(form: FormData): Promise<void> {
  const env = await state();
  const entityType = text(form, "entity_type");
  const entityId = text(form, "entity_id");
  const body = text(form, "body");
  if (!entityType || !entityId) throw new Error("Missing record.");
  if (body.length < 8) throw new Error("Write a note of at least a few words.");
  await query(
    `INSERT INTO notes (id, entity_type, entity_id, author, body, created_at, seeded)
     VALUES ($1,$2,$3,$4,$5,$6,false)`,
    [nid("note"), entityType, entityId, env.agent_name, body, env.clock],
  );
}

export async function updateLeadStatus(form: FormData): Promise<void> {
  const id = text(form, "lead_id");
  const status = text(form, "status");
  const allowed = ["new", "contacted", "tour_scheduled", "toured", "applied", "lost", "waitlist"];
  if (!allowed.includes(status)) throw new Error("Unknown lead status.");
  await query("UPDATE leads SET status = $2 WHERE id = $1", [id, status]);
}

export async function decideApplication(form: FormData): Promise<void> {
  const env = await state();
  const id = text(form, "application_id");
  const status = text(form, "status");
  const note = text(form, "decision_note");
  if (!["approved", "denied"].includes(status)) throw new Error("Choose approve or deny.");
  if (note.length < 15) throw new Error("Write a decision note that cites the criteria.");
  await withTx(async (client) => {
    await client.query("UPDATE applications SET status = $2, decision_note = $3 WHERE id = $1", [id, status, note]);
    await client.query(
      `INSERT INTO notes (id, entity_type, entity_id, author, body, created_at, seeded)
       VALUES ($1,'application',$2,$3,$4,$5,false)`,
      [nid("note"), id, env.agent_name, note, env.clock],
    );
  });
}

export async function postLedger(form: FormData): Promise<void> {
  const leaseId = text(form, "lease_id");
  const kind = text(form, "kind");
  const memo = text(form, "memo");
  const posted = asDate(text(form, "posted_on"));
  if (!["charge", "payment", "credit", "fee"].includes(kind)) throw new Error("Unknown ledger kind.");
  const amount = dollarsToCents(text(form, "amount"));
  if (amount <= 0) throw new Error("Amount must be greater than zero.");
  await query(
    `INSERT INTO ledger_entries (id, lease_id, posted_on, kind, amount_cents, memo, seeded)
     VALUES ($1,$2,$3,$4,$5,$6,false)`,
    [nid("led"), leaseId, posted, kind, amount, memo],
  );
}

export async function updateLeaseRent(form: FormData): Promise<void> {
  const id = text(form, "lease_id");
  const rent = dollarsToCents(text(form, "rent"));
  if (rent <= 0) throw new Error("Rent must be greater than zero.");
  await query("UPDATE leases SET rent_cents = $2 WHERE id = $1", [id, rent]);
}

export async function saveWorkOrder(form: FormData): Promise<string> {
  const unitId = text(form, "unit_id");
  const title = text(form, "title");
  const description = text(form, "description");
  const priority = text(form, "priority");
  const status = text(form, "status");
  if (!unitId) throw new Error("Choose a unit.");
  if (!title) throw new Error("Title is required.");
  if (!["low", "normal", "high", "emergency"].includes(priority)) throw new Error("Unknown priority.");
  if (!["open", "in_progress", "scheduled", "completed", "cancelled"].includes(status)) {
    throw new Error("Unknown work order status.");
  }
  const lease = await queryOne<{ id: string }>(
    "SELECT id FROM leases WHERE unit_id = $1 AND status = 'active' ORDER BY id LIMIT 1",
    [unitId],
  );
  const id = nid("wo");
  await query(
    `INSERT INTO work_orders (id, unit_id, lease_id, title, description, priority, status, seeded)
     VALUES ($1,$2,$3,$4,$5,$6,$7,false)`,
    [id, unitId, lease?.id ?? null, title, description, priority, status],
  );
  return `/desk/work-orders`;
}

export async function publicInquiry(form: FormData): Promise<void> {
  const env = await state();
  const listingId = text(form, "listing_id");
  const name = text(form, "name");
  const email = text(form, "email").toLowerCase();
  const message = text(form, "message");
  if (!name || !email.includes("@") || message.length < 4) throw new Error("Name, email, and a message are required.");
  const listing = await queryOne<{ title: string }>("SELECT title FROM listings WHERE id = $1", [listingId]);
  if (!listing) throw new Error("Listing not found.");
  const threadId = nid("thread");
  const subject = `Inquiry: ${listing.title}`;
  await withTx(async (client) => {
    await client.query("INSERT INTO threads (id, subject, seeded) VALUES ($1,$2,false)", [threadId, subject]);
    await client.query(
      `INSERT INTO messages (
        id, thread_id, direction, from_email, from_name, to_emails, cc_emails,
        subject, body, folder, labels, is_read, sent_at, seeded
      ) VALUES ($1,$2,'inbound',$3,$4,$5,'{}',$6,$7,'inbox', $8, false, $9, false)`,
      [nid("msg"), threadId, email, name, [env.agent_email], subject, message, ["inquiry"], env.clock],
    );
    await client.query(
      `INSERT INTO inquiries (id, listing_id, person_id, name, email, message, status, thread_id, created_at, seeded)
       VALUES ($1,$2,NULL,$3,$4,$5,'new',$6,$7,false)`,
      [nid("inq"), listingId, name, email, message, threadId, env.clock],
    );
  });
}
