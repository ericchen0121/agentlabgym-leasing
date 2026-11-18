import { Banner, Form, LABEL_OPTIONS, TextArea, TextInput } from "@/components/ui";

export default async function ComposePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const query = await searchParams;
  const to = typeof query.to === "string" ? query.to : "";
  return (
    <div className="stack">
      <Banner error={typeof query.error === "string" ? query.error : undefined} notice={typeof query.notice === "string" ? query.notice : undefined} />
      <h1>Compose</h1>
      <section className="panel">
        <Form op="send-mail" returnTo="/mail?folder=sent">
          <TextInput label="To" name="to" defaultValue={to} type="email" required />
          <TextInput label="Subject" name="subject" required />
          <TextArea label="Message" name="body" required />
          <fieldset>
            <legend>Labels</legend>
            {LABEL_OPTIONS.map((label) => (
              <label key={label} className="row">
                <input type="checkbox" name="labels" value={label} /> {label}
              </label>
            ))}
          </fieldset>
          <div className="row">
            <button type="submit" name="mode" value="send">Send</button>
            <button type="submit" className="secondary" name="mode" value="draft">Save draft</button>
          </div>
        </Form>
      </section>
    </div>
  );
}
