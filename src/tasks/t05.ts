import type { TaskDefinition } from "@/platform/task";
import { check, finalize } from "@/platform/grade";
import { addEvent, addMessage, addPerson, addProperty, addThread, addUnit, pets, screening } from "./seedkit";
import { attendeeEmails, byId, mentionsDate, mentionsTime, rails, sentMail, toAddress } from "./matchers";

const SAM = "sam.cho@persona.example";
const PRIYA = "priya.nair@persona.example";
const DEVON = "devon.park@persona.example";

export const rescheduleShowings: TaskDefinition = {
  id: "reschedule-showings",
  slug: "reschedule-showings",
  title: "Reschedule showings after a make-ready slip",
  difficulty: "medium",
  seed: 1005,
  tags: ["medium", "calendar", "mail"],
  prompt: [
    "Make-ready for Kiln House unit 1 slipped. Move both Tuesday, April 21, 2026 showings to Thursday, April 23, 2026 at the same times.",
    "Sam Cho stays at 10:00 AM and Priya Nair stays at 2:00 PM. Keep each showing confirmed.",
    "Email Sam and Priya the new date and time. Leave Devon Park's Friday, April 24, 11:00 AM tour where it is, and do not email Devon.",
  ].join(" "),
  async setup(ctx) {
    await addProperty(ctx, {
      id: "t05_prop",
      name: "Kiln House",
      street: "4 Yard Row",
      pet_policy: pets({ summary: "Cats are allowed. Dogs are not accepted.", dogs: "no" }),
      screening: screening("Gross monthly income must be at least 3 times monthly rent."),
    });
    await addUnit(ctx, {
      id: "t05_unit",
      property_id: "t05_prop",
      label: "1",
      beds: 2,
      baths: 1,
      sqft: 800,
      rent_cents: 170000,
      status: "vacant",
      available_on: "2026-04-21",
    });
    await addPerson(ctx, { id: "t05_sam", full_name: "Sam Cho", email: SAM });
    await addPerson(ctx, { id: "t05_priya", full_name: "Priya Nair", email: PRIYA });
    await addPerson(ctx, { id: "t05_devon", full_name: "Devon Park", email: DEVON });
    await addEvent(ctx, {
      id: "t05_event_sam",
      title: "Showing — Sam Cho",
      starts_at: "2026-04-21 10:00:00",
      ends_at: "2026-04-21 10:30:00",
      kind: "showing",
      unit_id: "t05_unit",
      location: "Kiln House 1",
      attendee: { id: "t05_att_sam", email: SAM, name: "Sam Cho" },
    });
    await addEvent(ctx, {
      id: "t05_event_priya",
      title: "Showing — Priya Nair",
      starts_at: "2026-04-21 14:00:00",
      ends_at: "2026-04-21 14:30:00",
      kind: "showing",
      unit_id: "t05_unit",
      location: "Kiln House 1",
      attendee: { id: "t05_att_priya", email: PRIYA, name: "Priya Nair" },
    });
    await addEvent(ctx, {
      id: "t05_event_devon",
      title: "Showing — Devon Park",
      starts_at: "2026-04-24 11:00:00",
      ends_at: "2026-04-24 11:30:00",
      kind: "showing",
      unit_id: "t05_unit",
      location: "Kiln House 1",
      attendee: { id: "t05_att_devon", email: DEVON, name: "Devon Park" },
    });
    await addThread(ctx, { id: "t05_thread", subject: "Make-ready slip for Kiln House" });
    await addMessage(ctx, {
      id: "t05_msg",
      thread_id: "t05_thread",
      from_email: "facilities@larkspur.example",
      from_name: "Larkspur Facilities",
      to_emails: ["avery.chen@larkspur.example"],
      subject: "Make-ready slip for Kiln House",
      body: "Kiln House 1 will not be ready Tuesday. Please move the Tuesday April 21 showings to Thursday April 23 at the same times. The Friday tour can stay.",
      labels: ["showing"],
    });
  },
  grade({ current, initial }) {
    const sam = confirmedAt(current, SAM, "2026-04-23T10:00", "2026-04-23T10:30");
    const priya = confirmedAt(current, PRIYA, "2026-04-23T14:00", "2026-04-23T14:30");
    const samStuck = confirmedOnDay(current, SAM, "2026-04-21");
    const priyaStuck = confirmedOnDay(current, PRIYA, "2026-04-21");
    const before = byId(initial.events, "t05_event_devon");
    const after = byId(current.events, "t05_event_devon");
    const fridaySame =
      before &&
      after &&
      wallMatches(before.starts_at, "2026-04-24T11:00") &&
      wallMatches(after.starts_at, "2026-04-24T11:00") &&
      wallMatches(after.ends_at, "2026-04-24T11:30") &&
      after.status === "confirmed" &&
      attendeeEmails(current.attendees, after.id).includes(DEVON);
    const samMail = sentMail(current).find(
      (message) => toAddress(message, SAM) && mentionsDate(message.body, "2026-04-23") && mentionsTime(message.body, "10:00"),
    );
    const priyaMail = sentMail(current).find(
      (message) => toAddress(message, PRIYA) && mentionsDate(message.body, "2026-04-23") && mentionsTime(message.body, "14:00"),
    );
    const devonMail = sentMail(current).some((message) => toAddress(message, DEVON));
    return finalize("reschedule-showings", "medium", [
      check({
        id: "sam_moved",
        weight: 1,
        passed: Boolean(sam) && !samStuck,
        detail: sam && !samStuck ? "Sam is on Thursday at 10:00 AM." : "Sam's Tuesday showing was not moved cleanly.",
      }),
      check({
        id: "priya_moved",
        weight: 1,
        passed: Boolean(priya) && !priyaStuck,
        detail: priya && !priyaStuck ? "Priya is on Thursday at 2:00 PM." : "Priya's Tuesday showing was not moved cleanly.",
      }),
      check({
        id: "friday_untouched",
        weight: 1,
        critical: true,
        passed: Boolean(fridaySame),
        detail: fridaySame ? "Devon's Friday tour is unchanged." : "Devon's Friday tour changed.",
      }),
      check({
        id: "notices_sent",
        weight: 2,
        passed: Boolean(samMail) && Boolean(priyaMail) && !devonMail,
        detail: devonMail ? "Devon was emailed." : "Sam and Priya need a Thursday notice with the right time.",
      }),
      ...rails(current, initial),
    ]);
  },
};

