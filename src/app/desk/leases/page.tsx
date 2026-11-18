import { StatusPill } from "@/components/ui";
import { formatDate, formatMoney } from "@/domain/format";
import { listLeases } from "@/server/read";
import Link from "next/link";

export default async function LeasesPage() {
  const leases = await listLeases();
  return (
    <div className="stack">
      <h1>Leases</h1>
      <section className="panel table-wrap">
        <table>
          <thead>
            <tr><th>Resident</th><th>Unit</th><th>Rent</th><th>Start</th><th>End</th><th>Status</th></tr>
          </thead>
          <tbody>
            {leases.map((lease) => (
              <tr key={lease.id}>
                <td><Link href={`/desk/leases/${lease.id}`}>{lease.full_name}</Link></td>
                <td>{lease.property_name} {lease.unit_label}</td>
                <td>{formatMoney(lease.rent_cents)}</td>
                <td>{formatDate(lease.start_on)}</td>
                <td>{formatDate(lease.end_on)}</td>
                <td><StatusPill value={lease.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
