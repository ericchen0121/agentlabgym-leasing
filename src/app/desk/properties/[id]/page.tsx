import { Facts, StatusPill } from "@/components/ui";
import { addressLine, formatMoney, formatPetPolicy } from "@/domain/format";
import { getProperty, listUnits } from "@/server/read";
import Link from "next/link";
import { notFound } from "next/navigation";

export default async function PropertyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const property = await getProperty(id);
  if (!property) notFound();
  const units = await listUnits(id);
  return (
    <div className="stack">
      <div>
        <p className="muted"><Link href="/desk/properties">Properties</Link></p>
        <h1>{property.name}</h1>
        <p className="lede">{addressLine(property)}</p>
      </div>
      <section className="panel">
        <Facts
          items={[
            { label: "Type", value: property.property_type },
            { label: "Written pet policy", value: formatPetPolicy(property.pet_policy) },
            { label: "Income multiple", value: `${property.screening.incomeMultiple}× rent` },
            { label: "Minimum credit", value: property.screening.minCredit },
          ]}
        />
        <h2>Written screening criteria</h2>
        <p>{property.screening.written}</p>
        {property.renewal_policy ? (
          <>
            <h2>Written renewal policy</h2>
            <p>{property.renewal_policy}</p>
          </>
        ) : null}
        {property.notes ? <p className="muted">{property.notes}</p> : null}
      </section>
      <section className="panel table-wrap">
        <h2>Units</h2>
        <table>
          <thead>
            <tr><th>Unit</th><th>Status</th><th>Beds</th><th>Rent</th><th>Available</th></tr>
          </thead>
          <tbody>
            {units.map((unit) => (
              <tr key={unit.id}>
                <td><Link href={`/desk/units/${unit.id}`}>{unit.label}</Link></td>
                <td><StatusPill value={unit.status} /></td>
                <td>{unit.beds} / {unit.baths}</td>
                <td>{formatMoney(unit.rent_cents)}</td>
                <td>{unit.available_on ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
