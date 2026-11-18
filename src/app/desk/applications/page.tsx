import { StatusPill } from "@/components/ui";
import { formatMoney } from "@/domain/format";
import { listApplications } from "@/server/read";
import Link from "next/link";

export default async function ApplicationsPage() {
  const applications = await listApplications();
  return (
    <div className="stack">
      <h1>Applications</h1>
      <section className="panel table-wrap">
        <table>
          <thead>
            <tr><th>Applicant</th><th>Unit</th><th>Income</th><th>Credit</th><th>History</th><th>Status</th></tr>
          </thead>
          <tbody>
            {applications.map((application) => (
              <tr key={application.id}>
                <td><Link href={`/desk/applications/${application.id}`}>{application.full_name}</Link></td>
                <td>{application.property_name} {application.unit_label}</td>
                <td>{formatMoney(application.monthly_income_cents)}</td>
                <td>{application.credit_band}</td>
                <td>{application.rental_history.replace(/_/g, " ")}</td>
                <td><StatusPill value={application.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
