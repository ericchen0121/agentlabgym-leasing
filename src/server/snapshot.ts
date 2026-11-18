import type {
  Application,
  Attendee,
  CalendarEvent,
  EnvMeta,
  Inquiry,
  Lead,
  Lease,
  LedgerEntry,
  Listing,
  Message,
  Note,
  Person,
  Persona,
  Property,
  Snapshot,
  Thread,
  Unit,
  WorkOrder,
} from "@/domain/types";
import { query, queryOne, txQuery } from "./db";
import type { PoolClient } from "pg";

const META_SQL = `SELECT seed, task_id, clock::text, company_name, agent_name, agent_email, timezone FROM env_state WHERE id = 1`;

async function readAll(runner: <T>(sql: string) => Promise<T[]>): Promise<Snapshot> {
  const metaRows = await runner<EnvMeta>(META_SQL);
  const meta = metaRows[0];
  if (!meta) throw new Error("Environment is not seeded.");
  const [
    properties,
    units,
    people,
    personas,
    leads,
    applications,
    leases,
    ledger,
    workOrders,
    notes,
    listings,
    inquiries,
    threads,
    messages,
    events,
    attendees,
  ] = await Promise.all([
    runner<Property>("SELECT * FROM properties ORDER BY id"),
    runner<Unit>("SELECT * FROM units ORDER BY id"),
    runner<Person>("SELECT * FROM people ORDER BY id"),
    runner<Persona>("SELECT * FROM personas ORDER BY id"),
    runner<Lead>("SELECT * FROM leads ORDER BY id"),
    runner<Application>("SELECT * FROM applications ORDER BY id"),
    runner<Lease>("SELECT * FROM leases ORDER BY id"),
    runner<LedgerEntry>("SELECT * FROM ledger_entries ORDER BY id"),
    runner<WorkOrder>("SELECT * FROM work_orders ORDER BY id"),
    runner<Note>("SELECT * FROM notes ORDER BY id"),
    runner<Listing>("SELECT * FROM listings ORDER BY id"),
    runner<Inquiry>("SELECT * FROM inquiries ORDER BY id"),
    runner<Thread>("SELECT * FROM threads ORDER BY id"),
    runner<Message>("SELECT * FROM messages ORDER BY id"),
    runner<CalendarEvent>("SELECT * FROM events ORDER BY id"),
    runner<Attendee>("SELECT * FROM attendees ORDER BY id"),
  ]);
  return {
    meta: {
      seed: Number(meta.seed),
      task_id: meta.task_id,
      clock: String(meta.clock).replace("T", " ").slice(0, 19),
      company_name: meta.company_name,
      agent_name: meta.agent_name,
      agent_email: meta.agent_email,
      timezone: meta.timezone,
    },
    properties,
    units,
    people,
    personas,
    leads,
    applications,
    leases,
    ledger,
    workOrders,
    notes,
    listings,
    inquiries,
    threads,
    messages,
    events,
    attendees,
  };
}

export async function readSnapshot(): Promise<Snapshot> {
  return readAll((sql) => query(sql));
}

export async function readSnapshotTx(client: PoolClient): Promise<Snapshot> {
  return readAll((sql) => txQuery(client, sql));
}

export async function readInitialSnapshot(): Promise<Snapshot | null> {
  const row = await queryOne<{ initial_snapshot: Snapshot | null }>(
    "SELECT initial_snapshot FROM env_state WHERE id = 1",
  );
  return row?.initial_snapshot ?? null;
}
