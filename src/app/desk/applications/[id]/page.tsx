import { Banner, Facts, Form, Select, StatusPill, Submit, TextArea } from "@/components/ui";
import { formatMoney, requiredIncomeCents } from "@/domain/format";
import { getApplication } from "@/server/read";
import Link from "next/link";
import { notFound } from "next/navigation";

export default async function ApplicationPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { id } = await params;
  const query = await searchParams;
  const application = await getApplication(id);
  if (!application) notFound();
  const required = requiredIncomeCents(application.rent_cents, application.screening.incomeMultiple);
  const ratio = (application.monthly_income_cents / application.rent_cents).toFixed(2);
  return (
    <div className="stack">
      <Banner error={typeof query.error === "string" ? query.error : undefined} notice={typeof query.notice === "string" ? query.notice : undefined} />
      <div>
        <p className="muted"><Link href="/desk/applications">Applications</Link></p>
        <h1>{application.full_name}</h1>
        <p className="lede">{application.property_name} unit {application.unit_label} · <StatusPill value={application.status} /></p>
      </div>
      <section className="panel stack">
        <h2>Written screening criteria</h2>
        <p>{application.screening.written}</p>
        <Facts
          items={[
            { label: "Unit rent", value: formatMoney(application.rent_cents) },
            { label: "Stated monthly income", value: formatMoney(application.monthly_income_cents), testid: "stated-income" },
            { label: "Required monthly income", value: formatMoney(required), testid: "required-income" },
            { label: "Income ÷ rent", value: ratio },
            { label: "Credit band", value: application.credit_band },
            { label: "Minimum credit", value: application.screening.minCredit },
            { label: "Rental history", value: application.rental_history.replace(/_/g, " ") },
            { label: "Eviction policy", value: application.screening.eviction },
            { label: "Household size", value: application.household_size },
            { label: "Household notes (not a criterion)", value: application.household_notes || "—" },
            { label: "Employer", value: application.employer || "—" },
          ]}
        />
        {application.decision_note ? <p data-testid="decision-note">{application.decision_note}</p> : null}
        {application.status === "submitted" ? (
          <Form op="decide-application" returnTo={`/desk/applications/${application.id}`}>
            <input type="hidden" name="application_id" value={application.id} />
            <Select
              label="Decision"
              name="status"
              value="approved"
              options={[
                { value: "approved", label: "Approve" },
                { value: "denied", label: "Deny" },
              ]}
            />
            <TextArea label="Decision note" name="decision_note" />
            <Submit>Save decision</Submit>
          </Form>
        ) : null}
      </section>
    </div>
  );
}
