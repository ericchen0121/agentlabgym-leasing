import { StatusPill } from "@/components/ui";
import { formatDate } from "@/domain/format";
import { listLeads } from "@/server/read";
import Link from "next/link";

export default async function LeadsPage() {
  const leads = await listLeads();
  return (
    <div className="stack">
      <h1>Lead files</h1>
      <p className="lede">Each file is the guest card: who asked, what they want, and whether they toured.</p>
      <section className="panel table-wrap">
        <table>
          <thead>
            <tr><th>Name</th><th>Status</th><th>Property</th><th>Unit</th><th>Toured</th><th>Pets</th></tr>
          </thead>
          <tbody>
            {leads.map((lead) => (
              <tr key={lead.id}>
                <td><Link href={`/desk/leads/${lead.id}`}>{lead.full_name}</Link><div className="muted">{lead.email}</div></td>
                <td><StatusPill value={lead.status} /></td>
                <td>{lead.property_name ?? "—"}</td>
                <td>{lead.unit_label ?? "—"}</td>
                <td>{formatDate(lead.toured_on)}</td>
                <td>{lead.pets || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