function wallMatches(value: string, expected: string): boolean {
  const match = value.match(/^(\d{4}-\d{2}-\d{2})[T ](\d{2}:\d{2})/);
  if (!match) return false;
  return `${match[1]}T${match[2]}` === expected;
}

function confirmedAt(
  snapshot: { events: { id: string; starts_at: string; ends_at: string; status: string; kind: string }[]; attendees: { event_id: string; email: string }[] },
  email: string,
  start: string,
  end: string,
) {
  return snapshot.events.find(
    (event) =>
      event.kind === "showing" &&
      event.status === "confirmed" &&
      wallMatches(event.starts_at, start) &&
      wallMatches(event.ends_at, end) &&
      snapshot.attendees.some((attendee) => attendee.event_id === event.id && attendee.email.toLowerCase() === email),
  );
}

function confirmedOnDay(
  snapshot: { events: { id: string; starts_at: string; status: string; kind: string }[]; attendees: { event_id: string; email: string }[] },
  email: string,
  day: string,
) {
  return snapshot.events.some(
    (event) =>
      event.kind === "showing" &&
      event.status === "confirmed" &&
      event.starts_at.startsWith(day) &&
      snapshot.attendees.some((attendee) => attendee.event_id === event.id && attendee.email.toLowerCase() === email),
  );
}
