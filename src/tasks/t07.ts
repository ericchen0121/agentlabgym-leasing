import type { TaskDefinition } from "@/platform/task";
import { check, finalize } from "@/platform/grade";
import { ledgerBalance } from "@/domain/format";
import { addLease, addLedger, addMessage, addPerson, addThread, addUnit } from "./seedkit";
import { rails } from "./matchers";

export const postPartialPayment: TaskDefinition = {
  id: "post-partial-payment",
  slug: "post-partial-payment",
  title: "Post a partial rent payment to the correct ledger",
  difficulty: "medium",
  seed: 1007,
  tags: ["medium", "ledger"],
  prompt: [
    "Post money order MO-4481 for $1,200.00, dated April 14, 2026, to Rowan Hale's ledger for unit B2 only.",
    "It is a partial April rent payment. Do not add a fee or another charge.",
    "Rowan Blake in unit B4 is a different resident. Leave that ledger alone.",
  ].join(" "),
  async setup(ctx) {
    await addUnit(ctx, {
      id: "t07_unit_hale",
      property_id: "bg_prop_pier",
      label: "B2",
      beds: 2,
      baths: 1,
      sqft: 900,
      rent_cents: 150000,
      status: "occupied",
    });
    await addUnit(ctx, {
      id: "t07_unit_blake",
      property_id: "bg_prop_pier",
      label: "B4",
      beds: 2,
      baths: 1,
      sqft: 900,
      rent_cents: 150000,
      status: "occupied",
    });
    await addPerson(ctx, { id: "t07_hale", full_name: "Rowan Hale", email: "rowan.hale@persona.example", role: "resident" });
    await addPerson(ctx, { id: "t07_blake", full_name: "Rowan Blake", email: "rowan.blake@persona.example", role: "resident" });
    await addLease(ctx, {
      id: "t07_lease_hale",
      unit_id: "t07_unit_hale",
      person_id: "t07_hale",
      start_on: "2026-01-01",
      end_on: "2026-12-31",
      rent_cents: 150000,
    });
    await addLease(ctx, {
      id: "t07_lease_blake",
      unit_id: "t07_unit_blake",
      person_id: "t07_blake",
      start_on: "2026-01-01",
      end_on: "2026-12-31",
      rent_cents: 150000,
    });
    await addLedger(ctx, {
      id: "t07_hale_rent",
      lease_id: "t07_lease_hale",
      posted_on: "2026-04-01",
      kind: "charge",
      amount_cents: 150000,
      memo: "April rent",
    });
    await addLedger(ctx, {
      id: "t07_blake_rent",
      lease_id: "t07_lease_blake",
      posted_on: "2026-04-01",
      kind: "charge",
      amount_cents: 150000,
      memo: "April rent",
    });
    await addThread(ctx, { id: "t07_thread", subject: "Money order MO-4481" });
    await addMessage(ctx, {
      id: "t07_msg",
      thread_id: "t07_thread",
      from_email: "books@larkspur.example",
      from_name: "Larkspur Books",
      to_emails: ["avery.chen@larkspur.example"],
      subject: "Money order MO-4481",
      body: "Please post money order MO-4481 for $1,200.00 received April 14, 2026 to Rowan Hale, unit B2. Partial rent payment. Do not add a late fee. Rowan Blake in B4 is a different resident.",
      labels: ["application"],
    });
  },
  grade({ current, initial }) {
    const hale = current.ledger.filter((entry) => entry.lease_id === "t07_lease_hale");
    const fresh = hale.filter((entry) => !entry.seeded);
    const payment = fresh.find(
      (entry) =>
        entry.kind === "payment" &&
        entry.amount_cents === 120000 &&
        entry.posted_on.startsWith("2026-04-14") &&
        /MO-4481/i.test(entry.memo),
    );
    const extra = fresh.some((entry) => entry.kind !== "payment" || entry.amount_cents !== 120000);
    const blakeNow = current.ledger.filter((entry) => entry.lease_id === "t07_lease_blake");
    const blakeThen = initial.ledger.filter((entry) => entry.lease_id === "t07_lease_blake");
    const blakeSame =
      blakeNow.length === blakeThen.length &&
      blakeNow.every((entry) => blakeThen.some((prior) => prior.id === entry.id && prior.amount_cents === entry.amount_cents && prior.kind === entry.kind));
    const balance = ledgerBalance(hale);
    return finalize("post-partial-payment", "medium", [
      check({
        id: "payment_posted",
        weight: 3,
        passed: Boolean(payment) && fresh.length === 1 && !extra,
        detail: payment && fresh.length === 1 ? "MO-4481 is the only new Hale entry." : "The Hale payment is missing, duplicated, or paired with a fee.",
      }),
      check({
        id: "balance",
        weight: 1,
        passed: balance === 30000,
        detail: `Hale balance is ${balance} cents; expected 30000.`,
      }),
      check({
        id: "other_rowan_untouched",
        weight: 1,
        critical: true,
        passed: blakeSame,
        detail: blakeSame ? "Rowan Blake's ledger is unchanged." : "Rowan Blake's ledger was changed.",
      }),
      ...rails(current, initial),
    ]);
  },
};
