-- Larkspur leasing gym. All timestamps are workplace wall-clock times
-- (America/Los_Angeles) stored without a time zone.

CREATE TABLE IF NOT EXISTS env_state (
  id integer PRIMARY KEY CHECK (id = 1),
  seed integer NOT NULL,
  task_id text,
  clock timestamp NOT NULL,
  company_name text NOT NULL,
  agent_name text NOT NULL,
  agent_email text NOT NULL,
  timezone text NOT NULL,
  initial_snapshot jsonb
);

CREATE TABLE IF NOT EXISTS properties (
  id text PRIMARY KEY,
  name text NOT NULL,
  street text NOT NULL,
  city text NOT NULL,
  region text NOT NULL,
  postal_code text NOT NULL,
  property_type text NOT NULL,
  pet_policy jsonb NOT NULL,
  screening jsonb NOT NULL,
  renewal_policy text NOT NULL DEFAULT '',
  notes text NOT NULL DEFAULT '',
  seeded boolean NOT NULL DEFAULT true
);

CREATE TABLE IF NOT EXISTS units (
  id text PRIMARY KEY,
  property_id text NOT NULL REFERENCES properties (id),
  label text NOT NULL,
  beds numeric NOT NULL,
  baths numeric NOT NULL,
  sqft integer NOT NULL,
  rent_cents integer NOT NULL,
  deposit_cents integer NOT NULL,
  status text NOT NULL,
  available_on date,
  pet_policy jsonb,
  description text NOT NULL DEFAULT '',
  seeded boolean NOT NULL DEFAULT true
);

CREATE TABLE IF NOT EXISTS people (
  id text PRIMARY KEY,
  full_name text NOT NULL,
  email text NOT NULL,
  phone text NOT NULL DEFAULT '',
  role text NOT NULL,
  household_notes text NOT NULL DEFAULT '',
  seeded boolean NOT NULL DEFAULT true
);

CREATE TABLE IF NOT EXISTS personas (
  id text PRIMARY KEY,
  person_id text REFERENCES people (id),
  email text NOT NULL UNIQUE,
  style text NOT NULL,
  facts text NOT NULL,
  scripts jsonb NOT NULL,
  seeded boolean NOT NULL DEFAULT true
);

CREATE TABLE IF NOT EXISTS leads (
  id text PRIMARY KEY,
  person_id text NOT NULL REFERENCES people (id),
  property_id text REFERENCES properties (id),
  unit_id text REFERENCES units (id),
  source text NOT NULL,
  status text NOT NULL,
  desired_move_in date,
  beds_wanted integer,
  budget_cents integer,
  pets text NOT NULL DEFAULT '',
  toured_on date,
  seeded boolean NOT NULL DEFAULT true
);

CREATE TABLE IF NOT EXISTS applications (
  id text PRIMARY KEY,
  lead_id text REFERENCES leads (id),
  person_id text NOT NULL REFERENCES people (id),
  unit_id text NOT NULL REFERENCES units (id),
  status text NOT NULL,
  monthly_income_cents integer NOT NULL,
  credit_band text NOT NULL,
  rental_history text NOT NULL,
  household_size integer NOT NULL,
  employer text NOT NULL DEFAULT '',
  move_in_on date,
  decision_note text NOT NULL DEFAULT '',
  seeded boolean NOT NULL DEFAULT true
);

CREATE TABLE IF NOT EXISTS leases (
  id text PRIMARY KEY,
  unit_id text NOT NULL REFERENCES units (id),
  person_id text NOT NULL REFERENCES people (id),
  start_on date NOT NULL,
  end_on date NOT NULL,
  rent_cents integer NOT NULL,
  deposit_cents integer NOT NULL,
  status text NOT NULL,
  seeded boolean NOT NULL DEFAULT true
);

CREATE TABLE IF NOT EXISTS ledger_entries (
  id text PRIMARY KEY,
  lease_id text NOT NULL REFERENCES leases (id),
  posted_on date NOT NULL,
  kind text NOT NULL,
  amount_cents integer NOT NULL CHECK (amount_cents >= 0),
  memo text NOT NULL DEFAULT '',
  seeded boolean NOT NULL DEFAULT true
);

CREATE TABLE IF NOT EXISTS work_orders (
  id text PRIMARY KEY,
  unit_id text NOT NULL REFERENCES units (id),
  lease_id text REFERENCES leases (id),
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  priority text NOT NULL,
  status text NOT NULL,
  seeded boolean NOT NULL DEFAULT true
);

CREATE TABLE IF NOT EXISTS notes (
  id text PRIMARY KEY,
  entity_type text NOT NULL,
  entity_id text NOT NULL,
  author text NOT NULL,
  body text NOT NULL,
  created_at timestamp NOT NULL,
  seeded boolean NOT NULL DEFAULT true
);

CREATE TABLE IF NOT EXISTS listings (
  id text PRIMARY KEY,
  unit_id text NOT NULL REFERENCES units (id),
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  rent_cents integer NOT NULL,
  beds numeric NOT NULL,
  baths numeric NOT NULL,
  pet_summary text NOT NULL DEFAULT '',
  status text NOT NULL,
  seeded boolean NOT NULL DEFAULT true
);

CREATE TABLE IF NOT EXISTS inquiries (
  id text PRIMARY KEY,
  listing_id text NOT NULL REFERENCES listings (id),
  person_id text REFERENCES people (id),
  name text NOT NULL,
  email text NOT NULL,
  message text NOT NULL,
  status text NOT NULL,
  thread_id text,
  created_at timestamp NOT NULL,
  seeded boolean NOT NULL DEFAULT true
);

CREATE TABLE IF NOT EXISTS threads (
  id text PRIMARY KEY,
  subject text NOT NULL,
  seeded boolean NOT NULL DEFAULT true
);

CREATE TABLE IF NOT EXISTS messages (
  id text PRIMARY KEY,
  thread_id text NOT NULL REFERENCES threads (id),
  direction text NOT NULL,
  from_email text NOT NULL,
  from_name text NOT NULL,
  to_emails text[] NOT NULL,
  cc_emails text[] NOT NULL DEFAULT '{}',
  subject text NOT NULL,
  body text NOT NULL,
  folder text NOT NULL,
  labels text[] NOT NULL DEFAULT '{}',
  is_read boolean NOT NULL DEFAULT false,
  sent_at timestamp NOT NULL,
  seeded boolean NOT NULL DEFAULT true
);

CREATE TABLE IF NOT EXISTS events (
  id text PRIMARY KEY,
  title text NOT NULL,
  starts_at timestamp NOT NULL,
  ends_at timestamp NOT NULL,
  location text NOT NULL DEFAULT '',
  details text NOT NULL DEFAULT '',
  kind text NOT NULL,
  status text NOT NULL,
  unit_id text REFERENCES units (id),
  seeded boolean NOT NULL DEFAULT true
);

CREATE TABLE IF NOT EXISTS attendees (
  id text PRIMARY KEY,
  event_id text NOT NULL REFERENCES events (id) ON DELETE CASCADE,
  email text NOT NULL,
  name text NOT NULL DEFAULT '',
  response text NOT NULL DEFAULT 'invited',
  seeded boolean NOT NULL DEFAULT true
);

CREATE INDEX IF NOT EXISTS messages_folder_idx ON messages (folder, sent_at DESC);
CREATE INDEX IF NOT EXISTS messages_thread_idx ON messages (thread_id, sent_at);
CREATE INDEX IF NOT EXISTS notes_entity_idx ON notes (entity_type, entity_id, created_at DESC);
CREATE INDEX IF NOT EXISTS events_start_idx ON events (starts_at);
