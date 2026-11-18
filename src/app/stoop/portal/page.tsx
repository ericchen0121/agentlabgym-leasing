import { StatusPill } from "@/components/ui";
import { formatMoney } from "@/domain/format";
import { listListings } from "@/server/read";
import Link from "next/link";

export default async function PortalPage() {
  const listings = await listListings(false);
  return (
    <div className="stack">
      <div className="row">
        <div>
          <h1>Stoop portal</h1>
          <p className="lede">Create, correct, and publish listings. The unit record is the source for rent and pets.</p>
        </div>
        <Link className="btn" href="/stoop/portal/listings/new">New listing</Link>
        <Link className="btn secondary" href="/stoop/inbox">Inquiry inbox</Link>
      </div>
      <section className="panel table-wrap">
        <table>
          <thead>
            <tr><th>Listing</th><th>Unit</th><th>Rent</th><th>Status</th></tr>
          </thead>
          <tbody>
            {listings.map((listing) => (
              <tr key={listing.id}>
                <td><Link href={`/stoop/portal/listings/${listing.id}`}>{listing.title}</Link></td>
                <td>{listing.property_name} {listing.unit_label}</td>
                <td>{formatMoney(listing.rent_cents)}</td>
                <td><StatusPill value={listing.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
