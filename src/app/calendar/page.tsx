import { StatusPill } from "@/components/ui";
import { formatWhen } from "@/domain/format";
import { listEvents } from "@/server/read";
import Link from "next/link";

export default async function CalendarPage() {
  const events = await listEvents();
  const groups = new Map<string, typeof events>();
  for (const event of events) {
    const day = event.starts_at.slice(0, 10);
    groups.set(day, [...(groups.get(day) ?? []), event]);
  }
  return (
    <div className="stack">
      <div className="row">
        <div>
          <h1>Dayboard</h1>
          <p className="lede">Showings and time. Confirmed events block the calendar. Business hours are 9:00 AM to 5:00 PM Pacific.</p>
        </div>
        <Link className="btn" href="/calendar/new">New event</Link>
      </div>
      {[...groups.entries()].map(([day, items]) => (
        <section key={day} className="panel">
          <h2>{day}</h2>
          <div className="stack">
            {items.map((event) => (
              <Link key={event.id} href={`/calendar/${event.id}`} className="item">
                <strong>
                  <span>{event.title}</span>
                  <StatusPill value={event.status} />
                </strong>
                <span>{formatWhen(event.starts_at)} – {formatWhen(event.ends_at)} · {event.kind}</span>
                <span className="muted">
                  {event.property_name ? `${event.property_name} ${event.unit_label}` : "No unit"}
                  {event.attendee_email ? ` · ${event.attendee_name || event.attendee_email}` : ""}
                </span>
              </Link>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
