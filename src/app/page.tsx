import { Banner } from "@/components/ui";
import { formatClock } from "@/domain/format";
import { counts, getMeta } from "@/server/read";
import { getTask } from "@/tasks";
import Link from "next/link";

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const error = Array.isArray(params.error) ? params.error[0] : params.error;
  const notice = Array.isArray(params.notice) ? params.notice[0] : params.notice;
  const meta = await getMeta();
  const task = meta.task_id ? getTask(meta.task_id) : null;
  const tally = await counts();
  return (
    <div className="stack">
      <Banner error={error} notice={notice} />
      <div>
        <h1>Good morning, {meta.agent_name.split(" ")[0]}.</h1>
        <p className="lede">
          {meta.company_name} keeps leasing work in four places: Desk for records, Stoop for listings, Postroom for mail, and Dayboard for time. The workplace clock is {formatClock(meta.clock)}.
        </p>
        <p className="muted" data-testid="env-seed">Dataset {meta.seed}</p>
      </div>
      {task ? (
        <section className="panel assignment" data-testid="assignment">
          <h2>Today&apos;s assignment</h2>
          <p className="muted">{task.title} · {task.difficulty}</p>
          <p>{task.prompt}</p>
        </section>
      ) : (
        <section className="panel">
          <h2>No assignment loaded</h2>
          <p className="lede">The desk is on the background dataset. Load a task with the runner when you want a graded episode.</p>
        </section>
      )}
      <div className="grid">
        <Link className="card" href="/desk">
          <h2>Desk</h2>
          <p>{tally.units} units · {tally.leads} lead files · {tally.applications} applications waiting · {tally.openWork} open work orders</p>
        </Link>
        <Link className="card" href="/stoop">
          <h2>Stoop</h2>
          <p>Public listings and the landlord portal. Rentals with the lights on.</p>
        </Link>
        <Link className="card" href="/mail">
          <h2>Postroom</h2>
          <p>{tally.inbox} messages in the inbox.</p>
        </Link>
        <Link className="card" href="/calendar">
          <h2>Dayboard</h2>
          <p>Showings, reminders, and the rest of the week. Business hours are 9:00 AM to 5:00 PM.</p>
        </Link>
      </div>
    </div>
  );
}
