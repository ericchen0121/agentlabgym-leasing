import { Banner } from "@/components/ui";
import { EventForm } from "@/components/event-form";
import { getEvent, listUnits } from "@/server/read";
import Link from "next/link";
import { notFound } from "next/navigation";

export default async function EventPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { id } = await params;
  const query = await searchParams;
  const [event, units] = await Promise.all([getEvent(id), listUnits()]);
  if (!event) notFound();
  return (
    <div className="stack">
      <Banner error={typeof query.error === "string" ? query.error : undefined} notice={typeof query.notice === "string" ? query.notice : undefined} />
      <p className="muted"><Link href="/calendar">Dayboard</Link></p>
      <h1>{event.title}</h1>
      <section className="panel">
        <EventForm event={event} units={units} />
      </section>
    </div>
  );
}
