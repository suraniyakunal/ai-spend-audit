-- Migration: Create tables for AI Spend Audit MVP
-- Run this against your Supabase project

-- Audits table
CREATE TABLE IF NOT EXISTS audits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  input_json JSONB NOT NULL,
  result_json JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Leads table
CREATE TABLE IF NOT EXISTS leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  audit_id UUID REFERENCES audits(id) ON DELETE SET NULL,
  email TEXT NOT NULL,
  company_name TEXT,
  role TEXT,
  team_size INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_audits_created_at ON audits(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_leads_audit_id ON leads(audit_id);
CREATE INDEX IF NOT EXISTS idx_leads_email ON leads(email);

-- Row Level Security
ALTER TABLE audits ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

-- Allow anonymous inserts and selects on audits (public audit tool)
CREATE POLICY "Allow anonymous insert on audits"
  ON audits FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow anonymous select on audits"
  ON audits FOR SELECT
  USING (true);

-- Allow anonymous inserts on leads
CREATE POLICY "Allow anonymous insert on leads"
  ON leads FOR INSERT
  WITH CHECK (true);

-- Service role can do everything (used by API routes)
CREATE POLICY "Service role full access on audits"
  ON audits FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access on leads"
  ON leads FOR ALL
  USING (auth.role() = 'service_role');
