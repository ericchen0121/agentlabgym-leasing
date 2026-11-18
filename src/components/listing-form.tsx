import { Facts, Form, Select, Submit, TextArea, TextInput } from "@/components/ui";
import { centsToInput, formatDate, formatMoney } from "@/domain/format";
import type { ListingView, UnitView } from "@/server/read";

export function ListingForm({
  listing,
  units,
  unit,
}: {
  listing?: ListingView | null;
  units: UnitView[];
  unit?: UnitView | null;
}) {
  const source = unit;
  const returnTo = listing ? `/stoop/portal/listings/${listing.id}` : "/stoop/portal";
  return (
    <div className="split">
      <section className="panel">
        <Form op="save-listing" returnTo={returnTo}>
          {listing ? <input type="hidden" name="listing_id" value={listing.id} /> : null}
          <Select
            label="Unit"
            name="unit_id"
            value={listing?.unit_id || unit?.id}
            options={units.map((item) => ({ value: item.id, label: `${item.property_name} ${item.label}` }))}
          />
          <TextInput label="Listing title" name="title" defaultValue={listing?.title || (source ? `${source.property_name} ${source.label}` : "")} required />
          <div className="row">
            <TextInput label="Listing rent" name="rent" defaultValue={listing ? centsToInput(listing.rent_cents) : source ? centsToInput(source.rent_cents) : ""} required />
            <TextInput label="Beds" name="beds" defaultValue={listing?.beds ?? source?.beds ?? ""} required />
            <TextInput label="Baths" name="baths" defaultValue={listing?.baths ?? source?.baths ?? ""} required />
          </div>
          <TextArea label="Pet policy" name="pet_summary" defaultValue={listing?.pet_summary || ""} />
          <TextArea label="Description" name="description" defaultValue={listing?.description || source?.description || ""} />
          <Select
            label="Status"
            name="status"
            value={listing?.status || "draft"}
            options={[
              { value: "draft", label: "Draft" },
              { value: "published", label: "Published" },
              { value: "unlisted", label: "Unlisted" },
            ]}
          />
          <Submit>Save listing</Submit>
        </Form>
      </section>
      <aside className="panel">
        <h2>Unit record</h2>
        {source ? (
          <Facts
            items={[
              { label: "Source rent", value: formatMoney(source.rent_cents), testid: "source-rent" },
              { label: "Source beds", value: `${source.beds} / ${source.baths}`, testid: "source-beds" },
              { label: "Source pets", value: source.pet_policy?.summary || source.property_pet_policy.summary, testid: "source-pets" },
              { label: "Available", value: formatDate(source.available_on), testid: "source-available" },
              { label: "Unit status", value: source.status },
            ]}
          />
        ) : (
          <p className="muted">Choose a unit to see the written rent and pet policy.</p>
        )}
      </aside>
    </div>
  );
}
