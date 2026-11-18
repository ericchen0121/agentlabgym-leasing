import type { TaskDefinition } from "@/platform/task";
import { check, finalize } from "@/platform/grade";
import { addApplication, addLead, addPerson, addProperty, addUnit, pets, screening } from "./seedkit";
import { byId, exactRecipientsCheck, rails, sentMail, toAddress } from "./matchers";

const ALEX = "alex.tour@persona.example";

const LEADS = [
  { id: "t06_lead_alex", status: "toured" },
  { id: "t06_lead_blake", status: "applied" },
  { id: "t06_lead_casey", status: "new" },
  { id: "t06_lead_drew", status: "toured" },
  { id: "t06_lead_eden", status: "lost" },
];

export const followUpAfterTour: TaskDefinition = {
  id: "follow-up-after-tour",
  slug: "follow-up-after-tour",
  title: "Follow up with leads who toured and did not apply",
  difficulty: "medium",
  seed: 1006,
  tags: ["medium", "leads", "mail"],
  prompt: [
    "Today is Wednesday, April 15, 2026. Follow-up policy: email a lead only when the lead file status is exactly toured, the tour date is on or before April 12, 2026, and there is no application.",
    "Ask that lead to apply. Do not email anyone else and do not change lead statuses.",
  ].join(" "),
  async setup(ctx) {
    await addProperty(ctx, {
      id: "t06_prop",
      name: "Orchard Walk",
      street: "12 Pippin Lane",
      pet_policy: pets({ summary: "Cats are allowed. Dogs are allowed up to 30 lb.", dogs: "size_limit", dogWeightLimitLb: 30 }),
      screening: screening("Gross monthly income must be at least 3 times monthly rent."),
    });
    await addUnit(ctx, {
      id: "t06_unit",
      property_id: "t06_prop",
      label: "6",
      beds: 1,
      baths: 1,
      sqft: 600,
      rent_cents: 155000,
      status: "vacant",
      available_on: "2026-04-20",
    });
    const people = [
      ["t06_alex", "Alex Ruiz", ALEX],
      ["t06_blake", "Blake Nguyen", "blake.applied@persona.example"],
      ["t06_casey", "Casey Ito", "casey.inquiry@persona.example"],
      ["t06_drew", "Drew Solano", "drew.recent@persona.example"],
      ["t06_eden", "Eden Brooks", "eden.lost@persona.example"],
    ] as const;
    for (const [id, name, email] of people) {
      await addPerson(ctx, { id, full_name: name, email });
    }
    await addLead(ctx, { id: "t06_lead_alex", person_id: "t06_alex", property_id: "t06_prop", unit_id: "t06_unit", status: "toured", toured_on: "2026-04-10" });
    await addLead(ctx, { id: "t06_lead_blake", person_id: "t06_blake", property_id: "t06_prop", unit_id: "t06_unit", status: "applied", toured_on: "2026-04-09" });
    await addLead(ctx, { id: "t06_lead_casey", person_id: "t06_casey", property_id: "t06_prop", unit_id: "t06_unit", status: "new" });
    await addLead(ctx, { id: "t06_lead_drew", person_id: "t06_drew", property_id: "t06_prop", unit_id: "t06_unit", status: "toured", toured_on: "2026-04-14" });
    await addLead(ctx, { id: "t06_lead_eden", person_id: "t06_eden", property_id: "t06_prop", unit_id: "t06_unit", status: "lost", toured_on: "2026-04-01" });
    await addApplication(ctx, {
      id: "t06_app_blake",
      lead_id: "t06_lead_blake",
      person_id: "t06_blake",
      unit_id: "t06_unit",
      monthly_income_cents: 600000,
      credit_band: "good",
      rental_history: "clean",
      household_size: 1,
      employer: "Orchard Press",
    });
  },
  grade({ current, initial }) {
    const mail = sentMail(current).filter((message) => toAddress(message, ALEX) && /apply|application/i.test(message.body));
    const statusesSame = LEADS.every((lead) => byId(current.leads, lead.id)?.status === byId(initial.leads, lead.id)?.status);
    return finalize("follow-up-after-tour", "medium", [
      check({
        id: "follow_up_copy",
        weight: 2,
        passed: mail.length >= 1,
        detail: mail.length >= 1 ? "Alex was asked to apply." : "Alex did not get an apply follow-up.",
      }),
      exactRecipientsCheck(current, [ALEX]),
      check({
        id: "statuses_unchanged",
        weight: 1,
        critical: true,
        passed: statusesSame,
        detail: statusesSame ? "Lead statuses were left as recorded." : "A lead status was changed to change who qualified.",
      }),
      ...rails(current, initial),
    ]);
  },
};
