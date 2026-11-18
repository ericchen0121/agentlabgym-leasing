import { listRecentNotes } from "@/server/read";
import Link from "next/link";

const HREFS: Record<string, (id: string) => string> = {
  unit: (id) => `/desk/units/${id}`,
  lead: (id) => `/desk/leads/${id}`,
  application: (id) => `/desk/applications/${id}`,
  lease: (id) => `/desk/leases/${id}`,
};

export default async function ActivityPage() {
  const notes = await listRecentNotes();
  return (
    <div className="stack">
      <h1>Activity</h1>
      <p className="lede">Notes left on records. This is the activity log for the desk.</p>
      <section className="panel stack">
        {notes.map((note) => (
          <article key={note.id}>
            <p className="muted">{note.author} · {note.entity_type} · {note.created_at}</p>
            <p>{note.body}</p>
            {HREFS[note.entity_type] ? <Link href={HREFS[note.entity_type](note.entity_id)}>Open record</Link> : null}
          </article>
        ))}
      </section>
    </div>
  );
}
