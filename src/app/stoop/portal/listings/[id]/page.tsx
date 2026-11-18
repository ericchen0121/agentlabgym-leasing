import { Banner } from "@/components/ui";
import { ListingForm } from "@/components/listing-form";
import { getListing, getUnit, listUnits } from "@/server/read";
import { notFound } from "next/navigation";

export default async function EditListingPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { id } = await params;
  const query = await searchParams;
  const listing = await getListing(id);
  if (!listing) notFound();
  const [units, unit] = await Promise.all([listUnits(), getUnit(listing.unit_id)]);
  return (
    <div className="stack">
      <Banner error={typeof query.error === "string" ? query.error : undefined} notice={typeof query.notice === "string" ? query.notice : undefined} />
      <h1>Edit listing</h1>
      <ListingForm listing={listing} units={units} unit={unit} />
    </div>
  );
}
