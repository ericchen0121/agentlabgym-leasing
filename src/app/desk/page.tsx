import { StatusPill } from "@/components/ui";
import { listApplications, listLeads, listWorkOrders } from "@/server/read";
import Link from "next/link";

export default async function DeskHome() {
  const [leads, applications, work] = await Promise.all([listLeads(), listApplications(), listWorkOrders()]);
  return (
    <div className="stack">
      <div>
        <h1>Desk</h1>
        <p className="lede">Properties, units, lead files, applications, leases, the rent ledger, and maintenance. Written policies on the record outrank scratch notes.</p>
      </div>
      <nav className="nav" aria-label="Desk sections">
        <Link href="/desk/properties">Properties</Link>
        <Link href="/desk/leads">Lead files</Link>
        <Link href="/desk/applications">Applications</Link>
        <Link href="/desk/leases">Leases</Link>
        <Link href="/desk/work-orders">Work orders</Link>
        <Link href="/desk/activity">Activity</Link>
      </nav>
      <div className="split">
        <section className="panel">
          <h2>Open applications</h2>
          <ul>
            {applications.filter((item) => item.status === "submitted").slice(0, 6).map((item) => (
              <li key={item.id}><Link href={`/desk/applications/${item.id}`}>{item.full_name}</Link> · {item.property_name} {item.unit_label}</li>
            ))}
          </ul>
          <h2>Recent lead files</h2>
          <ul>
            {leads.slice(0, 6).map((lead) => (
              <li key={lead.id}><Link href={`/desk/leads/${lead.id}`}>{lead.full_name}</Link> <StatusPill value={lead.status} /></li>
            ))}
          </ul>
        </section>
        <section className="panel">
          <h2>Work orders</h2>
          <ul>
            {work.slice(0, 8).map((order) => (
              <li key={order.id}>{order.property_name} {order.unit_label}: {order.title} <StatusPill value={order.status} /></li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
