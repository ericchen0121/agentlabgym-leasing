import { Banner, Facts, Form, Select, Submit, TextArea, TextInput } from "@/components/ui";
import { centsToInput, formatDate, formatMoney, ledgerBalance } from "@/domain/format";
import { getLease, listLedger, listNotes } from "@/server/read";
import Link from "next/link";
import { notFound } from "next/navigation";

export default async function LeasePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { id } = await params;
  const query = await searchParams;
  const lease = await getLease(id);
  if (!lease) notFound();
  const [ledger, notes] = await Promise.all([listLedger(id), listNotes("lease", id)]);
  const balance = ledgerBalance(ledger);
  return (
    <div className="stack">
      <Banner error={typeof query.error === "string" ? query.error : undefined} notice={typeof query.notice === "string" ? query.notice : undefined} />
      <div>
        <p className="muted"><Link href="/desk/leases">Leases</Link></p>
        <h1>{lease.full_name}</h1>
        <p className="lede">{lease.property_name} unit {lease.unit_label} · {lease.email}</p>
      </div>
      <section className="panel stack">
        <Facts
          items={[
            { label: "In-place rent", value: formatMoney(lease.rent_cents), testid: "lease-rent" },
            { label: "Deposit", value: formatMoney(lease.deposit_cents) },
            { label: "Term", value: `${formatDate(lease.start_on)} – ${formatDate(lease.end_on)}` },
            { label: "Balance", value: formatMoney(balance), testid: "ledger-balance" },
          ]}
        />
        {lease.renewal_policy ? (
          <>
            <h2>Written renewal policy</h2>
            <p data-testid="renewal-policy">{lease.renewal_policy}</p>
          </>
        ) : null}
        <Form op="update-lease-rent" returnTo={`/desk/leases/${lease.id}`} className="row">
          <input type="hidden" name="lease_id" value={lease.id} />
          <TextInput label="In-place rent" name="rent" defaultValue={centsToInput(lease.rent_cents)} />
          <Submit secondary>Update in-place rent</Submit>
        </Form>
      </section>
      <section className="panel table-wrap">
        <h2>Rent ledger</h2>
        <table>
          <thead>
            <tr><th>Date</th><th>Kind</th><th>Amount</th><th>Memo</th></tr>
          </thead>
          <tbody>
            {ledger.map((entry) => (
              <tr key={entry.id}>
                <td>{formatDate(entry.posted_on)}</td>
                <td>{entry.kind}</td>
                <td>{formatMoney(entry.amount_cents)}</td>
                <td>{entry.memo}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <Form op="post-ledger" returnTo={`/desk/leases/${lease.id}`}>
          <input type="hidden" name="lease_id" value={lease.id} />
          <div className="row">
            <Select
              label="Kind"
              name="kind"
              options={[
                { value: "payment", label: "Payment" },
                { value: "charge", label: "Charge" },
                { value: "credit", label: "Credit" },
                { value: "fee", label: "Fee" },
              ]}
            />
            <TextInput label="Amount" name="amount" />
            <TextInput label="Posted on" name="posted_on" type="date" />
          </div>
          <TextInput label="Memo" name="memo" />
          <Submit>Post entry</Submit>
        </Form>
      </section>
      <section className="panel">
        <h2>Notes</h2>
        {notes.map((note) => <p key={note.id}>{note.body}</p>)}
        <Form op="save-note" returnTo={`/desk/leases/${lease.id}`}>
          <input type="hidden" name="entity_type" value="lease" />
          <input type="hidden" name="entity_id" value={lease.id} />
          <TextArea label="Note" name="body" />
          <Submit>Add note</Submit>
        </Form>
      </section>
    </div>
  );
}
