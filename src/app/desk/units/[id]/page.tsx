import { Banner, Facts, Form, StatusPill, Submit, TextArea } from "@/components/ui";
import { formatDate, formatMoney, formatPetPolicy } from "@/domain/format";
import { getUnit, listLeases, listNotes, listWorkOrders } from "@/server/read";
import Link from "next/link";
import { notFound } from "next/navigation";

export default async function UnitPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { id } = await params;
  const query = await searchParams;
  const unit = await getUnit(id);
  if (!unit) notFound();
  const [notes, leases, work] = await Promise.all([
    listNotes("unit", id),
    listLeases(),
    listWorkOrders(),
  ]);
  const policy = unit.pet_policy ?? unit.property_pet_policy;
  const error = typeof query.error === "string" ? query.error : undefined;
  const notice = typeof query.notice === "string" ? query.notice : undefined;
  return (
    <div className="stack">
      <Banner error={error} notice={notice} />
      <div>
        <p className="muted"><Link href={`/desk/properties/${unit.property_id}`}>{unit.property_name}</Link></p>
        <h1>Unit {unit.label}</h1>
      </div>
      <section className="panel">
        <Facts
          items={[
            { label: "Status", value: <StatusPill value={unit.status} /> },
            { label: "Rent", value: formatMoney(unit.rent_cents), testid: "unit-rent" },
            { label: "Deposit", value: formatMoney(unit.deposit_cents) },
            { label: "Size", value: `${unit.beds} bd / ${unit.baths} ba · ${unit.sqft} sqft` },
            { label: "Available", value: formatDate(unit.available_on), testid: "unit-available" },
            { label: "Written pet policy", value: formatPetPolicy(policy), testid: "unit-pet-policy" },
          ]}
        />
        {unit.description ? <p>{unit.description}</p> : null}
        <p className="row">
          <Link className="btn" href={`/stoop/portal/listings/new?unit=${unit.id}`}>Create Stoop listing</Link>
          <Link className="btn secondary" href={`/desk/work-orders/new?unit=${unit.id}`}>New work order</Link>
        </p>
      </section>
      <div className="split">
        <section className="panel">
          <h2>Leases</h2>
          <ul>
            {leases.filter((lease) => lease.unit_id === unit.id).map((lease) => (
              <li key={lease.id}><Link href={`/desk/leases/${lease.id}`}>{lease.full_name}</Link> · {formatMoney(lease.rent_cents)} · {lease.status}</li>
            ))}
          </ul>
          <h2>Work orders</h2>
          <ul>
            {work.filter((order) => order.unit_id === unit.id).map((order) => (
              <li key={order.id}>{order.title} <StatusPill value={order.status} /></li>
            ))}
          </ul>
        </section>
        <section className="panel">
          <h2>Notes</h2>
          {notes.map((note) => (
            <article key={note.id}>
              <p className="muted">{note.author}</p>
              <p>{note.body}</p>
            </article>
          ))}
          <Form op="save-note" returnTo={`/desk/units/${unit.id}`}>
            <input type="hidden" name="entity_type" value="unit" />
            <input type="hidden" name="entity_id" value={unit.id} />
            <TextArea label="Note" name="body" />
            <Submit>Add note</Submit>
          </Form>
        </section>
      </div>
    </div>
  );
}
