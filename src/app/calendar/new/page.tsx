import { Banner } from "@/components/ui";
import { EventForm } from "@/components/event-form";
import { listUnits } from "@/server/read";

export default async function NewEventPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const query = await searchParams;
  const units = await listUnits();
  return (
    <div className="stack">
      <Banner error={typeof query.error === "string" ? query.error : undefined} />
      <h1>New event</h1>
      <section className="panel">
        <EventForm units={units} />
      </section>
    </div>
  );
}
