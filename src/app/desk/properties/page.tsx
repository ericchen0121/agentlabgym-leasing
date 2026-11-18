import { addressLine } from "@/domain/format";
import { listProperties } from "@/server/read";
import Link from "next/link";

export default async function PropertiesPage() {
  const properties = await listProperties();
  return (
    <div className="stack">
      <h1>Properties</h1>
      <div className="grid">
        {properties.map((property) => (
          <Link key={property.id} className="card" href={`/desk/properties/${property.id}`} data-testid={`property-${property.id}`}>
            <h2>{property.name}</h2>
            <p>{addressLine(property)}</p>
            <p className="muted">{property.unit_count} units · {property.property_type}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
