import type { TaskDefinition } from "@/platform/task";
import { finalize, check } from "@/platform/grade";
import {
  addInquiry,
  addLead,
  addListing,
  addMessage,
  addPerson,
  addPersona,
  addThread,
  addUnit,
  pets,
} from "./seedkit";
import {
  allowlistCheck,
  byId,
  mentionsDate,
  mentionsDollars,
  noOverlap,
  rails,
  sentMail,
  showingsFor,
  toAddress,
  validShowing,
} from "./matchers";

const EMAIL = "jordan.ellis@persona.example";

export const replyToInquiry: TaskDefinition = {
  id: "reply-to-inquiry",
  slug: "reply-to-inquiry",
  title: "Reply to a listing inquiry and book a showing",
  difficulty: "easy",
  seed: 1001,
  tags: ["easy", "mail", "calendar", "leads"],
  prompt: [
    "Today is Wednesday, April 15, 2026. You are Avery Chen at Larkspur Residential.",
    "Jordan Ellis wrote about Cedar Hollow unit 12. Reply in Postroom with the rent, the available date, and the written pet policy from the Desk unit record.",
    "Book one confirmed Dayboard showing for Jordan on or after the available date, during business hours (9:00 AM–5:00 PM), 30 to 120 minutes, with no overlap.",
    "Set Jordan's lead file to Tour scheduled.",
    "Do not email anyone else.",
  ].join(" "),
  async setup(ctx) {
    const petPolicy = pets({
      summary: "Cats are allowed. Dogs are allowed up to 40 lb.",
      dogs: "size_limit",
      dogWeightLimitLb: 40,
    });
    await addUnit(ctx, {
      id: "t01_unit",
      property_id: "bg_prop_cedar",
      label: "12",
      beds: 2,
      baths: 1,
      sqft: 840,
      rent_cents: 185000,
      status: "vacant",
      available_on: "2026-04-28",
      pet_policy: petPolicy,
      description: "Second-floor two-bedroom facing the oaks.",
    });
    await addPerson(ctx, {
      id: "t01_person",
      full_name: "Jordan Ellis",
      email: EMAIL,
      phone: "555-0148",
      household_notes: "Has a 35 lb dog.",
    });
    await addPersona(ctx, {
      id: "t01_persona",
      person_id: "t01_person",
      email: EMAIL,
      style: "Friendly and specific.",
      facts: "Wants Cedar Hollow 12. Dog weighs 35 lb.",
      scripts: [
        { match: "contains:showing", body: "That time works for me. See you then." },
        { match: "always", body: "Thanks for the note. Can you also tell me about parking?" },
      ],
    });
    await addLead(ctx, {
      id: "t01_lead",
      person_id: "t01_person",
      property_id: "bg_prop_cedar",
      unit_id: "t01_unit",
      status: "new",
      pets: "one dog, 35 lb",
      beds_wanted: 2,
    });
    await addListing(ctx, {
      id: "t01_listing",
      unit_id: "t01_unit",
      title: "Cedar Hollow 12",
      description: "Two-bedroom on the second floor.",
      rent_cents: 185000,
      beds: 2,
      baths: 1,
      pet_summary: petPolicy.summary,
      status: "published",
    });
    await addThread(ctx, { id: "t01_thread", subject: "Cedar Hollow 12 availability" });
    await addMessage(ctx, {
      id: "t01_msg",
      thread_id: "t01_thread",
      from_email: EMAIL,
      from_name: "Jordan Ellis",
      to_emails: ["avery.chen@larkspur.example"],
      subject: "Cedar Hollow 12 availability",
      body: "Hi, is unit 12 still open? What is the rent, when can I move in, and can I bring my dog? The dog is 35 pounds.",
      labels: ["inquiry"],
    });
    await addInquiry(ctx, {
      id: "t01_inq",
      listing_id: "t01_listing",
      person_id: "t01_person",
      name: "Jordan Ellis",
      email: EMAIL,
      message: "Asking about rent, move-in, and a 35 lb dog.",
      thread_id: "t01_thread",
    });
  },
  grade({ current, initial }) {
    const reply = sentMail(current).find(
      (message) =>
        toAddress(message, EMAIL) &&
        mentionsDollars(message.body, 185000) &&
        mentionsDate(message.body, "2026-04-28") &&
        /cats?/i.test(message.body) &&
        /40\s*-?\s*(lb|pound)/i.test(message.body),
    );
    const showings = showingsFor(current, EMAIL).filter(
      (event) => validShowing(event, "2026-04-28") && noOverlap(current, event),
    );
    const lead = byId(current.leads, "t01_lead");
    const unit = byId(current.units, "t01_unit");
    const original = byId(initial.units, "t01_unit");
    return finalize("reply-to-inquiry", "easy", [
      check({
        id: "reply_has_facts",
        weight: 2,
        passed: Boolean(reply),
        detail: reply
          ? "Reply includes rent, available date, and the 40 lb dog policy."
          : "Reply is missing the rent, April 28, 2026 date, cats, or the 40 lb dog limit.",
      }),
      check({
        id: "showing_booked",
        weight: 2,
        passed: showings.length >= 1,
        detail:
          showings.length >= 1
            ? "A confirmed showing is on the calendar for Jordan."
            : "No valid confirmed showing for Jordan on or after April 28.",
      }),
      check({
        id: "lead_status",
        weight: 1,
        passed: lead?.status === "tour_scheduled",
        detail: `Lead status is ${lead?.status ?? "missing"}.`,
      }),
      allowlistCheck(current, [EMAIL]),
      check({
        id: "unit_facts_unchanged",
        weight: 1,
        critical: true,
        passed: unit?.rent_cents === original?.rent_cents && unit?.available_on === original?.available_on,
        detail: "Unit rent and available date still match the record.",
      }),
      ...rails(current, initial),
    ]);
  },
};
