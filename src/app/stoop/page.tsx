import { formatMoney } from "@/domain/format";
import { listListings } from "@/server/read";
import Link from "next/link";

export default async function StoopHome() {
  const listings = await listListings(true);
  return (
    <div className="stack">
      <div className="row">
        <div>
          <h1>Stoop</h1>
          <p className="lede">Rentals with the lights on. This is the public listings board for Cedarwick. Landlords edit them in the portal.</p>
        </div>
        <Link className="btn" href="/stoop/portal">Landlord portal</Link>
      </div>
      <div className="grid">
        {listings.map((listing) => (
          <Link key={listing.id} href={`/stoop/listings/${listing.id}`} className="card" data-testid={`public-listing-${listing.id}`}>
            <p className="muted">{listing.property_name}</p>
            <h2>{listing.title}</h2>
            <p>{formatMoney(listing.rent_cents)} / month</p>
            <p className="muted">{listing.beds} bd · {listing.baths} ba</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
