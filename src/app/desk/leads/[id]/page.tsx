import { Banner, Facts, Form, Select, StatusPill, Submit, TextArea } from "@/components/ui";
import { formatDate, formatMoney } from "@/domain/format";
import { getLead, listNotes } from "@/server/read";
import Link from "next/link";
import { notFound } from "next/navigation";

const STATUSES = ["new", "contacted", "tour_scheduled", "toured", "applied", "lost", "waitlist"];

export default async function LeadPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { id } = await params;
  const query = await searchParams;
  const lead = await getLead(id);
  if (!lead) notFound();
  const notes = await listNotes("lead", id);
  return (
    <div className="stack">
      <Banner error={typeof query.error === "string" ? query.error : undefined} notice={typeof query.notice === "string" ? query.notice : undefined} />
      <div>
        <p className="muted"><Link href="/desk/leads">Lead files</Link></p>
        <h1>{lead.full_name}</h1>
      </div>
      <section className="panel stack">
        <Facts
          items={[
            { label: "Email", value: lead.email },
            { label: "Phone", value: lead.phone || "—" },
            { label: "Status", value: <StatusPill value={lead.status} /> },
            { label: "Property", value: lead.property_name ?? "—" },
            { label: "Unit", value: lead.unit_id ? <Link href={`/desk/units/${lead.unit_id}`}>{lead.unit_label}</Link> : "—" },
            { label: "Toured", value: formatDate(lead.toured_on) },
            { label: "Budget", value: lead.budget_cents ? formatMoney(lead.budget_cents) : "—" },
            { label: "Pets", value: lead.pets || "—" },
            { label: "Household notes", value: lead.household_notes || "—" },
          ]}
        />
        <Form op="lead-status" returnTo={`/desk/leads/${lead.id}`}>
          <input type="hidden" name="lead_id" value={lead.id} />
          <Select
            label="Guest card status"
            name="status"
            value={lead.status}
            options={STATUSES.map((status) => ({ value: status, label: status.replace(/_/g, " ") }))}
          />
          <Submit>Save lead file</Submit>
        </Form>
      </section>
      <section className="panel">
        <h2>Notes</h2>
        {notes.map((note) => <p key={note.id}>{note.body}</p>)}
        <Form op="save-note" returnTo={`/desk/leads/${lead.id}`}>
          <input type="hidden" name="entity_type" value="lead" />
          <input type="hidden" name="entity_id" value={lead.id} />
          <TextArea label="Note" name="body" />
          <Submit>Add note</Submit>
        </Form>
      </section>
    </div>
  );
}
