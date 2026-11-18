import type { PetPolicy } from "./types";

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export const WORKPLACE_CLOCK = "2026-04-15 08:00:00";
export const WORKPLACE_TIMEZONE = "America/Los_Angeles";

export function formatMoney(cents: number): string {
  const sign = cents < 0 ? "-" : "";
  const abs = Math.abs(Math.round(cents));
  const dollars = Math.floor(abs / 100);
  const rem = abs % 100;
  return `${sign}$${dollars.toLocaleString("en-US")}.${rem.toString().padStart(2, "0")}`;
}

export function dollarsToCents(input: string): number {
  const cleaned = input.trim().replace(/\$/g, "").replace(/,/g, "");
  const match = cleaned.match(/^(\d+)(?:\.(\d{1,2}))?$/);
  if (!match) throw new Error("Enter an amount like 1640 or 1640.00.");
  const cents = Number(match[1]) * 100 + Number((match[2] ?? "").padEnd(2, "0"));
  if (!Number.isSafeInteger(cents)) throw new Error("Amount is too large.");
  return cents;
}

export function centsToInput(cents: number): string {
  return (cents / 100).toFixed(2);
}

export function wallClock(value: string | null | undefined): string {
  if (!value) return "";
  const match = value.match(/^(\d{4}-\d{2}-\d{2})[T ](\d{2}:\d{2})/);
  if (!match) return value;
  return `${match[1]}T${match[2]}`;
}

export function asTimestamp(value: string): string {
  const normalized = value.trim().replace("T", " ");
  if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/.test(normalized)) return `${normalized}:00`;
  if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}/.test(normalized)) return normalized.slice(0, 19);
  throw new Error("Enter a date and time.");
}

export function asDate(value: string): string {
  const match = value.trim().match(/^(\d{4}-\d{2}-\d{2})/);
  if (!match) throw new Error("Enter a date.");
  return match[1];
}

export function formatClock(value: string): string {
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})/);
  if (!match) return value;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const hour = Number(match[4]);
  const minute = match[5];
  const utc = new Date(Date.UTC(year, month - 1, day));
  const h12 = hour % 12 || 12;
  const suffix = hour >= 12 ? "PM" : "AM";
  return `${DAYS[utc.getUTCDay()]}, ${MONTHS[month - 1]} ${day}, ${year}, ${h12}:${minute} ${suffix}`;
}

export function formatDate(value: string | null | undefined): string {
  if (!value) return "—";
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!match) return value;
  const month = Number(match[2]);
  const day = Number(match[3]);
  return `${MONTHS[month - 1]} ${day}, ${match[1]}`;
}

export function formatWhen(value: string): string {
  const wall = wallClock(value);
  if (!wall) return value;
  const [date, time] = wall.split("T");
  return `${formatDate(date)} ${formatTime(time)}`;
}

export function formatTime(hhmm: string): string {
  const match = hhmm.match(/^(\d{2}):(\d{2})/);
  if (!match) return hhmm;
  const hour = Number(match[1]);
  const h12 = hour % 12 || 12;
  const suffix = hour >= 12 ? "PM" : "AM";
  return `${h12}:${match[2]} ${suffix}`;
}

export function formatPetPolicy(policy: PetPolicy | null | undefined): string {
  if (!policy) return "No written pet policy.";
  return policy.summary;
}

export function addressLine(parts: {
  street: string;
  city: string;
  region: string;
  postal_code: string;
}): string {
  return `${parts.street}, ${parts.city}, ${parts.region} ${parts.postal_code}`;
}

export function requiredIncomeCents(rentCents: number, multiple: number): number {
  return Math.round(rentCents * multiple);
}

export function renewalRentCents(currentCents: number, increase = 0.04): number {
  const raw = currentCents * (1 + increase);
  return Math.round(raw / 500) * 500;
}

export function ledgerBalance(entries: { kind: string; amount_cents: number }[]): number {
  return entries.reduce((sum, entry) => {
    if (entry.kind === "charge" || entry.kind === "fee") return sum + entry.amount_cents;
    if (entry.kind === "payment" || entry.kind === "credit") return sum - entry.amount_cents;
    return sum;
  }, 0);
}

export function titleCaseStatus(value: string): string {
  return value.replace(/_/g, " ");
}
