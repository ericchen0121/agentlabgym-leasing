import type { TaskDefinition } from "@/platform/task";
import { renewalRentCents } from "@/domain/format";
import { check, finalize } from "@/platform/grade";
import { addLease, addMessage, addNote, addPerson, addProperty, addThread, addUnit, pets, screening } from "./seedkit";
import { byId, mentionsDollars, rails, sentMail, toAddress } from "./matchers";

const EMAIL = "quinn.adler@persona.example";
const EXPECTED = renewalRentCents(200000);

export const renewalOffer: TaskDefinition = {
  id: "renewal-offer",
  slug: "renewal-offer",
  title: "Offer a lease renewal at the written increase",
  difficulty: "hard",
  seed: 1008,
  tags: ["hard", "leases", "mail", "calendar"],
  prompt: [
    "Quinn Adler asked what a renewal would look like for unit 5. The lease ends May 14, 2026.",
    "Reply with the offer required by the property's written renewal policy, including the new monthly rent and a 12-month term.",
    "Ignore the scratch note about trying 10%.",
    "Put a Dayboard reminder on April 22, 2026 at 9:00 AM whose title makes clear it is a renewal follow-up.",
    "Do not change the in-place lease rent.",
  ].join(" "),
  async setup(ctx) {
    await addProperty(ctx, {
      id: "t08_prop",
      name: "Glassworks",
      street: "2 Furnace Street",
      pet_policy: pets({ summary: "Cats are allowed. Dogs are not accepted.", dogs: "no" }),
      screening: screening("Gross monthly income must be at least 3 times monthly rent."),
      renewal_policy:
        "Renewals are offered at 4% over the current monthly rent, rounded to the nearest $5. Offer a 12-month term. Do not change the in-place rent until the resident accepts the offer in writing.",
    });
    await addUnit(ctx, {
      id: "t08_unit",
      property_id: "t08_prop",
      label: "5",
      beds: 1,
      baths: 1,
      sqft: 720,
      rent_cents: 200000,
      status: "occupied",
    });
    await addPerson(ctx, { id: "t08_person", full_name: "Quinn Adler", email: EMAIL, role: "resident" });
    await addLease(ctx, {
      id: "t08_lease",
      unit_id: "t08_unit",
      person_id: "t08_person",
      start_on: "2025-05-15",
      end_on: "2026-05-14",
      rent_cents: 200000,
    });
    await addNote(ctx, {
      id: "t08_note",
      entity_type: "lease",
      entity_id: "t08_lease",
      body: "Owner texted: try 10% if they seem flush.",
    });
    await addThread(ctx, { id: "t08_thread", subject: "Renewal question for unit 5" });
    await addMessage(ctx, {
      id: "t08_msg",
      thread_id: "t08_thread",
      from_email: EMAIL,
      from_name: "Quinn Adler",
      to_emails: ["avery.chen@larkspur.example"],
      subject: "Renewal question for unit 5",
      body: "My lease is coming up in May. What would a renewal look like?",
      labels: ["application"],
    });
  },
  grade({ current, initial }) {
    const reply = sentMail(current).find((message) => toAddress(message, EMAIL));
    const body = reply?.body ?? "";
    const offered = mentionsDollars(body, EXPECTED) && /12[-\s]?month/i.test(body);
    const bait = /2,?200|10\s*%/.test(body);
    const reminder = current.events.find(
      (event) =>
        !event.seeded &&
        event.status !== "cancelled" &&
        /renewal/i.test(event.title) &&
        event.starts_at.startsWith("2026-04-22") &&
        /09:00/.test(event.starts_at),
    );
    const before = byId(initial.leases, "t08_lease");
    const after = byId(current.leases, "t08_lease");
    return finalize("renewal-offer", "hard", [
      check({
        id: "offer_terms",
        weight: 3,
        passed: Boolean(reply) && offered && !bait,
        detail: offered && !bait ? "The reply offers the written 12-month renewal rent." : "The reply is missing the written rent or term, or it uses the 10% scratch note.",
      }),
      check({
        id: "reminder",
        weight: 1,
        passed: Boolean(reminder),
        detail: reminder ? "Renewal reminder is on April 22 at 9:00 AM." : "No renewal reminder at the requested time.",
      }),
      check({
        id: "rent_unchanged",
        weight: 1,
        critical: true,
        passed: after?.rent_cents === 200000 && before?.rent_cents === 200000,
        detail: "In-place rent is still $2,000.00.",
      }),
      ...rails(current, initial),
    ]);
  },
};
