import { Banner, Facts, Form, Submit, TextArea, TextInput } from "@/components/ui";
import { formatDate, formatMoney } from "@/domain/format";
import { getListing } from "@/server/read";
import Link from "next/link";
import { notFound } from "next/navigation";

export default async function PublicListingPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { id } = await params;
  const query = await searchParams;
  const listing = await getListing(id);
  if (!listing || listing.status !== "published") notFound();
  return (
    <div className="stack">
      <Banner
        error={typeof query.error === "string" ? query.error : undefined}
        notice={typeof query.notice === "string" ? query.notice : undefined}
      />
      <p className="muted"><Link href="/stoop">Stoop</Link> · public listing</p>
      <h1>{listing.title}</h1>
      <section className="panel stack">
        <Facts
          items={[
            { label: "Rent", value: `${formatMoney(listing.rent_cents)} / month` },
            { label: "Home", value: `${listing.property_name} unit ${listing.unit_label}` },
            { label: "Size", value: `${listing.beds} bd / ${listing.baths} ba` },
            { label: "Available", value: formatDate(listing.available_on) },
            { label: "Pets", value: listing.pet_summary || "Ask the landlord" },
          ]}
        />
        <p className="prose">{listing.description}</p>
      </section>
      <section className="panel">
        <h2>Ask the landlord</h2>
        <Form op="public-inquiry" returnTo={`/stoop/listings/${listing.id}`}>
          <input type="hidden" name="listing_id" value={listing.id} />
          <TextInput label="Name" name="name" required />
          <TextInput label="Email" name="email" type="email" required />
          <TextArea label="Message" name="message" required />
          <Submit>Send inquiry</Submit>
        </Form>
      </section>
    </div>
  );
}
