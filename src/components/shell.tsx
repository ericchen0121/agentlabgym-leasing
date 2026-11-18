import { formatClock } from "@/domain/format";
import { getMeta } from "@/server/read";
import Link from "next/link";
import type { ReactNode } from "react";

const LINKS = [
  { href: "/desk", name: "Desk" },
  { href: "/stoop", name: "Stoop" },
  { href: "/mail", name: "Postroom" },
  { href: "/calendar", name: "Dayboard" },
];

export async function Shell({ children }: { children: ReactNode }) {
  const meta = await getMeta();
  return (
    <div className="shell">
      <header className="top">
        <Link href="/" className="brand">
          <span className="mark">L</span>
          <span>
            <strong>Larkspur</strong>
            <span>Residential workplace</span>
          </span>
        </Link>
        <nav className="nav" aria-label="Apps">
          {LINKS.map((link) => (
            <Link key={link.href} href={link.href}>
              {link.name}
            </Link>
          ))}
        </nav>
        <div className="who">
          <strong>{meta.agent_name}</strong>
          <span>{meta.agent_email}</span>
          <time data-testid="workplace-clock" dateTime={meta.clock}>
            {formatClock(meta.clock)} Pacific
          </time>
        </div>
      </header>
      <main>{children}</main>
    </div>
  );
}
