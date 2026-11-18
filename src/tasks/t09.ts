import type { TaskDefinition } from "@/platform/task";
import { check, finalize } from "@/platform/grade";
import { addInquiry, addListing, addMessage, addPerson, addProperty, addThread, addUnit, pets, screening } from "./seedkit";
import { byId, mentionsDate, mentionsDollars, noOverlap, rails, sentMail, showingsFor, toAddress, validShowing } from "./matchers";

const JAMIE = "jamie.cole@persona.example";
const NOOR = "noor.hassan@persona.example";
const ELLIS = "ellis.cho@persona.example";

export const triageInquiries: TaskDefinition = {
  id: "triage-inquiries",
  slug: "triage-inquiries",
  title: "Triage three inquiries with different availability",
  difficulty: "hard",
  seed: 1009,
  tags: ["hard", "listings", "mail", "calendar"],
  prompt: [
    "Reply to each of the three unit inquiries from the unit records at Cedar Court.",
    "Unit 101 is occupied. Do not offer it or book a showing. Unpublish its Stoop listing.",
    "Unit 204 is vacant and available April 18, 2026. Reply with the rent on the unit record and book one confirmed showing on or after that date during business hours, 30 to 120 minutes, with no overlap.",
    "Unit 305 is on notice and available June 1, 2026. Reply with that date. Do not book a showing before June 1.",
    "Leave the other two listings published and do not change unit rents.",
  ].join(" "),
  async setup(ctx) {
    const policy = pets({ summary: "Cats are allowed. Dogs are not accepted.", dogs: "no" });
    await addProperty(ctx, {
      id: "t09_prop",
      name: "Cedar Court",
      street: "88 Court Avenue",
      pet_policy: policy,
      screening: screening("Gross monthly income must be at least 3 times monthly rent."),
    });
    await addUnit(ctx, { id: "t09_u101", property_id: "t09_prop", label: "101", beds: 1, baths: 1, sqft: 600, rent_cents: 210000, status: "occupied" });
    await addUnit(ctx, {
      id: "t09_u204",
      property_id: "t09_prop",
      label: "204",
      beds: 2,
      baths: 2,
      sqft: 940,
      rent_cents: 199500,
      status: "vacant",
      available_on: "2026-04-18",
    });
    await addUnit(ctx, {
      id: "t09_u305",
      property_id: "t09_prop",
      label: "305",
      beds: 2,
      baths: 2,
      sqft: 980,
      rent_cents: 240000,
      status: "notice",
      available_on: "2026-06-01",
    });
    await addListing(ctx, {
      id: "t09_list_101",
      unit_id: "t09_u101",
      title: "Cedar Court 101",
      description: "Stale listing. The unit is occupied.",
      rent_cents: 210000,
      beds: 1,
      baths: 1,
      pet_summary: policy.summary,
      status: "published",
    });
    await addListing(ctx, {
      id: "t09_list_204",
      unit_id: "t09_u204",
      title: "Cedar Court 204",
      description: "Vacant two-bedroom.",
      rent_cents: 199500,
      beds: 2,
      baths: 2,
      pet_summary: policy.summary,
      status: "published",
    });
    await addListing(ctx, {
      id: "t09_list_305",
      unit_id: "t09_u305",
      title: "Cedar Court 305",
      description: "Available when the current household moves.",
      rent_cents: 240000,
      beds: 2,
      baths: 2,
      pet_summary: policy.summary,
      status: "published",
    });
    const people = [
      ["t09_jamie", "Jamie Cole", JAMIE, "101", "t09_list_101", "Is unit 101 available this weekend?"],
      ["t09_noor", "Noor Hassan", NOOR, "204", "t09_list_204", "Can I tour unit 204?"],
      ["t09_ellis", "Ellis Cho", ELLIS, "305", "t09_list_305", "Is unit 305 free now?"],
    ] as const;
    for (const [id, name, email, label, listingId, message] of people) {
      await addPerson(ctx, { id, full_name: name, email });
      const threadId = `t09_thread_${label}`;
      await addThread(ctx, { id: threadId, subject: `Inquiry: unit ${label}` });
      await addMessage(ctx, {
        id: `t09_msg_${label}`,
        thread_id: threadId,
        from_email: email,
        from_name: name,
        to_emails: ["avery.chen@larkspur.example"],
        subject: `Inquiry: unit ${label}`,
        body: message,
        labels: ["inquiry"],
      });
      await addInquiry(ctx, {
        id: `t09_inq_${label}`,
        listing_id: listingId,
        person_id: id,
        name,
        email,
        message,
        thread_id: threadId,
      });
    }
  },
  grade({ current, initial }) {
    const jamie = sentMail(current).find(
      (message) => toAddress(message, JAMIE) && /not available|unavailable|occupied|already leased|already rented/i.test(message.body),
    );
    const noor = sentMail(current).find((message) => toAddress(message, NOOR) && mentionsDollars(message.body, 199500));
    const ellis = sentMail(current).find((message) => toAddress(message, ELLIS) && mentionsDate(message.body, "2026-06-01"));
    const noorShowings = showingsFor(current, NOOR).filter(
      (event) => validShowing(event, "2026-04-18") && noOverlap(current, event),
    );
    const jamieShowing = showingsFor(current, JAMIE);
    const ellisEarly = showingsFor(current, ELLIS).filter((event) => event.starts_at.slice(0, 10) < "2026-06-01");
    const stale = byId(current.listings, "t09_list_101");
    const keep204 = byId(current.listings, "t09_list_204");
    const keep305 = byId(current.listings, "t09_list_305");
    const rentsOk = ["t09_u101", "t09_u204", "t09_u305"].every(
      (id) => byId(current.units, id)?.rent_cents === byId(initial.units, id)?.rent_cents,
    );
    return finalize("triage-inquiries", "hard", [
      check({
        id: "occupied_reply",
        weight: 1,
        passed: Boolean(jamie) && jamieShowing.length === 0,
        detail: jamie && jamieShowing.length === 0 ? "Unit 101 was not offered." : "Unit 101 still looks available to Jamie.",
      }),
      check({
        id: "stale_listing_down",
        weight: 1,
        passed: stale?.status !== "published" && keep204?.status === "published" && keep305?.status === "published",
        detail: "Unit 101 is unpublished and the other two listings stay up.",
      }),
      check({
        id: "vacant_reply_and_showing",
        weight: 2,
        passed: Boolean(noor) && noorShowings.length >= 1,
        detail: noor && noorShowings.length >= 1 ? "Unit 204 has a rent reply and a valid showing." : "Unit 204 is missing the rent or a valid showing.",
      }),
      check({
        id: "notice_reply",
        weight: 1,
        passed: Boolean(ellis) && ellisEarly.length === 0,
        detail: ellis && ellisEarly.length === 0 ? "Unit 305 was quoted as June 1." : "Unit 305 was misquoted or shown too early.",
      }),
      check({
        id: "rents_unchanged",
        weight: 1,
        critical: true,
        passed: rentsOk,
        detail: rentsOk ? "Unit rents were not edited." : "A unit rent was edited.",
      }),
      ...rails(current, initial),
    ]);
  },
};
