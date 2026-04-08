-- Relatórios de redes sociais compartilháveis via link público
CREATE TABLE IF NOT EXISTS client_social_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  token text NOT NULL UNIQUE,
  client_name text NOT NULL,
  handle text,
  platform text NOT NULL DEFAULT 'instagram',
  report_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  period_label text,
  period_start date,
  period_end date,
  access_password text,
  access_count integer NOT NULL DEFAULT 0,
  first_accessed_at timestamptz,
  last_accessed_at timestamptz,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_social_reports_token ON client_social_reports(token);

ALTER TABLE client_social_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "social_reports_public_read" ON client_social_reports
  FOR SELECT USING (is_active = true);

CREATE POLICY "social_reports_tenant_manage" ON client_social_reports
  FOR ALL USING (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()));
