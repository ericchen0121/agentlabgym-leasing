import { Banner } from "@/components/ui";
import { listMessages } from "@/server/read";
import Link from "next/link";

const FOLDERS = ["inbox", "sent", "drafts", "trash"];

export default async function MailPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const folder = typeof params.folder === "string" ? params.folder : "inbox";
  const q = typeof params.q === "string" ? params.q : "";
  const label = typeof params.label === "string" ? params.label : "";
  const messages = await listMessages({ folder, q, label });
  const error = typeof params.error === "string" ? params.error : undefined;
  const notice = typeof params.notice === "string" ? params.notice : undefined;
  return (
    <div className="stack">
      <Banner error={error} notice={notice} />
      <div className="row">
        <div>
          <h1>Postroom</h1>
          <p className="lede">Mail for the desk. Search, label, and answer from here.</p>
        </div>
        <Link className="btn" href="/mail/compose">Compose</Link>
      </div>
      <nav className="nav" aria-label="Folders">
        {FOLDERS.map((item) => (
          <Link key={item} href={`/mail?folder=${item}`} aria-current={item === folder ? "page" : undefined}>{item}</Link>
        ))}
      </nav>
      <form className="row" action="/mail" method="get">
        <input type="hidden" name="folder" value={folder} />
        <label>
          <span>Search mail</span>
          <input name="q" defaultValue={q} data-testid="mail-search" />
        </label>
        <label>
          <span>Label</span>
          <input name="label" defaultValue={label} />
        </label>
        <button type="submit">Search</button>
      </form>
      <div className="mail">
        {messages.map((message) => (
          <Link key={message.id} className="item" href={`/mail/thread/${message.thread_id}`}>
            <strong>
              <span>{message.subject}</span>
              <span className="muted">{message.sent_at.slice(0, 16)}</span>
            </strong>
            <span>{message.from_name} · {message.from_email}</span>
            <span className="muted">{message.labels.join(", ")}</span>
          </Link>
        ))}
        {messages.length === 0 ? <p className="panel">Nothing in this folder.</p> : null}
      </div>
    </div>
  );
}
