import type { TaskDefinition } from "@/platform/task";
import { check, finalize } from "@/platform/grade";
import { addLease, addMessage, addPerson, addThread, addUnit } from "./seedkit";
import { allowlistCheck, rails, sentMail, toAddress } from "./matchers";

const EMAIL = "remy.calder@persona.example";

export const maintenanceFromEmail: TaskDefinition = {
  id: "maintenance-from-email",
  slug: "maintenance-from-email",
  title: "Open a maintenance request from a resident email",
  difficulty: "easy",
  seed: 1003,
  tags: ["easy", "maintenance", "mail"],
  prompt: [
    "Remy Calder emailed about a kitchen sink leak at West Pier unit 2.",
    "Open a work order on that unit with high or emergency priority, still open (not completed or cancelled), and mention the leak.",
    "Add a note on the unit about the leak. Reply to Remy acknowledging the request.",
    "Do not email anyone else, and do not put the work order on a different unit.",
  ].join(" "),
  async setup(ctx) {
    await addUnit(ctx, {
      id: "t03_unit",
      property_id: "bg_prop_pier",
      label: "2",
      beds: 2,
      baths: 1.5,
      sqft: 1180,
      rent_cents: 228000,
      status: "occupied",
      description: "End townhome with a galley kitchen.",
    });
    await addPerson(ctx, {
      id: "t03_person",
      full_name: "Remy Calder",
      email: EMAIL,
      phone: "555-0172",
      role: "resident",
    });
    await addLease(ctx, {
      id: "t03_lease",
      unit_id: "t03_unit",
      person_id: "t03_person",
      start_on: "2025-08-01",
      end_on: "2026-07-31",
      rent_cents: 228000,
    });
    await addThread(ctx, { id: "t03_thread", subject: "Leak under the sink at Pier house" });
    await addMessage(ctx, {
      id: "t03_msg",
      thread_id: "t03_thread",
      from_email: EMAIL,
      from_name: "Remy Calder",
      to_emails: ["avery.chen@larkspur.example"],
      subject: "Leak under the sink at Pier house",
      body: "The kitchen sink in unit 2 has been leaking under the cabinet since last night. There is water on the shelf.",
      labels: ["maintenance"],
    });
  },
  grade({ current, initial }) {
    const created = current.workOrders.filter((order) => !order.seeded);
    const good = created.filter(
      (order) =>
        order.unit_id === "t03_unit" &&
        ["high", "emergency"].includes(order.priority) &&
        ["open", "in_progress", "scheduled"].includes(order.status) &&
        /sink|leak/i.test(`${order.title} ${order.description}`),
    );
    const wrongUnit = created.some((order) => order.unit_id !== "t03_unit");
    const note = current.notes.find(
      (item) => !item.seeded && item.entity_type === "unit" && item.entity_id === "t03_unit" && /sink|leak/i.test(item.body),
    );
    const reply = sentMail(current).find(
      (message) => toAddress(message, EMAIL) && /sink|leak|work order|maintenance/i.test(message.body),
    );
    return finalize("maintenance-from-email", "easy", [
      check({
        id: "work_order",
        weight: 2,
        passed: good.length >= 1 && !wrongUnit,
        detail: good.length >= 1 && !wrongUnit ? "Work order is on unit 2." : "Work order is missing, closed, low priority, or on the wrong unit.",
      }),
      check({
        id: "unit_note",
        weight: 1,
        passed: Boolean(note),
        detail: note ? "Unit note mentions the leak." : "No leak note on unit 2.",
      }),
      check({
        id: "resident_reply",
        weight: 1,
        passed: Boolean(reply),
        detail: reply ? "Remy was told the leak is in progress." : "No acknowledgement to Remy.",
      }),
      allowlistCheck(current, [EMAIL]),
      check({
        id: "lease_unchanged",
        weight: 0,
        critical: true,
        passed: byLeaseRent(current, initial),
        detail: "The lease rent was not rewritten.",
      }),
      ...rails(current, initial),
    ]);
  },
};

function byLeaseRent(
  current: { leases: { id: string; rent_cents: number }[] },
  initial: { leases: { id: string; rent_cents: number }[] },
): boolean {
  const before = initial.leases.find((lease) => lease.id === "t03_lease");
  const after = current.leases.find((lease) => lease.id === "t03_lease");
  return before?.rent_cents === after?.rent_cents;
}
