import { Banner } from "@/components/ui";
import { ListingForm } from "@/components/listing-form";
import { getUnit, listUnits } from "@/server/read";

export default async function NewListingPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const query = await searchParams;
  const unitId = typeof query.unit === "string" ? query.unit : undefined;
  const [units, unit] = await Promise.all([listUnits(), unitId ? getUnit(unitId) : Promise.resolve(null)]);
  return (
    <div className="stack">
      <Banner error={typeof query.error === "string" ? query.error : undefined} />
      <h1>New listing</h1>
      <ListingForm units={units} unit={unit} />
    </div>
  );
}
