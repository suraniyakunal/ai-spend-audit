-- ═══════════════════════════════════════════════════════════
-- AI Spend Audit — Initial Schema
-- ═══════════════════════════════════════════════════════════

create table audits (
  id uuid primary key default gen_random_uuid(),
  input_json jsonb not null,
  result_json jsonb not null,
  created_at timestamptz default now()
);

create table leads (
  id uuid primary key default gen_random_uuid(),
  audit_id uuid references audits(id),
  email text not null,
  company_name text,
  role text,
  team_size integer,
  created_at timestamptz default now()
);

create index on leads(audit_id);
create index on leads(email);
