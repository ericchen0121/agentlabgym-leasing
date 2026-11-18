import { Banner, Form, LABEL_OPTIONS, Submit, TextArea } from "@/components/ui";
import { formatWhen } from "@/domain/format";
import { listThread } from "@/server/read";
import Link from "next/link";
import { notFound } from "next/navigation";

export default async function ThreadPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { id } = await params;
  const query = await searchParams;
  const messages = await listThread(id);
  if (messages.length === 0) notFound();
  const latestInbound = [...messages].reverse().find((message) => message.direction === "inbound");
  const subject = messages[0].subject;
  const replySubject = subject.toLowerCase().startsWith("re:") ? subject : `Re: ${subject}`;
  return (
    <div className="stack">
      <Banner error={typeof query.error === "string" ? query.error : undefined} notice={typeof query.notice === "string" ? query.notice : undefined} />
      <p className="muted"><Link href="/mail">Postroom</Link></p>
      <h1>{subject}</h1>
      <div className="thread">
        {messages.map((message) => (
          <article key={message.id}>
            <header>
              <strong>{message.from_name}</strong>
              <span className="muted">{formatWhen(message.sent_at)} · {message.folder}</span>
            </header>
            <p className="muted">To {message.to_emails.join(", ")} {message.labels.length ? `· ${message.labels.join(", ")}` : ""}</p>
            <pre>{message.body}</pre>
            <Form op="set-folder" returnTo={`/mail/thread/${id}`} className="row">
              <input type="hidden" name="message_id" value={message.id} />
              <input type="hidden" name="folder" value="trash" />
              <Submit secondary>Move to trash</Submit>
            </Form>
          </article>
        ))}
      </div>
      <section className="panel">
        <h2>Reply</h2>
        <Form op="send-mail" returnTo={`/mail/thread/${id}`}>
          <input type="hidden" name="thread_id" value={id} />
          <input type="hidden" name="to" value={latestInbound?.from_email ?? ""} />
          <input type="hidden" name="subject" value={replySubject} />
          <p className="muted">To {latestInbound?.from_email ?? "the thread"}</p>
          <TextArea label="Reply" name="body" />
          <fieldset>
            <legend>Labels</legend>
            {LABEL_OPTIONS.map((label) => (
              <label key={label}>
                <input type="checkbox" name="labels" value={label} /> {label}
              </label>
            ))}
          </fieldset>
          <Submit>Send reply</Submit>
        </Form>
      </section>
    </div>
  );
}
