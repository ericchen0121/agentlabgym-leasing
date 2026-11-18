import { listInquiries } from "@/server/read";
import Link from "next/link";

export default async function InquiryInboxPage() {
  const inquiries = await listInquiries();
  return (
    <div className="stack">
      <h1>Inquiry inbox</h1>
      <p className="lede">Questions sent from public Stoop listings. Replies belong in Postroom.</p>
      <section className="panel stack">
        {inquiries.map((inquiry) => (
          <article key={inquiry.id}>
            <h2>{inquiry.listing_title}</h2>
            <p><strong>{inquiry.name}</strong> · {inquiry.email}</p>
            <p>{inquiry.message}</p>
            {inquiry.thread_id ? <Link href={`/mail/thread/${inquiry.thread_id}`}>Open in Postroom</Link> : null}
          </article>
        ))}
        {inquiries.length === 0 ? <p>No inquiries yet.</p> : null}
      </section>
    </div>
  );
}
