import { titleCaseStatus } from "@/domain/format";
import type { ReactNode } from "react";

export function Form({
  op,
  returnTo,
  children,
  className = "stack",
}: {
  op: string;
  returnTo: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <form action="/api/forms" method="post" className={className}>
      <input type="hidden" name="op" value={op} />
      <input type="hidden" name="return" value={returnTo} />
      {children}
    </form>
  );
}

export function TextInput({
  label,
  name,
  defaultValue,
  type = "text",
  required = false,
  testid,
}: {
  label: string;
  name: string;
  defaultValue?: string | number | null;
  type?: string;
  required?: boolean;
  testid?: string;
}) {
  return (
    <div className="field">
      <label htmlFor={name}>{label}</label>
      <input id={name} name={name} type={type} defaultValue={defaultValue ?? ""} required={required} data-testid={testid} />
    </div>
  );
}

export function TextArea({
  label,
  name,
  defaultValue,
  required = false,
  testid,
}: {
  label: string;
  name: string;
  defaultValue?: string;
  required?: boolean;
  testid?: string;
}) {
  return (
    <div className="field">
      <label htmlFor={name}>{label}</label>
      <textarea id={name} name={name} defaultValue={defaultValue ?? ""} required={required} data-testid={testid} />
    </div>
  );
}

export function Select({
  label,
  name,
  value,
  options,
  testid,
}: {
  label: string;
  name: string;
  value?: string | null;
  options: { value: string; label: string }[];
  testid?: string;
}) {
  return (
    <div className="field">
      <label htmlFor={name}>{label}</label>
      <select id={name} name={name} defaultValue={value ?? options[0]?.value} data-testid={testid}>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

export function Submit({ children, secondary = false }: { children: ReactNode; secondary?: boolean }) {
  return (
    <button type="submit" className={secondary ? "secondary" : undefined}>
      {children}
    </button>
  );
}

export function Banner({ error, notice }: { error?: string; notice?: string }) {
  if (error) return <p className="banner bad" role="alert">{error}</p>;
  if (notice) return <p className="banner good" role="status">{notice}</p>;
  return null;
}

export function Facts({ items }: { items: { label: string; value: ReactNode; testid?: string }[] }) {
  return (
    <dl className="facts">
      {items.map((item) => (
        <div key={item.label}>
          <dt>{item.label}</dt>
          <dd data-testid={item.testid}>{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}

export function Pill({ children, tone = "neutral" }: { children: ReactNode; tone?: "good" | "warn" | "bad" | "neutral" }) {
  return <span className={`pill tone-${tone}`}>{children}</span>;
}

export function StatusPill({ value }: { value: string }) {
  const good = ["published", "approved", "confirmed", "vacant", "active", "open", "paid"].includes(value);
  const bad = ["denied", "cancelled", "lost", "unlisted", "occupied"].includes(value);
  const warn = ["draft", "notice", "tentative", "submitted", "in_progress", "make_ready"].includes(value);
  const tone = good ? "good" : bad ? "bad" : warn ? "warn" : "neutral";
  return <Pill tone={tone}>{titleCaseStatus(value)}</Pill>;
}

export const LABEL_OPTIONS = ["inquiry", "showing", "application", "maintenance", "owner", "urgent", "persona"];

export function one(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}
