"use client";

export default function ErrorPage({ error }: { error: Error }) {
  return (
    <section className="panel">
      <h1>The desk hit a snag</h1>
      <p role="alert">{error.message}</p>
    </section>
  );
}
